import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Scale, 
  Search, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  FileText, 
  ShieldCheck, 
  MessageSquare, 
  Check, 
  X, 
  ChevronRight, 
  Lock, 
  Zap, 
  Calendar,
  Send,
  HelpCircle,
  FolderOpen
} from "lucide-react";
import { db } from "../../lib/firebase";
import { collection, onSnapshot, doc, updateDoc, addDoc, query, orderBy } from "firebase/firestore";
import { audioSynth } from "../../lib/audio";
import { FounderBottomSheet } from "./FounderBottomSheet";

export type DisputeStatus = "OUVERT" | "EN_COURS" | "RESOLU" | "FERME";

export interface AdminDisputeItem {
  id: string;
  disputeNumber: string;
  claimantName: string;
  claimantId: string;
  claimantAvatar?: string;
  claimantEmail?: string;
  defendantName: string;
  defendantId?: string;
  defendantAvatar?: string;
  defendantEmail?: string;
  gomboId?: string;
  gomboTitle?: string;
  amount?: number;
  reason: string;
  message: string;
  status: DisputeStatus;
  rawStatus?: string;
  createdAt: string | number;
  lastActivityAt?: string | number;
  assignedAdmin?: string;
  resolutionNote?: string;
  decision?: "REFUND_CLAIMANT" | "RELEASE_DEFENDANT" | "SPLIT" | "DISMISSED" | "CUSTOM";
  timeline?: {
    date: string | number;
    author: string;
    action: string;
    note?: string;
  }[];
}

interface AdminDisputesManagerProps {
  currentUser?: any;
}

