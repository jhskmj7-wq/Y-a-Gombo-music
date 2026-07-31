export async function clearAppCaches() {
  console.log("🧹 [CachePurge] Clearing caches, SW, and local versioning...");
  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
    } catch (e) {
      console.error("Cache delete error:", e);
    }
  }
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    } catch (e) {
      console.error("SW unregister error:", e);
    }
  }
  try {
    localStorage.removeItem("afrigombo_app_version");
    sessionStorage.removeItem("last_chunk_reload_ts");
    sessionStorage.removeItem("last_chunk_reload_success");
  } catch (e) {}

  window.location.reload();
}
