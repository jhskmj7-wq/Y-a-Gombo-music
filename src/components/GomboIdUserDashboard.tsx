import React, { useState, useRef } from "react";
import { 
  ShieldCheck, 
  Award, 
  FileText, 
  Camera, 
  Music, 
  ArrowRight, 
  Lock, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  X, 
  Zap, 
  Sparkles,
  RefreshCw,
  Eye,
  Check
} from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebase";
import { User } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface GomboIdUserDashboardProps {
  currentUser: User;
  onUpdateUser: (userData: Partial<User>) => Promise<void>;
  onCreateTransaction: (amount: number, type: any, description: string) => Promise<void>;
  addToTerminal?: (msg: string) => void;
}

export default function GomboIdUserDashboard({
  currentUser,
  onUpdateUser,
  onCreateTransaction,
  addToTerminal = () => {}
}: GomboIdUserDashboardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"intro" | "conditions" | "upload" | "checkout" | "submitted">("intro");
  
  // kyc state
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // files & previews
  const [files, setFiles] = useState<{
    idCard: File | null;
    selfie: File | null;
    musicProof: File | null;
  }>({
    idCard: null,
    selfie: null,
    musicProof: null
  });

  const [previews, setPreviews] = useState<{
    idCard: string;
    selfie: string;
    musicProof: string;
  }>({
    idCard: "",
    selfie: "",
    musicProof: ""
  });

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [selectedKycType, setSelectedKycType] = useState<"standard" | "express">("standard");

  // drag hover flags
  const [dragActive, setDragActive] = useState<{ [key: string]: boolean }>({
    idCard: false,
    selfie: false,
    musicProof: false
  });

  const fileInputRefs = {
    idCard: useRef<HTMLInputElement>(null),
    selfie: useRef<HTMLInputElement>(null),
    musicProof: useRef<HTMLInputElement>(null)
  };

  // Status mapping helper
  const getStatusDisplay = () => {
    const status = currentUser.kycStatus;
    const type = currentUser.kycType;

    if (status === "approved") {
      return {
        label: "✅ Talent Certifié",
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        desc: "Félicitations ! Votre compte est certifié d'excellence artistique."
      };
    }
    if (status === "rejected") {
      return {
        label: "🚫 Vérification refusée",
        color: "text-red-400 bg-red-500/10 border-red-500/30",
        desc: "Votre dossier a été refusé. Vous pouvez modifier vos informations et tenter à nouveau."
      };
    }
    if (status === "info_required") {
      return {
        label: "🟡 Informations complémentaires requises",
        color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        desc: currentUser.kycComplementaryInfo || "L'administration requiert d'autres détails concernant votre activité."
      };
    }
    if (status === "pending") {
      if (type === "express") {
        return {
          label: "⚡ En traitement Express (24-72h)",
          color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
          desc: "Dossier prioritaire d'excellence. Un Super Admin examine vos documents en urgence."
        };
      }
      return {
        label: "⏳ En attente de vérification",
        color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30",
        desc: "Dossier en attente dans la file d'attente standard (traitement sous 7-14 jours)."
      };
    }

    return {
      label: "Héritage à Révéler",
      color: "text-zinc-500 bg-zinc-500/5 border-zinc-500/15",
      desc: "Ton héritage musical mérite d'être raconté. Demandez votre GOMBO ID pour sceller votre prestige."
    };
  };

  const statusInfo = getStatusDisplay();

  // File Handling
  const handleFileChange = (type: "idCard" | "selfie" | "musicProof", file: File | null) => {
    if (!file) return;
    
    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setFiles(prev => ({ ...prev, [type]: file }));
    setPreviews(prev => ({ ...prev, [type]: previewUrl }));
    addToTerminal(`[GOMBO ID] Fichier chargé pour ${type} : ${file.name}`);
  };

  const triggerFileInput = (type: "idCard" | "selfie" | "musicProof") => {
    fileInputRefs[type].current?.click();
  };

  // Drag and drop events
  const handleDrag = (e: React.DragEvent, type: "idCard" | "selfie" | "musicProof", active: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: active }));
  };

  const handleDrop = (e: React.DragEvent, type: "idCard" | "selfie" | "musicProof") => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(type, e.dataTransfer.files[0]);
    }
  };

  // Real or simulated upload handler
  const handleUploadDocs = async () => {
    if (!files.idCard || !files.selfie || !files.musicProof) {
      alert("Veuillez téléverser les 3 documents requis.");
      return;
    }

    setUploading(true);
    setUploadProgress("Démarrage du téléversement...");

    try {
      const urls = {
        identityCardUrl: "",
        selfieUrl: "",
        activityUrl: ""
      };

      // Upload to Firebase Storage with Fallback
      for (const [key, file] of Object.entries(files)) {
        if (file) {
          try {
            setUploadProgress(`Téléversement de : ${file.name}...`);
            const storagePath = `kyc/${currentUser.id}/${key}_${Date.now()}_${file.name}`;
            const fileRef = ref(storage, storagePath);
            const snapshot = await uploadBytes(fileRef, file);
            const downloadUrl = await getDownloadURL(snapshot.ref);
            
            if (key === "idCard") urls.identityCardUrl = downloadUrl;
            if (key === "selfie") urls.selfieUrl = downloadUrl;
            if (key === "musicProof") urls.activityUrl = downloadUrl;
            
            addToTerminal(`[STORAGE] Upload réussi pour ${key} : ${storagePath}`);
          } catch (storageErr) {
            console.error("Storage upload failed:", storageErr);
            throw new Error(`Échec du téléversement pour le fichier ${key}. Veuillez vérifier votre connexion et l'accès au stockage.`);
          }
        }
      }

      setUploadProgress("Enregistrement des métadonnées...");

      // Base metadata update
      await onUpdateUser({
        kycDocs: urls,
        kycSubmittedDate: new Date().toLocaleDateString("fr-FR"),
        kycStatus: "pending",
        kycType: selectedKycType
      });

      // If Express chosen
      if (selectedKycType === "express") {
        await onCreateTransaction(
          500,
          "cert_express",
          `⚡ Certification Express GOMBO ID (24-72h) - ${currentUser.artisticName}`
        );
        addToTerminal(`[COMPTA] Encaissement 500 FCFA Gombo ID Express pour ${currentUser.artisticName}`);
      } else {
        addToTerminal(`[GOMBO ID] Demande de vérification Standard soumise par ${currentUser.artisticName}`);
      }

      setStep("submitted");
    } catch (e: any) {
      alert("Une erreur est survenue lors de l'envoi.");
    } finally {
      setUploading(false);
    }
  };

  const handleResetKyc = async () => {
    setFiles({ idCard: null, selfie: null, musicProof: null });
    setPreviews({ idCard: "", selfie: "", musicProof: "" });
    setAcceptedTerms(false);
    setStep("conditions");
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
                                 GOMBO ID CARD (AFRITRUST TRUST ID STYLE)
         ========================================================================= */}
      <motion.div
        whileHover={{ scale: 1.01, y: -2 }}
        className="relative overflow-hidden rounded-3xl border border-[#D4AF37]/35 bg-[#121214] p-6 sm:p-8 shadow-[0_0_30px_rgba(212,175,55,0.08)] transition-all duration-300"
      >
        {/* Subtle decorative security grids in background */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-[#D4AF37]/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Digital ID Header Banner */}
        <div className="flex justify-between items-center border-b border-[#D4AF37]/20 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest font-black text-white/50 uppercase">
              RÉPUBLIQUE DU SHOWBIZ • GOMBO TRUST ID
            </span>
          </div>
          {currentUser.kycStatus === "approved" ? (
            <span className="text-[9px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              AUTHENTIFIÉ ✓
            </span>
          ) : (
            <span className="text-[9px] font-mono bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              PERSPECTIVE DE SOUVERAINETÉ
            </span>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          
          {/* Main ID Details Block */}
          <div className="flex items-center gap-5">
            {/* Avatar section of Gombo ID card */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full border-2 border-[#D4AF37] bg-[#0B0B0B] flex items-center justify-center font-bold text-3xl text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.25)] overflow-hidden">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  currentUser.artisticName.charAt(0)
                )}
              </div>
              {currentUser.kycStatus === "approved" && (
                <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#D4AF37] border-2 border-[#121214] flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.6)]">
                  <Award className="w-3.5 h-3.5 text-black stroke-[3]" />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-2xl font-display font-black text-white tracking-tight">
                  {currentUser.artisticName}
                </h3>
                {currentUser.kycStatus === "approved" && (
                  <span className="inline-flex items-center gap-1 text-[9px] bg-[#D4AF37] text-black px-2 py-0.5 rounded font-black uppercase tracking-wider shadow">
                    ★ ARTISTE CERTIFIÉ
                  </span>
                )}
              </div>
              <p className="text-xs text-white/60 font-medium">Nom civil : {currentUser.name}</p>
              
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1.5">
                <span className="text-[10px] uppercase font-mono bg-white/5 border border-white/10 text-white/50 px-2 py-0.5 rounded">
                  {currentUser.gomboIdNumber || "ID_ASSESSMENT_PENDING"}
                </span>
                <span className="text-[#D4AF37] font-mono text-[10px]">📍 {currentUser.commune}</span>
                <span className="text-white/30">•</span>
                <span className="text-[10px] text-zinc-400 font-semibold">{currentUser.role === "admin" ? "Sénateur / Admin" : "Musicien Professionnel"}</span>
              </div>
            </div>
          </div>

          {/* Micro stats and certification badge */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col items-stretch md:items-end gap-3 bg-black/40 border border-white/5 p-4 rounded-2xl min-w-[220px]">
            <div className="flex-1">
              <span className="text-[9px] uppercase font-mono text-zinc-500 block font-bold">STATUT DE L'EMPREINTE :</span>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase border ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            
            <div className="text-left md:text-right border-t md:border-t-0 sm:border-l md:border-l-0 border-white/5 pt-2 sm:pt-0 md:pt-2 sm:pl-3 md:pl-0">
              <span className="text-[9px] uppercase font-mono text-zinc-500 block font-bold">NIVEAU DE CONFIANCE :</span>
              <strong className="text-sm font-sans font-black text-[#D4AF37] block mt-0.5">
                {currentUser.kycStatus === "approved" ? "99.9% PRESTIGE MAX" : "SOUVERAINETÉ STANDARD"}
              </strong>
            </div>
          </div>

        </div>

        {/* =========================================================================
                 MASSIVE "TRUST ID" INTERACTIVE BANNER BUTTON (FULL WIDTH ACTUATOR)
           ========================================================================= */}
        <div className="mt-8">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setIsOpen(true)}
            className="w-full py-4 px-6 rounded-2xl bg-[#D4AF37] hover:bg-[#B48F17] text-[#0B0B0B] font-display font-black tracking-widest uppercase transition-all duration-300 shadow-[0_0_25px_rgba(212,175,55,0.25)] flex items-center justify-center gap-3 cursor-pointer text-center"
          >
            <ShieldCheck className="w-6 h-6 text-[#0B0B0B] stroke-[2.5]" />
            <span className="text-sm sm:text-base tracking-widest">
              {currentUser.kycStatus === "none" ? "ACTIVER MON GOMBO ID (TRUST ID) 🛡️" : ""}
              {currentUser.kycStatus === "pending" ? "GOMBO ID TRANSMIS • VOIR MON DOSSIER ⏳" : ""}
              {currentUser.kycStatus === "approved" ? "GOMBO ID DE SOUVERAINETÉ CERTIFIÉ ★" : ""}
              {currentUser.kycStatus === "rejected" ? "GOMBO ID REJETÉ • RETENTER L'IMPACT 🚫" : ""}
              {currentUser.kycStatus === "info_required" ? "ACTION REQUISE • CORRIGER L'ID 🟡" : ""}
            </span>
          </motion.button>
          
          <p className="text-center text-[10px] text-zinc-500 font-mono mt-3">
            La clé d'excellence est régulée par le consortium souverain d'AFRIGOMBO Showbiz.
          </p>
        </div>

      </motion.div>

      {/* =========================================================================
                                 DEDICATED MODAL / SLIDER PAGE
         ========================================================================= */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-[#090909] border border-[#D4AF37]/45 rounded-2xl shadow-[0_10px_50px_rgba(212,175,55,0.12)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-[#D4AF37]/20 bg-black">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]">
                    <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h4 className="text-md font-display font-bold text-white uppercase tracking-wider">
                      GOMBO ID d'Excellence Artiste
                    </h4>
                    <span className="text-[10px] font-mono text-[#D4AF37]/80 block -mt-1">
                      AfriTrust Certification Engine
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full border border-white/10 hover:border-white/30 text-white/60 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Status Alert if not None */}
                {currentUser.kycStatus !== "none" && (
                  <div className={`p-4 rounded-xl border flex gap-3.5 ${statusInfo.color}`}>
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <div>
                      <h5 className="font-mono font-bold text-xs uppercase text-white">Statut actuel : {statusInfo.label}</h5>
                      <p className="text-xs text-white/80 mt-1">{statusInfo.desc}</p>
                      
                      {currentUser.kycStatus === "rejected" && (
                        <button
                          onClick={handleResetKyc}
                          className="mt-3 bg-[#EF4444] text-white text-[10px] uppercase font-bold px-3 py-1.5 rounded-lg hover:bg-red-600 transition-all flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Déposer un nouveau dossier
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP CONTROLLER */}
                {currentUser.kycStatus === "none" && (
                  <>
                    {/* Welcome Screen */}
                    {step === "intro" && (
                      <div className="space-y-6">
                        <div className="space-y-2 text-center max-w-md mx-auto">
                          <h5 className="text-lg font-display font-medium text-white">Prétendez à l'excellence AFRIGOMBO</h5>
                          <p className="text-xs text-white/60 leading-relaxed">
                            Le GOMBO ID permet d'identifier les artistes sérieux et de renforcer la confiance au sein de la communauté musicale d'AFRIGOMBO.
                          </p>
                        </div>

                        {/* Advantages list */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 bg-black border border-white/5 rounded-xl flex gap-3.5">
                            <span className="h-6 w-6 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center text-emerald-400 font-bold">✓</span>
                            <div>
                              <h6 className="text-xs font-semibold text-white">Plus de crédibilité</h6>
                              <p className="text-[10px] text-white/50 mt-1">Établissez instantanément votre statut d'artiste expert vérifié.</p>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-black border border-white/5 rounded-xl flex gap-3.5">
                            <span className="h-6 w-6 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center text-emerald-400 font-bold">✓</span>
                            <div>
                              <h6 className="text-xs font-semibold text-white">Plus de confiance</h6>
                              <p className="text-[10px] text-white/50 mt-1">Rassurez les organisateurs d'orchestres ou de concerts.</p>
                            </div>
                          </div>

                          <div className="p-4 bg-black border border-white/5 rounded-xl flex gap-3.5">
                            <span className="h-6 w-6 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center text-emerald-400 font-bold">✓</span>
                            <div>
                              <h6 className="text-xs font-semibold text-white">Badge officiel</h6>
                              <p className="text-[10px] text-white/50 mt-1">Affichez fièrement l'emblème doré distinctif sur votre profil.</p>
                            </div>
                          </div>

                          <div className="p-4 bg-black border border-white/5 rounded-xl flex gap-3.5">
                            <span className="h-6 w-6 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center text-emerald-400 font-bold">✓</span>
                            <div>
                              <h6 className="text-xs font-semibold text-white">Meilleure visibilité</h6>
                              <p className="text-[10px] text-white/50 mt-1">Apparaissez en priorité sur les résultats de recherche d'Abidjan.</p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 flex justify-center">
                          <button
                            onClick={() => setStep("conditions")}
                            className="bg-[#D4AF37] text-black font-semibold text-xs uppercase px-6 py-3 rounded-lg hover:bg-[#B48F17] transition-all flex items-center gap-2 font-display tracking-wider font-bold"
                          >
                            Démarrer ma demande <ArrowRight className="w-4 h-4 stroke-[3]" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Terms and Conditions */}
                    {step === "conditions" && (
                      <div className="space-y-5">
                        <div className="bg-black border border-white/10 rounded-xl p-5 space-y-4 max-h-72 overflow-y-auto">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] font-mono">Charte de confiance et d'Exactitude</h5>
                          <p className="text-xs text-white/80 leading-relaxed text-justify">
                            Pour garantir la sécurité et la réputation de tous les artistes de la plateforme, l'attribution du GOMBO ID d'excellence est soumise aux règles fermes suivantes :
                          </p>
                          <ul className="space-y-2 text-xs text-white/70 list-disc list-inside">
                            <li>Les informations d'identité fournies doivent être rigoureusement exactes, à jour et correspondre à votre véritable nom civil.</li>
                            <li><strong>Le badge ne s'achète pas.</strong> Les paiements express priorisent uniquement l'examen de votre dossier sans garantir d'obtention de la certification.</li>
                            <li>Toute tentative de manipulation, d'usurpation d'identité ou d'utilisation de documents falsifiés entraînera le refus définitif ainsi que la suspension définitive de votre compte AFRIGOMBO.</li>
                            <li>Les agents de vérification d'AFRIGOMBO se réservent le droit de demander des pièces complémentaires ou une validation vidéo en direct.</li>
                          </ul>
                        </div>

                        {/* Accept condition check */}
                        <div className="flex items-start gap-3 bg-[#D4AF37]/5 border border-[#D4AF37]/15 p-4 rounded-xl">
                          <input
                            type="checkbox"
                            id="terms"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            className="mt-1 w-4 h-4 text-[#D4AF37] border-white/20 rounded focus:ring-[#D4AF37] bg-black"
                          />
                          <label htmlFor="terms" className="text-xs text-white/80 select-none cursor-pointer font-semibold">
                            C'est d'accord, j'ai lu avec rigueur et j'accepte l'ensemble des conditions d'excellence.
                          </label>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-white/5">
                          <button
                            onClick={() => setStep("intro")}
                            className="px-4 py-2 text-xs uppercase font-mono text-white/50 hover:text-white"
                          >
                            Retour
                          </button>
                          
                          <button
                            onClick={() => setStep("upload")}
                            disabled={!acceptedTerms}
                            className={`px-5 py-2.5 rounded-lg text-xs uppercase font-semibold font-mono tracking-wider transition-all flex items-center gap-1.5 ${
                              acceptedTerms
                                ? "bg-[#D4AF37] text-black hover:bg-[#B48F17]"
                                : "bg-white/5 text-white/25 cursor-not-allowed border border-white/5"
                            }`}
                          >
                            Continuer <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Document Upload */}
                    {step === "upload" && (
                      <div className="space-y-6">
                        <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-1">
                          <span className="text-[10px] font-mono text-emerald-400 block font-bold">📂 SÉLECTION OU GLISSER-DÉPOSER DES PIÈCES</span>
                          <p className="text-xs text-white/60">Veuillez téléverser des documents lisibles. Formats acceptés : JPEG, PNG, PDF (max 5Mo).</p>
                        </div>

                        {/* Three upload slots */}
                        <div className="space-y-4">
                          
                          {/* Item 1: Pièce d'identité */}
                          <div className="space-y-2">
                            <label className="text-xs text-[#D4AF37] font-semibold font-mono flex items-center gap-1.5">
                              <FileText className="w-4 h-4" /> 1. Pièce d'identité officielle (CNI, Passeport, Permis)
                            </label>
                            
                            <div
                              onDragOver={(e) => handleDrag(e, "idCard", true)}
                              onDragLeave={(e) => handleDrag(e, "idCard", false)}
                              onDrop={(e) => handleDrop(e, "idCard")}
                              onClick={() => triggerFileInput("idCard")}
                              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[120px] ${
                                dragActive.idCard 
                                  ? "border-[#D4AF37] bg-[#D4AF37]/5" 
                                  : files.idCard 
                                    ? "border-emerald-500/50 bg-emerald-500/5" 
                                    : "border-white/10 hover:border-[#D4AF37]/40 hover:bg-white/5"
                              }`}
                            >
                              <input
                                type="file"
                                ref={fileInputRefs.idCard}
                                className="hidden"
                                accept="image/*,application/pdf"
                                onChange={(e) => handleFileChange("idCard", e.target.files?.[0] || null)}
                              />
                              {previews.idCard ? (
                                <div className="space-y-2.5">
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                                      <CheckCircle2 className="w-4 h-4" /> Chargé : {files.idCard?.name}
                                    </span>
                                  </div>
                                  <div className="relative inline-block w-40 h-24 rounded overflow-hidden border border-white/15">
                                    <img src={previews.idCard} alt="Preview Identité" className="w-full h-full object-cover" />
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1.5 p-2">
                                  <FileText className="w-6 h-6 text-white/30 mx-auto" />
                                  <p className="text-xs text-white/50 font-medium">Glissez votre pièce ou cliquez pour l'importer</p>
                                  <p className="text-[10px] text-white/30 font-mono">Format PDF, JPG, PNG sous 5 Mo</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Item 2: Selfie avec la pièce */}
                          <div className="space-y-2">
                            <label className="text-xs text-[#D4AF37] font-semibold font-mono flex items-center gap-1.5">
                              <Camera className="w-4 h-4" /> 2. Selfie de contrôle avec votre pièce d'identité
                            </label>

                            <div
                              onDragOver={(e) => handleDrag(e, "selfie", true)}
                              onDragLeave={(e) => handleDrag(e, "selfie", false)}
                              onDrop={(e) => handleDrop(e, "selfie")}
                              onClick={() => triggerFileInput("selfie")}
                              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[120px] ${
                                dragActive.selfie 
                                  ? "border-[#D4AF37] bg-[#D4AF37]/5" 
                                  : files.selfie 
                                    ? "border-emerald-500/50 bg-emerald-500/5" 
                                    : "border-white/10 hover:border-[#D4AF37]/40 hover:bg-white/5"
                              }`}
                            >
                              <input
                                type="file"
                                ref={fileInputRefs.selfie}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleFileChange("selfie", e.target.files?.[0] || null)}
                              />
                              {previews.selfie ? (
                                <div className="space-y-2.5">
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                                      <CheckCircle2 className="w-4 h-4" /> Chargé : {files.selfie?.name}
                                    </span>
                                  </div>
                                  <div className="relative inline-block w-40 h-24 rounded overflow-hidden border border-white/15">
                                    <img src={previews.selfie} alt="Preview Selfie" className="w-full h-full object-cover" />
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1.5 p-2">
                                  <Camera className="w-6 h-6 text-white/30 mx-auto" />
                                  <p className="text-xs text-white/50 font-medium">Prenez ou glissez un selfie avec la pièce lisible</p>
                                  <p className="text-[10px] text-white/30 font-mono">Assurez-vous que votre visage et la carte soient clairs</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Item 3: Preuve d'activité */}
                          <div className="space-y-2">
                            <label className="text-xs text-[#D4AF37] font-semibold font-mono flex items-center gap-1.5">
                              <Music className="w-4 h-4" /> 3. Preuve d'activité musicale active (Lien d'écoute, contrat, affiche, SACEM)
                            </label>

                            <div
                              onDragOver={(e) => handleDrag(e, "musicProof", true)}
                              onDragLeave={(e) => handleDrag(e, "musicProof", false)}
                              onDrop={(e) => handleDrop(e, "musicProof")}
                              onClick={() => triggerFileInput("musicProof")}
                              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[120px] ${
                                dragActive.musicProof 
                                  ? "border-[#D4AF37] bg-[#D4AF37]/5" 
                                  : files.musicProof 
                                    ? "border-emerald-500/50 bg-emerald-500/5" 
                                    : "border-white/10 hover:border-[#D4AF37]/40 hover:bg-white/5"
                              }`}
                            >
                              <input
                                type="file"
                                ref={fileInputRefs.musicProof}
                                className="hidden"
                                accept="image/*,application/pdf"
                                onChange={(e) => handleFileChange("musicProof", e.target.files?.[0] || null)}
                              />
                              {previews.musicProof ? (
                                <div className="space-y-2.5">
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                                      <CheckCircle2 className="w-4 h-4" /> Chargé : {files.musicProof?.name}
                                    </span>
                                  </div>
                                  <div className="relative inline-block w-40 h-24 rounded overflow-hidden border border-white/15">
                                    <img src={previews.musicProof} alt="Preview Activité" className="w-full h-full object-cover" />
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1.5 p-2">
                                  <Music className="w-6 h-6 text-white/30 mx-auto" />
                                  <p className="text-xs text-white/50 font-medium">Sélectionnez une preuve ou capture d'activité musicale</p>
                                  <p className="text-[10px] text-white/30 font-mono">Contrat scellé, carte SACEM, ou flyer de showcase officiel</p>
                                </div>
                              )}
                            </div>
                          </div>

                        </div>

                        {/* Footer button to submit */}
                        <div className="flex justify-between items-center pt-4 border-t border-white/5">
                          <button
                            onClick={() => setStep("conditions")}
                            className="px-4 py-2 text-xs uppercase font-mono text-white/50 hover:text-white"
                          >
                            Retour
                          </button>

                          <button
                            onClick={() => setStep("checkout")}
                            disabled={!files.idCard || !files.selfie || !files.musicProof}
                            className={`px-5 py-2.5 rounded-lg text-xs uppercase font-semibold font-mono tracking-wider transition-all flex items-center gap-1.5 ${
                              (files.idCard && files.selfie && files.musicProof)
                                ? "bg-[#D4AF37] text-black hover:bg-[#B48F17]"
                                : "bg-white/5 text-white/25 cursor-not-allowed border border-white/5"
                            }`}
                          >
                            Continuer <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Mode of Checkout Priority (Standard vs Express) */}
                    {step === "checkout" && (
                      <div className="space-y-5">
                        <div className="text-center max-w-sm mx-auto space-y-1">
                          <h5 className="text-md font-bold text-white uppercase tracking-tight">Choisissez la vitesse d'évaluation</h5>
                          <p className="text-xs text-white/50 leading-relaxed">Les équipes d'AFRIGOMBO traitent chaque dossier manuellement pour préserver l'excellence.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Option 1: Standard */}
                          <div
                            onClick={() => setSelectedKycType("standard")}
                            className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between min-h-[160px] ${
                              selectedKycType === "standard"
                                ? "border-zinc-500 bg-white/5"
                                : "border-white/10 hover:border-white/20 bg-black/40"
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-mono uppercase text-zinc-400 font-bold">Vérification Standard</span>
                                {selectedKycType === "standard" && <span className="w-2.5 h-2.5 rounded-full bg-white block" />}
                              </div>
                              <h6 className="text-[#F5F5F5] font-display font-semibold text-lg">Gratuite</h6>
                              <p className="text-[10px] text-white/50 leading-relaxed">Examen rigoureux dans la file d'attente générale.</p>
                            </div>
                            
                            <div className="border-t border-white/5 pt-3 flex justify-between items-center text-[10px] text-white/40">
                              <span>Délai estimé</span>
                              <span className="font-bold text-white font-mono">7 à 14 Jours</span>
                            </div>
                          </div>

                          {/* Option 2: Express */}
                          <div
                            onClick={() => setSelectedKycType("express")}
                            className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between min-h-[160px] overflow-hidden ${
                              selectedKycType === "express"
                                ? "border-cyan-500 bg-gradient-to-br from-[#00171d] to-black shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                                : "border-white/10 hover:border-cyan-500/35 bg-black/40"
                            }`}
                          >
                            <div className="absolute -top-1 px-3 py-0.5 right-1 rounded-bl bg-cyan-500 text-black font-semibold text-[8px] uppercase tracking-widest font-mono">
                              ⚡ Prioritaire
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-mono uppercase text-cyan-400 font-bold">⚡ Vérification Express</span>
                                {selectedKycType === "express" && <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 block" />}
                              </div>
                              <h6 className="text-[#F5F5F5] font-display font-semibold text-lg flex items-center gap-1.5 text-cyan-400">
                                500 FCFA
                              </h6>
                              <p className="text-[10px] text-white/50 leading-relaxed">Passez en priorité absolue devant l'équipe d'administration active.</p>
                            </div>

                            <div className="border-t border-white/5 pt-3 flex justify-between items-center text-[10px] text-white/40">
                              <span>Délai estimé</span>
                              <span className="font-bold text-cyan-400 font-mono">24 à 72 Heures</span>
                            </div>
                          </div>
                        </div>

                        {/* Disclaimer note */}
                        <div className="p-3 bg-white/5 border border-white/15 rounded-xl text-[10px] text-white/50 space-y-1">
                          <p className="font-semibold text-white">⚠️ Rappel Droit et Conformité :</p>
                          <p>- Le paiement de l'option Express accélère uniquement la vitesse de traitement du dossier.</p>
                          <p>- Le paiement ne garantit jamais l'obtention automatique du badge ou l'homologation d'ID.</p>
                          <p>- En cas de dossier frauduleux ou d'absence de pièces valides, le dossier sera rejeté sans remboursement.</p>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-white/5">
                          <button
                            onClick={() => setStep("upload")}
                            className="px-4 py-2 text-xs uppercase font-mono text-white/50 hover:text-white"
                          >
                            Retour
                          </button>

                          <button
                            onClick={handleUploadDocs}
                            disabled={uploading}
                            className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs uppercase px-6 py-2.5 rounded-lg font-mono transition-all flex items-center gap-2 shadow"
                          >
                            {uploading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> {uploadProgress}
                              </>
                            ) : (
                              <>
                                Soumettre mon dossier <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Submitted Screen */}
                    {step === "submitted" && (
                      <div className="space-y-5 text-center py-6">
                        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                          <ShieldCheck className="w-9 h-9 animate-pulse" />
                        </div>
                        
                        <div className="space-y-2 max-w-sm mx-auto">
                          <h5 className="text-lg font-bold text-white">Dossier Transmis avec Succès !</h5>
                          <p className="text-xs text-white/50 leading-relaxed font-mono">
                            Votre demande de certification GOMBO ID a été enregistrée de manière immuable sur Firestore.
                          </p>
                        </div>

                        <div className="p-4 bg-black border border-white/10 rounded-xl text-left max-w-md mx-auto space-y-2">
                          <div className="flex justify-between text-xs border-b border-white/5 pb-2">
                            <span className="text-white/40">Mode choisi :</span>
                            <span className="font-bold uppercase font-mono text-white">
                              {currentUser.kycType === "express" ? "⚡ Express (Dossier Prioritaire)" : "⏳ Standard"}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs border-b border-white/5 pb-2">
                            <span className="text-white/40">Délais d'évaluation :</span>
                            <span className="font-bold text-white font-mono">
                              {currentUser.kycType === "express" ? "24 à 72 heures" : "7 à 14 jours"}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-white/40">Intégrité Blockchain/Firestore :</span>
                            <span className="text-emerald-400 font-mono font-bold uppercase text-[10px]">✓ Sécurisé</span>
                          </div>
                        </div>

                        <div className="pt-4">
                          <button
                            onClick={() => setIsOpen(false)}
                            className="bg-[#D4AF37] text-black font-semibold text-xs uppercase px-6 py-2.5 rounded-lg hover:bg-[#B48F17] transition-all font-mono"
                          >
                            Fermer
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* If already submitted (not none) */}
                {currentUser.kycStatus !== "none" && (
                  <div className="space-y-6">
                    {/* Review of submitted credentials */}
                    <div className="space-y-3 p-5 rounded-2xl bg-black border border-white/5">
                      <h5 className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-widest flex items-center gap-1.5 mb-3">
                        📂 Éléments du Dossier Soumis
                      </h5>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                          <span className="text-[9px] uppercase font-mono text-white/40 block">PI Carte d'identité</span>
                          <div className="relative h-20 bg-black rounded overflow-hidden border border-white/5">
                            {currentUser.kycDocs?.identityCardUrl ? (
                              <img src={currentUser.kycDocs.identityCardUrl} alt="ID Document" className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex items-center justify-center h-full text-[10px] text-white/30">Lien non disponible</div>
                            )}
                          </div>
                        </div>

                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                          <span className="text-[9px] uppercase font-mono text-white/40 block">Selfie facial</span>
                          <div className="relative h-20 bg-black rounded overflow-hidden border border-white/5">
                            {currentUser.kycDocs?.selfieUrl ? (
                              <img src={currentUser.kycDocs.selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex items-center justify-center h-full text-[10px] text-white/30">Lien non disponible</div>
                            )}
                          </div>
                        </div>

                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                          <span className="text-[9px] uppercase font-mono text-white/40 block">Preuve d'activité</span>
                          <div className="relative h-20 bg-black rounded overflow-hidden border border-white/5">
                            {currentUser.kycDocs?.activityUrl ? (
                              <img src={currentUser.kycDocs.activityUrl} alt="Activity" className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex items-center justify-center h-full text-[10px] text-white/30 font-mono truncate">{currentUser.kycDocUrl || "Enregistrée"}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-[#D4AF37]/5 border border-[#D4AF37]/15 rounded-xl text-xs space-y-1 leading-relaxed text-white/80">
                      <p className="font-semibold text-[#D4AF37] mb-1">📢 À propos d'AFRIGOMBO ID d'excellence :</p>
                      <p>Notre équipe s'engage à faire d'AFRIGOMBO un repère de fiabilité pour les concerts VIP, d'hôtels et événements en Côte d'Ivoire. Merci de participer à l'élévation de notre héritage musical !</p>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-white/5">
                      <button
                        onClick={() => setIsOpen(false)}
                        className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs uppercase px-5 py-2 rounded-lg font-mono transition-all"
                      >
                        Conserver et Fermer
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
