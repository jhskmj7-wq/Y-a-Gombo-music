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
    <footer className="mt-16 bg-[#0A0A0A] border border-[#D4AF37]/25 rounded-3xl p-6 sm:p-10 space-y-8 select-none shadow-2xl text-left">
      {/* 1. BRAND HEADER & PLATFORM STATUS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-[#D4AF37]/15 pb-6 text-center sm:text-left">
        <div className="space-y-1.5">
          <div className="flex items-center justify-center sm:justify-start gap-2.5">
            <span className="text-2xl">👑</span>
            <span className="font-display font-black text-xl tracking-widest text-[#D4AF37] uppercase">
              AFRIGOMBO
            </span>
          </div>
          <p className="text-xs font-bold text-zinc-200 tracking-wide">
            Le Temple du Gombo Musical
          </p>
          <p className="text-[11px] font-mono text-[#D4AF37]/90 flex items-center justify-center sm:justify-start gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>Vos cachets 100 % sécurisés.</span>
          </p>
        </div>

        {/* PLATFORM STATUS */}
        <div className="bg-zinc-900/90 border border-emerald-500/30 rounded-2xl px-5 py-3 text-center sm:text-right space-y-1 shadow-inner">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wide">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>🟢 Réseau souverain opérationnel</span>
          </div>
          <p className="text-[10px] font-mono text-zinc-400">
            Synchronisé en temps réel.
          </p>
        </div>
      </div>

      {/* 2. NAVIGATION RAPIDE (PETITS BOUTONS PREMIUM) */}
      <div className="space-y-3">
        <p className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-widest font-black text-center sm:text-left">
          Navigation rapide
        </p>
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <button
            type="button"
            onClick={() => handleNav("user_terrain")}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-[#D4AF37]/60 rounded-xl text-xs font-mono font-bold text-zinc-200 hover:text-[#D4AF37] transition-all cursor-pointer shadow-sm active:scale-95"
          >
            Accueil
          </button>
          <button
            type="button"
            onClick={() => handleNav("user_mes_gombos", true)}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-[#D4AF37]/60 rounded-xl text-xs font-mono font-bold text-zinc-200 hover:text-[#D4AF37] transition-all cursor-pointer shadow-sm active:scale-95"
          >
            Mes Gombos
          </button>
          <button
            type="button"
            onClick={() => handleNav("user_grand_marche", true)}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-[#D4AF37]/60 rounded-xl text-xs font-mono font-bold text-zinc-200 hover:text-[#D4AF37] transition-all cursor-pointer shadow-sm active:scale-95"
          >
            Grand Marché
          </button>
          <button
            type="button"
            onClick={() => handleNav("user_academie", true)}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-[#D4AF37]/60 rounded-xl text-xs font-mono font-bold text-zinc-200 hover:text-[#D4AF37] transition-all cursor-pointer shadow-sm active:scale-95"
          >
            Académie
          </button>
          <button
            type="button"
            onClick={() => handleNav("user_help_center")}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-[#D4AF37]/60 rounded-xl text-xs font-mono font-bold text-zinc-200 hover:text-[#D4AF37] transition-all cursor-pointer shadow-sm active:scale-95"
          >
            Centre d'aide
          </button>
        </div>
      </div>

      {/* 3. LIENS LÉGAUX ET COPYRIGHT */}
      <div className="pt-6 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-mono text-zinc-400">
          <button
            type="button"
            onClick={() => handleNav("terms")}
            className="hover:text-[#D4AF37] transition-colors cursor-pointer"
          >
            CGU
          </button>
          <span className="text-zinc-700">•</span>
          <button
            type="button"
            onClick={() => handleNav("privacy")}
            className="hover:text-[#D4AF37] transition-colors cursor-pointer"
          >
            Confidentialité
          </button>
          <span className="text-zinc-700">•</span>
          <button
            type="button"
            onClick={() => handleNav("terms")}
            className="hover:text-[#D4AF37] transition-colors cursor-pointer"
          >
            Mentions légales
          </button>
          <span className="text-zinc-700">•</span>
          <button
            type="button"
            onClick={() => handleNav("delete_account")}
            className="text-red-400/90 hover:text-red-300 transition-colors cursor-pointer font-bold"
          >
            Suppression du compte
          </button>
        </div>

        <div className="text-xs font-mono text-zinc-500">
          © 2026 AFRIGOMBO. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
};

export default AfrigomboFooter;
