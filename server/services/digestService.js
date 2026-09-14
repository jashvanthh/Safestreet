/**
 * services/digestService.js
 *
 * Phase 10 — Weekly Neighborhood Safety Digest Service
 *
 * WHAT IT DOES:
 *   1. Aggregates all safety incidents reported within a user's notification radius
 *      over a 7-day period (weekStart -> weekEnd).
 *   2. Compares with the prior 7 days to calculate the safety trend ('up' | 'down' | 'stable').
 *   3. Computes incident breakdown by category (poor lighting, harassment, etc.).
 *   4. Persists the Digest document in MongoDB.
 *   5. Sends an HTML email digest via Nodemailer (or logs to console if SMTP is not configured).
 */

const { createTransporter } = require('./emailService');
const User       = require('../models/User');
const Incident   = require('../models/Incident');
const Digest     = require('../models/Digest');

const EARTH_RADIUS_KM = 6378.1;

/**
 * Generate a safety digest for a single user.
 *
 * @param {Object} user - User document or object with _id, email, name, notificationLocation, notificationRadius
 * @param {Date} [customWeekStart]
 * @param {Date} [customWeekEnd]
 * @returns {Promise<Digest>}
 */
const generateDigestForUser = async (user, customWeekStart, customWeekEnd) => {
  const weekEnd   = customWeekEnd   ? new Date(customWeekEnd)   : new Date();
  const weekStart = customWeekStart ? new Date(customWeekStart) : new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Prior 7-day window for trend comparison
  const prevEnd   = new Date(weekStart.getTime());
  const prevStart = new Date(prevEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

  const coords = user.notificationLocation?.coordinates;
  const radiusKm = user.notificationRadius || 2;
  const hasValidLocation =
    Array.isArray(coords) &&
    coords.length === 2 &&
    !(coords[0] === 0 && coords[1] === 0);

  // Build geospatial condition using $geoWithin + $centerSphere for reliable combining with dates
  const geoFilter = hasValidLocation
    ? {
        location: {
          $geoWithin: {
            $centerSphere: [coords, radiusKm / EARTH_RADIUS_KM],
          },
        },
      }
    : {};

  // 1. Fetch current week's incidents in radius
  const currentIncidents = await Incident.find({
    ...geoFilter,
    createdAt: { $gte: weekStart, $lte: weekEnd },
  }).select('category title location status createdAt');

  // 2. Fetch prior week's incident count for trend comparison
  const prevCount = await Incident.countDocuments({
    ...geoFilter,
    createdAt: { $gte: prevStart, $lte: prevEnd },
  });

  const totalCurrent = currentIncidents.length;

  // 3. Determine trend
  let trend = 'stable';
  if (totalCurrent > prevCount) {
    trend = 'up';
  } else if (totalCurrent < prevCount) {
    trend = 'down';
  }

  // 4. Summarize by category
  const categoryCounts = {};
  for (const incident of currentIncidents) {
    const cat = incident.category || 'other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  const categorySummary = Object.entries(categoryCounts).map(([category, count]) => ({
    category,
    count,
  }));

  // 5. Save Digest record to MongoDB
  const digest = await Digest.create({
    userId:         user._id,
    weekStart,
    weekEnd,
    totalIncidents: totalCurrent,
    categorySummary,
    trend,
    sentAt:         new Date(),
  });

  // 6. Send email notification or log
  await dispatchDigestEmail(user, digest, prevCount);

  return digest;
};

/**
 * Sends the email via Nodemailer or logs to console.
 */
const dispatchDigestEmail = async (user, digest, prevCount) => {
  const transporter = createTransporter();
  const radiusKm    = user.notificationRadius || 2;
  const trendLabel  =
    digest.trend === 'up'
      ? '📈 Increased (+ vs last week)'
      : digest.trend === 'down'
      ? '📉 Decreased (- vs last week)'
      : '➡️ Stable (same as last week)';

  const summaryHtml =
    digest.categorySummary.length > 0
      ? digest.categorySummary.map((c) => `<li><strong>${c.category.replace('_', ' ')}:</strong> ${c.count}</li>`).join('')
      : '<li>No incidents reported in your area this week! 🎉</li>';

  if (!transporter) {
    console.log(
      `📧 [Digest Service] SMTP not configured. Logged weekly digest for ${user.email}:\n` +
      `   Period: ${digest.weekStart.toLocaleDateString()} - ${digest.weekEnd.toLocaleDateString()}\n` +
      `   Total Incidents within ${radiusKm}km: ${digest.totalIncidents} (Trend: ${digest.trend})\n` +
      `   Categories: ${JSON.stringify(digest.categorySummary)}`
    );
    return;
  }

  try {
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM || '"Safe Street Alerts" <notifications@safestreet.org>',
      to:      user.email,
      subject: `🛡️ Your Safe Street Weekly Safety Digest (${digest.totalIncidents} in your zone)`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;">
          <h1 style="color: #38bdf8; margin-top: 0;">Safe Street Weekly Safety Digest</h1>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>Here is your weekly safety overview for your ${radiusKm} km radius neighbourhood zone:</p>
          
          <div style="background-color: #1e293b; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 0 0 8px 0; font-size: 16px;"><strong>Incidents Reported This Week:</strong> <span style="font-size: 20px; color: #38bdf8;">${digest.totalIncidents}</span></p>
            <p style="margin: 0; font-size: 14px; color: #94a3b8;">Previous Week: ${prevCount} | Trend: <strong>${trendLabel}</strong></p>
          </div>

          <h3 style="color: #e2e8f0; margin-bottom: 10px;">Category Breakdown:</h3>
          <ul style="color: #cbd5e1; line-height: 1.6;">
            ${summaryHtml}
          </ul>

          <p style="font-size: 12px; color: #64748b; margin-top: 30px;">
            You received this email because you are a registered resident on Safe Street.
            You can adjust your notification radius or home location anytime in your Profile.
          </p>
        </div>
      `,
    });
    console.log(`✅ Weekly digest email dispatched to ${user.email}`);
  } catch (err) {
    console.error(`⚠️ Failed to dispatch digest email to ${user.email}:`, err.message);
  }
};

/**
 * Generate digests for all active users in the database.
 * Used by the weekly cron job.
 */
const generateAllDigests = async () => {
  console.log('⏰ [Digest Service] Running weekly digest generation for all users...');
  const users = await User.find({}).select('_id name email notificationLocation notificationRadius');
  let generated = 0;

  for (const user of users) {
    try {
      await generateDigestForUser(user);
      generated++;
    } catch (err) {
      console.error(`Failed to generate digest for user ${user._id}:`, err.message);
    }
  }

  console.log(`✅ [Digest Service] Completed weekly digests for ${generated} users.`);
  return generated;
};

/**
 * Fetch the latest digest for a given user.
 * If no digest exists, generate one automatically for the current week.
 */
const getLatestDigest = async (userId) => {
  let digest = await Digest.findOne({ userId }).sort({ weekStart: -1 });

  if (!digest) {
    const user = await User.findById(userId);
    if (user) {
      digest = await generateDigestForUser(user);
    }
  }

  return digest;
};

module.exports = {
  generateDigestForUser,
  generateAllDigests,
  getLatestDigest,
};
