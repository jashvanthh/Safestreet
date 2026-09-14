/**
 * services/emailService.js
 *
 * Centralized email notification service using Nodemailer.
 *
 * Capabilities:
 *   1. sendReportConfirmationEmail(user, incident)
 *      - Sends an email to the resident confirming their incident report submission.
 *   2. sendStatusUpdateEmail(user, incident, newStatus)
 *      - Sends an email to the reporter when an admin updates the report status.
 *   3. sendWeeklyDigestEmail(user, digest, prevCount)
 *      - Dispatches the weekly neighborhood safety summary.
 *
 * Resilience:
 *   - If SMTP credentials are not yet configured in .env, it logs a simulated preview
 *     cleanly to the console without throwing or blocking HTTP requests.
 */

const nodemailer = require('nodemailer');

/**
 * Helper to check if an email address is real or a dummy/test domain.
 * Prevents Google SMTP from rejecting fake domains like safestreet.test or example.com.
 */
const isDeliverableEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const lower = email.toLowerCase().trim();
  if (
    lower.endsWith('.test') ||
    lower.endsWith('.example') ||
    lower.endsWith('.invalid') ||
    lower.endsWith('.localhost') ||
    lower.includes('@safestreet.test')
  ) {
    return false;
  }
  return true;
};

/**
 * Configure Nodemailer transport.
 * Uses environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT).
 */
