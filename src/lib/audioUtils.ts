import { supabaseStorage } from "./supabaseStorage";

/**
 * Utilitaire pour normaliser et résoudre les URLs Audio d'AFRIGOMBO ELITE
 * Supporte : Supabase Storage (afrigombo-médias), Firebase Storage, GitHub et URLs distantes.
 */

export const getAudioUrl = (source: string, path: string): string => {
  if (!path) return "";
  
  // URL HTTP/HTTPS complète (Supabase public URL, Firebase download URL, CDN externe)
  if (path.startsWith("http://") || path.startsWith("https://")) {
    if (path.includes("github.com") && path.includes("/blob/")) {
      return path
        .replace("github.com", "raw.githubusercontent.com")
        .replace("/blob/", "/");
    }
    return path;
  }

  // Si c'est un chemin de stockage Supabase (ex: audios/..., audio/...)
  if (path.startsWith("audios/") || path.startsWith("audio/")) {
    return supabaseStorage.getPublicUrl(path);
  }

  // Chemin GitHub ou local historique
  if (source === "GITHUB" || path.startsWith("public/")) {
    const baseUrl = "https://raw.githubusercontent.com/jhskmj7-wq/Y-a-Gombo-music/principal/";
    const cleanPath = path.replace(/^\//, "");
    return encodeURI(baseUrl + cleanPath);
  }

  return path;
};
