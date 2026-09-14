/**
 * pages/Register.jsx
 *
 * Registration interface with geolocation onboarding and official SafeStreet tokens.
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, AlertCircle, ArrowRight, MapPin, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import { Card, Button, Input } from '../components/ui';

const Register = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState('idle'); // 'idle' | 'fetching' | 'got' | 'denied'
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleChange = (e) => {
    setError('');
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

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
      () => setGeoStatus('denied'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { name, email, password, confirmPassword } = formData;

    if (!name.trim()) return setError('Please enter your full name');
    if (!email.trim()) return setError('Please enter a valid email address');
    if (password.length < 6) return setError('Password must be at least 6 characters long');
    if (password !== confirmPassword) return setError('Passwords do not match');

    setIsLoading(true);
    try {
      const payload = { name: name.trim(), email: email.trim(), password };

      if (coords) {
        payload.notificationLocation = {
          type: 'Point',
          coordinates: [coords.lng, coords.lat],
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
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--color-bg)] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md space-y-6">

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <img
            src="/logo.png"
            alt="SafeStreet"
            className="h-12 w-auto mx-auto object-contain"
          />
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Create an Account
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Join the neighborhood safety intelligence network
          </p>
        </div>

        {/* Form Container */}
        <Card elevated noPadding className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/25 rounded-lg flex items-center gap-2 text-xs text-[var(--color-danger)]">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="reg-name"
              name="name"
              label="Full Name"
              required
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Jane Resident"
              icon={User}
            />

            <Input
              id="reg-email"
              name="email"
              type="email"
              label="Email Address"
              required
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="jane@example.com"
              icon={Mail}
            />

            <Input
              id="reg-password"
              name="password"
              type="password"
              label="Password"
              required
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              icon={Lock}
            />

            <Input
              id="reg-confirm"
              name="confirmPassword"
              type="password"
              label="Confirm Password"
              required
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              icon={Lock}
            />

            {/* Geolocation Onboarding */}
            <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-[var(--color-text-primary)]">
                <MapPin size={14} className="text-[var(--color-primary)]" />
                <span>Default Notification Location</span>
              </div>
              <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                Allow location access to receive proximity alerts for incidents near your home. You can modify this pin or radius anytime in Profile.
              </p>

              {geoStatus === 'idle' && (
                <button
                  type="button"
                  onClick={requestLocation}
                  className="text-xs font-semibold text-[var(--color-primary)] hover:underline cursor-pointer pt-0.5"
                >
                  Enable Location Detection
                </button>
              )}
              {geoStatus === 'fetching' && (
                <span className="text-[11px] text-[var(--color-warning)] font-mono">
                  Detecting GPS coordinates…
                </span>
              )}
              {geoStatus === 'got' && (
                <div className="inline-flex items-center gap-1 text-[11px] text-[var(--color-success)] font-medium bg-[var(--color-success)]/10 px-2 py-0.5 rounded">
                  <CheckCircle2 size={12} />
                  <span>Pinned: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
                </div>
              )}
              {geoStatus === 'denied' && (
                <span className="text-[11px] text-[var(--color-text-muted)] block">
                  Location access denied. You can manually set your pin in Profile settings later.
                </span>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isLoading}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Account…</span>
                  </>
                ) : (
                  <>
                    <span>Create SafeStreet Account</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="pt-3 border-t border-[var(--color-border)] text-center">
            <p className="text-xs text-[var(--color-text-secondary)]">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default Register;
