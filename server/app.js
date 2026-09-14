/**
 * app.js — Express application factory
 *
 * Exports a configured Express `app` that can be imported by:
 *   • server.js  (to create the HTTP server)
 *   • Jest tests (without actually listening on a port)
 *
 * Security middleware order:
 *   1. helmet()              — secure HTTP headers
 *   2. cors()                — restrict allowed origins
 *   3. mongoSanitize()       — strip $ and . from req.body to block NoSQL injection
 *   4. express.json()        — parse JSON bodies (with size limit)
 *   5. globalLimiter         — rate limit all API calls
 *   6. authLimiter           — stricter rate limit on login/register
 *   7. Routes                — application logic
 *   8. errorMiddleware       — catch-all error handler LAST
 */

const express        = require('express');
const cors           = require('cors');
const helmet         = require('helmet');
const rateLimit      = require('express-rate-limit');
const errorMiddleware = require('./middleware/errorMiddleware');

// ── Inline NoSQL injection sanitizer ─────────────────────────────────────────
// express-mongo-sanitize v2.2 crashes on modern Node (req.query is read-only).
// This lightweight inline version strips MongoDB operator keys ($gt, $where etc.)
// from req.body only — the only mutable, user-controlled JSON surface.
const sanitizeBody = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    const stripDollar = (obj) => {
      if (Array.isArray(obj)) return obj.map(stripDollar);
      if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
          if (!key.startsWith('$')) acc[key] = stripDollar(obj[key]);
          return acc;
        }, {});
      }
      return obj;
    };
    req.body = stripDollar(req.body);
  }
  next();
};

// ── Route imports ─────────────────────────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const incidentRoutes     = require('./routes/incidents');
const notificationRoutes = require('./routes/notifications');
const adminRoutes        = require('./routes/admin');
const digestRoutes       = require('./routes/digest');
const fileRoutes         = require('./routes/files');
// ─────────────────────────────────────────────────────────────────────────────

const app = express();

// ── 1. Security headers ───────────────────────────────────────────────────────
app.use(helmet());

// ── 2. CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow server-to-server (no origin) and listed origins
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// ── 3. Body parsers (with size limits) ───────────────────────────────────────
app.use(express.json({ limit: '10kb' }));           // Reject huge JSON payloads
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── 4. NoSQL injection sanitization (runs AFTER body parser) ─────────────────
// Strips MongoDB operator keys ($gt, $where etc.) from parsed req.body
app.use(sanitizeBody);

// ── 5. Global API rate limiter ────────────────────────────────────────────────
// 200 requests per 15 minutes per IP across all routes
// Disabled in test environment so Jest integration tests are not throttled
const globalLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,  // 15 minutes
  max:              process.env.NODE_ENV === 'test' ? 10000 : 200,
  standardHeaders:  true,
  legacyHeaders:    false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', globalLimiter);

// ── 6. Stricter rate limit on auth routes (brute-force protection) ────────────
// 20 attempts per 15 minutes per IP on login/register
const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              process.env.NODE_ENV === 'test' ? 10000 : 20,
  standardHeaders:  true,
  legacyHeaders:    false,
  message: { success: false, message: 'Too many login attempts, please try again in 15 minutes.' },
});

// ── Health check (no auth — useful for Render/deployment health probes) ───────
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Safe Street API is running' });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          authLimiter, authRoutes);   // rate-limited tighter
app.use('/api/incidents',     incidentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/digest',        digestRoutes);
app.use('/api/files',         fileRoutes);

// ── Centralized error handler (must be last) ─────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
