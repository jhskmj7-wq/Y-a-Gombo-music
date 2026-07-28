import React from "react";
import { motion } from "motion/react";
import { MapPin, Music, Zap, Clock, Star, Phone } from "lucide-react";
import { Gombo, User, UserProfile } from "../types";
import { getDistanceLabel, estimateTravelTimes } from "../lib/geoUtils";

interface NearbyGombosSectionProps {
  gombos: Gombo[];
  userProfile?: UserProfile | null;
  onSelect: (gombo: Gombo) => void;
}

export const NearbyGombosSection: React.FC<NearbyGombosSectionProps> = ({ gombos, userProfile, onSelect }) => {
  if (gombos.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-[11px] font-black tracking-[0.2em] text-afri-text uppercase flex items-center gap-2 px-1">
        <MapPin className="w-4 h-4 text-[#D4AF37]" />
        📍 Gombos près de vous
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-1">
        {gombos.slice(0, 4).map((gombo: any) => (
          <div 
            key={gombo.id}
            onClick={() => onSelect(gombo)}
            className="afri-card p-3 flex gap-3 cursor-pointer group hover:border-[#D4AF37]/40 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-afri-bg-ter flex items-center justify-center border border-afri-border group-hover:border-[#D4AF37]/30 transition">
              <Zap className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-[#D4AF37] uppercase">
                  {getDistanceLabel(gombo.distance, { 
                    userCommune: userProfile?.commune, 
                    itemCommune: gombo.commune,
                    userCity: userProfile?.city,
                    itemCity: gombo.city
                  })}
                </span>
                <span className="text-[8px] font-mono text-afri-text-sec uppercase">🚗 {estimateTravelTimes(gombo.distance).car} min</span>
              </div>
              <h4 className="text-[11px] font-black text-afri-text uppercase">{gombo.title}</h4>
              <p className="text-[10px] text-afri-text-sec font-bold uppercase truncate">{gombo.commune || "Abidjan"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface NearbyArtistsSectionProps {
  artists: User[];
  userProfile?: UserProfile | null;
  onContact: (artist: User) => void;
}

export const NearbyArtistsSection: React.FC<NearbyArtistsSectionProps> = ({ artists, userProfile, onContact }) => {
  if (artists.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-[11px] font-black tracking-[0.2em] text-afri-text uppercase flex items-center gap-2 px-1">
        <Music className="w-4 h-4 text-emerald-500" />
        🎼 Artistes disponibles autour
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide">
        {artists.slice(0, 10).map((artist: any) => (
          <div 
            key={artist.uid}
            className="min-w-[180px] max-w-[180px] afri-card p-3 space-y-3 shrink-0 relative"
          >
            {artist.availability?.status === "available" && (
              <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[7px] font-black text-emerald-500 uppercase">Dispo</span>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <img 
                src={artist.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
                alt={artist.artisticName}
                className="w-10 h-10 rounded-xl object-cover border border-afri-border"
              />
              <div className="flex-1 overflow-hidden">
                <h4 className="text-[10px] font-black text-afri-text uppercase truncate">{artist.artisticName || artist.displayName}</h4>
                <div className="flex items-center gap-1">
                  <Star className="w-2 h-2 text-amber-500 fill-amber-500" />
                  <span className="text-[8px] font-bold text-afri-text-sec uppercase">{artist.gomboId?.niveau || 1} • {artist.averageRating?.toFixed(1) || "5.0"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1 pt-1 border-t border-afri-border/50">
              <div className="flex items-center justify-between text-[8.5px] font-bold text-afri-text-sec uppercase">
                <span>{artist.commune || "Abidjan"}</span>
                <span className="text-afri-text">
                  {getDistanceLabel(artist.distance, {
                    userCommune: userProfile?.commune,
                    itemCommune: artist.commune,
                    userCity: userProfile?.city,
                    itemCity: artist.city
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[8px] font-mono text-afri-text-sec/80 uppercase">
                <span>🚶 {estimateTravelTimes(artist.distance).walk}m</span>
                <span>🛵 {estimateTravelTimes(artist.distance).moto}m</span>
              </div>
            </div>

            <button 
              onClick={() => onContact(artist)}
              className="w-full py-1.5 bg-afri-bg-ter border border-afri-border hover:bg-afri-bg-sec hover:text-black transition-all rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Phone className="w-2.5 h-2.5" />
              Contacter
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
