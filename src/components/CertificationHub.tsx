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
        <div id="badges-panel" className="space-y-8 animate-fadeIn">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Col: Explainer Card */}
            <div id="explainer-card" className="md:col-span-2 bg-white dark:bg-[#15151c] p-6 rounded-2xl border border-gray-100 dark:border-zinc-850 space-y-5 shadow-xs">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                POURQUOI DEVENIR TALENT CERTIFIÉ ?
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                Les musiciens et créateurs de démos disposant d'un badge authentifé captent l'attention de 92% des recruteurs (hôtels, maquis VIP, et mariés) lors de l'attribution de gombos.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600 dark:text-zinc-300">
                {[
                  { title: "⭐ Visibilité double", desc: "Vos démos et profils s'affichent au sommet des résultats de recherche globale à Abidjan." },
                  { title: "🛡️ Confiance garantie", desc: "La pastille verte rassure instantanément sur vos compétences techniques et professionnalisme." },
                  { title: "👑 Priorité VIP", desc: "Recevez les gombos de scène VIP et dorés en avant-première par SMS et notifications." },
                  { title: "🔒 Identité confirmée", desc: "Votre cachet et contacts sont validés d'office pour éviter tout problème d'usurpation." }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 dark:bg-zinc-900/40 rounded-xl space-y-1">
                    <strong className="text-purple-600 dark:text-purple-400 block">{item.title}</strong>
                    <span className="text-[11px] text-gray-500 dark:text-zinc-500 leading-relaxed">{item.desc}</span>
                  </div>
                ))}
              </div>

              {currentUserProfile ? (
                <div className="p-4 bg-orange-50 dark:bg-orange-950/10 rounded-xl border border-orange-200/40 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-orange-900 dark:text-orange-400">Statut de votre dossier actuel à Abidjan :</span>
                    {myRequests.length === 0 ? (
                      <span className="text-orange-600 dark:text-orange-400 font-extrabold uppercase">Aucun dossier transmis</span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        myRequests[0].status === "Approuvé" 
                          ? "bg-emerald-100 text-emerald-800" 
                          : myRequests[0].status === "Refusé" 
                          ? "bg-red-100 text-red-800" 
                          : "bg-amber-100 text-amber-800 animate-pulse"
                      }`}>
                        {myRequests[0].status}
                      </span>
                    )}
                  </div>
                  {myRequests.length > 0 && (
                    <div id="request-preview" className="text-xs border-t border-orange-200/30 pt-2 text-zinc-400 space-y-1">
                      <div>🧑‍🎤 Nom d'artiste : <strong>{myRequests[0].artistName}</strong></div>
                      <div>🎸 Spécialités : <strong>{myRequests[0].specialties.join(", ")}</strong></div>
                      <div>🎬 Preuve vidéo : <a href={myRequests[0].mediaUrl} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline inline-flex items-center gap-1">Voir le lien de démo <Eye className="w-3.5 h-3.5" /></a></div>
                    </div>
                  )}
                  {myRequests.length === 0 && (
                    <button
                      onClick={() => {
                        setShowCertModal(true);
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white fill-current font-bold text-xs rounded-xl hover:shadow-md transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      🏆 Devenir Talent Certifié
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={onShowAuth}
                  className="w-full py-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 text-xs font-black tracking-wider uppercase rounded-xl transition cursor-pointer"
                >
                  Se connecter pour envoyer un dossier
                </button>
              )}
            </div>

            {/* Right Col: Badges Sandbox (4 Tiers Preview) */}
            <div id="badge-tiers" className="space-y-4">
              <h3 className="text-xs font-black tracking-wider text-zinc-400 uppercase">
                LES 4 NIVEAUX DE PROFIL Y&#39;A GOMBO
              </h3>

              <div className="space-y-3">
                {[
                  {
                    tier: "⚪ Nouveau Talent",
                    range: "0 - 30 SCORE",
                    badgeColor: "text-zinc-500 bg-zinc-100 dark:bg-zinc-900",
                    desc: "Artiste nouvellement enregistré. Profil en cours de structuration."
                  },
                  {
                    tier: "🔵 Talent Vérifié",
                    range: "31 - 60 SCORE",
                    badgeColor: "text-blue-600 bg-blue-100 dark:bg-blue-950/40",
                    desc: "Coordonnées pros et identité visuelle validées par l'équipe."
                  },
                  {
                    tier: "🟢 Talent Certifié",
                    range: "61 - 85 SCORE",
                    badgeColor: "text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40",
                    desc: "Niveau musical auditionné et recommandé par le jury."
                  },
                  {
                    tier: "🟣 Boss du Gombo",
                    range: "86 - 100 SCORE",
                    badgeColor: "text-purple-700 bg-purple-100 dark:bg-purple-950/40",
                    desc: "Légende absolue, gombos complétés avec mention excellente !"
                  }
                ].map((tier, idx) => (
                  <div key={idx} className="p-3 bg-white dark:bg-[#15151c] border border-gray-100 dark:border-zinc-850 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-900 dark:text-white font-black">{tier.tier}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] ${tier.badgeColor}`}>{tier.range}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-normal">{tier.desc}</p>
                  </div>
                ))}
              </div>

              {/* Beta Testing Sandbox Header */}
              <div className="p-4 bg-purple-50 dark:bg-purple-950/15 border border-purple-200/30 rounded-2xl text-xs space-y-2">
                <span className="font-extrabold text-purple-900 dark:text-purple-300 flex items-center gap-1">
                  🔧 Testeur Bêta Sandbox
                </span>
                <p className="text-[10.5px] text-zinc-500 leading-relaxed">
                  Basculez manuellement vos badges de démonstration ci-dessous pour apprécier instantanément le rendu sur vos fiches :
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["⚪ Nouveau Talent", "🔵 Talent Vérifié", "🟢 Talent Certifié", "🟣 Boss du Gombo"].map(badgeName => {
                    const hasTag = currentUserProfile?.badges?.includes(badgeName) || false;
                    return (
                      <button
                        key={badgeName}
                        onClick={() => handleToggleBadge(badgeName)}
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                          hasTag 
                            ? "bg-purple-650 border-purple-600 text-white" 
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

          {/* Infrastructure Preparation Row */}
          <div className="bg-[#15151c] p-6 rounded-2xl border border-zinc-850 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-extrabold uppercase text-orange-400 tracking-wider">💳 Préparation Infrastructure Tarifs</h4>
              <p className="text-[11px] text-zinc-400">
                La certification à vie prévoit des frais uniques de 1 000 FCFA à 2 000 FCFA. Aucun prélèvement réel en cours de bêta-test.
              </p>
            </div>
            <div className="text-xl font-black text-white whitespace-nowrap">
              0 FCFA <span className="text-xs font-normal text-zinc-500">Bêta Gratuite</span>
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

      {/* MODAL: Dossier de Certification (Détails) */}
      <AnimatePresence>
        {showCertModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#151520] border border-gray-100 dark:border-zinc-850 rounded-3xl p-6 sm:p-8 max-w-xl w-full relative overflow-y-auto max-h-[90vh] text-zinc-900 dark:text-white shadow-2xl space-y-6"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 to-amber-500" />

              <button 
                onClick={() => { setShowCertModal(false); setSimulatedSuccess(false); }}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-bold text-base"
              >
                ✕
              </button>

              {!simulatedSuccess ? (
                <form onSubmit={handleApplyCertification} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-base font-black uppercase tracking-tight text-zinc-950 dark:text-white flex items-center gap-1.5">
                      🏆 DOSSIER DE CERTIFICATION PRO CI
                    </h2>
                    <p className="text-[11px] text-zinc-400">
                      Remplissez attentivement ce portfolio d'artiste pour l'examen de nos agents de validation.
                    </p>
                  </div>

                  {/* Nom d'artiste */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-zinc-400">Nom d'Artiste ou Groupe :</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex : Dj Kerozen, Serge Beynaud"
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  {/* Multi-specialties field */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase text-zinc-400">Spécialités de Scène (Sélection multiple) :</label>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-55 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-205 dark:border-zinc-805">
                      {selectedSpecialties.map((s, idx) => (
                        <span key={idx} className="bg-purple-600 text-white font-bold px-2 py-0.5 rounded text-[10px] items-center gap-1 inline-flex">
                          {s}
                          <button type="button" onClick={() => handleRemoveSpecialty(s)} className="font-extrabold hover:text-red-400 text-[11px]">&times;</button>
                        </span>
                      ))}
                      {selectedSpecialties.length === 0 && (
                        <span className="text-[10px] text-zinc-500">Aucune spécialité spécifiée. Ajoutez-en ci-dessous.</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ex : Lead Guitarist, Choriste, Pianiste"
                        value={specialtyInput}
                        onChange={(e) => setSpecialtyInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSpecialty(); } }}
                        className="flex-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddSpecialty}
                        className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-xl"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>

                  {/* Bio Description */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-zinc-400">Présentation / Bio Artistique :</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Ex : Plus de 50 cabarets réalisés à Abidjan. Claviériste professionnel spécialisé dans le live Zouglou et Coupé-Décalé..."
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
                    />
                  </div>

                  {/* Experience */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-zinc-400">Années d'Expérience Showbiz :</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex : 5 ans d'expérience"
                      value={experienceText}
                      onChange={(e) => setExperienceText(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-xl text-xs"
                    />
                  </div>

                  {/* Proof selection: Drag and Drop Upload OR url link */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase text-zinc-400">Preuve de Compétence Technique (Vidéo, Audio, YouTube) :</label>
                    
                    {/* Link upload option */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-500 block">Option A : Coller un Lien Showbiz (YouTube, Drive ou Soundcloud) :</span>
                      <div className="relative">
                        <Video className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                        <input
                          type="url"
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={mediaUrlInput}
                          onChange={(e) => setMediaUrlInput(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-xl text-xs"
                        />
                      </div>
                    </div>

                    {/* Drag and Drop Box */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-500 block">Option B : Charger un Fichier Média d'Audition depuis votre disque :</span>
                      <div 
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
                          dragActive 
                            ? "border-purple-600 bg-purple-500/5" 
                            : "border-zinc-205 dark:border-zinc-805 bg-zinc-50 dark:bg-zinc-900"
                        }`}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileChange} 
                          accept="audio/*,video/*" 
                          className="hidden" 
                        />
                        <Upload className="w-7 h-7 text-zinc-500 animate-pulse" />
                        <div className="text-xs font-bold text-zinc-500">
                          {selectedFile ? `Fichier choisi : ${selectedFile.name}` : "Glissez-déposez ou cliquez pour sélectionner un fichier"}
                        </div>
                        <p className="text-[9.5px] text-zinc-500">Formats acceptés : MP3, WAV, MP4 (Max 15 Mo)</p>
                      </div>
                    </div>

                    {/* Progress Percentage Display */}
                    {uploading && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                          <span>Téléversement vers Firebase Storage...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-purple-650 h-full transition-all duration-150 bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    )}

                    {uploadedUrl && !uploading && (
                      <div className="p-2.5 bg-emerald-100 text-emerald-800 dark:bg-[#122822] dark:text-[#a0eed0] rounded-xl border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">
                        <span>✓ Média stocké avec succès dans Firebase</span>
                        <button 
                          type="button" 
                          onClick={() => { setSelectedFile(null); setUploadedUrl(""); }}
                          className="text-red-500 hover:text-red-700 font-extrabold uppercase text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          <Trash className="w-3.5 h-3.5" /> Supprimer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Payment Mobile money selector */}
                  <div className="space-y-1.5 pt-2 border-t border-zinc-150 dark:border-zinc-850">
                    <label className="text-[11px] font-black uppercase text-zinc-400">Canal de facturation à Abidjan :</label>
                    <div className="grid grid-cols-4 gap-2">
                      {["Wave", "Orange Money", "MTN Momo", "Moov Money"].map((n) => (
                        <button
                          type="button"
                          key={n}
                          onClick={() => setSelectedMobileNetwork(n)}
                          className={`py-1.5 text-[9.5px] font-black uppercase rounded-lg border text-center transition ${
                            selectedMobileNetwork === n 
                              ? "bg-purple-600 text-white border-purple-600" 
                              : "bg-zinc-50 dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800"
                          }`}
                        >
                          {n.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[11px] font-black uppercase text-zinc-400">Numéro Mobile Money :</label>
                      <input
                        type="tel"
                        required
                        placeholder="07 00 00 00 00"
                        value={mobilePhoneNumber}
                        onChange={(e) => setMobilePhoneNumber(e.target.value)}
                        className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs"
                      />
                    </div>
                    <div className="w-40">
                      <label className="text-[11px] font-black uppercase text-zinc-500">Tarif Unique :</label>
                      <div className="bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border border-dashed border-purple-500/20 px-3 py-1.5 rounded-xl font-black text-center text-sm">
                        1 500 FCFA
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-zinc-500 leading-normal text-center bg-zinc-100 dark:bg-zinc-900 p-2 rounded-xl">
                    🔐 Les fonds ne sont pas véritablement débités en phase de test.
                  </div>

                  <button
                    type="submit"
                    disabled={loading || uploading}
                    className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black uppercase text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Transmettre mon Dossier Pro &amp; Régler 1 500 FCFA
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
                    <h2 className="text-lg font-black text-zinc-950 dark:text-white uppercase tracking-tight">DOSSIER TRANSMIS ET VALIDÉ !</h2>
                    <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                      Votre postulation et règlement fictif de validation ont bien été sauvegardés sur Firestore ! Retrouvez le dossier d'audition dans la console pour l'approuver ou le rejeter et tester l'affichage du badge.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowCertModal(false);
                      setSimulatedSuccess(false);
                    }}
                    className="px-6 py-2.5 bg-zinc-950 dark:bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Retour aux badges
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
