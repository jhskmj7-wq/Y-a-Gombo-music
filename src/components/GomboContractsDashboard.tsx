import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  FileText, ShieldCheck, CheckCircle2, Clock, 
  AlertTriangle, Search, Filter, ArrowUpRight,
  TrendingUp, Wallet, BadgeCheck, FileSignature,
  Loader2
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

  useEffect(() => {
    loadContracts();
  }, [currentUser.uid]);

  const loadContracts = async () => {
    if (!currentUser.uid) return;
    setLoading(true);
    let data: GomboSafeContract[] = [];
    if (currentUser.role === 'admin' || currentUser.isAdmin) {
      data = await gomboDB.getAllContracts();
    } else {
      data = await gomboDB.getContractsForUser(currentUser.uid);
    }
    setContracts(data);
    setLoading(false);
  };

  const filteredContracts = contracts.filter(c => {
    if (filterStatus === "all") return true;
    if (filterStatus === "active") return !["completed", "archived", "cancelled", "disputed"].includes(c.status);
    if (filterStatus === "completed") return c.status === "completed";
    if (filterStatus === "disputed") return c.status === "disputed";
    return c.status === filterStatus;
  });

  const stats = {
    total: contracts.length,
    active: contracts.filter(c => !["completed", "archived", "cancelled"].includes(c.status)).length,
    completed: contracts.filter(c => c.status === "completed").length,
    revenue: contracts.filter(c => c.status === "completed").reduce((acc, c) => acc + (c.artistId === currentUser.uid ? c.totalArtistReceives : 0), 0)
  };

  if (selectedContractId) {
    return (
      <GomboContractView 
        contractId={selectedContractId} 
        currentUser={currentUser} 
        onBack={() => setSelectedContractId(null)}
        onUpdate={loadContracts}
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-sans font-black text-white uppercase tracking-tighter">CONTRATS AFRIGOMBO</h2>
          <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Gérez vos engagements sécurisés et vos paiements</p>
        </div>

        <div className="flex items-center gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
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

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-[2rem] space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Total Contrats</p>
            <FileText className="w-4 h-4 text-zinc-600" />
          </div>
          <p className="text-2xl font-sans font-black text-white tracking-tighter">{stats.total}</p>
        </div>
        <div className="p-6 bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded-[2rem] space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest">En Cours</p>
            <Clock className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <p className="text-2xl font-sans font-black text-white tracking-tighter">{stats.active}</p>
        </div>
        <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Missions Réussies</p>
            <BadgeCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-sans font-black text-white tracking-tighter">{stats.completed}</p>
        </div>
        <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-[2rem] space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Volume Financier</p>
            <Wallet className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-sans font-black text-white tracking-tighter">{stats.revenue.toLocaleString()} <span className="text-xs">FCFA</span></p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
          <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest">Sécurisation des données...</p>
        </div>
      ) : filteredContracts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredContracts.map((contract) => {
            const isClient = contract.clientId === currentUser.uid;
            return (
              <motion.button
                layout
                key={contract.id}
                onClick={() => setSelectedContractId(contract.id)}
                className="group relative bg-[#080808] border border-zinc-800 rounded-3xl p-6 text-left hover:border-[#D4AF37]/50 transition-all active:scale-[0.98] overflow-hidden"
              >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Stamp className="w-24 h-24 rotate-12" />
                </div>

                <div className="relative space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileSignature className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-[#D4AF37] text-[10px] font-mono font-bold tracking-widest uppercase">{contract.id}</span>
                      </div>
                      <h3 className="text-white font-sans font-black tracking-tighter group-hover:text-[#D4AF37] transition-colors">{contract.title}</h3>
                    </div>
                    <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-zinc-900 border border-zinc-800`}>
                      {contract.status}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="space-y-1">
                      <p className="text-zinc-600 text-[8px] font-bold uppercase tracking-widest">{isClient ? "Artiste" : "Client"}</p>
                      <p className="text-zinc-300 text-[11px] font-bold">{isClient ? contract.artistName : contract.clientName}</p>
                    </div>
                    <div className="h-6 w-px bg-zinc-800" />
                    <div className="space-y-1">
                      <p className="text-zinc-600 text-[8px] font-bold uppercase tracking-widest">Montant</p>
                      <p className="text-white text-[11px] font-mono font-bold">{contract.amount.toLocaleString()} FCFA</p>
                    </div>
                    <div className="h-6 w-px bg-zinc-800" />
                    <div className="space-y-1">
                      <p className="text-zinc-600 text-[8px] font-bold uppercase tracking-widest">Date</p>
                      <p className="text-zinc-400 text-[11px] font-mono">{contract.date || "--/--/--"}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-900 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${contract.clientSignedAt ? "bg-emerald-500" : "bg-zinc-800"}`} />
                        <span className="text-zinc-500 text-[8px] font-bold uppercase">Client</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${contract.artistSignedAt ? "bg-emerald-500" : "bg-zinc-800"}`} />
                        <span className="text-zinc-500 text-[8px] font-bold uppercase">Artiste</span>
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
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Vos futurs contrats apparaîtront ici dès que vous serez engagé.</p>
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
