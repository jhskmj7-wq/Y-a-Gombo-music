import { lazy, ComponentType, createElement } from "react";

export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      const component = await componentImport();
      window.sessionStorage.setItem("page_has_been_refreshed", "false");
      return component;
    } catch (error) {
      console.error("❌ [LazyError] Failed to load module:", error);
      window.sessionStorage.setItem("page_has_been_refreshed", "true");
      // Return a safe fallback component instead of white screen / crash
      return {
        default: (() => createElement('div', {
          className: "p-8 text-center text-[#D4AF37] font-mono bg-[#0D0D15] border border-[#D4AF37]/30 rounded-2xl m-4 max-w-lg mx-auto shadow-xl"
        }, [
          createElement('div', { key: 'icon', className: 'text-3xl mb-2' }, '⚠️'),
          createElement('h3', { key: 'title', className: 'font-bold uppercase tracking-wider text-sm mb-1 text-[#D4AF37]' }, 'Module en cours de chargement'),
          createElement('p', { key: 'desc', className: 'text-xs text-zinc-400 mb-4' }, 'Le module nécessite une actualisation ou une connexion stable.'),
          createElement('button', {
            key: 'btn',
            onClick: () => window.location.reload(),
            className: 'px-4 py-2 bg-[#D4AF37] text-black text-xs font-bold font-mono uppercase rounded-xl tracking-widest cursor-pointer hover:bg-white transition'
          }, 'Actualiser la page ⚡')
        ])) as unknown as T
      };
    }
  });
}

