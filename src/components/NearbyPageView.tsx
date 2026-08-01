import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, MapPin, Radar, Navigation, Filter, Zap, Music, Star, ShieldCheck, Compass } from "lucide-react";
import { Gombo, User } from "../types";
import { AfrigoRadarMap } from "./AfrigoRadarMap";
import { getDistanceLabel, estimateTravelTimes } from "../lib/geoUtils";

interface NearbyPageViewProps {
  gombos: Gombo[];
  users: User[];
  currentUser: any;
  onBack: () => void;
  onSelectGombo: (g: Gombo) => void;
  onApplyGombo: (g: Gombo) => void;
  geo: {
    latitude: number | null;
    longitude: number | null;
    permissionStatus: string;
    requestLocation: () => void;
    getNearbyItems: (items: any[], radiusKm: number) => any[];
  };
}

export const NearbyPageView: React.FC<NearbyPageViewProps> = ({
  gombos,
  users,
  currentUser,
  onBack,
  onSelectGombo,
  onApplyGombo,
  geo
}) => {
  const [radius, setRadius] = useState<number>(15);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [mapInteractive, setMapInteractive] = useState<boolean>(false);

  const nearbyGombos = geo.getNearbyItems(gombos, radius);
  const nearbyArtists = geo.getNearbyItems(users.filter(u => u.role === "musicien"), radius);

  const filteredGombos = nearbyGombos.filter(g => {
    if (selectedCategory === "all") return true;
    return g.category === selectedCategory || (g as any).type === selectedCategory;
  });

  return (
    <div className="w-full h-full flex flex-col bg-afri-bg text-afri-text font-sans select-none overflow-hidden touch-none">
      {/* Top Header - Consolidated */}
      <div className="flex-none bg-afri-bg/95 backdrop-blur-md border-b border-afri-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 bg-afri-bg-sec rounded-xl text-afri-text border border-afri-border"
        >
          <ArrowLeft className="w-5 h-5 text-afri-gold" />
        </button>
        <h1 className="text-sm font-black uppercase tracking-wider text-afri-text flex items-center gap-2">
          <span>Près de Moi</span>
        </h1>
      </div>

      {/* Main Content View */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* CARTE */}
        <div className="flex-none h-[40vh] w-full relative">
          <AfrigoRadarMap
            gombos={gombos}
            userLocation={{ latitude: geo.latitude || 5.3600, longitude: geo.longitude || -4.0083 }}
            onSelectGombo={onSelectGombo}
            onApplyGombo={onApplyGombo}
            geoPermissionStatus={geo.permissionStatus}
            onRequestLocation={geo.requestLocation}
          />
        </div>

        {/* CONTROLS & LIST */}
        <div className="flex-1 flex flex-col overflow-hidden bg-afri-bg">
          {/* HORIZONTAL CHIPS - Unified */}
          <div className="flex-none px-4 py-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
             <div className="flex gap-1.5 shrink-0">
               {[5, 10, 25].map(r => (
                 <button
                   key={r}
                   onClick={() => setRadius(r)}
                   className={`px-4 py-2 rounded-xl text-xs font-bold transition ${radius === r ? "bg-afri-gold text-afri-text" : "bg-afri-bg-sec text-afri-text-sec"}`}
                 >
                   {r}km
                 </button>
               ))}
             </div>
          </div>

          {/* LISTE */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
            {filteredGombos.length === 0 ? (
              <div className="text-center text-afri-text-muted text-xs py-10">Aucun Gombo trouvé.</div>
            ) : (
              filteredGombos.map((gombo: any) => {
                const travel = estimateTravelTimes(gombo.distance || 3);
                return (
                  <div
                    key={gombo.id}
                    onClick={() => onSelectGombo(gombo)}
                    className="bg-afri-bg-sec/20 border border-afri-border rounded-2xl p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-sm">{gombo.title}</p>
                      <p className="text-xs text-afri-text-sec">{gombo.location}</p>
                    </div>
                    <span className="text-emerald-400 font-black text-xs">{Number(gombo.budget || 0).toLocaleString()} FCFA</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
