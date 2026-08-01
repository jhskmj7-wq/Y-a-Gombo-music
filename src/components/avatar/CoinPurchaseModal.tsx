import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Coins, Wallet, CreditCard, ShieldCheck, Check, X, Sparkles, PhoneCall } from 'lucide-react';
import { CoinPackage } from '../../types/avatar';
import { COIN_PACKAGES, AvatarEngine } from '../../lib/avatarEngine';
import { useAuth } from '../../AuthContext';
import { AndroidBottomSheet } from '../common/AfriModal';

interface CoinPurchaseModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const PAYMENT_METHODS = [
  { id: "wallet", name: "Portefeuille FCFA", icon: <Wallet className="w-4 h-4 text-[#D4AF37]" />, desc: "Déduction directe du solde" },
  { id: "wave", name: "Wave Mobile Money", icon: "🌊", desc: "Paiement Wave Côte d'Ivoire" },
  { id: "orange", name: "Orange Money", icon: "🟧", desc: "Code OTP #144#" },
  { id: "mtn", name: "MTN MoMo", icon: "🨨", desc: "Paiement Mobile Money" },
  { id: "moov", name: "Moov Money", icon: "🟦", desc: "Flooz Money" }
];

export default function CoinPurchaseModal({ onClose, onSuccess }: CoinPurchaseModalProps) {
  const { currentUser, profile } = useAuth();
  const [selectedPkg, setSelectedPkg] = useState<CoinPackage>(COIN_PACKAGES[2]); // Default 4000 Coins
  const [paymentMethod, setPaymentMethod] = useState<string>("wallet");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [purchasing, setPurchasing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const walletBalance = profile?.wallet?.soldeDisponible ?? profile?.walletBalance ?? 0;

  const handleBuyCoins = async () => {
    if (!currentUser) return;

    if (paymentMethod !== "wallet" && !phoneNumber) {
      setErrorMsg("Veuillez saisir votre numéro de téléphone Mobile Money.");
      return;
    }

    setPurchasing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await AvatarEngine.buyCoinPackage(currentUser.uid, selectedPkg, paymentMethod, profile);
      
      const totalCoins = selectedPkg.coins + (selectedPkg.bonusCoins || 0);
      setSuccessMsg(`Félicitations ! Vos ${totalCoins.toLocaleString("fr-FR")} Gombo Coins ont été crédités avec succès. 🎉`);

      // Event trigger
      window.dispatchEvent(new CustomEvent("wallet_balance_updated"));

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Coin purchase error:", err);
      setErrorMsg(err.message || "Erreur lors du rechargement des Gombo Coins.");
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <AndroidBottomSheet
      isOpen={true}
      onClose={onClose}
      title="RECHARGER GOMBO COINS"
      subtitle="Achetez des Gombo Coins pour débloquer vêtements & couronnes"
    >
      <div className="space-y-5 text-left font-sans py-1">
        {/* Alerts */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-2xl">
            {errorMsg}
          </div>
        )}

          {successMsg && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-2xl flex items-center gap-3">
              <Sparkles className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Packages Selection */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-afri-text-sec uppercase">
              1. Choisissez votre pack Gombo Coins
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {COIN_PACKAGES.map(pkg => {
                const isSelected = selectedPkg.id === pkg.id;
                const totalCoins = pkg.coins + (pkg.bonusCoins || 0);

                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg)}
                    className={`p-4 rounded-2xl border transition cursor-pointer relative flex flex-col justify-between gap-3 ${
                      isSelected
                        ? "bg-afri-bg-sec border-[#D4AF37] shadow-lg shadow-[#D4AF37]/5"
                        : "bg-afri-bg border-afri-border hover:border-afri-border"
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2.5 right-3 px-2 py-0.5 bg-[#D4AF37] text-black font-black text-[8px] uppercase rounded-full shadow">
                        POPULAIRE 🔥
                      </span>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-[#D4AF37]" />
                        <span className="text-lg font-black text-afri-text font-mono">
                          {pkg.coins.toLocaleString("fr-FR")}
                        </span>
                      </div>
                      <span className="text-sm font-mono font-black text-emerald-400">
                        {pkg.priceFcfa.toLocaleString("fr-FR")} FCFA
                      </span>
                    </div>

                    {pkg.bonusCoins ? (
                      <span className="text-[10px] font-mono font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 rounded-lg border border-[#D4AF37]/20 w-fit">
                        + {pkg.bonusCoins} Bonus offert
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-mono font-bold text-afri-text-sec uppercase">
              2. Mode de paiement
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition cursor-pointer ${
                    paymentMethod === m.id
                      ? "bg-afri-bg-sec border-[#D4AF37] text-afri-text"
                      : "bg-afri-bg border-afri-border text-afri-text-sec hover:border-afri-border"
                  }`}
                >
                  <span className="text-lg">{m.icon}</span>
                  <div>
                    <div className="text-xs font-black uppercase text-afri-text">{m.name}</div>
                    <div className="text-[10px] text-afri-text-muted">{m.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {paymentMethod !== "wallet" && (
              <div className="mt-3">
                <label className="text-[11px] font-mono font-bold text-afri-text-sec uppercase block mb-1">
                  Numéro de téléphone Mobile Money
                </label>
                <div className="relative">
                  <PhoneCall className="w-4 h-4 text-afri-text-muted absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    placeholder="e.g. 0708091011"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-afri-border bg-afri-bg flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-afri-text-muted font-mono uppercase font-bold">Total à régler</span>
            <span className="text-base font-mono font-black text-emerald-400">
              {selectedPkg.priceFcfa.toLocaleString("fr-FR")} FCFA
            </span>
          </div>

          <button
            onClick={handleBuyCoins}
            disabled={purchasing}
            className="px-8 py-3 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow hover:bg-white transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {purchasing ? (
              <span className="w-4 h-4 border-2 border-afri-border border-t-transparent rounded-full animate-spin" />
            ) : (
              <Coins className="w-4 h-4" />
            )}
            Confirmer le rechargement
          </button>
        </div>
    </AndroidBottomSheet>
  );
}
