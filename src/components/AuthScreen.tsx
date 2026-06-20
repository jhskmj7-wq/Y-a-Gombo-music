import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Flame, 
  AlertTriangle,
  Lock,
  ArrowRight,
  X
} from "lucide-react";
import { gomboAuth, gomboDB } from "../firebase";
import { useAuth } from "../AuthContext";

interface AuthScreenProps {
  onSuccess: () => void;
  onClose?: () => void;
}

function AuthScreen({ onSuccess, onClose }: AuthScreenProps) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Feedback states
  const [errorMSG, setErrorMSG] = useState("");
  const [successMSG, setSuccessMSG] = useState("");
  const [activeErrorCode, setActiveErrorCode] = useState("");
  const [showAfriIdModal, setShowAfriIdModal] = useState(false);

  const [enteredAfriId, setEnteredAfriId] = useState("");
  const [afriIdError, setAfriIdError] = useState("");
  const [afriIdLoading, setAfriIdLoading] = useState(false);
  const [foundAfriUser, setFoundAfriUser] = useState<any>(null);

  const handleAfriIdLogin = () => {
     setShowAfriIdModal(true);
  };

  const validateAfriId = async () => {
    const formattedId = enteredAfriId.trim().toUpperCase();
    const regex = /^AFRI-[A-Z0-9]{6,8}$/;
    
    if (!regex.test(formattedId)) {
        setAfriIdError("Format AFRI ID invalide");
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([50, 50, 50]);
        return;
    }
    
    setAfriIdError("");
    setAfriIdLoading(true);
    
    try {
        const { collection, query, where, getDocs } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        
        if (db) {
           const q = query(collection(db, "afri_ids"), where("afriId", "==", formattedId));
           const snap = await getDocs(q);
           if (!snap.empty) {
               setFoundAfriUser(snap.docs[0].data());
           } else {
               setAfriIdError("Afri ID introuvable");
               if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([50, 50, 50]);
           }
        } else {
           if (formattedId === "AFRI-MOCK001") {
               setFoundAfriUser({ afriId: formattedId, displayName: "Artiste Test", email: "test@gombo.ci", uid: "mock1" });
           } else {
               setAfriIdError("Afri ID introuvable (Mode Test)");
           }
        }
    } catch(err) {
        setAfriIdError("Erreur lors de la vérification");
    } finally {
        setAfriIdLoading(false);
    }
  };

  // WebView redirection states
  const [isRedirectPending, setIsRedirectPending] = useState(false);
  const [pendingTransferId, setPendingTransferId] = useState("");

  const isTransferMode = typeof window !== "undefined" && window.location.search.includes("transferId");
  const [transferDone, setTransferDone] = useState(false);

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
        photoURL: profile?.photoURL || "",
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await gomboDB.updateUserProfile(uid, updatedProfileData);
      
      // Save local reference for session persistence
      localStorage.setItem("gombo_auth", JSON.stringify({ uid: uid, email: userEmail, emailVerified: true }));
      window.dispatchEvent(new Event("gomboAuthChange"));
      
      if (isTransferMode) {
        setTransferDone(true);
        setSuccessMSG("✅ Liaison Google établie ! Synchronisation réussie.");
        setLoading(false);
        return;
      }

      setSuccessMSG("✅ Connexion réussie.");
      setTimeout(() => {
        onSuccess();
      }, 900);
    } catch (err: any) {
      console.error("❌ Profile syncing error:", err);
      
      if (isTransferMode) {
        setTransferDone(true);
        setSuccessMSG("✅ Liaison Google établie ! Synchronisation réussie.");
        setLoading(false);
        return;
      }

      setSuccessMSG("✅ Connexion réussie.");
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
          className="relative w-full bg-[#0E0E10] text-[#E4E4E7] rounded-3xl border border-emerald-500/35 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden text-center space-y-6"
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
            <p className="text-xs text-gray-300 leading-relaxed max-w-xs mx-auto">
              Votre session sécurisée est connectée ! Synchronisation terminée avec l'app principale.
            </p>
          </div>

          <div className="p-4 bg-zinc-900/60 border border-zinc-850 rounded-2xl max-w-xs mx-auto space-y-2">
            <div className="flex justify-center items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
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
              className="w-full py-2 bg-transparent hover:bg-white/5 text-gray-500 hover:text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition"
            >
              Fermer cet onglet 🔒
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

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
      setErrorMSG("❌ Impossible de se connecter. Veuillez réessayer.");
      setLoading(false);
    }
  };

  if (showAfriIdModal) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
        <div className="bg-[#050505] border border-[#D4AF37]/25 rounded-3xl p-6 max-w-sm w-full mx-auto flex flex-col items-center text-center shadow-[0_0_40px_rgba(212,175,55,0.05)] relative overflow-hidden animate-fadeIn">
          {/* Ambient Inner Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 blur-3xl rounded-full pointer-events-none"></div>

          <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center border border-[#D4AF37] shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.2)] z-10 mb-6">
             <span className="font-serif font-black text-4xl text-[#D4AF37]">A</span>
          </div>

          <h2 className="text-[#D4AF37] font-black text-xl mb-1 tracking-widest uppercase">AFRI ID</h2>
          
          {!foundAfriUser ? (
            <div className="w-full mt-4 flex flex-col gap-4 z-10">
              <p className="text-zinc-400 text-xs font-mono mb-2">CONNEXION SÉCURISÉE</p>
              
              <div className="space-y-1 relative">
                <input
                  type="text"
                  maxLength={13}
                  placeholder="AFRI-XXXXXX"
                  value={enteredAfriId}
                  onChange={(e) => {
                    setEnteredAfriId(e.target.value.toUpperCase());
                    if (afriIdError) setAfriIdError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && validateAfriId()}
                  disabled={afriIdLoading}
                  className={`w-full bg-[#111] border ${afriIdError ? 'border-red-500 animate-[pulse_0.5s_ease-in-out_2]' : 'border-[#D4AF37]/25'} text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-center font-mono font-bold uppercase tracking-widest outline-none focus:border-[#D4AF37]/60 transition-colors z-10`}
                />
                
                {afriIdError && (
                  <p className="text-[10px] text-red-500 font-bold mt-1 font-mono uppercase tracking-wider">{afriIdError}</p>
                )}
              </div>

              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => {
                      setShowAfriIdModal(false);
                      setEnteredAfriId("");
                      setAfriIdError("");
                      setFoundAfriUser(null);
                  }}
                  className="w-1/3 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors text-xs font-mono font-bold border border-zinc-800"
                >
                  <X className="w-5 h-5 mx-auto" />
                </button>
                <button
                  type="button"
                  onClick={validateAfriId}
                  disabled={afriIdLoading || enteredAfriId.length < 10}
                  className="flex-1 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#b5952f] text-black transition-all text-xs font-sans font-black uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {afriIdLoading ? "Vérification..." : "Vérifier"}
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full mt-2 flex flex-col gap-4.5 z-10 animate-fadeIn">
              <div className="p-4 bg-[#D4AF37]/15 border border-[#D4AF37]/45 rounded-2xl text-left space-y-3">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-black border border-[#D4AF37]/50 overflow-hidden shrink-0">
                      <img src={foundAfriUser.avatarUrl || foundAfriUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(foundAfriUser.displayName || 'A')}&background=050505&color=D4AF37`} alt="Avatar" className="w-full h-full object-cover" />
                   </div>
                   <div className="min-w-0">
                     <p className="text-[10px] text-[#D4AF37] font-mono font-bold tracking-widest uppercase">Afri ID Détecté</p>
                     <p className="text-white font-bold text-sm truncate">{foundAfriUser.displayName}</p>
                   </div>
                 </div>
                 
                 <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                   <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Email associé:</p>
                   <p className="text-xs text-zinc-300 truncate font-mono">{foundAfriUser.email}</p>
                 </div>
              </div>
              
              <div className="flex flex-col gap-2.5">
                {/* Instant Login with Afri ID profile */}
                <button
                  type="button"
                  onClick={async () => {
                    setAfriIdLoading(true);
                    try {
                      const resUid = foundAfriUser.uid || `afri_${foundAfriUser.afriId.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
                      const resEmail = foundAfriUser.email || `${foundAfriUser.afriId.toLowerCase()}@afri-id.ci`;
                      const resName = foundAfriUser.displayName || `Artiste ${foundAfriUser.afriId}`;
                      
                      const { gomboDB } = await import("../firebase");
                      const updatedProfileData: any = {
                        uid: resUid,
                        email: resEmail,
                        firstName: foundAfriUser.firstName || "Artiste",
                        lastName: foundAfriUser.lastName || "Souverain",
                        displayName: resName,
                        artisticName: resName,
                        provider: "afri_id",
                        isProfileComplete: true,
                        avatarUrl: foundAfriUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(resName)}&background=050505&color=D4AF37`,
                        photoURL: foundAfriUser.avatarUrl || "",
                        lastLoginAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      };
                      
                      await gomboDB.updateUserProfile(resUid, updatedProfileData);
                      
                      localStorage.setItem("gombo_auth", JSON.stringify({ uid: resUid, email: resEmail, emailVerified: true }));
                      window.dispatchEvent(new Event("gomboAuthChange"));
                      
                      setSuccessMSG("✅ Connexion Afri ID réussie !");
                      setShowAfriIdModal(false);
                      setTimeout(() => {
                        onSuccess();
                      }, 900);
                    } catch (err) {
                      setAfriIdError("La connexion directe a échoué");
                    } finally {
                      setAfriIdLoading(false);
                    }
                  }}
                  disabled={afriIdLoading}
                  className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#F3C43F] text-black rounded-xl transition-all font-black text-xs uppercase tracking-widest active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_4px_15px_rgba(212,175,55,0.25)]"
                >
                  {afriIdLoading ? "Connexion..." : "Se connecter maintenant 🚀"}
                </button>

                {/* Continue with Google linkage */}
                <button
                  type="button"
                  onClick={() => {
                     setShowAfriIdModal(false);
                     handleGoogleLogin();
                  }}
                  className="w-full py-3 bg-[#050505] hover:bg-[#D4AF37]/10 text-white border border-[#D4AF37]/25 rounded-xl transition-all font-bold text-xs uppercase tracking-wider active:scale-95 cursor-pointer"
                >
                   Continuer avec Google Auth
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full select-none" id="auth-screen-container">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="relative w-full bg-[#0E0E10] text-[#E4E4E7] rounded-3xl border border-[#D4AF37]/25 p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden text-center"
      >
        {/* Ambient Gold detailing glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all z-50 cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand logo header */}
        <div className="mt-4 mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-[#D4AF37]/10 text-[#D4AF37] rounded-2xl mb-4 border border-[#D4AF37]/20 shadow-md">
            <Flame className="w-10 h-10 fill-current" />
          </div>
          <h1 className="text-3xl font-black text-[#D4AF37] tracking-wider uppercase mb-1">
            AFRIGOMBO
          </h1>
          <h2 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-4">
            Y'A GOMBO MUSIC
          </h2>
          <div className="h-[1px] w-1/3 bg-[#D4AF37]/20 mx-auto mb-4" />
          <p className="text-xs text-gray-300 font-sans font-bold leading-relaxed whitespace-pre-line max-w-sm mx-auto">
            {"Le Temple du Gombo :\nVos opportunités musicales certifiées,\nvos cachets sécurisés."}
          </p>
        </div>
        
        {isTransferMode && (
          <div className="p-4 mb-6 bg-amber-500/10 border border-[#D4AF37]/30 rounded-2xl text-left space-y-1 max-w-sm mx-auto">
            <span className="text-[9px] font-black font-mono text-[#D4AF37] uppercase tracking-widest block">🇨🇮 SÉCURISATION INTÉGRATION</span>
            <p className="text-[10.5px] text-zinc-300 leading-relaxed">
              Pour lier ou rétablir votre connexion Google, cliquez sur <strong>"Continuer avec Google"</strong> ci-dessous. La synchronisation avec l'application principale s'exécutera automatiquement.
            </p>
          </div>
        )}

        {/* Dynamic Alerts Banner */}
        <AnimatePresence mode="wait">
          {errorMSG && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 mb-6 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-xs font-semibold leading-relaxed text-left flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p>{errorMSG}</p>
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
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center animate-bounce">
                  <Flame className="w-5 h-5 text-[#D4AF37] fill-current" />
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-wider">Connexion externe en cours</h3>
                <p className="text-[10px] text-gray-400 leading-relaxed max-w-xs mx-auto">
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
                  className="w-full h-11 bg-[#D4AF37] hover:bg-[#be992c] text-[#0E0E10] font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Ouvrir dans Chrome 🚀
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRedirectPending(false);
                    setLoading(false);
                  }}
                  className="w-full py-2 bg-transparent text-gray-400 hover:text-white font-bold text-[10px] uppercase transition-colors"
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
                className="w-full h-14 flex items-center justify-center gap-3 bg-[#D4AF37] hover:bg-[#b5921f] text-black rounded-2xl transition-all duration-300 font-bold text-xs uppercase tracking-widest active:scale-[0.98] cursor-pointer shadow-[0_4px_20px_rgba(212,175,55,0.2)] border border-[#D4AF37]/30"
              >
                <svg className="w-5.5 h-5.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.1C18.28 1.844 15.485 1 12.24 1 6.05 1 1.042 6.01 1.042 12.185S6.05 23.37 12.24 23.37c6.46 0 10.755-4.54 10.755-10.95 0-.735-.08-1.3-.175-1.833h-10.58z"
                  />
                </svg>
                <span>{loading ? "Vérification..." : "Continuer avec Google"}</span>
              </button>

              {/* AfriID Button - Retained but disabled for the future beta launch */}
              <button
                type="button"
                disabled={true}
                className="w-full h-14 relative flex items-center justify-center gap-3 bg-[#121214]/60 border border-zinc-800/80 text-zinc-500 rounded-2xl font-bold text-xs uppercase tracking-widest opacity-50 cursor-not-allowed"
              >
                <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center border border-zinc-700 shrink-0">
                  <span className="font-serif font-bold text-sm text-zinc-500">A</span>
                </div>
                <span>Continuer avec AfriID</span>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider bg-zinc-800 text-[#D4AF37] border border-[#D4AF37]/20 rounded font-mono">
                  Bientôt disponible
                </span>
              </button>
            </div>
          )}
        </div>

        <p className="text-[10px] text-gray-500 font-mono mt-8 uppercase tracking-widest">
          SÉCURISÉ PAR FIREBASE AUTHENTIFICATION • 2026
        </p>
      </motion.div>
    </div>
  );
}

export default React.memo(AuthScreen);
