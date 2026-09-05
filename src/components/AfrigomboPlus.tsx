import React, { useState, useEffect } from "react";
import { 
  Sparkles, Check, ChevronLeft, CreditCard, Award, Shield, Music, 
  BarChart3, Radio, X, Zap, Calculator, KeyRound, MessageCircle, 
  Phone, Copy, Clock, AlertCircle, FileText, CheckCircle, ExternalLink,
  Smartphone, ArrowRight
} from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { supportConfig } from "../supportConfig";
import { submitSubscriptionRequest, validateAndActivatePremiumCode } from "../lib/premiumSubscriptionEngine";
import { AndroidCenteredDialog } from "./common/GlobalPortalModal";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { SubscriptionPaymentMethod } from "../types";

interface AfrigomboPlusProps {
  onBack: () => void;
  audioVolume?: number;
  currentUserProfile?: any;
  onRefreshProfile?: () => void;
}

export default function AfrigomboPlus({ onBack, currentUserProfile, onRefreshProfile }: AfrigomboPlusProps) {
  const { t } = useLanguage();

  const [selectedPlan, setSelectedPlan] = useState<"free" | "pro" | "elite">("elite");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  
  // Manual Beta Payment Modal State
  const [paymentMethod, setPaymentMethod] = useState<SubscriptionPaymentMethod>("WAVE");
  const [senderPhone, setSenderPhone] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [userNote, setUserNote] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestSubmittedSuccess, setRequestSubmittedSuccess] = useState(false);
  const [requestErrorMessage, setRequestErrorMessage] = useState("");

  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  // Active subscribed plan
  const [subscribedPlan, setSubscribedPlan] = useState<string | null>(() => {
    if (currentUserProfile?.isPremium) {
      return currentUserProfile.subscriptionPlan || (currentUserProfile.premiumPlan === "elite" ? "GOMBO ELITE" : "GOMBO PRO");
    }
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem("gombo_subscription") || "GOMBO FREE";
    }
    return "GOMBO FREE";
  });

  // Modals manager: "compare" | "why" | "boosts" | "payment" | "activation" | null
  const [activeModal, setActiveModal] = useState<"compare" | "why" | "boosts" | "payment" | "activation" | null>(null);

  // Activation code state
  const [inputActivationCode, setInputActivationCode] = useState("");
  const [activationError, setActivationError] = useState("");
  const [activationSuccessMsg, setActivationSuccessMsg] = useState("");
  const [isActivatingCode, setIsActivatingCode] = useState(false);

  // Auto-fill phone if available from profile
  useEffect(() => {
    if (currentUserProfile?.phoneNumber && !senderPhone) {
      setSenderPhone(currentUserProfile.phoneNumber);
    }
  }, [currentUserProfile]);

  const plans = [
    {
      id: "free" as const,
      name: "GOMBO FREE",
      monthlyPrice: 0,
      yearlyPrice: 0,
      priceLabel: "0 FCFA",
      period: "Compte gratuit",
      color: "border-afri-border bg-afri-bg-sec/40",
      accentColor: "text-afri-text-sec",
      badge: "Inclus par défaut",
      description: "Compte standard sans engagement.",
      savings: null,
      features: [
        "Profil artiste standard",
        "Visibilité standard (1.0x)",
        "1 publication par jour",
        "Portfolio standard (3 médias)",
        "Accès aux opportunités"
      ]
    },
    {
      id: "pro" as const,
      name: "GOMBO PRO",
      monthlyPrice: 500,
      yearlyPrice: 5000,
      priceLabel: billingCycle === "monthly" ? "500 FCFA" : "5 000 FCFA",
      period: billingCycle === "monthly" ? "/ mois" : "/ an",
      color: "border-afri-border bg-afri-bg-sec/60 hover:border-[#D4AF37]/50",
      accentColor: "text-emerald-400",
      badge: "Recommandé",
      description: "Boost de visibilité & candidatures.",
      savings: "Économisez 1 000 FCFA sur l'année",
      features: [
        "👑 Badge Adhérent Pro (Silver)",
        "⭐ Boost de visibilité réel (+40%)",
        "🚀 5 publications par jour",
        "🎨 Portfolio étendu (10 médias)",
        "📈 Profil prioritaire dans l'annuaire",
        "💼 Candidatures prioritaires"
      ]
    },
    {
      id: "elite" as const,
      name: "GOMBO ELITE",
      monthlyPrice: 1000,
      yearlyPrice: 10000,
      priceLabel: billingCycle === "monthly" ? "1 000 FCFA" : "10 000 FCFA",
      period: billingCycle === "monthly" ? "/ mois" : "/ an",
      color: "border-[#D4AF37]/40 bg-afri-bg-sec shadow-[0_10px_40px_rgba(212,175,55,0.08)]",
      accentColor: "text-[#D4AF37]",
      badge: "Prestige",
      description: "Priorité absolue & portfolio illimité.",
      savings: "Économisez 2 000 FCFA sur l'année",
      features: [
        "💎 Badge Gold Prestige",
        "🔥 Priorité Maximale (+150% de visibilité)",
        "🚀 Publications illimitées",
        "🎨 Portfolio & Médias Illimités",
        "🥇 En tête d'annuaire et des recherches",
        "🎧 Démo audio en vedette d'office",
        "⚡ Candidatures Ultra-Prioritaires"
      ]
    }
  ];

  // Mobile Money Support Numbers for Ivory Coast & Sub-region
  const paymentNumbers = {
    WAVE: "+225 0503222712",
    ORANGE_MONEY: "+225 0707000000",
    MOOV_MONEY: "+225 0101000000",
    MTN_MOMO: "+225 0503222712",
    MANUAL_BETA: "+225 0503222712",
    AUTRE: "+225 0503222712"
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedNumber(text);
      setTimeout(() => setCopiedNumber(null), 2500);
    }
  };

  const handleSubscribeClick = (planId: "free" | "pro" | "elite") => {
    if (planId === "free") {
      localStorage.setItem("gombo_subscription", "GOMBO FREE");
      setSubscribedPlan("GOMBO FREE");
      return;
    }

    if (!currentUserProfile?.uid) {
      alert("Veuillez vous connecter pour soumettre votre demande d'abonnement.");
      return;
    }

    setSelectedPlan(planId);
    setRequestSubmittedSuccess(false);
    setRequestErrorMessage("");
    setActiveModal("payment");
  };

  // Submit manual subscription request
  const handleSubmitManualRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile?.uid) return;

    setIsSubmittingRequest(true);
    setRequestErrorMessage("");

    const matchedPlan = plans.find(p => p.id === selectedPlan) || plans[2];
    const amount = billingCycle === "monthly" ? matchedPlan.monthlyPrice : matchedPlan.yearlyPrice;

    try {
      const res = await submitSubscriptionRequest({
        userId: currentUserProfile.uid,
        userName: currentUserProfile.displayName || currentUserProfile.artisticName || currentUserProfile.name || "Artiste",
        userPhone: senderPhone || currentUserProfile.phoneNumber || "",
        userEmail: currentUserProfile.email || "",
        userAvatar: currentUserProfile.photoURL || currentUserProfile.avatarUrl || "",
        userRole: currentUserProfile.role || "musicien",
        plan: selectedPlan,
        planName: matchedPlan.name,
        billingCycle: billingCycle,
        amount: amount,
        paymentMethod: paymentMethod,
        paymentReference: paymentReference.trim(),
        paymentProofUrl: paymentProofUrl.trim(),
        userNote: userNote.trim()
      });

      if (res.success) {
        setRequestSubmittedSuccess(true);
      } else {
        setRequestErrorMessage(res.message || "Erreur lors de la transmission de la demande.");
      }
    } catch (err: any) {
      console.error("Error submitting manual request:", err);
      setRequestErrorMessage(err?.message || "Erreur de connexion.");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Submit activation code handler
  const handleValidateActivationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError("");
    setActivationSuccessMsg("");

    if (!inputActivationCode || inputActivationCode.trim().length < 4) {
      setActivationError("Code invalide.");
      return;
    }

    setIsActivatingCode(true);

    try {
      const res = await validateAndActivatePremiumCode(
        inputActivationCode,
        currentUserProfile?.uid || "guest_user",
        selectedPlan
      );

      if (res.success) {
        setActivationSuccessMsg(res.message);
        const newPlan = res.plan === "elite" ? "GOMBO ELITE" : "GOMBO PRO";
        localStorage.setItem("gombo_subscription", newPlan);
        setSubscribedPlan(newPlan);

        if (onRefreshProfile) {
          onRefreshProfile();
        }
      } else {
        setActivationError("Code invalide ou déjà utilisé.");
      }
    } catch (err) {
      setActivationError("Code invalide.");
    } finally {
      setIsActivatingCode(false);
    }
  };

  const currentSelectedPlanObj = plans.find(p => p.id === selectedPlan) || plans[2];
  const targetAmount = billingCycle === "monthly" ? currentSelectedPlanObj.monthlyPrice : currentSelectedPlanObj.yearlyPrice;
  const currentReceivingNumber = paymentNumbers[paymentMethod] || paymentNumbers.WAVE;

  return (
    <div className="w-full bg-afri-bg text-afri-text font-sans transition-colors duration-300 pb-16">
      {/* HEADER SECTION - COMPACT & EXPRESSIVE */}
      <div className="relative overflow-hidden bg-gradient-to-b from-afri-bg-sec via-afri-bg to-afri-bg border-b border-afri-border px-4 py-6 sm:py-8 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-afri-gold/5 rounded-full blur-[90px] pointer-events-none" />

        <div className="max-w-3xl mx-auto space-y-2.5 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-afri-gold/10 border border-afri-gold/30 text-afri-gold text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
            👑 AFRIGOMBO ELITE PREMIUM
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-afri-text uppercase leading-tight">
            Développez votre <span className="text-afri-gold">carrière</span>
          </h1>
          
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-afri-text-muted text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            <span>✨ Visibilité Prioritaire</span>
            <span>•</span>
            <span>🚀 Plus de Gombos & Contrats</span>
            <span>•</span>
            <span>⭐ Multiplicateur de Classement Réel</span>
          </div>

          {/* Quick trigger for Activation Code */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setActivationError("");
                setActivationSuccessMsg("");
                setInputActivationCode("");
                setActiveModal("activation");
              }}
              className="px-4 py-2 bg-afri-gold/15 border border-afri-gold/40 hover:bg-afri-gold/25 text-afri-gold font-black text-[11px] uppercase tracking-wider rounded-xl inline-flex items-center gap-2 transition-all shadow-sm cursor-pointer min-h-[44px]"
            >
              <KeyRound className="w-4 h-4 text-afri-gold" />
              <span>Activer mon abonnement (Saisir un code)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* BILLING TOGGLE */}
        <div className="flex justify-center">
          <div className="bg-afri-bg-sec p-1 rounded-2xl border border-afri-border flex items-center gap-1 shadow-md">
            <button 
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer min-h-[44px] ${
                billingCycle === "monthly" 
                  ? "bg-afri-gold text-black shadow-md" 
                  : "text-afri-text-muted hover:text-afri-text"
              }`}
            >
              Mensuel
            </button>
            <button 
              onClick={() => setBillingCycle("yearly")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer min-h-[44px] ${
                billingCycle === "yearly" 
                  ? "bg-afri-gold text-black shadow-md" 
                  : "text-afri-text-muted hover:text-afri-text"
              }`}
            >
              Annuel <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded ml-1 font-extrabold">Économie</span>
            </button>
          </div>
        </div>

        {/* CARDS LIST - 3 MAIN PLANS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => {
            const isElite = p.id === "elite";
            const isPro = p.id === "pro";
            const isCurrent = subscribedPlan === p.name;
            
            let cardBorder = "border-afri-border";
            let cardBg = "bg-afri-bg-sec/50";
            if (isElite) {
              cardBorder = "border-afri-gold/50 shadow-[0_4px_25px_rgba(212,175,55,0.12)]";
              cardBg = "bg-afri-bg-sec";
            } else if (isPro) {
              cardBorder = "border-emerald-500/40";
            }

            return (
              <div
                key={p.id}
                className={`flex flex-col p-5 rounded-2xl border transition-all duration-200 group relative ${cardBg} ${cardBorder}`}
              >
                <div className="space-y-3 flex-1 text-left">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-black tracking-tight text-afri-text uppercase">{p.name}</h3>
                      <p className="text-[10px] text-afri-text-muted uppercase tracking-wider mt-0.5 font-bold">
                        {p.id === "free" ? "Compte de base" : p.description}
                      </p>
                    </div>
                    {p.badge && (
                      <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        p.id === 'elite' ? 'bg-afri-gold/15 text-afri-gold border-afri-gold/40' : 
                        p.id === 'pro' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' :
                        'bg-afri-bg text-afri-text-muted border-afri-border'
                      }`}>
                        {p.badge}
                      </span>
                    )}
                  </div>

                  <div className="py-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-afri-text tracking-tight">{p.priceLabel}</span>
                      <span className="text-[10px] text-afri-text-muted font-bold uppercase">{p.period}</span>
                    </div>
                    {billingCycle === "yearly" && p.savings && (
                      <div className="mt-1">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border inline-block ${
                          p.id === 'elite'
                            ? 'bg-afri-gold/15 text-afri-gold border-afri-gold/40'
                            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                        }`}>
                          💰 {p.savings}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-afri-border/50">
                    {p.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-afri-gold/15 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 text-afri-gold stroke-[3]" />
                        </div>
                        <span className="text-xs font-medium text-afri-text-muted leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-5 mt-auto">
                  {isCurrent ? (
                    <div className="w-full py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-center text-xs font-bold uppercase">
                      ✓ Formule Actuelle
                    </div>
                  ) : p.id === "free" ? (
                    <div className="w-full py-2.5 rounded-xl bg-afri-bg border border-afri-border text-afri-text-muted text-center text-xs font-bold uppercase">
                      Inclus par défaut
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSubscribeClick(p.id)}
                      className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md min-h-[46px] ${
                        isElite
                          ? "bg-afri-gold hover:bg-amber-400 text-black"
                          : "bg-emerald-500 hover:bg-emerald-400 text-black"
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      Choisir {p.name}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* HELP & COMPARISON CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
          <button
            type="button"
            onClick={() => setActiveModal("boosts")}
            className="p-4 rounded-2xl bg-afri-bg-sec/40 border border-afri-border hover:border-afri-gold/40 text-left transition-all flex items-center justify-between cursor-pointer min-h-[52px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-afri-gold/15 text-afri-gold flex items-center justify-center">
                🚀
              </div>
              <div>
                <div className="text-xs font-bold text-afri-text">Comprendre les Boosts de Visibilité</div>
                <div className="text-[10px] text-afri-text-muted">+40% et +150% de puissance d'affichage</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-afri-gold" />
          </button>

          <a
            href="https://wa.me/2250503222712?text=Bonjour%20AFRIGOMBO%20ELITE,%20je%20souhaite%20des%20informations%20sur%20les%20abonnements%20Premium"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-2xl bg-afri-bg-sec/40 border border-emerald-500/30 hover:border-emerald-500/60 text-left transition-all flex items-center justify-between cursor-pointer min-h-[52px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-afri-text">Assistance & SAV WhatsApp</div>
                <div className="text-[10px] text-emerald-400">Échange direct avec l'équipe Fondateur</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-emerald-400" />
          </a>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: MANUAL BETA PAYMENT & SUBSCRIPTION REQUEST */}
      {/* ========================================================= */}
      <AndroidCenteredDialog
        isOpen={activeModal === "payment"}
        onClose={() => {
          if (!isSubmittingRequest) setActiveModal(null);
        }}
        showCloseButton={!isSubmittingRequest}
        title={
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-afri-gold" />
            <span className="text-afri-gold">Demande d'Abonnement Bêta</span>
          </div>
        }
      >
        <div className="space-y-4 text-left">
          {requestSubmittedSuccess ? (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
              <h3 className="font-bold text-sm text-emerald-300 uppercase">Demande Transmise avec Succès !</h3>
              <p className="text-xs text-afri-text-muted leading-relaxed">
                Votre demande pour <strong className="text-afri-gold">{currentSelectedPlanObj.name} ({targetAmount.toLocaleString("fr-FR")} FCFA)</strong> a été transmise au Fondateur AFRIGOMBO.
              </p>
              <div className="p-3 bg-afri-bg rounded-xl border border-afri-border text-[11px] text-afri-text-muted">
                ⏳ Votre adhésion sera vérifiée et activée dans les plus brefs délais. Vous recevrez une notification instantanée dès la validation.
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <a
                  href={`https://wa.me/2250503222712?text=${encodeURIComponent(`Bonjour, j'ai soumis une demande d'abonnement ${currentSelectedPlanObj.name} pour le compte ${currentUserProfile?.displayName || currentUserProfile?.email}. Réf : ${paymentReference || "Mobile Money"}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-black text-xs flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Envoyer mon reçu sur WhatsApp
                </a>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full py-2 rounded-xl bg-afri-bg border border-afri-border text-afri-text text-xs font-bold"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitManualRequest} className="space-y-4">
              {/* Order Summary Box */}
              <div className="bg-afri-bg border border-afri-gold/30 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-afri-text-muted">Formule choisie :</span>
                  <span className="font-black text-afri-gold">{currentSelectedPlanObj.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-afri-text-muted">Montant à régler :</span>
                  <span className="font-mono font-black text-emerald-400 text-base">
                    {targetAmount.toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-afri-text-muted">Durée :</span>
                  <span className="font-bold text-afri-text">
                    {billingCycle === "yearly" ? "1 an (Annuel)" : "1 mois (Mensuel)"}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-[11px] font-bold text-afri-text-muted uppercase block mb-1.5">
                  1. Choisissez votre moyen de paiement Mobile Money :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["WAVE", "ORANGE_MONEY", "MOOV_MONEY", "MTN_MOMO"] as SubscriptionPaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                        paymentMethod === method
                          ? "bg-afri-gold/20 border-afri-gold text-afri-gold shadow-sm"
                          : "bg-afri-bg border-afri-border text-afri-text-muted hover:text-afri-text"
                      }`}
                    >
                      {method.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transfer Instructions Box */}
              <div className="p-3.5 bg-afri-gold/10 border border-afri-gold/30 rounded-xl space-y-2 text-xs">
                <div className="text-[11px] font-bold text-afri-gold uppercase flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  2. Effectuez le transfert du montant exact ({targetAmount.toLocaleString("fr-FR")} FCFA) :
                </div>
                <div className="p-2 bg-afri-bg rounded-lg border border-afri-border flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-afri-text-muted uppercase">Numéro de réception :</div>
                    <div className="font-mono font-black text-sm text-white">{currentReceivingNumber}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentReceivingNumber)}
                    className="px-2.5 py-1.5 rounded-lg bg-afri-gold/20 text-afri-gold font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedNumber === currentReceivingNumber ? "Copié !" : "Copier"}
                  </button>
                </div>
                <div className="text-[10px] text-afri-text-muted italic">
                  Destinataire : Support Officiel AFRIGOMBO
                </div>
              </div>

              {/* Form inputs */}
              <div className="space-y-3">
                <div className="text-[11px] font-bold text-afri-text-muted uppercase">
                  3. Renseignez les informations de votre paiement :
                </div>

                <div>
                  <label className="text-[11px] text-afri-text-muted block mb-1">
                    Numéro de téléphone expéditeur (qui a payé) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="Ex: +225 0503222712"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-afri-bg border border-afri-border focus:border-afri-gold text-xs text-afri-text focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-afri-text-muted block mb-1">
                    ID / Référence de transaction (reçue par SMS)
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Ex: TX-98472918 ou ID Wave"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-afri-bg border border-afri-border focus:border-afri-gold text-xs text-afri-text focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-afri-text-muted block mb-1">
                    Note ou précision (optionnel)
                  </label>
                  <input
                    type="text"
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                    placeholder="Ex: Paiement effectué via Wave à 14h30"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-afri-bg border border-afri-border focus:border-afri-gold text-xs text-afri-text focus:outline-none"
                  />
                </div>
              </div>

              {requestErrorMessage && (
                <div className="p-3 bg-red-950/50 border border-red-500/50 text-red-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{requestErrorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingRequest || !senderPhone}
                className="w-full py-3.5 rounded-xl bg-afri-gold hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50 min-h-[48px]"
              >
                {isSubmittingRequest ? (
                  <span>Transmission en cours...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Envoyer ma demande d'abonnement</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </AndroidCenteredDialog>

      {/* ========================================================= */}
      {/* MODAL: CODE ACTIVATION */}
      {/* ========================================================= */}
      <AndroidCenteredDialog
        isOpen={activeModal === "activation"}
        onClose={() => {
          if (!isActivatingCode) setActiveModal(null);
        }}
        showCloseButton={!isActivatingCode}
        title={
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-afri-gold" />
            <span className="text-afri-gold">Activation par Code Pass</span>
          </div>
        }
      >
        <div className="space-y-4 text-left">
          <p className="text-xs text-afri-text-muted leading-relaxed">
            Si vous avez reçu un code Pass Bêta officiel délivré par le Fondateur ou le Support, saisissez-le ci-dessous pour activer immédiatement votre formule.
          </p>

          <form onSubmit={handleValidateActivationCode} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-afri-text-muted uppercase block mb-1">
                Code d'activation (Usage Unique)
              </label>
              <input
                type="text"
                value={inputActivationCode}
                onChange={(e) => setInputActivationCode(e.target.value.toUpperCase())}
                placeholder="Ex: AG-PRO-XXXXXX ou AG-ELITE-XXXXXX"
                className="w-full px-3.5 py-3 rounded-xl bg-afri-bg border border-afri-border focus:border-afri-gold font-mono font-bold text-sm text-afri-text uppercase tracking-widest focus:outline-none"
              />
            </div>

            {activationError && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{activationError}</span>
              </div>
            )}

            {activationSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{activationSuccessMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isActivatingCode || !inputActivationCode}
              className="w-full py-3.5 rounded-xl bg-afri-gold hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer disabled:opacity-50 min-h-[48px]"
            >
              {isActivatingCode ? "Validation du code..." : "Valider et Activer mon Compte"}
            </button>
          </form>
        </div>
      </AndroidCenteredDialog>

      {/* ========================================================= */}
      {/* MODAL: BOOSTS INFO */}
      {/* ========================================================= */}
      <AndroidCenteredDialog
        isOpen={activeModal === "boosts"}
        onClose={() => setActiveModal(null)}
        title={
          <div className="flex items-center gap-2">
            <span className="text-xl">🚀</span>
            <span>Boosts de Visibilité Réels</span>
          </div>
        }
      >
        <div className="space-y-4 text-left">
          <p className="text-xs text-afri-text-muted leading-relaxed">
            Chaque niveau d'adhésion applique un multiplicateur direct sur le classement de vos prestations et de votre profil artiste :
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-afri-bg border border-afri-border rounded-xl space-y-1">
              <div className="text-[10px] font-black uppercase text-afri-text-muted tracking-wider">GOMBO FREE</div>
              <div className="text-lg font-black font-mono text-afri-text">1.0x</div>
              <p className="text-[10px] text-afri-text-muted">Classement standard sans priorité.</p>
            </div>

            <div className="p-3.5 bg-afri-bg border border-emerald-500/40 rounded-xl space-y-1">
              <div className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">GOMBO PRO</div>
              <div className="text-lg font-black font-mono text-emerald-400">+40% (1.4x)</div>
              <p className="text-[10px] text-afri-text-muted">Priorité accélérée sur l'annuaire et les recherches.</p>
            </div>

            <div className="p-3.5 bg-afri-bg border border-afri-gold/40 rounded-xl space-y-1">
              <div className="text-[10px] font-black uppercase text-afri-gold tracking-wider">GOMBO ELITE</div>
              <div className="text-lg font-black font-mono text-afri-gold">+150% (2.5x)</div>
              <p className="text-[10px] text-afri-text-muted">Priorité absolue au sommet de toutes les recherches.</p>
            </div>
          </div>

          <div className="pt-2 border-t border-afri-border text-right">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-5 py-2.5 bg-afri-bg border border-afri-border text-afri-text font-bold text-xs uppercase rounded-xl cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </AndroidCenteredDialog>
    </div>
  );
}
