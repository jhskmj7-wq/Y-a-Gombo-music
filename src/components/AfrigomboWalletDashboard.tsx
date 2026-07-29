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
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, gomboDB } from "../firebase";
import { collection, query, where, getDocs, addDoc, onSnapshot, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { BetaEscrowInfoButton } from "./BetaEscrowInfoModal";
import { supportConfig } from "../supportConfig";
import { recordWalletTransaction } from "../lib/financial";

interface AfrigomboWalletDashboardProps {
  currentUserProfile: any;
  addToTerminal: (msg: string) => void;
  onBack?: () => void;
}

export default function AfrigomboWalletDashboard({ 
  currentUserProfile, 
  addToTerminal,
  onBack 
}: AfrigomboWalletDashboardProps) {
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
  
  // History tab filter
  const [activeTab, setActiveTab] = useState<"all" | "flows" | "contracts" | "commissions" | "disputes">("all");
  
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
  const [withdrawSubmitted, setWithdrawSubmitted] = useState<boolean>(false);

  useEffect(() => {
    const suggested = localStorage.getItem("afrigombo_suggested_deposit_amount");
    if (suggested) {
      setShowDepositModal(true);
      localStorage.removeItem("afrigombo_suggested_deposit_amount");
    }
  }, []);

  // Scanner / Transfer states
  const [scanRecipient, setScanRecipient] = useState("");
  const [scanAmount, setScanAmount] = useState("");
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanCopied, setScanCopied] = useState(false);

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
        if (uData.wallet) {
          setWallet({
            soldeDisponible: uData.wallet.soldeDisponible || 0,
            soldeBloque: uData.wallet.soldeBloque || 0,
            revenus: uData.wallet.revenus || 0,
            depots: uData.wallet.depots || 0,
            retraits: uData.wallet.retraits || 0,
            gainsMensuels: uData.wallet.gainsMensuels || 0,
            revenusMois: uData.wallet.revenusMois || 0,
            economiesPremium: uData.wallet.economiesPremium || 0,
            niveauWallet: uData.wallet.niveauWallet || "Standard"
          });
        }
      }
    });

    // 2. Listen to all transactions in Firestore involving this user
    const unsubTx = onSnapshot(collection(db, "transactions"), (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.userId === uid || data.artistId === uid || data.clientId === uid || data.userConcernedId === uid) {
          list.push({ id: docSnap.id, ...data });
        }
      });
      list.sort((a, b) => new Date(b.createdAt || b.date || b.timestamp || 0).getTime() - new Date(a.createdAt || a.date || a.timestamp || 0).getTime());
      setTransactions(list);
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
      unsubTx();
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
    const depositAmount = Number(amount);
    if (!depositAmount || depositAmount < 15000) {
      alert("Le montant minimum est de 15 000 FCFA.");
      return;
    }
    setProcessing(true);
    try {
      const depId = "dep_" + Date.now();
      const userName = currentUserProfile?.artisticName || currentUserProfile?.displayName || "Membre";
      const reference = "DEP-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      
      await setDoc(doc(db, "walletDepositRequests", depId), {
        id: depId,
        uid: uid,
        userName: userName,
        montant: depositAmount,
        status: "pending",
        createdAt: new Date().toISOString(),
        reference: reference,
        operator: operator,
        phoneNumber: phoneNumber
      });
      setCreatedDepositRef(reference);
      setStep("success");
    } catch (err) {
      console.error("Deposit error", err);
    } finally {
      setProcessing(false);
    }
  };

  // MOBILE MONEY WITHDRAWAL HANDLER (UPDATED FOR BÊTA)
  const handleWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount <= 0 || withdrawAmount > wallet.soldeDisponible) return;

    setProcessing(true);
    try {
      const withId = "with_" + Date.now();
      await setDoc(doc(db, "walletWithdrawalRequests", withId), {
        id: withId,
        userId: uid,
        userName: currentUserProfile?.artisticName || currentUserProfile?.displayName || "Membre",
        operator: operator,
        numero: phoneNumber,
        amount: withdrawAmount,
        status: "PENDING",
        createdAt: serverTimestamp(),
        createdAtIso: new Date().toISOString()
      });
      setWithdrawSubmitted(true);
    } catch (err) {
      console.error("Withdrawal error", err);
    } finally {
      setProcessing(false);
    }
  };

  // P2P INSTANT TRANSFER / SCANNER HANDLER
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sendAmt = Number(scanAmount);
    if (!sendAmt || sendAmt <= 0 || sendAmt > wallet.soldeDisponible || !scanRecipient || processing) return;

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
    if (activeTab === "flows") return tx.type === "deposit" || tx.type === "depot" || tx.type === "recharge_wallet" || tx.type === "withdrawal" || tx.type === "retrait";
    if (activeTab === "contracts") return tx.type === "deposit_escrow" || tx.type === "fonds_bloques" || tx.type === "release" || tx.type === "deblocage_cachet" || tx.type === "refund" || tx.type === "remboursement";
    if (activeTab === "commissions") return tx.type === "commission_plateforme" || tx.type === "commission" || tx.description?.toLowerCase().includes("commission");
    if (activeTab === "disputes") return tx.type === "remboursement" || tx.type === "refund" || tx.description?.toLowerCase().includes("litige");
    return true;
  });

  return (
    <div className="space-y-5 max-w-4xl mx-auto afri-container afri-section text-left animate-fadeIn">
      
      {/* COMPACT TOP HEADER */}
      <div className="flex items-center justify-between border-b border-afri-border/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-afri-bg-sec border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-afri-text tracking-wide uppercase font-sans flex items-center gap-2">
              MON WALLET SOUVERAIN
            </h2>
            <p className="text-[10px] text-afri-text-muted font-mono leading-none">
              Portefeuille sécurisé & compte séquestre AFRIGOMBO
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="py-1 px-2.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-mono font-black uppercase tracking-widest rounded-lg border border-emerald-500/25 flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3" />
            <span className="hidden sm:inline">SÉCURISÉ</span> BÊTA
          </span>
          {onBack && (
            <button 
              onClick={onBack}
              className="text-[10px] font-mono px-3 py-1 bg-afri-bg-sec border border-afri-border rounded-lg text-afri-text-sec hover:text-afri-gold transition-colors"
            >
              &larr; Retour
            </button>
          )}
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. 💰 SOLDE DISPONIBLE (EN TRÈS GRAND)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="bg-afri-bg-sec border border-[#D4AF37]/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl group">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/5 rounded-full blur-[90px] -mr-24 -mt-24 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-[0.2em] font-black flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                💰 Solde disponible
              </span>
              <BetaEscrowInfoButton variant="badge" />
            </div>

            <div className="flex items-baseline gap-2">
              <h1 className="text-4xl xs:text-5xl sm:text-6xl font-black text-afri-text font-mono tracking-tight text-shadow-sm">
                {wallet.soldeDisponible.toLocaleString('fr-FR')}
              </h1>
              <span className="text-lg xs:text-xl sm:text-2xl font-black text-[#D4AF37] font-mono uppercase">
                FCFA
              </span>
            </div>

            <div className="pt-1 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-afri-bg/60 border border-afri-border text-[10px] font-mono text-amber-400 font-bold">
                <Lock className="w-3 h-3 text-[#D4AF37]" />
                Séquestre : {wallet.soldeBloque.toLocaleString('fr-FR')} FCFA
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-afri-bg/60 border border-afri-border text-[10px] font-mono text-emerald-400 font-bold">
                <TrendingUp className="w-3 h-3" />
                Gains : +{wallet.revenus?.toLocaleString('fr-FR') || 0} FCFA
              </span>
            </div>
          </div>

          {/* Quick Level Badge */}
          <div className="sm:text-right flex flex-col sm:items-end justify-center border-t sm:border-t-0 sm:border-l border-afri-border/60 pt-4 sm:pt-0 sm:pl-6 space-y-1">
            <span className="text-[9px] font-mono text-afri-text-muted uppercase tracking-widest font-black">NIVEAU COMPTE</span>
            <span className="px-3 py-1 bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/35 rounded-xl text-xs font-black uppercase font-mono tracking-wider inline-block">
              👑 {wallet.niveauWallet || "SOUVERAIN"}
            </span>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. ACTIONS RAPIDES (RECHARGER / RETIRER / HISTORIQUE / SCANNER)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono text-afri-text-muted uppercase tracking-widest font-black px-1 block">
          ⚡ Actions Rapides
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          {/* • Recharger */}
          <button
            onClick={openDeposit}
            className="p-4 bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37]/60 rounded-2xl flex flex-col items-center justify-center text-center gap-2 hover:bg-[#D4AF37]/10 transition-all group cursor-pointer shadow-md active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs font-black font-sans text-afri-text uppercase block">Recharger</span>
              <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">Dépôt Mobile</span>
            </div>
          </button>

          {/* • Retirer */}
          <button
            onClick={openWithdraw}
            disabled={wallet.soldeDisponible <= 0}
            className="p-4 bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37]/60 rounded-2xl flex flex-col items-center justify-center text-center gap-2 hover:bg-amber-500/10 transition-all group cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs font-black font-sans text-afri-text uppercase block">Retirer</span>
              <span className="text-[8px] font-mono text-amber-400 uppercase tracking-widest block font-bold">Vers Mobile</span>
            </div>
          </button>

          {/* • Historique */}
          <button
            onClick={scrollToHistory}
            className="p-4 bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37]/60 rounded-2xl flex flex-col items-center justify-center text-center gap-2 hover:bg-sky-500/10 transition-all group cursor-pointer shadow-md active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
              <History className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs font-black font-sans text-afri-text uppercase block">Historique</span>
              <span className="text-[8px] font-mono text-sky-400 uppercase tracking-widest block font-bold">Journaux</span>
            </div>
          </button>

          {/* • Scanner */}
          <button
            onClick={openScanner}
            className="p-4 bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37]/60 rounded-2xl flex flex-col items-center justify-center text-center gap-2 hover:bg-purple-500/10 transition-all group cursor-pointer shadow-md active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <QrCode className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs font-black font-sans text-afri-text uppercase block">Scanner</span>
              <span className="text-[8px] font-mono text-purple-400 uppercase tracking-widest block font-bold">Paiement QR</span>
            </div>
          </button>

        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. RÉSUMÉ (ARGENT REÇU / DÉPENSÉ / COMMISSIONS / SOLDE)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono text-afri-text-muted uppercase tracking-widest font-black px-1 block">
          📊 Résumé Financier
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          {/* • Argent reçu */}
          <div className="bg-afri-bg border border-afri-border rounded-2xl p-4 space-y-1">
            <span className="text-[9px] font-mono text-afri-text-sec block uppercase tracking-wider">
              📥 Argent reçu
            </span>
            <span className="text-base sm:text-lg font-black text-emerald-400 font-mono block">
              +{wallet.revenus?.toLocaleString('fr-FR') || 0} <span className="text-[9px]">FCFA</span>
            </span>
          </div>

          {/* • Argent dépensé */}
          <div className="bg-afri-bg border border-afri-border rounded-2xl p-4 space-y-1">
            <span className="text-[9px] font-mono text-afri-text-sec block uppercase tracking-wider">
              📤 Argent dépensé
            </span>
            <span className="text-base sm:text-lg font-black text-rose-400 font-mono block">
              -{(wallet.retraits || wallet.depots || 0).toLocaleString('fr-FR')} <span className="text-[9px]">FCFA</span>
            </span>
          </div>

          {/* • Commissions */}
          <div className="bg-afri-bg border border-afri-border rounded-2xl p-4 space-y-1">
            <span className="text-[9px] font-mono text-afri-text-sec block uppercase tracking-wider">
              🛡️ Commissions
            </span>
            <span className="text-base sm:text-lg font-black text-amber-400 font-mono block">
              {(wallet.economiesPremium || 0).toLocaleString('fr-FR')} <span className="text-[9px]">FCFA</span>
            </span>
          </div>

          {/* • Solde disponible */}
          <div className="bg-afri-bg border border-[#D4AF37]/30 rounded-2xl p-4 space-y-1 bg-[#D4AF37]/5">
            <span className="text-[9px] font-mono text-[#D4AF37] block uppercase tracking-wider font-bold">
              💰 Solde disponible
            </span>
            <span className="text-base sm:text-lg font-black text-afri-text font-mono block">
              {wallet.soldeDisponible.toLocaleString('fr-FR')} <span className="text-[9px]">FCFA</span>
            </span>
          </div>

        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4. HISTORIQUE (LISTE CHRONOLOGIQUE)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div ref={historyRef} className="bg-afri-bg-sec border border-afri-border rounded-3xl p-3 sm:p-5 space-y-4">
        
        {/* Header & Filter tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-afri-border/80 pb-4">
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
                onClick={() => { setActiveTab(tab.id as any); playSound("click"); }}
                className="py-1 px-2.5 sm:py-1 sm:px-3 rounded-full text-[9px] font-mono font-extrabold uppercase transition-all cursor-pointer bg-afri-bg text-afri-text-sec hover:text-afri-text border border-afri-border"
                style={activeTab === tab.id ? { backgroundColor: '#D4AF37', color: '#000000', fontWeight: '900' } : undefined}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List of chronological transactions */}
        {filteredTxs.length === 0 ? (
          <div className="text-center py-12 text-afri-text-muted font-mono text-xs">
            📭 Aucune transaction enregistrée dans cet historique.
          </div>
        ) : (
          <div className="divide-y divide-afri-border/60">
            {filteredTxs.map((tx) => {
              const isFlowIn = tx.type === "deposit" || tx.type === "depot" || tx.type === "recharge_wallet" || tx.type === "release" || tx.type === "deblocage_cachet" || tx.type === "refund" || tx.type === "remboursement" || tx.type === "prime_bonus";
              const typeLabel = 
                tx.type === "depot" || tx.type === "deposit" || tx.type === "recharge_wallet" ? "Recharge" :
                tx.type === "debit_publication" ? "Paiement" :
                tx.type === "commission_plateforme" || tx.type === "commission" ? "Commission" :
                tx.type === "fonds_bloques" ? "Séquestre" :
                tx.type === "deblocage_cachet" || tx.type === "release" ? "Déblocage" :
                tx.type === "remboursement" || tx.type === "refund" ? "Remboursement" :
                tx.type === "prime_bonus" ? "Prime" :
                tx.type === "abonnement_premium" ? "Premium" :
                tx.type || "Opération";

              const formattedDate = tx.date || (tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("fr-FR") : "Récent");
              const formattedHeure = tx.heure || (tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "");
              const txAmount = Number(tx.amount || tx.montant || 0);

              return (
                <div key={tx.id || tx.reference} className="py-2.5 flex items-center justify-between gap-2 text-left hover:bg-afri-bg/30 px-1.5 rounded-xl transition-colors">
                  
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 pr-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 ${
                      isFlowIn ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                      tx.type === "commission_plateforme" || tx.type === "commission" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                      tx.type === "fonds_bloques" ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" :
                      "bg-afri-bg border-afri-border text-afri-text-sec"
                    }`}>
                      {isFlowIn ? <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" /> :
                       tx.type === "withdrawal" || tx.type === "retrait" ? <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" /> :
                       tx.type === "fonds_bloques" || tx.type === "debit_publication" ? <Lock className="w-3.5 h-3.5" /> :
                       <ShieldCheck className="w-3.5 h-3.5" />}
                    </div>

                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[7.5px] font-mono font-black uppercase px-1.5 py-0.5 bg-afri-bg border border-afri-border text-[#D4AF37] rounded">
                          {typeLabel}
                        </span>
                        <p className="text-[11px] font-bold text-afri-text truncate max-w-[130px] sm:max-w-[320px]">
                          {tx.description || "Opération financière"}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[8.5px] font-mono text-afri-text-muted">
                        <span className="truncate max-w-[90px]">Réf: {tx.reference || tx.id}</span>
                        <span>•</span>
                        <span>{formattedDate} {formattedHeure}</span>
                        {tx.userConcerned && (
                          <>
                            <span>•</span>
                            <span className="text-afri-text-sec truncate max-w-[80px]">{tx.userConcerned}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-0.5 shrink-0 min-w-[95px] sm:min-w-[115px]">
                    <span className={`text-xs font-mono font-black block ${isFlowIn ? "text-emerald-400" : "text-amber-500"}`}>
                      {isFlowIn ? "+" : "-"}{txAmount.toLocaleString('fr-FR')} FCFA
                    </span>
                    <span className={`inline-block text-[7.5px] font-mono py-0.5 px-1.5 rounded border uppercase font-bold ${
                      tx.status === "success" || tx.statut === "success" || tx.status === "fonds_liberes" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" :
                      tx.status === "fonds_bloques" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/25" :
                      tx.status === "pending" || tx.statut === "pending" ? "bg-amber-500/10 text-amber-400 border-amber-500/25 animate-pulse" :
                      "bg-afri-bg text-afri-text-sec border-afri-border"
                    }`}>
                      {tx.status === "fonds_bloques" ? "Séquestre" :
                       tx.status === "fonds_liberes" ? "Libéré" :
                       tx.status === "success" || tx.statut === "success" ? "Succès" :
                       tx.status === "pending" ? "En attente" :
                       tx.status || "Terminé"}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* MODAL 1: RECHARGER / DÉPÔT MOBILE MONEY */}
      <AnimatePresence>
        {showDepositModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-afri-bg-sec border border-[#D4AF37]/30 rounded-3xl p-6 w-full max-w-md my-auto space-y-6 relative text-left shadow-2xl"
            >
              <button 
                onClick={() => { setShowDepositModal(false); playSound("click"); }}
                className="absolute top-4 right-4 text-afri-text-muted hover:text-afri-text p-1 rounded-full bg-afri-bg/50"
              >
                <X className="w-5 h-5" />
              </button>

              {step === "form" && (
                <form onSubmit={(e) => { e.preventDefault(); handleDepositRequest(); }} className="space-y-5">
                  <div className="text-center space-y-1.5">
                    <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mx-auto">
                      <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <h3 className="text-base font-black text-afri-text uppercase tracking-wider font-sans">
                      RECHARGER LE WALLET
                    </h3>
                    <p className="text-[11px] text-afri-text-sec font-mono">
                      Dépôt Mobile Money direct via Wave, Orange, MTN, Moov
                    </p>
                  </div>

                  {/* Operator Choice */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest block">
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
                          type="button"
                          onClick={() => { setOperator(op.id as any); playSound("click"); }}
                          className={`py-2 text-[10px] font-black uppercase rounded-xl border text-center transition-all cursor-pointer ${
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
                      <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest block">
                        Numéro Mobile Money (+225)
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-3.5 w-4 h-4 text-afri-text-muted" />
                        <input 
                          type="tel" 
                          required
                          value={phoneNumber} 
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                          placeholder="0707070707" 
                          className="w-full bg-afri-bg border border-afri-border rounded-xl pl-11 pr-4 py-3 text-afri-text font-mono text-sm focus:outline-none focus:border-afri-gold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest flex justify-between">
                        <span>Montant du rechargement (FCFA)</span>
                        <span className="text-[#D4AF37]">Min: 15 000 FCFA</span>
                      </label>
                      <div className="relative">
                        <Coins className="absolute left-4 top-3.5 w-4 h-4 text-afri-text-muted" />
                        <input 
                          type="number" 
                          required
                          min="15000"
                          value={amount} 
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="Ex: 25000" 
                          className="w-full bg-afri-bg border border-afri-border rounded-xl pl-11 pr-4 py-3 text-afri-text font-mono text-sm focus:outline-none focus:border-afri-gold"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={processing || !amount || !phoneNumber}
                    className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#b8982e] text-black font-black uppercase font-mono text-[10px] tracking-widest rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-lg active:scale-98"
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

                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        supportConfig.openSupport(`Bonjour 👋\n\nMa demande de rechargement Wallet de ${Number(amount).toLocaleString('fr-FR')} FCFA via ${operator.toUpperCase()} (${phoneNumber}) est enregistrée (Réf: ${createdDepositRef || "dep_beta"}).`);
                      }}
                      className="w-full py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-black font-black text-xs uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 shadow-md"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>VALIDER AVEC LE SUPPORT WHATSAPP</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        setProcessing(true);
                        try {
                          const now = new Date().toISOString();
                          
                          // Get current user profile doc
                          const userRef = doc(db, "users", uid);
                          const userSnap = await getDoc(userRef);
                          let currentDispo = 0;
                          let currentDepots = 0;
                          if (userSnap.exists()) {
                            const uData = userSnap.data();
                            currentDispo = uData?.wallet?.soldeDisponible ?? 0;
                            currentDepots = uData?.wallet?.depots ?? 0;
                          }
                          
                          const depositVal = Number(amount);
                          const newDispo = currentDispo + depositVal;
                          const newDepots = currentDepots + depositVal;
                          
                          // Update balance in user doc
                          await setDoc(userRef, {
                            wallet: {
                              soldeDisponible: newDispo,
                              depots: newDepots
                            }
                          }, { merge: true });
                          
                          // Record transaction
                          const txRef = "DEP-SIM-" + Math.random().toString(36).substring(2, 8).toUpperCase();
                          await recordWalletTransaction({
                            userId: uid,
                            userName: currentUserProfile?.artisticName || currentUserProfile?.displayName || currentUserProfile?.name || "Membre Gombo",
                            type: "recharge_wallet",
                            amount: depositVal,
                            status: "success",
                            reference: txRef,
                            description: `Recharge instantanée Bêta (${txRef})`
                          });
                          
                          // Update deposit request in firebase if exists
                          if (createdDepositRef) {
                            await setDoc(doc(db, "walletDepositRequests", createdDepositRef), {
                              status: "validated",
                              statut: "validated",
                              validatedAt: now,
                              validatedBy: "Auto-Validation Bêta"
                            }, { merge: true });
                          }
                          
                          // Add notification
                          await addDoc(collection(db, "notifications"), {
                            userId: uid,
                            title: "💳 Recharge Bêta Réussie !",
                            message: `Votre recharge instantanée de ${depositVal.toLocaleString('fr-FR')} FCFA a été créditée.`,
                            type: "payment_received",
                            createdAt: now,
                            isRead: false
                          });
                          
                          addToTerminal(`[BÊTA] Wallet crédité avec succès de ${depositVal.toLocaleString('fr-FR')} FCFA !`);
                          playSound("success");
                          
                          // Fire custom event to notify listeners of balance update
                          window.dispatchEvent(new CustomEvent("wallet_balance_updated"));
                          
                          setStep("form");
                          setAmount("");
                          setShowDepositModal(false);
                        } catch (err) {
                          console.error(err);
                          alert("Erreur de simulation.");
                        } finally {
                          setProcessing(false);
                        }
                      }}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-black font-black text-xs uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 shadow-md border border-[#D4AF37]"
                    >
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span>CRÉDITER INSTANTANÉMENT (MODE BÊTA)</span>
                    </button>

                    <button
                      onClick={() => { setShowDepositModal(false); playSound("click"); }}
                      className="w-full py-2.5 bg-afri-bg hover:bg-afri-bg-sec border border-afri-border text-afri-text-sec text-[10px] font-mono uppercase rounded-xl transition-colors cursor-pointer"
                    >
                      Fermer le guichet
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: RETIRER / RETRAIT MOBILE MONEY */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-afri-bg-sec border border-afri-border rounded-3xl p-6 w-full max-w-md my-auto space-y-6 relative text-left shadow-2xl"
            >
              <button 
                onClick={() => { setShowWithdrawModal(false); playSound("click"); }}
                className="absolute top-4 right-4 text-afri-text-muted hover:text-afri-text p-1 rounded-full bg-afri-bg/50"
              >
                <X className="w-5 h-5" />
              </button>

              {withdrawSubmitted ? (
                <div className="space-y-5 text-center py-2">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-lg">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div className="space-y-1.5">
                    <span className="inline-block text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                      DEMANDE TRANSMISE
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

                  <button
                    onClick={() => { setShowWithdrawModal(false); playSound("click"); }}
                    className="w-full py-3 bg-afri-bg hover:bg-afri-bg-sec border border-afri-border text-afri-text font-bold uppercase font-mono text-[10px] tracking-widest rounded-xl transition-colors cursor-pointer"
                  >
                    Fermer le guichet
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleWithdrawRequest(e); }} className="space-y-5">
                  <div className="text-center space-y-1.5">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                      <ArrowDownLeft className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <h3 className="text-base font-black text-afri-text uppercase tracking-wider font-sans">
                      RETIRER VOS FONDS
                    </h3>
                    <p className="text-[11px] text-afri-text-sec font-mono">
                      Transfert direct de votre solde vers Mobile Money
                    </p>
                  </div>

                  {/* Operator Choice */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest block">
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
                          type="button"
                          onClick={() => { setOperator(op.id as any); playSound("click"); }}
                          className={`py-2 text-[10px] font-black uppercase rounded-xl border text-center transition-all cursor-pointer ${
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
                        <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest">
                          Montant à retirer (FCFA)
                        </label>
                        <span className="text-[9px] font-mono text-amber-400 font-bold">
                          Max : {wallet.soldeDisponible.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                      <div className="relative">
                        <Coins className="absolute left-4 top-3.5 w-4 h-4 text-afri-text-muted" />
                        <input 
                          type="number" 
                          required
                          min="500"
                          max={wallet.soldeDisponible}
                          value={amount} 
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="Ex: 25000" 
                          className="w-full bg-afri-bg border border-afri-border rounded-xl pl-11 pr-4 py-3 text-afri-text font-mono text-sm focus:outline-none focus:border-afri-gold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest block">
                        Numéro Mobile Money du bénéficiaire (+225)
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-3.5 w-4 h-4 text-afri-text-muted" />
                        <input 
                          type="tel" 
                          required
                          value={phoneNumber} 
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                          placeholder="0707070707" 
                          className="w-full bg-afri-bg border border-afri-border rounded-xl pl-11 pr-4 py-3 text-afri-text font-mono text-sm focus:outline-none focus:border-afri-gold"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={processing || !amount || Number(amount) > wallet.soldeDisponible || !phoneNumber}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase font-mono text-[10px] tracking-widest rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-lg active:scale-98"
                  >
                    {processing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Soumettre la demande de retrait"}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: SCANNER / P2P TRANSFER */}
      <AnimatePresence>
        {showScannerModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-afri-bg-sec border border-purple-500/30 rounded-3xl p-6 w-full max-w-md my-auto space-y-5 relative text-left shadow-2xl"
            >
              <button 
                onClick={() => { setShowScannerModal(false); playSound("click"); }}
                className="absolute top-4 right-4 text-afri-text-muted hover:text-afri-text p-1 rounded-full bg-afri-bg/50"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-afri-text uppercase tracking-wider font-sans">
                  SCANNER & TRANSFERT P2P
                </h3>
                <p className="text-[11px] text-afri-text-sec font-mono">
                  Scannez un QR Code ou saisissez le Gombo ID du destinataire
                </p>
              </div>

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
                    onClick={() => { setShowScannerModal(false); playSound("click"); }}
                    className="w-full py-3 bg-afri-bg hover:bg-afri-bg-sec border border-afri-border text-afri-text font-bold uppercase font-mono text-[10px] tracking-widest rounded-xl transition-colors cursor-pointer"
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
                      <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest block">
                        Destinataire (Gombo ID / Téléphone / Email)
                      </label>
                      <input 
                        type="text" 
                        required
                        value={scanRecipient} 
                        onChange={(e) => setScanRecipient(e.target.value)}
                        placeholder="Ex: GOMBO-7782 ou 0707070707" 
                        className="w-full bg-afri-bg border border-afri-border rounded-xl px-4 py-3 text-afri-text font-mono text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest">
                          Montant à transférer (FCFA)
                        </label>
                        <span className="text-[9px] font-mono text-purple-400 font-bold">
                          Solde : {wallet.soldeDisponible.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                      <input 
                        type="number" 
                        required
                        min="100"
                        max={wallet.soldeDisponible}
                        value={scanAmount} 
                        onChange={(e) => setScanAmount(e.target.value)}
                        placeholder="Ex: 5000" 
                        className="w-full bg-afri-bg border border-afri-border rounded-xl px-4 py-3 text-afri-text font-mono text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={processing || !scanRecipient || !scanAmount || Number(scanAmount) > wallet.soldeDisponible}
                    className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black uppercase font-mono text-[10px] tracking-widest rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-lg active:scale-98 flex items-center justify-center gap-2"
                  >
                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <>
                      <Send className="w-4 h-4" />
                      <span>Confirmer le transfert instantané</span>
                    </>}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
