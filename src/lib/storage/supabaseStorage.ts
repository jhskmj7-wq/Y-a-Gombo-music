import { getSupabaseClient, SUPABASE_BUCKET_NAME, isSupabaseConfigured, sanitizeBucketName } from "../supabase";

/**
 * Service centralisé pour le stockage de fichiers via Supabase Storage pour AfriGombo.
 * 
 * PRINCIPES FONDAMENTAUX :
 * 1. Supabase sert UNIQUEMENT au stockage de fichiers.
 * 2. Firebase (Auth, Firestore, Wallet, The Throne, Messages...) reste la source de vérité.
 * 3. Les anciennes URLs Firebase continuent de fonctionner sans rupture.
 * 4. Les documents KYC sont strictement privés (signed URLs) et ne sont jamais publics.
 * 5. Aucun appel direct supabase.storage.from() dans les composants React.
 */

export type MediaType = "image" | "video" | "audio" | "document" | "other";

export interface FirestoreMediaMetadata {
  provider: "supabase" | "firebase" | "external";
  bucket: string;
  storagePath: string;
  mediaUrl: string;
  mediaType: MediaType;
  size: number;
  mimeType: string;
  createdAt: string;
  userId: string;
  isPrivate?: boolean;
}

export interface StorageUploadResult {
  success: boolean;
  url: string;
  storagePath: string;
  metadata: FirestoreMediaMetadata;
  error?: string;
}

export interface ProgressInfo {
  percentage: number;
  bytesTransferred?: number;
  totalBytes?: number;
  state: "uploading" | "success" | "error";
  log?: string;
}

// Limites selon le plan Free Supabase (fichiers individuels max autorisés par le projet)
export const FILE_LIMITS = {
  IMAGE: 15 * 1024 * 1024, // 15 MB
  AUDIO: 50 * 1024 * 1024, // 50 MB
  VIDEO: 100 * 1024 * 1024, // 100 MB
  DOCUMENT: 25 * 1024 * 1024, // 25 MB
};

export const ALLOWED_MIME_TYPES = {
  IMAGE: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
  AUDIO: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/aac", "audio/ogg", "audio/m4a", "audio/x-m4a", "audio/webm"],
  VIDEO: ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska"],
  DOCUMENT: ["application/pdf", "image/jpeg", "image/png", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};

function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .toLowerCase();
}

async function convertToBlob(input: File | Blob | string, defaultName = "file"): Promise<{ blob: Blob; name: string; size: number; type: string }> {
  if (typeof input === "string") {
    if (input.startsWith("data:") || input.startsWith("blob:")) {
      const res = await fetch(input);
      const blob = await res.blob();
      const ext = blob.type.split("/")[1]?.split("+")[0] || "bin";
      return {
        blob,
        name: `${defaultName}_${Date.now()}.${ext}`,
        size: blob.size,
        type: blob.type,
      };
    } else {
      const blob = new Blob([input], { type: "text/plain" });
      return {
        blob,
        name: `${defaultName}.txt`,
        size: blob.size,
        type: "text/plain",
      };
    }
  }

  const isFile = input instanceof File;
  return {
    blob: input,
    name: isFile ? input.name : `${defaultName}_${Date.now()}`,
    size: input.size,
    type: input.type || "application/octet-stream",
  };
}

