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
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
