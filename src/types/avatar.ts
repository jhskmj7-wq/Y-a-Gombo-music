export type AvatarItemCategory = 
  | 'vêtements' 
  | 'chaussures'
  | 'accessoires' 
  | 'couronnes'
  | 'instruments' 
  | 'afrique' 
  | 'coiffures'
  | 'animations'
  | 'arriere-plans' 
  | 'visage' 
  | 'cheveux' 
  | 'yeux' 
  | 'bouche' 
  | 'couleur_peau'
  | 'premium' 
  | 'badges';

export type AvatarRarity = "Commun" | "Rare" | "Épique" | "Légendaire" | "Mythique" | "Royale";
export type AvatarLevelTitle = "Débutant" | "Talent" | "Artiste" | "Star" | "Icône" | "Légende";

export interface AvatarItem {
  id: string;
  name: string;
  description?: string;
  category: AvatarItemCategory | string;
  price: number;
  isPremiumOnly?: boolean;
  premiumOnly?: boolean;
  svgContent?: string;
  assetUrl?: string;
  previewImage?: string;
  imageUrl?: string;
  rarity?: AvatarRarity | string;
  animation?: "Fixe" | "Flottant" | "Scintillant" | "Ondulation" | "Super-Glow" | string;
  color?: string;
  zIndex?: number;
  collectionId?: string;
  isLimited?: boolean;
  totalStock?: number;
  remainingStock?: number;
  startDate?: string;
  endDate?: string;
  requiredLevel?: number;
  createdAt?: string;
  updatedAt?: string;
  isActive: boolean;
}

export interface AvatarEvent {
  id: string;
  title: string;
  description: string;
  bannerUrl?: string;
  startDate: string;
  endDate: string;
  exclusiveItemIds: string[];
  isActive: boolean;
  createdAt?: string;
}

export interface AvatarGift {
  id?: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  itemId: string;
  itemName: string;
  price: number;
  message?: string;
  giftedAt: string;
}

export interface AvatarMission {
  id: string;
  title: string;
  description: string;
  rewardCoins: number;
  rewardXp: number;
  actionType: string;
  targetCount: number;
  isActive: boolean;
}

export interface AvatarRewardLog {
  id?: string;
  userId: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface CoinPackage {
  id: string;
  coins: number;
  priceFcfa: number;
  bonusCoins?: number;
  popular?: boolean;
  badge?: string;
}

export interface AvatarEconomyStats {
  totalItemsSold: number;
  totalCoinsGenerated: number;
  totalRevenueFcfa: number;
  activeUsersCount: number;
  topItems: { id: string; name: string; count: number }[];
}

export interface AvatarConfig {
  skinColor: string;
  faceShape: string;
  hair: string;
  eyes: string;
  mouth: string;
  clothes: string;
  accessories: string[];
  instruments: string[];
  background: string;
}

export interface UserAvatarData {
  config: AvatarConfig;
  useAvatarAsProfile: boolean;
  inventory: string[]; // IDs of purchased AvatarItems
  lastUpdated?: string;
  updatedAt?: string;
}

export interface UserInventoryData {
  uid: string;
  ownedItems: string[];
  equippedItems: string[];
  coinsSpent: number;
  premiumItems: string[];
  updatedAt?: string;
}

export interface AvatarPurchaseRecord {
  id?: string;
  userId: string;
  itemId: string;
  itemName?: string;
  price: number;
  purchasedAt: string;
}

export interface AvatarCollection {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}
