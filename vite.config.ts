import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: '/',
  build: { sourcemap: true },
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: ['logo.png', 'logo-192.png', 'logo-512.png', 'logo-384.png', 'logo-152.png', 'logo-144.png', 'logo-128.png', 'logo-96.png', 'logo-72.png', 'maskable-icon.png', 'apple-touch-icon.png', 'favicon.png', 'logo.svg', 'sounds/*.mp3'],
      manifest: {
        name: 'AFRIGOMBO ELITE',
        short_name: 'AFRIGOMBO ELITE',
        description: "AFRIGOMBO ELITE - Y'A GOMBO MUSIC. Le Temple du Gombo : Vos opportunités musicales certifiées, vos cachets sécurisés.",
        theme_color: '#050505',
        background_color: '#050505',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'logo-72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: 'logo-96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: 'logo-128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: 'logo-144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: 'logo-152.png',
            sizes: '152x152',
            type: 'image/png'
          },
          {
            src: 'logo-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'logo-384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: 'logo-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'maskable-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3}'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-v4',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 10,
              },
            },
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ]
      }
    })
  ],
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  optimizeDeps: {
    include: [
      "firebase/app",
      "firebase/auth",
      "firebase/firestore",
      "firebase/storage",
      "firebase/analytics"
    ]
  }
});
