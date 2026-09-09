import { verifyUserToken } from "../_firebaseHelper";
import {
  generateR2PresignedReadUrl,
  isR2Configured,
  R2BucketType,
} from "../../server/r2";

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
    const body = req.body || {};
    const { key, bucketType = "private", expiresInSeconds, idToken: bodyIdToken } = body;

    if (!key || typeof key !== "string") {
      return res.status(400).json({ success: false, error: "La clé de fichier (key) est requise." });
    }

    const authHeader = req.headers.authorization || req.headers.Authorization || "";
    let idToken = (typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "") : "") || bodyIdToken;

    if (!idToken) {
      return res.status(401).json({
        success: false,
        error: "Authentification requise pour la lecture Cloudflare R2 (jeton manquant).",
      });
    }

    const authUser = await verifyUserToken(idToken);
    if (!authUser || !authUser.uid) {
      return res.status(401).json({
        success: false,
        error: "Session invalide ou expirée. Veuillez vous reconnecter.",
      });
    }

    if (!isR2Configured()) {
      return res.status(503).json({
        success: false,
        error: "Cloudflare R2 n'est pas encore configuré (R2_ACCESS_KEY_ID ou R2_SECRET_ACCESS_KEY manquant).",
      });
    }

    const result = await generateR2PresignedReadUrl({
      key,
      bucketType: bucketType as R2BucketType,
      expiresInSeconds: expiresInSeconds ? Number(expiresInSeconds) : 3600,
    });

    return res.status(200).json({
      success: true,
      ...result,
      userId: authUser.uid,
    });
  } catch (error: any) {
    console.error("[R2 SERVERLESS PRESIGNED READ ERROR]", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Erreur serveur lors de la lecture présignée Cloudflare R2.",
    });
  }
}
