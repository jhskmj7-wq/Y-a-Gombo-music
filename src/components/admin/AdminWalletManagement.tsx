import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Wallet, ShieldCheck, Search, ArrowUpRight, ArrowDownLeft, RefreshCw, 
  Lock, Unlock, Plus, Minus, RotateCcw, FileSpreadsheet, Download, AlertCircle, 
  CheckCircle2, User, Coins, Clock, ChevronRight, X, ShieldAlert, FileText, Check
} from "lucide-react";
import { db } from "../../lib/firebase";
import { 
  collection, query, orderBy, onSnapshot, doc, getDoc, setDoc, where, getDocs 
} from "firebase/firestore";
import { PaymentEngine } from "../../lib/paymentEngine";

interface AdminWalletManagementProps {
  currentUser?: any;
}

export default function AdminWalletManagement({ currentUser }: AdminWalletManagementProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filters
  const [userSearchTerm, setUserSearchTerm] = useState<string>("");
  const [txSearchTerm, setTxSearchTerm] = useState<string>("");
  const [txFilterType, setTxFilterType] = useState<string>("all");

  // Selected User Modal / Action state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"credit" | "debit" | "correction" | "block" | "unblock" | null>(null);
  const [amountInput, setAmountInput] = useState<string>("");
  const [reasonInput, setReasonInput] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);

  // Selected Transaction for Refund
  const [selectedTxForRefund, setSelectedTxForRefund] = useState<any | null>(null);
  const [refundReason, setRefundReason] = useState<string>("");

  // Notifications / Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Listen to all Users in real-time
  useEffect(() => {
    const qUsers = collection(db, "users");
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, uid: docSnap.id, ...docSnap.data() });
      });
      setUsers(list);
      setLoading(false);
    });

    return () => unsubUsers();
  }, []);

  // 2. Listen to all wallet transactions in real-time across collections
  useEffect(() => {
    const txMap = new Map<string, any>();

    const syncLists = () => {
      const list = Array.from(txMap.values());
      list.sort((a, b) => {
        const tA = new Date(a.createdAt || a.timestamp || 0).getTime();
        const tB = new Date(b.createdAt || b.timestamp || 0).getTime();
        return tB - tA;
      });
      setTransactions(list);
    };

    const unsub1 = onSnapshot(collection(db, "walletTransactions"), (snap) => {
      snap.forEach((d) => txMap.set(d.id, { id: d.id, sourceCollection: "walletTransactions", ...d.data() }));
      syncLists();
    });

    const unsub2 = onSnapshot(collection(db, "walletRefunds"), (snap) => {
      snap.forEach((d) => txMap.set(d.id, { id: d.id, sourceCollection: "walletRefunds", ...d.data() }));
      syncLists();
    });

    const unsub3 = onSnapshot(collection(db, "walletAdjustments"), (snap) => {
      snap.forEach((d) => txMap.set(d.id, { id: d.id, sourceCollection: "walletAdjustments", ...d.data() }));
      syncLists();
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  // Keep selectedUser synced when users list updates
  useEffect(() => {
    if (selectedUser) {
      const updated = users.find(u => u.id === selectedUser.id || u.uid === selectedUser.uid);
      if (updated) {
        setSelectedUser(updated);
      }
    }
  }, [users]);

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const term = userSearchTerm.toLowerCase();
    if (!term) return true;
    const name = (u.displayName || u.artistName || u.artisticName || u.name || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    const uid = (u.uid || u.id || "").toLowerCase();
    const gomboId = (typeof u.gomboId === "string" ? u.gomboId : u.gomboId?.id || "").toLowerCase();
    return name.includes(term) || email.includes(term) || uid.includes(term) || gomboId.includes(term);
  });

  // Filtered Transactions
  const filteredTxs = transactions.filter(tx => {
    const term = txSearchTerm.toLowerCase();
    const matchSearch = !term || (
      (tx.userName || "").toLowerCase().includes(term) ||
      (tx.userId || "").toLowerCase().includes(term) ||
      (tx.reason || tx.description || "").toLowerCase().includes(term) ||
      (tx.module || "").toLowerCase().includes(term) ||
      (tx.id || "").toLowerCase().includes(term) ||
      (tx.transactionId || "").toLowerCase().includes(term)
    );

    if (!matchSearch) return false;

    if (txFilterType === "all") return true;
    if (txFilterType === "credit") return tx.type === "recharge_wallet" || tx.type === "credit_manual" || tx.type === "deposit" || tx.action === "credit";
    if (txFilterType === "debit") return tx.type === "debit_purchase" || tx.type === "debit_manual" || tx.type === "withdrawal" || tx.action === "debit";
    if (txFilterType === "refund") return tx.type === "refund" || tx.sourceCollection === "walletRefunds";
    if (txFilterType === "adjustment") return tx.type === "correction_solde" || tx.sourceCollection === "walletAdjustments";
    return true;
  });

  // Handle Admin Wallet Adjustment (Credit, Debit, Correction)
  const handleExecuteAdjustment = async () => {
    if (!selectedUser || !actionType) return;

    if ((actionType === "credit" || actionType === "debit" || actionType === "correction") && (!amountInput || Number(amountInput) <= 0)) {
      showToast("Veuillez saisir un montant valide.", "error");
      return;
    }

    if (!reasonInput.trim()) {
      showToast("Veuillez spécifier le motif obligatoire de cette intervention.", "error");
      return;
    }

    setProcessing(true);
    try {
      const adminEmail = currentUser?.email || currentUser?.displayName || "SuperFondateur";
      const targetUserId = selectedUser.uid || selectedUser.id;

      if (actionType === "block" || actionType === "unblock") {
        const isBlocked = actionType === "block";
        const success = await PaymentEngine.setWalletBlockStatus(
          targetUserId,
          isBlocked,
          reasonInput,
          adminEmail
        );

        if (success) {
          showToast(isBlocked ? "🔒 Wallet verrouillé avec succès." : "🔓 Wallet déverrouillé avec succès.");
          setActionType(null);
          setReasonInput("");
        } else {
          showToast("Erreur lors de la modification du statut du Wallet.", "error");
        }
      } else {
        const actionMapped = actionType === "correction" ? "set" : actionType;
        const res = await PaymentEngine.adminAdjustWallet({
          userId: targetUserId,
          amount: Number(amountInput),
          action: actionMapped,
          reason: reasonInput,
          adminEmail
        });

        if (res.success) {
          showToast(`✅ Opération ${actionType.toUpperCase()} exécutée avec succès !`);
          setActionType(null);
          setAmountInput("");
          setReasonInput("");
        } else {
          showToast(res.error || "Erreur lors de l'opération.", "error");
        }
      }
    } catch (err: any) {
      showToast(err.message || "Erreur serveur.", "error");
    } finally {
      setProcessing(false);
    }
  };

  // Handle Transaction Refund
  const handleExecuteRefund = async () => {
    if (!selectedTxForRefund || !refundReason.trim()) {
      showToast("Un motif de remboursement est obligatoire.", "error");
      return;
    }

    setProcessing(true);
    try {
      const adminEmail = currentUser?.email || currentUser?.displayName || "SuperFondateur";
      const targetUserId = selectedTxForRefund.userId || selectedTxForRefund.uid;
      const refundAmount = Number(selectedTxForRefund.amount || selectedTxForRefund.montant || 0);

      const res = await PaymentEngine.refundPayment({
        userId: targetUserId,
        amount: refundAmount,
        reason: refundReason,
        txId: selectedTxForRefund.id,
        adminEmail
      });

      if (res.success) {
        showToast(`🔄 Remboursement de ${refundAmount} FCFA effectué !`);
        setSelectedTxForRefund(null);
        setRefundReason("");
      } else {
        showToast(res.error || "Erreur lors du remboursement.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Erreur.", "error");
    } finally {
      setProcessing(false);
    }
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ["ID Transaction", "Utilisateur ID", "Nom", "Type", "Montant (FCFA)", "Solde Avant", "Solde Après", "Module", "Motif", "Date"];
    const rows = filteredTxs.map(tx => [
      tx.id || "",
      tx.userId || "",
      `"${tx.userName || ""}"`,
      tx.type || "",
      tx.amount || tx.montant || 0,
      tx.balanceBefore || 0,
      tx.balanceAfter || 0,
      `"${tx.module || ""}"`,
      `"${(tx.reason || tx.description || "").replace(/"/g, '""')}"`,
      tx.createdAt || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `afrigombo_wallet_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("📄 Export CSV généré avec succès !");
  };

  // Export JSON
  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredTxs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `afrigombo_wallet_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("📦 Export JSON généré avec succès !");
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
                ? "bg-zinc-950 border-[#D4AF37] text-[#D4AF37]" 
                : "bg-zinc-950 border-rose-500 text-rose-400"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-zinc-950 border border-[#D4AF37]/40 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider font-sans">
              GESTION DU WALLET CENTRAL (SUPER FONDATEUR)
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Contrôle souverain : créditer, débiter, rembourser, bloquer et audits financiers directes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportJSON}
            className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: USER MANAGEMENT SEARCH & ACTIONS */}
      <div className="bg-zinc-950 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-800/80 pb-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Gestion des Comptes Utilisateurs ({filteredUsers.length})</span>
            </h3>
            <p className="text-[10px] text-zinc-400 font-mono">Recherchez un membre par nom, email, GOMBO ID ou UID</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              placeholder="Nom, email, ID..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 focus:border-[#D4AF37]/60 rounded-xl text-xs text-white outline-none font-mono"
            />
          </div>
        </div>

        {/* Users grid list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
          {filteredUsers.length === 0 ? (
            <div className="col-span-full text-center py-8 text-zinc-500 font-mono text-xs">
              Aucun utilisateur trouvé.
            </div>
          ) : (
            filteredUsers.map((usr) => {
              const solde = usr.wallet?.soldeDisponible ?? usr.walletBalance ?? 0;
              const isBlocked = usr.walletBlocked === true;
              const name = usr.displayName || usr.artistName || usr.artisticName || usr.name || "Membre Gombo";

              return (
                <div
                  key={usr.id}
                  className={`p-4 rounded-2xl border transition-all text-left space-y-3 ${
                    isBlocked 
                      ? "bg-rose-950/20 border-rose-500/40" 
                      : "bg-zinc-900/60 border-zinc-800/80 hover:border-[#D4AF37]/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-xs font-black text-white uppercase truncate flex items-center gap-1.5">
                        <span>{name}</span>
                        {isBlocked && (
                          <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-400 text-[8px] font-mono border border-rose-500/40 rounded uppercase font-black">
                            Bloqué
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-mono truncate">{usr.email || "Sans email"}</p>
                      <p className="text-[9px] text-zinc-600 font-mono truncate">UID: {usr.uid || usr.id}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[9px] text-zinc-500 uppercase font-mono block">Solde Wallet</span>
                      <span className="text-sm font-black font-mono text-[#D4AF37]">
                        {solde.toLocaleString("fr-FR")} F
                      </span>
                    </div>
                  </div>

                  {/* Actions buttons for user */}
                  <div className="pt-2 border-t border-zinc-800/60 grid grid-cols-4 gap-1.5">
                    <button
                      onClick={() => { setSelectedUser(usr); setActionType("credit"); setAmountInput(""); setReasonInput(""); }}
                      className="py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-[9px] font-mono font-bold uppercase transition text-center cursor-pointer flex items-center justify-center gap-1"
                      title="Créditer le solde"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Créditer</span>
                    </button>

                    <button
                      onClick={() => { setSelectedUser(usr); setActionType("debit"); setAmountInput(""); setReasonInput(""); }}
                      className="py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-[9px] font-mono font-bold uppercase transition text-center cursor-pointer flex items-center justify-center gap-1"
                      title="Débiter le solde"
                    >
                      <Minus className="w-3 h-3" />
                      <span>Débiter</span>
                    </button>

                    <button
                      onClick={() => { setSelectedUser(usr); setActionType("correction"); setAmountInput(String(solde)); setReasonInput(""); }}
                      className="py-1.5 px-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 rounded-lg text-[9px] font-mono font-bold uppercase transition text-center cursor-pointer flex items-center justify-center gap-1"
                      title="Fixer un solde exact"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Fixer</span>
                    </button>

                    <button
                      onClick={() => { setSelectedUser(usr); setActionType(isBlocked ? "unblock" : "block"); setAmountInput(""); setReasonInput(""); }}
                      className={`py-1.5 px-2 border rounded-lg text-[9px] font-mono font-bold uppercase transition text-center cursor-pointer flex items-center justify-center gap-1 ${
                        isBlocked
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                      }`}
                      title={isBlocked ? "Débloquer le Wallet" : "Bloquer le Wallet"}
                    >
                      {isBlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      <span>{isBlocked ? "Débloq." : "Bloquer"}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 2: GLOBAL REAL-TIME TRANSACTION AUDIT */}
      <div className="bg-zinc-950 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-800/80 pb-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Historique Général des Transactions ({filteredTxs.length})</span>
            </h3>
            <p className="text-[10px] text-zinc-400 font-mono">Toutes les opérations système (achats, recharges, retraits, remboursements)</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={txSearchTerm}
                onChange={(e) => setTxSearchTerm(e.target.value)}
                placeholder="Filtrer transactions..."
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 focus:border-[#D4AF37]/60 rounded-xl text-xs text-white outline-none font-mono"
              />
            </div>

            <div className="flex gap-1">
              {[
                { id: "all", label: "Tous" },
                { id: "credit", label: "Crédits" },
                { id: "debit", label: "Débits" },
                { id: "refund", label: "Remboursements" },
                { id: "adjustment", label: "Ajustements" }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setTxFilterType(f.id)}
                  className={`py-1 px-2.5 rounded-lg text-[9px] font-mono font-bold uppercase transition cursor-pointer border ${
                    txFilterType === f.id
                      ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transaction list table */}
        <div className="divide-y divide-zinc-800/60 max-h-[420px] overflow-y-auto no-scrollbar">
          {filteredTxs.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 font-mono text-xs">
              Aucune transaction enregistrée.
            </div>
          ) : (
            filteredTxs.map((tx) => {
              const amount = Number(tx.amount || tx.montant || 0);
              const isCredit = tx.type === "recharge_wallet" || tx.type === "credit_manual" || tx.type === "deposit" || tx.type === "refund" || tx.action === "credit";
              const dateStr = tx.createdAt ? new Date(tx.createdAt).toLocaleString("fr-FR") : "Récent";

              return (
                <div key={tx.id} className="py-3 px-2 hover:bg-zinc-900/40 rounded-xl flex items-center justify-between gap-3 text-left transition">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                      isCredit
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    }`}>
                      {isCredit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>

                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[8px] font-mono font-black uppercase px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-[#D4AF37] rounded">
                          {tx.module || tx.type || "Général"}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-md">
                          {tx.reason || tx.description || "Opération financière"}
                        </h4>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono text-zinc-500">
                        <span>User: <strong className="text-zinc-300">{tx.userName || tx.userId}</strong></span>
                        <span>•</span>
                        <span>ID: {tx.id}</span>
                        <span>•</span>
                        <span>{dateStr}</span>
                        {tx.refunded && (
                          <span className="text-rose-400 font-bold bg-rose-500/10 px-1 rounded border border-rose-500/20">
                            REMBOURSÉ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <span className={`text-xs sm:text-sm font-mono font-black block ${isCredit ? "text-emerald-400" : "text-amber-500"}`}>
                      {isCredit ? "+" : "-"}{amount.toLocaleString("fr-FR")} FCFA
                    </span>

                    {!tx.refunded && tx.type !== "refund" && (
                      <button
                        onClick={() => { setSelectedTxForRefund(tx); setRefundReason(""); }}
                        className="py-1 px-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded text-[8px] font-mono font-bold uppercase transition cursor-pointer inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Rembourser</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL: ACTION SUR UN UTILISATEUR (CRÉDIT / DÉBIT / CORRECTION / BLOCAGE) */}
      <AnimatePresence>
        {selectedUser && actionType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-zinc-950 border border-[#D4AF37]/50 rounded-3xl p-6 shadow-2xl text-left space-y-5"
            >
              <button
                onClick={() => setActionType(null)}
                className="absolute top-4 right-4 p-1 rounded-full text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-white uppercase tracking-wider font-sans">
                  {actionType === "credit" ? "Créditer le Wallet" :
                   actionType === "debit" ? "Débiter le Wallet" :
                   actionType === "correction" ? "Correction de Solde" :
                   actionType === "block" ? "Verrouiller le Wallet" : "Déverrouiller le Wallet"}
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Bénéficiaire : <span className="text-white font-bold">{selectedUser.displayName || selectedUser.artistName || "Membre Gombo"}</span>
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-1 font-mono text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Solde actuel :</span>
                  <span className="font-bold text-[#D4AF37]">
                    {(selectedUser.wallet?.soldeDisponible ?? selectedUser.walletBalance ?? 0).toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>UID :</span>
                  <span className="text-zinc-500">{selectedUser.uid || selectedUser.id}</span>
                </div>
              </div>

              {(actionType === "credit" || actionType === "debit" || actionType === "correction") && (
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
                    {actionType === "correction" ? "Nouveau Solde Exact (FCFA)" : "Montant de l'opération (FCFA)"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="Ex: 5000"
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-white font-mono text-sm outline-none"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
                  Motif Souverain Obligatoire
                </label>
                <textarea
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="Ex: Régularisation de paiement, bonus exceptionnel..."
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#D4AF37] rounded-xl px-4 py-2.5 text-white font-mono text-xs outline-none h-20 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleExecuteAdjustment}
                  disabled={processing}
                  className="flex-1 py-3 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {processing ? "Traitement..." : "Exécuter l'action"}
                </button>
                <button
                  onClick={() => setActionType(null)}
                  disabled={processing}
                  className="py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold uppercase text-xs tracking-wider rounded-xl border border-zinc-800 transition cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: REMBOURSER UNE TRANSACTION */}
      <AnimatePresence>
        {selectedTxForRefund && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-zinc-950 border border-rose-500/50 rounded-3xl p-6 shadow-2xl text-left space-y-5"
            >
              <button
                onClick={() => setSelectedTxForRefund(null)}
                className="absolute top-4 right-4 p-1 rounded-full text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-white uppercase tracking-wider font-sans">
                  Rembourser la Transaction
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Réf : <span className="text-white font-bold">{selectedTxForRefund.id}</span>
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-1 font-mono text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Montant à créditer :</span>
                  <span className="font-bold text-rose-400">
                    +{(selectedTxForRefund.amount || selectedTxForRefund.montant || 0).toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Bénéficiaire :</span>
                  <span className="text-white font-bold">{selectedTxForRefund.userName || selectedTxForRefund.userId}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
                  Motif du Remboursement
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Ex: Annulation d'achat suite à incident technique..."
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-white font-mono text-xs outline-none h-20 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleExecuteRefund}
                  disabled={processing}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-xs tracking-wider rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {processing ? "Remboursement..." : "Confirmer le Remboursement"}
                </button>
                <button
                  onClick={() => setSelectedTxForRefund(null)}
                  disabled={processing}
                  className="py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold uppercase text-xs tracking-wider rounded-xl border border-zinc-800 transition cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
