import React from "react";
import { Wrench, ShieldAlert, ArrowLeft } from "lucide-react";

interface ModuleMaintenanceNoticeProps {
  moduleName: string;
  message?: string;
  onBack?: () => void;
}

export function ModuleMaintenanceNotice({ moduleName, message, onBack }: ModuleMaintenanceNoticeProps) {
  return (
    <div className="w-full max-w-xl mx-auto my-6 p-6 bg-afri-bg-sec/90 border border-amber-500/30 rounded-2xl shadow-xl space-y-4 text-center font-sans">
      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto animate-pulse">
        <Wrench className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-black uppercase text-afri-text tracking-wide flex items-center justify-center gap-2">
          <span>⚠️ {moduleName} en Maintenance</span>
        </h3>
        <p className="text-xs text-afri-text-sec">
          Ce module fait l'objet d'une mise à jour technique. Le reste de l'application demeure 100% fonctionnel et accessible.
        </p>
      </div>

      {message && (
        <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-xs font-mono text-amber-300/90 italic">
          "{message}"
        </div>
      )}

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-bold uppercase transition flex items-center gap-2 mx-auto cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
          <span>Retourner à l'accueil</span>
        </button>
      )}
    </div>
  );
}

export default ModuleMaintenanceNotice;
