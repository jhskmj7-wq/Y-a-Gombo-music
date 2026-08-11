import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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
