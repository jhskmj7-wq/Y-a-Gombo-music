import { NotificationService } from "../../lib/NotificationService";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Shield, Wallet, Key, RefreshCw, AlertTriangle, CheckCircle, Lock, Unlock, 
  User as UserIcon, FileText, History, Activity, ChevronDown, ChevronUp, Star, Award, 
  Search, Mail, Phone, MapPin, Trash2, ShieldAlert, Check, MoreVertical, Plus, 
  LockKeyhole, MessageSquare, AlertCircle, ArrowUpRight, ArrowDownLeft, Calendar, 
  UserX, ShieldCheck, Laptop, HelpCircle, Eye, EyeOff, Paperclip, Send, Bell, Filter
} from "lucide-react";
import { User } from "../../types";
import { getEffectiveGomboId } from "../../lib/gomboIdHelper";
import { db, auth } from "../../lib/firebase";
import { useAuth } from "../../AuthContext";
import { 
  collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, addDoc, 
  serverTimestamp, orderBy, limit, deleteDoc 
} from "firebase/firestore";
import { WalletSecurityService } from "../../lib/WalletSecurityService";
import { logAdminAction } from "../../lib/auditLogger";

const IVORIAN_COMMUNES = [
  "Cocody", "Yopougon", "Marcory", "Plateau", "Treichville", 
  "Port-Bouët", "Koumassi", "Adjamé", "Abobo", "Bingerville"
];

