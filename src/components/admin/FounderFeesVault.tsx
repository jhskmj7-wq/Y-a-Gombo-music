import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Landmark, ShieldCheck, Search, ArrowUpRight, Lock, 
  FileSpreadsheet, Download, RefreshCw, Calendar, CheckCircle2, 
  Coins, Filter, ShieldAlert, FileText, ChevronRight, X, Clock, User
} from "lucide-react";
import { db } from "../../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { safeStringify } from "../../lib/jsonUtils";

interface FounderFeesVaultProps {
  currentUser?: any;
  userEmail?: string;
  onClose?: () => void;
}

export default function FounderFeesVault({ currentUser, userEmail, onClose }: FounderFeesVaultProps) {
  const [feeRecords, setFeeRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [timeFilter, setTimeFilter] = useState<"today" | "7days" | "30days" | "all">("all");

  // Selected Record Modal
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  // Toast message
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Authorization Check
  const effectiveEmail = (userEmail || currentUser?.email || currentUser?.displayName || "").toLowerCase();
  const isAuthorized = 
    effectiveEmail === "jhs.kmj7@gmail.com" || 
    Boolean(currentUser?.isFounder || currentUser?.isSuperFounder || currentUser?.role === "admin" || currentUser?.profile?.isFounder);

  // 1. Real-time Subscription to Commissions & Platform Fee Transactions
  useEffect(() => {
    if (!isAuthorized) {
      setLoading(false);
      return;
    }

    const itemsMap = new Map<string, any>();

    const syncLists = () => {
      const list = Array.from(itemsMap.values());
      list.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.publishedAt || a.timestamp || 0).getTime();
        const timeB = new Date(b.createdAt || b.publishedAt || b.timestamp || 0).getTime();
        return timeB - timeA;
      });
      setFeeRecords(list);
      setLoading(false);
    };

    // Listen to dedicated "commissions" collection
    const unsubComms = onSnapshot(
      collection(db, "commissions"), 
      (snap) => {
        snap.forEach((d) => {
          const data = d.data();
          itemsMap.set(d.id, {
            id: d.id,
            commId: d.id,
            transactionId: data.transactionId || data.id || d.id,
            userId: data.userId || data.uid || "N/A",
            userName: data.userName || data.clientName || "Utilisateur Anonyme",
            userEmail: data.userEmail || data.email || "",
            userPhone: data.userPhone || data.phone || "",
            publicationId: data.publicationId || data.gomboId || "",
            gomboTitle: data.gomboTitle || data.title || "Publication Gombo",
            gomboAmount: Number(data.gomboAmount ?? data.montantGombo ?? data.cachet ?? 0),
            feeRate: Number(data.feeRate ?? data.rate ?? 0.05),
            feeAmount: Number(data.feeAmount ?? data.montantFrais ?? data.frais ?? data.amount ?? 0),
            totalPaid: Number(data.totalPaid ?? data.totalPaye ?? data.totalAmount ?? 0),
            createdAt: data.createdAt || data.publishedAt || new Date().toISOString(),
            timestamp: Number(data.timestamp || Date.now()),
            status: data.status || data.statut || "success",
            type: data.type || "publication_fee"
          });
        });
        syncLists();
      },
      (err) => {
        console.warn("⚠️ [FOUNDER_VAULT] Firestore permissions or query warning:", err);
        setLoading(false);
      }
    );

    // Also listen to "walletTransactions" to catch any platform fee transactions
    const unsubTx = onSnapshot(
      collection(db, "walletTransactions"),
      (snap) => {
        snap.forEach((d) => {
          const data = d.data();
          if (
            data.type === "commission_plateforme" || 
            data.typeTransaction === "commission_plateforme" || 
            data.type === "commission" ||
            (data.description && data.description.toLowerCase().includes("commission"))
          ) {
            const txId = d.id;
            if (!itemsMap.has(txId) && !itemsMap.has(`comm_${txId}`)) {
              const feeVal = Number(data.amount || data.montant || data.fee || 0);
              if (feeVal > 0) {
                itemsMap.set(txId, {
                  id: txId,
                  commId: txId,
                  transactionId: txId,
                  userId: data.userId || data.uid || "N/A",
                  userName: data.userName || "Utilisateur",
                  userEmail: data.userEmail || "",
                  userPhone: data.userPhone || "",
                  publicationId: data.publicationId || data.gomboId || "",
                  gomboTitle: data.gomboTitle || data.description || "Frais de publication",
                  gomboAmount: Number(data.montantGombo || data.gomboAmount || 0),
                  feeRate: Number(data.rate || 0.05),
                  feeAmount: feeVal,
                  totalPaid: Number(data.totalDebite || data.totalPaid || feeVal),
                  createdAt: data.createdAt || new Date().toISOString(),
                  timestamp: Number(data.timestamp || Date.now()),
                  status: data.status || "success",
                  type: "commission_transaction"
                });
              }
            }
          }
        });
        syncLists();
      },
      (err) => {
        console.warn("⚠️ [FOUNDER_VAULT_TX] Listener notice:", err);
      }
    );

    return () => {
      unsubComms();
      unsubTx();
    };
  }, [isAuthorized]);

  // Handle Unauthorized View
  if (!isAuthorized) {
    return (
      <div className="p-8 bg-afri-bg border border-rose-500/30 rounded-3xl text-center space-y-4 max-w-lg mx-auto my-12 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-afri-text uppercase tracking-wider font-sans">
          Accès Réservé au Fondateur Impérial
        </h3>
        <p className="text-xs text-afri-text-sec font-mono leading-relaxed">
          Le Coffre des Frais est un espace souverain strictement privé. Seul le Fondateur autorisé possède les privilèges nécessaires pour consulter le relevé des frais de la plateforme.
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37] text-afri-text rounded-xl text-xs font-bold font-mono transition"
          >
            Fermer l'accès
          </button>
        )}
      </div>
    );
  }

  // Time Filter Filtering Logic
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

  const filteredRecords = feeRecords.filter((rec) => {
    const recTime = new Date(rec.createdAt || rec.timestamp || 0).getTime();

    // Time filter
    if (timeFilter === "today" && recTime < startOfToday) return false;
    if (timeFilter === "7days" && recTime < sevenDaysAgo) return false;
    if (timeFilter === "30days" && recTime < thirtyDaysAgo) return false;

    // Search term
    const queryStr = searchTerm.toLowerCase().trim();
    if (!queryStr) return true;

    const matchName = rec.userName?.toLowerCase().includes(queryStr);
    const matchEmail = rec.userEmail?.toLowerCase().includes(queryStr);
    const matchTitle = rec.gomboTitle?.toLowerCase().includes(queryStr);
    const matchTxId = rec.transactionId?.toLowerCase().includes(queryStr);
    const matchUserId = rec.userId?.toLowerCase().includes(queryStr);

    return matchName || matchEmail || matchTitle || matchTxId || matchUserId;
  });

  // Calculate Real-time Metrics (No Mocks)
  const totalVaultBalance = feeRecords.reduce((acc, r) => acc + (Number(r.feeAmount) || 0), 0);

  const todayVaultFees = feeRecords
    .filter((r) => new Date(r.createdAt || r.timestamp || 0).getTime() >= startOfToday)
    .reduce((acc, r) => acc + (Number(r.feeAmount) || 0), 0);

  const currentMonthVaultFees = feeRecords
    .filter((r) => {
      const d = new Date(r.createdAt || r.timestamp || 0);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((acc, r) => acc + (Number(r.feeAmount) || 0), 0);

  // Export CSV
  const exportCSV = () => {
    const headers = [
      "ID Transaction",
      "Utilisateur",
      "Email / Contact",
      "Publication Gombo",
      "Montant Gombo (FCFA)",
      "Taux Frais (%)",
      "Frais Collectes (FCFA)",
      "Total Paye Utilisateur (FCFA)",
      "Statut",
      "Date Horodatage"
    ];

    const rows = filteredRecords.map((r) => [
      r.transactionId || r.id,
      `"${r.userName || ""}"`,
      `"${r.userEmail || r.userPhone || ""}"`,
      `"${(r.gomboTitle || "").replace(/"/g, '""')}"`,
      r.gomboAmount || 0,
      ((r.feeRate || 0.05) * 100).toFixed(1),
      r.feeAmount || 0,
      r.totalPaid || (r.gomboAmount + r.feeAmount) || 0,
      r.status || "success",
      r.createdAt || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `afrigombo_coffre_des_frais_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("📄 Export CSV du Coffre des Frais généré !");
  };

  // Export JSON
  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(safeStringify(filteredRecords, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `afrigombo_coffre_des_frais_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast("📦 Export JSON du Coffre généré !");
  };

  return (
    <div className="space-y-6 text-left font-sans select-none relative animate-fadeIn pb-12 w-full">
      {/* Toast Notification */}
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
            <CheckCircle2 className="w-4 h-4" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-afri-bg via-afri-bg-sec to-afri-bg border border-[#D4AF37]/50 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] shadow-lg shadow-[#D4AF37]/10 shrink-0">
            <Landmark className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-2xl font-black text-afri-text uppercase tracking-wider font-sans flex items-center gap-2">
                COFFRE DES FRAIS FONDATEUR
              </h2>
              <span className="hidden xs:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40">
                <ShieldCheck className="w-3 h-3" /> PRIVE & SOUVERAIN
              </span>
            </div>
            <p className="text-xs text-afri-text-sec font-mono mt-0.5">
              Comptabilisation autonome et traçabilité directe des frais réellement perçus lors des publications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 relative z-10 w-full md:w-auto justify-end">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 bg-afri-bg-sec hover:bg-afri-bg-ter border border-afri-border hover:border-[#D4AF37] text-afri-text-sec hover:text-afri-text rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportJSON}
            className="px-3.5 py-2 bg-afri-bg-sec hover:bg-afri-bg-ter border border-afri-border hover:border-[#D4AF37] text-afri-text-sec hover:text-afri-text rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Export JSON</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-afri-bg-sec hover:bg-afri-bg-ter border border-afri-border text-afri-text rounded-xl transition cursor-pointer"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3 REAL-TIME FINANCIAL STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Solde Actuel du Coffre */}
        <div className="p-5 bg-afri-bg border border-[#D4AF37]/40 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[#D4AF37]/20 transition-all" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono font-black text-[#D4AF37] uppercase tracking-widest block">
              Solde Actuel du Coffre
            </span>
            <div className="p-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-xl border border-[#D4AF37]/30">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-black font-mono text-afri-text tracking-tight">
              {totalVaultBalance.toLocaleString("fr-FR")}{" "}
              <span className="text-sm font-black text-[#D4AF37]">FCFA</span>
            </h3>
            <p className="text-[10px] text-afri-text-sec font-mono mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Total cumulé des frais réels
            </p>
          </div>
        </div>

        {/* Frais Collectés Aujourd'hui */}
        <div className="p-5 bg-afri-bg border border-zinc-800/80 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono font-black text-afri-text-muted uppercase tracking-widest block">
              Collectés Aujourd'hui
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tracking-tight">
              {todayVaultFees.toLocaleString("fr-FR")}{" "}
              <span className="text-sm font-black">FCFA</span>
            </h3>
            <p className="text-[10px] text-afri-text-sec font-mono mt-1">
              Depuis 00h00 heure serveur
            </p>
          </div>
        </div>

        {/* Frais Collectés Ce Mois */}
        <div className="p-5 bg-afri-bg border border-zinc-800/80 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono font-black text-afri-text-muted uppercase tracking-widest block">
              Collectés Ce Mois
            </span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-black font-mono text-amber-400 tracking-tight">
              {currentMonthVaultFees.toLocaleString("fr-FR")}{" "}
              <span className="text-sm font-black">FCFA</span>
            </h3>
            <p className="text-[10px] text-afri-text-sec font-mono mt-1">
              {feeRecords.length} transactions enregistrées
            </p>
          </div>
        </div>
      </div>

      {/* FILTER BAR & SEARCH */}
      <div className="bg-afri-bg border border-zinc-800/80 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 justify-between items-center shadow-lg">
        {/* Time Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "all", label: "Tout" },
            { id: "today", label: "Aujourd'hui" },
            { id: "7days", label: "7 jours" },
            { id: "30days", label: "30 jours" }
          ].map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeFilter(tf.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition shrink-0 cursor-pointer ${
                timeFilter === tf.id
                  ? "bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20"
                  : "bg-afri-bg-sec text-afri-text-sec hover:text-afri-text border border-afri-border"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-afri-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher utilisateur, gombo, ID..."
            className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-afri-text outline-none transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-afri-text-muted hover:text-afri-text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* HISTORIQUE PRIVÉ DES FRAIS */}
      <div className="bg-afri-bg border border-zinc-800/80 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-afri-text font-sans">
              HISTORIQUE PRIVÉ DES FRAIS COLLECTÉS ({filteredRecords.length})
            </h3>
          </div>
          <span className="text-[10px] font-mono text-afri-text-muted">
            Transparence souveraine • Lecture Seul
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-afri-text-sec animate-pulse space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#D4AF37]" />
            <p>Chargement du registre du coffre...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-12 text-center space-y-2 border border-dashed border-zinc-800 rounded-2xl p-6">
            <Landmark className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs font-mono font-bold text-afri-text-sec">
              Aucune transaction de frais enregistrée pour cette période.
            </p>
            <p className="text-[10px] font-mono text-zinc-500">
              Les frais prélevés lors des publications s'afficheront ici en temps réel (0 FCFA fictif).
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/80 text-[10px] text-afri-text-muted uppercase tracking-wider">
                  <th className="py-3 px-3">Nom Utilisateur</th>
                  <th className="py-3 px-3">Gombo / Titre</th>
                  <th className="py-3 px-3 text-right">Montant Gombo</th>
                  <th className="py-3 px-3 text-right">Frais (+Coffre)</th>
                  <th className="py-3 px-3 text-right">Total Payé</th>
                  <th className="py-3 px-3">Date & Heure</th>
                  <th className="py-3 px-3 text-center">Statut</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredRecords.map((record) => {
                  const dateFormatted = new Date(record.createdAt || record.timestamp || 0).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  });

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-afri-bg-sec/50 transition cursor-pointer group"
                      onClick={() => setSelectedRecord(record)}
                    >
                      {/* User Name */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-bold text-[10px] shrink-0">
                            {record.userName?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div className="truncate max-w-[140px]">
                            <p className="font-bold text-afri-text truncate">{record.userName}</p>
                            <p className="text-[9px] text-afri-text-sec truncate">{record.userEmail || record.userId}</p>
                          </div>
                        </div>
                      </td>

                      {/* Gombo Title */}
                      <td className="py-3.5 px-3">
                        <p className="font-bold text-afri-text truncate max-w-[180px]" title={record.gomboTitle}>
                          {record.gomboTitle}
                        </p>
                        <p className="text-[9px] text-zinc-500 font-mono">
                          Réf : {record.publicationId ? record.publicationId.slice(0, 10) : record.transactionId?.slice(0, 10)}
                        </p>
                      </td>

                      {/* Montant Gombo */}
                      <td className="py-3.5 px-3 text-right font-bold text-afri-text">
                        {record.gomboAmount ? record.gomboAmount.toLocaleString("fr-FR") : "0"} <span className="text-[9px] text-zinc-500">F</span>
                      </td>

                      {/* Frais (+Coffre) */}
                      <td className="py-3.5 px-3 text-right font-black text-[#D4AF37]">
                        +{record.feeAmount.toLocaleString("fr-FR")} <span className="text-[9px]">FCFA</span>
                      </td>

                      {/* Total Payé */}
                      <td className="py-3.5 px-3 text-right font-bold text-emerald-400">
                        {(record.totalPaid || (record.gomboAmount + record.feeAmount)).toLocaleString("fr-FR")} <span className="text-[9px]">FCFA</span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3 text-[#D4AF37] text-[10px]">
                        {dateFormatted}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Réussi
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(record);
                          }}
                          className="px-2.5 py-1 bg-afri-bg-sec hover:bg-afri-bg-ter text-afri-text-sec hover:text-[#D4AF37] border border-afri-border rounded-lg text-[10px] font-mono transition"
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECORD AUDIT MODAL */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-afri-bg border border-[#D4AF37]/50 rounded-3xl p-6 shadow-2xl text-left space-y-5"
            >
              <button
                onClick={() => setSelectedRecord(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-afri-text-sec hover:text-afri-text bg-afri-bg-sec border border-afri-border"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mx-auto">
                  <Landmark className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-afri-text uppercase tracking-wider font-sans">
                  Relevé de Frais du Coffre
                </h3>
                <p className="text-xs text-afri-text-sec font-mono">
                  ID Transaction : <span className="text-[#D4AF37] font-bold">{selectedRecord.transactionId || selectedRecord.id}</span>
                </p>
              </div>

              <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4 space-y-2.5 font-mono text-xs">
                <div className="flex justify-between items-center text-afri-text-sec border-b border-zinc-800 pb-2">
                  <span>Utilisateur émetteur :</span>
                  <span className="font-bold text-afri-text">{selectedRecord.userName}</span>
                </div>

                <div className="flex justify-between items-center text-afri-text-sec border-b border-zinc-800 pb-2">
                  <span>Contact / Email :</span>
                  <span className="font-bold text-afri-text">{selectedRecord.userEmail || selectedRecord.userPhone || selectedRecord.userId}</span>
                </div>

                <div className="flex justify-between items-center text-afri-text-sec border-b border-zinc-800 pb-2">
                  <span>Titre du Gombo :</span>
                  <span className="font-bold text-afri-text truncate max-w-[200px]">{selectedRecord.gomboTitle}</span>
                </div>

                <div className="flex justify-between items-center text-afri-text-sec border-b border-zinc-800 pb-2">
                  <span>Montant de la Publication :</span>
                  <span className="font-bold text-afri-text">{selectedRecord.gomboAmount?.toLocaleString("fr-FR")} FCFA</span>
                </div>

                <div className="flex justify-between items-center text-afri-text-sec border-b border-zinc-800 pb-2">
                  <span>Taux de Commission :</span>
                  <span className="font-bold text-amber-400">{((selectedRecord.feeRate || 0.05) * 100).toFixed(1)}%</span>
                </div>

                <div className="flex justify-between items-center text-afri-text-sec border-b border-zinc-800 pb-2">
                  <span>Frais Crédités au Coffre :</span>
                  <span className="font-black text-[#D4AF37] text-sm">+{selectedRecord.feeAmount?.toLocaleString("fr-FR")} FCFA</span>
                </div>

                <div className="flex justify-between items-center text-afri-text-sec border-b border-zinc-800 pb-2">
                  <span>Total Débité Utilisateur :</span>
                  <span className="font-bold text-emerald-400">{selectedRecord.totalPaid?.toLocaleString("fr-FR")} FCFA</span>
                </div>

                <div className="flex justify-between items-center text-afri-text-sec">
                  <span>Horodatage Serveur :</span>
                  <span className="text-[#D4AF37]">{new Date(selectedRecord.createdAt || selectedRecord.timestamp || 0).toLocaleString("fr-FR")}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="w-full py-3 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider rounded-xl transition cursor-pointer"
                >
                  Fermer la vue d'audit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
