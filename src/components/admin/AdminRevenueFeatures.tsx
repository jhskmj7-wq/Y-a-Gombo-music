import React, { useState, useEffect } from "react";
import { 
  Crown, ShieldCheck, AlertOctagon, ArrowLeft, Disc, 
  Award, Zap, DollarSign, Settings, Check, X, Sparkles, 
  SlidersHorizontal, Radio, Layers, Info, RefreshCw, ChevronRight, Eye, EyeOff,
  Plus, Edit3, Trash2, History, TrendingUp, Users, PlayCircle
} from "lucide-react";
import { SecurityService } from "../../lib/SecurityService";
import { RevenueFeaturesService } from "../../lib/RevenueFeaturesService";
import { WheelEngineService } from "../../lib/WheelEngineService";
import { RevenueFeatureItem, AfriGomboWheel, WheelSegment, WheelSpinRecord, WheelRewardType, WheelType } from "../../types";
import GomboWheelUserModal from "../common/GomboWheelUserModal";

interface AdminRevenueFeaturesProps {
  currentUser?: any;
  userEmail?: string;
  audioSynth?: any;
  onExit?: () => void;
}

export default function AdminRevenueFeatures({
  currentUser,
  userEmail = "",
  audioSynth,
  onExit
}: AdminRevenueFeaturesProps) {
  const [features, setFeatures] = useState<RevenueFeatureItem[]>([]);
  const [wheels, setWheels] = useState<AfriGomboWheel[]>([]);
  const [spins, setSpins] = useState<WheelSpinRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "wheel" | "premium_rewards" | "boosts" | "other_revenue">("all");
  
  // Wheel Admin Modals
  const [editingWheel, setEditingWheel] = useState<AfriGomboWheel | null>(null);
  const [isTestWheelOpen, setIsTestWheelOpen] = useState(false);
  const [spinHistorySearch, setSpinHistorySearch] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  // STRICT ZERO-TRUST FOUNDER AUTHORIZATION CHECK
  const isFounder = SecurityService.isFounder(currentUser) || 
                    SecurityService.isFounder(userEmail) || 
                    userEmail?.toLowerCase() === "jhs.kmj7@gmail.com" ||
                    currentUser?.email?.toLowerCase() === "jhs.kmj7@gmail.com";

  useEffect(() => {
    if (!isFounder) {
      SecurityService.logSecurityEvent({
        userId: currentUser?.uid || "unknown",
        userEmail: userEmail || currentUser?.email || "unknown",
        action: "unauthorized_revenue_features_access_attempt",
        severity: "critical",
        details: "Tentative d'accès non autorisée au module Revenus & Avantages",
        result: "blocked"
      });
      return;
    }

    const unsubFeats = RevenueFeaturesService.subscribeFeatures((data) => {
      setFeatures(data);
      setLoading(false);
    });

    const unsubWheels = WheelEngineService.subscribeWheels((data) => {
      setWheels(data);
    });

    const unsubSpins = WheelEngineService.subscribeSpinHistory((data) => {
      setSpins(data);
    });

    return () => {
      unsubFeats();
      unsubWheels();
      unsubSpins();
    };
  }, [isFounder, currentUser, userEmail]);

  if (!isFounder) {
    return (
      <div className="min-h-[100dvh] bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-500 mb-4 animate-pulse">
          <AlertOctagon className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black text-rose-500 uppercase tracking-widest mb-2">ACCÈS SOUVERAIN REFUSÉ</h1>
        <p className="text-xs text-zinc-400 max-w-md mb-6 leading-relaxed font-mono">
          Seul le Super Fondateur légitime d'AFRIGOMBO (<span className="text-[#D4AF37]">jhs.kmj7@gmail.com</span>) possède les privilèges pour gérer le module commercial Revenus & Avantages.
        </p>
        {onExit && (
          <button
            onClick={onExit}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase rounded-xl transition cursor-pointer flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retourner au Tableau Principal</span>
          </button>
        )}
      </div>
    );
  }

  const realStats = WheelEngineService.calculateRealStats(spins);

  const handleToggleFeatureEnable = async (feat: RevenueFeatureItem) => {
    try {
      const nextState = !feat.enabled;
      await RevenueFeaturesService.toggleFeatureEnabled(feat.id, nextState, userEmail || "jhs.kmj7@gmail.com");
      try { audioSynth?.playValidationSuccess?.(); } catch (e) {}
      setNotice(`Fonctionnalité "${feat.name}" ${nextState ? "ACTIVÉE" : "DÉSACTIVÉE"}`);
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      console.error("Error toggling feature state:", err);
    }
  };

  const handleToggleWheelEnable = async (wheel: AfriGomboWheel) => {
    try {
      const nextState = !wheel.enabled;
      await WheelEngineService.toggleWheelEnabled(wheel.id, nextState, userEmail || "jhs.kmj7@gmail.com");
      try { audioSynth?.playValidationSuccess?.(); } catch (e) {}
      setNotice(`Roue "${wheel.name}" ${nextState ? "ACTIVÉE" : "DÉSACTIVÉE"}`);
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      console.error("Error toggling wheel state:", err);
    }
  };

  const handleSaveWheelConfig = async () => {
    if (!editingWheel) return;

    const probVal = WheelEngineService.validateWheelProbabilities(editingWheel.segments);
    if (!probVal.isValid) {
      setNotice(`⚠️ Impossible de sauvegarder : ${probVal.error}`);
      return;
    }

    try {
      await WheelEngineService.saveWheel(editingWheel, userEmail || "jhs.kmj7@gmail.com");
      try { audioSynth?.playValidationSuccess?.(); } catch (e) {}
      setNotice(`Configuration de la roue "${editingWheel.name}" sauvegardée avec succès !`);
      setEditingWheel(null);
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      console.error("Error saving wheel config:", err);
    }
  };

  const handleAddSegmentToEditingWheel = () => {
    if (!editingWheel) return;
    const newSeg: WheelSegment = {
      id: `seg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      label: "Nouveau Segment",
      type: "PREMIUM_DAYS",
      rewardValue: 1,
      rewardDuration: 1,
      probability: 10,
      enabled: true,
      color: "#D4AF37"
    };
    setEditingWheel({
      ...editingWheel,
      segments: [...editingWheel.segments, newSeg]
    });
  };

  const handleRemoveSegmentFromEditingWheel = (segId: string) => {
    if (!editingWheel) return;
    setEditingWheel({
      ...editingWheel,
      segments: editingWheel.segments.filter((s) => s.id !== segId)
    });
  };

  const handleSegmentChange = (segId: string, field: keyof WheelSegment, value: any) => {
    if (!editingWheel) return;
    setEditingWheel({
      ...editingWheel,
      segments: editingWheel.segments.map((s) => {
        if (s.id === segId) {
          return { ...s, [field]: value };
        }
        return s;
      })
    });
  };

  const premiumRewards = features.filter((f) => f.type === "premium_rewards");
  const boosts = features.filter((f) => f.type === "boosts");
  const otherRevenues = features.filter((f) => f.type === "other_revenue" || f.type === "promotions");

  const filteredSpins = spins.filter((s) => {
    if (!spinHistorySearch) return true;
    const term = spinHistorySearch.toLowerCase();
    return (
      (s.userName && s.userName.toLowerCase().includes(term)) ||
      (s.userId && s.userId.toLowerCase().includes(term)) ||
      (s.rewardLabel && s.rewardLabel.toLowerCase().includes(term)) ||
      (s.wheelType && s.wheelType.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white p-3 sm:p-5 font-sans space-y-5 max-w-6xl mx-auto box-border pb-20">
      
      {/* Imperial Top Header */}
      <div className="bg-zinc-950 border border-[#D4AF37]/30 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-3.5 z-10">
          <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/40 rounded-2xl text-[#D4AF37] shadow-lg shadow-[#D4AF37]/10 shrink-0">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black uppercase text-white tracking-wider font-mono">
                Revenus & Avantages
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black uppercase bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                Super Fondateur
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Moteur commercial souverain : Roues AFRIGOMBO, Récompenses Premium & Boosts
            </p>
          </div>
        </div>

        {onExit && (
          <button
            onClick={onExit}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl text-xs font-bold uppercase transition cursor-pointer flex items-center gap-2 shrink-0 self-start md:self-auto"
          >
            <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
            <span>Fermer</span>
          </button>
        )}
      </div>

      {notice && (
        <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-[#D4AF37] rounded-xl text-xs font-mono font-bold animate-fadeIn flex items-center justify-between">
          <span>📍 {notice}</span>
          <button onClick={() => setNotice(null)} className="text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        {[
          { key: "all", label: "Toutes les offres", icon: Layers, count: features.length + wheels.length },
          { key: "wheel", label: "🎡 Moteur de Roue", icon: Disc, count: wheels.length },
          { key: "premium_rewards", label: "👑 Récompenses Premium", icon: Award, count: premiumRewards.length },
          { key: "boosts", label: "⚡ Boosts", icon: Zap, count: boosts.length },
          { key: "other_revenue", label: "💰 Autres Revenus", icon: DollarSign, count: otherRevenues.length },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? "bg-[#D4AF37] text-black font-black shadow-lg shadow-[#D4AF37]/20 border border-[#D4AF37]"
                  : "bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white hover:border-zinc-700"
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 ${isActive ? "text-black" : "text-[#D4AF37]"}`} />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                isActive ? "bg-black text-[#D4AF37]" : "bg-zinc-900 text-zinc-400"
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* SECTION A: GESTION DES ROUES (MOTEUR DE ROUE) */}
      {(activeTab === "all" || activeTab === "wheel") && (
        <section className="space-y-4">
          
          {/* Section Header */}
          <div className="bg-zinc-950 border border-[#D4AF37]/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-xl text-[#D4AF37]">
                  <Disc className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase text-[#D4AF37] tracking-wider font-mono">
                    SECTION A — 🎡 MOTEUR DE LA ROUE AFRIGOMBO
                  </h2>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    Configuration des roues (CLASSIQUE, PREMIUM, ÉLITE), segments, probabilités & tirages
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTestWheelOpen(true)}
                  className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer flex items-center gap-1.5"
                >
                  <PlayCircle className="w-4 h-4 text-emerald-400" />
                  <span>Tester le Tirage (Aperçu Joueur)</span>
                </button>
              </div>
            </div>

            {/* Real Stats Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono">
              <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-1">
                <span className="text-[9px] text-zinc-400 uppercase font-bold block">Tirages Totaux</span>
                <span className="text-sm font-black text-white">{realStats.totalParticipations}</span>
              </div>

              <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-1">
                <span className="text-[9px] text-zinc-400 uppercase font-bold block">Aujourd'hui</span>
                <span className="text-sm font-black text-emerald-400">{realStats.todayParticipations}</span>
              </div>

              <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-1">
                <span className="text-[9px] text-zinc-400 uppercase font-bold block">Revenus Générés</span>
                <span className="text-sm font-black text-[#D4AF37]">{realStats.totalRevenueFCFA} FCFA</span>
              </div>

              <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-1">
                <span className="text-[9px] text-zinc-400 uppercase font-bold block">Lots Distribués</span>
                <span className="text-sm font-black text-amber-300">{realStats.rewardsDistributedCount}</span>
              </div>

              <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-1">
                <span className="text-[9px] text-zinc-400 uppercase font-bold block">Top Récompense</span>
                <span className="text-xs font-bold text-zinc-200 truncate block">{realStats.topRewardLabel}</span>
              </div>

              <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-1">
                <span className="text-[9px] text-zinc-400 uppercase font-bold block">Joueurs Uniques</span>
                <span className="text-xs font-bold text-zinc-300">
                  {realStats.totalUniqueUsers} ({realStats.standardUsersCount} Std / {realStats.premiumUsersCount} Prem)
                </span>
              </div>
            </div>

            {/* Active Wheels Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {wheels.map((wheel) => {
                const probVal = WheelEngineService.validateWheelProbabilities(wheel.segments);
                return (
                  <div
                    key={wheel.id}
                    className="bg-zinc-900 border border-zinc-800 hover:border-[#D4AF37]/50 rounded-2xl p-4 space-y-3 flex flex-col justify-between transition shadow-lg"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                          {wheel.type}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase font-mono ${
                          wheel.enabled ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                        }`}>
                          {wheel.enabled ? "ACTIVÉE" : "DESACTIVÉE"}
                        </span>
                      </div>

                      <h3 className="text-xs font-black text-white font-mono">{wheel.name}</h3>
                      <p className="text-[11px] text-zinc-400 font-mono leading-relaxed line-clamp-2">{wheel.description}</p>

                      <div className="p-2.5 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-1 text-[10px] font-mono">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Coût :</span>
                          <span className="font-bold text-[#D4AF37]">{wheel.cost} FCFA</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Max / Jour :</span>
                          <span className="font-bold text-white">{wheel.maxDailyParticipations} tirage(s)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Segments :</span>
                          <span className="font-bold text-white">{wheel.segments?.length || 0} segments</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Probabilités :</span>
                          <span className={`font-bold ${probVal.isValid ? "text-emerald-400" : "text-rose-400"}`}>
                            {probVal.isValid ? `Valides (${probVal.totalProbability}%)` : "Invalides"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleWheelEnable(wheel)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-black uppercase transition cursor-pointer ${
                          wheel.enabled
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                        }`}
                      >
                        {wheel.enabled ? "Désactiver" : "Activer"}
                      </button>

                      <button
                        onClick={() => setEditingWheel(wheel)}
                        className="px-3 py-1.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase text-[10px] rounded-xl transition cursor-pointer flex items-center gap-1 shadow-md shadow-[#D4AF37]/20"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Configurer</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Spin History Log Table */}
            <div className="pt-4 border-t border-zinc-800 space-y-3 font-mono">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="text-xs font-black uppercase text-[#D4AF37] tracking-wider">
                    Historique des Tirages en Temps Réel ({spins.length})
                  </h3>
                </div>

                <input
                  type="text"
                  placeholder="Rechercher par membre, gain..."
                  value={spinHistorySearch}
                  onChange={(e) => setSpinHistorySearch(e.target.value)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {filteredSpins.length === 0 ? (
                <div className="p-6 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl text-center text-zinc-500 text-xs">
                  Aucun historique de tirage enregistré pour le moment.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-bold uppercase">
                        <th className="p-3">ID Spin</th>
                        <th className="p-3">Membre</th>
                        <th className="p-3">Roue</th>
                        <th className="p-3">Coût</th>
                        <th className="p-3">Gain Attribué</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900 text-zinc-300">
                      {filteredSpins.slice(0, 15).map((sp) => (
                        <tr key={sp.spinId} className="hover:bg-zinc-900/40 transition">
                          <td className="p-3 text-zinc-500 font-mono text-[10px]">{sp.spinId}</td>
                          <td className="p-3 font-bold text-white">
                            {sp.userName}
                            <span className="ml-1 text-[9px] text-zinc-500 uppercase">({sp.userAccountType || "std"})</span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[9px] bg-[#D4AF37]/10 text-[#D4AF37] font-bold">
                              {sp.wheelType}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-[#D4AF37]">
                            {sp.isExtraSpinUsed ? "Gratuit" : `${sp.cost} ${sp.currency}`}
                          </td>
                          <td className="p-3 font-bold text-emerald-400">
                            {sp.rewardLabel}
                          </td>
                          <td className="p-3 text-zinc-400 text-[10px]">
                            {new Date(sp.createdAt).toLocaleString("fr-FR")}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
                              {sp.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </section>
      )}

      {/* SECTION B: RÉCOMPENSES PREMIUM */}
      {(activeTab === "all" || activeTab === "premium_rewards") && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#D4AF37]" />
              <h2 className="text-xs font-black uppercase text-[#D4AF37] font-mono tracking-wider">
                SECTION B — 👑 RÉCOMPENSES PREMIUM ({premiumRewards.length})
              </h2>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">Privilèges & Codes d'Abonnement</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {premiumRewards.map((feat) => (
              <div
                key={feat.id}
                className="bg-zinc-950 border border-zinc-800/90 hover:border-[#D4AF37]/40 rounded-2xl p-4 space-y-3 flex flex-col justify-between transition shadow-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      {feat.category || "Privilège"}
                    </span>
                  </div>

                  <h3 className="text-xs font-black text-white font-mono">{feat.name}</h3>
                  <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">{feat.description}</p>
                </div>

                <div className="pt-2 border-t border-zinc-900 flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-mono font-bold uppercase ${
                    feat.enabled ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    ● {feat.enabled ? "ACTIVÉ" : "DÉSACTIVÉ"}
                  </span>

                  <button
                    onClick={() => handleToggleFeatureEnable(feat)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-black uppercase transition cursor-pointer flex items-center gap-1 ${
                      feat.enabled
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                    }`}
                  >
                    <span>{feat.enabled ? "Désactiver" : "Activer"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION C: BOOSTS */}
      {(activeTab === "all" || activeTab === "boosts") && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#D4AF37]" />
              <h2 className="text-xs font-black uppercase text-[#D4AF37] font-mono tracking-wider">
                SECTION C — ⚡ BOOSTS & AMPLIFICATEURS ({boosts.length})
              </h2>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">Amplification Radar & Profils</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {boosts.map((feat) => (
              <div
                key={feat.id}
                className="bg-zinc-950 border border-zinc-800/90 hover:border-[#D4AF37]/40 rounded-2xl p-4 space-y-3 flex flex-col justify-between transition shadow-lg"
              >
                <div className="space-y-2">
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                    {feat.category || "Boost"}
                  </span>

                  <h3 className="text-xs font-black text-white font-mono">{feat.name}</h3>
                  <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">{feat.description}</p>
                </div>

                <div className="pt-2 border-t border-zinc-900 flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-mono font-bold uppercase ${
                    feat.enabled ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    ● {feat.enabled ? "ACTIVÉ" : "DÉSACTIVÉ"}
                  </span>

                  <button
                    onClick={() => handleToggleFeatureEnable(feat)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-black uppercase transition cursor-pointer flex items-center gap-1 ${
                      feat.enabled
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                    }`}
                  >
                    <span>{feat.enabled ? "Désactiver" : "Activer"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION D: AUTRES REVENUS */}
      {(activeTab === "all" || activeTab === "other_revenue") && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#D4AF37]" />
              <h2 className="text-xs font-black uppercase text-[#D4AF37] font-mono tracking-wider">
                SECTION D — 💰 AUTRES SOURCES DE REVENUS ({otherRevenues.length})
              </h2>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">Packs, Tickets & Services Commercialisés</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherRevenues.map((feat) => (
              <div
                key={feat.id}
                className="bg-zinc-950 border border-zinc-800/90 hover:border-[#D4AF37]/40 rounded-2xl p-4 space-y-3 flex flex-col justify-between transition shadow-lg"
              >
                <div className="space-y-2">
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-teal-500/10 text-teal-400 border border-teal-500/30">
                    {feat.category || "Revenu"}
                  </span>

                  <h3 className="text-xs font-black text-white font-mono">{feat.name}</h3>
                  <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">{feat.description}</p>
                </div>

                <div className="pt-2 border-t border-zinc-900 flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-mono font-bold uppercase ${
                    feat.enabled ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    ● {feat.enabled ? "ACTIVÉ" : "DÉSACTIVÉ"}
                  </span>

                  <button
                    onClick={() => handleToggleFeatureEnable(feat)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-black uppercase transition cursor-pointer flex items-center gap-1 ${
                      feat.enabled
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                    }`}
                  >
                    <span>{feat.enabled ? "Désactiver" : "Activer"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* EDIT WHEEL CONFIGURATION MODAL */}
      {editingWheel && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
          <div className="bg-zinc-950 border border-[#D4AF37]/50 rounded-3xl p-4 sm:p-6 w-full max-w-3xl space-y-4 shadow-2xl relative max-h-[92vh] flex flex-col font-sans">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Disc className="w-5 h-5 text-[#D4AF37] animate-spin-slow" />
                <h3 className="text-sm font-black font-mono uppercase text-[#D4AF37]">
                  Éditeur de Roue : {editingWheel.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingWheel(null)}
                className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-900 border border-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 font-mono text-xs pr-1 flex-1 scrollbar-none">
              
              {/* General Config Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold block">Nom de la Roue</label>
                  <input
                    type="text"
                    value={editingWheel.name}
                    onChange={(e) => setEditingWheel({ ...editingWheel, name: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold block">Prix du Tirage (FCFA)</label>
                  <input
                    type="number"
                    value={editingWheel.cost}
                    onChange={(e) => setEditingWheel({ ...editingWheel, cost: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold block">Max Participations / Jour</label>
                  <input
                    type="number"
                    value={editingWheel.maxDailyParticipations}
                    onChange={(e) => setEditingWheel({ ...editingWheel, maxDailyParticipations: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Segments & Probabilities Config */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase text-[#D4AF37]">
                      Segments & Probabilités ({editingWheel.segments.length})
                    </h4>
                    {(() => {
                      const val = WheelEngineService.validateWheelProbabilities(editingWheel.segments);
                      return (
                        <span className={`text-[10px] font-bold block ${val.isValid ? "text-emerald-400" : "text-rose-400"}`}>
                          Somme des probabilités actives : {val.totalProbability}% {val.isValid ? "✅ (Conforme)" : "❌ (Invalide)"}
                        </span>
                      );
                    })()}
                  </div>

                  <button
                    onClick={handleAddSegmentToEditingWheel}
                    className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-[10px] font-bold uppercase transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter un Segment</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {editingWheel.segments.map((seg) => (
                    <div
                      key={seg.id}
                      className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl grid grid-cols-1 sm:grid-cols-6 gap-2 items-center"
                    >
                      <div className="sm:col-span-2 space-y-0.5">
                        <label className="text-[9px] text-zinc-500 uppercase font-bold block">Libellé Gain</label>
                        <input
                          type="text"
                          value={seg.label}
                          onChange={(e) => handleSegmentChange(seg.id, "label", e.target.value)}
                          className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-[11px]"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9px] text-zinc-500 uppercase font-bold block">Type Gain</label>
                        <select
                          value={seg.type}
                          onChange={(e) => handleSegmentChange(seg.id, "type", e.target.value)}
                          className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-[10px]"
                        >
                          <option value="PREMIUM_DAYS">PREMIUM_DAYS</option>
                          <option value="VISIBILITY_BOOST">VISIBILITY_BOOST</option>
                          <option value="GOMBO_BOOST">GOMBO_BOOST</option>
                          <option value="PROFILE_BOOST">PROFILE_BOOST</option>
                          <option value="PUBLICATION_BOOST">PUBLICATION_BOOST</option>
                          <option value="EXTRA_SPIN">EXTRA_SPIN</option>
                          <option value="PREMIUM_CODE">PREMIUM_CODE</option>
                          <option value="NO_REWARD">NO_REWARD</option>
                        </select>
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9px] text-zinc-500 uppercase font-bold block">Probabilité (%)</label>
                        <input
                          type="number"
                          value={seg.probability}
                          onChange={(e) => handleSegmentChange(seg.id, "probability", Number(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-[11px]"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9px] text-zinc-500 uppercase font-bold block">Valeur / Durée (Jours)</label>
                        <input
                          type="number"
                          value={seg.rewardDuration || 1}
                          onChange={(e) => handleSegmentChange(seg.id, "rewardDuration", Number(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-[11px]"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0">
                        <button
                          onClick={() => handleSegmentChange(seg.id, "enabled", !seg.enabled)}
                          className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase ${
                            seg.enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {seg.enabled ? "Actif" : "Inactif"}
                        </button>
                        <button
                          onClick={() => handleRemoveSegmentFromEditingWheel(seg.id)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingWheel(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold uppercase text-xs rounded-xl"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveWheelConfig}
                className="px-5 py-2 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl shadow-lg shadow-[#D4AF37]/20"
              >
                Sauvegarder la Roue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER WHEEL PREVIEW / TEST MODAL */}
      <GomboWheelUserModal
        currentUser={currentUser}
        userEmail={userEmail}
        userAccountType="premium"
        isFounder={true}
        audioSynth={audioSynth}
        isOpen={isTestWheelOpen}
        onClose={() => setIsTestWheelOpen(false)}
      />

    </div>
  );
}
