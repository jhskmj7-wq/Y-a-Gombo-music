import React, { useState, useEffect } from "react";
import { 
  Crown, ShieldCheck, AlertOctagon, ArrowLeft, Disc, 
  Award, Zap, DollarSign, Settings, Check, X, Sparkles, 
  SlidersHorizontal, Radio, Layers, Info, RefreshCw, ChevronRight, Eye, EyeOff,
  Plus, Edit3, Trash2, History, TrendingUp, Users, PlayCircle, BarChart2,
  Clock, Shield, AlertTriangle, Save
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
  
  // Wheel Admin Modals & State
  const [editingWheel, setEditingWheel] = useState<AfriGomboWheel | null>(null);
  const [isTestWheelOpen, setIsTestWheelOpen] = useState(false);
  const [isUserViewOpen, setIsUserViewOpen] = useState(false);
  const [spinHistorySearch, setSpinHistorySearch] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  // Wheel Pricing State Engine
  const [priceLogs, setPriceLogs] = useState<any[]>([]);
  const [inputPrices, setInputPrices] = useState<Record<string, string>>({});
  const [pendingPriceChange, setPendingPriceChange] = useState<{ wheelId: string; oldPrice: number; newPrice: number; name: string } | null>(null);

  // Simulation State
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [simulationTargetWheel, setSimulationTargetWheel] = useState<AfriGomboWheel | null>(null);
  const [simulationStats, setSimulationStats] = useState<{
    totalSpins: number;
    counts: Record<string, number>;
  } | null>(null);

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
      // Initialize pricing inputs with exact Firestore values dynamically
      setInputPrices(prev => {
        const next = { ...prev };
        data.forEach(w => {
          if (!(w.id in next)) {
            next[w.id] = String(w.cost);
          }
        });
        return next;
      });
    });

    const unsubSpins = WheelEngineService.subscribeSpinHistory((data) => {
      setSpins(data);
    });

    const unsubPriceLogs = WheelEngineService.subscribeWheelPriceHistory((data) => {
      setPriceLogs(data);
    });

    return () => {
      unsubFeats();
      unsubWheels();
      unsubSpins();
      unsubPriceLogs();
    };
  }, [isFounder, currentUser, userEmail]);

  // Handle click on ENREGISTRER for price changes
  const handleSavePriceClick = (wheel: AfriGomboWheel) => {
    const rawVal = inputPrices[wheel.id];
    const parsed = parseInt(rawVal, 10);
    
    if (!rawVal || isNaN(parsed) || parsed.toString() !== rawVal.trim()) {
      setNotice("⚠️ Erreur : Le prix doit être un nombre entier valide.");
      return;
    }
    
    if (parsed <= 0) {
      setNotice("⚠️ Erreur : Le prix doit être strictement supérieur à 0 FCFA.");
      return;
    }

    setPendingPriceChange({
      wheelId: wheel.id,
      oldPrice: wheel.cost,
      newPrice: parsed,
      name: wheel.name
    });
  };

  const handleConfirmPriceChange = async () => {
    if (!pendingPriceChange) return;
    const { wheelId, oldPrice, newPrice } = pendingPriceChange;
    try {
      await WheelEngineService.updateWheelPrice(wheelId, oldPrice, newPrice, userEmail || "jhs.kmj7@gmail.com");
      try { audioSynth?.playValidationSuccess?.(); } catch (e) {}
      setNotice(`✅ Tarif de la "${pendingPriceChange.name}" mis à jour : ${newPrice} FCFA !`);
      setPendingPriceChange(null);
      setTimeout(() => setNotice(null), 4000);
    } catch (err) {
      console.error("Error updating price:", err);
      setNotice("❌ Erreur lors de la mise à jour du prix.");
      setPendingPriceChange(null);
    }
  };

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

  const handleDeleteWheel = async (wheel: AfriGomboWheel) => {
    if (!window.confirm(`Confirmer la suppression définitive de la roue "${wheel.name}" ?`)) return;
    try {
      await WheelEngineService.deleteWheel(wheel.id);
      try { audioSynth?.playValidationSuccess?.(); } catch (e) {}
      setNotice(`Roue "${wheel.name}" supprimée de Firestore.`);
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      console.error("Error deleting wheel:", err);
    }
  };

  const handleCreateNewWheel = () => {
    const timestamp = Date.now();
    const newWheel: AfriGomboWheel = {
      id: `wheel_${timestamp}`,
      name: `🎡 Roue Commerciale Sur-Mesure #${wheels.length + 1}`,
      description: "Roue commerciale AFRIGOMBO personnalisée avec segments et probabilités pondérées.",
      type: "CUSTOM",
      enabled: true,
      cost: 500,
      currency: "FCFA",
      maxDailyParticipations: 5,
      maxParticipationsPerUser: 100,
      delayInHours: 24,
      maxIdenticalRewardsPerUser: 5,
      allowedAccountTypes: ["standard", "premium", "all"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userEmail || "jhs.kmj7@gmail.com",
      version: 1,
      rulesText: "Tirage au sort commercial régi de manière transparente par probabilités pondérées.",
      segments: [
        {
          id: `seg_${timestamp}_1`,
          label: "🏆 7 Jours Premium",
          type: "PREMIUM_DAYS",
          rewardValue: 7,
          rewardDuration: 7,
          durationUnit: "days",
          probability: 25,
          enabled: true,
          color: "#D4AF37"
        },
        {
          id: `seg_${timestamp}_2`,
          label: "⚡ Boost Visibilité 24h",
          type: "VISIBILITY_BOOST",
          rewardValue: "Boost Visibilité",
          rewardDuration: 24,
          durationUnit: "hours",
          probability: 35,
          enabled: true,
          color: "#10B981"
        },
        {
          id: `seg_${timestamp}_3`,
          label: "🎟️ 1 Spin Gratuit",
          type: "EXTRA_SPIN",
          rewardValue: 1,
          probability: 20,
          enabled: true,
          color: "#8B5CF6"
        },
        {
          id: `seg_${timestamp}_4`,
          label: "🎯 Recommencer",
          type: "NO_REWARD",
          rewardValue: 0,
          probability: 20,
          enabled: true,
          color: "#4B5563"
        }
      ]
    };

    setEditingWheel(newWheel);
  };

  const handleSaveWheelConfig = async () => {
    if (!editingWheel) return;

    const probVal = WheelEngineService.validateWheelProbabilities(editingWheel.segments);
    if (!probVal.isValid) {
      setNotice(`⚠️ Impossible d'enregistrer la configuration : ${probVal.error}`);
      return;
    }

    if (editingWheel.cost < 0) {
      setNotice("⚠️ Impossible d'enregistrer : Le prix du tirage ne peut pas être négatif.");
      return;
    }

    try {
      await WheelEngineService.saveWheel(editingWheel, userEmail || "jhs.kmj7@gmail.com");
      try { audioSynth?.playValidationSuccess?.(); } catch (e) {}
      setNotice(`✅ Configuration de la roue "${editingWheel.name}" (Version ${editingWheel.version ? editingWheel.version + 1 : 1}) enregistrée avec succès !`);
      setEditingWheel(null);
      setTimeout(() => setNotice(null), 4000);
    } catch (err) {
      console.error("Error saving wheel config:", err);
      setNotice("❌ Erreur lors de l'enregistrement de la configuration.");
    }
  };

  const handleAddSegmentToEditingWheel = () => {
    if (!editingWheel) return;
    const newSeg: WheelSegment = {
      id: `seg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      label: "Nouveau Segment Gain",
      type: "PREMIUM_DAYS",
      rewardValue: 1,
      rewardDuration: 1,
      durationUnit: "days",
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

  const handleRunSimulation100Spins = (targetWheel: AfriGomboWheel) => {
    const activeSegs = targetWheel.segments.filter((s) => s.enabled);
    if (activeSegs.length === 0) return;

    const counts: Record<string, number> = {};
    activeSegs.forEach((s) => { counts[s.id] = 0; });

    for (let i = 0; i < 100; i++) {
      const winner = WheelEngineService.pickWinningSegment(activeSegs);
      if (winner) {
        counts[winner.id] = (counts[winner.id] || 0) + 1;
      }
    }

    setSimulationTargetWheel(targetWheel);
    setSimulationStats({ totalSpins: 100, counts });
    setShowSimulationModal(true);
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
                Super Fondateur Souverain
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Panneau commercial complet : Configuration des roues, prix FCFA, probabilités strictes & tirages
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
        <div className="p-3.5 bg-zinc-950 border-2 border-[#D4AF37] text-[#D4AF37] rounded-2xl text-xs font-mono font-bold animate-fadeIn flex items-center justify-between shadow-2xl">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4AF37] animate-pulse" />
            <span>{notice}</span>
          </span>
          <button onClick={() => setNotice(null)} className="text-zinc-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
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

      {/* SECTION A: GESTION & CONFIGURATION COMMERCIALE DES ROUES */}
      {(activeTab === "all" || activeTab === "wheel") && (
        <section className="space-y-4">
          
          {/* Section Header & Quick Control Toolbar */}
          <div className="bg-zinc-950 border border-[#D4AF37]/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-xl text-[#D4AF37]">
                  <Disc className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase text-[#D4AF37] tracking-wider font-mono">
                    SECTION A — 🎡 PANNEAU COMMERCIAL DES ROUES AFRIGOMBO
                  </h2>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    Gestion souveraine des prix FCFA, probabilités (strictement 100%), durées, tirages de test & limites
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleCreateNewWheel}
                  className="px-3.5 py-2 bg-[#D4AF37] hover:bg-amber-400 text-black border border-[#D4AF37] rounded-xl text-xs font-mono font-black uppercase transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-[#D4AF37]/20"
                >
                  <Plus className="w-4 h-4 text-black" />
                  <span>Créer une Roue</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsTestWheelOpen(true)}
                  className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer flex items-center gap-1.5"
                >
                  <PlayCircle className="w-4 h-4 text-emerald-400" />
                  <span>🧪 Mode Test (Tirage Gratuit)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsUserViewOpen(true)}
                  className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4 text-[#D4AF37]" />
                  <span>👁️ Aperçu Utilisateur</span>
                </button>
              </div>
            </div>

            {/* Financial Overview & Real Stats Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono">
              <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-1">
                <span className="text-[9px] text-zinc-400 uppercase font-bold block">Participations Totales</span>
                <span className="text-sm font-black text-white">{realStats.totalParticipations} tirages</span>
              </div>

              <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-1">
                <span className="text-[9px] text-zinc-400 uppercase font-bold block">Tirages Aujourd'hui</span>
                <span className="text-sm font-black text-emerald-400">{realStats.todayParticipations}</span>
              </div>

              <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-1">
                <span className="text-[9px] text-zinc-400 uppercase font-bold block">Revenus Bruts Réels</span>
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
                <span className="text-[9px] text-zinc-400 uppercase font-bold block">Membres Actifs</span>
                <span className="text-xs font-bold text-zinc-300">
                  {realStats.totalUniqueUsers} ({realStats.standardUsersCount} Std / {realStats.premiumUsersCount} Prem)
                </span>
              </div>
            </div>

            {/* CENTRE DE MODIFICATION TARIFAIRE DES ROUES */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2.5 pb-2">
              {/* Tarifs Editor Column */}
              <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-3.5 shadow-lg">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-2.5">
                  <DollarSign className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="text-xs font-black uppercase text-[#D4AF37] tracking-wider font-mono">
                    ⚖️ Centre de Tarification des Tirages (en GAWA)
                  </h3>
                </div>
                <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
                  Modifiez instantanément les tarifs de tirage en GAWA de chaque roue. La monnaie de tirage est exclusivement le GAWA. Les changements sont synchronisés en temps réel pour tous les membres actifs.
                </p>

                <div className="space-y-3 pt-1">
                  {wheels.map((wheel, index) => {
                    const priceVal = inputPrices[wheel.id] || "";
                    return (
                      <div key={wheel.id} className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase">ROUE {index + 1}</span>
                          <h4 className="text-xs font-black text-white">{wheel.name}</h4>
                          <div className="text-[10px] text-[#D4AF37] font-semibold">Prix actuel : {wheel.cost} GAWA</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <input
                              type="text"
                              value={priceVal}
                              onChange={(e) => setInputPrices(prev => ({ ...prev, [wheel.id]: e.target.value }))}
                              className="w-24 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold text-white text-right focus:outline-none focus:border-[#D4AF37] pr-12"
                              placeholder={`${wheel.cost}`}
                            />
                            <span className="absolute right-2 top-1.5 text-[9px] text-zinc-500 font-bold">GAWA</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSavePriceClick(wheel)}
                            className="px-3 py-1.5 bg-[#D4AF37] hover:bg-amber-400 text-black rounded-lg text-[10px] font-black uppercase transition cursor-pointer flex items-center gap-1 shadow-md shadow-[#D4AF37]/10"
                          >
                            <Save className="w-3.5 h-3.5 text-black" />
                            <span>Enregistrer</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Price Log Audit History Column */}
              <div className="lg:col-span-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-3.5 flex flex-col shadow-lg">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-black uppercase text-zinc-300 tracking-wider font-mono">
                      📜 Historique d'Audit des Tarifs
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[9px] font-mono font-bold">
                    {priceLogs.length} logs
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[220px] pr-1 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800">
                  {priceLogs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-zinc-600 text-[10px] py-8 text-center font-mono">
                      Aucune modification de tarif enregistrée pour le moment.
                    </div>
                  ) : (
                    priceLogs.map((log) => {
                      const wheelObj = wheels.find(w => w.id === log.wheelId);
                      const wheelLabel = wheelObj ? wheelObj.name : log.wheelId;
                      return (
                        <div key={log.logId} className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1 font-mono text-[10px] leading-relaxed">
                          <div className="flex justify-between items-center text-zinc-400">
                            <span className="font-bold text-white truncate max-w-[150px]">{wheelLabel}</span>
                            <span className="text-zinc-500">{new Date(log.timestamp).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <div className="flex justify-between items-center pt-0.5 border-t border-zinc-900/60 text-[9px]">
                            <span className="text-rose-400 line-through">{log.oldPrice} FCFA</span>
                            <span className="text-zinc-500">→</span>
                            <span className="text-emerald-400 font-black">{log.newPrice} FCFA</span>
                          </div>
                          <div className="text-[9px] text-zinc-500 text-right">
                            Modifié par : <span className="text-[#D4AF37]">{log.adminId || "Fondateur"}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* CONFIRMATION OVERLAY FOR PRICE MODIFICATIONS */}
            {pendingPriceChange && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                <div className="bg-[#0c0c0d] border-2 border-[#D4AF37] p-6 rounded-3xl max-w-sm w-full space-y-4 text-center shadow-2xl animate-scaleIn">
                  <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 border-2 border-[#D4AF37] flex items-center justify-center mx-auto text-[#D4AF37]">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#D4AF37] font-mono">Confirmation de Tarif</h3>
                  <p className="text-[11px] text-zinc-300 leading-relaxed font-mono">
                    Modifier le prix de la <strong className="text-white font-bold">{pendingPriceChange.name}</strong> de{" "}
                    <strong className="text-rose-400 font-bold line-through">{pendingPriceChange.oldPrice} FCFA</strong> à{" "}
                    <strong className="text-emerald-400 font-black">{pendingPriceChange.newPrice} FCFA</strong> ?
                  </p>
                  <div className="flex gap-3 pt-2 font-mono text-xs font-black uppercase">
                    <button
                      type="button"
                      onClick={() => setPendingPriceChange(null)}
                      className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-xl transition border border-zinc-800 cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmPriceChange}
                      className="flex-1 py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black rounded-xl transition border border-[#D4AF37] cursor-pointer"
                    >
                      Confirmer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Active Wheels Configuration Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
              {wheels.map((wheel) => {
                const statusInfo = WheelEngineService.getWheelConfigStatus(wheel);
                const probVal = WheelEngineService.validateWheelProbabilities(wheel.segments);
                
                return (
                  <div
                    key={wheel.id}
                    className="bg-zinc-900 border border-zinc-800 hover:border-[#D4AF37]/60 rounded-2xl p-4 space-y-3.5 flex flex-col justify-between transition shadow-xl relative overflow-hidden"
                  >
                    <div className="space-y-2.5">
                      {/* Wheel Status Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                          {wheel.type} • v{wheel.version || 1}
                        </span>

                        <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase font-mono border ${statusInfo.bgClass} ${statusInfo.colorClass} ${statusInfo.borderClass}`}>
                          {statusInfo.code === "VALID" ? "🟢 VALIDE" : statusInfo.code === "INCOMPLETE" ? "🟠 INCOMPLÈTE" : "🔴 INVALIDE"}
                        </span>
                      </div>

                      <h3 className="text-xs font-black text-white font-mono flex items-center justify-between">
                        <span>{wheel.name}</span>
                        {!wheel.enabled && <span className="text-[9px] text-rose-400 uppercase font-mono">(Désactivée)</span>}
                      </h3>
                      
                      <p className="text-[11px] text-zinc-400 font-mono leading-relaxed line-clamp-2">{wheel.description}</p>

                      {/* Commercial Configuration Summary Card */}
                      <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5 text-[10px] font-mono">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Coût du tirage :</span>
                          <span className="font-bold text-[#D4AF37]">{wheel.cost} GAWA</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Max / Jour / Membre :</span>
                          <span className="font-bold text-white">{wheel.maxDailyParticipations} tirage(s)</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Délai recharge :</span>
                          <span className="font-bold text-zinc-300">{wheel.delayInHours || 24}h</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Segments :</span>
                          <span className="font-bold text-white">{wheel.segments?.length || 0} segments</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-zinc-900">
                          <span className="text-zinc-400">Probabilités :</span>
                          <span className={`font-bold ${probVal.isValid ? "text-emerald-400" : "text-rose-400"}`}>
                            {probVal.isValid ? `Exactement 100% ✅` : `${probVal.totalProbability}% (Invalide)`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Wheel Card Bottom Actions */}
                    <div className="pt-2 border-t border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleWheelEnable(wheel)}
                          className={`flex-1 py-1.5 rounded-xl text-[10px] font-mono font-black uppercase transition cursor-pointer ${
                            wheel.enabled
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                          }`}
                        >
                          {wheel.enabled ? "Désactiver" : "Activer"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingWheel(wheel)}
                          className="flex-1 py-1.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase text-[10px] rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-[#D4AF37]/20"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Configurer</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRunSimulation100Spins(wheel)}
                          className="flex-1 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[9px] font-mono font-bold uppercase transition flex items-center justify-center gap-1"
                        >
                          <BarChart2 className="w-3 h-3 text-amber-400" />
                          <span>Simuler 100 Tirages</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteWheel(wheel)}
                          className="p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition"
                          title="Supprimer la roue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
                            {sp.isExtraSpinUsed ? "Gratuit" : `${sp.cost} ${sp.currency || "FCFA"}`}
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
            <span className="text-[10px] text-zinc-400 font-mono">Privilèges, Jours Offerts & Codes d'Abonnement</span>
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
            <span className="text-[10px] text-zinc-400 font-mono">Visibilité Radar, Profils & Sponsoring</span>
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
            <span className="text-[10px] text-zinc-400 font-mono">Packs de Extra Spins, Tickets & Services Commercialisés</span>
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
          <div className="bg-zinc-950 border border-[#D4AF37]/50 rounded-3xl p-4 sm:p-6 w-full max-w-4xl space-y-4 shadow-2xl relative max-h-[92vh] flex flex-col font-sans">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Disc className="w-5 h-5 text-[#D4AF37] animate-spin-slow" />
                <div>
                  <h3 className="text-sm font-black font-mono uppercase text-[#D4AF37] flex items-center gap-2">
                    <span>Éditeur Commercial de Roue : {editingWheel.name}</span>
                    <span className="px-2 py-0.2 rounded text-[9px] bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                      v{editingWheel.version || 1}
                    </span>
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    Prix, Segments, Probabilités strictes (100%), Durées & Limites de participation
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingWheel(null)}
                className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-900 border border-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-5 font-mono text-xs pr-1 flex-1 scrollbar-none">
              
              {/* General Wheel Configuration Section */}
              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-black uppercase text-[#D4AF37] flex items-center gap-1.5">
                  <Settings className="w-4 h-4" />
                  <span>1. Paramètres Commerciaux Généraux</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    <label className="text-[10px] text-zinc-400 uppercase font-bold block">Type de Roue</label>
                    <input
                      type="text"
                      value={editingWheel.type}
                      onChange={(e) => setEditingWheel({ ...editingWheel, type: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-[#D4AF37]"
                      placeholder="CLASSIQUE / PREMIUM / ELITE"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold block">Devise</label>
                    <input
                      type="text"
                      value={editingWheel.currency || "FCFA"}
                      onChange={(e) => setEditingWheel({ ...editingWheel, currency: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold block">Prix du Tirage ({editingWheel.currency || "FCFA"})</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editingWheel.cost}
                        onChange={(e) => setEditingWheel({ ...editingWheel, cost: Number(e.target.value) || 0 })}
                        className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                      <div className="flex items-center gap-1">
                        {[300, 500, 1000].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setEditingWheel({ ...editingWheel, cost: p })}
                            className="px-2 py-1.5 bg-zinc-800 hover:bg-[#D4AF37] hover:text-black text-zinc-300 rounded-lg text-[10px] font-bold transition"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold block">Description Commerciale</label>
                    <input
                      type="text"
                      value={editingWheel.description}
                      onChange={(e) => setEditingWheel({ ...editingWheel, description: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-zinc-800">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold block">Max Tirages / Jour / Membre</label>
                    <input
                      type="number"
                      value={editingWheel.maxDailyParticipations}
                      onChange={(e) => setEditingWheel({ ...editingWheel, maxDailyParticipations: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold block">Délai Recharge (Heures)</label>
                    <input
                      type="number"
                      value={editingWheel.delayInHours || 24}
                      onChange={(e) => setEditingWheel({ ...editingWheel, delayInHours: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold block">Max Récompenses Identiques / Membre</label>
                    <input
                      type="number"
                      value={editingWheel.maxIdenticalRewardsPerUser || 5}
                      onChange={(e) => setEditingWheel({ ...editingWheel, maxIdenticalRewardsPerUser: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
              </div>

              {/* Segments & Real-Time Probability Validation Banner */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-xs font-black uppercase text-[#D4AF37] flex items-center gap-1.5">
                      <Disc className="w-4 h-4" />
                      <span>2. Segments, Récompenses & Probabilités ({editingWheel.segments.length})</span>
                    </h4>
                    {(() => {
                      const val = WheelEngineService.validateWheelProbabilities(editingWheel.segments);
                      return (
                        <div className={`text-[11px] font-bold mt-1 p-2 rounded-xl border flex items-center gap-2 ${
                          val.isValid 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                            : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        }`}>
                          <span>{val.isValid ? "🟢" : "🔴"}</span>
                          <span>Total des probabilités actives : <strong>{val.totalProbability}%</strong></span>
                          <span>{val.isValid ? "✅ (Conforme à 100%)" : `❌ (${val.error})`}</span>
                        </div>
                      );
                    })()}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSegmentToEditingWheel}
                    className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold uppercase transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter un Segment</span>
                  </button>
                </div>

                {/* Real-Time Visual Wheel Arc Preview */}
                <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col md:flex-row items-center justify-center gap-6">
                  <div className="relative w-40 h-40 rounded-full border-4 border-[#D4AF37] shadow-2xl overflow-hidden flex items-center justify-center shrink-0">
                    {editingWheel.segments.map((seg, idx) => {
                      const totalSegs = editingWheel.segments.length;
                      const angle = (360 / totalSegs) * idx;
                      return (
                        <div
                          key={seg.id || idx}
                          className="absolute w-full h-full top-0 left-0 flex items-center justify-center pointer-events-none"
                          style={{ transform: `rotate(${angle}deg)` }}
                        >
                          <div
                            className="absolute top-1 text-[8px] font-black uppercase text-black px-1 py-0.5 rounded text-center truncate max-w-[55px]"
                            style={{ backgroundColor: seg.enabled ? (seg.color || "#D4AF37") : "#3F3F46" }}
                          >
                            {seg.label}
                          </div>
                        </div>
                      );
                    })}
                    <div className="w-10 h-10 rounded-full bg-black border border-[#D4AF37] z-10 flex items-center justify-center text-[8px] font-black text-[#D4AF37]">
                      AFRI
                    </div>
                  </div>

                  <div className="text-[11px] text-zinc-400 space-y-1 flex-1">
                    <span className="text-xs font-bold text-[#D4AF37] block uppercase">Aperçu en Temps Réel :</span>
                    <p>
                      La modification dynamique des libellés, couleurs, durées ou probabilités met instantanément à jour le rendu visuel et la validation stricte.
                    </p>
                  </div>
                </div>

                {/* Segments Configuration Table / Cards */}
                <div className="space-y-3">
                  {editingWheel.segments.map((seg) => (
                    <div
                      key={seg.id}
                      className={`p-4 bg-zinc-900 border rounded-2xl space-y-3 transition ${
                        seg.enabled ? "border-zinc-800" : "border-zinc-800/40 opacity-60 bg-zinc-950"
                      }`}
                    >
                      {/* Row 1: Core Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        <div className="sm:col-span-3 space-y-1">
                          <label className="text-[9px] text-zinc-500 uppercase font-black block">Libellé Gain</label>
                          <input
                            type="text"
                            value={seg.label}
                            onChange={(e) => handleSegmentChange(seg.id, "label", e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-[11px] font-mono"
                          />
                        </div>

                        <div className="sm:col-span-3 space-y-1">
                          <label className="text-[9px] text-zinc-500 uppercase font-black block">Type Gain</label>
                          <select
                            value={seg.type}
                            onChange={(e) => handleSegmentChange(seg.id, "type", e.target.value)}
                            className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-[10px] font-mono"
                          >
                            <option value="PREMIUM_DAYS">👑 PREMIUM_DAYS (Premium Temp)</option>
                            <option value="SURPRISE_BOX">🎁 SURPRISE_BOX (Boîte Surprise)</option>
                            <option value="VISIBILITY_BOOST">⚡ VISIBILITY_BOOST (Boost Visibilité)</option>
                            <option value="PUBLICATION_BOOST">📈 PUBLICATION_BOOST (Boost Post)</option>
                            <option value="PROFILE_BOOST">⭐ PROFILE_BOOST (Mise en avant Profil)</option>
                            <option value="GOMBO_BOOST">🚀 GOMBO_BOOST (Mise en avant Gombo)</option>
                            <option value="PREMIUM_BOOST">🎧 PREMIUM_BOOST (Avantage Créateur)</option>
                            <option value="PREMIUM_CODE">🎟️ PREMIUM_CODE (Code Promotionnel)</option>
                            <option value="PROFILE_BADGE">🏷️ PROFILE_BADGE (Badge Temporaire)</option>
                            <option value="EXTRA_SPIN">🎟️ EXTRA_SPIN (Spin Bonus)</option>
                            <option value="NO_REWARD">🛑 NO_REWARD (Perte / Pas de gain)</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[9px] text-zinc-500 uppercase font-black block">Probabilité (%)</label>
                          <input
                            type="number"
                            value={seg.probability}
                            onChange={(e) => handleSegmentChange(seg.id, "probability", Number(e.target.value) || 0)}
                            className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-[11px] font-mono font-bold text-[#D4AF37]"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[9px] text-zinc-500 uppercase font-black block">Durée + Unité</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={seg.rewardDuration || 1}
                              onChange={(e) => handleSegmentChange(seg.id, "rewardDuration", Number(e.target.value) || 0)}
                              className="w-12 px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-[11px] font-mono"
                            />
                            <select
                              value={seg.durationUnit || "days"}
                              onChange={(e) => handleSegmentChange(seg.id, "durationUnit", e.target.value)}
                              className="flex-1 px-1 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-[9px] font-mono"
                            >
                              <option value="hours">h (heures)</option>
                              <option value="days">j (jours)</option>
                              <option value="weeks">s (semaines)</option>
                            </select>
                          </div>
                        </div>

                        <div className="sm:col-span-2 flex items-center justify-end gap-1.5 pt-3 sm:pt-4">
                          <button
                            type="button"
                            onClick={() => handleSegmentChange(seg.id, "enabled", !seg.enabled)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-black uppercase transition cursor-pointer ${
                              seg.enabled ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                            }`}
                          >
                            {seg.enabled ? "Activé" : "Désactivé"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSegmentFromEditingWheel(seg.id)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Row 2: Secondary / Commercial Parameters */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-2.5 border-t border-zinc-800/50">
                        <div className="sm:col-span-4 space-y-1">
                          <label className="text-[9px] text-zinc-500 uppercase font-black block">Valeur Promotionnelle Indicative (FCFA)</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={seg.promoValueFCFA || 0}
                              onChange={(e) => handleSegmentChange(seg.id, "promoValueFCFA", Number(e.target.value) || 0)}
                              className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-[11px] font-mono focus:outline-none focus:border-[#D4AF37] pr-10"
                              placeholder="0"
                            />
                            <span className="absolute right-2.5 top-1.5 text-[9px] text-zinc-500 font-bold">FCFA</span>
                          </div>
                        </div>

                        <div className="sm:col-span-4 space-y-1">
                          <label className="text-[9px] text-zinc-500 uppercase font-black block">Niveau Minimum Requis</label>
                          <select
                            value={seg.minAccountLevel || "all"}
                            onChange={(e) => handleSegmentChange(seg.id, "minAccountLevel", e.target.value)}
                            className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-[10px] font-mono"
                          >
                            <option value="all">Tous les Membres (Standard & Premium)</option>
                            <option value="standard">Membres Standards uniquement</option>
                            <option value="premium">Membres Premium uniquement</option>
                            <option value="vip">Membres VIP uniquement</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[9px] text-zinc-500 uppercase font-black block">Couleur</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={seg.color || "#D4AF37"}
                              onChange={(e) => handleSegmentChange(seg.id, "color", e.target.value)}
                              className="w-8 h-8 bg-zinc-950 border border-zinc-800 rounded-lg cursor-pointer"
                            />
                            <input
                              type="text"
                              value={seg.color || "#D4AF37"}
                              onChange={(e) => handleSegmentChange(seg.id, "color", e.target.value)}
                              className="w-16 px-1 py-1 bg-zinc-950 border border-zinc-800 rounded text-[9px] text-zinc-300 font-mono text-center uppercase"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-2 text-right">
                          {/* Segment Summary Badge */}
                          <div className="inline-block p-1.5 bg-zinc-950 border border-zinc-850 rounded-xl text-[9px] text-zinc-400 font-mono">
                            <div>Val: <span className="text-[#D4AF37] font-bold">{seg.promoValueFCFA || 0} FCFA</span></div>
                            <div>Lvl: <span className="text-white uppercase">{seg.minAccountLevel || "all"}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Bottom Action Controls */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-800">
              <span className="text-[10px] text-zinc-400 font-mono">
                Version actuelle : <strong className="text-white">v{editingWheel.version || 1}</strong>
              </span>

              <div className="flex items-center gap-3">
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
                  className="px-5 py-2 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl shadow-lg shadow-[#D4AF37]/20 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer la Configuration</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 100 SPINS EMPIRICAL SIMULATION MODAL */}
      {showSimulationModal && simulationTargetWheel && simulationStats && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
          <div className="bg-zinc-950 border border-[#D4AF37]/50 rounded-3xl p-5 w-full max-w-xl space-y-4 shadow-2xl font-sans">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black font-mono uppercase text-[#D4AF37]">
                  Simulation Empirique (100 Tirages) : {simulationTargetWheel.name}
                </h3>
              </div>
              <button onClick={() => setShowSimulationModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <p className="text-[11px] text-zinc-400">
                Résultats observés sur 100 tirages virtuels aléatoires selon les probabilités configurées :
              </p>

              <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/60">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900 text-zinc-400 uppercase">
                      <th className="p-2.5">Segment</th>
                      <th className="p-2.5">Probabilité</th>
                      <th className="p-2.5">Observé (100 Spins)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-zinc-200">
                    {simulationTargetWheel.segments.filter((s) => s.enabled).map((seg) => {
                      const count = simulationStats.counts[seg.id] || 0;
                      return (
                        <tr key={seg.id}>
                          <td className="p-2.5 font-bold text-white">{seg.label}</td>
                          <td className="p-2.5 text-[#D4AF37] font-bold">{seg.probability}%</td>
                          <td className="p-2.5 font-black text-emerald-400">{count} fois ({count}%)</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => handleRunSimulation100Spins(simulationTargetWheel)}
                className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Relancer 100 Tirages</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSimulationModal(false)}
                className="px-4 py-2 bg-zinc-900 text-zinc-300 rounded-xl text-xs font-bold uppercase"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER WHEEL PREVIEW MODAL — TEST MODE */}
      <GomboWheelUserModal
        currentUser={currentUser}
        userEmail={userEmail}
        userAccountType="premium"
        isFounder={true}
        isTestMode={true}
        audioSynth={audioSynth}
        isOpen={isTestWheelOpen}
        onClose={() => setIsTestWheelOpen(false)}
      />

      {/* USER WHEEL PREVIEW MODAL — USER VIEW ONLY */}
      <GomboWheelUserModal
        currentUser={currentUser}
        userEmail={userEmail}
        userAccountType="standard"
        isFounder={true}
        isUserViewOnly={true}
        audioSynth={audioSynth}
        isOpen={isUserViewOpen}
        onClose={() => setIsUserViewOpen(false)}
      />

    </div>
  );
}
