import React from 'react';
import { AvatarConfig } from '../../types/avatar';
import { useTheme } from '../../context/ThemeContext';

interface AvatarRendererProps {
  config: AvatarConfig;
  size?: number;
  className?: string;
  storeItems?: any[]; // To get the svgContent if available
}

export default function AvatarRenderer({ config, size = 120, className = "", storeItems = [] }: AvatarRendererProps) {
  const { theme } = useTheme();
  
  // Base SVG layers
  const skinColor = config.skinColor || "#8D5524"; // Default skin tone
  const bgColor = config.background || (theme === "light" ? "#f3f4f6" : "#1f2937");

  // Helper to find item svgContent
  const renderItem = (itemId: string, defaultSvg?: React.ReactNode) => {
    if (!itemId) return defaultSvg || null;
    const item = storeItems.find(i => i.id === itemId);
    if (item && item.svgContent) {
      return <g dangerouslySetInnerHTML={{ __html: item.svgContent }} />;
    }
    return defaultSvg || null;
  };

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
        {/* BACKGROUND ACCENTS (if any) */}
        {renderItem(config.background)}

        {/* CHAUSSURES / BASE ACCENTS */}
        {config.chaussures && renderItem(config.chaussures)}

        {/* BODY (Shoulders/Torso) */}
        <path d="M40 200 Q100 120 160 200 Z" fill={skinColor} />
        
        {/* CLOTHES */}
        {config.clothes ? (
           renderItem(config.clothes)
        ) : (
          <path d="M40 200 Q100 130 160 200 Z" fill={theme === "light" ? "#D4AF37" : "#B8860B"} />
        )}

        {/* HEAD */}
        <circle cx="100" cy="90" r="45" fill={skinColor} />

        {/* VISAGE / SHAPE OVERLAY */}
        {config.visage && renderItem(config.visage)}
        {config.faceShape && config.faceShape !== 'default' && (
          <path 
            d={config.faceShape === 'oval' 
              ? "M65 110 Q100 135 135 110" 
              : config.faceShape === 'square'
                ? "M60 110 L80 128 L120 128 L140 110"
                : "M60 105 Q100 125 140 105"} 
            stroke="#4A3018" 
            strokeWidth="1.5" 
            fill="none" 
            opacity="0.3" 
          />
        )}

        {/* SOURCILS (Eyebrows) */}
        {renderItem(config.sourcils, (
          <g id="default-eyebrows">
            <path d="M72 73 Q85 68 93 72" stroke="#1A1A1A" strokeWidth="2" fill="transparent" strokeLinecap="round" />
            <path d="M107 72 Q115 68 128 73" stroke="#1A1A1A" strokeWidth="2" fill="transparent" strokeLinecap="round" />
          </g>
        ))}

        {/* MOUTH */}
        {renderItem(config.mouth, (
          <path d="M85 110 Q100 120 115 110" stroke="#4A3018" strokeWidth="3" fill="transparent" strokeLinecap="round" />
        ))}

        {/* EYES */}
        {renderItem(config.eyes, (
          <g>
            <circle cx="85" cy="80" r="4" fill="#1A1A1A" />
            <circle cx="115" cy="80" r="4" fill="#1A1A1A" />
          </g>
        ))}

        {/* HAIR / HEADWEAR */}
        {renderItem(config.hair, (
          <path d="M55 90 Q100 30 145 90 Q100 50 55 90" fill="#1A1A1A" />
        ))}

        {/* COURONNES */}
        {config.couronnes && renderItem(config.couronnes)}

        {/* ACCESSORIES (Glasses, Earrings, etc.) */}
        {config.accessories?.map(accId => (
          <g key={accId}>{renderItem(accId)}</g>
        ))}

        {/* INSTRUMENTS (Guitars, Mics, etc.) */}
        {config.instruments?.map(instId => (
          <g key={instId}>{renderItem(instId)}</g>
        ))}
      </svg>
    </div>
  );
}
