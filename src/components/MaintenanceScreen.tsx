import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

export default function MaintenanceScreen({ message }: { message?: string }) {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-afri-bg text-afri-text font-sans p-6 text-center select-none">
      <div className="w-20 h-20 rounded-full bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center text-rose-500 mb-6 animate-pulse">
        <AlertOctagon className="w-10 h-10" />
      </div>
      <h1 className="text-2xl font-black uppercase tracking-wider text-rose-500 mb-4">
        Application en maintenance
      </h1>
      <p className="text-sm text-afri-text-sec max-w-md mb-2">
        {message || "Notre équipe technique intervient actuellement sur les serveurs d'AFRIGOMBO ELITE."}
      </p>
      <p className="text-xs text-afri-text-muted mb-8 font-mono">
        Veuillez patienter, nous serons de retour très bientôt.
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 px-6 py-3 bg-afri-bg-sec border border-afri-border rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-afri-bg-ter transition-colors shadow-lg"
      >
        <RefreshCw className="w-4 h-4" />
        Actualiser
      </button>
    </div>
  );
}
