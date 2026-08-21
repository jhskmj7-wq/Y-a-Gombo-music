import { verifyUserToken, generateSalt, hashPin, getAdminFirestoreInstance } from "../_firebaseHelper";

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

// 1. SET-PIN
async function handleSetPin(req: any, res: any) {
  const { idToken, pin, pinLength } = req.body || {};
  if (!idToken || !pin) {
    return res.status(400).json({ success: false, error: "Paramètres manquants (idToken et pin requis)." });
  }

  const authUser = await verifyUserToken(idToken);
  if (!authUser) {
    return res.status(401).json({ success: false, error: "Session invalide ou expirée." });
  }

  const { uid } = authUser;
  const adminDb = await getAdminFirestoreInstance();

  if (!adminDb) {
    return res.status(503).json({ success: false, error: "Service de base de données temporairement indisponible." });
  }

  const salt = generateSalt();
  const pinHash = hashPin(pin, salt, uid);
  const now = new Date().toISOString();
  const resolvedLength = typeof pinLength === "number" ? pinLength : pin.length;

  await adminDb.collection("users").doc(uid).set(
    {
      walletSecurity: {
        pinConfigured: true,
        pinHash,
        pinSalt: salt,
        pinLength: resolvedLength,
        pinCreatedAt: now,
        pinUpdatedAt: now,
        failedPinAttempts: 0,
        lockedUntil: null,
        lastFailedAttemptAt: null,
        pinResetRequested: false,
        pinStatus: "CONFIGURED",
      },
      paymentSettings: {
        pinEnabled: true,
        pinConfigured: true,
      },
    },
    { merge: true }
  );

  try {
    await adminDb.collection("admin_audit_logs").add({
      uid,
      type: "MODIFICATION_PIN",
      result: "SUCCESS",
      details: "Création initiale du PIN Wallet (Serverless)",
      timestamp: now,
    });
  } catch {
    // Non-blocking
  }

  return res.status(200).json({ success: true, message: "Code PIN configuré avec succès." });
}

// 2. VERIFY-PIN
async function handleVerifyPin(req: any, res: any) {
  const { idToken, pin, action = "SENSITIVE_OP" } = req.body || {};
  if (!idToken || !pin) {
    return res.status(400).json({ success: false, error: "Paramètres manquants (idToken et pin requis)." });
  }

  // --- TEST MINIMAL D'ISOLATION FIRESTORE ---
  // On teste si l'accès à verifyUserToken fonctionne et on bypasse getAdminFirestoreInstance()
  const authUser = await verifyUserToken(idToken);
  if (!authUser) {
    return res.status(401).json({ success: false, error: "Session invalide ou expirée." });
  }

  return res.status(200).json({
    success: true,
    debug: "firestore bypass test",
    uid: authUser.uid,
    email: authUser.email,
    requestedAction: action,
    message: "Le module et l'authentification ont fonctionné sans crash ! Firestore est bypassé.",
  });
  // ------------------------------------------
}

// 3. CHANGE-PIN
async function handleChangePin(req: any, res: any) {
  const { idToken, currentPin, newPin } = req.body || {};
  if (!idToken || !currentPin || !newPin) {
    return res.status(400).json({ success: false, error: "Paramètres manquants (idToken, currentPin et newPin requis)." });
  }

  const authUser = await verifyUserToken(idToken);
  if (!authUser) {
    return res.status(401).json({ success: false, error: "Session invalide ou expirée." });
  }

  const { uid } = authUser;
  const adminDb = await getAdminFirestoreInstance();

  if (!adminDb) {
    return res.status(503).json({ success: false, error: "Service de base de données temporairement indisponible." });
  }

  const userDoc = await adminDb.collection("users").doc(uid).get();
  if (!userDoc.exists) {
    return res.status(404).json({ success: false, error: "Utilisateur introuvable." });
  }

  const data = userDoc.data();
  const sec = data?.walletSecurity || {};

  if (!sec.pinHash || !sec.pinSalt) {
    return res.status(400).json({ success: false, error: "Aucun PIN configuré." });
  }

  const computedCurrent = hashPin(currentPin, sec.pinSalt, uid);
  if (computedCurrent !== sec.pinHash) {
    return res.status(401).json({ success: false, error: "L'ancien code PIN est incorrect." });
  }

  const newSalt = generateSalt();
  const newPinHash = hashPin(newPin, newSalt, uid);
  const now = new Date().toISOString();

  await adminDb.collection("users").doc(uid).update({
    "walletSecurity.pinConfigured": true,
    "walletSecurity.pinHash": newPinHash,
    "walletSecurity.pinSalt": newSalt,
    "walletSecurity.pinUpdatedAt": now,
    "walletSecurity.failedPinAttempts": 0,
    "walletSecurity.lockedUntil": null,
    "walletSecurity.pinResetRequested": false,
    "walletSecurity.pinStatus": "CONFIGURED",
    "paymentSettings.pinEnabled": true,
  });

  try {
    await adminDb.collection("admin_audit_logs").add({
      uid,
      type: "MODIFICATION_PIN",
      result: "SUCCESS",
      details: "Modification sécurisée du PIN Wallet (Serverless)",
      timestamp: now,
    });
  } catch {
    // Non-blocking
  }

  return res.status(200).json({ success: true, message: "Code PIN modifié avec succès." });
}

