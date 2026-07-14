import React, { Suspense, lazy, useState, useEffect } from 'react';
import { 
  Activity, 
  UserPlus, 
  Wallet, 
  FileText, 
  ShieldAlert, 
  Users, 
  AlertTriangle, 
  MessageSquare, 
  Zap, 
  RefreshCw, 
  Crown 
} from 'lucide-react';
import { motion } from 'motion/react';

function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const endValue = typeof value === 'number' ? value : 0;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      const easeOutQuad = (t: number) => t * (2 - t);
      const easeProgress = easeOutQuad(percentage);
      
      setCount(Math.floor(easeProgress * endValue));

      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{count.toLocaleString("fr-FR")}</>;
}

const statsContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04, // 40ms stagger delay
    }
  }
};

const statsItemVariants = {
  hidden: { 
    opacity: 0, 
    y: 12, 
    scale: 0.97 
  },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: 0.2, // 200ms animation duration
      ease: "easeOut"
    }
  }
};

const AdminActions = lazy(() => import('../AdminActions'));

export default function AdminDashboard({
  users = [],
  gombos = [],
  posts = [],
  transactions = [],
  alerts = [],
  brief = {},
  currentUser,
  userEmail,
  liveAdminTime,
  isAuthorizedSuperFounder,
  scannerStatus,
  triggerGlobalSystemScan,
  setActiveMenu,
  setIsBroadcastModalOpen,
  audioSynth,
  addToTerminal,
  saveToFirestore,
  setUsers,
  setPosts,
  setGombos
}: any) {
  
  const handleQuickApproveKyc = async (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    const code = (targetUser?.artisticName || "ELT").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "ELT";
    const digits = Math.floor(10000 + Math.random() * 90000); // 5 digits
    const gomboIdNumber = `GMB-${code}-${digits}`;

    const levels = [
      "🟢 Vérifié AFRIGOMBO",
      "🥉 Musicien confirmé",
      "🥈 Professionnel actif",
      "🥇 Référence AFRIGOMBO"
    ];
    const level = levels[Math.floor(Math.random() * levels.length)];

    const gomboIdObj = {
      id: gomboIdNumber,
      scoreConfiance: 95,
      niveau: level,
      prestationsTerminees: Math.floor(10 + Math.random() * 40),
      annulations: Math.floor(Math.random() * 2),
      retards: 0,
      certifie: true,
      createdAt: new Date().toISOString()
    };

    const updatedUser = { 
      kycStatus: "approved" as const, 
      gomboIdNumber,
      gomboId: gomboIdObj,
      isCertified: true,
      kycApprovedDate: new Date().toLocaleDateString("fr-FR")
    };
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatedUser } : u));
    await saveToFirestore("users", userId, updatedUser);
    addToTerminal(`[GOMBO ID] Dossier de ${userId} approuvé par l'administrateur (${gomboIdNumber}).`);
    try { audioSynth.playValidationSuccess(); } catch (e) {}
  };

  const handleQuickRejectKyc = async (userId: string) => {
    const updatedUser = { kycStatus: "rejected" as const };
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatedUser } : u));
    await saveToFirestore("users", userId, updatedUser);
    addToTerminal(`[GOMBO ID] Dossier de ${userId} rejeté.`);
    try { audioSynth.playTamTam(true); } catch (e) {}
  };

  const handleQuickUnflagPost = async (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isFlagged: false } : p));
    await saveToFirestore("posts", postId, { isFlagged: false });
    addToTerminal(`[SÉCURITÉ] Signalement levé pour le post ${postId}`);
    try { audioSynth.playValidationSuccess(); } catch (e) {}
  };

  const handleQuickDeletePost = async (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    await saveToFirestore("posts", postId, { isDeleted: true });
    addToTerminal(`[SÉCURITÉ] Post ${postId} définitivement supprimé.`);
    try { audioSynth.playTamTam(false); } catch (e) {}
  };

  const handleQuickBoostGombo = async (gomboId: string, isBoostedState: boolean) => {
    setGombos(prev => prev.map(g => g.id === gomboId ? { ...g, isBoosted: isBoostedState } : g));
    await saveToFirestore("gombos", gomboId, { isBoosted: isBoostedState });
    addToTerminal(`[GOMBOS] Statut Boosté modifié pour ${gomboId} à ${isBoostedState}`);
    try { audioSynth.playValidationSuccess(); } catch (e) {}
  };

  const kpiUsersCount = users.length;
  const kpiOnlineCount = users.filter((u: any) => u.status === "active").length;
  const kpiGombosCount = gombos.length;
  const kpiPostsCount = posts.length;
  const kpiAlertsCount = posts.filter((p: any) => p.isFlagged).length + alerts.length;
  const kpiApprovedKycCount = users.filter((u: any) => u.kycStatus === "approved").length;

  const flaggedPosts = posts.filter(p => p.isFlagged);
  const recentSignups = [...users].slice(-5).reverse();

  return (
    <div className="space-y-8 pb-24 animate-fadeIn text-left">
      {/* 1. ENTÊTE OPÉRATIONNELLE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] font-bold uppercase">
              CENTRE D'ADMINISTRATION
            </span>
          </div>
          <h2 className="text-2xl font-display font-black tracking-tight text-[#FFFFFF] mt-1 uppercase">
            Gestion • Sécurité • Contrôle
          </h2>
          <div className="flex items-center gap-3 mt-3">
            <img src={currentUser?.photoURL || "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61"} alt="admin" className="w-10 h-10 rounded-full border-2 border-[#D4A017] object-cover" />
            <div>
              <p className="text-[11px] text-[#B8B8B8] font-mono uppercase tracking-widest font-bold">Administrateur Principal</p>
              <p className="text-xs text-[#FFFFFF] font-sans font-medium">{userEmail}</p>
            </div>
          </div>
        </div>
        
        <div className="text-right flex flex-col items-end gap-3">
          <div>
            <span className="text-[9px] uppercase font-mono text-zinc-500 block font-bold">Activité temps réel (GMT)</span>
            <strong className="text-xl font-mono font-black text-[#F5F5F5] tracking-wider block mt-0.5">
              {liveAdminTime}
            </strong>
          </div>
          {userEmail === "jhs.kmj7@gmail.com" && (
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4A017] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D4A017]"></span>
              </span>
              <span className="text-[10px] font-mono text-[#D4A017] uppercase font-bold tracking-widest">Connecté</span>
            </div>
          )}
        </div>
      </div>

      {/* 1. CARTE RÉSUMÉ DU JOUR (STATISTIQUES FIREBASE RÉELLES) */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono uppercase font-black tracking-[0.15em] text-[#D4A017] flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-[#D4AF37]" />
          Statistiques Réelles du Système
        </h3>

        <motion.div 
          variants={statsContainerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <motion.div variants={statsItemVariants} className="p-4 rounded-xl bg-[#0A0A0A] border border-[#D4AF37]/30 shadow-[0_4px_20px_rgba(212,175,55,0.1)] flex flex-col justify-between text-left">
            <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 block">Utilisateurs totaux</span>
            <strong className="text-2xl font-display font-black text-[#FFFFFF] block mt-2">
              <AnimatedCounter value={kpiUsersCount} />
            </strong>
          </motion.div>

          <motion.div variants={statsItemVariants} className="p-4 rounded-xl bg-[#0A0A0A] border border-[#D4AF37]/30 shadow-[0_4px_20px_rgba(212,175,55,0.1)] flex flex-col justify-between text-left relative">
            <span className="w-2 h-2 bg-emerald-500 rounded-full absolute top-4 right-4 animate-pulse"></span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 block">Utilisateurs actifs</span>
            <strong className="text-2xl font-display font-black text-[#FFFFFF] block mt-2">
              <AnimatedCounter value={kpiOnlineCount} />
            </strong>
          </motion.div>

          <motion.div variants={statsItemVariants} className="p-4 rounded-xl bg-[#0A0A0A] border border-[#D4AF37]/30 shadow-[0_4px_20px_rgba(212,175,55,0.1)] flex flex-col justify-between text-left">
            <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 block">Publications</span>
            <strong className="text-2xl font-display font-black text-[#FFFFFF] block mt-2">
              <AnimatedCounter value={kpiPostsCount} />
            </strong>
          </motion.div>

          <motion.div variants={statsItemVariants} className="p-4 rounded-xl bg-[#0A0A0A] border border-[#D4AF37]/30 shadow-[0_4px_20px_rgba(212,175,55,0.1)] flex flex-col justify-between text-left relative">
            {(kpiAlertsCount > 0) && (
              <span className="w-2 h-2 bg-red-500 rounded-full absolute top-4 right-4 animate-pulse"></span>
            )}
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#B8B8B8] block">Signalements</span>
            <strong className="text-2xl font-display font-black text-[#FFFFFF] block mt-2">
              <AnimatedCounter value={kpiAlertsCount} />
            </strong>
          </motion.div>

          <motion.div variants={statsItemVariants} className="p-4 rounded-xl bg-[#0A0A0A] border border-[rgba(212,160,23,0.25)] shadow-[0_4px_20px_rgba(212,160,23,0.05)] flex flex-col justify-between text-left">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#B8B8B8] block">Opportunités</span>
            <strong className="text-2xl font-display font-black text-[#FFFFFF] block mt-2">
              <AnimatedCounter value={kpiGombosCount} />
            </strong>
          </motion.div>

          <motion.div variants={statsItemVariants} className="p-4 rounded-xl bg-[#0A0A0A] border border-[rgba(212,160,23,0.25)] shadow-[0_4px_20px_rgba(212,160,23,0.05)] flex flex-col justify-between text-left">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#B8B8B8] block">Vidéos partagées</span>
            <strong className="text-2xl font-display font-black text-[#FFFFFF] block mt-2">
              <AnimatedCounter value={posts.filter((p: any) => p.mediaType === 'video').length} />
            </strong>
          </motion.div>

          <motion.div variants={statsItemVariants} className="p-4 rounded-xl bg-[#0A0A0A] border border-[rgba(212,160,23,0.25)] shadow-[0_4px_20px_rgba(212,160,23,0.05)] flex flex-col justify-between text-left">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#D4A017] block font-bold">Gombo ID validés</span>
            <strong className="text-2xl font-display font-black text-[#FFFFFF] block mt-2">
              <AnimatedCounter value={kpiApprovedKycCount} />
            </strong>
          </motion.div>

          <motion.div variants={statsItemVariants} className="p-4 rounded-xl bg-[#0A0A0A] border border-[rgba(212,160,23,0.25)] shadow-[0_4px_20px_rgba(212,160,23,0.05)] flex flex-col justify-between text-left">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#B8B8B8] block">Wallets & Revenus</span>
            <strong className="text-xl font-display font-black text-emerald-400 block mt-2">
              <AnimatedCounter value={transactions.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0)} /> <span className="text-xs text-zinc-500 font-sans">FCFA</span>
            </strong>
          </motion.div>

          <motion.div variants={statsItemVariants} className="p-4 rounded-xl bg-[#0A0A0A] border border-[rgba(212,160,23,0.25)] shadow-[0_4px_20px_rgba(212,160,23,0.05)] flex flex-col justify-between text-left">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#B8B8B8] block">Fichiers Média</span>
            <strong className="text-2xl font-display font-black text-[#FFFFFF] block mt-2">
              <AnimatedCounter value={mediaStats.count} /> <span className="text-xs text-zinc-500 font-sans">Actifs</span>
            </strong>
          </motion.div>

          <motion.div variants={statsItemVariants} className="p-4 rounded-xl bg-[#0A0A0A] border border-[rgba(212,160,23,0.25)] shadow-[0_4px_20px_rgba(212,160,23,0.05)] flex flex-col justify-between text-left">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#B8B8B8] block">Stockage utilisé</span>
            <strong className="text-xl font-display font-black text-[#FFFFFF] block mt-2">
              <AnimatedCounter value={mediaStats.sizeMB} /> <span className="text-xs text-zinc-500 font-sans">MB</span>
            </strong>
          </motion.div>
        </motion.div>
      </div>

      {/* 2. ACTIONS ADMINISTRATEUR */}
      <Suspense fallback={<div className="p-10 text-center text-[#D4A017] font-mono animate-pulse">Chargement modules AdminActions...</div>}>
        <AdminActions 
          activeMenu="dashboard" 
          setActiveMenu={setActiveMenu} 
          setIsBroadcastModalOpen={setIsBroadcastModalOpen} 
          audioSynth={audioSynth} 
        />
      </Suspense>

      {/* 3. & 4. PANNEAUX DE CONTRÔLE (RÉCENTE / SÉCURITÉ) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        {/* 3. Activité Récente */}
        <div className="p-6 rounded-2xl bg-[#050505] border border-[#D4AF37]/20 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
            <Activity className="w-4 h-4 text-[#D4AF37]" />
            <h4 className="text-xs font-mono font-black text-[#F5F5F5] uppercase tracking-wider">
              Activité Récente
            </h4>
          </div>
          <ul className="space-y-4 max-h-60 overflow-y-auto px-1 scrollbar-thin">
            {recentSignups.slice(0, 4).map((u, i) => (
              <li key={`u-${i}`} className="flex justify-between items-center bg-[#010101] border border-white/5 p-3 rounded-lg hover:border-[#D4AF37]/20 transition-colors">
                <span className="text-[10px] font-bold text-[#F5F5F5] flex items-center gap-2">
                  <UserPlus className="w-3 h-3 text-emerald-400" />
                  {u.nom || "Nouvel Utilisateur"}
                </span>
                <span className="text-[9px] font-mono text-zinc-500 uppercase">inscription</span>
              </li>
            ))}
            {transactions.slice(0, 3).map((tx: any, i: number) => (
              <li key={`tx-${i}`} className="flex justify-between items-center bg-[#010101] border border-white/5 p-3 rounded-lg hover:border-[#D4AF37]/20 transition-colors">
                <span className="text-[10px] font-bold text-[#F5F5F5] flex items-center gap-2">
                  <Wallet className="w-3 h-3 text-[#D4AF37]" />
                  {tx.description}
                </span>
                <span className="text-[9px] font-mono text-zinc-500 uppercase">paiement</span>
              </li>
            ))}
            {posts.slice(0, 3).map((p, i) => (
              <li key={`p-${i}`} className="flex justify-between items-center bg-[#010101] border border-white/5 p-3 rounded-lg hover:border-[#D4AF37]/20 transition-colors">
                <span className="text-[10px] font-bold text-[#F5F5F5] flex items-center gap-2 truncate pr-2 max-w-[200px]">
                  <FileText className="w-3 h-3 text-cyan-400" />
                  {p.title || "Nouvelle opportunité"}
                </span>
                <span className="text-[9px] font-mono text-zinc-500 uppercase shrink-0">publication</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 4. Sécurité & Alertes Temps Réel */}
        <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-[rgba(212,160,23,0.25)] space-y-4 shadow-[0_4px_20px_rgba(212,160,23,0.05)]">
          <div className="flex items-center gap-2 pb-3 border-b border-[rgba(212,160,23,0.1)]">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <h4 className="text-xs font-mono font-black text-[#FFFFFF] uppercase tracking-wider">
              Alertes Temps Réel
            </h4>
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-auto" />
          </div>
          <ul className="space-y-3">
            <li className="flex justify-between items-center bg-[#050505] p-3 rounded-lg border border-[rgba(212,160,23,0.15)] group hover:border-[#D4A017] transition-all">
              <span className="text-[10px] font-bold text-[#F5F5F5] flex items-center gap-2">
                <Users className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform" />
                Nouveaux utilisateurs
              </span>
              <span className="text-xs font-mono font-black text-emerald-400">
                <AnimatedCounter value={brief.newUsersCount || 0} /> (7j)
              </span>
            </li>
            <li className="flex justify-between items-center bg-[#050505] p-3 rounded-lg border border-[rgba(212,160,23,0.15)] group hover:border-red-500 transition-all">
              <span className="text-[10px] font-bold text-[#F5F5F5] flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 text-red-500 group-hover:scale-110 transition-transform" />
                Signalements critiques
              </span>
              <span className="text-xs font-mono font-black text-red-500">
                <AnimatedCounter value={alerts.filter((a: any) => a.priority === 'high' || a.priority === 'critique').length} />
              </span>
            </li>
            <li className="flex justify-between items-center bg-[#050505] p-3 rounded-lg border border-[rgba(212,160,23,0.15)] group hover:border-amber-500 transition-all">
              <span className="text-[10px] font-bold text-[#F5F5F5] flex items-center gap-2">
                <MessageSquare className="w-3 h-3 text-amber-500 group-hover:scale-110 transition-transform" />
                Publications suspectes
              </span>
              <span className="text-xs font-mono font-black text-amber-500">
                <AnimatedCounter value={flaggedPosts.length} />
              </span>
            </li>
            <li className="flex justify-between items-center bg-[#050505] p-3 rounded-lg border border-[rgba(212,160,23,0.15)] group hover:border-[#D4AF37] transition-all">
              <span className="text-[10px] font-bold text-[#F5F5F5] flex items-center gap-2">
                <Zap className="w-3 h-3 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                Erreurs système
              </span>
              <span className="text-xs font-mono font-black text-[#D4AF37]">
                <AnimatedCounter value={alerts.filter((a: any) => a.type === 'system_error').length} />
              </span>
            </li>
          </ul>
          
          <button
            onClick={triggerGlobalSystemScan}
            disabled={scannerStatus === "scanning"}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#D4A017] hover:bg-[#B8860B] active:scale-95 transition-all text-[10px] font-mono font-black uppercase tracking-wider text-black shadow-md shadow-[#D4A017]/20"
          >
            <RefreshCw className={`w-3 h-3 ${scannerStatus === "scanning" ? "animate-spin" : ""}`} />
            Forcer Scan de Sécurité
          </button>
        </div>
      </div>

      {/* 5. ACCÈS SUPER FONDATEUR */}
      {isAuthorizedSuperFounder && (
        <div className="mt-12 p-8 rounded-3xl bg-gradient-to-r from-[#030303] via-[#0D0D15] to-[#030303] border border-[#D4AF37]/40 shadow-[0_10px_40px_rgba(212,175,55,0.1)] text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 transform rotate-12 opacity-5 pointer-events-none">
            <Crown className="w-64 h-64 text-[#D4AF37]" />
          </div>
          
          <div className="relative z-10 space-y-2">
            <h4 className="text-sm font-display font-black text-[#D4AF37] uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              <Crown className="w-5 h-5" />
              Gouvernance Suprême
            </h4>
            <p className="text-[11px] text-zinc-400 font-mono">
              Zone réservée exclusivement au Fondateur de l'Empire AfriGombo.
            </p>
          </div>

          <button
            onClick={() => {
              setActiveMenu("super_admin");
              addToTerminal("👑 [SOUVERAINETÉ] Entrée dans le Trône demandée.");
              try { audioSynth.playTamTam(true); } catch (err) {}
            }}
            className="relative z-10 group px-8 py-4 bg-black border border-[#D4AF37] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black font-display font-black text-sm uppercase tracking-widest rounded-2xl transition-all duration-500 flex items-center justify-center gap-4 cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] mx-auto w-full md:w-auto"
          >
            <Crown className="w-5 h-5" />
            <span>👑 Entrer dans le Trône</span>
          </button>
        </div>
      )}
    </div>
  );
}
