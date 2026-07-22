import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, Eye, CheckCircle2, Award, Calendar, MapPin, 
  Clock, Plus, ShieldCheck, Ticket, Sparkles, ShoppingBag, 
  Star, Heart, Phone, Play, Pause, Music, Trash2, Send, 
  ChevronRight, Users, AudioLines, Flame, BadgeAlert, Coins, Share2, ArrowLeft
} from "lucide-react";
import { gomboDB } from "../firebase";
import { 
  UserProfile, AcademyGuide, GomboSafeContract, 
  GomboTicketEvent, PurchasedTicket, StudioMarketItem, 
  CastingCall, VoiceAnnouncement, ContractStatus 
} from "../types";

interface GomboMusikEcosystemProps {
  currentUserProfile: UserProfile | null;
  onRefreshProfile?: () => void;
  onNavigateView: (view: string) => void;
}

export default function GomboMusikEcosystem({ 
  currentUserProfile, 
  onRefreshProfile, 
  onNavigateView 
}: GomboMusikEcosystemProps) {
  // Navigation tabs for the 2.0 Ecosystem
  const [activeTab, setActiveTab] = useState<"academy" | "safe_contracts" | "billetterie" | "studios" | "castings" | "voix" | "recompenses">("academy");

  // State caches for collections
  const [guides, setGuides] = useState<AcademyGuide[]>([]);
  const [contracts, setContracts] = useState<GomboSafeContract[]>([]);
  const [events, setEvents] = useState<GomboTicketEvent[]>([]);
  const [purchasedTickets, setPurchasedTickets] = useState<PurchasedTicket[]>([]);
  const [studioItems, setStudioItems] = useState<StudioMarketItem[]>([]);
  const [castings, setCastings] = useState<CastingCall[]>([]);
  const [voices, setVoices] = useState<VoiceAnnouncement[]>([]);

  // Selected details modal / states
  const [activeGuide, setActiveGuide] = useState<AcademyGuide | null>(null);
  const [ticketToView, setTicketToView] = useState<PurchasedTicket | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [playingProgress, setPlayingProgress] = useState<number>(0);

  // Forms open states
  const [showContractForm, setShowContractForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showStudioForm, setShowStudioForm] = useState(false);
  const [showCastingForm, setShowCastingForm] = useState(false);
  const [showVoiceForm, setShowVoiceForm] = useState(false);

  // Filter categories
  const [studioCategory, setStudioCategory] = useState<string>("all");
  const [studioCommune, setStudioCommune] = useState<string>("all");
  const [castingCommune, setCastingCommune] = useState<string>("all");
  const [voiceCommune, setVoiceCommune] = useState<string>("all");
  const [isEgliseFilter, setIsEgliseFilter] = useState<boolean>(false);

  // Form Field states
  // --- Contract Form ---
  const [contractTitle, setContractTitle] = useState("");
  const [contractPartnerEmail, setContractPartnerEmail] = useState("");
  const [contractPartnerName, setContractPartnerName] = useState("");
  const [contractAmount, setContractAmount] = useState<number>(0);
  const [contractConditions, setContractConditions] = useState("");

  // --- Event Form ---
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventPrice, setEventPrice] = useState<number>(0);
  const [eventCapacity, setEventCapacity] = useState<number>(50);

  // --- Studio/Beatmaker Form ---
  const [studioName, setStudioName] = useState("");
  const [studioCat, setStudioCat] = useState<"studio" | "beatmaker" | "photographe" | "costumier" | "equipment">("studio");
  const [studioDesc, setStudioDesc] = useState("");
  const [studioPrice, setStudioPrice] = useState("");
  const [studioPhone, setStudioPhone] = useState("");
  const [studioCom, setStudioCom] = useState("Cocody");

  // --- Casting Form ---
  const [castingTitle, setCastingTitle] = useState("");
  const [castingRoles, setCastingRoles] = useState("");
  const [castingDesc, setCastingDesc] = useState("");
  const [castingDeadline, setCastingDeadline] = useState("");
  const [castingCom, setCastingCom] = useState("Cocody");
  const [castingBudget, setCastingBudget] = useState("");

  // --- Voice Form ---
  const [voiceTitle, setVoiceTitle] = useState("");
  const [voiceCom, setVoiceCom] = useState("Cocody");

  // --- Studio review inputs ---
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [activeReviewStudioId, setActiveReviewStudioId] = useState<string | null>(null);

  // Sync real-time Firestore listeners
  useEffect(() => {
    const unsubGuides = gomboDB.listenAcademyGuides(setGuides);
    const unsubEvents = gomboDB.listenTicketEvents(setEvents);
    const unsubStudios = gomboDB.listenStudioMarket(setStudioItems);
    const unsubCastings = gomboDB.listenCastingCalls(setCastings);
    const unsubVoices = gomboDB.listenVoiceAnnouncements(setVoices);

    let unsubContracts = () => {};
    let unsubUserTickets = () => {};

    if (currentUserProfile) {
      unsubContracts = gomboDB.listenSafeContracts(currentUserProfile.uid, setContracts);
      unsubUserTickets = gomboDB.listenPurchasedTickets(currentUserProfile.uid, setPurchasedTickets);
    }

    return () => {
      unsubGuides();
      unsubEvents();
      unsubStudios();
      unsubCastings();
      unsubVoices();
      unsubContracts();
      unsubUserTickets();
    };
  }, [currentUserProfile]);

  // Handle Play voice annotation recorder simulation
  useEffect(() => {
    let interval: any;
    if (playingVoiceId) {
      interval = setInterval(() => {
        setPlayingProgress((prev) => {
          if (prev >= 100) {
            setPlayingVoiceId(null);
            return 0;
          }
          return prev + 12; // simulated increase
        });
      }, 500);
    } else {
      setPlayingProgress(0);
    }
    return () => clearInterval(interval);
  }, [playingVoiceId]);

  // Gamification triggers points gained
  const triggerPointsGrant = async (points: number, reason: string) => {
    if (!currentUserProfile) return;
    await gomboDB.addUserPoints(currentUserProfile.uid, points);
    if (onRefreshProfile) onRefreshProfile();
    alert(`🎉 Bravo ! Vous avez gagné +${points} points pour : ${reason}`);
  };

  // Submit Safe Contract
  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile) {
      alert("Veuillez vous connecter pour créer un accord.");
      return;
    }
    if (!contractTitle || !contractPartnerEmail || contractAmount <= 0 || !contractConditions) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const commission = Math.round(contractAmount * 0.05); // 5% AFRIGOMBO safety commission

    await gomboDB.createSafeContract({
      creatorId: currentUserProfile.uid,
      creatorName: currentUserProfile.displayName || currentUserProfile.email || "Ordo",
      partnerEmail: contractPartnerEmail,
      partnerId: "", // will match on login
      partnerName: contractPartnerName || (typeof contractPartnerEmail === "string" ? contractPartnerEmail.split("@")[0] : String(contractPartnerEmail ?? "")),
      title: contractTitle,
      amount: contractAmount,
      commission,
      conditions: contractConditions
    });

    // Award initial setup points
    triggerPointsGrant(100, "Création d'un accord Gombo Safe inaltérable");

    // Clean form
    setContractTitle("");
    setContractPartnerEmail("");
    setContractPartnerName("");
    setContractAmount(0);
    setContractConditions("");
    setShowContractForm(false);
  };

  // Accept Contract Trigger
  const handleAcceptContract = async (contractId: string, isCreator: boolean) => {
    if (!currentUserProfile) return;
    await gomboDB.acceptSafeContract(contractId, currentUserProfile.uid, isCreator ? "client" : "artist");
    triggerPointsGrant(150, "Acceptation et sécurisation de contrat");
  };

  // Change contract status final
  const handleUpdateStatus = async (contractId: string, status: ContractStatus) => {
    await gomboDB.updateSafeContractStatus(contractId, status);
  };

  // Create Event Ticket
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile) return;
    if (!eventTitle || !eventDate || !eventLocation || eventPrice < 0) {
      alert("Champs manquants requis.");
      return;
    }

    await gomboDB.createTicketEvent({
      creatorId: currentUserProfile.uid,
      creatorName: currentUserProfile.displayName || "Organisateur",
      title: eventTitle,
      description: eventDescription,
      date: eventDate,
      time: eventTime,
      location: eventLocation,
      price: eventPrice,
      capacity: eventCapacity
    });

    triggerPointsGrant(150, "Lancement d'une Billetterie AFRIGOMBO 2.0");

    // Clear event form
    setEventTitle("");
    setEventDescription("");
    setEventDate("");
    setEventTime("");
    setEventLocation("");
    setEventPrice(0);
    setEventCapacity(50);
    setShowEventForm(false);
  };

  // Purchase event ticket
  const handleBuyTicket = async (ev: GomboTicketEvent) => {
    if (!currentUserProfile) {
      alert("Veuillez vous authentifier pour réserver un billet.");
      return;
    }

    await gomboDB.purchaseTicket({
      eventId: ev.id,
      eventTitle: ev.title,
      buyerId: currentUserProfile.uid,
      buyerName: currentUserProfile.displayName || currentUserProfile.email || "Artiste",
      buyerPhone: currentUserProfile.phone || "Non spécifié",
      pricePaid: ev.price
    });

    triggerPointsGrant(100, "Achat de billet concert d'un frère d'ici");
    alert(`🎟️ Billet acheté avec succès pour ${ev.title} ! Retrouvez le dans l'onglet Billetterie.`);
  };

  // Create Studio Market profile
  const handleCreateStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile) return;
    if (!studioName || !studioPrice || !studioPhone) {
      alert("Veuillez remplir les informations obligatoires.");
      return;
    }

    await gomboDB.createStudioMarketItem({
      name: studioName,
      category: studioCat,
      description: studioDesc,
      price: studioPrice,
      commune: studioCom,
      phone: studioPhone,
      image: studioCat === "studio" 
        ? "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=400"
        : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400"
    });

    triggerPointsGrant(120, "Publication dans le Studio Marketplace");

    setStudioName("");
    setStudioDesc("");
    setStudioPrice("");
    setStudioPhone("");
    setShowStudioForm(false);
  };

  // Add review comment on studio item
  const handleAddStudioReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile || !activeReviewStudioId || !reviewComment) return;

    await gomboDB.addStudioMarketReview(activeReviewStudioId, {
      userId: currentUserProfile.uid,
      userName: currentUserProfile.displayName || "Un frère",
      comment: reviewComment,
      rating: reviewRating,
      createdAt: new Date().toISOString()
    });

    triggerPointsGrant(50, "Laisser une recommandation et notation étoilée");

    setReviewComment("");
    setReviewRating(5);
    setActiveReviewStudioId(null);
  };

  // Castings create
  const handleCreateCasting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile) return;
    if (!castingTitle || !castingRoles || !castingDeadline) {
      alert("Veuillez spécifier le titre, rôles et date.");
      return;
    }

    await gomboDB.createCastingCall({
      creatorId: currentUserProfile.uid,
      creatorName: currentUserProfile.displayName || "Agence",
      title: castingTitle,
      rolesNeeded: castingRoles,
      description: castingDesc,
      deadline: castingDeadline,
      commune: castingCom,
      budget: castingBudget
    });

    triggerPointsGrant(100, "Publication d'auditions d'opportunité");

    setCastingTitle("");
    setCastingRoles("");
    setCastingDesc("");
    setCastingDeadline("");
    setCastingBudget("");
    setShowCastingForm(false);
  };

  // Apply to casting Call
  const handleApplyCasting = async (castingId: string) => {
    if (!currentUserProfile) {
      alert("Veuillez vous connecter pour postuler.");
      return;
    }

    await gomboDB.applyToCastingCall(
      castingId, 
      currentUserProfile.uid, 
      currentUserProfile.displayName || currentUserProfile.email || "Musicien", 
      currentUserProfile.phone || "07000000"
    );

    triggerPointsGrant(80, "Soumission de candidature artistique officielle");
    alert("🚀 Candidature transmise directement avec votre contact !");
  };

  // Change candidate state
  const handleUpdateCastingApplication = async (castingId: string, userId: string, status: "en_attente" | "convoc" | "refus") => {
    await gomboDB.updateCastingApplicationStatus(castingId, userId, status);
  };

  // Publish Voice Announcement
  const handlePublishVoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile || !voiceTitle) return;

    await gomboDB.publishVoiceAnnouncement({
      userId: currentUserProfile.uid,
      userName: currentUserProfile.displayName || "Cabaretiste",
      userAvatar: currentUserProfile.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
      audioUrl: "simulated_announcement_" + Math.floor(Math.random() * 5 + 3) + ".mp3",
      duration: Math.floor(Math.random() * 8 + 8),
      title: voiceTitle,
      commune: voiceCom
    });

    triggerPointsGrant(110, "Diffusion d'une annonce vocale");

    setVoiceTitle("");
    setShowVoiceForm(false);
  };

  // Buy visibility spot-light
  const handleRedeemBenefit = async (cost: number, label: string) => {
    if (!currentUserProfile) return;
    const pts = currentUserProfile.points || 0;
    if (pts < cost) {
      alert(`❌ Points insuffisants. Il vous manque ${cost - pts} points Gombo.`);
      return;
    }

    await gomboDB.addUserPoints(currentUserProfile.uid, -cost);
    if (onRefreshProfile) onRefreshProfile();
    alert(`🌟 Félicitations ! Vous avez échangé vos points pour : "${label}". Notre agence a été notifiée.`);
  };

  // Filters calculation
  const filteredStudios = studioItems.filter(item => {
    const isCatOk = studioCategory === "all" || item.category === studioCategory;
    const isCommuneOk = studioCommune === "all" || item.commune === studioCommune;
    return isCatOk && isCommuneOk;
  });

  const filteredCastings = castings.filter(item => {
    const isCommuneOk = castingCommune === "all" || item.commune === castingCommune;
    return isCommuneOk;
  });

  const filteredVoices = voices.filter(item => {
    const isCommuneOk = voiceCommune === "all" || item.commune === voiceCommune;
    return isCommuneOk;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="gombo-showbiz-ecosystem-unified">
      {/* --- ECOSYSTEM ROOT HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-gradient-to-br from-[#0B0B0B] to-[#121212] border border-[#2B2B2B] p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-afri-bg-sec/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[10px] text-[#D4AF37] font-mono uppercase tracking-widest font-black">L'EXPANSION SHOWBIZ 2.0</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase text-afri-text tracking-tight leading-none">
            LE TEMPLE DU GOMBO MUSICAL
          </h1>
          <p className="text-xs sm:text-sm text-afri-text-sec max-w-xl">
            L'école de la réussite, la billetterie autonome, les accords block-contrat inaltérables, le marché de production et la gamification.
          </p>
        </div>

        {/* Current user point counters */}
        <div className="flex items-center gap-3 bg-afri-bg-sec border border-[#2A2A2A] px-4 py-3 rounded-2xl shrink-0">
          <div className="p-2 bg-afri-bg-sec/10 rounded-xl text-[#D4AF37]">
            <Coins className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-afri-text-sec font-mono font-bold leading-none">POINTS GOMBO</span>
            <span className="text-sm font-black text-afri-text mt-1">
              {currentUserProfile?.points || 0} PTS
            </span>
          </div>
        </div>
      </div>

      {/* --- PREMIUM MOBILE & DESKTOP SUB NAV --- */}
      <div className="flex gap-2.5 overflow-x-auto pb-3 scrollbar-none border-b border-gray-100 dark:border-gray-800/80">
        <button
          onClick={() => setActiveTab("academy")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${activeTab === "academy" ? "bg-afri-bg-sec text-black" : "bg-gray-100 dark:bg-gray-850 text-gray-600 dark:text-gray-300"}`}
        >
          <BookOpen className="w-4 h-4" />
          Academy 🎓
        </button>
        <button
          onClick={() => setActiveTab("safe_contracts")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${activeTab === "safe_contracts" ? "bg-afri-bg-sec text-black" : "bg-gray-100 dark:bg-gray-850 text-gray-600 dark:text-gray-300"}`}
        >
          <ShieldCheck className="w-4 h-4" />
          Gombo Safe 🔒
        </button>
        <button
          onClick={() => setActiveTab("billetterie")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${activeTab === "billetterie" ? "bg-afri-bg-sec text-black" : "bg-gray-100 dark:bg-gray-850 text-gray-600 dark:text-gray-300"}`}
        >
          <Ticket className="w-4 h-4" />
          Billetterie 🎟️
        </button>
        <button
          onClick={() => setActiveTab("studios")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${activeTab === "studios" ? "bg-afri-bg-sec text-black" : "bg-gray-100 dark:bg-gray-850 text-gray-600 dark:text-gray-300"}`}
        >
          <ShoppingBag className="w-4 h-4" />
          Studios & Beatz 🎧
        </button>
        <button
          onClick={() => setActiveTab("castings")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${activeTab === "castings" ? "bg-afri-bg-sec text-black" : "bg-gray-100 dark:bg-gray-850 text-gray-600 dark:text-gray-300"}`}
        >
          <Users className="w-4 h-4" />
          AudiCastings 🎤
        </button>
        <button
          onClick={() => setActiveTab("voix")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${activeTab === "voix" ? "bg-afri-bg-sec text-black" : "bg-gray-100 dark:bg-gray-850 text-gray-600 dark:text-gray-300"}`}
        >
          <AudioLines className="w-4 h-4" />
          Annonces Vocales 📻
        </button>
        <button
          onClick={() => setActiveTab("recompenses")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${activeTab === "recompenses" ? "bg-afri-bg-sec text-black" : "bg-gray-100 dark:bg-gray-850 text-gray-600 dark:text-gray-300"}`}
        >
          <Award className="w-4 h-4" />
          Boutique Récompenses 🎁
        </button>
      </div>

      {/* --- CONTENT TABS SWITCH WINDOW --- */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="space-y-6"
        >
          {/* ==================== 1. ACADEMY ==================== */}
          {activeTab === "academy" && (
            <div className="space-y-6">
              {!activeGuide ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {guides.map((g) => (
                    <div 
                      key={g.id} 
                      className="bg-white dark:bg-afri-bg-sec border border-gray-150 dark:border-gray-800 p-5 rounded-2xl flex flex-col justify-between hover:border-[#D4AF37] hover:shadow-lg transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 text-[9px] font-black uppercase text-[#D4AF37] bg-afri-bg-sec/10 rounded-lg">
                            {g.category === "tarifs" ? "Calculateur Cachet 💰" : g.category === "contrat" ? "Droit & Négoc 📜" : "Anti-Arnaque 🛡️"}
                          </span>
                          <span className="text-[9px] text-afri-text-sec font-mono">Guide Certifié</span>
                        </div>
                        <h4 className="text-sm font-black text-gray-900 dark:text-gray-150 uppercase tracking-tight">{g.title}</h4>
                        <p className="text-xs text-afri-text-sec leading-relaxed line-clamp-3">{g.excerpt}</p>
                      </div>

                      <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100 dark:border-gray-800/80">
                        <span className="text-[10px] text-[#D4AF37] font-black uppercase">🎓 Accès Libre</span>
                        <button
                          onClick={() => setActiveGuide(g)}
                          className="px-3 py-1.5 bg-afri-bg-sec hover:bg-afri-bg-sec/80 text-[#0B0B0B] text-[10px] font-bold rounded-lg uppercase flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Lire l'aide
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-afri-bg-sec border border-gray-200 dark:border-gray-800 p-6 sm:p-8 rounded-3xl space-y-6 relative">
                  <button 
                    onClick={() => setActiveGuide(null)}
                    className="flex items-center gap-1.5 text-xs text-afri-text-sec hover:text-black dark:text-afri-text-sec dark:hover:text-afri-text transition-colors uppercase font-mono font-bold cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Retour aux guides
                  </button>

                  <div className="space-y-2">
                    <span className="px-2.5 py-1 text-[9px] font-black uppercase text-[#D4AF37] bg-afri-bg-sec/10 rounded-lg">
                      {activeGuide.category === "tarifs" ? "Tarif Conseillé" : activeGuide.category === "contrat" ? "Guide Juridique" : "Alerte Fraude"}
                    </span>
                    <h2 className="text-base sm:text-lg font-black uppercase dark:text-afri-text">{activeGuide.title}</h2>
                    <span className="text-[9px] text-gray-505 font-mono">Publié par AFRIGOMBO ACADEMY</span>
                  </div>

                  {/* Formatted body simulation */}
                  <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line space-y-4 font-sans bg-gray-50 dark:bg-afri-bg/40 p-5 rounded-2xl">
                    {activeGuide.content}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <button 
                      onClick={() => alert("⬇️ Téléchargement de la version PDF officiel d'AFRIGOMBO-CONTRAT pour consultations hors-ligne.")}
                      className="w-full sm:w-auto px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-black uppercase rounded-xl border border-emerald-500/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      Télécharger PDF utile 📥
                    </button>
                    <button 
                      onClick={() => alert("📻 Lecture audio synthétisée par l'IA AFRIGOMBO en cours. Assurez-vous d'activer le son de votre enceinte.")}
                      className="w-full sm:w-auto px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-black uppercase rounded-xl border border-blue-500/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      Écouter Audio Guide 🔊
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== 2. GOMBO SAFE CONTRACTS ==================== */}
          {activeTab === "safe_contracts" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase text-gray-900 dark:text-afri-text">🔒 BLOCK-CONTRAT SÉCURISÉ (GOMBO SAFE)</h3>
                  <p className="text-xs text-afri-text-sec">Rédigez d'un commun accord un contrat inaltérable. AFRIGOMBO bloque les fonds et accorde sa sécurité.</p>
                </div>
                <button
                  onClick={() => setShowContractForm(!showContractForm)}
                  className="px-4 py-2 bg-afri-bg-sec hover:bg-afri-bg-sec/80 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau contrat
                </button>
              </div>

              {/* Form Creation Collapse */}
              {showContractForm && (
                <form 
                  onSubmit={handleCreateContract}
                  className="bg-gray-50 dark:bg-afri-bg-sec border border-[#2B2B2B] p-6 rounded-2xl space-y-4"
                >
                  <h4 className="text-xs font-black text-[#D4AF37] uppercase">REDIGER UN ACCORD INDESTRUCTIBLE</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 p-0.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Titre de l'accord ou prestation *</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Bassiste pour Cabaret de Cocody..."
                        value={contractTitle}
                        onChange={e => setContractTitle(e.target.value)}
                        className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl focus:border-[#D4AF37] outline-none text-gray-900 dark:text-afri-text"
                        required
                      />
                    </div>
                    <div className="space-y-1 p-0.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Email du partenaire (musicien ou client) *</label>
                      <input 
                        type="email" 
                        placeholder="Ex: yoro@gombo.ci..."
                        value={contractPartnerEmail}
                        onChange={e => setContractPartnerEmail(e.target.value)}
                        className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl focus:border-[#D4AF37] outline-none text-gray-900 dark:text-afri-text"
                        required
                      />
                    </div>
                    <div className="space-y-1 p-0.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Montant convenu (en FCFA) *</label>
                      <input 
                        type="number" 
                        placeholder="50000"
                        value={contractAmount || ""}
                        onChange={e => setContractAmount(Number(e.target.value))}
                        className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl focus:border-[#D4AF37] outline-none text-gray-900 dark:text-afri-text"
                        required
                      />
                      {contractAmount > 0 && (
                        <p className="text-[9px] text-[#D4AF37] font-mono">Commission de sécurité AFRIGOMBO (5%) : {Math.round(contractAmount * 0.05)} FCFA</p>
                      )}
                    </div>
                    <div className="space-y-1 p-0.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Nom ou pseudo commercial du partenaire</label>
                      <input 
                        type="text" 
                        placeholder="Yorobo Sangaré..."
                        value={contractPartnerName}
                        onChange={e => setContractPartnerName(e.target.value)}
                        className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl focus:border-[#D4AF37] outline-none text-gray-900 dark:text-afri-text"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Clauses, conditions et livrables de la prestation *</label>
                    <textarea 
                      placeholder="Spécifiez clairement : date de répétition, nombre d'heures de jeu, balance sono, etc."
                      value={contractConditions}
                      onChange={e => setContractConditions(e.target.value)}
                      rows={3}
                      className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl focus:border-[#D4AF37] outline-none text-gray-900 dark:text-afri-text font-sans"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowContractForm(false)}
                      className="px-4 py-2 border border-gray-200 dark:border-gray-800 text-xs text-afri-text-sec rounded-xl hover:text-afri-text transition"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-afri-text text-xs font-black uppercase rounded-xl transition"
                    >
                      Sécuriser l'accord 🚀
                    </button>
                  </div>
                </form>
              )}

              {/* Contracts List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contracts.length === 0 ? (
                  <div className="col-span-full text-center py-16 text-afri-text-sec font-mono text-xs uppercase bg-afri-bg-sec border border-[#2B2B2B] rounded-3xl">
                    Aucun accord en cours de sécurité Gombo Safe. Un gombo sécurisé est la clé de la sérénité !
                  </div>
                ) : (
                  contracts.map((c) => {
                    const isCreator = c.creatorId === currentUserProfile?.uid;
                    const amIAccepted = isCreator ? c.creatorAccepted : c.partnerAccepted;
                    const counterpartName = isCreator ? c.partnerName : c.creatorName;
                    
                    return (
                      <div 
                        key={c.id} 
                        className="bg-white dark:bg-afri-bg-sec border border-gray-150 dark:border-gray-800 p-5 rounded-2xl space-y-4"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-gray-55 bg-gray-50 dark:bg-afri-bg/30 p-3 rounded-xl">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-gray-450 uppercase font-mono font-bold">ACCORD GOMBO SAFE</span>
                            <h4 className="text-xs font-black uppercase text-afri-text tracking-tight">{c.title}</h4>
                          </div>
                          
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                            c.status === "en_attente" ? "bg-amber-500/10 text-amber-500" :
                            c.status === "accepte" ? "bg-emerald-500/10 text-emerald-400" :
                            c.status === "termine" ? "bg-blue-500/10 text-blue-400" :
                            "bg-red-500/10 text-red-400"
                          }`}>
                            {c.status === "en_attente" ? "En attente signature" :
                             c.status === "accepte" ? "Contrat Actif" :
                             c.status === "termine" ? "Exécuté avec succès" :
                             "En Litige d'Arbitrage"}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="text-[11.5px] space-y-2 text-gray-300">
                          <p className="line-clamp-3 text-xs leading-relaxed italic bg-afri-bg-sec p-2.5 rounded-xl text-afri-text-sec">{c.conditions}</p>
                          
                          <div className="flex justify-between items-center bg-afri-bg-sec px-3 py-2 rounded-xl text-xs font-mono">
                            <span className="text-afri-text-sec font-bold">Prestation :</span>
                            <span className="text-afri-text font-black">{c.amount} FCFA</span>
                          </div>

                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-afri-text-sec">Garant :</span>
                            <span className="text-[#D4AF37] font-black">Commission AFRIGOMBO : {c.commission} FCFA</span>
                          </div>

                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-afri-text-sec">Preneur d'accord :</span>
                            <span className="text-afri-text font-black text-[9.5px]">{counterpartName}</span>
                          </div>
                        </div>

                        {/* Real-time sign verification */}
                        <div className="flex gap-2 pt-2 text-[9px] font-mono text-afri-text-sec">
                          <span className="flex items-center gap-1">
                            {c.creatorAccepted ? "🟢 " : "⚪ "} {c.creatorName}
                          </span>
                          <span className="flex items-center gap-1">
                            {c.partnerAccepted ? "🟢 " : "⚪ "} Nommé partenaire
                          </span>
                        </div>

                        {/* Sign Actions */}
                        <div className="flex gap-2 pt-2">
                          {!amIAccepted && c.status === "en_attente" && (
                            <button
                              onClick={() => handleAcceptContract(c.id, isCreator)}
                              className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase rounded-lg border border-emerald-500/20 transition cursor-pointer"
                            >
                              ✍️ Accepter et signer
                            </button>
                          )}

                          {c.status === "accepte" && isCreator && (
                            <div className="flex gap-1 w-full">
                              <button
                                onClick={() => handleUpdateStatus(c.id, "termine")}
                                className="w-1/2 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[9px] font-black uppercase rounded-lg border border-blue-500/20 cursor-pointer"
                              >
                                Prestation Terminée V
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(c.id, "litige")}
                                className="w-1/2 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[9px] font-black uppercase rounded-lg border border-red-500/20 cursor-pointer"
                              >
                                Signaler un Litige 🚨
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ==================== 3. BILLETTERIE ==================== */}
          {activeTab === "billetterie" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-150 dark:border-gray-800 pb-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase text-gray-900 dark:text-afri-text">🎟️ BILLETTERIE NUMÉRIQUE EXCLUSIVE</h3>
                  <p className="text-xs text-afri-text-sec">Publiez votre concert ou masterclass live, vendez des billets, et validez les via code de sécurité.</p>
                </div>
                <button
                  onClick={() => setShowEventForm(!showEventForm)}
                  className="px-4 py-2 bg-afri-bg-sec hover:bg-afri-bg-sec/80 text-black text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center gap-1 shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Mettre en vente un show
                </button>
              </div>

              {/* Event Form creation */}
              {showEventForm && (
                <form 
                  onSubmit={handleCreateEvent}
                  className="bg-gray-50 dark:bg-afri-bg-sec border border-[#2B2B2B] p-6 rounded-2xl space-y-4"
                >
                  <h4 className="text-xs font-black text-[#D4AF37] uppercase">ORGANISER UN SHOW MUSICAL</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 p-0.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Nom du concert / événement *</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Zouglou Live au Maquis Angré..."
                        value={eventTitle}
                        onChange={e => setEventTitle(e.target.value)}
                        className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-[#D4AF37] text-gray-900 dark:text-afri-text"
                        required
                      />
                    </div>
                    <div className="space-y-1 p-0.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Lieu exact *</label>
                      <input 
                        type="text" 
                        placeholder="Ex: VIP Châteaux, Cocody..."
                        value={eventLocation}
                        onChange={e => setEventLocation(e.target.value)}
                        className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-[#D4AF37] text-gray-900 dark:text-afri-text"
                        required
                      />
                    </div>
                    <div className="space-y-1 p-0.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Date *</label>
                      <input 
                        type="date" 
                        value={eventDate}
                        onChange={e => setEventDate(e.target.value)}
                        className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-[#D4AF37] text-gray-900 dark:text-afri-text"
                        required
                      />
                    </div>
                    <div className="space-y-1 p-0.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Heure de début *</label>
                      <input 
                        type="text" 
                        placeholder="20:00"
                        value={eventTime}
                        onChange={e => setEventTime(e.target.value)}
                        className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-[#D4AF37] text-gray-900 dark:text-afri-text"
                        required
                      />
                    </div>
                    <div className="space-y-1 p-0.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Prix du Billet Réduit (en FCFA) *</label>
                      <input 
                        type="number" 
                        placeholder="5000"
                        value={eventPrice || ""}
                        onChange={e => setEventPrice(Number(e.target.value))}
                        className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-[#D4AF37] text-gray-900 dark:text-afri-text"
                        required
                      />
                    </div>
                    <div className="space-y-1 p-0.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Places maximum dispo *</label>
                      <input 
                        type="number" 
                        placeholder="50"
                        value={eventCapacity}
                        onChange={e => setEventCapacity(Number(e.target.value))}
                        className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-[#D4AF37] text-gray-900 dark:text-afri-text"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Description du concert</label>
                    <textarea 
                      placeholder="Lineup des musiciens, VIP Pass, Boisson comprise, ambiance attendue..."
                      value={eventDescription}
                      onChange={e => setEventDescription(e.target.value)}
                      rows={2}
                      className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl focus:border-[#D4AF37] outline-none text-gray-900 dark:text-afri-text font-sans"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowEventForm(false)}
                      className="px-4 py-2 border border-gray-200 dark:border-gray-800 text-xs text-afri-text-sec rounded-xl hover:text-afri-text transition"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-afri-text text-xs font-black uppercase rounded-xl transition"
                    >
                      Lancer les ventes 🎤
                    </button>
                  </div>
                </form>
              )}

              {/* Grid lists of events */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map((ev) => (
                  <div 
                    key={ev.id} 
                    className="bg-white dark:bg-afri-bg-sec border border-gray-150 dark:border-gray-800 p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-gray-700 transition-all"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-afri-bg-sec/5 rounded-bl-full pointer-events-none" />
                    
                    <div className="space-y-4">
                      {/* Event Banner info */}
                      <div className="space-y-1 border-b border-gray-100 dark:border-gray-800 pb-3">
                        <span className="text-[9px] font-bold font-mono text-[#D4AF37] uppercase bg-afri-bg-sec/10 px-2 py-0.5 rounded-lg">SHOW LIVE</span>
                        <h4 className="text-sm font-black uppercase text-gray-950 dark:text-afri-text tracking-tight mt-1">{ev.title}</h4>
                        <p className="text-[10px] text-gray-450">{ev.description || "Grand concert d'un artiste du pays à l'honneur !"}</p>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                        <div className="flex items-center gap-1.5 text-afri-text-sec">
                          <MapPin className="w-3.5 h-3.5 text-afri-text-sec" />
                          <span className="truncate">{ev.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-afri-text-sec justify-end">
                          <Calendar className="w-3.5 h-3.5 text-afri-text-sec" />
                          <span>{ev.date} - {ev.time}</span>
                        </div>
                      </div>

                      {/* Ticket capacity meter */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-afri-text-sec">
                          <span>Places réservées : {ev.ticketsSold || 0} / {ev.capacity || 100}</span>
                          <span>{(ev.capacity - (ev.ticketsSold || 0))} Restantes</span>
                        </div>
                        <div className="w-full h-1 bg-gray-100 dark:bg-gray-850 rounded-full overflow-hidden">
                          <div 
                            className="bg-afri-bg-sec h-full" 
                            style={{ width: `${Math.min(100, (((ev.ticketsSold || 0) / (ev.capacity || 100)) * 100))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 mt-5 pt-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-afri-text-sec font-mono">TARIF</span>
                        <span className="text-sm font-black text-afri-text">{ev.price === 0 ? "GRATUIT" : `${ev.price} FCFA`}</span>
                      </div>
                      <button
                        onClick={() => handleBuyTicket(ev)}
                        disabled={(ev.ticketsSold || 0) >= ev.capacity}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1 cursor-pointer ${
                          (ev.ticketsSold || 0) >= ev.capacity
                            ? "bg-gray-800/20 text-gray-600 border border-gray-800/20 cursor-not-allowed"
                            : "bg-afri-bg-sec/10 hover:bg-afri-bg-sec text-[#D4AF37] hover:text-[#0B0B0B] border border-[#D4AF37]/30"
                        }`}
                      >
                        <Ticket className="w-4 h-4" />
                        {(ev.ticketsSold || 0) >= ev.capacity ? "Guichet Fermé" : "Réserver mon Billet"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* My Purchased Tickets Box */}
              {purchasedTickets.length > 0 && (
                <div className="bg-afri-bg-sec border border-[#2B2B2B] p-6 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#202020] pb-3">
                    <span className="text-xs font-black uppercase text-[#D4AF37] tracking-wider flex items-center gap-1">
                      🎟️ MES BILLETS SÉCURISÉS ({purchasedTickets.length})
                    </span>
                    <span className="text-[9px] text-afri-text-sec font-mono">Présentez les billets à l'entrée du concert</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {purchasedTickets.map((t) => (
                      <div 
                        key={t.id}
                        onClick={() => setTicketToView(t)}
                        className="p-4 bg-afri-bg border border-dashed border-gray-800 rounded-2xl flex flex-col justify-between gap-3 cursor-pointer hover:border-[#D4AF37]"
                      >
                        <div className="space-y-1">
                          <span className="text-[9px] text-[#D4AF37] font-mono font-black uppercase">BILLET VALIDÉ</span>
                          <h5 className="text-xs font-black text-afri-text uppercase truncate">{t.eventTitle}</h5>
                          <span className="text-[10px] text-gray-550 block font-mono">ID : {t.ticketCode}</span>
                        </div>
                        <div className="bg-amber-500/10 text-center py-2.5 rounded-xl text-[#D4AF37] text-[10px] font-black uppercase tracking-widest leading-none font-mono">
                          OBTENIR QR CODE ↗
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* QR TICKET MODAL SIMULATOR */}
              {ticketToView && (
                <div className="fixed inset-0 z-50 bg-afri-bg/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-afri-bg-sec border border-[#2B2B2B] p-6 rounded-3xl max-w-sm w-full space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-afri-bg-sec/5 rounded-bl-full pointer-events-none" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-[#D4AF37] font-black uppercase font-mono">PASS DE SÉCURITÉ PORTABLE</span>
                      <button 
                        onClick={() => setTicketToView(null)}
                        className="text-afri-text-sec hover:text-afri-text font-black text-xs uppercase"
                      >
                        Fermer x
                      </button>
                    </div>

                    <div className="space-y-2 text-center pb-4 border-b border-[#202020]">
                      <h4 className="text-sm font-black text-afri-text uppercase">{ticketToView.eventTitle}</h4>
                      <p className="text-[10px] text-[#D4AF37] font-mono tracking-widest">{ticketToView.ticketCode}</p>
                    </div>

                    {/* Simulated High-fidelity QR Code block */}
                    <div className="flex flex-col items-center justify-center space-y-3 bg-white p-5 rounded-2xl">
                      <div className="w-40 h-40 bg-afri-bg-sec rounded-xl flex items-center justify-center relative p-3">
                        {/* Elegant custom QR grid simulation using lines */}
                        <div className="w-full h-full border-4 border-white rounded flex flex-wrap gap-1 p-1">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div key={i} className={`w-8 h-8 rounded-sm ${i % 3 === 0 ? "bg-white" : "bg-transparent"}`} />
                          ))}
                        </div>
                        <div className="absolute inset-x-0 h-0.5 bg-emerald-500 animate-bounce top-1/2" />
                      </div>
                      <span className="text-[8.5px] text-afri-text-sec font-mono font-bold uppercase">AFRIGOMBO SECURE PASS - VALIDÉ</span>
                    </div>

                    <div className="space-y-1.5 text-xs text-center text-afri-text-sec">
                      <p>Titulaire : <span className="text-afri-text font-bold">{ticketToView.buyerName}</span></p>
                      <p>Téléphone : {ticketToView.buyerPhone}</p>
                      <button
                        onClick={() => { alert("Screenshot enregistré dans vos albums photos mobile."); setTicketToView(null); }}
                        className="w-full py-2 bg-white text-black text-[10.5px] font-black uppercase tracking-wider rounded-xl hover:bg-white/90 font-mono transition"
                      >
                        Télécharger d'un clic 💾
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== 4. STUDIO MARKETPLACE ==================== */}
          {activeTab === "studios" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase text-gray-900 dark:text-afri-text">🎧 SERVICES ET STUDIO DE PRODUCTION</h3>
                  <p className="text-xs text-afri-text-sec">Louez des heures d'enregistrement, réservez des beatmakers talentueux, des photographes ou des costumiers.</p>
                </div>
                <button
                  onClick={() => setShowStudioForm(!showStudioForm)}
                  className="px-4 py-2 bg-afri-bg-sec hover:bg-afri-bg-sec/80 text-black text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center gap-1 shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Inscrire mon studio
                </button>
              </div>

              {/* Form creation */}
              {showStudioForm && (
                <form 
                  onSubmit={handleCreateStudio}
                  className="bg-gray-50 dark:bg-afri-bg-sec border border-[#2B2B2B] p-6 rounded-2xl space-y-4"
                >
                  <h4 className="text-xs font-black text-[#D4AF37] uppercase">INSCRIRE UN SERVICE DE PRODUCTION AU SHOWBIZ</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 p-0.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Nom commercial / Studio / Professionnel *</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Studio Red Zone..."
                        value={studioName}
                        onChange={e => setStudioName(e.target.value)}
                        className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-[#D4AF37] text-gray-900 dark:text-afri-text"
                        required
                      />
                    </div>
                    <div className="space-y-1 p-0.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Catégorie d'activité *</label>
                      <select 
                        value={studioCat}
                        onChange={e => setStudioCat(e.target.value as any)}
                        className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl focus:border-[#D4AF37] outline-none text-gray-900 dark:text-afri-text"
                      >
                        <option value="studio">Studio d'Enregistrement</option>
                        <option value="beatmaker">Compositeur / Beatmaker</option>
                        <option value="photographe">Photographe / Clipmaker</option>
                        <option value="costumier">Costumier & Styliste de Scène</option>
                        <option value="equipment">Location de Matériel Sono</option>
                      </select>
                    </div>
                    <div className="space-y-1 p-0.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Prix de départ indicatif *</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 15 000 FCFA / Heure, 50 000 FCFA le beat..."
                        value={studioPrice}
                        onChange={e => setStudioPrice(e.target.value)}
                        className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-[#D4AF37] text-gray-900 dark:text-afri-text"
                        required
                      />
                    </div>
                    <div className="space-y-1 p-0.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Téléphone de contact *</label>
                      <input 
                        type="text" 
                        placeholder="+225 05..."
                        value={studioPhone}
                        onChange={e => setStudioPhone(e.target.value)}
                        className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-[#D4AF37] text-gray-900 dark:text-afri-text"
                        required
                      />
                    </div>
                    <div className="space-y-1 p-0.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Commune d'Abidjan *</label>
                      <select 
                        value={studioCom}
                        onChange={e => setStudioCom(e.target.value)}
                        className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl focus:border-[#D4AF37] outline-none text-gray-900 dark:text-afri-text"
                      >
                        <option value="Cocody">Cocody</option>
                        <option value="Yopougon">Yopougon</option>
                        <option value="Marcory">Marcory</option>
                        <option value="Plateau">Plateau</option>
                        <option value="Treichville">Treichville</option>
                        <option value="Abobo">Abobo</option>
                        <option value="Grand-Bassam">Grand-Bassam</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Description des services, logiciels ou équipement dispo</label>
                    <textarea 
                      placeholder="Indiquez vos micros (ex: Neumann), cartes sons, cabines acoustiques..."
                      value={studioDesc}
                      onChange={e => setStudioDesc(e.target.value)}
                      rows={2}
                      className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl focus:border-[#D4AF37] outline-none text-gray-900 dark:text-afri-text font-sans"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowStudioForm(false)}
                      className="px-4 py-2 border border-gray-200 dark:border-gray-800 text-xs text-afri-text-sec rounded-xl hover:text-afri-text transition"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-afri-text text-xs font-black uppercase rounded-xl transition"
                    >
                      Inscrire mon service 🚀
                    </button>
                  </div>
                </form>
              )}

              {/* Filters Header toolbar */}
              <div className="flex flex-wrap gap-2.5 bg-gray-50 dark:bg-afri-bg/35 p-3 rounded-2xl border border-gray-100 dark:border-gray-850">
                <select 
                  value={studioCategory} 
                  onChange={e => setStudioCategory(e.target.value)}
                  className="bg-white dark:bg-afri-bg-sec p-2 text-xs border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-afri-text focus:border-[#D4AF37] cursor-pointer"
                >
                  <option value="all">Filtre Activité (Toutes)</option>
                  <option value="studio">Studios d'Enregistrement</option>
                  <option value="beatmaker">Beatmakers / Compositeurs</option>
                  <option value="photographe">Photographes / Vidéastes</option>
                  <option value="costumier">Costumiers / Stylistes</option>
                  <option value="equipment">Location de Matériel</option>
                </select>

                <select 
                  value={studioCommune} 
                  onChange={e => setStudioCommune(e.target.value)}
                  className="bg-white dark:bg-afri-bg-sec p-2 text-xs border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-afri-text focus:border-[#D4AF37] cursor-pointer"
                >
                  <option value="all">Toutes Communes d'Abidjan</option>
                  <option value="Cocody">Cocody</option>
                  <option value="Yopougon">Yopougon</option>
                  <option value="Marcory">Marcory</option>
                  <option value="Plateau">Plateau</option>
                  <option value="Treichville">Treichville</option>
                  <option value="Grand-Bassam">Grand-Bassam</option>
                </select>
              </div>

              {/* Dynamic list items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredStudios.map((item) => (
                  <div 
                    key={item.id}
                    className="bg-white dark:bg-afri-bg-sec border border-gray-150 dark:border-gray-800 p-5 rounded-3xl space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 text-[9px] font-black uppercase text-[#D4AF37] bg-afri-bg-sec/10 rounded-lg font-mono">
                          {item.category === "studio" ? "Studio" : item.category === "beatmaker" ? "Beatmaker" : "Service Pro"}
                        </span>
                        
                        {/* Rating stars */}
                        <div className="flex items-center gap-1 font-mono text-[10px] text-[#D4AF37]">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{Number(item.rating || 5).toFixed(1)}</span>
                          <span className="text-afri-text-sec">({item.reviews?.length || 0})</span>
                        </div>
                      </div>

                      <h4 className="text-sm font-black uppercase text-afri-text tracking-tight leading-none">{item.name}</h4>
                      <p className="text-xs text-gray-550 italic">{item.commune} d'Abidjan</p>
                      <p className="text-[11.5px] text-afri-text-sec leading-relaxed font-sans line-clamp-3">{item.description}</p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-afri-text-sec">Tarif initié :</span>
                        <span className="text-afri-text font-black">{item.price}</span>
                      </div>

                      {/* Display reviews list */}
                      {item.reviews && item.reviews.length > 0 && (
                        <div className="bg-afri-bg/30 p-2.5 rounded-xl border border-gray-800/60 max-h-[110px] overflow-y-auto space-y-2">
                          <p className="text-[8.5px] font-black uppercase text-[#D4AF37] font-mono">Recommandations :</p>
                          {item.reviews.map((v, idx) => (
                            <div key={idx} className="text-[10px] leading-relaxed">
                              <span className="text-afri-text-sec font-bold font-mono">{v.userName} : </span>
                              <span className="text-gray-300 italic">"{v.comment}"</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Contact and review writing toggles */}
                      <div className="flex gap-2">
                        <a
                          href={`tel:${item.phone}`}
                          className="w-1/2 p-2 bg-white text-black text-center text-[10.5px] font-black uppercase rounded-xl flex items-center justify-center gap-1.5 hover:bg-white/90 transition cursor-pointer"
                        >
                          <Phone className="w-4 h-4 shrink-0" />
                          Contacter
                        </a>
                        <button
                          onClick={() => setActiveReviewStudioId(item.id)}
                          className="w-1/2 p-2 bg-afri-bg-sec/10 hover:bg-afri-bg-sec/20 text-[#D4AF37] border border-[#D4AF37]/20 text-[10px] font-black uppercase rounded-xl cursor-pointer"
                        >
                          ✍️ Noter
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* REVIEW WRITE DIALOG MODAL */}
              {activeReviewStudioId && (
                <div className="fixed inset-0 z-50 bg-afri-bg/85 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-afri-bg-sec border border-[#2B2B2B] p-6 rounded-3xl max-w-sm w-full space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black uppercase text-[#D4AF37] tracking-wider">LAISSER UN AVIS AU SHOWBIZ</h4>
                      <button 
                        onClick={() => setActiveReviewStudioId(null)}
                        className="text-afri-text-sec hover:text-afri-text font-mono text-xs cursor-pointer"
                      >
                        Annuler x
                      </button>
                    </div>

                    <form onSubmit={handleAddStudioReview} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono font-bold text-afri-text-sec">Note sur 5 étoiles *</label>
                        <select
                          value={reviewRating}
                          onChange={e => setReviewRating(Number(e.target.value))}
                          className="w-full bg-afri-bg border border-gray-800 p-2.5 text-xs rounded-xl text-afri-text outline-none"
                        >
                          <option value={5}>⭐⭐⭐⭐⭐ (5/5 Exceptionnel)</option>
                          <option value={4}>⭐⭐⭐⭐ (4/5 Très Bon)</option>
                          <option value={3}>⭐⭐⭐ (3/5 Passable)</option>
                          <option value={2}>⭐⭐ (2/5 Mauvais)</option>
                          <option value={1}>⭐ (1/5 À Éviter absolument)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono font-bold text-afri-text-sec">Votre recommandation écrite *</label>
                        <textarea
                          placeholder="Acoustique, équipement, ingénieur sympa, beat rapide..."
                          rows={2}
                          value={reviewComment}
                          onChange={e => setReviewComment(e.target.value)}
                          className="w-full bg-afri-bg border border-gray-800 p-2.5 text-xs rounded-xl outline-none text-afri-text font-sans"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-afri-text text-xs font-black uppercase rounded-xl transition"
                      >
                        Publier mon verdict ⭐
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== 5. CASTINGS & AUDITIONS ==================== */}
          {activeTab === "castings" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase text-gray-900 dark:text-afri-text">🎤 CASTINGS & AUDITIONS SHOWBIZ</h3>
                  <p className="text-xs text-afri-text-sec">Postulez aux offres des agences événementielles ou recrutez des choristes de backup et instrumentistes de tournée.</p>
                </div>
                <button
                  onClick={() => setShowCastingForm(!showCastingForm)}
                  className="px-4 py-2 bg-afri-bg-sec hover:bg-afri-bg-sec/80 text-black text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Créer un casting
                </button>
              </div>

              {/* Forms Casting creation collapse */}
              {showCastingForm && (
                <form 
                  onSubmit={handleCreateCasting}
                  className="bg-gray-50 dark:bg-afri-bg-sec border border-[#2B2B2B] p-6 rounded-2xl space-y-4"
                >
                  <h4 className="text-xs font-black text-[#D4AF37] uppercase">ANNONCER UN RECRUTEMENT DE TALENT</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 p-0.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Titre de l'audition/casting *</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Casting Choristes Backup..."
                        value={castingTitle}
                        onChange={e => setCastingTitle(e.target.value)}
                        className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-[#D4AF37] text-gray-900 dark:text-afri-text"
                        required
                      />
                    </div>
                    <div className="space-y-1 p-0.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Rôles recherchés *</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 2 Altis, 1 Soprano..."
                        value={castingRoles}
                        onChange={e => setCastingRoles(e.target.value)}
                        className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-[#D4AF37] text-gray-900 dark:text-afri-text"
                        required
                      />
                    </div>
                    <div className="space-y-1 p-0.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Budget prévu (Mensuel ou Prestation)</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 300 000 FCFA / mois..."
                        value={castingBudget}
                        onChange={e => setCastingBudget(e.target.value)}
                        className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-[#D4AF37] text-gray-900 dark:text-afri-text"
                      />
                    </div>
                    <div className="space-y-1 p-0.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Date limite de dépôt *</label>
                      <input 
                        type="date" 
                        value={castingDeadline}
                        onChange={e => setCastingDeadline(e.target.value)}
                        className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-[#D4AF37] text-gray-900 dark:text-afri-text"
                        required
                      />
                    </div>
                    <div className="space-y-1 p-0.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Commune Abidjan *</label>
                      <select 
                        value={castingCom}
                        onChange={e => setCastingCom(e.target.value)}
                        className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl focus:border-[#D4AF37] outline-none text-gray-900 dark:text-afri-text"
                      >
                        <option value="Cocody">Cocody</option>
                        <option value="Yopougon">Yopougon</option>
                        <option value="Plateau">Plateau</option>
                        <option value="Marcory">Marcory</option>
                        <option value="Treichville">Treichville</option>
                        <option value="Grand-Bassam">Grand-Bassam</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Description des exigences et compétences</label>
                    <textarea 
                      placeholder="Indiquez l'expérience requise, le lieu des auditions physiques, la tenue à porter..."
                      value={castingDesc}
                      onChange={e => setCastingDesc(e.target.value)}
                      rows={2}
                      className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl focus:border-[#D4AF37] outline-none text-gray-900 dark:text-afri-text font-sans"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowCastingForm(false)}
                      className="px-4 py-2 border border-gray-200 dark:border-gray-800 text-xs text-afri-text-sec rounded-xl hover:text-afri-text transition"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-afri-text text-xs font-black uppercase rounded-xl transition"
                    >
                      Diffuser l'audition 📢
                    </button>
                  </div>
                </form>
              )}

              {/* Special Filter Églises / Chorales toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 dark:bg-afri-bg/35 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-850">
                <div className="flex items-center gap-2">
                  <select 
                    value={castingCommune}
                    onChange={e => setCastingCommune(e.target.value)}
                    className="bg-white dark:bg-afri-bg-sec p-2 text-xs border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-afri-text focus:border-[#D4AF37] cursor-pointer"
                  >
                    <option value="all">Secteur Abidjan (Tous)</option>
                    <option value="Cocody">Cocody</option>
                    <option value="Yopougon">Yopougon</option>
                    <option value="Marcory">Marcory</option>
                    <option value="Plateau">Plateau</option>
                  </select>

                  {/* Church network checkbox toggle */}
                  <button
                    onClick={() => setIsEgliseFilter(!isEgliseFilter)}
                    className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${isEgliseFilter ? "bg-amber-500/10 border-amber-500/25 text-[#D4AF37]" : "bg-white dark:bg-afri-bg-sec border-gray-200 dark:border-gray-800 text-afri-text-sec"}`}
                  >
                     ⛪ Réseau Églises & Chorales
                  </button>
                </div>
                <span className="text-[10px] text-afri-text-sec font-mono">Dossiers certifiés par l'arbitrage</span>
              </div>

              {/* Render listings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCastings
                  .filter(c => !isEgliseFilter || c.title.toLowerCase().includes("chor") || c.title.toLowerCase().includes("églis") || c.rolesNeeded.toLowerCase().includes("backup") || c.description.toLowerCase().includes("paroiss"))
                  .map((cast) => {
                    const hasApplied = cast.applications?.some(a => a.userId === currentUserProfile?.uid);
                    const isMyOwnCasting = cast.creatorId === currentUserProfile?.uid;

                    return (
                      <div 
                        key={cast.id}
                        className="bg-white dark:bg-afri-bg-sec border border-gray-150 dark:border-gray-800 p-5 rounded-3xl space-y-4 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-center bg-gray-5 transition p-3 rounded-xl">
                            <div className="space-y-0.5">
                              <span className="text-[9px] uppercase font-mono font-extrabold text-[#D4AF37]">AUDITION AUDI-CASTING</span>
                              <h4 className="text-xs font-black uppercase text-afri-text tracking-tight leading-tight mt-0.5">{cast.title}</h4>
                            </div>
                            <span className="px-2 py-0.5 text-[8.5px] font-bold uppercase rounded-lg bg-teal-500/10 text-teal-400 shrink-0 font-mono">{cast.commune}</span>
                          </div>

                          <p className="text-xs text-afri-text-sec font-sans leading-relaxed p-2.5 bg-afri-bg/20 rounded-xl italic">
                            "{cast.description || "Aucun détail complémentaire spécifié par le producteur."}"
                          </p>

                          <div className="grid grid-cols-2 gap-3.5 text-[10.5px] font-mono text-gray-300">
                            <div className="space-y-0.5">
                              <span className="text-gray-550 block">Rôles requis :</span>
                              <span className="text-afri-text font-bold">{cast.rolesNeeded}</span>
                            </div>
                            <div className="space-y-0.5 text-right">
                              <span className="text-gray-550 block">Budget :</span>
                              <span className="text-[#D4AF37] font-black">{cast.budget || "À débattre"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Candidates review dashboard for the organizer */}
                        {isMyOwnCasting && cast.applications && cast.applications.length > 0 && (
                          <div className="bg-afri-bg-sec p-3 rounded-2xl space-y-2.5 border border-gray-850">
                            <h5 className="text-[8.5px] font-black uppercase text-[#D4AF37] font-mono">Candidatures reçues ({cast.applications.length}) :</h5>
                            <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                              {cast.applications.map((app, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[10px] bg-afri-bg p-2 rounded-xl text-gray-300 font-mono">
                                  <div>
                                    <p className="font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">{app.userName}</p>
                                    <span className="text-[9px] text-afri-text-sec">{app.phone}</span>
                                  </div>
                                  
                                  {/* Candidate review triggers */}
                                  <div className="flex gap-1">
                                    <button 
                                      onClick={() => handleUpdateCastingApplication(cast.id, app.userId, "convoc")}
                                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${app.status === "convoc" ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-800 text-afri-text-sec"}`}
                                    >
                                      Convoquer
                                    </button>
                                    <button 
                                      onClick={() => handleUpdateCastingApplication(cast.id, app.userId, "refus")}
                                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${app.status === "refus" ? "bg-red-500/20 text-red-400" : "bg-gray-800 text-afri-text-sec"}`}
                                    >
                                      Refuser
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
                          <span className="text-[9px] text-afri-text-sec font-mono">Délai : {cast.deadline}</span>
                          
                          {!isMyOwnCasting && (
                            <button
                              onClick={() => handleApplyCasting(cast.id)}
                              disabled={hasApplied}
                              className={`px-4 py-2 text-xs font-black uppercase rounded-xl transition ${hasApplied ? "bg-afri-bg-sec/10 text-[#D4AF37] cursor-not-allowed border border-[#D4AF37]/20" : "bg-emerald-500 hover:bg-emerald-600 text-afri-text cursor-pointer"}`}
                            >
                              {hasApplied ? "✓ Déjà Postulé" : "Postuler d'un clic 🚀"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ==================== 6. ANNONCES VOCALES ==================== */}
          {activeTab === "voix" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase text-gray-900 dark:text-afri-text">📻 LES ANNONCES VOCALES (AUDIO DIRECT)</h3>
                  <p className="text-xs text-afri-text-sec">Enregistrez de courtes bandes vocales (ex: "cherche clavier pour ce soir") visibles instantanément.</p>
                </div>
                <button
                  onClick={() => setShowVoiceForm(!showVoiceForm)}
                  className="px-4 py-2 bg-afri-bg-sec hover:bg-afri-bg-sec/80 text-black text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Diffuser ma voix
                </button>
              </div>

              {/* Form Voice collapse */}
              {showVoiceForm && (
                <form 
                  onSubmit={handlePublishVoice}
                  className="bg-gray-50 dark:bg-afri-bg-sec border border-[#2B2B2B] p-6 rounded-2xl space-y-4"
                >
                  <h4 className="text-xs font-black text-[#D4AF37] uppercase">ENREGISTRER DE LA VOIX </h4>
                  
                  <div className="space-y-1.5 p-0.5">
                    <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Que cherchez vous d'un cri vocal ? *</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Cherche un pianiste jazz pour samedi VIP à Marcory..."
                      value={voiceTitle}
                      onChange={e => setVoiceTitle(e.target.value)}
                      className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-[#D4AF37] text-gray-900 dark:text-afri-text"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 p-0.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-afri-text-sec">Commune Abidjan *</label>
                      <select 
                        value={voiceCom}
                        onChange={e => setVoiceCom(e.target.value)}
                        className="w-full bg-white dark:bg-afri-bg p-3 text-xs border border-gray-200 dark:border-gray-800 rounded-xl focus:border-[#D4AF37] outline-none text-gray-900 dark:text-afri-text"
                      >
                        <option value="Cocody">Cocody</option>
                        <option value="Yopougon">Yopougon</option>
                        <option value="Marcory">Marcory</option>
                        <option value="Plateau">Plateau</option>
                      </select>
                    </div>

                    {/* Microphone design recorder simulate */}
                    <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl text-red-500">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-ping shrink-0" />
                      <span className="text-[10.5px] font-black uppercase font-mono tracking-wider">🎙️ Prise micro audio ok !</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowVoiceForm(false)}
                      className="px-4 py-2 border border-gray-200 dark:border-gray-800 text-xs text-afri-text-sec rounded-xl hover:text-afri-text transition"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2.5 bg-red-500 text-afri-text text-xs font-black uppercase rounded-xl transition"
                    >
                      Diffuser la voix 📻
                    </button>
                  </div>
                </form>
              )}

              {/* Commune Filters */}
              <div className="flex gap-2 bg-gray-50 dark:bg-afri-bg/35 p-3 rounded-2xl border border-gray-100 dark:border-gray-850">
                <select 
                  value={voiceCommune}
                  onChange={e => setVoiceCommune(e.target.value)}
                  className="bg-white dark:bg-afri-bg-sec p-2 text-xs border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-afri-text focus:border-[#D4AF37] cursor-pointer"
                >
                  <option value="all">Secteur Abidjan (Toutes voix)</option>
                  <option value="Cocody">Cocody</option>
                  <option value="Yopougon">Yopougon</option>
                  <option value="Marcory">Marcory</option>
                </select>
              </div>

              {/* Grid Voice listings with sound-amplitude simulator */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredVoices.map((v) => {
                  const isPlaying = playingVoiceId === v.id;
                  
                  return (
                    <div 
                      key={v.id}
                      className="bg-white dark:bg-afri-bg-sec border border-gray-150 dark:border-gray-800 p-5 rounded-3xl space-y-4"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={v.userAvatar} 
                          alt="avatar" 
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full bg-gray-200 border-2 border-amber-500/20"
                        />
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="text-xs font-black font-mono text-afri-text truncate uppercase">{v.userName}</h4>
                          <span className="text-[9.5px] text-afri-text-sec font-mono text-ellipsis block truncate">Preneur à {v.commune} d'Abidjan</span>
                        </div>
                      </div>

                      {/* Header block voc */}
                      <p className="text-[11.5px] text-gray-300 font-bold leading-tight font-sans italic">
                        "{v.title}"
                      </p>

                      {/* Audio sound wave simulation container */}
                      <div className="flex items-center gap-3.5 bg-afri-bg p-3 rounded-2xl border border-gray-850">
                        <button
                          onClick={() => {
                            if (isPlaying) {
                              setPlayingVoiceId(null);
                            } else {
                              setPlayingVoiceId(v.id);
                              setPlayingProgress(0);
                            }
                          }}
                          className="h-10 w-10 bg-afri-bg-sec text-black rounded-full flex items-center justify-center shrink-0 shadow-lg cursor-pointer hover:bg-afri-bg-sec/80 transition-transform active:scale-95"
                        >
                          {isPlaying ? <Pause className="w-4.5 h-4.5" /> : <Play className="w-4.5 h-4.5 fill-current" />}
                        </button>

                        <div className="w-full space-y-1 min-w-0">
                          {/* Animated sound wave bars or generic wave */}
                          <div className="flex items-end gap-0.5 h-7">
                            {Array.from({ length: 28 }).map((_, i) => {
                              // generate pseudo-random heights that animate when playing
                              const randomHeight = isPlaying 
                                ? Math.sin(i * 0.5 + playingProgress * 0.2) * 12 + 16 
                                : Math.max(4, (i % 3 === 0 ? 12 : i % 2 === 0 ? 7 : 4));
                              
                              return (
                                <div 
                                  key={i} 
                                  className={`w-1 rounded-t transition-all duration-300 ${isPlaying ? "bg-afri-bg-sec" : "bg-gray-800"}`}
                                  style={{ height: `${randomHeight}px` }}
                                />
                              );
                            })}
                          </div>
                          
                          {/* Beautiful Spacious Duration / Minutes Track Info */}
                          <div className="flex justify-between items-center text-[10px] sm:text-xs font-mono font-bold text-amber-500/90 pt-2 border-t border-afri-border/40">
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              {isPlaying ? `LECTURE : 00:${Math.floor(playingProgress / 10).toString().padStart(2, "0")}` : "PRÊT À LIRE"}
                            </span>
                            <span className="flex items-center gap-1 uppercase tracking-wide">
                              ⏳ DURÉE : 00:{v.duration ? v.duration.toString().padStart(2, "0") : "10"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== 7. BOUTIQUE DE RECOMPENSES ==================== */}
          {activeTab === "recompenses" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase text-gray-900 dark:text-afri-text">🎁 BOUTIQUE DES RÉCOMPENSES AFRIGOMBO</h3>
                <p className="text-xs text-afri-text-sec">Échangez vos points d'entraide cumulés contre des avantages de mise en avant et des abonnements gratuits.</p>
              </div>

              {/* Point highlights card */}
              <div className="p-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 rounded-3xl border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1.5">
                  <span className="text-[9.5px] text-emerald-450 font-black uppercase font-mono">FIDÉLITÉ ARTISTIQUE</span>
                  <h4 className="text-sm font-black text-afri-text uppercase">Solde Gagné en temps réel</h4>
                  <p className="text-xs text-gray-300">Votre score est de : <span className="text-[#D4AF37] font-black">{currentUserProfile?.points || 0} Points Gumbo</span>. Continuez d'aider les autres !</p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => alert("Points d'entraide cumulés :\n- Créer un concert : +150 pts\n- Sécuriser Gombo Safe : +100 pts\n- Réponse à un Renfort Express : +120 pts\n- Noter un service de production : +50 pts")}
                    className="px-4 py-2 bg-emerald-500/20 text-emerald-450 border border-emerald-500/20 text-[10px] font-black uppercase rounded-xl transition font-mono"
                  >
                    Table de gains
                  </button>
                </div>
              </div>

              {/* Store grid listings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Reward Item 1 */}
                <div className="bg-white dark:bg-afri-bg-sec border border-gray-150 dark:border-gray-800 p-5 rounded-3xl space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="px-2.5 py-0.5 text-[8.5px] font-black uppercase bg-amber-500/15 text-[#D4AF37] rounded-lg font-mono">SPOTLIGHT</span>
                    <h4 className="text-xs font-black uppercase text-afri-text font-sans mt-1">Dossier Spotlight 48h</h4>
                    <p className="text-xs text-afri-text-sec leading-relaxed">Fixez votre fiche d'artiste tout en haut des vibes à Abidjan pour un maximum de propositions téléphoniques directes.</p>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 mt-4 pt-4">
                    <span className="text-xs font-extrabold font-mono text-[#D4AF37]">400 POINTS</span>
                    <button 
                      onClick={() => handleRedeemBenefit(400, "Mise en avant Spotlight 48h")}
                      className="px-3.5 py-2 bg-afri-bg-sec/10 hover:bg-afri-bg-sec text-[#D4AF37] hover:text-[#0B0B0B] text-[10px] font-black uppercase rounded-lg border border-[#D4AF37]/20 transition cursor-pointer"
                    >
                      Échanger ⚡
                    </button>
                  </div>
                </div>

                {/* Reward Item 2 */}
                <div className="bg-white dark:bg-afri-bg-sec border border-gray-150 dark:border-gray-800 p-5 rounded-3xl space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="px-2.5 py-0.5 text-[8.5px] font-black uppercase bg-emerald-500/15 text-emerald-400 rounded-lg font-mono">EXPRESS CHECK</span>
                    <h4 className="text-xs font-black uppercase text-afri-text font-sans mt-1">✓ Talent Certifié VIP</h4>
                    <p className="text-xs text-afri-text-sec leading-relaxed">Passez en canal de validation prioritaire sans justificatif technique. Badge visible instantanément sur votre profil.</p>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 mt-4 pt-4">
                    <span className="text-xs font-extrabold font-mono text-[#D4AF37]">600 POINTS</span>
                    <button 
                      onClick={() => handleRedeemBenefit(600, "✓ Talent Certifié Prioritaire")}
                      className="px-3.5 py-2 bg-afri-bg-sec/10 hover:bg-afri-bg-sec text-[#D4AF37] hover:text-[#0B0B0B] text-[10px] font-black uppercase rounded-lg border border-[#D4AF37]/20 transition cursor-pointer"
                    >
                      Échanger ⚡
                    </button>
                  </div>
                </div>

                {/* Reward Item 3 */}
                <div className="bg-white dark:bg-afri-bg-sec border border-gray-150 dark:border-gray-800 p-5 rounded-3xl space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="px-2.5 py-0.5 text-[8.5px] font-black uppercase bg-blue-500/15 text-blue-400 rounded-lg font-mono">ABONNEMENT</span>
                    <h4 className="text-xs font-black uppercase text-afri-text font-sans mt-1">Premium Gold 30 Jours</h4>
                    <p className="text-xs text-afri-text-sec leading-relaxed">Débloquez l'intégration de vidéos YouTube illimitées, accès direct aux numéros de téléphones et messagerie sans limites.</p>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 mt-4 pt-4">
                    <span className="text-xs font-extrabold font-mono text-[#D4AF37]">1000 POINTS</span>
                    <button 
                      onClick={() => handleRedeemBenefit(1000, "Premium Gold 1 Mois gratuit")}
                      className="px-3.5 py-2 bg-afri-bg-sec/10 hover:bg-afri-bg-sec text-[#D4AF37] hover:text-[#0B0B0B] text-[10px] font-black uppercase rounded-lg border border-[#D4AF37]/20 transition cursor-pointer"
                    >
                      Échanger ⚡
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
