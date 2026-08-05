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

    // ELITE BASE SHAPES (Semi-Realistic Human)
    if (!hasBody) {
      result.push({
        zIndex: Z_INDEX_MAP['corps'],
        element: (
          <g key="base-body">
            {/* Soft Shadow under chin */}
            <ellipse cx="100" cy="140" rx="28" ry="7" fill="black" opacity="0.12" />
            {/* Torso & Shoulders: Anatomical curve */}
            <path d="M 28 220 C 32 155, 58 132, 100 132 C 142 132, 168 155, 172 220 Z" fill={skinColor} />
            {/* Neck definition */}
            <path d="M 86 108 L 114 108 L 112 136 Q 100 142 88 136 Z" fill={skinColor} />
            <path d="M 86 112 Q 100 120 114 112" stroke="#000000" strokeWidth="1.2" opacity="0.18" fill="none" />
            {/* Clavicles / Chest contour */}
            <path d="M 52 148 Q 78 152 96 145" stroke="#000000" strokeWidth="0.8" opacity="0.12" fill="none" />
            <path d="M 148 148 Q 122 152 104 145" stroke="#000000" strokeWidth="0.8" opacity="0.12" fill="none" />
          </g>
        )
      });
    }

    if (!hasHead) {
      result.push({
        zIndex: Z_INDEX_MAP['tete'],
        element: (
          <g key="base-head">
            {/* Left Ear */}
            <path d="M 58 92 Q 53 85 57 78 Q 62 72 68 76 L 68 100 Q 61 105 58 92 Z" fill={skinColor} />
            <path d="M 61 82 Q 59 86 61 90" stroke="#000000" strokeWidth="0.6" opacity="0.15" fill="none" />
            {/* Right Ear */}
            <path d="M 142 92 Q 147 85 143 78 Q 138 72 132 76 L 132 100 Q 139 105 142 92 Z" fill={skinColor} />
            <path d="M 139 82 Q 141 86 139 90" stroke="#000000" strokeWidth="0.6" opacity="0.15" fill="none" />

            {/* Refined Face Shape */}
            <path d="M 68 76 C 68 32, 132 32, 132 76 C 132 120, 114 142, 100 146 C 86 142, 68 120, 68 76 Z" fill={skinColor} />
            
            {/* Jawline shadow */}
            <path d="M 68 82 Q 68 120 100 146 Q 132 120 132 82" fill="none" stroke="#000000" strokeWidth="0.8" opacity="0.1" />
            
            {/* Eyebrows */}
            <path d="M 75 73 Q 84 68 93 72" stroke="#1A1A1A" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M 107 72 Q 116 68 125 73" stroke="#1A1A1A" strokeWidth="2.2" strokeLinecap="round" fill="none" />

            {/* Nose contour */}
            <path d="M 98 83 L 96 98 Q 100 102 104 98 L 102 83" fill="none" stroke="#221208" strokeWidth="0.8" opacity="0.25" />
            <path d="M 94 98 Q 100 103 106 98" stroke="#1A1A1A" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.3" />
          </g>
        )
      });
    }

    // Default features if missing
    if (!hasEyes) {
      result.push({
        zIndex: Z_INDEX_MAP['yeux'],
        element: (
          <g key="base-eyes">
            {/* Left Eye */}
            <path d="M 77 82 Q 85 75 93 82 Q 85 88 77 82 Z" fill="#FFFFFF" opacity="0.95" />
            <circle cx="85" cy="81.5" r="4" fill="#3D2314" />
            <circle cx="85" cy="81.5" r="2" fill="#111111" />
            <circle cx="83.5" cy="80" r="1.2" fill="#FFFFFF" />
            <path d="M 76 81 Q 85 74 94 81" stroke="#111111" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            
            {/* Right Eye */}
            <path d="M 107 82 Q 115 75 123 82 Q 115 88 107 82 Z" fill="#FFFFFF" opacity="0.95" />
            <circle cx="115" cy="81.5" r="4" fill="#3D2314" />
            <circle cx="115" cy="81.5" r="2" fill="#111111" />
            <circle cx="113.5" cy="80" r="1.2" fill="#FFFFFF" />
            <path d="M 106 81 Q 115 74 124 81" stroke="#111111" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          </g>
        )
      });
    }

    if (!hasMouth) {
      result.push({
        zIndex: Z_INDEX_MAP['bouche'],
        element: (
          <g key="base-mouth">
            <path d="M 87 114 Q 93 111 100 113 Q 107 111 113 114" stroke="#4A3018" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.7" />
            <path d="M 85 115 Q 100 120 115 115" stroke="#3D2314" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <path d="M 90 121 Q 100 125 110 121" stroke="#2A1508" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.2" />
          </g>
        )
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
