import React from 'react';
import { AvatarCard } from './AvatarCard';
import { AvatarItem } from '../../types/avatar.types';

interface AvatarGridProps {
  items: AvatarItem[];
  ownedItems?: string[];
  equippedItems?: string[];
  onItemAction: (item: AvatarItem) => void;
}

export const AvatarGrid: React.FC<AvatarGridProps> = ({ items, ownedItems = [], equippedItems = [], onItemAction }) => {
  return (
    <div className="grid grid-cols-2 gap-3.5 w-full max-w-full box-border">
      {items.map(item => {
        const isOwned = ownedItems.includes(item.id);
        const isEquipped = equippedItems.includes(item.id);
        return (
          <AvatarCard 
            key={item.id}
            item={item}
            isOwned={isOwned}
            isEquipped={isEquipped}
            onAction={() => onItemAction(item)}
          />
        );
      })}
    </div>
  );
};

export default AvatarGrid;
