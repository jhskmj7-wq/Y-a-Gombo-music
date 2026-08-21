import React, { useState, useEffect, useRef } from "react";
import { 
  Heart, Coffee, Music, Rocket, Gem, CheckCircle2, 
  ArrowLeft, Users, Sparkles, Coins, ShieldCheck, Eye, EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, addDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { UserProfile } from "../types";
import { recordWalletTransaction } from "../lib/financial";
import { safeStringify } from "../lib/jsonUtils";
import { useWalletSecurity } from "../context/WalletSecurityContext";

interface AfrigomboBuildersProps {
  currentUser?: UserProfile | null;
  onBack?: () => void;
  audioSynth?: any;
}

export interface ContributionOption {
  id: string;
  title: string;
  icon: any;
  emoji: string;
  description: string;
  suggestedAmount: number;
  isCustom?: boolean;
}

const CONTRIBUTION_OPTIONS: ContributionOption[] = [
  {
    id: "coffee",
    title: "Offrir un Café",
    icon: Coffee,
    emoji: "☕",
    description: "Un soutien simple et symbolique pour encourager l'équipe au quotidien.",
    suggestedAmount: 1000
  },
  {
    id: "feature",
    title: "Soutenir une fonctionnalité",
    icon: Music,
    emoji: "🎵",
    description: "Financez directement le développement d'outils audio, de séquestre ou de distribution.",
    suggestedAmount: 5000
  },
  {
    id: "premium_builder",
    title: "Devenir Bâtisseur Premium",
    icon: Rocket,
    emoji: "🚀",
    description: "Soutenez la croissance et le déploiement d'AFRIGOMBO ELITE à grande échelle.",
    suggestedAmount: 25000
  },
  {
    id: "custom",
    title: "Contribution libre",
    icon: Gem,
    emoji: "💎",
    description: "Choisissez librement le montant avec lequel vous souhaitez contribuer.",
    suggestedAmount: 10000,
    isCustom: true
  }
];

export default function AfrigomboBuilders({ currentUser, onBack, audioSynth }: AfrigomboBuildersProps) {
  const { formatWalletBalance, isBalanceHidden, toggleBalanceWithPin } = useWalletSecurity();
  const [stats, setStats] = useState({
    buildersCount: 0,
    totalContributions: 0,
    featuresFunded: 0,
    latestImprovement: "Optimisation du Séquestre & Player Hi-Fi"
  });

  const [selectedOption, setSelectedOption] = useState<ContributionOption | null>(null);
  const [amount, setAmount] = useState<number>(1000);
  const [customAmountStr, setCustomAmountStr] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [isInsufficientBalanceModalOpen, setIsInsufficientBalanceModalOpen] = useState<boolean>(false);
  const [insufficientBalanceDetails, setInsufficientBalanceDetails] = useState<{ current: number; required: number; missing: number } | null>(null);

  const section2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedOption || showSuccess || isInsufficientBalanceModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [selectedOption, showSuccess, isInsufficientBalanceModalOpen]);

  // Firestore Realtime Stats from `supportContributions`
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "supportContributions"), (snap) => {
      let total = 0;
      const uids = new Set<string>();
      let latestDocTime = "";
      let latestDocText = "Optimisation du Séquestre & Player Hi-Fi";

      snap.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.montant && !isNaN(Number(d.montant))) {
          total += Number(d.montant);
        }
        if (d.uid) {
          uids.add(d.uid);
        }
        if (d.createdAt && d.createdAt > latestDocTime) {
          latestDocTime = d.createdAt;
          if (d.typeContribution) {
            latestDocText = `Soutien : ${d.typeContribution}`;
          }
        }
      });

      setStats({
        buildersCount: uids.size,
        totalContributions: total,
        featuresFunded: snap.size > 0 ? Math.max(1, Math.floor(snap.size / 2)) : 0,
        latestImprovement: latestDocText
      });
    });

    return () => unsub();
  }, []);

  const handleSelectContribution = (option: ContributionOption) => {
    setSelectedOption(option);
    setAmount(option.suggestedAmount);
    setCustomAmountStr(option.suggestedAmount.toString());
  };

  const handleConfirmContribution = async () => {
    const finalAmount = selectedOption?.isCustom ? parseInt(customAmountStr) : amount;
    if (!finalAmount || finalAmount <= 0 || processing || !selectedOption) return;

    if (!currentUser?.uid && !currentUser?.id) {
      alert("Veuillez vous connecter pour faire une contribution.");
      return;
    }

    setProcessing(true);
    try {
      const userUid = currentUser?.uid || currentUser?.id || "anonyme";
      const userName = currentUser?.name || currentUser?.displayName || currentUser?.artisticName || "Bâtisseur";

      // Fetch live wallet balance
      const userRef = doc(db, "users", userUid);
      const userSnap = await getDoc(userRef);
      let balance = 0;
      if (userSnap.exists()) {
        const uData = userSnap.data();
        balance = uData?.wallet?.soldeDisponible ?? 0;
      } else {
        balance = currentUser?.wallet?.soldeDisponible ?? 0;
      }

      if (balance >= finalAmount) {
        // Sufficient balance
        const newSolde = balance - finalAmount;
        await setDoc(userRef, {
          wallet: {
            soldeDisponible: newSolde
          }
        }, { merge: true });

        // Record transaction
        await recordWalletTransaction({
          userId: userUid,
          userName: userName,
          type: "debit_publication",
          amount: finalAmount,
          status: "success",
          description: `Contribution Bâtisseurs : ${selectedOption.title}`
        });

        window.dispatchEvent(new CustomEvent("wallet_balance_updated"));

        const now = new Date().toISOString();
        const contributionData = {
          uid: userUid,
          displayName: isAnonymous ? "Bâtisseur Anonyme" : userName,
          montant: Number(finalAmount),
          typeContribution: `${selectedOption.emoji} ${selectedOption.title}`,
          statut: "COMPLETED",
          createdAt: now
        };

        // Save to `supportContributions` collection
        await addDoc(collection(db, "supportContributions"), contributionData);

        // Update user profile builder data
        const prevTotal = currentUser?.builderData?.totalAmount || 0;
        const newTotal = prevTotal + Number(finalAmount);

        await setDoc(userRef, {
          builderData: {
            totalAmount: newTotal,
            count: (currentUser?.builderData?.count || 0) + 1,
            joinYear: currentUser?.builderData?.joinYear || new Date().getFullYear(),
            isAnonymous
          },
          badges: Array.from(new Set([...(currentUser?.badges || []), "🏗️ Bâtisseur AFRIGOMBO ELITE"]))
        }, { merge: true });

        try { audioSynth?.playValidationSuccess(); } catch (e) {}

        setShowSuccess(true);
        setSelectedOption(null);
      } else {
        // Insufficient balance
        setInsufficientBalanceDetails({
          current: balance,
          required: finalAmount,
          missing: finalAmount - balance
        });
        setIsInsufficientBalanceModalOpen(true);
        setSelectedOption(null);
      }
    } catch (e) {
      console.error(e);
      alert("Une erreur est survenue lors de l'enregistrement de votre contribution.");
    } finally {
      setProcessing(false);
    }
  };

  const scrollToSection2 = () => {
    if (section2Ref.current) {
      section2Ref.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const optionIsCustom = selectedOption?.isCustom;

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 text-afri-text pb-24">
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-xs font-mono text-afri-text-sec hover:text-afri-text transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
      )}

      {/* HEADER: TITLE & SUBTITLE */}
      <div className="text-center space-y-1 mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Bêta Publique AFRIGOMBO ELITE</span>
        </div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-afri-text uppercase flex items-center justify-center gap-2 px-1">
          ❤️ Devenir Bâtisseur AFRIGOMBO ELITE
        </h1>
        <p className="text-[11px] sm:text-xs text-afri-text-sec font-medium max-w-lg mx-auto leading-normal italic">
          Ensemble, construisons la plus grande plateforme musicale africaine.
        </p>
      </div>

      <div className="space-y-4">
        {/* SECTION 1 — NOTRE MISSION */}
        <div className="bg-afri-bg-sec border border-[#D4AF37]/40 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden text-left space-y-3">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-afri-text uppercase tracking-tight">
              Pourquoi contribuer ?
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-afri-text-sec leading-relaxed font-medium">
            Chaque contribution permet de développer AFRIGOMBO ELITE afin d'offrir davantage d'opportunités aux artistes, musiciens, producteurs, techniciens, managers et créateurs africains.
          </p>
          <p className="text-xs sm:text-sm text-afri-text-sec leading-relaxed font-medium">
            Votre soutien participe directement à l'évolution de la plateforme.
          </p>

          <div className="pt-1">
            <button
              onClick={scrollToSection2}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-[#D4AF37] to-amber-400 text-black font-black text-[11px] uppercase tracking-wider rounded-2xl hover:opacity-95 transition-all shadow-lg shadow-[#D4AF37]/20 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Heart className="w-3.5 h-3.5 fill-black" />
              <span>Je contribue</span>
            </button>
          </div>
        </div>

        {/* SECTION 2 — CHOISIR SA CONTRIBUTION */}
        <div ref={section2Ref} className="space-y-3 text-left pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-black text-afri-text uppercase tracking-wider">
              Choisir sa contribution
            </h2>
            <span className="text-[9px] font-mono font-bold text-[#D4AF37] uppercase bg-amber-500/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/30 whitespace-nowrap">
              4 Formules
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CONTRIBUTION_OPTIONS.map((opt) => (
              <div
                key={opt.id}
                onClick={() => handleSelectContribution(opt)}
                className="bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37] rounded-3xl p-4.5 shadow-lg hover:shadow-xl transition-all cursor-pointer space-y-3 relative group overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-[#D4AF37]/30 flex items-center justify-center text-xl">
                    {opt.emoji}
                  </div>
                  <span className="text-xs font-mono font-black text-[#D4AF37] bg-afri-bg px-2.5 py-1 rounded-full border border-[#D4AF37]/30 whitespace-nowrap">
                    {opt.isCustom ? "Libre" : `${opt.suggestedAmount.toLocaleString()} FCFA`}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs sm:text-sm font-black text-afri-text group-hover:text-[#D4AF37] transition-colors">
                    {opt.title}
                  </h3>
                  <p className="text-[11px] text-afri-text-sec font-medium leading-relaxed pt-0.5">
                    {opt.description}
                  </p>
                </div>

                <button className="w-full py-2 bg-afri-bg group-hover:bg-[#D4AF37] group-hover:text-black border border-afri-border group-hover:border-[#D4AF37] text-afri-text font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2">
                  <Heart className="w-3 h-3" />
                  <span>Contribuer</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3 — IMPACT */}
        <div className="bg-afri-bg-sec border border-afri-border rounded-3xl p-5 sm:p-6 shadow-xl text-left space-y-4">
          <div className="flex items-center justify-between border-b border-afri-border/60 pb-2">
            <h2 className="text-sm sm:text-base font-black text-afri-text uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-[#D4AF37]" />
              <span>Votre impact</span>
            </h2>
            <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 whitespace-nowrap">
              ● Firestore En Direct
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-afri-bg border border-afri-border rounded-2xl space-y-1">
              <p className="text-[8.5px] font-mono text-afri-text-sec uppercase font-bold truncate">👥 Bâtisseurs</p>
              <p className="text-lg font-black text-afri-text font-mono">{stats.buildersCount}</p>
            </div>

            <div className="p-3 bg-afri-bg border border-afri-border rounded-2xl space-y-1">
              <p className="text-[8.5px] font-mono text-afri-text-sec uppercase font-bold truncate">❤️ Contributions</p>
              <p className="text-lg font-black text-[#D4AF37] font-mono">{stats.totalContributions.toLocaleString()} FCFA</p>
            </div>

            <div className="p-3 bg-afri-bg border border-afri-border rounded-2xl space-y-1">
              <p className="text-[8.5px] font-mono text-afri-text-sec uppercase font-bold truncate">🚀 Financements</p>
              <p className="text-lg font-black text-emerald-400 font-mono">{stats.featuresFunded}</p>
            </div>

            <div className="p-3 bg-afri-bg border border-afri-border rounded-2xl space-y-1">
              <p className="text-[8.5px] font-mono text-afri-text-sec uppercase font-bold truncate">🛠 Amélioration</p>
              <p className="text-xs font-bold text-afri-text truncate pt-0.5">{stats.latestImprovement}</p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTRIBUTION PAYMENT MODAL */}
      <AnimatePresence>
        {selectedOption && (
          <div 
            className="fixed inset-0 z-[999] bg-afri-bg/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedOption(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-afri-bg-sec border-2 border-[#D4AF37]/50 max-w-md w-full rounded-3xl p-6 space-y-5 shadow-2xl text-left relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-afri-border pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{selectedOption.emoji}</span>
                  <div>
                    <h3 className="text-sm font-black text-afri-text uppercase">{selectedOption.title}</h3>
                    <p className="text-[10px] font-mono text-afri-text-sec">Système de Paiement Bêta AFRIGOMBO ELITE</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOption(null)}
                  className="w-8 h-8 rounded-full bg-afri-bg border border-afri-border text-afri-text-sec hover:text-afri-text flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl space-y-1 mb-2">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-afri-text-sec">Solde Wallet :</span>
                      <button
                        type="button"
                        onClick={toggleBalanceWithPin}
                        title={isBalanceHidden ? "Révéler le solde (Code PIN requis)" : "Masquer le solde"}
                        className="p-1 rounded text-zinc-400 hover:text-[#D4AF37] hover:bg-zinc-800/60 transition cursor-pointer"
                      >
                        {isBalanceHidden ? <EyeOff className="w-3 h-3 text-[#D4AF37]" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                    <span className="font-mono font-bold text-afri-text">
                      {formatWalletBalance(currentUser?.wallet?.soldeDisponible ?? 0, "FCFA")}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold text-afri-text-sec uppercase tracking-wider block">
                    Montant de votre contribution (FCFA)
                  </label>
                  <div className="relative">
                    <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4AF37]" />
                    <input
                      type="number"
                      value={optionIsCustom ? customAmountStr : amount}
                      onChange={(e) => {
                        if (optionIsCustom) {
                          setCustomAmountStr(e.target.value);
                        } else {
                          setAmount(Number(e.target.value));
                        }
                      }}
                      disabled={!optionIsCustom}
                      placeholder="Ex: 5000"
                      className="w-full bg-afri-bg border border-[#D4AF37]/40 focus:border-[#D4AF37] rounded-2xl py-3 pl-11 pr-4 text-sm font-mono font-bold text-afri-text outline-none"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer group select-none py-1">
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${isAnonymous ? "bg-[#D4AF37] border-[#D4AF37]" : "bg-afri-bg border-afri-border"}`}>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                    />
                    {isAnonymous && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                  </div>
                  <span className="text-xs font-medium text-afri-text-sec group-hover:text-afri-text">Faire un don anonyme</span>
                </label>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleConfirmContribution}
                  disabled={processing || (optionIsCustom && (!customAmountStr || parseInt(customAmountStr) <= 0))}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-[#D4AF37] to-amber-400 hover:opacity-95 text-black font-black uppercase tracking-wider rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs active:scale-95"
                >
                  {processing ? (
                    <span>Traitement de la contribution...</span>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 fill-black" />
                      <span>Confirmer ma contribution ({(optionIsCustom ? parseInt(customAmountStr) || 0 : amount).toLocaleString()} FCFA)</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUCCESS CONFIRMATION MODAL */}
      <AnimatePresence>
        {showSuccess && (
          <div 
            className="fixed inset-0 z-[999] bg-afri-bg/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-afri-bg-sec border-2 border-emerald-500/50 max-w-sm w-full rounded-3xl p-6 text-center space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setShowSuccess(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-afri-bg border border-afri-border text-afri-text-sec hover:text-afri-text flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-afri-text uppercase">Gratitude Infinie !</h3>
              <p className="text-xs text-afri-text-sec leading-relaxed">
                Votre contribution a été enregistrée avec succès. Merci de bâtir l'avenir de la musique africaine avec AFRIGOMBO ELITE.
              </p>
              <button
                onClick={() => setShowSuccess(false)}
                className="w-full py-3 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer active:scale-95 shadow-md"
              >
                Fermer
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INSUFFICIENT FUNDS MODAL */}
      <AnimatePresence>
        {isInsufficientBalanceModalOpen && insufficientBalanceDetails && (
          <div 
            className="fixed inset-0 z-[999] bg-afri-bg/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsInsufficientBalanceModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-afri-bg-sec border-2 border-red-500/30 max-w-sm w-full rounded-3xl p-6 space-y-5 shadow-2xl relative"
            >
              <button
                onClick={() => setIsInsufficientBalanceModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-afri-bg border border-afri-border text-afri-text-sec hover:text-afri-text flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
              
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-afri-text uppercase tracking-wider">Solde Insuffisant</h3>
                <p className="text-xs text-afri-text-sec">
                  Votre solde Wallet est insuffisant pour finaliser cette contribution.
                </p>
              </div>

              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-afri-text-sec">Montant requis</span>
                  <span className="font-mono font-bold text-afri-text">{insufficientBalanceDetails.required.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-afri-text-sec">Solde actuel</span>
                  <span className="font-mono font-bold text-red-400">{insufficientBalanceDetails.current.toLocaleString()} FCFA</span>
                </div>
                <div className="pt-2 mt-2 border-t border-red-500/20 flex justify-between">
                  <span className="text-afri-text-sec font-bold">Montant manquant</span>
                  <span className="font-mono font-bold text-[#D4AF37]">{insufficientBalanceDetails.missing.toLocaleString()} FCFA</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("afrigombo_suggested_deposit_amount", String(insufficientBalanceDetails.missing));
                    localStorage.setItem(
                      "afrigombo_pending_purchase",
                      safeStringify({
                        type: "builder_contribution",
                        amount: insufficientBalanceDetails.required,
                        title: `Contribution Bâtisseurs`
                      })
                    );
                    setIsInsufficientBalanceModalOpen(false);
                    window.dispatchEvent(new CustomEvent("open_wallet_deposit"));
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-afri-gold to-amber-500 text-black font-black uppercase tracking-wider rounded-xl hover:brightness-110 transition-all text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Coins className="w-4 h-4" />
                  Recharger mon Wallet
                </button>
                <button
                  type="button"
                  onClick={() => setIsInsufficientBalanceModalOpen(false)}
                  className="w-full py-3 bg-afri-bg border border-afri-border text-afri-text font-black uppercase tracking-wider rounded-xl hover:bg-afri-border transition-all text-xs cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
