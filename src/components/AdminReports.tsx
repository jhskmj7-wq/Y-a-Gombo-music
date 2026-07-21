import React from "react";
import { AlertTriangle } from "lucide-react";

interface AdminReportsProps {
  alerts: any[];
}

export const AdminReports: React.FC<AdminReportsProps> = ({ alerts }) => {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-afri-bg-sec/5 border border-[#D4AF37]/20 rounded-lg text-xs leading-relaxed">
        Surveillance géolocalisée et notifications critiques provenant des communes principales d'Abidjan (Yopougon, Cocody, Marcory, etc.).
      </div>

      <div className="space-y-3">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`p-5 rounded-lg border ${alert.severity === "high" ? "border-red-500/30 bg-red-500/5" : "border-[#D4AF37]/20 bg-afri-bg-sec"} flex justify-between items-center`}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-5 h-5 ${alert.severity === "high" ? "text-[#EF4444]" : "text-[#D4AF37]"}`} />
              <div>
                <span className="font-display font-bold text-sm block">
                  Mégaphone Alerte - Artiste {alert.userArtisticName}
                </span>
                <span className="text-xs text-afri-text/70">{alert.reason}</span>
              </div>
            </div>

            <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-mono font-semibold ${alert.severity === "high" ? "bg-red-500 text-afri-text" : "bg-afri-bg-sec/10 text-[#D4AF37]"}`}>
              {alert.severity} priorité
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminReports;
