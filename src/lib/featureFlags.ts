import { useState, useEffect, useMemo, useCallback } from "react";
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { SecurityService } from "./SecurityService";

export type FeatureVisibilityStatus = "ACTIVE" | "COMING_SOON" | "HIDDEN";

export interface FeatureFlagValue {
  status: FeatureVisibilityStatus;
  visibilityStatus?: FeatureVisibilityStatus;
  enabled?: boolean;
  isPremium?: boolean;
  isBeta?: boolean;
  maintenance?: boolean;
  updatedAt?: any;
  updatedBy?: string;
  parentId?: string | null;
}

export type FeatureFlagsMap = Record<string, FeatureFlagValue | boolean | string>;

const FEATURE_FLAGS_CACHE_KEY = "afrigombo_cached_feature_flags_v2";

/**
 * Load cached feature flags synchronously from localStorage to eliminate any startup flash.
 */
function loadInitialCachedFlags(): FeatureFlagsMap {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = localStorage.getItem(FEATURE_FLAGS_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
          return parsed;
        }
      }
    }
  } catch (_) {}
  return {};
}

// Module-level global cached flags map for instantaneous access anywhere in the app
let globalCachedFlagsMap: FeatureFlagsMap = loadInitialCachedFlags();

export function setGlobalCachedFeatureFlags(flags: FeatureFlagsMap): void {
  globalCachedFlagsMap = { ...globalCachedFlagsMap, ...flags };
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(FEATURE_FLAGS_CACHE_KEY, JSON.stringify(globalCachedFlagsMap));
    }
  } catch (_) {}
}

export function getGlobalCachedFeatureFlags(): FeatureFlagsMap {
  return globalCachedFlagsMap;
}

/**
 * Check if a user is a Founder or Super Founder using standard security checks.
 */
export function checkIsFounder(user?: any, profile?: any): boolean {
  if (user === true || profile === true) return true;
  if (!user && !profile) return false;
  
  if (user && typeof user === "object" && SecurityService.isFounder(user)) return true;
  if (profile && typeof profile === "object" && SecurityService.isFounder(profile)) return true;
  
  const userEmail = ((typeof user === "object" ? user?.email : "") || (typeof profile === "object" ? profile?.email : "") || "").toLowerCase();
  if (userEmail === "jhs.kmj7@gmail.com") return true;
  
  if (user?.isFounder === true || profile?.isFounder === true) return true;
  if (user?.role === "admin" || profile?.role === "admin" || user?.role === "founder" || profile?.role === "founder") return true;

  return false;
}

/**
 * Helper to identify user-like objects vs feature flags map objects.
 */
function isUserLikeObject(obj: any): boolean {
  if (!obj || typeof obj !== "object") return false;
  return "email" in obj || "uid" in obj || "role" in obj || "isFounder" in obj || "photoURL" in obj;
}

/**
 * Parses flexible parameters for feature flag queries across various caller signatures.
 */
export function parseModuleVisibilityArgs(
  featureId: string,
  arg2?: any,
  arg3?: any,
  arg4?: FeatureFlagsMap
): { isFounder: boolean; flagsMap?: FeatureFlagsMap } {
  let isFounder = false;
  let flagsMap: FeatureFlagsMap | undefined = undefined;

  // Pattern 1: 4 arguments provided (featureId, user, profile, flagsMap)
  if (arg4 && typeof arg4 === "object") {
    flagsMap = arg4;
    isFounder = checkIsFounder(arg2, arg3);
  } 
  // Pattern 2: 2nd argument is flagsMap (e.g., checkIsModuleVisible(flagId, systemFeatureFlags, isSuperFounderUser))
  else if (arg2 && typeof arg2 === "object" && !isUserLikeObject(arg2)) {
    flagsMap = arg2;
    if (typeof arg3 === "boolean") {
      isFounder = arg3;
    } else if (arg3 && typeof arg3 === "object") {
      isFounder = checkIsFounder(arg3, undefined);
    } else {
      isFounder = false;
    }
  } 
  // Pattern 3: Standard (featureId, user, profile) or 3rd argument is flagsMap
  else {
    isFounder = checkIsFounder(arg2, arg3);
    if (arg3 && typeof arg3 === "object" && !isUserLikeObject(arg3) && !isFounder) {
      flagsMap = arg3;
    }
  }

  return { isFounder, flagsMap };
}

