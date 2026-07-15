import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  FileText, ShieldCheck, CheckCircle2, Clock, 
  AlertTriangle, Search, Filter, ArrowUpRight,
  TrendingUp, Wallet, BadgeCheck, FileSignature,
  Loader2, XCircle, Calendar, ShieldAlert, Check
} from "lucide-react";
import { gomboDB } from "../firebase";
import { GomboSafeContract, UserProfile } from "../types";
import GomboContractView from "./GomboContractView";

interface GomboContractsDashboardProps {
  currentUser: UserProfile;
}

export default function GomboContractsDashboard({ currentUser }: GomboContractsDashboardProps) {
  const [contracts, setContracts] = useState<GomboSafeContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  const isAdminView = currentUser.role === "admin" || currentUser.isAdmin;

  // Real-time listener for Firestore contract sync
  useEffect(() => {
    if (!currentUser.uid) return;
    setLoading(true);
    let unsubscribe = () => {};

    if (isAdminView) {
      unsubscribe = gomboDB.listenAllContracts((data) => {
        setContracts(data);
        setLoading(false);
      });
    } else {
      unsubscribe = gomboDB.listenContractsForUser(currentUser.uid, (data) => {
        setContracts(data);
        setLoading(false);
      });
    }

    return () => unsubscribe();
  }, [currentUser.uid, isAdminView]);

  const filteredContracts = contracts.filter(c => {
    if (filterStatus === "all") return true;
    if (filterStatus === "active") {
      return ["signed", "payment_held", "arrived", "in_progress", "completed_artist"].includes(c.status);
    }
    if (filterStatus === "completed") return c.status === "completed";
    if (filterStatus === "disputed") return c.status === "disputed";
    return c.status === filterStatus;
  });

  // Calculate stats based on view role (Admin/Founder vs User)
  const todayStr = new Date().toDateString();

  const adminStats = {
    active: contracts.filter(c => ["signed", "payment_held", "arrived", "in_progress", "completed_artist"].includes(c.status)).length,
    completed: contracts.filter(c => c.status === "completed").length,
    cancelled: contracts.filter(c => c.status === "cancelled").length,
    disputed: contracts.filter(c => c.status === "disputed").length,
    commissions: contracts.filter(c => c.status === "completed").reduce((acc, c) => acc + (c.commissionClient || 0) + (c.commissionArtist || 0), 0),
    blockedPayments: contracts.filter(c => ["payment_held", "arrived", "in_progress", "completed_artist"].includes(c.status)).reduce((acc, c) => acc + (c.amount || 0), 0),
    dailyRevenue: contracts.filter(c => c.status === "completed" && c.updatedAt && new Date(c.updatedAt).toDateString() === todayStr).reduce((acc, c) => acc + (c.commissionClient || 0) + (c.commissionArtist || 0), 0)
  };

  const userStats = {
    total: contracts.length,
    active: contracts.filter(c => ["signed", "payment_held", "arrived", "in_progress", "completed_artist"].includes(c.status)).length,
    completed: contracts.filter(c => c.status === "completed").length,
    revenue: contracts.filter(c => c.status === "completed").reduce((acc, c) => {
      if (c.artistId === currentUser.uid) {
        return acc + (c.totalArtistReceives || c.amount || 0);
      }
      return acc;
    }, 0)
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "generated":
      case "accepted_client":
      case "accepted_artist":
        return { label: "En attente", color: "text-amber-400 border-amber-500/30 bg-amber-500/5" };
      case "signed":
        return { label: "Signé", color: "text-blue-400 border-blue-500/30 bg-blue-500/5" };
      case "payment_held":
        return { label: "Dépôt Sécurisé", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5" };
      case "arrived":
        return { label: "Artiste Arrivé 📍", color: "text-teal-400 border-teal-500/30 bg-teal-500/5" };
      case "in_progress":
        return { label: "En Cours ⚡", color: "text-purple-400 border-purple-500/30 bg-purple-500/5 animate-pulse" };
      case "completed_artist":
        return { label: "Prestation Terminée", color: "text-orange-400 border-orange-500/30 bg-orange-500/5" };
      case "completed":
        return { label: "Terminé & Libéré", color: "text-zinc-400 border-zinc-700 bg-zinc-800" };
      case "disputed":
        return { label: "En Litige 🚨", color: "text-red-500 border-red-500/30 bg-red-500/5" };
      case "cancelled":
        return { label: "Annulé", color: "text-zinc-600 border-zinc-800 bg-zinc-900" };
      default:
        return { label: status, color: "text-zinc-400 border-zinc-800 bg-zinc-900" };
    }
  };

  if (selectedContractId) {
    return (
      <GomboContractView 
        contractId={selectedContractId} 
        currentUser={currentUser} 
        onBack={() => setSelectedContractId(null)}
        onUpdate={() => {}}
      />
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-sans font-black text-white uppercase tracking-tighter">
            {isAdminView ? "TABLEAU DE BORD DES CONTRATS" : "CONTRATS AFRIGOMBO"}
          </h2>
          <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">
            {isAdminView ? "CONTRÔLE ET SOUVERAINETÉ DE LA PRESTATION IMPÉRIALE" : "Gérez vos engagements sécurisés et vos paiements"}
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 bg-zinc-900/50 border border-zinc-800 rounded-xl self-start md:self-auto">
          {[
            { id: "all", label: "Tous" },
            { id: "active", label: "Actifs" },
            { id: "completed", label: "Terminés" },
            { id: "disputed", label: "Litiges" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                filterStatus === tab.id 
                  ? "bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20" 
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Board */}
      {isAdminView ? (
        /* FOUNDER/ADMIN STATS GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-zinc-950/80 border border-zinc-800/80 rounded-[2rem] space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Contrats Actifs</p>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-sans font-black text-white tracking-tighter">{adminStats.active}</p>
            <div className="text-[10px] text-zinc-600 font-mono">Prêts & en cours de mission</div>
          </div>

          <div className="p-5 bg-zinc-950/80 border border-zinc-800/80 rounded-[2rem] space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-emerald-500 text-[9px] font-black uppercase tracking-widest">Missions Réussies</p>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-sans font-black text-white tracking-tighter">{adminStats.completed}</p>
            <div className="text-[10px] text-zinc-600 font-mono">{adminStats.cancelled} annulés</div>
          </div>

          <div className="p-5 bg-zinc-950/80 border border-zinc-800/80 rounded-[2rem] space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-red-500 text-[9px] font-black uppercase tracking-widest">Contrats en Litige</p>
              <ShieldAlert className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-2xl font-sans font-black text-white tracking-tighter">{adminStats.disputed}</p>
            <div className="text-[10px] text-zinc-600 font-mono">Nécessite arbitrage impérial</div>
          </div>

          <div className="p-5 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-[2rem] space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[#D4AF37] text-[9px] font-black uppercase tracking-widest">Paiements Bloqués</p>
              <Wallet className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <p className="text-2xl font-sans font-black text-white tracking-tighter">
              {adminStats.blockedPayments.toLocaleString()} <span className="text-xs font-mono">FCFA</span>
            </p>
            <div className="text-[10px] text-[#D4AF37]/60 font-mono">Sécurisés en séquestre (Escrow)</div>
          </div>

          <div className="sm:col-span-2 p-6 bg-gradient-to-r from-[#D4AF37]/10 to-zinc-950 border border-[#D4AF37]/35 rounded-[2.5rem] space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest">Commissions Afrigombo</p>
                <p className="text-3xl font-sans font-black text-white tracking-tighter mt-1">
                  {adminStats.commissions.toLocaleString()} <span className="text-sm font-mono text-zinc-400">FCFA</span>
                </p>
              </div>
              <div className="p-3 bg-[#D4AF37]/10 rounded-2xl">
                <TrendingUp className="w-6 h-6 text-[#D4AF37]" />
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 border-t border-[#D4AF37]/20 pt-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                Revenus journaliers : <strong className="text-white">{adminStats.dailyRevenue.toLocaleString()} FCFA</strong>
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD USER STATS GRID */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-[2rem] space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Total Contrats</p>
              <FileText className="w-4 h-4 text-zinc-600" />
            </div>
            <p className="text-2xl font-sans font-black text-white tracking-tighter">{userStats.total}</p>
          </div>
          <div className="p-6 bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded-[2rem] space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest">En Cours</p>
              <Clock className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <p className="text-2xl font-sans font-black text-white tracking-tighter">{userStats.active}</p>
          </div>
          <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Missions Réussies</p>
              <BadgeCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-sans font-black text-white tracking-tighter">{userStats.completed}</p>
          </div>
          <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-[2rem] space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Cachets Sécurisés</p>
              <Wallet className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-sans font-black text-white tracking-tighter">
              {userStats.revenue.toLocaleString()} <span className="text-xs">FCFA</span>
            </p>
          </div>
        </div>
      )}

      {/* Contracts List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
          <p className="afri-text-tiny text-zinc-600 uppercase">SÉCURISATION DU CENTRE...</p>
        </div>
      ) : filteredContracts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xs:gap-6">
          {filteredContracts.map((contract) => {
            const isClient = contract.clientId === currentUser.uid;
            const bInfo = getStatusBadge(contract.status);
            return (
              <motion.button
                layout
                key={contract.id}
                onClick={() => setSelectedContractId(contract.id)}
                className="afri-card group relative p-4 xs:p-6 text-left hover:border-[#D4AF37]/50 transition-all active:scale-[0.98] overflow-hidden"
              >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <ShieldCheck className="w-16 h-16 xs:w-24 xs:h-24 rotate-12" />
                </div>

                <div className="relative space-y-4 xs:space-y-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 xs:gap-2">
                        <FileSignature className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-[#D4AF37]" />
                        <span className="text-[#D4AF37] text-[9px] xs:text-[10px] font-mono font-bold tracking-widest uppercase truncate">#{contract.id.substring(0, 8)}</span>
                      </div>
                      <h3 className="text-sm xs:text-base text-white font-sans font-black tracking-tighter group-hover:text-[#D4AF37] transition-colors line-clamp-1">{contract.title}</h3>
                    </div>
                    <div className={`px-2 py-0.5 xs:px-2.5 xs:py-1 rounded-md text-[8px] xs:text-[9px] font-black uppercase tracking-widest border shrink-0 ${bInfo.color}`}>
                      {bInfo.label}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="space-y-0.5">
                      <p className="afri-text-tiny text-zinc-600">Client</p>
                      <p className="text-[10px] xs:text-[11px] text-zinc-300 font-bold truncate max-w-[100px] xs:max-w-[120px]">{contract.clientName}</p>
                    </div>
                    <div className="h-4 xs:h-6 w-px bg-zinc-850" />
                    <div className="space-y-0.5">
                      <p className="afri-text-tiny text-zinc-600">Artiste</p>
                      <p className="text-[10px] xs:text-[11px] text-zinc-300 font-bold truncate max-w-[100px] xs:max-w-[120px]">{contract.artistName}</p>
                    </div>
                    <div className="h-4 xs:h-6 w-px bg-zinc-850" />
                    <div className="space-y-0.5">
                      <p className="afri-text-tiny text-zinc-600">Cachet</p>
                      <p className="text-[10px] xs:text-[11px] text-white font-mono font-bold">{(contract.amount || 0).toLocaleString()} <span className="text-[8px]">FCFA</span></p>
                    </div>
                  </div>

                  {/* Arrival indicators & photo counters if any */}
                  {(contract.arrivalTime || (contract.presencePhotos && contract.presencePhotos.length > 0)) && (
                    <div className="p-3 bg-zinc-950/90 border border-zinc-850/60 rounded-xl flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      {contract.arrivalTime ? (
                        <span className="flex items-center gap-1 text-[#D4AF37]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                          Arrivé à {contract.arrivalTime}
                        </span>
                      ) : (
                        <span>Non arrivé</span>
                      )}
                      {contract.presencePhotos && contract.presencePhotos.length > 0 && (
                        <span className="text-emerald-400">
                          📸 {contract.presencePhotos.length} Photo{contract.presencePhotos.length > 1 ? "s" : ""} présence
                        </span>
                      )}
                    </div>
                  )}

                  <div className="pt-4 border-t border-zinc-900 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${contract.clientSignedAt ? "bg-emerald-500" : "bg-zinc-800"}`} />
                        <span className="text-zinc-500 text-[8px] font-bold uppercase">Signé Client</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${contract.artistSignedAt ? "bg-emerald-500" : "bg-zinc-800"}`} />
                        <span className="text-zinc-500 text-[8px] font-bold uppercase">Signé Artiste</span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-zinc-700 group-hover:text-[#D4AF37] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 space-y-4 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-[2.5rem]">
          <div className="p-4 bg-zinc-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-zinc-700" />
          </div>
          <div className="space-y-1">
            <h4 className="text-white font-bold">Aucun contrat trouvé</h4>
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Les contrats sécurisés d'engagement apparaîtront ici.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Reuse the Stamp component from GomboContractView
function Stamp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" />
      <path d="M30 50L45 65L70 35" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <text x="50" y="85" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="bold" fontFamily="sans-serif">SCELLÉ</text>
    </svg>
  );
}
