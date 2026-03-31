import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// En Docker el proxy debe apuntar al host (ver docker-compose servicio vite)
const apiProxyTarget = process.env.SEROPTRANS_API_PROXY || 'http://127.0.0.1:8000'

export default defineConfig({
  // Evita EACCES si node_modules/.vite quedó con archivos de root (p. ej. npm en Docker)
  cacheDir: path.join(__dirname, '.vite-cache'),
  plugins: [react()],
  resolve: {
    alias: {
      'leaflet/dist/leaflet.css': path.resolve(__dirname, 'node_modules/leaflet/dist/leaflet.css'),
      '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css': path.resolve(
        __dirname,
        'node_modules/@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css',
      ),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
})
