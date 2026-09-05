export interface CompressionResult {
  file: File;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  reductionPercentage: number;
  durationSeconds: number;
  width: number;
  height: number;
  mimeType: string;
}

export interface VideoCompressorOptions {
  maxSizeMB?: number;
  qualityPreference?: "high" | "balanced" | "max_speed";
  onProgress?: (percent: number, phase?: string) => void;
}

interface VideoVisualMetrics {
  averageLuminance: number; // 0 (pitch black) - 255 (pure white)
  isDarkScene: boolean; // Low-light / concert scene needing banding protection
  complexityScore: number; // 0 (flat/simple) - 1 (highly detailed/textured)
  motionScore: number; // 0 (static) - 1 (fast dance/sports/rapid camera pan)
  skinToneRatio: number; // 0 - 1 (presence of human faces / closeups)
  estimatedSourceFps: number; // 24, 25, 30, 60
}

interface CompressionProfile {
  targetWidth: number;
  targetHeight: number;
  fps: number;
  videoBitrate: number;
  audioBitrate: number;
  codecName: string;
  analysisSummary: string;
}

/**
 * Detect best supported MediaRecorder MIME type on current device/browser.
 * Priority: H.264 MP4 -> H.264 WebM -> VP9 WebM -> MP4 standard -> VP8 WebM.
 */
function getSupportedMimeType(): { mimeType: string; codecLabel: string } {
  if (typeof MediaRecorder === "undefined") {
    return { mimeType: "", codecLabel: "Non supporté" };
  }

  const candidateTypes = [
    { type: "video/mp4;codecs=avc1.42E01E,mp4a.40.2", label: "H.264/AAC MP4 High" },
    { type: "video/mp4;codecs=avc1,mp4a.40.2", label: "H.264/AAC MP4" },
    { type: "video/mp4", label: "MP4 standard" },
    { type: "video/webm;codecs=h264,opus", label: "H.264/Opus WebM" },
    { type: "video/webm;codecs=vp9,opus", label: "VP9/Opus WebM" },
    { type: "video/webm;codecs=vp8,opus", label: "VP8/Opus WebM" },
    { type: "video/webm", label: "WebM standard" },
  ];

  for (const candidate of candidateTypes) {
    try {
      if (MediaRecorder.isTypeSupported(candidate.type)) {
        return { mimeType: candidate.type, codecLabel: candidate.label };
      }
    } catch (_) {
      // Continue check
    }
  }
  return { mimeType: "", codecLabel: "Inconnu" };
}

/**
 * Fast visual analysis sampling 3-4 frames to assess complexity, motion, luminosity, and faces.
 * Runs in under 600ms on a tiny 120x80 offscreen canvas without blocking user interface.
 */
