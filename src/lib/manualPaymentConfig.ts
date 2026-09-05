import { doc, getDoc, setDoc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase";

export type ManualPaymentOperatorKey = "WAVE" | "ORANGE_MONEY" | "MTN_MOMO" | "MOOV_MONEY";

export interface ManualPaymentOperatorConfig {
  id: ManualPaymentOperatorKey;
  displayName: string;
  phoneNumber: string;
  enabled: boolean;
  color: string;
  updatedAt?: string;
  updatedBy?: string;
  updatedByEmail?: string;
}

export interface ManualPaymentAuditEntry {
  id: string;
  operatorId: ManualPaymentOperatorKey;
  operatorName: string;
  action: "enabled" | "disabled" | "number_updated" | "initialized";
  previousPhone?: string;
  newPhone?: string;
  previousEnabled?: boolean;
  newEnabled?: boolean;
  performedBy: string;
  performedByEmail: string;
  timestamp: string;
}

export interface ManualPaymentSettingsDoc {
  operators: Record<ManualPaymentOperatorKey, ManualPaymentOperatorConfig>;
  auditLog?: ManualPaymentAuditEntry[];
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_MANUAL_PAYMENT_OPERATORS: Record<ManualPaymentOperatorKey, ManualPaymentOperatorConfig> = {
  WAVE: {
    id: "WAVE",
    displayName: "Wave",
    phoneNumber: "+225 05 03 22 27 12",
    enabled: true,
    color: "#1DA1F2",
    updatedAt: new Date().toISOString(),
    updatedBy: "Fondateur AFRIGOMBO"
  },
  ORANGE_MONEY: {
    id: "ORANGE_MONEY",
    displayName: "Orange Money",
    phoneNumber: "+225 07 07 00 00 00",
    enabled: false,
    color: "#FF7900",
    updatedAt: new Date().toISOString(),
    updatedBy: "Système"
  },
  MTN_MOMO: {
    id: "MTN_MOMO",
    displayName: "MTN MoMo",
    phoneNumber: "+225 05 03 22 27 12",
    enabled: true,
    color: "#FFCC00",
    updatedAt: new Date().toISOString(),
    updatedBy: "Fondateur AFRIGOMBO"
  },
  MOOV_MONEY: {
    id: "MOOV_MONEY",
    displayName: "Moov Money",
    phoneNumber: "+225 01 01 00 00 00",
    enabled: false,
    color: "#006699",
    updatedAt: new Date().toISOString(),
    updatedBy: "Système"
  }
};

/**
 * Valide le format d'un numéro de téléphone ivoirien (10 chiffres locaux ou 12 avec l'indicatif 225)
 */
export function isValidIvorianPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 12 && digits.startsWith("225"));
}

/**
 * Formate un numéro de téléphone ivoirien au format international +225 XX XX XX XX XX
 */
export function formatIvorianPhoneNumber(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  let localDigits = digits;
  if (digits.length === 12 && digits.startsWith("225")) {
    localDigits = digits.slice(2);
  }
  if (localDigits.length === 10) {
    return `+225 ${localDigits.slice(0, 2)} ${localDigits.slice(2, 4)} ${localDigits.slice(4, 6)} ${localDigits.slice(6, 8)} ${localDigits.slice(8, 10)}`;
  }
  return phone.trim();
}

/**
 * Écoute en temps réel la configuration des moyens de paiement manuels
 */
export function subscribeToManualPaymentConfig(
  callback: (data: { 
    operators: Record<ManualPaymentOperatorKey, ManualPaymentOperatorConfig>;
    auditLog: ManualPaymentAuditEntry[];
    updatedAt?: string;
  }) => void
): () => void {
  if (!db) {
    callback({
      operators: DEFAULT_MANUAL_PAYMENT_OPERATORS,
      auditLog: []
    });
    return () => {};
  }

  const docRef = doc(db, "system_settings", "manual_payment_methods");
  const unsubscribe = onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data() as Partial<ManualPaymentSettingsDoc>;
      const mergedOperators = {
        ...DEFAULT_MANUAL_PAYMENT_OPERATORS,
        ...(data.operators || {})
      };
      callback({
        operators: mergedOperators,
        auditLog: data.auditLog || [],
        updatedAt: data.updatedAt
      });
    } else {
      callback({
        operators: DEFAULT_MANUAL_PAYMENT_OPERATORS,
        auditLog: []
      });
    }
  }, (err) => {
    console.warn("[MANUAL_PAYMENT_CONFIG] Sync notice:", err);
    callback({
      operators: DEFAULT_MANUAL_PAYMENT_OPERATORS,
      auditLog: []
    });
  });

  return unsubscribe;
}

