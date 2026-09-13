/**
 * controllers/adminController.js
 *
 * Admin-only endpoints — all routes that use these controllers must be
 * protected by: requireAuth → requireAdmin (see routes/admin.js)
 *
 * KEY CONCEPT: MongoDB Aggregation Pipeline (viva point)
 *   The aggregation pipeline is a sequence of stages that transform documents.
 *   Each stage passes its output to the next stage.
 *   It's like a UNIX pipe: collection | stage1 | stage2 | stage3
 *
 *   Stages used here:
 *   $group   — groups documents by a field and computes counts/sums
 *   $sort    — sorts the grouped results
 *   $facet   — runs multiple aggregation pipelines in parallel within one query
 *              (think of it as "give me multiple reports in one DB round-trip")
 *
 * Example: "count incidents by category":
 *   { $group: { _id: "$category", count: { $sum: 1 } } }
 *   → reads each incident, groups them by their category value,
 *     increments count by 1 for each document in the group.
 *
 * getStats()           — dashboard aggregation (category, status, recent)
 * getAdminIncidents()  — paginated incident list for admin triage (all fields visible)
 */

const Incident = require('../models/Incident');
const User     = require('../models/User');

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
// Returns aggregated counts for the dashboard.
// Uses $facet to run all aggregations in a single MongoDB query.
const getStats = async (req, res, next) => {
  try {
    const [result] = await Incident.aggregate([
      {
        $facet: {
          // Count by category → { _id: 'harassment', count: 12 }
          byCategory: [
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort:  { count: -1 } },
          ],

          // Count by status → { _id: 'reported', count: 8 }
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort:  { count: -1 } },
          ],

          // Total incident count
          total: [
            { $count: 'count' },
          ],

          // Incidents in last 7 days
          recentWeek: [
            { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
            { $count: 'count' },
          ],

          // Daily trend for last 14 days
          dailyTrend: [
            { $match: { createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } } },
            {
              $group: {
                // $dateToString converts date to a string like "2026-09-13"
                _id:   { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    // $facet always returns exactly one document with arrays for each pipeline
    const totalUsers = await User.countDocuments();

    res.status(200).json({
      success: true,
      message: 'Admin stats fetched',
      data: {
        totalIncidents: result.total[0]?.count       || 0,
        recentWeek:     result.recentWeek[0]?.count  || 0,
        totalUsers,
        byCategory:     result.byCategory,
        byStatus:       result.byStatus,
        dailyTrend:     result.dailyTrend,
      },
    });

  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/incidents ──────────────────────────────────────────────────
// Like GET /api/incidents but:
//   1. Returns reportedBy and reporterContact even for anonymous incidents
//      (admin needs to know who reported for abuse prevention)
//   2. No anonymous stripping
//   3. Full pagination + all filters
const getAdminIncidents = async (req, res, next) => {
  try {
    const {
      category, status, from, to,
      page = 1, limit = 20,
    } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (status)   filter.status   = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to);
    }

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip     = (pageNum - 1) * limitNum;

    const [incidents, total] = await Promise.all([
      Incident.find(filter)
        .populate('reportedBy', 'name email')  // Admin sees email too
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Incident.countDocuments(filter),
    ]);

    // Admin sees ALL fields including reporterContact and reportedBy
    // (no stripAnonymous — this is intentional for admin triage)
    res.status(200).json({
      success: true,
      message: 'Admin incidents fetched',
      data: {
        incidents,
        pagination: {
          total,
          page:       pageNum,
          limit:      limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });

  } catch (err) {
    next(err);
  }
};

module.exports = { getStats, getAdminIncidents };
