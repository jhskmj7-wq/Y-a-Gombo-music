import { verifyUserToken } from "../_firebaseHelper";
import { isR2Configured, testR2BucketConnection } from "../_r2Helper";

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");

  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(200).json({ success: true });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Méthode non autorisée. Utilisez POST." });
  }

  try {
    const authHeader = req.headers.authorization || req.headers.Authorization || "";
    const idToken = typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "") : "";

    if (idToken) {
      const authUser = await verifyUserToken(idToken);
      if (!authUser) {
        return res.status(401).json({ success: false, error: "Session invalide ou expirée." });
      }
    }

    if (!isR2Configured()) {
      return res.status(200).json({
        configured: false,
        error: "Identifiants R2_ACCESS_KEY_ID ou R2_SECRET_ACCESS_KEY non configurés.",
        publicBucket: { bucket: "afrigombo-public", bucketType: "public", accessible: false, error: "Non configuré" },
        privateBucket: { bucket: "afrigombo-private", bucketType: "private", accessible: false, error: "Non configuré" },
      });
    }

    const publicTest = await testR2BucketConnection("public");
    const privateTest = await testR2BucketConnection("private");

    return res.status(200).json({
      configured: true,
      endpoint: process.env.R2_ENDPOINT,
      publicBucket: publicTest,
      privateBucket: privateTest,
    });
  } catch (error: any) {
    console.error("[R2 SERVERLESS TEST CONNECTION ERROR]", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Erreur serveur lors du test de connexion Cloudflare R2.",
    });
  }
}
