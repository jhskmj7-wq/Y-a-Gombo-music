import { auth, db } from "./firebase";

export type BootStatus = "IDLE" | "INITIALIZING" | "OK" | "ERROR";

class BootManager {
  private static instance: BootManager;
  private status: BootStatus = "IDLE";
  private tasks: { name: string; check: () => Promise<void> }[] = [];
  private results: { name: string; success: boolean; error?: string }[] = [];

  static getInstance(): BootManager {
    if (!BootManager.instance) {
      BootManager.instance = new BootManager();
    }
    return BootManager.instance;
  }

  addTask(name: string, check: () => Promise<void>) {
    this.tasks.push({ name, check });
  }

  async run(): Promise<{ success: boolean; results: typeof this.results }> {
    this.status = "INITIALIZING";
    this.results = [];
    
    for (const task of this.tasks) {
      try {
        await task.check();
        this.results.push({ name: task.name, success: true });
      } catch (e: any) {
        console.error(`[BootManager] Task ${task.name} failed:`, e);
        this.results.push({ name: task.name, success: false, error: e.message });
      }
    }
    
    this.status = this.results.every(r => r.success) ? "OK" : "ERROR";
    return { success: this.status === "OK", results: this.results };
  }

  getStatus(): BootStatus { return this.status; }
  getResults() { return this.results; }
}

export const bootManager = BootManager.getInstance();
