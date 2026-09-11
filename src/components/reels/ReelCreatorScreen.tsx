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
  RotateCcw,
  Film,
  Loader2,
  Bookmark,
  CheckCircle2,
  AlertTriangle
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
import { exportVideoFile } from "../../lib/media/videoExporter";
import { compressVideoFile } from "../../lib/media/videoCompressor";
import { reelsDraftsService, ReelDraft } from "../../lib/reelsDraftsService";
import { auth } from "../../lib/firebase";

export type { VideoFilter };
export { REEL_VIDEO_FILTERS, getFilterCss };

interface ReelCreatorScreenProps {
  onVideoReady: (file: File, filterId: string) => void;
  onClose: () => void;
  initialDraft?: ReelDraft | null;
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

export default function ReelCreatorScreen({ onVideoReady, onClose, initialDraft }: ReelCreatorScreenProps) {
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  // Core Structured Editor State
  const [editorState, setEditorState] = useState<VideoEditorState>(INITIAL_EDITOR_STATE);
  const [activeTab, setActiveTab] = useState<TabCategory>("filtres");

  // Processing & Compression Pipeline States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingPhase, setProcessingPhase] = useState<"export" | "compress">("export");
  const [processingPercent, setProcessingPercent] = useState<number>(0);
  const [processingLog, setProcessingLog] = useState<string>("");
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Draft & Exit States
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState<boolean>(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(initialDraft?.id || null);

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

  // Restore draft if provided
  useEffect(() => {
    if (initialDraft) {
      if (initialDraft.editorState) {
        setEditorState(initialDraft.editorState);
      }
      if (initialDraft.videoBlob) {
        const file = initialDraft.videoBlob instanceof File 
          ? initialDraft.videoBlob 
          : new File([initialDraft.videoBlob], "brouillon_reel.mp4", { type: initialDraft.videoBlob.type || "video/mp4" });
        const url = URL.createObjectURL(file);
        setSelectedFile(file);
        setRecordedUrl(url);
      } else if (initialDraft.videoSourceUrl) {
        setRecordedUrl(initialDraft.videoSourceUrl);
        // create placeholder file if needed
        const dummyFile = new File([""], "brouillon_remote.mp4", { type: "video/mp4" });
        setSelectedFile(dummyFile);
      }
      if (initialDraft.id) {
        setCurrentDraftId(initialDraft.id);
      }
    }
  }, [initialDraft]);

  const handleSaveDraft = async (andClose = false) => {
    const userId = auth.currentUser?.uid || "user_guest";
    setSavingDraft(true);
    try {
      const saved = await reelsDraftsService.saveDraft({
        id: currentDraftId || undefined,
        userId,
        caption: "",
        editorState,
        videoBlob: selectedFile || undefined,
        videoSourceUrl: recordedUrl || undefined,
      });
      setCurrentDraftId(saved.id);
      setToastMsg("Brouillon enregistré avec succès !");
      setTimeout(() => setToastMsg(null), 3000);
      if (andClose) {
        handleCloseCreator();
      }
    } catch (err: any) {
      console.error("Erreur sauvegarde brouillon :", err);
      setToastMsg("Erreur lors de la sauvegarde du brouillon");
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setSavingDraft(false);
      setShowExitModal(false);
    }
  };

  const handleExitWithPrompt = () => {
    if (selectedFile || recordedUrl) {
      setShowExitModal(true);
    } else {
      handleCloseCreator();
    }
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

  const handleNext = async () => {
    if (!selectedFile || isProcessing) return;

    stopPreviewVideo();
    setIsProcessing(true);
    setProcessingError(null);
    setProcessingPhase("export");
    setProcessingPercent(0);
    setProcessingLog("Initialisation de l'exportation vidéo...");

    try {
      // 1. Exportation & Gravure réelle des effets / calques / filtres
      const exportResult = await exportVideoFile(selectedFile, editorState, {
        onProgress: (percent, phase) => {
          setProcessingPhase("export");
          setProcessingPercent(percent);
          if (phase) setProcessingLog(phase);
        },
      });

      const editedFile = exportResult.file;

      // 2. Compression adaptative
      setProcessingPhase("compress");
      setProcessingPercent(0);
      setProcessingLog("Analyse et compression vidéo adaptative...");

      let finalFile = editedFile;
      try {
        const compressionResult = await compressVideoFile(editedFile, {
          onProgress: (percent, phase) => {
            setProcessingPhase("compress");
            setProcessingPercent(percent);
            if (phase) setProcessingLog(phase);
          },
        });
        finalFile = compressionResult.file;
      } catch (compressErr: any) {
        console.warn("[REEL PROCESSOR] Compression adaptative contournée, conservation du fichier exporté pur:", compressErr);
        // Direct fallback to edited file if compressed is larger or unsupported
        finalFile = editedFile;
      }

      setIsProcessing(false);
      onVideoReady(finalFile, editorState.filterId);
    } catch (err: any) {
      console.error("[REEL PROCESSOR ERROR]", err);
      setIsProcessing(false);
      setProcessingError(err?.message || "Erreur lors du traitement et du rendu de la vidéo.");
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
    transition: "transform 0.2s ease",
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
      <div className="fixed inset-0 bg-afri-bg text-afri-text z-[9999] flex flex-col select-none overflow-hidden">
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0 z-30 bg-afri-bg-sec border-b border-afri-border/50 backdrop-blur-md">
          <button
            onClick={handleExitWithPrompt}
            className="p-2 rounded-full bg-afri-bg-ter hover:bg-afri-bg-action text-afri-text active:scale-95 transition-all cursor-pointer"
            title="Quitter / Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-[#D4AF37]/30">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-afri-text text-xs font-mono font-bold tracking-wide">
              Édition Réel AFRIGOMBO
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSaveDraft(false)}
              disabled={savingDraft || !selectedFile}
              className="flex items-center gap-1.5 bg-afri-bg-ter hover:bg-afri-bg-action border border-[#D4AF37]/40 text-afri-text font-bold px-3 py-1.5 rounded-full text-xs cursor-pointer shadow-sm active:scale-95 transition-all"
              title="Enregistrer comme brouillon"
            >
              {savingDraft ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
              ) : (
                <Bookmark className="w-3.5 h-3.5 text-[#D4AF37]" />
              )}
              <span className="hidden sm:inline">Brouillon</span>
            </button>

            <button
              onClick={handleNext}
              disabled={!selectedFile}
              className="flex items-center gap-1 bg-[#D4AF37] hover:bg-amber-400 text-black font-black px-4 py-1.5 rounded-full text-xs uppercase tracking-wider cursor-pointer shadow-md active:scale-95 transition-all"
            >
              <span>Suivant</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Central Stage: Video Preview Box */}
        <div className="flex-1 flex items-center justify-center relative bg-black p-2 overflow-hidden">
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
        <div className="shrink-0 p-3 bg-afri-bg-sec border-t border-afri-border/50 text-afri-text z-30 max-h-56 overflow-y-auto">
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
        <div className="shrink-0 p-2 bg-afri-bg-ter border-t border-afri-border/50 z-30">
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
                      ? "bg-[#D4AF37] text-black shadow-md font-black"
                      : "bg-afri-bg border border-afri-border/40 text-afri-text-sec hover:bg-afri-bg-action hover:text-afri-text"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PROCESSING OVERLAY MODAL */}
        {isProcessing && (
          <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center animate-fadeIn select-none">
            <div className="max-w-md w-full bg-afri-bg-sec border border-[#D4AF37]/40 rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-hidden text-afri-text">
              <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center mx-auto text-[#D4AF37]">
                {processingPhase === "export" ? (
                  <Film className="w-8 h-8 animate-pulse" />
                ) : (
                  <Sparkles className="w-8 h-8 animate-pulse" />
                )}
              </div>

              <div className="space-y-1">
                <h3 className="font-black text-lg text-white">
                  {processingPhase === "export"
                    ? "Rendu & Exportation de la vidéo..."
                    : "Compression adaptative en cours..."}
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  {processingLog || "Traitement des images et calques..."}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden border border-zinc-700/60">
                  <div
                    className="bg-gradient-to-r from-[#D4AF37] to-amber-300 h-full transition-all duration-200"
                    style={{ width: `${Math.max(5, processingPercent)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                  <span>{processingPhase === "export" ? "Étape 1/2 : Gravure des effets" : "Étape 2/2 : Optimisation R2"}</span>
                  <span className="text-[#D4AF37] font-bold">{processingPercent}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ERROR OVERLAY MODAL */}
        {processingError && (
          <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-white text-center animate-fadeIn select-none">
            <div className="max-w-md w-full bg-zinc-950 border border-red-500/50 rounded-3xl p-6 space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center mx-auto">
                <X className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-red-400">Échec du traitement vidéo</h3>
                <p className="text-xs text-zinc-300 font-sans leading-relaxed">{processingError}</p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setProcessingError(null)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-black rounded-xl text-xs transition cursor-pointer uppercase tracking-wider"
                >
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EXIT CONFIRMATION MODAL */}
        {showExitModal && (
          <div className="fixed inset-0 z-[10001] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
            <div className="max-w-sm w-full bg-afri-bg-sec border border-[#D4AF37]/40 rounded-3xl p-6 space-y-4 shadow-2xl text-afri-text text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center mx-auto">
                <Bookmark className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="font-black text-base text-afri-text">Enregistrer votre brouillon ?</h3>
                <p className="text-xs text-afri-text-sec">
                  Vous avez un montage en cours. Souhaitez-vous le sauvegarder pour le reprendre plus tard ?
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleSaveDraft(true)}
                  disabled={savingDraft}
                  className="w-full py-3 bg-[#D4AF37] hover:bg-amber-400 text-black font-black rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {savingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bookmark className="w-4 h-4" />}
                  <span>Enregistrer en brouillon</span>
                </button>

                <button
                  onClick={handleCloseCreator}
                  className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold border border-red-500/20 rounded-2xl text-xs transition cursor-pointer"
                >
                  Quitter sans enregistrer
                </button>

                <button
                  onClick={() => setShowExitModal(false)}
                  className="w-full py-2 bg-transparent text-afri-text-sec hover:text-afri-text text-xs font-medium cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TOAST NOTIFICATION */}
        {toastMsg && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[10002] bg-[#D4AF37] text-black font-black px-4 py-2.5 rounded-full text-xs shadow-2xl flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMsg}</span>
          </div>
        )}
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
