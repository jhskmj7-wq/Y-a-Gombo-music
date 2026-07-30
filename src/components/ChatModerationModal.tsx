import React, { useState } from "react";
import { motion } from "motion/react";
import { ShieldAlert, Ban, Trash2, X, Check, AlertTriangle, ShieldCheck } from "lucide-react";
import { reportUserOrConvo, blockUser, unblockUser } from "../lib/chatModerationEngine";

interface ChatModerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUid: string;
  currentName: string;
  partnerUid: string;
  partnerName: string;
  convoId: string;
  isBlocked?: boolean;
  onDeleteConversation?: () => void;
}

export function ChatModerationModal({
  isOpen,
  onClose,
  currentUid,
  currentName,
  partnerUid,
  partnerName,
  convoId,
  isBlocked = false,
  onDeleteConversation
}: ChatModerationModalProps) {
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blockedState, setBlockedState] = useState(isBlocked);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason) return;

    setIsSubmitting(true);
    try {
      await reportUserOrConvo({
        reporterUid: currentUid,
        reporterName: currentName,
        targetUid: partnerUid,
        targetName: partnerName,
        convoId,
        reason: reportReason,
        details: reportDetails
      });
      setSuccessMsg("Signalement transmis aux Fondateurs avec succès.");
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 2000);
    } catch (err) {
      alert("Erreur lors du signalement: " + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBlock = async () => {
    try {
      if (blockedState) {
        await unblockUser(currentUid, partnerUid);
        setBlockedState(false);
        setSuccessMsg("Utilisateur débloqué.");
      } else {
        await blockUser(currentUid, partnerUid);
        setBlockedState(true);
        setSuccessMsg("Utilisateur bloqué.");
      }
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch (err) {
      alert("Erreur de blocage: " + err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl text-white relative"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-rose-950/40 via-zinc-900 to-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Modération & Sécurité
              </h3>
              <p className="text-[10px] text-zinc-400 font-mono">Espace Protégé AFRIGOMBO</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-xs text-emerald-400">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* User Status Card */}
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">{partnerName}</p>
              <p className="text-[10px] text-zinc-400 font-mono">Membre AFRIGOMBO</p>
            </div>
            <button
              onClick={handleToggleBlock}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                blockedState
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>{blockedState ? "Débloquer" : "Bloquer"}</span>
            </button>
          </div>

          {/* Delete Conversation Option */}
          {onDeleteConversation && (
            <button
              onClick={() => {
                if (window.confirm("Voulez-vous masquer cette conversation ?")) {
                  onDeleteConversation();
                  onClose();
                }
              }}
              className="w-full py-2.5 bg-zinc-900 border border-zinc-800 hover:border-rose-500/50 text-rose-400 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Supprimer ou masquer la conversation</span>
            </button>
          )}

          {/* Form Signalement */}
          <form onSubmit={handleReport} className="space-y-3 pt-2 border-t border-zinc-800">
            <label className="text-xs font-bold text-zinc-300 block">Signaler un comportement inapproprié</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
              required
            >
              <option value="">-- Choisir un motif --</option>
              <option value="num_hors_plateforme">Propose un numéro ou paiement hors plateforme</option>
              <option value="propos_injurieux">Propos injurieux ou irrespectueux</option>
              <option value="non_respect_engagement">Non-respect d'un contrat ou engagement</option>
              <option value="usurpation_spam">Usurpation d'identité ou Spam</option>
            </select>

            <textarea
              placeholder="Précisions complémentaires (facultatif)..."
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              rows={3}
              className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500"
            />

            <button
              type="submit"
              disabled={isSubmitting || !reportReason}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-600/20"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Envoyer le signalement</span>
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
