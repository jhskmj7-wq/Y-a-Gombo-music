import React, { useState, useEffect } from 'react';
import { Save, ShoppingBag, UserCheck, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { AvatarConfig, UserAvatarData, AvatarItemCategory, AvatarItem, UserInventoryData } from '../../types/avatar';
import { AvatarEngine } from '../../lib/avatarEngine';
import { useAuth } from '../../AuthContext';
import AvatarRenderer from './AvatarRenderer';
import AvatarStore from './AvatarStore';

interface AvatarEditorProps {
  onClose: () => void;
}

const DEFAULT_CONFIG: AvatarConfig = {
  skinColor: '#8D5524',
  faceShape: 'default',
  hair: '',
  eyes: '',
  mouth: '',
  clothes: '',
  accessories: [],
  instruments: [],
  background: '',
  couronnes: '',
  chaussures: '',
  sourcils: '',
  visage: '',
  nez: '',
  // Extra fields for V2 mapping in flat config
  tete: '',
  corps: '',
  visage_base: '',
  yeux: '',
  bouche: '',
  barbe: '',
  moustache: '',
  cicatrices: '',
  maquillage: '',
  cheveux: '',
  'tee-shirt': '',
  chemise: '',
  veste: '',
  manteau: '',
  pantalons: '',
  jeans: '',
  robes: '',
  costumes: '',
  tenues_africaines: '',
  tenues_ivoiriennes: '',
  tenues_scene: '',
  casquettes: '',
  chapeaux: '',
  ecouteurs: '',
  collier: '',
  chaines: '',
  montres: '',
  bagues: '',
  bracelets: '',
  sac: '',
  ailes: '',
  badges: '',
  effets_speciaux: '',
  arriere_plans: '',
  sneakers: '',
  sous_vetement: ''
};

const TABS = [
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
  { id: 'jeans', label: 'Jeans 👖' },
  { id: 'robes', label: 'Robes 👗' },
  { id: 'costumes', label: 'Costumes 🕴️' },
  { id: 'chaussures', label: 'Chaussures 👞' },
  { id: 'sneakers', label: 'Sneakers 👟' },
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
  { id: 'ailes', label: 'Ailes 🦅' },
  { id: 'badges', label: 'Badges 🎖️' },
  { id: 'accessoires', label: 'Accessoires 💎' },
  { id: 'effets_speciaux', label: 'Effets ✨' },
  { id: 'arriere_plans', label: 'Fond 🌅' },
  
  // Legacy mappings for backwards compatibility (optional, but keep just in case for old items)
  { id: 'coiffures', label: 'Coiffures (Ancien) 💇' },
  { id: 'vêtements', label: 'Vêtements (Ancien) 👕' },
  { id: 'instruments', label: 'Instruments (Ancien) 🪘' },
];

const FREE_DEFAULT_ITEMS: AvatarItem[] = [
  // BARBE / MOUSTACHE (visage)
  {
    id: "visage_naturel",
    name: "Sans Barbe",
    category: "barbe",
    price: 0,
    isActive: true,
    svgContent: `<g id="visage-naturel"></g>`
  },
  {
    id: "visage_barbe",
    name: "Barbe Courte",
    category: "barbe",
    price: 0,
    isActive: true,
    svgContent: `<path d="M78 118 Q100 138 122 118 L116 130 Q100 146 84 130 Z" fill="#111111" />`
  },
  {
    id: "visage_bouc",
    name: "Bouc de Star",
    category: "barbe",
    price: 0,
    isActive: true,
    svgContent: `<path d="M85 105 Q100 110 115 105 L112 125 Q100 135 88 125 Z" fill="#222" /><path d="M90 102 L110 102" stroke="#222" stroke-width="2" />`
  },
  {
    id: "visage_barbe_longue",
    name: "Barbe Impériale",
    category: "barbe",
    price: 0,
    isActive: true,
    svgContent: `<path d="M70 105 Q100 160 130 105 Q100 135 70 105 Z" fill="#0f0f0f" />`
  },
  {
    id: "visage_moustache",
    name: "Moustache Fine",
    category: "barbe",
    price: 0,
    isActive: true,
    svgContent: `<path d="M80 104 Q92 100 100 105 Q108 100 120 104 Q108 108 100 106 Q92 108 80 104 Z" fill="#111" />`
  },
  {
    id: "visage_barbe_fournie",
    name: "Barbe Fournie",
    category: "barbe",
    price: 0,
    isActive: true,
    svgContent: `<path d="M68 95 Q100 150 132 95 L125 125 Q100 142 75 125 Z" fill="#181818" />`
  },

  // COIFFURES
  {
    id: "hair_ras",
    name: "Rasé Court",
    category: "coiffures",
    price: 0,
    isActive: true,
    svgContent: `<path d="M100 45" />`
  },
  {
    id: "hair_afro",
    name: "Afro Court",
    category: "coiffures",
    price: 0,
    isActive: true,
    svgContent: `<path d="M50 85 Q100 20 150 85 Q100 45 50 85 Z" fill="#111" />`
  },
  {
    id: "hair_afro_grand",
    name: "Afro Grand Volume",
    category: "coiffures",
    price: 0,
    isActive: true,
    svgContent: `<circle cx="100" cy="70" r="48" fill="#111" />`
  },
  {
    id: "hair_nattes",
    name: "Nattes Dorées",
    category: "coiffures",
    price: 0,
    isActive: true,
    svgContent: `<g fill="#1A1A1A"><path d="M55 85 C55 40, 145 40, 145 85 Q100 45 55 85 Z" /><path d="M72 50 L72 85 M100 45 L100 85 M128 50 L128 85" stroke="#D4AF37" stroke-width="2.5" stroke-linecap="round" /></g>`
  },
  {
    id: "hair_dreads",
    name: "Dreadlocks",
    category: "coiffures",
    price: 0,
    isActive: true,
    svgContent: `<g fill="#1A1A1A"><path d="M50 85 Q100 20 150 85" stroke="#1A1A1A" stroke-width="8" stroke-linecap="round" /><path d="M60 50 L40 100" stroke="#1A1A1A" stroke-width="6" stroke-linecap="round" /><path d="M140 50 L160 100" stroke="#1A1A1A" stroke-width="6" stroke-linecap="round" /></g>`
  },
  {
    id: "hair_dreads_longues",
    name: "Dreadlocks Longues",
    category: "coiffures",
    price: 0,
    isActive: true,
    svgContent: `<g fill="#111"><path d="M50 85 Q100 20 150 85" stroke="#111" stroke-width="8" stroke-linecap="round" /><path d="M55 50 L35 130 M65 50 L45 135 M135 50 L155 135 M145 50 L165 130" stroke="#111" stroke-width="6" stroke-linecap="round" /></g>`
  },
  {
    id: "hair_twists",
    name: "Twists Urbains",
    category: "coiffures",
    price: 0,
    isActive: true,
    svgContent: `<g fill="#1a1a1a"><path d="M55 75 Q100 25 145 75" stroke="#1a1a1a" stroke-width="10" stroke-linecap="round" /><path d="M70 45 L70 90 M100 35 L100 90 M130 45 L130 90" stroke="#D4AF37" stroke-width="2" /></g>`
  },
  {
    id: "hair_degrade",
    name: "Dégradé Vague",
    category: "coiffures",
    price: 0,
    isActive: true,
    svgContent: `<path d="M58 85 C58 50, 142 50, 142 85 C120 55, 80 55, 58 85 Z" fill="#111" />`
  },
  {
    id: "hair_attache",
    name: "Coiffure Attachée",
    category: "coiffures",
    price: 0,
    isActive: true,
    svgContent: `<g fill="#111"><circle cx="100" cy="35" r="20" /><path d="M60 85 Q100 40 140 85 Z" /></g>`
  },

  // SOURCILS
  {
    id: "sourcils_fins",
    name: "Sourcils Classiques",
    category: "sourcils",
    price: 0,
    isActive: true,
    svgContent: `<g><path d="M72 73 Q85 68 93 72" stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round" /><path d="M107 72 Q115 68 128 73" stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round" /></g>`
  },
  {
    id: "sourcils_epais",
    name: "Sourcils Épais",
    category: "sourcils",
    price: 0,
    isActive: true,
    svgContent: `<g><path d="M71 73 Q85 65 94 72" stroke="#111" stroke-width="4.5" fill="none" stroke-linecap="round" /><path d="M106 72 Q115 65 129 73" stroke="#111" stroke-width="4.5" fill="none" stroke-linecap="round" /></g>`
  },
  {
    id: "sourcils_arques",
    name: "Sourcils Arqués",
    category: "sourcils",
    price: 0,
    isActive: true,
    svgContent: `<g><path d="M70 75 Q82 64 94 71" stroke="#111" stroke-width="3" fill="none" stroke-linecap="round" /><path d="M106 71 Q118 64 130 75" stroke="#111" stroke-width="3" fill="none" stroke-linecap="round" /></g>`
  },
  {
    id: "sourcils_droits",
    name: "Sourcils Droits",
    category: "sourcils",
    price: 0,
    isActive: true,
    svgContent: `<g><path d="M72 72 L93 72" stroke="#1a1a1a" stroke-width="3.5" stroke-linecap="round" /><path d="M107 72 L128 72" stroke="#1a1a1a" stroke-width="3.5" stroke-linecap="round" /></g>`
  },

  // YEUX
  {
    id: "eyes_standard",
    name: "Regard Standard",
    category: "yeux",
    price: 0,
    isActive: true,
    svgContent: `<g><circle cx="85" cy="80" r="4.5" fill="#111" /><circle cx="115" cy="80" r="4.5" fill="#111" /></g>`
  },
  {
    id: "eyes_expressif",
    name: "Regard Expressif",
    category: "yeux",
    price: 0,
    isActive: true,
    svgContent: `<g><circle cx="85" cy="80" r="5" fill="#111" /><circle cx="115" cy="80" r="5" fill="#111" /><circle cx="83" cy="78" r="1.5" fill="#FFF" /><circle cx="113" cy="78" r="1.5" fill="#FFF" /></g>`
  },
  {
    id: "eyes_marron",
    name: "Yeux Marron Cacao",
    category: "yeux",
    price: 0,
    isActive: true,
    svgContent: `<g><circle cx="85" cy="80" r="5.5" fill="#4E3629" /><circle cx="115" cy="80" r="5.5" fill="#4E3629" /><circle cx="85" cy="80" r="2.5" fill="#111" /><circle cx="115" cy="80" r="2.5" fill="#111" /></g>`
  },
  {
    id: "eyes_dorés",
    name: "Yeux Or Impérial",
    category: "yeux",
    price: 0,
    isActive: true,
    svgContent: `<g><circle cx="85" cy="80" r="6" fill="#D4AF37" /><circle cx="115" cy="80" r="6" fill="#D4AF37" /><circle cx="85" cy="80" r="2.5" fill="#111" /><circle cx="115" cy="80" r="2.5" fill="#111" /><circle cx="83" cy="78" r="1" fill="#FFF" /><circle cx="113" cy="78" r="1" fill="#FFF" /></g>`
  },

  // NEZ
  {
    id: "nez_naturel",
    name: "Nez Naturel",
    category: "nez",
    price: 0,
    isActive: true,
    svgContent: `<path d="M100 82 L98 96 L104 96" stroke="#4A3018" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.6" />`
  },
  {
    id: "nez_sculpte",
    name: "Nez Sculpté",
    category: "nez",
    price: 0,
    isActive: true,
    svgContent: `<path d="M100 80 L96 95 Q100 100 104 95 L100 80" stroke="#3A2010" stroke-width="2" fill="none" stroke-linecap="round" />`
  },
  {
    id: "nez_royal",
    name: "Nez Impérial",
    category: "nez",
    price: 0,
    isActive: true,
    svgContent: `<path d="M99 78 L95 96 L105 96 Z" fill="none" stroke="#4A3018" stroke-width="2" opacity="0.7" />`
  },

  // BOUCHE
  {
    id: "mouth_sourire",
    name: "Sourire Amical",
    category: "bouche",
    price: 0,
    isActive: true,
    svgContent: `<path d="M82 108 Q100 124 118 108" stroke="#4A3018" stroke-width="3.5" fill="none" stroke-linecap="round" />`
  },
  {
    id: "mouth_rire",
    name: "Rire Éclatant",
    category: "bouche",
    price: 0,
    isActive: true,
    svgContent: `<path d="M82 108 Q100 135 118 108 Z" fill="#800" stroke="#4A3018" stroke-width="2" /><path d="M86 110 Q100 118 114 110" fill="#FFF" />`
  },
  {
    id: "mouth_neutre",
    name: "Bouche Neutre",
    category: "bouche",
    price: 0,
    isActive: true,
    svgContent: `<line x1="84" y1="112" x2="116" y2="112" stroke="#4A3018" stroke-width="3.5" stroke-linecap="round" />`
  },
  {
    id: "mouth_expressive",
    name: "Sourire Expressif",
    category: "bouche",
    price: 0,
    isActive: true,
    svgContent: `<path d="M80 108 Q100 130 120 108" stroke="#3A1D0E" stroke-width="4" fill="none" stroke-linecap="round" />`
  },

  // PIERCINGS
  {
    id: "acc_creoles",
    name: "Boucles Créoles",
    category: "piercings",
    price: 0,
    isActive: true,
    svgContent: `<g><circle cx="53" cy="98" r="5" fill="none" stroke="#D4AF37" stroke-width="2.5" /><circle cx="147" cy="98" r="5" fill="none" stroke="#D4AF37" stroke-width="2.5" /></g>`
  },
  {
    id: "acc_piercing_nez",
    name: "Anneau de Nez Or",
    category: "piercings",
    price: 0,
    isActive: true,
    svgContent: `<circle cx="94" cy="95" r="2.5" fill="none" stroke="#D4AF37" stroke-width="1.5" />`
  },
  {
    id: "acc_piercing_arcade",
    name: "Piercing Arcade",
    category: "piercings",
    price: 0,
    isActive: true,
    svgContent: `<g><circle cx="71" cy="68" r="1.5" fill="#D4AF37" /><circle cx="75" cy="68" r="1.5" fill="#D4AF37" /></g>`
  },

  // LUNETTES
  {
    id: "eyes_star",
    name: "Lunettes de Star VIP",
    category: "lunettes",
    price: 0,
    isActive: true,
    svgContent: `<g><rect x="72" y="73" width="22" height="15" rx="4" fill="#111" stroke="#D4AF37" stroke-width="2" /><rect x="106" y="73" width="22" height="15" rx="4" fill="#111" stroke="#D4AF37" stroke-width="2" /><line x1="94" y1="80" x2="106" y2="80" stroke="#D4AF37" stroke-width="2.5" /></g>`
  },
  {
    id: "acc_lunettes_rondes",
    name: "Lunettes Rondes VIP",
    category: "lunettes",
    price: 0,
    isActive: true,
    svgContent: `<g><circle cx="83" cy="80" r="12" fill="none" stroke="#D4AF37" stroke-width="2" /><circle cx="117" cy="80" r="12" fill="none" stroke="#D4AF37" stroke-width="2" /><line x1="95" y1="80" x2="105" y2="80" stroke="#D4AF37" stroke-width="2" /></g>`
  },
  {
    id: "acc_lunettes_sport",
    name: "Lunettes Sport Futuriste",
    category: "lunettes",
    price: 0,
    isActive: true,
    svgContent: `<path d="M68 74 L132 74 L128 88 L72 88 Z" fill="#111" stroke="#E74C3C" stroke-width="2" opacity="0.9" />`
  },

  // VÊTEMENTS
  {
    id: "clothes_tunique_blanche",
    name: "Tunique Blanche",
    category: "vêtements",
    price: 0,
    isActive: true,
    svgContent: `<path d="M40 200 Q100 130 160 200 Z" fill="#F9F9F9" stroke="#DDD" stroke-width="2" /><path d="M90 145 L110 145 L100 165 Z" fill="#D4AF37" />`
  },
  {
    id: "clothes_wax_orange",
    name: "Tunique Wax Orange",
    category: "vêtements",
    price: 0,
    isActive: true,
    svgContent: `<path d="M40 200 Q100 130 160 200 Z" fill="#E67E22" stroke="#962D00" stroke-width="2" /><circle cx="100" cy="160" r="4" fill="#3498DB" /><circle cx="100" cy="180" r="4" fill="#3498DB" />`
  },
  {
    id: "clothes_hiphop",
    name: "Débardeur Noir",
    category: "vêtements",
    price: 0,
    isActive: true,
    svgContent: `<path d="M50 200 L60 155 Q100 140 140 155 L150 200 Z" fill="#111111" />`
  },
  {
    id: "clothes_boubou",
    name: "Boubou Royal Impérial",
    category: "vêtements",
    price: 0,
    isActive: true,
    svgContent: `<path d="M30 200 Q100 110 170 200 Z" fill="#112233" stroke="#D4AF37" stroke-width="3" /><path d="M85 140 L115 140 L100 170 Z" fill="#D4AF37" />`
  },
  {
    id: "clothes_veste",
    name: "Veste Sapeur Rouge",
    category: "vêtements",
    price: 0,
    isActive: true,
    svgContent: `<path d="M38 200 L55 145 Q100 130 145 145 L162 200 Z" fill="#C0392B" /><path d="M85 145 L100 175 L115 145" fill="#FFF" />`
  },

  // CHAUSSURES
  {
    id: "shoes_ville",
    name: "Souliers Marrons",
    category: "chaussures",
    price: 0,
    isActive: true,
    svgContent: `<g><ellipse cx="70" cy="195" rx="15" ry="6" fill="#4E3629" /><ellipse cx="130" cy="195" rx="15" ry="6" fill="#4E3629" /></g>`
  },
  {
    id: "shoes_baskets_or",
    name: "Baskets Dorées",
    category: "chaussures",
    price: 0,
    isActive: true,
    svgContent: `<g><ellipse cx="70" cy="195" rx="16" ry="7" fill="#D4AF37" stroke="#996515" stroke-width="1.5" /><ellipse cx="130" cy="195" rx="16" ry="7" fill="#D4AF37" stroke="#996515" stroke-width="1.5" /></g>`
  },
  {
    id: "shoes_sandales",
    name: "Léké Gombo",
    category: "chaussures",
    price: 0,
    isActive: true,
    svgContent: `<g><rect x="52" y="192" width="30" height="6" rx="2" fill="#555" /><rect x="118" y="192" width="30" height="6" rx="2" fill="#555" /><path d="M67 192 L67 185" stroke="#111" stroke-width="3" /></g>`
  },

  // ACCESSOIRES
  {
    id: "acc_perles",
    name: "Collier de Perles",
    category: "accessoires",
    price: 0,
    isActive: true,
    svgContent: `<path d="M72 130 Q100 155 128 130" stroke="#FFF" stroke-width="4" fill="none" stroke-dasharray="3 1" />`
  },
  {
    id: "acc_chaine_or",
    name: "Chaîne en Or VIP",
    category: "accessoires",
    price: 0,
    isActive: true,
    svgContent: `<path d="M60 135 Q100 165 140 135" stroke="#D4AF37" stroke-width="4" fill="none" />`
  },

  // COURONNES
  {
    id: "crown_paille",
    name: "Chapeau de Sapeur",
    category: "couronnes",
    price: 0,
    isActive: true,
    svgContent: `<g><ellipse cx="100" cy="52" rx="42" ry="14" fill="#C2B280" stroke="#8B7355" stroke-width="1.5" /><path d="M72 50 C72 25, 128 25, 128 50 Z" fill="#C2B280" /><rect x="74" y="44" width="52" height="6" fill="#8B0000" /></g>`
  },
  {
    id: "crown_rasta",
    name: "Bonnet Rasta",
    category: "couronnes",
    price: 0,
    isActive: true,
    svgContent: `<path d="M60 70 C60 25, 140 25, 140 70 Z" fill="#E74C3C" /><path d="M62 65 Q100 28 138 65 Z" fill="#F1C40F" /><path d="M68 55 Q100 32 132 55 Z" fill="#2ECC71" />`
  },
  {
    id: "crown_akan",
    name: "Couronne Royale Akan",
    category: "couronnes",
    price: 0,
    isActive: true,
    svgContent: `<g><path d="M65 55 L75 25 L88 45 L100 20 L112 45 L125 25 L135 55 Z" fill="#D4AF37" stroke="#996515" stroke-width="1.5" /><rect x="65" y="52" width="70" height="8" fill="#800" /></g>`
  },

  // INSTRUMENTS
  {
    id: "inst_djembe",
    name: "Djembe Traditionnel",
    category: "instruments",
    price: 0,
    isActive: true,
    svgContent: `<g><path d="M140 130 L165 130 L158 175 L147 175 Z" fill="#8B4513" stroke="#D4AF37" stroke-width="1" /><ellipse cx="152.5" cy="130" rx="12.5" ry="4" fill="#F5F5DC" /></g>`
  },
  {
    id: "inst_guitare",
    name: "Guitare Électrique",
    category: "instruments",
    price: 0,
    isActive: true,
    svgContent: `<g><path d="M145 110 Q160 120 150 140 Q135 150 130 135 Z" fill="#E74C3C" stroke="#111" stroke-width="1.5" /><line x1="140" y1="125" x2="175" y2="90" stroke="#111" stroke-width="3" /></g>`
  },
  {
    id: "inst_micro",
    name: "Microphone Or",
    category: "instruments",
    price: 0,
    isActive: true,
    svgContent: `<g><rect x="148" y="115" width="8" height="25" rx="3" fill="#333" /><circle cx="152" cy="112" r="7" fill="#D4AF37" /></g>`
  },

  // ARRIÈRE-PLANS
  {
    id: "bg_crepuscule",
    name: "Gombo Crépuscule",
    category: "arriere-plans",
    price: 0,
    isActive: true,
    svgContent: `<rect width="200" height="200" fill="#111c24" /><circle cx="100" cy="100" r="80" fill="#E74C3C" opacity="0.15" />`
  },
  {
    id: "bg_savane",
    name: "Savane Orange",
    category: "arriere-plans",
    price: 0,
    isActive: true,
    svgContent: `<rect width="200" height="200" fill="#E5A65D" /><circle cx="100" cy="100" r="50" fill="#E74C3C" opacity="0.6" />`
  },
  {
    id: "bg_studio",
    name: "Studio Gombo Noir",
    category: "arriere-plans",
    price: 0,
    isActive: true,
    svgContent: `<rect width="200" height="200" fill="#18181b" /><circle cx="100" cy="100" r="75" fill="none" stroke="#D4AF37" stroke-width="1.5" stroke-dasharray="8 4" opacity="0.3" />`
  }
];

// Helper to map UI category tabs to config keys
export function mapCategoryToConfigKey(category: string): string {
  const legacyMap: Record<string, string> = {
    'coiffures': 'hair', 'cheveux': 'cheveux', 'visage': 'visage_base', 'barbe': 'barbe',
    'forme_visage': 'faceShape', 'yeux': 'yeux', 'sourcils': 'sourcils', 'nez': 'nez',
    'bouche': 'bouche', 'piercings': 'accessoires', 'lunettes': 'lunettes',
    'accessoires': 'accessoires', 'instruments': 'effets_speciaux', 'couronnes': 'couronnes',
    'chaussures': 'chaussures', 'vêtements': 'chemise', 'arriere-plans': 'arriere_plans',
    'arriere_plans': 'arriere_plans'
  };
  return legacyMap[category] || category;
}

export default function AvatarEditor({ onClose }: AvatarEditorProps) {
  const { currentUser, profile } = useAuth();
  const [avatarData, setAvatarData] = useState<UserAvatarData | null>(null);
  const [config, setConfig] = useState<AvatarConfig>(DEFAULT_CONFIG);
  const [initialConfig, setInitialConfig] = useState<AvatarConfig | null>(null);
  const [inventory, setInventory] = useState<UserInventoryData>({
    uid: currentUser?.uid || "",
    ownedItems: [],
    equippedItems: [],
    coinsSpent: 0,
    premiumItems: []
  });

  const [storeItems, setStoreItems] = useState<AvatarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [useAsProfile, setUseAsProfile] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('couleur_peau');

  // Realtime Listeners for Store Items, User Avatar Config & User Inventory
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);

    const unsubItems = AvatarEngine.subscribeStoreItems((items) => {
      setStoreItems(items);
      setLoading(false);
    });

    const unsubInv = AvatarEngine.subscribeUserInventory(currentUser.uid, (inv) => {
      setInventory(inv);
    });

    const unsubAvatar = AvatarEngine.subscribeUserAvatar(currentUser.uid, (data) => {
      if (data) {
        setAvatarData(data);
        if (data.config) {
          const normalizedConfig = { ...DEFAULT_CONFIG };
          Object.keys(data.config).forEach((key) => {
            const normalizedKey = mapCategoryToConfigKey(key);
            (normalizedConfig as any)[normalizedKey] = (data.config as any)[key];
          });
          setConfig(normalizedConfig);
          setInitialConfig(prev => prev || normalizedConfig);
        } else if (profile?.avatarConfig) {
          setConfig(profile.avatarConfig);
          setInitialConfig(prev => prev || profile.avatarConfig);
        }
        setUseAsProfile(!!data.useAvatarAsProfile);
      } else if (profile?.avatarConfig) {
        setConfig(profile.avatarConfig);
        setInitialConfig(prev => prev || profile.avatarConfig);
        setUseAsProfile(!!profile?.useAvatarAsProfile);
      }
    });

    return () => {
      unsubItems();
      unsubInv();
      unsubAvatar();
    };
  }, [currentUser]);

  const handleCancel = () => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
    onClose();
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    setSaveSuccess(null);
    try {
      const finalConfig = { ...config };
      
      // Build V2 config from flat config
      const itemsV2: Record<string, string> = {};
      Object.entries(finalConfig).forEach(([key, value]) => {
        if (typeof value === 'string' && value && key !== 'skinColor' && key !== 'faceShape' && key !== 'background') {
          itemsV2[key] = value;
        }
      });
      
      // Special multi-items
      if (Array.isArray(finalConfig.accessories)) {
        finalConfig.accessories.forEach(id => { itemsV2['accessoires'] = id; }); // Limit to one for now or handle list
      }

      const configV2 = { items: itemsV2 };

      await AvatarEngine.saveUserAvatar(currentUser.uid, {
        config: finalConfig,
        configV2: configV2,
        useAvatarAsProfile: useAsProfile,
        inventory: inventory.ownedItems
      }, storeItems);

      const mergedStoreAndFreeItems = [...FREE_DEFAULT_ITEMS, ...storeItems];
      const avatarUri = AvatarEngine.generateAvatarSvgV2(configV2, finalConfig, mergedStoreAndFreeItems);
      
      // Update local profile state if needed via AuthContext? 
      // saveUserAvatar already updates the DB which profile listener should catch

      setSaveSuccess("Votre avatar Gombo Elite a été sauvegardé avec succès ! 🎉");
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (e: any) {
      console.error("Failed to save avatar", e);
      setSaveSuccess(`Erreur lors de la sauvegarde : ${e.message || "Inconnue"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSyncProfile = async () => {
    if (!currentUser) return;
    setSaving(true);
    setSaveSuccess(null);
    try {
      const finalConfig = { ...config };
      const itemsV2: Record<string, string> = {};
      Object.entries(finalConfig).forEach(([key, value]) => {
        if (typeof value === 'string' && value && key !== 'skinColor' && key !== 'faceShape') {
          itemsV2[key] = value;
        }
      });
      const configV2 = { items: itemsV2 };
      
      const mergedStoreAndFreeItems = [...FREE_DEFAULT_ITEMS, ...storeItems];
      const avatarUri = AvatarEngine.generateAvatarSvgV2(configV2, finalConfig, mergedStoreAndFreeItems);

      setUseAsProfile(true);

      await AvatarEngine.saveUserAvatar(currentUser.uid, {
        config: finalConfig,
        configV2: configV2,
        useAvatarAsProfile: true,
        inventory: inventory.ownedItems
      }, storeItems);

      setSaveSuccess("Votre avatar Elite est maintenant synchronisé avec votre profil public ! 🌟");
    } catch (e: any) {
      console.error("Sync failed", e);
      setSaveSuccess(`Erreur de synchronisation : ${e.message || "Inconnue"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEquip = async (itemId: string, category: AvatarItemCategory | string) => {
    if (!currentUser) return;

    const configKey = mapCategoryToConfigKey(category);

    setConfig(prev => {
      const next = { ...prev };
      if (configKey === 'accessories' || configKey === 'instruments') {
        const list = Array.isArray(next[configKey]) ? (next[configKey] as string[]) : [];
        if (list.includes(itemId)) {
          next[configKey] = list.filter(i => i !== itemId);
        } else {
          next[configKey] = [...list, itemId];
        }
      } else {
        (next as any)[configKey] = (next as any)[configKey] === itemId ? '' : itemId;
      }
      return next;
    });

    const isCurrentlyEquipped = inventory.equippedItems.includes(itemId);
    try {
      await AvatarEngine.equipItem(currentUser.uid, itemId, !isCurrentlyEquipped, category);
    } catch (err) {
      console.warn("Equip sync warning:", err);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-md text-afri-text font-mono text-xs gap-3">
        <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        <span>Chargement du Studio Avatar...</span>
      </div>
    );
  }

  const ownedStoreItems = storeItems.filter(item => inventory.ownedItems.includes(item.id));
  const itemsInActiveTab = [
    ...FREE_DEFAULT_ITEMS.filter(item => item.category === activeTab),
    ...ownedStoreItems.filter(item => item.category === activeTab)
  ];

  const renderItemPreview = (item: AvatarItem) => {
    if (item.imageUrl || item.previewImage || item.assetUrl) {
      return (
        <img 
          src={item.imageUrl || item.previewImage || item.assetUrl} 
          alt={item.name} 
          className="max-h-16 object-contain" 
        />
      );
    }
    if (item.svgContent) {
      const isHair = item.category === 'coiffures' || item.category === 'couronnes';
      const isMouth = item.category === 'bouche';
      const isEyes = item.category === 'yeux' || item.category === 'sourcils';
      const isVisage = item.category === 'visage' || item.category === 'barbe';
      const isClothes = item.category === 'vêtements';
      const isShoes = item.category === 'chaussures';

      return (
        <svg viewBox="0 0 200 200" className="w-16 h-16 drop-shadow">
          {isHair && <circle cx="100" cy="90" r="42" fill={config.skinColor} />}
          {isVisage && <circle cx="100" cy="90" r="45" fill={config.skinColor} />}
          {isMouth && (
            <g>
              <circle cx="100" cy="90" r="42" fill={config.skinColor} />
              <path d="M85 80 Q100 85 115 80" stroke="#111" strokeWidth="2.5" />
            </g>
          )}
          {isEyes && (
            <g>
              <circle cx="100" cy="90" r="42" fill={config.skinColor} />
              <path d="M85 110 Q100 115 115 110" stroke="#111" strokeWidth="2" fill="none" />
            </g>
          )}
          {isClothes && <path d="M40 200 Q100 120 160 200 Z" fill={config.skinColor} />}
          {isShoes && <path d="M50 170 L150 170" stroke="#444" strokeWidth="2" />}
          
          <g dangerouslySetInnerHTML={{ __html: item.svgContent }} />
        </svg>
      );
    }
    return <span className="text-2xl">🎭</span>;
  };

  return (
    <div className="fixed inset-0 z-[110] bg-zinc-950 md:bg-black/80 md:backdrop-blur-md flex flex-col items-center justify-center p-0 md:p-4 font-sans text-left overflow-hidden">
      <div className="w-full max-w-5xl h-full md:h-[90vh] bg-zinc-900 border-0 md:border border-afri-border/30 md:rounded-3xl flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Toast Notification */}
        {saveSuccess && (
          <div className="absolute inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-zinc-900 border border-[#D4AF37] p-6 rounded-3xl max-w-md text-center space-y-4 shadow-2xl animate-scaleUp">
              <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto text-3xl">
                {saveSuccess.includes("Erreur") ? "❌" : "🎉"}
              </div>
              <h3 className="text-sm font-black uppercase text-afri-text tracking-wider">
                {saveSuccess.includes("Erreur") ? "ERREUR" : "SAUVEGARDE RÉUSSIE"}
              </h3>
              <p className="text-xs text-afri-text-sec leading-relaxed">
                {saveSuccess}
              </p>
            </div>
          </div>
        )}
        
        {/* Top Bar */}
        <div className="shrink-0 bg-zinc-950 border-b border-afri-border/30 px-4 py-3.5 flex items-center justify-between z-40">
          <div className="flex items-center gap-2">
            <button onClick={handleCancel} className="md:hidden text-afri-text-sec hover:text-afri-text p-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xs sm:text-sm font-black uppercase text-afri-text tracking-wider font-sans">
              MON AVATAR GOMBO
            </h2>
            <span className="px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 text-[9px] font-mono font-bold rounded-full">
              {inventory.ownedItems.length} ARTICLES
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCancel}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-afri-text-sec hover:text-afri-text transition cursor-pointer"
            >
              Annuler
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow hover:bg-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <span className="w-3.5 h-3.5 border-2 border-afri-border border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Sauvegarder
            </button>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Column: Preview & Profile Options */}
          <div className="w-full md:w-[320px] bg-zinc-950 md:border-r border-afri-border/30 p-5 flex flex-col items-center justify-start gap-4 shrink-0 overflow-y-auto">
            <div className="flex items-center justify-center w-full min-h-[200px] max-h-[260px]">
              <AvatarRenderer 
                config={config} 
                size={190} 
                storeItems={[...FREE_DEFAULT_ITEMS, ...storeItems]} 
                className="shadow-2xl rounded-3xl overflow-hidden border border-afri-border/40" 
              />
            </div>
            
            <div className="w-full space-y-3">
              {/* Profile Sync Checkbox */}
              <label className="flex items-center gap-3 p-3.5 bg-zinc-900 rounded-2xl border border-afri-border/30 cursor-pointer hover:border-[#D4AF37]/50 transition">
                <input 
                  type="checkbox" 
                  checked={useAsProfile} 
                  onChange={(e) => setUseAsProfile(e.target.checked)}
                  className="w-5 h-5 accent-[#D4AF37]"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-afri-text uppercase tracking-tight flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Définir comme photo de profil
                  </span>
                  <span className="text-[9px] text-afri-text-sec">Remplacera votre photo Google publiquement</span>
                </div>
              </label>

              {/* Explicit Sync Button */}
              <button 
                onClick={handleSyncProfile}
                disabled={saving}
                className="w-full py-2.5 bg-[#D4AF37] hover:bg-white text-black font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                Synchroniser avec mon profil
              </button>

              {/* Boutique Avatar Link */}
              <button 
                onClick={() => setShowStore(true)}
                className="w-full py-3 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                Boutique Avatar ({storeItems.length})
              </button>
            </div>
          </div>

          {/* Right Column: Category Tabs & Grid */}
          <div className="flex-1 flex flex-col bg-zinc-900/30 overflow-hidden">
            
            {/* Horizontal Tabs */}
            <div className="sticky top-0 z-30 flex overflow-x-auto p-3 gap-2 border-b border-afri-border/20 bg-zinc-950/95 backdrop-blur-md scrollbar-none touch-pan-x shrink-0">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition cursor-pointer ${
                    activeTab === tab.id 
                      ? "bg-[#D4AF37] text-black font-black shadow" 
                      : "bg-zinc-900 border border-afri-border/20 text-afri-text-sec hover:text-afri-text hover:border-afri-border"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Choices Grid */}
            <div className="flex-1 overflow-y-auto p-5 pb-24 md:pb-8">
              {activeTab === 'couleur_peau' ? (
                <div className="space-y-4">
                  <p className="text-xs text-afri-text-sec font-mono uppercase tracking-wider">Teinte de peau :</p>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                    {['#8D5524', '#C68642', '#E0AC69', '#F1C27D', '#FFDBAC', '#5C3818', '#3D2314', '#221208'].map(color => (
                      <button
                        key={color}
                        onClick={() => setConfig({ ...config, skinColor: color })}
                        className={`w-12 h-12 rounded-2xl border-4 transition cursor-pointer ${
                          config.skinColor === color 
                            ? "border-[#D4AF37] scale-110 shadow-lg" 
                            : "border-afri-border/30 hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              ) : activeTab === 'forme_visage' ? (
                <div className="space-y-4">
                  <p className="text-xs text-afri-text-sec font-mono uppercase tracking-wider">Forme du visage :</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'default', name: 'Standard' },
                      { id: 'oval', name: 'Ovale' },
                      { id: 'round', name: 'Rond' },
                      { id: 'square', name: 'Carré' },
                      { id: 'diamond', name: 'Losange' },
                      { id: 'heart', name: 'Cœur' },
                      { id: 'slim', name: 'Visage Fin' },
                      { id: 'wide', name: 'Visage Large' },
                    ].map(shape => (
                      <button
                        key={shape.id}
                        onClick={() => setConfig(prev => ({ ...prev, faceShape: shape.id }))}
                        className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
                          config.faceShape === shape.id
                            ? "bg-[#D4AF37]/10 border-[#D4AF37] text-afri-text shadow-lg"
                            : "bg-zinc-950 border-afri-border/20 text-afri-text-sec hover:border-afri-border/50"
                        }`}
                      >
                        <span className="text-2xl">👤</span>
                        <span className="text-xs font-bold uppercase">{shape.name}</span>
                        {config.faceShape === shape.id && (
                          <span className="px-2 py-0.5 bg-[#D4AF37] text-black text-[9px] font-bold rounded-full">Sélectionné</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {itemsInActiveTab.length === 0 ? (
                    <div className="col-span-full py-12 bg-zinc-950/60 border border-afri-border/20 rounded-3xl text-center space-y-3 p-6">
                      <ShoppingBag className="w-8 h-8 text-zinc-600 mx-auto" />
                      <p className="text-afri-text-sec font-bold text-xs">
                        Aucun article déverrouillé dans cette catégorie.
                      </p>
                      <button 
                        onClick={() => setShowStore(false)} 
                        className="px-4 py-2 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-wider rounded-xl hover:bg-white transition cursor-pointer"
                      >
                        Visiter la boutique
                      </button>
                    </div>
                  ) : (
                    itemsInActiveTab.map(item => {
                      const configKey = mapCategoryToConfigKey(item.category);
                      const isEquipped = 
                        (config as any)[configKey] === item.id || 
                        (Array.isArray((config as any)[configKey]) && (config as any)[configKey].includes(item.id)) ||
                        inventory.equippedItems.includes(item.id);

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleEquip(item.id, item.category)}
                          className={`aspect-square rounded-3xl border flex flex-col items-center justify-between p-3.5 relative transition cursor-pointer ${
                            isEquipped 
                              ? "bg-[#D4AF37]/10 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/5" 
                              : "bg-zinc-950 border-afri-border/20 hover:border-afri-border/50 hover:bg-zinc-900"
                          }`}
                        >
                          <div className="w-full flex-1 flex items-center justify-center p-1 min-h-[70px]">
                            {renderItemPreview(item)}
                          </div>

                          <span className="text-[10px] font-bold text-center text-afri-text line-clamp-1 uppercase tracking-tight mt-1">
                            {item.name}
                          </span>

                          {isEquipped && (
                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-[#D4AF37] text-black font-black text-[8px] uppercase rounded-full shadow flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Équipé
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {showStore && (
        <AvatarStore 
          onClose={() => setShowStore(false)} 
          inventory={inventory.ownedItems} 
        />
      )}
    </div>
  );
}
