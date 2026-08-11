import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { SecurityService } from "./SecurityService";

export interface FeatureFlagState {
  enabled: boolean;
  updatedAt?: any;
  updatedBy?: string;
}

export type FeatureFlagsMap = Record<string, boolean>;

/**
 * Check if a user is a Founder using standard security checks.
 */
export function checkIsFounder(user?: any, profile?: any): boolean {
  if (!user && !profile) return false;
  
  if (user && SecurityService.isFounder(user)) return true;
  if (profile && SecurityService.isFounder(profile)) return true;
  
  const userEmail = (user?.email || profile?.email || "").toLowerCase();
  if (userEmail === "jhs.kmj7@gmail.com") return true;
  
  if (user?.isFounder === true || profile?.isFounder === true) return true;
  if (user?.role === "admin" || profile?.role === "admin" || user?.role === "founder" || profile?.role === "founder") return true;

  return false;
}

/**
 * Central helper: Determines if a feature is enabled for a given user.
 * 
 * CORE RULE (ÉTAPE 4):
 * - Founder + ON  => ACCÈS
 * - Founder + OFF => ACCÈS (Founder Bypass)
 * - User + ON     => ACCÈS
 * - User + OFF    => VERROUILLÉ
 * - Missing flag  => ACCÈS (enabled = true by default)
 */
export function isFeatureEnabled(
  featureId: string,
  user?: any,
  profile?: any,
  flagsState?: FeatureFlagsMap
): boolean {
  // 1. Founder check - Always has access regardless of flag status
  if (checkIsFounder(user, profile)) {
    return true;
  }

  // 2. If flags state is not yet loaded or missing key
  if (!flagsState) {
    return true; // Default safe access during load or fallback
  }

  // 3. If flag key is missing in Firestore, consider enabled = true (Rule 4)
  if (flagsState[featureId] === undefined) {
    return true;
  }

  // 4. Return actual flag status for regular users
  return flagsState[featureId] === true;
}

/**
 * Real-time Firestore subscription to system feature flags.
 * Safely handles errors and fallback.
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
      (snapshot) => {
        if (!snapshot.exists()) {
          onUpdate({});
          return;
        }

        const data = snapshot.data();
        const map: FeatureFlagsMap = {};

        Object.keys(data).forEach((key) => {
          const item = data[key];
          if (item && typeof item.enabled === "boolean") {
            map[key] = item.enabled;
          }
        });

        onUpdate(map);
      },
      (error) => {
        // Safe logging without circular objects
        const errorMsg = error?.message || String(error);
        console.warn("[FeatureFlags Engine] Firestore stream warning:", errorMsg);
        if (onError) onError(new Error(errorMsg));
        // Fallback: keep existing state or enable all by default
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
 * Safely handles initial loading without flickering.
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
        // Safe error fallback
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const checkEnabled = (featureId: string): boolean => {
    return isFeatureEnabled(featureId, user, profile, flagsMap);
  };

  return {
    flagsMap,
    loading,
    isFeatureEnabled: checkEnabled,
    isFounder: checkIsFounder(user, profile)
  };
}

