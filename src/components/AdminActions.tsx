import React from "react";
import { ShieldCheck, AlertTriangle, Users, MessageSquare, Briefcase, Megaphone, Send, Activity } from "lucide-react";

interface AdminActionsProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  setIsBroadcastModalOpen: (isOpen: boolean) => void;
  audioSynth?: any; // Add optional audioSynth
}

export const AdminActions: React.FC<AdminActionsProps> = ({ activeMenu, setActiveMenu, setIsBroadcastModalOpen, audioSynth }) => {
  const handleMenuChange = (menu: string) => {
    setActiveMenu(menu);
    try {
      if (audioSynth && typeof audioSynth.playValidationSuccess === "function") {
        audioSynth.playValidationSuccess();
      }
    } catch (err) {}
  };

  return (
    <div className="space-y-4 pt-4">
      <h3 className="text-xs font-mono uppercase font-black tracking-[0.15em] text-[#D4A017] flex items-center gap-1.5">
        <Activity className="w-4 h-4 text-[#D4A017]" />
        Actions Administrateur
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => handleMenuChange("kyc")}
          className={`p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
            activeMenu === "kyc" ? "bg-[#0A0A0A] border-[#D4A017] text-[#D4A017] shadow-md shadow-[#D4A017]/20" : "bg-[#0A0A0A] hover:bg-[#111111] border-[rgba(212,160,23,0.25)] hover:border-[#D4A017] text-[#FFFFFF]"
          }`}
        >
          <ShieldCheck className="w-5 h-5 text-[#D4A017]" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-left leading-tight">Valider Gombo ID</span>
        </button>

        <button
           onClick={() => handleMenuChange("alertes")}
          className={`p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
            activeMenu === "alertes" ? "bg-[#0A0A0A] border-red-500 text-red-500 shadow-md shadow-red-500/20" : "bg-[#0A0A0A] hover:bg-red-950/20 border-[rgba(212,160,23,0.25)] hover:border-red-500/40 text-[#FFFFFF]"
          }`}
        >
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-left leading-tight">Voir signalements</span>
        </button>

        <button
          onClick={() => handleMenuChange("users")}
          className={`p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
            activeMenu === "users" ? "bg-[#0A0A0A] border-[#D4A017] text-[#D4A017]" : "bg-[#0A0A0A] hover:bg-[#111111] border-[rgba(212,160,23,0.25)] hover:border-[#D4A017] text-[#FFFFFF]"
          }`}
        >
          <Users className="w-5 h-5 text-[#D4A017]" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-left leading-tight">Suspendre utilisateur</span>
        </button>

        <button
          onClick={() => handleMenuChange("posts")}
          className={`p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
            activeMenu === "posts" ? "bg-[#0A0A0A] border-[#D4A017] text-[#D4A017]" : "bg-[#0A0A0A] hover:bg-[#111111] border-[rgba(212,160,23,0.25)] hover:border-[#D4A017] text-[#FFFFFF]"
          }`}
        >
          <MessageSquare className="w-5 h-5 text-emerald-400" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-left leading-tight">Approuver publication</span>
        </button>

        <button
          onClick={() => handleMenuChange("posts")}
          className="p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 bg-[#0A0A0A] hover:bg-[#111111] border-[rgba(212,160,23,0.25)] hover:border-yellow-500/40 text-[#FFFFFF]"
        >
          <Briefcase className="w-5 h-5 text-yellow-500" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-left leading-tight">Modérer publication</span>
        </button>
        
        <button
          onClick={() => {
            setIsBroadcastModalOpen(true);
            try { if (audioSynth) audioSynth.playValidationSuccess(); } catch (err) {}
          }}
          className="p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 bg-[#0A0A0A] hover:bg-[#111111] border-[rgba(212,160,23,0.25)] hover:border-[#D4A017] text-[#FFFFFF]"
        >
          <Megaphone className="w-5 h-5 text-[#D4A017]" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-left leading-tight">Notifications globales</span>
        </button>

        <button
           onClick={() => handleMenuChange("alertes")}
          className="p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 bg-[#0A0A0A] hover:bg-[#111111] border-[rgba(212,160,23,0.25)] hover:border-[#D4A017] text-[#FFFFFF]"
        >
          <Send className="w-5 h-5 text-[#D4A017]" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-left leading-tight">Support utilisateurs</span>
        </button>

        <button
           onClick={() => handleMenuChange("logs")}
          className="p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 bg-[#0A0A0A] hover:bg-[#111111] border-[rgba(212,160,23,0.25)] hover:border-[#D4A017] text-[#FFFFFF]"
        >
          <Activity className="w-5 h-5 text-[#D4A017]" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-left leading-tight">Historique actions</span>
        </button>
      </div>
    </div>
  );
};

export default AdminActions;
