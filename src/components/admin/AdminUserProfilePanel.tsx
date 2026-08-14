import React, { useState, useEffect } from "react";
import { 
  X, ShieldAlert, Award, CreditCard, ShieldCheck, UserX, UserCheck, 
  BookOpen, FolderHeart, MessageSquare, History, Check, Loader2, ArrowUpRight, ArrowDownLeft,
  Lock, Unlock, RefreshCw, Key, LogOut, Search, Filter, Shield, AlertTriangle, FileText, Phone, Mail, Activity
} from "lucide-react";
import { db, auth } from "../../lib/firebase";
import { 
  doc, updateDoc, collection, query, where, getDocs, getDoc, addDoc, orderBy, limit, serverTimestamp 
} from "firebase/firestore";
import { WalletSecurityService } from "../../lib/WalletSecurityService";
import { logAdminAction } from "../../lib/auditLogger";

interface AdminUserProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  userUid: string;
  onRefreshProfile?: () => void;
}

type FilterCategory = 
  | "TOUT" 
  | "CONNEXIONS" 
  | "WALLET" 
  | "GAWA" 
  | "GOMBOS" 
  | "PUBLICATIONS" 
  | "MESSAGERIE" 
  | "SÉCURITÉ" 
  | "ADMINISTRATION";

