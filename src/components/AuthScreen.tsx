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
                  className="w-full h-12 bg-[#D4AF37] hover:bg-[#e5bd3c] text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
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
            <div className="space-y-3">
              {/* 1. Google Button (ACTIF) */}
              <button
                type="button"
                id="auth-screen-google-btn"
                onClick={handleGoogleLogin}
                disabled={loading}
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
                    {loading ? "Connexion Google..." : "Continuer avec Google"}
                  </span>
                </div>
                <span className="shrink-0 text-[10px] font-mono font-black bg-[#D4AF37] text-zinc-950 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  ACTIF
                </span>
              </button>

              {/* 2. Apple Button (ACTIF) */}
              <button
                type="button"
                id="auth-screen-apple-btn"
                onClick={handleAppleLogin}
                disabled={loading}
                className="w-full h-13 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-850 active:bg-zinc-800 text-white border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 font-sans font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md flex items-center justify-between gap-3 cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-black border border-zinc-700 flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2..77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.35c.65-.79 1.09-1.89.97-2.99-.94.04-2.08.63-2.74 1.42-.58.68-1.1 1.79-.96 2.88 1.05.08 2.11-.51 2.73-1.31z"/>
                    </svg>
                  </div>
                  <span className="truncate text-left font-sans font-bold text-white text-xs">
                    {loading ? "Connexion Apple..." : "Continuer avec Apple"}
                  </span>
                </div>
                <span className="shrink-0 text-[10px] font-mono font-black bg-[#D4AF37] text-zinc-950 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  ACTIF
                </span>
              </button>

              {/* 3. Facebook Button (BIENTÔT DISPONIBLE) */}
              <button
                type="button"
                id="auth-screen-facebook-btn"
                onClick={() => {
                  setErrorMSG("Facebook sera bientôt disponible.");
                  setTimeout(() => setErrorMSG(""), 4000);
                }}
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
                  BIENTÔT DISPONIBLE
                </span>
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
