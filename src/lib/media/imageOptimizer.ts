export type ImageContext = "avatar" | "cover" | "post" | "gallery" | "custom";

export interface ImageOptimizerOptions {
  context?: ImageContext;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  preservePngTransparency?: boolean;
}

export interface OptimizedImageResult {
  file: File;
  blob: Blob;
  base64: string;
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  format: string;
  mimeType: string;
}

export const CONTEXT_LIMITS: Record<ImageContext, { maxWidth: number; maxHeight: number; quality: number }> = {
  avatar: { maxWidth: 1200, maxHeight: 1200, quality: 0.82 },
  cover: { maxWidth: 1920, maxHeight: 1080, quality: 0.82 },
  post: { maxWidth: 1920, maxHeight: 1920, quality: 0.82 },
  gallery: { maxWidth: 1920, maxHeight: 1920, quality: 0.82 },
  custom: { maxWidth: 1920, maxHeight: 1920, quality: 0.82 },
};

/**
 * Safely fetches an API route expecting JSON, gracefully catching non-JSON or HTML 500/404 responses.
 * Prevents "Unexpected token 'T', "The page c"... is not valid JSON" crashes.
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const json = await res.json();
      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          data: json,
          error: json.message || json.error || `Erreur serveur (HTTP ${res.status}).`
        };
      }
      return { ok: true, status: res.status, data: json };
    } else {
      const text = await res.text();
      console.warn(`[SAFE FETCH] Non-JSON response from ${url} (HTTP ${res.status}):`, text.slice(0, 150));
      return {
        ok: false,
        status: res.status,
        data: null,
        error: `Erreur serveur (${res.status}). Le serveur n'a pas pu traiter le téléversement.`
      };
    }
  } catch (err: any) {
    console.error(`[SAFE FETCH NETWORK ERROR] ${url}:`, err);
    return {
      ok: false,
      status: 0,
      data: null,
      error: "Erreur de connexion réseau. Veuillez vérifier votre connexion internet."
    };
  }
}

/**
 * Converts HEIC/HEIF images to JPEG if required using heic2any.
 */
async function processHeicIfNeeded(file: File): Promise<File> {
  const isHeic = 
    file.type === "image/heic" || 
    file.type === "image/heif" || 
    file.type === "image/heic-sequence" || 
    file.type === "image/heif-sequence" ||
    /\.(heic|heif)$/i.test(file.name);

  if (!isHeic) return file;

  try {
    const heic2any = (await import("heic2any")).default;
    const resultBlob = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.85
    });
    const blob = Array.isArray(resultBlob) ? resultBlob[0] : resultBlob;
    const newName = file.name.replace(/\.(heic|heif)$/i, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg", lastModified: Date.now() });
  } catch (err) {
    console.warn("[IMAGE OPTIMIZER] HEIC decoding failed on browser canvas:", err);
    throw new Error("Cette photo ne peut pas être préparée automatiquement sur cet appareil. Essayez une autre photo.");
  }
}

/**
 * Checks if a canvas contains transparent pixels (alpha < 250).
 */
function checkTransparency(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    const imgData = ctx.getImageData(0, 0, width, height).data;
    const step = Math.max(1, Math.floor(imgData.length / 4000)); // Sample ~1000 pixels for speed
    for (let i = 3; i < imgData.length; i += step * 4) {
      if (imgData[i] < 250) {
        return true;
      }
    }
  } catch (_) {
    // Canvas security/CORS fallback
  }
  return false;
}

/**
 * Centralized Image Optimizer for AfriGombo.
 * Handles validation, HEIC decoding, aspect-ratio downscaling, transparency preservation, and memory cleanup.
 */
export async function optimizeImage(
  input: File | Blob | string,
  options: ImageOptimizerOptions = {}
): Promise<OptimizedImageResult> {
  const context = options.context || "custom";
  const limits = CONTEXT_LIMITS[context];
  const maxWidth = options.maxWidth || limits.maxWidth;
  const maxHeight = options.maxHeight || limits.maxHeight;
  const quality = options.quality || limits.quality;

  // 1. Prepare File
  let file: File;
  if (typeof input === "string") {
    const res = await fetch(input);
    const blob = await res.blob();
    file = new File([blob], `image_${Date.now()}.jpg`, { type: blob.type || "image/jpeg" });
  } else if (input instanceof File) {
    file = input;
  } else {
    file = new File([input], `image_${Date.now()}.jpg`, { type: input.type || "image/jpeg" });
  }

  // 2. HEIC / HEIF Conversion
  file = await processHeicIfNeeded(file);

  // Skip SVG or non-image types
  if (file.type === "image/svg+xml" || (!file.type.startsWith("image/") && !/\.(jpg|jpeg|png|webp|gif|heic|heif)$/i.test(file.name))) {
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
    return {
      file,
      blob: file,
      base64,
      dataUrl,
      width: 0,
      height: 0,
      originalSize: file.size,
      compressedSize: file.size,
      format: file.type || "image/svg+xml",
      mimeType: file.type || "image/svg+xml"
    };
  }

  // 3. Load into HTML Image with Object URL
  return new Promise<OptimizedImageResult>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
    };

    img.onerror = () => {
      cleanup();
      reject(new Error("Impossible de lire cette photo. Le fichier est peut-être corrompu."));
    };

    img.onload = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Maintain aspect ratio, do NOT upscale if smaller
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) {
        cleanup();
        return reject(new Error("Erreur système lors de l'initialisation du processeur d'image."));
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Determine output format & transparency
      const isPng = file.type === "image/png" || file.name.endsWith(".png");
      const isGif = file.type === "image/gif" || file.name.endsWith(".gif");
      const hasAlpha = isPng && checkTransparency(ctx, width, height);

      let outputFormat = "image/jpeg";
      if (isGif) {
        outputFormat = "image/gif";
      } else if (hasAlpha) {
        outputFormat = "image/png"; // Preserve PNG transparency
      } else if (file.type === "image/webp") {
        outputFormat = "image/webp";
      }

      // If JPEG, fill white background before export
      if (outputFormat === "image/jpeg") {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext("2d");
        if (tempCtx) {
          tempCtx.fillStyle = "#FFFFFF";
          tempCtx.fillRect(0, 0, width, height);
          tempCtx.drawImage(canvas, 0, 0);
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(tempCanvas, 0, 0);
        }
      }

      canvas.toBlob(
        (blob) => {
          cleanup();
          if (!blob) {
            return reject(new Error("Impossible de compresser la photo."));
          }

          const ext = outputFormat === "image/png" ? "png" : outputFormat === "image/webp" ? "webp" : "jpg";
          const cleanName = file.name.replace(/\.[^/.]+$/, "") + `.${ext}`;
          const compressedFile = new File([blob], cleanName, {
            type: outputFormat,
            lastModified: Date.now()
          });

          const dataUrl = canvas.toDataURL(outputFormat, quality);
          const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;

          resolve({
            file: compressedFile,
            blob,
            base64,
            dataUrl,
            width,
            height,
            originalSize: file.size,
            compressedSize: blob.size,
            format: ext,
            mimeType: outputFormat
          });
        },
        outputFormat,
        quality
      );
    };

    img.src = objectUrl;
  });
}

