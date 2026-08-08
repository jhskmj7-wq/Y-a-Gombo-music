import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Save, ShoppingBag, UserCheck, ArrowLeft, RefreshCw, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarConfig, UserAvatarData, AvatarItemCategory, AvatarItem, UserInventoryData } from '../../types/avatar';
import { AvatarEngine } from '../../lib/avatarEngine';
import { useAuth } from '../../AuthContext';
import AvatarRenderer from './AvatarRenderer';
import AvatarStore from './AvatarStore';

import { sanitizeForFirestore } from '../../lib/firestoreUtils';

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

const SKIN_COLORS = [
  { id: 'peul', name: 'Elite Peul', hex: '#E0AC69' },
  { id: 'ébène', name: 'Elite Ébène', hex: '#221208' },
  { id: 'cacao', name: 'Elite Cacao', hex: '#5C3818' },
  { id: 'sahel', name: 'Elite Sahel', hex: '#C68642' },
  { id: 'soudan', name: 'Elite Soudan', hex: '#3D2314' },
];

const TABS = [
  { id: 'visage', label: 'Visage 👤', categories: ['tete', 'corps', 'visage_base', 'yeux', 'sourcils', 'nez', 'bouche', 'tatouages_visage', 'cicatrices', 'maquillage_yeux', 'maquillage_levres'] },
  { id: 'coiffure', label: 'Coiffure 💇', categories: ['cheveux', 'barbe', 'moustache'] },
  { id: 'vetements', label: 'Habits 👕', categories: ['sous_vetement', 'tee-shirt', 'chemise', 'veste', 'manteau', 'robes', 'costumes', 'tenues_africaines', 'tenues_ivoiriennes', 'tenues_scene', 'pantalons', 'jeans', 'chaussures', 'sneakers'] },
  { id: 'accessoires', label: 'Détails ✨', categories: ['lunettes', 'casquettes', 'chapeaux', 'couronnes', 'ecouteurs', 'collier', 'chaines', 'montres', 'bagues', 'bracelets', 'sac', 'ailes', 'badges', 'effets_speciaux', 'arriere_plans'] },
];

const CATEGORY_ICONS: Record<string, string> = {
  tete: '👤', corps: '🧍', visage_base: '🎭', yeux: '👁️', sourcils: '〰️', nez: '👃', bouche: '👄',
  cheveux: '💇', barbe: '🧔', moustache: '👨', 'tee-shirt': '👕', chemise: '👔', veste: '🧥',
  manteau: '🧥', pantalons: '👖', jeans: '👖', robes: '👗', costumes: '🕴️', chaussures: '👞',
  sneakers: '👟', tenues_africaines: '🌍', tenues_ivoiriennes: '🇨🇮', tenues_scene: '🎤',
  lunettes: '🕶️', casquettes: '🧢', chapeaux: '🎩', ecouteurs: '🎧', collier: '📿',
  chaines: '⛓️', montres: '⌚', bagues: '💍', bracelets: '📿', sac: '👜', ailes: '🦅',
  badges: '🎖️', effets_speciaux: '✨', arriere_plans: '🌅', sous_vetement: '🩲',
  tatouages_visage: '🖋️', cicatrices: '🩹', maquillage_yeux: '🎨', maquillage_levres: '💄'
};

const CATEGORY_LABELS: Record<string, string> = {
  tete: 'Tête', corps: 'Corps', visage_base: 'Visage', yeux: 'Yeux', sourcils: 'Sourcils',
  nez: 'Nez', bouche: 'Bouche', cheveux: 'Cheveux', barbe: 'Barbe', moustache: 'Moustache',
  'tee-shirt': 'T-Shirt', chemise: 'Chemise', veste: 'Veste', manteau: 'Manteau',
  pantalons: 'Pantalons', jeans: 'Jeans', robes: 'Robes', costumes: 'Costumes',
  chaussures: 'Chaussures', sneakers: 'Sneakers', tenues_africaines: 'Afr',
  tenues_ivoiriennes: 'Civ', tenues_scene: 'Scène', lunettes: 'Lunettes',
  casquettes: 'Casquettes', chapeaux: 'Chapeaux', couronnes: 'Couronnes',
  ecouteurs: 'Écouteurs', collier: 'Colliers', chaines: 'Chaînes',
  montres: 'Montres', bagues: 'Bagues', bracelets: 'Bracelets', sac: 'Sacs',
  ailes: 'Ailes', badges: 'Badges', accessoires: 'Accessoires',
  effets_speciaux: 'Effets', arriere_plans: 'Fond', sous_vetement: 'Dessous',
  tatouages_visage: 'Tatoos', cicatrices: 'Cicatrices', maquillage_yeux: 'Maq. Yeux',
  maquillage_levres: 'Maq. Lèvres'
};

