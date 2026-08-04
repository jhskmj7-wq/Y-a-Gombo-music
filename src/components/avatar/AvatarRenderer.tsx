import React, { useMemo } from 'react';
import { AvatarConfig, AvatarItem } from '../../types/avatar';
import { useTheme } from '../../context/ThemeContext';

interface AvatarRendererProps {
  config: AvatarConfig | any;
  size?: number;
  className?: string;
  storeItems?: AvatarItem[]; // To get the svgContent if available
}

// Z-Index mappings for standard categories
const Z_INDEX_MAP: Record<string, number> = {
  'arriere_plans': -10,
  'corps': 0,
  'sous_vetement': 5,
  'tete': 10,
  'visage_base': 15,
  'cicatrices': 18,
  'maquillage': 20,
  'yeux': 30,
  'sourcils': 40,
  'nez': 50,
  'bouche': 60,
  'tee-shirt': 100,
  'chemise': 110,
  'pantalons': 115,
  'jeans': 116,
  'chaussures': 118,
  'sneakers': 119,
  'barbe': 120,
  'moustache': 130,
  'lunettes': 140,
  'cheveux': 150,
  'veste': 160,
  'manteau': 170,
  'robes': 175,
  'costumes': 178,
  'tenues_africaines': 180,
  'tenues_ivoiriennes': 182,
  'tenues_scene': 185,
  'collier': 190,
  'chaines': 195,
  'sac': 200,
  'montres': 205,
  'bagues': 210,
  'bracelets': 215,
  'casquettes': 300,
  'chapeaux': 310,
  'couronnes': 320,
  'ecouteurs': 330,
  'ailes': 400,
  'badges': 450,
  'effets_speciaux': 500,
};

// V1 to V2 Category Migration Map
const V1_TO_V2_MAP: Record<string, string> = {
  'background': 'arriere_plans',
  'clothes': 'chemise',
  'visage': 'visage_base',
  'sourcils': 'sourcils',
  'nez': 'nez',
  'mouth': 'bouche',
  'eyes': 'yeux',
  'hair': 'cheveux',
  'couronnes': 'couronnes',
  'chaussures': 'chaussures',
  'accessories': 'accessoires',
  'instruments': 'effets_speciaux'
};

