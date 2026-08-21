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

  const { idToken, currentPin, newPin } = req.body || {};
  if (!idToken || !currentPin || !newPin) {
    return res.status(400).json({ success: false, error: "Paramètres manquants (idToken, currentPin et newPin requis)." });
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
  } catch (err: any) {
    console.error("[WALLET CHANGE-PIN ERROR]", err);
    return res.status(500).json({ success: false, error: err?.message || "Erreur lors du changement de PIN." });
  }
}
