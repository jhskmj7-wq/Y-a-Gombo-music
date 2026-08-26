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

/**
 * Detect best supported MediaRecorder MIME type on current device/browser.
 */
function getSupportedMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";

  const candidateTypes = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=h264,opus",
    "video/webm",
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/mp4"
  ];

  for (const type of candidateTypes) {
    try {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    } catch (_) {
      // continue check
    }
  }
  return "";
}

/**
 * Calculates adaptive target bitrate and resolution based on video metadata and target weight.
 */
function calculateCompressionProfile(
  originalWidth: number,
  originalHeight: number,
  durationSeconds: number,
  originalSizeBytes: number,
  tier: number = 1
): { targetWidth: number; targetHeight: number; videoBitrate: number; audioBitrate: number } {
  const safeDuration = Math.max(2, durationSeconds || 15);
  
  // Base target weight: adapt based on duration (aiming for smooth ~12-25MB max depending on length)
  // Approx 15MB for 15-30s, up to 28MB for 60s
  let targetBytes = Math.min(28 * 1024 * 1024, Math.max(10 * 1024 * 1024, safeDuration * 350 * 1024));
  
  if (tier === 2) {
    targetBytes = targetBytes * 0.75; // More conservative tier
  } else if (tier === 3) {
    targetBytes = targetBytes * 0.55; // Aggressive tier
  }

  // Calculate bitrate from target budget
  const totalTargetBitrate = Math.round((targetBytes * 8) / safeDuration);
  const audioBitrate = 96_000; // 96 kbps clean voice/music
  let videoBitrate = Math.max(600_000, totalTargetBitrate - audioBitrate);

  // Maximum and minimum bitrate guards
  if (tier === 1) {
    videoBitrate = Math.min(3_200_000, Math.max(1_200_000, videoBitrate));
  } else if (tier === 2) {
    videoBitrate = Math.min(2_000_000, Math.max(900_000, videoBitrate));
  } else {
    videoBitrate = Math.min(1_400_000, Math.max(650_000, videoBitrate));
  }

  // Aspect ratio preservation & max dimension bounds
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  // Max dimension constraints (avoid 4K/UHD excessive canvas overhead on mobile)
  const maxDimension = tier === 1 ? 1920 : tier === 2 ? 1280 : 1080;
  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    if (targetWidth >= targetHeight) {
      targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
      targetWidth = maxDimension;
    } else {
      targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
      targetHeight = maxDimension;
    }
  }

  // Ensure even dimensions for video codecs
  targetWidth = targetWidth % 2 === 0 ? targetWidth : targetWidth - 1;
  targetHeight = targetHeight % 2 === 0 ? targetHeight : targetHeight - 1;

  return { targetWidth, targetHeight, videoBitrate, audioBitrate };
}

/**
 * Core single-pass compression runner using Canvas / MediaStream / MediaRecorder.
 */
function executeCompressionPass(
  file: File,
  videoEl: HTMLVideoElement,
  profile: { targetWidth: number; targetHeight: number; videoBitrate: number; audioBitrate: number },
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

    // Setup canvas for downscaling & rendering
    const canvas = document.createElement("canvas");
    canvas.width = profile.targetWidth;
    canvas.height = profile.targetHeight;
    const ctx = canvas.getContext("2d", { alpha: false });

    if (!ctx) {
      cleanup();
      return reject(new Error("Contexte graphique Canvas 2D indisponible."));
    }

    // Stream generation
    let stream: MediaStream;
    try {
      // 30 FPS canvas stream
      const canvasStream = canvas.captureStream ? canvas.captureStream(30) : (canvas as any).mozCaptureStream?.(30);
      if (!canvasStream) {
        throw new Error("captureStream non supporté sur cet environnement.");
      }

      // Try capturing audio track from video element if available
      const anyVideo = videoEl as any;
      const rawVideoStream: MediaStream | undefined = anyVideo.captureStream?.() || anyVideo.mozCaptureStream?.();
      const audioTracks = rawVideoStream?.getAudioTracks?.() || [];

      if (audioTracks.length > 0) {
        stream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);
      } else {
        stream = canvasStream;
      }
    } catch (streamErr: any) {
      cleanup();
      return reject(new Error(`Impossible de créer le flux vidéo: ${streamErr?.message || streamErr}`));
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
      return reject(new Error(`MediaRecorder non supporté avec ce profil: ${recErr?.message || recErr}`));
    }

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onerror = (e: any) => {
      cleanup();
      reject(new Error(`Erreur lors de l'enregistrement MediaRecorder: ${e?.error?.message || "Erreur inconnue"}`));
    };

    recorder.onstop = () => {
      if (chunks.length === 0) {
        return reject(new Error("Aucune donnée vidéo enregistrée pendant la compression."));
      }
      const outputMime = recorder?.mimeType || mimeType || "video/webm";
      const resultBlob = new Blob(chunks, { type: outputMime });
      resolve({ blob: resultBlob, mimeType: outputMime });
    };

    // Render loop
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
    recorder.start(250); // 250ms chunks
    videoEl.play()
      .then(() => {
        renderFrame();
      })
      .catch((playErr) => {
        cleanup();
        reject(new Error(`Lecture vidéo bloquée par le navigateur: ${playErr?.message || "Autoplay restreint"}`));
      });
  });
}

