import React, { useState, useEffect } from "react";
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
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, gomboDB } from "../firebase";
import { collection, query, where, getDocs, addDoc, onSnapshot, doc, getDoc, setDoc } from "firebase/firestore";

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
  const isArtist = currentUserProfile?.role === "musician" || currentUserProfile?.role === "artist";
  
  // Real-time ledger states
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
  
  // Tab control
  const [activeTab, setActiveTab] = useState<"all" | "flows" | "contracts" | "commissions" | "disputes">("all");
  
  // Dialog states
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  
  // Form fields
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(currentUserProfile?.phone || "");
  const [operator, setOperator] = useState<"wave" | "orange" | "mtn" | "moov">("wave");
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<"form" | "otp" | "success">("form");
  const [otpCode, setOtpCode] = useState("");

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

  // Real-time listener for user profile wallet & ledger logs
  useEffect(() => {
    if (!uid) return;

    // Listen to current user profile to fetch direct wallet values
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

    // Listen to all transactions involving this user (either as main user, client, or artist)
    const unsubTx = onSnapshot(collection(db, "transactions"), (snap) => {
      const list: any[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.userId === uid || data.artistId === uid || data.clientId === uid) {
          list.push({ id: doc.id, ...data });
        }
      });
      list.sort((a, b) => new Date(b.createdAt || b.timestamp || 0).getTime() - new Date(a.createdAt || a.timestamp || 0).getTime());
      setTransactions(list);
    });

    // Listen to all contracts involving this user
    const unsubContracts = onSnapshot(collection(db, "contracts"), (snap) => {
      const list: any[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.clientId === uid || data.artistId === uid) {
          list.push({ id: doc.id, ...data });
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

  // Self-Healing ledger reconciliation
  // Ensure the wallet profile balances match the factual ledger records in real-time
  useEffect(() => {
    if (loading || !uid) return;

    const reconcileWallet = async () => {
      // Calculate fact-based available and blocked balances from transactions and active contracts
      let calculatedBloque = 0;
      contracts.forEach(c => {
        if (c.status === "payment_held" || c.status === "arrived" || c.status === "in_progress" || c.status === "completed_artist" || c.status === "disputed") {
          if (c.clientId === uid) {
            calculatedBloque += (c.totalClientPaid || 0);
          }
        }
      });

      // Calculate deposits, withdrawals, revenues, and monthly gains based on transaction history
      let calculatedDepots = 0;
      let calculatedRetraits = 0;
      let calculatedRevenus = 0;
      let calculatedGainsMensuels = 0;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      transactions.forEach(t => {
        const isSuccess = t.status === "success" || !t.status || t.status === "Terminé" || t.status === "Paiement reçu";
        if (isSuccess) {
          const tDate = t.createdAt ? new Date(t.createdAt) : new Date();
          
          if (t.type === "deposit" && t.userId === uid) {
            calculatedDepots += (t.amount || 0);
          } else if (t.type === "withdrawal" && t.userId === uid) {
            calculatedRetraits += (t.amount || 0);
          } else if (t.type === "release" && t.userId === uid) {
            calculatedRevenus += (t.amount || 0);
            if (tDate >= thirtyDaysAgo) {
              calculatedGainsMensuels += (t.amount || 0);
            }
          }
        }
      });

      // Let's check if the current values in profile need a safe local refresh to align
      const walletNeedsSync = 
        wallet.soldeBloque !== calculatedBloque ||
        wallet.depots !== calculatedDepots ||
        wallet.retraits !== calculatedRetraits ||
        wallet.revenus !== calculatedRevenus ||
        wallet.gainsMensuels !== calculatedGainsMensuels;
      
      if (walletNeedsSync) {
        const userRef = doc(db, "users", uid);
        await setDoc(userRef, {
          wallet: {
            soldeDisponible: wallet.soldeDisponible,
            soldeBloque: calculatedBloque,
            depots: calculatedDepots,
            retraits: calculatedRetraits,
            revenus: calculatedRevenus,
            gainsMensuels: calculatedGainsMensuels
          }
        }, { merge: true });
      }
    };

    reconcileWallet().catch(err => console.error("Reconciler error", err));
  }, [contracts, transactions, loading, uid]);

  // MOBILE MONEY DEPOSIT HANDLER
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || processing) return;
    
    setProcessing(true);
    playSound("click");

    // Phase 1: Simulate OTP verification
    setTimeout(() => {
      setStep("otp");
      setProcessing(false);
    }, 1500);
  };

  const confirmOtp = async () => {
    if (!otpCode || processing) return;
    setProcessing(true);
    playSound("click");

    // Phase 2: Simulate network connection and secure deposit
    setTimeout(async () => {
      try {
        const depositAmount = Number(amount);
        const now = new Date().toISOString();
        const txId = "tx_dep_" + Date.now();

        // 1. Create a factual deposit transaction record
        const transactionPayload = {
          id: txId,
          userId: uid,
          userName: currentUserProfile?.artisticName || currentUserProfile?.displayName || "Membre Gombo",
          type: "deposit",
          amount: depositAmount,
          status: "success",
          provider: operator,
          phoneNumber: phoneNumber,
          description: `Rechargement Wallet AFRIGOMBO via ${operator.toUpperCase()} (+225 ${phoneNumber})`,
          createdAt: now
        };
        await setDoc(doc(db, "transactions", txId), transactionPayload);

        // 2. Also register in the general payments collection for audit logs
        const paymentId = "pay_dep_" + Date.now();
        await setDoc(doc(db, "payments", paymentId), {
          id: paymentId,
          userId: uid,
          userName: currentUserProfile?.artisticName || currentUserProfile?.displayName || "Membre Gombo",
          amount: depositAmount,
          purpose: `rechargement_wallet_${operator.toUpperCase()}`,
          provider: operator,
          status: "Paiement reçu",
          createdAt: now
        });

        // 3. Update the user profile wallet balances
        const userRef = doc(db, "users", uid);
        await setDoc(userRef, {
          wallet: {
            soldeDisponible: wallet.soldeDisponible + depositAmount,
            soldeBloque: wallet.soldeBloque
          }
        }, { merge: true });

        addToTerminal(`[WALLET] 📥 Rechargement de ${depositAmount.toLocaleString()} FCFA réussi via ${operator.toUpperCase()}`);
        playSound("success");
        setStep("success");
      } catch (err) {
        console.error("Deposit error", err);
      } finally {
        setProcessing(false);
      }
    }, 1800);
  };

  // MOBILE MONEY WITHDRAWAL HANDLER
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount <= 0 || withdrawAmount > wallet.soldeDisponible || processing) return;

    setProcessing(true);
    playSound("click");

    setTimeout(async () => {
      try {
        const now = new Date().toISOString();
        const txId = "tx_with_" + Date.now();

        // 1. Create a withdrawal transaction record
        const transactionPayload = {
          id: txId,
          userId: uid,
          userName: currentUserProfile?.artisticName || currentUserProfile?.displayName || "Membre Gombo",
          type: "withdrawal",
          amount: withdrawAmount,
          status: "success",
          provider: operator,
          phoneNumber: phoneNumber,
          description: `Retrait Wallet AFRIGOMBO vers ${operator.toUpperCase()} (+225 ${phoneNumber})`,
          createdAt: now
        };
        await setDoc(doc(db, "transactions", txId), transactionPayload);

        // 2. Update user profile wallet
        const userRef = doc(db, "users", uid);
        await setDoc(userRef, {
          wallet: {
            soldeDisponible: Math.max(0, wallet.soldeDisponible - withdrawAmount),
            soldeBloque: wallet.soldeBloque
          }
        }, { merge: true });

        addToTerminal(`[WALLET] 📤 Retrait de ${withdrawAmount.toLocaleString()} FCFA exécuté vers ${operator.toUpperCase()}`);
        playSound("success");
        setShowWithdrawModal(false);
        setAmount("");
        // Refresh component
      } catch (err) {
        console.error("Withdrawal error", err);
      } finally {
        setProcessing(false);
      }
    }, 2000);
  };

  const openDeposit = () => {
    setAmount("");
    setStep("form");
    setOtpCode("");
    setShowDepositModal(true);
    playSound("click");
  };

  const openWithdraw = () => {
    setAmount("");
    setShowWithdrawModal(true);
    playSound("click");
  };

  // Filtering ledger list dynamically
  const filteredTxs = transactions.filter(tx => {
    if (activeTab === "all") return true;
    if (activeTab === "flows") return tx.type === "deposit" || tx.type === "withdrawal";
    if (activeTab === "contracts") return tx.type === "deposit_escrow" || tx.type === "release" || tx.type === "refund";
    if (activeTab === "commissions") return tx.type === "commission" || tx.description?.toLowerCase().includes("commission");
    if (activeTab === "disputes") return tx.type === "refund" || tx.description?.toLowerCase().includes("litige");
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 pb-32 pt-2 text-left animate-fadeIn">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="py-0.5 px-2 bg-emerald-500/10 text-emerald-400 text-[9px] font-mono font-black uppercase tracking-widest rounded border border-emerald-500/20">
              SÉCURISÉ BÊTA
            </span>
            {onBack && (
              <button 
                onClick={onBack}
                className="text-[10px] font-mono text-zinc-500 hover:text-white transition-colors"
              >
                &larr; Retour au hub
              </button>
            )}
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#D4AF37]" />
            PORTEFEUILLE COFFRE-FORT AFRIGOMBO
          </h2>
          <p className="text-xs text-zinc-500 font-mono">
            Solde souverain crypté d'Abidjan & gestion séquestre transparente de l'Empire
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-full border border-zinc-900 text-[10px] font-mono text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Tiers de Confiance
          </div>
        </div>
      </div>

      {/* CORE WALLET BALANCE MODULES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* MAIN CARD: BALANCE */}
        <div className="lg:col-span-2 bg-gradient-to-br from-zinc-950 to-zinc-900 border border-[#D4AF37]/30 rounded-[2rem] p-8 relative overflow-hidden shadow-2xl shadow-black/80 group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-all group-hover:bg-[#D4AF37]/10"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between gap-8">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-[0.2em] font-black flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Solde Souverain Disponible
                </span>
                <h3 className="text-5xl font-black text-white font-mono tracking-tighter">
                  {wallet.soldeDisponible.toLocaleString()} <span className="text-xl text-zinc-500 font-sans font-normal uppercase">FCFA</span>
                </h3>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] backdrop-blur-md">
                <Wallet className="w-7 h-7" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-black/40 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-4 space-y-1">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">🔒 En Séquestre</span>
                <span className="text-lg font-black text-[#D4AF37] font-mono">{wallet.soldeBloque.toLocaleString()}</span>
              </div>
              <div className="bg-black/40 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-4 space-y-1">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">📈 Revenus Mois</span>
                <span className="text-lg font-black text-emerald-400 font-mono">+{wallet.revenus?.toLocaleString()}</span>
              </div>
              <div className="bg-black/40 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-4 space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">🎁 Économies Premium</span>
                <span className="text-lg font-black text-amber-400 font-mono">{wallet.economiesPremium?.toLocaleString() || "0"}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button 
                onClick={openDeposit}
                className="flex-1 min-w-[140px] py-4 bg-[#D4AF37] hover:bg-amber-400 text-black font-black font-mono text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-[#D4AF37]/20 flex items-center justify-center gap-2"
              >
                <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                Déposer
              </button>
              <button 
                onClick={openWithdraw}
                disabled={wallet.soldeDisponible <= 0}
                className="flex-1 min-w-[140px] py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-black font-mono text-[10px] uppercase tracking-widest rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ArrowDownLeft className="w-4 h-4 stroke-[3]" />
                Retirer
              </button>
            </div>
          </div>
        </div>

        {/* SIDE CARD: LEVEL & STATS */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-6 flex flex-col justify-between shadow-2xl">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black">Niveau du Wallet</span>
              <div className="px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded-full text-[10px] font-black uppercase font-mono">
                {wallet.niveauWallet || "CLASSIQUE"}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#D4AF37]">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">Progrès Prochain Niveau</span>
                    <span className="text-[10px] font-mono text-zinc-500">75%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-[#D4AF37] w-3/4 shadow-[0_0_10px_#D4AF37]"></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={() => setActiveTab("contracts")}
                  className="p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl text-left hover:border-[#D4AF37]/30 transition-all group"
                >
                  <FileText className="w-5 h-5 text-zinc-500 mb-2 group-hover:text-[#D4AF37]" />
                  <span className="text-[10px] font-black text-white uppercase block">Mes Contrats</span>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">{contracts.length} en cours</span>
                </button>
                <button 
                  onClick={() => setActiveTab("all")}
                  className="p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl text-left hover:border-[#D4AF37]/30 transition-all group"
                >
                  <History className="w-5 h-5 text-zinc-500 mb-2 group-hover:text-[#D4AF37]" />
                  <span className="text-[10px] font-black text-white uppercase block">Historique</span>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">Tout voir</span>
                </button>
              </div>
            </div>
          </div>

          <button className="w-full mt-6 py-3 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase font-mono tracking-widest transition-all flex items-center justify-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Statistiques Détaillées
          </button>
        </div>

      </div>

      {/* DETAILED ACTIVE COMPTE SÉQUESTRE ESCROW ROSTER */}
      <div className="bg-black border border-zinc-900 rounded-3xl p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
            SUIVI DE VOS CONTRATS EN SÉQUESTRE
          </h3>
          <span className="text-[10px] font-mono bg-zinc-900 text-zinc-400 px-2.5 py-1 rounded-full">
            {contracts.length} contrats
          </span>
        </div>

        {contracts.length === 0 ? (
          <div className="text-center py-12 text-zinc-600 font-mono text-xs">
            Aucun contrat séquestré actif. Créez et scellez un Gombo pour engager le coffre-fort d'Abidjan.
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map(c => {
              const isContractClient = c.clientId === uid;
              const commissionValue = isContractClient ? c.commissionClient : c.commissionArtist;
              const netValue = isContractClient ? (c.amount + (c.commissionClient || 0)) : (c.amount - (c.commissionArtist || 0));
              const currentGomboStatus = c.status;
              
              return (
                <div 
                  key={c.id} 
                  className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-zinc-800 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white uppercase">{c.gomboTitle || "Prestation Showbiz"}</span>
                      <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${
                        currentGomboStatus === "payment_held" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        currentGomboStatus === "disputed" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                        currentGomboStatus === "completed" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        "bg-zinc-900 text-zinc-400"
                      }`}>
                        {currentGomboStatus === "payment_held" ? "Argent Bloqué" :
                         currentGomboStatus === "disputed" ? "En Litige Bloqué" :
                         currentGomboStatus === "completed" ? "Libéré" : currentGomboStatus}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      Contrat: <span className="text-white">{c.id}</span> | {isContractClient ? `Artiste: ${c.artistName}` : `Annonceur: ${c.clientName}`}
                    </p>
                    <p className="text-[9px] text-zinc-500 font-mono">
                      Cachet Négocié: <span className="text-zinc-300 font-bold">{(c.amount || 0).toLocaleString()} FCFA</span> 
                      {` | Votre Commission: `} 
                      <span className="text-zinc-300">{(commissionValue || 0).toLocaleString()} FCFA</span>
                    </p>
                  </div>

                  <div className="text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto">
                    <div className="text-left sm:text-right">
                      <span className="text-[9px] font-mono text-zinc-500 block uppercase">
                        {isContractClient ? "Total Déposé" : "Net à Recevoir"}
                      </span>
                      <span className={`text-sm font-black font-mono ${isContractClient ? 'text-amber-500' : 'text-emerald-400'}`}>
                        {netValue?.toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FILTERABLE LEDGER HISTORY & COMMISSIONS */}
      <div className="bg-black border border-zinc-900 rounded-3xl p-6 space-y-6">
        
        {/* TABS SELECTOR */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-900 pb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              JOURNAL DES TRANSACTIONS & COMMISSIONS
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "Tous" },
              { id: "flows", label: "Dépôts & Retraits" },
              { id: "contracts", label: "Séquestres / Contrats" },
              { id: "commissions", label: "Commissions" },
              { id: "disputes", label: "Litiges / Remboursements" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); playSound("click"); }}
                className={`py-1.5 px-3 rounded-full text-[10px] font-mono font-bold uppercase transition-all ${
                  activeTab === tab.id 
                    ? "bg-[#D4AF37] text-black font-black" 
                    : "bg-zinc-950 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* LEDGER RENDER */}
        {filteredTxs.length === 0 ? (
          <div className="text-center py-16 text-zinc-600 font-mono text-xs">
            Aucune transaction dans ce filtre pour le moment.
          </div>
        ) : (
          <div className="divide-y divide-zinc-900">
            {filteredTxs.map(tx => {
              const isFlowIn = tx.type === "deposit" || tx.type === "release" || tx.type === "refund";
              
              return (
                <div key={tx.id} className="py-4 flex justify-between items-center gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 mt-0.5 ${
                      tx.type === "deposit" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                      tx.type === "withdrawal" ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                      tx.type === "release" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                      tx.type === "refund" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                      "bg-zinc-900 border-zinc-800 text-zinc-400"
                    }`}>
                      {tx.type === "deposit" ? <ArrowUpRight className="w-4 h-4" /> :
                       tx.type === "withdrawal" ? <ArrowDownLeft className="w-4 h-4" /> :
                       tx.type === "release" ? <Unlock className="w-4 h-4" /> :
                       tx.type === "refund" ? <ArrowDownLeft className="w-4 h-4" /> :
                       <Lock className="w-4 h-4" />}
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white">{tx.description || "Opération financière"}</p>
                      <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-500">
                        <span>{tx.id}</span>
                        <span>•</span>
                        <span>{tx.createdAt ? new Date(tx.createdAt).toLocaleString("fr-FR") : "Date inconnue"}</span>
                        {tx.provider && (
                          <>
                            <span>•</span>
                            <span className="uppercase text-zinc-400 font-bold">{tx.provider}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <span className={`text-xs font-mono font-black ${isFlowIn ? "text-emerald-400" : "text-amber-500"}`}>
                      {isFlowIn ? "+" : "-"}{tx.amount?.toLocaleString()} FCFA
                    </span>
                    <span className="block text-[8px] font-mono py-0.5 px-1.5 bg-zinc-950 text-zinc-500 rounded border border-zinc-900 text-center max-w-[80px] ml-auto uppercase font-bold">
                      {tx.status || "Terminé"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* MODAL: MOBILE MONEY DEPOSIT */}
      <AnimatePresence>
        {showDepositModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 w-full max-w-md space-y-6 relative"
            >
              <button 
                onClick={() => { setShowDepositModal(false); playSound("click"); }}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              {step === "form" && (
                <form onSubmit={handleDepositSubmit} className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] mx-auto">
                      <ArrowUpRight className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider">
                      RECHARGER MON COFFRE AFRIGOMBO
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-mono">
                      Effectuez un dépôt de Mobile Money en toute sécurité
                    </p>
                  </div>

                  {/* Operator Choice */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
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
                          className={`py-2 text-[10px] font-black uppercase rounded-xl border text-center transition-all ${
                            operator === op.id 
                              ? `${op.color} bg-white/5 font-black scale-102` 
                              : "border-zinc-900 text-zinc-600 hover:border-zinc-800"
                          }`}
                        >
                          {op.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
                        Numéro de téléphone (+225)
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
                        <input 
                          type="tel" 
                          required
                          value={phoneNumber} 
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                          placeholder="0707070707" 
                          className="w-full bg-black border border-zinc-900 rounded-xl pl-11 pr-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
                        Montant à déposer (FCFA)
                      </label>
                      <div className="relative">
                        <Coins className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
                        <input 
                          type="number" 
                          required
                          min="100"
                          value={amount} 
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="Ex: 50000" 
                          className="w-full bg-black border border-zinc-900 rounded-xl pl-11 pr-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={processing || !amount || !phoneNumber}
                    className="w-full py-4 bg-[#D4AF37] hover:bg-[#B48F17] text-black font-black uppercase font-mono text-[10px] tracking-widest rounded-xl transition-all disabled:opacity-50"
                  >
                    {processing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Générer la requête de paiement"}
                  </button>
                </form>
              )}

              {step === "otp" && (
                <div className="space-y-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 mx-auto animate-pulse">
                    <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      Veuillez approuver la notification Push
                    </h3>
                    <p className="text-zinc-500 text-[11px] font-mono max-w-sm mx-auto leading-relaxed">
                      Un code OTP a été généré pour votre sécurité. Veuillez entrer un code quelconque à 4 chiffres pour valider la transaction.
                    </p>
                  </div>

                  <div className="max-w-[200px] mx-auto">
                    <input 
                      type="text" 
                      maxLength={4}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="XXXX"
                      className="w-full text-center tracking-[0.5em] bg-black border-2 border-zinc-800 rounded-xl py-3 text-white font-mono text-lg font-black focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <button
                    onClick={confirmOtp}
                    disabled={processing || otpCode.length < 4}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase font-mono text-[10px] tracking-widest rounded-xl transition-all disabled:opacity-50"
                  >
                    {processing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Confirmer le paiement sécurisé"}
                  </button>
                </div>
              )}

              {step === "success" && (
                <div className="space-y-6 text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-black text-white uppercase tracking-wider">
                      DÉPÔT EFFECTUÉ AVEC SUCCÈS
                    </h3>
                    <p className="text-[#D4AF37] font-mono text-sm font-black">
                      +{Number(amount).toLocaleString()} FCFA
                    </p>
                    <p className="text-zinc-500 text-[11px] font-mono leading-relaxed max-w-xs mx-auto">
                      Les fonds ont été déposés sur votre solde disponible et sont instantanément exploitables.
                    </p>
                  </div>

                  <button
                    onClick={() => { setShowDepositModal(false); playSound("click"); }}
                    className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold uppercase font-mono text-[10px] tracking-widest rounded-xl transition-colors"
                  >
                    Fermer le guichet
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: MOBILE MONEY WITHDRAWAL */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 w-full max-w-md space-y-6 relative"
            >
              <button 
                onClick={() => { setShowWithdrawModal(false); playSound("click"); }}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <form onSubmit={handleWithdrawSubmit} className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto">
                    <ArrowDownLeft className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">
                    RETRAIT DE FONDS SOUVERAINS
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Retirez l'argent disponible vers votre compte Mobile Money
                  </p>
                </div>

                {/* Operator Choice */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
                    Opérateur de Destination
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
                        className={`py-2 text-[10px] font-black uppercase rounded-xl border text-center transition-all ${
                          operator === op.id 
                            ? `${op.color} bg-white/5 font-black scale-102` 
                            : "border-zinc-900 text-zinc-600 hover:border-zinc-800"
                        }`}
                      >
                        {op.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fields */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                        Montant à retirer (FCFA)
                      </label>
                      <span className="text-[9px] font-mono text-zinc-500">
                        Max disponible : {wallet.soldeDisponible.toLocaleString()} FCFA
                      </span>
                    </div>
                    <div className="relative">
                      <Coins className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
                      <input 
                        type="number" 
                        required
                        min="100"
                        max={wallet.soldeDisponible}
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Ex: 25000" 
                        className="w-full bg-black border border-zinc-900 rounded-xl pl-11 pr-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
                      Numéro de téléphone du destinataire (+225)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
                      <input 
                        type="tel" 
                        required
                        value={phoneNumber} 
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                        placeholder="0707070707" 
                        className="w-full bg-black border border-zinc-900 rounded-xl pl-11 pr-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={processing || !amount || Number(amount) > wallet.soldeDisponible || !phoneNumber}
                  className="w-full py-4 bg-[#D4AF37] hover:bg-[#B48F17] text-black font-black uppercase font-mono text-[10px] tracking-widest rounded-xl transition-all disabled:opacity-50"
                >
                  {processing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Déclencher le virement sécurisé"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
