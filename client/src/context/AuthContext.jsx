/**
 * context/AuthContext.jsx
 *
 * Why Context API instead of Redux?
 *   Auth state (current user + token) is global but simple.
 *   Context API + a custom hook (useAuth) gives us clean global access
 *   without the boilerplate of Redux (actions, reducers, store, slices).
 *   Redux would be overkill here — the spec says avoid Redux.
 *
 * What it provides:
 *   user       — the decoded user object (id, name, role) or null
 *   token      — JWT string or null
 *   login(token, user) — persist to localStorage + update state
 *   logout()           — clear localStorage + reset state
 *   isLoading  — true while checking localStorage on mount
 *
 * Built in Phase 4.
 */

import { createContext, useState, useEffect } from 'react';
import { TOKEN_KEY, USER_KEY } from '../utils/constants';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [isLoading, setIsLoading] = useState(true); // waiting for localStorage read

  // On mount: restore session from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser  = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
