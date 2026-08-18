import "./lib/firebase";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { LanguageProvider } from "./LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AppSettingsProvider } from "./context/AppSettingsContext";
import { ModalProvider } from "./components/common/AfriModal";
import { AudioProvider } from "./context/AudioContext";
import { WalletSecurityProvider } from "./context/WalletSecurityContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { safeStringify } from "./lib/jsonUtils";
import App from "./App.tsx";
import "./index.css";

// Patch console.error and console.warn to sanitize arguments before logging
if (typeof window !== "undefined") {
  const patchConsole = (methodName: "error" | "warn") => {
    const original = console[methodName];
    console[methodName] = (...args: any[]) => {
      const safeArgs = args.map((arg) => {
        if (typeof arg === "string" || typeof arg === "number" || typeof arg === "boolean" || arg === null || arg === undefined) {
          return arg;
        }
        if (arg instanceof Error) {
          return `${arg.name}: ${arg.message}${arg.stack ? `\n${arg.stack}` : ""}`;
        }
        try {
          return safeStringify(arg);
        } catch (_) {
          return String(arg);
        }
      });
      original.apply(console, safeArgs);
    };
  };

  patchConsole("error");
  patchConsole("warn");

  window.addEventListener("error", (e) => {
    if (e.message && e.message.includes("Converting circular structure to JSON")) {
      e.preventDefault?.();
      return;
    }
    const msg = e.message || (e.error && typeof e.error.message === "string" ? e.error.message : String(e.error || "Runtime Error"));
    console.error("RUNTIME ERROR: " + msg);
  });

  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason;
    if (reason && typeof reason.message === "string" && reason.message.includes("Converting circular structure to JSON")) {
      e.preventDefault?.();
      return;
    }
    const msg = typeof reason === "string" ? reason : (reason && typeof reason.message === "string" ? reason.message : String(reason || "Promise Error"));
    console.error("PROMISE ERROR: " + msg);
  });
}

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
                    <WalletSecurityProvider>
                      <App />
                    </WalletSecurityProvider>
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
