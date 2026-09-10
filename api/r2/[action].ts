import { verifyUserToken } from "../_lib/firebaseHelper";
import {
  getR2Config,
  isR2Configured,
  testR2BucketConnection,
  generateR2PresignedReadUrl,
  generateR2PresignedUploadUrl,
  R2BucketType,
} from "../_lib/r2Helper";

export default async function handler(req: any, res: any) {
  try {
    if (res && typeof res.setHeader === "function") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    // Handle CORS Preflight
    if (req.method === "OPTIONS") {
      return res.status(200).json({ success: true });
    }

    // Determine action from route parameter, query, or URL
    const rawAction =
      req.query?.action ||
      (req.url ? req.url.match(/\/api\/r2\/([^/?]+)/)?.[1] : "") ||
      "";
    const actionParam = String(rawAction).toLowerCase().trim();

    switch (actionParam) {
    // ----------------------------------------------------
    // 1. STATUS
    // ----------------------------------------------------
    case "status": {
      if (req.method !== "GET" && req.method !== "HEAD") {
        return res.status(405).json({
          success: false,
          error: "Méthode non autorisée. Utilisez GET.",
        });
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
          error:
            error?.message ||
            "Erreur serveur lors de la récupération du statut Cloudflare R2.",
        });
      }
    }

    // ----------------------------------------------------
    // 2. TEST-CONNECTION
    // ----------------------------------------------------
    case "test-connection": {
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          error: "Méthode non autorisée. Utilisez POST.",
        });
      }
      try {
        const authHeader =
          req.headers.authorization || req.headers.Authorization || "";
        const idToken =
          typeof authHeader === "string"
            ? authHeader.replace(/^Bearer\s+/i, "")
            : "";
        if (idToken) {
          const authUser = await verifyUserToken(idToken);
          if (!authUser) {
            return res.status(401).json({
              success: false,
              error: "Session invalide ou expirée.",
            });
          }
        }

        if (!isR2Configured()) {
          return res.status(200).json({
            configured: false,
            error:
              "Identifiants R2_ACCESS_KEY_ID ou R2_SECRET_ACCESS_KEY non configurés.",
            publicBucket: {
              bucket: "afrigombo-public",
              bucketType: "public",
              accessible: false,
              error: "Non configuré",
            },
            privateBucket: {
              bucket: "afrigombo-private",
              bucketType: "private",
              accessible: false,
              error: "Non configuré",
            },
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
          error:
            error?.message ||
            "Erreur serveur lors du test de connexion Cloudflare R2.",
        });
      }
    }

    // ----------------------------------------------------
    // 3. PRESIGNED-READ-URL
    // ----------------------------------------------------
    case "presigned-read-url": {
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          error: "Méthode non autorisée. Utilisez POST.",
        });
      }
      try {
        const body = req.body || {};
        const {
          key,
          bucketType = "private",
          expiresInSeconds,
          idToken: bodyIdToken,
        } = body;
        if (!key || typeof key !== "string") {
          return res.status(400).json({
            success: false,
            error: "La clé de fichier (key) est requise.",
          });
        }

        const authHeader =
          req.headers.authorization || req.headers.Authorization || "";
        let idToken =
          (typeof authHeader === "string"
            ? authHeader.replace(/^Bearer\s+/i, "")
            : "") || bodyIdToken;

        if (!idToken) {
          return res.status(401).json({
            success: false,
            error:
              "Authentification requise pour la lecture Cloudflare R2 (jeton manquant).",
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
            error:
              "Cloudflare R2 n'est pas encore configuré (R2_ACCESS_KEY_ID ou R2_SECRET_ACCESS_KEY manquant).",
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
          error:
            error?.message ||
            "Erreur serveur lors de la lecture présignée Cloudflare R2.",
        });
      }
    }

    // ----------------------------------------------------
    // 4. PRESIGNED-UPLOAD-URL
    // ----------------------------------------------------
    case "presigned-upload-url": {
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          error: "Méthode non autorisée. Utilisez POST.",
        });
      }
      try {
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
            error: "La clé de fichier (key) est requise.",
          });
        }
        if (bucketType !== "public" && bucketType !== "private") {
          return res.status(400).json({
            success: false,
            error: 'bucketType invalide (doit être "public" ou "private").',
          });
        }

        const authHeader =
          req.headers.authorization || req.headers.Authorization || "";
        let idToken =
          (typeof authHeader === "string"
            ? authHeader.replace(/^Bearer\s+/i, "")
            : "") || bodyIdToken;

        if (!idToken) {
          return res.status(401).json({
            success: false,
            error:
              "Authentification requise pour le téléversement Cloudflare R2 (jeton manquant).",
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
            error:
              "Cloudflare R2 n'est pas encore configuré (R2_ACCESS_KEY_ID ou R2_SECRET_ACCESS_KEY manquant).",
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
        console.error("[R2 SERVERLESS PRESIGNED UPLOAD ERROR]", error);
        return res.status(500).json({
          success: false,
          error:
            error?.message ||
            "Erreur serveur lors de la génération de l'URL présignée Cloudflare R2.",
        });
      }
    }

    default:
      return res.status(404).json({
        success: false,
        error: `Action R2 inconnue: ${actionParam}`,
      });
  }
  } catch (globalError: any) {
    console.error("[FATAL R2 HANDLER ERROR]", globalError);
    return res.status(500).json({
      success: false,
      error: globalError?.message || "Erreur interne critique du gestionnaire R2.",
    });
  }
}
