import React, { useState, useEffect } from "react";
import { 
  X, Check, AlertCircle, Sparkles, Loader2, 
  History, Target, ShieldCheck, TrendingUp, Coins,
  ShoppingBag, HelpCircle, ArrowRight
} from "lucide-react";
import { collection, query, where, getDocs, doc, setDoc, updateDoc, onSnapshot, serverTimestamp, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { GawaEngineService } from "../lib/GawaEngineService";
import { GawaPack, GawaMission, UserGawaMission, GawaTransaction } from "../types";
import AndroidBottomSheet from "./common/AndroidBottomSheet";
import { AndroidCard } from "./common/AndroidComponents";

interface GawaCenterProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  isAuthorizedSuperFounder?: boolean;
  playSound?: (name: string) => void;
}

export default function GawaCenter({
  isOpen,
  onClose,
  currentUser,
  isAuthorizedSuperFounder = false,
  playSound = () => {}
}: GawaCenterProps) {
  const [activeTab, setActiveTab] = useState<"buy" | "history" | "missions" | "admin">("buy");
  const [wallet, setWallet] = useState<any>(null);
  const [gawaPacks, setGawaPacks] = useState<GawaPack[]>([]);
  const [gawaHistory, setGawaHistory] = useState<GawaTransaction[]>([]);
  const [missions, setMissions] = useState<GawaMission[]>([]);
  const [userMissions, setUserMissions] = useState<UserGawaMission[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Purchase states
  const [selectedPack, setSelectedPack] = useState<GawaPack | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [successDetails, setSuccessDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Mission states
  const [evaluatingMissions, setEvaluatingMissions] = useState<Record<string, boolean>>({});
  const [missionToast, setMissionToast] = useState<{ success: boolean; message: string } | null>(null);

  // Admin states
  const [adminUserId, setAdminUserId] = useState("");
  const [adminAmount, setAdminAmount] = useState<number | "">("");
  const [adminType, setAdminType] = useState<"ADMIN_GRANT" | "BONUS" | "MISSION" | "ADMIN_ADJUSTMENT">("ADMIN_GRANT");
  const [adminDesc, setAdminDesc] = useState("");
  const [adminProcessing, setAdminProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen || !currentUser?.uid) return;

    // 1. Subscribe to User Wallet
    const unsubWallet = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setWallet(data.wallet || { soldeDisponible: data.walletBalance || 0, soldeGawa: 0 });
      }
    });

    // 2. Fetch Gawa Packs
    const fetchPacks = async () => {
      try {
        const packs = await GawaEngineService.getGawaPacks();
        setGawaPacks(packs);
      } catch (err) {
        console.error("Error fetching gawa packs:", err);
      }
    };
    fetchPacks();

    // 3. Subscribe to Gawa History
    const unsubHistory = GawaEngineService.subscribeUserGawaHistory(currentUser.uid, (records) => {
      setGawaHistory(records.slice(0, 50) as GawaTransaction[]);
    });

    // 4. Subscribe to Missions
    const unsubMissions = onSnapshot(collection(db, "waiting_features"), (snap) => {
      // Assuming missions are in waiting_features or a dedicated collection
      // For this implementation, we will use GawaEngineService if it has a way, 
      // or just fetch from a 'gawaMissions' collection.
    });
    
    // Fallback: Fetch missions from engine
    const fetchMissions = async () => {
      try {
        const allMissions = await GawaEngineService.getMissions();
        setMissions(allMissions);
        
        const completed = await GawaEngineService.getUserMissions(currentUser.uid);
        setUserMissions(completed);
      } catch (err) {
        console.error("Error fetching missions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMissions();

    return () => {
      unsubWallet();
      unsubHistory();
      unsubMissions();
    };
  }, [isOpen, currentUser]);

  const handleBuyPack = async (pack: GawaPack) => {
    if (!currentUser?.uid || !wallet) return;
    
    if (wallet.soldeDisponible < pack.priceFCFA) {
      setError(`Solde insuffisant. Requis: ${pack.priceFCFA} FCFA.`);
      return;
    }

    setPurchasing(true);
    setError(null);
    try {
      const res = await GawaEngineService.purchaseGawaPack(currentUser.uid, pack.id);
      setSuccessDetails({
        amount: pack.gawaAmount,
        packName: pack.name,
        price: pack.priceFCFA,
        newFCFA: res.balanceAfterFCFA,
        newGawa: res.balanceAfterGawa
      });
      playSound("success");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'achat.");
      playSound("error");
    } finally {
      setPurchasing(false);
    }
  };

  const handleClaimMission = async (mission: GawaMission) => {
    if (!currentUser?.uid) return;
    
    setEvaluatingMissions(prev => ({ ...prev, [mission.id]: true }));
    try {
      const res = await GawaEngineService.evaluateAndClaimMission(currentUser.uid, mission.id);
      if (res.success) {
        setMissionToast({ 
          success: true, 
          message: `Félicitations ! +${mission.rewardGawa} Gawa ajoutés.` 
        });
        setUserMissions(prev => [...prev, { userId: currentUser.uid, missionId: mission.id, completedAt: new Date().toISOString() } as any]);
        playSound("success");
      } else {
        setMissionToast({ success: false, message: "Mission non complétée ou déjà réclamée." });
      }
    } catch (err: any) {
      setMissionToast({ success: false, message: err.message });
    } finally {
      setEvaluatingMissions(prev => ({ ...prev, [mission.id]: false }));
    }
  };

  const handleAdminAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUserId || !adminAmount) return;
    
    setAdminProcessing(true);
    try {
      await GawaEngineService.grantGawaException(
        adminUserId,
        Number(adminAmount),
        adminType,
        adminDesc,
        currentUser.uid
      );
      setAdminAmount("");
      setAdminDesc("");
      alert("Ajustement Gawa effectué !");
    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setAdminProcessing(false);
    }
  };

  if (!isOpen) return null;

  const gawaBalance = wallet?.soldeGawa || 0;

  return (
    <>
      <AndroidBottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="CENTRE GAWA"
        subtitle="Monnaie virtuelle d'AFRIGOMBO"
      >
        <div className="space-y-5 pb-6">
          {/* Header Balance Info Block */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 block uppercase font-bold tracking-wider">Solde Wallet</span>
              <p className="text-lg font-black font-mono text-[#D4AF37]">{(wallet?.soldeDisponible || 0).toLocaleString('fr-FR')} FCFA</p>
            </div>
            <div className="space-y-1 border-l border-zinc-800 pl-4">
              <span className="text-[10px] font-mono text-zinc-500 block uppercase font-bold tracking-wider">Solde Gawa</span>
              <p className="text-lg font-black font-mono text-amber-400">{gawaBalance.toLocaleString('fr-FR')} G</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-zinc-800/60 pb-1 gap-2">
            <button
              onClick={() => { setActiveTab("buy"); playSound("click"); }}
              className={`flex-1 py-2 text-center text-[10px] font-black uppercase font-mono tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === "buy" ? "border-amber-500 text-amber-500" : "border-transparent text-zinc-500"
              }`}
            >
              🛒 Packs
            </button>
            <button
              onClick={() => { setActiveTab("history"); playSound("click"); }}
              className={`flex-1 py-2 text-center text-[10px] font-black uppercase font-mono tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === "history" ? "border-amber-500 text-amber-500" : "border-transparent text-zinc-500"
              }`}
            >
              📜 Historique
            </button>
            <button
              onClick={() => { setActiveTab("missions"); playSound("click"); }}
              className={`flex-1 py-2 text-center text-[10px] font-black uppercase font-mono tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === "missions" ? "border-amber-500 text-amber-500" : "border-transparent text-zinc-500"
              }`}
            >
              🎯 Missions
            </button>
            {isAuthorizedSuperFounder && (
              <button
                onClick={() => { setActiveTab("admin"); playSound("click"); }}
                className={`flex-1 py-2 text-center text-[10px] font-black uppercase font-mono tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "admin" ? "border-red-500 text-red-500" : "border-transparent text-zinc-500"
                }`}
              >
                👑 Admin
              </button>
            )}
          </div>

          {/* BUY SECTION */}
          {activeTab === "buy" && (
            <div className="space-y-4">
              <p className="text-[11px] text-zinc-400 text-center leading-relaxed font-mono">
                Utilisez vos Gawa pour activer les roues, débloquer des boosts ou participer à des événements exclusifs.
              </p>
              
              <div className="space-y-3">
                {gawaPacks.map(pack => (
                  <div key={pack.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-white uppercase">{pack.name}</h4>
                      <p className="text-xl font-black text-amber-400 font-mono">+{pack.gawaAmount} G</p>
                    </div>
                    <button
                      onClick={() => setSelectedPack(pack)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-[10px] font-black uppercase font-mono transition-all"
                    >
                      {pack.priceFCFA.toLocaleString()} FCFA
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HISTORY SECTION */}
          {activeTab === "history" && (
            <div className="space-y-3">
              {gawaHistory.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs font-mono">
                  Aucun mouvement Gawa.
                </div>
              ) : (
                gawaHistory.map(tx => (
                  <div key={tx.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-[11px] font-bold text-white">{tx.description}</p>
                      <p className="text-[9px] text-zinc-500 font-mono">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`font-mono font-black ${tx.amount > 0 ? "text-emerald-400" : "text-amber-400"}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount} G
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* MISSIONS SECTION */}
          {activeTab === "missions" && (
            <div className="space-y-4">
              {missionToast && (
                <div className={`p-3 rounded-xl border text-[10px] font-mono ${missionToast.success ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
                  {missionToast.message}
                </div>
              )}
              <div className="space-y-3">
                {missions.map(m => {
                  const done = userMissions.some(um => um.missionId === m.id);
                  return (
                    <div key={m.id} className={`p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between gap-4 ${done ? "opacity-50" : ""}`}>
                      <div className="flex-1">
                        <h4 className="text-[11px] font-black text-white uppercase">{m.title}</h4>
                        <p className="text-[10px] text-zinc-400 leading-tight mt-1">{m.description}</p>
                        <span className="text-[10px] font-black text-amber-400 mt-2 block">+{m.rewardGawa} G</span>
                      </div>
                      <button
                        disabled={done || evaluatingMissions[m.id]}
                        onClick={() => handleClaimMission(m)}
                        className="px-3 py-2 bg-[#D4AF37] text-black rounded-xl text-[9px] font-black uppercase font-mono disabled:opacity-50"
                      >
                        {evaluatingMissions[m.id] ? "..." : done ? "Terminé" : "Réclamer"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ADMIN SECTION */}
          {activeTab === "admin" && isAuthorizedSuperFounder && (
            <form onSubmit={handleAdminAdjust} className="p-4 bg-zinc-950 border border-red-500/20 rounded-2xl space-y-4">
              <h3 className="text-[10px] font-black text-red-400 uppercase font-mono border-b border-zinc-800 pb-2">Ajustement Gawa</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="UID Utilisateur"
                  value={adminUserId}
                  onChange={e => setAdminUserId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="number"
                  placeholder="Montant (G)"
                  value={adminAmount}
                  onChange={e => setAdminAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={adminDesc}
                  onChange={e => setAdminDesc(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button
                  type="submit"
                  disabled={adminProcessing}
                  className="w-full py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase font-mono"
                >
                  {adminProcessing ? "Traitement..." : "Appliquer"}
                </button>
              </div>
            </form>
          )}
        </div>
      </AndroidBottomSheet>

      {/* Confirmation Modal */}
      {selectedPack && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-6">
          <AndroidCard className="w-full max-w-xs p-6 space-y-4 text-center border-[#D4AF37]/50">
            <h3 className="text-sm font-black text-amber-400 uppercase font-mono">Confirmer l'achat</h3>
            <p className="text-xs text-zinc-300 font-mono">
              Acheter {selectedPack.gawaAmount} Gawa pour {selectedPack.priceFCFA} FCFA ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedPack(null)}
                className="flex-1 py-3 bg-zinc-800 text-zinc-400 rounded-xl text-[10px] font-black uppercase font-mono"
              >
                Annuler
              </button>
              <button
                disabled={purchasing}
                onClick={() => handleBuyPack(selectedPack)}
                className="flex-1 py-3 bg-amber-500 text-black rounded-xl text-[10px] font-black uppercase font-mono"
              >
                {purchasing ? "..." : "Confirmer"}
              </button>
            </div>
          </AndroidCard>
        </div>
      )}

      {/* Success Modal */}
      {successDetails && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-6">
          <AndroidCard className="w-full max-w-xs p-6 space-y-4 text-center border-emerald-500/50">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="text-sm font-black text-emerald-400 uppercase font-mono">Achat Réussi !</h3>
            <p className="text-xs text-zinc-300 font-mono">
              Vous avez reçu {successDetails.amount} Gawa.
            </p>
            <button
              onClick={() => setSuccessDetails(null)}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase font-mono"
            >
              D'accord
            </button>
          </AndroidCard>
        </div>
      )}
    </>
  );
}
