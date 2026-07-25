import React, { useState, useEffect } from "react";
import { 
  GraduationCap, BookOpen, Play, FileText, Video, Award, CheckCircle2, 
  ShieldCheck, AlertTriangle, Plus, Search, Star, Clock, Users, ChevronRight, 
  ArrowLeft, Lock, DollarSign, Sparkles, UserCheck, Crown, ExternalLink, Info, TrendingUp
} from "lucide-react";
import { UserProfile } from "../types";
import { supportConfig } from "../supportConfig";
import { AfriModal } from "./common/AfriModal";

export interface AcademyCourse {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: "mao" | "mixage" | "burida" | "vocal" | "business";
  level: "Débutant" | "Intermédiaire" | "Avancé" | "Masterclass";
  price: number; // FCFA, 0 = gratuit
  instructorName: string;
  instructorId: string;
  instructorAvatar: string;
  instructorRole: string;
  instructorTrustScore: number;
  instructorCertified: boolean;
  duration: string;
  lessonsCount: number;
  format: "Vidéo HD" | "PDF & Guide" | "Hybride (Vidéo + PDF)";
  rating: number;
  studentsCount: number;
  previewVideoUrl?: string;
  modules: { id: number; title: string; duration: string; isFreePreview?: boolean }[];
  createdAt: string;
}

