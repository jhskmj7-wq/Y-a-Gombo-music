import { db } from "./firebase";
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore";
import { gomboDB } from "../firebase";

export type BetaTransactionStatus = 
  | "en_attente_de_paiement"
  | "en_attente_validation"
  | "fonds_bloqués"
  | "fonds_liberes"
  | "litige_ouvert"
  | "refuse"
  | "verification_demandee";

export interface BetaTransaction {
  id: string;
  contractId?: string;
  gomboId?: string;
  gomboTitle?: string;
  promoterId: string;
  promoterName: string;
  artistId: string;
  artistName: string;
  amount: number;
  status: BetaTransactionStatus;
  createdAt: string;
  updatedAt?: string;
  type?: string;
  notes?: string;
  paymentMethod?: string;
}

/**
 * Creates a new Beta transaction in Firestore `transactions` collection.
 */
export async function createBetaTransaction(payload: {
  contractId?: string;
  gomboId?: string;
  gomboTitle?: string;
  promoterId: string;
  promoterName: string;
  artistId: string;
  artistName: string;
  amount: number;
  notes?: string;
}): Promise<string> {
  const now = new Date().toISOString();
  const txData = {
    contractId: payload.contractId || "",
    gomboId: payload.gomboId || "",
    gomboTitle: payload.gomboTitle || "Dépôt de Cachet Bêta",
    promoterId: payload.promoterId,
    promoterName: payload.promoterName || "Promoteur AFRIGOMBO",
    artistId: payload.artistId,
    artistName: payload.artistName || "Artiste Virtuose",
    amount: payload.amount,
    status: "en_attente_de_paiement" as BetaTransactionStatus,
    type: "beta_escrow_deposit",
    notes: payload.notes || "Initialisation dépôt Bêta assisté",
    createdAt: now,
    updatedAt: now,
    timestamp: Date.now()
  };

  const docRef = await addDoc(collection(db, "transactions"), txData);
  const txId = docRef.id;

  // Sync back document ID in Firestore
  await updateDoc(docRef, { id: txId });

  // Create real-time notification for promoter
  try {
    await addDoc(collection(db, "notifications"), {
      userId: payload.promoterId,
      title: "🛡️ Dépôt Bêta Initié",
      body: `Votre transaction de ${payload.amount.toLocaleString()} FCFA pour ${payload.artistName} est en attente de paiement assisté.`,
      type: "escrow_beta",
      transactionId: txId,
      read: false,
      createdAt: now
    });
  } catch (err) {
    console.warn("Notification error:", err);
  }

  return txId;
}

/**
 * Step 1: Promoter clicks "Continuer".
 * Updates status to `en_attente_validation` and prepares support assistance message.
 */
export async function proceedToSupportAssistance(
  transactionId: string,
  promoterId: string,
  promoterName: string,
  artistName: string,
  amount: number
): Promise<void> {
  const now = new Date().toISOString();
  const txRef = doc(db, "transactions", transactionId);

  await updateDoc(txRef, {
    status: "en_attente_validation",
    updatedAt: now,
    notes: "Paiement en cours d'accompagnement par l'équipe AFRIGOMBO"
  });

  // Log in support_messages for official team visibility
  try {
    await addDoc(collection(db, "support_messages"), {
      transactionId,
      promoterId,
      promoterName,
      artistName,
      amount,
      message: `[DÉPÔT BÊTA] Demande d'accompagnement de paiement pour ${amount.toLocaleString()} FCFA. Promoteur: ${promoterName}, Artiste: ${artistName}.`,
      status: "pending_verification",
      createdAt: now
    });
  } catch (err) {
    console.warn("Support message log error:", err);
  }

  // Notify Admin Command Center
  try {
    await addDoc(collection(db, "notifications"), {
      userId: "admin_command_center",
      title: "🔔 Nouvelle transaction Bêta à valider",
      body: `${promoterName} demande la validation du dépôt de ${amount.toLocaleString()} FCFA pour ${artistName}.`,
      type: "admin_transaction_pending",
      transactionId,
      read: false,
      createdAt: now
    });
  } catch (err) {
    console.warn("Admin notification error:", err);
  }
}

/**
 * Step 2: Founder / Admin validates the deposit (`Valider le dépôt`).
 * Sets status to `fonds_bloqués`, locks escrow and contract in Firestore.
 */
