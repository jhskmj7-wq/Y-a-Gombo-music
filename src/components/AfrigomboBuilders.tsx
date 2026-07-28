import React, { useState, useEffect, useRef } from "react";
import { 
  Heart, Coffee, Music, Rocket, Gem, CheckCircle2, 
  ArrowLeft, Users, Sparkles, Coins, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../firebase";
import { collection, onSnapshot, addDoc, doc, setDoc } from "firebase/firestore";
import { UserProfile } from "../types";

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
    description: "Soutenez la croissance et le déploiement d'AFRIGOMBO à grande échelle.",
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

  const section2Ref = useRef<HTMLDivElement>(null);

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

    setProcessing(true);
    try {
      const now = new Date().toISOString();
      const userUid = currentUser?.uid || currentUser?.id || "anonyme";
      const userName = currentUser?.name || currentUser?.displayName || currentUser?.artisticName || "Bâtisseur";

      const contributionData = {
        uid: userUid,
        displayName: isAnonymous ? "Bâtisseur Anonyme" : userName,
        montant: Number(finalAmount),
        typeContribution: `${selectedOption.emoji} ${selectedOption.title}`,
        statut: "COMPLETED",
        createdAt: now
      };

      // 1. Save to `supportContributions` collection
      await addDoc(collection(db, "supportContributions"), contributionData);

      // 2. Update user profile builder data if authenticated
      if (userUid !== "anonyme") {
        const userRef = doc(db, "users", userUid);
        const prevTotal = currentUser?.builderData?.totalAmount || 0;
        const newTotal = prevTotal + Number(finalAmount);

        await setDoc(userRef, {
          builderData: {
            totalAmount: newTotal,
            count: (currentUser?.builderData?.count || 0) + 1,
            joinYear: currentUser?.builderData?.joinYear || new Date().getFullYear(),
            isAnonymous
          },
          badges: Array.from(new Set([...(currentUser?.badges || []), "🏗️ Bâtisseur AFRIGOMBO"]))
        }, { merge: true });
      }

      try { audioSynth?.playValidationSuccess(); } catch (e) {}

      setShowSuccess(true);
      setSelectedOption(null);
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
      <div className="text-center space-y-2 mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[11px] font-black uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Bêta Publique AFRIGOMBO</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-afri-text uppercase flex items-center justify-center gap-2">
          ❤️ Devenir Bâtisseur AFRIGOMBO
        </h1>
        <p className="text-xs sm:text-sm text-afri-text-sec font-medium max-w-lg mx-auto leading-relaxed italic">
          Ensemble, construisons la plus grande plateforme musicale africaine.
        </p>
      </div>

      <div className="space-y-6">
        {/* SECTION 1 — NOTRE MISSION */}
        <div className="bg-afri-bg-sec border border-[#D4AF37]/40 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden text-left space-y-4">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-afri-text uppercase tracking-tight">
              Pourquoi contribuer ?
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-afri-text-sec leading-relaxed font-medium">
            Chaque contribution permet de développer AFRIGOMBO afin d'offrir davantage d'opportunités aux artistes, musiciens, producteurs, techniciens, managers et créateurs africains.
          </p>
          <p className="text-xs sm:text-sm text-afri-text-sec leading-relaxed font-medium">
            Votre soutien participe directement à l'évolution de la plateforme.
          </p>

          <div className="pt-2">
            <button
              onClick={scrollToSection2}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 via-[#D4AF37] to-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-2xl hover:opacity-95 transition-all shadow-lg shadow-[#D4AF37]/20 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Heart className="w-4 h-4 fill-black" />
              <span>Je contribue</span>
            </button>
          </div>
        </div>

        {/* SECTION 2 — CHOISIR SA CONTRIBUTION */}
        <div ref={section2Ref} className="space-y-4 text-left pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-afri-text uppercase tracking-wider">
              Choisir sa contribution
            </h2>
            <span className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30">
              4 Formules
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CONTRIBUTION_OPTIONS.map((opt) => (
              <div
                key={opt.id}
                onClick={() => handleSelectContribution(opt)}
                className="bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37] rounded-3xl p-5 shadow-lg hover:shadow-xl transition-all cursor-pointer space-y-3 relative group overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-[#D4AF37]/30 flex items-center justify-center text-2xl">
                    {opt.emoji}
                  </div>
                  <span className="text-xs font-mono font-black text-[#D4AF37] bg-afri-bg px-3 py-1 rounded-full border border-[#D4AF37]/30">
                    {opt.isCustom ? "Libre" : `${opt.suggestedAmount.toLocaleString()} FCFA`}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-black text-afri-text group-hover:text-[#D4AF37] transition-colors">
                    {opt.title}
                  </h3>
                  <p className="text-xs text-afri-text-sec font-medium leading-relaxed pt-1">
                    {opt.description}
                  </p>
                </div>

                <button className="w-full py-2.5 bg-afri-bg group-hover:bg-[#D4AF37] group-hover:text-black border border-afri-border group-hover:border-[#D4AF37] text-afri-text font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2">
                  <Heart className="w-3.5 h-3.5" />
                  <span>Contribuer</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3 — IMPACT */}
        <div className="bg-afri-bg-sec border border-afri-border rounded-3xl p-6 sm:p-8 shadow-xl text-left space-y-5">
          <div className="flex items-center justify-between border-b border-afri-border/60 pb-3">
            <h2 className="text-base sm:text-lg font-black text-afri-text uppercase tracking-wider flex items-center gap-2">
              <Users className="w-5 h-5 text-[#D4AF37]" />
              <span>Votre impact</span>
            </h2>
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              ● Firestore En Direct
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-afri-bg border border-afri-border rounded-2xl space-y-1">
              <p className="text-[10px] font-mono text-afri-text-sec uppercase font-bold">👥 Nombre de Bâtisseurs</p>
              <p className="text-xl font-black text-afri-text font-mono">{stats.buildersCount}</p>
            </div>

            <div className="p-4 bg-afri-bg border border-afri-border rounded-2xl space-y-1">
              <p className="text-[10px] font-mono text-afri-text-sec uppercase font-bold">❤️ Contributions reçues</p>
              <p className="text-xl font-black text-[#D4AF37] font-mono">{stats.totalContributions.toLocaleString()} FCFA</p>
            </div>

            <div className="p-4 bg-afri-bg border border-afri-border rounded-2xl space-y-1">
              <p className="text-[10px] font-mono text-afri-text-sec uppercase font-bold">🚀 Fonctionnalités financées</p>
              <p className="text-xl font-black text-emerald-400 font-mono">{stats.featuresFunded}</p>
            </div>

            <div className="p-4 bg-afri-bg border border-afri-border rounded-2xl space-y-1">
              <p className="text-[10px] font-mono text-afri-text-sec uppercase font-bold">🛠 Dernière amélioration</p>
              <p className="text-xs font-bold text-afri-text truncate pt-1">{stats.latestImprovement}</p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTRIBUTION PAYMENT MODAL */}
      <AnimatePresence>
        {selectedOption && (
          <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-afri-bg-sec border-2 border-[#D4AF37]/50 max-w-md w-full rounded-3xl p-6 space-y-5 shadow-2xl text-left relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-afri-border pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{selectedOption.emoji}</span>
                  <div>
                    <h3 className="text-sm font-black text-afri-text uppercase">{selectedOption.title}</h3>
                    <p className="text-[10px] font-mono text-afri-text-sec">Système de Paiement Bêta AFRIGOMBO</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOption(null)}
                  className="w-8 h-8 rounded-full bg-afri-bg border border-afri-border text-afri-text-sec hover:text-afri-text flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
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
          <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-afri-bg-sec border-2 border-emerald-500/50 max-w-sm w-full rounded-3xl p-6 text-center space-y-4 shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-afri-text uppercase">Gratitude Infinie !</h3>
              <p className="text-xs text-afri-text-sec leading-relaxed">
                Votre contribution a été enregistrée avec succès. Merci de bâtir l'avenir de la musique africaine avec AFRIGOMBO.
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
    </div>
  );
}
