import React, { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { X, MapPin, Navigation, Check, AlertCircle } from "lucide-react";

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (coords: { latitude: number; longitude: number }) => void;
  initialLat?: number;
  initialLng?: number;
  title?: string;
}

export default function MapPickerModal({
  isOpen,
  onClose,
  onConfirm,
  initialLat = 5.3600,
  initialLng = -4.0083,
  title = "Choisir l'emplacement sur la carte"
}: MapPickerModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const [selectedLat, setSelectedLat] = useState<number>(initialLat);
  const [selectedLng, setSelectedLng] = useState<number>(initialLng);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedLat(initialLat || 5.3600);
      setSelectedLng(initialLng || -4.0083);
      setGeoError(null);
    }
  }, [isOpen, initialLat, initialLng]);

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    let map: maplibregl.Map | null = null;

    const lat = selectedLat || 5.3600;
    const lng = selectedLng || -4.0083;

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
        center: [lng, lat],
        zoom: 14
      });

      map.addControl(new maplibregl.NavigationControl(), "top-right");

      // Custom Pin Marker
      const el = document.createElement("div");
      el.className = "flex items-center justify-center w-10 h-10 rounded-full bg-[#D4AF37] border-2 border-black shadow-2xl text-black cursor-grab active:cursor-grabbing";
      el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

      const marker = new maplibregl.Marker({
        element: el,
        draggable: true
      })
        .setLngLat([lng, lat])
        .addTo(map);

      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        setSelectedLat(Number(lngLat.lat.toFixed(6)));
        setSelectedLng(Number(lngLat.lng.toFixed(6)));
      });

      map.on("click", (e) => {
        const newLat = Number(e.lngLat.lat.toFixed(6));
        const newLng = Number(e.lngLat.lng.toFixed(6));
        marker.setLngLat([newLng, newLat]);
        setSelectedLat(newLat);
        setSelectedLng(newLng);
      });

      map.on("load", () => {
        if (map) map.resize();
      });

      mapRef.current = map;
      markerRef.current = marker;
    } catch (err) {
      console.error("Error initializing MapLibre picker:", err);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isOpen]);

  const handleUseCurrentGps = () => {
    setGeoError(null);
    if (!("geolocation" in navigator)) {
      setGeoError("La géolocalisation n'est pas supportée par votre appareil.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setSelectedLat(lat);
        setSelectedLng(lng);
        setLocating(false);

        if (mapRef.current && markerRef.current) {
          mapRef.current.flyTo({ center: [lng, lat], zoom: 15 });
          markerRef.current.setLngLat([lng, lat]);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError("La localisation n'est pas autorisée. Vous pouvez continuer en choisissant le point manuellement sur la carte.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGeoError("Position GPS indisponible actuellement. Déplacez le marqueur sur la carte.");
        } else if (err.code === err.TIMEOUT) {
          setGeoError("Délai d'attente GPS dépassé. Veuillez rééquiper la carte ou réessayer.");
        } else {
          setGeoError("Erreur lors de la récupération de la position.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleConfirm = () => {
    onConfirm({ latitude: selectedLat, longitude: selectedLng });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div 
        className="bg-afri-bg border border-[#D4AF37]/40 rounded-t-3xl sm:rounded-3xl w-full max-w-xl flex flex-col overflow-hidden shadow-2xl relative max-h-[92vh]"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        {/* Header */}
        <div className="p-4 bg-afri-bg-sec border-b border-afri-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-xl text-[#D4AF37]">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black font-mono uppercase text-[#D4AF37] truncate max-w-[220px] xs:max-w-none">
                {title}
              </h3>
              <p className="text-[10px] text-afri-text-sec font-mono">
                Déplacez le marqueur ou cliquez sur le point exact
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-afri-text-sec hover:text-afri-text rounded-xl bg-afri-bg border border-afri-border cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Controls & Feedback */}
        <div className="p-3 bg-afri-bg/90 border-b border-afri-border space-y-2 shrink-0">
          {geoError && (
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 text-[11px] text-amber-300 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{geoError}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-[11px] font-mono font-bold text-afri-text bg-afri-bg-sec px-3 py-2 rounded-xl border border-afri-border flex items-center gap-1.5">
              <span className="text-[#D4AF37]">📍</span>
              <span>Emplacement sélectionné :</span>
              <span className="text-emerald-400 font-extrabold">{selectedLat.toFixed(4)}, {selectedLng.toFixed(4)}</span>
            </div>

            <button
              type="button"
              onClick={handleUseCurrentGps}
              disabled={locating}
              className="px-3 py-2 bg-[#D4AF37]/20 border border-[#D4AF37]/50 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black rounded-xl text-[10px] font-black font-mono uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shrink-0 min-h-[40px]"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{locating ? "Localisation..." : "Utiliser ma position"}</span>
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative w-full h-72 xs:h-80 sm:h-96 bg-afri-bg-sec">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-afri-bg-sec border-t border-afri-border flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 bg-afri-bg hover:bg-afri-bg-ter text-afri-text font-bold text-xs rounded-xl border border-afri-border transition cursor-pointer min-h-[48px]"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-3 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-[#D4AF37]/20 min-h-[48px]"
          >
            <Check className="w-4 h-4" />
            <span>Confirmer l'emplacement</span>
          </button>
        </div>
      </div>
    </div>
  );
}
