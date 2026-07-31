import { db } from "./firebase";
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, 
  query, where, orderBy, onSnapshot 
} from "firebase/firestore";
import { PaymentEngine } from "./paymentEngine";

export type ContractStatus = 
  | "waiting_payment"
  | "funded"
  | "accepted"
  | "in_progress"
  | "completed"
  | "disputed"
  | "cancelled"
  | "refunded"
  | "generated"
  | "signed"
  | "payment_held"
  | "accepted_client"
  | "accepted_artist";

export interface ContractAttachment {
  id: string;
  type: "photo" | "video" | "audio" | "pdf";
  url: string;
  name: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ContractMessage {
  id: string;
  contractId: string;
  senderId: string;
  senderName: string;
  senderRole?: "promoter" | "artist" | "admin";
  text: string;
  attachments?: ContractAttachment[];
  createdAt: string;
}

export interface ContractDispute {
  id: string;
  contractId: string;
  raisedBy: string;
  raisedByName: string;
  reason: string;
  proofs?: ContractAttachment[];
  statut: "open" | "resolved" | "dismissed";
  resolution?: "refund_promoter" | "release_artist" | "dismissed";
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ContractData {
  id: string;
  promoterId: string;
  promoterName?: string;
  artistId: string;
  artistName?: string;
  publicationId?: string;
  titre: string;
  montant: number;
  commission: number;
  promoterCommission?: number;
  artistCommission?: number;
  netArtistAmount?: number;
  statut: ContractStatus;
  status?: string; // Backwards compatibility mapping
  escrowBalance: number;
  location?: string;
  commune?: string;
  eventDate?: string;
  eventTime?: string;
  createdAt: string;
  updatedAt: string;
  attachments?: ContractAttachment[];
}

/**
 * Calculates AFRIGOMBO escrow commissions automatically.
 * Standard: Promoter 2.5%, Musician 2.5% (Total 5%)
 * Premium: Promoter 1.5%, Musician 1.5% (Total 3%)
 */
export function calculateContractCommissions(
  montant: number,
  promoterIsPremium: boolean = false,
  artistIsPremium: boolean = false
) {
  const promoterRate = promoterIsPremium ? 0.015 : 0.025;
  const artistRate = artistIsPremium ? 0.015 : 0.025;

  const promoterCommission = Math.round(montant * promoterRate);
  const artistCommission = Math.round(montant * artistRate);
  const totalCommission = promoterCommission + artistCommission;
  const netArtistAmount = Math.max(0, montant - artistCommission);

  return {
    promoterRate,
    artistRate,
    promoterCommission,
    artistCommission,
    totalCommission,
    netArtistAmount
  };
}

/**
 * Create a new contract in `contracts/` collection
 */
export async function createAfrigomboContract(payload: {
  promoterId: string;
  promoterName: string;
  artistId: string;
  artistName: string;
  publicationId?: string;
  titre: string;
  montant: number;
  location?: string;
  commune?: string;
  eventDate?: string;
  eventTime?: string;
  promoterIsPremium?: boolean;
  artistIsPremium?: boolean;
}): Promise<string> {
  const now = new Date().toISOString();
  const comms = calculateContractCommissions(
    payload.montant, 
    payload.promoterIsPremium, 
    payload.artistIsPremium
  );

  const contractRef = doc(collection(db, "contracts"));
  const contractId = contractRef.id;

  const contractDoc: ContractData = {
    id: contractId,
    promoterId: payload.promoterId,
    promoterName: payload.promoterName || "Promoteur",
    artistId: payload.artistId,
    artistName: payload.artistName || "Artiste",
    publicationId: payload.publicationId || "",
    titre: payload.titre || "Prestation Artistique Gombo",
    montant: payload.montant,
    commission: comms.totalCommission,
    promoterCommission: comms.promoterCommission,
    artistCommission: comms.artistCommission,
    netArtistAmount: comms.netArtistAmount,
    statut: "waiting_payment",
    status: "waiting_payment",
    escrowBalance: 0,
    location: payload.location || "",
    commune: payload.commune || "",
    eventDate: payload.eventDate || "",
    eventTime: payload.eventTime || "",
    createdAt: now,
    updatedAt: now,
    attachments: []
  };

  await setDoc(contractRef, contractDoc);

  // Log contract event
  await logContractEvent(contractId, "created", "Création du contrat en attente de paiement", payload.promoterId);

  // Notify Musician
  await notifyUser(
    payload.artistId,
    "📜 Nouveau Contrat Proposé",
    `Le promoteur ${payload.promoterName} vous a proposé un contrat "${payload.titre}" pour ${payload.montant.toLocaleString("fr-FR")} FCFA. En attente de paiement.`,
    "contract_created",
    contractId
  );

  return contractId;
}

/**
 * Step 1: Promoter pays and funds the contract escrow.
 */
export async function payContractEscrow(
  contractId: string, 
  promoterUser: { uid: string; displayName?: string; email?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const contractRef = doc(db, "contracts", contractId);
    const contractSnap = await getDoc(contractRef);

    if (!contractSnap.exists()) {
      return { success: false, error: "Contrat introuvable dans Firestore." };
    }

    const cData = contractSnap.data() as ContractData;

    if (cData.statut !== "waiting_payment" && cData.status !== "waiting_payment" && cData.statut !== "generated") {
      return { success: false, error: "Ce contrat n'est pas en attente de paiement." };
    }

    const totalToPay = cData.montant + (cData.promoterCommission || 0);

    // 1. Debit promoter wallet
    const payRes = await PaymentEngine.processPayment({
      userId: promoterUser.uid,
      userName: promoterUser.displayName || cData.promoterName || "Promoteur",
      amount: totalToPay,
      module: "escrow_contract",
      reason: `Paiement Séquestre Contrat: ${cData.titre}`,
      metadata: { contractId }
    });

    if (!payRes.success) {
      return { 
        success: false, 
        error: payRes.error || `Solde insuffisant dans votre Wallet. Montant requis : ${totalToPay.toLocaleString("fr-FR")} FCFA` 
      };
    }

    const now = new Date().toISOString();

    // 2. Update contract status to funded
    await updateDoc(contractRef, {
      statut: "funded",
      status: "funded",
      escrowBalance: cData.montant,
      fundedAt: now,
      updatedAt: now
    });

    // 3. Log Escrow transaction
    const escrowTxRef = doc(collection(db, "escrowTransactions"));
    await setDoc(escrowTxRef, {
      id: escrowTxRef.id,
      contractId,
      promoterId: cData.promoterId,
      promoterName: cData.promoterName,
      artistId: cData.artistId,
      artistName: cData.artistName,
      amount: cData.montant,
      promoterCommission: cData.promoterCommission || 0,
      totalDebited: totalToPay,
      type: "funded",
      escrowBalance: cData.montant,
      createdAt: now,
      timestamp: Date.now()
    });

    // 4. Log Contract Event
    await logContractEvent(contractId, "funded", `Paiement de ${totalToPay.toLocaleString("fr-FR")} FCFA placé sous séquestre.`, promoterUser.uid);

    // 5. Real-time Notification for Artist
    await notifyUser(
      cData.artistId,
      "🛡️ Nouveau Contrat Financé !",
      `Le promoteur ${cData.promoterName} a sécurisé les fonds (${cData.montant.toLocaleString("fr-FR")} FCFA) sous séquestre AFRIGOMBO pour "${cData.titre}". Veuillez l'accepter.`,
      "contract_funded",
      contractId
    );

    return { success: true };
  } catch (err: any) {
    console.error("payContractEscrow error:", err);
    return { success: false, error: err.message || "Erreur lors du paiement séquestre." };
  }
}

/**
 * Step 2: Musician accepts the funded contract
 */
export async function acceptContract(
  contractId: string, 
  artistUser: { uid: string; displayName?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const contractRef = doc(db, "contracts", contractId);
    const contractSnap = await getDoc(contractRef);

    if (!contractSnap.exists()) {
      return { success: false, error: "Contrat introuvable." };
    }

    const cData = contractSnap.data() as ContractData;
    const now = new Date().toISOString();

    await updateDoc(contractRef, {
      statut: "accepted",
      status: "accepted",
      acceptedAt: now,
      updatedAt: now
    });

    await logContractEvent(contractId, "accepted", "Contrat accepté par le musicien.", artistUser.uid);

    await notifyUser(
      cData.promoterId,
      "✅ Contrat Accepté !",
      `L'artiste ${cData.artistName} a accepté le contrat "${cData.titre}". La mission est prête à commencer !`,
      "contract_accepted",
      contractId
    );

    return { success: true };
  } catch (err: any) {
    console.error("acceptContract error:", err);
    return { success: false, error: err.message || "Erreur lors de l'acceptation." };
  }
}

/**
 * Step 2b: Musician refuses contract -> Automatic Full Refund to Promoter's Wallet
 */
export async function refuseContract(
  contractId: string, 
  artistUser: { uid: string; displayName?: string },
  reason: string = "Refusé par le musicien"
): Promise<{ success: boolean; error?: string }> {
  try {
    const contractRef = doc(db, "contracts", contractId);
    const contractSnap = await getDoc(contractRef);

    if (!contractSnap.exists()) {
      return { success: false, error: "Contrat introuvable." };
    }

    const cData = contractSnap.data() as ContractData;
    const refundAmount = (cData.escrowBalance || cData.montant) + (cData.promoterCommission || 0);

    // Automatic Refund via Payment Engine
    const refundRes = await PaymentEngine.refundPayment({
      userId: cData.promoterId,
      amount: refundAmount,
      reason: `Remboursement contrat refusé/annulé : ${cData.titre} (${reason})`,
      adminEmail: "Système Escrow AFRIGOMBO"
    });

    const now = new Date().toISOString();

    await updateDoc(contractRef, {
      statut: "cancelled",
      status: "cancelled",
      escrowBalance: 0,
      cancellationReason: reason,
      updatedAt: now
    });

    // Log Escrow Transaction
    const escrowTxRef = doc(collection(db, "escrowTransactions"));
    await setDoc(escrowTxRef, {
      id: escrowTxRef.id,
      contractId,
      promoterId: cData.promoterId,
      amountRefunded: refundAmount,
      type: "refunded",
      reason,
      createdAt: now,
      timestamp: Date.now()
    });

    await logContractEvent(contractId, "cancelled", `Contrat refusé. Remboursement de ${refundAmount.toLocaleString("fr-FR")} FCFA crédité au Wallet du promoteur.`, artistUser.uid);

    await notifyUser(
      cData.promoterId,
      "↩️ Contrat Refusé & Remboursé",
      `L'artiste a décliné le contrat "${cData.titre}". Votre Wallet a été remboursé intégralement (${refundAmount.toLocaleString("fr-FR")} FCFA).`,
      "contract_refunded",
      contractId
    );

    return { success: true };
  } catch (err: any) {
    console.error("refuseContract error:", err);
    return { success: false, error: err.message || "Erreur lors du refus/remboursement." };
  }
}

/**
 * Step 3: Start Prestation (In Progress)
 */
export async function startContractPrestation(
  contractId: string, 
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const contractRef = doc(db, "contracts", contractId);
    const now = new Date().toISOString();

    await updateDoc(contractRef, {
      statut: "in_progress",
      status: "in_progress",
      startedAt: now,
      updatedAt: now
    });

    await logContractEvent(contractId, "in_progress", "Mission officiellement démarrée.", userId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Erreur lors du démarrage." };
  }
}

/**
 * Step 4: Complete Mission & Release Funds to Musician's Wallet
 */
export async function completeContractAndReleaseFunds(
  contractId: string,
  confirmedByUserId: string
): Promise<{ success: boolean; netArtistAmount?: number; error?: string }> {
  try {
    const contractRef = doc(db, "contracts", contractId);
    const contractSnap = await getDoc(contractRef);

    if (!contractSnap.exists()) {
      return { success: false, error: "Contrat introuvable." };
    }

    const cData = contractSnap.data() as ContractData;

    if (cData.statut === "completed" || cData.status === "completed") {
      return { success: false, error: "Le paiement de ce contrat a déjà été libéré." };
    }

    const netAmount = cData.netArtistAmount || Math.round(cData.montant * 0.975);
    const totalComms = cData.commission || Math.round(cData.montant * 0.05);

    // Credit net amount to Musician's Wallet via Payment Engine
    const adjustRes = await PaymentEngine.adminAdjustWallet({
      userId: cData.artistId,
      amount: netAmount,
      action: "credit",
      reason: `Cachet Libéré - Contrat: ${cData.titre}`,
      adminEmail: "Moteur Escrow AFRIGOMBO"
    });

    if (!adjustRes.success) {
      return { success: false, error: adjustRes.error || "Impossible de créditer le Wallet de l'artiste." };
    }

    const now = new Date().toISOString();

    // Update contract status
    await updateDoc(contractRef, {
      statut: "completed",
      status: "completed",
      escrowBalance: 0,
      releasedAt: now,
      updatedAt: now
    });

    // Record Escrow release transaction
    const escrowTxRef = doc(collection(db, "escrowTransactions"));
    await setDoc(escrowTxRef, {
      id: escrowTxRef.id,
      contractId,
      promoterId: cData.promoterId,
      artistId: cData.artistId,
      artistName: cData.artistName,
      montantInitial: cData.montant,
      netArtistAmount: netAmount,
      platformCommission: totalComms,
      type: "released",
      createdAt: now,
      timestamp: Date.now()
    });

    // Log Event
    await logContractEvent(contractId, "completed", `Mission terminée. Cachet de ${netAmount.toLocaleString("fr-FR")} FCFA libéré vers le Wallet de l'artiste.`, confirmedByUserId);

    // Notifications
    await notifyUser(
      cData.artistId,
      "💰 Cachet Libéré !",
      `Félicitations ! Le paiement de ${netAmount.toLocaleString("fr-FR")} FCFA pour "${cData.titre}" a été versé sur votre Wallet.`,
      "contract_released",
      contractId
    );

    await notifyUser(
      cData.promoterId,
      "✨ Mission Clôturée",
      `Le contrat "${cData.titre}" est validé et clôturé avec succès. Merci d'utiliser AFRIGOMBO !`,
      "contract_completed",
      contractId
    );

    return { success: true, netArtistAmount: netAmount };
  } catch (err: any) {
    console.error("completeContractAndReleaseFunds error:", err);
    return { success: false, error: err.message || "Erreur lors de la libération des fonds." };
  }
}

/**
 * Step 5: Raise a Dispute
 */
export async function openContractDispute(payload: {
  contractId: string;
  raisedBy: string;
  raisedByName: string;
  reason: string;
  proofs?: ContractAttachment[];
}): Promise<{ success: boolean; disputeId?: string; error?: string }> {
  try {
    const contractRef = doc(db, "contracts", payload.contractId);
    const contractSnap = await getDoc(contractRef);

    if (!contractSnap.exists()) {
      return { success: false, error: "Contrat introuvable." };
    }

    const cData = contractSnap.data() as ContractData;
    const now = new Date().toISOString();

    // Create dispute document
    const disputeRef = doc(collection(db, "contractDisputes"));
    const disputeId = disputeRef.id;

    const disputeDoc: ContractDispute = {
      id: disputeId,
      contractId: payload.contractId,
      raisedBy: payload.raisedBy,
      raisedByName: payload.raisedByName,
      reason: payload.reason,
      proofs: payload.proofs || [],
      statut: "open",
      createdAt: now,
      updatedAt: now
    };

    await setDoc(disputeRef, disputeDoc);

    // Update contract status
    await updateDoc(contractRef, {
      statut: "disputed",
      status: "disputed",
      updatedAt: now
    });

    await logContractEvent(payload.contractId, "disputed", `Litige ouvert par ${payload.raisedByName}: ${payload.reason}`, payload.raisedBy);

    // Notify opposing party & Super Founder
    const otherUserId = payload.raisedBy === cData.promoterId ? cData.artistId : cData.promoterId;
    await notifyUser(
      otherUserId,
      "🚨 Litige Ouvert sur un Contrat",
      `Un litige a été ouvert pour "${cData.titre}". L'équipe d'administration AFRIGOMBO va arbitrer l'affaire.`,
      "contract_disputed",
      payload.contractId
    );

    return { success: true, disputeId };
  } catch (err: any) {
    console.error("openContractDispute error:", err);
    return { success: false, error: err.message || "Erreur lors de l'ouverture du litige." };
  }
}

/**
 * Step 6: Arbitrate Dispute by Super Founder
 */
export async function arbitrateContractDispute(payload: {
  disputeId: string;
  contractId: string;
  resolution: "release_artist" | "refund_promoter";
  resolutionNotes: string;
  adminId: string;
  adminName: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const disputeRef = doc(db, "contractDisputes", payload.disputeId);
    const contractRef = doc(db, "contracts", payload.contractId);
    const contractSnap = await getDoc(contractRef);

    if (!contractSnap.exists()) {
      return { success: false, error: "Contrat introuvable." };
    }

    const cData = contractSnap.data() as ContractData;
    const now = new Date().toISOString();

    if (payload.resolution === "release_artist") {
      const res = await completeContractAndReleaseFunds(payload.contractId, payload.adminId);
      if (!res.success) return { success: false, error: res.error };
    } else {
      // Refund promoter
      const refundAmount = (cData.escrowBalance || cData.montant) + (cData.promoterCommission || 0);
      const refundRes = await PaymentEngine.refundPayment({
        userId: cData.promoterId,
        amount: refundAmount,
        reason: `Arbitrage Admin: ${payload.resolutionNotes}`,
        adminEmail: payload.adminName
      });

      if (!refundRes.success) return { success: false, error: refundRes.error };

      await updateDoc(contractRef, {
        statut: "refunded",
        status: "refunded",
        escrowBalance: 0,
        updatedAt: now
      });

      await notifyUser(
        cData.promoterId,
        "⚖️ Décision d'Arbitrage : Remboursement",
        `L'administration AFRIGOMBO a statué en votre faveur pour "${cData.titre}". Remboursement de ${refundAmount.toLocaleString("fr-FR")} FCFA crédité sur votre Wallet.`,
        "dispute_resolved",
        payload.contractId
      );

      await notifyUser(
        cData.artistId,
        "⚖️ Décision d'Arbitrage Clôturée",
        `Le litige sur "${cData.titre}" a été arbitré. Motif : ${payload.resolutionNotes}`,
        "dispute_resolved",
        payload.contractId
      );
    }

    // Update dispute doc
    await updateDoc(disputeRef, {
      statut: "resolved",
      resolution: payload.resolution,
      resolutionNotes: payload.resolutionNotes,
      resolvedBy: payload.adminName,
      resolvedAt: now,
      updatedAt: now
    });

    await logContractEvent(payload.contractId, "dispute_resolved", `Arbitrage Super Fondateur : ${payload.resolution} (${payload.resolutionNotes})`, payload.adminId);

    return { success: true };
  } catch (err: any) {
    console.error("arbitrateContractDispute error:", err);
    return { success: false, error: err.message || "Erreur lors de l'arbitrage." };
  }
}

/**
 * Send Private Message in Contract Salon (`contractMessages/`)
 */
export async function sendContractMessage(payload: {
  contractId: string;
  senderId: string;
  senderName: string;
  senderRole?: "promoter" | "artist" | "admin";
  text: string;
  attachments?: ContractAttachment[];
}): Promise<string> {
  const now = new Date().toISOString();
  const msgRef = doc(collection(db, "contractMessages"));
  const msgId = msgRef.id;

  const msgData: ContractMessage = {
    id: msgId,
    contractId: payload.contractId,
    senderId: payload.senderId,
    senderName: payload.senderName || "Utilisateur",
    senderRole: payload.senderRole || "promoter",
    text: payload.text || "",
    attachments: payload.attachments || [],
    createdAt: now
  };

  await setDoc(msgRef, msgData);

  // Update contract timestamp
  await updateDoc(doc(db, "contracts", payload.contractId), { updatedAt: now }).catch(() => {});

  return msgId;
}

/**
 * Log Event in `contractEvents/`
 */
export async function logContractEvent(contractId: string, type: string, label: string, createdBy: string) {
  try {
    const eventRef = doc(collection(db, "contractEvents"));
    await setDoc(eventRef, {
      id: eventRef.id,
      contractId,
      type,
      label,
      createdBy,
      createdAt: new Date().toISOString(),
      timestamp: Date.now()
    });
  } catch (err) {
    console.warn("logContractEvent failed:", err);
  }
}

/**
 * Real-time notification helper
 */
async function notifyUser(userId: string, title: string, body: string, type: string, contractId: string) {
  try {
    const notifRef = doc(collection(db, "notifications"));
    await setDoc(notifRef, {
      id: notifRef.id,
      userId,
      title,
      body,
      message: body,
      type,
      contractId,
      read: false,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn("notifyUser failed:", err);
  }
}
