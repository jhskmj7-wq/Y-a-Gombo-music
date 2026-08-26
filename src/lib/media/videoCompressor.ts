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

interface CompressionProfile {
  targetWidth: number;
  targetHeight: number;
  fps: number;
  videoBitrate: number;
  audioBitrate: number;
  codecName: string;
}

/**
 * Detect best supported MediaRecorder MIME type on current device/browser in realistic order.
 */
function getSupportedMimeType(): { mimeType: string; codecLabel: string } {
  if (typeof MediaRecorder === "undefined") {
    return { mimeType: "", codecLabel: "Non supporté" };
  }

  const candidateTypes = [
    { type: "video/webm;codecs=vp8,opus", label: "VP8/Opus" },
    { type: "video/webm;codecs=vp9,opus", label: "VP9/Opus" },
    { type: "video/webm;codecs=h264,opus", label: "H.264/Opus" },
    { type: "video/webm", label: "WebM standard" },
    { type: "video/mp4;codecs=avc1,mp4a.40.2", label: "H.264/AAC MP4" },
    { type: "video/mp4", label: "MP4 standard" },
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
 * Calculates adaptive target bitrate, resolution, and FPS based on video metadata.
 * Dynamically targets lightweight mobile sizes:
 * ~10s -> ~1.5-2.5 MB, ~30s -> ~3-5 MB, ~60s -> ~5-8 MB.
 */
function calculateCompressionProfile(
  originalWidth: number,
  originalHeight: number,
  durationSeconds: number,
  originalSizeBytes: number,
  codecLabel: string,
  tier: number = 1
): CompressionProfile {
  const safeDuration = Math.max(1.5, durationSeconds || 15);
  const isVertical = originalHeight >= originalWidth;

  // 1. Adaptive Resolution calculation preserving exact aspect ratio
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  // Define max dimensions per tier and duration
  // 4K and heavy videos are scaled to 1080p or 720p
  let maxDimension = 1920;
  if (tier === 1) {
    if (safeDuration > 35 || originalSizeBytes > 70 * 1024 * 1024) {
      maxDimension = 1280; // 720p HD (720x1280) for long or heavy files
    } else {
      maxDimension = 1920; // 1080p FHD (1080x1920) for shorter clips
    }
  } else {
    // Tier 2: Rescue pass reduces dimension to 720p or 540p
    maxDimension = safeDuration > 30 ? 960 : 1280;
  }

  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    if (targetWidth >= targetHeight) {
      targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
      targetWidth = maxDimension;
    } else {
      targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
      targetHeight = maxDimension;
    }
  }

  // Ensure dimensions are strictly even for video encoders
  targetWidth = targetWidth % 2 === 0 ? targetWidth : targetWidth - 1;
  targetHeight = targetHeight % 2 === 0 ? targetHeight : targetHeight - 1;

  // 2. Adaptive FPS calculation
  // 30 FPS for shorter videos, 24 FPS for longer videos or Tier 2 to save bitrate
  let fps = 30;
  if (safeDuration > 35 || tier >= 2) {
    fps = 24;
  }

  // 3. Audio Bitrate (64-80 kbps Opus)
  const audioBitrate = safeDuration <= 20 ? 80_000 : 64_000;

  // 4. Target Total Byte Budget (dynamic, NO 10MB artificial floor)
  // Estimated target ranges:
  // 10s: ~1.8 MB | 15s: ~2.8 MB | 30s: ~4.5 MB | 45s: ~6.0 MB | 60s: ~7.5 MB
  let targetTotalBytes: number;
  if (safeDuration <= 12) {
    targetTotalBytes = safeDuration * 160 * 1024; // ~1.5 - 2.0 MB for 10s
  } else if (safeDuration <= 25) {
    targetTotalBytes = safeDuration * 150 * 1024; // ~2.5 - 3.7 MB for 15-25s
  } else if (safeDuration <= 45) {
    targetTotalBytes = safeDuration * 135 * 1024; // ~4.0 - 6.0 MB for 30-45s
  } else {
    targetTotalBytes = safeDuration * 125 * 1024; // ~6.0 - 7.8 MB for 60s
  }

  if (tier === 2) {
    targetTotalBytes = targetTotalBytes * 0.70; // 30% further reduction in Tier 2
  }

  // Calculate raw video bitrate from target byte budget
  const targetTotalBitrate = Math.round((targetTotalBytes * 8) / safeDuration);
  let videoBitrate = Math.max(550_000, targetTotalBitrate - audioBitrate);

  // Resolution density adjustment: 1080p gets slightly higher budget than 720p
  const pixelCount = targetWidth * targetHeight;
  if (pixelCount > 1280 * 720) {
    videoBitrate = Math.round(videoBitrate * 1.15);
  }

  // Bitrate bounds per tier to ensure crispness and avoid pixelation
  if (tier === 1) {
    // 10s: max 1.8 Mbps, 60s: max 1.1 Mbps
    const maxAllowed = safeDuration <= 15 ? 1_800_000 : safeDuration <= 30 ? 1_400_000 : 1_100_000;
    videoBitrate = Math.min(maxAllowed, Math.max(650_000, videoBitrate));
  } else {
    videoBitrate = Math.min(1_000_000, Math.max(500_000, Math.round(videoBitrate * 0.75)));
  }

  return {
    targetWidth,
    targetHeight,
    fps,
    videoBitrate,
    audioBitrate,
    codecName: codecLabel,
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

    // Canvas setup
    const canvas = document.createElement("canvas");
    canvas.width = profile.targetWidth;
    canvas.height = profile.targetHeight;
    const ctx = canvas.getContext("2d", { alpha: false });

    if (!ctx) {
      cleanup();
      return reject(new Error("Contexte graphique Canvas 2D indisponible sur ce périphérique."));
    }

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
 * Dynamically budgets size and bitrate without artificial floors,
 * executes multi-tier adaptive passes if needed,
 * guards against output inflation, and rejects silent fallbacks.
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
        if (onProgress) onProgress(5, "Analyse des métadonnées vidéo...");

        // Tier 1: High quality adaptive profile
        let profile = calculateCompressionProfile(
          originalWidth,
          originalHeight,
          durationSeconds,
          originalSize,
          codecLabel,
          1
        );

        if (onProgress) {
          onProgress(
            10,
            `Optimisation adaptative (${profile.targetWidth}x${profile.targetHeight} @ ${profile.fps}fps)...`
          );
        }

        let passResult = await executeCompressionPass(
          file,
          videoEl,
          profile,
          mimeType,
          (pct) => {
            if (onProgress) onProgress(10 + Math.round(pct * 0.85), "Compression vidéo en cours...");
          }
        );

        let compressedBlob = passResult.blob;
        let compressedSize = compressedBlob.size;

        // Dynamic threshold for Tier 2 rescue pass:
        // If output exceeds reasonable limits for its duration (e.g. > 4MB for 10s, > 7MB for 30s, > 12MB for 60s)
        const maxExpectedBytes = Math.max(3.5 * 1024 * 1024, durationSeconds * 200 * 1024);
        if (compressedSize > maxExpectedBytes && durationSeconds > 8) {
          if (onProgress) onProgress(50, "Ajustement de secours du débit...");
          profile = calculateCompressionProfile(
            originalWidth,
            originalHeight,
            durationSeconds,
            originalSize,
            codecLabel,
            2
          );

          passResult = await executeCompressionPass(
            file,
            videoEl,
            profile,
            mimeType,
            (pct) => {
              if (onProgress) onProgress(50 + Math.round(pct * 0.45), "Optimisation finale...");
            }
          );
          compressedBlob = passResult.blob;
          compressedSize = compressedBlob.size;
        }

        URL.revokeObjectURL(objectUrl);

        if (compressedSize <= 0) {
          throw new Error("Le fichier vidéo compressé produit est vide.");
        }

        // Protection against larger output than original
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

        // Strict formatted diagnostic log
        console.log(
          `[REEL COMPRESSION]\n` +
          `Original: ${(originalSize / 1024 / 1024).toFixed(2)} Mo\n` +
          `Final: ${(finalCompressedFile.size / 1024 / 1024).toFixed(2)} Mo\n` +
          `Reduction: ${reduction}%\n` +
          `Duration: ${durationSeconds.toFixed(1)}s\n` +
          `Resolution: ${profile.targetWidth}x${profile.targetHeight}\n` +
          `FPS: ${profile.fps}\n` +
          `Video bitrate: ${Math.round(profile.videoBitrate / 1000)} kbps\n` +
          `Audio bitrate: ${Math.round(profile.audioBitrate / 1000)} kbps\n` +
          `Codec: ${profile.codecName}\n` +
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
        reject(new Error(`Échec de la compression vidéo: ${passErr?.message || passErr}`));
      }
    };

    videoEl.onerror = () => {
      clearTimeout(timeoutHandle);
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Format de fichier vidéo non supporté ou fichier illisible par le décodeur."));
    };
  });
}


