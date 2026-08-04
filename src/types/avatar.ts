export type AvatarItemCategory = 
  // Nouveaux types (Moteur v2)
  | 'corps'
  | 'tete'
  | 'visage_base'
  | 'yeux'
  | 'sourcils'
  | 'nez'
  | 'bouche'
  | 'barbe'
  | 'moustache'
  | 'cicatrices'
  | 'maquillage'
  | 'lunettes'
  | 'cheveux'
  | 'tee-shirt'
  | 'chemise'
  | 'veste'
  | 'manteau'
  | 'collier'
  | 'sac'
  | 'casquettes'
  | 'chapeaux'
  | 'couronnes'
  | 'ecouteurs'
  | 'chaines'
  | 'montres'
  | 'bagues'
  | 'bracelets'
  | 'chaussures'
  | 'sneakers'
  | 'pantalons'
  | 'jeans'
  | 'robes'
  | 'costumes'
  | 'tenues_africaines'
  | 'tenues_ivoiriennes'
  | 'tenues_scene'
  | 'effets_speciaux'
  | 'arriere_plans'
  | 'ailes'
  | 'badges'
  | 'sous_vetement'
  // Anciens types (Compatibilité)
  | 'vêtements'
  | 'accessoires'
  | 'instruments'
  | 'afrique'
  | 'coiffures'
  | 'animations'
  | 'arriere-plans'
  | 'visage'
  | 'couleur_peau'
  | 'premium'
  | 'badges'
  | string;

export type AvatarRarity = "Commun" | "Rare" | "Épique" | "Légendaire" | "Mythique" | "Royale";
export type AvatarLevelTitle = "Débutant" | "Talent" | "Artiste" | "Star" | "Icône" | "Légende";

export interface AvatarEngineConfig {
  anchorX: number;
  anchorY: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  zIndex: number;
  incompatibleWith?: string[]; // IDs d'articles ou catégories incompatibles
}

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
  engineConfig?: AvatarEngineConfig;
  creatorId?: string;
  creatorName?: string;
  salesCount?: number;
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
  couronnes?: string;
  chaussures?: string;
  sourcils?: string;
  visage?: string;
  nez?: string;
  // Professional V2 Categories
  tete?: string;
  corps?: string;
  visage_base?: string;
  yeux?: string;
  bouche?: string;
  barbe?: string;
  moustache?: string;
  cicatrices?: string;
  maquillage?: string;
  cheveux?: string;
  'tee-shirt'?: string;
  chemise?: string;
  veste?: string;
  manteau?: string;
  pantalons?: string;
  jeans?: string;
  robes?: string;
  costumes?: string;
  tenues_africaines?: string;
  tenues_ivoiriennes?: string;
  tenues_scene?: string;
  casquettes?: string;
  chapeaux?: string;
  ecouteurs?: string;
  collier?: string;
  chaines?: string;
  montres?: string;
  bagues?: string;
  bracelets?: string;
  sac?: string;
  ailes?: string;
  badges?: string;
  effets_speciaux?: string;
  arriere_plans?: string;
  sneakers?: string;
  sous_vetement?: string;
  tatouages_corps?: string;
  tatouages_visage?: string;
  maquillage_yeux?: string;
  maquillage_levres?: string;
}

export interface AvatarEngineConfigV2 {
  items: Record<string, string>; // category -> itemId
  skinColor?: string;
}

export interface UserAvatarData {
  config: AvatarConfig;
  configV2?: AvatarEngineConfigV2; // Nouveau format
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
