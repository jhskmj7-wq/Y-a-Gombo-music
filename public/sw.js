/* AFRIGOMBO PWA SERVICE WORKER */
try {
  importScripts('/sw-push.js');
} catch (e) {
  console.log('[SW] Push script import omitted or not found');
}

const CACHE_NAME = 'afrigombo-pwa-v1';
const ASSETS_TO_CACHE = ['/', '/index.html', '/manifest.webmanifest', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
