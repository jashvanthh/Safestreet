/**
 * main.jsx — React application entry point
 *
 * This is the only file that imports index.css (global styles + Tailwind).
 * It mounts the React app into <div id="root"> in index.html.
 *
 * StrictMode: wraps the app in development to detect side-effects.
 *   It intentionally double-invokes render functions and effects in dev.
 *   This is EXPECTED behavior — it won't happen in production.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';   // Must come before index.css — Leaflet map styles
import './index.css';
import App from './App.jsx';

// Suppress unhandled errors from browser extensions / PerformanceObserver (e.g. Chrome reportAllChanges / startTime)
window.addEventListener('error', (event) => {
  if (
    event?.message?.includes('startTime') ||
    event?.filename?.includes('VM') ||
    event?.error?.stack?.includes('reportAllChanges')
  ) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
