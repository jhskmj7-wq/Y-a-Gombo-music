import { VideoEditorState, buildCombinedCssFilter } from "../../components/reels/editorState";
import { REEL_VIDEO_FILTERS } from "../../components/reels/videoFilters";

export interface ExportResult {
  file: File;
  durationSeconds: number;
  width: number;
  height: number;
  mimeType: string;
}

export interface VideoExporterOptions {
  onProgress?: (percent: number, phase?: string) => void;
}

/**
 * Detect best supported MediaRecorder MIME type for video export.
 */
function getExportMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";

  const candidateTypes = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/mp4",
  ];

  for (const type of candidateTypes) {
    try {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    } catch (_) {}
  }
  return "video/webm";
}

/**
 * Core Video Exporter Engine.
 * Takes original video File and VideoEditorState, renders frame-by-frame on an HTMLCanvasElement
 * with applied filters, adjustments, rotation, flip, aspect ratio, trim, speed, audio gain,
 * and text/sticker overlays, then encodes into a new File via MediaRecorder.
 */
export async function exportVideoFile(
  file: File,
  editorState: VideoEditorState,
  options: VideoExporterOptions = {}
): Promise<ExportResult> {
  const onProgress = options.onProgress;
  const mimeType = getExportMimeType();

  if (!mimeType || typeof MediaRecorder === "undefined") {
    throw new Error(
      "Votre navigateur ne prend pas en charge l'enregistrement vidéo requis pour l'exportation."
    );
  }

  return new Promise((resolve, reject) => {
    const videoEl = document.createElement("video");
    videoEl.muted = false; // We connect audio via AudioContext
    videoEl.playsInline = true;
    videoEl.preload = "auto";
    videoEl.crossOrigin = "anonymous";

    const objectUrl = URL.createObjectURL(file);
    videoEl.src = objectUrl;

    const timeoutHandle = setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Délai d'attente dépassé lors de l'initialisation de l'exportation vidéo (15s)."));
    }, 15000);

    videoEl.onloadedmetadata = async () => {
      clearTimeout(timeoutHandle);

      try {
        if (onProgress) onProgress(5, "Initialisation de l'exportation vidéo...");

        const originalWidth = videoEl.videoWidth || 1080;
        const originalHeight = videoEl.videoHeight || 1920;
        const totalDuration = videoEl.duration || 10;

        // Determine Trim boundaries
        const trimStart = Math.max(0, editorState.trimStart || 0);
        let trimEnd = editorState.trimEnd && editorState.trimEnd > trimStart ? editorState.trimEnd : totalDuration;
        if (trimEnd > totalDuration) trimEnd = totalDuration;
        const trimDuration = Math.max(0.5, trimEnd - trimStart);

        // Determine Canvas / Output Dimensions based on Aspect Ratio and Rotation
        let canvasWidth = 1080;
        let canvasHeight = 1920;

        if (editorState.aspectRatio === "1:1") {
          canvasWidth = 1080;
          canvasHeight = 1080;
        } else if (editorState.aspectRatio === "4:5") {
          canvasWidth = 1080;
          canvasHeight = 1350;
        } else if (editorState.aspectRatio === "16:9") {
          canvasWidth = 1920;
          canvasHeight = 1080;
        } else {
          // 9:16 portrait
          canvasWidth = 1080;
          canvasHeight = 1920;
        }

        // Handle 90/270 deg rotation swapping dimensions if needed
        const isSwapped = editorState.rotation === 90 || editorState.rotation === 270;
        const finalCanvasWidth = canvasWidth;
        const finalCanvasHeight = canvasHeight;

        // Canvas element setup
        const canvas = document.createElement("canvas");
        canvas.width = finalCanvasWidth;
        canvas.height = finalCanvasHeight;
        const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: false });

        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          return reject(new Error("Impossible d'initialiser le contexte de rendu graphique 2D."));
        }

        // Prepare CSS filter string
        const baseFilterObj = REEL_VIDEO_FILTERS.find((f) => f.id === editorState.filterId);
        const baseFilterCss = baseFilterObj ? baseFilterObj.filterCss : "none";
        const combinedCssFilter = buildCombinedCssFilter(editorState, baseFilterCss);

        // Setup AudioContext for volume / mute handling
        let audioCtx: AudioContext | null = null;
        let audioDest: MediaStreamAudioDestinationNode | null = null;
        let audioStreamTrack: MediaStreamTrack | null = null;

        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            audioCtx = new AudioContextClass();
            if (audioCtx.state === "suspended") {
              await audioCtx.resume();
            }
            const source = audioCtx.createMediaElementSource(videoEl);
            const gainNode = audioCtx.createGain();

            // Set gain based on volume and mute state
            const targetVolume = editorState.isMuted ? 0 : Math.max(0, Math.min(1, editorState.volume / 100));
            gainNode.gain.setValueAtTime(targetVolume, audioCtx.currentTime);

            audioDest = audioCtx.createMediaStreamDestination();
            source.connect(gainNode);
            gainNode.connect(audioDest);

            const tracks = audioDest.stream.getAudioTracks();
            if (tracks.length > 0) {
              audioStreamTrack = tracks[0];
            }
          }
        } catch (audioErr) {
          console.warn("[VIDEO EXPORTER] Traitement audio autonome non disponible, enregistrement vidéo pur:", audioErr);
        }

        // Setup Canvas Stream + Combined Stream
        const canvasStream = canvas.captureStream(30); // 30 FPS
        const streamTracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
        if (audioStreamTrack) {
          streamTracks.push(audioStreamTrack);
        }
        const combinedStream = new MediaStream(streamTracks);

        // Setup MediaRecorder
        let recorderOptions: MediaRecorderOptions = { mimeType };
        try {
          recorderOptions.videoBitsPerSecond = 8_000_000; // 8 Mbps high quality export pass
        } catch (_) {}

        let mediaRecorder: MediaRecorder;
        try {
          mediaRecorder = new MediaRecorder(combinedStream, recorderOptions);
        } catch (_) {
          mediaRecorder = new MediaRecorder(combinedStream);
        }

        const recordedChunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunks.push(e.data);
          }
        };

        let isCancelled = false;
        let animFrameId: number | null = null;

        // Cleanup helper
        const cleanup = () => {
          if (animFrameId) cancelAnimationFrame(animFrameId);
          URL.revokeObjectURL(objectUrl);
          if (audioCtx) {
            try { audioCtx.close(); } catch (_) {}
          }
          videoEl.pause();
          videoEl.removeAttribute("src");
          videoEl.load();
        };

        mediaRecorder.onstop = () => {
          cleanup();
          if (isCancelled) return;

          if (recordedChunks.length === 0) {
            return reject(new Error("L'exportation n'a produit aucun segment de fichier vidéo."));
          }

          const exportBlob = new Blob(recordedChunks, { type: mimeType });
          const ext = mimeType.includes("mp4") ? ".mp4" : ".webm";
          const cleanName = file.name.replace(/\.[^.]+$/, "") + `_export${ext}`;
          const exportedFile = new File([exportBlob], cleanName, { type: mimeType });

          if (onProgress) onProgress(100, "Rendu vidéo terminé avec succès !");

          resolve({
            file: exportedFile,
            durationSeconds: trimDuration / editorState.playbackRate,
            width: finalCanvasWidth,
            height: finalCanvasHeight,
            mimeType,
          });
        };

        mediaRecorder.onerror = (err) => {
          isCancelled = true;
          cleanup();
          reject(new Error(`Erreur lors du rendu MediaRecorder : ${err}`));
        };

        // Frame rendering loop
        const renderFrame = () => {
          if (isCancelled) return;

          const curTime = videoEl.currentTime;

          // Check if trim end reached or video ended
          if (curTime >= trimEnd || videoEl.ended) {
            if (mediaRecorder.state === "recording") {
              mediaRecorder.stop();
            }
            return;
          }

          // Calculate percentage
          const elapsed = Math.max(0, curTime - trimStart);
          const progressPct = Math.min(98, Math.round(10 + (elapsed / trimDuration) * 85));
          if (onProgress) {
            onProgress(progressPct, `Rendu des images (${Math.round(elapsed)}s / ${Math.round(trimDuration)}s)...`);
          }

          // 1. Clear background
          ctx.save();
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, finalCanvasWidth, finalCanvasHeight);

          // 2. Setup Transform & Orientation
          ctx.translate(finalCanvasWidth / 2, finalCanvasHeight / 2);

          if (editorState.rotation !== 0) {
            ctx.rotate((editorState.rotation * Math.PI) / 180);
          }

          if (editorState.flipHorizontal) {
            ctx.scale(-1, 1);
          }

          // Calculate cover scale for aspect ratio fill
          const drawW = isSwapped ? finalCanvasHeight : finalCanvasWidth;
          const drawH = isSwapped ? finalCanvasWidth : finalCanvasHeight;

          const videoAspect = originalWidth / originalHeight;
          const targetAspect = drawW / drawH;

          let renderW = drawW;
          let renderH = drawH;

          if (videoAspect > targetAspect) {
            renderW = drawH * videoAspect;
          } else {
            renderH = drawW / videoAspect;
          }

          // 3. Apply CSS Filter
          if (combinedCssFilter && combinedCssFilter !== "none") {
            try {
              ctx.filter = combinedCssFilter;
            } catch (_) {}
          }

          // 4. Draw Video Frame
          ctx.drawImage(videoEl, -renderW / 2, -renderH / 2, renderW, renderH);

          // Reset filter and transform for overlays
          ctx.filter = "none";
          ctx.restore();

          // 5. Draw Vignette Effect if active
          if (editorState.vignette > 0 || editorState.activeEffect === "vignette") {
            ctx.save();
            const strength = Math.max(editorState.vignette, editorState.activeEffect === "vignette" ? 60 : 0) / 100;
            const grad = ctx.createRadialGradient(
              finalCanvasWidth / 2,
              finalCanvasHeight / 2,
              Math.min(finalCanvasWidth, finalCanvasHeight) * 0.35,
              finalCanvasWidth / 2,
              finalCanvasHeight / 2,
              Math.max(finalCanvasWidth, finalCanvasHeight) * 0.75
            );
            grad.addColorStop(0, "rgba(0,0,0,0)");
            grad.addColorStop(1, `rgba(0,0,0,${0.85 * strength})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, finalCanvasWidth, finalCanvasHeight);
            ctx.restore();
          }

          // 6. Draw Text Overlays
          if (editorState.texts && editorState.texts.length > 0) {
            for (const t of editorState.texts) {
              if (!t.text) continue;
              ctx.save();

              const pxX = (t.x / 100) * finalCanvasWidth;
              const pxY = (t.y / 100) * finalCanvasHeight;
              const scaledFontSize = Math.round((t.fontSize || 24) * (finalCanvasHeight / 700));

              ctx.font = `${t.isItalic ? "italic " : ""}${t.isBold ? "bold " : ""}${scaledFontSize}px sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";

              const textMetrics = ctx.measureText(t.text);
              const textWidth = textMetrics.width;
              const textHeight = scaledFontSize * 1.3;

              // Draw background box if configured
              if (t.bgColor && t.bgColor !== "transparent") {
                ctx.fillStyle = t.bgColor;
                const padX = scaledFontSize * 0.4;
                const padY = scaledFontSize * 0.2;
                ctx.beginPath();
                if (typeof (ctx as any).roundRect === "function") {
                  (ctx as any).roundRect(
                    pxX - textWidth / 2 - padX,
                    pxY - textHeight / 2 - padY,
                    textWidth + padX * 2,
                    textHeight + padY * 2,
                    scaledFontSize * 0.3
                  );
                } else {
                  ctx.rect(
                    pxX - textWidth / 2 - padX,
                    pxY - textHeight / 2 - padY,
                    textWidth + padX * 2,
                    textHeight + padY * 2
                  );
                }
                ctx.fill();
              }

              // Draw text string
              ctx.fillStyle = t.color || "#FFFFFF";
              ctx.fillText(t.text, pxX, pxY);
              ctx.restore();
            }
          }

          // 7. Draw Sticker Overlays (Emojis)
          if (editorState.stickers && editorState.stickers.length > 0) {
            for (const s of editorState.stickers) {
              if (!s.emoji) continue;
              ctx.save();

              const pxX = (s.x / 100) * finalCanvasWidth;
              const pxY = (s.y / 100) * finalCanvasHeight;
              const scaledSize = Math.round((s.size || 40) * (finalCanvasHeight / 700));

              ctx.translate(pxX, pxY);
              if (s.rotation) {
                ctx.rotate((s.rotation * Math.PI) / 180);
              }

              ctx.font = `${scaledSize}px sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(s.emoji, 0, 0);

              ctx.restore();
            }
          }

          animFrameId = requestAnimationFrame(renderFrame);
        };

        // Prepare video playback
        videoEl.playbackRate = editorState.playbackRate || 1;
        videoEl.currentTime = trimStart;

        videoEl.onseeked = () => {
          videoEl.onseeked = null; // Unsubscribe immediately to prevent any potential double triggering
          if (onProgress) onProgress(10, "Démarrage du ré-encodage vidéo haute fidélité...");
          try {
            mediaRecorder.start(200); // 200ms slice chunks
            videoEl.play().then(() => {
              renderFrame();
            }).catch((playErr) => {
              isCancelled = true;
              cleanup();
              reject(new Error(`Erreur lors du démarrage de la lecture vidéo : ${playErr.message}`));
            });
          } catch (recErr: any) {
            isCancelled = true;
            cleanup();
            reject(new Error(`Impossible de démarrer l'enregistrateur média : ${recErr.message}`));
          }
        };
      } catch (err: any) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Erreur lors de la configuration de l'exportation : ${err.message}`));
      }
    };

    videoEl.onerror = () => {
      clearTimeout(timeoutHandle);
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Format de vidéo non supporté ou fichier corrompu."));
    };
  });
}
