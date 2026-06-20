import React, { useState, useEffect } from "react";
import {
  Home, Users, Wallet, BarChart2, Target, ShieldAlert, Megaphone, Settings, FileText, Wrench, PenTool, Crown, Bell, Globe, Check, TrendingUp, ShieldCheck, UserCheck, CheckCircle, UserPlus, UserMinus, UserX, Lock, AlertTriangle, Mail, Database, RefreshCcw, Shield, Sparkles, Eye, EyeOff, Radio, ArrowUpRight, ArrowDownRight, MoreHorizontal, Flame, Server, FolderOpen, Play
} from "lucide-react";
import { User, Gombo, Transaction, Alerte, GomboReview } from "../types";
import { motion } from "motion/react";
import { audioSynth } from "../lib/audio";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";

interface FounderThroneProps {
  adminEmail: string;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  gombos: Gombo[];
  setGombos: React.Dispatch<React.SetStateAction<Gombo[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  alerts: Alerte[];
  setAlerts: React.Dispatch<React.SetStateAction<Alerte[]>>;
  reviews: GomboReview[];
  setReviews?: React.Dispatch<React.SetStateAction<GomboReview[]>>;
  systemCommissionRate?: number;
  setSystemCommissionRate?: React.Dispatch<React.SetStateAction<number>>;
  addToTerminal: (msg: string) => void;
  onClose: () => void;
  saveToFirestore?: (collection: string, id: string, data: any) => Promise<void>;
  createTransaction?: any;
}

export default function FounderThrone({
  users,
  transactions,
  addToTerminal,
  onClose
}: FounderThroneProps) {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setCurrentDate(now.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }).replace('.', ''));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const chartData = [
    { name: "17 Mai", Utilisateurs: 30000, Publications: 20000, Engagement: 50000, Revenus: 10000 },
    { name: "18 Mai", Utilisateurs: 35000, Publications: 25000, Engagement: 55000, Revenus: 15000 },
    { name: "19 Mai", Utilisateurs: 45000, Publications: 35000, Engagement: 65000, Revenus: 20000 },
    { name: "20 Mai", Utilisateurs: 40000, Publications: 30000, Engagement: 60000, Revenus: 18000 },
    { name: "21 Mai", Utilisateurs: 55000, Publications: 40000, Engagement: 75000, Revenus: 25000 },
    { name: "22 Mai", Utilisateurs: 50000, Publications: 38000, Engagement: 70000, Revenus: 22000 },
    { name: "23 Mai", Utilisateurs: 65000, Publications: 45000, Engagement: 85000, Revenus: 30000 },
  ];

  const supremeActions = [
    { label: "Valider Gombo ID", icon: ShieldCheck },
    { label: "Approuver Utilisateur", icon: UserCheck },
    { label: "Approuver Opportunité", icon: CheckCircle },
    { label: "Ajouter Administrateur", icon: UserPlus },
    { label: "Révoquer Administrateur", icon: UserMinus },
    { label: "Suspendre Utilisateur", icon: UserX },
    { label: "Geler Wallet", icon: Wallet },
    { label: "Mode Crise", icon: AlertTriangle },
    { label: "Messages Globaux", icon: Mail },
    { label: "Notifications Globales", icon: Bell },
    { label: "Logs Système", icon: FileText },
    { label: "Modération Globale", icon: ShieldAlert },
    { label: "Rapports Avancés", icon: BarChart2 },
    { label: "IA AfriGombo", icon: Sparkles },
    { label: "Gestion Firebase", icon: Database },
    { label: "Sauvegardes Système", icon: RefreshCcw },
    { label: "Paramètres Avancés", icon: Settings },
    { label: "Audit Sécurité", icon: Shield },
  ];

  const systemStatus = [
    { label: "Firebase", p: "100%", icon: Flame },
    { label: "Firestore", p: "100%", icon: Database },
    { label: "Authentification", p: "100%", icon: Lock },
    { label: "Storage", p: "100%", icon: FolderOpen },
    { label: "Wallet GAWA", p: "100%", icon: Wallet },
    { label: "Notifications", p: "100%", icon: Bell },
    { label: "Serveurs", p: "100%", icon: Server },
    { label: "Live Streaming", p: "100%", icon: Play },
    { label: "Sécurité", p: "100%", icon: Shield },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, filter: "brightness(0) drop-shadow(0 0 50px rgba(212,175,55,0.8))" }}
      animate={{ opacity: 1, filter: "brightness(1) drop-shadow(0 0 0px rgba(212,175,55,0))" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed inset-0 w-full h-full bg-[#030303] text-zinc-100 flex flex-col overflow-hidden font-sans select-none z-[150]"
    >
      
      <div className="flex-1 flex flex-col xl:flex-row min-h-0 overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden xl:flex flex-col w-20 2xl:w-[280px] bg-black border-r border-[#D4AF37]/20 z-40 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        <div className="p-4 2xl:p-8 flex flex-col items-center justify-center shrink-0">
          <div className="w-12 h-12 2xl:w-20 2xl:h-20 rounded-full border border-[#D4AF37] flex items-center justify-center bg-black mb-2 2xl:mb-4 shadow-[0_0_15px_rgba(212,175,55,0.4)] relative">
             <div className="absolute inset-0 border border-[#D4AF37] rounded-full scale-110 opacity-30"></div>
             <Globe className="w-6 h-6 2xl:w-10 2xl:h-10 text-[#D4AF37]" strokeWidth={1} />
          </div>
          <h1 className="text-[10px] 2xl:text-base font-black font-display text-[#D4AF37] tracking-widest uppercase text-center leading-tight drop-shadow-[0_0_20px_rgba(212,175,55,0.8)]">
            AFRIGOMBO<br/>
            <span className="text-[8px] 2xl:text-xs text-white font-sans tracking-wide">Y'A GOMBO MUSIC</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 2xl:px-6 py-6 space-y-2 overflow-y-auto scrollbar-none">
          {[
            { id: "dashboard", label: "TABLEAU DE BORD", icon: Home },
            { id: "utilisateurs", label: "UTILISATEURS", icon: Users },
            { id: "finances", label: "FINANCES", icon: Wallet },
            { id: "statistiques", label: "STATISTIQUES", icon: BarChart2 },
            { id: "opportunites", label: "OPPORTUNITÉS", icon: Target },
            { id: "communautes", label: "COMMUNAUTÉS", icon: Users },
            { id: "moderation", label: "MODÉRATION", icon: ShieldAlert, badge: true },
            { id: "annonces", label: "ANNONCES GLOBALES", icon: Megaphone },
            { id: "parametres", label: "PARAMÈTRES", icon: Settings },
            { id: "logs", label: "LOGS SYSTÈME", icon: FileText },
            { id: "outils", label: "OUTILS AVANCÉS", icon: Wrench },
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveMenu(item.id); try{ audioSynth.playTamTam(false); }catch(e){} }}
                className={`w-full flex items-center justify-center 2xl:justify-start gap-5 px-4 py-3.5 2xl:py-4 rounded-xl text-[10px] 2xl:text-xs font-black uppercase tracking-widest font-mono transition-all group ${
                  isActive ? "bg-gradient-to-r from-[#D4AF37]/20 to-transparent text-[#D4AF37] border-l-2 border-[#D4AF37]" : "text-zinc-500 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 border-l-2 border-transparent"
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 2xl:w-6 2xl:h-6 shrink-0 ${isActive ? "text-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,175,55,0.8)]" : "text-zinc-500 group-hover:text-[#D4AF37]"}`} strokeWidth={isActive ? 2.5 : 1.5} />
                  {item.badge && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#D4AF37] rounded-full shadow-[0_0_8px_rgba(212,175,55,0.8)] animate-pulse"></span>}
                </div>
                <span className="hidden 2xl:inline truncate drop-shadow-md">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#050505] relative">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-[#D4AF37]/5 blur-[100px] pointer-events-none"></div>

        {/* TOP HEADER */}
        <header className="shrink-0 bg-black/50 border-b border-[#D4AF37]/20 px-4 sm:px-6 2xl:px-10 py-4 sm:py-5 flex justify-between items-center z-30 relative">
          <div className="flex items-center gap-3 sm:gap-6 pr-12">
             <div className="xl:hidden shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-[#D4AF37] flex items-center justify-center bg-black shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                 <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37]" />
             </div>
             <div className="flex flex-col text-left">
               <h2 className="text-sm sm:text-xl 2xl:text-3xl font-black font-display text-[#D4AF37] uppercase tracking-widest drop-shadow-[0_0_15px_rgba(212,175,55,0.5)] leading-tight">
                 PALAIS NUMÉRIQUE SUPRÊME
               </h2>
               <p className="text-[7.5px] sm:text-[10px] 2xl:text-xs text-[#D4AF37] tracking-[0.1em] sm:tracking-[0.3em] mt-1 font-mono uppercase bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] to-amber-200 line-clamp-1">
                 Vision • Influence • Héritage • Gouvernance
               </p>
             </div>
          </div>

          <div className="hidden xl:flex items-center gap-8">
            <div className="hidden lg:flex items-center opacity-80 filter drop-shadow-[0_0_12px_rgba(212,175,55,0.3)]">
              <svg viewBox="0 0 240 260" className="w-16 h-16 2xl:w-20 2xl:h-20">
                 <path d="M100,20 C120,18,150,22,170,35 C185,45,210,60,220,80 C225,90,218,105,212,115 C205,125,208,135,210,145 C212,155,200,165,190,175 C180,185,175,195,170,210 C165,225,155,235,145,245 C135,255,128,260,128,255 C120,245,115,235,110,225 C105,215,110,205,100,195 C92,185,82,175,75,165 C68,155,60,150,50,145 C40,140,25,135,20,125 C15,115,22,110,30,105 C40,95,50,85,55,75 C60,65,70,55,75,45 C80,35,85,25,100,20 Z" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeDasharray="3, 5" className="animate-[spin_60s_linear_infinite]" />
                 <path d="M100,20 C120,18,150,22,170,35 C185,45,210,60,220,80 C225,90,218,105,212,115 C205,125,208,135,210,145 C212,155,200,165,190,175 C180,185,175,195,170,210 C165,225,155,235,145,245 C135,255,128,260,128,255 C120,245,115,235,110,225 C105,215,110,205,100,195 C92,185,82,175,75,165 C68,155,60,150,50,145 C40,140,25,135,20,125 C15,115,22,110,30,105 C40,95,50,85,55,75 C60,65,70,55,75,45 C80,35,85,25,100,20 Z" fill="none" stroke="#D4AF37" strokeWidth="0.5" />
                 <circle cx="165" cy="150" r="4" fill="#D4AF37" className="animate-[ping_3s_infinite]" />
              </svg>
            </div>
            
            <div className="flex gap-6 items-start">
              <div className="relative mt-2">
                <Bell className="w-6 h-6 2xl:w-8 2xl:h-8 text-[#D4AF37]" strokeWidth={1.5} />
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] 2xl:text-[10px] font-black w-4 h-4 2xl:w-5 2xl:h-5 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(220,38,38,0.8)] border border-black z-10">12</span>
              </div>
              
              <div className="hidden md:flex flex-col items-end text-right border-l border-[#D4AF37]/20 pl-6 h-12 justify-between">
                <span className="text-[9px] 2xl:text-[10px] text-zinc-400 font-mono tracking-[0.15em] uppercase">Utilisateurs connectés</span>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse"></span>
                  <span className="text-emerald-400 font-sans text-sm 2xl:text-base font-black tracking-wider">1,248</span>
                </div>
              </div>
              
              <div className="hidden lg:flex flex-col items-end pt-1 bg-black/40 border border-[#D4AF37]/30 px-4 py-2 rounded-lg shadow-[inset_0_0_15px_rgba(212,175,55,0.05)]">
                <span className="text-[#D4AF37] text-lg 2xl:text-xl font-mono font-black tabular-nums tracking-wider">{currentTime}</span>
                <span className="text-zinc-500 text-[9px] 2xl:text-[10px] uppercase tracking-widest leading-none mt-1">{currentDate}</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="absolute right-4 top-4 sm:right-6 sm:top-1/2 sm:-translate-y-1/2 bg-black/50 border border-red-500/50 hover:bg-red-500/10 text-red-500 px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.2)] active:scale-95 z-50"
          >
            <UserX className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:block text-[9px] font-black uppercase tracking-wider">Retour Utilisateur</span>
          </button>
        </header>

        {/* LOCKED MAIN REGION (SCALES DOWN ON SMALLER WINDOWS) */}
        <main className="flex-1 w-full flex bg-transparent p-4 pb-0 items-start justify-center relative overflow-y-auto custom-scrollbar">
          
          <div className="w-full xl:max-w-[1500px] 2xl:max-w-[1800px] mx-auto flex flex-col xl:flex-row gap-5 pb-20">
            
            {/* LEFT COLUMN (WIDER) */}
            <div className="flex flex-col gap-5 w-full xl:w-[60%] 2xl:w-[65%] min-h-0">
               
               {/* TOP ROW OF LEFT COL: PROFILE */}
               <div className="bg-black/80 backdrop-blur-md border border-[#D4AF37]/30 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-8 shadow-[0_8px_40px_rgba(0,0,0,0.8)] relative overflow-hidden border-t-2 border-t-[#D4AF37]/60 shrink-0">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#D4AF37]/10 to-transparent blur-3xl rounded-full pointer-events-none"></div>
                 {/* Avatar */}
                 <div className="relative shrink-0 z-10">
                   <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-[3px] border-[#D4AF37] p-1.5 overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.3)] bg-zinc-950">
                     <img 
                       src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&fit=crop&q=90" 
                       alt="Sylvestre Hounkpevi" 
                       className="w-full h-full object-cover rounded-full filter contrast-125 saturate-150"
                     />
                   </div>
                   <div className="absolute -top-1 -right-1 bg-black rounded-full p-2 border-2 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.8)]">
                     <Crown className="w-5 h-5 text-[#D4AF37]" strokeWidth={3} />
                   </div>
                 </div>

                 {/* Profile Details */}
                 <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left min-w-0 z-10 w-full pt-2">
                   <h2 className="text-2xl sm:text-3xl xl:text-4xl font-sans font-black text-white tracking-tight flex items-center justify-center md:justify-start gap-3 truncate w-full mb-1">
                     Sylvestre Hounkpevi
                     <div className="w-6 h-6 rounded-md bg-[#D4AF37] text-black flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(212,175,55,0.6)]">
                       <Check className="w-4 h-4 stroke-[4]" />
                     </div>
                   </h2>
                   <span className="text-[#D4AF37] font-sans font-black text-sm sm:text-base tracking-[0.25em] mb-2 block uppercase text-shadow-sm">
                     SUPER FONDATEUR
                   </span>
                   <p className="text-white text-xs sm:text-sm mb-3 flex items-center justify-center md:justify-start gap-2 max-w-full">
                     Niveau : <span className="text-[#D4AF37] font-black uppercase tracking-wider drop-shadow-[0_0_5px_rgba(212,175,55,0.8)]">LÉGENDE AFRIGOMBO</span>
                   </p>
                   
                   <div className="flex text-[#D4AF37] mb-4 gap-2 drop-shadow-[0_0_5px_rgba(212,175,55,0.6)]">
                     {Array(7).fill(0).map((_, i) => <Star key={i} filled />)}
                   </div>

                   <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-full h-3 overflow-hidden relative shadow-inner">
                     <div className="bg-gradient-to-r from-amber-700 via-[#D4AF37] to-amber-300 h-full rounded-full w-full relative">
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                     </div>
                   </div>
                   <div className="w-full max-w-lg flex justify-between items-center mt-3 font-mono text-[10px] sm:text-xs font-black text-white">
                      <button className="flex items-center gap-2 text-[#D4AF37] border border-[#D4AF37]/50 hover:bg-[#D4AF37] hover:text-black px-4 py-1.5 rounded-lg transition-all uppercase tracking-widest shadow-[0_0_10px_rgba(212,175,55,0.1)]">
                         Modifier le profil <PenTool className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                      <span className="uppercase tracking-widest">NIVEAU MAX <span className="text-[#D4AF37] ml-2 text-sm">100%</span></span>
                   </div>
                 </div>
               </div>

               {/* GLOBAL STATS GRID */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 shrink-0">
                 {[
                   { label: "UTILISATEURS TOTAUX", val: "1,250,459", trend: "+15.8%", icon: Users },
                   { label: "UTILISATEURS ACTIFS AUJOURD'HUI", val: "245,789", trend: "+18.6%", icon: UserCheck },
                   { label: "PUBLICATIONS TOTALES", val: "3,456,789", trend: "+21.4%", icon: FileText },
                   { label: "LIVES EN COURS", val: "342", trend: "+5.2%", icon: Radio },
                   { label: "SIGNALEMENTS", val: "1,245", trend: "-8.4%", icon: ShieldCheck, trendDown: true },
                   { label: "REVENUS PLATEFORME", val: "185,750,000", trend: "+12.4%", icon: Wallet },
                   { label: "PAYS ACTIFS", val: "46", trend: "+3", icon: Globe },
                   { label: "COMMUNAUTÉS", val: "789", trend: "+11.1%", icon: Users },
                 ].map((stat, i) => {
                   const Icon = stat.icon;
                   return (
                     <div key={i} className="bg-black/60 backdrop-blur-sm border border-[#D4AF37]/20 rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center hover:border-[#D4AF37] hover:bg-black transition-all group shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                       <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#D4AF37]/5 border border-[#D4AF37]/30 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-[#D4AF37]/20 transition-all shadow-inner">
                         <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#D4AF37]" strokeWidth={1.5} />
                       </div>
                       <span className="text-[8px] sm:text-[9px] min-h-[22px] flex items-center justify-center font-mono tracking-widest text-[#D4AF37] uppercase font-black mb-2 opacity-80 leading-tight p-0.5">
                         {stat.label}
                       </span>
                       <strong className="text-lg sm:text-2xl font-sans font-black text-white tracking-tight">{stat.val}</strong>
                       <span className={`text-[10px] sm:text-[11px] font-mono font-bold mt-1.5 flex items-center gap-1 ${stat.trendDown ? "text-red-500" : "text-emerald-500"}`}>
                         {stat.trend} {stat.trendDown ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                       </span>
                     </div>
                   );
                 })}
               </div>

               {/* PLATFORM ACTIVITY CHART AND ACTIONS STACKED */}
               <div className="flex flex-col gap-5 flex-1 min-h-0">
                   
                   {/* PLATFORM ACTIVITY CHART */}
                   <div className="bg-black/60 backdrop-blur-sm border border-[#D4AF37]/30 rounded-2xl p-5 flex flex-col flex-1 min-h-[220px] shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                     <div className="flex justify-between items-start mb-4 shrink-0">
                       <h3 className="text-xs sm:text-sm font-black text-[#D4AF37] uppercase tracking-[0.2em] font-sans">ACTIVITÉ PLATEFORME</h3>
                       <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden shadow-inner">
                         {["7 JOURS", "30 JOURS", "90 JOURS", "1 AN"].map((t, i) => (
                           <button key={i} className={`px-4 py-1.5 text-[9px] font-mono font-black border-r border-zinc-800 last:border-0 uppercase tracking-widest transition-colors ${i === 0 ? "bg-[#D4AF37]/20 text-[#D4AF37] shadow-[inset_0_0_10px_rgba(212,175,55,0.2)]" : "text-zinc-400 hover:text-white hover:bg-zinc-900"}`}>
                             {t}
                           </button>
                         ))}
                       </div>
                     </div>

                     <div className="flex-1 w-full min-h-0 pb-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorU" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.6} />
                                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.05} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} />
                            <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}K`} tickMargin={10} />
                            <Tooltip 
                               contentStyle={{ backgroundColor: "#000", border: "1px solid #D4AF37", borderRadius: "8px", fontSize: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.8)" }} 
                               itemStyle={{ color: "#fff", fontWeight: "bold" }}
                               labelStyle={{ color: "#D4AF37", marginBottom: "4px", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "bold" }}
                            />
                            <Area type="monotone" dataKey="Utilisateurs" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorU)" />
                            <Area type="monotone" dataKey="Publications" stroke="#10b981" strokeWidth={2} fill="none" />
                            <Area type="monotone" dataKey="Engagement" stroke="#0ea5e9" strokeWidth={2} fill="none" />
                            <Area type="monotone" dataKey="Revenus" stroke="#8b5cf6" strokeWidth={2} fill="none" />
                          </AreaChart>
                        </ResponsiveContainer>
                     </div>
                     
                     <div className="flex flex-wrap justify-between gap-4 mt-2 pt-4 border-t border-zinc-900 shrink-0 mx-4">
                        <LegendItem2 color="bg-[#D4AF37]" label="Utilisateurs" />
                        <LegendItem2 color="bg-emerald-500" label="Publications" />
                        <LegendItem2 color="bg-sky-500" label="Engagement" />
                        <LegendItem2 color="bg-violet-500" label="Revenus" />
                     </div>
                   </div>

                   {/* SUPREME ACTIONS */}
                   <div className="w-full bg-black/60 backdrop-blur-sm border border-[#D4AF37]/20 rounded-2xl p-4 shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col justify-center">
                     <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                       {supremeActions.map((act, i) => {
                         const Icon = act.icon;
                         const isDanger = ["Suspendre Utilisateur", "Geler Wallet", "Mode Crise"].includes(act.label);
                         return (
                           <button key={i} className="flex flex-col items-center justify-center text-center p-2 2xl:p-3 rounded-xl hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all group aspect-square xl:aspect-auto h-full">
                              <Icon className={`w-5 h-5 2xl:w-6 2xl:h-6 mb-2 ${isDanger ? "text-red-500/80 group-hover:text-red-500 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "text-[#D4AF37]/80 group-hover:text-[#D4AF37] group-hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]"}`} strokeWidth={1.5} />
                              <span className="text-[9px] font-sans font-bold text-zinc-400 group-hover:text-white leading-tight uppercase tracking-wider block">
                                {act.label.split(' ')[0]}<br />{act.label.split(' ')[1] || ''}
                              </span>
                           </button>
                         );
                       })}
                     </div>
                   </div>
               </div>

               {/* BOTTOM BANNER */}
               <div className="relative rounded-2xl overflow-hidden border border-[#D4AF37]/40 h-28 2xl:h-36 flex items-center shadow-[0_0_40px_rgba(212,175,55,0.15)] group shrink-0 mt-auto">
                 <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10 w-2/3"></div>
                 <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-screen" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1540039155732-6761b54cbaca?w=1200&auto=format&fit=crop&q=80')`}}></div>
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                 
                 <div className="relative z-20 p-6 sm:p-10 pl-10 flex flex-col justify-center h-full max-w-2xl">
                    <h2 className="text-4xl 2xl:text-5xl font-black font-sans text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-amber-200 tracking-tight leading-none mb-2 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
                      AFRIGOMBO
                    </h2>
                    <p className="text-xs 2xl:text-sm font-bold text-white uppercase tracking-[0.2em] opacity-90 leading-tight">
                      LE TERRAIN D'ACTION<br/>DE L'AFRIQUE CRÉATIVE.
                    </p>
                 </div>
                 
                 <div className="absolute right-10 bottom-0 z-20 w-24 h-24 2xl:w-32 2xl:h-32 opacity-70 filter drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1" className="w-full h-full">
                       <path d="M9 18V5l12-2v13" />
                       <circle cx="6" cy="18" r="3" />
                       <circle cx="18" cy="16" r="3" />
                    </svg>
                 </div>
               </div>

            </div>

            {/* RIGHT COLUMN (NARROWER) */}
            <div className="flex flex-col gap-5 w-full xl:w-[40%] 2xl:w-[35%] min-h-0">
              
              {/* MONETIZATION CARD */}
              <div className="bg-black/60 backdrop-blur-sm border border-[#D4AF37]/40 rounded-2xl p-6 sm:p-8 relative overflow-hidden shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 blur-3xl rounded-full pointer-events-none"></div>
                <h3 className="text-[11px] sm:text-xs font-black text-[#D4AF37] uppercase tracking-[0.2em] font-sans mb-6 drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]">MONÉTISATION AFRIGOMBO</h3>
                
                <div className="space-y-6 relative z-10">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] sm:text-[11px] text-zinc-400 tracking-[0.2em] uppercase font-mono font-bold">GAWA DISPONIBLES</span>
                       <div className="w-5 h-5 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center cursor-pointer hover:bg-zinc-800 transition-colors" onClick={() => setBalanceVisible(!balanceVisible)}>
                         {balanceVisible ? <Eye className="w-3 h-3 text-zinc-400" /> : <EyeOff className="w-3 h-3 text-[#D4AF37]" />}
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.6)] border-[3px] border-black shrink-0 relative">
                        <span className="font-mono font-black text-xl">💰</span>
                      </div>
                      <span className="text-3xl sm:text-4xl 2xl:text-5xl font-sans font-black text-white tracking-tight leading-none drop-shadow-md">
                         {balanceVisible ? "12,450,000" : "••••••••"}
                      </span>
                      <span className="text-zinc-500 font-mono text-[11px] font-black self-end mb-1 tracking-widest">GAWA</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-6 border-t border-zinc-800/80">
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-zinc-500 tracking-[0.15em] uppercase font-mono font-bold block mb-2">REVENUS MENSUELS</span>
                      <span className="text-xl sm:text-2xl font-black font-sans text-white block leading-tight">185,750,000</span>
                      <span className="text-[11px] font-mono font-black text-emerald-400 flex items-center gap-1 mt-1.5 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]"><ArrowUpRight className="w-3 h-3"/> +12.4% <ArrowUpRight className="w-3 h-3 text-emerald-600 ml-1 opacity-50"/></span>
                    </div>
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-zinc-500 tracking-[0.15em] uppercase font-mono font-bold block mb-2">REVENUS ANNUELS</span>
                      <span className="text-xl sm:text-2xl font-black font-sans text-white block leading-tight">1,982,450,000</span>
                      <span className="text-[11px] font-mono font-black text-emerald-400 flex items-center gap-1 mt-1.5 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]"><ArrowUpRight className="w-3 h-3"/> +28.7% <ArrowUpRight className="w-3 h-3 text-emerald-600 ml-1 opacity-50"/></span>
                    </div>
                  </div>

                  <div className="grid border border-[#D4AF37]/50 rounded-xl overflow-hidden mt-2 hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-shadow">
                    <button className="w-full bg-[#D4AF37]/5 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black py-3 rounded-xl flex items-center justify-center gap-3 font-mono font-black uppercase text-[11px] tracking-[0.2em] transition-all">
                      <Wallet className="w-4 h-4" />
                      Voir le Wallet
                      <Eye className="w-3 h-3 ml-auto mr-4 opacity-50" />
                    </button>
                  </div>
                </div>
              </div>

              {/* AFRICA PLATFORM TIMELINE / MAP */}
              <div className="bg-black/60 backdrop-blur-sm border border-[#D4AF37]/20 rounded-2xl p-5 relative flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                 <h3 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.2em] font-sans mb-4 shrink-0 drop-shadow-[0_0_5px_rgba(212,175,55,0.3)]">AFRIQUE MUSICALE - TEMPS RÉEL</h3>
                 <div className="flex flex-col 2xl:flex-row items-center gap-6 2xl:gap-8 flex-1 min-h-0 overflow-y-auto custom-scrollbar w-full p-2">
                   
                   {/* Centered Map */}
                   <div className="w-full max-w-[200px] 2xl:max-w-[280px] aspect-square relative shrink-0">
                      <svg viewBox="0 0 240 260" className="w-full h-full opacity-90 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                        <path
                          d="M100,20 C120,18,150,22,170,35 C185,45,210,60,220,80 C225,90,218,105,212,115 C205,125,208,135,210,145 C212,155,200,165,190,175 C180,185,175,195,170,210 C165,225,155,235,145,245 C135,255,128,260,128,255 C120,245,115,235,110,225 C105,215,110,205,100,195 C92,185,82,175,75,165 C68,155,60,150,50,145 C40,140,25,135,20,125 C15,115,22,110,30,105 C40,95,50,85,55,75 C60,65,70,55,75,45 C80,35,85,25,100,20 Z"
                          fill="none"
                          stroke="#D4AF37"
                          strokeWidth="2"
                          strokeDasharray="2, 4"
                          className="opacity-60"
                        />
                         <circle cx="75" cy="115" r="4" fill="#D4AF37" className="animate-pulse shadow-[0_0_10px_#D4AF37]" />
                         <circle cx="115" cy="140" r="3" fill="#10b981" className="shadow-[0_0_8px_#10b981]" />
                         <circle cx="165" cy="150" r="4" fill="#0ea5e9" className="animate-pulse shadow-[0_0_8px_#0ea5e9]" />
                         <circle cx="138" cy="225" r="3" fill="#8b5cf6" className="shadow-[0_0_8px_#8b5cf6]" />
                         <circle cx="102" cy="55" r="3" fill="#ef4444" className="shadow-[0_0_8px_#ef4444]" />
                      </svg>
                   </div>

                   {/* Stats List */}
                   <div className="w-full space-y-4">
                     {[
                       { r: "AFRIQUE DE L'OUEST", c: "bg-[#D4AF37]", tc: "text-[#D4AF37]", t1: "512,459", t2: "22,459", t3: "1,245" },
                       { r: "AFRIQUE CENTRALE", c: "bg-emerald-500", tc: "text-emerald-500", t1: "215,784", t2: "8,754", t3: "542" },
                       { r: "AFRIQUE DE L'EST", c: "bg-sky-500", tc: "text-sky-500", t1: "280,145", t2: "12,584", t3: "754" },
                       { r: "AFRIQUE AUSTRALE", c: "bg-violet-500", tc: "text-violet-500", t1: "125,458", t2: "5,458", t3: "751" },
                       { r: "AFRIQUE DU NORD", c: "bg-red-500", tc: "text-red-500", t1: "116,613", t2: "4,613", t3: "287" },
                     ].map((item, i) => (
                       <div key={i} className="flex flex-col">
                         <div className="flex items-center gap-2 mb-1.5">
                           <div className={`w-2.5 h-2.5 rounded-full ${item.c} shadow-[0_0_8px_currentColor] ${item.tc}`}></div>
                           <span className="text-[10px] font-mono tracking-widest text-[#F5F5F5] font-bold uppercase leading-none">{item.r}</span>
                         </div>
                         <div className="flex gap-6 ml-4">
                           <div className="flex flex-col">
                             <span className="text-white text-xs font-black leading-tight tracking-wider">{item.t1}</span>
                             <span className="text-[8px] text-zinc-500 font-mono tracking-wide">Utilisateurs</span>
                           </div>
                           <div className="flex flex-col">
                             <span className="text-white text-xs font-black leading-tight tracking-wider">{item.t2}</span>
                             <span className="text-[8px] text-zinc-500 font-mono tracking-wide">Publications</span>
                           </div>
                           <div className="flex flex-col">
                             <span className="text-white text-xs font-black leading-tight tracking-wider">{item.t3}</span>
                             <span className="text-[8px] text-zinc-500 font-mono tracking-wide">Opportunités</span>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
              </div>

              {/* CRITICAL ALERTS */}
              <div className="bg-black/60 backdrop-blur-sm border border-[#D4AF37]/20 rounded-2xl p-5 shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.2em] font-sans drop-shadow-[0_0_5px_rgba(212,175,55,0.3)]">ALERTES CRITIQUES</h3>
                  <button className="text-[9px] uppercase font-mono font-black text-zinc-300 hover:text-[#D4AF37] border border-zinc-700 hover:border-[#D4AF37] rounded-md px-3 py-1 transition-colors tracking-widest">Voir tout</button>
                </div>

                <div className="space-y-3">
                  {[
                    { title: "Nouveau signalement critique", desc: "Contenu inapproprié détecté", time: "12:42", icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" },
                    { title: "Transaction importante", desc: "250,000 GAWA transférés", time: "12:35", icon: Wallet, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10", border: "border-[#D4AF37]/30" },
                    { title: "Nouvel utilisateur enregistré", desc: "+150 nouveaux utilisateurs", time: "12:22", icon: UserPlus, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
                    { title: "Activité suspecte détectée", desc: "Tentative de connexion inhabituelle", time: "12:10", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" },
                    { title: "Pic d'activité", desc: "Augmentation de 35% des publications", time: "11:58", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30" }
                  ].map((alert, i) => {
                    const Icon = alert.icon;
                    return (
                      <div key={i} className="flex gap-3.5 p-3 bg-black/40 border-b border-zinc-800/50 hover:bg-[#D4AF37]/5 transition-colors group">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${alert.bg} border ${alert.border}`}>
                          <Icon className={`w-5 h-5 ${alert.color}`} strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h4 className={`text-xs font-black truncate leading-tight group-hover:text-white transition-colors ${i===0? 'text-white':'text-zinc-200'}`}>{alert.title}</h4>
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5 font-mono">{alert.desc}</p>
                        </div>
                        <div className="flex flex-col justify-center items-end shrink-0 gap-1.5">
                          <span className="text-[9px] font-mono font-bold text-zinc-500">{alert.time}</span>
                          <div className={`w-2 h-2 rounded-full ${alert.color.replace('text-', 'bg-')} shadow-[0_0_5px_currentColor]`}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* SYSTEM STATUS GRID */}
              <div className="bg-black/60 backdrop-blur-sm border border-[#D4AF37]/20 rounded-2xl p-5 shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.5)] mt-auto">
                 <h3 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.2em] font-sans mb-4 drop-shadow-[0_0_5px_rgba(212,175,55,0.3)]">ÉTAT DU SYSTÈME</h3>
                 
                 <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-3 mb-5">
                    {systemStatus.slice(0, 5).map((sys, i) => {
                      const SysIcon = sys.icon;
                      return (
                      <div key={i} className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-2.5 flex flex-col items-center justify-center text-center hover:border-emerald-500/30 transition-colors">
                         <div className="w-6 h-6 mb-1.5 flex items-center justify-center">
                           <SysIcon className="w-5 h-5 text-[#D4AF37] opacity-80" strokeWidth={1.5} />
                         </div>
                         <span className="text-[8px] font-mono tracking-wider font-bold text-zinc-300 uppercase leading-tight truncate w-full">{sys.label}</span>
                         <div className="flex items-center gap-1 mt-1">
                           <CheckCircle className="w-3 h-3 text-emerald-500" />
                           <span className="text-[7px] font-mono text-emerald-500 leading-none">Opérationnel</span>
                         </div>
                         <div className="text-[#D4AF37] font-mono text-[9px] font-black mt-1">{sys.p}</div>
                      </div>
                    )})}
                 </div>

                 <div className="flex flex-col sm:flex-row gap-3">
                   <div className="grid grid-cols-2 xs:grid-cols-3 gap-3 flex-1">
                     {systemStatus.slice(5, 8).map((sys, i) => {
                        const SysIcon = sys.icon;
                        return (
                        <div key={i} className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-2.5 flex flex-col items-center justify-center text-center">
                           <div className="w-5 h-5 mb-1.5 flex items-center justify-center">
                             <SysIcon className="w-4 h-4 text-[#D4AF37] opacity-80" />
                           </div>
                           <span className="text-[8px] font-mono tracking-wider font-bold text-zinc-300 uppercase leading-tight truncate w-full">{sys.label}</span>
                           <div className="flex items-center gap-1 mt-1">
                             <CheckCircle className="w-3 h-3 text-emerald-400" />
                             <span className="text-[7px] font-mono text-emerald-400 leading-none">Opérationnel</span>
                           </div>
                           <div className="text-[#D4AF37] font-mono text-[9px] font-black mt-1">{sys.p}</div>
                        </div>
                     )})}
                   </div>
                   
                   <div className="bg-zinc-950/80 border border-[#D4AF37]/50 rounded-xl flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-[inset_0_0_20px_rgba(212,175,55,0.1)] py-4 sm:py-0">
                      <div className="sm:absolute sm:top-2 w-full text-center">
                        <span className="text-[8px] font-sans font-bold uppercase tracking-[0.2em] text-zinc-300">SYSTÈME GLOBAL</span>
                      </div>
                      <div className="relative w-16 h-16 mt-2">
                          <svg className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]">
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-zinc-900" />
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="176" strokeDashoffset="0" className="text-[#D4AF37]" strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-black text-white font-mono leading-none tracking-widest mt-0.5">99.9%</span>
                          </div>
                      </div>
                   </div>
                 </div>
              </div>

              {/* IA AFRIGOMBO DEDICATED CARD */}
              <div className="bg-black/60 backdrop-blur-sm border border-[#D4AF37]/30 rounded-2xl p-5 shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.5)] mt-auto relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 blur-2xl rounded-full pointer-events-none group-hover:bg-[#D4AF37]/20 transition-all"></div>
                 <h3 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.2em] font-sans mb-3 drop-shadow-[0_0_5px_rgba(212,175,55,0.3)] flex items-center gap-2">
                   <Sparkles className="w-4 h-4 text-[#D4AF37]" /> IA AFRIGOMBO
                 </h3>
                 
                 <div className="grid grid-cols-2 gap-2 mb-3 relative z-10">
                   {["Détection anomalies", "Aide modération", "Résumés auto", "Recommandations", "Décisions", "Alerte préventive"].map((func, i) => (
                     <div key={i} className="flex items-center gap-1.5 bg-black/40 border border-[#D4AF37]/20 rounded-md p-1.5 hover:border-[#D4AF37]/50 transition-colors">
                       <CheckCircle className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                       <span className="text-[8px] font-mono font-bold text-zinc-300 uppercase leading-none tracking-widest truncate">{func}</span>
                     </div>
                   ))}
                 </div>
                 
                 <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 flex items-center justify-center gap-2 relative z-10">
                   <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                   <span className="text-[9px] font-mono font-black text-red-500 uppercase tracking-widest leading-none drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                     Validation humaine obligatoire
                   </span>
                 </div>
              </div>

            </div>
          </div>
        </main>
      </div>
      </div>

      {/* BOTTOM NAVIGATION (MOBILE ONLY) */}
      <footer className="shrink-0 h-16 sm:h-20 bg-black/90 backdrop-blur-xl border-t border-[#D4AF37]/30 flex z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] relative overflow-hidden xl:hidden">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent blur-sm"></div>
        <div className="max-w-[1800px] w-full mx-auto px-4 sm:px-10 flex justify-between items-center h-full">
          {[
            { id: "dashboard", label: "Accueil", icon: Home },
            { id: "utilisateurs", label: "Utilisateurs", icon: Users },
            { id: "finances", label: "Finances", icon: Wallet },
            { id: "statistiques", label: "Statistiques", icon: BarChart2 },
            { id: "communautes", label: "Communautés", icon: Globe },
            { id: "plus", label: "Plus", icon: MoreHorizontal },
          ].map((item, i) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id || (item.id === "dashboard" && activeMenu !== "utilisateurs" && activeMenu !== "finances" && activeMenu !== "statistiques" && activeMenu !== "communautes" && activeMenu !== "plus" && i === 0);
            return (
               <button
                 key={item.id}
                 onClick={() => { setActiveMenu(item.id); try{ audioSynth.playTamTam(false); }catch(e){} }}
                 className={`flex flex-col items-center justify-center relative w-16 sm:w-24 group transition-colors flex-1`}
               >
                 <Icon className={`w-5 h-5 sm:w-6 sm:h-6 mb-1 transition-all ${isActive ? "text-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,175,55,0.8)] -translate-y-1" : "text-zinc-500 group-hover:text-zinc-300 group-hover:-translate-y-0.5"}`} strokeWidth={isActive ? 2.5 : 1.5} />
                 <span className={`text-[9px] sm:text-[10px] font-mono tracking-widest uppercase transition-all ${isActive ? "text-[#D4AF37] font-black" : "text-zinc-500 font-bold group-hover:text-zinc-300"}`}>
                   {item.label}
                 </span>
                 {isActive && (
                   <span className="absolute -bottom-2 sm:-bottom-3 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-[#D4AF37] rounded-full shadow-[0_0_8px_rgba(212,175,55,1)]"></span>
                 )}
               </button>
            )
          })}
        </div>
      </footer>
    </motion.div>
  );
}

function Star({ filled }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 sm:w-5 sm:h-5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function LegendItem2({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-[3px] rounded-full ${color} shadow-[0_0_8px_currentColor]`}></span>
      <span className="text-[10px] text-zinc-300 font-mono font-bold uppercase tracking-[0.15em]">{label}</span>
    </div>
  );
}
