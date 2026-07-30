import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Camera, Save, ShoppingBag, X, User } from 'lucide-react';
import { AvatarConfig, UserAvatarData, AvatarItemCategory, AvatarItem } from '../../types/avatar';
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
  const [inventory, setInventory] = useState<string[]>([]);
  const [storeItems, setStoreItems] = useState<AvatarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [useAsProfile, setUseAsProfile] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [activeTab, setActiveTab] = useState<AvatarItemCategory | 'couleur_peau'>('couleur_peau');

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      const data = await AvatarEngine.getUserAvatar(currentUser.uid);
      const items = await AvatarEngine.getStoreItems();
      
      setStoreItems(items);
      
      if (data) {
        setAvatarData(data);
        setConfig(data.config);
        setInventory(data.inventory || []);
        setUseAsProfile(data.useAvatarAsProfile || false);
      }
      setLoading(false);
    };
    fetchData();
  }, [currentUser, showStore]); // Re-fetch when closing store to update inventory

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await AvatarEngine.saveUserAvatar(currentUser.uid, {
        config,
        useAvatarAsProfile: useAsProfile,
        inventory
      }, storeItems);
      onClose();
    } catch (e) {
      console.error("Failed to save avatar", e);
    } finally {
      setSaving(false);
    }
  };

  const handleEquip = (itemId: string, category: AvatarItemCategory) => {
    setConfig(prev => {
      const next = { ...prev };
      if (category === 'accessoires' || category === 'instruments') {
        const list = next[category] as string[];
        if (list.includes(itemId)) {
          next[category] = list.filter(i => i !== itemId);
        } else {
          next[category] = [...list, itemId];
        }
      } else {
        // Single equip categories
        (next as any)[category] = (next as any)[category] === itemId ? '' : itemId;
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md">
        <div className="w-12 h-12 border-4 border-afri-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const ownedItems = storeItems.filter(item => inventory.includes(item.id));
  const itemsInActiveTab = ownedItems.filter(item => item.category === activeTab);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-5xl h-[85vh] bg-afri-bg-sec border border-afri-border rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl relative">
        
        {/* Left Panel: Preview */}
        <div className="w-full md:w-1/3 bg-afri-bg border-r border-afri-border p-6 flex flex-col items-center justify-center relative">
          <div className="absolute top-4 left-4">
            <h2 className="text-xl font-black uppercase text-afri-text tracking-tight">Mon Avatar</h2>
          </div>
          
          <AvatarRenderer config={config} size={240} storeItems={storeItems} className="mb-8" />
          
          <div className="w-full space-y-4">
            <label className="flex items-center gap-3 p-4 bg-afri-bg-ter rounded-2xl border border-afri-border cursor-pointer hover:border-afri-gold/50 transition-colors">
              <input 
                type="checkbox" 
                checked={useAsProfile} 
                onChange={(e) => setUseAsProfile(e.target.checked)}
                className="w-5 h-5 accent-afri-gold"
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-afri-text">Définir comme photo de profil</span>
                <span className="text-[10px] text-afri-text-sec">Remplacera votre photo actuelle publiquement</span>
              </div>
            </label>

            <button 
              onClick={() => setShowStore(true)}
              className="w-full py-3.5 bg-afri-bg border border-afri-gold/50 text-afri-gold font-black text-xs uppercase tracking-wider rounded-xl shadow-sm hover:bg-afri-gold/10 transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              Boutique Avatar
            </button>
          </div>
        </div>

        {/* Right Panel: Editor Controls */}
        <div className="flex-1 flex flex-col h-full bg-afri-bg-sec/50">
          <div className="flex justify-end p-4 border-b border-afri-border">
            <div className="flex gap-2">
              <button 
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-afri-text-sec hover:text-afri-text transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-amber-500 to-[#D4AF37] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-2"
              >
                {saving ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Sauvegarder
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto p-4 gap-2 border-b border-afri-border no-scrollbar bg-afri-bg-ter/30">
            {['couleur_peau', 'vêtements', 'accessoires', 'instruments', 'afrique', 'arriere-plans'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                  activeTab === tab ? "bg-afri-gold text-black shadow-md" : "bg-afri-bg border border-afri-border text-afri-text-sec hover:text-afri-text"
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {activeTab === 'couleur_peau' ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                {['#8D5524', '#C68642', '#E0AC69', '#F1C27D', '#FFDBAC', '#3D2314', '#2b170c'].map(color => (
                  <button
                    key={color}
                    onClick={() => setConfig({ ...config, skinColor: color })}
                    className={`w-12 h-12 rounded-full border-4 transition-transform ${config.skinColor === color ? "border-afri-gold scale-110" : "border-transparent hover:scale-105 shadow-sm"}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {itemsInActiveTab.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-afri-text-sec text-sm">
                    Vous ne possédez aucun article dans cette catégorie.<br/>
                    <button onClick={() => setShowStore(true)} className="text-afri-gold font-bold mt-2 hover:underline">
                      Visiter la boutique
                    </button>
                  </div>
                ) : (
                  itemsInActiveTab.map(item => {
                    const isEquipped = (config as any)[item.category] === item.id || 
                      (Array.isArray((config as any)[item.category]) && (config as any)[item.category].includes(item.id));

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleEquip(item.id, item.category)}
                        className={`aspect-square rounded-2xl border flex flex-col items-center justify-center p-2 relative transition-all ${
                          isEquipped ? "bg-afri-gold/10 border-afri-gold" : "bg-afri-bg border-afri-border hover:border-afri-gold/50"
                        }`}
                      >
                        {item.svgContent ? (
                          <svg viewBox="0 0 100 100" className="w-10 h-10 mb-2">
                             <g dangerouslySetInnerHTML={{ __html: item.svgContent }} />
                          </svg>
                        ) : (
                          <div className="w-10 h-10 bg-afri-bg-ter rounded-full mb-2 flex items-center justify-center">?</div>
                        )}
                        <span className="text-[9px] font-bold text-center text-afri-text leading-tight">{item.name}</span>
                        {isEquipped && (
                          <div className="absolute top-2 right-2 w-3 h-3 bg-afri-gold rounded-full border-2 border-afri-bg-sec" />
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

      {showStore && <AvatarStore onClose={() => setShowStore(false)} inventory={inventory} />}
    </div>
  );
}
