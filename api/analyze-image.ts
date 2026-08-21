import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.trim() === "") return null;
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(200).json({ success: true });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée. Utilisez POST." });
  }

  try {
    const { imageBase64 } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    const ai = getAI();
    if (!ai) {
      console.warn("⚠️ GEMINI_API_KEY environment variable is missing. Gracefully bypassing image analysis.");
      return res.status(200).json({ status: "safe", warning: "AI Moderation bypassed (no API key)" });
    }

    const prompt =
      "Analyse cette image. Détecte s'il y a des coordonnées de contact : numéros de téléphone, adresses e-mail, QR codes, logos de réseaux sociaux (WhatsApp, Telegram, etc.), ou liens internet. Réponds uniquement par 'BLOCKED' si tu en trouves, sinon réponds 'SAFE'.";

    const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: base64Data,
              mimeType: "image/jpeg",
            },
          },
        ],
      },
    });

    const text = response.text || "";
    return res.status(200).json({ status: text.includes("BLOCKED") ? "blocked" : "safe" });
  } catch (error) {
    console.warn("⚠️ Gemini analysis gracefully bypassed:", error);
    return res.status(200).json({
      status: "safe",
      warning: "AI Moderation bypassed due to temporary API rate-limiting or service error",
    });
  }
}
