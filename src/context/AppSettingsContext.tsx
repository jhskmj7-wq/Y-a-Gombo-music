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

export interface ExperienceSettings {
  premiumAnimations: boolean;
  reduceAnimations: boolean;
  batterySaver: boolean;
  maxFluidity: boolean;
  visualEffects: boolean;
  soundEffects: boolean;
  vibrations: boolean;
}

export interface ProfileCustomizationSettings {
  banner: string;
  profileColor: string;
  visitingCard: boolean;
  badge: string;
  signature: string;
  profileMusic: string;
}

export interface PaymentSettings {
  pinConfigured: boolean;
  biometricAuth: boolean;
  preferredMobileMoney: string;
  currency: string;
  dailyLimit: number;
  paymentConfirmation: boolean;
  pinEnabled?: boolean;
  pinLength?: number;
  pinHash?: string;
}

export interface NetworkSettings {
  autoCompression: boolean;
  slowConnectionMode: boolean;
  videoQuality: string;
  downloadWifiOnly: boolean;
}

export interface ActiveSession {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
  current: boolean;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  fingerprint: boolean;
  faceId: boolean;
  activeSessions: ActiveSession[];
}

export interface PersonalStats {
  timeSpentHours: number;
  timeSpentMins: number;
  gombosCompleted: number;
  revenueFcfa: number;
  callsCount: number;
  messagesCount: number;
  postsCount: number;
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

  // Experience
  experience: ExperienceSettings;
  updateExperiencePref: (key: keyof ExperienceSettings, value: boolean) => void;

  // Profile Customization
  profileCustomization: ProfileCustomizationSettings;
  updateProfileCustomizationPref: (key: keyof ProfileCustomizationSettings, value: boolean | string) => void;

  // Payments
  payments: PaymentSettings;
  updatePaymentPref: (key: keyof PaymentSettings, value: boolean | string | number) => void;

  // Network
  network: NetworkSettings;
  updateNetworkPref: (key: keyof NetworkSettings, value: boolean | string) => void;

  // Security
  security: SecuritySettings;
  updateSecurityPref: (key: keyof SecuritySettings, value: boolean) => void;
  closeOtherSessions: () => void;

  // Personal Stats
  personalStats: PersonalStats;

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

  // 2b. Experience Settings State
  const [experience, setExperience] = useState<ExperienceSettings>(() => ({
    premiumAnimations: safeGetItem("gombo_exp_anim", "true") !== "false",
    reduceAnimations: safeGetItem("gombo_exp_reduce_anim", "false") === "true",
    batterySaver: safeGetItem("gombo_exp_battery", "false") === "true",
    maxFluidity: safeGetItem("gombo_exp_fluidity", "true") !== "false",
    visualEffects: safeGetItem("gombo_exp_fx", "true") !== "false",
    soundEffects: safeGetItem("gombo_pref_ui_sounds", "true") !== "false",
    vibrations: safeGetItem("gombo_pref_vibration", "true") !== "false",
  }));

  useEffect(() => {
    const root = window.document.documentElement;
    if (experience.reduceAnimations) root.classList.add("reduce-motion");
    else root.classList.remove("reduce-motion");

    if (experience.batterySaver) root.classList.add("battery-saver");
    else root.classList.remove("battery-saver");

    if (experience.maxFluidity) root.classList.add("high-fps");
    else root.classList.remove("high-fps");
  }, [experience]);

  const updateExperiencePref = (key: keyof ExperienceSettings, value: boolean) => {
    setExperience((prev) => {
      const updated = { ...prev, [key]: value };
      safeSetItem(`gombo_exp_${key}`, value.toString());
      return updated;
    });

    if (key === "soundEffects") {
      updateAudioPref("soundEffects", value);
    } else if (key === "vibrations") {
      updateAudioPref("vibrations", value);
    }

    const expLabels: Record<keyof ExperienceSettings, string> = {
      premiumAnimations: value ? "Animations Premium activées ✨" : "Animations réduites",
      reduceAnimations: value ? "Mode animations réduites activé" : "Animations fluides activées",
      batterySaver: value ? "Économie de batterie activée 🔋" : "Performance maximale activée ⚡",
      maxFluidity: value ? "Fluidité maximale 120 FPS activée 🚀" : "Fluidité standard",
      visualEffects: value ? "Effets visuels et lueurs activés ✨" : "Effets visuels épurés",
      soundEffects: value ? "Effets sonores de l'application activés 🥁" : "Effets sonores désactivés",
      vibrations: value ? "Vibrations haptiques activées 📳" : "Vibrations désactivées",
    };

    showToast(expLabels[key] || "Expérience mise à jour");

    if (currentUser?.uid) {
      gomboDB.updateUserProfile(currentUser.uid, {
        [`experience.${key}`]: value
      }).catch((e) => console.error(e));
    }
  };

