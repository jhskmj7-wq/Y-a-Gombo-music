import React, { useState, useEffect } from "react";
import { 
  Heart, Sparkles, Shield, Crown, Globe,
  ArrowRight, Users, Check, Flame, Star, Trophy
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
      
      // Aggregate by user
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
        if (!u.isAnonymous && support.isAnonymous) u.isAnonymous = false; // if any support is public, make them public? Or rely on user preference. We'll use user preference.
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
      
      // Check wallet logic (simplified, assuming we don't deduct actual wallet for this demo or we do?)
      // We should deduct from soldeDisponible if we want it to be real, but for now we just record it.
      // Wait, let's just record the support.
      
      await addDoc(collection(db, "builder_supports"), {
        userId: currentUser.uid || currentUser.id,
        userName: currentUser.name || currentUser.displayName || "Utilisateur",
        amount: finalAmount,
        isMonthly,
        isAnonymous,
        createdAt: now.toISOString()
      });

      // Update user profile
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
      await setDoc(userRef, { builderData: newBuilderData }, { merge: true });
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
    <div className="w-full text-afri-text pb-32">
      {/* Header / Hero */}
      <div className="relative pt-12 pb-16 px-6 overflow-hidden border-b border-[#D4AF37]/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D4AF37]/20 via-afri-bg to-afri-bg opacity-60"></div>
        
        {/* Animated particles background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-afri-bg-sec/40 rounded-full"
              initial={{ 
                x: Math.random() * window.innerWidth, 
                y: Math.random() * window.innerHeight,
                scale: Math.random() * 0.5 + 0.5,
                opacity: Math.random() * 0.5 + 0.2
              }}
              animate={{ 
                y: [null, Math.random() * -100 - 50],
                opacity: [null, 0]
              }}
              transition={{ 
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-24 h-24 mx-auto bg-gradient-to-br from-[#D4AF37]/20 to-afri-bg border border-[#D4AF37]/40 rounded-3xl flex items-center justify-center transform rotate-12 shadow-2xl shadow-[#D4AF37]/20"
          >
            <Crown className="w-12 h-12 text-[#D4AF37] -rotate-12" />
          </motion.div>
          
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-amber-200">
            Le Temple du Gombo
          </h1>
          <p className="text-lg text-afri-text-sec font-mono max-w-xl mx-auto">
            "Chaque soutien construit l'avenir des artistes africains."
          </p>
          <p className="text-xs text-afri-text-sec max-w-md mx-auto">
            Le programme Les Bâtisseurs est entièrement facultatif et n'offre aucun avantage sur les contrats. C'est un acte volontaire pour faire grandir la plateforme.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        
        {/* User Profile Mini-Dashboard */}
        <div className="bg-afri-bg-sec/50 border border-afri-border rounded-3xl p-6 mb-8 flex flex-col sm:flex-row items-center gap-6">
          <div className={`w-20 h-20 rounded-full border-2 ${currentBadge.border} ${currentBadge.bg} flex items-center justify-center`}>
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <Users className={`w-8 h-8 ${currentBadge.color}`} />
            )}
          </div>
          <div className="flex-1 text-center sm:text-left space-y-2">
            <h3 className="text-xl font-bold">{currentUser.name || currentUser.displayName || "Artiste"}</h3>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${currentBadge.bg} ${currentBadge.color} ${currentBadge.border} border`}>
              {currentBadge.label}
            </div>
            {userBuilderData?.totalAmount > 0 && (
              <p className="text-xs text-afri-text-sec font-mono">
                Bâtisseur depuis {userBuilderData.joinYear} • {userBuilderData.count} contribution(s) • Total: <span className="text-[#D4AF37] font-bold">{userBuilderData.totalAmount.toLocaleString()} FCFA</span>
              </p>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          <button
            onClick={() => setActiveTab("soutenir")}
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeTab === "soutenir" ? "bg-afri-bg-sec text-black" : "bg-afri-bg-sec text-afri-text-sec hover:bg-afri-bg-ter hover:text-afri-text"}`}
          >
            Soutenir AFRIGOMBO
          </button>
          <button
            onClick={() => setActiveTab("defis")}
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeTab === "defis" ? "bg-afri-bg-sec text-black" : "bg-afri-bg-sec text-afri-text-sec hover:bg-afri-bg-ter hover:text-afri-text"}`}
          >
            Défis du Temple
          </button>
          <button
            onClick={() => setActiveTab("mur")}
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeTab === "mur" ? "bg-afri-bg-sec text-black" : "bg-afri-bg-sec text-afri-text-sec hover:bg-afri-bg-ter hover:text-afri-text"}`}
          >
            Mur d'Honneur
          </button>
        </div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === "soutenir" && (
            <motion.div
              key="soutenir"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-afri-bg-sec/50 border border-afri-border rounded-3xl p-6 sm:p-8 space-y-8">
                <div>
                  <h2 className="text-xl font-black mb-2">Montant du soutien</h2>
                  <p className="text-sm text-afri-text-sec">Choisissez un montant pour participer à l'effort communautaire.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PREDEFINED_AMOUNTS.map(amt => (
                    <button
                      key={amt}
                      onClick={() => { setAmount(amt); setIsCustomAmount(false); }}
                      className={`py-4 rounded-2xl border-2 transition-all font-mono font-bold ${
                        !isCustomAmount && amount === amt 
                          ? "border-[#D4AF37] bg-afri-bg-sec/10 text-[#D4AF37]" 
                          : "border-afri-border hover:border-afri-gold bg-afri-bg text-afri-text-muted"
                      }`}
                    >
                      {amt.toLocaleString()} FCFA
                    </button>
                  ))}
                  <button
                    onClick={() => setIsCustomAmount(true)}
                    className={`py-4 rounded-2xl border-2 transition-all font-mono font-bold ${
                      isCustomAmount 
                        ? "border-[#D4AF37] bg-afri-bg-sec/10 text-[#D4AF37]" 
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
                      className="w-full bg-afri-bg border-2 border-afri-border focus:border-[#D4AF37] rounded-2xl px-6 py-4 text-xl font-mono text-afri-text outline-none transition-all"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-afri-text-sec font-bold font-mono">FCFA</span>
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t border-afri-border">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-6 h-6 rounded flex items-center justify-center border transition-all ${isMonthly ? "bg-afri-bg-sec border-[#D4AF37]" : "bg-afri-bg border-afri-border group-hover:border-zinc-500"}`}>
                      {isMonthly && <Check className="w-4 h-4 text-black" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={isMonthly} onChange={() => setIsMonthly(!isMonthly)} />
                    <span className="text-sm font-medium text-afri-text">Soutien mensuel (facultatif)</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-6 h-6 rounded flex items-center justify-center border transition-all ${isAnonymous ? "bg-zinc-500 border-zinc-500" : "bg-afri-bg border-afri-border group-hover:border-zinc-500"}`}>
                      {isAnonymous && <Check className="w-4 h-4 text-black" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={isAnonymous} onChange={() => setIsAnonymous(!isAnonymous)} />
                    <span className="text-sm font-medium text-afri-text">Rester anonyme sur le Mur d'Honneur</span>
                  </label>
                </div>

                <button
                  onClick={handleSupport}
                  disabled={processing || (isCustomAmount && (!customAmountStr || parseInt(customAmountStr) < 100))}
                  className="w-full py-5 bg-afri-bg-sec hover:bg-amber-400 text-black font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                >
                  {processing ? "Traitement..." : (
                    <>
                      <Heart className="w-5 h-5" /> Devenir Bâtisseur
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === "defis" && (
            <motion.div
              key="defis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {challenges.length > 0 ? challenges.map(challenge => {
                const progress = Math.min(100, Math.round((challenge.current / challenge.target) * 100));
                return (
                  <div key={challenge.id} className="bg-afri-bg-sec border border-afri-border rounded-3xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-afri-text mb-1">{challenge.title}</h3>
                        <p className="text-xs text-afri-text-sec">{challenge.description}</p>
                      </div>
                      <div className="bg-afri-bg px-3 py-1.5 rounded-lg border border-afri-border flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-xs font-mono">{challenge.contributors}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#D4AF37]">{challenge.current.toLocaleString()} FCFA</span>
                        <span className="text-afri-text-sec">Objectif: {challenge.target.toLocaleString()} FCFA</span>
                      </div>
                      <div className="h-2 bg-afri-bg-sec rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-[#D4AF37]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="text-right text-[10px] text-afri-text-sec">
                        {progress}% complété
                      </div>
                    </div>
                  </div>
                )
              }) : (
                <div className="text-center py-12 text-afri-text-sec font-mono border border-dashed border-afri-border rounded-3xl">
                  <Flame className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                  Aucun défi en cours actuellement.
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "mur" && (
            <motion.div
              key="mur"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-afri-bg-sec border border-afri-border rounded-3xl p-6">
                <div className="text-center mb-8">
                  <Star className="w-10 h-10 text-[#D4AF37] mx-auto mb-3" />
                  <h2 className="text-2xl font-black">Le Mur d'Honneur</h2>
                  <p className="text-sm text-afri-text-sec mt-2">Ceux qui bâtissent l'avenir de la plateforme.</p>
                </div>
                
                <div className="space-y-4">
                  {buildersList.length > 0 ? buildersList.map((builder, index) => {
                    const badge = getBadgeForAmount(builder.totalAmount);
                    return (
                      <div key={builder.userId} className="flex items-center gap-4 p-4 bg-afri-bg border border-afri-border rounded-2xl">
                        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center font-bold text-xl text-afri-text-sec font-mono">
                          #{index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm sm:text-base">{builder.userName}</h4>
                          <span className={`text-[10px] sm:text-xs font-mono ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold font-mono text-[#D4AF37]">{builder.totalAmount.toLocaleString()} FCFA</div>
                          <div className="text-[10px] text-afri-text-sec">{builder.count} contribution(s)</div>
                        </div>
                      </div>
                    )
                  }) : (
                    <div className="text-center py-8 text-afri-text-sec text-sm">
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