const createTransporter = () => {
  // Never dispatch real emails across SMTP in unit/integration test suites (e.g. Jest)
  if (process.env.NODE_ENV === 'test') {
    return null;
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
};

/**
 * Send an email confirmation to the user after submitting an incident report.
 *
 * @param {Object} user - User document or object with name and email
 * @param {Object} incident - Created incident document
 */
const sendReportConfirmationEmail = async (user, incident) => {
  if (!user || !user.email || !isDeliverableEmail(user.email)) return;

  const transporter = createTransporter();
  const clientUrl   = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  const incidentUrl = `${clientUrl}/incidents/${incident._id}`;
  const subject     = `🛡️ Report Received: "${incident.title}" — SafeStreet`;

  const categoryName = incident.category?.replace('_', ' ') || 'General Hazard';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #334155;">
      <h2 style="color: #38bdf8; margin-top: 0; font-size: 22px;">🛡️ SafeStreet Report Confirmation</h2>
      <p style="font-size: 15px; color: #e2e8f0;">Hello <strong>${user.name || 'Resident'}</strong>,</p>
      <p style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">
        Thank you for helping keep your community safe. Your hazard report has been successfully logged into SafeStreet.
      </p>
      
      <div style="background-color: #1e293b; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #334155;">
        <h3 style="margin: 0 0 10px 0; color: #f1f5f9; font-size: 17px;">${incident.title}</h3>
        <p style="margin: 6px 0; font-size: 13px; color: #cbd5e1;"><strong>Category:</strong> <span style="text-transform: capitalize;">${categoryName}</span></p>
        <p style="margin: 6px 0; font-size: 13px; color: #cbd5e1;"><strong>Status:</strong> <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; background-color: #2563eb; color: white; font-weight: bold; font-size: 11px; text-transform: uppercase;">REPORTED</span></p>
        <p style="margin: 6px 0; font-size: 13px; color: #cbd5e1;"><strong>Date Reported:</strong> ${new Date(incident.createdAt || Date.now()).toLocaleString()}</p>
        <p style="margin: 12px 0 0 0; font-size: 13px; color: #94a3b8; line-height: 1.4;">${incident.description}</p>
      </div>

      <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
        Nearby residents within your hazard radius have received real-time proximity alerts, and local moderators have been notified for review.
      </p>

      <div style="margin: 24px 0;">
        <a href="${incidentUrl}" style="background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
          View Incident on SafeStreet →
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;" />
      <p style="font-size: 12px; color: #64748b; margin: 0;">
        SafeStreet Platform • Hyper-Local Community Safety & Proximity Alert System
      </p>
    </div>
  `;

  if (!transporter) {
    console.log(
      `📧 [Email Service] Simulated report confirmation to ${user.email} for "${incident.title}".\n` +
      `   💡 (To deliver real emails, add your Gmail & App Password in server/.env under SMTP_USER and SMTP_PASS)`
    );
    return;
  }

  try {
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM || process.env.DIGEST_FROM_EMAIL || `"SafeStreet Alerts" <${process.env.SMTP_USER}>`,
      to:      user.email,
      subject,
      html,
    });
    console.log(`✅ Report confirmation email dispatched to ${user.email}`);
  } catch (err) {
    console.error(`⚠️ Failed to dispatch report confirmation email to ${user.email}:`, err.message);
  }
};

/**
 * Send an email notification to the reporter when an admin updates the incident status.
 *
 * @param {Object} user - Reporter User document with name and email
 * @param {Object} incident - Incident document
 * @param {string} newStatus - 'reported' | 'under_review' | 'resolved'
 */
const sendStatusUpdateEmail = async (user, incident, newStatus) => {
  if (!user || !user.email || !isDeliverableEmail(user.email)) return;

  const transporter = createTransporter();
  const clientUrl   = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  const incidentUrl = `${clientUrl}/incidents/${incident._id}`;
  const subject     = `🔔 Status Update: "${incident.title}" is now ${newStatus.replace('_', ' ').toUpperCase()}`;

  const statusMeta = {
    reported: {
      bg:    '#2563eb',
      text:  '#ffffff',
      label: 'REPORTED',
      desc:  'Received and queued for review.',
    },
    under_review: {
      bg:    '#eab308',
      text:  '#000000',
      label: 'UNDER REVIEW',
      desc:  'A community moderator or municipal team is actively investigating this report.',
    },
    resolved: {
      bg:    '#16a34a',
      text:  '#ffffff',
      label: 'RESOLVED',
      desc:  'The reported hazard has been addressed and cleared.',
    },
  };

  const currentMeta = statusMeta[newStatus] || statusMeta.reported;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #334155;">
      <h2 style="color: #38bdf8; margin-top: 0; font-size: 22px;">🔔 Incident Status Updated</h2>
      <p style="font-size: 15px; color: #e2e8f0;">Hello <strong>${user.name || 'Resident'}</strong>,</p>
      <p style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">
        An administrator or municipal moderator has updated the status of your reported incident.
      </p>
      
      <div style="background-color: #1e293b; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #334155;">
        <h3 style="margin: 0 0 12px 0; color: #f1f5f9; font-size: 17px;">${incident.title}</h3>
        
        <div style="margin: 10px 0;">
          <span style="font-size: 13px; color: #94a3b8; display: block; margin-bottom: 6px;">New Status:</span>
          <span style="display: inline-block; padding: 5px 14px; border-radius: 16px; background-color: ${currentMeta.bg}; color: ${currentMeta.text}; font-weight: bold; font-size: 12px; letter-spacing: 0.5px;">
            ${currentMeta.label}
          </span>
        </div>

        <p style="margin: 10px 0 0 0; font-size: 13px; color: #cbd5e1; line-height: 1.4;">${currentMeta.desc}</p>
        <p style="margin: 10px 0 0 0; font-size: 12px; color: #94a3b8;"><strong>Updated on:</strong> ${new Date().toLocaleString()}</p>
      </div>

      <div style="margin: 24px 0;">
        <a href="${incidentUrl}" style="background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
          View Incident Timeline →
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;" />
      <p style="font-size: 12px; color: #64748b; margin: 0;">
        Thank you for helping make our streets safer for everyone.
      </p>
    </div>
  `;

  if (!transporter) {
    console.log(
      `📧 [Email Service] Simulated status update email to ${user.email} for "${incident.title}" (Status: ${newStatus}).\n` +
      `   💡 (To deliver real emails, add your Gmail & App Password in server/.env under SMTP_USER and SMTP_PASS)`
    );
    return;
  }

  try {
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM || process.env.DIGEST_FROM_EMAIL || `"SafeStreet Alerts" <${process.env.SMTP_USER}>`,
      to:      user.email,
      subject,
      html,
    });
    console.log(`✅ Status update email dispatched to ${user.email} (Status: ${newStatus})`);
  } catch (err) {
    console.error(`⚠️ Failed to dispatch status update email to ${user.email}:`, err.message);
  }
};

