/**
 * components/HeatmapLayer.jsx
 *
 * Renders a Leaflet heatmap using the leaflet.heat plugin.
 *
 * WHY A SEPARATE COMPONENT?
 *   leaflet.heat extends the L object with L.heatLayer().
 *   It needs the Leaflet map instance (via useMap()) and must be
 *   rendered inside a <MapContainer>.
 *   Keeping it isolated makes MapPage cleaner.
 *
 * HOW leaflet.heat WORKS:
 *   1. Import 'leaflet.heat' — this has a side effect of adding
 *      L.heatLayer to the global Leaflet object.
 *   2. Call L.heatLayer(points, options).addTo(map)
 *      points format: [[lat, lng, intensity], ...]
 *      (leaflet.heat uses [lat, lng] — Leaflet order, NOT GeoJSON order)
 *   3. Our backend /api/incidents/heatmap already returns [lat, lng, 1.0]
 *      so no conversion needed here.
 *
 * CLEANUP:
 *   useEffect returns a cleanup function that removes the layer when the
 *   component unmounts OR when the points change (to avoid stacking layers).
 *
 * Props:
 *   points — [[lat, lng, intensity], ...] from GET /api/incidents/heatmap
 */
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';  // Side-effect: adds L.heatLayer to the L object

const HeatmapLayer = ({ points }) => {
  const map = useMap();   // Gets the Leaflet map instance from MapContainer context

  useEffect(() => {
    if (!points || points.length === 0) return;

    // Create the heat layer and add it to the map
    const heatLayer = L.heatLayer(points, {
      radius:    25,    // Size of each heat point in pixels
      blur:      15,    // Blur factor — higher = smoother
      maxZoom:   17,    // Stop showing points when zoomed past this
      max:       1.0,   // Maximum intensity value (matches our backend weight of 1.0)
      gradient: {       // Custom colour gradient
        0.2: '#3b82f6',  // blue
        0.5: '#f59e0b',  // amber
        1.0: '#ef4444',  // red
      },
    });

    heatLayer.addTo(map);

    // Cleanup: remove the layer when this effect re-runs or component unmounts
    // Without this, every filter change would stack a new heat layer on the map
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [points, map]);

  return null;  // This component renders nothing — it only adds to the Leaflet map
};

export default HeatmapLayer;
