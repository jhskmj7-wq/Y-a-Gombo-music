/* AFRIGOMBO PWA SERVICE WORKER */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch handler for development fallback.
  // In production build, vite-plugin-pwa / Workbox handles caching strategies.
});
