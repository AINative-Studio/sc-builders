import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://sc-builders-production.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
      '/ws': {
        target: 'wss://sc-builders-production.up.railway.app',
        ws: true,
        secure: true,
      },
    },
  },
})
