/**
 * routes/notifications.js
 *
 * IMPORTANT route order:
 *   /count and /read-all MUST come before /:id
 *   Otherwise Express matches "count" as an ObjectId parameter → CastError
 *   (Same principle as /nearby before /:id in incident routes)
 */
const express  = require('express');
const router   = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const {
  getNotifications,
  getUnreadCount,
  markOneRead,
  markAllRead,
} = require('../controllers/notificationController');

router.use(requireAuth);  // All notification routes require login

router.get('/',           getNotifications);
router.get('/count',      getUnreadCount);    // BEFORE /:id
router.patch('/read-all', markAllRead);        // BEFORE /:id
router.patch('/:id/read', markOneRead);

module.exports = router;
