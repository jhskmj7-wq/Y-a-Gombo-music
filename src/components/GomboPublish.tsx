import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, MapPin, AlignLeft, Check, 
  Music, Sparkles, Image as ImageIcon, Briefcase, 
  X, AlertCircle, Award, Star, Radio, Lock, ShieldCheck, Zap,
  Wallet, ArrowUpRight, CheckCircle2, Navigation, Map, Building2, Plus,
  FileText, Compass, Trash2, CheckCircle
} from "lucide-react";
import MapPickerModal from "./common/MapPickerModal";
import { gomboDB } from "../firebase";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, addDoc, collection, runTransaction } from "firebase/firestore";
import { UserProfile, SocialPost } from "../types";
import { calculatePublicationFinancials, getEffectiveCommissionRate, getCanonicalWalletBalance } from "../lib/financial";
import { PremiumEngine } from "../lib/premiumEngine";
import { getGomboRef } from "../lib/gomboIdHelper";
import { useLocations } from "../hooks/useLocations";
import UserLocationProposalModal from "./common/UserLocationProposalModal";
import { AndroidBottomSheet } from "./common/GlobalPortalModal";

const CI_COMMUNES = [
  "Cocody", "Yopougon", "Marcory", "Plateau", "Treichville", "Abobo", 
  "Koumassi", "Adjamé", "Port-Bouët", "Attécoubé", "Bingerville", 
  "Grand-Bassam", "Songon", "Anyama", "Yamoussoukro", "Bouaké", "San-Pédro", "Autre"
];

const PUBLICATION_TYPES = [
  { id: "opportunite", label: "💼 Opportunité (Contrat)", desc: "Proposer un gombo rémunéré, un contrat de cabaret ou un concert privé" },
  { id: "demo", label: "🎵 Démo musicale", desc: "Transmettre un a cappella, un solo instrumental ou une de vos performances" },
  { id: "renfort", label: "⚡ Renfort Express", desc: "Besoin immédiat d'un remplaçant pour une répétition ou un live ce soir" },
  { id: "casting", label: "🎤 Casting", desc: "Auditions pour un groupe, une chorale d'église ou un grand orchestre" },
  { id: "evenement", label: "🎉 Événement / Show", desc: "Annoncer une répétition publique, un showcase de quartier ou une sortie" },
  { id: "recherche", label: "🎸 Recherche d'instrumentiste", desc: "Rechercher activement un pianiste, un batteur ou un soliste permanent" }
];

const DRAFT_STORAGE_KEY = "gombo_publish_draft";

interface GomboPublishProps {
  currentUserProfile: UserProfile;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function GomboPublish({ currentUserProfile, onSuccess, onCancel }: GomboPublishProps) {
  const { locations: officialLocationsList, communeNames, submitProposal: submitLocationProposal } = useLocations();
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("opportunite");
  const [gomboCategory, setGomboCategory] = useState<"libre" | "securise">("libre");

  // Location Bottom Sheet & Modes: "none" | "gps" | "commune" | "autre"
  const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);
  const [locationOption, setLocationOption] = useState<"none" | "gps" | "commune" | "autre">("none");
  const [commune, setCommune] = useState("Cocody");
  const [customCommune, setCustomCommune] = useState("");
  const [quartier, setQuartier] = useState("");
  const [customPlaceInput, setCustomPlaceInput] = useState<string>("");
  const [proposePlaceToCommunity, setProposePlaceToCommunity] = useState(false);
  const [locationDetail, setLocationDetail] = useState("");
  const [latitude, setLatitude] = useState<number | null>(currentUserProfile?.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(currentUserProfile?.longitude || null);
  const [searchRadius, setSearchRadius] = useState<number>(10);
  const [locationPrivacy, setLocationPrivacy] = useState<"exact" | "approximate">("exact");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);

  // Form core fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [budget, setBudget] = useState("");
  
