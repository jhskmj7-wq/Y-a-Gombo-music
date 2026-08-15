importScripts('https://www.gstatic.com/firebasejs/9.6.11/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.11/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyC3eJm2GfUMxGUNGu7uZeIP9-rtcLRljNk",
  authDomain: "afrigombo.firebaseapp.com",
  databaseURL: "https://afrigombo-default-rtdb.firebaseio.com",
  projectId: "afrigombo",
  storageBucket: "afrigombo.firebasestorage.app",
  messagingSenderId: "558547758112",
  appId: "1:558547758112:web:d84cbcb8fb0e0670c5a045",
  measurementId: "G-27498CNQX0"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification?.title || 'AFRIGOMBO';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: '/pwa-192x192.png',
      badge: '/favicon.png',
      tag: payload.data?.eventId || `fcm-${Date.now()}`,
      vibrate: [200, 100, 200, 100, 200],
      data: payload.data || {}
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.log('Firebase SW Error', e);
}

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const route = event.notification.data?.targetRoute || event.notification.data?.targetPath || event.notification.data?.route || '/notifications';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url.indexOf(self.location.origin) !== -1 && 'focus' in client) {
          client.postMessage({ type: 'NAVIGATE', url: route });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(route);
      }
    })
  );
});
