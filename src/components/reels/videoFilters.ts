export interface VideoFilter {
  id: string;
  name: string;
  filterCss: string;
}

export const REEL_VIDEO_FILTERS: VideoFilter[] = [
  { id: "naturel", name: "Naturel", filterCss: "none" },
  { id: "gold_afrigombo", name: "Gold AfriGombo", filterCss: "sepia(0.3) contrast(1.1) brightness(1.05) saturate(1.3) hue-rotate(-10deg)" },
  { id: "vintage_concert", name: "Vintage Concert", filterCss: "sepia(0.5) contrast(1.2) brightness(0.9) saturate(0.8)" },
  { id: "noir_blanc", name: "Noir & Blanc Studio", filterCss: "grayscale(1) contrast(1.25) brightness(1.05)" },
  { id: "vibrant_pop", name: "Vibrant Pop", filterCss: "saturate(1.8) contrast(1.15) brightness(1.05)" },
  { id: "warm_sunset", name: "Warm Sunset", filterCss: "sepia(0.4) saturate(1.4) hue-rotate(-20deg) contrast(1.1)" },
];

export function getFilterCss(filterId?: string): string {
  if (!filterId || filterId === "none" || filterId === "normal" || filterId === "naturel") {
    return "none";
  }
  const found = REEL_VIDEO_FILTERS.find((f) => f.id === filterId);
  return found ? found.filterCss : "none";
}
