import React, { useState, useEffect, useMemo } from "react";
import { 
  Crown, CheckCircle, XCircle, Clock, Search, Filter, RefreshCw, 
  User, Phone, Mail, FileText, ExternalLink, ShieldCheck, Key, 
  Copy, Check, AlertTriangle, ChevronRight, Eye, MessageSquare,
  Sparkles, Calendar, ArrowUpRight, Smartphone, AlertCircle
} from "lucide-react";
import { collection, onSnapshot, query, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { SubscriptionRequest, PremiumCodeItem, User as UserType } from "../../types";
import { 
  approveSubscriptionRequest, 
  rejectSubscriptionRequest, 
  generateAdminPremiumCode 
} from "../../lib/premiumSubscriptionEngine";
import { NotificationService } from "../../lib/NotificationService";

interface AdminSubscriptionManagementProps {
  currentUser: any;
  audioSynth?: any;
}

type TabType = "pending" | "approved" | "rejected" | "active_users" | "codes";

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

  // Modals state
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Rejection modal
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("Preuve de paiement non valide ou introuvable.");

  // Validation modal
  const [approvingRequest, setApprovingRequest] = useState<SubscriptionRequest | null>(null);

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

    return () => {
      unsubReq();
      unsubCodes();
      unsubUsers();
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

  // Handle Approve
  const handleApprove = async () => {
    if (!approvingRequest || !approvingRequest.id) return;

    setActionLoading(approvingRequest.id);
    try {
      const res = await approveSubscriptionRequest(approvingRequest.id, currentUser);
      if (res.success) {
        showFeedback("success", res.message);
        try { audioSynth?.playSuccess?.(); } catch (_) {}
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

  // Handle Generate Code
  const handleGenerateCode = async () => {
    try {
      const res = await generateAdminPremiumCode({
        plan: newCodePlan,
        billingCycle: newCodeCycle,
        createdBy: currentUser?.email || "Fondateur",
        notes: newCodeNotes
      });

      if (res.success && res.code) {
        setGeneratedCodeResult(res.code);
        setNewCodeNotes("");
        showFeedback("success", `Code ${res.code} généré avec succès !`);
        try { audioSynth?.playTamTam?.(); } catch (_) {}
      } else {
        showFeedback("error", res.message || "Erreur de génération");
      }
    } catch (e: any) {
      showFeedback("error", e.message || "Erreur");
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-5 pb-12 font-sans text-afri-text">
      {/* Toast Feedback */}
      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border shadow-lg transition-all animate-in fade-in ${
          feedback.type === "success" 
            ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300" 
            : "bg-red-950/80 border-red-500/50 text-red-300"
        }`}>
          {feedback.type === "success" ? <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />}
          <p className="text-xs sm:text-sm font-medium">{feedback.message}</p>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-afri-bg-sec via-afri-bg to-afri-bg-sec border border-afri-gold/30 rounded-2xl p-4 sm:p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-afri-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-afri-gold/15 border border-afri-gold/40 flex items-center justify-center text-afri-gold flex-shrink-0 shadow-inner">
              <Crown className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-afri-gold flex items-center gap-2">
                Gestion des Abonnements Bêta
                <span className="text-[10px] bg-afri-gold/20 text-afri-gold border border-afri-gold/30 px-2 py-0.5 rounded-full font-mono uppercase">
                  Contrôle Fondateur
                </span>
              </h1>
              <p className="text-xs text-afri-text-muted mt-0.5">
                Validation manuelle des souscriptions Mobile Money (Wave, OM, Moov, MTN) & Pass Bêta
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("codes")}
              className="px-3.5 py-2 rounded-xl bg-afri-gold/15 hover:bg-afri-gold/25 border border-afri-gold/40 text-afri-gold text-xs font-bold flex items-center gap-2 transition-all cursor-pointer min-h-[44px]"
            >
              <Key className="w-4 h-4" />
              Générer un Pass
            </button>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-afri-gold/15">
          <div className="bg-afri-bg/60 border border-afri-gold/20 rounded-xl p-3 text-center">
            <div className="text-[10px] uppercase font-bold text-amber-400">En attente</div>
            <div className="text-xl font-black text-amber-300 mt-0.5">{pendingRequests.length}</div>
          </div>
          <div className="bg-afri-bg/60 border border-afri-gold/20 rounded-xl p-3 text-center">
            <div className="text-[10px] uppercase font-bold text-emerald-400">Validées</div>
            <div className="text-xl font-black text-emerald-300 mt-0.5">{approvedRequests.length}</div>
          </div>
          <div className="bg-afri-bg/60 border border-afri-gold/20 rounded-xl p-3 text-center">
            <div className="text-[10px] uppercase font-bold text-afri-gold">Abonnés Actifs</div>
            <div className="text-xl font-black text-afri-gold mt-0.5">{activePremiumUsers.length}</div>
          </div>
          <div className="bg-afri-bg/60 border border-afri-gold/20 rounded-xl p-3 text-center">
            <div className="text-[10px] uppercase font-bold text-blue-400">Codes Créés</div>
            <div className="text-xl font-black text-blue-300 mt-0.5">{codes.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-afri-border">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer min-h-[44px] ${
            activeTab === "pending"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm"
              : "bg-afri-bg-sec/50 text-afri-text-muted hover:text-afri-text border border-transparent"
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          En attente
          {pendingRequests.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("approved")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer min-h-[44px] ${
            activeTab === "approved"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm"
              : "bg-afri-bg-sec/50 text-afri-text-muted hover:text-afri-text border border-transparent"
          }`}
        >
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          Validées ({approvedRequests.length})
        </button>

        <button
          onClick={() => setActiveTab("rejected")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer min-h-[44px] ${
            activeTab === "rejected"
              ? "bg-red-500/20 text-red-300 border border-red-500/50 shadow-sm"
              : "bg-afri-bg-sec/50 text-afri-text-muted hover:text-afri-text border border-transparent"
          }`}
        >
          <XCircle className="w-4 h-4 text-red-400" />
          Refusées ({rejectedRequests.length})
        </button>

        <button
          onClick={() => setActiveTab("active_users")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer min-h-[44px] ${
            activeTab === "active_users"
              ? "bg-afri-gold/20 text-afri-gold border border-afri-gold/50 shadow-sm"
              : "bg-afri-bg-sec/50 text-afri-text-muted hover:text-afri-text border border-transparent"
          }`}
        >
          <Crown className="w-4 h-4 text-afri-gold" />
          Abonnés Actifs ({activePremiumUsers.length})
        </button>

        <button
          onClick={() => setActiveTab("codes")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer min-h-[44px] ${
            activeTab === "codes"
              ? "bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-sm"
              : "bg-afri-bg-sec/50 text-afri-text-muted hover:text-afri-text border border-transparent"
          }`}
        >
          <Key className="w-4 h-4 text-blue-400" />
          Pass & Codes ({codes.length})
        </button>
      </div>

      {/* Search bar (for request and active users tabs) */}
      {activeTab !== "codes" && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-afri-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, téléphone, référence..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-afri-bg-sec border border-afri-border focus:border-afri-gold text-xs text-afri-text focus:outline-none transition-all placeholder:text-afri-text-muted"
          />
        </div>
      )}

      {/* TAB 1, 2, 3: Requests (Pending, Approved, Rejected) */}
      {(activeTab === "pending" || activeTab === "approved" || activeTab === "rejected") && (
        <div className="space-y-4">
          {displayedRequests.length === 0 ? (
            <div className="p-8 text-center bg-afri-bg-sec/30 border border-afri-border/50 rounded-2xl flex flex-col items-center justify-center">
              <Clock className="w-10 h-10 text-afri-text-muted mb-2 opacity-50" />
              <p className="text-sm font-bold text-afri-text-muted">
                Aucune demande dans cette catégorie.
              </p>
            </div>
          ) : (
            displayedRequests.map((req) => {
              const isElite = (req.plan || "").toLowerCase().includes("elite");
              const isPending = req.status === "pending" || !req.status;
              const isApproved = req.status === "approved";
              const isRejected = req.status === "rejected";

              return (
                <div
                  key={req.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
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

      {/* TAB 4: Active Premium Users */}
      {activeTab === "active_users" && (
        <div className="space-y-3">
          {activePremiumUsers.length === 0 ? (
            <div className="p-8 text-center bg-afri-bg-sec/30 border border-afri-border/50 rounded-2xl">
              <Crown className="w-10 h-10 text-afri-gold/50 mx-auto mb-2" />
              <p className="text-sm font-bold text-afri-text-muted">Aucun abonné actif actuellement.</p>
            </div>
          ) : (
            activePremiumUsers.map((u) => {
              const plan = u.subscriptionPlan || (u.premiumPlan === "elite" ? "GOMBO ELITE" : "GOMBO PRO");
              const isElite = (u.premiumPlan || "").includes("elite");

              return (
                <div
                  key={u.id || u.uid}
                  className="p-4 rounded-2xl bg-afri-bg-sec/60 border border-afri-gold/30 flex items-center justify-between gap-3 flex-wrap"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-afri-bg border border-afri-gold/30 flex items-center justify-center text-afri-gold overflow-hidden flex-shrink-0">
                      {u.photoURL || u.avatarUrl ? (
                        <img src={u.photoURL || u.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-afri-text flex items-center gap-2">
                        {u.name || u.displayName || u.artisticName || "Membre"}
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          isElite
                            ? "bg-purple-950/60 text-purple-300 border-purple-500/50"
                            : "bg-amber-950/60 text-amber-300 border-amber-500/50"
                        }`}>
                          {plan}
                        </span>
                      </div>
                      <div className="text-xs text-afri-text-muted flex items-center gap-2 mt-0.5">
                        <span>Expire le : <strong>{u.subscriptionExpiryDate || (u.premiumExpiresAt ? new Date(u.premiumExpiresAt).toLocaleDateString("fr-FR") : "Indéterminé")}</strong></span>
                        {u.phoneNumber && <span>• {u.phoneNumber}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                      Actif
                    </span>
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
                className="flex-1 py-2.5 rounded-xl bg-afri-bg border border-afri-border text-afri-text-muted text-xs font-bold hover:text-white"
              >
                Annuler
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black shadow"
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
                className="flex-1 py-2.5 rounded-xl bg-afri-bg border border-afri-border text-afri-text-muted text-xs font-bold hover:text-white"
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black shadow"
              >
                Confirmer le Refus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionManagement;
