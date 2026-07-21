import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Info, ShieldCheck, Lock, X, Check } from "lucide-react";

interface BetaEscrowInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BetaEscrowInfoModal: React.FC<BetaEscrowInfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 10 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-afri-bg-sec border border-[#D4AF37] rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl text-left relative overflow-hidden"
        >
          {/* Header decorative accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-[#D4AF37] to-amber-600" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-afri-text-sec hover:text-afri-text transition-colors p-1.5 rounded-full hover:bg-afri-bg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon & Title */}
          <div className="flex items-center gap-3 pt-1">
            <div className="p-3 bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] rounded-2xl shrink-0 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] font-bold block">
                AFRIGOMBO BÊTA PUBLIQUE
              </span>
              <h3 className="text-lg font-black text-afri-text font-sans leading-tight">
                Dépôt sécurisé – Phase Bêta
              </h3>
            </div>
          </div>

          {/* Main Body Text (Exact required copy) */}
          <div className="p-4 bg-afri-bg/80 border border-afri-border rounded-2xl space-y-3 text-xs text-afri-text-sec leading-relaxed font-sans">
            <p className="font-medium text-afri-text">
              Bienvenue dans la phase Bêta Publique d'AFRIGOMBO.
            </p>
            <p>
              Notre système de dépôt sécurisé (Escrow) est actuellement en phase de validation.
            </p>
            <p>
              Pendant cette période, les dépôts sont accompagnés manuellement par l'équipe AFRIGOMBO afin de garantir la sécurité des transactions.
            </p>
            <p>
              Le fonctionnement définitif sera entièrement automatisé dans une prochaine mise à jour.
            </p>
            <p className="text-[#D4AF37] font-bold pt-1">
              Merci de participer à la construction d'AFRIGOMBO.
            </p>
          </div>

          {/* Footer Badge */}
          <div className="flex items-center gap-2 text-[10px] text-afri-text-muted font-mono bg-afri-bg/40 p-2.5 rounded-xl border border-afri-border/60">
            <Lock className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <span>Escrow Garanti • Protection 100% Promoteur & Artiste</span>
          </div>

          {/* Confirm Button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer hover:bg-[#e0c058] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/15"
          >
            <Check className="w-4 h-4" />
            <span>J'ai compris</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface BetaEscrowInfoButtonProps {
  className?: string;
  variant?: "icon" | "badge" | "button";
}

export const BetaEscrowInfoButton: React.FC<BetaEscrowInfoButtonProps> = ({
  className = "",
  variant = "badge",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {variant === "icon" && (
        <button
          onClick={() => setIsOpen(true)}
          title="Dépôt sécurisé – Phase Bêta"
          className={`p-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all cursor-pointer inline-flex items-center justify-center ${className}`}
        >
          <Info className="w-4 h-4" />
        </button>
      )}

      {variant === "badge" && (
        <button
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${className}`}
        >
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Dépôt Bêta ℹ️</span>
        </button>
      )}

      {variant === "button" && (
        <button
          onClick={() => setIsOpen(true)}
          className={`px-3 py-1.5 rounded-xl bg-afri-bg border border-[#D4AF37]/30 hover:border-[#D4AF37] text-afri-text text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${className}`}
        >
          <span className="p-1 bg-[#D4AF37]/20 text-[#D4AF37] rounded-lg text-xs">ℹ️</span>
          <span>Info Dépôt Bêta</span>
        </button>
      )}

      <BetaEscrowInfoModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default BetaEscrowInfoModal;
