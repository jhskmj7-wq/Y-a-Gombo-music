import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Image as ImageIcon, X, ChevronRight, Sparkles } from "lucide-react";

export interface VideoFilter {
  id: string;
  name: string;
  filterCss: string;
}

export const REEL_VIDEO_FILTERS: VideoFilter[] = [
  { id: "naturel", name: "Naturel", filterCss: "none" },
  { id: "gold_afrigombo", name: "Gold AfriGombo", filterCss: "sepia(0.3) contrast(1.1) brightness(1.05) saturate(1.3) hue-rotate(-10deg)" },
  { id: "vintage_concert", name: "Vintage Concert", filterCss: "sepia(0.5) contrast(1.2) brightness(0.9) saturate(0.8)" },
  { id: "noir_blanc", name: "Noir & Blanc Studio", filterCss: "grayscale(1) contrast(1.25) brightness(1.05)" },
  { id: "vibrant_pop", name: "Vibrant Pop", filterCss: "saturate(1.8) contrast(1.15) brightness(1.05)" },
  { id: "warm_sunset", name: "Warm Sunset", filterCss: "sepia(0.4) saturate(1.4) hue-rotate(-20deg) contrast(1.1)" },
];

interface ReelCreatorScreenProps {
  onVideoReady: (file: File, filterId: string) => void;
  onClose: () => void;
}

export default function ReelCreatorScreen({ onVideoReady, onClose }: ReelCreatorScreenProps) {
  const previewRef = useRef<HTMLVideoElement>(null);
  const previewNodeRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("naturel");

  const recordedUrlRef = useRef<string | null>(null);
  recordedUrlRef.current = recordedUrl;

  const stopPreviewVideo = () => {
    if (previewNodeRef.current) {
      try {
        previewNodeRef.current.pause();
        previewNodeRef.current.currentTime = 0;
        previewNodeRef.current.removeAttribute("src");
        previewNodeRef.current.load();
      } catch (_) {}
    }
  };

  const handleCloseCreator = () => {
    stopPreviewVideo();
    onClose();
  };

  // Nettoyage complet lors du démontage du composant
  useEffect(() => {
    return () => {
      stopPreviewVideo();
      if (recordedUrlRef.current) {
        URL.revokeObjectURL(recordedUrlRef.current);
        recordedUrlRef.current = null;
      }
    };
  }, []);

  const activeFilterCss =
    REEL_VIDEO_FILTERS.find((f) => f.id === selectedFilter)?.filterCss ?? "none";

  const handleGalleryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) return;

    // Arrêt et révocation de l'ancienne ressource vidéo si présente
    stopPreviewVideo();
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }

    // Conservation immédiate du fichier ORIGINAL et création de l'ObjectURL de prévisualisation pure
    const newUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setRecordedUrl(newUrl);
    setSelectedFilter("naturel");
  };

  const handleRetake = () => {
    stopPreviewVideo();
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setSelectedFile(null);
    setRecordedUrl(null);
    setSelectedFilter("naturel");
  };

  const handleNext = () => {
    if (selectedFile) {
      // Pause propre du lecteur local avant passage à l'étape suivante
      stopPreviewVideo();
      onVideoReady(selectedFile, selectedFilter);
    }
  };

  // PREVIEW MODE (après sélection de la vidéo originale)
  if (recordedUrl && selectedFile) {
    return createPortal(
      <div className="fixed inset-0 bg-black z-[9999] flex flex-col">
        <div className="flex items-center justify-between p-4 z-10 bg-gradient-to-b from-black/80 to-transparent">
          <button onClick={handleRetake} className="text-white p-2 rounded-full bg-black/40">
            <X className="w-6 h-6" />
          </button>
          <span className="text-white text-sm font-mono flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Aperçu & Filtres
          </span>
          <button
            onClick={handleNext}
            disabled={!selectedFile}
            className="flex items-center gap-1 bg-[#D4AF37] text-black font-bold px-4 py-2 rounded-full text-sm cursor-pointer shadow-md hover:brightness-110 active:scale-95 transition-all"
          >
            Suivant <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center overflow-hidden relative bg-black">
          <video
            ref={(el) => {
              // @ts-ignore
              previewRef.current = el;
              if (el) previewNodeRef.current = el;
            }}
            src={recordedUrl}
            controls={true}
            autoPlay
            loop
            playsInline
            muted
            style={{ filter: activeFilterCss }}
            className="max-h-full max-w-full transition-all duration-300"
          />
        </div>

        {/* Carousel des filtres visuels */}
        <div className="p-4 bg-black/90 border-t border-white/10 z-10">
          <div className="text-xs font-mono text-zinc-400 mb-2.5 flex items-center gap-1.5 px-1 uppercase tracking-wider">
            <span>Style visuel :</span>
            <span className="text-[#D4AF37] font-bold">
              {REEL_VIDEO_FILTERS.find((f) => f.id === selectedFilter)?.name}
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
            {REEL_VIDEO_FILTERS.map((f) => {
              const isSelected = selectedFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className={`flex flex-col items-center gap-1.5 snap-start shrink-0 cursor-pointer transition-all ${
                    isSelected ? "scale-105" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl overflow-hidden border-2 flex items-center justify-center relative shadow-lg transition-all ${
                      isSelected
                        ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/40 shadow-[#D4AF37]/20"
                        : "border-white/20 hover:border-white/50"
                    }`}
                  >
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-amber-500 via-rose-500 to-indigo-600"
                      style={{ filter: f.filterCss }}
                    />
                    <div className="absolute inset-0 bg-black/20" />
                    <span className="relative z-10 text-[10px] font-bold text-white uppercase text-center px-1 leading-tight drop-shadow">
                      {f.name.split(" ")[0]}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-mono tracking-tight transition-colors ${
                      isSelected ? "text-[#D4AF37] font-bold" : "text-zinc-400"
                    }`}
                  >
                    {f.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // IMPORT MODE
  return createPortal(
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center gap-6 px-6">
      <button onClick={onClose} className="absolute top-4 left-4 text-white p-2 rounded-full bg-black/40">
        <X className="w-6 h-6" />
      </button>
      <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
        <ImageIcon className="w-9 h-9 text-zinc-500" />
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-white font-bold text-lg">Nouveau Réel</h2>
        <p className="text-zinc-500 text-sm">Choisis une vidéo depuis ta galerie</p>
      </div>
      <button
        onClick={() => fileInputRef.current?.click()}
        className="bg-[#D4AF37] text-black font-bold px-6 py-3 rounded-full text-sm"
      >
        Importer une vidéo
      </button>
      <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleGalleryFile} />
    </div>,
    document.body
  );
}
