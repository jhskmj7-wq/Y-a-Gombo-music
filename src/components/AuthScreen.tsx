import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Flame, 
  X, 
  ChevronRight,
  Facebook,
  Shield,
  Music,
  Briefcase,
  Key,
  Mail,
  Lock,
  Info,
  Users2,
  Sparkles,
  AlertTriangle
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
  if (code === "auth/wrong-password" || msg.includes("wrong-password")) {
    return "Mot de passe erroné.";
  }
  if (code === "auth/user-not-found" || msg.includes("user-not-found")) {
    return "Aucun compte trouvé avec cet e-mail.";
  }
  return error?.message || "Une erreur s'est produite lors de la connexion.";
};

interface AuthScreenProps {
  onSuccess: () => void;
  onClose?: () => void;
}

export default function AuthScreen({ onSuccess, onClose }: AuthScreenProps) {
  const { loginWithGoogle, signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"google" | "demo" | "email">("google");
  
  // Tab states
  const [errorMSG, setErrorMSG] = useState("");
  const [successMSG, setSuccessMSG] = useState("");
  const [activeErrorCode, setActiveErrorCode] = useState("");
  const [dbMode, setDbMode] = useState(isFirebaseMock ? "mock" : "cloud");

  // Email form states
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [commune, setCommune] = useState("Cocody");
  const [role, setRole] = useState<"musicien" | "client">("musicien");

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

  // Demo Single-Click Preset Connection
  const handleDemoLogin = async (preset: "admin" | "musician" | "client") => {
    setErrorMSG("");
    setLoading(true);
    
    // For general robustness in the sandboxed preview environment,
    // we toggle to mock mode immediately for demo actions.
    setIsFirebaseMock(true);
    setDbMode("mock");

    try {
      let uid = "";
      let emailAddress = "";
      let profileData: any = {};

      if (preset === "admin") {
        uid = "super_admin_jhs";
        emailAddress = "jhs.kmj7@gmail.com";
        profileData = {
          uid,
          email: emailAddress,
          firstName: "Supérieur",
          lastName: "Hounkpevi",
          displayName: "Super Admin (jhs.kmj7)",
          role: "admin",
          commune: "Cocody",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
          balance: 999999,
          totalRevenue: 999999,
          isProfileComplete: true,
          provider: "google.com"
        };
      } else if (preset === "musician") {
        uid = "mus1";
        emailAddress = "yoro@gombo.ci";
        profileData = {
          uid,
          email: emailAddress,
          firstName: "Yorobo",
          lastName: "Sangaré",
          displayName: "Yorobo Sangaré 🎸",
          role: "musicien",
          commune: "Cocody",
          phone: "+225 07 45 89 12 00",
          specialty: "Guitariste",
          experience: "Professionnel",
          bio: "Guitariste lead. 6 ans de scène avec de grands artistes ivoiriens.",
          avatarUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200",
          balance: 45000,
          totalRevenue: 75000,
          isProfileComplete: true,
          provider: "local_demo"
        };
      } else {
        uid = "cli1";
        emailAddress = "serge@gombo.ci";
        profileData = {
          uid,
          email: emailAddress,
          firstName: "Serge",
          lastName: "Kassi",
          displayName: "Serge Kassi 💼",
          role: "client",
          commune: "Marcory",
          phone: "+225 07 99 88 77 66",
          bio: "Promoteur événementiel et gérant du Lounge 'Le Paris-Dakar' à Marcory Biétry.",
          avatarUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200",
          balance: 250000,
          totalRevenue: 0,
          isProfileComplete: true,
          provider: "local_demo"
        };
      }

      // Upsert mock data
      await gomboDB.updateUserProfile(uid, profileData);
      
      // Inject to local Auth credentials
      localStorage.setItem("gombo_auth", JSON.stringify({ uid, email: emailAddress, emailVerified: true }));
      localStorage.setItem("gombo_active_profile", JSON.stringify(profileData));
      
      // Notify components
      window.dispatchEvent(new Event("gomboAuthChange"));
      
      setSuccessMSG(`Connexion Démo réussie sous le rôle : ${preset.toUpperCase()} !`);
      setTimeout(() => {
        onSuccess();
      }, 700);
    } catch (err: any) {
      setErrorMSG("Échec de la connexion démo : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Classic login/register submit Handler
  const handleClassicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMSG("Veuillez renseigner tous les champs obligatoires.");
      return;
    }
    
    setErrorMSG("");
    setSuccessMSG("");
    setLoading(true);

    try {
      if (isRegistering) {
        if (!firstName || !lastName || !phone) {
          setErrorMSG("Veuillez remplir votre Prénom, Nom et Téléphone.");
          setLoading(false);
          return;
        }
        
        await signUp(email, password, role, {
          firstName,
          lastName,
          phone,
          commune
        });
        
        setSuccessMSG("Compte créé avec succès !");
        setTimeout(() => onSuccess(), 800);
      } else {
        const res = await signIn(email, password);
        await handlePostAuthSuccess(res.uid, res.email || email);
      }
    } catch (err: any) {
      console.error("Classic auth error:", err);
      setErrorMSG(getFriendlyErrorMessage(err));
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
        className="relative w-full bg-[#0F172A] text-slate-100 rounded-3xl border border-[#D4A373]/20 p-5 sm:p-7 shadow-2xl overflow-hidden"
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
        <div className="text-center mb-6 mt-2">
          <div className="inline-flex items-center justify-center p-3.5 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] rounded-2xl mb-3 border border-[#D4AF37]/20 shadow-lg transition-all duration-300">
            <Flame className="w-8 h-8 fill-current text-[#D4AF37]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#D4AF37] tracking-wider uppercase font-display mb-1">
            AFRIGOMBO
          </h1>
          <h2 className="text-base sm:text-lg font-bold text-slate-300 tracking-widest uppercase mb-3">
            Y'A GOMBO MUSIC
          </h2>
          <p className="text-[11px] sm:text-xs text-gray-300 font-bold px-2 max-w-md mx-auto leading-relaxed border-t border-[#D4AF37]/15 pt-2">
            Vos opportunités musicales certifiées, vos cachets sécurisés.
          </p>
        </div>

        {/* Dynamic Database Mode Alert Indicator */}
        <div className="mb-4 flex items-center justify-between bg-slate-900/60 rounded-xl px-3.5 py-2 border border-slate-800 text-[10px] text-slate-400">
          <span className="flex items-center gap-1.5 font-bold">
            <Info className="w-3.5 h-3.5 text-[#D4AF37]" />
            BASE DE DONNÉES :
          </span>
          <span className={`px-2 py-0.5 rounded-full font-black uppercase text-[9px] ${
            dbMode === "cloud" 
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
              : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
          }`}>
            {dbMode === "cloud" ? "Production Cloud 🔥" : "Sandbox local / mode démo ⚡"}
          </span>
        </div>

        {/* Redesigned Premium Responsive Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => { setActiveTab("google"); setErrorMSG(""); }}
            className={`py-2 text-[10.5px] font-bold uppercase rounded-lg transition-all cursor-pointer text-center ${
              activeTab === "google" 
                ? "bg-[#D4AF37] text-slate-950 font-black shadow" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Google SSO
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("demo"); setErrorMSG(""); }}
            className={`py-2 text-[10.5px] font-bold uppercase rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
              activeTab === "demo" 
                ? "bg-[#D4AF37] text-slate-950 font-black shadow" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Démo ⚡
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("email"); setErrorMSG(""); }}
            className={`py-2 text-[10.5px] font-bold uppercase rounded-lg transition-all cursor-pointer text-center ${
              activeTab === "email" 
                ? "bg-[#D4AF37] text-slate-950 font-black shadow" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            E-mail
          </button>
        </div>

        {/* Error / Success Feedback banner */}
        <AnimatePresence mode="wait">
          {errorMSG && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3.5 mb-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-100 text-xs font-medium leading-relaxed"
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="font-semibold text-red-200">{errorMSG}</p>
                </div>
                
                {/* Recover suggestion for iframe popup failures */}
                {activeErrorCode === "auth/popup-closed-by-user" && (
                  <div className="mt-1 p-2 bg-slate-950/80 border border-amber-500/20 rounded-lg space-y-2">
                    <p className="font-bold text-amber-400 text-[10px] uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      ASTUCE DU TEMPLE AFRI-GOMBO :
                    </p>
                    <p className="text-[10.5px] text-slate-300 leading-relaxed font-sans">
                      Les fenêtres de connexion sont souvent bloquées au sein des cadres (iframes) d'AI Studio. Utilisez l'onglet <strong>« Comptes Démo ⚡ »</strong> ci-dessus pour vous connecter instantanément en un clic !
                    </p>
                  </div>
                )}

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
              className="p-3 mb-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-200 text-xs font-semibold text-center flex items-center justify-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{successMSG}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab 1: Google login */}
        {activeTab === "google" && (
          <div>
            {isRedirectPending ? (
              <div className="p-4 bg-slate-950/40 border border-[#D4A373]/20 rounded-xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 mb-4">
                <div className="flex justify-center">
                  <div className="w-10 h-10 rounded-full bg-[#D4A373]/10 flex items-center justify-center animate-bounce">
                    <Flame className="w-5 h-5 text-[#D4A373] fill-current" />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-[#D4A373] uppercase tracking-wider">Connexion externe sécurisée</h3>
                  <p className="text-[10.5px] text-gray-300 font-medium leading-relaxed max-w-xs mx-auto">
                    Une fenêtre de connexion Google a été initiée dans votre navigateur Google Chrome externe pour contourner les restrictions internes.
                  </p>
                </div>
                
                <div className="py-2 border-t border-b border-white/5 space-y-2 text-left pl-1">
                  <div className="flex items-start gap-2 text-[10px]">
                    <span className="w-4 h-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-gray-300 shrink-0 text-[9px]">1</span>
                    <p className="text-gray-300 leading-relaxed font-sans">Connectez-vous à votre compte Google standard sur Chrome.</p>
                  </div>
                  <div className="flex items-start gap-2 text-[10px]">
                    <span className="w-4 h-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-gray-300 shrink-0 text-[9px]">2</span>
                    <p className="text-gray-300 leading-relaxed font-sans">Une fois fait, revenez dans cette application d'aperçu.</p>
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
                    className="w-full h-10 bg-[#D4AF37] hover:bg-[#be992c] text-[#0B0B0B] font-extrabold text-[11px] uppercase tracking-wider rounded-lg shadow-lg transition-all cursor-pointer"
                  >
                    Réouvrir Chrome sécurisé 🚀
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setIsRedirectPending(false);
                      setLoading(false);
                    }}
                    className="w-full py-1.5 bg-transparent hover:bg-white/5 text-slate-400 font-bold text-[10px] uppercase transition-colors rounded-lg"
                  >
                    Annuler / Retour
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 text-center leading-relaxed">
                  Connectez-vous à l'arène AfroGombo via votre compte Google principal pour synchroniser vos véritables données.
                </p>
                
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
                  <span>{loading ? "Connexion en cours..." : "Continuer avec Google"}</span>
                </button>

                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-1">
                  <div className="flex gap-2 items-start text-[10.5px] text-amber-300/95 leading-relaxed font-sans">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Note d'aperçu :</strong> Si la connexion Google ferme immédiatement le popup ou échoue dans l'aperçu, passez à l'onglet <strong>« Comptes Démo ⚡ »</strong> pour tester l'intégralité du produit librement.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Quick test account / demo login */}
        {activeTab === "demo" && (
          <div className="space-y-3.5">
            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Bannissez les limitations de popup iframe ! Connectez-vous instantanément avec nos profils de test prédéfinis :
            </p>

            <div className="space-y-3">
              {/* CONNECT AS ADMIN */}
              <button
                type="button"
                onClick={() => handleDemoLogin("admin")}
                disabled={loading}
                className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-purple-500/15 to-slate-950 hover:from-purple-500/25 border border-purple-500/30 hover:border-purple-500/50 rounded-xl transition-all cursor-pointer group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-purple-300 tracking-wider uppercase">Super Administrateur 👑</h3>
                    <p className="text-[9.5px] text-slate-400 font-sans">Contrôlez les cachets et validez les artistes</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* CONNECT AS MUSICIAN */}
              <button
                type="button"
                onClick={() => handleDemoLogin("musician")}
                disabled={loading}
                className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-500/15 to-slate-950 hover:from-amber-500/25 border border-[#D4AF37]/35 hover:border-[#D4AF37]/60 rounded-xl transition-all cursor-pointer group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] group-hover:scale-105 transition-transform shrink-0">
                    <Music className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-[#D4AF37] tracking-wider uppercase">Artiste Musicien 🎸</h3>
                    <p className="text-[9.5px] text-slate-400 font-sans">Yorobo Sangaré - Postulez aux offres de Gombos</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* CONNECT AS CLIENT */}
              <button
                type="button"
                onClick={() => handleDemoLogin("client")}
                disabled={loading}
                className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-indigo-500/15 to-slate-950 hover:from-indigo-500/25 border border-indigo-500/30 hover:border-indigo-500/50 rounded-xl transition-all cursor-pointer group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-indigo-300 tracking-wider uppercase">Organisateur / Client 💼</h3>
                    <p className="text-[9.5px] text-slate-400 font-sans">Serge Kassi - Publiez vos offres et réservez des groupes</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <p className="text-[10px] text-slate-500 text-center pt-2 font-sans">
              ℹ️ Se connecter avec un compte Démo passe automatiquement l'application en mode local d'Afrisandbox sécurisé.
            </p>
          </div>
        )}

        {/* Tab 3: Classic E-mail login form */}
        {activeTab === "email" && (
          <form onSubmit={handleClassicSubmit} className="space-y-4">
            <div className="space-y-2.5 font-sans">
              
              {/* If registering, show fields to complete */}
              {isRegistering && (
                <div className="grid grid-cols-2 gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Prénom *</label>
                    <input 
                      type="text"
                      required
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Ex: David"
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none text-white font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nom *</label>
                    <input 
                      type="text"
                      required
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Ex: Koffi"
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none text-white font-medium"
                    />
                  </div>
                </div>
              )}

              {isRegistering && (
                <div className="grid grid-cols-2 gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Téléphone *</label>
                    <input 
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+225 07..."
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none text-white font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Commune Abidjan</label>
                    <select
                      value={commune}
                      onChange={e => setCommune(e.target.value)}
                      className="w-full h-10 px-2 rounded-xl bg-slate-950 border border-slate-800 text-xs focus:border-[#D4AF37] outline-none text-white font-medium"
                    >
                      <option value="Cocody">Cocody</option>
                      <option value="Yopougon">Yopougon</option>
                      <option value="Marcory">Marcory</option>
                      <option value="Treichville">Treichville</option>
                      <option value="Plateau">Plateau</option>
                      <option value="Abobo">Abobo</option>
                      <option value="Koumassi">Koumassi</option>
                    </select>
                  </div>
                </div>
              )}

              {isRegistering && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Votre Rôle Showbiz *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("musicien")}
                      className={`h-10 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 border transition-all ${
                        role === "musicien" 
                          ? "bg-amber-500/10 text-[#D4AF37] border-[#D4AF37]/50" 
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <Music className="w-3.5 h-3.5" />
                      Musicien
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("client")}
                      className={`h-10 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 border transition-all ${
                        role === "client" 
                          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/50" 
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      Organisateur
                    </button>
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Adresse Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="artiste@cloud.ci"
                    className="w-full h-10 pl-10 pr-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none text-white font-medium"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Mot de Passe *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 pl-10 pr-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none text-white font-medium"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-[#D4AF37] to-amber-500 text-[#0B0B0B] font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer mt-2"
            >
              {loading ? "Traitement l'arène..." : isRegistering ? "Créer mon Compte Showbiz" : "Se Connecter classique"}
            </button>

            {/* Alternating Login/Register Switcher */}
            <div className="text-center pt-1 animate-in fade-in duration-300">
              <button
                type="button"
                onClick={() => { setIsRegistering(!isRegistering); setErrorMSG(""); }}
                className="text-[11px] font-bold text-slate-400 hover:text-[#D4AF37] transition-colors"
              >
                {isRegistering ? "Déjà membre ? Connectez-vous" : "Pas encore de compte ? S'inscrire"}
              </button>
            </div>
          </form>
        )}

        {/* Footer info links */}
        <div className="border-t border-slate-800/60 pt-4 mt-5 flex flex-col gap-2.5">
          {/* Guest login/back button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 bg-slate-900/40 hover:bg-slate-900/80 text-slate-300 hover:text-[#D4AF37] font-bold text-xs transition-all border border-slate-800 rounded-xl flex items-center justify-center gap-1.5"
            >
              <span>Continuer en Mode Invité / Explorer</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="text-center flex justify-center gap-4 text-[9.5px] text-slate-500 font-sans">
            <span className="hover:text-slate-300 cursor-pointer">Conditions d'Utilisation</span>
            <span>•</span>
            <span className="hover:text-slate-300 cursor-pointer">Confidentialité</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
