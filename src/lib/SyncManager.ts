import { db } from "./firebase";
import { addDoc, collection } from "firebase/firestore";

type SyncTask = () => Promise<any>;

export enum SyncState { ONLINE = "ONLINE", OFFLINE = "OFFLINE", SYNCING = "SYNCING", WAITING = "WAITING", FAILED = "FAILED" }

class SyncManager {
  private state: SyncState = SyncState.ONLINE;
  private retryDelays = [5000, 10000, 20000, 30000]; // ms

  async executeWithRetry(task: SyncTask, moduleName: string): Promise<any> {
    if (!navigator.onLine) {
        this.state = SyncState.OFFLINE;
        console.warn(`[SyncManager] Offline - skipping task for ${moduleName}`);
        return null;
    }

    this.state = SyncState.SYNCING;
    for (let attempt = 0; attempt < this.retryDelays.length; attempt++) {
      try {
        const result = await task();
        this.state = SyncState.ONLINE;
        return result;
      } catch (error) {
        console.error(`[SyncManager] Attempt ${attempt + 1} failed for ${moduleName}:`, error);
        await this.logSyncError(moduleName, attempt + 1, error);

        if (attempt === this.retryDelays.length - 1) {
            this.state = SyncState.FAILED;
            console.error(`[SyncManager] Max retries reached for ${moduleName}. Going offline.`);
            return null;
        }

        this.state = SyncState.WAITING;
        const delay = this.retryDelays[attempt];
        await new Promise((resolve) => setTimeout(resolve, delay));
        this.state = SyncState.SYNCING;
      }
    }
  }

  listenWithRetry(subscribe: () => () => void, moduleName: string): () => void {
    if (!navigator.onLine) {
        this.state = SyncState.OFFLINE;
        console.warn(`[SyncManager] Offline - skipping listener for ${moduleName}`);
        return () => {};
    }
    
    try {
        return subscribe();
    } catch (error) {
        console.error(`[SyncManager] Listener failed for ${moduleName}:`, error);
        this.logSyncError(moduleName, 1, error).catch(e => console.error(e));
        this.state = SyncState.FAILED;
        return () => {};
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

  getState() { return this.state; }
}

export const syncManager = new SyncManager();
