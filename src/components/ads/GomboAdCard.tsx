import React, { useEffect, useRef } from "react";
import { Megaphone, Sparkles, MapPin, ExternalLink, ShieldCheck, UserCheck, Calendar } from "lucide-react";
import { GomboAdsCampaign } from "../../types";
import { GomboAdsService } from "../../services/GomboAdsService";

interface GomboAdCardProps {
  ad: GomboAdsCampaign;
  onNavigateToTarget?: (targetType: string, targetId: string) => void;
  layout?: "compact" | "feed" | "banner";
}

export const GomboAdCard: React.FC<GomboAdCardProps> = ({
  ad,
  onNavigateToTarget,
  layout = "feed"
}) => {
  const impressionRecorded = useRef(false);

  useEffect(() => {
    if (!impressionRecorded.current && ad?.id) {
      impressionRecorded.current = true;
      GomboAdsService.recordImpression(ad.id);
    }
  }, [ad?.id]);

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (ad?.id) {
      GomboAdsService.recordClick(ad.id);
    }
    if (onNavigateToTarget) {
      onNavigateToTarget(ad.type, ad.targetId);
    }
  };

  const getCtaText = () => {
    switch (ad.type) {
      case "profile":
        return "VOIR LE PROFIL";
      case "event":
        return "VOIR L'ÉVÉNEMENT";
      case "offer":
        return "VOIR L'OFFRE";
      case "gombo":
      default:
        return "VOIR LE GOMBO";
    }
  };

  const getTypeLabel = () => {
    switch (ad.type) {
      case "profile":
        return "TALENT SPONSORISÉ";
      case "event":
        return "ÉVÉNEMENT A LA UNE";
      case "offer":
        return "OFFRE SPÉCIALE";
      case "gombo":
      default:
        return "OPPORTUNITÉ SPONSORISÉE";
    }
  };

  if (layout === "compact") {
    return (
      <div 
        onClick={handleAction}
        className="relative w-full rounded-2xl bg-gradient-to-b from-[#18181b] to-[#09090b] border border-[#D4AF37]/40 p-3.5 shadow-lg shadow-black/60 overflow-hidden cursor-pointer hover:border-[#D4AF37] transition-all"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[10px] font-bold text-[#D4AF37] tracking-wider uppercase">
            <Sparkles className="w-3 h-3 text-[#D4AF37] animate-pulse" />
            SPONSORISÉ
          </span>
          {ad.commune && (
            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
              <MapPin className="w-3 h-3 text-[#D4AF37]" />
              {ad.commune}
            </span>
          )}
        </div>

        <div className="flex gap-3 items-center">
          {ad.mediaUrl ? (
            <img 
              src={ad.mediaUrl} 
              alt={ad.title} 
              className="w-16 h-16 rounded-xl object-cover border border-zinc-800 flex-shrink-0"
              loading="lazy"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center flex-shrink-0">
              <Megaphone className="w-7 h-7 text-[#D4AF37]" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white truncate leading-snug">
              {ad.title}
            </h4>
            <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">
              {ad.description}
            </p>
          </div>
        </div>

        <button 
          onClick={handleAction}
          className="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#b89327] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-transform"
        >
          <span>{getCtaText()}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div 
      onClick={handleAction}
      className="relative w-full rounded-2xl bg-[#0d0d0f] border border-[#D4AF37]/35 p-4 shadow-xl shadow-black/80 overflow-hidden cursor-pointer hover:border-[#D4AF37]/80 transition-all my-3"
    >
      {/* Background Subtle Gold Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-[11px] font-black text-[#D4AF37] tracking-wider uppercase shadow-sm">
            <Megaphone className="w-3.5 h-3.5 text-[#D4AF37]" />
            GOMBO ADS • {getTypeLabel()}
          </span>
        </div>

        {ad.commune && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-300 bg-zinc-900/80 px-2.5 py-0.5 rounded-lg border border-zinc-800">
            <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
            {ad.commune}
          </span>
        )}
      </div>

      {/* Image / Media Hero */}
      {ad.mediaUrl && (
        <div className="relative w-full h-44 sm:h-52 rounded-xl overflow-hidden mb-3 border border-zinc-800">
          <img 
            src={ad.mediaUrl} 
            alt={ad.title} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          {ad.ownerName && (
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
              {ad.ownerAvatar ? (
                <img src={ad.ownerAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <UserCheck className="w-4 h-4 text-[#D4AF37]" />
              )}
              <span className="text-xs font-semibold text-white">{ad.ownerName}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Copy */}
      <div className="space-y-1">
        <h3 className="text-base font-extrabold text-white leading-tight">
          {ad.title}
        </h3>
        <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed">
          {ad.description}
        </p>
      </div>

      {/* Footer CTA */}
      <div className="mt-3.5 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3">
        <div className="text-[11px] text-zinc-400 font-medium">
          Partenaire Certifié AFRIGOMBO
        </div>

        <button 
          onClick={handleAction}
          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#f1d06b] to-[#D4AF37] text-black font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-[#D4AF37]/20 active:scale-95 transition-transform"
        >
          <span>{getCtaText()}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