async function analyzeVideoVisualMetrics(
  videoEl: HTMLVideoElement,
  durationSeconds: number
): Promise<VideoVisualMetrics> {
  const defaultMetrics: VideoVisualMetrics = {
    averageLuminance: 120,
    isDarkScene: false,
    complexityScore: 0.5,
    motionScore: 0.5,
    skinToneRatio: 0.2,
    estimatedSourceFps: 30,
  };

  if (typeof document === "undefined" || durationSeconds <= 0.5) {
    return defaultMetrics;
  }

  try {
    const sampleWidth = 120;
    const sampleHeight = 80;
    const canvas = document.createElement("canvas");
    canvas.width = sampleWidth;
    canvas.height = sampleHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) return defaultMetrics;

    // Sample timestamps (15%, 45%, 75% of duration)
    const timestamps = [
      Math.max(0.2, durationSeconds * 0.15),
      Math.max(0.5, durationSeconds * 0.45),
      Math.max(0.8, durationSeconds * 0.75),
    ];

    const frameDataArray: ImageData[] = [];

    const seekAndCapture = (time: number): Promise<ImageData | null> => {
      return new Promise((resolve) => {
        let resolved = false;
        const timer = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(null);
          }
        }, 400);

        const onSeeked = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            videoEl.removeEventListener("seeked", onSeeked);
            try {
              ctx.drawImage(videoEl, 0, 0, sampleWidth, sampleHeight);
              resolve(ctx.getImageData(0, 0, sampleWidth, sampleHeight));
            } catch (_) {
              resolve(null);
            }
          }
        };

        videoEl.addEventListener("seeked", onSeeked, { once: true });
        videoEl.currentTime = time;
      });
    };

    for (const time of timestamps) {
      const data = await seekAndCapture(time);
      if (data) frameDataArray.push(data);
    }

    if (frameDataArray.length === 0) {
      return defaultMetrics;
    }

    let totalLuminance = 0;
    let totalComplexity = 0;
    let totalSkinPixels = 0;
    const totalPixels = sampleWidth * sampleHeight;

    for (const imgData of frameDataArray) {
      const data = imgData.data;
      let frameLum = 0;
      let variance = 0;
      let skinCount = 0;

      // Sample every 2nd pixel for performance
      for (let i = 0; i < data.length; i += 8) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Perceived luminance (ITU-R BT.709)
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        frameLum += lum;

        // Fast skin tone detection in RGB range
        if (r > 60 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
          skinCount++;
        }

        // Local edge contrast with next pixel
        if (i + 12 < data.length) {
          const nextLum = 0.2126 * data[i + 8] + 0.7152 * data[i + 9] + 0.0722 * data[i + 10];
          variance += Math.abs(lum - nextLum);
        }
      }

      const pixelSampleCount = totalPixels / 2;
      totalLuminance += frameLum / pixelSampleCount;
      totalComplexity += variance / pixelSampleCount;
      totalSkinPixels += skinCount / pixelSampleCount;
    }

    const avgLum = totalLuminance / frameDataArray.length;
    const avgComplexity = totalComplexity / frameDataArray.length;
    const avgSkin = totalSkinPixels / frameDataArray.length;

    // Motion score: pixel difference between first and second/third sample
    let motionScore = 0.45;
    if (frameDataArray.length >= 2) {
      const d1 = frameDataArray[0].data;
      const d2 = frameDataArray[frameDataArray.length - 1].data;
      let diff = 0;
      for (let i = 0; i < d1.length; i += 8) {
        diff += Math.abs(d1[i] - d2[i]) + Math.abs(d1[i + 1] - d2[i + 1]) + Math.abs(d1[i + 2] - d2[i + 2]);
      }
      const rawMotion = diff / ((d1.length / 8) * 3 * 255);
      motionScore = Math.min(1.0, Math.max(0.1, rawMotion * 2.5));
    }

    // Normalized complexity (0 - 1)
    const normalizedComplexity = Math.min(1.0, Math.max(0.1, avgComplexity / 35));

    return {
      averageLuminance: Math.round(avgLum),
      isDarkScene: avgLum < 55, // Low-light / concert / dark backgrounds
      complexityScore: Math.round(normalizedComplexity * 100) / 100,
      motionScore: Math.round(motionScore * 100) / 100,
      skinToneRatio: Math.round(avgSkin * 100) / 100,
      estimatedSourceFps: 30,
    };
  } catch (err) {
    console.warn("[VIDEO_ANALYSIS] Analyse visuelle non-bloquante terminée avec profil standard:", err);
    return defaultMetrics;
  }
}

/**
 * Calculates an intelligent, adaptive compression profile based on real video metrics:
 * Resolution, duration, visual complexity, motion dynamics, dark scenes, and face focus.
 */
