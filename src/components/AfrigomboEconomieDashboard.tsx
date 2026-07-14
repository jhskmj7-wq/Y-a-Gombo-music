import React, { useState, useEffect } from "react";
import { 
  Coins, 
  Lock, 
  Unlock, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles, 
  Users, 
  FileText, 
  Clock,
  ArrowUpRight,
  TrendingDown
} from "lucide-react";
import { Sliders } from "lucide-react";
import { motion } from "motion/react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, setDoc, query, limit } from "firebase/firestore";

interface AfrigomboEconomieDashboardProps {
  onBack?: () => void;
}

export default function AfrigomboEconomieDashboard({ onBack }: AfrigomboEconomieDashboardProps) {
  const [stats, setStats] = useState({
    argentBloque: 0,
    argentLibere: 0,
    revenusJour: 0,
    revenusMois: 0,
    totalCommissions: 0,
    nombreContrats: 0,
    litigesActifs: 0,
    litigesResolus: 0,
    premiumCount: 0
  });

  const [escrowList, setEscrowList] = useState<any[]>([]);
  const [recentCommissions, setRecentCommissions] = useState<any[]>([]);
  const [litigesList, setLitigesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener for the entire platform economy
  useEffect(() => {
    const todayStr = new Date().toISOString().substring(0, 10); // YYYY-MM-DD
    const monthStr = new Date().toISOString().substring(0, 7);   // YYYY-MM

    // 1. Listen to escrow
    const unsubEscrow = onSnapshot(collection(db, "escrow"), (snap) => {
      let bloque = 0;
      let libere = 0;
      const list: any[] = [];
      
      snap.forEach((doc) => {
        const data = doc.data();
        list.push({ id: doc.id, ...data });
        if (data.status === "locked" || data.status === "disputed") {
          bloque += (data.totalLocked || 0);
        } else if (data.status === "released") {
          libere += (data.amount - (data.commissionArtist || 0));
        }
      });

      setEscrowList(list);
      setStats((prev) => ({
        ...prev,
        argentBloque: bloque,
        argentLibere: libere
      }));
    });

    // 2. Listen to commissions
    const unsubCommissions = onSnapshot(collection(db, "commissions"), (snap) => {
      let total = 0;
      let jour = 0;
      let mois = 0;
      const list: any[] = [];

      snap.forEach((doc) => {
        const data = doc.data();
        list.push({ id: doc.id, ...data });
        const cAmount = data.amount || 0;
        total += cAmount;

        const dateStr = data.createdAt || "";
        if (dateStr.startsWith(todayStr)) {
          jour += cAmount;
        }
        if (dateStr.startsWith(monthStr)) {
          mois += cAmount;
        }
      });

      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setRecentCommissions(list.slice(0, 10));

      setStats((prev) => ({
        ...prev,
        totalCommissions: total,
        revenusJour: jour,
        revenusMois: mois
      }));
    });

    // 3. Listen to contracts
    const unsubContracts = onSnapshot(collection(db, "contracts"), (snap) => {
      setStats((prev) => ({
        ...prev,
        nombreContrats: snap.size
      }));
    });

    // 4. Listen to litiges
    const unsubLitiges = onSnapshot(collection(db, "litiges"), (snap) => {
      let actifs = 0;
      let resolus = 0;
      const list: any[] = [];

      snap.forEach((doc) => {
        const data = doc.data();
        list.push({ id: doc.id, ...data });
        if (data.status === "en_attente" || data.status === "arbitrage") {
          actifs++;
        } else if (data.status === "resolu") {
          resolus++;
        }
      });

      setLitigesList(list);
      setStats((prev) => ({
        ...prev,
        litigesActifs: actifs,
        litigesResolus: resolus
      }));
    });

    // 5. Listen to premium users
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      let count = 0;
      snap.forEach((doc) => {
        const data = doc.data();
        const isPremium = !!(data.isPremium || data.badges?.includes("💎 Adhérent Premium"));
        if (isPremium) count++;
      });

      setStats((prev) => ({
        ...prev,
        premiumCount: count
      }));
      setLoading(false);
    });

    return () => {
      unsubEscrow();
      unsubCommissions();
      unsubContracts();
      unsubLitiges();
      unsubUsers();
    };
  }, []);

  return (
    <div id="afrigombo-economie-dashboard" className="space-y-6 text-left pb-12">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#D4AF37] rounded-full animate-pulse" />
            <span className="text-[10px] font-mono text-[#D4AF37] tracking-widest font-black uppercase">
              CONSOLE DE CONTRÔLE SOUVERAIN
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight font-sans">
            ÉCONOMIE AFRIGOMBO 1.0
          </h2>
          <p className="text-[10px] text-zinc-500 font-mono">
            Suivi fiduciaire des comptes séquestres et des commissions de l'Empire en temps réel.
          </p>
        </div>

        {onBack && (
          <button 
            onClick={onBack}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all"
          >
            Retour au Trône
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#D4AF37] font-mono animate-pulse text-xs">
          CONNEXION AU RÉSEAU DE CONTRÔLE SÉQUESTRE EN COURS...
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Main Grid: Real-time Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Argent Bloqué (Séquestre Actif) */}
            <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl"></div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-black">
                    Argent Bloqué (Séquestre)
                  </span>
                  <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black text-[#D4AF37] font-mono tracking-tight block">
                    {stats.argentBloque.toLocaleString()} <span className="text-xs text-zinc-400 font-sans font-normal">FCFA</span>
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono block mt-1">
                    Garantie d'exécution active en coffre.
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Argent Libéré (Revenus Musiciens) */}
            <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl"></div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-black">
                    Argent Libéré (Payé)
                  </span>
                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                    <Unlock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black text-white font-mono tracking-tight block">
                    {stats.argentLibere.toLocaleString()} <span className="text-xs text-zinc-400 font-sans font-normal">FCFA</span>
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono block mt-1">
                    Fonds reversés avec succès aux artistes.
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Revenus Plateforme (Commissions Totales) */}
            <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 border border-[#D4AF37]/20 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#D4AF37]/5 rounded-full blur-2xl"></div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-[#D4AF37] uppercase tracking-wider font-black">
                    Revenus Cumulés
                  </span>
                  <div className="w-7 h-7 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/20">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black text-[#D4AF37] font-mono tracking-tight block">
                    {stats.totalCommissions.toLocaleString()} <span className="text-xs text-zinc-400 font-sans font-normal">FCFA</span>
                  </span>
                  <span className="text-[9px] text-[#D4AF37]/60 font-mono block mt-1">
                    Total des commissions prélevées.
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Commissions Périodiques */}
            <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl"></div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-black">
                    Revenus du Jour / Mois
                  </span>
                  <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                    <Coins className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-zinc-400">Ce jour:</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">+{stats.revenusJour.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-zinc-400">Ce mois:</span>
                    <span className="text-xs font-bold text-white font-mono">+{stats.revenusMois.toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Secondary Grid: Users, Contracts & Disputes counts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Metric A: Premium Roster */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Adhérents Premium</span>
                <span className="text-lg font-black text-white font-mono">{stats.premiumCount} utilisateurs</span>
                <span className="text-[8px] font-mono text-zinc-600 block">Commissions réduites à 4% + 4%</span>
              </div>
            </div>

            {/* Metric B: Gombos / Contrats */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Contrats Générés</span>
                <span className="text-lg font-black text-white font-mono">{stats.nombreContrats} contrats</span>
                <span className="text-[8px] font-mono text-zinc-600 block">Suivi automatique du BURIDA</span>
              </div>
            </div>

            {/* Metric C: Litiges & Disputes */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-500">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Dossiers de Litige</span>
                <span className="text-lg font-black text-red-500 font-mono">
                  {stats.litigesActifs} actifs <span className="text-zinc-500 font-sans text-xs font-normal">({stats.litigesResolus} résolus)</span>
                </span>
                <span className="text-[8px] font-mono text-zinc-600 block">Arbitrage Imperial Command Centre</span>
              </div>
            </div>

          </div>

          {/* Platforms Transactions Ledger and Recent Disputes split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Platform Commissions Ledger */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4.5 h-4.5 text-[#D4AF37]" />
                  COMMISSIONS ENCAISSÉES (AFRIGOMBO)
                </h3>
                <span className="text-[9px] font-mono bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded-full">
                  Dernières transactions
                </span>
              </div>

              {recentCommissions.length === 0 ? (
                <div className="text-center py-12 text-zinc-600 font-mono text-xs">
                  Aucun encaissement de commission enregistré sur la plateforme.
                </div>
              ) : (
                <div className="divide-y divide-zinc-900/50">
                  {recentCommissions.map(comm => (
                    <div key={comm.id} className="py-3 flex justify-between items-center gap-4">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-white uppercase">Contrat {comm.contractId || "AG-XXXX"}</p>
                        <p className="text-[8.5px] font-mono text-zinc-500">
                          Encaissé le {comm.createdAt ? new Date(comm.createdAt).toLocaleString("fr-FR") : "Date inconnue"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-black text-[#D4AF37]">
                          +{comm.amount?.toLocaleString()} FCFA
                        </span>
                        <span className="block text-[7.5px] font-mono text-zinc-500 uppercase">
                          Taux: {comm.rate || "10"}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Platform Disputes & Escrow States */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
                  LITIGES & ARBITRAGES
                </h3>
                <span className="text-[9px] font-mono bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded-full">
                  {litigesList.length} dossiers
                </span>
              </div>

              {litigesList.length === 0 ? (
                <div className="text-center py-12 text-zinc-600 font-mono text-xs">
                  Sérénité absolue. Aucun litige ou désaccord en cours d'examen.
                </div>
              ) : (
                <div className="divide-y divide-zinc-900/50 max-h-[350px] overflow-y-auto">
                  {litigesList.map(lit => (
                    <div key={lit.id} className="py-3 flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white uppercase">{lit.gomboTitle || "Prestation"}</span>
                          <span className={`text-[7px] font-mono px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                            lit.status === "resolu" 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
                          }`}>
                            {lit.status === "resolu" ? "Résolu" : "Actif / En attente"}
                          </span>
                        </div>
                        <p className="text-[9px] text-zinc-400 leading-relaxed font-mono">
                          Ouvert par <span className="text-white font-bold">{lit.openedByName}</span>: "{lit.reason}"
                        </p>
                        <p className="text-[8.5px] text-zinc-500 font-mono">
                          ID Litige: <span className="text-zinc-400">{lit.id}</span> | Contrat: <span className="text-zinc-400">{lit.contractId}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-black text-zinc-400">
                          {lit.amount?.toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Economy Settings Configuration */}
          <div className="bg-zinc-950 border border-[#D4AF37]/30 rounded-3xl p-6 space-y-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4.5 h-4.5" />
                PARAMÉTRAGE ÉCONOMIQUE DE L'EMPIRE
              </h3>
            </div>
            <AfrigomboEconomyConfig />
          </div>

        </div>
      )}

    </div>
  );
}

function AfrigomboEconomyConfig() {
  const [config, setConfig] = useState({
    commissionBase: 10,
    commissionPremium: 4,
    prixPremium: 5000,
    prixBoost: 1000,
    prixRenfortExpress: 2000,
    montantMinimumGombo: 5000
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "system_settings", "economy"), (snap) => {
      if (snap.exists()) {
        setConfig(snap.data() as any);
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, "system_settings", "economy"), config, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleNumChange = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: parseInt(value) || 0 }));
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { key: "commissionBase", label: "Commission de base (%)", desc: "Taux pour les non-premium" },
          { key: "commissionPremium", label: "Commission Premium (%)", desc: "Taux pour les membres Premium" },
          { key: "prixPremium", label: "Prix Premium (FCFA/mois)", desc: "Abonnement mensuel" },
          { key: "prixBoost", label: "Prix Boost (FCFA)", desc: "Mise en avant d'un contrat" },
          { key: "prixRenfortExpress", label: "Prix Renfort Express (FCFA)", desc: "Alerte SMS/Notification urgente" },
          { key: "montantMinimumGombo", label: "Montant Minimum Gombo (FCFA)", desc: "Valeur plancher d'un contrat" }
        ].map(item => (
          <div key={item.key} className="bg-[#050505] border border-zinc-900 rounded-xl p-4">
            <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold block mb-1">
              {item.label}
            </label>
            <input 
              type="number"
              value={(config as any)[item.key]}
              onChange={e => handleNumChange(item.key, e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none"
            />
            <p className="text-[8px] font-mono text-zinc-600 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-end items-center gap-4 pt-2">
        {saved && <span className="text-emerald-500 font-mono text-[10px] uppercase">Sauvegardé avec succès</span>}
        <button 
          type="submit" 
          disabled={saving}
          className="px-6 py-2.5 bg-[#D4AF37] hover:bg-[#B8860B] text-black text-[10px] font-mono font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] cursor-pointer"
        >
          {saving ? "Sauvegarde..." : "Appliquer la nouvelle économie"}
        </button>
      </div>
    </form>
  );
}