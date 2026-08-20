import { createClient } from "@supabase/supabase-js";

const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "AIzaSyC3eJm2GfUMxGUNGu7uZeIP9-rtcLRljNk";
const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "afrigombo";

async function verifyIdTokenREST(idToken: string): Promise<{ uid: string; email: string } | null> {
  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      console.error("[AVATAR UPLOAD SERVERLESS] REST Auth Verification failed, status:", response.status);
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
    console.error("[AVATAR UPLOAD SERVERLESS] REST Auth Exception:", err);
    return null;
  }
}

async function verifyWithFirebaseAdmin(idToken: string): Promise<{ uid: string; email: string } | null> {
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
    return null;
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");

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
    const { idToken, storagePath, fileBase64, contentType, bucket = "afrigombo-media" } = req.body || {};

    if (!idToken) {
      return res.status(401).json({ success: false, error: "Non authentifié (token manquant)." });
    }

    if (!storagePath || !fileBase64) {
      return res.status(400).json({ success: false, error: "Paramètres 'storagePath' et 'fileBase64' requis." });
    }

    let authUser = await verifyWithFirebaseAdmin(idToken);
    if (!authUser) {
      authUser = await verifyIdTokenREST(idToken);
    }

    if (!authUser) {
      return res.status(401).json({ success: false, error: "Session invalide ou expirée." });
    }

    const { uid } = authUser;

    if (!storagePath.includes(uid) || !storagePath.toLowerCase().includes("avatar")) {
      return res.status(403).json({ success: false, error: "Accès refusé. Chemin de stockage non autorisé pour cet utilisateur." });
    }

    const base64Clean = fileBase64.includes(",") ? fileBase64.split(",")[1] : fileBase64;
    const fileBuffer = Buffer.from(base64Clean, "base64");

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://qefnkgtstcisplbrjcxy.supabase.co";
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      "";

    const serverSupabase = createClient(supabaseUrl, supabaseKey);

    const { data: uploadData, error: uploadError } = await serverSupabase.storage
      .from(bucket)
      .upload(storagePath, fileBuffer, {
        contentType: contentType || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("[AVATAR UPLOAD SERVERLESS ERROR]", uploadError);
      return res.status(500).json({ success: false, error: uploadError.message || "Échec du téléversement de l'avatar." });
    }

    const { data: publicUrlData } = serverSupabase.storage.from(bucket).getPublicUrl(storagePath);
    const publicUrl = publicUrlData?.publicUrl || `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;

    return res.status(200).json({
      success: true,
      url: publicUrl,
      publicUrl: publicUrl,
      path: uploadData?.path || storagePath,
      bucket,
      message: "Avatar téléversé avec succès"
    });
  } catch (err: any) {
    console.error("[AVATAR UPLOAD SERVERLESS FATAL ERROR]", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Erreur interne lors du téléversement de l'avatar."
    });
  }
}
