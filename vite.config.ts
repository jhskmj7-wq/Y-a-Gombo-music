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
      includeAssets: [
        'favicon.ico',
        'favicon.png',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'favicon-48x48.png',
        'favicon-64x64.png',
        'logo.png',
        'logo-72.png',
        'logo-96.png',
        'logo-128.png',
        'logo-144.png',
        'logo-152.png',
        'logo-192.png',
        'pwa-192x192.png',
        'logo-256.png',
        'logo-384.png',
        'logo-512.png',
        'pwa-512x512.png',
        'maskable-icon.png',
        'apple-touch-icon.png',
        'logo_afrigombo.png',
        'logo.svg',
        'sounds/*.mp3'
      ],
      manifest: {
        id: '/',
        name: 'AFRIGOMBO',
        short_name: 'AFRIGOMBO',
        description: "AFRIGOMBO - Y'A GOMBO MUSIC. Le Temple du Gombo : Vos opportunités musicales certifiées, vos cachets sécurisés.",
        theme_color: '#050505',
        background_color: '#050505',
        display: 'standalone',
        display_override: ['standalone', 'fullscreen', 'minimal-ui'],
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        lang: 'fr',
        dir: 'ltr',
        prefer_related_applications: false,
        icons: [
          {
            src: '/favicon-16x16.png',
            sizes: '16x16',
            type: 'image/png'
          },
          {
            src: '/favicon-32x32.png',
            sizes: '32x32',
            type: 'image/png'
          },
          {
            src: '/favicon-48x48.png',
            sizes: '48x48',
            type: 'image/png'
          },
          {
            src: '/favicon-64x64.png',
            sizes: '64x64',
            type: 'image/png'
          },
          {
            src: '/logo-72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/logo-96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/logo-128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: '/logo-144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: '/logo-152.png',
            sizes: '152x152',
            type: 'image/png'
          },
          {
            src: '/logo-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/logo-256.png',
            sizes: '256x256',
            type: 'image/png'
          },
          {
            src: '/logo-384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: '/logo-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/maskable-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/logo_afrigombo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3,json}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false, // Required for 'prompt' type to work correctly with updateServiceWorker
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/api/, 
          /firebase/, 
          /firestore/, 
          /identitytoolkit/, 
          /securetoken/, 
          /accounts\.google\.com/
        ],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-v5',
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
      },
      devOptions: {
        enabled: true,
        type: 'classic'
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
