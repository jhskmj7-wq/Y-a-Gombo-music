
import { db } from "../firebase";
import { onSnapshot, doc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { AvatarItem, UserInventoryData, UserAvatarData } from "../../types/avatar";

/**
 * AFRIGOMBO ELITE - AVATAR STATE MANAGER
 * Handles real-time subscriptions and data fetching for the engine.
 */
export const AvatarState = {
  /**
   * Subscribe to the store catalog
   */
  subscribeStore(callback: (items: AvatarItem[]) => void): () => void {
    const q = query(collection(db, "avatarItems"), where("isActive", "==", true));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AvatarItem));
      callback(items);
    });
  },

  /**
   * Subscribe to user inventory
   */
  subscribeInventory(userId: string, callback: (inv: UserInventoryData) => void): () => void {
    const docRef = doc(db, "userInventory", userId);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ uid: userId, ...snapshot.data() } as UserInventoryData);
      } else {
        callback({ uid: userId, ownedItems: [], equippedItems: [], coinsSpent: 0, premiumItems: [] });
      }
    });
  },

  /**
   * Subscribe to user avatar configuration
   */
  subscribeConfig(userId: string, callback: (data: UserAvatarData | null) => void): () => void {
    const docRef = doc(db, "userAvatars", userId);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as UserAvatarData);
      } else {
        callback(null);
      }
    });
  }
};
