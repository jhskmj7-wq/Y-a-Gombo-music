
import { AvatarItem } from "../../types/avatar";

/**
 * AFRIGOMBO ELITE - SHOP ENGINE
 * Logic for item properties, sorting, and commerce logic.
 */
export const AvatarShop = {
  sortItems(items: AvatarItem[], criteria: "price" | "rarity" | "newest"): AvatarItem[] {
    const sorted = [...items];
    switch (criteria) {
      case "price":
        return sorted.sort((a, b) => a.price - b.price);
      case "rarity":
        const rarityOrder: Record<string, number> = { 
          "Commun": 0, "Rare": 1, "Épique": 2, "Légendaire": 3, "Mythique": 4, "Royale": 5 
        };
        return sorted.sort((a, b) => (rarityOrder[b.rarity || "Commun"] || 0) - (rarityOrder[a.rarity || "Commun"] || 0));
      case "newest":
        return sorted.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      default:
        return sorted;
    }
  },

  filterByCategory(items: AvatarItem[], category: string): AvatarItem[] {
    return items.filter(i => i.category === category);
  },

  isPremium(item: AvatarItem): boolean {
    return !!(item.isPremiumOnly || item.premiumOnly);
  },

  canAfford(item: AvatarItem, balance: number): boolean {
    return balance >= item.price;
  }
};
