import React from "react";
import { Activity, ShieldCheck, MessageSquare, Crown } from "lucide-react";

interface ActivityTabProps {
  currentProfile: any;
}

export default function ActivityTab({ currentProfile }: ActivityTabProps) {
  return (
    <div className="space-y-4 pb-24">
      <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-2">
        <h3 className="text-xs font-bold text-afri-text uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#D4AF37]" />
          Activité & Télémétrie du Compte
        </h3>
        <p className="text-xs text-afri-text-sec leading-relaxed">
          Suivez votre indice de confiance, votre statut membre et vos notifications de messagerie en temps réel.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] text-afri-text-muted font-bold uppercase">Indice de Confiance</span>
          <span className="text-xl font-black text-emerald-400 mt-2">{currentProfile?.trustScore || 100}%</span>
          <span className="text-[9px] text-afri-text-sec mt-1">Excellence certifiée</span>
        </div>
        <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] text-afri-text-muted font-bold uppercase">Statut Membre</span>
          <span className="text-xl font-black text-[#D4AF37] mt-2">
            {currentProfile?.isPremium || currentProfile?.premium ? "Élite 👑" : "Standard"}
          </span>
          <span className="text-[9px] text-afri-text-sec mt-1">Privilèges réseau</span>
        </div>
      </div>

      {/* Notifications Feed */}
      <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-3">
        <h4 className="text-[11px] font-bold text-afri-text uppercase tracking-wider">🔔 Notifications de Messagerie</h4>
        <div className="space-y-2">
          <div className="p-3 bg-afri-bg border border-afri-border rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <div>
                <strong className="block text-afri-text">Compte Sécurisé & Vérifié</strong>
                <span className="text-[10px] text-afri-text-sec">Vos échanges sont protégés par séquestre.</span>
              </div>
            </div>
            <span className="text-[9px] font-mono text-[#D4AF37]">Actif</span>
          </div>

          <div className="p-3 bg-afri-bg border border-afri-border rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                <MessageSquare className="w-4 h-4" />
              </span>
              <div>
                <strong className="block text-afri-text">Support Technique Disponible</strong>
                <span className="text-[10px] text-afri-text-sec">Équipe AFRIGOMBO 24/7 en ligne.</span>
              </div>
            </div>
            <span className="text-[9px] font-mono text-emerald-400">24/7</span>
          </div>
        </div>
      </div>

      {/* Member Telemetry */}
      <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-3">
        <h4 className="text-[11px] font-bold text-afri-text uppercase tracking-wider">📜 Télémétrie du Profil</h4>
        <div className="divide-y divide-afri-border/40">
          <div className="py-2.5 flex justify-between text-xs text-afri-text-sec">
            <span>Identifiant Unique AFRI</span>
            <span className="font-mono text-[#D4AF37] font-bold text-[11px]">{currentProfile?.afriId || "AFRI-MEMBER"}</span>
          </div>
          <div className="py-2.5 flex justify-between text-xs text-afri-text-sec">
            <span>Date d'inscription</span>
            <span className="font-mono text-afri-text text-[11px]">
              {currentProfile?.createdAt ? new Date(currentProfile.createdAt).toLocaleDateString() : "Récemment"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