export default function AvatarRenderer({ config, size = 120, className = "", storeItems = [] }: AvatarRendererProps) {
  const { theme } = useTheme();
  
  // Backwards compatibility layer: convert v1 config to a flat list of v2 item objects
  const { skinColor, bgColor, renderItems } = useMemo(() => {
    let sColor = "#8D5524";
    let bColor = theme === "light" ? "#f3f4f6" : "#1f2937";
    const mappedItems: any[] = [];

    if (config) {
      if (config.skinColor) sColor = config.skinColor;
      if (config.background && !storeItems.find(i => i.id === config.background)) {
         // Keep background logic for simple colors if not an item
         bColor = config.background;
      }
      
      // If config has configV2 (New engine)
      if (config.configV2 && config.configV2.items) {
        Object.values(config.configV2.items).forEach(itemId => {
          const item = storeItems.find(i => i.id === itemId);
          if (item) mappedItems.push(item);
        });
      } else {
        // V1 migration on the fly
        Object.keys(config).forEach(key => {
          if (key === 'skinColor' || key === 'faceShape' || key === 'background') return;
          const val = config[key as keyof AvatarConfig];
          if (Array.isArray(val)) {
             val.forEach(itemId => {
                const item = storeItems.find(i => i.id === itemId);
                if (item) mappedItems.push({ ...item, inferredCategory: V1_TO_V2_MAP[key] || 'accessoires' });
             });
          } else if (typeof val === 'string' && val) {
             const item = storeItems.find(i => i.id === val);
             // If we found the item, map it. For background, we map if it's an item.
             if (item) mappedItems.push({ ...item, inferredCategory: V1_TO_V2_MAP[key] || 'accessoires' });
          }
        });
        
        // Add default background if it's an item
        if (config.background) {
            const item = storeItems.find(i => i.id === config.background);
            if (item) mappedItems.push({ ...item, inferredCategory: 'arriere_plans' });
        }
      }
    }

    return { skinColor: sColor, bgColor: bColor, renderItems: mappedItems };
  }, [config, theme, storeItems]);

  // Sort items by Z-Index
  const sortedItems = useMemo(() => {
    return [...renderItems].sort((a, b) => {
      const zA = a.engineConfig?.zIndex ?? Z_INDEX_MAP[a.category] ?? Z_INDEX_MAP[a.inferredCategory] ?? 100;
      const zB = b.engineConfig?.zIndex ?? Z_INDEX_MAP[b.category] ?? Z_INDEX_MAP[b.inferredCategory] ?? 100;
      return zA - zB;
    });
  }, [renderItems]);

  // Determine which fallback vectors we need to inject if they are missing
  // i.e., body, head, default eyes if none specified
  const hasBody = renderItems.some(i => i.category === 'corps');
  const hasHead = renderItems.some(i => i.category === 'tete');
  const hasClothes = renderItems.some(i => ['tee-shirt', 'chemise', 'veste', 'manteau', 'robes', 'costumes', 'tenues_africaines', 'tenues_ivoiriennes', 'tenues_scene'].includes(i.category) || i.inferredCategory === 'chemise');

  // Fallbacks using semi-realistic paths
  // Body (Neck, shoulders, torso)
  const defaultBody = (
    <path key="default-body" d="M60 200 Q100 130 140 200 Z" fill={skinColor} />
  );

  // Head (Semi-realistic skull, ears, face base)
  const defaultHead = (
    <g key="default-head">
      {/* Ears */}
      <path d="M55 105 Q45 90 55 75 Z" fill={skinColor} />
      <path d="M145 105 Q155 90 145 75 Z" fill={skinColor} />
      {/* Head Base */}
      <circle cx="100" cy="90" r="45" fill={skinColor} />
      {/* Chin extension for realism */}
      <path d="M63 115 Q100 150 137 115 L145 90 L55 90 Z" fill={skinColor} />
    </g>
  );

  const defaultEyes = (
    <g key="default-eyes">
      <circle cx="82" cy="85" r="5" fill="#ffffff" />
      <circle cx="82" cy="85" r="2.5" fill="#1A1A1A" />
      <circle cx="118" cy="85" r="5" fill="#ffffff" />
      <circle cx="118" cy="85" r="2.5" fill="#1A1A1A" />
    </g>
  );

  const defaultMouth = (
    <path key="default-mouth" d="M85 125 Q100 135 115 125" stroke="#4A3018" strokeWidth="3" fill="none" strokeLinecap="round" />
  );

  const defaultClothes = (
    <path key="default-clothes" d="M45 200 Q100 145 155 200 Z" fill={theme === "light" ? "#D4AF37" : "#B8860B"} />
  );

  // Assemble rendering tree respecting Z-indexes
  const layers: { zIndex: number, element: React.ReactNode }[] = [];

  // Inject defaults at standard z-indexes if missing
  if (!hasBody) layers.push({ zIndex: Z_INDEX_MAP['corps'], element: defaultBody });
  if (!hasHead) layers.push({ zIndex: Z_INDEX_MAP['tete'], element: defaultHead });
  if (!hasClothes) layers.push({ zIndex: Z_INDEX_MAP['tee-shirt'], element: defaultClothes });

  if (!renderItems.some(i => i.category === 'yeux' || i.inferredCategory === 'yeux')) {
    layers.push({ zIndex: Z_INDEX_MAP['yeux'], element: defaultEyes });
  }
  if (!renderItems.some(i => i.category === 'bouche' || i.inferredCategory === 'bouche')) {
    layers.push({ zIndex: Z_INDEX_MAP['bouche'], element: defaultMouth });
  }
  
  if (config && config.faceShape && config.faceShape !== 'default') {
     layers.push({
       zIndex: Z_INDEX_MAP['tete'] + 1,
       element: (
          <path 
             key="face-shape"
             d={config.faceShape === 'oval' 
               ? "M65 110 Q100 135 135 110" 
               : config.faceShape === 'square'
                ? "M60 110 L80 128 L120 128 L140 110"
                : config.faceShape === 'round'
                  ? "M65 100 Q100 138 135 100"
                  : config.faceShape === 'diamond'
                    ? "M65 100 L100 135 L135 100"
                    : "M60 105 Q100 125 140 105"} 
             stroke="#4A3018" 
             strokeWidth="1.5" 
             fill="none" 
             opacity="0.3" 
           />
       )
     });
  }

  // Push user items
  sortedItems.forEach(item => {
    if (!item.svgContent) return;
    
    let zIndex = item.engineConfig?.zIndex ?? Z_INDEX_MAP[item.category] ?? Z_INDEX_MAP[item.inferredCategory] ?? 100;
    
    // Apply engine configurations if present
    const tX = item.engineConfig?.anchorX || 0;
    const tY = item.engineConfig?.anchorY || 0;
    const sX = item.engineConfig?.scaleX || 1;
    const sY = item.engineConfig?.scaleY || 1;
    const rot = item.engineConfig?.rotation || 0;

    let transform = "";
    if (tX !== 0 || tY !== 0) transform += `translate(${tX}, ${tY}) `;
    if (sX !== 1 || sY !== 1) transform += `scale(${sX}, ${sY}) `;
    if (rot !== 0) transform += `rotate(${rot} 100 100) `; // assuming 100,100 is center

    layers.push({
      zIndex,
      element: (
        <g 
          key={item.id} 
          {...(item.svgContent ? { dangerouslySetInnerHTML: { __html: item.svgContent } } : {})} 
          {...(!item.svgContent && item.imageUrl ? { dangerouslySetInnerHTML: { __html: `<image href="${item.imageUrl}" width="200" height="200" preserveAspectRatio="xMidYMid slice" />` } } : {})} 
          style={transform ? { transform, transformOrigin: 'center' } : undefined}
        />
      )
    });
  });

  // Sort final tree
  layers.sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div 
      className={`relative rounded-full overflow-hidden flex items-center justify-center border-4 border-afri-bg-sec shadow-inner ${className}`}
      style={{ width: size, height: size, backgroundColor: bgColor }}
    >
      <svg 
        viewBox="0 0 200 200" 
        width="100%" 
        height="100%" 
        className="absolute bottom-0 drop-shadow-md"
        xmlns="http://www.w3.org/2000/svg"
      >
        {layers.map(layer => layer.element)}
      </svg>
    </div>
  );
}
