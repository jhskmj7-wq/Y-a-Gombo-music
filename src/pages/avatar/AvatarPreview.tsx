import React from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useAvatarRealtime } from '../../hooks/useAvatarRealtime';
import { PageContainer } from '../../components/common/PageContainer';
import { ScrollContainer } from '../../components/common/ScrollContainer';

interface AvatarPreviewProps {
  currentUser: any;
  currentUserProfile: any;
  onBack: () => void;
}

export const AvatarPreview: React.FC<AvatarPreviewProps> = ({ currentUser, currentUserProfile, onBack }) => {
  const { items, inventory } = useAvatarRealtime(currentUser?.uid);

  const equippedItemsList = items.filter(i => inventory?.equippedItems?.includes(i.id));
  const avatarImage = currentUserProfile?.avatarImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300";

  return (
    <PageContainer className="p-0 bg-black text-white" id="avatar-preview-page-root">
      {/* Fixed Android Top Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 px-4 py-3.5 flex items-center justify-between w-full max-w-full box-border" id="avatar-preview-header">
        <button 
          onClick={onBack}
          className="p-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-white min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 transition-transform"
          id="avatar-preview-btn-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold font-mono tracking-wider text-[#D4AF37] truncate px-2">Aperçu en Direct</h1>
        <div className="w-9 h-9" />
      </header>

      {/* Main Container */}
      <ScrollContainer className="flex-1 p-4 space-y-6 flex flex-col items-center" id="avatar-preview-scroll-container">
        
        {/* Avatar Display Card */}
        <div className="w-full max-w-sm bg-zinc-900/90 border border-zinc-800 rounded-[2.5rem] p-6 flex flex-col items-center space-y-5 shadow-2xl relative overflow-hidden" id="avatar-preview-display-card">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative w-48 h-48 rounded-[2rem] overflow-hidden border-4 border-[#D4AF37] bg-zinc-950 shadow-2xl">
            <img src={avatarImage} alt="Avatar Aperçu" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-white">{currentUserProfile?.displayName || "Mon Avatar"}</h2>
            <p className="text-xs font-mono text-[#D4AF37] uppercase tracking-wider">Écosystème Android First</p>
          </div>

          <div className="w-full space-y-2 pt-2 border-t border-zinc-800">
            <p className="text-[11px] font-mono font-bold text-zinc-400 uppercase">Équipements actifs ({equippedItemsList.length})</p>
            {equippedItemsList.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">Aucun équipement actif pour le moment.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {equippedItemsList.map(item => (
                  <span key={item.id} className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-xl flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> {item.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

      </ScrollContainer>
    </PageContainer>
  );
};

export default AvatarPreview;
