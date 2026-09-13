/**
 * middleware/adminMiddleware.js
 *
 * Must be chained AFTER requireAuth in a route definition:
 *   router.patch('/:id/status', requireAuth, requireAdmin, updateStatus)
 *
 * By the time requireAdmin runs, req.user is already populated by requireAuth.
 * We check req.user.role against the DB-fetched user — not a client header.
 *
 * If a non-admin calls an admin route they get 403 Forbidden (not 401).
 *   401 = "I don't know who you are" (no/bad token)
 *   403 = "I know who you are, but you don't have permission"
 *
 * Built and used in Phase 7.
 */

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  const error = new Error('Access denied. Admin privileges required.');
  error.statusCode = 403;
  next(error);
};

module.exports = { requireAdmin };
