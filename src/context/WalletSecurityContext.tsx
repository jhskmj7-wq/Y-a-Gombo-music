import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { ShieldCheck, Lock, AlertTriangle, Key, HelpCircle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { WalletSecurityService, WalletSecurityData, PinStatus } from "../lib/WalletSecurityService";
import { useAuth } from "../AuthContext";
import { db } from "../lib/firebase";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";

interface WalletSecurityContextValue {
  requireWalletAuthentication: (action: string, forceReauth?: boolean) => Promise<boolean>;
  setupWalletPin: () => Promise<boolean>;
  changeWalletPin: () => Promise<boolean>;
  disableWalletPin: () => Promise<boolean>;
  requestPinResetSOA: (reason?: string) => Promise<boolean>;
  isWalletSessionActive: boolean;
  clearWalletSession: () => void;
  walletSecurityStatus: WalletSecurityData | null;
  paymentSettings: any | null;
  refreshWalletSecurityStatus: () => Promise<WalletSecurityData>;
}

const WalletSecurityContext = createContext<WalletSecurityContextValue | null>(null);

export function WalletSecurityProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);
  const [walletSecurityStatus, setWalletSecurityStatus] = useState<WalletSecurityData | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<any | null>(null);

  // Real-time listener for user document walletSecurity & paymentSettings
  useEffect(() => {
    if (!currentUser?.uid) {
      setWalletSecurityStatus(null);
      setPaymentSettings(null);
      return;
    }

    const unsub = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const sec = data.walletSecurity || {};
        const pay = data.paymentSettings || {};

        const pinConfigured = !!(sec.pinHash || sec.pinConfigured || pay.pinConfigured);
        const failedPinAttempts = sec.failedPinAttempts || 0;
        const lockedUntil = sec.lockedUntil || null;
        const pinResetRequested = !!sec.pinResetRequested;

        let pinStatus: PinStatus = "NOT_CONFIGURED";
        if (pinResetRequested) {
          pinStatus = "RESET_PENDING";
        } else if (lockedUntil && new Date(lockedUntil).getTime() > Date.now()) {
          pinStatus = "LOCKED";
        } else if (pinConfigured) {
          pinStatus = "CONFIGURED";
        }

        setWalletSecurityStatus({
          pinConfigured,
          pinHash: sec.pinHash || pay.pinHash || undefined,
          pinSalt: sec.pinSalt,
          pinCreatedAt: sec.pinCreatedAt || null,
          pinUpdatedAt: sec.pinUpdatedAt || null,
          failedPinAttempts,
          lastFailedAttemptAt: sec.lastFailedAttemptAt || null,
          lockedUntil,
          pinStatus,
          pinResetRequested
        });

        setPaymentSettings({
          pinConfigured,
          pinEnabled: pay.pinEnabled ?? pinConfigured,
          biometricAuth: pay.biometricAuth ?? true,
          preferredMobileMoney: pay.preferredMobileMoney || "Orange Money",
          currency: pay.currency || "FCFA (XOF)",
          dailyLimit: pay.dailyLimit || 500000,
          paymentConfirmation: pay.paymentConfirmation ?? true
        });
      }
    }, (err) => {
      console.warn("Wallet security snapshot listener error:", err);
    });

    return () => unsub();
  }, [currentUser]);

  const refreshWalletSecurityStatus = useCallback(async (): Promise<WalletSecurityData> => {
    if (!currentUser?.uid) {
      const def: WalletSecurityData = { pinConfigured: false, failedPinAttempts: 0, pinStatus: "NOT_CONFIGURED" };
      setWalletSecurityStatus(def);
      return def;
    }
    const status = await WalletSecurityService.getWalletSecurityStatus(currentUser.uid);
    setWalletSecurityStatus(status);
    return status;
  }, [currentUser]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"VERIFY" | "SETUP_STEP1" | "SETUP_STEP2" | "SOA_RECOVERY" | "SUCCESS">("VERIFY");
  const [actionDesc, setActionDesc] = useState("");
  const [enteredPin, setEnteredPin] = useState("");
  const [tempPin, setTempPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [lockedMins, setLockedMins] = useState<number | null>(null);
  const [resolver, setResolver] = useState<((val: boolean) => void) | null>(null);

  const isWalletSessionActive = sessionExpiry !== null && Date.now() < sessionExpiry;

  const clearWalletSession = useCallback(() => {
    setSessionExpiry(null);
    try {
      sessionStorage.removeItem("wallet_session_token");
    } catch (e) {}
  }, []);

  const requireWalletAuthentication = useCallback(async (action: string, forceReauth = false): Promise<boolean> => {
    if (!currentUser) return false;
    
    try {
      const status = await WalletSecurityService.getWalletSecurityStatus(currentUser.uid);
      
      if (status.pinResetRequested || status.pinStatus === "RESET_PENDING") {
        setErrorMsg("Une réinitialisation de votre code PIN est en cours via S-O-A. Veuillez reconfigurer votre code.");
      }

      if (status.pinStatus === "NOT_CONFIGURED") {
        return true;
      }

      const requiresForcedAuth = ["PURCHASE", "WITHDRAWAL", "TRANSFER", "PAYMENT_METHOD_CHANGE", "PIN_CHANGE", "DESACTIVATION_PROTECTION_PIN"].includes(action);
      
      if (!forceReauth && !requiresForcedAuth && sessionExpiry !== null && Date.now() < sessionExpiry) {
        return true;
      }

      // Open Modal
      setModalMode("VERIFY");
      setActionDesc(action);
      setShowModal(true);
      setEnteredPin("");
      setErrorMsg("");
      setAttemptsRemaining(null);
      setLockedMins(null);

      return new Promise<boolean>((resolve) => {
        setResolver(() => resolve);
      });
    } catch (e) {
      console.warn("Could not check wallet security status:", e);
      return false; 
    }
  }, [currentUser, sessionExpiry]);

  const setupWalletPin = useCallback(async (): Promise<boolean> => {
    if (!currentUser) return false;
    
    setModalMode("SETUP_STEP1");
    setActionDesc("CREATION_CODE_PIN");
    setShowModal(true);
    setEnteredPin("");
    setTempPin("");
    setErrorMsg("");

    return new Promise<boolean>((resolve) => {
        setResolver(() => resolve);
    });
  }, [currentUser]);

  const changeWalletPin = useCallback(async (): Promise<boolean> => {
    const authenticated = await requireWalletAuthentication("MODIFICATION_CODE_PIN", true);
    if (!authenticated) return false;
    
    return await setupWalletPin();
  }, [requireWalletAuthentication, setupWalletPin]);

  const disableWalletPin = useCallback(async (): Promise<boolean> => {
    if (!currentUser) return false;
    const authenticated = await requireWalletAuthentication("DESACTIVATION_PROTECTION_PIN", true);
    if (!authenticated) return false;

    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        "walletSecurity.pinConfigured": false,
        "walletSecurity.pinStatus": "NOT_CONFIGURED",
        "walletSecurity.pinHash": null,
        "walletSecurity.pinSalt": null,
        "paymentSettings.pinEnabled": false
      });
      clearWalletSession();
      return true;
    } catch (e) {
      console.error("Error disabling PIN:", e);
      return false;
    }
  }, [currentUser, requireWalletAuthentication, clearWalletSession]);

  const requestPinResetSOA = useCallback(async (reason = "Code oublié"): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      await WalletSecurityService.requestPinReset(currentUser.uid);
      setSuccessMsg("Demande d'assistance transmise avec succès au Support Officiel AFRIGOMBO (S-O-A).");
      setModalMode("SUCCESS");
      return true;
    } catch (e: any) {
      setErrorMsg(e.message || "Erreur lors de la demande d'assistance.");
      return false;
    }
  }, [currentUser]);

  const handlePinSubmit = async (pin: string) => {
    if (!currentUser || !resolver) return;
    setErrorMsg("");
    setAttemptsRemaining(null);
    
    if (modalMode === "VERIFY") {
      try {
        const result = await WalletSecurityService.verifyPin(currentUser.uid, pin, actionDesc);
        if (result.result === "PIN_VALID") {
          setSessionExpiry(Date.now() + 15 * 60 * 1000); // 15 mins session
          if (result.sessionToken) {
            try { sessionStorage.setItem("wallet_session_token", result.sessionToken); } catch (e) {}
          }
          setShowModal(false);
          resolver(true);
          setResolver(null);
        } else if (result.result === "PIN_LOCKED") {
          setErrorMsg(result.message || "Wallet temporairement verrouillé.");
          setLockedMins(result.lockedMinutesRemaining || 15);
          setEnteredPin("");
        } else {
          setErrorMsg(result.message || "Code PIN incorrect.");
          if (typeof result.attemptsRemaining === "number") {
            setAttemptsRemaining(result.attemptsRemaining);
          }
          setEnteredPin("");
        }
      } catch (e: any) {
        setErrorMsg(e.message || "Erreur de validation du secret.");
        setEnteredPin("");
      }
    } else if (modalMode === "SETUP_STEP1") {
      const validation = WalletSecurityService.validatePinStrength(pin);
      if (!validation.valid) {
        setErrorMsg(validation.reason || "Code trop simple ou invalide.");
        setEnteredPin("");
        return;
      }
      setTempPin(pin);
      setEnteredPin("");
      setModalMode("SETUP_STEP2");
    } else if (modalMode === "SETUP_STEP2") {
      if (pin !== tempPin) {
        setErrorMsg("Les codes ne correspondent pas. Recommencez.");
        setEnteredPin("");
        setModalMode("SETUP_STEP1");
        return;
      }
      try {
        const res = await WalletSecurityService.createPin(currentUser.uid, pin);
        if (!res.success) {
          setErrorMsg(res.error || "Erreur lors de la sauvegarde du PIN.");
          // Keep the PIN state intact on error so user can see error and retry
          return;
        }
        setSessionExpiry(Date.now() + 15 * 60 * 1000);
        setShowModal(false);
        resolver(true);
        setResolver(null);
      } catch (e: any) {
        setErrorMsg(e.message || "Erreur de création.");
      }
    }
  };

  const handleCancel = () => {
    if (resolver) resolver(false);
    setShowModal(false);
    setResolver(null);
    setEnteredPin("");
    setTempPin("");
    setErrorMsg("");
    setAttemptsRemaining(null);
    setLockedMins(null);
  };

  const getFriendlyActionTitle = (act: string) => {
    switch (act) {
      case "CONSULTATION_WALLET": return "Accès au Wallet";
      case "PURCHASE":
      case "ACHAT_GOMBO_ADS": return "Validation d'Achat Financial";
      case "WITHDRAWAL":
      case "DEMANDE_DE_RETRAIT": return "Demande de Retrait";
      case "TRANSFER":
      case "TRANSFERT_P2P": return "Transfert de Fonds";
      case "PAYMENT_METHOD_CHANGE": return "Modification des Paiements";
      case "MODIFICATION_CODE_PIN": return "Modification du PIN";
      case "DESACTIVATION_PROTECTION_PIN": return "Désactivation du PIN";
      default: return act.replace(/_/g, ' ');
    }
  };

  return (
    <WalletSecurityContext.Provider value={{
      requireWalletAuthentication,
      setupWalletPin,
      changeWalletPin,
      disableWalletPin,
      requestPinResetSOA,
      isWalletSessionActive,
      clearWalletSession,
      walletSecurityStatus,
      paymentSettings,
      refreshWalletSecurityStatus
    }}>
      {children}

      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[10000] flex items-center justify-center p-4 overflow-hidden"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-950 border border-[#D4AF37]/40 rounded-[32px] max-w-sm w-full p-6 sm:p-8 text-center space-y-6 shadow-[0_0_50px_rgba(0,0,0,1)] relative overflow-hidden text-white"
            >
              {/* Gold Top Accent & Glow */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="flex flex-col items-center gap-3 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/30 shadow-inner">
                  <Lock className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-black uppercase text-white font-display tracking-[0.15em]">
                    {modalMode === "VERIFY" 
                      ? "🔐 SÉCURITÉ WALLET" 
                      : modalMode === "SOA_RECOVERY"
                      ? "🆘 ASSISTANCE S-O-A"
                      : modalMode === "SUCCESS"
                      ? "✅ DEMANDE TRANSMISE"
                      : "🔐 SECRET DE SÉCURITÉ"}
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                    {modalMode === "VERIFY" 
                      ? "Code Secret requis pour continuer" 
                      : modalMode === "SETUP_STEP1" 
                      ? "Créez votre code secret (6 chiffres)" 
                      : modalMode === "SETUP_STEP2"
                      ? "Confirmez votre code secret"
                      : modalMode === "SOA_RECOVERY"
                      ? "Support Officiel AFRIGOMBO (S-O-A)"
                      : "Procédure validée"}
                  </p>
                </div>
                
                {actionDesc && modalMode === "VERIFY" && (
                  <div className="px-3 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                    <p className="text-[11px] text-zinc-400 font-medium">
                      Opération : <span className="text-[#D4AF37] font-bold uppercase tracking-wider">{getFriendlyActionTitle(actionDesc)}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Mode: SOA RECOVERY */}
              {modalMode === "SOA_RECOVERY" && (
                <div className="space-y-4 relative z-10 text-left">
                  <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-xs text-zinc-300 space-y-2">
                    <p className="font-bold text-[#D4AF37]">
                      🔐 Code secret oublié ?
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Pour votre sécurité financière, votre ancien code ne peut pas être affiché en clair.
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Une demande de réinitialisation sera envoyée directement au <strong>Support Officiel AFRIGOMBO (S-O-A)</strong>.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => requestPinResetSOA("Code PIN oublié par l'utilisateur")}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-98 cursor-pointer"
                    >
                      Envoyer demande à S-O-A 🆘
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalMode("VERIFY")}
                      className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white font-bold text-xs uppercase transition-all cursor-pointer"
                    >
                      Retour au clavier
                    </button>
                  </div>
                </div>
              )}

              {/* Modal Mode: SUCCESS */}
              {modalMode === "SUCCESS" && (
                <div className="space-y-4 relative z-10">
                  <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 space-y-2">
                    <CheckCircle className="w-8 h-8 mx-auto text-emerald-400" />
                    <p className="font-bold text-sm">{successMsg}</p>
                    <p className="text-[10px] text-emerald-400/80">L'équipe S-O-A traitera votre dossier en priorité.</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              )}

              {/* Modal Mode: KEYPAD PIN ENTRY (VERIFY / SETUP_STEP1 / SETUP_STEP2) */}
              {(modalMode === "VERIFY" || modalMode === "SETUP_STEP1" || modalMode === "SETUP_STEP2") && (
                <>
                  {/* 6 Dots Indicator */}
                  <div className="flex justify-center items-center gap-3 relative z-10 py-1">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                          idx < enteredPin.length 
                            ? "bg-[#D4AF37] border-[#D4AF37] scale-125 shadow-[0_0_12px_rgba(212,175,55,0.7)]" 
                            : "bg-transparent border-zinc-800"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Feedback Banner */}
                  {errorMsg && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/10 border border-red-500/20 py-2.5 px-3 rounded-xl"
                    >
                      <p className="text-[11px] text-red-400 font-bold">
                        ⚠️ {errorMsg}
                      </p>
                      {attemptsRemaining !== null && attemptsRemaining > 0 && (
                        <p className="text-[9px] text-red-400/80 font-mono mt-0.5">
                          {attemptsRemaining} tentative(s) restante(s) avant verrouillage.
                        </p>
                      )}
                      {lockedMins !== null && (
                        <p className="text-[9px] text-amber-400 font-mono mt-0.5">
                          🔒 Compte verrouillé pour {lockedMins} minute(s).
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* 3x4 Keypad Grid */}
                  <div className="grid grid-cols-3 gap-y-3 gap-x-4 max-w-[240px] mx-auto pt-1 relative z-10">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          if (enteredPin.length >= 6) return;
                          const nextPin = enteredPin + num;
                          setEnteredPin(nextPin);
                          if (nextPin.length === 6) {
                            handlePinSubmit(nextPin);
                          }
                        }}
                        className="w-13 h-13 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:bg-zinc-800 hover:border-[#D4AF37]/40 text-lg font-bold font-mono text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="w-13 h-13 rounded-2xl flex items-center justify-center text-[10px] font-black text-zinc-500 hover:text-red-400 transition-colors uppercase tracking-widest active:scale-95 cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      key={0}
                      type="button"
                      onClick={() => {
                        if (enteredPin.length >= 6) return;
                        const nextPin = enteredPin + "0";
                        setEnteredPin(nextPin);
                        if (nextPin.length === 6) {
                          handlePinSubmit(nextPin);
                        }
                      }}
                      className="w-13 h-13 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:bg-zinc-800 hover:border-[#D4AF37]/40 text-lg font-bold font-mono text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEnteredPin(prev => prev.slice(0, -1));
                        setErrorMsg("");
                      }}
                      className="w-13 h-13 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-[#D4AF37] transition-colors active:scale-95 cursor-pointer text-base"
                    >
                      ⌫
                    </button>
                  </div>

                  {/* Footer recovery link */}
                  {modalMode === "VERIFY" && (
                    <div className="pt-2">
                      <button 
                        type="button"
                        onClick={() => {
                          setErrorMsg("");
                          setModalMode("SOA_RECOVERY");
                        }}
                        className="text-[10px] text-zinc-500 hover:text-[#D4AF37] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Code oublié ? Contacter S-O-A
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </WalletSecurityContext.Provider>
  );
}

export const useWalletSecurity = () => {
  const ctx = useContext(WalletSecurityContext);
  if (!ctx) throw new Error("Missing WalletSecurityProvider");
  return ctx;
};
