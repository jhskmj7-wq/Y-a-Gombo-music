import React, { useState } from "react";
import { 
  Search, Sliders, Plus, Megaphone, MessageSquare, ShieldCheck, Bell, 
  RefreshCw, Heart, X, Award, Users, Music
} from "lucide-react";
import { Gombo, User, Post } from "../types";

const IVORIAN_COMMUNES = [
  "Cocody", "Yopougon", "Marcory", "Plateau", "Treichville", 
  "Port-Bouët", "Koumassi", "Adjamé", "Abobo", "Bingerville"
];

interface UserTerrainLandingPageProps {
  gombos: Gombo[];
  users: User[];
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  globalSearchTerm: string;
  setGlobalSearchTerm: (val: string) => void;
  universalSearchTerm: string;
  setUniversalSearchTerm: (val: string) => void;
  activeMenu: string;
  setActiveMenu: (val: string) => void;
  terrainTab: string;
  setTerrainTab: (val: any) => void;
  currentSlide: number;
  setCurrentSlide: React.Dispatch<React.SetStateAction<number>>;
  likedGombos: string[];
  setLikedGombos: React.Dispatch<React.SetStateAction<string[]>>;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  selectedLocation: string;
  setSelectedLocation: (val: string) => void;
  selectedType: string;
  setSelectedType: (val: string) => void;
  selectedDateFilter: string;
  setSelectedDateFilter: (val: string) => void;
  setSelectedGomboDetails: (gombo: Gombo | null) => void;
  requireAuthThen: (fn: () => void) => void;
  audioSynth: any;
  activeQuickActionModal: string | null;
  setActiveQuickActionModal: (val: string | null) => void;
  verifyGomboIdInput: string;
  setVerifyGomboIdInput: (val: string) => void;
  verifyGomboIdResult: any;
  setVerifyGomboIdResult: (val: any) => void;
  newNoticeTitle: string;
  setNewNoticeTitle: (val: string) => void;
  newNoticeCategory: string;
  setNewNoticeCategory: (val: string) => void;
  newNoticeBody: string;
  setNewNoticeBody: (val: string) => void;
  addToTerminal: (msg: string) => void;
}

