import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Trophy, ShieldCheck, Crown, Landmark, CheckCircle2, Star, Sparkles, Send, Coins, ArrowRight } from "lucide-react";
import { useAuth } from "../AuthContext";
import { gomboDB } from "../firebase";

const levels = [
  {
    id: "ami",
    name: "Ami",
    description: "Soutenez le projet avec un don libre pour encourager l'équipe.",
    icon: Heart,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    badge: "🤲"
  },
  {
    id: "batisseur",
    name: "Bâtisseur",
    description: "Contribuez activement à l'infrastructure du Temple du Gombo.",
    icon: Landmark,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    badge: "🪘"
  },
  {
    id: "protecteur",
    name: "Protecteur",
    description: "Devenez un garant de la sécurité et du séquestre Afrigombo.",
    icon: ShieldCheck,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    badge: "🛡️"
  },
  {
    id: "gardien",
    name: "Gardien",
    description: "Un rôle d'honneur pour ceux qui veillent sur la communauté.",
    icon: Trophy,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    badge: "🏛️"
  },
  {
    id: "ambassadeur",
    name: "Ambassadeur",
    description: "Le plus haut niveau de soutien pour porter Afrigombo à l'international.",
    icon: Crown,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    badge: "🌍"
  }
];

interface SupportAfrigomboProps {
  onBack?: () => void;
}

