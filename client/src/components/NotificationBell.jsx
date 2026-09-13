/**
 * components/NotificationBell.jsx
 *
 * Shows the notification icon in the Navbar with an unread count badge.
 * Reads unreadCount from SocketContext — no local state needed.
 *
 * The badge disappears when count reaches 0 (user has read all).
 * Clicking navigates to /notifications.
 */
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const NotificationBell = () => {
  const { unreadCount, isConnected } = useSocket();

  return (
    <Link
      to="/notifications"
      id="notification-bell"
      className="relative flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
      title={isConnected ? 'Notifications (live)' : 'Notifications'}
    >
      {/* Bell icon — animated pulse when connected and has unread */}
      <span className={`text-lg ${unreadCount > 0 && isConnected ? 'animate-bounce' : ''}`}>
        🔔
      </span>

      {/* Unread count badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}

      {/* Live connection indicator (tiny green dot) */}
      {isConnected && (
        <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-green-400 rounded-full" />
      )}
    </Link>
  );
};

export default NotificationBell;
