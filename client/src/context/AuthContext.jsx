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

import { createContext, useState } from 'react';
import { TOKEN_KEY, USER_KEY } from '../utils/constants';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser  = localStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        return JSON.parse(storedUser);
      }
      return null;
    } catch {
      return null;
    }
  });

  const isLoading = false;

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

  const updateUser = (updatedUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
