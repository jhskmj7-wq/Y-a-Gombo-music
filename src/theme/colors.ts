export type Theme = "imperial" | "light" | "royal" | "saphir" | "emeraude" | "studio" | "rouge";

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

export const themeColors: Record<Theme, ThemeColors> = {
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
    background: "#FAF9F6", // Ivory white
    surface: "#F2EFE8",    // Warm gray / Beige menu
    card: "#FFFFFF",       // White cards
    primary: "#D4AF37",    // Gold AFRIGOMBO
    secondary: "#555555",
    text: "#111111",       // Dark charcoal text
    textSecondary: "#666666", // Medium gray
    border: "#DDD8CF",     // Light gray
    gold: "#D4AF37",
    error: "#DC2626",
    success: "#16A34A",
    warning: "#D97706"
  },
  royal: {
    background: "#121008",
    surface: "#1C190F",
    card: "#262215",
    primary: "#D4AF37",
    secondary: "#A28325",
    text: "#FDFBF5",
    textSecondary: "#D4AF37",
    border: "rgba(212, 175, 55, 0.3)",
    gold: "#D4AF37",
    error: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B"
  },
  saphir: {
    background: "#050B15",
    surface: "#0D162B",
    card: "#132140",
    primary: "#3F83F8",
    secondary: "#5A8EF7",
    text: "#F0F4FF",
    textSecondary: "#7FA1FF",
    border: "rgba(63, 131, 248, 0.2)",
    gold: "#3F83F8",
    error: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B"
  },
  emeraude: {
    background: "#051109",
    surface: "#0D1F13",
    card: "#14301D",
    primary: "#10B981",
    secondary: "#4ADE80",
    text: "#F0FFF4",
    textSecondary: "#6EE7B7",
    border: "rgba(16, 185, 129, 0.2)",
    gold: "#10B981",
    error: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B"
  },
  studio: {
    background: "#0F0A15",
    surface: "#181224",
    card: "#221A33",
    primary: "#A855F7",
    secondary: "#C084FC",
    text: "#F3EEFC",
    textSecondary: "#B1A2CA",
    border: "rgba(168, 85, 247, 0.2)",
    gold: "#A855F7",
    error: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B"
  },
  rouge: {
    background: "#110505",
    surface: "#1F0D0D",
    card: "#2F1414",
    primary: "#EF4444",
    secondary: "#F87171",
    text: "#FFF5F5",
    textSecondary: "#F87171",
    border: "rgba(239, 68, 68, 0.2)",
    gold: "#EF4444",
    error: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B"
  }
};
