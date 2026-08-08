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
  });
}

startServer();
