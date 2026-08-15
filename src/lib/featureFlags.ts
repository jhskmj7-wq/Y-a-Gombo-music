import { useState, useEffect } from "react";
import { doc, onSnapshot, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { SecurityService } from "./SecurityService";

export type FeatureVisibilityStatus = "ACTIVE" | "COMING_SOON" | "HIDDEN";

export interface FeatureFlagValue {
  status: FeatureVisibilityStatus;
  enabled?: boolean;
  isPremium?: boolean;
  updatedAt?: any;
  updatedBy?: string;
}

export type FeatureFlagsMap = Record<string, FeatureFlagValue | boolean | string>;

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

/**
 * Returns raw module status stored in Firestore ("ACTIVE", "COMING_SOON", "HIDDEN").
 */
export function getRawModuleStatus(featureId: string, flagsMap?: FeatureFlagsMap): FeatureVisibilityStatus {
  if (!flagsMap || flagsMap[featureId] === undefined) {
    return "ACTIVE";
  }

  const value = flagsMap[featureId];

  if (typeof value === "boolean") {
    return value ? "ACTIVE" : "HIDDEN";
  }

  if (typeof value === "string") {
    const upper = value.toUpperCase();
    if (upper === "ACTIVE" || upper === "COMING_SOON" || upper === "HIDDEN") {
      return upper as FeatureVisibilityStatus;
    }
    if (upper === "ENABLED" || upper === "TRUE" || upper === "VALIDATED") return "ACTIVE";
    if (upper === "PENDING" || upper === "EXPERIMENTAL") return "COMING_SOON";
    if (upper === "DISABLED" || upper === "FALSE") return "HIDDEN";
    return "ACTIVE";
  }

  if (typeof value === "object" && value !== null) {
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
 * Check if module is flagged as Premium.
 */
export function isModulePremium(featureId: string, flagsMap?: FeatureFlagsMap): boolean {
  if (!flagsMap || !flagsMap[featureId]) return false;
  const value = flagsMap[featureId];
  if (typeof value === "object" && value !== null) {
    return !!value.isPremium;
  }
  return false;
}

/**
 * Gets effective visibility status for a given user.
 * SUPER FONDATEUR: Always sees "ACTIVE" (Can view and test everything).
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
 * True if status is "ACTIVE" or "COMING_SOON".
 * False if status is "HIDDEN" (Must be completely removed from UI, leaving no gaps).
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
 */
export function isModuleComingSoon(
  featureId: string,
  arg2?: any,
  arg3?: any,
  arg4?: FeatureFlagsMap
): boolean {
  const vis = getModuleVisibility(featureId, arg2, arg3, arg4);
  return vis === "COMING_SOON";
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
    onUpdate({});
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
          onUpdate({});
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

        onUpdate(map);
      },
      (error) => {
        const errorMsg = error?.message || String(error);
        console.warn("[FeatureFlags Engine] Firestore stream warning:", errorMsg);
        if (onError) onError(new Error(errorMsg));
        onUpdate({});
      }
    );

    return unsubscribe;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn("[FeatureFlags Engine] Failed to subscribe:", errorMsg);
    onUpdate({});
    return () => {};
  }
}

/**
 * React hook for consuming real-time feature flags status.
 */
export function useFeatureFlags(user?: any, profile?: any) {
  const [flagsMap, setFlagsMap] = useState<FeatureFlagsMap>({});
  const [loading, setLoading] = useState<boolean>(true);

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

  const checkEnabled = (featureId: string): boolean => {
    return isModuleAccessible(featureId, user, profile, flagsMap);
  };

  return {
    flagsMap,
    loading,
    isFeatureEnabled: checkEnabled,
    getModuleVisibility: (id: string) => getModuleVisibility(id, user, profile, flagsMap),
    isModuleVisible: (id: string) => isModuleVisible(id, user, profile, flagsMap),
    isModuleAccessible: (id: string) => isModuleAccessible(id, user, profile, flagsMap),
    isModuleComingSoon: (id: string) => isModuleComingSoon(id, user, profile, flagsMap),
    isFounder: checkIsFounder(user, profile)
  };
}


