/**
 * routes/incidents.js
 *
 * Route ordering matters here!
 * Express matches routes top-to-bottom.
 * /nearby and /heatmap MUST be defined BEFORE /:id
 * Otherwise Express would try to match "nearby" as an ObjectId and fail.
 *
 * Middleware chain pattern:
 *   requireAuth       — verify JWT, attach req.user
 *   requireAdmin      — verify req.user.role === 'admin' (admin-only routes)
 *   controller fn     — handle the request
 */

const express    = require('express');
const router     = express.Router();
const { requireAuth }  = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');
const upload           = require('../middleware/uploadMiddleware');
const {
  createIncident,
  getIncidents,
  getNearbyIncidents,
  getHeatmapData,
  getIncidentById,
  updateIncidentStatus,
  deleteIncident,
} = require('../controllers/incidentController');

// POST   /api/incidents            — create (authenticated, multipart/form-data)
// upload.single('photo') runs before createIncident:
//   • streams the file to GridFS, sets req.file
//   • text fields (title, description, etc.) remain in req.body
//   • if no file sent, req.file is undefined — that's fine (photo is optional)
router.post('/', requireAuth, upload.single('photo'), createIncident);

// GET    /api/incidents            — list with filters + pagination
router.get('/', requireAuth, getIncidents);

// GET    /api/incidents/nearby     — MUST come before /:id
router.get('/nearby', requireAuth, getNearbyIncidents);

// GET    /api/incidents/heatmap    — MUST come before /:id
router.get('/heatmap', requireAuth, getHeatmapData);

// GET    /api/incidents/:id
router.get('/:id', requireAuth, getIncidentById);

// PATCH  /api/incidents/:id/status — admin only
router.patch('/:id/status', requireAuth, requireAdmin, updateIncidentStatus);

// DELETE /api/incidents/:id        — admin only
router.delete('/:id', requireAuth, requireAdmin, deleteIncident);

module.exports = router;
