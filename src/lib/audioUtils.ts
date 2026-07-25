/**
 * Utility to normalize audio URLs for AFRIGOMBO ELITE
 */

export const getAudioUrl = (source: string, path: string): string => {
  if (!path) return "";
  
  // Already valid URL
  if (path.startsWith("http")) {
    // Handle GitHub blob URL
    if (path.includes("github.com") && path.includes("/blob/")) {
      return path
        .replace("github.com", "raw.githubusercontent.com")
        .replace("/blob/", "/");
    }
    return path;
  }

  // GitHub path or local path
  if (source === "GITHUB" || path.startsWith("public/") || path.startsWith("audio/")) {
    const baseUrl = "https://raw.githubusercontent.com/jhskmj7-wq/Y-a-Gombo-music/principal/";
    // Remove leading slash if exists
    const cleanPath = path.replace(/^\//, "");
    return encodeURI(baseUrl + cleanPath);
  }

  return path;
};
