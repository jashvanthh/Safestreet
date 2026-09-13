/**
 * context/SocketContext.jsx
 *
 * Manages the Socket.IO connection lifecycle and real-time notifications.
 *
 * WHY A CONTEXT FOR THE SOCKET?
 *   The socket must be shared across components:
 *     - NotificationBell (reads unreadCount, subscribes to new events)
 *     - Notifications page (marks all as read, resets count)
 *   A React context is the idiomatic way to share this without prop drilling.
 *
 * CONNECTION LIFECYCLE:
 *   1. User logs in → AuthContext has a token → useEffect connects socket
 *   2. Socket auth: { token } is sent in the handshake to server's io.use middleware
 *   3. Server verifies JWT → joins socket to userId room
 *   4. 'notification:new' events arrive → increment unreadCount + append to list
 *   5. User logs out → token disappears → useEffect cleanup disconnects socket
 *
 * INITIAL UNREAD COUNT:
 *   On connection, we fetch GET /api/notifications/count from the REST API.
 *   This handles notifications the user missed while offline.
 *   After that, socket events increment the count in real time.
 *
 * SOCKET vs REST API:
 *   Socket: real-time delivery of NEW notifications while online
 *   REST:   fetching historical notifications + initial unread count
 *   Both are needed — socket doesn't persist data across sessions.
 */

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import api from '../services/api';
import { TOKEN_KEY } from '../utils/constants';

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token }        = useContext(AuthContext);
  const socketRef        = useRef(null);
  const [unreadCount,    setUnreadCount]    = useState(0);
  const [liveNotifs,     setLiveNotifs]     = useState([]);  // Real-time only (current session)
  const [isConnected,    setIsConnected]    = useState(false);

  useEffect(() => {
    // No token = user not logged in → do nothing
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setUnreadCount(0);
      }
      return;
    }

    // ── Fetch initial unread count from REST API ──────────────────────────
    // This covers notifications received while the user was offline
    api.get('/notifications/count')
      .then((res) => setUnreadCount(res.data.data.count))
      .catch(() => {});  // Non-fatal — socket will still work

    // ── Connect Socket.IO ─────────────────────────────────────────────────
    // In local dev, connect directly to port 5001 or fallback to root origin
    const socketServerUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (window.location.hostname === 'localhost' ? 'http://localhost:5001' : '/');

    const newSocket = io(socketServerUrl, {
      auth: { token: token || localStorage.getItem(TOKEN_KEY) },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // ── Real-time notification received ───────────────────────────────────
    newSocket.on('notification:new', (notification) => {
      setUnreadCount((c) => c + 1);
      setLiveNotifs((prev) => [notification, ...prev.slice(0, 19)]);  // Keep last 20
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    socketRef.current = newSocket;

    // Cleanup when user logs out OR token changes
    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [token]);  // Re-run when token changes (login/logout)

  // Called by Notifications page after marking all as read
  const clearUnread = () => setUnreadCount(0);

  return (
    <SocketContext.Provider value={{
      socket:      socketRef.current,
      unreadCount,
      liveNotifs,
      isConnected,
      clearUnread,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

// Named export for convenience — same as useContext(SocketContext)
export const useSocket = () => useContext(SocketContext);
