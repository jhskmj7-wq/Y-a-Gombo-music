import React, { useState } from "react";
import { Crown, ShieldCheck, UserPlus, UserX, Info, ShieldAlert } from "lucide-react";

interface AdminFounderThroneProps {
  founders: string[];
  superAdmins: string[];
  adminEmail: string;
  isAuthorizedSuperFounder: boolean;
  onUpdateThroneConfig?: (newFounders: string[], newSuperAdmins: string[]) => void;
  audioSynth?: any;
}

export default function AdminFounderThrone({
  founders = [],
  superAdmins = [],
  adminEmail,
  isAuthorizedSuperFounder,
  onUpdateThroneConfig,
  audioSynth
}: AdminFounderThroneProps) {
  const [newFounderInput, setNewFounderInput] = useState("");
  const [newAdminInput, setNewAdminInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleAddFounder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorizedSuperFounder) {
      setErrorMsg("Seul le Souverain Fondateur en Chef a l'autorisation de modifier le Trône.");
      return;
    }
    const cleanEmail = newFounderInput.trim().toLowerCase();
    if (!cleanEmail) return;

    if (founders.includes(cleanEmail)) {
      setErrorMsg("Cet email est déjà membre du Trône Fondateur.");
      return;
    }

    const updated = [...founders, cleanEmail];
    if (onUpdateThroneConfig) {
      onUpdateThroneConfig(updated, superAdmins);
      setSuccessMsg(`Membre Fondateur ajouté : ${cleanEmail}`);
      setNewFounderInput("");
      setErrorMsg("");
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    }
  };

  const handleAddSuperAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorizedSuperFounder) {
      setErrorMsg("Seul le Souverain Fondateur en Chef a l'autorisation de modifier le Trône.");
      return;
    }
    const cleanEmail = newAdminInput.trim().toLowerCase();
    if (!cleanEmail) return;

    if (superAdmins.includes(cleanEmail)) {
      setErrorMsg("Cet email est déjà Administrateur Principal.");
      return;
    }

    const updated = [...superAdmins, cleanEmail];
    if (onUpdateThroneConfig) {
      onUpdateThroneConfig(founders, updated);
      setSuccessMsg(`Administrateur Principal ajouté : ${cleanEmail}`);
      setNewAdminInput("");
      setErrorMsg("");
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    }
  };

  const handleRemoveFounder = (email: string) => {
    if (!isAuthorizedSuperFounder) return;
    if (email === "johnsylvesterh@gmail.com") {
      setErrorMsg("Le Fondateur Suprême ne peut être retiré du Trône.");
      return;
    }

    const updated = founders.filter((e) => e !== email);
    if (onUpdateThroneConfig) {
      onUpdateThroneConfig(updated, superAdmins);
      setSuccessMsg(`Fondateur retiré : ${email}`);
      setErrorMsg("");
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    }
  };

  const handleRemoveSuperAdmin = (email: string) => {
    if (!isAuthorizedSuperFounder) return;
    const updated = superAdmins.filter((e) => e !== email);
    if (onUpdateThroneConfig) {
      onUpdateThroneConfig(founders, updated);
      setSuccessMsg(`Super Admin retiré : ${email}`);
      setErrorMsg("");
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    }
  };

  return (
    <div className="space-y-6 text-left pb-24 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-white/5 pb-4 flex justify-between items-center">
        <div>
          <h3 className="text-xs font-mono uppercase font-black tracking-[0.15em] text-[#D4AF37] flex items-center gap-1.5">
            <Crown className="w-5 h-5 text-[#D4AF37]" />
            Le Trône Fondateur d'AFRIGOMBO
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Souveraineté suprême, gestion des privilèges d'administration et de fondation.
          </p>
        </div>

        <span className="text-[9px] font-mono text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/35 rounded px-2.5 py-1 uppercase font-bold">
          Souverain: johnsylvesterh@gmail.com
        </span>
      </div>

      {/* Info Warning */}
      <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-300 leading-relaxed">
          <strong>Accès Sécurisé :</strong> Les modifications sur les membres fondateurs et super admins sont réservées exclusivement au compte fondateur officiel de l'infrastructure AFRIGOMBO (jhs.kmj7@gmail.com).
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
          <Info className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Founders */}
        <div className="p-6 bg-[#070707] border border-zinc-900 rounded-2xl space-y-4">
          <h4 className="text-xs font-mono uppercase font-black tracking-wider text-white flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-[#D4AF37]" />
            Membres du Trône Fondateur ({founders.length})
          </h4>

          <div className="space-y-2">
            {founders.map((email) => (
              <div
                key={email}
                className="p-3 bg-black border border-zinc-900 rounded-xl flex justify-between items-center text-xs"
              >
                <span className="font-mono text-zinc-300">{email}</span>
                {isAuthorizedSuperFounder && email !== "johnsylvesterh@gmail.com" && (
                  <button
                    onClick={() => handleRemoveFounder(email)}
                    className="p-1 text-red-400 hover:text-red-500 transition-colors"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {isAuthorizedSuperFounder && (
            <form onSubmit={handleAddFounder} className="flex gap-2 pt-2 border-t border-zinc-900">
              <input
                type="email"
                placeholder="Ajouter un email de fondateur..."
                value={newFounderInput}
                onChange={(e) => setNewFounderInput(e.target.value)}
                className="flex-1 bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-all"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#D4AF37] text-black rounded-xl font-bold text-xs uppercase flex items-center gap-1 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Ajouter
              </button>
            </form>
          )}
        </div>

        {/* Super Admins */}
        <div className="p-6 bg-[#070707] border border-zinc-900 rounded-2xl space-y-4">
          <h4 className="text-xs font-mono uppercase font-black tracking-wider text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Administrateurs Principaux ({superAdmins.length})
          </h4>

          <div className="space-y-2">
            {superAdmins.map((email) => (
              <div
                key={email}
                className="p-3 bg-black border border-zinc-900 rounded-xl flex justify-between items-center text-xs"
              >
                <span className="font-mono text-zinc-300">{email}</span>
                {isAuthorizedSuperFounder && (
                  <button
                    onClick={() => handleRemoveSuperAdmin(email)}
                    className="p-1 text-red-400 hover:text-red-500 transition-colors"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {isAuthorizedSuperFounder && (
            <form onSubmit={handleAddSuperAdmin} className="flex gap-2 pt-2 border-t border-zinc-900">
              <input
                type="email"
                placeholder="Ajouter un super administrateur..."
                value={newAdminInput}
                onChange={(e) => setNewAdminInput(e.target.value)}
                className="flex-1 bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-all"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#D4AF37] text-black rounded-xl font-bold text-xs uppercase flex items-center gap-1 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Ajouter
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
