import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

dotenv.config({ override: true });

const FIREBASE_API_KEY =
  process.env.VITE_FIREBASE_API_KEY ||
  process.env.FIREBASE_API_KEY ||
  "AIzaSyC3eJm2GfUMxGUNGu7uZeIP9-rtcLRljNk";

async function verifyToken(idToken: string): Promise<{ uid: string; email: string } | null> {
  if (!idToken || typeof idToken !== "string") return null;
  const cleanToken = idToken.replace(/^Bearer\s+/i, "").trim();
  if (!cleanToken) return null;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: cleanToken }),
      }
    );
    if (res.ok) {
      const data = (await res.json()) as any;
      if (data.users && Array.isArray(data.users) && data.users.length > 0 && data.users[0].localId) {
        return {
          uid: data.users[0].localId,
          email: (data.users[0].email || "").toLowerCase(),
        };
      }
    }
  } catch (_) {
    // Network fallback
  }

  // JWT fallback
  try {
    const parts = cleanToken.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
      const uid = payload.user_id || payload.uid || payload.sub;
      if (uid) {
        return { uid, email: (payload.email || "").toLowerCase() };
      }
    }
  } catch (_) {}

  return null;
}

export default async function handler(req: any, res: any) {
  try {
    if (res && typeof res.setHeader === "function") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

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
      contentType = "video/mp4",
      bucketType = "public",
      expiresInSeconds = 3600,
      idToken: bodyIdToken,
    } = body;

    if (!key || typeof key !== "string") {
      return res.status(400).json({
        success: false,
        code: "INVALID_KEY",
        error: "La clé de fichier (key) est requise.",
      });
    }

    const authHeader = req.headers?.authorization || req.headers?.Authorization || "";
    const idToken =
      (typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "") : "") ||
      bodyIdToken;

    if (!idToken) {
      return res.status(401).json({
        success: false,
        code: "AUTH_TOKEN_MISSING",
        error: "Authentification requise pour le téléversement Cloudflare R2 (jeton manquant).",
      });
    }

    const authUser = await verifyToken(idToken);
    if (!authUser || !authUser.uid) {
      return res.status(401).json({
        success: false,
        code: "AUTH_SESSION_INVALID",
        error: "Session invalide ou expirée. Veuillez vous reconnecter.",
      });
    }

    const accessKeyId = (process.env.R2_ACCESS_KEY_ID || "").trim();
    const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || "").trim();
    let rawEndpoint = (process.env.R2_ENDPOINT || "https://d336ac8939fd48099d0e284310a7deb5.r2.cloudflarestorage.com").trim();
    const publicBucket = (process.env.R2_PUBLIC_BUCKET || "afrigombo-public").trim();
    const privateBucket = (process.env.R2_PRIVATE_BUCKET || "afrigombo-private").trim();
    const publicBaseUrl = (process.env.R2_PUBLIC_BASE_URL || "https://pub-9b8a37b996274704aee625c82e6430f3.r2.dev").replace(/\/+$/, "");

    if (!accessKeyId || !secretAccessKey) {
      return res.status(503).json({
        success: false,
        code: "R2_NOT_CONFIGURED",
        error: "Cloudflare R2 n'est pas configuré sur ce serveur (clés R2_ACCESS_KEY_ID ou R2_SECRET_ACCESS_KEY manquantes dans l'environnement).",
      });
    }

    if (rawEndpoint && !rawEndpoint.startsWith("http://") && !rawEndpoint.startsWith("https://")) {
      rawEndpoint = `https://${rawEndpoint}`;
    }

    const client = new S3Client({
      region: "auto",
      forcePathStyle: true,
      endpoint: rawEndpoint,
      credentials: { accessKeyId, secretAccessKey },
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });

    const targetBucket = bucketType === "private" ? privateBucket : publicBucket;
    const cleanKey = key.replace(/^\/+/, "");

    const command = new PutObjectCommand({
      Bucket: targetBucket,
      Key: cleanKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(client, command, {
      expiresIn: Math.min(Math.max(Number(expiresInSeconds) || 3600, 60), 86400),
    });

    const publicUrl = bucketType === "public" ? `${publicBaseUrl}/${cleanKey}` : undefined;

    return res.status(200).json({
      success: true,
      uploadUrl,
      key: cleanKey,
      bucket: targetBucket,
      bucketType,
      publicUrl,
      expiresInSeconds: Number(expiresInSeconds) || 3600,
      userId: authUser.uid,
    });
  } catch (error: any) {
    console.error("[R2 SERVERLESS PRESIGNED UPLOAD ERROR]", error);
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: error?.message || "Erreur serveur lors de la génération de l'URL présignée Cloudflare R2.",
    });
  }
}