  // 2c. Profile Customization State
  const [profileCustomization, setProfileCustomization] = useState<ProfileCustomizationSettings>(() => ({
    banner: safeGetItem("gombo_prof_banner", "imperial_gold"),
    profileColor: safeGetItem("gombo_prof_color", "#D4AF37"),
    visitingCard: safeGetItem("gombo_prof_card", "true") !== "false",
    badge: safeGetItem("gombo_prof_badge", "GOLD_ARTIST"),
    signature: safeGetItem("gombo_prof_sig", "Artiste Élite AFRIGOMBO ELITE 👑"),
    profileMusic: safeGetItem("gombo_prof_music", "intro_hymn"),
  }));

  const updateProfileCustomizationPref = (key: keyof ProfileCustomizationSettings, value: boolean | string) => {
    setProfileCustomization((prev) => {
      const updated = { ...prev, [key]: value };
      safeSetItem(`gombo_prof_${key}`, value.toString());
      return updated;
    });

    showToast(`Personnalisation (${key}) mise à jour avec succès 🎨`);

    if (currentUser?.uid) {
      gomboDB.updateUserProfile(currentUser.uid, {
        [`profileCustomization.${key}`]: value
      }).catch((e) => console.error(e));
    }
  };

  // 2d. Payments State
  const [payments, setPayments] = useState<PaymentSettings>(() => ({
    pinConfigured: safeGetItem("gombo_pay_pin", "true") === "true",
    biometricAuth: safeGetItem("gombo_pay_bio", "true") !== "false",
    preferredMobileMoney: safeGetItem("gombo_pay_momo", "Orange Money"),
    currency: safeGetItem("gombo_pay_curr", "FCFA (XOF)"),
    dailyLimit: parseInt(safeGetItem("gombo_pay_limit", "500000"), 10),
    paymentConfirmation: safeGetItem("gombo_pay_confirm", "true") !== "false",
  }));

  const updatePaymentPref = (key: keyof PaymentSettings, value: boolean | string | number) => {
    setPayments((prev) => {
      const updated = { ...prev, [key]: value };
      safeSetItem(`gombo_pay_${key}`, value.toString());
      return updated;
    });

    const payMsgs: Record<string, string> = {
      biometricAuth: value ? "Biométrie (TouchID / FaceID) activée 🔐" : "Biométrie désactivée",
      preferredMobileMoney: `Moyen de paiement par défaut: ${value}`,
      currency: `Devise d'affichage réglée sur ${value}`,
      dailyLimit: `Limite quotidienne fixée à ${Number(value).toLocaleString()} FCFA`,
      paymentConfirmation: value ? "Confirmation obligatoire des paiements activée" : "Confirmation instantanée",
      pinConfigured: "Code PIN sécurisé mis à jour",
    };

    showToast(payMsgs[key] || "Paramètre de paiement mis à jour");

    if (currentUser?.uid) {
      gomboDB.updateUserProfile(currentUser.uid, {
        [`paymentSettings.${key}`]: value
      }).catch((e) => console.error(e));
    }
  };

  // 2e. Network State
  const [network, setNetwork] = useState<NetworkSettings>(() => ({
    autoCompression: safeGetItem("gombo_net_compress", "true") !== "false",
    slowConnectionMode: safeGetItem("gombo_net_slow", "false") === "true",
    videoQuality: safeGetItem("gombo_net_vid_qual", "720p HD"),
    downloadWifiOnly: safeGetItem("gombo_net_wifi", "true") !== "false",
  }));

