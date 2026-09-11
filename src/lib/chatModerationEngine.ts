import { db } from "./firebase";
import { collection, doc, setDoc, getDoc, addDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from "firebase/firestore";

// Regex patterns to block phone numbers and external messaging URLs
const PHONE_REGEX = /(\+?\d{1,4}[\s.-]?)?(\(?\d{2,4}\)?[\s.-]?)?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}/g;
const SENSITIVE_PHONE_IVORY_COAST = /(01|05|07|08|09|\+225)\d{8}/g;
const SENSITIVE_PHONE_FRANCE = /(06|07|\+33)\d{8}/g;
const WA_TELEGRAM_REGEX = /(wa\.me|whatsapp|t\.me|telegram|viber|signal|instagram|facebook\.com)/gi;

export interface SanitizeResult {
  text: string;
  hasViolation: boolean;
  violationType?: "phone" | "external_link";
}

/**
 * Filter text to remove phone numbers and external social links
 */
export function sanitizeMessageContent(text: string): SanitizeResult {
  if (!text) return { text: "", hasViolation: false };

  let sanitized = text;
  let hasViolation = false;
  let violationType: "phone" | "external_link" | undefined;

  if (WA_TELEGRAM_REGEX.test(text)) {
    hasViolation = true;
    violationType = "external_link";
    sanitized = sanitized.replace(WA_TELEGRAM_REGEX, "[Lien externe sécurisé - Restez sur AFRIGOMBO]");
  }

  // Check digits patterns
  const digitsOnly = text.replace(/[^\d]/g, "");
  if (digitsOnly.length >= 8) {
    // Potential phone number
    if (SENSITIVE_PHONE_IVORY_COAST.test(text.replace(/\s+/g, "")) || SENSITIVE_PHONE_FRANCE.test(text.replace(/\s+/g, "")) || PHONE_REGEX.test(text)) {
      hasViolation = true;
      violationType = "phone";
      sanitized = sanitized.replace(PHONE_REGEX, "[Numéro masqué — Communication interne sécurisée]");
    }
  }

  return { text: sanitized, hasViolation, violationType };
}

/**
 * Record a bypass attempt in Firestore for Founders audit
 */
export async function logBypassAttempt(params: {
  userId: string;
  userName: string;
  convoId: string;
  content: string;
  type: string;
}) {
  if (!db) return;
  try {
    await addDoc(collection(db, "bypassAttempts"), {
      userId: params.userId,
      userName: params.userName,
      convoId: params.convoId,
      type: params.type,
      content: params.content,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.warn("Could not log bypass attempt:", err);
  }
}

/**
 * Report a conversation or message
 */
export async function reportUserOrConvo(params: {
  reporterUid: string;
  reporterName: string;
  targetUid: string;
  targetName: string;
  convoId: string;
  reason: string;
  details?: string;
}) {
  if (!db) return;
  try {
    await addDoc(collection(db, "reports"), {
      reporterUid: params.reporterUid,
      reporterName: params.reporterName,
      targetUid: params.targetUid,
      targetName: params.targetName,
      convoId: params.convoId,
      reason: params.reason,
      details: params.details || "",
      status: "open",
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Failed to submit report:", err);
    throw err;
  }
}

/**
 * Block a user
 */
export async function blockUser(currentUid: string, targetUid: string) {
  if (!currentUid || !targetUid || !db) return;
  try {
    const userRef = doc(db, "users", currentUid);
    await updateDoc(userRef, {
      blockedUsers: arrayUnion(targetUid)
    });
    // Also save in blockedUsers collection for indexing
    await setDoc(doc(db, "blockedUsers", `${currentUid}_${targetUid}`), {
      blockerUid: currentUid,
      blockedUid: targetUid,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Failed to block user:", err);
    throw err;
  }
}

/**
 * Unblock a user
 */
export async function unblockUser(currentUid: string, targetUid: string) {
  if (!currentUid || !targetUid || !db) return;
  try {
    const userRef = doc(db, "users", currentUid);
    await updateDoc(userRef, {
      blockedUsers: arrayRemove(targetUid)
    });
    await deleteDoc(doc(db, "blockedUsers", `${currentUid}_${targetUid}`));
  } catch (err) {
    console.error("Failed to unblock user:", err);
    throw err;
  }
}
