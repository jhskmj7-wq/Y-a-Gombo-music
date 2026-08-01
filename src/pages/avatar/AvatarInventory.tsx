import React from 'react';
import { Shield, Sparkles, Check } from 'lucide-react';
import { useAvatarRealtime } from '../../hooks/useAvatarRealtime';
import { avatarService } from '../../services/avatar.service';
import { PageContainer } from '../../components/common/PageContainer';
import { ScrollContainer } from '../../components/common/ScrollContainer';
import { AndroidTopBar, AndroidButton, AndroidCard } from '../../components/common/AndroidComponents';

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
      <AndroidTopBar
        title="Mon Inventaire Avatar"
        subtitle="AFRIGOMBO Android First"
        onBack={onBack}
      />

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
                <AndroidCard 
                  key={item.id} 
                  variant={isEquipped ? 'elevated' : 'outlined'}
                  className={`flex flex-col justify-between space-y-3 w-full box-border ${
                    isEquipped ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/50' : ''
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

                  <AndroidButton
                    size="sm"
                    variant={isEquipped ? 'outlined' : 'filled'}
                    onClick={() => handleEquip(item)}
                    fullWidth
                    id={`avatar-inventory-btn-equip-${item.id}`}
                  >
                    {isEquipped ? 'Déséquiper' : 'Équiper'}
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

export default AvatarInventory;

