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
    const safeMessage = typeof data.message === "string" ? data.message : (data.message && typeof (data.message as any).message === "string" ? (data.message as any).message : String(data.message || "Erreur inconnue"));
    const safeStack = typeof data.stack === "string" ? data.stack : (data.stack ? String(data.stack) : "");

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
      ecran: data.ecran || (typeof window !== "undefined" ? window.location.pathname : ""),
      message: safeMessage,
      stack: safeStack,
      version: typeof localStorage !== "undefined" ? (localStorage.getItem("afrigombo_app_version") || "1.0.0") : "1.0.0",
      appareil: typeof window !== "undefined" ? {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        isOnline: navigator.onLine,
      } : {},
    };

    if (!db) {
      console.warn("Firestore db unavailable for bugReportLogger.");
      return;
    }

    try {
      const bugReportsCollection = collection(db, "bugReports");
      if (bugReportsCollection) {
        await addDoc(bugReportsCollection, report);
      }
    } catch (err) {
      console.warn("Failed to write to bugReports collection:", err);
    }
  } catch (err) {
    console.error("Failed to write to bugReports collection:", err);
  }
};

// Global safety error attachment
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    if (event.message && (event.message.includes("ResizeObserver") || event.message.includes("Converting circular structure to JSON"))) return;
    const errObj = event.error;
    const msg = typeof event.message === "string" ? event.message : (errObj && typeof errObj.message === "string" ? errObj.message : String(errObj || "Window Error"));
    const stk = typeof errObj?.stack === "string" ? errObj.stack : (event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : "");
    logBugReport({
      module: "WindowError",
      ecran: window.location.pathname,
      message: msg,
      stack: stk,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    if (reason && typeof reason.message === "string" && reason.message.includes("Converting circular structure to JSON")) return;
    const msg = typeof reason === "string" ? reason : (reason && typeof reason.message === "string" ? reason.message : String(reason || "Unhandled Promise Rejection"));
    const stk = typeof reason?.stack === "string" ? reason.stack : "";
    logBugReport({
      module: "UnhandledPromise",
      ecran: window.location.pathname,
      message: msg,
      stack: stk,
    });
  });
}
