import React, { useState } from 'react';
import { useAvatarRealtime } from '../../hooks/useAvatarRealtime';
import { AvatarCard } from './AvatarCard';
import { avatarService } from '../../services/avatar.service';
import { Search } from 'lucide-react';

interface AvatarShopProps {
  currentUser: any;
  currentUserProfile: any;
}

export const AvatarShop: React.FC<AvatarShopProps> = ({ currentUser, currentUserProfile }) => {
  const { items, inventory, loading } = useAvatarRealtime(currentUser?.uid);
  const [selectedCategory, setSelectedCategory] = useState<string>('tous');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['tous', 'vêtements', 'chaussures', 'accessoires', 'couronnes', 'instruments', 'coiffures'];

  const filteredItems = items.filter(item => {
    const matchesCat = selectedCategory === 'tous' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch && item.isActive;
  });

  const handleBuy = async (item: any) => {
    if (!currentUser) return;
    const userCoins = currentUserProfile?.wallet?.coins || 0;
    const res = await avatarService.buyAvatarItem(currentUser.uid, item, userCoins);
    if (!res.success) {
      alert(res.error || 'Erreur lors de l’achat');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[#D4AF37] font-mono text-xs">Chargement de la boutique...</div>;
  }

  return (
    <div className="w-full max-w-full space-y-4 overflow-x-hidden box-border">
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input 
          type="text" 
          placeholder="Rechercher..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37] box-border"
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 w-full max-w-full">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase whitespace-nowrap transition-all min-h-[40px] flex items-center ${
              selectedCategory === cat 
                ? 'bg-[#D4AF37] text-black shadow-lg shadow-amber-500/20' 
                : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3.5 w-full max-w-full box-border">
        {filteredItems.map(item => {
          const isOwned = inventory?.ownedItems?.includes(item.id);
          return (
            <AvatarCard 
              key={item.id}
              item={item}
              isOwned={isOwned}
              onAction={() => handleBuy(item)}
              actionLabel={isOwned ? 'Possédé' : 'Acheter'}
            />
          );
        })}
      </div>
    </div>
  );
};

export default AvatarShop;
