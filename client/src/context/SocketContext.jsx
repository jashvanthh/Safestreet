/**
 * context/SocketContext.jsx
 *
 * Manages the Socket.IO connection lifecycle.
 *
 * Why a separate context?
 *   The socket is not part of auth state — it's an IO concern.
 *   Separating it keeps AuthContext simple and makes the socket
 *   independently testable.
 *
 * Socket auth:
 *   We pass the JWT in socket.handshake.auth.token on connect.
 *   The server verifies this token and maps the socket to a userId.
 *   This is how proximity notifications know which socket = which resident.
 *
 * Built in Phase 8.
 */

import { createContext, useEffect, useState, useContext } from 'react';
import { AuthContext } from './AuthContext';
// import { io } from 'socket.io-client';  // Uncomment in Phase 8

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Phase 8: initialize socket when token exists
    // if (token) {
    //   const newSocket = io('/', { auth: { token } });
    //   setSocket(newSocket);
    //   return () => newSocket.disconnect();
    // }
    // setSocket(null);
    void token; // placeholder until Phase 8
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
