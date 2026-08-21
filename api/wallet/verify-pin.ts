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

  const { idToken, pin, action = "SENSITIVE_OP" } = req.body || {};
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

    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: "Utilisateur introuvable." });
    }

    const data = userDoc.data();
    const sec = data?.walletSecurity || {};

    if (!sec.pinHash || !sec.pinSalt) {
      return res.status(400).json({ result: "PIN_NOT_CONFIGURED", error: "Aucun code PIN configuré." });
    }

    if (sec.pinResetRequested) {
      return res.status(403).json({ result: "PIN_RESET_PENDING", error: "Une réinitialisation du PIN est en attente." });
    }

    // Check lock status
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
      // SUCCESSFUL PIN VERIFICATION
      await adminDb.collection("users").doc(uid).update({
        "walletSecurity.failedPinAttempts": 0,
        "walletSecurity.lockedUntil": null,
        "walletSecurity.lastAuthSensitiveAt": new Date().toISOString(),
      });

      // Generate a secure session token
      const sessionToken = `wsess_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      try {
        await adminDb.collection("wallet_sessions").doc(uid).set({
          token: sessionToken,
          uid,
          action,
          expiresAt: expiresAt.toISOString(),
          createdAt: new Date().toISOString(),
        });
      } catch {
        // Non-blocking
      }

      return res.status(200).json({ success: true, sessionToken });
    }

    // FAILED PIN ATTEMPT
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

    await adminDb.collection("users").doc(uid).update({
      "walletSecurity.failedPinAttempts": currentAttempts,
      "walletSecurity.lastFailedAttemptAt": new Date().toISOString(),
      "walletSecurity.lockedUntil": lockedUntil,
    });

    const remaining = 5 - currentAttempts;

    return res.status(401).json({
      result: lockedUntil ? "PIN_LOCKED" : "PIN_INVALID",
      error: lockedUntil ? `Trop d'échecs. Wallet verrouillé pour ${lockMins} mins.` : "Code PIN incorrect.",
      attemptsRemaining: remaining > 0 ? remaining : 0,
      lockedMinutesRemaining: lockMins,
    });
  } catch (err: any) {
    console.error("[WALLET VERIFY-PIN ERROR]", err);
    return res.status(500).json({ success: false, error: err?.message || "Erreur serveur de sécurité." });
  }
}
