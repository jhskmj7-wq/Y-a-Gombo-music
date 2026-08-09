import { lazy, ComponentType, createElement } from "react";

/**
 * AFRIGOMBO ROBUST LAZY MODULE LOADER
 * Automatically retries failed dynamic imports with exponential backoff.
 * Prevents chunk loading failures from breaking navigation or throwing unhandled exceptions.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  moduleName?: string
) {
  return lazy(async () => {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const component = await componentImport();
        // Clear any previous reload flags on success
        try {
          window.sessionStorage.removeItem("afrigombo_chunk_reload_attempt");
        } catch (_) {}
        return component;
      } catch (error: any) {
        attempts++;
        console.warn(`⚠️ [LazyRetry] Attempt ${attempts}/${maxAttempts} failed for module ${moduleName || "Unknown"}:`, error?.message || error);
        
        if (attempts < maxAttempts) {
          // Wait briefly before retrying (200ms, 400ms...)
          await new Promise((res) => setTimeout(res, attempts * 200));
        } else {
          // Check if we should trigger a single page reload for chunk updates
          const isChunkError = 
            error?.message?.includes("Failed to fetch") || 
            error?.message?.includes("ChunkLoadError") || 
            error?.message?.includes("Loading chunk") ||
            error?.message?.includes("Importing a module script failed");

          const pageHasBeenRefreshed = window.sessionStorage.getItem("afrigombo_chunk_reload_attempt");

          if (isChunkError && !pageHasBeenRefreshed) {
            try {
              window.sessionStorage.setItem("afrigombo_chunk_reload_attempt", "true");
            } catch (_) {}
            window.location.reload();
          }

          // Return a safe fallback component instead of crashing
          return {
            default: ((props: any) => createElement('div', {
              className: "p-6 m-4 bg-afri-card border border-afri-border rounded-2xl text-center space-y-3"
            }, [
              createElement('p', { key: 'msg', className: 'text-sm font-mono text-afri-gold' }, 'Module en cours de synchronisation...'),
              createElement('button', {
                key: 'btn',
                onClick: () => window.location.reload(),
                className: 'px-4 py-2 bg-afri-gold text-black font-bold text-xs rounded-xl uppercase tracking-wider cursor-pointer'
              }, 'Actualiser')
            ])) as unknown as T
          };
        }
      }
    }

    return {
      default: (() => null) as unknown as T
    };
  });
}
