import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js'
  },
  base: './', // nécessaire pour AppImage
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy uniquement pour le développement
      '/api': {
        target: 'http://127.0.0.1:8000', // backend Python
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/uploads': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      }
    }
  }
})
