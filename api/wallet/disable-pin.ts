import { verifyUserToken, hashPin, getAdminFirestoreInstance } from "../_firebaseHelper";

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

  const { idToken, currentPin } = req.body || {};
  if (!idToken || !currentPin) {
    return res.status(400).json({ success: false, error: "Paramètres manquants (idToken et currentPin requis)." });
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
  } catch (err: any) {
    console.error("[WALLET DISABLE-PIN ERROR]", err);
    return res.status(500).json({ success: false, error: err?.message || "Erreur lors de la désactivation du PIN." });
  }
}
