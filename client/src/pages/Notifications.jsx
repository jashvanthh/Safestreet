/**
 * pages/Notifications.jsx
 *
 * Shows the user's full notification history (from API) plus any real-time
 * notifications received during the current session (from SocketContext).
 *
 * Two sources of data:
 *   1. REST API: GET /api/notifications — historical, includes offline-delivered ones
 *   2. SocketContext.liveNotifs — received in real-time this session
 *
 * We merge them, dedup by _id, and show newest first.
 * Marking all as read:
 *   - PATCH /api/notifications/read-all (server)
 *   - clearUnread() (resets context counter → NotificationBell clears)
 *   - setAll local state to isRead: true
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORY_ICONS = {
  poor_lighting:       '💡',
  harassment:          '⚠️',
  unsafe_intersection: '🚦',
  suspicious_activity: '👁️',
  other:               '📌',
};

const Notifications = () => {
  const { liveNotifs, clearUnread } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [isMarking,     setIsMarking]     = useState(false);

  // ── Fetch historical notifications from API ────────────────────────────
  useEffect(() => {
    api.get('/notifications?limit=50')
      .then((res) => {
        setNotifications(res.data.data.notifications);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // ── Merge live notifications (deduped by _id) ──────────────────────────
  // liveNotifs may include ones already in the API response if user is fast
  const allNotifications = [
    ...liveNotifs.filter((ln) => !notifications.some((n) => n._id === ln._id)),
    ...notifications,
  ];

  // ── Mark all as read ───────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    setIsMarking(true);
    try {
      await api.patch('/notifications/read-all');
      // Update local state — mark all as read
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      clearUnread();  // Reset bell count in SocketContext
    } catch (err) {
      console.error('Mark all read failed:', err);
    } finally {
      setIsMarking(false);
    }
  };

  const unreadCount = allNotifications.filter((n) => !n.isRead).length;

  if (isLoading) return <LoadingSpinner message="Loading notifications…" />;

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              🔔 Notifications
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="text-slate-400 text-sm mt-1">Incidents reported near your location</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={isMarking}
              className="text-sm text-blue-400 hover:text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {isMarking ? 'Marking…' : '✓ Mark all read'}
            </button>
          )}
        </div>

        {/* Notification list */}
        {allNotifications.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center">
            <span className="text-5xl block mb-4">🔕</span>
            <h2 className="text-white font-semibold mb-2">No notifications yet</h2>
            <p className="text-slate-400 text-sm">
              You'll be notified when incidents are reported near your location.
            </p>
            <Link to="/profile" className="text-blue-400 hover:underline text-sm mt-4 block">
              Update your notification location →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {allNotifications.map((notif) => {
              const category = notif.incident?.category;
              const icon = CATEGORY_ICONS[category] || '📍';

              return (
                <div
                  key={notif._id}
                  className={`
                    bg-slate-800 border rounded-xl p-4 transition-all
                    ${notif.isRead
                      ? 'border-slate-700/50 opacity-60'
                      : 'border-blue-500/30 bg-gradient-to-r from-blue-600/5 to-transparent'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${notif.isRead ? 'text-slate-400' : 'text-white font-medium'}`}>
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-slate-500 text-xs">
                          {new Date(notif.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium', timeStyle: 'short',
                          })}
                        </span>
                        {notif.incident?._id && (
                          <Link
                            to={`/incidents/${notif.incident._id}`}
                            className="text-blue-400 hover:text-blue-300 text-xs"
                          >
                            View →
                          </Link>
                        )}
                      </div>
                    </div>
                    {!notif.isRead && (
                      <span className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                    )}
                  </div>
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
