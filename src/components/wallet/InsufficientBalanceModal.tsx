import React from "react";
import { AlertCircle, Wallet, X, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface InsufficientBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecharge: () => void;
  currentBalance?: number;
  requiredAmount?: number;
  missingAmount?: number;
  moduleName?: string;
}

export function InsufficientBalanceModal({
  isOpen,
  onClose,
  onRecharge,
  currentBalance = 0,
  requiredAmount = 0,
  missingAmount,
  moduleName = "cet achat"
}: InsufficientBalanceModalProps) {
  if (!isOpen) return null;

  const calculatedMissing = missingAmount ?? Math.max(0, requiredAmount - currentBalance);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-zinc-950 border border-amber-500/40 rounded-3xl p-6 shadow-2xl text-left space-y-5"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight font-sans">
              Solde insuffisant
            </h3>
            <p className="text-xs text-zinc-400 font-mono">
              Votre Wallet AFRIGOMBO ne contient pas les fonds nécessaires pour {moduleName}.
            </p>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-2.5 font-mono text-xs">
            <div className="flex justify-between items-center text-zinc-400">
              <span>Solde actuel :</span>
              <span className="font-bold text-white">{currentBalance.toLocaleString("fr-FR")} FCFA</span>
            </div>
            {requiredAmount > 0 && (
              <div className="flex justify-between items-center text-zinc-400">
                <span>Prix requis :</span>
                <span className="font-bold text-amber-400">{requiredAmount.toLocaleString("fr-FR")} FCFA</span>
              </div>
            )}
            <div className="flex justify-between items-center text-rose-400 border-t border-zinc-800/80 pt-2 font-black">
              <span>Manquant :</span>
              <span>-{calculatedMissing.toLocaleString("fr-FR")} FCFA</span>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <button
              onClick={() => {
                if (requiredAmount > 0) {
                  localStorage.setItem("afrigombo_suggested_deposit_amount", String(calculatedMissing));
                }
                onRecharge();
              }}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Wallet className="w-4 h-4" />
              <span>Recharger mon Wallet</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold uppercase text-xs tracking-wider rounded-xl border border-zinc-800 transition-all cursor-pointer"
            >
              Annuler
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
