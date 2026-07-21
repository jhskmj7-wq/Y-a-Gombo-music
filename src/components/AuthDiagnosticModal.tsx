import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ShieldCheck, RefreshCw, X, Copy, Check, Terminal, User, AlertCircle, Database, Lock } from "lucide-react";
import { useAuth } from "../AuthContext";
import { auth, db } from "../lib/firebase";
import { gomboAuth } from "../firebase";

interface AuthDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthDiagnosticModal({ isOpen, onClose }: AuthDiagnosticModalProps) {
  const { currentUser, profile, refreshProfile, loginWithGoogle } = useAuth();
  const [redirectLog, setRedirectLog] = useState<string>("Non vérifié");
  const [testingLogin, setTestingLogin] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localSession, setLocalSession] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("afrigombo_user_session");
        setLocalSession(stored || "Aucune session dans localStorage");
      } catch (e) {
        setLocalSession("Erreur d'accès à localStorage");
      }
    }
  }, [isOpen, profile]);

  const runRedirectCheck = async () => {
    setRedirectLog("Vérification getRedirectResult en cours...");
    try {
      const res = await gomboAuth.handleAuthRedirect();
      if (res && res.uid) {
        setRedirectLog(`Succès Redirect Result: UID=${res.uid}, Email=${res.email}`);
      } else {
        setRedirectLog("getRedirectResult retourné null (aucune redirection récente)");
      }
    } catch (err: any) {
      setRedirectLog(`Erreur getRedirectResult: ${err?.message || err}`);
    }
  };

  const testPopupLogin = async () => {
    setTestingLogin(true);
    try {
      await loginWithGoogle();
      setRedirectLog("Connexion Google réussie !");
    } catch (err: any) {
      setRedirectLog(`Erreur Connexion Google: ${err?.message || err}`);
    } finally {
      setTestingLogin(false);
    }
  };

  const copyReport = () => {
    const report = {
      firebaseAppState: !!auth?.app ? "Initialisé" : "Erreur",
      firebaseAuthUser: currentUser ? {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        providerData: currentUser.providerData
      } : null,
      firestoreProfile: profile,
      redirectLog,
      localStorageSession: localSession,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Inconnu"
    };

    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4 font-sans select-none overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-[#0F0F12] border border-[#D4AF37]/40 rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.9)] overflow-hidden text-afri-text p-6 space-y-5 my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-mono font-black uppercase tracking-wider text-[#D4AF37]">
                Diagnostic Authentification Firebase & Google SSO
              </h2>
              <p className="text-[11px] text-zinc-400">
                Outil de stabilisation session & persistance Chrome Android / Web
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-zinc-500 block text-[9px] uppercase">Firebase Auth</span>
            <span className={`font-bold ${auth ? "text-emerald-400" : "text-rose-400"}`}>
              {auth ? "✅ Opérationnel" : "❌ Indisponible"}
            </span>
          </div>

          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-zinc-500 block text-[9px] uppercase">Persistance</span>
            <span className="font-bold text-amber-400">
              IndexedDB / Local
            </span>
          </div>

          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-zinc-500 block text-[9px] uppercase">Session Active</span>
            <span className={`font-bold ${currentUser ? "text-emerald-400" : "text-rose-400"}`}>
              {currentUser ? "✅ Connecté" : "❌ Déconnecté"}
            </span>
          </div>

          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-zinc-500 block text-[9px] uppercase">Profil Firestore</span>
            <span className={`font-bold ${profile ? "text-emerald-400" : "text-rose-400"}`}>
              {profile ? "✅ Chargé" : "❌ Indisponible"}
            </span>
          </div>
        </div>

        {/* Inspection Table */}
        <div className="bg-black/50 border border-white/10 rounded-xl p-4 space-y-3 font-mono text-xs overflow-x-auto">
          <div className="flex justify-between border-b border-white/10 pb-2 text-zinc-400 font-bold uppercase text-[10px]">
            <span>Propriété</span>
            <span>Valeur Enregistrée</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-zinc-400">UID :</span>
              <span className="text-amber-300 font-bold">{currentUser?.uid || profile?.uid || "Non défini"}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-zinc-400">Nom Complet :</span>
              <span className="text-white font-bold">{currentUser?.displayName || profile?.displayName || "Aucun"}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-zinc-400">Email :</span>
              <span className="text-cyan-300 font-bold">{currentUser?.email || profile?.email || "Aucun"}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-zinc-400">Fournisseur :</span>
              <span className="text-indigo-300 font-bold">{profile?.provider || currentUser?.providerData?.[0]?.providerId || "google.com"}</span>
            </div>

            <div className="flex justify-between items-start py-1 border-b border-white/5 gap-2">
              <span className="text-zinc-400 shrink-0">Photo / Avatar :</span>
              <div className="flex items-center gap-2 overflow-hidden text-right">
                {(currentUser?.photoURL || profile?.photoURL || profile?.avatarUrl) ? (
                  <img
                    src={currentUser?.photoURL || profile?.photoURL || profile?.avatarUrl}
                    alt="Avatar"
                    className="w-6 h-6 rounded-full border border-amber-400 object-cover"
                  />
                ) : (
                  <span className="text-zinc-500">Aucune photo</span>
                )}
                <span className="text-[10px] text-zinc-400 truncate max-w-[200px]">
                  {currentUser?.photoURL || profile?.photoURL || profile?.avatarUrl || "—"}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-zinc-400">Rôle :</span>
              <span className="text-amber-400 font-bold uppercase">{profile?.role || "Non défini"}</span>
            </div>
          </div>
        </div>

        {/* Redirect Result & Diagnostic Log */}
        <div className="bg-zinc-950 p-3 rounded-xl border border-white/10 text-xs font-mono">
          <span className="text-zinc-500 block text-[9px] uppercase font-bold mb-1">
            Résultat Redirection / Test
          </span>
          <p className="text-emerald-400 break-words">{redirectLog}</p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={testPopupLogin}
            disabled={testingLogin}
            className="flex-1 min-w-[140px] px-3 py-2.5 bg-[#D4AF37] text-black font-mono font-bold text-xs uppercase rounded-xl hover:bg-amber-400 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${testingLogin ? "animate-spin" : ""}`} />
            {testingLogin ? "Connexion..." : "Tester Google Login"}
          </button>

          <button
            onClick={runRedirectCheck}
            className="flex-1 min-w-[140px] px-3 py-2.5 bg-white/10 text-white font-mono font-bold text-xs uppercase rounded-xl hover:bg-white/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Database className="w-4 h-4 text-amber-400" />
            Vérifier Redirection
          </button>

          <button
            onClick={async () => await refreshProfile()}
            className="px-3 py-2.5 bg-white/5 border border-white/10 text-zinc-300 font-mono font-bold text-xs uppercase rounded-xl hover:bg-white/10 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            Rafraîchir Profil
          </button>

          <button
            onClick={copyReport}
            className="px-3 py-2.5 bg-white/5 border border-white/10 text-amber-400 font-mono font-bold text-xs uppercase rounded-xl hover:bg-white/10 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copié !" : "Copier Rapport"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
