import { lazy, ComponentType, createElement } from "react";

export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  moduleName?: string
) {
  return lazy(async () => {
    try {
      const component = await componentImport();
      window.sessionStorage.removeItem("afrigombo_chunk_reload_attempt"); // Success: Reset the retry flag for future imports
      window.sessionStorage.setItem("last_chunk_reload_success", "true");
      return component;
    } catch (error: any) {
      console.error(`❌ [LazyError] Failed to load module ${moduleName || "Unknown"}:`, error);
      
      const errorMessage = error?.message || String(error);
      const stack = error?.stack || "No stack trace available";
      const importFuncString = componentImport.toString();
      const pathMatch = importFuncString.match(/import\(['"]([^'"]+)['"]\)/);
      const path = pathMatch ? pathMatch[1] : "Unknown path";
      const actualModuleName = moduleName || path.split('/').pop() || "Unknown module";

      // If chunk loading failed, attempt an automatic recovery reload once, only for chunk errors
      const pageHasBeenRefreshed = window.sessionStorage.getItem("afrigombo_chunk_reload_attempt");
      const isChunkError = errorMessage.includes("Failed to fetch") || 
                           errorMessage.includes("ChunkLoadError") || 
                           errorMessage.includes("Loading chunk") ||
                           errorMessage.includes("Importing a module script failed");

      if (!pageHasBeenRefreshed && isChunkError) {
        window.sessionStorage.setItem("afrigombo_chunk_reload_attempt", "true");
        // We only clear the specific PWA cache if we can identify it, otherwise we just reload
        // to let the new Service Worker (if any) take over the new index.html
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
      return {
        default: (() => createElement('div', {
          className: "p-8 text-left text-afri-gold font-mono bg-black border border-afri-gold/30 rounded-3xl m-4 w-full max-w-4xl shadow-2xl flex flex-col items-start overflow-auto animate-fadeIn"
        }, [
          createElement('div', { key: 'icon', className: 'text-4xl mb-6 text-center w-full' }, '🚀'),
          createElement('h3', { key: 'title', className: 'font-black uppercase tracking-tighter text-2xl mb-4 text-afri-gold text-center w-full' }, 'Mise à jour requise'),
          createElement('p', { key: 'desc', className: 'text-sm text-afri-text-sec text-center mb-8 w-full' }, 'Une nouvelle version de l\'application est disponible ou un module n\'a pas pu être chargé.'),
          
          createElement('div', { key: 'details', className: 'w-full p-4 bg-afri-bg/50 border border-afri-border rounded-2xl space-y-3 text-[10px] md:text-xs mb-8' }, [
            createElement('p', { key: 'module' }, [
              createElement('strong', { key: 'l', className: 'text-afri-gold uppercase' }, 'Module : '),
              actualModuleName
            ]),
            createElement('p', { key: 'path' }, [
              createElement('strong', { key: 'l', className: 'text-afri-gold uppercase' }, 'Source : '),
              path
            ]),
            createElement('p', { key: 'error', className: 'truncate' }, [
              createElement('strong', { key: 'l', className: 'text-afri-gold uppercase' }, 'Erreur : '),
              errorMessage
            ])
          ]),

          createElement('div', { key: 'actions', className: 'flex flex-col sm:flex-row justify-center gap-4 w-full' }, [
            createElement('button', {
              key: 'retry',
              onClick: async () => {
                // Hard reload and clear caches
                if ('caches' in window) {
                  try {
                    const keys = await caches.keys();
                    await Promise.all(keys.map(k => caches.delete(k)));
                  } catch (_) {}
                }
                window.location.reload();
              },
              className: 'px-8 py-3 bg-afri-gold text-black text-xs font-black font-mono uppercase rounded-xl tracking-widest cursor-pointer hover:scale-105 transition shadow-[0_0_20px_rgba(212,175,55,0.3)]'
            }, 'Forcer l\'actualisation'),
            createElement('button', {
              key: 'home',
              onClick: () => { window.location.href = '/'; },
              className: 'px-8 py-3 bg-black text-afri-gold border border-afri-gold/50 text-xs font-black font-mono uppercase rounded-xl tracking-widest cursor-pointer hover:bg-zinc-900 transition'
            }, 'Retour Accueil')
          ])
        ])) as unknown as T
      };
    }
  });
}
