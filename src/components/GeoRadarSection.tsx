import React from "react";
import { motion } from "motion/react";
import { Radar, MapPin, Zap, Music, Users, Home, GraduationCap, ShoppingBag } from "lucide-react";
import { Gombo, User, Renfort } from "../types";
import { getDistanceLabel, estimateTravelTimes } from "../lib/geoUtils";

interface GeoRadarSectionProps {
  nearbyGombos: Gombo[];
  nearbyArtists: User[];
  nearbyStudios?: any[];
  nearbySalles?: any[];
  onAction: (item: any) => void;
}

export const GeoRadarSection: React.FC<GeoRadarSectionProps> = ({
  nearbyGombos,
  nearbyArtists,
  onAction
}) => {
  const allItems = [
    ...nearbyGombos.map(g => ({ ...g, radarType: "gombo" })),
    ...nearbyArtists.map(a => ({ ...a, radarType: "artist" })),
  ].sort((a: any, b: any) => a.distance - b.distance);

  if (allItems.length === 0) return null;

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[11px] font-black tracking-[0.2em] text-afri-text uppercase flex items-center gap-2">
          <div className="relative">
            <Radar className="w-4 h-4 text-afri-bg-sec animate-pulse" />
            <div className="absolute inset-0 bg-afri-bg-sec/20 rounded-full animate-ping" />
          </div>
          📡 Autour de moi (Radar)
        </h3>
        <span className="text-[8px] font-mono text-afri-text-sec uppercase font-bold bg-afri-bg-ter px-2 py-0.5 rounded-full border border-afri-border">
          {allItems.length} opportunités proches
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide">
        {allItems.slice(0, 15).map((item: any, idx) => {
          const travel = estimateTravelTimes(item.distance);
          return (
            <motion.div
              key={`${item.id}-${idx}`}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onAction(item)}
              className="min-w-[160px] max-w-[160px] bg-afri-bg-sec/10 border border-afri-border rounded-2xl p-3 space-y-2.5 shadow-sm hover:border-afri-bg-sec/50 transition-colors cursor-pointer group shrink-0"
            >
              <div className="flex items-center justify-between">
                <div className="p-1.5 rounded-lg bg-afri-bg-sec/20 border border-afri-border group-hover:border-afri-bg-sec/30 transition-colors">
                  {item.radarType === "gombo" ? (
                    <Zap className="w-3 h-3 text-amber-500" />
                  ) : (
                    <Music className="w-3 h-3 text-afri-bg-sec" />
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black text-afri-text leading-none uppercase">
                    {getDistanceLabel(item.distance)}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5 text-[8px] font-mono text-afri-text-sec uppercase">
                    <span>🛵 {travel.moto}min</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-[10px] font-black text-afri-text uppercase truncate">
                  {item.title || item.artisticName || "Inconnu"}
                </h4>
                <div className="flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-afri-text-sec" />
                  <span className="text-[9px] font-bold text-afri-text-sec truncate uppercase">
                    {item.commune || "Abidjan"}
                  </span>
                </div>
              </div>

              {item.availability?.status === "available" && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full w-fit">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-black text-emerald-500 uppercase">En ligne</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
