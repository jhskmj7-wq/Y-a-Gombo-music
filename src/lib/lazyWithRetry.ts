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
                           errorMessage.includes("Loading chunk");

      if (!pageHasBeenRefreshed && isChunkError) {
        window.sessionStorage.setItem("afrigombo_chunk_reload_attempt", "true");
        if ('caches' in window) {
          try {
            const keys = await caches.keys();
            for (const k of keys) await caches.delete(k);
          } catch (_) {}
        }
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
      return {
        default: (() => createElement('div', {
          className: "p-6 text-left text-afri-gold font-mono bg-black border border-afri-gold/30 rounded-2xl m-4 w-full max-w-4xl shadow-xl flex flex-col items-start overflow-auto"
        }, [
          createElement('div', { key: 'icon', className: 'text-3xl mb-4 text-center w-full' }, '⚠️'),
          createElement('h3', { key: 'title', className: 'font-black uppercase tracking-wider text-xl mb-4 text-afri-gold text-center w-full' }, 'Impossible de charger ce module'),
          
          createElement('div', { key: 'details', className: 'w-full space-y-3 text-xs md:text-sm' }, [
            createElement('p', { key: 'module' }, [
              createElement('strong', { key: 'l', className: 'text-afri-gold' }, 'Module : '),
              actualModuleName
            ]),
            createElement('p', { key: 'path' }, [
              createElement('strong', { key: 'l', className: 'text-afri-gold' }, 'Chemin : '),
              path
            ]),
            createElement('div', { key: 'actions', className: 'flex justify-center gap-4 mt-8 w-full' }, [
              createElement('button', {
                key: 'retry',
                onClick: () => window.location.reload(),
                className: 'px-6 py-2 bg-afri-gold text-black text-xs font-bold font-mono uppercase rounded-xl tracking-widest cursor-pointer hover:bg-yellow-600 transition'
              }, 'Réessayer'),
              createElement('button', {
                key: 'home',
                onClick: () => { window.location.href = '/'; },
                className: 'px-6 py-2 bg-black text-afri-gold border border-afri-gold text-xs font-bold font-mono uppercase rounded-xl tracking-widest cursor-pointer hover:bg-zinc-900 transition'
              }, 'Retour Accueil')
            ])
          ])
        ])) as unknown as T
      };
    }
  });
}
