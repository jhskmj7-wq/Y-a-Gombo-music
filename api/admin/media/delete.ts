import { initializeApp as initializeAdminApp, getApps as getAdminApps } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { createClient } from "@supabase/supabase-js";

function getAdminClients() {
  try {
    if (getAdminApps().length === 0) {
      initializeAdminApp({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "afrigombo",
      });
    }
    return {
      adminAuth: getAdminAuth(),
      adminDb: getAdminFirestore(),
    };
  } catch (err) {
    console.error("[SERVERLESS MEDIA DELETE] Error initializing Firebase Admin:", err);
    return { adminAuth: null, adminDb: null };
  }
}

const PROTECTED_FOUNDER_EMAILS = ["jhs.kmj7@gmail.com"];

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
    const { idToken, storagePath, bucket = "afrigombo-media" } = req.body || {};

    if (!idToken || !storagePath) {
      return res.status(400).json({
        success: false,
        error: "Paramètres 'idToken' et 'storagePath' requis."
      });
    }

    const { adminAuth, adminDb } = getAdminClients();
    if (!adminAuth) {
      return res.status(503).json({
        success: false,
        error: "Service Firebase Admin temporairement indisponible."
      });
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (authErr: any) {
      return res.status(401).json({
        success: false,
        error: "Session administrateur invalide ou expirée."
      });
    }

    const uid = decodedToken.uid;
    const email = (decodedToken.email || "").toLowerCase();

    let isSuperFounder = PROTECTED_FOUNDER_EMAILS.includes(email);

    if (!isSuperFounder && adminDb) {
      try {
        const userDoc = await adminDb.collection("users").doc(uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          isSuperFounder =
            userData?.isFounder === true ||
            userData?.superFounder === true ||
            userData?.role === "super_founder" ||
            userData?.role === "admin";
        }
      } catch (dbErr) {
        console.warn("[SERVERLESS MEDIA DELETE DB CHECK WARNING]", dbErr);
      }
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
      error: err.message || "Erreur interne lors de la suppression."
    });
  }
}
