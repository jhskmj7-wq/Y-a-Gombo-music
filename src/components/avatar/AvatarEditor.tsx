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
  // CORPS & TÊTE (Elite Bases)
  {
    id: "corps_elite_standard",
    name: "Silhouette Standard",
    category: "corps",
    price: 0,
    isActive: true,
    svgContent: `<path d="M40 210 C 40 160, 60 135, 100 135 C 140 135, 160 160, 160 210 L 160 220 L 40 220 Z" />`
  },
  {
    id: "tete_elite_standard",
    name: "Visage Elite",
    category: "tete",
    price: 0,
    isActive: true,
    svgContent: `<path d="M68 80 C 68 35, 132 35, 132 80 C 132 125, 100 142, 100 142 C 100 142, 68 125, 68 80 Z" />`
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
    id: "visage_bouc_elite",
    name: "Bouc Sculpté",
    category: "barbe",
    price: 0,
    isActive: true,
    svgContent: `<path d="M90 115 Q100 135 110 115 L108 135 Q100 142 92 135 Z" fill="#222" />`
  },
  // COIFFURES (Elite: following skull shape)
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
    svgContent: `<path d="M68 80 C 68 40, 132 40, 132 80 Q100 50 68 80 Z" fill="#181818" />`
  },
  {
    id: "hair_elite_nattes",
    name: "Nattes Afro-Chic",
    category: "cheveux",
    price: 0,
    isActive: true,
    svgContent: `<g fill="#1A1A1A"><path d="M68 80 C 68 40, 132 40, 132 80 Q100 45 68 80 Z" /><path d="M80 45 L80 80 M100 40 L100 80 M120 45 L120 80" stroke="#D4AF37" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/></g>`
  },
  // YEUX (Elite: subtle gradient & reflections)
  {
    id: "eyes_elite_noir",
    name: "Regard Intense",
    category: "yeux",
    price: 0,
    isActive: true,
    svgContent: `<g><circle cx="85" cy="80" r="5" fill="#111" /><circle cx="115" cy="80" r="5" fill="#111" /><circle cx="83.5" cy="78.5" r="1.5" fill="#FFF" opacity="0.6" /><circle cx="113.5" cy="78.5" r="1.5" fill="#FFF" opacity="0.6" /></g>`
  },
  // BOUCHE (Elite: realistic shapes)
  {
    id: "mouth_elite_sourire",
    name: "Sourire Elite",
    category: "bouche",
    price: 0,
    isActive: true,
    svgContent: `<path d="M85 115 Q100 122 115 115" stroke="#4A3018" strokeWidth="2.5" fill="none" strokeLinecap="round" />`
  },
  // VÊTEMENTS (Elite: sitting on shoulders)
  {
    id: "clothes_elite_tshirt_blanc",
    name: "T-Shirt Gombo Premium",
    category: "tee-shirt",
    price: 0,
    isActive: true,
    svgContent: `<path d="M40 210 C 40 160, 60 135, 100 135 C 140 135, 160 160, 160 210 Z" fill="#FFFFFF" stroke="#EEE" stroke-width="1" />`
  },
  {
    id: "clothes_elite_boubou_short",
    name: "Boubou Elite Or",
    category: "chemise",
    price: 0,
    isActive: true,
    svgContent: `<path d="M35 210 Q100 120 165 210 Z" fill="#1A1A2E" stroke="#D4AF37" stroke-width="2" /><path d="M90 135 L110 135 L100 160 Z" fill="#D4AF37" />`
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
