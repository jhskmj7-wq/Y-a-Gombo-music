import React, { useState } from "react";
import { motion } from "motion/react";
import { BackButton } from "./common/BackButton";
import { AndroidPageLayout } from "./layout/AndroidPageLayout";
import { AndroidCard } from "./layout/AndroidCard";
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
    <AndroidPageLayout title="Près de Moi" onBack={onBack}>
      {/* CARTE */}
      <div className="flex-none h-[40vh] w-full relative -mt-3 -mx-2">
        <AfrigoRadarMap
          gombos={gombos}
          userLocation={{ latitude: geo.latitude || 5.3600, longitude: geo.longitude || -4.0083 }}
          onSelectGombo={onSelectGombo}
          onApplyGombo={onApplyGombo}
          geoPermissionStatus={geo.permissionStatus}
          onRequestLocation={geo.requestLocation}
        />
      </div>

      {/* CONTROLS */}
      <div className="flex-none flex items-center gap-2 overflow-x-auto scrollbar-none px-1 overscroll-contain [-webkit-overflow-scrolling:touch] touch-pan-x">
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

      {/* LISTE */}
      <div className="space-y-3">
        {filteredGombos.length === 0 ? (
          <div className="text-center text-afri-text-muted text-xs py-10">Aucun Gombo trouvé.</div>
        ) : (
          filteredGombos.map((gombo: any) => (
            <AndroidCard
              key={gombo.id}
              onClick={() => onSelectGombo(gombo)}
              className="flex justify-between items-center"
            >
              <div>
                <p className="font-bold text-sm">{gombo.title}</p>
                <p className="text-xs text-afri-text-sec">{gombo.location}</p>
              </div>
              <span className="text-emerald-400 font-black text-xs">{Number(gombo.budget || 0).toLocaleString()} FCFA</span>
            </AndroidCard>
          ))
        )}
      </div>
    </AndroidPageLayout>
  );
};
