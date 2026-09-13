/**
 * models/Digest.js
 *
 * Stores the weekly safety digest generated for a resident.
 * Aggregates all incidents reported within the user's notification radius
 * over a 7-day period.
 *
 * Schema fields:
 *   userId          — references User
 *   weekStart       — start of the 7-day aggregation window
 *   weekEnd         — end of the 7-day aggregation window
 *   totalIncidents  — count of incidents in radius this week
 *   categorySummary — breakdown by category: [{ category, count }]
 *   trend           — 'up' | 'down' | 'stable' vs the previous 7 days
 *   sentAt          — timestamp when digest was generated / delivered
 */

const mongoose = require('mongoose');

const digestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    weekStart: {
      type: Date,
      required: true,
    },
    weekEnd: {
      type: Date,
      required: true,
    },
    totalIncidents: {
      type: Number,
      default: 0,
      min: 0,
    },
    categorySummary: [
      {
        category: { type: String, required: true },
        count:    { type: Number, required: true, default: 0 },
      },
    ],
    trend: {
      type: String,
      enum: ['up', 'down', 'stable'],
      default: 'stable',
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast retrieval of the most recent digest for a user
digestSchema.index({ userId: 1, weekStart: -1 });

module.exports = mongoose.model('Digest', digestSchema);
