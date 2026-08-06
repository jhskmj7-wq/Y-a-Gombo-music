
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

    const isFemale = configV1?.gender === 'female';
    const bodyPath = isFemale 
      ? "M 32 220 C 35 158, 56 134, 100 134 C 144 134, 165 158, 168 220 Z" 
      : "M 28 220 C 32 155, 58 132, 100 132 C 142 132, 168 155, 172 220 Z";
    const headPath = isFemale
      ? "M 70 76 C 70 34, 130 34, 130 76 C 130 118, 112 140, 100 144 C 88 140, 70 118, 70 76 Z"
      : "M 68 76 C 68 32, 132 32, 132 76 C 132 120, 114 142, 100 146 C 86 142, 68 120, 68 76 Z";

    // 2. ELITE BASE CHARACTER (Semi-Realistic)
    if (!equippedV2['corps']) {
      layers.push(`
        <g id="elite_character_base">
          <!-- Shadow under chin -->
          <ellipse cx="100" cy="140" rx="28" ry="7" fill="black" opacity="0.12" />
          <!-- Torso & Shoulders -->
          <path d="${bodyPath}" fill="${skinColor}" />
          <!-- Neck -->
          <path d="M 86 108 L 114 108 L 112 136 Q 100 142 88 136 Z" fill="${skinColor}" />
          <path d="M 86 112 Q 100 120 114 112" stroke="black" stroke-width="1.2" opacity="0.18" fill="none" />
          <!-- Clavicles -->
          <path d="M 52 148 Q 78 152 96 145" stroke="black" stroke-width="0.8" opacity="0.12" fill="none" />
          <path d="M 148 148 Q 122 152 104 145" stroke="black" stroke-width="0.8" opacity="0.12" fill="none" />
        </g>
      `);
    }

    if (!equippedV2['tete']) {
      layers.push(`
        <g id="elite_head_base">
          <!-- Left Ear -->
          <path d="M 58 92 Q 53 85 57 78 Q 62 72 68 76 L 68 100 Q 61 105 58 92 Z" fill="${skinColor}" />
          <path d="M 61 82 Q 59 86 61 90" stroke="black" stroke-width="0.6" opacity="0.15" fill="none" />
          <!-- Right Ear -->
          <path d="M 142 92 Q 147 85 143 78 Q 138 72 132 76 L 132 100 Q 139 105 142 92 Z" fill="${skinColor}" />
          <path d="M 139 82 Q 141 86 139 90" stroke="black" stroke-width="0.6" opacity="0.15" fill="none" />

          <!-- Refined Face Shape -->
          <path d="${headPath}" fill="${skinColor}" />
          <path d="M 68 82 Q 68 120 100 146 Q 132 120 132 82" fill="none" stroke="black" stroke-width="0.8" opacity="0.1" />

          <!-- Eyebrows -->
          <path d="M 75 73 Q 84 68 93 72" stroke="#1A1A1A" stroke-width="2.2" stroke-linecap="round" fill="none" />
          <path d="M 107 72 Q 116 68 125 73" stroke="#1A1A1A" stroke-width="2.2" stroke-linecap="round" fill="none" />

          <!-- Nose contour -->
          <path d="M 98 83 L 96 98 Q 100 102 104 98 L 102 83" fill="none" stroke="#221208" stroke-width="0.8" opacity="0.25" />
          <path d="M 94 98 Q 100 103 106 98" stroke="#1A1A1A" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.3" />
        </g>
      `);
    }

    if (!equippedV2['yeux']) {
      layers.push(`
        <g id="elite_eyes_base">
          <!-- Left Eye -->
          <path d="M 77 82 Q 85 75 93 82 Q 85 88 77 82 Z" fill="#FFFFFF" opacity="0.95" />
          <circle cx="85" cy="81.5" r="4" fill="#3D2314" />
          <circle cx="85" cy="81.5" r="2" fill="#111111" />
          <circle cx="83.5" cy="80" r="1.2" fill="#FFFFFF" />
          <path d="M 76 81 Q 85 74 94 81" stroke="#111111" stroke-width="1.8" fill="none" stroke-linecap="round" />
          
          <!-- Right Eye -->
          <path d="M 107 82 Q 115 75 123 82 Q 115 88 107 82 Z" fill="#FFFFFF" opacity="0.95" />
          <circle cx="115" cy="81.5" r="4" fill="#3D2314" />
          <circle cx="115" cy="81.5" r="2" fill="#111111" />
          <circle cx="113.5" cy="80" r="1.2" fill="#FFFFFF" />
          <path d="M 106 81 Q 115 74 124 81" stroke="#111111" stroke-width="1.8" fill="none" stroke-linecap="round" />
        </g>
      `);
    }

    if (!equippedV2['bouche']) {
      layers.push(`
        <g id="elite_mouth_base">
          <path d="M 87 114 Q 93 111 100 113 Q 107 111 113 114" stroke="#4A3018" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.7" />
          <path d="M 85 115 Q 100 120 115 115" stroke="#3D2314" stroke-width="2.2" fill="none" stroke-linecap="round" />
          <path d="M 90 121 Q 100 125 110 121" stroke="#2A1508" stroke-width="1" fill="none" stroke-linecap="round" opacity="0.2" />
        </g>
      `);
    }

    // 3. EQUIPMENT LAYERING (Dynamic engine)
    AVATAR_RENDER_ORDER.forEach(cat => {
      // Background and Base are handled manually for performance/logic
      if (cat === 'arriere_plans' || cat === 'corps' || cat === 'tete') return;
      if (isFemale && (cat === 'barbe' || cat === 'moustache')) return;
      
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
