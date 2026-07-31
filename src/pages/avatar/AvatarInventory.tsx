import React from 'react';
import { ArrowLeft, Shield, Sparkles, Check } from 'lucide-react';
import { useAvatarRealtime } from '../../hooks/useAvatarRealtime';
import { avatarService } from '../../services/avatar.service';
import { PageContainer } from '../../components/common/PageContainer';
import { ScrollContainer } from '../../components/common/ScrollContainer';

interface AvatarInventoryProps {
  currentUser: any;
  onBack: () => void;
}

export const AvatarInventory: React.FC<AvatarInventoryProps> = ({ currentUser, onBack }) => {
  const { items, inventory, loading } = useAvatarRealtime(currentUser?.uid);

  const ownedItems = items.filter(item => inventory?.ownedItems?.includes(item.id));
  const equippedItems = inventory?.equippedItems || [];

  const handleEquip = async (item: any) => {
    if (!currentUser) return;
    await avatarService.equipAvatar(currentUser.uid, item.id, item.category);
  };

  return (
    <PageContainer className="p-0 bg-afri-bg text-afri-text" id="avatar-inventory-page-root">
      {/* Fixed Android Top Header */}
      <header className="sticky top-0 z-40 bg-afri-bg/95 backdrop-blur-md border-b border-afri-border px-4 py-3.5 flex items-center justify-between w-full max-w-full box-border" id="avatar-inventory-header">
        <button 
          onClick={onBack}
          className="p-2.5 rounded-full bg-afri-bg-sec border border-afri-border text-afri-text min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 transition-transform"
          id="avatar-inventory-btn-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold font-mono tracking-wider text-[#D4AF37] truncate px-2">Mon Inventaire Avatar</h1>
        <div className="w-9 h-9" />
      </header>

      {/* Main Container */}
      <ScrollContainer className="flex-1 p-4 space-y-4" id="avatar-inventory-scroll-container">
        {loading ? (
          <div className="py-20 text-center text-amber-400 font-mono text-xs animate-pulse" id="avatar-inventory-loading">
            Chargement de l'inventaire...
          </div>
        ) : ownedItems.length === 0 ? (
          <div className="py-20 text-center text-afri-text-muted font-mono text-xs space-y-3" id="avatar-inventory-empty">
            <Shield className="w-12 h-12 mx-auto opacity-30 text-[#D4AF37]" />
            <p>Votre inventaire est vide. Visitez la boutique pour acquérir des articles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 w-full max-w-full box-border" id="avatar-inventory-items-grid">
            {ownedItems.map((item) => {
              const isEquipped = equippedItems.includes(item.id);
              return (
                <div 
                  key={item.id} 
                  className={`bg-afri-bg-sec border rounded-2xl p-3 flex flex-col justify-between space-y-3 w-full max-w-full box-border shadow-md ${
                    isEquipped ? 'border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'border-afri-border/80'
                  }`}
                  id={`avatar-inventory-card-${item.id}`}
                >
                  <div className="relative h-32 rounded-xl bg-afri-bg flex items-center justify-center overflow-hidden border border-afri-border">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Sparkles className="w-8 h-8 text-[#D4AF37]/50" />
                    )}
                    {isEquipped && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#D4AF37] text-black rounded-md text-[9px] font-mono font-bold uppercase flex items-center gap-1 shadow-lg">
                        <Check className="w-3 h-3" /> Équipé
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-afri-text truncate">{item.name}</h3>
                    <p className="text-[10px] text-afri-text-sec line-clamp-1">{item.category}</p>
                  </div>

                  <button
                    onClick={() => handleEquip(item)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold min-h-[40px] flex items-center justify-center gap-2 transition-all ${
                      isEquipped 
                        ? 'bg-afri-bg-ter border border-afri-border text-afri-text-sec' 
                        : 'bg-[#D4AF37] text-black hover:bg-amber-400 active:scale-95 shadow-lg'
                    }`}
                    id={`avatar-inventory-btn-equip-${item.id}`}
                  >
                    {isEquipped ? 'Déséquiper' : 'Équiper'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </ScrollContainer>
    </PageContainer>
  );
};

export default AvatarInventory;

