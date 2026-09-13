/**
 * server.js — Entry point
 *
 * Why separate server.js from app.js?
 *   app.js exports the configured Express application (middleware, routes).
 *   server.js is responsible only for:
 *     1. Loading env vars
 *     2. Connecting to MongoDB
 *     3. Creating the HTTP server
 *     4. Attaching Socket.IO
 *     5. Starting the listener on PORT
 *
 *   This separation means app.js can be imported by Jest/Supertest in tests
 *   WITHOUT actually binding to a port or connecting to a real database.
 */

require('dotenv').config();            // Load .env before anything else
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']); // Fix querySrv ESERVFAIL with Atlas on Windows
const http = require('http');
const connectDB = require('./config/db');
const { initGridFS } = require('./services/gridfsService');
const app = require('./app');

// ── Phase 8: Socket.IO ────────────────────────────────────────────────────────────
const { initSocket } = require('./services/notificationService');
// ── Phase 10: Weekly Digest Cron ──────────────────────────────────────────────────
const { startDigestJob } = require('./jobs/weeklyDigestJob');
// ──────────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();     // Fail fast if DB is unreachable
  initGridFS();          // Must run AFTER connectDB — needs mongoose.connection.db

  const httpServer = http.createServer(app);
  // initSocket attaches Socket.IO to the SAME httpServer as Express.
  // They share port 5001. Socket.IO intercepts requests to /socket.io/*
  initSocket(httpServer);

  // Initialize weekly safety digest cron job (Phase 10)
  startDigestJob();

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
