import React, { useState, useEffect, useMemo } from 'react';
import { Save, ShoppingBag, UserCheck, ArrowLeft, RefreshCw, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    svgContent: `<path d="M35 210 C 35 155, 60 132, 100 132 C 140 132, 165 155, 165 210 L 165 225 L 35 225 Z" />`
  },
  {
    id: "tete_elite_standard",
    name: "Visage Elite",
    category: "tete",
    price: 0,
    isActive: true,
    svgContent: `<path d="M68 80 C 68 32, 132 32, 132 80 C 132 120, 115 140, 100 145 C 85 140, 68 120, 68 80 Z" />`
  },
  {
    id: "tete_elite_fine",
    name: "Visage Fin Elite",
    category: "tete",
    price: 0,
    isActive: true,
    svgContent: `<path d="M72 80 C 72 35, 128 35, 128 80 C 128 125, 100 148, 100 148 C 100 148, 72 125, 72 80 Z" />`
  },
  // BARBE / MOUSTACHE (Elite Style)
  {
    id: "visage_naturel",
    name: "Rasé",
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
    svgContent: `<path d="M68 90 Q100 145 132 90 L128 110 Q100 130 72 110 Z" fill="#111" opacity="0.3" />`
  },
  {
    id: "visage_barbe_elite_fournie",
    name: "Barbe Elite Fournie",
    category: "barbe",
    price: 0,
    isActive: true,
    svgContent: `<path d="M65 90 Q100 155 135 90 L125 125 Q100 145 75 125 Z" fill="#111" />`
  },
  {
    id: "visage_bouc_elite",
    name: "Bouc Sculpté",
    category: "barbe",
    price: 0,
    isActive: true,
    svgContent: `<path d="M90 115 Q100 135 110 115 L108 135 Q100 142 92 135 Z" fill="#222" />`
  },
  // COIFFURES
  {
    id: "hair_elite_afro_short",
    name: "Afro Elite Court",
    category: "cheveux",
    price: 0,
    isActive: true,
    svgContent: `<path d="M55 80 C 55 25, 145 25, 145 80 Q100 35 55 80 Z" fill="#111" />`
  },
  {
    id: "hair_elite_degrade",
    name: "Dégradé Pro",
    category: "cheveux",
    price: 0,
    isActive: true,
    svgContent: `<path d="M68 80 C 68 35, 132 35, 132 80 Q100 45 68 80 Z" fill="#181818" />`
  },
  {
    id: "hair_elite_nattes",
    name: "Nattes Afro-Chic",
    category: "cheveux",
    price: 0,
    isActive: true,
    svgContent: `<g fill="#1A1A1A"><path d="M68 80 C 68 35, 132 35, 132 80 Q100 45 68 80 Z" /><path d="M80 40 L80 80 M100 35 L100 80 M120 40 L120 80" stroke="#D4AF37" stroke-width="1.8" stroke-linecap="round" opacity="0.8"/></g>`
  },
  {
    id: "hair_elite_locks",
    name: "Elite Locks",
    category: "cheveux",
    price: 0,
    isActive: true,
    svgContent: `<g fill="#111"><path d="M68 80 C 68 35, 132 35, 132 80 Q100 45 68 80 Z" /><path d="M70 60 L60 110 M85 45 L80 115 M100 40 L100 120 M115 45 L120 115 M130 60 L140 110" stroke="#111" stroke-width="5" stroke-linecap="round" /></g>`
  },
  // YEUX
  {
    id: "eyes_elite_noir",
    name: "Regard Intense",
    category: "yeux",
    price: 0,
    isActive: true,
    svgContent: `<g><circle cx="85" cy="80" r="5.5" fill="#111" /><circle cx="115" cy="80" r="5.5" fill="#111" /><circle cx="83" cy="78" r="1.8" fill="#FFF" opacity="0.7" /><circle cx="113" cy="78" r="1.8" fill="#FFF" opacity="0.7" /></g>`
  },
  {
    id: "eyes_elite_marron",
    name: "Elite Marron",
    category: "yeux",
    price: 0,
    isActive: true,
    svgContent: `<g><circle cx="85" cy="80" r="6" fill="#4E3629" /><circle cx="115" cy="80" r="6" fill="#4E3629" /><circle cx="85" cy="80" r="3" fill="#111" /><circle cx="115" cy="80" r="3" fill="#111" /><circle cx="83.5" cy="78.5" r="1.2" fill="#FFF" opacity="0.5" /><circle cx="113.5" cy="78.5" r="1.2" fill="#FFF" opacity="0.5" /></g>`
  },
  // BOUCHE
  {
    id: "mouth_elite_sourire",
    name: "Sourire Elite",
    category: "bouche",
    price: 0,
    isActive: true,
    svgContent: `<path d="M85 115 Q100 125 115 115" stroke="#4A3018" stroke-width="3" fill="none" stroke-linecap="round" />`
  },
  {
    id: "mouth_elite_neutre",
    name: "Bouche Elite",
    category: "bouche",
    price: 0,
    isActive: true,
    svgContent: `<path d="M85 118 L115 118" stroke="#4A3018" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.7" />`
  },
  // VÊTEMENTS
  {
    id: "clothes_elite_tshirt_blanc",
    name: "T-Shirt Gombo Premium",
    category: "tee-shirt",
    price: 0,
    isActive: true,
    svgContent: `<path d="M35 210 C 35 155, 60 132, 100 132 C 140 132, 165 155, 165 210 Z" fill="#FFFFFF" stroke="#EEE" stroke-width="1" />`
  },
  {
    id: "clothes_elite_boubou_short",
    name: "Boubou Elite Or",
    category: "chemise",
    price: 0,
    isActive: true,
    svgContent: `<path d="M30 210 Q100 120 170 210 Z" fill="#1A1A2E" stroke="#D4AF37" stroke-width="2.5" /><path d="M90 132 L110 132 L100 158 Z" fill="#D4AF37" />`
  },
  {
    id: "clothes_elite_veste_sapeur",
    name: "Veste Sapeur Elite",
    category: "veste",
    price: 0,
    isActive: true,
    svgContent: `<path d="M35 210 L50 145 Q100 130 150 145 L165 210 Z" fill="#C0392B" /><path d="M85 135 L100 170 L115 135" fill="#FFF" />`
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

  // When tab changes, set default subcategory
  useEffect(() => {
    const tab = TABS.find(t => t.id === activeTab);
    if (tab && tab.categories.length > 0) {
      setActiveSubCategory(tab.categories[0]);
    }
  }, [activeTab]);

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
        if (typeof value === 'string' && value && !['skinColor', 'faceShape', 'background'].includes(key)) {
          itemsV2[key] = value;
        }
      });
      
      // Handle special fields
      if (finalConfig.background && storeItems.some(i => i.id === finalConfig.background)) {
        itemsV2['arriere_plans'] = finalConfig.background;
      }

      const configV2 = { items: itemsV2, skinColor: finalConfig.skinColor };

      // Batch sync via the new Modular Synchronizer
      await AvatarEngine.saveUserAvatar(currentUser.uid, {
        config: finalConfig,
        configV2: configV2,
        useAvatarAsProfile: useAsProfile,
        inventory: inventory.ownedItems
      }, [...FREE_DEFAULT_ITEMS, ...storeItems]);

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

  const handleEquip = async (itemId: string, category: string) => {
    if (!currentUser) return;

    setConfig(prev => {
      const next = { ...prev };
      (next as any)[category] = (next as any)[category] === itemId ? '' : itemId;
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
        <span>Chargement du Studio Avatar Elite...</span>
      </div>
    );
  }

  const ownedStoreItems = storeItems.filter(item => inventory.ownedItems.includes(item.id));
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
    <div className="fixed inset-0 z-[110] bg-zinc-950 md:bg-black/80 md:backdrop-blur-md flex flex-col items-center justify-center p-0 md:p-4 font-sans text-left overflow-hidden">
      <div className="w-full max-w-5xl h-full md:h-[92vh] bg-zinc-900 md:rounded-[40px] border-0 md:border border-afri-border/30 flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Elite Gradient Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />

        {/* Top Bar */}
        <div className="shrink-0 bg-zinc-950 border-b border-afri-border/30 px-6 py-4 flex items-center justify-between z-40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-yellow-700 flex items-center justify-center shadow-lg">
              <span className="text-xl">🤴</span>
            </div>
            <div>
              <h2 className="text-sm font-black uppercase text-afri-text tracking-widest leading-none">AFRIGOMBO ELITE</h2>
              <p className="text-[9px] text-[#D4AF37] font-bold mt-1 opacity-70">STUDIO DE PERSONNALISATION</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-afri-text-sec hover:text-afri-text transition"
            >
              Fermer
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-xl hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Enregistrer
            </button>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Column: Premium Preview */}
          <div className="w-full md:w-[350px] bg-zinc-950 border-b md:border-b-0 md:border-r border-afri-border/20 p-8 flex flex-col items-center justify-start gap-8 shrink-0 overflow-y-auto custom-scrollbar">
            <div className="relative group">
              <div className="absolute inset-0 bg-[#D4AF37]/5 blur-[60px] rounded-full animate-pulse" />
              <div className="relative z-10 w-64 h-64 rounded-full border-8 border-zinc-900 shadow-2xl overflow-hidden p-1 bg-gradient-to-b from-white/5 to-transparent">
                <AvatarRenderer 
                  config={{ 
                    ...config, 
                    configV2: { 
                      items: Object.fromEntries(
                        Object.entries(config).filter(([k, v]) => typeof v === 'string' && v && !['skinColor', 'faceShape', 'background'].includes(k))
                      )
                    } 
                  }} 
                  size={240} 
                  storeItems={[...FREE_DEFAULT_ITEMS, ...storeItems]}
                />
              </div>
            </div>
            
            <div className="w-full space-y-4">
              <div className="p-4 bg-zinc-900 rounded-2xl border border-afri-border/20 space-y-4">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-afri-text uppercase tracking-wider group-hover:text-[#D4AF37] transition">Synchro Profil</span>
                    <span className="text-[9px] text-afri-text-sec">Appliquer à mon profil public</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={useAsProfile} 
                    onChange={(e) => setUseAsProfile(e.target.checked)}
                    className="w-5 h-5 accent-[#D4AF37]"
                  />
                </label>
                
                <button 
                  onClick={handleSyncProfile}
                  disabled={saving}
                  className="w-full py-3 bg-[#D4AF37]/10 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border border-[#D4AF37]/30"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
                  Mise à jour immédiate
                </button>
              </div>

              <button 
                onClick={() => setShowStore(true)}
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-afri-text border border-white/5 font-black text-[10px] uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
                Boutique Elite ({storeItems.length})
              </button>
            </div>
          </div>

          {/* Right Column: Category Tabs & Grid */}
          <div className="flex-1 flex flex-col bg-zinc-900/30 overflow-hidden min-h-0">
            
            {/* Main Tabs */}
            <div className="flex bg-zinc-950 px-6 pt-4 gap-6 overflow-x-auto no-scrollbar border-b border-afri-border/20">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 px-1 text-[11px] font-black uppercase tracking-[0.15em] transition-all relative ${
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
            <div className="flex gap-2 p-4 bg-zinc-950/20 overflow-x-auto no-scrollbar border-b border-afri-border/10">
              {TABS.find(t => t.id === activeTab)?.categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveSubCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border ${
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
            <div className="flex-1 overflow-y-auto p-6 pb-24 md:pb-8 custom-scrollbar">
              
              {/* Skin Tone Selector */}
              {activeSubCategory === 'corps' && (
                <div className="mb-8 p-6 bg-zinc-950/40 rounded-3xl border border-afri-border/10">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37] mb-5">Teinture de Peau Elite</h4>
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
