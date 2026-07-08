import React, { useState, useEffect } from "react";
import { 
  Search, 
  MapPin, 
  Heart, 
  MessageSquare, 
  ArrowLeft, 
  Share2, 
  Sparkles, 
  Award, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Filter, 
  Smartphone, 
  Check, 
  Flame, 
  Music, 
  Eye, 
  Send 
} from "lucide-react";
import { UserProfile } from "../types";
import { gomboDB } from "../firebase";

interface AnnuaireTalentsProps {
  currentUserProfile: UserProfile | null;
  onNavigateView: (view: string) => void;
  selectedTalentUid?: string;
  onSelectTalent: (uid: string | null) => void;
}

// Communes Abidjan
const COMMUNES_ABIDJAN = [
  "Abobo", "Adjamé", "Attécoubé", "Cocody", "Koumassi", 
  "Marcory", "Plateau", "Port-Bouët", "Treichville", 
  "Yopougon", "Anyama", "Bingerville", "Songon"
];

// Villes de Côte d'Ivoire
const VILLES_CI = [
  "Bouaké", "Yamoussoukro", "Daloa", "San Pedro", "Korhogo", 
  "Man", "Gagnoa", "Abengourou", "Divo", "Aboisso", "Ferkessédougou"
];

// Spécialités
const SPECIALTIES_FILTER = [
  { label: "Tous", value: "all", icon: "🎵" },
  { label: "Chanteurs", value: "Chanteur", icon: "🎤" },
  { label: "Pianistes", value: "Pianiste", icon: "🎹" },
  { label: "Guitaristes", value: "Guitariste", icon: "🎸" },
  { label: "Bassistes", value: "Bassiste", icon: "🎸" },
  { label: "Batteurs", value: "Batteur", icon: "🥁" },
  { label: "DJs", value: "DJ", icon: "🎧" },
  { label: "Choristes", value: "Choriste", icon: "🎼" },
  { label: "Saxophonistes", value: "Saxophoniste", icon: "🎷" },
  { label: "Trompettistes", value: "Trompettiste", icon: "🎺" },
  { label: "Violonistes", value: "Violoniste", icon: "🎻" }
];

// Fallback high-quality avatars for complete looking look
const AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200"
];

const STYLES_MUSICAUX = ["Coupé-Décalé", "Acoustique", "Zouglou", "Gospel", "Rumba Congolaise", "Afrobeat", "Jazz / Soul", "Variété", "Reggae"];

