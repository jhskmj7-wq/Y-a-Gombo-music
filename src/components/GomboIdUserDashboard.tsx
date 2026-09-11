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
  Check,
  Download,
  QrCode,
  Copy,
  Share2,
  ChevronRight,
  UserCheck,
  Star
} from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getEffectiveGomboId, getGomboIdStatusInfo, formatGomboIdDisplay } from "../lib/gomboIdHelper";
import { storage } from "../lib/firebase";
import { User } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { ErrorBoundary } from "./ErrorBoundary";
import { GomboIdCertificateModal } from "./GomboIdCertificateModal";
import { GomboIdQrModal } from "./GomboIdQrModal";
import { audioSynth } from "../lib/audio";
import { extractCertificateData, downloadCertificatePdf } from "../lib/certificateGenerator";

function AndroidErrorState() {
  return (
    <div className="p-6 bg-afri-bg border border-amber-500/30 rounded-2xl text-amber-400 font-mono text-xs shadow-2xl max-w-lg mx-auto my-8 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center mx-auto text-xl">
        ⚠️
      </div>
      <h2 className="font-black text-sm uppercase tracking-wider text-amber-400">
        Erreur GOMBO ID
      </h2>
      <p className="text-[11px] text-afri-text-sec font-sans">
        Une anomalie s'est produite lors de l'affichage du tableau de bord Gombo ID.
      </p>
    </div>
  );
}

interface GomboIdUserDashboardProps {
  currentUser: User;
  onUpdateUser: (userData: Partial<User>) => Promise<void>;
  onCreateTransaction: (amount: number, type: any, description: string) => Promise<void>;
  addToTerminal?: (msg: string) => void;
  onBack?: () => void;
}

