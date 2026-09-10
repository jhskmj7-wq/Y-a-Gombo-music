import { createClient } from "@supabase/supabase-js";

// Protected Founder Emails
const PROTECTED_FOUNDER_EMAILS = ["jhs.kmj7@gmail.com"];

// Firebase Config Fallback for REST Auth
const FIREBASE_API_KEY =
  process.env.VITE_FIREBASE_API_KEY ||
  process.env.FIREBASE_API_KEY ||
  "AIzaSyC3eJm2GfUMxGUNGu7uZeIP9-rtcLRljNk";

const FIREBASE_PROJECT_ID =
  process.env.VITE_FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_PROJECT_ID ||
  "afrigombo";

// Safe Firebase ID Token Verification via official REST API
async function verifyIdTokenREST(
  idToken: string
): Promise<{ uid: string; email: string } | null> {
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!response.ok) {
      console.error(
        "[ADMIN MEDIA SERVERLESS] REST Auth Verification failed, status:",
        response.status
      );
      return null;
    }

    const data = await response.json();
    if (data.users && data.users.length > 0) {
      const user = data.users[0];
      return {
        uid: user.localId,
        email: (user.email || "").toLowerCase(),
      };
    }
    return null;
  } catch (err) {
    console.error("[ADMIN MEDIA SERVERLESS] REST Auth Exception:", err);
    return null;
  }
}

