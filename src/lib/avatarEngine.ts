import { db } from "../firebase";
import { doc, getDoc, updateDoc, collection, getDocs, query, where, setDoc, addDoc } from "firebase/firestore";
import { AvatarItem, UserAvatarData } from "../types/avatar";
import { recordWalletTransaction } from "./financial";

export const AvatarEngine = {
  async getStoreItems(): Promise<AvatarItem[]> {
    try {
      const q = query(collection(db, "avatarItems"), where("isActive", "==", true));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as AvatarItem));
    } catch (e) {
      console.error("Error fetching avatar items:", e);
      return [];
    }
  },

  async getUserAvatar(userId: string): Promise<UserAvatarData | null> {
    try {
      const docRef = doc(db, "avatars", userId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as UserAvatarData;
      }
      return null;
    } catch (e) {
      console.error("Error fetching user avatar:", e);
      return null;
    }
  },

  async saveUserAvatar(userId: string, data: Partial<UserAvatarData>, storeItems: AvatarItem[] = []): Promise<void> {
    try {
      const docRef = doc(db, "avatars", userId);
      await setDoc(docRef, { ...data, lastUpdated: new Date().toISOString() }, { merge: true });
      
      // Generate SVG data URI if config is present
      let avatarDataUri = null;
      if (data.config) {
        avatarDataUri = this.generateAvatarSvg(data.config, storeItems);
      }

      // Sync the double identity choice to the main user profile
      const updates: any = {};
      if (data.useAvatarAsProfile !== undefined) {
        updates.useAvatarAsProfile = data.useAvatarAsProfile;
      }
      if (avatarDataUri) {
        updates.avatarDataUri = avatarDataUri;
      }
      
      if (Object.keys(updates).length > 0) {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, updates);
      }
    } catch (e) {
      console.error("Error saving user avatar:", e);
      throw e;
    }
  },

  generateAvatarSvg(config: any, storeItems: AvatarItem[]): string {
    const skinColor = config.skinColor || "#8D5524";
    const bgColor = config.background || "#f3f4f6";

    const getItemSvg = (itemId: string, defaultSvg: string = "") => {
      if (!itemId) return defaultSvg;
      const item = storeItems.find(i => i.id === itemId);
      return item?.svgContent || defaultSvg;
    };

    const svgString = `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="background-color: ${bgColor};">
        ${getItemSvg(config.background)}
        <path d="M40 200 Q100 120 160 200 Z" fill="${skinColor}" />
        ${config.clothes ? getItemSvg(config.clothes) : '<path d="M40 200 Q100 130 160 200 Z" fill="#D4AF37" />'}
        <circle cx="100" cy="90" r="45" fill="${skinColor}" />
        ${getItemSvg(config.mouth, '<path d="M85 110 Q100 120 115 110" stroke="#4A3018" stroke-width="3" fill="transparent" stroke-linecap="round" />')}
        ${getItemSvg(config.eyes, '<g><circle cx="85" cy="80" r="4" fill="#1A1A1A" /><circle cx="115" cy="80" r="4" fill="#1A1A1A" /></g>')}
        ${getItemSvg(config.hair, '<path d="M55 90 Q100 30 145 90 Q100 50 55 90" fill="#1A1A1A" />')}
        ${(config.accessories || []).map((id: string) => getItemSvg(id)).join('')}
        ${(config.instruments || []).map((id: string) => getItemSvg(id)).join('')}
      </svg>
    `;
    
    // Convert to data URI
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
  },

  async purchaseItem(userId: string, item: AvatarItem, userProfile: any): Promise<boolean> {
    try {
      const price = item.price;
      const walletBalance = userProfile.wallet?.soldeDisponible ?? userProfile.walletBalance ?? 0;

      if (walletBalance < price) {
        throw new Error("Solde insuffisant");
      }

      const newBalance = walletBalance - price;

      // 1. Debit Wallet
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        walletBalance: newBalance,
        wallet: {
          ...(userProfile.wallet || {}),
          soldeDisponible: newBalance
        }
      });

      // 2. Add to Inventory
      const avatarRef = doc(db, "avatars", userId);
      const avatarSnap = await getDoc(avatarRef);
      let currentInventory: string[] = [];
      if (avatarSnap.exists()) {
        currentInventory = avatarSnap.data().inventory || [];
      }
      
      if (!currentInventory.includes(item.id)) {
        await setDoc(avatarRef, { 
          inventory: [...currentInventory, item.id] 
        }, { merge: true });
      }

      // 3. Record Transaction
      await recordWalletTransaction({
        userId,
        userName: userProfile.artistName || userProfile.displayName || "Membre Gombo",
        type: "achat_avatar",
        amount: price,
        status: "success",
        description: `Achat Boutique Avatar: ${item.name}`
      });

      // 4. Log Purchase Analytics
      await addDoc(collection(db, "avatarPurchases"), {
        userId,
        itemId: item.id,
        price,
        purchasedAt: new Date().toISOString()
      });

      return true;
    } catch (e) {
      console.error("Error purchasing avatar item:", e);
      throw e;
    }
  }
};
