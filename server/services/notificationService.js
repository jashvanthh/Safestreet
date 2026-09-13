/**
 * services/notificationService.js
 *
 * Socket.IO initialization + proximity notification logic.
 *
 * ─── HOW SOCKET.IO WORKS (explain this in your viva) ────────────────────────
 *
 * 1. SERVER SETUP:
 *    new Server(httpServer) attaches Socket.IO to the same HTTP server as Express.
 *    They share port 5001 — Socket.IO uses a special "/socket.io" URL path.
 *
 * 2. AUTHENTICATION (io.use middleware):
 *    Before any connection is established, the socket middleware runs.
 *    It reads socket.handshake.auth.token (sent by the client).
 *    We verify the JWT and attach the user to the socket object.
 *    If invalid → next(new Error()) rejects the connection.
 *
 * 3. ROOMS:
 *    socket.join(userId) puts this socket into a named "room".
 *    Rooms let us broadcast to a specific user: io.to(userId).emit(...)
 *    One user can have multiple sockets (multiple browser tabs) — rooms handle this.
 *
 * 4. PROXIMITY ALGORITHM:
 *    When an incident is created:
 *      a) Find all users with notificationLocation set (not default [0,0])
 *         within a 50km bounding radius (max possible notificationRadius)
 *      b) Filter: keep only users for whom the incident is within THEIR radius
 *         (each user has their own notificationRadius preference)
 *      c) For each matched user:
 *         - Create a Notification document in MongoDB (persistent — survives offline)
 *         - io.to(userId).emit('notification:new', data) (real-time — if online)
 *
 * 5. WHY BOTH DB + SOCKET?
 *    Socket is ephemeral — if user is offline, the emit is lost.
 *    MongoDB stores it permanently so offline users see it on next login.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { Server }   = require('socket.io');
const jwt          = require('jsonwebtoken');
const User         = require('../models/User');
const Notification = require('../models/Notification');
const { findUsersNear } = require('./geoService');

let io = null;  // Module-level Socket.IO instance — initialized once in startServer()

// ── Haversine distance formula ──────────────────────────────────────────────
// Calculates the great-circle distance between two GPS points in km.
// Used to check whether an incident is within a user's individual radius.
//
// Formula: a = sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlng/2)
//          distance = 2R·arctan2(√a, √(1−a))   where R = 6371km
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R   = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── Initialize Socket.IO ─────────────────────────────────────────────────────
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin:      process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
  });

  // ── Auth middleware for Socket.IO ─────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select('-passwordHash');
      if (!user) return next(new Error('User not found'));

      // Attach user to socket so we can access it in connection handlers
      socket.userId = user._id.toString();
      socket.user   = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ── Connection handler ────────────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`🔌 ${socket.user.name} connected (socket: ${socket.id})`);

    // Join a private room named by userId.
    // This allows: io.to(userId).emit(...) to target just this user.
    // A user with 3 browser tabs = 3 sockets, all in the same room.
    socket.join(socket.userId);

    socket.on('disconnect', (reason) => {
      console.log(`🔌 ${socket.user.name} disconnected (${reason})`);
    });
  });

  console.log('✅ Socket.IO initialized');
  return io;
};

// ── Notify users near a new incident ────────────────────────────────────────
const notifyNearbyUsers = async (incident) => {
  if (!io) return;  // Socket.IO not ready (shouldn't happen in normal flow)

  const [lng, lat] = incident.location.coordinates;  // GeoJSON [lng, lat]

  // Step 1: Find all users with any notificationLocation within 50km
  // (50km = max possible notificationRadius, so no user can be missed)
  let candidateUsers;
  try {
    candidateUsers = await findUsersNear(lng, lat, 50);
  } catch {
    return;  // Geospatial query failed — non-fatal, don't crash the request
  }

  // Step 2: Filter by each user's individual notificationRadius
  const usersToNotify = candidateUsers.filter((u) => {
    const [uLng, uLat] = u.notificationLocation?.coordinates || [0, 0];
    // Skip users with default [0,0] location (not set yet)
    if (uLng === 0 && uLat === 0) return false;
    const dist = haversineKm(lat, lng, uLat, uLng);
    return dist <= u.notificationRadius;
  });

  // Step 3: For each matched user — create DB record + socket emit
  for (const user of usersToNotify) {
    try {
      const notification = await Notification.create({
        recipient: user._id,
        incident:  incident._id,
        message:   `New incident nearby: "${incident.title}"`,
      });

      // Emit to the user's room — reaches all their connected tabs
      io.to(user._id.toString()).emit('notification:new', {
        _id:      notification._id,
        message:  notification.message,
        isRead:   false,
        incident: {
          _id:      incident._id,
          title:    incident.title,
          category: incident.category,
        },
        createdAt: notification.createdAt,
      });

    } catch (err) {
      console.error(`Failed to notify user ${user._id}:`, err.message);
      // Continue to next user even if one fails
    }
  }

  if (usersToNotify.length > 0) {
    console.log(`📣 Notified ${usersToNotify.length} user(s) about: "${incident.title}"`);
  }
};

module.exports = { initSocket, notifyNearbyUsers };
