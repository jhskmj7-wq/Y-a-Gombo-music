import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Camera, Save, ShoppingBag, X, UserCheck, ShieldCheck } from 'lucide-react';
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
  background: ''
};

export default function AvatarEditor({ onClose }: AvatarEditorProps) {
  const { currentUser } = useAuth();
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
  const [useAsProfile, setUseAsProfile] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [activeTab, setActiveTab] = useState<AvatarItemCategory | 'couleur_peau'>('couleur_peau');

  // Realtime Listeners for Store Items, User Avatar Config & User Inventory
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);

    // 1. Subscribe Store Items
    const unsubItems = AvatarEngine.subscribeStoreItems((items) => {
      setStoreItems(items);
      setLoading(false);
    });

    // 2. Subscribe User Inventory
    const unsubInv = AvatarEngine.subscribeUserInventory(currentUser.uid, (inv) => {
      setInventory(inv);
    });

    // 3. Subscribe User Avatar Config
    const unsubAvatar = AvatarEngine.subscribeUserAvatar(currentUser.uid, (data) => {
      if (data) {
        setAvatarData(data);
        if (data.config) setConfig(data.config);
        setUseAsProfile(!!data.useAvatarAsProfile);
      }
    });

    return () => {
      unsubItems();
      unsubInv();
      unsubAvatar();
    };
  }, [currentUser]);

  // Handle Save Avatar & Sync Profile Photo
  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      // 1. Save Avatar config
      await AvatarEngine.saveUserAvatar(currentUser.uid, {
        config,
        useAvatarAsProfile: useAsProfile,
        inventory: inventory.ownedItems
      }, storeItems);

      // 2. Sync SVG Avatar URI to user profile if useAsProfile is active
      const avatarUri = AvatarEngine.generateAvatarSvg(config, storeItems);
      await AvatarEngine.setAvatarAsProfile(currentUser.uid, avatarUri, useAsProfile);

      onClose();
    } catch (e) {
      console.error("Failed to save avatar", e);
    } finally {
      setSaving(false);
    }
  };

  // Handle Equip item in editor
  const handleEquip = async (itemId: string, category: AvatarItemCategory) => {
    if (!currentUser) return;

    // Update local state for immediate responsiveness
    setConfig(prev => {
      const next = { ...prev };
      if (category === 'accessoires' || category === 'instruments') {
        const list = Array.isArray(next[category]) ? (next[category] as string[]) : [];
        if (list.includes(itemId)) {
          next[category] = list.filter(i => i !== itemId);
        } else {
          next[category] = [...list, itemId];
        }
      } else {
        // Single equip category
        (next as any)[category] = (next as any)[category] === itemId ? '' : itemId;
      }
      return next;
    });

    // Also persist in Firestore userInventory
    const isCurrentlyEquipped = inventory.equippedItems.includes(itemId);
    try {
      await AvatarEngine.equipItem(currentUser.uid, itemId, !isCurrentlyEquipped, category);
    } catch (err) {
      console.warn("Equip sync warning:", err);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md text-white font-mono text-xs gap-3">
        <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        <span>Chargement du Studio Avatar...</span>
      </div>
    );
  }

  // Filter items owned by user from storeItems + inventory
  const ownedItems = storeItems.filter(item => inventory.ownedItems.includes(item.id));
  const itemsInActiveTab = ownedItems.filter(item => item.category === activeTab);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn text-left font-sans">
      <div className="w-full max-w-5xl h-[88vh] bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl relative">
        
        {/* Left Panel: Avatar Preview & Profile Options */}
        <div className="w-full md:w-1/3 bg-zinc-950 border-r border-zinc-800 p-6 flex flex-col items-center justify-between relative">
          <div className="w-full flex items-center justify-between mb-4">
            <h2 className="text-lg font-black uppercase text-white tracking-wider font-sans">
              MON AVATAR GOMBO
            </h2>
            <span className="px-2.5 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 text-[9px] font-mono font-bold rounded-full">
              {inventory.ownedItems.length} ARTICLES
            </span>
          </div>
          
          <div className="flex-1 flex items-center justify-center my-4 w-full">
            <AvatarRenderer config={config} size={220} storeItems={storeItems} className="shadow-2xl rounded-3xl overflow-hidden border border-zinc-800" />
          </div>
          
          <div className="w-full space-y-3">
            <label className="flex items-center gap-3 p-3.5 bg-zinc-900 rounded-2xl border border-zinc-800 cursor-pointer hover:border-[#D4AF37]/50 transition">
              <input 
                type="checkbox" 
                checked={useAsProfile} 
                onChange={(e) => setUseAsProfile(e.target.checked)}
                className="w-5 h-5 accent-[#D4AF37]"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white uppercase tracking-tight flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Définir comme photo de profil
                </span>
                <span className="text-[10px] text-zinc-400">Remplacera votre photo Google publiquement</span>
              </div>
            </label>

            <button 
              onClick={() => setShowStore(true)}
              className="w-full py-3 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow hover:bg-white transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              Boutique Avatar ({storeItems.length} articles)
            </button>
          </div>
        </div>

        {/* Right Panel: Editor Controls & Tabs */}
        <div className="flex-1 flex flex-col h-full bg-zinc-900/40">
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <span className="text-xs text-zinc-400 font-mono">Personnalisation des pièces équipées</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition cursor-pointer"
              >
                Annuler
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow hover:bg-white transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Sauvegarder l'Avatar
              </button>
            </div>
          </div>

          {/* Categories Tabs */}
          <div className="flex overflow-x-auto p-3.5 gap-2 border-b border-zinc-800 scrollbar-none bg-zinc-950/40">
            {['couleur_peau', 'vêtements', 'couronnes', 'accessoires', 'instruments', 'coiffures', 'arriere-plans'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition cursor-pointer ${
                  activeTab === tab 
                    ? "bg-[#D4AF37] text-black font-black shadow" 
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-none">
            {activeTab === 'couleur_peau' ? (
              <div className="space-y-4">
                <p className="text-xs text-zinc-400 font-mono">Sélectionnez la teinte de peau de votre Avatar :</p>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-4">
                  {['#8D5524', '#C68642', '#E0AC69', '#F1C27D', '#FFDBAC', '#3D2314', '#2b170c'].map(color => (
                    <button
                      key={color}
                      onClick={() => setConfig({ ...config, skinColor: color })}
                      className={`w-12 h-12 rounded-2xl border-4 transition cursor-pointer ${
                        config.skinColor === color 
                          ? "border-[#D4AF37] scale-110 shadow-lg" 
                          : "border-zinc-800 hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {itemsInActiveTab.length === 0 ? (
                  <div className="col-span-full py-16 bg-zinc-950 border border-zinc-800 rounded-3xl text-center space-y-3">
                    <ShoppingBag className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p className="text-zinc-400 font-bold text-xs">
                      Vous ne possédez aucun article dans cette catégorie.
                    </p>
                    <button 
                      onClick={() => setShowStore(true)} 
                      className="px-4 py-2 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-wider rounded-xl hover:bg-white transition cursor-pointer"
                    >
                      Explorer la boutique
                    </button>
                  </div>
                ) : (
                  itemsInActiveTab.map(item => {
                    const isEquipped = 
                      (config as any)[item.category] === item.id || 
                      (Array.isArray((config as any)[item.category]) && (config as any)[item.category].includes(item.id)) ||
                      inventory.equippedItems.includes(item.id);

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleEquip(item.id, item.category as AvatarItemCategory)}
                        className={`aspect-square rounded-3xl border flex flex-col items-center justify-between p-3 relative transition cursor-pointer ${
                          isEquipped 
                            ? "bg-[#D4AF37]/10 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/5" 
                            : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        <div className="w-full flex-1 flex items-center justify-center p-2">
                          {item.imageUrl || item.previewImage || item.assetUrl ? (
                            <img src={item.imageUrl || item.previewImage || item.assetUrl} alt={item.name} className="max-h-16 object-contain" />
                          ) : item.svgContent ? (
                            <div className="w-12 h-12" dangerouslySetInnerHTML={{ __html: item.svgContent }} />
                          ) : (
                            <span className="text-2xl">🎭</span>
                          )}
                        </div>

                        <span className="text-[10px] font-bold text-center text-white line-clamp-1 uppercase">
                          {item.name}
                        </span>

                        {isEquipped && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 bg-[#D4AF37] text-black font-black text-[8px] uppercase rounded-full shadow">
                            Équipé
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

      {showStore && (
        <AvatarStore 
          onClose={() => setShowStore(false)} 
          inventory={inventory.ownedItems} 
        />
      )}
    </div>
  );
}
