import React, { useMemo, memo } from 'react';
import { AvatarConfig, AvatarItem } from '../../types/avatar';
import { useTheme } from '../../context/ThemeContext';
import { AVATAR_RENDER_ORDER } from '../../lib/avatar/Layers';

interface AvatarRendererProps {
  config: AvatarConfig | any;
  size?: number;
  className?: string;
  storeItems?: AvatarItem[]; 
}

/**
 * AFRIGOMBO ELITE - REACT RENDERER COMPONENT
 * Optimisé pour la fluidité sur Android et le rendu semi-réaliste.
 */
const AvatarRenderer = memo(({ config, size = 120, className = "", storeItems = [] }: AvatarRendererProps) => {
  const { theme } = useTheme();
  
  // Z-Index from modular source
  const Z_INDEX_MAP: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    AVATAR_RENDER_ORDER.forEach((cat, idx) => {
      map[cat] = idx * 10;
    });
    return map;
  }, []);

  const { skinColor, bgColor, renderItems } = useMemo(() => {
    let sColor = "#8D5524";
    let bColor = theme === "light" ? "#f3f4f6" : "#1f2937";
    const mappedItems: AvatarItem[] = [];

    if (config) {
      if (config.skinColor) sColor = config.skinColor;
      if (config.background && !storeItems.find(i => i.id === config.background)) {
         bColor = config.background;
      }
      
      // V2 Config priority
      if (config.configV2?.items) {
        Object.entries(config.configV2.items).forEach(([cat, itemId]) => {
          const item = storeItems.find(i => i.id === itemId);
          if (item) mappedItems.push(item);
        });
      } else {
        // V1 Fallback
        Object.keys(config).forEach(key => {
          if (['skinColor', 'faceShape', 'background'].includes(key)) return;
          const val = (config as any)[key];
          if (Array.isArray(val)) {
             val.forEach(itemId => {
                const item = storeItems.find(i => i.id === itemId);
                if (item) mappedItems.push(item);
             });
          } else if (typeof val === 'string' && val) {
             const item = storeItems.find(i => i.id === val);
             if (item) mappedItems.push(item);
          }
        });
      }
    }

    return { skinColor: sColor, bgColor: bColor, renderItems: mappedItems };
  }, [config, theme, storeItems]);

  const layers = useMemo(() => {
    const sorted = [...renderItems].sort((a, b) => {
      const zA = a.engineConfig?.zIndex ?? Z_INDEX_MAP[a.category] ?? 100;
      const zB = b.engineConfig?.zIndex ?? Z_INDEX_MAP[b.category] ?? 100;
      return zA - zB;
    });

    const hasBody = renderItems.some(i => i.category === 'corps');
    const hasHead = renderItems.some(i => i.category === 'tete');
    const hasEyes = renderItems.some(i => i.category === 'yeux');
    const hasMouth = renderItems.some(i => i.category === 'bouche');

    const result: { zIndex: number, element: React.ReactNode }[] = [];

    // ELITE BASE SHAPES (Semi-Realistic)
    if (!hasBody) {
      result.push({
        zIndex: Z_INDEX_MAP['corps'],
        element: (
          <g key="base-body">
            {/* Torso & Shoulders: anatomical curves */}
            <path d="M40 210 C 40 160, 60 135, 100 135 C 140 135, 160 160, 160 210 L 160 220 L 40 220 Z" fill={skinColor} />
            {/* Neck definition */}
            <path d="M86 135 L114 135 L112 115 L88 115 Z" fill={skinColor} opacity="0.95" />
          </g>
        )
      });
    }

    if (!hasHead) {
      result.push({
        zIndex: Z_INDEX_MAP['tete'],
        element: (
          <g key="base-head">
            {/* Ears */}
            <circle cx="61" cy="85" r="7.5" fill={skinColor} />
            <circle cx="139" cy="85" r="7.5" fill={skinColor} />
            {/* Professional Head Shape */}
            <path d="M68 80 C 68 35, 132 35, 132 80 C 132 125, 100 142, 100 142 C 100 142, 68 125, 68 80 Z" fill={skinColor} />
          </g>
        )
      });
    }

    // Default features if missing
    if (!hasEyes) {
      result.push({
        zIndex: Z_INDEX_MAP['yeux'],
        element: (
          <g key="base-eyes" opacity="0.8">
            <circle cx="85" cy="80" r="4.5" fill="#111" />
            <circle cx="115" cy="80" r="4.5" fill="#111" />
          </g>
        )
      });
    }

    if (!hasMouth) {
      result.push({
        zIndex: Z_INDEX_MAP['bouche'],
        element: <path key="base-mouth" d="M85 115 Q100 122 115 115" stroke="#4A3018" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />
      });
    }

    // Equiped Items
    sorted.forEach(item => {
      const zIndex = item.engineConfig?.zIndex ?? Z_INDEX_MAP[item.category] ?? 100;
      const cfg = item.engineConfig || {};
      
      let transform = "";
      if (cfg.anchorX || cfg.anchorY) transform += `translate(${cfg.anchorX || 0}px, ${cfg.anchorY || 0}px) `;
      if (cfg.scaleX !== undefined || cfg.scaleY !== undefined) transform += `scale(${cfg.scaleX ?? 1}, ${cfg.scaleY ?? 1}) `;
      if (cfg.rotation) transform += `rotate(${cfg.rotation}deg) `;

      result.push({
        zIndex,
        element: (
          <g 
            key={item.id} 
            style={transform ? { transform, transformOrigin: 'center' } : undefined}
            dangerouslySetInnerHTML={item.svgContent ? { __html: item.svgContent } : undefined}
          >
            {!item.svgContent && item.imageUrl && (
               <image href={item.imageUrl} width="200" height="220" preserveAspectRatio="xMidYMid slice" />
            )}
          </g>
        )
      });
    });

    return result.sort((a, b) => a.zIndex - b.zIndex);
  }, [renderItems, skinColor, Z_INDEX_MAP]);

  return (
    <div 
      className={`relative overflow-hidden flex items-center justify-center ${className}`}
      style={{ width: size, height: size, backgroundColor: bgColor }}
    >
      <svg 
        viewBox="0 0 200 220" 
        width="100%" 
        height="100%" 
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm"
      >
        {layers.map((layer, idx) => (
          <React.Fragment key={idx}>{layer.element}</React.Fragment>
        ))}
      </svg>
    </div>
  );
});

export default AvatarRenderer;