/**
 * Met à jour un opérateur (activation/désactivation ou modification du numéro)
 */
export async function updateManualPaymentOperator(
  operatorId: ManualPaymentOperatorKey,
  updates: {
    phoneNumber?: string;
    enabled?: boolean;
  },
  adminUser: {
    uid?: string;
    displayName?: string;
    email?: string;
  }
): Promise<{ success: boolean; message: string }> {
  if (!db) {
    return { success: false, message: "Base de données non disponible." };
  }

  try {
    const docRef = doc(db, "system_settings", "manual_payment_methods");
    const snap = await getDoc(docRef);

    let currentData: ManualPaymentSettingsDoc = {
      operators: { ...DEFAULT_MANUAL_PAYMENT_OPERATORS },
      auditLog: []
    };

    if (snap.exists()) {
      currentData = {
        ...currentData,
        ...snap.data(),
        operators: {
          ...DEFAULT_MANUAL_PAYMENT_OPERATORS,
          ...(snap.data()?.operators || {})
        }
      };
    }

    const currentOp = currentData.operators[operatorId] || DEFAULT_MANUAL_PAYMENT_OPERATORS[operatorId];
    const prevPhone = currentOp.phoneNumber;
    const prevEnabled = currentOp.enabled;

    let nextPhone = prevPhone;
    if (updates.phoneNumber !== undefined) {
      const cleanPhone = updates.phoneNumber.trim();
      if (!isValidIvorianPhoneNumber(cleanPhone)) {
        return {
          success: false,
          message: "Format de numéro invalide. Veuillez renseigner un numéro ivoirien valide à 10 chiffres."
        };
      }
      nextPhone = formatIvorianPhoneNumber(cleanPhone);
    }

    let nextEnabled = prevEnabled;
    if (updates.enabled !== undefined) {
      if (updates.enabled === true && (!nextPhone || !isValidIvorianPhoneNumber(nextPhone))) {
        return {
          success: false,
          message: "Impossible d'activer cet opérateur sans numéro de réception valide."
        };
      }
      nextEnabled = updates.enabled;
    }

    const nowIso = new Date().toISOString();
    const adminName = adminUser.displayName || adminUser.email || "Fondateur";
    const adminEmail = adminUser.email || "jhs.kmj7@gmail.com";

    let action: ManualPaymentAuditEntry["action"] = "number_updated";
    if (updates.enabled !== undefined && updates.phoneNumber === undefined) {
      action = nextEnabled ? "enabled" : "disabled";
    }

    const auditEntry: ManualPaymentAuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      operatorId,
      operatorName: currentOp.displayName,
      action,
      previousPhone: prevPhone,
      newPhone: nextPhone,
      previousEnabled: prevEnabled,
      newEnabled: nextEnabled,
      performedBy: adminName,
      performedByEmail: adminEmail,
      timestamp: nowIso
    };

    const updatedOp: ManualPaymentOperatorConfig = {
      ...currentOp,
      phoneNumber: nextPhone,
      enabled: nextEnabled,
      updatedAt: nowIso,
      updatedBy: adminName,
      updatedByEmail: adminEmail
    };

    const nextDocPayload: ManualPaymentSettingsDoc = {
      operators: {
        ...currentData.operators,
        [operatorId]: updatedOp
      },
      auditLog: [auditEntry, ...(currentData.auditLog || [])].slice(0, 50),
      updatedAt: nowIso,
      updatedBy: adminName
    };

    await setDoc(docRef, nextDocPayload, { merge: true });

    return {
      success: true,
      message: `Moyen de paiement ${currentOp.displayName} mis à jour avec succès.`
    };
  } catch (error: any) {
    console.error("[MANUAL_PAYMENT_CONFIG] Update error:", error);
    return {
      success: false,
      message: error.message || "Erreur lors de la mise à jour du moyen de paiement."
    };
  }
}
