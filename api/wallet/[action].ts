import crypto from "crypto";

const FIREBASE_API_KEY =
  process.env.VITE_FIREBASE_API_KEY ||
  process.env.FIREBASE_API_KEY ||
  "AIzaSyC3eJm2GfUMxGUNGu7uZeIP9-rtcLRljNk";

const FIREBASE_PROJECT_ID =
  process.env.VITE_FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_PROJECT_ID ||
  "afrigombo";

// ==========================================
// 1. CRYPTO & TOKEN UTILITIES (AUTONOMOUS)
// ==========================================

export function hashPin(pin: string, salt: string, uid: string): string {
  const secretPayload = `AFRIGOMBO_PIN_SALT_v2:${uid}:${salt}:${pin}`;
  return crypto.createHash("sha256").update(secretPayload).digest("hex");
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

export async function verifyUserToken(idToken: string): Promise<{ uid: string; email: string } | null> {
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data.users && data.users.length > 0) {
      const user = data.users[0];
      return { uid: user.localId, email: (user.email || "").toLowerCase() };
    }
    return null;
  } catch (err) {
    console.error("[WALLET AUTH ERROR]", err);
    return null;
  }
}

// ==========================================
// 2. FIRESTORE REST PROTOCOL UTILITIES
// ==========================================

function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === "boolean") {
    return { booleanValue: val };
  }
  if (typeof val === "number") {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === "string") {
    return { stringValue: val };
  }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === "object") {
    return { mapValue: { fields: toFirestoreFields(val) } };
  }
  return { stringValue: String(val) };
}

function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  if (!obj || typeof obj !== "object") return fields;
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      fields[key] = toFirestoreValue(obj[key]);
    }
  }
  return fields;
}

function fromFirestoreValue(val: any): any {
  if (!val || typeof val !== "object") return null;
  if ("nullValue" in val) return null;
  if ("booleanValue" in val) return val.booleanValue;
  if ("integerValue" in val) return parseInt(val.integerValue, 10);
  if ("doubleValue" in val) return Number(val.doubleValue);
  if ("stringValue" in val) return val.stringValue;
  if ("timestampValue" in val) return val.timestampValue;
  if ("arrayValue" in val) {
    return (val.arrayValue?.values || []).map(fromFirestoreValue);
  }
  if ("mapValue" in val) {
    return fromFirestoreFields(val.mapValue?.fields || {});
  }
  return null;
}

function fromFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const obj: Record<string, any> = {};
  if (!fields) return obj;
  for (const key of Object.keys(fields)) {
    obj[key] = fromFirestoreValue(fields[key]);
  }
  return obj;
}

async function getFirestoreUserDoc(uid: string, idToken: string): Promise<Record<string, any> | null> {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

    const res = await fetch(url, { method: "GET", headers });
    if (res.status === 404) return null;
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[WALLET FIRESTORE READ] Status ${res.status}: ${errText}`);
      return null;
    }
    const doc = await res.json();
    return fromFirestoreFields(doc.fields || {});
  } catch (err) {
    console.error("[WALLET FIRESTORE READ EXCEPTION]", err);
    return null;
  }
}

async function patchFirestoreUserDoc(
  uid: string,
  data: Record<string, any>,
  idToken: string,
  fieldMasks?: string[]
): Promise<boolean> {
  try {
    let url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}`;
    const masks = fieldMasks || Object.keys(data);
    const queryParams = masks.map((m) => `updateMask.fieldPaths=${encodeURIComponent(m)}`).join("&");
    if (queryParams) {
      url += `?${queryParams}`;
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

    const res = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ fields: toFirestoreFields(data) }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[WALLET FIRESTORE PATCH ERROR] Status ${res.status}: ${errText}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[WALLET FIRESTORE PATCH EXCEPTION]", err);
    return false;
  }
}

