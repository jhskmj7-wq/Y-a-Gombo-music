import { verifyUserToken, generateSalt, hashPin, getAdminFirestoreInstance } from "../_firebaseHelper";

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

  const { idToken, pin, pinLength } = req.body || {};
  if (!idToken || !pin) {
    return res.status(400).json({ success: false, error: "Paramètres manquants (idToken et pin requis)." });
  }

  try {
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
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Non-blocking audit log
    }

    return res.status(200).json({ success: true, message: "Code PIN configuré avec succès." });
  } catch (err: any) {
    console.error("[WALLET SET-PIN ERROR]", err);
    return res.status(500).json({ success: false, error: err?.message || "Erreur lors de la configuration du code PIN." });
  }
}
