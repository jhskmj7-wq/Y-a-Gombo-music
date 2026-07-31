import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Star, Crown, Wallet, Check, AlertCircle, X, ChevronRight, Filter,
  Sparkles, CheckCircle2, ShieldCheck, Shirt, Glasses, Music, Palette, UserCheck,
  Gift, Coins, Zap, Clock, PlusCircle
} from 'lucide-react';
import { AvatarItem, AvatarItemCategory, UserInventoryData } from '../../types/avatar';
import { AvatarEngine, getLevelFromXp } from '../../lib/avatarEngine';
import { useAuth } from '../../AuthContext';
import DailyRewardModal from './DailyRewardModal';
import CoinPurchaseModal from './CoinPurchaseModal';
import AvatarGiftingModal from './AvatarGiftingModal';

interface AvatarStoreProps {
  onClose: () => void;
  inventory?: string[]; // Optional initial inventory array fallback
}

const CATEGORIES: { id: AvatarItemCategory | 'all' | 'limited'; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Tous', icon: <ShoppingBag className="w-4 h-4" /> },
  { id: 'limited', label: 'Éditions Limitées 🔥', icon: <Clock className="w-4 h-4 text-amber-400" /> },
  { id: 'vêtements', label: 'Vêtements', icon: '👕' },
  { id: 'couronnes', label: 'Couronnes & Chapeaux', icon: '👑' },
  { id: 'accessoires', label: 'Accessoires', icon: '🕶️' },
  { id: 'instruments', label: 'Instruments', icon: '🪘' },
  { id: 'afrique', label: 'Style Afrique', icon: '🌍' },
  { id: 'coiffures', label: 'Coiffures', icon: '💇' },
  { id: 'arriere-plans', label: 'Arrière-plans', icon: '🌅' },
  { id: 'premium', label: 'VIP Premium', icon: <Crown className="w-4 h-4 text-[#D4AF37]" /> },
];

