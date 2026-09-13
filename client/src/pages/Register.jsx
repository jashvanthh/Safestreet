/**
 * pages/Register.jsx
 *
 * Same pattern as Login with extras:
 *   - Name field
 *   - Password confirmation (client-side only — server doesn't need it)
 *   - Optional notification location (lat/lng) — uses browser geolocation API
 *     If user allows, we pre-fill their location for proximity alerts.
 *     If they deny, they can set it later in Profile.
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuth from '../hooks/useAuth';

const Register = () => {
  const { login, user } = useAuth();
  const navigate        = useNavigate();

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
  });
  const [error, setError]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState('idle'); // idle | fetching | got | denied
  const [coords, setCoords]      = useState(null);    // { lat, lng }

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleChange = (e) => {
    setError('');
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Ask for geolocation to pre-fill notification location
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('denied');
      return;
    }
    setGeoStatus('fetching');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus('got');
      },
      () => setGeoStatus('denied')
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { name, email, password, confirmPassword } = formData;

    // Client-side validation
    if (!name.trim())                    return setError('Name is required');
    if (!email)                          return setError('Email is required');
    if (password.length < 6)            return setError('Password must be at least 6 characters');
    if (password !== confirmPassword)   return setError('Passwords do not match');

    setIsLoading(true);
    try {
      const payload = { name: name.trim(), email, password };

      // Include geolocation if user allowed it
      if (coords) {
        payload.notificationLocation = {
          type: 'Point',
          coordinates: [coords.lng, coords.lat],   // GeoJSON: [lng, lat]
        };
      }

      const res = await api.post('/auth/register', payload);
      const { token, user: userData } = res.data.data;
      login(token, userData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="SafeStreet" className="h-16 w-auto mx-auto mb-3 object-contain" />
          <h1 className="text-3xl font-bold text-white mb-1">Join SafeStreet</h1>
          <p className="text-slate-400 text-sm">Help keep your neighborhood safe</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl">

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="reg-name" className="block text-sm text-slate-300 mb-1.5">Full name</label>
              <input
                id="reg-name" name="name" type="text" autoComplete="name"
                value={formData.name} onChange={handleChange} placeholder="Jane Smith"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm text-slate-300 mb-1.5">Email address</label>
              <input
                id="reg-email" name="email" type="email" autoComplete="email"
                value={formData.email} onChange={handleChange} placeholder="you@example.com"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm text-slate-300 mb-1.5">Password</label>
              <input
                id="reg-password" name="password" type="password" autoComplete="new-password"
                value={formData.password} onChange={handleChange} placeholder="Min. 6 characters"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="reg-confirm" className="block text-sm text-slate-300 mb-1.5">Confirm password</label>
              <input
                id="reg-confirm" name="confirmPassword" type="password" autoComplete="new-password"
                value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            {/* Geolocation consent */}
            <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-300 text-sm mb-2 font-medium">📍 Notification location</p>
              <p className="text-slate-500 text-xs mb-3">
                Allow location access to receive alerts about incidents near you.
                You can update this later in your profile.
              </p>
              {geoStatus === 'idle' && (
                <button type="button" onClick={requestLocation}
                  className="text-blue-400 hover:text-blue-300 text-sm underline-offset-2 hover:underline">
                  Allow location access
                </button>
              )}
              {geoStatus === 'fetching' && <p className="text-yellow-400 text-xs">Getting location…</p>}
              {geoStatus === 'got' && (
                <p className="text-green-400 text-xs">
                  ✅ Location captured ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
                </p>
              )}
              {geoStatus === 'denied' && (
                <p className="text-slate-500 text-xs">Location denied — you can set it later in Profile.</p>
              )}
            </div>

            <button
              type="submit" disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </>
              ) : 'Create account'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
