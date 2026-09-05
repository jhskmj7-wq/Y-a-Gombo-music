import React, { useState, useEffect, useMemo } from "react";
import { 
  Crown, CheckCircle, XCircle, Clock, Search, Filter, RefreshCw, 
  User, Phone, Mail, FileText, ExternalLink, ShieldCheck, Key, 
  Copy, Check, AlertTriangle, ChevronRight, Eye, MessageSquare,
  Sparkles, Calendar, ArrowUpRight, Smartphone, AlertCircle,
  PlusCircle, RefreshCcw, DollarSign, History, ShieldAlert, ArrowLeftRight,
  Power, Edit3, Save, CheckCheck, Loader2
} from "lucide-react";
import { collection, onSnapshot, query, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { SubscriptionRequest, PremiumCodeItem, User as UserType } from "../../types";
import { 
  approveSubscriptionRequest, 
  rejectSubscriptionRequest, 
  generateAdminPremiumCode,
  prolongSubscription,
  revokeSubscription,
  changeSubscriptionPlan,
  recordManualRefund
} from "../../lib/premiumSubscriptionEngine";
import { 
  ManualPaymentOperatorKey, 
  ManualPaymentOperatorConfig, 
  ManualPaymentAuditEntry,
  DEFAULT_MANUAL_PAYMENT_OPERATORS,
  subscribeToManualPaymentConfig,
  updateManualPaymentOperator,
  isValidIvorianPhoneNumber,
  formatIvorianPhoneNumber
} from "../../lib/manualPaymentConfig";
import { NotificationService } from "../../lib/NotificationService";

interface AdminSubscriptionManagementProps {
  currentUser: any;
  audioSynth?: any;
}

type TabType = "pending" | "approved" | "rejected" | "active_users" | "codes" | "payment_methods";

export const AdminSubscriptionManagement: React.FC<AdminSubscriptionManagementProps> = ({
  currentUser,
  audioSynth
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [codes, setCodes] = useState<PremiumCodeItem[]>([]);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Manual Payment Methods State
  const [paymentOperators, setPaymentOperators] = useState<Record<ManualPaymentOperatorKey, ManualPaymentOperatorConfig>>(DEFAULT_MANUAL_PAYMENT_OPERATORS);
  const [paymentAuditLog, setPaymentAuditLog] = useState<ManualPaymentAuditEntry[]>([]);
  const [editingOperator, setEditingOperator] = useState<ManualPaymentOperatorConfig | null>(null);
  const [editPhoneInput, setEditPhoneInput] = useState("");
  const [editEnabledInput, setEditEnabledInput] = useState(true);
  const [editPhoneError, setEditPhoneError] = useState("");
  const [isConfirmingReplace, setIsConfirmingReplace] = useState(false);
  const [isSavingPaymentMethod, setIsSavingPaymentMethod] = useState(false);
  const [copiedOperatorPhone, setCopiedOperatorPhone] = useState<string | null>(null);

  // Modals state
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Rejection modal
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("Preuve de paiement non valide ou introuvable.");

  // Validation modal
  const [approvingRequest, setApprovingRequest] = useState<SubscriptionRequest | null>(null);

  // User Actions Modal
  const [managingUser, setManagingUser] = useState<any | null>(null);
  const [userActionType, setUserActionType] = useState<"prolong" | "change_plan" | "revoke" | "refund" | "history" | null>(null);
  const [prolongDays, setProlongDays] = useState<number>(30);
  const [targetPlan, setTargetPlan] = useState<"pro" | "elite">("elite");
  const [actionReason, setActionReason] = useState<string>("");
  const [refundAmount, setRefundAmount] = useState<number>(1000);
  const [refundMethod, setRefundMethod] = useState<string>("Wave");

  // New Code Generation state
  const [newCodePlan, setNewCodePlan] = useState<"pro" | "elite">("pro");
  const [newCodeCycle, setNewCodeCycle] = useState<"monthly" | "yearly">("monthly");
  const [newCodeNotes, setNewCodeNotes] = useState("");
  const [generatedCodeResult, setGeneratedCodeResult] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Toast / feedback state
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // 1. Synchronisation temps réel des demandes d'abonnements
  useEffect(() => {
    if (!db) return;

    setLoading(true);
    const qReq = collection(db, "subscription_requests");
    const unsubReq = onSnapshot(qReq, (snap) => {
      const items: SubscriptionRequest[] = [];
      snap.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as SubscriptionRequest);
      });
      // Trier par date décroissante
      items.sort((a, b) => {
        const timeA = new Date(a.requestedAt || 0).getTime();
        const timeB = new Date(b.requestedAt || 0).getTime();
        return timeB - timeA;
      });
      setRequests(items);
      setLoading(false);
    }, (err) => {
      console.warn("Sync subscription_requests notice:", err);
      setLoading(false);
    });

    // 2. Synchronisation des codes d'activation
    const qCodes = collection(db, "premium_codes");
    const unsubCodes = onSnapshot(qCodes, (snap) => {
      const items: PremiumCodeItem[] = [];
      snap.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as PremiumCodeItem);
      });
      items.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      setCodes(items);
    }, (err) => {
      console.warn("Sync premium_codes notice:", err);
    });

    // 3. Synchronisation des utilisateurs pour l'onglet "Abonnés Actifs"
    const qUsers = collection(db, "users");
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      const items: UserType[] = [];
      snap.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as UserType);
      });
      setAllUsers(items);
    }, (err) => {
      console.warn("Sync users notice:", err);
    });

    // 4. Synchronisation des moyens de paiement manuels
    const unsubPayments = subscribeToManualPaymentConfig((data) => {
      setPaymentOperators(data.operators);
      setPaymentAuditLog(data.auditLog);
    });

    return () => {
      unsubReq();
      unsubCodes();
      unsubUsers();
      unsubPayments();
    };
  }, []);

  // Filtered requests by tab
  const pendingRequests = useMemo(() => {
    return requests.filter(r => r.status === "pending" || !r.status);
  }, [requests]);

  const approvedRequests = useMemo(() => {
    return requests.filter(r => r.status === "approved");
  }, [requests]);

  const rejectedRequests = useMemo(() => {
    return requests.filter(r => r.status === "rejected");
  }, [requests]);

  const activePremiumUsers = useMemo(() => {
    return allUsers.filter(u => u.isPremium || (u as any).premium || (u as any).premiumStatus === "active");
  }, [allUsers]);

  const activeEliteUsersCount = useMemo(() => {
    return activePremiumUsers.filter(u => (u.premiumPlan || "").includes("elite") || (u.subscriptionPlan || "").includes("ELITE")).length;
  }, [activePremiumUsers]);

  const activeProUsersCount = useMemo(() => {
    return activePremiumUsers.length - activeEliteUsersCount;
  }, [activePremiumUsers, activeEliteUsersCount]);

  const totalCollectedBetaAmount = useMemo(() => {
    return approvedRequests.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [approvedRequests]);

  // Apply search query
  const displayedRequests = useMemo(() => {
    let list: SubscriptionRequest[] = [];
    if (activeTab === "pending") list = pendingRequests;
    else if (activeTab === "approved") list = approvedRequests;
    else if (activeTab === "rejected") list = rejectedRequests;

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(r => 
      (r.userName && r.userName.toLowerCase().includes(q)) ||
      (r.userPhone && r.userPhone.includes(q)) ||
      (r.userEmail && r.userEmail.toLowerCase().includes(q)) ||
      (r.paymentReference && r.paymentReference.toLowerCase().includes(q)) ||
      (r.planName && r.planName.toLowerCase().includes(q))
    );
  }, [activeTab, pendingRequests, approvedRequests, rejectedRequests, searchQuery]);

  const displayedActiveUsers = useMemo(() => {
    if (!searchQuery.trim()) return activePremiumUsers;
    const q = searchQuery.toLowerCase();
    return activePremiumUsers.filter(u =>
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.artisticName && u.artisticName.toLowerCase().includes(q)) ||
      (u.phoneNumber && u.phoneNumber.includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.subscriptionPlan && u.subscriptionPlan.toLowerCase().includes(q))
    );
  }, [activePremiumUsers, searchQuery]);

  // Handle Approve
  const handleApprove = async () => {
    if (!approvingRequest || !approvingRequest.id) return;

    setActionLoading(approvingRequest.id);
    try {
      const res = await approveSubscriptionRequest(approvingRequest.id, currentUser);
      if (res.success) {
        showFeedback("success", res.message);
        try { audioSynth?.playValidationSuccess?.(); } catch (_) {}
      } else {
        showFeedback("error", res.message);
      }
    } catch (e: any) {
      showFeedback("error", e.message || "Erreur lors de la validation");
    } finally {
      setActionLoading(null);
      setApprovingRequest(null);
    }
  };

  // Handle Reject
  const handleReject = async () => {
    if (!rejectingRequestId) return;

    setActionLoading(rejectingRequestId);
    try {
      const res = await rejectSubscriptionRequest(rejectingRequestId, rejectionReason, currentUser);
      if (res.success) {
        showFeedback("success", res.message);
      } else {
        showFeedback("error", res.message);
      }
    } catch (e: any) {
      showFeedback("error", e.message || "Erreur lors du rejet");
    } finally {
      setActionLoading(null);
      setRejectingRequestId(null);
    }
  };

  // Handle Prolong Subscription
  const handleExecuteProlong = async () => {
    if (!managingUser) return;
    setActionLoading(managingUser.id || managingUser.uid);
    try {
      const res = await prolongSubscription(
        managingUser.id || managingUser.uid,
        prolongDays,
        currentUser,
        actionReason || "Prolongation administrative Bêta"
      );
      if (res.success) {
        showFeedback("success", res.message);
        try { audioSynth?.playValidationSuccess?.(); } catch (_) {}
      } else {
        showFeedback("error", res.message);
      }
    } catch (e: any) {
      showFeedback("error", e.message || "Erreur lors de la prolongation");
    } finally {
      setActionLoading(null);
      setManagingUser(null);
      setUserActionType(null);
    }
  };

  // Handle Revoke Subscription
  const handleExecuteRevoke = async () => {
    if (!managingUser) return;
    setActionLoading(managingUser.id || managingUser.uid);
    try {
      const res = await revokeSubscription(
        managingUser.id || managingUser.uid,
        currentUser,
        actionReason || "Résiliation par le Fondateur"
      );
      if (res.success) {
        showFeedback("success", res.message);
      } else {
        showFeedback("error", res.message);
      }
    } catch (e: any) {
      showFeedback("error", e.message || "Erreur de révocation");
    } finally {
      setActionLoading(null);
      setManagingUser(null);
      setUserActionType(null);
    }
  };

  // Handle Plan Change
  const handleExecutePlanChange = async () => {
    if (!managingUser) return;
    setActionLoading(managingUser.id || managingUser.uid);
    try {
      const res = await changeSubscriptionPlan(
        managingUser.id || managingUser.uid,
        targetPlan,
        currentUser,
        actionReason || "Ajustement de formule"
      );
      if (res.success) {
        showFeedback("success", res.message);
        try { audioSynth?.playValidationSuccess?.(); } catch (_) {}
      } else {
        showFeedback("error", res.message);
      }
    } catch (e: any) {
      showFeedback("error", e.message || "Erreur de modification de formule");
    } finally {
      setActionLoading(null);
      setManagingUser(null);
      setUserActionType(null);
    }
  };

  // Handle Manual Refund
  const handleExecuteRefund = async () => {
    if (!managingUser) return;
    setActionLoading(managingUser.id || managingUser.uid);
    try {
      const res = await recordManualRefund(
        managingUser.id || managingUser.uid,
        refundAmount,
        refundMethod,
        actionReason || "Remboursement manuel Bêta",
        currentUser
      );
      if (res.success) {
        showFeedback("success", res.message);
      } else {
        showFeedback("error", res.message);
      }
    } catch (e: any) {
      showFeedback("error", e.message || "Erreur de consigne du remboursement");
    } finally {
      setActionLoading(null);
      setManagingUser(null);
      setUserActionType(null);
    }
  };

  // Handle Generate Code
  const handleGenerateCode = async () => {
    try {
      const res = await generateAdminPremiumCode({
        plan: newCodePlan,
        billingCycle: newCodeCycle,
        createdBy: currentUser?.email || "Fondateur",
        notes: newCodeNotes.trim()
      });

      if (res.success && res.code) {
        setGeneratedCodeResult(res.code);
        setNewCodeNotes("");
        showFeedback("success", `Pass ${res.code} généré avec succès !`);
        try { audioSynth?.playValidationSuccess?.(); } catch (_) {}
      } else {
        showFeedback("error", res.message || "Erreur de génération");
      }
    } catch (e: any) {
      showFeedback("error", e.message || "Erreur de génération du code");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const copyOperatorPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedOperatorPhone(phone);
    setTimeout(() => setCopiedOperatorPhone(null), 2500);
  };

  const handleToggleOperator = async (op: ManualPaymentOperatorConfig) => {
    const nextEnabled = !op.enabled;
    if (nextEnabled && (!op.phoneNumber || !isValidIvorianPhoneNumber(op.phoneNumber))) {
      showFeedback("error", `Impossible d'activer ${op.displayName} sans un numéro ivoirien valide.`);
      return;
    }

    try {
      const res = await updateManualPaymentOperator(
        op.id,
        { enabled: nextEnabled },
        currentUser || { email: "jhs.kmj7@gmail.com", displayName: "Fondateur" }
      );
      if (res.success) {
        showFeedback("success", `${op.displayName} est maintenant ${nextEnabled ? "DISPONIBLE" : "INDISPONIBLE"}.`);
        try { audioSynth?.playValidationSuccess?.(); } catch (_) {}
      } else {
        showFeedback("error", res.message);
      }
    } catch (e: any) {
      showFeedback("error", e.message || "Erreur lors de la mise à jour");
    }
  };

  const handleOpenEditOperator = (op: ManualPaymentOperatorConfig) => {
    setEditingOperator(op);
    setEditPhoneInput(op.phoneNumber || "");
    setEditEnabledInput(op.enabled);
    setEditPhoneError("");
    setIsConfirmingReplace(false);
  };

  const handleSaveEditOperator = async () => {
    if (!editingOperator) return;

    const trimmed = editPhoneInput.trim();
    if (!isValidIvorianPhoneNumber(trimmed)) {
      setEditPhoneError("Format invalide. Numéro ivoirien requis (10 chiffres, ex: 07 00 00 00 00 ou +225...)");
      return;
    }

    setIsSavingPaymentMethod(true);
    setEditPhoneError("");

    try {
      const res = await updateManualPaymentOperator(
        editingOperator.id,
        {
          phoneNumber: trimmed,
          enabled: editEnabledInput
        },
        currentUser || { email: "jhs.kmj7@gmail.com", displayName: "Fondateur" }
      );

      if (res.success) {
        showFeedback("success", `Numéro officiel ${editingOperator.displayName} mis à jour : ${formatIvorianPhoneNumber(trimmed)}`);
        try { audioSynth?.playValidationSuccess?.(); } catch (_) {}
        setEditingOperator(null);
      } else {
        setEditPhoneError(res.message);
      }
    } catch (err: any) {
      setEditPhoneError(err?.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsSavingPaymentMethod(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast Feedback */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-bold transition-all shadow-lg animate-in fade-in slide-in-from-top-2 ${
          feedback.type === "success" 
            ? "bg-emerald-950/90 border-emerald-500 text-emerald-300" 
            : "bg-red-950/90 border-red-500 text-red-300"
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Header Banner & Stats */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-zinc-950 via-black to-zinc-900 border border-afri-gold/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-afri-gold animate-pulse" />
              <h1 className="text-base sm:text-lg font-black text-afri-gold uppercase tracking-wider">
                GESTION MANUELLE DES ABONNEMENTS BÊTA
              </h1>
            </div>
            <p className="text-xs text-afri-text-muted mt-1 max-w-xl">
              Validation souveraine des preuves de paiement (Wave, Orange Money, Moov, MTN), gestion des abonnés actifs et émission de codes d'accès uniques.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-afri-bg/80 border border-amber-500/30">
              <div className="text-[10px] uppercase font-bold text-amber-400">En Attente</div>
              <div className="text-base font-black font-mono text-white mt-0.5">{pendingRequests.length}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-afri-bg/80 border border-emerald-500/30">
              <div className="text-[10px] uppercase font-bold text-emerald-400">Abonnés Actifs</div>
              <div className="text-base font-black font-mono text-white mt-0.5">{activePremiumUsers.length}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-afri-bg/80 border border-purple-500/30">
              <div className="text-[10px] uppercase font-bold text-purple-400">Elite / Pro</div>
              <div className="text-xs font-black font-mono text-white mt-1">{activeEliteUsersCount} / {activeProUsersCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-afri-bg/80 border border-afri-gold/30">
              <div className="text-[10px] uppercase font-bold text-afri-gold">Cotisations Bêta</div>
              <div className="text-xs font-black font-mono text-afri-gold mt-1">{totalCollectedBetaAmount.toLocaleString("fr-FR")} F</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "pending"
                ? "bg-amber-500 text-black shadow-md"
                : "bg-afri-bg-sec text-afri-text-muted hover:text-white border border-afri-border"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>En Attente</span>
            {pendingRequests.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === "pending" ? "bg-black text-amber-400" : "bg-amber-500/20 text-amber-400"
              }`}>
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("active_users")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "active_users"
                ? "bg-afri-gold text-black shadow-md"
                : "bg-afri-bg-sec text-afri-text-muted hover:text-white border border-afri-border"
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Abonnés Actifs</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === "active_users" ? "bg-black text-afri-gold" : "bg-afri-gold/20 text-afri-gold"
            }`}>
              {activePremiumUsers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("approved")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "approved"
                ? "bg-emerald-600 text-black shadow-md"
                : "bg-afri-bg-sec text-afri-text-muted hover:text-white border border-afri-border"
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Validées ({approvedRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("rejected")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "rejected"
                ? "bg-red-600 text-white shadow-md"
                : "bg-afri-bg-sec text-afri-text-muted hover:text-white border border-afri-border"
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Refusées ({rejectedRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("codes")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "codes"
                ? "bg-afri-gold text-black shadow-md"
                : "bg-afri-bg-sec text-afri-text-muted hover:text-white border border-afri-border"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Pass & Codes ({codes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("payment_methods")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "payment_methods"
                ? "bg-cyan-500 text-black shadow-md"
                : "bg-afri-bg-sec text-afri-text-muted hover:text-white border border-afri-border"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Moyens de Paiement</span>
          </button>
        </div>

        {/* Search */}
        {activeTab !== "codes" && activeTab !== "payment_methods" && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-afri-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, tél, réf..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-afri-bg border border-afri-border text-xs text-afri-text placeholder:text-afri-text-muted/60 focus:border-afri-gold focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* TAB CONTENT: Requests List (Pending / Approved / Rejected) */}
      {(activeTab === "pending" || activeTab === "approved" || activeTab === "rejected") && (
        <div className="space-y-3">
          {displayedRequests.length === 0 ? (
            <div className="p-8 text-center bg-afri-bg-sec/30 border border-afri-border/50 rounded-2xl">
              <Clock className="w-8 h-8 text-afri-text-muted/40 mx-auto mb-2" />
              <p className="text-xs text-afri-text-muted">
                {searchQuery ? "Aucune demande correspondant à votre recherche." : "Aucune demande dans cet état."}
              </p>
            </div>
          ) : (
            displayedRequests.map((req) => {
              const isPending = req.status === "pending" || !req.status;
              const isApproved = req.status === "approved";
              const isRejected = req.status === "rejected";
              const isElite = (req.plan || "").toLowerCase().includes("elite");

              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isPending
                      ? "bg-afri-bg-sec/80 border-amber-500/40 shadow-sm"
                      : isApproved
                      ? "bg-afri-bg-sec/50 border-emerald-500/30"
                      : "bg-afri-bg-sec/30 border-red-500/30 opacity-80"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* User & Request Info */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-afri-bg border border-afri-gold/30 flex items-center justify-center text-afri-gold flex-shrink-0 overflow-hidden">
                        {req.userAvatar ? (
                          <img src={req.userAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-sm text-afri-text">
                            {req.userName || "Utilisateur"}
                          </span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            isElite
                              ? "bg-purple-950/60 text-purple-300 border-purple-500/50"
                              : "bg-amber-950/60 text-amber-300 border-amber-500/50"
                          }`}>
                            {req.planName || (isElite ? "GOMBO ELITE" : "GOMBO PRO")} ({req.billingCycle === "yearly" ? "Annuel" : "Mensuel"})
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                            {req.amount.toLocaleString("fr-FR")} FCFA
                          </span>
                        </div>

                        {/* Contacts */}
                        <div className="flex items-center gap-3 text-xs text-afri-text-muted flex-wrap">
                          {req.userPhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-afri-gold" />
                              {req.userPhone}
                            </span>
                          )}
                          {req.userEmail && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-blue-400" />
                              {req.userEmail}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-[11px]">
                            <Calendar className="w-3.5 h-3.5 text-afri-text-muted" />
                            {req.requestedAt ? new Date(req.requestedAt).toLocaleString("fr-FR") : "Date inconnue"}
                          </span>
                        </div>

                        {/* Payment Details */}
                        <div className="mt-2 text-xs bg-afri-bg/60 p-2.5 rounded-xl border border-afri-border space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-afri-text-muted">Moyen de paiement :</span>
                            <span className="font-bold text-afri-gold">{req.paymentMethod || "MANUAL_BETA"}</span>
                          </div>
                          {req.paymentReference && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-afri-text-muted">Référence de transaction :</span>
                              <span className="font-mono font-bold text-afri-text">{req.paymentReference}</span>
                            </div>
                          )}
                          {req.userNote && (
                            <div className="text-[11px] text-afri-text-muted italic pt-1 border-t border-afri-border/50">
                              « {req.userNote} »
                            </div>
                          )}
                        </div>

                        {/* If Rejected: Show reason */}
                        {isRejected && req.rejectionReason && (
                          <div className="mt-2 text-xs bg-red-950/40 border border-red-500/40 text-red-300 p-2.5 rounded-xl">
                            <strong>Motif du refus :</strong> {req.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Proof & Action Buttons */}
                    <div className="flex flex-row md:flex-col items-end md:items-end justify-between gap-2.5 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-afri-border">
                      {/* Proof button if exists */}
                      {req.paymentProofUrl && (
                        <button
                          onClick={() => setSelectedProofUrl(req.paymentProofUrl || null)}
                          className="px-3 py-1.5 rounded-xl bg-afri-bg border border-afri-gold/40 text-afri-gold hover:bg-afri-gold/10 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer min-h-[38px]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Voir la Preuve
                        </button>
                      )}

                      {/* Pending Actions */}
                      {isPending && (
                        <div className="flex items-center gap-2">
                          <button
                            disabled={actionLoading === req.id}
                            onClick={() => setRejectingRequestId(req.id || null)}
                            className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/50 text-red-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer min-h-[44px]"
                          >
                            <XCircle className="w-4 h-4" />
                            Refuser
                          </button>

                          <button
                            disabled={actionLoading === req.id}
                            onClick={() => setApprovingRequest(req)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer min-h-[44px]"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Valider & Activer
                          </button>
                        </div>
                      )}

                      {/* Contact on WhatsApp shortcut */}
                      {req.userPhone && (
                        <a
                          href={`https://wa.me/${req.userPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Bonjour ${req.userName}, concernant votre demande d'abonnement ${req.planName || "AFRIGOMBO ELITE"}...`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 mt-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Contacter sur WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 4: Active Premium Users (Full Management Suite) */}
      {activeTab === "active_users" && (
        <div className="space-y-3">
          {displayedActiveUsers.length === 0 ? (
            <div className="p-8 text-center bg-afri-bg-sec/30 border border-afri-border/50 rounded-2xl">
              <Crown className="w-10 h-10 text-afri-gold/50 mx-auto mb-2" />
              <p className="text-sm font-bold text-afri-text-muted">
                {searchQuery ? "Aucun abonné actif correspondant." : "Aucun abonné actif actuellement."}
              </p>
            </div>
          ) : (
            displayedActiveUsers.map((u) => {
              const plan = u.subscriptionPlan || (u.premiumPlan === "elite" ? "GOMBO ELITE" : "GOMBO PRO");
              const isElite = (u.premiumPlan || "").includes("elite") || (u.subscriptionPlan || "").includes("ELITE");
              const expiryFormatted = u.subscriptionExpiryDate || (u.premiumExpiresAt ? new Date(u.premiumExpiresAt).toLocaleDateString("fr-FR") : "Indéterminé");

              return (
                <div
                  key={u.id || u.uid}
                  className="p-4 rounded-2xl bg-afri-bg-sec/70 border border-afri-gold/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-afri-bg border border-afri-gold/30 flex items-center justify-center text-afri-gold overflow-hidden flex-shrink-0">
                      {u.photoURL || u.avatarUrl ? (
                        <img src={u.photoURL || u.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-afri-text flex items-center gap-2 flex-wrap">
                        <span>{u.name || u.displayName || u.artisticName || "Membre"}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          isElite
                            ? "bg-purple-950/60 text-purple-300 border-purple-500/50"
                            : "bg-amber-950/60 text-amber-300 border-amber-500/50"
                        }`}>
                          {plan}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                          Actif
                        </span>
                      </div>
                      <div className="text-xs text-afri-text-muted flex items-center gap-3 mt-1 flex-wrap">
                        <span>Expire le : <strong className="text-white">{expiryFormatted}</strong></span>
                        {u.phoneNumber && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-afri-gold" /> {u.phoneNumber}</span>}
                        {u.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-blue-400" /> {u.email}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions Dropdown / Direct Buttons */}
                  <div className="flex items-center gap-2 flex-wrap justify-end pt-2 md:pt-0 border-t md:border-t-0 border-afri-border">
                    {/* Prolong Button */}
                    <button
                      onClick={() => {
                        setManagingUser(u);
                        setUserActionType("prolong");
                        setProlongDays(30);
                        setActionReason("Prolongation manuelle Bêta");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-afri-bg hover:bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer min-h-[38px]"
                      title="Prolonger la durée"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Prolonger</span>
                    </button>

                    {/* Change Plan Button */}
                    <button
                      onClick={() => {
                        setManagingUser(u);
                        setUserActionType("change_plan");
                        setTargetPlan(isElite ? "pro" : "elite");
                        setActionReason("Basculement de formule");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-afri-bg hover:bg-purple-950/40 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer min-h-[38px]"
                      title="Changer de formule"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>{isElite ? "Passer PRO" : "Passer ELITE"}</span>
                    </button>

                    {/* Manual Refund */}
                    <button
                      onClick={() => {
                        setManagingUser(u);
                        setUserActionType("refund");
                        setRefundAmount(isElite ? 1000 : 500);
                        setActionReason("Remboursement manuel exceptionnel");
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-afri-bg hover:bg-zinc-800 border border-zinc-700 text-afri-text-muted hover:text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer min-h-[38px]"
                      title="Enregistrer un remboursement manuel"
                    >
                      <DollarSign className="w-3.5 h-3.5 text-afri-gold" />
                      <span>Rembourser</span>
                    </button>

                    {/* Revoke */}
                    <button
                      onClick={() => {
                        setManagingUser(u);
                        setUserActionType("revoke");
                        setActionReason("Résiliation demandée par l'utilisateur ou motif disciplinaire");
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-red-950/30 hover:bg-red-900/60 border border-red-500/40 text-red-400 hover:text-red-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer min-h-[38px]"
                      title="Résilier immédiatement"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Résilier</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 5: Codes Pass Bêta & Generator */}
      {activeTab === "codes" && (
        <div className="space-y-6">
          {/* Generator Card */}
          <div className="p-5 rounded-2xl bg-afri-bg-sec border border-afri-gold/40 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-afri-gold" />
              <h2 className="text-sm font-black text-afri-gold uppercase tracking-wide">
                Générateur de Pass / Code d'Activation Bêta
              </h2>
            </div>
            <p className="text-xs text-afri-text-muted">
              Créez des codes d'activation uniques (à usage unique) à transmettre aux utilisateurs ou partenaires.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Plan Choice */}
              <div>
                <label className="text-[11px] font-bold text-afri-text-muted uppercase block mb-1">
                  Formule
                </label>
                <select
                  value={newCodePlan}
                  onChange={(e) => setNewCodePlan(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-afri-bg border border-afri-border text-xs text-afri-text focus:border-afri-gold focus:outline-none"
                >
                  <option value="pro">GOMBO PRO (500 FCFA)</option>
                  <option value="elite">GOMBO ELITE (1 000 FCFA)</option>
                </select>
              </div>

              {/* Cycle Choice */}
              <div>
                <label className="text-[11px] font-bold text-afri-text-muted uppercase block mb-1">
                  Durée
                </label>
                <select
                  value={newCodeCycle}
                  onChange={(e) => setNewCodeCycle(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-afri-bg border border-afri-border text-xs text-afri-text focus:border-afri-gold focus:outline-none"
                >
                  <option value="monthly">Mensuel (30 jours)</option>
                  <option value="yearly">Annuel (365 jours)</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-bold text-afri-text-muted uppercase block mb-1">
                  Destinataire / Note (optionnel)
                </label>
                <input
                  type="text"
                  value={newCodeNotes}
                  onChange={(e) => setNewCodeNotes(e.target.value)}
                  placeholder="Ex: Pass offert à Kofi"
                  className="w-full px-3 py-2.5 rounded-xl bg-afri-bg border border-afri-border text-xs text-afri-text focus:border-afri-gold focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateCode}
              className="w-full py-3 rounded-xl bg-afri-gold hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer min-h-[46px]"
            >
              <Sparkles className="w-4 h-4" />
              Générer le Code Unique
            </button>

            {/* Generated Code Result Box */}
            {generatedCodeResult && (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-between gap-3 animate-in fade-in">
                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-400">Code créé avec succès :</div>
                  <div className="text-lg font-mono font-black text-white tracking-widest mt-0.5">
                    {generatedCodeResult}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(generatedCodeResult)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 text-black font-black text-xs flex items-center gap-1.5 cursor-pointer shadow"
                >
                  {copiedCode === generatedCodeResult ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedCode === generatedCodeResult ? "Copié !" : "Copier"}
                </button>
              </div>
            )}
          </div>

          {/* Existing Codes List */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-afri-text-muted">
              Historique des Codes ({codes.length})
            </h3>

            {codes.length === 0 ? (
              <div className="p-6 text-center bg-afri-bg-sec/30 border border-afri-border/50 rounded-2xl">
                <p className="text-xs text-afri-text-muted">Aucun code généré pour le moment.</p>
              </div>
            ) : (
              codes.map((c) => (
                <div
                  key={c.id || c.code}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 flex-wrap ${
                    c.isUsed
                      ? "bg-afri-bg-sec/30 border-afri-border/40 opacity-70"
                      : "bg-afri-bg-sec border-afri-gold/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-afri-bg border border-afri-gold/20 flex items-center justify-center text-afri-gold">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-afri-text">{c.code}</span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-afri-bg border border-afri-gold/30 text-afri-gold">
                          {c.planName || c.plan.toUpperCase()} ({c.billingCycle === "yearly" ? "1 an" : "1 mois"})
                        </span>
                      </div>
                      <div className="text-[11px] text-afri-text-muted flex items-center gap-2 mt-0.5">
                        <span>Créé le {c.createdAt ? new Date(c.createdAt).toLocaleDateString("fr-FR") : "-"}</span>
                        {c.notes && <span>• Note: {c.notes}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {c.isUsed ? (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-950/60 text-red-300 border border-red-500/30">
                        Utilisé
                      </span>
                    ) : (
                      <>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                          Disponible
                        </span>
                        <button
                          onClick={() => copyToClipboard(c.code)}
                          className="p-2 rounded-xl bg-afri-bg hover:bg-afri-gold/20 border border-afri-gold/30 text-afri-gold transition-all cursor-pointer min-h-[36px]"
                          title="Copier le code"
                        >
                          {copiedCode === c.code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: MOYENS DE PAIEMENT MANUELS */}
      {activeTab === "payment_methods" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-cyan-950/60 via-afri-bg-sec to-emerald-950/40 p-5 rounded-2xl border border-cyan-500/30 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-black text-sm uppercase tracking-wider">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              <span>Configuration des Numéros Officiels de Réception (Mobile Money)</span>
            </div>
            <p className="text-xs text-afri-text-muted leading-relaxed">
              Gérez en temps réel les numéros officiels transmis aux utilisateurs lors de leurs abonnements Premium. Toute modification effectuée ici est <strong className="text-cyan-300 font-bold">instantanément répercutée sur l'application mobile et Web</strong>.
            </p>
          </div>

          {/* Grid Operateurs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["WAVE", "ORANGE_MONEY", "MTN_MOMO", "MOOV_MONEY"] as ManualPaymentOperatorKey[]).map((opKey) => {
              const op = paymentOperators[opKey] || DEFAULT_MANUAL_PAYMENT_OPERATORS[opKey];
              return (
                <div 
                  key={opKey}
                  className={`p-4 rounded-2xl border transition-all space-y-4 ${
                    op.enabled 
                      ? "bg-afri-bg-sec/90 border-cyan-500/40 shadow-lg shadow-cyan-950/20" 
                      : "bg-afri-bg-sec/40 border-afri-border/60 opacity-80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-md"
                        style={{ backgroundColor: op.color || "#0ea5e9" }}
                      >
                        {op.displayName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white flex items-center gap-2">
                          {op.displayName}
                        </h4>
                        <div className="text-[11px] text-afri-text-muted flex items-center gap-1.5 mt-0.5">
                          <span>
                            {op.enabled ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                ACTIF & DISPONIBLE
                              </span>
                            ) : (
                              <span className="text-afri-text-muted font-medium">
                                DÉSACTIVÉ (Masqué aux clients)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleOperator(op)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        op.enabled
                          ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900"
                          : "bg-red-950/60 text-red-300 border border-red-500/40 hover:bg-red-900"
                      }`}
                      title={op.enabled ? "Désactiver cet opérateur" : "Activer cet opérateur"}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{op.enabled ? "ON" : "OFF"}</span>
                    </button>
                  </div>

                  {/* Numéro de réception */}
                  <div className="bg-afri-bg/80 p-3 rounded-xl border border-afri-border flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-afri-text-muted">
                        Numéro officiel de paiement
                      </div>
                      <div className="font-mono font-black text-base text-cyan-300 tracking-wide mt-0.5">
                        {op.phoneNumber || "Non renseigné"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {op.phoneNumber && (
                        <button
                          onClick={() => copyOperatorPhone(op.phoneNumber)}
                          className="p-2 rounded-lg bg-afri-bg-sec hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition cursor-pointer"
                          title="Copier le numéro"
                        >
                          {copiedOperatorPhone === op.phoneNumber ? (
                            <CheckCheck className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEditOperator(op)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-bold text-xs hover:bg-cyan-400 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Modifier</span>
                      </button>
                    </div>
                  </div>

                  {/* Métadonnées de màj */}
                  <div className="text-[10px] text-afri-text-muted flex items-center justify-between pt-1 border-t border-afri-border/40">
                    <span>Mis à jour par : <strong className="text-white">{op.updatedBy || "Système"}</strong></span>
                    <span>
                      {op.updatedAt ? new Date(op.updatedAt).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "-"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Audit Log Section */}
          <div className="bg-afri-bg-sec/80 rounded-2xl border border-afri-border p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-afri-border/60 pb-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-afri-text flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                Journal d'audit des modifications de numéros
              </h4>
              <span className="text-[10px] text-afri-text-muted">Dernières opérations</span>
            </div>

            {paymentAuditLog.length === 0 ? (
              <p className="text-xs text-afri-text-muted italic py-2">
                Aucune modification récente enregistrée.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {paymentAuditLog.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-afri-bg/60 border border-afri-border/50 text-xs flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span className="text-cyan-400 font-mono">[{log.operatorName}]</span>
                        {log.action === "enabled" && <span className="text-emerald-400">Activé</span>}
                        {log.action === "disabled" && <span className="text-red-400">Désactivé</span>}
                        {log.action === "number_updated" && <span className="text-amber-300">Nouveau numéro</span>}
                        {log.previousPhone && log.newPhone && log.previousPhone !== log.newPhone && (
                          <span className="text-afri-text-muted font-normal">
                            ({log.previousPhone} ➔ <strong className="text-cyan-300">{log.newPhone}</strong>)
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-afri-text-muted">
                        Par {log.performedBy} ({log.performedByEmail})
                      </div>
                    </div>
                    <div className="text-[10px] text-afri-text-muted font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Edit Operator Phone & Status */}
      {editingOperator && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-afri-bg-sec border border-cyan-500/50 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-afri-border pb-3">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-xs"
                  style={{ backgroundColor: editingOperator.color || "#0ea5e9" }}
                >
                  {editingOperator.displayName.substring(0, 2).toUpperCase()}
                </div>
                <h3 className="font-bold text-sm text-white">
                  Modifier le numéro {editingOperator.displayName}
                </h3>
              </div>
              <button
                onClick={() => setEditingOperator(null)}
                className="p-1 rounded-lg text-afri-text-muted hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Phone Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-afri-text flex items-center justify-between">
                  <span>Numéro officiel (Côte d'Ivoire)</span>
                  <span className="text-[10px] text-afri-text-muted">Format: 10 chiffres (ex: 0503222712)</span>
                </label>
                <input
                  type="text"
                  value={editPhoneInput}
                  onChange={(e) => {
                    setEditPhoneInput(e.target.value);
                    setEditPhoneError("");
                  }}
                  placeholder="Ex: +225 05 03 22 27 12"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-afri-bg border border-afri-border focus:border-cyan-400 text-white font-mono text-sm outline-none"
                />
                {editPhoneError && (
                  <p className="text-[11px] text-red-400 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{editPhoneError}</span>
                  </p>
                )}
              </div>

              {/* Status toggle inside modal */}
              <div className="p-3 bg-afri-bg/60 rounded-xl border border-afri-border flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Statut de disponibilité</div>
                  <div className="text-[11px] text-afri-text-muted">
                    {editEnabledInput ? "Rendre ce mode sélectionnable par les clients" : "Masquer ce mode aux clients"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditEnabledInput(!editEnabledInput)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                    editEnabledInput
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-red-500/20 text-red-400 border border-red-500/40"
                  }`}
                >
                  {editEnabledInput ? "ACTIF (ON)" : "INACTIF (OFF)"}
                </button>
              </div>

              {/* Notice Banner */}
              <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1 text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Avertissement important</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-normal">
                  Assurez-vous que la puce correspondant à ce numéro est bien active. Toute transaction envoyée vers un mauvais numéro par un client ne pourra pas être récupérée automatiquement.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-afri-border">
              <button
                onClick={() => setEditingOperator(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-afri-text-muted hover:text-white transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEditOperator}
                disabled={isSavingPaymentMethod}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold text-xs hover:bg-cyan-400 transition flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isSavingPaymentMethod ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Enregistrer le numéro</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: View Proof Image */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-afri-bg-sec border border-afri-gold/40 rounded-2xl max-w-lg w-full p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-afri-gold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Preuve de Paiement
              </h3>
              <button
                onClick={() => setSelectedProofUrl(null)}
                className="p-1 rounded-lg text-afri-text-muted hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl overflow-hidden max-h-[70vh] flex items-center justify-center bg-black/40 border border-afri-border">
              <img
                src={selectedProofUrl}
                alt="Preuve de paiement"
                className="max-h-[65vh] w-auto object-contain rounded-lg"
              />
            </div>

            <button
              onClick={() => setSelectedProofUrl(null)}
              className="w-full py-2.5 rounded-xl bg-afri-gold text-black font-bold text-xs"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Confirmation of Approval */}
      {approvingRequest && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-afri-bg-sec border border-emerald-500/50 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-emerald-300">Valider l'Abonnement</h3>
                <p className="text-xs text-afri-text-muted">Confirmation d'activation manuelle</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-afri-bg border border-afri-border text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-afri-text-muted">Bénéficiaire :</span>
                <span className="font-bold text-afri-text">{approvingRequest.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-afri-text-muted">Formule :</span>
                <span className="font-bold text-afri-gold">{approvingRequest.planName} ({approvingRequest.billingCycle === "yearly" ? "1 an" : "1 mois"})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-afri-text-muted">Montant :</span>
                <span className="font-bold text-emerald-400">{approvingRequest.amount.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-afri-text-muted">Moyen :</span>
                <span className="font-bold text-afri-text">{approvingRequest.paymentMethod}</span>
              </div>
            </div>

            <p className="text-[11px] text-afri-text-muted leading-relaxed">
              En confirmant, le profil de l'utilisateur sera instantanément mis à niveau avec tous les privilèges et badges actifs, et une notification de confirmation lui sera transmise.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setApprovingRequest(null)}
                className="flex-1 py-2.5 rounded-xl bg-afri-bg border border-afri-border text-afri-text-muted text-xs font-bold hover:text-white cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black shadow cursor-pointer"
              >
                Confirmer l'Activation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Rejection Reason */}
      {rejectingRequestId && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-afri-bg-sec border border-red-500/50 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-red-300">Refuser la Demande</h3>
                <p className="text-xs text-afri-text-muted">Indiquez le motif au demandeur</p>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-afri-text-muted uppercase block mb-1">
                Motif du refus
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-afri-bg border border-afri-border text-xs text-afri-text mb-2 focus:outline-none"
              >
                <option value="Preuve de paiement non valide ou introuvable.">Preuve de paiement non valide ou introuvable.</option>
                <option value="Montant reçu insuffisant pour la formule choisie.">Montant reçu insuffisant pour la formule choisie.</option>
                <option value="Référence de transaction introuvable sur le relevé.">Référence de transaction introuvable sur le relevé.</option>
                <option value="Autre motif.">Autre motif (personnalisé ci-dessous)</option>
              </select>

              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Précisez le motif..."
                className="w-full px-3 py-2 rounded-xl bg-afri-bg border border-afri-border text-xs text-afri-text focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setRejectingRequestId(null)}
                className="flex-1 py-2.5 rounded-xl bg-afri-bg border border-afri-border text-afri-text-muted text-xs font-bold hover:text-white cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black shadow cursor-pointer"
              >
                Confirmer le Refus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Prolong Subscription */}
      {managingUser && userActionType === "prolong" && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-afri-bg-sec border border-emerald-500/50 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-emerald-300">Prolonger l'Abonnement</h3>
                <p className="text-xs text-afri-text-muted">Membre : {managingUser.name || managingUser.displayName}</p>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-afri-text-muted uppercase block mb-1">Durée supplémentaire</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: "+30 jours", days: 30 },
                  { label: "+90 jours", days: 90 },
                  { label: "+365 jours", days: 365 }
                ].map((opt) => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setProlongDays(opt.days)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer transition ${
                      prolongDays === opt.days 
                        ? "bg-emerald-500 text-black border-emerald-400" 
                        : "bg-afri-bg text-afri-text-muted border-afri-border"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <label className="text-[11px] font-bold text-afri-text-muted uppercase block mb-1">Motif / Justification</label>
              <input
                type="text"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Ex: Geste commercial, régularisation Wave..."
                className="w-full px-3 py-2 rounded-xl bg-afri-bg border border-afri-border text-xs text-afri-text focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => { setManagingUser(null); setUserActionType(null); }}
                className="flex-1 py-2.5 rounded-xl bg-afri-bg border border-afri-border text-afri-text-muted text-xs font-bold hover:text-white cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleExecuteProlong}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black shadow cursor-pointer"
              >
                Prolonger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Change Plan */}
      {managingUser && userActionType === "change_plan" && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-afri-bg-sec border border-purple-500/50 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-purple-300">Modifier la Formule</h3>
                <p className="text-xs text-afri-text-muted">Membre : {managingUser.name || managingUser.displayName}</p>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-afri-text-muted uppercase block mb-1">Nouvelle formule</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setTargetPlan("pro")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer transition ${
                    targetPlan === "pro" 
                      ? "bg-amber-500 text-black border-amber-400" 
                      : "bg-afri-bg text-afri-text-muted border-afri-border"
                  }`}
                >
                  GOMBO PRO (500 F)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetPlan("elite")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer transition ${
                    targetPlan === "elite" 
                      ? "bg-purple-500 text-black border-purple-400" 
                      : "bg-afri-bg text-afri-text-muted border-afri-border"
                  }`}
                >
                  GOMBO ELITE (1 000 F)
                </button>
              </div>

              <label className="text-[11px] font-bold text-afri-text-muted uppercase block mb-1">Motif</label>
              <input
                type="text"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Ex: Upgrade suite paiement complémentaire..."
                className="w-full px-3 py-2 rounded-xl bg-afri-bg border border-afri-border text-xs text-afri-text focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => { setManagingUser(null); setUserActionType(null); }}
                className="flex-1 py-2.5 rounded-xl bg-afri-bg border border-afri-border text-afri-text-muted text-xs font-bold hover:text-white cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleExecutePlanChange}
                className="flex-1 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-black text-xs font-black shadow cursor-pointer"
              >
                Appliquer la Formule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Revoke Subscription */}
      {managingUser && userActionType === "revoke" && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-afri-bg-sec border border-red-500/50 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-red-300">Résilier l'Abonnement</h3>
                <p className="text-xs text-afri-text-muted">Membre : {managingUser.name || managingUser.displayName}</p>
              </div>
            </div>

            <p className="text-xs text-red-300/90 leading-relaxed">
              Attention : Cette action repasse immédiatement le compte en <strong>GOMBO FREE</strong> et retire les badges Premium.
            </p>

            <div>
              <label className="text-[11px] font-bold text-afri-text-muted uppercase block mb-1">Motif de la résiliation</label>
              <input
                type="text"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Ex: Demande de désinscription, motif disciplinaire..."
                className="w-full px-3 py-2 rounded-xl bg-afri-bg border border-afri-border text-xs text-afri-text focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => { setManagingUser(null); setUserActionType(null); }}
                className="flex-1 py-2.5 rounded-xl bg-afri-bg border border-afri-border text-afri-text-muted text-xs font-bold hover:text-white cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleExecuteRevoke}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black shadow cursor-pointer"
              >
                Confirmer la Résiliation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Record Manual Refund */}
      {managingUser && userActionType === "refund" && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-afri-bg-sec border border-afri-gold/50 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-afri-gold flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-afri-gold">Enregistrer un Remboursement Manuel</h3>
                <p className="text-xs text-afri-text-muted">Membre : {managingUser.name || managingUser.displayName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-afri-text-muted uppercase block mb-1">Montant (FCFA)</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-afri-bg border border-afri-border text-xs text-afri-text focus:outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-afri-text-muted uppercase block mb-1">Moyen utilisé</label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-afri-bg border border-afri-border text-xs text-afri-text focus:outline-none"
                >
                  <option value="Wave">Wave</option>
                  <option value="Orange Money">Orange Money</option>
                  <option value="Moov Money">Moov Money</option>
                  <option value="MTN MoMo">MTN MoMo</option>
                  <option value="Espèces">Espèces</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-afri-text-muted uppercase block mb-1">Motif</label>
              <input
                type="text"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Ex: Double paiement par erreur..."
                className="w-full px-3 py-2 rounded-xl bg-afri-bg border border-afri-border text-xs text-afri-text focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => { setManagingUser(null); setUserActionType(null); }}
                className="flex-1 py-2.5 rounded-xl bg-afri-bg border border-afri-border text-afri-text-muted text-xs font-bold hover:text-white cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleExecuteRefund}
                className="flex-1 py-2.5 rounded-xl bg-afri-gold hover:bg-amber-400 text-black text-xs font-black shadow cursor-pointer"
              >
                Consigner le Remboursement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionManagement;
