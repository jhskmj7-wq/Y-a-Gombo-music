import { verifyUserToken } from "../_lib/firebaseHelper";
import {
  isR2Configured,
  generateR2PresignedUploadUrl,
  R2BucketType,
} from "../_lib/r2Helper";

export default async function handler(req: any, res: any) {
  try {
    if (res && typeof res.setHeader === "function") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    // Handle CORS Preflight
    if (req.method === "OPTIONS") {
      return res.status(200).json({ success: true });
    }

    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        code: "METHOD_NOT_ALLOWED",
        error: "Méthode non autorisée. Utilisez POST.",
      });
    }

    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (_) {
        body = {};
      }
    } else if (!body) {
      body = {};
    }

    const {
      key,
      contentType,
      bucketType = "public",
      expiresInSeconds,
      idToken: bodyIdToken,
    } = body;

    if (!key || typeof key !== "string") {
      return res.status(400).json({
        success: false,
        code: "INVALID_KEY",
        error: "La clé de fichier (key) est requise.",
      });
    }

    if (bucketType !== "public" && bucketType !== "private") {
      return res.status(400).json({
        success: false,
        code: "INVALID_BUCKET_TYPE",
        error: 'bucketType invalide (doit être "public" ou "private").',
      });
    }

    const authHeader =
      req.headers?.authorization || req.headers?.Authorization || "";
    const idToken =
      (typeof authHeader === "string"
        ? authHeader.replace(/^Bearer\s+/i, "")
        : "") || bodyIdToken;

    if (!idToken) {
      return res.status(401).json({
        success: false,
        code: "AUTH_TOKEN_MISSING",
        error:
          "Authentification requise pour le téléversement Cloudflare R2 (jeton manquant).",
      });
    }

    const authUser = await verifyUserToken(idToken);
    if (!authUser || !authUser.uid) {
      return res.status(401).json({
        success: false,
        code: "AUTH_SESSION_INVALID",
        error: "Session invalide ou expirée. Veuillez vous reconnecter.",
      });
    }

    if (!isR2Configured()) {
      return res.status(503).json({
        success: false,
        code: "R2_NOT_CONFIGURED",
        error:
          "Cloudflare R2 n'est pas encore configuré (identifiants R2_ACCESS_KEY_ID ou R2_SECRET_ACCESS_KEY manquants).",
      });
    }

    const result = await generateR2PresignedUploadUrl({
      key,
      bucketType: bucketType as R2BucketType,
      contentType: contentType || "application/octet-stream",
      expiresInSeconds: expiresInSeconds ? Number(expiresInSeconds) : 3600,
    });

    return res.status(200).json({
      success: true,
      ...result,
      userId: authUser.uid,
    });
  } catch (error: any) {
    console.error("[R2 PRESIGNED UPLOAD DEDICATED ROUTE ERROR]", error?.message || error);
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error:
        error?.message ||
        "Erreur serveur lors de la génération de l'URL présignée Cloudflare R2.",
    });
  }
}
