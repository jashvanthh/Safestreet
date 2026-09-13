/**
 * components/LocationPicker.jsx
 *
 * An interactive Leaflet map that lets the user pin an incident location.
 *
 * HOW IT WORKS:
 *   1. MapContainer renders the base map (OpenStreetMap tiles)
 *   2. MapClickHandler (inner component) listens for click events
 *      — it MUST be inside <MapContainer> because useMapEvents() needs
 *        the Leaflet map context provided by MapContainer.
 *   3. When user clicks, we call onChange({ lat, lng })
 *   4. FlyToLocation (inner component) smoothly pans the map to the new
 *      marker position using map.flyTo() — triggered whenever value changes.
 *   5. A Marker is rendered at the selected position.
 *
 * LEAFLET DEFAULT ICON FIX (common Vite issue):
 *   Leaflet's default icon images use __webpack_public_path__ which doesn't
 *   exist in Vite. The workaround is to delete _getIconUrl and manually
 *   set the icon image URLs. These CDN links always work regardless of bundler.
 *
 * Props:
 *   value    — { lat: number, lng: number } | null
 *   onChange — (coords: { lat, lng }) => void
 */
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// ── Fix Leaflet default marker icons for Vite ─────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Inner: handles map click events ─────────────────────────────────────────
// Must be a child of MapContainer to access the Leaflet context
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

// ── Inner: smoothly pans map to new marker position ─────────────────────────
const FlyToLocation = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 15, { duration: 1.2 });
    }
  }, [position, map]);
  return null;
};

// ── Main component ────────────────────────────────────────────────────────────
const LocationPicker = ({ value, onChange }) => {
  const DEFAULT_CENTER = [20.5937, 78.9629];  // India center
  const DEFAULT_ZOOM   = 5;

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()    => alert('Location access denied. Click on the map instead.')
    );
  };

  return (
    <div>
      {/* Controls above map */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-slate-400">
          {value
            ? `📍 ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`
            : 'Click the map to pin the incident location'}
        </p>
        <button
          type="button"
          onClick={handleUseMyLocation}
          className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-lg transition-colors"
        >
          Use my location
        </button>
      </div>

      {/* Map */}
      <div className="h-56 rounded-xl overflow-hidden border border-slate-600">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          // Disable scroll zoom so the page doesn't get stuck on the map
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapClickHandler onLocationSelect={onChange} />
          <FlyToLocation position={value} />
          {value && <Marker position={[value.lat, value.lng]} />}
        </MapContainer>
      </div>
    </div>
  );
};

export default LocationPicker;
