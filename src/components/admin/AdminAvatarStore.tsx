import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Edit, Trash2, Crown } from 'lucide-react';
import { AvatarItemCategory, AvatarItem } from '../../types/avatar';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

export default function AdminAvatarStore() {
  const [items, setItems] = useState<AvatarItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "avatarItems"));
    setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as AvatarItem)));
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreateDummy = async () => {
    const newItem = {
      name: "Chemise Pagne " + Math.floor(Math.random() * 1000),
      category: "vêtements" as AvatarItemCategory,
      price: 500,
      isPremiumOnly: false,
      svgContent: '<path d="M40 200 Q100 130 160 200 Z" fill="#D22B2B" />',
      zIndex: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };
    await addDoc(collection(db, "avatarItems"), newItem);
    fetchItems();
  };

  const handleTogglePremium = async (item: AvatarItem) => {
    await updateDoc(doc(db, "avatarItems", item.id), { isPremiumOnly: !item.isPremiumOnly });
    fetchItems();
  };
  
  const handleToggleActive = async (item: AvatarItem) => {
    await updateDoc(doc(db, "avatarItems", item.id), { isActive: !item.isActive });
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    if(confirm("Supprimer cet article ?")) {
      await deleteDoc(doc(db, "avatarItems", id));
      fetchItems();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-afri-bg-sec p-6 rounded-2xl border border-afri-gold/20 shadow-lg">
        <div>
          <h2 className="text-xl font-black text-afri-text uppercase tracking-tight flex items-center gap-2">
            <Crown className="w-5 h-5 text-afri-gold" /> Gestionnaire Avatar Store
          </h2>
          <p className="text-xs text-afri-text-sec mt-1">Créez et gérez les articles, prix et collections de la boutique Avatar.</p>
        </div>
        <button onClick={handleCreateDummy} className="px-4 py-2 bg-afri-gold text-black text-xs font-black uppercase rounded-lg shadow-md flex items-center gap-1 hover:bg-amber-400">
          <Plus className="w-4 h-4" /> Créer Article
        </button>
      </div>

      <div className="bg-afri-bg rounded-2xl border border-afri-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-afri-text">
            <thead className="bg-afri-bg-sec border-b border-afri-border text-xs uppercase font-black text-afri-text-sec">
              <tr>
                <th className="px-4 py-3">Aperçu</th>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Prix</th>
                <th className="px-4 py-3">Premium</th>
                <th className="px-4 py-3">Actif</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-afri-border">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8">Chargement...</td></tr>
              ) : items.map(item => (
                <tr key={item.id} className="hover:bg-afri-bg-ter transition-colors">
                  <td className="px-4 py-2">
                    <div className="w-10 h-10 bg-afri-bg-sec rounded border border-afri-border flex items-center justify-center">
                      {item.svgContent ? (
                        <svg viewBox="0 0 100 100" className="w-8 h-8">
                          <g dangerouslySetInnerHTML={{ __html: item.svgContent }} />
                        </svg>
                      ) : (
                        <span className="text-xl opacity-50">?</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 font-bold">{item.name}</td>
                  <td className="px-4 py-2 uppercase text-[10px] tracking-wider">{item.category}</td>
                  <td className="px-4 py-2 font-mono text-afri-gold font-bold">{item.price} F</td>
                  <td className="px-4 py-2">
                    <button onClick={() => handleTogglePremium(item)} className={`px-2 py-1 text-[10px] font-black uppercase rounded ${item.isPremiumOnly ? 'bg-amber-500/20 text-amber-500' : 'bg-gray-500/20 text-gray-400'}`}>
                      {item.isPremiumOnly ? 'Oui' : 'Non'}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <button onClick={() => handleToggleActive(item)} className={`px-2 py-1 text-[10px] font-black uppercase rounded ${item.isActive ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                      {item.isActive ? 'Actif' : 'Caché'}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}