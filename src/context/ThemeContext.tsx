import React, { createContext, useContext, useEffect, useState } from "react";
import { globalAudioManager } from "../lib/audioManager";

type Theme = "dark" | "light";
type TextSize = "petit" | "moyen" | "grand";

interface ThemeContextType {
  theme: Theme;
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
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("gombo_theme") as Theme) || "dark";
    }
    return "dark";
  });

  const [textSize, setTextSizeState] = useState<TextSize>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("gombo_pref_text_size") as TextSize) || "moyen";
    }
    return "moyen";
  });

  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("gombo_pref_notif_enabled") !== "false";
    }
    return true;
  });

  const [musicEnabled, setMusicEnabledState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("gombo_pref_music_muted") !== "true";
    }
    return true;
  });

  const [soundsEnabled, setSoundsEnabledState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("gombo_pref_ui_sounds") !== "false";
    }
    return true;
  });

  const [vibrationsEnabled, setVibrationsEnabledState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("gombo_pref_vibration") !== "false";
    }
    return true;
  });

  // Apply theme & store
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("gombo_theme", theme);
  }, [theme]);

  // Apply text size & store
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("text-size-petit", "text-size-moyen", "text-size-grand");
    root.classList.add(`text-size-${textSize}`);
    localStorage.setItem("gombo_pref_text_size", textSize);
  }, [textSize]);

  // Sync musicEnabled with globalAudioManager
  useEffect(() => {
    globalAudioManager.setIsMuted(!musicEnabled);
    localStorage.setItem("gombo_pref_music_muted", (!musicEnabled).toString());
  }, [musicEnabled]);

  // Sync other settings
  useEffect(() => {
    localStorage.setItem("gombo_pref_notif_enabled", notificationsEnabled.toString());
  }, [notificationsEnabled]);

  useEffect(() => {
    localStorage.setItem("gombo_pref_ui_sounds", soundsEnabled.toString());
  }, [soundsEnabled]);

  useEffect(() => {
    localStorage.setItem("gombo_pref_vibration", vibrationsEnabled.toString());
  }, [vibrationsEnabled]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
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
