import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ShieldCheck, Zap, MessageSquare, AlertCircle, Check } from "lucide-react";
import { UserProfile } from "../types";
import { supportConfig } from "../supportConfig";
import { validateAndPublishWithCode } from "../lib/validationCodeEngine";
import { audioSynth } from "../lib/audio";

interface PendingPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    title: string;
    budget?: number;
    collectionName?: string;
  } | null;
  currentUserProfile: UserProfile;
  onSuccess?: () => void;
}

export const PendingPaymentModal: React.FC<PendingPaymentModalProps> = ({
  isOpen,
  onClose,
  post,
  currentUserProfile,
  onSuccess
}) => {
  const [enteredCode, setEnteredCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen || !post) return null;

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredCode.trim()) {
      setErrorMsg("Veuillez entrer votre code de validation.");
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await validateAndPublishWithCode(
        enteredCode,
        post.id,
        currentUserProfile.uid || currentUserProfile.id
      );

      if (res.success) {
        setSuccessMsg(res.message);
        try { audioSynth.playValidationSuccess(); } catch (_) {}
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1500);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg("Une erreur est survenue lors de la vérification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-afri-bg dark:bg-afri-bg-sec border border-[#D4AF37]/40 rounded-3xl p-5 sm:p-6 text-afri-text shadow-[0_0_40px_rgba(212,175,55,0.2)] overflow-hidden"
        >
          {/* Top Gold Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D4AF37] via-amber-400 to-[#D4AF37]" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full bg-afri-bg-ter text-afri-text-sec hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="text-center space-y-2 pt-2">
            <div className="w-12 h-12 mx-auto bg-amber-500/10 border border-[#D4AF37] rounded-2xl flex items-center justify-center text-2xl shadow-md shadow-[#D4AF37]/20">
              🛡️
            </div>
            <span className="inline-block text-[10px] font-mono font-black text-[#D4AF37] uppercase tracking-widest bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/30">
              🟡 EN ATTENTE DE PAIEMENT
            </span>
            <h3 className="text-lg font-black uppercase text-afri-text tracking-tight">
              Publication de gombo en attente de paiement
            </h3>
            <p className="text-xs text-afri-text-sec">
              Finalisez votre paiement pour rendre ce gombo immédiatement visible sur Le Terrain.
            </p>
          </div>

          {/* Details Card */}
          <div className="mt-4 bg-afri-bg/80 border border-afri-border rounded-xl p-3.5 space-y-2 text-left">
            <div className="flex justify-between items-center text-xs">
              <span className="text-afri-text-sec">Titre :</span>
              <span className="font-bold text-afri-text truncate max-w-[200px]">{post.title}</span>
            </div>
            {post.budget !== undefined && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-afri-text-sec">Cachet :</span>
                <span className="font-mono font-bold text-[#D4AF37]">{post.budget.toLocaleString()} FCFA</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs">
              <span className="text-afri-text-sec">Réf ID :</span>
              <span className="font-mono text-[10px] bg-afri-bg px-2 py-0.5 rounded text-afri-text-sec">{post.id}</span>
            </div>
          </div>

          {/* WhatsApp Support Button */}
          <div className="mt-4 space-y-1.5">
            <button
              type="button"
              onClick={() => {
                supportConfig.openSupport(`Bonjour, je souhaite finaliser le paiement pour le Gombo : "${post.title}" (Réf: ${post.id}).`);
              }}
              className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-black font-black text-xs uppercase rounded-xl transition-all shadow-md shadow-[#25D366]/20 cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <MessageSquare className="w-4 h-4 fill-black" />
              <span>Contacter le service client (WhatsApp)</span>
            </button>
            <p className="text-[10px] text-center text-afri-text-sec">
              Recevez votre code de validation auprès du Support après paiement.
            </p>
          </div>

          {/* Code Input Form */}
          <div className="mt-4 bg-afri-bg/60 border border-[#D4AF37]/30 rounded-2xl p-3.5 text-left space-y-2">
            <label className="block text-[11px] font-black uppercase text-[#D4AF37] tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#D4AF37]" /> Saisir le Code de Validation
            </label>
            <p className="text-[10px] text-afri-text-sec">
              Entrez le code unique transmis par le Support pour débloquer votre publication.
            </p>
            <form onSubmit={handleValidateCode} className="space-y-2 pt-1">
              <input
                type="text"
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
                placeholder="Ex: AG-849201"
                className="w-full bg-afri-bg border border-afri-border focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold tracking-wider text-afri-text uppercase outline-none"
              />

              {errorMsg && (
                <div className="text-[10px] text-red-400 font-bold bg-red-950/40 p-2 rounded-lg border border-red-900/60 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 p-2 rounded-lg border border-emerald-900/60 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !enteredCode.trim()}
                className="w-full py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-black text-xs uppercase rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-[#D4AF37]/20"
              >
                {loading ? "Vérification..." : "⚡ Valider et Publier"}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
