import React, { useState, useEffect } from "react";
import { 
  Coins, Sparkles, Plus, Check, X, ShieldCheck, 
  TrendingUp, RefreshCw, Layers, ShoppingBag, 
  UserCheck, AlertCircle, Search, History, ArrowUpRight, ArrowDownRight, Edit3, Trash2
} from "lucide-react";
import { 
  collection, doc, onSnapshot, query, orderBy, limit, setDoc, deleteDoc, getDocs 
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { GawaEngineService } from "../../lib/GawaEngineService";
import { GawaPack, GawaHistoryRecord } from "../../types";

interface AdminGawaCenterProps {
  currentUser?: any;
  userEmail?: string;
  audioSynth?: any;
}

export default function AdminGawaCenter({
  currentUser,
  userEmail = "admin@afrigombo.ci",
  audioSynth
}: AdminGawaCenterProps) {
  const [packs, setPacks] = useState<GawaPack[]>([]);
  const [history, setHistory] = useState<GawaHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // New/Edit Pack Modal State
  const [showPackModal, setShowPackModal] = useState(false);
  const [editingPack, setEditingPack] = useState<GawaPack | null>(null);
  const [packName, setPackName] = useState("");
  const [packPrice, setPackPrice] = useState<number | "">(200);
  const [packAmount, setPackAmount] = useState<number | "">(20);
  const [packEnabled, setPackEnabled] = useState(true);
  const [isSubmittingPack, setIsSubmittingPack] = useState(false);

  // Founder Adjustment / Grant Form
  const [grantUserId, setGrantUserId] = useState("");
  const [grantAmount, setGrantAmount] = useState<number | "">(100);
  const [grantType, setGrantType] = useState<"ADMIN_GRANT" | "BONUS" | "MISSION" | "ADMIN_ADJUSTMENT">("ADMIN_GRANT");
  const [grantDesc, setGrantDesc] = useState("Bonus exceptionnel du Fondateur");
  const [isGranting, setIsGranting] = useState(false);
  const [grantNotice, setGrantNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // History Filter
  const [searchQuery, setSearchQuery] = useState("");

  // Real-time Subscriptions
  useEffect(() => {
    setLoading(true);

    // 1. Gawa Packs Stream
    const unsubPacks = GawaEngineService.subscribeGawaPacks((data) => {
      setPacks(data);
      setLoading(false);
    });

    // 2. Gawa History Stream
    const historyRef = collection(db, "gawaHistory");
    const qHistory = query(historyRef, orderBy("createdAt", "desc"), limit(100));
    const unsubHistory = onSnapshot(
      qHistory,
      (snapshot) => {
        const records: GawaHistoryRecord[] = [];
        snapshot.forEach((docSnap) => {
          records.push({ id: docSnap.id, ...docSnap.data() } as GawaHistoryRecord);
        });
        setHistory(records);
      },
      (err) => {
        console.error("Error fetching Gawa history stream:", err);
      }
    );

    return () => {
      unsubPacks();
      unsubHistory();
    };
  }, []);

  // Pack Edit/Create Handler
  const handleOpenPackModal = (pack?: GawaPack) => {
    if (pack) {
      setEditingPack(pack);
      setPackName(pack.name);
      setPackPrice(pack.priceFCFA);
      setPackAmount(pack.gawaAmount);
      setPackEnabled(pack.enabled);
    } else {
      setEditingPack(null);
      setPackName("Nouveau Pack Gawa");
      setPackPrice(500);
      setPackAmount(55);
      setPackEnabled(true);
    }
    setShowPackModal(true);
  };

  const handleSavePack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packName || !packPrice || !packAmount) return;

    setIsSubmittingPack(true);
    try {
      const packId = editingPack ? editingPack.id : `gawa_pack_${Date.now()}`;
      const newPack: GawaPack = {
        id: packId,
        name: packName,
        priceFCFA: Number(packPrice),
        gawaAmount: Number(packAmount),
        enabled: packEnabled,
        createdAt: editingPack?.createdAt || new Date().toISOString()
      };

      await GawaEngineService.createOrUpdateGawaPack(newPack);
      try { audioSynth?.playValidationSuccess?.(); } catch (err) {}
      setShowPackModal(false);
    } catch (err: any) {
      alert("Erreur lors de la sauvegarde du pack: " + (err.message || err));
    } finally {
      setIsSubmittingPack(false);
    }
  };

  const handleTogglePackEnabled = async (pack: GawaPack) => {
    try {
      await GawaEngineService.createOrUpdateGawaPack({
        ...pack,
        enabled: !pack.enabled
      });
      try { audioSynth?.playValidationSuccess?.(); } catch (err) {}
    } catch (err: any) {
      alert("Erreur lors de la modification du statut: " + err.message);
    }
  };

  // Founder Exception Grant Execution
  const handleExecuteGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantUserId.trim() || !grantAmount || Number(grantAmount) === 0) {
      setGrantNotice({ type: "error", text: "Veuillez indiquer un ID Utilisateur et un montant valide." });
      return;
    }

    setIsGranting(true);
    setGrantNotice(null);

    try {
      const adminIdentifier = currentUser?.uid || userEmail || "Founder";
      const res = await GawaEngineService.grantGawaException(
        grantUserId.trim(),
        Number(grantAmount),
        grantType,
        grantDesc,
        adminIdentifier
      );

      if (res.success) {
        setGrantNotice({ 
          type: "success", 
          text: `✨ +${grantAmount} GAWA attribués avec succès à ${grantUserId.substring(0, 10)}... Nouveau solde: ${res.balanceAfterGawa} GAWA.` 
        });
        setGrantUserId("");
        try { audioSynth?.playValidationSuccess?.(); } catch (err) {}
      } else {
        setGrantNotice({ type: "error", text: res.error || "Échec de l'attribution." });
      }
    } catch (err: any) {
      setGrantNotice({ type: "error", text: err.message || "Erreur lors de la transaction." });
    } finally {
      setIsGranting(false);
    }
  };

  // Metrics Calculations
  const totalGawaPurchased = history
    .filter(h => h.type === "achat_gawa")
    .reduce((acc, h) => acc + (h.gawaAmount || h.amount || 0), 0);

  const totalFcfaCollected = history
    .filter(h => h.type === "achat_gawa")
    .reduce((acc, h) => acc + (h.priceFCFA || 0), 0);

  const totalGawaGranted = history
    .filter(h => h.type !== "achat_gawa")
    .reduce((acc, h) => acc + (h.amount || 0), 0);

  const filteredHistory = history.filter(h => 
    !searchQuery || 
    h.userId?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    h.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-6 text-left animate-fadeIn">
      {/* HEADER */}
      <div className="p-5 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 border border-amber-500/30 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 border border-amber-400/40 rounded-2xl text-amber-400">
            <Coins className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase text-white font-mono tracking-tight flex items-center gap-2">
              🟡 CENTRE GAWA — TRÔNE DU FONDATEUR
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Gestion souveraine des packs, tarification FCFA, règles d'attribution et journal Firestore
            </p>
          </div>
        </div>

        <button
          onClick={() => handleOpenPackModal()}
          className="px-4 py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-mono font-black text-xs uppercase rounded-2xl transition shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un Pack Gawa</span>
        </button>
      </div>

      {/* METRICS STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
            Packs Actifs
          </span>
          <p className="text-2xl font-black font-mono text-amber-400">
            {packs.filter(p => p.enabled).length} / {packs.length}
          </p>
          <p className="text-[9px] text-zinc-500 font-mono">Disponibles pour achat immédiat</p>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
            Recettes FCFA (Achat Gawa)
          </span>
          <p className="text-2xl font-black font-mono text-emerald-400">
            {totalFcfaCollected.toLocaleString("fr-FR")} FCFA
          </p>
          <p className="text-[9px] text-zinc-500 font-mono">Ventes directes en FCFA</p>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
            Gawa Vendus
          </span>
          <p className="text-2xl font-black font-mono text-[#D4AF37]">
            +{totalGawaPurchased.toLocaleString("fr-FR")} GAWA
          </p>
          <p className="text-[9px] text-zinc-500 font-mono">Distribués via packs FCFA</p>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
            Attributions / Bonus
          </span>
          <p className="text-2xl font-black font-mono text-sky-400">
            +{totalGawaGranted.toLocaleString("fr-FR")} GAWA
          </p>
          <p className="text-[9px] text-zinc-500 font-mono">Grants d'administration & missions</p>
        </div>
      </div>

      {/* PACKS & GRANT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PACKS MANAGEMENT (2 COLS) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-black uppercase text-amber-400 tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Catalogue des Packs Gawa
            </h3>
            <span className="text-[10px] font-mono text-zinc-500">Mise à jour Firestore instantanée</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {packs.map((pack) => (
              <div 
                key={pack.id} 
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between h-[160px] relative overflow-hidden ${
                  pack.enabled 
                    ? "bg-zinc-900/70 border-amber-500/30 hover:border-amber-400" 
                    : "bg-zinc-950/40 border-zinc-800 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-amber-500 uppercase tracking-widest block">
                      {pack.id}
                    </span>
                    <h4 className="text-base font-black text-white font-mono mt-0.5">{pack.name}</h4>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black font-mono uppercase ${
                    pack.enabled 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                      : "bg-zinc-800 text-zinc-500"
                  }`}>
                    {pack.enabled ? "ACTIF" : "INACTIF"}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-2 border-t border-zinc-800/80">
                  <div>
                    <p className="text-2xl font-black text-[#D4AF37] font-mono">
                      +{pack.gawaAmount} <span className="text-xs">GAWA</span>
                    </p>
                    <p className="text-xs font-bold text-zinc-400 font-mono">{pack.priceFCFA.toLocaleString()} FCFA</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePackEnabled(pack)}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase transition cursor-pointer ${
                        pack.enabled 
                          ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" 
                          : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40"
                      }`}
                    >
                      {pack.enabled ? "Désactiver" : "Activer"}
                    </button>

                    <button
                      onClick={() => handleOpenPackModal(pack)}
                      className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* EXCEPTION GRANT TOOL (1 COL) */}
        <div className="p-5 bg-zinc-900/80 border border-amber-500/30 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-xs font-mono font-black text-white uppercase tracking-wider">
                ⚡ Attribution Exceptionnelle GAWA
              </h3>
              <p className="text-[10px] font-mono text-zinc-400">Incrémenter / Décrémenter le solde d'un citoyen</p>
            </div>
          </div>

          <form onSubmit={handleExecuteGrant} className="space-y-3">
            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                UID Utilisateur Cible
              </label>
              <input
                type="text"
                value={grantUserId}
                onChange={(e) => setGrantUserId(e.target.value)}
                placeholder="Ex: usr_92837498"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                  Quantité GAWA
                </label>
                <input
                  type="number"
                  value={grantAmount}
                  onChange={(e) => setGrantAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="100"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-amber-400 font-black placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                  Type Opération
                </label>
                <select
                  value={grantType}
                  onChange={(e) => setGrantType(e.target.value as any)}
                  className="w-full px-2 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="ADMIN_GRANT">Grant Fondateur</option>
                  <option value="BONUS">Bonus Spécial</option>
                  <option value="MISSION">Récompense Mission</option>
                  <option value="ADMIN_ADJUSTMENT">Ajustement Compte</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                Motif / Description
              </label>
              <input
                type="text"
                value={grantDesc}
                onChange={(e) => setGrantDesc(e.target.value)}
                placeholder="Motif de l'attribution..."
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            {grantNotice && (
              <div className={`p-3 rounded-xl text-xs font-mono font-bold ${
                grantNotice.type === "success" 
                  ? "bg-emerald-950/80 border border-emerald-500/50 text-emerald-300" 
                  : "bg-rose-950/80 border border-rose-500/50 text-rose-300"
              }`}>
                {grantNotice.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isGranting}
              className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-mono text-xs font-black uppercase rounded-xl transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isGranting ? "Execution..." : "⚡ Exécuter l'Attribution Atomic"}
            </button>
          </form>
        </div>
      </div>

      {/* TRANSACTION HISTORY STREAM */}
      <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-mono font-black uppercase text-white tracking-wider">
              📜 Journal Firestore des Transactions GAWA
            </h3>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par UID / Motif..."
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Utilisateur</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Quantité</th>
                <th className="py-2 px-3">Prix FCFA</th>
                <th className="py-2 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-xs font-mono">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    Aucune transaction Gawa trouvée
                  </td>
                </tr>
              ) : (
                filteredHistory.map((rec) => (
                  <tr key={rec.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-2.5 px-3 text-zinc-400 text-[10px]">
                      {new Date(rec.createdAt).toLocaleDateString("fr-FR")} {new Date(rec.createdAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white">
                      {rec.userId ? `${rec.userId.substring(0, 10)}...` : "—"}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        rec.type === "achat_gawa" 
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                          : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                      }`}>
                        {rec.type || "grant"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-black text-amber-400">
                      +{rec.gawaAmount || rec.amount} GAWA
                    </td>
                    <td className="py-2.5 px-3 font-bold text-zinc-300">
                      {rec.priceFCFA ? `${rec.priceFCFA} FCFA` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400 truncate max-w-xs">
                      {rec.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL EDIT / CREATE PACK */}
      {showPackModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-amber-500/40 rounded-3xl p-6 space-y-4 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-mono font-black uppercase text-amber-400 flex items-center gap-2">
                <Coins className="w-4 h-4" />
                <span>{editingPack ? "Éditer le Pack Gawa" : "Nouveau Pack Gawa"}</span>
              </h3>
              <button
                onClick={() => setShowPackModal(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePack} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                  Nom du Pack
                </label>
                <input
                  type="text"
                  value={packName}
                  onChange={(e) => setPackName(e.target.value)}
                  placeholder="Ex: Pack Prestige"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    Prix (FCFA)
                  </label>
                  <input
                    type="number"
                    value={packPrice}
                    onChange={(e) => setPackPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="500"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-emerald-400 font-black focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    Quantité (GAWA)
                  </label>
                  <input
                    type="number"
                    value={packAmount}
                    onChange={(e) => setPackAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="55"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-amber-400 font-black focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="packEnabledCheck"
                  checked={packEnabled}
                  onChange={(e) => setPackEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 text-amber-500 focus:ring-0"
                />
                <label htmlFor="packEnabledCheck" className="text-xs font-mono text-zinc-300 font-bold cursor-pointer">
                  Activer ce pack immédiatement dans la boutique
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowPackModal(false)}
                  className="px-4 py-2 bg-zinc-900 text-zinc-400 text-xs font-mono rounded-xl hover:bg-zinc-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPack}
                  className="px-5 py-2 bg-[#D4AF37] hover:bg-amber-400 text-black font-mono font-black text-xs uppercase rounded-xl transition shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isSubmittingPack ? "Enregistrement..." : "Sauvegarder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
