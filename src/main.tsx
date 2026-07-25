import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { LanguageProvider } from "./LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ModalProvider } from "./components/common/AfriModal";
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
            <ThemeProvider>
              <ModalProvider>
                <App />
              </ModalProvider>
            </ThemeProvider>
          </LanguageProvider>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
