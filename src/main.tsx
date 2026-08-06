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
