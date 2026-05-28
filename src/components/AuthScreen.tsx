import React, { useState } from "react";
import { motion } from "motion/react";
import { Mail, Lock, User, Phone, MapPin, Sparkles, Check, Flame, ChevronRight } from "lucide-react";
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

  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState("");
  const [successMSG, setSuccessMSG] = useState("");

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
        await gomboAuth.signIn(email, password);
        onSuccess();
      } else if (mode === "register") {
        if (!email || !password || !firstName || !lastName || !phone) {
          throw new Error("Veuillez remplir tous les champs requis !");
        }
        if (password.length < 6) {
          throw new Error("Le mot de passe doit faire au moins 6 caractères !");
        }
        await gomboAuth.signUp(email, password, role, {
          firstName,
          lastName,
          phone,
          commune
        });
        setSuccessMSG("Compte créé avec succès ! Bienvenue sur Y’A GOMBO MUSIC.");
        setTimeout(() => onSuccess(), 1500);
      } else {
        // forgot password
        if (!email) {
          throw new Error("Veuillez saisir votre adresse email !");
        }
        await gomboAuth.sendPasswordReset(email);
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
    try {
      await gomboAuth.loginWithGoogle();
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMSG("Échec de la connexion Google. Veuillez activer les providers.");
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
          <div className="p-4 mb-5 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-r-xl text-red-700 dark:text-red-400 text-sm font-medium">
            {errorMSG}
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

              {/* Phone & Commune */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">Téléphone</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 text-xs font-semibold">
                      <Phone className="w-4 h-4 mr-0.5 text-gray-400 inline" />
                    </span>
                    <input
                      type="tel"
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
            </motion.div>
          )}

          {/* SHARED FIELDS: Email */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">Adresse Email</label>
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
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
                  placeholder="• • • • • •"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
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

        {/* Third Party Login (Google, with helpful guidance) */}
        <div>
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            type="button"
            className="w-full bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 py-3 rounded-xl flex items-center justify-center gap-2.5 transition-colors shadow-sm"
          >
            {/* Google Vector Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.1C18.28 1.844 15.485 1 12.24 1 6.05 1 1.042 6.01 1.042 12.185S6.05 23.37 12.24 23.37c6.46 0 10.755-4.54 10.755-10.95 0-.735-.08-1.3-.175-1.833h-10.58z"
              />
            </svg>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Connexion Google
            </span>
          </button>
          
          <div className="mt-6 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5 px-4">
            <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <p>
              Note : Pour la connexion par email, assurez-vous de l'enrôlement de la méthode classique dans la console Firebase.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
