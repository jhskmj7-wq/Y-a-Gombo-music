import React from "react";
import { AlertCircle, Wallet, ArrowUpRight } from "lucide-react";
import { AndroidBottomSheet } from "../common/AfriModal";

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
  const calculatedMissing = missingAmount ?? Math.max(0, requiredAmount - currentBalance);

  return (
    <AndroidBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Solde insuffisant"
    >
      <div className="space-y-4 py-2">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <p className="text-xs text-afri-text-sec font-mono leading-relaxed">
            Votre Wallet AFRIGOMBO ELITE ne contient pas les fonds nécessaires pour {moduleName}.
          </p>
        </div>

        <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4 space-y-2.5 font-mono text-xs">
          <div className="flex justify-between items-center text-afri-text-sec">
            <span>Solde actuel :</span>
            <span className="font-bold text-afri-text">{currentBalance.toLocaleString("fr-FR")} FCFA</span>
          </div>
          {requiredAmount > 0 && (
            <div className="flex justify-between items-center text-afri-text-sec">
              <span>Prix requis :</span>
              <span className="font-bold text-amber-400">{requiredAmount.toLocaleString("fr-FR")} FCFA</span>
            </div>
          )}
          <div className="flex justify-between items-center text-rose-400 border-t border-afri-border pt-2 font-black">
            <span>Manquant :</span>
            <span>-{calculatedMissing.toLocaleString("fr-FR")} FCFA</span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              if (requiredAmount > 0) {
                localStorage.setItem("afrigombo_suggested_deposit_amount", String(calculatedMissing));
              }
              onRecharge();
            }}
            className="w-full min-h-[50px] px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black uppercase text-xs tracking-wider rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98 touch-manipulation"
          >
            <Wallet className="w-4 h-4" />
            <span>Recharger mon Wallet</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="w-full min-h-[46px] px-4 bg-afri-bg-sec hover:bg-afri-bg-ter text-afri-text-sec font-bold uppercase text-xs tracking-wider rounded-2xl border border-afri-border transition-all cursor-pointer active:scale-98 touch-manipulation"
          >
            Annuler
          </button>
        </div>
      </div>
    </AndroidBottomSheet>
  );
}

