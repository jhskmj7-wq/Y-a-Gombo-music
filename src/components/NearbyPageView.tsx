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

        <div className="text-right hidden sm:block">
          <span className="text-[10px] font-mono px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded-full font-bold">
            ⚡ RADAR TEMPS RÉEL
          </span>
        </div>
      </div>

      {/* HORIZONTAL CHIPS ROW (Rayon + Categories combined) */}
      <div className="px-4 py-3 bg-afri-bg-sec/25 border-b border-afri-border flex items-center gap-3 overflow-x-auto scrollbar-none select-none">
        <span className="text-[10px] font-mono text-afri-text-muted uppercase tracking-wider shrink-0">Rayon:</span>
        {[5, 10, 25, 50].map(r => (
          <button
            key={r}
            onClick={() => setRadius(r)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold shrink-0 transition border ${radius === r ? "bg-afri-gold text-afri-text border-afri-gold" : "bg-afri-bg-sec text-afri-text-sec border-afri-border hover:text-afri-text"}`}
          >
            {r} km
          </button>
        ))}

        <div className="w-[1px] h-4 bg-afri-border shrink-0 mx-1" />

        <span className="text-[10px] font-mono text-afri-text-muted uppercase tracking-wider shrink-0">Filtre:</span>
        {["all", "concert", "maquis", "eglise", "renfort", "casting"].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase shrink-0 transition border ${selectedCategory === cat ? "bg-afri-gold text-afri-text border-afri-gold" : "bg-afri-bg-sec text-afri-text-sec border-afri-border hover:text-afri-text"}`}
          >
            {cat === "all" ? "Tous" : cat === "eglise" ? "Église" : cat}
          </button>
        ))}
      </div>

      {/* Main Content View */}
      <div className="flex-1 flex flex-col">
        {/* CARTE EN PREMIER */}
        <div className="h-[50vh] sm:h-[65vh] w-full relative">
          <AfrigoRadarMap
            gombos={gombos}
            userLocation={{ latitude: geo.latitude || 5.3600, longitude: geo.longitude || -4.0083 }}
            onSelectGombo={onSelectGombo}
            onApplyGombo={onApplyGombo}
            geoPermissionStatus={geo.permissionStatus}
            onRequestLocation={geo.requestLocation}
          />

          {/* Click shield to unlock map scrolling and let the finger slide across the page */}
          {!mapInteractive && (
            <div 
              onClick={() => setMapInteractive(true)}
              className="absolute inset-0 bg-afri-bg/45 backdrop-blur-[1px] z-[999] flex flex-col items-center justify-center p-4 cursor-pointer select-none active:bg-afri-bg/50 transition-colors"
            >
              <div className="bg-[#0A0A0A] border border-afri-gold/40 rounded-2xl p-4 flex flex-col items-center gap-2 max-w-xs text-center shadow-2xl animate-fadeIn">
                <span className="p-2 rounded-full bg-afri-gold/10 text-afri-gold">
                  <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
                </span>
                <strong className="text-xs text-afri-text uppercase tracking-wider font-bold">Carte Interactive verrouillée</strong>
                <p className="text-[10px] text-afri-text-sec leading-relaxed font-medium">
                  Tapotez la carte pour l'activer et naviguer.
                </p>
              </div>
            </div>
          )}

          {/* If interactive, show a button to lock map again */}
          {mapInteractive && (
            <button
              onClick={() => setMapInteractive(false)}
              className="absolute top-4 left-4 bg-[#0A0A0A] hover:bg-afri-bg-sec border border-afri-gold/40 text-afri-gold px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-lg z-[999] flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <span>Verrouiller 🔒</span>
            </button>
          )}
        </div>

        {/* HORIZONTAL CHIPS ROW (Rayon + Categories combined) - Compacted */}
        <div className="px-4 py-3 bg-afri-bg border-b border-afri-border flex items-center gap-2 overflow-x-auto scrollbar-none select-none sticky top-[60px] z-30">
          <div className="flex gap-1.5 shrink-0">
            {[5, 10, 25, 50].map(r => (
              <button
                key={r}
                onClick={() => setRadius(r)}
                className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition ${radius === r ? "bg-afri-gold text-afri-text" : "bg-afri-bg-sec text-afri-text-sec"}`}
              >
                {r}km
              </button>
            ))}
          </div>

          <div className="w-[1px] h-4 bg-afri-border shrink-0 mx-1" />

          <div className="flex gap-1.5 shrink-0">
            {["all", "concert", "maquis", "eglise", "renfort", "casting"].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition ${selectedCategory === cat ? "bg-afri-gold text-afri-text" : "bg-afri-bg-sec text-afri-text-sec"}`}
              >
                {cat === "all" ? "Tous" : cat === "eglise" ? "Église" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* LISTE DES GOMBOS */}
        <div className="p-4 space-y-4 flex-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-afri-gold flex items-center gap-1.5">
              <Radar className="w-4 h-4 text-afri-gold animate-pulse" />
              <span>Gombos ({filteredGombos.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredGombos.length === 0 ? (
              <div className="col-span-full py-12 text-center text-afri-text-muted text-xs">Aucun Gombo trouvé.</div>
            ) : (
              filteredGombos.map((gombo: any) => {
                const travel = estimateTravelTimes(gombo.distance || 3);
                return (
                  <motion.div
                    key={gombo.id}
                    onClick={() => onSelectGombo(gombo)}
                    className="bg-afri-bg-sec/20 border border-afri-border rounded-2xl p-4 space-y-2 cursor-pointer hover:border-afri-gold/50 transition"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-afri-text">{gombo.title}</span>
                      <span className="text-emerald-400 font-black">{Number(gombo.budget || 0).toLocaleString()} FCFA</span>
                    </div>
                    <div className="text-[10px] text-afri-text-sec flex justify-between">
                      <span>{gombo.location || "Abidjan"}</span>
                      <span>🛵 ~{travel.moto} min</span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