export const CANONICAL_FEATURE_IDS: Record<string, string> = {
  // Gombos & Publications
  gombo: "gombos",
  gombos: "gombos",
  user_gombos: "gombos",
  user_mes_gombos: "gombos",
  my_gombos: "gombos",
  publish: "gombos",
  publier: "gombos",
  user_publish: "gombos",
  menu_pubs: "gombos",
  menu_gombo_ads: "gombos",

  // Wheel / Roue
  wheel: "wheel",
  roue: "wheel",
  roulette: "wheel",
  premium_wheel: "wheel",
  user_wheel: "wheel",
  wheel_gombo: "wheel",
  wheel_1: "wheel_1",
  wheel_2: "wheel_2",
  wheel_3: "wheel_3",
  lots_management: "lots_management",

  // Avatar
  avatar: "avatar",
  user_avatar: "avatar",
  user_profile_view: "avatar",
  user_edit_profile: "avatar",

  // Gombo ID
  gombo_id: "gombo_id",
  gomboid: "gombo_id",
  id: "gombo_id",
  user_gombo_id: "gombo_id",
  menu_gombo_id: "gombo_id",

  // Marketplace / Grand Marché
  grandmarket: "grandMarket",
  grandMarket: "grandMarket",
  marketplace: "grandMarket",
  grand_marche: "grandMarket",
  user_grand_marche: "grandMarket",
  user_grandmarket: "grandMarket",
  user_ecosystem: "grandMarket",
  menu_grand_marche: "grandMarket",
  market: "grandMarket",

  // Académie
  academie: "academie",
  academy: "academie",
  user_academie: "academie",
  menu_academie: "academie",

  // Profil / Héritage
  heritage: "heritage",
  profile: "heritage",
  profil: "heritage",
  user_heritage: "heritage",
  menu_heritage: "heritage",

  // Podcasts & Vibes
  podcasts: "podcasts",
  podcast: "podcasts",
  vibes: "podcasts",
  user_vibes: "podcasts",
  user_podcasts: "podcasts",

  // Trends & Tendances
  trends: "trends",
  tendances: "trends",
  user_trends: "trends",

  // Reels & Vidéos
  reels: "reels",
  user_reels: "reels",
  reels_artistes: "reels",
  video: "reels",

  // Talents
  talents: "talents",
  members: "talents",
  user_talents: "talents",

  // Events
  events: "events",
  event: "events",
  evenements: "events",
  user_events: "events",
  menu_events: "events",

  // Chat / Messagerie
  chat: "chat",
  messages: "chat",
  messagerie: "chat",
  user_messages: "chat",
  menu_msgs: "chat",
  menu_comms: "chat",

  // Wallet
  wallet: "wallet",
  afripay: "wallet",
  user_wallet: "wallet",

  // Escrow / Contrats
  escrow: "escrow",
  user_contracts: "escrow",
  contracts: "escrow",

  // Premium / Abonnement
  premium: "premium",
  subscription: "premium",
  abonnement: "premium",
  user_subscription_management: "premium",
  user_gombo_plus: "premium",
  gombo_plus: "premium",

  // Radar & Nearby
  radar: "radar",
  user_radar: "radar",
  nearby: "nearby",
  user_nearby: "nearby",
  nearbyopportunities: "nearbyOpportunities",
  nearbyOpportunities: "nearbyOpportunities",
  user_opportunities: "nearbyOpportunities",
  menu_near_opports: "nearbyOpportunities",

  // Renforts / Urgences
  renforts: "renforts",
  renfort: "renforts",
  urgences: "renforts",
  user_renforts: "renforts",

  // Favorites
  favorites: "favorites",
  favoris: "favorites",
  user_favorites: "favorites",
  menu_favorites: "favorites",

  // Notifications
  notifications: "notifications",
  user_notifications: "notifications",

  // Groupes
  mes_groupes: "mes_groupes",
  user_mes_groupes: "mes_groupes",

  // Gawa & Lots
  gawa_center: "gawa_center",
  user_gawa_center: "gawa_center",
  mes_lots: "mes_lots",
  user_mes_lots: "mes_lots",

  // Système
  downloads: "downloads",
  user_downloads: "downloads",
  backups: "backups",
  user_backups: "backups",
  updateJournal: "updateJournal",
  update_journal: "updateJournal",
  user_whats_new: "updateJournal",
  menu_changelog: "updateJournal",
  cahier: "cahier",
  user_builders: "cahier",
  user_command_center: "cahier",
  verification: "verification",
  user_verification: "verification",
  support: "support",
  user_support: "support",
  user_help_center: "support",
  menu_support_beta: "support",
  menu_bug_report: "support",
  menu_suggestion: "support",

  // Home
  home: "home",
  accueil: "home",
  terrain: "home",
  user_home: "home",
  user_terrain: "home"
};

