import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { LanguageProvider } from "./LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AppSettingsProvider } from "./context/AppSettingsContext";
import { ModalProvider } from "./components/common/AfriModal";
import { AudioProvider } from "./context/AudioContext";
import ErrorBoundary from "./components/ErrorBoundary";
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

// 8. Console traces representing boot sequence

// Disable logs in production
if (import.meta.env.PROD) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  // Keep console.error and console.warn for critical tracking
}

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
