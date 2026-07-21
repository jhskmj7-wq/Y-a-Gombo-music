import React, { createContext, useContext, useEffect, useState } from "react";
import { globalAudioManager } from "../lib/audioManager";
import { useAuth } from "../AuthContext";
import { gomboDB } from "../firebase";

export type Theme = "imperial" | "light" | "royal" | "saphir" | "emeraude" | "studio" | "rouge";
type TextSize = "petit" | "moyen" | "grand";

const safeGetItem = (key: string, fallback: string): string => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch (e) {
    return fallback;
  }
};

const safeSetItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    // ignore
  }
};

export const themeColors: Record<Theme, { bg: string; bgSec: string; bgTer?: string; text: string; textSec: string; textMuted?: string; border: string; gold: string }> = {
  imperial: {
    bg: "#050505",
    bgSec: "#111111",
    text: "#FFFFFF",
    textSec: "#B9B9B9",
    border: "rgba(212, 175, 55, 0.2)",
    gold: "#D4AF37"
  },
  light: {
    bg: "#F8F6F2",
    bgSec: "#ECE8E1",
    bgTer: "#FFFFFF",
    text: "#222222",
    textSec: "#666666",
    textMuted: "#666666",
    border: "#DDD8CF",
    gold: "#D4AF37"
  },
  royal: {
    bg: "#121008",
    bgSec: "#1C190F",
    text: "#FDFBF5",
    textSec: "#D4AF37",
    border: "rgba(212, 175, 55, 0.3)",
    gold: "#D4AF37"
  },
  saphir: {
    bg: "#050B15",
    bgSec: "#0D162B",
    text: "#F0F4FF",
    textSec: "#7FA1FF",
    border: "rgba(63, 131, 248, 0.2)",
    gold: "#3F83F8"
  },
  emeraude: {
    bg: "#051109",
    bgSec: "#0D1F13",
    text: "#F0FFF4",
    textSec: "#6EE7B7",
    border: "rgba(16, 185, 129, 0.2)",
    gold: "#10B981"
  },
  studio: {
    bg: "#0F0A15",
    bgSec: "#181224",
    text: "#F3EEFC",
    textSec: "#B1A2CA",
    border: "rgba(168, 85, 247, 0.2)",
    gold: "#A855F7"
  },
  rouge: {
    bg: "#110505",
    bgSec: "#1F0D0D",
    text: "#FFF5F5",
    textSec: "#F87171",
    border: "rgba(239, 68, 68, 0.2)",
    gold: "#EF4444"
  }
};

