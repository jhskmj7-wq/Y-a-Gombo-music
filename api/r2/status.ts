import { getR2Config, isR2Configured } from "../_r2Helper";

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");

  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(200).json({ success: true });
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).json({ success: false, error: "Méthode non autorisée. Utilisez GET." });
  }

  try {
    const config = getR2Config();
    return res.status(200).json({
      configured: config.isConfigured,
      endpoint: config.endpoint,
      publicBucket: config.publicBucket,
      privateBucket: config.privateBucket,
      isConfigured: isR2Configured(),
    });
  } catch (error: any) {
    console.error("[R2 SERVERLESS STATUS ERROR]", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Erreur serveur lors de la récupération du statut Cloudflare R2.",
    });
  }
}
