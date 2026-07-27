import React, { useState, useEffect } from "react";
import { 
  Heart, Sparkles, Shield, Crown, Globe,
  ArrowRight, Users, Check, Flame, Star, Trophy, ArrowLeft,
  Target, Award, HandHeart, Info, Compass, Building2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, getDoc, setDoc, addDoc } from "firebase/firestore";
import { UserProfile } from "../types";

interface AfrigomboBuildersProps {
  currentUser: UserProfile;
  onBack?: () => void;
  audioSynth?: any;
}

// TITRES HONORIFIQUES ET SYMBOLITIQUES (Strictly no medals / bronze / argent / or)
export interface HonorificTitle {
  id: string;
  label: string;
  description: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
  icon: string;
}

export const HONORIFIC_TITLES: Record<string, HonorificTitle> = {
  PARRAIN: {
    id: "parrain",
    label: "🏛️ Parrain du Temple",
    description: "Soutien majeur ou récurrent au Temple",
    badgeBg: "bg-amber-500/15",
    badgeColor: "text-[#D4AF37]",
    badgeBorder: "border-[#D4AF37]/40",
    icon: "🏛️"
  },
  BATISSEUR: {
    id: "batisseur",
    label: "🏗️ Bâtisseur",
    description: "Soutien régulier aux projets communautaires",
    badgeBg: "bg-emerald-500/15",
    badgeColor: "text-emerald-400",
    badgeBorder: "border-emerald-500/40",
    icon: "🏗️"
  },
  AMI: {
    id: "ami",
    label: "🤝 Ami du Temple",
    description: "Soutien ponctuel & geste communautaire",
    badgeBg: "bg-sky-500/15",
    badgeColor: "text-sky-400",
    badgeBorder: "border-sky-500/40",
    icon: "🤝"
  },
  SYMPATHISANT: {
    id: "sympathisant",
    label: "🙏 Sympathisant du Temple",
    description: "Membre engagé de la communauté",
    badgeBg: "bg-zinc-500/10",
    badgeColor: "text-zinc-400",
    badgeBorder: "border-zinc-500/30",
    icon: "🙏"
  }
};

export const DEFAULT_CHALLENGES = [
  {
    id: "defi-bourse-talents",
    title: "🎯 Défi Bourse Jeunes Talents",
    description: "Financement collectif de bourses de formation, masterclasses et soutien de scène pour les jeunes artistes émergents d'Abidjan.",
    target: 2000000,
    current: 1350000,
    contributors: 84,
    category: "FORMATION & BOURSES"
  },
  {
    id: "defi-studio-mobile",
    title: "🎙️ Défi Équipement Studio Communautaire",
    description: "Acquisition de matériel d'enregistrement pro (micros, cartes son) mis à disposition des artistes membres du Temple.",
    target: 5000000,
    current: 2800000,
    contributors: 142,
    category: "MATÉRIEL SCÈNE"
  },
  {
    id: "defi-caisse-solidarite",
    title: "🏥 Défi Caisse de Solidarité & Secours",
    description: "Fonds d'urgence solidaire pour venir en aide aux musiciens et professionnels de scène en situation critique de santé ou d'accident.",
    target: 1500000,
    current: 980000,
    contributors: 62,
    category: "ENTRAIDE & SANTÉ"
  }
];

export const getTitleForUser = (totalAmount: number, isMonthly: boolean, count: number): HonorificTitle => {
  if (isMonthly || totalAmount >= 50000) {
    return HONORIFIC_TITLES.PARRAIN;
  }
  if (count > 1 || totalAmount >= 10000) {
    return HONORIFIC_TITLES.BATISSEUR;
  }
  if (totalAmount > 0) {
    return HONORIFIC_TITLES.AMI;
  }
  return HONORIFIC_TITLES.SYMPATHISANT;
};

const PREDEFINED_AMOUNTS = [500, 1000, 2500, 5000, 10000, 25000];

