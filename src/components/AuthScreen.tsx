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
  Facebook,
  Grid
} from "lucide-react";
import { gomboAuth, gomboDB } from "../firebase";
import { auth } from "../lib/firebase";
import { RecaptchaVerifier } from "firebase/auth";
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
  // Tabs for Auth: "register" | "login" | "phone"
  const [authMethod, setAuthMethod] = useState<"register" | "login" | "phone">("register");
  
  // Traditional form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [commune, setCommune] = useState("Cocody");
  const [role, setRole] = useState<"musicien" | "client">("musicien");
  const [showPassword, setShowPassword] = useState(false);

  // Phone Authentication Flow state
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneAuthStep, setPhoneAuthStep] = useState<"request" | "verify">("request");
  const [otpCode, setOtpCode] = useState("");
  const [confirmResult, setConfirmResult] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState("");
  const [successMSG, setSuccessMSG] = useState("");

  // Clean troubleshooting tooltips for sandbox / iframe errors
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  const [activeErrorCode, setActiveErrorCode] = useState("");

  // Post-Authentication profile initialization and sync to Firestore
  const handlePostAuthSuccess = async (uid: string, userEmail: string) => {
    setLoading(true);
    try {
      console.log("🛠️ [AuthScreen Debug] Syncing user profile data for", uid);
      const profile = await gomboDB.getUserProfile(uid);
      
      const isComplete = profile ? (profile.isProfileComplete ?? false) : false;
      const isFormRegister = authMethod === "register" && firstName.trim() !== "";

      const updatedProfileData: any = {
        uid,
        email: userEmail || profile?.email || "",
        firstName: isFormRegister ? firstName.trim() : (profile?.firstName || "Artiste"),
        lastName: isFormRegister ? lastName.trim() : (profile?.lastName || "Gombo"),
        displayName: isFormRegister 
          ? `${firstName.trim()} ${lastName.trim()}`
          : (profile?.displayName || profile?.firstName ? `${profile.firstName} ${profile.lastName || ""}`.trim() : "Artiste Gombo"),
        phone: (isFormRegister ? phone.trim() : null) || phoneInput.trim() || profile?.phone || "",
        commune: (isFormRegister ? commune : null) || profile?.commune || "Cocody",
        role: (isFormRegister ? role : null) || profile?.role || "musicien",
        provider: profile?.provider || (authMethod === "phone" ? "phone" : (authMethod === "login" ? "password" : "email")),
        isProfileComplete: isComplete, // Preserve profile completion status
        avatarUrl: profile?.avatarUrl || profile?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
        balance: profile?.balance ?? 25000,
        totalRevenue: profile?.totalRevenue ?? 25000,
        totalWithdrawals: profile?.totalWithdrawals ?? 0,
        gigsCompleted: profile?.gigsCompleted ?? 0,
        applicationsSent: profile?.applicationsSent ?? 0,
        acceptanceRate: profile?.acceptanceRate ?? 100,
        createdAt: profile?.createdAt || new Date().toISOString()
      };

      // Ensure that if it has specialty or bio or other markers, we keep them
      if (profile?.specialty || profile?.speciality) {
        updatedProfileData.specialty = profile.specialty || profile.speciality;
        updatedProfileData.speciality = profile.specialty || profile.speciality;
      }
      if (profile?.experience || profile?.experienceYears) {
        updatedProfileData.experience = profile.experience || profile.experienceYears;
        updatedProfileData.experienceYears = profile.experience || profile.experienceYears;
      }
      if (profile?.musicGenre) {
        updatedProfileData.musicGenre = profile.musicGenre;
      }
      if (profile?.bio) {
        updatedProfileData.bio = profile.bio;
      }
      if (profile?.artistName) {
        updatedProfileData.artistName = profile.artistName;
      }
      if (profile?.waveNumber || profile?.paymentNumber) {
        updatedProfileData.waveNumber = profile.waveNumber || profile.paymentNumber;
        updatedProfileData.paymentNumber = profile.waveNumber || profile.paymentNumber;
      }
      if (profile?.orangeMoneyNumber) {
        updatedProfileData.orangeMoneyNumber = profile.orangeMoneyNumber;
      }

      await gomboDB.updateUserProfile(uid, updatedProfileData);
      
      // Save local reference for session persistence
      localStorage.setItem("gombo_auth", JSON.stringify({ uid: uid, email: userEmail || email, emailVerified: true }));
      window.dispatchEvent(new Event("gomboAuthChange"));
      
      setSuccessMSG("Connexion réussie ! Bienvenue dans l'arène Y'A GOMBO MUSIC 🌟");
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
    setShowTroubleshoot(false);
    setActiveErrorCode("");
    try {
      const res = await gomboAuth.loginWithGoogle();
      if (res && res.uid) {
        await handlePostAuthSuccess(res.uid, res.email || "");
      }
    } catch (err: any) {
      console.error("Google SSO Failure:", err);
      const code = err.code || "auth/unknown";
      setActiveErrorCode(code);
      setShowTroubleshoot(true);
      setErrorMSG("Échec de connexion Google : " + (err.message || "Erreur inconnue"));
    } finally {
      setLoading(false);
    }
  };

  // Facebook SSO Click Action
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
      console.error("Facebook SSO Failure:", err);
      const code = err.code || "auth/unknown";
      setActiveErrorCode(code);
      setShowTroubleshoot(true);
      setErrorMSG("Échec de connexion Facebook : " + (err.message || "Erreur de connexion"));
    } finally {
      setLoading(false);
    }
  };

  // Form submit handler for register / login email auth
  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMSG("");
    setSuccessMSG("");
    setLoading(true);

    try {
      if (!email.includes("@")) {
        throw new Error("Veuillez saisir une adresse email valide !");
      }
      if (password.length < 6) {
        throw new Error("Le mot de passe doit comporter au moins 6 caractères.");
      }

      if (authMethod === "login") {
        console.log("🔑 Logging in standard email user...");
        await gomboAuth.signIn(email.trim().toLowerCase(), password);
        const authRef = JSON.parse(localStorage.getItem("gombo_auth") || "null");
        if (authRef && authRef.uid) {
          await handlePostAuthSuccess(authRef.uid, authRef.email);
        } else {
          onSuccess();
        }
      } else {
        // Register sequence
        if (!firstName.trim() || !lastName.trim()) {
          throw new Error("Veuillez remplir votre Prénom et votre Nom de famille !");
        }
        if (!phone.trim()) {
          throw new Error("Le numéro de téléphone est obligatoire pour organiser les gombos.");
        }

        console.log("✨ Creating a brand new email profile...");
        await gomboAuth.signUp(email.trim().toLowerCase(), password, role, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          commune: commune
        });

        // Autologin sync triggers automatically through auth listener, fallback is manual triggers
        const authRef = JSON.parse(localStorage.getItem("gombo_auth") || "null");
        if (authRef && authRef.uid) {
          await handlePostAuthSuccess(authRef.uid, authRef.email);
        } else {
          setSuccessMSG("Votre compte showbizz a été créé avec succès ! Connectez-vous maintenant.");
          setAuthMethod("login");
          setLoading(false);
        }
      }
    } catch (err: any) {
      console.error("Email authentication failed:", err);
      setErrorMSG(err.message || "Une erreur est survenue lors de l'authentification.");
      setLoading(false);
    }
  };

  // Send Phone SMS OTP Validation Code Handler
  const handleSendSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMSG("");
    setSuccessMSG("");
    setLoading(true);

    try {
      if (!phoneInput.trim()) {
        throw new Error("Veuillez entrer un numéro de téléphone valide.");
      }

      // Convert local format (e.g. 07...) to standard Côte d'Ivoire global code (+225...)
      let cleanedPhone = phoneInput.trim().replace(/\s+/g, "");
      if (!cleanedPhone.startsWith("+")) {
        if (cleanedPhone.startsWith("0")) {
          cleanedPhone = "+225" + cleanedPhone.substring(1);
        } else {
          cleanedPhone = "+225" + cleanedPhone;
        }
      }

      console.log("📱 Dispatching OTP code for phone: ", cleanedPhone);
      
      // Initialize reCAPTCHA verifier dynamically on empty anchor container
      let verifier: RecaptchaVerifier | null = null;
      try {
        if (auth) {
          const anchor = document.getElementById("recaptcha-invisible-anchor");
          if (anchor) anchor.innerHTML = ""; // reset previous
          
          verifier = new RecaptchaVerifier(auth, "recaptcha-invisible-anchor", {
            size: "invisible",
            callback: (res: any) => {
              console.log("Recaptcha verifier passed successfully", res);
            }
          });
        }
      } catch (recapErr) {
        console.warn("Recaptcha instantiating failure, falling back.", recapErr);
      }

      const confirmationResult = await gomboAuth.loginWithPhoneCode(cleanedPhone, verifier);
      setConfirmResult(confirmationResult);
      setPhoneAuthStep("verify");
      setSuccessMSG("📱 Code SMS envoyé ! Veuillez saisir le code à 6 chiffres reçu.");
    } catch (err: any) {
      console.error("SMS Dispatch error:", err);
      setErrorMSG("Impossible d'envoyer le code SMS. Vérifiez le format (CIV) : " + (err.message || "Erreur Firebase"));
    } finally {
      setLoading(false);
    }
  };

  // Verify Phone OTP Submit Click Handler
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMSG("");
    setSuccessMSG("");
    setLoading(true);

    try {
      if (!otpCode || otpCode.length < 4) {
        throw new Error("Veuillez entrer le code à 6 chiffres reçu par SMS.");
      }

      console.log("🔑 Confirming OTP code...", otpCode);
      const res = await confirmResult.confirm(otpCode);
      const user = res.user;
      
      console.log("✅ Authenticated via OTP! User:", user);
      await handlePostAuthSuccess(user.uid, user.email || `${user.uid}@gombo.ci`);
    } catch (err: any) {
      console.error("OTP Verification failed:", err);
      setErrorMSG("Le code saisi est incorrect ou a expiré. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-h-[95vh] md:max-h-none overflow-y-auto w-full select-none" id="auth-screen-container">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="relative w-full bg-[#0F172A] text-slate-100 rounded-3xl border border-[#D4A373]/20 p-5 sm:p-6 shadow-2xl overflow-hidden"
      >
        {/* Soft Gold Ambient Glow Detailing */}
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

        {/* Brand Banner Header */}
        <div className="text-center mb-5 mt-1">
          <div className="inline-flex items-center justify-center p-3.5 bg-[#7C3AED]/20 hover:bg-[#7C3AED]/30 text-[#D4A373] rounded-2xl mb-2.5 border border-[#D4A373]/20 shadow-lg">
            <Flame className="w-7 h-7 fill-current text-[#D4A373]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-50 tracking-wide uppercase font-display">
            Y'A GOMBO MUSIC
          </h2>
          <p className="text-[10px] text-[#D4A373] font-extrabold tracking-widest uppercase mt-0.5">
            L'Élite du Showbiz & Contrats d'Artistes
          </p>
        </div>

        {/* Error / Success Feedback banner */}
        <AnimatePresence mode="wait">
          {errorMSG && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 mb-4 bg-red-950/30 border border-red-500/30 rounded-xl text-red-200 text-xs font-semibold leading-relaxed"
            >
              {errorMSG}
            </motion.div>
          )}

          {successMSG && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 mb-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-200 text-xs font-semibold"
            >
              {successMSG}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Connexion Buttons in grid */}
        <div className="space-y-2 mb-5">
          <p className="text-[9px] text-center font-bold text-[#D4A373]/75 uppercase tracking-wider">
            Connexion Express
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Google Quick Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="h-11 flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:border-[#D4A373]/30 hover:bg-slate-800/80 text-slate-100 rounded-xl transition-all font-semibold text-xs active:scale-98 cursor-pointer"
            >
              <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.1C18.28 1.844 15.485 1 12.24 1 6.05 1 1.042 6.01 1.042 12.185S6.05 23.37 12.24 23.37c6.46 0 10.755-4.54 10.755-10.95 0-.735-.08-1.3-.175-1.833h-10.58z"
                />
              </svg>
              <span>Google</span>
            </button>

            {/* Facebook Quick Login */}
            <button
              type="button"
              onClick={handleFacebookLogin}
              disabled={loading}
              className="h-11 flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:border-[#D4A373]/30 hover:bg-slate-800/80 text-slate-100 rounded-xl transition-all font-semibold text-xs active:scale-98 cursor-pointer"
            >
              <Facebook className="w-4.5 h-4.5 fill-[#1877F2] stroke-none shrink-0" />
              <span>Facebook</span>
            </button>
          </div>
        </div>

        {/* Divider text */}
        <div className="relative flex pb-3 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-3 text-[9px] text-slate-500 uppercase font-black tracking-widest">OU PAR FORMULAIRE</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Form Selection Premium Tabs */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-[10px] font-bold mb-4">
          <button
            type="button"
            onClick={() => { setAuthMethod("register"); setErrorMSG(""); setSuccessMSG(""); }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              authMethod === "register" 
                ? "bg-[#7C3AED] text-white shadow-sm font-black" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Créer Compte
          </button>
          <button
            type="button"
            onClick={() => { setAuthMethod("login"); setErrorMSG(""); setSuccessMSG(""); }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              authMethod === "login" 
                ? "bg-[#7C3AED] text-white shadow-sm font-black" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Se Connecter
          </button>
          <button
            type="button"
            onClick={() => { setAuthMethod("phone"); setErrorMSG(""); setSuccessMSG(""); }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              authMethod === "phone" 
                ? "bg-[#7C3AED] text-white shadow-sm font-black" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🔑 Code SMS
          </button>
        </div>

        {/* Main interactive form */}
        <div className="space-y-4">
          {/* 1. Phone Auth Interactive Flow */}
          {authMethod === "phone" ? (
            <div className="space-y-4 py-1">
              {phoneAuthStep === "request" ? (
                <form onSubmit={handleSendSMS} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#D4A373] uppercase tracking-wider">
                      Numéro de téléphone
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                        🇨🇮 +225
                      </span>
                      <input
                        type="tel"
                        required
                        className="w-full pl-16 pr-3 py-2.5 bg-slate-900 border border-slate-800 focus:border-[#D4A373]/60 rounded-xl text-xs font-bold focus:outline-none text-slate-50"
                        placeholder="07 45 89 12..."
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                      />
                    </div>
                    <p className="text-[9px] text-slate-400">
                      Entrez votre numéro à 10 chiffres. Un SMS OTP sécurisé vous sera instantanément envoyé par Firebase.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 mt-2 bg-gradient-to-r from-[#7C3AED] to-indigo-600 hover:from-[#6D28D9] hover:to-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Smartphone className="w-4 h-4" />
                        <span>Recevoir mon code par SMS</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#D4A373] uppercase tracking-wider">
                      Saisir le Code OTP Reçu
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <ShieldCheck className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 focus:border-[#D4A373]/60 rounded-xl text-center text-sm font-mono font-semibold tracking-widest focus:outline-none text-slate-50"
                        placeholder="123456"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1">
                      <span>Code reçu sur {phoneInput}</span>
                      <button 
                        type="button" 
                        onClick={() => { setPhoneAuthStep("request"); setOtpCode(""); }} 
                        className="text-[#D4A373] hover:underline"
                      >
                        Changer de numéro
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 mt-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Valider & Se Connecter</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* 2. Standard Email/Password form flow */
            <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5">
              <div className="max-h-[46vh] overflow-y-auto pr-1 space-y-3">
                {/* User Role selection ONLY during registration */}
                {authMethod === "register" && (
                  <div className="space-y-1 pt-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                      Mon rôle showbiz :
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole("musicien")}
                        className={`p-2 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          role === "musicien"
                            ? "border-[#7C3AED] bg-[#7C3AED]/10 text-slate-50 font-black"
                            : "border-slate-800/80 hover:bg-slate-800/30 text-slate-400"
                        }`}
                      >
                        <Flame className="w-4 h-4 shrink-0 text-[#D4A373]" />
                        <span className="text-[10px]">Musicien / DJ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole("client")}
                        className={`p-2 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          role === "client"
                            ? "border-[#7C3AED] bg-[#7C3AED]/10 text-slate-50 font-black"
                            : "border-slate-800/80 hover:bg-slate-800/30 text-slate-400"
                        }`}
                      >
                        <User className="w-4 h-4 shrink-0 text-[#D4A373]" />
                        <span className="text-[10px]">Recruteur / Organisateur</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Name inputs during registration */}
                {authMethod === "register" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Prénom</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-[#D4A373]/60 rounded-xl text-xs font-semibold focus:outline-none text-slate-200"
                        placeholder="Arthur"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Nom</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-[#D4A373]/60 rounded-xl text-xs font-semibold focus:outline-none text-slate-200"
                        placeholder="Koffi"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Telephone Contact registration only */}
                {authMethod === "register" && (
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-[#D4A373] uppercase">
                      Numéro de Téléphone (CIV)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Phone className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="tel"
                        required
                        className="w-full pl-8 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 focus:border-[#D4A373]/60 rounded-xl focus:outline-none text-slate-100"
                        placeholder="07 45 67 11 ..."
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Abidjan Commune Location selector */}
                {authMethod === "register" && (
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase">
                      Commune d'Abidjan
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <MapPin className="w-3.5 h-3.5" />
                      </span>
                      <select
                        required
                        className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 focus:border-[#D4A373]/60 rounded-xl text-xs font-bold focus:outline-none text-slate-205 appearance-none cursor-pointer"
                        value={commune}
                        onChange={(e) => setCommune(e.target.value)}
                      >
                        {ABIDJAN_COMMUNES.map((com) => (
                          <option key={com} value={com}>{com}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Email address field */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Adresse Email</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="email"
                      required
                      className="w-full pl-8 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 focus:border-[#D4A373]/60 rounded-xl focus:outline-none text-slate-100"
                      placeholder="monartiste@gombo.ci"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Mot de passe</label>
                  <div className="relative flex items-center">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="w-full pl-8 pr-8 py-2 text-xs bg-slate-900 border border-slate-800 focus:border-[#D4A373]/60 rounded-xl focus:outline-none text-slate-100"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-slate-100"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action and Validate button */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-[#7C3AED] to-indigo-600 hover:from-[#6D28D9] hover:to-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : authMethod === "register" ? (
                    "Créer mon Compte Showbiz"
                  ) : (
                    "Se Connecter en Sécurité"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Invisible Recaptcha Element */}
          <div id="recaptcha-invisible-anchor"></div>

          {/* Frame Redirect troubleshooting help tooltip */}
          {showTroubleshoot && (
            <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl text-amber-200 mt-2 text-[10px]">
              <p className="font-extrabold pb-0.5">💡 Problème d'ouverture de l'authentification (Navigateur/Iframe) ?</p>
              <p className="leading-relaxed text-slate-350">
                Si vous obtenez un refus ou un "popup bloqué", utilisez un login classique par adresse e-mail ou par téléphone, ou ouvrez l'application dans un nouvel onglet complet à l'aide de l'icône de navigation.
              </p>
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
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
