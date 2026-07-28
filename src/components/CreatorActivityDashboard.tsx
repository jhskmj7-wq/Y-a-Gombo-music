import React, { useState, useEffect } from "react";
import { 
  BarChart3, ShoppingCart, GraduationCap, Briefcase, FileText, Wallet, 
  Plus, Eye, Heart, Star, Users, ArrowUpRight, TrendingUp, CheckCircle2, 
  Clock, ShieldCheck, DollarSign, Bell, RefreshCw, Send, ChevronRight, 
  Package, Award, Layers, Sparkles, MessageCircle, ArrowDownLeft, Lock
} from "lucide-react";
import { db } from "../lib/afrigomboAutomation";
import { subscribeUserStats, UserRealtimeStats, DEFAULT_USER_STATS, triggerAutomationAction } from "../lib/afrigomboAutomation";
import { collection, query, where, onSnapshot } from "firebase/firestore";

interface CreatorActivityDashboardProps {
  currentUserProfile?: any;
  onNavigateView?: (view: string, subTab?: string) => void;
  onBack?: () => void;
}

export const CreatorActivityDashboard: React.FC<CreatorActivityDashboardProps> = ({
  currentUserProfile,
  onNavigateView,
  onBack,
}) => {
  const userId = currentUserProfile?.uid || "current_user";
  const [activeTab, setActiveTab] = useState<"overview" | "market" | "academy" | "gombos" | "wallet" | "stats" | "contracts">("overview");

  // Real-time Firestore Stats State
  const [stats, setStats] = useState<UserRealtimeStats>(DEFAULT_USER_STATS);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [withdrawOperator, setWithdrawOperator] = useState("Orange Money");
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState("");

  // Subscribe to real-time user creator stats from Firestore
  useEffect(() => {
    const unsubscribe = subscribeUserStats(userId, (newStats) => {
      setStats(newStats);
    });
    return () => unsubscribe();
  }, [userId]);

  // Force all sub-tabs and scroll containers to reset to top on tab switch
  useEffect(() => {
    window.scrollTo(0, 0);
    const scrollableElements = document.querySelectorAll('.overflow-y-auto, .overflow-auto');
    scrollableElements.forEach(el => {
      (el as HTMLElement).scrollTop = 0;
    });
  }, [activeTab]);

  // Subscribe to real-time user notifications
  useEffect(() => {
    if (!db) return;
    try {
      const q = query(
        collection(db, "user_notifications"),
        where("userId", "==", userId)
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentNotifications(notifs.slice(0, 10));
      });
      return () => unsub();
    } catch (e) {
      console.warn("Notifications subscription error", e);
    }
  }, [userId]);

  const handleWithdrawRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0 || amount > stats.revenus) {
      alert("Montant de retrait invalide ou supérieur à votre solde disponible.");
      return;
    }

    triggerAutomationAction({
      userId,
      userName: currentUserProfile?.displayName || "Créateur AFRIGOMBO",
      type: "withdrawal",
      amount,
      title: `Demande de retrait Mobile Money (${withdrawOperator}) de ${amount.toLocaleString()} FCFA`,
    });

    setWithdrawSuccessMsg(`Demande de retrait de ${amount.toLocaleString()} FCFA enregistrée vers le numéro ${withdrawPhone} (${withdrawOperator}). Traitement en cours.`);
    setWithdrawAmount("");
  };

  return (
    <div className="w-full flex flex-col space-y-6 text-left animate-fadeIn text-afri-text pb-32">
      {/* HEADER & CREATOR IDENTIFICATION */}
      <div className="w-full bg-gradient-to-r from-afri-bg-sec via-afri-bg to-afri-bg-sec border border-[#D4AF37]/50 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={currentUserProfile?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                alt={currentUserProfile?.displayName || "Créateur"}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-[#D4AF37] shadow-lg"
              />
              <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-black rounded-full border-2 border-black" title="Profil Vérifié">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black text-afri-text uppercase tracking-tight">
                  {currentUserProfile?.displayName || "Tableau Créateur Unique"}
                </h1>
                <span className="px-2.5 py-0.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-mono font-black text-[10px] sm:text-xs uppercase rounded-md tracking-wider">
                  MON ACTIVITÉ
                </span>
              </div>
              <p className="text-xs text-afri-text-sec mt-1 flex items-center gap-2">
                <span>Centre de pilotage & performance tout-en-un</span>
                <span className="text-[#D4AF37] font-bold">• Gombo ID Certifié</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setIsWithdrawModalOpen(true)}
              className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-black font-black text-xs uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              <Wallet className="w-4 h-4" />
              <span>Retirer ({stats.revenus.toLocaleString()} FCFA)</span>
            </button>

            {onBack && (
              <button
                onClick={onBack}
                className="px-3.5 py-2 bg-afri-bg-ter border border-afri-border text-afri-text-sec hover:text-afri-text font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
              >
                Retour
              </button>
            )}
          </div>
        </div>

        {/* TOP TABS NAVIGATION */}
        <div className="flex overflow-x-auto scrollbar-hide gap-2 pt-5 border-t border-afri-border/50 mt-4 select-none">
          {[
            { id: "overview", label: "Vue d'ensemble", icon: Layers },
            { id: "market", label: "Grand Marché", icon: ShoppingCart },
            { id: "academy", label: "Académie", icon: GraduationCap },
            { id: "gombos", label: "Gombos & Offres", icon: Briefcase },
            { id: "wallet", label: "Wallet & Gains", icon: Wallet },
            { id: "stats", label: "Statistiques Live", icon: BarChart3 },
            { id: "contracts", label: "Contrats", icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? "bg-[#D4AF37] text-black shadow-lg"
                    : "bg-afri-bg border border-afri-border text-afri-text-sec hover:text-afri-text hover:border-afri-border/80"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-black" : "text-[#D4AF37]"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STATS BANNER - REAL-TIME FIRESTORE DATA */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-afri-bg-sec border border-afri-border/80 rounded-2xl p-3.5 space-y-1 shadow-md hover:border-[#D4AF37]/50 transition-all">
          <div className="flex items-center justify-between text-afri-text-sec text-[10px] font-mono uppercase font-bold">
            <span>Revenus Totaux</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-emerald-400">
            {stats.revenus.toLocaleString()} FCFA
          </div>
          <p className="text-[9px] text-afri-text-sec flex items-center gap-1">
            <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
            <span>+12.4% ce mois</span>
          </p>
        </div>

        <div className="bg-afri-bg-sec border border-afri-border/80 rounded-2xl p-3.5 space-y-1 shadow-md hover:border-[#D4AF37]/50 transition-all">
          <div className="flex items-center justify-between text-afri-text-sec text-[10px] font-mono uppercase font-bold">
            <span>Clients & Achats</span>
            <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-afri-text">
            {stats.clientsCount}
          </div>
          <p className="text-[9px] text-afri-text-sec">Acheteurs vérifiés</p>
        </div>

        <div className="bg-afri-bg-sec border border-afri-border/80 rounded-2xl p-3.5 space-y-1 shadow-md hover:border-[#D4AF37]/50 transition-all">
          <div className="flex items-center justify-between text-afri-text-sec text-[10px] font-mono uppercase font-bold">
            <span>Étudiants</span>
            <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-afri-text">
            {stats.etudiantsCount}
          </div>
          <p className="text-[9px] text-afri-text-sec">Formations actives</p>
        </div>

        <div className="bg-afri-bg-sec border border-afri-border/80 rounded-2xl p-3.5 space-y-1 shadow-md hover:border-[#D4AF37]/50 transition-all">
          <div className="flex items-center justify-between text-afri-text-sec text-[10px] font-mono uppercase font-bold">
            <span>Gombos Réalisés</span>
            <Briefcase className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-afri-text">
            {stats.gombosRealises}
          </div>
          <p className="text-[9px] text-afri-text-sec">100% de satisfaction</p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-afri-bg-sec border border-afri-border/80 rounded-2xl p-3.5 space-y-1 shadow-md hover:border-[#D4AF37]/50 transition-all">
          <div className="flex items-center justify-between text-afri-text-sec text-[10px] font-mono uppercase font-bold">
            <span>Note Moyenne</span>
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-amber-400 flex items-center gap-1">
            <span>{stats.noteMoyenne.toFixed(1)}</span>
            <span className="text-xs text-afri-text-sec font-normal">/ 5.0</span>
          </div>
          <p className="text-[9px] text-afri-text-sec">{stats.totalFavoris} favoris</p>
        </div>
      </div>

      {/* QUICK ACTIONS GRID */}
      <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4 space-y-3 shadow-xl">
        <h3 className="text-xs font-black text-afri-text uppercase tracking-wider font-mono flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span>Actions Rapides Créateur</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => onNavigateView ? onNavigateView("user_grand_marche") : setActiveTab("market")}
            className="p-3 bg-afri-bg hover:bg-afri-bg-ter border border-afri-border hover:border-[#D4AF37]/60 rounded-xl text-left transition-all cursor-pointer group space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="p-1.5 bg-[#D4AF37]/15 rounded-lg text-[#D4AF37] group-hover:scale-110 transition-transform">
                <Plus className="w-4 h-4" />
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-afri-text-sec group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs font-bold text-afri-text truncate">Nouveau produit</p>
            <p className="text-[10px] text-afri-text-sec truncate">Grand Marché</p>
          </button>

          <button
            onClick={() => onNavigateView ? onNavigateView("user_academie") : setActiveTab("academy")}
            className="p-3 bg-afri-bg hover:bg-afri-bg-ter border border-afri-border hover:border-[#D4AF37]/60 rounded-xl text-left transition-all cursor-pointer group space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="p-1.5 bg-amber-500/15 rounded-lg text-amber-400 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-4 h-4" />
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-afri-text-sec group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs font-bold text-afri-text truncate">Nouveau cours</p>
            <p className="text-[10px] text-afri-text-sec truncate">Académie</p>
          </button>

          <button
            onClick={() => onNavigateView ? onNavigateView("user_publish") : null}
            className="p-3 bg-afri-bg hover:bg-afri-bg-ter border border-afri-border hover:border-[#D4AF37]/60 rounded-xl text-left transition-all cursor-pointer group space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="p-1.5 bg-blue-500/15 rounded-lg text-blue-400 group-hover:scale-110 transition-transform">
                <Send className="w-4 h-4" />
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-afri-text-sec group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs font-bold text-afri-text truncate">Nouvelle publication</p>
            <p className="text-[10px] text-afri-text-sec truncate">Post & Réels</p>
          </button>

          <button
            onClick={() => setIsWithdrawModalOpen(true)}
            className="p-3 bg-afri-bg hover:bg-afri-bg-ter border border-afri-border hover:border-[#D4AF37]/60 rounded-xl text-left transition-all cursor-pointer group space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="p-1.5 bg-emerald-500/15 rounded-lg text-emerald-400 group-hover:scale-110 transition-transform">
                <Wallet className="w-4 h-4" />
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-afri-text-sec group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs font-bold text-afri-text truncate">Retirer mes revenus</p>
            <p className="text-[10px] text-afri-text-sec truncate">Mobile Money</p>
          </button>
        </div>
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* GRAND MARCHÉ RECAP */}
          <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-afri-border/60 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-sm font-black text-afri-text uppercase">Grand Marché • Résumé</h3>
              </div>
              <button
                onClick={() => onNavigateView ? onNavigateView("user_grand_marche") : setActiveTab("market")}
                className="text-[11px] font-bold text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Accéder au Marché</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-afri-bg rounded-xl border border-afri-border/60">
                <p className="text-[10px] text-afri-text-sec uppercase font-mono">Articles Vendus</p>
                <p className="text-base font-black text-afri-text font-mono mt-0.5">{stats.produitsVendus}</p>
              </div>
              <div className="p-2.5 bg-afri-bg rounded-xl border border-afri-border/60">
                <p className="text-[10px] text-afri-text-sec uppercase font-mono">En Vente</p>
                <p className="text-base font-black text-[#D4AF37] font-mono mt-0.5">5</p>
              </div>
              <div className="p-2.5 bg-afri-bg rounded-xl border border-afri-border/60">
                <p className="text-[10px] text-afri-text-sec uppercase font-mono">Commandes</p>
                <p className="text-base font-black text-emerald-400 font-mono mt-0.5">2 en cours</p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <h4 className="text-[11px] font-bold text-afri-text-sec uppercase font-mono">Dernières Ventes</h4>
              <div className="space-y-2">
                {[
                  { title: "Yamaha MG10XU Table de mixage", price: 145000, buyer: "Kouassi M.", date: "Aujourd'hui" },
                  { title: "Casque Studio Shure SRH840A", price: 85000, buyer: "Mamadou K.", date: "Hier" },
                ].map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-afri-bg border border-afri-border/60 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-afri-text">{item.title}</p>
                      <p className="text-[10px] text-afri-text-sec font-mono">Acheteur : {item.buyer} • {item.date}</p>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">{item.price.toLocaleString()} FCFA</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ACADÉMIE RECAP */}
          <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-afri-border/60 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black text-afri-text uppercase">Académie • Espace Formateur</h3>
              </div>
              <button
                onClick={() => onNavigateView ? onNavigateView("user_academie") : setActiveTab("academy")}
                className="text-[11px] font-bold text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Accéder aux Cours</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-afri-bg rounded-xl border border-afri-border/60">
                <p className="text-[10px] text-afri-text-sec uppercase font-mono">Formations</p>
                <p className="text-base font-black text-afri-text font-mono mt-0.5">3 publiées</p>
              </div>
              <div className="p-2.5 bg-afri-bg rounded-xl border border-afri-border/60">
                <p className="text-[10px] text-afri-text-sec uppercase font-mono">Étudiants</p>
                <p className="text-base font-black text-amber-400 font-mono mt-0.5">{stats.etudiantsCount}</p>
              </div>
              <div className="p-2.5 bg-afri-bg rounded-xl border border-afri-border/60">
                <p className="text-[10px] text-afri-text-sec uppercase font-mono">Note Moyenne</p>
                <p className="text-base font-black text-emerald-400 font-mono mt-0.5">4.9 / 5</p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <h4 className="text-[11px] font-bold text-afri-text-sec uppercase font-mono">Formations Enseignées</h4>
              <div className="space-y-2">
                {[
                  { title: "Masterclass Mixage Vocal Afrobeats", price: 25000, students: 18, rating: 5.0 },
                  { title: "Guide Droit d'Auteur BURIDA 2026", price: 15000, students: 10, rating: 4.8 },
                ].map((course, idx) => (
                  <div key={idx} className="p-2.5 bg-afri-bg border border-afri-border/60 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-afri-text">{course.title}</p>
                      <p className="text-[10px] text-afri-text-sec font-mono">{course.students} étudiants • ⭐ {course.rating}</p>
                    </div>
                    <span className="font-mono font-bold text-[#D4AF37]">{course.price.toLocaleString()} FCFA</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: STATS & NOTIFICATIONS */}
      {(activeTab === "stats" || activeTab === "overview") && (
        <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-afri-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="text-sm font-black text-afri-text uppercase">Activité & Notifications Live (Firestore)</h3>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase rounded">
              ● SYNC LIVE
            </span>
          </div>

          <div className="space-y-2">
            {recentNotifications.length === 0 ? (
              <div className="p-4 bg-afri-bg rounded-xl border border-afri-border text-center text-xs text-afri-text-sec">
                Aucune notification récente. Vos transactions et alertes apparaîtront ici automatiquement.
              </div>
            ) : (
              recentNotifications.map((notif) => (
                <div key={notif.id} className="p-3 bg-afri-bg border border-afri-border/60 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-[#D4AF37]/15 rounded-lg text-[#D4AF37]">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="font-bold text-afri-text">{notif.title}</p>
                      <p className="text-[10px] text-afri-text-sec font-mono">
                        {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString() : "À l'instant"}
                      </p>
                    </div>
                  </div>
                  {notif.amount > 0 && (
                    <span className="font-mono font-black text-emerald-400">+{notif.amount.toLocaleString()} FCFA</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* WITHDRAWAL MODAL */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-afri-bg-sec border border-[#D4AF37] rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl text-left">
            <div className="flex justify-between items-center border-b border-afri-border/60 pb-3">
              <h3 className="text-sm font-black text-afri-text uppercase flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <span>Retrait Mobile Money</span>
              </h3>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="text-xs font-bold text-afri-text-sec hover:text-afri-text"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-afri-text-sec leading-relaxed">
              Solde disponible au retrait : <strong className="text-emerald-400 font-mono">{stats.revenus.toLocaleString()} FCFA</strong>
            </p>

            {withdrawSuccessMsg && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs rounded-xl">
                {withdrawSuccessMsg}
              </div>
            )}

            <form onSubmit={handleWithdrawRequest} className="space-y-3">
              <div>
                <label className="text-[10px] font-mono font-bold text-afri-text-sec uppercase block mb-1">
                  Opérateur Mobile Money
                </label>
                <select
                  value={withdrawOperator}
                  onChange={(e) => setWithdrawOperator(e.target.value)}
                  className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="Orange Money">Orange Money</option>
                  <option value="MTN Mobile Money">MTN Mobile Money</option>
                  <option value="Moov Money">Moov Money</option>
                  <option value="Wave">Wave</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-afri-text-sec uppercase block mb-1">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  required
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value)}
                  placeholder="Ex: +225 07 00 00 00 00"
                  className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text focus:border-[#D4AF37] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-afri-text-sec uppercase block mb-1">
                  Montant à retirer (FCFA)
                </label>
                <input
                  type="number"
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={`Max: ${stats.revenus}`}
                  className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text focus:border-[#D4AF37] focus:outline-none font-mono font-bold"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="flex-1 py-2.5 bg-afri-bg border border-afri-border text-afri-text text-xs font-bold uppercase rounded-xl"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase rounded-xl shadow-lg"
                >
                  Confirmer le retrait
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorActivityDashboard;