function GomboIdUserDashboardInner({
  currentUser,
  onUpdateUser,
  onCreateTransaction,
  addToTerminal = () => {},
  onBack
}: GomboIdUserDashboardProps) {
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [downloadingDirectPdf, setDownloadingDirectPdf] = useState(false);

  const avatarLetter =
    currentUser?.artisticName?.trim()?.charAt(0)
    || currentUser?.firstName?.trim()?.charAt(0)
    || currentUser?.lastName?.trim()?.charAt(0)
    || "A";
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

  if (!currentUser) return null;

  // Single Source of Truth Gombo ID Info
  const gInfo = getGomboIdStatusInfo(currentUser);
  const gomboId = getEffectiveGomboId(currentUser);
  const isApproved = gInfo.statusCode === "ATTRIBUTED";

  // Status mapping helper
  const getStatusDisplay = () => {
    if (gInfo.statusCode === "ATTRIBUTED") {
      return {
        label: `Artiste Certifié (${gInfo.verificationLevel})`,
        badgeText: "CERTIFIÉ ✓",
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        desc: `GOMBO ID Officiel : ${gInfo.gomboId}. Votre identité artistique est homologuée et protégée sur le réseau.`
      };
    }
    if (gInfo.statusCode === "REJECTED") {
      return {
        label: "Dossier non validé",
        badgeText: "NON VALIDÉ ✕",
        color: "text-red-400 bg-red-500/10 border-red-500/30",
        desc: gInfo.rejectionReason || "Votre dossier n'a pas été validé. Vous pouvez régulariser vos justificatifs."
      };
    }
    if (gInfo.statusCode === "PENDING") {
      if (currentUser?.kycType === "express") {
        return {
          label: "⚡ En traitement Express (24-72h)",
          badgeText: "EXPRESS ⚡",
          color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
          desc: "Dossier prioritaire d'excellence. L'administration examine vos pièces en priorité absolue."
        };
      }
      return {
        label: "⏳ En cours de vérification",
        badgeText: "EN COURS ⏳",
        color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        desc: "Votre demande de Gombo ID est en cours d'analyse dans la file d'attente générale."
      };
    }

    return {
      label: "Héritage à Révéler — Non certifié",
      badgeText: "NON ATTRIBUÉ",
      color: "text-afri-text-sec bg-zinc-500/10 border-zinc-500/20",
      desc: "Votre identité artistique mérite d'être authentifiée. Obtenez votre GOMBO ID pour sceller votre prestige."
    };
  };

  const statusInfo = getStatusDisplay();

  const handleCopyGomboId = () => {
    try {
      navigator.clipboard.writeText(gomboId);
      setCopiedId(true);
      try { audioSynth.playKoraNote(523.25, 0, 0.1, 0.5); } catch (_) {}
      setTimeout(() => setCopiedId(false), 2000);
    } catch (err) {
      console.warn("Copy error", err);
    }
  };

  const handleDirectDownloadCertificate = async () => {
    if (!isApproved) {
      addToTerminal("[GOMBO ID] Échec de la tentative de téléchargement : utilisateur non certifié.");
      return;
    }
    setDownloadingDirectPdf(true);
    try {
      try { audioSynth.playKoraNote(659.25, 0, 0.1, 0.5); } catch (_) {}
      const data = extractCertificateData(currentUser);
      await downloadCertificatePdf(data);
    } catch (err) {
      console.error("Direct certificate download failed", err);
    } finally {
      setDownloadingDirectPdf(false);
    }
  };

  // File Handling
  const handleFileChange = (type: "idCard" | "selfie" | "musicProof", file: File | null) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setFiles(prev => ({ ...prev, [type]: file }));
    setPreviews(prev => ({ ...prev, [type]: previewUrl }));
    addToTerminal(`[GOMBO ID] Fichier chargé pour ${type} : ${file.name}`);
  };

  const triggerFileInput = (type: "idCard" | "selfie" | "musicProof") => {
    fileInputRefs[type].current?.click();
  };

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

      for (const [key, file] of Object.entries(files)) {
        if (file) {
          try {
            setUploadProgress(`Téléversement de : ${file.name}...`);
            const storagePath = `kyc/${currentUser?.id ?? "unknown"}/${key}_${Date.now()}_${file.name}`;
            const fileRef = ref(storage, storagePath);
            const snapshot = await uploadBytes(fileRef, file);
            const downloadUrl = await getDownloadURL(snapshot.ref);
            
            if (key === "idCard") urls.identityCardUrl = downloadUrl;
            if (key === "selfie") urls.selfieUrl = downloadUrl;
            if (key === "musicProof") urls.activityUrl = downloadUrl;
            
            addToTerminal(`[STORAGE] Upload réussi pour ${key} : ${storagePath}`);
          } catch (storageErr) {
            console.error("Storage upload failed:", storageErr);
            throw new Error(`Échec du téléversement pour le fichier ${key}.`);
          }
        }
      }

      setUploadProgress("Enregistrement des métadonnées...");

      await onUpdateUser({
        kycDocs: urls,
        kycSubmittedDate: new Date().toLocaleDateString("fr-FR"),
        kycStatus: "pending",
        kycType: selectedKycType
      });

      if (selectedKycType === "express") {
        await onCreateTransaction(
          500,
          "cert_express",
          `⚡ Certification Express GOMBO ID (24-72h) - ${currentUser?.artisticName ?? ""}`
        );
        addToTerminal(`[COMPTA] Encaissement 500 FCFA Gombo ID Express pour ${currentUser?.artisticName ?? ""}`);
      } else {
        addToTerminal(`[GOMBO ID] Demande de vérification Standard soumise par ${currentUser?.artisticName ?? ""}`);
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
    <div className="w-full max-w-4xl mx-auto px-1.5 xs:px-2.5 sm:px-6 py-3 sm:py-5 space-y-4 sm:space-y-6">
      
      {/* 1. TOP NAVIGATION HEADER (Unique, clean back button) */}
      <div className="flex items-center justify-between gap-3 border-b border-[#D4AF37]/20 pb-3 sm:pb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="text-xs font-mono font-bold uppercase tracking-wider text-afri-text-sec hover:text-afri-text inline-flex items-center gap-1.5 px-3 py-2 bg-afri-bg-sec hover:bg-afri-bg-ter rounded-xl border border-afri-border transition cursor-pointer active:scale-98"
            >
              &larr; RETOUR
            </button>
          )}
          <div>
            <h1 className="text-base sm:text-lg font-display font-black text-afri-text uppercase tracking-tight">
              GOMBO ID & CERTIFICAT
            </h1>
            <p className="text-[10px] sm:text-xs font-mono text-[#D4AF37]">
              Passeport Numérique & Souveraineté Artistique
            </p>
          </div>
        </div>

        <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-mono font-bold uppercase">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>AFRITRUST ID</span>
        </div>
      </div>

      {/* 2. MAIN DIGITAL GOMBO ID PASSPORT CARD (Android-First Respiration) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl xs:rounded-3xl border-2 border-[#D4AF37]/45 bg-gradient-to-b from-[#18181C] via-[#121215] to-[#0D0D10] p-4 xs:p-5 sm:p-8 shadow-[0_10px_40px_rgba(212,175,55,0.12)] space-y-4 sm:space-y-6"
      >
        {/* Subtle decorative security grids in background */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#D4AF37_1px,transparent_1px),linear-gradient(to_bottom,#D4AF37_1px,transparent_1px)] bg-[size:16px_24px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#D4AF37]/15 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Card Header Banner */}
        <div className="flex flex-wrap justify-between items-center gap-2 border-b border-[#D4AF37]/20 pb-3 sm:pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] sm:text-[11px] font-mono tracking-widest font-black text-gray-300 uppercase">
              RÉPUBLIQUE DU SHOWBIZ • GOMBO TRUST ID
            </span>
          </div>
          <span className={`text-[9.5px] font-mono border px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${statusInfo.color}`}>
            {statusInfo.badgeText}
          </span>
        </div>

        {/* Artist Profile & ID Identification Block */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 xs:gap-5 sm:gap-6 text-center sm:text-left">
          
          {/* Large Artist Photo */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 xs:w-28 xs:h-28 sm:w-32 sm:h-32 rounded-2xl border-2 border-[#D4AF37] bg-black/60 flex items-center justify-center font-bold text-3xl xs:text-4xl text-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.25)] overflow-hidden">
              {currentUser?.avatarUrl ? (
                <img 
                  src={currentUser.avatarUrl} 
                  alt={currentUser.artisticName || "Artiste"} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                avatarLetter
              )}
            </div>
            {isApproved && (
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#D4AF37] border-2 border-[#121214] flex items-center justify-center shadow-md">
                <Award className="w-4 h-4 text-black stroke-[3]" />
              </div>
            )}
          </div>

          {/* Details & Identifiers */}
          <div className="flex-1 space-y-2.5 min-w-0">
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-display font-black text-white tracking-tight uppercase">
                  {currentUser?.artisticName || currentUser?.name || "Artiste Musical"}
                </h2>
                {isApproved && (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase">
                    ★ CERTIFIÉ
                  </span>
                )}
              </div>
              {currentUser?.name && currentUser.name !== currentUser.artisticName && (
                <p className="text-xs text-gray-400 font-sans mt-0.5">
                  Nom civil : {currentUser.name}
                </p>
              )}
            </div>

            {/* Gombo ID Golden Badge with One-Tap Copy */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
              <div className="flex items-center gap-1.5 bg-black/70 border border-[#D4AF37]/40 rounded-xl px-3 py-1.5">
                <span className="text-[9px] font-mono text-gray-400 uppercase">ID :</span>
                <span className="text-sm sm:text-base font-serif font-black text-[#D4AF37] tracking-wider uppercase select-all">
                  {gomboId}
                </span>
                <button
                  onClick={handleCopyGomboId}
                  title="Copier le GOMBO ID"
                  className="ml-1.5 p-1 rounded-lg hover:bg-white/10 text-gray-300 hover:text-[#D4AF37] transition cursor-pointer"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <span className="text-[11px] font-mono text-gray-300 bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-xl">
                📍 {currentUser?.commune || "Cocody, Abidjan"}
              </span>
            </div>

            {/* Discipline & Instruments */}
            <p className="text-xs text-gray-400 font-sans truncate">
              {currentUser?.instrument || (Array.isArray(currentUser?.instruments) ? currentUser.instruments.join(" • ") : "") || "Chant • Performance Scénique"}
            </p>
          </div>

        </div>

        {/* Level & Trust Stats Row */}
        <div className="grid grid-cols-1 xs:grid-cols-3 gap-2.5 xs:gap-3 pt-2 border-t border-[#D4AF37]/20">
          
          <div className="bg-black/40 border border-white/10 p-3 rounded-2xl text-center space-y-1">
            <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider block">
              NIVEAU GOMBO ID
            </span>
            <span className="text-sm sm:text-base font-sans font-black text-[#D4AF37] block">
              {gInfo.verificationLevel || "Niveau 1"}
            </span>
          </div>

          <div className="bg-black/40 border border-white/10 p-3 rounded-2xl text-center space-y-1">
            <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider block">
              SCORE DE CONFIANCE
            </span>
            <span className="text-sm sm:text-base font-sans font-black text-emerald-400 block">
              {isApproved ? `${currentUser?.gomboId?.scoreConfiance ?? currentUser?.trustScore ?? 98} / 100` : "En attente"}
            </span>
          </div>

          <div className="bg-black/40 border border-white/10 p-3 rounded-2xl text-center space-y-1">
            <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider block">
              STATUT CONTRATS
            </span>
            <span className="text-sm sm:text-base font-sans font-black text-white block">
              {isApproved ? "Séquestre VIP Actif" : "Standard"}
            </span>
          </div>

        </div>

        {/* 3. FOUR CORE DIRECT ACTION BUTTONS */}
        {isApproved && (
          <div className="pt-2 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Primary Action 1: Voir mon certificat */}
              <button
                onClick={() => {
                  if (!isApproved) return;
                  setIsCertModalOpen(true);
                  try { audioSynth.playKoraNote(523.25, 0, 0.1, 0.5); } catch (_) {}
                }}
                className="py-3.5 px-4 bg-[#D4AF37] hover:bg-amber-500 active:scale-98 text-black font-sans font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Award className="w-4 h-4 text-black stroke-[2.5]" />
                <span>VOIR MON CERTIFICAT</span>
              </button>

              {/* Primary Action 2: Télécharger mon certificat */}
              <button
                onClick={handleDirectDownloadCertificate}
                disabled={downloadingDirectPdf}
                className="py-3.5 px-4 bg-gradient-to-r from-amber-500/15 to-amber-400/15 hover:from-amber-500/25 hover:to-amber-400/25 border-2 border-[#D4AF37]/60 active:scale-98 text-[#D4AF37] font-mono font-bold text-xs uppercase tracking-wider rounded-2xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {downloadingDirectPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Export PDF en cours...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-[#D4AF37]" />
                    <span>TÉLÉCHARGER MON CERTIFICAT</span>
                  </>
                )}
              </button>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Secondary Action 1: Afficher QR Code */}
              <button
                onClick={() => {
                  if (!isApproved) return;
                  setIsQrModalOpen(true);
                  try { audioSynth.playKoraNote(392.00, 0, 0.05, 0.3); } catch (_) {}
                }}
                className="py-3 px-4 bg-white/10 hover:bg-white/15 text-white font-mono text-xs uppercase font-bold rounded-2xl border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <QrCode className="w-4 h-4 text-[#D4AF37]" />
                <span>Afficher le QR Code</span>
              </button>

              {/* Secondary Action 2: Transmettre / Partager */}
              <button
                onClick={() => {
                  if (!isApproved) return;
                  const text = `Découvrez mon profil d'artiste certifié sur AFRIGOMBO.\n🎼 Mon GOMBO ID : ${gomboId}\nRejoignez l'élite musicale !`;
                  if (navigator.share) {
                    navigator.share({ title: "GOMBO ID d'Excellence", text });
                  } else {
                    handleCopyGomboId();
                  }
                }}
                className="py-3 px-4 bg-white/10 hover:bg-white/15 text-white font-mono text-xs uppercase font-bold rounded-2xl border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Share2 className="w-4 h-4 text-[#D4AF37]" />
                <span>Transmettre mon ID</span>
              </button>

            </div>
          </div>
        )}

        {/* Activation / KYC Action Trigger */}
        <div className="pt-2 border-t border-white/10">
          <button
            onClick={() => setIsKycModalOpen(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-black/60 hover:bg-black/80 border border-[#D4AF37]/40 text-gray-200 font-mono text-xs uppercase font-bold tracking-wider transition-all flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>
                {currentUser?.kycStatus === "approved" ? "Gérer mon dossier de certification" : "Processus d'homologation & KYC"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[#D4AF37]">
              <span className="text-[10px] uppercase font-bold">{statusInfo.badgeText}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>

      </motion.div>

      {/* 4. GOMBO ID ADVANTAGES SECTION */}
      <div className="rounded-2xl xs:rounded-3xl border border-white/10 bg-afri-bg-sec/80 p-4 xs:p-5 sm:p-6 space-y-4 shadow-sm text-left">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
          <h3 className="text-xs font-mono font-black text-[#D4AF37] uppercase tracking-[0.2em]">
            Grâce à votre GOMBO ID d'Excellence :
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { title: "Profil Certifié & Protégé", desc: "Attestation officielle contre les faux profils et l'usurpation." },
            { title: "Priorité dans les Recherches", desc: "Apparaissez en tête de liste pour les promoteurs et hôtels d'Abidjan." },
            { title: "Accès aux Contrats Sécurisés", desc: "Verrouillage automatique des cachets en compte de séquestre." },
            { title: "Passeport & Certificat Exportable", desc: "Téléchargez votre certificat au format officiel PDF ou PNG." },
            { title: "Vérification Publique QR Code", desc: "Permettez à vos clients de scanner et vérifier votre statut instantanément." },
            { title: "Éligibilité aux Prestations VIP", desc: "Participez aux galas, festivals et événements d'envergure nationale." }
          ].map((item, idx) => (
            <div key={idx} className="p-3 bg-black/30 border border-white/5 rounded-2xl flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0 mt-0.5">
                ✓
              </span>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                  {item.title}
                </h4>
                <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
                                 KYC ACTIVATION & STATUS MODAL
         ========================================================================= */}
      <AnimatePresence>
        {isKycModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-[#121215] border border-[#D4AF37]/45 rounded-3xl shadow-[0_10px_50px_rgba(212,175,55,0.15)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-[#D4AF37]/20 bg-black/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]">
                    <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-display font-bold text-white uppercase tracking-wider">
                      Dossier d'Homologation GOMBO ID
                    </h4>
                    <span className="text-[10px] font-mono text-[#D4AF37] block">
                      Commission d'Accréditation Artistique
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsKycModalOpen(false)}
                  className="p-1.5 rounded-full border border-white/10 hover:border-white/30 text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Status Alert if not None */}
                {(currentUser?.kycStatus ?? "none") !== "none" && (
                  <div className={`p-4 rounded-2xl border flex gap-3.5 ${statusInfo.color}`}>
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <div>
                      <h5 className="font-mono font-bold text-xs uppercase text-white">Statut : {statusInfo.label}</h5>
                      <p className="text-xs text-gray-300 mt-1">{statusInfo.desc}</p>
                      
                      {currentUser?.kycStatus === "rejected" && (
                        <button
                          onClick={handleResetKyc}
                          className="mt-3 bg-red-600 text-white text-[10px] uppercase font-bold px-3 py-1.5 rounded-lg hover:bg-red-700 transition-all flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Déposer un nouveau dossier
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP CONTROLLER FOR NEW SUBMISSION */}
                {(currentUser?.kycStatus ?? "none") === "none" && (
                  <>
                    {/* Welcome Screen */}
                    {step === "intro" && (
                      <div className="space-y-6">
                        <div className="space-y-2 text-center max-w-md mx-auto">
                          <h5 className="text-lg font-display font-bold text-white">Authentifiez votre Prestige Musical</h5>
                          <p className="text-xs text-gray-400 leading-relaxed">
                            Le GOMBO ID identifie les artistes professionnels et renforce la confiance auprès des organisateurs d'événements et promoteurs de spectacles.
                          </p>
                        </div>

                        <div className="pt-4 flex justify-center">
                          <button
                            onClick={() => setStep("conditions")}
                            className="bg-[#D4AF37] text-black font-bold text-xs uppercase px-8 py-3.5 rounded-xl hover:bg-amber-500 transition-all flex items-center gap-2 font-display tracking-wider cursor-pointer"
                          >
                            Démarrer ma demande d'homologation <ArrowRight className="w-4 h-4 stroke-[3]" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Conditions */}
                    {step === "conditions" && (
                      <div className="space-y-5">
                        <div className="space-y-1 text-center">
                          <h5 className="text-md font-bold text-white uppercase tracking-tight">Conditions & Documents Requis</h5>
                          <p className="text-xs text-gray-400">Pour garantir l'intégrité de la communauté musicale :</p>
                        </div>

                        <div className="space-y-3 bg-black/40 p-4 rounded-2xl border border-white/10 text-xs text-gray-300">
                          <div className="flex gap-3">
                            <span className="text-[#D4AF37] font-bold">1.</span>
                            <p><strong className="text-white">Pièce d'identité officielle :</strong> CNI, Passeport ou Carte Consulaire ivoirienne valide.</p>
                          </div>
                          <div className="flex gap-3">
                            <span className="text-[#D4AF37] font-bold">2.</span>
                            <p><strong className="text-white">Selfie de conformité :</strong> Photo de face nette pour certifier l'adéquation physique.</p>
                          </div>
                          <div className="flex gap-3">
                            <span className="text-[#D4AF37] font-bold">3.</span>
                            <p><strong className="text-white">Preuve d'activité musicale :</strong> Affiche de spectacle, extrait audio/vidéo ou lien de prestation.</p>
                          </div>
                        </div>

                        <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer">
                          <input
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            className="w-4 h-4 rounded text-[#D4AF37] accent-[#D4AF37]"
                          />
                          <span className="text-xs text-gray-300 font-sans">
                            Je certifie l'exactitude des pièces fournies et accepte la charte d'honneur AFRIGOMBO ELITE.
                          </span>
                        </label>

                        <div className="flex justify-end items-center pt-3 border-t border-white/10">
                          <button
                            disabled={!acceptedTerms}
                            onClick={() => setStep("upload")}
                            className="bg-[#D4AF37] disabled:opacity-40 text-black font-bold text-xs uppercase px-6 py-2.5 rounded-xl hover:bg-amber-500 transition-all flex items-center gap-2 font-mono"
                          >
                            Continuer <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Upload */}
                    {step === "upload" && (
                      <div className="space-y-5">
                        <div className="space-y-1 text-center">
                          <h5 className="text-md font-bold text-white uppercase tracking-tight">Téléversement des Pièces Justificatives</h5>
                          <p className="text-xs text-gray-400">Formats acceptés : JPG, PNG, PDF (Max 10 Mo)</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* 1. Identity Card */}
                          <div
                            onDragOver={(e) => handleDrag(e, "idCard", true)}
                            onDragLeave={(e) => handleDrag(e, "idCard", false)}
                            onDrop={(e) => handleDrop(e, "idCard")}
                            onClick={() => triggerFileInput("idCard")}
                            className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[140px] ${
                              previews.idCard
                                ? "border-emerald-500 bg-emerald-500/5"
                                : dragActive.idCard
                                ? "border-[#D4AF37] bg-[#D4AF37]/10"
                                : "border-white/20 bg-black/40 hover:border-white/40"
                            }`}
                          >
                            <input
                              type="file"
                              ref={fileInputRefs.idCard}
                              onChange={(e) => handleFileChange("idCard", e.target.files?.[0] || null)}
                              accept="image/*,.pdf"
                              className="hidden"
                            />
                            {previews.idCard ? (
                              <div className="space-y-1">
                                <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
                                <span className="text-[10px] font-mono text-emerald-400 font-bold block truncate max-w-[120px]">
                                  {files.idCard?.name || "Pièce chargée"}
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <FileText className="w-6 h-6 text-[#D4AF37] mx-auto" />
                                <span className="text-[11px] font-bold text-white block">Pièce d'Identité</span>
                                <span className="text-[9px] text-gray-400 block">CNI / Passeport</span>
                              </div>
                            )}
                          </div>

                          {/* 2. Selfie */}
                          <div
                            onDragOver={(e) => handleDrag(e, "selfie", true)}
                            onDragLeave={(e) => handleDrag(e, "selfie", false)}
                            onDrop={(e) => handleDrop(e, "selfie")}
                            onClick={() => triggerFileInput("selfie")}
                            className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[140px] ${
                              previews.selfie
                                ? "border-emerald-500 bg-emerald-500/5"
                                : dragActive.selfie
                                ? "border-[#D4AF37] bg-[#D4AF37]/10"
                                : "border-white/20 bg-black/40 hover:border-white/40"
                            }`}
                          >
                            <input
                              type="file"
                              ref={fileInputRefs.selfie}
                              onChange={(e) => handleFileChange("selfie", e.target.files?.[0] || null)}
                              accept="image/*"
                              className="hidden"
                            />
                            {previews.selfie ? (
                              <div className="space-y-1">
                                <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
                                <span className="text-[10px] font-mono text-emerald-400 font-bold block truncate max-w-[120px]">
                                  {files.selfie?.name || "Selfie chargé"}
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <Camera className="w-6 h-6 text-[#D4AF37] mx-auto" />
                                <span className="text-[11px] font-bold text-white block">Selfie Facial</span>
                                <span className="text-[9px] text-gray-400 block">Visage dégagé</span>
                              </div>
                            )}
                          </div>

                          {/* 3. Music Proof */}
                          <div
                            onDragOver={(e) => handleDrag(e, "musicProof", true)}
                            onDragLeave={(e) => handleDrag(e, "musicProof", false)}
                            onDrop={(e) => handleDrop(e, "musicProof")}
                            onClick={() => triggerFileInput("musicProof")}
                            className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[140px] ${
                              previews.musicProof
                                ? "border-emerald-500 bg-emerald-500/5"
                                : dragActive.musicProof
                                ? "border-[#D4AF37] bg-[#D4AF37]/10"
                                : "border-white/20 bg-black/40 hover:border-white/40"
                            }`}
                          >
                            <input
                              type="file"
                              ref={fileInputRefs.musicProof}
                              onChange={(e) => handleFileChange("musicProof", e.target.files?.[0] || null)}
                              accept="image/*,.pdf,audio/*"
                              className="hidden"
                            />
                            {previews.musicProof ? (
                              <div className="space-y-1">
                                <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
                                <span className="text-[10px] font-mono text-emerald-400 font-bold block truncate max-w-[120px]">
                                  {files.musicProof?.name || "Preuve chargée"}
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <Music className="w-6 h-6 text-[#D4AF37] mx-auto" />
                                <span className="text-[11px] font-bold text-white block">Preuve d'Activité</span>
                                <span className="text-[9px] text-gray-400 block">Affiche / Extrait</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end items-center pt-3 border-t border-white/10">
                          <button
                            disabled={!files.idCard || !files.selfie || !files.musicProof}
                            onClick={() => setStep("checkout")}
                            className="bg-[#D4AF37] disabled:opacity-40 text-black font-bold text-xs uppercase px-6 py-2.5 rounded-xl hover:bg-amber-500 transition-all flex items-center gap-2 font-mono"
                          >
                            Choisir la Vitesse <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Checkout Priority */}
                    {step === "checkout" && (
                      <div className="space-y-5">
                        <div className="text-center max-w-sm mx-auto space-y-1">
                          <h5 className="text-md font-bold text-white uppercase tracking-tight">Vitesse d'Évaluation</h5>
                          <p className="text-xs text-gray-400">Sélectionnez le délai de traitement souhaité :</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Standard */}
                          <div
                            onClick={() => setSelectedKycType("standard")}
                            className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between min-h-[150px] ${
                              selectedKycType === "standard"
                                ? "border-white bg-white/10"
                                : "border-white/15 bg-black/40 hover:border-white/30"
                            }`}
                          >
                            <div className="space-y-1.5">
                              <span className="text-xs font-mono uppercase text-gray-400 font-bold">Vérification Standard</span>
                              <h6 className="text-white font-display font-bold text-lg">Gratuite</h6>
                              <p className="text-[10px] text-gray-400">File d'attente normale.</p>
                            </div>
                            <div className="border-t border-white/10 pt-2 flex justify-between text-[10px]">
                              <span className="text-gray-400">Délai estimé</span>
                              <span className="font-bold text-white font-mono">7 à 14 Jours</span>
                            </div>
                          </div>

                          {/* Express */}
                          <div
                            onClick={() => setSelectedKycType("express")}
                            className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between min-h-[150px] ${
                              selectedKycType === "express"
                                ? "border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                                : "border-white/15 bg-black/40 hover:border-cyan-400/40"
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-mono uppercase text-cyan-400 font-bold">⚡ Vérification Express</span>
                                <span className="px-2 py-0.5 rounded bg-cyan-400 text-black font-black text-[8px] uppercase">Prioritaire</span>
                              </div>
                              <h6 className="text-cyan-400 font-display font-bold text-lg">500 FCFA</h6>
                              <p className="text-[10px] text-gray-400">Examen prioritaire par le bureau des accréditations.</p>
                            </div>
                            <div className="border-t border-white/10 pt-2 flex justify-between text-[10px]">
                              <span className="text-gray-400">Délai estimé</span>
                              <span className="font-bold text-cyan-400 font-mono">24 à 72 Heures</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end items-center pt-3 border-t border-white/10">
                          <button
                            onClick={handleUploadDocs}
                            disabled={uploading}
                            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs uppercase px-6 py-2.5 rounded-xl font-mono transition-all flex items-center gap-2 shadow"
                          >
                            {uploading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> {uploadProgress}
                              </>
                            ) : (
                              <>
                                Transmettre mon dossier <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Submitted Screen */}
                    {step === "submitted" && (
                      <div className="space-y-5 text-center py-6">
                        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                          <ShieldCheck className="w-9 h-9 animate-pulse" />
                        </div>
                        
                        <div className="space-y-1 max-w-sm mx-auto">
                          <h5 className="text-lg font-bold text-white">Dossier Transmis avec Succès !</h5>
                          <p className="text-xs text-gray-400 leading-relaxed font-mono">
                            Votre demande d'homologation GOMBO ID a été enregistrée de manière immuable.
                          </p>
                        </div>

                        <div className="pt-3">
                          <button
                            onClick={() => setIsKycModalOpen(false)}
                            className="bg-[#D4AF37] text-black font-bold text-xs uppercase px-8 py-3 rounded-xl hover:bg-amber-500 transition-all font-mono"
                          >
                            Fermer
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* If already submitted (review submitted documents) */}
                {(currentUser?.kycStatus ?? "none") !== "none" && (
                  <div className="space-y-5">
                    <div className="space-y-3 p-5 rounded-2xl bg-black/40 border border-white/10">
                      <h5 className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-widest flex items-center gap-1.5">
                        📂 Éléments du Dossier Homologué
                      </h5>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1.5">
                          <span className="text-[9px] uppercase font-mono text-gray-400 block">Pièce d'Identité</span>
                          <div className="h-20 bg-black/60 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center">
                            {currentUser?.kycDocs?.identityCardUrl ? (
                              <img src={currentUser.kycDocs.identityCardUrl} alt="ID" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] text-gray-500 font-mono">Document conforme</span>
                            )}
                          </div>
                        </div>

                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1.5">
                          <span className="text-[9px] uppercase font-mono text-gray-400 block">Selfie Facial</span>
                          <div className="h-20 bg-black/60 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center">
                            {currentUser?.kycDocs?.selfieUrl ? (
                              <img src={currentUser.kycDocs.selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] text-gray-500 font-mono">Selfie validé</span>
                            )}
                          </div>
                        </div>

                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1.5">
                          <span className="text-[9px] uppercase font-mono text-gray-400 block">Preuve d'Activité</span>
                          <div className="h-20 bg-black/60 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center">
                            {currentUser?.kycDocs?.activityUrl ? (
                              <img src={currentUser.kycDocs.activityUrl} alt="Activity" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] text-gray-500 font-mono truncate px-1">Homologuée</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-3 border-t border-white/10">
                      <button
                        onClick={() => setIsKycModalOpen(false)}
                        className="bg-white/10 hover:bg-white/20 text-white font-mono text-xs uppercase font-bold px-6 py-2.5 rounded-xl transition-all cursor-pointer"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
                                 CERTIFICATE MODAL & QR MODAL
         ========================================================================= */}
      <GomboIdCertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        user={currentUser}
      />

      <GomboIdQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        user={currentUser}
      />

    </div>
  );
}

export default function GomboIdUserDashboard(props: GomboIdUserDashboardProps) {
  try {
    return (
      <ErrorBoundary moduleName="GomboIdUserDashboard" fallback={<AndroidErrorState />}>
        <GomboIdUserDashboardInner {...props} />
      </ErrorBoundary>
    );
  } catch (e) {
    console.error("GomboIdUserDashboard render exception", e);
    return <AndroidErrorState />;
  }
}
