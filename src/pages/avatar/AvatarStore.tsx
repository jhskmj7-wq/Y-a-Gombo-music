import React, { useState } from 'react';
import { ShoppingBag, Sparkles, Search } from 'lucide-react';
import { useAvatarRealtime } from '../../hooks/useAvatarRealtime';
import { avatarService } from '../../services/avatar.service';
import { PageContainer } from '../../components/common/PageContainer';
import { ScrollContainer } from '../../components/common/ScrollContainer';
import { AndroidTopBar, AndroidChip, AndroidCard, AndroidButton, AndroidInput } from '../../components/common/AndroidComponents';

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
      <AndroidTopBar
        title="Boutique Avatar"
        subtitle="AFRIGOMBO ELITE Android First"
        onBack={onBack}
        actions={
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full" id="avatar-store-wallet-coins">
            <span className="text-xs font-mono font-bold text-amber-400">{currentUserProfile?.wallet?.coins || 0} 🪙</span>
          </div>
        }
      />

      {/* Main Container */}
      <ScrollContainer className="flex-1 p-4 space-y-5" id="avatar-store-scroll-container">
        
        {/* Search & Categories */}
        <div className="space-y-3" id="avatar-store-controls">
          <AndroidInput
            icon={Search}
            placeholder="Rechercher un article..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="avatar-store-search-input"
          />

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 w-full max-w-full touch-pan-x" id="avatar-store-categories-list">
            {categories.map((cat) => (
              <AndroidChip
                key={cat}
                label={cat}
                selected={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
              />
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
                <AndroidCard 
                  key={item.id} 
                  variant="outlined"
                  className="flex flex-col justify-between space-y-3 w-full box-border shadow-md"
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
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-afri-text-sec line-clamp-1">{item.category}</p>
                      <span className="text-xs font-mono font-bold text-amber-400">{item.price} 🪙</span>
                    </div>
                  </div>

                  <AndroidButton
                    size="sm"
                    variant={isOwned ? 'tonal' : 'filled'}
                    onClick={() => handleBuy(item)}
                    isLoading={purchasingId === item.id}
                    disabled={isOwned}
                    fullWidth
                    id={`avatar-store-btn-buy-${item.id}`}
                  >
                    {isOwned ? 'Possédé' : 'Acheter'}
                  </AndroidButton>
                </AndroidCard>
              );
            })}
          </div>
        )}
      </ScrollContainer>
    </PageContainer>
  );
};

export default AvatarStore;

