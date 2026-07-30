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
  const [activeTab, setActiveTab] = useState<"map" | "list" | "artists">("map");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const nearbyGombos = geo.getNearbyItems(gombos, radius);
  const nearbyArtists = geo.getNearbyItems(users.filter(u => u.role === "musicien"), radius);

  const filteredGombos = nearbyGombos.filter(g => {
    if (selectedCategory === "all") return true;
    return g.category === selectedCategory || (g as any).type === selectedCategory;
  });

  return (
    <div className="w-full min-h-[100dvh] bg-afri-bg text-afri-text flex flex-col font-sans select-none overflow-y-auto overscroll-contain touch-pan-y relative pb-24">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-afri-bg/95 backdrop-blur-md border-b border-afri-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-afri-bg-sec hover:bg-afri-bg-sec/80 rounded-xl text-afri-text transition cursor-pointer border border-afri-border"
          >
            <ArrowLeft className="w-5 h-5 text-afri-gold" />
          </button>
          <div>
            <h1 className="text-sm sm:text-base font-black uppercase tracking-wider text-afri-text flex items-center gap-2">
              <Radar className="w-5 h-5 text-afri-gold animate-pulse" />
              <span>Près de Moi (Radar Live)</span>
            </h1>
            <p className="text-[10px] font-mono text-afri-text-sec uppercase">
              {geo.latitude && geo.longitude ? "Géolocalisation satellite active 🟢" : "Abidjan (Position par défaut 📍)"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-afri-bg-sec p-1 rounded-xl border border-afri-border">
          <button
            onClick={() => setActiveTab("map")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${activeTab === "map" ? "bg-afri-gold text-black shadow-md" : "text-afri-text-sec hover:text-afri-text"}`}
          >
            Carte
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${activeTab === "list" ? "bg-afri-gold text-black shadow-md" : "text-afri-text-sec hover:text-afri-text"}`}
          >
            Gombos ({nearbyGombos.length})
          </button>
          <button
            onClick={() => setActiveTab("artists")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${activeTab === "artists" ? "bg-afri-gold text-black shadow-md" : "text-afri-text-sec hover:text-afri-text"}`}
          >
            Artistes ({nearbyArtists.length})
          </button>
        </div>
      </div>

      {/* Radius & Filters Bar */}
      <div className="px-4 py-3 bg-afri-bg-sec/30 border-b border-afri-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-afri-text uppercase">Rayon :</span>
          {[5, 10, 25, 50].map(r => (
            <button
              key={r}
              onClick={() => setRadius(r)}
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition border ${radius === r ? "bg-afri-gold text-black border-afri-gold" : "bg-afri-bg-sec text-afri-text-sec border-afri-border hover:text-afri-text"}`}
            >
              {r} km
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {["all", "concert", "maquis", "eglise", "renfort", "casting"].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition ${selectedCategory === cat ? "bg-afri-gold text-black" : "bg-afri-bg-sec text-afri-text-sec hover:text-afri-text border border-afri-border"}`}
            >
              {cat === "all" ? "Tous" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content View */}
      <div className="flex-1 p-4 max-w-7xl w-full mx-auto space-y-4">
        {activeTab === "map" && (
          <div className="h-[650px] w-full rounded-2xl overflow-hidden border border-afri-border shadow-xl relative">
            <AfrigoRadarMap
              gombos={gombos}
              userLocation={{ latitude: geo.latitude || 5.3600, longitude: geo.longitude || -4.0083 }}
              onSelectGombo={onSelectGombo}
              onApplyGombo={onApplyGombo}
              geoPermissionStatus={geo.permissionStatus}
              onRequestLocation={geo.requestLocation}
            />
          </div>
        )}

        {activeTab === "list" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGombos.length === 0 ? (
              <div className="col-span-full py-16 text-center space-y-3 bg-afri-bg-sec/10 rounded-2xl border border-afri-border">
                <Radar className="w-10 h-10 text-afri-gold mx-auto animate-pulse" />
                <p className="text-xs font-bold text-afri-text uppercase">Aucun Gombo trouvé dans ce rayon ({radius} km)</p>
                <p className="text-[10px] text-afri-text-sec">Essayez d'élargir le rayon de recherche ou changez de catégorie.</p>
              </div>
            ) : (
              filteredGombos.map((gombo: any) => {
                const travel = estimateTravelTimes(gombo.distance || 3);
                return (
                  <motion.div
                    key={gombo.id}
                    whileHover={{ y: -3 }}
                    onClick={() => onSelectGombo(gombo)}
                    className="bg-afri-bg-sec/20 border border-afri-border rounded-2xl p-4 space-y-3 cursor-pointer hover:border-afri-gold/50 transition shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-afri-gold/10 text-afri-gold border border-afri-gold/30 rounded-full text-[9px] font-mono font-bold uppercase">
                        {gombo.category || "Gombo"}
                      </span>
                      <span className="text-[10px] font-mono font-black text-emerald-400">
                        {Number(gombo.budget || 0).toLocaleString()} FCFA
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-afri-text uppercase truncate">{gombo.title}</h3>
                      <p className="text-[11px] text-afri-text-sec flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-afri-gold shrink-0" />
                        <span className="truncate">{gombo.location || "Abidjan"} ({getDistanceLabel(gombo.distance || 3)})</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-afri-border/60 text-[10px] font-mono text-afri-text-sec">
                      <span>🛵 Moto: ~{travel.moto} min</span>
                      <span className="text-afri-gold font-bold">Voir détails →</span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "artists" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearbyArtists.length === 0 ? (
              <div className="col-span-full py-16 text-center space-y-3 bg-afri-bg-sec/10 rounded-2xl border border-afri-border">
                <Music className="w-10 h-10 text-afri-gold mx-auto animate-pulse" />
                <p className="text-xs font-bold text-afri-text uppercase">Aucun artiste disponible dans ce rayon ({radius} km)</p>
              </div>
            ) : (
              nearbyArtists.map((artist: any) => (
                <div
                  key={artist.uid}
                  className="bg-afri-bg-sec/20 border border-afri-border rounded-2xl p-4 flex items-center gap-4 shadow-md"
                >
                  <img
                    src={artist.photoURL || artist.avatar || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150"}
                    alt={artist.nomArtistique || artist.displayName}
                    className="w-14 h-14 rounded-full object-cover border-2 border-afri-gold"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-afri-text uppercase truncate">
                      {artist.nomArtistique || artist.displayName || "Artiste"}
                    </h4>
                    <p className="text-[10px] text-afri-text-sec truncate">{artist.instrument || artist.specialite || "Musicien"}</p>
                    <p className="text-[9px] font-mono text-afri-gold mt-1">📍 {getDistanceLabel(artist.distance || 2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