async function createFirestoreDoc(
  collection: string,
  docId: string | null,
  data: Record<string, any>,
  idToken: string
): Promise<boolean> {
  try {
    let url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collection}`;
    if (docId) {
      url += `?documentId=${encodeURIComponent(docId)}`;
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ fields: toFirestoreFields(data) }),
    });

    return res.ok;
  } catch (err) {
    console.warn(`[WALLET FIRESTORE CREATE DOC EXCEPTION] on ${collection}`, err);
    return false;
  }
}

// ==========================================
// 3. MAIN SERVERLESS HANDLER
// ==========================================

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

// ==========================================
// 4. ACTION HANDLERS
// ==========================================

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
  const salt = generateSalt();
  const pinHash = hashPin(pin, salt, uid);
  const now = new Date().toISOString();
  const resolvedLength = typeof pinLength === "number" ? pinLength : pin.length;

  const updateSuccess = await patchFirestoreUserDoc(
    uid,
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
    idToken,
    ["walletSecurity", "paymentSettings"]
  );

  if (!updateSuccess) {
    return res.status(500).json({ success: false, error: "Erreur lors de l'enregistrement du code PIN." });
  }

  // Audit log non-bloquant
  createFirestoreDoc(
    "admin_audit_logs",
    null,
    {
      uid,
      type: "MODIFICATION_PIN",
      result: "SUCCESS",
      details: "Création initiale du PIN Wallet (REST Serverless)",
      timestamp: now,
    },
    idToken
  ).catch(() => {});

  return res.status(200).json({ success: true, message: "Code PIN configuré avec succès." });
}

// 2. VERIFY-PIN
async function handleVerifyPin(req: any, res: any) {
  const { idToken, pin, action = "SENSITIVE_OP" } = req.body || {};
  if (!idToken || !pin) {
    return res.status(400).json({ success: false, error: "Paramètres manquants (idToken et pin requis)." });
  }

  const authUser = await verifyUserToken(idToken);
  if (!authUser) {
    return res.status(401).json({ success: false, error: "Session invalide ou expirée." });
  }

  const { uid } = authUser;
  const userData = await getFirestoreUserDoc(uid, idToken);

  if (!userData) {
    return res.status(404).json({ success: false, error: "Profil utilisateur introuvable." });
  }

  const sec = userData.walletSecurity || {};

  if (!sec.pinHash || !sec.pinSalt) {
    return res.status(400).json({ result: "PIN_NOT_CONFIGURED", error: "Aucun code PIN configuré." });
  }

  if (sec.pinResetRequested) {
    return res.status(403).json({ result: "PIN_RESET_PENDING", error: "Une réinitialisation du PIN est en attente." });
  }

  if (sec.lockedUntil) {
    const lockTime = new Date(sec.lockedUntil).getTime();
    const now = Date.now();
    if (lockTime > now) {
      const minsLeft = Math.ceil((lockTime - now) / 60000);
      return res.status(403).json({
        result: "PIN_LOCKED",
        error: `Wallet verrouillé. Réessayez dans ${minsLeft} minute(s).`,
        lockedMinutesRemaining: minsLeft,
      });
    }
  }

  const computedHash = hashPin(pin, sec.pinSalt, uid);

  if (computedHash === sec.pinHash) {
    const updatedSec = {
      ...sec,
      failedPinAttempts: 0,
      lockedUntil: null,
      lastAuthSensitiveAt: new Date().toISOString(),
    };

    await patchFirestoreUserDoc(uid, { walletSecurity: updatedSec }, idToken, ["walletSecurity"]);

    const sessionToken = `wsess_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    createFirestoreDoc(
      "wallet_sessions",
      uid,
      {
        token: sessionToken,
        uid,
        action,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
      },
      idToken
    ).catch(() => {});

    return res.status(200).json({ success: true, sessionToken });
  }

  // Échec PIN
  const currentAttempts = (sec.failedPinAttempts || 0) + 1;
  let lockedUntil: string | null = null;
  let lockMins = 0;

  if (currentAttempts >= 5) {
    lockMins = 60;
    lockedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  } else if (currentAttempts >= 3) {
    lockMins = 15;
    lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  }

  const updatedSec = {
    ...sec,
    failedPinAttempts: currentAttempts,
    lastFailedAttemptAt: new Date().toISOString(),
    lockedUntil: lockedUntil,
  };

  await patchFirestoreUserDoc(uid, { walletSecurity: updatedSec }, idToken, ["walletSecurity"]);

  const remaining = 5 - currentAttempts;

  return res.status(401).json({
    result: lockedUntil ? "PIN_LOCKED" : "PIN_INVALID",
    error: lockedUntil ? `Trop d'échecs. Wallet verrouillé pour ${lockMins} mins.` : "Code PIN incorrect.",
    attemptsRemaining: remaining > 0 ? remaining : 0,
    lockedMinutesRemaining: lockMins,
  });
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
  const userData = await getFirestoreUserDoc(uid, idToken);

  if (!userData) {
    return res.status(404).json({ success: false, error: "Profil utilisateur introuvable." });
  }

  const sec = userData.walletSecurity || {};

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

  const updatedSec = {
    ...sec,
    pinConfigured: true,
    pinHash: newPinHash,
    pinSalt: newSalt,
    pinLength: newPin.length,
    pinUpdatedAt: now,
    failedPinAttempts: 0,
    lockedUntil: null,
    pinResetRequested: false,
    pinStatus: "CONFIGURED",
  };

  const paymentSettings = {
    ...(userData.paymentSettings || {}),
    pinEnabled: true,
    pinConfigured: true,
  };

  const updateSuccess = await patchFirestoreUserDoc(
    uid,
    { walletSecurity: updatedSec, paymentSettings },
    idToken,
    ["walletSecurity", "paymentSettings"]
  );

  if (!updateSuccess) {
    return res.status(500).json({ success: false, error: "Erreur lors de la mise à jour du code PIN." });
  }

  createFirestoreDoc(
    "admin_audit_logs",
    null,
    {
      uid,
      type: "MODIFICATION_PIN",
      result: "SUCCESS",
      details: "Modification sécurisée du PIN Wallet (REST Serverless)",
      timestamp: now,
    },
    idToken
  ).catch(() => {});

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
  const userData = await getFirestoreUserDoc(uid, idToken);

  if (!userData) {
    return res.status(404).json({ success: false, error: "Profil utilisateur introuvable." });
  }

  const sec = userData.walletSecurity || {};

  if (!sec.pinHash || !sec.pinSalt) {
    return res.status(400).json({ success: false, error: "Aucun PIN configuré." });
  }

  const computedCurrent = hashPin(currentPin, sec.pinSalt, uid);
  if (computedCurrent !== sec.pinHash) {
    return res.status(401).json({ success: false, error: "Le code PIN actuel est incorrect." });
  }

  const updatedSec = {
    ...sec,
    pinConfigured: false,
    pinStatus: "NOT_CONFIGURED",
    pinHash: null,
    pinSalt: null,
    failedPinAttempts: 0,
    lockedUntil: null,
  };

  const paymentSettings = {
    ...(userData.paymentSettings || {}),
    pinEnabled: false,
  };

  const updateSuccess = await patchFirestoreUserDoc(
    uid,
    { walletSecurity: updatedSec, paymentSettings },
    idToken,
    ["walletSecurity", "paymentSettings"]
  );

  if (!updateSuccess) {
    return res.status(500).json({ success: false, error: "Erreur lors de la désactivation du code PIN." });
  }

  createFirestoreDoc(
    "admin_audit_logs",
    null,
    {
      uid,
      type: "DESACTIVATION_PIN",
      result: "SUCCESS",
      details: "Désactivation du PIN Wallet (REST Serverless)",
      timestamp: new Date().toISOString(),
    },
    idToken
  ).catch(() => {});

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
  const userData = await getFirestoreUserDoc(uid, idToken);

  const sec = userData?.walletSecurity || {};
  const now = new Date().toISOString();

  const updatedSec = {
    ...sec,
    pinResetRequested: true,
    saoAssistancePending: true,
    pinStatus: "RESET_PENDING",
  };

  const updateSuccess = await patchFirestoreUserDoc(uid, { walletSecurity: updatedSec }, idToken, ["walletSecurity"]);

  if (!updateSuccess) {
    return res.status(500).json({ success: false, error: "Erreur lors de la demande de réinitialisation." });
  }

  createFirestoreDoc(
    "support_tickets",
    null,
    {
      userId: uid,
      userEmail: email || "",
      subject: "Demande de réinitialisation du code PIN Wallet",
      type: "SECURITY_PIN_RESET",
      status: "OPEN",
      priority: "HIGH",
      description: reason,
      createdAt: now,
    },
    idToken
  ).catch(() => {});

  createFirestoreDoc(
    "admin_audit_logs",
    null,
    {
      uid,
      type: "DEMANDE_RESET_PIN",
      result: "PENDING",
      details: `Demande assistance Super Fondateur SAO pour reset PIN: ${reason}`,
      timestamp: now,
    },
    idToken
  ).catch(() => {});

  return res.status(200).json({
    success: true,
    message: "Demande de réinitialisation transmise au Support Super Fondateur.",
  });
}
