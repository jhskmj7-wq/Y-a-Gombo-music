import React, { useState } from "react";
import { Sparkles, Lock } from "lucide-react";
import { useAuth } from "../../AuthContext";
import { AuthModal } from "./AuthModal";

export interface AuthGateProps {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  title?: string;
  subtitle?: string;
  dismissText?: string;
  triggerButtonText?: string;
  onSuccess?: () => void;
}

export function AuthGate({
  children,
  fallback,
  title = "ACCÈS PRIVÉ",
  subtitle = "Touchez Continuer pour accéder à cette fonctionnalité",
  dismissText = "Plus tard",
  triggerButtonText = "SE CONNECTER",
  onSuccess,
}: AuthGateProps) {
  const { currentUser, loading } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[200px] text-zinc-400 animate-pulse">
        <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin mb-3" />
        <span className="text-xs font-mono tracking-widest text-[#D4AF37] uppercase">Vérification de session...</span>
      </div>
    );
  }

  if (currentUser) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      <div className="w-[min(100%,24rem)] mx-auto my-6 p-6 sm:p-7 bg-zinc-950 border border-[#D4AF37]/35 rounded-3xl text-center space-y-5 shadow-[0_0_40px_rgba(212,175,55,0.08)] box-border">
        <div className="w-14 h-14 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl flex items-center justify-center text-[#D4AF37] mx-auto shadow-inner">
          <Lock className="w-6 h-6" />
        </div>

        <div className="space-y-1.5 px-2">
          <h3 className="text-white text-base font-sans font-black uppercase tracking-wider">
            {title}
          </h3>
          <p className="text-zinc-400 text-xs leading-relaxed font-sans font-medium">
            {subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="w-full py-3.5 px-5 bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-[#e5bd3c] hover:to-amber-400 text-zinc-950 font-sans font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-[0_4px_15px_rgba(212,175,55,0.25)] active:scale-98 cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 fill-current" />
          <span>{triggerButtonText}</span>
        </button>
      </div>

      <AuthModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={onSuccess}
        title={title}
        subtitle={subtitle}
        dismissText={dismissText}
      />
    </>
  );
}

export default AuthGate;
