import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Image as ImageIcon,
  X,
  ChevronRight,
  Sparkles,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Upload,
  Sliders,
  Scissors,
  Gauge,
  FlipHorizontal,
  Type,
  Smile,
  Music,
  ImageIcon as CoverIcon,
  RotateCcw
} from "lucide-react";

import { VideoFilter, REEL_VIDEO_FILTERS, getFilterCss } from "./videoFilters";
import {
  VideoEditorState,
  INITIAL_EDITOR_STATE,
  buildCombinedCssFilter,
  VideoTextOverlay,
  VideoStickerOverlay
} from "./editorState";
import {
  FiltersPanel,
  AdjustmentsPanel,
  TrimPanel,
  SpeedPanel,
  TransformPanel,
  AudioPanel,
  TextPanel,
  StickersPanel,
  EffectsPanel,
  CoverPanel
} from "./editorPanels";

export type { VideoFilter };
export { REEL_VIDEO_FILTERS, getFilterCss };

interface ReelCreatorScreenProps {
  onVideoReady: (file: File, filterId: string) => void;
  onClose: () => void;
}

type TabCategory =
  | "filtres"
  | "ajuster"
  | "couper"
  | "vitesse"
  | "transformer"
  | "audio"
  | "texte"
  | "stickers"
  | "effets"
  | "couverture";

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

  // Core Structured Editor State
  const [editorState, setEditorState] = useState<VideoEditorState>(INITIAL_EDITOR_STATE);
  const [activeTab, setActiveTab] = useState<TabCategory>("filtres");

  // Player States
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [centerIconState, setCenterIconState] = useState<"play" | "pause" | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // Dragging overlays in canvas
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const recordedUrlRef = useRef<string | null>(null);
  recordedUrlRef.current = recordedUrl;

  const stopPreviewVideo = () => {
    if (previewRef.current) {
      try {        previewRef.current.pause();
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPreviewVideo();
      if (recordedUrlRef.current) {
        URL.revokeObjectURL(recordedUrlRef.current);
        recordedUrlRef.current = null;
      }
    };
  }, []);

  // Update video element playback rate, volume, trim loop
  useEffect(() => {
    const vid = previewRef.current;
    if (!vid) return;

    vid.playbackRate = editorState.playbackRate;
    vid.volume = editorState.isMuted ? 0 : editorState.volume / 100;
  }, [editorState.playbackRate, editorState.volume, editorState.isMuted]);

  // Trim boundary enforcement during playback
  const handleTimeUpdate = () => {
    const vid = previewRef.current;
    if (!vid) return;

    const cur = vid.currentTime;
    setCurrentTime(cur);

    if (editorState.trimEnd > 0 && cur >= editorState.trimEnd) {
      vid.currentTime = editorState.trimStart || 0;
    }
  };

  const processSelectedVideoFile = (file: File) => {
    if (!file || !file.type.startsWith("video/")) return;

    stopPreviewVideo();
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }

    const newUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setRecordedUrl(newUrl);
    setEditorState(INITIAL_EDITOR_STATE);
    setIsPlaying(true);
    setCurrentTime(0);
  };

  const handleGalleryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processSelectedVideoFile(file);
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
    setEditorState(INITIAL_EDITOR_STATE);
    setCurrentTime(0);
    setDuration(0);
  };

  const handleNext = () => {
    if (selectedFile) {
      stopPreviewVideo();
      onVideoReady(selectedFile, editorState.filterId);
    }
  };

  const togglePlayPause = () => {
    const vid = previewRef.current;
    if (!vid) return;

    if (vid.paused) {
      vid.play().then(() => {
        setIsPlaying(true);
        setCenterIconState("play");
        setTimeout(() => setCenterIconState(null), 600);
      }).catch(() => {});
    } else {
      vid.pause();
      setIsPlaying(false);
      setCenterIconState("pause");
      setTimeout(() => setCenterIconState(null), 600);
    }
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

  const handleSeekDirect = (seconds: number) => {
    const vid = previewRef.current;
    if (vid) {
      vid.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  // Build combined CSS filter string
  const baseFilterObj = REEL_VIDEO_FILTERS.find((f) => f.id === editorState.filterId);
  const baseFilterCss = baseFilterObj ? baseFilterObj.filterCss : "none";
  const finalCssFilter = buildCombinedCssFilter(editorState, baseFilterCss);

  // Compute transform style
  const transformStyle: React.CSSProperties = {
    filter: finalCssFilter,
    transform: `rotate(${editorState.rotation}deg) scaleX(${editorState.flipHorizontal ? -1 : 1})`,
    transition: "transform 0.2s ease, filter 0.15s ease",
  };

  // Compute Aspect Ratio container class
  let aspectContainerClass = "aspect-[9/16] max-h-[60vh]";
  if (editorState.aspectRatio === "1:1") aspectContainerClass = "aspect-square max-h-[50vh]";
  else if (editorState.aspectRatio === "4:5") aspectContainerClass = "aspect-[4/5] max-h-[55vh]";
  else if (editorState.aspectRatio === "16:9") aspectContainerClass = "aspect-[16/9] max-w-full";

  // Categories Toolbar list
  const categories: { id: TabCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: "filtres", label: "Filtres", icon: Sparkles },
    { id: "ajuster", label: "Ajuster", icon: Sliders },
    { id: "couper", label: "Couper", icon: Scissors },
    { id: "vitesse", label: "Vitesse", icon: Gauge },
    { id: "transformer", label: "Format", icon: FlipHorizontal },
    { id: "audio", label: "Audio", icon: Volume2 },
    { id: "texte", label: "Texte", icon: Type },
    { id: "stickers", label: "Stickers", icon: Smile },
    { id: "effets", label: "Effets", icon: Sparkles },
    { id: "couverture", label: "Couverture", icon: CoverIcon },
  ];

  // PREVIEW / EDITOR MODE
  if (recordedUrl && selectedFile) {
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return createPortal(
      <div className="fixed inset-0 bg-background text-foreground z-[9999] flex flex-col select-none overflow-hidden">
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0 z-30 bg-background/90 border-b border-border backdrop-blur-md">
          <button
            onClick={handleRetake}
            className="p-2 rounded-full bg-muted/60 hover:bg-muted text-foreground active:scale-95 transition-all cursor-pointer"
            title="Changer de vidéo"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-[#D4AF37]/30">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-foreground text-xs font-mono font-bold tracking-wide">
              Édition Réel AFRIGOMBO
            </span>
          </div>

          <button
            onClick={handleNext}
            disabled={!selectedFile}
            className="flex items-center gap-1 bg-[#D4AF37] hover:bg-amber-400 text-black font-black px-4 py-1.5 rounded-full text-xs uppercase tracking-wider cursor-pointer shadow-md active:scale-95 transition-all"
          >
            <span>Suivant</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Central Stage: Video Preview Box */}
        <div className="flex-1 flex items-center justify-center relative bg-black/95 dark:bg-black p-2 overflow-hidden">
          <div
            className={`relative rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center bg-black cursor-pointer ${aspectContainerClass}`}
            onClick={togglePlayPause}
          >
            <video
              ref={previewRef}
              src={recordedUrl}
              style={transformStyle}
              className="w-full h-full object-cover rounded-2xl pointer-events-none"
              playsInline
              loop={false}
              muted={editorState.isMuted}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={() => {
                if (previewRef.current) {
                  const d = previewRef.current.duration || 0;
                  setDuration(d);
                  setEditorState((prev) => ({
                    ...prev,
                    trimEnd: prev.trimEnd || d,
                  }));
                  previewRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                }
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* Ripple Icon on Tap */}
            {centerIconState && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
                <div className="w-16 h-16 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl animate-scale-up">
                  {centerIconState === "play" ? (
                    <Play className="w-8 h-8 fill-current text-[#D4AF37] ml-1" />
                  ) : (
                    <Pause className="w-8 h-8 fill-current text-white" />
                  )}
                </div>
              </div>
            )}

            {/* Indicator when paused */}
            {!isPlaying && !centerIconState && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20 bg-black/30 backdrop-blur-[1px]">
                <div className="w-14 h-14 rounded-full bg-black/70 backdrop-blur-md border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] shadow-xl">
                  <Play className="w-7 h-7 fill-current ml-1" />
                </div>
              </div>
            )}

            {/* Text Overlays Render */}
            {editorState.texts.map((t) => (
              <div
                key={t.id}
                className="absolute z-20 px-2 py-1 rounded-md text-center font-bold tracking-wide backdrop-blur-sm pointer-events-none select-none"
                style={{
                  left: `${t.x}%`,
                  top: `${t.y}%`,
                  transform: "translate(-50%, -50%)",
                  color: t.color,
                  backgroundColor: t.bgColor,
                  fontSize: `${t.fontSize}px`,
                  fontWeight: t.isBold ? "bold" : "normal",
                  fontStyle: t.isItalic ? "italic" : "normal",
                }}
              >
                {t.text}
              </div>
            ))}

            {/* Sticker Overlays Render */}
            {editorState.stickers.map((s) => (
              <div
                key={s.id}
                className="absolute z-20 pointer-events-none select-none"
                style={{
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
                  fontSize: `${s.size}px`,
                }}
              >
                {s.emoji}
              </div>
            ))}

            {/* Bottom Scrubber & Time */}
            <div
              className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20 space-y-1"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                ref={progressBarRef}
                onClick={handleSeek}
                className="w-full h-3 flex items-center cursor-pointer group py-1"
              >
                <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-[#D4AF37] to-amber-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-300">
                <span className="text-[#D4AF37] font-bold">{formatTime(currentTime)}</span>
                <span className="text-zinc-400">{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Panel Content Box */}
        <div className="shrink-0 p-3 bg-card border-t border-border z-30 max-h-56 overflow-y-auto">
          {activeTab === "filtres" && <FiltersPanel state={editorState} onChange={setEditorState} duration={duration} currentTime={currentTime} onSeek={handleSeekDirect} />}
          {activeTab === "ajuster" && <AdjustmentsPanel state={editorState} onChange={setEditorState} duration={duration} currentTime={currentTime} onSeek={handleSeekDirect} />}
          {activeTab === "couper" && <TrimPanel state={editorState} onChange={setEditorState} duration={duration} currentTime={currentTime} onSeek={handleSeekDirect} />}
          {activeTab === "vitesse" && <SpeedPanel state={editorState} onChange={setEditorState} duration={duration} currentTime={currentTime} onSeek={handleSeekDirect} />}
          {activeTab === "transformer" && <TransformPanel state={editorState} onChange={setEditorState} duration={duration} currentTime={currentTime} onSeek={handleSeekDirect} />}
          {activeTab === "audio" && <AudioPanel state={editorState} onChange={setEditorState} duration={duration} currentTime={currentTime} onSeek={handleSeekDirect} />}
          {activeTab === "texte" && <TextPanel state={editorState} onChange={setEditorState} duration={duration} currentTime={currentTime} onSeek={handleSeekDirect} />}
          {activeTab === "stickers" && <StickersPanel state={editorState} onChange={setEditorState} duration={duration} currentTime={currentTime} onSeek={handleSeekDirect} />}
          {activeTab === "effets" && <EffectsPanel state={editorState} onChange={setEditorState} duration={duration} currentTime={currentTime} onSeek={handleSeekDirect} />}
          {activeTab === "couverture" && <CoverPanel state={editorState} onChange={setEditorState} duration={duration} currentTime={currentTime} onSeek={handleSeekDirect} />}
        </div>

        {/* Bottom Horizontal Scrollable Categories Bar */}
        <div className="shrink-0 p-2 bg-background border-t border-border z-30">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-[#D4AF37] text-black shadow-md scale-105"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // IMPORT / SELECTION INITIAL MODE
  return createPortal(
    <div
      className="fixed inset-0 bg-background text-foreground z-[9999] flex flex-col items-center justify-center gap-6 px-6 select-none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <button
        onClick={handleCloseCreator}
        className="absolute top-4 left-4 p-2.5 rounded-full bg-muted/80 hover:bg-muted text-foreground transition-all cursor-pointer"
        title="Fermer"
      >
        <X className="w-6 h-6" />
      </button>

      <div
        className={`w-24 h-24 rounded-3xl border-2 flex items-center justify-center transition-all ${
          isDraggingOver
            ? "border-[#D4AF37] bg-[#D4AF37]/20 scale-110 shadow-2xl"
            : "bg-muted/50 border-border"
        }`}
      >
        {isDraggingOver ? (
          <Upload className="w-10 h-10 text-[#D4AF37] animate-bounce" />
        ) : (
          <ImageIcon className="w-10 h-10 text-[#D4AF37]" />
        )}
      </div>

      <div className="text-center space-y-1.5 max-w-xs">
        <h2 className="font-black text-xl tracking-tight">Nouveau Réel AFRIGOMBO</h2>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {isDraggingOver
            ? "Relâchez le fichier vidéo pour l'importer"
            : "Sélectionnez ou déposez une vidéo depuis votre appareil (MP4, MOV, WebM)"}
        </p>
      </div>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="bg-[#D4AF37] hover:bg-amber-400 text-black font-black px-6 py-3 rounded-full text-xs uppercase tracking-wider shadow-xl active:scale-95 transition-all cursor-pointer flex items-center gap-2"
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
