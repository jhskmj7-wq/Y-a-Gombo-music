import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../AuthContext";
import { SecurityService } from "../lib/SecurityService";

export interface MaintenanceSchedule {
  id: string;
  name?: string;
  startAt: string;
  endAt: string;
  globalMessage?: string;
  alertBeforeMinutes?: number | null;
}

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
  schedules?: MaintenanceSchedule[];
  updatedAt?: string;
  updatedBy?: string;
}

export function useMaintenance() {
  const { currentUser, profile } = useAuth();
  const [maintenance, setMaintenance] = useState<MaintenanceSettings>({
    globalMode: false,
    scheduled: false,
    modules: {},
    schedules: []
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
          modules: {},
          schedules: []
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
  
  const isLegacyScheduledActive = 
    !!maintenance.scheduled && 
    startTime > 0 && 
    endTime > 0 && 
    now >= startTime && 
    now < endTime;

  const activeSchedules = (maintenance.schedules || []).filter((sched: any) => {
    const start = sched.startAt ? new Date(sched.startAt).getTime() : 0;
    const end = sched.endAt ? new Date(sched.endAt).getTime() : 0;
    return start > 0 && end > 0 && now >= start && now < end;
  });

  const isAnyScheduleActive = isLegacyScheduledActive || activeSchedules.length > 0;

  const isSystemMaintenanceActive = 
    !!maintenance.globalMode || maintenance.status === "maintenance" || isAnyScheduleActive;

  const isGlobalMaintenance = 
    (!isSuperUser) && isSystemMaintenanceActive;

  const isModuleUnderMaintenance = (moduleKey: string) => {
    if (isSuperUser) return false;
    if (isGlobalMaintenance) return true;
    return !!(maintenance.modules?.[moduleKey]);
  };

  return {
    maintenance,
    loading,
    isSuperUser,
    isScheduledWindowActive: isAnyScheduleActive,
    isSystemMaintenanceActive,
    isGlobalMaintenance,
    isModuleUnderMaintenance
  };
}

export default useMaintenance;
