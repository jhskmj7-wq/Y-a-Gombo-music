import { auth as firebaseAuth } from "../firebase";

export interface StorageProgress {
  percentage: number;
  state: "idle" | "uploading" | "success" | "error";
  error?: string;
  log?: string;
}

export interface R2UploadResult {
  success: boolean;
  url: string;
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
    bucketType: "public" | "private" = "public"
  ): Promise<{ uploadUrl: string; key: string; bucket: string; publicUrl?: string }> {
    const user = firebaseAuth.currentUser;
    if (!user) {
      throw new Error("Utilisateur non authentifié pour l'opération de stockage");
    }

    const idToken = await user.getIdToken();
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
      const errorData = await response.json().catch(() => ({ error: "Erreur serveur" }));
      throw new Error(errorData.error || `Erreur ${response.status} lors de l'obtention de l'URL signée R2`);
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
            onProgress({
              percentage: Math.min(percentage, 95),
              state: "uploading",
              log: `Transfert R2 en cours: ${percentage}%`,
            });
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Échec du transfert vers Cloudflare R2 (statut HTTP ${xhr.status}: ${xhr.statusText})`));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Erreur réseau lors du transfert direct vers Cloudflare R2."));
      };

      xhr.send(file);
    });
  }

  async uploadReelVideo(
    file: File,
    userId: string,
    publicationId: string,
    onProgress?: (progress: StorageProgress) => void
  ): Promise<R2UploadResult> {
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "mp4";
    const mimeType = file.type || "video/mp4";
    const key = `reels/${userId}/${publicationId}_${timestamp}.${extension}`;

    if (onProgress) {
      onProgress({ percentage: 5, state: "uploading", log: "Demande d'autorisation Cloudflare R2..." });
    }

    const { uploadUrl, bucket, publicUrl } = await this.getPresignedUploadUrl(key, mimeType, "public");

    if (onProgress) {
      onProgress({ percentage: 15, state: "uploading", log: "Démarrage du téléversement R2..." });
    }

    await this.uploadDirect(uploadUrl, file, mimeType, onProgress);

    const finalUrl = publicUrl || `https://pub-afrigombo.r2.dev/${key}`;

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
    publicationId: string
  ): Promise<{ url: string; key: string }> {
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "jpg";
    const mimeType = file.type || "image/jpeg";
    const key = `covers/${userId}/${publicationId}_${timestamp}.${extension}`;

    const { uploadUrl, publicUrl } = await this.getPresignedUploadUrl(key, mimeType, "public");
    await this.uploadDirect(uploadUrl, file, mimeType);

    return {
      url: publicUrl || `https://pub-afrigombo.r2.dev/${key}`,
      key,
    };
  }
}

export const r2StorageService = new R2StorageService();
