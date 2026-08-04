
import { AvatarConfig, AvatarItem } from "../../types/avatar";
import { AVATAR_RENDER_ORDER } from "./Layers";

/**
 * AFRIGOMBO ELITE - PROFESSIONAL SVG RENDERER
 * Handles the semi-realistic character generation and layer composting.
 */
export const AvatarRenderer = {
  /**
   * Generates a high-quality SVG URI for the Elite Avatar engine
   */
  render(configV2: any, configV1: AvatarConfig, storeItems: AvatarItem[]): string {
    const skinColor = configV1?.skinColor || "#8D5524";
    const bgColor = configV1?.background || "#18181b";
    
    const getItem = (itemId: string) => storeItems.find(i => i.id === itemId);
    const layers: string[] = [];
    const equippedV2 = configV2?.items || {};

    // 1. BACKGROUND
    if (equippedV2['arriere_plans']) {
      layers.push(getItem(equippedV2['arriere_plans'])?.svgContent || "");
    }

    // 2. ELITE BASE CHARACTER (Semi-Realistic)
    // The core anatomical structure that gives the premium feel
    if (!equippedV2['corps']) {
      layers.push(`
        <g id="elite_character_base">
          <!-- Torso & Shoulders: Anatomically curved for clothes to sit naturally -->
          <path d="M40 210 C 40 160, 60 135, 100 135 C 140 135, 160 160, 160 210 L 160 220 L 40 220 Z" fill="${skinColor}" />
          <!-- Neck: Defined with subtle shadow -->
          <path d="M86 135 L114 135 L112 115 L88 115 Z" fill="${skinColor}" opacity="0.95" />
          <path d="M86 135 Q100 142 114 135" stroke="black" stroke-width="0.5" opacity="0.1" fill="none" />
        </g>
      `);
    }

    if (!equippedV2['tete']) {
      layers.push(`
        <g id="elite_head_base">
          <!-- Ears: Positioned for realism -->
          <circle cx="61" cy="85" r="7.5" fill="${skinColor}" />
          <circle cx="139" cy="85" r="7.5" fill="${skinColor}" />
          <!-- Face Shape: Modern semi-realistic oval with chin definition -->
          <path d="M68 80 C 68 35, 132 35, 132 80 C 132 125, 100 142, 100 142 C 100 142, 68 125, 68 80 Z" fill="${skinColor}" />
          <!-- Subtle Face Definition -->
          <path d="M100 138 Q100 142 100 142" stroke="black" stroke-width="1" opacity="0.1" fill="none" />
        </g>
      `);
    }

    // 3. EQUIPMENT LAYERING (Dynamic engine)
    AVATAR_RENDER_ORDER.forEach(cat => {
      // Background and Base are handled manually for performance/logic
      if (cat === 'arriere_plans' || cat === 'corps' || cat === 'tete') return;
      
      const itemId = equippedV2[cat];
      if (itemId) {
        const item = getItem(itemId);
        if (item?.svgContent) {
          const cfg = item.engineConfig || { anchorX: 0, anchorY: 0, scaleX: 1, scaleY: 1, rotation: 0, zIndex: 0 };
          layers.push(`
            <g id="layer_${cat}" transform="translate(${cfg.anchorX || 0}, ${cfg.anchorY || 0}) scale(${cfg.scaleX || 1}, ${cfg.scaleY || 1}) rotate(${cfg.rotation || 0}, 100, 100)">
              ${item.svgContent}
            </g>
          `);
        }
      }
    });

    // 4. LEGACY V1 COMPATIBILITY (Safety Rule)
    if (Object.keys(equippedV2).length === 0) {
      const getItemSvg = (id: string) => getItem(id)?.svgContent || "";
      if (configV1.clothes) layers.push(getItemSvg(configV1.clothes));
      if (configV1.visage) layers.push(getItemSvg(configV1.visage));
      if (configV1.sourcils) layers.push(getItemSvg(configV1.sourcils));
      if (configV1.nez) layers.push(getItemSvg(configV1.nez));
      if (configV1.mouth) layers.push(getItemSvg(configV1.mouth));
      if (configV1.eyes) layers.push(getItemSvg(configV1.eyes));
      if (configV1.hair) layers.push(getItemSvg(configV1.hair));
      if (configV1.couronnes) layers.push(getItemSvg(configV1.couronnes));
      (configV1.accessories || []).forEach((id: string) => layers.push(getItemSvg(id)));
    }

    const svgString = `
      <svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" style="background-color: ${bgColor}; width: 100%; height: 100%;">
        ${layers.join('\n')}
      </svg>
    `;
    
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
  }
};
