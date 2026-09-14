/**
 * pages/MapPage.jsx
 *
 * SafeStreet — Risk Intelligence Map.
 *
 * Core design principle:
 *   Heatmap  → DENSITY  (where incidents cluster)
 *   Markers  → SEVERITY (how serious each incident is)
 *
 * Floating control system:
 *   Top-left  — Explore bar (category + status + severity filters)
 *   Top-right — Layer controls (heatmap toggle, viewport bounds, recenter)
 *             — Severity legend (always visible)
 *   Bottom    — Collapsible incident drawer
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from 'react-leaflet';
import {
  Flame,
  Crosshair,
  MapPin,
  ExternalLink,
  Filter,
  X,
  Compass,
  ChevronUp,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import HeatmapLayer from '../components/HeatmapLayer';
import StatusBadge from '../components/StatusBadge';
import { createCustomPin, getSeverityColor, getSeverityLabel, CATEGORY_ICON_META } from '../utils/mapIcons';
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  INCIDENT_CATEGORIES,
  INCIDENT_STATUSES,
  SEVERITY_LEVELS,
} from '../utils/constants';

const CATEGORY_LABELS = {
  poor_lighting:       'Poor Lighting',
  harassment:          'Harassment',
  unsafe_intersection: 'Unsafe Intersection',
  suspicious_activity: 'Suspicious Activity',
  other:               'Other Hazard',
};

// ── Inner: tracks map bounds for viewport querying ──────────────────────────
const BoundsTracker = ({ onBoundsChange }) => {
  useMapEvents({
    moveend(e) {
      const b = e.target.getBounds();
      onBoundsChange(`${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()}`);
    },
  });
  return null;
};

// ── Inner: controls camera pan/fly ──────────────────────────────────────────
const MapController = ({ target }) => {
  const mapRef = useRef(null);
  useMapEvents({
    load(e) {
      mapRef.current = e.target;
    },
  });

  useEffect(() => {
    if (target && mapRef.current) {
      mapRef.current.flyTo([target.lat, target.lng], 15, { duration: 1.0 });
    }
  }, [target]);

  return null;
};

// ── Severity Badge (inline) ──────────────────────────────────────────────────
const SeverityBadge = ({ severity }) => {
  const color = getSeverityColor(severity);
  const label = getSeverityLabel(severity);
  const sev   = severity || 'medium';

  const bg = {
    low:    'rgba(37,99,235,0.10)',
    medium: 'rgba(217,119,6,0.10)',
    high:   'rgba(220,38,38,0.10)',
  }[sev] || 'rgba(217,119,6,0.10)';

  return (
    <span style={{
      display:         'inline-flex',
      alignItems:      'center',
      gap:             '4px',
      padding:         '1px 7px',
      borderRadius:    '20px',
      fontSize:        '10px',
      fontWeight:      700,
      letterSpacing:   '0.02em',
      color,
      backgroundColor: bg,
      border:          `1px solid ${color}33`,
    }}>
      <span style={{
        width:        '5px',
        height:       '5px',
        borderRadius: '50%',
        backgroundColor: color,
        display:      'inline-block',
      }} />
      {label}
    </span>
  );
};

const MapPage = () => {
  const { user } = useAuth();

  const [incidents,     setIncidents]     = useState([]);
  const [heatmapPoints, setHeatmapPoints] = useState([]);
  const [filters,       setFilters]       = useState({ category: '', status: '', severity: '' });
  const [showHeatmap,   setShowHeatmap]   = useState(false);
  const [useBounds,     setUseBounds]     = useState(false);
  const [bounds,        setBounds]        = useState('');
  const [activeId,      setActiveId]      = useState(null);
  const [isLoading,     setIsLoading]     = useState(true);
  const [mapTarget,     setMapTarget]     = useState(null);
  const [isDrawerOpen,  setIsDrawerOpen]  = useState(false);

  const markerRefs = useRef({});

  // User notification coordinates (if saved)
  const userCoords = user?.notificationLocation?.coordinates;
  const hasUserCoords =
    Array.isArray(userCoords) &&
    userCoords.length === 2 &&
    !(userCoords[0] === 0 && userCoords[1] === 0);

  // ── Fetch incidents ────────────────────────────────────────────────────────
  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.status)   params.set('status',   filters.status);
      if (filters.severity) params.set('severity',  filters.severity);
      if (useBounds && bounds) params.set('bounds', bounds);
      params.set('limit', '250');

      const res = await api.get(`/incidents?${params}`);
      setIncidents(res.data?.data?.incidents || []);
    } catch (err) {
      console.error('Failed to fetch map incidents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, useBounds, bounds]);

  // ── Fetch heatmap points ───────────────────────────────────────────────────
  const fetchHeatmap = useCallback(async () => {
    if (!showHeatmap) return;
    try {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      const res = await api.get(`/incidents/heatmap?${params}`);
      setHeatmapPoints(res.data?.data?.points || []);
    } catch (err) {
      console.error('Failed to fetch heatmap data:', err);
    }
  }, [showHeatmap, filters.category]);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);
  useEffect(() => { fetchHeatmap();   }, [fetchHeatmap]);

  const handleSelectIncident = (incident) => {
    const [lng, lat] = incident.location.coordinates;
    setActiveId(incident._id);
    setMapTarget({ lat, lng, id: incident._id });
    setTimeout(() => {
      if (markerRefs.current[incident._id]) {
        markerRefs.current[incident._id].openPopup();
      }
    }, 1100);
  };

  const handleRecenterToPerimeter = () => {
    if (hasUserCoords) {
      const [lng, lat] = userCoords;
      setMapTarget({ lat, lng, id: 'user-perimeter' });
    } else {
      setMapTarget({ lat: DEFAULT_MAP_CENTER[0], lng: DEFAULT_MAP_CENTER[1], id: 'default' });
    }
  };

  const hasActiveFilters = Boolean(filters.category || filters.status || filters.severity);

  const resetFilters = () => {
    setFilters({ category: '', status: '', severity: '' });
    setActiveId(null);
  };

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden bg-[var(--color-bg)]">

      {/* ── 1. Map-First Viewport Canvas ──────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={
            hasUserCoords
              ? [userCoords[1], userCoords[0]]
              : DEFAULT_MAP_CENTER
          }
          zoom={DEFAULT_MAP_ZOOM}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          <BoundsTracker onBoundsChange={(b) => setBounds(b)} />
          <MapController target={mapTarget} />

          {/* Severity-driven Incident Pins */}
          {incidents.map((inc) => {
            const [lng, lat] = inc.location.coordinates;
            const isSelected = activeId === inc._id;
            const sev = inc.severity || 'medium';

            return (
              <Marker
                key={inc._id}
                position={[lat, lng]}
                icon={createCustomPin(sev, isSelected, inc.category)}
                ref={(ref) => {
                  if (ref) markerRefs.current[inc._id] = ref;
                }}
                eventHandlers={{
                  click:      () => { setActiveId(inc._id); },
                  popupclose: () => { setActiveId(null);    },
                }}
              >
                <Popup className="custom-popup">
                  <div className="min-w-[220px] max-w-[260px] p-1 space-y-2">
                    {/* Header: severity + category */}
                    <div className="flex items-center justify-between gap-1">
                      <SeverityBadge severity={inc.severity || 'medium'} />
                      <span className="text-[10px] font-mono text-[var(--color-text-muted)] truncate max-w-[110px]">
                        {CATEGORY_LABELS[inc.category] || inc.category}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-[var(--color-text-primary)] leading-snug">
                      {inc.title}
                    </h4>

                    <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                      {inc.description}
                    </p>

                    <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={inc.status} size="sm" />
                        <span className="text-[10px] text-[var(--color-text-muted)] font-mono">
                          {new Date(inc.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day:   'numeric',
                          })}
                        </span>
                      </div>
                      <Link
                        to={`/incidents/${inc._id}`}
                        className="text-[11px] font-semibold text-[var(--color-primary)] hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>Details</span>
                        <ExternalLink size={11} strokeWidth={2} />
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Dynamic Heatmap Overlay */}
          {showHeatmap && heatmapPoints.length > 0 && (
            <HeatmapLayer points={heatmapPoints} />
          )}
        </MapContainer>
      </div>

      {/* ── 2. Floating Top-Left Explore Bar ──────────────────────────── */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 max-w-[calc(100vw-2rem)]">

        {/* Combined filter pill */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[var(--color-surface)]/95 backdrop-blur-md border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-1 px-2 text-xs font-semibold text-[var(--color-text-secondary)]">
            <Filter size={13} className="text-[var(--color-primary)]" />
            <span className="hidden sm:inline">Filter:</span>
          </div>

          {/* Category */}
          <select
            value={filters.category}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, category: e.target.value }));
              setActiveId(null);
            }}
            className="bg-transparent text-xs font-medium text-[var(--color-text-primary)] px-2 py-1 rounded-md border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
          >
            <option value="">All Types</option>
            {INCIDENT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {/* Status */}
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, status: e.target.value }));
              setActiveId(null);
            }}
            className="bg-transparent text-xs font-medium text-[var(--color-text-primary)] px-2 py-1 rounded-md border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
          >
            <option value="">All Statuses</option>
            {INCIDENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Severity */}
          <select
            value={filters.severity}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, severity: e.target.value }));
              setActiveId(null);
            }}
            className="bg-transparent text-xs font-medium text-[var(--color-text-primary)] px-2 py-1 rounded-md border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
          >
            <option value="">All Severity</option>
            {SEVERITY_LEVELS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Reset */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-md transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <X size={13} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Live counter pill */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--color-surface)]/95 backdrop-blur-md border border-[var(--color-border)] shadow-sm text-xs font-mono text-[var(--color-text-secondary)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
          <span>
            {incidents.length} {incidents.length === 1 ? 'hazard' : 'hazards'}
          </span>
        </div>
      </div>

      {/* ── 3. Floating Top-Right Layer Controls + Severity Legend ───────── */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">

        {/* Layer control pill */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[var(--color-surface)]/95 backdrop-blur-md border border-[var(--color-border)] shadow-sm">

          {/* Heatmap Toggle */}
          <button
            type="button"
            onClick={() => setShowHeatmap((v) => !v)}
            className={`
              inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer
              ${showHeatmap
                ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)]/30 font-semibold'
                : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)]'
              }
            `}
            title="Toggle Density Heatmap"
          >
            <Flame size={13} strokeWidth={2} />
            <span className="hidden sm:inline">Heatmap</span>
          </button>

          {/* Viewport bounds */}
          <button
            type="button"
            onClick={() => setUseBounds((v) => !v)}
            className={`
              inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer
              ${useBounds
                ? 'bg-[var(--color-secondary-light)] text-[var(--color-primary)] border-[var(--color-secondary)]/30 font-semibold'
                : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)]'
              }
            `}
            title="Filter to visible map area"
          >
            <Crosshair size={13} strokeWidth={2} />
            <span className="hidden sm:inline">Visible</span>
          </button>

          {/* Recenter */}
          <button
            type="button"
            onClick={handleRecenterToPerimeter}
            className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] rounded-lg transition-colors cursor-pointer"
            title={hasUserCoords ? 'Center to My Perimeter' : 'Center Map'}
          >
            <Compass size={16} strokeWidth={2} />
          </button>
        </div>

        {/* ── Dual Legend: Category Icons + Severity Colors ─────────── */}
        <div className="bg-[var(--color-surface)]/95 backdrop-blur-md border border-[var(--color-border)] rounded-xl shadow-sm overflow-hidden min-w-[200px]">

          {/* Section 1 — Incident Types (category shapes) */}
          <div className="px-3 pt-2.5 pb-1 border-b border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-1.5 mb-2">
              <ShieldAlert size={11} className="text-[var(--color-text-muted)]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Incident Type</span>
            </div>
            <div className="space-y-1">
              {[
                { cat: 'poor_lighting',       icon: '💡', label: 'Poor Lighting' },
                { cat: 'harassment',           icon: '⚠',  label: 'Harassment' },
                { cat: 'unsafe_intersection',  icon: '✛',  label: 'Unsafe Intersection' },
                { cat: 'suspicious_activity',  icon: '👁',  label: 'Suspicious Activity' },
                { cat: 'other',                icon: '🔧', label: 'Other (Civic Hazard)' },
              ].map(({ cat, icon, label }) => (
                <div key={cat} className="flex items-center gap-2">
                  <span style={{ fontSize: 11, lineHeight: 1 }}>{icon}</span>
                  <span className="text-[11px] text-[var(--color-text-secondary)] font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2 — Risk Level (severity colors) */}
          <div className="px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Risk Level</span>
            </div>
            <div className="space-y-1.5">
              {SEVERITY_LEVELS.map((s) => (
                <div key={s.value} className="flex items-center gap-2">
                  <div style={{
                    width:        s.value === 'high' ? 13 : s.value === 'medium' ? 11 : 9,
                    height:       s.value === 'high' ? 13 : s.value === 'medium' ? 11 : 9,
                    borderRadius: '50%',
                    border:       `2px solid ${s.color}`,
                    backgroundColor: s.bg,
                    flexShrink:   0,
                    boxShadow:    `0 0 0 1.5px ${s.color}33`,
                  }} />
                  <span className="text-[11px] font-bold" style={{ color: s.color }}>
                    {s.label}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-muted)] hidden sm:inline">
                    — {s.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Heatmap density legend (only when heatmap active) */}
        {showHeatmap && (
          <div className="bg-[var(--color-surface)]/95 backdrop-blur-md border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 text-[10px] font-medium text-[var(--color-text-secondary)] flex items-center gap-2 shadow-sm">
            <span className="text-[9px] text-[var(--color-text-muted)] font-mono">LOW</span>
            <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-[#4AAE9B] via-[#C58A24] to-[#C94C4C]" />
            <span className="text-[9px] text-[var(--color-text-muted)] font-mono">HIGH</span>
            <span className="text-[9px] text-[var(--color-text-muted)] font-mono ml-1">DENSITY</span>
          </div>
        )}
      </div>

      {/* ── 4. Collapsible Bottom Incident Drawer ─────────────────────── */}
      <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none flex flex-col items-center">

        {/* Toggle pill */}
        <button
          onClick={() => setIsDrawerOpen((v) => !v)}
          className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-surface)]/95 backdrop-blur-md border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-primary)] shadow-md hover:border-[var(--color-primary)]/40 transition-all cursor-pointer mb-2"
        >
          <MapPin size={13} className="text-[var(--color-primary)]" />
          <span>
            {isDrawerOpen ? 'Hide List' : `Browse ${incidents.length} Incidents`}
          </span>
          {isDrawerOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        {/* Drawer tray */}
        {isDrawerOpen && (
          <div className="pointer-events-auto w-full max-w-4xl max-h-56 overflow-x-auto bg-[var(--color-surface)]/95 backdrop-blur-md border border-[var(--color-border)] rounded-2xl p-3 shadow-lg flex gap-3">
            {isLoading ? (
              <div className="text-xs text-[var(--color-text-muted)] p-4">Loading incidents…</div>
            ) : incidents.length === 0 ? (
              <div className="text-xs text-[var(--color-text-muted)] p-4">
                No incidents match your current filters.
              </div>
            ) : (
              incidents.map((inc) => {
                const isSelected = activeId === inc._id;
                const sev = inc.severity || 'medium';
                const sevColor = getSeverityColor(sev);
                return (
                  <div
                    key={inc._id}
                    onClick={() => handleSelectIncident(inc)}
                    className={`
                      w-64 flex-shrink-0 p-3 rounded-xl border transition-all cursor-pointer select-none
                      ${isSelected
                        ? 'bg-[var(--color-primary-light)] border-[var(--color-primary)] shadow-xs'
                        : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary)]/40'
                      }
                    `}
                  >
                    {/* Severity indicator strip */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <div style={{
                        width:           8,
                        height:          8,
                        borderRadius:    '50%',
                        backgroundColor: sevColor,
                        flexShrink:      0,
                      }} />
                      <span className="text-[10px] font-bold" style={{ color: sevColor }}>
                        {getSeverityLabel(sev)}
                      </span>
                      <span className="ml-auto">
                        <StatusBadge status={inc.status} size="sm" />
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[var(--color-text-primary)] truncate">
                      {inc.title}
                    </h4>
                    <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-1 mt-0.5">
                      {inc.description}
                    </p>

                    <div className="mt-2 pt-1 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
                      <span className="font-mono">
                        {new Date(inc.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day:   'numeric',
                        })}
                      </span>
                      <span className="font-semibold text-[var(--color-primary)]">
                        Locate →
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default MapPage;
