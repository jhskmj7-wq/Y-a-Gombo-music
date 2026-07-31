import { db, auth } from "./firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export interface BugReportInput {
  module?: string;
  ecran?: string;
  message: string;
  stack?: string;
}

export const logBugReport = async (data: BugReportInput) => {
  try {
    const user = auth?.currentUser;
    const report = {
      date: new Date().toISOString(),
      timestamp: serverTimestamp(),
      utilisateur: user
        ? {
            uid: user.uid,
            email: user.email || "Anonyme",
            displayName: user.displayName || "Membre",
          }
        : "Anonyme",
      module: data.module || "Général",
      ecran: data.ecran || window.location.pathname,
      message: data.message,
      stack: data.stack || "",
      version: localStorage.getItem("afrigombo_app_version") || "1.0.0",
      appareil: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        isOnline: navigator.onLine,
      },
    };

    console.warn("🐛 [BugReportLogger] Logging bug report to Firestore bugReports:", report);
    await addDoc(collection(db, "bugReports"), report);
  } catch (err) {
    console.error("Failed to write to bugReports collection:", err);
  }
};

// Global safety error attachment
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    // Avoid double logging benign resize observer errors
    if (event.message && event.message.includes("ResizeObserver")) return;
    logBugReport({
      module: "WindowError",
      ecran: window.location.pathname,
      message: event.message || String(event.error),
      stack: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    logBugReport({
      module: "UnhandledPromise",
      ecran: window.location.pathname,
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack || "",
    });
  });
}