function calculateAdaptiveCompressionProfile(
  originalWidth: number,
  originalHeight: number,
  durationSeconds: number,
  originalSizeBytes: number,
  codecLabel: string,
  metrics: VideoVisualMetrics
): CompressionProfile {
  const safeDuration = Math.max(1.0, durationSeconds || 15);

  // 1. Resolution strategy: preserve native 1080p or 720p; downscale 4K cleanly
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;
  const maxDimension = 1920;

  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    if (targetWidth >= targetHeight) {
      targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
      targetWidth = maxDimension;
    } else {
      targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
      targetHeight = maxDimension;
    }
  }

  // Strictly even dimensions for hardware encoder compatibility
  targetWidth = targetWidth % 2 === 0 ? targetWidth : targetWidth - 1;
  targetHeight = targetHeight % 2 === 0 ? targetHeight : targetHeight - 1;

  // 2. Adaptive FPS strategy
  // 30 FPS fixed offers the optimal bit-efficiency per frame for mobile streaming
  const fps = 30;

  // 3. Audio Bitrate strategy
  // 128 kbps for high musical fidelity, 112 kbps for very long clips
  const audioBitrate = safeDuration > 180 ? 112_000 : 128_000;

  // 4. Adaptive Video Bitrate Calculation
  const totalPixels = targetWidth * targetHeight;
  const is1080p = totalPixels > 1280 * 720;
  const is720p = totalPixels > 854 * 480 && !is1080p;

  // Base nominal bitrate per resolution tier
  let baseBitrate: number;
  if (is1080p) {
    baseBitrate = 3_400_000; // 3.4 Mbps default for 1080p
  } else if (is720p) {
    baseBitrate = 2_300_000; // 2.3 Mbps default for 720p
  } else {
    baseBitrate = 1_400_000; // 1.4 Mbps default for 480p/540p
  }

  // Visual Modifiers (Multipliers)
  let complexityMultiplier = 1.0;

  // Motion modifier: fast dance / rapid motion needs more bits (+10% to +25%)
  if (metrics.motionScore > 0.6) {
    complexityMultiplier += 0.15;
  } else if (metrics.motionScore < 0.25) {
    complexityMultiplier -= 0.12; // Static talking head can save 12%
  }

  // Texture & Detail modifier: dense crowd, textured clothing, foliage, text (+10% to +20%)
  if (metrics.complexityScore > 0.6) {
    complexityMultiplier += 0.12;
  } else if (metrics.complexityScore < 0.3) {
    complexityMultiplier -= 0.10;
  }

  // Dark Scene / Concert Protection: avoid banding and macroblocking (+15%)
  if (metrics.isDarkScene) {
    complexityMultiplier += 0.15;
  }

  // Closeups / Faces Protection: preserve skin textures (+10%)
  if (metrics.skinToneRatio > 0.35) {
    complexityMultiplier += 0.08;
  }

  // Apply visual modifier
  let videoBitrate = Math.round(baseBitrate * complexityMultiplier);

  // 5. Duration-Aware Scaling (Crucial for long videos like 4m40s)
  if (safeDuration > 180) {
    // For 3 to 5+ minute videos:
    // Scale bitrate down to ~1.4 - 1.8 Mbps so a 4m40s video lands gracefully around 48-58 MB
    // while maintaining sharp H.264/VP9 visual stability
    const longDurationFactor = is1080p ? 0.48 : 0.60;
    videoBitrate = Math.round(videoBitrate * longDurationFactor);
  } else if (safeDuration > 90) {
    // 90s to 180s videos
    videoBitrate = Math.round(videoBitrate * 0.78);
  }

  // 6. Strict Bounds Clamping (Min / Max safety rails)
  if (is1080p) {
    if (safeDuration > 180) {
      videoBitrate = Math.max(1_400_000, Math.min(2_200_000, videoBitrate)); // 4m+ video clamped at 1.4 - 2.2 Mbps
    } else {
      videoBitrate = Math.max(2_400_000, Math.min(4_400_000, videoBitrate)); // Standard 1080p clamped at 2.4 - 4.4 Mbps
    }
  } else if (is720p) {
    if (safeDuration > 180) {
      videoBitrate = Math.max(1_100_000, Math.min(1_700_000, videoBitrate));
    } else {
      videoBitrate = Math.max(1_700_000, Math.min(2_900_000, videoBitrate));
    }
  } else {
    videoBitrate = Math.max(900_000, Math.min(1_800_000, videoBitrate));
  }

  // 7. Guard against recompressing already heavily compressed source files
  const estimatedSourceBitrate = Math.round((originalSizeBytes * 8) / safeDuration);
  if (estimatedSourceBitrate > 0 && estimatedSourceBitrate < videoBitrate) {
    videoBitrate = Math.max(1_100_000, Math.round(estimatedSourceBitrate * 0.92));
  }

  const analysisSummary = `Lum:${metrics.averageLuminance}${metrics.isDarkScene ? " (Sombre)" : ""}, Cmplx:${metrics.complexityScore}, Mvt:${metrics.motionScore}, Peau:${metrics.skinToneRatio}`;

  return {
    targetWidth,
    targetHeight,
    fps,
    videoBitrate,
    audioBitrate,
    codecName: codecLabel,
    analysisSummary,
  };
}

/**
 * Core single-pass compression runner using Canvas 2D + MediaStream + MediaRecorder.
 */