export const FEATURE_PARENT_MAP: Record<string, string> = {
  wheel_1: "wheel",
  wheel_2: "wheel",
  wheel_3: "wheel",
};

/**
 * Helper to parse status from string/boolean/object flag representation.
 */
function parseStatusValue(value: any): FeatureVisibilityStatus {
  if (value === undefined) return "ACTIVE";
  if (typeof value === "boolean") return value ? "ACTIVE" : "HIDDEN";
  if (typeof value === "string") {
    const upper = value.toUpperCase().trim();
    if (upper === "ACTIVE" || upper === "COMING_SOON" || upper === "HIDDEN") {
      return upper as FeatureVisibilityStatus;
    }
    if (upper === "ENABLED" || upper === "TRUE" || upper === "VALIDATED") return "ACTIVE";
    if (upper === "PENDING" || upper === "EXPERIMENTAL" || upper === "BIENTOT" || upper === "COMINGSOON") return "COMING_SOON";
    if (upper === "DISABLED" || upper === "FALSE" || upper === "MASQUE" || upper === "HIDDEN") return "HIDDEN";
    return "ACTIVE";
  }
  if (typeof value === "object" && value !== null) {
    if (value.visibilityStatus && ["ACTIVE", "COMING_SOON", "HIDDEN"].includes(value.visibilityStatus)) {
      return value.visibilityStatus as FeatureVisibilityStatus;
    }
    if (value.status && ["ACTIVE", "COMING_SOON", "HIDDEN"].includes(value.status)) {
      return value.status as FeatureVisibilityStatus;
    }
    if (value.enabled !== undefined) {
      return value.enabled ? "ACTIVE" : "HIDDEN";
    }
  }
  return "ACTIVE";
}

/**
 * Returns raw module status stored in Firestore ("ACTIVE", "COMING_SOON", "HIDDEN").
 */
export function getRawModuleStatus(featureId: string, flagsMap?: FeatureFlagsMap): FeatureVisibilityStatus {
  const activeMap = flagsMap && Object.keys(flagsMap).length > 0 ? flagsMap : globalCachedFlagsMap;
  if (!activeMap || Object.keys(activeMap).length === 0) {
    const cleanId = (featureId || "").toLowerCase().trim();
    if (cleanId === "home" || cleanId === "user_home" || cleanId === "user_terrain" || cleanId === "audio") {
      return "ACTIVE";
    }
    return "HIDDEN";
  }

  // 0. Parent Check: If this feature has a parent module, check if parent is HIDDEN
  const parentId = FEATURE_PARENT_MAP[featureId] || (typeof activeMap[featureId] === "object" && activeMap[featureId]?.parentId);
  if (parentId && parentId !== featureId) {
    const parentVal = activeMap[parentId];
    if (parentVal !== undefined) {
      const parentStatus = parseStatusValue(parentVal);
      if (parentStatus === "HIDDEN") {
        // Parent is hidden -> sub-module is automatically hidden for users
        return "HIDDEN";
      }
    }
  }

  // 1. Check exact key
  let value = activeMap[featureId];

  // 2. Check canonical alias
  if (value === undefined && featureId) {
    const cleanId = featureId.toLowerCase().trim();
    const mapped = CANONICAL_FEATURE_IDS[cleanId] || CANONICAL_FEATURE_IDS[featureId];
    if (mapped && activeMap[mapped] !== undefined) {
      value = activeMap[mapped];
    }
  }

  // 3. Fallback for sub-flags (e.g. wheel_1, wheel_2 -> check parent wheel)
  if (value === undefined && parentId && activeMap[parentId] !== undefined) {
    value = activeMap[parentId];
  }

  return parseStatusValue(value);
}

/**
 * Check if module is flagged as Premium.
 */
export function isModulePremium(featureId: string, flagsMap?: FeatureFlagsMap): boolean {
  const activeMap = flagsMap && Object.keys(flagsMap).length > 0 ? flagsMap : globalCachedFlagsMap;
  if (!activeMap || !activeMap[featureId]) return false;
  const value = activeMap[featureId];
  if (typeof value === "object" && value !== null) {
    return !!value.isPremium;
  }
  return false;
}

/**
 * Check if module is flagged as Beta.
 */
export function isModuleBeta(featureId: string, flagsMap?: FeatureFlagsMap): boolean {
  const activeMap = flagsMap && Object.keys(flagsMap).length > 0 ? flagsMap : globalCachedFlagsMap;
  if (!activeMap || !activeMap[featureId]) return false;
  const value = activeMap[featureId];
  if (typeof value === "object" && value !== null) {
    return !!value.isBeta;
  }
  return false;
}