export async function validateBetaDeposit(
  transactionId: string,
  adminName: string = "Fondateur / Admin"
): Promise<void> {
  const now = new Date().toISOString();
  const txRef = doc(db, "transactions", transactionId);
  const txSnap = await getDoc(txRef);

  if (!txSnap.exists()) {
    throw new Error("Transaction non trouvée dans Firestore.");
  }

  const txData = txSnap.data() as BetaTransaction;

  // 1. Update transaction status
  await updateDoc(txRef, {
    status: "fonds_bloqués",
    validatedBy: adminName,
    validatedAt: now,
    updatedAt: now,
    notes: "Fonds bloqués et sécurisés dans le coffre-fort AFRIGOMBO (Bêta)."
  });

  // 2. If contractId exists, update contract & escrow status
  if (txData.contractId) {
    try {
      const contractRef = doc(db, "contracts", txData.contractId);
      await updateDoc(contractRef, {
        status: "payment_held",
        escrowStatus: "fonds_bloqués",
        updatedAt: now
      });

      const escrowRef = doc(db, "escrow", txData.contractId);
      await setDoc(escrowRef, {
        contractId: txData.contractId,
        amount: txData.amount,
        status: "locked",
        validatedBy: adminName,
        validatedAt: now,
        updatedAt: now
      }, { merge: true });
    } catch (e) {
      console.warn("Contract/Escrow sync warning:", e);
    }
  }

  // 3. Real-time notifications for both promoter and artist
  const notifications = [
    {
      userId: txData.promoterId,
      title: "🔒 Dépôt Sécurisé Validé !",
      body: `Le dépôt de ${txData.amount.toLocaleString()} FCFA pour ${txData.artistName} est validé. Les fonds sont sécurisés en séquestre.`,
      type: "escrow_locked",
      transactionId,
      read: false,
      createdAt: now
    },
    {
      userId: txData.artistId,
      title: "🎉 Cachet Sécurisé dans le Coffre !",
      body: `Le promoteur ${txData.promoterName} a consigné votre cachet de ${txData.amount.toLocaleString()} FCFA sur AFRIGOMBO. Vous pouvez effectuer la prestation en toute sérénité.`,
      type: "escrow_locked",
      transactionId,
      read: false,
      createdAt: now
    }
  ];

  for (const notif of notifications) {
    try {
      if (notif.userId) {
        await addDoc(collection(db, "notifications"), notif);
      }
    } catch (err) {
      console.warn("Notification dispatch error:", err);
    }
  }
}

/**
 * Refuse Beta deposit (`Refuser`).
 */
export async function refuseBetaDeposit(
  transactionId: string,
  reason: string = "Dépôt refusé par l'administration"
): Promise<void> {
  const now = new Date().toISOString();
  const txRef = doc(db, "transactions", transactionId);
  const txSnap = await getDoc(txRef);

  if (!txSnap.exists()) return;
  const txData = txSnap.data() as BetaTransaction;

  await updateDoc(txRef, {
    status: "refuse",
    refusalReason: reason,
    updatedAt: now
  });

  if (txData.contractId) {
    try {
      const contractRef = doc(db, "contracts", txData.contractId);
      await updateDoc(contractRef, {
        status: "cancelled",
        updatedAt: now
      });
    } catch (e) {
      console.warn("Contract status update error:", e);
    }
  }

  // Notify promoter
  try {
    await addDoc(collection(db, "notifications"), {
      userId: txData.promoterId,
      title: "❌ Transaction Bêta Refusée",
      body: `Votre transaction de ${txData.amount.toLocaleString()} FCFA a été refusée. Raison : ${reason}`,
      type: "escrow_refused",
      transactionId,
      read: false,
      createdAt: now
    });
  } catch (err) {
    console.warn("Notification error:", err);
  }
}

/**
 * Request verification (`Demander une vérification`).
 */
export async function requestBetaVerification(
  transactionId: string,
  note: string = "Vérification complémentaire requise"
): Promise<void> {
  const now = new Date().toISOString();
  const txRef = doc(db, "transactions", transactionId);
  const txSnap = await getDoc(txRef);

  if (!txSnap.exists()) return;
  const txData = txSnap.data() as BetaTransaction;

  await updateDoc(txRef, {
    status: "verification_demandee",
    notes: note,
    updatedAt: now
  });

  try {
    await addDoc(collection(db, "notifications"), {
      userId: txData.promoterId,
      title: "🔍 Vérification Requise pour votre Dépôt",
      body: `L'équipe AFRIGOMBO demande une vérification complémentaire : ${note}`,
      type: "escrow_verification",
      transactionId,
      read: false,
      createdAt: now
    });
  } catch (err) {
    console.warn("Notification error:", err);
  }
}

