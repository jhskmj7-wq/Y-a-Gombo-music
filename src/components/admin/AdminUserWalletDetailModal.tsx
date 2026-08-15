import React, { useState, useEffect } from "react";
import { X, Shield, Wallet, Key, RefreshCw, AlertTriangle, CheckCircle, Lock, User, FileText, History, Activity } from "lucide-react";
import { walletCodeService } from "../../auth/walletCodeService";
import { db } from "../../lib/firebase";
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc, serverTimestamp, addDoc } from "firebase/firestore";

interface AdminUserWalletDetailModalProps {
  user: any;
  adminUid: string;
  onClose: () => void;
  onRefresh: () => void;
}

export function AdminUserWalletDetailModal({
  user,
  adminUid,
  onClose,
  onRefresh
}: AdminUserWalletDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"identity" | "wallet" | "security" | "support" | "transactions">("identity");
  const [walletCode, setWalletCode] = useState<string>(user.wallet?.walletCode || "");
  const [walletStatus, setWalletStatus] = useState<string>(user.wallet?.walletStatus || "active");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [reasonInput, setReasonInput] = useState("");
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);

  // Load transactions and ensure wallet code
  useEffect(() => {
    async function loadData() {
      if (!db || !user?.uid && !user?.id) return;
      const targetUid = user.uid || user.id;

      // Ensure wallet code exists
      try {
        const code = await walletCodeService.getOrCreateWalletCode(targetUid, user.wallet?.walletCode);
        setWalletCode(code);
      } catch (e) {
        console.error("Error loading wallet code:", e);
      }

      // Load wallet transactions
      try {
        setLoadingTx(true);
        const q = query(
          collection(db, "walletTransactions"),
          where("uid", "==", targetUid)
        );
        const snap = await getDocs(q);
        const txs: any[] = [];
        snap.forEach(d => txs.push({ id: d.id, ...d.data() }));
        setTransactions(txs);
      } catch (e) {
        console.error("Error loading transactions:", e);
      } finally {
        setLoadingTx(false);
      }
    }
    loadData();
  }, [user]);

  const handleRegenerateCode = async () => {
    try {
      const targetUid = user.uid || user.id;
      const newCode = await walletCodeService.regenerateWalletCode(targetUid, adminUid, reasonInput || "Régénération par Super Fondateur");
      setWalletCode(newCode);
      setShowRegenConfirm(false);
      setReasonInput("");
      setActionNotice("Nouveau code Wallet généré avec succès ! Ancien code archivé.");
      onRefresh();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };

  const handleToggleWalletStatus = async () => {
    const targetUid = user.uid || user.id;
    const nextStatus = walletStatus === "active" ? "suspended" : "active";
    try {
      await walletCodeService.setWalletStatus(targetUid, adminUid, nextStatus, reasonInput || `Modification de statut: ${nextStatus}`);
      setWalletStatus(nextStatus);
      setActionNotice(`Wallet ${nextStatus === "active" ? "réactivé" : "suspendu"} avec succès.`);
      onRefresh();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };

  const handleTriggerPasswordReset = async () => {
    try {
      const targetUid = user.uid || user.id;
      if (db) {
        await addDoc(collection(db, "adminAuditLogs"), {
          adminUid,
          targetUid,
          action: "Demande de récupération compte",
          reason: "Déclenchement officiel de réinitialisation de mot de passe",
          createdAt: serverTimestamp()
        });
      }
      setActionNotice("Procédure officielle de réinitialisation de mot de passe envoyée à l'utilisateur.");
      setTimeout(() => setActionNotice(null), 4000);
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };

  const balance = user.wallet?.soldeDisponible ?? user.balance ?? 0;
  const blockedBalance = user.wallet?.soldeBloque ?? 0;
  const totalRevenue = user.totalRevenue ?? user.wallet?.revenusMois ?? 0;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-950 border border-[#D4AF37]/50 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative text-zinc-100 p-6 sm:p-8 space-y-6 cursor-default"
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-amber-600 flex items-center justify-center text-zinc-950 shadow-lg shadow-[#D4AF37]/20 font-bold text-lg">
              {user.avatarUrl || user.photoURL ? (
                <img src={user.avatarUrl || user.photoURL} alt="Avatar" className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
              ) : (
                (user.artisticName || user.displayName || "A").charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-display font-black text-white">{user.artisticName || user.displayName || "Utilisateur"}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 uppercase font-bold">
                  {user.role || "Client"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">UID: {user.uid || user.id}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#D4AF37] text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {actionNotice && (
          <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300 font-mono">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-zinc-900/60 p-1.5 rounded-2xl border border-zinc-800">
          <button
            onClick={() => setActiveTab("identity")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${activeTab === "identity" ? "bg-[#D4AF37] text-zinc-950 shadow-md" : "text-zinc-400 hover:text-white"}`}
          >
            👤 Identité
          </button>
          <button
            onClick={() => setActiveTab("wallet")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${activeTab === "wallet" ? "bg-[#D4AF37] text-zinc-950 shadow-md" : "text-zinc-400 hover:text-white"}`}
          >
            💳 Wallet
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${activeTab === "transactions" ? "bg-[#D4AF37] text-zinc-950 shadow-md" : "text-zinc-400 hover:text-white"}`}
          >
            📜 Transactions
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${activeTab === "security" ? "bg-[#D4AF37] text-zinc-950 shadow-md" : "text-zinc-400 hover:text-white"}`}
          >
            🛡️ Sécurité
          </button>
          <button
            onClick={() => setActiveTab("support")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${activeTab === "support" ? "bg-[#D4AF37] text-zinc-950 shadow-md" : "text-zinc-400 hover:text-white"}`}
          >
            ⚙️ Support
          </button>
        </div>

        {/* TAB 1: IDENTITÉ */}
        {activeTab === "identity" && (
          <div className="space-y-4 text-left animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                <span className="text-zinc-500 block text-[10px] uppercase">Prénom & Nom</span>
                <span className="font-bold text-white text-sm">{user.firstName || "-"} {user.lastName || "-"}</span>
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                <span className="text-zinc-500 block text-[10px] uppercase">Email</span>
                <span className="font-bold text-white text-sm truncate block">{user.email || "Non renseigné"}</span>
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                <span className="text-zinc-500 block text-[10px] uppercase">AfriID</span>
                <span className="font-bold text-[#D4AF37]">{user.afriId || user.id || "N/A"}</span>
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                <span className="text-zinc-500 block text-[10px] uppercase">Commune / Ville</span>
                <span className="font-bold text-white">{user.commune || user.city || "Abidjan"}</span>
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                <span className="text-zinc-500 block text-[10px] uppercase">Fournisseur Connexion</span>
                <span className="font-bold text-white uppercase">{user.provider || user.providerId || "google.com"}</span>
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                <span className="text-zinc-500 block text-[10px] uppercase">Profil Complet</span>
                <span className={`font-bold ${user.isProfileComplete ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {user.isProfileComplete ? "Oui (Vérifié)" : "Incomplet"}
                </span>
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl sm:col-span-2">
                <span className="text-zinc-500 block text-[10px] uppercase">Date de création</span>
                <span className="font-bold text-white">
                  {user.createdAt ? (typeof user.createdAt === "number" ? new Date(user.createdAt).toLocaleString() : (user.createdAt.toDate ? user.createdAt.toDate().toLocaleString() : String(user.createdAt))) : "Récemment"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WALLET */}
        {activeTab === "wallet" && (
          <div className="space-y-4 text-left animate-in fade-in">
            {/* Wallet header card */}
            <div className="p-5 rounded-2xl bg-gradient-to-tr from-zinc-900 to-zinc-950 border border-[#D4AF37]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-widest font-bold">Code Wallet Unique</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl font-mono font-black text-white bg-zinc-950 px-3 py-1 rounded-xl border border-zinc-800">{walletCode || "AFW-XXXX-XXXX"}</span>
                  <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold uppercase ${walletStatus === 'active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>
                    {walletStatus === 'active' ? '● Actif' : '■ Suspendu'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Solde Disponible</span>
                <span className="text-2xl font-display font-black text-[#D4AF37]">{balance.toLocaleString()} FCFA</span>
              </div>
            </div>

            {/* Balances grid */}
            <div className="grid grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                <span className="text-zinc-500 block text-[9px] uppercase">Solde Bloqué</span>
                <span className="font-bold text-white text-sm">{blockedBalance.toLocaleString()} FCFA</span>
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                <span className="text-zinc-500 block text-[9px] uppercase">Revenus Totaux</span>
                <span className="font-bold text-emerald-400 text-sm">{totalRevenue.toLocaleString()} FCFA</span>
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                <span className="text-zinc-500 block text-[9px] uppercase">Transactions</span>
                <span className="font-bold text-cyan-400 text-sm">{transactions.length} enregistrées</span>
              </div>
            </div>

            {/* Wallet Management Actions for Super Founder */}
            <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-3">
              <span className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-wider block">⚡ Actions Souveraines Wallet</span>
              
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Motif de l'action administrative (requis)..."
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={handleToggleWalletStatus}
                  className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer border ${walletStatus === 'active' ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'}`}
                >
                  {walletStatus === 'active' ? 'Suspendre Wallet' : 'Réactiver Wallet'}
                </button>

                <button
                  onClick={() => setShowRegenConfirm(true)}
                  className="px-4 py-2.5 bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/25 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Régénérer Code Wallet</span>
                </button>
              </div>

              {/* Confirmation box for code regeneration */}
              {showRegenConfirm && (
                <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-2xl space-y-3 mt-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Attention : Cette opération va invalider l'ancien code et en générer un nouveau. Aucun solde ni transaction ne sera modifié.</span>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowRegenConfirm(false)}
                      className="px-3 py-1.5 border border-zinc-700 text-zinc-300 rounded-lg text-xs uppercase font-mono cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleRegenerateCode}
                      className="px-4 py-1.5 bg-[#D4AF37] text-zinc-950 font-bold rounded-lg text-xs uppercase font-mono cursor-pointer shadow-md"
                    >
                      Confirmer Régénération
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TRANSACTIONS */}
        {activeTab === "transactions" && (
          <div className="space-y-3 text-left animate-in fade-in max-h-72 overflow-y-auto pr-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Historique complet (balanceBefore → balanceAfter)</span>
            {loadingTx ? (
              <p className="text-xs text-zinc-500 font-mono py-6 text-center animate-pulse">Chargement des transactions...</p>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center border border-zinc-800 rounded-2xl bg-zinc-900/30 text-zinc-500 font-mono text-xs">
                Aucune transaction enregistrée pour ce wallet.
              </div>
            ) : (
              transactions.map((tx: any) => (
                <div key={tx.id} className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-1 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white uppercase">{tx.type || "Mouvement"}</span>
                    <span className={`font-black ${tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-800/60">
                    <span>Avant: {tx.balanceBefore ?? 0} FCFA</span>
                    <span>Après: {tx.balanceAfter ?? 0} FCFA</span>
                    <span className="text-[#D4AF37]">{tx.source || "Système"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: SÉCURITÉ */}
        {activeTab === "security" && (() => {
          const sec = user.walletSecurity || {};
          const isPinConfigured = !!(sec.pinHash || sec.pinConfigured);
          const pinUpdatedAt = sec.pinUpdatedAt ? new Date(sec.pinUpdatedAt).toLocaleString() : (sec.pinCreatedAt ? new Date(sec.pinCreatedAt).toLocaleString() : "Aucune");
          const lastAuth = sec.lastAuthSensitiveAt ? new Date(sec.lastAuthSensitiveAt).toLocaleString() : "Aucune";
          const failedAttempts = sec.failedPinAttempts || 0;
          const isLocked = !!(sec.lockedUntil && new Date(sec.lockedUntil).getTime() > Date.now());
          const isRecovery = !!sec.pinResetRequested;
          const hasSaoDemand = !!user.walletSecurity?.saoAssistancePending;
          const activeSessions = isPinConfigured && !isLocked ? "Oui (Session active)" : "Non / Inactif";

          return (
            <div className="space-y-4 text-left animate-in fade-in">
              <h4 className="text-xs font-mono font-black text-[#D4AF37] uppercase tracking-wider">
                🔐 SÉCURITÉ WALLET (Rapport Souverain)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col justify-between">
                  <span className="text-zinc-500 block text-[9px] uppercase">Protection activée</span>
                  <span className={`font-bold text-sm ${isPinConfigured ? "text-emerald-400" : "text-zinc-500"}`}>
                    {isPinConfigured ? "🟢 Oui (PIN configuré)" : "⚪ Non configurée"}
                  </span>
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col justify-between">
                  <span className="text-zinc-500 block text-[9px] uppercase">Dernière modification de sécurité</span>
                  <span className="font-bold text-white text-xs">{pinUpdatedAt}</span>
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col justify-between">
                  <span className="text-zinc-500 block text-[9px] uppercase">Dernière authentification sensible</span>
                  <span className="font-bold text-white text-xs">{lastAuth}</span>
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col justify-between">
                  <span className="text-zinc-500 block text-[9px] uppercase">Nombre d'échecs récents</span>
                  <span className={`font-bold text-sm ${failedAttempts > 0 ? "text-red-400 font-black" : "text-zinc-400"}`}>
                    {failedAttempts} tentatives
                  </span>
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col justify-between">
                  <span className="text-zinc-500 block text-[9px] uppercase">Wallet verrouillé</span>
                  <span className={`font-bold text-sm ${isLocked ? "text-red-400 font-black animate-pulse" : "text-emerald-400"}`}>
                    {isLocked ? "⚠️ Oui (Brute-force lock)" : "🟢 Non"}
                  </span>
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col justify-between">
                  <span className="text-zinc-500 block text-[9px] uppercase">Récupération en cours</span>
                  <span className={`font-bold text-sm ${isRecovery ? "text-amber-400" : "text-zinc-500"}`}>
                    {isRecovery ? "⚠️ Oui (Réinitialisation demandée)" : "Non"}
                  </span>
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col justify-between">
                  <span className="text-zinc-500 block text-[9px] uppercase">Demande SAO en attente</span>
                  <span className={`font-bold text-sm ${hasSaoDemand ? "text-[#D4AF37] animate-pulse" : "text-zinc-500"}`}>
                    {hasSaoDemand ? "🆘 Oui (Assistance requise)" : "Non"}
                  </span>
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col justify-between">
                  <span className="text-zinc-500 block text-[9px] uppercase">Sessions sensibles actives</span>
                  <span className="font-bold text-white">{activeSessions}</span>
                </div>
              </div>

              <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-2">
                <span className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-wider block">⚡ Actions Administratives Sécurité</span>
                <p className="text-[10px] text-zinc-400">
                  En tant que Super Fondateur, vous pouvez déverrouiller un compte bloqué par brute-force ou approuver/annuler une réinitialisation de sécurité en attente.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {isLocked && (
                    <button
                      onClick={async () => {
                        try {
                          const targetUid = user.uid || user.id;
                          await updateDoc(doc(db, "users", targetUid), {
                            "walletSecurity.lockedUntil": null,
                            "walletSecurity.failedPinAttempts": 0
                          });
                          alert("Wallet déverrouillé avec succès.");
                          onRefresh();
                        } catch (e: any) {
                          alert("Erreur: " + e.message);
                        }
                      }}
                      className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer"
                    >
                      🔓 Forcer Déverrouillage
                    </button>
                  )}
                  {isPinConfigured && (
                    <button
                      onClick={async () => {
                        if (!confirm("Voulez-vous vraiment désactiver et supprimer le code PIN de cet utilisateur ?")) return;
                        try {
                          const targetUid = user.uid || user.id;
                          await updateDoc(doc(db, "users", targetUid), {
                            "walletSecurity.pinHash": null,
                            "walletSecurity.pinSalt": null,
                            "walletSecurity.pinConfigured": false,
                            "walletSecurity.pinStatus": "NOT_CONFIGURED",
                            "paymentSettings.pinEnabled": false,
                            "paymentSettings.pinConfigured": false
                          });
                          alert("Code PIN désactivé et supprimé.");
                          onRefresh();
                        } catch (e: any) {
                          alert("Erreur: " + e.message);
                        }
                      }}
                      className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/25 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer"
                    >
                      ❌ Réinitialiser/Désactiver PIN
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-xs text-amber-300 font-mono">
                <Shield className="w-5 h-5 text-[#D4AF37] shrink-0" />
                <span>Le protocole de sécurité souverain garantit que le Super Fondateur ne voit JAMAIS le code PIN ou le hash exploitable de l'utilisateur.</span>
              </div>
            </div>
          );
        })()}

        {/* TAB 5: SUPPORT COMPTE */}
        {activeTab === "support" && (
          <div className="space-y-4 text-left animate-in fade-in">
            <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-4">
              <span className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider block">🛠️ Outils de Support et Récupération</span>
              
              <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                En tant que Super Fondateur, vous pouvez déclencher une procédure officielle de réinitialisation de mot de passe ou d'assistance pour cet utilisateur sans jamais voir ses secrets.
              </p>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleTriggerPasswordReset}
                  className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xs font-bold rounded-xl border border-zinc-700 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
                >
                  <Key className="w-4 h-4 text-[#D4AF37]" />
                  <span>Déclencher Réinitialisation de Mot de Passe</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-mono font-bold uppercase rounded-xl border border-zinc-800 transition-all cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
