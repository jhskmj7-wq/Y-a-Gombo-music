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

