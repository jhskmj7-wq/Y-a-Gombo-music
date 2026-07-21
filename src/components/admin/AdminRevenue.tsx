import React from "react";
import { Landmark, TrendingUp, DollarSign, ArrowUpRight, List } from "lucide-react";
import { Transaction } from "../../types";

interface AdminRevenueProps {
  transactions: Transaction[];
  systemCommissionRate: number;
  audioSynth?: any;
}

export default function AdminRevenue({
  transactions = [],
  systemCommissionRate,
  audioSynth
}: AdminRevenueProps) {
  // Sum up all platform commissions
  const totalCommissionGenerated = transactions
    .filter((tx) => tx.type === "commission")
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  return (
    <div className="space-y-6 text-left pb-24 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-afri-border pb-4">
        <h3 className="text-xs font-mono uppercase font-black tracking-[0.15em] text-[#D4AF37] flex items-center gap-1.5">
          <Landmark className="w-4 h-4 text-[#D4AF37]" />
          Gestion Comptable & Caisse Réelle
        </h3>
        <p className="text-xs text-afri-text-sec mt-1">
          Suivi comptable en temps réel lié à l'Académie et aux transactions financières d'AFRIGOMBO.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-afri-bg-ter to-afri-bg border border-afri-border flex justify-between items-center">
          <div>
            <span className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest font-bold">Commissions totales perçues</span>
            <strong className="text-2xl font-display font-black text-afri-text block mt-2">
              {totalCommissionGenerated.toLocaleString("fr-FR")} FCFA
            </strong>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-afri-bg-ter to-afri-bg border border-afri-border flex justify-between items-center">
          <div>
            <span className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest font-bold">Taux de commission de caisse</span>
            <strong className="text-2xl font-display font-black text-[#D4AF37] block mt-2">
              {systemCommissionRate} %
            </strong>
          </div>
          <div className="w-10 h-10 bg-afri-bg-sec/10 border border-[#D4AF37]/20 rounded-xl flex items-center justify-center text-[#D4AF37]">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        <h4 className="text-xs font-mono uppercase font-black tracking-wider text-[#D4AF37] flex items-center gap-1.5">
          <List className="w-4 h-4" />
          Historique des Mouvements Financiers ({transactions.length})
        </h4>

        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="p-8 text-center bg-afri-bg/40 border border-afri-border rounded-2xl text-afri-text-sec text-xs font-mono">
              Aucune transaction financière enregistrée pour le moment.
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 bg-gradient-to-r from-afri-bg-action to-afri-bg border border-afri-border rounded-xl flex justify-between items-center gap-4 hover:border-afri-border transition-all text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-sans font-bold text-afri-text uppercase">{tx.description}</h5>
                    <span className="text-[9px] font-mono text-afri-text-sec block mt-1">
                      ID : {tx.id} • {tx.timestamp ? new Date(tx.timestamp).toLocaleString("fr-FR") : "Date inconnue"}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-black text-emerald-400 text-sm">
                    + {tx.amount.toLocaleString("fr-FR")} FCFA
                  </span>
                  <span className="text-[9px] font-mono text-afri-text-sec block uppercase font-bold mt-0.5">
                    Caisse {tx.type || "commission"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
