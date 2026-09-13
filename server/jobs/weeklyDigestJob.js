/**
 * jobs/weeklyDigestJob.js
 *
 * Phase 10 — Scheduled Weekly Safety Digest
 *
 * Runs automatically every Sunday at midnight using node-cron.
 * Aggregates neighborhood safety reports for all registered users,
 * persists the statistics to MongoDB, and dispatches email digests.
 *
 * Cron syntax: '0 0 * * 0'
 *   0  — minute 0
 *   0  — hour 0 (midnight)
 *   *  — every day of month
 *   *  — every month
 *   0  — Sunday (0 or 7)
 */

const cron = require('node-cron');
const { generateAllDigests } = require('../services/digestService');

let digestTask = null;

const startDigestJob = () => {
  // Run every Sunday at midnight
  digestTask = cron.schedule('0 0 * * 0', async () => {
    console.log('⏰ [Cron] Starting scheduled weekly safety digest job...');
    try {
      await generateAllDigests();
      console.log('✅ [Cron] Scheduled weekly safety digests generated successfully.');
    } catch (err) {
      console.error('❌ [Cron] Error during scheduled digest generation:', err);
    }
  });

  console.log('📅 Weekly digest cron job scheduled (every Sunday at midnight: 0 0 * * 0)');
};

const stopDigestJob = () => {
  if (digestTask) {
    digestTask.stop();
    console.log('🛑 Weekly digest cron job stopped');
  }
};

module.exports = {
  startDigestJob,
  stopDigestJob,
};