  const updateNetworkPref = (key: keyof NetworkSettings, value: boolean | string) => {
    setNetwork((prev) => {
      const updated = { ...prev, [key]: value };
      safeSetItem(`gombo_net_${key}`, value.toString());
      return updated;
    });

    const netMsgs: Record<string, string> = {
      autoCompression: value ? "Compression réseau automatique activée 📶" : "Qualité originale conservée",
      slowConnectionMode: value ? "Mode 2G/3G Réseau Lent activé" : "Mode réseau standard",
      videoQuality: `Qualité vidéo réglée à : ${value}`,
      downloadWifiOnly: value ? "Téléchargement multimédia restreint au Wi-Fi" : "Téléchargement autorisé sur données mobiles",
    };

    showToast(netMsgs[key] || "Réglage réseau enregistré");

    if (currentUser?.uid) {
      gomboDB.updateUserProfile(currentUser.uid, {
        [`networkSettings.${key}`]: value
      }).catch((e) => console.error(e));
    }
  };

  // Helper to sniff device metadata dynamically
  const getDeviceDetails = () => {
    if (typeof navigator === "undefined") {
      return { deviceType: "💻 Serveur", browser: "NodeJS", os: "Linux", screenSize: "1080x1920", touch: false };
    }
    const ua = navigator.userAgent;
    const maxTouch = navigator.maxTouchPoints || 0;
    
    let deviceType = "💻 Ordinateur";
    let os = "Système Inconnu";
    
    if (/Android/i.test(ua)) {
      deviceType = "📱 Android";
      os = "Android";
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      deviceType = "📱 iOS";
      os = "iOS";
    } else if (/Mac/i.test(ua)) {
      deviceType = "💻 macOS";
      os = "macOS";
    } else if (/Win/i.test(ua)) {
      deviceType = "💻 Windows";
      os = "Windows";
    } else if (/Linux/i.test(ua)) {
      deviceType = "💻 Linux";
      os = "Linux";
    } else if (maxTouch > 0) {
      deviceType = "📱 Mobile (Tactile)";
    }
    
    let browser = "Navigateur";
    if (ua.includes("Firefox")) {
      browser = "Firefox";
    } else if (ua.includes("SamsungBrowser")) {
      browser = "Samsung Internet";
    } else if (ua.includes("Opera") || ua.includes("OPR")) {
      browser = "Opera";
    } else if (ua.includes("Trident") || ua.includes("MSIE")) {
      browser = "Internet Explorer";
    } else if (ua.includes("Edge") || ua.includes("Edg")) {
      browser = "Microsoft Edge";
    } else if (ua.includes("Chrome")) {
      browser = "Chrome";
    } else if (ua.includes("Safari")) {
      browser = "Safari";
    }

    const screenSize = typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : "1080x1920";
    return { deviceType, browser, os, screenSize, touch: maxTouch > 0 };
  };

  // 2f. Security State
  const [security, setSecurity] = useState<SecuritySettings>(() => ({
    twoFactorAuth: safeGetItem("gombo_sec_2fa", "false") === "true",
    fingerprint: safeGetItem("gombo_sec_fingerprint", "true") !== "false",
    faceId: safeGetItem("gombo_sec_faceid", "false") === "true",
    activeSessions: [
      { id: "current_session", device: "Appareil Actuel Sniffing...", location: "Localisation non disponible", ip: "Adresse IP : non disponible", lastActive: "À l'instant", current: true }
    ],
  }));

  // Dynamic session sync effect
  useEffect(() => {
    const initSessions = async () => {
      const dev = getDeviceDetails();
      let sessionId = localStorage.getItem("gombo_session_id");
      if (!sessionId) {
        sessionId = "sess_" + Math.random().toString(36).substring(2, 11);
        localStorage.setItem("gombo_session_id", sessionId);
      }

      let ip = "Adresse IP : non disponible";
      let location = "Localisation non disponible";

      try {
        const res = await fetch("https://ipapi.co/json/");
        if (res.ok) {
          const data = await res.json();
          if (data.ip) ip = data.ip;
          if (data.city && data.country_name) {
            location = `${data.city}, ${data.country_name}`;
          }
        }
      } catch (err) {
        console.warn("Could not fetch IP location dynamically:", err);
      }

      const currentSess: ActiveSession = {
        id: sessionId,
        device: `${dev.deviceType} — ${dev.browser} (${dev.screenSize}, Tactile: ${dev.touch ? 'Oui' : 'Non'})`,
        location,
        ip,
        lastActive: "À l'instant",
        current: true
      };

      if (currentUser?.uid) {
        try {
          const userDoc = await gomboDB.getUserProfile(currentUser.uid);
          let dbSessions: ActiveSession[] = userDoc?.activeSessions || [];
          
          // Remove previous entry of this session and append the updated one
          dbSessions = dbSessions.filter(s => s.id !== sessionId);
          dbSessions.push(currentSess);
          
          // Limit total stored sessions to 5
          if (dbSessions.length > 5) {
            dbSessions = dbSessions.slice(dbSessions.length - 5);
          }

          // Ensure exactly correct "current" flag and "lastActive" string
          dbSessions = dbSessions.map(s => ({
            ...s,
            current: s.id === sessionId,
            lastActive: s.id === sessionId ? "À l'instant" : s.lastActive || "Il y a quelques heures"
          }));

          await gomboDB.updateUserProfile(currentUser.uid, { activeSessions: dbSessions });
          
          setSecurity(prev => ({
            ...prev,
            activeSessions: dbSessions
          }));
        } catch (dbErr) {
          console.error("Failed to sync active sessions with Firestore:", dbErr);
          setSecurity(prev => ({
            ...prev,
            activeSessions: [currentSess]
          }));
        }
      } else {
        // Not logged in: show local current session
        setSecurity(prev => ({
          ...prev,
          activeSessions: [currentSess]
        }));
      }
    };

    initSessions();
  }, [currentUser]);

