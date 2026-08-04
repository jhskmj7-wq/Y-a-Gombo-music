
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
          <!-- Shadow under the head -->
          <ellipse cx="100" cy="142" rx="30" ry="8" fill="black" opacity="0.1" />
          
          <!-- Torso & Shoulders: Anatomically curved for clothes to sit naturally -->
          <path d="M30 215 C 30 160, 55 130, 100 130 C 145 130, 170 160, 170 215 L 170 230 L 30 230 Z" fill="${skinColor}" />
          
          <!-- Neck: Defined with subtle shadow -->
          <path d="M84 130 L116 130 L114 105 L86 105 Z" fill="${skinColor}" />
          <path d="M84 130 Q100 138 116 130" stroke="black" stroke-width="1.2" opacity="0.15" fill="none" />
          
          <!-- Clavicles & Traps definition -->
          <path d="M55 145 Q80 148 95 142" stroke="black" stroke-width="0.8" opacity="0.1" fill="none" />
          <path d="M145 145 Q120 148 105 142" stroke="black" stroke-width="0.8" opacity="0.1" fill="none" />
          
          <!-- Pectoral area shadow -->
          <path d="M70 180 Q100 190 130 180" stroke="black" stroke-width="0.5" opacity="0.05" fill="none" />
        </g>
      `);
    }

    if (!equippedV2['tete']) {
      layers.push(`
        <g id="elite_head_base">
          <!-- Ears: More detailed realistic ears -->
          <path d="M54 95 Q50 88 54 81 Q58 73 66 78 L66 103 Q58 108 54 95" fill="${skinColor}" />
          <path d="M146 95 Q150 88 146 81 Q142 73 134 78 L134 103 Q142 108 146 95" fill="${skinColor}" />
          <!-- Inner ear detail -->
          <path d="M58 85 Q56 88 58 92" stroke="black" stroke-width="0.5" opacity="0.1" fill="none" />
          <path d="M142 85 Q144 88 142 92" stroke="black" stroke-width="0.5" opacity="0.1" fill="none" />

          <!-- Face Shape: Refined oval with defined jaw and chin -->
          <path d="M66 80 C 66 30, 134 30, 134 80 C 134 125, 115 145, 100 150 C 85 145, 66 125, 66 80 Z" fill="${skinColor}" />
          
          <!-- Jawline & Chin definition -->
          <path d="M66 85 Q66 125 100 150 Q134 125 134 85" fill="none" stroke="black" stroke-width="0.8" opacity="0.1" />
          <path d="M92 145 Q100 148 108 145" fill="none" stroke="black" stroke-width="0.5" opacity="0.1" />
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
