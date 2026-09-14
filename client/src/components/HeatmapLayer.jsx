/**
 * components/HeatmapLayer.jsx
 *
 * Renders a Leaflet heatmap layer with official SafeStreet intensity gradients.
 */
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

const HeatmapLayer = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    const heatLayer = L.heatLayer(points, {
      radius: 28,
      blur: 18,
      maxZoom: 16,
      max: 1.0,
      gradient: {
        0.2: '#22C7D6', // cyan
        0.5: '#F59E0B', // amber
        1.0: '#EF4444', // red
      },
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [points, map]);

  return null;
};

export default HeatmapLayer;
