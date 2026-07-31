import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Search, 
  Wallet, 
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  User,
  Clock,
  FileText,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  ArrowLeft,
  CornerDownRight,
  ExternalLink,
  Crown,
  FileSpreadsheet,
  Plus
} from "lucide-react";
import { db } from "../../lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, getDoc, setDoc, addDoc, updateDoc, where, runTransaction } from "firebase/firestore";
import { recordWalletTransaction } from "../../lib/financial";
import { audioSynth } from "../../lib/audio";
import { logAdminAction } from "../../lib/adminLogger";
import { SupportService, SUPPORT_PROFILE } from "../../services/SupportService";

interface WalletRequest {
  id: string;
  uid: string;
  userName: string;
  userPhoto?: string;
  gomboId?: string;
  afriId?: string;
  montant: number;
  createdAt: any;
  reference?: string;
  operator?: string;
  phoneNumber?: string;
  numero?: string; // Pour les retraits
  status: string;
  type: "deposit" | "withdrawal";
  preuveUrl?: string;
  notes?: string;
}

interface HistoryLog {
  id: string;
  transactionId: string;
  createdAt: string;
  date: string;
  heure: string;
  founderId: string;
  founderName: string;
  action: string;
  oldStatus: string;
  newStatus: string;
  comment: string;
}

interface BetaTransactionsAdminPanelProps {
  currentUser?: any;
  onOpenSupportChat?: (targetUser: any) => void;
}

