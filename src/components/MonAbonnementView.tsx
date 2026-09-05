import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, History, RefreshCcw, ArrowRight, Check, Sparkles, 
  KeyRound, MessageCircle, Crown, Calendar, CreditCard, ArrowLeft,
  AlertCircle, ChevronRight, CheckCircle2, Clock, Phone, Smartphone
} from 'lucide-react';
import { supportConfig } from '../supportConfig';
import { validateAndActivatePremiumCode } from '../lib/premiumSubscriptionEngine';
import { db } from '../lib/firebase';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { subscribeToFeatureFlags, getModuleVisibility } from '../lib/featureFlags';
import { PremiumEngine } from '../lib/premiumEngine';
import { SubscriptionRequest } from '../types';

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
  const [pendingRequest, setPendingRequest] = useState<SubscriptionRequest | null>(null);

  useEffect(() => {
    const unsub = subscribeToFeatureFlags((map) => setFlagsMap(map));
    return () => unsub();
  }, []);

  // Listen to active user's pending subscription requests
  useEffect(() => {
    if (!currentUserProfile?.uid || !db) return;

    const q = query(
      collection(db, "subscription_requests"),
      where("userId", "==", currentUserProfile.uid),
      where("status", "==", "pending")
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const d = snap.docs[0];
        setPendingRequest({ id: d.id, ...d.data() } as SubscriptionRequest);
      } else {
        setPendingRequest(null);
      }
    }, (err) => {
      console.warn("Notice checking pending sub requests:", err);
    });

    return () => unsub();
  }, [currentUserProfile?.uid]);

  const userEmail = currentUserProfile?.email || "";
  const isFounder = userEmail.toLowerCase() === "jhs.kmj7@gmail.com";
  const vis = getModuleVisibility("premium", currentUserProfile, currentUserProfile, flagsMap);

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
    (isPremium ? (currentUserProfile?.premiumPlan === "pro" ? "GOMBO PRO" : "GOMBO ELITE") : "GOMBO FREE");
  
  const isFree = !isPremium && (!currentUserProfile?.subscriptionPlan || currentUserProfile?.subscriptionPlan === "GOMBO FREE");
  
  // Format expiry date
  const expiryDate = currentUserProfile?.premiumExpiresAt 
    ? new Date(currentUserProfile.premiumExpiresAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : (currentUserProfile?.subscriptionExpiryDate || "Aucune expiration");

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
        setActivationError("Code invalide ou expiré.");
      }
    } catch (err) {
      setActivationError("Code invalide.");
    } finally {
      setIsActivating(false);
    }
  };

  if (vis === "HIDDEN" && !isFounder) {
    return (
      <div className="p-8 text-center text-afri-text space-y-4">
        <p className="text-sm font-mono text-gray-400">Ce module est actuellement indisponible.</p>
        {onBack && (
          <button onClick={onBack} className="px-4 py-2 bg-afri-gold text-black rounded-xl font-bold text-xs">
            Retour
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="afri-container space-y-5 animate-fadeIn text-left py-2 xs:py-4 max-w-2xl mx-auto">
      
      {/* HEADER */}
      <div className="flex items-center justify-center border-b border-afri-border/60 pb-3">
        <h2 className="text-lg xs:text-xl font-black text-afri-text uppercase tracking-tight flex items-center gap-2 text-center">
          <ShieldCheck className="w-5 h-5 text-afri-gold" />
          <span>Gestion de l'Abonnement</span>
        </h2>
      </div>

      {/* PENDING MANUAL REQUEST BANNER IF ACTIVE */}
      {pendingRequest && (
        <div className="bg-gradient-to-r from-amber-500/15 via-afri-gold/10 to-transparent border border-afri-gold/50 rounded-2xl p-4 space-y-2.5 shadow-md">
          <div className="flex items-center gap-2 text-afri-gold font-black text-xs uppercase tracking-wider">
            <Clock className="w-4 h-4 animate-spin text-afri-gold" />
            <span>Demande d'Adhésion en cours de vérification</span>
          </div>
          <div className="p-3 bg-afri-bg/80 rounded-xl border border-afri-border text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-afri-text-muted">Formule demandée :</span>
              <span className="font-bold text-afri-text">{pendingRequest.planName} ({pendingRequest.billingCycle === "yearly" ? "Annuel" : "Mensuel"})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-afri-text-muted">Montant :</span>
              <span className="font-mono font-bold text-emerald-400">{pendingRequest.amount.toLocaleString("fr-FR")} FCFA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-afri-text-muted">Moyen :</span>
              <span className="font-bold text-afri-text">{pendingRequest.paymentMethod}</span>
            </div>
            {pendingRequest.paymentReference && (
              <div className="flex justify-between">
                <span className="text-afri-text-muted">Réf. transaction :</span>
                <span className="font-mono text-afri-gold">{pendingRequest.paymentReference}</span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-afri-text-muted">
            Le Fondateur vérifie actuellement votre reçu Mobile Money. L'activation sera immédiate dès validation.
          </p>
          <a
            href={`https://wa.me/2250503222712?text=${encodeURIComponent(`Bonjour Fondateur, je suis ${pendingRequest.userName} (${pendingRequest.userPhone}). J'ai transmis une demande d'abonnement ${pendingRequest.planName}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Échanger avec le Support WhatsApp</span>
          </a>
        </div>
      )}

      {/* 1. FORMULE ACTUELLE ET STATUT */}
      <div className="bg-gradient-to-b from-afri-bg-sec to-afri-bg border border-afri-gold/30 rounded-2xl p-5 shadow-lg relative overflow-hidden space-y-4">
        <div className="flex flex-wrap justify-between items-start gap-3 border-b border-afri-border/50 pb-4">
          <div>
            <span className="text-[9px] font-mono font-black text-afri-text-muted uppercase tracking-[0.2em] block mb-1">
              Formule Actuelle
            </span>
            <h3 className="text-xl font-black text-afri-text uppercase tracking-tight flex items-center gap-2">
              {currentPlan}
              {currentPlan.includes("ELITE") && (
                <span className="px-2.5 py-0.5 bg-afri-gold/20 border border-afri-gold/40 text-afri-gold text-[9px] font-black uppercase rounded-md tracking-wider inline-flex items-center gap-1 shadow-xs">
                  <Crown className="w-3 h-3 text-afri-gold" /> Gold Prestige
                </span>
              )}
              {currentPlan.includes("PRO") && (
                <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[9px] font-black uppercase rounded-md tracking-wider">
                  Silver Pro
                </span>
              )}
            </h3>
          </div>

          <div className="flex items-center gap-2 bg-afri-bg px-3 py-1.5 rounded-xl border border-afri-border/80">
            <span className={`w-2.5 h-2.5 rounded-full ${isFree ? 'bg-zinc-500' : 'bg-emerald-400 animate-pulse'}`} />
            <span className="text-xs font-bold uppercase tracking-wider text-afri-text">
              Statut : <strong className={isFree ? 'text-afri-text-muted' : 'text-emerald-400'}>{isFree ? 'Compte Gratuit' : 'Actif'}</strong>
            </span>
          </div>
        </div>

        {/* DETAILS: DATES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-afri-bg rounded-xl border border-afri-border/80 space-y-1">
            <div className="flex items-center gap-1.5 text-afri-text-muted font-mono text-[10px] uppercase font-bold">
              <Calendar className="w-3.5 h-3.5 text-afri-gold" />
              <span>Date d'expiration</span>
            </div>
            <p className="font-bold text-afri-text font-mono text-sm">{expiryDate}</p>
          </div>

          <div className="p-3 bg-afri-bg rounded-xl border border-afri-border/80 space-y-1">
            <div className="flex items-center gap-1.5 text-afri-text-muted font-mono text-[10px] uppercase font-bold">
              <Smartphone className="w-3.5 h-3.5 text-afri-gold" />
              <span>Mode de Gestion Bêta</span>
            </div>
            <p className="font-bold text-afri-text font-mono text-sm">
              Validation Manuelle Souveraine
            </p>
          </div>
        </div>

        {/* VRAIS AVANTAGES ACTIFS DE LA FORMULE */}
        {(() => {
          const planKey = PremiumEngine.getSubscriptionPlan(currentUserProfile);
          const dailyPub = PremiumEngine.getDailyPublicationLimit(currentUserProfile);
          const mediaLimit = PremiumEngine.getPortfolioMediaLimit(currentUserProfile);
          const boostMul = PremiumEngine.getSearchBoostMultiplier(currentUserProfile);
          const boostPercent = boostMul === 2.5 ? "+150%" : boostMul === 1.4 ? "+40%" : "Standard";

          return (
            <div className="p-3.5 bg-afri-bg rounded-xl border border-afri-border/80 space-y-2.5">
              <div className="flex items-center justify-between border-b border-afri-border/60 pb-1.5">
                <span className="text-[10px] font-black uppercase text-afri-gold tracking-wider">
                  Avantages actifs appliqués à votre compte
                </span>
                <span className="text-[9px] font-bold text-emerald-400">100% Opérationnel</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    Publications : <strong>{dailyPub >= 50 ? "Illimitées" : `${dailyPub}/jour`}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    Portfolio : <strong>{mediaLimit >= 50 ? "Illimité" : `${mediaLimit} médias`}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    Visibilité : <strong>{boostPercent}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    Badge : <strong>{planKey === "elite" ? "Gold Prestige" : planKey === "pro" ? "Silver Pro" : "Standard"}</strong>
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* BUTTON CHANGER DE FORMULE */}
        <div className="pt-1">
          <button
            onClick={onUpgrade}
            className="w-full py-3.5 bg-afri-gold hover:bg-amber-400 active:scale-98 text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer min-h-[46px]"
          >
            <span>Découvrir ou Changer de Formule</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* 2. ACTIVER UN CODE BÊTA / CODE D'ACTIVATION */}
      <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-afri-text">
          <KeyRound className="w-4 h-4 text-afri-gold" />
          <h3 className="text-xs font-black uppercase tracking-wider">Activer un Pass Premium (Code Unique)</h3>
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
              className="flex-1 bg-afri-bg p-3 text-xs rounded-xl border border-afri-border text-afri-text focus:border-afri-gold focus:outline-none font-mono tracking-wider font-bold uppercase"
            />
            <button
              type="submit"
              disabled={isActivating || !inputCode.trim()}
              className="px-5 py-3 bg-afri-bg-ter border border-afri-gold/50 hover:bg-afri-gold hover:text-black text-afri-gold text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50 shrink-0 min-h-[44px]"
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

      {/* 3. SUPPORT CLIENT DIRECT */}
      <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex justify-between items-center gap-2">
          <div className="space-y-0.5">
            <h4 className="text-xs font-black text-afri-text uppercase tracking-wide">Besoin d'aide sur votre abonnement ?</h4>
            <p className="text-[10px] text-afri-text-muted">Assistance client directe sur WhatsApp</p>
          </div>
          <button
            onClick={() => {
              supportConfig.openSupport(`Bonjour Support AFRIGOMBO ELITE 👋\nJe vous contacte concernant mon abonnement ${currentPlan}.`);
            }}
            className="px-4 py-2.5 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-400 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[44px]"
          >
            <MessageCircle className="w-4 h-4 fill-emerald-400" />
            <span>Support</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default MonAbonnementView;
