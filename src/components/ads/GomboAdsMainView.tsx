import React, { useState, useEffect } from "react";
import { 
  Megaphone, 
  Sparkles, 
  Plus, 
  UserCheck, 
  Calendar, 
  Eye, 
  MousePointerClick, 
  TrendingUp, 
  Pause, 
  Play, 
  Archive, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Wallet,
  ArrowLeft,
  RefreshCw,
  BarChart2
} from "lucide-react";
import { GomboAdsCampaign, GomboAdsType } from "../../types";
import { GomboAdsService } from "../../services/GomboAdsService";
import { GomboAdsCreationWizard } from "./GomboAdsCreationWizard";
import { AndroidPageLayout } from "../layout/AndroidPageLayout";
import { AndroidCard } from "../layout/AndroidCard";
import { getCanonicalWalletBalance } from "../../lib/financial";

interface GomboAdsMainViewProps {
  currentUserProfile: any;
  onBack?: () => void;
  onOpenWalletDeposit: () => void;
  onNavigateToTarget?: (type: string, targetId: string) => void;
}

export const GomboAdsMainView: React.FC<GomboAdsMainViewProps> = ({
  currentUserProfile,
  onBack,
  onOpenWalletDeposit,
  onNavigateToTarget
}) => {
  const userId = currentUserProfile?.uid || currentUserProfile?.id;
  const walletBalance = getCanonicalWalletBalance(currentUserProfile) ?? 0;

  const [campaigns, setCampaigns] = useState<GomboAdsCampaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Wizard Modal state
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [wizardInitialType, setWizardInitialType] = useState<GomboAdsType>("gombo");

  // Filter state
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "pending" | "ended">("all");

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const unsub = GomboAdsService.listenUserCampaigns(userId, (list) => {
      setCampaigns(list);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  const openWizardFor = (type: GomboAdsType) => {
    setWizardInitialType(type);
    setIsWizardOpen(true);
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

  const getFilteredCampaigns = () => {
    switch (activeFilter) {
      case "active":
        return campaigns.filter((c) => c.status === "ACTIVE");
      case "pending":
        return campaigns.filter((c) => c.status === "PENDING_REVIEW");
      case "ended":
        return campaigns.filter((c) => c.status === "EXPIRED" || c.status === "ARCHIVED" || c.status === "REJECTED");
      case "all":
      default:
        return campaigns;
    }
  };

  // Aggregated stats
  const totalImpressions = campaigns.reduce((acc, c) => acc + (c.impressions || 0), 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0);
  const totalSpent = campaigns.reduce((acc, c) => acc + (c.totalCost || 0), 0);
  const overallCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";

  return (
    <AndroidPageLayout
      header={
        <header className="flex-none bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 px-3.5 py-2.5 flex items-center justify-between gap-2 z-35 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {onBack && (
              <button 
                onClick={onBack}
                className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h1 className="text-sm font-black uppercase tracking-wider text-white">
                GOMBO ADS
              </h1>
              <p className="text-[10px] text-[#D4AF37] font-bold">Régie Publicitaire Native</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-white">
            <Wallet className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="font-extrabold">{walletBalance.toLocaleString("fr-FR")} FCFA</span>
          </div>
        </header>
      }
    >
      <div className="space-y-5 pb-12">

        {/* HERO BANNER */}
        <div className="relative w-full rounded-3xl bg-gradient-to-br from-[#18181b] via-[#0d0d0f] to-black border border-[#D4AF37]/40 p-5 shadow-2xl shadow-black overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[11px] font-black text-[#D4AF37] tracking-wider uppercase">
              <Megaphone className="w-3.5 h-3.5 text-[#D4AF37]" />
              FAIS GRANDIR TON GOMBO
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Donne plus de visibilité à tes publications, ton talent et tes événements.
            </h2>

            <p className="text-xs text-zinc-300 leading-relaxed max-w-lg">
              Propulse tes opportunités en tête du fil AFRIGOMBO et touche directement des milliers de membres actifs en Côte d'Ivoire et en Afrique de l'Ouest.
            </p>

            <button 
              onClick={() => openWizardFor("gombo")}
              className="mt-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#f1d06b] to-[#D4AF37] text-black font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-[#D4AF37]/20 active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4 text-black stroke-[3]" />
              <span>LANCER UNE CAMPAGNE</span>
            </button>
          </div>
        </div>

        {/* PROMOTION CATEGORY CARDS */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider px-1">
            QUE SOUHAITES-TU PROMOUVOIR ?
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Card 1: Gombo */}
            <div 
              onClick={() => openWizardFor("gombo")}
              className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-[#D4AF37]/60 transition-all cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 transition-transform">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">Promouvoir un Gombo</h4>
                  <p className="text-[11px] text-zinc-400">Publicité & mission</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-[#D4AF37] transition-colors" />
            </div>

            {/* Card 2: Profil */}
            <div 
              onClick={() => openWizardFor("profile")}
              className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-[#D4AF37]/60 transition-all cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 transition-transform">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">Promouvoir mon Profil</h4>
                  <p className="text-[11px] text-zinc-400">Talent en avant</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-[#D4AF37] transition-colors" />
            </div>

            {/* Card 3: Événement */}
            <div 
              onClick={() => openWizardFor("event")}
              className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-[#D4AF37]/60 transition-all cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">Promouvoir un Événement</h4>
                  <p className="text-[11px] text-zinc-400">Concert & showcase</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-[#D4AF37] transition-colors" />
            </div>
          </div>
        </div>

        {/* GLOBAL STATS DASHBOARD IF USER HAS CAMPAIGNS */}
        {campaigns.length > 0 && (
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4" />
                PERFORMANCES GLOBALES
              </span>
              <span className="text-[11px] text-zinc-400 font-bold">
                {campaigns.length} campagne(s)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                <Eye className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                <span className="text-sm font-black text-white block">{totalImpressions.toLocaleString("fr-FR")}</span>
                <span className="text-[10px] text-zinc-400 font-medium">Impressions</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                <MousePointerClick className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <span className="text-sm font-black text-white block">{totalClicks.toLocaleString("fr-FR")}</span>
                <span className="text-[10px] text-zinc-400 font-medium">Clics reçus</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                <TrendingUp className="w-4 h-4 text-[#D4AF37] mx-auto mb-1" />
                <span className="text-sm font-black text-white block">{overallCtr}%</span>
                <span className="text-[10px] text-zinc-400 font-medium">Taux Clics (CTR)</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                <Wallet className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <span className="text-sm font-black text-white block">{totalSpent.toLocaleString("fr-FR")} FCFA</span>
                <span className="text-[10px] text-zinc-400 font-medium">Budget Investi</span>
              </div>
            </div>
          </div>
        )}

        {/* CAMPAIGNS LIST SECTION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider px-1">
              MES CAMPAGNES ({getFilteredCampaigns().length})
            </h3>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-[11px]">
              <button 
                onClick={() => setActiveFilter("all")}
                className={`px-2.5 py-0.5 rounded-lg font-bold transition-colors ${activeFilter === "all" ? "bg-[#D4AF37] text-black" : "text-zinc-400"}`}
              >
                Toutes
              </button>
              <button 
                onClick={() => setActiveFilter("active")}
                className={`px-2.5 py-0.5 rounded-lg font-bold transition-colors ${activeFilter === "active" ? "bg-[#D4AF37] text-black" : "text-zinc-400"}`}
              >
                Actives
              </button>
              <button 
                onClick={() => setActiveFilter("pending")}
                className={`px-2.5 py-0.5 rounded-lg font-bold transition-colors ${activeFilter === "pending" ? "bg-[#D4AF37] text-black" : "text-zinc-400"}`}
              >
                Examen
              </button>
              <button 
                onClick={() => setActiveFilter("ended")}
                className={`px-2.5 py-0.5 rounded-lg font-bold transition-colors ${activeFilter === "ended" ? "bg-[#D4AF37] text-black" : "text-zinc-400"}`}
              >
                Finies
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              Chargement de vos campagnes Gombo Ads...
            </div>
          ) : getFilteredCampaigns().length === 0 ? (
            <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 text-center space-y-3">
              <Megaphone className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400 font-medium">
                Aucune campagne {activeFilter !== "all" ? "dans cette catégorie" : "créée pour le moment"}.
              </p>
              <button 
                onClick={() => openWizardFor("gombo")}
                className="py-2.5 px-4 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] font-bold text-xs"
              >
                Créer ma première campagne
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {getFilteredCampaigns().map((camp) => {
                const ctr = camp.impressions > 0 ? ((camp.clicks / camp.impressions) * 100).toFixed(1) : "0.0";

                return (
                  <div 
                    key={camp.id}
                    className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3 shadow-lg"
                  >
                    {/* Status & Type Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-zinc-400 px-2 py-0.5 rounded-md bg-zinc-800">
                          {camp.type}
                        </span>

                        {camp.status === "ACTIVE" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            ACTIVE
                          </span>
                        )}

                        {camp.status === "PENDING_REVIEW" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3 text-amber-400" />
                            EXAMEN EN COURS
                          </span>
                        )}

                        {camp.status === "PAUSED" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                            <Pause className="w-3 h-3" />
                            SUSPENDUE
                          </span>
                        )}

                        {camp.status === "REJECTED" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full">
                            REFUSÉE & REMBOURSÉE
                          </span>
                        )}

                        {camp.status === "EXPIRED" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-800">
                            EXPIRÉE
                          </span>
                        )}
                      </div>

                      <span className="text-xs font-extrabold text-[#D4AF37]">
                        {camp.totalCost.toLocaleString("fr-FR")} FCFA
                      </span>
                    </div>

                    {/* Content Preview */}
                    <div className="flex items-center gap-3">
                      {camp.mediaUrl ? (
                        <img src={camp.mediaUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-zinc-800 flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-[#D4AF37] flex-shrink-0">
                          <Megaphone className="w-6 h-6" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{camp.title}</h4>
                        <p className="text-[11px] text-zinc-400 line-clamp-1">{camp.description}</p>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          {camp.durationDays} jour(s) • Du {new Date(camp.createdAt).toLocaleDateString("fr-FR")}
                          {camp.endAt && ` au ${new Date(camp.endAt).toLocaleDateString("fr-FR")}`}
                        </div>
                      </div>
                    </div>

                    {/* Rejection Note */}
                    {camp.status === "REJECTED" && camp.rejectionReason && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-200">
                        <strong>Motif du refus :</strong> "{camp.rejectionReason}". Le montant de {camp.totalCost.toLocaleString("fr-FR")} FCFA a été immédiatement crédité sur votre Wallet.
                      </div>
                    )}

                    {/* Mini Stats Bar */}
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

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      {camp.status === "ACTIVE" && (
                        <button 
                          onClick={() => handlePause(camp.id)}
                          className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs flex items-center gap-1 hover:bg-zinc-700"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          <span>Suspendre</span>
                        </button>
                      )}

                      {camp.status === "PAUSED" && (
                        <button 
                          onClick={() => handleResume(camp.id)}
                          className="px-3 py-1.5 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-bold text-xs flex items-center gap-1"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Relancer</span>
                        </button>
                      )}

                      {(camp.status === "EXPIRED" || camp.status === "PAUSED" || camp.status === "REJECTED") && (
                        <button 
                          onClick={() => handleArchive(camp.id)}
                          className="px-3 py-1.5 rounded-xl bg-zinc-950 text-zinc-500 font-bold text-xs flex items-center gap-1 hover:text-zinc-300"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          <span>Archiver</span>
                        </button>
                      )}

                      {onNavigateToTarget && (
                        <button 
                          onClick={() => onNavigateToTarget(camp.type, camp.targetId)}
                          className="px-3 py-1.5 rounded-xl bg-zinc-800 text-white font-bold text-xs flex items-center gap-1"
                        >
                          <span>Voir contenu</span>
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Creation Wizard Sheet */}
      <GomboAdsCreationWizard 
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        currentUserProfile={currentUserProfile}
        initialType={wizardInitialType}
        onSuccess={(id) => {
          // Toast or scroll to campaigns
        }}
        onOpenWalletDeposit={onOpenWalletDeposit}
      />
    </AndroidPageLayout>
  );
};