/**
 * Step 6: Release Cachet (`Libérer le cachet`).
 * Sets status to `fonds_liberes`, credits artist wallet in Firestore.
 */
export async function releaseBetaCachet(
  transactionId: string,
  adminName: string = "Fondateur / Admin"
): Promise<void> {
  const now = new Date().toISOString();
  const txRef = doc(db, "transactions", transactionId);
  const txSnap = await getDoc(txRef);

  if (!txSnap.exists()) {
    throw new Error("Transaction non trouvée dans Firestore.");
  }

  const txData = txSnap.data() as BetaTransaction;

  // 1. Update transaction status
  await updateDoc(txRef, {
    status: "fonds_liberes",
    releasedBy: adminName,
    releasedAt: now,
    updatedAt: now
  });

  // 2. Call gomboDB releaseEscrow if contractId is present
  if (txData.contractId) {
    try {
      await gomboDB.releaseEscrow(txData.contractId);
    } catch (e) {
      console.warn("Escrow release helper call warning:", e);
    }
  } else if (txData.artistId) {
    // Manually add available funds to artist if no contract ID
    try {
      const artistRef = doc(db, "users", txData.artistId);
      const artistSnap = await getDoc(artistRef);
      if (artistSnap.exists()) {
        const artistData = artistSnap.data();
        const currentDisponible = artistData.wallet?.soldeDisponible ?? 0;
        await setDoc(artistRef, {
          wallet: {
            soldeDisponible: currentDisponible + txData.amount
          },
          revenue: (artistData.revenue ?? 0) + txData.amount
        }, { merge: true });
      }
    } catch (e) {
      console.warn("Direct artist wallet credit warning:", e);
    }
  }

  // 3. Real-time notifications
  const notifications = [
    {
      userId: txData.artistId,
      title: "💰 Cachet Libéré sur votre Solde !",
      body: `Le montant de ${txData.amount.toLocaleString()} FCFA a été libéré sur votre Solde Disponible AFRIGOMBO.`,
      type: "escrow_released",
      transactionId,
      read: false,
      createdAt: now
    },
    {
      userId: txData.promoterId,
      title: "✅ Prestation Clôturée avec Succès",
      body: `Le cachet de ${txData.amount.toLocaleString()} FCFA pour ${txData.artistName} a été transmis à l'artiste. Merci de votre confiance !`,
      type: "escrow_released",
      transactionId,
      read: false,
      createdAt: now
    }
  ];

  for (const notif of notifications) {
    try {
      if (notif.userId) {
        await addDoc(collection(db, "notifications"), notif);
      }
    } catch (err) {
      console.warn("Notification error:", err);
    }
  }
}

/**
 * Open dispute (`Ouvrir un litige`).
 */
export async function openBetaDispute(
  transactionId: string,
  reason: string = "Litige ouvert sur la prestation"
): Promise<void> {
  const now = new Date().toISOString();
  const txRef = doc(db, "transactions", transactionId);
  const txSnap = await getDoc(txRef);

  if (!txSnap.exists()) return;
  const txData = txSnap.data() as BetaTransaction;

  await updateDoc(txRef, {
    status: "litige_ouvert",
    disputeReason: reason,
    updatedAt: now
  });

  if (txData.contractId) {
    try {
      const contractRef = doc(db, "contracts", txData.contractId);
      await updateDoc(contractRef, {
        status: "dispute",
        disputeReason: reason,
        updatedAt: now
      });
    } catch (e) {
      console.warn("Contract dispute update warning:", e);
    }
  }

  // Real-time notifications
  const notifs = [
    {
      userId: txData.promoterId,
      title: "⚠️ Litige Ouvert sur le Dépôt",
      body: `Un litige a été ouvert concernant la transaction de ${txData.amount.toLocaleString()} FCFA. L'équipe médiation AFRIGOMBO vous contacte.`,
      type: "escrow_dispute",
      transactionId,
      read: false,
      createdAt: now
    },
    {
      userId: txData.artistId,
      title: "⚠️ Litige Ouvert sur la Prestation",
      body: `Un litige a été signalé sur la prestation. Les fonds restent sécurisés en séquestre pendant l'arbitrage.`,
      type: "escrow_dispute",
      transactionId,
      read: false,
      createdAt: now
    }
  ];

  for (const notif of notifs) {
    try {
      if (notif.userId) {
        await addDoc(collection(db, "notifications"), notif);
      }
    } catch (err) {
      console.warn("Notification error:", err);
    }
  }
}
