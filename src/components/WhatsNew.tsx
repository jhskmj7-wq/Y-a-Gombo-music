import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Zap, Calendar, Tag, Info, Shield, Palette, Layout, ArrowLeft } from "lucide-react";
import { gomboDB } from "../firebase";
import { BetaUpdate } from "../types";

const typeIcons = {
  feature: { icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
  fix: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" },
  security: { icon: Shield, color: "text-red-500", bg: "bg-red-500/10" },
  design: { icon: Palette, color: "text-purple-500", bg: "bg-purple-500/10" }
};

interface WhatsNewProps {
  onBack?: () => void;
}

export default function WhatsNew({ onBack }: WhatsNewProps) {
  const [updates, setUpdates] = useState<BetaUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const data = await gomboDB.getBetaUpdates();
        if (data.length === 0) {
          // Default mock data if none in Firestore yet
          setUpdates([
            {
              id: "1",
              title: "Lancement de la Bêta Publique",
              content: "Bienvenue sur la version Bêta d'AFRIGOMBO. Explorez le terrain, publiez des gombos libres et aidez-nous à construire le Temple.",
              version: "v0.9.0",
              date: new Date().toISOString(),
              type: "feature"
            },
            {
              id: "2",
              title: "Système de PWA & Cache Intelligent",
              content: "AFRIGOMBO est désormais installable sur votre écran d'accueil avec une gestion de cache optimisée pour la vitesse.",
              version: "v0.8.5",
              date: new Date(Date.now() - 86400000).toISOString(),
              type: "security"
            },
            {
              id: "3",
              title: "Refonte du Design Cosmic",
              content: "Nouvelle interface premium avec animations fluides et typographie Space Grotesk pour une expérience d'élite.",
              version: "v0.8.0",
              date: new Date(Date.now() - 172800000).toISOString(),
              type: "design"
            }
          ]);
        } else {
          setUpdates(data);
        }
      } catch (error) {
        console.error("Fetch updates error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpdates();
  }, []);

  return (
    <div className="min-h-screen bg-afri-bg text-afri-text pb-32">
      {/* Header */}
      <div className="pt-8 pb-8 px-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-black font-mono tracking-tighter uppercase leading-none">
              QUOI DE <span className="text-[#D4AF37]">NEUF</span> ?
            </h1>
            <p className="text-afri-text-sec text-sm font-medium">Historique des mises à jour et évolutions du Temple.</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-4xl mx-auto px-6 space-y-12 relative">
        <div className="absolute left-10 top-0 w-px h-full bg-gradient-to-b from-afri-bg-sec via-afri-bg-ter to-transparent" />

        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-black text-afri-text-sec uppercase tracking-widest">Consultation des archives...</p>
          </div>
        ) : (
          updates.map((update, idx) => {
            const Config = typeIcons[update.type || "feature"];
            return (
              <motion.div
                key={update.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative pl-16 space-y-4"
              >
                {/* Timeline Dot */}
                <div className={`absolute left-7 top-0 w-6 h-6 rounded-lg ${Config.bg} border border-afri-border flex items-center justify-center z-10 -translate-x-1/2`}>
                  <Config.icon className={`w-3 h-3 ${Config.color}`} />
                </div>

                <div className="bg-afri-bg border border-afri-border p-8 rounded-[2rem] space-y-6 hover:border-afri-border transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${Config.bg} ${Config.color}`}>
                        {update.type}
                      </span>
                      <h3 className="text-xl font-black font-mono uppercase tracking-tight">{update.title}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-mono text-afri-text-sec uppercase font-black tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(update.date).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3" />
                        {update.version}
                      </div>
                    </div>
                  </div>

                  <p className="text-afri-text-sec text-sm leading-relaxed font-medium">
                    {update.content}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
