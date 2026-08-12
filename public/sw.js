/* AFRIGOMBO PWA SERVICE WORKER */
try {
  importScripts('/sw-push.js');
} catch (e) {
  console.log('[SW] Push script import omitted or not found');
}

const CACHE_NAME = 'afrigombo-pwa-v2';
const ASSETS_TO_CACHE = [
  '/', 
  '/index.html', 
  '/manifest.webmanifest', 
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-512x512-maskable.png',
  '/favicon.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting stale cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Bypass caching for API routes, Firebase connections, and other real-time endpoints
  if (
    url.pathname.startsWith('/api/') || 
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebase')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. Navigation-First with offline fallback for HTML navigation (prevents white-screens on updates)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Put a copy of the fresh page in the cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put('/index.html', responseClone);
          });
          return response;
        })
        .catch(() => {
          // If network fails (offline), load from cache fallback
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 3. Cache-First with Network Fallback for standard assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache newly fetched static assets on the fly if they are from our origin
        if (
          networkResponse.status === 200 && 
          url.origin === self.location.origin &&
          (url.pathname.endsWith('.png') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.json') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css'))
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch((err) => {
        // Quietly fail for missing network assets
        console.warn('[SW] Fetch failed for:', event.request.url, err);
      });
    })
  );
});
