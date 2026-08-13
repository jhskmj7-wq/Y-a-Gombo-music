import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Flame, 
  AlertTriangle,
  Lock,
  ArrowRight,
  X
} from "lucide-react";
import { useAuth } from "../AuthContext";
import { gomboDB } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { AfriGomboLogo } from "./AfriGomboLogo";
import AuthDiagnosticModal from "./AuthDiagnosticModal";

interface AuthScreenProps {
  onSuccess: () => void;
  onClose?: () => void;
}

function AuthScreen({ onSuccess, onClose }: AuthScreenProps) {
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [isLogoLoaded, setIsLogoLoaded] = useState(false);
  const [isLogoFailed, setIsLogoFailed] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = "/logo_afrigombo.png";
    img.onload = () => setIsLogoLoaded(true);
    img.onerror = () => setIsLogoFailed(true);
  }, []);
  const { loginWithApple, loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Feedback states
  const [errorMSG, setErrorMSG] = useState("");
  const [successMSG, setSuccessMSG] = useState("");
  const [activeErrorCode, setActiveErrorCode] = useState("");

  // WebView redirection states
  const [isRedirectPending, setIsRedirectPending] = useState(false);
  const [pendingTransferId, setPendingTransferId] = useState("");

  const isTransferMode = typeof window !== "undefined" && window.location.search.includes("transferId");
  const [transferDone, setTransferDone] = useState(false);

  // Mount log
  React.useEffect(() => {
  }, []);

  // Auto-redirect to app on transfer success
  React.useEffect(() => {
    if (transferDone) {
      const timer = setTimeout(() => {
        window.location.href = window.location.origin;
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [transferDone]);

  React.useEffect(() => {
    const handleSuccess = async (e: any) => {
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
      let profile = null;
      try {
        profile = await gomboDB.getUserProfile(uid);
      } catch (err) {
        console.warn("Could not retrieve user profile:", err);
      }

      const userExistsInFirestore = !!profile;

      if (userExistsInFirestore) {
        
        // Log connection activity
        try {
          await gomboDB.logUserActivity(uid, "Connexion", "Connexion à AFRIGOMBO ELITE réussie.");
        } catch (logErr) {
          console.warn("Could not log login activity:", logErr);
        }

        if (isTransferMode) {
          setTransferDone(true);
          setSuccessMSG("✅ Liaison Google établie ! Synchronisation réussie.");
          setLoading(false);
          return;
        }

        setSuccessMSG("✅ Connexion réussie.");
        
        // Navigate directly to /home
        // if (typeof window !== "undefined") {
        //   window.history.pushState({}, "", "/home");
        //   window.dispatchEvent(new Event("popstate"));
        // }

        setTimeout(() => {
          onSuccess();
        }, 900);

      } else {
        const now = new Date().toISOString();
        const safeUserEmail = typeof userEmail === "string" ? userEmail : String(userEmail ?? "");
        const names = safeUserEmail ? safeUserEmail.split("@")[0].split(".") : ["Artiste"];
        const computedDisplayName = names.join(" ");

        const minimalProfile: any = {
          uid: uid,
          displayName: computedDisplayName || "Artiste Gombo",
          photoURL: "",
          email: userEmail || "",
          provider: "google.com",
          createdAt: now,
          role: "musicien",
          isProfileComplete: false
        };

        await gomboDB.updateUserProfile(uid, minimalProfile);

        // Log connection activity
        try {
          await gomboDB.logUserActivity(uid, "Création de compte", "Création de compte minimale réussie.");
        } catch (logErr) {
          console.warn("Could not log activity:", logErr);
        }

        if (isTransferMode) {
          setTransferDone(true);
          setSuccessMSG("✅ Liaison Google établie ! Synchronisation réussie.");
          setLoading(false);
          return;
        }

        setSuccessMSG("✅ Création du profil en cours...");

        // Navigate to /complete-profile
        // if (typeof window !== "undefined") {
        //   window.history.pushState({}, "", "/complete-profile");
        //   window.dispatchEvent(new Event("popstate"));
        // }

        setTimeout(() => {
          onSuccess();
        }, 900);
      }
    } catch (err: any) {
      console.error("❌ Profile syncing error:", err);
      
      if (isTransferMode) {
        setTransferDone(true);
        setSuccessMSG("✅ Liaison Google établie ! Synchronisation réussie.");
        setLoading(false);
        return;
      }

      setSuccessMSG("✅ Connexion réussie.");
      // if (typeof window !== "undefined") {
      //   window.history.pushState({}, "", "/home");
      //   window.dispatchEvent(new Event("popstate"));
      // }
      setTimeout(() => {
        onSuccess();
      }, 900);
    } finally {
      setLoading(false);
    }
  };

  if (transferDone) {
    return (
      <div className="w-full max-w-sm mx-auto select-none p-4 animate-fadeIn" id="auth-screen-container">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full bg-afri-bg-sec text-[#E4E4E7] rounded-3xl border border-emerald-500/35 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden text-center space-y-6"
        >
          {/* Accent decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/25 relative">
              {/* Spinner surrounding checked icon */}
              <span className="absolute inset-0 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-black text-[#D4AF37] uppercase tracking-widest font-mono">Connexion Réussie 🇨🇮</h3>
            <p className="text-xs text-afri-text-sec leading-relaxed max-w-xs mx-auto">
              Votre session sécurisée est connectée ! Synchronisation terminée avec l'app principale.
            </p>
          </div>

          <div className="p-4 bg-afri-bg-sec/60 border border-afri-border rounded-2xl max-w-xs mx-auto space-y-2">
            <div className="flex justify-center items-center gap-1.5 text-[10px] text-afri-text-sec font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              <span>Redirection automatique...</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => { window.location.href = window.location.origin; }}
              className="w-full h-12 bg-gradient-to-r from-[#D4AF37] to-[#ffd700] hover:from-[#c29c29] hover:to-[#e6c100] text-[#0E0E10] font-black text-xs uppercase tracking-widest rounded-xl transition duration-300 cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              Accéder à l'application 🚀
            </button>
            
            <button
              type="button"
              onClick={() => {
                try {
                  window.close();
                } catch (e) {
                  window.location.href = window.location.origin;
                }
              }}
              className="w-full py-2 bg-transparent hover:bg-white/5 text-afri-text-sec hover:text-afri-text font-bold text-[10px] uppercase tracking-wider rounded-lg transition"
            >
              Fermer cet onglet 🔒
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Apple SSO Click Action
  const handleAppleLogin = async () => {
    setErrorMSG("");
    setLoading(true);
    try {
      await loginWithApple();
      onSuccess();
    } catch (err: any) {
      console.error("Apple SSO Failure:", err);
      if (err?.code === "auth/account-exists-with-different-credential") {
        setErrorMSG("Un compte existe déjà avec cet email mais via une autre méthode de connexion (ex: Google). Veuillez utiliser l'autre méthode.");
      } else if (err?.code === "auth/configuration-not-found" || err?.code === "auth/operation-not-allowed" || err?.code === "auth/invalid-provider-id" || err?.message?.includes("configuration")) {
        setErrorMSG("La connexion Apple requiert la configuration de votre Service ID & clés dans Firebase Console. Veuillez utiliser Google pour vous connecter.");
      } else {
        setErrorMSG("Connexion Apple indisponible pour le moment. Veuillez utiliser la connexion Google.");
      }
      setLoading(false);
    }
  };

  // Google SSO Click Action
  const handleGoogleLogin = async () => {
    setErrorMSG("");
    setLoading(true);
    try {
      await loginWithGoogle();
      onSuccess();
    } catch (err: any) {
      console.error("Google SSO Failure:", err);
      // Log Firebase errors in console, show user-friendly message only
      setErrorMSG("Connexion impossible. Veuillez réessayer.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full select-none" id="auth-screen-container">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="relative w-full bg-afri-bg-sec text-[#E4E4E7] rounded-3xl border border-[#D4AF37]/25 p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden text-center"
      >
        {/* Ambient Gold detailing glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-afri-bg-sec/5 rounded-full blur-3xl pointer-events-none" />

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-afri-text-sec hover:text-afri-text rounded-full bg-white/5 hover:bg-white/10 transition-all z-50 cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand logo header */}
        <div className="mt-4 mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-afri-bg-sec/5 text-[#D4AF37] rounded-full mb-4 border border-[#D4AF37]/20 shadow-lg overflow-hidden">
            {isLogoLoaded && !isLogoFailed ? (
              <img 
                src="/logo_afrigombo.png" 
                alt="" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <AfriGomboLogo className="w-16 h-16" />
            )}
          </div>
          <h1 className="text-3xl font-black text-[#D4AF37] tracking-wider uppercase mb-1">
            AFRIGOMBO
          </h1>
          <h2 className="text-xs font-bold text-afri-text-sec tracking-widest uppercase mb-1">
            LE TEMPLE DU GOMBO MUSICAL
          </h2>
          <div className="flex items-center justify-center gap-1.5 mb-4">
            <Lock className="w-3 h-3 text-[#D4AF37]" />
            <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.15em] font-mono">
              Vos cachets 100% sécurisés
            </span>
          </div>
          <div className="h-[1px] w-1/3 bg-afri-bg-sec/20 mx-auto mb-4" />
          <p className="text-xs text-afri-text-sec font-sans font-bold leading-relaxed whitespace-pre-line max-w-sm mx-auto">
            {"Le Temple du Gombo :\nVos opportunités musicales certifiées,\nvos cachets sécurisés."}
          </p>
        </div>
        
        {isTransferMode && (
          <div className="p-4 mb-6 bg-amber-500/10 border border-[#D4AF37]/30 rounded-2xl text-left space-y-1 max-w-sm mx-auto">
            <span className="text-[9px] font-black font-mono text-[#D4AF37] uppercase tracking-widest block">🇨🇮 SÉCURISATION INTÉGRATION</span>
            <p className="text-[10.5px] text-afri-text leading-relaxed">
              Pour lier ou rétablir votre connexion Google, cliquez sur <strong>"Continuer avec Google"</strong> ci-dessous. La synchronisation avec l'application principale s'exécutera automatiquement.
            </p>
          </div>
        )}

        {/* Dynamic Alerts Banner */}
        <div className="mb-6 px-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-xl">
          <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest leading-relaxed">
            Connexion sécurisée via Google & Apple
          </p>
        </div>

        <AnimatePresence mode="wait">
          {errorMSG && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 mb-6 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-xs font-semibold leading-relaxed text-left flex flex-col gap-2"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p>{errorMSG}</p>
              </div>
              {errorMSG === "Connexion impossible. Veuillez réessayer." && (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMSG("");
                    handleGoogleLogin();
                  }}
                  className="mt-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-afri-text font-mono font-black text-[10px] uppercase rounded-xl transition-all cursor-pointer inline-block w-fit text-center"
                >
                  Réessayer
                </button>
              )}
            </motion.div>
          )}

          {successMSG && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 mb-6 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-200 text-xs font-bold flex items-center justify-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{successMSG}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth components */}
        <div className="space-y-4">
          {isRedirectPending ? (
            <div className="p-4 bg-slate-950/40 border border-[#D4AF37]/20 rounded-xl space-y-4 text-center">
              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-full bg-afri-bg-sec/10 flex items-center justify-center animate-bounce">
                  <Flame className="w-5 h-5 text-[#D4AF37] fill-current" />
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-wider">Connexion externe en cours</h3>
                <p className="text-[10px] text-afri-text-sec leading-relaxed max-w-xs mx-auto">
                  La fenêtre se poursuit dans Chrome pour contourner les restrictions.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    const currentUrl = window.location.origin;
                    const redirectUrl = `${currentUrl}/?auth_transfer=google&transferId=${pendingTransferId}`;
                    const webUrlWithoutHttps = redirectUrl.replace(/^https?:\/\//, "");
                    const chromeIntentUrl = `intent://${webUrlWithoutHttps}#Intent;scheme=https;package=com.android.chrome;end`;
                    window.location.href = chromeIntentUrl;
                  }}
                  className="w-full h-11 bg-afri-bg-sec hover:bg-afri-bg-sec text-[#0E0E10] font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Ouvrir dans Chrome 🚀
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRedirectPending(false);
                    setLoading(false);
                  }}
                  className="w-full py-2 bg-transparent text-afri-text-sec hover:text-afri-text font-bold text-[10px] uppercase transition-colors"
                >
                  Annuler la connexion
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Google Button - Unique Active Auth Method */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-14 flex items-center justify-center gap-3 bg-afri-bg-sec hover:bg-afri-bg-sec text-black rounded-2xl transition-all duration-300 font-bold text-xs uppercase tracking-widest active:scale-[0.98] cursor-pointer shadow-[0_4px_20px_rgba(212,175,55,0.2)] border border-[#D4AF37]/30"
              >
                <svg className="w-5.5 h-5.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.1C18.28 1.844 15.485 1 12.24 1 6.05 1 1.042 6.01 1.042 12.185S6.05 23.37 12.24 23.37c6.46 0 10.755-4.54 10.755-10.95 0-.735-.08-1.3-.175-1.833h-10.58z"
                  />
                </svg>
                <span>{loading ? "Vérification..." : "Continuer avec Google"}</span>
              </button>

              {/* Apple Button */}
              <button
                type="button"
                onClick={handleAppleLogin}
                disabled={loading}
                className="w-full h-14 flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-black rounded-2xl transition-all duration-300 font-bold text-xs uppercase tracking-widest active:scale-[0.98] cursor-pointer shadow-[0_4px_20px_rgba(255,255,255,0.1)] border border-gray-300"
              >
                <svg className="w-5.5 h-5.5 shrink-0" viewBox="0 0 24 24" fill="black">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.62-1.48 3.608-2.926 1.147-1.674 1.616-3.298 1.636-3.383-.037-.015-3.17-1.22-3.199-4.858-.024-3.045 2.482-4.512 2.597-4.582-1.423-2.083-3.626-2.366-4.417-2.404-1.921-.192-3.874 1.1-4.86 1.1zm2.535-3.313c.834-1.012 1.396-2.42 1.242-3.818-1.196.048-2.658.796-3.522 1.837-.686.82-1.353 2.259-1.168 3.628 1.341.104 2.614-.633 3.448-1.647z"/>
                </svg>
                <span>{loading ? "Vérification..." : "Continuer avec Apple"}</span>
              </button>
            </div>
          )}
        </div>

        <p className="text-[10px] text-afri-text-sec font-mono mt-8 uppercase tracking-widest">
          SÉCURISÉ PAR FIREBASE AUTHENTIFICATION • 2026
        </p>

        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowDiagnostic(true)}
            className="text-[9px] font-mono text-afri-text-muted hover:text-amber-400 underline tracking-wider cursor-pointer uppercase transition-colors"
          >
            🔍 Outil Diagnostic Auth & Session
          </button>
        </div>

        <AuthDiagnosticModal
          isOpen={showDiagnostic}
          onClose={() => setShowDiagnostic(false)}
        />
      </motion.div>
    </div>
  );
}

export default React.memo(AuthScreen);
