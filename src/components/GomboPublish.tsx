import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, Clock, DollarSign, MapPin, AlignLeft, Check, 
  Music, Sparkles, Image as ImageIcon, Briefcase, MessageSquare, 
  Upload, X, AlertCircle, Award, Star, Radio, Lock, ShieldCheck, Zap,
  Wallet, ArrowUpRight, CheckCircle2, Navigation, Map
} from "lucide-react";
import MapPickerModal from "./common/MapPickerModal";
import { db, gomboDB } from "../firebase";
import { doc, getDoc, setDoc, addDoc, collection, runTransaction } from "firebase/firestore";
import { UserProfile, SocialPost } from "../types";
import GomboSecureModal from "./GomboSecureModal";
import { calculatePlatformFee, calculatePublicationFinancials, recordWalletTransaction, getEffectiveCommissionRate, getCanonicalWalletBalance } from "../lib/financial";
import { validateAndPublishWithCode } from "../lib/validationCodeEngine";
import { PremiumEngine } from "../lib/premiumEngine";
import { getGomboRef } from "../lib/gomboIdHelper";
import { useLocations } from "../hooks/useLocations";
import UserLocationProposalModal from "./common/UserLocationProposalModal";
import { Plus } from "lucide-react";
import { AndroidBottomSheet } from "./common/GlobalPortalModal";

