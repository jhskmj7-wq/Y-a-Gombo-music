const fs = require('fs');
const file = 'src/components/avatar/AvatarEditor.tsx';
let content = fs.readFileSync(file, 'utf8');

const newTabs = `const TABS = [
  { id: 'couleur_peau', label: 'Peau 🎨' },
  { id: 'forme_visage', label: 'Forme 👤' },
  { id: 'cheveux', label: 'Cheveux 💇' },
  { id: 'visage_base', label: 'Détails Visage 👤' },
  { id: 'yeux', label: 'Yeux 👁️' },
  { id: 'sourcils', label: 'Sourcils 🤨' },
  { id: 'nez', label: 'Nez 👃' },
  { id: 'bouche', label: 'Bouche 👄' },
  { id: 'barbe', label: 'Barbe 🧔' },
  { id: 'moustache', label: 'Moustache 🧔' },
  { id: 'cicatrices', label: 'Cicatrices ⚔️' },
  { id: 'maquillage', label: 'Maquillage 💄' },
  { id: 'lunettes', label: 'Lunettes 🕶️' },
  { id: 'tee-shirt', label: 'T-Shirt 👕' },
  { id: 'chemise', label: 'Chemise 👔' },
  { id: 'veste', label: 'Veste 🧥' },
  { id: 'manteau', label: 'Manteau 🧥' },
  { id: 'pantalons', label: 'Pantalons 👖' },
  { id: 'robes', label: 'Robes 👗' },
  { id: 'costumes', label: 'Costumes 🕴️' },
  { id: 'chaussures', label: 'Chaussures 👟' },
  { id: 'tenues_africaines', label: 'Tenues Afr 🌍' },
  { id: 'tenues_ivoiriennes', label: 'Tenues Civ 🇨🇮' },
  { id: 'tenues_scene', label: 'Tenues Scène 🎤' },
  { id: 'casquettes', label: 'Casquettes 🧢' },
  { id: 'chapeaux', label: 'Chapeaux 🎩' },
  { id: 'couronnes', label: 'Couronnes 👑' },
  { id: 'ecouteurs', label: 'Écouteurs 🎧' },
  { id: 'collier', label: 'Colliers 📿' },
  { id: 'chaines', label: 'Chaînes ⛓️' },
  { id: 'montres', label: 'Montres ⌚' },
  { id: 'bagues', label: 'Bagues 💍' },
  { id: 'bracelets', label: 'Bracelets 📿' },
  { id: 'sac', label: 'Sacs 👜' },
  { id: 'accessoires', label: 'Accessoires 💎' },
  { id: 'effets_speciaux', label: 'Effets ✨' },
  { id: 'arriere_plans', label: 'Fond 🌅' },
  
  // Legacy mappings for backwards compatibility (optional, but keep just in case for old items)
  { id: 'coiffures', label: 'Coiffures (Ancien) 💇' },
  { id: 'vêtements', label: 'Vêtements (Ancien) 👕' },
  { id: 'instruments', label: 'Instruments (Ancien) 🪘' },
];`;

content = content.replace(/const TABS = \[[\s\S]*?\];/, newTabs);

const newMapConfig = `export function mapCategoryToConfigKey(category: string): string {
  const legacyMap: Record<string, string> = {
    'coiffures': 'hair', 'cheveux': 'cheveux', 'visage': 'visage_base', 'barbe': 'barbe',
    'forme_visage': 'faceShape', 'yeux': 'yeux', 'sourcils': 'sourcils', 'nez': 'nez',
    'bouche': 'bouche', 'piercings': 'accessoires', 'lunettes': 'lunettes',
    'accessoires': 'accessoires', 'instruments': 'effets_speciaux', 'couronnes': 'couronnes',
    'chaussures': 'chaussures', 'vêtements': 'chemise', 'arriere-plans': 'arriere_plans',
    'arriere_plans': 'arriere_plans'
  };
  return legacyMap[category] || category;
}`;

content = content.replace(/export function mapCategoryToConfigKey[\s\S]*?^}/m, newMapConfig);

fs.writeFileSync(file, content);