export default function AnnuaireTalents({ 
  currentUserProfile, 
  onNavigateView, 
  selectedTalentUid, 
  onSelectTalent 
}: AnnuaireTalentsProps) {
  const [talents, setTalents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [selectedCommune, setSelectedCommune] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [filterAvailability, setFilterAvailability] = useState<"all" | "disponible" | "occupe" | "indisponible">("all");

  // Favorites (persisted locally)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("favorite_talents_list");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Simulated Views Count (persisted locally to show "Popular profiles / Talents en vue")
  const [viewsCount, setViewsCount] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("talent_page_views");
      return saved ? JSON.parse(saved) : {
        "mus1": 154,
        "mus2": 240,
        "mus_demo_1": 98,
        "mus_demo_2": 185
      };
    } catch {
      return {};
    }
  });

  // Direct messaging contact modal
  const [contactingTalent, setContactingTalent] = useState<UserProfile | null>(null);
  const [contactMessage, setContactMessage] = useState("");
  const [contactSuccess, setContactSuccess] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Load all talents
  useEffect(() => {
    const fetchTalents = async () => {
      setLoading(true);
      try {
        const users = await gomboDB.getAllUsers();
        // Filters only musicians (role === "musicien" or having specialties)
        const musicians = users.filter(u => u.role === "musicien" || u.specialty || u.specialties);
        setTalents(musicians);
      } catch (err) {
        console.error("Error fetching talents for directory:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTalents();
  }, []);

  // Sync favorites of talents to localStorage
  useEffect(() => {
    localStorage.setItem("favorite_talents_list", JSON.stringify(favorites));
  }, [favorites]);

  // Handle local persistence of simulated page views
  useEffect(() => {
    localStorage.setItem("talent_page_views", JSON.stringify(viewsCount));
  }, [viewsCount]);

  // Toggle favorite status
  const toggleFavorite = (uid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (favorites.includes(uid)) {
      setFavorites(prev => prev.filter(id => id !== uid));
    } else {
      setFavorites(prev => [...prev, uid]);
    }
  };

  // Safe view counter increment when a profile is selected
  const handleViewProfileDetail = (uid: string) => {
    setViewsCount(prev => ({
      ...prev,
      [uid]: (prev[uid] || 0) + 1
    }));
    onSelectTalent(uid);
    // Push modern cleaner state history URL
    window.history.pushState(null, "", `/talent/${uid}`);
  };

  // Back button from profile detail page
  const handleBackToAnnuaire = () => {
    onSelectTalent(null);
    window.history.pushState(null, "", "/");
  };

  // Submit dynamic direct message
  const handleSendMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim() || !contactingTalent || !currentUserProfile) return;
    
    setSendingMessage(true);
    try {
      const myDetails = {
        name: currentUserProfile.artistName || `${currentUserProfile.firstName} ${currentUserProfile.lastName}` || "Moi",
        avatarUrl: currentUserProfile.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
        role: currentUserProfile.role || "organisateur"
      };
      const recipientDetails = {
        name: contactingTalent.artistName || `${contactingTalent.firstName} ${contactingTalent.lastName}` || "Artiste Gombo",
        avatarUrl: contactingTalent.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
        role: contactingTalent.role || "musicien"
      };

      const convoId = await gomboDB.getOrCreateConversation(
        currentUserProfile.uid,
        contactingTalent.uid,
        myDetails,
        recipientDetails
      );

      await gomboDB.sendMessage(
        convoId,
        currentUserProfile.uid,
        myDetails.name,
        contactMessage
      );

      setContactSuccess(true);
      setTimeout(() => {
        setContactSuccess(false);
        setContactingTalent(null);
        setContactMessage("");
        if (onNavigateView) {
          onNavigateView("messages");
        }
      }, 1500);
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Une erreur est survenue lors de l'envoi du message.");
    } finally {
      setSendingMessage(false);
    }
  };

  // Perform filtering on loaded talents list
  const filteredTalents = talents.filter(t => {
    // 1. Search Query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const nameMatch = `${t.firstName || ""} ${t.lastName || ""}`.toLowerCase().includes(q);
      const artistMatch = (t.artistName || "").toLowerCase().includes(q);
      const communeMatch = (t.commune || "").toLowerCase().includes(q);
      const specMatch = (t.specialty || "").toLowerCase().includes(q);
      const multSpecsMatch = t.specialties?.some(el => el.toLowerCase().includes(q)) ?? false;
      const genreMatch = (t.musicGenre || "").toLowerCase().includes(q);
      const multGenresMatch = t.musicGenres?.some(el => el.toLowerCase().includes(q)) ?? false;
      
      if (!nameMatch && !artistMatch && !communeMatch && !specMatch && !multSpecsMatch && !genreMatch && !multGenresMatch) {
        return false;
      }
    }

    // 2. Specialty Quick buttons Filter
    if (selectedSpecialty !== "all") {
      const spec = selectedSpecialty.toLowerCase();
      const sMatch = (t.specialty || "").toLowerCase().includes(spec);
      const sMultMatch = t.specialties?.some(el => el.toLowerCase().includes(spec)) ?? false;
      if (!sMatch && !sMultMatch) return false;
    }

    // 3. Abidjan Communes Filter
    if (selectedCommune !== "all") {
      if ((t.commune || "").toLowerCase() !== selectedCommune.toLowerCase()) return false;
    }

    // 4. City Côte d'Ivoire Filter
    if (selectedCity !== "all") {
      // Map commune to matches if outside Abidjan or extra fields
      const matchesCity = (t.commune || "").toLowerCase() === selectedCity.toLowerCase();
      if (!matchesCity) return false;
    }

    // 5. Availability Status Filter
    if (filterAvailability !== "all") {
      const actStatus = t.availabilityStatus || ((t.isAvailableNow ?? true) ? "disponible" : "indisponible");
      if (actStatus !== filterAvailability) return false;
    }

    return true;
  });

  // Identify "Talents en vue" / Popular talents (Top 3 by views or activity status)
  const popularTalents = [...talents]
    .sort((a, b) => {
      const viewsA = viewsCount[a.uid] || 0;
      const viewsB = viewsCount[b.uid] || 0;
      return viewsB - viewsA;
    })
    .slice(0, 3);

  // Load specific talent profile if selected via URL or state
  const selectedTalent = talents.find(t => t.uid === selectedTalentUid);

  return (
    <div id="annuaire-talents-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans transition-colors min-h-screen">
      
      {/* CASE 1: DISPLAY SPECIFIC PUBLIC PROFILE FOR /talent/{uid} */}
      {selectedTalent ? (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in py-4">
          
          {/* Back button header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-150 dark:border-gray-800">
            <button
              onClick={handleBackToAnnuaire}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-[#7C3AED] dark:hover:text-[#A78BFA] bg-white dark:bg-[#12111a] border border-gray-150 dark:border-gray-800 rounded-xl transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour à l'annuaire</span>
            </button>
            <div className="text-[10px] uppercase font-black tracking-widest text-[#D4AF37] bg-orange-50 dark:bg-orange-950/20 px-2.5 py-1 rounded-md">
              PROFIL PUBLIC PREMIUM
            </div>
          </div>

          {/* Majestic Public Profil Plate */}
          <div className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-850 rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden space-y-6">
            
            {/* Ambient Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-600/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 pb-6 border-b border-gray-50 dark:border-gray-850">
              
              {/* Profile image with availability dot */}
              <div className="relative">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#D4AF37] bg-gray-50">
                  <img 
                    src={selectedTalent.avatarUrl || selectedTalent.photoURL || AVATARS[Math.floor(Math.random() * AVATARS.length)]} 
                    alt="Talent Photo" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                {/* Availability status badge */}
                {(() => {
                  const status = selectedTalent.availabilityStatus || ((selectedTalent.isAvailableNow ?? true) ? "disponible" : "indisponible");
                  let dotColor = "bg-emerald-500";
                  let label = "Disponible";
                  if (status === "occupe") { dotColor = "bg-amber-500"; label = "Occupé"; }
                  else if (status === "indisponible") { dotColor = "bg-red-500"; label = "Indisponible"; }
                  return (
                    <div className={`absolute bottom-1 right-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold text-white flex items-center gap-1.5 border-2 border-white dark:border-[#121214] ${dotColor}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span>{label}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Identity details */}
              <div className="space-y-2 flex-grow">
                <div className="flex flex-col sm:flex-row items-center gap-2 justify-center sm:justify-start">
                  <h1 className="text-2xl font-black text-gray-950 dark:text-white uppercase tracking-tight">
                    {selectedTalent.firstName} {selectedTalent.lastName}
                  </h1>
                  {selectedTalent.artistName && (
                    <span className="text-sm font-extrabold text-[#D4AF37] bg-[#D4AF37]/5 px-2 py-0.5 rounded-md">
                      {selectedTalent.artistName}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-500 justify-center sm:justify-start font-bold">
                  <MapPin className="w-3.5 h-3.5 text-orange-600" />
                  <span>{selectedTalent.commune || "Abidjan"}, Côte d'Ivoire</span>
                  <span className="text-gray-300 dark:text-gray-700">|</span>
                  <span className="p-1 px-2 bg-purple-50 dark:bg-purple-950/20 text-[#7C3AED] text-[10px] font-black uppercase rounded">
                    🎹 {selectedTalent.specialty || "Musicien"}
                  </span>
                </div>

                {/* Level indicators */}
                <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start pt-1">
                  <span className="text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-300 px-2.5 py-1 rounded-md flex items-center gap-1 uppercase">
                    🏆 {selectedTalent.experience || "Professionnel"}
                  </span>
                  
                  {selectedTalent.badges && selectedTalent.badges?.map((badge, index) => {
                    const isGoldNoir = badge.includes("Certifié") || badge.includes("Vérifié");
                    return (
                      <span key={index} className={`text-[10px] font-black px-2.5 py-1 rounded-md flex items-center gap-1 border ${
                        isGoldNoir 
                          ? "bg-[#D4AF37] text-[#0B0B0B] border-[#0B0B0B]/10 shadow-sm" 
                          : "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/25"
                      }`}>
                        {badge}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Heart Fav action */}
              <button 
                onClick={(e) => toggleFavorite(selectedTalent.uid, e)}
                className={`p-3 rounded-full border transition cursor-pointer ${
                  favorites.includes(selectedTalent.uid)
                    ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/25 dark:border-rose-900" 
                    : "bg-gray-50 border-gray-150 text-gray-400 hover:text-gray-800 dark:bg-gray-800 dark:border-gray-700"
                }`}
              >
                <Heart className={`w-5 h-5 ${favorites.includes(selectedTalent.uid) ? "fill-current" : ""}`} />
              </button>
            </div>

            {/* Biography section */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-950 dark:text-white">
                📖 Biographie & Parcours Showbiz
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-[#1a1a1f] p-4 rounded-2xl border border-gray-100 dark:border-gray-800/60 font-medium">
                {selectedTalent.bio || "Aucune biographie rédigée pour l'instant. Cet artiste se concentre sur sa virtuosité scénique, l'entraînement quotidien et les répétitions d'orchestres à Abidjan."}
              </p>
            </div>

            {/* Specialties & Musical styles info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 p-4 bg-gray-50 dark:bg-[#1a1a1f] rounded-2xl border border-gray-100 dark:border-gray-800/60">
                <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  🎻 Instruments & Spécialités
                </h4>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedTalent.specialties && selectedTalent.specialties.length > 0 ? (
                    selectedTalent.specialties.map(spec => (
                      <span key={spec} className="px-2.5 py-1 bg-white dark:bg-gray-900 text-xs text-gray-800 dark:text-gray-300 rounded-lg font-bold shadow-xs">
                        {spec}
                      </span>
                    ))
                  ) : (
                    <span className="px-2.5 py-1 bg-white dark:bg-gray-900 text-xs text-gray-700 dark:text-gray-300 rounded-lg font-bold">
                      {selectedTalent.specialty || "Musicien"}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 p-4 bg-gray-50 dark:bg-[#1a1a1f] rounded-2xl border border-gray-100 dark:border-gray-800/60">
                <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  🎼 Styles Musicaux Admirés
                </h4>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedTalent.musicGenres && selectedTalent.musicGenres.length > 0 ? (
                    selectedTalent.musicGenres.map(g => (
                      <span key={g} className="px-2.5 py-1 bg-white dark:bg-gray-900 text-xs text-gray-800 dark:text-gray-300 rounded-lg font-bold shadow-xs">
                        {g}
                      </span>
                    ))
                  ) : (
                    <span className="px-2.5 py-1 bg-white dark:bg-gray-900 text-xs text-gray-700 dark:text-gray-300 rounded-lg font-bold">
                      {selectedTalent.musicGenre || "Variété"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats list */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-55 dark:border-gray-850">
              <div className="text-center p-3 bg-gray-50/50 dark:bg-[#17171c]/55 rounded-xl border border-gray-100 dark:border-gray-850">
                <div className="text-base sm:text-lg font-black text-gray-950 dark:text-white">
                  {selectedTalent.gigsCompleted || 0}
                </div>
                <div className="text-[9px] uppercase font-bold text-gray-400">Gombos Joués</div>
              </div>
              <div className="text-center p-3 bg-gray-50/50 dark:bg-[#17171c]/55 rounded-xl border border-gray-100 dark:border-gray-850">
                <div className="text-base sm:text-lg font-black text-gray-950 dark:text-white">
                  {selectedTalent.applicationsSent || 0}
                </div>
                <div className="text-[9px] uppercase font-bold text-gray-400">Candidatures</div>
              </div>
              <div className="text-center p-3 bg-[#D4AF37]/5 rounded-xl border border-[#D4AF37]/10">
                <div className="text-base sm:text-lg font-black text-[#D4AF37]">
                  {viewsCount[selectedTalent.uid] || 32}
                </div>
                <div className="text-[9px] uppercase font-black text-gray-400">Vues Profil</div>
              </div>
            </div>

            {/* CTA action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              
              {/* Contacter Direct Button */}
              <button 
                onClick={() => {
                  if (!currentUserProfile) {
                    alert("Veuillez vous connecter pour contacter l'artiste.");
                    return;
                  }
                  setContactingTalent(selectedTalent);
                  setContactMessage(`Salut ${selectedTalent.firstName}, j'ai vu ton profil sur l'Annuaire AFRIGOMBO. Nous aurions besoin de ton talent pour une prestation...`);
                }}
                className="flex-1 bg-[#D4AF37] hover:bg-[#bfa12d] text-[#0B0B0B] py-3.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Contacter l'Artiste</span>
              </button>

              {/* Proposition de Cachet (Requirement 3: internal safe communication and booking) */}
              <button 
                onClick={() => {
                  if (!currentUserProfile) {
                    alert("Veuillez vous connecter pour formuler une proposition de cachet.");
                    return;
                  }
                  setContactingTalent(selectedTalent);
                  setContactMessage(`PROPOSITION DE CACHET : Salut ${selectedTalent.firstName}, j'ai examiné avec intérêt ton univers d'artiste et ton parcours sur l'Annuaire AfriGombo. Nous aimerions te proposer officiellement un cachet en toute sécurité pour une prestation à venir. Quels sont tes tarifs et disponibilités actuels ?`);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 border border-emerald-600/20 cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>💎 Proposer un Cachet</span>
              </button>

              {/* Share button */}
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Lien du profil public copié ! Partagez-le avec les promoteurs.");
                }}
                className="px-4 py-3.5 bg-gray-100 hover:bg-gray-150 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-300 rounded-xl text-xs font-black transition cursor-pointer"
                title="Copier le lien de partage"
              >
                <Share2 className="w-4.5 h-4.5" />
              </button>
            </div>

          </div>

          {/* Prompt banner info */}
          <div className="bg-orange-50/40 dark:bg-orange-950/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-950/20 text-center text-xs text-orange-650 dark:text-orange-400 font-bold">
            💡 Gombo Malin : Chaque talent artistique dispose d'une adresse de partage exclusive. Donnez de la force à votre carrière pro à Abidjan !
          </div>

        </div>
      ) : (
        
        // CASE 2: MAIN DIRECTORY VIEW LIST WITH INTEGRATED SEARCH, FILTERS & CARDS
        <div className="space-y-8 animate-fade-in">
          
          {/* Header block with elegant display typography */}
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-[10px] font-black uppercase text-[#D4AF37] bg-orange-50 dark:bg-[#D4AF37]/10 border border-[#D4AF37]/25 px-2.5 py-1 rounded-full tracking-widest inline-block">
              🇨🇮 ANNURAIRE OFFICIEL DU SHOWBIZ
            </span>
            <h1 className="text-3xl font-black text-gray-950 dark:text-white uppercase tracking-tight">
              Trouvez vos musiciens à Abidjan
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
              Recherchez, prévisualisez les démos, ajoutez en favori et contactez en direct les meilleurs instrumentistes de Côte d'Ivoire en un clic.
            </p>
          </div>

          {/* SEARCH AND QUICK FILTERS INTERACTIVE PLATFORM */}
          <div className="space-y-4 bg-white dark:bg-[#121214] border border-gray-105 dark:border-gray-850 p-4 sm:p-5 rounded-3xl shadow-xs">
            
            {/* 1. Combined Search field and availability filtering dropdown */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom, nom de scène, commune, instrument, style de musique..." 
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-gray-850 border border-transparent focus:border-purple-500 dark:focus:border-purple-600 rounded-2xl text-xs font-semibold focus:outline-none dark:text-white transition-all shadow-inner"
                />
              </div>

              {/* Quick Commune / Ville dropdown filter */}
              <div className="flex gap-2.5">
                <select
                  value={selectedCommune}
                  onChange={(e) => {
                    setSelectedCommune(e.target.value);
                    if (e.target.value !== "all") setSelectedCity("all");
                  }}
                  className="px-3.5 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                >
                  <option value="all">📍 Abidjan (Toutes Communes)</option>
                  {COMMUNES_ABIDJAN.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    if (e.target.value !== "all") setSelectedCommune("all");
                  }}
                  className="px-3.5 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                >
                  <option value="all">🌍 Côte d'Ivoire (Toutes Villes)</option>
                  {VILLES_CI.map(v => <option key={v} value={v}>{v}</option>)}
                </select>

                <select
                  value={filterAvailability}
                  onChange={(e) => setFilterAvailability(e.target.value as any)}
                  className="px-3.5 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                >
                  <option value="all">⚡ Tous les Statuts</option>
                  <option value="disponible">🟢 Disponible maintenant</option>
                  <option value="occupe">🟠 Occupé / En Concert</option>
                  <option value="indisponible">🔴 Indisponible momentanément</option>
                </select>
              </div>
            </div>

            {/* 2. Horizontal Specialty Buttons fast filter selection */}
            <div className="space-y-2 pt-1 border-t border-gray-50 dark:border-gray-850">
              <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">Filtra rapide par spécialité :</span>
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                {SPECIALTIES_FILTER.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setSelectedSpecialty(s.value)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                      selectedSpecialty === s.value
                        ? "bg-[#7C3AED] text-white font-extrabold shadow-sm"
                        : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-[#222]"
                    }`}
                  >
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* SECTION: POPULAR TALENTS IN THE SPOTLIGHT ("🔥 Talents en vue") */}
          {!loading && searchQuery === "" && selectedSpecialty === "all" && (
            <div className="space-y-4">
              <h2 className="text-sm font-black text-gray-950 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-5 h-5 text-orange-500 fill-current animate-bounce" />
                <span>🔥 Talents en vue cette semaine</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {popularTalents.map(talent => {
                  const viewCount = viewsCount[talent.uid] || 32;
                  const isFavorited = favorites.includes(talent.uid);
                  const status = talent.availabilityStatus || ((talent.isAvailableNow ?? true) ? "disponible" : "indisponible");
                  
                  return (
                    <div 
                      key={talent.uid}
                      onClick={() => handleViewProfileDetail(talent.uid)}
                      className="group bg-gradient-to-tr from-[#7C3AED]/5 to-orange-500/5 bg-white dark:bg-[#1a1a22] border border-orange-500/25 dark:border-orange-500/15 rounded-3xl p-5 relative shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.015] cursor-pointer flex flex-col justify-between space-y-4"
                    >
                      <div className="absolute top-4 right-4 text-[9px] font-black uppercase text-orange-600 bg-orange-100 dark:bg-orange-950/40 px-2 py-0.5 rounded flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-orange-600 fill-current" />
                        <span>En vedette</span>
                      </div>

                      <div className="flex gap-4">
                        {/* Avatar photo */}
                        <div className="relative shrink-0">
                          <img 
                            src={talent.avatarUrl || talent.photoURL || AVATARS[0]} 
                            alt={talent.firstName} 
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-[#D4AF37]" 
                          />
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#1a1a22] ${
                            status === "disponible" ? "bg-emerald-500" : status === "occupe" ? "bg-amber-500" : "bg-red-500"
                          }`} />
                        </div>

                        {/* Name and specialty */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="font-extrabold text-[#7C3AED] text-[10px] bg-purple-100/60 dark:bg-purple-950/40 px-1.5 py-0.5 rounded leading-none">
                              {talent.specialty || "Musicien"}
                            </span>
                            {talent.badges?.includes("⭐ Talent Certifié") && (
                              <span title="Talent Certifié">⭐</span>
                            )}
                          </div>
                          <h3 className="text-sm font-black text-gray-950 dark:text-white group-hover:text-[#7C3AED] transition-colors">
                            {talent.firstName} {talent.lastName} {talent.artistName && `(${talent.artistName})`}
                          </h3>
                          <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-orange-600" />
                            <span>{talent.commune || "Abidjan"}</span>
                          </p>
                        </div>
                      </div>

                      {/* Bio excerpt */}
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed font-semibold">
                        {talent.bio || "Aucun bio documenté. Excellent musicien accomplant de grands spectacles à Abidjan."}
                      </p>

                      {/* Footer interactive card indicators */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800/60 text-xs">
                        <span className="text-[10px] font-black text-[#D4AF37] flex items-center gap-1 uppercase tracking-wider">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{viewCount} Vues</span>
                        </span>

                        <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => toggleFavorite(talent.uid, e)}
                            className={`p-1.5 rounded-full border transition cursor-pointer ${
                              isFavorited 
                                ? "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20" 
                                : "bg-gray-50 text-gray-400 hover:text-rose-600 dark:bg-gray-800"
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isFavorited ? "fill-current" : ""}`} />
                          </button>
                          
                          <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded uppercase leading-none">
                            🟢 ACTIF
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MAIN RESULTS DIRECTORY ARRAY */}
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-850">
              <h2 className="text-xs font-black uppercase text-gray-400 tracking-wider">
                Artistes trouvés ({filteredTalents.length})
              </h2>
              {favorites.length > 0 && (
                <button 
                  onClick={() => setSearchQuery("fav")}
                  className="text-xs font-black text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                >
                  ❤️ Voir mes favoris ({favorites.length})
                </button>
              )}
            </div>

            {/* Loading display spinner */}
            {loading ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-gray-500 font-extrabold">Chargement de l'annuaire de Côte d'Ivoire...</p>
              </div>
            ) : filteredTalents.length === 0 ? (
              <div className="bg-white dark:bg-[#121214] border border-dashed border-gray-200 dark:border-gray-800 text-center py-12 px-4 rounded-3xl space-y-3 max-w-sm mx-auto">
                <AlertCircle className="w-10 h-10 text-gray-400 mx-auto" />
                <h3 className="text-sm font-black text-gray-950 dark:text-white uppercase leading-none">Aucun talent trouvé</h3>
                <p className="text-xs text-gray-400">Modifiez vos critères de recherche, votre spécialité ou commune pour explorer d'autres musiciens.</p>
                <button 
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSpecialty("all");
                    setSelectedCommune("all");
                    setSelectedCity("all");
                    setFilterAvailability("all");
                  }}
                  className="text-xs font-black text-[#7C3AED] hover:underline"
                >
                  Effacer tous les filtres
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTalents.map(talent => {
                  const isFavorited = favorites.includes(talent.uid);
                  const status = talent.availabilityStatus || ((talent.isAvailableNow ?? true) ? "disponible" : "indisponible");
                  const views = viewsCount[talent.uid] || 12;
                  
                  return (
                    <div 
                      key={talent.uid}
                      onClick={() => handleViewProfileDetail(talent.uid)}
                      className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-850/80 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] cursor-pointer flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        {/* Upper card header : name and ratings */}
                        <div className="flex gap-3.5">
                          {/* Photo avatar */}
                          <div className="relative shrink-0">
                            <img 
                              src={talent.avatarUrl || talent.photoURL || AVATARS[0]} 
                              alt={talent.firstName} 
                              className="w-14 h-14 rounded-xl object-cover border border-gray-200" 
                            />
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#121214] ${
                              status === "disponible" ? "bg-emerald-500" : status === "occupe" ? "bg-amber-500" : "bg-red-500"
                            }`} />
                          </div>

                          <div className="space-y-1 min-w-0 flex-grow">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[9px] font-black uppercase text-purple-650 bg-purple-50 dark:bg-purple-950/20 px-1.5 py-0.5 rounded leading-none">
                                {talent.specialty || "Musicien"}
                              </span>
                              {talent.badges?.map((badge, idx) => {
                                const isGoldNoir = badge.includes("Certifié") || badge.includes("Vérifié");
                                return (
                                  <span key={idx} className={`text-[8px] font-black px-1.5 py-0.5 rounded leading-none border ${
                                    isGoldNoir 
                                      ? "bg-[#D4AF37] text-[#0B0B0B] border-[#D4AF37]/10" 
                                      : "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/15"
                                  }`}>
                                    {badge}
                                  </span>
                                );
                              })}
                            </div>
                            
                            <h3 className="text-sm font-black text-gray-950 dark:text-white truncate">
                              {talent.firstName} {talent.lastName} {talent.artistName && `(${talent.artistName})`}
                            </h3>

                            <p className="text-[10px] text-gray-400 font-bold flex items-center gap-0.5">
                              <MapPin className="w-3 h-3 text-orange-650" />
                              <span className="truncate">{talent.commune || "Cocody"}, Abidjan</span>
                            </p>
                          </div>
                        </div>

                        {/* Bio teaser */}
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                          {talent.bio || "Guitariste exceptionnel d'aventure scénique, actif dans le milieu cabaret à Côte d'ivoire."}
                        </p>
                      </div>

                      {/* Card layout bottom controls */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-[#1a1a1f] text-xs">
                        <span className="text-[9.5px] text-gray-400 font-bold">
                          💼 {talent.gigsCompleted || (talent.experience === "Professionnel" ? 6 : 2)} gombos
                        </span>

                        <div className="flex items-center gap-1.5 onClickPrevent">
                          {/* WhatsApp button */}
                          <a 
                            href={`https://wa.me/${talent.phone.replace(/[^0-9]/g, "")}?text=Bonjour%20${talent.firstName}%20!%20J%27ai%20vu%20ton%20profil%20sur%2520Y%27A%20GOMBO%20MUSIC.`}
                            target="_blank"
                            rel="no-referrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 transition"
                            title="Contacter par WhatsApp"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                          </a>

                          {/* Contact modal trigger */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!currentUserProfile) {
                                alert("Veuillez vous connecter pour envoyer un message.");
                                return;
                              }
                              setContactingTalent(talent);
                              setContactMessage(`Salut ${talent.firstName}, j'ai vu ton profil d'artiste sur l'Annuaire Premium. J'ai un projet de gombo musical pour toi...`);
                            }}
                            className="p-1.5 bg-[#D4AF37]/10 text-[#D4AF37] dark:bg-[#D4AF37]/20 dark:text-[#D4AF37] rounded-lg hover:bg-[#D4AF37]/35 transition cursor-pointer"
                            title="Envoyer un message direct"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Heart favorite button */}
                          <button 
                            onClick={(e) => toggleFavorite(talent.uid, e)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              isFavorited 
                                ? "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20" 
                                : "bg-gray-50 border-gray-150 text-gray-400 hover:text-rose-600 dark:bg-gray-850"
                            }`}
                            title="Ajouter aux favoris"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isFavorited ? "fill-current" : ""}`} />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>
      )}

      {/* DIRECT MESSAGING CONTACT OVERLAY MODAL */}
      {contactingTalent && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#121215] border border-gray-100 dark:border-gray-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl">
            
            <div className="flex justify-between items-start pb-2 border-b border-gray-50 dark:border-gray-850">
              <div>
                <span className="text-[10px] font-black uppercase text-[#D4AF37]">Mise en relation Showbiz</span>
                <h3 className="text-base font-black text-gray-950 dark:text-white uppercase leading-tight">
                  Contacter {contactingTalent.firstName}
                </h3>
              </div>
              <button 
                onClick={() => setContactingTalent(null)}
                className="text-gray-400 hover:text-gray-800 font-black text-xs uppercase"
              >
                Fermer
              </button>
            </div>

            {contactSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/35 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="text-sm font-black text-gray-950 dark:text-white uppercase">Message Envoyé !</h4>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  Votre proposition d'embauche a été envoyée. Retrouvez la discussion en direct dans l'onglet Messagerie.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendMessageSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 block">Votre Message :</label>
                  <textarea 
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    rows={4}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white"
                    placeholder="Écrivez les conditions de date, de cachet de vos spectacles..."
                    required
                  />
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button 
                    type="button"
                    disabled={sendingMessage}
                    onClick={() => setContactingTalent(null)}
                    className="flex-1 py-3 border border-gray-150 text-gray-700 dark:text-gray-300 dark:border-gray-850 hover:bg-gray-50 rounded-xl text-xs font-bold font-sans cursor-pointer disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    disabled={sendingMessage}
                    className="flex-1 py-3 bg-[#D4AF37] hover:bg-[#bfa12d] text-[#0B0B0B] rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingMessage ? "Envoi..." : "Envoyer la demande"}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