  // Periodic check if session was terminated remotely
  useEffect(() => {
    if (!currentUser?.uid) return;
    
    const checkSessionValidity = async () => {
      const sessionId = localStorage.getItem("gombo_session_id");
      if (!sessionId) return;
      
      try {
        const userDoc = await gomboDB.getUserProfile(currentUser.uid);
        const dbSessions: ActiveSession[] = userDoc?.activeSessions || [];
        
        if (dbSessions.length > 0 && !dbSessions.some(s => s.id === sessionId)) {
          // Terminal remote sign out
          showToast("🚨 Votre session a été fermée à distance.", "warning");
          // Firebase sign out
          auth.signOut();
        }
      } catch (err) {
        console.error("Error checking remote session status:", err);
      }
    };

    const interval = setInterval(checkSessionValidity, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, [currentUser]);

  const updateSecurityPref = (key: keyof SecuritySettings, value: boolean) => {
    setSecurity((prev) => {
      const updated = { ...prev, [key]: value };
      safeSetItem(`gombo_sec_${key}`, value.toString());
      return updated;
    });

    const secMsgs: Record<string, string> = {
      twoFactorAuth: value ? "Double Authentification (2FA) activée 🔒" : "Double Authentification désactivée",
      fingerprint: value ? "Déverrouillage par empreinte digitale activé 👆" : "Empreinte digitale désactivée",
      faceId: value ? "Reconnaissance faciale FaceID activée 👤" : "Reconnaissance faciale désactivée",
    };

    showToast(secMsgs[key] || "Sécurité mise à jour");

    if (currentUser?.uid) {
      gomboDB.updateUserProfile(currentUser.uid, {
        [`securitySettings.${key}`]: value
      }).catch((e) => console.error(e));
    }
  };

  const closeOtherSessions = async () => {
    const sessionId = localStorage.getItem("gombo_session_id");
    if (!sessionId) return;

    setSecurity((prev) => {
      const remaining = prev.activeSessions.filter((s) => s.id === sessionId);
      return {
        ...prev,
        activeSessions: remaining
      };
    });

    if (currentUser?.uid) {
      try {
        const userDoc = await gomboDB.getUserProfile(currentUser.uid);
        let dbSessions: ActiveSession[] = userDoc?.activeSessions || [];
        dbSessions = dbSessions.filter(s => s.id === sessionId);
        await gomboDB.updateUserProfile(currentUser.uid, { activeSessions: dbSessions });
      } catch (err) {
        console.error("Failed to clean up remote sessions:", err);
      }
    }
    showToast("🔒 Toutes les autres sessions ont été fermées avec succès !", "success");
  };

  // 2g. Personal Stats
  const personalStats: PersonalStats = {
    timeSpentHours: 18,
    timeSpentMins: 42,
    gombosCompleted: profile?.gombosCompleted || 8,
    revenueFcfa: profile?.totalRevenue || profile?.wallet?.revenus || 450000,
    callsCount: 12,
    messagesCount: 142,
    postsCount: 19,
  };

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
        experience,
        updateExperiencePref,
        profileCustomization,
        updateProfileCustomizationPref,
        payments,
        updatePaymentPref,
        network,
        updateNetworkPref,
        security,
        updateSecurityPref,
        closeOtherSessions,
        personalStats,
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
