import React from "react";
import SyncStatusBadge from "./SyncStatusBadge";
import { LayoutDashboard, MessageCircle, MapPin, CreditCard, Users, FileText, BadgeCheck, Star, BarChart2, Megaphone, Settings, FlaskConical, ShieldCheck } from "lucide-react";

interface AdminThroneDashboardProps {
  brief: any;
  setActiveMenu: (menu: string) => void;
}

export default function AdminThroneDashboard({ brief, setActiveMenu }: AdminThroneDashboardProps) {
  const menuItems = [
    { label: "Messagerie", id: "user_messages", icon: MessageCircle },
    { label: "Géolocalisation", id: "geolocalisation", icon: MapPin },
    { label: "Transactions", id: "admin_finances", icon: CreditCard },
    { label: "Utilisateurs", id: "users", icon: Users },
    { label: "Publications", id: "posts", icon: FileText },
    { label: "Gombo ID", id: "gombos", icon: BadgeCheck },
    { label: "Premium", id: "premium", icon: Star },
    { label: "Statistiques", id: "reports", icon: BarChart2 },
    { label: "Sondages", id: "sondages", icon: Megaphone },
    { label: "Labs", id: "afrigombo_labs", icon: FlaskConical },
    { label: "Beta Check", id: "beta_check", icon: ShieldCheck },
    { label: "Système", id: "settings", icon: Settings },
  ];

  return (
    <div className="p-4 space-y-6 animate-fadeIn">
      {/* Résumé & Statistiques */}
      <div className="flex justify-between items-center">
         <h2 className="text-sm font-black text-white uppercase">Tableau de Bord</h2>
         <SyncStatusBadge />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
          <p className="text-zinc-400 text-xs uppercase font-bold">Nouveaux Utilisateurs</p>
          <p className="text-2xl font-black text-white">{brief.newUsersCount}</p>
        </div>
        <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
          <p className="text-zinc-400 text-xs uppercase font-bold">Revenus Générés</p>
          <p className="text-2xl font-black text-white">{brief.revenuesGenerated.toLocaleString()} FCFA</p>
        </div>
      </div>

      {/* Raccourcis */}
      <div>
        <h2 className="text-sm font-black text-white uppercase mb-3">Centre de Pilotage</h2>
        <div className="grid grid-cols-2 gap-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className="flex items-center gap-3 p-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition border border-zinc-800"
            >
              <item.icon className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-xs font-bold text-white">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Alertes & Activité récente - placeholder for existing logic */}
      <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
          <h2 className="text-sm font-black text-white uppercase mb-2">Alertes & Activité</h2>
          <p className="text-xs text-zinc-500">Aucune alerte critique pour le moment.</p>
      </div>
    </div>
  );
}
