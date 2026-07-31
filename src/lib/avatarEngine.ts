import { db } from "./firebase";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  setDoc, 
  addDoc,
  deleteDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  increment,
  orderBy,
  limit
} from "firebase/firestore";
import { 
  AvatarItem, 
  UserAvatarData, 
  UserInventoryData, 
  AvatarConfig,
  AvatarEvent,
  AvatarGift,
  AvatarMission,
  AvatarRewardLog,
  CoinPackage,
  AvatarEconomyStats,
  AvatarLevelTitle
} from "../types/avatar";
import { recordWalletTransaction } from "./financial";

export const DAILY_REWARD_SCHEDULE = [
  { day: 1, coins: 20, xp: 10 },
  { day: 2, coins: 30, xp: 15 },
  { day: 3, coins: 40, xp: 20 },
  { day: 4, coins: 60, xp: 30 },
  { day: 5, coins: 80, xp: 40 },
  { day: 6, coins: 100, xp: 50 },
  { day: 7, coins: 150, xp: 100, bonusBadge: "👑 Roi du Gombo" }
];

export const COIN_PACKAGES: CoinPackage[] = [
  { id: "pack_500", coins: 500, priceFcfa: 1000, bonusCoins: 0, badge: "Starter" },
  { id: "pack_1500", coins: 1500, priceFcfa: 2500, bonusCoins: 100, badge: "Populaire" },
  { id: "pack_4000", coins: 4000, priceFcfa: 5000, bonusCoins: 500, popular: true, badge: "Recommandé" },
  { id: "pack_10000", coins: 10000, priceFcfa: 10000, bonusCoins: 2000, badge: "VIP Master" }
];

export function getLevelFromXp(xp: number): { level: number; title: AvatarLevelTitle; nextXp: number } {
  if (xp < 100) return { level: 1, title: "Débutant", nextXp: 100 };
  if (xp < 300) return { level: 2, title: "Talent", nextXp: 300 };
  if (xp < 700) return { level: 3, title: "Artiste", nextXp: 700 };
  if (xp < 1500) return { level: 4, title: "Star", nextXp: 1500 };
  if (xp < 3000) return { level: 5, title: "Icône", nextXp: 3000 };
  return { level: 6, title: "Légende", nextXp: 10000 };
}

