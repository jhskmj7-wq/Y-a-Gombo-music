import React from "react";
import { ShieldCheck, CheckCircle2, XCircle, FileCheck, Landmark } from "lucide-react";
import { User } from "../../types";

interface AdminGomboIDProps {
  users: User[];
  onApproveKyc?: (userId: string) => void;
  onRejectKyc?: (userId: string) => void;
  audioSynth?: any;
}

export default function AdminGomboID({
  users = [],
  onApproveKyc,
  onRejectKyc,
  audioSynth
}: AdminGomboIDProps) {
  const pendingKycUsers = users.filter((u) => u.kycStatus === "pending");

  const handleApprove = (userId: string) => {
    if (onApproveKyc) {
      onApproveKyc(userId);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    }
  };

  const handleReject = (userId: string) => {
    if (onRejectKyc) {
      onRejectKyc(userId);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    }
  };

  return (
    <div className="space-y-6 text-left pb-24 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-afri-border pb-4">
        <h3 className="text-xs font-mono uppercase font-black tracking-[0.15em] text-[#D4AF37] flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
          Validation Gombo ID & Certification
        </h3>
        <p className="text-xs text-afri-text-sec mt-1">
          Validez les dossiers de vérification d'identité des artistes d'AFRIGOMBO pour sécuriser les transactions.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-mono uppercase font-black tracking-wider text-[#D4AF37] flex items-center gap-1.5">
          <FileCheck className="w-3.5 h-3.5" />
          Dossiers en Attente de Certification ({pendingKycUsers.length})
        </h4>

        <div className="space-y-3">
          {pendingKycUsers.length === 0 ? (
            <div className="p-10 text-center bg-afri-bg/40 border border-afri-border rounded-2xl text-afri-text-sec text-xs font-mono">
              Aucun dossier Gombo ID en attente de validation.
            </div>
          ) : (
            pendingKycUsers.map((u) => (
              <div
                key={u.id}
                className="p-5 bg-gradient-to-br from-afri-bg-ter to-afri-bg border border-afri-border rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-[#D4AF37]/35 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-afri-bg-sec/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5 font-bold font-display text-lg">
                    {u.artisticName?.charAt(0) || u.name?.charAt(0) || "A"}
                  </div>
                  <div>
                    <h5 className="text-sm font-sans font-black text-afri-text">{u.artisticName || "Artiste Gombo"}</h5>
                    <span className="text-[10px] font-mono text-afri-text-sec block mt-0.5">{u.email}</span>
                    <div className="flex flex-wrap items-center gap-2.5 mt-2">
                      <span className="text-[9px] font-mono text-afri-text-sec uppercase bg-afri-bg-sec border border-afri-border px-2 py-0.5 rounded">
                        Commune : {u.commune || "Inconnue"}
                      </span>
                      {u.specialties && u.specialties.length > 0 && (
                        <span className="text-[9px] font-mono text-afri-text-sec uppercase bg-afri-bg-sec border border-afri-border px-2 py-0.5 rounded truncate max-w-[150px]">
                          Styles : {u.specialties.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    onClick={() => handleReject(u.id)}
                    className="flex-1 md:flex-none px-4 py-2 bg-red-950/20 hover:bg-red-900/30 border border-red-900/30 text-red-400 font-mono font-bold text-[10px] uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Rejeter
                  </button>
                  <button
                    onClick={() => handleApprove(u.id)}
                    className="flex-1 md:flex-none px-4 py-2 bg-emerald-950/20 hover:bg-emerald-900/30 border border-emerald-900/30 text-emerald-400 font-mono font-bold text-[10px] uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approuver
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
