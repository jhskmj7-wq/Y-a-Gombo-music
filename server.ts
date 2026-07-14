import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
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

  // API to analyze image for contact info
  app.post("/api/analyze-image", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) return res.status(400).json({ error: "No image provided" });

      const prompt = "Analyse cette image. Détecte s'il y a des coordonnées de contact : numéros de téléphone, adresses e-mail, QR codes, logos de réseaux sociaux (WhatsApp, Telegram, etc.), ou liens internet. Réponds uniquement par 'BLOCKED' si tu en trouves, sinon réponds 'SAFE'.";

      const base64Data = imageBase64.split(",")[1] || imageBase64;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
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
      console.error("Gemini analysis error:", error);
      res.status(500).json({ error: "Analysis failed", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
