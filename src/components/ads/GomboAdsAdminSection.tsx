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
  ExternalLink
} from "lucide-react";
import { GomboAdsCampaign, GomboAdsStatus } from "../../types";
import { GomboAdsService } from "../../services/GomboAdsService";

interface GomboAdsAdminSectionProps {
  adminProfile: any;
}

export const GomboAdsAdminSection: React.FC<GomboAdsAdminSectionProps> = ({ adminProfile }) => {
  const [campaigns, setCampaigns] = useState<GomboAdsCampaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"PENDING" | "ACTIVE" | "PAUSED" | "REJECTED" | "EXPIRED" | "ALL">("PENDING");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Rejection Modal
  const [selectedRejectCamp, setSelectedRejectCamp] = useState<GomboAdsCampaign | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [processingAction, setProcessingAction] = useState<boolean>(false);

  useEffect(() => {
    const unsub = GomboAdsService.listenAllCampaigns((list) => {
      setCampaigns(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const adminId = adminProfile?.uid || adminProfile?.id || "super_admin";

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

  const handlePause = async (campaignId: string) => {
    await GomboAdsService.pauseCampaign(campaignId);
  };

  const handleResume = async (campaignId: string) => {
    await GomboAdsService.resumeCampaign(campaignId);
  };

  const handleArchive = async (campaignId: string) => {
    await GomboAdsService.archiveCampaign(campaignId);
  };

  const filteredCampaigns = campaigns.filter((c) => {
    // Tab filter
    if (activeTab === "PENDING" && c.status !== "PENDING_REVIEW") return false;
    if (activeTab === "ACTIVE" && c.status !== "ACTIVE") return false;
    if (activeTab === "PAUSED" && c.status !== "PAUSED") return false;
    if (activeTab === "REJECTED" && c.status !== "REJECTED") return false;
    if (activeTab === "EXPIRED" && c.status !== "EXPIRED" && c.status !== "ARCHIVED") return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title?.toLowerCase().includes(q);
      const matchOwner = c.ownerName?.toLowerCase().includes(q);
      const matchType = c.type?.toLowerCase().includes(q);
      if (!matchTitle && !matchOwner && !matchType) return false;
    }

    return true;
  });

  // Counts
  const pendingCount = campaigns.filter((c) => c.status === "PENDING_REVIEW").length;
  const activeCount = campaigns.filter((c) => c.status === "ACTIVE").length;
  const totalRevenue = campaigns
    .filter((c) => c.status === "ACTIVE" || c.status === "EXPIRED" || c.status === "APPROVED")
    .reduce((acc, c) => acc + (c.totalCost || 0), 0);

  return (
    <div className="space-y-5 font-sans">

      {/* Header & Revenue Summary */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#18181b] via-[#0d0d0f] to-black border border-[#D4AF37]/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[11px] font-black text-[#D4AF37] uppercase tracking-wider">
              <Megaphone className="w-3.5 h-3.5" />
              GESTION GOMBO ADS • SUPER FOUNDER
            </span>
            <h2 className="text-xl font-black text-white mt-1">
              Centre d'Approbation & Régie Publicitaire
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-2xl bg-zinc-950 border border-zinc-800 text-right">
              <span className="text-[10px] font-bold text-zinc-400 block uppercase">Revenus Générés</span>
              <span className="text-sm font-black text-[#D4AF37]">{totalRevenue.toLocaleString("fr-FR")} FCFA</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-zinc-800/80 text-xs">
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <span className="text-zinc-400 block text-[11px]">En Attente</span>
            <span className={`text-base font-black ${pendingCount > 0 ? "text-amber-400 animate-pulse" : "text-white"}`}>
              {pendingCount}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <span className="text-zinc-400 block text-[11px]">Campagnes Actives</span>
            <span className="text-base font-black text-emerald-400">{activeCount}</span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <span className="text-zinc-400 block text-[11px]">Total Créations</span>
            <span className="text-base font-black text-white">{campaigns.length}</span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <span className="text-zinc-400 block text-[11px]">Taux Approbation</span>
            <span className="text-base font-black text-[#D4AF37]">
              {campaigns.length > 0
                ? `${Math.round(((campaigns.length - campaigns.filter((c) => c.status === "REJECTED").length) / campaigns.length) * 100)}%`
                : "100%"}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Tabs Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs */}
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
              Expirées
            </button>
            <button 
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${activeTab === "ALL" ? "bg-[#D4AF37] text-black" : "text-zinc-400 hover:text-white"}`}
            >
              Toutes ({campaigns.length})
            </button>
          </div>

          {/* Search bar */}
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

        {/* Campaign List Cards */}
        {loading ? (
          <div className="py-12 text-center text-zinc-500 text-xs">
            Chargement des demandes de campagnes Gombo Ads...
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400 font-medium">
              Aucune campagne trouvée dans cet onglet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCampaigns.map((camp) => {
              const ctr = camp.impressions > 0 ? ((camp.clicks / camp.impressions) * 100).toFixed(1) : "0.0";

              return (
                <div 
                  key={camp.id}
                  className="p-4.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3 shadow-lg"
                >
                  {/* Top Row: User & Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[#D4AF37] text-xs font-bold overflow-hidden">
                        {camp.ownerAvatar ? (
                          <img src={camp.ownerAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          camp.ownerName?.[0] || "U"
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-white block leading-tight">{camp.ownerName}</span>
                        {camp.ownerPhone && (
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 text-[#D4AF37]" />
                            {camp.ownerPhone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-zinc-400 px-2 py-0.5 rounded bg-zinc-800">
                        {camp.type}
                      </span>

                      {camp.status === "PENDING_REVIEW" && (
                        <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                          EN ATTENTE DE VALIDATION
                        </span>
                      )}

                      {camp.status === "ACTIVE" && (
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                          ACTIVE
                        </span>
                      )}

                      {camp.status === "REJECTED" && (
                        <span className="text-[10px] font-black text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 rounded-full">
                          REFUSÉE
                        </span>
                      )}

                      {camp.status === "PAUSED" && (
                        <span className="text-[10px] font-black text-zinc-400 bg-zinc-800 px-2.5 py-0.5 rounded-full">
                          SUSPENDUE
                        </span>
                      )}

                      <span className="text-xs font-black text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-0.5 rounded-lg border border-[#D4AF37]/30">
                        {camp.totalCost.toLocaleString("fr-FR")} FCFA
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
                      <h4 className="text-sm font-extrabold text-white">{camp.title}</h4>
                      <p className="text-xs text-zinc-300 line-clamp-2">{camp.description}</p>
                      <div className="text-[10px] text-zinc-400 pt-0.5 flex flex-wrap gap-2">
                        <span>Durée : <strong>{camp.durationDays} jour(s)</strong></span>
                        <span>• Commune : <strong>{camp.commune || "Abidjan"}</strong></span>
                        <span>• Créé le : <strong>{new Date(camp.createdAt).toLocaleDateString("fr-FR")}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Rejection Note display */}
                  {camp.status === "REJECTED" && camp.rejectionReason && (
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                      <strong>Motif de refus :</strong> "{camp.rejectionReason}"
                    </div>
                  )}

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Impressions</span>
                      <span className="font-extrabold text-white">{camp.impressions || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Clics</span>
                      <span className="font-extrabold text-white">{camp.clicks || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">CTR</span>
                      <span className="font-extrabold text-[#D4AF37]">{ctr}%</span>
                    </div>
                  </div>

                  {/* Action Buttons for Super Founder */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/80">
                    {camp.status === "PENDING_REVIEW" && (
                      <>
                        <button 
                          onClick={() => setSelectedRejectCamp(camp)}
                          disabled={processingAction}
                          className="py-2 px-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 font-extrabold text-xs flex items-center gap-1 hover:bg-red-500/20"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>REFUSER & REMBOURSER</span>
                        </button>

                        <button 
                          onClick={() => handleApprove(camp)}
                          disabled={processingAction}
                          className="py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-black font-black text-xs flex items-center gap-1 shadow-lg active:scale-95 transition-transform"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>APPROUVER & ACTIVER</span>
                        </button>
                      </>
                    )}

                    {camp.status === "ACTIVE" && (
                      <button 
                        onClick={() => handlePause(camp.id)}
                        className="py-1.5 px-3 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs flex items-center gap-1"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>Suspendre</span>
                      </button>
                    )}

                    {camp.status === "PAUSED" && (
                      <button 
                        onClick={() => handleResume(camp.id)}
                        className="py-1.5 px-3 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-bold text-xs flex items-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Relancer</span>
                      </button>
                    )}

                    {(camp.status === "EXPIRED" || camp.status === "REJECTED" || camp.status === "PAUSED") && (
                      <button 
                        onClick={() => handleArchive(camp.id)}
                        className="py-1.5 px-3 rounded-xl bg-zinc-950 text-zinc-500 font-bold text-xs flex items-center gap-1"
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
              Le refus de la campagne annulera sa diffusion et <strong>remboursera automatiquement {selectedRejectCamp.totalCost.toLocaleString("fr-FR")} FCFA</strong> sur le Wallet du membre ({selectedRejectCamp.ownerName}).
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

    </div>
  );
};
