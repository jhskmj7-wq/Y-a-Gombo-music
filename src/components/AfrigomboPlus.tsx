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
  const [selectedPlan, setSelectedPlan] = useState<"free" | "pro" | "elite" | "legend">("elite");
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
      price: "0 FCFA",
      period: t ? t('par_mois') || "/mois" : "/mois",
      color: "border-zinc-800 bg-zinc-950/40",
      accentColor: "text-zinc-400",
      badge: "Inclus par défaut",
      features: [
        "Profil artiste standard",
        "1 publication par semaine",
        "Messagerie standard",
        "Voir les gombos de base",
      ],
      disabledFeatures: [
        "👑 Pastille de Prestige Premium",
        "⭐ Mise en avant dans les recherches",
        "🚀 Priorité dans les Renforts Express",
        "📈 Jusqu'à +150% de visibilité",
        "🎖️ Profil recommandé d'office",
        "📊 Statistiques d'audience avancées",
        "💬 Priorité de mise en relation directe"
      ]
    },
    {
      id: "pro",
      name: "GOMBO PRO",
      price: "1 500 FCFA",
      period: "/mois",
      color: "border-emerald-500/30 bg-emerald-950/10 shadow-[0_4px_20px_rgba(16,185,129,0.05)]",
      accentColor: "text-emerald-400",
      badge: "Populaire",
      features: [
        "👑 Badge Premium Silver",
        "⚡ Commission de 1,5% au lieu de 2,5%",
        "⭐ Boost de recherche moyen (+40%)",
        "📈 Plus de visibilité sur l'annuaire",
        "3 publications par jour",
        "Accès aux opportunités régionales",
        "Portfolio: jusqu'à 3 audios & 3 vidéos",
      ],
      disabledFeatures: [
        "🚀 Priorité dans les Renforts Express",
        "🎖️ Profil recommandé d'office",
        "📊 Statistiques avancées complètes",
        "💬 Priorité de mise en relation directe"
      ]
    },
    {
      id: "elite",
      name: "GOMBO ELITE",
      price: "4 000 FCFA",
      period: "/mois",
      color: "border-[#D4AF37] bg-gradient-to-b from-[#121008] to-[#040402] shadow-[0_10px_35px_rgba(212,175,55,0.12)] relative overflow-hidden",
      accentColor: "text-[#D4AF37]",
      badge: "Recommandé Elite",
      features: [
        "👑 Badge Premium Gold d'excellence",
        "⚡ Commission de 1,5% au lieu de 2,5%",
        "⭐ Mise en avant maximale dans l'annuaire",
        "🚀 Priorité absolue dans les Renforts Express",
        "📈 Visibilité boostée à 150%",
        "🎖️ Profil recommandé d'office aux recruteurs",
        "📊 Accès aux Statistiques Avancées",
        "💬 Priorité absolue de mise en relation",
        "Candidatures illimitées aux cachets premium",
        "Création de groupes musicaux & co-promotions",
      ],
      disabledFeatures: []
    },
    {
      id: "legend",
      name: "GOMBO LEGEND",
      price: "VIP",
      period: "Sur Invitation",
      color: "border-[#D4AF37]/50 bg-[#08080c] shadow-[0_8px_30px_rgba(212,175,55,0.06)]",
      accentColor: "text-amber-500",
      badge: "Prestige",
      features: [
        "Accompagnement de carrière d'élite (A&R)",
        "Mise en relation directe avec les labels internationaux",
        "Session studio premium offerte trimestriellement",
        "Badge LEGEND Platine certifié",
        "Accès à tous les événements physiques VIP d'AFRIGOMBO",
      ],
      disabledFeatures: []
    }
  ];

  const handleSubscribeClick = (planId: "free" | "pro" | "elite" | "legend") => {
    if (planId === "free") {
      localStorage.setItem("gombo_subscription", "GOMBO FREE");
      setSubscribedPlan("GOMBO FREE");
      return;
    }
    if (planId === "legend") {
      alert("La formule LEGEND est disponible uniquement sur invitation privée de la commission AFRIGOMBO pour les artistes émérites.");
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
        
        // Publish real transaction record
        if (currentUserProfile?.uid) {
          await gomboDB.publishPayment({
            userId: currentUserProfile.uid,
            userName: currentUserProfile.name || currentUserProfile.artistName || "Membre Premium",
            amount: selectedPlan === "pro" ? 1500 : 4000,
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
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-32">
      {/* HEADER SECTION */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#121008] to-[#050505] border-b border-zinc-900 px-6 py-6 sm:py-8 text-left">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none"></div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-black text-zinc-400 hover:text-white transition-colors cursor-pointer mb-5 uppercase tracking-widest"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour au Terrain
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full border border-[#D4AF37]/20 flex items-center gap-1 animate-pulse">
                <Sparkles className="w-3 h-3 fill-[#D4AF37]" />
                Offre Exclusive
              </span>
              <span className="text-zinc-500 font-mono text-[10px]">Abonnement actif : <span className="text-[#D4AF37] font-black">{subscribedPlan}</span></span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase font-sans">
              ⭐ AFRIGOMBO <span className="text-[#D4AF37]">PLUS</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              Propulsez votre identité d'artiste africain vers de nouveaux standards. Obtenez les statistiques d'audience, d'écoutes, plus de visibilité, et des gombos d'exception.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* CARDS LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {plans.map((p) => {
            const isActive = subscribedPlan === p.name;
            const isSelected = selectedPlan === p.id;
            return (
              <div
                key={p.id}
                className={`flex flex-col justify-between p-5 rounded-3xl border transition-all duration-300 relative ${p.color} ${
                  isSelected ? "ring-2 ring-[#D4AF37]" : ""
                }`}
              >
                {/* Visual Glow Indicator */}
                {p.id === "elite" && (
                  <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#D4AF37]/10 rounded-full blur-2xl"></div>
                )}

                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500">Formule</span>
                      <h3 className="text-lg font-black tracking-tight group-hover:text-[#D4AF37] transition-colors">{p.name}</h3>
                    </div>
                    <span className="text-[9px] font-black bg-zinc-900 border border-zinc-800 text-[#D4AF37] py-0.5 px-2.5 rounded-full uppercase">
                      {p.badge}
                    </span>
                  </div>

                  <div className="py-2 text-left">
                    <span className="text-3xl font-extrabold text-white tracking-tighter">{p.price}</span>
                    <span className="text-xs text-zinc-500 ml-1">{p.period}</span>
                  </div>

                  <hr className="border-zinc-900" />

                  {/* Included benefits */}
                  <ul className="space-y-2.5 text-left text-xs text-zinc-300">
                    {p.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                    {p.disabledFeatures.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 opacity-35 line-through decoration-zinc-700">
                        <span className="text-zinc-600 block shrink-0 mt-0.5 font-bold">✕</span>
                        <span className="text-zinc-500">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  {isActive ? (
                    <div className="w-full text-center py-2.5 px-4 rounded-xl bg-zinc-900 text-zinc-400 font-extrabold text-xs uppercase border border-zinc-800">
                      Formule Actuelle
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribeClick(p.id as any)}
                      className={`w-full text-center py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        p.id === "elite"
                          ? "bg-gradient-to-r from-[#D4AF37] to-[#F1C40F] text-black shadow-lg hover:shadow-[#D4AF37]/20 hover:scale-101"
                          : p.id === "legend"
                          ? "bg-zinc-900 border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-zinc-850"
                          : "bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-white"
                      }`}
                    >
                      {p.id === "legend" ? "Sur Invitation" : "Sélectionner"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* SECTION : ÉCONOMISEZ SUR VOS CONTRATS */}
        <div className="mt-16 bg-gradient-to-b from-zinc-950 to-black border border-zinc-850 p-6 sm:p-8 rounded-3xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[#D4AF37] text-[10px] uppercase font-black tracking-widest bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/20">
              ⚡ Monétisation Équitable & Transparente
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              Économisez sur vos contrats
            </h2>
            <p className="text-xs text-zinc-400">
              Avec AFRIGOMBO, les commissions sont appliquées individuellement. <strong className="text-[#D4AF37]">Le Premium réduit uniquement VOS PROPRES commissions</strong>. Le statut Premium d'un utilisateur ne modifie jamais la commission de l'autre partie : chaque partie bénéficie individuellement de son abonnement.
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
                    ? "bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]" 
                    : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                {presetAmt.toLocaleString()} FCFA
              </button>
            ))}
          </div>

          {/* Comparative Calculator & Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: Beautiful visual comparison card */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500">Exemple d'un contrat de {simAmount.toLocaleString()} FCFA</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Standard Account */}
                <div className="p-5 bg-zinc-900/40 border border-zinc-850 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-zinc-800 text-zinc-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                    Standard
                  </div>
                  <span className="text-xs font-bold text-zinc-300 block mb-3">Compte Standard (2.5%)</span>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-zinc-400">
                      <span>Votre commission :</span>
                      <span className="text-white font-bold">{(simAmount * 0.025).toLocaleString()} FCFA</span>
                    </div>
                    <p className="text-[9px] text-zinc-500 italic mt-1">Calculée uniquement sur votre part (2.5%)</p>
                    <hr className="border-zinc-800 my-2" />
                    <div className="flex justify-between text-[#D4AF37] font-sans font-bold text-xs">
                      <span>Taux standard :</span>
                      <span>2.5%</span>
                    </div>
                  </div>
                </div>

                {/* Premium Account */}
                <div className="p-5 bg-[#D4AF37]/5 border border-[#D4AF37]/35 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-[#D4AF37]/20 text-[#D4AF37] text-[8px] font-black px-1.5 py-0.5 rounded uppercase border border-[#D4AF37]/35">
                    ★ Premium
                  </div>
                  <span className="text-xs font-bold text-[#D4AF37] block mb-3">Compte Premium (1.5%)</span>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-zinc-300">
                      <span>Votre commission :</span>
                      <span className="text-white font-bold">{(simAmount * 0.015).toLocaleString()} FCFA</span>
                    </div>
                    <p className="text-[9px] text-[#D4AF37]/70 italic mt-1">Économie de {(simAmount * 0.01).toLocaleString()} FCFA acquise !</p>
                    <hr className="border-[#D4AF37]/20 my-2" />
                    <div className="flex justify-between text-emerald-400 font-sans font-bold text-xs">
                      <span>Taux réduit :</span>
                      <span>1.5%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total economy showcase */}
              <div className="bg-gradient-to-r from-emerald-950/20 to-teal-950/20 border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm">
                    ★
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Économie Immédiate</h4>
                    <p className="text-[10px] text-zinc-400">Sur chaque contrat conclu via AFRIGOMBO</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 text-lg font-black font-mono">-{(simAmount * 0.01).toLocaleString()} FCFA</span>
                  <span className="text-[9px] text-zinc-500 block">d'économie nette pour vous</span>
                </div>
              </div>
            </div>

            {/* Right: Dynamic simulation widget */}
            <div className="lg:col-span-5 bg-zinc-900/30 border border-zinc-850 p-5 rounded-3xl space-y-4">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Simulateur d'économies</span>
              <h4 className="text-sm font-bold text-white">Ajuster manuellement</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Montant du contrat :</span>
                  <span className="text-[#D4AF37] font-bold font-mono">{simAmount.toLocaleString()} FCFA</span>
                </div>
                <input 
                  type="range" 
                  min="50000" 
                  max="1000000" 
                  step="50000"
                  value={simAmount}
                  onChange={(e) => setSimAmount(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                />
                <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                  <span>50 000 F</span>
                  <span>500 000 F</span>
                  <span>1 000 000 F</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-zinc-800 pt-3 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Frais standard (2.5%) :</span>
                  <span className="font-mono">{(simAmount * 0.025).toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Frais Premium (1.5%) :</span>
                  <span className="font-mono text-[#D4AF37]">{(simAmount * 0.015).toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-400 pt-1 border-t border-dashed border-zinc-800">
                  <span>Votre Économie (1%) :</span>
                  <span className="font-mono">{(simAmount * 0.01).toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>

          </div>

          {/* AVANTAGES PREMIUM SECTION */}
          <div className="border-t border-zinc-900 pt-8 mt-4 space-y-6">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#D4AF37] border-l-2 border-[#D4AF37] pl-3">
              AVANTAGES PREMIUM EXCLUSIFS
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: "Badge Premium", desc: "Affichez fièrement votre statut Gold ou Silver vérifié d'office.", icon: Award },
                { title: "Profil mis en avant", desc: "Maximisez votre exposition en haut de l'annuaire général des artistes.", icon: Sparkles },
                { title: "Publications prioritaires", desc: "Diffusez vos actus sans aucune restriction hebdomadaire.", icon: Film },
                { title: "Apparition prioritaire", desc: "Soyez le premier affiché lors des requêtes des recruteurs et promoteurs.", icon: Radio },
                { title: "Statistiques avancées", desc: "Accédez aux rapports d'audience, de clics et d'écoutes de vos œuvres.", icon: BarChart3 },
                { title: "Réduction des commissions", desc: "Payez seulement 1,5% de commission au lieu de 2,5% sur chaque contrat.", icon: Shield },
                { title: "Futures fonctionnalités", desc: "Bénéficiez en avant-première des outils de co-promotion et du studio AFRIGOMBO.", icon: Music }
              ].map((adv, idx) => {
                const IconComponent = adv.icon;
                return (
                  <div key={idx} className="p-4 bg-zinc-900/20 border border-zinc-900 rounded-2xl space-y-2 hover:border-zinc-850 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-tight">{adv.title}</h4>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">{adv.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* PAYMENT POPUP / INTERACTIVE CARD */}
        {paymentOption && (
          <div className="mt-12 max-w-lg mx-auto bg-zinc-950 border border-[#D4AF37]/20 p-6 rounded-3xl space-y-6 text-left relative overflow-hidden animate-slideUp">
            <h3 className="text-lg font-black uppercase text-[#D4AF37] flex items-center gap-1.5">
              <CreditCard className="w-5 h-5 text-[#D4AF37]" />
              Finalisez votre abonnement
            </h3>
            <p className="text-xs text-zinc-450 leading-relaxed">
              Vous avez choisi la formule <span className="font-bold text-white uppercase">{plans.find(p => p.id === selectedPlan)?.name}</span>. Le paiement commencera immédiatement par déduction sécurisée.
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
                          ? "bg-[#D4AF37]/10 border-[#D4AF37] text-white"
                          : "bg-neutral-900/50 border-zinc-850 text-zinc-400 hover:border-zinc-800"
                      }`}
                    >
                      <span className="text-[11px] font-black block">{method.label}</span>
                      <span className="text-[8px] opacity-60 uppercase">{method.badge}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Numéro de téléphone mobile money</label>
                  <input
                    type="tel"
                    value={phonePayment}
                    onChange={(e) => setPhonePhoneValue(e.target.value)}
                    placeholder="Ex: +225 07 00 00 00 00"
                    className="w-full bg-[#050505] p-3 text-sm rounded-xl border border-zinc-800 focus:border-[#D4AF37] focus:outline-none font-mono tracking-wider"
                  />
                  {/* helper */}
                  <span className="text-[9px] text-zinc-500 block">Un SMS et une boîte de dialogue apparaîtront sur votre mobile pour confirmation du code secret.</span>
                </div>

                <button
                  onClick={processPayment}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-black uppercase text-xs py-3.5 tracking-widest rounded-xl hover:brightness-110 active:scale-99 transition-all cursor-pointer shadow-[0_5px_15px_rgba(16,185,129,0.15)]"
                >
                  Payez {plans.find(p => p.id === selectedPlan)?.price}
                </button>
              </div>
            )}

            {paymentStep === "processing" && (
              <div className="py-8 text-center space-y-4">
                {/* Loader */}
                <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm font-bold text-[#D4AF37] animate-pulse">Contactant les serveurs de paiement Mobile Money ({paymentOption?.toUpperCase()})...</p>
                <p className="text-[10px] text-zinc-400">Veuillez autoriser et taper votre code secret sur votre téléphone pour valider l'opération...</p>
              </div>
            )}

            {paymentStep === "success" && (
              <div className="py-6 text-center space-y-4 animate-scaleIn">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl">
                  ✓
                </div>
                <div>
                  <h4 className="text-base font-black text-white uppercase tracking-tight">Félicitations, Bienvenue Elite !</h4>
                  <p className="text-xs text-zinc-400 mt-1">Votre badge Gold Gombo et votre accès illimité aux statistiques poussées ont été activés instantanément.</p>
                </div>
                <button
                  onClick={() => {
                    setPaymentOption(null);
                    onBack();
                  }}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold uppercase text-[10px] px-6 py-2 rounded-xl hover:text-white"
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
