import { db } from "./firebase";
import { addDoc, collection } from "firebase/firestore";

type SyncTask = () => Promise<any>;

export enum SyncStatus {
  ONLINE = "ONLINE",
  SYNCING = "SYNCING",
  OFFLINE = "OFFLINE",
  WAITING = "WAITING",
  FAILED = "FAILED"
}

class SyncManager {
  private static instance: SyncManager;
  private isSyncRunning = false;
  private isRecovering = false;
  private syncState: SyncStatus = SyncStatus.ONLINE;
  private retryCount = 0;
  private maxRetries = 4;
  private retryDelays = [5000, 10000, 20000, 30000]; // ms

  constructor() {
    window.addEventListener("online", () => this.handleOnline());
  }

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  private handleOnline() {
    if (this.syncState === SyncStatus.OFFLINE || this.syncState === SyncStatus.FAILED) {
      console.log("[SyncManager] Network restored. Resetting sync.");
      this.reset();
      this.syncState = SyncStatus.ONLINE;
    }
  }

  reset() {
    this.retryCount = 0;
    this.syncState = SyncStatus.ONLINE;
    this.isRecovering = false;
    this.isSyncRunning = false;
  }

  async executeWithRetry(task: SyncTask, moduleName: string): Promise<any> {
    if (import.meta.env.DEV) {
        console.log(`[SyncManager] DEV mode: Skipping auto-sync for ${moduleName}`);
        return null;
    }

    if (this.isSyncRunning || this.isRecovering) return null;
    if (!navigator.onLine) {
        this.syncState = SyncStatus.OFFLINE;
        return null;
    }

    this.isSyncRunning = true;
    this.syncState = SyncStatus.SYNCING;

    try {
        const result = await task();
        this.reset();
        return result;
    } catch (error) {
        this.isSyncRunning = false;
        this.handleError(task, moduleName, error);
    }
  }

  private async handleError(task: SyncTask, moduleName: string, error: any) {
    this.retryCount++;
    await this.logSyncError(moduleName, this.retryCount, error);

    if (this.retryCount < this.maxRetries) {
        this.isRecovering = true;
        this.syncState = SyncStatus.WAITING;
        const delay = this.retryDelays[this.retryCount - 1];
        console.warn(`[SyncManager] Retrying ${moduleName} in ${delay}ms (Attempt ${this.retryCount})`);
        
        await new Promise((resolve) => setTimeout(resolve, delay));
        this.isRecovering = false;
        await this.executeWithRetry(task, moduleName);
    } else {
        this.syncState = SyncStatus.FAILED;
        this.isRecovering = false;
        console.error(`[SyncManager] Max retries reached for ${moduleName}. Stopping.`);
    }
  }

  private async logSyncError(module: string, attempt: number, error: any) {
    try {
      await addDoc(collection(db, "syncLogs"), {
        error: error?.message || String(error),
        module,
        attempt,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.error("Failed to log sync error:", e);
    }
  }

  getState(): SyncStatus { return this.syncState; }
}

export const syncManager = SyncManager.getInstance();
