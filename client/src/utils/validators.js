/**
 * utils/validators.js (client-side)
 *
 * Mirror of server validators for immediate UI feedback.
 * The server ALWAYS re-validates — these are just for UX.
 */

export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());

export const isValidPassword = (password) =>
  typeof password === 'string' && password.length >= 6;

export const isValidTitle = (title) =>
  typeof title === 'string' && title.trim().length >= 5 && title.length <= 120;

export const isValidDescription = (desc) =>
  typeof desc === 'string' && desc.trim().length >= 10 && desc.length <= 2000;

/**
 * Validates that coords are [lat, lng] (display order for Leaflet).
 * NOTE: On the server and in GeoJSON this is stored as [lng, lat].
 * Leaflet uses [lat, lng]. The conversion happens in IncidentForm before submission.
 */
export const isValidLatLng = (lat, lng) =>
  typeof lat === 'number' && typeof lng === 'number' &&
  lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
