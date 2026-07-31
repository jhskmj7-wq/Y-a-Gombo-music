import React, { useState } from 'react';
import { ArrowLeft, ShoppingBag, Sparkles, Search } from 'lucide-react';
import { useAvatarRealtime } from '../../hooks/useAvatarRealtime';
import { avatarService } from '../../services/avatar.service';
import { PageContainer } from '../../components/common/PageContainer';
import { ScrollContainer } from '../../components/common/ScrollContainer';

interface AvatarStoreProps {
  currentUser: any;
  currentUserProfile: any;
  onBack: () => void;
}

export const AvatarStore: React.FC<AvatarStoreProps> = ({ currentUser, currentUserProfile, onBack }) => {
  const { items, inventory, loading } = useAvatarRealtime(currentUser?.uid);
  const [selectedCategory, setSelectedCategory] = useState<string>('tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const categories = ['tous', 'vêtements', 'chaussures', 'accessoires', 'couronnes', 'instruments', 'coiffures'];

  const filteredItems = items.filter(item => {
    const matchesCat = selectedCategory === 'tous' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch && item.isActive;
  });

  const handleBuy = async (item: any) => {
    if (!currentUser) return;
    setPurchasingId(item.id);
    const userCoins = currentUserProfile?.wallet?.coins || 0;
    const res = await avatarService.buyAvatarItem(currentUser.uid, item, userCoins);
    if (!res.success) {
      alert(res.error || 'Erreur lors de l’achat');
    }
    setPurchasingId(null);
  };

  return (
    <PageContainer className="p-0 bg-afri-bg text-afri-text" id="avatar-store-page-root">
      {/* Fixed Android Top Header */}
      <header className="sticky top-0 z-40 bg-afri-bg/95 backdrop-blur-md border-b border-afri-border px-4 py-3.5 flex items-center justify-between w-full max-w-full box-border" id="avatar-store-header">
        <button 
          onClick={onBack}
          className="p-2.5 rounded-full bg-afri-bg-sec border border-afri-border text-afri-text min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 transition-transform"
          id="avatar-store-btn-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold font-mono tracking-wider text-[#D4AF37] truncate px-2">Boutique Avatar</h1>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full" id="avatar-store-wallet-coins">
          <span className="text-xs font-mono font-bold text-amber-400">{currentUserProfile?.wallet?.coins || 0} 🪙</span>
        </div>
      </header>

      {/* Main Container */}
      <ScrollContainer className="flex-1 p-4 space-y-5" id="avatar-store-scroll-container">
        
        {/* Search & Categories */}
        <div className="space-y-3" id="avatar-store-controls">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-afri-text-sec" />
            <input 
              type="text" 
              placeholder="Rechercher un article..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-afri-bg-sec border border-afri-border rounded-2xl pl-10 pr-4 py-3 text-xs text-afri-text placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37] box-border"
              id="avatar-store-search-input"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 w-full max-w-full touch-pan-x" id="avatar-store-categories-list">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase whitespace-nowrap transition-all min-h-[40px] flex items-center ${
                  selectedCategory === cat 
                    ? 'bg-[#D4AF37] text-black shadow-lg shadow-amber-500/20' 
                    : 'bg-afri-bg-sec text-afri-text-sec border border-afri-border hover:border-afri-border'
                }`}
                id={`avatar-store-category-btn-${cat}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Items Grid Android First */}
        {loading ? (
          <div className="py-20 text-center text-amber-400 font-mono text-xs animate-pulse" id="avatar-store-loading">
            Chargement de la boutique...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center text-afri-text-muted font-mono text-xs space-y-2" id="avatar-store-empty">
            <ShoppingBag className="w-10 h-10 mx-auto opacity-30" />
            <p>Aucun article disponible dans cette catégorie.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 w-full max-w-full box-border" id="avatar-store-items-grid">
            {filteredItems.map((item) => {
              const isOwned = inventory?.ownedItems?.includes(item.id);
              return (
                <div 
                  key={item.id} 
                  className="bg-afri-bg-sec border border-afri-border/80 rounded-2xl p-3 flex flex-col justify-between space-y-3 w-full max-w-full box-border shadow-md"
                  id={`avatar-store-card-${item.id}`}
                >
                  <div className="relative h-32 rounded-xl bg-afri-bg flex items-center justify-center overflow-hidden border border-afri-border">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Sparkles className="w-8 h-8 text-[#D4AF37]/50" />
                    )}
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-afri-bg/80 backdrop-blur-md rounded-md text-[9px] font-mono font-bold text-[#D4AF37] border border-[#D4AF37]/30 uppercase">
                      {item.rarity || 'Commun'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-afri-text truncate">{item.name}</h3>
                    <p className="text-[10px] text-afri-text-sec line-clamp-1">{item.description || 'Article exclusif Afrigombo'}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-afri-border">
                    <span className="text-xs font-mono font-bold text-amber-400">{item.price} 🪙</span>
                    <button
                      disabled={isOwned || purchasingId === item.id}
                      onClick={() => handleBuy(item)}
                      className={`px-3 py-2 rounded-xl text-[11px] font-bold min-h-[38px] flex items-center justify-center transition-all ${
                        isOwned 
                          ? 'bg-afri-bg-ter text-afri-text-muted cursor-not-allowed' 
                          : 'bg-[#D4AF37] text-black hover:bg-amber-400 active:scale-95 shadow-lg'
                      }`}
                      id={`avatar-store-btn-buy-${item.id}`}
                    >
                      {isOwned ? 'Possédé' : purchasingId === item.id ? '...' : 'Acheter'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </ScrollContainer>
    </PageContainer>
  );
};

export default AvatarStore;

