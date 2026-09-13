/**
 * pages/Profile.jsx
 *
 * Lets the user update their notification location and radius.
 * These two settings control which incidents trigger a proximity alert.
 *
 * HOW NOTIFICATION LOCATION WORKS (explain in viva):
 *   1. User sets their "home" location here (or during Register)
 *   2. When a new incident is created, the server runs:
 *      notifyNearbyUsers(incident) → finds users within their own radius
 *   3. If the incident is within THIS user's notificationRadius km of their
 *      notificationLocation → they get a Notification + socket event
 *
 * The notificationLocation is stored as GeoJSON Point in MongoDB.
 * We convert: LocationPicker {lat, lng} → GeoJSON {type:'Point', coordinates:[lng,lat]}
 *
 * The radius slider controls how large the user's "alert zone" is.
 */
import { useState, useEffect } from 'react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import LocationPicker from '../components/LocationPicker';

const Profile = () => {
  const { user } = useAuth();

  // Location state: we display in Leaflet [lat,lng] order
  const [location, setLocation] = useState(null);   // { lat, lng }
  const [radius,   setRadius]   = useState(2);       // km
  const [isSaving, setIsSaving] = useState(false);
  const [success,  setSuccess]  = useState('');
  const [error,    setError]    = useState('');

  // Initialise from current user data
  useEffect(() => {
    if (!user) return;

    // notificationLocation is GeoJSON [lng, lat] — swap for Leaflet
    const coords = user.notificationLocation?.coordinates;
    if (coords && !(coords[0] === 0 && coords[1] === 0)) {
      setLocation({ lat: coords[1], lng: coords[0] });
    }
    if (user.notificationRadius) {
      setRadius(user.notificationRadius);
    }
  }, [user]);

  const handleSave = async () => {
    if (!location) {
      setError('Please pin your location on the map first.');
      return;
    }
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      await api.patch('/auth/profile', {
        notificationLocation: {
          type:        'Point',
          coordinates: [location.lng, location.lat],  // GeoJSON: [lng, lat]
        },
        notificationRadius: radius,
      });
      setSuccess(`Settings saved! You will receive alerts for incidents within ${radius} km of this location.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-2xl">
            {user?.name?.[0]?.toUpperCase() || '👤'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
              user?.role === 'admin'
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {user?.role === 'admin' ? '⚙️ Admin' : '🏘️ Resident'}
            </span>
          </div>
        </div>

        {/* Settings card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-6">
          <h2 className="text-white font-semibold text-lg">🔔 Notification Settings</h2>
          <p className="text-slate-400 text-sm -mt-4">
            Set your location so SafeStreet can alert you about incidents nearby.
          </p>

          {/* Success / Error banners */}
          {success && (
            <div className="px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
              ✅ {success}
            </div>
          )}
          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Location picker */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Your notification location
            </label>
            <LocationPicker
              value={location}
              onChange={(coords) => { setLocation(coords); setSuccess(''); setError(''); }}
            />
            <p className="text-slate-500 text-xs mt-2">
              Click the map or use "Use my location" to set where you want alerts centred.
            </p>
          </div>

          {/* Radius slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">
                Alert radius
              </label>
              <span className="text-blue-400 font-semibold text-sm">{radius} km</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="50"
              step="0.5"
              value={radius}
              onChange={(e) => setRadius(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-slate-500 text-xs mt-1">
              <span>0.5 km</span>
              <span>50 km</span>
            </div>
            <p className="text-slate-500 text-xs mt-2">
              You'll receive alerts for incidents reported within <strong className="text-slate-300">{radius} km</strong> of your pinned location.
            </p>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={isSaving || !location}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : '💾 Save Notification Settings'}
          </button>
        </div>

        {/* Account info (read-only) */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 mt-4 space-y-3">
          <h2 className="text-white font-semibold">Account Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Name</span>
              <span className="text-white">{user?.name}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Email</span>
              <span className="text-white">{user?.email}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Role</span>
              <span className="text-white capitalize">{user?.role}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