export const UserTerrainLandingPage: React.FC<UserTerrainLandingPageProps> = ({
  gombos,
  users,
  posts,
  setPosts,
  globalSearchTerm,
  setGlobalSearchTerm,
  universalSearchTerm,
  setUniversalSearchTerm,
  setActiveMenu,
  terrainTab,
  setTerrainTab,
  currentSlide,
  setCurrentSlide,
  likedGombos,
  setLikedGombos,
  selectedCategory,
  setSelectedCategory,
  selectedLocation,
  setSelectedLocation,
  selectedType,
  setSelectedType,
  selectedDateFilter,
  setSelectedDateFilter,
  setSelectedGomboDetails,
  requireAuthThen,
  audioSynth,
  activeQuickActionModal,
  setActiveQuickActionModal,
  verifyGomboIdInput,
  setVerifyGomboIdInput,
  verifyGomboIdResult,
  setVerifyGomboIdResult,
  newNoticeTitle,
  setNewNoticeTitle,
  newNoticeCategory,
  setNewNoticeCategory,
  newNoticeBody,
  setNewNoticeBody,
  addToTerminal
}) => {
  const searchStr = globalSearchTerm.toLowerCase();

  // Filter Gombos based on selections
  const GombosToRender = gombos.filter(g => {
    const matchesSearch = !globalSearchTerm || 
      (g.title || "").toLowerCase().includes(searchStr) ||
      (g.description || "").toLowerCase().includes(searchStr) ||
      (g.location || "").toLowerCase().includes(searchStr);

    let matchesCategory = true;
    if (selectedCategory !== "all") {
      const cat = selectedCategory.toLowerCase();
      const txt = ((g.title || "") + " " + (g.description || "")).toLowerCase();
      if (cat === "zouglou") matchesCategory = txt.includes("zouglou");
      else if (cat === "coupé-décalé") matchesCategory = txt.includes("coupé") || txt.includes("décalé") || txt.includes("sheney");
      else if (cat === "rap") matchesCategory = txt.includes("rap") || txt.includes("hip") || txt.includes("beat");
      else if (cat === "traditionnel") matchesCategory = txt.includes("kora") || txt.includes("balafon") || txt.includes("folklore") || txt.includes("sabar");
      else if (cat === "jazz") matchesCategory = txt.includes("jazz") || txt.includes("cabaret") || txt.includes("soul");
    }

    let matchesLocation = true;
    if (selectedLocation !== "all") {
      matchesLocation = (g.location || "").toLowerCase() === selectedLocation.toLowerCase();
    }

    let matchesType = true;
    if (selectedType !== "all") {
      const typeLower = selectedType.toLowerCase();
      const txt = ((g.title || "") + " " + (g.description || "")).toLowerCase();
      if (typeLower === "concert") matchesType = txt.includes("concert") || txt.includes("gala") || txt.includes("festival") || txt.includes("show") || txt.includes("live");
      else if (typeLower === "studio") matchesType = txt.includes("studio") || txt.includes("enregistrement") || txt.includes("cabaret");
      else if (typeLower === "clip") matchesType = txt.includes("clip") || txt.includes("danse") || txt.includes("vidéo") || txt.includes("video");
    }

    let matchesDate = true;
    if (selectedDateFilter !== "all") {
      const df = selectedDateFilter.toLowerCase();
      const gDate = (g.date || "").toLowerCase();
      if (df === "mai 2025") matchesDate = gDate.includes("mai 2025") || gDate.includes("2025-05") || (g.timestamp && g.timestamp.includes("2025-05"));
      else if (df === "juin 2026") matchesDate = gDate.includes("juin 2026") || gDate.includes("2026-06") || (g.timestamp && g.timestamp.includes("2026-06"));
    }

    return matchesSearch && matchesCategory && matchesLocation && matchesType && matchesDate;
  });

  // Spotlight carousel slides matching image
  const spotlightSlides = [
    {
      id: "gombo_spotlight_1",
      title: "CONCERT LIVE",
      description: "Recherche artiste pour concert live à Abidjan.",
      location: "Abidjan, Côte d'Ivoire",
      date: "25 mai 2025",
      budget: "500 000 FCFA",
      imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
      isPremium: true,
      isNew: true
    },
    {
      id: "gombo_spotlight_2",
      title: "FESTIVAL POP",
      description: "Recherche choristes d'élite et percussionnistes pour Grand Festival.",
      location: "Koumassi, Côte d'Ivoire",
      date: "18 juin 2026",
      budget: "950 000 FCFA",
      imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80",
      isPremium: true,
      isNew: true
    },
    {
      id: "gombo_spotlight_3",
      title: "MARIAGE VIP",
      description: "Prestation de rumba par un orchestre complet.",
      location: "Marcory, Côte d'Ivoire",
      date: "20 juin 2026",
      budget: "1 200 000 FCFA",
      imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80",
      isPremium: true,
      isNew: false
    }
  ];

  const currentSlideData = spotlightSlides[currentSlide] || spotlightSlides[0];

  // Raw items matching screenshot rows exactly
  const recentOpportunitiesRaw = [
    {
      id: "gombo_recent_1",
      title: "Enregistrement studio",
      description: "Besoin d'un chanteur pour un projet en studio.",
      location: "Yamoussoukro, Côte d'Ivoire",
      budget: "200 000 FCFA",
      date: "20 mai 2025",
      imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80",
      isNew: true,
      isPremium: false
    },
    {
      id: "gombo_recent_2",
      title: "Danseurs pour clip vidéo",
      description: "Recherche danseurs professionnels pour clip.",
      location: "Abidjan, Côte d'Ivoire",
      budget: "300 000 FCFA",
      date: "19 mai 2025",
      imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80",
      isNew: false,
      isPremium: true
    }
  ];

  // Combine items
  const allRecentItems = [
    ...recentOpportunitiesRaw,
    ...GombosToRender.filter(g => g.id !== "gombo_1" && g.id !== "gombo_2" && !g.id?.includes("spotlight")).map(g => ({
      id: g.id || `gombo_${Math.random()}`,
      title: g.title || "Prestation Musicale",
      description: g.description || "Contrat d'artiste de grande envergure.",
      location: `${g.location || "Abidjan"}, Côte d'Ivoire`,
      budget: `${(g.budget || 250000).toLocaleString("fr-FR")} FCFA`,
      date: g.date || "Immédiat",
      imageUrl: g.imageUrl || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&auto=format&fit=crop&q=80",
      isNew: g.urgent || false,
      isPremium: g.isBoosted || false
    }))
  ];

  const isLiked = (id: string) => likedGombos.includes(id);
  const toggleLike = (id: string) => {
    setLikedGombos(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    try { audioSynth.playTamTam(false); } catch(_) {}
  };

  return (
    <div className="space-y-6 pb-24 text-left animate-fadeIn">
      
      {/* ==========================================
          1. BARRE DE RECHERCHE UNIVERSELLE
         ========================================== */}
      <div className="relative">
        <div className="flex items-center gap-3 bg-[#0d0d0f] border border-zinc-900 rounded-3xl p-3 px-4 shadow-[0_4px_22px_rgba(0,0,0,0.45)]">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            type="text"
            value={globalSearchTerm}
            onChange={(e) => {
              setGlobalSearchTerm(e.target.value);
              setUniversalSearchTerm(e.target.value);
              if (e.target.value.length > 0) {
                try { audioSynth.playTamTam(true); } catch (_) {}
              }
            }}
            placeholder="Rechercher une opportunité, artiste, événement..."
            className="w-full bg-transparent text-sm text-zinc-150 placeholder-zinc-500 focus:outline-none font-sans"
          />
          <button
            onClick={() => {
              setSelectedCategory("all");
              setSelectedLocation("all");
              setSelectedType("all");
              setSelectedDateFilter("all");
              setGlobalSearchTerm("");
              try { audioSynth.playTamTam(false); } catch (_) {}
            }}
            className="text-zinc-500 hover:text-[#D4AF37] transition p-1"
            title="Réinitialiser"
          >
            <Sliders className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Inline Search Results Dropdown Overlay */}
        {globalSearchTerm.trim().length > 0 && (
          <div className="absolute top-14 left-0 right-0 bg-[#0c0c0e] border border-zinc-850 rounded-2xl p-4 z-50 max-h-72 overflow-y-auto space-y-2.5 shadow-2xl">
            <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 font-bold">
              <span>SANS FILTRE (TEMPS RÉEL)</span>
              <button onClick={() => setGlobalSearchTerm("")} className="text-[#D4AF37] font-black uppercase">Fermer</button>
            </div>
            {GombosToRender.slice(0, 5).map((g, i) => (
              <div
                key={g.id || i}
                onClick={() => {
                  setSelectedGomboDetails(g);
                  setGlobalSearchTerm("");
                }}
                className="p-2 hover:bg-zinc-900 rounded-xl cursor-pointer flex justify-between items-center transition"
              >
                <div className="text-left">
                  <span className="text-xs text-zinc-100 font-bold block truncate max-w-[200px]">{g.title}</span>
                  <span className="text-[9.5px] text-[#D4AF37] font-mono leading-none">📍 {g.location} • {(g.budget || 0).toLocaleString("fr-FR")} FCFA</span>
                </div>
                <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold shrink-0">Ouvrir →</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==========================================
          2. ACTIONS RAPIDES (STYLE HORIZONTAL PILLS)
         ========================================== */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-sans font-black tracking-widest text-[#FFFFFF] uppercase">
          ACTIONS RAPIDES
        </h3>
        <div className="flex overflow-x-auto gap-3.5 pb-2 scrollbar-none items-center w-full select-none">
          {/* 1. Publier */}
          <div
            onClick={() => {
              requireAuthThen(() => {
                setActiveMenu("user_publish");
                try { audioSynth.playValidationSuccess(); } catch (_) {}
              });
            }}
            className="bg-[#0c0c0e] border border-zinc-900 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 hover:border-zinc-800 transition-all w-[76px] shrink-0 cursor-pointer active:scale-95"
          >
            <div className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center bg-transparent">
              <Plus className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <span className="text-[9.5px] text-zinc-400 font-bold tracking-wide">Publier</span>
          </div>

          {/* 2. Mes Gombos */}
          <div
            onClick={() => {
              requireAuthThen(() => {
                setActiveMenu("user_mes_gombos");
                try { audioSynth.playValidationSuccess(); } catch (_) {}
              });
            }}
            className="bg-[#0c0c0e] border border-zinc-900 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 hover:border-zinc-800 transition-all w-[76px] shrink-0 cursor-pointer active:scale-95"
          >
            <div className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center bg-transparent">
              <Megaphone className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <span className="text-[9.5px] text-zinc-400 font-bold tracking-wide leading-none">Gombos</span>
          </div>

          {/* 3. Messages */}
          <div
            onClick={() => {
              requireAuthThen(() => {
                setActiveMenu("user_messages");
                try { audioSynth.playValidationSuccess(); } catch (_) {}
              });
            }}
            className="bg-[#0c0c0e] border border-zinc-900 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 hover:border-zinc-800 transition-all w-[76px] shrink-0 cursor-pointer relative active:scale-95"
          >
            <div className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center bg-transparent">
              <MessageSquare className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <span className="text-[9.5px] text-zinc-400 font-bold tracking-wide">Messages</span>
          </div>

          {/* 4. Gombo ID */}
          <div
            onClick={() => {
              requireAuthThen(() => {
                setActiveMenu("user_gombo_id");
                try { audioSynth.playValidationSuccess(); } catch (_) {}
              });
            }}
            className="bg-[#0c0c0e] border border-zinc-900 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 hover:border-zinc-800 transition-all w-[76px] shrink-0 cursor-pointer active:scale-95"
          >
            <div className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center bg-transparent">
              <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <span className="text-[9.5px] text-zinc-400 font-bold tracking-wide">Gombo ID</span>
          </div>

          {/* 5. Notifications */}
          <div
            onClick={() => {
              requireAuthThen(() => {
                setActiveMenu("user_notifications");
                try { audioSynth.playValidationSuccess(); } catch (_) {}
              });
            }}
            className="bg-[#0c0c0e] border border-zinc-900 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 hover:border-zinc-800 transition-all w-[76px] shrink-0 cursor-pointer relative active:scale-95"
          >
            <div className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center bg-transparent">
              <Bell className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <span className="text-[9.5px] text-zinc-400 font-bold tracking-wide">Notifs</span>
          </div>
        </div>
      </div>

      {/* ==========================================
          3. FILTRES RAPIDES (ADAPTIVE DROPDOWNS)
         ========================================== */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-[11px] font-sans font-black tracking-widest text-[#FFFFFF] uppercase">
            FILTRES RAPIDES
          </h3>
          <button
            onClick={() => {
              setSelectedCategory("all");
              setSelectedLocation("all");
              setSelectedType("all");
              setSelectedDateFilter("all");
              setGlobalSearchTerm("");
              try { audioSynth.playTamTam(false); } catch (_) {}
            }}
            className="text-[10.5px] text-zinc-400 hover:text-white transition-all flex items-center gap-1.5 focus:outline-none"
          >
            <span>Réinitialiser</span>
            <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>

        {/* 4 Core dropdown selects */}
        <div className="grid grid-cols-4 gap-2">
          {/* Category */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                try { audioSynth.playTamTam(true); } catch (_) {}
              }}
              className="w-full bg-[#0c0c0e] border border-zinc-900 hover:border-zinc-800 text-[10.5px] text-zinc-300 rounded-xl p-2.5 font-bold uppercase tracking-wider focus:outline-none appearance-none cursor-pointer text-center"
            >
              <option value="all">Catégorie</option>
              <option value="zouglou">Zouglou</option>
              <option value="coupé-décalé">Coupé-Décalé</option>
              <option value="rap">Rap / Pop</option>
              <option value="traditionnel">Traditionnel</option>
              <option value="jazz">Jazz / Blues</option>
            </select>
          </div>

          {/* Localisation */}
          <div className="relative">
            <select
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
                try { audioSynth.playTamTam(true); } catch (_) {}
              }}
              className="w-full bg-[#0c0c0e] border border-zinc-900 hover:border-zinc-800 text-[10.5px] text-zinc-300 rounded-xl p-2.5 font-bold uppercase tracking-wider focus:outline-none appearance-none cursor-pointer text-center"
            >
              <option value="all">Localisation</option>
              {IVORIAN_COMMUNES.map(commune => (
                <option key={commune} value={commune}>{commune}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                try { audioSynth.playTamTam(true); } catch (_) {}
              }}
              className="w-full bg-[#0c0c0e] border border-zinc-900 hover:border-zinc-800 text-[10.5px] text-zinc-300 rounded-xl p-2.5 font-bold uppercase tracking-wider focus:outline-none appearance-none cursor-pointer text-center"
            >
              <option value="all">Type</option>
              <option value="concert">Concert</option>
              <option value="studio">Studio</option>
              <option value="clip">Clip Vidéo</option>
            </select>
          </div>

          {/* Date */}
          <div className="relative">
            <select
              value={selectedDateFilter}
              onChange={(e) => {
                setSelectedDateFilter(e.target.value);
                try { audioSynth.playTamTam(true); } catch (_) {}
              }}
              className="w-full bg-[#0c0c0e] border border-zinc-900 hover:border-zinc-800 text-[10.5px] text-zinc-300 rounded-xl p-2.5 font-bold uppercase tracking-wider focus:outline-none appearance-none cursor-pointer text-center"
            >
              <option value="all">Date</option>
              <option value="mai 2025">Mai 2025</option>
              <option value="juin 2026">Juin 2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* ==========================================
          4. OPPORTUNITÉS À LA UNE (SPOTLIGHT)
         ========================================== */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center">
          <h3 className="text-[11px] font-sans font-black tracking-widest text-[#FFFFFF] uppercase">
            OPPORTUNITÉS À LA UNE
          </h3>
          <button
            onClick={() => {
              setGlobalSearchTerm("");
              setSelectedCategory("all");
              try { audioSynth.playTamTam(false); } catch (_) {}
            }}
            className="text-xs text-[#D4AF37] font-bold"
          >
            Voir tout
          </button>
        </div>

        {/* Feature Spotlight Card banner */}
        <div className="relative h-[220px] rounded-[24px] overflow-hidden group shadow-2xl border border-zinc-900">
          <img
            src={currentSlideData.imageUrl}
            alt={currentSlideData.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/25" />

          {/* Content overlay */}
          <div className="absolute inset-0 p-5 flex flex-col justify-between text-left">
            <div className="flex justify-between items-start">
              {currentSlideData.isPremium && (
                <span className="text-[9.5px] font-bold bg-[#D4AF37] text-black px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center shadow-md font-sans">
                  ★ PREMIUM
                </span>
              )}
              <button
                onClick={() => toggleLike(currentSlideData.id)}
                className="text-white hover:text-red-500 transition-colors p-1"
                title="S'allier"
              >
                <Heart className={`w-5 h-5 ${isLiked(currentSlideData.id) ? "fill-[#D4AF37] text-[#D4AF37]" : "text-white"}`} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-white tracking-wider font-sans">
                  {currentSlideData.title}
                </h2>
                <p className="text-xs text-white/95 line-clamp-1">
                  {currentSlideData.description}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-white/70 font-mono">
                  <span>📍 {currentSlideData.location}</span>
                  <span>📅 {currentSlideData.date}</span>
                </div>
              </div>

              {/* Price and Action button */}
              <div className="flex justify-between items-end border-t border-white/10 pt-2.5">
                <div>
                  <span className="text-[8px] uppercase text-white/50 tracking-wider block font-mono">Paiement</span>
                  <span className="text-[15px] font-bold text-[#D4AF37]">{currentSlideData.budget}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      try { audioSynth.playValidationSuccess(); } catch(_) {}
                      const matchingReal = gombos.find(g => g.id === "gombo_1") || gombos[0];
                      setSelectedGomboDetails(matchingReal);
                    }}
                    className="px-3.5 py-1.5 border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black text-[9.5px] font-bold rounded-lg transition uppercase duration-150"
                  >
                    DÉTAILS
                  </button>
                  {currentSlideData.isNew && (
                    <span className="text-[8px] font-bold bg-[#09090b] border border-emerald-500/25 text-emerald-400 px-2 py-1 rounded uppercase tracking-wider font-mono">
                      NOUVEAU
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel slide indicators */}
        <div className="flex justify-center gap-1.5 mt-2">
          {spotlightSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentSlide(idx);
                try { audioSynth.playTamTam(false); } catch (_) {}
              }}
              className={`h-1.5 transition-all rounded-full ${
                currentSlide === idx ? "w-5 bg-[#D4AF37]" : "w-1.5 bg-zinc-700/80 hover:bg-zinc-650"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ==========================================
          5. OPPORTUNITÉS RÉCENTES (HORIZONTAL ROWS)
         ========================================== */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center">
          <h3 className="text-[11px] font-sans font-black tracking-widest text-[#FFFFFF] uppercase">
            OPPORTUNITÉS RÉCENTES
          </h3>
          <button
            onClick={() => {
              setSelectedCategory("all");
              setSelectedLocation("all");
              try { audioSynth.playTamTam(false); } catch (_) {}
            }}
            className="text-xs text-[#D4AF37] font-bold"
          >
            Voir tout
          </button>
        </div>

        {/* List representation matches physical drawing on photo */}
        <div className="space-y-3.5">
          {allRecentItems.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#0c0c0e] border border-zinc-900 text-zinc-500 text-xs font-mono">
              Aucune opportunité récente pour vos filtres sélectionnés.
            </div>
          ) : (
            allRecentItems.map((item) => (
              <div
                key={item.id}
                className="flex bg-[#0c0c0e] border border-zinc-900/90 hover:border-zinc-800 rounded-2xl p-3 items-center gap-3 transition-colors shadow-sm relative group"
              >
                {/* Left Thumbnail with Gold G logo overlay */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute bottom-1 left-1 w-4.5 h-4.5 bg-[#D4AF37]/95 border border-black rounded-full flex items-center justify-center shadow">
                    <span className="text-[7.5px] font-black text-black">G</span>
                  </div>
                </div>

                {/* Right detail text & Heart icon aligns */}
                <div className="flex-1 min-w-0 h-full flex flex-col justify-between py-0.5">
                  <div className="flex justify-between items-start gap-1">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.isNew && (
                          <span className="text-[7px] font-bold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">
                            NOUVEAU
                          </span>
                        )}
                        {item.isPremium && (
                          <span className="text-[7px] font-bold bg-[#D4AF37]/10 border border-[#D4AF37]/35 text-[#D4AF37] px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">
                            PREMIUM
                          </span>
                        )}
                      </div>
                      
                      <h4
                        onClick={() => {
                          try { audioSynth.playTamTam(false); } catch(_) {}
                          const foundReal = gombos.find(g => g.id === item.id) || gombos[0];
                          setSelectedGomboDetails(foundReal);
                        }}
                        className="text-xs font-black text-white hover:text-zinc-300 transition-all cursor-pointer tracking-wide mt-1 truncate max-w-[190px] sm:max-w-xs uppercase"
                      >
                        {item.title}
                      </h4>
                      
                      <p className="text-[9.5px] text-zinc-400 truncate max-w-[190px] sm:max-w-xs mt-0.5 font-sans leading-none">
                        {item.description}
                      </p>
                    </div>

                    {/* Heart button */}
                    <button
                      onClick={() => toggleLike(item.id)}
                      className="text-zinc-500 hover:text-white transition p-1 shrink-0"
                    >
                      <Heart className={`w-4 h-4 ${isLiked(item.id) ? "fill-[#D4AF37] text-[#D4AF37]" : "text-zinc-500"}`} />
                    </button>
                  </div>

                  {/* Location under description */}
                  <div className="flex justify-between items-end mt-2 pt-1.5 border-t border-zinc-900/40">
                    <span className="text-[9px] text-zinc-500 font-medium font-sans">
                      📍 {item.location}
                    </span>

                    {/* Budget & Date beneath it */}
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#D4AF37] block leading-none">
                        {item.budget}
                      </span>
                      <span className="text-[8px] text-zinc-500 font-mono tracking-tight block mt-0.5 leading-none">
                        {item.date}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ==========================================
          6. SÉCURITÉ ET COPYRIGHT FOOTER
         ========================================== */}
      <footer className="mt-12 border-t border-zinc-900 pt-6 pb-4 space-y-4 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
          <div className="flex gap-4">
            <button onClick={() => setActiveMenu("terms")} className="hover:text-white">CGU</button>
            <span>•</span>
            <button onClick={() => setActiveMenu("privacy")} className="hover:text-white">Confidentialité</button>
          </div>
          <p className="text-zinc-600">© 2026. AFRIGOMBO SHOWBIZ • SOUVERAINETÉ ARTISTIQUE</p>
        </div>
      </footer>

      {/* =========================================================================
          INTERACTIVE ACTIONS MODAL OVERLAYS (SOUVERAIN COMMANDE CENTRE)
         ========================================================================= */}
      {activeQuickActionModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0E0E10] border border-[#D4AF37]/35 rounded-3xl p-6 sm:p-8 w-full max-w-md my-8 relative overflow-hidden select-none shadow-[0_15px_50px_rgba(0,0,0,0.95)]">
            
            <button
              onClick={() => {
                setActiveQuickActionModal(null);
                try { audioSynth.playTamTam(false); } catch (_) {}
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-[#D4AF37] hover:text-white border border-white/5 flex items-center justify-center cursor-pointer transition focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>

            {/* MODAL I: ANNURIA DE RECHERCHE DE MEMBRES */}
            {activeQuickActionModal === "search_member" && (() => {
              const [memberQuery, setMemberQuery] = useState("");
              const [communeVal, setCommuneVal] = useState("all");
              const matched = users.filter(u => {
                const textOk = (u.artisticName || u.name || "").toLowerCase().includes(memberQuery.toLowerCase());
                const communeOk = communeVal === "all" || u.commune === communeVal;
                return textOk && communeOk;
              });

              return (
                <div className="space-y-4 text-left">
                  <div>
                    <h3 className="text-sm font-sans font-black tracking-widest text-[#FFFFFF] uppercase flex items-center gap-2">
                      👥 RECHERCHER UN MAÎTRE DE SCÈNE
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-1">Garantie Souveraine de l'Afrique de l'Ouest.</p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Saisir un nom d'artiste..."
                      value={memberQuery}
                      onChange={(e) => setMemberQuery(e.target.value)}
                      className="flex-1 bg-black border border-zinc-800 text-xs text-white p-2.5 rounded-xl font-mono focus:outline-none"
                    />
                    <select
                      value={communeVal}
                      onChange={(e) => setCommuneVal(e.target.value)}
                      className="bg-black border border-zinc-800 text-[10px] text-[#D4AF37] px-2 rounded-xl focus:outline-none font-bold"
                    >
                      <option value="all">Commune</option>
                      {IVORIAN_COMMUNES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {matched.length === 0 ? (
                      <div className="text-center py-6 text-xs text-zinc-600 font-mono">
                        Aucun membre ne correspond à ce critère.
                      </div>
                    ) : (
                      matched.map(u => (
                        <div key={u.id} className="p-3 bg-black border border-zinc-900 rounded-xl space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <strong className="text-xs text-white uppercase font-bold block">{u.artisticName}</strong>
                              <span className="text-[9px] font-mono text-zinc-550 block mt-1">{u.commune} • {u.instruments?.join(", ") || "Zouglou"}</span>
                            </div>
                            {u.kycStatus === "approved" && (
                              <span className="text-[7.5px] font-mono bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] px-1.5 py-0.5 rounded font-black tracking-wide shrink-0">COMPTE VÉRIFIÉ</span>
                            )}
                          </div>
                          <div className="flex gap-2 pt-1">
                            <a
                              href={`tel:${u.phone || "0700000000"}`}
                              className="flex-1 py-1 px-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[9px] font-mono font-bold uppercase rounded-lg text-center"
                            >
                              📞 Appeler
                            </a>
                            <button
                              onClick={() => {
                                addToTerminal(`[MESSAGE] Alliance initiée avec ${u.artisticName}`);
                                alert(`✉️ Alliance Afrigombo : Message d'invitation directe transmis pour ${u.artisticName}.`);
                                try { audioSynth.playValidationSuccess(); } catch(_) {}
                              }}
                              className="flex-1 py-1 px-2 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/25 text-[9px] font-mono font-bold uppercase rounded-lg"
                            >
                              ✉ S'allier
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })()}

            {/* MODAL II: VERIFIER GOMBO ID SÉCURISÉ */}
            {activeQuickActionModal === "verify_gombo_id" && (
              <div className="space-y-4 text-left">
                <div>
                  <h3 className="text-sm font-sans font-black tracking-widest text-[#FFFFFF] uppercase flex items-center gap-2">
                    🛡️ VÉRIFICATION ACADÉMIQUE DU COMPTE
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1">Vérification de l'intégrité nationale des musiciens.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: GMB-4859-CI"
                      value={verifyGomboIdInput}
                      onChange={(e) => setVerifyGomboIdInput(e.target.value)}
                      className="flex-1 bg-black border border-zinc-800 text-xs text-[#D4AF37] p-2.5 rounded-xl font-mono focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const verifiedUser = users.find(u => u.kycStatus === "approved" || u.isCertified);
                        if (verifyGomboIdInput.trim().length > 3 && verifiedUser) {
                          setVerifyGomboIdResult({
                            success: true,
                            artisticName: verifiedUser.artisticName,
                            name: verifiedUser.name,
                            commune: verifiedUser.commune,
                            score: 96,
                            status: "PRESTIGE NATIONAL SÉCURISÉ"
                          });
                          addToTerminal(`[SÉCURITÉ] Vérification d'intégrité réussie pour ${verifyGomboIdInput}`);
                        } else {
                          setVerifyGomboIdResult({
                            success: false,
                            message: "ID non attribué. Aucun enregistrement d'or correspondant."
                          });
                        }
                        try { audioSynth.playTamTam(true); } catch (_) {}
                      }}
                      className="bg-[#D4AF37] text-black px-4 text-xs font-bold rounded-xl"
                    >
                      Valider
                    </button>
                  </div>

                  {verifyGomboIdResult && (
                    <div className="p-4 bg-black border border-zinc-800 rounded-xl space-y-1">
                      {verifyGomboIdResult.success ? (
                        <>
                          <span className="text-[9.5px] font-mono text-emerald-400 uppercase font-black">✓ COMPTE RECONNU INTÈGRE</span>
                          <p className="text-xs text-white font-bold">{verifyGomboIdResult.artisticName} ({verifyGomboIdResult.name})</p>
                          <p className="text-[10px] text-zinc-400">Score d'Afrique de l'Ouest : <span className="text-[#D4AF37] font-bold">{verifyGomboIdResult.score}% garantis</span></p>
                        </>
                      ) : (
                        <p className="text-xs text-red-400 font-semibold">✗ {verifyGomboIdResult.message}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MODAL III: PROPAGE LE TAM-TAM (NOTIFICATION BANNER CANAL) */}
            {activeQuickActionModal === "send_notification" && (
              <div className="space-y-4 text-left">
                <div>
                  <h3 className="text-sm font-sans font-black tracking-widest text-[#FFFFFF] uppercase">
                    📢 DIFFUSER URGENCE NATIONALE
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1">Transmettre par vibration sonore de Tam-tam sur le Terrain.</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-550 uppercase font-black">Sujet principal</label>
                    <input
                      type="text"
                      placeholder="Ex: Session acoustique studio urgente"
                      value={newNoticeTitle}
                      onChange={(e) => setNewNoticeTitle(e.target.value)}
                      className="w-full bg-black border border-zinc-800 text-xs text-white p-2.5 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-[#D4AF37] uppercase font-black">Intensité</label>
                    <select
                      value={newNoticeCategory}
                      onChange={(e) => setNewNoticeCategory(e.target.value)}
                      className="w-full bg-black border border-zinc-800 text-xs text-[#D4AF37] p-2.5 rounded-xl focus:outline-none font-bold"
                    >
                      <option value="INFO">INFORMATION générale</option>
                      <option value="URGENT">URGENT (Alerte vibration rouge)</option>
                      <option value="BUZZ">ACTUS SCÈNES (Grande clameur)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-550 uppercase font-black">Annonce</label>
                    <textarea
                      rows={3}
                      placeholder="Quel est le message pour la communauté ?"
                      value={newNoticeBody}
                      onChange={(e) => setNewNoticeBody(e.target.value)}
                      className="w-full bg-black border border-zinc-800 text-xs text-white p-2.5 rounded-xl focus:outline-none font-sans"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (newNoticeTitle && newNoticeBody) {
                        const newNoticePost: Post = {
                          id: `post_${Date.now()}`,
                          userId: "user_pro",
                          authorName: "Annonce Souveraine",
                          authorArtisticName: `TRÔNE [${newNoticeCategory}]`,
                          content: `📣 [${newNoticeTitle.toUpperCase()}] : ${newNoticeBody}`,
                          likes: 12,
                          comments: 0
                        };
                        setPosts(prev => [newNoticePost, ...prev]);
                        addToTerminal(`[DIFFUSION] Publication réussie sur le Terrain : ${newNoticeTitle}`);
                        setActiveQuickActionModal(null);
                        try { audioSynth.playTamTam(true); } catch (_) {}
                        alert("🔥 Tam-tam propagé avec succès à toute la Côte d'Ivoire !");
                      } else {
                        alert("Veuillez remplir l'annonce souveraine.");
                      }
                    }}
                    className="w-full py-2.5 bg-[#D4AF37] text-black font-black text-xs rounded-xl hover:opacity-90 transition uppercase font-sans tracking-widest mt-1"
                  >
                    Lancer la propagation ⚡
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
