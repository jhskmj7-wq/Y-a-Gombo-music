import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export type ActivityType = 
  | "CONNEXION" 
  | "DÉCONNEXION" 
  | "MODIFICATION_PROFIL" 
  | "PUBLICATION" 
  | "GOMBO_CREE" 
  | "GOMBO_ACCEPTE" 
  | "CANDIDATURE" 
  | "MESSAGE" 
  | "ACHAT" 
  | "DEPENSE_GAWA" 
  | "GAIN_GAWA" 
  | "RETRAIT" 
  | "TRANSFERT" 
  | "LOT_GAGNE" 
  | "LANCEMENT_ROUE" 
  | "MODIFICATION_PIN" 
  | "TENTATIVE_PIN_ECHOUEE" 
  | "WALLET_VERROUILLE" 
  | "WALLET_DEVERROUILLE" 
  | "REINITIALISATION_PIN" 
  | "CHANGEMENT_FOURNISSEUR_AUTH" 
  | "SUSPENSION" 
  | "REACTIVATION";

export async function logAdminAction(payload: {
  adminUid: string;
  adminEmail: string;
  action: string;
  targetUserId?: string;
  reason?: string;
  oldValue?: any;
  newValue?: any;
  transactionId?: string;
}) {
  try {
    await addDoc(collection(db, "admin_audit_logs"), {
      ...payload,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Failed to write to admin_audit_logs:", err);
  }
}

export async function logUserActivity(payload: {
  uid: string;
  type: ActivityType;
  result: "SUCCESS" | "FAILED" | "LOCKED" | "RESET_REQUESTED" | "ADMIN_ACTION";
  details?: string;
  context?: Record<string, any>;
}) {
  try {
    // Write to user_activity_logs collection
    await addDoc(collection(db, "user_activity_logs"), {
      uid: payload.uid,
      type: payload.type,
      result: payload.result,
      details: payload.details || "",
      context: payload.context || {},
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Failed to write user_activity_logs:", err);
  }
}