  // Media attachments
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // States for submission & drafts
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSavedToast, setDraftSavedToast] = useState(false);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [publishOutcome, setPublishOutcome] = useState<"idle" | "success_published" | "insufficient_funds">("idle");
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadingState, setUploadingState] = useState<{ [key: string]: boolean }>({});

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
  }>({ 
    cachet: 0, 
    fee: 0, 
    sequestre: 0, 
    total: 0, 
    rate: 0.025, 
    isPremium: false, 
    requiresDeposit: false, 
    refId: "", 
    typeName: "", 
    authorName: "", 
    title: "", 
    userSolde: 0 
  });

  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Live financial calculation using PremiumEngine
  const isUserPremium = PremiumEngine.isPremium(currentUserProfile);
  const feeRate = PremiumEngine.getCommissionRate(currentUserProfile);
  const cachetVal = budget ? Number(budget) : 0;
  const financials = calculatePublicationFinancials(cachetVal, feeRate);

  // 1. AUTO-RESTORE DRAFT ON MOUNT
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.title || parsed.description) {
          if (parsed.title) setTitle(parsed.title);
          if (parsed.description) setDescription(parsed.description);
          if (parsed.selectedType) setSelectedType(parsed.selectedType);
          if (parsed.gomboCategory) setGomboCategory(parsed.gomboCategory);
          if (parsed.locationOption) setLocationOption(parsed.locationOption);
          if (parsed.commune) setCommune(parsed.commune);
          if (parsed.customCommune) setCustomCommune(parsed.customCommune);
          if (parsed.quartier) setQuartier(parsed.quartier);
          if (parsed.customPlaceInput) setCustomPlaceInput(parsed.customPlaceInput);
          if (parsed.locationDetail) setLocationDetail(parsed.locationDetail);
          if (parsed.date) setDate(parsed.date);
          if (parsed.budget) setBudget(parsed.budget);
          if (typeof parsed.latitude === "number") setLatitude(parsed.latitude);
          if (typeof parsed.longitude === "number") setLongitude(parsed.longitude);
          setHasRestoredDraft(true);
        }
      }
    } catch (e) {
      console.warn("Could not parse draft:", e);
    }
  }, []);

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (_) {}
    setTitle("");
    setDescription("");
    setSelectedType("opportunite");
    setGomboCategory("libre");
    setLocationOption("none");
    setCommune("Cocody");
    setCustomCommune("");
    setQuartier("");
    setCustomPlaceInput("");
    setLocationDetail("");
    setBudget("");
    setLatitude(null);
    setLongitude(null);
    setImageFile(null);
    setAudioFile(null);
    setHasRestoredDraft(false);
    setErrorMsg("");
  };

  const handleSaveDraft = async () => {
    if (savingDraft) return;
    setSavingDraft(true);
    setErrorMsg("");

    const draftData = {
      title: title.trim(),
      description: description.trim(),
      selectedType,
      gomboCategory,
      locationOption,
      commune,
      customCommune,
      quartier,
      customPlaceInput,
      locationDetail,
      date,
      budget,
      latitude,
      longitude,
      savedAt: new Date().toISOString()
    };

    try {
      // 1. Save in localStorage
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));

      // 2. Save in Firestore if user is authenticated
      if (currentUserProfile?.uid) {
        const draftId = `draft_${currentUserProfile.uid}_${Date.now()}`;
        const draftRef = doc(db, "gombos", draftId);
        await setDoc(draftRef, {
          id: draftId,
          gomboId: draftId,
          userId: currentUserProfile.uid,
          createdBy: currentUserProfile.uid,
          authorName: currentUserProfile.displayName || currentUserProfile.name || "Artiste",
          authorAvatar: currentUserProfile.photoURL || currentUserProfile.avatarUrl || "",
          title: title.trim() || "Brouillon de Gombo",
          description: description.trim(),
          type: selectedType,
          category: selectedType,
          gomboCategory,
          status: "draft",
          statut: "draft",
          visible: false,
          isPublished: false,
          budget: cachetVal,
          date,
          locationName: locationOption === "commune" ? commune : (customPlaceInput || ""),
          commune: commune || "",
          quartier: quartier || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          timestamp: Date.now()
        }, { merge: true });
      }

      setDraftSavedToast(true);
      setTimeout(() => setDraftSavedToast(false), 3500);
    } catch (err: any) {
      console.error("Erreur lors de la sauvegarde du brouillon:", err);
      // Even if firestore throws, local storage succeeded
      setDraftSavedToast(true);
      setTimeout(() => setDraftSavedToast(false), 3500);
    } finally {
      setSavingDraft(false);
    }
  };

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
          setGpsNotice(`📍 Position GPS détectée (${lat}, ${lng}) !`);
          setGpsLoading(false);
        },
        (err) => {
          setGpsLoading(false);
          if (err.code === err.PERMISSION_DENIED) {
            setGpsNotice("La localisation n'a pas été autorisée. Vous pouvez publier sans GPS ou choisir une commune.");
          } else {
            setGpsNotice("Position GPS temporairement indisponible. Vous pouvez continuer sans problème.");
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setGpsNotice("La géolocalisation n'est pas supportée sur ce navigateur.");
    }
  };

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

    if (!currentUserProfile?.uid) {
      setErrorMsg("Vous devez être connecté pour publier un Gombo.");
      return;
    }
    
    // 1. VALIDATIONS OBLIGATOIRES DES CHAMPS
    if (!title.trim()) {
      setErrorMsg("Veuillez renseigner le titre de votre Gombo !");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!description.trim()) {
      setErrorMsg("Veuillez renseigner la description !");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (locationOption === "autre" && !customPlaceInput.trim()) {
      setErrorMsg("Veuillez préciser le nom du lieu ou désactiver l'option lieu.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // 2. VALIDATION DATE (≥ AUJOURD'HUI)
    const todayStr = new Date().toISOString().split("T")[0];
    const selectedDateStr = (typeof date === "string" && date) ? date.split("T")[0] : todayStr;
    if (selectedDateStr < todayStr) {
      setErrorMsg("La date du Gombo doit être fixée à aujourd'hui ou dans le futur.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setErrorMsg("");

    try {
      const userRef = doc(db, "users", currentUserProfile.uid);
      const userSnap = await getDoc(userRef);
      const freshUserData = userSnap.exists() ? userSnap.data() : currentUserProfile;
      const userSolde = getCanonicalWalletBalance(freshUserData);
      
      const effectiveRate = getEffectiveCommissionRate(freshUserData);
      const calculatedFinancials = calculatePublicationFinancials(cachetVal, effectiveRate);

      // In Gombo Libre, escrow sequestre is optional or paid on site by the client
      const isSecurise = gomboCategory === "securise";
      const totalToDebit = isSecurise ? calculatedFinancials.total : calculatedFinancials.fee;

      setDepositDetails({
        cachet: cachetVal,
        fee: calculatedFinancials.fee,
        sequestre: isSecurise ? calculatedFinancials.sequestre : 0,
        total: totalToDebit,
        rate: calculatedFinancials.rate,
        isPremium: calculatedFinancials.isPremium,
        requiresDeposit: totalToDebit > 0,
        refId: `PUB-${Date.now()}`,
        typeName: selectedType,
        authorName: currentUserProfile.displayName || currentUserProfile.name || "Artiste",
        title: title.trim(),
        userSolde: userSolde
      });

      setShowConfirmModal(true);
    } catch (err: any) {
      console.error("Erreur lors de la préparation de la publication:", err);
      // Even if wallet check has an issue, open confirmation
      setShowConfirmModal(true);
    }
  };

  const executePublish = async () => {
    if (loading || isSubmitting) return;
    setIsSubmitting(true);
    setShowConfirmModal(false);
    setLoading(true);
    setErrorMsg("");

    try {
      const authorName = currentUserProfile.displayName || currentUserProfile.name || "Artiste Gombo";
      const authorAvatar = currentUserProfile.photoURL || currentUserProfile.avatarUrl || currentUserProfile.avatar || "";
      const isSecurise = gomboCategory === "securise";
      
      // 1. Upload files first (outside transaction)
      let uploadedImageUrl = "";
      let uploadedAudioUrl = "";
      if (imageFile) {
        setUploadingState(prev => ({ ...prev, image: true }));
        try {
          uploadedImageUrl = await gomboDB.uploadFile(imageFile, `posts_assets/images/${Date.now()}_${imageFile.name}`);
        } catch (uErr) {
          console.warn("Upload image warning, continuing without media:", uErr);
        } finally {
          setUploadingState(prev => ({ ...prev, image: false }));
        }
      }
      if (audioFile) {
        setUploadingState(prev => ({ ...prev, audio: true }));
        try {
          uploadedAudioUrl = await gomboDB.uploadFile(audioFile, `posts_assets/audios/${Date.now()}_${audioFile.name}`);
        } catch (uErr) {
          console.warn("Upload audio warning, continuing without media:", uErr);
        } finally {
          setUploadingState(prev => ({ ...prev, audio: false }));
        }
      }

      // 2. Submit location proposal outside transaction (non-blocking)
      if (locationOption === "autre" && customPlaceInput.trim() && proposePlaceToCommunity) {
        try {
          await submitLocationProposal({
            name: customPlaceInput.trim(),
            city: commune || "Abidjan",
            country: "Côte d'Ivoire",
            latitude: latitude || undefined,
            longitude: longitude || undefined,
            createdBy: currentUserProfile.uid,
            suggestedBy: currentUserProfile.uid,
            suggestedByName: authorName
          });
        } catch (pErr) {
          console.warn("Proposal submission notice (non-blocking):", pErr);
        }
      }

      // 3. Prepare Location Data
      const effectiveLocationName = 
        locationOption === "commune" ? (commune === "Autre" ? customCommune.trim() : commune) :
        locationOption === "autre" ? customPlaceInput.trim() :
        locationOption === "gps" ? "Position GPS détectée" :
        "";

      const hasLoc = locationOption !== "none" && Boolean(effectiveLocationName || (latitude && longitude));

      const nowIso = new Date().toISOString();
      const currentTimestamp = Date.now();
      let publishedPostId = "";
      let finalNewSolde = 0;

      // 4. Perform Firestore Atomic Transaction
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", currentUserProfile.uid);
        const userSnap = await transaction.get(userRef);
        const userData = userSnap.exists() ? userSnap.data() : currentUserProfile;

        const liveSolde = getCanonicalWalletBalance(userData);
        const liveBloque = userData?.wallet?.soldeBloque ?? 0;
        const dynamicFeeRate = getEffectiveCommissionRate(userData);
        const freshFinancials = calculatePublicationFinancials(cachetVal, dynamicFeeRate);

        const totalToDebit = isSecurise ? freshFinancials.total : 0;

        if (totalToDebit > 0 && liveSolde < totalToDebit) {
          throw new Error("INSUFFICIENT_FUNDS");
        }

        // Debit Wallet if applicable
        if (totalToDebit > 0) {
          finalNewSolde = Math.max(0, liveSolde - totalToDebit);
          const newBloque = liveBloque + (isSecurise ? freshFinancials.sequestre : 0);
          transaction.update(userRef, {
            walletBalance: finalNewSolde,
            balance: finalNewSolde,
            wallet: { ...(userData.wallet || {}), soldeDisponible: finalNewSolde, soldeBloque: newBloque },
            updatedAt: nowIso
          });

          // Record Publication Transaction
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
            publicationId: "",
            gomboId: "",
            montantGombo: cachetVal,
            gomboAmount: cachetVal,
            frais: freshFinancials.fee,
            fee: freshFinancials.fee,
            totalDebite: totalToDebit,
            amount: totalToDebit,
            montant: totalToDebit,
            soldeAvant: liveSolde,
            balanceBefore: liveSolde,
            soldeApres: finalNewSolde,
            balanceAfter: finalNewSolde,
            status: "success",
            statut: "success",
            description: `Publication Gombo : "${title.trim()}"`,
            createdAt: nowIso,
            timestamp: currentTimestamp
          };

          transaction.set(doc(db, "transactions", txDebitId), pubTxData);
          transaction.set(doc(db, "walletTransactions", txDebitId), pubTxData);
        } else {
          finalNewSolde = liveSolde;
        }

        // Create Gombo Doc Ref
        const postRef = doc(collection(db, "gombos"));
        publishedPostId = postRef.id;
        const gomboRefVal = getGomboRef(postRef.id);

        const gomboPayload = {
          id: postRef.id,
          gomboId: postRef.id,
          postId: postRef.id,
          gomboRef: gomboRefVal,
          reference: gomboRefVal,

          // User / Owner Aliases
          userId: currentUserProfile.uid,
          createdBy: currentUserProfile.uid,
          clientId: currentUserProfile.uid,
          organizerId: currentUserProfile.uid,
          authorId: currentUserProfile.uid,
          uid: currentUserProfile.uid,

          // Author Info
          authorName,
          clientName: authorName,
          organizerName: authorName,
          authorArtisticName: authorName,
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
          gomboCategory,

          // Location
          location: hasLoc ? {
            name: effectiveLocationName || "Emplacement Gombo",
            latitude: latitude || null,
            longitude: longitude || null
          } : null,
          locationName: hasLoc ? effectiveLocationName : "",
          locationCoordinates: (hasLoc && typeof latitude === "number" && typeof longitude === "number") ? {
            latitude,
            longitude
          } : null,
          commune: hasLoc ? (locationOption === "commune" ? (commune === "Autre" ? customCommune : commune) : "") : "",
          quartier: quartier ? quartier.trim() : "",
          locationDetail: locationDetail.trim(),
          date: date,
          city: currentUserProfile.city || "Abidjan",
          country: currentUserProfile.country || "Côte d'Ivoire",
          latitude: (hasLoc && typeof latitude === "number") ? latitude : null,
          longitude: (hasLoc && typeof longitude === "number") ? longitude : null,
          searchRadius: searchRadius,
          locationPrivacy: locationPrivacy,

          // Financials & Payment
          budget: cachetVal,
          cachet: cachetVal,
          fee: isSecurise ? financials.fee : 0,
          frais: isSecurise ? financials.fee : 0,
          paymentStatus: isSecurise ? "paid_escrow" : "unpaid_direct",
          paymentMethod: isSecurise ? "wallet_escrow" : "direct_scene",

          // Status & Visibility
          status: "active",
          statut: "active",
          visible: true,
          adminValidated: true,
          isPublished: true,
          isPaid: isSecurise,

          // Media
          imageUrl: uploadedImageUrl,
          mediaUrl: uploadedImageUrl,
          audioUrl: uploadedAudioUrl,

          // Real Timestamps & Expiration
          createdAt: nowIso,
          timestamp: currentTimestamp,
          publishedAt: nowIso,
          expiresAt: new Date(date + "T23:59:59.999Z").toISOString(),
          expiresAtTimestamp: new Date(date + "T23:59:59.999Z").getTime(),

          // Statistics initialized to 0
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          applicantsCount: 0,
          likedBy: [],
          savedBy: []
        };

        // Write to primary collections
        transaction.set(postRef, gomboPayload);
        transaction.set(doc(db, "social_posts", postRef.id), gomboPayload);
        transaction.set(doc(db, "posts", postRef.id), gomboPayload);
      });

      // Clear local draft upon success
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (_) {}

      // Dispatch UI events
      window.dispatchEvent(new CustomEvent("wallet_balance_updated", { detail: { newBalance: finalNewSolde } }));
      window.dispatchEvent(new CustomEvent("gombo_published", { detail: { gomboId: publishedPostId } }));

      setDepositDetails(prev => ({ ...prev, refId: publishedPostId, userSolde: finalNewSolde }));
      setPublishOutcome("success_published");
      setShowSuccessOverlay(true);
    } catch (err: any) {
      console.error("❌ Erreur lors de la publication du Gombo :", err);
      if (err.message === "INSUFFICIENT_FUNDS") {
        setPublishOutcome("insufficient_funds");
        setShowSuccessOverlay(true);
      } else {
        setErrorMsg(err.message || "Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-2 sm:py-4 px-2 select-none">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0D0D0E] text-afri-text rounded-3xl p-5 sm:p-7 border border-[#D4AF37]/35 shadow-[0_0_35px_rgba(212,175,55,0.12)] relative overflow-hidden"
      >
        {/* Top Gold Bar Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D4AF37] via-amber-400 to-[#D4AF37]" />

        {/* Header Title & Close */}
        <div className="flex items-center justify-between pb-4 border-b border-afri-border/60">
          <div className="space-y-0.5 text-left">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
              <h2 className="text-lg sm:text-xl font-display font-black text-afri-text uppercase tracking-tight">
                Publier un Gombo
              </h2>
            </div>
            <p className="text-[11px] text-afri-text-sec font-sans">
              Opportunité musicale, contrat direct ou renfort live
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-afri-border flex items-center justify-center text-afri-text-sec hover:text-white transition cursor-pointer"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Draft Restored Banner */}
        {hasRestoredDraft && (
          <div className="mt-3 p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#D4AF37] font-bold">
              <FileText className="w-4 h-4 shrink-0" />
              <span>Brouillon précédent restauré</span>
            </div>
            <button
              type="button"
              onClick={clearDraft}
              className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
        )}

        {/* Draft Saved Toast */}
        <AnimatePresence>
          {draftSavedToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center gap-2 text-emerald-400 font-bold text-xs shadow-md"
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>💾 Brouillon enregistré avec succès dans votre espace !</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5 text-left">
          {/* 1. TYPE DE PUBLICATION */}
          <div>
            <label className="block text-[10px] font-black text-[#D4AF37] mb-2 uppercase tracking-widest">
              1. Type de publication
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PUBLICATION_TYPES.map((t) => {
                const isSelected = selectedType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedType(t.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[64px] ${
                      isSelected
                        ? "bg-[#D4AF37]/15 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)] text-white"
                        : "bg-white/[0.02] border-afri-border/70 hover:border-white/20 text-afri-text-sec"
                    }`}
                  >
                    <span className="text-xs font-black truncate block">{t.label}</span>
                    <span className="text-[9px] text-afri-text-sec/80 line-clamp-1 mt-1 leading-tight">{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. MODE GOMBO : LIBRE vs SÉCURISÉ */}
          <div>
            <label className="block text-[10px] font-black text-[#D4AF37] mb-2 uppercase tracking-widest">
              2. Modalité de contrat
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGomboCategory("libre")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  gomboCategory === "libre"
                    ? "bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                    : "bg-white/[0.02] border-afri-border/70 text-afri-text-sec hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🚀</span>
                  <span className="text-xs font-black uppercase">Gombo Direct</span>
                </div>
                <p className="text-[9.5px] text-afri-text-sec mt-1 leading-tight">
                  Publication libre et immédiate. Paiement en direct sur scène.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setGomboCategory("securise")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  gomboCategory === "securise"
                    ? "bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                    : "bg-white/[0.02] border-afri-border/70 text-afri-text-sec hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs font-black uppercase text-[#D4AF37]">Gombo Sécurisé</span>
                </div>
                <p className="text-[9.5px] text-afri-text-sec mt-1 leading-tight">
                  Cachet bloqué en coffre escrow souverain. Protection 100%.
                </p>
              </button>
            </div>
          </div>

          {/* 3. TITRE & DESCRIPTION */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">
                  3. Titre de l'annonce *
                </label>
                <span className="text-[9px] font-mono text-afri-text-sec">{title.length}/100</span>
              </div>
              <input
                type="text"
                required
                maxLength={100}
                placeholder="Ex: Recherche Pianiste Live Cabaret à Marcory"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-2xl text-xs font-bold text-afri-text placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">
                  4. Description détaillée *
                </label>
                <span className="text-[9px] font-mono text-afri-text-sec">{description.length}/1000</span>
              </div>
              <textarea
                required
                maxLength={1000}
                rows={3}
                placeholder="Précisez le répertoire, l'horaire de balance, la tenue exigée et les conditions du live..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-2xl text-xs text-afri-text placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] resize-none"
              />
            </div>
          </div>

          {/* 4. LOCALISATION (OPTIONNELLE, MOBILE-FIRST ANDROID) */}
          <div className="p-4 bg-white/[0.02] border border-afri-border/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-xs font-black text-[#D4AF37] uppercase tracking-wider">
                  5. Lieu du Gombo
                </span>
              </div>
              <span className="text-[9px] font-mono text-afri-text-sec bg-white/5 px-2 py-0.5 rounded-full">
                Facultatif
              </span>
            </div>

            {locationOption === "none" ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-black/40 border border-dashed border-white/10 rounded-xl">
                <div className="text-[11px] text-afri-text-sec">
                  <span>Aucun lieu spécifié</span>
                  <span className="block text-[9px] text-gray-500">Vous pouvez publier librement sans localisation</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLocationSheetOpen(true)}
                  className="px-4 py-2 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/40 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter un lieu</span>
                </button>
              </div>
            ) : (
              <div className="p-3 bg-black/40 border border-[#D4AF37]/30 rounded-xl space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 text-left">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="text-[#D4AF37]">📍</span>
                      <span>
                        {locationOption === "commune" ? (commune === "Autre" ? (customCommune || "Autre ville") : commune) : 
                         locationOption === "autre" ? (customPlaceInput || "Lieu personnalisé") :
                         "Position GPS"}
                        {quartier ? `, ${quartier}` : ""}
                      </span>
                    </div>
                    {customPlaceInput && locationOption === "commune" && (
                      <p className="text-[10px] text-afri-text-sec pl-4">{customPlaceInput}</p>
                    )}
                    {latitude && longitude && (
                      <p className="text-[9px] font-mono text-emerald-400 pl-4">
                        GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsLocationSheetOpen(true)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-[#D4AF37] rounded-lg text-[10px] font-bold uppercase transition cursor-pointer"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLocationOption("none");
                        setLatitude(null);
                        setLongitude(null);
                        setCustomPlaceInput("");
                        setQuartier("");
                      }}
                      className="p-1 text-red-400 hover:text-red-300 rounded-lg text-[10px] transition cursor-pointer"
                      title="Retirer la localisation"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. DATE DE L'ÉVÉNEMENT */}
          <div>
            <label className="block text-[10px] font-black text-[#D4AF37] mb-1.5 uppercase tracking-widest">
              6. Date de l'événement *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-afri-text-sec">
                <Calendar className="w-4 h-4 text-[#D4AF37]" />
              </span>
              <input
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-2xl text-xs font-bold text-afri-text focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>
          </div>

          {/* 6. CACHET OPTIONNEL & RÉCAPITULATIF */}
          <div>
            <label className="block text-[10px] font-black text-[#D4AF37] mb-1.5 uppercase tracking-widest">
              7. Cachet / Rémunération (Optionnel, en FCFA)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-emerald-500 font-extrabold text-xs">
                FCFA
              </span>
              <input
                type="number"
                placeholder="Ex: 50000 (Laisser vide pour discuter)"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full pl-14 pr-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-2xl text-xs font-bold text-afri-text focus:outline-none focus:ring-1 focus:ring-[#D4AF37] placeholder:text-gray-600"
              />
            </div>

            {/* Financial Summary */}
            {cachetVal > 0 && (
              <div className="mt-3 p-4 bg-afri-bg-sec/90 border border-[#D4AF37]/30 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between font-black text-[#D4AF37] uppercase">
                  <span>📄 Récapitulatif Financier</span>
                  <span className="text-[9.5px] bg-[#D4AF37]/15 px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
                    {isUserPremium ? "Taux VIP (1,5%)" : "Taux Standard (2,5%)"}
                  </span>
                </div>
                <div className="space-y-1 text-afri-text-sec">
                  <div className="flex justify-between">
                    <span>Cachet convenu :</span>
                    <span className="font-mono font-bold text-white">{financials.cachet.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission plateforme ({isUserPremium ? "1,5%" : "2,5%"}):</span>
                    <span className="font-mono font-bold text-[#D4AF37]">{financials.fee.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 7. MÉDIAS (PHOTO / AUDIO) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div 
              className="p-4 border border-dashed border-white/10 hover:border-[#D4AF37]/40 bg-white/[0.01] rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer min-h-[95px] transition relative"
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
                <div className="space-y-1 text-center">
                  <span className="text-xs font-bold text-[#D4AF37] truncate block max-w-[150px]">🖼️ {imageFile.name}</span>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); clearFile("image"); }} 
                    className="text-[10px] uppercase font-bold text-red-400 inline-flex items-center gap-0.5 bg-red-950/30 px-2 py-0.5 rounded"
                  >
                    <X className="w-3 h-3" /> Retirer
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <ImageIcon className="w-5 h-5 text-afri-text-sec mx-auto" />
                  <span className="text-[10px] font-black text-afri-text block">Photo d'illustration</span>
                  <span className="text-[8px] text-afri-text-sec block">(Optionnel)</span>
                </div>
              )}
            </div>

            <div 
              className="p-4 border border-dashed border-white/10 hover:border-[#D4AF37]/40 bg-white/[0.01] rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer min-h-[95px] transition relative"
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
                <div className="space-y-1 text-center">
                  <span className="text-xs font-bold text-emerald-400 truncate block max-w-[150px]">🎵 {audioFile.name}</span>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); clearFile("audio"); }} 
                    className="text-[10px] uppercase font-bold text-red-400 inline-flex items-center gap-0.5 bg-red-950/30 px-2 py-0.5 rounded"
                  >
                    <X className="w-3 h-3" /> Retirer
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Music className="w-5 h-5 text-[#D4AF37] mx-auto animate-pulse" />
                  <span className="text-[10px] font-black text-afri-text block">Extrait audio (30s)</span>
                  <span className="text-[8px] text-afri-text-sec block">(Optionnel)</span>
                </div>
              )}
            </div>
          </div>

          {/* Inline Error Message */}
          {errorMsg && (
            <div className="p-3.5 bg-red-950/40 text-red-400 font-bold text-xs rounded-2xl border border-red-800/80 flex items-center gap-2 animate-bounce">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ACTION BUTTONS (ANDROID-FIRST DUAL ACTIONS: BROUILLON + PUBLIER) */}
          <div className="pt-4 border-t border-afri-border/60 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={loading || savingDraft}
              className="w-full sm:w-1/3 py-3.5 px-4 bg-white/[0.04] hover:bg-white/[0.08] border border-afri-border text-afri-text font-black text-xs uppercase rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 min-h-[46px]"
            >
              {savingDraft ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileText className="w-4 h-4 text-afri-text-sec" />
              )}
              <span>{savingDraft ? "Enregistrement..." : "Brouillon"}</span>
            </button>

            <button
              type="submit"
              disabled={loading || isSubmitting || uploadingState.image || uploadingState.audio}
              className="w-full sm:w-2/3 py-3.5 px-6 bg-gradient-to-r from-[#D4AF37] via-amber-400 to-[#D4AF37] hover:opacity-95 text-black font-display font-black text-xs uppercase rounded-2xl transition-all shadow-[0_0_20px_rgba(212,175,55,0.35)] cursor-pointer flex items-center justify-center gap-2 active:scale-95 min-h-[46px]"
            >
              {loading || isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>PUBLICATION EN COURS...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>PUBLIER LE GOMBO</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* LOCATION SELECTION BOTTOM SHEET (ANDROID-FIRST) */}
      <AndroidBottomSheet
        isOpen={isLocationSheetOpen}
        onClose={() => setIsLocationSheetOpen(false)}
        title="📍 Lieu du Gombo"
      >
        <div className="space-y-4 py-1 text-left">
          <p className="text-xs text-afri-text-sec">
            Choisissez l'emplacement de l'événement. La localisation est <strong className="text-white">facultative</strong>.
          </p>

          {/* 3 Main Choice Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/50 border border-afri-border rounded-xl">
            <button
              type="button"
              onClick={() => {
                setLocationOption("commune");
              }}
              className={`py-2 px-1 text-center rounded-lg text-[10.5px] font-bold uppercase transition cursor-pointer ${
                locationOption === "commune"
                  ? "bg-[#D4AF37] text-black shadow"
                  : "text-afri-text-sec hover:text-white"
              }`}
            >
              ✏️ Commune
            </button>
            <button
              type="button"
              onClick={() => {
                setLocationOption("gps");
                if (!latitude || !longitude) {
                  handleUseCurrentGps();
                }
              }}
              className={`py-2 px-1 text-center rounded-lg text-[10.5px] font-bold uppercase transition cursor-pointer ${
                locationOption === "gps"
                  ? "bg-[#D4AF37] text-black shadow"
                  : "text-afri-text-sec hover:text-white"
              }`}
            >
              📍 Mon GPS
            </button>
            <button
              type="button"
              onClick={() => {
                setLocationOption("gps");
                setIsMapPickerOpen(true);
              }}
              className={`py-2 px-1 text-center rounded-lg text-[10.5px] font-bold uppercase transition cursor-pointer ${
                locationOption === "gps" && isMapPickerOpen
                  ? "bg-[#D4AF37] text-black shadow"
                  : "text-afri-text-sec hover:text-white"
              }`}
            >
              🗺️ Sur carte
            </button>
          </div>

          {/* Form Fields according to selected tab */}
          {locationOption === "commune" && (
            <div className="space-y-3 p-3.5 bg-black/40 border border-afri-border rounded-2xl">
              <div>
                <label className="block text-[10px] font-black text-afri-text-sec uppercase mb-1">
                  Commune / Ville :
                </label>
                <select
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0a0a0c] border border-afri-border rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                >
                  {CI_COMMUNES.map((c) => (
                    <option key={c} value={c} className="bg-zinc-900 text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {commune === "Autre" && (
                <div>
                  <label className="block text-[10px] font-black text-afri-text-sec uppercase mb-1">
                    Nom de votre ville :
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Daloa, Korhogo, San-Pédro..."
                    value={customCommune}
                    onChange={(e) => setCustomCommune(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0a0a0c] border border-afri-border rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-afri-text-sec uppercase mb-1">
                  Quartier / Repère (Optionnel) :
                </label>
                <input
                  type="text"
                  placeholder="Ex: Angré 8e Tranche, Selmer, Zone 4..."
                  value={quartier}
                  onChange={(e) => setQuartier(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0a0a0c] border border-afri-border rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-afri-text-sec uppercase mb-1">
                  Nom du lieu / Salle / Maquis :
                </label>
                <input
                  type="text"
                  placeholder="Ex: Palais de la Culture, Espace Crystal..."
                  value={customPlaceInput}
                  onChange={(e) => setCustomPlaceInput(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0a0a0c] border border-afri-border rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              {/* Proposal to AFRIGOMBO */}
              {customPlaceInput.trim().length > 2 && (
                <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl space-y-1.5">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={proposePlaceToCommunity}
                      onChange={(e) => setProposePlaceToCommunity(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-afri-border accent-[#D4AF37]"
                    />
                    <div className="text-left">
                      <span className="text-[11px] font-bold text-white block">
                        Proposer ce lieu à AFRIGOMBO
                      </span>
                      <span className="text-[9.5px] text-afri-text-sec block leading-relaxed">
                        Votre lieu pourra être vérifié par l'administration et ajouté aux lieux officiels.
                      </span>
                    </div>
                  </label>
                </div>
              )}
            </div>
          )}

          {locationOption === "gps" && (
            <div className="space-y-3 p-3.5 bg-black/40 border border-afri-border rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-afri-text-sec">Position actuelle :</span>
                <button
                  type="button"
                  onClick={handleUseCurrentGps}
                  disabled={gpsLoading}
                  className="px-3 py-1.5 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/40 rounded-xl font-bold text-[10.5px] uppercase flex items-center gap-1.5 transition cursor-pointer"
                >
                  {gpsLoading ? (
                    <div className="w-3 h-3 border border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Navigation className="w-3.5 h-3.5" />
                  )}
                  <span>{gpsLoading ? "Détection..." : "Activer mon GPS"}</span>
                </button>
              </div>

              {gpsNotice && (
                <p className="text-[10px] text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                  {gpsNotice}
                </p>
              )}

              {latitude && longitude ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                    <span>📍 Lat: {latitude.toFixed(4)} | Lng: {longitude.toFixed(4)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMapPickerOpen(true)}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-[#D4AF37] border border-white/10 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Map className="w-3.5 h-3.5" />
                    <span>Ajuster précisément sur la carte</span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-3 text-afri-text-sec text-xs">
                  Touchez "Activer mon GPS" ou "Sur carte" pour définir vos coordonnées.
                </div>
              )}
            </div>
          )}

          {/* Privacy Choice */}
          {locationOption !== "none" && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocationPrivacy("exact")}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  locationPrivacy === "exact"
                    ? "bg-[#D4AF37]/15 border-[#D4AF37] text-white"
                    : "bg-black/30 border-afri-border text-afri-text-sec"
                }`}
              >
                <div className="text-[10px] font-black uppercase">✓ Position exacte</div>
                <div className="text-[8.5px] text-afri-text-sec">Visible sur la carte</div>
              </button>
              <button
                type="button"
                onClick={() => setLocationPrivacy("approximate")}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  locationPrivacy === "approximate"
                    ? "bg-[#D4AF37]/15 border-[#D4AF37] text-white"
                    : "bg-black/30 border-afri-border text-afri-text-sec"
                }`}
              >
                <div className="text-[10px] font-black uppercase">🔒 Approximatif</div>
                <div className="text-[8.5px] text-afri-text-sec">Quartier uniquement</div>
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setLocationOption("none");
                setLatitude(null);
                setLongitude(null);
                setCustomPlaceInput("");
                setQuartier("");
                setIsLocationSheetOpen(false);
              }}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-red-400 font-bold text-xs uppercase rounded-xl border border-white/10 transition cursor-pointer"
            >
              🚫 Aucun lieu
            </button>
            <button
              type="button"
              onClick={() => {
                if (locationOption === "none") setLocationOption("commune");
                setIsLocationSheetOpen(false);
              }}
              className="flex-1 py-3 bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black font-black text-xs uppercase rounded-xl shadow transition cursor-pointer active:scale-95"
            >
              ✓ Appliquer
            </button>
          </div>
        </div>
      </AndroidBottomSheet>

      {/* CONFIRMATION BOTTOM SHEET */}
      <AndroidBottomSheet
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirmation de Publication"
      >
        <div className="space-y-4 py-2 text-left">
          <div className="p-4 bg-afri-bg rounded-2xl border border-afri-border space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-afri-text-sec">Type d'annonce :</span>
              <span className="font-bold text-white uppercase">{depositDetails.typeName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-afri-text-sec">Titre :</span>
              <span className="font-bold text-white truncate max-w-[200px]">{depositDetails.title}</span>
            </div>
            {cachetVal > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-afri-text-sec">Cachet :</span>
                <span className="font-mono font-bold text-emerald-400">{cachetVal.toLocaleString('fr-FR')} FCFA</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-afri-border">
              <span className="text-afri-text-sec">Mode :</span>
              <span className="font-bold text-[#D4AF37] uppercase">
                {gomboCategory === "securise" ? "🛡️ Gombo Sécurisé" : "🚀 Gombo Direct"}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 py-3.5 bg-afri-bg hover:bg-afri-bg/80 text-afri-text font-black text-xs uppercase rounded-2xl border border-afri-border cursor-pointer active:scale-95"
            >
              Modifier
            </button>
            <button
              type="button"
              disabled={loading || isSubmitting}
              onClick={executePublish}
              className="flex-1 py-3.5 bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:opacity-90 text-black font-display font-black text-xs uppercase rounded-2xl transition shadow-lg cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : "CONFIRMER & PUBLIER"}
            </button>
          </div>
        </div>
      </AndroidBottomSheet>

      {/* SUCCESS OVERLAY */}
      <AnimatePresence>
        {showSuccessOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              className="bg-[#0F0F12] border border-[#D4AF37]/40 rounded-3xl w-full max-w-md p-6 sm:p-8 relative shadow-2xl space-y-5 text-center"
            >
              {publishOutcome === "insufficient_funds" ? (
                <>
                  <div className="w-16 h-16 mx-auto bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-white uppercase">Solde insuffisant</h3>
                    <p className="text-xs text-afri-text-sec">
                      Votre solde actuel ne permet pas de bloquer le cachet en sécurité. Vous pouvez publier en Gombo Direct ou recharger votre Wallet.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuccessOverlay(false);
                      setGomboCategory("libre");
                    }}
                    className="w-full py-3.5 bg-[#D4AF37] text-black font-black text-xs uppercase rounded-2xl cursor-pointer"
                  >
                    Publier en Gombo Direct
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 shadow-lg animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                      ✅ PUBLIÉ EN DIRECT
                    </span>
                    <h3 className="text-lg font-black text-white uppercase pt-1">
                      Gombo publié avec succès !
                    </h3>
                    <p className="text-xs text-afri-text-sec max-w-xs mx-auto">
                      Votre annonce est maintenant visible par toute la communauté musicale sur Le Terrain.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuccessOverlay(false);
                      onSuccess();
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black font-display font-black text-xs uppercase rounded-2xl shadow-lg cursor-pointer"
                  >
                    Voir sur Le Terrain
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MapPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        initialLat={latitude || 5.3600}
        initialLng={longitude || -4.0083}
        title={`Emplacement du Gombo : ${title || commune}`}
        onConfirm={(coords) => {
          setLatitude(coords.latitude);
          setLongitude(coords.longitude);
          setGpsNotice(`📍 Emplacement GPS défini (Lat ${coords.latitude.toFixed(4)}, Lng ${coords.longitude.toFixed(4)})`);
        }}
      />
    </div>
  );
}
