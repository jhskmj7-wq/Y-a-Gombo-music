import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Award, Sparkles, Zap, Trophy, ShieldCheck, 
  Video, DollarSign, Smartphone, Check, Play, Music, Upload, Eye, Clock, Trash, Disc
} from "lucide-react";
import { gomboDB } from "../firebase";
import { UserProfile, Gombo, SocialPost, GomboPayment, CertificationRequest } from "../types";

interface CertificationHubProps {
  currentUserProfile: UserProfile | null;
  onRefreshProfile: () => void;
  onShowAuth: () => void;
  onNavigateView: (view: string) => void;
}

export default function CertificationHub({ 
  currentUserProfile, 
  onRefreshProfile, 
  onShowAuth,
  onNavigateView 
}: CertificationHubProps) {
  const [activeTab, setActiveTab] = useState<"badges" | "boost" | "payments" | "admin">("badges");
  const [loading, setLoading] = useState(false);
  
  // Simulation & Upload States
  const [showCertModal, setShowCertModal] = useState(false);
  const [selectedMobileNetwork, setSelectedMobileNetwork] = useState<string>("Wave");
  const [mobilePhoneNumber, setMobilePhoneNumber] = useState(currentUserProfile?.phone || "");
  const [simulatedSuccess, setSimulatedSuccess] = useState(false);

  // Form States for Certification Folder
  const [artistName, setArtistName] = useState(currentUserProfile?.artistName || "");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(
    currentUserProfile?.specialty ? [currentUserProfile.specialty] : []
  );
  const [experienceText, setExperienceText] = useState("");
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [bioInput, setBioInput] = useState(currentUserProfile?.bio || "");

  // File Upload drag & drop
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Boosting state
  const [myGombos, setMyGombos] = useState<Gombo[]>([]);
  const [myPosts, setMyPosts] = useState<SocialPost[]>([]);
  const [selectedItemForBoost, setSelectedItemForBoost] = useState<{ id: string; title: string; type: "gombo" | "post" } | null>(null);
  const [selectedBoostDuration, setSelectedBoostDuration] = useState<"24h" | "3d" | "7d">("24h");
  const [showBoostModal, setShowBoostModal] = useState(false);

  // Vetting history
  const [paymentsHistory, setPaymentsHistory] = useState<GomboPayment[]>([]);
  const [myRequests, setMyRequests] = useState<CertificationRequest[]>([]);
  const [adminRequests, setAdminRequests] = useState<CertificationRequest[]>([]);

  // Gombo ID (VerificationRequest) Tiers
  const [gomboRequest, setGomboRequest] = useState<any>(null); // Level 2 request
  const [adminVerificationRequests, setAdminVerificationRequests] = useState<any[]>([]); // Gombo ID reqs list
  const [showGomboFormModal, setShowGomboFormModal] = useState(false);
  const [gomboFullName, setGomboFullName] = useState("");
  const [gomboPhotoUrl, setGomboPhotoUrl] = useState("");
  const [gomboCommune, setGomboCommune] = useState("");
  const [gomboMetier, setGomboMetier] = useState("");
  const [gomboWhatsapp, setGomboWhatsapp] = useState("");
  const [gomboSelfieUrl, setGomboSelfieUrl] = useState("https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150");
  const [gomboMediaUrl, setGomboMediaUrl] = useState("");
  const [gomboErrorMsg, setGomboErrorMsg] = useState("");
  const [gomboSuccess, setGomboSuccess] = useState(false);

  // Sync personal fields when currentUserProfile is defined
  useEffect(() => {
    if (currentUserProfile) {
      setGomboFullName(`${currentUserProfile.firstName || ""} ${currentUserProfile.lastName || ""}`.trim() || currentUserProfile.artistName || "");
      setGomboPhotoUrl(currentUserProfile.photoURL || currentUserProfile.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150");
      setGomboCommune(currentUserProfile.commune || "Cocody");
      setGomboMetier(currentUserProfile.specialty || "Musicien");
      setGomboWhatsapp(currentUserProfile.whatsapp || currentUserProfile.phone || "");
    }
  }, [currentUserProfile]);

  // Show live previews of mock uploaded media
  const [showPreviewUrl, setShowPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (currentUserProfile) {
      loadUserPostings();
      loadHistory();
    }
  }, [currentUserProfile]);

  const loadUserPostings = async () => {
    if (!currentUserProfile) return;
    try {
      const allOffers: Gombo[] = JSON.parse(localStorage.getItem("gombo_offers") || "[]");
      setMyGombos(allOffers.filter(g => g.clientId === currentUserProfile.uid));

      const allPosts: SocialPost[] = JSON.parse(localStorage.getItem("gombo_social_posts") || "[]");
      setMyPosts(allPosts.filter(p => p.userId === currentUserProfile.uid || p.authorId === currentUserProfile.uid));
    } catch (e) {
      console.error("Error loading user postings", e);
    }
  };

  const loadHistory = async () => {
    if (!currentUserProfile) return;
    try {
      const payments = await gomboDB.getPayments(currentUserProfile.uid);
      setPaymentsHistory(payments);
      const reqs = await gomboDB.getCertificationRequests(currentUserProfile.uid);
      setMyRequests(reqs);
      
      const allAdminReqs = await gomboDB.getAllCertificationRequests();
      setAdminRequests(allAdminReqs);

      // Load Level 2 Gombo ID state
      const gReq = await gomboDB.getVerificationRequestByUser(currentUserProfile.uid);
      setGomboRequest(gReq);

      const allVerifReqs = await gomboDB.getAllVerificationRequests();
      setAdminVerificationRequests(allVerifReqs);
    } catch (e) {
      console.error("Error loading monetization histories", e);
    }
  };

  const reloadAdminList = async () => {
    try {
      const allAdminReqs = await gomboDB.getAllCertificationRequests();
      setAdminRequests(allAdminReqs);
    } catch (e) {
      console.error(e);
    }
  };

  const getBoostPrice = (duration: "24h" | "3d" | "7d") => {
    switch(duration) {
      case "24h": return 500;
      case "3d": return 1000;
      case "7d": return 2000;
    }
  };

  // Profile score algorithm (0-100)
  const calculateProfileScore = () => {
    if (!currentUserProfile) return 0;
    let score = 0;
    // 1. Photo exists? (20%)
    if (currentUserProfile.photoURL || currentUserProfile.avatarUrl) score += 20;
    // 2. Bio filled? (20%)
    if (currentUserProfile.bio && currentUserProfile.bio.trim().length > 5) score += 20;
    // 3. Specialties designated? (20%)
    if (currentUserProfile.specialty || (currentUserProfile.specialties && currentUserProfile.specialties.length > 0)) score += 20;
    // 4. Music genres defined? (20%)
    if (currentUserProfile.musicGenre || (currentUserProfile.musicGenres && currentUserProfile.musicGenres.length > 0)) score += 20;
    // 5. Activity exists? (e.g. Completed gigs, applications or published social posts/gombos) (20%)
    if (
      (currentUserProfile.gigsCompleted && currentUserProfile.gigsCompleted > 0) ||
      (currentUserProfile.applicationsSent && currentUserProfile.applicationsSent > 0) ||
      myPosts.length > 0 ||
      myGombos.length > 0 ||
      currentUserProfile.isProfileComplete
    ) {
      score += 20;
    }
    return score;
  };

  const score = calculateProfileScore();

  // Levels mapping
  const getProfileLevel = (currentScore: number) => {
    if (currentScore <= 30) {
      return { 
        name: "Nouveau Talent", 
        badge: "⚪ Nouveau Talent", 
        color: "text-zinc-400 bg-zinc-100/50 border-zinc-200", 
        barColor: "bg-zinc-400",
        desc: "Commencez à compléter votre profil à Abidjan pour grandir." 
      };
    }
    if (currentScore <= 60) {
      return { 
        name: "Talent Confirmé", 
        badge: "🔵 Talent Confirmé", 
        color: "text-blue-600 bg-blue-50/50 border-blue-200", 
        barColor: "bg-blue-600",
        desc: "Bonne expérience ! Soumettez vos démos de chant ou guitare." 
      };
    }
    if (currentScore <= 85) {
      return { 
        name: "Talent Certifié", 
        badge: "🟢 Talent Certifié", 
        color: "text-emerald-600 bg-emerald-50/50 border-emerald-200", 
        barColor: "bg-emerald-600",
        desc: "Recommandé par Y'A GOMBO. Visibilité prioritaire et fiable." 
      };
    }
    return { 
      name: "Boss du Gombo", 
      badge: "🟣 Boss du Gombo", 
      color: "text-purple-600 bg-purple-50/50 border-purple-200", 
      barColor: "bg-purple-600",
      desc: "Légende absolue du showbiz ! Star incontestée des gombos." 
    };
  };

  const level = getProfileLevel(score);

  // specialties selector
  const handleAddSpecialty = () => {
    if (specialtyInput.trim() && !selectedSpecialties.includes(specialtyInput.trim())) {
      setSelectedSpecialties([...selectedSpecialties, specialtyInput.trim()]);
      setSpecialtyInput("");
    }
  };

  const handleRemoveSpecialty = (item: string) => {
    setSelectedSpecialties(selectedSpecialties.filter(s => s !== item));
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    setSelectedFile(file);
    // Simulate real upload progress bar
    setUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          // Standard browser blob previews
          const dummyUrl = URL.createObjectURL(file);
          setUploadedUrl(dummyUrl);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  // Submission
  const handleApplyCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile) {
      onShowAuth();
      return;
    }

    setLoading(true);
    
    // Choose what evidence URL to send
    const finalMediaUrl = mediaUrlInput || uploadedUrl || "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

    try {
      // 1. Publish official certification Request to collection
      await gomboDB.publishCertificationRequest({
        userId: currentUserProfile.uid,
        artistName: artistName || `${currentUserProfile.firstName} ${currentUserProfile.lastName}`,
        specialties: selectedSpecialties.length > 0 ? selectedSpecialties : [currentUserProfile.specialty || "Musicien"],
        experience: experienceText || "3+ ans",
        mediaUrl: finalMediaUrl
      });

      // 2. Publish Payment log for financial preparation tracking
      await gomboDB.publishPayment({
        userId: currentUserProfile.uid,
        userName: artistName || `${currentUserProfile.firstName} ${currentUserProfile.lastName}`,
        amount: 1500, // standard pricing interval 1000 - 2000
        purpose: "🏆 Dossier de Certification d'Artiste",
        provider: selectedMobileNetwork as any,
        phoneNumber: mobilePhoneNumber,
        status: "success"
      });

      setSimulatedSuccess(true);
      onRefreshProfile();
      loadHistory();
    } catch(err) {
      console.error(err);
      alert("Erreur lors de l'envoi de votre dossier de certification.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyGomboID = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile) {
      onShowAuth();
      return;
    }
    setGomboErrorMsg("");
    if (!gomboFullName.trim() || !gomboCommune.trim() || !gomboMetier.trim() || !gomboWhatsapp.trim()) {
      setGomboErrorMsg("Veuillez remplir les champs obligatoires (photo, nom complet, commune, métier).");
      return;
    }
    setLoading(true);
    try {
      await gomboDB.createVerificationRequest({
        userId: currentUserProfile.uid,
        userEmail: currentUserProfile.email || "",
        fullName: gomboFullName.trim(),
        photoUrl: gomboPhotoUrl || currentUserProfile.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
        commune: gomboCommune.trim(),
        metier: gomboMetier.trim(),
        whatsapp: gomboWhatsapp.trim(),
        selfieUrl: gomboSelfieUrl,
        mediaUrl: gomboMediaUrl.trim() || "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      });
      setGomboSuccess(true);
      onRefreshProfile();
      loadHistory();
    } catch (err: any) {
      console.error(err);
      setGomboErrorMsg("Une erreur s'est produite lors de la soumission de votre demande Gombo ID.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminVettingGomboID = async (reqId: string, status: "approved" | "rejected") => {
    setLoading(true);
    try {
      await gomboDB.updateVerificationRequestStatus(reqId, status);
      onRefreshProfile();
      loadHistory();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Instant simulation toggle for Testing purposes
  const handleToggleBadge = async (badge: string) => {
    if (!currentUserProfile) {
      onShowAuth();
      return;
    }
    const currentBadges = currentUserProfile.badges || [];
    let updatedBadges: string[];
    if (currentBadges.includes(badge)) {
      updatedBadges = currentBadges.filter(b => b !== badge);
    } else {
      updatedBadges = [...currentBadges, badge];
    }

    try {
      setLoading(true);
      await gomboDB.updateUserProfile(currentUserProfile.uid, {
        badges: updatedBadges
      });
      onRefreshProfile();
    } catch (e) {
      alert("Erreur lors de la mise à jour des badges.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyBoost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile || !selectedItemForBoost) return;

    setLoading(true);
    const price = getBoostPrice(selectedBoostDuration);
    const days = selectedBoostDuration === "24h" ? 1 : selectedBoostDuration === "3d" ? 3 : 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    try {
      await gomboDB.publishPayment({
        userId: currentUserProfile.uid,
        userName: currentUserProfile.artistName || `${currentUserProfile.firstName} ${currentUserProfile.lastName}`,
        amount: price,
        purpose: `🚀 Boost ${selectedBoostDuration} : ${selectedItemForBoost.title}`,
        provider: selectedMobileNetwork as any,
        phoneNumber: mobilePhoneNumber,
        status: "success"
      });

      await gomboDB.publishBoost({
        userId: currentUserProfile.uid,
        userName: currentUserProfile.artistName || `${currentUserProfile.firstName} ${currentUserProfile.lastName}`,
        targetType: selectedItemForBoost.type,
        targetId: selectedItemForBoost.id,
        targetTitle: selectedItemForBoost.title,
        duration: selectedBoostDuration,
        price,
        expiresAt
      });

      alert(`🚀 Votre publication "${selectedItemForBoost.title}" bénéficie d'un Boost de ${selectedBoostDuration}.`);
      setShowBoostModal(false);
      setSelectedItemForBoost(null);
      loadUserPostings();
      loadHistory();
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Admin Vetting Controls (Approve/Reject)
  const handleAdminVetting = async (reqId: string, status: "Approuvé" | "Refusé") => {
    try {
      setLoading(true);
      await gomboDB.updateCertificationRequestStatus(reqId, status);
      await reloadAdminList();
      onRefreshProfile();
      alert(`Dossier #${reqId.substring(0, 6)} de certification mis à jour : ${status === 'Approuvé' ? 'APPROUVÉ 🟢' : 'REFUSÉ 🔴'}`);
    } catch(e) {
      console.error(e);
      alert("Erreur admin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="certification-root" className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      
      {/* Visual Rich Header */}
      <div id="premium-header-panel" className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-tr from-slate-950 via-[#19112F] to-slate-900 border border-purple-900/40 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-orange-600/10 blur-3xl rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex p-3 bg-gradient-to-r from-orange-500 to-purple-600 rounded-2xl shadow-lg ring-4 ring-purple-950/50">
              <Trophy className="w-8 h-8 text-yellow-300 animate-bounce" />
            </div>
            <h1 className="text-3xl font-black tracking-tight uppercase">
              Certification des Musiciens <span className="text-orange-400">CI</span>
            </h1>
            <p className="text-xs text-zinc-300 max-w-xl leading-relaxed">
              Devenez un artiste de confiance certifié sur <strong>Y'A GOMBO</strong>. Augmentez votre crédibilité auprès des recruteurs, promoteurs d'événements et hôtels de Côte d'Ivoire.
            </p>
            <div className="inline-flex items-center gap-2 px-3  bg-orange-550/15 text-orange-400 border border-orange-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
              🟢 Système de dossier de certification opérationnel
            </div>
          </div>

          {/* Interactive Profile Score Circle */}
          {currentUserProfile && (
            <div id="score-meter" className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 w-full md:w-auto flex flex-col items-center justify-center space-y-3">
              <div className="text-center">
                <div className="text-[10px] uppercase font-black tracking-widest text-[#FF7A00]">Score de Profil</div>
                <div className="text-xs text-zinc-400">Complétion Artistique</div>
              </div>
              <div className="relative flex items-center justify-center w-24 h-24">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="6" className="text-white/10 fill-none" />
                  <circle 
                    cx="40" 
                    cy="40" 
                    r="32" 
                    stroke="currentColor" 
                    strokeWidth="6" 
                    className="text-[#FF7A00] fill-none"
                    strokeDasharray={2 * Math.PI * 32}
                    strokeDashoffset={2 * Math.PI * 32 * (1 - score / 100)} 
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute font-black text-lg text-white">{score}%</div>
              </div>
              <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${level.color}`}>
                {score <= 30 ? "⚪" : score <= 60 ? "🔵" : score <= 85 ? "🟢" : "🟣"} {level.name}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation tabs */}
      <div id="tab-navigation" className="flex border-b border-gray-100 dark:border-zinc-805">
        {[
          { id: "badges", label: "🏆 Badges & Dossier", icon: Award },
          { id: "boost", label: "🚀 Booster mes posts", icon: Zap },
          { id: "payments", label: "💳 Transactions", icon: DollarSign },
          { id: "admin", label: "🛠️ Console Vetting Admin", icon: Eye }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 pb-4 text-xs font-black uppercase border-b-2 text-center transition-colors flex items-center justify-center gap-2 ${
                activeTab === tab.id 
                  ? "border-purple-600 text-purple-600 dark:text-purple-400" 
                  : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* VIEW 1: BADGES AND DOSSIER SUBMISSION */}
      {activeTab === "badges" && (
        <div id="badges-panel" className="space-y-8 animate-fadeIn text-left">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Col: Two Verification Levels */}
            <div id="levels-container" className="md:col-span-2 space-y-6">
              
              {/* LEVEL 1: GOOGLE SIGN-IN */}
              <div className="bg-white dark:bg-[#15151c] p-6 rounded-2xl border border-gray-100 dark:border-zinc-850 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-gray-50 dark:border-zinc-900 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">1</div>
                    <div>
                      <h3 className="text-sm font-black text-gray-950 dark:text-white uppercase">Niveau 1 : Identité Google</h3>
                      <p className="text-[10px] text-zinc-400">Authentification de base obligatoire</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    🟢 Vérifié Google
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                  Votre compte a été authentifié de manière sécurisée par Google. Ce badge certifie que votre adresse e-mail unique est vérifiée et liée à un utilisateur réel d'Abidjan.
                </p>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-zinc-400">
                  <span>Adresse e-mail liée :</span>
                  <span className="font-mono text-[11px] text-gray-950 dark:text-white">{currentUserProfile?.email || "Connecté"}</span>
                </div>
              </div>

              {/* LEVEL 2: GOMBO ID */}
              <div className="bg-white dark:bg-[#15151c] p-6 rounded-2xl border border-gray-100 dark:border-zinc-850 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-gray-50 dark:border-zinc-900 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/40 text-[#7C3AED] flex items-center justify-center font-bold">2</div>
                    <div>
                      <h3 className="text-sm font-black text-gray-950 dark:text-white uppercase hover:text-purple-650">Niveau 2 : Gombo ID</h3>
                      <p className="text-[10px] text-zinc-400">Dossier de compétences artistiques complet</p>
                    </div>
                  </div>

                  {gomboRequest?.status === "approved" || currentUserProfile?.badges?.includes("🏆 Talent Certifié") ? (
                    <span className="px-2.5 py-1 bg-yellow-50 text-yellow-600 dark:bg-yellow-950/20 dark:text-yellow-400 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 border border-yellow-500/25">
                      🏆 Talent Certifié
                    </span>
                  ) : gomboRequest?.status === "pending" ? (
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 rounded-lg text-[10px] font-black uppercase animate-pulse">
                      ⏳ En cours
                    </span>
                  ) : gomboRequest?.status === "rejected" ? (
                    <span className="px-2.5 py-1 bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 rounded-lg text-[10px] font-black uppercase">
                      ❌ Rejeté
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400 rounded-lg text-[10px] font-black uppercase">
                      Pas Soumis
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                  Le <strong>Gombo ID</strong> certifie l'authenticité de vos compétences de scène, d'animation ou de production. Votre portfolio est analysé manuellement par nos experts showbiz pour débloquer l'accès prioritaire VIP aux cachets.
                </p>

                {/* Status Box or Submit Trigger */}
                {currentUserProfile ? (
                  <div className="p-4 bg-purple-50/10 dark:bg-purple-950/5 rounded-xl border border-purple-500/10 space-y-3">
                    {gomboRequest?.status === "approved" || currentUserProfile?.badges?.includes("🏆 Talent Certifié") ? (
                      <div className="space-y-2">
                        <div className="text-xs text-emerald-650 dark:text-emerald-400 font-extrabold uppercase flex items-center gap-1.5">
                          ✓ Gombo ID Approuvé !
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          Félicitations ! Vous disposez désormais de la certification <strong>🏆 Talent Certifié</strong> d'Abidjan à vie. Vos publications d'animation priment sur les recherches.
                        </p>
                      </div>
                    ) : gomboRequest?.status === "pending" ? (
                      <div className="space-y-2">
                        <div className="text-xs text-amber-650 dark:text-amber-400 font-extrabold uppercase flex items-center gap-1.5">
                          ⏳ Examen de votre dossier en cours
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          Notre jury artistique analyse actuellement votre selfie et votre média de compétences. Le délai de validation à Cocody est généralement de 2h à 12h.
                        </p>
                        <div className="text-[10px] border-t border-purple-500/10 pt-2 text-zinc-400">
                          📱 WhatsApp pro : <span className="font-mono text-white">{gomboRequest.whatsapp}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {gomboRequest?.status === "rejected" && (
                          <div className="text-xs text-red-650 dark:text-red-400 font-bold">
                            ⚠️ Votre dossier Gombo ID précédent a été rejeté. Vous pouvez modifier vos informations et postuler à nouveau.
                          </div>
                        )}
                        <p className="text-[11px] text-zinc-400">
                          Pour postuler, vous devez fournir vos informations de contact direct d'Abidjan, un selfie de conformité, et un lien d'audition artistique (YouTube/Drive/Soundcloud).
                        </p>
                        <button
                          onClick={() => {
                            setShowGomboFormModal(true);
                          }}
                          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-650 via-indigo-650 to-purple-800 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl hover:shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 uppercase"
                        >
                          🏆 Obtenir mon Gombo ID (Gratuit)
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={onShowAuth}
                    className="w-full py-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 text-xs font-black tracking-wider uppercase rounded-xl transition cursor-pointer"
                  >
                    Se connecter pour obtenir le Gombo ID
                  </button>
                )}
              </div>

            </div>

            {/* Right Col: Badges Sandbox (Interactive Toggles) */}
            <div id="badge-tiers" className="space-y-4">
              <h3 className="text-xs font-black tracking-wider text-zinc-400 uppercase">
                LES BADGES DE CONFIANCE Y&#39;A GOMBO
              </h3>

              <div className="space-y-3">
                <div className="p-4 bg-white dark:bg-[#15151c] border border-gray-105 dark:border-zinc-850 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-950 dark:text-white font-black">Niveau 1 : Vérifié Google</span>
                    <span className="px-2 py-0.5 rounded-md text-[9px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-500/20">🟢 ACTIF</span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-normal">
                    Associe votre compte à un profil Google authentique. Évite les faux profils.
                  </p>
                </div>

                <div className="p-4 bg-white dark:bg-[#15151c] border border-gray-105 dark:border-zinc-850 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-950 dark:text-white font-black">Niveau 2 : Gombo ID</span>
                    <span className="px-2 py-0.5 rounded-md text-[9px] bg-yellow-50 text-yellow-600 dark:bg-yellow-950/20 dark:text-yellow-400 border border-yellow-500/20">🏆 PRO</span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-normal">
                    Attribué manuellement après contrôle des aptitudes de scène, d'Abidjan et pièce administrative.
                  </p>
                </div>
              </div>

              {/* Sandbox controls */}
              <div className="p-4 bg-purple-50 dark:bg-purple-950/15 border border-purple-200/30 rounded-2xl text-xs space-y-2">
                <span className="font-extrabold text-[#7C3AED] dark:text-purple-300 flex items-center gap-1 uppercase">
                  🔧 Sandbox Testeur
                </span>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Basculez manuellement vos badges de démonstration ci-dessous pour apprécier instantanément le rendu sur vos fiches :
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["🟢 Vérifié Google", "🏆 Talent Certifié"].map(badgeName => {
                    const hasTag = currentUserProfile?.badges?.includes(badgeName) || false;
                    return (
                      <button
                        key={badgeName}
                        onClick={() => handleToggleBadge(badgeName)}
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                          hasTag 
                            ? "bg-[#7C3AED] border-purple-650 text-white" 
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400"
                        }`}
                      >
                        {badgeName.split(" ")[1]} {hasTag ? "✓" : "+"}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* Pricing Row */}
          <div className="bg-[#15151c] p-6 rounded-2xl border border-zinc-850 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-extrabold uppercase text-orange-400 tracking-wider">🔒 CONFIDENTIALITÉ ET SÉCURITÉ GARANTIE</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Vos selfies et vidéos pros sont chiffrés et confidentiels. Vos numéros WhatsApp et e-mails sont dissimulés pour contrer les spams, assurant que les négociations transitent exclusivement par la messagerie interne sécurisée ou de gré à gré après acceptation mutuelle.
              </p>
            </div>
            <div className="text-xl font-black text-white whitespace-nowrap bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800">
              0 FCFA <span className="text-xs font-normal text-zinc-500">Service Offert</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: BOOST PANELS */}
      {activeTab === "boost" && (
        <div id="boost-panel" className="space-y-6 animate-fadeIn">
          <div className="bg-amber-50 dark:bg-amber-950/10 text-amber-800 dark:text-amber-400 p-4.5 rounded-xl border border-amber-200/30 flex gap-3 text-xs leading-relaxed">
            <Clock className="w-5 h-5 flex-shrink-0 text-amber-500" />
            <div>
              <span className="font-extrabold text-orange-400 block uppercase mb-1">🚀 Comment fonctionne le Boost ?</span>
              Booster une publication de Gombo ou de Démo de chant lui permet d'apparaître instantanément sous la mention exclusive <span className="bg-orange-500 text-white px-1.5 py-0.5 rounded text-[10px] inline-block font-black">🚨 URGENT</span>. Ces publications sont épinglées en tête des recherches pour un maximum de gombos décrochés.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            
            {/* Gombos to boost */}
            <div className="space-y-4">
              <h3 className="font-black text-xs uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <Disc className="w-4 h-4" /> Vos besoins de gombos
              </h3>
              {myGombos.length === 0 ? (
                <div className="p-8 bg-white dark:bg-[#15151c] border border-gray-150 dark:border-zinc-850 rounded-2xl text-center text-xs text-gray-400">
                  Aucun gombo publié actuellement par votre compte.
                </div>
              ) : (
                <div className="space-y-3">
                  {myGombos.map(g => (
                    <div key={g.id} className="p-4 bg-white dark:bg-[#15151c] border border-gray-100 dark:border-zinc-855 rounded-xl flex items-center justify-between shadow-xs">
                      <div className="space-y-1">
                        <div className="font-bold text-xs text-gray-900 dark:text-white max-w-xs truncate">{g.title}</div>
                        <div className="text-[11px] text-gray-400">💰 {g.budget.toLocaleString()} FCFA • 📍 {g.commune}</div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedItemForBoost({ id: g.id, title: g.title, type: "gombo" });
                          setShowBoostModal(true);
                        }}
                        className="px-3.5 py-1.5 bg-orange-505 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[11px] uppercase rounded-lg transition shrink-0 cursor-pointer"
                      >
                        🚀 Booster
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Posts/Demos to boost */}
            <div className="space-y-4">
              <h3 className="font-black text-xs uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <Music className="w-4 h-4" /> Vos démos musicales de chant / instru
              </h3>
              {myPosts.length === 0 ? (
                <div className="p-8 bg-white dark:bg-[#15151c] border border-gray-150 dark:border-zinc-855 rounded-2xl text-center text-xs text-gray-400">
                  Aucune démo ou annonce enregistrée actuellement.
                </div>
              ) : (
                <div className="space-y-3">
                  {myPosts.map(p => (
                    <div key={p.id} className="p-4 bg-white dark:bg-[#15151c] border border-gray-100 dark:border-zinc-855 rounded-xl flex items-center justify-between shadow-xs">
                      <div className="space-y-1">
                        <div className="font-bold text-xs text-gray-900 dark:text-white max-w-xs truncate">{p.title || p.caption}</div>
                        <div className="text-[11px] text-gray-400">🎵 {p.type || "DÉMO"} • 🗣️ {p.commentsCount || 0} comms</div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedItemForBoost({ id: p.id, title: p.title || p.caption || "Démo", type: "post" });
                          setShowBoostModal(true);
                        }}
                        className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[11px] uppercase rounded-lg transition shrink-0 cursor-pointer"
                      >
                        🚀 Booster
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* VIEW 3: PAYMENTS TRANSACTIONS HISTORY */}
      {activeTab === "payments" && (
        <div id="payments-panel" className="space-y-6 animate-fadeIn">
          <div className="bg-white dark:bg-[#15151c] border border-gray-100 dark:border-zinc-855 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-gray-100 dark:border-zinc-850 bg-gray-50/50 dark:bg-zinc-900/30">
              <h3 className="font-black text-xs uppercase tracking-wider text-gray-900 dark:text-white">
                Historique de vos ordres de facturation à Abidjan (Simulé)
              </h3>
            </div>

            {paymentsHistory.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 space-y-2">
                <div className="text-4xl">💳</div>
                <div className="text-xs font-bold uppercase text-zinc-400">Aucun paiement local reçu</div>
                <p className="text-[10px] text-zinc-500">Les gombos boostés ou dossiers de certification s'inscriront ici.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-zinc-850">
                {paymentsHistory.map(p => (
                  <div key={p.id} className="p-4 flex items-center justify-between text-xs hover:bg-gray-50/20 dark:hover:bg-zinc-900/10 transition">
                    <div className="space-y-1">
                      <div className="font-bold text-gray-900 dark:text-white">{p.purpose}</div>
                      <div className="text-[10px] text-zinc-400 flex items-center gap-2">
                        <span>Canal : {p.provider} ({p.phoneNumber})</span>
                        <span>•</span>
                        <span>{new Date(p.createdAt).toLocaleDateString("fr-FR")} à {new Date(p.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-black text-sm text-gray-900 dark:text-white">{p.amount.toLocaleString()} FCFA</div>
                      <div className="inline-flex px-2 py-0.5 rounded-full text-[9px] uppercase font-black bg-emerald-100 text-emerald-800">
                        ✓ validé
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 4: ADMIN VETTING CONSOLE (APPROVE / REJECT) */}
      {activeTab === "admin" && (
        <div id="admin-panel" className="space-y-6 animate-fadeIn">
          <div className="bg-purple-950/15 border border-purple-800/20 p-5 rounded-2xl text-white space-y-2">
            <h4 className="text-xs font-black tracking-wider text-purple-300 uppercase flex items-center gap-1">
              🛠️ Console Modérateur Gombo Music preview
            </h4>
            <p className="text-[11px] text-zinc-300 leading-normal">
              Cette console confidentielle affiche **toutes les candidatures de certification** transmises dans la collection Firestore `certificationRequests` pour les besoins du test. Vous pouvez approuver ou rejeter n'importe quel dossier d'un simple clic pour observer instantanément l'attribution de la pastille verte partout.
            </p>
          </div>

          <div className="bg-white dark:bg-[#15151c] border border-gray-100 dark:border-zinc-855 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-gray-100 dark:border-zinc-850 bg-gray-50/50 dark:bg-zinc-900/30">
              <h3 className="font-bold text-xs uppercase tracking-tight text-gray-950 dark:text-white">
                Dossiers de compétences en attente d&#39;examen ({adminRequests.length})
              </h3>
            </div>

            {adminRequests.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 space-y-2">
                <div className="text-3xl">🧑‍🎓</div>
                <div className="text-xs text-zinc-400 font-bold uppercase">Aucun dossier de certification en attente</div>
                <p className="text-[10.5px] text-zinc-500">Devenez Talent Certifié dans l'onglet principal pour peupler cette liste !</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-105 dark:divide-zinc-855">
                {adminRequests.map((req, index) => (
                  <div key={req.id || index} className="p-5 space-y-4 hover:bg-zinc-900/10 transition text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-850 pb-3">
                      <div className="space-y-0.5">
                        <div className="font-black text-gray-900 dark:text-white text-sm">🧑‍🎤 {req.artistName}</div>
                        <div className="text-zinc-450 text-[10.5px]">Soumis par UID : <span className="font-mono">{req.userId.substring(0, 8)}...</span></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          req.status === "Approuvé" 
                            ? "bg-emerald-100 text-emerald-800" 
                            : req.status === "Refusé" 
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {req.status}
                        </span>
                        <div className="text-[10.5px] text-zinc-450">
                          {new Date(req.createdAt).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-zinc-400">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase block">🎸 Spécialités Musicales :</span>
                        <div className="flex flex-wrap gap-1">
                          {req.specialties.map((s, idx) => (
                            <span key={idx} className="bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 px-2 py-0.5 rounded text-[10px] font-bold">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase block">📐 Expérience Pro :</span>
                        <div className="text-gray-900 dark:text-zinc-200 font-semibold">{req.experience}</div>
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase block">🎬 Preuve de compétence :</span>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <a 
                          href={req.mediaUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1.5 font-bold"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Exposer l'audition de l'artiste &rarr;
                        </a>
                        {req.mediaUrl && req.mediaUrl.startsWith("blob:") && (
                          <button 
                            onClick={() => setShowPreviewUrl(req.mediaUrl)}
                            className="px-3 py-1 bg-purple-50 dark:bg-purple-900/35 hover:bg-purple-100 text-purple-700 dark:text-purple-400 text-[10px] font-bold rounded-md"
                          >
                            👁️ Aperçu Lecteur
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Vetting Control Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleAdminVetting(req.id, "Approuvé")}
                        disabled={loading}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Approuver le Talent CI
                      </button>
                      <button
                        onClick={() => handleAdminVetting(req.id, "Refusé")}
                        disabled={loading}
                        className="px-4 py-2 bg-red-650 bg-red-650 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        ✕ Refuser / Suspendre
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LECTEUR PREVIEW FLOATING FRAME (Aperçu) */}
      <AnimatePresence>
        {showPreviewUrl && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#15151c] text-white p-6 rounded-3xl border border-zinc-800 max-w-lg w-full space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-zinc-400">Lecteur Média d'Audition CI</span>
                <button onClick={() => setShowPreviewUrl(null)} className="text-zinc-500 hover:text-white font-bold">&times; Fermer</button>
              </div>
              <div className="p-1.5 bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
                <video src={showPreviewUrl} controls autoPlay className="w-full h-full object-contain max-h-64" />
              </div>
              <p className="text-[10px] text-zinc-500 text-center uppercase font-black">Preuve de performance chargée depuis le disque local</p>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Gombo ID Verification (Level 2) */}
      <AnimatePresence>
        {showGomboFormModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#151520] border border-gray-100 dark:border-zinc-850 rounded-3xl p-6 sm:p-8 max-w-xl w-full relative overflow-y-auto max-h-[90vh] text-zinc-900 dark:text-white shadow-2xl space-y-6 text-left"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-600 to-indigo-600" />

              <button 
                onClick={() => { setShowGomboFormModal(false); setGomboSuccess(false); setGomboErrorMsg(""); }}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-bold text-base"
              >
                ✕
              </button>

              {!gomboSuccess ? (
                <form onSubmit={handleApplyGomboID} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-base font-black uppercase tracking-tight text-zinc-950 dark:text-white flex items-center gap-1.5">
                      🏆 DEMANDE DE GOMBO ID (NIVEAU 2)
                    </h2>
                    <p className="text-[11px] text-zinc-400">
                      Remplissez vos informations certifiées professionnelles pour l'examen de nos agents de validation de Côte d'Ivoire.
                    </p>
                  </div>

                  {gomboErrorMsg && (
                    <div className="p-3 bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 rounded-xl text-xs font-bold leading-relaxed">
                      ⚠️ {gomboErrorMsg}
                    </div>
                  )}

                  {/* Photo profil input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-zinc-400">Photo de Profil Pro (Lien URL ou démo) :</label>
                    <input
                      type="url"
                      required
                      placeholder="https://..."
                      value={gomboPhotoUrl}
                      onChange={(e) => setGomboPhotoUrl(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  {/* Nom complet */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-zinc-400">Nom Complet d'Artiste / État Civil :</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex : Kouadio John Sylvester d'Anoumabo"
                      value={gomboFullName}
                      onChange={(e) => setGomboFullName(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  {/* Commune selector */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-zinc-400">Votre Commune (Abidjan) :</label>
                    <select
                      value={gomboCommune}
                      onChange={(e) => setGomboCommune(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-xl text-xs font-semibold focus:outline-none"
                    >
                      {["Cocody", "Yopougon", "Abobo", "Treichville", "Marcory", "Plateau", "Koumassi", "Adjamé", "Port-Bouët", "Bingerville"].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Métier selector */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-zinc-400">Métier Musical / Spécialité :</label>
                    <select
                      value={gomboMetier}
                      onChange={(e) => setGomboMetier(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-xl text-xs font-semibold focus:outline-none"
                    >
                      {["Musicien", "Chanteur Solo", "Lead Vocal", "Batteur", "Claviériste", "Guitariste", "Choriste", "Arrangeur", "DJ Mixter", "Saxophoniste", "Autre"].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-zinc-400">Numéro WhatsApp direct :</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex : +225 07 08 09 10 11"
                      value={gomboWhatsapp}
                      onChange={(e) => setGomboWhatsapp(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  {/* Selfie Url */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-zinc-400">Photo Selfie de Conformité (Lien ou démo) :</label>
                    <input
                      type="url"
                      required
                      placeholder="https://..."
                      value={gomboSelfieUrl}
                      onChange={(e) => setGomboSelfieUrl(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  {/* Média Artistique */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-zinc-400">Lien Média Artistique (Preuve de compétences - YouTube, Drive) :</label>
                    <input
                      type="url"
                      required
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={gomboMediaUrl}
                      onChange={(e) => setGomboMediaUrl(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black uppercase text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Soumettre ma demande Gombo ID (Gratuit)
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/35 text-emerald-500 border border-emerald-100 dark:border-emerald-900 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
                    ✓
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-lg font-black text-zinc-950 dark:text-white uppercase tracking-tight">DEMANDE TRANSMISE !</h2>
                    <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                      Votre postulation Gombo ID a été enregistrée avec succès. Notre équipe à Abidjan l'analysera dans les plus brefs délais. Vous recevrez une notification d'approbation dès validation.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowGomboFormModal(false);
                      setGomboSuccess(false);
                      setGomboErrorMsg("");
                    }}
                    className="px-6 py-2.5 bg-zinc-950 dark:bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Retour aux Certifications
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Boost Configuration Selector */}
      <AnimatePresence>
        {showBoostModal && selectedItemForBoost && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#15151c] border border-gray-100 dark:border-zinc-850 rounded-3xl p-6 sm:p-8 max-w-md w-full relative overflow-hidden text-gray-900 dark:text-white shadow-2xl space-y-5"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 to-yellow-500" />

              <button 
                onClick={() => setShowBoostModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-950 dark:hover:text-white font-bold"
              >
                ✕
              </button>

              <div className="space-y-1">
                <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  Booster de Publication
                </h2>
                <div className="text-xs text-gray-400 truncate">
                  Sujet : "{selectedItemForBoost.title}"
                </div>
              </div>

              <form onSubmit={handleApplyBoost} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">Choisissez la durée de mise en valeur</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "24 Heures", value: "24h", price: "500 FCFA" },
                      { label: "3 Jours", value: "3d", price: "1 000 FCFA" },
                      { label: "7 Jours", value: "7d", price: "2 000 FCFA" }
                    ].map((d) => (
                      <button
                        type="button"
                        key={d.value}
                        onClick={() => setSelectedBoostDuration(d.value as any)}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-0.5 ${
                          selectedBoostDuration === d.value 
                            ? "bg-purple-600 text-white border-purple-600 shadow-md" 
                            : "bg-gray-50 dark:bg-gray-850 text-gray-500 border-gray-100 dark:border-gray-800"
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-tight">{d.label}</span>
                        <span className="text-[9px] font-bold opacity-80">{d.price}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">Opérateur Mobile Money (Simulé)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["Wave", "Orange Money", "MTN Momo", "Moov Money"].map((n) => (
                      <button
                        type="button"
                        key={n}
                        onClick={() => setSelectedMobileNetwork(n)}
                        className={`py-2 text-[10px] font-black uppercase rounded-lg border text-center transition ${
                          selectedMobileNetwork === n 
                            ? "bg-purple-600 text-white border-purple-600" 
                            : "bg-gray-50 dark:bg-gray-850 text-gray-500 border-gray-100 dark:border-gray-800"
                        }`}
                      >
                        {n.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500">Numéro de téléphone de facturation</label>
                  <input
                    type="tel"
                    required
                    placeholder="07 00 00 00 00"
                    value={mobilePhoneNumber}
                    onChange={(e) => setMobilePhoneNumber(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-55 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-950 dark:text-white"
                  />
                </div>

                <div className="p-3.5 bg-yellow-50 dark:bg-yellow-950/20 rounded-xl border border-dashed border-yellow-100 dark:border-yellow-900/50 flex justify-between items-center text-xs">
                  <span className="font-bold text-yellow-950 dark:text-yellow-400">Total Facturé (Simulé) :</span>
                  <strong className="font-black text-yellow-600 dark:text-yellow-500 text-sm">
                    {getBoostPrice(selectedBoostDuration).toLocaleString("fr-FR")} FCFA
                  </strong>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      Lancer mon Boost Express !
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
