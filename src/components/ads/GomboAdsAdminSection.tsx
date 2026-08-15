import React, { useState, useEffect } from "react";
import { 
  Megaphone, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Pause, 
  Play, 
  Archive, 
  Eye, 
  MousePointerClick, 
  TrendingUp, 
  Wallet, 
  UserCheck, 
  Search, 
  Filter, 
  AlertCircle,
  X,
  Phone,
  Calendar,
  ExternalLink,
  Settings,
  Shield,
  Coins,
  Plus,
  Trash2,
  RefreshCw
} from "lucide-react";
import { collection, query, onSnapshot, doc, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { GomboAdsCampaign, GomboAdsStatus, GomboAdsPlacement } from "../../types";
import { GomboAdsService, GomboAdsOffer, GomboAdsConfig } from "../../services/GomboAdsService";

interface GomboAdsAdminSectionProps {
  adminProfile: any;
}

interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  campaignId?: string;
  oldValue: string;
  newValue: string;
  date: string;
}

export const GomboAdsAdminSection: React.FC<GomboAdsAdminSectionProps> = ({ adminProfile }) => {
  const [campaigns, setCampaigns] = useState<GomboAdsCampaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<"CAMPAIGNS" | "CONFIG" | "LOGS">("CAMPAIGNS");
  const [activeTab, setActiveTab] = useState<"PENDING" | "ACTIVE" | "PAUSED" | "REJECTED" | "EXPIRED" | "ALL">("PENDING");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Audit Logs State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  // Rejection Modal
  const [selectedRejectCamp, setSelectedRejectCamp] = useState<GomboAdsCampaign | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");

  // Manual Refund Modal
  const [selectedRefundCamp, setSelectedRefundCamp] = useState<GomboAdsCampaign | null>(null);
  const [refundReason, setRefundReason] = useState<string>("");

  // Config State
  const [globalConfig, setGlobalConfig] = useState<GomboAdsConfig | null>(null);
  const [offers, setOffers] = useState<GomboAdsOffer[]>([]);
  const [savingConfig, setSavingConfig] = useState<boolean>(false);
  const [processingAction, setProcessingAction] = useState<boolean>(false);

  // New Offer Form State
  const [editingOffer, setEditingOffer] = useState<GomboAdsOffer | null>(null);
  const [showOfferForm, setShowOfferForm] = useState<boolean>(false);
  const [newOffer, setNewOffer] = useState<Partial<GomboAdsOffer>>({
    id: "",
    name: "",
    priceGawa: 100,
    durationDays: 1,
    budgetGawa: 100,
    placements: ["accueil", "gombo"],
    enabled: true
  });

  const adminId = adminProfile?.uid || adminProfile?.id || "super_admin";

  useEffect(() => {
    // 1. Subscribe to campaigns
    const unsub = GomboAdsService.listenAllCampaigns((list) => {
      setCampaigns(list);
      setLoading(false);
    });

    // 2. Fetch configurations
    const loadConfigAndOffers = async () => {
      const cfg = await GomboAdsService.getConfig();
      setGlobalConfig(cfg);
      const rates = await GomboAdsService.getOffers();
      setOffers(rates);
    };
    loadConfigAndOffers();

    return () => unsub();
  }, []);

  // Subscribe to security logs when logs tab is active
  useEffect(() => {
    if (activeSubTab !== "LOGS") return;
    setLoadingLogs(true);
    
    const q = query(
      collection(db, "adminGomboAdsLogs"),
      orderBy("date", "desc"),
      limit(100)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: AuditLog[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as AuditLog);
      });
      setLogs(list);
      setLoadingLogs(false);
    }, (err) => {
      console.warn("Audit logs subscription error:", err);
      setLoadingLogs(false);
    });

    return () => unsub();
  }, [activeSubTab]);

  const handleApprove = async (campaign: GomboAdsCampaign) => {
    if (processingAction) return;
    setProcessingAction(true);
    try {
      await GomboAdsService.approveCampaign(campaign.id, adminId);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedRejectCamp || processingAction) return;
    setProcessingAction(true);
    try {
      await GomboAdsService.rejectCampaign(
        selectedRejectCamp.id,
        adminId,
        rejectionReason || "Campagne non conforme aux directives de la communauté."
      );
      setSelectedRejectCamp(null);
      setRejectionReason("");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRefundSubmit = async () => {
    if (!selectedRefundCamp || processingAction) return;
    setProcessingAction(true);
    try {
      await GomboAdsService.refundCampaign(
        selectedRefundCamp.id,
        adminId,
        refundReason || "Annulation et remboursement de la campagne."
      );
      setSelectedRefundCamp(null);
      setRefundReason("");
    } finally {
      setProcessingAction(false);
    }
  };

  const handlePause = async (campaignId: string) => {
    await GomboAdsService.pauseCampaign(campaignId, adminId);
  };

  const handleResume = async (campaignId: string) => {
    await GomboAdsService.resumeCampaign(campaignId, adminId);
  };

  const handleArchive = async (campaignId: string) => {
    await GomboAdsService.archiveCampaign(campaignId, adminId);
  };

  // Toggle global settings
  const handleToggleGlobalEnabled = async () => {
    if (!globalConfig) return;
    const nextVal = !globalConfig.enabled;
    setGlobalConfig({ ...globalConfig, enabled: nextVal });
    await GomboAdsService.updateConfig({ enabled: nextVal }, adminId);
  };

  const handleToggleAllowNew = async () => {
    if (!globalConfig) return;
    const nextVal = !globalConfig.allowNewCampaigns;
    setGlobalConfig({ ...globalConfig, allowNewCampaigns: nextVal });
    await GomboAdsService.updateConfig({ allowNewCampaigns: nextVal }, adminId);
  };

  const handleToggleActiveDelivery = async () => {
    if (!globalConfig) return;
    const nextVal = !globalConfig.allowActiveDelivery;
    setGlobalConfig({ ...globalConfig, allowActiveDelivery: nextVal });
    await GomboAdsService.updateConfig({ allowActiveDelivery: nextVal }, adminId);
  };

  const handleTogglePlacement = async (placement: GomboAdsPlacement) => {
    if (!globalConfig) return;
    const placementsConfig = { ...globalConfig.placementsConfig };
    placementsConfig[placement] = !placementsConfig[placement];
    setGlobalConfig({ ...globalConfig, placementsConfig });
    await GomboAdsService.updateConfig({ placementsConfig }, adminId);
  };

  // Offers management
  const handleSaveOffer = async () => {
    if (!newOffer.id || !newOffer.name) return;
    
    let updatedOffers = [...offers];
    if (editingOffer) {
      updatedOffers = updatedOffers.map(o => o.id === editingOffer.id ? (newOffer as GomboAdsOffer) : o);
    } else {
      if (offers.some(o => o.id === newOffer.id)) {
        alert("Une offre avec cet identifiant existe déjà !");
        return;
      }
      updatedOffers.push(newOffer as GomboAdsOffer);
    }

    setSavingConfig(true);
    const ok = await GomboAdsService.updateOffers(updatedOffers, adminId);
    if (ok) {
      setOffers(updatedOffers);
      setShowOfferForm(false);
      setEditingOffer(null);
      setNewOffer({
        id: "",
        name: "",
        priceGawa: 100,
        durationDays: 1,
        budgetGawa: 100,
        placements: ["accueil", "gombo"],
        enabled: true
      });
    }
    setSavingConfig(false);
  };

  const handleToggleOfferEnabled = async (offerId: string) => {
    const updatedOffers = offers.map(o => o.id === offerId ? { ...o, enabled: !o.enabled } : o);
    setOffers(updatedOffers);
    await GomboAdsService.updateOffers(updatedOffers, adminId);
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette offre promotionnelle ?")) return;
    const updatedOffers = offers.filter(o => o.id !== offerId);
    setOffers(updatedOffers);
    await GomboAdsService.updateOffers(updatedOffers, adminId);
  };

  const filteredCampaigns = campaigns.filter((c) => {
    if (activeTab === "PENDING" && c.status !== "PENDING_REVIEW") return false;
    if (activeTab === "ACTIVE" && c.status !== "ACTIVE") return false;
    if (activeTab === "PAUSED" && c.status !== "PAUSED") return false;
    if (activeTab === "REJECTED" && c.status !== "REJECTED") return false;
    if (activeTab === "EXPIRED" && c.status !== "EXPIRED" && c.status !== "ARCHIVED") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title?.toLowerCase().includes(q);
      const matchOwner = c.ownerName?.toLowerCase().includes(q);
      const matchType = c.type?.toLowerCase().includes(q);
      if (!matchTitle && !matchOwner && !matchType) return false;
    }

    return true;
  });

  // Counts & Calculations in Gawa
  const pendingCount = campaigns.filter((c) => c.status === "PENDING_REVIEW").length;
  const activeCount = campaigns.filter((c) => c.status === "ACTIVE").length;
  const totalGawaSpent = campaigns
    .filter((c) => c.status === "ACTIVE" || c.status === "EXPIRED" || c.status === "COMPLETED" || c.status === "ARCHIVED")
    .reduce((acc, c) => acc + (c.spentBudget || 0), 0);

  return (
    <div className="space-y-5 font-sans pb-10">

      {/* Header Panel */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#18181b] via-[#0d0d0f] to-black border border-[#D4AF37]/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[11px] font-black text-[#D4AF37] uppercase tracking-wider">
              <Megaphone className="w-3.5 h-3.5" />
              RÉGIE GOMBO ADS • SUPER FOUNDER
            </span>
            <h2 className="text-xl font-black text-white mt-1">
              Centre de Contrôle & Approbation
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-zinc-950 border border-zinc-800 text-right">
              <span className="text-[10px] font-bold text-zinc-400 block uppercase">Volume de Gawa Consommé</span>
              <span className="text-base font-black text-[#D4AF37] font-mono flex items-center justify-end gap-1">
                <Coins className="w-4 h-4 text-[#D4AF37]" />
                {totalGawaSpent.toLocaleString("fr-FR")} G
              </span>
            </div>
          </div>
        </div>

        {/* Outer Tabs (Campaigns, Config, Logs) */}
        <div className="flex items-center gap-2 border-t border-zinc-800/80 pt-4 text-xs font-black">
          <button
            onClick={() => setActiveSubTab("CAMPAIGNS")}
            className={`px-4 py-2.5 rounded-2xl transition-colors flex items-center gap-2 uppercase ${
              activeSubTab === "CAMPAIGNS" ? "bg-[#D4AF37] text-black" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Approbations ({pendingCount})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("CONFIG")}
            className={`px-4 py-2.5 rounded-2xl transition-colors flex items-center gap-2 uppercase ${
              activeSubTab === "CONFIG" ? "bg-[#D4AF37] text-black" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Tarification & Toggles</span>
          </button>

          <button
            onClick={() => setActiveSubTab("LOGS")}
            className={`px-4 py-2.5 rounded-2xl transition-colors flex items-center gap-2 uppercase ${
              activeSubTab === "LOGS" ? "bg-[#D4AF37] text-black" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Journal d'audit</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: CAMPAIGN MANAGEMENT */}
      {activeSubTab === "CAMPAIGNS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 overflow-x-auto text-xs font-bold">
              <button 
                onClick={() => setActiveTab("PENDING")}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors relative ${activeTab === "PENDING" ? "bg-[#D4AF37] text-black" : "text-zinc-400 hover:text-white"}`}
              >
                En examen ({pendingCount})
              </button>
              <button 
                onClick={() => setActiveTab("ACTIVE")}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${activeTab === "ACTIVE" ? "bg-[#D4AF37] text-black" : "text-zinc-400 hover:text-white"}`}
              >
                Actives ({activeCount})
              </button>
              <button 
                onClick={() => setActiveTab("PAUSED")}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${activeTab === "PAUSED" ? "bg-[#D4AF37] text-black" : "text-zinc-400 hover:text-white"}`}
              >
                Suspendues
              </button>
              <button 
                onClick={() => setActiveTab("REJECTED")}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${activeTab === "REJECTED" ? "bg-[#D4AF37] text-black" : "text-zinc-400 hover:text-white"}`}
              >
                Refusées
              </button>
              <button 
                onClick={() => setActiveTab("EXPIRED")}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${activeTab === "EXPIRED" ? "bg-[#D4AF37] text-black" : "text-zinc-400 hover:text-white"}`}
              >
                Expirées / Complétées
              </button>
            </div>

            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher titre ou membre..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-[#D4AF37] outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-zinc-500 text-xs font-mono">
              Synchronisation des campagnes...
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="p-10 rounded-3xl bg-zinc-900/50 border border-zinc-800 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400 font-medium font-mono">
                Aucune campagne Gombo Ads dans cette catégorie.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCampaigns.map((camp) => {
                const ctr = camp.impressions > 0 ? ((camp.clicks / camp.impressions) * 100).toFixed(2) : "0.00";
                
                return (
                  <div 
                    key={camp.id}
                    className="p-4.5 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-3 shadow-lg"
                  >
                    {/* Top Row: Owner Info & Financial Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[#D4AF37] text-[10px] font-black overflow-hidden font-mono">
                          {camp.ownerAvatar ? (
                            <img src={camp.ownerAvatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            camp.ownerName?.[0] || "U"
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-extrabold text-white block leading-tight">{camp.ownerName}</span>
                          {camp.ownerPhone && (
                            <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                              <Phone className="w-2.5 h-2.5 text-[#D4AF37]" />
                              {camp.ownerPhone}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full uppercase">
                          OFFRE: {camp.offerId || "Custom"}
                        </span>

                        <span className="text-xs font-black text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-0.5 rounded-lg border border-[#D4AF37]/30 font-mono">
                          {camp.totalCost.toLocaleString("fr-FR")} G
                        </span>
                      </div>
                    </div>

                    {/* Campaign Body */}
                    <div className="flex gap-3">
                      {camp.mediaUrl ? (
                        <img src={camp.mediaUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-zinc-800 flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[#D4AF37] flex-shrink-0">
                          <Megaphone className="w-7 h-7" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="text-sm font-extrabold text-white truncate">{camp.title}</h4>
                        <p className="text-xs text-zinc-300 line-clamp-2">{camp.description}</p>
                        
                        <div className="text-[10px] text-zinc-400 pt-0.5 flex flex-wrap gap-x-2 gap-y-1 font-mono">
                          <span>Durée: <strong>{camp.durationDays}j</strong></span>
                          <span>• Commune: <strong>{camp.commune || "Cocody"}</strong></span>
                          <span>• Début: <strong>{camp.startAt ? new Date(camp.startAt).toLocaleDateString("fr-FR") : "-"}</strong></span>
                          <span>• Fin: <strong>{camp.endAt ? new Date(camp.endAt).toLocaleDateString("fr-FR") : "-"}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Budget Consumption Bar */}
                    <div className="space-y-1 bg-zinc-950 p-2.5 rounded-2xl border border-zinc-800/60">
                      <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                        <span>Budget Consommé : <strong>{camp.spentBudget?.toFixed(2) || "0.00"} G</strong></span>
                        <span>Restant : <strong className="text-[#D4AF37]">{camp.remainingBudget?.toFixed(2) || "0.00"} G</strong></span>
                      </div>
                      <div className="w-full bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-[#D4AF37]" 
                          style={{ width: `${Math.min(100, (((camp.spentBudget || 0) / (camp.totalCost || 1)) * 100))}%` }}
                        />
                      </div>
                    </div>

                    {/* Metrics Dashboard */}
                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-zinc-800/80 text-center text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Vues uniques</span>
                        <span className="font-extrabold text-white">{camp.uniqueViews || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Clics</span>
                        <span className="font-extrabold text-white">{camp.clicks || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Engagements</span>
                        <span className="font-extrabold text-white">{camp.engagements || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">CTR / VTR</span>
                        <span className="font-extrabold text-[#D4AF37]">{ctr}%</span>
                      </div>
                    </div>

                    {/* Admin Action Bar */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/80">
                      {camp.status === "PENDING_REVIEW" && (
                        <>
                          <button 
                            onClick={() => setSelectedRejectCamp(camp)}
                            className="py-2 px-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 font-extrabold text-[11px] flex items-center gap-1 hover:bg-red-500/20 transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>REFUSER & REFUNDER</span>
                          </button>

                          <button 
                            onClick={() => handleApprove(camp)}
                            className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-black font-black text-[11px] flex items-center gap-1 shadow-lg active:scale-95 transition-transform"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>VALIDER & DIFFUSER</span>
                          </button>
                        </>
                      )}

                      {camp.status === "ACTIVE" && (
                        <>
                          <button 
                            onClick={() => setSelectedRefundCamp(camp)}
                            className="py-1.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[11px] flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Casser / Rembourser reliquat</span>
                          </button>

                          <button 
                            onClick={() => handlePause(camp.id)}
                            className="py-1.5 px-3 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-[11px] flex items-center gap-1"
                          >
                            <Pause className="w-3.5 h-3.5" />
                            <span>Suspendre</span>
                          </button>
                        </>
                      )}

                      {camp.status === "PAUSED" && (
                        <button 
                          onClick={() => handleResume(camp.id)}
                          className="py-1.5 px-3 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-bold text-[11px] flex items-center gap-1"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Relancer</span>
                        </button>
                      )}

                      {(camp.status === "EXPIRED" || camp.status === "REJECTED" || camp.status === "COMPLETED") && (
                        <button 
                          onClick={() => handleArchive(camp.id)}
                          className="py-1.5 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-500 font-bold text-[11px] flex items-center gap-1"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          <span>Archiver</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: CONFIGURATION & OFFERS */}
      {activeSubTab === "CONFIG" && globalConfig && (
        <div className="space-y-6">

          {/* General Switches */}
          <div className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-4 shadow-md">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#D4AF37]" />
              INTERRUPTEURS GLOBAUX
            </h3>

            <div className="space-y-3 pt-2">
              {/* Toggle 1: Global Status */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950 border border-zinc-800/60">
                <div>
                  <span className="text-xs font-extrabold text-white block">MODULE GOMBO ADS</span>
                  <span className="text-[10px] text-zinc-400">Activer ou suspendre l'intégralité du système Gombo Ads</span>
                </div>
                <button
                  onClick={handleToggleGlobalEnabled}
                  className={`px-4 py-1.5 rounded-xl font-black text-xs transition-colors ${
                    globalConfig.enabled ? "bg-emerald-500 text-black" : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {globalConfig.enabled ? "FONCTIONNEL" : "DESACTIVÉ"}
                </button>
              </div>

              {/* Toggle 2: New Campaigns */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950 border border-zinc-800/60">
                <div>
                  <span className="text-xs font-extrabold text-white block">AUTORISER LES NOUVEAUX ACHATS</span>
                  <span className="text-[10px] text-zinc-400">Permettre aux membres de payer de nouvelles promotions</span>
                </div>
                <button
                  onClick={handleToggleAllowNew}
                  className={`px-4 py-1.5 rounded-xl font-black text-xs transition-colors ${
                    globalConfig.allowNewCampaigns ? "bg-emerald-500 text-black" : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {globalConfig.allowNewCampaigns ? "AUTORISÉ" : "BLOQUÉ"}
                </button>
              </div>

              {/* Toggle 3: Delivery Status */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950 border border-zinc-800/60">
                <div>
                  <span className="text-xs font-extrabold text-white block">DIFFUSION ACTIVE DES ANNONCES</span>
                  <span className="text-[10px] text-zinc-400">Suspendre instantanément l'affichage de toutes les bannières actives</span>
                </div>
                <button
                  onClick={handleToggleActiveDelivery}
                  className={`px-4 py-1.5 rounded-xl font-black text-xs transition-colors ${
                    globalConfig.allowActiveDelivery ? "bg-emerald-500 text-black" : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {globalConfig.allowActiveDelivery ? "ACTIVE" : "EN PAUSE"}
                </button>
              </div>
            </div>
          </div>

          {/* Placement Switches */}
          <div className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-4 shadow-md">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#D4AF37]" />
              PLacements publicitaires autorisés
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {(["accueil", "gombo", "decouverte", "profil", "reels", "evenements"] as GomboAdsPlacement[]).map((p) => {
                const isEnabled = globalConfig.placementsConfig?.[p] ?? true;
                return (
                  <div key={p} className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/60 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white uppercase font-mono">{p}</span>
                    <button
                      onClick={() => handleTogglePlacement(p)}
                      className={`px-3 py-1 rounded-xl text-[10px] font-black tracking-wide ${
                        isEnabled ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {isEnabled ? "ACTIF" : "OFF"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Offers Editor */}
          <div className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#D4AF37]" />
                PACKS D'OFFRES PUBLICITAIRES GAWA
              </h3>

              <button
                onClick={() => {
                  setEditingOffer(null);
                  setNewOffer({
                    id: "",
                    name: "",
                    priceGawa: 100,
                    durationDays: 1,
                    budgetGawa: 100,
                    placements: ["accueil", "gombo"],
                    enabled: true
                  });
                  setShowOfferForm(true);
                }}
                className="p-1.5 rounded-xl bg-[#D4AF37] text-black font-black text-xs flex items-center gap-1 active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau pack</span>
              </button>
            </div>

            {/* Offers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {offers.map((offer) => (
                <div key={offer.id} className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        {offer.name}
                        <span className="text-[10px] font-mono text-zinc-400 uppercase">({offer.id})</span>
                      </h4>
                      <span className="text-[10px] text-zinc-400 block mt-1">Placements: {offer.placements.join(", ")}</span>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setEditingOffer(offer);
                          setNewOffer({ ...offer });
                          setShowOfferForm(true);
                        }}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:text-white text-zinc-400 text-xs font-bold"
                      >
                        Éditer
                      </button>
                      <button
                        onClick={() => handleDeleteOffer(offer.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono bg-zinc-900/60 p-2 rounded-xl">
                    <div>
                      <span className="text-[9px] text-zinc-500 block">Prix Gawa</span>
                      <span className="font-extrabold text-[#D4AF37]">{offer.priceGawa} G</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 block">Durée</span>
                      <span className="font-extrabold text-white">{offer.durationDays} jour(s)</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 block">Budget Gawa</span>
                      <span className="font-extrabold text-emerald-400">{offer.budgetGawa} G</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-zinc-500 font-bold">Statut de l'offre</span>
                    <button
                      onClick={() => handleToggleOfferEnabled(offer.id)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black ${
                        offer.enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {offer.enabled ? "ACTIVE" : "INACTIVE"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* SUBTAB 3: SECURITY LOGS */}
      {activeSubTab === "LOGS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#D4AF37]" />
              JOURNAL D'AUDIT DE SÉCURITÉ GOMBO ADS
            </h3>
            <button
              onClick={() => {}}
              className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loadingLogs ? (
            <div className="py-12 text-center text-zinc-500 text-xs font-mono">
              Interrogation du journal d'audit...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs font-mono border border-zinc-800 rounded-3xl bg-zinc-900/40">
              Aucune transaction administrative consignée pour l'instant.
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {logs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-850 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-[#D4AF37] uppercase">{log.action}</span>
                    <span className="text-[10px] text-zinc-500">{new Date(log.date).toLocaleString("fr-FR")}</span>
                  </div>

                  <div className="text-[11px] text-zinc-400 space-y-0.5 leading-relaxed">
                    <div>Admin ID : <span className="text-white">{log.adminId}</span></div>
                    {log.campaignId && <div>Campagne : <span className="text-white">{log.campaignId}</span></div>}
                    <div className="flex gap-2 items-center text-[10px] pt-1">
                      <span className="bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded truncate max-w-[200px]">Old: {log.oldValue}</span>
                      <span className="text-zinc-600">→</span>
                      <span className="bg-[#D4AF37]/15 text-[#D4AF37] px-1.5 py-0.5 rounded truncate max-w-[200px]">New: {log.newValue}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {selectedRejectCamp && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#09090b] border border-red-500/40 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                Refuser la Campagne Gombo Ads
              </h3>
              <button 
                onClick={() => setSelectedRejectCamp(null)}
                className="p-1 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Le refus de la campagne annulera sa diffusion et <strong>remboursera automatiquement {selectedRejectCamp.totalCost.toLocaleString("fr-FR")} Gawa</strong> sur le compte du membre ({selectedRejectCamp.ownerName}).
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">
                Motif du refus (Transmis au membre)
              </label>
              <textarea 
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Image non conforme / Titre trompeur / Contenu ne respectant pas la charte."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-red-500 outline-none h-24 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setSelectedRejectCamp(null)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-zinc-400 font-bold text-xs"
              >
                Annuler
              </button>
              <button 
                onClick={handleRejectSubmit}
                disabled={processingAction}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-black text-xs shadow-lg active:scale-95 transition-transform"
              >
                {processingAction ? "Remboursement..." : "CONFIRMER REFUS"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL REFUND MODAL */}
      {selectedRefundCamp && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#09090b] border border-amber-500/40 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                Interrompre & Rembourser la campagne
              </h3>
              <button 
                onClick={() => setSelectedRefundCamp(null)}
                className="p-1 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Vous allez mettre fin prématurément à cette campagne. Le budget non dépensé soit <strong className="text-emerald-400 font-mono">{selectedRefundCamp.remainingBudget?.toFixed(2) || "0.00"} Gawa</strong> sera crédité immédiatement sur le solde de l'annonceur.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">
                Raison de l'annulation administrative
              </label>
              <textarea 
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Raison invoquée..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-amber-500 outline-none h-24 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setSelectedRefundCamp(null)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-zinc-400 font-bold text-xs"
              >
                Annuler
              </button>
              <button 
                onClick={handleRefundSubmit}
                disabled={processingAction}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black font-black text-xs shadow-lg active:scale-95 transition-transform"
              >
                {processingAction ? "Crédit..." : "RETOURNER LE RELIQUAT"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFFER EDITING DIALOG / DRAWER */}
      {showOfferForm && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#09090b] border border-[#D4AF37]/40 rounded-3xl p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-white">
              {editingOffer ? "Éditer l'Offre Gombo Ads" : "Nouveau Pack Promotionnel"}
            </h3>

            <div className="space-y-3.5 text-xs text-zinc-300">
              {/* Offer ID */}
              <div>
                <label className="font-bold text-zinc-400 block mb-1">Identifiant unique (id)</label>
                <input
                  type="text"
                  disabled={Boolean(editingOffer)}
                  value={newOffer.id}
                  onChange={(e) => setNewOffer({ ...newOffer, id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })}
                  placeholder="starter, boost_super, etc."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:border-[#D4AF37] outline-none disabled:opacity-50"
                />
              </div>

              {/* Offer Name */}
              <div>
                <label className="font-bold text-zinc-400 block mb-1">Nom public de l'offre</label>
                <input
                  type="text"
                  value={newOffer.name}
                  onChange={(e) => setNewOffer({ ...newOffer, name: e.target.value })}
                  placeholder="Ex: Starter, Booster, Super Premium"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Cost in Gawa */}
                <div>
                  <label className="font-bold text-zinc-400 block mb-1">Prix (Gawa)</label>
                  <input
                    type="number"
                    value={newOffer.priceGawa}
                    onChange={(e) => setNewOffer({ ...newOffer, priceGawa: Number(e.target.value) })}
                    placeholder="100"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:border-[#D4AF37] outline-none font-mono"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="font-bold text-zinc-400 block mb-1">Durée (jours)</label>
                  <input
                    type="number"
                    value={newOffer.durationDays}
                    onChange={(e) => setNewOffer({ ...newOffer, durationDays: Number(e.target.value) })}
                    placeholder="1"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:border-[#D4AF37] outline-none font-mono"
                  />
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="font-bold text-zinc-400 block mb-1">Budget Total alloué (Gawa)</label>
                <input
                  type="number"
                  value={newOffer.budgetGawa}
                  onChange={(e) => setNewOffer({ ...newOffer, budgetGawa: Number(e.target.value) })}
                  placeholder="100"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:border-[#D4AF37] outline-none font-mono"
                />
              </div>

              {/* Placements */}
              <div>
                <label className="font-bold text-zinc-400 block mb-1">Placements autorisés (séparés par virgules)</label>
                <input
                  type="text"
                  value={newOffer.placements?.join(", ")}
                  onChange={(e) => setNewOffer({ ...newOffer, placements: e.target.value.split(",").map(v => v.trim() as GomboAdsPlacement) })}
                  placeholder="accueil, gombo, reels"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white focus:border-[#D4AF37] outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowOfferForm(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-zinc-400 font-bold text-xs"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveOffer}
                disabled={savingConfig}
                className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] text-black font-black text-xs shadow-lg active:scale-95 transition-transform"
              >
                {savingConfig ? "Enregistrement..." : "ENREGISTRER"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

