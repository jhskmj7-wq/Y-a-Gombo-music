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
          if (Array.isArray(['skinColor', 'faceShape', 'background']) && ['skinColor', 'faceShape', 'background']?.includes(key)) return;
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
            {/* Shadow under the head */}
            <ellipse cx="100" cy="142" rx="30" ry="8" fill="black" opacity="0.1" />
            {/* Torso & Shoulders */}
            <path d="M30 215 C 30 160, 55 130, 100 130 C 145 130, 170 160, 170 215 L 170 230 L 30 230 Z" fill={skinColor} />
            {/* Neck (refined connection) */}
            <path d="M 88 130 L 112 130 L 110 110 L 90 110 Z" fill={skinColor} />
            <path d="M84 130 Q100 138 116 130" stroke="black" strokeWidth="1.2" opacity="0.15" fill="none" />
            {/* Clavicles */}
            <path d="M55 145 Q80 148 95 142" stroke="black" strokeWidth="0.8" opacity="0.1" fill="none" />
            <path d="M145 145 Q120 148 105 142" stroke="black" strokeWidth="0.8" opacity="0.1" fill="none" />
          </g>
        )
      });
    }

    if (!hasHead) {
      result.push({
        zIndex: Z_INDEX_MAP['tete'],
        element: (
          <g key="base-head">
            {/* Detailed Ears (smaller) */}
            <path d="M60 90 Q56 85 60 78 Q64 73 70 78 L70 98 Q64 103 60 90" fill={skinColor} />
            <path d="M140 90 Q144 85 140 78 Q136 73 130 78 L130 98 Q136 103 140 90" fill={skinColor} />
            {/* Refined Face Shape (smaller, more oval) */}
            <path d="M75 70 C 75 30, 125 30, 125 70 C 125 115, 110 135, 100 140 C 90 135, 75 115, 75 70 Z" fill={skinColor} />
            {/* Jaw definition */}
            <path d="M66 85 Q66 125 100 150 Q134 125 134 85" fill="none" stroke="black" strokeWidth="0.8" opacity="0.1" />
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
      const cfg = item.engineConfig || {} as any;
      
      let transform = "";
      if (cfg.anchorX || cfg.anchorY) transform += `translate(${cfg.anchorX || 0}px, ${cfg.anchorY || 0}px) `;
      if (cfg.scaleX !== undefined || cfg.scaleY !== undefined) transform += `scale(${cfg.scaleX ?? 1}, ${cfg.scaleY ?? 1}) `;
      if (cfg.rotation) transform += `rotate(${cfg.rotation}deg) `;

      result.push({
        zIndex,
        element: item.svgContent ? (
          <g 
            key={item.id} 
            style={transform ? { transform, transformOrigin: 'center' } : undefined}
            dangerouslySetInnerHTML={{ __html: item.svgContent }}
          />
        ) : (
          <g 
            key={item.id} 
            style={transform ? { transform, transformOrigin: 'center' } : undefined}
          >
            {item.imageUrl && (
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
