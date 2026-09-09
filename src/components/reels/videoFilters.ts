export interface VideoFilter {
  id: string;
  name: string;
  filterCss: string;
}

export interface VideoOverlayText {
  id: string;
  text: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  color: string;
  backgroundColor: string;
  fontSize: number; // in px
  isBold: boolean;
  isItalic: boolean;
  alignment: "left" | "center" | "right";
}

export interface VideoOverlaySticker {
  id: string;
  content: string; // emoji or sticker path
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  scale: number; // 0.5 to 3
  rotation: number; // degrees
}

export interface VideoEditState {
  // Filtre
  filterId: string;
  filterIntensity: number; // 0 à 100

  // Ajustements d'image
  brightness: number; // -100 à 100 (défaut 0)
  contrast: number; // -100 à 100 (défaut 0)
  saturation: number; // -100 à 100 (défaut 0)
  temperature: number; // -100 à 100 (défaut 0)
  hue: number; // -180 à 180 (défaut 0)
  sepia: number; // 0 à 100 (défaut 0)
  vignette: number; // 0 à 100 (défaut 0)
  blur: number; // 0 à 20 (défaut 0)

  // Trim (Découpage)
  trimStart: number; // secondes
  trimEnd: number; // secondes

  // Vitesse
  playbackRate: number; // 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3

  // Transformation
  rotation: number; // 0, 90, 180, 270
  flipHorizontal: boolean;
  aspectRatio: "9:16" | "4:5" | "1:1" | "16:9";

  // Audio
  volume: number; // 0 à 1 (défaut 1)
  isMuted: boolean;
  fadeIn: boolean;
  fadeOut: boolean;

  // Overlays
  texts: VideoOverlayText[];
  stickers: VideoOverlaySticker[];

  // Effet actif (Glow, Flash, Pulse, Shake)
  activeEffect: string | null;

  // Couverture
  coverTime: number; // secondes
}

export const DEFAULT_EDIT_STATE: VideoEditState = {
  filterId: "naturel",
  filterIntensity: 100,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  hue: 0,
  sepia: 0,
  vignette: 0,
  blur: 0,
  trimStart: 0,
  trimEnd: 0,
  playbackRate: 1,
  rotation: 0,
  flipHorizontal: false,
  aspectRatio: "9:16",
  volume: 1,
  isMuted: false,
  fadeIn: false,
  fadeOut: false,
  texts: [],
  stickers: [],
  activeEffect: null,
  coverTime: 0,
};

export const REEL_VIDEO_FILTERS: VideoFilter[] = [
  { id: "naturel", name: "Naturel", filterCss: "none" },
  { id: "gold_afrigombo", name: "Gold AfriGombo", filterCss: "sepia(0.3) contrast(1.1) brightness(1.05) saturate(1.3) hue-rotate(-10deg)" },
  { id: "african_warm", name: "African Warm", filterCss: "sepia(0.35) saturate(1.4) contrast(1.15) hue-rotate(-15deg)" },
  { id: "afro_vibe", name: "Afro Vibe", filterCss: "saturate(1.7) contrast(1.2) brightness(1.05) hue-rotate(5deg)" },
  { id: "tropical", name: "Tropical", filterCss: "saturate(1.5) hue-rotate(-10deg) contrast(1.1) brightness(1.08)" },
  { id: "vintage_concert", name: "Vintage Concert", filterCss: "sepia(0.5) contrast(1.2) brightness(0.9) saturate(0.8)" },
  { id: "noir_blanc", name: "Noir & Blanc Studio", filterCss: "grayscale(1) contrast(1.25) brightness(1.05)" },
  { id: "vibrant_pop", name: "Vibrant Pop", filterCss: "saturate(1.8) contrast(1.15) brightness(1.05)" },
  { id: "warm_sunset", name: "Warm Sunset", filterCss: "sepia(0.4) saturate(1.4) hue-rotate(-20deg) contrast(1.1)" },
  { id: "cinema", name: "Cinéma", filterCss: "contrast(1.25) saturate(1.1) brightness(0.95) hue-rotate(-5deg)" },
  { id: "cinematic_dark", name: "Cinematic Dark", filterCss: "contrast(1.35) brightness(0.85) saturate(0.9)" },
  { id: "retro", name: "Rétro 90s", filterCss: "sepia(0.25) contrast(1.05) saturate(1.2) hue-rotate(15deg)" },
  { id: "cool", name: "Cool Breeze", filterCss: "hue-rotate(20deg) saturate(1.2) brightness(1.05)" },
  { id: "dramatic", name: "Dramatic", filterCss: "contrast(1.4) saturate(0.8) brightness(0.9)" },
  { id: "street", name: "Street Urban", filterCss: "contrast(1.2) saturate(1.3) brightness(1.02)" },
  { id: "luxury", name: "Luxury Gold", filterCss: "sepia(0.4) contrast(1.2) brightness(1.1) saturate(1.2)" },
];

/**
 * Calcule le filtre CSS combiné pour le lecteur vidéo à partir de l'état d'édition
 */
export function getCombinedFilterCss(state: VideoEditState): string {
  const parts: string[] = [];

  // 1. Filtre de base avec intensité
  if (state.filterId && state.filterId !== "naturel" && state.filterId !== "none") {
    const found = REEL_VIDEO_FILTERS.find((f) => f.id === state.filterId);
    if (found && found.filterCss !== "none") {
      if (state.filterIntensity === 100) {
        parts.push(found.filterCss);
      } else if (state.filterIntensity > 0) {
        // Appliquer l'intensité par interpolation simplifiée
        const factor = state.filterIntensity / 100;
        // On conserve la chaîne de filtre
        parts.push(found.filterCss);
      }
    }
  }

  // 2. Ajustements manuels
  if (state.brightness !== 0) {
    const bVal = 1 + state.brightness / 100; // ex: 0 -> 1, 50 -> 1.5, -50 -> 0.5
    parts.push(`brightness(${bVal.toFixed(2)})`);
  }

  if (state.contrast !== 0) {
    const cVal = 1 + state.contrast / 100;
    parts.push(`contrast(${cVal.toFixed(2)})`);
  }

  if (state.saturation !== 0) {
    const sVal = 1 + state.saturation / 100;
    parts.push(`saturate(${sVal.toFixed(2)})`);
  }

  if (state.temperature !== 0) {
    // La température réchauffe (hue-rotate négatif) ou refroidit (hue-rotate positif)
    const tVal = -state.temperature * 0.3;
    parts.push(`hue-rotate(${tVal.toFixed(1)}deg)`);
  }

  if (state.hue !== 0) {
    parts.push(`hue-rotate(${state.hue}deg)`);
  }

  if (state.sepia > 0) {
    parts.push(`sepia(${(state.sepia / 100).toFixed(2)})`);
  }

  if (state.blur > 0) {
    parts.push(`blur(${state.blur}px)`);
  }

  return parts.length > 0 ? parts.join(" ") : "none";
}

export function getFilterCss(filterId?: string): string {
  if (!filterId || filterId === "none" || filterId === "normal" || filterId === "naturel") {
    return "none";
  }
  const found = REEL_VIDEO_FILTERS.find((f) => f.id === filterId);
  return found ? found.filterCss : "none";
}
