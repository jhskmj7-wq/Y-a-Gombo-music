export async function purgeLegacyAppCaches() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("afrigombo_app_version");
  } catch (e) {
    // ignore
  }

  // 2. Clear legacy Workbox and AFRIGOMBO ServiceWorker caches
  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      for (const key of keys) {
        if (
          key.includes('workbox') ||
          key.includes('navigation') ||
          key.includes('afrigombo') ||
          key.includes('vite-pwa')
        ) {
          console.log(`🧹 [ONLINE-FIRST] Purging legacy SW cache: ${key}`);
          await caches.delete(key);
        }
      }
    } catch (e) {
      console.warn("[CachePurge] Error cleaning SW caches:", e);
    }
  }

  // 3. Force SW update checks to unregister old precache handlers
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        reg.update().catch(() => {});
      }
    } catch (e) {
      // ignore
    }
  }
}

export async function clearAppCaches() {
  console.log("🧹 [CachePurge] Clearing caches and local storage...");
  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
    } catch (e) {
      console.error("Cache delete error:", e);
    }
  }

  try {
    localStorage.removeItem("afrigombo_app_version");
    sessionStorage.removeItem("last_chunk_reload_ts");
    sessionStorage.removeItem("last_chunk_reload_success");
  } catch (e) {}

  window.location.reload();
}


