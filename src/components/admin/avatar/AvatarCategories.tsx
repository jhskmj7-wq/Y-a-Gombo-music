import React, { useState } from 'react';
import { Plus, Tag, Layers, Check } from 'lucide-react';

export const AvatarCategories: React.FC = () => {
  const [categories, setCategories] = useState([
    { id: 'vêtements', name: 'Vêtements', count: 12, active: true },
    { id: 'chaussures', name: 'Chaussures', count: 8, active: true },
    { id: 'accessoires', name: 'Accessoires', count: 15, active: true },
    { id: 'couronnes', name: 'Couronnes & Coiffes', count: 6, active: true },
    { id: 'instruments', name: 'Instruments de Musique', count: 5, active: true },
    { id: 'coiffures', name: 'Coiffures', count: 9, active: true },
    { id: 'arriere-plans', name: 'Arrière-plans', count: 7, active: true }
  ]);
  const [newCatName, setNewCatName] = useState('');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const id = newCatName.toLowerCase().replace(/\s+/g, '-');
    setCategories(prev => [...prev, { id, name: newCatName, count: 0, active: true }]);
    setNewCatName('');
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-950 border border-zinc-800 p-5 rounded-3xl shadow-lg">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#D4AF37]" /> Gestion des Catégories Avatar
          </h3>
          <p className="text-xs text-zinc-400">Organisez les types d'articles disponibles dans l'écosystème.</p>
        </div>
        <form onSubmit={handleAddCategory} className="flex gap-2 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="Nouvelle catégorie..." 
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37] flex-1 sm:w-64"
          />
          <button type="submit" className="px-4 py-2.5 rounded-xl bg-[#D4AF37] text-black text-xs font-bold hover:bg-amber-400 shrink-0 flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-md">
            <div className="space-y-1">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-[#D4AF37]" /> {cat.name}
              </span>
              <p className="text-[10px] font-mono text-zinc-500">{cat.count} articles enregistrés</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" /> Actif
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvatarCategories;