function executeCompressionPass(
  file: File,
  videoEl: HTMLVideoElement,
  profile: CompressionProfile,
  mimeType: string,
  onProgress?: (percent: number) => void
): Promise<{ blob: Blob; mimeType: string }> {
  return new Promise((resolve, reject) => {
    let recorder: MediaRecorder | null = null;
    let isTerminated = false;
    const chunks: Blob[] = [];

    const cleanup = () => {
      isTerminated = true;
      try {
        if (recorder && recorder.state !== "inactive") {
          recorder.stop();
        }
      } catch (_) {}
      videoEl.pause();
    };

    // Canvas setup with high quality smoothing
    const canvas = document.createElement("canvas");
    canvas.width = profile.targetWidth;
    canvas.height = profile.targetHeight;
    const ctx = canvas.getContext("2d", { alpha: false });

    if (!ctx) {
      cleanup();
      return reject(new Error("Contexte graphique Canvas 2D indisponible sur ce périphérique."));
    }

    // Enable high quality image smoothing for crisp downscaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Stream generation
    let stream: MediaStream;
    try {
      const canvasStream = canvas.captureStream
        ? canvas.captureStream(profile.fps)
        : (canvas as any).mozCaptureStream?.(profile.fps);

      if (!canvasStream) {
        throw new Error("L'API canvas.captureStream n'est pas supportée sur ce navigateur.");
      }

      // Capture audio track if available from original video
      const anyVideo = videoEl as any;
      const rawVideoStream: MediaStream | undefined =
        anyVideo.captureStream?.() || anyVideo.mozCaptureStream?.();
      const audioTracks = rawVideoStream?.getAudioTracks?.() || [];

      if (audioTracks.length > 0) {
        stream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);
      } else {
        stream = canvasStream;
      }
    } catch (streamErr: any) {
      cleanup();
      return reject(new Error(`Impossible de générer le flux vidéo: ${streamErr?.message || streamErr}`));
    }

    try {
      const recorderOptions: MediaRecorderOptions = {
        videoBitsPerSecond: profile.videoBitrate,
        audioBitsPerSecond: profile.audioBitrate,
      };
      if (mimeType) {
        recorderOptions.mimeType = mimeType;
      }
      recorder = new MediaRecorder(stream, recorderOptions);
    } catch (recErr: any) {
      cleanup();
      return reject(new Error(`MediaRecorder indisponible avec ce profil: ${recErr?.message || recErr}`));
    }

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onerror = (e: any) => {
      cleanup();
      reject(new Error(`Erreur d'encodage MediaRecorder: ${e?.error?.message || "Erreur interne"}`));
    };

    recorder.onstop = () => {
      if (chunks.length === 0) {
        return reject(new Error("Aucun bloc de données vidéo généré lors de la compression."));
      }
      const outputMime = recorder?.mimeType || mimeType || "video/webm";
      const resultBlob = new Blob(chunks, { type: outputMime });
      resolve({ blob: resultBlob, mimeType: outputMime });
    };

    // Frame rendering loop
    videoEl.currentTime = 0;
    let animId: number;

    const renderFrame = () => {
      if (isTerminated) return;
      if (!videoEl.paused && !videoEl.ended) {
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        if (videoEl.duration > 0 && onProgress) {
          const pct = Math.min(99, Math.round((videoEl.currentTime / videoEl.duration) * 100));
          onProgress(pct);
        }
        animId = requestAnimationFrame(renderFrame);
      }
    };

    videoEl.onended = () => {
      cancelAnimationFrame(animId);
      if (onProgress) onProgress(100);
      setTimeout(() => {
        try {
          if (recorder && recorder.state !== "inactive") {
            recorder.stop();
          }
        } catch (_) {}
      }, 150);
    };

    // Start recording & playback
    recorder.start(250);
    videoEl
      .play()
      .then(() => {
        renderFrame();
      })
      .catch((playErr) => {
        cleanup();
        reject(
          new Error(`Lecture de la vidéo bloquée par le navigateur: ${playErr?.message || "Autoplay restreint"}`)
        );
      });
  });
}

/**
 * Main adaptive video compression orchestrator.
 * Dynamically profiles video characteristics, performs fast visual analysis,
 * and encodes with optimal perceptual quality and proportional file size.
 */
