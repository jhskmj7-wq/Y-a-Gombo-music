import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc } from "firebase/firestore";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API health-check for network latency diagnostic pings
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // API to analyze image for contact info
  app.post("/api/analyze-image", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) return res.status(400).json({ error: "No image provided" });

      if (!process.env.GEMINI_API_KEY) {
        console.warn("⚠️ GEMINI_API_KEY environment variable is missing. Gracefully bypassing image analysis.");
        return res.json({ status: "safe", warning: "AI Moderation bypassed (no API key)" });
      }

      const prompt = "Analyse cette image. Détecte s'il y a des coordonnées de contact : numéros de téléphone, adresses e-mail, QR codes, logos de réseaux sociaux (WhatsApp, Telegram, etc.), ou liens internet. Réponds uniquement par 'BLOCKED' si tu en trouves, sinon réponds 'SAFE'.";

      const base64Data = imageBase64.split(",")[1] || imageBase64;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: "image/jpeg"
              }
            }
          ]
        }
      });

      const text = response.text || "";
      res.json({ status: text.includes("BLOCKED") ? "blocked" : "safe" });
    } catch (error) {
      console.warn("⚠️ Gemini analysis gracefully bypassed (quota limit, server issue or other error):", error);
      // Return 200 with fallback to stay extremely resilient and allow normal user actions
      res.json({ status: "safe", warning: "AI Moderation bypassed due to temporary API rate-limiting or service error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Serve static assets with standard caching except index.html
    app.use(express.static(distPath, {
      setHeaders: (res, pathStr) => {
        if (pathStr.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));
    app.get('*all', (req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    startMaintenanceBackgroundChecker();
  });
}

const firebaseConfig = {
  apiKey: "AIzaSyC3eJm2GfUMxGUNGu7uZeIP9-rtcLRljNk",
  authDomain: "afrigombo.firebaseapp.com",
  databaseURL: "https://afrigombo-default-rtdb.firebaseio.com",
  projectId: "afrigombo",
  storageBucket: "afrigombo.firebasestorage.app",
  messagingSenderId: "558547758112",
  appId: "1:558547758112:web:d84cbcb8fb0e0670c5a045",
  measurementId: "G-27498CNQX0"
};

// Initialize server-side firebase
const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

async function runMaintenanceCheck() {
  try {
    const maintenanceRef = doc(db, "settings", "maintenance");
    const snap = await getDoc(maintenanceRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const isMaintenanceActive = data.globalMode === true || data.status === "maintenance";
    console.log(`[BACKEND MAINTENANCE CHECK] Current state read successfully. Active: ${isMaintenanceActive}`);
  } catch (error: any) {
    // Gracefully handle permission-denied errors from unauthenticated reads without raising noisy red exceptions
    const isPermissionDenied = error && (
      error.code === "permission-denied" || 
      (error.message && error.message.toLowerCase().includes("permission-denied")) ||
      (error.message && error.message.toLowerCase().includes("missing or insufficient permissions"))
    );

    if (isPermissionDenied) {
      console.log("[BACKEND MAINTENANCE CHECK] Quietly handled: Read permission is restricted or requires auth.");
    } else {
      console.error("❌ Error running background maintenance check:", error);
    }
  }
}

function startMaintenanceBackgroundChecker() {
  console.log("🚀 Starting background maintenance window checker (running every 10s)...");
  // Run once immediately on startup
  runMaintenanceCheck();
  // Set interval to run every 10 seconds
  setInterval(runMaintenanceCheck, 10000);
}

startServer();