// Optional Firestore REST Role Check if user email is not in hardcoded founder list
async function checkFirestoreUserRoleREST(uid: string): Promise<boolean> {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}`;
    const response = await fetch(url);
    if (!response.ok) return false;

    const data = await response.json();
    const fields = data.fields || {};
    const isFounder = fields.isFounder?.booleanValue === true;
    const superFounder = fields.superFounder?.booleanValue === true;
    const role = fields.role?.stringValue;

    return isFounder || superFounder || role === "super_founder" || role === "admin";
  } catch (err) {
    console.warn("[ADMIN MEDIA SERVERLESS] Firestore REST Role Check warning:", err);
    return false;
  }
}

// Dynamic Firebase Admin verification if module is available
async function verifyWithFirebaseAdmin(
  idToken: string
): Promise<{ uid: string; email: string } | null> {
  try {
    const adminAppModule = await import("firebase-admin/app");
    const adminAuthModule = await import("firebase-admin/auth");

    if (adminAppModule.getApps().length === 0) {
      adminAppModule.initializeApp({ projectId: FIREBASE_PROJECT_ID });
    }

    const adminAuth = adminAuthModule.getAuth();
    const decoded = await adminAuth.verifyIdToken(idToken);
    return {
      uid: decoded.uid,
      email: (decoded.email || "").toLowerCase(),
    };
  } catch (err) {
    console.warn(
      "[ADMIN MEDIA SERVERLESS] Firebase Admin SDK unavailable/failed, using REST fallback:",
      err
    );
    return null;
  }
}

// Helper to authenticate admin user
async function authenticateAdmin(idToken: string) {
  if (!idToken) return null;
  let authUser = await verifyWithFirebaseAdmin(idToken);
  if (!authUser) {
    authUser = await verifyIdTokenREST(idToken);
  }
  if (!authUser) return null;

  const { uid, email } = authUser;
  let isSuperFounder = PROTECTED_FOUNDER_EMAILS.includes(email);
  if (!isSuperFounder) {
    isSuperFounder = await checkFirestoreUserRoleREST(uid);
  }

  return isSuperFounder ? authUser : null;
}

function getSupabaseClient() {
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://qefnkgtstcisplbrjcxy.supabase.co";

  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    "";

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Configuration Supabase manquante (SUPABASE_URL ou SUPABASE_SECRET_KEY)."
    );
  }

  return { supabase: createClient(supabaseUrl, supabaseKey), supabaseUrl };
}

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");

  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(200).json({ success: true });
  }

  const actionParam = (
    req.query?.action ||
    (req.url && req.url.match(/\/api\/admin\/media\/([^/?]+)/)?.[1]) ||
    ""
  ).toString().toLowerCase();

  switch (actionParam) {
    // ----------------------------------------------------
    // 1. DELETE
    // ----------------------------------------------------
    case "delete": {
      if (req.method !== "POST" && req.method !== "DELETE") {
        return res.status(405).json({
          success: false,
          error: "Méthode non autorisée. Utilisez POST ou DELETE.",
        });
      }

      try {
        const rawBody = req.body || {};
        const { idToken, storagePath, bucket = "afrigombo-media" } = rawBody;

        if (!idToken || !storagePath) {
          return res.status(400).json({
            success: false,
            error: "Paramètres 'idToken' et 'storagePath' requis.",
          });
        }

        const adminUser = await authenticateAdmin(idToken);
        if (!adminUser) {
          return res.status(403).json({
            success: false,
            error: "Accès Super Fondateur refusé. Seul le Super Fondateur est autorisé.",
          });
        }

        const { supabase } = getSupabaseClient();
        const { error: deleteError } = await supabase.storage
          .from(bucket)
          .remove([storagePath]);

        if (deleteError) {
          console.error("[ADMIN MEDIA DELETE ERROR]", deleteError);
          return res.status(500).json({
            success: false,
            error: deleteError.message || "Échec de suppression Supabase.",
          });
        }

        return res.status(200).json({
          success: true,
          message: "Fichier supprimé avec succès.",
        });
      } catch (err: any) {
        console.error("[ADMIN MEDIA DELETE FATAL ERROR]", err);
        return res.status(500).json({
          success: false,
          error: err?.message || "Erreur interne lors de la suppression.",
        });
      }
    }

    // ----------------------------------------------------
    // 2. SIGNED-UPLOAD-URL
    // ----------------------------------------------------
    case "signed-upload-url": {
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          error: "Méthode non autorisée. Utilisez POST.",
        });
      }

      try {
        const body = req.body || {};
        const { idToken, storagePath, bucket = "afrigombo-media" } = body;

        if (!idToken || !storagePath) {
          return res.status(400).json({
            success: false,
            error: "Paramètres 'idToken' et 'storagePath' requis.",
          });
        }

        const adminUser = await authenticateAdmin(idToken);
        if (!adminUser) {
          return res.status(403).json({
            success: false,
            error: "Accès Super Fondateur refusé. Seul le Super Fondateur est autorisé.",
          });
        }

        const { supabase } = getSupabaseClient();
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUploadUrl(storagePath);

        if (error) {
          console.error("[SIGNED URL ERROR]", error);
          return res.status(500).json({
            success: false,
            error: error.message || "Échec de génération de l'URL signée.",
          });
        }

        return res.status(200).json({
          success: true,
          signedUrl: data?.signedUrl,
          token: data?.token,
          path: data?.path || storagePath,
        });
      } catch (err: any) {
        console.error("[SIGNED URL FATAL ERROR]", err);
        return res.status(500).json({
          success: false,
          error: err?.message || "Erreur interne lors de la génération de l'URL signée.",
        });
      }
    }

    // ----------------------------------------------------
    // 3. UPLOAD
    // ----------------------------------------------------
    case "upload": {
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          error: "Méthode non autorisée. Utilisez POST.",
        });
      }

      try {
        const rawBody = req.body || {};
        const {
          idToken,
          storagePath,
          fileBase64,
          contentType,
          bucket = "afrigombo-media",
        } = rawBody;

        if (!idToken || !storagePath || !fileBase64) {
          return res.status(400).json({
            success: false,
            error: "Paramètres 'idToken', 'storagePath' et 'fileBase64' requis.",
          });
        }

        const adminUser = await authenticateAdmin(idToken);
        if (!adminUser) {
          return res.status(403).json({
            success: false,
            error: "Accès Super Fondateur refusé. Seul le Super Fondateur est autorisé.",
          });
        }

        if (fileBase64.length > 6 * 1024 * 1024) {
          return res.status(413).json({
            success: false,
            error: "Fichier trop volumineux (>6Mo base64).",
          });
        }

        const base64Clean = fileBase64.includes(",")
          ? fileBase64.split(",")[1]
          : fileBase64;
        const fileBuffer = Buffer.from(base64Clean, "base64");

        const { supabase, supabaseUrl } = getSupabaseClient();
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(storagePath, fileBuffer, {
            contentType: contentType || "application/octet-stream",
            upsert: true,
          });

        if (uploadError) {
          console.error("[ADMIN MEDIA UPLOAD ERROR]", uploadError);
          return res.status(500).json({
            success: false,
            error: uploadError.message || "Échec du téléversement Storage Supabase.",
          });
        }

        const { data: publicUrlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(storagePath);

        const publicUrl =
          publicUrlData?.publicUrl ||
          `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;

        return res.status(200).json({
          success: true,
          path: uploadData?.path || storagePath,
          publicUrl,
          message: "Média téléversé avec succès",
        });
      } catch (err: any) {
        console.error("[ADMIN MEDIA UPLOAD FATAL ERROR]", err);
        return res.status(500).json({
          success: false,
          error: err?.message || "Erreur interne du serveur lors du téléversement.",
        });
      }
    }

    default:
      return res.status(404).json({
        success: false,
        error: `Action média admin inconnue: ${actionParam}`,
      });
  }
}