const FREE_DEFAULT_ITEMS: AvatarItem[] = [
  // CORPS & TÊTE (Elite Bases)
  {
    id: "corps_elite_standard",
    name: "Silhouette Standard",
    category: "corps",
    price: 0,
    isActive: true,
    svgContent: `<path d="M28 220 C 32 155, 58 132, 100 132 C 142 132, 168 155, 172 220 Z" />`
  },
  {
    id: "tete_elite_standard",
    name: "Visage Oval Elite",
    category: "tete",
    price: 0,
    isActive: true,
    svgContent: `<path d="M68 76 C 68 32, 132 32, 132 76 C 132 120, 114 142, 100 146 C 86 142, 68 120, 68 76 Z" />`
  },
  {
    id: "tete_elite_fine",
    name: "Visage Sculpté Pro",
    category: "tete",
    price: 0,
    isActive: true,
    svgContent: `<path d="M72 78 C 72 35, 128 35, 128 78 C 128 122, 100 148, 100 148 C 100 148, 72 122, 72 78 Z" />`
  },
  // BARBE / MOUSTACHE
  {
    id: "visage_naturel",
    name: "Rasé Net",
    category: "barbe",
    price: 0,
    isActive: true,
    svgContent: `<g id="rasé"></g>`
  },
  {
    id: "visage_barbe_legere",
    name: "Barbe de 3 Jours",
    category: "barbe",
    price: 0,
    isActive: true,
    svgContent: `<path d="M 68 90 Q 100 145 132 90 L 128 110 Q 100 132 72 110 Z" fill="#111111" opacity="0.35" />`
  },
  {
    id: "visage_barbe_elite_fournie",
    name: "Barbe Fournie Elite",
    category: "barbe",
    price: 0,
    isActive: true,
    svgContent: `<path d="M 65 90 Q 100 155 135 90 L 125 125 Q 100 145 75 125 Z" fill="#111111" />`
  },
  {
    id: "visage_bouc_elite",
    name: "Bouc Sculpté",
    category: "barbe",
    price: 0,
    isActive: true,
    svgContent: `<path d="M 90 115 Q 100 135 110 115 L 108 135 Q 100 142 92 135 Z" fill="#222222" />`
  },
  {
    id: "moustache_sapeur",
    name: "Moustache Sapeur",
    category: "moustache",
    price: 0,
    isActive: true,
    svgContent: `<path d="M 85 109 Q 100 106 115 109 Q 118 113 113 114 Q 100 110 87 114 Q 82 113 85 109 Z" fill="#111111" />`
  },
  // COIFFURES (Riche bibliothèque moderne et parfaitement ancrée sur la tête)
  {
    id: "hair_elite_afro_short",
    name: "Afro Court Ébène",
    category: "cheveux",
    price: 0,
    isActive: true,
    svgContent: `<path d="M 64 78 C 58 30, 142 30, 136 78 C 130 52, 70 52, 64 78 Z" fill="#1A1107" />`
  },
  {
    id: "hair_elite_afro_volumineux",
    name: "Afro Volumineux Royal",
    category: "cheveux",
    price: 0,
    isActive: true,
    svgContent: `<path d="M 58 76 C 48 20, 152 20, 142 76 C 135 48, 65 48, 58 76 Z" fill="#110A05" />`
  },
  {
    id: "hair_elite_degrade",
    name: "Dégradé Pro Stylé",
    category: "cheveux",
    price: 0,
    isActive: true,
    svgContent: `<path d="M 67 76 C 66 38, 134 38, 133 76 C 125 50, 75 50, 67 76 Z" fill="#1D1815" />`
  },
  {
    id: "hair_elite_nattes",
    name: "Nattes Afro-Chic Or",
    category: "cheveux",
    price: 0,
    isActive: true,
    svgContent: `<g fill="#1A1A1A"><path d="M 67 76 C 66 38, 134 38, 133 76 C 125 50, 75 50, 67 76 Z" /><path d="M 78 45 L 75 85 M 89 42 L 88 88 M 100 40 L 100 90 M 111 42 L 112 88 M 122 45 L 125 85" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" opacity="0.9"/></g>`
  },
  {
    id: "hair_elite_locks",
    name: "Elite Locks & Dreads",
    category: "cheveux",
    price: 0,
    isActive: true,
    svgContent: `<g fill="#16100A"><path d="M 66 76 C 64 36, 136 36, 134 76 C 125 48, 75 48, 66 76 Z" /><path d="M 68 62 L 56 118 M 80 48 L 72 124 M 92 42 L 92 130 M 108 42 L 108 130 M 120 48 L 128 124 M 132 62 L 144 118" stroke="#16100A" strokeWidth="5.5" strokeLinecap="round" /></g>`
  },
  {
    id: "hair_elite_braids_women",
    name: "Braids Longues Élégance",
    category: "cheveux",
    price: 0,
    isActive: true,
    svgContent: `<g fill="#111111"><path d="M 65 76 C 62 34, 138 34, 135 76 C 125 48, 75 48, 65 76 Z" /><path d="M 68 70 Q 52 100 48 145 M 132 70 Q 148 100 152 145" stroke="#111111" strokeWidth="8" strokeLinecap="round" /></g>`
  },
  {
    id: "hair_elite_box_braids",
    name: "Box Braids Tendance",
    category: "cheveux",
    price: 0,
    isActive: true,
    svgContent: `<g fill="#1A1510"><path d="M 66 76 C 64 36, 136 36, 134 76 Z" /><path d="M 72 50 L 65 110 M 86 42 L 84 116 M 100 40 L 100 120 M 114 42 L 116 116 M 128 50 L 135 110" stroke="#251A12" strokeWidth="4.5" strokeLinecap="round" /></g>`
  },
  {
    id: "hair_elite_afro_puff",
    name: "Afro Puff Haut",
    category: "cheveux",
    price: 0,
    isActive: true,
    svgContent: `<g fill="#140E08"><ellipse cx="100" cy="36" rx="34" ry="26" /><path d="M 70 76 C 68 55, 132 55, 130 76 Z" /></g>`
  },
  {
    id: "hair_elite_chignon",
    name: "Chignon Royal Tressé",
    category: "cheveux",
    price: 0,
    isActive: true,
    svgContent: `<g fill="#1A1107"><path d="M 66 76 C 64 38, 136 38, 134 76 Z" /><circle cx="100" cy="24" r="18" fill="#1A1107" stroke="#D4AF37" strokeWidth="1.5" /></g>`
  },
  // YEUX
  {
    id: "eyes_elite_noir",
    name: "Regard Intense",
    category: "yeux",
    price: 0,
    isActive: true,
    svgContent: `<g><path d="M 77 82 Q 85 75 93 82 Q 85 88 77 82 Z" fill="#FFFFFF" /><circle cx="85" cy="81.5" r="4.2" fill="#111111" /><circle cx="83.5" cy="80" r="1.2" fill="#FFFFFF" /><path d="M 76 81 Q 85 74 94 81" stroke="#111111" strokeWidth="1.8" fill="none" strokeLinecap="round" /><path d="M 107 82 Q 115 75 123 82 Q 115 88 107 82 Z" fill="#FFFFFF" /><circle cx="115" cy="81.5" r="4.2" fill="#111111" /><circle cx="113.5" cy="80" r="1.2" fill="#FFFFFF" /><path d="M 106 81 Q 115 74 124 81" stroke="#111111" strokeWidth="1.8" fill="none" strokeLinecap="round" /></g>`
  },
  {
    id: "eyes_elite_marron",
    name: "Elite Marron Chaud",
    category: "yeux",
    price: 0,
    isActive: true,
    svgContent: `<g><path d="M 77 82 Q 85 75 93 82 Q 85 88 77 82 Z" fill="#FFFFFF" /><circle cx="85" cy="81.5" r="4.5" fill="#4E3629" /><circle cx="85" cy="81.5" r="2" fill="#111111" /><circle cx="83.5" cy="80" r="1.2" fill="#FFFFFF" /><path d="M 76 81 Q 85 74 94 81" stroke="#111111" strokeWidth="1.8" fill="none" strokeLinecap="round" /><path d="M 107 82 Q 115 75 123 82 Q 115 88 107 82 Z" fill="#FFFFFF" /><circle cx="115" cy="81.5" r="4.5" fill="#4E3629" /><circle cx="115" cy="81.5" r="2" fill="#111111" /><circle cx="113.5" cy="80" r="1.2" fill="#FFFFFF" /><path d="M 106 81 Q 115 74 124 81" stroke="#111111" strokeWidth="1.8" fill="none" strokeLinecap="round" /></g>`
  },
  // SOURCILS
  {
    id: "sourcils_naturels",
    name: "Sourcils Naturels",
    category: "sourcils",
    price: 0,
    isActive: true,
    svgContent: `<g><path d="M 75 73 Q 84 68 93 72" stroke="#1A1A1A" strokeWidth="2.2" strokeLinecap="round" fill="none" /><path d="M 107 72 Q 116 68 125 73" stroke="#1A1A1A" strokeWidth="2.2" strokeLinecap="round" fill="none" /></g>`
  },
  {
    id: "sourcils_sculptes",
    name: "Sourcils Sculptés",
    category: "sourcils",
    price: 0,
    isActive: true,
    svgContent: `<g><path d="M 74 72 Q 84 65 94 71" stroke="#111111" strokeWidth="3" strokeLinecap="round" fill="none" /><path d="M 106 71 Q 116 65 126 72" stroke="#111111" strokeWidth="3" strokeLinecap="round" fill="none" /></g>`
  },
  // BOUCHE
  {
    id: "mouth_elite_sourire",
    name: "Sourire Elite",
    category: "bouche",
    price: 0,
    isActive: true,
    svgContent: `<g><path d="M 87 114 Q 93 111 100 113 Q 107 111 113 114" stroke="#4A3018" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.7" /><path d="M 85 115 Q 100 122 115 115" stroke="#3D2314" strokeWidth="2.5" fill="none" strokeLinecap="round" /><path d="M 90 121 Q 100 125 110 121" stroke="#2A1508" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.2" /></g>`
  },
  {
    id: "mouth_elite_neutre",
    name: "Bouche Neutre",
    category: "bouche",
    price: 0,
    isActive: true,
    svgContent: `<g><path d="M 86 116 L 114 116" stroke="#3D2314" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.8" /></g>`
  },
  // VÊTEMENTS
  {
    id: "clothes_elite_tshirt_blanc",
    name: "T-Shirt Gombo Premium",
    category: "tee-shirt",
    price: 0,
    isActive: true,
    svgContent: `<path d="M 32 215 C 32 158, 58 132, 100 132 C 142 132, 168 158, 168 215 Z" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />`
  },
  {
    id: "clothes_elite_boubou_short",
    name: "Boubou Elite Or",
    category: "chemise",
    price: 0,
    isActive: true,
    svgContent: `<g><path d="M 30 215 Q 100 125 170 215 Z" fill="#1A1A2E" stroke="#D4AF37" strokeWidth="2.5" /><path d="M 90 132 L 110 132 L 100 158 Z" fill="#D4AF37" /></g>`
  },
  {
    id: "clothes_elite_veste_sapeur",
    name: "Veste Sapeur Elite",
    category: "veste",
    price: 0,
    isActive: true,
    svgContent: `<g><path d="M 32 215 L 50 145 Q 100 130 150 145 L 168 215 Z" fill="#C0392B" /><path d="M 85 135 L 100 170 L 115 135" fill="#FFFFFF" /></g>`
  },
  {
    id: "clothes_elite_chemise_pagne",
    name: "Chemise Pagne Wax",
    category: "chemise",
    price: 0,
    isActive: true,
    svgContent: `<g><path d="M 32 215 C 32 158, 58 132, 100 132 C 142 132, 168 158, 168 215 Z" fill="#1E3A8A" stroke="#F59E0B" strokeWidth="2" /><path d="M 85 132 L 100 160 L 115 132" fill="#F59E0B" /></g>`
  },
  {
    id: "clothes_elite_hoodie_urbain",
    name: "Hoodie Urbain Afro",
    category: "veste",
    price: 0,
    isActive: true,
    svgContent: `<g><path d="M 28 215 C 28 155, 55 130, 100 130 C 145 130, 172 155, 172 215 Z" fill="#111827" stroke="#374151" strokeWidth="1.5" /><path d="M 80 130 Q 100 150 120 130" stroke="#4B5563" strokeWidth="4" fill="none" /></g>`
  },
  // ACCESSOIRES
  {
    id: "lunettes_soleil_gold",
    name: "Lunettes VIP Gold",
    category: "lunettes",
    price: 0,
    isActive: true,
    svgContent: `<g fill="#111111" stroke="#D4AF37" strokeWidth="1.5"><rect x="72" y="75" width="22" height="14" rx="3" /><rect x="106" y="75" width="22" height="14" rx="3" /><line x1="94" y1="80" x2="106" y2="80" strokeWidth="2" /></g>`
  },
  {
    id: "lunettes_modernes_rondes",
    name: "Lunettes Rondes Pro",
    category: "lunettes",
    price: 0,
    isActive: true,
    svgContent: `<g fill="rgba(255,255,255,0.15)" stroke="#111111" strokeWidth="1.8"><circle cx="84" cy="81" r="11" /><circle cx="116" cy="81" r="11" /><line x1="95" y1="80" x2="105" y2="80" strokeWidth="2" /></g>`
  },
  {
    id: "casquette_elite",
    name: "Casquette Streetwear",
    category: "casquettes",
    price: 0,
    isActive: true,
    svgContent: `<g><path d="M 68 76 C 65 38, 135 38, 132 76 Z" fill="#1F2937" /><path d="M 68 73 Q 100 68 145 78 L 138 82 Q 100 73 68 77 Z" fill="#111827" /></g>`
  },
  {
    id: "bonnet_laine",
    name: "Bonnet Laine Tendance",
    category: "chapeaux",
    price: 0,
    isActive: true,
    svgContent: `<path d="M 66 78 C 62 30, 138 30, 134 78 Q 100 70 66 78 Z" fill="#B91C1C" />`
  },
  {
    id: "couronne_baoule",
    name: "Couronne Royale",
    category: "couronnes",
    price: 0,
    isActive: true,
    svgContent: `<path d="M 68 52 L 80 35 L 100 50 L 120 35 L 132 52 Z" fill="#D4AF37" stroke="#111111" strokeWidth="1" />`
  },
  {
    id: "boucles_oreilles_creoles",
    name: "Créoles Dorées",
    category: "bracelets",
    price: 0,
    isActive: true,
    svgContent: `<g stroke="#D4AF37" strokeWidth="2.5" fill="none"><circle cx="56" cy="98" r="7" /><circle cx="144" cy="98" r="7" /></g>`
  }
];

