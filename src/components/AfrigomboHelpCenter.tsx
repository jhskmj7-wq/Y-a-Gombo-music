import React from "react";
import { motion } from "motion/react";
import { HelpCircle, MessageSquare, AlertTriangle, FileText, Star, Lightbulb, ArrowRight, MessageCircle } from "lucide-react";
import { supportConfig } from "../supportConfig";

interface HelpCenterProps {
  onClose: () => void;
}

export default function AfrigomboHelpCenter({ onClose }: HelpCenterProps) {
  const sections = [
    { title: "Questions fréquentes (FAQ)", icon: HelpCircle, color: "text-blue-400", reason: "Questions fréquentes (FAQ)" },
    { title: "Guides d'utilisation", icon: FileText, color: "text-afri-text-sec", reason: "Guides d'utilisation" },
    { title: "Signaler un problème", icon: AlertTriangle, color: "text-red-400", reason: "Signaler un problème / Bug" },
    { title: "Ouvrir un litige", icon: MessageSquare, color: "text-orange-400", reason: "Ouverture d'un litige" },
    { title: "Donner un avis", icon: Star, color: "text-[#D4AF37]", reason: "Retour d'expérience / Avis" },
    { title: "Faire une suggestion", icon: Lightbulb, color: "text-emerald-400", reason: "Suggestion d'amélioration" },
  ];

  return (
    <div className="flex flex-col text-left animate-fadeIn w-full">
      <div className="max-w-xl mx-auto w-full flex-1 flex flex-col space-y-6 pt-4">
        <div className="flex justify-between items-center border-b border-afri-border pb-4">
          <h2 className="text-lg font-black text-afri-text uppercase flex items-center gap-3">
            <span className="text-[#D4AF37]">🛟</span>
            Centre d'Aide AFRIGOMBO
          </h2>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-afri-bg border border-afri-border hover:border-[#D4AF37] rounded-xl text-xs font-bold text-afri-text-sec hover:text-afri-text cursor-pointer transition-all"
          >
            Fermer ✕
          </button>
        </div>

        <div className="flex-1 space-y-6 pb-20">
          <div className="p-5 rounded-2xl bg-afri-bg border border-afri-border text-afri-text-sec text-xs leading-relaxed space-y-3">
            <p>
              <strong className="text-afri-text">Le Support Officiel AFRIGOMBO</strong> est le seul canal autorisé pour obtenir une assistance technique, signaler un problème ou poser une question.
            </p>
            <p>
              Les échanges directs de coordonnées entre utilisateurs restent interdits afin de protéger les artistes, les organisateurs et les paiements sécurisés.
            </p>
          </div>

          <button 
            onClick={() => supportConfig.openSupport("Assistance Générale")}
            className="w-full flex items-center justify-between p-5 rounded-2xl bg-emerald-950/20 border border-emerald-900/50 hover:border-emerald-500/50 transition-all group text-left cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-afri-text uppercase text-sm">WhatsApp Officiel AFRIGOMBO</h3>
                <p className="text-[10px] text-emerald-300">Support humain direct au {supportConfig.phoneNumber}</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sections.map((section, index) => (
              <button 
                key={index}
                onClick={() => supportConfig.openSupport(section.reason)}
                className="flex items-center gap-4 p-4 rounded-xl bg-afri-bg border border-afri-border hover:border-[#D4AF37]/50 transition-all text-left cursor-pointer"
              >
                <div className={`p-2 bg-afri-bg-sec rounded-lg ${section.color}`}>
                  <section.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-afri-text uppercase">{section.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
