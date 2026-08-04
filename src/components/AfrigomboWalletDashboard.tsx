import React, { useState, useEffect, useRef } from "react";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Coins, 
  Lock, 
  Unlock, 
  History, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Phone, 
  Loader2, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  TrendingUp, 
  ChevronRight,
  FileText,
  MessageSquare,
  QrCode,
  Scan,
  Send,
  Search,
  Check,
  Settings,
  Eye,
  EyeOff,
  Shield,
  Fingerprint
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AndroidPageLayout } from "./layout/AndroidPageLayout";
import { AndroidCard } from "./layout/AndroidCard";
import { AndroidBottomSheet } from "./common/AndroidBottomSheet";
import { db, gomboDB } from "../firebase";
import { collection, query, where, getDocs, addDoc, onSnapshot, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { BetaEscrowInfoButton } from "./BetaEscrowInfoModal";
import { supportConfig } from "../supportConfig";
import { recordWalletTransaction } from "../lib/financial";
import { SupportService } from "../services/SupportService";
import { useAppSettings } from "../context/AppSettingsContext";

import { SecurityService } from "../lib/SecurityService";
import { useMaintenance } from "../hooks/useMaintenance";
import ModuleMaintenanceNotice from "./common/ModuleMaintenanceNotice";

interface AfrigomboWalletDashboardProps {
  currentUserProfile: any;
  addToTerminal: (msg: string) => void;
  onBack?: () => void;
  onNavigateToMessages?: (userId?: string) => void;
}

export default function AfrigomboWalletDashboard({ 
  currentUserProfile, 
  addToTerminal,
  onBack,
  onNavigateToMessages
}: AfrigomboWalletDashboardProps) {
  const { isModuleUnderMaintenance, maintenance } = useMaintenance();
  const uid = currentUserProfile?.uid || currentUserProfile?.id;
  const historyRef = useRef<HTMLDivElement>(null);
  
  // Real-time ledger states from users/{uid}
  const [wallet, setWallet] = useState({ 
    soldeDisponible: 0, 
    soldeBloque: 0,
    revenus: 0,
    depots: 0,
    retraits: 0,
    gainsMensuels: 0,
    revenusMois: 0,
    economiesPremium: 0,
    niveauWallet: "Standard"
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // History tab filter & details modal states
  const [activeTab, setActiveTab] = useState<"all" | "flows" | "contracts" | "commissions" | "disputes">("all");
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [selectedTxDetails, setSelectedTxDetails] = useState<any | null>(null);
  
  // Dialog states
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  
  // Form fields
  const [amount, setAmount] = useState(() => {
    return localStorage.getItem("afrigombo_suggested_deposit_amount") || "";
  });
  const [phoneNumber, setPhoneNumber] = useState(currentUserProfile?.phone || "");
  const [operator, setOperator] = useState<"wave" | "orange" | "mtn" | "moov">("wave");
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<"form" | "otp" | "success">("form");
  const [createdDepositRef, setCreatedDepositRef] = useState<string>("");
  const [createdTxId, setCreatedTxId] = useState<string>("");
  const [withdrawSubmitted, setWithdrawSubmitted] = useState<boolean>(false);

  useEffect(() => {
    const suggested = localStorage.getItem("afrigombo_suggested_deposit_amount");
    if (suggested) {
      setShowDepositModal(true);
      localStorage.removeItem("afrigombo_suggested_deposit_amount");
    }
  }, []);

  useEffect(() => {
    if (showDepositModal || showWithdrawModal || showScannerModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showDepositModal, showWithdrawModal, showScannerModal]);

  // Scanner / Transfer states
  const [scanRecipient, setScanRecipient] = useState("");
  const [scanAmount, setScanAmount] = useState("");
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanCopied, setScanCopied] = useState(false);

  // --- WALLET SETTINGS AND PIN SECURITY ---
  const { payments, updatePaymentPref, showToast } = useAppSettings();
  const [showWalletSettings, setShowWalletSettings] = useState(false);
  const [walletPinSettings, setWalletPinSettings] = useState({
    pinHash: "",
    pinEnabled: false,
    pinLength: 4
  });

  const [pinFlow, setPinFlow] = useState<{
    mode: "idle" | "create_step1" | "create_step2" | "modify_old" | "modify_new" | "modify_confirm" | "disable_verify" | "enable_verify";
    length: 4 | 6;
    tempPin: string;
    enteredPin: string;
    errorMsg: string;
  }>({
    mode: "idle",
    length: 4,
    tempPin: "",
    enteredPin: "",
    errorMsg: ""
  });

  const [activePendingOperation, setActivePendingOperation] = useState<{
    type: "withdraw" | "transfer";
    amount: number;
    recipient?: string;
    details: string;
    execute: () => Promise<void>;
  } | null>(null);

  const [recapConfirmed, setRecapConfirmed] = useState(false);

  const [pinVerificationFlow, setPinVerificationFlow] = useState<{
    active: boolean;
    enteredPin: string;
    errorMsg: string;
    attempts: number;
  }>({
    active: false,
    enteredPin: "",
    errorMsg: "",
    attempts: 0
  });

  // Secure PIN Hashing (SHA-256 with user UID salt)
  const hashPIN = async (pin: string, salt: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + ":" + salt);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  // Sound Synth Helper
  const playSound = (type: "success" | "click" | "error") => {
    try {
      const AudioSynth = (window as any).audioSynth;
      if (AudioSynth) {
        if (type === "success") AudioSynth.playValidationSuccess();
        else if (type === "click") AudioSynth.playTap();
      }
    } catch (_) {}
  };

  // Real-time listener for user profile wallet & transactions from Firestore
  useEffect(() => {
    if (!uid) return;

    // 1. Listen to current user profile (users/{uid}) - Official single Wallet source
    const unsubProfile = onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) {
        const uData = snap.data();
        const solde = uData.walletBalance ?? uData.wallet?.soldeDisponible ?? 0;
        setWallet({
          soldeDisponible: solde,
          soldeBloque: uData.wallet?.soldeBloque || 0,
          revenus: uData.wallet?.revenus || 0,
          depots: uData.wallet?.depots || 0,
          retraits: uData.wallet?.retraits || 0,
          gainsMensuels: uData.wallet?.gainsMensuels || 0,
          revenusMois: uData.wallet?.revenusMois || 0,
          economiesPremium: uData.wallet?.economiesPremium || 0,
          niveauWallet: uData.wallet?.niveauWallet || "Standard"
        });
        setWalletPinSettings({
          pinHash: uData.paymentSettings?.pinHash || "",
          pinEnabled: uData.paymentSettings?.pinEnabled ?? false,
          pinLength: uData.paymentSettings?.pinLength || 4,
        });
      }
    });

    // 2. Listen to all transactions in both 'transactions' and 'walletTransactions' collections in real-time
    const txMap = new Map<string, any>();

    const syncTxList = () => {
      const list = Array.from(txMap.values());
      list.sort((a, b) => new Date(b.createdAt || b.date || b.timestamp || 0).getTime() - new Date(a.createdAt || a.date || a.timestamp || 0).getTime());
      setTransactions(list);
    };

    const unsubTx1 = onSnapshot(collection(db, "transactions"), (snap) => {
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.userId === uid || data.uid === uid || data.artistId === uid || data.clientId === uid || data.userConcernedId === uid) {
          txMap.set(docSnap.id, { id: docSnap.id, ...data });
        }
      });
      syncTxList();
    });

    const unsubTx2 = onSnapshot(collection(db, "walletTransactions"), (snap) => {
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.userId === uid || data.uid === uid || data.artistId === uid || data.clientId === uid || data.userConcernedId === uid) {
          txMap.set(docSnap.id, { id: docSnap.id, ...data });
        }
      });
      syncTxList();
    });

    const unsubTx3 = onSnapshot(collection(db, "walletRefunds"), (snap) => {
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.userId === uid || data.uid === uid) {
          txMap.set(docSnap.id, { id: docSnap.id, ...data });
        }
      });
      syncTxList();
    });

    const unsubTx4 = onSnapshot(collection(db, "walletAdjustments"), (snap) => {
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.userId === uid || data.uid === uid) {
          txMap.set(docSnap.id, { id: docSnap.id, ...data });
        }
      });
      syncTxList();
    });

    // 3. Listen to all contracts in Firestore involving this user
    const unsubContracts = onSnapshot(collection(db, "contracts"), (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.clientId === uid || data.artistId === uid) {
          list.push({ id: docSnap.id, ...data });
        }
      });
      list.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
      setContracts(list);
      setLoading(false);
    });

    return () => {
      unsubProfile();
      unsubTx1();
      unsubTx2();
      unsubTx3();
      unsubTx4();
      unsubContracts();
    };
  }, [uid]);

  // Self-Healing ledger reconciliation with Firestore
  useEffect(() => {
    if (loading || !uid) return;

    const reconcileWallet = async () => {
      let calculatedBloque = 0;
      contracts.forEach(c => {
        if (c.status === "payment_held" || c.status === "arrived" || c.status === "in_progress" || c.status === "completed_artist" || c.status === "disputed") {
          if (c.clientId === uid) {
            calculatedBloque += (c.totalClientPaid || 0);
          }
        }
      });

      let calculatedDepots = 0;
      let calculatedRetraits = 0;
      let calculatedRevenus = 0;

      transactions.forEach(t => {
        const isSuccess = t.status === "success" || !t.status || t.status === "Terminé" || t.status === "Paiement reçu";
        if (isSuccess) {
          if (t.type === "deposit" || t.type === "depot" || t.type === "recharge_wallet") {
            if (t.userId === uid) calculatedDepots += (t.amount || t.montant || 0);
          } else if (t.type === "withdrawal" || t.type === "retrait") {
            if (t.userId === uid) calculatedRetraits += (t.amount || t.montant || 0);
          } else if (t.type === "release" || t.type === "deblocage_cachet") {
            if (t.userId === uid || t.artistId === uid) calculatedRevenus += (t.amount || t.montant || 0);
          }
        }
      });

      const walletNeedsSync = 
        wallet.soldeBloque !== calculatedBloque ||
        wallet.depots !== calculatedDepots ||
        wallet.retraits !== calculatedRetraits ||
        wallet.revenus !== calculatedRevenus;
      
      if (walletNeedsSync) {
        const userRef = doc(db, "users", uid);
        await setDoc(userRef, {
          wallet: {
            soldeDisponible: wallet.soldeDisponible,
            soldeBloque: calculatedBloque,
            depots: calculatedDepots,
            retraits: calculatedRetraits,
            revenus: calculatedRevenus,
            economiesPremium: wallet.economiesPremium || 0,
            niveauWallet: wallet.niveauWallet || "Standard"
          }
        }, { merge: true });
      }
    };

    reconcileWallet().catch(err => console.error("Reconciler error", err));
  }, [contracts, transactions, loading, uid]);

  // MOBILE MONEY DEPOSIT HANDLER (UPDATED FOR BÊTA)
  const handleDepositRequest = async () => {
    // 0. Security Maintenance Check
    const maintCheck = await SecurityService.checkMaintenanceMode("wallet");
    if (maintCheck.isMaintenance) {
      alert(`⚠️ [SÉCURITÉ] ${maintCheck.message}`);
      return;
    }

    // Rate Limiting Check
    const rateCheck = SecurityService.enforceRateLimit(uid, "deposit_request", 5, 60000);
    if (!rateCheck.allowed) {
      alert(`⚠️ Trop de tentatives de dépôt. Veuillez attendre ${rateCheck.retryAfterSec} secondes.`);
      return;
    }

    const depositAmount = Number(amount);
    if (!depositAmount || depositAmount < 1000) {
      alert("Le montant minimum est de 1 000 FCFA.");
      return;
    }
    setProcessing(true);
    try {
      const reference = "REF-DEP-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const userName = currentUserProfile?.artisticName || currentUserProfile?.displayName || currentUserProfile?.name || "Membre Gombo";
      const userPhoto = currentUserProfile?.avatarUrl || currentUserProfile?.photoURL || "";
      const nowIso = new Date().toISOString();

      // 1. Create transaction doc in `transactions` collection
      const txData = {
        userId: uid,
        userName: userName,
        userPhoto: userPhoto,
        amount: depositAmount,
        montant: depositAmount,
        type: "depot",
        status: "en_attente",
        statut: "en_attente",
        reference: reference,
        description: `Demande de dépôt Bêta de ${depositAmount.toLocaleString('fr-FR')} FCFA (${operator.toUpperCase()})`,
        operator: operator,
        phoneNumber: phoneNumber,
        createdAt: nowIso,
        timestamp: serverTimestamp(),
        conversationId: uid
      };

      const txRef = await addDoc(collection(db, "transactions"), txData);

      // 2. Create in `walletDepositRequests` and `walletRequests` collection
      const requestPayload = {
        id: txRef.id,
        uid: uid,
        userId: uid,
        userName: userName,
        userPhoto: userPhoto,
        montant: depositAmount,
        amount: depositAmount,
        type: "deposit",
        status: "waiting_support",
        statut: "en_attente",
        createdAt: nowIso,
        createdAtIso: nowIso,
        reference: reference,
        operator: operator,
        phoneNumber: phoneNumber,
        conversationId: uid
      };

      await setDoc(doc(db, "walletDepositRequests", txRef.id), requestPayload);
      await setDoc(doc(db, "walletRequests", txRef.id), requestPayload);

      // 3. Create real transaction in `betaTransactions` collection
      const betaTxPayload = {
        id: txRef.id,
        transactionId: txRef.id,
        userId: uid,
        uid: uid,
        userName: userName,
        userPhoto: userPhoto,
        amount: depositAmount,
        montant: depositAmount,
        status: "pending",
        statut: "en_attente",
        createdAt: nowIso,
        reference: reference,
        operator: operator,
        phoneNumber: phoneNumber,
        conversationId: uid,
        type: "deposit"
      };
      await setDoc(doc(db, "betaTransactions", txRef.id), betaTxPayload);

      // 4. Update/Sync Support Conversation Metadata
      try {
        const convoId = await SupportService.getOrCreateSupportConversation(uid, currentUserProfile);
        await setDoc(doc(db, "supportConversations", convoId), {
          transactionId: txRef.id,
          userId: uid,
          status: "pending",
          amount: depositAmount
        }, { merge: true });
      } catch (supportErr) {
        console.warn("Could not sync support conversation metadata:", supportErr);
      }

      // Send automated support message for deposit request
      try {
        const supportMessageText = `📢 NOUVELLE DEMANDE DE DÉPÔT\n\n• Montant : ${depositAmount.toLocaleString('fr-FR')} FCFA\n• Date : ${new Date().toLocaleDateString('fr-FR')}\n• Référence : ${reference}\n• Statut : En attente\n• Moyen : ${operator.toUpperCase()} (${phoneNumber})`;
        await SupportService.sendSystemSupportMessage(uid, currentUserProfile, supportMessageText, "Wallet");
      } catch (supportErr) {
        console.warn("Could not notify support of deposit:", supportErr);
      }

      setCreatedTxId(txRef.id);
      setCreatedDepositRef(reference);
      setStep("success");
      addToTerminal(`[BÊTA DÉPÔT] Demande ${reference} de ${depositAmount.toLocaleString('fr-FR')} FCFA créée avec succès. En attente de validation.`);
    } catch (err) {
      console.error("Deposit error", err);
      alert("Erreur lors de la création de la demande de dépôt. Veuillez réessayer.");
    } finally {
      setProcessing(false);
    }
  };

  const startSensitiveOperation = (
    type: "withdraw" | "transfer",
    amountVal: number,
    detailsText: string,
    recipientText: string,
    executeFn: () => Promise<void>
  ) => {
    const isPinActive = !!(walletPinSettings.pinEnabled && walletPinSettings.pinHash);
    const isConfirmActive = payments.paymentConfirmation;

    if (!isPinActive && !isConfirmActive) {
      executeFn();
      return;
    }

    // Set the active pending operation details
    setActivePendingOperation({
      type,
      amount: amountVal,
      recipient: recipientText,
      details: detailsText,
      execute: executeFn
    });

    setRecapConfirmed(false);

    // Reset PIN verification state
    setPinVerificationFlow({
      active: !isConfirmActive && isPinActive, // Go straight to PIN if no recap but PIN is active
      enteredPin: "",
      errorMsg: "",
      attempts: 0
    });
  };

  // MOBILE MONEY WITHDRAWAL HANDLER (UPDATED FOR BÊTA)
  const handleWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      alert("Veuillez saisir un montant valide.");
      return;
    }
    if (withdrawAmount > wallet.soldeDisponible) {
      alert("Solde disponible insuffisant.");
      return;
    }

    const executeFn = async () => {
      setProcessing(true);
      try {
        const reference = "REF-RET-" + Math.random().toString(36).substring(2, 8).toUpperCase();
        const userName = currentUserProfile?.artisticName || currentUserProfile?.displayName || currentUserProfile?.name || "Membre Gombo";
        const userPhoto = currentUserProfile?.avatarUrl || currentUserProfile?.photoURL || "";
        const nowIso = new Date().toISOString();

        // 1. Create transaction doc in `transactions` collection
        const txData = {
          userId: uid,
          userName: userName,
          userPhoto: userPhoto,
          amount: withdrawAmount,
          montant: withdrawAmount,
          type: "retrait",
          status: "en_attente",
          statut: "en_attente",
          reference: reference,
          description: `Demande de retrait de ${withdrawAmount.toLocaleString('fr-FR')} FCFA vers ${operator.toUpperCase()} (${phoneNumber})`,
          operator: operator,
          phoneNumber: phoneNumber,
          numero: phoneNumber,
          createdAt: nowIso,
          timestamp: serverTimestamp()
        };

        const txRef = await addDoc(collection(db, "transactions"), txData);

        // 2. Create in `walletWithdrawalRequests` and `walletRequests` collection
        const withdrawPayload = {
          id: txRef.id,
          userId: uid,
          uid: uid,
          userName: userName,
          userPhoto: userPhoto,
          operator: operator,
          numero: phoneNumber,
          phoneNumber: phoneNumber,
          amount: withdrawAmount,
          montant: withdrawAmount,
          type: "withdraw",
          reference: reference,
          status: "pending_review",
          statut: "en_attente",
          createdAt: serverTimestamp(),
          createdAtIso: nowIso
        };

        await setDoc(doc(db, "walletWithdrawalRequests", txRef.id), withdrawPayload);
        await setDoc(doc(db, "walletRequests", txRef.id), withdrawPayload);

        // Send automated support message for withdrawal request
        try {
          const supportMessageText = `💸 NOUVELLE DEMANDE DE RETRAIT\n\n• Montant : ${withdrawAmount.toLocaleString('fr-FR')} FCFA\n• Date : ${new Date().toLocaleDateString('fr-FR')}\n• Référence : ${reference}\n• Statut : En attente\n• Moyen : ${operator.toUpperCase()} (${phoneNumber})`;
          await SupportService.sendSystemSupportMessage(uid, currentUserProfile, supportMessageText, "Wallet");
        } catch (supportErr) {
          console.warn("Could not notify support of withdrawal:", supportErr);
        }

        setCreatedDepositRef(reference);
        setWithdrawSubmitted(true);
        addToTerminal(`[BÊTA RETRAIT] Demande ${reference} de ${withdrawAmount.toLocaleString('fr-FR')} FCFA transmise au Centre Fondateur.`);
      } catch (err) {
        console.error("Withdrawal error", err);
        alert("Erreur lors de la création de la demande de retrait.");
      } finally {
        setProcessing(false);
      }
    };

    // Intercept with PIN / Confirmation
    startSensitiveOperation(
      "withdraw",
      withdrawAmount,
      `Demande de retrait vers ${operator.toUpperCase()} (${phoneNumber})`,
      `${operator.toUpperCase()} (${phoneNumber})`,
      executeFn
    );
  };

  // P2P INSTANT TRANSFER / SCANNER HANDLER
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sendAmt = Number(scanAmount);
    if (!sendAmt || sendAmt <= 0 || sendAmt > wallet.soldeDisponible || !scanRecipient || processing) return;

    const executeFn = async () => {
      setProcessing(true);
      playSound("click");

      try {
        // 1. Debit sender's wallet in Firestore `users/{uid}`
        const newDisponible = wallet.soldeDisponible - sendAmt;
        await setDoc(doc(db, "users", uid), {
          wallet: {
            soldeDisponible: newDisponible,
            retraits: (wallet.retraits || 0) + sendAmt
          }
        }, { merge: true });

        // 2. Record transaction for sender
        await recordWalletTransaction({
          userId: uid,
          userName: currentUserProfile?.artisticName || currentUserProfile?.displayName || "Membre Gombo",
          type: "debit_publication",
          amount: sendAmt,
          status: "success",
          description: `Transfert P2P / QR à ${scanRecipient}`,
          userConcerned: scanRecipient
        });

        playSound("success");
        setScanSuccess(true);
        addToTerminal(`[WALLET] 💸 Transfert instantané de ${sendAmt.toLocaleString('fr-FR')} FCFA effectué vers ${scanRecipient}.`);
      } catch (err) {
        console.error("P2P transfer error", err);
      } finally {
        setProcessing(false);
      }
    };

    // Intercept with PIN / Confirmation
    startSensitiveOperation(
      "transfer",
      sendAmt,
      `Transfert instantané P2P à ${scanRecipient}`,
      scanRecipient,
      executeFn
    );
  };

  // PIN Key Press Handlers for Settings & Operations
  const handlePinKeyPress = (num: string) => {
    playSound("click");
    setPinFlow(prev => {
      if (prev.enteredPin.length >= prev.length) return prev;
      const nextPin = prev.enteredPin + num;
      const nextState = { ...prev, enteredPin: nextPin, errorMsg: "" };
      
      if (nextPin.length === prev.length) {
        setTimeout(() => handlePinSubmit(nextState), 200);
      }
      return nextState;
    });
  };

  const handlePinDelete = () => {
    playSound("click");
    setPinFlow(prev => ({
      ...prev,
      enteredPin: prev.enteredPin.slice(0, -1),
      errorMsg: ""
    }));
  };

  const handlePinSubmit = async (currentState: typeof pinFlow) => {
    const { mode, length, enteredPin, tempPin } = currentState;
    
    if (mode === "create_step1") {
      setPinFlow({
        mode: "create_step2",
        length,
        tempPin: enteredPin,
        enteredPin: "",
        errorMsg: ""
      });
      return;
    }
    
    if (mode === "create_step2") {
      if (enteredPin !== tempPin) {
        playSound("error");
        setPinFlow({
          mode: "create_step1",
          length,
          tempPin: "",
          enteredPin: "",
          errorMsg: "Les codes PIN ne correspondent pas. Recommencez."
        });
        return;
      }
      
      setProcessing(true);
      try {
        const hash = await hashPIN(enteredPin, uid);
        await setDoc(doc(db, "users", uid), {
          paymentSettings: {
            pinHash: hash,
            pinEnabled: true,
            pinLength: length
          }
        }, { merge: true });
        
        playSound("success");
        setWalletPinSettings({
          pinHash: hash,
          pinEnabled: true,
          pinLength: length
        });
        setPinFlow({ mode: "idle", length: 4, tempPin: "", enteredPin: "", errorMsg: "" });
        showToast("🔐 Votre code PIN Wallet a été créé et activé !");
      } catch (err) {
        console.error(err);
        setPinFlow(prev => ({ ...prev, enteredPin: "", errorMsg: "Erreur de stockage." }));
      } finally {
        setProcessing(false);
      }
      return;
    }
    
    if (mode === "modify_old") {
      const hashed = await hashPIN(enteredPin, uid);
      if (hashed !== walletPinSettings.pinHash) {
        playSound("error");
        setPinFlow(prev => ({
          ...prev,
          enteredPin: "",
          errorMsg: "Code PIN actuel incorrect."
        }));
        return;
      }
      
      setPinFlow({
        mode: "modify_new",
        length,
        tempPin: "",
        enteredPin: "",
        errorMsg: ""
      });
      return;
    }
    
    if (mode === "modify_new") {
      setPinFlow({
        mode: "modify_confirm",
        length,
        tempPin: enteredPin,
        enteredPin: "",
        errorMsg: ""
      });
      return;
    }
    
    if (mode === "modify_confirm") {
      if (enteredPin !== tempPin) {
        playSound("error");
        setPinFlow({
          mode: "modify_new",
          length,
          tempPin: "",
          enteredPin: "",
          errorMsg: "Les codes PIN ne correspondent pas. Recommencez."
        });
        return;
      }
      
      setProcessing(true);
      try {
        const hash = await hashPIN(enteredPin, uid);
        await setDoc(doc(db, "users", uid), {
          paymentSettings: {
            pinHash: hash,
            pinLength: length
          }
        }, { merge: true });
        
        playSound("success");
        setWalletPinSettings(prev => ({
          ...prev,
          pinHash: hash,
          pinLength: length
        }));
        setPinFlow({ mode: "idle", length: 4, tempPin: "", enteredPin: "", errorMsg: "" });
        showToast("🔐 Votre code PIN Wallet a été modifié avec succès !");
      } catch (err) {
        console.error(err);
        setPinFlow(prev => ({ ...prev, enteredPin: "", errorMsg: "Erreur de stockage." }));
      } finally {
        setProcessing(false);
      }
      return;
    }
    
    if (mode === "disable_verify") {
      const hashed = await hashPIN(enteredPin, uid);
      if (hashed !== walletPinSettings.pinHash) {
        playSound("error");
        setPinFlow(prev => ({
          ...prev,
          enteredPin: "",
          errorMsg: "Code PIN incorrect."
        }));
        return;
      }
      
      setProcessing(true);
      try {
        await setDoc(doc(db, "users", uid), {
          paymentSettings: {
            pinEnabled: false
          }
        }, { merge: true });
        
        playSound("success");
        setWalletPinSettings(prev => ({
          ...prev,
          pinEnabled: false
        }));
        setPinFlow({ mode: "idle", length: 4, tempPin: "", enteredPin: "", errorMsg: "" });
        showToast("🔓 Code PIN désactivé avec succès.");
      } catch (err) {
        console.error(err);
        setPinFlow(prev => ({ ...prev, enteredPin: "", errorMsg: "Erreur lors de la désactivation." }));
      } finally {
        setProcessing(false);
      }
      return;
    }

    if (mode === "enable_verify") {
      const hashed = await hashPIN(enteredPin, uid);
      if (hashed !== walletPinSettings.pinHash) {
        playSound("error");
        setPinFlow(prev => ({
          ...prev,
          enteredPin: "",
          errorMsg: "Code PIN incorrect."
        }));
        return;
      }
      
      setProcessing(true);
      try {
        await setDoc(doc(db, "users", uid), {
          paymentSettings: {
            pinEnabled: true
          }
        }, { merge: true });
        
        playSound("success");
        setWalletPinSettings(prev => ({
          ...prev,
          pinEnabled: true
        }));
        setPinFlow({ mode: "idle", length: 4, tempPin: "", enteredPin: "", errorMsg: "" });
        showToast("🔐 Code PIN réactivé avec succès.");
      } catch (err) {
        console.error(err);
        setPinFlow(prev => ({ ...prev, enteredPin: "", errorMsg: "Erreur lors de la réactivation." }));
      } finally {
        setProcessing(false);
      }
      return;
    }
  };

  const handleVerifyPinKeyPress = async (num: string) => {
    playSound("click");
    if (pinVerificationFlow.enteredPin.length >= walletPinSettings.pinLength) return;
    
    const nextPin = pinVerificationFlow.enteredPin + num;
    setPinVerificationFlow(prev => ({ ...prev, enteredPin: nextPin, errorMsg: "" }));

    if (nextPin.length === walletPinSettings.pinLength) {
      setProcessing(true);
      try {
        const hashed = await hashPIN(nextPin, uid);
        if (hashed === walletPinSettings.pinHash) {
          playSound("success");
          if (activePendingOperation) {
            await activePendingOperation.execute();
          }
          setActivePendingOperation(null);
          setPinVerificationFlow({ active: false, enteredPin: "", errorMsg: "", attempts: 0 });
        } else {
          playSound("error");
          const nextAttempts = pinVerificationFlow.attempts + 1;
          if (nextAttempts >= 3) {
            alert("🔒 Sécurité : 3 tentatives incorrectes. Opération annulée.");
            setActivePendingOperation(null);
            setPinVerificationFlow({ active: false, enteredPin: "", errorMsg: "", attempts: 0 });
          } else {
            setPinVerificationFlow({
              active: true,
              enteredPin: "",
              errorMsg: `Code PIN incorrect. (${3 - nextAttempts} tentatives restantes)`,
              attempts: nextAttempts
            });
          }
        }
      } catch (err) {
        console.error("Verification error", err);
        setPinVerificationFlow(prev => ({ ...prev, enteredPin: "", errorMsg: "Erreur de vérification" }));
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleVerifyPinDelete = () => {
    playSound("click");
    setPinVerificationFlow(prev => ({
      ...prev,
      enteredPin: prev.enteredPin.slice(0, -1),
      errorMsg: ""
    }));
  };

  const openDeposit = () => {
    setAmount("");
    setStep("form");
    setShowDepositModal(true);
    playSound("click");
  };

  const openWithdraw = () => {
    setAmount("");
    setWithdrawSubmitted(false);
    setShowWithdrawModal(true);
    playSound("click");
  };

  const openScanner = () => {
    setScanRecipient("");
    setScanAmount("");
    setScanSuccess(false);
    setShowScannerModal(true);
    playSound("click");
  };

  const scrollToHistory = () => {
    if (historyRef.current) {
      historyRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Filter ledger list
  const filteredTxs = transactions.filter(tx => {
    if (activeTab === "all") return true;
    if (activeTab === "flows") return tx.type === "deposit" || tx.type === "depot" || tx.type === "recharge_wallet" || tx.type === "withdrawal" || tx.type === "retrait" || tx.type === "withdraw";
    if (activeTab === "contracts") return tx.type === "deposit_escrow" || tx.type === "fonds_bloques" || tx.type === "release" || tx.type === "deblocage_cachet" || tx.type === "refund" || tx.type === "remboursement" || tx.type === "publication" || tx.type === "debit_publication";
    if (activeTab === "commissions") return tx.type === "commission_plateforme" || tx.type === "commission" || tx.type === "premium" || tx.type === "abonnement_premium" || tx.description?.toLowerCase().includes("commission");
    if (activeTab === "disputes") return tx.type === "remboursement" || tx.type === "refund" || tx.description?.toLowerCase().includes("litige");
    return true;
  });

  if (showWalletSettings) {
    return (
      <AndroidPageLayout
        header={
          <header className="flex-none bg-afri-bg/95 backdrop-blur-md border-b border-afri-border/60 px-3 py-2.5 flex items-center justify-between gap-2 z-35 shrink-0" style={{ paddingTop: 'max(10px, env(safe-area-inset-top))', paddingLeft: 'max(12px, env(safe-area-inset-left))', paddingRight: 'max(12px, env(safe-area-inset-right))' }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => {
                  playSound("click");
                  setShowWalletSettings(false);
                }}
                className="p-2 text-zinc-400 hover:text-afri-gold transition-colors shrink-0 flex items-center justify-center bg-afri-bg-sec border border-afri-border rounded-xl w-9 h-9 active:scale-95"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h1 className="text-sm sm:text-base font-black uppercase tracking-wider text-afri-text truncate font-display">
                Préférences du Wallet
              </h1>
            </div>
          </header>
        }
        scrollable={true}
        className="pb-safe bg-afri-bg"
      >
        <div className="max-w-xl mx-auto space-y-6 px-4 py-4 text-left animate-fadeIn">
          {/* Section 1: Security */}
          <div className="space-y-3">
            <h2 className="text-[10px] font-mono font-black tracking-widest text-zinc-500 uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-afri-gold"></span>
              🔐 SÉCURITÉ DU PORTEFEUILLE
            </h2>

            <div className="rounded-2xl bg-afri-bg-sec border border-afri-border p-4 space-y-4">
              {/* PIN Code Item */}
              <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-afri-bg border border-afri-border">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-afri-text block">PIN Wallet Sécurisé</span>
                    <p className="text-[9px] text-zinc-400">Exiger un code secret pour valider vos transferts et retraits d'argent.</p>
                  </div>
                  <div>
                    {walletPinSettings.pinHash ? (
                      walletPinSettings.pinEnabled ? (
                        <span className="px-2 py-0.5 text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono uppercase">
                          ACTIVÉ ({walletPinSettings.pinLength}D)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[8px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 rounded font-mono uppercase">
                          DÉSACTIVÉ
                        </span>
                      )
                    ) : (
                      <span className="px-2 py-0.5 text-[8px] font-bold bg-amber-500/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded font-mono uppercase">
                        NON CONFIGURÉ
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {!walletPinSettings.pinHash ? (
                    <button
                      type="button"
                      onClick={() => {
                        playSound("click");
                        setPinFlow({
                          mode: "create_step1",
                          length: 4,
                          tempPin: "",
                          enteredPin: "",
                          errorMsg: ""
                        });
                      }}
                      className="col-span-2 py-2.5 px-3 rounded-lg bg-gradient-to-r from-[#D4AF37] to-amber-600 hover:from-amber-500 hover:to-amber-600 text-black font-black text-[10px] uppercase transition-all shadow active:scale-98"
                    >
                      Créer un code PIN
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          playSound("click");
                          setPinFlow({
                            mode: "modify_old",
                            length: walletPinSettings.pinLength as 4 | 6,
                            tempPin: "",
                            enteredPin: "",
                            errorMsg: ""
                          });
                        }}
                        className="py-2.5 px-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-afri-text font-bold text-[10px] uppercase transition-all active:scale-98"
                      >
                        Modifier le PIN
                      </button>

                      {walletPinSettings.pinEnabled ? (
                        <button
                          type="button"
                          onClick={() => {
                            playSound("click");
                            setPinFlow({
                              mode: "disable_verify",
                              length: walletPinSettings.pinLength as 4 | 6,
                              tempPin: "",
                              enteredPin: "",
                              errorMsg: ""
                            });
                          }}
                          className="py-2.5 px-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15 font-bold text-[10px] uppercase transition-all active:scale-98"
                        >
                          Désactiver le PIN
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            playSound("click");
                            setPinFlow({
                              mode: "enable_verify",
                              length: walletPinSettings.pinLength as 4 | 6,
                              tempPin: "",
                              enteredPin: "",
                              errorMsg: ""
                            });
                          }}
                          className="py-2.5 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 font-bold text-[10px] uppercase transition-all active:scale-98"
                        >
                          Réactiver le PIN
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Biometrics Toggle */}
              <label className="flex items-center justify-between cursor-pointer group p-1.5">
                <div className="space-y-0.5 flex-1 pr-4">
                  <div className="flex items-center gap-1.5">
                    <Fingerprint className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">Authentification Biométrique</span>
                  </div>
                  <p className="text-[9px] text-zinc-400 leading-tight">Autoriser l'empreinte digitale pour déverrouiller et accélérer vos transactions.</p>
                </div>
                <input
                  type="checkbox"
                  checked={payments.biometricAuth}
                  onChange={(e) => updatePaymentPref('biometricAuth', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border shrink-0"></div>
              </label>
            </div>
          </div>

          {/* Section 2: Preferences */}
          <div className="space-y-3">
            <h2 className="text-[10px] font-mono font-black tracking-widest text-zinc-500 uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-afri-gold"></span>
              ⚙️ PRÉFÉRENCES DE PAIEMENT
            </h2>

            <div className="rounded-2xl bg-afri-bg-sec border border-afri-border p-4 space-y-4">
              {/* Preferred operator */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-zinc-400 uppercase block font-bold">Opérateur Mobile Money préféré</label>
                <select
                  value={payments.preferredMobileMoney}
                  onChange={(e) => updatePaymentPref('preferredMobileMoney', e.target.value)}
                  className="w-full bg-afri-bg border border-afri-border rounded-xl p-3 text-xs text-afri-text focus:outline-none focus:border-afri-gold font-sans"
                >
                  <option value="Orange Money">Orange Money Côte d'Ivoire 🍊</option>
                  <option value="Wave Côte d'Ivoire">Wave Mobile Money 🌊</option>
                  <option value="MTN MoMo">MTN Mobile Money 💛</option>
                  <option value="Moov Money">Moov Money Flooz 💙</option>
                </select>
              </div>

              {/* Currency */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-zinc-400 uppercase block font-bold">Devise d'affichage principale</label>
                <select
                  value={payments.currency}
                  onChange={(e) => updatePaymentPref('currency', e.target.value)}
                  className="w-full bg-afri-bg border border-afri-border rounded-xl p-3 text-xs text-afri-text focus:outline-none focus:border-afri-gold font-sans"
                >
                  <option value="FCFA (XOF)">FCFA (XOF) — Franc CFA Afrique de l'Ouest</option>
                  <option value="EUR (€)">EUR (€) — Euro</option>
                  <option value="USD ($)">USD ($) — US Dollar</option>
                </select>
              </div>

              {/* Daily Limit */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                  <span className="font-bold uppercase">Limite quotidienne de transaction</span>
                  <span className="text-afri-gold font-black">{payments.dailyLimit.toLocaleString()} FCFA</span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="2000000"
                  step="50000"
                  value={payments.dailyLimit}
                  onChange={(e) => updatePaymentPref('dailyLimit', parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-afri-bg rounded-lg appearance-none cursor-pointer accent-afri-gold"
                />
              </div>

              {/* Confirmation switch */}
              <label className="flex items-center justify-between cursor-pointer group pt-2 border-t border-afri-border/60">
                <div className="space-y-0.5 flex-1 pr-4">
                  <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">Confirmation obligatoire avant débit</span>
                  <p className="text-[9px] text-zinc-400 leading-tight">Afficher un récapitulatif détaillé pour validation avant chaque retrait ou transfert.</p>
                </div>
                <input
                  type="checkbox"
                  checked={payments.paymentConfirmation}
                  onChange={(e) => updatePaymentPref('paymentConfirmation', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border shrink-0"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Immersive PIN settings Flow modal overlay */}
        <AnimatePresence>
          {pinFlow.mode !== "idle" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 z-50 flex flex-col justify-center items-center px-6"
            >
              <div className="w-full max-w-sm space-y-8 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] animate-pulse">
                    <Shield className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black text-afri-text uppercase tracking-wider font-display">
                    {pinFlow.mode === "create_step1" && "Créer votre code PIN"}
                    {pinFlow.mode === "create_step2" && "Confirmer votre code PIN"}
                    {pinFlow.mode === "modify_old" && "Ancien Code PIN"}
                    {pinFlow.mode === "modify_new" && "Nouveau Code PIN"}
                    {pinFlow.mode === "modify_confirm" && "Confirmer le nouveau PIN"}
                    {pinFlow.mode === "disable_verify" && "Désactiver la protection PIN"}
                    {pinFlow.mode === "enable_verify" && "Confirmer votre PIN"}
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-xs">
                    {pinFlow.mode === "create_step1" && "Choisissez un code de sécurité confidentiel."}
                    {pinFlow.mode === "create_step2" && "Saisissez à nouveau le code PIN pour confirmer."}
                    {pinFlow.mode === "modify_old" && "Saisissez votre code PIN Wallet actuel."}
                    {pinFlow.mode === "modify_new" && "Choisissez un nouveau code confidentiel."}
                    {pinFlow.mode === "modify_confirm" && "Saisissez le nouveau code pour confirmer."}
                    {pinFlow.mode === "disable_verify" && "Confirmez votre code secret actuel pour désactiver."}
                    {pinFlow.mode === "enable_verify" && "Saisissez votre code secret actuel pour activer."}
                  </p>
                </div>

                {/* Length Choice Toggle - only shown on create step 1 */}
                {pinFlow.mode === "create_step1" && (
                  <div className="flex justify-center items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        playSound("click");
                        setPinFlow(p => ({ ...p, length: 4, enteredPin: "" }));
                      }}
                      className={`px-3 py-1.5 text-[9px] font-black uppercase font-mono tracking-wider rounded-lg border transition-all ${pinFlow.length === 4 ? "bg-[#D4AF37] text-black border-[#D4AF37]" : "bg-transparent text-zinc-400 border-zinc-800"}`}
                    >
                      4 chiffres
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playSound("click");
                        setPinFlow(p => ({ ...p, length: 6, enteredPin: "" }));
                      }}
                      className={`px-3 py-1.5 text-[9px] font-black uppercase font-mono tracking-wider rounded-lg border transition-all ${pinFlow.length === 6 ? "bg-[#D4AF37] text-black border-[#D4AF37]" : "bg-transparent text-zinc-400 border-zinc-800"}`}
                    >
                      6 chiffres
                    </button>
                  </div>
                )}

                {/* Password Bullet dots indicators */}
                <div className="flex justify-center items-center gap-4.5 py-4">
                  {Array.from({ length: pinFlow.length }).map((_, idx) => {
                    const isFilled = idx < pinFlow.enteredPin.length;
                    return (
                      <div
                        key={idx}
                        className={`w-4 h-4 rounded-full border-2 transition-all ${isFilled ? "bg-[#D4AF37] border-[#D4AF37] scale-110 shadow-[0_0_10px_rgba(212,175,55,0.4)]" : "bg-transparent border-zinc-700"}`}
                      />
                    );
                  })}
                </div>

                {/* Error message */}
                {pinFlow.errorMsg && (
                  <p className="text-xs font-bold text-red-400 font-sans animate-shake">
                    ⚠️ {pinFlow.errorMsg}
                  </p>
                )}

                {/* Virtual Keypad Pad */}
                <div className="grid grid-cols-3 gap-y-4 gap-x-8 max-w-xs mx-auto pt-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handlePinKeyPress(num.toString())}
                      className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xl font-bold font-mono text-afri-text flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      playSound("click");
                      setPinFlow({ mode: "idle", length: 4, tempPin: "", enteredPin: "", errorMsg: "" });
                    }}
                    className="w-16 h-16 rounded-full flex items-center justify-center text-[10px] font-black text-zinc-500 hover:text-zinc-400 cursor-pointer uppercase tracking-wider"
                  >
                    Fermer
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePinKeyPress("0")}
                    className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xl font-bold font-mono text-afri-text flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handlePinDelete}
                    className="w-16 h-16 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-300 active:scale-95 cursor-pointer text-lg"
                  >
                    ⌫
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </AndroidPageLayout>
    );
  }

  const customHeader = (
    <header className="flex-none bg-afri-bg/95 backdrop-blur-md border-b border-afri-border/60 px-3 py-2.5 flex items-center justify-between gap-2 z-35 shrink-0" style={{ paddingTop: 'max(10px, env(safe-area-inset-top))', paddingLeft: 'max(12px, env(safe-area-inset-left))', paddingRight: 'max(12px, env(safe-area-inset-right))' }}>
      <div className="flex items-center gap-2.5 min-w-0">
        {onBack && <button onClick={onBack} className="p-2 text-zinc-400 hover:text-afri-gold transition-colors shrink-0 flex items-center justify-center bg-afri-bg-sec border border-afri-border rounded-xl w-9 h-9 active:scale-95"><ChevronRight className="w-5 h-5 rotate-180" /></button>}
        <h1 className="text-sm sm:text-base font-black uppercase tracking-wider text-afri-text truncate font-display">
          Mon Wallet Souverain
        </h1>
      </div>
      <button 
        id="btn-wallet-settings-toggle"
        onClick={() => {
          playSound("click");
          setShowWalletSettings(true);
        }}
        className="p-2 text-zinc-400 hover:text-afri-gold transition-colors shrink-0 flex items-center justify-center bg-afri-bg-sec border border-afri-border rounded-xl w-9 h-9 active:scale-95"
      >
        <Settings className="w-4 h-4" />
      </button>
    </header>
  );

  if (isModuleUnderMaintenance("wallet")) {
    return (
      <AndroidPageLayout header={customHeader} scrollable={true} className="pb-safe">
        <ModuleMaintenanceNotice
          moduleName="Wallet & Finances"
          message={maintenance.globalMessage}
          onBack={onBack}
        />
      </AndroidPageLayout>
    );
  }

  return (
    <AndroidPageLayout header={customHeader} scrollable={false} className="pb-safe">
      <div className="w-full space-y-4 text-left animate-fadeIn">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. 💰 SOLDE DISPONIBLE (EN TRÈS GRAND)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <AndroidCard className="w-full relative overflow-hidden shadow-2xl group border-[#D4AF37]/30 p-4 rounded-[18px]">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/5 rounded-full blur-[90px] -mr-24 -mt-24 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-[0.2em] font-black flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                💰 Solde disponible
              </span>
              <BetaEscrowInfoButton variant="badge" />
            </div>

            <div className="flex items-baseline gap-1.5 flex-wrap">
              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black text-afri-text font-mono tracking-tight text-shadow-sm break-all">
                {wallet.soldeDisponible.toLocaleString('fr-FR')}
              </h1>
              <span className="text-base xs:text-lg sm:text-xl md:text-2xl font-black text-[#D4AF37] font-mono uppercase">
                FCFA
              </span>
            </div>

            <div className="pt-1 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-afri-bg/60 border border-afri-border text-[10px] font-mono text-amber-400 font-bold">
                <Lock className="w-3 h-3 text-[#D4AF37]" />
                Séquestre : {wallet.soldeBloque.toLocaleString('fr-FR')} FCFA
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-afri-bg/60 border border-afri-border text-[10px] font-mono text-emerald-400 font-bold">
                <TrendingUp className="w-3 h-3" />
                Gains : +{wallet.revenus?.toLocaleString('fr-FR') || 0} FCFA
              </span>
            </div>
          </div>

          {/* Quick Level Badge */}
          <div className="sm:text-right flex flex-col sm:items-end justify-center border-t sm:border-t-0 sm:border-l border-afri-border/60 pt-3 sm:pt-0 sm:pl-5 space-y-1 shrink-0">
            <span className="text-[9px] font-mono text-afri-text-muted uppercase tracking-widest font-black">NIVEAU COMPTE</span>
            <span className="px-3 py-1 bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/35 rounded-xl text-xs font-black uppercase font-mono tracking-wider inline-block">
              👑 {wallet.niveauWallet || "SOUVERAIN"}
            </span>
          </div>
        </div>
      </AndroidCard>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. ACTIONS RAPIDES (RECHARGER / RETIRER / HISTORIQUE / SCANNER)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="w-full space-y-1.5">
        <span className="text-[10px] font-mono text-afri-text-muted uppercase tracking-widest font-black px-1 block">
          ⚡ Actions Rapides
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          {/* • Recharger */}
          <button
            id="btn-wallet-recharger"
            onClick={openDeposit}
            className="w-full p-4 min-h-[100px] bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37]/60 rounded-[18px] flex flex-col items-center justify-center text-center gap-2 hover:bg-[#D4AF37]/10 transition-all group cursor-pointer shadow-md active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-black font-sans text-afri-text uppercase block">Recharger</span>
              <span className="text-[8.5px] font-mono text-emerald-400 uppercase tracking-wider block font-bold">Dépôt Mobile</span>
            </div>
          </button>

          {/* • Retirer */}
          <button
            id="btn-wallet-retirer"
            onClick={openWithdraw}
            disabled={wallet.soldeDisponible <= 0}
            className="w-full p-4 min-h-[100px] bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37]/60 rounded-[18px] flex flex-col items-center justify-center text-center gap-2 hover:bg-amber-500/10 transition-all group cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-black font-sans text-afri-text uppercase block">Retirer</span>
              <span className="text-[8.5px] font-mono text-amber-400 uppercase tracking-wider block font-bold">Vers Mobile</span>
            </div>
          </button>

          {/* • Historique */}
          <button
            id="btn-wallet-historique"
            onClick={scrollToHistory}
            className="w-full p-4 min-h-[100px] bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37]/60 rounded-[18px] flex flex-col items-center justify-center text-center gap-2 hover:bg-sky-500/10 transition-all group cursor-pointer shadow-md active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
              <History className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-black font-sans text-afri-text uppercase block">Historique</span>
              <span className="text-[8.5px] font-mono text-sky-400 uppercase tracking-wider block font-bold">Journaux</span>
            </div>
          </button>

          {/* • Scanner */}
          <button
            id="btn-wallet-scanner"
            onClick={openScanner}
            className="w-full p-4 min-h-[100px] bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37]/60 rounded-[18px] flex flex-col items-center justify-center text-center gap-2 hover:bg-purple-500/10 transition-all group cursor-pointer shadow-md active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <QrCode className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-black font-sans text-afri-text uppercase block">Scanner</span>
              <span className="text-[8.5px] font-mono text-purple-400 uppercase tracking-wider block font-bold">Paiement QR</span>
            </div>
          </button>

        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. RÉSUMÉ (ARGENT REÇU / DÉPENSÉ / COMMISSIONS / SOLDE)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="w-full space-y-1.5">
        <span className="text-[10px] font-mono text-afri-text-muted uppercase tracking-widest font-black px-1 block">
          📊 Résumé Financier
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          {/* • Argent reçu */}
          <div className="w-full bg-afri-bg border border-afri-border rounded-[18px] p-4 space-y-1 flex flex-col justify-center min-h-[72px]">
            <span className="text-[9px] font-mono text-afri-text-sec block uppercase tracking-wider">
              📥 Argent reçu
            </span>
            <span className="text-sm xs:text-base font-black text-emerald-400 font-mono block truncate">
              +{wallet.revenus?.toLocaleString('fr-FR') || 0} <span className="text-[9px]">FCFA</span>
            </span>
          </div>

          {/* • Argent dépensé */}
          <div className="w-full bg-afri-bg border border-afri-border rounded-[18px] p-4 space-y-1 flex flex-col justify-center min-h-[72px]">
            <span className="text-[9px] font-mono text-afri-text-sec block uppercase tracking-wider">
              📤 Argent dépensé
            </span>
            <span className="text-sm xs:text-base font-black text-rose-400 font-mono block truncate">
              -{(wallet.retraits || wallet.depots || 0).toLocaleString('fr-FR')} <span className="text-[9px]">FCFA</span>
            </span>
          </div>

          {/* • Commissions */}
          <div className="w-full bg-afri-bg border border-afri-border rounded-[18px] p-4 space-y-1 flex flex-col justify-center min-h-[72px]">
            <span className="text-[9px] font-mono text-afri-text-sec block uppercase tracking-wider">
              🛡️ Commissions
            </span>
            <span className="text-sm xs:text-base font-black text-amber-400 font-mono block truncate">
              {(wallet.economiesPremium || 0).toLocaleString('fr-FR')} <span className="text-[9px]">FCFA</span>
            </span>
          </div>

          {/* • Solde disponible */}
          <div className="w-full bg-afri-bg border border-[#D4AF37]/30 rounded-[18px] p-4 space-y-1 bg-[#D4AF37]/5 flex flex-col justify-center min-h-[72px]">
            <span className="text-[9px] font-mono text-[#D4AF37] block uppercase tracking-wider font-bold">
              💰 Solde disponible
            </span>
            <span className="text-sm xs:text-base font-black text-afri-text font-mono block truncate">
              {wallet.soldeDisponible.toLocaleString('fr-FR')} <span className="text-[9px]">FCFA</span>
            </span>
          </div>

        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4. HISTORIQUE (LISTE CHRONOLOGIQUE)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div ref={historyRef} className="w-full bg-afri-bg-sec border border-afri-border rounded-[18px] p-4 space-y-4">
        
        {/* Header & Filter tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-afri-border/80 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-sm font-black font-sans text-afri-text uppercase tracking-wide">
              HISTORIQUE DES TRANSACTIONS
            </h3>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "Tout" },
              { id: "flows", label: "Flux" },
              { id: "contracts", label: "Séquestre" },
              { id: "commissions", label: "Commissions" },
              { id: "disputes", label: "Litiges" }
            ].map(tab => (
              <button
                key={tab.id}
                id={`btn-history-tab-${tab.id}`}
                onClick={() => { setActiveTab(tab.id as any); playSound("click"); }}
                className="py-1.5 px-3 min-h-[36px] rounded-full text-[10px] font-mono font-black uppercase transition-all cursor-pointer bg-afri-bg text-afri-text-sec hover:text-afri-text border border-afri-border flex items-center justify-center whitespace-nowrap"
                style={activeTab === tab.id ? { backgroundColor: '#D4AF37', color: "var(--afri-text)", fontWeight: '900' } : undefined}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List of chronological transactions (Single line compact Android layout) */}
        {filteredTxs.length === 0 ? (
          <div className="text-center py-8 text-afri-text-muted font-mono text-xs">
            📭 Aucune transaction enregistrée dans cet historique.
          </div>
        ) : (
          <div className="space-y-1">
            {(showAllHistory ? filteredTxs : filteredTxs.slice(0, 6)).map((tx) => {
              const txTypeClean = (tx.type || "").toLowerCase();
              const isFlowIn = 
                txTypeClean === "deposit" || 
                txTypeClean === "depot" || 
                txTypeClean === "recharge_wallet" || 
                txTypeClean === "recharge" ||
                txTypeClean === "release" || 
                txTypeClean === "deblocage_cachet" || 
                txTypeClean === "refund" || 
                txTypeClean === "remboursement" || 
                txTypeClean === "prime_bonus" ||
                txTypeClean === "bonus" ||
                txTypeClean === "reward" ||
                txTypeClean === "recompense" ||
                txTypeClean === "credit" ||
                txTypeClean === "transfer_received" ||
                txTypeClean === "transfert_recu" ||
                txTypeClean === "gain" ||
                txTypeClean === "revenu";

              const typeLabel = 
                txTypeClean === "depot" || txTypeClean === "deposit" || txTypeClean === "recharge_wallet" ? "Dépôt Mobile Money" :
                txTypeClean === "withdrawal" || txTypeClean === "retrait" || txTypeClean === "withdraw" ? "Retrait Mobile Money" :
                txTypeClean === "debit_publication" ? "Paiement Annonce" :
                txTypeClean === "commission_plateforme" || txTypeClean === "commission" ? "Commission Plateforme" :
                txTypeClean === "fonds_bloques" || txTypeClean === "deposit_escrow" ? "Séquestre Gombo" :
                txTypeClean === "deblocage_cachet" || txTypeClean === "release" ? "Déblocage Cachet" :
                txTypeClean === "remboursement" || txTypeClean === "refund" ? "Remboursement" :
                txTypeClean === "prime_bonus" ? "Prime" :
                txTypeClean === "abonnement_premium" ? "Abonnement Premium" :
                tx.description || "Opération financière";

              const formattedDate = tx.date || (tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) : "Aujourd'hui");
              const formattedHeure = tx.heure || (tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "Récemment");
              const txAmount = Math.abs(Number(tx.amount || tx.montant || 0));

              const isValidated = tx.status === "validated" || tx.status === "PAID" || tx.status === "success" || tx.statut === "success" || tx.status === "valide" || tx.status === "fonds_liberes";
              const isRefused = tx.status === "refused" || tx.status === "refuse" || tx.status === "REFUSED";

              return (
                <div 
                  key={tx.id || tx.reference} 
                  onClick={() => { setSelectedTxDetails(tx); playSound("click"); }}
                  className="py-2.5 px-2 flex items-center justify-between gap-3 text-left hover:bg-afri-bg/50 active:bg-afri-bg/80 rounded-xl transition-all cursor-pointer border-b border-afri-border/40 last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 ${
                      isFlowIn ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" :
                      txTypeClean === "withdrawal" || txTypeClean === "retrait" || txTypeClean === "withdraw" ? "bg-amber-500/15 border-amber-500/30 text-amber-400" :
                      "bg-rose-500/15 border-rose-500/30 text-rose-400"
                    }`}>
                      {isFlowIn ? <ArrowUpRight className="w-4 h-4 stroke-[2.5]" /> : <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-xs font-bold text-afri-text truncate">
                        {typeLabel}
                      </p>
                      <p className="text-[10px] font-mono text-afri-text-muted">
                        {formattedDate} • {formattedHeure}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-0.5">
                    <span className={`text-xs font-mono font-black block ${isFlowIn ? "text-emerald-400" : "text-amber-400"}`}>
                      {isFlowIn ? "+" : "-"}{txAmount.toLocaleString('fr-FR')} FCFA
                    </span>
                    <span className={`inline-block text-[8px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      isValidated ? "bg-emerald-500/10 text-emerald-400" :
                      isRefused ? "bg-rose-500/10 text-rose-400" :
                      "bg-amber-500/10 text-amber-400"
                    }`}>
                      {isValidated ? "VALIDÉ" : isRefused ? "REFUSÉ" : "EN ATTENTE"}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredTxs.length > 6 && (
              <button
                id="btn-wallet-history-toggle"
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="w-full py-2.5 mt-2 text-center text-xs font-black uppercase font-mono text-[#D4AF37] bg-afri-bg border border-afri-border hover:border-[#D4AF37]/50 rounded-xl transition-all cursor-pointer"
              >
                {showAllHistory ? "Voir moins" : `Voir tout (${filteredTxs.length} transactions)`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* DETAIL TRANSACTION BOTTOM SHEET */}
      <AndroidBottomSheet
        isOpen={!!selectedTxDetails}
        onClose={() => setSelectedTxDetails(null)}
        title="Détails de la transaction"
      >
        {selectedTxDetails && (
          <div className="space-y-4">
            <div className="text-center py-2 space-y-1">
              <p className="text-2xl font-black font-mono text-[#D4AF37]">
                {selectedTxDetails.amount || selectedTxDetails.montant ? `${Math.abs(Number(selectedTxDetails.amount || selectedTxDetails.montant)).toLocaleString('fr-FR')} FCFA` : "0 FCFA"}
              </p>
              <p className="text-xs font-bold text-afri-text">{selectedTxDetails.description || "Opération financière"}</p>
            </div>

            <div className="bg-afri-bg-sec/60 border border-afri-border rounded-2xl p-4 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-afri-text-muted">Référence :</span>
                <span className="font-bold text-afri-text select-all">{selectedTxDetails.reference || selectedTxDetails.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-afri-text-muted">Date & Heure :</span>
                <span className="font-bold text-afri-text">{selectedTxDetails.date || selectedTxDetails.createdAt ? new Date(selectedTxDetails.createdAt || Date.now()).toLocaleString("fr-FR") : "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-afri-text-muted">Statut :</span>
                <span className="font-bold text-[#D4AF37] uppercase">{selectedTxDetails.status || selectedTxDetails.statut || "N/A"}</span>
              </div>
              {selectedTxDetails.userConcerned && (
                <div className="flex justify-between">
                  <span className="text-afri-text-muted">Partie concernée :</span>
                  <span className="font-bold text-afri-text">{selectedTxDetails.userConcerned}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                const ref = selectedTxDetails.reference || selectedTxDetails.id;
                setSelectedTxDetails(null);
                supportConfig.openSupport(`Assistance pour la transaction #${ref}`);
              }}
              className="w-full py-3.5 bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37] text-afri-text font-black text-xs uppercase font-mono rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
              <span>Besoin d'aide sur cette transaction</span>
            </button>
          </div>
        )}
      </AndroidBottomSheet>
      
      {/* MODAL 1: RECHARGER / DÉPÔT MOBILE MONEY (MOBILE BOTTOM SHEET) */}
      <AndroidBottomSheet
        isOpen={showDepositModal}
        onClose={() => { setShowDepositModal(false); playSound("click"); }}
        title="RECHARGER LE WALLET"
        subtitle="Dépôt Mobile Money direct via Wave, Orange, MTN, Moov"
      >
        {step === "form" && (
          <form onSubmit={(e) => { e.preventDefault(); handleDepositRequest(); }} className="space-y-5">
            <div className="text-center space-y-1.5 pt-2">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mx-auto">
                <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
              </div>
            </div>

            {/* Operator Choice */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest block font-bold">
                Opérateur Mobile Money
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "wave", name: "Wave", color: "border-blue-500 text-blue-400" },
                  { id: "orange", name: "Orange", color: "border-orange-500 text-orange-400" },
                  { id: "mtn", name: "MTN", color: "border-yellow-500 text-yellow-500" },
                  { id: "moov", name: "Moov", color: "border-emerald-500 text-emerald-400" }
                ].map(op => (
                  <button
                    key={op.id}
                    id={`btn-deposit-op-${op.id}`}
                    type="button"
                    onClick={() => { setOperator(op.id as any); playSound("click"); }}
                    className={`py-3 min-h-[48px] text-xs font-black uppercase rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center ${
                      operator === op.id 
                        ? `${op.color} bg-afri-bg font-black scale-102` 
                        : "border-afri-border text-afri-text-muted hover:border-afri-text-sec"
                    }`}
                  >
                    {op.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest block font-bold">
                  Numéro Mobile Money (+225)
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-4 w-4 h-4 text-afri-text-muted" />
                  <input 
                    id="input-deposit-phone"
                    type="tel" 
                    required
                    value={phoneNumber} 
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="0707070707" 
                    className="w-full bg-afri-bg border border-afri-border rounded-xl pl-11 pr-4 py-3.5 text-afri-text font-mono text-sm focus:outline-none focus:border-afri-gold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest font-bold">
                    Montant du rechargement (FCFA)
                  </label>
                  <span className="text-[9px] font-mono text-[#D4AF37] font-bold">Min: 1 000 FCFA</span>
                </div>
                <div className="relative">
                  <Coins className="absolute left-4 top-4 w-4 h-4 text-afri-text-muted" />
                  <input 
                    id="input-deposit-amount"
                    type="number" 
                    required
                    min="1000"
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ex: 25000" 
                    className="w-full bg-afri-bg border border-afri-border rounded-xl pl-11 pr-4 py-3.5 text-afri-text font-mono text-sm focus:outline-none focus:border-afri-gold"
                  />
                </div>
              </div>
            </div>

            <button
              id="btn-deposit-submit"
              type="submit"
              disabled={processing || !amount || !phoneNumber}
              className="w-full py-4 min-h-[52px] bg-[#D4AF37] hover:bg-[#b8982e] text-black font-black uppercase font-mono text-xs tracking-widest rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-lg active:scale-98 flex items-center justify-center"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Générer l'ordre de rechargement"}
            </button>
          </form>
        )}

        {step === "success" && (
          <div className="space-y-5 text-center py-2">
            <div className="w-14 h-14 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mx-auto shadow-lg">
              <ShieldCheck className="w-8 h-8" />
            </div>
            
            <div className="space-y-1.5">
              <span className="inline-block text-[10px] font-mono font-black text-[#D4AF37] uppercase tracking-widest bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/30">
                RECHARGEMENT ENREGISTRÉ
              </span>
              <h3 className="text-base font-black text-afri-text uppercase tracking-wider font-sans">
                ORDRE TRANSMIS AU GUICHET
              </h3>
              <p className="text-[#D4AF37] font-mono text-xl font-black">
                +{Number(amount).toLocaleString('fr-FR')} FCFA
              </p>
              <p className="text-afri-text-sec text-xs max-w-sm mx-auto font-mono">
                Numéro : {phoneNumber} ({operator.toUpperCase()})
              </p>
            </div>

            <div className="bg-afri-bg border border-afri-border rounded-2xl p-4 space-y-2 text-left text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-afri-text-sec">Numéro de Référence :</span>
                <strong className="text-[#D4AF37]">{createdDepositRef}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-afri-text-sec">Montant du Dépôt :</span>
                <strong className="text-emerald-400">+{Number(amount).toLocaleString('fr-FR')} FCFA</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-afri-text-sec">Statut du Dépôt :</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[10px]">
                  🟡 En attente de validation
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDepositModal(false);
                  const prefilledText = `Bonjour.\nJe souhaite effectuer un dépôt de :\n${Number(amount).toLocaleString('fr-FR')} FCFA.\nMerci de m'indiquer la procédure.\nTransaction :\n#${createdTxId || "id_attente"}`;
                  supportConfig.openSupport(prefilledText);
                }}
                className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#b8982e] text-black font-black text-xs uppercase font-mono tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Contacter le Service Client (Arbre à Palabres)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  supportConfig.openSupport(`Bonjour 👋\n\nMa demande de rechargement Wallet de ${Number(amount).toLocaleString('fr-FR')} FCFA via ${operator.toUpperCase()} (${phoneNumber}) est enregistrée (Réf: ${createdDepositRef}). Je souhaite transmettre ma preuve.`);
                }}
                className="w-full py-2.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] font-bold text-xs uppercase font-mono rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <span>Valider via WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => { setShowDepositModal(false); playSound("click"); }}
                className="w-full py-2 bg-afri-bg hover:bg-afri-bg-sec border border-afri-border text-afri-text-sec text-[10px] font-mono uppercase rounded-xl transition-colors cursor-pointer"
              >
                Fermer la fenêtre
              </button>
            </div>
          </div>
        )}
      </AndroidBottomSheet>

      {/* MODAL 2: RETIRER / RETRAIT MOBILE MONEY (MOBILE BOTTOM SHEET) */}
      <AndroidBottomSheet
        isOpen={showWithdrawModal}
        onClose={() => { setShowWithdrawModal(false); playSound("click"); }}
        title="RETIRER VOS FONDS"
        subtitle="Transfert direct de votre solde vers Mobile Money"
      >
        {withdrawSubmitted ? (
          <div className="space-y-5 text-center py-2">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <span className="inline-block text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                VOTRE DEMANDE DE RETRAIT A ÉTÉ ENVOYÉE
              </span>
              <h3 className="text-base font-black text-afri-text uppercase tracking-wider font-sans">
                RETRAIT EN COURS DE TRAITEMENT
              </h3>
              <p className="text-emerald-400 font-mono text-xl font-black">
                -{Number(amount).toLocaleString('fr-FR')} FCFA
              </p>
              <p className="text-afri-text-sec text-xs max-w-sm mx-auto font-mono">
                Destination : {phoneNumber} ({operator.toUpperCase()})
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                id="btn-withdraw-success-close"
                type="button"
                onClick={() => { setShowWithdrawModal(false); playSound("click"); }}
                className="w-full py-3.5 min-h-[48px] bg-afri-bg hover:bg-afri-bg-sec border border-afri-border text-afri-text font-bold uppercase font-mono text-xs tracking-widest rounded-xl transition-colors cursor-pointer flex items-center justify-center"
              >
                Fermer le guichet
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleWithdrawRequest(e); }} className="space-y-5">
            <div className="text-center space-y-1.5 pt-2">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                <ArrowDownLeft className="w-6 h-6 stroke-[2.5]" />
              </div>
            </div>

            {/* Operator Choice */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest block font-bold">
                Opérateur de destination
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "wave", name: "Wave", color: "border-blue-500 text-blue-400" },
                  { id: "orange", name: "Orange", color: "border-orange-500 text-orange-400" },
                  { id: "mtn", name: "MTN", color: "border-yellow-500 text-yellow-500" },
                  { id: "moov", name: "Moov", color: "border-emerald-500 text-emerald-400" }
                ].map(op => (
                  <button
                    key={op.id}
                    id={`btn-withdraw-op-${op.id}`}
                    type="button"
                    onClick={() => { setOperator(op.id as any); playSound("click"); }}
                    className={`py-3 min-h-[48px] text-xs font-black uppercase rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center ${
                      operator === op.id 
                        ? `${op.color} bg-afri-bg font-black scale-102` 
                        : "border-afri-border text-afri-text-muted hover:border-afri-text-sec"
                    }`}
                  >
                    {op.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest font-bold">
                    Montant à retirer (FCFA)
                  </label>
                  <span className="text-[9px] font-mono text-amber-400 font-bold">
                    Max : {wallet.soldeDisponible.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="relative">
                  <Coins className="absolute left-4 top-4 w-4 h-4 text-afri-text-muted" />
                  <input 
                    id="input-withdraw-amount"
                    type="number" 
                    required
                    min="500"
                    max={wallet.soldeDisponible}
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ex: 25000" 
                    className="w-full bg-afri-bg border border-afri-border rounded-xl pl-11 pr-4 py-3.5 text-afri-text font-mono text-sm focus:outline-none focus:border-afri-gold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest block font-bold">
                  Numéro Mobile Money du bénéficiaire (+225)
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-4 w-4 h-4 text-afri-text-muted" />
                  <input 
                    id="input-withdraw-phone"
                    type="tel" 
                    required
                    value={phoneNumber} 
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="0707070707" 
                    className="w-full bg-afri-bg border border-afri-border rounded-xl pl-11 pr-4 py-3.5 text-afri-text font-mono text-sm focus:outline-none focus:border-afri-gold"
                  />
                </div>
              </div>
            </div>

            <button
              id="btn-withdraw-submit"
              type="submit"
              disabled={processing || !amount || Number(amount) > wallet.soldeDisponible || !phoneNumber}
              className="w-full py-4 min-h-[52px] bg-amber-500 hover:bg-amber-600 text-black font-black uppercase font-mono text-xs tracking-widest rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-lg active:scale-98 flex items-center justify-center"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Soumettre la demande de retrait"}
            </button>
          </form>
        )}
      </AndroidBottomSheet>

      {/* MODAL 3: SCANNER / P2P TRANSFER (ANDROID BOTTOM SHEET) */}
      <AndroidBottomSheet
        isOpen={showScannerModal}
        onClose={() => { setShowScannerModal(false); playSound("click"); }}
        title="SCANNER & TRANSFERT P2P"
        subtitle="Scannez un QR Code ou saisissez le Gombo ID du destinataire"
      >
        {scanSuccess ? (
          <div className="space-y-4 text-center py-2">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-afri-text uppercase">Transfert Instantané Réussi</h4>
              <p className="text-emerald-400 font-mono text-lg font-black">
                {Number(scanAmount).toLocaleString('fr-FR')} FCFA
              </p>
              <p className="text-afri-text-sec text-xs font-mono">Destinataire : {scanRecipient}</p>
            </div>
            <button
              id="btn-scanner-success-close"
              onClick={() => { setShowScannerModal(false); playSound("click"); }}
              className="w-full py-3.5 min-h-[48px] bg-afri-bg hover:bg-afri-bg-sec border border-afri-border text-afri-text font-bold uppercase font-mono text-xs tracking-widest rounded-xl transition-colors cursor-pointer flex items-center justify-center"
            >
              Terminer
            </button>
          </div>
        ) : (
          <form onSubmit={handleTransferSubmit} className="space-y-4">
            {/* Visual QR Code Scanner Simulation */}
            <div className="bg-afri-bg border border-afri-border rounded-2xl p-4 text-center space-y-2 relative overflow-hidden group">
              <div className="w-28 h-28 border-2 border-dashed border-purple-500/50 rounded-xl mx-auto flex items-center justify-center text-purple-400 bg-purple-500/5 relative">
                <Scan className="w-10 h-10 animate-pulse" />
                <div className="absolute inset-0 bg-purple-500/10 animate-ping rounded-xl opacity-20"></div>
              </div>
              <span className="text-[10px] font-mono text-purple-400 block font-bold">
                Caméra active — Pointez vers un Pass QR
              </span>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest block font-bold">
                  Destinataire (Gombo ID / Téléphone / Email)
                </label>
                <input 
                  id="input-transfer-recipient"
                  type="text" 
                  required
                  value={scanRecipient} 
                  onChange={(e) => setScanRecipient(e.target.value)}
                  placeholder="Ex: GOMBO-7782 ou 0707070707" 
                  className="w-full bg-afri-bg border border-afri-border rounded-xl px-4 py-3.5 text-afri-text font-mono text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest font-bold">
                    Montant à transférer (FCFA)
                  </label>
                  <span className="text-[9px] font-mono text-purple-400 font-bold">
                    Solde : {wallet.soldeDisponible.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <input 
                  id="input-transfer-amount"
                  type="number" 
                  required
                  min="100"
                  max={wallet.soldeDisponible}
                  value={scanAmount} 
                  onChange={(e) => setScanAmount(e.target.value)}
                  placeholder="Ex: 5000" 
                  className="w-full bg-afri-bg border border-afri-border rounded-xl px-4 py-3.5 text-afri-text font-mono text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <button
              id="btn-transfer-submit"
              type="submit"
              disabled={processing || !scanRecipient || !scanAmount || Number(scanAmount) > wallet.soldeDisponible}
              className="w-full py-4 min-h-[52px] bg-purple-600 hover:bg-purple-700 text-afri-text font-black uppercase font-mono text-xs tracking-widest rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-lg active:scale-98 flex items-center justify-center gap-2"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <>
                <Send className="w-4 h-4" />
                <span>Confirmer le transfert instantané</span>
              </>}
            </button>
          </form>
        )}
      </AndroidBottomSheet>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SENSITIVE TRANSACTION INTERCEPTION OVERLAY
          (RECAPITULATIF & VERIFICATION DU PIN)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <AnimatePresence>
        {activePendingOperation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex flex-col justify-center items-center px-6"
          >
            {/* Phase 1: Confirmation obligatoire (Recapitulatif) */}
            {payments.paymentConfirmation && !recapConfirmed ? (
              <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800/80 rounded-[24px] p-6 space-y-6 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-[60px] pointer-events-none"></div>
                
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#D4AF37] mx-auto">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-afri-text uppercase tracking-wider font-display">
                    Confirmer l'opération
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Veuillez vérifier les informations financières ci-dessous avant de procéder au débit.
                  </p>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-left space-y-3 font-sans">
                  <div className="flex justify-between items-baseline py-1 border-b border-zinc-800/60 font-mono">
                    <span className="text-[10px] text-zinc-400 uppercase">Montant</span>
                    <span className="text-lg font-black text-afri-gold">{activePendingOperation.amount.toLocaleString()} FCFA</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">Type</span>
                    <span className="text-[11px] font-bold text-afri-text">
                      {activePendingOperation.type === "withdraw" ? "Retrait Mobile Money" : "Transfert P2P / QR"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">Bénéficiaire</span>
                    <span className="text-[11px] font-bold text-afri-text truncate max-w-[180px]">{activePendingOperation.recipient || "N/A"}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">Frais Réseau</span>
                    <span className="text-[11px] font-black text-emerald-400 font-mono">GRATUIT (0 FCFA)</span>
                  </div>

                  <div className="flex justify-between items-baseline pt-2">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Total Débit</span>
                    <span className="text-base font-black text-afri-text font-mono">{activePendingOperation.amount.toLocaleString()} FCFA</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      playSound("click");
                      setActivePendingOperation(null);
                    }}
                    className="py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-300 font-bold text-xs uppercase tracking-wider transition-all active:scale-98 cursor-pointer"
                  >
                    Annuler
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSound("click");
                      if (walletPinSettings.pinEnabled && walletPinSettings.pinHash) {
                        setRecapConfirmed(true);
                        setPinVerificationFlow(prev => ({ ...prev, active: true }));
                      } else {
                        // PIN is disabled, directly execute the action!
                        playSound("success");
                        activePendingOperation.execute();
                        setActivePendingOperation(null);
                      }
                    }}
                    className="py-3 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-600 hover:from-amber-500 hover:to-amber-600 text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-98 cursor-pointer"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            ) : (
              /* Phase 2: Saisie du PIN obligatoire */
              <div className="w-full max-w-sm space-y-8 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] animate-pulse">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-black text-afri-text uppercase tracking-wider font-display">
                    Saisie du PIN requis
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Veuillez saisir votre code secret du Wallet pour valider cette opération.
                  </p>
                </div>

                {/* Password Bullet dots indicators */}
                <div className="flex justify-center items-center gap-4.5 py-2">
                  {Array.from({ length: walletPinSettings.pinLength }).map((_, idx) => {
                    const isFilled = idx < pinVerificationFlow.enteredPin.length;
                    return (
                      <div
                        key={idx}
                        className={`w-4 h-4 rounded-full border-2 transition-all ${isFilled ? "bg-[#D4AF37] border-[#D4AF37] scale-110 shadow-[0_0_10px_rgba(212,175,55,0.4)]" : "bg-transparent border-zinc-700"}`}
                      />
                    );
                  })}
                </div>

                {/* Error message */}
                {pinVerificationFlow.errorMsg && (
                  <p className="text-xs font-bold text-red-400 font-sans animate-shake">
                    ⚠️ {pinVerificationFlow.errorMsg}
                  </p>
                )}

                {/* Virtual Keypad Pad */}
                <div className="grid grid-cols-3 gap-y-4 gap-x-8 max-w-xs mx-auto pt-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleVerifyPinKeyPress(num.toString())}
                      className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xl font-bold font-mono text-afri-text flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      playSound("click");
                      setActivePendingOperation(null);
                    }}
                    className="w-16 h-16 rounded-full flex items-center justify-center text-[10px] font-black text-zinc-500 hover:text-zinc-400 cursor-pointer uppercase tracking-wider"
                  >
                    Fermer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerifyPinKeyPress("0")}
                    className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xl font-bold font-mono text-afri-text flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyPinDelete}
                    className="w-16 h-16 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-300 active:scale-95 cursor-pointer text-lg"
                  >
                    ⌫
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </AndroidPageLayout>
  );
}
