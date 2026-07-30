import { db } from "./firebase";
import { doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";

export type UserStatus = "online" | "busy" | "offline";

export interface UserPresence {
  uid: string;
  status: UserStatus;
  lastSeen?: string | number | any;
  updatedAt?: string;
}

/**
  Updates current user's presence status in Firestore `presence/{uid}`
 */
export async function setUserPresence(uid: string, status: UserStatus = "online") {
  if (!uid || !db) return;
  try {
    const ref = doc(db, "presence", uid);
    await setDoc(
      ref,
      {
        uid,
        status,
        lastSeen: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Could not set presence:", err);
  }
}

/**
 * Listens to a user's real-time presence status
 */
export function listenUserPresence(
  uid: string,
  callback: (presence: UserPresence | null) => void
) {
  if (!uid || !db) {
    callback(null);
    return () => {};
  }

  const ref = doc(db, "presence", uid);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as UserPresence);
      } else {
        callback(null);
      }
    },
    (err) => {
      console.warn("Presence snapshot error:", err);
      callback(null);
    }
  );
}

/**
 * Updates typing or voice recording status in Firestore `typing/{convoId}_{uid}`
 */
export async function setTypingState(
  convoId: string,
  uid: string,
  userName: string,
  isTyping: boolean,
  isRecording: boolean = false
) {
  if (!convoId || !uid || !db) return;
  try {
    const ref = doc(db, "typing", `${convoId}_${uid}`);
    if (!isTyping && !isRecording) {
      await setDoc(ref, { isTyping: false, isRecording: false, updatedAt: new Date().toISOString() }, { merge: true });
    } else {
      await setDoc(
        ref,
        {
          convoId,
          uid,
          userName,
          isTyping,
          isRecording,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn("Could not update typing state:", err);
  }
}

/**
 * Listens to typing state of partner in a conversation
 */
export function listenPartnerTyping(
  convoId: string,
  partnerUid: string,
  callback: (state: { isTyping: boolean; isRecording: boolean } | null) => void
) {
  if (!convoId || !partnerUid || !db) {
    callback(null);
    return () => {};
  }

  const ref = doc(db, "typing", `${convoId}_${partnerUid}`);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        callback({
          isTyping: !!data.isTyping,
          isRecording: !!data.isRecording
        });
      } else {
        callback(null);
      }
    },
    () => callback(null)
  );
}
