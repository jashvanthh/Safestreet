/**
 * controllers/notificationController.js
 *
 * Handles notification CRUD for the authenticated user.
 * All endpoints only return notifications for req.user._id —
 * a user can NEVER see another user's notifications.
 *
 * Endpoints:
 *   GET  /api/notifications          — list (newest first, paginated)
 *   GET  /api/notifications/count    — unread count (used by NotificationBell on mount)
 *   PATCH /api/notifications/:id/read — mark one as read
 *   PATCH /api/notifications/read-all — mark all as read
 */

const Notification = require('../models/Notification');
const { syncNotificationsForUser } = require('../services/notificationService');

// ── GET /api/notifications ─────────────────────────────────────────────────
const getNotifications = async (req, res, next) => {
  try {
    // Sync any existing incidents within the user's alert zone into notifications
    await syncNotificationsForUser(req.user);

    const { page = 1, limit = 20 } = req.query;
    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, parseInt(limit, 10) || 20);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .populate('incident', 'title category status')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Notification.countDocuments({ recipient: req.user._id }),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          total,
          page:       pageNum,
          limit:      limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) { next(err); }
};

// ── GET /api/notifications/count ───────────────────────────────────────────
// Lightweight endpoint for the NotificationBell to poll on mount
const getUnreadCount = async (req, res, next) => {
  try {
    await syncNotificationsForUser(req.user);

    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead:    false,
    });
    res.status(200).json({ success: true, data: { count } });
  } catch (err) { next(err); }
};

// ── PATCH /api/notifications/:id/read ─────────────────────────────────────
const markOneRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },  // recipient check = authorization
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      const err = new Error('Notification not found'); err.statusCode = 404; return next(err);
    }
    res.status(200).json({ success: true, data: { notification } });
  } catch (err) { next(err); }
};

// ── PATCH /api/notifications/read-all ─────────────────────────────────────
const markAllRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notification(s) marked as read`,
    });
  } catch (err) { next(err); }
};

module.exports = { getNotifications, getUnreadCount, markOneRead, markAllRead };
