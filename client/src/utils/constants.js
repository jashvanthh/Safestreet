/**
 * utils/constants.js
 *
 * Application-wide constants.
 * Centralized here so a category name change means editing ONE file.
 */

export const INCIDENT_CATEGORIES = [
  { value: 'poor_lighting',        label: 'Poor Lighting',        color: '#f59e0b' },
  { value: 'harassment',           label: 'Harassment',           color: '#ef4444' },
  { value: 'unsafe_intersection',  label: 'Unsafe Intersection',  color: '#f97316' },
  { value: 'suspicious_activity',  label: 'Suspicious Activity',  color: '#8b5cf6' },
  { value: 'other',                label: 'Other',                color: '#64748b' },
];

export const INCIDENT_STATUSES = [
  { value: 'reported',      label: 'Reported',      color: '#ef4444' },
  { value: 'under_review',  label: 'Under Review',  color: '#f59e0b' },
  { value: 'resolved',      label: 'Resolved',      color: '#22c55e' },
];

/** Default map center — update to your city's coordinates */
export const DEFAULT_MAP_CENTER = [20.5937, 78.9629]; // India center [lat, lng]
export const DEFAULT_MAP_ZOOM = 13;

/** Default notification radius in km */
export const DEFAULT_NOTIFICATION_RADIUS = 2;

/** LocalStorage keys — namespace with 'ss_' to avoid collisions */
export const TOKEN_KEY = 'ss_token';
export const USER_KEY  = 'ss_user';
