import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { LanguageProvider } from "./LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AppSettingsProvider } from "./context/AppSettingsContext";
import { ModalProvider } from "./components/common/AfriModal";
import { AudioProvider } from "./context/AudioContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App";
import "./index.css";

// Initialize the global PWA Event Log
(window as any).PWA_EVENT_LOG = (window as any).PWA_EVENT_LOG || [];
(window as any).logPwaEvent = (action: string, details: any = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : "",
    action,
    displayMode: typeof window !== "undefined" && window.matchMedia ? (window.matchMedia("(display-mode: standalone)").matches ? "standalone" : "browser") : "unknown",
    standalone: typeof window !== "undefined" && typeof navigator !== "undefined" ? !!((navigator as any).standalone || (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches)) : false,
    serviceWorkerController: typeof navigator !== "undefined" && navigator.serviceWorker?.controller ? "active" : "none",
    manifestUrl: typeof document !== "undefined" ? (document.querySelector('link[rel="manifest"]')?.getAttribute("href") || "/manifest.webmanifest") : "/manifest.webmanifest",
    ...details
  };
  (window as any).PWA_EVENT_LOG.push(logEntry);
  console.log(`📡 [PWA_EVENT_LOG] ${action}`, logEntry);
};

// Log application startup
(window as any).logPwaEvent("BOOT_STARTUP", { message: "Application main.tsx loaded." });

// Capture beforeinstallprompt at the absolute earliest moment during boot
window.addEventListener("beforeinstallprompt", (e: any) => {
  (window as any).logPwaEvent("BEFOREINSTALLPROMPT_RECEIVED", {
    message: "beforeinstallprompt captured at startup!",
    hasUserChoice: !!e.userChoice,
  });
  
  e.preventDefault();
  (window as any).deferredPrompt = e;
  
  (window as any).logPwaEvent("DEFERRED_PROMPT_STORED", {
    message: "deferredPrompt created and stored on window.",
  });
  
  // Dispatch a custom event to notify any active React components without passing raw circular event
  window.dispatchEvent(new CustomEvent("afrigombo-beforeinstallprompt"));
});

window.addEventListener("appinstalled", () => {
  (window as any).logPwaEvent("APP_INSTALLED_RECEIVED_EARLY", {
    message: "App installed event received early in main.tsx!",
  });
});

window.addEventListener(
  "error",
  (e) => {
    console.error("RUNTIME ERROR:", e.error);
  }
);

window.addEventListener(
  "unhandledrejection",
  (e) => {
    console.error("PROMISE ERROR:", e.reason);
  }
);

import { supportConfig } from "./supportConfig";

// 8. Console traces representing boot sequence
console.log("🚀 [AFRIGOMBO ELITE] MAIN START", supportConfig.APP_VERSION);

console.log("BOOT 1: React & BrowserRouter Ready");
console.log("BOOT 2: Firebase Initialized");

// Disable specific logs if necessary, but keep console.log for critical startup tracing during MVP debugging
if (import.meta.env.PROD) {
  // console.log = () => {}; // Re-enabling for debugging
  console.debug = () => {};
  console.info = () => {};
}

console.log("📡 [AFRIGOMBO ELITE] FIREBASE OK");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <LanguageProvider>
            <AppSettingsProvider>
              <ThemeProvider>
                <ModalProvider>
                  <AudioProvider>
                    <App />
                  </AudioProvider>
                </ModalProvider>
              </ThemeProvider>
            </AppSettingsProvider>
          </LanguageProvider>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
