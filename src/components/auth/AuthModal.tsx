import React, { useState } from "react";
import { X, Shield, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { signInWithGoogle, signInWithApple, signInWithFacebook } from "../../auth/authService";
import { motion, AnimatePresence } from "motion/react";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export function AuthModal({ 
  open, 
  onClose, 
  title = "Connexion Sécurisée", 
  subtitle = "Rejoignez l'élite du showbiz et de la culture" 
}: AuthModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facebookNotice, setFacebookNotice] = useState<boolean>(false);

  if (!open) return null;

  const handleGoogle = async () => {
    try {
      setLoading("google");
      setErrorMsg(null);
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setErrorMsg("Erreur lors de la connexion Google. Veuillez réessayer.");
      }
    } finally {
      setLoading(null);
    }
  };

  const handleApple = async () => {
    try {
      setLoading("apple");
      setErrorMsg(null);
      await signInWithApple();
      onClose();
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setErrorMsg("Erreur lors de la connexion Apple. Veuillez réessayer.");
      }
    } finally {
      setLoading(null);
    }
  };

  const handleFacebook = async () => {
    try {
      setLoading("facebook");
      setErrorMsg(null);
      await signInWithFacebook();
    } catch (err: any) {
      if (err.message === "FACEBOOK_COMING_SOON") {
        setFacebookNotice(true);
        setTimeout(() => setFacebookNotice(false), 4000);
      } else {
        setErrorMsg("Facebook sera bientôt disponible.");
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-zinc-950 border border-[#D4AF37]/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6 text-left overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-amber-600 flex items-center justify-center text-zinc-950 shadow-lg shadow-[#D4AF37]/20">
              <Crown className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-display font-black text-white tracking-wide">{title}</h3>
              <p className="text-xs text-zinc-400 font-mono">{subtitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-red-400 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {facebookNotice && (
          <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-amber-300 font-mono animate-in fade-in">
            <Sparkles className="w-4 h-4 shrink-0 text-[#D4AF37]" />
            <span>Facebook sera bientôt disponible.</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          {/* Google Option */}
          <button
            onClick={handleGoogle}
            disabled={loading !== null}
            className="w-full py-3.5 px-4 bg-white hover:bg-zinc-100 text-zinc-900 font-sans font-bold rounded-2xl transition-all duration-200 shadow-lg flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>{loading === "google" ? "Connexion Google en cours..." : "Continuer avec Google"}</span>
          </button>

          {/* Apple Option */}
          <button
            onClick={handleApple}
            disabled={loading !== null}
            className="w-full py-3.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white font-sans font-bold rounded-2xl border border-zinc-800 transition-all duration-200 shadow-lg flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2..77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.35c.65-.79 1.09-1.89.97-2.99-.94.04-2.08.63-2.74 1.42-.58.68-1.1 1.79-.96 2.88 1.05.08 2.11-.51 2.73-1.31z"/>
            </svg>
            <span>{loading === "apple" ? "Connexion Apple en cours..." : "Continuer avec Apple"}</span>
          </button>

          {/* Facebook Option */}
          <button
            onClick={handleFacebook}
            disabled={loading !== null}
            className="w-full py-3.5 px-4 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 font-sans font-semibold rounded-2xl border border-zinc-800/80 transition-all duration-200 flex items-center justify-between px-5 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 fill-blue-500" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Continuer avec Facebook</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
              Bientôt disponible
            </span>
          </button>
        </div>

        <div className="text-center pt-2">
          <p className="text-[11px] text-zinc-500 font-mono">
            En continuant, vous acceptez les conditions générales d'utilisation d'Afrigombo Elite.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// Helper Crown icon if not imported from lucide-react
function Crown(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5z" />
    </svg>
  );
}
