import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { ShieldCheck, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { WalletSecurityService } from "../lib/WalletSecurityService";
import { useAuth } from "../AuthContext";
import { db } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

interface WalletSecurityContextValue {
  requireWalletAuthentication: (action: string, forceReauth?: boolean) => Promise<boolean>;
  setupWalletPin: () => Promise<boolean>;
  changeWalletPin: () => Promise<boolean>;
  isWalletSessionActive: boolean;
  clearWalletSession: () => void;
}

const WalletSecurityContext = createContext<WalletSecurityContextValue | null>(null);

export function WalletSecurityProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"VERIFY" | "SETUP_STEP1" | "SETUP_STEP2">("VERIFY");
  const [actionDesc, setActionDesc] = useState("");
  const [enteredPin, setEnteredPin] = useState("");
  const [tempPin, setTempPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [resolver, setResolver] = useState<((val: boolean) => void) | null>(null);

  const isWalletSessionActive = sessionExpiry !== null && Date.now() < sessionExpiry;

  const clearWalletSession = useCallback(() => {
    setSessionExpiry(null);
    sessionStorage.removeItem("wallet_session_token");
  }, []);

  const requireWalletAuthentication = useCallback(async (action: string, forceReauth = false): Promise<boolean> => {
    if (!currentUser) return false;
    
    try {
      const status = await WalletSecurityService.getWalletSecurityStatus(currentUser.uid);
      
      if (status.pinStatus !== "CONFIGURED") {
        return true;
      }

      const requiresForcedAuth = ["PURCHASE", "WITHDRAWAL", "TRANSFER", "PAYMENT_METHOD_CHANGE"].includes(action);
      
      if (!forceReauth && !requiresForcedAuth && sessionExpiry !== null && Date.now() < sessionExpiry) {
        return true;
      }

      // Open Modal
      setModalMode("VERIFY");
      setActionDesc(action);
      setShowModal(true);
      setEnteredPin("");
      setErrorMsg("");

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

  const handlePinSubmit = async (pin: string) => {
    if (!currentUser || !resolver) return;
    setErrorMsg("");
    
    if (modalMode === "VERIFY") {
        try {
            const result = await WalletSecurityService.verifyPin(currentUser.uid, pin, actionDesc);
            if (result.result === "PIN_VALID") {
                setSessionExpiry(Date.now() + 15 * 60 * 1000);
                if (result.sessionToken) {
                    sessionStorage.setItem("wallet_session_token", result.sessionToken);
                }
                setShowModal(false);
                resolver(true);
                setResolver(null);
            } else {
                setErrorMsg(result.message);
                setEnteredPin("");
            }
        } catch (e: any) {
            setErrorMsg(e.message || "Erreur de validation");
            setEnteredPin("");
        }
    } else if (modalMode === "SETUP_STEP1") {
        const validation = WalletSecurityService.validatePinStrength(pin);
        if (!validation.valid) {
            setErrorMsg(validation.reason || "Code trop simple");
            setEnteredPin("");
            return;
        }
        setTempPin(pin);
        setEnteredPin("");
        setModalMode("SETUP_STEP2");
    } else if (modalMode === "SETUP_STEP2") {
        if (pin !== tempPin) {
            setErrorMsg("Les codes ne correspondent pas");
            setEnteredPin("");
            setModalMode("SETUP_STEP1");
            return;
        }
        try {
            await WalletSecurityService.createPin(currentUser.uid, pin);
            setShowModal(false);
            resolver(true);
            setResolver(null);
        } catch (e: any) {
            setErrorMsg(e.message || "Erreur de création");
            setEnteredPin("");
            setModalMode("SETUP_STEP1");
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
  };

  return (
    <WalletSecurityContext.Provider value={{ requireWalletAuthentication, setupWalletPin, changeWalletPin, isWalletSessionActive, clearWalletSession }}>
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
              className="bg-zinc-950 border border-afri-gold/30 rounded-[32px] max-w-sm w-full p-8 text-center space-y-8 shadow-[0_0_50px_rgba(0,0,0,1)] relative overflow-hidden"
            >
              {/* Decorative Background Elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-afri-gold/50 to-transparent" />
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-afri-gold/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-afri-gold/5 rounded-full blur-3xl" />

              <div className="flex flex-col items-center gap-4 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-afri-gold/10 flex items-center justify-center text-afri-gold border border-afri-gold/20 shadow-inner">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase text-white font-display tracking-[0.2em]">
                    {modalMode === "VERIFY" ? "SÉCURITÉ TICALE" : "CONFIGURATION PIN"}
                  </h3>
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-afri-gold" />
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                      {modalMode === "VERIFY" ? "Authentification Requise" : modalMode === "SETUP_STEP1" ? "Choisir un Code PIN" : "Confirmer le Code PIN"}
                    </p>
                    <div className="w-1 h-1 rounded-full bg-afri-gold" />
                  </div>
                </div>
                
                <div className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                  <p className="text-xs text-zinc-400 font-medium">
                    {modalMode === "VERIFY" ? "Action : " : "Opération : "}
                    <span className="text-afri-gold font-bold uppercase tracking-wider">{actionDesc.replace(/_/g, ' ')}</span>
                  </p>
                </div>
              </div>

              <div className="flex justify-center items-center gap-4 relative z-10">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                      idx < enteredPin.length 
                        ? "bg-afri-gold border-afri-gold scale-125 shadow-[0_0_15px_rgba(212,175,55,0.6)]" 
                        : "bg-transparent border-zinc-800"
                    }`}
                  />
                ))}
              </div>

              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/20 py-2 px-4 rounded-xl"
                >
                  <p className="text-[11px] text-red-400 font-bold font-sans">
                    ⚠️ {errorMsg}
                  </p>
                </motion.div>
              )}

              <div className="grid grid-cols-3 gap-y-4 gap-x-6 max-w-[260px] mx-auto pt-2 relative z-10">
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
                    className="w-14 h-14 rounded-2xl bg-zinc-900/80 border border-zinc-800/50 hover:bg-zinc-800 hover:border-afri-gold/30 text-xl font-bold font-mono text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-lg"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-[10px] font-black text-zinc-500 hover:text-red-400 transition-colors uppercase tracking-widest active:scale-90"
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
                  className="w-14 h-14 rounded-2xl bg-zinc-900/80 border border-zinc-800/50 hover:bg-zinc-800 hover:border-afri-gold/30 text-xl font-bold font-mono text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-lg"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEnteredPin(prev => prev.slice(0, -1));
                    setErrorMsg("");
                  }}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-afri-gold transition-colors active:scale-90 cursor-pointer"
                >
                  <motion.span whileTap={{ x: -2 }}>⌫</motion.span>
                </button>
              </div>

              <div className="pt-4">
                <button 
                  onClick={() => {
                    // Logic for forgot PIN could be added here
                    setShowModal(false);
                    if (resolver) resolver(false);
                    setResolver(null);
                    // Navigate to security settings or SAO
                  }}
                  className="text-[10px] text-zinc-600 hover:text-afri-gold font-bold uppercase tracking-widest transition-colors"
                >
                  Code oublié ? Contacter SAO
                </button>
              </div>
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