const ABIDJAN_COMMUNES = [
  "Cocody", "Yopougon", "Marcory", "Plateau", "Treichville", "Abobo", 
  "Koumassi", "Adjamé", "Port-Bouët", "Attécoubé", "Grand-Bassam", "Bingerville", "Autre"
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
  const { communeNames } = useLocations();
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("opportunite");
  const [gomboCategory, setGomboCategory] = useState<"libre" | "securise">("libre");
  const [showSecureModal, setShowSecureModal] = useState(false);

  // Requested fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [commune, setCommune] = useState("Cocody");
  const [customCommune, setCustomCommune] = useState("");
  const [quartier, setQuartier] = useState("");
  const [locationDetail, setLocationDetail] = useState("");
  const [latitude, setLatitude] = useState<number>(currentUserProfile?.latitude || 5.3600);
  const [longitude, setLongitude] = useState<number>(currentUserProfile?.longitude || -4.0083);
  const [searchRadius, setSearchRadius] = useState<number>(10);
  const [locationPrivacy, setLocationPrivacy] = useState<"exact" | "approximate">("exact");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);

  const handleUseCurrentGps = () => {
    setGpsNotice(null);
    if ("geolocation" in navigator) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          setLatitude(lat);
          setLongitude(lng);
          setGpsNotice("📍 Position GPS récupérée avec succès !");
          setGpsLoading(false);
        },
        (err) => {
          setGpsLoading(false);
          if (err.code === err.PERMISSION_DENIED) {
            setGpsNotice("La localisation n'est pas autorisée. Vous pouvez continuer en renseignant le lieu manuellement.");
          } else {
            setGpsNotice("Position indisponible actuellement. Vous pouvez choisir l'emplacement sur la carte.");
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setGpsNotice("La géolocalisation n'est pas supportée par votre navigateur.");
    }
  };
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [budget, setBudget] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Live financial calculation for publication using PremiumEngine
  const isUserPremium = PremiumEngine.isPremium(currentUserProfile);
  const feeRate = PremiumEngine.getCommissionRate(currentUserProfile);
  const cachetVal = budget ? Number(budget) : 0;
  const financials = calculatePublicationFinancials(cachetVal, feeRate);
  
  // Photo & Audio optional attachments
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // States
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [publishOutcome, setPublishOutcome] = useState<"idle" | "success_published" | "insufficient_funds">("idle");
  const [depositDetails, setDepositDetails] = useState<{
    cachet: number;
    fee: number;
    sequestre: number;
    total: number;
    rate: number;
    isPremium: boolean;
    requiresDeposit: boolean;
    refId: string;
    typeName: string;
    authorName: string;
    title: string;
    userSolde?: number;
  }>({ cachet: 0, fee: 0, sequestre: 0, total: 0, rate: 0.025, isPremium: false, requiresDeposit: false, refId: "", typeName: "", authorName: "", title: "", userSolde: 0 });
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

    const effectiveCommune = commune === "Autre" ? customCommune.trim() : commune;
    if (!effectiveCommune) {
      setErrorMsg("Veuillez renseigner la commune ou la ville !");
      return;
    }

    if (!quartier.trim()) {
      setErrorMsg("Veuillez renseigner le quartier !");
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

    try {
      const userRef = doc(db, "users", currentUserProfile.uid);
      const userSnap = await getDoc(userRef);
      const freshUserData = userSnap.exists() ? userSnap.data() : currentUserProfile;
      const userSolde = freshUserData?.walletBalance ?? freshUserData?.wallet?.soldeDisponible ?? 0;
      
      const cachetVal = budget ? Number(budget) : 0;
      const effectiveRate = getEffectiveCommissionRate(freshUserData);
      const financials = calculatePublicationFinancials(cachetVal, effectiveRate);

      setDepositDetails({
        cachet: cachetVal,
        fee: financials.fee,
        sequestre: financials.sequestre,
        total: financials.total,
        rate: financials.rate,
        isPremium: financials.isPremium,
        requiresDeposit: financials.total > 0,
        refId: `PUB-${Date.now()}`,
        typeName: selectedType,
        authorName: currentUserProfile.displayName || currentUserProfile.name || "Artiste",
        title: title.trim(),
        userSolde: userSolde
      });

      setShowConfirmModal(true);
    } catch (err) {
      setErrorMsg("Erreur lors de la vérification du solde du Wallet.");
    }
  };

  const executePublish = async () => {
    if (loading || isSubmitting) return;
    setIsSubmitting(true);
    setShowConfirmModal(false);
    setLoading(true);

    try {
      const authorName = currentUserProfile.displayName || currentUserProfile.name || "Artiste Gombo";
      const cachetVal = budget ? Number(budget) : 0;
      const effectiveCommune = commune === "Autre" ? customCommune.trim() : commune;
      
      // Upload files first (outside transaction)
      let uploadedImageUrl = "";
      let uploadedAudioUrl = "";
      if (imageFile) {
        uploadedImageUrl = await gomboDB.uploadFile(imageFile, `posts_assets/images/${Date.now()}_${imageFile.name}`);
      }
      if (audioFile) {
        uploadedAudioUrl = await gomboDB.uploadFile(audioFile, `posts_assets/audios/${Date.now()}_${audioFile.name}`);
      }

      let finalNewSolde = 0;
      const nowIso = new Date().toISOString();
      const currentTimestamp = Date.now();
      
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", currentUserProfile.uid);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("Utilisateur introuvable");
        const userData = userSnap.data();

        const liveSolde = getCanonicalWalletBalance(userData);
        const liveBloque = userData?.wallet?.soldeBloque ?? 0;

        const dynamicFeeRate = getEffectiveCommissionRate(userData);
        const freshFinancials = calculatePublicationFinancials(cachetVal, dynamicFeeRate);

        if (freshFinancials.total > 0 && liveSolde < freshFinancials.total) {
          throw new Error("INSUFFICIENT_FUNDS");
        }

        // Debit Wallet
        finalNewSolde = Math.max(0, liveSolde - freshFinancials.total);
        const newBloque = liveBloque + freshFinancials.sequestre;
        transaction.update(userRef, {
          walletBalance: finalNewSolde,
          balance: finalNewSolde,
          wallet: { ...(userData.wallet || {}), soldeDisponible: finalNewSolde, soldeBloque: newBloque }
        });

        // Record Publication Transaction with complete audit trail
        const txDebitId = `tx_pub_${currentTimestamp}_${Math.random().toString(36).substring(2, 6)}`;
        const pubTxData = {
          id: txDebitId,
          reference: txDebitId,
          transactionId: txDebitId,
          uid: currentUserProfile.uid,
          userId: currentUserProfile.uid,
          userName: authorName,
          type: "debit_publication",
          typeTransaction: "publication_gombo",
          publicationId: "", // Will update after ref creation
          gomboId: "",
          montantGombo: cachetVal,
          gomboAmount: cachetVal,
          frais: freshFinancials.fee,
          fee: freshFinancials.fee,
          totalDebite: freshFinancials.total,
          amount: freshFinancials.total,
          montant: freshFinancials.total,
          soldeAvant: liveSolde,
          balanceBefore: liveSolde,
          soldeApres: finalNewSolde,
          balanceAfter: finalNewSolde,
          status: "success",
          statut: "success",
          description: `Publication Gombo : "${title.trim()}" (${cachetVal.toLocaleString('fr-FR')} FCFA + ${freshFinancials.fee.toLocaleString('fr-FR')} FCFA frais)`,
          createdAt: nowIso,
          timestamp: currentTimestamp
        };

        // Create Gombo/Post Document Ref
        const postRef = doc(collection(db, "social_posts"));
        const gomboRefVal = getGomboRef(postRef.id);

        pubTxData.publicationId = postRef.id;
        pubTxData.gomboId = postRef.id;

        transaction.set(doc(db, "transactions", txDebitId), pubTxData);
        transaction.set(doc(db, "walletTransactions", txDebitId), pubTxData);

        // Record Commission Transaction
        if (freshFinancials.fee > 0) {
          const commTxId = `tx_comm_${currentTimestamp}_${Math.random().toString(36).substring(2, 6)}`;
          const commTxData = {
            id: commTxId,
            reference: commTxId,
            transactionId: commTxId,
            uid: currentUserProfile.uid,
            userId: currentUserProfile.uid,
            userName: authorName,
            type: "commission",
            typeTransaction: "commission_plateforme",
            publicationId: postRef.id,
            gomboId: postRef.id,
            amount: freshFinancials.fee,
            montant: freshFinancials.fee,
            status: "success",
            statut: "success",
            description: `Commission publication Gombo (${(dynamicFeeRate * 100).toFixed(1)}%)`,
            createdAt: nowIso,
            timestamp: currentTimestamp
          };
          transaction.set(doc(db, "transactions", commTxId), commTxData);
          transaction.set(doc(db, "walletTransactions", commTxId), commTxData);
        }

        // Commission reporting collection ("commissions" / "founder_vault" history)
        const commId = `comm_${currentTimestamp}_${Math.random().toString(36).substring(2, 6)}`;
        transaction.set(doc(db, "commissions", commId), {
          id: commId,
          commId: commId,
          transactionId: txDebitId,
          userId: currentUserProfile.uid,
          uid: currentUserProfile.uid,
          userName: authorName,
          clientName: authorName,
          userEmail: currentUserProfile.email || "",
          userPhone: currentUserProfile.phoneNumber || currentUserProfile.phone || "",
          publicationId: postRef.id,
          gomboId: postRef.id,
          gomboTitle: title.trim(),
          title: title.trim(),
          gomboAmount: cachetVal,
          montantGombo: cachetVal,
          feeRate: dynamicFeeRate,
          rate: dynamicFeeRate,
          pourcentageFrais: dynamicFeeRate * 100,
          feeAmount: freshFinancials.fee,
          montantFrais: freshFinancials.fee,
          frais: freshFinancials.fee,
          amount: freshFinancials.fee,
          totalAmount: freshFinancials.total,
          totalPaid: freshFinancials.total,
          totalPaye: freshFinancials.total,
          createdAt: nowIso,
          publishedAt: nowIso,
          timestamp: currentTimestamp,
          status: "success",
          statut: "Réussi",
          type: "publication_fee",
          typeTransaction: "commission_publication",
          description: `Frais de publication Gombo : "${title.trim()}"`
        });

        // Canonical Payload with all alias fields and real statistics initialized to zero
        const authorAvatar = currentUserProfile.photoURL || currentUserProfile.avatarUrl || currentUserProfile.avatar || "";

        const gomboPayload = {
          id: postRef.id,
          gomboId: postRef.id,
          postId: postRef.id,
          gomboRef: gomboRefVal,
          reference: gomboRefVal,

          // User / Owner Aliases
          userId: currentUserProfile.uid,
          clientId: currentUserProfile.uid,
          organizerId: currentUserProfile.uid,
          authorId: currentUserProfile.uid,
          uid: currentUserProfile.uid,

          // Author / Client Info
          authorName,
          clientName: authorName,
          organizerName: authorName,
          authorArtisticName: title.trim(),
          authorPhoto: authorAvatar,
          authorAvatar: authorAvatar,
          organizerAvatar: authorAvatar,
          userAvatar: authorAvatar,

          // Content
          title: title.trim(),
          description: description.trim(),
          content: description.trim(),
          caption: description.trim(),
          type: selectedType,
          category: selectedType,

          // Location
          commune: effectiveCommune,
          location: effectiveCommune,
          communeCustom: commune === "Autre" ? customCommune.trim() : "",
          quartier: quartier.trim(),
          locationDetail: locationDetail.trim(),
          date: date,
          city: currentUserProfile.city || "Abidjan",
          country: currentUserProfile.country || "Côte d'Ivoire",
          latitude: latitude,
          longitude: longitude,
          searchRadius: searchRadius,
          locationPrivacy: locationPrivacy,

          // Financials & Payment
          budget: cachetVal,
          cachet: cachetVal,
          fee: freshFinancials.fee,
          frais: freshFinancials.fee,
          totalDebit: freshFinancials.total,
          paymentStatus: "paid",
          paymentMethod: "wallet_autonomus",

          // Status & Visibility
          status: "PUBLISHED",
          statut: "PUBLISHED",
          visible: true,
          adminValidated: true,
          isPublished: true,
          isPaid: true,

          // Media
          imageUrl: uploadedImageUrl,
          mediaUrl: uploadedImageUrl,
          audioUrl: uploadedAudioUrl,

          // Real Timestamps
          createdAt: nowIso,
          timestamp: currentTimestamp,
          publishedAt: nowIso,

          // REAL Statistics initialized to ZERO (No fake metrics)
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          applicantsCount: 0,
          likedBy: [],
          savedBy: []
        };

        // Write to all primary feed collections
        transaction.set(postRef, gomboPayload);
        transaction.set(doc(db, "gombos", postRef.id), gomboPayload);
        transaction.set(doc(db, "posts", postRef.id), gomboPayload);
      });

      window.dispatchEvent(new CustomEvent("wallet_balance_updated", { detail: { newBalance: finalNewSolde } }));
      window.dispatchEvent(new CustomEvent("wallet_updated", { detail: { newBalance: finalNewSolde } }));

      setDepositDetails(prev => ({ ...prev, userSolde: finalNewSolde }));
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
      setIsSubmitting(false);
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
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-afri-bg/80 backdrop-blur-sm overflow-y-auto overscroll-contain touch-pan-y"
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
                          window.dispatchEvent(new CustomEvent("open_wallet_deposit"));
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
                        <span className="text-afri-text-sec">Référence du gombo :</span>
                        <span className="font-mono text-[10px] bg-afri-bg-sec px-2 py-0.5 rounded text-afri-text-sec border border-afri-border">Gombo Réf {getGomboRef(depositDetails.refId)}</span>
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
                <p className="text-[8px] font-medium leading-tight opacity-70">Paiement garanti par AFRIGOMBO ELITE.</p>
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
                  {Array.from(new Set([...ABIDJAN_COMMUNES, ...communeNames])).map((com) => (
                    <option key={com} value={com} className="bg-afri-bg text-afri-text">{com}</option>
                  ))}
                </select>
              </div>

              {commune === "Autre" && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2"
                >
                  <button
                    type="button"
                    onClick={() => setIsProposalModalOpen(true)}
                    className="w-full py-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl text-[10px] font-black text-[#D4AF37] uppercase tracking-wider hover:bg-[#D4AF37] hover:text-black transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Ajouter un lieu</span>
                  </button>
                </motion.div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-afri-text-sec mb-1.5 uppercase tracking-widest">
                Quartier <span className="text-[#D4AF37]">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-afri-text-sec">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Ex : Angré, Vridi, Belleville, Koko..."
                  value={quartier}
                  onChange={(e) => setQuartier(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs font-black text-afri-text focus:outline-none focus:ring-1 focus:ring-[#D4AF37] placeholder-gray-600"
                />
              </div>
            </div>
          </div>

          {commune === "📍 Autre commune" && (
            <div>
              <label className="block text-[10px] font-black text-afri-text-sec mb-1.5 uppercase tracking-widest">
                Commune (saisie libre) <span className="text-[#D4AF37]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex : Bouaké, Yamoussoukro, San-Pédro, Korhogo..."
                value={customCommune}
                onChange={(e) => setCustomCommune(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs font-bold text-afri-text focus:outline-none focus:ring-1 focus:ring-[#D4AF37] placeholder-gray-600"
              />
            </div>
          )}

          {/* RADAR & GÉOLOCALISATION INTELLIGENTE DU GOMBO */}
          <div className="p-4 bg-white/[0.02] border border-[#D4AF37]/30 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📍</span>
                <div>
                  <h4 className="text-xs font-black text-afri-text uppercase tracking-wider">Localisation du lieu</h4>
                  <p className="text-[9px] text-afri-text-sec">Coordonnées GPS pour navigation et carte radar</p>
                </div>
              </div>
            </div>

            {gpsNotice && (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] font-mono">
                {gpsNotice}
              </div>
            )}

            <div className="p-3 bg-zinc-950 border border-afri-border rounded-xl flex items-center justify-between flex-wrap gap-2">
              <div className="text-[11px] font-mono font-bold text-emerald-400">
                <span>📍 Emplacement sélectionné :</span>
                <span className="ml-1 font-extrabold">{latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleUseCurrentGps}
                disabled={gpsLoading}
                className="px-3 py-2.5 bg-[#D4AF37]/20 border border-[#D4AF37]/50 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{gpsLoading ? "Localisation..." : "A. Utiliser ma position"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMapPickerOpen(true)}
                className="px-3 py-2.5 bg-[#D4AF37]/20 border border-[#D4AF37]/50 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <Map className="w-3.5 h-3.5" />
                <span>B. Choisir sur la carte</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[9px] font-bold text-afri-text-sec uppercase mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 5.36)}
                  className="w-full px-3 py-2 bg-afri-bg/40 border border-afri-border rounded-xl text-xs font-mono text-afri-text"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-afri-text-sec uppercase mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || -4.0083)}
                  className="w-full px-3 py-2 bg-afri-bg/40 border border-afri-border rounded-xl text-xs font-mono text-afri-text"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="block text-[10px] font-black text-afri-text-sec uppercase tracking-wider">
                Rayon de recherche & ciblage radar :
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { r: 2, label: "2 km" },
                  { r: 5, label: "5 km" },
                  { r: 10, label: "10 km" },
                  { r: 20, label: "20 km" },
                  { r: 100, label: "Toute la ville" }
                ].map((item) => (
                  <button
                    key={item.r}
                    type="button"
                    onClick={() => setSearchRadius(item.r)}
                    className={`py-2 px-1 rounded-xl text-[9px] font-black uppercase font-mono transition cursor-pointer border ${
                      searchRadius === item.r
                        ? "bg-[#D4AF37] text-black border-[#D4AF37] shadow-md"
                        : "bg-white/[0.04] text-afri-text border-afri-border hover:border-[#D4AF37]/50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="block text-[10px] font-black text-afri-text-sec uppercase tracking-wider">
                Confidentialité de l'adresse :
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLocationPrivacy("exact")}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    locationPrivacy === "exact"
                      ? "bg-[#D4AF37]/15 border-[#D4AF37] text-afri-text"
                      : "bg-white/[0.02] border-afri-border text-afri-text-sec hover:border-white/30"
                  }`}
                >
                  <div className="text-[10px] font-black uppercase">✓ Position exacte</div>
                  <div className="text-[8.5px] text-afri-text-sec">Visible dès la validation</div>
                </button>
                <button
                  type="button"
                  onClick={() => setLocationPrivacy("approximate")}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    locationPrivacy === "approximate"
                      ? "bg-[#D4AF37]/15 border-[#D4AF37] text-afri-text"
                      : "bg-white/[0.02] border-afri-border text-afri-text-sec hover:border-white/30"
                  }`}
                >
                  <div className="text-[10px] font-black uppercase">🔒 Position approximative</div>
                  <div className="text-[8.5px] text-afri-text-sec">Quartier uniquement jusqu'à acceptation</div>
                </button>
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
                    <span>Commission AFRIGOMBO ELITE ({isUserPremium ? "1,5%" : "2,5%"}):</span>
                    <span className="font-mono font-bold text-[#D4AF37]">{financials.fee.toLocaleString()} FCFA</span>
                  </div>
                  <div className="pt-2 border-t border-afri-border flex justify-between items-center">
                    <span className="font-bold text-afri-text uppercase">Total à payer :</span>
                    <span className="font-mono font-black text-emerald-400 text-sm">{financials.total.toLocaleString()} FCFA</span>
                  </div>
                </div>
                <p className="text-[10px] text-afri-text-sec/80 leading-relaxed pt-1 border-t border-afri-border">
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
                  <span className="text-[10px] font-black block text-afri-text-sec">Photo d'illustration</span>
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
                  <span className="text-[10px] font-black block text-afri-text">🎤 Audio court (30s max)</span>
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

      {/* MODAL DE CONFIRMATION AVANT PUBLICATION (ANDROID BOTTOM-SHEET) */}
      <AndroidBottomSheet
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="CONFIRMATION DE PUBLICATION"
      >
        <div className="space-y-4 py-2">
          <div className="text-center space-y-1">
            <span className="inline-block text-[9.5px] font-mono font-black text-[#D4AF37] uppercase tracking-widest bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/30">
              🔐 CONFIRMATION DE PUBLICATION
            </span>
          </div>

          <div className="space-y-2.5 bg-afri-bg p-4 rounded-2xl border border-afri-border text-xs">
            <div className="flex justify-between items-center">
              <span className="text-afri-text-sec">Statut :</span>
              <span className="font-bold text-[#D4AF37] flex items-center gap-1">
                {depositDetails.isPremium ? "👑 PREMIUM" : "👤 STANDARD"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-afri-text-sec">Cachet :</span>
              <span className="font-mono font-bold text-afri-text">{depositDetails.cachet.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-afri-text-sec">Commission (Taux applicable) :</span>
              <span className="font-mono text-afri-text-sec">{(depositDetails.rate * 100).toFixed(1).replace('.', ',')} %</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-afri-text-sec">Frais :</span>
              <span className="font-mono font-bold text-[#D4AF37]">{depositDetails.fee.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-afri-text-sec">Montant séquestré :</span>
              <span className="font-mono font-bold text-sky-400">{depositDetails.sequestre.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-afri-border">
              <span className="font-bold text-afri-text uppercase text-xs">Total débité :</span>
              <span className="font-mono font-black text-amber-400 text-sm">{depositDetails.total.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-dashed border-afri-border/50">
              <span className="text-afri-text-sec">Solde disponible avant :</span>
              <span className="font-mono font-bold text-emerald-400">{(depositDetails.userSolde ?? 0).toLocaleString('fr-FR')} F</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-afri-text-sec">Solde disponible après :</span>
              <span className={`font-mono font-bold ${((depositDetails.userSolde ?? 0) - depositDetails.total) >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                {Math.max(0, (depositDetails.userSolde ?? 0) - depositDetails.total).toLocaleString('fr-FR')} F
              </span>
            </div>
          </div>

          <p className="text-[10px] text-afri-text-sec text-center leading-relaxed">
            Aucun débit et aucune création de publication avant le clic sur "CONFIRMER LA PUBLICATION".
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 py-3.5 bg-afri-bg hover:bg-afri-bg/80 text-afri-text font-black text-xs uppercase rounded-xl transition-all border border-afri-border cursor-pointer active:scale-98"
            >
              ANNULER
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={executePublish}
              className="flex-1 py-3.5 bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:opacity-90 text-black font-black text-xs uppercase rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              {loading ? <div className="w-4 h-4 border-2 border-afri-border border-t-transparent rounded-full animate-spin" /> : "CONFIRMER LA PUBLICATION"}
            </button>
          </div>
        </div>
      </AndroidBottomSheet>

      <GomboSecureModal 
        isOpen={showSecureModal} 
        onClose={() => setShowSecureModal(false)} 
      />

      <UserLocationProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        onSuccess={(proposedName) => {
          setCommune("Autre");
          setCustomCommune(proposedName);
        }}
        currentUser={currentUserProfile}
        defaultType="Commune"
      />

      <MapPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        initialLat={latitude}
        initialLng={longitude}
        title={`Emplacement du Gombo : ${title || commune}`}
        onConfirm={(coords) => {
          setLatitude(coords.latitude);
          setLongitude(coords.longitude);
          setGpsNotice(`Emplacement sélectionné : Lat ${coords.latitude.toFixed(4)}, Lng ${coords.longitude.toFixed(4)}`);
        }}
      />
    </div>
  );
}