const INITIAL_ACADEMY_COURSES: AcademyCourse[] = [
  {
    id: "course-1",
    title: "Masterclass M.A.O : Composition Afrobeats & Coupé-Décalé",
    subtitle: "Apprenez à composer des beats percutants de A à Z avec FL Studio 21 & Ableton",
    description: "Formation complète conçue pour les beatmakers africains. Structure drum kit 3/4, syncopes, choix des synthés lead, programmation de basses lourdes et arrangements captivants prêts pour le club.",
    category: "mao",
    level: "Intermédiaire",
    price: 15000,
    instructorName: "DJ Mix Master",
    instructorId: "inst-mix-1",
    instructorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    instructorRole: "Producteur & Ingénieur du son multi-platine",
    instructorTrustScore: 98,
    instructorCertified: true,
    duration: "4h 30m",
    lessonsCount: 14,
    format: "Vidéo HD",
    rating: 4.9,
    studentsCount: 342,
    previewVideoUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800",
    modules: [
      { id: 1, title: "Module 1 : Configuration du projet & Choix du tempo", duration: "18 min", isFreePreview: true },
      { id: 2, title: "Module 2 : Création des Drums Afrobeats & Percussions ivoiriennes", duration: "35 min", isFreePreview: true },
      { id: 3, title: "Module 3 : Harmonies & Progression d'accords envoûtantes", duration: "42 min" },
      { id: 4, title: "Module 4 : Mixage pré-mastering & Export stéréo", duration: "25 min" }
    ],
    createdAt: "2026-07-10"
  },
  {
    id: "course-2",
    title: "Guide Juridique BURIDA & Droits d'Auteur en Côte d'Ivoire",
    subtitle: "Protéger vos œuvres, déclarer vos titres et percevoir vos redevances streaming",
    description: "Guide essentiel pour tous les artistes, compositeurs et producteurs. Comprenez la répartition des droits d'exécution publique (DEP), les contrats d'édition et l'enregistrement BURIDA.",
    category: "burida",
    level: "Débutant",
    price: 0, // Gratuit
    instructorName: "Maître Bamba Sylvain",
    instructorId: "inst-bamba-law",
    instructorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    instructorRole: "Avocat spécialiste en Droit de la Musique",
    instructorTrustScore: 100,
    instructorCertified: true,
    duration: "2h 15m",
    lessonsCount: 8,
    format: "Hybride (Vidéo + PDF)",
    rating: 5.0,
    studentsCount: 1280,
    previewVideoUrl: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800",
    modules: [
      { id: 1, title: "Module 1 : Les bases du Droit d'Auteur en Afrique de l'Ouest", duration: "20 min", isFreePreview: true },
      { id: 2, title: "Module 2 : Étapes pas à pas pour s'affilier au BURIDA", duration: "30 min", isFreePreview: true },
      { id: 3, title: "Module 3 : Décoder un contrat de production & distribution digital", duration: "45 min" }
    ],
    createdAt: "2026-07-15"
  },
  {
    id: "course-3",
    title: "Techniques de Mixage Vocal Afropop & Mastering Studio",
    subtitle: "Nettoyez vos voix, appliquez l'Auto-Tune subtil et donnez de la clarté radio à vos morceaux",
    description: "Maîtrisez l'égalisation chirurgicale, la compression parallèle, la réverbe spatiale et le traitement de la voix principale pour obtenir un son radio professionnel.",
    category: "mixage",
    level: "Avancé",
    price: 25000,
    instructorName: "Koffi Sound Engineer",
    instructorId: "inst-koffi-mix",
    instructorAvatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150",
    instructorRole: "Chef Opérateur du Son & Formateur",
    instructorTrustScore: 96,
    instructorCertified: true,
    duration: "5h 10m",
    lessonsCount: 18,
    format: "Vidéo HD",
    rating: 4.8,
    studentsCount: 210,
    previewVideoUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800",
    modules: [
      { id: 1, title: "Module 1 : Calibrage de la chaîne d'enregistrement", duration: "22 min", isFreePreview: true },
      { id: 2, title: "Module 2 : Égalisation & De-Essing chirurgical", duration: "40 min" },
      { id: 3, title: "Module 3 : Compression vocale & Auto-Tune naturel", duration: "50 min" }
    ],
    createdAt: "2026-07-18"
  },
  {
    id: "course-4",
    title: "Music Business : Développer sa Fanbase & Négocier ses Gombos",
    subtitle: "Comment vivre de sa musique en Afrique sans dépendre des majors",
    description: "Stratégies concrètes de marketing digital pour artistes indépendants : campagne TikTok/Instagram, booking direct de prestations et rentabilisation de son catalogue.",
    category: "business",
    level: "Intermédiaire",
    price: 10000,
    instructorName: "Alliance Prod Agency",
    instructorId: "inst-alliance",
    instructorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    instructorRole: "Manager d'Artistes & Event Strategist",
    instructorTrustScore: 99,
    instructorCertified: true,
    duration: "3h 00m",
    lessonsCount: 10,
    format: "PDF & Guide",
    rating: 4.9,
    studentsCount: 520,
    previewVideoUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
    modules: [
      { id: 1, title: "Module 1 : Image de marque & Kit Média d'un artiste", duration: "25 min", isFreePreview: true },
      { id: 2, title: "Module 2 : Négocier ses cachets & rédiger un contrat Gombo", duration: "35 min" }
    ],
    createdAt: "2026-07-22"
  }
];

interface AcademieViewProps {
  currentUserProfile?: UserProfile;
  onNavigateView?: (view: string, tab?: any) => void;
  onBack?: () => void;
}

