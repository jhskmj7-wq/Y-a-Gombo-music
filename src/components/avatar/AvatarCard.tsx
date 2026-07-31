import React from 'react';
import { Sparkles, Check } from 'lucide-react';
import { AvatarItem } from '../../types/avatar.types';

interface AvatarCardProps {
  item: AvatarItem;
  isOwned?: boolean;
  isEquipped?: boolean;
  onAction?: () => void;
  actionLabel?: string;
}

export const AvatarCard: React.FC<AvatarCardProps> = ({ item, isOwned, isEquipped, onAction, actionLabel }) => {
  return (
    <div className={`bg-zinc-900/90 border rounded-2xl p-3 flex flex-col justify-between space-y-3 w-full max-w-full box-border shadow-md transition-all ${
      isEquipped ? 'border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'border-zinc-800/80'
    }`}>
      <div className="relative h-32 rounded-xl bg-zinc-950 flex items-center justify-center overflow-hidden border border-zinc-800">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <Sparkles className="w-8 h-8 text-[#D4AF37]/50" />
        )}
        <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded-md text-[9px] font-mono font-bold text-[#D4AF37] border border-[#D4AF37]/30 uppercase">
          {item.rarity || 'Commun'}
        </span>
        {isEquipped && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#D4AF37] text-black rounded-md text-[9px] font-mono font-bold uppercase flex items-center gap-1 shadow-lg">
            <Check className="w-3 h-3" /> Équipé
          </span>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-xs font-bold text-white truncate">{item.name}</h3>
        <p className="text-[10px] text-zinc-400 line-clamp-1">{item.description || item.category}</p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
        <span className="text-xs font-mono font-bold text-amber-400">{item.price} 🪙</span>
        {onAction && (
          <button
            onClick={onAction}
            className={`px-3 py-2 rounded-xl text-[11px] font-bold min-h-[38px] flex items-center justify-center transition-all ${
              isOwned && !isEquipped 
                ? 'bg-[#D4AF37] text-black hover:bg-amber-400 active:scale-95 shadow-lg' 
                : isEquipped 
                ? 'bg-zinc-800 border border-zinc-700 text-zinc-300' 
                : 'bg-[#D4AF37] text-black hover:bg-amber-400 active:scale-95 shadow-lg'
            }`}
          >
            {actionLabel || (isEquipped ? 'Déséquiper' : isOwned ? 'Équiper' : 'Acheter')}
          </button>
        )}
      </div>
    </div>
  );
};

export default AvatarCard;