export const BetaTransactionsAdminPanel: React.FC<BetaTransactionsAdminPanelProps> = ({
  currentUser,
  onOpenSupportChat
}) => {
  const [depositRequests, setDepositRequests] = useState<WalletRequest[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WalletRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Detail panel state
  const [selectedRequest, setSelectedRequest] = useState<WalletRequest | null>(null);
  const [selectedReqUser, setSelectedReqUser] = useState<any>(null);
  const [selectedReqHistory, setSelectedReqHistory] = useState<HistoryLog[]>([]);

  // Action Confirmation State inside detail panel
  const [pendingAction, setPendingAction] = useState<"VALIDATE" | "REFUSE" | "PENDING" | "ADD_NOTE" | null>(null);
  const [actionComment, setActionComment] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // 1. Real-time Listeners for Deposits and Withdrawals
  useEffect(() => {
    setLoading(true);
    
    // Listen to deposits
    const qDeposit = query(collection(db, "walletDepositRequests"), orderBy("createdAt", "desc"));
    const unsubDeposit = onSnapshot(qDeposit, (snapshot) => {
      const list: WalletRequest[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          uid: data.uid || data.userId || "",
          userName: data.userName || "Membre Gombo",
          userPhoto: data.userPhoto || "",
          gomboId: data.gomboId || "",
          afriId: data.afriId || "",
          montant: Number(data.montant || data.amount || 0),
          createdAt: data.createdAt || data.createdAtIso,
          reference: data.reference || "",
          operator: data.operator || "",
          phoneNumber: data.phoneNumber || "",
          status: data.status || data.statut || "pending",
          type: "deposit",
          preuveUrl: data.preuveUrl || data.preuve || data.screenshot || data.captureUrl || ""
        });
      });
      setDepositRequests(list);
    }, (err) => {
      console.error("Error listening to deposits:", err);
    });

    // Listen to withdrawals
    const qWithdrawal = query(collection(db, "walletWithdrawalRequests"), orderBy("createdAt", "desc"));
    const unsubWithdrawal = onSnapshot(qWithdrawal, (snapshot) => {
      const list: WalletRequest[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          uid: data.userId || data.uid || "",
          userName: data.userName || "Membre Gombo",
          userPhoto: data.userPhoto || "",
          gomboId: data.gomboId || "",
          afriId: data.afriId || "",
          montant: Number(data.amount || data.montant || 0),
          createdAt: data.createdAt || data.createdAtIso,
          reference: data.reference || "",
          operator: data.operator || "Mobile Money",
          phoneNumber: data.phoneNumber || "",
          numero: data.numero || data.phone || "",
          status: data.status || data.statut || "pending",
          type: "withdrawal",
          preuveUrl: data.preuveUrl || data.preuve || data.screenshot || data.captureUrl || ""
        });
      });
      setWithdrawalRequests(list);
      setLoading(false);
    }, (err) => {
      console.error("Error listening to withdrawals:", err);
    });

    return () => {
      unsubDeposit();
      unsubWithdrawal();
    };
  }, []);

  // 2. Real-time user profile listener for the active transaction
  useEffect(() => {
    if (!selectedRequest?.uid) {
      setSelectedReqUser(null);
      return;
    }
    const userRef = doc(db, "users", selectedRequest.uid);
    const unsub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setSelectedReqUser(docSnap.data());
      } else {
        setSelectedReqUser(null);
      }
    }, (err) => {
      console.error("Error listening to user profile:", err);
    });
    return () => unsub();
  }, [selectedRequest]);

  // 3. Real-time action history listener for the active transaction
  useEffect(() => {
    if (!selectedRequest?.id) {
      setSelectedReqHistory([]);
      return;
    }
    const q = query(
      collection(db, "transactionHistory"),
      where("transactionId", "==", selectedRequest.id),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const list: HistoryLog[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          transactionId: d.transactionId,
          createdAt: d.createdAt,
          date: d.date,
          heure: d.heure,
          founderId: d.founderId,
          founderName: d.founderName,
          action: d.action,
          oldStatus: d.oldStatus,
          newStatus: d.newStatus,
          comment: d.comment
        });
      });
      setSelectedReqHistory(list);
    }, (err) => {
      console.error("Error listening to transaction history:", err);
    });
    return () => unsub();
  }, [selectedRequest]);

  // Combined requests sorted chronologically
  const requests = [...depositRequests, ...withdrawalRequests].sort((a, b) => {
    const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tB - tA;
  });

  // Filters mapping helper
  const matchesStatus = (reqStatus: string, filter: string) => {
    const status = (reqStatus || "").toLowerCase();
    if (filter === "all") return true;
    if (filter === "pending") {
      return status === "pending" || status === "waiting_support" || status === "en_attente";
    }
    if (filter === "validated") {
      return status === "validated" || status === "paid" || status === "success";
    }
    if (filter === "refused") {
      return status === "refused" || status === "rejected" || status === "refuse";
    }
    if (filter === "processing") {
      return status === "processing" || status === "in_progress" || status === "in-progress" || status === "validation_encours";
    }
    return false;
  };

  // Exact counters for tabs
  const countAll = requests.length;
  const countPending = requests.filter(r => matchesStatus(r.status, "pending")).length;
  const countValidated = requests.filter(r => matchesStatus(r.status, "validated")).length;
  const countRefused = requests.filter(r => matchesStatus(r.status, "refused")).length;
  const countProcessing = requests.filter(r => matchesStatus(r.status, "processing")).length;

  const filteredRequests = requests.filter((r) => {
    const term = (searchTerm || "").toLowerCase();
    const matchSearch = 
      (r?.userName ?? "").toLowerCase().includes(term) ||
      (r?.gomboId ?? "").toLowerCase().includes(term) ||
      (r?.afriId ?? "").toLowerCase().includes(term) ||
      (r?.reference ?? "").toLowerCase().includes(term) ||
      (r?.phoneNumber ?? "").toLowerCase().includes(term) ||
      (r?.numero ?? "").toLowerCase().includes(term) ||
      (r?.uid ?? "").toLowerCase().includes(term);

    return matchSearch && matchesStatus(r.status, selectedStatusFilter);
  });

  // Action Dispatcher
  const handleActionExecute = async () => {
    if (!selectedRequest || !pendingAction) return;

    setActionLoading(true);
    const req = selectedRequest;
    const comment = actionComment.trim();
    const now = new Date();
    const nowIso = now.toISOString();
    const dateStr = now.toLocaleDateString("fr-FR");
    const heureStr = now.toLocaleTimeString("fr-FR");

    try {
      const userRef = doc(db, "users", req.uid);
      const requestRef = doc(
        db,
        req.type === "deposit" ? "walletDepositRequests" : "walletWithdrawalRequests",
        req.id
      );

      if (pendingAction === "ADD_NOTE") {
        // AJOUT DE NOTE INTERNE - Does not affect balance or status, can be simple log
        if (!comment) throw new Error("La note interne ne peut pas être vide.");

        await addDoc(collection(db, "transactionHistory"), {
          transactionId: req.id,
          createdAt: nowIso,
          date: dateStr,
          heure: heureStr,
          founderId: currentUser?.uid || "admin_souverain",
          founderName: currentUser?.displayName || currentUser?.email || "Fondateur Souverain",
          action: "NOTE_INTERNE",
          oldStatus: req.status,
          newStatus: req.status,
          comment: comment
        });

        showToast("📝 Note interne enregistrée !");
        setPendingAction(null);
        setActionComment("");
        setActionLoading(false);
        return;
      }

      // We run everything else in an atomic Firestore transaction
      await runTransaction(db, async (transaction) => {
        // 1. Read Request status to prevent double-validation
        const requestSnap = await transaction.get(requestRef);
        if (!requestSnap.exists()) {
          throw new Error("Demande de transaction introuvable.");
        }

        const requestData = requestSnap.data();
        const currentStatus = requestData.status || requestData.statut || "pending";

        // Check if the status is not pending or waiting support
        if (currentStatus !== "pending" && currentStatus !== "waiting_support" && currentStatus !== "en_attente") {
          throw new Error(`Cette transaction a déjà été traitée ou n'est plus en attente. Statut actuel : ${currentStatus}`);
        }

        // 2. Read User profile
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
          throw new Error("Membre introuvable dans la base de données.");
        }

        const uData = userSnap.data();
        const currentDispo = uData.wallet?.soldeDisponible ?? 0;
        const currentBalance = uData.wallet?.balance ?? currentDispo;

        const txId = `tx_${req.type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

        if (pendingAction === "VALIDATE") {
          if (req.type === "deposit") {
            // Validation of Deposit
            const newDispo = currentDispo + req.montant;
            const newBalance = currentBalance + req.montant;
            const newDepots = (uData.wallet?.depots ?? 0) + req.montant;

            // Update user wallet atomically
            transaction.update(userRef, {
              "wallet.soldeDisponible": newDispo,
              "wallet.balance": newBalance,
              "wallet.depots": newDepots,
              updatedAt: nowIso
            });

            // Update the request document atomically
            transaction.update(requestRef, {
              status: "validated",
              statut: "validated",
              validatedAt: nowIso,
              validatedBy: currentUser?.uid || "admin_souverain",
              walletOperationId: txId,
              processed: true
            });

            // Set general request or transactions in the transaction
            const walletRequestRef = doc(db, "walletRequests", req.id);
            transaction.set(walletRequestRef, {
              status: "validated",
              statut: "validated",
              validatedAt: nowIso,
              validatedBy: currentUser?.uid || "admin_souverain",
              walletOperationId: txId,
              processed: true
            }, { merge: true });

            const transactionRef = doc(db, "transactions", req.id);
            transaction.set(transactionRef, {
              status: "valide",
              statut: "valide",
              validatedAt: nowIso,
              validatedBy: currentUser?.uid || "admin_souverain",
              walletOperationId: txId,
              processed: true
            }, { merge: true });

            // Create entry in walletTransactions/
            const walletTxRef = doc(db, "walletTransactions", txId);
            const txData = {
              id: txId,
              reference: txId,
              uid: req.uid,
              userId: req.uid,
              userName: req.userName,
              userConcerned: req.userName,
              type: "recharge_wallet",
              amount: req.montant,
              montant: req.montant,
              status: "success",
              statut: "success",
              description: `Recharge validée par le Fondateur (Réf: ${req.reference || req.id})`,
              date: dateStr,
              heure: heureStr,
              createdAt: nowIso,
              updatedAt: nowIso,
              timestamp: Date.now()
            };
            transaction.set(walletTxRef, txData, { merge: true });

            // Move to Archive / Validated Automatically
            const archiveRef = doc(db, "archivesValidated", req.id);
            transaction.set(archiveRef, {
              id: req.id,
              uid: req.uid,
              userName: req.userName,
              montant: req.montant,
              type: req.type,
              reference: req.reference || "",
              originalStatus: currentStatus,
              status: "validated",
              statut: "validated",
              validatedAt: nowIso,
              validatedBy: currentUser?.uid || "admin_souverain",
              walletOperationId: txId,
              processed: true,
              archivedAt: nowIso
            });

            // Journal History
            const histRef = doc(collection(db, "transactionHistory"));
            transaction.set(histRef, {
              transactionId: req.id,
              createdAt: nowIso,
              date: dateStr,
              heure: heureStr,
              founderId: currentUser?.uid || "admin_souverain",
              founderName: currentUser?.displayName || currentUser?.email || "Fondateur Souverain",
              action: "VALIDATION",
              oldStatus: currentStatus,
              newStatus: "validated",
              comment: comment || "Rechargement validé avec succès."
            });

            // Create Admin Audit Log
            const auditRef = doc(collection(db, "adminAuditLogs"));
            transaction.set(auditRef, {
              transactionId: req.id,
              oldValue: currentStatus,
              newValue: "validated",
              admin: currentUser?.displayName || currentUser?.email || "Fondateur Souverain",
              adminId: currentUser?.uid || "admin_souverain",
              date: dateStr,
              heure: heureStr,
              action: "VALIDATION_DEPOT",
              amount: req.montant,
              createdAt: nowIso
            });

            // Update betaTransactions doc atomically if it exists
            const betaTxRef = doc(db, "betaTransactions", req.id);
            transaction.set(betaTxRef, {
              status: "completed",
              statut: "valide",
              validatedAt: nowIso,
              validatedBy: currentUser?.uid || "admin_souverain",
              processed: true
            }, { merge: true });

            // User Notification
            const notifRef = doc(collection(db, "notifications"));
            transaction.set(notifRef, {
              userId: req.uid,
              title: "💳 Dépôt Crédité avec Succès !",
              message: `Votre rechargement Wallet de ${req.montant.toLocaleString('fr-FR')} FCFA (Réf: ${req.reference || req.id}) a été validé par le Fondateur.`,
              type: "payment_received",
              createdAt: nowIso,
              isRead: false
            });

          } else {
            // Validation of Withdrawal
            if (currentDispo < req.montant) {
              throw new Error(`Solde insuffisant. Le membre dispose de ${currentDispo.toLocaleString('fr-FR')} FCFA.`);
            }

            const newDispo = Math.max(0, currentDispo - req.montant);
            const newBalance = Math.max(0, currentBalance - req.montant);
            const newRetraits = (uData.wallet?.retraits ?? 0) + req.montant;

            // Update user wallet atomically
            transaction.update(userRef, {
              "wallet.soldeDisponible": newDispo,
              "wallet.balance": newBalance,
              "wallet.retraits": newRetraits,
              updatedAt: nowIso
            });

            // Update the request document atomically
            transaction.update(requestRef, {
              status: "validated",
              statut: "validated",
              validatedAt: nowIso,
              validatedBy: currentUser?.uid || "admin_souverain",
              walletOperationId: txId,
              processed: true
            });

            // Set general request or transactions in the transaction
            const walletRequestRef = doc(db, "walletRequests", req.id);
            transaction.set(walletRequestRef, {
              status: "validated",
              statut: "validated",
              validatedAt: nowIso,
              validatedBy: currentUser?.uid || "admin_souverain",
              walletOperationId: txId,
              processed: true
            }, { merge: true });

            const transactionRef = doc(db, "transactions", req.id);
            transaction.set(transactionRef, {
              status: "valide",
              statut: "valide",
              validatedAt: nowIso,
              validatedBy: currentUser?.uid || "admin_souverain",
              walletOperationId: txId,
              processed: true
            }, { merge: true });

            // Create entry in walletTransactions/
            const walletTxRef = doc(db, "walletTransactions", txId);
            const txData = {
              id: txId,
              reference: txId,
              uid: req.uid,
              userId: req.uid,
              userName: req.userName,
              userConcerned: req.userName,
              type: "retrait",
              amount: req.montant,
              montant: req.montant,
              status: "success",
              statut: "success",
              description: `Retrait validé vers Mobile Money (${req.numero || req.phoneNumber})`,
              date: dateStr,
              heure: heureStr,
              createdAt: nowIso,
              updatedAt: nowIso,
              timestamp: Date.now()
            };
            transaction.set(walletTxRef, txData, { merge: true });

            // Move to Archive / Validated Automatically
            const archiveRef = doc(db, "archivesValidated", req.id);
            transaction.set(archiveRef, {
              id: req.id,
              uid: req.uid,
              userName: req.userName,
              montant: req.montant,
              type: req.type,
              reference: req.reference || "",
              originalStatus: currentStatus,
              status: "validated",
              statut: "validated",
              validatedAt: nowIso,
              validatedBy: currentUser?.uid || "admin_souverain",
              walletOperationId: txId,
              processed: true,
              archivedAt: nowIso
            });

            // Journal History
            const histRef = doc(collection(db, "transactionHistory"));
            transaction.set(histRef, {
              transactionId: req.id,
              createdAt: nowIso,
              date: dateStr,
              heure: heureStr,
              founderId: currentUser?.uid || "admin_souverain",
              founderName: currentUser?.displayName || currentUser?.email || "Fondateur Souverain",
              action: "VALIDATION",
              oldStatus: currentStatus,
              newStatus: "validated",
              comment: comment || "Retrait validé et transféré."
            });

            // Create Admin Audit Log
            const auditRef = doc(collection(db, "adminAuditLogs"));
            transaction.set(auditRef, {
              transactionId: req.id,
              oldValue: currentStatus,
              newValue: "validated",
              admin: currentUser?.displayName || currentUser?.email || "Fondateur Souverain",
              adminId: currentUser?.uid || "admin_souverain",
              date: dateStr,
              heure: heureStr,
              action: "VALIDATION_RETRAIT",
              amount: req.montant,
              createdAt: nowIso
            });

            // Update betaTransactions doc atomically if it exists
            const betaTxRef = doc(db, "betaTransactions", req.id);
            transaction.set(betaTxRef, {
              status: "completed",
              statut: "valide",
              validatedAt: nowIso,
              validatedBy: currentUser?.uid || "admin_souverain",
              processed: true
            }, { merge: true });

            // User Notification
            const notifRef = doc(collection(db, "notifications"));
            transaction.set(notifRef, {
              userId: req.uid,
              title: "💸 Retrait Transféré !",
              message: `Votre demande de retrait de ${req.montant.toLocaleString('fr-FR')} FCFA a été validée et exécutée vers le ${req.numero || req.phoneNumber}.`,
              type: "payment_received",
              createdAt: nowIso,
              isRead: false
            });
          }
        } else if (pendingAction === "REFUSE") {
          if (!comment) throw new Error("Un motif de refus explicite est obligatoire.");

          const targetStatus = "refused";

          // Update status
          transaction.update(requestRef, {
            status: targetStatus,
            statut: targetStatus,
            refusedAt: nowIso
          });

          const walletRequestRef = doc(db, "walletRequests", req.id);
          transaction.set(walletRequestRef, {
            status: targetStatus,
            statut: targetStatus,
            refusalReason: comment,
            refusedAt: nowIso
          }, { merge: true });

          const transactionRef = doc(db, "transactions", req.id);
          transaction.set(transactionRef, {
            status: "refuse",
            statut: "refuse",
            refusalReason: comment
          }, { merge: true });

          // Update betaTransactions doc atomically
          const betaTxRef = doc(db, "betaTransactions", req.id);
          transaction.set(betaTxRef, {
            status: "rejected",
            statut: "refuse",
            refusedAt: nowIso,
            refusalReason: comment,
            processed: true
          }, { merge: true });

          // Journal History
          const histRef = doc(collection(db, "transactionHistory"));
          transaction.set(histRef, {
            transactionId: req.id,
            createdAt: nowIso,
            date: dateStr,
            heure: heureStr,
            founderId: currentUser?.uid || "admin_souverain",
            founderName: currentUser?.displayName || currentUser?.email || "Fondateur Souverain",
            action: "REFUS",
            oldStatus: currentStatus,
            newStatus: targetStatus,
            comment: comment
          });

          // Create Admin Audit Log
          const auditRef = doc(collection(db, "adminAuditLogs"));
          transaction.set(auditRef, {
            transactionId: req.id,
            oldValue: currentStatus,
            newValue: targetStatus,
            admin: currentUser?.displayName || currentUser?.email || "Fondateur Souverain",
            adminId: currentUser?.uid || "admin_souverain",
            date: dateStr,
            heure: heureStr,
            action: "REFUS_TRANSACTION",
            amount: req.montant,
            createdAt: nowIso
          });

          // User Notification
          const notifRef = doc(collection(db, "notifications"));
          transaction.set(notifRef, {
            userId: req.uid,
            title: req.type === "deposit" ? "🔴 Rechargement Refusé" : "🔴 Retrait Refusé",
            message: `Votre demande de ${req.type === "deposit" ? "dépôt" : "retrait"} de ${req.montant.toLocaleString('fr-FR')} FCFA a été refusée par le Fondateur. Motif : ${comment}`,
            type: "payment_refused",
            createdAt: nowIso,
            isRead: false
          });

        } else if (pendingAction === "PENDING") {
          const targetStatus = "pending";

          transaction.update(requestRef, {
            status: targetStatus,
            statut: targetStatus
          });

          const walletRequestRef = doc(db, "walletRequests", req.id);
          transaction.set(walletRequestRef, {
            status: targetStatus,
            statut: targetStatus
          }, { merge: true });

          const transactionRef = doc(db, "transactions", req.id);
          transaction.set(transactionRef, {
            status: "en_attente",
            statut: "en_attente"
          }, { merge: true });

          // Update betaTransactions doc atomically
          const betaTxRef = doc(db, "betaTransactions", req.id);
          transaction.set(betaTxRef, {
            status: "pending",
            statut: "en_attente"
          }, { merge: true });

          // Journal History
          const histRef = doc(collection(db, "transactionHistory"));
          transaction.set(histRef, {
            transactionId: req.id,
            createdAt: nowIso,
            date: dateStr,
            heure: heureStr,
            founderId: currentUser?.uid || "admin_souverain",
            founderName: currentUser?.displayName || currentUser?.email || "Fondateur Souverain",
            action: "MISE_EN_ATTENTE",
            oldStatus: currentStatus,
            newStatus: targetStatus,
            comment: comment || "Remis en attente de vérification."
          });

          // Create Admin Audit Log
          const auditRef = doc(collection(db, "adminAuditLogs"));
          transaction.set(auditRef, {
            transactionId: req.id,
            oldValue: currentStatus,
            newValue: targetStatus,
            admin: currentUser?.displayName || currentUser?.email || "Fondateur Souverain",
            adminId: currentUser?.uid || "admin_souverain",
            date: dateStr,
            heure: heureStr,
            action: "MISE_EN_ATTENTE",
            amount: req.montant,
            createdAt: nowIso
          });
        }
      });

      // Show success states post-transaction completion
      if (pendingAction === "VALIDATE") {
        showToast(req.type === "deposit" ? "✅ Dépôt validé et synchronisé !" : "✅ Retrait validé et synchronisé !");
        try { audioSynth.playValidationSuccess(); } catch (_) {}
        setSelectedRequest(prev => prev ? { ...prev, status: "validated" } : null);
      } else if (pendingAction === "REFUSE") {
        showToast("❌ Demande refusée et membre notifié.");
        setSelectedRequest(prev => prev ? { ...prev, status: "refused" } : null);
      } else if (pendingAction === "PENDING") {
        showToast("⏳ Transaction remise en attente.");
        setSelectedRequest(prev => prev ? { ...prev, status: "pending" } : null);
      }

      // Automatically send support message to user's support conversation
      try {
        const userConvoId = await SupportService.getOrCreateSupportConversation(req.uid);
        let supportText = "";
        if (pendingAction === "VALIDATE") {
          if (req.type === "deposit") {
            supportText = `✅ Votre dépôt a été validé.\nMontant crédité :\n${Number(req.montant).toLocaleString('fr-FR')} FCFA.\nVotre Wallet est maintenant à jour.`;
          } else {
            supportText = `✅ Votre retrait a été validé.\nMontant débité :\n${Number(req.montant).toLocaleString('fr-FR')} FCFA.\nVotre Wallet est maintenant à jour.`;
          }
        } else if (pendingAction === "REFUSE") {
          if (req.type === "deposit") {
            supportText = `❌ Votre dépôt n'a pas pu être validé.\nMotif :\n${comment || "Non spécifié"}`;
          } else {
            supportText = `❌ Votre retrait n'a pas pu être validé.\nMotif :\n${comment || "Non spécifié"}`;
          }
        }

        if (supportText) {
          await SupportService.sendSupportMessage(
            userConvoId,
            SUPPORT_PROFILE.uid,
            SUPPORT_PROFILE.name,
            supportText,
            "Wallet"
          );

          // Update supportConversations metadata to reflect status
          await setDoc(doc(db, "supportConversations", userConvoId), {
            status: pendingAction === "VALIDATE" ? "closed" : "open"
          }, { merge: true });
        }
      } catch (err) {
        console.warn("Could not send automated support message on transaction update:", err);
      }

      setPendingAction(null);
      setActionComment("");
    } catch (err: any) {
      showToast(`❌ Erreur: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans select-none relative">
      
      {/* Toast de notification instantané */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-20 left-1/2 z-55 bg-afri-bg-sec border border-[#D4AF37] text-afri-text px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold"
          >
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bannière d'en-tête */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-800/40 border border-[#D4AF37]/30 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] rounded-2xl shrink-0">
                <Wallet className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-afri-text uppercase tracking-wider">
                  CENTRE DE VALIDATION DES TRANSACTIONS BÊTA
                </h2>
                <p className="text-[10px] sm:text-xs text-afri-text-sec">
                  Gérez souverainement et en temps réel l'ensemble des rechargements et des retraits Mobile Money
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-afri-bg/60 border border-neutral-850 px-4 py-2 rounded-2xl text-[10px] font-mono text-afri-text-sec">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Souveraineté Financière Active</span>
          </div>
        </div>
      </div>

      {/* Barre de Filtres et de Recherche */}
      <div className="flex flex-col xl:flex-row gap-4 items-stretch justify-between">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-afri-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par membre, GOMBO ID, référence, UID..."
            className="w-full pl-11 pr-4 py-3 bg-afri-bg border border-neutral-850 focus:border-[#D4AF37]/60 rounded-2xl text-xs text-afri-text outline-none placeholder:text-zinc-600 transition-all"
          />
        </div>

        {/* Onglets des filtres */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {[
            { id: "all", label: "Toutes", count: countAll },
            { id: "pending", label: "⚡ En attente", count: countPending },
            { id: "validated", label: "✅ Validées", count: countValidated },
            { id: "refused", label: "❌ Refusées", count: countRefused },
            { id: "processing", label: "⏳ En cours", count: countProcessing }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedStatusFilter(f.id)}
              className={`px-3.5 py-2 rounded-xl text-[11px] font-mono font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedStatusFilter === f.id
                  ? "bg-[#D4AF37] text-afri-text font-black shadow-lg"
                  : "bg-afri-bg-sec border border-neutral-850 text-afri-text-sec hover:text-afri-text"
              }`}
            >
              <span>{f.label}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${selectedStatusFilter === f.id ? "bg-afri-bg/20 text-afri-text font-black" : "bg-afri-bg/40 text-afri-text-muted"}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Liste des requêtes */}
      {loading ? (
        <div className="p-16 text-center bg-afri-bg border border-neutral-850 rounded-3xl space-y-3">
          <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin mx-auto" />
          <p className="text-xs text-afri-text-muted font-mono">Lecture et synchronisation de l'arbre à palabre financier...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-14 text-center bg-afri-bg border border-neutral-850 rounded-3xl space-y-3">
          <Wallet className="w-10 h-10 text-zinc-700 mx-auto" />
          <p className="text-sm font-bold text-afri-text-sec">Aucune demande ne correspond à vos filtres actuels.</p>
          <p className="text-xs text-zinc-600">Toutes les recharges et retraits sont synchronisés en temps réel via Firestore.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredRequests.map((req) => {
            const dateObj = new Date(req.createdAt);
            const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('fr-FR') : "Aujourd'hui";
            const timeStr = !isNaN(dateObj.getTime()) ? dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : "--:--";
            const isDeposit = req.type === "deposit";
            const isPending = req.status === "pending" || req.status === "waiting_support" || req.status === "en_attente";
            const isValidated = req.status === "validated" || req.status === "paid" || req.status === "success";
            const isRefused = req.status === "refused" || req.status === "rejected" || req.status === "refuse";

            return (
              <motion.div
                key={req.id}
                layout
                onClick={() => {
                  setSelectedRequest(req);
                  setPendingAction(null);
                  setActionComment("");
                }}
                className="bg-afri-bg border border-neutral-850 hover:border-[#D4AF37]/50 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all shadow-md cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow transition-transform group-hover:scale-105 shrink-0 ${
                    isDeposit 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                      : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  }`}>
                    {isDeposit ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-afri-text uppercase tracking-tight">{req.userName}</h4>
                      <span className={`text-[8px] font-mono px-2 py-0.5 rounded border font-bold ${
                        isDeposit 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                          : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      }`}>
                        {isDeposit ? "RECHARGE DÉPÔT" : "RETRAIT COMPTE"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-mono text-afri-text-muted flex-wrap">
                      {req.reference && (
                        <span>Réf : <strong className="text-afri-text-sec font-bold">{req.reference}</strong></span>
                      )}
                      {(req.numero || req.phoneNumber) && (
                        <span>Dest : <strong className="text-afri-text-sec font-bold">{req.numero || req.phoneNumber}</strong></span>
                      )}
                      <span>{dateStr} à {timeStr}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t border-neutral-900 md:border-none pt-3 md:pt-0">
                  <div className="text-left md:text-right">
                    <span className={`text-base font-mono font-black block ${isDeposit ? "text-emerald-400" : "text-amber-500"}`}>
                      {isDeposit ? "+" : "-"}{req.montant.toLocaleString('fr-FR')} FCFA
                    </span>
                    
                    <span className={`inline-block text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded border mt-0.5 ${
                      isValidated ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                      isRefused ? "bg-rose-500/10 text-rose-400 border-rose-500/30" :
                      isPending ? "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse" :
                      "bg-blue-500/10 text-blue-400 border-blue-500/30"
                    }`}>
                      {isValidated ? "Validé" : isRefused ? "Refusé" : isPending ? "En attente" : req.status}
                    </span>
                  </div>

                  <div className="px-2.5 py-1.5 bg-afri-bg-sec border border-afri-border text-[#D4AF37] rounded-xl text-[10px] font-bold font-mono group-hover:bg-[#D4AF37]/10 group-hover:text-afri-text transition-all">
                    Ouvrir →
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* =========================================================
           10. INTERFACE ANDROID : DETAILED VIEW BOTTOM SHEET / FULL SCREEN
           ========================================================= */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 bg-afri-bg/45 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4">
            
            {/* Overlay background for closing on click outside */}
            <div 
              className="absolute inset-0 z-10 cursor-pointer" 
              onClick={() => {
                setSelectedRequest(null);
                setPendingAction(null);
              }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-[92%] max-w-[480px] max-h-[85vh] h-auto bg-[#08080a] border border-afri-border rounded-[24px] flex flex-col overflow-hidden relative shadow-2xl z-20"
            >
              
              {/* Android Pill Handle */}
              <div className="w-full py-3.5 flex justify-center shrink-0 bg-neutral-950/60 border-b border-neutral-900 relative">
                <div className="w-12 h-1 bg-neutral-700 rounded-full" />
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setPendingAction(null);
                  }}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-afri-text-muted hover:text-afri-text text-xs bg-afri-bg-sec px-3 py-1 rounded-xl font-mono"
                >
                  Fermer ✕
                </button>
              </div>

              {/* Contenu principal défilable */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 scrollbar-none text-left">
                
                {/* Header de la Fiche */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-afri-bg p-4 rounded-2xl border border-neutral-900">
                  <div className="flex items-center gap-4">
                    {/* Photo Utilisateur */}
                    <div className="w-14 h-14 rounded-2xl border border-afri-border overflow-hidden shrink-0 bg-afri-bg-sec flex items-center justify-center">
                      {(selectedReqUser?.photoURL || selectedReqUser?.photoUrl || selectedRequest.userPhoto) ? (
                        <img 
                          referrerPolicy="no-referrer"
                          src={selectedReqUser?.photoURL || selectedReqUser?.photoUrl || selectedRequest.userPhoto} 
                          alt="Avatar" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <User className="w-6 h-6 text-zinc-600" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-black text-afri-text uppercase tracking-tight flex items-center gap-2">
                        <span>{selectedReqUser?.displayName || selectedRequest.userName}</span>
                        {selectedReqUser?.isPremium && (
                          <span className="text-[7.5px] font-black bg-amber-500/15 text-[#D4AF37] px-2 py-0.5 rounded border border-[#D4AF37]/30 tracking-widest">
                            ELITE
                          </span>
                        )}
                      </h3>
                      <p className="text-[10px] text-afri-text-muted font-mono">UID : {selectedRequest.uid}</p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[10px] font-mono text-afri-text-muted uppercase block tracking-wider">Montant de la Transaction</span>
                    <span className={`text-xl font-mono font-black block ${selectedRequest.type === "deposit" ? "text-emerald-400" : "text-amber-500"}`}>
                      {selectedRequest.type === "deposit" ? "+" : "-"}{selectedRequest.montant.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>

                {/* Section Informations Complètes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Détails Financiers */}
                  <div className="bg-afri-bg p-4 rounded-2xl border border-neutral-900 space-y-3.5">
                    <h4 className="text-[10px] font-mono font-black text-[#D4AF37] uppercase tracking-widest pb-1 border-b border-neutral-900">
                      Spécifications de la Demande
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs font-mono">
                      <div>
                        <span className="text-zinc-600 block text-[9px] uppercase">GOMBO ID</span>
                        <span className="text-afri-text-sec font-bold">
                          {typeof selectedReqUser?.gomboId === 'object' ? selectedReqUser.gomboId.id : (selectedReqUser?.gomboId || typeof selectedRequest.gomboId === 'object' ? (selectedRequest.gomboId as any).id : selectedRequest.gomboId || "Non renseigné")}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-600 block text-[9px] uppercase">AFRI ID</span>
                        <span className="text-afri-text-sec font-bold">
                          {typeof selectedReqUser?.afriId === 'object' ? (selectedReqUser.afriId as any).id : (selectedReqUser?.afriId || typeof selectedRequest.afriId === 'object' ? (selectedRequest.afriId as any).id : selectedRequest.afriId || "Non renseigné")}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-600 block text-[9px] uppercase">Type de Flux</span>
                        <span className={`font-bold ${selectedRequest.type === "deposit" ? "text-emerald-400" : "text-amber-500"}`}>
                          {selectedRequest.type === "deposit" ? "Dépôt (Recharge)" : "Retrait Cashout"}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-600 block text-[9px] uppercase">Moyen de Paiement</span>
                        <span className="text-afri-text-sec font-bold">{selectedRequest.operator || "Mobile Money"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-600 block text-[9px] uppercase">Référence</span>
                        <span className="text-afri-text-sec font-bold select-all">{selectedRequest.reference || selectedRequest.id}</span>
                      </div>
                      <div>
                        <span className="text-zinc-600 block text-[9px] uppercase">Numéro Dist.</span>
                        <span className="text-afri-text-sec font-bold">{selectedRequest.numero || selectedRequest.phoneNumber || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-600 block text-[9px] uppercase">Date de création</span>
                        <span className="text-afri-text-sec">
                          {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleDateString("fr-FR") : "--"}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-600 block text-[9px] uppercase">Heure de création</span>
                        <span className="text-afri-text-sec">
                          {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "--"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Solde Live du Membre */}
                  <div className="bg-afri-bg p-4 rounded-2xl border border-neutral-900 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-mono font-black text-[#D4AF37] uppercase tracking-widest pb-1 border-b border-neutral-900">
                        État de Caisse du Membre (Live)
                      </h4>
                      <div className="flex items-center gap-3">
                        <Coins className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <span className="text-[9px] text-afri-text-muted block uppercase font-mono">Solde Disponible Actuel</span>
                          <span className="text-xl font-mono font-black text-emerald-400">
                            {(selectedReqUser?.wallet?.soldeDisponible ?? 0).toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-850 text-[10px] font-mono text-afri-text-sec space-y-1">
                      <p>• Dépôts Cumulés : <strong className="text-afri-text">{(selectedReqUser?.wallet?.depots ?? 0).toLocaleString('fr-FR')} FCFA</strong></p>
                      <p>• Retraits Cumulés : <strong className="text-afri-text">{(selectedReqUser?.wallet?.retraits ?? 0).toLocaleString('fr-FR')} FCFA</strong></p>
                    </div>
                  </div>
                </div>

                {/* Preuve de Paiement (Capture) */}
                <div className="bg-afri-bg p-4 rounded-2xl border border-neutral-900 space-y-3">
                  <h4 className="text-[10px] font-mono font-black text-[#D4AF37] uppercase tracking-widest pb-1 border-b border-neutral-900">
                    Capture de Preuve (si disponible)
                  </h4>
                  {selectedRequest.preuveUrl ? (
                    <div className="space-y-2">
                      <div className="w-full max-h-80 rounded-xl overflow-hidden border border-afri-border bg-afri-bg relative group">
                        <img 
                          referrerPolicy="no-referrer"
                          src={selectedRequest.preuveUrl} 
                          alt="Capture Preuve Bêta" 
                          className="w-full h-auto max-h-80 object-contain mx-auto"
                        />
                      </div>
                      <div className="flex justify-end">
                        <a 
                          href={selectedRequest.preuveUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[10px] text-[#D4AF37] hover:underline flex items-center gap-1 font-mono"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Ouvrir l'image en plein écran</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center border border-dashed border-afri-border rounded-xl space-y-1.5">
                      <AlertCircle className="w-6 h-6 text-zinc-600 mx-auto" />
                      <p className="text-[11px] font-mono text-afri-text-muted">Aucun fichier image de preuve attaché directement à la demande.</p>
                      <p className="text-[9px] text-zinc-600">Le membre peut transmettre sa preuve de virement via le chat d'Arbre à Palabres.</p>
                    </div>
                  )}
                </div>

                {/* HISTORIQUE DES ACTIONS (JOURNAL TEMPS RÉEL) */}
                <div className="bg-afri-bg p-4 rounded-2xl border border-neutral-900 space-y-4">
                  <h4 className="text-[10px] font-mono font-black text-[#D4AF37] uppercase tracking-widest pb-1 border-b border-neutral-900">
                    Historique Souverain des Actions
                  </h4>

                  {selectedReqHistory.length === 0 ? (
                    <p className="text-[10px] font-mono text-zinc-600 italic">Aucune action n'a encore été enregistrée pour cette transaction.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedReqHistory.map((log) => (
                        <div key={log.id} className="p-3 bg-[#0a0a0c] border border-neutral-900 rounded-xl text-[11px] font-mono space-y-1.5">
                          <div className="flex justify-between items-start flex-wrap gap-1">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                              log.action === "VALIDATION" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              log.action === "REFUS" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                              log.action === "MISE_EN_ATTENTE" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                              "bg-afri-bg-ter text-afri-text-sec"
                            }`}>
                              {log.action}
                            </span>
                            <span className="text-zinc-600 text-[9px]">{log.date} à {log.heure}</span>
                          </div>
                          
                          <p className="text-afri-text-sec leading-relaxed">
                            {log.comment || "(Aucun commentaire enregistré)"}
                          </p>

                          <div className="text-[9px] text-afri-text-muted flex justify-between pt-1 border-t border-neutral-900">
                            <span>Par : <strong className="text-afri-text-sec">{log.founderName}</strong></span>
                            <span>Statut : <strong className="text-afri-text-sec">{log.oldStatus} ➔ {log.newStatus}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Panneau de Confirmation d'Action (S'ouvre si une action est choisie) */}
              <AnimatePresence>
                {pendingAction && (
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="absolute inset-x-0 bottom-0 bg-[#0e0e12] border-t-2 border-[#D4AF37]/50 p-5 space-y-4 z-30 shadow-2xl text-left"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-neutral-850">
                      <h4 className="text-xs font-black font-mono text-[#D4AF37] uppercase flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-[#D4AF37]" />
                        <span>
                          {pendingAction === "VALIDATE" ? "CONFIRMER LA VALIDATION" :
                           pendingAction === "REFUSE" ? "CONFIRMER LE REFUS" :
                           pendingAction === "PENDING" ? "CONFIRMER LA MISE EN ATTENTE" :
                           "AJOUTER UNE NOTE INTERNE"}
                        </span>
                      </h4>
                      <button 
                        onClick={() => {
                          setPendingAction(null);
                          setActionComment("");
                        }}
                        className="text-afri-text-muted hover:text-afri-text font-mono text-[10px]"
                      >
                        Annuler
                      </button>
                    </div>

                    <p className="text-[11px] font-sans text-afri-text-sec">
                      {pendingAction === "VALIDATE" && "Cette action mettra instantanément à jour le solde du Wallet de l'utilisateur, créera un enregistrement comptable et enverra une notification de confirmation."}
                      {pendingAction === "REFUSE" && "Veuillez spécifier le motif du refus. Cette information sera directement notifiée au membre de l'Arbre à Palabre."}
                      {pendingAction === "PENDING" && "Le statut sera remis à 'en attente'. Aucun fonds ne sera mouvementé."}
                      {pendingAction === "ADD_NOTE" && "Ajoutez un commentaire ou une observation interne sur cette transaction bêta."}
                    </p>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-[#D4AF37] uppercase tracking-widest block">
                        Note explicite / Commentaire {pendingAction === "REFUSE" ? "*" : "(Optionnel)"}
                      </label>
                      <textarea
                        value={actionComment}
                        onChange={(e) => setActionComment(e.target.value)}
                        placeholder={
                          pendingAction === "REFUSE" 
                            ? "Motif de refus : ex. Référence invalide, virement non reçu..."
                            : "Entrez un commentaire pour le journal d'administration..."
                        }
                        rows={2}
                        className="w-full bg-afri-bg border border-afri-border focus:border-[#D4AF37]/40 rounded-xl p-3 text-xs text-afri-text font-mono outline-none placeholder:text-zinc-700"
                      />
                    </div>

                    <div className="flex gap-2.5">
                      <button
                        onClick={() => {
                          setPendingAction(null);
                          setActionComment("");
                        }}
                        className="flex-1 py-3 bg-afri-bg-sec border border-neutral-850 hover:bg-neutral-850 text-afri-text rounded-xl text-xs font-mono font-bold uppercase transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleActionExecute}
                        disabled={actionLoading || (pendingAction === "REFUSE" && !actionComment.trim())}
                        className={`flex-1 py-3 text-afri-text font-black rounded-xl text-xs font-mono uppercase shadow-lg transition-colors flex items-center justify-center gap-1.5 ${
                          pendingAction === "VALIDATE" ? "bg-emerald-400 hover:bg-emerald-300" :
                          pendingAction === "REFUSE" ? "bg-rose-500 hover:bg-rose-400 text-afri-text" :
                          "bg-[#D4AF37] hover:bg-[#D4AF37]/80"
                        } disabled:opacity-40`}
                      >
                        {actionLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Confirmer l'opération"
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions Footer de la Fiche (Masqué si une confirmation d'action est en cours) */}
              {!pendingAction && (
                <div className="p-4 sm:p-5 bg-afri-bg border-t border-neutral-900 grid grid-cols-2 xs:grid-cols-4 gap-2 shrink-0 z-10">
                  <button
                    onClick={() => {
                      setPendingAction("VALIDATE");
                      setActionComment("");
                    }}
                    className="py-3 bg-emerald-600 hover:bg-emerald-500 text-afri-text text-xs font-black font-mono rounded-xl transition-all cursor-pointer shadow flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Valider</span>
                  </button>

                  <button
                    onClick={() => {
                      setPendingAction("REFUSE");
                      setActionComment("");
                    }}
                    className="py-3 bg-rose-600 hover:bg-rose-500 text-afri-text text-xs font-black font-mono rounded-xl transition-all cursor-pointer shadow flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Refuser</span>
                  </button>

                  <button
                    onClick={() => {
                      setPendingAction("PENDING");
                      setActionComment("");
                    }}
                    className="py-3 bg-afri-bg-sec hover:bg-neutral-850 border border-afri-border text-afri-text-sec text-xs font-black font-mono rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Attente</span>
                  </button>

                  <button
                    onClick={() => {
                      setPendingAction("ADD_NOTE");
                      setActionComment("");
                    }}
                    className="py-3 bg-afri-bg-sec hover:bg-neutral-850 border border-afri-border text-[#D4AF37] text-xs font-black font-mono rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Note</span>
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default BetaTransactionsAdminPanel;
