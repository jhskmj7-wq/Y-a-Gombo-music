import re

content = """import React, { useState } from 'react';
import { Rocket, ToggleRight, CheckCircle, History, Info, Clock, Check, X, ShieldAlert, ChevronRight, User } from 'lucide-react';

export interface AdminDeploymentCenterProps {
  currentUser?: any;
  userEmail?: string;
}

export default function AdminDeploymentCenter({ currentUser, userEmail }: AdminDeploymentCenterProps) {
  // Temporary state for UI
  const [featureFlags, setFeatureFlags] = useState([
    { id: 'marche', name: 'Grand Marché', enabled: true },
    { id: 'academie', name: 'Académie', enabled: false },
    { id: 'podcasts', name: 'Podcasts', enabled: true },
    { id: 'audio', name: 'Audio', enabled: true },
    { id: 'video', name: 'Vidéo', enabled: false },
    { id: 'events', name: 'Évènements', enabled: true },
    { id: 'wallet', name: 'Wallet', enabled: true },
    { id: 'chat', name: 'Chat', enabled: true },
    { id: 'appels', name: 'Appels', enabled: false },
    { id: 'radar', name: 'Radar', enabled: true },
    { id: 'gombo_id', name: 'Gombo ID', enabled: true },
    { id: 'verification', name: 'Vérification', enabled: false },
    { id: 'notifications', name: 'Notifications', enabled: true }
  ]);

  const toggleFeature = (id: string) => {
    setFeatureFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  const handleDeployDraft = () => {
    alert("Déployer cliqué (handler temporaire)");
  };
  const handleDeployBeta = () => {
    alert("Déployer vers les bêta-testeurs (handler temporaire)");
  };
  const handleDeployAll = () => {
    alert("Déployer vers tous (handler temporaire)");
  };
  const handleCancelDeploy = () => {
    alert("Annuler le déploiement (handler temporaire)");
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24 text-left font-sans select-none">
      
      {/* 1. FILE D'ATTENTE DE DÉPLOIEMENT */}
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase text-afri-gold tracking-widest flex items-center gap-2 border-b border-afri-border/50 pb-2">
          <Rocket className="w-5 h-5" />
          FILE D'ATTENTE DE DÉPLOIEMENT
        </h2>
        
        <div className="bg-afri-bg-sec border border-afri-gold/20 rounded-2xl p-4 shadow-lg space-y-4 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Mise à jour v2.6.0</h3>
              <p className="text-xs text-afri-text-sec font-mono uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> 15 Août 2026 - 14:30
              </p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              Brouillon
            </div>
          </div>
          
          <button 
            onClick={handleDeployDraft}
            className="w-full py-3.5 bg-afri-gold hover:bg-afri-gold/90 text-black font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.3)]"
          >
            <CheckCircle className="w-5 h-5" />
            Déployer
          </button>
        </div>
      </section>

      {/* 2. FEATURE FLAGS */}
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase text-afri-gold tracking-widest flex items-center gap-2 border-b border-afri-border/50 pb-2">
          <ToggleRight className="w-5 h-5" />
          FEATURE FLAGS
        </h2>
        
        <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4 shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {featureFlags.map((feature) => (
              <div 
                key={feature.id} 
                className="flex items-center justify-between p-3 rounded-xl border border-afri-border/50 bg-afri-bg/50 hover:border-afri-gold/30 transition-colors"
                onClick={() => toggleFeature(feature.id)}
              >
                <span className="text-xs font-bold text-afri-text">{feature.name}</span>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${feature.enabled ? 'bg-afri-gold' : 'bg-zinc-700'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${feature.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. DÉPLOIEMENT */}
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase text-rose-400 tracking-widest flex items-center gap-2 border-b border-afri-border/50 pb-2">
          <ShieldAlert className="w-5 h-5" />
          DÉPLOIEMENT
        </h2>
        
        <div className="grid grid-cols-1 gap-3">
          <button 
            onClick={handleDeployBeta}
            className="w-full py-4 bg-afri-bg-sec border border-sky-500/50 hover:bg-sky-500/10 text-sky-400 font-black uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            Déployer vers les bêta-testeurs
          </button>
          
          <button 
            onClick={handleDeployAll}
            className="w-full py-4 bg-rose-500/10 border border-rose-500/50 hover:bg-rose-500/20 text-rose-400 font-black uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            Déployer vers tous
          </button>
          
          <button 
            onClick={handleCancelDeploy}
            className="w-full py-3.5 bg-afri-bg border border-afri-border hover:bg-afri-bg-sec text-afri-text-sec hover:text-white font-bold uppercase tracking-wider rounded-2xl transition-all"
          >
            Annuler le déploiement
          </button>
        </div>
      </section>

      {/* 4. HISTORIQUE */}
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase text-afri-text tracking-widest flex items-center gap-2 border-b border-afri-border/50 pb-2">
          <History className="w-5 h-5" />
          HISTORIQUE
        </h2>
        
        <div className="space-y-3">
          {[
            { v: 'v2.5.0', date: '01/08/2026', time: '09:00', author: 'Super Fondateur', status: 'Déployé' },
            { v: 'v2.4.2', date: '15/07/2026', time: '18:45', author: 'Équipe Dev', status: 'Déployé' },
            { v: 'v2.4.1', date: '10/07/2026', time: '11:20', author: 'Système', status: 'Annulé' },
          ].map((item, i) => (
            <div key={i} className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-white bg-white/10 px-2 py-0.5 rounded-md">{item.v}</span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${item.status === 'Déployé' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                  {item.status}
                </span>
              </div>
              <div className="flex justify-between items-end mt-1 text-[10px] font-mono uppercase text-afri-text-sec">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {item.date} - {item.time}</div>
                  <div className="flex items-center gap-1.5"><User className="w-3 h-3" /> {item.author}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. INFORMATIONS */}
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase text-afri-text tracking-widest flex items-center gap-2 border-b border-afri-border/50 pb-2">
          <Info className="w-5 h-5" />
          INFORMATIONS
        </h2>
        
        <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-5 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-widest text-afri-text-muted font-mono">Version Actuelle</span>
            <p className="text-sm font-black text-white">v2.5.0</p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-widest text-afri-text-muted font-mono">Version Bêta</span>
            <p className="text-sm font-black text-sky-400">v2.6.0-rc1</p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-widest text-afri-text-muted font-mono">Bêta-Testeurs</span>
            <p className="text-sm font-black text-white">142 actifs</p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-widest text-afri-text-muted font-mono">Dernier Déploiement</span>
            <p className="text-sm font-black text-white">Il y a 3 jours</p>
          </div>
        </div>
      </section>

    </div>
  );
}
"""

with open('src/components/admin/AdminDeploymentCenter.tsx', 'w') as f:
    f.write(content)