export default function SupportAfrigombo({ onBack }: SupportAfrigomboProps) {
  const { profile } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLevel || !profile) return;
    
    setLoading(true);
    try {
      await gomboDB.supportAfrigombo({
        uid: profile.uid || "",
        email: profile.email || "",
        displayName: profile.artisticName || profile.name || "Anonyme",
        level: selectedLevel.id,
        amount: parseInt(amount) || 0,
        badge: selectedLevel.badge,
        message,
        isAnonymous,
        createdAt: new Date().toISOString()
      });
      setSuccess(true);
    } catch (error) {
      console.error("Support error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-afri-bg flex items-center justify-center p-6 text-center transition-colors">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full space-y-8 bg-afri-bg-sec border border-afri-border p-12 rounded-[3rem] shadow-xl"
        >
          <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black font-sans uppercase tracking-tighter text-afri-text">MERCI INFINIMENT !</h2>
            <p className="text-afri-text-sec font-medium text-sm">Votre soutien a été enregistré dans les archives du Temple. Vous faites désormais partie des Bâtisseurs d'AFRIGOMBO.</p>
          </div>
          <button
            onClick={() => window.location.href = "/"}
            className="w-full bg-afri-bg-sec hover:bg-opacity-95 text-black py-4 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-[0_10px_30px_rgba(212,175,55,0.3)] cursor-pointer text-xs"
          >
            Retour au Terrain
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-afri-bg text-afri-text pb-32 transition-colors">
      {/* Header Back Button */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 pointer-events-none">
        <button 
          onClick={onBack}
          className="p-3 bg-afri-bg-sec/90 backdrop-blur-md border border-afri-border rounded-full text-afri-text pointer-events-auto hover:bg-afri-bg-ter transition-all active:scale-95 shadow-md cursor-pointer"
        >
          <ArrowRight className="w-5 h-5 rotate-180" />
        </button>
      </div>

      <div className="pt-24 pb-16 px-6 text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-afri-bg-sec/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest"
        >
          <Star className="w-3.5 h-3.5 fill-current" />
          Construction du Temple
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-black font-sans tracking-tighter uppercase leading-none text-afri-text">
          SOUTENIR <span className="text-[#D4AF37]">AFRIGOMBO</span>
        </h1>
        <p className="text-afri-text-sec max-w-2xl mx-auto text-sm sm:text-base font-medium leading-relaxed">
          Aidez-nous à bâtir la première plateforme de confiance pour la musique africaine. Votre soutien finance le développement des outils de sécurité et de séquestre.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Levels List */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black font-sans uppercase tracking-tight text-afri-text">Choisissez votre niveau</h2>
            <div className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest">5 Rangs disponibles</div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {levels.map((level) => (
              <button
                key={level.id}
                onClick={() => setSelectedLevel(level)}
                className={`flex items-center gap-6 p-8 rounded-[2rem] border transition-all text-left relative overflow-hidden group cursor-pointer ${
                  selectedLevel?.id === level.id 
                    ? "bg-afri-bg-ter border-[#D4AF37] shadow-lg" 
                    : "bg-afri-bg-sec border-afri-border hover:border-[#D4AF37]/40 hover:shadow-md"
                }`}
              >
                {selectedLevel?.id === level.id && (
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-afri-bg-sec" />
                )}
                
                <div className={`w-16 h-16 rounded-2xl ${level.bg} flex items-center justify-center ${level.color} shrink-0 group-hover:scale-105 transition-transform`}>
                  <level.icon className="w-8 h-8" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg font-black font-sans uppercase text-afri-text">{level.name}</span>
                    <span className="text-xl">{level.badge}</span>
                  </div>
                  <p className="text-xs text-afri-text-sec font-medium leading-relaxed">{level.description}</p>
                </div>

                <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${selectedLevel?.id === level.id ? "opacity-100" : ""}`}>
                  <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Support Form */}
        <div className="lg:col-span-5">
          <div className="sticky top-24">
            <AnimatePresence mode="wait">
              {selectedLevel ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSubmit}
                  className="bg-afri-bg-sec border border-afri-border p-10 rounded-[2.5rem] space-y-8 shadow-xl text-left"
                >
                  <div className="flex items-center gap-4 pb-6 border-b border-afri-border">
                    <div className={`w-14 h-14 rounded-2xl ${selectedLevel.bg} flex items-center justify-center ${selectedLevel.color}`}>
                      <selectedLevel.icon className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-afri-text-sec uppercase tracking-widest">Rang Sélectionné</p>
                      <p className="text-xl font-black font-sans uppercase text-afri-text">{selectedLevel.name}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-afri-text-sec uppercase tracking-widest ml-1">Montant symbolique (FCFA)</label>
                      <div className="relative">
                        <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D4AF37]" />
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="Ex: 5000"
                          className="w-full bg-afri-bg border border-afri-border rounded-2xl py-4.5 pl-12 pr-4 text-afri-text font-mono font-extrabold focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-afri-text-sec uppercase tracking-widest ml-1">Message d'encouragement (Optionnel)</label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Votre mot d'encouragement pour le Conseil..."
                        rows={4}
                        className="w-full bg-afri-bg border border-afri-border rounded-2xl p-4 text-afri-text font-medium text-sm focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all resize-none"
                      />
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer group select-none">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isAnonymous ? "bg-afri-bg-sec border-[#D4AF37]" : "bg-afri-bg border-afri-border group-hover:border-[#D4AF37]"}`}>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                        />
                        {isAnonymous && <CheckCircle2 className="w-3.5 h-3.5 text-black fill-current" />}
                      </div>
                      <span className="text-[11px] font-bold text-afri-text-sec uppercase tracking-wide group-hover:text-afri-text transition-colors">Faire un don anonyme</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !amount}
                    className="w-full bg-afri-bg-sec hover:bg-opacity-95 text-black py-4.5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 group shadow-lg shadow-[#D4AF37]/15 text-xs cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        Confirmer le Soutien
                        <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <p className="text-[9px] text-center text-afri-text-muted font-bold uppercase tracking-wide leading-relaxed">
                    * Le paiement réel sera intégré lors du lancement officiel. Pour l'instant, votre promesse de soutien est enregistrée.
                  </p>
                </motion.form>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-afri-bg-sec border border-afri-border p-12 rounded-[2.5rem] text-center space-y-6 shadow-md"
                >
                  <div className="w-20 h-20 rounded-full bg-afri-bg-ter border border-afri-border flex items-center justify-center mx-auto text-afri-text-sec">
                    <Sparkles className="w-10 h-10 text-[#D4AF37]" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-black font-sans uppercase text-afri-text leading-tight">Sélectionnez un niveau pour commencer</p>
                    <p className="text-xs text-afri-text-sec font-medium italic">Chaque contribution compte pour la musique.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
