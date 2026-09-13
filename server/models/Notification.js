/**
 * models/Notification.js
 *
 * Stores a persistent record of every proximity notification sent.
 * This is important because:
 *   1. Socket.IO is real-time — if the user is offline when an incident
 *      is created, the socket event is missed. The DB record ensures they
 *      still see the notification when they next open the app.
 *   2. It gives users a notification history page (/notifications).
 *
 * Flow:
 *   New incident → notifyNearbyUsers() → creates Notification doc + socket emit
 *
 * The recipient field indexes on user ID so we can efficiently query:
 *   "all notifications for user X"
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    incident: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Incident',
      required: true,
    },

    message: {
      type:     String,
      required: true,
      maxlength: 200,
    },

    isRead: {
      type:    Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for efficient "get all notifications for this user" queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
// Index for counting unread notifications
notificationSchema.index({ recipient: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
