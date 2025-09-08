import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env': process.env,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
      manifest: {
        id: '/',
        name: 'RadarPrecios - Fritzfood',
        short_name: 'RadarPrecios',
        description: 'Aplicación de monitoreo de precios Fritzfood',
        theme_color: '#E53E3E',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        lang: 'es-VE',
        categories: ['business', 'productivity'],
        icons: [
          {
            src: 'logo192.png',
            type: 'image/png',
            sizes: '192x192',
            purpose: 'any',
          },
          {
            src: 'logo512.png',
            type: 'image/png',
            sizes: '512x512',
            purpose: 'any',
          },
        ],
        shortcuts: [
          {
            name: 'Nuevo Análisis',
            short_name: 'Análisis',
            description: 'Crear nuevo análisis de precios',
            url: '/analisis/precio',
            icons: [{ src: 'logo192.png', sizes: '192x192' }],
          },
          {
            name: 'Check-in',
            short_name: 'Check-in',
            description: 'Registrar ubicación',
            url: '/check-in',
            icons: [{ src: 'logo192.png', sizes: '192x192' }],
          },
        ],
      },
    }),
  ],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
