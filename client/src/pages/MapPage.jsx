/**
 * pages/MapPage.jsx
 *
 * The main map view — shows all incidents as pins + optional heatmap.
 * Layout: sidebar (filter + list) on the left, full map on the right.
 *
 * DATA FLOW (important for viva):
 *   1. On mount + on filter change: fetch GET /api/incidents?category=&status=&bounds=
 *   2. State: incidents[] (pins), heatmapPoints[] (heatmap), filters, activeId
 *   3. Leaflet map renders:
 *      - One Marker per incident
 *      - Popup on marker click (shows title, category, Details link)
 *      - HeatmapLayer (toggled by showHeatmap state)
 *   4. Sidebar list shows same data as cards; clicking a card pans map to that pin
 *
 * MAP → LIST SYNC:
 *   activeId tracks which incident is selected.
 *   Marker popup opening sets activeId; card click sets activeId + pans map.
 *   This two-way sync is done via refs to the Leaflet Marker instances.
 *
 * BOUNDS-BASED FILTERING:
 *   When user pans/zooms the map, we optionally filter to show only incidents
 *   in the visible viewport. The map fires a 'moveend' event — we read
 *   map.getBounds() and pass it as query params to the server.
 *   The server uses $geoWithin $box to filter MongoDB results.
 *   (toggleable — off by default so new users see everything)
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapContainer, TileLayer, Marker, Popup, useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';
import FilterBar from '../components/FilterBar';
import IncidentCard from '../components/IncidentCard';
import HeatmapLayer from '../components/HeatmapLayer';
import LoadingSpinner from '../components/LoadingSpinner';

// ── Leaflet icon fix (same as LocationPicker) ──────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Category → pin colour mapping ─────────────────────────────────────────
const CATEGORY_ICONS = {
  poor_lighting:       '💡',
  harassment:          '⚠️',
  unsafe_intersection: '🚦',
  suspicious_activity: '👁️',
  other:               '📌',
};

// ── Inner: listens to map bounds changes ────────────────────────────────────
const BoundsTracker = ({ onBoundsChange }) => {
  useMapEvents({
    moveend(e) {
      const b = e.target.getBounds();
      onBoundsChange(
        `${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()}`
      );
    },
  });
  return null;
};

// ── Inner: pans/zooms map to a target position ─────────────────────────────
// Used when user clicks a card in the sidebar
const MapController = ({ target }) => {
  const mapRef = useRef(null);
  useMapEvents({
    load(e) { mapRef.current = e.target; },
  });

  useEffect(() => {
    if (target && mapRef.current) {
      mapRef.current.flyTo([target.lat, target.lng], 15, { duration: 1 });
    }
  }, [target]);

  return null;
};

// ── Main page ────────────────────────────────────────────────────────────────
const MapPage = () => {
  const [incidents,      setIncidents]      = useState([]);
  const [heatmapPoints,  setHeatmapPoints]  = useState([]);
  const [filters,        setFilters]        = useState({ category: '', status: '' });
  const [showHeatmap,    setShowHeatmap]    = useState(false);
  const [useBounds,      setUseBounds]      = useState(false);
  const [bounds,         setBounds]         = useState('');
  const [activeId,       setActiveId]       = useState(null);
  const [isLoading,      setIsLoading]      = useState(true);
  const [mapTarget,      setMapTarget]      = useState(null);

  // Refs to each Leaflet Marker instance (for programmatic popup open)
  const markerRefs = useRef({});

  // ── Fetch incidents ────────────────────────────────────────────────────
  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.status)   params.set('status',   filters.status);
      if (useBounds && bounds) params.set('bounds', bounds);
      params.set('limit', '200');   // Higher limit for map view

      const res = await api.get(`/incidents?${params}`);
      setIncidents(res.data.data.incidents);
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, useBounds, bounds]);

  // ── Fetch heatmap data ─────────────────────────────────────────────────
  const fetchHeatmap = useCallback(async () => {
    if (!showHeatmap) return;
    try {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      const res = await api.get(`/incidents/heatmap?${params}`);
      setHeatmapPoints(res.data.data.points);
    } catch (err) {
      console.error('Failed to fetch heatmap:', err);
    }
  }, [showHeatmap, filters.category]);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);
  useEffect(() => { fetchHeatmap();   }, [fetchHeatmap]);

  // When a card is clicked: set as active + tell the map to fly there
  const handleCardClick = (incident) => {
    const [lng, lat] = incident.location.coordinates;
    setActiveId(incident._id);
    setMapTarget({ lat, lng, id: incident._id });
    // Open the marker popup after a short delay (map is still flying)
    setTimeout(() => {
      if (markerRefs.current[incident._id]) {
        markerRefs.current[incident._id].openPopup();
      }
    }, 1200);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-900">

      {/* ── Top toolbar ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-4 py-3 bg-slate-800 border-b border-slate-700 flex-wrap">
        <FilterBar
          filters={filters}
          onChange={(f) => { setFilters(f); setActiveId(null); }}
          onClear={() => setFilters({ category: '', status: '' })}
        />

        <div className="flex items-center gap-3 ml-auto">
          {/* Heatmap toggle */}
          <button
            id="toggle-heatmap"
            onClick={() => setShowHeatmap((v) => !v)}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              showHeatmap
                ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
            }`}
          >
            🔥 Heatmap
          </button>

          {/* Bounds filter toggle */}
          <button
            id="toggle-bounds"
            onClick={() => setUseBounds((v) => !v)}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              useBounds
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
            }`}
          >
            🗺️ Viewport filter
          </button>

          <span className="text-slate-500 text-sm">{incidents.length} incidents</span>
        </div>
      </div>

      {/* ── Main content: sidebar + map ──────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar — incident list */}
        <div className="w-80 flex-shrink-0 overflow-y-auto bg-slate-900 border-r border-slate-700/50 p-3 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Loading…</div>
          ) : incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-sm text-center">
              <p>No incidents found</p>
              <p className="text-xs mt-1">Try adjusting the filters</p>
            </div>
          ) : (
            incidents.map((inc) => (
              <IncidentCard
                key={inc._id}
                incident={inc}
                isActive={activeId === inc._id}
                onClick={() => handleCardClick(inc)}
              />
            ))
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={[20.5937, 78.9629]}  // India center
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {/* Track map bounds for viewport filtering */}
            <BoundsTracker onBoundsChange={(b) => { setBounds(b); }} />

            {/* Map controller (flies to clicked card) */}
            <MapController target={mapTarget} />

            {/* Incident pins */}
            {incidents.map((inc) => {
              const [lng, lat] = inc.location.coordinates;
              return (
                <Marker
                  key={inc._id}
                  position={[lat, lng]}
                  ref={(ref) => { if (ref) markerRefs.current[inc._id] = ref; }}
                  eventHandlers={{
                    click: () => setActiveId(inc._id),
                    popupclose: () => setActiveId(null),
                  }}
                >
                  <Popup>
                    <div className="text-slate-900 min-w-[180px]">
                      <p className="text-xs text-slate-500 mb-0.5">
                        {CATEGORY_ICONS[inc.category]} {inc.category.replace(/_/g, ' ')}
                      </p>
                      <p className="font-semibold text-sm leading-tight mb-1">{inc.title}</p>
                      <p className="text-xs text-slate-600 mb-2 line-clamp-2">{inc.description}</p>
                      <a
                        href={`/incidents/${inc._id}`}
                        className="text-blue-600 hover:underline text-xs font-medium"
                      >
                        View details →
                      </a>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Heatmap layer (only rendered when toggled on) */}
            {showHeatmap && heatmapPoints.length > 0 && (
              <HeatmapLayer points={heatmapPoints} />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