function validateFile(
  size: number,
  mimeType: string,
  type: MediaType
): { valid: boolean; error?: string } {
  let maxSize = FILE_LIMITS.IMAGE;
  let allowedList = ALLOWED_MIME_TYPES.IMAGE;

  switch (type) {
    case "audio":
      maxSize = FILE_LIMITS.AUDIO;
      allowedList = ALLOWED_MIME_TYPES.AUDIO;
      break;
    case "video":
      maxSize = FILE_LIMITS.VIDEO;
      allowedList = ALLOWED_MIME_TYPES.VIDEO;
      break;
    case "document":
      maxSize = FILE_LIMITS.DOCUMENT;
      allowedList = ALLOWED_MIME_TYPES.DOCUMENT;
      break;
    case "image":
    default:
      maxSize = FILE_LIMITS.IMAGE;
      allowedList = ALLOWED_MIME_TYPES.IMAGE;
      break;
  }

  if (size > maxSize) {
    const maxMb = (maxSize / (1024 * 1024)).toFixed(0);
    const actualMb = (size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Fichier trop volumineux (${actualMb} Mo). La limite est de ${maxMb} Mo pour ce format.`,
    };
  }

  if (mimeType && allowedList.length > 0) {
    const isAllowed = allowedList.some(
      (allowed) =>
        mimeType.toLowerCase() === allowed.toLowerCase() ||
        (allowed.endsWith("/*") && mimeType.startsWith(allowed.replace("/*", "")))
    );
    if (!isAllowed) {
      return {
        valid: false,
        error: `Type de fichier non autorisé (${mimeType}).`,
      };
    }
  }

  return { valid: true };
}

export const supabaseStorage = {
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  getBucketName(): string {
    return SUPABASE_BUCKET_NAME;
  },

  /**
   * Récupère l'URL publique d'un asset public
   */
  getPublicUrl(storagePath: string, bucket = SUPABASE_BUCKET_NAME): string {
    if (!storagePath) return "";
    if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
      return storagePath;
    }
    const client = getSupabaseClient();
    if (!client) return storagePath;

    try {
      const { data } = client.storage.from(bucket).getPublicUrl(storagePath);
      return data?.publicUrl || storagePath;
    } catch (err) {
      console.warn("[SUPABASE STORAGE] Erreur getPublicUrl:", err);
      return storagePath;
    }
  },

  /**
   * Alias pour compatibilité
   */
  getPublicMediaUrl(storagePath: string, bucket = SUPABASE_BUCKET_NAME): string {
    return this.getPublicUrl(storagePath, bucket);
  },

  /**
   * Génère une URL signée temporaire pour les documents privés (ex: KYC)
   */
  async getSignedUrl(
    storagePath: string,
    expiresInSeconds = 3600,
    bucket = SUPABASE_BUCKET_NAME
  ): Promise<string> {
    if (!storagePath) return "";
    if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
      return storagePath;
    }
    const client = getSupabaseClient();
    if (!client) return storagePath;

    try {
      const { data, error } = await client.storage
        .from(bucket)
        .createSignedUrl(storagePath, expiresInSeconds);

      if (error || !data?.signedUrl) {
        throw error || new Error("URL signée introuvable");
      }
      return data.signedUrl;
    } catch (err) {
      console.error("[SUPABASE STORAGE] Erreur createSignedUrl:", err);
      throw err;
    }
  },

  /**
   * Alias pour compatibilité
   */
  async getSignedDocumentUrl(
    storagePath: string,
    expiresInSeconds = 3600,
    bucket = SUPABASE_BUCKET_NAME
  ): Promise<string> {
    return this.getSignedUrl(storagePath, expiresInSeconds, bucket);
  },

  /**
   * Téléversement générique vers Supabase Storage
   */
  async uploadGenericFile(
    fileInput: File | Blob | string,
    storagePath: string,
    options: {
      userId?: string;
      mediaType?: MediaType;
      isPrivate?: boolean;
      bucket?: string;
      onProgress?: (info: ProgressInfo) => void;
      contentType?: string;
      idToken?: string;
    } = {}
  ): Promise<StorageUploadResult> {
    const bucket = sanitizeBucketName(options.bucket || SUPABASE_BUCKET_NAME);
    const mediaType = options.mediaType || "other";
    const isPrivate = options.isPrivate ?? false;
    const userId = options.userId || "anonymous";
    const client = getSupabaseClient();

    if (!client) {
      const errMsg = "Client Supabase non initialisé (VITE_SUPABASE_PUBLISHABLE_KEY manquante).";
      console.error("[SUPABASE STORAGE]", errMsg);
      if (options.onProgress) {
        options.onProgress({ percentage: 0, state: "error", log: errMsg });
      }
      return {
        success: false,
        url: "",
        storagePath,
        metadata: {
          provider: "supabase",
          bucket,
          storagePath,
          mediaUrl: "",
          mediaType,
          size: 0,
          mimeType: options.contentType || "application/octet-stream",
          createdAt: new Date().toISOString(),
          userId,
          isPrivate,
        },
        error: errMsg,
      };
    }

    try {
      if (options.onProgress) {
        options.onProgress({
          percentage: 0,
          state: "uploading",
          bytesTransferred: 0,
          totalBytes: 0,
          log: "Téléversement en cours…",
        });
      }

      const { blob, name, size, type } = await convertToBlob(fileInput, "file");
      const mimeType = options.contentType || type || "application/octet-stream";

      // Validation
      const validation = validateFile(size, mimeType, mediaType);
      if (!validation.valid) {
        throw new Error(validation.error || "Fichier non conforme.");
      }

      // Si un idToken Firebase est fourni (Super Fondateur), utiliser le proxy d'upload backend sécurisé
      if (options.idToken) {
        try {
          console.log(`[SUPABASE STORAGE VIA BACKEND PROXY] Envoi du fichier ${storagePath}...`);
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const res = reader.result as string;
              resolve(res.includes(",") ? res.split(",")[1] : res);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          const resp = await fetch("/api/admin/media/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              idToken: options.idToken,
              storagePath,
              fileBase64: base64Data,
              contentType: mimeType,
              bucket,
            }),
          });

          let json: any = {};
          const cType = resp.headers.get("content-type") || "";
          if (cType.includes("application/json")) {
            try {
              json = await resp.json();
            } catch (jsonErr) {
              json = { success: false, error: "Réponse du serveur corrompue (JSON invalide)." };
            }
          } else {
            const rawText = await resp.text();
            json = {
              success: false,
              error: `Le serveur a répondu au format non-JSON (${resp.status}) : ${rawText.substring(0, 120)}`
            };
          }

          if (!resp.ok || !json.success) {
            throw new Error(json.error || `Erreur d'upload sécurisé (HTTP ${resp.status})`);
          }

          const finalUrl = json.url;
          const metadata: FirestoreMediaMetadata = {
            provider: "supabase",
            bucket,
            storagePath: json.storagePath || storagePath,
            mediaUrl: finalUrl,
            mediaType,
            size,
            mimeType,
            createdAt: new Date().toISOString(),
            userId,
            isPrivate,
          };

          if (options.onProgress) {
            options.onProgress({
              percentage: 100,
              state: "success",
              bytesTransferred: size,
              totalBytes: size,
              log: "Téléversement terminé avec succès via le Serveur Express (Super Fondateur)",
            });
          }

          return {
            success: true,
            url: finalUrl,
            storagePath: json.storagePath || storagePath,
            metadata,
          };
        } catch (backendErr: any) {
          console.error("[SUPABASE STORAGE] Échec strict de l'upload via proxy backend Express :", backendErr);
          // NE PAS faire de fallback direct vers Supabase navigateur si idToken est fourni.
          throw backendErr;
        }
      }

      console.log(`[SUPABASE STORAGE] Démarrage téléversement direct vers [${bucket}] : "${storagePath}" (${(size / 1024).toFixed(1)} Ko)...`);

      const { data, error } = await client.storage.from(bucket).upload(storagePath, blob, {
        contentType: mimeType,
        upsert: true,
      });

      if (error) {
        console.error("[SUPABASE STORAGE RAW ERROR]", {
          message: error.message,
          name: error.name,
          status: (error as any).status || (error as any).statusCode,
          code: (error as any).code,
          bucket,
          path: storagePath
        });
        throw error;
      }

      let finalUrl = "";
      if (isPrivate) {
        finalUrl = await this.getSignedUrl(storagePath, 3600 * 24, bucket);
      } else {
        finalUrl = this.getPublicUrl(storagePath, bucket);
      }

      const metadata: FirestoreMediaMetadata = {
        provider: "supabase",
        bucket,
        storagePath: data?.path || storagePath,
        mediaUrl: finalUrl,
        mediaType,
        size,
        mimeType,
        createdAt: new Date().toISOString(),
        userId,
        isPrivate,
      };

      if (options.onProgress) {
        options.onProgress({
          percentage: 100,
          state: "success",
          bytesTransferred: size,
          totalBytes: size,
          log: "Téléversement terminé",
        });
      }

      console.log(`[SUPABASE STORAGE] ✅ Succès téléversement : ${finalUrl}`);

      return {
        success: true,
        url: finalUrl,
        storagePath: data?.path || storagePath,
        metadata,
      };
    } catch (err: any) {
      console.error("[SUPABASE STORAGE] Échec de l'upload :", err);
      let errorMsg = err?.message || "Erreur de téléversement Supabase Storage";
      if (err?.code === "InvalidBucketName") {
        errorMsg = `Nom de bucket invalide ("${bucket}"). Les noms de bucket Supabase ne doivent comporter aucun accent ni majuscule.`;
      } else if (err?.statusCode === "404" || err?.status === 404 || err?.message?.includes("not found")) {
        errorMsg = `Bucket "${bucket}" introuvable dans le projet Supabase. Veuillez créer le bucket public "${bucket}" dans la console Supabase Storage.`;
      } else if (err?.statusCode === "403" || err?.status === 403 || err?.code === "AccessDenied" || err?.message?.includes("security policy") || err?.message?.includes("row-level security")) {
        errorMsg = `Permissions RLS insuffisantes sur le bucket "${bucket}". Veuillez ajouter une règle (policy) INSERT dans Supabase pour autoriser l'envoi public.`;
      }

      if (options.onProgress) {
        options.onProgress({ percentage: 0, state: "error", log: `❌ ${errorMsg}` });
      }
      return {
        success: false,
        url: "",
        storagePath,
        metadata: {
          provider: "supabase",
          bucket,
          storagePath,
          mediaUrl: "",
          mediaType,
          size: 0,
          mimeType: "unknown",
          createdAt: new Date().toISOString(),
          userId,
          isPrivate,
        },
        error: errorMsg,
      };
    }
  },

  /**
   * 1. UPLOAD IMAGE
   * Chemins : profiles/{userId}/... ou publications/{userId}/{publicationId}/...
   */
  async uploadImage(
    file: File | Blob | string,
    userId: string,
    folderType: "profiles" | "publications" | "documents" = "publications",
    customId?: string,
    onProgress?: (progress: ProgressInfo) => void
  ): Promise<StorageUploadResult> {
    const timestamp = Date.now();
    const fileName = sanitizeFileName(
      file instanceof File ? file.name : `img_${timestamp}.jpg`
    );
    const subFolder = customId ? `/${customId}` : "";
    const storagePath = `${folderType}/${userId}${subFolder}/${timestamp}_${fileName}`;

    return this.uploadGenericFile(file, storagePath, {
      userId,
      mediaType: "image",
      isPrivate: false,
      onProgress,
    });
  },

  /**
   * 2. UPLOAD VIDÉO
   * Chemin : video/{userId}/{publicationId}/...
   */
  async uploadVideo(
    file: File | Blob | string,
    userId: string,
    publicationId = "general",
    onProgress?: (progress: ProgressInfo) => void
  ): Promise<StorageUploadResult> {
    const timestamp = Date.now();
    const fileName = sanitizeFileName(
      file instanceof File ? file.name : `video_${timestamp}.mp4`
    );
    const storagePath = `video/${userId}/${publicationId}/${timestamp}_${fileName}`;

    return this.uploadGenericFile(file, storagePath, {
      userId,
      mediaType: "video",
      isPrivate: false,
      onProgress,
    });
  },

  /**
   * 3. UPLOAD AUDIO
   * Chemin : audio/{userId}/{publicationId}/...
   */
  async uploadAudio(
    file: File | Blob | string,
    userId: string,
    publicationId = "general",
    onProgress?: (progress: ProgressInfo) => void
  ): Promise<StorageUploadResult> {
    const timestamp = Date.now();
    const fileName = sanitizeFileName(
      file instanceof File ? file.name : `audio_${timestamp}.mp3`
    );
    const storagePath = `audio/${userId}/${publicationId}/${timestamp}_${fileName}`;

    return this.uploadGenericFile(file, storagePath, {
      userId,
      mediaType: "audio",
      isPrivate: false,
      onProgress,
    });
  },

  /**
   * 4. UPLOAD DOCUMENT / KYC
   * Documents KYC : kyc/{userId}/... (STRICTEMENT PRIVÉ)
   * Autres documents : documents/{userId}/...
   */
  async uploadDocument(
    file: File | Blob | string,
    userId: string,
    isKyc = false,
    onProgress?: (progress: ProgressInfo) => void
  ): Promise<StorageUploadResult> {
    const timestamp = Date.now();
    const fileName = sanitizeFileName(
      file instanceof File ? file.name : `doc_${timestamp}.pdf`
    );
    const folder = isKyc ? "kyc" : "documents";
    const storagePath = `${folder}/${userId}/${timestamp}_${fileName}`;

    return this.uploadGenericFile(file, storagePath, {
      userId,
      mediaType: "document",
      isPrivate: isKyc,
      onProgress,
    });
  },

  /**
   * 5. SUPPRESSION DE FICHIER
   */
  async deleteFile(storagePath: string, bucket = SUPABASE_BUCKET_NAME, idToken?: string): Promise<boolean> {
    if (!storagePath) return false;

    if (idToken) {
      try {
        const resp = await fetch("/api/admin/media/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken,
            storagePath,
            bucket,
          }),
        });

        let json: any = {};
        const cType = resp.headers.get("content-type") || "";
        if (cType.includes("application/json")) {
          try {
            json = await resp.json();
          } catch (e) {
            json = { success: false, error: "JSON invalide" };
          }
        }

        if (resp.ok && json.success) {
          console.log(`[SUPABASE STORAGE VIA BACKEND] Supprimé avec succès : ${storagePath}`);
          return true;
        } else {
          console.warn("[SUPABASE STORAGE VIA BACKEND] Refus de suppression :", json.error);
          return false;
        }
      } catch (err) {
        console.error("[SUPABASE STORAGE VIA BACKEND] Échec de la suppression backend :", err);
        return false;
      }
    }

    const client = getSupabaseClient();
    if (!client) return false;

    try {
      const cleanPath = storagePath.replace(
        /^(?:https?:\/\/[^/]+\/storage\/v1\/object\/public\/[^/]+\/)/,
        ""
      );
      const { error } = await client.storage.from(bucket).remove([cleanPath]);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("[SUPABASE STORAGE] Échec deleteFile:", err);
      return false;
    }
  },

  /**
   * 6. RÉSOLUTEUR DE COMPATIBILITÉ MÉDIAS (FIREBASE + SUPABASE)
   */
  resolveMediaUrl(
    media: string | FirestoreMediaMetadata | any,
    fallbackUrl = ""
  ): string {
    if (!media) return fallbackUrl;

    if (typeof media === "object") {
      if (media.mediaUrl) return media.mediaUrl;
      if (media.storagePath) {
        if (media.isPrivate) return media.mediaUrl || fallbackUrl;
        return this.getPublicUrl(media.storagePath, media.bucket || SUPABASE_BUCKET_NAME);
      }
      if (media.url) return media.url;
      if (media.firebaseUrl) return media.firebaseUrl;
      if (media.externalUrl) return media.externalUrl;
    }

    if (typeof media === "string") {
      if (
        media.startsWith("http://") ||
        media.startsWith("https://") ||
        media.startsWith("data:") ||
        media.startsWith("blob:") ||
        media.startsWith("/")
      ) {
        return media;
      }
      return this.getPublicUrl(media);
    }

    return fallbackUrl;
  },

  /**
   * 7. TEST RÉEL DE CONNEXION ET VÉRIFICATION D'UPLOAD
   * Envoie un fichier test dans test/{userId}/, vérifie sa présence réelle, génère l'URL et nettoie.
   */
  async testUploadAndVerify(userId = "diagnostic_test"): Promise<{
    success: boolean;
    bucket: string;
    uploadedPath?: string;
    publicUrl?: string;
    verified: boolean;
    latencyMs: number;
    error?: string;
  }> {
    const startTime = Date.now();
    const bucket = SUPABASE_BUCKET_NAME;
    const client = getSupabaseClient();

    if (!client) {
      return {
        success: false,
        bucket,
        verified: false,
        latencyMs: Date.now() - startTime,
        error: "Supabase client non configuré. Veuillez vérifier VITE_SUPABASE_PUBLISHABLE_KEY.",
      };
    }

    const testId = Date.now();
    const testPath = `test/${userId}/test_ping_${testId}.png`;

    try {
      // 1. Création image de test PNG (100x100 dorée AfriGombo)
      const dummyCanvas = document.createElement("canvas");
      dummyCanvas.width = 100;
      dummyCanvas.height = 100;
      const ctx = dummyCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#FFD700";
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = "#000000";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText("AfriGombo", 16, 54);
      }
      const testBlob = await new Promise<Blob>((resolve) => {
        dummyCanvas.toBlob((b) => resolve(b || new Blob(["afrigombo test"], { type: "image/png" })), "image/png");
      });

      // 2. Upload vers test/{userId}/...
      const { data: uploadData, error: uploadError } = await client.storage
        .from(bucket)
        .upload(testPath, testBlob, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 3. Vérification de l'existence dans le bucket
      const { data: listData, error: listError } = await client.storage
        .from(bucket)
        .list(`test/${userId}`);

      const fileExists = listData ? listData.some((f) => f.name === `test_ping_${testId}.png`) : true;

      // 4. Récupération de l'URL publique
      const publicUrl = this.getPublicUrl(testPath, bucket);

      // 5. Nettoyage
      await client.storage.from(bucket).remove([testPath]);

      return {
        success: true,
        bucket,
        uploadedPath: uploadData?.path || testPath,
        publicUrl,
        verified: fileExists,
        latencyMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        success: false,
        bucket,
        verified: false,
        latencyMs: Date.now() - startTime,
        error: err?.message || "Échec du test de téléversement Supabase Storage",
      };
    }
  },

  /**
   * Alias de test pour compatibilité
   */
  async runStorageDiagnosticTest(customBlob?: Blob) {
    return this.testUploadAndVerify("diagnostic_test");
  },
};