export default function AvatarEditor({ onClose }: AvatarEditorProps) {
  const { currentUser, profile } = useAuth();
  const [avatarData, setAvatarData] = useState<UserAvatarData | null>(null);
  const [config, setConfig] = useState<AvatarConfig>(DEFAULT_CONFIG);
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
  const [activeTab, setActiveTab] = useState<string>(TABS[0].id);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(TABS[0].categories[0]);

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
          setConfig(data.config);
        } else if (profile?.avatarConfig) {
          setConfig(profile.avatarConfig);
        }
        setUseAsProfile(!!data.useAvatarAsProfile);
      } else if (profile?.avatarConfig) {
        setConfig(profile.avatarConfig);
        setUseAsProfile(!!profile?.useAvatarAsProfile);
      }
    });

    return () => {
      unsubItems();
      unsubInv();
      unsubAvatar();
    };
  }, [currentUser]);

  const gridScrollRef = useRef<HTMLDivElement>(null);

  // When tab changes, set default subcategory
  useEffect(() => {
    const tab = TABS.find(t => t.id === activeTab);
    if (tab && tab.categories.length > 0) {
      setActiveSubCategory(tab.categories[0]);
    }
  }, [activeTab]);

  // Reset scroll level to top when tab or subcategory changes
  useEffect(() => {
    if (gridScrollRef.current) {
      gridScrollRef.current.scrollTop = 0;
    }
  }, [activeTab, activeSubCategory]);

  const handleRandomize = () => {
    setConfig(prev => ({
      ...prev,
      faceWidth: Number((0.9 + Math.random() * 0.2).toFixed(2)),
      faceHeight: Number((0.9 + Math.random() * 0.2).toFixed(2)),
      foreheadWidth: Number((0.85 + Math.random() * 0.3).toFixed(2)),
      jawShape: Number((0.25 + Math.random() * 0.5).toFixed(2)),
      eyesHeight: Number((0.9 + Math.random() * 0.2).toFixed(2)),
      eyesWidth: Number((0.85 + Math.random() * 0.3).toFixed(2)),
      eyesSpacing: Number((0.85 + Math.random() * 0.3).toFixed(2)),
      irisSize: Number((3.6 + Math.random() * 1.4).toFixed(1)),
      noseHeight: Number((0.9 + Math.random() * 0.2).toFixed(2)),
      noseWidth: Number((0.85 + Math.random() * 0.35).toFixed(2)),
      noseLength: Number((0.85 + Math.random() * 0.3).toFixed(2)),
      mouthWidth: Number((0.85 + Math.random() * 0.35).toFixed(2)),
      mouthThickness: Number((0.8 + Math.random() * 0.4).toFixed(2)),
      eyebrowsPosition: Number((0.9 + Math.random() * 0.2).toFixed(2)),
      hairline: Number((0.85 + Math.random() * 0.3).toFixed(2)),
      earsShape: ['standard', 'round', 'pointed'][Math.floor(Math.random() * 3)],
      skinColor: SKIN_COLORS[Math.floor(Math.random() * SKIN_COLORS.length)].hex
    }));
  };

  const handleCancel = () => {
    onClose();
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    setSaveSuccess(null);
    try {
      const finalConfig = { ...config };
      
      // Build V2 config items mapping (clean & professional)
      const itemsV2: Record<string, string> = {};
      
      // Map all single-item categories
      Object.entries(finalConfig).forEach(([key, value]) => {
        if (typeof value === 'string' && value && !(['skinColor', 'faceShape', 'background'].includes(key))) {
          itemsV2[key] = value;
        }
      });
      
      // Handle special fields
      if (finalConfig.background && storeItems.some(i => i.id === finalConfig.background)) {
        itemsV2['arriere_plans'] = finalConfig.background;
      }

      const configV2 = { items: itemsV2, skinColor: finalConfig.skinColor };
      const mergedStoreAndFreeItems = [...FREE_DEFAULT_ITEMS, ...storeItems];
      const avatarUri = AvatarEngine.generateAvatarSvgV2(configV2, finalConfig, mergedStoreAndFreeItems);

      const ownedList = Array.isArray(inventory?.ownedItems) ? inventory.ownedItems : [];

      // Batch sync via the new Modular Synchronizer
      await AvatarEngine.saveUserAvatar(currentUser.uid, sanitizeForFirestore({
        config: finalConfig,
        configV2: configV2,
        useAvatarAsProfile: useAsProfile,
        inventory: ownedList,
        avatarDataUri: avatarUri
      }), mergedStoreAndFreeItems);

      if (useAsProfile) {
        await AvatarEngine.setAvatarAsProfile(currentUser.uid, avatarUri, true);
      }

      setSaveSuccess("Avatar enregistré avec succès ! 🎉");
      setTimeout(() => {
        onClose();
      }, 1000);
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
        if (typeof value === 'string' && value && !['skinColor', 'faceShape', 'background'].includes(key)) {
          itemsV2[key] = value;
        }
      });
      const configV2 = { items: itemsV2, skinColor: finalConfig.skinColor };
      
      const mergedStoreAndFreeItems = [...FREE_DEFAULT_ITEMS, ...storeItems];
      const avatarUri = AvatarEngine.generateAvatarSvgV2(configV2, finalConfig, mergedStoreAndFreeItems);

      setUseAsProfile(true);

      const ownedList = Array.isArray(inventory?.ownedItems) ? inventory.ownedItems : [];

      await AvatarEngine.setAvatarAsProfile(currentUser.uid, avatarUri, true);
      await AvatarEngine.saveUserAvatar(currentUser.uid, sanitizeForFirestore({
        config: finalConfig,
        configV2: configV2,
        useAvatarAsProfile: true,
        inventory: ownedList,
        avatarDataUri: avatarUri
      }), mergedStoreAndFreeItems);

      setSaveSuccess("Avatar enregistré et synchronisé avec votre profil public ! 🌟");
    } catch (e: any) {
      console.error("Sync failed", e);
      setSaveSuccess(`Erreur de synchronisation : ${e.message || "Inconnue"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEquip = async (itemId: string, category: string) => {
    if (!currentUser) return;

    setConfig(prev => {
      const next = { ...prev };
      (next as any)[category] = (next as any)[category] === itemId ? '' : itemId;
      return next;
    });

    const isCurrentlyEquipped = inventory?.equippedItems?.includes(itemId) || false;
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
        <span>Chargement du Studio Avatar Elite...</span>
      </div>
    );
  }

  const ownedStoreItems = storeItems.filter(item => inventory?.ownedItems?.includes(item.id) || false);
  const itemsInActiveSubCategory = [
    ...FREE_DEFAULT_ITEMS.filter(item => item.category === activeSubCategory),
    ...ownedStoreItems.filter(item => item.category === activeSubCategory)
  ];

  const isEquipped = (itemId: string, category: string) => {
    return (config as any)[category] === itemId;
  };

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
          
          {item.svgContent ? (
            <g dangerouslySetInnerHTML={{ __html: item.svgContent }} />
          ) : item.imageUrl ? (
            <image href={item.imageUrl} x="40" y="40" width="120" height="120" preserveAspectRatio="xMidYMid slice" />
          ) : null}
        </svg>
      );
    }
    return <span className="text-2xl">🎭</span>;
  };

  return (
    <div className="fixed inset-0 z-[110] bg-zinc-950 md:bg-black/80 md:backdrop-blur-md flex flex-col items-center justify-start md:justify-center p-0 md:p-4 font-sans text-left overflow-y-auto w-full max-w-full box-border">
      <div className="w-full max-w-5xl min-h-screen md:min-h-0 md:h-[92vh] bg-zinc-900 md:rounded-[40px] border-0 md:border border-afri-border/30 flex flex-col shadow-2xl relative overflow-x-hidden md:overflow-hidden box-border">
        
        {/* Elite Gradient Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50 z-50" />

        {/* Top Bar */}
        <div className="shrink-0 bg-zinc-950 border-b border-afri-border/30 px-4 sm:px-6 py-3.5 flex items-center justify-between z-40 w-full box-border">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-yellow-700 flex items-center justify-center shadow-lg shrink-0">
              <span className="text-lg sm:text-xl">🤴</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-black uppercase text-afri-text tracking-widest leading-none truncate">AFRIGOMBO</h2>
              <p className="text-[8px] sm:text-[9px] text-[#D4AF37] font-bold mt-1 opacity-80 truncate">STUDIO AVATAR ELITE</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button 
              onClick={onClose}
              className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-afri-text-sec hover:text-afri-text transition"
            >
              Fermer
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#D4AF37] text-black font-black text-[10px] sm:text-xs uppercase tracking-widest rounded-xl shadow-xl hover:scale-105 transition-all flex items-center gap-1.5 sm:gap-2 disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
              Enregistrer
            </button>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 flex flex-col md:flex-row overflow-x-hidden md:overflow-hidden w-full max-w-full min-w-0 box-border">
          
          {/* Left Column: Avatar Preview & Quick Actions */}
          <div className="w-full md:w-[320px] lg:w-[360px] bg-zinc-950 border-b md:border-b-0 md:border-r border-afri-border/20 p-3 sm:p-5 flex flex-col items-center justify-center shrink-0 box-border min-w-0">
            {/* AvatarWrapper: Flexbox row centered around avatar */}
            <div className="w-full flex items-center justify-center gap-2 sm:gap-4 md:gap-5 py-2 px-1 relative">
              
              {/* Left Button: Boutique Elite (Reduced/Compact) */}
              <button 
                onClick={() => setShowStore(true)}
                className="flex flex-col items-center justify-center p-2.5 sm:p-3 bg-zinc-900 hover:bg-zinc-800 border border-[#D4AF37]/30 hover:border-[#D4AF37] rounded-2xl text-[#D4AF37] hover:scale-105 active:scale-95 transition-all shadow-lg shrink-0 group w-20 sm:w-24"
                title="Boutique Elite"
              >
                <div className="relative">
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                  {storeItems.length > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-[#D4AF37] text-black text-[8px] font-black px-1.5 py-0.2 rounded-full shadow">
                      {storeItems.length}
                    </span>
                  )}
                </div>
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-center mt-1 text-afri-text group-hover:text-[#D4AF37] leading-tight">
                  Boutique
                </span>
              </button>

              {/* Center: Avatar Circle + Hasard (Dice) Floating Button */}
              <div className="relative flex flex-col items-center shrink-0">
                <div className="relative group my-1">
                  <div className="absolute inset-0 bg-[#D4AF37]/10 blur-[40px] rounded-full animate-pulse" />
                  <div className="relative z-10 w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-full border-4 sm:border-6 border-zinc-900 shadow-2xl overflow-hidden p-1 bg-gradient-to-b from-white/5 to-transparent flex items-center justify-center">
                    <AvatarRenderer 
                      config={{ 
                        ...config, 
                        configV2: { 
                          items: Object.fromEntries(
                            Object.entries(config).filter(([k, v]) => typeof v === 'string' && v && !['skinColor', 'faceShape', 'background'].includes(k))
                          )
                        } 
                      }} 
                      size={180} 
                      storeItems={[...FREE_DEFAULT_ITEMS, ...storeItems]}
                    />
                  </div>
                </div>

                {/* Hasard (Dice) compact floating button directly attached to bottom of avatar circle */}
                <button 
                  onClick={handleRandomize}
                  className="absolute -bottom-2.5 z-20 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-[#D4AF37]/50 rounded-full text-[#D4AF37] text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-xl flex items-center gap-1 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                  title="Générer un avatar au hasard"
                >
                  <RefreshCw className="w-3 h-3 text-[#D4AF37]" />
                  <span>Hasard 🎲</span>
                </button>
              </div>

              {/* Right Button: Synchro Profil (Reduced/Compact) */}
              <div className="flex flex-col items-center shrink-0">
                <button 
                  onClick={handleSyncProfile}
                  disabled={saving}
                  className="flex flex-col items-center justify-center p-2.5 sm:p-3 bg-zinc-900 hover:bg-zinc-800 border border-[#D4AF37]/30 hover:border-[#D4AF37] rounded-2xl text-[#D4AF37] hover:scale-105 active:scale-95 transition-all shadow-lg group disabled:opacity-50 w-20 sm:w-24"
                  title="Mise à jour immédiate sur le profil"
                >
                  <RefreshCw className={`w-5 h-5 sm:w-6 sm:h-6 text-[#D4AF37] group-hover:rotate-180 transition-transform ${saving ? 'animate-spin' : ''}`} />
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-center mt-1 text-afri-text group-hover:text-[#D4AF37] leading-tight">
                    Synchro
                  </span>
                </button>
                <label className="flex items-center gap-1 cursor-pointer text-[8px] text-afri-text-sec hover:text-[#D4AF37] transition mt-1.5" title="Appliquer automatiquement à mon profil public">
                  <input 
                    type="checkbox" 
                    checked={useAsProfile} 
                    onChange={(e) => setUseAsProfile(e.target.checked)}
                    className="w-3 h-3 accent-[#D4AF37] cursor-pointer"
                  />
                  <span className="font-bold uppercase tracking-widest text-[7px] sm:text-[8px]">Auto</span>
                </label>
              </div>

            </div>
          </div>

          {/* Right Column: Category Tabs & Grid */}
          <div className="flex-1 flex flex-col bg-zinc-900/30 overflow-x-hidden md:overflow-hidden min-h-0 w-full max-w-full min-w-0 box-border">
            
            {/* Main Tabs */}
            <div className="flex bg-zinc-950 px-3 sm:px-6 pt-3 gap-3 sm:gap-6 overflow-x-auto no-scrollbar border-b border-afri-border/20 w-full max-w-full box-border min-w-0 shrink-0">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 sm:pb-4 px-1 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] transition-all relative whitespace-nowrap ${
                    activeTab === tab.id ? 'text-[#D4AF37]' : 'text-afri-text-sec hover:text-afri-text'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="tabMarker" 
                      className="absolute bottom-0 left-0 right-0 h-1 bg-[#D4AF37] rounded-t-full shadow-[0_0_10px_rgba(212,175,55,0.5)]" 
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Sub-Categories */}
            <div className="flex gap-2 p-3 sm:p-4 bg-zinc-950/20 overflow-x-auto no-scrollbar border-b border-afri-border/10 w-full max-w-full box-border min-w-0 shrink-0">
              {TABS.find(t => t.id === activeTab)?.categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveSubCategory(cat)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border ${
                    activeSubCategory === cat 
                      ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-lg' 
                      : 'bg-zinc-800 border-afri-border/10 text-afri-text-sec hover:border-afri-border/30'
                  }`}
                >
                  {CATEGORY_ICONS[cat] || '✨'} {CATEGORY_LABELS[cat] || cat}
                </button>
              ))}
            </div>

            {/* Grid Showcase */}
            <div ref={gridScrollRef} className="flex-1 overflow-y-auto p-6 pb-24 md:pb-8 custom-scrollbar">
              
              {/* Skin Tone Selector */}
              {activeSubCategory === 'corps' && (
                <div className="mb-8 p-6 bg-zinc-950/40 rounded-3xl border border-afri-border/10 space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37] mb-3">Genre & Morphologie</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setConfig(prev => ({ ...prev, gender: 'male' }))}
                        className={`py-3 rounded-2xl text-xs font-black uppercase tracking-wider border transition ${
                          (config.gender || 'male') === 'male' ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-lg' : 'bg-zinc-900 text-afri-text-sec border-white/5'
                        }`}
                      >
                        👨 Homme Elite
                      </button>
                      <button
                        onClick={() => setConfig(prev => ({ ...prev, gender: 'female', barbe: '', moustache: '' }))}
                        className={`py-3 rounded-2xl text-xs font-black uppercase tracking-wider border transition ${
                          config.gender === 'female' ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-lg' : 'bg-zinc-900 text-afri-text-sec border-white/5'
                        }`}
                      >
                        👩 Femme Elite
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Tranche d'Âge ({config.age || 25} ans)</span>
                    </div>
                    <input 
                      type="range" 
                      min="18" 
                      max="70" 
                      value={config.age || 25} 
                      onChange={(e) => setConfig(prev => ({ ...prev, age: Number(e.target.value) }))}
                      className="w-full accent-[#D4AF37] cursor-pointer"
                    />
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37] mb-3">Teinture de Peau Elite</h4>
                    <div className="flex flex-wrap gap-4">
                      {SKIN_COLORS.map(color => (
                        <button
                          key={color.id}
                          onClick={() => setConfig(prev => ({ ...prev, skinColor: color.hex }))}
                          className={`w-12 h-12 rounded-2xl border-4 transition-all relative group ${
                            config.skinColor === color.hex ? 'border-[#D4AF37] scale-110 shadow-lg' : 'border-transparent opacity-60'
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        >
                          {config.skinColor === color.hex && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSubCategory === 'tete' && (
                <div className="mb-6 p-6 bg-zinc-950/40 rounded-3xl border border-afri-border/10 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37] mb-2">Morphologie de la Tête</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[10px] text-afri-text-sec uppercase font-bold tracking-wider">
                        <span>Largeur du Visage</span>
                        <span className="text-[#D4AF37]">{Math.round((config.faceWidth ?? 1.0) * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.85" 
                        max="1.15" 
                        step="0.01"
                        value={config.faceWidth ?? 1.0} 
                        onChange={(e) => setConfig(prev => ({ ...prev, faceWidth: Number(e.target.value) }))}
                        className="w-full accent-[#D4AF37] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[10px] text-afri-text-sec uppercase font-bold tracking-wider">
                        <span>Hauteur du Visage</span>
                        <span className="text-[#D4AF37]">{Math.round((config.faceHeight ?? 1.0) * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.85" 
                        max="1.15" 
                        step="0.01"
                        value={config.faceHeight ?? 1.0} 
                        onChange={(e) => setConfig(prev => ({ ...prev, faceHeight: Number(e.target.value) }))}
                        className="w-full accent-[#D4AF37] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[10px] text-afri-text-sec uppercase font-bold tracking-wider">
                        <span>Largeur du Front</span>
                        <span className="text-[#D4AF37]">{Math.round((config.foreheadWidth ?? 1.0) * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.80" 
                        max="1.20" 
                        step="0.01"
                        value={config.foreheadWidth ?? 1.0} 
                        onChange={(e) => setConfig(prev => ({ ...prev, foreheadWidth: Number(e.target.value) }))}
                        className="w-full accent-[#D4AF37] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[10px] text-afri-text-sec uppercase font-bold tracking-wider">
                        <span>Forme de la Mâchoire</span>
                        <span className="text-[#D4AF37]">{Math.round((config.jawShape ?? 0.5) * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.15" 
                        max="0.85" 
                        step="0.01"
                        value={config.jawShape ?? 0.5} 
                        onChange={(e) => setConfig(prev => ({ ...prev, jawShape: Number(e.target.value) }))}
                        className="w-full accent-[#D4AF37] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[10px] text-afri-text-sec uppercase font-bold tracking-wider">
                        <span>Ligne de Cheveux (Hauteur)</span>
                        <span className="text-[#D4AF37]">{Math.round((config.hairline ?? 1.0) * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.80" 
                        max="1.20" 
                        step="0.01"
                        value={config.hairline ?? 1.0} 
                        onChange={(e) => setConfig(prev => ({ ...prev, hairline: Number(e.target.value) }))}
                        className="w-full accent-[#D4AF37] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[10px] text-afri-text-sec uppercase font-bold tracking-wider">
                        <span>Forme des Oreilles</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {['standard', 'round', 'pointed'].map(shape => (
                          <button
                            key={shape}
                            type="button"
                            onClick={() => setConfig(prev => ({ ...prev, earsShape: shape }))}
                            className={`py-1.5 rounded-xl text-[9px] font-black uppercase transition-all border ${
                              (config.earsShape || 'standard') === shape
                                ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                                : 'bg-zinc-900 border-afri-border/10 text-afri-text-sec'
                            }`}
                          >
                            {shape === 'standard' ? 'Standard' : shape === 'round' ? 'Rondes' : 'Pointues'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSubCategory === 'yeux' && (
                <div className="mb-6 p-6 bg-zinc-950/40 rounded-3xl border border-afri-border/10 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37] mb-2">Ajustement des Yeux & Sourcils</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[10px] text-afri-text-sec uppercase font-bold tracking-wider">
                        <span>Hauteur des Yeux</span>
                        <span className="text-[#D4AF37]">{Math.round((config.eyesHeight ?? 1.0) * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.85" 
                        max="1.15" 
                        step="0.01"
                        value={config.eyesHeight ?? 1.0} 
                        onChange={(e) => setConfig(prev => ({ ...prev, eyesHeight: Number(e.target.value) }))}
                        className="w-full accent-[#D4AF37] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[10px] text-afri-text-sec uppercase font-bold tracking-wider">
                        <span>Écartement des Yeux</span>
                        <span className="text-[#D4AF37]">{Math.round((config.eyesSpacing ?? 1.0) * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.80" 
                        max="1.20" 
                        step="0.01"
                        value={config.eyesSpacing ?? 1.0} 
                        onChange={(e) => setConfig(prev => ({ ...prev, eyesSpacing: Number(e.target.value) }))}
                        className="w-full accent-[#D4AF37] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[10px] text-afri-text-sec uppercase font-bold tracking-wider">
                        <span>Largeur de l'Oeil</span>
                        <span className="text-[#D4AF37]">{Math.round((config.eyesWidth ?? 1.0) * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.80" 
                        max="1.20" 
                        step="0.01"
                        value={config.eyesWidth ?? 1.0} 
                        onChange={(e) => setConfig(prev => ({ ...prev, eyesWidth: Number(e.target.value) }))}
                        className="w-full accent-[#D4AF37] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[10px] text-afri-text-sec uppercase font-bold tracking-wider">
                        <span>Taille de l'Iris / Pupille</span>
                        <span className="text-[#D4AF37]">{(config.irisSize ?? 4.2).toFixed(1)}px</span>
                      </div>
                      <input 
                        type="range" 
                        min="3.0" 
                        max="5.5" 
                        step="0.1"
                        value={config.irisSize ?? 4.2} 
                        onChange={(e) => setConfig(prev => ({ ...prev, irisSize: Number(e.target.value) }))}
                        className="w-full accent-[#D4AF37] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[10px] text-afri-text-sec uppercase font-bold tracking-wider">
                        <span>Hauteur des Sourcils</span>
                        <span className="text-[#D4AF37]">{Math.round((config.eyebrowsPosition ?? 1.0) * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.85" 
                        max="1.15" 
                        step="0.01"
                        value={config.eyebrowsPosition ?? 1.0} 
                        onChange={(e) => setConfig(prev => ({ ...prev, eyebrowsPosition: Number(e.target.value) }))}
                        className="w-full accent-[#D4AF37] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSubCategory === 'nez' && (
                <div className="mb-6 p-6 bg-zinc-950/40 rounded-3xl border border-afri-border/10 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37] mb-2">Ajustement du Nez</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[10px] text-afri-text-sec uppercase font-bold tracking-wider">
                        <span>Hauteur du Nez</span>
                        <span className="text-[#D4AF37]">{Math.round((config.noseHeight ?? 1.0) * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.85" 
                        max="1.15" 
                        step="0.01"
                        value={config.noseHeight ?? 1.0} 
                        onChange={(e) => setConfig(prev => ({ ...prev, noseHeight: Number(e.target.value) }))}
                        className="w-full accent-[#D4AF37] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[10px] text-afri-text-sec uppercase font-bold tracking-wider">
                        <span>Largeur du Nez</span>
                        <span className="text-[#D4AF37]">{Math.round((config.noseWidth ?? 1.0) * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.80" 
                        max="1.30" 
                        step="0.01"
                        value={config.noseWidth ?? 1.0} 
                        onChange={(e) => setConfig(prev => ({ ...prev, noseWidth: Number(e.target.value) }))}
                        className="w-full accent-[#D4AF37] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[10px] text-afri-text-sec uppercase font-bold tracking-wider">
                        <span>Longueur du Nez</span>
                        <span className="text-[#D4AF37]">{Math.round((config.noseLength ?? 1.0) * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.80" 
                        max="1.20" 
                        step="0.01"
                        value={config.noseLength ?? 1.0} 
                        onChange={(e) => setConfig(prev => ({ ...prev, noseLength: Number(e.target.value) }))}
                        className="w-full accent-[#D4AF37] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSubCategory === 'bouche' && (
                <div className="mb-6 p-6 bg-zinc-950/40 rounded-3xl border border-afri-border/10 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37] mb-2">Ajustement de la Bouche & Lèvres</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[10px] text-afri-text-sec uppercase font-bold tracking-wider">
                        <span>Largeur de la Bouche</span>
                        <span className="text-[#D4AF37]">{Math.round((config.mouthWidth ?? 1.0) * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.80" 
                        max="1.25" 
                        step="0.01"
                        value={config.mouthWidth ?? 1.0} 
                        onChange={(e) => setConfig(prev => ({ ...prev, mouthWidth: Number(e.target.value) }))}
                        className="w-full accent-[#D4AF37] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[10px] text-afri-text-sec uppercase font-bold tracking-wider">
                        <span>Épaisseur des Lèvres</span>
                        <span className="text-[#D4AF37]">{Math.round((config.mouthThickness ?? 1.0) * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.70" 
                        max="1.30" 
                        step="0.01"
                        value={config.mouthThickness ?? 1.0} 
                        onChange={(e) => setConfig(prev => ({ ...prev, mouthThickness: Number(e.target.value) }))}
                        className="w-full accent-[#D4AF37] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {itemsInActiveSubCategory.length === 0 ? (
                  <div className="col-span-full py-16 flex flex-col items-center justify-center opacity-30 border-2 border-dashed border-white/5 rounded-[40px]">
                    <ShoppingBag size={32} className="mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Articles à débloquer</p>
                    <button 
                      onClick={() => setShowStore(true)}
                      className="mt-4 text-[9px] text-[#D4AF37] font-bold border-b border-[#D4AF37]/30 pb-0.5"
                    >
                      Aller à la Boutique
                    </button>
                  </div>
                ) : (
                  itemsInActiveSubCategory.map(item => {
                    const equipped = isEquipped(item.id, item.category);
                    return (
                      <motion.button
                        key={item.id}
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEquip(item.id, item.category)}
                        className={`relative aspect-[4/5] rounded-[32px] border-2 flex flex-col items-center justify-between p-4 transition-all duration-300 ${
                          equipped 
                            ? 'bg-[#D4AF37]/10 border-[#D4AF37] shadow-xl' 
                            : 'bg-zinc-900 border-afri-border/10 hover:border-afri-border/30'
                        }`}
                      >
                        {equipped && (
                          <div className="absolute -top-1.5 -right-1.5 bg-[#D4AF37] text-black text-[8px] font-black px-2.5 py-1 rounded-full shadow-lg z-20">
                            ELITE
                          </div>
                        )}

                        <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                          <AvatarRenderer 
                            config={{ configV2: { items: { [item.category]: item.id } } }} 
                            size={100} 
                            storeItems={[item]} 
                          />
                        </div>

                        <div className="w-full pt-3">
                          <span className="text-[9px] font-black text-center block uppercase tracking-tight text-afri-text-sec group-hover:text-afri-text transition truncate">
                            {item.name}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>
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
      
      {/* Save Overlay Toast */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] bg-zinc-950 border border-[#D4AF37] px-8 py-4 rounded-[32px] shadow-[0_30px_60px_rgba(0,0,0,0.8)] flex items-center gap-4"
          >
            <div className="w-10 h-10 bg-[#D4AF37] rounded-full flex items-center justify-center text-black text-xl font-bold">✓</div>
            <div>
              <p className="text-[11px] font-black text-white uppercase tracking-widest leading-none">Succès Studio</p>
              <p className="text-[9px] text-[#D4AF37] font-bold mt-1 uppercase opacity-80">{saveSuccess}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
