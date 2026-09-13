/**
 * routes/auth.js
 *
 * Auth-related HTTP routes.
 * Route → Controller pattern:
 *   Router defines the URL + HTTP verb
 *   Controller handles request parsing + calling services
 *   (No DB calls happen in this file)
 *
 * Built in Phase 2.
 */

const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

// POST /api/auth/register  — public
router.post('/register', register);

// POST /api/auth/login     — public
router.post('/login', login);

// GET  /api/auth/me        — requires valid JWT
router.get('/me', requireAuth, getMe);

module.exports = router;
