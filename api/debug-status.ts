export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY ||
      "";
    const supabaseConfigured = Boolean(supabaseKey && supabaseKey.trim() !== "");

    let firebaseAdminConfigured = false;
    try {
      const adminAppModule = await import("firebase-admin/app");
      const adminAuthModule = await import("firebase-admin/auth");
      if (adminAppModule.getApps().length === 0) {
        adminAppModule.initializeApp({
          projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "afrigombo",
        });
      }
      firebaseAdminConfigured = Boolean(adminAuthModule.getAuth());
    } catch (_) {
      firebaseAdminConfigured = false;
    }

    const routesRegistered = [
      "GET /api/debug-status",
      "GET /api/health",
      "POST /api/wallet/set-pin",
      "POST /api/wallet/verify-pin",
      "POST /api/wallet/change-pin",
      "POST /api/wallet/disable-pin",
      "POST /api/wallet/request-reset",
      "POST /api/analyze-image",
      "POST /api/admin/media/upload",
      "POST /api/admin/media/delete",
      "POST /api/user/avatar/upload",
      "POST /api/user/cover/upload",
      "POST /api/admin/reset-environment"
    ];

    return res.status(200).json({
      status: "ok",
      supabaseConfigured,
      firebaseAdminConfigured,
      routesRegistered
    });
  } catch (err: any) {
    return res.status(500).json({
      status: "error",
      error: err?.message || "Erreur interne lors de la vérification du statut."
    });
  }
}