export default function AfrigomboBuilders({ currentUser, onBack, audioSynth }: AfrigomboBuildersProps) {
  // Primary view default is "defis" as per prompt instructions (Mise en avant des Défis du Temple)
  const [activeTab, setActiveTab] = useState<"defis" | "soutenir" | "mur">("defis");
  const [amount, setAmount] = useState<number>(2500);
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [customAmountStr, setCustomAmountStr] = useState("");
  const [isMonthly, setIsMonthly] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>("defi-bourse-talents");
  const [processing, setProcessing] = useState(false);
  
  const [challenges, setChallenges] = useState<any[]>([]);
  const [buildersList, setBuildersList] = useState<any[]>([]);
  const [userBuilderData, setUserBuilderData] = useState<any>(currentUser.builderData || null);

  useEffect(() => {
    // 1. Fetch live challenges or fallback to defaults
    const unsubChallenges = onSnapshot(collection(db, "builder_challenges"), (snap) => {
      const list: any[] = [];
      snap.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
      
      if (list.length === 0) {
        setChallenges(DEFAULT_CHALLENGES);
      } else {
        // Merge defaults if not present
        const mergedMap = new Map();
        DEFAULT_CHALLENGES.forEach(def => mergedMap.set(def.id, def));
        list.forEach(c => mergedMap.set(c.id, c));
        setChallenges(Array.from(mergedMap.values()));
      }
    });

    // 2. Fetch live supports & aggregate for wall of honor
    const unsubBuilders = onSnapshot(collection(db, "builder_supports"), (snap) => {
      const list: any[] = [];
      snap.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
      
      const userMap = new Map();
      list.forEach(support => {
        if (!userMap.has(support.userId)) {
          userMap.set(support.userId, {
            userId: support.userId,
            userName: support.userName,
            isAnonymous: support.isAnonymous,
            totalAmount: 0,
            count: 0,
            isMonthly: false
          });
        }
        const u = userMap.get(support.userId);
        u.totalAmount += (support.amount || 0);
        u.count += 1;
        if (support.isMonthly) u.isMonthly = true;
        if (!u.isAnonymous && support.isAnonymous) u.isAnonymous = false;
      });

      const aggregated = Array.from(userMap.values())
        .filter(b => !b.isAnonymous)
        .sort((a, b) => b.totalAmount - a.totalAmount);
      
      setBuildersList(aggregated);
    });

    return () => {
      unsubChallenges();
      unsubBuilders();
    };
  }, []);

  // Calculate global community challenge total & target
  const globalCurrent = challenges.reduce((acc, c) => acc + (c.current || 0), 0);
  const globalTarget = challenges.reduce((acc, c) => acc + (c.target || 0), 0) || 1;
  const globalProgress = Math.min(100, Math.round((globalCurrent / globalTarget) * 100));

  const currentTitle = getTitleForUser(
    userBuilderData?.totalAmount || 0, 
    Boolean(userBuilderData?.isMonthly), 
    userBuilderData?.count || 0
  );

  const handleSupport = async () => {
    const finalAmount = isCustomAmount ? parseInt(customAmountStr) : amount;
    if (!finalAmount || finalAmount < 100 || processing) return;

    setProcessing(true);
    try {
      const now = new Date();
      const targetChallenge = challenges.find(c => c.id === selectedChallengeId) || DEFAULT_CHALLENGES[0];

      // Save support transaction
      await addDoc(collection(db, "builder_supports"), {
        userId: currentUser.uid || currentUser.id,
        userName: currentUser.name || currentUser.displayName || "Utilisateur",
        amount: finalAmount,
        challengeId: targetChallenge.id,
        challengeTitle: targetChallenge.title,
        isMonthly,
        isAnonymous,
        createdAt: now.toISOString()
      });

      // Update challenge in Firestore
      const challengeRef = doc(db, "builder_challenges", targetChallenge.id);
      const challengeSnap = await getDoc(challengeRef);
      if (challengeSnap.exists()) {
        const cData = challengeSnap.data();
        await updateDoc(challengeRef, {
          current: (cData.current || targetChallenge.current || 0) + finalAmount,
          contributors: (cData.contributors || targetChallenge.contributors || 0) + 1
        });
      } else {
        await setDoc(challengeRef, {
          title: targetChallenge.title,
          description: targetChallenge.description,
          target: targetChallenge.target,
          current: (targetChallenge.current || 0) + finalAmount,
          contributors: (targetChallenge.contributors || 0) + 1,
          createdAt: now.toISOString()
        });
      }

      const prevTotal = userBuilderData?.totalAmount || 0;
      const prevCount = userBuilderData?.count || 0;
      const newTotal = prevTotal + finalAmount;
      const newIsMonthly = isMonthly || Boolean(userBuilderData?.isMonthly);
      
      const newTitleObj = getTitleForUser(newTotal, newIsMonthly, prevCount + 1);

      const newBuilderData = {
        totalAmount: newTotal,
        count: prevCount + 1,
        joinYear: userBuilderData?.joinYear || now.getFullYear(),
        title: newTitleObj.label,
        isMonthly: newIsMonthly,
        isAnonymous
      };

      const userRef = doc(db, "users", (currentUser.uid || currentUser.id) as string);
      
      // Clean up old medals & old badges from global badges array
      const allOldAndNewBadges = [
        "👑 Grand Mécène", "💎 Gardien du Temple", "🥇 Protecteur", "🥈 Bâtisseur", "🥉 Ami d'AFRIGOMBO", "Sympathisant",
        HONORIFIC_TITLES.PARRAIN.label, HONORIFIC_TITLES.BATISSEUR.label, HONORIFIC_TITLES.AMI.label, HONORIFIC_TITLES.SYMPATHISANT.label
      ];
      
      const currentBadges = Array.isArray(currentUser.badges) ? currentUser.badges : [];
      const cleanBadges = currentBadges.filter((b: string) => !allOldAndNewBadges.includes(b));
      
      if (newTitleObj.id !== "sympathisant") {
        cleanBadges.push(newTitleObj.label);
      }

      await setDoc(userRef, { 
        builderData: newBuilderData,
        badges: cleanBadges
      }, { merge: true });

      setUserBuilderData(newBuilderData);

      try { audioSynth?.playValidationSuccess(); } catch(e) {}
      alert(`Gratitude ! Votre soutien de ${finalAmount.toLocaleString()} FCFA a bien été attribué au "${targetChallenge.title}". Le titre "${newTitleObj.label}" figure désormais sur votre profil.`);
      
      setAmount(2500);
      setIsCustomAmount(false);
      setCustomAmountStr("");
      setActiveTab("defis");
      
    } catch (e) {
      console.error(e);
      alert("Une erreur est survenue lors de l'enregistrement de votre soutien.");
    } finally {
      setProcessing(false);
    }
  };

  const handleContributeToSpecificChallenge = (challengeId: string) => {
    setSelectedChallengeId(challengeId);
    setActiveTab("soutenir");
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 text-afri-text pb-32">
      
      {/* Optional Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-xs font-mono text-afri-text-sec hover:text-afri-text transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Retour au Dashboard
        </button>
      )}

      {/* Hero Header - Community Challenges Focus */}
      <div className="relative pt-6 pb-8 px-4 sm:px-6 overflow-hidden border-2 border-[#D4AF37]/40 bg-gradient-to-r from-afri-bg-sec via-afri-bg to-afri-bg-sec rounded-3xl mt-2 mb-6 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D4AF37]/20 via-transparent to-transparent opacity-80 pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto text-center space-y-3">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-16 h-16 mx-auto bg-gradient-to-br from-[#D4AF37]/30 to-afri-bg border-2 border-[#D4AF37]/70 rounded-2xl flex items-center justify-center transform rotate-2 shadow-xl shadow-[#D4AF37]/20"
          >
            <Building2 className="w-8 h-8 text-[#D4AF37]" />
          </motion.div>
          
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-amber-200 to-[#D4AF37] uppercase">
            Défis du Temple & Bâtisseurs
          </h1>
          <p className="text-xs sm:text-sm text-afri-text-sec font-medium max-w-lg mx-auto leading-relaxed">
            Soutenez les missions collectives du Temple. Chaque contribution fait avancer les objectifs communautaires et vous attribue un titre honorifique.
          </p>

          {/* GLOBAL COMMUNITY ADVANCEMENT BAR */}
          <div className="bg-afri-bg/90 border border-[#D4AF37]/50 rounded-2xl p-4 shadow-xl text-left space-y-2 mt-4 backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs font-mono font-bold">
              <span className="text-afri-text flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#D4AF37] animate-pulse" /> Avancement Global des Défis
              </span>
              <span className="text-[#D4AF37] font-black">{globalProgress}% Atteint</span>
            </div>
            
            <div className="w-full h-3 bg-afri-bg-sec rounded-full overflow-hidden p-0.5 border border-[#D4AF37]/30">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${globalProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-amber-500 via-[#D4AF37] to-amber-300 rounded-full shadow-[0_0_12px_rgba(212,175,55,0.4)]"
              />
            </div>
            
            <div className="flex justify-between text-[10px] text-afri-text-sec font-mono">
              <span>{globalCurrent.toLocaleString()} FCFA collectés</span>
              <span>Objectif Global : {globalTarget.toLocaleString()} FCFA</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full space-y-5">
        
        {/* User Profile Mini-Dashboard with New Honorific Title */}
        <div className="bg-afri-bg-sec border border-afri-border rounded-3xl p-5 flex flex-col sm:flex-row items-center gap-4 shadow-lg">
          <div className={`w-14 h-14 rounded-2xl border-2 ${currentTitle.badgeBorder} ${currentTitle.badgeBg} flex items-center justify-center shrink-0 shadow-sm text-2xl`}>
            {currentTitle.icon}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h3 className="text-sm font-black text-afri-text">{currentUser.name || currentUser.displayName || "Membre de la Communauté"}</h3>
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${currentTitle.badgeBg} ${currentTitle.badgeColor} ${currentTitle.badgeBorder} border shadow-xs self-center sm:self-auto`}>
                {currentTitle.label}
              </div>
            </div>

            <p className="text-xs text-afri-text-sec font-mono">
              {currentTitle.description}
            </p>

            {userBuilderData?.totalAmount > 0 ? (
              <p className="text-[11px] text-afri-text-sec font-mono">
                Soutien depuis {userBuilderData.joinYear || new Date().getFullYear()} • {userBuilderData.count} contribution(s) • Total: <span className="text-[#D4AF37] font-bold">{userBuilderData.totalAmount.toLocaleString()} FCFA</span>
              </p>
            ) : (
              <p className="text-[11px] text-afri-text-sec font-mono">
                Participez à un défi communautaire pour recevoir votre titre honorifique sur votre profil.
              </p>
            )}
          </div>
        </div>

        {/* 📜 DISCLAIMER: STRICTLY SYMBOLIC / NO COMMERCIAL ADVANTAGE */}
        <div className="bg-gradient-to-r from-amber-500/10 via-afri-bg-sec to-afri-bg-sec border border-[#D4AF37]/30 rounded-2xl p-4 space-y-2 text-left">
          <div className="flex items-center gap-2 text-xs font-black text-[#D4AF37] uppercase tracking-wider">
            <Info className="w-4 h-4 shrink-0 text-[#D4AF37]" />
            <span>Engagements & Transparence Symbolique</span>
          </div>
          <p className="text-xs text-afri-text-sec leading-relaxed">
            Le soutien apporté aux Défis du Temple est un geste communautaire purement solidaire. 
            <strong className="text-afri-text"> Aucun privilège commercial, aucun avantage algorithmique ni aucune priorité d'attribution</strong> n'est accordé. 
            L'accomplissement d'un défi attribue uniquement le <strong className="text-[#D4AF37]">Titre Honorifique</strong> correspondant sur le profil du membre en signe de gratitude collective.
          </p>
        </div>

        {/* Navigation Tabs - HIGHLIGHTING DEFIS FIRST */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-afri-border pb-3">
          <button
            onClick={() => setActiveTab("defis")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${activeTab === "defis" ? "bg-[#D4AF37] text-black shadow-lg font-black" : "bg-afri-bg-sec text-afri-text-sec border border-afri-border hover:text-afri-text"}`}
          >
            <Target className="w-4 h-4" /> Défis du Temple (Missions)
          </button>

          <button
            onClick={() => setActiveTab("soutenir")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${activeTab === "soutenir" ? "bg-[#D4AF37] text-black shadow-lg font-black" : "bg-afri-bg-sec text-afri-text-sec border border-afri-border hover:text-afri-text"}`}
          >
            <HandHeart className="w-4 h-4" /> Contribuer / Soutenir
          </button>

          <button
            onClick={() => setActiveTab("mur")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${activeTab === "mur" ? "bg-[#D4AF37] text-black shadow-lg font-black" : "bg-afri-bg-sec text-afri-text-sec border border-afri-border hover:text-afri-text"}`}
          >
            <Award className="w-4 h-4" /> Titres & Mur d'Honneur
          </button>
        </div>

        {/* TAB 1: DÉFIS DU TEMPLE (MISSIONS COLLECTIVES) */}
        <AnimatePresence mode="wait">
          {activeTab === "defis" && (
            <motion.div
              key="defis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 text-left"
            >
              <div className="flex justify-between items-center mb-1">
                <div>
                  <h2 className="text-sm font-black text-afri-text uppercase tracking-wider">Missions Collectives de la Communauté</h2>
                  <p className="text-xs text-afri-text-sec">Participez directement aux objectifs de développement solidaire.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {challenges.map(challenge => {
                  const progress = Math.min(100, Math.round((challenge.current / challenge.target) * 100));
                  return (
                    <div 
                      key={challenge.id} 
                      className="bg-afri-bg-sec border border-[#D4AF37]/30 hover:border-[#D4AF37] transition-all rounded-3xl p-5 shadow-lg space-y-4 relative overflow-hidden group"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 border-b border-afri-border pb-3">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/10 text-[#D4AF37] border border-[#D4AF37]/30 font-black uppercase tracking-wider">
                            {challenge.category || "MISSION COLLECTIVE"}
                          </span>
                          <h3 className="text-base font-black text-afri-text pt-1">{challenge.title}</h3>
                          <p className="text-xs text-afri-text-sec leading-relaxed">{challenge.description}</p>
                        </div>

                        <div className="shrink-0 bg-afri-bg px-3 py-1.5 rounded-2xl border border-afri-border flex items-center gap-2 self-start sm:self-auto">
                          <Users className="w-4 h-4 text-[#D4AF37]" />
                          <div className="text-[10px] font-mono font-bold">
                            <span className="text-[#D4AF37]">{challenge.contributors || 0}</span> contributeurs
                          </div>
                        </div>
                      </div>

                      {/* Challenge Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-[#D4AF37] font-black">{challenge.current.toLocaleString()} FCFA récoltés</span>
                          <span className="text-afri-text-sec font-bold">Objectif : {challenge.target.toLocaleString()} FCFA</span>
                        </div>

                        <div className="w-full h-3 bg-afri-bg rounded-full overflow-hidden p-0.5 border border-afri-border">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-amber-500 to-[#D4AF37] rounded-full shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                          />
                        </div>

                        <div className="flex justify-between items-center pt-1 text-[10px] font-mono">
                          <span className="text-[#D4AF37] font-black">{progress}% accompli</span>
                          <span className="text-afri-text-sec">Reste : {Math.max(0, challenge.target - challenge.current).toLocaleString()} FCFA</span>
                        </div>
                      </div>

                      {/* Contribution Action */}
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => handleContributeToSpecificChallenge(challenge.id)}
                          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-[#D4AF37] text-black font-sans font-black text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-md flex items-center gap-2 cursor-pointer"
                        >
                          <HandHeart className="w-4 h-4" /> Contribuer à ce défi
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* TAB 2: FORMULAIRE DE SOUTIEN / CONTRIBUTION */}
          {activeTab === "soutenir" && (
            <motion.div
              key="soutenir"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 text-left"
            >
              <div className="bg-afri-bg-sec border border-afri-border rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
                <div>
                  <h2 className="text-base font-black text-afri-text mb-1">Attribuer votre contribution</h2>
                  <p className="text-xs text-afri-text-sec">Choisissez le défi que vous souhaitez faire progresser.</p>
                </div>

                {/* Challenge Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider block">
                    Défi Cible :
                  </label>
                  <select
                    value={selectedChallengeId}
                    onChange={(e) => setSelectedChallengeId(e.target.value)}
                    className="w-full bg-afri-bg border border-[#D4AF37]/50 focus:border-[#D4AF37] rounded-2xl px-4 py-3 text-xs font-mono text-afri-text outline-none cursor-pointer"
                  >
                    {challenges.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.current.toLocaleString()} / {c.target.toLocaleString()} FCFA)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount Selection */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-mono font-bold text-afri-text uppercase tracking-wider block">
                    Montant du soutien (FCFA) :
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PREDEFINED_AMOUNTS.map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => { setAmount(amt); setIsCustomAmount(false); }}
                        className={`py-3 rounded-2xl border transition-all font-mono text-xs font-bold cursor-pointer ${
                          !isCustomAmount && amount === amt 
                            ? "border-[#D4AF37] bg-amber-500/15 text-[#D4AF37] shadow-md" 
                            : "border-afri-border hover:border-[#D4AF37]/50 bg-afri-bg text-afri-text"
                        }`}
                      >
                        {amt.toLocaleString()} FCFA
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setIsCustomAmount(true)}
                      className={`py-3 rounded-2xl border transition-all font-mono text-xs font-bold cursor-pointer ${
                        isCustomAmount 
                          ? "border-[#D4AF37] bg-amber-500/15 text-[#D4AF37] shadow-md" 
                          : "border-afri-border hover:border-[#D4AF37]/50 bg-afri-bg text-afri-text"
                      }`}
                    >
                      Montant libre
                    </button>
                  </div>
                </div>

                {isCustomAmount && (
                  <div className="relative">
                    <input
                      type="number"
                      value={customAmountStr}
                      onChange={(e) => setCustomAmountStr(e.target.value)}
                      placeholder="Saisissez votre montant ex: 15000"
                      className="w-full bg-afri-bg border border-[#D4AF37]/50 focus:border-[#D4AF37] rounded-2xl px-4 py-3 text-xs font-mono text-afri-text outline-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-afri-text-sec text-xs font-bold font-mono">FCFA</span>
                  </div>
                )}

                {/* Engagement Options */}
                <div className="space-y-3 pt-3 border-t border-afri-border text-xs">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${isMonthly ? "bg-[#D4AF37] border-[#D4AF37]" : "bg-afri-bg border-afri-border"}`}>
                      {isMonthly && <Check className="w-3.5 h-3.5 text-black" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={isMonthly} onChange={() => setIsMonthly(!isMonthly)} />
                    <div>
                      <span className="font-bold text-afri-text block">Soutien mensuel récurrent</span>
                      <span className="text-[10px] text-afri-text-sec font-mono block">Attribue automatiquement le titre de 🏛️ Parrain du Temple</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${isAnonymous ? "bg-zinc-500 border-zinc-500" : "bg-afri-bg border-afri-border"}`}>
                      {isAnonymous && <Check className="w-3.5 h-3.5 text-black" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={isAnonymous} onChange={() => setIsAnonymous(!isAnonymous)} />
                    <span className="font-medium text-afri-text">Rester anonyme sur le Mur d'Honneur</span>
                  </label>
                </div>

                <button
                  onClick={handleSupport}
                  disabled={processing || (isCustomAmount && (!customAmountStr || parseInt(customAmountStr) < 100))}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-[#D4AF37] to-amber-400 hover:opacity-90 text-black font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {processing ? "Attribution en cours..." : (
                    <>
                      <Heart className="w-4 h-4 fill-black" /> Valider mon soutien au Défi
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 3: TITRES HONORIFIQUES ET MUR D'HONNEUR */}
          {activeTab === "mur" && (
            <motion.div
              key="mur"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 text-left"
            >
              {/* Title Explanations */}
              <div className="bg-afri-bg-sec border border-afri-border rounded-3xl p-5 space-y-3">
                <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4" /> La Pyramide des Titres Honorifiques
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.values(HONORIFIC_TITLES).filter(t => t.id !== "sympathisant").map(t => (
                    <div key={t.id} className={`p-3.5 rounded-2xl border ${t.badgeBg} ${t.badgeBorder} space-y-1`}>
                      <div className={`text-xs font-black ${t.badgeColor} flex items-center gap-1.5`}>
                        <span>{t.icon}</span> {t.label}
                      </div>
                      <p className="text-[11px] text-afri-text-sec font-mono leading-relaxed">
                        {t.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Wall of Honor List */}
              <div className="bg-afri-bg-sec border border-afri-border rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="text-center max-w-md mx-auto space-y-1">
                  <Star className="w-8 h-8 text-[#D4AF37] mx-auto animate-pulse" />
                  <h2 className="text-lg font-black text-afri-text uppercase">Le Mur d'Honneur du Temple</h2>
                  <p className="text-xs text-afri-text-sec font-mono">Gratitude envers tous les membres ayant fait progresser les défis collectifs.</p>
                </div>
                
                <div className="space-y-2.5 pt-2">
                  {buildersList.length > 0 ? buildersList.map((builder, index) => {
                    const titleObj = getTitleForUser(builder.totalAmount, Boolean(builder.isMonthly), builder.count);
                    return (
                      <div key={builder.userId} className="flex items-center gap-3 p-3.5 bg-afri-bg border border-afri-border rounded-2xl transition-all hover:border-[#D4AF37]/40">
                        <div className="w-8 h-8 rounded-xl bg-afri-bg-sec flex-shrink-0 flex items-center justify-center font-bold text-xs text-[#D4AF37] font-mono border border-afri-border">
                          #{index + 1}
                        </div>

                        <div className="flex-1 truncate">
                          <h4 className="font-black text-xs text-afri-text truncate">{builder.userName}</h4>
                          <span className={`text-[10px] font-mono inline-block px-2 py-0.5 rounded-full mt-0.5 ${titleObj.badgeBg} ${titleObj.badgeColor} border ${titleObj.badgeBorder} font-bold`}>
                            {titleObj.label}
                          </span>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-black font-mono text-[#D4AF37]">{builder.totalAmount.toLocaleString()} FCFA</div>
                          <div className="text-[9px] text-afri-text-sec font-mono">{builder.count} soutien(s)</div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-10 text-afri-text-sec font-mono text-xs border border-dashed border-afri-border rounded-2xl">
                      Le Mur d'Honneur attend ses premiers contributeurs aux défis.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
