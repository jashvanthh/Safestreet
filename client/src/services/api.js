/**
 * services/api.js
 *
 * Axios instance pre-configured with:
 *   - baseURL pointing to the Express API
 *   - Authorization header injected from localStorage on every request
 *
 * Why a centralized Axios instance?
 *   Without this, every fetch call needs to repeat baseURL and auth headers.
 *   With this, you set the token once and every call is automatically authenticated.
 *
 * Pattern: Request interceptor reads token at call-time (not at import-time),
 *   so token changes (login/logout) are always reflected.
 */

import axios from 'axios';

const api = axios.create({
  // In production (Render static site), VITE_API_URL must be set to the
  // Web Service URL e.g. https://safestreet-api.onrender.com/api
  // In local dev, falls back to '/api' which is proxied by vite.config.js
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ss_token');  // 'ss' = Safe Street namespace
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 globally ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and let AuthContext redirect
      localStorage.removeItem('ss_token');
      localStorage.removeItem('ss_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
