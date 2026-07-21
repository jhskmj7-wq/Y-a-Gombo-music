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
    contratsTermines: 0,
    contratsActifs: 0,
    contratsAnnules: 0,
    litigesActifs: 0,
    litigesResolus: 0,
    premiumCount: 0,
    // New Launch Prep stats
    totalUsers: 0,
    secureWaitlistCount: 0,
    totalSupports: 0,
    totalSupportAmount: 0,
    gombosLibresCount: 0,
    betaProgression: 65 // Hardcoded for now or derived
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
        nombreContrats: snap.size,
        contratsTermines: snap.docs.filter(d => d.data().status === "completed").length,
        contratsActifs: snap.docs.filter(d => ["in_progress", "arrived", "payment_held", "signed", "accepted_client", "accepted_artist"].includes(d.data().status)).length,
        contratsAnnules: snap.docs.filter(d => d.data().status === "cancelled").length
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

    // 5. Listen to users & total users
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      let count = 0;
      snap.forEach((doc) => {
        const data = doc.data();
        const isPremium = !!(data.isPremium || data.badges?.includes("💎 Adhérent Premium"));
        if (isPremium) count++;
      });

      setStats((prev) => ({
        ...prev,
        premiumCount: count,
        totalUsers: snap.size
      }));
      setLoading(false);
    });

    // 6. Listen to Secure Waitlist
    const unsubWaitlist = onSnapshot(collection(db, "secure_waitlist"), (snap) => {
      setStats((prev) => ({ ...prev, secureWaitlistCount: snap.size }));
    });

    // 7. Listen to Supports
    const unsubSupports = onSnapshot(collection(db, "afrigombo_supports"), (snap) => {
      let total = 0;
      snap.forEach(d => total += (d.data().amount || 0));
      setStats((prev) => ({ 
        ...prev, 
        totalSupports: snap.size,
        totalSupportAmount: total
      }));
    });

    // 8. Listen to Gombos Libres (from gombos collection where type is 'libre')
    const unsubGombosLibres = onSnapshot(collection(db, "gombos"), (snap) => {
      const libreCount = snap.docs.filter(d => d.data().type === "libre").length;
      setStats((prev) => ({ ...prev, gombosLibresCount: libreCount }));
    });

    return () => {
      unsubEscrow();
      unsubCommissions();
      unsubContracts();
      unsubLitiges();
      unsubUsers();
      unsubWaitlist();
      unsubSupports();
      unsubGombosLibres();
    };
  }, []);

  return (
    <div id="afrigombo-economie-dashboard" className="space-y-6 text-left pb-12">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-afri-bg border border-afri-border rounded-3xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-afri-bg-sec rounded-full animate-pulse" />
            <span className="text-[10px] font-mono text-[#D4AF37] tracking-widest font-black uppercase">
              CONSOLE DE CONTRÔLE SOUVERAIN
            </span>
          </div>
          <h2 className="text-xl font-black text-afri-text tracking-tight font-sans">
            ÉCONOMIE AFRIGOMBO 1.0
          </h2>
          <p className="text-[10px] text-afri-text-sec font-mono">
            Suivi fiduciaire des comptes séquestres et des commissions de l'Empire en temps réel.
          </p>
        </div>

        {onBack && (
          <button 
            onClick={onBack}
            className="px-4 py-2 bg-afri-bg-sec hover:bg-afri-bg-ter border border-afri-border text-afri-text-sec hover:text-afri-text rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all"
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
            
            {/* NEW: Préparation du Lancement Card */}
            <div className="bg-gradient-to-br from-indigo-950/40 to-afri-bg-action border border-indigo-500/30 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-lg group hover:border-indigo-400/50 transition-all">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-wider font-black flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Préparation du Lancement
                  </span>
                  <div className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[8px] font-black text-indigo-300 uppercase">
                    Bêta {stats.betaProgression}%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-afri-text-sec font-mono uppercase block">Inscrits</span>
                    <span className="text-sm font-black text-afri-text font-mono">{stats.totalUsers}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-afri-text-sec font-mono uppercase block">Attente Sécurisé</span>
                    <span className="text-sm font-black text-[#D4AF37] font-mono">{stats.secureWaitlistCount}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-afri-text-sec font-mono uppercase block">Soutiens</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">{stats.totalSupports}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-afri-text-sec font-mono uppercase block">Gombos Libres</span>
                    <span className="text-sm font-black text-indigo-400 font-mono">{stats.gombosLibresCount}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[7px] font-mono text-afri-text-sec uppercase">
                    <span>Progression Bêta</span>
                    <span>{stats.betaProgression}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-afri-bg-ter rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.betaProgression}%` }}
                      className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 1: Argent Bloqué (Séquestre Actif) */}
            <div className="bg-gradient-to-br from-afri-bg-action to-afri-bg-action border border-afri-border rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl"></div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-wider font-black">
                    Argent Bloqué (Séquestre)
                  </span>
                  <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black text-[#D4AF37] font-mono tracking-tight block">
                    {stats.argentBloque.toLocaleString()} <span className="text-xs text-afri-text-sec font-sans font-normal">FCFA</span>
                  </span>
                  <span className="text-[9px] text-afri-text-sec font-mono block mt-1">
                    Garantie d'exécution active en coffre.
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Argent Libéré (Revenus Musiciens) */}
            <div className="bg-gradient-to-br from-afri-bg-action to-afri-bg-action border border-afri-border rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl"></div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-wider font-black">
                    Argent Libéré (Payé)
                  </span>
                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                    <Unlock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black text-afri-text font-mono tracking-tight block">
                    {stats.argentLibere.toLocaleString()} <span className="text-xs text-afri-text-sec font-sans font-normal">FCFA</span>
                  </span>
                  <span className="text-[9px] text-afri-text-sec font-mono block mt-1">
                    Fonds reversés avec succès aux artistes.
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Revenus Plateforme (Commissions Totales) */}
            <div className="bg-gradient-to-br from-afri-bg-action to-afri-bg-action border border-[#D4AF37]/20 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 bg-afri-bg-sec/5 rounded-full blur-2xl"></div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-[#D4AF37] uppercase tracking-wider font-black">
                    Revenus Cumulés
                  </span>
                  <div className="w-7 h-7 rounded-full bg-afri-bg-sec/10 flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/20">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black text-[#D4AF37] font-mono tracking-tight block">
                    {stats.totalCommissions.toLocaleString()} <span className="text-xs text-afri-text-sec font-sans font-normal">FCFA</span>
                  </span>
                  <span className="text-[9px] text-[#D4AF37]/60 font-mono block mt-1">
                    Total des commissions prélevées.
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Commissions Périodiques */}
            <div className="bg-gradient-to-br from-afri-bg-action to-afri-bg-action border border-afri-border rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl"></div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-wider font-black">
                    Revenus du Jour / Mois
                  </span>
                  <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                    <Coins className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-afri-text-sec">Ce jour:</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">+{stats.revenusJour.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-afri-text-sec">Ce mois:</span>
                    <span className="text-xs font-bold text-afri-text font-mono">+{stats.revenusMois.toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Secondary Grid: Users, Contracts & Disputes counts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Metric A: Premium Roster */}
            <div className="bg-afri-bg border border-afri-border rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-wider block">Adhérents Premium</span>
                <span className="text-lg font-black text-afri-text font-mono">{stats.premiumCount} utilisateurs</span>
                <span className="text-[8px] font-mono text-afri-text-sec block">Commissions réduites à 4% + 4%</span>
              </div>
            </div>

            {/* Metric B: Gombos / Contrats */}
            <div className="bg-afri-bg border border-afri-border rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-wider block">Contrats Générés</span>
                <span className="text-lg font-black text-afri-text font-mono">{stats.nombreContrats} contrats</span>
                <span className="text-[8px] font-mono text-afri-text-sec block">Suivi automatique du BURIDA</span>
              </div>
            </div>

            
            
            {/* Metric: Santé de la Plateforme */}
            <div className="bg-afri-bg border border-afri-border rounded-2xl p-6 flex flex-col gap-4 col-span-1 md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-500">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-mono text-blue-500 uppercase tracking-wider block">SANTÉ DE LA PLATEFORME</span>
                  <span className="text-lg font-black text-afri-text font-mono">{(stats.argentBloque + stats.argentLibere).toLocaleString()} FCFA sécurisés</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-afri-bg border border-afri-border p-2 rounded-lg text-center">
                  <span className="block text-xs font-black text-emerald-500">{stats.contratsActifs}</span>
                  <span className="block text-[8px] uppercase font-mono text-afri-text-sec">Actifs</span>
                </div>
                <div className="bg-afri-bg border border-afri-border p-2 rounded-lg text-center">
                  <span className="block text-xs font-black text-[#D4AF37]">{stats.contratsTermines}</span>
                  <span className="block text-[8px] uppercase font-mono text-afri-text-sec">Terminés</span>
                </div>
                <div className="bg-afri-bg border border-afri-border p-2 rounded-lg text-center">
                  <span className="block text-xs font-black text-red-500">{stats.contratsAnnules}</span>
                  <span className="block text-[8px] uppercase font-mono text-afri-text-sec">Annulés</span>
                </div>
                <div className="bg-afri-bg border border-afri-border p-2 rounded-lg text-center">
                  <span className="block text-xs font-black text-blue-400">2.5h</span>
                  <span className="block text-[8px] uppercase font-mono text-afri-text-sec">Validation (Moy.)</span>
                </div>
              </div>
            </div>


            {/* Metric C: Litiges & Disputes */}
            <div className="bg-afri-bg border border-afri-border rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-500">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-wider block">Dossiers de Litige</span>
                <span className="text-lg font-black text-red-500 font-mono">
                  {stats.litigesActifs} actifs <span className="text-afri-text-sec font-sans text-xs font-normal">({stats.litigesResolus} résolus)</span>
                </span>
                <span className="text-[8px] font-mono text-afri-text-sec block">Arbitrage Imperial Command Centre</span>
              </div>
            </div>

          </div>

          {/* Platforms Transactions Ledger and Recent Disputes split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Platform Commissions Ledger */}
            <div className="bg-afri-bg border border-afri-border rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-afri-border pb-3">
                <h3 className="text-xs font-black text-afri-text uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4.5 h-4.5 text-[#D4AF37]" />
                  COMMISSIONS ENCAISSÉES (AFRIGOMBO)
                </h3>
                <span className="text-[9px] font-mono bg-afri-bg-sec text-afri-text-sec px-2 py-0.5 rounded-full">
                  Dernières transactions
                </span>
              </div>

              {recentCommissions.length === 0 ? (
                <div className="text-center py-12 text-afri-text-sec font-mono text-xs">
                  Aucun encaissement de commission enregistré sur la plateforme.
                </div>
              ) : (
                <div className="divide-y divide-zinc-900/50">
                  {recentCommissions.map(comm => (
                    <div key={comm.id} className="py-3 flex justify-between items-center gap-4">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-afri-text uppercase">Contrat {comm.contractId || "AG-XXXX"}</p>
                        <p className="text-[8.5px] font-mono text-afri-text-sec">
                          Encaissé le {comm.createdAt ? new Date(comm.createdAt).toLocaleString("fr-FR") : "Date inconnue"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-black text-[#D4AF37]">
                          +{comm.amount?.toLocaleString()} FCFA
                        </span>
                        <span className="block text-[7.5px] font-mono text-afri-text-sec uppercase">
                          Taux: {comm.rate || "10"}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Platform Disputes & Escrow States */}
            <div className="bg-afri-bg border border-afri-border rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-afri-border pb-3">
                <h3 className="text-xs font-black text-afri-text uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
                  LITIGES & ARBITRAGES
                </h3>
                <span className="text-[9px] font-mono bg-afri-bg-sec text-afri-text-sec px-2 py-0.5 rounded-full">
                  {litigesList.length} dossiers
                </span>
              </div>

              {litigesList.length === 0 ? (
                <div className="text-center py-12 text-afri-text-sec font-mono text-xs">
                  Sérénité absolue. Aucun litige ou désaccord en cours d'examen.
                </div>
              ) : (
                <div className="divide-y divide-zinc-900/50 max-h-[350px] overflow-y-auto">
                  {litigesList.map(lit => (
                    <div key={lit.id} className="py-3 flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-afri-text uppercase">{lit.gomboTitle || "Prestation"}</span>
                          <span className={`text-[7px] font-mono px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                            lit.status === "resolu" 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
                          }`}>
                            {lit.status === "resolu" ? "Résolu" : "Actif / En attente"}
                          </span>
                        </div>
                        <p className="text-[9px] text-afri-text-sec leading-relaxed font-mono">
                          Ouvert par <span className="text-afri-text font-bold">{lit.openedByName}</span>: "{lit.reason}"
                        </p>
                        <p className="text-[8.5px] text-afri-text-sec font-mono">
                          ID Litige: <span className="text-afri-text-sec">{lit.id}</span> | Contrat: <span className="text-afri-text-sec">{lit.contractId}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-black text-afri-text-sec">
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
          <div className="bg-afri-bg border border-[#D4AF37]/30 rounded-3xl p-6 space-y-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
            <div className="flex justify-between items-center border-b border-afri-border pb-3">
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
          <div key={item.key} className="bg-afri-bg-sec border border-afri-border rounded-xl p-4">
            <label className="text-[10px] font-mono uppercase text-afri-text-sec font-bold block mb-1">
              {item.label}
            </label>
            <input 
              type="number"
              value={(config as any)[item.key]}
              onChange={e => handleNumChange(item.key, e.target.value)}
              className="w-full bg-afri-bg border border-afri-border focus:border-[#D4AF37] rounded-lg px-3 py-2 text-afri-text font-mono text-xs focus:outline-none"
            />
            <p className="text-[8px] font-mono text-afri-text-sec mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-end items-center gap-4 pt-2">
        {saved && <span className="text-emerald-500 font-mono text-[10px] uppercase">Sauvegardé avec succès</span>}
        <button 
          type="submit" 
          disabled={saving}
          className="px-6 py-2.5 bg-afri-bg-sec hover:bg-afri-bg-sec text-black text-[10px] font-mono font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] cursor-pointer"
        >
          {saving ? "Sauvegarde..." : "Appliquer la nouvelle économie"}
        </button>
      </div>
    </form>
  );
}