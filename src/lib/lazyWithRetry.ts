import { lazy, ComponentType, createElement } from "react";

export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      const component = await componentImport();
      window.sessionStorage.setItem("last_chunk_reload_success", "true");
      return component;
    } catch (error) {
      console.error("❌ [LazyError] Failed to load module:", error);
      
      const errorMessage = (error as any)?.message || "";
      const isChunkError = (error as any)?.name === "ChunkLoadError" || 
                          errorMessage.includes("Loading chunk") ||
                          errorMessage.includes("Failed to fetch dynamically imported module") ||
                          errorMessage.includes("Unexpected token '<'");

      if (isChunkError) {
        const lastReload = window.sessionStorage.getItem("last_chunk_reload_ts");
        const now = Date.now();
        
        if (!lastReload || now - parseInt(lastReload) > 10000) {
          window.sessionStorage.setItem("last_chunk_reload_ts", now.toString());
          console.warn("🔄 [LazyRetry] Chunk error detected. Purging caches and reloading...");
          
          if ('caches' in window) {
             try {
               const cacheNames = await caches.keys();
               await Promise.all(cacheNames.map(name => caches.delete(name)));
             } catch (e) {}
          }
          window.location.reload();
          return { default: (() => null) as unknown as T };
        }
      }

      // Return a safe fallback component instead of white screen / crash
      return {
        default: (() => createElement('div', {
          className: "p-8 text-center text-[#D4AF37] font-mono bg-[#0D0D15] border border-[#D4AF37]/30 rounded-2xl m-4 max-w-lg mx-auto shadow-xl flex flex-col items-center"
        }, [
          createElement('div', { key: 'icon', className: 'text-3xl mb-2' }, '⚠️'),
          createElement('h3', { key: 'title', className: 'font-bold uppercase tracking-wider text-sm mb-1 text-[#D4AF37]' }, 'Impossible de charger ce module'),
          createElement('p', { key: 'desc', className: 'text-xs text-zinc-400 mb-6' }, 'Veuillez vérifier votre connexion réseau ou réessayer.'),
          createElement('div', { key: 'actions', className: 'flex gap-3' }, [
            createElement('button', {
              key: 'retry',
              onClick: () => window.location.reload(),
              className: 'px-4 py-2 bg-[#D4AF37] text-black text-xs font-bold font-mono uppercase rounded-xl tracking-widest cursor-pointer hover:bg-white transition'
            }, 'Réessayer'),
            createElement('button', {
              key: 'home',
              onClick: () => { window.location.href = '/'; },
              className: 'px-4 py-2 bg-zinc-800 text-white border border-zinc-700 text-xs font-bold font-mono uppercase rounded-xl tracking-widest cursor-pointer hover:bg-zinc-700 transition'
            }, 'Retour Accueil')
          ])
        ])) as unknown as T
      };
    }
  });
}

