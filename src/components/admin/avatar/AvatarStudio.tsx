import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, Layers, Shield, Edit2, Users, Coins, ShoppingBag, Crown } from 'lucide-react';
import { useAvatarRealtime } from '../../../hooks/useAvatarRealtime';
import { AvatarItemsTable } from './AvatarItemsTable';
import { AvatarItemEditor } from './AvatarItemEditor';
import { AvatarCategories } from './AvatarCategories';
import { AvatarItem } from '../../../types/avatar.types';
import { db } from '../../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export const AvatarStudio: React.FC = () => {
  const { items, loading } = useAvatarRealtime();
  const [activeSubTab, setActiveSubTab] = useState<'articles' | 'categories'>('articles');
  const [editingItem, setEditingItem] = useState<AvatarItem | null | undefined>(null); // null = closed, undefined = new, item = edit

  // Real-time Avatar Ecosystem statistics
  const [studioStats, setStudioStats] = useState({
    totalAvatars: 0,
    totalPurchased: 0,
    totalCoinsSpent: 0,
    premiumAvatarsCount: 0
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "userInventory"), (snap) => {
      let totalCoins = 0;
      let totalOwned = 0;
      let premiumCount = 0;
      snap.forEach(docSnap => {
        const data = docSnap.data();
        totalCoins += data.coinsSpent || 0;
        totalOwned += (data.ownedItems || []).length;
        if (data.premiumItems && data.premiumItems.length > 0) {
          premiumCount++;
        }
      });
      setStudioStats({
        totalAvatars: snap.size,
        totalPurchased: totalOwned,
        totalCoinsSpent: totalCoins,
        premiumAvatarsCount: premiumCount
      });
    }, (err) => {
      console.warn("Error streaming userInventory statistics:", err);
    });
    return () => unsub();
  }, []);

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden p-4 sm:p-6 bg-black text-white font-sans min-h-[100dvh] box-border" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-950 border border-[#D4AF37]/30 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D4AF37]" /> Studio Avatar & Écosystème
          </h2>
          <p className="text-xs text-zinc-400">Moteur de création et gestion en temps réel pour le Super Fondateur.</p>
        </div>
        <button 
          onClick={() => setEditingItem(undefined)}
          className="px-5 py-3 rounded-2xl bg-[#D4AF37] text-black text-xs font-bold hover:bg-amber-400 active:scale-95 transition-all shadow-xl flex items-center gap-2 shrink-0 relative z-10"
        >
          <Plus className="w-4 h-4" /> Nouvel Article
        </button>
      </div>

      {/* Real-time Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex items-center gap-3 shadow-md">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase font-black block">Avatars Créés</span>
            <span className="text-lg font-black text-white font-mono">{studioStats.totalAvatars}</span>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex items-center gap-3 shadow-md">
          <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] rounded-xl">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase font-black block">Objets Achetés</span>
            <span className="text-lg font-black text-[#D4AF37] font-mono">{studioStats.totalPurchased}</span>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex items-center gap-3 shadow-md">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase font-black block">Revenus Générés</span>
            <span className="text-lg font-black text-emerald-400 font-mono">{studioStats.totalCoinsSpent.toLocaleString()} G</span>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex items-center gap-3 shadow-md">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
            <Crown className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase font-black block">Membres Premium</span>
            <span className="text-lg font-black text-purple-400 font-mono">{studioStats.premiumAvatarsCount}</span>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveSubTab('articles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 ${
            activeSubTab === 'articles' ? 'bg-[#D4AF37] text-black shadow-lg' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Articles ({items.length})
        </button>
        <button
          onClick={() => setActiveSubTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 ${
            activeSubTab === 'categories' ? 'bg-[#D4AF37] text-black shadow-lg' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" /> Catégories
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 text-center text-[#D4AF37] font-mono text-xs animate-pulse">
          Chargement du studio avatar en temps réel...
        </div>
      ) : activeSubTab === 'articles' ? (
        <AvatarItemsTable items={items} onEdit={(item) => setEditingItem(item)} onRefresh={() => {}} />
      ) : (
        <AvatarCategories />
      )}

      {/* Modal Editor */}
      {editingItem !== null && (
        <AvatarItemEditor 
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={() => {}}
        />
      )}

    </div>
  );
};

export default AvatarStudio;
