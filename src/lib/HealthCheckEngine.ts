import { auth, db } from "./firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";

export type HealthStatus = "OK" | "WARNING" | "ERROR";

export interface HealthCheckResult {
  service: string;
  status: HealthStatus;
  message: string;
}

export const runHealthCheck = async (): Promise<HealthCheckResult[]> => {
  const results: HealthCheckResult[] = [];

  // 1. Firebase Auth
  results.push({
    service: "Authentication",
    status: auth ? "OK" : "ERROR",
    message: auth ? "Auth initialized" : "Auth not initialized"
  });

  // 2. Firestore
  try {
    await getDocs(query(collection(db, "systemLogs"), limit(1)));
    results.push({ service: "Firestore", status: "OK", message: "Connected" });
  } catch (e) {
    results.push({ service: "Firestore", status: "ERROR", message: String(e) });
  }

  // 3. Network
  results.push({
    service: "Network",
    status: navigator.onLine ? "OK" : "WARNING",
    message: navigator.onLine ? "Online" : "Offline"
  });

  // 4. PWA/ServiceWorker
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    results.push({
      service: "ServiceWorker",
      status: registration.active ? "OK" : "WARNING",
      message: registration.active ? "Active" : "Not active"
    });
  } else {
    results.push({ service: "ServiceWorker", status: "WARNING", message: "Not supported" });
  }

  return results;
};
