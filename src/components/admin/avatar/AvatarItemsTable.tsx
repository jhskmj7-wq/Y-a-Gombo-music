import React from 'react';
import { Edit2, Archive, Trash2, CheckCircle, EyeOff, Sparkles } from 'lucide-react';
import { AvatarItem } from '../../../types/avatar.types';
import { avatarService } from '../../../services/avatar.service';

interface AvatarItemsTableProps {
  items: AvatarItem[];
  onEdit: (item: AvatarItem) => void;
  onRefresh: () => void;
}

export const AvatarItemsTable: React.FC<AvatarItemsTableProps> = ({ items, onEdit }) => {
  const handleToggleArchive = async (item: AvatarItem) => {
    await avatarService.archiveAvatarItem(item.id, item.isActive);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cet article avatar ?')) {
      await avatarService.deleteAvatarItem(id);
    }
  };

  return (
    <div className="w-full overflow-x-auto scrollbar-none rounded-2xl border border-afri-border bg-afri-bg">
      <div className="overflow-x-auto w-full"><table className="w-full text-left text-xs text-afri-text-sec min-w-[600px]">
        <thead className="bg-afri-bg-sec text-afri-text-sec font-mono uppercase text-[10px] border-b border-afri-border">
          <tr>
            <th className="p-3">Article</th>
            <th className="p-3">Catégorie</th>
            <th className="p-3">Prix</th>
            <th className="p-3">Rareté</th>
            <th className="p-3">Statut</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-afri-border">
          {items.map(item => (
            <tr key={item.id} className="hover:bg-zinc-900/50 transition-colors">
              <td className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-afri-bg-sec border border-afri-border overflow-hidden shrink-0 flex items-center justify-center">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-white">{item.name}</div>
                  <div className="text-[10px] text-afri-text-muted truncate max-w-[200px]">{item.description}</div>
                </div>
              </td>
              <td className="p-3 font-mono text-afri-text-sec capitalize">{item.category}</td>
              <td className="p-3 font-mono font-bold text-amber-400">{item.price} 🪙</td>
              <td className="p-3 font-mono">
                <span className="px-2 py-0.5 bg-afri-bg-sec border border-afri-border text-[#D4AF37] rounded-md text-[10px]">
                  {item.rarity || 'Commun'}
                </span>
              </td>
              <td className="p-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  item.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}>
                  {item.isActive ? 'Actif' : 'Archivé'}
                </span>
              </td>
              <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                <button 
                  onClick={() => onEdit(item)}
                  className="p-2 rounded-lg bg-afri-bg-sec hover:bg-afri-bg-ter text-amber-400 min-h-[36px] min-w-[36px] inline-flex items-center justify-center"
                  title="Modifier"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => handleToggleArchive(item)}
                  className="p-2 rounded-lg bg-afri-bg-sec hover:bg-afri-bg-ter text-afri-text-sec min-h-[36px] min-w-[36px] inline-flex items-center justify-center"
                  title={item.isActive ? "Archiver" : "Activer"}
                >
                  {item.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-lg bg-afri-bg-sec hover:bg-afri-bg-ter text-red-400 min-h-[36px] min-w-[36px] inline-flex items-center justify-center"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  );
};

export default AvatarItemsTable;
