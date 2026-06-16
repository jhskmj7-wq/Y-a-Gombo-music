import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./AuthContext.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import App from "./App.tsx";
import "./index.css";

// 8. Console traces representing boot sequence
console.log("🚀 [AfriGombo Boot] étape de démarrage.");
console.log("⚡ [AfriGombo Boot] initialisation Firebase.");
console.log("👤 [AfriGombo Boot] chargement Auth.");
console.log("🛣️ [AfriGombo Boot] chargement Router.");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
