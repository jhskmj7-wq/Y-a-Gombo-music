import React, { useState, useEffect } from "react";
import { 
  Trophy, 
  Building, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Pause, 
  Play, 
  Search, 
  RefreshCw, 
  Sliders, 
  User as UserIcon, 
  ChevronDown, 
  ChevronUp, 
  Award, 
  Sparkles, 
  FileText, 
  Lock, 
  ShieldAlert,
  SlidersHorizontal,
  Info
} from "lucide-react";
import { useAuth } from "../../AuthContext";
import { db } from "../../lib/firebase";
import { collection, onSnapshot, query, where, orderBy, addDoc } from "firebase/firestore";
import { User, BetaRankType, BetaBenefit } from "../../types";
import { 
  getBetaProgramStats, 
  getBetaDeploymentConfig, 
  updateBetaDeploymentConfig, 
  suspendBetaBenefit, 
  reactivateBetaBenefit, 
  correctBetaRank,
  BetaStats 
} from "../../lib/BetaSystemEngine";
import { motion, AnimatePresence } from "framer-motion";

interface AdminBetaProgramProps {
  onSelectUser?: (userId: string) => void;
}

export default function AdminBetaProgram({ onSelectUser }: AdminBetaProgramProps) {
  const { currentUser } = useAuth();
  
  const [stats, setStats] = useState<BetaStats & { members: User[] }>({
    ambassadorCount: 0,
    builderCount: 0,
    totalCount: 0,
    maxAmbassadors: 20,
    maxBuilders: 80,
    firstAssignedDate: null,
    lastAssignedDate: null,
    ambassadorsEnabled: true,
    buildersEnabled: true,
    members: []
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "AMBASSADORS" | "BUILDERS" | "ACTIVE" | "SUSPENDED" | "EXPIRED">("ALL");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Deployment Center state
  const [ambassadorsEnabled, setAmbassadorsEnabled] = useState(true);
  const [buildersEnabled, setBuildersEnabled] = useState(true);
  const [updatingConfig, setUpdatingConfig] = useState(false);

  // Modal State for Action
  const [actionModal, setActionModal] = useState<{
    type: "SUSPEND" | "REACTIVATE" | "CORRECT";
    targetUser: User;
    title: string;
    message: string;
  } | null>(null);

  const [actionReason, setActionReason] = useState("");
  const [correctRankType, setCorrectRankType] = useState<BetaRankType>("AMBASSADOR");
  const [correctRankNumber, setCorrectRankNumber] = useState<number>(1);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  // Load Real-time Data
  const loadData = async () => {
    setRefreshing(true);
    const data = await getBetaProgramStats();
    setStats(data);
    setAmbassadorsEnabled(data.ambassadorsEnabled);
    setBuildersEnabled(data.buildersEnabled);
    setRefreshing(false);
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    // Listen to real-time users collection for beta members
    if (db) {
      const q = query(collection(db, "users"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const allUsers = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as User[];
        const betaMembers = allUsers
          .filter(u => u.betaRankType && u.betaRankType !== "NONE" && typeof u.betaRankNumber === "number")
          .sort((a, b) => (a.betaRankNumber || 999) - (b.betaRankNumber || 999));

        const ambassadors = betaMembers.filter(u => u.betaRankType === "AMBASSADOR" || (u.betaRankNumber && u.betaRankNumber <= 20));
        const builders = betaMembers.filter(u => u.betaRankType === "BUILDER" || (u.betaRankNumber && u.betaRankNumber > 20 && u.betaRankNumber <= 100));

        const dates = betaMembers
          .map(u => u.betaRankAssignedAt || u.betaBenefit?.startedAt)
          .filter(Boolean) as string[];
        dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        setStats(prev => ({
          ...prev,
          ambassadorCount: ambassadors.length,
          builderCount: builders.length,
          totalCount: betaMembers.length,
          firstAssignedDate: dates[0] || null,
          lastAssignedDate: dates[dates.length - 1] || null,
          members: betaMembers
        }));
      }, (err) => {
        console.warn("Snapshot error in AdminBetaProgram:", err);
      });

      // Listen to admin audit logs
      const logsQ = query(
        collection(db, "admin_audit_logs"),
        orderBy("timestamp", "desc")
      );

      const logsUnsub = onSnapshot(logsQ, (snap) => {
        const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const betaLogs = logs.filter((l: any) => 
          l.action === "BETA_RANK_ASSIGNED" ||
          l.action === "SUSPEND_BETA_BENEFIT" ||
          l.action === "REACTIVATE_BETA_BENEFIT" ||
          l.action === "CORRECT_BETA_RANK" ||
          l.action === "UPDATE_BETA_DEPLOYMENT_CONFIG"
        );
        setAuditLogs(betaLogs.slice(0, 30));
      }, (e) => {
        console.warn("Audit logs error:", e);
      });

      return () => {
        unsubscribe();
        logsUnsub();
      };
    }
  }, []);

  // Handle Deployment Center Config Toggle
  const handleToggleDeploymentConfig = async (key: "ambassadors" | "builders", newValue: boolean) => {
    setUpdatingConfig(true);
    const newAmb = key === "ambassadors" ? newValue : ambassadorsEnabled;
    const newBld = key === "builders" ? newValue : buildersEnabled;

    const adminInfo = {
      uid: currentUser?.uid || "super_founder",
      email: currentUser?.email || "founder@afrigombo.com"
    };

    const success = await updateBetaDeploymentConfig(
      { ambassadorsEnabled: newAmb, buildersEnabled: newBld },
      adminInfo
    );

    if (success) {
      setAmbassadorsEnabled(newAmb);
      setBuildersEnabled(newBld);
    }
    setUpdatingConfig(false);
  };

  // Filtered Members
  const filteredMembers = stats.members.filter(user => {
    // Search Filter
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const name = (user.name || user.displayName || user.artisticName || "").toLowerCase();
      const gomboId = (user.gomboIdNumber || (typeof user.gomboId === 'string' ? user.gomboId : user.gomboId?.id) || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      const phone = (user.phone || "").toLowerCase();
      const rankNum = String(user.betaRankNumber || "");

      const matchSearch = name.includes(q) || gomboId.includes(q) || email.includes(q) || phone.includes(q) || rankNum.includes(q);
      if (!matchSearch) return false;
    }

    // Category Tabs
    const status = user.betaBenefit?.status || "active";
    if (activeTab === "AMBASSADORS") return user.betaRankType === "AMBASSADOR" || (user.betaRankNumber && user.betaRankNumber <= 20);
    if (activeTab === "BUILDERS") return user.betaRankType === "BUILDER" || (user.betaRankNumber && user.betaRankNumber > 20 && user.betaRankNumber <= 100);
    if (activeTab === "ACTIVE") return status === "active";
    if (activeTab === "SUSPENDED") return status === "suspended";
    if (activeTab === "EXPIRED") return status === "expired";

    return true;
  });

  // Execute Modal Action
  const handleConfirmModalAction = async () => {
    if (!actionModal) return;
    setIsSubmittingAction(true);

    const adminInfo = {
      uid: currentUser?.uid || "super_founder",
      email: currentUser?.email || "founder@afrigombo.com"
    };

    const targetId = actionModal.targetUser.id || actionModal.targetUser.uid;
    if (!targetId) {
      setIsSubmittingAction(false);
      return;
    }

    if (actionModal.type === "SUSPEND") {
      if (!actionReason.trim()) {
        alert("Veuillez indiquer un motif officiel pour la suspension.");
        setIsSubmittingAction(false);
        return;
      }
      await suspendBetaBenefit(targetId, actionReason.trim(), adminInfo);
    } else if (actionModal.type === "REACTIVATE") {
      await reactivateBetaBenefit(targetId, adminInfo);
    } else if (actionModal.type === "CORRECT") {
      if (!actionReason.trim()) {
        alert("Veuillez indiquer le motif de correction du rang Bêta.");
        setIsSubmittingAction(false);
        return;
      }
      await correctBetaRank(targetId, correctRankType, correctRankNumber, actionReason.trim(), adminInfo);
    }

    setIsSubmittingAction(false);
    setActionModal(null);
    setActionReason("");
    await loadData();
  };

  return (
    <div className="space-y-6 text-left">
      {/* 🏆 TOP BANNER HEADER */}
      <div className="relative p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-black via-zinc-950 to-zinc-900 border border-[#D4AF37]/30 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold tracking-wider bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                Phase 4 — Bêta Officiel
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Source : KYC Validé
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide font-display flex items-center gap-2">
              🏆 PROGRAMME BÊTA AFRIGOMBO
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Attribution automatique et irréversible des rangs aux 100 premiers utilisateurs réellement vérifiés KYC (20 Ambassadeurs + 80 Bâtisseurs).
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={loadData}
              disabled={refreshing}
              className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#D4AF37]" : ""}`} />
              Rafraîchir
            </button>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className={`px-3 py-2 border rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all ${
                showLogs 
                  ? "bg-[#D4AF37] text-black font-bold border-[#D4AF37]" 
                  : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Journal Audit ({auditLogs.length})
            </button>
          </div>
        </div>
      </div>

      {/* 📊 SUMMARY COUNTERS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Ambassadeurs (#1 - #20) */}
        <div className="p-4 rounded-2xl bg-black/60 border border-[#D4AF37]/30 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#D4AF37] font-bold flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              Ambassadeurs (#01 - #20)
            </span>
            <span className="text-xs font-mono font-bold text-white">
              {stats.ambassadorCount} / {stats.maxAmbassadors}
            </span>
          </div>
          
          <div className="text-2xl font-black text-white font-mono">
            {stats.ambassadorCount} <span className="text-xs text-zinc-500 font-normal">membres</span>
          </div>

          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-[#D4AF37] to-amber-300 h-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (stats.ambassadorCount / stats.maxAmbassadors) * 100)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono pt-1">
            <span>Pass Elite : 12 Mois (0 FCFA)</span>
            <span className="text-[#D4AF37]">Val. 10 000 F</span>
          </div>
        </div>

        {/* Bâtisseurs (#21 - #100) */}
        <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/30 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-amber-400 font-bold flex items-center gap-1">
              <Building className="w-3.5 h-3.5" />
              Bâtisseurs (#21 - #100)
            </span>
            <span className="text-xs font-mono font-bold text-white">
              {stats.builderCount} / {stats.maxBuilders}
            </span>
          </div>

          <div className="text-2xl font-black text-white font-mono">
            {stats.builderCount} <span className="text-xs text-zinc-500 font-normal">membres</span>
          </div>

          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-amber-400 h-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (stats.builderCount / stats.maxBuilders) * 100)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono pt-1">
            <span>Pass Pro : 6 Mois (0 FCFA)</span>
            <span className="text-amber-400">Val. 5 000 F</span>
          </div>
        </div>

        {/* Total Attribution Bêta */}
        <div className="p-4 rounded-2xl bg-black/60 border border-zinc-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              Total Rangs Attribués
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {stats.totalCount} / 100
            </span>
          </div>

          <div className="text-2xl font-black text-white font-mono">
            {stats.totalCount} <span className="text-xs text-zinc-500 font-normal">/ 100 places</span>
          </div>

          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (stats.totalCount / 100) * 100)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono pt-1">
            <span>Places Restantes :</span>
            <span className="text-white font-bold">{Math.max(0, 100 - stats.totalCount)}</span>
          </div>
        </div>

        {/* Calendrier / Historique Attribution */}
        <div className="p-4 rounded-2xl bg-black/60 border border-zinc-800 space-y-2 relative overflow-hidden">
          <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            Dates de Distribution
          </span>

          <div className="space-y-1 pt-1 font-mono text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Première attribution :</span>
              <span className="text-zinc-200">
                {stats.firstAssignedDate ? new Date(stats.firstAssignedDate).toLocaleDateString("fr-FR") : "Aucune"}
              </span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Plus récente :</span>
              <span className="text-zinc-200">
                {stats.lastAssignedDate ? new Date(stats.lastAssignedDate).toLocaleDateString("fr-FR") : "Aucune"}
              </span>
            </div>
          </div>

          <div className="text-[9px] text-zinc-500 pt-1 font-mono">
            Règles : Attribution stricte par ordre de KYC validé.
          </div>
        </div>
      </div>

      {/* ⚙️ DEPLOYMENT CENTER CONTROLS (SUPER FOUNDER) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Contrôles du Centre de Déploiement — Programme Bêta
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            Source de Vérité Unique
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Toggle Ambassadeurs */}
          <div className="p-3 bg-black/40 rounded-xl border border-zinc-900 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-zinc-200 block">
                Attribution Automatique Ambassadeurs (#01 - #20)
              </span>
              <p className="text-[10px] text-zinc-500 leading-tight">
                Attribué aux 20 premiers utilisateurs dont le KYC est vérifié.
              </p>
            </div>
            <button
              onClick={() => handleToggleDeploymentConfig("ambassadors", !ambassadorsEnabled)}
              disabled={updatingConfig}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${
                ambassadorsEnabled 
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/40" 
                  : "bg-red-600/20 text-red-400 border border-red-500/40"
              }`}
            >
              {ambassadorsEnabled ? "ACTIF 🟢" : "INACTIF 🔴"}
            </button>
          </div>

          {/* Toggle Bâtisseurs */}
          <div className="p-3 bg-black/40 rounded-xl border border-zinc-900 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-zinc-200 block">
                Attribution Automatique Bâtisseurs (#21 - #100)
              </span>
              <p className="text-[10px] text-zinc-500 leading-tight">
                Attribué des rangs #21 à #100 lors de la validation du KYC.
              </p>
            </div>
            <button
              onClick={() => handleToggleDeploymentConfig("builders", !buildersEnabled)}
              disabled={updatingConfig}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${
                buildersEnabled 
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/40" 
                  : "bg-red-600/20 text-red-400 border border-red-500/40"
              }`}
            >
              {buildersEnabled ? "ACTIF 🟢" : "INACTIF 🔴"}
            </button>
          </div>
        </div>
      </div>

      {/* 📜 AUDIT LOGS DRAWER (IF SHOWING) */}
      {showLogs && (
        <div className="p-4 rounded-2xl bg-black border border-[#D4AF37]/30 space-y-3">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
            <h3 className="text-xs font-mono font-bold text-[#D4AF37] uppercase flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Journal d'Audit - Programme Bêta & Attributions
            </h3>
            <button onClick={() => setShowLogs(false)} className="text-xs text-zinc-500 hover:text-white font-mono">
              Fermer ✕
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-zinc-500 font-mono py-4 text-center">
                Aucun journal d'audit enregistré pour le moment.
              </p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-900 text-xs font-mono space-y-1">
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span className="text-[#D4AF37] font-bold">{log.action}</span>
                    <span>{log.timestamp ? new Date(log.timestamp).toLocaleString("fr-FR") : "Récent"}</span>
                  </div>
                  <p className="text-zinc-300 text-[11px]">{log.reason || log.details || "Action administrative"}</p>
                  <div className="text-[9px] text-zinc-500 flex justify-between">
                    <span>Admin : {log.adminEmail || log.adminUid}</span>
                    {log.targetUserId && <span>Cible : {log.targetUserId}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 🔍 SEARCH AND FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, Gombo ID, email, téléphone ou N° de rang..."
            className="w-full pl-10 pr-4 py-2.5 bg-black border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-black p-1 rounded-xl border border-zinc-800 overflow-x-auto no-scrollbar">
          {[
            { id: "ALL", label: `Tous (${stats.totalCount})` },
            { id: "AMBASSADORS", label: `Ambassadeurs (${stats.ambassadorCount})` },
            { id: "BUILDERS", label: `Bâtisseurs (${stats.builderCount})` },
            { id: "ACTIVE", label: "Actifs 🟢" },
            { id: "SUSPENDED", label: "Suspendus ⏸️" },
            { id: "EXPIRED", label: "Expirés ⏳" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase whitespace-nowrap transition-all ${
                activeTab === tab.id 
                  ? "bg-[#D4AF37] text-black font-bold" 
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 📋 MEMBERS LIST (COMPACT MOBILE-FIRST CARDS) */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-[#D4AF37] font-mono text-xs animate-pulse">
            Chargement des membres du Programme Bêta...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center bg-black/40 border border-zinc-900 rounded-2xl space-y-2">
            <Award className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs font-mono text-zinc-400">
              Aucun membre Bêta ne correspond aux critères sélectionnés.
            </p>
            <p className="text-[10px] text-zinc-600">
              L'attribution du rang Bêta se déclenche automatiquement à la validation du KYC d'un utilisateur.
            </p>
          </div>
        ) : (
          filteredMembers.map(member => {
            const isExpanded = expandedUserId === (member.id || member.uid);
            const rankType = member.betaRankType || (member.betaRankNumber && member.betaRankNumber <= 20 ? "AMBASSADOR" : "BUILDER");
            const rankNum = member.betaRankNumber || 0;
            const benefit = member.betaBenefit;
            const benefitStatus = benefit?.status || "active";

            const gomboIdStr = member.gomboIdNumber || (typeof member.gomboId === 'string' ? member.gomboId : member.gomboId?.id) || "N/A";

            return (
              <div 
                key={member.id || member.uid}
                className={`rounded-2xl border transition-all overflow-hidden bg-black ${
                  rankType === "AMBASSADOR" 
                    ? "border-[#D4AF37]/40 shadow-lg shadow-[#D4AF37]/5" 
                    : "border-amber-500/30"
                }`}
              >
                {/* COMPACT CARD HEADER */}
                <div 
                  onClick={() => setExpandedUserId(isExpanded ? null : (member.id || member.uid!))}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-zinc-950/80 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* User Avatar */}
                    <div className="relative shrink-0">
                      <img 
                        src={member.photoURL || member.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.artisticName || member.name || "U")}&background=18181b&color=D4AF37`}
                        alt={member.artisticName || member.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#D4AF37]/50"
                      />
                      <span className="absolute -bottom-1 -right-1 text-[10px]">
                        {rankType === "AMBASSADOR" ? "🏆" : "🏗️"}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white truncate">
                          {member.artisticName || member.name || "Membre Inconnu"}
                        </span>
                        
                        {/* Rank Badge */}
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider ${
                          rankType === "AMBASSADOR" 
                            ? "bg-[#D4AF37] text-black" 
                            : "bg-amber-500 text-black"
                        }`}>
                          #{String(rankNum).padStart(2, '0')} {rankType === "AMBASSADOR" ? "AMBASSADEUR" : "BÂTISSEUR"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400 mt-0.5">
                        <span className="text-[#D4AF37] font-semibold">{gomboIdStr}</span>
                        <span>•</span>
                        <span>KYC Validé 🛡️</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side Status & Chevron */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {/* Benefit Status Pill */}
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase flex items-center gap-1 ${
                      benefitStatus === "active" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" 
                        : benefitStatus === "suspended" 
                        ? "bg-red-500/10 text-red-400 border border-red-500/30" 
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                    }`}>
                      {benefitStatus === "active" && "🟢 ACTIF"}
                      {benefitStatus === "suspended" && "⏸️ SUSPENDU"}
                      {benefitStatus === "expired" && "⏳ EXPIRÉ"}
                    </span>

                    <button className="text-zinc-500 hover:text-white p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* EXPANDED CARD DETAILS */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-zinc-900 bg-zinc-950/90 p-4 space-y-4 text-xs font-mono"
                    >
                      {/* Grid Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {/* Section Identité */}
                        <div className="p-3 rounded-xl bg-black/60 border border-zinc-900 space-y-1">
                          <span className="text-[9px] text-zinc-500 uppercase block font-bold">Identité & Contact</span>
                          <p className="text-white font-bold">{member.name || "N/A"}</p>
                          <p className="text-zinc-400 text-[10px]">Email : {member.email || "Non renseigné"}</p>
                          <p className="text-zinc-400 text-[10px]">Tél : {member.phone || "Non renseigné"}</p>
                        </div>

                        {/* Section Rang Bêta */}
                        <div className="p-3 rounded-xl bg-black/60 border border-zinc-900 space-y-1">
                          <span className="text-[9px] text-zinc-500 uppercase block font-bold">Rang Officiel Bêta</span>
                          <p className="text-[#D4AF37] font-bold">{member.betaRankTitle || (rankType === "AMBASSADOR" ? "AMBASSADEUR DE L'ÉCOSYSTÈME" : "BÂTISSEUR DE L'ÉCOSYSTÈME")}</p>
                          <p className="text-zinc-400 text-[10px]">
                            Position : <span className="text-white font-bold">#{rankNum} / 100</span>
                          </p>
                          <p className="text-zinc-400 text-[10px]">
                            Attribué le : {member.betaRankAssignedAt ? new Date(member.betaRankAssignedAt).toLocaleDateString("fr-FR") : "Validation KYC"}
                          </p>
                        </div>

                        {/* Section Avantage Commercial */}
                        <div className="p-3 rounded-xl bg-black/60 border border-zinc-900 space-y-1">
                          <span className="text-[9px] text-zinc-500 uppercase block font-bold">Avantage & Gratuité</span>
                          <p className="text-emerald-400 font-bold">
                            {rankType === "AMBASSADOR" ? "12 Mois GOMBO ELITE (0 FCFA)" : "6 Mois GOMBO PRO (0 FCFA)"}
                          </p>
                          <p className="text-zinc-400 text-[10px]">
                            Valeur référence : {rankType === "AMBASSADOR" ? "10 000 FCFA" : "5 000 FCFA"}
                          </p>
                          <p className="text-zinc-400 text-[10px]">
                            Expiration : {benefit?.expiresAt ? new Date(benefit.expiresAt).toLocaleDateString("fr-FR") : "12 mois après KYC"}
                          </p>
                        </div>
                      </div>

                      {/* Explicit Rule Note */}
                      <div className="p-2.5 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/20 text-[10px] text-zinc-300 leading-relaxed flex items-start gap-2">
                        <Info className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                        <div>
                          <strong>Garantie Historique Bêta :</strong> Le rang d'honneur #{rankNum} et le badge restent attribués à vie au membre. À l'expiration de la période gratuite, l'accès gratuit s'arrête sans que le membre ne soit redevable d'aucune dette.
                        </div>
                      </div>

                      {/* Admin Action Buttons */}
                      <div className="pt-2 flex flex-wrap gap-2 border-t border-zinc-900 justify-between items-center">
                        <div className="flex items-center gap-2">
                          {onSelectUser && (
                            <button
                              onClick={() => onSelectUser(member.id || member.uid!)}
                              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-[10px] flex items-center gap-1 transition-all"
                            >
                              👁️ Voir Fiche Profil
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {benefitStatus === "active" ? (
                            <button
                              onClick={() => {
                                setActionModal({
                                  type: "SUSPEND",
                                  targetUser: member,
                                  title: "Suspendre l'avantage Bêta",
                                  message: `Êtes-vous sûr de vouloir suspendre les privilèges de ${member.artisticName || member.name} ?`
                                });
                                setActionReason("");
                              }}
                              className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 rounded-lg text-[10px] flex items-center gap-1 transition-all font-bold"
                            >
                              <Pause className="w-3 h-3" />
                              Suspendre Avantage
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setActionModal({
                                  type: "REACTIVATE",
                                  targetUser: member,
                                  title: "Réactiver l'avantage Bêta",
                                  message: `Voulez-vous réactiver l'avantage de ${member.artisticName || member.name} ?`
                                });
                              }}
                              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/40 rounded-lg text-[10px] flex items-center gap-1 transition-all font-bold"
                            >
                              <Play className="w-3 h-3" />
                              Réactiver Avantage
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setActionModal({
                                type: "CORRECT",
                                targetUser: member,
                                title: "Correction Administrative de Rang",
                                message: `Modifier le rang Bêta de ${member.artisticName || member.name} :`
                              });
                              setCorrectRankType(member.betaRankType || "AMBASSADOR");
                              setCorrectRankNumber(member.betaRankNumber || 1);
                              setActionReason("");
                            }}
                            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/30 rounded-lg text-[10px] flex items-center gap-1 transition-all font-bold"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            Corriger Rang / Reclasser
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* ⚠️ CONFIRMATION MODAL FOR ADMINISTRATIVE ACTIONS */}
      <AnimatePresence>
        {actionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-[#D4AF37]/40 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl text-left"
            >
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                <h3 className="text-sm font-mono font-bold text-[#D4AF37] uppercase flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  {actionModal.title}
                </h3>
                <button 
                  onClick={() => setActionModal(null)}
                  className="text-zinc-500 hover:text-white font-mono text-xs"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                {actionModal.message}
              </p>

              {/* Extra Inputs for Rank Correction */}
              {actionModal.type === "CORRECT" && (
                <div className="space-y-3 p-3 bg-black/60 rounded-xl border border-zinc-900 text-xs font-mono">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Nouveau Type de Rang :</label>
                    <select
                      value={correctRankType}
                      onChange={(e) => setCorrectRankType(e.target.value as BetaRankType)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="AMBASSADOR">🏆 AMBASSADEUR (12 mois / 10 000 F)</option>
                      <option value="BUILDER">🏗️ BÂTISSEUR (6 mois / 5 000 F)</option>
                      <option value="NONE">❌ AUCUN (Retirer du programme)</option>
                    </select>
                  </div>

                  {correctRankType !== "NONE" && (
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1">Numéro de Rang (#1 à #100) :</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={correctRankNumber}
                        onChange={(e) => setCorrectRankNumber(parseInt(e.target.value) || 1)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Reason Field */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase font-mono font-bold block">
                  Motif Officiel Journalisé (Obligatoire) :
                </label>
                <textarea
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Expliquez la raison administrative de cette décision..."
                  className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900">
                <button
                  onClick={() => setActionModal(null)}
                  disabled={isSubmittingAction}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-xl text-xs font-mono"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmModalAction}
                  disabled={isSubmittingAction}
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-amber-400 text-black font-bold rounded-xl text-xs font-mono transition-all flex items-center gap-1.5"
                >
                  {isSubmittingAction ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Valider & Enregistrer l'Audit"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
