import React, { useState, useEffect } from "react";
import {
  Home,
  Users,
  Wallet,
  BarChart2,
  Target,
  ShieldAlert,
  Megaphone,
  Settings,
  FileText,
  Wrench,
  PenTool,
  Crown,
  Bell,
  Globe,
  Check,
  TrendingUp,
  ShieldCheck,
  UserCheck,
  CheckCircle,
  UserPlus,
  UserMinus,
  UserX,
  Lock,
  AlertTriangle,
  Mail,
  Database,
  RefreshCcw,
  Shield,
  Sparkles,
  Eye,
  EyeOff,
  Radio,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Flame,
  Server,
  FolderOpen,
  Play
} from "lucide-react";
import { User, Gombo, Transaction, Alerte, GomboReview } from "../types";
import { motion } from "motion/react";
import { db } from "../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { audioSynth } from "../lib/audio";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
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
  setReviews: React.Dispatch<React.SetStateAction<GomboReview[]>>;
  systemCommissionRate: number;
  setSystemCommissionRate: (rate: number) => void;
  addToTerminal: (msg: string) => void;
  saveToFirestore: (collection: string, id: string, data: any) => Promise<void>;
  createTransaction: (amount: number, type: any, description: string, userId: string, userName: string) => Promise<void>;
  onClose: () => void;
}

