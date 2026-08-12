import React, { useState, useEffect } from "react";
import { Sparkles, Check, Coins, ChevronLeft, CreditCard, Award, Shield, Music, BarChart3, Radio, X, Zap, Calculator, KeyRound, MessageCircle } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { supportConfig } from "../supportConfig";
import { createPendingSubscriptionRequest, validateAndActivatePremiumCode } from "../lib/premiumSubscriptionEngine";
import { AndroidCenteredDialog } from "./common/GlobalPortalModal";
import { db } from "../firebase";
import { doc, getDoc, setDoc, addDoc, collection } from "firebase/firestore";
import { recordWalletTransaction } from "../lib/financial";
import { safeStringify } from "../lib/jsonUtils";
import GomboWheelSection from "./common/GomboWheelSection";

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
  const [paymentOption, setPaymentOption] = useState<string>("wallet");
  const [phonePayment, setPhonePayment] = useState("");
  const [paymentStep, setPaymentStep] = useState<"idle" | "processing" | "pending_validation" | "success">("idle");
  const [walletError, setWalletError] = useState<string | null>(null);
  const [insufficientDetails, setInsufficientDetails] = useState<{ current: number; required: number; missing: number } | null>(null);
  const [simAmount, setSimAmount] = useState<number>(100000);
  const [subscribedPlan, setSubscribedPlan] = useState<string | null>(() => {
    if (currentUserProfile?.isPremium) {
      return currentUserProfile.subscriptionPlan || "GOMBO ELITE";
    }
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem("gombo_subscription") || "GOMBO FREE";
    }
    return "GOMBO FREE";
  });

  // Modal manager: "compare" | "why" | "savings" | "payment" | "activation" | null
  const [activeModal, setActiveModal] = useState<"compare" | "why" | "savings" | "payment" | "activation" | null>(null);

  useEffect(() => {
    if (activeModal !== null) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setActiveModal(null);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      const handlePopState = () => setActiveModal(null);
      window.addEventListener("popstate", handlePopState);
      window.history.pushState({ modalOpen: true }, "");

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [activeModal]);

  // Activation code state
  const [inputActivationCode, setInputActivationCode] = useState("");
  const [activationError, setActivationError] = useState("");
  const [activationSuccessMsg, setActivationSuccessMsg] = useState("");
  const [isActivatingCode, setIsActivatingCode] = useState(false);

  const plans = [
    {
      id: "free",
      name: "GOMBO FREE",
      monthlyPrice: 0,
      yearlyPrice: 0,
      priceLabel: "0 FCFA",
      period: "Compte gratuit",
      color: "border-afri-border bg-afri-bg-sec/40",
      accentColor: "text-afri-text-sec",
      badge: "Inclus par défaut",
      description: "Compte standard sans engagement.",
      features: [
        "Profil artiste standard",
        "Visibilité standard",
        "Priorité normale",
        "Classement normal",
        "Commission de 2,5%",
      ],
      commission: "2,5%"
    },
    {
      id: "pro",
      name: "GOMBO PRO",
      monthlyPrice: 500,
      yearlyPrice: 5000,
      priceLabel: billingCycle === "monthly" ? "500 FCFA" : "5 000 FCFA",
      period: billingCycle === "monthly" ? "/ mois" : "/ an",
      color: "border-afri-border bg-afri-bg-sec/60 hover:border-[#D4AF37]/50",
      accentColor: "text-emerald-400",
      badge: "Mieux Vendu",
      description: "Le meilleur rapport qualité/prix.",
      features: [
        "👑 Badge Premium Silver",
        "⚡ Commission de 1,5%",
        "⭐ Boost de recherche moyen (+40%)",
        "📈 Plus de visibilité",
        "3 publications par jour",
        "Accès aux opportunités",
      ],
      commission: "1,5%"
    },
    {
      id: "elite",
      name: "GOMBO ELITE",
      monthlyPrice: 1000,
      yearlyPrice: 10000,
      priceLabel: billingCycle === "monthly" ? "1 000 FCFA" : "10 000 FCFA",
      period: billingCycle === "monthly" ? "/ mois" : "/ an",
      color: "border-[#D4AF37]/40 bg-afri-bg-sec shadow-[0_10px_40px_rgba(212,175,55,0.08)]",
      accentColor: "text-[#D4AF37]",
      badge: "Prestige",
      description: "La meilleure expérience AFRIGOMBO ELITE.",
      features: [
        "💎 Badge Premium Gold",
        "⚡ Commission de 1,5%",
        "⭐ Mise en avant maximale",
        "🚀 Priorité absolue (Renforts)",
        "📈 Visibilité boostée à 150%",
        "🎖️ Profil recommandé d'office",
        "📊 Statistiques Avancées",
        "💬 Priorité de relation"
      ],
      commission: "1,5%"
    }
  ];

  const handleSubscribeClick = async (planId: "free" | "pro" | "elite") => {
    if (planId === "free") {
      localStorage.setItem("gombo_subscription", "GOMBO FREE");
      setSubscribedPlan("GOMBO FREE");
      return;
    }

    if (!currentUserProfile?.uid) {
      alert("Veuillez vous connecter pour vous abonner.");
      return;
    }

    setSelectedPlan(planId);
    setPaymentOption("wallet");
    setPaymentStep("processing");
    setWalletError(null);
    setInsufficientDetails(null);
    setActiveModal("payment");

    try {
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('gombo_play_sound', { detail: { name: 'tambour' } }));
      }
    } catch (_) {}

    try {
      const matchedPlan = plans.find(p => p.id === planId);
      const subName = matchedPlan ? matchedPlan.name : "GOMBO ELITE";
      const amount = matchedPlan ? (billingCycle === "monthly" ? matchedPlan.monthlyPrice : matchedPlan.yearlyPrice) : 1000;
      
      const userRef = doc(db, "users", currentUserProfile.uid);
      const userSnap = await getDoc(userRef);
      let balance = 0;
      let uData: any = null;
      if (userSnap.exists()) {
        uData = userSnap.data();
        balance = uData?.walletBalance ?? uData?.wallet?.soldeDisponible ?? 0;
      } else {
        balance = currentUserProfile?.walletBalance ?? currentUserProfile?.wallet?.soldeDisponible ?? 0;
      }

      if (balance >= amount) {
        // Suffisant ! Débiter immédiatement
        const newSolde = balance - amount;
        const nowIso = new Date().toISOString();
        const expirationDate = billingCycle === "monthly" 
          ? new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
          : new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();

        const isElite = planId === "elite";
        const planBadge = isElite ? "💎 Adhérent Elite" : "👑 Adhérent Pro";
        
        const currentBadges = uData?.badges || [];
        const updatedBadges = Array.from(
          new Set([...currentBadges, "💎 Adhérent Premium", planBadge])
        );

        await setDoc(userRef, {
          premium: true,
          isPremium: true,
          status: "premium",
          premiumStatus: "active",
          premiumPlan: planId,
          billingCycle: billingCycle,
          subscriptionType: billingCycle,
          subscriptionPlan: subName,
          premiumStartedAt: nowIso,
          premiumActivatedAt: nowIso,
          premiumUntil: expirationDate,
          premiumExpiresAt: expirationDate,
          isPremiumAutoRenew: true,
          commissionRate: 0.015,
          badges: updatedBadges,
          walletBalance: newSolde,
          balance: newSolde,
          wallet: {
            ...(uData?.wallet || {}),
            soldeDisponible: newSolde
          }
        }, { merge: true });

        // Enregistrer la transaction
        await recordWalletTransaction({
          userId: currentUserProfile.uid,
          userName: currentUserProfile.artistName || currentUserProfile.firstName || "Membre Gombo",
          type: "premium",
          amount: amount,
          status: "success",
          description: `Abonnement Premium ${subName} (${billingCycle === "monthly" ? "Mensuel" : "Annuel"})`
        });

        // Ajouter une notification
        await addDoc(collection(db, "notifications"), {
          userId: currentUserProfile.uid,
          title: "👑 Abonnement Activé !",
          message: `Félicitations, vous êtes désormais membre ${subName}. Profitez de vos avantages exclusifs !`,
          type: "payment_received",
          createdAt: new Date().toISOString(),
          isRead: false
        });

        // Fire custom event for balance updates
        window.dispatchEvent(new CustomEvent("wallet_balance_updated"));

        localStorage.setItem("gombo_subscription", subName);
        setSubscribedPlan(subName);

        if (onRefreshProfile) {
          onRefreshProfile();
        }

        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('gombo_play_sound', { detail: { name: 'premium' } }));
        }

        setPaymentStep("success");
      } else {
        // Insuffisant !
        setInsufficientDetails({
          current: balance,
          required: amount,
          missing: amount - balance
        });
        setWalletError("Solde insuffisant.");
        setPaymentStep("idle");
      }
    } catch (err) {
      console.error("Error processing subscription payment:", err);
      setPaymentStep("idle");
      alert("Une erreur s'est produite lors de la vérification. Veuillez réessayer.");
    }
  };

  const processPayment = async () => {
    // legacy function kept for fallback if needed, but not used as main anymore
    alert("Veuillez utiliser la recharge de Wallet.");
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
        localStorage.setItem("gombo_subscription", res.plan === "elite" ? "GOMBO ELITE" : "GOMBO PRO");
        setSubscribedPlan(res.plan === "elite" ? "GOMBO ELITE" : "GOMBO PRO");

        if (onRefreshProfile) {
          onRefreshProfile();
        }

        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('gombo_play_sound', { detail: { name: 'premium' } }));
        }
      } else {
        // Requirement 7: STRICTLY "Code invalide."
        setActivationError("Code invalide.");
      }
    } catch (err) {
      setActivationError("Code invalide.");
    } finally {
      setIsActivatingCode(false);
    }
  };

  const currentSelectedPlanObj = plans.find(p => p.id === selectedPlan) || plans[2];

  return (
    <div className="w-full bg-afri-bg text-afri-text font-sans transition-colors duration-300">
      {/* HEADER SECTION - COMPACT & EXPRESSIVE */}
      <div className="relative overflow-hidden bg-gradient-to-b from-afri-bg-ter to-afri-bg border-b border-afri-border px-4 py-6 sm:py-8 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[#D4AF37]/5 rounded-full blur-[90px] pointer-events-none"></div>

        <div className="max-w-3xl mx-auto space-y-2.5 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
            👑 AFRIGOMBO ELITE PREMIUM
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-afri-text uppercase leading-tight">
            Développez votre <span className="text-[#D4AF37]">carrière</span>
          </h1>
          
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-afri-text-sec text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            <span>✨ Soyez davantage visible</span>
            <span>•</span>
            <span>🚀 Obtenez plus de Gombos</span>
            <span>•</span>
            <span>💰 Économisez sur vos contrats</span>
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
              className="px-4 py-2 bg-[#D4AF37]/15 border border-[#D4AF37]/40 hover:bg-[#D4AF37]/25 text-[#D4AF37] font-black text-[11px] uppercase tracking-wider rounded-xl inline-flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Activer mon abonnement (Saisir un code)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* BILLING TOGGLE */}
        <div className="flex justify-center">
          <div className="bg-afri-bg-sec p-1 rounded-xl border border-afri-border flex items-center gap-1 shadow-md">
            <button 
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer ${billingCycle === "monthly" ? "bg-[#D4AF37] text-black shadow-md" : "text-afri-text-sec hover:text-afri-text"}`}
            >
              Mensuel
            </button>
            <button 
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer ${billingCycle === "yearly" ? "bg-[#D4AF37] text-black shadow-md" : "text-afri-text-sec hover:text-afri-text"}`}
            >
              Annuel <span className="text-[9px] opacity-80 ml-1 font-extrabold">-20%</span>
            </button>
          </div>
        </div>

        {/* CARDS LIST - 3 MAIN PLANS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => {
            const isActive = subscribedPlan === p.name;
            const isSelected = selectedPlan === p.id;
            
            let cardBg = "bg-afri-bg-sec border-afri-border";
            if (p.id === "elite") {
              cardBg = "bg-afri-bg-sec border-[#D4AF37]/60 shadow-[0_4px_20px_rgba(212,175,55,0.12)]";
            } else if (p.id === "pro") {
              cardBg = "bg-afri-bg-sec border-afri-border hover:border-[#D4AF37]/40";
            }

            return (
              <div
                key={p.id}
                className={`flex flex-col p-5 rounded-2xl border transition-all duration-200 group relative ${cardBg}`}
              >
                <div className="space-y-3 flex-1 text-left">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-black tracking-tight text-afri-text uppercase">{p.name}</h3>
                      <p className="text-[10px] text-afri-text-sec uppercase tracking-widest mt-0.5 font-bold">
                        {p.id === "free" ? "Compte de base" : p.description}
                      </p>
                    </div>
                    {p.badge && (
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        p.id === 'elite' ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30' : 
                        p.id === 'pro' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        'bg-afri-bg text-afri-text-sec border-afri-border'
                      }`}>
                        {p.badge}
                      </span>
                    )}
                  </div>

                  <div className="py-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-afri-text tracking-tight">{p.priceLabel}</span>
                      <span className="text-[10px] text-afri-text-sec font-bold uppercase">{p.period}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-afri-border/50">
                    {p.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#D4AF37]/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 text-[#D4AF37] stroke-[3]" />
                        </div>
                        <span className="text-xs font-semibold text-afri-text-sec leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-2">
                  {isActive ? (
                    <div className="w-full text-center py-2.5 px-3 rounded-xl bg-afri-bg text-afri-text-sec font-black text-[10px] uppercase tracking-widest border border-afri-border">
                      Formule Actuelle
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribeClick(p.id as any)}
                      className={`w-full py-2.5 px-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-98 cursor-pointer ${
                        p.id === "free" 
                          ? "bg-afri-bg border border-afri-border text-afri-text hover:bg-afri-bg-ter" 
                          : p.id === "elite"
                          ? "bg-[#D4AF37] text-black hover:bg-amber-400 shadow-[#D4AF37]/20"
                          : "bg-emerald-500 text-black hover:bg-emerald-400"
                      }`}
                    >
                      {p.id === "free" ? "Continuer" : `Devenir ${p.id.toUpperCase()}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 3 COMPACT ACTION BUTTONS (MODAL TRIGGERS) */}
        <div className="pt-2">
          <div className="text-center mb-3">
            <span className="text-[10px] font-black uppercase text-afri-text-sec tracking-widest">
              En savoir plus sur les services Premium
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Button 1: Comparer les avantages */}
            <button
              type="button"
              onClick={() => setActiveModal("compare")}
              className="p-4 bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37]/50 rounded-2xl flex items-center gap-3 text-left transition-all active:scale-98 group cursor-pointer shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-lg">
                📊
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black uppercase text-afri-text tracking-wide truncate">Comparer les avantages</h4>
                <p className="text-[10px] text-afri-text-sec truncate">Tableau comparatif détaillé</p>
              </div>
            </button>

            {/* Button 2: Pourquoi devenir Premium ? */}
            <button
              type="button"
              onClick={() => setActiveModal("why")}
              className="p-4 bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37]/50 rounded-2xl flex items-center gap-3 text-left transition-all active:scale-98 group cursor-pointer shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-lg">
                ⭐
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black uppercase text-afri-text tracking-wide truncate">Pourquoi devenir Premium ?</h4>
                <p className="text-[10px] text-afri-text-sec truncate">Badges, visibilité & priorité</p>
              </div>
            </button>

            {/* Button 3: Économiser sur vos contrats */}
            <button
              type="button"
              onClick={() => setActiveModal("savings")}
              className="p-4 bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37]/50 rounded-2xl flex items-center gap-3 text-left transition-all active:scale-98 group cursor-pointer shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-lg">
                💰
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black uppercase text-afri-text tracking-wide truncate">Économiser sur vos contrats</h4>
                <p className="text-[10px] text-afri-text-sec truncate">Simulateur de commissions (1,5%)</p>
              </div>
            </button>

          </div>
        </div>

        {/* SECTION ROUE AFRIGOMBO (ACCESSIBLE TOUS MEMBRES) */}
        <GomboWheelSection 
          currentUserProfile={currentUserProfile} 
          onRefreshProfile={onRefreshProfile} 
        />
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: COMPARATIF DES OFFRES */}
      {/* ========================================================= */}
      <AndroidCenteredDialog
        isOpen={activeModal === "compare"}
        onClose={() => setActiveModal(null)}
        title={
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <span>Comparatif des offres</span>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="w-full text-left border-collapse min-w-[450px]">
              <thead>
                <tr className="border-b border-afri-border">
                  <th className="py-2.5 text-afri-text-sec font-bold uppercase text-[10px] tracking-widest">Avantages</th>
                  <th className="py-2.5 text-center text-afri-text font-black uppercase text-xs">Free</th>
                  <th className="py-2.5 text-center text-emerald-400 font-black uppercase text-xs">Pro</th>
                  <th className="py-2.5 text-center text-[#D4AF37] font-black uppercase text-xs">Elite</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {[
                  { label: "Commission sur contrat", free: "2,5%", pro: "1,5%", elite: "1,5%" },
                  { label: "Badge de profil", free: "Standard", pro: "Silver", elite: "Gold Prestige" },
                  { label: "Publications / jour", free: "Illimité (Std)", pro: "3 / jour (Boost)", elite: "Illimité (Priorité)" },
                  { label: "Visibilité annuaire", free: "Standard", pro: "+40%", elite: "Priorité Maximale" },
                  { label: "Statistiques", free: "Basique", pro: "Standards", elite: "Avancées" },
                  { label: "Candidatures", free: "Standard", pro: "Prioritaires", elite: "Ultra-Prioritaires" },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-afri-border/50 hover:bg-afri-bg-ter/40 transition-colors">
                    <td className="py-2.5 font-bold text-afri-text-sec">{row.label}</td>
                    <td className="py-2.5 text-center text-afri-text-sec font-mono">{row.free}</td>
                    <td className="py-2.5 text-center text-emerald-400 font-mono font-bold">{row.pro}</td>
                    <td className="py-2.5 text-center text-[#D4AF37] font-mono font-bold">{row.elite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-afri-border/60 text-right">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-5 py-2 bg-afri-bg border border-afri-border hover:border-[#D4AF37]/50 text-afri-text font-bold text-xs uppercase rounded-xl cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </AndroidCenteredDialog>

      {/* ========================================================= */}
      {/* MODAL 2: POURQUOI DEVENIR PREMIUM ? */}
      {/* ========================================================= */}
      <AndroidCenteredDialog
        isOpen={activeModal === "why"}
        onClose={() => setActiveModal(null)}
        title={
          <div className="flex items-center gap-2">
            <span className="text-xl">⭐</span>
            <span>Pourquoi devenir Premium ?</span>
          </div>
        }
        subtitle="Des outils conçus pour propulser votre carrière musicale"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {[
              { 
                title: "Badge Premium", 
                desc: "Soyez immédiatement reconnu comme un professionnel certifié.", 
                icon: Award,
                highlight: "Confiance & Prestige"
              },
              { 
                title: "Plus de visibilité", 
                desc: "Votre profil apparaît avant les autres dans toutes les recherches.", 
                icon: Sparkles,
                highlight: "Top 1% de l'annuaire"
              },
              { 
                title: "Plus d'opportunités", 
                desc: "Accédez aux meilleurs Gombos et aux contrats exclusifs.", 
                icon: Music,
                highlight: "Contrats Premium"
              },
              { 
                title: "Réduction des commissions", 
                desc: "Payez seulement 1,5% au lieu de 2,5% sur vos revenus.", 
                icon: Shield,
                highlight: "Économies directes"
              },
              { 
                title: "Statistiques avancées", 
                desc: "Comprenez l'évolution de votre carrière avec des rapports précis.", 
                icon: BarChart3,
                highlight: "Données analytiques"
              },
              { 
                title: "Priorité absolue", 
                desc: "Vos publications et candidatures passent avant les comptes standards.", 
                icon: Radio,
                highlight: "Vitesse & Efficacité"
              },
            ].map((adv, idx) => (
              <div key={idx} className="p-3.5 bg-afri-bg border border-afri-border rounded-xl space-y-1.5 hover:border-[#D4AF37]/40 transition-all text-left">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center shrink-0">
                    <adv.icon className="w-4 h-4" />
                  </div>
                  <div className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest">{adv.highlight}</div>
                </div>
                <h4 className="text-xs font-black text-afri-text uppercase tracking-tight">{adv.title}</h4>
                <p className="text-[11px] text-afri-text-sec leading-relaxed">{adv.desc}</p>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-afri-border/60 text-right">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-5 py-2 bg-afri-bg border border-afri-border hover:border-[#D4AF37]/50 text-afri-text font-bold text-xs uppercase rounded-xl cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </AndroidCenteredDialog>

      {/* ========================================================= */}
      {/* MODAL 3: ÉCONOMISER SUR VOS CONTRATS */}
      {/* ========================================================= */}
      <AndroidCenteredDialog
        isOpen={activeModal === "savings"}
        onClose={() => setActiveModal(null)}
        title={
          <div className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            <span>Économiser sur vos contrats</span>
          </div>
        }
        subtitle="Taux de commission réduit à 1,5% au lieu de 2,5%"
      >
        <div className="space-y-4 text-left">
          <p className="text-xs text-afri-text-sec leading-relaxed">
            Le Premium réduit vos propres commissions sur les contrats (<strong className="text-[#D4AF37]">1,5% au lieu de 2,5%</strong>).
          </p>

          <div className="flex flex-wrap gap-2">
            {[50000, 100000, 250000, 500000].map((presetAmt) => (
              <button
                key={presetAmt}
                type="button"
                onClick={() => setSimAmount(presetAmt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                  simAmount === presetAmt 
                    ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]" 
                    : "bg-afri-bg border-afri-border text-afri-text-sec hover:border-[#D4AF37]/40 hover:text-afri-text"
                }`}
              >
                {presetAmt.toLocaleString()} FCFA
              </button>
            ))}
          </div>

          <div className="space-y-2 bg-afri-bg p-3.5 rounded-xl border border-afri-border">
            <div className="flex justify-between text-xs">
              <span className="text-afri-text-sec">Montant du contrat :</span>
              <span className="text-[#D4AF37] font-bold font-mono text-sm">{simAmount.toLocaleString()} FCFA</span>
            </div>
            <input 
              type="range" 
              min="50000" 
              max="1000000" 
              step="50000"
              value={simAmount}
              onChange={(e) => setSimAmount(Number(e.target.value))}
              className="w-full h-1.5 bg-afri-bg-sec rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-afri-bg border border-afri-border rounded-xl space-y-2">
              <div className="text-xs font-bold text-afri-text-sec">Compte Standard (2.5%)</div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-afri-text-sec">Commission :</span>
                <span className="text-afri-text font-bold">{(simAmount * 0.025).toLocaleString()} FCFA</span>
              </div>
            </div>

            <div className="p-4 bg-afri-bg border border-[#D4AF37]/40 rounded-xl space-y-2">
              <div className="text-xs font-bold text-[#D4AF37]">Compte Premium (1.5%)</div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-afri-text-sec">Commission :</span>
                <span className="text-afri-text font-bold">{(simAmount * 0.015).toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-emerald-400">Gain net immédiat</h4>
              <p className="text-[10px] text-afri-text-sec">Économie sur ce seul contrat</p>
            </div>
            <span className="text-emerald-400 text-base font-black font-mono">+{(simAmount * 0.01).toLocaleString()} FCFA</span>
          </div>

          <div className="pt-2 border-t border-afri-border/60 text-right">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-5 py-2 bg-afri-bg border border-afri-border hover:border-[#D4AF37]/50 text-afri-text font-bold text-xs uppercase rounded-xl cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </AndroidCenteredDialog>

      {/* ========================================================= */}
      {/* MODAL 4: INTERACTIVE PAYMENT POPUP (BÊTA MODE) */}
      {/* ========================================================= */}
      <AndroidCenteredDialog
        isOpen={activeModal === "payment"}
        onClose={() => {
          if (paymentStep !== "processing") setActiveModal(null);
        }}
        showCloseButton={paymentStep !== "processing"}
        title={
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#D4AF37]" />
            <span className="text-[#D4AF37]">Abonnement {currentSelectedPlanObj.name}</span>
          </div>
        }
      >
        <div className="space-y-4 text-left">
          {paymentStep === "idle" && (
            <div className="space-y-4">
              <div className="bg-afri-bg border border-afri-border rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-afri-text-sec font-medium">Montant :</span>
                  <span className="font-mono font-bold text-base text-[#D4AF37]">{currentSelectedPlanObj.priceLabel}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-afri-text-sec font-medium">Durée :</span>
                  <span className="font-bold text-afri-text">{billingCycle === "monthly" ? "1 mois (Mensuel)" : "12 mois (Annuel -20%)"}</span>
                </div>
                <div className="pt-2 border-t border-afri-border/50">
                  <span className="text-[10px] font-bold text-afri-text-sec uppercase tracking-wider block mb-1">Avantages inclus :</span>
                  <ul className="space-y-1">
                    {currentSelectedPlanObj.features.slice(0, 4).map((f, i) => (
                      <li key={i} className="text-[11px] text-afri-text flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-[#D4AF37] shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-afri-text-sec font-medium">Votre solde :</span>
                    <span className="font-mono font-bold text-white">
                      {((currentUserProfile?.wallet?.soldeDisponible ?? 0)).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-afri-text-sec font-medium">Prix de l'abonnement :</span>
                    <span className="font-mono font-bold text-white">
                      {plans.find(p => p.id === selectedPlan)?.[billingCycle === "monthly" ? "monthlyPrice" : "yearlyPrice"]?.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>

                  {walletError && insufficientDetails && (
                    <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[11px] text-red-400 space-y-1">
                      <div className="font-bold uppercase tracking-wide">⚠️ Solde Wallet insuffisant</div>
                      <div className="flex justify-between text-[10px]"><span>Solde actuel :</span> <span className="font-mono font-bold">{insufficientDetails.current.toLocaleString()} FCFA</span></div>
                      <div className="flex justify-between text-[10px]"><span>Requis :</span> <span className="font-mono font-bold text-white">{insufficientDetails.required.toLocaleString()} FCFA</span></div>
                      <div className="flex justify-between text-[10px] pt-1 mt-1 border-t border-red-500/20"><span>Manquant :</span> <span className="font-mono font-bold">{insufficientDetails.missing.toLocaleString()} FCFA</span></div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  {walletError && insufficientDetails ? (
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem("afrigombo_suggested_deposit_amount", String(insufficientDetails.missing));
                        localStorage.setItem(
                          "afrigombo_pending_purchase",
                          safeStringify({
                            type: "subscription_payment",
                            amount: insufficientDetails.required,
                            title: `Abonnement ${currentSelectedPlanObj.name}`
                          })
                        );
                        setActiveModal(null);
                        window.dispatchEvent(new CustomEvent("open_wallet_deposit"));
                      }}
                      className="w-full bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:opacity-90 active:scale-98 text-black font-black uppercase text-xs py-3.5 tracking-widest rounded-xl transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
                    >
                      <Coins className="w-4 h-4" />
                      Recharger mon Wallet
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={processPayment}
                      className="w-full bg-[#D4AF37] hover:bg-amber-400 active:scale-98 text-black font-black uppercase text-xs py-3.5 tracking-widest rounded-xl transition-all cursor-pointer shadow-lg"
                    >
                      Confirmer le paiement ({currentSelectedPlanObj.priceLabel})
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="w-full py-2 text-center text-xs font-bold text-afri-text-sec hover:text-white cursor-pointer"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {paymentStep === "processing" && (
            <div className="py-8 text-center space-y-4">
              <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-[#D4AF37] animate-pulse">
                Enregistrement de votre demande Bêta...
              </p>
            </div>
          )}

          {paymentStep === "pending_validation" && (
            <div className="py-4 text-center space-y-4">
              <div className="w-12 h-12 bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-[#D4AF37] rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                📝
              </div>

              <div className="space-y-2">
                <h4 className="text-base font-black text-afri-text uppercase tracking-tight">
                  Votre demande d'abonnement a été enregistrée.
                </h4>
                <p className="text-xs text-afri-text-sec leading-relaxed">
                  Contactez le support AFRIGOMBO ELITE afin d'obtenir votre code d'activation.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  supportConfig.openSupport(`Bonjour Support AFRIGOMBO ELITE 👋\nJe souhaite obtenir mon code d'activation pour mon abonnement ${currentSelectedPlanObj.name} (Tél: ${phonePayment}).`);
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-black font-black uppercase text-xs py-3.5 tracking-widest rounded-xl transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 fill-black" />
                <span>Contacter le support</span>
              </button>

              <div className="pt-2 border-t border-afri-border/40 flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setActivationError("");
                    setActivationSuccessMsg("");
                    setInputActivationCode("");
                    setActiveModal("activation");
                  }}
                  className="text-[#D4AF37] hover:underline font-bold text-[11px]"
                >
                  J'ai déjà un code d'activation
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="text-afri-text-sec hover:text-white font-medium text-[11px]"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}

          {paymentStep === "success" && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl font-black shadow-lg">
                ✨
              </div>

              <div className="space-y-2">
                <h4 className="text-base font-black text-emerald-400 uppercase tracking-tight">
                  👑 Félicitations !
                </h4>
                <p className="text-xs text-afri-text font-bold">
                  Votre abonnement {currentSelectedPlanObj.name} est activé avec succès !
                </p>
                <p className="text-[11px] text-afri-text-sec leading-relaxed max-w-xs mx-auto">
                  Le montant de <span className="font-mono text-[#D4AF37] font-bold">{currentSelectedPlanObj.priceLabel}</span> a été déduit de votre Wallet. Vous avez désormais accès à tous vos avantages premium !
                </p>
              </div>

              <div className="pt-2 border-t border-afri-border/40">
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs py-3 tracking-widest rounded-xl transition-all shadow-lg"
                >
                  Super, Merci !
                </button>
              </div>
            </div>
          )}
        </div>
      </AndroidCenteredDialog>

      {/* ========================================================= */}
      {/* MODAL 5: CODE ACTIVATION INPUT POPUP ("Activer mon abonnement") */}
      {/* ========================================================= */}
      <AndroidCenteredDialog
        isOpen={activeModal === "activation"}
        onClose={() => setActiveModal(null)}
        title={
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#D4AF37]" />
            <span className="text-[#D4AF37]">Activer mon abonnement</span>
          </div>
        }
      >
        <form onSubmit={handleValidateActivationCode} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-afri-text-sec uppercase tracking-widest block">
              Code d'activation
            </label>
            <input
              type="text"
              value={inputActivationCode}
              onChange={(e) => {
                setInputActivationCode(e.target.value.toUpperCase());
                setActivationError("");
              }}
              placeholder="Ex: AG-PRO-9842"
              className="w-full bg-afri-bg p-3.5 text-sm rounded-xl border border-afri-border text-afri-text focus:border-[#D4AF37] focus:outline-none font-mono tracking-widest font-black uppercase text-center"
              autoFocus
            />
          </div>

          {activationError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold text-center">
              {activationError}
            </div>
          )}

          {activationSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold text-center space-y-2">
              <p>{activationSuccessMsg}</p>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full bg-[#D4AF37] text-black font-black uppercase text-[10px] py-2 rounded-lg mt-1 cursor-pointer"
              >
                Accéder à mon espace
              </button>
            </div>
          )}

          {!activationSuccessMsg && (
            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={isActivatingCode || !inputActivationCode.trim()}
                className="w-full bg-[#D4AF37] hover:bg-amber-400 active:scale-98 text-black font-black uppercase text-xs py-3.5 tracking-widest rounded-xl transition-all cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isActivatingCode ? "Vérification..." : "Valider"}
              </button>

              <button
                type="button"
                onClick={() => {
                  supportConfig.openSupport("Bonjour Support AFRIGOMBO ELITE 👋\nJe n'ai pas encore reçu mon code d'activation d'abonnement.");
                }}
                className="w-full py-2 text-center text-[11px] font-bold text-afri-text-sec hover:text-[#D4AF37] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Obtenir un code via le Support</span>
              </button>
            </div>
          )}
        </form>
      </AndroidCenteredDialog>

    </div>
  );
}
