import { useState, useEffect } from "react";

// Get initial preferences from localStorage safely
const getLocalBool = (key: string, defVal: boolean): boolean => {
  try {
    const val = localStorage.getItem(key);
    if (val === null) return defVal;
    return val === "true";
  } catch (e) {
    return defVal;
  }
};

// State variables for system detection
let batteryLevel = 100;
let isCharging = false;
let connectionType = "4g";

// Listeners collection
const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach((l) => l());
  // Dispatch a global custom event for non-react components
  window.dispatchEvent(new CustomEvent("gombo_performance_change"));
};

// Battery detection
if (typeof navigator !== "undefined" && "getBattery" in navigator) {
  (navigator as any).getBattery().then((battery: any) => {
    batteryLevel = Math.round(battery.level * 100);
    isCharging = battery.charging;
    notifyListeners();

    battery.addEventListener("levelchange", () => {
      batteryLevel = Math.round(battery.level * 100);
      notifyListeners();
    });

    battery.addEventListener("chargingchange", () => {
      isCharging = battery.charging;
      notifyListeners();
    });
  }).catch(() => {
    // Graceful safety fallback
  });
}

// Network connection detection
if (typeof navigator !== "undefined" && (navigator as any).connection) {
  const conn = (navigator as any).connection;
  connectionType = conn.effectiveType || "4g";

  conn.addEventListener("change", () => {
    connectionType = conn.effectiveType || "4g";
    notifyListeners();
  });
}

export const performanceState = {
  get batteryLevel() {
    return batteryLevel;
  },
  get isCharging() {
    return isCharging;
  },
  get connectionType() {
    return connectionType;
  },
  get isBatteryLow() {
    return batteryLevel < 20 && !isCharging;
  },
  get isSlowConnection() {
    return connectionType === "2g" || connectionType === "slow-2g";
  },
  get enableAnimations() {
    return getLocalBool("gombo_pref_animations", true);
  },
  get enableDataSave() {
    return getLocalBool("gombo_pref_data_save", false);
  },
  get enableBatterySave() {
    return getLocalBool("gombo_pref_battery_save", false);
  },
  get isDataSaveActive() {
    return this.enableDataSave || this.isSlowConnection;
  },
  get isBatterySaveActive() {
    return this.enableBatterySave || this.isBatteryLow;
  },
  get areAnimationsReduced() {
    return !this.enableAnimations || this.isDataSaveActive || this.isBatterySaveActive;
  },
  get areVibrationsReduced() {
    return this.isBatterySaveActive || !getLocalBool("gombo_pref_vibration", true);
  },
  get areSoundsReduced() {
    return this.isBatterySaveActive;
  },
  get isLowMemoryMode() {
    return this.areAnimationsReduced || this.isSlowConnection;
  },
  get syncFrequencyMs() {
    // Standard is 10s, reduced is 30s
    return this.isBatterySaveActive || this.isDataSaveActive ? 30000 : 10000;
  }
};

// React hook to wire changes beautifully to the UI
export function usePerformance() {
  const [state, setState] = useState(() => ({
    batteryLevel: performanceState.batteryLevel,
    isCharging: performanceState.isCharging,
    connectionType: performanceState.connectionType,
    isBatteryLow: performanceState.isBatteryLow,
    isSlowConnection: performanceState.isSlowConnection,
    enableAnimations: performanceState.enableAnimations,
    enableDataSave: performanceState.enableDataSave,
    enableBatterySave: performanceState.enableBatterySave,
    isDataSaveActive: performanceState.isDataSaveActive,
    isBatterySaveActive: performanceState.isBatterySaveActive,
    areAnimationsReduced: performanceState.areAnimationsReduced,
    areVibrationsReduced: performanceState.areVibrationsReduced,
    areSoundsReduced: performanceState.areSoundsReduced,
  }));

  useEffect(() => {
    const handler = () => {
      setState({
        batteryLevel: performanceState.batteryLevel,
        isCharging: performanceState.isCharging,
        connectionType: performanceState.connectionType,
        isBatteryLow: performanceState.isBatteryLow,
        isSlowConnection: performanceState.isSlowConnection,
        enableAnimations: performanceState.enableAnimations,
        enableDataSave: performanceState.enableDataSave,
        enableBatterySave: performanceState.enableBatterySave,
        isDataSaveActive: performanceState.isDataSaveActive,
        isBatterySaveActive: performanceState.isBatterySaveActive,
        areAnimationsReduced: performanceState.areAnimationsReduced,
        areVibrationsReduced: performanceState.areVibrationsReduced,
        areSoundsReduced: performanceState.areSoundsReduced,
      });
    };

    listeners.add(handler);
    window.addEventListener("gombo_settings_saved", handler);

    return () => {
      listeners.delete(handler);
      window.removeEventListener("gombo_settings_saved", handler);
    };
  }, []);

  return state;
}

// Global method to trigger sync of performance settings
export function triggerSettingsSaved() {
  notifyListeners();
  window.dispatchEvent(new CustomEvent("gombo_settings_saved"));
}
