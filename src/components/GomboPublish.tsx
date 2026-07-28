import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, Clock, DollarSign, MapPin, AlignLeft, Check, 
  Music, Sparkles, Image as ImageIcon, Briefcase, MessageSquare, 
  Upload, X, AlertCircle, Award, Star, Radio, Lock, ShieldCheck, Zap,
  Wallet, ArrowUpRight, CheckCircle2
} from "lucide-react";
import { db, gomboDB } from "../firebase";
import { doc, getDoc, setDoc, addDoc, collection, runTransaction } from "firebase/firestore";
import { UserProfile, SocialPost } from "../types";
import GomboSecureModal from "./GomboSecureModal";
import { calculatePlatformFee, calculatePublicationFinancials, recordWalletTransaction } from "../lib/financial";
import { validateAndPublishWithCode } from "../lib/validationCodeEngine";

const ABIDJAN_COMMUNES = [
  "Cocody", "Yopougon", "Marcory", "Plateau", "Treichville", "Abobo", 
  "Koumassi", "Adjamé", "Port-Bouët", "Attécoubé", "Grand-Bassam", "Bingerville"
];

const PUBLICATION_TYPES = [
  { id: "opportunite", label: "💼 Opportunité (Contrat)", desc: "Proposer un gombo rémunéré, un contrat de cabaret ou un concert privé" },
  { id: "demo", label: "🎵 Démo musicale", desc: "Transmettre un a cappella, un solo instrumental ou une de vos performances" },
  { id: "renfort", label: "⚡ Renfort Express", desc: "Besoin immédiat d'un remplaçant pour une répétition ou un live ce soir" },
  { id: "casting", label: "🎤 Casting", desc: "Auditions pour un groupe, une chorale d'église ou un grand orchestre" },
  { id: "evenement", label: "🎉 Événement / Show", desc: "Annoncer une répétition publique, un showcase de quartier ou une sortie" },
  { id: "recherche", label: "🎸 Recherche d'instrumentiste", desc: "Rechercher activement un pianiste, un batteur ou un soliste permanent" }
];

interface GomboPublishProps {
  currentUserProfile: UserProfile;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function GomboPublish({ currentUserProfile, onSuccess, onCancel }: GomboPublishProps) {
  const [selectedType, setSelectedType] = useState("opportunite");
  const [gomboCategory, setGomboCategory] = useState<"libre" | "securise">("libre");
  const [showSecureModal, setShowSecureModal] = useState(false);

  // Requested fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [commune, setCommune] = useState("Cocody");
  const [locationDetail, setLocationDetail] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [budget, setBudget] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Live financial calculation for publication
  const isUserPremium = !!(currentUserProfile?.isPremium || currentUserProfile?.isVip || currentUserProfile?.isPro || currentUserProfile?.badges?.includes("💎 Adhérent Premium") || currentUserProfile?.gomboId?.certifie);
  const feeRate = isUserPremium ? 0.015 : 0.025;
  const cachetVal = budget ? Number(budget) : 0;
  const financials = calculatePublicationFinancials(cachetVal, feeRate);
  
  // Photo & Audio optional attachments
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // States
  const [loading, setLoading] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [publishOutcome, setPublishOutcome] = useState<"idle" | "success_published" | "insufficient_funds">("idle");
  const [depositDetails, setDepositDetails] = useState<{
    cachet: number;
    fee: number;
    total: number;
    requiresDeposit: boolean;
    refId: string;
    typeName: string;
    authorName: string;
    title: string;
    userSolde?: number;
  }>({ cachet: 0, fee: 0, total: 0, requiresDeposit: false, refId: "", typeName: "", authorName: "", title: "", userSolde: 0 });
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadingState, setUploadingState] = useState<{ [key: string]: boolean }>({});

