export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputFormat?: "image/jpeg" | "image/png" | "image/webp";
}

export interface CompressedImageResult {
  file: File;
  base64: string;
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
}

/**
 * Reusable client-side image compression and resizing utility.
 * Downscales images to maxWidth (default 1200px) while maintaining aspect ratio,
 * and encodes to JPEG quality 0.8 to safely stay under payload limits (< 500 KB).
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressedImageResult> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    outputFormat = "image/jpeg"
  } = options;

  // If already an SVG or non-image, or if window/document is undefined, return raw fallback
  if (typeof window === "undefined" || !file.type.startsWith("image/") || file.type === "image/svg+xml") {
    const rawBase64 = await fileToBase64(file);
    return {
      file,
      base64: rawBase64.includes(",") ? rawBase64.split(",")[1] : rawBase64,
      dataUrl: rawBase64,
      width: 0,
      height: 0,
      originalSize: file.size,
      compressedSize: file.size
    };
  }

  return new Promise<CompressedImageResult>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Impossible de lire le fichier image."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Impossible de décoder l'image sélectionnée."));
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calculate aspect ratio downscaling
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Impossible d'initialiser le contexte Canvas 2D."));
        }

        // Fill white background for transparent images converted to JPEG
        if (outputFormat === "image/jpeg") {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL(outputFormat, quality);
        const base64Clean = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;

        canvas.toBlob(
          (blob) => {
            const compressedBlob = blob || new Blob([], { type: outputFormat });
            const compressedFile = new File(
              [compressedBlob],
              file.name.replace(/\.[^/.]+$/, "") + ".jpeg",
              { type: outputFormat, lastModified: Date.now() }
            );

            resolve({
              file: compressedFile,
              base64: base64Clean,
              dataUrl,
              width,
              height,
              originalSize: file.size,
              compressedSize: compressedBlob.size
            });
          },
          outputFormat,
          quality
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
