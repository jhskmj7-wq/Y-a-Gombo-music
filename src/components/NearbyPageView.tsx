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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold shrink-0 transition border ${radius === r ? "bg-afri-gold text-black border-afri-gold" : "bg-afri-bg-sec text-afri-text-sec border-afri-border hover:text-afri-text"}`}
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
            className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase shrink-0 transition border ${selectedCategory === cat ? "bg-afri-gold text-black border-afri-gold" : "bg-afri-bg-sec text-afri-text-sec border-afri-border hover:text-afri-text"}`}
          >
            {cat === "all" ? "Tous" : cat === "eglise" ? "Église" : cat}
          </button>
        ))}
      </div>

      {/* Main Content View */}
      <div className="flex-1 p-4 max-w-4xl w-full mx-auto space-y-6">
        {/* CARTE EN PREMIER */}
        <div className="h-[380px] sm:h-[480px] w-full rounded-3xl overflow-hidden border border-afri-border shadow-2xl relative">
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
              className="absolute inset-0 bg-black/45 backdrop-blur-[1px] z-[999] flex flex-col items-center justify-center p-4 cursor-pointer select-none active:bg-black/50 transition-colors"
            >
              <div className="bg-[#0A0A0A] border border-afri-gold/40 rounded-2xl p-4 flex flex-col items-center gap-2 max-w-xs text-center shadow-2xl animate-fadeIn">
                <span className="p-2 rounded-full bg-afri-gold/10 text-afri-gold">
                  <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
                </span>
                <strong className="text-xs text-white uppercase tracking-wider font-bold">Carte Interactive verrouillée</strong>
                <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
                  Tapotez la carte pour l'activer et naviguer. Glissez en dehors pour faire défiler la page sans blocage.
                </p>
              </div>
            </div>
          )}

          {/* If interactive, show a button to lock map again */}
          {mapInteractive && (
            <button
              onClick={() => setMapInteractive(false)}
              className="absolute top-4 left-4 bg-[#0A0A0A] hover:bg-zinc-900 border border-afri-gold/40 text-afri-gold px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg z-[999] flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <span>Verrouiller le défilement 🔒</span>
            </button>
          )}
        </div>

        {/* LISTE DES GOMBOS À PROXIMITÉ (SUIVIE IMMÉDIATEMENT) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-afri-gold flex items-center gap-1.5">
              <Radar className="w-4 h-4 text-afri-gold animate-pulse" />
              <span>Gombos & Opportunités à proximité ({filteredGombos.length})</span>
            </h2>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-lg">
              Rayon : {radius} km
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredGombos.length === 0 ? (
              <div className="col-span-full py-12 text-center space-y-3 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl">
                <Radar className="w-8 h-8 text-zinc-600 mx-auto animate-pulse" />
                <p className="text-xs font-bold text-white uppercase">Aucun Gombo trouvé</p>
                <p className="text-[10px] text-zinc-500 font-mono">Modifiez les filtres de rayon ou de catégorie ci-dessus.</p>
              </div>
            ) : (
              filteredGombos.map((gombo: any) => {
                const travel = estimateTravelTimes(gombo.distance || 3);
                return (
                  <motion.div
                    key={gombo.id}
                    whileHover={{ y: -2 }}
                    onClick={() => onSelectGombo(gombo)}
                    className="bg-afri-bg-sec/20 border border-afri-border rounded-2xl p-4 space-y-3 cursor-pointer hover:border-afri-gold/50 transition shadow-lg relative group overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 bg-afri-gold/10 text-afri-gold border border-afri-gold/30 rounded-lg text-[9px] font-mono font-bold uppercase">
                        {gombo.category || "Gombo"}
                      </span>
                      <span className="text-xs font-mono font-black text-emerald-400">
                        {Number(gombo.budget || 0).toLocaleString()} FCFA
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xs font-black text-white uppercase truncate group-hover:text-afri-gold transition">
                        {gombo.title}
                      </h3>
                      <p className="text-[10px] text-zinc-400 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-afri-gold shrink-0" />
                        <span className="truncate">{gombo.location || "Abidjan"} ({getDistanceLabel(gombo.distance || 3)})</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-afri-border/60 text-[9px] font-mono text-zinc-500">
                      <span>🛵 Moto: ~{travel.moto} min</span>
                      <span className="text-afri-gold font-bold group-hover:underline">Postuler →</span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* SECONDAIRE: ARTISTES À PROXIMITÉ SI EXISTANTS */}
        {nearbyArtists.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-afri-border">
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
              <Music className="w-4 h-4 text-zinc-400" />
              <span>Musiciens & Artistes à proximité ({nearbyArtists.length})</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {nearbyArtists.map((artist: any) => (
                <div
                  key={artist.uid}
                  className="bg-afri-bg-sec/10 border border-afri-border rounded-2xl p-4 flex items-center gap-4 shadow-md"
                >
                  <img
                    src={artist.photoURL || artist.avatar || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150"}
                    alt={artist.nomArtistique || artist.displayName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-afri-gold"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-white uppercase truncate">
                      {artist.nomArtistique || artist.displayName || "Artiste"}
                    </h4>
                    <p className="text-[10px] text-zinc-400 truncate">{artist.instrument || artist.specialite || "Musicien"}</p>
                    <p className="text-[9px] font-mono text-afri-gold mt-1">📍 {getDistanceLabel(artist.distance || 2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
