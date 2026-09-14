/**
 * components/NotificationBell.jsx
 *
 * Professional SVG notification bell with unread count badge and live socket indicator.
 */
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const NotificationBell = () => {
  const { unreadCount, isConnected } = useSocket();

  return (
    <Link
      to="/notifications"
      id="notification-bell"
      className="relative p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors inline-flex items-center justify-center group"
      title={isConnected ? 'Notifications (Live Connected)' : 'Notifications (Connecting…)'}
      aria-label="View notifications"
    >
      <Bell size={18} strokeWidth={2} className="transition-transform group-hover:scale-105" />

      {/* Unread Count Badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-[var(--color-danger)] text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center leading-none shadow-xs">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {/* Live Socket Connection Dot */}
      <span
        className={`
          absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full border border-[var(--color-surface)]
          ${isConnected ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-muted)]'}
        `}
        title={isConnected ? 'Socket.IO live connected' : 'Connecting to live updates…'}
      />
    </Link>
  );
};

export default NotificationBell;
