import { verifyUserToken, getAdminFirestoreInstance } from "../_firebaseHelper";

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

  const { idToken, reason = "Demande utilisateur" } = req.body || {};
  if (!idToken) {
    return res.status(401).json({ success: false, error: "Authentification requise." });
  }

  try {
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
  } catch (err: any) {
    console.error("[WALLET REQUEST-RESET ERROR]", err);
    return res.status(500).json({ success: false, error: err?.message || "Erreur lors de la demande de réinitialisation." });
  }
}
