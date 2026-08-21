import React, { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { X, MapPin, Route, Navigation, ExternalLink } from "lucide-react";

interface GomboMapViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  commune?: string;
  address?: string;
  latitude: number;
  longitude: number;
  onOpenItinerary?: () => void;
}

export default function GomboMapViewModal({
  isOpen,
  onClose,
  title = "Lieu du Gombo",
  commune = "Abidjan",
  address,
  latitude,
  longitude,
  onOpenItinerary
}: GomboMapViewModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    let map: maplibregl.Map | null = null;

    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            "osm-tiles": {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
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
        center: [longitude, latitude],
        zoom: 15
      });

      map.addControl(new maplibregl.NavigationControl(), "top-right");

      // Marker element
      const el = document.createElement("div");
      el.className = "p-2.5 rounded-full bg-[#D4AF37] border-2 border-black shadow-2xl text-black animate-bounce";
      el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

      new maplibregl.Marker({ element: el })
        .setLngLat([longitude, latitude])
        .addTo(map);

      map.on("load", () => {
        if (map) map.resize();
      });

      mapRef.current = map;
    } catch (err) {
      console.error("Error initializing GomboMapViewModal map:", err);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isOpen, latitude, longitude]);

  if (!isOpen) return null;

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div 
        className="bg-afri-bg border border-[#D4AF37]/40 rounded-t-3xl sm:rounded-3xl w-full max-w-xl flex flex-col overflow-hidden shadow-2xl relative max-h-[92vh]"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        {/* Header */}
        <div className="p-4 bg-zinc-900 border-b border-afri-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-xl text-[#D4AF37]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black font-mono uppercase text-[#D4AF37] truncate max-w-[200px] xs:max-w-none">
                Emplacement du Gombo
              </h3>
              <p className="text-[10px] text-afri-text-sec font-mono truncate max-w-[220px] xs:max-w-none">
                📍 {commune} {address ? `— ${address}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-afri-text-sec hover:text-white rounded-xl bg-afri-bg-sec border border-afri-border cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Venue Information card */}
        <div className="p-3 bg-zinc-950 border-b border-afri-border flex items-center justify-between gap-2 shrink-0 font-mono">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-afri-text truncate">{title}</p>
            <p className="text-[10px] text-emerald-400 font-extrabold truncate">
              GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </p>
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-black rounded-xl text-[10px] font-black uppercase cursor-pointer flex items-center gap-1 shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>GPS App</span>
          </a>
        </div>

        {/* Map Canvas */}
        <div className="relative w-full h-72 xs:h-80 sm:h-96 bg-zinc-900">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-zinc-900 border-t border-afri-border flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 bg-afri-bg-sec hover:bg-afri-bg-ter text-afri-text-sec font-bold text-xs rounded-xl cursor-pointer min-h-[48px]"
          >
            Fermer
          </button>

          <button
            type="button"
            onClick={() => {
              if (onOpenItinerary) {
                onOpenItinerary();
              } else {
                window.open(googleMapsUrl, "_blank");
              }
            }}
            className="px-5 py-3 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl cursor-pointer flex items-center gap-2 shadow-lg shadow-[#D4AF37]/20 min-h-[48px]"
          >
            <Navigation className="w-4 h-4 fill-current" />
            <span>🧭 Itinéraire</span>
          </button>
        </div>
      </div>
    </div>
  );
}
