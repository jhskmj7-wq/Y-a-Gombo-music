import React from "react";
import { ShieldCheck } from "lucide-react";

interface AfrigomboFooterProps {
  setActiveMenu: (menu: string) => void;
  requireAuthThen?: (action: () => void) => void;
}

export const AfrigomboFooter: React.FC<AfrigomboFooterProps> = ({
  setActiveMenu,
  requireAuthThen
}) => {
  const handleNav = (menuKey: string, requiresAuth: boolean = false) => {
    if (requiresAuth && requireAuthThen) {
      requireAuthThen(() => setActiveMenu(menuKey));
    } else {
      setActiveMenu(menuKey);
    }
  };

  return (
    <footer className="mt-8 pb-28 sm:pb-24 pt-4 px-4 border-t border-afri-border bg-afri-bg-sec text-center select-none space-y-3 max-w-5xl mx-auto rounded-t-2xl">
      {/* 1. HEADER COMPACT (BRAND + SLOGAN) */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
        <span className="text-base">🪘</span>
        <span className="font-display font-black text-sm tracking-widest text-afri-gold uppercase">
          AFRIGOMBO ELITE
        </span>
        <span className="text-afri-text-sec/50">•</span>
        <span className="text-afri-text font-sans font-bold">Temple du Gombo Musical</span>
        <span className="text-afri-text-sec/50">•</span>
        <span className="text-afri-gold font-mono inline-flex items-center gap-1 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-afri-gold" />
          <span>Vos cachets 100 % sécurisés</span>
        </span>
      </div>

      {/* 2. LIENS UTILES (LEGAL & SUPPORT) */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-mono text-afri-text-sec">
        <button
          type="button"
          onClick={() => handleNav("terms")}
          className="hover:text-afri-gold transition-colors cursor-pointer py-1"
        >
          CGU
        </button>
        <span className="text-afri-text-sec/30">•</span>
        <button
          type="button"
          onClick={() => handleNav("privacy")}
          className="hover:text-afri-gold transition-colors cursor-pointer py-1"
        >
          Confidentialité
        </button>
        <span className="text-afri-text-sec/30">•</span>
        <button
          type="button"
          onClick={() => handleNav("terms")}
          className="hover:text-afri-gold transition-colors cursor-pointer py-1"
        >
          Mentions légales
        </button>
        <span className="text-afri-text-sec/30">•</span>
        <button
          type="button"
          onClick={() => handleNav("user_help_center")}
          className="hover:text-afri-gold transition-colors cursor-pointer py-1"
        >
          Support
        </button>
        <span className="text-afri-text-sec/30">•</span>
        <button
          type="button"
          onClick={() => handleNav("delete_account")}
          className="text-red-400 hover:text-red-300 transition-colors cursor-pointer font-bold py-1"
        >
          Supprimer compte
        </button>
      </div>

      {/* 3. BADGE RÉSEAU COMPACT + COPYRIGHT */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-[10px] font-mono text-afri-text-sec">
        <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-emerald-400 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>🟢 Réseau synchronisé (Firebase temps réel)</span>
        </div>
        <span>© 2026 AFRIGOMBO ELITE</span>
      </div>
    </footer>
  );
};

export default AfrigomboFooter;

