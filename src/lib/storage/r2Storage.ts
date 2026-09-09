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
      const errorData = await response.json().catch(() => ({ error: `Erreur HTTP ${response.status}` }));
      throw new Error(errorData.error || `Erreur ${response.status} lors de l'obtention de l'URL signée Cloudflare R2`);
    }

    return await response.json();
  }

  async uploadDirect(
    uploadUrl: string,
    file: File | Blob,
    contentType: string,
    onProgress?: (progress: StorageProgress) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
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
              log: `Transfert Cloudflare R2 : ${mbTransferred} Mo / ${mbTotal} Mo (${percentage}%)`,
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
              log: "Vidéo téléversée sur Cloudflare R2 avec succès !",
            });
          }
          resolve();
        } else {
          reject(new Error(`Échec du transfert vers Cloudflare R2 (statut HTTP ${xhr.status}: ${xhr.statusText || "Erreur"})`));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Erreur réseau lors du transfert direct vers Cloudflare R2."));
      };

      xhr.onabort = () => {
        reject(new Error("Téléversement Cloudflare R2 interrompu."));
      };

      xhr.send(file);
    });
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
      onProgress({ percentage: 5, state: "uploading", log: "Demande d'autorisation Cloudflare R2..." });
    }

    const { uploadUrl, bucket, publicUrl } = await this.getPresignedUploadUrl(key, mimeType, "public", explicitIdToken);

    if (onProgress) {
      onProgress({ percentage: 15, state: "uploading", log: "Démarrage du téléversement vers Cloudflare R2..." });
    }

    await this.uploadDirect(uploadUrl, file, mimeType, onProgress);

    const finalUrl = publicUrl || `/api/r2/media/${encodeURIComponent(key)}`;

    return {
      success: true,
      url: finalUrl,
      key,
      storagePath: key,
      bucket: bucket || "afrigombo-public",
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

    const { uploadUrl, publicUrl } = await this.getPresignedUploadUrl(key, mimeType, "public", explicitIdToken);
    await this.uploadDirect(uploadUrl, file, mimeType);

    return {
      url: publicUrl || `/api/r2/media/${encodeURIComponent(key)}`,
      key,
    };
  }
}

export const r2StorageService = new R2StorageService();