/**
 * Check if module is in Maintenance mode.
 */
export function isModuleMaintenance(featureId: string, flagsMap?: FeatureFlagsMap): boolean {
  const activeMap = flagsMap && Object.keys(flagsMap).length > 0 ? flagsMap : globalCachedFlagsMap;
  if (!activeMap || !activeMap[featureId]) return false;
  const value = activeMap[featureId];
  if (typeof value === "object" && value !== null) {
    return !!value.maintenance;
  }
  return false;
}

/**
 * Gets effective visibility status for a given user.
 * SUPER FONDATEUR: Always sees "ACTIVE" (Can view and test everything regardless of status).
 * Regular User: Gets the configured raw status ("ACTIVE", "COMING_SOON", or "HIDDEN").
 */
export function getModuleVisibility(
  featureId: string,
  arg2?: any,
  arg3?: any,
  arg4?: FeatureFlagsMap
): FeatureVisibilityStatus {
  const { isFounder, flagsMap } = parseModuleVisibilityArgs(featureId, arg2, arg3, arg4);

  if (isFounder) {
    return "ACTIVE";
  }
  return getRawModuleStatus(featureId, flagsMap);
}

/**
 * Helper: Is module visible in menus, grids, and UI?
 * True if status is "ACTIVE" or "COMING_SOON" (or user is Super Founder).
 * False if status is "HIDDEN" (Must be completely removed from DOM, leaving no gaps).
 */
export function isModuleVisible(
  featureId: string,
  arg2?: any,
  arg3?: any,
  arg4?: FeatureFlagsMap
): boolean {
  const vis = getModuleVisibility(featureId, arg2, arg3, arg4);
  return vis !== "HIDDEN";
}

/**
 * Helper: Is module fully functional and accessible?
 * True if status is "ACTIVE" (or user is Super Founder).
 */
export function isModuleAccessible(
  featureId: string,
  arg2?: any,
  arg3?: any,
  arg4?: FeatureFlagsMap
): boolean {
  const vis = getModuleVisibility(featureId, arg2, arg3, arg4);
  return vis === "ACTIVE";
}

/**
 * Helper: Is module in "COMING_SOON" state for regular users?
 * Returns true only if raw status is COMING_SOON and user is NOT Super Founder.
 */
export function isModuleComingSoon(
  featureId: string,
  arg2?: any,
  arg3?: any,
  arg4?: FeatureFlagsMap
): boolean {
  const { isFounder, flagsMap } = parseModuleVisibilityArgs(featureId, arg2, arg3, arg4);
  if (isFounder) return false;
  const raw = getRawModuleStatus(featureId, flagsMap);
  return raw === "COMING_SOON";
}

/**
 * Backward compatibility helper: isFeatureEnabled = isModuleAccessible
 */
export function isFeatureEnabled(
  featureId: string,
  arg2?: any,
  arg3?: any,
  arg4?: FeatureFlagsMap
): boolean {
  return isModuleAccessible(featureId, arg2, arg3, arg4);
}

/**
 * Real-time Firestore subscription to SINGLE SOURCE OF TRUTH: `systemConfig/features`.
 * Safely handles errors, fallbacks, and legacy migration.
 */
