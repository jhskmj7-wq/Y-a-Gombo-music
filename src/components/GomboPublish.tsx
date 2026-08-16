import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, MapPin, AlignLeft, Check, 
  Music, Sparkles, Image as ImageIcon, Briefcase, 
  X, AlertCircle, Award, Star, Radio, Lock, ShieldCheck, Zap,
  Wallet, ArrowUpRight, CheckCircle2, Navigation, Map, Building2, Plus,
  FileText, Compass, Trash2, CheckCircle, Clock, Hash, Layers, Mic
} from "lucide-react";
import MapPickerModal from "./common/MapPickerModal";
import { gomboDB } from "../firebase";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, addDoc, collection, runTransaction } from "firebase/firestore";
import { UserProfile, SocialPost } from "../types";
import { 
  MIN_GOMBO_AMOUNT, 
  calculateGomboFees, 
  calculatePublicationFinancials, 
  getEffectiveCommissionRate, 
  getCanonicalWalletBalance,
  resolveUserStatusAndRate 
} from "../lib/financial";
import { PremiumEngine } from "../lib/premiumEngine";
import { subscribeToFeatureFlags, getModuleVisibility } from "../lib/featureFlags";
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

const SPECIALTIES_LIST = [
  "Piano / Clavier",
  "Batterie",
  "Guitare Solo",
  "Guitare Rythmique",
  "Basse",
  "Chant / Lead Vocal",
  "Chœur",
  "Saxophone",
  "Trompette / Cuivres",
  "Percussions / Djembé",
  "DJ / Beatmaker",
  "Ingénieur Son / Régisseur",
  "Tous instruments"
];

const POPULAR_HASHTAGS = [
  "#GomboLive",
  "#AbidjanMusic",
  "#PianoBar",
  "#ConcertLive",
  "#CastingMusic",
  "#RenfortExpress",
  "#GomboSecurise",
  "#LiveCabaret"
];

const MUSIC_STYLES = [
  "Afrobeats",
  "Coupé Décalé",
  "Zouglou",
  "Jazz / Blues",
  "Gospel",
  "Reggae",
  "Variété Internationale",
  "Salsa / Latino",
  "Traditionnel"
];

const DRAFT_STORAGE_KEY = "gombo_publish_draft_v2";