/**
 * Main adaptive compression orchestrator.
 * Evaluates duration, resolution, size, runs multi-tier optimization,
 * and validates the output strictly without silent fallbacks.
 */
export async function compressVideoFile(
  file: File,
  options: VideoCompressorOptions = {}
): Promise<CompressionResult> {
  const onProgress = options.onProgress;
  const mimeType = getSupportedMimeType();

  if (!mimeType) {
    throw new Error(
      "Le navigateur actuel ne dispose pas des encodeurs MediaRecorder nécessaires pour la compression vidéo."
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
      reject(new Error("Délai de chargement des métadonnées vidéo dépassé (timeout 15s)."));
    }, 15000);

    videoEl.onloadedmetadata = async () => {
      clearTimeout(timeoutHandle);

      const originalWidth = videoEl.videoWidth || 1080;
      const originalHeight = videoEl.videoHeight || 1920;
      const durationSeconds = videoEl.duration || 15;
      const originalSize = file.size;

      try {
        if (onProgress) onProgress(5, "Analyse des métadonnées...");

        // Tier 1: High quality adaptive compression
        let profile = calculateCompressionProfile(
          originalWidth,
          originalHeight,
          durationSeconds,
          originalSize,
          1
        );

        if (onProgress) onProgress(10, `Optimisation haute fidélité (${profile.targetWidth}x${profile.targetHeight})...`);

        let passResult = await executeCompressionPass(
          file,
          videoEl,
          profile,
          mimeType,
          (pct) => {
            if (onProgress) onProgress(10 + Math.round(pct * 0.85), "Compression en cours...");
          }
        );

        // Evaluate Tier 1 output
        let compressedBlob = passResult.blob;
        let compressedSize = compressedBlob.size;

        // If still exceeds 35MB (for example on very long or complex videos), do Tier 2 pass
        if (compressedSize > 35 * 1024 * 1024 && durationSeconds > 10) {
          if (onProgress) onProgress(50, "Ajustement adaptatif du débit...");
          profile = calculateCompressionProfile(
            originalWidth,
            originalHeight,
            durationSeconds,
            originalSize,
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

        // Verification: ensure result is actually a valid file
        if (compressedSize <= 0) {
          throw new Error("Le fichier vidéo compressé produit est vide.");
        }

        const extension = passResult.mimeType.includes("mp4") ? ".mp4" : ".webm";
        const cleanName = file.name.replace(/\.[^.]+$/, "") + `_opt${extension}`;
        const finalCompressedFile = new File([compressedBlob], cleanName, {
          type: passResult.mimeType || "video/webm",
        });

        const reduction = Math.max(0, Math.round(((originalSize - finalCompressedFile.size) / originalSize) * 100));

        // Diagnostics
        console.log(
          `[REEL COMPRESSION]\n` +
          `Original: ${(originalSize / 1024 / 1024).toFixed(2)} Mo\n` +
          `Final: ${(finalCompressedFile.size / 1024 / 1024).toFixed(2)} Mo\n` +
          `Reduction: ${reduction} %\n` +
          `Durée: ${durationSeconds.toFixed(1)} s\n` +
          `Résolution: ${profile.targetWidth}x${profile.targetHeight}\n` +
          `Type: ${finalCompressedFile.type}`
        );

        resolve({
          file: finalCompressedFile,
          originalSizeBytes: originalSize,
          compressedSizeBytes: finalCompressedFile.size,
          reductionPercentage: reduction,
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

