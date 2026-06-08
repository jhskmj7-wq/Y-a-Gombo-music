import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Flame, 
  X, 
  Shield,
  Sparkles,
  AlertTriangle,
  Lock,
  ArrowRight
} from "lucide-react";
import { gomboAuth, gomboDB, isFirebaseMock, setIsFirebaseMock } from "../firebase";
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
  
  // Feedback states
  const [errorMSG, setErrorMSG] = useState("");
  const [successMSG, setSuccessMSG] = useState("");
  const [activeErrorCode, setActiveErrorCode] = useState("");
  const [dbMode, setDbMode] = useState(isFirebaseMock ? "mock" : "cloud");

  // Invisible easter egg counts for safe bypass/testing if Google SSO is blocked by iframe policies
  const [logoClicks, setLogoClicks] = useState(0);
  const [showOverride, setShowOverride] = useState(false);

  // WebView redirection states
  const [isRedirectPending, setIsRedirectPending] = useState(false);
  const [pendingTransferId, setPendingTransferId] = useState("");

  React.useEffect(() => {
    // Listen for cross-window / redirect channel auth completion
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
        displayName: profile?.displayName || (profile?.firstName ? `${profile.firstName} ${profile.lastName || ""}`.trim() : "Artiste Gombo"),
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

  // Google SSO Click Action (Unique & Exclusive Connection entrypoint)
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

  // Secret bypass trigger
  const handleLogoClick = () => {
    const nextCount = logoClicks + 1;
    setLogoClicks(nextCount);
    if (nextCount >= 5) {
      setShowOverride(true);
    }
  };

  // Fast trigger for testing Admin in the sandboxed dev environment if needed
  const triggerBypassAdminAuth = async () => {
    setErrorMSG("");
    setLoading(true);
    // Switch to local DB so simulation succeeds
    setIsFirebaseMock(true);
    setDbMode("mock");

    const uid = "super_admin_jhs";
    const emailAddress = "jhs.kmj7@gmail.com";
    const profileData = {
      uid,
      email: emailAddress,
      firstName: "Supérieur",
      lastName: "Hounkpevi",
      displayName: "Super Admin (jhs.kmj7)",
      role: "admin" as any,
      commune: "Cocody",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
      balance: 999999,
      totalRevenue: 999999,
      isProfileComplete: true,
      provider: "google.com"
    };

    try {
      await gomboDB.updateUserProfile(uid, profileData);
      localStorage.setItem("gombo_auth", JSON.stringify({ uid, email: emailAddress, emailVerified: true }));
      localStorage.setItem("gombo_active_profile", JSON.stringify(profileData));
      window.dispatchEvent(new Event("gomboAuthChange"));
      setSuccessMSG("Bypass Admin Activé. Initialisation du Tableau de Bord...");
      setTimeout(() => {
        onSuccess();
      }, 700);
    } catch {
      setErrorMSG("Échec de bypass.");
    } finally {
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

        {/* Core Brand Header */}
        <div className="text-center mb-6 mt-2">
          <div 
            onClick={handleLogoClick}
            className="inline-flex items-center justify-center p-3.5 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] rounded-2xl mb-3 border border-[#D4AF37]/20 shadow-lg transition-all duration-300 cursor-pointer"
          >
            <Flame className="w-8 h-8 fill-current text-[#D4AF37]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#D4AF37] tracking-wider uppercase font-display mb-1">
            AFRIGOMBO
          </h1>
          <h2 className="text-base sm:text-lg font-bold text-slate-300 tracking-widest uppercase mb-3">
            Y'A GOMBO MUSIC
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400 font-medium px-2 max-w-md mx-auto leading-relaxed border-t border-[#D4AF37]/15 pt-2">
            La plateforme d'authentification exclusive et sécurisée pour les professionnels du Showbiz.
          </p>
        </div>

        {/* Database Online Marker */}
        <div className="mb-6 flex items-center justify-center gap-2 bg-slate-950/80 rounded-xl py-2 px-4 border border-slate-800 text-[10.5px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
          <span className="font-bold tracking-wider text-slate-300">
            SYSTÈME SÉCURISÉ EN CLIENT UNIQUE GOOGLE
          </span>
        </div>

        {/* Dynamic Alerts Banner */}
        <AnimatePresence mode="wait">
          {errorMSG && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 mb-5 bg-red-950/40 border border-red-500/30 rounded-xl text-red-100 text-xs font-medium leading-relaxed"
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="font-semibold text-red-200">{errorMSG}</p>
                </div>
                
                {/* Specific instructions for iframe-blocked Google SSO */}
                {activeErrorCode === "auth/popup-closed-by-user" && (
                  <div className="mt-1 p-3 bg-slate-950/80 border border-amber-500/20 rounded-lg space-y-2">
                    <p className="font-bold text-amber-400 text-[10px] uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      ASTUCE SECURE GOOGLE SSO :
                    </p>
                    <p className="text-[10.5px] text-slate-300 leading-relaxed font-sans">
                      Les fenêtres de connexion (« popups ») peuvent être bloquées à l'intérieur des cadres intégrés (iframes) d'AI Studio. Pour vous connecter avec Google, ouvrez l'application d'aperçu dans un **nouvel onglet** d'origine de votre navigateur Chrome.
                    </p>
                  </div>
                )}

                {(errorMSG.includes("Domaine non") || activeErrorCode.includes("unauthorized")) && (
                  <div className="mt-1 p-2.5 rounded-lg bg-slate-950/70 border border-red-500/20 text-slate-300 font-sans space-y-2">
                    <p className="font-bold text-red-400 text-[10px] uppercase tracking-wider">🛠️ AJOUT DE DOMAINE REQUIS :</p>
                    <p className="text-[11px] leading-relaxed">
                      Ajoutez l'URL d'aperçu ci-dessous à la liste des domaines autorisés dans votre console Firebase (Authentification &gt; Paramètres &gt; Domaines autorisés) :
                    </p>
                    <div className="font-mono text-[9px] bg-slate-900/90 p-2 rounded border border-gray-800 select-all text-orange-400 break-all">
                      {window.location.host}
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
              className="p-3 mb-5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-200 text-xs font-semibold text-center flex items-center justify-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{successMSG}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Only login state visible - The Google Unique Connection Button */}
        <div className="space-y-4">
          {isRedirectPending ? (
            <div className="p-4 bg-slate-950/40 border border-[#D4A373]/20 rounded-xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 mb-2">
              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-full bg-[#D4A373]/10 flex items-center justify-center animate-bounce">
                  <Flame className="w-5 h-5 text-[#D4A373] fill-current" />
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xs font-black text-[#D4A373] uppercase tracking-wider">Connexion externe en cours</h3>
                <p className="text-[10.5px] text-gray-300 leading-relaxed max-w-xs mx-auto">
                  La fenêtre d'inscription se poursuit à l'extérieur pour contourner les blocages de sécurité de l'iframe.
                </p>
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
                  className="w-full h-10 bg-[#D4AF37] hover:bg-[#be992c] text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-lg shadow-lg transition-all cursor-pointer"
                >
                  Ouvrir l'arène dans Chrome 🚀
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setIsRedirectPending(false);
                    setLoading(false);
                  }}
                  className="w-full py-1.5 bg-transparent hover:bg-white/5 text-slate-400 font-bold text-[10px] uppercase transition-colors rounded-lg"
                >
                  Annuler la connexion
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-xs text-slate-400 text-center leading-relaxed">
                Connectez-vous instantanément avec votre compte Google standard pour certifier vos gombos de scène, vos recrutements et vos transactions.
              </p>
              
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-14 flex items-center justify-center gap-3 bg-gradient-to-r from-[#D4AF37] to-[#ffd700] hover:from-[#c29c29] hover:to-[#e6c100] text-[#0B0B0B] rounded-2xl transition-all duration-300 font-extrabold text-xs uppercase tracking-widest active:scale-98 cursor-pointer shadow-xl hover:shadow-[#D4AF37]/15"
              >
                <svg className="w-5.5 h-5.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#0B0B0B"
                    d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.1C18.28 1.844 15.485 1 12.24 1 6.05 1 1.042 6.01 1.042 12.185S6.05 23.37 12.24 23.37c6.46 0 10.755-4.54 10.755-10.95 0-.735-.08-1.3-.175-1.833h-10.58z"
                  />
                </svg>
                <span>{loading ? "Chargement du portail..." : "Connexion Unique via Google"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Hidden Developer Bypass Panel (Only shown if crown clicked 5 times) */}
        {showOverride && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-slate-950 border border-amber-500/30 rounded-2xl space-y-3"
            id="admin-override-panel"
          >
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-widest">
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              Console Émergente Spéciale 👑
            </div>
            <p className="text-[10px] text-gray-400">
              Ceci est un accès prioritaire de développement pour tester immédiatement le tableau de bord administrateur en mode sandbox (lorsque les popups OAuth sont bloqués d'usage dans certains navigateurs d'aperçu d'AI Studio).
            </p>
            <button
              type="button"
              onClick={triggerBypassAdminAuth}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black text-[10.5px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Se Connecter en tant que jhs.kmj7 (Admin) 👑</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {/* Footer info links */}
        <div className="border-t border-slate-800/60 pt-4 mt-6 flex flex-col gap-2.5">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-slate-900/40 hover:bg-slate-900/80 text-slate-300 hover:text-[#D4AF37] font-bold text-xs transition-all border border-slate-800 rounded-xl flex items-center justify-center gap-1.5"
            >
              <span>Continuer sans compte / Explorer</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            </button>
          )}

          <div className="text-center flex justify-center gap-4 text-[9.5px] text-slate-500 font-sans mt-1">
            <span className="hover:text-slate-300 cursor-pointer">Conditions d'Utilisation (CGU)</span>
            <span>•</span>
            <span className="hover:text-slate-300 cursor-pointer">Protection des Données</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
