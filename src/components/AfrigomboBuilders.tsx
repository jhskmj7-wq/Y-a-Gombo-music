import React, { useState, useEffect } from "react";
import { 
  Heart, Sparkles, Shield, Crown, Globe,
  ArrowRight, Users, Check, Flame, Star, Trophy, ArrowLeft
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

const BADGES = [
  { threshold: 100000, label: "👑 Grand Mécène", color: "text-[#D4AF37]", bg: "bg-afri-bg-sec/10", border: "border-[#D4AF37]/30" },
  { threshold: 50000, label: "💎 Gardien du Temple", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  { threshold: 20000, label: "🥇 Protecteur", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  { threshold: 5000, label: "🥈 Bâtisseur", color: "text-afri-text", bg: "bg-zinc-500/10", border: "border-zinc-500/30" },
  { threshold: 1000, label: "🥉 Ami d'AFRIGOMBO", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  { threshold: 0, label: "Sympathisant", color: "text-afri-text-sec", bg: "bg-afri-bg-ter", border: "border-afri-border" }
];

const PREDEFINED_AMOUNTS = [500, 1000, 2000, 5000, 10000];

export default function AfrigomboBuilders({ currentUser, onBack, audioSynth }: AfrigomboBuildersProps) {
  const [activeTab, setActiveTab] = useState<"soutenir" | "defis" | "mur">("soutenir");
  const [amount, setAmount] = useState<number>(1000);
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [customAmountStr, setCustomAmountStr] = useState("");
  const [isMonthly, setIsMonthly] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const [challenges, setChallenges] = useState<any[]>([]);
  const [buildersList, setBuildersList] = useState<any[]>([]);
  const [userBuilderData, setUserBuilderData] = useState<any>(currentUser.builderData || null);

  useEffect(() => {
    const unsubChallenges = onSnapshot(collection(db, "builder_challenges"), (snap) => {
      const list: any[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setChallenges(list);
    });

    const unsubBuilders = onSnapshot(collection(db, "builder_supports"), (snap) => {
      const list: any[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      
      const userMap = new Map();
      list.forEach(support => {
        if (!userMap.has(support.userId)) {
          userMap.set(support.userId, {
            userId: support.userId,
            userName: support.userName,
            isAnonymous: support.isAnonymous,
            totalAmount: 0,
            count: 0
          });
        }
        const u = userMap.get(support.userId);
        u.totalAmount += support.amount;
        u.count += 1;
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

  const getBadgeForAmount = (total: number) => {
    return BADGES.find(b => total >= b.threshold) || BADGES[BADGES.length - 1];
  };

  const handleSupport = async () => {
    const finalAmount = isCustomAmount ? parseInt(customAmountStr) : amount;
    if (!finalAmount || finalAmount < 100 || processing) return;

    setProcessing(true);
    try {
      const now = new Date();
      
      await addDoc(collection(db, "builder_supports"), {
        userId: currentUser.uid || currentUser.id,
        userName: currentUser.name || currentUser.displayName || "Utilisateur",
        amount: finalAmount,
        isMonthly,
        isAnonymous,
        createdAt: now.toISOString()
      });

      const prevTotal = userBuilderData?.totalAmount || 0;
      const prevCount = userBuilderData?.count || 0;
      const newTotal = prevTotal + finalAmount;
      const newBadge = getBadgeForAmount(newTotal).label;

      const newBuilderData = {
        totalAmount: newTotal,
        count: prevCount + 1,
        joinYear: userBuilderData?.joinYear || now.getFullYear(),
        badge: newBadge,
        isMonthly,
        isAnonymous
      };

      const userRef = doc(db, "users", (currentUser.uid || currentUser.id) as string);
      
      // Update global badges array to distribute the builder badge automatically
      const currentBadges = Array.isArray(currentUser.badges) ? currentUser.badges : [];
      const builderBadgesList = ["👑 Grand Mécène", "💎 Gardien du Temple", "🥇 Protecteur", "🥈 Bâtisseur", "🥉 Ami d'AFRIGOMBO", "Sympathisant"];
      
      const otherBadges = currentBadges.filter((b: string) => !builderBadgesList.includes(b));
      if (newBadge !== "Sympathisant") {
        otherBadges.push(newBadge);
      }

      await setDoc(userRef, { 
        builderData: newBuilderData,
        badges: otherBadges
      }, { merge: true });

      setUserBuilderData(newBuilderData);

      try { audioSynth?.playValidationSuccess(); } catch(e) {}
      alert(`Merci pour votre soutien de ${finalAmount.toLocaleString()} FCFA ! Vous aidez à construire le Temple.`);
      setAmount(1000);
      setIsCustomAmount(false);
      setCustomAmountStr("");
      
    } catch (e) {
      console.error(e);
      alert("Erreur lors du soutien.");
    } finally {
      setProcessing(false);
    }
  };

  const currentBadge = getBadgeForAmount(userBuilderData?.totalAmount || 0);

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 text-afri-text pb-32">
      {/* Header / Hero - Warm & Engaging */}
      <div className="relative pt-6 pb-8 px-4 overflow-hidden border-b border-[#D4AF37]/30 bg-gradient-to-r from-afri-bg-sec via-afri-bg to-afri-bg-sec rounded-3xl mt-2 mb-4 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D4AF37]/25 via-afri-bg to-afri-bg opacity-70"></div>

        <div className="relative z-10 max-w-2xl mx-auto text-center space-y-3">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-16 h-16 mx-auto bg-gradient-to-br from-[#D4AF37]/30 to-afri-bg border-2 border-[#D4AF37]/60 rounded-2xl flex items-center justify-center transform rotate-3 shadow-lg shadow-[#D4AF37]/30"
          >
            <Crown className="w-8 h-8 text-[#D4AF37] -rotate-3" />
          </motion.div>
          
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-amber-200 to-[#D4AF37]">
            Le Temple du Gombo & Bâtisseurs
          </h1>
          <p className="text-xs sm:text-sm text-afri-text-sec font-medium max-w-lg mx-auto leading-relaxed">
            Soutenez l'écosystème musical africain et propulsez les artistes de scène vers l'excellence.
          </p>

          {/* COMMUNITY GOAL PROGRESS BAR */}
          <div className="bg-afri-bg/95 border border-[#D4AF37]/40 rounded-2xl p-4 shadow-lg text-left space-y-2 mt-4">
            <div className="flex justify-between items-center text-xs font-mono font-bold">
              <span className="text-afri-text flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#D4AF37]" /> Objectif Bêta Communautaire
              </span>
              <span className="text-[#D4AF37]">65% Atteint</span>
            </div>
            <div className="w-full h-2.5 bg-afri-bg-sec rounded-full overflow-hidden p-0.5 border border-afri-border">
              <div className="h-full bg-gradient-to-r from-amber-500 to-[#D4AF37] rounded-full" style={{ width: "65%" }}></div>
            </div>
            <div className="flex justify-between text-[10px] text-afri-text-sec font-mono">
              <span>1,300,000 FCFA récoltés</span>
              <span>Objectif : 2,000,000 FCFA</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full space-y-4">
        
        {/* User Profile Mini-Dashboard */}
        <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 shadow-md">
          <div className={`w-14 h-14 rounded-full border-2 ${currentBadge.border} ${currentBadge.bg} flex items-center justify-center shrink-0 shadow-sm`}>
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <Users className={`w-6 h-6 ${currentBadge.color}`} />
            )}
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1">
            <h3 className="text-sm font-black text-afri-text">{currentUser.name || currentUser.displayName || "Artiste Bâtisseur"}</h3>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${currentBadge.bg} ${currentBadge.color} ${currentBadge.border} border shadow-xs`}>
              {currentBadge.label}
            </div>
            {userBuilderData?.totalAmount > 0 ? (
              <p className="text-[11px] text-afri-text-sec font-mono pt-0.5">
                Bâtisseur depuis {userBuilderData.joinYear} • {userBuilderData.count} contribution(s) • Total: <span className="text-[#D4AF37] font-bold">{userBuilderData.totalAmount.toLocaleString()} FCFA</span>
              </p>
            ) : (
              <p className="text-[11px] text-afri-text-sec font-mono pt-0.5">
                Faites un don pour débloquer votre badge de Bâtisseur officiel.
              </p>
            )}
          </div>
        </div>

        {/* PERKS & REWARDS CARD (Encouraging donations) */}
        <div className="bg-gradient-to-br from-afri-bg-sec via-afri-bg to-afri-bg-sec border border-[#D4AF37]/30 rounded-2xl p-4 space-y-3 shadow-md">
          <h4 className="text-xs font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Avantages & Contreparties Exclusives des Bâtisseurs
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-afri-bg/80 border border-afri-border rounded-xl p-3 space-y-1">
              <div className="font-bold text-afri-text flex items-center gap-1.5">
                <span>✨</span> Badge Doré Exclusif
              </div>
              <p className="text-[11px] text-afri-text-sec leading-relaxed">
                Affiché fièrement sur votre profil public et toutes vos annonces.
              </p>
            </div>
            <div className="bg-afri-bg/80 border border-afri-border rounded-xl p-3 space-y-1">
              <div className="font-bold text-afri-text flex items-center gap-1.5">
                <span>🚀</span> Priorité Gombos
              </div>
              <p className="text-[11px] text-afri-text-sec leading-relaxed">
                Priorité absolue sur l'attribution des bookings et castings premium.
              </p>
            </div>
            <div className="bg-afri-bg/80 border border-afri-border rounded-xl p-3 space-y-1">
              <div className="font-bold text-afri-text flex items-center gap-1.5">
                <span>👑</span> Accès VIP 2.0
              </div>
              <p className="text-[11px] text-afri-text-sec leading-relaxed">
                Accès en avant-première aux fonctionnalités et outils exclusifs.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation - FLEX WRAP (NO HORIZONTAL SCROLL) */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            onClick={() => setActiveTab("soutenir")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "soutenir" ? "bg-[#D4AF37] text-black shadow-md font-black" : "bg-afri-bg-sec text-afri-text-sec border border-afri-border hover:text-afri-text"}`}
          >
            Soutenir AFRIGOMBO
          </button>
          <button
            onClick={() => setActiveTab("defis")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "defis" ? "bg-[#D4AF37] text-black shadow-md font-black" : "bg-afri-bg-sec text-afri-text-sec border border-afri-border hover:text-afri-text"}`}
          >
            Défis du Temple
          </button>
          <button
            onClick={() => setActiveTab("mur")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "mur" ? "bg-[#D4AF37] text-black shadow-md font-black" : "bg-afri-bg-sec text-afri-text-sec border border-afri-border hover:text-afri-text"}`}
          >
            Mur d'Honneur
          </button>
        </div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === "soutenir" && (
            <motion.div
              key="soutenir"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-afri-bg-sec/50 border border-afri-border rounded-2xl p-4 sm:p-5 space-y-4">
                <div>
                  <h2 className="text-base font-black mb-1">Montant du soutien</h2>
                  <p className="text-xs text-afri-text-sec">Choisissez un montant pour participer à l'effort communautaire.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PREDEFINED_AMOUNTS.map(amt => (
                    <button
                      key={amt}
                      onClick={() => { setAmount(amt); setIsCustomAmount(false); }}
                      className={`py-2.5 rounded-xl border transition-all font-mono text-xs font-bold ${
                        !isCustomAmount && amount === amt 
                          ? "border-[#D4AF37] bg-afri-bg-sec/20 text-[#D4AF37]" 
                          : "border-afri-border hover:border-afri-gold bg-afri-bg text-afri-text-muted"
                      }`}
                    >
                      {amt.toLocaleString()} FCFA
                    </button>
                  ))}
                  <button
                    onClick={() => setIsCustomAmount(true)}
                    className={`py-2.5 rounded-xl border transition-all font-mono text-xs font-bold ${
                      isCustomAmount 
                        ? "border-[#D4AF37] bg-afri-bg-sec/20 text-[#D4AF37]" 
                        : "border-afri-border hover:border-afri-gold bg-afri-bg text-afri-text-muted"
                    }`}
                  >
                    Montant libre
                  </button>
                </div>

                {isCustomAmount && (
                  <div className="relative">
                    <input
                      type="number"
                      value={customAmountStr}
                      onChange={(e) => setCustomAmountStr(e.target.value)}
                      placeholder="Ex: 15000"
                      className="w-full bg-afri-bg border border-afri-border focus:border-[#D4AF37] rounded-xl px-4 py-2 text-sm font-mono text-afri-text outline-none transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-afri-text-sec text-xs font-bold font-mono">FCFA</span>
                  </div>
                )}

                <div className="space-y-2 pt-3 border-t border-afri-border text-xs">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${isMonthly ? "bg-afri-bg-sec border-[#D4AF37]" : "bg-afri-bg border-afri-border"}`}>
                      {isMonthly && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={isMonthly} onChange={() => setIsMonthly(!isMonthly)} />
                    <span className="font-medium text-afri-text">Soutien mensuel (facultatif)</span>
                  </label>
                  
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${isAnonymous ? "bg-zinc-500 border-zinc-500" : "bg-afri-bg border-afri-border"}`}>
                      {isAnonymous && <Check className="w-3.5 h-3.5 text-black" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={isAnonymous} onChange={() => setIsAnonymous(!isAnonymous)} />
                    <span className="font-medium text-afri-text">Rester anonyme sur le Mur d'Honneur</span>
                  </label>
                </div>

                <button
                  onClick={handleSupport}
                  disabled={processing || (isCustomAmount && (!customAmountStr || parseInt(customAmountStr) < 100))}
                  className="w-full py-3 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {processing ? "Traitement..." : (
                    <>
                      <Heart className="w-4 h-4" /> Devenir Bâtisseur
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === "defis" && (
            <motion.div
              key="defis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {challenges.length > 0 ? challenges.map(challenge => {
                const progress = Math.min(100, Math.round((challenge.current / challenge.target) * 100));
                return (
                  <div key={challenge.id} className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-afri-text mb-0.5">{challenge.title}</h3>
                        <p className="text-[11px] text-afri-text-sec">{challenge.description}</p>
                      </div>
                      <div className="bg-afri-bg px-2.5 py-1 rounded-lg border border-afri-border flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span className="text-[10px] font-mono">{challenge.contributors}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-[#D4AF37] font-bold">{challenge.current.toLocaleString()} FCFA</span>
                        <span className="text-afri-text-sec">Objectif: {challenge.target.toLocaleString()} FCFA</span>
                      </div>
                      <div className="h-1.5 bg-afri-bg rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-[#D4AF37]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="text-right text-[9px] text-afri-text-sec font-mono">
                        {progress}% complété
                      </div>
                    </div>
                  </div>
                )
              }) : (
                <div className="text-center py-8 text-afri-text-sec font-mono border border-dashed border-afri-border rounded-2xl text-xs">
                  <Flame className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
                  Aucun défi en cours actuellement.
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "mur" && (
            <motion.div
              key="mur"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4 sm:p-5">
                <div className="text-center mb-4 space-y-1">
                  <Star className="w-7 h-7 text-[#D4AF37] mx-auto" />
                  <h2 className="text-lg font-black">Le Mur d'Honneur</h2>
                  <p className="text-xs text-afri-text-sec">Ceux qui bâtissent l'avenir de la plateforme.</p>
                </div>
                
                <div className="space-y-2">
                  {buildersList.length > 0 ? buildersList.map((builder, index) => {
                    const badge = getBadgeForAmount(builder.totalAmount);
                    return (
                      <div key={builder.userId} className="flex items-center gap-3 p-3 bg-afri-bg border border-afri-border rounded-xl">
                        <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center font-bold text-xs text-afri-text-sec font-mono">
                          #{index + 1}
                        </div>
                        <div className="flex-1 truncate">
                          <h4 className="font-bold text-xs truncate">{builder.userName}</h4>
                          <span className={`text-[9px] font-mono block ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold font-mono text-[#D4AF37]">{builder.totalAmount.toLocaleString()} FCFA</div>
                          <div className="text-[9px] text-afri-text-sec">{builder.count} cont.</div>
                        </div>
                      </div>
                    )
                  }) : (
                    <div className="text-center py-6 text-afri-text-sec text-xs">
                      Le Mur d'Honneur attend ses premiers bâtisseurs.
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
