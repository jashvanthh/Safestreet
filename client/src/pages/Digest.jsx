/**
 * pages/Digest.jsx
 *
 * Phase 10 — Weekly Safety Digest
 *
 * Displays localized neighborhood safety statistics:
 *   - Incidents within the user's notification radius over the past 7 days
 *   - Week-over-week trend indicator (up / down / stable)
 *   - Breakdown by incident categories with animated progress bars
 *   - Safety recommendations and action triggers
 *   - On-demand "Generate / Refresh" button to fetch immediate data
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORY_LABELS = {
  poor_lighting:        { label: 'Poor Lighting',        icon: '💡', color: 'bg-amber-500' },
  harassment:           { label: 'Harassment',           icon: '⚠️', color: 'bg-red-500' },
  unsafe_intersection:  { label: 'Unsafe Intersection',  icon: '🚦', color: 'bg-orange-500' },
  suspicious_activity:  { label: 'Suspicious Activity',  icon: '👁️', color: 'bg-purple-500' },
  other:                { label: 'Other Hazards',        icon: '📌', color: 'bg-blue-500' },
};

const Digest = () => {
  const { user } = useAuth();
  const [digest, setDigest]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState('');

  const fetchDigest = async () => {
    try {
      setError('');
      const res = await api.get('/digest/latest');
      setDigest(res.data?.data?.digest || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load safety digest');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDigest();
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError('');
      const res = await api.post('/digest/generate');
      setDigest(res.data?.data?.digest || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate new digest');
      setRefreshing(false);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner message="Loading your neighborhood safety digest..." />
      </div>
    );
  }

  const hasLocation =
    user?.notificationLocation?.coordinates &&
    !(
      user.notificationLocation.coordinates[0] === 0 &&
      user.notificationLocation.coordinates[1] === 0
    );

  const radiusKm = user?.notificationRadius || 2;
  const total = digest?.totalIncidents ?? 0;
  const trend = digest?.trend || 'stable';

  // Format date range: e.g. "Sep 6, 2026 – Sep 13, 2026"
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getSafetyLevel = (count) => {
    if (count === 0) return { label: 'High Safety', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    if (count <= 2)  return { label: 'Moderate Safety', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    if (count <= 5)  return { label: 'Moderate Hazard', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    return { label: 'Caution Advised', badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
  };

  const safetyInfo = getSafetyLevel(total);

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4 text-slate-100">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top Header Card */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📊</span>
                <span className="text-xs font-semibold tracking-wider uppercase text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                  Weekly Safety Digest
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${safetyInfo.badge}`}>
                  {safetyInfo.label}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Neighborhood Safety Overview
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                {digest?.weekStart && digest?.weekEnd
                  ? `${formatDate(digest.weekStart)} — ${formatDate(digest.weekEnd)}`
                  : 'Past 7 Days Reporting Window'}
                {' • '}
                <span className="text-slate-300 font-medium">{radiusKm} km radius zone</span>
              </p>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition-all shadow-md hover:shadow-blue-500/20 shrink-0 cursor-pointer"
              title="Generate fresh statistics right now"
            >
              <svg
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {refreshing ? 'Generating...' : 'Refresh Digest'}
            </button>
          </div>

          {!hasLocation && (
            <div className="mt-5 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span>
                  You have not set your notification pin yet. Showing reports for all areas.
                </span>
              </div>
              <Link
                to="/profile"
                className="underline hover:text-amber-200 font-semibold shrink-0"
              >
                Pin Home in Profile →
              </Link>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Total Incidents */}
          <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-5 shadow">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
              <span>Incidents in Zone</span>
              <span className="text-lg">🛡️</span>
            </div>
            <div className="text-3xl font-extrabold text-white">
              {total}
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Reported within {radiusKm} km this week
            </p>
          </div>

          {/* Card 2: Trend */}
          <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-5 shadow">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
              <span>Week-over-Week Trend</span>
              <span className="text-lg">
                {trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xl font-bold ${
                  trend === 'up'
                    ? 'text-rose-400'
                    : trend === 'down'
                    ? 'text-emerald-400'
                    : 'text-blue-400'
                }`}
              >
                {trend === 'up'
                  ? 'Activity Increased'
                  : trend === 'down'
                  ? 'Activity Decreased'
                  : 'Stable Activity'}
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Compared to previous 7-day period
            </p>
          </div>

          {/* Card 3: Alert Zone Radius */}
          <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-5 shadow">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
              <span>Alert Radius</span>
              <span className="text-lg">🎯</span>
            </div>
            <div className="text-3xl font-extrabold text-blue-400">
              {radiusKm} <span className="text-lg font-normal text-slate-400">km</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="text-slate-400">Zone boundary</span>
              <Link to="/profile" className="text-blue-400 hover:text-blue-300 font-medium">
                Edit in Profile →
              </Link>
            </div>
          </div>
        </div>

        {/* Category Breakdown Section */}
        <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-6 shadow space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🏷️</span> Incident Categories Breakdown
            </h2>
            <span className="text-xs text-slate-400">
              {digest?.categorySummary?.length || 0} categories active
            </span>
          </div>

          {(!digest?.categorySummary || digest.categorySummary.length === 0) ? (
            <div className="py-10 text-center space-y-3">
              <span className="text-4xl block">🎉</span>
              <h3 className="text-white font-semibold">Clean Sheet This Week!</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                No safety hazards or incidents were reported within your {radiusKm} km radius over the past 7 days.
              </p>
              <div className="pt-2">
                <Link
                  to="/report"
                  className="inline-block text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3.5 py-1.5 rounded-lg transition"
                >
                  Spot a hazard? Report it here
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {digest.categorySummary.map((item) => {
                const meta = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.other;
                const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;

                return (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-200 font-medium">
                        <span>{meta.icon}</span>
                        <span>{meta.label}</span>
                      </span>
                      <span className="text-slate-400 font-mono text-xs">
                        <strong className="text-white font-bold">{item.count}</strong> ({percentage}%)
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-slate-700/60 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${meta.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Safety Tips & Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>💡</span> Neighborhood Safety Tips
            </h3>
            <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
              <li>Keep phone charged and share live route when commuting late.</li>
              <li>Report dark alleyways to expedite municipal light installations.</li>
              <li>Stay alert around major cross streets during evening rush hour.</li>
            </ul>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>📢</span> Help Keep Your Streets Safe
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Your eyewitness reports keep your community informed and empower local authorities to act.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/report"
                className="flex-1 text-center bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-3 rounded-xl transition shadow"
              >
                + Report Incident
              </Link>
              <Link
                to="/map"
                className="flex-1 text-center bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold py-2 px-3 rounded-xl transition"
              >
                Explore Live Map
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Digest;
