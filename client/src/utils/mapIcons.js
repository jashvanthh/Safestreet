/**
 * utils/mapIcons.js
 *
 * Risk Intelligence Markers — DUAL visual encoding:
 *
 *   SHAPE / ICON  →  incident CATEGORY (what type of hazard)
 *   COLOR + SIZE  →  incident SEVERITY (how serious it is)
 *
 * Severity palette (deliberately distinct hues, not shades of the same color):
 *   low    →  Blue   #2563EB  — informational / monitor
 *   medium →  Amber  #D97706  — caution / attention needed
 *   high   →  Red    #DC2626  — critical / immediate action
 *
 * Category icons (inline SVG paths):
 *   poor_lighting        → Lightbulb
 *   harassment           → Alert Triangle (!)
 *   unsafe_intersection  → Road Cross (+)
 *   suspicious_activity  → Eye
 *   other                → Wrench
 */
import L from 'leaflet';

// ── Severity color system — 3 deliberately distinct hues ─────────────────────
const SEVERITY = {
  low: {
    color:     '#2563EB',   // Blue — calm, informational
    innerBg:   '#EFF6FF',
    ringColor: '#2563EB',
    size:       22,
    activeSize: 30,
    alwaysPulse: false,
  },
  medium: {
    color:     '#D97706',   // Amber — caution
    innerBg:   '#FFFBEB',
    ringColor: '#D97706',
    size:       28,
    activeSize: 36,
    alwaysPulse: false,
  },
  high: {
    color:     '#DC2626',   // Red — critical
    innerBg:   '#FEF2F2',
    ringColor: '#DC2626',
    size:       34,
    activeSize: 42,
    alwaysPulse: true,    // always pulse for high risk
  },
};

// ── Category SVG icon paths (24×24 viewBox, stroke-based) ────────────────────
const CATEGORY_ICONS = {
  // Lightbulb
  poor_lighting: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 21h6M10 17.5A5 5 0 1 1 14 7.5"/>
      <path d="M9 17.5h6"/>
      <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none"/>
      <path d="M12 8a4 4 0 0 1 0 8"/>
      <path d="M12 8a4 4 0 0 0 0 8"/>
    </svg>`,

  // Alert triangle with exclamation
  harassment: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>`,

  // Road intersection / crossroads
  unsafe_intersection: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="2" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <rect x="9" y="9" width="6" height="6" rx="1"/>
    </svg>`,

  // Eye / surveillance
  suspicious_activity: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>`,

  // Wrench (civic/maintenance)
  other: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>`,
};

/**
 * Creates a severity + category dual-encoded Leaflet DivIcon.
 *
 * @param {string} severity  - 'low' | 'medium' | 'high'  (default 'medium')
 * @param {boolean} isActive - whether this marker is currently selected
 * @param {string} category  - incident category key (for icon shape)
 * @returns {L.DivIcon}
 */
export const createCustomPin = (severity = 'medium', isActive = false, category = 'other') => {
  const cfg     = SEVERITY[severity] || SEVERITY.medium;
  const size    = isActive ? cfg.activeSize : cfg.size;
  const iconSize = Math.round(size * 0.48);   // icon scales with marker

  const showPulse   = isActive || cfg.alwaysPulse;
  const pulseSpeed  = isActive ? '1.3s' : '2.4s';
  const ringOpacity = isActive ? 0.25 : 0.14;

  const iconSvg = CATEGORY_ICONS[category] || CATEGORY_ICONS.other;

  const html = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translate(-50%, -50%);
      cursor: pointer;
    ">
      ${showPulse ? `
      <div style="
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: ${cfg.ringColor};
        opacity: ${ringOpacity};
        animation: mapPing ${pulseSpeed} cubic-bezier(0,0,0.2,1) infinite;
        transform-origin: center;
      "></div>` : ''}

      <!-- Outer circle: white bg + severity-colored border -->
      <div style="
        position: relative;
        width: ${size - 4}px;
        height: ${size - 4}px;
        border-radius: 50%;
        background-color: ${isActive ? cfg.innerBg : '#FFFFFF'};
        border: ${isActive ? 2.5 : 2}px solid ${cfg.color};
        box-shadow: 0 2px 8px rgba(0,0,0,${severity === 'high' ? 0.25 : 0.16}),
                    0 0 0 1px rgba(255,255,255,0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      ">
        <!-- Category icon, colored by severity -->
        <div style="
          width: ${iconSize}px;
          height: ${iconSize}px;
          color: ${cfg.color};
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: ${isActive ? 1 : 0.88};
        ">
          ${iconSvg}
        </div>
      </div>
    </div>

    <style>
      @keyframes mapPing {
        0%   { transform: scale(1);    opacity: ${ringOpacity}; }
        65%  { transform: scale(2.0);  opacity: 0; }
        100% { transform: scale(2.0);  opacity: 0; }
      }
    </style>
  `;

  return L.divIcon({
    html,
    className:  'custom-leaflet-marker',
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

/**
 * Returns the display label for a severity value.
 */
export const getSeverityLabel = (severity) => {
  const map = { low: 'Low Risk', medium: 'Medium Risk', high: 'High Risk' };
  return map[severity] || 'Medium Risk';
};

/**
 * Returns the hex color for a severity value.
 */
export const getSeverityColor = (severity) => {
  return (SEVERITY[severity] || SEVERITY.medium).color;
};

/**
 * Returns the category icon label for legend display.
 */
export const CATEGORY_ICON_META = {
  poor_lighting:       { label: 'Poor Lighting',       shape: 'Lightbulb' },
  harassment:          { label: 'Harassment',           shape: 'Alert ▲' },
  unsafe_intersection: { label: 'Unsafe Intersection',  shape: 'Cross (+)' },
  suspicious_activity: { label: 'Suspicious Activity',  shape: 'Eye (👁)' },
  other:               { label: 'Civic Hazard',         shape: 'Wrench' },
};
