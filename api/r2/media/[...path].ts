import { generateR2PresignedReadUrl, isR2Configured } from "../../../server/r2";

export default async function handler(req: any, res: any) {
  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Range");
    return res.status(200).end();
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).json({ success: false, error: "Méthode non autorisée. Utilisez GET." });
  }

  try {
    let key = "";
    if (req.query && req.query.path) {
      if (Array.isArray(req.query.path)) {
        key = req.query.path.join("/");
      } else {
        key = String(req.query.path);
      }
    } else if (req.url) {
      const parsedUrl = new URL(req.url, "http://localhost");
      key = parsedUrl.pathname.replace(/^\/api\/r2\/media\/?/, "");
    }

    key = decodeURIComponent(key);

    if (!key) {
      return res.status(400).json({ success: false, error: "Clé de média manquante." });
    }

    if (!isR2Configured()) {
      return res.status(503).json({ success: false, error: "Stockage Cloudflare R2 non configuré." });
    }

    const publicBaseUrl = (process.env.R2_PUBLIC_BASE_URL || "").trim();
    if (publicBaseUrl) {
      res.setHeader("Location", `${publicBaseUrl.replace(/\/$/, "")}/${key}`);
      return res.status(302).end();
    }

    const signed = await generateR2PresignedReadUrl({
      key,
      bucketType: "public",
      expiresInSeconds: 86400,
    });

    res.setHeader("Location", signed.readUrl);
    return res.status(302).end();
  } catch (err: any) {
    console.error("[R2 SERVERLESS MEDIA ACCESS ERROR]", err);
    return res.status(500).json({ success: false, error: "Impossible de lire le média Cloudflare R2." });
  }
}
