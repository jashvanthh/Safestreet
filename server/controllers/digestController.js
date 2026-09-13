/**
 * controllers/digestController.js
 *
 * Handles HTTP requests for neighborhood safety digests (Phase 10).
 */

const { getLatestDigest, generateDigestForUser } = require('../services/digestService');
const User = require('../models/User');

// ── GET /api/digest/latest ──────────────────────────────────────────────────
const getLatest = async (req, res, next) => {
  try {
    const digest = await getLatestDigest(req.user._id);

    if (!digest) {
      return res.status(200).json({
        success: true,
        message: 'No digest generated yet',
        data: { digest: null },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Latest digest retrieved',
      data: { digest },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/digest/generate ───────────────────────────────────────────────
// Generates or refreshes the weekly digest on demand for the calling user
const generateOnDemand = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      return next(err);
    }

    const digest = await generateDigestForUser(user);

    res.status(201).json({
      success: true,
      message: 'Digest generated successfully',
      data: { digest },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getLatest,
  generateOnDemand,
};
