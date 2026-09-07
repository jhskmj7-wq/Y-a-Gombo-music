import React, { useState, useEffect } from "react";
import { 
  Wallet, 
  ArrowUpRight, 
  Lock, 
  History, 
  Loader2, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  TrendingUp,
  AlertTriangle,
  Phone,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AndroidPageLayout } from "../layout/AndroidPageLayout";
import { AndroidCard } from "../layout/AndroidCard";
import { db } from "../../lib/firebase";
import { collection, query, where, getDocs, addDoc, onSnapshot, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getOrCreateCreditAccount, AfriSOSCreditAccount } from "../../lib/financial";

interface WalletViewProps {
  currentUserProfile: any;
  addToTerminal: (msg: string) => void;
  onBack?: () => void;
}

export default function WalletView({ 
  currentUserProfile, 
  addToTerminal,
  onBack 
}: WalletViewProps) {
  const uid = currentUserProfile?.uid || currentUserProfile?.id;
  const [account, setAccount] = useState<AfriSOSCreditAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(currentUserProfile?.phone || "");
  const [operator, setOperator] = useState<"wave" | "orange" | "mtn" | "moov">("wave");
  const [processing, setProcessing] = useState(false);
  const [depositStep, setDepositStep] = useState<"form" | "success">("form");
  const [depositRef, setDepositRef] = useState("");

  // Real-time listener for the safe credit account
  useEffect(() => {
    if (!uid) return;

    // Resolve or create account, then listen in real-time
    getOrCreateCreditAccount(uid).then(() => {
      const unsub = onSnapshot(doc(db, "AfriSOSCreditAccount", uid), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setAccount({
            userId: uid,
            availableCredits: typeof data.availableCredits === "number" ? data.availableCredits : 0,
            heldCredits: typeof data.heldCredits === "number" ? data.heldCredits : 0,
            currency: "XOF",
            createdAt: data.createdAt || "",
            updatedAt: data.updatedAt || ""
          });
        }
        setLoading(false);
      });

      return unsub;
    }).catch(err => {
      console.error("Error loading credit account", err);
      setLoading(false);
    });
  }, [uid]);

  // Real-time listener for ledger movements for history
  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, "AfriSOSCreditLedger"),
      where("userId", "==", uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort by creation date descending
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setTransactions(list);
    });

    return unsub;
  }, [uid]);

  // Handle prepaid credit deposit / topup request
  const handlePrepaidDepositRequest = async () => {
    const depositAmount = Number(amount);
    if (!depositAmount || depositAmount < 500) {
      alert("Le montant minimum de recharge est de 500 XOF.");
      return;
    }

    setProcessing(true);
    try {
      const reference = "REF-CRED-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const userName = currentUserProfile?.artisticName || currentUserProfile?.displayName || currentUserProfile?.name || "Membre Gombo";
      const userPhoto = currentUserProfile?.avatarUrl || currentUserProfile?.photoURL || "";
      const nowIso = new Date().toISOString();

      // Standardized deposit registration
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
        description: `Demande de recharge de crédit de ${depositAmount.toLocaleString('fr-FR')} XOF (${operator.toUpperCase()})`,
        operator: operator,
        phoneNumber: phoneNumber,
        createdAt: nowIso,
        timestamp: serverTimestamp(),
        conversationId: uid
      };

      const txRef = await addDoc(collection(db, "transactions"), txData);

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

      setDepositRef(reference);
      setDepositStep("success");
      addToTerminal(`[💳 CRÉDIT] Demande de recharge de ${depositAmount.toLocaleString('fr-FR')} XOF enregistrée. Réf: ${reference}`);
    } catch (err: any) {
      console.error("Deposit request failed", err);
      alert("Une erreur s'est produite lors de l'enregistrement de votre demande.");
    } finally {
      setProcessing(false);
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case "TOPUP": return "Recharge Crédit";
      case "SERVICE_PAYMENT": return "Paiement Service";
      case "SERVICE_HOLD": return "Réservation Crédit";
      case "HOLD_RELEASED": return "Libération Réservation";
      case "REFUND": return "Remboursement";
      default: return type;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case "TOPUP": return "text-emerald-500 bg-emerald-500/10";
      case "REFUND": return "text-emerald-400 bg-emerald-400/10";
      case "SERVICE_PAYMENT": return "text-rose-500 bg-rose-500/10";
      case "SERVICE_HOLD": return "text-amber-500 bg-amber-500/10";
      case "HOLD_RELEASED": return "text-blue-500 bg-blue-500/10";
      default: return "text-zinc-400 bg-zinc-500/10";
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-afri-bg p-6 text-center min-h-[300px]">
        <Loader2 className="w-8 h-8 text-afri-gold animate-spin mb-3" />
        <p className="text-xs uppercase font-mono tracking-wider text-afri-text-sec">Chargement de votre compte de crédit...</p>
      </div>
    );
  }

  const available = account?.availableCredits ?? 0;
  const held = account?.heldCredits ?? 0;

  return (
    <AndroidPageLayout title="Mon Portefeuille" onBack={onBack} scrollable={true} className="pb-safe bg-afri-bg">
      <div className="p-4 space-y-4">
        {/* Main Sovereign Balance Card */}
        <AndroidCard className="bg-gradient-to-br from-zinc-900 to-black border border-afri-border/60 p-5 rounded-2xl relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-afri-gold/5 rounded-full blur-3xl"></div>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase font-black text-[#D4AF37] tracking-widest block font-mono">
              COMPTE DE CRÉDIT PRÉPAYÉ
            </span>
            <Wallet className="w-5 h-5 text-afri-gold" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider font-mono">Solde Disponible</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-afri-text tracking-tight font-mono">
                {available.toLocaleString("fr-FR")}
              </span>
              <span className="text-sm font-black text-[#D4AF37] font-mono">XOF</span>
            </div>
          </div>

          {held > 0 && (
            <div className="mt-4 pt-3 border-t border-afri-border/40 flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-amber-500" />
                Réservations de crédit (Held)
              </span>
              <span className="font-bold text-amber-500">
                {held.toLocaleString("fr-FR")} XOF
              </span>
            </div>
          )}

          {/* Action Button: Recharge Only */}
          <div className="mt-5 grid grid-cols-1 gap-2">
            <button 
              onClick={() => {
                setDepositStep("form");
                setAmount("");
                setShowDepositModal(true);
              }}
              className="w-full bg-[#D4AF37] hover:bg-[#B8942A] text-black font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-afri-gold/10 hover:shadow-afri-gold/20 active:scale-[0.98]"
            >
              <ArrowUpRight className="w-4 h-4" />
              Recharger par Mobile Money
            </button>
          </div>
        </AndroidCard>

        {/* Security Info Label */}
        <div className="bg-zinc-950 border border-afri-border/30 rounded-xl p-3 flex gap-2.5 items-start">
          <Lock className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-afri-text font-mono">Sécurité de l'Héritage</h4>
            <p className="text-[10px] text-zinc-400 leading-relaxed font-mono">
              Vos crédits prépayés sont cryptés et immuables. Ils servent uniquement au paiement des services de l'application (validation de contrats, Gombos certifiés, abonnements et boosts). Les transferts et retraits d'argent direct ne sont pas autorisés par mesure de conformité réglementaire.
            </p>
          </div>
        </div>

        {/* History / Ledger Movements */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase font-black text-afri-text tracking-wider font-mono flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-zinc-400" />
              Grand Livre de Compte (Mouvements)
            </h3>
            <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono">XOF</span>
          </div>

          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {transactions.length === 0 ? (
              <div className="bg-zinc-900/30 border border-afri-border/30 rounded-xl p-6 text-center font-mono">
                <p className="text-[10px] text-zinc-500 uppercase">Aucun mouvement de crédit enregistré</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div 
                  key={tx.id}
                  className="bg-zinc-950 border border-afri-border/20 rounded-xl p-3 flex items-center justify-between gap-3 font-mono"
                >
                  <div className="min-w-0 flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getMovementColor(tx.type).split(' ')[0]}`}></span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-zinc-200 truncate block">
                          {getMovementLabel(tx.type)}
                        </span>
                        <span className={`text-[8px] uppercase px-1 py-0.2 rounded font-black ${
                          tx.status === "success" || tx.status === "validated" || tx.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {tx.status === "success" || tx.status === "validated" || tx.status === "PAID" ? "Validé" : "En Attente"}
                        </span>
                      </div>
                      <span className="text-[8px] text-zinc-500 block mt-0.5">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                  </div>

                  <span className={`text-xs font-black shrink-0 ${
                    tx.type === "TOPUP" || tx.type === "REFUND" || tx.type === "HOLD_RELEASED"
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}>
                    {tx.type === "TOPUP" || tx.type === "REFUND" || tx.type === "HOLD_RELEASED" ? "+" : "-"}
                    {tx.amount?.toLocaleString("fr-FR")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      <AnimatePresence>
        {showDepositModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-md bg-zinc-950 border border-afri-border/60 rounded-t-3xl p-6 space-y-4 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowDepositModal(false)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {depositStep === "form" ? (
                <div className="space-y-4 text-left">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-afri-text uppercase tracking-wider font-mono">
                      Recharger par Mobile Money
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      Saisissez le montant et votre numéro pour recharger votre compte de crédit prépayé.
                    </p>
                  </div>

                  <div className="space-y-2 font-mono">
                    <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block">Opérateur de Paiement</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["wave", "orange", "mtn", "moov"] as const).map((op) => (
                        <button
                          key={op}
                          onClick={() => setOperator(op)}
                          className={`py-2 px-1 rounded-xl text-[9px] font-black uppercase text-center border transition-all ${
                            operator === op 
                              ? "bg-afri-gold text-black border-afri-gold scale-105" 
                              : "bg-zinc-900 text-zinc-400 border-afri-border hover:bg-zinc-850"
                          }`}
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 font-mono">
                    <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block">Montant (XOF)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        placeholder="Ex: 5000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={processing}
                        className="w-full bg-zinc-900 border border-afri-border/60 rounded-xl px-3 py-2.5 text-xs font-mono text-afri-text focus:outline-none focus:border-afri-gold placeholder:text-zinc-600 font-bold"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-afri-gold font-black">XOF</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 font-mono">
                    <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block">Numéro Mobile Money</label>
                    <div className="relative">
                      <div className="absolute left-3 top-2.5 flex items-center gap-1.5 text-zinc-500">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <input 
                        type="tel"
                        placeholder="Ex: 0707070707"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={processing}
                        className="w-full bg-zinc-900 border border-afri-border/60 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono text-afri-text focus:outline-none focus:border-afri-gold placeholder:text-zinc-600 font-bold"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handlePrepaidDepositRequest}
                    disabled={processing}
                    className="w-full bg-afri-gold hover:bg-[#B8942A] text-black font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] disabled:opacity-50 font-mono mt-2"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Traitement sécurisé...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Confirmer la Demande
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center py-6 space-y-4 font-mono text-left">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>

                  <div className="space-y-1 text-center">
                    <h3 className="text-sm font-black text-afri-text uppercase tracking-wider">
                      Demande Enregistrée !
                    </h3>
                    <p className="text-[10px] text-zinc-400">
                      Votre demande de recharge de crédit prépayé a été soumise au Grand Livre souverain.
                    </p>
                  </div>

                  <div className="bg-zinc-900 border border-afri-border/40 rounded-xl p-3 text-center space-y-1">
                    <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold">Référence Unique</span>
                    <span className="text-xs font-black text-afri-gold block font-mono select-all">
                      {depositRef}
                    </span>
                  </div>

                  <p className="text-[9px] text-zinc-500 text-center leading-relaxed">
                    Dès confirmation de la transaction par l'administration, vos crédits seront instantanément ajoutés à votre solde disponible.
                  </p>

                  <button 
                    onClick={() => setShowDepositModal(false)}
                    className="w-full bg-zinc-900 hover:bg-zinc-850 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all"
                  >
                    Fermer la Fenêtre
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AndroidPageLayout>
  );
}