  // Image and Audio input refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "audio") => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (type === "image") setImageFile(file);
      if (type === "audio") setAudioFile(file);
    }
  };

  const clearFile = (type: "image" | "audio") => {
    if (type === "image") {
      setImageFile(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
    } else {
      setAudioFile(null);
      if (audioInputRef.current) audioInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (gomboCategory === "securise") {
      setShowSecureModal(true);
      return;
    }

    // 1. VALIDATIONS OBLIGATOIRES DES CHAMPS
    if (!title.trim()) {
      setErrorMsg("Veuillez renseigner le titre de la publication !");
      return;
    }

    if (!description.trim()) {
      setErrorMsg("Veuillez renseigner la description !");
      return;
    }

    if (!commune || !commune.trim()) {
      setErrorMsg("Veuillez renseigner la commune ou la ville !");
      return;
    }

    // 2. VALIDATION STRICTE DE LA DATE (≥ AUJOURD'HUI)
    const todayStr = new Date().toISOString().split("T")[0];
    const selectedDateStr = (typeof date === "string" && date) ? date.split("T")[0] : todayStr;
    if (selectedDateStr < todayStr) {
      setErrorMsg("La date du Gombo doit être aujourd'hui ou dans le futur.");
      return;
    }

    setErrorMsg("");
    setShowConfirmModal(true);
  };

  const executePublish = async () => {
    setShowConfirmModal(false);
    setLoading(true);

    try {
      const authorName = currentUserProfile.displayName || currentUserProfile.name || "Artiste Gombo";
      const cachetVal = budget ? Number(budget) : (selectedType === "opportunite" || selectedType === "renfort" ? 25000 : 0);
      const financials = calculatePublicationFinancials(cachetVal, feeRate);
      
      // Upload files first (outside transaction)
      let uploadedImageUrl = "";
      let uploadedAudioUrl = "";
      if (imageFile) {
        uploadedImageUrl = await gomboDB.uploadFile(imageFile, `posts_assets/images/${Date.now()}_${imageFile.name}`);
      }
      if (audioFile) {
        uploadedAudioUrl = await gomboDB.uploadFile(audioFile, `posts_assets/audios/${Date.now()}_${audioFile.name}`);
      }

      const tempRefId = `PUB-${Date.now()}`;
      
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", currentUserProfile.uid);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("Utilisateur introuvable");
        const userData = userSnap.data();
        const liveSolde = userData?.wallet?.soldeDisponible ?? 0;
        const liveBloque = userData?.wallet?.soldeBloque ?? 0;

        if (financials.total > 0 && liveSolde < financials.total) {
            throw new Error("INSUFFICIENT_FUNDS");
        }

        // Debit Wallet
        const newSolde = Math.max(0, liveSolde - financials.total);
        const newBloque = liveBloque + cachetVal;
        transaction.update(userRef, {
          wallet: { soldeDisponible: newSolde, soldeBloque: newBloque }
        });

        // Record Transactions and create Gombo
        const txDebitId = `tx_debit_${Date.now()}`;
        transaction.set(doc(db, "transactions", txDebitId), {
          id: txDebitId,
          userId: currentUserProfile.uid,
          type: "debit_publication",
          amount: financials.total,
          status: "success",
          description: `Débit publication : Gombo "${title.trim()}"`,
          createdAt: now.toISOString(),
          timestamp: Date.now()
        });

        // Commission
        const commId = `comm_${Date.now()}`;
        transaction.set(doc(db, "commissions", commId), {
            userId: currentUserProfile.uid,
            amount: financials.fee,
            createdAt: now.toISOString()
        });

        // Create Gombo/Post (using doc/transaction.set instead of gomboDB)
        const postRef = doc(collection(db, "social_posts"));
        transaction.set(postRef, {
            userId: currentUserProfile.uid,
            title: title.trim(),
            status: "PUBLISHED",
            createdAt: now.toISOString()
        });
      });

      setPublishOutcome("success_published");
      setShowSuccessOverlay(true);
    } catch (err: any) {
      if (err.message === "INSUFFICIENT_FUNDS") {
         setPublishOutcome("insufficient_funds");
         setShowSuccessOverlay(true);
      } else {
         setErrorMsg(err.message || "Erreur lors de la publication.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-4 px-2">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-afri-bg/95 dark:bg-afri-bg-sec text-afri-text rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/35 shadow-[0_0_30px_rgba(212,175,55,0.15)] relative overflow-hidden"
      >
        {/* Gold design bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D4AF37] via-amber-400 to-[#D4AF37]" />

        <AnimatePresence>
          {showSuccessOverlay && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto overscroll-contain touch-pan-y"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-afri-bg-sec border border-[#D4AF37]/30 rounded-3xl w-full max-w-lg p-6 sm:p-8 overflow-y-auto max-h-[85vh] relative shadow-2xl space-y-5 flex flex-col text-center"
              >
                {publishOutcome === "insufficient_funds" ? (
                  <>
                    <div className="w-16 h-16 mx-auto bg-amber-500/10 border border-amber-500/40 rounded-2xl flex items-center justify-center text-amber-400 text-3xl shadow-lg">
                      <AlertCircle className="w-10 h-10 text-amber-400" />
                    </div>

                    <div className="space-y-1.5">
                      <span className="inline-block text-[10px] font-mono font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                        🔒 PUBLICATION IMPOSSIBLE
                      </span>
                      <h3 className="text-xl font-black text-afri-text uppercase tracking-wide pt-1">
                        Votre Wallet est insuffisant.
                      </h3>
                      <p className="text-xs sm:text-sm font-medium text-afri-text-sec leading-relaxed max-w-sm mx-auto">
                        Votre solde disponible ne couvre pas le montant total requis pour cette publication. Veuillez recharger votre Wallet.
                      </p>
                    </div>

                    {/* Summary Box */}
                    <div className="bg-afri-bg border border-afri-border rounded-xl p-4 space-y-2.5 text-left text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-afri-text-sec">Gombo :</span>
                        <span className="font-bold text-afri-text truncate max-w-[180px]">{depositDetails.title}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-afri-text-sec">Montant du Gombo :</span>
                        <span className="font-mono font-bold text-afri-text">{depositDetails.cachet.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-afri-text-sec">Commission (2,5%) :</span>
                        <span className="font-mono text-afri-text-sec">{depositDetails.fee.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-afri-border">
                        <span className="text-afri-text font-extrabold">Total Requis :</span>
                        <span className="font-mono font-black text-amber-400 text-sm">{depositDetails.total.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-afri-border/50">
                        <span className="text-afri-text-sec">Votre Solde Actuel :</span>
                        <span className="font-mono font-black text-rose-500">{(depositDetails.userSolde || 0).toLocaleString()} FCFA</span>
                      </div>
                    </div>

                    {/* Prominent Action Buttons */}
                    <div className="space-y-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSuccessOverlay(false);
                          onCancel(); // return to navigation or allow user to access wallet
                        }}
                        className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:opacity-90 text-black font-black text-xs uppercase rounded-xl transition-all shadow-lg cursor-pointer active:scale-98 flex items-center justify-center gap-2"
                      >
                        <Wallet className="w-4 h-4" />
                        <span>Recharger mon Wallet</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowSuccessOverlay(false)}
                        className="w-full py-2.5 bg-afri-bg hover:bg-afri-bg-sec border border-afri-border text-afri-text-sec text-[10px] font-mono uppercase rounded-xl transition-colors cursor-pointer"
                      >
                        Fermer
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 mx-auto bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 text-3xl shadow-lg animate-bounce">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>

                    <div className="space-y-2">
                      <span className="inline-block text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                        ✅ VALIDATION ET PUBLICATION IMMÉDIATE
                      </span>
                      <h3 className="text-lg font-black text-afri-text uppercase tracking-wide">
                        GOMBO PUBLIÉ AVEC SUCCÈS SUR LE TERRAIN !
                      </h3>
                      <p className="text-xs text-afri-text-sec leading-relaxed max-w-sm mx-auto">
                        Votre gombo a été publié en direct sur Le Terrain. Un montant de <strong>{depositDetails.total.toLocaleString()} FCFA</strong> a été prélevé de votre Coffre Afrigombo.
                      </p>
                    </div>

                    {/* Details Summary Card */}
                    <div className="bg-afri-bg border border-afri-border rounded-xl p-4 space-y-2.5 text-left text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-afri-text-sec">Titre :</span>
                        <span className="font-bold text-afri-text truncate max-w-[180px]">{depositDetails.title}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-afri-text-sec">Montant prélevé :</span>
                        <span className="font-mono font-black text-[#D4AF37]">{depositDetails.total.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-afri-text-sec">Réf ID :</span>
                        <span className="font-mono text-[10px] bg-afri-bg-sec px-2 py-0.5 rounded text-afri-text-sec border border-white/5">{depositDetails.refId}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-afri-text-sec">Nouveau solde Coffre :</span>
                        <span className="font-mono font-bold text-emerald-400">{(depositDetails.userSolde || 0).toLocaleString()} FCFA</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowSuccessOverlay(false);
                        onSuccess();
                      }}
                      className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:opacity-90 text-black font-black text-xs uppercase rounded-xl transition-all shadow-lg cursor-pointer active:scale-98"
                    >
                      Voir la publication sur Le Terrain
                    </button>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Title view */}
        <div className="mb-6 space-y-1">
          <span className="text-[10px] font-black uppercase text-[#D4AF37] tracking-widest flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-[#D4AF37] animate-pulse" />
            L'ADN DU LUXE AFRI
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#D4AF37] flex items-center gap-2 uppercase tracking-tight">
            🚀 Lancer le Gombo
          </h2>
          <p className="text-[11px] text-afri-text-sec font-medium">
            Entrez dans le temple musical et diffusez instantanément votre opportunité.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 bg-red-950/30 text-red-400 font-bold text-xs rounded-xl border border-red-900/60 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* CATEGORY SELECTION: LIBRE vs SECURISE */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-afri-text-sec uppercase tracking-widest">
              Catégorie de Gombo
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGomboCategory("libre")}
                className={`p-4 rounded-2xl border transition-all text-left space-y-1 relative group ${
                  gomboCategory === "libre" 
                    ? "bg-afri-bg-sec/50 border-emerald-500/50 text-afri-text" 
                    : "bg-transparent border-afri-border text-afri-text-sec hover:border-afri-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-tighter">Gombo Libre</span>
                  <Zap className={`w-3 h-3 ${gomboCategory === "libre" ? "text-emerald-500" : "text-zinc-700"}`} />
                </div>
                <p className="text-[8px] font-medium leading-tight opacity-70">Publication directe sans séquestre.</p>
              </button>
              
              <button
                type="button"
                onClick={() => setGomboCategory("securise")}
                className={`p-4 rounded-2xl border transition-all text-left space-y-1 relative group overflow-hidden ${
                  gomboCategory === "securise" 
                    ? "bg-afri-bg-sec/5 border-[#D4AF37]/50 text-afri-text" 
                    : "bg-transparent border-afri-border text-afri-text-sec hover:border-afri-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-tighter">Gombo Sécurisé</span>
                  <ShieldCheck className={`w-3 h-3 ${gomboCategory === "securise" ? "text-[#D4AF37]" : "text-zinc-700"}`} />
                </div>
                <p className="text-[8px] font-medium leading-tight opacity-70">Paiement garanti par AFRIGOMBO.</p>
                <Lock className="absolute -bottom-1 -right-1 w-6 h-6 text-[#D4AF37]/10 -rotate-12 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          {/* 1. SELECTION DU TYPE */}
          <div>
            <label className="block text-[10px] font-black text-afri-text-sec mb-2 uppercase tracking-widest">
              Nature de la mission
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#D4AF37]">
              {PUBLICATION_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedType(t.id)}
                  className={`p-3 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    selectedType === t.id 
                      ? "border-[#D4AF37] bg-white/[0.03] text-afri-text shadow-xs" 
                      : "border-white/[0.08] bg-transparent text-afri-text-sec hover:border-white/[0.2] hover:text-afri-text"
                  }`}
                >
                  <span className="text-xs font-black uppercase tracking-wider">{t.label}</span>
                  <span className="text-[9px] text-afri-text-sec mt-0.5 leading-tight">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. TITRE */}
          <div>
            <label className="block text-[10px] font-black text-afri-text-sec mb-1.5 uppercase tracking-widest">
              Titre de la publication
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Solo trompette recherché pour cabaret chic..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs font-bold text-afri-text focus:outline-none focus:ring-1 focus:ring-[#D4AF37] placeholder-gray-600"
            />
          </div>

          {/* 3. DESCRIPTION */}
          <div>
            <label className="block text-[10px] font-black text-afri-text-sec mb-1.5 uppercase tracking-widest">
              Description / Détails
            </label>
            <textarea
              rows={4}
              required
              placeholder="Donnez tous les détails avec style : lieu précis, ambiance, exigences de morceaux..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs font-semibold text-afri-text focus:outline-none focus:ring-1 focus:ring-[#D4AF37] placeholder-gray-600"
            />
          </div>

          {/* 4. COMMUNE EXCLUSIVITÉ & LOCALISATION PRÉCISE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-afri-text-sec mb-1.5 uppercase tracking-widest">
                Commune / Ville
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-afri-text-sec">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                </span>
                <select
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs font-black text-afri-text hover:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] cursor-pointer"
                >
                  {ABIDJAN_COMMUNES.map((com) => (
                    <option key={com} value={com} className="bg-afri-bg text-afri-text">{com}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-afri-text-sec mb-1.5 uppercase tracking-widest">
                Localisation précise (ex: Rue 12, Salle)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-afri-text-sec">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                </span>
                <input
                  type="text"
                  placeholder="Ex : Bar Le Monument, Rue des Jardins"
                  value={locationDetail}
                  onChange={(e) => setLocationDetail(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs font-black text-afri-text focus:outline-none focus:ring-1 focus:ring-[#D4AF37] placeholder-gray-650"
                />
              </div>
            </div>
          </div>

          {/* 5. DATE */}
          <div>
            <label className="block text-[10px] font-black text-[#D4AF37] mb-1.5 uppercase tracking-widest">
              Date de l'événement
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-afri-text-sec">
                <Calendar className="w-4 h-4 text-[#D4AF37]" />
              </span>
              <input
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs font-black text-afri-text focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>
          </div>

          {/* 6. CACHET OPTIONNEL */}
          <div>
            <label className="block text-[10px] font-black text-afri-text-sec mb-1.5 uppercase tracking-widest">
              Cachet (Optionnel, en FCFA)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-emerald-500 font-extrabold text-xs">
                FCFA
              </span>
              <input
                type="number"
                placeholder="Ex : 35000 (Laisser vide pour discuter)"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs font-bold text-afri-text focus:outline-none focus:ring-1 focus:ring-[#D4AF37] placeholder-gray-600"
              />
            </div>

            {/* 📄 RÉCAPITULATIF FINANCIER EN TEMPS RÉEL */}
            {cachetVal > 0 && (
              <div className="mt-3 p-4 bg-afri-bg-sec/90 border border-[#D4AF37]/30 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black text-[#D4AF37] uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">📄 Récapitulatif</span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                    {isUserPremium ? "Tarif Premium (1,5%)" : "Tarif Standard (2,5%)"}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-afri-text-sec">
                    <span>Montant du contrat :</span>
                    <span className="font-mono font-bold text-afri-text">{financials.cachet.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between text-afri-text-sec">
                    <span>Commission AFRIGOMBO ({isUserPremium ? "1,5%" : "2,5%"}):</span>
                    <span className="font-mono font-bold text-[#D4AF37]">{financials.fee.toLocaleString()} FCFA</span>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                    <span className="font-bold text-afri-text uppercase">Total à payer :</span>
                    <span className="font-mono font-black text-emerald-400 text-sm">{financials.total.toLocaleString()} FCFA</span>
                  </div>
                </div>
                <p className="text-[10px] text-afri-text-sec/80 leading-relaxed pt-1 border-t border-white/5">
                  ℹ️ Les frais de publication sont prélevés uniquement au moment de la publication du Gombo. Le montant du contrat reste entièrement réservé au musicien jusqu'à la fin de la prestation.
                </p>
              </div>
            )}
          </div>

          {/* 7. PHOTO OU AUDIO OPTIONNELS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Attachment image */}
            <div className="p-4 border-2 border-dashed border-white/[0.08] hover:border-[#D4AF37]/35 bg-white/[0.01] rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px] transition-all relative overflow-hidden"
                 onClick={() => imageInputRef.current?.click()}
            >
              <input 
                ref={imageInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => handleFileChange(e, "image")}
              />
              {imageFile ? (
                <div className="space-y-1 w-full text-center">
                  <span className="text-xs text-semibold truncate block max-w-[150px] mx-auto text-[#D4AF37]">🖼️ {imageFile.name}</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); clearFile("image"); }} className="text-[10px] uppercase font-bold text-red-500 inline-flex items-center gap-0.5 mt-2 bg-red-950/20 px-2 py-0.5 rounded">
                    <X className="w-3 h-3" /> Enlever
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <ImageIcon className="w-5 h-5 text-afri-text-sec mx-auto" />
                  <span className="text-[10px] font-black block text-gray-300">Photo d'illustration</span>
                  <span className="text-[8px] text-afri-text-sec block font-semibold">(Optionnel)</span>
                </div>
              )}
              {uploadingState.image && (
                <div className="absolute inset-0 bg-afri-bg/95 flex flex-col items-center justify-center">
                  <span className="text-[9px] text-[#D4AF37] font-black uppercase">Envoi photo... {uploadProgress.image || 0}%</span>
                </div>
              )}
            </div>

            {/* Attachment audio */}
            <div className="p-4 border-2 border-dashed border-white/[0.08] hover:border-[#D4AF37]/35 bg-white/[0.01] rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px] transition-all relative overflow-hidden"
                 onClick={() => audioInputRef.current?.click()}
            >
              <input 
                ref={audioInputRef}
                type="file" 
                accept="audio/*" 
                className="hidden" 
                onChange={(e) => handleFileChange(e, "audio")}
              />
              {audioFile ? (
                <div className="space-y-1 w-full text-center">
                  <span className="text-xs text-semibold truncate block max-w-[150px] mx-auto text-emerald-400">🎵 {audioFile.name}</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); clearFile("audio"); }} className="text-[10px] uppercase font-bold text-red-500 inline-flex items-center gap-0.5 mt-2 bg-red-950/20 px-2 py-0.5 rounded">
                    <X className="w-3 h-3" /> Enlever
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Music className="w-5 h-5 text-[#D4AF37]/80 mx-auto animate-pulse" />
                  <span className="text-[10px] font-black block text-gray-200">🎤 Audio court (30s max)</span>
                  <span className="text-[8px] text-[#D4AF37] block font-semibold">Présentation express !</span>
                </div>
              )}
              {uploadingState.audio && (
                <div className="absolute inset-0 bg-afri-bg/95 flex flex-col items-center justify-center">
                  <span className="text-[9px] text-[#D4AF37] font-black uppercase">Envoi audio... {uploadProgress.audio || 0}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions Buttons */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-afri-border/50">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-3 whitespace-nowrap bg-afri-bg hover:bg-afri-bg/80 border border-afri-border text-afri-text font-extrabold text-[10px] sm:text-xs uppercase rounded-xl transition-all tracking-wider cursor-pointer"
            >
              Retourner au Terrain
            </button>
            
            <button
              type="submit"
              disabled={loading || uploadingState.image || uploadingState.audio}
              className={`flex-1 px-6 py-3.5 font-extrabold text-[#0B0B0B] font-sans text-xs uppercase rounded-xl shadow-lg transition-all active:scale-97 cursor-pointer text-center font-black tracking-widest flex items-center justify-center gap-2 ${
                gomboCategory === "securise" 
                  ? "bg-[#D4AF37] animate-pulse shadow-[0_0_20px_rgba(212,175,55,0.4)]" 
                  : "bg-emerald-500"
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#0B0B0B] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {gomboCategory === "securise" ? <ShieldCheck className="w-4 h-4" /> : "🚀"}
                  {gomboCategory === "securise" ? "Gombo Sécurisé (Bientôt)" : "Lancer Gombo Libre"}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* MODAL DE CONFIRMATION AVANT PUBLICATION */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-afri-bg border border-[#D4AF37]/50 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
            >
              <h3 className="text-base font-black text-[#D4AF37] uppercase text-center tracking-wide">
                Confirmer la publication ?
              </h3>
              <div className="space-y-2.5 bg-white/[0.03] p-4 rounded-2xl border border-white/10 text-xs">
                <div className="flex justify-between text-afri-text-sec">
                  <span>Montant du contrat :</span>
                  <span className="font-mono font-bold text-afri-text">{financials.cachet.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between text-afri-text-sec">
                  <span>Commission ({isUserPremium ? "1,5%" : "2,5%"}) :</span>
                  <span className="font-mono font-bold text-[#D4AF37]">{financials.fee.toLocaleString()} FCFA</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                  <span className="font-bold text-afri-text uppercase">Total débité du Wallet :</span>
                  <span className="font-mono font-black text-emerald-400 text-base">{financials.total.toLocaleString()} FCFA</span>
                </div>
              </div>
              <p className="text-[10px] text-afri-text-sec text-center leading-relaxed">
                Le système vérifiera votre solde et prélèvera ces frais uniquement après votre confirmation.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-afri-text font-black text-xs uppercase rounded-xl transition-all border border-white/10 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={executePublish}
                  className="flex-1 py-3 bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:opacity-90 text-black font-black text-xs uppercase rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : "Confirmer"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <GomboSecureModal 
        isOpen={showSecureModal} 
        onClose={() => setShowSecureModal(false)} 
      />
    </div>
  );
}
