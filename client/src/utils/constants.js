/**
 * utils/constants.js
 *
 * Application-wide constants.
 * Centralized configuration for incident categories, statuses, and map defaults
 * matching the SafeStreet Light Civic-Tech design system.
 */

export const INCIDENT_CATEGORIES = [
  {
    value: 'poor_lighting',
    label: 'Poor Lighting',
    iconName: 'Lightbulb',
    color: '#C58A24',
    description: 'Broken, dim, or missing streetlights causing safety concerns',
  },
  {
    value: 'harassment',
    label: 'Harassment',
    iconName: 'AlertTriangle',
    color: '#C94C4C',
    description: 'Verbal, physical, or threatening public encounters',
  },
  {
    value: 'unsafe_intersection',
    label: 'Unsafe Intersection',
    iconName: 'ShieldAlert',
    color: '#C58A24',
    description: 'Hazardous crossings, blind turns, or non-functional traffic signals',
  },
  {
    value: 'suspicious_activity',
    label: 'Suspicious Activity',
    iconName: 'Eye',
    color: '#4AAE9B',
    description: 'Unusual, unauthorized, or concerning loitering or surveillance',
  },
  {
    value: 'other',
    label: 'Other',
    iconName: 'MoreHorizontal',
    color: '#64706B',
    description: 'Anything not listed above — drains, debris, power lines, infrastructure',
  },
];

export const INCIDENT_STATUSES = [
  { value: 'reported', label: 'Reported', color: '#C94C4C' },
  { value: 'under_review', label: 'Under Review', color: '#C58A24' },
  { value: 'resolved', label: 'Resolved', color: '#2E8B57' },
];

export const SEVERITY_LEVELS = [
  {
    value: 'low',
    label: 'Low',
    description: 'Minor concern — monitor',
    color: '#2563EB',
    bg: '#EFF6FF',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Caution — attention needed',
    color: '#D97706',
    bg: '#FFFBEB',
  },
  {
    value: 'high',
    label: 'High',
    description: 'Critical — act immediately',
    color: '#DC2626',
    bg: '#FEF2F2',
  },
];

/** Default map center — India coordinates */
export const DEFAULT_MAP_CENTER = [20.5937, 78.9629];
export const DEFAULT_MAP_ZOOM = 5;

/** Default notification radius in km */
export const DEFAULT_NOTIFICATION_RADIUS = 2;

/** LocalStorage keys */
export const TOKEN_KEY = 'ss_token';
export const USER_KEY = 'ss_user';
