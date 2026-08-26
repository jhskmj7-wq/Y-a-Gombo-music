import { createClient } from "@supabase/supabase-js";

const FIREBASE_API_KEY =
  process.env.VITE_FIREBASE_API_KEY ||
  process.env.FIREBASE_API_KEY ||
  "AIzaSyC3eJm2GfUMxGUNGu7uZeIP9-rtcLRljNk";

const FIREBASE_PROJECT_ID =
  process.env.VITE_FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_PROJECT_ID ||
  "afrigombo";

// Safe Firebase ID Token Verification (Admin SDK + Google Identity Toolkit REST fallback)
async function verifyUserToken(idToken: string): Promise<{ uid: string; email: string } | null> {
  if (!idToken || typeof idToken !== "string") return null;

  // Attempt 1: Firebase Admin SDK
  try {
    const adminAppModule = await import("firebase-admin/app");
    const adminAuthModule = await import("firebase-admin/auth");

    if (adminAppModule.getApps().length === 0) {
      const saKey = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (saKey && saKey.trim() !== "") {
        try {
          const parsed = typeof saKey === "string" ? JSON.parse(saKey) : saKey;
          adminAppModule.initializeApp({
            credential: adminAppModule.cert(parsed),
            projectId: FIREBASE_PROJECT_ID,
          });
        } catch {
          adminAppModule.initializeApp({ projectId: FIREBASE_PROJECT_ID });
        }
      } else {
        adminAppModule.initializeApp({ projectId: FIREBASE_PROJECT_ID });
      }
    }

    const adminAuth = adminAuthModule.getAuth();
    const decoded = await adminAuth.verifyIdToken(idToken);
    return {
      uid: decoded.uid,
      email: (decoded.email || "").toLowerCase(),
    };
  } catch (_adminErr) {
    // Admin SDK unavailable or failed, fallback to REST
  }

  // Attempt 2: REST Fallback
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
      console.error("[SIGNED URL SERVERLESS] REST Auth Verification failed, status:", response.status);
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
    console.error("[SIGNED URL SERVERLESS] REST Auth Exception:", err);
    return null;
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");

  // Handle CORS Preflight
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
    const body = req.body || {};
    const { idToken, storagePath, bucket = "afrigombo-media" } = body;

    if (!idToken) {
      return res.status(401).json({
        success: false,
        error: "Non authentifié (jeton d'authentification manquant)."
      });
    }

    if (!storagePath || typeof storagePath !== "string") {
      return res.status(400).json({
        success: false,
        error: "Paramètre 'storagePath' requis."
      });
    }

    // 1. Verification systematique du jeton Firebase
    const authUser = await verifyUserToken(idToken);
    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: "Session invalide ou expirée. Veuillez vous reconnecter."
      });
    }

    const uid = authUser.uid;

    // 2. Verrouillage strict du chemin reels/${uid}/...
    const isAllowedPath = storagePath.startsWith(`reels/${uid}/`) || storagePath.startsWith(`video/${uid}/`);
    if (!isAllowedPath) {
      console.warn(`[SIGNED URL FORBIDDEN] Tentative d'écriture non autorisée par ${uid} sur: ${storagePath}`);
      return res.status(403).json({
        success: false,
        error: "Accès refusé. Vous ne pouvez téléverser que dans votre propre dossier utilisateur (reels/UID/...)."
      });
    }

    // 3. Supabase Client Initialization
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
      return res.status(500).json({
        success: false,
        error: "Configuration serveur Supabase incomplète."
      });
    }

    const serverSupabase = createClient(supabaseUrl, supabaseKey);

    // 4. Creation de l'URL d'upload signee
    const { data, error } = await serverSupabase.storage
      .from(bucket)
      .createSignedUploadUrl(storagePath);

    if (error || !data?.signedUrl) {
      console.error("[SIGNED URL SERVERLESS ERROR]", error);
      return res.status(500).json({
        success: false,
        error: error?.message || "Échec de génération de l'URL signée."
      });
    }

    const { data: publicUrlData } = serverSupabase.storage.from(bucket).getPublicUrl(storagePath);
    const publicUrl = publicUrlData?.publicUrl || `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;

    console.log(`[SIGNED URL SERVERLESS SUCCESS] Pour UID: ${uid} -> ${storagePath}`);

    return res.status(200).json({
      success: true,
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path || storagePath,
      publicUrl,
      bucket
    });
  } catch (err: any) {
    console.error("[SIGNED URL SERVERLESS UNHANDLED ERROR]", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Erreur interne du serveur."
    });
  }
}
