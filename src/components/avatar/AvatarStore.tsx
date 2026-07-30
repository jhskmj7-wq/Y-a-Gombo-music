import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Star, Crown, Wallet, Check, AlertCircle, X, ChevronRight, Filter } from 'lucide-react';
import { AvatarItem, AvatarItemCategory } from '../../types/avatar';
import { AvatarEngine } from '../../lib/avatarEngine';
import { useAuth } from '../../AuthContext';

interface AvatarStoreProps {
  onClose: () => void;
  inventory: string[]; // User's owned items
}

const CATEGORIES: { id: AvatarItemCategory | 'all'; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Tout', icon: <ShoppingBag className="w-4 h-4" /> },
  { id: 'vêtements', label: 'Vêtements', icon: '👕' },
  { id: 'accessoires', label: 'Accessoires', icon: '🕶️' },
  { id: 'instruments', label: 'Instruments', icon: '🎸' },
  { id: 'afrique', label: 'Afrique', icon: '🌍' },
  { id: 'premium', label: 'Premium', icon: <Crown className="w-4 h-4 text-amber-500" /> },
];

export default function AvatarStore({ onClose, inventory }: AvatarStoreProps) {
  const { profile, currentUser } = useAuth();
  const currentUserProfile = profile;
  
  const [items, setItems] = useState<AvatarItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<AvatarItemCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [localInventory, setLocalInventory] = useState<string[]>(inventory);
  
  const walletBalance = currentUserProfile?.wallet?.soldeDisponible ?? currentUserProfile?.walletBalance ?? 0;
  const isUserPremium = currentUserProfile?.premium || currentUserProfile?.isPremium || currentUserProfile?.subscriptionType === 'premium';

  useEffect(() => {
    const fetchStore = async () => {
      const storeItems = await AvatarEngine.getStoreItems();
      setItems(storeItems);
      setLoading(false);
    };
    fetchStore();
  }, []);

  const handlePurchase = async (item: AvatarItem) => {
    if (!currentUser) return;
    
    if (item.isPremiumOnly && !isUserPremium) {
      setErrorMsg("Cet article est réservé aux membres Premium.");
      return;
    }

    setPurchasing(item.id);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await AvatarEngine.purchaseItem(currentUser.uid, item, currentUserProfile);
      setLocalInventory(prev => [...prev, item.id]);
      setSuccessMsg(`Félicitations ! Vous avez acquis: ${item.name}`);
      
      // Dispatch event to update wallet globally if needed
      window.dispatchEvent(new CustomEvent("wallet_balance_updated"));
    } catch (e: any) {
      setErrorMsg(e.message || "Erreur lors de l'achat.");
    } finally {
      setPurchasing(null);
    }
  };

  const filteredItems = items.filter(item => 
    activeCategory === 'all' ? true : item.category === activeCategory
  );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl bg-afri-bg-sec border border-afri-gold/20 rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-afri-border flex items-center justify-between bg-afri-bg relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-afri-gold/5 blur-3xl rounded-full pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-afri-gold/10 flex items-center justify-center border border-afri-gold/30">
              <ShoppingBag className="w-6 h-6 text-afri-gold" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-afri-text uppercase tracking-tight">
                Boutique Avatar
              </h2>
              <p className="text-xs text-afri-text-sec">Personnalisez votre identité AFRIGOMBO</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-afri-bg-ter rounded-xl border border-afri-border">
              <Wallet className="w-4 h-4 text-afri-gold" />
              <span className="text-sm font-mono font-black text-afri-gold">
                {walletBalance.toLocaleString()} F
              </span>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-afri-bg hover:bg-afri-gold/10 border border-afri-border flex items-center justify-center text-afri-text-sec transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex overflow-x-auto p-4 gap-2 border-b border-afri-border bg-afri-bg-ter/50 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeCategory === cat.id 
                  ? "bg-afri-gold text-black shadow-md" 
                  : "bg-afri-bg border border-afri-border text-afri-text-sec hover:text-afri-text hover:border-afri-gold/50"
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Alerts */}
        {(errorMsg || successMsg) && (
          <div className={`mx-6 mt-4 p-4 rounded-xl text-sm font-bold flex items-center gap-3 ${
            errorMsg ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
          }`}>
            {errorMsg ? <AlertCircle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
            {errorMsg || successMsg}
          </div>
        )}

        {/* Store Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-afri-bg-sec/50">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-afri-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <p className="text-afri-text font-bold">Aucun article dans cette catégorie pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredItems.map(item => {
                const isOwned = localInventory.includes(item.id);
                const isAffordable = walletBalance >= item.price;
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative p-4 rounded-2xl border flex flex-col ${
                      item.isPremiumOnly 
                        ? "bg-gradient-to-br from-amber-500/5 to-orange-600/5 border-amber-500/30" 
                        : "bg-afri-bg border-afri-border"
                    }`}
                  >
                    {item.isPremiumOnly && (
                      <div className="absolute -top-2 -right-2 bg-amber-500 text-black text-[9px] font-black uppercase px-2 py-1 rounded-lg shadow-md flex items-center gap-1 z-10">
                        <Crown className="w-3 h-3" /> Premium
                      </div>
                    )}
                    
                    {/* Item Preview (Placeholder until we have real SVGs) */}
                    <div className="h-24 w-full bg-afri-bg-sec rounded-xl mb-3 flex items-center justify-center border border-afri-border/50 overflow-hidden relative group">
                      {item.svgContent ? (
                        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-md">
                           <g dangerouslySetInnerHTML={{ __html: item.svgContent }} />
                        </svg>
                      ) : (
                        <span className="text-3xl opacity-50">{
                          item.category === 'vêtements' ? '👕' : 
                          item.category === 'instruments' ? '🎸' : 
                          item.category === 'accessoires' ? '🕶️' : '✨'
                        }</span>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-black text-afri-text uppercase tracking-tight line-clamp-1">{item.name}</h4>
                        <span className="text-[10px] text-afri-text-sec uppercase font-bold">{item.category}</span>
                      </div>
                      
                      <div className="mt-3">
                        {isOwned ? (
                          <div className="w-full py-2 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase rounded-lg border border-emerald-500/20 text-center flex items-center justify-center gap-1">
                            <Check className="w-3 h-3" /> Possédé
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePurchase(item)}
                            disabled={purchasing === item.id || (!isAffordable && !isOwned)}
                            className={`w-full py-2 flex items-center justify-center gap-1.5 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                              purchasing === item.id 
                                ? "bg-afri-gold/50 text-black"
                                : !isAffordable 
                                  ? "bg-afri-bg-ter text-afri-text-muted cursor-not-allowed"
                                  : "bg-afri-gold text-black hover:bg-amber-400 hover:scale-[1.02] active:scale-95 shadow-md"
                            }`}
                          >
                            {purchasing === item.id ? (
                              <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <span>Acheter</span>
                                <span className="font-mono bg-black/20 px-1.5 py-0.5 rounded ml-1">{item.price} F</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
