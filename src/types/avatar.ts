export type AvatarItemCategory = 'vêtements' | 'accessoires' | 'instruments' | 'afrique' | 'premium' | 'badges' | 'arriere-plans' | 'visage' | 'cheveux' | 'yeux' | 'bouche' | 'couleur_peau';

export interface AvatarItem {
  id: string;
  name: string;
  category: AvatarItemCategory;
  price: number;
  isPremiumOnly: boolean;
  svgContent: string; // The raw SVG path or content
  zIndex: number;
  collectionId?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
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
  lastUpdated: string;
}

export interface AvatarCollection {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}
