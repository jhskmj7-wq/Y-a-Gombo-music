import { db } from "./firebase";
import { addDoc, collection } from "firebase/firestore";

export const logAdminAction = async (
  action: string,
  targetUser: { uid: string, userName: string },
  details: any,
  founder: { uid: string, displayName: string | null; email?: string | null }
) => {
  try {
    await addDoc(collection(db, "adminActions"), {
      action,
      targetUserId: targetUser.uid,
      targetUserName: targetUser.userName,
      founderId: founder.uid,
      founderName: founder.displayName || founder.email || "Fondateur",
      details,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Failed to log admin action:", err);
  }
};