export async function compressVideoFile(
  file: File,
  options: VideoCompressorOptions = {}
): Promise<CompressionResult> {
  const onProgress = options.onProgress;
  const { mimeType, codecLabel } = getSupportedMimeType();

  if (!mimeType) {
    throw new Error(
      "Le navigateur ne prend pas en charge les encodeurs MediaRecorder requis pour la compression vidéo."
    );
  }

  return new Promise((resolve, reject) => {
    const videoEl = document.createElement("video");
    videoEl.muted = true;
    videoEl.playsInline = true;
    videoEl.preload = "auto";
    const objectUrl = URL.createObjectURL(file);
    videoEl.src = objectUrl;

    const timeoutHandle = setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Délai d'attente dépassé lors du chargement des métadonnées vidéo (15s)."));
    }, 15000);

    videoEl.onloadedmetadata = async () => {
      clearTimeout(timeoutHandle);

      const originalWidth = videoEl.videoWidth || 1080;
      const originalHeight = videoEl.videoHeight || 1920;
      const durationSeconds = videoEl.duration || 15;
      const originalSize = file.size;

      try {
        if (onProgress) onProgress(4, "Analyse intelligente du contenu vidéo...");

        // Fast visual metrics analysis
        const visualMetrics = await analyzeVideoVisualMetrics(videoEl, durationSeconds);

        if (onProgress) onProgress(8, "Calcul du profil d'encodage adaptatif...");

        // Calculate intelligent adaptive compression profile
        const profile = calculateAdaptiveCompressionProfile(
          originalWidth,
          originalHeight,
          durationSeconds,
          originalSize,
          codecLabel,
          visualMetrics
        );

        if (onProgress) {
          onProgress(
            12,
            `Compression adaptative (${profile.targetWidth}x${profile.targetHeight} - ${Math.round(profile.videoBitrate / 1000)} kbps)...`
          );
        }

        const passResult = await executeCompressionPass(
          file,
          videoEl,
          profile,
          mimeType,
          (pct) => {
            if (onProgress) onProgress(12 + Math.round(pct * 0.86), "Encodage vidéo haute fidélité...");
          }
        );

        const compressedBlob = passResult.blob;
        const compressedSize = compressedBlob.size;

        URL.revokeObjectURL(objectUrl);

        if (compressedSize <= 0) {
          throw new Error("Le fichier vidéo compressé produit est vide.");
        }

        // Protection against larger output than original for already compressed tiny files
        if (compressedSize >= originalSize && originalSize <= 8 * 1024 * 1024) {
          throw new Error(
            "Le fichier original est déjà ultra-léger et ne peut pas être compressé davantage sans dégradation."
          );
        }

        const extension = passResult.mimeType.includes("mp4") ? ".mp4" : ".webm";
        const cleanName = file.name.replace(/\.[^.]+$/, "") + `_opt${extension}`;
        const finalCompressedFile = new File([compressedBlob], cleanName, {
          type: passResult.mimeType || "video/webm",
        });

        const reduction = Math.max(
          0,
          Math.round(((originalSize - finalCompressedFile.size) / originalSize) * 1000) / 10
        );

        // Formatted diagnostic log
        console.log(
          `[AFRIGOMBO ADAPTIVE COMPRESSION]\n` +
          `Original: ${(originalSize / 1024 / 1024).toFixed(2)} Mo\n` +
          `Final: ${(finalCompressedFile.size / 1024 / 1024).toFixed(2)} Mo\n` +
          `Reduction: ${reduction}%\n` +
          `Duration: ${durationSeconds.toFixed(1)}s\n` +
          `Resolution: ${profile.targetWidth}x${profile.targetHeight}\n` +
          `FPS: ${profile.fps}\n` +
          `Video bitrate: ${Math.round(profile.videoBitrate / 1000)} kbps\n` +
          `Audio bitrate: ${Math.round(profile.audioBitrate / 1000)} kbps\n` +
          `Codec: ${profile.codecName}\n` +
          `Visual Analysis: ${profile.analysisSummary}\n` +
          `Type: ${finalCompressedFile.type}`
        );

        resolve({
          file: finalCompressedFile,
          originalSizeBytes: originalSize,
          compressedSizeBytes: finalCompressedFile.size,
          reductionPercentage: Math.round(reduction),
          durationSeconds,
          width: profile.targetWidth,
          height: profile.targetHeight,
          mimeType: finalCompressedFile.type,
        });
      } catch (passErr: any) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Échec de la compression adaptative: ${passErr?.message || passErr}`));
      }
    };

    videoEl.onerror = () => {
      clearTimeout(timeoutHandle);
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Format de fichier vidéo non supporté ou fichier illisible par le décodeur."));
    };
  });
}




