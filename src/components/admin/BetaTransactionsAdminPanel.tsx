import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Lock, 
  RefreshCw, 
  Search, 
  ChevronRight, 
  UserCheck, 
  DollarSign, 
  MessageSquare,
  HelpCircle,
  Flame,
  ArrowUpRight
} from "lucide-react";
import { db } from "../../lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { 
  BetaTransaction, 
  BetaTransactionStatus,
  validateBetaDeposit, 
  refuseBetaDeposit, 
  requestBetaVerification, 
  releaseBetaCachet, 
  openBetaDispute 
} from "../../lib/betaEscrowEngine";
import { supportConfig } from "../../supportConfig";
import { BetaEscrowInfoButton } from "../BetaEscrowInfoModal";
import { audioSynth } from "../../lib/audio";

interface BetaTransactionsAdminPanelProps {
  currentUser?: any;
  onOpenSupportChat?: (user: any) => void;
}

export const BetaTransactionsAdminPanel: React.FC<BetaTransactionsAdminPanelProps> = ({
  currentUser,
  onOpenSupportChat
}) => {
  const [transactions, setTransactions] = useState<BetaTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modal input state for verification note or dispute reason
  const [promptModal, setPromptModal] = useState<{
    type: "verification" | "dispute" | "refusal";
    txId: string;
    artistName: string;
    promoterName: string;
  } | null>(null);
  const [promptInputText, setPromptInputText] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Real-time Firestore Listener on `transactions`
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: BetaTransaction[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          contractId: data.contractId || "",
          gomboId: data.gomboId || "",
          gomboTitle: data.gomboTitle || data.description || "Dépôt Bêta Escrow",
          promoterId: data.promoterId || data.userId || "inconnu",
          promoterName: data.promoterName || data.userName || "Promoteur Bêta",
          artistId: data.artistId || "inconnu",
          artistName: data.artistName || "Artiste",
          amount: Number(data.amount || 0),
          status: (data.status as BetaTransactionStatus) || "en_attente_de_paiement",
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt,
          notes: data.notes || "",
          paymentMethod: data.paymentMethod || "Mobile Money Bêta"
        });
      });
      setTransactions(list);
      setLoading(false);
    }, (err) => {
      console.warn("Transactions real-time sync error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Action handlers calling betaEscrowEngine functions
  const handleValidateDeposit = async (txId: string) => {
    setActionLoadingId(txId);
    try {
      await validateBetaDeposit(txId, currentUser?.displayName || currentUser?.name || "Fondateur / Admin");
      try { audioSynth.playValidationSuccess(); } catch (_) {}
      showToast("🔒 Dépôt validé ! Statut passé à 'fonds_bloqués'. Notifications envoyées.");
    } catch (err: any) {
      showToast(`❌ Erreur: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRefuseDeposit = async (txId: string) => {
    setActionLoadingId(txId);
    try {
      await refuseBetaDeposit(txId, promptInputText || "Dépôt refusé par l'équipe d'administration.");
      try { audioSynth.playKoraNote(200, 0, 0.2, 0.4); } catch (_) {}
      showToast("❌ Dépôt refusé avec succès.");
      setPromptModal(null);
      setPromptInputText("");
    } catch (err: any) {
      showToast(`❌ Erreur: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRequestVerification = async (txId: string) => {
    setActionLoadingId(txId);
    try {
      await requestBetaVerification(txId, promptInputText || "Vérification complémentaire demandée.");
      showToast("🔍 Demande de vérification enregistrée.");
      setPromptModal(null);
      setPromptInputText("");
    } catch (err: any) {
      showToast(`❌ Erreur: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReleaseCachet = async (txId: string) => {
    setActionLoadingId(txId);
    try {
      await releaseBetaCachet(txId, currentUser?.displayName || currentUser?.name || "Fondateur / Admin");
      try { audioSynth.playKoraSuccess(); } catch (_) {}
      showToast("💰 Cachet libéré avec succès à l'artiste !");
    } catch (err: any) {
      showToast(`❌ Erreur: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenDispute = async (txId: string) => {
    setActionLoadingId(txId);
    try {
      await openBetaDispute(txId, promptInputText || "Litige ouvert sur la prestation.");
      showToast("⚠️ Litige ouvert en temps réel. Notification envoyée aux parties.");
      setPromptModal(null);
      setPromptInputText("");
    } catch (err: any) {
      showToast(`❌ Erreur: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered list
  const filteredTransactions = transactions.filter((tx) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (tx.promoterName || "").toLowerCase().includes(term) ||
      (tx.artistName || "").toLowerCase().includes(term) ||
      (tx.gomboTitle || "").toLowerCase().includes(term) ||
      (tx.id || "").toLowerCase().includes(term);

    const matchesStatus = selectedStatusFilter === "all" || tx.status === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: BetaTransactionStatus) => {
    switch (status) {
      case "en_attente_de_paiement":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold uppercase">
            <Clock className="w-3 h-3 animate-spin" />
            <span>En attente de paiement</span>
          </span>
        );
      case "en_attente_validation":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/20 border border-sky-400 text-sky-300 text-[10px] font-mono font-bold uppercase animate-pulse shadow-sm shadow-sky-500/20">
            <Flame className="w-3 h-3 text-sky-400" />
            <span>À VALIDER (Nouveau Dépôt Bêta)</span>
          </span>
        );
      case "fonds_bloqués":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold uppercase">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Fonds Bloqués (Séquestre Active)</span>
          </span>
        );
      case "fonds_liberes":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600/20 border border-emerald-500 text-emerald-300 text-[10px] font-mono font-bold uppercase">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Cachet Libéré (Terminé)</span>
          </span>
        );
      case "litige_ouvert":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 text-[10px] font-mono font-bold uppercase animate-pulse">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span>Litige Ouvert</span>
          </span>
        );
      case "refuse":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-mono font-bold uppercase">
            <XCircle className="w-3 h-3" />
            <span>Dépôt Refusé</span>
          </span>
        );
      case "verification_demandee":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-bold uppercase">
            <Search className="w-3 h-3" />
            <span>Vérification Demandée</span>
          </span>
        );
      default:
        return <span className="text-[10px] font-mono text-zinc-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 text-left font-sans select-none">
      
      {/* Toast message */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-afri-bg-sec border border-[#D4AF37] text-afri-text px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold"
          >
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-afri-bg-sec via-afri-bg-sec/90 to-afri-bg-ter/40 border border-[#D4AF37]/30 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] rounded-2xl">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-afri-text uppercase tracking-wider">
                    TRANSACTIONS BÊTA
                  </h2>
                  <BetaEscrowInfoButton variant="badge" />
                </div>
                <p className="text-xs text-afri-text-sec">
                  Centre de Commandement • Dépôts Sécurisés Escrow & Pilotage Temps Réel
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-afri-bg/70 border border-afri-border px-3.5 py-2 rounded-2xl text-xs font-mono text-afri-text-sec">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Système Séquestre Temps Réel Actif</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-afri-text-sec" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher promoteur, artiste, ID..."
            className="w-full pl-10 pr-4 py-2 bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] rounded-2xl text-xs text-afri-text outline-none"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1">
          {[
            { id: "all", label: "Toutes" },
            { id: "en_attente_validation", label: "⚡ À Valider" },
            { id: "fonds_bloqués", label: "🔒 Bloqués" },
            { id: "fonds_liberes", label: "✅ Libérés" },
            { id: "litige_ouvert", label: "⚠️ Litiges" }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedStatusFilter === f.id
                  ? "bg-[#D4AF37] text-black font-black"
                  : "bg-afri-bg-sec border border-afri-border text-afri-text-sec hover:text-afri-text"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center bg-afri-bg-sec border border-afri-border rounded-3xl space-y-2">
            <RefreshCw className="w-6 h-6 text-[#D4AF37] animate-spin mx-auto" />
            <p className="text-xs text-afri-text-sec font-mono">Chargement des transactions Bêta en temps réel...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-10 text-center bg-afri-bg-sec border border-afri-border rounded-3xl space-y-2">
            <ShieldCheck className="w-8 h-8 text-afri-text-sec/40 mx-auto" />
            <p className="text-sm font-bold text-afri-text">Aucune transaction Bêta trouvée.</p>
            <p className="text-xs text-afri-text-sec">Toutes les nouvelles réservations apparaîtront ici automatiquement.</p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isLoading = actionLoadingId === tx.id;

            return (
              <motion.div
                key={tx.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-3xl bg-afri-bg-sec border transition-all space-y-4 ${
                  tx.status === "en_attente_validation"
                    ? "border-sky-400/60 shadow-[0_4px_20px_rgba(56,189,248,0.1)]"
                    : tx.status === "fonds_bloqués"
                    ? "border-[#D4AF37]/40 shadow-sm"
                    : "border-afri-border hover:border-afri-border/80"
                }`}
              >
                {/* Top Row: Meta info & Status */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-afri-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest bg-afri-bg px-2 py-0.5 rounded-md border border-afri-border">
                      ID: {tx.id.substring(0, 12)}
                    </span>
                    <span className="text-xs text-afri-text-muted font-mono">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString("fr-FR") : ""}
                    </span>
                  </div>
                  <div>{getStatusBadge(tx.status)}</div>
                </div>

                {/* Middle Info Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
                  
                  {/* Auteur */}
                  <div className="p-3 bg-afri-bg/60 rounded-2xl border border-afri-border/60 space-y-1">
                    <span className="text-[9px] text-afri-text-sec uppercase tracking-wider block font-bold">
                      👤 Auteur / Client
                    </span>
                    <p className="font-bold text-afri-text text-sm truncate">{tx.promoterName}</p>
                    <span className="text-[10px] text-afri-text-muted">UID: {tx.promoterId.substring(0, 10)}</span>
                  </div>

                  {/* Type / Titre */}
                  <div className="p-3 bg-afri-bg/60 rounded-2xl border border-afri-border/60 space-y-1">
                    <span className="text-[9px] text-afri-text-sec uppercase tracking-wider block font-bold">
                      📋 Type & Titre
                    </span>
                    <p className="font-bold text-afri-text text-xs truncate">{tx.gomboTitle}</p>
                    <span className="text-[10px] text-amber-400 font-bold block">{tx.artistName || "Candidats Gombo"}</span>
                  </div>

                  {/* Cachet */}
                  <div className="p-3 bg-afri-bg/60 rounded-2xl border border-afri-border/60 space-y-1">
                    <span className="text-[9px] text-afri-text-sec uppercase tracking-wider block font-bold">
                      💼 Cachet
                    </span>
                    <p className="font-black text-[#D4AF37] text-sm">
                      {tx.amount.toLocaleString()} FCFA
                    </p>
                    <span className="text-[9px] text-afri-text-sec block">Frais (2,5%): {Math.round(tx.amount * 0.025).toLocaleString()} FCFA</span>
                  </div>

                  {/* Total Attendu */}
                  <div className="p-3 bg-amber-500/10 rounded-2xl border border-[#D4AF37]/40 space-y-1">
                    <span className="text-[9px] text-[#D4AF37] uppercase tracking-wider block font-bold">
                      💰 Total Attendu
                    </span>
                    <p className="font-black text-[#D4AF37] text-base">
                      {(tx.amount + Math.round(tx.amount * 0.025)).toLocaleString()} FCFA
                    </p>
                    <span className="text-[9px] text-afri-text-sec block">Dépôt requis</span>
                  </div>

                </div>

                {/* Notes or details */}
                {tx.notes && (
                  <div className="text-[11px] text-afri-text-sec bg-afri-bg/40 p-2.5 rounded-xl border border-afri-border/40 font-mono">
                    <strong className="text-afri-text">Note/Suivi:</strong> {tx.notes}
                  </div>
                )}

                {/* Real Action Buttons */}
                <div className="pt-2 border-t border-afri-border/60 flex flex-wrap items-center justify-between gap-3">
                  
                  {/* WhatsApp Contact button */}
                  <button
                    onClick={() => {
                      supportConfig.openSupport(`Suivi du dépôt de garantie pour "${tx.gomboTitle}" (Client: ${tx.promoterName})`);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ouvrir WhatsApp</span>
                  </button>

                  {/* Action group based on status */}
                  <div className="flex items-center gap-2 flex-wrap ml-auto">
                    
                    {/* State: Pending validation / Payment */}
                    {(tx.status === "en_attente_de_paiement" || tx.status === "en_attente_validation" || tx.status === "verification_demandee") && (
                      <>
                        <button
                          disabled={isLoading}
                          onClick={() => handleValidateDeposit(tx.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Valider le dépôt</span>
                        </button>

                        <button
                          disabled={isLoading}
                          onClick={() => setPromptModal({ type: "refusal", txId: tx.id, artistName: tx.artistName, promoterName: tx.promoterName })}
                          className="px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                        >
                          Refuser
                        </button>
                      </>
                    )}

                    {/* State: Funds held / Locked */}
                    {tx.status === "fonds_bloqués" && (
                      <>
                        <button
                          disabled={isLoading}
                          onClick={() => handleReleaseCachet(tx.id)}
                          className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#e0c058] text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Libérer le cachet</span>
                        </button>

                        <button
                          disabled={isLoading}
                          onClick={() => setPromptModal({ type: "dispute", txId: tx.id, artistName: tx.artistName, promoterName: tx.promoterName })}
                          className="px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                        >
                          Ouvrir un litige
                        </button>
                      </>
                    )}

                    {/* State: Already Released or Dispute */}
                    {tx.status === "fonds_liberes" && (
                      <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Cachet transmis</span>
                      </span>
                    )}

                    {tx.status === "litige_ouvert" && (
                      <button
                        disabled={isLoading}
                        onClick={() => handleReleaseCachet(tx.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold hover:bg-emerald-500 hover:text-black cursor-pointer"
                      >
                        Résoudre et Libérer
                      </button>
                    )}

                  </div>

                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modal Prompt for Verification Note or Dispute/Refusal Reason */}
      <AnimatePresence>
        {promptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-afri-bg-sec border border-afri-border rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-left"
            >
              <h3 className="text-base font-black text-afri-text uppercase">
                {promptModal.type === "verification" && "🔍 Demander une vérification"}
                {promptModal.type === "dispute" && "⚠️ Ouvrir un litige"}
                {promptModal.type === "refusal" && "❌ Refuser le dépôt"}
              </h3>

              <p className="text-xs text-afri-text-sec">
                Promoteur: <strong>{promptModal.promoterName}</strong> • Artiste: <strong>{promptModal.artistName}</strong>
              </p>

              <textarea
                rows={3}
                value={promptInputText}
                onChange={(e) => setPromptInputText(e.target.value)}
                placeholder={
                  promptModal.type === "verification"
                    ? "Indiquez les pièces ou précisions manquantes..."
                    : promptModal.type === "dispute"
                    ? "Motif du litige et instructions..."
                    : "Raison du refus..."
                }
                className="w-full p-3 bg-afri-bg border border-afri-border rounded-2xl text-xs text-afri-text outline-none focus:border-[#D4AF37]"
              />

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setPromptModal(null)}
                  className="px-4 py-2 bg-afri-bg border border-afri-border text-afri-text-sec rounded-xl text-xs font-bold cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  onClick={() => {
                    if (promptModal.type === "verification") handleRequestVerification(promptModal.txId);
                    if (promptModal.type === "dispute") handleOpenDispute(promptModal.txId);
                    if (promptModal.type === "refusal") handleRefuseDeposit(promptModal.txId);
                  }}
                  className="px-4 py-2 bg-[#D4AF37] text-black rounded-xl text-xs font-black uppercase cursor-pointer"
                >
                  Confirmer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default BetaTransactionsAdminPanel;
