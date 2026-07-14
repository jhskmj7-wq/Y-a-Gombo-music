import React, { useState, useEffect } from "react";
import { Users, Coins, Trophy, Flame, Shield, ArrowUpRight, Trash2 } from "lucide-react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";

export default function AfrigomboBuildersAdminDashboard() {
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalCount: 0,
    uniqueBuilders: 0,
    monthlySubscribers: 0,
    badgesDistributed: {} as Record<string, number>,
    topContributors: [] as any[]
  });
  const [challenges, setChallenges] = useState<any[]>([]);
  const [newChallenge, setNewChallenge] = useState({ title: "", target: 0 });

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChallenge.title || !newChallenge.target) return;
    try {
      const id = Date.now().toString();
      await setDoc(doc(db, "builder_challenges", id), {
        title: newChallenge.title,
        target: newChallenge.target,
        current: 0,
        createdAt: Date.now()
      });
      setNewChallenge({ title: "", target: 0 });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCloseChallenge = async (id: string) => {
    try {
      await deleteDoc(doc(db, "builder_challenges", id));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const unsubSupports = onSnapshot(collection(db, "builder_supports"), (snap) => {
      let totalAmount = 0;
      let totalCount = snap.size;
      let monthlySubscribers = 0;
      const userTotals = new Map<string, number>();
      
      snap.forEach(doc => {
        const data = doc.data();
        totalAmount += data.amount || 0;
        if (data.isMonthly) monthlySubscribers++;
        
        const currentU = userTotals.get(data.userId) || 0;
        userTotals.set(data.userId, currentU + (data.amount || 0));
      });

      const uniqueBuilders = userTotals.size;
      const badgesDistributed: Record<string, number> = {
        "👑 Grand Mécène": 0,
        "💎 Gardien du Temple": 0,
        "🥇 Protecteur": 0,
        "🥈 Bâtisseur": 0,
        "🥉 Ami d'AFRIGOMBO": 0
      };

      const getBadgeLabel = (total: number) => {
        if (total >= 100000) return "👑 Grand Mécène";
        if (total >= 50000) return "💎 Gardien du Temple";
        if (total >= 20000) return "🥇 Protecteur";
        if (total >= 5000) return "🥈 Bâtisseur";
        if (total >= 1000) return "🥉 Ami d'AFRIGOMBO";
        return "Sympathisant";
      };

      userTotals.forEach((total) => {
        const badge = getBadgeLabel(total);
        if (badgesDistributed[badge] !== undefined) {
          badgesDistributed[badge]++;
        }
      });

      const topContributors = Array.from(userTotals.entries())
        .map(([userId, amount]) => ({ userId, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      setStats({
        totalAmount,
        totalCount,
        uniqueBuilders,
        monthlySubscribers,
        badgesDistributed,
        topContributors
      });
    });

    const unsubChallenges = onSnapshot(collection(db, "builder_challenges"), (snap) => {
      const list: any[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setChallenges(list);
    });

    return () => {
      unsubSupports();
      unsubChallenges();
    };
  }, []);

  return (
    <div className="space-y-6 text-left pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#D4AF37] rounded-full animate-pulse" />
            <span className="text-[10px] font-mono text-[#D4AF37] tracking-widest font-black uppercase">
              CONSOLE DES BÂTISSEURS
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight font-sans">
            Mécénat & Communauté
          </h2>
          <p className="text-[10px] text-zinc-500 font-mono">
            Suivi en temps réel du programme de soutien communautaire d'AFRIGOMBO.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#D4AF37]/5 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-black">Fonds Récoltés</span>
            <Coins className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <span className="text-2xl font-black text-[#D4AF37] font-mono">{stats.totalAmount.toLocaleString()} <span className="text-xs text-zinc-500 font-sans">FCFA</span></span>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-black">Bâtisseurs Uniques</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-2xl font-black text-white font-mono">{stats.uniqueBuilders}</span>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-black">Soutiens Mensuels</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-white font-mono">{stats.monthlySubscribers}</span>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-black">Total Contributions</span>
            <ArrowUpRight className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-white font-mono">{stats.totalCount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6">
          <h3 className="text-xs font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Top Bâtisseurs
          </h3>
          <div className="space-y-4">
            {stats.topContributors.length === 0 ? (
              <p className="text-xs text-zinc-500 font-mono text-center py-6">Aucun contributeur.</p>
            ) : (
              stats.topContributors.map((c, idx) => (
                <div key={c.userId} className="flex items-center justify-between bg-black p-3 rounded-xl border border-zinc-900">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-[#D4AF37]">#{idx + 1}</span>
                    <span className="text-xs font-bold text-zinc-300">{c.userId.substring(0,8)}...</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-white bg-zinc-900 px-2 py-1 rounded-md">{c.amount.toLocaleString()} FCFA</span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <h3 className="text-xs font-black text-white uppercase tracking-wider mb-6 mt-8 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-500" />
            Distribution des Badges
          </h3>
          <div className="space-y-4">
            {Object.entries(stats.badgesDistributed).map(([badge, count]) => (
              <div key={badge} className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300">{badge}</span>
                <span className="text-[10px] font-mono font-black text-white bg-zinc-900 px-3 py-1 rounded-full">{count as number}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 flex flex-col">
          <h3 className="text-xs font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-500" />
            Gestion des Défis
          </h3>
          
          <form onSubmit={handleCreateChallenge} className="mb-6 space-y-3 bg-black p-4 rounded-xl border border-zinc-800">
            <input 
              type="text" 
              placeholder="Titre du défi" 
              value={newChallenge.title}
              onChange={e => setNewChallenge({...newChallenge, title: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none"
              required
            />
            <input 
              type="number" 
              placeholder="Objectif (FCFA)" 
              value={newChallenge.target || ""}
              onChange={e => setNewChallenge({...newChallenge, target: Number(e.target.value)})}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none"
              required
            />
            <button type="submit" className="w-full px-4 py-2 bg-[#D4AF37] text-black text-[10px] font-mono font-black uppercase tracking-wider rounded-lg hover:opacity-90 cursor-pointer">
              Créer / Ajouter le défi
            </button>
          </form>

          {challenges.length === 0 ? (
            <p className="text-xs text-zinc-500 font-mono text-center py-6">Aucun défi configuré.</p>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {challenges.map(c => {
                const p = Math.min(100, Math.round((c.current / c.target) * 100));
                return (
                  <div key={c.id} className="bg-black border border-zinc-800 p-4 rounded-2xl relative group">
                    <button 
                      onClick={() => handleCloseChallenge(c.id)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="flex justify-between items-center mb-2 pr-6">
                      <h4 className="text-sm font-bold text-white">{c.title}</h4>
                      <span className="text-[10px] text-zinc-500 font-mono">{p}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-[#D4AF37]" style={{ width: `${p}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                      <span>{c.current.toLocaleString()} FCFA</span>
                      <span>{c.target.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
