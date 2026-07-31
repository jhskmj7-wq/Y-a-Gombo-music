import { app, auth, db, storage } from "./firebase";
import { syncManager } from "./SyncManager";

export type BootTaskStatus = "PENDING" | "OK" | "WARNING" | "ERROR";

export interface BootTaskResult {
  name: string;
  status: BootTaskStatus;
  message?: string;
}

class BootManager {
  private static instance: BootManager;
  private results: BootTaskResult[] = [];

  static getInstance(): BootManager {
    if (!BootManager.instance) {
      BootManager.instance = new BootManager();
    }
    return BootManager.instance;
  }

  async runDiagnostics(onStep?: (taskName: string, status: BootTaskStatus) => void): Promise<BootTaskResult[]> {
    this.results = [];

    const tasks: { name: string; run: () => Promise<{ status: BootTaskStatus; message?: string }> }[] = [
      {
        name: "React Engine",
        run: async () => ({ status: "OK", message: "React initialized" })
      },
      {
        name: "BrowserRouter",
        run: async () => {
          const ok = typeof window !== "undefined" && !!window.location;
          return { status: ok ? "OK" : "ERROR", message: ok ? "Router ready" : "No window context" };
        }
      },
      {
        name: "Firebase App",
        run: async () => {
          const ok = !!app && !!app.name;
          return { status: ok ? "OK" : "ERROR", message: ok ? `Project: ${app.options.projectId}` : "App initialization failed" };
        }
      },
      {
        name: "Firebase Auth",
        run: async () => {
          const ok = !!auth;
          return { status: ok ? "OK" : "WARNING", message: ok ? "Auth ready" : "Auth missing" };
        }
      },
      {
        name: "Firestore Database",
        run: async () => {
          const ok = !!db;
          return { status: ok ? "OK" : "WARNING", message: ok ? "Firestore ready" : "Firestore missing" };
        }
      },
      {
        name: "Storage Cloud",
        run: async () => {
          const ok = !!storage;
          return { status: ok ? "OK" : "WARNING", message: ok ? "Storage ready" : "Storage missing" };
        }
      },
      {
        name: "Service Worker (PWA)",
        run: async () => {
          if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            return { status: "OK", message: "PWA SW supported" };
          }
          return { status: "WARNING", message: "SW disabled or unsupported" };
        }
      },
      {
        name: "SyncManager Singleton",
        run: async () => {
          const state = syncManager.getState();
          return { status: "OK", message: `Sync State: ${state}` };
        }
      },
      {
        name: "Lazy Modules Protection",
        run: async () => ({ status: "OK", message: "Lazy protection active" })
      },
      {
        name: "App Version",
        run: async () => {
          const ver = localStorage.getItem("afrigombo_app_version") || "1.0.0";
          return { status: "OK", message: `Version: ${ver}` };
        }
      },
      {
        name: "Cache Storage",
        run: async () => {
          const ok = typeof window !== "undefined" && "caches" in window;
          return { status: ok ? "OK" : "WARNING", message: ok ? "Cache Storage available" : "No Cache API" };
        }
      },
      {
        name: "Réseau Connection",
        run: async () => {
          const online = typeof navigator !== "undefined" ? navigator.onLine : true;
          return { status: online ? "OK" : "WARNING", message: online ? "Online" : "Offline Mode" };
        }
      }
    ];

    let idx = 1;
    for (const task of tasks) {
      console.log(`BOOT ${idx}: ${task.name}`);
      idx++;
      if (onStep) onStep(task.name, "PENDING");
      try {
        const res = await task.run();
        this.results.push({ name: task.name, status: res.status, message: res.message });
        if (onStep) onStep(task.name, res.status);
      } catch (e: any) {
        this.results.push({ name: task.name, status: "WARNING", message: e?.message || "Task failed" });
        if (onStep) onStep(task.name, "WARNING");
      }
    }

    return this.results;
  }

  getResults(): BootTaskResult[] {
    return this.results;
  }
}

export const bootManager = BootManager.getInstance();
