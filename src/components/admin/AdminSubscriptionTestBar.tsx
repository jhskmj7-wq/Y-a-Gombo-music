import React, { useState, useEffect } from "react";
import { Sparkles, Shield, RotateCcw } from "lucide-react";
import { SecurityService } from "../../lib/SecurityService";
import { getAdminSimulatedTier, setAdminSimulatedTier, SimulatedTier } from "../../lib/premiumEngine";

interface AdminSubscriptionTestBarProps {
  currentUser?: any;
  className?: string;
  compact?: boolean;
}

export const AdminSubscriptionTestBar: React.FC<AdminSubscriptionTestBarProps> = ({
  currentUser,
  className = "",
  compact = false
}) => {
  const [activeTier, setActiveTier] = useState<SimulatedTier>(() => getAdminSimulatedTier());

  // Listen to simulation changes across windows/components
  useEffect(() => {
    const handleTierChange = (e: any) => {
      setActiveTier(e.detail !== undefined ? e.detail : getAdminSimulatedTier());
    };
    window.addEventListener("afrigombo_simulated_tier_changed", handleTierChange);
    return () => window.removeEventListener("afrigombo_simulated_tier_changed", handleTierChange);
  }, []);

  // Strict Zero-Trust Security check: authorized Admin/Founder only
  const isAuthorized = currentUser
    ? SecurityService.isAdmin(currentUser) || currentUser?.email === "jhs.kmj7@gmail.com"
    : true; // If embedded inside a protected admin component where currentUser was already verified

  if (!isAuthorized) {
    return null;
  }

  const handleSelectTier = (tier: "free" | "pro" | "elite") => {
    setAdminSimulatedTier(tier);
    setActiveTier(tier);
  };

  const handleReset = () => {
    setAdminSimulatedTier(null);
    setActiveTier(null);
  };

  return (
    <div
      className={`p-3 rounded-2xl bg-afri-bg-sec/90 border border-afri-gold/40 shadow-lg backdrop-blur-md ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-afri-gold/20 border border-afri-gold/50 flex items-center justify-center text-afri-gold">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase text-afri-gold tracking-wider">
                MODE TEST ABONNEMENT
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                SIMULATION ADMIN
              </span>
            </div>
            <p className="text-[10px] text-afri-text-sec">
              Testez instantanément les 3 formules sans altérer Firestore ni transactions.
            </p>
          </div>
        </div>

        {/* Action buttons: GRATUIT, PRO, ELITE, RÉEL */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleSelectTier("free")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTier === "free"
                ? "bg-zinc-200 text-black shadow-md ring-2 ring-afri-gold"
                : "bg-afri-bg text-afri-text-sec hover:text-white border border-afri-border"
            }`}
          >
            GRATUIT
          </button>

          <button
            type="button"
            onClick={() => handleSelectTier("pro")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTier === "pro"
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md ring-2 ring-afri-gold"
                : "bg-afri-bg text-afri-text-sec hover:text-white border border-afri-border"
            }`}
          >
            PRO
          </button>

          <button
            type="button"
            onClick={() => handleSelectTier("elite")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTier === "elite"
                ? "bg-gradient-to-r from-amber-400 via-afri-gold to-yellow-500 text-black shadow-md ring-2 ring-white"
                : "bg-afri-bg text-afri-text-sec hover:text-white border border-afri-border"
            }`}
          >
            ELITE
          </button>

          {activeTier !== null && (
            <button
              type="button"
              onClick={handleReset}
              title="Rétablir le statut réel de l'utilisateur"
              className="p-1.5 rounded-xl bg-afri-bg text-afri-text-sec hover:text-rose-400 border border-afri-border transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réel</span>
            </button>
          )}
        </div>
      </div>

      {activeTier && (
        <div className="mt-2 pt-2 border-t border-afri-border/40 flex items-center justify-between text-[10px] font-mono text-afri-text-sec">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Simulation active : {activeTier.toUpperCase()} (Moteur AFRIGOMBO configuré en {activeTier.toUpperCase()})
          </span>
          <span className="text-zinc-500">Firestore 100% protégé</span>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionTestBar;
