const fs = require('fs');
const file = 'src/components/avatar/AvatarStore.tsx';
let content = fs.readFileSync(file, 'utf8');

const storeCategories = `const CATEGORIES: { id: AvatarItemCategory | 'all' | 'limited'; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Tous', icon: <ShoppingBag className="w-4 h-4" /> },
  { id: 'limited', label: 'Éditions Limitées 🔥', icon: <Clock className="w-4 h-4 text-amber-400" /> },
  { id: 'tee-shirt', label: 'T-Shirts', icon: '👕' },
  { id: 'chemise', label: 'Chemises', icon: '👔' },
  { id: 'veste', label: 'Vestes', icon: '🧥' },
  { id: 'pantalons', label: 'Pantalons', icon: '👖' },
  { id: 'robes', label: 'Robes', icon: '👗' },
  { id: 'costumes', label: 'Costumes', icon: '🕴️' },
  { id: 'tenues_africaines', label: 'Style Afrique', icon: '🌍' },
  { id: 'tenues_ivoiriennes', label: 'Style CIV', icon: '🇨🇮' },
  { id: 'chaussures', label: 'Chaussures', icon: '👟' },
  { id: 'casquettes', label: 'Casquettes', icon: '🧢' },
  { id: 'couronnes', label: 'Couronnes', icon: '👑' },
  { id: 'lunettes', label: 'Lunettes', icon: '🕶️' },
  { id: 'montres', label: 'Montres', icon: '⌚' },
  { id: 'chaines', label: 'Chaînes', icon: '⛓️' },
  { id: 'cheveux', label: 'Cheveux', icon: '💇' },
  { id: 'visage_base', label: 'Visage', icon: '👤' },
  { id: 'effets_speciaux', label: 'Effets', icon: '✨' },
  { id: 'arriere_plans', label: 'Arrière-plans', icon: '🌅' },
  { id: 'premium', label: 'VIP Premium', icon: <Crown className="w-4 h-4 text-[#D4AF37]" /> },
];`;

content = content.replace(/const CATEGORIES:[\s\S]*?\];/, storeCategories);

fs.writeFileSync(file, content);
