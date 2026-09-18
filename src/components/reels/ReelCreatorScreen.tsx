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
  AlertTriangle,
  Trash2
} from "lucide-react";

import { VideoFilter, REEL_VIDEO_FILTERS, getFilterCss } from "./videoFilters";
import {
  VideoEditorState,
  INITIAL_EDITOR_STATE,
  buildCombinedCssFilter,
  hasEditorModifications,
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
  onVideoReady: (file: File, filterId: string, coverUrl?: string) => void;
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

  // Drafts Modal State for Initial Screen
  const [showDraftsModal, setShowDraftsModal] = useState<boolean>(false);
  const [userDraftsList, setUserDraftsList] = useState<ReelDraft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState<boolean>(false);

  const handleOpenDraftsModal = async () => {
    const userId = auth.currentUser?.uid || "user_guest";
    setLoadingDrafts(true);
    try {
      const list = await reelsDraftsService.getUserDrafts(userId);
      setUserDraftsList(list);
    } catch (e) {
      console.warn("[ReelCreator] Error loading drafts:", e);
    } finally {
      setLoadingDrafts(false);
      setShowDraftsModal(true);
    }
  };

  const handleResumeDraftItem = (draft: ReelDraft) => {
    if (draft.editorState) {
      setEditorState(draft.editorState);
    }
    if (draft.videoBlob) {
      const file = draft.videoBlob instanceof File 
        ? draft.videoBlob 
        : new File([draft.videoBlob], "brouillon_reel.mp4", { type: draft.videoBlob.type || "video/mp4" });
      const url = URL.createObjectURL(file);
      setSelectedFile(file);
      setRecordedUrl(url);
    } else if (draft.videoSourceUrl) {
      setRecordedUrl(draft.videoSourceUrl);
      const dummyFile = new File([""], "brouillon_remote.mp4", { type: "video/mp4" });
      setSelectedFile(dummyFile);
    }
    if (draft.id) {
      setCurrentDraftId(draft.id);
    }
    setShowDraftsModal(false);
    setToastMsg("Brouillon repris avec succès !");
  };

  const handleDeleteDraftItem = async (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const userId = auth.currentUser?.uid || "user_guest";
    try {
      await reelsDraftsService.deleteDraft(draftId, userId);
      setUserDraftsList(prev => prev.filter(d => d.id !== draftId));
      setToastMsg("Brouillon supprimé.");
    } catch (err) {
      console.warn("[ReelCreator] Error deleting draft:", err);
    }
  };

  // Player States
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [centerIconState, setCenterIconState] = useState<"play" | "pause" | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // Dragging overlays in canvas & selection
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const videoStageRef = useRef<HTMLDivElement | null>(null);
  const dragInfoRef = useRef<{
    id: string;
    type: "text" | "sticker";
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    rectWidth: number;
    rectHeight: number;
    hasMoved: boolean;
  } | null>(null);

  const handleOverlayPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    id: string,
    type: "text" | "sticker",
    initX: number,
    initY: number
  ) => {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}

    const stage = videoStageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();

    dragInfoRef.current = {
      id,
      type,
      startX: e.clientX,
      startY: e.clientY,
      initX,
      initY,
      rectWidth: rect.width,
      rectHeight: rect.height,
      hasMoved: false,
    };

    setSelectedOverlayId(id);
    setActiveDragId(id);
  };

  const handleOverlayPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragInfoRef.current || dragInfoRef.current.id !== activeDragId) return;

    e.preventDefault();
    const info = dragInfoRef.current;
    const dx = e.clientX - info.startX;
    const dy = e.clientY - info.startY;

    if (Math.hypot(dx, dy) > 3) {
      info.hasMoved = true;
    }

    if (info.rectWidth > 0 && info.rectHeight > 0) {
      const deltaXPct = (dx / info.rectWidth) * 100;
      const deltaYPct = (dy / info.rectHeight) * 100;

      const newXPct = Math.max(5, Math.min(95, Math.round((info.initX + deltaXPct) * 10) / 10));
      const newYPct = Math.max(5, Math.min(95, Math.round((info.initY + deltaYPct) * 10) / 10));

      setEditorState((prev) => {
        if (info.type === "text") {
          return {
            ...prev,
            texts: prev.texts.map((t) => (t.id === info.id ? { ...t, x: newXPct, y: newYPct } : t)),
          };
        } else {
          return {
            ...prev,
            stickers: prev.stickers.map((s) => (s.id === info.id ? { ...s, x: newXPct, y: newYPct } : s)),
          };
        }
      });
    }
  };

  const handleOverlayPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragInfoRef.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
      dragInfoRef.current = null;
    }
    setActiveDragId(null);
  };

  const isTextVisible = (t: VideoTextOverlay) => {
    if (selectedOverlayId === t.id && activeTab === "texte") return true;
    const start = typeof t.startTime === "number" ? t.startTime : 0;
    const end = typeof t.endTime === "number" && t.endTime > 0 ? t.endTime : (duration || 9999);
    return currentTime >= start - 0.05 && currentTime <= end + 0.05;
  };

  const isStickerVisible = (s: VideoStickerOverlay) => {
    if (selectedOverlayId === s.id && activeTab === "stickers") return true;
    const start = typeof s.startTime === "number" ? s.startTime : 0;
    const end = typeof s.endTime === "number" && s.endTime > 0 ? s.endTime : (duration || 9999);
    return currentTime >= start - 0.05 && currentTime <= end + 0.05;
  };

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

  const captureCoverThumbnail = (): string | null => {
    try {
      const vid = previewRef.current;
      if (vid && vid.videoWidth > 0 && vid.videoHeight > 0) {
        const canvas = document.createElement("canvas");
        canvas.width = Math.min(vid.videoWidth, 720);
        canvas.height = Math.round((canvas.width * vid.videoHeight) / vid.videoWidth);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL("image/jpeg", 0.85);
        }
      }
    } catch (_) {}
    return null;
  };

  const handleNext = async () => {
    if (!selectedFile || isProcessing) return;

    // Capture de la miniature sélectionnée / courante avant arrêt de la vidéo
    const coverDataUrl = captureCoverThumbnail();

    stopPreviewVideo();
    setIsProcessing(true);
    setProcessingError(null);
    setProcessingPhase("export");
    setProcessingPercent(0);
    setProcessingLog("Initialisation de l'exportation vidéo...");

    try {
      const isEdited = hasEditorModifications(editorState);
      const isOriginalCompatible =
        (selectedFile.type || "").toLowerCase().includes("mp4") ||
        (selectedFile.type || "").toLowerCase().includes("webm") ||
        selectedFile.name.toLowerCase().endsWith(".mp4") ||
        selectedFile.name.toLowerCase().endsWith(".webm");
      const isOriginalReasonableSize = selectedFile.size <= 75 * 1024 * 1024; // <= 75 Mo

      // 1. Si le fichier source est déjà compatible et qu'aucune retouche n'a été effectuée,
      // on préserve à 100% le fichier d'origine (MP4 ou WebM) sans aucun ré-encodage destructeur
      if (!isEdited && isOriginalCompatible && isOriginalReasonableSize) {
        setIsProcessing(false);
        onVideoReady(selectedFile, editorState.filterId, coverDataUrl || undefined);
        return;
      }

      // 2. Exportation & Gravure réelle des effets / calques / filtres si modifications
      // La vidéo est exportée directement à haute fidélité (8.5 - 9.5 Mbps) et SANS double compression
      if (isEdited) {
        setProcessingPhase("export");
        setProcessingPercent(0);
        setProcessingLog("Rendu haute fidélité des modifications visuelles...");

        const exportResult = await exportVideoFile(selectedFile, editorState, {
          onProgress: (percent, phase) => {
            setProcessingPhase("export");
            setProcessingPercent(percent);
            if (phase) setProcessingLog(phase);
          },
        });

        setIsProcessing(false);
        onVideoReady(exportResult.file, editorState.filterId, coverDataUrl || undefined);
        return;
      }

      // 3. Cas particulier : vidéo brute non modifiée mais dépassant 75 Mo ou format lourd non standard
      // Compression haute qualité unique (8 à 10 Mbps)
      setProcessingPhase("compress");
      setProcessingPercent(0);
      setProcessingLog("Optimisation de la qualité vidéo haute fidélité...");

      try {
        const compressionResult = await compressVideoFile(selectedFile, {
          onProgress: (percent, phase) => {
            setProcessingPhase("compress");
            setProcessingPercent(percent);
            if (phase) setProcessingLog(phase);
          },
        });
        setIsProcessing(false);
        onVideoReady(compressionResult.file, editorState.filterId, coverDataUrl || undefined);
      } catch (compressErr: any) {
        console.warn("[REEL PROCESSOR] Compression adaptative contournée, conservation du fichier source:", compressErr);
        setIsProcessing(false);
        onVideoReady(selectedFile, editorState.filterId, coverDataUrl || undefined);
      }
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

  // Categories Toolbar list (Advanced tabs frozen/hidden in UI without deleting code)
  const categories: { id: TabCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
    // { id: "filtres", label: "Filtres", icon: Sparkles },
    // { id: "ajuster", label: "Ajuster", icon: Sliders },
    { id: "couper", label: "Couper", icon: Scissors },
    // { id: "vitesse", label: "Vitesse", icon: Gauge },
    // { id: "transformer", label: "Format", icon: FlipHorizontal },
    { id: "audio", label: "Audio", icon: Volume2 },
    { id: "texte", label: "Texte", icon: Type },
    { id: "stickers", label: "Stickers", icon: Smile },
    // { id: "effets", label: "Effets", icon: Sparkles },
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
            ref={videoStageRef}
            className={`relative rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center bg-black cursor-pointer ${aspectContainerClass}`}
            onClick={() => {
              if (dragInfoRef.current?.hasMoved) return;
              setSelectedOverlayId(null);
              togglePlayPause();
            }}
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

            {/* Text Overlays Render - Draggable with touch & mouse, contrast shadow, timeline-aware */}
            {editorState.texts.filter(isTextVisible).map((t) => {
              const isSelected = selectedOverlayId === t.id;
              return (
                <div
                  key={t.id}
                  id={`reel-text-${t.id}`}
                  onPointerDown={(e) => handleOverlayPointerDown(e, t.id, "text", t.x, t.y)}
                  onPointerMove={handleOverlayPointerMove}
                  onPointerUp={handleOverlayPointerUp}
                  onPointerCancel={handleOverlayPointerUp}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOverlayId(t.id);
                  }}
                  className={`absolute z-30 px-3 py-1.5 rounded-xl text-center select-none cursor-grab active:cursor-grabbing transition-all ${
                    isSelected
                      ? "ring-2 ring-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.7)] scale-[1.02]"
                      : "hover:ring-1 hover:ring-[#D4AF37]/50"
                  }`}
                  style={{
                    left: `${t.x}%`,
                    top: `${t.y}%`,
                    transform: "translate(-50%, -50%)",
                    color: t.color || "#FFFFFF",
                    backgroundColor: t.bgColor || "rgba(0, 0, 0, 0.65)",
                    backdropFilter: "blur(4px)",
                    WebkitBackdropFilter: "blur(4px)",
                    fontSize: `${t.fontSize || 22}px`,
                    fontWeight: t.isBold ? "bold" : "normal",
                    fontStyle: t.isItalic ? "italic" : "normal",
                    textShadow: "0 2px 4px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,0.9)",
                    touchAction: "none",
                    WebkitUserSelect: "none",
                    userSelect: "none",
                  }}
                >
                  {t.text}
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-[#D4AF37] text-black text-[9px] font-black flex items-center justify-center shadow-md">
                      ✦
                    </div>
                  )}
                </div>
              );
            })}

            {/* Sticker Overlays Render - Draggable with touch & mouse, timeline-aware */}
            {editorState.stickers.filter(isStickerVisible).map((s) => {
              const isSelected = selectedOverlayId === s.id;
              return (
                <div
                  key={s.id}
                  id={`reel-sticker-${s.id}`}
                  onPointerDown={(e) => handleOverlayPointerDown(e, s.id, "sticker", s.x, s.y)}
                  onPointerMove={handleOverlayPointerMove}
                  onPointerUp={handleOverlayPointerUp}
                  onPointerCancel={handleOverlayPointerUp}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOverlayId(s.id);
                  }}
                  className={`absolute z-30 select-none cursor-grab active:cursor-grabbing p-1 rounded-2xl transition-all ${
                    isSelected
                      ? "ring-2 ring-[#D4AF37] bg-black/40 backdrop-blur-xs shadow-[0_0_15px_rgba(212,175,55,0.7)] scale-105"
                      : "hover:ring-1 hover:ring-[#D4AF37]/50"
                  }`}
                  style={{
                    left: `${s.x}%`,
                    top: `${s.y}%`,
                    transform: `translate(-50%, -50%) rotate(${s.rotation || 0}deg)`,
                    fontSize: `${s.size || 40}px`,
                    lineHeight: 1,
                    touchAction: "none",
                    WebkitUserSelect: "none",
                    userSelect: "none",
                    filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.7))",
                  }}
                >
                  {s.emoji}
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#D4AF37] text-black text-[8px] font-black flex items-center justify-center shadow-md">
                      ✦
                    </div>
                  )}
                </div>
              );
            })}

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
          {activeTab === "texte" && (
            <TextPanel
              state={editorState}
              onChange={setEditorState}
              duration={duration}
              currentTime={currentTime}
              onSeek={handleSeekDirect}
              selectedOverlayId={selectedOverlayId}
              onSelectOverlay={setSelectedOverlayId}
            />
          )}
          {activeTab === "stickers" && (
            <StickersPanel
              state={editorState}
              onChange={setEditorState}
              duration={duration}
              currentTime={currentTime}
              onSeek={handleSeekDirect}
              selectedOverlayId={selectedOverlayId}
              onSelectOverlay={setSelectedOverlayId}
            />
          )}
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

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-[#D4AF37] hover:bg-amber-400 text-black font-black px-6 py-3 rounded-full text-xs uppercase tracking-wider shadow-xl active:scale-95 transition-all cursor-pointer flex items-center gap-2"
        >
          <Upload className="w-4 h-4 stroke-[2.5]" />
          <span>Importer une vidéo</span>
        </button>

        <button
          onClick={handleOpenDraftsModal}
          className="bg-zinc-800 hover:bg-zinc-700 text-[#D4AF37] border border-[#D4AF37]/30 font-bold px-6 py-3 rounded-full text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-2"
        >
          <Bookmark className="w-4 h-4" />
          <span>Mes Brouillons</span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleGalleryFile}
      />

      {/* DRAFTS MODAL */}
      {showDraftsModal && (
        <div className="fixed inset-0 z-[10005] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-lg w-full bg-zinc-950 border border-[#D4AF37]/40 rounded-3xl p-6 space-y-5 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="font-black text-base">Mes Brouillons de Réels</h3>
              </div>
              <button
                onClick={() => setShowDraftsModal(false)}
                className="p-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
              {loadingDrafts ? (
                <div className="py-12 text-center text-zinc-400 text-xs font-mono">Chargement de vos brouillons...</div>
              ) : userDraftsList.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs">Aucun brouillon enregistré pour le moment.</div>
              ) : (
                userDraftsList.map((draft) => {
                  const previewVidUrl = draft.videoBlob 
                    ? (draft.videoBlob instanceof Blob ? URL.createObjectURL(draft.videoBlob) : null)
                    : draft.videoSourceUrl;
                  return (
                    <div
                      key={draft.id}
                      onClick={() => handleResumeDraftItem(draft)}
                      className="bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-[#D4AF37]/50 rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition group"
                    >
                      <div className="w-14 h-14 rounded-xl bg-black overflow-hidden relative shrink-0 border border-zinc-800 flex items-center justify-center">
                        {previewVidUrl ? (
                          <video src={previewVidUrl} className="w-full h-full object-cover pointer-events-none" muted />
                        ) : (
                          <Film className="w-6 h-6 text-zinc-600" />
                        )}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="font-bold text-xs text-white truncate">
                          {draft.title || draft.caption || "Brouillon sans titre"}
                        </h4>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          Modifié le : {new Date(draft.updatedAt || Date.now()).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => handleDeleteDraftItem(draft.id, e)}
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition"
                          title="Supprimer le brouillon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowDraftsModal(false)}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold rounded-2xl text-xs transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
