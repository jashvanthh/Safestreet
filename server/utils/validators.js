/**
 * utils/validators.js (server-side)
 *
 * Pure validation functions — no DB calls, no HTTP.
 * Used by controllers before calling services.
 *
 * Why validate server-side even though the client validates too?
 *   The client can be bypassed (curl, Postman, bad actor).
 *   Server-side validation is the last line of defense.
 */

/**
 * Validates an email address format.
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Validates password strength.
 * Rules: 8+ chars, at least one letter, one digit or special character.
 * @param {string} password
 * @returns {boolean}
 */
const isValidPassword = (password) => {
  if (typeof password !== 'string' || password.length < 8) return false;
  const hasLetter  = /[a-zA-Z]/.test(password);
  const hasNumOrSp = /[\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  return hasLetter && hasNumOrSp;
};

/**
 * Validates GeoJSON coordinates array [lng, lat].
 * MongoDB 2dsphere requires longitude in [-180, 180] and latitude in [-90, 90].
 * IMPORTANT: coordinates are [longitude, latitude], NOT [latitude, longitude].
 * @param {number[]} coords - [lng, lat]
 * @returns {boolean}
 */
const isValidCoordinates = ([lng, lat]) => {
  return (
    typeof lng === 'number' &&
    typeof lat === 'number' &&
    lng >= -180 && lng <= 180 &&
    lat >= -90  && lat <= 90
  );
};

/**
 * Validates incident category.
 * @param {string} category
 * @returns {boolean}
 */
const INCIDENT_CATEGORIES = [
  'poor_lighting',
  'harassment',
  'unsafe_intersection',
  'suspicious_activity',
  'other',
];

const isValidCategory = (category) => INCIDENT_CATEGORIES.includes(category);

/**
 * Validates incident severity level.
 * @param {string} severity
 * @returns {boolean}
 */
const SEVERITY_LEVELS = ['low', 'medium', 'high'];

const isValidSeverity = (severity) => SEVERITY_LEVELS.includes(severity);

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidCoordinates,
  isValidCategory,
  INCIDENT_CATEGORIES,
  isValidSeverity,
  SEVERITY_LEVELS,
};