const DEFAULT_SEED_ITEMS: Omit<AvatarItem, "id">[] = [
  {
    name: "Boubou Royal Kente Or",
    description: "Tissu Kente tissé d'or pur tradition Akan de Côte d'Ivoire.",
    category: "vêtements",
    price: 1500,
    isPremiumOnly: true,
    premiumOnly: true,
    rarity: "Royale",
    animation: "Scintillant",
    color: "#D4AF37",
    isActive: true,
    svgContent: `<path d="M40 200 Q100 120 160 200 Z" fill="#D4AF37" stroke="#996515" stroke-width="3" /><path d="M70 140 L130 140 L100 190 Z" fill="#8B0000" />`,
    imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop&q=80",
    previewImage: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop&q=80",
    assetUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Couronne Royale Baoulé",
    description: "Couronne traditionnelle Baoulé ornée de pépites royales.",
    category: "couronnes",
    price: 2500,
    isPremiumOnly: true,
    premiumOnly: true,
    rarity: "Légendaire",
    animation: "Super-Glow",
    color: "#FFD700",
    isActive: true,
    svgContent: `<path d="M60 45 L80 15 L100 40 L120 15 L140 45 Z" fill="#FFD700" stroke="#B8860B" stroke-width="2" /><circle cx="100" cy="30" r="4" fill="#FF0000" />`,
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300&auto=format&fit=crop&q=80",
    previewImage: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300&auto=format&fit=crop&q=80",
    assetUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Djembé Sacré Mandingue",
    description: "Djembé sculpté en bois de iroko avec cordage traditionnel.",
    category: "instruments",
    price: 1000,
    isPremiumOnly: false,
    premiumOnly: false,
    rarity: "Rare",
    animation: "Flottant",
    color: "#8B4513",
    isActive: true,
    svgContent: `<path d="M140 120 C160 120 170 140 160 170 C155 180 145 185 140 185 Z" fill="#8B4513" stroke="#4A2511" stroke-width="2" />`,
    imageUrl: "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=300&auto=format&fit=crop&q=80",
    previewImage: "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=300&auto=format&fit=crop&q=80",
    assetUrl: "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=300&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Collier de Corail Rouge",
    description: "Bijou en perles de corail naturel de la noblesse lagunaire.",
    category: "accessoires",
    price: 800,
    isPremiumOnly: false,
    premiumOnly: false,
    rarity: "Épique",
    animation: "Fixe",
    color: "#DC143C",
    isActive: true,
    svgContent: `<path d="M75 125 Q100 145 125 125" stroke="#DC143C" stroke-width="6" fill="transparent" stroke-dasharray="4 2" />`,
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&auto=format&fit=crop&q=80",
    previewImage: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&auto=format&fit=crop&q=80",
    assetUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Lunettes de Soleil VIP Gold",
    description: "Lunettes de soleil dorées réservées aux stars du Zouglou et Coupé-Décalé.",
    category: "accessoires",
    price: 500,
    isPremiumOnly: false,
    premiumOnly: false,
    rarity: "Commune",
    animation: "Fixe",
    color: "#D4AF37",
    isActive: true,
    svgContent: `<rect x="70" y="72" width="25" height="14" rx="3" fill="#111" stroke="#D4AF37" stroke-width="2" /><rect x="105" y="72" width="25" height="14" rx="3" fill="#111" stroke="#D4AF37" stroke-width="2" /><line x1="95" y1="78" x2="105" y2="78" stroke="#D4AF37" stroke-width="2" />`,
    imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=300&auto=format&fit=crop&q=80",
    previewImage: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=300&auto=format&fit=crop&q=80",
    assetUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=300&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Tunique Moderne Dashiki",
    description: "Tunique Dashiki haut de gamme brodée à la main.",
    category: "vêtements",
    price: 600,
    isPremiumOnly: false,
    premiumOnly: false,
    rarity: "Commune",
    animation: "Fixe",
    color: "#E67E22",
    isActive: true,
    svgContent: `<path d="M45 200 Q100 135 155 200 Z" fill="#E67E22" stroke="#2C3E50" stroke-width="2" />`,
    imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300&auto=format&fit=crop&q=80",
    previewImage: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300&auto=format&fit=crop&q=80",
    assetUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const AvatarEngine = {
  /**
   * Realtime Listener for Store Items
   */
  subscribeStoreItems(callback: (items: AvatarItem[]) => void): () => void {
    const q = query(collection(db, "avatarItems"));
    
    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // Seed default items asynchronously
        this.seedDefaultStoreItems();
        callback([]);
        return;
      }

      const items = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || "Article Avatar",
          description: data.description || "",
          category: data.category || "vêtements",
          price: typeof data.price === "number" ? data.price : 0,
          isPremiumOnly: !!(data.isPremiumOnly || data.premiumOnly),
          premiumOnly: !!(data.isPremiumOnly || data.premiumOnly),
          previewImage: data.previewImage || data.imageUrl || data.assetUrl || "",
          imageUrl: data.imageUrl || data.previewImage || data.assetUrl || "",
          assetUrl: data.assetUrl || data.imageUrl || data.previewImage || "",
          svgContent: data.svgContent || "",
          rarity: data.rarity || "Commune",
          animation: data.animation || "Fixe",
          color: data.color || "#D4AF37",
          isActive: data.isActive !== false,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        } as AvatarItem;
      });

      callback(items);
    }, (err) => {
      console.warn("Avatar items subscription warning:", err);
      callback([]);
    });
  },

  /**
   * Realtime Listener for User Inventory
   */
  subscribeUserInventory(userId: string, callback: (inv: UserInventoryData) => void): () => void {
    if (!userId) {
      callback({ uid: "", ownedItems: [], equippedItems: [], coinsSpent: 0, premiumItems: [] });
      return () => {};
    }

    const docRef = doc(db, "userInventory", userId);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({
          uid: userId,
          ownedItems: Array.isArray(data.ownedItems) ? data.ownedItems : [],
          equippedItems: Array.isArray(data.equippedItems) ? data.equippedItems : [],
          coinsSpent: Number(data.coinsSpent) || 0,
          premiumItems: Array.isArray(data.premiumItems) ? data.premiumItems : [],
          updatedAt: data.updatedAt
        });
      } else {
        // Fallback or empty inventory
        callback({
          uid: userId,
          ownedItems: [],
          equippedItems: [],
          coinsSpent: 0,
          premiumItems: []
        });
      }
    }, (err) => {
      console.warn("User inventory subscription warning:", err);
      callback({ uid: userId, ownedItems: [], equippedItems: [], coinsSpent: 0, premiumItems: [] });
    });
  },

  /**
   * Realtime Listener for User Avatar Config
   */
  subscribeUserAvatar(userId: string, callback: (avatar: UserAvatarData | null) => void): () => void {
    if (!userId) {
      callback(null);
      return () => {};
    }

    const docRef = doc(db, "userAvatars", userId);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as UserAvatarData);
      } else {
        // Fallback check on old 'avatars' doc
        getDoc(doc(db, "avatars", userId)).then((fallbackSnap) => {
          if (fallbackSnap.exists()) {
            callback(fallbackSnap.data() as UserAvatarData);
          } else {
            callback(null);
          }
        }).catch(() => callback(null));
      }
    }, (err) => {
      console.warn("User avatar subscription warning:", err);
      callback(null);
    });
  },

  /**
   * Get store items once (promise)
   */
  async getStoreItems(): Promise<AvatarItem[]> {
    try {
      const q = query(collection(db, "avatarItems"), where("isActive", "==", true));
      const snap = await getDocs(q);
      if (snap.empty) {
        await this.seedDefaultStoreItems();
        const secondSnap = await getDocs(q);
        return secondSnap.docs.map(d => ({ id: d.id, ...d.data() } as AvatarItem));
      }
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as AvatarItem));
    } catch (e) {
      console.error("Error fetching avatar items:", e);
      return [];
    }
  },

  /**
   * Get user avatar once (promise)
   */
  async getUserAvatar(userId: string): Promise<UserAvatarData | null> {
    try {
      const docRef = doc(db, "userAvatars", userId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as UserAvatarData;
      }
      // Fallback
      const fallbackRef = doc(db, "avatars", userId);
      const fallbackSnap = await getDoc(fallbackRef);
      if (fallbackSnap.exists()) {
        return fallbackSnap.data() as UserAvatarData;
      }
      return null;
    } catch (e) {
      console.error("Error fetching user avatar:", e);
      return null;
    }
  },

  /**
   * Seed Default Items in Firestore if collection is empty
   */
  async seedDefaultStoreItems(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, "avatarItems"));
      if (!snap.empty) return;

      console.log("Seeding initial Avatar Store items in Firestore...");
      for (const item of DEFAULT_SEED_ITEMS) {
        await addDoc(collection(db, "avatarItems"), item);
      }
    } catch (err) {
      console.warn("Error seeding avatar items:", err);
    }
  },

  /**
   * Save User Avatar Config & Sync Profile Image
   */
  async saveUserAvatar(
    userId: string, 
    data: Partial<UserAvatarData>, 
    storeItems: AvatarItem[] = []
  ): Promise<void> {
    try {
      const now = new Date().toISOString();
      const payload = { ...data, updatedAt: now, lastUpdated: now };

      // Update both userAvatars and avatars collections for compatibility
      await setDoc(doc(db, "userAvatars", userId), payload, { merge: true });
      await setDoc(doc(db, "avatars", userId), payload, { merge: true });

      // Generate SVG data URI if config is present
      let avatarDataUri = null;
      if (data.config) {
        avatarDataUri = this.generateAvatarSvg(data.config, storeItems);
      }

      // Sync choice to main user document in users/{userId}
      const userUpdates: any = {};
      if (data.useAvatarAsProfile !== undefined) {
        userUpdates.useAvatarAsProfile = data.useAvatarAsProfile;
      }
      if (avatarDataUri) {
        userUpdates.avatarDataUri = avatarDataUri;
        userUpdates.photoURLAvatar = avatarDataUri;
      }

      if (Object.keys(userUpdates).length > 0) {
        await updateDoc(doc(db, "users", userId), userUpdates);
      }
    } catch (e) {
      console.error("Error saving user avatar:", e);
      throw e;
    }
  },

  /**
   * Purchase an Avatar Item with Wallet check & Realtime Inventory update
   */
  async purchaseItem(userId: string, item: AvatarItem, userProfile: any): Promise<boolean> {
    try {
      const price = item.price;
      const walletBalance = userProfile?.wallet?.soldeDisponible ?? userProfile?.walletBalance ?? 0;
      const isPremium = userProfile?.premium || userProfile?.isPremium || userProfile?.subscriptionType === "premium";

      if (item.isPremiumOnly || item.premiumOnly) {
        if (!isPremium) {
          throw new Error("Cet article est réservé exclusivement aux membres Premium 👑");
        }
      }

      if (walletBalance < price) {
        throw new Error(`Solde insuffisant. Prix : ${price.toLocaleString()} FCFA, Solde : ${walletBalance.toLocaleString()} FCFA`);
      }

      const newBalance = walletBalance - price;

      // 1. Debit Wallet in users/{userId}
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        walletBalance: newBalance,
        wallet: {
          ...(userProfile?.wallet || {}),
          soldeDisponible: newBalance
        }
      });

      // 2. Add item to userInventory/{userId}
      const invRef = doc(db, "userInventory", userId);
      await setDoc(invRef, {
        uid: userId,
        ownedItems: arrayUnion(item.id),
        coinsSpent: increment(price),
        ...(item.isPremiumOnly ? { premiumItems: arrayUnion(item.id) } : {}),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Also sync to old avatars doc inventory array for backwards compatibility
      const oldAvatarRef = doc(db, "avatars", userId);
      await setDoc(oldAvatarRef, {
        inventory: arrayUnion(item.id)
      }, { merge: true });

      // 3. Record Financial Transaction Log
      await recordWalletTransaction({
        userId,
        userName: userProfile?.artistName || userProfile?.displayName || userProfile?.name || "Membre Gombo",
        type: "achat_avatar",
        amount: price,
        status: "success",
        description: `Achat Boutique Avatar: ${item.name}`
      });

      // 4. Create record in avatarPurchases collection
      await addDoc(collection(db, "avatarPurchases"), {
        userId,
        itemId: item.id,
        itemName: item.name,
        price,
        purchasedAt: new Date().toISOString()
      });

      return true;
    } catch (e) {
      console.error("Error purchasing avatar item:", e);
      throw e;
    }
  },

  /**
   * Equip / Unequip Item in userInventory & userAvatars in Realtime
   */
  async equipItem(userId: string, itemId: string, isEquipped: boolean, category?: string): Promise<void> {
    try {
      const invRef = doc(db, "userInventory", userId);
      
      if (isEquipped) {
        // Equip item
        await setDoc(invRef, {
          equippedItems: arrayUnion(itemId),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } else {
        // Unequip item
        await setDoc(invRef, {
          equippedItems: arrayRemove(itemId),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (e) {
      console.error("Error equipping item:", e);
      throw e;
    }
  },

  /**
   * Set Avatar as Main Profile Photo
   */
  async setAvatarAsProfile(userId: string, avatarDataUri: string, enable: boolean): Promise<void> {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        useAvatarAsProfile: enable,
        photoURLAvatar: avatarDataUri,
        avatarDataUri: avatarDataUri,
        updatedAt: new Date().toISOString()
      });

      const payload = { useAvatarAsProfile: enable, updatedAt: new Date().toISOString() };
      await setDoc(doc(db, "userAvatars", userId), payload, { merge: true });
      await setDoc(doc(db, "avatars", userId), payload, { merge: true });
    } catch (e) {
      console.error("Error setting avatar as profile:", e);
      throw e;
    }
  },

  /**
   * SVG Avatar Generator Helper
   */
  generateAvatarSvg(config: AvatarConfig, storeItems: AvatarItem[]): string {
    const skinColor = config?.skinColor || "#8D5524";
    const bgColor = config?.background || "#18181b";

    const getItemSvg = (itemId: string, defaultSvg: string = "") => {
      if (!itemId) return defaultSvg;
      const item = storeItems.find(i => i.id === itemId);
      return item?.svgContent || defaultSvg;
    };

    const svgString = `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="background-color: ${bgColor}; width: 100%; height: 100%;">
        ${getItemSvg(config?.background)}
        <path d="M40 200 Q100 120 160 200 Z" fill="${skinColor}" />
        ${config?.clothes ? getItemSvg(config.clothes) : '<path d="M40 200 Q100 130 160 200 Z" fill="#D4AF37" />'}
        <circle cx="100" cy="90" r="45" fill="${skinColor}" />
        ${getItemSvg(config?.mouth, '<path d="M85 110 Q100 120 115 110" stroke="#4A3018" stroke-width="3" fill="transparent" stroke-linecap="round" />')}
        ${getItemSvg(config?.eyes, '<g><circle cx="85" cy="80" r="4" fill="#1A1A1A" /><circle cx="115" cy="80" r="4" fill="#1A1A1A" /></g>')}
        ${getItemSvg(config?.hair, '<path d="M55 90 Q100 30 145 90 Q100 50 55 90" fill="#1A1A1A" />')}
        ${(config?.accessories || []).map((id: string) => getItemSvg(id)).join('')}
        ${(config?.instruments || []).map((id: string) => getItemSvg(id)).join('')}
      </svg>
    `;
    
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
  },

  /**
   * Award Coins and XP to user
   */
  async awardCoins(userId: string, coins: number, xp: number, reason: string): Promise<void> {
    if (!userId || (coins === 0 && xp === 0)) return;

    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      const currentData = userSnap.exists() ? userSnap.data() : {};

      const newCoins = (Number(currentData.avatarCoins) || 0) + coins;
      const newXp = (Number(currentData.avatarXp) || 0) + xp;
      const levelInfo = getLevelFromXp(newXp);

      await updateDoc(userRef, {
        avatarCoins: newCoins,
        avatarXp: newXp,
        avatarLevel: levelInfo.level,
        avatarLevelTitle: levelInfo.title,
        updatedAt: new Date().toISOString()
      });

      // Log reward
      await addDoc(collection(db, "avatarRewards"), {
        userId,
        amount: coins,
        xpAmount: xp,
        reason,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.error("Error awarding coins:", e);
    }
  },

  /**
   * Claim Daily Login Reward (7-day streak)
   */
  async claimDailyReward(userId: string, userProfile: any): Promise<{ coins: number; xp: number; day: number; bonusBadge?: string }> {
    if (!userId) throw new Error("Utilisateur non identifié");

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const lastClaimStr = userProfile?.lastDailyReward;
    if (lastClaimStr === todayStr) {
      throw new Error("Vous avez déjà récupéré votre bonus quotidien aujourd'hui ! Revenez demain 🎁");
    }

    let currentStreak = Number(userProfile?.streak) || 0;
    
    // Check if yesterday was claimed to keep streak, else reset to 1
    if (lastClaimStr) {
      const lastDate = new Date(lastClaimStr);
      const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        currentStreak = (currentStreak % 7) + 1;
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }

    const rewardInfo = DAILY_REWARD_SCHEDULE[currentStreak - 1] || DAILY_REWARD_SCHEDULE[0];

    // Award coins and XP
    await this.awardCoins(userId, rewardInfo.coins, rewardInfo.xp, `Bonus Quotidien Jour ${rewardInfo.day}`);

    // Update user profile streak & lastDailyReward
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      lastDailyReward: todayStr,
      streak: currentStreak,
      updatedAt: new Date().toISOString()
    });

    return {
      coins: rewardInfo.coins,
      xp: rewardInfo.xp,
      day: rewardInfo.day,
      bonusBadge: rewardInfo.bonusBadge
    };
  },

  /**
   * Gift an Avatar Item to a friend
   */
  async giftItem(
    senderId: string, 
    senderName: string, 
    recipientId: string, 
    recipientName: string, 
    item: AvatarItem, 
    message: string = ""
  ): Promise<void> {
    if (!senderId || !recipientId) throw new Error("Invalide expéditeur ou destinataire");

    const senderRef = doc(db, "users", senderId);
    const senderSnap = await getDoc(senderRef);
    const senderData = senderSnap.data();

    const senderCoins = Number(senderData?.avatarCoins) || 0;
    if (senderCoins < item.price) {
      throw new Error(`Gombo Coins insuffisants pour offrir cet article. Requis : ${item.price} Coins`);
    }

    // 1. Deduct coins from sender
    await updateDoc(senderRef, {
      avatarCoins: senderCoins - item.price
    });

    // 2. Add item to recipient inventory
    const recipientInvRef = doc(db, "userInventory", recipientId);
    await setDoc(recipientInvRef, {
      uid: recipientId,
      ownedItems: arrayUnion(item.id),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // 3. Record Gift Transaction
    await addDoc(collection(db, "avatarGifts"), {
      senderId,
      senderName: senderName || "Un Ami Gombo",
      recipientId,
      recipientName: recipientName || "Utilisateur Gombo",
      itemId: item.id,
      itemName: item.name,
      price: item.price,
      message,
      giftedAt: new Date().toISOString()
    });
  },

  /**
   * Purchase Gombo Coins Packages (Monetization)
   */
  async buyCoinPackage(userId: string, pkg: CoinPackage, paymentMethod: string, userProfile: any): Promise<void> {
    if (!userId) throw new Error("Utilisateur non connecté");

    const totalCoins = pkg.coins + (pkg.bonusCoins || 0);

    // If payment via wallet balance
    if (paymentMethod === "wallet") {
      const walletBalance = userProfile?.wallet?.soldeDisponible ?? userProfile?.walletBalance ?? 0;
      if (walletBalance < pkg.priceFcfa) {
        throw new Error(`Solde portefeuille insuffisant (${walletBalance.toLocaleString()} FCFA). Requis: ${pkg.priceFcfa.toLocaleString()} FCFA`);
      }

      // Deduct FCFA from wallet
      const newWalletBal = walletBalance - pkg.priceFcfa;
      await updateDoc(doc(db, "users", userId), {
        walletBalance: newWalletBal,
        wallet: {
          ...(userProfile?.wallet || {}),
          soldeDisponible: newWalletBal
        }
      });

      // Record transaction
      await recordWalletTransaction({
        userId,
        userName: userProfile?.artistName || userProfile?.displayName || userProfile?.name || "Membre Gombo",
        type: "achat_avatar",
        amount: pkg.priceFcfa,
        status: "success",
        description: `Recharge ${totalCoins} Gombo Coins (${pkg.badge || 'Pack'})`
      });
    }

    // Credit Gombo Coins and XP to user
    await this.awardCoins(userId, totalCoins, Math.floor(pkg.priceFcfa / 10), `Achat Pack ${totalCoins} Gombo Coins via ${paymentMethod}`);
  },

  /**
   * Realtime Events Subscriber
   */
  subscribeEvents(callback: (events: AvatarEvent[]) => void): () => void {
    const q = query(collection(db, "avatarEvents"));
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AvatarEvent));
      callback(events);
    }, (err) => {
      console.warn("Avatar events subscription error:", err);
      callback([]);
    });
  },

  /**
   * Realtime Missions Subscriber
   */
  subscribeMissions(callback: (missions: AvatarMission[]) => void): () => void {
    const q = query(collection(db, "avatarMissions"));
    return onSnapshot(q, (snapshot) => {
      const missions = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AvatarMission));
      callback(missions);
    }, (err) => {
      console.warn("Avatar missions subscription error:", err);
      callback([]);
    });
  },

  /**
   * Realtime Gifts Subscriber for User
   */
  subscribeGifts(userId: string, callback: (gifts: AvatarGift[]) => void): () => void {
    if (!userId) {
      callback([]);
      return () => {};
    }
    const q = query(collection(db, "avatarGifts"), where("recipientId", "==", userId));
    return onSnapshot(q, (snapshot) => {
      const gifts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AvatarGift));
      callback(gifts);
    }, (err) => {
      console.warn("Avatar gifts subscription error:", err);
      callback([]);
    });
  },

  /**
   * Admin: Save or Update Avatar Item in Firestore Store Catalog
   */
  async saveStoreItem(itemData: Partial<AvatarItem>): Promise<string> {
    const now = new Date().toISOString();
    if (itemData.id) {
      const ref = doc(db, "avatarItems", itemData.id);
      await setDoc(ref, { ...itemData, updatedAt: now }, { merge: true });
      return itemData.id;
    } else {
      const docRef = await addDoc(collection(db, "avatarItems"), {
        name: "Nouvel Article",
        category: "vêtements",
        price: 500,
        rarity: "Commun",
        isActive: true,
        createdAt: now,
        updatedAt: now,
        ...itemData
      });
      return docRef.id;
    }
  },

  /**
   * Admin: Delete Avatar Item
   */
  async deleteStoreItem(itemId: string): Promise<void> {
    if (!itemId) return;
    await deleteDoc(doc(db, "avatarItems", itemId));
  },

  /**
   * Admin: Create or Update Event
   */
  async saveEvent(eventData: Partial<AvatarEvent>): Promise<string> {
    const now = new Date().toISOString();
    if (eventData.id) {
      await setDoc(doc(db, "avatarEvents", eventData.id), { ...eventData, updatedAt: now }, { merge: true });
      return eventData.id;
    } else {
      const ref = await addDoc(collection(db, "avatarEvents"), {
        title: "Événement Saison",
        description: "",
        startDate: now,
        endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        exclusiveItemIds: [],
        isActive: true,
        createdAt: now,
        ...eventData
      });
      return ref.id;
    }
  },

  /**
   * Admin: Grant or Revoke Coins directly to User
   */
  async adminAdjustCoins(userId: string, coinsDelta: number, xpDelta: number, reason: string): Promise<void> {
    await this.awardCoins(userId, coinsDelta, xpDelta, `Ajustement Super Fondateur: ${reason}`);
  },

  /**
   * Admin: Grant Avatar Item directly to User Inventory
   */
  async adminGrantItem(userId: string, itemId: string): Promise<void> {
    const invRef = doc(db, "userInventory", userId);
    await setDoc(invRef, {
      uid: userId,
      ownedItems: arrayUnion(itemId),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  },

  /**
   * Admin: Revoke Avatar Item from User Inventory
   */
  async adminRevokeItem(userId: string, itemId: string): Promise<void> {
    const invRef = doc(db, "userInventory", userId);
    await setDoc(invRef, {
      equippedItems: arrayRemove(itemId),
      ownedItems: arrayRemove(itemId),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  },

  /**
   * Admin Economy Dashboard Stats
   */
  async getEconomyStats(): Promise<AvatarEconomyStats> {
    try {
      const purchasesSnap = await getDocs(collection(db, "avatarPurchases"));
      const itemsSnap = await getDocs(collection(db, "avatarItems"));

      let totalItemsSold = purchasesSnap.size;
      let totalCoinsGenerated = 0;
      let totalRevenueFcfa = 0;

      const itemCounts: Record<string, { name: string; count: number }> = {};

      purchasesSnap.docs.forEach(d => {
        const p = d.data();
        const price = Number(p.price) || 0;
        totalCoinsGenerated += price;
        totalRevenueFcfa += price; // 1 Coin = ~1 FCFA value equivalent

        if (p.itemId) {
          if (!itemCounts[p.itemId]) {
            itemCounts[p.itemId] = { name: p.itemName || "Article", count: 0 };
          }
          itemCounts[p.itemId].count += 1;
        }
      });

      const topItems = Object.entries(itemCounts)
        .map(([id, val]) => ({ id, name: val.name, count: val.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalItemsSold,
        totalCoinsGenerated,
        totalRevenueFcfa,
        activeUsersCount: purchasesSnap.docs.length > 0 ? new Set(purchasesSnap.docs.map(d => d.data().userId)).size : 0,
        topItems
      };
    } catch (e) {
      console.error("Error getting economy stats:", e);
      return {
        totalItemsSold: 0,
        totalCoinsGenerated: 0,
        totalRevenueFcfa: 0,
        activeUsersCount: 0,
        topItems: []
      };
    }
  }
};
