import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Flame, 
  X, 
  ChevronRight,
  Facebook
} from "lucide-react";
import { gomboAuth, gomboDB } from "../firebase";
import { useAuth } from "../AuthContext";

const getFriendlyErrorMessage = (error: any): string => {
  const code = error?.code || "";
  const msg = error?.message || "";
  
  if (code === "auth/unauthorized-domain" || msg.includes("unauthorized-domain") || msg.includes("unauthorized_client") || msg.includes("auth/unauthorized_client")) {
    return "Domaine non autorisé : Ce domaine d'aperçu d'AI Studio n'est pas configuré dans votre Console Firebase.";
  }
  if (code === "auth/popup-closed-by-user" || msg.includes("popup-closed-by-user") || msg.includes("cancelled-by-user")) {
    return "La fenêtre de connexion Google a été fermée.";
  }
  if (code === "auth/network-request-failed" || msg.includes("network-request-failed")) {
    return "Erreur réseau. Veuillez vérifier votre connexion internet et réessayer.";
  }
  return error?.message || "Une erreur s'est produite lors de la connexion.";
};

interface AuthScreenProps {
  onSuccess: () => void;
  onClose?: () => void;
}

export default function AuthScreen({ onSuccess, onClose }: AuthScreenProps) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState("");
  const [successMSG, setSuccessMSG] = useState("");
  const [activeErrorCode, setActiveErrorCode] = useState("");
  
  // WebView redirection states
  const [isRedirectPending, setIsRedirectPending] = useState(false);
  const [pendingTransferId, setPendingTransferId] = useState("");

  React.useEffect(() => {
    const handleSuccess = async (e: any) => {
      console.log("🌟 [AuthScreen WebView Event] webViewAuthSuccess caught!", e.detail);
      setIsRedirectPending(false);
      setLoading(false);
      if (e.detail && e.detail.uid) {
        await handlePostAuthSuccess(e.detail.uid, e.detail.email || "");
      }
    };
    
    window.addEventListener("webViewAuthSuccess", handleSuccess);
    return () => window.removeEventListener("webViewAuthSuccess", handleSuccess);
  }, []);

  const handlePostAuthSuccess = async (uid: string, userEmail: string) => {
    setLoading(true);
    try {
      console.log("🛠️ [AuthScreen Debug] Syncing user profile data for", uid);
      const profile = await gomboDB.getUserProfile(uid);
      
      const isComplete = profile ? (profile.isProfileComplete ?? false) : false;

      const updatedProfileData: any = {
        uid,
        email: userEmail || profile?.email || "",
        firstName: profile?.firstName || "Artiste",
        lastName: profile?.lastName || "Gombo",
        displayName: profile?.displayName || profile?.firstName ? `${profile.firstName} ${profile.lastName || ""}`.trim() : "Artiste Gombo",
        provider: "google.com",
        isProfileComplete: isComplete,
        avatarUrl: profile?.avatarUrl || profile?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
        balance: profile?.balance ?? 25000,
        totalRevenue: profile?.totalRevenue ?? 25000,
        totalWithdrawals: profile?.totalWithdrawals ?? 0,
        gigsCompleted: profile?.gigsCompleted ?? 0,
        applicationsSent: profile?.applicationsSent ?? 0,
        acceptanceRate: profile?.acceptanceRate ?? 100,
        createdAt: profile?.createdAt || new Date().toISOString()
      };

      await gomboDB.updateUserProfile(uid, updatedProfileData);
      
      // Save local reference for session persistence
      localStorage.setItem("gombo_auth", JSON.stringify({ uid: uid, email: userEmail, emailVerified: true }));
      window.dispatchEvent(new Event("gomboAuthChange"));
      
      setSuccessMSG("Connexion réussie ! Redirection instantanée...");
      setTimeout(() => {
        onSuccess();
      }, 700);
    } catch (err: any) {
      console.error("❌ Profile syncing error:", err);
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  // Google SSO Click Action
  const handleGoogleLogin = async () => {
    setErrorMSG("");
    setLoading(true);
    setActiveErrorCode("");
    try {
      const res = await loginWithGoogle();
      if (res && res.webViewRedirectPending) {
        setIsRedirectPending(true);
        setPendingTransferId(res.transferId);
      } else if (res && res.uid) {
        await handlePostAuthSuccess(res.uid, res.email || "");
      }
    } catch (err: any) {
      console.error("Google SSO Failure:", err);
      const code = err.code || "auth/unknown";
      setActiveErrorCode(code);
      setErrorMSG(getFriendlyErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="w-full select-none" id="auth-screen-container">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="relative w-full bg-[#0F172A] text-slate-100 rounded-3xl border border-[#D4A373]/20 p-6 sm:p-8 shadow-2xl overflow-hidden"
      >
        {/* Soft Ambient Gold/Purple Glow Detailing */}
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-[#D4A373]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-[#7C3AED]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 z-40 p-2 text-slate-400 hover:text-[#D4A373] hover:bg-slate-800/40 rounded-full transition-colors"
            id="auth-close-btn"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand Banner Header - Logo & Slogan */}
        <div className="text-center mb-8 mt-4">
          <div className="inline-flex items-center justify-center p-4 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] rounded-3xl mb-4 border border-[#D4AF37]/20 shadow-lg transition-all duration-300">
            <Flame className="w-9 h-9 fill-current text-[#D4AF37]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#D4AF37] tracking-wider uppercase font-display mb-1.5">
            AFRIGOMBO
          </h1>
          <h2 className="text-lg sm:text-xl font-bold text-slate-300 tracking-widest uppercase mb-4">
            Y'A GOMBO MUSIC
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 font-bold px-2 max-w-md mx-auto leading-relaxed border-t border-[#D4AF37]/15 pt-3">
            Le Temple du Gombo :<br />
            Vos opportunités musicales certifiées, vos cachets sécurisés.
          </p>
        </div>

        {/* Info label */}
        <p className="text-center text-xs text-slate-400 max-w-xs mx-auto mb-6 leading-relaxed">
          Accédez aux opportunités de l'arène musicale certifiée en moins de 10 secondes.
        </p>

        {/* Error / Success Feedback banner */}
        <AnimatePresence mode="wait">
          {errorMSG && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 mb-5 bg-red-950/40 border border-red-500/30 rounded-2xl text-red-100 text-xs font-medium leading-relaxed"
            >
              <div className="flex flex-col gap-3">
                <p className="font-semibold text-red-200">{errorMSG}</p>
                {(errorMSG.includes("Domaine non") || activeErrorCode.includes("unauthorized")) && (
                  <div className="mt-1 p-2.5 rounded-lg bg-slate-950/70 border border-red-500/20 text-slate-300 font-sans space-y-2">
                    <p className="font-bold text-red-400 text-[10px] uppercase tracking-wider">🛠️ CONFIGURATION REQUISE POUR LE MODE RÉEL :</p>
                    <p className="text-[11px] leading-relaxed">
                      Autorisez ces domaines dans votre console Firebase (Authentication &gt; Paramètres &gt; Domaines autorisés) :
                    </p>
                    <div className="font-mono text-[9px] bg-slate-900/90 p-2 rounded border border-gray-800 select-all text-orange-400 break-all space-y-1">
                      <div>ais-dev-ft4dcfebiheopao5youqan-162624868358.europe-west3.run.app</div>
                      <div>ais-pre-ft4dcfebiheopao5youqan-162624868358.europe-west3.run.app</div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {successMSG && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 mb-5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-200 text-xs font-semibold text-center"
            >
              {successMSG}
            </motion.div>
          )}
        </AnimatePresence>

        {isRedirectPending ? (
          <div className="p-5 bg-slate-950/40 border border-[#D4A373]/20 rounded-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 mb-6">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-[#D4A373]/10 flex items-center justify-center animate-bounce">
                <Flame className="w-6 h-6 text-[#D4A373] fill-current" />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-[#D4A373] uppercase tracking-wider">Connexion externe sécurisée</h3>
              <p className="text-[11px] text-gray-300 font-medium leading-relaxed max-w-xs mx-auto">
                Une fenêtre de connexion Google a été initiée dans votre navigateur Google Chrome externe pour contourner les restrictions internes.
              </p>
            </div>
            
            <div className="py-3 border-t border-b border-white/5 space-y-3.5 text-left pl-1">
              <div className="flex items-start gap-2.5 text-[10.5px]">
                <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-gray-300 shrink-0">1</span>
                <p className="text-gray-300 pt-0.5 leading-relaxed">Connectez-vous à votre compte Google standard sur Chrome.</p>
              </div>
              <div className="flex items-start gap-2.5 text-[10.5px]">
                <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-gray-300 shrink-0">2</span>
                <p className="text-gray-300 pt-0.5 leading-relaxed">Une fois fait, revenez dans cette application (ou appuyez sur Retour).</p>
              </div>
              <div className="flex items-start gap-2.5 text-[10.5px]">
                <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-gray-300 shrink-0">3</span>
                <p className="text-gray-300 pt-0.5 leading-relaxed">L'application se synchronisera immédiatement à votre retour.</p>
              </div>
            </div>

            <div className="pt-1.5 space-y-2">
              <button
                type="button"
                onClick={() => {
                  const currentUrl = window.location.origin;
                  const redirectUrl = `${currentUrl}/?auth_transfer=google&transferId=${pendingTransferId}`;
                  const webUrlWithoutHttps = redirectUrl.replace(/^https?:\/\//, "");
                  const chromeIntentUrl = `intent://${webUrlWithoutHttps}#Intent;scheme=https;package=com.android.chrome;end`;
                  window.location.href = chromeIntentUrl;
                }}
                className="w-full h-11 bg-[#D4AF37] hover:bg-[#be992c] text-[#0B0B0B] font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#D4AF37]/15 transition-all active:scale-98 cursor-pointer"
              >
                Réouvrir Chrome sécurisé 🚀
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setIsRedirectPending(false);
                  setLoading(false);
                }}
                className="w-full py-2 bg-transparent hover:bg-white/5 text-slate-400 font-bold text-[10.5px] uppercase transition-colors rounded-xl"
              >
                Annuler / Retour
              </button>
            </div>
          </div>
        ) : (
          /* Only Allowed Action Buttons */
          <div className="space-y-3.5 mb-6">
            {/* CONTINUER AVEC GOOGLE */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-12 flex items-center justify-center gap-3 bg-[#D4AF37] hover:bg-[#be992c] text-[#0B0B0B] rounded-2xl transition-all duration-300 font-extrabold text-xs uppercase tracking-wider active:scale-98 cursor-pointer shadow-lg hover:shadow-[#D4AF37]/20"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#0B0B0B"
                  d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.1C18.28 1.844 15.485 1 12.24 1 6.05 1 1.042 6.01 1.042 12.185S6.05 23.37 12.24 23.37c6.46 0 10.755-4.54 10.755-10.95 0-.735-.08-1.3-.175-1.833h-10.58z"
                />
              </svg>
              <span>{loading ? "Liaison en cours..." : "Continuer avec Google"}</span>
            </button>

            {/* CONTINUER AVEC FACEBOOK (Disabled / Préparation) */}
            <div className="relative group">
              <button
                type="button"
                disabled
                className="w-full h-12 flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-slate-500 rounded-2xl font-bold text-xs uppercase tracking-wider cursor-not-allowed opacity-50"
              >
                <Facebook className="w-5 h-5 fill-slate-500 stroke-none shrink-0" />
                <span>Continuer avec Facebook (préparation)</span>
              </button>
            </div>
          </div>
        )}

        {/* Escape hatch pass button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-transparent hover:bg-slate-800/30 text-slate-400 hover:text-slate-200 font-bold text-xs transition-colors rounded-xl flex items-center justify-center gap-1"
          >
            <span>Continuer en Mode Invité / Explorer</span>
            <ChevronRight className="w-3" />
          </button>
        )}
      </motion.div>
    </div>
  );
}
