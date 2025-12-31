import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow external connections (needed for Docker)
    port: 3000,
    proxy: {
      // Proxy API requests to backend during development
      // Use 'backend' Docker service name (resolves via Docker DNS)
      '/api': {
        target: 'http://backend:5000',
        changeOrigin: true,
        secure: false,
        // Log proxy requests for debugging
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying:', req.method, req.url, '-> backend:5000');
          });
        },
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
  },
})
