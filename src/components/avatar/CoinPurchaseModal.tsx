import React, { useState } from 'react';
import { Coins, Wallet, Sparkles, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { CoinPackage } from '../../types/avatar';
import { COIN_PACKAGES, AvatarEngine } from '../../lib/avatarEngine';
import { useAuth } from '../../AuthContext';
import { useWalletSecurity } from '../../context/WalletSecurityContext';
import { AndroidBottomSheet } from '../common/AfriModal';

interface CoinPurchaseModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CoinPurchaseModal({ onClose, onSuccess }: CoinPurchaseModalProps) {
  const { currentUser, profile } = useAuth();
  const [selectedPkg, setSelectedPkg] = useState<CoinPackage>(COIN_PACKAGES[2]); // Default 4000 Coins
  const [purchasing, setPurchasing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // PIN security states
  const [showPinVerification, setShowPinVerification] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [pinAttempts, setPinAttempts] = useState(0);
  const [pinError, setPinError] = useState("");

  const walletBalance = profile?.wallet?.soldeDisponible ?? profile?.walletBalance ?? 0;
  const isBalanceSufficient = walletBalance >= selectedPkg.priceFcfa;

  // Secure PIN Hashing (SHA-256 with user UID salt)
  const hashPIN = async (pin: string, salt: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + ":" + salt);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const executePurchase = async () => {
    if (!currentUser) return;
    setPurchasing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await AvatarEngine.buyCoinPackage(currentUser.uid, selectedPkg, "wallet", profile);
      
      const totalCoins = selectedPkg.coins + (selectedPkg.bonusCoins || 0);
      setSuccessMsg(`Félicitations ! Vos ${totalCoins.toLocaleString("fr-FR")} Gombo Coins ont été crédités avec succès. 🎉`);

      // Event trigger
      window.dispatchEvent(new CustomEvent("wallet_balance_updated"));

      if (onSuccess) onSuccess();
      setShowPinVerification(false);
    } catch (err: any) {
      console.error("Coin purchase error:", err);
      setErrorMsg(err.message || "Erreur lors du rechargement des Gombo Coins.");
      setShowPinVerification(false);
    } finally {
      setPurchasing(false);
    }
  };

  const handleVerifyPinKeyPress = async (num: string) => {
    if (!currentUser) return;
    const expectedLength = profile?.paymentSettings?.pinLength || 4;
    if (enteredPin.length >= expectedLength) return;
    
    const nextPin = enteredPin + num;
    setEnteredPin(nextPin);
    setPinError("");

    if (nextPin.length === expectedLength) {
      setPurchasing(true);
      try {
        const hashed = await hashPIN(nextPin, currentUser.uid);
        if (hashed === profile?.paymentSettings?.pinHash) {
          // Success! Proceed to purchase
          await executePurchase();
        } else {
          const nextAttempts = pinAttempts + 1;
          setPinAttempts(nextAttempts);
          setEnteredPin("");
          if (nextAttempts >= 3) {
            setPinError("🔒 Sécurité : 3 tentatives incorrectes. Opération annulée.");
            setTimeout(() => {
              setShowPinVerification(false);
              setPinAttempts(0);
              setPinError("");
            }, 2000);
          } else {
            setPinError(`Code PIN incorrect. (${3 - nextAttempts} tentatives restantes)`);
          }
        }
      } catch (err) {
        console.error("Verification error", err);
        setPinError("Erreur de vérification");
        setEnteredPin("");
      } finally {
        setPurchasing(false);
      }
    }
  };

  const handleVerifyPinDelete = () => {
    setEnteredPin(prev => prev.slice(0, -1));
    setPinError("");
  };

  const { requireWalletAuthentication, formatWalletBalance, isBalanceHidden, toggleBalanceWithPin } = useWalletSecurity();

  const handleConfirmPurchase = async () => {
    const ok = await requireWalletAuthentication("PURCHASE");
    if (ok) {
      executePurchase();
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

        {showPinVerification ? (
          /* PIN Verification View */
          <div className="space-y-6 text-center py-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] animate-pulse">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-afri-text uppercase tracking-wider font-display">
                Saisie du PIN requis
              </h3>
              <p className="text-[11px] text-zinc-400 max-w-xs leading-relaxed">
                Veuillez saisir votre code secret du Wallet pour valider l'achat de ce pack de Gombo Coins.
              </p>
            </div>

            {/* Password Bullet dots indicators */}
            <div className="flex justify-center items-center gap-4 py-2">
              {Array.from({ length: profile?.paymentSettings?.pinLength || 4 }).map((_, idx) => {
                const isFilled = idx < enteredPin.length;
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${isFilled ? "bg-[#D4AF37] border-[#D4AF37] scale-110 shadow-[0_0_8px_rgba(212,175,55,0.4)]" : "bg-transparent border-zinc-700"}`}
                  />
                );
              })}
            </div>

            {/* Error message */}
            {pinError && (
              <p className="text-xs font-bold text-red-400 font-sans">
                ⚠️ {pinError}
              </p>
            )}

            {/* Virtual Keypad Pad */}
            <div className="grid grid-cols-3 gap-y-3 gap-x-6 max-w-[260px] mx-auto pt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleVerifyPinKeyPress(num.toString())}
                  className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-base font-bold font-mono text-afri-text flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                  disabled={purchasing}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setShowPinVerification(false);
                  setEnteredPin("");
                  setPinError("");
                }}
                className="w-12 h-12 rounded-full flex items-center justify-center text-[9px] font-black text-zinc-500 hover:text-zinc-400 cursor-pointer uppercase tracking-wider"
                disabled={purchasing}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleVerifyPinKeyPress("0")}
                className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-base font-bold font-mono text-afri-text flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                disabled={purchasing}
              >
                0
              </button>
              <button
                type="button"
                onClick={handleVerifyPinDelete}
                className="w-12 h-12 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-300 active:scale-95 cursor-pointer text-base"
                disabled={purchasing}
              >
                ⌫
              </button>
            </div>
          </div>
        ) : !isBalanceSufficient ? (
          /* Insufficient Balance View */
          <div className="space-y-4 py-2">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#D4AF37]">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-black text-afri-text uppercase tracking-wider font-display">
                Solde Wallet insuffisant
              </h3>
              <p className="text-xs text-afri-text-sec font-mono leading-relaxed max-w-xs mx-auto">
                Votre solde actuel est insuffisant pour acheter ce pack de Gombo Coins.
              </p>
            </div>

            <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center text-afri-text-sec">
                <div className="flex items-center gap-1.5">
                  <span>Solde actuel :</span>
                  <button
                    type="button"
                    onClick={toggleBalanceWithPin}
                    title={isBalanceHidden ? "Révéler le solde (Code PIN requis)" : "Masquer le solde"}
                    className="p-1 rounded text-zinc-400 hover:text-[#D4AF37] hover:bg-zinc-800/60 transition cursor-pointer"
                  >
                    {isBalanceHidden ? <EyeOff className="w-3.5 h-3.5 text-[#D4AF37]" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="font-bold text-afri-text">{formatWalletBalance(walletBalance, "FCFA")}</span>
              </div>
              <div className="flex justify-between items-center text-afri-text-sec">
                <span>Montant nécessaire :</span>
                <span className="font-bold text-amber-400">{selectedPkg.priceFcfa.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="flex justify-between items-center text-rose-400 border-t border-afri-border pt-2 font-black">
                <span>Il manque :</span>
                <span>{isBalanceHidden ? "•••••• FCFA" : `-${(selectedPkg.priceFcfa - walletBalance).toLocaleString("fr-FR")} FCFA`}</span>
              </div>
            </div>

            {/* Package details shown in insufficient view so user can choose other packages if they want */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-mono font-bold text-afri-text-sec uppercase">
                Changer de pack :
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {COIN_PACKAGES.map(pkg => {
                  const isSelected = selectedPkg.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPkg(pkg)}
                      className={`p-2 rounded-xl border transition text-xs cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-afri-bg-sec border-[#D4AF37]"
                          : "bg-afri-bg border-afri-border"
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono font-bold">
                        <span>{pkg.coins.toLocaleString("fr-FR")} 🪙</span>
                        <span className="text-emerald-400">{pkg.priceFcfa.toLocaleString("fr-FR")} F</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("afrigombo_suggested_deposit_amount", String(selectedPkg.priceFcfa - walletBalance));
                  window.dispatchEvent(new CustomEvent("open_wallet_deposit"));
                  onClose();
                }}
                className="w-full min-h-[50px] px-4 bg-gradient-to-r from-amber-500 to-[#D4AF37] hover:opacity-95 text-black font-black uppercase text-xs tracking-wider rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98 touch-manipulation"
              >
                <Wallet className="w-4 h-4" />
                <span>Recharger mon Wallet</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[46px] px-4 bg-afri-bg-sec hover:bg-afri-bg-ter text-afri-text-sec font-bold uppercase text-xs tracking-wider rounded-2xl border border-afri-border transition-all cursor-pointer active:scale-98 touch-manipulation"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          /* Normal Purchase View */
          <>
            {/* Packages Selection */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold text-afri-text-sec uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-afri-gold"></span>
                1. Choisissez votre pack Gombo Coins
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COIN_PACKAGES.map(pkg => {
                  const isSelected = selectedPkg.id === pkg.id;

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
                          + {pkg.bonusCoins.toLocaleString("fr-FR")} Bonus offert
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Method Details */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-mono font-bold text-afri-text-sec uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-afri-gold"></span>
                2. Mode de paiement
              </h4>
              <div className="p-4 rounded-2xl bg-afri-bg border border-afri-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-afri-bg-sec border border-afri-border flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black uppercase text-afri-text">Solde Wallet</span>
                      <button
                        type="button"
                        onClick={toggleBalanceWithPin}
                        title={isBalanceHidden ? "Révéler le solde (Code PIN requis)" : "Masquer le solde"}
                        className="p-0.5 rounded text-zinc-400 hover:text-[#D4AF37] transition cursor-pointer"
                      >
                        {isBalanceHidden ? <EyeOff className="w-3 h-3 text-[#D4AF37]" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="text-[10px] text-afri-text-muted font-mono">{formatWalletBalance(walletBalance, "FCFA")} disponible</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono uppercase">
                    SÉLECTIONNÉ
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-afri-border bg-afri-bg flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-afri-text-muted font-mono uppercase font-bold">Total à régler</span>
                <span className="text-base font-mono font-black text-emerald-400">
                  {selectedPkg.priceFcfa.toLocaleString("fr-FR")} FCFA
                </span>
              </div>

              <button
                type="button"
                onClick={handleConfirmPurchase}
                disabled={purchasing}
                className="px-6 py-3 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow hover:bg-white transition flex items-center gap-2 cursor-pointer disabled:opacity-50 animate-fadeIn"
              >
                {purchasing ? (
                  <span className="w-4 h-4 border-2 border-afri-border border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Coins className="w-4 h-4" />
                )}
                Confirmer l'achat
              </button>
            </div>
          </>
        )}
      </div>
    </AndroidBottomSheet>
  );
}
