import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Image as ImageIcon, X, ChevronRight, Sparkles, Play, Pause, Volume2, VolumeX, Upload } from "lucide-react";
import { VideoFilter, REEL_VIDEO_FILTERS, getFilterCss } from "./videoFilters";

export type { VideoFilter };
export { REEL_VIDEO_FILTERS, getFilterCss };

interface ReelCreatorScreenProps {
  onVideoReady: (file: File, filterId: string) => void;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function ReelCreatorScreen({ onVideoReady, onClose }: ReelCreatorScreenProps) {
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("naturel");

  // Custom Player States
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [centerIconState, setCenterIconState] = useState<"play" | "pause" | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  const recordedUrlRef = useRef<string | null>(null);
  recordedUrlRef.current = recordedUrl;

  const stopPreviewVideo = () => {
    if (previewRef.current) {
      try {
        previewRef.current.pause();
        previewRef.current.currentTime = 0;
        previewRef.current.removeAttribute("src");
        previewRef.current.load();
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

  const processSelectedVideoFile = (file: File) => {
    if (!file || !file.type.startsWith("video/")) return;

    // Arrêt et révocation de l'ancienne ressource vidéo si présente
    stopPreviewVideo();
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }

    // Conservation immédiate du fichier ORIGINAL et création de l'ObjectURL de prévisualisation
    const newUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setRecordedUrl(newUrl);
    setSelectedFilter("naturel");
    setIsPlaying(true);
    setCurrentTime(0);
  };

  const handleGalleryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedVideoFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      processSelectedVideoFile(file);
    }
  };

  const handleRetake = () => {
    stopPreviewVideo();
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setSelectedFile(null);
    setRecordedUrl(null);
    setSelectedFilter("naturel");
    setCurrentTime(0);
    setDuration(0);
  };

  const handleNext = () => {
    if (selectedFile) {
      stopPreviewVideo();
      onVideoReady(selectedFile, selectedFilter);
    }
  };

  const togglePlayPause = () => {
    const vid = previewRef.current;
    if (!vid) return;

    if (vid.paused) {
      vid.play().then(() => {
        setIsPlaying(true);
        setCenterIconState("play");
        setTimeout(() => setCenterIconState(null), 650);
      }).catch(() => {});
    } else {
      vid.pause();
      setIsPlaying(false);
      setCenterIconState("pause");
      setTimeout(() => setCenterIconState(null), 650);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const vid = previewRef.current;
    if (!vid) return;
    const nextMuted = !isMuted;
    vid.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current;
    const vid = previewRef.current;
    if (!bar || !vid || !duration) return;

    const rect = bar.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newPercent = clickX / rect.width;
    const newTime = newPercent * duration;

    vid.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // PREVIEW MODE (après sélection de la vidéo originale avec lecteur personnalisé)
  if (recordedUrl && selectedFile) {
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return createPortal(
      <div className="fixed inset-0 bg-black z-[9999] flex flex-col select-none">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between px-4 py-3 z-20 bg-gradient-to-b from-black/90 via-black/50 to-transparent">
          <button
            onClick={handleRetake}
            className="text-white p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
            title="Changer de vidéo"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-[#D4AF37]/30 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-white text-xs font-mono font-bold tracking-wide">
              Édition Réel
            </span>
          </div>
          <button
            onClick={handleNext}
            disabled={!selectedFile}
            className="flex items-center gap-1 bg-[#D4AF37] hover:bg-amber-400 text-black font-black px-4 py-1.5 rounded-full text-xs uppercase tracking-wider cursor-pointer shadow-lg hover:shadow-[#D4AF37]/20 active:scale-95 transition-all"
          >
            <span>Suivant</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Custom Video Stage with Gestures & Overlays */}
        <div
          className="flex-1 flex items-center justify-center overflow-hidden relative bg-black cursor-pointer"
          onClick={togglePlayPause}
        >
          <video
            ref={previewRef}
            src={recordedUrl}
            controls={false}
            autoPlay
            loop
            playsInline
            muted={isMuted}
            style={{ filter: activeFilterCss }}
            className="max-h-full max-w-full object-contain pointer-events-none transition-all duration-300"
            onTimeUpdate={() => {
              if (previewRef.current) {
                setCurrentTime(previewRef.current.currentTime);
              }
            }}
            onLoadedMetadata={() => {
              if (previewRef.current) {
                setDuration(previewRef.current.duration || 0);
                previewRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Animated Center Play/Pause Ripple Overlay */}
          {centerIconState && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
              <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl animate-scale-up">
                {centerIconState === "play" ? (
                  <Play className="w-8 h-8 fill-current text-[#D4AF37] ml-1" />
                ) : (
                  <Pause className="w-8 h-8 fill-current text-white" />
                )}
              </div>
            </div>
          )}

          {/* Persistent Paused Indicator if paused without recent tap */}
          {!isPlaying && !centerIconState && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 bg-black/25 backdrop-blur-[1px]">
              <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shadow-xl">
                <Play className="w-8 h-8 fill-current ml-1" />
              </div>
            </div>
          )}

          {/* Floating Sound Toggle Button */}
          <button
            onClick={toggleMute}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md hover:bg-black/80 active:scale-95 transition-all cursor-pointer shadow-lg"
            title={isMuted ? "Activer le son" : "Couper le son"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#D4AF37]" />
            )}
          </button>

          {/* File Info Pill */}
          <div className="absolute top-4 left-4 z-20 px-2.5 py-1 rounded-md bg-black/60 border border-white/10 text-[10px] font-mono text-zinc-300 backdrop-blur-md pointer-events-none truncate max-w-[180px]">
            {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} Mo)
          </div>

          {/* In-Stage Bottom Controls: Scrubber & Time */}
          <div
            className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20 space-y-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Scrubber Bar */}
            <div
              ref={progressBarRef}
              onClick={handleSeek}
              className="w-full h-3 flex items-center cursor-pointer group py-1"
            >
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden relative group-hover:h-2 transition-all">
                <div
                  className="h-full bg-gradient-to-r from-[#D4AF37] to-amber-300 transition-all duration-75 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Time Indicators */}
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-300 px-0.5">
              <span className="text-[#D4AF37] font-bold">{formatTime(currentTime)}</span>
              <span className="text-zinc-400">{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Carousel des filtres visuels personnalisés */}
        <div className="p-4 bg-black/95 border-t border-white/10 z-20">
          <div className="text-xs font-mono text-zinc-400 mb-2.5 flex items-center justify-between px-1 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <span>Filtre d'ambiance :</span>
              <span className="text-[#D4AF37] font-bold">
                {REEL_VIDEO_FILTERS.find((f) => f.id === selectedFilter)?.name}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-normal">Prévisualisation en direct</span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x">
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
                        ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/50 shadow-[#D4AF37]/20 scale-105"
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

  // IMPORT / SELECTION MODE
  return createPortal(
    <div
      className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center gap-6 px-6 select-none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <button
        onClick={handleCloseCreator}
        className="absolute top-4 left-4 text-white p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer backdrop-blur-md"
        title="Fermer"
      >
        <X className="w-6 h-6" />
      </button>

      <div
        className={`w-24 h-24 rounded-3xl border-2 flex items-center justify-center transition-all ${
          isDraggingOver
            ? "border-[#D4AF37] bg-[#D4AF37]/20 scale-110 shadow-2xl shadow-[#D4AF37]/20"
            : "bg-zinc-900 border-zinc-800"
        }`}
      >
        {isDraggingOver ? (
          <Upload className="w-10 h-10 text-[#D4AF37] animate-bounce" />
        ) : (
          <ImageIcon className="w-10 h-10 text-[#D4AF37]" />
        )}
      </div>

      <div className="text-center space-y-1.5 max-w-xs">
        <h2 className="text-white font-black text-xl tracking-tight">Nouveau Réel</h2>
        <p className="text-zinc-400 text-xs leading-relaxed">
          {isDraggingOver
            ? "Relâchez le fichier vidéo pour l'importer"
            : "Sélectionnez ou déposez une vidéo depuis votre appareil (MP4, MOV, WebM)"}
        </p>
      </div>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="bg-[#D4AF37] hover:bg-amber-400 text-black font-black px-6 py-3 rounded-full text-xs uppercase tracking-wider shadow-xl hover:shadow-[#D4AF37]/25 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
      >
        <Upload className="w-4 h-4 stroke-[2.5]" />
        <span>Importer une vidéo</span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleGalleryFile}
      />
    </div>,
    document.body
  );
}