const getGomboRef = (id: string) => `GOMBO-${id.slice(0, 6).toUpperCase()}`;

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

  const [flagsMap, setFlagsMap] = useState<any>({});
  useEffect(() => {
    const unsub = subscribeToFeatureFlags((map) => setFlagsMap(map));
    return () => unsub();
  }, []);

  const userEmail = currentUserProfile?.email || "";
  const isFounder = userEmail.toLowerCase() === "jhs.kmj7@gmail.com";
  const geoVis = getModuleVisibility("nearby", currentUserProfile, currentUserProfile, flagsMap);

  // Form core fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [specialty, setSpecialty] = useState("Piano / Clavier");
  const [customSpecialty, setCustomSpecialty] = useState("");
  const [hashtags, setHashtags] = useState<string[]>(["#GomboLive"]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [musicStyle, setMusicStyle] = useState("Afrobeats");
  const [experienceLevel, setExperienceLevel] = useState("Tous niveaux");

  // Date & Time
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [time, setTime] = useState("18:30");
  const [duration, setDuration] = useState("hours");
  const [customDurationDays, setCustomDurationDays] = useState("1");

  // Remuneration / Budget
  const [budget, setBudget] = useState("25000");

  // Location fields
  const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);
  const [locationOption, setLocationOption] = useState<"none" | "gps" | "commune" | "autre" | "map" | "manual">("none");
  const [commune, setCommune] = useState("Cocody");
  const [customCommune, setCustomCommune] = useState("");
  const [quartier, setQuartier] = useState("");
  const [customPlaceInput, setCustomPlaceInput] = useState<string>("");
  const [itineraryNotes, setItineraryNotes] = useState("");
  const [proposePlaceToCommunity, setProposePlaceToCommunity] = useState(false);
  const [locationDetail, setLocationDetail] = useState("");
  const [latitude, setLatitude] = useState<number | null>(currentUserProfile?.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(currentUserProfile?.longitude || null);
  const [searchRadius, setSearchRadius] = useState<number>(10);
  const [locationPrivacy, setLocationPrivacy] = useState<"exact" | "approximate">("exact");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);

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
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
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
    ratePercent: number;
    netAmount: number;
    statusName: string;
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
    rate: 0.015, 
    ratePercent: 1.5,
    netAmount: 0,
    statusName: "USER",
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

  // Live financial calculation using the single central calculation engine
  const userRateInfo = resolveUserStatusAndRate(currentUserProfile);
  const cachetVal = budget ? Number(budget) : 0;
  const feeEngineResult = calculateGomboFees({
    amount: cachetVal,
    userProfile: currentUserProfile
  });
  const financials = calculatePublicationFinancials(cachetVal, currentUserProfile);

  // 1. AUTO-RESTORE DRAFT ON MOUNT
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY) || localStorage.getItem("gombo_publish_draft");
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.title || parsed.description || parsed.budget) {
          if (parsed.title) setTitle(parsed.title);
          if (parsed.description) setDescription(parsed.description);
          if (parsed.selectedType) setSelectedType(parsed.selectedType);
          if (parsed.specialty) setSpecialty(parsed.specialty);
          if (parsed.customSpecialty) setCustomSpecialty(parsed.customSpecialty);
          if (Array.isArray(parsed.hashtags)) setHashtags(parsed.hashtags);
          if (parsed.musicStyle) setMusicStyle(parsed.musicStyle);
          if (parsed.experienceLevel) setExperienceLevel(parsed.experienceLevel);
          if (parsed.gomboCategory) setGomboCategory(parsed.gomboCategory);
          if (parsed.locationOption) setLocationOption(parsed.locationOption);
          if (parsed.commune) setCommune(parsed.commune);
          if (parsed.customCommune) setCustomCommune(parsed.customCommune);
          if (parsed.quartier) setQuartier(parsed.quartier);
          if (parsed.customPlaceInput) setCustomPlaceInput(parsed.customPlaceInput);
          if (parsed.itineraryNotes) setItineraryNotes(parsed.itineraryNotes);
          if (parsed.locationDetail) setLocationDetail(parsed.locationDetail);
          if (parsed.date) setDate(parsed.date);
          if (parsed.time) setTime(parsed.time);
          if (parsed.budget) setBudget(parsed.budget);
          if (typeof parsed.latitude === "number") setLatitude(parsed.latitude);
          if (typeof parsed.longitude === "number") setLongitude(parsed.longitude);
          if (parsed.duration) setDuration(parsed.duration);
          if (parsed.customDurationDays) setCustomDurationDays(parsed.customDurationDays);
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
      localStorage.removeItem("gombo_publish_draft");
    } catch (_) {}
    setTitle("");
    setDescription("");
    setSelectedType("opportunite");
    setSpecialty("Piano / Clavier");
    setCustomSpecialty("");
    setHashtags(["#GomboLive"]);
    setMusicStyle("Afrobeats");
    setExperienceLevel("Tous niveaux");
    setGomboCategory("libre");
    setLocationOption("none");
    setCommune("Cocody");
    setCustomCommune("");
    setQuartier("");
    setCustomPlaceInput("");
    setItineraryNotes("");
    setLocationDetail("");
    setBudget("25000");
    setTime("18:30");
    setLatitude(null);
    setLongitude(null);
    setImageFile(null);
    setAudioFile(null);
    setDuration("hours");
    setCustomDurationDays("1");
    setFieldErrors({});
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
      specialty,
      customSpecialty,
      hashtags,
      musicStyle,
      experienceLevel,
      gomboCategory,
      locationOption,
      commune,
      customCommune,
      quartier,
      customPlaceInput,
      itineraryNotes,
      locationDetail,
      date,
      time,
      budget,
      latitude,
      longitude,
      duration,
      customDurationDays,
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
          specialty: specialty === "Autre" ? customSpecialty : specialty,
          hashtags,
          musicStyle,
          experienceLevel,
          budget: cachetVal,
          currency: "XOF",
          date,
          time,
          duration,
          commune: locationOption === "commune" ? (commune === "Autre" ? customCommune : commune) : "",
          quartier,
          customPlaceInput,
          itineraryNotes,
          isDraft: true,
          status: "draft",
          statut: "draft",
          visible: false,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }, { merge: true });
      }

      setDraftSavedToast(true);
      setTimeout(() => setDraftSavedToast(false), 4000);
    } catch (err) {
      console.error("Draft save error:", err);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleAddHashtag = (tag: string) => {
    let cleanTag = tag.trim();
    if (!cleanTag) return;
    if (!cleanTag.startsWith("#")) cleanTag = `#${cleanTag}`;
    if (!hashtags.includes(cleanTag) && hashtags.length < 8) {
      setHashtags([...hashtags, cleanTag]);
    }
    setHashtagInput("");
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter(t => t !== tagToRemove));
  };

  const handleUseCurrentGps = () => {
    if (navigator.geolocation) {
      setGpsLoading(true);
      setGpsNotice(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLoading(false);
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setGpsNotice("📍 Position GPS capturée avec succès !");
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
    const newErrors: {[key: string]: string} = {};
    if (!title.trim()) {
      newErrors.title = "Veuillez renseigner le titre de votre Gombo !";
    }

    if (!description.trim()) {
      newErrors.description = "Veuillez renseigner la description détaillée !";
    }

    // 2. RÈGLE ABSOLUE — MONTANT MINIMUM 15 000 FCFA
    if (!budget || cachetVal < MIN_GOMBO_AMOUNT) {
      newErrors.budget = "Le cachet minimum pour publier un Gombo est de 15 000 FCFA.";
    }

    // 3. VALIDATION DATE (≥ AUJOURD'HUI)
    const todayStr = new Date().toISOString().split("T")[0];
    const selectedDateStr = (typeof date === "string" && date) ? date.split("T")[0] : todayStr;
    if (selectedDateStr < todayStr) {
      newErrors.date = "La date du Gombo doit être fixée à aujourd'hui ou dans le futur.";
    }

    // 4. VALIDATION HORAIRE
    if (!time.trim()) {
      newErrors.time = "Veuillez préciser l'horaire de début du Gombo.";
    }

    // 5. VALIDATION LOCALISATION SI CHOISIE
    if (locationOption === "autre" && !customPlaceInput.trim()) {
      newErrors.location = "Veuillez préciser le nom du lieu ou désactiver l'option lieu.";
    }
    if (locationOption === "commune" && commune === "Autre" && !customCommune.trim()) {
      newErrors.location = "Veuillez préciser votre commune ou ville.";
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setErrorMsg(newErrors.budget || "Veuillez corriger les erreurs de saisie ci-dessous.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setFieldErrors({});
    setErrorMsg("");

    try {
      const userRef = doc(db, "users", currentUserProfile.uid);
      const userSnap = await getDoc(userRef);
      const freshUserData = userSnap.exists() ? userSnap.data() : currentUserProfile;
      const userSolde = getCanonicalWalletBalance(freshUserData) ?? 0;
      
      const calculatedFinancials = calculatePublicationFinancials(cachetVal, freshUserData);

      // In Gombo Libre, escrow sequestre is optional or paid on site by the client
      const isSecurise = gomboCategory === "securise";
      const totalToDebit = isSecurise ? calculatedFinancials.total : 0;

      setDepositDetails({
        cachet: cachetVal,
        fee: calculatedFinancials.fee,
        sequestre: isSecurise ? calculatedFinancials.sequestre : 0,
        total: totalToDebit,
        rate: calculatedFinancials.rate,
        ratePercent: calculatedFinancials.ratePercent,
        netAmount: calculatedFinancials.netAmount,
        statusName: calculatedFinancials.statusName,
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
      setShowConfirmModal(true);
    }
  };

  const executePublish = async () => {
    if (loading || isSubmitting) return;

    // Strict Backend-grade validation before execution
    if (cachetVal < MIN_GOMBO_AMOUNT) {
      setErrorMsg("Le cachet minimum pour publier un Gombo est de 15 000 FCFA.");
      setShowConfirmModal(false);
      return;
    }

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
        locationOption === "manual" ? `${customPlaceInput.trim()} (${commune || ""})` :
        locationOption === "autre" ? customPlaceInput.trim() :
        locationOption === "gps" ? "Position GPS détectée" :
        locationOption === "map" ? "Position Carte" :
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

        // Verify minimum cachet rule again inside transaction
        if (cachetVal < MIN_GOMBO_AMOUNT) {
          throw new Error("Le cachet minimum pour publier un Gombo est de 15 000 FCFA.");
        }

        const liveSolde = getCanonicalWalletBalance(userData) ?? 0;
        const liveBloque = userData?.wallet?.soldeBloque ?? 0;
        const freshFinancials = calculatePublicationFinancials(cachetVal, userData);

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

        const finalSpecialty = specialty === "Autre" ? (customSpecialty.trim() || "Musique") : specialty;

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

          // Content & Enrichments
          title: title.trim(),
          description: description.trim(),
          content: description.trim(),
          caption: description.trim(),
          type: selectedType,
          category: selectedType,
          gomboCategory,
          specialty: finalSpecialty,
          specialties: [finalSpecialty],
          instrument: finalSpecialty,
          instruments: [finalSpecialty],
          hashtags: hashtags.length > 0 ? hashtags : ["#GomboLive"],
          tags: hashtags.length > 0 ? hashtags : ["#GomboLive"],
          musicStyle,
          experienceLevel,

          // Location & Itinerary
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
          itineraryNotes: itineraryNotes.trim(),
          date: date,
          time: time.trim() || "18:30",
          heure: time.trim() || "18:30",
          city: currentUserProfile.city || "Abidjan",
          country: currentUserProfile.country || "Côte d'Ivoire",
          latitude: (hasLoc && typeof latitude === "number") ? latitude : null,
          longitude: (hasLoc && typeof longitude === "number") ? longitude : null,
          searchRadius: searchRadius,
          locationPrivacy: locationPrivacy,

          // Financials & Payment
          budget: cachetVal,
          cachet: cachetVal,
          currency: "XOF",
          minGomboAmount: MIN_GOMBO_AMOUNT,
          fee: freshFinancials.fee,
          frais: freshFinancials.fee,
          netAmount: freshFinancials.netAmount,
          commissionRatePercent: freshFinancials.ratePercent,
          creatorStatus: freshFinancials.statusName,
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
          duration: duration === "custom" ? `${customDurationDays} jour(s)` : 
                    duration === "hours" ? "Quelques heures (Soirée)" : 
                    duration === "1_day" ? "1 jour" : 
                    duration === "2_days" ? "2 jours" : 
                    duration === "3_days" ? "3 jours" : "1 semaine",
          customDurationDays,
          expiresAt: (() => {
            let expDate = new Date(date + "T23:59:59.999Z");
            if (duration === "hours") {
              expDate = new Date(new Date(date + "T00:00:00.000Z").getTime() + 12 * 60 * 60 * 1000);
            } else if (duration === "1_day") {
              expDate = new Date(new Date(date + "T23:59:59.999Z").getTime() + 1 * 24 * 60 * 60 * 1000);
            } else if (duration === "2_days") {
              expDate = new Date(new Date(date + "T23:59:59.999Z").getTime() + 2 * 24 * 60 * 60 * 1000);
            } else if (duration === "3_days") {
              expDate = new Date(new Date(date + "T23:59:59.999Z").getTime() + 3 * 24 * 60 * 60 * 1000);
            } else if (duration === "1_week") {
              expDate = new Date(new Date(date + "T23:59:59.999Z").getTime() + 7 * 24 * 60 * 60 * 1000);
            } else if (duration === "custom") {
              const daysVal = Number(customDurationDays) || 1;
              expDate = new Date(new Date(date + "T23:59:59.999Z").getTime() + daysVal * 24 * 60 * 60 * 1000);
            }
            return expDate.toISOString();
          })(),
          expiresAtTimestamp: (() => {
            let expDate = new Date(date + "T23:59:59.999Z");
            if (duration === "hours") {
              expDate = new Date(new Date(date + "T00:00:00.000Z").getTime() + 12 * 60 * 60 * 1000);
            } else if (duration === "1_day") {
              expDate = new Date(new Date(date + "T23:59:59.999Z").getTime() + 1 * 24 * 60 * 60 * 1000);
            } else if (duration === "2_days") {
              expDate = new Date(new Date(date + "T23:59:59.999Z").getTime() + 2 * 24 * 60 * 60 * 1000);
            } else if (duration === "3_days") {
              expDate = new Date(new Date(date + "T23:59:59.999Z").getTime() + 3 * 24 * 60 * 60 * 1000);
            } else if (duration === "1_week") {
              expDate = new Date(new Date(date + "T23:59:59.999Z").getTime() + 7 * 24 * 60 * 60 * 1000);
            } else if (duration === "custom") {
              const daysVal = Number(customDurationDays) || 1;
              expDate = new Date(new Date(date + "T23:59:59.999Z").getTime() + daysVal * 24 * 60 * 60 * 1000);
            }
            return expDate.getTime();
          })(),

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
        localStorage.removeItem("gombo_publish_draft");
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

  const finalSpecialtyDisplay = specialty === "Autre" ? (customSpecialty || "Spécialité personnalisée") : specialty;

  return (
    <div className="max-w-xl mx-auto py-2 sm:py-4 px-2 select-none">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-afri-bg-sec text-afri-text rounded-3xl p-5 sm:p-7 border border-afri-border/90 shadow-[0_0_35px_rgba(212,175,55,0.12)] relative overflow-hidden"
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
              Opportunité musicale, contrat direct ou renfort live certifié
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-afri-bg hover:bg-afri-bg-ter border border-afri-border flex items-center justify-center text-afri-text-sec hover:text-afri-text transition cursor-pointer"
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
              1. Type de publication *
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
                        ? "bg-[#D4AF37]/15 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)] text-afri-text font-bold"
                        : "bg-afri-bg/60 border-afri-border/70 hover:border-[#D4AF37]/40 text-afri-text-sec hover:text-afri-text"
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
              2. Modalité de contrat *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGomboCategory("libre")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  gomboCategory === "libre"
                    ? "bg-[#D4AF37]/15 border-[#D4AF37] text-afri-text shadow-[0_0_15px_rgba(212,175,55,0.2)] font-bold"
                    : "bg-afri-bg/60 border-afri-border/70 text-afri-text-sec hover:border-[#D4AF37]/40"
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
                    ? "bg-[#D4AF37]/15 border-[#D4AF37] text-afri-text shadow-[0_0_15px_rgba(212,175,55,0.2)] font-bold"
                    : "bg-afri-bg/60 border-afri-border/70 text-afri-text-sec hover:border-[#D4AF37]/40"
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

          {/* 3. TITRE & INFORMATIONS */}
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
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (fieldErrors.title) {
                    setFieldErrors(prev => {
                      const copy = { ...prev };
                      delete copy.title;
                      return copy;
                    });
                  }
                }}
                className="w-full px-4 py-3 bg-afri-bg/80 border border-afri-border rounded-2xl text-xs font-bold text-afri-text placeholder:text-afri-text-muted focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
              />
              {fieldErrors.title && (
                <p className="text-red-500 text-[11px] font-bold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.title}</span>
                </p>
              )}
            </div>

            {/* SOUS-CATÉGORIE / SPÉCIALITÉ / INSTRUMENT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-[#D4AF37] mb-1.5 uppercase tracking-widest">
                  Spécialité / Instrument recherché *
                </label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full px-3 py-2.5 bg-afri-bg border border-afri-border rounded-xl text-xs font-bold text-afri-text focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                >
                  {SPECIALTIES_LIST.map((s) => (
                    <option key={s} value={s} className="bg-afri-bg-sec text-afri-text">
                      {s}
                    </option>
                  ))}
                  <option value="Autre" className="bg-afri-bg-sec text-afri-text">Autre spécialité...</option>
                </select>

                {specialty === "Autre" && (
                  <input
                    type="text"
                    placeholder="Précisez la spécialité (Ex: Violon, Flûte...)"
                    value={customSpecialty}
                    onChange={(e) => setCustomSpecialty(e.target.value)}
                    className="mt-2 w-full px-3 py-2 bg-afri-bg/80 border border-afri-border rounded-xl text-xs text-afri-text placeholder:text-afri-text-muted focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                  />
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#D4AF37] mb-1.5 uppercase tracking-widest">
                  Style musical dominant
                </label>
                <select
                  value={musicStyle}
                  onChange={(e) => setMusicStyle(e.target.value)}
                  className="w-full px-3 py-2.5 bg-afri-bg border border-afri-border rounded-xl text-xs font-bold text-afri-text focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                >
                  {MUSIC_STYLES.map((m) => (
                    <option key={m} value={m} className="bg-afri-bg-sec text-afri-text">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* HASHTAGS */}
            <div>
              <label className="block text-[10px] font-black text-[#D4AF37] mb-1.5 uppercase tracking-widest">
                Hashtags & Mots-clés
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] rounded-lg text-[10px] font-bold"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveHashtag(tag)}
                      className="hover:text-red-400 cursor-pointer ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ajouter un hashtag (ex: #AbidjanLive)"
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddHashtag(hashtagInput);
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-afri-bg/80 border border-afri-border rounded-xl text-xs text-afri-text placeholder:text-afri-text-muted focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
                <button
                  type="button"
                  onClick={() => handleAddHashtag(hashtagInput)}
                  className="px-3 py-2 bg-afri-bg hover:bg-afri-bg-ter text-afri-text font-bold text-xs rounded-xl border border-afri-border cursor-pointer transition"
                >
                  + Ajouter
                </button>
              </div>

              {/* Quick suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[9.5px] text-afri-text-sec">
                <span className="font-bold">Suggestions :</span>
                {POPULAR_HASHTAGS.filter(t => !hashtags.includes(t)).slice(0, 4).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleAddHashtag(t)}
                    className="text-afri-text-sec hover:text-[#D4AF37] bg-afri-bg px-2 py-0.5 rounded border border-afri-border cursor-pointer transition"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* DESCRIPTION */}
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
                placeholder="Précisez le répertoire musical, les conditions, le lieu et les consignes du live..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (fieldErrors.description) {
                    setFieldErrors(prev => {
                      const copy = { ...prev };
                      delete copy.description;
                      return copy;
                    });
                  }
                }}
                className="w-full px-4 py-3 bg-afri-bg/80 border border-afri-border rounded-2xl text-xs text-afri-text placeholder:text-afri-text-muted focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] resize-none"
              />
              {fieldErrors.description && (
                <p className="text-red-500 text-[11px] font-bold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.description}</span>
                </p>
              )}
            </div>
          </div>

          {/* 4. DATE ET HORAIRE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-[#D4AF37] mb-1.5 uppercase tracking-widest">
                5. Date de l'événement *
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
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (fieldErrors.date) {
                      setFieldErrors(prev => {
                        const copy = { ...prev };
                        delete copy.date;
                        return copy;
                      });
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-afri-bg/80 border border-afri-border rounded-2xl text-xs font-bold text-afri-text focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
              {fieldErrors.date && (
                <p className="text-red-500 text-[11px] font-bold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.date}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#D4AF37] mb-1.5 uppercase tracking-widest">
                Heure de début *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-afri-text-sec">
                  <Clock className="w-4 h-4 text-[#D4AF37]" />
                </span>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => {
                    setTime(e.target.value);
                    if (fieldErrors.time) {
                      setFieldErrors(prev => {
                        const copy = { ...prev };
                        delete copy.time;
                        return copy;
                      });
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-afri-bg/80 border border-afri-border rounded-2xl text-xs font-bold text-afri-text focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
              {fieldErrors.time && (
                <p className="text-red-500 text-[11px] font-bold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.time}</span>
                </p>
              )}
            </div>
          </div>

          {/* DURÉE DU GOMBO */}
          <div className="p-4 bg-afri-bg/60 border border-afri-border rounded-2xl space-y-3 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-xs font-black text-[#D4AF37] uppercase tracking-wider">
                  6. Durée du Gombo *
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: "hours", label: "⏱️ Quelques heures (Soirée)" },
                { id: "1_day", label: "📅 1 jour" },
                { id: "2_days", label: "📅 2 jours" },
                { id: "3_days", label: "📅 3 jours" },
                { id: "1_week", label: "🗓️ 1 semaine" },
                { id: "custom", label: "⚙️ Personnalisée" }
              ].map((opt) => {
                const isSelected = duration === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDuration(opt.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#D4AF37]/15 border-[#D4AF37] text-afri-text font-black"
                        : "bg-afri-bg border-afri-border/70 text-afri-text-sec hover:border-[#D4AF37]/40 hover:text-afri-text"
                    }`}
                  >
                    <span className="text-[11px] block">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {duration === "custom" && (
              <div className="mt-2 space-y-1.5 animate-fadeIn">
                <label className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">
                  Spécifier le nombre de jours :
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={customDurationDays}
                    onChange={(e) => setCustomDurationDays(e.target.value)}
                    className="w-full px-4 py-2.5 bg-afri-bg border border-afri-border rounded-xl text-xs font-bold text-afri-text focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                    placeholder="Nombre de jours (ex: 5)"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] font-bold text-afri-text-sec">jour(s)</span>
                </div>
              </div>
            )}
          </div>

          {/* 5. RÉMUNÉRATION (MINIMUM OBLIGATOIRE 15 000 FCFA) */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">
                7. Cachet / Rémunération * (Minimum : 15 000 FCFA)
              </label>
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Devise : FCFA (XOF)
              </span>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-emerald-400 font-black text-xs">
                FCFA
              </span>
              <input
                type="number"
                required
                min={MIN_GOMBO_AMOUNT}
                step={500}
                placeholder="Ex: 25 000 (Min. 15 000 FCFA)"
                value={budget}
                onChange={(e) => {
                  setBudget(e.target.value);
                  if (fieldErrors.budget) {
                    setFieldErrors(prev => {
                      const copy = { ...prev };
                      delete copy.budget;
                      return copy;
                    });
                  }
                }}
                className={`w-full pl-16 pr-4 py-3 bg-afri-bg/80 border rounded-2xl text-xs font-bold text-afri-text focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] ${
                  cachetVal > 0 && cachetVal < MIN_GOMBO_AMOUNT ? "border-red-500" : "border-afri-border"
                }`}
              />
            </div>

            {/* Minimum 15,000 FCFA Warning Banner if < 15,000 */}
            {cachetVal > 0 && cachetVal < MIN_GOMBO_AMOUNT && (
              <div className="mt-2 p-3 bg-red-950/40 border border-red-500/60 rounded-2xl flex items-center gap-2 text-red-400 text-xs font-bold animate-pulse">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>Le cachet minimum pour publier un Gombo est de 15 000 FCFA.</span>
              </div>
            )}

            {fieldErrors.budget && (
              <p className="text-red-500 text-[11px] font-bold mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.budget}</span>
              </p>
            )}

            {/* REAL-TIME DYNAMIC FINANCIAL BREAKDOWN */}
            {cachetVal >= MIN_GOMBO_AMOUNT && (
              <div className="mt-3 p-4 bg-afri-bg border border-[#D4AF37]/35 rounded-2xl space-y-2.5 text-xs shadow-sm">
                <div className="flex items-center justify-between font-black text-[#D4AF37] uppercase text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span>📄</span>
                    <span>Moteur Financier & Commission</span>
                  </span>
                  <span className="text-[9.5px] bg-[#D4AF37]/15 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30 text-[#D4AF37]">
                    {financials.isPremium 
                      ? `👑 ${financials.statusName} (${financials.ratePercent}%)` 
                      : `👤 ${financials.statusName} (${financials.ratePercent}%)`}
                  </span>
                </div>

                <div className="space-y-1.5 text-afri-text-sec pt-1 border-t border-afri-border/50">
                  <div className="flex justify-between items-center">
                    <span>Cachet convenu :</span>
                    <span className="font-mono font-bold text-afri-text">{financials.cachet.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Frais applicables ({financials.ratePercent} %) :</span>
                    <span className="font-mono font-bold text-[#D4AF37]">{financials.fee.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-afri-border/50">
                    <span className="font-bold text-emerald-400">Montant net pour l'artiste :</span>
                    <span className="font-mono font-black text-emerald-400">{financials.netAmount.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  {gomboCategory === "securise" && (
                    <div className="flex justify-between items-center pt-1 text-[11px] text-amber-300">
                      <span>Total bloqué sous séquestre :</span>
                      <span className="font-mono font-bold text-amber-300">{financials.total.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 6. LOCALISATION & ITINÉRAIRE (FACULTATIVE) */}
          {!(geoVis === "HIDDEN" && !isFounder) && (
            <div className="p-4 bg-afri-bg/60 border border-afri-border rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs font-black text-[#D4AF37] uppercase tracking-wider">
                    8. Lieu du Gombo & Itinéraire
                  </span>
                </div>
                <span className="text-[9px] font-mono text-afri-text-sec bg-white/5 px-2 py-0.5 rounded-full">
                  Facultatif
                </span>
              </div>

              {locationOption === "none" ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-afri-bg border border-dashed border-afri-border rounded-xl">
                  <div className="text-[11px] text-afri-text-sec">
                    <span className="font-bold text-afri-text">Aucun lieu spécifié</span>
                    <span className="block text-[9px] text-afri-text-muted">Vous pouvez publier librement sans localisation</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLocationSheetOpen(true)}
                    className="px-4 py-2 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/40 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Choisir l'itinéraire</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-afri-bg border border-[#D4AF37]/30 rounded-xl space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 text-left">
                      <div className="text-xs font-bold text-afri-text flex items-center gap-1.5">
                        <span className="text-[#D4AF37]">📍</span>
                        <span>
                          {locationOption === "commune" ? (commune === "Autre" ? (customCommune || "Autre ville") : commune) : 
                           locationOption === "manual" ? `${customPlaceInput || "Lieu saisi"} (${commune || ""})` :
                           locationOption === "autre" ? (customPlaceInput || "Lieu personnalisé") :
                           locationOption === "map" ? "Position sur la Carte" :
                           "Position GPS"}
                          {quartier ? `, ${quartier}` : ""}
                        </span>
                      </div>
                      {customPlaceInput && locationOption === "commune" && (
                        <p className="text-[10px] text-afri-text-sec pl-4">{customPlaceInput}</p>
                      )}
                      {itineraryNotes && (
                        <p className="text-[9.5px] text-[#D4AF37] pl-4 italic">🧭 Repère : {itineraryNotes}</p>
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
                        className="px-2.5 py-1 bg-afri-bg-ter hover:bg-afri-bg text-[#D4AF37] border border-afri-border rounded-lg text-[10px] font-bold uppercase transition cursor-pointer"
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
                          setItineraryNotes("");
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
              {fieldErrors.location && (
                <p className="text-red-500 text-[11px] font-bold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.location}</span>
                </p>
              )}
            </div>
          )}

          {/* 7. MÉDIAS (PHOTO / AUDIO) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div 
              className="p-4 border border-dashed border-afri-border hover:border-[#D4AF37]/60 bg-afri-bg rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer min-h-[95px] transition relative"
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
                    className="text-[10px] uppercase font-bold text-red-400 inline-flex items-center gap-0.5 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20"
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
              className="p-4 border border-dashed border-afri-border hover:border-[#D4AF37]/60 bg-afri-bg rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer min-h-[95px] transition relative"
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
                    className="text-[10px] uppercase font-bold text-red-400 inline-flex items-center gap-0.5 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20"
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

          {/* 8. RÉCAPITULATIF VISUEL AVANT SOUMISSION */}
          <div className="p-4 bg-afri-bg border border-[#D4AF37]/35 rounded-2xl space-y-2 text-left text-xs shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-afri-border/60">
              <span className="font-black text-[#D4AF37] uppercase tracking-wider text-[11px]">
                📋 Récapitulatif du Gombo
              </span>
              <span className="text-[10px] font-bold text-afri-text px-2 py-0.5 bg-afri-bg-ter border border-afri-border rounded-full">
                {gomboCategory === "securise" ? "🛡️ Gombo Sécurisé" : "🚀 Gombo Direct"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-afri-text-sec pt-1">
              <div>
                <span className="block text-afri-text-muted text-[9px] uppercase font-bold">🎵 Spécialité & Style</span>
                <span className="font-bold text-afri-text">{finalSpecialtyDisplay} • {musicStyle}</span>
              </div>
              <div>
                <span className="block text-afri-text-muted text-[9px] uppercase font-bold">📅 Date & Heure</span>
                <span className="font-bold text-afri-text">{date} à {time}</span>
              </div>
              <div>
                <span className="block text-afri-text-muted text-[9px] uppercase font-bold">📍 Emplacement</span>
                <span className="font-bold text-afri-text">
                  {locationOption !== "none" ? (commune || customPlaceInput || "Localisé") : "Non géolocalisé"}
                </span>
              </div>
              <div>
                <span className="block text-afri-text-muted text-[9px] uppercase font-bold">💰 Cachet convenu</span>
                <span className="font-bold font-mono text-emerald-400">
                  {cachetVal >= MIN_GOMBO_AMOUNT ? `${cachetVal.toLocaleString('fr-FR')} FCFA` : "15 000 FCFA minimum"}
                </span>
              </div>
            </div>

            {cachetVal >= MIN_GOMBO_AMOUNT && (
              <div className="pt-2 mt-1 border-t border-afri-border/50 flex justify-between items-center text-[10.5px]">
                <span className="text-afri-text-sec">Frais ({financials.ratePercent} %) : <strong className="text-[#D4AF37]">{financials.fee.toLocaleString('fr-FR')} FCFA</strong></span>
                <span className="text-afri-text-sec">Net artiste : <strong className="text-emerald-400">{financials.netAmount.toLocaleString('fr-FR')} FCFA</strong></span>
              </div>
            )}
          </div>

          {/* Inline Error Message */}
          {errorMsg && (
            <div className="p-3.5 bg-red-500/10 text-red-400 font-bold text-xs rounded-2xl border border-red-500/30 flex items-center gap-2 animate-bounce">
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
              className="w-full sm:w-1/3 py-3.5 px-4 bg-afri-bg hover:bg-afri-bg-ter border border-afri-border text-afri-text font-black text-xs uppercase rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 min-h-[46px]"
            >
              {savingDraft ? (
                <div className="w-4 h-4 border-2 border-afri-text border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileText className="w-4 h-4 text-afri-text-sec" />
              )}
              <span>{savingDraft ? "Enregistrement..." : "Enregistrer en brouillon"}</span>
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
        title="📍 Lieu du Gombo & Itinéraire"
      >
        <div className="space-y-4 py-1 text-left">
          <p className="text-[11px] text-afri-text-sec">
            Choisissez l'emplacement de l'événement. La localisation est <strong className="text-afri-text">facultative</strong>.
          </p>

          {/* 5 visual choices (A to E) */}
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-1.5 p-1.5 bg-afri-bg border border-afri-border rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setLocationOption("commune");
              }}
              className={`py-2 px-1 text-center rounded-xl text-[10px] font-black uppercase transition cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[50px] ${
                locationOption === "commune"
                  ? "bg-[#D4AF37] text-black shadow"
                  : "text-afri-text-sec hover:text-afri-text"
              }`}
            >
              <span className="text-sm">🏙️</span>
              <span className="leading-none text-[8.5px]">A. Commune</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLocationOption("gps");
              }}
              className={`py-2 px-1 text-center rounded-xl text-[10px] font-black uppercase transition cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[50px] ${
                locationOption === "gps"
                  ? "bg-[#D4AF37] text-black shadow"
                  : "text-afri-text-sec hover:text-afri-text"
              }`}
            >
              <span className="text-sm">📍</span>
              <span className="leading-none text-[8.5px]">B. GPS</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLocationOption("map");
                setIsMapPickerOpen(true);
              }}
              className={`py-2 px-1 text-center rounded-xl text-[10px] font-black uppercase transition cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[50px] ${
                locationOption === "map"
                  ? "bg-[#D4AF37] text-black shadow"
                  : "text-afri-text-sec hover:text-afri-text"
              }`}
            >
              <span className="text-sm">🗺️</span>
              <span className="leading-none text-[8.5px]">C. Carte</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLocationOption("manual");
              }}
              className={`py-2 px-1 text-center rounded-xl text-[10px] font-black uppercase transition cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[50px] ${
                locationOption === "manual"
                  ? "bg-[#D4AF37] text-black shadow"
                  : "text-afri-text-sec hover:text-afri-text"
              }`}
            >
              <span className="text-sm">✏️</span>
              <span className="leading-none text-[8.5px]">D. Saisir</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLocationOption("autre");
              }}
              className={`py-2 px-1 text-center rounded-xl text-[10px] font-black uppercase transition cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[50px] ${
                locationOption === "autre"
                  ? "bg-[#D4AF37] text-black shadow"
                  : "text-afri-text-sec hover:text-afri-text"
              }`}
            >
              <span className="text-sm">➕</span>
              <span className="leading-none text-[8.5px]">E. Autre</span>
            </button>
          </div>

          {/* Option A: Commune */}
          {locationOption === "commune" && (
            <div className="space-y-3 p-3.5 bg-afri-bg border border-afri-border rounded-2xl">
              <div>
                <label className="block text-[10px] font-black text-afri-text-sec uppercase mb-1">
                  Commune / Ville :
                </label>
                <select
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  className="w-full px-3 py-2.5 bg-afri-bg-sec border border-afri-border rounded-xl text-xs font-bold text-afri-text focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                >
                  {CI_COMMUNES.map((c) => (
                    <option key={c} value={c} className="bg-afri-bg-sec text-afri-text">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {commune === "Autre" && (
                <div>
                  <label className="block text-[10px] font-black text-afri-text-sec uppercase mb-1">
                    Nom de votre commune / ville :
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Daloa, Korhogo, San-Pédro..."
                    value={customCommune}
                    onChange={(e) => setCustomCommune(e.target.value)}
                    className="w-full px-3 py-2.5 bg-afri-bg-sec border border-afri-border rounded-xl text-xs text-afri-text placeholder:text-afri-text-muted focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
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
                  className="w-full px-3 py-2.5 bg-afri-bg-sec border border-afri-border rounded-xl text-xs text-afri-text placeholder:text-afri-text-muted focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
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
                  className="w-full px-3 py-2.5 bg-afri-bg-sec border border-afri-border rounded-xl text-xs text-afri-text placeholder:text-afri-text-muted focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-afri-text-sec uppercase mb-1">
                  Repère d'accès / Itinéraire :
                </label>
                <input
                  type="text"
                  placeholder="Ex: En face de la pharmacie, 2e carrefour à gauche..."
                  value={itineraryNotes}
                  onChange={(e) => setItineraryNotes(e.target.value)}
                  className="w-full px-3 py-2.5 bg-afri-bg-sec border border-afri-border rounded-xl text-xs text-afri-text placeholder:text-afri-text-muted focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

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
                      <span className="text-[11px] font-bold text-afri-text block">
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

          {/* Option B: GPS */}
          {locationOption === "gps" && (
            <div className="space-y-3 p-3.5 bg-afri-bg border border-afri-border rounded-2xl">
              <div className="text-center py-2 space-y-2">
                <p className="text-[11px] text-afri-text-sec">
                  Déterminez les coordonnées GPS précises de l'événement. Vous devez autoriser l'accès à votre position.
                </p>
                <button
                  type="button"
                  onClick={handleUseCurrentGps}
                  disabled={gpsLoading}
                  className="mx-auto px-4 py-2.5 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/40 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  {gpsLoading ? (
                    <div className="w-3.5 h-3.5 border border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4 text-[#D4AF37]" />
                  )}
                  <span>📍 Utiliser ma position</span>
                </button>
              </div>

              {gpsNotice && (
                <p className="text-[10px] text-amber-500 dark:text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                  {gpsNotice}
                </p>
              )}

              {latitude && longitude && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                    <span>📍 Lat: {latitude.toFixed(4)} | Lng: {longitude.toFixed(4)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Option C: Carte (Map Picker) */}
          {locationOption === "map" && (
            <div className="space-y-3 p-3.5 bg-afri-bg border border-afri-border rounded-2xl">
              <p className="text-[11px] text-afri-text-sec text-center">
                Ouvrez la carte interactive pour désigner l'emplacement exact de votre événement.
              </p>
              <button
                type="button"
                onClick={() => setIsMapPickerOpen(true)}
                className="w-full py-2.5 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Map className="w-4 h-4 text-[#D4AF37]" />
                <span>Ouvrir la carte interactive</span>
              </button>

              {latitude && longitude && (
                <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                  <span>Coordonnées: {latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
                </div>
              )}
            </div>
          )}

          {/* Option D: Saisir (Manual input) */}
          {locationOption === "manual" && (
            <div className="space-y-3 p-3.5 bg-afri-bg border border-afri-border rounded-2xl">
              <div>
                <label className="block text-[10px] font-black text-afri-text-sec uppercase mb-1">
                  Ville / Commune :
                </label>
                <input
                  type="text"
                  placeholder="Ex: Yamoussoukro, Abidjan..."
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  className="w-full px-3 py-2.5 bg-afri-bg-sec border border-afri-border rounded-xl text-xs text-afri-text placeholder:text-afri-text-muted focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-afri-text-sec uppercase mb-1">
                  Quartier / Repère (Optionnel) :
                </label>
                <input
                  type="text"
                  placeholder="Ex: Près de la gare..."
                  value={quartier}
                  onChange={(e) => setQuartier(e.target.value)}
                  className="w-full px-3 py-2.5 bg-afri-bg-sec border border-afri-border rounded-xl text-xs text-afri-text placeholder:text-afri-text-muted focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-afri-text-sec uppercase mb-1">
                  Nom du lieu / Salle (Saisie libre) * :
                </label>
                <input
                  type="text"
                  placeholder="Ex: Hôtel Président..."
                  value={customPlaceInput}
                  onChange={(e) => setCustomPlaceInput(e.target.value)}
                  className="w-full px-3 py-2.5 bg-afri-bg-sec border border-afri-border rounded-xl text-xs text-afri-text placeholder:text-afri-text-muted focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-afri-text-sec uppercase mb-1">
                  Repère d'accès / Itinéraire :
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carrefour principal, 100m après la station..."
                  value={itineraryNotes}
                  onChange={(e) => setItineraryNotes(e.target.value)}
                  className="w-full px-3 py-2.5 bg-afri-bg-sec border border-afri-border rounded-xl text-xs text-afri-text placeholder:text-afri-text-muted focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
            </div>
          )}

          {/* Option E: Autre */}
          {locationOption === "autre" && (
            <div className="space-y-3 p-3.5 bg-afri-bg border border-afri-border rounded-2xl">
              <div>
                <label className="block text-[10px] font-black text-afri-text-sec uppercase mb-1">
                  Précisez le lieu * :
                </label>
                <input
                  type="text"
                  placeholder="Ex: En ligne, Lieu privé, Étranger..."
                  value={customPlaceInput}
                  onChange={(e) => setCustomPlaceInput(e.target.value)}
                  className="w-full px-3 py-2.5 bg-afri-bg-sec border border-afri-border rounded-xl text-xs text-afri-text placeholder:text-afri-text-muted focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-afri-text-sec uppercase mb-1">
                  Itinéraire / Accès :
                </label>
                <input
                  type="text"
                  placeholder="Ex: Lien visio, ou instructions d'accès..."
                  value={itineraryNotes}
                  onChange={(e) => setItineraryNotes(e.target.value)}
                  className="w-full px-3 py-2.5 bg-afri-bg-sec border border-afri-border rounded-xl text-xs text-afri-text placeholder:text-afri-text-muted focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl space-y-1.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={proposePlaceToCommunity}
                    onChange={(e) => setProposePlaceToCommunity(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-afri-border accent-[#D4AF37]"
                  />
                    <div className="text-left">
                      <span className="text-[11px] font-bold text-afri-text block">
                        Proposer ce lieu à AFRIGOMBO
                      </span>
                      <span className="text-[9.5px] text-afri-text-sec block leading-relaxed">
                        Votre suggestion sera étudiée et validée pour enrichir l'arborescence officielle.
                      </span>
                    </div>
                </label>
              </div>
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
                    ? "bg-[#D4AF37]/15 border-[#D4AF37] text-afri-text font-bold"
                    : "bg-afri-bg border-afri-border text-afri-text-sec hover:text-afri-text"
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
                    ? "bg-[#D4AF37]/15 border-[#D4AF37] text-afri-text font-bold"
                    : "bg-afri-bg border-afri-border text-afri-text-sec hover:text-afri-text"
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
                setItineraryNotes("");
                setIsLocationSheetOpen(false);
              }}
              className="flex-1 py-3 bg-afri-bg hover:bg-afri-bg-ter text-red-400 font-bold text-xs uppercase rounded-xl border border-afri-border transition cursor-pointer"
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
              <span className="font-bold text-afri-text uppercase">{depositDetails.typeName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-afri-text-sec">Titre :</span>
              <span className="font-bold text-afri-text truncate max-w-[200px]">{depositDetails.title}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-afri-text-sec">Spécialité :</span>
              <span className="font-bold text-[#D4AF37]">{finalSpecialtyDisplay}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-afri-text-sec">Date & Heure :</span>
              <span className="font-bold text-afri-text">{date} à {time}</span>
            </div>
            {cachetVal > 0 && (
              <>
                <div className="flex justify-between items-center pt-1 border-t border-afri-border/50">
                  <span className="text-afri-text-sec">Cachet convenu :</span>
                  <span className="font-mono font-bold text-afri-text">{cachetVal.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-afri-text-sec">Commission ({depositDetails.ratePercent} %) :</span>
                  <span className="font-mono font-bold text-[#D4AF37]">{depositDetails.fee.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-400 font-bold">Net artiste :</span>
                  <span className="font-mono font-bold text-emerald-400">{depositDetails.netAmount.toLocaleString('fr-FR')} FCFA</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-afri-border">
              <span className="text-afri-text-sec">Mode :</span>
              <span className="font-bold text-[#D4AF37] uppercase">
                {gomboCategory === "securise" ? "🛡️ Gombo Sécurisé (Escrow)" : "🚀 Gombo Direct"}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 py-3.5 bg-afri-bg hover:bg-afri-bg-ter text-afri-text font-black text-xs uppercase rounded-2xl border border-afri-border cursor-pointer active:scale-95"
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              className="bg-afri-bg-sec text-afri-text border border-[#D4AF37]/40 rounded-3xl w-full max-w-md p-6 sm:p-8 relative shadow-2xl space-y-5 text-center"
            >
              {publishOutcome === "insufficient_funds" ? (
                <>
                  <div className="w-16 h-16 mx-auto bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-afri-text uppercase">Solde insuffisant</h3>
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
                    <h3 className="text-lg font-black text-afri-text uppercase pt-1">
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
