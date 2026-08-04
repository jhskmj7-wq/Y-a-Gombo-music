const fs = require('fs');
const file = 'src/types/avatar.ts';
let content = fs.readFileSync(file, 'utf8');

const newCategoryDefinition = `export type AvatarItemCategory = 
  // Nouveaux types (Moteur v2)
  | 'corps'
  | 'tete'
  | 'visage_base'
  | 'yeux'
  | 'sourcils'
  | 'nez'
  | 'bouche'
  | 'barbe'
  | 'moustache'
  | 'cicatrices'
  | 'maquillage'
  | 'lunettes'
  | 'cheveux'
  | 'tee-shirt'
  | 'chemise'
  | 'veste'
  | 'manteau'
  | 'collier'
  | 'sac'
  | 'casquettes'
  | 'chapeaux'
  | 'couronnes'
  | 'ecouteurs'
  | 'chaines'
  | 'montres'
  | 'bagues'
  | 'bracelets'
  | 'chaussures'
  | 'pantalons'
  | 'robes'
  | 'costumes'
  | 'tenues_africaines'
  | 'tenues_ivoiriennes'
  | 'tenues_scene'
  | 'effets_speciaux'
  | 'arriere_plans'
  // Anciens types (Compatibilité)
  | 'vêtements'
  | 'accessoires'
  | 'instruments'
  | 'afrique'
  | 'coiffures'
  | 'animations'
  | 'arriere-plans'
  | 'visage'
  | 'couleur_peau'
  | 'premium'
  | 'badges'
  | string;`;

content = content.replace(/export type AvatarItemCategory =[\s\S]*?;/, newCategoryDefinition);

const engineConfigStr = `export interface AvatarEngineConfig {
  anchorX: number;
  anchorY: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  zIndex: number;
  incompatibleWith?: string[]; // IDs d'articles ou catégories incompatibles
}

`;

if (!content.includes('AvatarEngineConfig')) {
  content = content.replace('export interface AvatarItem {', engineConfigStr + 'export interface AvatarItem {');
}

const newItemFields = `  engineConfig?: AvatarEngineConfig;
  creatorId?: string;
  creatorName?: string;
  salesCount?: number;`;

if (!content.includes('engineConfig?:')) {
  content = content.replace('  isActive: boolean;\n}', '  isActive: boolean;\n' + newItemFields + '\n}');
}

const v2Config = `
export interface AvatarEngineConfigV2 {
  items: Record<string, string>; // category -> itemId
  skinColor?: string;
}

export interface UserAvatarData {
  config: AvatarConfig;
  configV2?: AvatarEngineConfigV2; // Nouveau format
  useAvatarAsProfile: boolean;
  inventory: string[]; // IDs of purchased AvatarItems
  lastUpdated?: string;
  updatedAt?: string;
}
`;

content = content.replace(/export interface UserAvatarData \{[\s\S]*?\}/, v2Config.trim());

fs.writeFileSync(file, content);
