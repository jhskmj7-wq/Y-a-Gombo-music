import React, { memo } from 'react';
import { AvatarConfig, AvatarItem } from '../../types/avatar';
import { useTheme } from '../../context/ThemeContext';
import AvatarThreeCanvas from './AvatarThreeCanvas';

export interface AvatarRendererProps {
  config: AvatarConfig | any;
  size?: number;
  className?: string;
  storeItems?: AvatarItem[];
  isSaving?: boolean;
  expression?: 'neutral' | 'smile' | 'wink' | 'excited' | 'saving';
}

/**
 * AFRIGOMBO ELITE - TRUE 3D STYLIZED MEMOJI / BITMOJI AVATAR ENGINE
 * Renders real-time 3D WebGL meshes with toon shading, lighting, and volumetric melanin skin shaders.
 */
const AvatarRenderer = memo(({ 
  config, 
  size = 120, 
  className = "", 
  storeItems = [],
  isSaving = false,
  expression
}: AvatarRendererProps) => {
  const { theme } = useTheme();
  const bgColor = config?.background || (theme === "light" ? "#f3f4f6" : "#1f2937");

  return (
    <div 
      className={`relative overflow-hidden flex items-center justify-center transition-all duration-300 rounded-2xl ${className}`}
      style={{ width: size, height: size, backgroundColor: bgColor }}
    >
      <AvatarThreeCanvas 
        config={config} 
        size={size} 
        storeItems={storeItems} 
        isSaving={isSaving} 
        expression={expression} 
      />
    </div>
  );
});

export default AvatarRenderer;
