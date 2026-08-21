import { verifyUserToken, getAdminFirestoreInstance } from "../_firebaseHelper";

const PROTECTED_FOUNDER_EMAILS = ["jhs.kmj7@gmail.com"];
const RESET_PHRASE = "RESET AFRIGOMBO TEST";

const COLLECTIONS_TO_RESET = [
  "gombos",
  "applications",
  "renforts",
  "renfort_applications",
  "social_posts",
  "contract_reviews",
  "security_alerts",
  "contracts",
  "conversations",
  "messages",
  "bypass_attempts",
  "notifications",
  "subscriptions",
  "payments",
  "support_messages",
  "tickets_support",
  "disputes",
  "litiges",
  "kyc_requests",
  "studio_market_reviews",
  "casting_calls",
  "casting_applications",
  "voice_announcements",
  "music_groups",
  "user_reports",
  "group_invitations",
  "group_members",
  "certificates",
  "user_activities",
  "academy_guides",
  "ticket_events",
  "studio_market",
  "purchased_tickets",
  "certification_requests",
  "verification_requests",
  "boosts",
  "waiting_features",
  "reservations",
  "beta_feedback",
  "wheel_spins",
  "wheel_history",
  "transactions",
  "betaTransactions",
  "walletTransactions",
  "walletRefunds",
  "walletAdjustments",
  "commissions",
  "escrow",
  "withdrawals",
  "user_notifications",
  "admin_logs",
  "admin_audit_logs",
  "adminAuditLogs",
  "adminActions",
  "bypassAttempts",
  "security_incidents",
  "security_logs",
  "bug_reports",
  "bugReports",
  "reports",
  "wheel_lots",
  "wheels",
  "wheelPriceHistory",
  "wheel_spins_extra",
  "wheelExtraSpins",
  "avatarPurchases",
  "avatarRewards",
  "avatarGifts",
];

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(200).json({ success: true });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée. Utilisez POST." });
  }

  const { idToken, confirmationPhrase, dryRun = false } = req.body || {};

  if (!idToken) return res.status(401).json({ error: "Authentification requise." });

  if (!dryRun && confirmationPhrase !== RESET_PHRASE) {
    return res.status(400).json({ error: "Phrase de confirmation incorrecte. Tapez 'RESET AFRIGOMBO TEST'." });
  }

  try {
    const authUser = await verifyUserToken(idToken);
    if (!authUser) {
      return res.status(401).json({ error: "Session invalide ou expirée." });
    }

    const { uid, email } = authUser;
    const adminDb = await getAdminFirestoreInstance();

    if (!adminDb) {
      return res.status(503).json({ error: "Service Firebase Admin non initialisé." });
    }

    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists) return res.status(403).json({ error: "Accès refusé. Profil utilisateur introuvable." });

    const userData = userDoc.data();
    const isSuperFounder =
      userData?.isFounder === true ||
      userData?.superFounder === true ||
      userData?.role === "admin" ||
      PROTECTED_FOUNDER_EMAILS.includes(email);

    if (!isSuperFounder) {
      return res.status(403).json({ error: "Seuls les Super Fondateurs ont l'autorisation de réinitialiser l'environnement." });
    }

    console.log(`[RESET PHASE 1 SERVERLESS] ${dryRun ? "AUDIT (DryRun)" : "EXECUTION"} par ${email} (${uid})`);

    const report = {
      usersPreserved: 0,
      foundersProtected: 0,
      walletsReset: 0,
      transactionsDeleted: 0,
      messagesDeleted: 0,
      publicationsDeleted: 0,
      notificationsDeleted: 0,
      historiesDeleted: 0,
      lotsDeleted: 0,
      totalDocumentsDeleted: 0,
      totalDocumentsEstimated: 0,
      collectionsCleared: {} as Record<string, number>,
      errors: [] as string[],
      isDryRun: dryRun,
      timestamp: new Date().toISOString(),
    };

    const usersSnap = await adminDb.collection("users").get();
    report.usersPreserved = usersSnap.size;

    let batch = adminDb.batch();
    let batchOpsCount = 0;

    for (const uDoc of usersSnap.docs) {
      const data = uDoc.data();
      const isProtected = PROTECTED_FOUNDER_EMAILS.includes(data.email) || data.isFounder === true || data.superFounder === true;

      if (isProtected) {
        report.foundersProtected++;
      }
      report.walletsReset++;

      if (!dryRun) {
        batch.update(uDoc.ref, {
          balance: 0,
          walletBalance: 0,
          gawaBalance: 0,
          totalRevenue: 0,
          revenus: 0,
          depenses: 0,
          gains: 0,
          transactionsCount: 0,
          wallet: {
            soldeDisponible: 0,
            soldeBloque: 0,
            soldeGawa: 0,
            revenusMois: 0,
            gainsMensuels: 0,
            economiesPremium: 0,
            revenus: 0,
            depenses: 0,
            niveauWallet: "Standard",
            devise: "FCFA",
          },
          reputationScore: 100,
          updatedAt: new Date().toISOString(),
        });
        batchOpsCount++;

        if (batchOpsCount >= 400) {
          await batch.commit();
          batch = adminDb.batch();
          batchOpsCount = 0;
        }
      }
    }
    if (!dryRun && batchOpsCount > 0) {
      await batch.commit();
    }

    const publicationCols = ["gombos", "social_posts", "posts", "casting_calls", "casting_applications", "renforts", "renfort_applications", "renfortApplications", "studio_market", "ticket_events"];
    const transactionCols = ["transactions", "betaTransactions", "walletTransactions", "walletRefunds", "walletAdjustments", "commissions", "escrow", "withdrawals", "payments"];
    const messageCols = ["conversations", "messages", "support_messages", "supportMessages", "supportLogs", "tickets_support", "afrigombo_supports"];
    const notificationCols = ["notifications", "user_notifications"];
    const historyCols = ["user_activities", "user_activity_logs", "admin_logs", "admin_audit_logs", "adminAuditLogs", "adminActions", "bypass_attempts", "bypassAttempts", "security_alerts", "security_incidents", "security_logs", "beta_feedback", "bug_reports", "bugReports", "user_reports", "reports"];
    const lotCols = ["wheels", "wheel_spins", "wheel_lots", "wheel_history", "wheelPriceHistory", "wheel_spins_extra", "wheelExtraSpins", "avatarPurchases", "avatarRewards", "avatarGifts"];

    for (const colName of COLLECTIONS_TO_RESET) {
      try {
        const colRef = adminDb.collection(colName);
        let deletedInCol = 0;

        while (true) {
          const snap = await colRef.limit(400).get();
          if (snap.empty) break;

          const count = snap.size;
          report.totalDocumentsEstimated += count;

          if (!dryRun) {
            const delBatch = adminDb.batch();
            snap.docs.forEach((docSnap: any) => {
              delBatch.delete(docSnap.ref);
            });
            await delBatch.commit();
            deletedInCol += count;
          } else {
            deletedInCol += count;
            break;
          }

          if (count < 400) break;
        }

        report.collectionsCleared[colName] = deletedInCol;
        if (!dryRun) {
          report.totalDocumentsDeleted += deletedInCol;
          if (publicationCols.includes(colName)) report.publicationsDeleted += deletedInCol;
          if (transactionCols.includes(colName)) report.transactionsDeleted += deletedInCol;
          if (messageCols.includes(colName)) report.messagesDeleted += deletedInCol;
          if (notificationCols.includes(colName)) report.notificationsDeleted += deletedInCol;
          if (historyCols.includes(colName)) report.historiesDeleted += deletedInCol;
          if (lotCols.includes(colName)) report.lotsDeleted += deletedInCol;
        }
      } catch (err: any) {
        report.errors.push(`Erreur sur la collection ${colName}: ${err?.message || err}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: dryRun
        ? "Audit de remise à zéro Phase 1 exécuté avec succès (DryRun)."
        : "Remise à zéro Phase 1 exécutée avec succès.",
      report,
    });
  } catch (err: any) {
    console.error("[RESET ENV SERVERLESS ERROR]", err);
    return res.status(500).json({ error: err?.message || "Erreur interne lors du reset environnement." });
  }
}