/**
 * Send an email alert to the SafeStreet administrator when a new incident is reported.
 *
 * @param {Object} incident - Incident document
 * @param {Object} reporter - Reporter user object (req.user)
 */
const sendAdminNewIncidentAlert = async (incident, reporter) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'jashvanth542@gmail.com';
  if (!adminEmail) return;

  const transporter = createTransporter();
  const clientUrl   = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  const incidentUrl = `${clientUrl}/incidents/${incident._id}`;
  const adminUrl    = `${clientUrl}/admin`;
  const subject     = `🚨 [Admin Alert] New Incident Reported: "${incident.title}"`;

  const categoryName = incident.category?.replace('_', ' ') || 'General Hazard';
  const coords       = incident.location?.coordinates || [0, 0];
  const lng          = coords[0];
  const lat          = coords[1];

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #334155;">
      <div style="margin-bottom: 16px;">
        <span style="background-color: #dc2626; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 11px; letter-spacing: 0.8px; text-transform: uppercase;">
          🚨 Admin Dispatch Alert
        </span>
        <span style="font-size: 12px; color: #94a3b8; float: right;">${new Date().toLocaleString()}</span>
      </div>

      <h2 style="color: #f1f5f9; margin-top: 14px; font-size: 20px; border-bottom: 1px solid #1e293b; padding-bottom: 12px;">
        A new hazard was reported and requires your review
      </h2>

      <div style="background-color: #1e293b; padding: 18px; border-radius: 8px; margin: 18px 0; border: 1px solid #334155;">
        <h3 style="margin: 0 0 12px 0; color: #38bdf8; font-size: 18px;">${incident.title}</h3>
        
        <table style="width: 100%; font-size: 13px; color: #cbd5e1; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; width: 130px; color: #94a3b8;"><strong>Category:</strong></td>
            <td style="padding: 6px 0; text-transform: capitalize;">${categoryName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;"><strong>Coordinates:</strong></td>
            <td style="padding: 6px 0; font-family: monospace;">${lat.toFixed(6)}, ${lng.toFixed(6)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;"><strong>Description:</strong></td>
            <td style="padding: 6px 0; line-height: 1.4;">${incident.description || 'No additional details provided.'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;"><strong>Anonymous:</strong></td>
            <td style="padding: 6px 0;">${incident.isAnonymous ? 'Yes (Identity hidden from public map)' : 'No (Public)'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;"><strong>Reporter Name:</strong></td>
            <td style="padding: 6px 0;">${reporter?.name || 'Resident'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;"><strong>Reporter Email:</strong></td>
            <td style="padding: 6px 0;">${reporter?.email || 'N/A'}</td>
          </tr>
          ${incident.reporterContact ? `
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;"><strong>Contact Phone:</strong></td>
            <td style="padding: 6px 0;">${incident.reporterContact}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <div style="margin: 24px 0;">
        <a href="${adminUrl}" style="background-color: #2563eb; color: #ffffff; padding: 11px 22px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block; margin-right: 10px;">
          Open Admin Triage →
        </a>
        <a href="${incidentUrl}" style="background-color: #334155; color: #f8fafc; padding: 11px 22px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
          View Report
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;" />
      <p style="font-size: 12px; color: #64748b; margin: 0;">
        SafeStreet Platform • Automated Admin Alert dispatched to ${adminEmail}
      </p>
    </div>
  `;

  if (!transporter) {
    console.log(
      `📧 [Email Service] Simulated Admin Alert to ${adminEmail} for new incident "${incident.title}".`
    );
    return;
  }

  try {
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM || process.env.DIGEST_FROM_EMAIL || `"SafeStreet Alerts" <${process.env.SMTP_USER}>`,
      to:      adminEmail,
      subject,
      html,
    });
    console.log(`🚨 Admin alert email dispatched to ${adminEmail} for incident: "${incident.title}"`);
  } catch (err) {
    console.error(`⚠️ Failed to dispatch admin alert email to ${adminEmail}:`, err.message);
  }
};

module.exports = {
  createTransporter,
  sendReportConfirmationEmail,
  sendStatusUpdateEmail,
  sendAdminNewIncidentAlert,
  isDeliverableEmail,
};