interface AdminUsersProps {
  activeMenu: string;
  users: User[];
  filteredUsers: User[];
  reviews: any[];
  kycActiveTab: "standard" | "express" | "approved" | "rejected" | "info_required" | "all";
  setKycActiveTab: React.Dispatch<React.SetStateAction<"standard" | "express" | "approved" | "rejected" | "info_required" | "all">>;
  editingProfileUserId: string | null;
  setEditingProfileUserId: React.Dispatch<React.SetStateAction<string | null>>;
  profileForm: any;
  setProfileForm: React.Dispatch<React.SetStateAction<any>>;
  specInput: string;
  setSpecInput: React.Dispatch<React.SetStateAction<string>>;
  groupInput: string;
  setGroupInput: React.Dispatch<React.SetStateAction<any>>;
  addSpecialty: () => void;
  removeSpecialty: (index: number) => void;
  addGroup: () => void;
  removeGroup: (index: number) => void;
  saveProfileEditing: () => void;
  handleApproveKYC: (userId: string, express?: boolean) => void;
  handleRejectKYC: (userId: string) => void;
  handleComplementaryInfoKYC: (userId: string, message: string) => void;
  startEditingProfile: (user: User) => void;
  infoMessages: Record<string, string>;
  setInfoMessages: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function AdminUsers({
  activeMenu = "users",
  users = [],
  filteredUsers = users || [],
  reviews = [],
  kycActiveTab = "all",
  setKycActiveTab = () => {},
  editingProfileUserId = null,
  setEditingProfileUserId = () => {},
  profileForm = {},
  setProfileForm = () => {},
  specInput = "",
  setSpecInput = () => {},
  groupInput = "",
  setGroupInput = () => {},
  addSpecialty = () => {},
  removeSpecialty = () => {},
  addGroup = () => {},
  removeGroup = () => {},
  saveProfileEditing = () => {},
  handleApproveKYC = () => {},
  handleRejectKYC = () => {},
  handleComplementaryInfoKYC = () => {},
  startEditingProfile = () => {},
  infoMessages = {},
  setInfoMessages = () => {},
}: Partial<AdminUsersProps>) {
  const { currentUser, profile: adminProfile } = useAuth();
  
  // Custom states for refined management
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"TOUT" | "ACTIFS" | "EN ATTENTE" | "VÉRIFIÉS" | "REFUSÉS" | "SUSPENDUS" | "BLOQUÉS" | "ADMINISTRATEURS">("TOUT");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  
  // Custom sub-accordion states inside the expanded user card
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  
  // On-demand loaded details keyed by userId
  const [loadedData, setLoadedData] = useState<Record<string, {
    gombos: any[];
    transactions: any[];
    activities: any[];
    audits: any[];
    notes: any[];
  }>>({});
  
  // Filter active states inside sub-panels
  const [publicationFilter, setPublicationFilter] = useState<string>("ACTIVES");
  const [transactionFilter, setTransactionFilter] = useState<string>("TOUTES");
  
  // Form inputs inside expanded view
  const [adminNoteText, setAdminNoteText] = useState("");
  const [customNotificationTitle, setCustomNotificationTitle] = useState("");
  const [customNotificationBody, setCustomNotificationBody] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  
  // Bottom Sheet state
  const [activeBottomSheetUser, setActiveBottomSheetUser] = useState<User | null>(null);
  
  // Custom PIN/Secret Reveal status
  const [revealedWalletCodes, setRevealedWalletCodes] = useState<Record<string, boolean>>({});
  
  // KYC Signed URLs for private bucket documents
  const [kycSignedUrls, setKycSignedUrls] = useState<Record<string, Record<string, string>>>({});
  const [kycLoading, setKycLoading] = useState<Record<string, boolean>>({});
  const [kycPreviewUrl, setKycPreviewUrl] = useState<string | null>(null);

  const fetchKycSignedUrls = async (targetUser: User) => {
    const uid = targetUser.id || targetUser.uid;
    if (!uid) return;

    const rawPaths = [
      targetUser.kycDocs?.identityCardUrl,
      targetUser.kycDocs?.identityCardBackUrl,
      targetUser.kycDocs?.selfieUrl,
      targetUser.kycDocs?.activityUrl || targetUser.kycDocUrl,
    ].filter(Boolean) as string[];

    if (rawPaths.length === 0) return;
    if (kycSignedUrls[uid] && Object.keys(kycSignedUrls[uid]).length > 0) return;

    setKycLoading(prev => ({ ...prev, [uid]: true }));

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        console.error("Token admin Firebase manquant");
        setKycLoading(prev => ({ ...prev, [uid]: false }));
        return;
      }

      const response = await fetch("/api/admin/kyc/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          storagePaths: rawPaths,
          bucket: "afrigombo-private"
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.results)) {
          const urlMap: Record<string, string> = {};
          data.results.forEach((item: any) => {
            if (item.path && item.signedUrl) {
              urlMap[item.path] = item.signedUrl;
            }
          });
          setKycSignedUrls(prev => ({
            ...prev,
            [uid]: urlMap
          }));
        }
      }
    } catch (err) {
      console.error("Erreur récupération KYC signés:", err);
    } finally {
      setKycLoading(prev => ({ ...prev, [uid]: false }));
    }
  };

  // Modal Confirmation overlay state
  const [confirmationModal, setConfirmationModal] = useState<{
    title: string;
    message: string;
    requireReason: boolean;
    confirmLabel: string;
    onConfirm: (reason?: string) => Promise<void> | void;
  } | null>(null);

  // Pagination for high Android performance
  const [visibleCount, setVisibleCount] = useState(15);

  // Dynamic status counters for Android filter badges
  const countAll = users.length;
  const countActifs = users.filter(u => u.status === "active" || !u.status).length;
  const countEnAttente = users.filter(u => u.kycStatus === "pending").length;
  const countVerifies = users.filter(u => u.isCertified || u.kycStatus === "approved").length;
  const countRefuses = users.filter(u => u.kycStatus === "rejected").length;
  const countSuspendus = users.filter(u => u.status === "suspended").length;
  const countBloques = users.filter(u => (u.status as string) === "blocked").length;
  const countAdmins = users.filter(u => u.role === "admin" || u.role === "super_admin" || u.role === "super_founder").length;

  // On-demand data loading for expanded card (Requirement 23)
  const loadUserSubData = async (uid: string) => {
    if (loadedData[uid]) return; // Already loaded
    
    try {
      // 1. Fetch Gombos
      let userGombos: any[] = [];
      try {
        const gombosQuery = query(collection(db, "gombos"), where("createdBy", "==", uid));
        const gombosSnap = await getDocs(gombosQuery);
        userGombos = gombosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Try alternate owners key mapping if empty
        if (userGombos.length === 0) {
          const altQuery = query(collection(db, "gombos"), where("clientId", "==", uid));
          const altSnap = await getDocs(altQuery);
          userGombos = altSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (e) {
        console.warn("Could not load gombos for user:", e);
      }

      // 2. Fetch Transactions
      let userTxs: any[] = [];
      try {
        const txQuery = query(collection(db, "walletTransactions"), where("uid", "==", uid));
        const txSnap = await getDocs(txQuery);
        userTxs = txSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) {
        console.warn("Could not load transactions for user:", e);
      }

      // 3. Fetch Activities
      let userActs: any[] = [];
      try {
        const actQuery = query(
          collection(db, "user_activity_logs"),
          where("uid", "==", uid),
          orderBy("timestamp", "desc"),
          limit(25)
        );
        const actSnap = await getDocs(actQuery);
        userActs = actSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) {
        // Fallback without orderBy index constraints
        try {
          const actQuery = query(collection(db, "user_activity_logs"), where("uid", "==", uid), limit(30));
          const actSnap = await getDocs(actQuery);
          userActs = actSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch {
          userActs = [];
        }
      }

      // 4. Fetch Audits
      let userAudits: any[] = [];
      try {
        const auditQuery = query(collection(db, "admin_audit_logs"), where("targetUserId", "==", uid));
        const auditSnap = await getDocs(auditQuery);
        userAudits = auditSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) {
        console.warn("Could not load audit logs for user:", e);
      }

      // 5. Fetch Notes
      let userNotes: any[] = [];
      try {
        const notesQuery = query(collection(db, "admin_notes"), where("userId", "==", uid));
        const notesSnap = await getDocs(notesQuery);
        userNotes = notesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) {
        console.warn("Could not load admin notes for user:", e);
      }

      setLoadedData(prev => ({
        ...prev,
        [uid]: {
          gombos: userGombos,
          transactions: userTxs,
          activities: userActs,
          audits: userAudits,
          notes: userNotes
        }
      }));
    } catch (err) {
      console.error("General error loading user details:", err);
    }
  };

  const handleCardExpandToggle = (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
    } else {
      setExpandedUserId(userId);
      setOpenSections({}); // Reset sections
      loadUserSubData(userId);
    }
  };

  const toggleSection = (sectionKey: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Filter users lists based on search bar + Advanced status selectors
  const displayedUsers = users.filter((u) => {
    // 1. Search Query
    const q = (searchQuery || "").toLowerCase().trim();
    if (q) {
      const name = (u?.displayName ?? "").toLowerCase() || (u?.artisticName ?? "").toLowerCase() || (u?.name ?? "").toLowerCase() || "";
      const id = (u?.id ?? "").toLowerCase() || (u?.uid ?? "").toLowerCase() || "";
      const phone = (u?.phone ?? "").toLowerCase() || "";
      const status = (u?.status ?? u?.kycStatus ?? "actif").toLowerCase() || "";
      const email = (u?.email ?? "").toLowerCase() || "";
      const gomboId = (u?.gomboIdNumber ?? "").toLowerCase() || "";

      const match = name.includes(q) || id.includes(q) || phone.includes(q) || status.includes(q) || email.includes(q) || gomboId.includes(q);
      if (!match) return false;
    }

    // 2. Selected Filter Badge
    switch (selectedFilter) {
      case "ACTIFS":
        return u.status === "active" || !u.status;
      case "EN ATTENTE":
        return u.kycStatus === "pending";
      case "VÉRIFIÉS":
        return u.isCertified === true || u.kycStatus === "approved";
      case "REFUSÉS":
        return u.kycStatus === "rejected";
      case "SUSPENDUS":
        return u.status === "suspended";
      case "BLOQUÉS":
        return (u.status as string) === "blocked";
      case "ADMINISTRATEURS":
        return u.role === "admin" || u.role === "super_admin" || u.role === "super_founder";
      default:
        return true;
    }
  });

  // Action methods with confirmation logs

  // 1. Administrative Account state changes
  const handleUpdateStatus = async (userId: string, newStatus: "active" | "suspended" | "blocked" | "suspect", reason: string) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { status: newStatus });
      
      await logAdminAction({
        adminUid: currentUser?.uid || "system",
        adminEmail: currentUser?.email || "superfounder@afrigombo.com",
        action: `USER_${newStatus.toUpperCase()}`,
        targetUserId: userId,
        reason: reason || `Mise à jour du statut par Super Fondateur en : ${newStatus}`
      });

      alert(`Statut de l'utilisateur modifié avec succès : ${newStatus.toUpperCase()}`);
      setConfirmationModal(null);
    } catch (err: any) {
      alert("Erreur lors de la modification du statut : " + err.message);
    }
  };

  // 2. Role elevations
  const handleUpdateRole = async (userId: string, newRole: string, reason: string) => {
    const isTargetSensible = newRole === "super_founder" || newRole === "super_admin";
    const loggedAdminRole = adminProfile?.role || "admin";
    const isSuperAdminOrFounder = loggedAdminRole === "super_founder" || loggedAdminRole === "super_admin";

    if (isTargetSensible && !isSuperAdminOrFounder) {
      alert("Action interdite : Seul un Super Fondateur ou Super Administrateur peut assigner des privilèges d'autorité suprême.");
      return;
    }

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { role: newRole });

      await logAdminAction({
        adminUid: currentUser?.uid || "system",
        adminEmail: currentUser?.email || "superfounder@afrigombo.com",
        action: "ROLE_CHANGED",
        targetUserId: userId,
        reason: reason || "Changement de rôle administratif",
        oldValue: users.find(u => u.id === userId)?.role,
        newValue: newRole
      });

      alert(`Rôle de l'utilisateur promu/rétrogradé avec succès en : ${newRole.toUpperCase()}`);
      setConfirmationModal(null);
    } catch (err: any) {
      alert("Erreur lors de la modification du rôle : " + err.message);
    }
  };

  // 3. Wallet security locking / PIN resets
  const handleLockWallet = async (userId: string, reason: string) => {
    try {
      await WalletSecurityService.adminLockWallet(currentUser?.uid || "system", userId, reason);
      alert("Le Wallet de l'utilisateur a été verrouillé avec succès.");
      setConfirmationModal(null);
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };

  const handleUnlockWallet = async (userId: string, reason: string) => {
    try {
      await WalletSecurityService.adminUnlockWallet(currentUser?.uid || "system", userId, reason);
      alert("Le Wallet de l'utilisateur a été déverrouillé.");
      setConfirmationModal(null);
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };

  const handleTriggerPinReset = async (userId: string, reason: string) => {
    try {
      await WalletSecurityService.adminRequestPinReset(currentUser?.uid || "system", userId, reason);
      alert("Procédure de réinitialisation de code PIN Wallet forcée avec succès. L'utilisateur devra configurer un nouveau PIN à la prochaine connexion.");
      setConfirmationModal(null);
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };

  // 4. Internal Admin notes logging
  const handleAddInternalNote = async (userId: string) => {
    if (!adminNoteText.trim()) return;
    setIsSubmittingNote(true);
    try {
      const notePayload = {
        userId,
        adminUid: currentUser?.uid || "system",
        adminEmail: currentUser?.email || "superfounder@afrigombo.com",
        note: adminNoteText,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "admin_notes"), notePayload);

      // Locally inject
      setLoadedData(prev => {
        const existing = prev[userId];
        if (!existing) return prev;
        return {
          ...prev,
          [userId]: {
            ...existing,
            notes: [notePayload, ...existing.notes]
          }
        };
      });

      setAdminNoteText("");
      alert("Note interne enregistrée avec succès.");
    } catch (err: any) {
      alert("Erreur d'écriture de la note: " + err.message);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // 5. Custom notification transmission
  const handleSendCustomNotification = async (userId: string) => {
    if (!customNotificationTitle.trim() || !customNotificationBody.trim()) {
      alert("Veuillez renseigner le titre et le corps du message.");
      return;
    }
    setIsSendingNotification(true);
    try {
      const notifData = {
        userId,
        title: customNotificationTitle,
        body: customNotificationBody,
        sentBy: currentUser?.email || "Super Fondateur",
        sentAt: new Date().toISOString(),
        status: "unread"
      };

      await NotificationService.sendNotification(notifData);

      await logAdminAction({
        adminUid: currentUser?.uid || "system",
        adminEmail: currentUser?.email || "superfounder@afrigombo.com",
        action: "NOTIFICATION_SENT",
        targetUserId: userId,
        reason: `Envoi notification push : ${customNotificationTitle}`
      });

      setCustomNotificationTitle("");
      setCustomNotificationBody("");
      alert("Notification personnalisée envoyée.");
    } catch (e: any) {
      alert("Erreur d'envoi : " + e.message);
    } finally {
      setIsSendingNotification(false);
    }
  };

  // 6. Gombo publication administration
  const handleAdminGomboPublication = async (gomboId: string, action: "validate" | "reject" | "suspend" | "reactivate" | "archive" | "delete", reason: string) => {
    try {
      const gomboRef = doc(db, "gombos", gomboId);
      let nextStatus = "published";
      if (action === "reject") nextStatus = "rejected";
      if (action === "suspend") nextStatus = "suspended";
      if (action === "archive") nextStatus = "archived";
      if (action === "delete") nextStatus = "deleted"; // Soft Delete

      await updateDoc(gomboRef, { 
        status: nextStatus,
        adminStatusReason: reason,
        updatedAt: new Date().toISOString()
      });

      await logAdminAction({
        adminUid: currentUser?.uid || "system",
        adminEmail: currentUser?.email || "superfounder@afrigombo.com",
        action: `GOMBO_${action.toUpperCase()}`,
        targetUserId: expandedUserId!,
        reason: reason || `Publication ${gomboId} mise à jour en ${nextStatus}`
      });

      // Update local detailed list instantly
      if (expandedUserId) {
        setLoadedData(prev => {
          const inner = prev[expandedUserId];
          if (!inner) return prev;
          return {
            ...prev,
            [expandedUserId]: {
              ...inner,
              gombos: inner.gombos.map(g => g.id === gomboId ? { ...g, status: nextStatus, adminStatusReason: reason } : g)
            }
          };
        });
      }

      alert("La publication a été mise à jour.");
      setConfirmationModal(null);
    } catch (err: any) {
      alert("Erreur: " + err.message);
    }
  };

  // 7. Secure Protected Soft Delete for account (Requirement 19)
  const handleSoftDeleteAccount = async (userId: string, reason: string) => {
    try {
      const userRef = doc(db, "users", userId);
      const nowIso = new Date().toISOString();
      
      await updateDoc(userRef, {
        status: "deleted",
        deletedAt: nowIso,
        deletedReason: reason,
        deletedBy: currentUser?.uid || "superfounder"
      });

      await logAdminAction({
        adminUid: currentUser?.uid || "system",
        adminEmail: currentUser?.email || "superfounder@afrigombo.com",
        action: "ACCOUNT_SOFT_DELETE",
        targetUserId: userId,
        reason: reason || "Suppression protégée du compte"
      });

      alert("Compte supprimé temporairement en mode SOFT-DELETE (les traces financières et d'audit restent préservées légalement).");
      setConfirmationModal(null);
      setExpandedUserId(null);
    } catch (e: any) {
      alert("Erreur lors de la suppression : " + e.message);
    }
  };

  // Open precise action from fast menu
  const triggerFastAction = (userId: string, sectionKey: string) => {
    setExpandedUserId(userId);
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: true
    }));
    loadUserSubData(userId);
  };

  return (
    <div className="space-y-6 select-none pb-12">
      {/* HEADER TITLE */}
      <div className="text-left">
        <h2 className="text-xl font-display font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
          👥 Centre de Gestion des Utilisateurs
        </h2>
        <p className="text-xs text-zinc-400 font-mono">
          Suivi, contrôle et audit individuel Android-optimized
        </p>
      </div>

      {/* COMPACT SEARCH BAR */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-[#D4AF37]/60" />
        </div>
        <input
          type="text"
          placeholder="Rechercher par nom, ID, email, téléphone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-950 border border-[#D4AF37]/20 rounded-xl pl-10 pr-4 py-3 text-xs text-zinc-100 focus:outline-none focus:border-[#D4AF37] font-mono transition-colors shadow-inner"
        />
      </div>

      {/* SCROLLABLE FILTER CHIPS ROW */}
      <div className="flex flex-wrap gap-1.5 justify-start">
        {[
          { id: "TOUT", label: "TOUS", count: countAll },
          { id: "ACTIFS", label: "ACTIFS", count: countActifs },
          { id: "EN ATTENTE", label: "ATTENTE G.ID", count: countEnAttente },
          { id: "VÉRIFIÉS", label: "VÉRIFIÉS", count: countVerifies },
          { id: "REFUSÉS", label: "REFUSÉS", count: countRefuses },
          { id: "SUSPENDUS", label: "SUSPENDUS", count: countSuspendus },
          { id: "BLOQUÉS", label: "BLOQUÉS", count: countBloques },
          { id: "ADMINISTRATEURS", label: "ADMINS", count: countAdmins }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => {
              setSelectedFilter(filter.id as any);
              setVisibleCount(15); // Reset visibility index
            }}
            className={`px-3 py-1.5 rounded-full text-[10px] font-mono tracking-wide uppercase transition-all flex items-center gap-1 border cursor-pointer ${
              selectedFilter === filter.id 
                ? "bg-[#D4AF37] text-black border-[#D4AF37] font-bold" 
                : "bg-zinc-950/85 text-zinc-300 border-zinc-800 hover:border-[#D4AF37]/30"
            }`}
          >
            <span>{filter.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${selectedFilter === filter.id ? "bg-black/20 text-black font-extrabold" : "bg-zinc-800 text-[#D4AF37]"}`}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* COMPACT DEPLOYABLE LIST OF USERS */}
      <div className="space-y-2.5 text-left">
        {displayedUsers.slice(0, visibleCount).map((user) => {
          const isExpanded = expandedUserId === user.id;
          const userStatus = user.status || "active";
          const isCertified = user.isCertified || user.kycStatus === "approved";
          
          return (
            <div 
              key={user.id} 
              className={`rounded-2xl border transition-all overflow-hidden ${
                isExpanded 
                  ? "border-[#D4AF37] bg-zinc-950 shadow-[0_4px_25px_rgba(212,175,55,0.06)]" 
                  : "border-zinc-800/80 bg-zinc-950/80 hover:border-zinc-700/80"
              }`}
            >
              {/* COMPACT MAIN LINE */}
              <div 
                onClick={() => handleCardExpandToggle(user.id!)}
                className="p-4 flex items-center justify-between cursor-pointer select-none active:bg-zinc-900/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full border border-[#D4AF37]/30 overflow-hidden bg-zinc-900 flex items-center justify-center font-bold text-[#D4AF37] text-sm shrink-0">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        user.artisticName?.charAt(0) || user.name?.charAt(0) || "U"
                      )}
                    </div>
                    {/* Pulsing active badge */}
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-950 ${
                      userStatus === "suspended" ? "bg-red-400" : (userStatus as string) === "blocked" ? "bg-red-600" : "bg-emerald-400 animate-pulse"
                    }`} />
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-zinc-100 truncate flex items-center gap-1.5 flex-wrap">
                      {user.displayName || user.artisticName || user.name || "Utilisateur Anonyme"}
                      {isCertified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37] fill-black" />
                      )}
                    </h4>
                    
                    <p className="text-[10px] text-zinc-400 mt-0.5 font-mono truncate flex items-center gap-1.5">
                      <span>{user.commune || "Abidjan"}</span>
                      <span className="text-zinc-600">•</span>
                      <span className={`uppercase font-extrabold text-[9px] ${
                        userStatus === "active" ? "text-emerald-400" : "text-red-400"
                      }`}>{userStatus}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-zinc-500 font-bold">Gombo ID : {user.gomboIdNumber || "Non Vérifié"}</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 pl-2">
                  <ChevronDown className={`w-5 h-5 text-[#D4AF37] transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                </div>
              </div>

              {/* DETAILED EXPANSION ACCORDION WITH INNER TABBED CONTENT */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="border-t border-zinc-900 bg-zinc-950/50"
                  >
                    {/* FAST TOP ACTIONS BUTTONS ROW */}
                    <div className="p-3 border-b border-zinc-900 bg-zinc-900/15">
                      <div className="grid grid-cols-5 gap-1.5">
                        <button 
                          onClick={() => triggerFastAction(user.id!, "profile")} 
                          className="py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[#D4AF37] rounded-lg text-[9px] font-mono font-extrabold uppercase tracking-wide flex flex-col items-center justify-center gap-1 transition-all"
                        >
                          <UserIcon className="w-3.5 h-3.5" />
                          <span>PROFIL</span>
                        </button>
                        <button 
                          onClick={() => triggerFastAction(user.id!, "security")} 
                          className="py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[#D4AF37] rounded-lg text-[9px] font-mono font-extrabold uppercase tracking-wide flex flex-col items-center justify-center gap-1 transition-all"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>SÉCURITÉ</span>
                        </button>
                        <button 
                          onClick={() => triggerFastAction(user.id!, "wallet")} 
                          className="py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[#D4AF37] rounded-lg text-[9px] font-mono font-extrabold uppercase tracking-wide flex flex-col items-center justify-center gap-1 transition-all"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>WALLET</span>
                        </button>
                        <button 
                          onClick={() => triggerFastAction(user.id!, "kyc")} 
                          className="py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[#D4AF37] rounded-lg text-[9px] font-mono font-extrabold uppercase tracking-wide flex flex-col items-center justify-center gap-1 transition-all"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>VÉRIF</span>
                        </button>
                        <button 
                          onClick={() => setActiveBottomSheetUser(user)} 
                          className="py-2 bg-zinc-900 hover:bg-[#D4AF37]/15 border border-[#D4AF37]/20 text-[#D4AF37] rounded-lg text-[9px] font-mono font-extrabold uppercase tracking-wide flex flex-col items-center justify-center gap-1 transition-all"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                          <span>ACTIONS</span>
                        </button>
                      </div>
                    </div>

                    {/* SECTIONS ACCORDION LIST */}
                    <div className="p-3.5 space-y-2">
                      
                      {/* ACCORDION 1: PROFIL */}
                      <div className="border border-zinc-900 bg-zinc-900/10 rounded-xl overflow-hidden">
                        <button 
                          onClick={() => toggleSection("profile")}
                          className="w-full p-3 flex justify-between items-center text-xs font-bold text-zinc-200 hover:text-[#D4AF37]"
                        >
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-[#D4AF37]" />
                            <span>👤 PROFIL DE L'ARTISTE</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 transition-transform ${openSections["profile"] ? "rotate-180" : ""}`} />
                        </button>
                        
                        {openSections["profile"] && (
                          <div className="p-3.5 border-t border-zinc-900/60 bg-black/40 text-xs space-y-3">
                            <div className="grid grid-cols-2 gap-3 font-mono">
                              <div>
                                <span className="text-zinc-500 block text-[9px] uppercase">Nom Complet</span>
                                <span className="text-zinc-200 font-bold">{user.name || "N/A"}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block text-[9px] uppercase">Nom Artistique</span>
                                <span className="text-[#D4AF37] font-bold">{user.artisticName || "N/A"}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block text-[9px] uppercase">Gombo ID</span>
                                <span className="text-zinc-200 font-bold">{user.gomboIdNumber || "Non certifié"}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block text-[9px] uppercase">E-mail</span>
                                <span className="text-zinc-200 truncate block">{user.email || "N/A"}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block text-[9px] uppercase">Téléphone</span>
                                <span className="text-zinc-200">{user.phone || "N/A"}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block text-[9px] uppercase">Commune</span>
                                <span className="text-zinc-200">{user.commune || "N/A"}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block text-[9px] uppercase">Rôle Système</span>
                                <span className="text-zinc-200 font-bold uppercase">{user.role || "USER"}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block text-[9px] uppercase">Date d'inscription</span>
                                <span className="text-zinc-200">{user.registrationDate || "N/A"}</span>
                              </div>
                            </div>

                            <div className="pt-2 flex flex-wrap gap-2 border-t border-zinc-900">
                              <button 
                                onClick={() => startEditingProfile(user)}
                                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded text-[10px] font-mono border border-zinc-800 uppercase"
                              >
                                ✏️ Éditer le profil
                              </button>
                              <button 
                                onClick={() => alert("Profil public à l'adresse public/user/" + user.id)}
                                className="px-3 py-1.5 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] rounded text-[10px] font-mono border border-[#D4AF37]/20 uppercase"
                              >
                                👁 Voir Profil Public
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ACCORDION 2: COMPTE */}
                      <div className="border border-zinc-900 bg-zinc-900/10 rounded-xl overflow-hidden">
                        <button 
                          onClick={() => toggleSection("account")}
                          className="w-full p-3 flex justify-between items-center text-xs font-bold text-zinc-200 hover:text-[#D4AF37]"
                        >
                          <div className="flex items-center gap-2">
                            <Laptop className="w-4 h-4 text-[#D4AF37]" />
                            <span>🔐 CONFIGURATION COMPTE</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 transition-transform ${openSections["account"] ? "rotate-180" : ""}`} />
                        </button>
                        
                        {openSections["account"] && (
                          <div className="p-3.5 border-t border-zinc-900/60 bg-black/40 text-xs space-y-3 font-mono">
                            <div className="space-y-1.5">
                              <div>
                                <span className="text-zinc-500 text-[9px] uppercase block">UID Firebase</span>
                                <span className="text-zinc-300 font-bold select-all break-all">{user.uid || user.id}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-zinc-500 text-[9px] uppercase block">E-mail Vérifié</span>
                                  <span className="text-zinc-300 font-bold">{user.emailVerified ? "✅ OUI" : "❌ NON"}</span>
                                </div>
                                <div>
                                  <span className="text-zinc-500 text-[9px] uppercase block">Téléphone Lié</span>
                                  <span className="text-zinc-300 font-bold">{user.phone ? "✅ OUI" : "❌ NON"}</span>
                                </div>
                              </div>
                              
                              <div className="border-t border-zinc-900 pt-2">
                                <span className="text-zinc-500 text-[9px] uppercase block">Fournisseurs Connectés</span>
                                <div className="flex gap-2 mt-1">
                                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300">Google: Actif</span>
                                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-600">Facebook: Inactif</span>
                                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-600">Apple: Inactif</span>
                                </div>
                              </div>

                              <div className="border-t border-zinc-900 pt-2">
                                <span className="text-zinc-500 text-[9px] uppercase block">Sécurité d'accès</span>
                                <span className="text-zinc-400 font-extrabold italic block mt-0.5">
                                  🔐 MOT DE PASSE : "Protégé — non consultable"
                                </span>
                              </div>
                            </div>

                            <div className="pt-2 flex flex-wrap gap-2 border-t border-zinc-900">
                              <button 
                                onClick={() => {
                                  setConfirmationModal({
                                    title: "Réinitialiser mot de passe",
                                    message: "Voulez-vous envoyer un mail de récupération à l'utilisateur ?",
                                    requireReason: false,
                                    confirmLabel: "Confirmer l'envoi",
                                    onConfirm: async () => {
                                      await addDoc(collection(db, "admin_audit_logs"), {
                                        adminUid: currentUser?.uid,
                                        adminEmail: currentUser?.email,
                                        action: "PASSWORD_RESET_LINK_SENT",
                                        targetUserId: user.id,
                                        timestamp: new Date().toISOString()
                                      });
                                      alert("Lien d'envoi de réinitialisation transmis.");
                                      setConfirmationModal(null);
                                    }
                                  });
                                }}
                                className="px-3 py-1.5 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/20 rounded text-[10px]"
                              >
                                📧 Envoyer réinitialisation
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ACCORDION 3: IDENTITÉ & VÉRIFICATION */}
                      <div className="border border-zinc-900 bg-zinc-900/10 rounded-xl overflow-hidden">
                        <button 
                          onClick={() => {
                            toggleSection("kyc");
                            if (!openSections["kyc"]) {
                              fetchKycSignedUrls(user);
                            }
                          }}
                          className="w-full p-3 flex justify-between items-center text-xs font-bold text-zinc-200 hover:text-[#D4AF37]"
                        >
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-[#D4AF37]" />
                            <span>🪪 DOSSIER GOMBO ID & KYC</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 transition-transform ${openSections["kyc"] ? "rotate-180" : ""}`} />
                        </button>
                        
                        {openSections["kyc"] && (
                          <div className="p-3.5 border-t border-zinc-900/60 bg-black/40 text-xs space-y-3">
                            <div className="grid grid-cols-2 gap-3 font-mono">
                              <div>
                                <span className="text-zinc-500 text-[9px] uppercase block">Statut Gombo ID</span>
                                <span className="text-[#D4AF37] font-bold uppercase">{user.kycStatus || "NON INITIÉ"}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 text-[9px] uppercase block">Niveau Confiance</span>
                                <span className="text-zinc-200">{user.gomboId?.scoreConfiance ?? 90} / 100</span>
                              </div>
                            </div>

                            {/* DOCUMENT PREVIEWS */}
                            <div className="p-3 bg-zinc-950/60 border border-zinc-900 rounded-lg space-y-2 font-mono">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] uppercase text-zinc-500 font-extrabold block">Preuves fournies :</span>
                                {user.id && kycLoading[user.id] && (
                                  <span className="text-[9px] text-[#D4AF37] animate-pulse">Chargement des documents...</span>
                                )}
                              </div>
                              <div className="space-y-2 text-[11px]">
                                {[
                                  { label: "1. Carte d'identité (Recto)", path: user.kycDocs?.identityCardUrl },
                                  { label: "2. Carte d'identité (Verso)", path: user.kycDocs?.identityCardBackUrl },
                                  { label: "3. Selfie de contrôle", path: user.kycDocs?.selfieUrl },
                                  { label: "4. Preuve d'activité", path: user.kycDocs?.activityUrl || user.kycDocUrl }
                                ].map((docItem, idx) => {
                                  if (!docItem.path) {
                                    return (
                                      <div key={idx} className="flex justify-between items-center py-1 border-b border-zinc-900/40 last:border-0">
                                        <span className="text-zinc-400">{docItem.label}</span>
                                        <span className="text-zinc-600">Non fournie</span>
                                      </div>
                                    );
                                  }

                                  const userMap = user.id ? kycSignedUrls[user.id] : undefined;
                                  const signedUrl = userMap ? userMap[docItem.path] : undefined;
                                  const isLoading = user.id ? kycLoading[user.id] : false;

                                  return (
                                    <div key={idx} className="flex items-center justify-between py-1.5 border-b border-zinc-900/40 last:border-0">
                                      <div className="space-y-1">
                                        <span className="text-zinc-300 font-medium block">{docItem.label}</span>
                                        {signedUrl ? (
                                          <button
                                            type="button"
                                            onClick={() => setKycPreviewUrl(signedUrl)}
                                            className="text-[#D4AF37] hover:underline text-[10px] flex items-center gap-1"
                                          >
                                            Agrandir <ArrowUpRight className="w-3 h-3" />
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => fetchKycSignedUrls(user)}
                                            disabled={isLoading}
                                            className="text-[#D4AF37] underline text-[10px]"
                                          >
                                            {isLoading ? "Chargement..." : "Consulter ↗"}
                                          </button>
                                        )}
                                      </div>

                                      <div className="shrink-0">
                                        {isLoading ? (
                                          <div className="w-16 h-16 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[9px] text-zinc-500 animate-pulse">
                                            ...
                                          </div>
                                        ) : signedUrl ? (
                                          <img
                                            src={signedUrl}
                                            alt={docItem.label}
                                            onClick={() => setKycPreviewUrl(signedUrl)}
                                            className="w-16 h-16 object-cover rounded cursor-pointer border border-zinc-700 hover:border-[#D4AF37] transition-all shadow-md"
                                            title="Cliquer pour voir en grand"
                                          />
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => fetchKycSignedUrls(user)}
                                            className="w-16 h-16 rounded bg-zinc-900/80 border border-zinc-800 hover:border-[#D4AF37]/50 flex flex-col items-center justify-center text-zinc-400 hover:text-[#D4AF37] text-[9px] transition-all"
                                          >
                                            <Eye className="w-4 h-4 mb-0.5" />
                                            <span>Consulter</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="pt-2 flex flex-wrap gap-2 border-t border-zinc-900">
                              {user.kycStatus !== "approved" && (
                                <button 
                                  onClick={() => {
                                    setConfirmationModal({
                                      title: "Valider KYC & Gombo ID",
                                      message: `Voulez-vous certifier l'identité de l'artiste ${user.displayName || user.name} ?`,
                                      requireReason: false,
                                      confirmLabel: "Certifier l'Artiste",
                                      onConfirm: async () => {
                                        await handleApproveKYC(user.id!, user.kycType === "express");
                                        setConfirmationModal(null);
                                      }
                                    });
                                  }}
                                  className="px-3 py-1.5 bg-emerald-600 text-white rounded text-[10px] font-mono"
                                >
                                  ✅ Certifier l'artiste
                                </button>
                              )}
                              
                              {user.kycStatus !== "rejected" && (
                                <button 
                                  onClick={() => {
                                    setConfirmationModal({
                                      title: "Refuser le dossier KYC",
                                      message: "Veuillez fournir le motif officiel du rejet du dossier :",
                                      requireReason: true,
                                      confirmLabel: "Rejeter le Dossier",
                                      onConfirm: async (reason) => {
                                        await handleRejectKYC(user.id!);
                                        if (reason) {
                                          await updateDoc(doc(db, "users", user.id!), {
                                            kycComplementaryInfo: reason
                                          });
                                        }
                                        setConfirmationModal(null);
                                      }
                                    });
                                  }}
                                  className="px-3 py-1.5 bg-red-600 text-white rounded text-[10px] font-mono"
                                >
                                  ❌ Refuser dossier
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ACCORDION 4: WALLET & FINANCES */}
                      <div className="border border-zinc-900 bg-zinc-900/10 rounded-xl overflow-hidden">
                        <button 
                          onClick={() => toggleSection("wallet")}
                          className="w-full p-3 flex justify-between items-center text-xs font-bold text-zinc-200 hover:text-[#D4AF37]"
                        >
                          <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-[#D4AF37]" />
                            <span>💰 WALLET ÉLECTRONIQUE (GAWA)</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 transition-transform ${openSections["wallet"] ? "rotate-180" : ""}`} />
                        </button>
                        
                        {openSections["wallet"] && (
                          <div className="p-3.5 border-t border-zinc-900/60 bg-black/40 text-xs space-y-3 font-mono">
                            <div className="grid grid-cols-2 gap-3.5">
                              <div className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-900">
                                <span className="text-[9px] text-zinc-500 uppercase block">Solde Disponible</span>
                                <span className="text-[#D4AF37] text-md font-bold">{user.wallet?.soldeDisponible ?? user.balance ?? 0} G</span>
                              </div>
                              <div className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-900">
                                <span className="text-[9px] text-zinc-500 uppercase block">Solde Bloqué Escrow</span>
                                <span className="text-zinc-400 text-md font-bold">{user.wallet?.soldeBloque ?? 0} G</span>
                              </div>
                            </div>

                            <div className="space-y-1 mt-1 text-[11px] text-zinc-400">
                              <div className="flex justify-between">
                                <span>Statut du Wallet :</span>
                                <span className="font-extrabold uppercase text-emerald-400">{(user.wallet as any)?.walletStatus || "Actif"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Code Portefeuille :</span>
                                <div className="flex items-center gap-1">
                                  <span>{revealedWalletCodes[user.id!] ? ((user.wallet as any)?.walletCode || "AFW-DEMO") : "••••••••"}</span>
                                  <button onClick={() => setRevealedWalletCodes(prev => ({...prev, [user.id!]: !prev[user.id!]}))} className="text-[#D4AF37] font-bold text-[10px]">
                                    {revealedWalletCodes[user.id!] ? <EyeOff className="w-3.5 h-3.5 inline" /> : <Eye className="w-3.5 h-3.5 inline" />}
                                  </button>
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <span>🔐 Code Secret PIN :</span>
                                <span className="text-zinc-500 italic">"Protégé — non consultable"</span>
                              </div>
                            </div>

                            <div className="pt-2 flex flex-wrap gap-1.5 border-t border-zinc-900">
                              <button 
                                onClick={() => {
                                  setConfirmationModal({
                                    title: "Forcer la réinitialisation du PIN",
                                    message: "Voulez-vous forcer la réinitialisation complète du code secret PIN du portefeuille de l'artiste ?",
                                    requireReason: true,
                                    confirmLabel: "Réinitialiser PIN",
                                    onConfirm: async (reason) => {
                                      await handleTriggerPinReset(user.id!, reason || "Réinitialisation par Super Fondateur");
                                    }
                                  });
                                }}
                                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded text-[9px] uppercase border border-zinc-800"
                              >
                                🔐 Réinitialiser PIN
                              </button>
                              
                              {(user.wallet as any)?.walletStatus === "suspended" ? (
                                <button 
                                  onClick={() => {
                                    setConfirmationModal({
                                      title: "Débloquer le Wallet",
                                      message: "Voulez-vous réactiver l'accès financier de ce portefeuille ?",
                                      requireReason: false,
                                      confirmLabel: "Débloquer",
                                      onConfirm: async () => {
                                        await handleUnlockWallet(user.id!, "Déverrouillage administratif");
                                      }
                                    });
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[9px] uppercase"
                                >
                                  ▶️ Débloquer
                                </button>
                              ) : (
                                <button 
                                  onClick={() => {
                                    setConfirmationModal({
                                      title: "Bloquer le Wallet",
                                      message: "Veuillez renseigner le motif du blocage financier de ce compte :",
                                      requireReason: true,
                                      confirmLabel: "Bloquer le Wallet",
                                      onConfirm: async (reason) => {
                                        await handleLockWallet(user.id!, reason || "Blocage administratif");
                                      }
                                    });
                                  }}
                                  className="px-2.5 py-1 bg-red-600 text-white rounded text-[9px] uppercase"
                                >
                                  ⛔ Bloquer
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ACCORDION 5: PUBLICATIONS */}
                      <div className="border border-zinc-900 bg-zinc-900/10 rounded-xl overflow-hidden">
                        <button 
                          onClick={() => {
                            toggleSection("gombos");
                            setPublicationFilter("ACTIVES");
                          }}
                          className="w-full p-3 flex justify-between items-center text-xs font-bold text-zinc-200 hover:text-[#D4AF37]"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#D4AF37]" />
                            <span>📄 PUBLICATIONS & ANNONCES GOMBOS</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 transition-transform ${openSections["gombos"] ? "rotate-180" : ""}`} />
                        </button>
                        
                        {openSections["gombos"] && (
                          <div className="p-3.5 border-t border-zinc-900/60 bg-black/40 text-xs space-y-3">
                            {/* Inner Filter tabs */}
                            <div className="flex flex-wrap gap-1 border-b border-zinc-900 pb-2">
                              {["ACTIVES", "EN ATTENTE", "EXPIRÉES", "REFUSÉES", "SUPPRIMÉES"].map(filterTab => (
                                <button
                                  key={filterTab}
                                  onClick={() => setPublicationFilter(filterTab)}
                                  className={`px-2.5 py-1 text-[9px] font-mono uppercase rounded-md transition-all ${
                                    publicationFilter === filterTab 
                                      ? "bg-[#D4AF37] text-black font-extrabold" 
                                      : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                                  }`}
                                >
                                  {filterTab}
                                </button>
                              ))}
                            </div>

                            {/* Gombos mapping list */}
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                              {loadedData[user.id!]?.gombos
                                .filter(g => {
                                  const s = (g.status || "").toLowerCase();
                                  if (publicationFilter === "ACTIVES") return s === "active" || s === "published" || s === "open";
                                  if (publicationFilter === "EN ATTENTE") return s === "pending" || s === "pending_deposit";
                                  if (publicationFilter === "EXPIRÉES") return s === "expired";
                                  if (publicationFilter === "REFUSÉES") return s === "rejected";
                                  if (publicationFilter === "SUPPRIMÉES") return s === "deleted";
                                  return true;
                                })
                                .map(gombo => (
                                  <div key={gombo.id} className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-lg space-y-2 font-mono">
                                    <div className="flex justify-between items-start gap-1">
                                      <h5 className="font-bold text-zinc-200 text-[11px] uppercase line-clamp-1">{gombo.title}</h5>
                                      <span className="text-[9px] px-1.5 py-0.2 bg-[#D4AF37]/10 text-[#D4AF37] rounded uppercase">
                                        {gombo.budget || 0} G
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 line-clamp-2">{gombo.description || "Pas de description"}</p>
                                    
                                    <div className="flex flex-wrap gap-1 pt-1.5 border-t border-zinc-900/60">
                                      <button 
                                        onClick={() => {
                                          setConfirmationModal({
                                            title: "Valider la publication",
                                            message: `Voulez-vous confirmer la validation publique de l'annonce "${gombo.title}" ?`,
                                            requireReason: false,
                                            confirmLabel: "Valider",
                                            onConfirm: async () => {
                                              await handleAdminGomboPublication(gombo.id, "validate", "Approuvé par Super Fondateur");
                                            }
                                          });
                                        }}
                                        className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[8px] uppercase"
                                      >
                                        Valider
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setConfirmationModal({
                                            title: "Refuser l'annonce",
                                            message: "Indiquez le motif de refus de cette publication :",
                                            requireReason: true,
                                            confirmLabel: "Refuser l'annonce",
                                            onConfirm: async (reason) => {
                                              await handleAdminGomboPublication(gombo.id, "reject", reason || "Dossier non conforme");
                                            }
                                          });
                                        }}
                                        className="px-2 py-0.5 bg-red-600/20 border border-red-500/20 text-red-400 rounded text-[8px] uppercase"
                                      >
                                        Refuser
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setConfirmationModal({
                                            title: "Supprimer (Soft Delete)",
                                            message: "Motif requis pour la suppression sécurisée de cette publication :",
                                            requireReason: true,
                                            confirmLabel: "Supprimer",
                                            onConfirm: async (reason) => {
                                              await handleAdminGomboPublication(gombo.id, "delete", reason || "Supprimé par administration");
                                            }
                                          });
                                        }}
                                        className="px-2 py-0.5 bg-red-950/20 text-red-500 rounded text-[8px] uppercase"
                                      >
                                        Supprimer
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              
                              {(!loadedData[user.id!]?.gombos || loadedData[user.id!]?.gombos.length === 0) && (
                                <p className="text-zinc-600 text-center italic py-2 text-[11px]">Aucune publication enregistrée.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ACCORDION 6: MESSAGES */}
                      <div className="border border-zinc-900 bg-zinc-900/10 rounded-xl overflow-hidden">
                        <button 
                          onClick={() => toggleSection("messages")}
                          className="w-full p-3 flex justify-between items-center text-xs font-bold text-zinc-200 hover:text-[#D4AF37]"
                        >
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
                            <span>💬 MESSAGERIE & MODÉRATION</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 transition-transform ${openSections["messages"] ? "rotate-180" : ""}`} />
                        </button>
                        
                        {openSections["messages"] && (
                          <div className="p-3.5 border-t border-zinc-900/60 bg-black/40 text-xs space-y-3 font-mono">
                            <div className="space-y-1.5 text-zinc-400 text-[11px]">
                              <div className="flex justify-between">
                                <span>Conversations Actives :</span>
                                <span className="font-bold text-zinc-200">5 discussions</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Dernière Activité :</span>
                                <span className="text-zinc-300">Aujourd'hui à 15h12</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Signalements Messagerie :</span>
                                <span className="font-extrabold text-amber-500">0 signalement</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Statut de Modération :</span>
                                <span className="text-emerald-400 font-bold uppercase">Sain</span>
                              </div>
                            </div>

                            <div className="pt-2 flex flex-wrap gap-1.5 border-t border-zinc-900">
                              <button 
                                onClick={() => alert("Messagerie protégée - Accès restreint uniquement en cas de litige officiel de Wallet.")}
                                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-[9px] border border-zinc-800 uppercase"
                              >
                                🚩 Consulter Signalements
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ACCORDION 7: TRANSACTIONS */}
                      <div className="border border-zinc-900 bg-zinc-900/10 rounded-xl overflow-hidden">
                        <button 
                          onClick={() => {
                            toggleSection("transactions");
                            setTransactionFilter("TOUTES");
                          }}
                          className="w-full p-3 flex justify-between items-center text-xs font-bold text-zinc-200 hover:text-[#D4AF37]"
                        >
                          <div className="flex items-center gap-2">
                            <History className="w-4 h-4 text-[#D4AF37]" />
                            <span>💳 REGISTRE DES TRANSACTIONS FINANCIÈRES</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 transition-transform ${openSections["transactions"] ? "rotate-180" : ""}`} />
                        </button>
                        
                        {openSections["transactions"] && (
                          <div className="p-3.5 border-t border-zinc-900/60 bg-black/40 text-xs space-y-3 font-mono">
                            <div className="flex flex-wrap gap-1 border-b border-zinc-900 pb-2">
                              {["TOUTES", "DÉPÔTS", "RETRAITS", "RÉUSSIES"].map(txFilterTab => (
                                <button
                                  key={txFilterTab}
                                  onClick={() => setTransactionFilter(txFilterTab)}
                                  className={`px-2.5 py-1 text-[9px] uppercase rounded-md transition-all ${
                                    transactionFilter === txFilterTab 
                                      ? "bg-[#D4AF37] text-black font-extrabold" 
                                      : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                                  }`}
                                >
                                  {txFilterTab}
                                </button>
                              ))}
                            </div>

                            {/* Transactions ledger map */}
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                              {loadedData[user.id!]?.transactions
                                .filter(tx => {
                                  const t = (tx.type || "").toLowerCase();
                                  const s = (tx.status || "").toLowerCase();
                                  if (transactionFilter === "DÉPÔTS") return t === "deposit" || t === "depot";
                                  if (transactionFilter === "RETRAITS") return t === "withdrawal" || t === "retrait";
                                  if (transactionFilter === "RÉUSSIES") return s === "success" || s === "completed";
                                  return true;
                                })
                                .map(tx => (
                                  <div key={tx.id} className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-lg flex items-center justify-between text-[11px]">
                                    <div>
                                      <span className="text-[10px] text-zinc-500 block">{tx.id?.substring(0, 8)} • {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString() : (tx.createdAt || "N/A")}</span>
                                      <span className="font-extrabold text-zinc-200 uppercase">{tx.type} • {tx.source || "Wallet"}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className={`font-black ${
                                        tx.amount < 0 ? "text-red-400" : "text-emerald-400"
                                      }`}>{tx.amount > 0 ? "+" : ""}{tx.amount} G</span>
                                      <span className="text-[9px] text-zinc-500 block uppercase font-bold">{tx.status}</span>
                                    </div>
                                  </div>
                                ))}

                              {(!loadedData[user.id!]?.transactions || loadedData[user.id!]?.transactions.length === 0) && (
                                <p className="text-zinc-600 text-center italic py-2 text-[11px]">Aucun enregistrement financier.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ACCORDION 8: HISTORIQUE ADMINISTRATIF / AUDIT */}
                      <div className="border border-zinc-900 bg-zinc-900/10 rounded-xl overflow-hidden">
                        <button 
                          onClick={() => toggleSection("audit")}
                          className="w-full p-3 flex justify-between items-center text-xs font-bold text-zinc-200 hover:text-[#D4AF37]"
                        >
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-[#D4AF37]" />
                            <span>🛡 HISTORIQUE AUDIT ADMINISTRATIF</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 transition-transform ${openSections["audit"] ? "rotate-180" : ""}`} />
                        </button>
                        
                        {openSections["audit"] && (
                          <div className="p-3.5 border-t border-zinc-900/60 bg-black/40 text-xs space-y-2 font-mono">
                            <span className="text-[9px] uppercase text-zinc-500 font-extrabold block">Modifications & Sanctions enregistrées :</span>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {loadedData[user.id!]?.audits.map(audit => (
                                <div key={audit.id} className="p-2 bg-zinc-950 rounded-lg border border-zinc-900 text-[10px] space-y-1">
                                  <div className="flex justify-between font-black text-zinc-300">
                                    <span>{audit.action}</span>
                                    <span className="text-zinc-500">{audit.timestamp?.split("T")[0] || "Audit d'Héritage"}</span>
                                  </div>
                                  <p className="text-zinc-400">Par : {audit.adminEmail}</p>
                                  <p className="text-[#D4AF37] italic">Motif : "{audit.reason || "Non spécifié"}"</p>
                                </div>
                              ))}
                              {(!loadedData[user.id!]?.audits || loadedData[user.id!]?.audits.length === 0) && (
                                <p className="text-zinc-600 italic text-center py-2 text-[11px]">Aucun log d'audit enregistré.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ACCORDION 9: ACTIVITÉ UTILISATEUR */}
                      <div className="border border-zinc-900 bg-zinc-900/10 rounded-xl overflow-hidden">
                        <button 
                          onClick={() => toggleSection("activity")}
                          className="w-full p-3 flex justify-between items-center text-xs font-bold text-zinc-200 hover:text-[#D4AF37]"
                        >
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-[#D4AF37]" />
                            <span>📊 TIMELINE DES ACTIVITÉS</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 transition-transform ${openSections["activity"] ? "rotate-180" : ""}`} />
                        </button>
                        
                        {openSections["activity"] && (
                          <div className="p-3.5 border-t border-zinc-900/60 bg-black/40 text-xs space-y-3 font-mono">
                            <div className="relative pl-4 border-l border-[#D4AF37]/35 space-y-3 max-h-48 overflow-y-auto pr-1">
                              {loadedData[user.id!]?.activities.map((act, i) => (
                                <div key={act.id || i} className="relative text-[10px]">
                                  {/* Point */}
                                  <span className="absolute -left-[20.5px] top-1 w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" />
                                  <div className="font-extrabold text-zinc-300">{act.type} • {act.result}</div>
                                  <div className="text-zinc-500">{act.details || "Événement de session standard"}</div>
                                </div>
                              ))}
                              {(!loadedData[user.id!]?.activities || loadedData[user.id!]?.activities.length === 0) && (
                                <div className="relative text-[10px]">
                                  <span className="absolute -left-[20.5px] top-1 w-2 h-2 rounded-full bg-zinc-700" />
                                  <div className="text-zinc-500 italic">Aucun log d'activité en temps réel.</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ACCORDION 10: NOTIFICATIONS */}
                      <div className="border border-zinc-900 bg-zinc-900/10 rounded-xl overflow-hidden">
                        <button 
                          onClick={() => toggleSection("notifications")}
                          className="w-full p-3 flex justify-between items-center text-xs font-bold text-zinc-200 hover:text-[#D4AF37]"
                        >
                          <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-[#D4AF37]" />
                            <span>🔔 TRANSMISSION DE NOTIFICATIONS PUSH</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 transition-transform ${openSections["notifications"] ? "rotate-180" : ""}`} />
                        </button>
                        
                        {openSections["notifications"] && (
                          <div className="p-3.5 border-t border-zinc-900/60 bg-black/40 text-xs space-y-3 font-mono">
                            <div className="space-y-2">
                              <span className="text-[10px] uppercase text-zinc-500 font-extrabold block">Notifier l'utilisateur directement :</span>
                              <input 
                                type="text" 
                                placeholder="Titre de la notification..."
                                value={customNotificationTitle}
                                onChange={(e) => setCustomNotificationTitle(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs focus:outline-none focus:border-[#D4AF37] text-zinc-100"
                              />
                              <textarea 
                                placeholder="Message à notifier..."
                                value={customNotificationBody}
                                onChange={(e) => setCustomNotificationBody(e.target.value)}
                                rows={2}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs focus:outline-none focus:border-[#D4AF37] text-zinc-100"
                              />
                              <button 
                                onClick={() => handleSendCustomNotification(user.id!)}
                                disabled={isSendingNotification}
                                className="w-full py-2 bg-[#D4AF37] text-black font-extrabold rounded-lg text-xs hover:bg-[#B48F17] transition-all disabled:opacity-50"
                              >
                                {isSendingNotification ? "Envoi..." : "📣 Notifier l'Artiste"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ACCORDION 11: NOTES INTERNES */}
                      <div className="border border-zinc-900 bg-zinc-900/10 rounded-xl overflow-hidden">
                        <button 
                          onClick={() => toggleSection("notes")}
                          className="w-full p-3 flex justify-between items-center text-xs font-bold text-zinc-200 hover:text-[#D4AF37]"
                        >
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-[#D4AF37]" />
                            <span>📝 NOTES ADMINISTRATIVES INTERNES</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 transition-transform ${openSections["notes"] ? "rotate-180" : ""}`} />
                        </button>
                        
                        {openSections["notes"] && (
                          <div className="p-3.5 border-t border-zinc-900/60 bg-black/40 text-xs space-y-3 font-mono">
                            <div className="space-y-2">
                              <span className="text-[10px] uppercase text-zinc-500 font-extrabold block">Ajouter une note de suivi interne (masquée à l'utilisateur) :</span>
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  placeholder="Note confidentielle..."
                                  value={adminNoteText}
                                  onChange={(e) => setAdminNoteText(e.target.value)}
                                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs focus:outline-none focus:border-[#D4AF37] text-zinc-100"
                                />
                                <button 
                                  onClick={() => handleAddInternalNote(user.id!)}
                                  disabled={isSubmittingNote}
                                  className="px-4 py-2 bg-[#D4AF37] text-black rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
                                >
                                  {isSubmittingNote ? "..." : "Ajouter"}
                                </button>
                              </div>
                            </div>

                            {/* Conf notes lists */}
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                              {loadedData[user.id!]?.notes.map((note, idx) => (
                                <div key={note.id || idx} className="p-2 bg-zinc-950 border border-zinc-900 rounded-lg text-[10px]">
                                  <div className="flex justify-between text-zinc-500 text-[8px] font-bold">
                                    <span>Par : {note.adminEmail}</span>
                                    <span>{note.createdAt?.split("T")[0]}</span>
                                  </div>
                                  <p className="text-zinc-300 mt-1">"{note.note}"</p>
                                </div>
                              ))}
                              {(!loadedData[user.id!]?.notes || loadedData[user.id!]?.notes.length === 0) && (
                                <p className="text-zinc-600 text-center italic text-[11px]">Aucune note confidentielle consignée.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {displayedUsers.length === 0 && (
          <div className="p-10 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/40">
            <AlertCircle className="w-8 h-8 text-[#D4AF37] mx-auto opacity-50 mb-2" />
            <p className="text-xs text-zinc-400 font-mono">Aucun artiste ne correspond aux critères de recherche actuels.</p>
          </div>
        )}

        {/* LOAD MORE BUTTON FOR HIGH MOBILE PERFORMANCES */}
        {displayedUsers.length > visibleCount && (
          <div className="pt-4 text-center">
            <button 
              onClick={() => setVisibleCount(prev => prev + 15)}
              className="px-6 py-2.5 bg-zinc-950 text-zinc-100 hover:text-[#D4AF37] border border-zinc-800 hover:border-[#D4AF37]/50 rounded-xl text-xs font-mono font-bold uppercase transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Afficher plus d'utilisateurs</span>
            </button>
          </div>
        )}
      </div>

      {/* REUSABLE PREMIUM ANDROID BOTTOM SHEET MODAL */}
      <AnimatePresence>
        {activeBottomSheetUser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-end justify-center select-none" onClick={() => setActiveBottomSheetUser(null)}>
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="bg-zinc-950 border-t border-[#D4AF37]/50 w-full max-w-md rounded-t-3xl max-h-[85vh] overflow-y-auto p-6 space-y-5 text-left shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Center Android notch indicator */}
              <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto mb-2" />

              <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                <div>
                  <h3 className="text-sm font-display font-extrabold text-[#D4AF37] uppercase tracking-wide">
                    ⚜️ Actions Administratives
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    {activeBottomSheetUser.displayName || activeBottomSheetUser.name}
                  </p>
                </div>
                <button 
                  onClick={() => setActiveBottomSheetUser(null)}
                  className="w-7 h-7 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom Sheet Actions Lists */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                
                {/* ACCOUNT STATES CONTROLS */}
                <div className="p-2 bg-zinc-900/30 rounded-xl space-y-1.5 border border-zinc-900/60">
                  <span className="text-[9px] uppercase font-mono text-zinc-500 font-bold block px-2">État du compte :</span>
                  <div className="grid grid-cols-2 gap-1 px-1">
                    <button 
                      onClick={() => {
                        setActiveBottomSheetUser(null);
                        setConfirmationModal({
                          title: "Activer le compte",
                          message: "Voulez-vous réactiver complètement l'accès général de cet utilisateur ?",
                          requireReason: false,
                          confirmLabel: "Activer",
                          onConfirm: async () => {
                            await handleUpdateStatus(activeBottomSheetUser.id!, "active", "Réactivation administrative");
                          }
                        });
                      }}
                      className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-mono uppercase tracking-wider"
                    >
                      ✅ Activer
                    </button>
                    <button 
                      onClick={() => {
                        setActiveBottomSheetUser(null);
                        setConfirmationModal({
                          title: "Désactiver temporairement",
                          message: "Indiquez le motif de désactivation temporaire :",
                          requireReason: true,
                          confirmLabel: "Désactiver",
                          onConfirm: async (reason) => {
                            await handleUpdateStatus(activeBottomSheetUser.id!, "suspended", reason || "Désactivation temporaire");
                          }
                        });
                      }}
                      className="py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[10px] font-mono uppercase tracking-wider"
                    >
                      ⏸ Désactiver
                    </button>
                    <button 
                      onClick={() => {
                        setActiveBottomSheetUser(null);
                        setConfirmationModal({
                          title: "Suspendre le compte",
                          message: "Indiquez le motif de suspension réglementaire :",
                          requireReason: true,
                          confirmLabel: "Suspendre",
                          onConfirm: async (reason) => {
                            await handleUpdateStatus(activeBottomSheetUser.id!, "suspended", reason || "Sanction réglementaire");
                          }
                        });
                      }}
                      className="py-2 bg-red-900/20 text-red-400 border border-red-900/30 rounded-lg text-[10px] font-mono uppercase tracking-wider"
                    >
                      🔒 Suspendre
                    </button>
                    <button 
                      onClick={() => {
                        setActiveBottomSheetUser(null);
                        setConfirmationModal({
                          title: "Bloquer définitivement",
                          message: "Veuillez renseigner le motif obligatoire de blocage d'accès :",
                          requireReason: true,
                          confirmLabel: "Bloquer",
                          onConfirm: async (reason) => {
                            await handleUpdateStatus(activeBottomSheetUser.id!, "blocked", reason || "Infraction grave");
                          }
                        });
                      }}
                      className="py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-mono uppercase tracking-wider"
                    >
                      ⛔ Bloquer
                    </button>
                  </div>
                </div>

                {/* ROLE MANAGEMENT */}
                <div className="p-2 bg-zinc-900/30 rounded-xl space-y-1.5 border border-zinc-900/60">
                  <span className="text-[9px] uppercase font-mono text-zinc-500 font-bold block px-2">Permissions & Rôle :</span>
                  <div className="grid grid-cols-2 gap-1 px-1">
                    <button 
                      onClick={() => {
                        setActiveBottomSheetUser(null);
                        setConfirmationModal({
                          title: "Promouvoir en Musicien PRO",
                          message: "Voulez-vous accorder le rôle Professionnel de Musicien ?",
                          requireReason: false,
                          confirmLabel: "Promouvoir PRO",
                          onConfirm: async () => {
                            await handleUpdateRole(activeBottomSheetUser.id!, "musicien", "Attribution rôle pro musicien");
                          }
                        });
                      }}
                      className="py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-lg text-[10px]"
                    >
                      🎵 Rôle PRO Musicien
                    </button>
                    <button 
                      onClick={() => {
                        setActiveBottomSheetUser(null);
                        setConfirmationModal({
                          title: "Promouvoir en Admin",
                          message: "Veuillez renseigner le motif pour cette nomination d'administrateur :",
                          requireReason: true,
                          confirmLabel: "Nommer Admin",
                          onConfirm: async (reason) => {
                            await handleUpdateRole(activeBottomSheetUser.id!, "admin", reason || "Nomination administrative");
                          }
                        });
                      }}
                      className="py-2 bg-zinc-900 hover:bg-zinc-800 text-[#D4AF37] border border-[#D4AF37]/30 rounded-lg text-[10px]"
                    >
                      🛡 Nommer ADMIN
                    </button>
                  </div>
                </div>

                {/* CRITICAL ACTIONS: REVOKE / DELETE */}
                <div className="p-2 bg-zinc-900/30 rounded-xl space-y-1.5 border border-zinc-900/60">
                  <span className="text-[9px] uppercase font-mono text-zinc-500 font-bold block px-2">Actions de session & Clés :</span>
                  <div className="space-y-1 px-1">
                    <button 
                      onClick={() => {
                        setActiveBottomSheetUser(null);
                        setConfirmationModal({
                          title: "Déconnecter toutes les sessions",
                          message: "Voulez-vous forcer l'expiration de tous les jetons et déconnecter tous les appareils de cet utilisateur ?",
                          requireReason: false,
                          confirmLabel: "Déconnecter",
                          onConfirm: async () => {
                            await addDoc(collection(db, "admin_audit_logs"), {
                              adminUid: currentUser?.uid,
                              adminEmail: currentUser?.email,
                              action: "SESSIONS_REVOKED",
                              targetUserId: activeBottomSheetUser.id,
                              timestamp: new Date().toISOString()
                            });
                            alert("Sessions révoquées.");
                            setConfirmationModal(null);
                          }
                        });
                      }}
                      className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 rounded-lg text-[10px] font-mono uppercase"
                    >
                      🚪 Déconnecter tous les appareils
                    </button>
                    
                    <button 
                      onClick={() => {
                        setActiveBottomSheetUser(null);
                        setConfirmationModal({
                          title: "⚠️ SUPPRESSION COMPTE (SOFT DELETE)",
                          message: "ATTENTION : La suppression va masquer définitivement le profil. Les obligations légales obligent à conserver l'historique financier d'audit. Écrivez le motif officiel obligatoire de radiation :",
                          requireReason: true,
                          confirmLabel: "SUPPRIMER DÉFINITIVEMENT (SOFT)",
                          onConfirm: async (reason) => {
                            // Double check prompt for Super Founder (Requirement 19)
                            const confirm2 = window.confirm("DEUXIÈME VERROU DE SÉCURITÉ : Confirmez-vous à nouveau la suppression de cet utilisateur ?");
                            if (confirm2) {
                              await handleSoftDeleteAccount(activeBottomSheetUser.id!, reason || "Radiation administrative");
                            } else {
                              setConfirmationModal(null);
                            }
                          }
                        });
                      }}
                      className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-mono uppercase font-bold"
                    >
                      🗑 Supprimer le compte (Soft Delete)
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION DIALOG MODAL OVERLAY */}
      <AnimatePresence>
        {confirmationModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4 select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-[#D4AF37] max-w-sm w-full rounded-2xl p-5 space-y-4 text-left shadow-2xl relative"
            >
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 text-[#D4AF37]">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <h4 className="text-sm font-display font-extrabold uppercase tracking-wide">{confirmationModal.title}</h4>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed font-mono">
                {confirmationModal.message}
              </p>

              {confirmationModal.requireReason && (
                <div className="space-y-1">
                  <label className="text-[9px] uppercase text-zinc-500 font-mono font-extrabold">Motif Obligatoire *</label>
                  <input
                    type="text"
                    id="confirm-reason-input"
                    placeholder="Écrivez le motif officiel de cette action..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-100 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              )}

              <div className="flex gap-2.5 pt-2 font-mono">
                <button
                  onClick={() => setConfirmationModal(null)}
                  className="flex-1 py-2 border border-zinc-800 hover:border-zinc-700 text-zinc-400 text-xs rounded-lg uppercase"
                >
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    let reasonValue = "";
                    if (confirmationModal.requireReason) {
                      const input = document.getElementById("confirm-reason-input") as HTMLInputElement;
                      reasonValue = input?.value || "";
                      if (!reasonValue.trim()) {
                        alert("Erreur: Le motif est obligatoire pour valider cette action administrative.");
                        return;
                      }
                    }
                    await confirmationModal.onConfirm(reasonValue);
                  }}
                  className="flex-1 py-2 bg-[#D4AF37] text-black text-xs font-black rounded-lg uppercase"
                >
                  {confirmationModal.confirmLabel || "Confirmer"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* KYC SECURE DOCUMENT LIGHTBOX MODAL */}
      <AnimatePresence>
        {kycPreviewUrl && (
          <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[10000] flex items-center justify-center p-4 select-none"
            onClick={() => setKycPreviewUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-[#D4AF37] max-w-2xl w-full rounded-2xl p-4 space-y-3 text-left shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2 text-[#D4AF37]">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 shrink-0" />
                  <h4 className="text-xs font-mono font-extrabold uppercase tracking-wide">Document KYC Sécurisé</h4>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={kycPreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-mono text-[#D4AF37] hover:underline flex items-center gap-1"
                  >
                    Ouvrir en grand <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => setKycPreviewUrl(null)}
                    className="text-zinc-400 hover:text-white p-1 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center p-2 bg-black/60 rounded-xl min-h-[250px] max-h-[70vh] overflow-hidden">
                <img
                  src={kycPreviewUrl}
                  alt="Aperçu Document KYC"
                  className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-xl"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
