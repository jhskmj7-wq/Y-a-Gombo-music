import React, { useState } from "react";
import { motion } from "motion/react";
import { Mail, Lock, User, Phone, MapPin, Sparkles, Check, Flame, ChevronRight, Eye, EyeOff } from "lucide-react";
import { gomboAuth } from "../firebase";

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
}

export default function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [role, setRole] = useState<"musicien" | "client">("musicien");
  
  // Fields state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [commune, setCommune] = useState("Cocody");
  
  const [registerMethod, setRegisterMethod] = useState<"email" | "phone">("email");

  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState("");
  const [successMSG, setSuccessMSG] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Advanced Troubleshoot States for OAuth inside AI Studio Iframe / Firebase domain authorization
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  const [activeErrorCode, setActiveErrorCode] = useState("");
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [copiedAppUrl, setCopiedAppUrl] = useState(false);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMSG("");
    setSuccessMSG("");
    setLoading(true);

    try {
      if (mode === "login") {
        if (!email || !password) {
          throw new Error("Veuillez remplir tous les champs !");
        }
        let loginIdentifier = email.trim();
        if (!loginIdentifier.includes("@")) {
          // It is a phone number login, construct virtual email
          const cleanPhone = loginIdentifier.replace(/[^0-9+]/g, "");
          if (cleanPhone.length < 8) {
            throw new Error("Veuillez saisir un numéro de téléphone valide ou une adresse email !");
          }
          loginIdentifier = `phone_${cleanPhone}@phone.gombo.ci`;
        } else {
          loginIdentifier = loginIdentifier.toLowerCase();
        }

        await gomboAuth.signIn(loginIdentifier, password);
        onSuccess();
      } else if (mode === "register") {
        if (!firstName || !lastName || !password) {
          throw new Error("Veuillez renseigner votre Prénom, Nom et Mot de passe !");
        }
        if (password.length < 6) {
          throw new Error("Le mot de passe doit faire au moins 6 caractères !");
        }

        let signupEmail = "";
        let signupPhone = "";

        if (registerMethod === "email") {
          if (!email) {
            throw new Error("Veuillez saisir votre adresse email !");
          }
          signupEmail = email.trim().toLowerCase();
          signupPhone = ""; // No phone required when registering by email
        } else {
          if (!phone) {
            throw new Error("Veuillez saisir votre numéro de téléphone !");
          }
          const cleanPhone = phone.trim().replace(/[^0-9+]/g, "");
          if (cleanPhone.length < 8) {
            throw new Error("Veuillez saisir un numéro de téléphone valide (ex: 0745891200) !");
          }
          signupEmail = `phone_${cleanPhone}@phone.gombo.ci`;
          signupPhone = phone.trim(); // Only store the explicit phone number
        }

        await gomboAuth.signUp(signupEmail, password, role, {
          firstName,
          lastName,
          phone: signupPhone,
          commune
        });
        setSuccessMSG("Compte créé avec succès ! Bienvenue sur Y’A GOMBO MUSIC.");
        setTimeout(() => onSuccess(), 1500);
      } else {
        // forgot password
        if (!email) {
          throw new Error("Veuillez saisir votre adresse email !");
        }
        let forgotEmail = email.trim();
        if (!forgotEmail.includes("@")) {
          throw new Error("La réinitialisation de mot de passe requiert une adresse email !");
        }
        await gomboAuth.sendPasswordReset(forgotEmail);
        setSuccessMSG("Un lien de réinitialisation vous a été envoyé par email !");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMSG(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMSG("");
    setLoading(true);
    setShowTroubleshoot(false);
    setActiveErrorCode("");
    try {
      await gomboAuth.loginWithGoogle();
      onSuccess();
    } catch (err: any) {
      console.error("DEBUG Google Login Auth error detailed:", err);
      const code = err.code || "auth/unknown";
      setActiveErrorCode(code);
      setShowTroubleshoot(true);
      setErrorMSG(`Échec de la connexion Google (${code}). Voir le guide d'aide interactif ci-dessous pour résoudre ce blocage.`);
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setErrorMSG("");
    setLoading(true);
    setShowTroubleshoot(false);
    setActiveErrorCode("");
    try {
      await gomboAuth.loginWithFacebook();
      onSuccess();
    } catch (err: any) {
      console.error("DEBUG Facebook Login Auth error detailed:", err);
      const code = err.code || "auth/unknown";
      setActiveErrorCode(code);
      setShowTroubleshoot(true);
      setErrorMSG(`Échec de la connexion Facebook (${code}). Assurez-vous d'avoir configuré le provider dans Firebase et autorisé les domaines.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-xl bg-white dark:bg-[#1e1e24] rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8"
      >
        {/* Brand Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-2xl mb-3">
            <Flame className="w-8 h-8 fill-current" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white uppercase">
            Y'A GOMBO MUSIC
          </h2>
          <p className="text-xs text-orange-600 font-bold tracking-widest mt-1 uppercase dark:text-orange-400">
            Showbiz Ivoirien & Contrats Live
          </p>
        </div>

        {/* State Selection */}
        {mode !== "forgot" && (
          <div className="flex bg-gray-50 dark:bg-gray-800/40 p-1.5 rounded-xl mb-6">
            <button
              onClick={() => { setMode("login"); setErrorMSG(""); }}
              className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${
                mode === "login"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              Se Connecter
            </button>
            <button
              onClick={() => { setMode("register"); setErrorMSG(""); }}
              className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${
                mode === "register"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              Créer un Compte
            </button>
          </div>
        )}

        {/* Messages */}
        {errorMSG && (
          <div className="space-y-3 mb-5">
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-r-xl text-red-700 dark:text-red-400 text-sm font-medium">
              {errorMSG}
            </div>

            {showTroubleshoot && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-amber-900 dark:text-amber-300 space-y-4 shadow-sm"
              >
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-extrabold text-sm uppercase tracking-wider">
                  <span>🛠️</span>
                  <span>Guide D'activation & Dépannage Google</span>
                </div>
                
                <p className="text-[11px] leading-relaxed text-amber-805/80 dark:text-amber-400/80">
                  La connexion Firebase Google Sign-In requiert de configurer votre projet Firebase pour ce domaine de test spécifique. Suivez ces étapes simples :
                </p>

                <div className="space-y-3.5 text-xs">
                  {/* Step 1: Iframe issue */}
                  <div className="space-y-1 bg-white/50 dark:bg-black/25 p-3 rounded-xl border border-amber-100 dark:border-amber-950/40">
                    <p className="font-extrabold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                      <span>1️⃣</span> <span>Problème de cadre (Iframe) ?</span>
                    </p>
                    <p className="text-[11px] leading-relaxed text-gray-600 dark:text-gray-350">
                      L'aperçu AI Studio s'exécute dans un cadre (iframe) sécurisé qui bloque parfois les communications des fenêtres popups Google. 
                    </p>
                    <p className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 mt-1">
                      👉 Ouvrez l'application dans un nouvel onglet de votre navigateur (via l'icône fléchée en haut à droite) ou copiez le lien ci-dessous :
                    </p>
                    <div className="pt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const appUrl = window.location.href;
                          navigator.clipboard.writeText(appUrl);
                          setCopiedAppUrl(true);
                          setTimeout(() => setCopiedAppUrl(false), 2000);
                        }}
                        className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-850 dark:bg-orange-950/60 dark:text-orange-300 rounded-lg text-[10px] transition duration-200 font-bold inline-flex items-center gap-1.5 shadow-sm"
                      >
                        {copiedAppUrl ? "✓ Copié !" : "📋 Copier l'URL direct de l'App"}
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Google Sign-In Provider */}
                  <div className="space-y-1 bg-white/50 dark:bg-black/25 p-3 rounded-xl border border-amber-100 dark:border-amber-950/40">
                    <p className="font-extrabold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                      <span>2️⃣</span> <span>Activer la méthode Google</span>
                    </p>
                    <p className="text-[11px] leading-relaxed text-gray-600 dark:text-gray-350">
                      Sur votre compte Firebase, allez dans <strong className="text-amber-950 dark:text-white font-bold">Authentication &gt; Sign-In Method</strong>, puis cliquez sur <strong className="text-amber-950 dark:text-white font-bold">Ajouter un fournisseur</strong> et configurez <strong className="text-amber-950 dark:text-white font-bold">Google</strong> sur "Activé" (avec votre email d'assistance).
                    </p>
                  </div>

                  {/* Step 3: Authorized Domains */}
                  <div className="space-y-1.5 bg-white/50 dark:bg-black/25 p-3 rounded-xl border border-amber-100 dark:border-amber-950/40">
                    <p className="font-extrabold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                      <span>3️⃣</span> <span>Autoriser le Domaine (Très Important)</span>
                    </p>
                    <p className="text-[11px] leading-relaxed text-gray-600 dark:text-gray-350">
                      Firebase bloque les authentifications provenant de domaines non autorisés. Allez dans <strong className="text-amber-950 dark:text-white font-bold">Authentication &gt; Settings &gt; Authorized Domains</strong> (Domaines autorisés), puis ajoutez ce domaine actuel :
                    </p>
                    
                    <div className="mt-2 flex items-center gap-2 bg-white dark:bg-[#121214] p-2 rounded-lg border border-gray-150 dark:border-gray-800 font-mono text-[11px] text-gray-700 dark:text-gray-300 overflow-x-auto justify-between shadow-inner">
                      <span className="truncate pr-2 font-semibold select-all text-xs text-orange-600 dark:text-orange-400">{window.location.hostname}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.hostname);
                          setCopiedDomain(true);
                          setTimeout(() => setCopiedDomain(false), 2000);
                        }}
                        className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-750 rounded-md border border-gray-200 dark:border-gray-705 text-[10px] transition font-black uppercase tracking-wider shrink-0"
                      >
                        {copiedDomain ? "✓ Copié" : "Copier"}
                      </button>
                    </div>
                  </div>

                  {/* Step 4: Rapid bypass for testing */}
                  <div className="space-y-2 bg-gradient-to-br from-orange-500/10 to-amber-500/10 dark:from-orange-950/15 dark:to-amber-950/15 p-3.5 rounded-xl border border-orange-200/50 dark:border-orange-900/40">
                    <p className="font-extrabold text-orange-950 dark:text-orange-300 flex items-center gap-1.5">
                      <span>⚡</span> <span>Bypass Instantané (Alternative Rapide)</span>
                    </p>
                    <p className="text-[11px] leading-relaxed text-gray-600 dark:text-gray-450">
                      Vous n'avez pas accès à la console Firebase ou souhaitez simplement tester l'application immédiatement ?
                    </p>
                    <p className="text-[11px] leading-relaxed font-semibold text-orange-600 dark:text-orange-400">
                      👉 L'option Google Express simule un profil Google authentifié en temps réel et pré-rempli pour la Côte d'Ivoire.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          setErrorMSG("");
                          setLoading(true);
                          try {
                            // Clear previous local storage for clean test, then sign in with a choice of test identities
                            const mockEmails = ["junior_spectacle@gombo.ci", "marly_son@gmail.com", "la_patrone@live.ci"];
                            const emailChoice = mockEmails[Math.floor(Math.random() * mockEmails.length)];
                            
                            const LOCAL_USERS_KEY = "gombo_users";
                            const LOCAL_AUTH_KEY = "gombo_auth";
                            
                            const users = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
                            let userObj = users.find((u: any) => u.email === emailChoice);
                            if (!userObj) {
                              userObj = {
                                uid: "goog_sim_" + Math.random().toString(36).substring(2, 9),
                                email: emailChoice,
                                firstName: "Artiste",
                                lastName: "Google-Express",
                                commune: "Cocody",
                                phone: "+225 07 45 89 12 00",
                                role: "musicien",
                                avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
                                balance: 25000,
                                totalRevenue: 25000,
                                totalWithdrawals: 0,
                                gigsCompleted: 0,
                                applicationsSent: 0,
                                acceptanceRate: 100,
                                isProfileComplete: true,
                                createdAt: new Date().toISOString()
                              };
                              users.push(userObj);
                              localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
                            }
                            
                            // Write auth token and trigger live context update
                            localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify({ uid: userObj.uid, email: userObj.email, emailVerified: true }));
                            window.dispatchEvent(new Event("gomboAuthChange"));
                            onSuccess();
                          } catch (err) {
                            setErrorMSG("Échec de l'auto-connexion Google Express.");
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-[11px] transition-all duration-200 font-extrabold inline-flex items-center justify-center gap-1.5 shadow active:scale-98 uppercase tracking-wider"
                      >
                        🚀 Se Connecter via Google Express (Bypass)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setShowTroubleshoot(false)}
                    className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest hover:text-gray-800 dark:hover:text-gray-250 transition"
                  >
                    Masquer cette aide
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {successMSG && (
          <div className="p-4 mb-5 bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 rounded-r-xl text-emerald-800 dark:text-emerald-400 text-sm font-medium">
            {successMSG}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAction} className="space-y-4">
          
          {/* REGISTER ONLY FIELDS: Role and names */}
          {mode === "register" && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-4"
            >
              {/* Role Picker */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setRole("musicien")}
                  className={`p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2 ${
                    role === "musicien"
                      ? "border-orange-500 bg-orange-50/10 text-orange-600 dark:text-orange-400 dark:border-orange-500"
                      : "border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 text-gray-500"
                  }`}
                >
                  <Flame className="w-5 h-5" />
                  <div>
                    <p className="font-bold text-xs uppercase">Je suis</p>
                    <p className="font-semibold text-sm">Musicien / DJ</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("client")}
                  className={`p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2 ${
                    role === "client"
                      ? "border-orange-500 bg-orange-50/10 text-orange-600 dark:text-orange-400 dark:border-orange-500"
                      : "border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 text-gray-500"
                  }`}
                >
                  <User className="w-5 h-5" />
                  <div>
                    <p className="font-bold text-xs uppercase">Je cherche</p>
                    <p className="font-semibold text-sm">Des Artistes</p>
                  </div>
                </button>
              </div>

              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">Prénom</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
                      placeholder="e.g. Didier"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">Nom</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
                      placeholder="e.g. Drogba"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* S'inscrire avec : Email ou Téléphone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">S'inscrire avec :</label>
                <div className="flex bg-gray-50 dark:bg-gray-800/40 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterMethod("email");
                      setErrorMSG("");
                    }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                      registerMethod === "email"
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm font-bold border border-gray-100 dark:border-gray-850"
                        : "text-gray-500 hover:text-gray-950 dark:text-gray-400"
                    }`}
                  >
                    ✉️ Adresse E-mail
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterMethod("phone");
                      setErrorMSG("");
                    }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                      registerMethod === "phone"
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm font-bold border border-gray-100 dark:border-gray-850"
                        : "text-gray-500 hover:text-gray-950 dark:text-gray-400"
                    }`}
                  >
                    📞 Numéro de Téléphone
                  </button>
                </div>
              </div>

              {/* Dynamic Phone & Commune display based on choice */}
              {registerMethod === "phone" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">Téléphone</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 text-xs font-semibold">
                        <Phone className="w-4 h-4 mr-0.5 text-gray-400 inline" />
                      </span>
                      <input
                        type="tel"
                        required
                        className="w-full pl-9 pr-3 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
                        placeholder="0745891200"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">Commune</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                        <MapPin className="w-4 h-4" />
                      </span>
                      <select
                        className="w-full pl-9 pr-3 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white appearance-none"
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
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">Commune</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <select
                      className="w-full pl-9 pr-3 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white appearance-none"
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
            </motion.div>
          )}

          {/* DYNAMIC FIELD (Email or Email/Phone or Email input) */}
          {mode === "login" && (
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                Adresse Email ou Téléphone
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
                  placeholder="nom@exemple.com ou 0745891200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          )}

          {mode === "forgot" && (
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                Adresse Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
                  placeholder="nom@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          )}

          {mode === "register" && registerMethod === "email" && (
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                Adresse Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
                  placeholder="nom@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* PASSWORD FOR LOGIN & REGISTER */}
          {mode !== "forgot" && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Mot de passe</label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
                  placeholder="• • • • • •"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors focus:outline-none"
                  title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : mode === "login" ? (
              "Se Connecter"
            ) : mode === "register" ? (
              "Créer mon Compte"
            ) : (
              "Réinitialiser mon mot de passe"
            )}
          </button>
        </form>

        {mode === "forgot" && (
          <div className="text-center mt-4">
            <button
              onClick={() => setMode("login")}
              className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:underline"
            >
              Retour à la connexion
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100 dark:border-gray-800"></div>
          </div>
          <span className="relative px-3 text-xs font-semibold text-gray-400 bg-white dark:bg-[#1e1e24] uppercase">
            Ou continuer avec
          </span>
        </div>

        {/* Third Party Login (Google, Facebook, with helpful guidance) */}
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              type="button"
              className="bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-colors shadow-sm text-sm"
              title="Connexion avec Google"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.1C18.28 1.844 15.485 1 12.24 1 6.05 1 1.042 6.01 1.042 12.185S6.05 23.37 12.24 23.37c6.46 0 10.755-4.54 10.755-10.95 0-.735-.08-1.3-.175-1.833h-10.58z"
                />
              </svg>
              <span className="font-bold text-gray-700 dark:text-gray-300">Google</span>
            </button>

            <button
              onClick={handleFacebookLogin}
              disabled={loading}
              type="button"
              className="bg-[#1877F2] hover:bg-[#166FE5] text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-colors shadow-sm text-sm"
              title="Connexion avec Facebook"
            >
              <svg className="w-5 h-5 shrink-0 fill-current text-white" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="font-bold text-white">Facebook</span>
            </button>
          </div>
          
          <div className="mt-8 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-1.5 px-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="font-semibold text-gray-500 dark:text-gray-400">Authentification Multicanale</span>
            </div>
            <p className="mt-1 leading-relaxed text-[11px]">
              Note : Assurez-vous d'avoir activé et configuré ces fournisseurs (Google, Facebook, Messagerie) dans votre console de projet Firebase pour le service de production. En mode local hors-ligne, les simulations sont indépendantes et s'exécutent de façon instantanée.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
