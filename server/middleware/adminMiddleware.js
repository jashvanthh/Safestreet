/**
 * middleware/adminMiddleware.js
 *
 * Must be used AFTER requireAuth (which sets req.user).
 * Checks req.user.role === 'admin' — the role is read from the DB-fetched
 * user object, not from the JWT payload directly.
 *
 * Built in Phase 7.
 */

// STUB — implemented in Phase 7
const requireAdmin = (req, res, next) => {
  next(new Error('adminMiddleware not yet implemented'));
};

module.exports = { requireAdmin };
