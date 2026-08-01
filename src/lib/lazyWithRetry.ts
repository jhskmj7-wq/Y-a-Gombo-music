import { lazy, ComponentType, createElement } from "react";

export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  moduleName?: string
) {
  return lazy(async () => {
    try {
      const component = await componentImport();
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

      // If chunk loading failed, attempt an automatic recovery reload once
      const pageHasBeenRefreshed = window.sessionStorage.getItem("afrigombo_chunk_retry");
      if (!pageHasBeenRefreshed) {
        window.sessionStorage.setItem("afrigombo_chunk_retry", "true");
        if ('serviceWorker' in navigator) {
          try {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (const r of regs) await r.unregister();
          } catch (_) {}
        }
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
          className: "p-6 text-left text-red-500 font-mono bg-afri-bg-sec border border-red-500/30 rounded-2xl m-4 w-full max-w-4xl shadow-xl flex flex-col items-start overflow-auto"
        }, [
          createElement('div', { key: 'icon', className: 'text-3xl mb-4 text-center w-full' }, '⚠️'),
          createElement('h3', { key: 'title', className: 'font-black uppercase tracking-wider text-xl mb-4 text-red-500 text-center w-full' }, 'Impossible de charger ce module'),
          
          createElement('div', { key: 'details', className: 'w-full space-y-3 text-xs md:text-sm' }, [
            createElement('p', { key: 'module' }, [
              createElement('strong', { key: 'l', className: 'text-red-400' }, 'Module : '),
              actualModuleName
            ]),
            createElement('p', { key: 'path' }, [
              createElement('strong', { key: 'l', className: 'text-red-400' }, 'Chemin : '),
              path
            ]),
            createElement('p', { key: 'func' }, [
              createElement('strong', { key: 'l', className: 'text-red-400' }, 'Import concerné : '),
              createElement('code', { key: 'c', className: 'bg-black/30 px-1 py-0.5 rounded' }, importFuncString)
            ]),
            createElement('div', { key: 'error', className: 'mt-4' }, [
              createElement('strong', { key: 'l', className: 'text-red-400 block mb-1' }, 'Erreur JavaScript : '),
              createElement('pre', { key: 'c', className: 'bg-black/50 p-3 rounded-lg overflow-x-auto text-red-300' }, errorMessage)
            ]),
            createElement('div', { key: 'stack', className: 'mt-4' }, [
              createElement('strong', { key: 'l', className: 'text-red-400 block mb-1' }, 'Stack trace : '),
              createElement('pre', { key: 'c', className: 'bg-black/50 p-3 rounded-lg overflow-x-auto text-afri-text-muted text-[10px]' }, stack)
            ])
          ]),

          createElement('div', { key: 'actions', className: 'flex justify-center gap-4 mt-8 w-full' }, [
            createElement('button', {
              key: 'retry',
              onClick: () => window.location.reload(),
              className: 'px-6 py-2 bg-red-600 text-white text-xs font-bold font-mono uppercase rounded-xl tracking-widest cursor-pointer hover:bg-red-500 transition'
            }, 'Réessayer'),
            createElement('button', {
              key: 'home',
              onClick: () => { window.location.href = '/'; },
              className: 'px-6 py-2 bg-afri-bg-ter text-afri-text border border-afri-border text-xs font-bold font-mono uppercase rounded-xl tracking-widest cursor-pointer hover:bg-zinc-700 transition'
            }, 'Retour Accueil')
          ])
        ])) as unknown as T
      };
    }
  });
}
