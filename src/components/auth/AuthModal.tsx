import React, { useState } from "react";
import { Sparkles, AlertCircle, X, Check } from "lucide-react";
import { signInWithGoogle, signInWithApple } from "../../auth/authService";
import { AUTH_PROVIDERS_CONFIG, AUTH_POPUP_DEFAULT_TEXTS } from "./authConfig";
import { motion, AnimatePresence } from "motion/react";

export interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
  dismissText?: string;
}

export function AuthModal({
  open,
  onClose,
  onSuccess,
  title = AUTH_POPUP_DEFAULT_TEXTS.title,
  subtitle = AUTH_POPUP_DEFAULT_TEXTS.subtitle,
  dismissText = AUTH_POPUP_DEFAULT_TEXTS.dismissText,
}: AuthModalProps) {
  const [loadingProvider, setLoadingProvider] = useState<"google" | "apple" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facebookNotice, setFacebookNotice] = useState<boolean>(false);

  if (!open) return null;

  const handleGoogle = async () => {
    try {
      setLoadingProvider("google");
      setErrorMsg(null);
      const res = await signInWithGoogle();
      if (res && res.uid) {
        onSuccess?.();
        onClose();
      } else {
        // Redirect initiated or returned null without error
        onClose();
      }
    } catch (err: any) {
      console.error("Google Auth error in AuthModal:", err);
      if (
        err?.code !== "auth/popup-closed-by-user" &&
        err?.code !== "auth/cancelled-popup-request"
      ) {
        setErrorMsg(
          err?.message || "Erreur lors de la connexion Google. Veuillez réessayer."
        );
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleApple = async () => {
    try {
      setLoadingProvider("apple");
      setErrorMsg(null);
      const res = await signInWithApple();
      if (res && res.uid) {
        onSuccess?.();
        onClose();
      } else {
        onClose();
      }
    } catch (err: any) {
      console.error("Apple Auth error in AuthModal:", err);
      if (
        err?.code !== "auth/popup-closed-by-user" &&
        err?.code !== "auth/cancelled-popup-request"
      ) {
        if (err?.code === "auth/account-exists-with-different-credential") {
          setErrorMsg(
            "Un compte existe déjà avec cet email via une autre méthode (ex: Google). Veuillez vous connecter avec Google."
          );
        } else if (err?.code === "auth/configuration-not-found" || err?.code === "auth/operation-not-allowed") {
          setErrorMsg(
            "La configuration Apple dans Firebase Console requiert la clé Services ID. Veuillez utiliser Google en attendant."
          );
        } else {
          setErrorMsg(
            "Erreur lors de la connexion Apple. Veuillez réessayer ou utiliser Google."
          );
        }
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleFacebook = () => {
    setFacebookNotice(true);
    setTimeout(() => {
      setFacebookNotice(false);
    }, 4000);
  };

  return (
    <AnimatePresence>
      <div 
        id="afrigombo-unified-auth-modal"
        className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto box-border"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-[min(100%,24rem)] bg-zinc-950 border border-[#D4AF37]/35 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(212,175,55,0.12)] relative overflow-hidden text-center box-border space-y-6 select-none"
        >
          {/* Subtle Ambient Gold Radiance */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#D4AF37]/10 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-600/10 blur-3xl rounded-full pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Gold Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#D4AF37]/20 via-[#D4AF37]/10 to-transparent flex items-center justify-center border border-[#D4AF37]/40 mx-auto shadow-[0_0_20px_rgba(212,175,55,0.15)]">
            <Sparkles className="w-8 h-8 text-[#D4AF37]" />
          </div>

          {/* Header Texts */}
          <div className="space-y-1.5 px-2">
            <h3 className="text-white text-base sm:text-lg font-sans font-black uppercase tracking-wider">
              {title}
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans font-medium">
              {subtitle}
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-2xl flex items-start gap-2.5 text-left text-xs text-red-300 font-sans">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          {/* Facebook Notice Toast */}
          {facebookNotice && (
            <div className="p-3 bg-amber-950/60 border border-[#D4AF37]/40 rounded-2xl flex items-center gap-2.5 text-left text-xs text-amber-200 font-sans animate-in fade-in duration-200">
              <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span className="leading-snug">{AUTH_PROVIDERS_CONFIG.facebook.notice}</span>
            </div>
          )}

          {/* Unified 3-Providers Stack */}
          <div className="space-y-3 pt-1">
            {/* 1. GOOGLE (ACTIF) */}
            <button
              type="button"
              id="auth-btn-google"
              onClick={handleGoogle}
              disabled={loadingProvider !== null}
              className="w-full h-13 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-850 active:bg-zinc-800 text-white border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 font-sans font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md flex items-center justify-between gap-3 cursor-pointer group disabled:opacity-50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <span className="truncate text-left font-sans font-bold text-white text-xs">
                  {loadingProvider === "google" ? "Connexion Google..." : "Continuer avec Google"}
                </span>
              </div>
              <span className="shrink-0 text-[10px] font-mono font-black bg-[#D4AF37] text-zinc-950 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                {AUTH_PROVIDERS_CONFIG.google.badgeText}
              </span>
            </button>

            {/* 2. APPLE (ACTIF) */}
            <button
              type="button"
              id="auth-btn-apple"
              onClick={handleApple}
              disabled={loadingProvider !== null}
              className="w-full h-13 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-850 active:bg-zinc-800 text-white border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 font-sans font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md flex items-center justify-between gap-3 cursor-pointer group disabled:opacity-50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-black border border-zinc-700 flex items-center justify-center shrink-0 shadow-sm">
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2..77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.35c.65-.79 1.09-1.89.97-2.99-.94.04-2.08.63-2.74 1.42-.58.68-1.1 1.79-.96 2.88 1.05.08 2.11-.51 2.73-1.31z"/>
                  </svg>
                </div>
                <span className="truncate text-left font-sans font-bold text-white text-xs">
                  {loadingProvider === "apple" ? "Connexion Apple..." : "Continuer avec Apple"}
                </span>
              </div>
              <span className="shrink-0 text-[10px] font-mono font-black bg-[#D4AF37] text-zinc-950 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                {AUTH_PROVIDERS_CONFIG.apple.badgeText}
              </span>
            </button>

            {/* 3. FACEBOOK (BIENTÔT DISPONIBLE - INACTIF) */}
            <button
              type="button"
              id="auth-btn-facebook"
              onClick={handleFacebook}
              className="w-full h-13 px-4 rounded-2xl bg-zinc-950/80 hover:bg-zinc-900/80 text-zinc-400 hover:text-zinc-300 border border-zinc-800/80 font-sans font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer group select-none opacity-80 hover:opacity-100"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <span className="truncate text-left font-sans font-bold text-zinc-400 text-xs">
                  Continuer avec Facebook
                </span>
              </div>
              <span className="shrink-0 text-[9px] font-mono font-bold bg-zinc-900 text-zinc-300 border border-zinc-700/80 px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                {AUTH_PROVIDERS_CONFIG.facebook.badgeText}
              </span>
            </button>
          </div>

          {/* Dismiss / Plus tard button */}
          <div className="pt-1">
            <button
              type="button"
              id="auth-btn-dismiss"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-transparent hover:bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 text-xs font-mono font-bold transition-all duration-200 cursor-pointer"
            >
              {dismissText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default AuthModal;
