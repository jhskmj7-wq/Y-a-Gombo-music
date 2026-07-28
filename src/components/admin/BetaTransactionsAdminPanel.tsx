import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Search, 
  Wallet, 
  User,
  Coins,
  ArrowUpRight,
  FileText
} from "lucide-react";
import { db } from "../../lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, getDoc, setDoc, addDoc, updateDoc } from "firebase/firestore";
import { recordWalletTransaction } from "../../lib/financial";
import { audioSynth } from "../../lib/audio";

interface WalletDepositRequest {
  id: string;
  uid: string;
  userName: string;
  userPhoto?: string;
  gomboId?: string;
  afriId?: string;
  montant: number;
  createdAt: string;
  reference: string;
  operator?: string;
  phoneNumber?: string;
  status: string;
}

interface BetaTransactionsAdminPanelProps {
  currentUser?: any;
}

export const BetaTransactionsAdminPanel: React.FC<BetaTransactionsAdminPanelProps> = ({
  currentUser
}) => {
  const [requests, setRequests] = useState<WalletDepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Real-time Firestore Listener on `walletDepositRequests`
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "walletDepositRequests"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: WalletDepositRequest[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          uid: data.uid || data.userId || "",
          userName: data.userName || "Membre Gombo",
          userPhoto: data.userPhoto || "",
          gomboId: data.gomboId || "GB-0000",
          afriId: data.afriId || "AF-0000",
          montant: Number(data.montant || data.amount || 0),
          createdAt: data.createdAt || new Date().toISOString(),
          reference: data.reference || "DEP-000",
          operator: data.operator || "wave",
          phoneNumber: data.phoneNumber || "",
          status: data.status || data.statut || "pending"
        });
      });
      setRequests(list);
      setLoading(false);
    }, (err) => {
      console.warn("Wallet deposit requests real-time sync error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleValidateDeposit = async (req: WalletDepositRequest) => {
    setActionLoadingId(req.id);
    try {
      const adminName = currentUser?.displayName || currentUser?.name || "Super Fondateur";
      const nowIso = new Date().toISOString();
      const dateStr = new Date().toLocaleDateString('fr-FR');
      const timeStr = new Date().toLocaleTimeString('fr-FR');

      // 1. Credit user's wallet soldeDisponible and depots
      const userRef = doc(db, "users", req.uid);
      const userSnap = await getDoc(userRef);
      let currentDispo = 0;
      let currentDepots = 0;
      if (userSnap.exists()) {
        const uData = userSnap.data();
        currentDispo = uData.wallet?.soldeDisponible ?? 0;
        currentDepots = uData.wallet?.depots ?? 0;
      }
      const newDispo = currentDispo + req.montant;
      const newDepots = currentDepots + req.montant;

      await setDoc(userRef, {
        wallet: {
          soldeDisponible: newDispo,
          depots: newDepots
        }
      }, { merge: true });

      // 2. Record wallet transaction
      await recordWalletTransaction({
        userId: req.uid,
        userName: req.userName,
        type: "recharge_wallet",
        amount: req.montant,
        status: "success",
        reference: req.reference,
        description: `Recharge Wallet validée (${req.reference})`
      });

      // 3. Update deposit request status
      await updateDoc(doc(db, "walletDepositRequests", req.id), {
        status: "validated",
        statut: "validated",
        validatedAt: nowIso,
        validatedBy: adminName
      });

      // 4. Send notification to user
      await addDoc(collection(db, "notifications"), {
        userId: req.uid,
        title: "💳 Recharge Wallet Validée !",
        message: `Votre recharge de ${req.montant.toLocaleString('fr-FR')} FCFA a été validée et créditée sur votre Wallet.`,
        type: "payment_received",
        createdAt: nowIso,
        isRead: false
      });

      // 5. Record in Admin Audit Log
      await addDoc(collection(db, "adminAuditLogs"), {
        admin: adminName,
        user: req.userName,
        userId: req.uid,
        amount: req.montant,
        date: dateStr,
        time: timeStr,
        reference: req.reference,
        action: "VALIDATE_WALLET_DEPOSIT",
        createdAt: nowIso
      });

      try { audioSynth.playValidationSuccess(); } catch (_) {}
      showToast(`✅ Recharge de ${req.montant.toLocaleString('fr-FR')} FCFA validée et créditée !`);
    } catch (err: any) {
      showToast(`❌ Erreur: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRefuseDeposit = async (req: WalletDepositRequest) => {
    setActionLoadingId(req.id);
    try {
      const nowIso = new Date().toISOString();
      await updateDoc(doc(db, "walletDepositRequests", req.id), {
        status: "refused",
        statut: "refused",
        refusedAt: nowIso
      });

      await addDoc(collection(db, "notifications"), {
        userId: req.uid,
        title: "❌ Recharge Wallet Refusée",
        message: `Votre demande de recharge de ${req.montant.toLocaleString('fr-FR')} FCFA n'a pas pu être validée. Veuillez contacter le support si besoin.`,
        type: "payment_refused",
        createdAt: nowIso,
        isRead: false
      });

      showToast("❌ Recharge refusée.");
    } catch (err: any) {
      showToast(`❌ Erreur: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const term = (searchTerm || "").toLowerCase();
    const matchesSearch = 
      (r?.userName ?? "").toLowerCase().includes(term) ||
      (r?.gomboId ?? "").toLowerCase().includes(term) ||
      (r?.afriId ?? "").toLowerCase().includes(term) ||
      (r?.reference ?? "").toLowerCase().includes(term) ||
      (r?.phoneNumber ?? "").toLowerCase().includes(term);

    const matchesStatus = selectedStatusFilter === "all" || r.status === selectedStatusFilter;
    return matchesSearch && matchesStatus;
  });

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
                <Wallet className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-afri-text uppercase tracking-wider">
                  RECHARGES WALLET (BÊTA)
                </h2>
                <p className="text-xs text-afri-text-sec">
                  Validez instantanément les recharges Mobile Money des membres
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-afri-bg/70 border border-afri-border px-3.5 py-2 rounded-2xl text-xs font-mono text-afri-text-sec">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Guichet Bêta Actif</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-afri-text-sec" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher nom, GOMBO ID, référence..."
            className="w-full pl-10 pr-4 py-2 bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] rounded-2xl text-xs text-afri-text outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1">
          {[
            { id: "all", label: "Toutes" },
            { id: "pending", label: "⚡ En attente" },
            { id: "validated", label: "✅ Validées" },
            { id: "refused", label: "❌ Refusées" }
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

      {/* Requests List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center bg-afri-bg-sec border border-afri-border rounded-3xl space-y-2">
            <RefreshCw className="w-6 h-6 text-[#D4AF37] animate-spin mx-auto" />
            <p className="text-xs text-afri-text-sec font-mono">Chargement des recharges en temps réel...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-10 text-center bg-afri-bg-sec border border-afri-border rounded-3xl space-y-2">
            <Wallet className="w-8 h-8 text-afri-text-sec/40 mx-auto" />
            <p className="text-sm font-bold text-afri-text">Aucune demande de recharge trouvée.</p>
            <p className="text-xs text-afri-text-sec">Les nouvelles requêtes Mobile Money apparaîtront ici instantanément.</p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isLoading = actionLoadingId === req.id;
            const dateObj = new Date(req.createdAt);
            const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('fr-FR') : "Aujourd'hui";
            const timeStr = !isNaN(dateObj.getTime()) ? dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : "--:--";

            return (
              <motion.div
                key={req.id}
                layout
                className="bg-afri-bg-sec border border-afri-border rounded-3xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-[#D4AF37]/50 transition-all shadow-md"
              >
                <div className="flex items-center gap-4">
                  {req.userPhoto ? (
                    <img src={req.userPhoto} alt={req.userName} className="w-12 h-12 rounded-2xl object-cover border border-[#D4AF37]/30 shadow" />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-bold">
                      {req.userName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-afri-text uppercase font-sans">{req.userName}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-afri-bg border border-afri-border text-[#D4AF37] font-bold">
                        {req.gomboId}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-afri-bg border border-afri-border text-sky-400 font-bold">
                        {req.afriId}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-afri-text-sec flex-wrap">
                      <span>Réf: <strong className="text-afri-text">{req.reference}</strong></span>
                      <span>•</span>
                      <span>Opérateur: <strong className="uppercase text-afri-text">{req.operator}</strong> ({req.phoneNumber})</span>
                      <span>•</span>
                      <span>{dateStr} à {timeStr}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <span className="text-lg font-mono font-black text-[#D4AF37] block">
                      +{req.montant.toLocaleString('fr-FR')} FCFA
                    </span>
                    <span className={`inline-block text-[9px] font-mono py-0.5 px-2 rounded border uppercase font-bold ${
                      req.status === "validated" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                      req.status === "refused" ? "bg-rose-500/10 text-rose-400 border-rose-500/30" :
                      "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse"
                    }`}>
                      {req.status === "validated" ? "Validé" : req.status === "refused" ? "Refusé" : "En attente"}
                    </span>
                  </div>

                  {req.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleValidateDeposit(req)}
                        disabled={isLoading}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black font-mono rounded-xl transition-all cursor-pointer shadow flex items-center gap-1.5 active:scale-98 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Valider</span>
                      </button>

                      <button
                        onClick={() => handleRefuseDeposit(req)}
                        disabled={isLoading}
                        className="px-3 py-2.5 bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 text-xs font-black font-mono rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-98 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Refuser</span>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BetaTransactionsAdminPanel;
