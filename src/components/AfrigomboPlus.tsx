import React, { useState, useEffect } from "react";
import { Sparkles, Check, ChevronLeft, CreditCard, Award, Shield, Music, BarChart3, Radio, X, Zap, Calculator, KeyRound, MessageCircle } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { supportConfig } from "../supportConfig";
import { createPendingSubscriptionRequest, validateAndActivatePremiumCode } from "../lib/premiumSubscriptionEngine";

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
  const [paymentOption, setPaymentOption] = useState<string>("wave");
  const [phonePayment, setPhonePayment] = useState("");
  const [paymentStep, setPaymentStep] = useState<"idle" | "processing" | "pending_validation">("idle");
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
      description: "La meilleure expérience AFRIGOMBO.",
      features: [
        "💎 Badge Premium Gold",
        "⚡ Commission de 1,5%",
        "⭐ Mise en avant maximale",
        "🚀 Priorité absolue (Renforts)",
        "📈 Visibilité boostée à 150%",
        "🎖️ Profil recommandé d'office",
        "📊 Statistiques Avancées",
        "💬 Priorité de relation",
      ],
      commission: "1,5%"
    }
  ];

  const handleSubscribeClick = (planId: "free" | "pro" | "elite") => {
    if (planId === "free") {
      localStorage.setItem("gombo_subscription", "GOMBO FREE");
      setSubscribedPlan("GOMBO FREE");
      return;
    }
    setSelectedPlan(planId);
    setPaymentOption("wave");
    setPaymentStep("idle");
    setActiveModal("payment");
  };

  const processPayment = async () => {
    if (!phonePayment) {
      alert("Veuillez saisir votre numéro mobile money.");
      return;
    }
    setPaymentStep("processing");
    try {
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('gombo_play_sound', { detail: { name: 'tambour' } }));
      }
    } catch (_) {}

    setTimeout(async () => {
      try {
        const matchedPlan = plans.find(p => p.id === selectedPlan);
        const subName = matchedPlan ? matchedPlan.name : "GOMBO ELITE";
        const amount = matchedPlan ? (billingCycle === "monthly" ? matchedPlan.monthlyPrice : matchedPlan.yearlyPrice) : 1000;
        
        // Mode Bêta: create request with status pending_validation
        await createPendingSubscriptionRequest({
          userId: currentUserProfile?.uid || "guest_beta",
          userName: currentUserProfile?.artistName || currentUserProfile?.firstName || "Membre Bêta",
          userPhone: phonePayment,
          plan: selectedPlan,
          billingCycle: billingCycle,
          amount: amount
        });

        // Set step to pending_validation (never auto-activated during beta)
        setPaymentStep("pending_validation");

      } catch (err) {
        console.error("Error creating subscription request:", err);
        setPaymentStep("idle");
        alert("Une erreur s'est produite lors de la demande. Veuillez réessayer.");
      }
    }, 1200);
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
    <div className="min-h-screen bg-afri-bg text-afri-text font-sans pb-16 transition-colors duration-300">
      {/* HEADER SECTION - COMPACT & EXPRESSIVE */}
      <div className="relative overflow-hidden bg-gradient-to-b from-afri-bg-ter to-afri-bg border-b border-afri-border px-4 py-6 sm:py-8 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[#D4AF37]/5 rounded-full blur-[90px] pointer-events-none"></div>

        <div className="max-w-3xl mx-auto space-y-2.5 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
            👑 AFRIGOMBO PREMIUM
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
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: COMPARATIF DES OFFRES */}
      {/* ========================================================= */}
      {activeModal === "compare" && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999] flex items-center justify-center p-4 overflow-y-auto overscroll-contain touch-pan-y"
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="bg-afri-bg-sec border border-[#D4AF37]/40 rounded-2xl p-5 sm:p-6 max-w-2xl w-full space-y-4 shadow-2xl relative my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-afri-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                <h3 className="text-base font-black uppercase text-afri-text tracking-wide">Comparatif des offres</h3>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-afri-bg border border-afri-border text-afri-text-sec hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Table */}
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

            {/* Footer button */}
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
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: POURQUOI DEVENIR PREMIUM ? */}
      {/* ========================================================= */}
      {activeModal === "why" && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999] flex items-center justify-center p-4 overflow-y-auto overscroll-contain touch-pan-y"
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="bg-afri-bg-sec border border-[#D4AF37]/40 rounded-2xl p-5 sm:p-6 max-w-2xl w-full space-y-4 shadow-2xl relative my-auto max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-afri-border/60 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐</span>
                <div>
                  <h3 className="text-base font-black uppercase text-afri-text tracking-wide">Pourquoi devenir Premium ?</h3>
                  <p className="text-[10px] text-afri-text-sec">Des outils conçus pour propulser votre carrière musicale</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-afri-bg border border-afri-border text-afri-text-sec hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Cards */}
            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            </div>

            {/* Footer button */}
            <div className="pt-2 border-t border-afri-border/60 text-right shrink-0">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 bg-afri-bg border border-afri-border hover:border-[#D4AF37]/50 text-afri-text font-bold text-xs uppercase rounded-xl cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: ÉCONOMISER SUR VOS CONTRATS */}
      {/* ========================================================= */}
      {activeModal === "savings" && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999] flex items-center justify-center p-4 overflow-y-auto overscroll-contain touch-pan-y"
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="bg-afri-bg-sec border border-[#D4AF37]/40 rounded-2xl p-5 sm:p-6 max-w-2xl w-full space-y-4 shadow-2xl relative my-auto max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-afri-border/60 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">💰</span>
                <div>
                  <h3 className="text-base font-black uppercase text-afri-text tracking-wide">Économiser sur vos contrats</h3>
                  <p className="text-[10px] text-afri-text-sec">Taux de commission réduit à 1,5% au lieu de 2,5%</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-afri-bg border border-afri-border text-afri-text-sec hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Calculator */}
            <div className="overflow-y-auto space-y-4 pr-1 flex-1 text-left">
              <p className="text-xs text-afri-text-sec leading-relaxed">
                Le Premium réduit vos propres commissions sur les contrats (<strong className="text-[#D4AF37]">1,5% au lieu de 2,5%</strong>).
              </p>

              {/* Preset Buttons */}
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

              {/* Slider */}
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

              {/* Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Standard Account */}
                <div className="p-4 bg-afri-bg border border-afri-border rounded-xl space-y-2">
                  <div className="text-xs font-bold text-afri-text-sec">Compte Standard (2.5%)</div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-afri-text-sec">Commission :</span>
                    <span className="text-afri-text font-bold">{(simAmount * 0.025).toLocaleString()} FCFA</span>
                  </div>
                </div>

                {/* Premium Account */}
                <div className="p-4 bg-afri-bg border border-[#D4AF37]/40 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-[#D4AF37]">Compte Premium (1.5%)</div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-afri-text-sec">Commission :</span>
                    <span className="text-afri-text font-bold">{(simAmount * 0.015).toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>

              {/* Gain Box */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-400">Gain net immédiat</h4>
                  <p className="text-[10px] text-afri-text-sec">Économie sur ce seul contrat</p>
                </div>
                <span className="text-emerald-400 text-base font-black font-mono">+{(simAmount * 0.01).toLocaleString()} FCFA</span>
              </div>
            </div>

            {/* Footer button */}
            <div className="pt-2 border-t border-afri-border/60 text-right shrink-0">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 bg-afri-bg border border-afri-border hover:border-[#D4AF37]/50 text-afri-text font-bold text-xs uppercase rounded-xl cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: INTERACTIVE PAYMENT POPUP (BÊTA MODE) */}
      {/* ========================================================= */}
      {activeModal === "payment" && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[999] flex items-center justify-center p-4 overflow-y-auto overscroll-contain touch-pan-y"
          onClick={() => {
            if (paymentStep !== "processing") {
              setActiveModal(null);
            }
          }}
        >
          <div 
            className="bg-afri-bg-sec border border-[#D4AF37]/50 rounded-2xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl relative my-auto text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-afri-border/60 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-base font-black uppercase text-[#D4AF37] tracking-wide">
                  Abonnement {currentSelectedPlanObj.name}
                </h3>
              </div>
              {paymentStep !== "processing" && (
                <button 
                  onClick={() => setActiveModal(null)}
                  className="w-8 h-8 rounded-full bg-afri-bg border border-afri-border text-afri-text-sec hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {paymentStep === "idle" && (
              <div className="space-y-4">
                {/* Summary card */}
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

                {/* Mobile Money Payment Provider Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-afri-text-sec uppercase tracking-widest block">
                    Mode de Paiement
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "wave", label: "Wave Money", badge: "0% frais" },
                      { id: "orange", label: "Orange Money", badge: "Réseau CI" },
                      { id: "mtn", label: "MTN MoMo", badge: "Réseau CI" },
                      { id: "moov", label: "Moov Flooz", badge: "Réseau CI" }
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentOption(method.id)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          paymentOption === method.id
                            ? "bg-[#D4AF37]/15 border-[#D4AF37] text-afri-text"
                            : "bg-afri-bg border-afri-border text-afri-text-sec hover:border-[#D4AF37]/40"
                        }`}
                      >
                        <span className="text-[11px] font-black block">{method.label}</span>
                        <span className="text-[8px] opacity-70 uppercase">{method.badge}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phone Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-afri-text-sec uppercase tracking-widest block">
                    Numéro Mobile Money
                  </label>
                  <input
                    type="tel"
                    value={phonePayment}
                    onChange={(e) => setPhonePayment(e.target.value.replace(/[^\d+]/g, ""))}
                    placeholder="Ex: 0700000000"
                    className="w-full bg-afri-bg p-3 text-xs rounded-xl border border-afri-border text-afri-text focus:border-[#D4AF37] focus:outline-none font-mono tracking-wider font-bold"
                  />
                </div>

                {/* Confirm & Cancel Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={processPayment}
                    disabled={!phonePayment}
                    className="w-full bg-[#D4AF37] hover:bg-amber-400 active:scale-98 text-black font-black uppercase text-xs py-3.5 tracking-widest rounded-xl transition-all cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    Envoyer la demande ({currentSelectedPlanObj.priceLabel})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="w-full py-2 text-center text-xs font-bold text-afri-text-sec hover:text-white cursor-pointer"
                  >
                    Annuler
                  </button>
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
                    Contactez le support AFRIGOMBO afin d'obtenir votre code d'activation.
                  </p>
                </div>

                {/* Single Primary Button: Contacter le support via WhatsApp */}
                <button
                  type="button"
                  onClick={() => {
                    supportConfig.openSupport(`Bonjour Support AFRIGOMBO 👋\nJe souhaite obtenir mon code d'activation pour mon abonnement ${currentSelectedPlanObj.name} (Tél: ${phonePayment}).`);
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
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: CODE ACTIVATION INPUT POPUP ("Activer mon abonnement") */}
      {/* ========================================================= */}
      {activeModal === "activation" && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[999] flex items-center justify-center p-4 overflow-y-auto overscroll-contain touch-pan-y"
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="bg-afri-bg-sec border border-[#D4AF37]/50 rounded-2xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl relative my-auto text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-afri-border/60 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-base font-black uppercase text-[#D4AF37] tracking-wide">
                  Activer mon abonnement
                </h3>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-afri-bg border border-afri-border text-afri-text-sec hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleValidateActivationCode} className="space-y-4">
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

              {/* Requirement 7: If wrong code -> Simply "Code invalide." */}
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
                      supportConfig.openSupport("Bonjour Support AFRIGOMBO 👋\nJe n'ai pas encore reçu mon code d'activation d'abonnement.");
                    }}
                    className="w-full py-2 text-center text-[11px] font-bold text-afri-text-sec hover:text-[#D4AF37] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Obtenir un code via le Support</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
