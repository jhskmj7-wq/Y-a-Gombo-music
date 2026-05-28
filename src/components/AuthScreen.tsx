import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  Sparkles, 
  Check, 
  Flame, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  X, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2,
  ArrowLeft,
  Facebook
} from "lucide-react";
import { gomboAuth, gomboDB } from "../firebase";
import { UserProfile } from "../types";

const ABIDJAN_COMMUNES = [
  "Cocody",
  "Yopougon",
  "Marcory",
  "Plateau",
  "Treichville",
  "Abobo",
  "Koumassi",
  "Adjamé",
  "Port-Bouët",
  "Attécoubé",
  "Grand-Bassam",
  "Bingerville"
];

interface AuthScreenProps {
  onSuccess: () => void;
  onClose?: () => void;
}

export default function AuthScreen({ onSuccess, onClose }: AuthScreenProps) {
  // Traditional login/signup option toggle: "login" or "register"
  const [emailMode, setEmailMode] = useState<"login" | "register">("register");
  
  // Form fields state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [commune, setCommune] = useState("Cocody");
  const [role, setRole] = useState<"musicien" | "client">("musicien");
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState("");
  const [successMSG, setSuccessMSG] = useState("");

  // Storage and User tracking post-authentication
  const [authedUser, setAuthedUser] = useState<{ uid: string; email: string } | null>(null);

  // Advanced Troubleshoot States for OAuth inside AI Studio Iframe
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  const [activeErrorCode, setActiveErrorCode] = useState("");

  // Handle successful login/auth transition to onboarding check
  const handlePostAuthSuccess = async (uid: string, userEmail: string) => {
    setLoading(true);
    try {
      // Fetch user profile to ensure it is registered
      const profile = await gomboDB.getUserProfile(uid);
      setAuthedUser({ uid, email: userEmail });
      
      const updatedProfileData: any = {
        uid,
        email: userEmail,
        firstName: firstName.trim() || profile?.firstName || "Artiste",
        lastName: lastName.trim() || profile?.lastName || "Gombo",
        phone: phone.trim() || profile?.phone || "+225 07 00 00 00 00",
        commune: commune,
        role: role,
        isProfileComplete: true,
        avatarUrl: profile?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
        balance: profile?.balance ?? 25000,
        totalRevenue: profile?.totalRevenue ?? 25000,
        totalWithdrawals: profile?.totalWithdrawals ?? 0,
        gigsCompleted: profile?.gigsCompleted ?? 0,
        applicationsSent: profile?.applicationsSent ?? 0,
        acceptanceRate: profile?.acceptanceRate ?? 100,
        createdAt: profile?.createdAt || new Date().toISOString()
      };

      // Save complete profile
      await gomboDB.updateUserProfile(uid, updatedProfileData);
      
      // Persist auth tokens
      const LOCAL_AUTH_KEY = "gombo_auth";
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify({ uid, email: userEmail, emailVerified: true }));
      window.dispatchEvent(new Event("gomboAuthChange"));
      
      setSuccessMSG("Accès autorisé ! Bienvenue sur Gombo Musik 🎉");
      setTimeout(() => {
        onSuccess();
      }, 800);
    } catch (err: any) {
      console.warn("⚠️ Profile sync error, calling success handler directly", err);
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In Method
  const handleGoogleLogin = async () => {
    setErrorMSG("");
    setLoading(true);
    setShowTroubleshoot(false);
    setActiveErrorCode("");
    try {
      const res = await gomboAuth.loginWithGoogle();
      if (res && res.uid) {
        await handlePostAuthSuccess(res.uid, res.email || "");
      }
    } catch (err: any) {
      console.error("Google Auth error details:", err);
      const code = err.code || "auth/unknown";
      setActiveErrorCode(code);
      setShowTroubleshoot(true);
      setErrorMSG("Échec de la connexion Google réelle : " + (err.message || "Erreur de connexion"));
    } finally {
      setLoading(false);
    }
  };

  // Facebook Sign-In Method
  const handleFacebookLogin = async () => {
    setErrorMSG("");
    setLoading(true);
    setShowTroubleshoot(false);
    setActiveErrorCode("");
    try {
      const res = await gomboAuth.loginWithFacebook();
      if (res && res.uid) {
        await handlePostAuthSuccess(res.uid, res.email || "");
      }
    } catch (err: any) {
      console.error("Facebook Auth error details:", err);
      const code = err.code || "auth/unknown";
      setActiveErrorCode(code);
      setShowTroubleshoot(true);
      setErrorMSG("Échec de la connexion Facebook réelle : " + (err.message || "Erreur de connexion"));
    } finally {
      setLoading(false);
    }
  };

  // Traditional Email & Details Auth Handler
  const handleTraditionalAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMSG("");
    setSuccessMSG("");
    setLoading(true);

    try {
      if (!email.includes("@")) {
        throw new Error("Veuillez saisir une adresse email valide !");
      }
      if (password.length < 6) {
        throw new Error("Le mot de passe doit faire au moins 6 caractères !");
      }

      if (emailMode === "login") {
        await gomboAuth.signIn(email.trim().toLowerCase(), password);
        const saved = JSON.parse(localStorage.getItem("gombo_auth") || "null");
        if (saved && saved.uid) {
          await handlePostAuthSuccess(saved.uid, saved.email);
        } else {
          onSuccess();
        }
      } else {
        if (!firstName.trim() || !lastName.trim()) {
          throw new Error("Veuillez remplir votre Prénom et votre Nom !");
        }
        if (!phone.trim()) {
          throw new Error("Le numéro de téléphone est obligatoire !");
        }

        // SignUp via Auth Engine
        await gomboAuth.signUp(email.trim().toLowerCase(), password, role, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          commune: commune
        });

        const saved = JSON.parse(localStorage.getItem("gombo_auth") || "null");
        if (saved && saved.uid) {
          await handlePostAuthSuccess(saved.uid, saved.email);
        } else {
          onSuccess();
        }
      }
    } catch (err: any) {
      setErrorMSG(err.message || "Une erreur est survenue lors de l'authentification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-h-[95vh] md:max-h-none overflow-y-auto w-full select-none" id="auth-screen-container">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="relative w-full bg-white dark:bg-[#151518] rounded-3xl border border-gray-150 dark:border-gray-800/80 p-4 sm:p-5 md:p-6 shadow-2xl overflow-hidden"
      >
        {/* Floating Close Button X in the top-right corner */}
        {onClose && (
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 z-40 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            id="auth-close-btn"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand Banner Header */}
        <div className="text-center mb-4 mt-1">
          <div className="inline-flex items-center justify-center p-2.5 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 rounded-2xl mb-1.5">
            <Flame className="w-6.5 h-6.5 fill-current" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
            Y'A GOMBO MUSIC
          </h2>
          <p className="text-[9px] text-orange-605 font-black tracking-widest uppercase dark:text-orange-400">
            Showbiz Ivoirien & Contrats Rapides
          </p>
        </div>

        {/* Error/Success Feedback Alerts */}
        <AnimatePresence mode="wait">
          {errorMSG && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 mb-3 bg-red-50 dark:bg-red-950/10 border-l-4 border-red-500 rounded-r-xl text-red-750 dark:text-red-400 text-xs font-semibold leading-relaxed"
            >
              {errorMSG}
            </motion.div>
          )}

          {successMSG && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 mb-3 bg-emerald-50 dark:bg-emerald-950/10 border-l-4 border-emerald-500 rounded-r-xl text-emerald-800 dark:text-emerald-400 text-xs font-semibold"
            >
              {successMSG}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================== */}
        {/* EN-TÊTE : LES BOUTONS DE CONNEXION RAPIDE  */}
        {/* ========================================== */}
        <div className="space-y-2 mb-4">
          <p className="text-[10px] text-center font-bold text-gray-400 uppercase tracking-wider">
            Connexion Rapide en 1 clic
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Facebook Quick Login */}
            <button
              type="button"
              onClick={handleFacebookLogin}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/20 text-[#1877F2] dark:text-[#3b5998] rounded-xl transition-all font-bold text-xs active:scale-98"
            >
              <Facebook className="w-4.5 h-4.5 fill-current" />
              <span>Facebook</span>
            </button>

            {/* Google Quick Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800/80 hover:bg-gray-100 text-gray-800 dark:text-gray-200 rounded-xl transition-all font-bold text-xs active:scale-98"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.1C18.28 1.844 15.485 1 12.24 1 6.05 1 1.042 6.01 1.042 12.185S6.05 23.37 12.24 23.37c6.46 0 10.755-4.54 10.755-10.95 0-.735-.08-1.3-.175-1.833h-10.58z"
                />
              </svg>
              <span>Google</span>
            </button>
          </div>
        </div>

        {/* Divider text in the middle */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-gray-150 dark:border-gray-800/50"></div>
          <span className="flex-shrink mx-3 text-[10px] text-gray-400 uppercase font-black tracking-widest">OU FORMULAIRE</span>
          <div className="flex-grow border-t border-gray-150 dark:border-gray-800/50"></div>
        </div>

        {/* Form Mode Tabs */}
        <div className="flex bg-gray-50 dark:bg-gray-900 p-1 rounded-xl text-[11px] font-bold mb-3.5">
          <button
            type="button"
            onClick={() => setEmailMode("register")}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              emailMode === "register" 
                ? "bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-sm font-black" 
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Nouveau Compte (Inscription)
          </button>
          <button
            type="button"
            onClick={() => setEmailMode("login")}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              emailMode === "login" 
                ? "bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-sm font-black" 
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Se Connecter (Déjà Inscrit)
          </button>
        </div>

        {/* ========================================== */}
        {/* CORPS : LE FORMULAIRE COMPLET (SCROLLABLE) */}
        {/* ========================================== */}
        <form onSubmit={handleTraditionalAuth} className="space-y-4">
          <div className="max-h-[50vh] sm:max-h-[55vh] md:max-h-[62vh] overflow-y-auto pr-1.5 space-y-3.5 divide-y divide-gray-50 dark:divide-gray-850">
            
            {/* Field Section 1: Role Selection (Only shown/relevant for Registration mode) */}
            {emailMode === "register" && (
              <div className="space-y-1.5 pt-0">
                <label className="block text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase">
                  Je m'inscris en tant que :
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRole("musicien")}
                    className={`p-2.5 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      role === "musicien"
                        ? "border-orange-500 bg-orange-50/5 text-orange-650 dark:text-orange-400 dark:border-orange-500 font-extrabold"
                        : "border-gray-100 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/10 text-gray-400"
                    }`}
                  >
                    <Flame className="w-4 h-4 shrink-0 fill-current text-orange-500" />
                    <span className="text-[11px]">Musicien / DJ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("client")}
                    className={`p-2.5 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      role === "client"
                        ? "border-orange-500 bg-orange-50/5 text-orange-650 dark:text-orange-400 dark:border-orange-500 font-extrabold"
                        : "border-gray-100 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/10 text-gray-400"
                    }`}
                  >
                    <User className="w-4 h-4 shrink-0 text-orange-500" />
                    <span className="text-[11px]">Recruteur d'Artistes</span>
                  </button>
                </div>
              </div>
            )}

            {/* Field Section 2: User Identification names (Only shown in Register Mode) */}
            {emailMode === "register" && (
              <div className="grid grid-cols-2 gap-2.5 pt-3">
                <div className="space-y-0.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Prénom</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800/60 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white"
                    placeholder="Didier"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Nom</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800/60 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white"
                    placeholder="Drogba"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Field Section 3: Primary Contact & Abidjan Commune Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
              {emailMode === "register" && (
                <div className="space-y-0.5">
                  <label className="block text-[10px] font-extrabold text-orange-550 uppercase">
                    Téléphone (CIV - Obligatoire)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Phone className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="tel"
                      required
                      className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl focus:outline-none dark:text-white focus:ring-1 focus:ring-orange-500"
                      placeholder="07 45 89 12 00"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-0.5 sm:col-span-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                  Commune d'Abidjan
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <MapPin className="w-3.5 h-3.5" />
                  </span>
                  <select
                    required
                    className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-bold focus:outline-none dark:text-white appearance-none"
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                  >
                    {ABIDJAN_COMMUNES.map((com) => (
                      <option key={com} value={com}>{com}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Field Section 4: Email Address */}
            <div className="space-y-0.5 pt-3">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Adresse Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Mail className="w-3.5 h-3.5" />
                </span>
                <input
                  type="email"
                  required
                  className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl focus:outline-none dark:text-white focus:ring-1 focus:ring-orange-500"
                  placeholder="junior_spectacle@gombo.ci"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Field Section 5: Security Password */}
            <div className="space-y-0.5 pt-3">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Mot de passe</label>
              <div className="relative flex items-center">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Lock className="w-3.5 h-3.5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-8 pr-8 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl focus:outline-none dark:text-white focus:ring-1 focus:ring-orange-500"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

          </div>

          {/* ========================================== */}
          {/* PIED DE PAGE : LES ACTIONS DE VALIDATION   */}
          {/* ========================================== */}
          <div className="space-y-2.5 pt-3 border-t border-gray-100 dark:border-gray-800/80">
            {/* Main Validation Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : emailMode === "register" ? (
                "Créer mon Compte"
              ) : (
                "Se Connecter"
              )}
            </button>

            {/* Secondary Bypass Button: Passer pour plus tard */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800/20 text-gray-550 dark:text-gray-450 hover:text-gray-900 dark:hover:text-white font-bold text-xs transition-colors rounded-xl"
              >
                Passer pour plus tard
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