export const AcademieView: React.FC<AcademieViewProps> = ({
  currentUserProfile,
  onNavigateView,
  onBack
}) => {
  const [courses, setCourses] = useState<AcademyCourse[]>(() => {
    const saved = localStorage.getItem("afrigombo_academy_courses");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_ACADEMY_COURSES;
  });

  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("afrigombo_enrolled_courses");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return ["course-2"]; // Free course enrolled by default
  });

  const [activeTab, setActiveTab] = useState<"catalog" | "my_courses">("catalog");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<AcademyCourse | null>(null);

  // Modals
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEnrollSuccessModalOpen, setIsEnrollSuccessModalOpen] = useState<boolean>(false);
  const [enrolledCourseTitle, setEnrolledCourseTitle] = useState<string>("");

  // Create Course Form State
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newCategory, setNewCategory] = useState<AcademyCourse["category"]>("mao");
  const [newLevel, setNewLevel] = useState<AcademyCourse["level"]>("Intermédiaire");
  const [newFormat, setNewFormat] = useState<AcademyCourse["format"]>("Vidéo HD");
  const [newPrice, setNewPrice] = useState("10000"); // FCFA
  const [newDuration, setNewDuration] = useState("2h 30m");
  const [newLessonsCount, setNewLessonsCount] = useState("10");
  const [newDescription, setNewDescription] = useState("");

  // Save courses & enrollments to localStorage
  useEffect(() => {
    localStorage.setItem("afrigombo_academy_courses", JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem("afrigombo_enrolled_courses", JSON.stringify(enrolledCourseIds));
  }, [enrolledCourseIds]);

  // Compute Instructor Eligibility
  const trustScore = currentUserProfile?.trustScore ?? currentUserProfile?.gomboId?.scoreConfiance ?? 50;
  const isCertified = !!currentUserProfile?.gomboId?.certifie || currentUserProfile?.isVip || currentUserProfile?.isPro || currentUserProfile?.isPremium;
  
  // Requirement to be an Instructor/Enseignant: Certification AND Trust Score >= 60
  const canCreateCourse = isCertified && trustScore >= 60;

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const myEnrolledCourses = courses.filter(course => enrolledCourseIds.includes(course.id));

  // Commission calculations (5% Platform Fee, 95% Instructor)
  const priceVal = parseFloat(newPrice) || 0;
  const platformCommission = Math.round(priceVal * 0.05);
  const instructorEarnings = Math.max(0, priceVal - platformCommission);

  const handleEnrollInCourse = (course: AcademyCourse) => {
    if (!enrolledCourseIds.includes(course.id)) {
      setEnrolledCourseIds([...enrolledCourseIds, course.id]);
    }
    setEnrolledCourseTitle(course.title);
    setSelectedCourse(null);
    setIsEnrollSuccessModalOpen(true);

    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('gombo_play_sound', { detail: { name: 'validation' } }));
    }
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    const newCourseItem: AcademyCourse = {
      id: `course-${Date.now()}`,
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || newTitle.trim(),
      description: newDescription.trim(),
      category: newCategory,
      level: newLevel,
      price: parseFloat(newPrice) || 0,
      instructorName: currentUserProfile?.displayName || "Formateur Certifié AFRIGOMBO",
      instructorId: currentUserProfile?.uid || "current_user",
      instructorAvatar: currentUserProfile?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      instructorRole: "Enseignant Certifié Gombo Academy",
      instructorTrustScore: trustScore,
      instructorCertified: true,
      duration: newDuration.trim() || "2h 00m",
      lessonsCount: parseInt(newLessonsCount) || 8,
      format: newFormat,
      rating: 5.0,
      studentsCount: 1,
      previewVideoUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800",
      modules: [
        { id: 1, title: "Module 1 : Introduction & Pré-requis", duration: "15 min", isFreePreview: true },
        { id: 2, title: "Module 2 : Pratique guidée & Exercices", duration: "45 min" },
        { id: 3, title: "Module 3 : Bilan & Certification", duration: "30 min" }
      ],
      createdAt: new Date().toISOString().split('T')[0]
    };

    setCourses([newCourseItem, ...courses]);
    setEnrolledCourseIds([...enrolledCourseIds, newCourseItem.id]);
    setIsCreateModalOpen(false);

    // Reset Form
    setNewTitle("");
    setNewSubtitle("");
    setNewDescription("");

    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('gombo_play_sound', { detail: { name: 'validation' } }));
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 space-y-5 text-left py-2 xs:py-4 pb-32 animate-fadeIn">
      
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-afri-bg-sec via-afri-bg to-afri-bg-sec border border-[#D4AF37]/40 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="w-9 h-9 rounded-xl bg-afri-bg border border-afri-border text-afri-text-sec hover:text-afri-text flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-[#D4AF37]" />
                <h1 className="text-xl sm:text-2xl font-black text-afri-text uppercase tracking-tight">
                  L'Académie AFRIGOMBO
                </h1>
                <span className="px-2 py-0.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[9px] font-mono font-black uppercase rounded-md tracking-wider">
                  MASTERCLASSES & GUIDES
                </span>
              </div>
              <p className="text-xs text-afri-text-sec mt-1">
                Formations vidéo, M.A.O, Mixage, Droit d'auteur BURIDA et Music Business par des experts africains.
              </p>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsInfoModalOpen(true)}
              className="w-9 h-9 rounded-xl bg-afri-bg-ter border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all flex items-center justify-center cursor-pointer shadow-sm"
              title="Règles & Commission de l'Académie"
            >
              <Info className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-afri-gold hover:brightness-110 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Créer un cours (Formateur)</span>
            </button>
          </div>
        </div>
      </div>

      {/* TABS & FILTERS */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-afri-border/60 pb-3">
          {/* TABS */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("catalog")}
              className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "catalog"
                  ? "bg-[#D4AF37] text-black shadow-md font-black"
                  : "bg-afri-bg-sec border border-afri-border text-afri-text-sec hover:text-afri-text"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Catalogue</span>
              <span className="px-1.5 py-0.2 bg-black/20 text-[10px] rounded-full font-mono font-bold">
                {courses.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("my_courses")}
              className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "my_courses"
                  ? "bg-[#D4AF37] text-black shadow-md font-black"
                  : "bg-afri-bg-sec border border-afri-border text-afri-text-sec hover:text-afri-text"
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Mes Cours</span>
              <span className="px-1.5 py-0.2 bg-black/20 text-[10px] rounded-full font-mono font-bold">
                {myEnrolledCourses.length}
              </span>
            </button>
          </div>

          {/* SEARCH BAR */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-afri-text-sec absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une masterclass..."
              className="w-full bg-afri-bg-sec border border-afri-border rounded-xl pl-9 pr-3 py-2 text-xs text-afri-text focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
        </div>

        {/* CATEGORY CHIPS */}
        {activeTab === "catalog" && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            {[
              { id: "all", label: "Toutes les formations" },
              { id: "mao", label: "🎹 M.A.O & Beatmaking" },
              { id: "mixage", label: "🎛️ Mixage & Mastering" },
              { id: "burida", label: "⚖️ Droit & BURIDA" },
              { id: "vocal", label: "🎙️ Vocaux & Chant" },
              { id: "business", label: "💼 Music Business" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-afri-bg-ter border-[#D4AF37] text-[#D4AF37] shadow-xs"
                    : "bg-afri-bg border-afri-border text-afri-text-sec hover:text-afri-text"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CONTENT AREA */}
      {activeTab === "catalog" ? (
        filteredCourses.length === 0 ? (
          <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-12 text-center space-y-3">
            <GraduationCap className="w-10 h-10 text-afri-text-sec mx-auto opacity-40" />
            <p className="text-sm font-bold text-afri-text uppercase">Aucune formation disponible</p>
            <p className="text-xs text-afri-text-sec">Essayez une autre recherche ou modifiez les filtres de catégorie.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCourses.map((course) => {
              const isEnrolled = enrolledCourseIds.includes(course.id);
              return (
                <div
                  key={course.id}
                  className="bg-afri-bg-sec border border-afri-border/80 hover:border-[#D4AF37]/60 rounded-2xl overflow-hidden shadow-md transition-all group flex flex-col justify-between"
                >
                  <div>
                    {/* MEDIA PREVIEW */}
                    <div className="relative h-48 w-full bg-black overflow-hidden">
                      <img
                        src={course.previewVideoUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800"}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                      
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="px-2.5 py-1 bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-bold text-[#D4AF37] uppercase rounded-lg">
                          {course.level}
                        </span>
                        <span className="px-2.5 py-1 bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-afri-text uppercase rounded-lg">
                          {course.format}
                        </span>
                      </div>

                      <div className="absolute top-3 right-3">
                        {course.price === 0 ? (
                          <span className="px-3 py-1 bg-emerald-500 text-black text-xs font-black uppercase rounded-lg shadow-md">
                            GRATUIT
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-[#D4AF37] text-black text-xs font-black font-mono rounded-lg shadow-md">
                            {course.price.toLocaleString()} FCFA
                          </span>
                        )}
                      </div>

                      {/* PLAY ICON */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          onClick={() => setSelectedCourse(course)}
                          className="w-12 h-12 rounded-full bg-[#D4AF37]/90 text-black flex items-center justify-center hover:scale-110 transition-all shadow-xl cursor-pointer"
                        >
                          <Play className="w-5 h-5 fill-black ml-0.5" />
                        </button>
                      </div>
                    </div>

                    {/* DETAILS */}
                    <div className="p-4 space-y-2.5">
                      <h3 className="text-sm font-black text-afri-text group-hover:text-[#D4AF37] transition-colors leading-snug">
                        {course.title}
                      </h3>
                      <p className="text-xs text-afri-text-sec line-clamp-2 leading-relaxed">
                        {course.subtitle}
                      </p>

                      <div className="flex items-center gap-4 text-[10px] text-afri-text-sec font-mono pt-1 border-t border-afri-border/40">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>{course.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>{course.lessonsCount} leçons</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>{course.studentsCount} élèves</span>
                        </div>
                      </div>

                      {/* INSTRUCTOR BADGE */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <img
                            src={course.instructorAvatar}
                            alt={course.instructorName}
                            className="w-6 h-6 rounded-full object-cover border border-[#D4AF37]/40"
                          />
                          <span className="text-[11px] font-bold text-afri-text truncate max-w-[140px]">
                            {course.instructorName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{course.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div className="p-3 bg-afri-bg border-t border-afri-border/60 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCourse(course)}
                      className="flex-1 py-2 bg-afri-bg-ter hover:bg-[#D4AF37] hover:text-black text-[#D4AF37] text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                    >
                      Aperçu du cours
                    </button>
                    {isEnrolled ? (
                      <span className="px-3 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Inscrit</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleEnrollInCourse(course)}
                        className="px-4 py-2 bg-[#D4AF37] hover:bg-amber-400 text-black font-black text-xs uppercase rounded-xl transition-all cursor-pointer shadow-md"
                      >
                        Rejoindre
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* MES COURS TAB */
        myEnrolledCourses.length === 0 ? (
          <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-12 text-center space-y-4">
            <BookOpen className="w-10 h-10 text-[#D4AF37] mx-auto opacity-60" />
            <h3 className="text-sm font-black text-afri-text uppercase">Vous n'êtes inscrit à aucune formation</h3>
            <p className="text-xs text-afri-text-sec max-w-md mx-auto">
              Parcourez le catalogue de l'Académie pour vous former en M.A.O, mixage studio ou gestion des droits BURIDA.
            </p>
            <button
              onClick={() => setActiveTab("catalog")}
              className="px-5 py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
            >
              Explorer le catalogue
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {myEnrolledCourses.map((course) => (
              <div
                key={course.id}
                className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-black border border-[#D4AF37]/40 flex items-center justify-center shrink-0 text-[#D4AF37]">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-afri-text">{course.title}</h4>
                    <p className="text-xs text-afri-text-sec font-mono">
                      Formateur : {course.instructorName} • {course.duration} ({course.lessonsCount} modules)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCourse(course)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-afri-gold text-black font-black text-xs uppercase rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Suivre le cours</span>
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* COURSE DETAIL MODAL */}
      <AfriModal
        isOpen={!!selectedCourse}
        onClose={() => setSelectedCourse(null)}
        title={selectedCourse?.title}
        subtitle={`Par ${selectedCourse?.instructorName} • ${selectedCourse?.level}`}
      >
        {selectedCourse && (
          <div className="space-y-4 text-left">
            {/* VIDEO PLAYER PREVIEW */}
            <div className="relative h-52 w-full rounded-xl overflow-hidden border border-afri-border bg-black">
              <img
                src={selectedCourse.previewVideoUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800"}
                alt={selectedCourse.title}
                className="w-full h-full object-cover opacity-70"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="w-14 h-14 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shadow-2xl">
                  <Play className="w-6 h-6 fill-black ml-0.5" />
                </div>
              </div>
              <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/80 backdrop-blur-md rounded text-[10px] font-mono text-emerald-400 border border-emerald-500/30 font-bold">
                ✓ Extrait Gratuit Disponible
              </div>
            </div>

            <p className="text-xs text-afri-text-sec leading-relaxed bg-afri-bg p-3 rounded-xl border border-afri-border/60">
              {selectedCourse.description}
            </p>

            {/* MODULES PROGRAM */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-afri-text uppercase tracking-wider font-mono">Programme des Modules</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {selectedCourse.modules.map((mod) => (
                  <div key={mod.id} className="p-2.5 bg-afri-bg border border-afri-border/60 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Play className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span className="font-semibold text-afri-text">{mod.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {mod.isFreePreview && (
                        <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase">
                          Aperçu
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-afri-text-sec">{mod.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MONETIZATION BREAKDOWN */}
            <div className="p-3.5 bg-afri-bg border border-afri-border rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-afri-text-sec">Tarif de la formation :</span>
                <span className="font-bold font-mono text-[#D4AF37]">
                  {selectedCourse.price === 0 ? "GRATUIT" : `${selectedCourse.price.toLocaleString()} FCFA`}
                </span>
              </div>
              {selectedCourse.price > 0 && (
                <div className="pt-2 border-t border-afri-border/40 text-[10px] text-afri-text-sec space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span>Part Formateur (95%) :</span>
                    <span className="text-emerald-400 font-bold">{Math.round(selectedCourse.price * 0.95).toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frais Plateforme AFRIGOMBO (5%) :</span>
                    <span className="text-amber-400">{Math.round(selectedCourse.price * 0.05).toLocaleString()} FCFA</span>
                  </div>
                </div>
              )}
            </div>

            {/* ACTION BUTTON */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setSelectedCourse(null)}
                className="flex-1 py-2.5 bg-afri-bg border border-afri-border text-afri-text text-xs font-bold uppercase rounded-xl cursor-pointer"
              >
                Fermer
              </button>
              <button
                onClick={() => handleEnrollInCourse(selectedCourse)}
                className="flex-1 py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-md flex justify-center items-center gap-2"
              >
                <span>Rejoindre la formation</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        )}
      </AfriModal>

      {/* INFO / RULES MODAL */}
      <AfriModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="Règles & Commission de l'Académie"
        subtitle="Répartition des revenus (95%/5%) et éligibilité des formateurs"
      >
        <div className="space-y-4 text-left">
          <div className="p-3.5 bg-afri-bg border border-[#D4AF37]/40 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase font-mono">
              <Award className="w-4 h-4 text-[#D4AF37]" />
              <span>1. Répartition des Gains (95% Formateur / 5% Plateforme)</span>
            </div>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Sur l'Académie AFRIGOMBO, les formateurs perçoivent <strong>95% des revenus bruts</strong> sur chaque vente de cours ou masterclass. La commission de <strong>5%</strong> permet de maintenir l'infrastructure vidéo HD, la sécurisation des paiements Mobile Money/CB et la délivrance automatique des certificats.
            </p>
          </div>

          <div className="p-3.5 bg-afri-bg border border-afri-border rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase font-mono">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>2. Conditions d'Éligibilité Formateur</span>
            </div>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Afin de maintenir la haute qualité pédagogique de l'Académie, pour devenir Enseignant et publier des cours payants, vous devez valider :
            </p>
            <ul className="text-xs text-afri-text-sec space-y-1.5 list-disc pl-4 font-mono">
              <li>Un <strong>Score de Confiance de 60% minimum</strong>.</li>
              <li>Un <strong>Profil Certifié</strong> (GOMBO ID Certifié, PRO ou VIP).</li>
            </ul>
          </div>

          <div className="p-3.5 bg-afri-bg border border-emerald-500/30 rounded-xl space-y-1 text-xs">
            <span className="font-bold text-emerald-400 font-mono block">Votre Éligibilité Formateur :</span>
            <div className="flex justify-between items-center text-afri-text font-mono pt-1">
              <span>Certification Profil :</span>
              <span className={`font-bold ${isCertified ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isCertified ? '✓ Validée' : '❌ Requise (GOMBO ID)'}
              </span>
            </div>
            <div className="flex justify-between items-center text-afri-text font-mono">
              <span>Score de Confiance :</span>
              <span className={`font-bold ${trustScore >= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {trustScore}% / 100 (Min. 60%)
              </span>
            </div>
            <div className="flex justify-between items-center text-afri-text font-mono pt-1 border-t border-afri-border/40">
              <span>Droit d'Enseigner :</span>
              <span className={`font-bold ${canCreateCourse ? 'text-emerald-400' : 'text-rose-400'}`}>
                {canCreateCourse ? '✓ Débloqué' : '❌ Non éligible'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsInfoModalOpen(false)}
            className="w-full py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-md"
          >
            J'ai compris, Fermer
          </button>
        </div>
      </AfriModal>

      {/* CREATE COURSE MODAL WITH RESTRICTION GUARD */}
      <AfriModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Espace Formateur • Académie"
        subtitle="Publiez vos cours, masterclasses et guides payants"
      >
        {!canCreateCourse ? (
          /* RESTRICTED ACCESS SCREEN FOR INSTRUCTORS */
          <div className="space-y-4 py-2 text-left">
            <div className="p-4 bg-gradient-to-b from-amber-500/15 to-afri-bg border border-amber-500/40 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-black text-afri-text uppercase tracking-tight">
                Accès Restreint - Certification & Score Requis
              </h3>
              <p className="text-xs text-afri-text-sec leading-relaxed">
                Pour enseigner sur l'Académie AFRIGOMBO et monétiser vos formations, vous devez posséder un <strong>Profil Certifié (GOMBO ID)</strong> et un <strong>Score de Confiance d'au moins 60%</strong>.
              </p>
            </div>

            {/* REQUIREMENTS LIST */}
            <div className="p-3.5 bg-afri-bg border border-afri-border rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-afri-text-sec">Certification Profil (GOMBO ID) :</span>
                {isCertified ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">✓ Validé</span>
                ) : (
                  <span className="text-rose-400 font-bold">❌ Requis</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-afri-text-sec">Score de Confiance :</span>
                <span className={`font-mono font-bold ${trustScore >= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {trustScore}% / 100 (Requis: 60%)
                </span>
              </div>
            </div>

            {/* UNLOCK ACTIONS */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  if (onNavigateView) onNavigateView("user_gombo_id");
                }}
                className="w-full py-2.5 bg-afri-bg border border-[#D4AF37]/60 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Certification Profil (GOMBO ID)</span>
              </button>

              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  if (onNavigateView) onNavigateView("user_gombo_plus");
                }}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-afri-gold hover:brightness-110 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Crown className="w-4 h-4 text-black" />
                <span>Débloquer le statut Formateur PRO / VIP</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-full py-2 bg-afri-bg border border-afri-border hover:bg-afri-bg-ter text-afri-text-sec hover:text-afri-text text-xs font-bold uppercase rounded-xl transition-all cursor-pointer text-center"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          /* FORM TO CREATE COURSE */
          <form onSubmit={handleCreateCourse} className="space-y-3.5 text-left">
            <div>
              <label className="text-[10px] font-mono font-bold text-afri-text-sec uppercase block mb-1">
                Titre de la formation *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Masterclass Mixage Vocal Afrobeats"
                className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text focus:border-[#D4AF37] focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono font-bold text-afri-text-sec uppercase block mb-1">
                Sous-titre accrocheur
              </label>
              <input
                type="text"
                value={newSubtitle}
                onChange={(e) => setNewSubtitle(e.target.value)}
                placeholder="Ex: Obtenez la clarté radio sur FL Studio"
                className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono font-bold text-afri-text-sec uppercase block mb-1">
                  Catégorie
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="mao">🎹 M.A.O & Beatmaking</option>
                  <option value="mixage">🎛️ Mixage & Mastering</option>
                  <option value="burida">⚖️ Droit & BURIDA</option>
                  <option value="vocal">🎙️ Vocaux & Chant</option>
                  <option value="business">💼 Music Business</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-afri-text-sec uppercase block mb-1">
                  Niveau
                </label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value as any)}
                  className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="Débutant">Débutant</option>
                  <option value="Intermédiaire">Intermédiaire</option>
                  <option value="Avancé">Avancé</option>
                  <option value="Masterclass">Masterclass</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono font-bold text-afri-text-sec uppercase block mb-1">
                  Prix de la formation (FCFA)
                </label>
                <input
                  type="number"
                  required
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="0 = Gratuit"
                  className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text focus:border-[#D4AF37] focus:outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-afri-text-sec uppercase block mb-1">
                  Format
                </label>
                <select
                  value={newFormat}
                  onChange={(e) => setNewFormat(e.target.value as any)}
                  className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="Vidéo HD">Vidéo HD</option>
                  <option value="PDF & Guide">PDF & Guide</option>
                  <option value="Hybride (Vidéo + PDF)">Hybride (Vidéo + PDF)</option>
                </select>
              </div>
            </div>

            {/* REAL-TIME COMMISSION PREVIEW */}
            <div className="p-3 bg-afri-bg border border-[#D4AF37]/30 rounded-xl space-y-1.5 text-xs">
              <span className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase block">
                💰 Estimation de Revenus Formateur
              </span>
              <div className="flex justify-between items-center text-afri-text font-mono">
                <span>Prix de vente fixé :</span>
                <span className="font-bold">{priceVal.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between items-center text-emerald-400 font-mono">
                <span>Gain Formateur Net (95%) :</span>
                <span className="font-bold">{instructorEarnings.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between items-center text-afri-text-sec font-mono text-[10px]">
                <span>Commission Plateforme (5%) :</span>
                <span>{platformCommission.toLocaleString()} FCFA</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono font-bold text-afri-text-sec uppercase block mb-1">
                Description & Programme de la formation *
              </label>
              <textarea
                required
                rows={3}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Détaillez le contenu pedagogique, les logiciels utilisés et ce que vos étudiants vont acquérir..."
                className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 cursor-pointer"
              >
                <span>Publier le cours sur l'Académie</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </form>
        )}
      </AfriModal>

      {/* ENROLLMENT SUCCESS MODAL */}
      <AfriModal
        isOpen={isEnrollSuccessModalOpen}
        onClose={() => setIsEnrollSuccessModalOpen(false)}
        type="success"
        title="Inscription Validée !"
      >
        <div className="space-y-2">
          <p className="font-bold text-afri-text">{enrolledCourseTitle}</p>
          <p className="text-xs text-afri-text-sec leading-relaxed">
            Félicitations ! Vous avez désormais accès à tous les modules de cette formation dans l'onglet <strong>"Mes Cours"</strong>.
          </p>
        </div>
      </AfriModal>

    </div>
  );
};
export default AcademieView;
