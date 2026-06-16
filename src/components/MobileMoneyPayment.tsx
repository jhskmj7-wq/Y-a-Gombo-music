import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Check, 
  Smartphone, 
  ShieldCheck, 
  ChevronRight, 
  Loader2, 
  Lock, 
  CheckCircle2, 
  FileText, 
  Download, 
  X,
  CreditCard
} from "lucide-react";
import { gomboDB } from "../firebase";
import { audioSynth } from "../lib/audio";

interface MobileMoneyPaymentProps {
  reservationId: string;
  gomboTitle: string;
  amount: number;
  musicianName: string;
  onPaymentSuccess?: () => void;
  onClose?: () => void;
}

type Operator = "wave" | "orange";
type PaymentStep = "configure" | "processing" | "prompt_sent" | "receipt";

export default function MobileMoneyPayment({
  reservationId,
  gomboTitle,
  amount,
  musicianName,
  onPaymentSuccess,
  onClose
}: MobileMoneyPaymentProps) {
  const [operator, setOperator] = useState<Operator>("wave");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [step, setStep] = useState<PaymentStep>("configure");
  const [errorMSG, setErrorMSG] = useState("");
  const [countdown, setCountdown] = useState(15);
  const [transactionId, setTransactionId] = useState("");
  const [paymentDate, setPaymentDate] = useState("");

  const fee = Math.round(amount * 0.01); // 1.0% System security fee
  const totalAmount = amount + fee;

  // Sound triggering safely
  const triggerTickSound = () => {
    try {
      audioSynth.playKoraNote(329.63, 0, 0.05, 0.2); // Soft warm tone
    } catch (_) {}
  };

  const triggerSuccessSound = () => {
    try {
      audioSynth.playKoraSuccess();
    } catch (_) {
      try {
        audioSynth.playKoraNote(523.25, 0, 0.15, 0.6);
      } catch (_) {}
    }
  };

  // Pre-fill phone if input is empty
  useEffect(() => {
    // Ivory Coast number standard is 10 digits (e.g. 07 00 00 00 00)
    setPhoneNumber("07 35 12 99 44");
  }, []);

  // Countdown effect during Push USSD Prompt simulation
  useEffect(() => {
    let timer: any;
    if (step === "prompt_sent") {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSuccessConfirmation();
            return 0;
          }
          triggerTickSound();
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step]);

  const handleInitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMSG("");

    // Simple Ivorian number validation (10 digits with spaces optional)
    const cleanNum = phoneNumber.replace(/\s+/g, "");
    if (cleanNum.length < 10) {
      setErrorMSG("Veuillez saisir un numéro de téléphone ivoirien valide à 10 chiffres (Ex: 07...) !");
      return;
    }

    triggerTickSound();
    setStep("processing");

    // Simulate Network Request
    setTimeout(() => {
      setStep("prompt_sent");
      setCountdown(12);
    }, 2000);
  };

  const handleForceValidate = () => {
    handleSuccessConfirmation();
  };

  const handleSuccessConfirmation = async () => {
    if (step === "receipt") return;

    try {
      // 1. Generate unique transaction hash 
      const txHash = "TXN-" + operator.toUpperCase() + "-" + Math.random().toString(36).substring(2, 10).toUpperCase();
      setTransactionId(txHash);
      setPaymentDate(new Date().toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "medium" }));

      // 2. Persist state in firestore system
      await gomboDB.updateReservationStatus(reservationId, "paye");
      
      // 3. Confirm transition
      setStep("receipt");
      triggerSuccessSound();

      // 4. Hook custom callback
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (err) {
      console.error("Payment registration failure:", err);
      setErrorMSG("Erreur lors de l'enregistrement de la transaction dans le système.");
      setStep("configure");
    }
  };

  return (
    <div className="bg-[#09090B] border border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl relative select-none">
      
      {/* HEADER */}
      <div className="bg-zinc-950 px-5 py-4 border-b border-zinc-900 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-yellow-500/10 text-yellow-500 rounded-lg">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-[#D4AF37] font-black">
              Simulateur Mobile Money
            </h4>
            <span className="text-[9px] text-zinc-500 font-mono">CADRE SÉCURISÉ AFRIGOMBO</span>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        
        {/* STEP 1: CONFIGURE PAYMENT */}
        {step === "configure" && (
          <motion.form 
            key="configure"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleInitPayment}
            className="p-5 space-y-4"
          >
            {/* Operator choice toggle */}
            <div>
              <label className="block text-[10px] font-mono tracking-wider text-zinc-400 uppercase mb-2">
                Sélectionner l'Opérateur :
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* WAVE */}
                <button
                  type="button"
                  onClick={() => { setOperator("wave"); triggerTickSound(); }}
                  className={`relative p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    operator === "wave" 
                      ? "bg-[#1B90FF]/10 border-[#1B90FF] text-white" 
                      : "bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#1B90FF] flex items-center justify-center text-white text-lg font-black font-sans shadow-lg shadow-[#1B90FF]/20">
                    🌊
                  </div>
                  <span className="text-xs font-bold tracking-wide">WAVE</span>
                  {operator === "wave" && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#1B90FF]" />
                  )}
                </button>

                {/* ORANGE MONEY */}
                <button
                  type="button"
                  onClick={() => { setOperator("orange"); triggerTickSound(); }}
                  className={`relative p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    operator === "orange" 
                      ? "bg-[#FF6600]/10 border-[#FF6600] text-white" 
                      : "bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#FF6600] flex items-center justify-center text-white text-lg font-black font-sans shadow-lg shadow-[#FF6600]/20">
                    🍊
                  </div>
                  <span className="text-xs font-bold tracking-wide">ORANGE MONEY</span>
                  {operator === "orange" && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF6600]" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMSG && (
              <div className="p-3 bg-red-950/20 text-red-400 text-xs rounded-xl border border-red-900/50">
                {errorMSG}
              </div>
            )}

            {/* Phone Number Entry */}
            <div>
              <label className="block text-[10px] font-mono tracking-wider text-zinc-400 uppercase mb-1.5">
                Numéro de Scellage Mobile Money (Côte d'Ivoire) :
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-600">
                  <Smartphone className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="07 00 00 00 00"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-black border border-zinc-850 rounded-xl text-sm focus:outline-none focus:border-[#D4AF37] text-white font-mono"
                />
              </div>
            </div>

            {/* Transaction breakdown */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-zinc-500">
                <span>Description :</span>
                <span className="text-zinc-300 truncate max-w-[180px]">{gomboTitle}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Cachet réservé :</span>
                <span className="text-zinc-300">{amount.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Frais de scellage (1%) :</span>
                <span className="text-zinc-300">{fee.toLocaleString()} FCFA</span>
              </div>
              <div className="h-[1px] bg-zinc-900 my-1" />
              <div className="flex justify-between text-[#D4AF37] font-bold">
                <span>MONTANT DE BLOCAGE :</span>
                <span>{totalAmount.toLocaleString()} FCFA</span>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                operator === "wave"
                  ? "bg-[#1B90FF] text-white hover:bg-[#1579D9] shadow-lg shadow-[#1B90FF]/15"
                  : "bg-[#FF6600] text-white hover:bg-[#E05900] shadow-lg shadow-[#FF6600]/15"
              }`}
            >
              <span>DEPOSER CACHET PAR {operator === "wave" ? "WAVE" : "ORANGE"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-600 font-mono">
              <Lock className="w-3 h-3 text-[#D4AF37]" />
              <span>Crypter avec la norme de protection AfriGombo escrow v2.1</span>
            </div>
          </motion.form>
        )}

        {/* STEP 2: PROCESSING SIMULATION */}
        {step === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-8 text-center flex flex-col items-center justify-center space-y-4"
          >
            <div className={`p-4 rounded-full ${operator === "wave" ? "bg-[#1B90FF]/10 text-[#1B90FF]" : "bg-[#FF6600]/10 text-[#FF6600]"} animate-pulse`}>
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            
            <div className="space-y-1">
              <h5 className="font-sans font-bold text-sm text-white">Connexion aux systèmes de paiement...</h5>
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
                Initiation du protocole {operator === "wave" ? "Wave CI API" : "Orange Money CI USSD"}
              </p>
            </div>

            <p className="max-w-xs text-[10px] text-zinc-600 leading-normal font-mono">
              Nous interrogeons les relais financiers d'Abidjan pour acheminer en toute sécurité la demande de blocage au numéro {phoneNumber}.
            </p>
          </motion.div>
        )}

        {/* STEP 3: USER PROMPT SIMULATION */}
        {step === "prompt_sent" && (
          <motion.div
            key="prompt_sent"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 space-y-5"
          >
            {/* Visual Phone push notification mimic */}
            <div className="border border-zinc-850 bg-black rounded-2xl p-4 text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-amber-600 animate-pulse" />
              
              <div className="flex justify-center mb-2">
                <span className="text-2xl animate-bounce">📱</span>
              </div>

              <h6 className="text-[10px] font-mono tracking-widest text-[#D4AF37] font-bold uppercase mb-1">
                Notification Push simulée envoyer !
              </h6>
              
              <p className="text-xs text-zinc-300 font-sans max-w-sm mx-auto leading-relaxed">
                {operator === "wave" 
                  ? `Ouvrez votre application Wave sur le téléphone et validez le paiement de ${totalAmount.toLocaleString()} FCFA.`
                  : `Tapez votre code secret Orange Money suite au prompt USSD reçu directement sur votre mobile pour valider.`
                }
              </p>

              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 rounded-full font-mono text-[10px] text-zinc-500">
                <span>Validation automatique dans :</span>
                <strong className="text-white text-xs">{countdown}s</strong>
              </div>
            </div>

            {/* Actions for developer / user convenience */}
            <div className="space-y-2">
              <button
                onClick={handleForceValidate}
                className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#B48F17] text-black rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                Simuler Succès de Validation Direct (OK) ⚡
              </button>

              <button
                onClick={() => { triggerTickSound(); setStep("configure"); }}
                className="w-full py-2 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl font-mono text-[10px] uppercase transition-colors cursor-pointer"
              >
                Annuler et modifier les informations
              </button>
            </div>
            
            <p className="text-center text-[9px] text-[#D4AF37]/60 font-mono uppercase tracking-wide leading-normal">
              🛡️ Escrow Sécurisé : l'argent de ce cachet restera consigné en lieu sûr sur AFRIGOMBO jusqu'à la fin de la performance
            </p>
          </motion.div>
        )}

        {/* STEP 4: INTERACTIVE SECURE TRANSACTION RECEIPT */}
        {step === "receipt" && (
          <motion.div
            key="receipt"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-5.5 space-y-4"
          >
            {/* Visual Receipt Layout with decorative cutouts */}
            <div className="bg-white text-black rounded-2xl p-5 relative overflow-hidden select-text border border-zinc-200">
              
              {/* Confirmed Indicator */}
              <div className="flex flex-col items-center text-center space-y-1 mb-4 border-b border-dashed border-zinc-300 pb-4">
                <div className="p-1 bg-emerald-100 text-emerald-600 rounded-full">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h5 className="font-sans font-black uppercase tracking-wide text-xs text-zinc-900 mt-1">
                  BLOCAGE SCELLÉ AVEC SUCCÈS
                </h5>
                <span className="text-[9px] font-mono text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full uppercase">
                  RECU DE TRANSACTION NUMÉRIQUE SÉCURISÉ
                </span>
              </div>

              {/* Transaction Detail Lines */}
              <div className="space-y-2.5 font-mono text-[11px] text-zinc-805">
                <div className="flex justify-between">
                  <span className="text-zinc-400">ID TRANSACTION :</span>
                  <strong className="text-zinc-900 font-bold font-mono">{transactionId}</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-400 font-mono">CODE RÉSERVATION :</span>
                  <strong className="text-zinc-900 font-mono">{reservationId}</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-400">PLAN MUSICAL :</span>
                  <strong className="text-zinc-900 truncate max-w-[150px] font-mono">{gomboTitle}</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-400">ARTISTE SCELLÉ :</span>
                  <strong className="text-zinc-900 font-mono">{musicianName}</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-400">VIA MOBILE :</span>
                  <strong className="text-zinc-900 font-mono uppercase">
                    {operator === "wave" ? "🌊 WAVE" : "🍊 ORANGE"} ({phoneNumber})
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-400">DATE & HEURE :</span>
                  <span className="text-zinc-900 font-mono">{paymentDate || "16/06/2026 à 12:00"}</span>
                </div>

                <div className="h-[1px] bg-zinc-200 my-2" />

                <div className="flex justify-between text-zinc-950 font-bold text-xs uppercase leading-none">
                  <span>MONTANT TOTAL DÉPOSÉ :</span>
                  <span className="text-emerald-700">{totalAmount.toLocaleString()} FCFA</span>
                </div>
              </div>

              {/* Stamp lookalike */}
              <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px]">🛡️</span>
                  <div className="flex flex-col text-left">
                    <span className="text-[8px] font-bold text-emerald-800 leading-none">CONSIGNATION GARANTIE</span>
                    <span className="text-[7px] text-zinc-400 leading-none mt-0.5 font-mono">Dépôt séquestre de confiance</span>
                  </div>
                </div>
                <div className="border border-emerald-600/30 text-emerald-700 bg-emerald-50/60 font-mono text-[7px] font-black tracking-widest uppercase py-1 px-1.5 rounded rotate-3 select-none">
                  💰 AFRIGOMBO PAIÉ
                </div>
              </div>

            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  triggerSuccessSound();
                  alert("Simulation de téléchargement du PDF de transaction réussie !");
                }}
                className="py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white border border-zinc-800 rounded-xl font-mono text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger Reçu</span>
              </button>

              <button
                onClick={onClose}
                className="py-2.5 bg-[#D4AF37] hover:bg-[#B48F17] text-black rounded-xl font-mono text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                <span>Fermer le Portail</span>
              </button>
            </div>
            
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
