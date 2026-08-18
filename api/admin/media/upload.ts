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
      console.error("[SERVERLESS MEDIA UPLOAD] REST Auth Verification failed, status:", response.status);
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
    console.error("[SERVERLESS MEDIA UPLOAD] REST Auth Exception:", err);
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
    console.warn("[SERVERLESS MEDIA UPLOAD] Firestore REST Role Check warning:", err);
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
    console.warn("[SERVERLESS MEDIA UPLOAD] Firebase Admin SDK unavailable/failed, using REST fallback:", err);
    return null;
  }
}

export default async function handler(req: any, res: any) {
  // Step 1: Entry into function
  console.log("[SERVERLESS MEDIA UPLOAD] [STEP 1] Entering handler function");

  res.setHeader("Content-Type", "application/json");

  // Step 2: HTTP Method check
  console.log(`[SERVERLESS MEDIA UPLOAD] [STEP 2] HTTP Method: ${req.method}`);
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
    // Check request body size limit safety
    const rawBody = req.body;
    if (!rawBody || typeof rawBody !== "object") {
      console.error("[SERVERLESS MEDIA UPLOAD] Invalid request body format");
      return res.status(400).json({ success: false, error: "Corps de la requête invalide." });
    }

    const { idToken, storagePath, fileBase64, contentType, bucket = "afrigombo-media" } = rawBody;

    // Step 3: Check idToken
    console.log(`[SERVERLESS MEDIA UPLOAD] [STEP 3] idToken present: ${Boolean(idToken)}`);
    if (!idToken) {
      return res.status(401).json({
        success: false,
        error: "Session administrateur invalide (jeton d'authentification manquant)."
      });
    }

    if (!storagePath || !fileBase64) {
      return res.status(400).json({
        success: false,
        error: "Paramètres 'storagePath' et 'fileBase64' requis."
      });
    }

    // Step 4 & 5: verifyIdToken (via Admin SDK with REST fallback)
    console.log("[SERVERLESS MEDIA UPLOAD] [STEP 4 & 5] Verifying ID Token...");
    let authUser = await verifyWithFirebaseAdmin(idToken);
    if (!authUser) {
      console.log("[SERVERLESS MEDIA UPLOAD] Verifying ID Token with Firebase REST API...");
      authUser = await verifyIdTokenREST(idToken);
    }

    if (!authUser) {
      console.error("[SERVERLESS MEDIA UPLOAD] Token verification failed for provided idToken");
      return res.status(401).json({
        success: false,
        error: "Session administrateur invalide ou expirée."
      });
    }

    // Step 6: Verify Super Founder authorization
    const { uid, email } = authUser;
    console.log(`[SERVERLESS MEDIA UPLOAD] [STEP 6] Checking Super Founder authorization for email: ${email}, uid: ${uid}`);

    let isSuperFounder = PROTECTED_FOUNDER_EMAILS.includes(email);
    if (!isSuperFounder) {
      isSuperFounder = await checkFirestoreUserRoleREST(uid);
    }

    if (!isSuperFounder) {
      console.error(`[SERVERLESS MEDIA UPLOAD] Access denied for user: ${email}`);
      return res.status(403).json({
        success: false,
        error: "Accès Super Fondateur refusé. Seul le Super Fondateur est autorisé."
      });
    }
    console.log("[SERVERLESS MEDIA UPLOAD] Super Founder access confirmed.");

    // Step 7: Check presence of fileBase64 & check body payload size
    console.log(`[SERVERLESS MEDIA UPLOAD] [STEP 7] fileBase64 present. Length: ${fileBase64.length}`);
    if (fileBase64.length > 6 * 1024 * 1024) {
      console.error("[SERVERLESS MEDIA UPLOAD] File payload too large (>6MB base64)");
      return res.status(413).json({
        success: false,
        error: "Fichier trop volumineux"
      });
    }

    // Step 8: Convert Base64 -> Buffer
    console.log("[SERVERLESS MEDIA UPLOAD] [STEP 8] Converting Base64 to Buffer...");
    const base64Clean = fileBase64.includes(",") ? fileBase64.split(",")[1] : fileBase64;
    const fileBuffer = Buffer.from(base64Clean, "base64");
    console.log(`[SERVERLESS MEDIA UPLOAD] Buffer created. Size: ${fileBuffer.length} bytes`);

    // Step 9: Environment variable checks & Supabase Client initialization
    console.log("[SERVERLESS MEDIA UPLOAD] [STEP 9] Checking Supabase Environment Variables...");
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://qefnkgtstcisplbrjcxy.supabase.co";
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      "";

    console.log(`[SERVERLESS MEDIA UPLOAD] Supabase URL exists: ${Boolean(supabaseUrl)}, Supabase Key exists: ${Boolean(supabaseKey)}`);

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
    console.log(`[SERVERLESS MEDIA UPLOAD] Initializing Supabase client for bucket: ${targetBucket}`);
    const serverSupabase = createClient(supabaseUrl, supabaseKey);

    // Step 10: Upload to Supabase Storage
    console.log(`[SERVERLESS MEDIA UPLOAD] [STEP 10] Uploading to Supabase Storage path: ${storagePath}...`);
    const { data: uploadData, error: uploadError } = await serverSupabase.storage
      .from(targetBucket)
      .upload(storagePath, fileBuffer, {
        contentType: contentType || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      console.error("[SERVERLESS MEDIA UPLOAD] [STEP 10 ERROR] Supabase upload failed:", uploadError);
      return res.status(500).json({
        success: false,
        error: uploadError.message || "Échec du téléversement Storage Supabase."
      });
    }

    // Step 11: Public URL Generation
    console.log("[SERVERLESS MEDIA UPLOAD] [STEP 11] Generating Public URL...");
    const { data: publicUrlData } = serverSupabase.storage.from(targetBucket).getPublicUrl(storagePath);
    const publicUrl = publicUrlData?.publicUrl || `${supabaseUrl}/storage/v1/object/public/${targetBucket}/${storagePath}`;
    console.log(`[SERVERLESS MEDIA UPLOAD] Public URL generated: ${publicUrl}`);

    // Step 12: Final JSON Response
    console.log("[SERVERLESS MEDIA UPLOAD] [STEP 12] Sending success response");
    return res.status(200).json({
      success: true,
      path: uploadData?.path || storagePath,
      publicUrl: publicUrl,
      message: "Média téléversé avec succès"
    });
  } catch (err: any) {
    console.error("[SERVERLESS MEDIA UPLOAD FATAL ERROR]", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Erreur interne du serveur lors du téléversement."
    });
  }
}
