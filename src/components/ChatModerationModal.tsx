import React, { useState } from "react";
import { ShieldAlert, Ban, Trash2, Check } from "lucide-react";
import { reportUserOrConvo, blockUser, unblockUser } from "../lib/chatModerationEngine";
import { AndroidBottomSheet } from "./common/AfriModal";

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
    <AndroidBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Modération & Sécurité"
    >
      <div className="space-y-4 py-1 text-left">
        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-xs text-emerald-400">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* User Status Card */}
        <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-afri-text">{partnerName}</p>
            <p className="text-[10px] text-afri-text-sec font-mono">Membre AFRIGOMBO ELITE</p>
          </div>
          <button
            onClick={handleToggleBlock}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 touch-manipulation ${
              blockedState
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
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
            className="w-full min-h-[48px] bg-afri-bg-sec border border-afri-border text-rose-400 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 touch-manipulation"
          >
            <Trash2 className="w-4 h-4" />
            <span>Supprimer ou masquer la conversation</span>
          </button>
        )}

        {/* Form Signalement */}
        <form onSubmit={handleReport} className="space-y-3 pt-2 border-t border-afri-border">
          <label className="text-xs font-bold text-afri-text-sec block">Signaler un comportement inapproprié</label>
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full min-h-[48px] p-3 bg-afri-bg-sec border border-afri-border rounded-2xl text-[15px] sm:text-xs text-afri-text focus:outline-none focus:border-rose-500"
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
            className="w-full p-3 bg-afri-bg-sec border border-afri-border rounded-2xl text-[15px] sm:text-xs text-afri-text placeholder:text-afri-text-muted focus:outline-none focus:border-rose-500"
          />

          <button
            type="submit"
            disabled={isSubmitting || !reportReason}
            className="w-full min-h-[50px] bg-rose-600 hover:bg-rose-500 disabled:bg-afri-bg-ter text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 touch-manipulation"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Envoyer le signalement</span>
          </button>
        </form>
      </div>
    </AndroidBottomSheet>
  );
}
