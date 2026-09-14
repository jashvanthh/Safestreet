/**
 * pages/Profile.jsx
 *
 * SafeStreet — Resident Profile & Perimeter Settings.
 * Clean settings interface with grouped sections.
 * Explicitly avoids "cards everywhere" in favor of cohesive civic settings groups.
 */
import { useState, useEffect } from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertCircle,
  Save,
  User,
  Shield,
  Compass,
} from 'lucide-react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import LocationPicker from '../components/LocationPicker';
import { Button } from '../components/ui';

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [location, setLocation] = useState(null);
  const [radius, setRadius] = useState(2);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
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
      setError('Please pin your neighborhood location on the map before saving.');
      return;
    }
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const res = await api.patch('/auth/profile', {
        notificationLocation: {
          type: 'Point',
          coordinates: [location.lng, location.lat],
        },
        notificationRadius: radius,
      });

      if (updateUser && res.data?.data?.user) {
        updateUser(res.data.data.user);
      }

      setSuccess(`Perimeter updated successfully. Proximity alerts are now active within ${radius} km of your pin.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update perimeter settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--color-bg)] py-8 px-4 sm:px-6 lg:px-8 text-[var(--color-text-primary)]">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* ── Page Header ────────────────────────────────────────────── */}
        <div className="space-y-1 pb-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
            <Sliders size={13} strokeWidth={2.5} />
            <span>Platform Configuration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Resident Profile & Settings
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Manage your neighborhood perimeter anchor, proximity dispatch distance, and account credentials.
          </p>
        </div>

        {/* ── Grouped Section 1: Resident Identity ───────────────────── */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-1.5">
            <User size={14} className="text-[var(--color-primary)]" />
            <span>Resident Identity</span>
          </h2>

          <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 flex items-center justify-center text-lg font-bold text-[var(--color-primary)] flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'R'}
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  {user?.name}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] font-mono">
                  {user?.email}
                </p>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)]">
                    <Shield size={11} className="text-[var(--color-primary)]" />
                    <span className="capitalize">{user?.role === 'admin' ? 'Authority Administrator' : 'Verified Resident'}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-[var(--color-text-muted)] sm:text-right">
              Resident ID: {user?._id?.slice(-8) || '—'}
            </div>
          </div>
        </section>

        {/* ── Grouped Section 2: Perimeter Calibration ──────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-1.5">
              <Compass size={14} className="text-[var(--color-primary)]" />
              <span>Monitoring Perimeter & Alert Pin</span>
            </h2>
            <span className="text-[11px] font-mono text-[var(--color-primary)] font-semibold">
              {radius} km Radius
            </span>
          </div>

          <div className="p-5 sm:p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-5">
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              SafeStreet uses this location anchor to calculate distance dispatches. When an incident is filed within your chosen radius, instant proximity alerts are pushed to your account.
            </p>

            {/* Feedback Banners */}
            {success && (
              <div className="p-3 bg-[var(--color-primary-light)] border border-[var(--color-primary)]/30 rounded-xl text-xs text-[var(--color-primary)] flex items-center gap-2">
                <CheckCircle2 size={16} className="flex-shrink-0" />
                <span className="font-medium">{success}</span>
              </div>
            )}
            {error && (
              <div className="p-3 bg-[var(--color-danger-light)] border border-[var(--color-danger)]/30 rounded-xl text-xs text-[var(--color-danger)] flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Map Picker */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Pinned Anchor Location
              </label>
              <LocationPicker
                value={location}
                onChange={(coords) => {
                  setLocation(coords);
                  setSuccess('');
                  setError('');
                }}
              />
            </div>

            {/* Radius Slider */}
            <div className="space-y-2 pt-3 border-t border-[var(--color-border-subtle)]">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-text-secondary)]">
                <span>Perimeter Dispatch Radius</span>
                <span className="text-sm font-bold font-mono text-[var(--color-primary)]">
                  {radius} km
                </span>
              </div>

              <input
                type="range"
                min="0.5"
                max="50"
                step="0.5"
                value={radius}
                onChange={(e) => {
                  setRadius(parseFloat(e.target.value));
                  setSuccess('');
                }}
                className="w-full accent-[var(--color-primary)] cursor-pointer"
              />

              <div className="flex justify-between text-[10px] font-mono text-[var(--color-text-muted)]">
                <span>0.5 km (Immediate block)</span>
                <span>25 km (Sector)</span>
                <span>50 km (Metro)</span>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleSave}
                disabled={isSaving || !location}
                className="w-full sm:w-auto gap-2 shadow-sm"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Parameters…</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Save Perimeter Parameters</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* ── Grouped Section 3: Account Specifications ──────────────── */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
            Account Specifications
          </h2>

          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs divide-y divide-[var(--color-border-subtle)] text-xs overflow-hidden">
            <div className="flex justify-between p-3.5 text-[var(--color-text-secondary)]">
              <span>Full Name</span>
              <strong className="text-[var(--color-text-primary)]">{user?.name}</strong>
            </div>
            <div className="flex justify-between p-3.5 text-[var(--color-text-secondary)]">
              <span>Registered Email</span>
              <strong className="text-[var(--color-text-primary)] font-mono">{user?.email}</strong>
            </div>
            <div className="flex justify-between p-3.5 text-[var(--color-text-secondary)]">
              <span>Authority Role</span>
              <strong className="text-[var(--color-text-primary)] capitalize">{user?.role}</strong>
            </div>
            <div className="flex justify-between p-3.5 text-[var(--color-text-secondary)]">
              <span>Session Authorization</span>
              <strong className="text-[var(--color-primary)] font-medium">JWT Secure Verified</strong>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Profile;
