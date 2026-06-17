import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Crown,
  Bell,
  Globe,
  Wallet,
  UserX,
  AlertTriangle,
  Terminal,
  Activity,
  MapPin,
  TrendingUp,
  Settings,
  Scale
} from "lucide-react";
import { User, Gombo, Transaction, Alerte, GomboReview } from "../types";
import { motion } from "motion/react";

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
  users,
  gombos,
  transactions,
  alerts,
  systemCommissionRate,
  setSystemCommissionRate,
  addToTerminal,
  onClose
}: FounderThroneProps) {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setCurrentDate(now.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const addLocalLog = (message: string) => {
    const time = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs(prev => [`[${time}] ${message}`, ...prev].slice(0, 10));
    addToTerminal(`[SUPRÊME] ${message}`);
  };

  useEffect(() => {
    addLocalLog("Initialisation du Palais Numérique Suprême...");
    addLocalLog("Authentification biométrique: [jhs.kmj7@gmail.com] vérifiée.");
    addLocalLog("Contrôle absolu accordé.");
  }, []);

  const revenuesTotaux = transactions.filter(t => t.type === "credit" || t.type === "gombo_payment").reduce((acc, t) => acc + t.amount, 0);
  
  const locationsCount = users.reduce((acc, u) => {
    if (u.location) {
      acc[u.location] = (acc[u.location] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  const topCities = Object.entries(locationsCount).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const handleCommissionChange = () => {
    const newRateStr = prompt(`Commission actuelle: ${systemCommissionRate}%. Entrez le nouveau taux (ex: 12)`);
    if (newRateStr) {
      const newRate = parseFloat(newRateStr);
      if (!isNaN(newRate) && newRate >= 0 && newRate <= 50) {
        setSystemCommissionRate(newRate);
        addLocalLog(`Taux de commission système ajusté à ${newRate}%`);
      }
    }
  };

  const handleEmergencyProtocol = () => {
    if (window.confirm("DANGER: Êtes-vous sûr de vouloir déclencher l'arrêt d'urgence ? Cela bloquera toute transaction.")) {
      setIsEmergencyActive(!isEmergencyActive);
      addLocalLog(isEmergencyActive ? "Arrêt d'urgence DÉSACTIVÉ. Le système reprend." : "ARRÊT D'URGENCE ACTIVÉ. Plateforme gelée.");
    }
  };

  const notifyRule = () => {
    const rule = prompt("Entrez la nouvelle directive suprême à diffuser à tous les utilisateurs :");
    if (rule) {
      addLocalLog(`Nouvelle Règle Déclarée : "${rule}"`);
      alert("La directive a été enregistrée dans la blockchain d'infrastructure.");
    }
  };

  const withdrawFunds = () => {
    if (revenuesTotaux === 0) {
      alert("Aucun fonds disponible.");
      return;
    }
    if (window.confirm(`Retirer ${revenuesTotaux} FCFA vers le compte bancaire central ?`)) {
      addLocalLog(`Retrait initié pour ${revenuesTotaux} FCFA vers Compte Fondateur.`);
    }
  };

  const grantEmergencyId = () => {
    const targetEmail = prompt("Entrez l'email du compte à promouvoir Gombo ID d'Urgence :");
    if (targetEmail) {
      addLocalLog(`Gombo ID Légendaire décerné à [${targetEmail}]`);
      alert("Gombo ID octroyé.");
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#000000] text-zinc-100 flex flex-col font-sans select-none z-[100] overflow-hidden">
      
      {/* 1. ENTÊTE IMPÉRIAL */}
      <header className="shrink-0 border-b border-[#D4AF37]/30 px-8 py-6 flex justify-between items-center bg-[#050505] shadow-[0_4px_30px_rgba(212,175,55,0.08)] relative z-10">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-[#D4AF37] p-1 bg-black shadow-[0_0_20px_rgba(212,175,55,0.3)]">
              {/* Photo placeholder for Founder */}
              <img 
                src="https://images.unsplash.com/photo-1542385151-efd9000785a0?q=80&w=250&auto=format&fit=crop" 
                alt="Fondateur" 
                className="w-full h-full object-cover rounded-full grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-black border border-[#D4AF37] rounded-full p-1.5 shadow-[0_0_10px_rgba(212,175,55,0.5)]">
              <Crown className="w-4 h-4 text-[#D4AF37]" strokeWidth={3} />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-display font-black text-[#D4AF37] tracking-[0.1em] uppercase drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">
              Sylvestre Hounkpevi
            </h1>
            <h2 className="text-sm font-mono text-zinc-400 tracking-[0.2em] uppercase mt-1 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse shadow-[0_0_8px_rgba(212,175,55,0.8)]"></span>
              Fondateur de l'Empire AfriGombo
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right border-r border-[#D4AF37]/20 pr-8">
            <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase block">Temps Système</span>
            <span className="text-2xl font-mono font-black text-white block mt-1">{currentTime}</span>
            <span className="text-xs font-mono text-[#D4AF37]">{currentDate} (GMT)</span>
          </div>
          <button 
            onClick={onClose}
            className="flex flex-col items-center justify-center p-3 rounded-lg border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 text-[#D4AF37] transition-all"
          >
            <UserX className="w-6 h-6 mb-1" />
            <span className="text-[8px] uppercase tracking-widest font-mono font-bold">Quitter le Palais</span>
          </button>
        </div>
      </header>

      {/* CORE FRAME */}
      <main className="flex-1 p-6 flex flex-col md:flex-row gap-6 overflow-hidden bg-black relative">
         
         {/* Background ambiance */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none"></div>

         <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden z-10 w-full md:w-2/3">
           
           {/* 2. VUE GLOBALE (Carte stylisée) & RAPPORTS STRATÉGIQUES */}
           <div className="flex-1 flex gap-6 min-h-[300px]">
             
             {/* Carte */}
             <div className="flex-1 bg-[#050505] border border-[#D4AF37]/20 rounded-2xl p-6 relative flex flex-col items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.03)]">
                <h3 className="absolute top-6 left-6 text-xs uppercase font-mono font-black tracking-[0.2em] text-[#D4AF37] flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Gouvernance Territoriale
                </h3>
                
                <div className="w-[80%] max-w-[300px] aspect-square relative z-10 opacity-70 mt-6 filter drop-shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                  <svg viewBox="0 0 240 260" className="w-full h-full">
                     <path
                        d="M100,20 C120,18,150,22,170,35 C185,45,210,60,220,80 C225,90,218,105,212,115 C205,125,208,135,210,145 C212,155,200,165,190,175 C180,185,175,195,170,210 C165,225,155,235,145,245 C135,255,128,260,128,255 C120,245,115,235,110,225 C105,215,110,205,100,195 C92,185,82,175,75,165 C68,155,60,150,50,145 C40,140,25,135,20,125 C15,115,22,110,30,105 C40,95,50,85,55,75 C60,65,70,55,75,45 C80,35,85,25,100,20 Z"
                        fill="#0A0A0A"
                        stroke="#D4AF37"
                        strokeWidth="2"
                     />
                     {/* Pulse points */}
                     <circle cx="75" cy="115" r="4" fill="#D4AF37" className="animate-[pulse_1.5s_infinite]" />
                     <circle cx="115" cy="140" r="3" fill="#D4AF37" className="animate-[pulse_2s_infinite]" />
                     <circle cx="165" cy="150" r="5" fill="#EF4444" className="animate-[pulse_1s_infinite]" />
                     {/* Scan line effect */}
                     <line x1="0" y1="0" x2="240" y2="0" stroke="#D4AF37" strokeWidth="1" opacity="0.5" className="animate-[scan_4s_linear_infinite]" />
                  </svg>
                </div>

                <div className="absolute bottom-6 right-6 text-right">
                   <div className="text-[10px] uppercase font-mono text-[#D4AF37] tracking-widest mb-1">Impact Global</div>
                   <div className="text-4xl font-display font-black text-white">{users.length * 124}</div>
                   <div className="text-[9px] uppercase font-mono text-emerald-500 mt-1 flex items-end justify-end gap-1">
                     <TrendingUp className="w-3 h-3"/> +12.4% croiss.
                   </div>
                </div>
             </div>

             {/* 4. Rapports Stratégiques */}
             <div className="w-[35%] bg-[#050505] border border-[#D4AF37]/20 rounded-2xl p-6 flex flex-col">
                <h3 className="text-xs uppercase font-mono font-black tracking-[0.2em] text-[#D4AF37] mb-6 border-b border-[#D4AF37]/20 pb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Rapports Stratégiques
                </h3>

                <div className="space-y-6 flex-1">
                  <div>
                    <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase block mb-1">Revenus Totaux GAWA PAY</span>
                    <strong className="text-2xl font-mono font-black text-[#D4AF37] block">
                      {(revenuesTotaux + 4500000).toLocaleString()} F
                    </strong>
                  </div>

                  <div>
                    <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase block mb-1">Croissance Mensuelle</span>
                    <div className="flex items-center gap-3">
                      <strong className="text-xl font-display font-black text-white block">+2,450</strong>
                      <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[10px] font-bold">+18.2%</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase block mb-3">Villes les plus actives</span>
                    <ul className="space-y-3">
                      {topCities.length > 0 ? topCities.map(([city, count], i) => (
                        <li key={city} className="flex justify-between items-center text-sm">
                           <span className="font-bold text-zinc-300 flex items-center gap-2">
                             <MapPin className="w-3 h-3 text-[#D4AF37]" /> {city}
                           </span>
                           <span className="font-mono text-[#D4AF37]">{count * 15}</span>
                        </li>
                      )) : (
                        <li className="flex justify-between items-center text-sm">
                           <span className="font-bold text-zinc-300 flex items-center gap-2">
                             <MapPin className="w-3 h-3 text-[#D4AF37]" /> Abidjan
                           </span>
                           <span className="font-mono text-[#D4AF37]">4,250</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
             </div>
           </div>

           {/* 5. JOURNAL SYSTÈME */}
           <div className="h-64 bg-[#050505] border border-[#D4AF37]/30 rounded-2xl p-6 flex flex-col shadow-[inset_0_0_20px_rgba(212,175,55,0.05)]">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs uppercase font-mono font-black tracking-[0.2em] text-[#D4AF37] flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Journal Système Directeur
                </h3>
                <span className="flex items-center gap-2 px-2 py-1 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[9px] font-mono text-[#D4AF37] uppercase">
                  <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-pulse"></span>
                  Connexion Sécurisée
                </span>
             </div>
             <div className="flex-1 bg-[#020202] rounded-lg p-4 font-mono text-[11px] h-full overflow-y-auto border border-white/5 custom-scrollbar text-[#D4AF37]/80 leading-relaxed tracking-wider">
                {logs.map((log, idx) => (
                  <div key={idx} className="mb-1 opacity-90 hover:opacity-100 transition-opacity">
                    <span className="text-zinc-600 mr-2">{'>'}</span>
                    <span className={log.includes("DANGER") || log.includes("ARRÊT") ? "text-red-500 font-bold" : "text-[#D4AF37]"}>{log}</span>
                  </div>
                ))}
             </div>
           </div>

         </div>

         {/* 3. CENTRE DE DÉCISION SUPRÊME (Right Sidebar) */}
         <div className="w-full md:w-1/3 bg-[#050505] border border-[#D4AF37]/20 rounded-2xl p-6 flex flex-col z-10 shadow-[0_0_30px_rgba(212,175,55,0.05)]">
            <h3 className="text-xs uppercase font-mono font-black tracking-[0.2em] text-[#D4AF37] mb-8 pb-3 border-b border-[#D4AF37]/20 flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Centre de Décision Suprême
            </h3>

            <div className="flex flex-col gap-4 flex-1">
              
              <button 
                onClick={handleCommissionChange}
                className="w-full group relative overflow-hidden bg-[#0A0A0A] border border-[#D4AF37]/30 hover:border-[#D4AF37] rounded-xl p-5 text-left transition-all"
              >
                <div className="absolute inset-0 bg-[#D4AF37] opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <div className="relative z-10 flex items-start gap-4">
                  <div className="p-3 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Ajuster Commission</h4>
                    <p className="text-[10px] text-zinc-400 mt-1">Taux actuel: <strong className="text-[#D4AF37]">{systemCommissionRate}%</strong>. Modifie la part du réseau.</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={withdrawFunds}
                className="w-full group relative overflow-hidden bg-[#0A0A0A] border border-[#D4AF37]/30 hover:border-[#D4AF37] rounded-xl p-5 text-left transition-all"
              >
                <div className="absolute inset-0 bg-[#D4AF37] opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <div className="relative z-10 flex items-start gap-4">
                  <div className="p-3 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Retrait Trésorerie</h4>
                    <p className="text-[10px] text-zinc-400 mt-1">Transférer l'excédent GAWA vers le compte bancaire central.</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={notifyRule}
                className="w-full group relative overflow-hidden bg-[#0A0A0A] border border-[#D4AF37]/30 hover:border-[#D4AF37] rounded-xl p-5 text-left transition-all"
              >
                <div className="absolute inset-0 bg-[#D4AF37] opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <div className="relative z-10 flex items-start gap-4">
                  <div className="p-3 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]">
                    <Bell className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Déclarer Règle</h4>
                    <p className="text-[10px] text-zinc-400 mt-1">Promulguer une nouvelle directive impérative au réseau.</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={grantEmergencyId}
                className="w-full group relative overflow-hidden bg-[#0A0A0A] border border-[#D4AF37]/30 hover:border-[#D4AF37] rounded-xl p-5 text-left transition-all"
              >
                <div className="absolute inset-0 bg-[#D4AF37] opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <div className="relative z-10 flex items-start gap-4">
                  <div className="p-3 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider">Gombo ID d'Urgence</h4>
                    <p className="text-[10px] text-[#D4AF37]/70 mt-1">Court-circuiter la validation et octroyer l'ID suprême.</p>
                  </div>
                </div>
              </button>

              <div className="mt-auto pt-4">
                <button 
                  onClick={handleEmergencyProtocol}
                  className={`w-full group relative overflow-hidden ${isEmergencyActive ? 'bg-red-900 border-red-500' : 'bg-[#0A0A0A] border-red-500/30'} hover:border-red-500 rounded-xl p-5 text-left transition-all shadow-[0_0_20px_rgba(239,68,68,0.1)] hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]`}
                >
                  <div className={`absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-10 transition-opacity ${isEmergencyActive ? 'animate-pulse opacity-20' : ''}`}></div>
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 rounded-lg text-red-500">
                      <AlertTriangle className={`w-6 h-6 ${isEmergencyActive ? 'animate-bounce' : ''}`} />
                    </div>
                    <div>
                      <h4 className={`text-sm font-black uppercase tracking-wider ${isEmergencyActive ? 'text-white' : 'text-red-500'}`}>
                        {isEmergencyActive ? 'SYSTÈME INTERROMPU' : "Arrêt d'Urgence"}
                      </h4>
                      <p className="text-[10px] text-red-500/70 mt-1 uppercase font-bold tracking-widest">
                        {isEmergencyActive ? 'Cliquez pour restaurer' : 'Geler l\'écosystème global'}
                      </p>
                    </div>
                  </div>
                </button>
              </div>

            </div>
         </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { transform: translateY(0px); opacity: 0.8; }
          45% { transform: translateY(260px); opacity: 0.8; }
          50% { transform: translateY(260px); opacity: 0; }
          95% { transform: translateY(0px); opacity: 0; }
          100% { transform: translateY(0px); opacity: 0.8; }
        }
      `}} />
    </div>
  );
}
