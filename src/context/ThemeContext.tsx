import React, { createContext, useContext, useEffect, useState } from "react";
import { globalAudioManager } from "../lib/audioManager";
import { useAppSettings } from "./AppSettingsContext";
import { Theme, ThemeColors, themeColors } from "../theme/colors";

export type { Theme, ThemeColors };
type TextSize = "petit" | "moyen" | "grand";

interface ThemeContextType {
  theme: "light" | "imperial"; // Resolved active visual theme
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
  const {
    themePreset,
    setThemePreset,
    textSize,
    setTextSize,
    experience,
    updateExperiencePref,
    audio,
    updateAudioPref,
    notifications,
    updateNotificationPref
  } = useAppSettings();

  // 1. System Preference Listening (Real-time update)
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };
    
    // Modern API with fallback
    if (media.addEventListener) {
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    } else {
      // @ts-ignore
      media.addListener(listener);
      // @ts-ignore
      return () => media.removeListener(listener);
    }
  }, []);

  // 2. Resolve Active Theme
  const resolvedTheme: "light" | "imperial" =
    themePreset === "system" ? (systemIsDark ? "imperial" : "light") : (themePreset === "imperial" ? "imperial" : "light");

  // 3. Apply Theme Classes & Styles to documentElement (DOM)
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark", "imperial");
    root.classList.add(resolvedTheme);

    // Set tailwind classes
    if (resolvedTheme === "imperial") {
      root.classList.add("dark");
    } else {
      root.classList.add("light");
    }

    const cols = themeColors[resolvedTheme] || themeColors.light;
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

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", cols.background);
    }
  }, [resolvedTheme]);

  const toggleTheme = () => {
    const nextPreset = resolvedTheme === "imperial" ? "light" : "imperial";
    setThemePreset(nextPreset);
  };

  const setTheme = (t: Theme) => {
    setThemePreset(t);
  };

  // Sync music with globalAudioManager
  const musicEnabled = !audio.musicMuted;
  const setMusicEnabled = (val: boolean) => {
    updateAudioPref("musicMuted", !val);
  };

  // Sound effects
  const soundsEnabled = audio.soundEffects;
  const setSoundsEnabled = (val: boolean) => {
    updateAudioPref("soundEffects", val);
    updateExperiencePref("soundEffects", val);
  };

  // Vibrations
  const vibrationsEnabled = audio.vibrations;
  const setVibrationsEnabled = (val: boolean) => {
    updateAudioPref("vibrations", val);
    updateExperiencePref("vibrations", val);
    if (val && typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(50);
      } catch (_) {}
    }
  };

  // Notifications
  const notificationsEnabled = notifications.masterEnabled;
  const setNotificationsEnabled = (val: boolean) => {
    updateNotificationPref("masterEnabled", val);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: resolvedTheme,
        colors: themeColors[resolvedTheme] || themeColors.light,
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
