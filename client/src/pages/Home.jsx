/**
 * pages/Home.jsx
 *
 * SafeStreet — Personalized Neighborhood Briefing.
 * Prioritizes recent local activity, perimeter awareness, nearby reports, and rapid reporting actions.
 * Explicitly rejects generic KPI dashboard card grids in favor of an authentic civic briefing.
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  Map,
  Shield,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
  Eye,
  MapPin,
  ChevronRight,
  Bell,
  BarChart3,
  Compass,
  Sliders,
  Radio,
  ArrowRight,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { Button } from '../components/ui';
import StatusBadge from '../components/StatusBadge';

const CATEGORY_META = {
  poor_lighting: {
    label: 'Poor Lighting',
    icon: Lightbulb,
    color: 'text-[var(--color-warning)]',
    bg: 'bg-[var(--color-warning-light)]',
    border: 'border-[var(--color-warning)]/20',
  },
  harassment: {
    label: 'Harassment',
    icon: AlertTriangle,
    color: 'text-[var(--color-danger)]',
    bg: 'bg-[var(--color-danger-light)]',
    border: 'border-[var(--color-danger)]/20',
  },
  unsafe_intersection: {
    label: 'Unsafe Intersection',
    icon: ShieldAlert,
    color: 'text-[var(--color-warning)]',
    bg: 'bg-[var(--color-warning-light)]',
    border: 'border-[var(--color-warning)]/20',
  },
  suspicious_activity: {
    label: 'Suspicious Activity',
    icon: Eye,
    color: 'text-[var(--color-primary)]',
    bg: 'bg-[var(--color-primary-light)]',
    border: 'border-[var(--color-primary)]/20',
  },
  other: {
    label: 'Civic Hazard',
    icon: MapPin,
    color: 'text-[var(--color-text-secondary)]',
    bg: 'bg-[var(--color-surface-secondary)]',
    border: 'border-[var(--color-border)]',
  },
};

const Home = () => {
  const { user } = useAuth();
  const { unreadCount, isConnected } = useSocket();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'nearby'
  const [incidents, setIncidents] = useState([]);
  const [nearbyIncidents, setNearbyIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNearbySupport, setHasNearbySupport] = useState(false);

  const radius = user?.notificationRadius || 5;
  const userCoords = user?.notificationLocation?.coordinates;
  const hasCoordinates =
    Array.isArray(userCoords) &&
    userCoords.length === 2 &&
    !(userCoords[0] === 0 && userCoords[1] === 0);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Always fetch recent community incidents
      const recentRes = await api.get('/incidents?limit=15');
      const allList = recentRes.data?.data?.incidents || [];
      setIncidents(allList);

      // 2. If user has saved coordinates, fetch proximity incidents
      if (hasCoordinates) {
        const [lng, lat] = userCoords;
        const nearbyRes = await api.get(
          `/incidents/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
        );
        const nearList = nearbyRes.data?.data?.incidents || [];
        setNearbyIncidents(nearList);
        setHasNearbySupport(true);
        if (nearList.length > 0) {
          setActiveTab('nearby');
        }
      }
    } catch (err) {
      console.error('Failed to load briefing telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  }, [hasCoordinates, userCoords, radius]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Determine greeting based on local time
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'Resident';

  const displayedList = activeTab === 'nearby' ? nearbyIncidents : incidents;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--color-bg)] py-6 sm:py-8 px-4 sm:px-6 lg:px-8 text-[var(--color-text-primary)]">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Section: Personalized Neighborhood Briefing Bar ───────── */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                  <Radio size={12} className={isConnected ? 'animate-pulse text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'} />
                  {isConnected ? 'Live Telemetry Active' : 'Connecting to Dispatch'}
                </span>

                <span className="text-[var(--color-text-muted)] hidden sm:inline">•</span>

                <span className="text-[var(--color-text-secondary)] text-xs hidden sm:inline">
                  {hasCoordinates ? (
                    <span>Perimeter: <strong className="font-semibold text-[var(--color-text-primary)]">{radius} km</strong> zone</span>
                  ) : (
                    <Link to="/profile" className="text-[var(--color-warning)] hover:underline font-medium">
                      Location not set — Set home perimeter
                    </Link>
                  )}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
                {timeGreeting}, {firstName}.
              </h1>

              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {hasCoordinates
                  ? `Monitoring verified safety filings within your ${radius} km neighborhood perimeter.`
                  : 'Welcome to your civic safety briefing. Set your notification radius in profile to receive real-time proximity alerts.'}
              </p>
            </div>

            {/* Direct Reporting & Map Actions */}
            <div className="flex items-center gap-2.5 flex-shrink-0 pt-1 lg:pt-0">
              <Link to="/report">
                <Button variant="primary" size="md" className="gap-2 shadow-sm">
                  <PlusCircle size={15} strokeWidth={2.2} />
                  <span>Report Hazard</span>
                </Button>
              </Link>
              <Link to="/map">
                <Button variant="secondary" size="md" className="gap-2">
                  <Map size={15} strokeWidth={2} />
                  <span>Safety Map</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Section: Asymmetric Main Layout (Feed + Context Sidebar) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── Left Column: Neighborhood Activity Feed (8 Cols) ───────── */}
          <div className="lg:col-span-8 space-y-4">

            {/* Feed Control & Filter Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[var(--color-border)]">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                  Neighborhood Safety Feed
                </h2>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                  Verified hazard filings sorted by latest occurrence
                </p>
              </div>

              {/* Feed Switcher */}
              <div className="inline-flex p-0.5 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-xs">
                {hasNearbySupport && (
                  <button
                    onClick={() => setActiveTab('nearby')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      activeTab === 'nearby'
                        ? 'bg-[var(--color-surface)] text-[var(--color-primary)] font-semibold shadow-xs'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    Nearby Within {radius}km ({nearbyIncidents.length})
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-[var(--color-surface)] text-[var(--color-primary)] font-semibold shadow-xs'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  All Community Reports ({incidents.length})
                </button>
              </div>
            </div>

            {/* Incident List Presentation */}
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-2 animate-pulse"
                  >
                    <div className="h-4 bg-[var(--color-surface-secondary)] rounded-md w-1/4" />
                    <div className="h-5 bg-[var(--color-surface-secondary)] rounded-md w-3/4" />
                    <div className="h-3 bg-[var(--color-surface-secondary)] rounded-md w-1/2" />
                  </div>
                ))}
              </div>
            ) : displayedList.length === 0 ? (
              /* High-Polish Civic Empty State */
              <div className="p-8 sm:p-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center mx-auto">
                  <Shield size={22} strokeWidth={2} />
                </div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  {activeTab === 'nearby'
                    ? `No incidents found within your ${radius} km perimeter`
                    : 'No verified incidents filed yet'}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] max-w-md mx-auto leading-relaxed">
                  {activeTab === 'nearby'
                    ? 'Your immediate neighborhood perimeter currently has zero reported hazards. You can expand your radius in Profile or view all community reports.'
                    : 'Your community has no reported hazards recorded in the system. Be proactive and report the first concern if you spot one.'}
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                  <Link to="/report">
                    <Button variant="primary" size="sm">
                      Submit a Report
                    </Button>
                  </Link>
                  {activeTab === 'nearby' && (
                    <button
                      onClick={() => setActiveTab('all')}
                      className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                    >
                      View All Reports
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Clean Civic Activity Feed Rows */
              <div className="space-y-2.5">
                {displayedList.map((inc) => {
                  const meta = CATEGORY_META[inc.category] || CATEGORY_META.other;
                  const Icon = meta.icon;

                  const dateFormatted = new Date(inc.createdAt).toLocaleDateString(
                    'en-US',
                    {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  );

                  return (
                    <Link
                      key={inc._id}
                      to={`/incidents/${inc._id}`}
                      className="group block p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:shadow-xs transition-all"
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Category Icon Badge */}
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg} ${meta.color} border ${meta.border}`}
                        >
                          <Icon size={17} strokeWidth={2} />
                        </div>

                        {/* Middle Content */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
                              {meta.label}
                            </span>
                            <StatusBadge status={inc.status} />
                            <span className="text-[11px] text-[var(--color-text-muted)] font-mono ml-auto">
                              {dateFormatted}
                            </span>
                          </div>

                          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                            {inc.title}
                          </h3>

                          <p className="text-xs text-[var(--color-text-secondary)] line-clamp-1">
                            {inc.description}
                          </p>

                          {/* Secondary Metadata */}
                          <div className="flex items-center gap-3 pt-1 text-[11px] text-[var(--color-text-muted)]">
                            <span className="inline-flex items-center gap-1 font-mono">
                              <MapPin size={12} className="text-[var(--color-text-muted)]" />
                              {inc.location?.coordinates
                                ? `${inc.location.coordinates[1]?.toFixed(4)}°, ${inc.location.coordinates[0]?.toFixed(4)}°`
                                : 'Geotagged'}
                            </span>
                            {inc.photoUrl && (
                              <span className="text-[10px] uppercase font-semibold text-[var(--color-secondary)]">
                                Photo Attached
                              </span>
                            )}
                            {inc.isAnonymous && (
                              <span className="text-[10px] text-[var(--color-text-muted)] italic">
                                Anonymous filing
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="self-center pl-1 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all">
                          <ChevronRight size={16} strokeWidth={2} />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Right Column: Perimeter Status & Direct Actions (4 Cols) ─ */}
          <div className="lg:col-span-4 space-y-5">

            {/* Card 1: Resident Perimeter Status */}
            <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass size={16} className="text-[var(--color-primary)]" strokeWidth={2.2} />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                    Perimeter Calibration
                  </h3>
                </div>
                <Link
                  to="/profile"
                  className="text-[11px] font-medium text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
                >
                  <Sliders size={12} />
                  <span>Configure</span>
                </Link>
              </div>

              {hasCoordinates ? (
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)] space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                      <span>Monitored Radius</span>
                      <strong className="text-[var(--color-text-primary)] font-mono font-semibold">
                        {radius} km zone
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                      <span>Perimeter Origin</span>
                      <span className="font-mono text-[var(--color-text-secondary)]">
                        {userCoords[1]?.toFixed(3)}° N, {userCoords[0]?.toFixed(3)}° E
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] leading-normal">
                    You automatically receive real-time notifications for any incident filed inside this perimeter.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 text-xs">
                  <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                    You have not set your notification coordinates yet. Set your home or workplace coordinates to receive proximity alerts.
                  </p>
                  <Link to="/profile" className="block">
                    <Button variant="secondary" size="sm" className="w-full text-xs">
                      Set Notification Location
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Card 2: Essential Civic Operations (Grouped list, NOT cards) */}
            <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                Civic Operations
              </h3>

              <div className="divide-y divide-[var(--color-border-subtle)] text-xs">
                {/* Safety Map */}
                <Link
                  to="/map"
                  className="flex items-center justify-between py-2.5 hover:text-[var(--color-primary)] transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <Map size={15} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
                    <span className="font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)]">
                      Interactive Safety Map
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-[var(--color-text-muted)]" />
                </Link>

                {/* Notifications */}
                <Link
                  to="/notifications"
                  className="flex items-center justify-between py-2.5 hover:text-[var(--color-primary)] transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <Bell size={15} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
                    <span className="font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)]">
                      Proximity Notifications
                    </span>
                  </div>
                  {unreadCount > 0 ? (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[var(--color-danger)] text-white font-mono">
                      {unreadCount}
                    </span>
                  ) : (
                    <ChevronRight size={14} className="text-[var(--color-text-muted)]" />
                  )}
                </Link>

                {/* Weekly Digest */}
                <Link
                  to="/digest"
                  className="flex items-center justify-between py-2.5 hover:text-[var(--color-primary)] transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <BarChart3 size={15} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
                    <span className="font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)]">
                      Weekly Safety Digest
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-[var(--color-text-muted)]" />
                </Link>
              </div>
            </div>

            {/* Authority Triage Callout (if admin) */}
            {user?.role === 'admin' && (
              <div className="p-4 rounded-xl border border-[var(--color-secondary)]/30 bg-[var(--color-secondary-light)] space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-[var(--color-primary)] uppercase tracking-wider text-[11px]">
                  <Shield size={14} strokeWidth={2.2} />
                  <span>Authority Queue</span>
                </div>
                <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                  You have administrative triage privileges to verify, update statuses, or moderate community filings.
                </p>
                <Link to="/admin" className="inline-flex items-center gap-1 font-semibold text-[var(--color-primary)] hover:underline pt-1">
                  <span>Open Triage Console</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default Home;
