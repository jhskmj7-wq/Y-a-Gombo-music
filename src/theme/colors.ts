export type Theme = "light" | "imperial" | "system";

export function getTextColor(backgroundHex: string): string {
  if (!backgroundHex) return "#FFFFFF";
  let hex = backgroundHex.replace("#", "");
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  if (hex.length !== 6) return "#FFFFFF";
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 128 ? "#1A1A1A" : "#FFFFFF";
}

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  border: string;
  gold: string;
  error: string;
  success: string;
  warning: string;
}

export const themeColors: Record<"light" | "imperial", ThemeColors> = {
  imperial: {
    background: "#050505",
    surface: "#111111",
    card: "#181818",
    primary: "#D4AF37",
    secondary: "#B9B9B9",
    text: "#FFFFFF",
    textSecondary: "#B9B9B9",
    border: "rgba(212, 175, 55, 0.2)",
    gold: "#D4AF37",
    error: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B"
  },
  light: {
    background: "#FAF7F2", // Ivoire chaleureux principal
    surface: "#FFFFFF",    // Blanc cassé (Cartes, Navbar, Modales)
    card: "#F4EFE6",       // Taupe / Ivoire subtil
    primary: "#D4AF37",    // Gold AFRIGOMBO
    secondary: "#63534B",  // Taupe intermédiaire
    text: "#2C211B",       // Brun profond / Café prestige (lisibilité élevée)
    textSecondary: "#63534B", // Taupe chaud
    border: "#E5DFC5",     // Bordure ivoire dorée
    gold: "#D4AF37",
    error: "#DC2626",
    success: "#16A34A",
    warning: "#D97706"
  }
};
