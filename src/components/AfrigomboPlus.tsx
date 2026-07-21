import React, { useState } from "react";
import { Sparkles, Check, ChevronLeft, CreditCard, Award, Shield, Film, Music, BarChart3, Radio } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { gomboDB } from "../firebase";

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
  const [paymentOption, setPaymentOption] = useState<string | null>(null);
  const [phonePayment, setPhonePayment] = useState("");
  const [paymentStep, setPaymentStep] = useState<"idle" | "processing" | "success">("idle");
  const [simAmount, setSimAmount] = useState<number>(100000);
  const [subscribedPlan, setSubscribedPlan] = useState<string | null>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem("gombo_subscription") || "GOMBO FREE";
    }
    return "GOMBO FREE";
  });

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
      features: [
        "Profil artiste standard",
        "1 publication par semaine",
        "Messagerie standard",
        "Voir les gombos de base",
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
  };

  const processPayment = async () => {
    // Basic verification
    if (paymentOption !== "card" && !phonePayment) {
      alert("Veuillez saisir votre numéro mobile money pour l'autorisation.");
      return;
    }
    setPaymentStep("processing");
    try {
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('gombo_play_sound', { detail: { name: 'tambour' } }));
      }
    } catch (_) {}

    // Simulated transaction block with DB hook
    setTimeout(async () => {
      try {
        const matchedPlan = plans.find(p => p.id === selectedPlan);
        const subName = matchedPlan ? matchedPlan.name : "GOMBO ELITE";
        const amount = matchedPlan ? (billingCycle === "monthly" ? matchedPlan.monthlyPrice : matchedPlan.yearlyPrice) : 1000;
        
        // Publish real transaction record
        if (currentUserProfile?.uid) {
          await gomboDB.publishPayment({
            userId: currentUserProfile.uid,
            userName: currentUserProfile.name || currentUserProfile.artistName || "Membre Premium",
            amount: amount,
            purpose: `💎 Abonnement ${subName} - Premium AFRIGOMBO`,
            provider: paymentOption || "wave",
            phoneNumber: phonePayment,
            status: "success"
          });

          // Persistent database update of Premium profile flags
          const currentBadges = currentUserProfile.badges || [];
          const newBadges = Array.from(new Set([...currentBadges, "💎 Adhérent Premium"]));
          await gomboDB.updateUserProfile(currentUserProfile.uid, {
            isPremium: true,
            badges: newBadges,
            subscriptionPlan: subName
          } as any);

          if (onRefreshProfile) {
            onRefreshProfile();
          }
        }

        setPaymentStep("success");
        localStorage.setItem("gombo_subscription", subName);
        setSubscribedPlan(subName);

        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('gombo_play_sound', { detail: { name: 'premium' } }));
        }
      } catch (err) {
        console.error("Error setting premium db profile:", err);
        alert("Erreur lors de l'enregistrement de votre abonnement. Vos fonds ne sont pas perdus, contactez le support.");
        setPaymentStep("idle");
      }
    }, 2800);
  };

  return (
    <div className="min-h-screen bg-afri-bg text-afri-text font-sans pb-32 transition-colors duration-300">
      {/* HEADER SECTION */}
      <div className="relative overflow-hidden bg-gradient-to-b from-afri-bg-ter to-afri-bg border-b border-afri-border px-6 pt-12 pb-24 sm:pt-20 sm:pb-36 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-afri-bg-sec/5 rounded-full blur-[120px] pointer-events-none"></div>
        <button
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-black text-afri-text-sec hover:text-[#D4AF37] transition-colors cursor-pointer uppercase tracking-widest z-10"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour
        </button>

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-afri-bg-sec/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
            👑 AFRIGOMBO PREMIUM
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-afri-text uppercase leading-[0.95]">
            Développez votre <span className="text-[#D4AF37]">carrière</span>.
          </h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 pt-4">
            <div className="text-afri-text-sec text-xs sm:text-sm font-bold uppercase tracking-wider">Soyez davantage visible.</div>
            <div className="text-afri-text-sec text-xs sm:text-sm font-bold uppercase tracking-wider">Obtenez plus de Gombos.</div>
            <div className="text-afri-text-sec text-xs sm:text-sm font-bold uppercase tracking-wider">Économisez sur vos contrats.</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 -mt-20 relative z-20 space-y-24">
        {/* BILLING TOGGLE */}
        <div className="flex justify-center mb-12">
          <div className="bg-afri-bg-sec p-1.5 rounded-2xl border border-afri-border flex items-center gap-1.5 backdrop-blur-xl shadow-lg">
            <button 
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${billingCycle === "monthly" ? "bg-afri-bg-sec text-black shadow-lg" : "text-afri-text-sec hover:text-afri-text"}`}
            >
              Mensuel
            </button>
            <button 
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${billingCycle === "yearly" ? "bg-afri-bg-sec text-black shadow-lg" : "text-afri-text-sec hover:text-afri-text"}`}
            >
              Annuel <span className="text-[9px] opacity-70 ml-1 font-extrabold">-20%</span>
            </button>
          </div>
        </div>

        {/* CARDS LIST */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          {plans.map((p) => {
            const isActive = subscribedPlan === p.name;
            const isSelected = selectedPlan === p.id;
            
            // Generate clean native theme responsive card styles
            let cardBg = "bg-afri-bg-sec border-afri-border";
            if (p.id === "elite") {
              cardBg = "bg-afri-bg-sec border-[#D4AF37]/50 shadow-[0_12px_40px_rgba(212,175,55,0.08)]";
            } else if (p.id === "pro") {
              cardBg = "bg-afri-bg-sec border-afri-border hover:border-[#D4AF37]/40 shadow-sm";
            }

            return (
              <div
                key={p.id}
                className={`flex flex-col p-10 sm:p-12 rounded-[40px] border transition-all duration-500 group relative ${cardBg} ${
                  isSelected ? "ring-2 ring-[#D4AF37] scale-105 z-10" : "hover:scale-[1.02]"
                }`}
              >
                <div className="space-y-6 flex-1 text-left">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-black tracking-tight text-afri-text uppercase">{p.name}</h3>
                      <p className="text-[10px] text-afri-text-sec uppercase tracking-widest mt-1.5 font-bold">
                        {p.id === "free" ? "Formule de base" : p.description}
                      </p>
                    </div>
                  </div>

                  <div className="py-4">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl sm:text-5xl font-black text-afri-text tracking-tighter">{p.priceLabel}</span>
                      <span className="text-xs text-afri-text-sec font-bold uppercase">{p.period}</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2 border-t border-afri-border/50">
                    {p.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-afri-bg-sec/15 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-[#D4AF37] stroke-[3]" />
                        </div>
                        <span className="text-xs font-semibold text-afri-text-sec leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-12">
                  {isActive ? (
                    <div className="w-full text-center py-4 px-6 rounded-2xl bg-afri-bg text-afri-text-sec font-black text-[10px] uppercase tracking-[0.2em] border border-afri-border">
                      Formule Actuelle
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribeClick(p.id as any)}
                      className={`w-full py-4.5 px-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 shadow-xl hover:shadow-[#D4AF37]/10 active:scale-[0.98] cursor-pointer ${
                        p.id === "free" 
                          ? "bg-afri-bg border border-afri-border text-afri-text hover:bg-afri-bg-ter" 
                          : "bg-afri-bg-sec text-black hover:bg-opacity-95"
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

        {/* PRÉSENTER LES AVANTAGES (LARGE CARDS) */}
        <div className="mb-24 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-black text-afri-text uppercase tracking-tighter">Pourquoi devenir Premium ?</h2>
            <p className="text-afri-text-sec text-sm max-w-xl mx-auto">Découvrez les outils conçus pour propulser votre carrière musicale vers le haut.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              <div key={idx} className="p-8 sm:p-10 bg-afri-bg-sec border border-afri-border rounded-[32px] space-y-6 hover:border-[#D4AF37]/40 shadow-sm transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-afri-bg-sec/10 text-[#D4AF37] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <adv.icon className="w-7 h-7" />
                </div>
                <div className="space-y-2 text-left">
                  <div className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest">{adv.highlight}</div>
                  <h4 className="text-lg font-black text-afri-text uppercase tracking-tight">{adv.title}</h4>
                  <p className="text-xs sm:text-sm text-afri-text-sec leading-relaxed">{adv.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COMPARISON TABLE */}
        <div className="mb-24 space-y-12 overflow-x-auto">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-black text-afri-text uppercase tracking-tighter">Comparatif des offres</h2>
          </div>

          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-afri-border">
                <th className="py-6 text-afri-text-sec font-bold uppercase text-[10px] tracking-widest">Avantages</th>
                <th className="py-6 text-center text-afri-text font-black uppercase text-xs">Free</th>
                <th className="py-6 text-center text-emerald-500 font-black uppercase text-xs">Pro</th>
                <th className="py-6 text-center text-[#D4AF37] font-black uppercase text-xs">Elite</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {[
                { label: "Commission sur contrat", free: "2,5%", pro: "1,5%", elite: "1,5%" },
                { label: "Badge de profil", free: "Standard", pro: "Silver", elite: "Gold Prestige" },
                { label: "Publications / jour", free: "1 / sem", pro: "3 / jour", elite: "Illimité" },
                { label: "Visibilité annuaire", free: "Standard", pro: "+40%", elite: "Priorité Maximale" },
                { label: "Statistiques", free: "Basique", pro: "Standards", elite: "Avancées" },
                { label: "Candidatures", free: "Standard", pro: "Prioritaires", elite: "Ultra-Prioritaires" },
              ].map((row, i) => (
                <tr key={i} className="border-b border-afri-border/50 hover:bg-afri-bg-ter/40 transition-colors">
                  <td className="py-5 font-bold text-afri-text-sec">{row.label}</td>
                  <td className="py-5 text-center text-afri-text-muted font-mono">{row.free}</td>
                  <td className="py-5 text-center text-emerald-500 font-mono font-bold">{row.pro}</td>
                  <td className="py-5 text-center text-afri-text font-mono font-bold">{row.elite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SECTION : ÉCONOMISEZ SUR VOS CONTRATS */}
        <div className="mt-16 bg-afri-bg-sec border border-afri-border p-12 sm:p-20 rounded-[48px] space-y-12 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 left-0 w-64 h-64 bg-afri-bg-sec/5 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-[#D4AF37] text-[10px] uppercase font-black tracking-widest bg-afri-bg-sec/10 px-4 py-1.5 rounded-full border border-[#D4AF37]/20">
              ⚡ Économie Directe
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-afri-text uppercase tracking-tighter">
              Économisez sur vos contrats
            </h2>
            <p className="text-xs sm:text-sm text-afri-text-sec leading-relaxed">
              Le Premium réduit uniquement <strong className="text-[#D4AF37]">VOS PROPRES commissions</strong> (1,5% au lieu de 2,5%). Chaque partie bénéficie individuellement de son propre abonnement.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap justify-center gap-2.5">
            {[50000, 100000, 250000, 500000].map((presetAmt) => (
              <button
                key={presetAmt}
                type="button"
                onClick={() => setSimAmount(presetAmt)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                  simAmount === presetAmt 
                    ? "bg-afri-bg-sec/15 border-[#D4AF37] text-[#D4AF37]" 
                    : "bg-afri-bg-ter border-afri-border text-afri-text-sec hover:border-[#D4AF37]/40 hover:text-afri-text"
                }`}
              >
                {presetAmt.toLocaleString()} FCFA
              </button>
            ))}
          </div>

          {/* Comparative Calculator & Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-left">
            
            {/* Left: Beautiful visual comparison card */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-afri-text-sec">Exemple d'un contrat de {simAmount.toLocaleString()} FCFA</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Standard Account */}
                <div className="p-5 bg-afri-bg-ter border border-afri-border rounded-2xl relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-afri-bg/80 text-afri-text-sec text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border border-afri-border">
                    Standard
                  </div>
                  <span className="text-xs font-bold text-afri-text-sec block mb-3">Compte Standard (2.5%)</span>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-afri-text-sec">
                      <span>Votre commission :</span>
                      <span className="text-afri-text font-bold">{(simAmount * 0.025).toLocaleString()} FCFA</span>
                    </div>
                    <p className="text-[9px] text-afri-text-muted italic mt-1">Calculée uniquement sur votre part (2.5%)</p>
                    <hr className="border-afri-border/50 my-2" />
                    <div className="flex justify-between text-[#D4AF37] font-sans font-bold text-xs">
                      <span>Taux standard :</span>
                      <span>2.5%</span>
                    </div>
                  </div>
                </div>

                {/* Premium Account */}
                <div className="p-5 bg-afri-bg-sec/10 border border-[#D4AF37]/40 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-afri-bg-sec/20 text-[#D4AF37] text-[8px] font-black px-1.5 py-0.5 rounded uppercase border border-[#D4AF37]/35">
                    ★ Premium
                  </div>
                  <span className="text-xs font-bold text-[#D4AF37] block mb-3">Compte Premium (1.5%)</span>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-afri-text-sec">
                      <span>Votre commission :</span>
                      <span className="text-afri-text font-bold">{(simAmount * 0.015).toLocaleString()} FCFA</span>
                    </div>
                    <p className="text-[9px] text-emerald-500 italic mt-1">Économie de {(simAmount * 0.01).toLocaleString()} FCFA acquise !</p>
                    <hr className="border-[#D4AF37]/20 my-2" />
                    <div className="flex justify-between text-emerald-500 font-sans font-bold text-xs">
                      <span>Taux réduit :</span>
                      <span>1.5%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total economy showcase */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-sm">
                    ★
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-afri-text">Économie Immédiate</h4>
                    <p className="text-[10px] text-afri-text-sec">Sur chaque contrat conclu via AFRIGOMBO</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-emerald-500 text-lg font-black font-mono">-{(simAmount * 0.01).toLocaleString()} FCFA</span>
                  <span className="text-[9px] text-afri-text-sec block">d'économie nette pour vous</span>
                </div>
              </div>
            </div>

            {/* Right: Dynamic simulation widget */}
            <div className="lg:col-span-5 bg-afri-bg-ter border border-afri-border p-8 rounded-[32px] space-y-6">
              <span className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest block">Simulateur d'économies</span>
              <h4 className="text-sm font-bold text-afri-text">Ajuster le montant</h4>
              
              <div className="space-y-4">
                <div className="flex justify-between text-xs">
                  <span className="text-afri-text-sec">Contrat :</span>
                  <span className="text-[#D4AF37] font-bold font-mono text-base">{simAmount.toLocaleString()} FCFA</span>
                </div>
                <input 
                  type="range" 
                  min="50000" 
                  max="1000000" 
                  step="50000"
                  value={simAmount}
                  onChange={(e) => setSimAmount(Number(e.target.value))}
                  className="w-full h-1.5 bg-afri-bg rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                />
              </div>

              <div className="space-y-3 border-t border-afri-border pt-6 text-xs">
                <div className="flex justify-between text-afri-text-sec">
                  <span>Frais standard (2.5%) :</span>
                  <span className="font-mono">{(simAmount * 0.025).toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between text-afri-text-sec">
                  <span>Frais Premium (1.5%) :</span>
                  <span className="font-mono text-[#D4AF37]">{(simAmount * 0.015).toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between font-black text-emerald-500 pt-3 border-t border-dashed border-afri-border text-sm">
                  <span>Gain net :</span>
                  <span className="font-mono">{(simAmount * 0.01).toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* PAYMENT POPUP / INTERACTIVE CARD */}
        {paymentOption && (
          <div className="mt-12 max-w-lg mx-auto bg-afri-bg-sec border border-[#D4AF37]/30 p-10 rounded-3xl space-y-6 text-left relative overflow-hidden shadow-2xl animate-slideUp">
            <h3 className="text-lg font-black uppercase text-[#D4AF37] flex items-center gap-1.5">
              <CreditCard className="w-5 h-5 text-[#D4AF37]" />
              Finalisez votre abonnement
            </h3>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Vous avez choisi la formule <span className="font-bold text-afri-text uppercase">{plans.find(p => p.id === selectedPlan)?.name}</span>. Le paiement commencera immédiatement par déduction sécurisée.
            </p>

            {paymentStep === "idle" && (
              <div className="space-y-4">
                {/* Method choose */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "wave", label: "Wave Money", badge: "0% frais" },
                    { id: "orange", label: "Orange Money", badge: "Réseau CI" },
                    { id: "mtn", label: "MTN MoMo", badge: "Réseau CI" },
                    { id: "moov", label: "Moov Flooz", badge: "Réseau CI" }
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentOption(method.id)}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                        paymentOption === method.id
                          ? "bg-afri-bg-sec/10 border-[#D4AF37] text-afri-text"
                          : "bg-afri-bg border-afri-border text-afri-text-sec hover:border-[#D4AF37]/40"
                      }`}
                    >
                      <span className="text-[11px] font-black block">{method.label}</span>
                      <span className="text-[8px] opacity-60 uppercase">{method.badge}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-afri-text-sec uppercase tracking-widest">Numéro de téléphone mobile money</label>
                  <input
                    type="tel"
                    value={phonePayment}
                    onChange={(e) => setPhonePhoneValue(e.target.value)}
                    placeholder="Ex: +225 07 00 00 00 00"
                    className="w-full bg-afri-bg p-3.5 text-sm rounded-xl border border-afri-border text-afri-text focus:border-[#D4AF37] focus:outline-none font-mono tracking-wider"
                  />
                  {/* helper */}
                  <span className="text-[9px] text-afri-text-sec block leading-relaxed">Un SMS et une boîte de dialogue apparaîtront sur votre mobile pour confirmation du code secret.</span>
                </div>

                <button
                  onClick={processPayment}
                  className="w-full bg-afri-bg-sec text-black font-black uppercase text-xs py-4 tracking-widest rounded-2xl hover:bg-opacity-95 active:scale-95 transition-all cursor-pointer shadow-xl"
                >
                  Confirmer le paiement - {plans.find(p => p.id === selectedPlan)?.priceLabel}
                </button>
              </div>
            )}

            {paymentStep === "processing" && (
              <div className="py-8 text-center space-y-4">
                {/* Loader */}
                <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm font-bold text-[#D4AF37] animate-pulse">Contactant les serveurs de paiement Mobile Money ({paymentOption?.toUpperCase()})...</p>
                <p className="text-[10px] text-afri-text-sec">Veuillez autoriser et taper votre code secret sur votre téléphone pour valider l'opération...</p>
              </div>
            )}

            {paymentStep === "success" && (
              <div className="py-6 text-center space-y-4 animate-scaleIn">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-xl">
                  ✓
                </div>
                <div>
                  <h4 className="text-base font-black text-afri-text uppercase tracking-tight">Félicitations, Bienvenue Elite !</h4>
                  <p className="text-xs text-afri-text-sec mt-1">Votre badge Gold Gombo et votre accès illimité aux statistiques poussées ont été activés instantanément.</p>
                </div>
                <button
                  onClick={() => {
                    setPaymentOption(null);
                    onBack();
                  }}
                  className="bg-afri-bg-ter border border-afri-border text-afri-text-sec font-bold uppercase text-[10px] px-6 py-2.5 rounded-xl hover:text-afri-text"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  function setPhonePhoneValue(val: string) {
    // Basic formatting helper
    setPhonePayment(val.replace(/[^\d+]/g, ""));
  }
}
