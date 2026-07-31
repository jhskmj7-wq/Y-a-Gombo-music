import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, ShieldCheck, Clock, CheckCircle2, AlertTriangle, 
  Search, Filter, ArrowUpRight, ArrowDownLeft, RotateCcw, 
  DollarSign, MessageSquare, Send, Paperclip, X, Eye, 
  ShieldAlert, User, Shield, Check, RefreshCw, FileSpreadsheet, Download, FileCode
} from "lucide-react";
import { db } from "../../lib/firebase";
import { 
  collection, query, onSnapshot, orderBy, doc, getDoc, where 
} from "firebase/firestore";
import { 
  ContractData, ContractDispute, ContractMessage, ContractStatus,
  arbitrateContractDispute, sendContractMessage, completeContractAndReleaseFunds, refuseContract
} from "../../lib/contractEscrowEngine";

interface AdminContractsProps {
  currentUser?: any;
}

export default function AdminContracts({ currentUser }: AdminContractsProps) {
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [disputes, setDisputes] = useState<ContractDispute[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("all");

  // Selected Contract Modal
  const [selectedContract, setSelectedContract] = useState<ContractData | null>(null);
  const [messages, setMessages] = useState<ContractMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");

  // Arbitration Modal State
  const [activeDispute, setActiveDispute] = useState<ContractDispute | null>(null);
  const [resolutionType, setResolutionType] = useState<"release_artist" | "refund_promoter">("release_artist");
  const [resolutionNotes, setResolutionNotes] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Real-time contracts listener
  useEffect(() => {
    const q = collection(db, "contracts");
    const unsub = onSnapshot(q, (snap) => {
      const list: ContractData[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        list.push({
          id: d.id,
          ...data,
          statut: data.statut || data.status || "waiting_payment"
        });
      });

      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setContracts(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 2. Real-time disputes listener
  useEffect(() => {
    const q = collection(db, "contractDisputes");
    const unsub = onSnapshot(q, (snap) => {
      const list: ContractDispute[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as ContractDispute);
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setDisputes(list);
    });

    return () => unsub();
  }, []);

  // 3. Real-time messages listener when contract is selected
  useEffect(() => {
    if (!selectedContract) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, "contractMessages"),
      where("contractId", "==", selectedContract.id)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: ContractMessage[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as ContractMessage);
      });
      list.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      setMessages(list);
    });

    return () => unsub();
  }, [selectedContract]);

  // Keep active dispute synced with selected contract
  useEffect(() => {
    if (selectedContract) {
      const disp = disputes.find(d => d.contractId === selectedContract.id && d.statut === "open");
      setActiveDispute(disp || null);
    }
  }, [selectedContract, disputes]);

  // Stats calculations
  const totalEscrowLocked = contracts.reduce((acc, c) => acc + (c.escrowBalance || 0), 0);
  const totalCommissionsEarned = contracts
    .filter(c => c.statut === "completed" || c.status === "completed")
    .reduce((acc, c) => acc + (c.commission || 0), 0);

  const countWaiting = contracts.filter(c => c.statut === "waiting_payment" || c.status === "waiting_payment" || c.status === "generated").length;
  const countFunded = contracts.filter(c => c.statut === "funded" || c.status === "funded").length;
  const countInProgress = contracts.filter(c => ["accepted", "in_progress", "signed", "arrived", "completed_artist"].includes(c.statut || c.status || "")).length;
  const countCompleted = contracts.filter(c => c.statut === "completed" || c.status === "completed").length;
  const countDisputed = contracts.filter(c => c.statut === "disputed" || c.status === "disputed").length;
  const countCancelled = contracts.filter(c => ["cancelled", "refunded"].includes(c.statut || c.status || "")).length;

  // Filtered list
  const filteredContracts = contracts.filter(c => {
    const term = searchTerm.toLowerCase();
    const matchSearch = !term || (
      (c.titre || "").toLowerCase().includes(term) ||
      (c.promoterName || "").toLowerCase().includes(term) ||
      (c.artistName || "").toLowerCase().includes(term) ||
      (c.id || "").toLowerCase().includes(term)
    );

    if (!matchSearch) return false;

    if (activeTab === "all") return true;
    if (activeTab === "waiting") return c.statut === "waiting_payment" || c.status === "waiting_payment" || c.status === "generated";
    if (activeTab === "funded") return c.statut === "funded" || c.status === "funded";
    if (activeTab === "in_progress") return ["accepted", "in_progress", "signed", "arrived", "completed_artist"].includes(c.statut || c.status || "");
    if (activeTab === "completed") return c.statut === "completed" || c.status === "completed";
    if (activeTab === "disputed") return c.statut === "disputed" || c.status === "disputed";
    if (activeTab === "cancelled") return ["cancelled", "refunded"].includes(c.statut || c.status || "");

    return true;
  });

  // Handle Send Admin Message in Contract Chat
  const handleSendAdminMessage = async () => {
    if (!selectedContract || !newMessage.trim()) return;
    try {
      const adminName = currentUser?.displayName || currentUser?.email || "Super Fondateur (Admin)";
      const adminId = currentUser?.uid || "admin_souverain";

      await sendContractMessage({
        contractId: selectedContract.id,
        senderId: adminId,
        senderName: adminName,
        senderRole: "admin",
        text: newMessage.trim()
      });

      setNewMessage("");
    } catch (err) {
      showToast("Erreur lors de l'envoi du message.", "error");
    }
  };

  // Handle Execute Dispute Arbitration
  const handleExecuteArbitration = async () => {
    if (!selectedContract || !activeDispute || !resolutionNotes.trim()) {
      showToast("Veuillez indiquer le motif d'arbitrage officiel.", "error");
      return;
    }

    setProcessing(true);
    try {
      const adminId = currentUser?.uid || "admin_souverain";
      const adminName = currentUser?.displayName || currentUser?.email || "Super Fondateur";

      const res = await arbitrateContractDispute({
        disputeId: activeDispute.id,
        contractId: selectedContract.id,
        resolution: resolutionType,
        resolutionNotes,
        adminId,
        adminName
      });

      if (res.success) {
        showToast(`⚖️ Litige arbitré avec succès (${resolutionType === "release_artist" ? "Versement Artiste" : "Remboursement Promoteur"}).`);
        setResolutionNotes("");
      } else {
        showToast(res.error || "Erreur lors de l'arbitrage.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Erreur.", "error");
    } finally {
      setProcessing(false);
    }
  };

  // Helper status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "waiting_payment":
      case "generated":
        return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg text-[9px] font-mono uppercase font-bold">En attente paiement</span>;
      case "funded":
        return <span className="px-2.5 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded-lg text-[9px] font-mono uppercase font-bold">Financé (Séquestre)</span>;
      case "accepted":
      case "signed":
        return <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg text-[9px] font-mono uppercase font-bold">Contrat Accepté</span>;
      case "in_progress":
      case "arrived":
      case "completed_artist":
        return <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-lg text-[9px] font-mono uppercase font-bold animate-pulse">En cours</span>;
      case "completed":
        return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-[9px] font-mono uppercase font-bold">Terminé & Libéré</span>;
      case "disputed":
        return <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-lg text-[9px] font-mono uppercase font-bold">Litige Actif 🚨</span>;
      case "cancelled":
      case "refunded":
        return <span className="px-2.5 py-1 bg-afri-bg-ter text-afri-text-sec border border-afri-border rounded-lg text-[9px] font-mono uppercase font-bold">Annulé / Remboursé</span>;
      default:
        return <span className="px-2.5 py-1 bg-afri-bg-ter text-afri-text-sec border border-afri-border rounded-lg text-[9px] font-mono uppercase font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 text-left font-sans select-none relative animate-fadeIn pb-12">
      
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className={`fixed top-20 left-1/2 z-[120] px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border ${
              toast.type === "success" 
                ? "bg-afri-bg border-[#D4AF37] text-[#D4AF37]" 
                : "bg-afri-bg border-rose-500 text-rose-400"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-afri-bg border border-[#D4AF37]/40 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-afri-text uppercase tracking-wider font-sans">
              SUPERVISION ET ARBITRAGE DES CONTRATS (ESCROW)
            </h2>
            <p className="text-xs text-afri-text-sec font-mono">
              Tiers de confiance souverain : suivi temps réel, coffre-fort séquestre et arbitrage de litiges
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 bg-afri-bg-sec border border-afri-border rounded-2xl text-right">
            <span className="text-[9px] text-afri-text-muted font-mono uppercase block">Total Séquestre Bloqué</span>
            <span className="text-sm font-black font-mono text-[#D4AF37]">
              {totalEscrowLocked.toLocaleString("fr-FR")} FCFA
            </span>
          </div>
          <div className="px-4 py-2 bg-afri-bg-sec border border-afri-border rounded-2xl text-right">
            <span className="text-[9px] text-afri-text-muted font-mono uppercase block">Commissions Perçues</span>
            <span className="text-sm font-black font-mono text-emerald-400">
              {totalCommissionsEarned.toLocaleString("fr-FR")} FCFA
            </span>
          </div>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "En Attente", count: countWaiting, color: "text-amber-400 border-amber-500/20 bg-amber-500/5", id: "waiting" },
          { label: "Financés", count: countFunded, color: "text-sky-400 border-sky-500/20 bg-sky-500/5", id: "funded" },
          { label: "En Cours", count: countInProgress, color: "text-purple-400 border-purple-500/20 bg-purple-500/5", id: "in_progress" },
          { label: "Terminés", count: countCompleted, color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5", id: "completed" },
          { label: "Litiges", count: countDisputed, color: "text-rose-400 border-rose-500/20 bg-rose-500/5", id: "disputed" },
          { label: "Annulés/Remb.", count: countCancelled, color: "text-afri-text-sec border-afri-border bg-afri-bg-sec", id: "cancelled" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`p-3.5 rounded-2xl border transition text-left cursor-pointer ${item.color} ${
              activeTab === item.id ? "ring-2 ring-[#D4AF37]" : ""
            }`}
          >
            <span className="text-[10px] font-mono font-bold uppercase block opacity-80">{item.label}</span>
            <span className="text-lg font-black font-mono block mt-1">{item.count}</span>
          </button>
        ))}
      </div>

      {/* SEARCH AND TAB BAR */}
      <div className="bg-afri-bg border border-zinc-800/80 rounded-3xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-800/80 pb-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Liste des Contrats ({filteredContracts.length})</span>
            </h3>
            <p className="text-[10px] text-afri-text-sec font-mono">Consultez, écoutez les échanges et arbitrez en temps réel</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-afri-text-muted" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Titre, Promoteur, Artiste, ID..."
                className="w-full pl-8 pr-3 py-1.5 bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37]/60 rounded-xl text-xs text-afri-text outline-none font-mono"
              />
            </div>

            <button
              onClick={() => setActiveTab("all")}
              className={`py-1 px-3 rounded-lg text-[9px] font-mono font-bold uppercase transition border cursor-pointer ${
                activeTab === "all" ? "bg-[#D4AF37] text-black border-[#D4AF37]" : "bg-afri-bg-sec border-afri-border text-afri-text-sec hover:text-afri-text"
              }`}
            >
              Tous
            </button>
          </div>
        </div>

        {/* CONTRACTS TABLE LIST */}
        <div className="divide-y divide-zinc-800/60 max-h-[480px] overflow-y-auto no-scrollbar">
          {filteredContracts.length === 0 ? (
            <div className="py-12 text-center text-afri-text-muted font-mono text-xs">
              Aucun contrat correspondant.
            </div>
          ) : (
            filteredContracts.map((contract) => {
              const dateStr = contract.createdAt ? new Date(contract.createdAt).toLocaleDateString("fr-FR") : "Récent";
              const isDisputed = contract.statut === "disputed" || contract.status === "disputed";

              return (
                <div
                  key={contract.id}
                  className={`py-3.5 px-3 hover:bg-afri-bg-sec rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-left transition ${
                    isDisputed ? "bg-rose-950/15 border border-rose-500/30" : ""
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-2xl bg-afri-bg-sec border border-afri-border flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-black text-afri-text truncate max-w-xs sm:max-w-md">
                          {contract.titre}
                        </h4>
                        {renderStatusBadge(contract.statut || contract.status || "")}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-afri-text-sec">
                        <span>Promoteur : <strong className="text-afri-text">{contract.promoterName || contract.promoterId}</strong></span>
                        <span>➔</span>
                        <span>Artiste : <strong className="text-[#D4AF37]">{contract.artistName || contract.artistId}</strong></span>
                        <span>•</span>
                        <span className="text-afri-text-muted">Créé le {dateStr}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-[9px] text-afri-text-muted uppercase font-mono block">Montant Contrat</span>
                      <span className="text-sm font-black font-mono text-[#D4AF37]">
                        {contract.montant.toLocaleString("fr-FR")} FCFA
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedContract(contract)}
                      className="px-3.5 py-2 bg-afri-bg-sec hover:bg-[#D4AF37] hover:text-black border border-afri-border text-afri-text-sec rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Détails & Salon</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL: CONTRACT DETAILS, PRIVATE CHAT & DISPUTE ARBITRATION */}
      <AnimatePresence>
        {selectedContract && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-afri-bg/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-afri-bg border border-[#D4AF37]/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-left"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-afri-text uppercase tracking-wider font-sans flex items-center gap-2">
                      <span>{selectedContract.titre}</span>
                      {renderStatusBadge(selectedContract.statut || selectedContract.status || "")}
                    </h3>
                    <p className="text-[10px] text-afri-text-sec font-mono">ID Contrat : {selectedContract.id}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedContract(null)}
                  className="p-1.5 rounded-full text-afri-text-sec hover:text-afri-text bg-afri-bg-sec border border-afri-border cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body Scrollable */}
              <div className="p-5 space-y-6 overflow-y-auto flex-1 no-scrollbar">

                {/* Financial Overview Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="p-3 bg-afri-bg-sec border border-afri-border rounded-2xl">
                    <span className="text-[9px] text-afri-text-muted uppercase block">Montant Prestation</span>
                    <span className="text-sm font-black text-[#D4AF37]">
                      {selectedContract.montant.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>

                  <div className="p-3 bg-afri-bg-sec border border-afri-border rounded-2xl">
                    <span className="text-[9px] text-afri-text-muted uppercase block">Commission Plateforme</span>
                    <span className="text-sm font-black text-emerald-400">
                      {(selectedContract.commission || 0).toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>

                  <div className="p-3 bg-afri-bg-sec border border-afri-border rounded-2xl">
                    <span className="text-[9px] text-afri-text-muted uppercase block">Net Versé Artiste</span>
                    <span className="text-sm font-black text-sky-400">
                      {(selectedContract.netArtistAmount || Math.round(selectedContract.montant * 0.975)).toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>

                  <div className="p-3 bg-afri-bg-sec border border-afri-border rounded-2xl">
                    <span className="text-[9px] text-afri-text-muted uppercase block">Solde en Séquestre</span>
                    <span className="text-sm font-black text-amber-400">
                      {(selectedContract.escrowBalance || 0).toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                </div>

                {/* Parties details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3.5 bg-zinc-900/60 border border-afri-border rounded-2xl space-y-1">
                    <span className="text-[9px] text-afri-text-muted uppercase font-bold block">Promoteur (Donneur d'Ordre)</span>
                    <div className="text-afri-text font-bold">{selectedContract.promoterName || "Promoteur Anonyme"}</div>
                    <div className="text-[10px] text-afri-text-muted">ID: {selectedContract.promoterId}</div>
                  </div>

                  <div className="p-3.5 bg-zinc-900/60 border border-afri-border rounded-2xl space-y-1">
                    <span className="text-[9px] text-afri-text-muted uppercase font-bold block">Musicien (Prestataire)</span>
                    <div className="text-[#D4AF37] font-bold">{selectedContract.artistName || "Artiste Virtuose"}</div>
                    <div className="text-[10px] text-afri-text-muted">ID: {selectedContract.artistId}</div>
                  </div>
                </div>

                {/* DISPUTE ARBITRATION PANEL (If Disputed or Dispute active) */}
                {activeDispute && (
                  <div className="p-4 bg-rose-950/30 border border-rose-500/50 rounded-2xl space-y-3 text-xs">
                    <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-wider font-mono">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Panneau d'Arbitrage de Litige Impérial</span>
                    </div>

                    <div className="p-3 bg-afri-bg-sec border border-rose-500/30 rounded-xl space-y-1 font-mono text-[11px]">
                      <div className="text-afri-text-sec">Motif du litige soumis par <strong className="text-afri-text">{activeDispute.raisedByName}</strong> :</div>
                      <div className="text-rose-200 font-semibold italic">"{activeDispute.reason}"</div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest block">
                        Décision d'Arbitrage du Super Fondateur
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setResolutionType("release_artist")}
                          className={`p-2.5 rounded-xl border font-mono text-xs font-bold uppercase transition cursor-pointer ${
                            resolutionType === "release_artist"
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                              : "bg-afri-bg-sec border-afri-border text-afri-text-sec"
                          }`}
                        >
                          Valider & Libérer pour l'Artiste
                        </button>

                        <button
                          type="button"
                          onClick={() => setResolutionType("refund_promoter")}
                          className={`p-2.5 rounded-xl border font-mono text-xs font-bold uppercase transition cursor-pointer ${
                            resolutionType === "refund_promoter"
                              ? "bg-amber-500/20 border-amber-500 text-amber-400"
                              : "bg-afri-bg-sec border-afri-border text-afri-text-sec"
                          }`}
                        >
                          Annuler & Rembourser le Promoteur
                        </button>
                      </div>

                      <textarea
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Précisez le motif souverain de votre décision d'arbitrage..."
                        className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] rounded-xl p-3 text-afri-text font-mono text-xs outline-none h-18 resize-none"
                      />

                      <button
                        onClick={handleExecuteArbitration}
                        disabled={processing}
                        className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-afri-text font-mono font-black uppercase text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                      >
                        {processing ? "Arbitrage en cours..." : "Exécuter la Décision d'Arbitrage"}
                      </button>
                    </div>
                  </div>
                )}

                {/* PRIVATE CHAT SALON (`contractMessages`) */}
                <div className="bg-zinc-900/80 border border-afri-border rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-afri-border pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-2 font-mono">
                      <MessageSquare className="w-4 h-4" />
                      <span>Salon de Discussion Privé du Contrat ({messages.length} messages)</span>
                    </h4>
                    <span className="text-[9px] text-afri-text-muted font-mono">Accès Administration Souverain</span>
                  </div>

                  {/* Messages list */}
                  <div className="max-h-52 overflow-y-auto space-y-2 pr-1 font-mono text-xs no-scrollbar">
                    {messages.length === 0 ? (
                      <div className="text-center py-6 text-afri-text-muted text-[11px]">
                        Aucun message échangé pour le moment.
                      </div>
                    ) : (
                      messages.map((m) => {
                        const isAdminMsg = m.senderRole === "admin";
                        return (
                          <div
                            key={m.id}
                            className={`p-2.5 rounded-xl border text-left ${
                              isAdminMsg 
                                ? "bg-[#D4AF37]/10 border-[#D4AF37]/40 text-amber-200" 
                                : "bg-afri-bg border-afri-border text-afri-text-sec"
                            }`}
                          >
                            <div className="flex items-center justify-between text-[9px] text-afri-text-muted mb-1">
                              <span className="font-bold text-afri-text">{m.senderName} ({m.senderRole || "membre"})</span>
                              <span>{m.createdAt ? new Date(m.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                            </div>
                            <p className="text-xs leading-relaxed">{m.text}</p>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Send message box for Admin */}
                  <div className="flex items-center gap-2 pt-2 border-t border-afri-border">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendAdminMessage()}
                      placeholder="Envoyer une directive officielle dans le salon..."
                      className="flex-1 bg-afri-bg border border-afri-border focus:border-[#D4AF37] rounded-xl px-3 py-2 text-xs text-afri-text outline-none font-mono"
                    />
                    <button
                      onClick={handleSendAdminMessage}
                      className="p-2 bg-[#D4AF37] hover:bg-amber-400 text-black rounded-xl transition cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-zinc-900/80 border-t border-afri-border flex justify-end">
                <button
                  onClick={() => setSelectedContract(null)}
                  className="py-2 px-5 bg-afri-bg-ter hover:bg-zinc-700 text-afri-text font-mono font-bold text-xs uppercase rounded-xl transition cursor-pointer"
                >
                  Fermer
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
