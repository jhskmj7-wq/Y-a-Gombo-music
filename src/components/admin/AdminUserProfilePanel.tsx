import React, { useState, useEffect } from "react";
import { 
  X, ShieldAlert, Award, CreditCard, ShieldCheck, UserX, UserCheck, 
  BookOpen, FolderHeart, MessageSquare, History, Check, Loader2, ArrowUpRight, ArrowDownLeft
} from "lucide-react";
import { db } from "../../lib/firebase";
import { 
  doc, updateDoc, collection, query, where, getDocs, getDoc, addDoc 
} from "firebase/firestore";

interface AdminUserProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  userUid: string;
  onRefreshProfile?: () => void;
}

export default function AdminUserProfilePanel({
  isOpen,
  onClose,
  userUid,
  onRefreshProfile
}: AdminUserProfilePanelProps) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  // Real Firestore lists
  const [posts, setPosts] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [walletHistory, setWalletHistory] = useState<any[]>([]);
  const [premiumHistory, setPremiumHistory] = useState<any[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  const [activeSubTab, setActiveSubTab] = useState<"general" | "history" | "actions">("general");
  const [modMessage, setModMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !userUid) return;
    setLoading(true);
    setModMessage(null);

    const loadData = async () => {
      try {
        // 1. User Profile Document
        const userRef = doc(db, "users", userUid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setProfile({ uid: userSnap.id, ...userSnap.data() });
        }

        // 2. Posts (Publications)
        const postsQuery = query(collection(db, "posts"), where("authorId", "==", userUid));
        const postsSnap = await getDocs(postsQuery);
        setPosts(postsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // 3. Applications (Candidatures)
        const appsQuery = query(collection(db, "casting_applications"), where("userId", "==", userUid));
        const appsSnap = await getDocs(appsQuery);
        setApplications(appsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // 4. Contracts (Contrats)
        const contractsQueryArtist = query(collection(db, "contracts"), where("artistId", "==", userUid));
        const contractsQueryClient = query(collection(db, "contracts"), where("clientId", "==", userUid));
        const [contractsSnapArtist, contractsSnapClient] = await Promise.all([
          getDocs(contractsQueryArtist),
          getDocs(contractsQueryClient)
        ]);
        const allContracts = [
          ...contractsSnapArtist.docs.map(d => ({ id: d.id, ...d.data() })),
          ...contractsSnapClient.docs.map(d => ({ id: d.id, ...d.data() }))
        ];
        // Deduplicate
        const uniqueContracts = Array.from(new Map(allContracts.map(item => [item.id, item])).values());
        setContracts(uniqueContracts);

        // 5. Wallet History (Transactions)
        const transactionsQuery = query(collection(db, "transactions"), where("userId", "==", userUid));
        const transactionsSnap = await getDocs(transactionsQuery);
        setWalletHistory(transactionsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // 6. Security Alerts (Signalements)
        const alertsQuery = query(collection(db, "security_alerts"), where("userId", "==", userUid));
        const alertsSnap = await getDocs(alertsQuery);
        setSecurityAlerts(alertsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // 7. Deposits & Withdrawals (from betaTransactions)
        const betaTxQuery = query(collection(db, "betaTransactions"), where("uid", "==", userUid));
        const betaTxSnap = await getDocs(betaTxQuery);
        const betaTxs = betaTxSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setDeposits(betaTxs.filter((tx: any) => tx.type === "deposit"));
        setWithdrawals(betaTxs.filter((tx: any) => tx.type === "withdrawal"));

        // 8. Premium History
        const premiumQuery = query(collection(db, "premium_history") || collection(db, "premiumHistory"), where("userId", "==", userUid));
        try {
          const premiumSnap = await getDocs(premiumQuery);
          setPremiumHistory(premiumSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch {
          setPremiumHistory([]);
        }

      } catch (err) {
        console.error("Error loading user panel data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, userUid]);

  const handleTogglePremium = async () => {
    if (!profile) return;
    const isNowPremium = !(profile.isPremium || profile.premium);
    try {
      const userRef = doc(db, "users", profile.uid);
      await updateDoc(userRef, {
        isPremium: isNowPremium,
        premium: isNowPremium
      });
      
      // Log actions in premium history
      await addDoc(collection(db, "premiumHistory"), {
        userId: profile.uid,
        action: isNowPremium ? "grant_premium" : "revoke_premium",
        grantedBy: "admin_souverain",
        timestamp: new Date().toISOString()
      });

      // Log in general activity logs
      await addDoc(collection(db, "admin_logs"), {
        action: isNowPremium ? "grant_premium" : "revoke_premium",
        targetUserId: profile.uid,
        targetUserName: `${profile.firstName || ""} ${profile.lastName || ""}`,
        timestamp: new Date().toISOString()
      });

      setProfile(prev => ({ ...prev, isPremium: isNowPremium, premium: isNowPremium }));
      setModMessage(`Statut Premium mis à jour avec succès : ${isNowPremium ? "👑 Premium" : "Standard"}`);
      if (onRefreshProfile) onRefreshProfile();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la modification du statut Premium");
    }
  };

  const handleToggleSuspension = async () => {
    if (!profile) return;
    const isNowSuspended = !profile.isSuspended;
    try {
      const userRef = doc(db, "users", profile.uid);
      await updateDoc(userRef, {
        isSuspended: isNowSuspended
      });

      await addDoc(collection(db, "admin_logs"), {
        action: isNowSuspended ? "suspend_user" : "unsuspend_user",
        targetUserId: profile.uid,
        targetUserName: `${profile.firstName || ""} ${profile.lastName || ""}`,
        timestamp: new Date().toISOString()
      });

      setProfile(prev => ({ ...prev, isSuspended: isNowSuspended }));
      setModMessage(`Compte ${isNowSuspended ? "⏸️ Suspendu" : "🟢 Réactivé"} avec succès`);
      if (onRefreshProfile) onRefreshProfile();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suspension / réactivation");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-afri-bg/85 backdrop-blur-md z-[9999] flex items-center justify-end">
      <div className="w-full max-w-2xl bg-afri-bg border-l border-afri-border h-full flex flex-col shadow-2xl relative animate-slideLeft">
        
        {/* Header */}
        <div className="p-4 border-b border-afri-border flex items-center justify-between shrink-0 bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#D4AF37]" />
            <div>
              <h3 className="text-sm font-black text-afri-text uppercase tracking-wider">Panneau Souverain Utilisateur</h3>
              <p className="text-[10px] text-afri-text-muted font-mono">Détails et Contrôle de Compte</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-afri-bg-ter hover:bg-zinc-700 text-afri-text-sec hover:text-afri-text transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
            <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
            <p className="text-xs text-afri-text-sec font-mono">Chargement des données souveraines...</p>
          </div>
        ) : !profile ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2">
            <ShieldAlert className="w-10 h-10 text-rose-500" />
            <p className="text-xs text-afri-text-sec">Le profil de cet utilisateur n'a pas pu être chargé.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Quick Profile Summary Card */}
            <div className="p-5 border-b border-afri-border flex items-center gap-4 bg-gradient-to-r from-zinc-900/60 to-transparent">
              <img 
                src={profile.avatarUrl || profile.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
                alt="" 
                className="w-16 h-16 rounded-full object-cover border-2 border-[#D4AF37] shadow-lg shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-afri-text uppercase truncate">
                    {profile.firstName || ""} {profile.lastName || "Membre Gombo"}
                  </h4>
                  {profile.isPremium || profile.premium ? (
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[8px] font-black uppercase rounded-full border border-amber-500/20">
                      👑 Premium
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-afri-bg-ter text-afri-text-sec text-[8px] font-black uppercase rounded-full">
                      Standard
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#D4AF37] font-mono mt-0.5">@{profile.artisticName || "Artiste"}</p>
                
                <div className="flex items-center gap-3 mt-2 text-[10px] text-afri-text-sec font-mono">
                  <span>AFRI ID: <span className="text-afri-text-sec font-bold">{profile.afriId || "Non défini"}</span></span>
                  <span>GOMBO ID: <span className="text-afri-text-sec font-bold">{profile.gomboId?.id || "Non défini"}</span></span>
                </div>
              </div>
            </div>

            {/* Custom Navigation Sub-Tabs */}
            <div className="border-b border-afri-border bg-afri-bg flex p-1 shrink-0">
              {[
                { id: "general", label: "Informations" },
                { id: "history", label: "Historiques & Stats" },
                { id: "actions", label: "Actions de Contrôle" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveSubTab(tab.id as any); setModMessage(null); }}
                  className={`flex-1 py-2 text-center text-xs font-bold uppercase transition rounded-xl cursor-pointer ${
                    activeSubTab === tab.id 
                      ? "bg-afri-bg-ter text-afri-text" 
                      : "text-afri-text-sec hover:text-afri-text"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Notification Bar */}
            {modMessage && (
              <div className="p-3 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-400 justify-center font-bold">
                <Check className="w-4 h-4" />
                <span>{modMessage}</span>
              </div>
            )}

            {/* Sub-Tab Content Stream */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              
              {/* TAB 1: GENERAL INFO */}
              {activeSubTab === "general" && (
                <div className="space-y-4">
                  {/* Grid fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-afri-bg-sec p-3 rounded-xl border border-zinc-800/80">
                      <span className="text-[9px] text-afri-text-muted uppercase font-bold block">Prénom / Nom :</span>
                      <span className="text-xs text-afri-text font-medium block mt-0.5">{profile.firstName || ""} {profile.lastName || ""}</span>
                    </div>
                    <div className="bg-afri-bg-sec p-3 rounded-xl border border-zinc-800/80">
                      <span className="text-[9px] text-afri-text-muted uppercase font-bold block">Nom artistique :</span>
                      <span className="text-xs text-[#D4AF37] font-medium block mt-0.5">{profile.artisticName || "N/A"}</span>
                    </div>
                    <div className="bg-afri-bg-sec p-3 rounded-xl border border-zinc-800/80">
                      <span className="text-[9px] text-afri-text-muted uppercase font-bold block">Email :</span>
                      <span className="text-xs text-afri-text block truncate mt-0.5">{profile.email || "N/A"}</span>
                    </div>
                    <div className="bg-afri-bg-sec p-3 rounded-xl border border-zinc-800/80">
                      <span className="text-[9px] text-afri-text-muted uppercase font-bold block">Téléphone :</span>
                      <span className="text-xs text-afri-text block mt-0.5">{profile.phone || "N/A"}</span>
                    </div>
                    <div className="bg-afri-bg-sec p-3 rounded-xl border border-zinc-800/80 col-span-2">
                      <span className="text-[9px] text-afri-text-muted uppercase font-bold block">Localisation :</span>
                      <span className="text-xs text-afri-text block mt-0.5">
                        {profile.ville || "Abidjan"}, {profile.commune || "N/A"} {profile.quartier ? `(${profile.quartier})` : ""}
                      </span>
                    </div>
                    <div className="bg-afri-bg-sec p-3 rounded-xl border border-zinc-800/80">
                      <span className="text-[9px] text-afri-text-muted uppercase font-bold block">Activité :</span>
                      <span className="text-xs text-afri-text block mt-0.5">{profile.specialty || "Musique"}</span>
                    </div>
                    <div className="bg-afri-bg-sec p-3 rounded-xl border border-zinc-800/80">
                      <span className="text-[9px] text-afri-text-muted uppercase font-bold block">Score de confiance :</span>
                      <span className={`text-xs font-bold block mt-0.5 ${profile.trustScore >= 90 ? "text-emerald-400" : profile.trustScore >= 70 ? "text-amber-400" : "text-rose-400"}`}>
                        {profile.trustScore !== undefined ? `${profile.trustScore}%` : "100%"}
                      </span>
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4 space-y-3">
                    <h5 className="text-xs font-bold text-afri-text uppercase tracking-wider">Identité Artistique</h5>
                    <div className="space-y-2">
                      <div>
                        <span className="text-[9px] text-afri-text-muted uppercase block">Styles musicaux :</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {profile.stylesMusicaux && profile.stylesMusicaux.length > 0 ? (
                            profile.stylesMusicaux.map((s: string) => (
                              <span key={s} className="px-2 py-0.5 bg-afri-bg-ter border border-afri-border text-[10px] text-afri-text-sec rounded-lg">{s}</span>
                            ))
                          ) : (
                            <span className="text-xs text-afri-text-muted italic">Aucun style enregistré</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] text-afri-text-muted uppercase block">Instruments maîtrisés :</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {profile.instruments && profile.instruments.length > 0 ? (
                            profile.instruments.map((i: string) => (
                              <span key={i} className="px-2 py-0.5 bg-afri-bg-ter border border-afri-border text-[10px] text-afri-text-sec rounded-lg">{i}</span>
                            ))
                          ) : (
                            <span className="text-xs text-afri-text-muted italic">Aucun instrument enregistré</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connection Details */}
                  <div className="bg-zinc-900/20 border border-afri-border rounded-2xl p-4 flex justify-between items-center text-xs text-afri-text-sec">
                    <div>
                      <span className="text-[9px] text-afri-text-muted uppercase font-black block">Dernière connexion :</span>
                      <span className="font-mono text-afri-text-sec">{profile.lastLoginAt || profile.lastSeen || "Inconnue"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-afri-text-muted uppercase font-black block">Statut Compte :</span>
                      <span className={`font-bold uppercase ${profile.isSuspended ? "text-amber-400" : "text-emerald-400"}`}>
                        {profile.isSuspended ? "⏸️ Suspendu" : "🟢 Actif"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: HISTORY & STATS */}
              {activeSubTab === "history" && (
                <div className="space-y-6">
                  {/* Key Counts Row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-afri-bg-sec text-center rounded-xl border border-afri-border">
                      <strong className="text-lg text-[#D4AF37] block font-mono">{posts.length}</strong>
                      <span className="text-[9px] text-afri-text-muted uppercase font-bold">Publications</span>
                    </div>
                    <div className="p-3 bg-afri-bg-sec text-center rounded-xl border border-afri-border">
                      <strong className="text-lg text-indigo-400 block font-mono">{applications.length}</strong>
                      <span className="text-[9px] text-afri-text-muted uppercase font-bold">Candidatures</span>
                    </div>
                    <div className="p-3 bg-afri-bg-sec text-center rounded-xl border border-afri-border">
                      <strong className="text-lg text-emerald-400 block font-mono">{contracts.length}</strong>
                      <span className="text-[9px] text-afri-text-muted uppercase font-bold">Contrats</span>
                    </div>
                  </div>

                  {/* Wallet details */}
                  <div className="bg-zinc-900/40 border border-afri-border rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-afri-border pb-2">
                      <h5 className="text-xs font-bold text-afri-text uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-emerald-400" /> Solde du Wallet
                      </h5>
                      <span className="text-xs text-emerald-400 font-mono font-bold">
                        {Number(profile.wallet?.soldeDisponible || 0).toLocaleString()} FCFA
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-afri-text-sec">
                      <div>Solde bloqué: <span className="text-afri-text-sec">{Number(profile.wallet?.soldeBloque || 0).toLocaleString()} FCFA</span></div>
                      <div>Total Dépôts: <span className="text-afri-text-sec">{deposits.length}</span></div>
                      <div>Total Retraits: <span className="text-afri-text-sec">{withdrawals.length}</span></div>
                    </div>
                  </div>

                  {/* Wallet History Table */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-mono font-black text-afri-text-sec uppercase tracking-widest">Historique du Wallet</h5>
                    <div className="bg-afri-bg border border-afri-border rounded-xl max-h-40 overflow-y-auto divide-y divide-afri-border">
                      {walletHistory.length === 0 ? (
                        <p className="p-3 text-center text-zinc-600 text-xs italic">Aucune transaction trouvée</p>
                      ) : (
                        walletHistory.map(tx => (
                          <div key={tx.id} className="p-2.5 flex justify-between items-center text-xs font-mono">
                            <div className="flex items-center gap-1.5">
                              {tx.type === "deposit" || tx.montant > 0 ? (
                                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <ArrowDownLeft className="w-3.5 h-3.5 text-rose-400" />
                              )}
                              <div>
                                <span className="text-afri-text-sec font-bold block uppercase">{tx.type || "transaction"}</span>
                                <span className="text-[9px] text-afri-text-muted">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : ""}</span>
                              </div>
                            </div>
                            <span className={`font-bold ${tx.montant > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              {tx.montant > 0 ? "+" : ""}{Number(tx.montant).toLocaleString()} FCFA
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Deposits & Withdrawals lists */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <span className="text-[9px] text-afri-text-muted uppercase font-black block">Dépôts récents :</span>
                      <div className="bg-afri-bg border border-afri-border rounded-xl p-2.5 space-y-1.5 text-[11px] font-mono max-h-32 overflow-y-auto">
                        {deposits.length === 0 ? (
                          <span className="text-zinc-600 italic">Aucun dépôt</span>
                        ) : (
                          deposits.map(d => (
                            <div key={d.id} className="flex justify-between text-afri-text-sec">
                              <span>{Number(d.montant).toLocaleString()} F</span>
                              <span className="text-emerald-400 uppercase font-bold text-[9px]">{d.statut || "valide"}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[9px] text-afri-text-muted uppercase font-black block">Retraits récents :</span>
                      <div className="bg-afri-bg border border-afri-border rounded-xl p-2.5 space-y-1.5 text-[11px] font-mono max-h-32 overflow-y-auto">
                        {withdrawals.length === 0 ? (
                          <span className="text-zinc-600 italic">Aucun retrait</span>
                        ) : (
                          withdrawals.map(w => (
                            <div key={w.id} className="flex justify-between text-afri-text-sec">
                              <span>{Number(w.montant).toLocaleString()} F</span>
                              <span className="text-amber-500 uppercase font-bold text-[9px]">{w.statut || "attente"}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Signalements History (Security alerts) */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-mono font-black text-afri-text-sec uppercase tracking-widest text-rose-400">Historique des Signalements / Alertes</h5>
                    <div className="bg-afri-bg border border-afri-border rounded-xl p-3 divide-y divide-afri-border max-h-32 overflow-y-auto">
                      {securityAlerts.length === 0 ? (
                        <p className="text-zinc-600 text-xs italic text-center py-1">Zéro signalement. Profil vierge.</p>
                      ) : (
                        securityAlerts.map(alert => (
                          <div key={alert.id} className="py-2 text-[11px] text-afri-text-sec font-mono flex items-center justify-between">
                            <div>
                              <span className="text-rose-400 font-bold block">{alert.type || "Infraction"}</span>
                              <span className="text-[10px]">{alert.details || "Bypass ou comportement non conforme"}</span>
                            </div>
                            <span className="text-afri-text-muted">{alert.createdAt ? new Date(alert.createdAt).toLocaleDateString() : ""}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ACTIONS */}
              {activeSubTab === "actions" && (
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-afri-text uppercase tracking-wider border-b border-afri-border pb-2">Contrôle du Compte</h5>

                  {/* Premium Actions */}
                  <div className="bg-zinc-900/40 p-4 rounded-2xl border border-afri-border flex items-center justify-between">
                    <div>
                      <strong className="text-xs text-afri-text block">Abonnement Premium</strong>
                      <span className="text-[10px] text-afri-text-muted">Donne accès à des privilèges et une réduction des taxes (1.5%)</span>
                    </div>
                    <button
                      onClick={handleTogglePremium}
                      className={`px-4 py-2 text-xs font-black uppercase rounded-xl transition-all cursor-pointer ${
                        profile.isPremium || profile.premium
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                          : "bg-[#D4AF37] hover:bg-amber-400 text-black shadow-md"
                      }`}
                    >
                      {profile.isPremium || profile.premium ? "Retirer Premium" : "Donner Premium 👑"}
                    </button>
                  </div>

                  {/* Suspensions Actions */}
                  <div className="bg-zinc-900/40 p-4 rounded-2xl border border-afri-border flex items-center justify-between">
                    <div>
                      <strong className="text-xs text-afri-text block">Statut d'Activité</strong>
                      <span className="text-[10px] text-afri-text-muted">Un membre suspendu ne peut plus se connecter ni candidater aux Gombos</span>
                    </div>
                    <button
                      onClick={handleToggleSuspension}
                      className={`px-4 py-2 text-xs font-black uppercase rounded-xl transition-all cursor-pointer ${
                        profile.isSuspended
                          ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-md"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
                      }`}
                    >
                      {profile.isSuspended ? "Réactiver 🟢" : "Suspendre ⏸️"}
                    </button>
                  </div>

                  {/* Other action links with alert redirects */}
                  <div className="pt-2">
                    <span className="text-[10px] font-mono font-black text-afri-text-muted uppercase tracking-widest block mb-2">Autres liens d'inspection</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => alert(`Inspection complète des transactions pour ${profile.firstName}`)}
                        className="p-3 bg-afri-bg hover:bg-afri-bg-sec border border-afri-border text-left text-xs text-afri-text-sec rounded-xl transition flex items-center justify-between"
                      >
                        <span>Voir Transactions</span>
                        <ArrowUpRight className="w-4 h-4 text-[#D4AF37]" />
                      </button>
                      <button
                        onClick={() => alert(`Inspection des publications de ${profile.firstName}`)}
                        className="p-3 bg-afri-bg hover:bg-afri-bg-sec border border-afri-border text-left text-xs text-afri-text-sec rounded-xl transition flex items-center justify-between"
                      >
                        <span>Voir Publications</span>
                        <ArrowUpRight className="w-4 h-4 text-[#D4AF37]" />
                      </button>
                      <button
                        onClick={() => alert(`Inspection des candidatures de ${profile.firstName}`)}
                        className="p-3 bg-afri-bg hover:bg-afri-bg-sec border border-afri-border text-left text-xs text-afri-text-sec rounded-xl transition flex items-center justify-between"
                      >
                        <span>Voir Candidatures</span>
                        <ArrowUpRight className="w-4 h-4 text-[#D4AF37]" />
                      </button>
                      <button
                        onClick={() => alert(`Consultation du Portfolio et des fichiers de ${profile.firstName}`)}
                        className="p-3 bg-afri-bg hover:bg-afri-bg-sec border border-afri-border text-left text-xs text-afri-text-sec rounded-xl transition flex items-center justify-between"
                      >
                        <span>Ouvrir Portfolio</span>
                        <ArrowUpRight className="w-4 h-4 text-[#D4AF37]" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
