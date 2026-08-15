/* AFRIGOMBO SYSTEM PUSH NOTIFICATIONS ENGINE */

// Keep track of recently received notification IDs to prevent duplication
const seenNotificationIds = new Set();

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { message: event.data.text() };
    }
  }

  const notificationId = data.id || data.notificationId || `push-notif-${Date.now()}`;
  
  // Anti-duplication check
  if (seenNotificationIds.has(notificationId)) {
    console.log(`[SW-PUSH] Notification duplicate blocked: ${notificationId}`);
    return;
  }
  seenNotificationIds.add(notificationId);
  if (seenNotificationIds.size > 100) {
    // Keep set bounded
    const firstVal = seenNotificationIds.values().next().value;
    seenNotificationIds.delete(firstVal);
  }

  const isFounderNotif = data.isFounder || data.type === 'founder_alert' || data.audience === 'Super Fondateur' || (data.title || '').includes('Fondateur');
  
  // Official Identities
  const title = isFounderNotif ? "CENTRE FONDATEUR AFRIGOMBO" : "S-O-A";
  const body = isFounderNotif ? (data.message || data.body || "Alerte Fondateur") : `SUPPORT OFFICIEL AFRIGOMBO\n${data.message || data.body || ''}`;
  
  const targetPath = data.targetPath || data.link || (isFounderNotif ? "/Le-Trone-Du-Fondateur" : "/notifications");

  const options = {
    body: body,
    icon: "/pwa-192x192.png",
    badge: "/favicon.png",
    tag: notificationId, // Native browser deduplication & replacement
    vibrate: [200, 100, 200],
    requireInteraction: true,
    data: {
      targetPath,
      notificationId
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetPath = event.notification.data?.targetPath || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Look for an existing opened window of the app
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          // Send navigation message to existing window without page reload
          client.postMessage({ type: 'NAVIGATE', url: targetPath });
          return client.focus();
        }
      }
      // If no window is open, open a new one directly at the target route
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetPath);
      }
    })
  );
});