export default function AdminUserProfilePanel({
  isOpen,
  onClose,
  userUid,
  onRefreshProfile
}: AdminUserProfilePanelProps) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [secData, setSecData] = useState<any>(null);

  // Filtered Activity Timeline
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [walletHistory, setWalletHistory] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("TOUT");
  const [searchQuery, setSearchQuery] = useState("");

  const [activeTab, setActiveTab] = useState<"identity" | "auth" | "wallet" | "timeline" | "actions">("identity");
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState("");
  const [actionReasonInput, setActionReasonInput] = useState("");
  const [adminNotesList, setAdminNotesList] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen || !userUid) return;
    setLoading(true);
    setActionNotice(null);

    const loadData = async () => {
      try {
        // 1. User Profile Document
        const userRef = doc(db, "users", userUid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const uData = userSnap.data();
          setProfile({ uid: userSnap.id, ...uData });
        }

        // 2. Wallet Security Status via WalletSecurityService
        const sec = await WalletSecurityService.getWalletSecurityStatus(userUid);
        setSecData(sec);

        // 3. User Activity Logs
        try {
          const actQuery = query(
            collection(db, "user_activity_logs"),
            where("uid", "==", userUid)
          );
          const actSnap = await getDocs(actQuery);
          const acts = actSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setActivityLogs(acts);
        } catch {
          setActivityLogs([]);
        }

        // 4. Admin Audit Logs on this user
        try {
          const admQuery = query(
            collection(db, "admin_audit_logs"),
            where("targetUserId", "==", userUid)
          );
          const admSnap = await getDocs(admQuery);
          setAdminLogs(admSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch {
          setAdminLogs([]);
        }

        // 5. Wallet Transactions
        try {
          const txQuery = query(
            collection(db, "walletTransactions"),
            where("uid", "==", userUid)
          );
          const txSnap = await getDocs(txQuery);
          setWalletHistory(txSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch {
          setWalletHistory([]);
        }

        // 6. Admin Notes
        try {
          const notesQuery = query(
            collection(db, "admin_user_notes"),
            where("targetUid", "==", userUid)
          );
          const notesSnap = await getDocs(notesQuery);
          setAdminNotesList(notesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch {
          setAdminNotesList([]);
        }

      } catch (err) {
        console.error("Error loading user profile panel data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, userUid]);

  const currentAdminUid = auth.currentUser?.uid || "SUPER_FOUNDER";
  const currentAdminEmail = auth.currentUser?.email || "superfounder@afrigombo.com";

  // Actions
  const handleLockWallet = async () => {
    try {
      await WalletSecurityService.adminLockWallet(currentAdminUid, userUid, actionReasonInput || "Verrouillage par Super Fondateur");
      setActionNotice("🔒 Wallet de l'utilisateur verrouillé avec succès.");
      setSecData((prev: any) => ({ ...prev, pinStatus: "LOCKED", lockedUntil: new Date(Date.now() + 100 * 365 * 24 * 3600 * 1000).toISOString() }));
      setActionReasonInput("");
      if (onRefreshProfile) onRefreshProfile();
    } catch (err: any) {
      alert("Erreur: " + err.message);
    }
  };

  const handleUnlockWallet = async () => {
    try {
      await WalletSecurityService.adminUnlockWallet(currentAdminUid, userUid, actionReasonInput || "Déverrouillage par Super Fondateur");
      setActionNotice("🔓 Wallet déverrouillé avec succès.");
      setSecData((prev: any) => ({ ...prev, pinStatus: "CONFIGURED", lockedUntil: null, failedPinAttempts: 0 }));
      setActionReasonInput("");
      if (onRefreshProfile) onRefreshProfile();
    } catch (err: any) {
      alert("Erreur: " + err.message);
    }
  };

  const handleRequestPinReset = async () => {
    try {
      await WalletSecurityService.adminRequestPinReset(currentAdminUid, userUid, actionReasonInput || "Demande administrative de réinitialisation du PIN");
      setActionNotice("🔑 Demande de réinitialisation du PIN déclenchée. L'utilisateur devra configurer un nouveau PIN lors de sa prochaine action.");
      setSecData((prev: any) => ({ ...prev, pinStatus: "RESET_PENDING", pinResetRequested: true }));
      setActionReasonInput("");
      if (onRefreshProfile) onRefreshProfile();
    } catch (err: any) {
      alert("Erreur: " + err.message);
    }
  };

  const handleToggleSuspension = async () => {
    if (!profile) return;
    const isNowSuspended = !profile.isSuspended;
    try {
      const userRef = doc(db, "users", userUid);
      await updateDoc(userRef, { isSuspended: isNowSuspended });

      await logAdminAction({
        adminUid: currentAdminUid,
        adminEmail: currentAdminEmail,
        action: isNowSuspended ? "SUSPENSION" : "REACTIVATION",
        targetUserId: userUid,
        reason: actionReasonInput || (isNowSuspended ? "Suspension administrative" : "Réactivation administrative")
      });

      setProfile((prev: any) => ({ ...prev, isSuspended: isNowSuspended }));
      setActionNotice(`Compte ${isNowSuspended ? "⏸️ Suspendu" : "🟢 Réactivé"} avec succès.`);
      setActionReasonInput("");
      if (onRefreshProfile) onRefreshProfile();
    } catch (err: any) {
      alert("Erreur: " + err.message);
    }
  };

  const handleForceLogout = async () => {
    try {
      const userRef = doc(db, "users", userUid);
      await updateDoc(userRef, {
        forceLogoutAt: new Date().toISOString()
      });

      await logAdminAction({
        adminUid: currentAdminUid,
        adminEmail: currentAdminEmail,
        action: "FORCE_LOGOUT",
        targetUserId: userUid,
        reason: actionReasonInput || "Déconnexion forcée par le Super Fondateur"
      });

      setActionNotice("🚪 Déconnexion forcée enregistrée pour cet utilisateur.");
      setActionReasonInput("");
    } catch (err: any) {
      alert("Erreur: " + err.message);
    }
  };

  const handleAddAdminNote = async () => {
    if (!adminNoteInput.trim()) return;
    try {
      const newNote = {
        targetUid: userUid,
        adminUid: currentAdminUid,
        adminEmail: currentAdminEmail,
        note: adminNoteInput,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, "admin_user_notes"), newNote);
      setAdminNotesList(prev => [newNote, ...prev]);
      setAdminNoteInput("");
      setActionNotice("📝 Note administrative ajoutée.");
    } catch (err: any) {
      alert("Erreur lors de l'ajout de la note: " + err.message);
    }
  };

  if (!isOpen) return null;

  // Filter combined timeline items
  const combinedTimeline = [
    ...activityLogs.map(a => ({ ...a, source: "user" })),
    ...adminLogs.map(a => ({ ...a, type: a.action, details: a.reason, source: "admin" })),
    ...walletHistory.map(tx => ({ ...tx, type: "WALLET", details: `Mouvement: ${tx.amount || tx.montant} FCFA`, source: "wallet" }))
  ].sort((a, b) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime());

  const filteredTimeline = combinedTimeline.filter(item => {
    const typeStr = String(item.type || "").toUpperCase();
    if (activeFilter === "CONNEXIONS") return typeStr.includes("CONNEXION") || typeStr.includes("DÉCONNEXION");
    if (activeFilter === "WALLET") return typeStr.includes("WALLET") || typeStr.includes("RETRAIT") || typeStr.includes("TRANSFERT");
    if (activeFilter === "GAWA") return typeStr.includes("GAWA") || typeStr.includes("ACHAT");
    if (activeFilter === "GOMBOS") return typeStr.includes("GOMBO") || typeStr.includes("CANDIDATURE");
    if (activeFilter === "PUBLICATIONS") return typeStr.includes("PUBLICATION");
    if (activeFilter === "MESSAGERIE") return typeStr.includes("MESSAGE");
    if (activeFilter === "SÉCURITÉ") return typeStr.includes("PIN") || typeStr.includes("VERROUILLE") || typeStr.includes("REINITIALISATION") || typeStr.includes("SUSPENSION");
    if (activeFilter === "ADMINISTRATION") return item.source === "admin";
    return true;
  }).filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(item.type || "").toLowerCase().includes(q) ||
      String(item.details || "").toLowerCase().includes(q) ||
      String(item.reason || "").toLowerCase().includes(q)
    );
  });

  const walletSolde = profile?.wallet?.soldeDisponible ?? profile?.balance ?? 0;
  const walletBloque = profile?.wallet?.soldeBloque ?? 0;
  const walletRevenus = profile?.wallet?.revenus ?? profile?.totalRevenue ?? 0;
  const isWalletLocked = secData?.pinStatus === "LOCKED" || profile?.wallet?.walletStatus === "suspended";

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-3 sm:p-6 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-950 border border-[#D4AF37]/50 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl relative text-zinc-100 overflow-hidden cursor-default"
      >
        {/* Top Glow Accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-900/60 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-amber-600 p-0.5 shadow-lg shadow-[#D4AF37]/20">
              <img 
                src={profile?.avatarUrl || profile?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
                alt="" 
                className="w-full h-full object-cover rounded-[14px]"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">{profile?.firstName || ""} {profile?.lastName || "Utilisateur"}</h3>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${profile?.isSuspended ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'}`}>
                  {profile?.isSuspended ? "⏸️ Suspendu" : "🟢 Actif"}
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 uppercase font-bold">
                  {profile?.role || "Client"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">UID: {userUid}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-[#D4AF37] text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Notification Banner */}
        {actionNotice && (
          <div className="px-5 py-3 bg-emerald-950/60 border-b border-emerald-500/40 flex items-center gap-2.5 text-xs text-emerald-300 font-mono shrink-0">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/40 p-1.5 gap-1 shrink-0 overflow-x-auto">
          {[
            { id: "identity", label: "👤 Identité" },
            { id: "auth", label: "🔑 Auth" },
            { id: "wallet", label: "💳 Wallet" },
            { id: "timeline", label: "📜 Journal Activity" },
            { id: "actions", label: "⚡ Actions Admins" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setActionNotice(null); }}
              className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? "bg-[#D4AF37] text-zinc-950 shadow-md" 
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-left">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin mx-auto" />
              <p className="text-xs font-mono text-zinc-400">Chargement de la fiche souveraine...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: IDENTITÉ */}
              {activeTab === "identity" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                      <span className="text-zinc-500 block text-[9px] uppercase">Nom & Prénom</span>
                      <span className="font-bold text-white text-sm block mt-0.5">{profile?.firstName || "-"} {profile?.lastName || "-"}</span>
                    </div>
                    <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                      <span className="text-zinc-500 block text-[9px] uppercase">Email</span>
                      <span className="font-bold text-white text-sm block truncate mt-0.5">{profile?.email || "Non renseigné"}</span>
                    </div>
                    <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                      <span className="text-zinc-500 block text-[9px] uppercase">AfriID</span>
                      <span className="font-bold text-[#D4AF37] text-sm block mt-0.5">{profile?.afriId || profile?.id || "N/A"}</span>
                    </div>
                    <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                      <span className="text-zinc-500 block text-[9px] uppercase">Commune / Ville</span>
                      <span className="font-bold text-white text-sm block mt-0.5">{profile?.commune || profile?.city || "Abidjan"}</span>
                    </div>
                    <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                      <span className="text-zinc-500 block text-[9px] uppercase">Rôle Actuel</span>
                      <span className="font-bold text-white text-sm block mt-0.5 uppercase">{profile?.role || "Client"}</span>
                    </div>
                    <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                      <span className="text-zinc-500 block text-[9px] uppercase">Statut Compte</span>
                      <span className={`font-bold text-sm block mt-0.5 ${profile?.isSuspended ? "text-red-400" : "text-emerald-400"}`}>
                        {profile?.isSuspended ? "Suspendu" : "Actif"}
                      </span>
                    </div>
                    <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl sm:col-span-2">
                      <span className="text-zinc-500 block text-[9px] uppercase">Date de création du compte</span>
                      <span className="font-bold text-white block mt-0.5">
                        {profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : "Récemment"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: AUTHENTIFICATION */}
              {activeTab === "auth" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                      <span className="text-zinc-500 block text-[9px] uppercase">Fournisseur Principal</span>
                      <span className="font-bold text-white text-sm uppercase block mt-0.5">{profile?.provider || profile?.providerId || "google.com"}</span>
                    </div>
                    <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                      <span className="text-zinc-500 block text-[9px] uppercase">Dernière Connexion</span>
                      <span className="font-bold text-white block mt-0.5">
                        {profile?.lastLoginAt || profile?.lastActive ? new Date(profile.lastLoginAt || profile.lastActive).toLocaleString() : "En ligne"}
                      </span>
                    </div>
                    <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                      <span className="text-zinc-500 block text-[9px] uppercase">Dernière Déconnexion</span>
                      <span className="font-bold text-white block mt-0.5">
                        {profile?.lastLogoutAt ? new Date(profile.lastLogoutAt).toLocaleString() : "N/A"}
                      </span>
                    </div>
                    <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                      <span className="text-zinc-500 block text-[9px] uppercase">Session Active</span>
                      <span className="font-bold text-emerald-400 block mt-0.5">Oui (En ligne)</span>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-xs text-amber-300 font-mono">
                    <Shield className="w-5 h-5 text-[#D4AF37] shrink-0" />
                    <span>Sécurité Souveraine : Même en tant que Super Fondateur, aucun secret (mot de passe Firebase, hash PIN, jetons d'accès OAuth) n'est jamais accessible ni affiché.</span>
                  </div>
                </div>
              )}

              {/* TAB 3: WALLET & SÉCURITÉ */}
              {activeTab === "wallet" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-5 rounded-2xl bg-gradient-to-tr from-zinc-900 to-zinc-950 border border-[#D4AF37]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-widest font-bold">Code Wallet / Statut</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-mono font-black text-white bg-zinc-950 px-3 py-1 rounded-xl border border-zinc-800">{profile?.wallet?.walletCode || "AFW-GAWA"}</span>
                        <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold uppercase ${isWalletLocked ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'}`}>
                          {isWalletLocked ? '■ Verrouillé / Suspendu' : '● Actif'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Solde Gawa Disponible</span>
                      <span className="text-2xl font-display font-black text-[#D4AF37]">{walletSolde.toLocaleString()} FCFA</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                      <span className="text-zinc-500 block text-[9px] uppercase">Solde Bloqué</span>
                      <span className="font-bold text-white text-sm">{walletBloque.toLocaleString()} FCFA</span>
                    </div>
                    <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                      <span className="text-zinc-500 block text-[9px] uppercase">Revenus Totaux</span>
                      <span className="font-bold text-emerald-400 text-sm">{walletRevenus.toLocaleString()} FCFA</span>
                    </div>
                    <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                      <span className="text-zinc-500 block text-[9px] uppercase">PIN Configuré ?</span>
                      <span className={`font-bold text-sm ${secData?.pinConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {secData?.pinConfigured ? "Oui (Sécurisé)" : "Non"}
                      </span>
                    </div>
                    <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                      <span className="text-zinc-500 block text-[9px] uppercase">Tentatives Échouées</span>
                      <span className={`font-bold text-sm ${secData?.failedPinAttempts > 0 ? 'text-red-400' : 'text-white'}`}>
                        {secData?.failedPinAttempts || 0}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                      <span className="text-zinc-500 block text-[9px] uppercase">Création du PIN</span>
                      <span className="font-bold text-white block mt-0.5">
                        {secData?.pinCreatedAt ? new Date(secData.pinCreatedAt).toLocaleString() : "N/A"}
                      </span>
                    </div>
                    <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                      <span className="text-zinc-500 block text-[9px] uppercase">Dernière Modification PIN</span>
                      <span className="font-bold text-white block mt-0.5">
                        {secData?.pinUpdatedAt ? new Date(secData.pinUpdatedAt).toLocaleString() : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: JOURNAL D'ACTIVITÉ */}
              {activeTab === "timeline" && (
                <div className="space-y-4 animate-in fade-in">
                  {/* Search and Filters */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Rechercher dans l'historique..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        "TOUT", "CONNEXIONS", "WALLET", "GAWA", "GOMBOS", "PUBLICATIONS", "MESSAGERIE", "SÉCURITÉ", "ADMINISTRATION"
                      ].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setActiveFilter(cat as FilterCategory)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                            activeFilter === cat 
                              ? "bg-[#D4AF37] text-zinc-950 font-black" 
                              : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timeline Stream */}
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {filteredTimeline.length === 0 ? (
                      <div className="p-8 text-center border border-zinc-800 rounded-2xl bg-zinc-900/30 text-zinc-500 font-mono text-xs">
                        Aucun événement correspondant dans le journal.
                      </div>
                    ) : (
                      filteredTimeline.map((item, idx) => (
                        <div key={idx} className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl font-mono text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white uppercase">{item.type || "ÉVÉNEMENT"}</span>
                            <span className="text-[10px] text-zinc-400">
                              {item.timestamp ? new Date(item.timestamp).toLocaleString() : "Récemment"}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-300">{item.details || item.reason || "Action enregistrée"}</p>
                          {item.source === "admin" && (
                            <span className="text-[9px] text-[#D4AF37] font-bold block uppercase">Action Administrative ({item.adminEmail || "Admin"})</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: ACTIONS DU SUPER FONDATEUR */}
              {activeTab === "actions" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-3">
                    <span className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider block">⚡ Actions Souveraines de Contrôle</span>

                    <input
                      type="text"
                      placeholder="Motif administratif obligatoire..."
                      value={actionReasonInput}
                      onChange={(e) => setActionReasonInput(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={isWalletLocked ? handleUnlockWallet : handleLockWallet}
                        className={`py-2.5 px-4 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                          isWalletLocked 
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" 
                            : "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                        }`}
                      >
                        {isWalletLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        <span>{isWalletLocked ? "Déverrouiller Wallet" : "Verrouiller Wallet"}</span>
                      </button>

                      <button
                        onClick={handleRequestPinReset}
                        className="py-2.5 px-4 bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/25 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Déclencher Réinitialisation PIN</span>
                      </button>

                      <button
                        onClick={handleToggleSuspension}
                        className={`py-2.5 px-4 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                          profile?.isSuspended 
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" 
                            : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                        }`}
                      >
                        <ShieldAlert className="w-4 h-4" />
                        <span>{profile?.isSuspended ? "Réactiver le Compte" : "Suspendre le Compte"}</span>
                      </button>

                      <button
                        onClick={handleForceLogout}
                        className="py-2.5 px-4 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <LogOut className="w-4 h-4 text-amber-400" />
                        <span>Forcer Déconnexion</span>
                      </button>
                    </div>
                  </div>

                  {/* Admin Notes */}
                  <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-3">
                    <span className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider block">📝 Notes Administratives Souveraines</span>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ajouter une note confidentielle..."
                        value={adminNoteInput}
                        onChange={(e) => setAdminNoteInput(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                      />
                      <button
                        onClick={handleAddAdminNote}
                        className="px-4 py-2.5 bg-[#D4AF37] text-zinc-950 font-bold rounded-xl text-xs uppercase font-mono cursor-pointer shadow-md"
                      >
                        Ajouter
                      </button>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {adminNotesList.length === 0 ? (
                        <p className="text-xs font-mono text-zinc-500 italic">Aucune note enregistrée pour cet utilisateur.</p>
                      ) : (
                        adminNotesList.map((n, i) => (
                          <div key={i} className="p-2.5 bg-zinc-950 border border-zinc-800/80 rounded-xl text-xs font-mono space-y-1">
                            <p className="text-zinc-200">{n.note}</p>
                            <span className="text-[9px] text-zinc-500 block">{n.adminEmail} • {new Date(n.createdAt).toLocaleString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex justify-end shrink-0 relative z-10">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-mono font-bold uppercase rounded-xl border border-zinc-800 transition-all cursor-pointer"
          >
            Fermer Fiche
          </button>
        </div>
      </div>
    </div>
  );
}
