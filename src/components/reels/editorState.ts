export interface VideoTextOverlay {
  id: string;
  text: string;
  color: string;
  bgColor: string;
  fontSize: number; // in px
  isBold: boolean;
  isItalic: boolean;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export interface VideoStickerOverlay {
  id: string;
  emoji: string;
  size: number; // in px
  rotation: number; // degrees
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export interface VideoEditorState {
  filterId: string;
  filterIntensity: number; // 0 to 100
  
  // Adjustments
  brightness: number;  // -100 to 100 (default 0)
  contrast: number;    // -100 to 100 (default 0)
  saturation: number;  // -100 to 100 (default 0)
  temperature: number; // -100 to 100 (default 0)
  hue: number;         // -180 to 180 (default 0)
  fade: number;        // 0 to 100 (default 0)
  shadows: number;     // -100 to 100 (default 0)
  highlights: number;  // -100 to 100 (default 0)
  sepia: number;       // 0 to 100 (default 0)
  vignette: number;    // 0 to 100 (default 0)
  grain: number;       // 0 to 100 (default 0)
  
  // Trim
  trimStart: number;   // seconds
  trimEnd: number;     // seconds
  
  // Speed
  playbackRate: number; // 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3
  
  // Transform
  rotation: number;     // 0, 90, 180, 270
  flipHorizontal: boolean;
  aspectRatio: "9:16" | "4:5" | "1:1" | "16:9";
  
  // Audio
  volume: number;      // 0 to 100
  isMuted: boolean;
  fadeIn: boolean;
  fadeOut: boolean;
  
  // Overlays
  texts: VideoTextOverlay[];
  stickers: VideoStickerOverlay[];
  
  // Effects
  activeEffect: "none" | "glow" | "blur" | "vignette" | "flash" | "shake" | "pulse" | "zoom";
  
  // Cover
  coverTime: number;   // seconds
}

export const INITIAL_EDITOR_STATE: VideoEditorState = {
  filterId: "naturel",
  filterIntensity: 100,
  
  brightness: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  hue: 0,
  fade: 0,
  shadows: 0,
  highlights: 0,
  sepia: 0,
  vignette: 0,
  grain: 0,
  
  trimStart: 0,
  trimEnd: 0,
  
  playbackRate: 1,
  
  rotation: 0,
  flipHorizontal: false,
  aspectRatio: "9:16",
  
  volume: 100,
  isMuted: false,
  fadeIn: false,
  fadeOut: false,
  
  texts: [],
  stickers: [],
  
  activeEffect: "none",
  
  coverTime: 0,
};

export function buildCombinedCssFilter(state: VideoEditorState, baseFilterCss: string): string {
  const parts: string[] = [];
  
  // Base filter with intensity
  if (baseFilterCss && baseFilterCss !== "none") {
    if (state.filterIntensity < 100) {
      parts.push(`opacity(${0.3 + (state.filterIntensity / 100) * 0.7})`);
    } else {
      parts.push(baseFilterCss);
    }
  }
  
  // Brightness: map -100..100 to 0.5..1.5
  if (state.brightness !== 0) {
    const b = 1 + state.brightness / 100;
    parts.push(`brightness(${b.toFixed(2)})`);
  }
  
  // Contrast: map -100..100 to 0.5..1.5
  if (state.contrast !== 0) {
    const c = 1 + state.contrast / 100;
    parts.push(`contrast(${c.toFixed(2)})`);
  }
  
  // Saturation: map -100..100 to 0..2
  if (state.saturation !== 0) {
    const s = 1 + state.saturation / 100;
    parts.push(`saturate(${s.toFixed(2)})`);
  }
  
  // Temperature (simulated via hue-rotate & sepia)
  if (state.temperature !== 0) {
    const hueShift = -state.temperature * 0.15; // warm -> negative hue
    parts.push(`hue-rotate(${hueShift.toFixed(1)}deg)`);
    if (state.temperature > 0) {
      parts.push(`sepia(${(state.temperature * 0.002).toFixed(2)})`);
    }
  }
  
  // Hue rotate direct
  if (state.hue !== 0) {
    parts.push(`hue-rotate(${state.hue}deg)`);
  }
  
  // Sepia direct
  if (state.sepia > 0) {
    parts.push(`sepia(${(state.sepia / 100).toFixed(2)})`);
  }
  
  // Fade (opacity / contrast blend)
  if (state.fade > 0) {
    const fContrast = 1 - (state.fade / 100) * 0.3;
    const fBrightness = 1 + (state.fade / 100) * 0.15;
    parts.push(`contrast(${fContrast.toFixed(2)}) brightness(${fBrightness.toFixed(2)})`);
  }
  
  // Effect overlays via CSS
  if (state.activeEffect === "glow") {
    parts.push("drop-shadow(0 0 12px rgba(212, 175, 55, 0.6))");
  } else if (state.activeEffect === "blur") {
    parts.push("blur(2px)");
  } else if (state.activeEffect === "vignette") {
    parts.push("brightness(0.9) contrast(1.1)");
  }
  
  return parts.length > 0 ? parts.join(" ") : "none";
}
