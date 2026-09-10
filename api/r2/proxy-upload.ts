import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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
      if (uid) return { uid, email: (payload.email || "").toLowerCase() };
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
      return res.status(405).json({ success: false, error: "Méthode non autorisée. Utilisez POST." });
    }

    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch (_) { body = {}; }
    } else if (!body) {
      body = {};
    }

    const { key, contentType = "video/mp4", bucketType = "public", base64Data, idToken: bodyIdToken } = body;

    if (!key || typeof key !== "string" || !base64Data) {
      return res.status(400).json({ success: false, error: "Clé (key) et données (base64Data) requises." });
    }

    const authHeader = req.headers?.authorization || req.headers?.Authorization || "";
    const idToken = (typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "") : "") || bodyIdToken;

    if (!idToken) {
      return res.status(401).json({ success: false, error: "Authentification requise." });
    }

    const authUser = await verifyToken(idToken);
    if (!authUser || !authUser.uid) {
      return res.status(401).json({ success: false, error: "Session invalide ou expirée." });
    }

    const accessKeyId = (process.env.R2_ACCESS_KEY_ID || "").trim();
    const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || "").trim();
    let rawEndpoint = (process.env.R2_ENDPOINT || "https://d336ac8939fd48099d0e284310a7deb5.r2.cloudflarestorage.com").trim();
    const publicBucket = (process.env.R2_PUBLIC_BUCKET || "afrigombo-public").trim();
    const privateBucket = (process.env.R2_PRIVATE_BUCKET || "afrigombo-private").trim();
    const publicBaseUrl = (process.env.R2_PUBLIC_BASE_URL || "https://pub-9b8a37b996274704aee625c82e6430f3.r2.dev").replace(/\/+$/, "");

    if (!accessKeyId || !secretAccessKey) {
      return res.status(503).json({ success: false, error: "Cloudflare R2 non configuré." });
    }

    if (rawEndpoint && !rawEndpoint.startsWith("http://") && !rawEndpoint.startsWith("https://")) {
      rawEndpoint = `https://${rawEndpoint}`;
    }

    const client = new S3Client({
      region: "auto",
      forcePathStyle: true,
      endpoint: rawEndpoint,
      credentials: { accessKeyId, secretAccessKey },
    });

    const targetBucket = bucketType === "private" ? privateBucket : publicBucket;
    const cleanKey = key.replace(/^\/+/, "");

    const base64Clean = base64Data.replace(/^data:[^;]+;base64,/, "");
    const fileBuffer = Buffer.from(base64Clean, "base64");

    await client.send(new PutObjectCommand({
      Bucket: targetBucket,
      Key: cleanKey,
      Body: fileBuffer,
      ContentType: contentType,
    }));

    const publicUrl = bucketType === "public" ? `${publicBaseUrl}/${cleanKey}` : undefined;

    return res.status(200).json({
      success: true,
      key: cleanKey,
      bucket: targetBucket,
      publicUrl,
      userId: authUser.uid,
    });
  } catch (error: any) {
    console.error("[R2 PROXY UPLOAD ERROR]", error);
    return res.status(500).json({ success: false, error: error?.message || "Erreur lors de l'upload proxy R2." });
  }
}