export default function AvatarStore({ onClose, inventory: initialInventory = [] }: AvatarStoreProps) {
  const { profile, currentUser } = useAuth();
  const currentUserProfile = profile;
  
  const [items, setItems] = useState<AvatarItem[]>([]);
  const [userInventory, setUserInventory] = useState<UserInventoryData>({
    uid: currentUser?.uid || "",
    ownedItems: initialInventory,
    equippedItems: [],
    coinsSpent: 0,
    premiumItems: []
  });

  const [activeCategory, setActiveCategory] = useState<AvatarItemCategory | 'all' | 'limited'>('all');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [equipping, setEquipping] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [giftingItem, setGiftingItem] = useState<AvatarItem | null>(null);

  const walletBalance = currentUserProfile?.wallet?.soldeDisponible ?? currentUserProfile?.walletBalance ?? 0;
  const avatarCoins = Number(currentUserProfile?.avatarCoins) || 0;
  const avatarXp = Number(currentUserProfile?.avatarXp) || 0;
  const levelInfo = getLevelFromXp(avatarXp);

  const isUserPremium = currentUserProfile?.premium || currentUserProfile?.isPremium || currentUserProfile?.subscriptionType === 'premium';

  // Realtime Firestore Subscriptions for Store Items & Inventory
  useEffect(() => {
    setLoading(true);

    // 1. Subscribe Store Items
    const unsubItems = AvatarEngine.subscribeStoreItems((storeItems) => {
      setItems(storeItems);
      setLoading(false);
    });

    // 2. Subscribe User Inventory
    let unsubInv = () => {};
    if (currentUser?.uid) {
      unsubInv = AvatarEngine.subscribeUserInventory(currentUser.uid, (inv) => {
        setUserInventory(inv);
      });
    }

    return () => {
      unsubItems();
      unsubInv();
    };
  }, [currentUser]);

  // Handle Purchase
  const handlePurchase = async (item: AvatarItem) => {
    if (!currentUser) {
      setErrorMsg("Veuillez vous connecter pour acheter un article.");
      return;
    }
    
    if ((item.isPremiumOnly || item.premiumOnly) && !isUserPremium) {
      setErrorMsg("Cet article est réservé exclusivement aux membres Premium 👑");
      return;
    }

    if (item.requiredLevel && levelInfo.level < item.requiredLevel) {
      setErrorMsg(`Ce vêtement nécessite le Niveau ${item.requiredLevel} ! Votre niveau actuel : Niveau ${levelInfo.level} (${levelInfo.title})`);
      return;
    }

    if (avatarCoins < item.price && walletBalance < item.price) {
      setErrorMsg(`Solde insuffisant. Vous avez ${avatarCoins} Gombo Coins et ${walletBalance.toLocaleString("fr-FR")} FCFA.`);
      return;
    }

    setPurchasing(item.id);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // If user has enough Coins, use awardCoins deduction / purchase, or standard purchaseItem
      if (avatarCoins >= item.price) {
        await AvatarEngine.awardCoins(currentUser.uid, -item.price, Math.floor(item.price / 5), `Achat Avatar: ${item.name}`);
        // Add to inventory
        await AvatarEngine.equipItem(currentUser.uid, item.id, true, item.category);
      } else {
        await AvatarEngine.purchaseItem(currentUser.uid, item, currentUserProfile);
        await AvatarEngine.equipItem(currentUser.uid, item.id, true, item.category);
      }

      setSuccessMsg(`Félicitations ! Vous avez acquis : ${item.name}`);
    } catch (e: any) {
      console.error("Purchase error:", e);
      setErrorMsg(e.message || "Erreur lors de l'achat.");
    } finally {
      setPurchasing(null);
    }
  };

  // Handle Equip / Unequip
  const handleToggleEquip = async (item: AvatarItem) => {
    if (!currentUser) return;
    const isCurrentlyEquipped = userInventory.equippedItems.includes(item.id);
    setEquipping(item.id);
    setErrorMsg(null);

    try {
      await AvatarEngine.equipItem(currentUser.uid, item.id, !isCurrentlyEquipped, item.category);
      setSuccessMsg(
        !isCurrentlyEquipped 
          ? `Article équipé : ${item.name}` 
          : `Article retiré : ${item.name}`
      );
    } catch (e: any) {
      console.error("Equip error:", e);
      setErrorMsg("Erreur lors du changement d'équipement.");
    } finally {
      setEquipping(null);
    }
  };

  const filteredItems = items.filter(item => {
    if (!item.isActive) return false;
    if (activeCategory === 'all') return true;
    if (activeCategory === 'limited') return !!item.isLimited;
    if (activeCategory === 'premium') return !!(item.isPremiumOnly || item.premiumOnly);
    return item.category === activeCategory;
  });

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn text-left font-sans">
      <div className="w-full max-w-5xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col max-h-[92vh] shadow-2xl relative">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 blur-3xl rounded-full pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                  BOUTIQUE AVATAR
                </h2>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-mono font-black rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Niveau {levelInfo.level} • {levelInfo.title}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Gagnez des Gombo Coins, débloquez des raretés et offrez des boubous à vos amis
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 relative z-10">
            {/* Daily Reward Trigger */}
            <button
              onClick={() => setShowDailyModal(true)}
              className="px-3 py-2 bg-gradient-to-r from-emerald-500/20 to-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-xl text-xs font-bold text-[#D4AF37] hover:text-white transition flex items-center gap-1.5 cursor-pointer"
            >
              <Gift className="w-4 h-4 text-[#D4AF37] animate-bounce" />
              <span className="hidden sm:inline uppercase">Bonus 🎁</span>
            </button>

            {/* Gombo Coins Display */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 rounded-xl border border-zinc-800">
              <Coins className="w-4 h-4 text-[#D4AF37]" />
              <div className="flex flex-col">
                <span className="text-[8px] text-zinc-500 font-mono uppercase font-bold">Gombo Coins</span>
                <span className="text-xs font-mono font-black text-[#D4AF37]">
                  {avatarCoins.toLocaleString("fr-FR")} C
                </span>
              </div>
              <button 
                onClick={() => setShowCoinModal(true)}
                className="ml-1 p-1 bg-[#D4AF37] text-black rounded-lg hover:bg-white transition cursor-pointer"
                title="Acheter des Coins"
              >
                <PlusCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories Navigation Bar */}
        <div className="flex overflow-x-auto p-3.5 gap-2 border-b border-zinc-800/80 bg-zinc-950/60 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                activeCategory === cat.id 
                  ? "bg-[#D4AF37] text-black font-black shadow" 
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Alerts banner */}
        {(errorMsg || successMsg) && (
          <div className={`mx-6 mt-4 p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 ${
            errorMsg 
              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          }`}>
            <div className="flex items-center gap-2">
              {errorMsg ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{errorMsg || successMsg}</span>
            </div>
            <button onClick={() => { setErrorMsg(null); setSuccessMsg(null); }} className="text-zinc-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Store Items Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-none bg-zinc-900/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500 font-mono text-xs">
              <div className="w-8 h-8 border-3 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
              <span>Chargement de la Boutique Économique...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-3">
              <ShoppingBag className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-zinc-400 font-bold text-xs">Aucun article disponible dans cette catégorie.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map(item => {
                const isOwned = userInventory.ownedItems.includes(item.id) || initialInventory.includes(item.id);
                const isEquipped = userInventory.equippedItems.includes(item.id);
                const isPremiumItem = !!(item.isPremiumOnly || item.premiumOnly);
                const isAffordable = avatarCoins >= item.price || walletBalance >= item.price;
                const isLevelLocked = item.requiredLevel ? levelInfo.level < item.requiredLevel : false;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`relative p-4 rounded-3xl border flex flex-col justify-between gap-3 transition ${
                      isEquipped
                        ? "bg-zinc-900 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/5"
                        : item.isLimited
                          ? "bg-gradient-to-br from-amber-950/30 via-zinc-900 to-zinc-900 border-amber-500/50"
                          : isPremiumItem 
                            ? "bg-gradient-to-br from-zinc-900 via-zinc-900 to-[#D4AF37]/10 border-[#D4AF37]/40" 
                            : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    {/* Item Image / SVG Visual */}
                    <div className="space-y-3">
                      <div className="relative aspect-square w-full bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden flex items-center justify-center p-3 group">
                        {item.imageUrl || item.previewImage || item.assetUrl ? (
                          <img
                            src={item.imageUrl || item.previewImage || item.assetUrl}
                            alt={item.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                          />
                        ) : item.svgContent ? (
                          <div 
                            className="w-20 h-20"
                            dangerouslySetInnerHTML={{ __html: item.svgContent }}
                          />
                        ) : (
                          <span className="text-4xl">🎭</span>
                        )}

                        {/* Top Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {item.isLimited && (
                            <span className="px-2 py-0.5 bg-amber-500 text-black text-[8px] font-black uppercase rounded-full flex items-center gap-1 shadow">
                              🔥 Édition Limitée
                            </span>
                          )}
                          {isPremiumItem && (
                            <span className="px-2 py-0.5 bg-[#D4AF37] text-black text-[8px] font-black uppercase rounded-full flex items-center gap-1 shadow">
                              👑 VIP Premium
                            </span>
                          )}
                          {item.rarity && (
                            <span className="px-2 py-0.5 bg-zinc-900/90 text-zinc-300 border border-zinc-700 text-[8px] font-mono font-bold rounded-full">
                              {item.rarity}
                            </span>
                          )}
                        </div>

                        {/* Status badge right */}
                        <div className="absolute top-2 right-2">
                          {isEquipped ? (
                            <span className="px-2 py-0.5 bg-emerald-500 text-black font-black text-[8px] uppercase rounded-full shadow">
                              ✓ Équipé
                            </span>
                          ) : isOwned ? (
                            <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold text-[8px] uppercase rounded-full">
                              Possédé
                            </span>
                          ) : isLevelLocked ? (
                            <span className="px-2 py-0.5 bg-rose-500/80 text-white font-mono font-bold text-[8px] uppercase rounded-full">
                              Niveau {item.requiredLevel} requis
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold text-[#D4AF37] uppercase">
                            {item.category}
                          </span>
                          <span className="text-xs font-mono font-black text-[#D4AF37] flex items-center gap-1">
                            <Coins className="w-3 h-3 text-[#D4AF37]" />
                            {item.price.toLocaleString("fr-FR")} C
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-white uppercase tracking-tight mt-0.5 line-clamp-1">
                          {item.name}
                        </h4>
                        {item.description && (
                          <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 font-sans">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                      {isOwned ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleEquip(item)}
                            disabled={equipping === item.id}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 ${
                              isEquipped
                                ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700"
                                : "bg-[#D4AF37] text-black hover:bg-white shadow"
                            }`}
                          >
                            {equipping === item.id ? (
                              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : isEquipped ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                Retirer
                              </>
                            ) : (
                              <>
                                <Shirt className="w-3.5 h-3.5" />
                                Équiper
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => setGiftingItem(item)}
                            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[#D4AF37] rounded-xl transition cursor-pointer"
                            title="Offrir cet article à un ami"
                          >
                            <Gift className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePurchase(item)}
                            disabled={purchasing === item.id || (!isAffordable && !isOwned) || isLevelLocked}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 ${
                              purchasing === item.id
                                ? "bg-zinc-800 text-zinc-400"
                                : !isAffordable || isLevelLocked
                                  ? "bg-zinc-800/60 text-zinc-500 border border-zinc-800 cursor-not-allowed"
                                  : "bg-[#D4AF37] text-black hover:bg-white shadow"
                            }`}
                          >
                            {purchasing === item.id ? (
                              <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <ShoppingBag className="w-3.5 h-3.5" />
                                Acheter ({item.price} Coins)
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => setGiftingItem(item)}
                            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[#D4AF37] rounded-xl transition cursor-pointer"
                            title="Offrir en cadeau à un ami"
                          >
                            <Gift className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sub-modals */}
      {showDailyModal && (
        <DailyRewardModal 
          onClose={() => setShowDailyModal(false)} 
        />
      )}

      {showCoinModal && (
        <CoinPurchaseModal 
          onClose={() => setShowCoinModal(false)} 
        />
      )}

      {giftingItem && (
        <AvatarGiftingModal 
          item={giftingItem} 
          onClose={() => setGiftingItem(null)} 
        />
      )}
    </div>
  );
}
