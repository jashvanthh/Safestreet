/**
 * pages/Digest.jsx
 *
 * SafeStreet — Weekly Safety Digest.
 * Editorial data-report composition synthesizing narrative intelligence,
 * week-over-week trends, and category hazard distributions.
 * Completely avoids generic card-stack fatigue in favor of an authentic civic document.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCw,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Lightbulb,
  AlertTriangle,
  ShieldAlert,
  Eye,
  CheckCircle2,
  FileText,
  Map,
  Info,
  Calendar,
  Compass,
} from 'lucide-react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button } from '../components/ui';

const CATEGORY_META = {
  poor_lighting: {
    label: 'Poor Lighting',
    icon: Lightbulb,
    color: 'bg-[var(--color-warning)]',
    text: 'text-[var(--color-warning)]',
    bg: 'bg-[var(--color-warning-light)]',
  },
  harassment: {
    label: 'Harassment',
    icon: AlertTriangle,
    color: 'bg-[var(--color-danger)]',
    text: 'text-[var(--color-danger)]',
    bg: 'bg-[var(--color-danger-light)]',
  },
  unsafe_intersection: {
    label: 'Unsafe Intersection',
    icon: ShieldAlert,
    color: 'bg-[var(--color-warning)]',
    text: 'text-[var(--color-warning)]',
    bg: 'bg-[var(--color-warning-light)]',
  },
  suspicious_activity: {
    label: 'Suspicious Activity',
    icon: Eye,
    color: 'text-[var(--color-primary)]',
    text: 'text-[var(--color-primary)]',
    bg: 'bg-[var(--color-primary-light)]',
  },
  other: {
    label: 'Civic Hazards',
    icon: MapPin,
    color: 'bg-[var(--color-secondary)]',
    text: 'text-[var(--color-secondary)]',
    bg: 'bg-[var(--color-secondary-light)]',
  },
};

const Digest = () => {
  const { user } = useAuth();
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

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
      setError(err.response?.data?.message || 'Failed to generate refreshed digest.');
      setRefreshing(false);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Synthesizing weekly safety data report…" />;
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Top category determination
  const topCategoryItem =
    digest?.categorySummary && digest.categorySummary.length > 0
      ? [...digest.categorySummary].sort((a, b) => b.count - a.count)[0]
      : null;

  const topCategoryMeta = topCategoryItem
    ? CATEGORY_META[topCategoryItem.category] || CATEGORY_META.other
    : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--color-bg)] py-8 px-4 sm:px-6 lg:px-8 text-[var(--color-text-primary)]">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ── Document Masthead ──────────────────────────────────────── */}
        <div className="border-b border-[var(--color-border)] pb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="inline-flex items-center gap-2 text-[var(--color-primary)] font-semibold uppercase tracking-wider">
              <FileText size={14} strokeWidth={2.2} />
              <span>Civic Retrospective Report</span>
              <span className="text-[var(--color-text-muted)]">•</span>
              <span className="text-[var(--color-text-muted)] font-mono">Vol. 7-Day</span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="self-start sm:self-auto gap-1.5 text-xs whitespace-nowrap"
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Generating…' : 'Recalculate Telemetry'}</span>
            </Button>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
              Neighborhood Safety Digest
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
              An aggregated 7-day analysis of verified incident dispatches, week-over-week trends, and hazard distributions.
            </p>
          </div>

          {/* Metadata Bar */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-1.5 font-mono">
              <Calendar size={13} className="text-[var(--color-primary)]" />
              <span>
                {digest?.weekStart && digest?.weekEnd
                  ? `${formatDate(digest.weekStart)} — ${formatDate(digest.weekEnd)}`
                  : 'Past 7-Day Cycle'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-mono">
              <Compass size={13} className="text-[var(--color-primary)]" />
              <span>Perimeter: {radiusKm} km radius active</span>
            </div>

            {!hasLocation && (
              <Link to="/profile" className="text-[var(--color-warning)] hover:underline font-medium ml-auto">
                Set home coordinates in profile →
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-[var(--color-danger-light)] border border-[var(--color-danger)]/25 rounded-xl text-xs text-[var(--color-danger)]">
            {error}
          </div>
        )}

        {/* ── Executive Narrative Synthesis (Editorial Lead) ─────────── */}
        <div className="p-5 sm:p-6 rounded-xl bg-[var(--color-surface)] border-l-4 border-[var(--color-primary)] border-t border-r border-b border-[var(--color-border)] shadow-xs space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
            Executive Summary & Narrative Insight
          </span>

          <p className="text-sm sm:text-base font-medium text-[var(--color-text-primary)] leading-relaxed">
            {total === 0 ? (
              `During the monitored 7-day reporting cycle, zero verified safety hazards were filed within your ${radiusKm} km perimeter. Local infrastructure and neighborhood pedestrian routes maintained an optimal baseline.`
            ) : trend === 'up' ? (
              `Incident activity within your ${radiusKm} km perimeter rose this week with ${total} reports registered. The primary concentration was observed in ${topCategoryMeta?.label || 'local hazards'}. Residents are encouraged to review route safety.`
            ) : trend === 'down' ? (
              `Hazard filings within your ${radiusKm} km perimeter decreased to ${total} cases over the past 7 days, reflecting remediations and calmer neighborhood conditions.`
            ) : (
              `Incident volume within your ${radiusKm} km perimeter held stable with ${total} verified safety reports logged during the 7-day period.`
            )}
          </p>

          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            This retrospective is computed dynamically against MongoDB 2dsphere indexes using verified submissions and municipal resolution records.
          </p>
        </div>

        {/* ── Data & Analytics Section: Key Metrics + Chart ─────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

          {/* Left: Quantitative Telemetry (5 Cols) */}
          <div className="md:col-span-5 p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
              Perimeter Telemetry
            </h3>

            <div className="space-y-3 divide-y divide-[var(--color-border-subtle)] text-xs">
              {/* Total Incidents */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[var(--color-text-secondary)]">Total Recorded Hazards</span>
                <span className="text-2xl font-extrabold text-[var(--color-text-primary)] font-mono">
                  {total}
                </span>
              </div>

              {/* Trend Direction */}
              <div className="pt-3 flex items-center justify-between">
                <span className="text-[var(--color-text-secondary)]">7-Day Trajectory</span>
                <div className="flex items-center gap-1.5 font-semibold">
                  {trend === 'up' ? (
                    <span className="inline-flex items-center gap-1 text-[var(--color-danger)]">
                      <TrendingUp size={14} /> Increased
                    </span>
                  ) : trend === 'down' ? (
                    <span className="inline-flex items-center gap-1 text-[var(--color-success)]">
                      <TrendingDown size={14} /> Decreased
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[var(--color-primary)]">
                      <Minus size={14} /> Stable
                    </span>
                  )}
                </div>
              </div>

              {/* Top Hazard */}
              <div className="pt-3 flex items-center justify-between">
                <span className="text-[var(--color-text-secondary)]">Primary Hazard Type</span>
                <span className="font-semibold text-[var(--color-text-primary)]">
                  {topCategoryMeta ? topCategoryMeta.label : 'None Reported'}
                </span>
              </div>

              {/* Monitoring Perimeter */}
              <div className="pt-3 flex items-center justify-between">
                <span className="text-[var(--color-text-secondary)]">Perimeter Radius</span>
                <span className="font-mono text-[var(--color-text-primary)]">
                  {radiusKm} km zone
                </span>
              </div>
            </div>
          </div>

          {/* Right: Proportional Distribution Breakdown (7 Cols) */}
          <div className="md:col-span-7 p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                Category Distribution
              </h3>
              <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
                {digest?.categorySummary?.length || 0} active categories
              </span>
            </div>

            {(!digest?.categorySummary || digest.categorySummary.length === 0) ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 size={32} className="text-[var(--color-primary)] mx-auto" />
                <h4 className="text-xs font-bold text-[var(--color-text-primary)]">
                  Clean Safety Baseline
                </h4>
                <p className="text-[11px] text-[var(--color-text-secondary)] max-w-xs mx-auto">
                  Zero safety hazards or infrastructure concerns were reported within your {radiusKm} km radius over this period.
                </p>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {digest.categorySummary.map((item) => {
                  const meta = CATEGORY_META[item.category] || CATEGORY_META.other;
                  const Icon = meta.icon;
                  const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;

                  return (
                    <div key={item.category} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-[var(--color-text-primary)]">
                          <Icon size={13} className="text-[var(--color-text-muted)]" />
                          <span>{meta.label}</span>
                        </span>
                        <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                          <strong className="text-[var(--color-text-primary)]">{item.count}</strong> ({percentage}%)
                        </span>
                      </div>

                      {/* Bar */}
                      <div className="w-full bg-[var(--color-surface-secondary)] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* ── Civic Advisory & Municipal Action Dispatch ─────────────── */}
        <div className="p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-2">
            <Shield size={14} className="text-[var(--color-primary)]" />
            <span>Civic Protection Guidance</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[var(--color-text-secondary)] leading-relaxed">
            <div className="space-y-2">
              <strong className="text-xs text-[var(--color-text-primary)] block font-semibold">
                Resident Preventative Measures
              </strong>
              <p>
                Take note of poorly lit sectors flagged in this digest. Pedestrians are encouraged to utilize well-illuminated thoroughfares during nocturnal hours and confirm active crosswalk signals.
              </p>
            </div>

            <div className="space-y-2">
              <strong className="text-xs text-[var(--color-text-primary)] block font-semibold">
                Community Reporting Participation
              </strong>
              <p>
                Every filed report feeds directly into weekly trend synthesis. Timely filings enable civic authorities to prioritize repairs before hazards worsen.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--color-border-subtle)] flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
              <Info size={12} />
              Generated automatically every Sunday for registered neighborhood perimeters.
            </span>

            <div className="flex items-center gap-2">
              <Link to="/map">
                <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
                  <Map size={13} />
                  <span>Inspect Live Map</span>
                </Button>
              </Link>
              <Link to="/report">
                <Button variant="primary" size="sm" className="gap-1.5 text-xs shadow-sm">
                  <FileText size={13} />
                  <span>File Safety Report</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Digest;