export type ProgressStage = "idle" | "preparing" | "uploading" | "done" | "error";

export interface UploadProgressCallback {
  (stage: ProgressStage, message: string, percentage?: number): void;
}

/**
 * High-level unified image uploader for AfriGombo.
 * Handles optimization -> storage upload -> public URL retrieval.
 */
export async function uploadOptimizedImage(params: {
  file: File | Blob | string;
  context: ImageContext;
  userId: string;
  customPath?: string;
  idToken?: string;
  onProgress?: UploadProgressCallback;
}): Promise<{
  success: boolean;
  url: string;
  path: string;
  error?: string;
}> {
  const { file, context, userId, customPath, idToken, onProgress } = params;

  try {
    // Stage 1: Preparation & Compression
    onProgress?.("preparing", "Préparation de l'image…", 15);

    const optimized = await optimizeImage(file, { context });

    // Stage 2: Uploading
    onProgress?.("uploading", "Téléversement…", 50);

    const ext = optimized.format || "jpg";
    const timestamp = Date.now();

    let storagePath = customPath;
    if (!storagePath) {
      switch (context) {
        case "avatar":
          storagePath = `avatars/${userId}/${timestamp}_avatar.${ext}`;
          break;
        case "cover":
          storagePath = `covers/${userId}/${timestamp}_cover.${ext}`;
          break;
        case "post":
          storagePath = `posts/${userId}/${timestamp}_post.${ext}`;
          break;
        case "gallery":
          storagePath = `gallery/${userId}/${timestamp}_gallery.${ext}`;
          break;
        default:
          storagePath = `media/${userId}/${timestamp}_media.${ext}`;
          break;
      }
    }

    // Attempt direct Supabase upload or API proxy upload
    let finalUrl = "";
    let uploadSuccess = false;

    // Use Supabase Storage client if available
    const { supabaseStorage } = await import("../supabaseStorage");
    if (supabaseStorage.isConfigured()) {
      try {
        const uploadResult = await supabaseStorage.uploadGenericFile(optimized.file, storagePath, {
          userId,
          mediaType: "image",
          onProgress: (pInfo) => {
            if (pInfo.percentage) {
              onProgress?.("uploading", "Téléversement…", 50 + Math.round(pInfo.percentage * 0.45));
            }
          }
        });

        if (uploadResult.success && uploadResult.url) {
          finalUrl = uploadResult.url;
          uploadSuccess = true;
        }
      } catch (sbErr: any) {
        console.warn("[IMAGE OPTIMIZER] Direct Supabase upload failed, checking proxy fallback:", sbErr);
      }
    }

    // Fallback to Express backend proxy if direct failed or ID token provided for avatar/cover
    if (!uploadSuccess && idToken) {
      let endpoint = "/api/user/avatar/upload";
      if (context === "cover") endpoint = "/api/user/cover/upload";

      const res = await safeFetchJson(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          storagePath,
          fileBase64: optimized.base64,
          contentType: optimized.mimeType
        })
      });

      if (res.ok && res.data?.publicUrl) {
        finalUrl = res.data.publicUrl;
        uploadSuccess = true;
      } else {
        throw new Error(res.error || "Le serveur n'a pas pu sauvegarder l'image.");
      }
    }

    if (!uploadSuccess || !finalUrl) {
      throw new Error("Échec du téléversement. Le serveur de stockage est indisponible.");
    }

    onProgress?.("done", "Terminé", 100);

    return {
      success: true,
      url: finalUrl,
      path: storagePath
    };
  } catch (err: any) {
    const errorMessage = err?.message || "Échec du téléversement de l'image.";
    console.error("[UPLOAD OPTIMIZED IMAGE ERROR]", err);
    onProgress?.("error", "Échec du téléversement", 0);
    return {
      success: false,
      url: "",
      path: "",
      error: errorMessage
    };
  }
}
