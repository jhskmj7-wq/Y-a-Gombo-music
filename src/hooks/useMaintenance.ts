import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../AuthContext";
import { SecurityService } from "../lib/SecurityService";

export interface MaintenanceSettings {
  globalMode?: boolean;
  status?: string;
  globalMessage?: string;
  message?: string;
  scheduled?: boolean;
  startAt?: string | null;
  endAt?: string | null;
  alertBeforeMinutes?: number | null;
  modules?: Record<string, boolean>;
  updatedAt?: string;
  updatedBy?: string;
}

export function useMaintenance() {
  const { currentUser, profile } = useAuth();
  const [maintenance, setMaintenance] = useState<MaintenanceSettings>({
    globalMode: false,
    scheduled: false,
    modules: {}
  });
  const [loading, setLoading] = useState(true);

  const isSuperUser = 
    SecurityService.isFounder(currentUser) || 
    SecurityService.isFounder(profile) || 
    SecurityService.isAdmin(currentUser) || 
    SecurityService.isAdmin(profile) ||
    currentUser?.email === "jhs.kmj7@gmail.com" ||
    profile?.email === "jhs.kmj7@gmail.com";

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "maintenance"), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as MaintenanceSettings;
        setMaintenance(data);
      } else {
        setMaintenance({
          globalMode: false,
          scheduled: false,
          modules: {}
        });
      }
      setLoading(false);
    }, (err) => {
      console.warn("Error listening to maintenance doc:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const now = Date.now();
  const startTime = maintenance.startAt ? new Date(maintenance.startAt).getTime() : 0;
  const endTime = maintenance.endAt ? new Date(maintenance.endAt).getTime() : 0;
  
  const isScheduledWindowActive = 
    !!maintenance.scheduled && 
    startTime > 0 && 
    endTime > 0 && 
    now >= startTime && 
    now < endTime;

  const isGlobalMaintenance = 
    (!isSuperUser) && 
    (!!maintenance.globalMode || maintenance.status === "maintenance" || isScheduledWindowActive);

  const isModuleUnderMaintenance = (moduleKey: string) => {
    if (isSuperUser) return false;
    if (isGlobalMaintenance) return true;
    return !!(maintenance.modules?.[moduleKey]);
  };

  return {
    maintenance,
    loading,
    isSuperUser,
    isScheduledWindowActive,
    isGlobalMaintenance,
    isModuleUnderMaintenance
  };
}

export default useMaintenance;
