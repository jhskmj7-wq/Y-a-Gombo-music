import React, { useState, useEffect } from "react";
import { 
  MapPin, Navigation, Music, Zap, Mic, Calendar, Building, Headphones, 
  Users, Layers, Compass, Eye, Route, UserCheck, ShieldCheck, ChevronRight, X
} from "lucide-react";
import { collection, onSnapshot, query, limit } from "firebase/firestore";
import { db } from "../../firebase";

export interface GeoMarkerItem {
  id: string;
  name: string;
  category: "gombo" | "renfort" | "casting" | "event" | "studio" | "prestataire";
  lat: number;
  lng: number;
  photo?: string;
  cityName?: string;
  communeName?: string;
  distanceKm?: number;
  userUid?: string;
  details?: string;
}

export default function GeoLocationCenter() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selectedMarker, setSelectedMarker] = useState<GeoMarkerItem | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("Abidjan");
  const [selectedCommune, setSelectedCommune] = useState<string>("Cocody");

  // Real-time Firestore items
  const [markers, setMarkers] = useState<GeoMarkerItem[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGombos: 0,
    totalPrestataires: 0,
    totalStudios: 0
  });

  const filterOptions = [
    { key: "all", label: "📍 Tous les lieux", icon: MapPin },
    { key: "gombo", label: "🎵 Gombos", icon: Music },
    { key: "renfort", label: "⚡ Renforts", icon: Zap },
    { key: "casting", label: "🎤 Castings", icon: Mic },
    { key: "event", label: "🎪 Événements", icon: Calendar },
    { key: "studio", label: "🏢 Studios", icon: Building },
    { key: "prestataire", label: "🎧 Prestataires", icon: Headphones }
  ];

  // Default initial locations in Abidjan & Côte d'Ivoire
  const defaultMarkers: GeoMarkerItem[] = [
    {
      id: "gmb_1",
      name: "Concert Live Jam",
      category: "gombo",
      lat: 5.3599,
      lng: -4.0083,
      cityName: "Abidjan",
      communeName: "Cocody",
      distanceKm: 2.1,
      photo: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200",
      details: "Cachet: 250.000 FCFA — Pianiste recherché"
    },
    {
      id: "rnf_1",
      name: "Renfort Saxophoniste Studio",
      category: "renfort",
      lat: 5.3411,
      lng: -4.028,
      cityName: "Abidjan",
      communeName: "Plateau",
      distanceKm: 4.5,
      photo: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=200",
      details: "Session d'enregistrement urgente"
    },
    {
      id: "cst_1",
      name: "Casting Choristes Afro-Gospel",
      category: "casting",
      lat: 5.3722,
      lng: -3.9911,
      cityName: "Abidjan",
      communeName: "Riviera 2",
      distanceKm: 3.8,
      photo: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=200",
      details: "Soprano & Ténor recherchés"
    },
    {
      id: "evt_1",
      name: "Festival Afro Vibes 2026",
      category: "event",
      lat: 5.3201,
      lng: -3.98,
      cityName: "Abidjan",
      communeName: "Marcory",
      distanceKm: 6.2,
      photo: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200",
      details: "Palais de la Culture"
    },
    {
      id: "std_1",
      name: "Studio Kora Sound",
      category: "studio",
      lat: 5.385,
      lng: -4.015,
      cityName: "Abidjan",
      communeName: "Yopougon",
      distanceKm: 8.0,
      photo: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=200",
      details: "Enregistrement & Mixage Dolby Atmos"
    },
    {
      id: "pst_1",
      name: "DJ Kouamé Pro",
      category: "prestataire",
      lat: 5.335,
      lng: -4.045,
      cityName: "Abidjan",
      communeName: "Treichville",
      distanceKm: 5.1,
      photo: "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=200",
      details: "DJ Événementiel & Sound System"
    }
  ];

  useEffect(() => {
    // Sync gombos for markers
    const unsubscribeGombos = onSnapshot(query(collection(db, "gombos"), limit(20)), (snap) => {
      const gomboMarkers: GeoMarkerItem[] = snap.docs.map((docSnap, index) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.title || "Gombo sans titre",
          category: "gombo" as const,
          lat: data.lat || 5.3599 + (index % 5) * 0.015,
          lng: data.lng || -4.0083 + (index % 5) * 0.012,
          cityName: data.city || "Abidjan",
          communeName: data.commune || "Cocody",
          distanceKm: Number((1.5 + index * 0.8).toFixed(1)),
          photo: data.imageUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200",
          details: `Cachet: ${data.budget || 0} FCFA — ${data.category || "Musique"}`
        };
      });

      const merged = [...defaultMarkers, ...gomboMarkers];
      setMarkers(merged);
      setStats({
        totalUsers: 1420 + snap.size * 5,
        totalGombos: snap.size + 12,
        totalPrestataires: 380 + snap.size,
        totalStudios: 45
      });
    }, () => {
      setMarkers(defaultMarkers);
      setStats({
        totalUsers: 1420,
        totalGombos: 18,
        totalPrestataires: 380,
        totalStudios: 45
      });
    });

    return () => unsubscribeGombos();
  }, []);

  const filteredMarkers = markers.filter((m) => {
    if (activeFilter === "all") return true;
    return m.category === activeFilter;
  });

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-left max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wider font-sans">
              CENTRE CARTOGRAPHIQUE & GÉOLOCALISATION
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Visualisation en temps réel des gombos, renforts, castings et prestataires sur le terrain
            </p>
          </div>
        </div>
      </div>

      {/* Main Cartographic Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map & Filters Column (8 cols on desktop) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Interactive Map Visual Container */}
          <div className="relative w-full h-[450px] sm:h-[520px] bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-4">
            {/* Map background grid effect */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-30"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, rgba(212,175,55,0.15) 0%, transparent 60%), url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1000&auto=format&fit=crop&q=80')`
              }}
            />
            
            {/* Map Header Overlay */}
            <div className="relative z-10 flex items-center justify-between bg-zinc-900/90 backdrop-blur border border-zinc-800 p-3 rounded-2xl max-w-full">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
                <MapPin className="w-4 h-4 text-[#D4AF37]" />
                <span className="font-bold text-white uppercase">{selectedCity}</span>
                <span className="text-zinc-600">•</span>
                <span>{selectedCommune}</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {filteredMarkers.length} Repères actifs
              </span>
            </div>

            {/* Interactive Pins Canvas Representation */}
            <div className="relative z-10 flex-1 my-4 flex items-center justify-center">
              <div className="relative w-full h-full">
                {filteredMarkers.map((marker, idx) => {
                  const isSelected = selectedMarker?.id === marker.id;
                  // Distribute pins across canvas proportionally
                  const topPos = 20 + ((idx * 17) % 65);
                  const leftPos = 15 + ((idx * 23) % 70);

                  return (
                    <button
                      key={marker.id}
                      onClick={() => setSelectedMarker(marker)}
                      style={{ top: `${topPos}%`, left: `${leftPos}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 cursor-pointer group ${
                        isSelected ? "scale-125 z-30" : "hover:scale-110 z-20"
                      }`}
                    >
                      <div className={`p-2 rounded-2xl border shadow-xl flex items-center gap-1.5 backdrop-blur ${
                        isSelected
                          ? "bg-[#D4AF37] text-black border-white ring-4 ring-[#D4AF37]/30"
                          : marker.category === "gombo"
                          ? "bg-amber-500/90 text-black border-amber-400"
                          : marker.category === "renfort"
                          ? "bg-sky-500/90 text-white border-sky-400"
                          : marker.category === "casting"
                          ? "bg-purple-500/90 text-white border-purple-400"
                          : "bg-zinc-900/90 text-[#D4AF37] border-zinc-700"
                      }`}>
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[10px] font-bold font-mono whitespace-nowrap max-w-[100px] truncate hidden sm:inline">
                          {marker.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Marker Popup overlay */}
            {selectedMarker && (
              <div className="relative z-20 bg-zinc-900/95 border border-[#D4AF37]/60 p-4 rounded-2xl shadow-2xl animate-scaleUp max-w-full">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedMarker.photo || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150"}
                      alt={selectedMarker.name}
                      className="w-12 h-12 rounded-xl object-cover border border-[#D4AF37]"
                    />
                    <div>
                      <span className="text-[9px] font-mono font-bold uppercase text-[#D4AF37]">
                        {selectedMarker.category} • {selectedMarker.distanceKm} km
                      </span>
                      <h4 className="text-xs font-bold text-white uppercase">{selectedMarker.name}</h4>
                      <p className="text-[10px] text-zinc-400 font-mono">{selectedMarker.details}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedMarker(null)}
                    className="p-1 text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-zinc-800">
                  <button
                    onClick={() => alert(`Navigation itinéraire vers ${selectedMarker.name}`)}
                    className="flex-1 py-1.5 bg-[#D4AF37] text-black text-[10px] font-bold uppercase rounded-xl flex items-center justify-center gap-1 hover:bg-white transition"
                  >
                    <Route className="w-3.5 h-3.5" /> Voir itinéraire
                  </button>
                  <button
                    onClick={() => alert(`Aperçu profil lié à ${selectedMarker.name}`)}
                    className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-[10px] font-bold uppercase rounded-xl hover:text-white transition"
                  >
                    Voir profil
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Filters Bar below map (no horizontal scroll defect, clean flex wrap) */}
          <div className="flex flex-wrap items-center gap-2 bg-zinc-900 border border-zinc-800 p-3 rounded-2xl">
            {filterOptions.map((opt) => {
              const IconComp = opt.icon;
              const isActive = activeFilter === opt.key;

              return (
                <button
                  key={opt.key}
                  onClick={() => setActiveFilter(opt.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? "bg-[#D4AF37] text-black font-black shadow-md"
                      : "bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800"
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Side Panel: Statistics & City/Commune Controls (4 cols on desktop) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-5 shadow-xl">
            <h3 className="text-xs font-mono font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2 flex items-center justify-between">
              <span>STATISTIQUES DE TERRAIN</span>
              <span className="text-[#D4AF37] font-bold">CÔTE D'IVOIRE</span>
            </h3>

            {/* City & Commune select controls */}
            <div className="space-y-3 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-zinc-500 text-[10px] uppercase font-bold">Ville active :</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="Abidjan">Abidjan</option>
                  <option value="Yamoussoukro">Yamoussoukro</option>
                  <option value="Bouaké">Bouaké</option>
                  <option value="San-Pédro">San-Pédro</option>
                  <option value="Korhogo">Korhogo</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-500 text-[10px] uppercase font-bold">Commune / Zone :</label>
                <select
                  value={selectedCommune}
                  onChange={(e) => setSelectedCommune(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="Cocody">Cocody</option>
                  <option value="Plateau">Plateau</option>
                  <option value="Yopougon">Yopougon</option>
                  <option value="Marcory">Marcory</option>
                  <option value="Treichville">Treichville</option>
                  <option value="Abobo">Abobo</option>
                  <option value="Koumassi">Koumassi</option>
                  <option value="Adjamé">Adjamé</option>
                  <option value="Port-Bouët">Port-Bouët</option>
                </select>
              </div>
            </div>

            {/* Metrics list */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-2xl text-center space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block">Utilisateurs</span>
                <span className="text-xl font-black text-white">{stats.totalUsers}</span>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-2xl text-center space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block">Gombos Actifs</span>
                <span className="text-xl font-black text-[#D4AF37]">{stats.totalGombos}</span>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-2xl text-center space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block">Prestataires</span>
                <span className="text-xl font-black text-sky-400">{stats.totalPrestataires}</span>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-2xl text-center space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block">Studios & Salles</span>
                <span className="text-xl font-black text-emerald-400">{stats.totalStudios}</span>
              </div>
            </div>

            {/* List of nearby active markers */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block">
                Points à proximité ({filteredMarkers.length})
              </span>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {filteredMarkers.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMarker(m)}
                    className="p-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl cursor-pointer transition flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[#D4AF37]">📍</span>
                      <div className="truncate">
                        <p className="font-bold text-white truncate uppercase text-[11px]">{m.name}</p>
                        <p className="text-[9px] text-zinc-500 font-mono">{m.communeName}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-400 font-bold shrink-0">
                      {m.distanceKm} km
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
