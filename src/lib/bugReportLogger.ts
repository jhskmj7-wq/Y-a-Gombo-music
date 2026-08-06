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

    await addDoc(collection(db, "bugReports"), report);
  } catch (err) {
    console.error("Failed to write to bugReports collection:", err);
  }
};

// Global safety error attachment
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    if (event.message && event.message.includes("ResizeObserver")) return;
    const errObj = event.error;
    const msg = event.message || (errObj && typeof errObj.message === "string" ? errObj.message : String(errObj || event));
    const stk = errObj?.stack || (event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : "");
    logBugReport({
      module: "WindowError",
      ecran: window.location.pathname,
      message: msg,
      stack: stk,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const msg = typeof reason === "string" ? reason : (reason && typeof reason.message === "string" ? reason.message : String(reason || "Unhandled Promise Rejection"));
    const stk = reason?.stack || "";
    logBugReport({
      module: "UnhandledPromise",
      ecran: window.location.pathname,
      message: msg,
      stack: stk,
    });
  });
}
