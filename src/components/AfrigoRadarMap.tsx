import React, { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Gombo } from "../types";
import { MapPin, Filter, Navigation, Compass, Calendar, Zap, Star, ShieldCheck, X, Eye, Send, Share2, Flame, UserCheck } from "lucide-react";
import { getDistanceLabel, estimateTravelTimes } from "../lib/geoUtils";

interface AfrigoRadarMapProps {
  gombos: Gombo[];
  userLocation: { latitude: number; longitude: number };
  onSelectGombo: (gombo: Gombo) => void;
  onApplyGombo: (gombo: Gombo) => void;
  geoPermissionStatus?: string;
  onRequestLocation?: () => void;
}

export const AfrigoRadarMap: React.FC<AfrigoRadarMapProps> = ({
  gombos,
  userLocation,
  onSelectGombo,
  onApplyGombo,
  geoPermissionStatus = "granted",
  onRequestLocation
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [selectedFilter, setSelectedFilter] = useState<string>("tous");
  const [activeGombo, setActiveGombo] = useState<Gombo | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState<boolean>(false);
  const [showHeatmapModal, setShowHeatmapModal] = useState<boolean>(false);
  const [dispoMode, setDispoMode] = useState<string>("off"); // "off" | "2h" | "4h" | "today" | "always"

  // Filter gombos based on radius and category filter
  const filteredGombos = gombos.filter((g) => {
    if (g.latitude && g.longitude) {
      const R = 6371; // Earth radius in km
      const dLat = ((g.latitude - userLocation.latitude) * Math.PI) / 180;
      const dLon = ((g.longitude - userLocation.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userLocation.latitude * Math.PI) / 180) *
          Math.cos((g.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;
      g.distance = dist;
    } else {
      g.distance = 2.5; // default fallback
    }

    if (radiusKm < 100 && g.distance > radiusKm) {
      return false;
    }

    if (selectedFilter === "tous") return true;
    if (selectedFilter === "aujourdhui") {
      const today = new Date().toISOString().split("T")[0];
      return g.date === today;
    }
    if (selectedFilter === "urgent") {
      return g.urgent || g.isExpress || (g as any).type === "renfort";
    }
    if (selectedFilter === "premium") {
      return g.isPremium || g.budget > 150000;
    }
    if (selectedFilter === "concert") {
      return g.category === "concert" || g.title.toLowerCase().includes("concert");
    }
    if (selectedFilter === "eglise") {
      return g.category === "eglise" || g.title.toLowerCase().includes("culte") || g.title.toLowerCase().includes("église");
    }
    if (selectedFilter === "maquis") {
      return g.category === "maquis" || g.title.toLowerCase().includes("maquis") || g.title.toLowerCase().includes("bar");
    }
    if (selectedFilter === "casting") {
      return g.isCasting || g.category === "casting";
    }
    if (selectedFilter === "renfort") {
      return g.isRenfort || (g as any).type === "renfort";
    }
    if (selectedFilter === "distance") {
      return g.distance <= 5;
    }
    if (selectedFilter === "cachet") {
      return (g.budget || 0) >= 100000;
    }
    return true;
  }).sort((a, b) => (a.distance || 0) - (b.distance || 0)); // Sorted by closest first

  useEffect(() => {
    if (!mapContainerRef.current || geoPermissionStatus !== "granted") return;

    let map: maplibregl.Map | null = null;

    if (!mapRef.current) {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            "osm-tiles": {
              type: "raster",
              tiles: [
                "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              ],
              tileSize: 256,
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }
          },
          layers: [
            {
              id: "osm-tiles-layer",
              type: "raster",
              source: "osm-tiles",
              minzoom: 0,
              maxzoom: 19
            }
          ]
        },
        center: [userLocation.longitude || -4.0083, userLocation.latitude || 5.3600],
        zoom: 13
      });

      map.addControl(new maplibregl.NavigationControl(), "top-right");

      map.on("load", () => {
        if (map) map.resize();
      });

      mapRef.current = map;
    } else {
      map = mapRef.current;
      map.setCenter([userLocation.longitude || -4.0083, userLocation.latitude || 5.3600]);
      map.resize();
    }

    // Force map.resize() on multiple timeouts to perfectly capture sliding animation completion
    const t1 = setTimeout(() => { if (mapRef.current) mapRef.current.resize(); }, 100);
    const t2 = setTimeout(() => { if (mapRef.current) mapRef.current.resize(); }, 300);
    const t3 = setTimeout(() => { if (mapRef.current) mapRef.current.resize(); }, 600);
    const t4 = setTimeout(() => { if (mapRef.current) mapRef.current.resize(); }, 1000);

    // Watch container size changes using ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [geoPermissionStatus]);

  // Update markers
  useEffect(() => {
    if (!mapRef.current || geoPermissionStatus !== "granted") return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // User Marker
    const userEl = document.createElement("div");
    userEl.className = "w-7 h-7 rounded-full bg-blue-500 border-2 border-white shadow-[0_0_20px_rgba(59,130,246,0.9)] flex items-center justify-center animate-pulse";
    userEl.innerHTML = `<div class="w-2.5 h-2.5 bg-white rounded-full"></div>`;
    const userMarker = new maplibregl.Marker({ element: userEl })
      .setLngLat([userLocation.longitude, userLocation.latitude])
      .addTo(mapRef.current);
    markersRef.current.push(userMarker);

    // Gombo Markers
    filteredGombos.forEach((g) => {
      if (!g.longitude || !g.latitude) return;

      const el = document.createElement("div");
      let bg = "bg-emerald-500";
      let symbol = "🟢";
      if (g.isRenfort || (g as any).type === "renfort") {
        bg = "bg-red-500";
        symbol = "🔴";
      } else if (g.isCasting || g.category === "casting") {
        bg = "bg-purple-500";
        symbol = "🟣";
      } else if (g.category === "evenement" || g.category === "concert") {
        bg = "bg-blue-500";
        symbol = "🔷";
      } else if (g.isPremium || g.budget > 150000) {
        bg = "bg-[#D4AF37]";
        symbol = "⭐";
      }

      el.className = `w-9 h-9 rounded-full ${bg} border-2 border-afri-border shadow-xl flex items-center justify-center text-xs font-bold cursor-pointer hover:scale-125 transition`;
      el.innerHTML = `<span>${symbol}</span>`;

      el.addEventListener("click", () => {
        setActiveGombo(g);
        setIsBottomSheetOpen(true);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([g.longitude, g.latitude])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [filteredGombos, userLocation, geoPermissionStatus]);

  if (geoPermissionStatus !== "granted") {
    return (
      <div className="p-8 bg-afri-bg-sec border border-afri-border rounded-3xl text-center space-y-4 my-6">
        <div className="w-16 h-16 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center mx-auto text-[#D4AF37] text-2xl animate-bounce">
          📍
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-black text-afri-text uppercase tracking-wider">Autorisation GPS requise</h3>
          <p className="text-xs text-afri-text-sec max-w-sm mx-auto">
            Autorisez votre position pour découvrir les opportunités autour de vous.
          </p>
        </div>
        <button
          onClick={onRequestLocation}
          className="px-6 py-3 bg-[#D4AF37] hover:bg-[#c29b2e] text-black font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition cursor-pointer"
        >
          Autoriser ma position 🟢
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 relative">
      <style>{`
        .maplibregl-canvas {
          filter: invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%) saturate(30%) !important;
        }
      `}</style>
      {/* Top Toolbar: Search Radius & Heatmap & Dispo Mode */}
      <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">📍</span>
            <div>
              <h3 className="text-xs font-black text-afri-text uppercase tracking-wider">Radar AFRIGOMBO (OpenStreetMap)</h3>
              <p className="text-[9px] font-mono text-[#D4AF37]">
                {filteredGombos.length} opportunité(s) • Triées par proximité
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Heatmap Button */}
            <button
              onClick={() => setShowHeatmapModal(true)}
              className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-afri-text transition rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5" /> Activité 🔥
            </button>

            {/* Radius Selector */}
            <div className="flex items-center gap-1 bg-afri-bg p-1 rounded-xl border border-afri-border">
              {[2, 5, 10, 20, 100].map((r) => (
                <button
                  key={r}
                  onClick={() => setRadiusKm(r)}
                  className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase font-mono transition cursor-pointer ${
                    radiusKm === r
                      ? "bg-[#D4AF37] text-black shadow"
                      : "text-afri-text hover:text-[#D4AF37]"
                  }`}
                >
                  {r === 100 ? "Tous" : `${r}km`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Disponible Maintenant Toggle Bar */}
        <div className="flex items-center justify-between p-2.5 bg-afri-bg border border-afri-border rounded-xl">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${dispoMode !== "off" ? "bg-emerald-500 animate-pulse" : "bg-afri-text-muted"}`} />
            <div>
              <span className="text-[10px] font-black text-afri-text uppercase tracking-wider">🟢 Disponible maintenant</span>
              <p className="text-[8px] text-afri-text-sec">Permet aux promoteurs proches de vous inviter instantanément</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {[
              { id: "off", label: "Off" },
              { id: "2h", label: "2h" },
              { id: "4h", label: "4h" },
              { id: "today", label: "Jour" },
              { id: "always", label: "Non-stop" }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setDispoMode(m.id)}
                className={`px-2 py-1 rounded-lg text-[8.5px] font-black uppercase transition cursor-pointer ${
                  dispoMode === m.id
                    ? "bg-emerald-500 text-black shadow"
                    : "bg-afri-bg-sec text-afri-text hover:bg-white/10"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { id: "tous", label: "⚡ Tous" },
            { id: "aujourdhui", label: "📅 Aujourd'hui" },
            { id: "urgent", label: "🚨 Urgent" },
            { id: "premium", label: "⭐ Premium" },
            { id: "concert", label: "🎵 Concert" },
            { id: "eglise", label: "⛪ Église" },
            { id: "maquis", label: "🍻 Maquis" },
            { id: "casting", label: "🟣 Casting" },
            { id: "renfort", label: "🔴 Renfort" },
            { id: "distance", label: "📍 < 5km" },
            { id: "cachet", label: "💰 Cachet élevé" }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition cursor-pointer border ${
                selectedFilter === f.id
                  ? "bg-[#D4AF37] text-black border-[#D4AF37] shadow"
                  : "bg-afri-bg text-afri-text border-afri-border hover:border-[#D4AF37]/50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[450px] sm:h-[550px] rounded-3xl overflow-hidden border border-afri-border shadow-2xl bg-[#0d0d0d]">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 bg-afri-bg/85 backdrop-blur-md border border-afri-border p-3 rounded-2xl space-y-1.5 text-[9px] font-mono text-afri-text z-10">
          <div className="font-bold text-[#D4AF37] uppercase mb-1">Légende Radar :</div>
          <div className="flex items-center gap-2"><span>🟢</span> Gombo standard</div>
          <div className="flex items-center gap-2"><span>🔴</span> Renfort express</div>
          <div className="flex items-center gap-2"><span>🟣</span> Casting</div>
          <div className="flex items-center gap-2"><span>🔷</span> Évènement / Concert</div>
          <div className="flex items-center gap-2"><span>⭐</span> Cachet Premium</div>
        </div>
      </div>

      {/* HEATMAP / ACTIVITÉ MODAL */}
      {showHeatmapModal && (
        <div className="fixed inset-0 bg-afri-bg/80 backdrop-blur-md z-[250] flex items-center justify-center p-4">
          <div className="bg-afri-bg-sec border border-afri-border rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 text-left relative">
            <div className="flex justify-between items-center border-b border-afri-border pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <h3 className="text-xs sm:text-sm font-black text-afri-text uppercase tracking-widest">Carte de Chaleur & Activité</h3>
              </div>
              <button onClick={() => setShowHeatmapModal(false)} className="w-8 h-8 rounded-full bg-afri-bg border border-afri-border flex items-center justify-center text-afri-text hover:text-[#D4AF37] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] text-afri-text-sec uppercase font-bold">Zones musicales les plus actives en temps réel :</p>
              {[
                { zone: "Cocody", count: 28, intensity: "bg-red-500", desc: "Très forte demande (Maquis & VIP)" },
                { zone: "Yopougon", count: 16, intensity: "bg-orange-500", desc: "Forte animation live & maquis" },
                { zone: "Marcory", count: 11, intensity: "bg-amber-500", desc: "Studios & bars live" },
                { zone: "Plateau", count: 8, intensity: "bg-emerald-500", desc: "Évènements & hôtellerie" },
                { zone: "Adjame", count: 7, intensity: "bg-blue-500", desc: "Maquis populaires" }
              ].map((zone, idx) => (
                <div key={idx} className="p-3 bg-afri-bg border border-afri-border rounded-2xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${zone.intensity} animate-pulse`} />
                      <span className="text-xs font-black text-afri-text uppercase">{zone.zone}</span>
                    </div>
                    <p className="text-[8.5px] text-afri-text-sec">{zone.desc}</p>
                  </div>
                  <span className="px-3 py-1 bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] rounded-xl text-xs font-mono font-black">
                    {zone.count} Gombos 🔥
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowHeatmapModal(false)}
              className="w-full py-3 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg cursor-pointer hover:bg-[#c29b2e]"
            >
              Fermer la carte de chaleur
            </button>
          </div>
        </div>
      )}

      {/* ANDROID BOTTOM SHEET: GOMBO DETAILS */}
      {isBottomSheetOpen && activeGombo && (
        <div className="fixed inset-0 bg-afri-bg/80 backdrop-blur-md z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-afri-bg-sec border-t sm:border border-afri-border rounded-t-[2.55rem] sm:rounded-3xl p-6 w-full max-w-lg shadow-2xl relative max-h-[85vh] flex flex-col animate-slideUp text-left">
            <div className="flex justify-between items-center border-b border-afri-border pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">
                  {activeGombo.isRenfort ? "🔴" : activeGombo.isCasting ? "🟣" : activeGombo.isPremium ? "⭐" : "🟢"}
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-sans font-black text-afri-text uppercase tracking-widest leading-none">
                    {activeGombo.title}
                  </h3>
                  <p className="text-[9px] font-mono text-[#D4AF37] uppercase tracking-wider mt-1 font-bold">
                    📍 {activeGombo.commune || "Abidjan"} {activeGombo.quartier ? `• ${activeGombo.quartier}` : ""} • {activeGombo.distance !== undefined ? getDistanceLabel(activeGombo.distance) : "Proche"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBottomSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-afri-bg border border-afri-border flex items-center justify-center text-afri-text hover:text-[#D4AF37] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1 pb-4">
              {activeGombo.imageUrl && (
                <img
                  src={activeGombo.imageUrl}
                  alt={activeGombo.title}
                  className="w-full h-40 object-cover rounded-2xl border border-afri-border"
                />
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-afri-bg border border-afri-border rounded-2xl">
                  <span className="text-[8.5px] font-mono text-afri-text-sec uppercase font-bold block mb-0.5">Cachet Proposé</span>
                  <span className="text-sm font-mono font-black text-emerald-400">
                    {(activeGombo.budget || 0).toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
                <div className="p-3 bg-afri-bg border border-afri-border rounded-2xl">
                  <span className="text-[8.5px] font-mono text-afri-text-sec uppercase font-bold block mb-0.5">Date & Heure</span>
                  <span className="text-xs font-mono font-bold text-afri-text">
                    {activeGombo.date || "Immédiat"}
                  </span>
                </div>
              </div>

              {/* Itinéraire / Travel Times */}
              <div className="p-3.5 bg-afri-bg border border-afri-border rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-[#D4AF37] uppercase font-black flex items-center gap-1.5">
                    🧭 S'y rendre (Itinéraire Radar)
                  </span>
                  <span className="text-[9px] font-mono text-afri-text-sec">
                    {activeGombo.distance !== undefined ? `${activeGombo.distance.toFixed(1)} km` : ""}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2 bg-afri-bg-sec border border-afri-border rounded-xl">
                    <span className="text-[7.5px] font-mono text-afri-text-sec uppercase block font-bold">🚶 À pied</span>
                    <span className="text-[11px] font-mono font-black text-afri-text">
                      {estimateTravelTimes(activeGombo.distance || 2).walk} min
                    </span>
                  </div>
                  <div className="p-2 bg-afri-bg-sec border border-afri-border rounded-xl">
                    <span className="text-[7.5px] font-mono text-afri-text-sec uppercase block font-bold">🛵 Moto</span>
                    <span className="text-[11px] font-mono font-black text-afri-text">
                      {estimateTravelTimes(activeGombo.distance || 2).moto} min
                    </span>
                  </div>
                  <div className="p-2 bg-afri-bg-sec border border-afri-border rounded-xl">
                    <span className="text-[7.5px] font-mono text-afri-text-sec uppercase block font-bold">🚗 Voiture</span>
                    <span className="text-[11px] font-mono font-black text-afri-text">
                      {estimateTravelTimes(activeGombo.distance || 2).car} min
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-afri-bg border border-afri-border rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-afri-text-sec uppercase font-bold">Candidatures reçues :</span>
                  <span className="text-[#D4AF37] font-black">{activeGombo.applicationsCount || 0} musiciens</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-afri-text-sec uppercase font-bold">Sécurité & Confidentialité :</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> 100% Interne Afrigombo
                  </span>
                </div>
              </div>

              {activeGombo.description && (
                <div className="p-3.5 bg-afri-bg border border-afri-border rounded-2xl space-y-1">
                  <span className="text-[9px] font-mono text-afri-text-sec uppercase font-bold">Description :</span>
                  <p className="text-xs text-afri-text leading-relaxed">{activeGombo.description}</p>
                </div>
              )}
            </div>

            {/* Action Buttons: Voir, Postuler, Partager */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-afri-border shrink-0">
              <button
                onClick={() => {
                  onSelectGombo(activeGombo);
                  setIsBottomSheetOpen(false);
                }}
                className="py-3 px-2 bg-afri-bg border border-afri-border hover:border-[#D4AF37] text-afri-text rounded-2xl font-black text-[9px] uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                Voir
              </button>
              <button
                onClick={() => {
                  onApplyGombo(activeGombo);
                  setIsBottomSheetOpen(false);
                }}
                className="py-3 px-2 bg-[#D4AF37] hover:bg-[#c29b2e] text-black rounded-2xl font-black text-[9px] uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Postuler ⚡
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: activeGombo.title,
                      text: `Opportunité Afrigombo : ${activeGombo.title} - ${activeGombo.budget} FCFA`,
                      url: window.location.href
                    }).catch(() => {});
                  } else {
                    alert("Lien du Gombo copié dans le presse-papier !");
                  }
                }}
                className="py-3 px-2 bg-afri-bg border border-afri-border hover:border-white text-afri-text rounded-2xl font-black text-[9px] uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-400" />
                Partager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
