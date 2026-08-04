
import { AvatarItem } from "../../types/avatar";

/**
 * AFRIGOMBO ELITE - CREATION ENGINE
 * Logic for validating and processing new avatar assets.
 */
export const AvatarCreator = {
  validateItem(item: Partial<AvatarItem>): { valid: boolean; error?: string } {
    if (!item.name || item.name.length < 2) return { valid: false, error: "Nom trop court" };
    if (!item.category) return { valid: false, error: "Catégorie manquante" };
    if (item.price === undefined || item.price < 0) return { valid: false, error: "Prix invalide" };
    if (!item.svgContent && !item.imageUrl) return { valid: false, error: "Contenu visuel manquant" };
    return { valid: true };
  },

  sanitizeSvg(svg: string): string {
    // Basic sanitization: remove scripts, risky attributes
    return svg
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "");
  },

  generateItemId(category: string, name: string): string {
    const slug = name.toLowerCase().replace(/\s+/g, "_").replace(/[^\w]/g, "");
    return `${category}_${slug}_${Date.now().toString(36)}`;
  }
};
