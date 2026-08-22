import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, History, RefreshCcw, ArrowRight, Check, Sparkles, 
  KeyRound, MessageCircle, Crown, Calendar, CreditCard, ArrowLeft,
  AlertCircle, ChevronRight, CheckCircle2
} from 'lucide-react';
import { supportConfig } from '../supportConfig';
import { validateAndActivatePremiumCode } from '../lib/premiumSubscriptionEngine';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { subscribeToFeatureFlags, getModuleVisibility } from '../lib/featureFlags';

interface Props {
  isPremium: boolean;
  onUpgrade: () => void;
  onBack?: () => void;
  currentUserProfile?: any;
  onRefreshProfile?: () => void;
}

export const MonAbonnementView: React.FC<Props> = ({ 
  isPremium, 
  onUpgrade, 
  onBack,
  currentUserProfile,
  onRefreshProfile
}) => {
  const [flagsMap, setFlagsMap] = useState<any>({});
  useEffect(() => {
    const unsub = subscribeToFeatureFlags((map) => setFlagsMap(map));
    return () => unsub();
  }, []);

  const userEmail = currentUserProfile?.email || "";
  const isFounder = userEmail.toLowerCase() === "jhs.kmj7@gmail.com";
  const vis = getModuleVisibility("premium", currentUserProfile, currentUserProfile, flagsMap);

  if (vis === "HIDDEN" && !isFounder) {
    return (
      <div className="p-8 text-center text-afri-text space-y-4">
        <p className="text-sm font-mono text-gray-400">Ce module est actuellement indisponible.</p>
        {onBack && (
          <button onClick={onBack} className="px-4 py-2 bg-[#D4AF37] text-black rounded-xl font-bold text-xs">
            Retour
          </button>
        )}
      </div>
    );
  }

  if (vis === "COMING_SOON" && !isFounder) {
    return (
      <div className="p-8 text-center bg-black/40 border border-[#D4AF37]/30 rounded-2xl my-6 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] mx-auto font-bold text-xl">
          💎
        </div>
        <h3 className="text-lg font-black text-white">Adhésion Premium ELITE — Bientôt disponible</h3>
        <p className="text-xs text-afri-text-sec max-w-md mx-auto">
          Le programme d'adhésion Premium arrive très prochainement sur AFRIGOMBO.
        </p>
        {onBack && (
          <button onClick={onBack} className="mt-4 px-4 py-2 bg-[#D4AF37] text-black rounded-xl font-bold text-xs">
            Retour
          </button>
        )}
      </div>
    );
  }
  // Activation code local state
  const [inputCode, setInputCode] = useState("");
  const [activationError, setActivationError] = useState("");
  const [activationSuccess, setActivationSuccess] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [isUpdatingAutoRenew, setIsUpdatingAutoRenew] = useState(false);

  const isAutoRenew = currentUserProfile?.isPremiumAutoRenew !== false;

  const handleToggleAutoRenew = async () => {
    if (!currentUserProfile?.uid || isUpdatingAutoRenew) return;
    setIsUpdatingAutoRenew(true);
    try {
      const userRef = doc(db, "users", currentUserProfile.uid);
      await updateDoc(userRef, {
        isPremiumAutoRenew: !isAutoRenew
      });
      if (onRefreshProfile) {
        onRefreshProfile();
      }
    } catch (error) {
      console.error("Error toggling auto renew:", error);
    } finally {
      setIsUpdatingAutoRenew(false);
    }
  };

  // Derive current plan name
  const currentPlan = currentUserProfile?.subscriptionPlan || 
    (isPremium ? "GOMBO ELITE" : "GOMBO FREE");
  
  const isFree = !isPremium && (!currentUserProfile?.subscriptionPlan || currentUserProfile?.subscriptionPlan === "GOMBO FREE");
  
  // Format expiry date
  const expiryDate = currentUserProfile?.subscriptionExpiryDate || "25 Août 2026";

  const handleActivateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError("");
    setActivationSuccess("");

    if (!inputCode || inputCode.trim().length < 4) {
      setActivationError("Code invalide.");
      return;
    }

    setIsActivating(true);

    try {
      const res = await validateAndActivatePremiumCode(
        inputCode,
        currentUserProfile?.uid || "guest_user",
        "elite"
      );

      if (res.success) {
        setActivationSuccess(res.message);
        setInputCode("");
        if (onRefreshProfile) {
          onRefreshProfile();
        }
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('gombo_play_sound', { detail: { name: 'premium' } }));
        }
      } else {
        setActivationError("Code invalide.");
      }
    } catch (err) {
      setActivationError("Code invalide.");
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="afri-container space-y-5 animate-fadeIn text-left py-2 xs:py-4 max-w-2xl mx-auto">
      
      {/* 1. FORMULE ACTUELLE ET STATUT */}
      <div className="bg-gradient-to-b from-afri-bg-sec to-afri-bg border border-[#D4AF37]/30 rounded-2xl p-5 shadow-lg relative overflow-hidden space-y-4">
        <div className="flex flex-wrap justify-between items-start gap-3 border-b border-afri-border/50 pb-4">
          <div>
            <span className="text-[9px] font-mono font-black text-afri-text-sec uppercase tracking-[0.2em] block mb-1">
              Formule Actuelle
            </span>
            <h3 className="text-xl font-black text-afri-text uppercase tracking-tight flex items-center gap-2">
              {currentPlan}
              {currentPlan.includes("ELITE") && (
                <span className="px-2.5 py-0.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[9px] font-black uppercase rounded-md tracking-wider inline-flex items-center gap-1 shadow-xs">
                  <Crown className="w-3 h-3 text-[#D4AF37]" /> Gold Prestige
                </span>
              )}
              {currentPlan.includes("PRO") && (
                <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[9px] font-black uppercase rounded-md tracking-wider">
                  Silver
                </span>
              )}
            </h3>
          </div>

          <div className="flex items-center gap-2 bg-afri-bg px-3 py-1.5 rounded-xl border border-afri-border/80">
            <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${isFree ? 'bg-zinc-500' : 'bg-emerald-400'}`} />
            <span className="text-xs font-bold uppercase tracking-wider text-afri-text">
              Statut : <strong className={isFree ? 'text-afri-text-sec' : 'text-emerald-400'}>{isFree ? 'Compte Gratuit' : 'Actif'}</strong>
            </span>
          </div>
        </div>

        {/* DETAILS: DATES & RENOUVELLEMENT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-afri-bg rounded-xl border border-afri-border/80 space-y-1">
            <div className="flex items-center gap-1.5 text-afri-text-sec font-mono text-[10px] uppercase font-bold">
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Date d'expiration</span>
            </div>
            <p className="font-bold text-afri-text font-mono text-sm">{expiryDate}</p>
          </div>

          <div className="p-3 bg-afri-bg rounded-xl border border-afri-border/80 space-y-1.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-afri-text-sec font-mono text-[10px] uppercase font-bold">
                  <RefreshCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Renouvellement</span>
                </div>
                {!isFree && (
                  <button
                    type="button"
                    disabled={isUpdatingAutoRenew}
                    onClick={handleToggleAutoRenew}
                    className="text-[9px] font-mono font-black uppercase text-[#D4AF37] hover:underline cursor-pointer"
                  >
                    {isUpdatingAutoRenew ? "..." : isAutoRenew ? "Passer en Manuel" : "Passer en Auto"}
                  </button>
                )}
              </div>
              <p className="font-bold text-afri-text font-mono text-sm">
                {isFree ? "Désactivé" : isAutoRenew ? "Automatique" : "Manuel"}
              </p>
            </div>
            {!isFree && (
              <p className="text-[9px] text-afri-text-sec leading-none pt-0.5">
                {isAutoRenew 
                  ? "Débité automatiquement de votre Wallet si solde suffisant." 
                  : "Le service s'arrêtera à expiration sauf paiement manuel."}
              </p>
            )}
          </div>
        </div>

        {/* BUTTON CHANGER DE FORMULE */}
        <div className="pt-1">
          <button
            onClick={onUpgrade}
            className="w-full py-3 bg-[#D4AF37] hover:bg-amber-400 active:scale-98 text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Changer de formule</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* 2. ACTIVER UN CODE BÊTA / CODE D'ACTIVATION */}
      <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-afri-text">
          <KeyRound className="w-4 h-4 text-[#D4AF37]" />
          <h3 className="text-xs font-black uppercase tracking-wider">Activer un code Bêta / Pass Premium</h3>
        </div>

        <form onSubmit={handleActivateCode} className="space-y-3">
          <div className="flex gap-2">
            <input 
              type="text"
              value={inputCode}
              onChange={(e) => {
                setInputCode(e.target.value.toUpperCase());
                setActivationError("");
              }}
              placeholder="Ex: AG-PRO-9842"
              className="flex-1 bg-afri-bg p-3 text-xs rounded-xl border border-afri-border text-afri-text focus:border-[#D4AF37] focus:outline-none font-mono tracking-wider font-bold uppercase"
            />
            <button
              type="submit"
              disabled={isActivating || !inputCode.trim()}
              className="px-5 py-3 bg-afri-bg-ter border border-[#D4AF37]/50 hover:bg-[#D4AF37] hover:text-black text-[#D4AF37] text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isActivating ? "..." : "Activer"}
            </button>
          </div>

          {activationError && (
            <p className="text-xs font-bold text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/30 text-center">
              {activationError}
            </p>
          )}

          {activationSuccess && (
            <p className="text-xs font-bold text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30 text-center">
              {activationSuccess}
            </p>
          )}
        </form>
      </div>

      {/* 3. HISTORIQUE DES SOUSCRIPTIONS */}
      <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-afri-text border-b border-afri-border/50 pb-2">
          <History className="w-4 h-4 text-[#D4AF37]" />
          <h3 className="text-xs font-black uppercase tracking-wider">Historique de souscription</h3>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center p-3 bg-afri-bg rounded-xl border border-afri-border/60">
            <div>
              <p className="font-bold text-afri-text">{currentPlan}</p>
              <span className="text-[10px] text-afri-text-sec font-mono">Actif depuis le 25/07/2026</span>
            </div>
            <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-[10px] rounded-lg">
              Validé
            </span>
          </div>
        </div>
      </div>

      {/* 4. SUPPORT CLIENT */}
      <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex justify-between items-center">
          <div className="space-y-0.5">
            <h4 className="text-xs font-black text-afri-text uppercase tracking-wide">Besoin d'aide sur votre abonnement ?</h4>
            <p className="text-[10px] text-afri-text-sec">Notre assistance client est disponible 24/7 sur WhatsApp</p>
          </div>
          <button
            onClick={() => {
              supportConfig.openSupport(`Bonjour Support AFRIGOMBO ELITE 👋\nJe vous contacte concernant la gestion de mon abonnement ${currentPlan}.`);
            }}
            className="px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-400 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-emerald-400" />
            <span>Support</span>
          </button>
        </div>
      </div>

    </div>
  );
};
