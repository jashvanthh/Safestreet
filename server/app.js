/**
 * app.js — Express application factory
 *
 * Exports a configured Express `app` that can be imported by:
 *   • server.js  (to create the HTTP server)
 *   • Jest tests (without actually listening on a port)
 *
 * Middleware order matters:
 *   1. helmet()         — security headers first
 *   2. cors()           — allow the frontend origin
 *   3. express.json()   — parse JSON bodies
 *   4. Routes           — application logic
 *   5. errorMiddleware  — catch-all error handler LAST
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const errorMiddleware = require('./middleware/errorMiddleware');

// ── Route imports (uncommented as each phase is built) ───────────────────────
const authRoutes = require('./routes/auth');
// const incidentRoutes   = require('./routes/incidents');
// const notificationRoutes = require('./routes/notifications');
// const adminRoutes      = require('./routes/admin');
// const digestRoutes     = require('./routes/digest');
// const fileRoutes       = require('./routes/files');
// ─────────────────────────────────────────────────────────────────────────────

const app = express();

// ── Security middleware ───────────────────────────────────────────────────────
app.use(helmet());                        // Sets secure HTTP headers

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,                    // Allow cookies if needed later
  })
);

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json());                  // Parse application/json
app.use(express.urlencoded({ extended: true })); // Parse form data

// ── Health check (no auth — useful for deployment checks) ───────────────────
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Safe Street API is running' });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
// app.use('/api/incidents',      incidentRoutes);
// app.use('/api/notifications',  notificationRoutes);
// app.use('/api/admin',          adminRoutes);
// app.use('/api/digest',         digestRoutes);
// app.use('/api/files',          fileRoutes);

// ── Centralized error handler (must be last) ─────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
