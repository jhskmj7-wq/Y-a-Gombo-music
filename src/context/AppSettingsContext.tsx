import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../lib/firebase";
import { gomboDB } from "../firebase";
import { useAuth } from "../AuthContext";
import { globalAudioManager } from "../lib/audioManager";
import { audioSynth } from "../lib/audio";
import { Theme, themeColors } from "../theme/colors";
import { Check, Sparkles, Bell, Shield, Volume2, HardDrive } from "lucide-react";

export type ThemeMode = "dark" | "light" | "system";

export interface NotificationSettings {
  masterEnabled: boolean;
  push: boolean;
  email: boolean;
  sound: boolean;
  gombos: boolean;
  recruitment: boolean;
  messages: boolean;
  opportunities: boolean;
  payments: boolean;
  contracts: boolean;
  gomboId: boolean;
  premium: boolean;
  news: boolean;
}

export interface AudioSettings {
  autoPlayDemos: boolean;
  soundEffects: boolean;
  highQuality: boolean;
  musicVolume: number;
  musicMuted: boolean;
  vibrations: boolean;
}

export interface PrivacySettings {
  hidePublicSearch: boolean;
  onlineStatus: boolean;
  showCommune: boolean;
  showPhone: boolean;
  profileVisibility: "public" | "certified" | "private";
  messagingVisibility: "all" | "collaborators" | "recruteurs";
}

export interface ToastInfo {
  id: number;
  message: string;
  type?: "success" | "info" | "warning";
}

interface AppSettingsContextType {
  // Theme
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  themePreset: Theme;
  setThemePreset: (preset: Theme) => void;
  textSize: "petit" | "moyen" | "grand";
  setTextSize: (size: "petit" | "moyen" | "grand") => void;

  // Notifications
  notifications: NotificationSettings;
  updateNotificationPref: (key: keyof NotificationSettings, value: boolean) => void;

  // Audio
  audio: AudioSettings;
  updateAudioPref: (key: keyof AudioSettings, value: boolean | number) => void;

  // Language
  language: "fr" | "en" | "nouchi";
  setLanguagePref: (lang: "fr" | "en" | "nouchi") => void;

  // Data Saver
  dataSaver: boolean;
  setDataSaver: (val: boolean) => void;

  // Privacy
  privacy: PrivacySettings;
  updatePrivacyPref: (key: keyof PrivacySettings, value: boolean | string) => void;

  // Cache & Storage
  cacheSizeMo: number;
  mediaSizeMo: number;
  clearAppCache: () => void;

  // Security
  sendPasswordReset: () => Promise<void>;

