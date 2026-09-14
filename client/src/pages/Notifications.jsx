/**
 * pages/Notifications.jsx
 *
 * SafeStreet — Proximity Notifications Inbox.
 * Authentic inbox/feed composition for real-time proximity alerts and historical dispatches.
 * Explicitly eliminates dashboard card grids in favor of a unified civic inbox feed.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BellOff,
  CheckCheck,
  ChevronRight,
  Lightbulb,
  AlertTriangle,
  ShieldAlert,
  Eye,
  MapPin,
  Clock,
  Sliders,
  Inbox,
} from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button } from '../components/ui';

const CATEGORY_META = {
  poor_lighting: {
    label: 'Lighting',
    icon: Lightbulb,
    color: 'text-[var(--color-warning)]',
    bg: 'bg-[var(--color-warning-light)]',
  },
  harassment: {
    label: 'Harassment',
    icon: AlertTriangle,
    color: 'text-[var(--color-danger)]',
    bg: 'bg-[var(--color-danger-light)]',
  },
  unsafe_intersection: {
    label: 'Intersection',
    icon: ShieldAlert,
    color: 'text-[var(--color-warning)]',
    bg: 'bg-[var(--color-warning-light)]',
  },
  suspicious_activity: {
    label: 'Suspicious',
    icon: Eye,
    color: 'text-[var(--color-primary)]',
    bg: 'bg-[var(--color-primary-light)]',
  },
  other: {
    label: 'Civic',
    icon: MapPin,
    color: 'text-[var(--color-text-secondary)]',
    bg: 'bg-[var(--color-surface-secondary)]',
  },
};

const Notifications = () => {
  const { liveNotifs, clearUnread } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread'
  const [isLoading, setIsLoading] = useState(true);
  const [isMarking, setIsMarking] = useState(false);

  useEffect(() => {
    api.get('/notifications?limit=50')
      .then((res) => {
        setNotifications(res.data?.data?.notifications || []);
      })
      .catch((err) => {
        console.error('Failed to load notifications:', err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Merge live socket events with historical dispatches, newest first
  const allNotifications = [
    ...liveNotifs.filter((ln) => !notifications.some((n) => n._id === ln._id)),
    ...notifications,
  ];

  const handleMarkAllRead = async () => {
    setIsMarking(true);
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      clearUnread();
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    } finally {
      setIsMarking(false);
    }
  };

  const unreadCount = allNotifications.filter((n) => !n.isRead).length;

  const displayedNotifications = filterTab === 'unread'
    ? allNotifications.filter((n) => !n.isRead)
    : allNotifications;

  if (isLoading) return <LoadingSpinner message="Accessing notification dispatch logs…" />;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--color-bg)] py-8 px-4 sm:px-6 lg:px-8 text-[var(--color-text-primary)]">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Inbox Toolbar Header ───────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Inbox size={18} className="text-[var(--color-primary)]" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
                Proximity Dispatch Inbox
              </h1>
              {unreadCount > 0 && (
                <span className="bg-[var(--color-primary)] text-white text-[11px] font-bold px-2 py-0.5 rounded-full font-mono">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Geospatial proximity dispatches for incidents filed within your monitored perimeter.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {unreadCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={isMarking}
                className="gap-1.5 text-xs whitespace-nowrap"
              >
                <CheckCheck size={14} strokeWidth={2.2} />
                <span>{isMarking ? 'Marking…' : 'Mark all read'}</span>
              </Button>
            )}

            <Link
              to="/profile"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors"
              title="Calibrate Perimeter Radius"
            >
              <Sliders size={13} />
              <span className="hidden sm:inline">Perimeter Radius</span>
            </Link>
          </div>
        </div>

        {/* ── Filter Segment Bar ─────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex p-0.5 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-xs">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-[var(--color-surface)] text-[var(--color-primary)] font-semibold shadow-xs'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              All Dispatches ({allNotifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('unread')}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filterTab === 'unread'
                  ? 'bg-[var(--color-surface)] text-[var(--color-primary)] font-semibold shadow-xs'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
            {displayedNotifications.length} entries
          </span>
        </div>

        {/* ── Unified Inbox Feed Container ──────────────────────────── */}
        {displayedNotifications.length === 0 ? (
          /* High-Polish Empty Inbox State */
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-center py-16 px-4 space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center mx-auto">
              <BellOff size={22} strokeWidth={1.8} />
            </div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
              {filterTab === 'unread' ? 'All caught up' : 'Your proximity inbox is empty'}
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto leading-relaxed">
              {filterTab === 'unread'
                ? 'There are no pending unread notifications in your queue.'
                : 'Whenever an incident is reported within your notification perimeter, verified dispatches will appear in this feed.'}
            </p>
            <div className="pt-2">
              <Link to="/profile">
                <Button variant="secondary" size="sm">
                  Review Perimeter in Profile
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Contiguous Inbox Table/Feed */
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs divide-y divide-[var(--color-border-subtle)] overflow-hidden">
            {displayedNotifications.map((notif) => {
              const category = notif.incident?.category;
              const meta = CATEGORY_META[category] || CATEGORY_META.other;
              const Icon = meta.icon;

              return (
                <div
                  key={notif._id}
                  className={`
                    flex items-start sm:items-center gap-3 p-3.5 sm:px-4 sm:py-3.5 transition-colors group relative
                    ${notif.isRead
                      ? 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)]/50'
                      : 'bg-[var(--color-primary-light)]/30 hover:bg-[var(--color-primary-light)]/50'
                    }
                  `}
                >
                  {/* Left Unread Indicator Bar */}
                  <div
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 sm:mt-0 ${
                      notif.isRead ? 'bg-transparent' : 'bg-[var(--color-primary)]'
                    }`}
                  />

                  {/* Category Pill Icon */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg} ${meta.color} border border-[var(--color-border-subtle)]`}
                  >
                    <Icon size={14} strokeWidth={2} />
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
                    <p
                      className={`text-xs leading-snug flex-1 truncate ${
                        notif.isRead
                          ? 'text-[var(--color-text-secondary)] font-normal'
                          : 'text-[var(--color-text-primary)] font-semibold'
                      }`}
                    >
                      {notif.message}
                    </p>

                    {/* Timestamp */}
                    <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-muted)] font-mono whitespace-nowrap">
                      <Clock size={11} />
                      <span>
                        {new Date(notif.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Action Link */}
                  {notif.incident?._id && (
                    <Link
                      to={`/incidents/${notif.incident._id}`}
                      className="text-xs font-semibold text-[var(--color-primary)] hover:underline inline-flex items-center gap-0.5 pl-2 flex-shrink-0"
                    >
                      <span className="hidden sm:inline">View Case</span>
                      <ChevronRight size={13} strokeWidth={2.5} />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default Notifications;
