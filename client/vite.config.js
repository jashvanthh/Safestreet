import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * vite.config.js
 *
 * Key config:
 *  - @tailwindcss/vite plugin integrates Tailwind without a PostCSS config file
 *  - proxy forwards /api/* to the Express server (avoids CORS in dev)
 *    You NEVER need to set up CORS for local development with this proxy.
 *    In production, CORS is handled in app.js via the CLIENT_ORIGIN env var.
 */
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,                // Proxy WebSocket connections too
        changeOrigin: true,
      },
    },
  },
})
