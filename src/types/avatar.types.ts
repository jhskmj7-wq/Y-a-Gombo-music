export * from './avatar';

export interface AvatarStudioItemPayload {
  name: string;
  description: string;
  category: string;
  price: number;
  rarity: string;
  isPremiumOnly: boolean;
  imageUrl?: string;
  assetUrl?: string;
  animation?: string;
  isActive: boolean;
}
