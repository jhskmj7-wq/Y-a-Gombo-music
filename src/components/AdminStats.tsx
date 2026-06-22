import React, { useMemo } from "react";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from "recharts";
import { Users } from "lucide-react";
import { User, Gombo, Transaction } from "../types";

interface AdminStatsProps {
  users?: User[];
  gombos?: Gombo[];
  transactions?: Transaction[];
  onBack?: () => void;
}

export const AdminStats: React.FC<AdminStatsProps> = ({ users = [], gombos = [], transactions = [], onBack }) => {
  const chartData = useMemo(() => {
    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const now = new Date();
    const result = Array.from({ length: 7 }).reverse().map((_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      return {
        name: days[d.getDay()],
        dateStr: d.toISOString().split("T")[0],
        commission: 0,
        registres: 0,
      };
    }).reverse();

    users.forEach(u => {
      if (!u.joinDate) return;
      const jDate = u.joinDate.split("T")[0];
      const match = result.find(r => r.dateStr === jDate);
      if (match) match.registres += 1;
    });

    transactions.forEach(t => {
      if (!t.date) return;
      const tDate = t.date.split("T")[0];
      const match = result.find(r => r.dateStr === tDate);
      if (match && t.type === "commission_plateforme") {
        match.commission += t.amount;
      }
    });

    return result;
  }, [users, transactions]);

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      <div className="p-5 rounded-lg bg-black/40 border border-[#D4AF37]/20">
        <h4 className="text-xs uppercase font-mono text-[#D4AF37] tracking-wider mb-4">
          Revenus & Enregistrements de la semaine (Par jour)
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCommissionMod" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="name" stroke="#555" fontSize={11} tickLine={false} />
              <YAxis stroke="#555" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#0B0B0B", borderColor: "#D4AF37" }} labelClassName="text-[#D4AF37]" />
              <Area type="monotone" dataKey="commission" stroke="#D4AF37" fillOpacity={1} fill="url(#colorCommissionMod)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-lg border border-[#D4AF37]/10 bg-[#0B0B0B]">
          <h5 className="text-xs font-mono uppercase tracking-wider text-[#D4AF37] mb-3">Participation par Commune</h5>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span>Cocody</span>
              <span>45%</span>
            </div>
            <div className="w-full bg-[#D4AF37]/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#D4AF37] h-full" style={{ width: "45%" }} />
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span>Yopougon</span>
              <span>35%</span>
            </div>
            <div className="w-full bg-[#D4AF37]/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#D4AF37] h-full" style={{ width: "35%" }} />
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span>Marcory</span>
              <span>20%</span>
            </div>
            <div className="w-full bg-[#D4AF37]/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#D4AF37] h-full" style={{ width: "20%" }} />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-lg border border-[#D4AF37]/10 bg-[#0B0B0B]">
          <h5 className="text-xs font-mono uppercase tracking-wider text-[#D4AF37] mb-3">Répartition des Instruments</h5>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span>Chant & Chœur</span>
              <span>50%</span>
            </div>
            <div className="w-full bg-[#D4AF37]/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#D4AF37] h-full" style={{ width: "50%" }} />
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span>Clavierist / Piano</span>
              <span>30%</span>
            </div>
            <div className="w-full bg-[#D4AF37]/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#D4AF37] h-full" style={{ width: "30%" }} />
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span>Guitare & Basse</span>
              <span>20%</span>
            </div>
            <div className="w-full bg-[#D4AF37]/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#D4AF37] h-full" style={{ width: "20%" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
