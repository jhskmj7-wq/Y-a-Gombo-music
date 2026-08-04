import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { MapPin, Navigation, Compass, Crosshair, ArrowRight, X, ExternalLink, Route, AlertCircle } from "lucide-react";

interface GomboItineraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTitle?: string;
  targetCommune?: string;
  targetLat?: number;
  targetLng?: number;
}

// Default Abidjan coordinates fallback
const ABIDJAN_COMMUNES_COORDS: Record<string, { lat: number; lng: number }> = {
  "Cocody": { lat: 5.3599, lng: -3.9870 },
  "Plateau": { lat: 5.3261, lng: -4.0211 },
  "Marcory": { lat: 5.3015, lng: -3.9856 },
  "Yopougon": { lat: 5.3453, lng: -4.0805 },
  "Treichville": { lat: 5.3082, lng: -4.0089 },
  "Abobo": { lat: 5.4161, lng: -4.0159 },
  "Koumassi": { lat: 5.2978, lng: -3.9576 },
  "Adjamé": { lat: 5.3550, lng: -4.0200 },
  "Port-Bouët": { lat: 5.2530, lng: -3.9290 },
  "Bingerville": { lat: 5.3558, lng: -3.8883 },
  "Songon": { lat: 5.3167, lng: -4.2500 }
};

export default function GomboItineraryModal({
  isOpen,
  onClose,
  targetTitle = "Lieu du Gombo",
  targetCommune = "Cocody",
  targetLat,
  targetLng
}: GomboItineraryModalProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Resolved venue coordinates
  const venueCoords = {
    lat: targetLat || ABIDJAN_COMMUNES_COORDS[targetCommune]?.lat || 5.3599,
    lng: targetLng || ABIDJAN_COMMUNES_COORDS[targetCommune]?.lng || -3.9870
  };

  useEffect(() => {
    if (!isOpen) return;

    setLocating(true);
    setErrorMsg(null);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          setLocating(false);
        },
        (err) => {
          console.warn("Geolocation warning:", err);
          setErrorMsg("Impossible de récupérer la position GPS exacte. Utilisation du centre d'Abidjan.");
          // Fallback user location (Plateau Abidjan)
          setUserLocation({ lat: 5.3261, lng: -4.0211 });
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setErrorMsg("Géolocalisation non supportée par votre navigateur.");
      setUserLocation({ lat: 5.3261, lng: -4.0211 });
      setLocating(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Haversine distance formula in km
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const distanceKm = userLocation
    ? calculateDistanceKm(userLocation.lat, userLocation.lng, venueCoords.lat, venueCoords.lng)
    : "0";

  const estimatedMinutes = Math.round(Number(distanceKm) * 2.5 + 5);

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${venueCoords.lat},${venueCoords.lng}&travelmode=driving`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-afri-bg/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-afri-bg border border-[#D4AF37]/30 rounded-3xl overflow-hidden shadow-2xl text-afri-text relative"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-950 border-b border-afri-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37]">
              <Route className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#D4AF37] uppercase tracking-wide">
                Se Rendre Au Gombo
              </h3>
              <p className="text-xs text-afri-text-sec font-mono">Itinéraire souverain AFRIGOMBO ELITE</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-afri-bg-ter hover:bg-zinc-700 text-afri-text-sec transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-2 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Location Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono font-bold uppercase">
                <Crosshair className="w-3.5 h-3.5" />
                <span>Votre Position</span>
              </div>
              <p className="text-xs font-bold text-afri-text truncate">
                {locating ? "Localisation en cours..." : "Ma Position GPS"}
              </p>
            </div>

            <div className="p-3.5 bg-afri-bg-sec border border-[#D4AF37]/30 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-[#D4AF37] text-[10px] font-mono font-bold uppercase">
                <MapPin className="w-3.5 h-3.5" />
                <span>Destination Gombo</span>
              </div>
              <p className="text-xs font-bold text-afri-text truncate">{targetTitle}</p>
              <p className="text-[10px] text-afri-text-sec font-mono">📍 {targetCommune}</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="p-4 bg-gradient-to-r from-zinc-900 via-amber-950/20 to-zinc-900 border border-[#D4AF37]/20 rounded-2xl flex items-center justify-around text-center">
            <div>
              <span className="text-[10px] text-afri-text-sec uppercase font-mono block">Distance</span>
              <strong className="text-lg font-black text-[#D4AF37]">{distanceKm} km</strong>
            </div>
            <div className="h-8 w-px bg-afri-bg-ter" />
            <div>
              <span className="text-[10px] text-afri-text-sec uppercase font-mono block">Temps Estimé</span>
              <strong className="text-lg font-black text-emerald-400">~{estimatedMinutes} min</strong>
            </div>
          </div>

          {/* Interactive Route Canvas/Map Representation */}
          <div className="relative h-48 rounded-2xl bg-afri-bg-sec border border-afri-border overflow-hidden flex flex-col justify-between p-4 shadow-inner">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

            {/* Canvas Animated Route */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-[#D4AF37]" strokeWidth="3" fill="none">
              <path
                d="M 40 140 Q 150 40 320 60"
                strokeDasharray="6 6"
                className="animate-pulse"
              />
            </svg>

            {/* Marker A (User) */}
            <div className="relative z-10 flex items-center gap-2 bg-afri-bg/90 border border-emerald-500/40 p-2 rounded-xl w-fit shadow-md">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <span className="text-[11px] font-mono font-bold text-emerald-300">Moi (Départ)</span>
            </div>

            {/* Marker B (Gombo Venue) */}
            <div className="relative z-10 self-end flex items-center gap-2 bg-afri-bg/90 border border-[#D4AF37]/50 p-2 rounded-xl w-fit shadow-md">
              <MapPin className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-[11px] font-mono font-bold text-[#D4AF37]">
                {targetCommune} (Arrivée)
              </span>
            </div>
          </div>

          {/* Action Button */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            <Navigation className="w-4 h-4 fill-current" />
            <span>Ouvrir dans GPS / Google Maps</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </motion.div>
    </div>
  );
}
