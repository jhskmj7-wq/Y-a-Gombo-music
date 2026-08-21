// TEST D'ISOLATION ABSOLU : AUCUN IMPORT EXTERNE NI HELPER
// import { verifyUserToken, generateSalt, hashPin, getAdminFirestoreInstance } from "../_firebaseHelper";

export default async function handler(req: any, res: any) {
  try {
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

    // Support multiple Vercel dynamic routing formats & query params
    let action = req.query?.action;
    if (!action && req.url) {
      const cleanUrl = req.url.split("?")[0].replace(/\/+$/, "");
      const urlParts = cleanUrl.split("/");
      action = urlParts[urlParts.length - 1];
    }

    if (Array.isArray(action)) {
      action = action[0];
    }

    if (action) {
      action = String(action).trim().toLowerCase();
    }

    switch (action) {
      case "set-pin":
        return await handleSetPin(req, res);
      case "verify-pin":
        return await handleVerifyPin(req, res);
      case "change-pin":
        return await handleChangePin(req, res);
      case "disable-pin":
        return await handleDisablePin(req, res);
      case "request-reset":
        return await handleRequestReset(req, res);
      default:
        return res.status(404).json({
          success: false,
          error: `Action wallet inconnue ou non fournie: '${action}'. Actions valides: set-pin, verify-pin, change-pin, disable-pin, request-reset.`,
          debugReceived: {
            queryAction: req.query?.action,
            url: req.url,
            resolvedAction: action,
          },
        });
    }
  } catch (err: any) {
    console.error("[WALLET ACTION FATAL ERROR]", err);
    return res.status(500).json({
      success: false,
      error: err?.message || String(err),
      stack: err?.stack,
      type: err?.name || "UnhandledServerError",
    });
  }
}

// 1. SET-PIN (TEST SANS IMPORT)
async function handleSetPin(req: any, res: any) {
  return res.status(200).json({
    success: true,
    debug: "no import test",
    action: "set-pin",
    message: "Le fichier s'exécute sans aucun import externe",
  });
}

// 2. VERIFY-PIN (TEST SANS IMPORT)
async function handleVerifyPin(req: any, res: any) {
  return res.status(200).json({
    success: true,
    debug: "no import test",
    action: "verify-pin",
    message: "Le fichier s'exécute sans aucun import externe",
  });
}

// 3. CHANGE-PIN (TEST SANS IMPORT)
async function handleChangePin(req: any, res: any) {
  return res.status(200).json({
    success: true,
    debug: "no import test",
    action: "change-pin",
    message: "Le fichier s'exécute sans aucun import externe",
  });
}

// 4. DISABLE-PIN (TEST SANS IMPORT)
async function handleDisablePin(req: any, res: any) {
  return res.status(200).json({
    success: true,
    debug: "no import test",
    action: "disable-pin",
    message: "Le fichier s'exécute sans aucun import externe",
  });
}

// 5. REQUEST-RESET (TEST SANS IMPORT)
async function handleRequestReset(req: any, res: any) {
  return res.status(200).json({
    success: true,
    debug: "no import test",
    action: "request-reset",
    message: "Le fichier s'exécute sans aucun import externe",
  });
}
