import React, { createContext, useContext, useEffect, useState } from "react";
import { globalAudioManager } from "../lib/audioManager";
import { useAuth } from "../AuthContext";
import { gomboDB } from "../firebase";
import { Theme, ThemeColors, themeColors } from "../theme/colors";

export type { Theme, ThemeColors };
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

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
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
    root.style.setProperty("--afri-bg", cols.background);
    root.style.setProperty("--afri-bg-sec", cols.surface);
    root.style.setProperty("--afri-bg-ter", cols.card);

    root.style.setProperty("--afri-text", cols.text);
    root.style.setProperty("--afri-text-sec", cols.textSecondary);
    root.style.setProperty("--afri-text-muted", cols.secondary);

    root.style.setProperty("--afri-border", cols.border);
    root.style.setProperty("--afri-gold", cols.gold);
    root.style.setProperty("--afri-error", cols.error);
    root.style.setProperty("--afri-success", cols.success);
    root.style.setProperty("--afri-warning", cols.warning);
    
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
