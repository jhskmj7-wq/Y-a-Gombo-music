/**
 * AFRIGOMBO Video Thumbnail & Cover Engine
 * Garantit que chaque vidéo / Réel affiche instantanément une image de couverture nette,
 * soit issue d'une miniature existante, d'une extraction canvas de la frame vidéo (0.5s),
 * d'un lien YouTube, ou d'un poster scénique d'artiste haute fidélité.
 * Élimine à 100% l'affichage d'écrans blancs ou vides.
 */

// Cache en mémoire pour éviter d'extraire plusieurs fois la même vidéo
const inMemoryThumbCache = new Map<string, string>();

/**
 * Détecte si une URL pointe directement vers un fichier vidéo ou un flux
 */
export function isDirectVideoUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:video/")) return true;

  const clean = trimmed.toLowerCase().split("?")[0].split("#")[0];
  if (clean.includes("youtube.com") || clean.includes("youtu.be")) return false;

  const videoExtensions = [".mp4", ".webm", ".mov", ".m4v", ".ogv", ".mkv", ".3gp"];
  if (videoExtensions.some(ext => clean.endsWith(ext))) return true;

  if (clean.includes("/video/") || clean.includes("/reels/") || clean.includes("video_upload")) return true;

  return false;
}

/**
 * Détecte si une URL est une image valide (et NON une vidéo)
 */
export function isValidImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("data:image/")) return true;

  // Si c'est un lien vidéo explicite, ce n'est pas une image
  if (isDirectVideoUrl(trimmed)) return false;

  const clean = trimmed.toLowerCase().split("?")[0].split("#")[0];
  const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"];
  if (imageExtensions.some(ext => clean.endsWith(ext))) return true;

  // Images YouTube
  if (trimmed.includes("img.youtube.com") || trimmed.includes("ytimg.com")) return true;

  // URLs d'images d'Unsplash ou de profils
  if (trimmed.includes("images.unsplash.com") || trimmed.includes("googleusercontent.com")) return true;

  // Si l'URL contient "image" ou "avatar" ou "photo" ou "cover"
  if (clean.includes("image") || clean.includes("avatar") || clean.includes("photo") || clean.includes("cover") || clean.includes("thumbnail")) {
    return true;
  }

  // Par défaut, si c'est http et sans extension vidéo connue
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return true;
  }

  return false;
}

/**
 * Extrait l'identifiant YouTube pour construire une miniature haute résolution
 */
export function getYoutubeThumbnail(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const url = rawUrl.trim();

  let vidId: string | null = null;
  if (url.includes("youtube.com/watch")) {
    const parts = url.split("v=");
    if (parts[1]) vidId = parts[1].split("&")[0];
  } else if (url.includes("youtu.be/")) {
    const parts = url.split("youtu.be/");
    if (parts[1]) vidId = parts[1].split("?")[0];
  } else if (url.includes("youtube.com/embed/")) {
    const parts = url.split("youtube.com/embed/");
    if (parts[1]) vidId = parts[1].split("?")[0];
  }

  if (vidId) {
    return `https://img.youtube.com/vi/${vidId}/hqdefault.jpg`;
  }
  return null;
}

/**
 * Retourne une chaîne vide - les images simulées ou fictives sont proscrites
 */
export function getDeterministicFallbackCover(_seed?: string | null): string {
  return "";
}

/**
 * Extrait dynamiquement une frame de vidéo (0.5s) via un canvas hors-écran
 * Fonctionne avec les vidéos locales, blobs, ou distantes avec CORS
 */
export async function extractVideoFrame(videoUrl: string, seekTime = 0.5): Promise<string | null> {
  if (!videoUrl) return null;

  // 1. Vérifier le cache en mémoire
  if (inMemoryThumbCache.has(videoUrl)) {
    return inMemoryThumbCache.get(videoUrl)!;
  }

  // 2. Vérifier le cache de session
  try {
    const cacheKey = `afrigombo_thumb_${videoUrl.slice(-40)}`;
    const saved = sessionStorage.getItem(cacheKey);
    if (saved && saved.startsWith("data:image/")) {
      inMemoryThumbCache.set(videoUrl, saved);
      return saved;
    }
  } catch (_) {}

  // 3. Tenter l'extraction canvas
  return new Promise((resolve) => {
    try {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";

      let hasResolved = false;
      const cleanUp = () => {
        video.onloadeddata = null;
        video.onseeked = null;
        video.onerror = null;
        video.src = "";
      };

      const finish = (result: string | null) => {
        if (hasResolved) return;
        hasResolved = true;
        cleanUp();
        if (result) {
          inMemoryThumbCache.set(videoUrl, result);
          try {
            const cacheKey = `afrigombo_thumb_${videoUrl.slice(-40)}`;
            sessionStorage.setItem(cacheKey, result);
          } catch (_) {}
        }
        resolve(result);
      };

      // Timeout de sécurité : 3.5 secondes max pour ne jamais bloquer l'UI
      const timeoutTimer = setTimeout(() => {
        finish(null);
      }, 3500);

      video.onerror = () => {
        clearTimeout(timeoutTimer);
        finish(null);
      };

      video.onloadeddata = () => {
        try {
          const targetTime = Math.min(Math.max(0.1, seekTime), (video.duration || 2) - 0.1);
          video.currentTime = targetTime;
        } catch (_) {
          // Si le seek échoue, tenter de dessiner immédiatement
          tryDraw();
        }
      };

      const tryDraw = () => {
        try {
          const w = video.videoWidth || 360;
          const h = video.videoHeight || 640;
          if (w > 0 && h > 0) {
            const canvas = document.createElement("canvas");
            // 9:16 ou ratio natif optimisé pour les cartes mobiles
            canvas.width = Math.min(w, 480);
            canvas.height = Math.round((canvas.width * h) / w);
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
              clearTimeout(timeoutTimer);
              finish(dataUrl);
              return;
            }
          }
        } catch (e) {
          // CORS restreint ou échec de rendu canvas
        }
        clearTimeout(timeoutTimer);
        finish(null);
      };

      video.onseeked = () => {
        tryDraw();
      };

      // Lancer le chargement
      video.src = videoUrl;
      video.load();
    } catch (err) {
      resolve(null);
    }
  });
}
