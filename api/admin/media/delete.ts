import { createClient } from "@supabase/supabase-js";

// Protected Founder Emails
const PROTECTED_FOUNDER_EMAILS = ["jhs.kmj7@gmail.com"];

// Firebase Config Fallback for REST Auth
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "AIzaSyC3eJm2GfUMxGUNGu7uZeIP9-rtcLRljNk";
const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "afrigombo";

// Safe Firebase ID Token Verification via official REST API
async function verifyIdTokenREST(idToken: string): Promise<{ uid: string; email: string } | null> {
  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      console.error("[SERVERLESS MEDIA DELETE] REST Auth Verification failed, status:", response.status);
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
    console.error("[SERVERLESS MEDIA DELETE] REST Auth Exception:", err);
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
    console.warn("[SERVERLESS MEDIA DELETE] Firestore REST Role Check warning:", err);
    return false;
  }
}

// Dynamic Firebase Admin verification if module is available
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
    console.warn("[SERVERLESS MEDIA DELETE] Firebase Admin SDK unavailable/failed, using REST fallback:", err);
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
    const rawBody = req.body;
    if (!rawBody || typeof rawBody !== "object") {
      return res.status(400).json({ success: false, error: "Corps de la requête invalide." });
    }

    const { idToken, storagePath, bucket = "afrigombo-media" } = rawBody;

    if (!idToken || !storagePath) {
      return res.status(400).json({
        success: false,
        error: "Paramètres 'idToken' et 'storagePath' requis."
      });
    }

    let authUser = await verifyWithFirebaseAdmin(idToken);
    if (!authUser) {
      authUser = await verifyIdTokenREST(idToken);
    }

    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: "Session administrateur invalide ou expirée."
      });
    }

    const { uid, email } = authUser;
    let isSuperFounder = PROTECTED_FOUNDER_EMAILS.includes(email);
    if (!isSuperFounder) {
      isSuperFounder = await checkFirestoreUserRoleREST(uid);
    }

    if (!isSuperFounder) {
      return res.status(403).json({
        success: false,
        error: "Accès Super Fondateur refusé. Seul le Super Fondateur est autorisé."
      });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://qefnkgtstcisplbrjcxy.supabase.co";
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      "";

    if (!supabaseUrl) {
      return res.status(500).json({
        success: false,
        error: "Configuration serveur manquante : SUPABASE_URL"
      });
    }

    if (!supabaseKey) {
      return res.status(500).json({
        success: false,
        error: "Configuration serveur manquante : SUPABASE_SECRET_KEY"
      });
    }

    const targetBucket = bucket || "afrigombo-media";
    const serverSupabase = createClient(supabaseUrl, supabaseKey);

    const cleanPath = storagePath.replace(
      /^(?:https?:\/\/[^/]+\/storage\/v1\/object\/public\/[^/]+\/)/,
      ""
    );

    const { error: deleteError } = await serverSupabase.storage
      .from(targetBucket)
      .remove([cleanPath]);

    if (deleteError) {
      return res.status(500).json({
        success: false,
        error: deleteError.message || "Échec de suppression Storage Supabase."
      });
    }

    return res.status(200).json({
      success: true,
      path: cleanPath,
      message: "Média supprimé avec succès de Supabase Storage"
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Erreur interne lors de la suppression."
    });
  }
}
