/**
 * routes/admin.js
 *
 * ALL routes here require: requireAuth → requireAdmin
 * The order matters: requireAuth first (verify token), then requireAdmin (verify role).
 *
 * Incident status updates (PATCH /:id/status) live in routes/incidents.js
 * because they share the same /:id namespace with GET/DELETE incident routes.
 *
 * This router only handles admin-specific views:
 *   GET  /api/admin/stats      — aggregated dashboard metrics
 *   GET  /api/admin/incidents  — full incident list (no anonymous stripping)
 */

const express  = require('express');
const router   = express.Router();
const { requireAuth }  = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');
const { getStats, getAdminIncidents } = require('../controllers/adminController');

// Apply auth + admin guard to ALL routes in this router
// Instead of repeating on each route, use router.use()
router.use(requireAuth, requireAdmin);

router.get('/stats',     getStats);
router.get('/incidents', getAdminIncidents);

module.exports = router;