interface ThemeContextType {
  theme: Theme;
  colors: typeof themeColors.imperial;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  textSize: TextSize;
  setTextSize: (s: TextSize) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (val: boolean) => void;
  musicEnabled: boolean;
  setMusicEnabled: (val: boolean) => void;
  soundsEnabled: boolean;
  setSoundsEnabled: (val: boolean) => void;
  vibrationsEnabled: boolean;
  setVibrationsEnabled: (val: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, profile } = useAuth() || {};

  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = safeGetItem("gombo_theme", "imperial");
      if (stored === "dark") return "imperial";
      if (["imperial", "light", "nuit", "elite", "studio", "nature"].includes(stored)) {
        return stored as Theme;
      }
    }
    return "imperial";
  });

  const [textSize, setTextSizeState] = useState<TextSize>(() => {
    if (typeof window !== "undefined") {
      return (safeGetItem("gombo_pref_text_size", "moyen") as TextSize);
    }
    return "moyen";
  });

  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return safeGetItem("gombo_pref_notif_enabled", "true") !== "false";
    }
    return true;
  });

  const [musicEnabled, setMusicEnabledState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return safeGetItem("gombo_pref_music_muted", "false") !== "true";
    }
    return true;
  });

  const [soundsEnabled, setSoundsEnabledState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return safeGetItem("gombo_pref_ui_sounds", "true") !== "false";
    }
    return true;
  });

  const [vibrationsEnabled, setVibrationsEnabledState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return safeGetItem("gombo_pref_vibration", "true") !== "false";
    }
    return true;
  });

  // Sync theme from loaded user profile
  useEffect(() => {
    if (profile?.theme && profile.theme !== theme) {
      if (["imperial", "light", "royal", "saphir", "emeraude", "studio", "rouge"].includes(profile.theme)) {
        setThemeState(profile.theme as Theme);
      }
    }
  }, [profile?.theme]);

  // Apply theme & store
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark", "imperial", "royal", "saphir", "emeraude", "studio", "rouge");
    root.classList.add(theme);
    
    // Treat all except "light" as dark-based for tailwind dark: classes
    if (theme !== "light") {
      root.classList.add("dark");
    }
    
    const cols = themeColors[theme] || themeColors.imperial;
    root.style.setProperty("--afri-bg", cols.bg);
    root.style.setProperty("--afri-bg-sec", cols.bgSec);
    if (cols.bgTer) root.style.setProperty("--afri-bg-ter", cols.bgTer);
    else root.style.removeProperty("--afri-bg-ter");

    root.style.setProperty("--afri-text", cols.text);
    root.style.setProperty("--afri-text-sec", cols.textSec);
    if (cols.textMuted) root.style.setProperty("--afri-text-muted", cols.textMuted);
    else root.style.removeProperty("--afri-text-muted");

    root.style.setProperty("--afri-border", cols.border);
    root.style.setProperty("--afri-gold", cols.gold);
    
    safeSetItem("gombo_theme", theme);
  }, [theme]);

  // Apply text size & store
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("text-size-petit", "text-size-moyen", "text-size-grand");
    root.classList.add(`text-size-${textSize}`);
    safeSetItem("gombo_pref_text_size", textSize);
  }, [textSize]);

  // Sync musicEnabled with globalAudioManager
  useEffect(() => {
    globalAudioManager.setIsMuted(!musicEnabled);
    safeSetItem("gombo_pref_music_muted", (!musicEnabled).toString());
  }, [musicEnabled]);

  // Sync other settings
  useEffect(() => {
    safeSetItem("gombo_pref_notif_enabled", notificationsEnabled.toString());
  }, [notificationsEnabled]);

  useEffect(() => {
    safeSetItem("gombo_pref_ui_sounds", soundsEnabled.toString());
  }, [soundsEnabled]);

  useEffect(() => {
    safeSetItem("gombo_pref_vibration", vibrationsEnabled.toString());
  }, [vibrationsEnabled]);

  const toggleTheme = () => {
    const nextTheme = theme === "imperial" ? "light" : "imperial";
    setTheme(nextTheme);
  };

  const setTheme = async (t: Theme) => {
    setThemeState(t);
    safeSetItem("gombo_theme", t);
    
    // If user is connected, persist in Firestore
    if (currentUser?.uid) {
      try {
        await gomboDB.updateUserProfile(currentUser.uid, { theme: t });
      } catch (err) {
        console.error("Failed to save theme in user profile Firestore document:", err);
      }
    }
  };

  const setTextSize = (s: TextSize) => {
    setTextSizeState(s);
  };

  const setNotificationsEnabled = (val: boolean) => {
    setNotificationsEnabledState(val);
  };

  const setMusicEnabled = (val: boolean) => {
    setMusicEnabledState(val);
  };

  const setSoundsEnabled = (val: boolean) => {
    setSoundsEnabledState(val);
  };

  const setVibrationsEnabled = (val: boolean) => {
    setVibrationsEnabledState(val);
    if (val && typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(50);
      } catch (_) {}
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors: themeColors[theme] || themeColors.imperial,
        setTheme,
        toggleTheme,
        textSize,
        setTextSize,
        notificationsEnabled,
        setNotificationsEnabled,
        musicEnabled,
        setMusicEnabled,
        soundsEnabled,
        setSoundsEnabled,
        vibrationsEnabled,
        setVibrationsEnabled,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