export function subscribeToFeatureFlags(
  onUpdate: (flags: FeatureFlagsMap) => void,
  onError?: (error: Error) => void
): () => void {
  if (!db) {
    onUpdate(globalCachedFlagsMap);
    return () => {};
  }

  try {
    const sysConfigRef = doc(db, "systemConfig", "features");
    const unsubscribe = onSnapshot(
      sysConfigRef,
      async (snapshot) => {
        if (!snapshot.exists()) {
          // Check legacy settings/feature_flags or parameters/feature_flags as migration fallback
          try {
            const migratedData: Record<string, any> = {};

            // 1. Try settings/feature_flags
            const legacyRef1 = doc(db, "settings", "feature_flags");
            const legacySnap1 = await getDoc(legacyRef1);
            if (legacySnap1.exists() && legacySnap1.data()?.flags) {
              const legacyFlagsList = legacySnap1.data().flags as Array<any>;
              legacyFlagsList.forEach((item) => {
                if (item && item.id) {
                  const visStatus = item.visibilityStatus || (item.enabled ? "ACTIVE" : "HIDDEN");
                  migratedData[item.id] = {
                    status: visStatus,
                    enabled: visStatus === "ACTIVE",
                    isPremium: !!item.isPremium,
                    updatedAt: item.updatedAt || new Date().toISOString(),
                    updatedBy: item.updatedBy || "Migration Engine (settings)"
                  };
                }
              });
            }

            // 2. Try parameters/feature_flags
            const legacyRef2 = doc(db, "parameters", "feature_flags");
            const legacySnap2 = await getDoc(legacyRef2);
            if (legacySnap2.exists()) {
              const pData = legacySnap2.data() || {};
              Object.keys(pData).forEach((key) => {
                if (!migratedData[key]) {
                  const val = pData[key];
                  if (typeof val === "boolean") {
                    migratedData[key] = {
                      status: val ? "ACTIVE" : "HIDDEN",
                      enabled: val,
                      updatedAt: new Date().toISOString(),
                      updatedBy: "Migration Engine (parameters)"
                    };
                  } else if (typeof val === "object" && val !== null) {
                    const visStatus = val.status || (val.enabled || val.activated ? "ACTIVE" : "HIDDEN");
                    migratedData[key] = {
                      status: visStatus,
                      enabled: visStatus === "ACTIVE",
                      isPremium: !!val.isPremium,
                      updatedAt: val.updatedAt || new Date().toISOString(),
                      updatedBy: val.updatedBy || "Migration Engine (parameters)"
                    };
                  }
                }
              });
            }

            if (Object.keys(migratedData).length > 0) {
              await setDoc(sysConfigRef, migratedData, { merge: true });
            }
          } catch (mErr) {
            console.warn("[FeatureFlags Engine] Migration warning:", mErr);
          }
          onUpdate(globalCachedFlagsMap);
          return;
        }

        const data = snapshot.data();
        const map: FeatureFlagsMap = {};

        Object.keys(data).forEach((key) => {
          const item = data[key];
          if (item !== undefined) {
            if (typeof item === "boolean" || typeof item === "string") {
              map[key] = item;
            } else if (typeof item === "object" && item !== null) {
              map[key] = {
                status: item.status || (item.enabled === false ? "HIDDEN" : "ACTIVE"),
                enabled: item.enabled ?? (item.status === "ACTIVE"),
                isPremium: !!item.isPremium,
                updatedAt: item.updatedAt,
                updatedBy: item.updatedBy
              };
            }
          }
        });

        setGlobalCachedFeatureFlags(map);
        onUpdate(map);
      },
      (error) => {
        const errorMsg = error?.message || String(error);
        console.warn("[FeatureFlags Engine] Firestore stream warning:", errorMsg);
        if (onError) onError(new Error(errorMsg));
        onUpdate(globalCachedFlagsMap);
      }
    );

    return unsubscribe;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn("[FeatureFlags Engine] Failed to subscribe:", errorMsg);
    onUpdate(globalCachedFlagsMap);
    return () => {};
  }
}

/**
 * React hook for consuming real-time feature flags status.
 */
export function useFeatureFlags(user?: any, profile?: any) {
  const [flagsMap, setFlagsMap] = useState<FeatureFlagsMap>(() => ({ ...globalCachedFlagsMap }));
  const [loading, setLoading] = useState<boolean>(() => Object.keys(globalCachedFlagsMap).length === 0);

  useEffect(() => {
    const unsubscribe = subscribeToFeatureFlags(
      (updatedFlags) => {
        setFlagsMap(updatedFlags);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const isFounder = useMemo(() => checkIsFounder(user, profile), [user, profile]);

  const checkVisible = useCallback((id: string): boolean => {
    return isModuleVisible(id, user, profile, flagsMap);
  }, [user, profile, flagsMap]);

  const checkAccessible = useCallback((id: string): boolean => {
    return isModuleAccessible(id, user, profile, flagsMap);
  }, [user, profile, flagsMap]);

  const checkComingSoon = useCallback((id: string): boolean => {
    return isModuleComingSoon(id, user, profile, flagsMap);
  }, [user, profile, flagsMap]);

  const checkVisibilityStatus = useCallback((id: string): FeatureVisibilityStatus => {
    return getModuleVisibility(id, user, profile, flagsMap);
  }, [user, profile, flagsMap]);

  return {
    flagsMap,
    loading,
    configLoaded: !loading,
    isFeatureEnabled: checkAccessible,
    getModuleVisibility: checkVisibilityStatus,
    isModuleVisible: checkVisible,
    isModuleAccessible: checkAccessible,
    isModuleComingSoon: checkComingSoon,
    isFounder
  };
}


