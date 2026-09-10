import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
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
  } catch (_) {}

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

function getR2Client() {
  const accessKeyId = (process.env.R2_ACCESS_KEY_ID || "").trim();
  const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || "").trim();
  let rawEndpoint = (process.env.R2_ENDPOINT || "https://d336ac8939fd48099d0e284310a7deb5.r2.cloudflarestorage.com").trim();

  if (!accessKeyId || !secretAccessKey) return null;

  if (rawEndpoint && !rawEndpoint.startsWith("http://") && !rawEndpoint.startsWith("https://")) {
    rawEndpoint = `https://${rawEndpoint}`;
  }

  return new S3Client({
    region: "auto",
    forcePathStyle: true,
    endpoint: rawEndpoint,
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

export default async function handler(req: any, res: any) {
  try {
    if (res && typeof res.setHeader === "function") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    if (req.method === "OPTIONS") {
      return res.status(200).json({ success: true });
    }

    const rawAction =
      req.query?.action ||
      (req.url ? req.url.match(/\/api\/r2\/([^/?]+)/)?.[1] : "") ||
      "";
    const actionParam = String(rawAction).toLowerCase().trim();

    const accessKeyId = (process.env.R2_ACCESS_KEY_ID || "").trim();
    const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || "").trim();
    const publicBucket = (process.env.R2_PUBLIC_BUCKET || "afrigombo-public").trim();
    const privateBucket = (process.env.R2_PRIVATE_BUCKET || "afrigombo-private").trim();
    const publicBaseUrl = (process.env.R2_PUBLIC_BASE_URL || "https://pub-9b8a37b996274704aee625c82e6430f3.r2.dev").replace(/\/+$/, "");
    const isConfigured = Boolean(accessKeyId && secretAccessKey);

    switch (actionParam) {
      case "status": {
        return res.status(200).json({
          configured: isConfigured,
          endpoint: process.env.R2_ENDPOINT,
          publicBucket,
          privateBucket,
          isConfigured,
        });
      }

      case "test-connection": {
        if (!isConfigured) {
          return res.status(200).json({
            configured: false,
            error: "Identifiants R2 non configurés",
            publicBucket: { bucket: publicBucket, accessible: false },
            privateBucket: { bucket: privateBucket, accessible: false },
          });
        }
        const client = getR2Client();
        let pubOk = false;
        let privOk = false;
        try {
          if (client) {
            await client.send(new HeadBucketCommand({ Bucket: publicBucket }));
            pubOk = true;
          }
        } catch (_) {}
        try {
          if (client) {
            await client.send(new HeadBucketCommand({ Bucket: privateBucket }));
            privOk = true;
          }
        } catch (_) {}

        return res.status(200).json({
          configured: true,
          endpoint: process.env.R2_ENDPOINT,
          publicBucket: { bucket: publicBucket, bucketType: "public", accessible: pubOk },
          privateBucket: { bucket: privateBucket, bucketType: "private", accessible: privOk },
        });
      }

      case "presigned-upload-url": {
        let body = req.body;
        if (typeof body === "string") {
          try { body = JSON.parse(body); } catch (_) { body = {}; }
        } else if (!body) {
          body = {};
        }

        const { key, contentType = "video/mp4", bucketType = "public", expiresInSeconds = 3600, idToken: bodyIdToken } = body;
        if (!key || typeof key !== "string") {
          return res.status(400).json({ success: false, code: "INVALID_KEY", error: "La clé de fichier est requise." });
        }

        const authHeader = req.headers?.authorization || req.headers?.Authorization || "";
        const idToken = (typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "") : "") || bodyIdToken;
        if (!idToken) {
          return res.status(401).json({ success: false, code: "AUTH_TOKEN_MISSING", error: "Authentification requise." });
        }

        const authUser = await verifyToken(idToken);
        if (!authUser || !authUser.uid) {
          return res.status(401).json({ success: false, code: "AUTH_SESSION_INVALID", error: "Session invalide ou expirée." });
        }

        const client = getR2Client();
        if (!client) {
          return res.status(503).json({ success: false, code: "R2_NOT_CONFIGURED", error: "R2 non configuré sur ce serveur." });
        }

        const targetBucket = bucketType === "private" ? privateBucket : publicBucket;
        const cleanKey = key.replace(/^\/+/, "");
        const command = new PutObjectCommand({ Bucket: targetBucket, Key: cleanKey, ContentType: contentType });
        const uploadUrl = await getSignedUrl(client, command, { expiresIn: Number(expiresInSeconds) || 3600 });
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
      }

      case "presigned-read-url": {
        let body = req.body;
        if (typeof body === "string") {
          try { body = JSON.parse(body); } catch (_) { body = {}; }
        } else if (!body) {
          body = {};
        }

        const { key, bucketType = "private", expiresInSeconds = 3600, idToken: bodyIdToken } = body;
        if (!key || typeof key !== "string") {
          return res.status(400).json({ success: false, code: "INVALID_KEY", error: "La clé de fichier est requise." });
        }

        const authHeader = req.headers?.authorization || req.headers?.Authorization || "";
        const idToken = (typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "") : "") || bodyIdToken;
        if (!idToken) {
          return res.status(401).json({ success: false, code: "AUTH_TOKEN_MISSING", error: "Authentification requise." });
        }

        const authUser = await verifyToken(idToken);
        if (!authUser || !authUser.uid) {
          return res.status(401).json({ success: false, code: "AUTH_SESSION_INVALID", error: "Session invalide." });
        }

        const client = getR2Client();
        if (!client) {
          return res.status(503).json({ success: false, code: "R2_NOT_CONFIGURED", error: "R2 non configuré." });
        }

        const targetBucket = bucketType === "public" ? publicBucket : privateBucket;
        const cleanKey = key.replace(/^\/+/, "");
        const command = new GetObjectCommand({ Bucket: targetBucket, Key: cleanKey });
        const readUrl = await getSignedUrl(client, command, { expiresIn: Number(expiresInSeconds) || 3600 });

        return res.status(200).json({
          success: true,
          readUrl,
          key: cleanKey,
          bucket: targetBucket,
          bucketType,
          expiresInSeconds: Number(expiresInSeconds) || 3600,
          userId: authUser.uid,
        });
      }

      default:
        return res.status(404).json({ success: false, error: `Action R2 inconnue: ${actionParam}` });
    }
  } catch (error: any) {
    console.error("[FATAL R2 ACTION ERROR]", error);
    return res.status(500).json({ success: false, error: error?.message || "Erreur interne R2." });
  }
}
