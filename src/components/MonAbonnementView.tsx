import React from 'react';
import { ShieldCheck, History, RefreshCcw, ArrowRight } from 'lucide-react';

interface Props {
  isPremium: boolean;
  onUpgrade: () => void;
}

export const MonAbonnementView: React.FC<Props> = ({ isPremium, onUpgrade }) => {
  return (
    <div className="afri-container space-y-6 animate-fadeIn pb-24 text-left py-4 xs:py-6 max-w-2xl mx-auto">
      
      <div className="bg-afri-bg-sec border border-afri-gold/30 rounded-3xl p-6 shadow-[0_4px_25px_rgba(212,175,55,0.05)] text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-afri-gold/5 blur-3xl rounded-full" />
        
        <h2 className="text-xl font-black text-afri-text uppercase tracking-tight mb-2">Mon Abonnement</h2>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-afri-bg rounded-xl border border-afri-border my-4">
          <span className="text-afri-gold">👑</span>
          <span className="text-sm font-bold text-afri-text-muted uppercase">
            Offre Actuelle : <strong className={isPremium ? "text-afri-gold" : "text-afri-text"}>{isPremium ? "Premium Elite" : "Gombo Free"}</strong>
          </span>
        </div>

        <div className="text-sm text-afri-text-muted font-mono mb-6">
          <p>Date d'expiration : <strong className="text-afri-text">{isPremium ? "12 Novembre 2026" : "À vie (Gratuit)"}</strong></p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {isPremium ? (
            <button className="w-full sm:w-auto px-6 py-2.5 bg-afri-bg border border-afri-gold hover:bg-afri-gold/10 text-afri-gold text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2">
              <RefreshCcw className="w-4 h-4" />
              Renouveler
            </button>
          ) : null}
          <button 
            onClick={onUpgrade}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 to-afri-gold hover:brightness-110 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.3)]"
          >
            Passer à GOMBO ELITE <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-afri-bg-sec border border-afri-border rounded-3xl p-5 sm:p-6 shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
        <h3 className="text-sm font-black text-afri-text uppercase tracking-wider mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-afri-gold" />
          Historique des Paiements
        </h3>
        
        {isPremium ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-afri-bg border border-afri-border">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-afri-text">Renouvellement Elite</span>
                  <span className="text-[10px] text-zinc-500 font-mono">12 {(new Date().getFullYear()) - i + 1}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-black text-emerald-500">10 000 FCFA</span>
                  <span className="text-[9px] text-zinc-400 uppercase tracking-wider">Succès</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-afri-text-muted text-xs font-mono">
            Aucun historique de paiement pour l'instant.
          </div>
        )}
      </div>

    </div>
  );
};