// 4. DISABLE-PIN
async function handleDisablePin(req: any, res: any) {
  const { idToken, currentPin } = req.body || {};
  if (!idToken || !currentPin) {
    return res.status(400).json({ success: false, error: "Paramètres manquants (idToken et currentPin requis)." });
  }

  const authUser = await verifyUserToken(idToken);
  if (!authUser) {
    return res.status(401).json({ success: false, error: "Session invalide ou expirée." });
  }

  const { uid } = authUser;
  const adminDb = await getAdminFirestoreInstance();

  if (!adminDb) {
    return res.status(503).json({ success: false, error: "Service de base de données temporairement indisponible." });
  }

  const userDoc = await adminDb.collection("users").doc(uid).get();
  if (!userDoc.exists) {
    return res.status(404).json({ success: false, error: "Utilisateur introuvable." });
  }

  const data = userDoc.data();
  const sec = data?.walletSecurity || {};

  if (!sec.pinHash || !sec.pinSalt) {
    return res.status(400).json({ success: false, error: "Aucun PIN configuré." });
  }

  const computedCurrent = hashPin(currentPin, sec.pinSalt, uid);
  if (computedCurrent !== sec.pinHash) {
    return res.status(401).json({ success: false, error: "Le code PIN actuel est incorrect." });
  }

  const now = new Date().toISOString();

  await adminDb.collection("users").doc(uid).update({
    "walletSecurity.pinConfigured": false,
    "walletSecurity.pinStatus": "NOT_CONFIGURED",
    "walletSecurity.pinHash": null,
    "walletSecurity.pinSalt": null,
    "walletSecurity.failedPinAttempts": 0,
    "walletSecurity.lockedUntil": null,
    "paymentSettings.pinEnabled": false,
  });

  try {
    await adminDb.collection("admin_audit_logs").add({
      uid,
      type: "DESACTIVATION_PIN",
      result: "SUCCESS",
      details: "Désactivation du PIN Wallet (Serverless)",
      timestamp: now,
    });
  } catch {
    // Non-blocking
  }

  return res.status(200).json({ success: true, message: "Code PIN désactivé avec succès." });
}

// 5. REQUEST-RESET
async function handleRequestReset(req: any, res: any) {
  const { idToken, reason = "Demande utilisateur" } = req.body || {};
  if (!idToken) {
    return res.status(401).json({ success: false, error: "Authentification requise." });
  }

  const authUser = await verifyUserToken(idToken);
  if (!authUser) {
    return res.status(401).json({ success: false, error: "Session invalide ou expirée." });
  }

  const { uid, email } = authUser;
  const adminDb = await getAdminFirestoreInstance();

  if (!adminDb) {
    return res.status(503).json({ success: false, error: "Service de base de données temporairement indisponible." });
  }

  const now = new Date().toISOString();

  await adminDb.collection("users").doc(uid).update({
    "walletSecurity.pinResetRequested": true,
    "walletSecurity.saoAssistancePending": true,
    "walletSecurity.pinStatus": "RESET_PENDING",
  });

  try {
    await adminDb.collection("support_tickets").add({
      userId: uid,
      userEmail: email || "",
      subject: "Demande de réinitialisation du code PIN Wallet",
      type: "SECURITY_PIN_RESET",
      status: "OPEN",
      priority: "HIGH",
      description: reason,
      createdAt: now,
    });

    await adminDb.collection("admin_audit_logs").add({
      uid,
      type: "DEMANDE_RESET_PIN",
      result: "PENDING",
      details: `Demande assistance Super Fondateur SAO pour reset PIN: ${reason}`,
      timestamp: now,
    });
  } catch {
    // Non-blocking
  }

  return res.status(200).json({
    success: true,
    message: "Demande de réinitialisation transmise au Support Super Fondateur.",
  });
}
