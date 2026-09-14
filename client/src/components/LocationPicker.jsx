/**
 * components/LocationPicker.jsx
 *
 * Interactive Leaflet map for selecting incident location.
 * Provides live coordinate readouts and one-tap current geolocation.
 */
import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { MapPin, Navigation, CheckCircle2 } from 'lucide-react';
import L from 'leaflet';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../utils/constants';

// Fix Leaflet marker icon URLs
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      if (e?.latlng) {
        onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
};

const FlyToLocation = ({ position, shouldFly, onFlown }) => {
  const map = useMap();
  useEffect(() => {
    if (position && shouldFly) {
      map.flyTo([position.lat, position.lng], 15, { duration: 0.8 });
      if (onFlown) onFlown();
    }
  }, [position, shouldFly, map, onFlown]);
  return null;
};

const LocationPicker = ({ value, onChange }) => {
  const [shouldFly, setShouldFly] = useState(false);
  const [locating, setLocating] = useState(false);
  const initialFlown = useRef(false);

  useEffect(() => {
    if (value && !initialFlown.current) {
      initialFlown.current = true;
      setShouldFly(true);
    }
  }, [value]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setShouldFly(true);
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocating(false);
        alert('Location access denied. Please click on the map to pin the incident manually.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="space-y-2">
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {value ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-success)] font-medium bg-[var(--color-success)]/10 px-2.5 py-1 rounded-md border border-[var(--color-success)]/25">
              <CheckCircle2 size={13} strokeWidth={2.5} />
              Coordinates: {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
              <MapPin size={13} strokeWidth={2} />
              Click on the map to drop the incident pin
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)] border border-[var(--color-border)] px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          <Navigation size={13} strokeWidth={2} className={locating ? 'animate-spin' : ''} />
          <span>{locating ? 'Locating…' : 'Use My Current Location'}</span>
        </button>
      </div>

      {/* Map Container */}
      <div className="h-64 sm:h-72 rounded-xl overflow-hidden border border-[var(--color-border)] shadow-inner relative">
        <MapContainer
          center={value ? [value.lat, value.lng] : DEFAULT_MAP_CENTER}
          zoom={value ? 14 : DEFAULT_MAP_ZOOM}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapClickHandler onLocationSelect={onChange} />
          <FlyToLocation
            position={value}
            shouldFly={shouldFly}
            onFlown={() => setShouldFly(false)}
          />
          {value && <Marker position={[value.lat, value.lng]} />}
        </MapContainer>
      </div>
    </div>
  );
};

export default LocationPicker;
