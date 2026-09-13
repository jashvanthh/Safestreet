/**
 * middleware/authMiddleware.js
 *
 * Verifies the JWT from the Authorization header and attaches
 * the authenticated user's data to req.user.
 *
 * Expected header: Authorization: Bearer <token>
 *
 * IMPORTANT: The token payload contains { id, role }, but we always
 * re-fetch the user from the DB to ensure the role hasn't been tampered
 * with and the user still exists. Never trust role from the token alone.
 *
 * Built in Phase 2.
 */

// STUB — implemented in Phase 2
const requireAuth = (req, res, next) => {
  next(new Error('authMiddleware not yet implemented'));
};

module.exports = { requireAuth };
