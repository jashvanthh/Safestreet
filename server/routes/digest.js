/**
 * routes/digest.js
 *
 * Weekly Safety Digest API routes (Phase 10).
 * All routes require authentication.
 */

const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { getLatest, generateOnDemand } = require('../controllers/digestController');

// GET  /api/digest/latest   — fetch latest digest for the authenticated resident
router.get('/latest', requireAuth, getLatest);

// POST /api/digest/generate — generate/refresh weekly digest on demand
router.post('/generate', requireAuth, generateOnDemand);

module.exports = router;
