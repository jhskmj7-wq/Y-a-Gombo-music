import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Zap, Flame, MapPin, Compass, Sparkles, Check, 
  AlertCircle, Wallet, CheckCircle2, ShieldCheck, X, Clock, HelpCircle
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { PremiumEngine } from "../lib/premiumEngine";
import { PaymentEngine } from "../lib/paymentEngine";
import { InsufficientBalanceModal } from "./wallet/InsufficientBalanceModal";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, setDoc, addDoc, collection } from "firebase/firestore";

interface GomboBoostManagerProps {
  isOpen: boolean;
  onClose: () => void;
  // Type can be 'gombo', 'candidature', or 'profile'
  activeItem: { id: string; title?: string; type: "gombo" | "candidature" | "profile" } | null;
  currentUserProfile: any;
  onSuccess?: () => void;
  addToTerminal?: (msg: string) => void;
}

export default function GomboBoostManager({
  isOpen,
  onClose,
  activeItem,
  currentUserProfile,
  onSuccess,
  addToTerminal
}: GomboBoostManagerProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const isPremium = PremiumEngine.isPremium(currentUserProfile);

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [step, setStep] = useState<"options" | "confirm" | "success">("options");
  const [showInsufficientModal, setShowInsufficientModal] = useState<boolean>(false);

  // Selection state for publication boost
  const [selectedPubOption, setSelectedPubOption] = useState<string>("booster");
  
  // Selection state for profile boost duration
  const [selectedProfileDuration, setSelectedProfileDuration] = useState<number>(24); // 24, 72 (3d), 168 (7d)

  // Fetch current wallet balance in real-time
  useEffect(() => {
    if (isOpen && currentUserProfile?.uid) {
      const fetchBalance = async () => {
        try {
          const userRef = doc(db, "users", currentUserProfile.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            const bal = data.wallet?.soldeDisponible ?? data.walletBalance ?? 0;
            setWalletBalance(bal);
          }
        } catch (err) {
          console.error("Error fetching wallet balance:", err);
        }
      };
      fetchBalance();
      // Reset view
      setStep("options");
      setErrorMsg(null);
    }
  }, [isOpen, currentUserProfile]);

  if (!isOpen || !activeItem) return null;

  // Pricing configuration
  const pubOptions = [
    {
      id: "booster",
      title: "🚀 Booster la publication",
      description: "Apparaît instantanément en tête avec la mention exclusive '🚨 URGENT'.",
      priceStandard: 500,
      pricePremium: 300,
      durationHours: 48,
      icon: Zap,
      colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/30"
    },
    {
      id: "tendance",
      title: "🔥 Mettre en tendance",
      description: "Propulse la publication dans l'algorithme sous le tag brillant 'Mise en avant'.",
      priceStandard: 500,
      pricePremium: 350,
      durationHours: 24,
      icon: Flame,
      colorClass: "text-red-500 bg-red-500/10 border-red-500/30"
    },
    {
      id: "locale",
      title: "⭐ Mise en avant locale",
      description: "Cible en priorité les utilisateurs de votre commune de résidence.",
      priceStandard: 400,
      pricePremium: 250,
      durationHours: 72,
      icon: Sparkles,
      colorClass: "text-purple-500 bg-purple-500/10 border-purple-500/30"
    },
    {
      id: "pres_de_moi",
      title: "📍 Priorité \"Près de moi\"",
      description: "Positionne votre publication en tête du radar et des recherches géolocalisées.",
      priceStandard: 300,
      pricePremium: 200,
      durationHours: 48,
      icon: MapPin,
      colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30"
    }
  ];

  const profileOptions = [
    {
      duration: 24,
      label: "⚡ 24 Heures",
      description: "Idéal pour décrocher un gombo ce week-end",
      priceStandard: 500,
      pricePremium: 300
    },
    {
      duration: 72,
      label: "🔥 3 Jours",
      description: "Pour une visibilité soutenue en milieu de semaine",
      priceStandard: 1200,
      pricePremium: 750
    },
    {
      duration: 168,
      label: "👑 7 Jours (Premium)",
      description: "Recommandé pour un impact maximal de longue durée",
      priceStandard: 2500,
      pricePremium: 1500
    }
  ];

  // Calculate prices based on user active profile and selection
  let finalPrice = 0;
  let standardPrice = 0;
  let savings = 0;
  let selectedTitle = "";
  let selectedDurationText = "";

  if (activeItem.type === "profile") {
    const selectedOpt = profileOptions.find(o => o.duration === selectedProfileDuration)!;
    standardPrice = selectedOpt.priceStandard;
    finalPrice = isPremium ? selectedOpt.pricePremium : selectedOpt.priceStandard;
    savings = standardPrice - finalPrice;
    selectedTitle = "⭐ Booster mon profil";
    selectedDurationText = selectedProfileDuration === 24 ? "24 Heures" : `${selectedProfileDuration / 24} Jours`;
  } else {
    const selectedOpt = pubOptions.find(o => o.id === selectedPubOption)!;
    standardPrice = selectedOpt.priceStandard;
    finalPrice = isPremium ? selectedOpt.pricePremium : selectedOpt.priceStandard;
    savings = standardPrice - finalPrice;
    selectedTitle = selectedOpt.title;
    selectedDurationText = `${selectedOpt.durationHours} Heures`;
  }

  const handlePayAndBoost = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const uid = currentUserProfile.uid;
      const boostDescription = activeItem.type === "profile" 
        ? `Boost Profil d'Artiste (${selectedDurationText})`
        : `Boost Publication: ${selectedTitle} (${selectedDurationText})`;

      const payRes = await PaymentEngine.processPayment({
        userId: uid,
        userName: currentUserProfile.artistName || currentUserProfile.firstName || "Membre Gombo",
        amount: finalPrice,
        module: activeItem.type === "profile" ? "Boost Profil" : "Boost Publication",
        reason: boostDescription,
        metadata: {
          itemId: activeItem.id,
          itemType: activeItem.type,
          boostType: selectedPubOption
        }
      });

      if (!payRes.success) {
        if (payRes.insufficientBalance) {
          setShowInsufficientModal(true);
        } else {
          setErrorMsg(payRes.error || "Erreur lors du paiement par Wallet.");
        }
        setLoading(false);
        return;
      }

      setWalletBalance(payRes.balanceAfter);

      const now = new Date();
      let expiresAt = new Date();

      if (activeItem.type === "profile") {
        expiresAt.setHours(expiresAt.getHours() + selectedProfileDuration);
      } else {
        const hours = pubOptions.find(o => o.id === selectedPubOption)!.durationHours;
        expiresAt.setHours(expiresAt.getHours() + hours);
      }

      const expiresAtIso = expiresAt.toISOString();
      const userRef = doc(db, "users", uid);

      // 3. Write inside `boosts/` collection
      const boostRef = doc(collection(db, "boosts"));
      await setDoc(boostRef, {
        id: boostRef.id,
        userId: uid,
        itemId: activeItem.id,
        itemType: activeItem.type,
        boostType: activeItem.type === "profile" ? "profile" : selectedPubOption,
        durationHours: activeItem.type === "profile" ? selectedProfileDuration : pubOptions.find(o => o.id === selectedPubOption)!.durationHours,
        amount: finalPrice,
        createdAt: now.toISOString(),
        expiresAt: expiresAtIso,
        status: "active"
      });

      // 4. Update core content collections & specific feeds
      if (activeItem.type === "profile") {
        // Core user update
        await updateDoc(userRef, {
          profileBoosted: true,
          profileBoostedUntil: expiresAtIso,
          profileBoostPriority: 10,
          profileBoostType: "premium_spotlight"
        });

        // Store inside `featuredProfiles/`
        await setDoc(doc(db, "featuredProfiles", uid), {
          userId: uid,
          artistName: currentUserProfile.artistName || "",
          commune: currentUserProfile.commune || "",
          role: currentUserProfile.role || "musicien",
          avatarUrl: currentUserProfile.avatarUrl || currentUserProfile.photoURL || "",
          featuredUntil: expiresAtIso,
          priority: 10,
          createdAt: now.toISOString()
        });

      } else {
        // It's a publication boost (gombo / candidature)
        const collectionName = activeItem.type === "candidature" ? "applications" : "gombos";
        const docRef = doc(db, collectionName, activeItem.id);

        let updateFields: any = {
          boosted: true,
          boostedUntil: expiresAtIso,
          boostType: selectedPubOption
        };

        if (selectedPubOption === "booster") {
          updateFields.isUrgent = true;
          updateFields.urgentUntil = expiresAtIso;
          updateFields.priority = 10;
        } else if (selectedPubOption === "tendance") {
          updateFields.featured = true;
          updateFields.featuredUntil = expiresAtIso;
          updateFields.priority = 10;

          // Add to featuredPosts collection
          await setDoc(doc(db, "featuredPosts", activeItem.id), {
            postId: activeItem.id,
            title: activeItem.title || "",
            featuredUntil: expiresAtIso,
            priority: 10,
            type: activeItem.type,
            createdAt: now.toISOString()
          });

        } else if (selectedPubOption === "locale") {
          updateFields.localFeatured = true;
          updateFields.localFeaturedUntil = expiresAtIso;
          updateFields.priority = 8;
        } else if (selectedPubOption === "pres_de_moi") {
          updateFields.nearMePriority = true;
          updateFields.nearMePriorityUntil = expiresAtIso;
          updateFields.priority = 9;
        }

        await updateDoc(docRef, updateFields);
      }

      // Add user notification in Firestore
      await addDoc(collection(db, "notifications"), {
        userId: uid,
        title: "⚡ Boost Activé avec Succès !",
        message: `Félicitations, le boost "${selectedTitle}" a été activé pour votre ${activeItem.type === "profile" ? "profil" : "publication"} pour une durée de ${selectedDurationText}.`,
        type: "payment_received",
        createdAt: now.toISOString(),
        isRead: false
      });

      // Custom wallet update trigger for live interface update
      window.dispatchEvent(new CustomEvent("wallet_balance_updated"));

      if (addToTerminal) {
        addToTerminal(`[BOOST] Option "${selectedTitle}" activée avec succès pour l'élément ID : ${activeItem.id}`);
      }

      setStep("success");
      if (onSuccess) {
        onSuccess();
      }
    } catch (e: any) {
      console.error("Error applying boost:", e);
      setErrorMsg("Une erreur s'est produite lors de l'activation du boost. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const currentThemeClasses = isLight 
    ? "bg-[#FDFBF7] text-gray-900 border-[#D4AF37]/40 shadow-xl" 
    : "bg-[#111111] text-[#E5E5E5] border-amber-500/20 shadow-2xl";

  const cardThemeClasses = isLight
    ? "bg-stone-50/80 border-stone-200/60 hover:bg-stone-100 hover:border-[#D4AF37]/50"
    : "bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-800 hover:border-amber-500/35";

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className={`w-full max-w-lg rounded-3xl border p-5 sm:p-6 overflow-hidden relative ${currentThemeClasses} animate-slideUp`}>
        {/* Absolute design accents */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#D4AF37]/10 blur-3xl rounded-full pointer-events-none" />
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200/50 dark:border-zinc-800/60 pb-3.5 relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚡</span>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#D4AF37]">
                {activeItem.type === "profile" ? "⭐ Booster mon Profil" : "🚀 Propulser ma publication"}
              </h2>
              <p className="text-[10px] sm:text-xs text-stone-500 dark:text-zinc-400 font-mono">
                {activeItem.type === "profile" ? "Visibilité maximale auprès des recruteurs" : `Annonce : "${activeItem.title || "Gombo"}"`}
              </p>
            </div>
          </div>
          <button 
            disabled={loading}
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-stone-100 dark:bg-zinc-900 hover:bg-[#D4AF37]/20 border border-stone-200 dark:border-zinc-800 cursor-pointer active:scale-95 transition-all"
          >
            <X className="w-4 h-4 text-stone-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Content steps */}
        <AnimatePresence mode="wait">
          {step === "options" && (
            <motion.div 
              key="options"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4 pt-4 relative z-10"
            >
              {/* Wallet Info Banner */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs text-stone-600 dark:text-zinc-300 font-sans font-semibold">Votre Solde Wallet :</span>
                </div>
                <span className="text-sm font-black font-mono text-[#D4AF37]">
                  {walletBalance.toLocaleString()} FCFA
                </span>
              </div>

              {/* Standard vs Premium banner info */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                isPremium 
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                  : "bg-amber-500/5 border-amber-500/15 text-amber-700 dark:text-amber-400"
              }`}>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs font-semibold">
                    {isPremium ? "💎 Avantage Adhérent Premium Actif !" : "💡 Profitez de -40% de réduction en devenant Premium"}
                  </span>
                </div>
                {!isPremium && (
                  <span className="text-[9px] font-mono uppercase bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-black">
                    -40% Réduc
                  </span>
                )}
              </div>

              {/* Options body */}
              {activeItem.type === "profile" ? (
                // PROFILE BOOST CONFIGURATIONS
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] block font-bold">Options de durée :</span>
                  {profileOptions.map((opt) => {
                    const price = isPremium ? opt.pricePremium : opt.priceStandard;
                    const isSelected = selectedProfileDuration === opt.duration;
                    
                    return (
                      <button
                        key={opt.duration}
                        type="button"
                        onClick={() => setSelectedProfileDuration(opt.duration)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                          isSelected 
                            ? "bg-[#D4AF37]/10 border-[#D4AF37] scale-[1.01]" 
                            : cardThemeClasses
                        }`}
                      >
                        <div className="space-y-0.5 max-w-[70%]">
                          <strong className={`text-xs block font-black uppercase ${isSelected ? "text-[#D4AF37]" : "text-stone-800 dark:text-zinc-200"}`}>
                            {opt.label}
                          </strong>
                          <span className="text-[10px] text-stone-500 dark:text-zinc-400 block font-sans">
                            {opt.description}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-black font-mono text-[#D4AF37] bg-black/25 px-2.5 py-1 rounded-xl border border-stone-200/10 dark:border-zinc-800">
                            {price.toLocaleString()} F
                          </div>
                          {isPremium && (
                            <span className="text-[8px] text-stone-400 dark:text-zinc-500 line-through font-mono block mt-1">
                              {opt.priceStandard} F
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                // PUBLICATION BOOST CHOICES
                <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1 no-scrollbar">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] block font-bold">Choisissez votre boost :</span>
                  {pubOptions.map((opt) => {
                    const price = isPremium ? opt.pricePremium : opt.priceStandard;
                    const isSelected = selectedPubOption === opt.id;
                    const Icon = opt.icon;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedPubOption(opt.id)}
                        className={`w-full flex items-start gap-3 p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                          isSelected 
                            ? "bg-[#D4AF37]/10 border-[#D4AF37] scale-[1.01]" 
                            : cardThemeClasses
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${opt.colorClass}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5 flex-1 max-w-[65%]">
                          <strong className={`text-xs block font-black uppercase ${isSelected ? "text-[#D4AF37]" : "text-stone-800 dark:text-zinc-200"}`}>
                            {opt.title}
                          </strong>
                          <p className="text-[9.5px] text-stone-500 dark:text-zinc-400 leading-normal font-sans">
                            {opt.description}
                          </p>
                          <span className="text-[8px] font-mono text-stone-400 dark:text-zinc-500 block">
                            ⌛ Durée : {opt.durationHours} Heures
                          </span>
                        </div>
                        <div className="text-right shrink-0 self-center">
                          <div className="text-xs font-black font-mono text-[#D4AF37] bg-black/20 px-2.5 py-1 rounded-xl border border-stone-200/10 dark:border-zinc-800">
                            {price.toLocaleString()} F
                          </div>
                          {isPremium && (
                            <span className="text-[8px] text-stone-400 dark:text-zinc-500 line-through font-mono block mt-1">
                              {opt.priceStandard} F
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Action */}
              <button
                type="button"
                onClick={() => setStep("confirm")}
                className="w-full py-3 bg-[#D4AF37] hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🚀 Continuer vers le paiement</span>
              </button>
            </motion.div>
          )}

          {step === "confirm" && (
            <motion.div 
              key="confirm"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4 pt-4 relative z-10"
            >
              <div className="text-center py-2">
                <span className="text-4xl">🧾</span>
                <h3 className="text-sm font-black uppercase text-[#D4AF37] tracking-wider mt-2">Récapitulatif de votre achat</h3>
              </div>

              {/* Receipt detail layout */}
              <div className="p-4 rounded-2xl bg-stone-50/50 dark:bg-zinc-900/40 border border-stone-200/40 dark:border-zinc-800/50 space-y-3 font-sans">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-500 dark:text-zinc-400">Prestation demandée</span>
                  <strong className="text-stone-800 dark:text-zinc-200 font-extrabold uppercase">{selectedTitle}</strong>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-500 dark:text-zinc-400">Durée du boost</span>
                  <strong className="text-stone-800 dark:text-zinc-200 font-bold">{selectedDurationText}</strong>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-500 dark:text-zinc-400">Tarif standard</span>
                  <span className="font-mono text-stone-500 dark:text-zinc-400">{standardPrice.toLocaleString()} FCFA</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Réduction Premium</span>
                    <span className="font-mono">- {savings.toLocaleString()} FCFA</span>
                  </div>
                )}
                <div className="border-t border-stone-200/50 dark:border-zinc-800/50 pt-2 flex justify-between items-center font-black">
                  <span className="text-xs uppercase text-[#D4AF37]">Montant à débiter</span>
                  <span className="text-base font-mono text-[#D4AF37]">{finalPrice.toLocaleString()} FCFA</span>
                </div>
              </div>

              {/* Error messages if any */}
              {errorMsg && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 dark:text-red-400 flex items-start gap-2.5 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-semibold">{errorMsg}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handlePayAndBoost}
                  className="w-full py-3 bg-[#D4AF37] hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>💰 Confirmer et débiter mon Wallet</span>
                  )}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setStep("options")}
                  className="w-full py-2.5 bg-stone-100 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 hover:bg-stone-200/50 hover:border-[#D4AF37]/40 text-stone-600 dark:text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  Retour
                </button>
              </div>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6 space-y-4 relative z-10"
            >
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-500 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black uppercase text-emerald-500">Boost Activé avec Succès !</h3>
                <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto font-sans leading-relaxed">
                  Votre {activeItem.type === "profile" ? "profil" : "publication"} a été propulsé(e) au sommet de l'affiche. Merci de faire confiance à AFRIGOMBO !
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-[#D4AF37] hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer inline-block mt-3"
              >
                Fermer
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <InsufficientBalanceModal
        isOpen={showInsufficientModal}
        onClose={() => setShowInsufficientModal(false)}
        onRecharge={() => {
          setShowInsufficientModal(false);
          onClose();
          window.dispatchEvent(new CustomEvent("open_wallet_recharge"));
        }}
        currentBalance={walletBalance}
        requiredAmount={finalPrice}
        moduleName={activeItem.type === "profile" ? "booster votre profil" : "booster votre publication"}
      />
    </div>
  );
}