export default function FounderThrone({
  adminEmail,
  users: initialUsers,
  setUsers,
  gombos: initialGombos,
  setGombos,
  transactions: initialTransactions,
  setTransactions,
  alerts: initialAlerts,
  setAlerts,
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
      setCurrentDate(now.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }).replace('.', ''));
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
    <div className="fixed inset-0 w-full h-full bg-[#030303] text-zinc-100 flex flex-col md:flex-row overflow-hidden font-sans select-none z-50">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-black border-r border-[#D4AF37]/20 z-40 overflow-y-auto custom-scrollbar">
        <div className="p-6 flex flex-col items-center justify-center border-b border-[#D4AF37]/20">
          <div className="relative">
             <div className="w-16 h-16 rounded-full border-2 border-[#D4AF37] flex items-center justify-center bg-black mb-3 shadow-[0_0_15px_rgba(212,175,55,0.4)]">
               <svg className="w-8 h-8 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M10 20v-6h4v6M12 4v4m0 0l-3-3m3 3l3-3M6 10h12M4 14h16" />
               </svg>
             </div>
          </div>
          <h1 className="text-sm font-black font-display text-[#D4AF37] tracking-widest uppercase">AFRIGOMBO</h1>
          <p className="text-[10px] text-white tracking-widest font-sans uppercase mt-1">Y'a Gombo Music</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {[
            { id: "dashboard", label: "TABLEAU DE BORD", icon: Home },
            { id: "utilisateurs", label: "UTILISATEURS", icon: Users },
            { id: "finances", label: "FINANCES", icon: Wallet },
            { id: "statistiques", label: "STATISTIQUES", icon: BarChart2 },
            { id: "opportunites", label: "OPPORTUNITÉS", icon: Target },
            { id: "communautes", label: "COMMUNAUTÉS", icon: Users },
            { id: "moderation", label: "MODÉRATION", icon: ShieldAlert },
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-black uppercase tracking-wider font-mono transition-all ${
                  isActive ? "bg-[#D4AF37]/10 text-[#D4AF37] border-l-2 border-[#D4AF37]" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border-l-2 border-transparent"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-[#D4AF37]" : "text-zinc-500"}`} />
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0a0c]">
        
        {/* TOP HEADER */}
        <header className="shrink-0 bg-black border-b border-[#D4AF37]/20 px-6 py-4 flex justify-between items-center z-30 shadow-md relative">
          <div className="flex flex-col text-left">
            <h2 className="text-xl md:text-2xl font-black text-[#D4AF37] uppercase tracking-wide drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">PALAIS NUMÉRIQUE SUPRÊME</h2>
            <p className="text-[10px] md:text-xs text-[#D4AF37] tracking-[0.2em] mt-1 font-mono uppercase">Vision • Influence • Héritage • Gouvernance</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#D4AF37] opacity-60" />
            </div>
            <div className="relative">
              <Bell className="w-5 h-5 text-[#D4AF37]" />
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">12</span>
            </div>
            <div className="hidden md:flex flex-col items-end text-right border-l border-[#D4AF37]/20 pl-6">
              <span className="text-[9px] text-zinc-400 font-mono tracking-widest uppercase">Utilisateurs connectés</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-emerald-400 font-mono text-sm font-black">1,248</span>
              </div>
            </div>
            <div className="hidden lg:flex flex-col items-end border-l border-[#D4AF37]/20 pl-6">
              <span className="text-white text-lg font-mono font-black">{currentTime}</span>
              <span className="text-zinc-500 text-[10px] uppercase tracking-widest leading-none mt-1">{currentDate}</span>
            </div>
          </div>
          
          {/* Mobile close button (for returning to admin center if needed) */}
          <button onClick={onClose} className="absolute right-4 top-2 text-zinc-500 hover:text-white md:hidden">
            <UserX className="w-6 h-6" />
          </button>
        </header>

        {/* SCROLLABLE MAIN REGION */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 max-w-[1600px] mx-auto">
            
            {/* LEFT COLUMN (WIDER) */}
            <div className="xl:col-span-8 flex flex-col gap-6 lg:gap-8">
               
               {/* TOP ROW OF LEFT COL: PROFILE */}
               <div className="bg-black border border-[#D4AF37]/30 rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row items-center gap-6 lg:gap-8 shadow-[0_0_30px_rgba(212,175,55,0.05)] relative overflow-hidden">
                 
                 {/* Avatar */}
                 <div className="relative shrink-0">
                   <div className="w-32 h-32 rounded-full border-[3px] border-[#D4AF37] p-1 overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.2)] bg-zinc-900">
                     <img 
                       src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop&q=85" 
                       alt="Sylvestre Hounkpevi" 
                       className="w-full h-full object-cover rounded-full filter contrast-125"
                     />
                   </div>
                   <div className="absolute -top-1 -right-1 bg-black rounded-full p-1 border border-[#D4AF37]">
                     <Crown className="w-6 h-6 text-[#D4AF37]" strokeWidth={2.5} />
                   </div>
                 </div>

                 {/* Profile Details */}
                 <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                   <h2 className="text-3xl lg:text-4xl font-sans font-black text-white tracking-tight flex items-center justify-center md:justify-start gap-3">
                     Sylvestre Hounkpevi
                     <div className="w-6 h-6 rounded bg-[#D4AF37] text-black flex items-center justify-center">
                       <Check className="w-4 h-4 stroke-[4]" />
                     </div>
                   </h2>
                   <span className="text-[#D4AF37] font-mono font-black text-sm lg:text-base tracking-[0.2em] mt-2 block uppercase">
                     SUPER FONDATEUR
                   </span>
                   <p className="text-zinc-300 text-sm mt-3 flex items-center justify-center md:justify-start gap-2">
                     Niveau : <span className="text-[#D4AF37] font-black uppercase">LÉGENDE AFRIGOMBO</span>
                   </p>
                   
                   <div className="flex text-[#D4AF37] mt-3 gap-1">
                     {Array(7).fill(0).map((_, i) => <Star key={i} filled />)}
                   </div>

                   <div className="w-full max-w-md mt-6 bg-[#0a0a0c] border border-zinc-800 rounded-full h-3 overflow-hidden relative">
                     <div className="bg-gradient-to-r from-amber-600 via-[#D4AF37] to-amber-400 h-full rounded-full w-full relative">
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                     </div>
                   </div>
                   <div className="w-full max-w-md flex justify-between items-center mt-2 font-mono text-[11px] font-black text-white">
                      <button className="flex items-center gap-2 text-[#D4AF37] border border-[#D4AF37]/50 hover:bg-[#D4AF37]/10 px-4 py-2 rounded-lg transition-colors uppercase tracking-wider">
                         <PenTool className="w-3 h-3" />
                         Modifier le profil
                      </button>
                      <span>NIVEAU MAX <span className="text-[#D4AF37] ml-2">100%</span></span>
                   </div>
                 </div>
               </div>

               {/* GLOBAL STATS GRID */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
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
                     <div key={i} className="bg-black border border-[#D4AF37]/20 rounded-xl p-4 lg:p-5 flex flex-col items-center text-center relative hover:border-[#D4AF37]/50 transition-colors group">
                       <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                         <Icon className="w-5 h-5 text-[#D4AF37]" />
                       </div>
                       <span className="text-[9px] lg:text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase font-black mb-2 opacity-80 h-8 flex items-center justify-center leading-tight">
                         {stat.label}
                       </span>
                       <strong className="text-xl lg:text-2xl font-black text-white">{stat.val}</strong>
                       <span className={`text-xs font-mono font-bold mt-2 flex items-center gap-1 ${stat.trendDown ? "text-red-500" : "text-emerald-500"}`}>
                         {stat.trend} {stat.trendDown ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                       </span>
                     </div>
                   );
                 })}
               </div>

               {/* PLATFORM ACTIVITY CHART */}
               <div className="bg-black border border-[#D4AF37]/30 rounded-2xl p-6 relative">
                 <div className="flex justify-between items-start mb-6">
                   <h3 className="text-sm font-black text-[#D4AF37] uppercase tracking-widest font-mono">ACTIVITÉ PLATEFORME</h3>
                   <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                     {["7 JOURS", "30 JOURS", "90 JOURS", "1 AN"].map((t, i) => (
                       <button key={i} className={`px-4 py-2 text-[10px] font-mono font-black border-r border-zinc-800 last:border-0 ${i === 0 ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "text-zinc-400 hover:text-white"}`}>
                         {t}
                       </button>
                     ))}
                   </div>
                 </div>

                 <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorU" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
                        <Tooltip 
                           contentStyle={{ backgroundColor: "#000", border: "1px solid #D4AF37", borderRadius: "8px" }} 
                           itemStyle={{ fontSize: "12px", color: "#fff" }}
                           labelStyle={{ color: "#D4AF37", marginBottom: "4px" }}
                        />
                        <Area type="monotone" dataKey="Utilisateurs" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorU)" />
                        <Area type="monotone" dataKey="Publications" stroke="#10b981" strokeWidth={2} fill="none" />
                        <Area type="monotone" dataKey="Engagement" stroke="#0ea5e9" strokeWidth={2} fill="none" />
                        <Area type="monotone" dataKey="Revenus" stroke="#8b5cf6" strokeWidth={2} fill="none" />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
                 
                 <div className="flex flex-wrap justify-center gap-6 mt-4 pt-4 border-t border-zinc-900">
                    <LegendItem color="bg-[#D4AF37]" label="Utilisateurs" />
                    <LegendItem color="bg-emerald-500" label="Publications" />
                    <LegendItem color="bg-sky-500" label="Engagement" />
                    <LegendItem color="bg-violet-500" label="Revenus" />
                 </div>
               </div>

               {/* SUPREME ACTIONS */}
               <div className="bg-black border border-[#D4AF37]/20 rounded-2xl p-6">
                 <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                   {supremeActions.map((act, i) => {
                     const Icon = act.icon;
                     const isDanger = ["Suspendre Utilisateur", "Geler Wallet", "Mode Crise"].includes(act.label);
                     return (
                       <button key={i} className="flex flex-col items-center justify-center text-center p-3 rounded-xl hover:bg-zinc-900 transition-colors group">
                          <Icon className={`w-8 h-8 mb-3 ${isDanger ? "text-red-500/80 group-hover:text-red-500" : "text-[#D4AF37]/80 group-hover:text-[#D4AF37]"}`} strokeWidth={1.5} />
                          <span className="text-[10px] font-sans font-bold text-zinc-400 group-hover:text-white leading-tight">
                            {act.label}
                          </span>
                       </button>
                     );
                   })}
                 </div>
               </div>

               {/* BOTTOM BANNER */}
               <div className="mt-4 relative rounded-2xl overflow-hidden border border-[#D4AF37]/40 h-48 md:h-64 flex items-center shadow-[0_0_40px_rgba(212,175,55,0.15)] group">
                 <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10"></div>
                 <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1540039155732-6761b54cbaca?w=1000&auto=format&fit=crop&q=80')`}}></div>
                 <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-90 z-10"></div>
                 
                 <div className="relative z-20 p-8 md:p-12 pl-12 flex flex-col justify-center h-full max-w-2xl">
                    <h2 className="text-4xl md:text-5xl font-black font-sans text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-amber-200 tracking-tight leading-none mb-2">
                      AFRIGOMBO
                    </h2>
                    <p className="text-xl md:text-2xl font-bold text-white uppercase tracking-wider opacity-90">
                      LE TERRAIN D'ACTION<br/>DE L'AFRIQUE CRÉATIVE.
                    </p>
                 </div>
                 
                 <div className="absolute right-8 bottom-0 z-20 w-32 h-32 opacity-40">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1" className="w-full h-full">
                       <path d="M9 18V5l12-2v13" />
                       <circle cx="6" cy="18" r="3" />
                       <circle cx="18" cy="16" r="3" />
                    </svg>
                 </div>
               </div>

            </div>

            {/* RIGHT COLUMN (NARROWER) */}
            <div className="xl:col-span-4 flex flex-col gap-6 lg:gap-8">
              
              {/* MONETIZATION CARD */}
              <div className="bg-black border border-[#D4AF37]/40 rounded-2xl p-6 lg:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 blur-3xl rounded-full"></div>
                <h3 className="text-sm font-black text-[#D4AF37] uppercase tracking-widest font-mono mb-6">MONÉTISATION AFRIGOMBO</h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] text-zinc-400 tracking-widest uppercase font-mono">GAWA DISPONIBLES</span>
                       <div className="w-5 h-5 rounded bg-black border border-zinc-800 flex items-center justify-center cursor-pointer hover:bg-zinc-900" onClick={() => setBalanceVisible(!balanceVisible)}>
                         {balanceVisible ? <Eye className="w-3 h-3 text-zinc-400" /> : <EyeOff className="w-3 h-3 text-[#D4AF37]" />}
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)] border-2 border-black">
                        <span className="font-mono font-black text-lg">💰</span>
                      </div>
                      <span className="text-3xl font-black text-white tracking-tight">
                         {balanceVisible ? "12,450,000" : "••••••••"}
                      </span>
                      <span className="text-zinc-500 font-mono text-xs font-black self-end mb-1">GAWA</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-900">
                    <div>
                      <span className="text-[9px] text-zinc-500 tracking-widest uppercase font-mono block mb-1">REVENUS MENSUELS</span>
                      <span className="text-lg font-black text-white block">185,750,000</span>
                      <span className="text-xs font-mono font-black text-emerald-400 flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> +12.4%</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 tracking-widest uppercase font-mono block mb-1">REVENUS ANNUELS</span>
                      <span className="text-lg font-black text-white block">1,982,450,000</span>
                      <span className="text-xs font-mono font-black text-emerald-400 flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> +28.7%</span>
                    </div>
                  </div>

                  <button className="w-full mt-4 bg-transparent border border-[#D4AF37] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black py-3 rounded-lg flex items-center justify-center gap-3 font-mono font-black uppercase text-xs tracking-widest transition-all">
                    <Wallet className="w-4 h-4" />
                    Voir le Wallet
                  </button>
                </div>
              </div>

              {/* AFRICA PLATFORM TIMELINE / MAP */}
              <div className="bg-black border border-[#D4AF37]/20 rounded-2xl p-6 relative">
                 <h3 className="text-sm font-black text-[#D4AF37] uppercase tracking-widest font-mono mb-6">AFRIQUE MUSICALE - TEMPS RÉEL</h3>
                 <div className="flex flex-col items-center gap-6">
                   <div className="w-full max-w-[200px] h-[200px] relative">
                      <svg viewBox="0 0 240 260" className="w-full h-full opacity-80 drop-shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                        <path
                          d="M100,20 C120,18,150,22,170,35 C185,45,210,60,220,80 C225,90,218,105,212,115 C205,125,208,135,210,145 C212,155,200,165,190,175 C180,185,175,195,170,210 C165,225,155,235,145,245 C135,255,128,260,128,255 C120,245,115,235,110,225 C105,215,110,205,100,195 C92,185,82,175,75,165 C68,155,60,150,50,145 C40,140,25,135,20,125 C15,115,22,110,30,105 C40,95,50,85,55,75 C60,65,70,55,75,45 C80,35,85,25,100,20 Z"
                          fill="none"
                          stroke="#D4AF37"
                          strokeWidth="1.5"
                          strokeDasharray="2, 4"
                        />
                         <circle cx="75" cy="115" r="3" fill="#D4AF37" className="animate-pulse" />
                         <circle cx="115" cy="140" r="3" fill="#10b981" />
                         <circle cx="165" cy="150" r="3" fill="#0ea5e9" className="animate-pulse" />
                         <circle cx="138" cy="225" r="3" fill="#8b5cf6" />
                         <circle cx="102" cy="55" r="3" fill="#ef4444" />
                      </svg>
                   </div>

                   <div className="w-full space-y-4">
                     {[
                       { r: "AFRIQUE DE L'OUEST", c: "bg-[#D4AF37]", t1: "512,459", t2: "22,459", t3: "1,245" },
                       { r: "AFRIQUE CENTRALE", c: "bg-emerald-500", t1: "215,784", t2: "8,754", t3: "542" },
                       { r: "AFRIQUE DE L'EST", c: "bg-sky-500", t1: "280,145", t2: "12,584", t3: "754" },
                       { r: "AFRIQUE AUSTRALE", c: "bg-violet-500", t1: "125,458", t2: "5,458", t3: "751" },
                       { r: "AFRIQUE DU NORD", c: "bg-red-500", t1: "116,613", t2: "4,613", t3: "287" },
                     ].map((item, i) => (
                       <div key={i} className="flex flex-col">
                         <div className="flex items-center gap-2 mb-1">
                           <div className={`w-2 h-2 rounded-full ${item.c}`}></div>
                           <span className="text-[10px] font-mono tracking-widest text-zinc-300 uppercase">{item.r}</span>
                         </div>
                         <div className="flex gap-4 ml-4">
                           <div className="flex flex-col">
                             <span className="text-white text-xs font-black">{item.t1}</span>
                             <span className="text-[8px] text-zinc-500 font-mono">Utilisateurs</span>
                           </div>
                           <div className="flex flex-col">
                             <span className="text-white text-xs font-black">{item.t2}</span>
                             <span className="text-[8px] text-zinc-500 font-mono">Publications</span>
                           </div>
                           <div className="flex flex-col">
                             <span className="text-white text-xs font-black">{item.t3}</span>
                             <span className="text-[8px] text-zinc-500 font-mono">Opportunités</span>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
              </div>

              {/* CRITICAL ALERTS */}
              <div className="bg-black border border-[#D4AF37]/20 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black text-[#D4AF37] uppercase tracking-widest font-mono">ALERTES CRITIQUES</h3>
                  <button className="text-[10px] uppercase font-mono font-black text-zinc-400 hover:text-white border border-zinc-800 rounded px-2 py-1">Voir tout</button>
                </div>

                <div className="space-y-4">
                  {[
                    { title: "Nouveau signalement critique", desc: "Contenu inapproprié détecté", time: "12:42", icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/10" },
                    { title: "Transaction importante", desc: "250,000 GAWA transférés", time: "12:35", icon: Wallet, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10" },
                    { title: "Nouvel utilisateur enregistré", desc: "+150 nouveaux utilisateurs aujourd'hui", time: "12:22", icon: UserPlus, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { title: "Activité suspecte détectée", desc: "Tentative de connexion inhabituelle", time: "12:10", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
                    { title: "Pic d'activité", desc: "Augmentation de 35% des publications", time: "11:58", icon: TrendingUp, color: "text-sky-500", bg: "bg-sky-500/10" },
                  ].map((alert, i) => {
                    const Icon = alert.icon;
                    return (
                      <div key={i} className="flex gap-4 p-3 bg-[#0a0a0c] border border-zinc-900 rounded-xl hover:border-zinc-700 transition-colors">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${alert.bg}`}>
                          <Icon className={`w-5 h-5 ${alert.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-black text-white truncate">{alert.title}</h4>
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5">{alert.desc}</p>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-[10px] font-mono text-zinc-500">{alert.time}</span>
                          <div className={`w-1.5 h-1.5 rounded-full mt-2 ${alert.color.replace('text-', 'bg-')}`}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* SYSTEM STATUS GRID */}
              <div className="bg-black border border-[#D4AF37]/20 rounded-2xl p-6">
                 <h3 className="text-sm font-black text-[#D4AF37] uppercase tracking-widest font-mono mb-6">ÉTAT DU SYSTÈME</h3>
                 
                 <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
                    {systemStatus.map((sys, i) => {
                      const SysIcon = sys.icon;
                      return (
                      <div key={i} className="bg-[#0a0a0c] border border-zinc-800 rounded-xl p-3 flex flex-col items-center text-center">
                         <div className="w-6 h-6 mb-2">
                           <SysIcon className="w-5 h-5 text-[#D4AF37] mx-auto opacity-70" />
                         </div>
                         <span className="text-[8px] font-bold text-zinc-300 uppercase leading-tight line-clamp-1 h-5 flex items-center">{sys.label}</span>
                         <div className="flex items-center gap-1 mt-1">
                           <CheckCircle className="w-2.5 h-2.5 text-emerald-500" />
                           <span className="text-[7px] text-emerald-500">Opérationnel</span>
                         </div>
                         <span className="text-xs font-mono font-black text-emerald-400 mt-1">{sys.p}</span>
                      </div>
                    )})}
                 </div>

                 <div className="p-4 border border-[#D4AF37]/50 bg-[#D4AF37]/5 rounded-xl flex items-center justify-between">
                   <div className="flex flex-col">
                     <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-400">SYSTÈME GLOBAL</span>
                     <span className="text-2xl font-black text-white mt-1">99.9%</span>
                   </div>
                   <div className="relative w-14 h-14">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="none" className="text-zinc-800" />
                        <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="150" strokeDashoffset="0" className="text-[#D4AF37]" strokeLinecap="round" />
                      </svg>
                   </div>
                 </div>
              </div>

            </div>
          </div>
        </main>

        {/* MOBILE BOTTOM NAVIGATION */}
        <nav className="md:hidden bg-black border-t border-zinc-900 pb-safe pt-2 px-4 flex justify-between items-center shrink-0">
          {[
            { id: "dashboard", label: "Accueil", icon: Home },
            { id: "utilisateurs", label: "Utilisateurs", icon: Users },
            { id: "finances", label: "Finances", icon: Wallet },
            { id: "statistiques", label: "Statistiques", icon: BarChart2 },
            { id: "communautes", label: "Communautés", icon: Globe },
            { id: "plus", label: "Plus", icon: MoreHorizontal },
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`flex flex-col items-center justify-center p-2 gap-1 ${isActive ? "text-[#D4AF37]" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "fill-current" : ""}`} />
                <span className="text-[9px] font-mono font-bold leading-none">{item.label}</span>
              </button>
            )
          })}
        </nav>

      </div>
    </div>
  );
}

function Star({ filled }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-[2px] ${color}`}></span>
      <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest">{label}</span>
    </div>
  );
}
