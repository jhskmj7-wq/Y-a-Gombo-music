import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Wallet, ShieldCheck, Search, ArrowUpRight, ArrowDownLeft, RefreshCw, 
  Lock, Unlock, Plus, Minus, RotateCcw, FileSpreadsheet, Download, AlertCircle, 
  CheckCircle2, User, Coins, Clock, ChevronRight, X, ShieldAlert, FileText, Check,
  TrendingUp, BarChart3, Landmark
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { db } from "../../lib/firebase";
import { 
  collection, query, orderBy, onSnapshot, doc, getDoc, setDoc, where, getDocs 
} from "firebase/firestore";
import { PaymentEngine } from "../../lib/paymentEngine";
import { logAdminAction } from "../../lib/auditLogger";
import { safeStringify } from "../../lib/jsonUtils";
import FounderFeesVault from "./FounderFeesVault";

import FounderBottomSheet from "./FounderBottomSheet";

interface AdminWalletManagementProps {
  currentUser?: any;
}

export default function AdminWalletManagement({ currentUser }: AdminWalletManagementProps) {
  const [walletSubTab, setWalletSubTab] = useState<"wallet_central" | "founder_vault">("wallet_central");
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filters
  const [userSearchTerm, setUserSearchTerm] = useState<string>("");
  const [txSearchTerm, setTxSearchTerm] = useState<string>("");
  const [txFilterType, setTxFilterType] = useState<string>("all");

  // Selected User Modal / Action state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"credit" | "debit" | "correction" | "block" | "unblock" | "freeze" | "unfreeze" | null>(null);
  const [amountInput, setAmountInput] = useState<string>("");
  const [reasonInput, setReasonInput] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);

  // Selected Transaction for Refund
  const [selectedTxForRefund, setSelectedTxForRefund] = useState<any | null>(null);
  const [refundReason, setRefundReason] = useState<string>("");
  const [refundAmountInput, setRefundAmountInput] = useState<string>("");

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
          await logAdminAction({
            adminUid: currentUser?.uid || "unknown",
            adminEmail: adminEmail,
            action: isBlocked ? "ACCOUNT_BLOCK" : "ACCOUNT_UNBLOCK",
            targetUserId: targetUserId,
            reason: reasonInput,
          });
          setActionType(null);
          setReasonInput("");
        } else {
          showToast("Erreur lors de la modification du statut du Wallet.", "error");
        }
      } else if (actionType === "freeze" || actionType === "unfreeze") {
        const isFrozen = actionType === "freeze";
        const success = await PaymentEngine.setAccountFrozenStatus(
          targetUserId,
          isFrozen,
          reasonInput,
          adminEmail
        );

        if (success) {
          showToast(isFrozen ? "❄️ Compte gelé avec succès." : "🔥 Compte dégelé avec succès.");
          await logAdminAction({
            adminUid: currentUser?.uid || "unknown",
            adminEmail: adminEmail,
            action: isFrozen ? "ACCOUNT_FREEZE" : "ACCOUNT_UNFREEZE",
            targetUserId: targetUserId,
            reason: reasonInput,
          });
          setActionType(null);
          setReasonInput("");
        } else {
          showToast("Erreur lors de la modification du statut du compte.", "error");
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
          await logAdminAction({
            adminUid: currentUser?.uid || "unknown",
            adminEmail: adminEmail,
            action: actionMapped === "credit" ? "WALLET_CREDIT" : actionMapped === "debit" ? "WALLET_DEBIT" : "WALLET_ADJUSTMENT",
            targetUserId: targetUserId,
            reason: reasonInput,
            newValue: Number(amountInput)
          });
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
    const refundAmount = Number(refundAmountInput);
    const maxAmount = Number(selectedTxForRefund?.amount || selectedTxForRefund?.montant || 0);

    if (!selectedTxForRefund || !refundReason.trim()) {
      showToast("Un motif de remboursement est obligatoire.", "error");
      return;
    }

    if (!refundAmount || refundAmount <= 0 || refundAmount > maxAmount) {
      showToast(`Le montant doit être compris entre 1 et ${maxAmount} FCFA.`, "error");
      return;
    }

    setProcessing(true);
    try {
      const adminEmail = currentUser?.email || currentUser?.displayName || "SuperFondateur";
      const targetUserId = selectedTxForRefund.userId || selectedTxForRefund.uid;

      const res = await PaymentEngine.refundPayment({
        userId: targetUserId,
        amount: refundAmount,
        reason: refundReason,
        txId: selectedTxForRefund.id,
        adminEmail
      });

      if (res.success) {
        showToast(`🔄 Remboursement de ${refundAmount} FCFA effectué !`);
        await logAdminAction({
          adminUid: currentUser?.uid || "unknown",
          adminEmail: adminEmail,
          action: "TRANSACTION_REFUND",
          targetUserId: targetUserId,
          reason: refundReason,
          newValue: refundAmount,
          transactionId: selectedTxForRefund.id
        });
        setSelectedTxForRefund(null);
        setRefundReason("");
        setRefundAmountInput("");
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
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(safeStringify(filteredTxs, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `afrigombo_wallet_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("📦 Export JSON généré avec succès !");
  };

  // Real-time financial calculations
  const totalSequestered = users.reduce((acc, u) => acc + Number(u.wallet?.soldeDisponible ?? u.walletBalance ?? 0), 0);
  const totalRecharges = transactions
    .filter(tx => tx.type === "recharge_wallet" || tx.type === "credit_manual" || tx.type === "deposit" || tx.action === "credit")
    .reduce((acc, tx) => acc + Number(tx.amount || tx.montant || 0), 0);
  const totalWithdrawals = transactions
    .filter(tx => tx.type === "debit_purchase" || tx.type === "debit_manual" || tx.type === "withdrawal" || tx.action === "debit")
    .reduce((acc, tx) => acc + Number(tx.amount || tx.montant || 0), 0);
  const commissions = Math.round(totalRecharges * 0.025); // 2.5% of total deposits/credits
  const pendingWithdrawalsCount = transactions.filter(tx => (tx.type === "withdrawal" || tx.module === "Retrait") && tx.status === "pending").length;
  const pendingWithdrawalsAmount = transactions
    .filter(tx => (tx.type === "withdrawal" || tx.module === "Retrait") && tx.status === "pending")
    .reduce((acc, tx) => acc + Number(tx.amount || tx.montant || 0), 0);

  // Group last 7 days of transactions for Recharts
  const getChartData = () => {
    const days: Record<string, { date: string; credits: number; debits: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
      days[d.toDateString()] = { date: dateStr, credits: 0, debits: 0 };
    }

    transactions.forEach(tx => {
      const txDate = new Date(tx.createdAt || tx.timestamp || 0);
      const dayKey = txDate.toDateString();
      if (days[dayKey]) {
        const amt = Number(tx.amount || tx.montant || 0);
        const isCredit = tx.type === "recharge_wallet" || tx.type === "credit_manual" || tx.type === "deposit" || tx.type === "refund" || tx.action === "credit";
        if (isCredit) {
          days[dayKey].credits += amt;
        } else {
          days[dayKey].debits += amt;
        }
      }
    });

    return Object.values(days);
  };

  const chartData = getChartData();

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
            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub-Navigation Tabs: Wallet Central vs Coffre des Frais Fondateur */}
      <div className="flex items-center gap-2 p-1.5 bg-afri-bg-sec border border-afri-border rounded-2xl w-fit max-w-full overflow-x-auto">
        <button
          onClick={() => setWalletSubTab("wallet_central")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-2 shrink-0 cursor-pointer ${
            walletSubTab === "wallet_central"
              ? "bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20 font-black"
              : "text-afri-text-sec hover:text-afri-text"
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Wallet Central & Utilisateurs</span>
        </button>

        <button
          onClick={() => setWalletSubTab("founder_vault")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-2 shrink-0 cursor-pointer ${
            walletSubTab === "founder_vault"
              ? "bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20 font-black"
              : "text-afri-text-sec hover:text-afri-text"
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Coffre des Frais (Fondateur)</span>
        </button>
      </div>

      {walletSubTab === "founder_vault" ? (
        <FounderFeesVault currentUser={currentUser} />
      ) : (
        <>
          {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-afri-bg border border-[#D4AF37]/40 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-afri-text uppercase tracking-wider font-sans">
              GESTION DU WALLET CENTRAL (SUPER FONDATEUR)
            </h2>
            <p className="text-xs text-afri-text-sec font-mono">
              Contrôle souverain : créditer, débiter, rembourser, bloquer et audits financiers directes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 bg-afri-bg-sec hover:bg-afri-bg-ter border border-afri-border text-afri-text-sec hover:text-afri-text rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportJSON}
            className="px-3.5 py-2 bg-afri-bg-sec hover:bg-afri-bg-ter border border-afri-border text-afri-text-sec hover:text-afri-text rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* FINANCIAL SUMMARY BOARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-afri-bg border border-[#D4AF37]/20 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono font-black text-afri-text-muted uppercase tracking-widest block">Fonds Séquestrés</span>
            <div className="p-1.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg border border-[#D4AF37]/20">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg sm:text-2xl font-black font-mono text-afri-text tracking-tight">
              {totalSequestered.toLocaleString("fr-FR")} <span className="text-xs text-[#D4AF37]">F</span>
            </h3>
            <p className="text-[9px] text-afri-text-sec font-mono mt-1">Cumul soldes comptes actifs</p>
          </div>
        </div>

        <div className="p-5 bg-afri-bg border border-zinc-800/80 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono font-black text-afri-text-muted uppercase tracking-widest block">Recharges Globales</span>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg sm:text-2xl font-black font-mono text-emerald-400 tracking-tight">
              {totalRecharges.toLocaleString("fr-FR")} <span className="text-xs">F</span>
            </h3>
            <p className="text-[9px] text-afri-text-sec font-mono mt-1">Total dépôts & recharges</p>
          </div>
        </div>

        <div className="p-5 bg-afri-bg border border-zinc-800/80 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono font-black text-afri-text-muted uppercase tracking-widest block">Commissions Est. (2.5%)</span>
            <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg sm:text-2xl font-black font-mono text-amber-500 tracking-tight">
              {commissions.toLocaleString("fr-FR")} <span className="text-xs">F</span>
            </h3>
            <p className="text-[9px] text-afri-text-sec font-mono mt-1">Part système de sécurité</p>
          </div>
        </div>

        <div className="p-5 bg-afri-bg border border-zinc-800/80 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono font-black text-afri-text-muted uppercase tracking-widest block">Retraits En Attente</span>
            <div className={`p-1.5 rounded-lg border ${pendingWithdrawalsCount > 0 ? "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse" : "bg-afri-bg-ter text-afri-text-muted border-afri-border"}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg sm:text-2xl font-black font-mono text-rose-400 tracking-tight">
              {pendingWithdrawalsAmount.toLocaleString("fr-FR")} <span className="text-xs">F</span>
            </h3>
            <p className="text-[9px] text-afri-text-sec font-mono mt-1">
              {pendingWithdrawalsCount} demandes de transfert
            </p>
          </div>
        </div>
      </div>

      {/* DAILY EVOLUTION AREA CHART */}
      <div className="bg-afri-bg border border-zinc-800/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#D4AF37]" />
              <span>Évolution des Flux Quotidiens (Dépôts vs. Retraits)</span>
            </h3>
            <p className="text-[10px] text-afri-text-sec font-mono">Volume d'échanges réels des 7 derniers jours synchronisé via onSnapshot()</p>
          </div>
        </div>

        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDebits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" stroke="#71717a" fontSize={10} fontFamily="monospace" />
              <YAxis stroke="#71717a" fontSize={10} fontFamily="monospace" tickFormatter={(v) => typeof v === 'number' ? `${Math.round(v / 1000)}k` : String(v || '')} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "12px" }} 
                labelStyle={{ color: "#d4af37", fontSize: "10px", fontFamily: "monospace" }}
                itemStyle={{ fontSize: "11px", fontFamily: "monospace" }}
              />
              <Area type="monotone" dataKey="credits" name="Dépôts (F)" stroke="#10b981" fillOpacity={1} fill="url(#colorCredits)" strokeWidth={2} />
              <Area type="monotone" dataKey="debits" name="Retraits (F)" stroke="#f59e0b" fillOpacity={1} fill="url(#colorDebits)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION 1: USER MANAGEMENT SEARCH & ACTIONS */}
      <div className="bg-afri-bg border border-zinc-800/80 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-800/80 pb-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Gestion des Comptes Utilisateurs ({filteredUsers.length})</span>
            </h3>
            <p className="text-[10px] text-afri-text-sec font-mono">Recherchez un membre par nom, email, GOMBO ID ou UID</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-afri-text-muted" />
            <input
              type="text"
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              placeholder="Nom, email, ID..."
              className="w-full pl-9 pr-3 py-2 bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37]/60 rounded-xl text-xs text-afri-text outline-none font-mono"
            />
          </div>
        </div>

        {/* Users grid list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
          {filteredUsers.length === 0 ? (
            <div className="col-span-full text-center py-8 text-afri-text-muted font-mono text-xs">
              Aucun utilisateur trouvé.
            </div>
          ) : (
            filteredUsers.map((usr) => {
              const solde = usr.wallet?.soldeDisponible ?? usr.walletBalance ?? 0;
              const isBlocked = usr.walletBlocked === true;
              const isFrozen = usr.accountFrozen === true;
              const name = usr.displayName || usr.artistName || usr.artisticName || usr.name || "Membre Gombo";

              return (
                <div
                  key={usr.id}
                  className={`p-4 rounded-2xl border transition-all text-left space-y-3 ${
                    isFrozen
                      ? "bg-amber-950/25 border-amber-500/50"
                      : isBlocked 
                      ? "bg-rose-950/20 border-rose-500/40" 
                      : "bg-zinc-900/60 border-zinc-800/80 hover:border-[#D4AF37]/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-xs font-black text-afri-text uppercase truncate flex items-center gap-1.5">
                        <span>{name}</span>
                        {isBlocked && (
                          <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-400 text-[8px] font-mono border border-rose-500/40 rounded uppercase font-black">
                            Bloqué
                          </span>
                        )}
                        {isFrozen && (
                          <span className="px-1.5 py-0.2 bg-amber-550/20 text-amber-400 text-[8px] font-mono border border-amber-500/40 rounded uppercase font-black">
                            Gelé
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-afri-text-muted font-mono truncate">{usr.email || "Sans email"}</p>
                      <p className="text-[9px] text-zinc-600 font-mono truncate">UID: {usr.uid || usr.id}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[9px] text-afri-text-muted uppercase font-mono block">Solde Wallet</span>
                      <span className="text-sm font-black font-mono text-[#D4AF37]">
                        {solde.toLocaleString("fr-FR")} F
                      </span>
                    </div>
                  </div>

                  {/* Actions buttons for user */}
                  <div className="pt-2 border-t border-zinc-800/60 grid grid-cols-2 xs:grid-cols-5 sm:grid-cols-5 gap-2">
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

                    <button
                      onClick={() => { setSelectedUser(usr); setActionType(isFrozen ? "unfreeze" : "freeze"); setAmountInput(""); setReasonInput(""); }}
                      className={`py-1.5 px-2 border rounded-lg text-[9px] font-mono font-bold uppercase transition text-center cursor-pointer flex items-center justify-center gap-1 ${
                        isFrozen
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      }`}
                      title={isFrozen ? "Dégeler le Compte" : "Geler le Compte"}
                    >
                      {isFrozen ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      <span>{isFrozen ? "Dégeler" : "Geler"}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 2: GLOBAL REAL-TIME TRANSACTION AUDIT */}
      <div className="bg-afri-bg border border-zinc-800/80 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-800/80 pb-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Historique Général des Transactions ({filteredTxs.length})</span>
            </h3>
            <p className="text-[10px] text-afri-text-sec font-mono">Toutes les opérations système (achats, recharges, retraits, remboursements)</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-afri-text-muted" />
              <input
                type="text"
                value={txSearchTerm}
                onChange={(e) => setTxSearchTerm(e.target.value)}
                placeholder="Filtrer transactions..."
                className="w-full pl-8 pr-3 py-1.5 bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37]/60 rounded-xl text-xs text-afri-text outline-none font-mono"
              />
            </div>

            <div className="flex flex-wrap gap-1">
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
                      : "bg-afri-bg-sec border-afri-border text-afri-text-sec hover:text-afri-text"
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
            <div className="py-12 text-center text-afri-text-muted font-mono text-xs">
              Aucune transaction enregistrée.
            </div>
          ) : (
            filteredTxs.map((tx) => {
              const amount = Number(tx.amount || tx.montant || 0);
              const isCredit = tx.type === "recharge_wallet" || tx.type === "credit_manual" || tx.type === "deposit" || tx.type === "refund" || tx.action === "credit";
              const dateStr = tx.createdAt ? new Date(tx.createdAt).toLocaleString("fr-FR") : "Récent";

              return (
                <div key={tx.id} className="py-4 px-2 hover:bg-zinc-900/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left transition border-b border-zinc-800/20 last:border-0">
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1 w-full">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 mt-0.5 sm:mt-0 ${
                      isCredit
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    }`}>
                      {isCredit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[8px] font-mono font-black uppercase px-1.5 py-0.5 bg-afri-bg-sec border border-afri-border text-[#D4AF37] rounded">
                          {tx.module || tx.type || "Général"}
                        </span>
                        <h4 className="text-xs font-bold text-afri-text break-words w-full sm:w-auto">
                          {tx.reason || tx.description || "Opération financière"}
                        </h4>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-mono text-afri-text-muted">
                        <span>User: <strong className="text-afri-text-sec">{tx.userName || tx.userId}</strong></span>
                        <span>•</span>
                        <span>ID: {tx.id}</span>
                        <span>•</span>
                        <span>{dateStr}</span>
                        <span>•</span>
                        {tx.status === "pending" ? (
                          <span className="inline-flex items-center gap-1 text-amber-400 font-bold bg-amber-400/5 px-1.5 py-0.5 rounded border border-amber-400/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            En attente
                          </span>
                        ) : tx.status === "failed" || tx.status === "error" ? (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-bold bg-rose-500/5 px-1.5 py-0.5 rounded border border-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Échec
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Succès
                          </span>
                        )}
                        {tx.refunded && (
                          <>
                            <span>•</span>
                            <span className="text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                              REMBOURSÉ
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto gap-2 sm:gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/40 shrink-0">
                    <span className={`text-xs sm:text-sm font-mono font-black block ${isCredit ? "text-emerald-400" : "text-amber-500"}`}>
                      {isCredit ? "+" : "-"}{amount.toLocaleString("fr-FR")} FCFA
                    </span>

                    {!tx.refunded && tx.type !== "refund" && (
                      <button
                        onClick={() => { 
                          setSelectedTxForRefund(tx); 
                          setRefundReason(""); 
                          setRefundAmountInput(String(tx.amount || tx.montant || 0));
                        }}
                        className="py-1 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded text-[9px] font-mono font-bold uppercase transition cursor-pointer inline-flex items-center gap-1"
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
      <FounderBottomSheet
        isOpen={!!(selectedUser && actionType)}
        onClose={() => setActionType(null)}
        title={
          actionType === "credit" ? "Créditer le Wallet" :
          actionType === "debit" ? "Débiter le Wallet" :
          actionType === "correction" ? "Correction de Solde" :
          actionType === "block" ? "Verrouiller le Wallet" : 
          actionType === "unblock" ? "Déverrouiller le Wallet" :
          actionType === "freeze" ? "Geler le Compte" : "Dégeler le Compte"
        }
        subtitle={selectedUser ? `Bénéficiaire : ${selectedUser.displayName || selectedUser.artistName || "Membre Gombo"}` : ""}
      >
        <div className="space-y-5">
          <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-3.5 space-y-1 font-mono text-xs">
            <div className="flex justify-between text-afri-text-sec">
              <span>Solde actuel :</span>
              <span className="font-bold text-[#D4AF37]">
                {(selectedUser?.wallet?.soldeDisponible ?? selectedUser?.walletBalance ?? 0).toLocaleString("fr-FR")} FCFA
              </span>
            </div>
            <div className="flex justify-between text-afri-text-sec">
              <span>UID :</span>
              <span className="text-afri-text-muted">{selectedUser?.uid || selectedUser?.id}</span>
            </div>
          </div>

          {(actionType === "credit" || actionType === "debit" || actionType === "correction") && (
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest block">
                {actionType === "correction" ? "Nouveau Solde Exact (FCFA)" : "Montant de l'opération (FCFA)"}
              </label>
              <input
                type="number"
                min="1"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="Ex: 5000"
                className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] rounded-xl px-4 py-3 text-afri-text font-mono text-sm outline-none"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest block">
              Motif Souverain Obligatoire
            </label>
            <textarea
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder="Ex: Régularisation de paiement, bonus exceptionnel..."
              className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] rounded-xl px-4 py-2.5 text-afri-text font-mono text-xs outline-none h-20 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleExecuteAdjustment}
              disabled={processing}
              className="flex-1 py-4 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider rounded-xl transition cursor-pointer disabled:opacity-50 shadow-lg shadow-[#D4AF37]/20"
            >
              {processing ? "Traitement..." : "Exécuter l'action impériale"}
            </button>
            <button
              onClick={() => setActionType(null)}
              disabled={processing}
              className="py-4 px-6 bg-afri-bg-sec hover:bg-afri-bg-ter text-afri-text-sec font-bold uppercase text-xs tracking-wider rounded-xl border border-afri-border transition cursor-pointer"
            >
              Annuler
            </button>
          </div>
        </div>
      </FounderBottomSheet>

      {/* MODAL: REMBOURSER UNE TRANSACTION */}
      <FounderBottomSheet
        isOpen={!!selectedTxForRefund}
        onClose={() => setSelectedTxForRefund(null)}
        title="Rembourser la Transaction"
        subtitle={selectedTxForRefund ? `Réf : ${selectedTxForRefund.id}` : ""}
      >
        <div className="space-y-5">
          <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-3.5 space-y-1 font-mono text-xs">
            <div className="flex justify-between text-afri-text-sec">
              <span>Montant maximum d'origine :</span>
              <span className="font-bold text-[#D4AF37]">
                {(selectedTxForRefund?.amount || selectedTxForRefund?.montant || 0).toLocaleString("fr-FR")} FCFA
              </span>
            </div>
            <div className="flex justify-between text-afri-text-sec">
              <span>Bénéficiaire :</span>
              <span className="text-afri-text font-bold">{selectedTxForRefund?.userName || selectedTxForRefund?.userId}</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest block">
              Montant à recréditer (FCFA)
            </label>
            <input
              type="number"
              min="1"
              max={selectedTxForRefund?.amount || selectedTxForRefund?.montant || 0}
              value={refundAmountInput}
              onChange={(e) => setRefundAmountInput(e.target.value)}
              placeholder="Montant du remboursement..."
              className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] rounded-xl px-4 py-3 text-afri-text font-mono text-sm outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest block">
              Motif du Remboursement
            </label>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Ex: Annulation d'achat suite à incident technique..."
              className="w-full bg-afri-bg-sec border border-afri-border focus:border-rose-500 rounded-xl px-4 py-2.5 text-afri-text font-mono text-xs outline-none h-20 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleExecuteRefund}
              disabled={processing}
              className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-afri-text font-black uppercase text-xs tracking-wider rounded-xl transition cursor-pointer disabled:opacity-50 shadow-lg shadow-rose-900/20"
            >
              {processing ? "Remboursement..." : "Confirmer le Remboursement"}
            </button>
            <button
              onClick={() => setSelectedTxForRefund(null)}
              disabled={processing}
              className="py-4 px-6 bg-afri-bg-sec hover:bg-afri-bg-ter text-afri-text-sec font-bold uppercase text-xs tracking-wider rounded-xl border border-afri-border transition cursor-pointer"
            >
              Annuler
            </button>
          </div>
        </div>
      </FounderBottomSheet>
        </>
      )}

    </div>
  );
}
