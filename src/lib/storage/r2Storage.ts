import { auth as firebaseAuth } from "../firebase";

export interface StorageProgress {
  percentage: number;
  state: "idle" | "uploading" | "success" | "error";
  error?: string;
  log?: string;
}

export interface R2UploadResult {
  success: boolean;
  url?: string;
  key: string;
  storagePath: string;
  bucket: string;
  contentType: string;
  fileSize: number;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      resolve(res);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export class R2StorageService {
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    bucketType: "public" | "private" = "public",
    explicitIdToken?: string
  ): Promise<{ uploadUrl: string; key: string; bucket: string; publicUrl?: string }> {
    let idToken = explicitIdToken;
    if (!idToken) {
      const user = firebaseAuth.currentUser;
      if (user) {
        try {
          idToken = await user.getIdToken();
        } catch (_) {}
      }
    }

    if (!idToken) {
      throw new Error("Authentification requise pour le téléversement Cloudflare R2 (jeton manquant)");
    }

    const response = await fetch("/api/r2/presigned-upload-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        key,
        contentType,
        bucketType,
      }),
    });

    if (!response.ok) {
      let errorMessage = `Erreur HTTP ${response.status}`;
      try {
        const text = await response.text();
        try {
          const json = JSON.parse(text);
          if (json.error) errorMessage = json.error;
          else if (json.message) errorMessage = json.message;
        } catch (_) {
          if (text && text.trim().length > 0 && text.trim().length < 300 && !text.includes("<!DOCTYPE")) {
            errorMessage = text.trim();
          }
        }
      } catch (_) {}
      throw new Error(errorMessage);
    }

    return await response.json();
  }

  async uploadDirect(
    uploadUrl: string,
    file: File | Blob,
    contentType: string,
    onProgress?: (progress: StorageProgress) => void,
    maxRetries = 2
  ): Promise<void> {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadUrl, true);
          xhr.setRequestHeader("Content-Type", contentType);

          if (xhr.upload && onProgress) {
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const percentage = Math.round((event.loaded / event.total) * 100);
                const mbTransferred = (event.loaded / 1024 / 1024).toFixed(1);
                const mbTotal = (event.total / 1024 / 1024).toFixed(1);
                onProgress({
                  percentage: Math.min(percentage, 95),
                  state: "uploading",
                  log: `Transfert R2 : ${mbTransferred} Mo / ${mbTotal} Mo (${percentage}%)`,
                });
              }
            };
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              if (onProgress) {
                onProgress({
                  percentage: 100,
                  state: "success",
                  log: "Vidéo téléversée avec succès !",
                });
              }
              resolve();
            } else {
              reject(new Error(`HTTP ${xhr.status} (${xhr.statusText || "Erreur"})`));
            }
          };

          xhr.onerror = () => {
            reject(new Error("Erreur réseau ou restriction de transfert R2"));
          };

          xhr.onabort = () => {
            reject(new Error("Téléversement interrompu"));
          };

          xhr.send(file);
        });
        return;
      } catch (err: any) {
        attempt++;
        if (attempt <= maxRetries) {
          if (onProgress) {
            onProgress({
              percentage: 30,
              state: "uploading",
              log: `Connexion instable : nouvelle tentative (${attempt}/${maxRetries})...`,
            });
          }
          await new Promise((r) => setTimeout(r, 1500 * attempt));
        } else {
          throw err;
        }
      }
    }
  }

  async uploadViaProxy(
    key: string,
    file: File | Blob,
    contentType: string,
    bucketType: "public" | "private" = "public",
    onProgress?: (progress: StorageProgress) => void,
    explicitIdToken?: string
  ): Promise<{ key: string; bucket: string; publicUrl?: string }> {
    if (onProgress) {
      onProgress({
        percentage: 45,
        state: "uploading",
        log: "Optimisation du transfert via le canal serveur sécurisé...",
      });
    }

    let idToken = explicitIdToken;
    if (!idToken) {
      const user = firebaseAuth.currentUser;
      if (user) {
        try {
          idToken = await user.getIdToken();
        } catch (_) {}
      }
    }

    const base64Data = await blobToBase64(file);

    if (onProgress) {
      onProgress({
        percentage: 75,
        state: "uploading",
        log: "Enregistrement haute disponibilité en cours...",
      });
    }

    const res = await fetch("/api/r2/proxy-upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({
        key,
        contentType,
        bucketType,
        base64Data,
        idToken,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      let errMsg = "Erreur proxy upload";
      try {
        const json = JSON.parse(errText);
        if (json.error) errMsg = json.error;
      } catch (_) {}
      throw new Error(errMsg);
    }

    const data = await res.json();
    if (onProgress) {
      onProgress({
        percentage: 100,
        state: "success",
        log: "Vidéo enregistrée avec succès !",
      });
    }
    return data;
  }

  async uploadReelVideo(
    file: File | Blob,
    userId: string,
    publicationId: string,
    onProgress?: (progress: StorageProgress) => void,
    explicitIdToken?: string
  ): Promise<R2UploadResult> {
    const timestamp = Date.now();
    const isFile = file instanceof File;
    const originalName = isFile ? file.name : "reel.mp4";
    const extension = originalName.split(".").pop() || "mp4";
    const mimeType = file.type || "video/mp4";
    const key = `reels/${userId}/${publicationId}_${timestamp}.${extension}`;

    if (onProgress) {
      onProgress({ percentage: 5, state: "uploading", log: "Initialisation du transfert vidéo..." });
    }

    let presignedData: { uploadUrl: string; bucket: string; publicUrl?: string } | null = null;
    try {
      presignedData = await this.getPresignedUploadUrl(key, mimeType, "public", explicitIdToken);
    } catch (e: any) {
      console.warn("[R2 Storage] Presigned URL bypass, using direct resilient proxy channel:", e.message);
    }

    let publicUrl = presignedData?.publicUrl;
    let bucket = presignedData?.bucket || "afrigombo-public";

    if (presignedData?.uploadUrl) {
      try {
        if (onProgress) {
          onProgress({ percentage: 15, state: "uploading", log: "Transfert vidéo vers Cloudflare R2..." });
        }
        await this.uploadDirect(presignedData.uploadUrl, file, mimeType, onProgress);
      } catch (directErr: any) {
        console.warn("[R2 Storage] Transfert direct non complété, activation automatique du canal serveur relais:", directErr.message);
        const proxyRes = await this.uploadViaProxy(key, file, mimeType, "public", onProgress, explicitIdToken);
        if (proxyRes.publicUrl) publicUrl = proxyRes.publicUrl;
        if (proxyRes.bucket) bucket = proxyRes.bucket;
      }
    } else {
      const proxyRes = await this.uploadViaProxy(key, file, mimeType, "public", onProgress, explicitIdToken);
      if (proxyRes.publicUrl) publicUrl = proxyRes.publicUrl;
      if (proxyRes.bucket) bucket = proxyRes.bucket;
    }

    const finalUrl = publicUrl || `/api/r2/media/${encodeURIComponent(key)}`;

    return {
      success: true,
      url: finalUrl,
      key,
      storagePath: key,
      bucket,
      contentType: mimeType,
      fileSize: file.size,
    };
  }

  async uploadImage(
    file: File,
    userId: string,
    publicationId: string,
    explicitIdToken?: string
  ): Promise<{ url?: string; key: string }> {
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "jpg";
    const mimeType = file.type || "image/jpeg";
    const key = `covers/${userId}/${publicationId}_${timestamp}.${extension}`;

    try {
      const { uploadUrl, publicUrl } = await this.getPresignedUploadUrl(key, mimeType, "public", explicitIdToken);
      await this.uploadDirect(uploadUrl, file, mimeType);
      return {
        url: publicUrl || `/api/r2/media/${encodeURIComponent(key)}`,
        key,
      };
    } catch (_) {
      const proxyRes = await this.uploadViaProxy(key, file, mimeType, "public", undefined, explicitIdToken);
      return {
        url: proxyRes.publicUrl || `/api/r2/media/${encodeURIComponent(key)}`,
        key,
      };
    }
  }
}

export const r2StorageService = new R2StorageService();
