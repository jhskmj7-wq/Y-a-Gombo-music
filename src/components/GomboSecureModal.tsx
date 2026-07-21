import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, X, CheckCircle2, Lock, Landmark, FileCheck, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../AuthContext";
import { gomboDB } from "../firebase";

interface GomboSecureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GomboSecureModal({ isOpen, onClose }: GomboSecureModalProps) {
  const { profile } = useAuth();
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleJoinWaitlist = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      await gomboDB.joinSecureWaitlist(
        profile.uid || "",
        profile.email || "",
        profile.artisticName || profile.name || "Anonyme",
        profile.location?.country || "Côte d'Ivoire"
      );
      setJoined(true);
    } catch (error) {
      console.error("Waitlist error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-afri-bg/90 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-afri-bg-sec border border-afri-border rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(212,175,55,0.15)]"
          >
            {/* Header with Gold Glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
            
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-afri-bg rounded-xl text-afri-text-muted transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 md:p-12 space-y-8">
              {joined ? (
                <div className="text-center py-10 space-y-8">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-black font-mono uppercase tracking-tighter text-afri-text">C'EST ENREGISTRÉ !</h2>
                    <p className="text-afri-text-sec text-sm font-medium">Vous êtes sur la liste prioritaire. Vous serez parmi les premiers à sécuriser vos cachets via AFRIGOMBO.</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-full bg-afri-text text-afri-bg py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-afri-bg-sec hover:text-black transition-all"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-20 h-20 rounded-3xl bg-afri-bg-sec/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] relative">
                      <ShieldCheck className="w-10 h-10" />
                      <div className="absolute -top-2 -right-2 bg-afri-bg-sec text-black text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">Bientôt</div>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black font-mono uppercase tracking-tighter leading-none text-afri-text">
                        🛡️ GOMBO SÉCURISÉ <span className="text-[#D4AF37]">AFRIGOMBO</span>
                      </h2>
                      <p className="text-afri-text-muted text-xs font-bold uppercase tracking-widest">Le Standard de Confiance Absolue</p>
                    </div>
                  </div>

                  <p className="text-afri-text-sec text-sm text-center font-medium leading-relaxed max-w-lg mx-auto">
                    Le système de paiement sécurisé arrive lors du lancement officiel. Grâce à lui, fini les cachets impayés ou les prestations non livrées.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-afri-bg border border-afri-border p-4 rounded-2xl flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                        <Landmark className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-black uppercase text-afri-text">Séquestre Automatique</p>
                        <p className="text-[9px] text-afri-text-muted font-medium">L'argent est bloqué par AFRIGOMBO dès la signature.</p>
                      </div>
                    </div>
                    <div className="bg-afri-bg border border-afri-border p-4 rounded-2xl flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-black uppercase text-afri-text">Contrat Certifié</p>
                        <p className="text-[9px] text-afri-text-muted font-medium">Protection juridique et signature électronique.</p>
                      </div>
                    </div>
                    <div className="bg-afri-bg border border-afri-border p-4 rounded-2xl flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-black uppercase text-afri-text">Paiement Garanti</p>
                        <p className="text-[9px] text-afri-text-muted font-medium">Paiement automatique après validation mutuelle.</p>
                      </div>
                    </div>
                    <div className="bg-afri-bg border border-afri-border p-4 rounded-2xl flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-black uppercase text-afri-text">Zéro Litige</p>
                        <p className="text-[9px] text-afri-text-muted font-medium">Médiation neutre en cas de désaccord.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={handleJoinWaitlist}
                      disabled={loading}
                      className="w-full bg-afri-bg-sec text-black py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 transition-transform shadow-[0_10px_30px_rgba(212,175,55,0.3)] group"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      ) : (
                        <>
                          Rejoindre la Liste Prioritaire
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                    <div className="flex items-center justify-center gap-2 text-[9px] font-black text-afri-text-muted uppercase tracking-widest">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Plus de 500 Bâtisseurs déjà inscrits
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
