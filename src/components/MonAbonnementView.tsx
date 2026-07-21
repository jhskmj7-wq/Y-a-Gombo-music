import React, { useState } from 'react';
import { ShieldCheck, History, RefreshCcw, ArrowRight, Check, Sparkles } from 'lucide-react';

interface Props {
  isPremium: boolean;
  onUpgrade: () => void;
  onBack?: () => void;
}

export const MonAbonnementView: React.FC<Props> = ({ isPremium, onUpgrade, onBack }) => {
  const [showComparison, setShowComparison] = useState(false);

  if (showComparison) {
    return (
      <div className="afri-container space-y-6 animate-fadeIn pb-24 text-left py-4 xs:py-6 max-w-2xl mx-auto">
        <button 
          onClick={() => setShowComparison(false)}
          className="text-xs font-bold uppercase tracking-wider text-afri-text-sec hover:text-afri-text mb-4 inline-flex items-center gap-1"
        >
          &larr; Retour
        </button>
        <h2 className="text-xl font-black text-afri-text uppercase tracking-tight mb-6">Comparaison des offres</h2>
        
        <div className="bg-afri-bg-sec border border-afri-border rounded-3xl p-5 shadow-sm space-y-4">
           {/* Detail logic here, can be simple for now */}
           <div className="grid grid-cols-4 gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center border-b border-afri-border pb-2">
             <div className="text-left text-afri-text-sec">Fonctionnalité</div>
             <div>FREE</div>
             <div className="text-afri-text">PRO</div>
             <div className="text-afri-gold">ELITE</div>
           </div>
           
           {[
             { name: "Publications", free: "1/jour", pro: "5/jour", elite: "Illimité" },
             { name: "Commission", free: "2.5%", pro: "1.5%", elite: "1.5%" },
             { name: "Priorité Renfort", free: "-", pro: "-", elite: "Oui" },
             { name: "Badge", free: "-", pro: "Silver", elite: "Gold" },
             { name: "Thèmes Premium", free: "-", pro: "Oui", elite: "Oui" },
           ].map((row, i) => (
             <div key={i} className="grid grid-cols-4 gap-2 text-[10px] sm:text-xs font-mono text-center border-b border-afri-border/50 py-2 items-center">
               <div className="text-left text-afri-text-sec font-sans font-bold">{row.name}</div>
               <div className="text-afri-text-muted">{row.free}</div>
               <div className="text-afri-text font-bold">{row.pro}</div>
               <div className="text-afri-gold font-bold">{row.elite}</div>
             </div>
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="afri-container space-y-6 animate-fadeIn pb-32 text-left py-4 xs:py-6 max-w-2xl mx-auto">
      {onBack && (
        <button 
          onClick={onBack}
          className="text-xs font-black uppercase tracking-wider text-afri-text-sec hover:text-afri-text inline-flex items-center gap-1.5 px-3 py-1.5 bg-afri-bg-sec rounded-xl border border-afri-border transition cursor-pointer hover:border-afri-text-sec/40"
        >
          &larr; Retour
        </button>
      )}
      
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-afri-text uppercase tracking-tighter mb-2">Abonnements</h2>
        <p className="text-xs text-afri-text-sec uppercase tracking-widest font-mono">Choisissez l'offre qui vous correspond.</p>
      </div>

      {/* FREE */}
      <div className="bg-afri-bg-sec border border-afri-border rounded-3xl p-6 shadow-sm relative">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-black text-afri-text uppercase tracking-tight">GOMBO FREE</h3>
            <p className="text-xs text-afri-text-sec font-mono mt-1">0 FCFA</p>
          </div>
        </div>
        
        <ul className="space-y-3 mb-6">
          {["Profil standard", "Messagerie", "1 publication par jour"].map((feature, i) => (
            <li key={i} className="flex items-center gap-3 text-xs text-afri-text-sec font-medium">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
        
        <button className="w-full py-3 rounded-2xl bg-afri-bg border border-afri-border text-afri-text text-xs font-black uppercase tracking-wider opacity-70 cursor-default">
          Formule actuelle
        </button>
      </div>

      {/* PRO */}
      <div className="bg-afri-bg-sec border border-zinc-400/30 rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-300/10 blur-3xl rounded-full" />
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-black text-zinc-700 uppercase tracking-tight flex items-center gap-2">
              GOMBO PRO
              <span className="px-2 py-0.5 bg-zinc-200 text-zinc-700 text-[9px] font-black uppercase rounded-md tracking-wider">Silver</span>
            </h3>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-lg font-black text-afri-text">500 FCFA</span>
              <span className="text-xs text-afri-text-sec font-mono pb-1">/ mois</span>
            </div>
            <p className="text-[10px] text-afri-text-sec font-mono mt-0.5">Ou 5 000 FCFA / an</p>
          </div>
        </div>

        <div className="mb-4 inline-block px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
           <p className="text-[10px] font-bold text-emerald-700 uppercase">Commission réduite : <span className="line-through opacity-50 ml-1">2,5%</span> <ArrowRight className="inline w-3 h-3 mx-1" /> 1,5%</p>
        </div>
        
        <ul className="space-y-3 mb-6">
          {["5 publications par jour", "Statistiques", "Plus de visibilité", "Portfolio enrichi"].map((feature, i) => (
            <li key={i} className="flex items-center gap-3 text-xs text-afri-text font-medium">
              <Check className="w-4 h-4 text-afri-text-sec shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
        
        <button 
          onClick={onUpgrade}
          className="w-full py-3 rounded-2xl bg-afri-bg-ter hover:bg-zinc-700 text-afri-text text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95"
        >
          Devenir PRO
        </button>
      </div>

      {/* ELITE */}
      <div className="bg-gradient-to-b from-afri-bg-sec to-afri-gold/5 border-2 border-afri-gold/50 rounded-3xl p-6 shadow-xl relative overflow-hidden transform hover:-translate-y-1 transition-transform">
        <div className="absolute top-0 right-0 w-32 h-32 bg-afri-gold/20 blur-3xl rounded-full" />
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-afri-gold/10 blur-2xl rounded-full" />
        
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <h3 className="text-2xl font-black text-afri-gold uppercase tracking-tight flex items-center gap-2">
              GOMBO ELITE
              <span className="px-2 py-0.5 bg-afri-gold/20 border border-afri-gold/30 text-afri-gold text-[9px] font-black uppercase rounded-md tracking-wider flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3" /> Gold
              </span>
            </h3>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-xl font-black text-afri-text">1 000 FCFA</span>
              <span className="text-xs text-afri-text-sec font-mono pb-1">/ mois</span>
            </div>
            <p className="text-[10px] text-afri-text-sec font-mono mt-0.5">Ou 10 000 FCFA / an</p>
          </div>
        </div>

        <div className="mb-4 inline-block px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100 relative z-10">
           <p className="text-[10px] font-bold text-emerald-700 uppercase">Commission réduite : <span className="line-through opacity-50 ml-1">2,5%</span> <ArrowRight className="inline w-3 h-3 mx-1" /> 1,5%</p>
        </div>
        
        <ul className="space-y-3 mb-6 relative z-10">
          {["Publications illimitées", "Priorité Renfort Express", "Visibilité maximale", "Profil recommandé", "Statistiques avancées", "Opportunités Premium"].map((feature, i) => (
            <li key={i} className="flex items-center gap-3 text-xs text-afri-text font-bold">
              <Check className="w-4 h-4 text-afri-gold shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
        
        <button 
          onClick={onUpgrade}
          className="relative z-10 w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-afri-gold hover:brightness-110 text-black text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)] active:scale-95 flex justify-center items-center gap-2"
        >
          Devenir ELITE <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="pt-4 pb-8 flex justify-center">
        <button 
          onClick={() => setShowComparison(true)}
          className="text-xs font-bold text-afri-text-sec hover:text-afri-text uppercase tracking-wider underline underline-offset-4"
        >
          Comparer toutes les fonctionnalités
        </button>
      </div>

    </div>
  );
};