export const AdminDisputesManager: React.FC<AdminDisputesManagerProps> = ({
  currentUser
}) => {
  const [disputes, setDisputes] = useState<AdminDisputeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"TOUTES" | "OUVERTS" | "EN_COURS" | "RESOLUS" | "FERMES">("TOUTES");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDispute, setSelectedDispute] = useState<AdminDisputeItem | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Resolution modal state
  const [resolvingDispute, setResolvingDispute] = useState<AdminDisputeItem | null>(null);
  const [resolutionText, setResolutionText] = useState<string>("");
  const [resolutionDecision, setResolutionDecision] = useState<string>("CUSTOM");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const mapStatus = (raw: string): DisputeStatus => {
    const s = String(raw || "").toUpperCase();
    if (s === "RESOLVED" || s === "RÉSOLU" || s === "RESOLU") return "RESOLU";
    if (s === "CLOSED" || s === "FERMÉ" || s === "FERME") return "FERME";
    if (s === "IN_PROGRESS" || s === "EN_COURS" || s === "PENDING_REVIEW") return "EN_COURS";
    return "OUVERT";
  };

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = collection(db, "disputes");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: AdminDisputeItem[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        const mappedSt = mapStatus(data.status || "OPEN");
        list.push({
          id: d.id,
          disputeNumber: data.disputeNumber || `LIT-${d.id.slice(0, 6).toUpperCase()}`,
          claimantName: data.userName || data.claimantName || data.clientName || "Citoyen",
          claimantId: data.userId || data.claimantId || "",
          claimantAvatar: data.userAvatar || data.claimantAvatar || "",
          claimantEmail: data.userEmail || data.claimantEmail || "",
          defendantName: data.targetUserName || data.defendantName || data.prestataireName || "Partie Adverse",
          defendantId: data.targetUserId || data.defendantId || "",
          defendantAvatar: data.targetUserAvatar || data.defendantAvatar || "",
          defendantEmail: data.targetUserEmail || "",
          gomboId: data.gomboId || "",
          gomboTitle: data.gomboTitle || data.subject || "Contrat Gombo",
          amount: Number(data.amount || data.budget || 0),
          reason: data.reason || data.title || "Litige de prestation",
          message: data.message || data.details || data.description || "",
          status: mappedSt,
          rawStatus: data.status || "OPEN",
          createdAt: data.createdAt || new Date().toISOString(),
          lastActivityAt: data.updatedAt || data.lastActivityAt || data.createdAt || new Date().toISOString(),
          assignedAdmin: data.assignedAdmin || "",
          resolutionNote: data.resolutionNote || data.adminNote || "",
          decision: data.decision || "CUSTOM",
          timeline: data.timeline || []
        });
      });

      // Sort by creation descending
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setDisputes(list);
      setLoading(false);
    }, (err) => {
      console.warn("Disputes realtime listener error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (val?: string | number) => {
    if (!val) return "Date inconnue";
    try {
      const d = typeof val === "number" ? new Date(val) : new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return String(val);
    }
  };

  // Actions
  const handleTakeCharge = async (disp: AdminDisputeItem) => {
    setActionLoadingId(disp.id);
    try {
      const adminEmail = currentUser?.email || "Fondateur Suprême";
      const newTimeline = [
        ...(disp.timeline || []),
        {
          date: new Date().toISOString(),
          author: adminEmail,
          action: "Prise en charge du dossier par l'administrateur",
        }
      ];

      await updateDoc(doc(db, "disputes", disp.id), {
        status: "IN_PROGRESS",
        assignedAdmin: adminEmail,
        updatedAt: new Date().toISOString(),
        timeline: newTimeline
      });

      showToast(`⚖️ Dossier #${disp.disputeNumber} pris en charge.`);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err: any) {
      showToast(`❌ Erreur: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenResolveModal = (disp: AdminDisputeItem) => {
    setResolvingDispute(disp);
    setResolutionText(disp.resolutionNote || "");
    setResolutionDecision("CUSTOM");
  };

  const handleConfirmResolution = async () => {
    if (!resolvingDispute) return;
    setActionLoadingId(resolvingDispute.id);
    try {
      const adminEmail = currentUser?.email || "Fondateur Suprême";
      const newTimeline = [
        ...(resolvingDispute.timeline || []),
        {
          date: new Date().toISOString(),
          author: adminEmail,
          action: `Litige résolu avec décision: ${resolutionDecision}`,
          note: resolutionText
        }
      ];

      await updateDoc(doc(db, "disputes", resolvingDispute.id), {
        status: "RESOLVED",
        resolutionNote: resolutionText,
        decision: resolutionDecision,
        resolvedAt: new Date().toISOString(),
        resolvedBy: adminEmail,
        updatedAt: new Date().toISOString(),
        timeline: newTimeline
      });

      showToast(`✅ Litige #${resolvingDispute.disputeNumber} résolu avec succès.`);
      setResolvingDispute(null);
      if (selectedDispute?.id === resolvingDispute.id) {
        setSelectedDispute(null);
      }
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err: any) {
      showToast(`❌ Erreur arbitrage: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCloseDispute = async (disp: AdminDisputeItem) => {
    setActionLoadingId(disp.id);
    try {
      const adminEmail = currentUser?.email || "Fondateur Suprême";
      const newTimeline = [
        ...(disp.timeline || []),
        {
          date: new Date().toISOString(),
          author: adminEmail,
          action: "Dossier clôturé et archivé"
        }
      ];

      await updateDoc(doc(db, "disputes", disp.id), {
        status: "CLOSED",
        closedAt: new Date().toISOString(),
        closedBy: adminEmail,
        updatedAt: new Date().toISOString(),
        timeline: newTimeline
      });

      showToast(`🔒 Dossier #${disp.disputeNumber} fermé.`);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err: any) {
      showToast(`❌ Erreur fermeture: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Counts
  const countAll = disputes.length;
  const countOuverts = disputes.filter(d => d.status === "OUVERT").length;
  const countEnCours = disputes.filter(d => d.status === "EN_COURS").length;
  const countResolus = disputes.filter(d => d.status === "RESOLU").length;
  const countFermes = disputes.filter(d => d.status === "FERME").length;

  const filteredDisputes = disputes.filter(d => {
    if (activeTab === "OUVERTS" && d.status !== "OUVERT") return false;
    if (activeTab === "EN_COURS" && d.status !== "EN_COURS") return false;
    if (activeTab === "RESOLUS" && d.status !== "RESOLU") return false;
    if (activeTab === "FERMES" && d.status !== "FERME") return false;

    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      d.disputeNumber.toLowerCase().includes(q) ||
      d.claimantName.toLowerCase().includes(q) ||
      d.defendantName.toLowerCase().includes(q) ||
      d.reason.toLowerCase().includes(q) ||
      (d.gomboTitle || "").toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (st: DisputeStatus) => {
    switch (st) {
      case "OUVERT":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30 inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 animate-pulse" /> OUVERT
          </span>
        );
      case "EN_COURS":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> EN COURS
          </span>
        );
      case "RESOLU":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> RÉSOLU
          </span>
        );
      case "FERME":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 inline-flex items-center gap-1">
            <Lock className="w-3 h-3" /> FERMÉ
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-zinc-800 text-zinc-400">
            {st}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-left font-sans select-none">
      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[100000] bg-zinc-950 border border-[#D4AF37] text-zinc-100 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold"
          >
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Arbitration Modal */}
      <AnimatePresence>
        {resolvingDispute && (
          <div className="fixed inset-0 z-[100001] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border-2 border-emerald-500/60 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-left"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white font-mono uppercase">
                      ARBITRAGE DU LITIGE #{resolvingDispute.disputeNumber}
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      Entre {resolvingDispute.claimantName} et {resolvingDispute.defendantName}
                    </p>
                  </div>
                </div>
                <button onClick={() => setResolvingDispute(null)} className="text-zinc-500 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-mono font-bold text-zinc-300 block mb-1.5">
                    Décision d'arbitrage souverain :
                  </label>
                  <select
                    value={resolutionDecision}
                    onChange={(e) => setResolutionDecision(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="REFUND_CLAIMANT">Remboursement intégral du demandeur (Annulation)</option>
                    <option value="RELEASE_DEFENDANT">Libération des fonds au prestataire / défendeur</option>
                    <option value="SPLIT">Partage équitable 50/50 des fonds sous séquestre</option>
                    <option value="DISMISSED">Rejet du litige (Dossier non fondé)</option>
                    <option value="CUSTOM">Accord personnalisé / Médiation concertée</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono font-bold text-zinc-300 block mb-1.5">
                    Motif et notes de clôture (visibles dans l'historique) :
                  </label>
                  <textarea
                    rows={4}
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    placeholder="Détaillez les conclusions de l'arbitrage pour conservation au registre..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setResolvingDispute(null)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-mono text-xs font-bold transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmResolution}
                  disabled={actionLoadingId === resolvingDispute.id}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  {actionLoadingId === resolvingDispute.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Valider l'Arbitrage</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-amber-500/30 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-display font-black text-white uppercase tracking-wider">
                  CHAMBRE D'ARBITRAGE & GESTION DES LITIGES
                </h2>
                <span className="text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  MÉDIATION SOUVERAINE
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Arbitrage des différends, protection des séquestres Escrow et historique des jugements.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-zinc-900/90 border border-zinc-800 px-3.5 py-2 rounded-2xl text-xs font-mono text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span>{countOuverts} Litige(s) Ouvert(s)</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          {[
            { id: "TOUTES", label: "TOUS", count: countAll },
            { id: "OUVERTS", label: "OUVERTS", count: countOuverts },
            { id: "EN_COURS", label: "EN COURS", count: countEnCours },
            { id: "RESOLUS", label: "RÉSOLUS", count: countResolus },
            { id: "FERMES", label: "FERMÉS", count: countFermes },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === t.id
                  ? "bg-[#D4AF37] text-black shadow-md font-black"
                  : "bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              <span>{t.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === t.id ? "bg-black/20 text-black" : "bg-zinc-800 text-zinc-300"
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher litige, partie, motif..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 focus:border-[#D4AF37] rounded-xl text-xs text-white placeholder:text-zinc-500 outline-none transition"
          />
        </div>
      </div>

      {/* Disputes List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-2">
            <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto" />
            <p className="text-xs text-zinc-400 font-mono">Chargement des dossiers d'arbitrage...</p>
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="p-12 text-center bg-zinc-900/40 border border-zinc-800 rounded-3xl space-y-2">
            <Scale className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="text-sm font-bold text-white font-mono">Aucun litige dans cette section.</p>
            <p className="text-xs text-zinc-400">Tous les différends déclarés sont enregistrés ici avec l'historique complet de médiation.</p>
          </div>
        ) : (
          filteredDisputes.map((disp) => {
            const isLoading = actionLoadingId === disp.id;

            return (
              <motion.div
                key={disp.id}
                layout
                className="bg-zinc-950/80 border border-zinc-800/80 hover:border-amber-500/50 rounded-2xl p-4 sm:p-5 transition-all shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
              >
                {/* Details */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                      #{disp.disputeNumber}
                    </span>
                    {getStatusBadge(disp.status)}
                    {disp.amount && disp.amount > 0 ? (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {disp.amount.toLocaleString("fr-FR")} FCFA sous séquestre
                      </span>
                    ) : null}
                    {disp.gomboId && (
                      <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                        Gombo: {disp.gomboTitle || disp.gomboId}
                      </span>
                    )}
                  </div>

                  {/* Title / Reason */}
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                      {disp.reason}
                    </h3>
                    <p className="text-xs font-mono text-zinc-400 mt-0.5">
                      Demandeur : <strong className="text-zinc-200">{disp.claimantName}</strong> ⚔️ Défendeur : <strong className="text-zinc-200">{disp.defendantName}</strong>
                    </p>
                  </div>

                  {/* Snippet */}
                  <p className="text-xs text-zinc-300 font-sans line-clamp-2 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80">
                    {disp.message || "Aucun message complémentaire."}
                  </p>

                  {/* Timestamps */}
                  <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-zinc-500 pt-1">
                    <span>Déclaré le : <strong className="text-zinc-400">{formatDate(disp.createdAt)}</strong></span>
                    <span>Dernière activité : <strong className="text-zinc-400">{formatDate(disp.lastActivityAt)}</strong></span>
                    {disp.assignedAdmin && (
                      <span>Responsable : <strong className="text-amber-400">{disp.assignedAdmin}</strong></span>
                    )}
                  </div>
                </div>

                {/* Actions buttons */}
                <div className="flex items-center gap-2 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-900 shrink-0 flex-wrap">
                  {/* VOIR DOSSIER */}
                  <button
                    onClick={() => setSelectedDispute(disp)}
                    className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-400 text-zinc-100 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>VOIR DOSSIER</span>
                  </button>

                  {/* PRENDRE EN CHARGE */}
                  {disp.status === "OUVERT" && (
                    <button
                      onClick={() => handleTakeCharge(disp)}
                      disabled={isLoading}
                      className="px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>PRENDRE EN CHARGE</span>
                    </button>
                  )}

                  {/* RÉSOUDRE */}
                  {disp.status !== "RESOLU" && disp.status !== "FERME" && (
                    <button
                      onClick={() => handleOpenResolveModal(disp)}
                      disabled={isLoading}
                      className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>RÉSOUDRE</span>
                    </button>
                  )}

                  {/* FERMER */}
                  {disp.status !== "FERME" && (
                    <button
                      onClick={() => handleCloseDispute(disp)}
                      disabled={isLoading}
                      className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>FERMER</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Dispute Detail Bottom Sheet */}
      <FounderBottomSheet
        isOpen={!!selectedDispute}
        onClose={() => setSelectedDispute(null)}
        title={
          selectedDispute ? (
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-400" />
              <span className="font-mono uppercase font-black">DOSSIER LITIGE #{selectedDispute.disputeNumber}</span>
            </div>
          ) : "Litige"
        }
        subtitle={selectedDispute ? `Statut actuel : ${selectedDispute.status} • Déclaré le ${formatDate(selectedDispute.createdAt)}` : ""}
        maxHeight="85dvh"
      >
        {selectedDispute && (
          <div className="space-y-6 text-left font-sans">
            {/* Header badges */}
            <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedDispute.status)}
                  <span className="text-xs font-mono text-zinc-400">
                    Motif : <strong className="text-white">{selectedDispute.reason}</strong>
                  </span>
                </div>
                {selectedDispute.amount && selectedDispute.amount > 0 ? (
                  <span className="text-sm font-black font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                    Séquestre : {selectedDispute.amount.toLocaleString("fr-FR")} FCFA
                  </span>
                ) : null}
              </div>

              {/* Both parties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
                <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-1">
                  <span className="text-[9.5px] font-mono text-zinc-500 uppercase block">Demandeur (Plaignant)</span>
                  <p className="text-xs font-bold text-white">{selectedDispute.claimantName}</p>
                  <p className="text-[10px] font-mono text-zinc-400">{selectedDispute.claimantEmail || "UID: " + selectedDispute.claimantId}</p>
                </div>
                <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-1">
                  <span className="text-[9.5px] font-mono text-zinc-500 uppercase block">Défendeur (Partie mise en cause)</span>
                  <p className="text-xs font-bold text-white">{selectedDispute.defendantName}</p>
                  <p className="text-[10px] font-mono text-zinc-400">{selectedDispute.defendantEmail || "UID: " + selectedDispute.defendantId}</p>
                </div>
              </div>
            </div>

            {/* Description / Messages */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase font-black text-zinc-300">Exposé du Litige</h4>
              <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {selectedDispute.message || "Aucun exposé écrit fourni."}
              </div>
            </div>

            {/* Resolution note if exists */}
            {selectedDispute.resolutionNote && (
              <div className="p-4 bg-emerald-950/30 border border-emerald-600/40 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>DÉCISION D'ARBITRAGE IMPÉRIALE</span>
                </div>
                <p className="text-xs text-emerald-200 whitespace-pre-wrap">{selectedDispute.resolutionNote}</p>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase font-black text-zinc-300">Historique & Actions</h4>
              <div className="space-y-2">
                {(selectedDispute.timeline && selectedDispute.timeline.length > 0) ? (
                  selectedDispute.timeline.map((t, idx) => (
                    <div key={idx} className="p-2.5 bg-zinc-900/40 border border-zinc-800 rounded-xl text-xs font-mono">
                      <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                        <span>{t.author}</span>
                        <span>{formatDate(t.date)}</span>
                      </div>
                      <p className="text-zinc-200 mt-1">{t.action}</p>
                      {t.note && <p className="text-zinc-400 text-[11px] mt-0.5 italic">{t.note}</p>}
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-zinc-900/30 border border-zinc-800 rounded-xl text-xs text-zinc-500 font-mono text-center">
                    Ouverture du dossier le {formatDate(selectedDispute.createdAt)}
                  </div>
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              {selectedDispute.status === "OUVERT" && (
                <button
                  onClick={() => handleTakeCharge(selectedDispute)}
                  className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
                >
                  PRENDRE EN CHARGE
                </button>
              )}
              {selectedDispute.status !== "RESOLU" && selectedDispute.status !== "FERME" && (
                <button
                  onClick={() => handleOpenResolveModal(selectedDispute)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold transition cursor-pointer shadow-md"
                >
                  ARBITRER ET RÉSOUDRE
                </button>
              )}
              {selectedDispute.status !== "FERME" && (
                <button
                  onClick={() => handleCloseDispute(selectedDispute)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
                >
                  CLÔTURER LE DOSSIER
                </button>
              )}
            </div>
          </div>
        )}
      </FounderBottomSheet>
    </div>
  );
};

export default AdminDisputesManager;
