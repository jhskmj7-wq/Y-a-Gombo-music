export interface CompressionResult {
  file: File;
  originalSizeBytes: number;
  compressedSizeBytes: number;
}

/**
 * Compresses a video file in-browser (no external library) by re-recording
 * its playback through MediaRecorder at a controlled bitrate.
 * Works for both freshly recorded videos and imported gallery files.
 */
export async function compressVideoFile(
  file: File,
  options: { targetSizeMB?: number; onProgress?: (percent: number) => void } = {}
): Promise<CompressionResult> {
  const targetSizeMB = options.targetSizeMB ?? 12; // taille cible par défaut : 12 Mo
  const MIN_BITRATE = 3_000_000; // 3 Mbps minimum, jamais en dessous pour rester net
  const MAX_BITRATE = 6_000_000; // 6 Mbps maximum, pas la peine d'aller plus haut

  return new Promise((resolve, reject) => {
    const videoEl = document.createElement("video");
    videoEl.muted = true;
    videoEl.playsInline = true;
    videoEl.src = URL.createObjectURL(file);

    videoEl.onloadedmetadata = () => {
      videoEl.currentTime = 0;

      // Calcule un débit adapté à la durée réelle de la vidéo pour viser targetSizeMB,
      // sans jamais descendre sous MIN_BITRATE (ce qui rendrait l'image floue)
      const durationSeconds = videoEl.duration || 30;
      const targetBitrate = Math.min(
        MAX_BITRATE,
        Math.max(MIN_BITRATE, Math.round((targetSizeMB * 8 * 1024 * 1024) / durationSeconds))
      );

      const anyVideoEl = videoEl as any;
      const captureStream: MediaStream | undefined =
        anyVideoEl.captureStream?.() || anyVideoEl.mozCaptureStream?.();

      if (!captureStream) {
        // Fallback: browser doesn't support captureStream, return original file untouched
        resolve({ file, originalSizeBytes: file.size, compressedSizeBytes: file.size });
        return;
      }

      let mimeType = "video/webm;codecs=vp8,opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/webm";
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "";

      const recorder = new MediaRecorder(
        captureStream,
        mimeType ? { mimeType, videoBitsPerSecond: targetBitrate } : undefined
      );
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType || "video/webm" });
        const compressedFile = new File(
          [blob],
          file.name.replace(/\.[^.]+$/, "") + "_compressed.webm",
          { type: blob.type }
        );
        URL.revokeObjectURL(videoEl.src);
        resolve({
          file: compressedFile,
          originalSizeBytes: file.size,
          compressedSizeBytes: compressedFile.size
        });
      };

      videoEl.ontimeupdate = () => {
        if (videoEl.duration > 0 && options.onProgress) {
          options.onProgress(Math.min(100, Math.round((videoEl.currentTime / videoEl.duration) * 100)));
        }
      };

      videoEl.onended = () => {
        if (recorder.state !== "inactive") recorder.stop();
      };

      recorder.start();
      videoEl.play().catch((err) => {
        reject(err);
      });
    };

    videoEl.onerror = () => {
      reject(new Error("Impossible de lire le fichier vidéo pour compression."));
    };
  });
}