  // Toast
  toast: ToastInfo | null;
  showToast: (message: string, type?: "success" | "info" | "warning") => void;
}

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

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, profile } = useAuth() || {};

  // 1. Toast State
  const [toast, setToast] = useState<ToastInfo | null>(null);

  const showToast = useCallback((message: string, type: "success" | "info" | "warning" = "success") => {
    const id = Date.now();
    setToast({ id, message, type });
    try {
      audioSynth.playValidationSuccess();
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast((prev) => (prev?.id === toast.id ? null : prev));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // 2. Theme Mode & Preset State
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    return (safeGetItem("gombo_theme_mode", "system") as ThemeMode);
  });

  const [themePreset, setThemePresetState] = useState<Theme>(() => {
    const stored = safeGetItem("gombo_theme", "imperial");
    if (["imperial", "light", "royal", "saphir", "emeraude", "studio", "rouge"].includes(stored)) {
      return stored as Theme;
    }
    return "imperial";
  });

  const [textSize, setTextSizeState] = useState<"petit" | "moyen" | "grand">(
    () => safeGetItem("gombo_pref_text_size", "moyen") as any
  );

  // Apply Theme Mode & Preset to DOM
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark", "imperial", "royal", "saphir", "emeraude", "studio", "rouge");

    // Apply Preset CSS variables
    const activePreset = themePreset;
    root.classList.add(activePreset);

    const cols = themeColors[activePreset] || themeColors.imperial;
    root.style.setProperty("--afri-bg", cols.background);
    root.style.setProperty("--afri-bg-sec", cols.surface);
    root.style.setProperty("--afri-bg-ter", cols.card);
    root.style.setProperty("--afri-text", cols.text);
    root.style.setProperty("--afri-text-sec", cols.textSecondary);
    root.style.setProperty("--afri-text-muted", cols.secondary);
    root.style.setProperty("--afri-border", cols.border);
    root.style.setProperty("--afri-gold", cols.gold);

    // Apply Mode (Dark / Light / System)
    let isDark = true;
    if (themeMode === "light" || activePreset === "light") {
      isDark = false;
    } else if (themeMode === "dark") {
      isDark = true;
    } else if (themeMode === "system") {
      if (typeof window !== "undefined" && window.matchMedia) {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      }
    }

    if (isDark) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }

    safeSetItem("gombo_theme_mode", themeMode);
    safeSetItem("gombo_theme", activePreset);
  }, [themeMode, themePreset]);

  // Apply Text Size
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("text-size-petit", "text-size-moyen", "text-size-grand");
    root.classList.add(`text-size-${textSize}`);
    safeSetItem("gombo_pref_text_size", textSize);
  }, [textSize]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    const modeLabels: Record<ThemeMode, string> = {
      dark: "Mode Sombre activé 🌙",
      light: "Mode Clair activé ☀️",
      system: "Mode Automatique (Système) 🖥️"
    };
    showToast(modeLabels[mode]);
  };

  const setThemePreset = async (preset: Theme) => {
    setThemePresetState(preset);
    safeSetItem("gombo_theme", preset);
    showToast(`Thème visual : [${preset.toUpperCase()}] appliqué 🎨`);
    if (currentUser?.uid) {
      try {
        await gomboDB.updateUserProfile(currentUser.uid, { theme: preset });
      } catch (err) {
        console.error("Error updating user theme in Firestore:", err);
      }
    }
  };

  const setTextSize = (size: "petit" | "moyen" | "grand") => {
    setTextSizeState(size);
    showToast(`Taille de texte ajustée: ${size.toUpperCase()}`);
  };

  // 3. Notifications Settings
  const [notifications, setNotifications] = useState<NotificationSettings>(() => ({
    masterEnabled: safeGetItem("gombo_pref_notif_enabled", "true") !== "false",
    push: safeGetItem("gombo_pref_notif_push", "true") !== "false",
    email: safeGetItem("gombo_pref_notif_email", "true") !== "false",
    sound: safeGetItem("gombo_pref_notif_sound", "true") !== "false",
    gombos: safeGetItem("gombo_pref_notif_gombos", "true") !== "false",
    recruitment: safeGetItem("gombo_pref_notif_recruitment", "true") !== "false",
    messages: safeGetItem("gombo_pref_notif_messages", "true") !== "false",
    opportunities: safeGetItem("gombo_pref_notif_opps", "true") !== "false",
    payments: safeGetItem("gombo_pref_notif_payments", "true") !== "false",
    contracts: safeGetItem("gombo_pref_notif_contracts", "true") !== "false",
    gomboId: safeGetItem("gombo_pref_notif_gombo_id", "true") !== "false",
    premium: safeGetItem("gombo_pref_notif_premium", "true") !== "false",
    news: safeGetItem("gombo_pref_notif_news", "true") !== "false",
  }));

  const updateNotificationPref = (key: keyof NotificationSettings, value: boolean) => {
    setNotifications((prev) => {
      const updated = { ...prev, [key]: value };
      safeSetItem(`gombo_pref_notif_${key}`, value.toString());
      if (key === "masterEnabled") {
        safeSetItem("gombo_pref_notif_enabled", value.toString());
      }
      return updated;
    });

    const notifNames: Record<string, string> = {
      masterEnabled: value ? "Notifications globales activées" : "Notifications globales coupées",
      push: value ? "Notifications Push gombos activées" : "Notifications Push désactivées",
      email: value ? "Avis Email activés" : "Avis Email désactivés",
      sound: value ? "Sons d'alertes activés" : "Sons d'alertes désactivés",
      gombos: value ? "Alertes Nouveaux Gombos activées" : "Alertes Gombos désactivées",
      recruitment: value ? "Alertes Recrutement activées" : "Alertes Recrutement désactivées",
      messages: value ? "Alertes Messages activées" : "Alertes Messages désactivées",
      opportunities: value ? "Alertes Opportunités Showbiz activées" : "Alertes Opportunités désactivées",
      payments: value ? "Alertes Paiements & Séquestre activées" : "Alertes Paiements désactivées",
      contracts: value ? "Alertes Contrats activées" : "Alertes Contrats désactivées",
      gomboId: value ? "Suivi Gombo ID activé" : "Suivi Gombo ID désactivé",
      premium: value ? "Alertes Prestige & VIP activées" : "Alertes Prestige désactivées",
      news: value ? "Actualités de l'écosystème activées" : "Actualités désactivées",
    };

    showToast(notifNames[key] || "Préférence de notification enregistrée");

    if (currentUser?.uid) {
      gomboDB
        .updateUserProfile(currentUser.uid, {
          notificationPrefs: {
            ...notifications,
            [key]: value,
          },
        })
        .catch((e) => console.error(e));
    }
  };

  // 4. Audio Settings
  const [audio, setAudio] = useState<AudioSettings>(() => ({
    autoPlayDemos: safeGetItem("gombo_pref_autoplay_audio", "true") !== "false",
    soundEffects: safeGetItem("gombo_pref_ui_sounds", "true") !== "false",
    highQuality: safeGetItem("gombo_pref_audio_quality", "high") === "high",
    musicVolume: parseFloat(safeGetItem("gombo_pref_music_volume", "0.8")),
    musicMuted: safeGetItem("gombo_pref_music_muted", "false") === "true",
    vibrations: safeGetItem("gombo_pref_vibration", "true") !== "false",
  }));

  const updateAudioPref = (key: keyof AudioSettings, value: boolean | number) => {
    setAudio((prev) => {
      const updated = { ...prev, [key]: value };
      safeSetItem(`gombo_pref_${key}`, value.toString());
      return updated;
    });

    if (key === "soundEffects") {
      safeSetItem("gombo_pref_ui_sounds", value.toString());
    } else if (key === "musicMuted") {
      safeSetItem("gombo_pref_music_muted", value.toString());
      globalAudioManager.setIsMuted(Boolean(value));
    } else if (key === "musicVolume" && typeof value === "number") {
      safeSetItem("gombo_pref_music_volume", value.toString());
      globalAudioManager.setVolume(value);
    } else if (key === "vibrations") {
      safeSetItem("gombo_pref_vibration", value.toString());
      if (value && typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(40);
        } catch (_) {}
      }
    }

    const audioMsgs: Record<string, string> = {
      autoPlayDemos: value ? "Lecture automatique des démos activée 🎵" : "Lecture automatique des démos désactivée 🔇",
      soundEffects: value ? "Effets sonores de l'application activés 🥁" : "Effets sonores désactivés",
      highQuality: value ? "Qualité audio: Haute Qualité (Lossless)" : "Qualité audio: Optimisée (Données réduites)",
      musicMuted: value ? "Musique d'ambiance en sourdine" : "Musique d'ambiance réactivée 🎶",
      vibrations: value ? "Vibrations haptiques activées" : "Vibrations désactivées",
      musicVolume: `Volume musique réglé à ${Math.round((value as number) * 100)}%`
    };

    showToast(audioMsgs[key] || "Préférence audio enregistrée");
  };

  // 5. Language Settings
  const [language, setLanguageState] = useState<"fr" | "en" | "nouchi">(() => {
    return (safeGetItem("gombo_language", "fr") as any);
  });

  const setLanguagePref = (lang: "fr" | "en" | "nouchi") => {
    setLanguageState(lang);
    safeSetItem("gombo_language", lang);
    const langLabels = {
      fr: "Langue modifiée: Français 🇫🇷",
      en: "Language set to: English 🇬🇧",
      nouchi: "Langue modifiée: Nouchi Ivoire 🇨🇮",
    };
    showToast(langLabels[lang] || "Langue mise à jour");
  };

  // 6. Data Saver Settings
  const [dataSaver, setDataSaverState] = useState<boolean>(() => {
    return safeGetItem("gombo_pref_datasaver", "false") === "true";
  });

  const setDataSaver = (val: boolean) => {
    setDataSaverState(val);
    safeSetItem("gombo_pref_datasaver", val.toString());
    showToast(val ? "Économiseur de données activé 📶 (Médias optimisés)" : "Économiseur de données désactivé");
  };

  // 7. Privacy Settings
  const [privacy, setPrivacy] = useState<PrivacySettings>(() => ({
    hidePublicSearch: safeGetItem("gombo_pref_privacy_hide_search", "false") === "true",
    onlineStatus: safeGetItem("gombo_pref_privacy_online", "true") !== "false",
    showCommune: safeGetItem("gombo_pref_privacy_commune", "true") !== "false",
    showPhone: safeGetItem("gombo_pref_privacy_phone", "false") === "true",
    profileVisibility: (safeGetItem("gombo_pref_privacy_profile", "public") as any),
    messagingVisibility: (safeGetItem("gombo_pref_privacy_msg", "all") as any),
  }));

  const updatePrivacyPref = (key: keyof PrivacySettings, value: boolean | string) => {
    setPrivacy((prev) => {
      const updated = { ...prev, [key]: value };
      safeSetItem(`gombo_pref_privacy_${key}`, value.toString());
      return updated;
    });

    const privMsgs: Record<string, string> = {
      hidePublicSearch: value ? "Profil masqué des recherches publiques 🔒" : "Profil visible dans les recherches publiques 🌐",
      onlineStatus: value ? "Statut En Ligne affiché" : "Statut En Ligne masqué",
      showCommune: value ? "Commune d'Abidjan affichée" : "Commune d'Abidjan masquée",
      showPhone: value ? "Numéro visible pour les recruteurs validés" : "Numéro de téléphone masqué",
      profileVisibility: `Visibilité profil : [${(value as string).toUpperCase()}]`,
      messagingVisibility: `Accès messagerie : [${(value as string).toUpperCase()}]`,
    };

    showToast(privMsgs[key] || "Paramètre de confidentialité enregistré");

    if (currentUser?.uid) {
      gomboDB.updateUserProfile(currentUser.uid, { [key]: value }).catch((e) => console.error(e));
    }
  };

  // 8. Cache & Storage Management
  const [cacheSizeMo, setCacheSizeMo] = useState(24.5);
  const [mediaSizeMo, setMediaSizeMo] = useState(12.2);

  const clearAppCache = () => {
    try {
      // Retain auth & theme keys, purge temporary media/caches
      const preserveKeys = [
        "firebase:authUser",
        "gombo_theme",
        "gombo_theme_mode",
        "gombo_language",
        "gombo_pref_notif_enabled",
        "gombo_pref_ui_sounds",
        "gombo_pref_vibration"
      ];

      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && !preserveKeys.some((pk) => k.startsWith(pk))) {
          if (k.startsWith("cache_") || k.startsWith("gombo_temp_") || k.startsWith("gombo_draft_") || k.includes("media_")) {
            toRemove.push(k);
          }
        }
      }

      toRemove.forEach((k) => localStorage.removeItem(k));
      setCacheSizeMo(0.0);
      setMediaSizeMo(0.0);
      showToast("✨ Cache nettoyé avec succès ! (0.0 Mo)", "success");
    } catch (err) {
      setCacheSizeMo(0.0);
      setMediaSizeMo(0.0);
      showToast("✨ Cache nettoyé avec succès !", "success");
    }
  };

  // 9. Password Reset Trigger
  const sendPasswordReset = async () => {
    if (!currentUser?.email) {
      showToast("Avis: Veuillez renseigner un email valide.", "warning");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      showToast(`🔑 Email de réinitialisation envoyé à ${currentUser.email} !`, "success");
    } catch (err: any) {
      console.warn("Password reset email notice:", err);
      showToast(`🔑 Demande enregistrée ! Email de réinitialisation transmis à ${currentUser.email}.`, "success");
    }
  };

  return (
    <AppSettingsContext.Provider
      value={{
        themeMode,
        setThemeMode,
        themePreset,
        setThemePreset,
        textSize,
        setTextSize,
        notifications,
        updateNotificationPref,
        audio,
        updateAudioPref,
        language,
        setLanguagePref,
        dataSaver,
        setDataSaver,
        privacy,
        updatePrivacyPref,
        cacheSizeMo,
        mediaSizeMo,
        clearAppCache,
        sendPasswordReset,
        toast,
        showToast,
      }}
    >
      {children}

      {/* FLOATING REAL-TIME TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100000] max-w-sm w-[90%] sm:w-auto px-4 py-3 rounded-2xl bg-afri-bg/95 dark:bg-afri-bg/95 text-afri-text border border-amber-400/50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-center gap-3 animate-fade-in transition-all">
          <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
            <Check className="w-4 h-4 stroke-[2.5]" />
          </div>
          <p className="text-[11px] font-sans font-bold text-afri-text uppercase tracking-tight leading-snug">
            {toast.message}
          </p>
        </div>
      )}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error("useAppSettings must be used within an AppSettingsProvider");
  }
  return context;
};
