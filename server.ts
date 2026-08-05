import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

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

  // --- PWA SPECIFIC ENDPOINTS & MIDDLEWARES ---
  // Ensure Service Worker is always served with perfect cache control and correct headers
  app.get("/sw.js", (req, res, next) => {
    res.setHeader("Service-Worker-Allowed", "/");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Content-Type", "application/javascript");
    
    // In production, serve the file directly to avoid any middleware/SPA interception
    if (process.env.NODE_ENV === "production") {
      res.sendFile(path.join(process.cwd(), 'dist', 'sw.js'));
    } else {
      // In development, let Vite middleware handle the virtual sw.js
      next();
    }
  });

  // Ensure manifest and icons are served with public access and proper MIME types, allowing Chrome background downloads
  app.get(["/manifest.webmanifest", "/manifest.json"], (req, res, next) => {
    res.setHeader("Content-Type", "application/manifest+json");
    res.setHeader("Access-Control-Allow-Origin", "*"); // Vital for Chrome to read the manifest in authenticated preview environments
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    
    if (process.env.NODE_ENV === "production") {
      res.sendFile(path.join(process.cwd(), 'dist', 'manifest.webmanifest'));
    } else {
      // In development, look for it in the public folder or let Vite serve it
      res.sendFile(path.join(process.cwd(), 'public', 'manifest.webmanifest'));
    }
  });

  // Serve static icons with correct cache headers before any SPA fallbacks
  const pwaIcons = [
    "/favicon.ico",
    "/favicon.png",
    "/favicon-16x16.png",
    "/favicon-32x32.png",
    "/favicon-48x48.png",
    "/favicon-64x64.png",
    "/logo.png",
    "/logo-72.png",
    "/logo-96.png",
    "/logo-128.png",
    "/logo-144.png",
    "/logo-152.png",
    "/logo-192.png",
    "/pwa-192x192.png",
    "/logo-256.png",
    "/logo-384.png",
    "/logo-512.png",
    "/pwa-512x512.png",
    "/maskable-icon.png",
    "/apple-touch-icon.png",
    "/logo_afrigombo.png",
    "/logo.svg"
  ];

  app.get(pwaIcons, (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*"); // Allow Chrome background fetch to download PWA icons
    res.setHeader("Cache-Control", "public, max-age=86400"); // 1 day cache is safe for static PWA assets
    
    if (process.env.NODE_ENV === "production") {
      res.sendFile(path.join(process.cwd(), 'dist', req.path));
    } else {
      res.sendFile(path.join(process.cwd(), 'public', req.path));
    }
  });

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
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.webmanifest') || filePath.endsWith('manifest.json')) {
          res.setHeader('Content-Type', 'application/manifest+json');
        }
        if (filePath.endsWith('sw.js')) {
          res.setHeader('Service-Worker-Allowed', '/');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      }
    }));
    app.get('/manifest.json', (req, res) => {
      res.setHeader('Content-Type', 'application/manifest+json');
      res.sendFile(path.join(distPath, 'manifest.webmanifest'));
    });
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
