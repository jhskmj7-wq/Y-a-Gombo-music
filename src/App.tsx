import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Music, Calendar, Clock, MapPin, Search, Plus, User, LogOut, 
  Flame, Sparkles, LayoutDashboard, Settings, Menu, X, Sun, Moon, Laptop, 
  Star, Award, BookOpen, Users2, ShoppingBag, ShieldCheck, Info,
  ExternalLink, ChevronRight, Heart, MessageSquare, 
  Share2, Bookmark, Play, Pause, Volume2, Lock, Eye, Check, ChevronLeft, Send, Briefcase, Bell
} from "lucide-react";
import { gomboAuth, gomboDB, isFirebaseMock } from "./firebase";
import { UserProfile, Gombo, SocialPost, GomboNotification } from "./types";
import { useAuth } from "./AuthContext";

const ProfileSkeleton = () => (
  <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse" id="profile-skeleton-element">
    <div className="bg-white dark:bg-[#121214] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 justify-between">
      <div className="flex flex-col sm:flex-row items-center gap-5 w-full">
        <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800 shrink-0" />
        <div className="space-y-3 w-full max-w-sm">
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-lg w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/2" />
        </div>
      </div>
      <div className="w-28 h-10 bg-gray-200 dark:bg-gray-800 rounded-xl" />
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 bg-white dark:bg-[#121214] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-full" />
      </div>
      <div className="md:col-span-2 bg-white dark:bg-[#121214] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 space-y-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
        </div>
      </div>
    </div>
  </div>
);

// Component Imports
import AuthScreen from "./components/AuthScreen";
import ProfileEdit from "./components/ProfileEdit";
import GomboPublish from "./components/GomboPublish";
import GomboApply from "./components/GomboApply";
import ComingSoon from "./components/ComingSoon";
import Dashboards from "./components/Dashboards";
import SocialPostCard from "./components/SocialPostCard";
import SettingsModal from "./components/SettingsModal";
import CompleteProfile from "./components/CompleteProfile";
import GomboProfile from "./components/GomboProfile";
import RenfortExpress from "./components/RenfortExpress";
import CertificationHub from "./components/CertificationHub";
import GroupeVIPAnnuaire from "./components/GroupeVIPAnnuaire";
import AnnuaireTalents from "./components/AnnuaireTalents";
import NotificationCenter from "./components/NotificationCenter";
import ActivityFeedView from "./components/ActivityFeedView";
import { PrivacyPage, TermsPage, DeleteAccountPage, AboutPage, SupportPage, CachetsPage } from "./components/PublicPages";

const ABIDJAN_COMMUNES = [
  "Abidjan (Toutes)",
  "Cocody", "Yopougon", "Marcory", "Plateau", "Treichville", "Abobo", 
  "Koumassi", "Adjamé", "Port-Bouët", "Attécoubé", "Grand-Bassam", "Bingerville"
];

const SPECIALTY_OPTIONS = [
  "Toutes spécialités",
  "Chanteur(euse)", "Guitariste Soliste", "Guitariste Accompagnateur", 
  "Bassiste", "Batteur", "Claviériste / Pianiste", "Percussionniste", 
  "DJ", "Cuivres / Wind"
];

export default function App() {
  // Theme state
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">(() => {
    return (localStorage.getItem("gombo_theme_mode") as "light" | "dark" | "system") || "system";
  });
  const [darkMode, setDarkMode] = useState(() => {
    const mode = localStorage.getItem("gombo_theme_mode") || "system";
    if (mode === "system") {
      return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return mode === "dark";
  });

  // Mock Mode reactive state
  const [mockMode, setMockMode] = useState(isFirebaseMock);

  useEffect(() => {
    const handleMockChange = () => {
      setMockMode(isFirebaseMock);
    };
    window.addEventListener("gomboFirebaseMockChange", handleMockChange);
    return () => {
      window.removeEventListener("gomboFirebaseMockChange", handleMockChange);
    };
  }, []);

  // Navigation / View State
  // 'home' | 'publish' | 'dashboard' | 'profile_edit' | 'annuaire' | 'groupe' | 'marche' | 'certification' | 'privacy' | 'terms' | 'delete-account'
  const [selectedTalentUid, setSelectedTalentUid] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.startsWith("/talent/")) {
      return path.split("/talent/")[1];
    }
    return null;
  });

  const [view, setView] = useState<string>(() => {
    const path = window.location.pathname;
    if (path === "/privacy") return "privacy";
    if (path === "/terms") return "terms";
    if (path === "/delete-account") return "delete-account";
    if (path.startsWith("/talent/")) return "annuaire";
    
    // Fallback hash routing
    const hash = window.location.hash;
    if (hash === "#/privacy") return "privacy";
    if (hash === "#/terms") return "terms";
    if (hash === "#/delete-account") return "delete-account";
    
    return "home";
  });

  const [dashboardInitialTab, setDashboardInitialTab] = useState<string>("");

  // URL synchronization for public policy pages
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/privacy") {
        setView("privacy");
      } else if (path === "/terms") {
        setView("terms");
      } else if (path === "/delete-account") {
        setView("delete-account");
      } else if (path.startsWith("/talent/")) {
        const uid = path.split("/talent/")[1];
        setSelectedTalentUid(uid);
        setView("annuaire");
      } else {
        const hash = window.location.hash;
        if (hash === "#/privacy") setView("privacy");
        else if (hash === "#/terms") setView("terms");
        else if (hash === "#/delete-account") setView("delete-account");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (targetView: string) => {
    setView(targetView);
    if (targetView === "privacy") {
      window.history.pushState(null, "", "/privacy");
    } else if (targetView === "terms") {
      window.history.pushState(null, "", "/terms");
    } else if (targetView === "delete-account") {
      window.history.pushState(null, "", "/delete-account");
    } else if (targetView === "annuaire") {
      if (selectedTalentUid) {
        window.history.pushState(null, "", `/talent/${selectedTalentUid}`);
      } else {
        window.history.pushState(null, "", "/");
      }
    } else {
      window.history.pushState(null, "", "/");
    }
  };
  
  // Auth state
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Listing page Filters & Selection
  const [gombos, setGombos] = useState<Gombo[]>([]);
  const [loadingGombos, setLoadingGombos] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCommune, setSelectedCommune] = useState("Abidjan (Toutes)");
  const [selectedSpecialty, setSelectedSpecialty] = useState("Toutes spécialités");

  // Selection for applying
  const [applyGombo, setApplyGombo] = useState<Gombo | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Y’A GOMBO MUSIC - Accueil Tab Toggle
  const [currentHomeTab, setCurrentHomeTab] = useState<"fil" | "marche">("fil");
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [loadingSocial, setLoadingSocial] = useState(false);
  const [playingPostId, setPlayingPostId] = useState<string | null>(null);
  const [socialFilter, setSocialFilter] = useState<"all" | "gombo" | "demo" | "annonce">("all");

  // User engagement retention states
  const [topTalentsList, setTopTalentsList] = useState<any[]>([]);
  const [activityStreak, setActivityStreak] = useState<number>(() => {
    try {
      const stored = localStorage.getItem("gombo_activity_streak");
      return stored ? parseInt(stored) : 1;
    } catch {
      return 1;
    }
  });

  // Keep scrolls independent and not mixed by scrolling to top of page on view or tab transition
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [view, currentHomeTab]);
  
  // Followed artists
  const [followedArtists, setFollowedArtists] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem("gombo_followed") || "[]");
  });
  
  // Comments Drawer
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  
  // Custom Post Composition (inside Feed)
  const [showPostComposer, setShowPostComposer] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostCaption, setNewPostCaption] = useState("");
  const [newPostBeat, setNewPostBeat] = useState("");
  const [newPostCover, setNewPostCover] = useState("");
  const [newPostAudio, setNewPostAudio] = useState("");
  const [newPostTags, setNewPostTags] = useState("");

  // Real-time notifications state
  const [notifications, setNotifications] = useState<GomboNotification[]>([]);
  const [showNotifTray, setShowNotifTray] = useState(false);
  const [groupNotifications, setGroupNotifications] = useState(false);
  const [activeToast, setActiveToast] = useState<{ id: string; title: string; message: string } | null>(null);

  // Real-time notification listener
  useEffect(() => {
    if (!profile?.uid) {
      setNotifications([]);
      return;
    }

    console.log("🔔 Subscribing to real-time notifications for user:", profile.uid);
    let isInitial = true;
    const unsubscribe = gomboDB.listenToNotifications(profile.uid, (newList) => {
      setNotifications(newList);

      // Trigger toast only on subsequent new notifications
      if (!isInitial) {
        const unread = newList.filter(n => !n.read);
        if (unread.length > 0) {
          const latest = unread[0];
          setActiveToast({
            id: latest.id,
            title: latest.title,
            message: latest.message
          });

          // Self-dismiss toast
          setTimeout(() => {
            setActiveToast(prev => prev?.id === latest.id ? null : prev);
          }, 6000);
        }
      }
      isInitial = false;
    });

    return () => {
      console.log("🔕 Unsubscribing from notifications for user:", profile.uid);
      unsubscribe();
    };
  }, [profile?.uid]);

  // Real-time synchronization for social posts feed (Le Terrain)
  useEffect(() => {
    setLoadingSocial(true);
    console.log("🔗 [App Feed Live] Subscribing to real-time social posts observer...");
    const unsubscribe = gomboDB.listenSocialPosts((allPosts) => {
      console.log("⚡ [App Feed Live Sync] Live sync fetched latest social posts:", allPosts.length);
      const sorted = [...allPosts].sort((a, b) => {
        if (a.urgent && !b.urgent) return -1;
        if (!a.urgent && b.urgent) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setSocialPosts(sorted);
      setLoadingSocial(false);
    });

    return () => {
      console.log("🔌 [App Feed Live] Disposing of social posts feed sync.");
      unsubscribe();
    };
  }, []);

  // Light/Dark and System theme selection and application effect
  useEffect(() => {
    const root = window.document.documentElement;
    const updateTheme = () => {
      let isDark = false;
      if (themeMode === "system") {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      } else {
        isDark = themeMode === "dark";
      }
      setDarkMode(isDark);
      if (isDark) {
        root.classList.add("dark");
        localStorage.setItem("gombo_theme", "dark");
      } else {
        root.classList.remove("dark");
        localStorage.setItem("gombo_theme", "light");
      }
    };

    updateTheme();
    localStorage.setItem("gombo_theme_mode", themeMode);

    // Save choice to Firebase if logged in and profile has a different theme
    if (profile?.uid && profile.themePreference !== themeMode) {
      gomboDB.updateUserProfile(profile.uid, {
        themePreference: themeMode
      }).catch(err => console.log("⚠️ Error saving theme preference to profile:", err));
    }

    if (themeMode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => updateTheme();
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [themeMode, profile?.uid]);

  // Auth Context Global Synchronization
  const { currentUser, profile: authProfile, loading: authLoading, refreshProfile: doRefreshProfile, logout: doLogout } = useAuth();

  useEffect(() => {
    console.log("🔍 [App Debug] Syncing state from useAuth context:");
    console.log("🔍 [App Debug] - currentUser:", currentUser);
    console.log("🔍 [App Debug] - uid:", currentUser?.uid);
    console.log("🔍 [App Debug] - profile:", authProfile);
    console.log("🔍 [App Debug] - loading:", authLoading);

    setUser(currentUser);
    setProfile(authProfile);
    setAuthReady(!authLoading);

    // Dynamic theme restore from profile
    if (authProfile?.themePreference && authProfile.themePreference !== themeMode) {
      setThemeMode(authProfile.themePreference);
    }

    // Close the auth screen/modal when user is successfully authenticated
    if (currentUser) {
      setShowAuthModal(false);
    }

    // OBLIGATORY REDIRECTION BEHAVIOR for incomplete profiles
    if (currentUser && authProfile && !authProfile.isProfileComplete && view !== "complete_profile") {
      console.log("⚠️ [App Debug] Profile is incomplete! Redirecting to complete_profile");
      setView("complete_profile");
    }
  }, [currentUser, authProfile, authLoading]);

  // User automatic consecutive daily active streak tracking effect
  useEffect(() => {
    try {
      const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
      const lastActive = localStorage.getItem("gombo_last_active_date");
      const currentStreak = localStorage.getItem("gombo_activity_streak")
        ? parseInt(localStorage.getItem("gombo_activity_streak")!)
        : 1;

      if (!lastActive) {
        localStorage.setItem("gombo_last_active_date", today);
        localStorage.setItem("gombo_activity_streak", "1");
        setActivityStreak(1);
        console.log("🔥 [Streak Tracker] Initial visit today! Streak set to 1.");
      } else if (lastActive !== today) {
        const lastDate = new Date(lastActive);
        const currentDate = new Date(today);
        
        // Compute difference in dates
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        let newStreak = 1;
        if (diffDays === 1) {
          newStreak = currentStreak + 1;
          console.log(`🔥 [Streak Tracker] Consecutive day! Streak incremented to ${newStreak}.`);
        } else if (diffDays > 1) {
          newStreak = 1;
          console.log("🔥 [Streak Tracker] Days missed. Resetting streak back to 1.");
        } else {
          // Same day visit
          newStreak = currentStreak || 1;
        }

        localStorage.setItem("gombo_last_active_date", today);
        localStorage.setItem("gombo_activity_streak", newStreak.toString());
        setActivityStreak(newStreak);
      }
    } catch (err) {
      console.error("⚠️ Failed to compute Consecutive Activity Streak:", err);
    }
  }, [currentUser]);

  // Load Top Talents of the week effect
  useEffect(() => {
    const loadTopTalents = async () => {
      try {
        const users = await gomboDB.getAllUsers();
        const musicians = users.filter((u: any) => u.role === "musicien" || u.role === "groupe");
        
        // Define outstanding defaults for local or mock sandbox
        const defaultTalents = [
          {
            uid: "mus1",
            firstName: "Yorobo",
            lastName: "Sangaré",
            artistName: "Yoro Lead",
            specialty: "Guitariste Soliste",
            commune: "Cocody",
            avatarUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=150",
            gigsCompleted: 12,
            applicationsSent: 20,
            activityStreak: 8
          },
          {
            uid: "mus2",
            firstName: "Fanta",
            lastName: "Kouyaté",
            artistName: "La Voix d'Or",
            specialty: "Chanteuse Lead",
            commune: "Yopougon",
            avatarUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=150",
            gigsCompleted: 9,
            applicationsSent: 14,
            activityStreak: 6
          },
          {
            uid: "mus-extra-1",
            firstName: "Pacôme",
            lastName: "Koffi",
            artistName: "Didi Clavier",
            specialty: "Claviériste / Pianiste",
            commune: "Marcory",
            avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
            gigsCompleted: 7,
            applicationsSent: 11,
            activityStreak: 5
          },
          {
            uid: "mus-extra-2",
            firstName: "Manu",
            lastName: "Diarra",
            artistName: "Manu Beats",
            specialty: "Batteur Afro",
            commune: "Treichville",
            avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
            gigsCompleted: 5,
            applicationsSent: 9,
            activityStreak: 4
          }
        ];

        // Combine users with fallback defaults for a vibrant feel
        const combined = [...musicians];
        defaultTalents.forEach((dt: any) => {
          if (!combined.some(u => u.uid === dt.uid)) {
            combined.push(dt);
          }
        });

        // Ensure proper activity attributes
        const populated = combined.map((u: any) => ({
          ...u,
          gigsCompleted: u.gigsCompleted || (u.uid === "mus1" ? 12 : u.uid === "mus2" ? 9 : Math.floor(Math.random() * 4) + 1),
          activityStreak: u.activityStreak || (u.uid === "mus1" ? 8 : u.uid === "mus2" ? 6 : Math.floor(Math.random() * 3) + 1),
          specialty: u.specialty || u.speciality || "Artiste Musicien"
        }));

        // Sort desc based on gigs completed
        populated.sort((a, b) => b.gigsCompleted - a.gigsCompleted);

        setTopTalentsList(populated.slice(0, 4));
      } catch (err) {
        console.warn("⚠️ Failed to load top talents list:", err);
      }
    };

    loadTopTalents();
    window.addEventListener("gomboUserProfileChange", loadTopTalents);
    return () => {
      window.removeEventListener("gomboUserProfileChange", loadTopTalents);
    };
  }, [profile]);

  // Live Gombos Synchronization
  useEffect(() => {
    setLoadingGombos(true);
    console.log("🔗 [App Feed Live] Subscribing to real-time Gombos list observer...");
    const unsubscribe = gomboDB.listenAllGombos((allGombos) => {
      console.log("⚡ [App Feed Live Sync] Live sync fetched latest Gombos:", allGombos.length);
      const sorted = allGombos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setGombos(sorted);
      setLoadingGombos(false);
    });

    return () => {
      console.log("🔌 [App Feed Live] Disposing of Gombos feed sync.");
      unsubscribe();
    };
  }, []);

  // Refresh current Profile
  const refreshProfile = async () => {
    console.log("🔄 [App Debug] Manual profile refresh requested.");
    await doRefreshProfile();
  };

  // Profile setup safeguard
  const handleProtectedAction = (targetView: string) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    // Sync state
    if (!user) {
      setUser(currentUser);
    }
    setView(targetView);
    setMobileMenuOpen(false);
  };

  // Log Out Wrapper
  const handleLogout = async () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    setMobileMenuOpen(false);
    await doLogout();
    setView("home");
  };

  // Filtering Gombos logic based on queries
  const filteredGombos = gombos.filter((g) => {
    // Only show published (open) ones in the feed
    if (g.status !== "publie" && view === "home") return false;

    const matchesSearch = 
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.eventType.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCommune =
      selectedCommune === "Abidjan (Toutes)" || g.commune === selectedCommune;
    
    // Simple mock keyword check for specialty matching
    const matchesSpecialty =
      selectedSpecialty === "Toutes spécialités" ||
      g.title.toLowerCase().includes(selectedSpecialty.split(" ")[0].toLowerCase()) ||
      g.description.toLowerCase().includes(selectedSpecialty.split(" ")[0].toLowerCase());

    return matchesSearch && matchesCommune && matchesSpecialty;
  });

  const urgentGombos = filteredGombos.filter(g => g.urgent);
  const normalGombos = filteredGombos.filter(g => !g.urgent);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-orange-500/20 animate-pulse"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          <div className="absolute inset-3 rounded-full bg-gradient-to-tr from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-black uppercase text-white tracking-widest animate-pulse">Y’A GOMBO MUSIC</h2>
        <p className="text-orange-500 text-xs font-black uppercase tracking-wider mt-1.5 mb-8">Showbiz Ivoirien</p>
        <div className="space-y-3 max-w-xs">
          <div className="h-1.5 w-48 bg-gray-800 rounded-full overflow-hidden mx-auto relative">
            <div className="absolute top-0 bottom-0 left-0 bg-orange-500 rounded-full animate-[loading_1.5s_infinite_ease-in-out]" style={{ width: "60%" }}></div>
          </div>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider animate-pulse pt-2">Vérification de votre session sécurisée...</p>
        </div>

        {/* Tailored keyframes in style block */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes loading {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
        `}} />
      </div>
    );
  }

  if (["privacy", "terms", "delete-account", "about", "support", "cachets"].includes(view)) {
    return (
      <div className={darkMode ? "dark" : ""}>
        {view === "privacy" && <PrivacyPage onBack={() => navigateTo("home")} />}
        {view === "terms" && <TermsPage onBack={() => navigateTo("home")} />}
        {view === "delete-account" && <DeleteAccountPage onBack={() => navigateTo("home")} />}
        {view === "about" && <AboutPage onBack={() => navigateTo("home")} />}
        {view === "support" && <SupportPage onBack={() => navigateTo("home")} />}
        {view === "cachets" && <CachetsPage onBack={() => navigateTo("home")} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0F0F0F] dark:text-gray-100 transition-colors duration-300 pb-20 md:pb-0">
      
      {/* Real-time Toast Notifications Alert */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-[100] w-[90%] max-w-sm bg-gray-900 border border-gray-800 text-white rounded-2xl shadow-2xl p-4 flex gap-3.5 items-start shadow-orange-500/10"
          >
            <div className="bg-orange-500 text-white p-2 rounded-xl shrink-0">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 space-y-1 text-left">
              <h4 className="text-xs font-black uppercase tracking-wider text-orange-400">
                {activeToast.title}
              </h4>
              <p className="text-xs text-gray-200 leading-relaxed">
                {activeToast.message}
              </p>
              <button
                onClick={() => {
                  setActiveToast(null);
                  setView("dashboard");
                }}
                className="text-[10px] font-black text-[#FF7A00] hover:underline uppercase tracking-wide block pt-1.5"
              >
                👉 Voir mon Tableau de Bord
              </button>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="text-gray-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* --- TOP NAVBAR --- */}
      <nav className="sticky top-0 z-40 bg-white/90 dark:bg-[#121214]/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView("home")}>
              <div className="p-2 bg-gradient-to-tr from-orange-500 to-orange-600 rounded-xl text-white">
                <Flame className="w-5 h-5 fill-current" />
              </div>
              <div>
                <span className="font-extrabold text-lg sm:text-lg tracking-tight text-gray-950 dark:text-white uppercase">Y’A GOMBO MUSIC</span>
                <span className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400 block -mt-1 tracking-wider">Showbiz CI</span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              <button 
                onClick={() => setView("home")}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  view === "home" ? "text-[#7C3AED] dark:text-[#A78BFA]" : "text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Le Terrain
              </button>

              <button 
                onClick={() => setView("renfort_express")}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                  view === "renfort_express" ? "text-orange-500 dark:text-orange-400 font-extrabold" : "text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                🎼 Renfort Express
              </button>

              <button 
                onClick={() => setView("gombo_list")}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  view === "gombo_list" ? "text-[#7C3AED] dark:text-[#A78BFA]" : "text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Les Vibes
              </button>
              
              <button 
                onClick={() => navigateTo("annuaire")}
                className={`relative px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                  view === "annuaire" ? "text-[#7C3AED] dark:text-[#A78BFA] font-black" : "text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                <span>La Base 🎤</span>
                <span className="text-[8px] font-black uppercase text-red-500 bg-red-50 dark:bg-red-950/25 px-1 py-0.5 rounded leading-none animate-pulse">DIRECT</span>
              </button>

              <button 
                onClick={() => setView("groupe")}
                className={`relative px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  view === "groupe" ? "text-amber-500 font-extrabold" : "text-gray-500 hover:text-gray-150 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Coin des Groupes
                <span className="absolute -top-1 right-0 text-[8px] font-extrabold text-amber-500 bg-amber-55 dark:bg-amber-950/20 px-1 rounded-md animate-pulse">VIP ⭐</span>
              </button>

              <button 
                onClick={() => setView("marche")}
                className={`relative px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  view === "marche" ? "text-[#7C3AED]" : "text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Marché du Coin
                <span className="absolute -top-1 right-0 text-[8px] font-extrabold text-[#7C3AED] bg-purple-50 dark:bg-purple-950/20 px-1 rounded-md">Bientôt</span>
              </button>

              <button 
                onClick={() => setView("certification")}
                className={`relative px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  view === "certification" ? "text-[#7C3AED]" : "text-gray-500 hover:text-gray-400 dark:hover:text-white"
                }`}
              >
                Talent Certifié
                <span className="absolute -top-1 right-0 text-[8px] font-extrabold text-[#7C3AED] bg-purple-50 dark:bg-purple-950/20 px-1 rounded-md">Niveau Boss</span>
              </button>

              <button 
                onClick={() => setView("activity")}
                className={`relative px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                  view === "activity" ? "text-orange-500 dark:text-orange-400 font-extrabold" : "text-gray-500 hover:text-gray-400 dark:hover:text-white"
                }`}
              >
                <span>⚡ Activité</span>
                <span className="text-[8px] font-black uppercase text-orange-500 bg-orange-50 dark:bg-orange-950/20 px-1.5 py-0.5 rounded leading-none">TEMPS RÉEL</span>
              </button>
            </div>

            {/* Utility Right Actions */}
            <div className="flex items-center gap-2.5">
              
              {/* Light/Dark/System 3-Theme Switch */}
              <button
                onClick={() => {
                  const nextTheme = themeMode === "light" ? "dark" : themeMode === "dark" ? "system" : "light";
                  setThemeMode(nextTheme);
                }}
                className="p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white transition-colors relative flex items-center justify-center cursor-pointer min-w-[42px] min-h-[42px]"
                aria-label="Toggle theme"
                title={`Thème : ${themeMode === "light" ? "Clair" : themeMode === "dark" ? "Sombre" : "Système (Automatique)"}. Cliquer pour changer.`}
              >
                {themeMode === "light" && <Sun className="w-5 h-5 text-amber-500 animate-spin-slow" />}
                {themeMode === "dark" && <Moon className="w-5 h-5 text-[#8B5CF6]" />}
                {themeMode === "system" && <Laptop className="w-5 h-5 text-blue-500" />}
                <span className="absolute -bottom-1 -right-1 text-[7px] font-black uppercase text-purple-650 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/45 px-1 py-0.5 rounded leading-none border border-purple-100/50 dark:border-purple-900/30 scale-90">
                  {themeMode === "light" ? "CLR" : themeMode === "dark" ? "SMB" : "SYS"}
                </span>
              </button>

              {/* Settings / Paramètres */}
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-2 bg-gray-50 dark:bg-gray-800/40 rounded-xl text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                aria-label="Application Settings"
                title="Paramètres de l'application"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Real-time Notifications Bell Dropdown */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setShowNotifTray(!showNotifTray)}
                    className="p-2 bg-gray-50 dark:bg-gray-800/40 rounded-xl text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors relative"
                    aria-label="Notifications"
                    title="Mes notifications en temps réel"
                  >
                    <Bell className="w-5 h-5" />
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black h-5 w-5 rounded-full flex items-center justify-center animate-pulse border-2 border-white dark:border-[#121214]">
                        {notifications.filter(n => !n.read).length}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifTray && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-[#121214] border border-gray-150 dark:border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden"
                      >
                        <div className="p-4 border-b border-gray-100 dark:border-gray-850 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/10">
                          <span className="text-xs font-black tracking-wider text-gray-800 dark:text-white uppercase flex items-center gap-1.5">
                            🔔 Notifications {notifications.filter(n => !n.read).length > 0 && `(${notifications.filter(n => !n.read).length})`}
                          </span>
                          {notifications.filter(n => !n.read).length > 0 && (
                            <button
                              onClick={() => {
                                notifications.forEach(async (n) => {
                                  if (!n.read) await gomboDB.markNotificationAsRead(n.id);
                                });
                              }}
                              className="text-[10px] font-black uppercase text-orange-600 hover:underline"
                            >
                              Tout lire
                            </button>
                          )}
                        </div>

                        {/* Selector Segmented Control for Grouping Format */}
                        <div className="px-4 py-2 bg-gray-50/70 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-850 flex items-center justify-between text-[11px]">
                          <span className="text-gray-500 dark:text-gray-400 font-bold">Thème d'affichage</span>
                          <button
                            type="button"
                            onClick={() => setGroupNotifications(!groupNotifications)}
                            className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all select-none ${
                              groupNotifications 
                                ? "bg-orange-500 text-white shadow-sm"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                          >
                            {groupNotifications ? "🗂️ Groupé" : "🕘 Chrono"}
                          </button>
                        </div>

                        <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-850">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center text-xs text-gray-400 dark:text-gray-500">
                              Aucune notification pour le moment.
                            </div>
                          ) : groupNotifications ? (
                            (() => {
                              // Group notifications by type
                              const groups: Record<string, { label: string; items: GomboNotification[] }> = {
                                application_accepted: { label: "🎉 Candidatures acceptées", items: [] },
                                booking: { label: "📅 Demandes de Booking", items: [] },
                                general: { label: "🔔 Informations Générales", items: [] }
                              };
                              notifications.forEach(n => {
                                if (groups[n.type]) {
                                  groups[n.type].items.push(n);
                                } else {
                                  groups.general.items.push(n);
                                }
                              });
                              const activeGroups = Object.entries(groups).filter(([_, group]) => group.items.length > 0);
                              return (
                                <div className="divide-y divide-gray-100 dark:divide-gray-800/60 pb-1">
                                  {activeGroups.map(([key, group]) => (
                                    <div key={key} className="p-1">
                                      <div className="px-3 py-1.5 text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest bg-orange-500/5 rounded-lg mb-1 flex justify-between items-center">
                                        <span>{group.label}</span>
                                        <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full text-[9px]">
                                          {group.items.length}
                                        </span>
                                      </div>
                                      <div className="space-y-1">
                                        {group.items.map((notif) => (
                                          <div
                                            key={notif.id}
                                            onClick={async () => {
                                              if (!notif.read) {
                                                await gomboDB.markNotificationAsRead(notif.id);
                                              }
                                              setShowNotifTray(false);
                                              setView("dashboard");
                                            }}
                                            className={`p-3 hover:bg-gray-50/50 dark:hover:bg-gray-850/60 transition-all cursor-pointer text-left rounded-xl ${
                                              !notif.read ? "bg-orange-500/5 dark:bg-orange-950/15 border-l-2 border-orange-500" : ""
                                            }`}
                                          >
                                            <span className="text-xs font-bold text-gray-900 dark:text-white block">
                                              {notif.title}
                                            </span>
                                            <span className="text-[10.5px] text-gray-500 dark:text-gray-400 mt-0.5 block leading-relaxed">
                                              {notif.message}
                                            </span>
                                            <span className="text-[8.5px] text-gray-400 dark:text-gray-500 mt-1 block">
                                              {new Date(notif.createdAt).toLocaleDateString("fr-FR", {
                                                hour: "2-digit",
                                                minute: "2-digit"
                                              })}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()
                          ) : (
                            notifications.map((notif) => (
                              <div
                                key={notif.id}
                                onClick={async () => {
                                  if (!notif.read) {
                                    await gomboDB.markNotificationAsRead(notif.id);
                                  }
                                  setShowNotifTray(false);
                                  setView("dashboard");
                                }}
                                className={`p-4 hover:bg-gray-50/50 dark:hover:bg-gray-850 transition-colors cursor-pointer text-left ${
                                  !notif.read ? "bg-orange-500/5 dark:bg-orange-950/20 border-l-2 border-orange-500" : ""
                                }`}
                              >
                                <span className="text-xs font-bold text-gray-950 dark:text-white block">
                                  {notif.title}
                                </span>
                                <span className="text-[11px] text-gray-550 dark:text-gray-400 mt-1 block leading-relaxed">
                                  {notif.message}
                                </span>
                                <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-1.5 block font-medium">
                                  {new Date(notif.createdAt).toLocaleDateString("fr-FR", {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </span>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="p-2.5 border-t border-gray-150 dark:border-gray-800 text-center bg-gray-50/50 dark:bg-gray-900/10">
                          <button
                            onClick={() => {
                              setView("notifications");
                              setShowNotifTray(false);
                            }}
                            className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 hover:underline flex items-center justify-center gap-1 mx-auto"
                          >
                            Voir tout dans le Centre 🔔
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Dynamic User Profile or Trigger login */}
              {user ? (
                <div className="hidden sm:flex items-center gap-2">
                  {/* User profile option */}
                  <button
                    onClick={() => handleProtectedAction("profile_edit")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold ${
                      view === "profile_edit"
                        ? "bg-purple-50 border-purple-200 text-[#7C3AED] dark:text-[#A78BFA] dark:bg-purple-950/20 dark:border-purple-900"
                        : "bg-white dark:bg-[#1a1a1c] border-gray-150 dark:border-gray-800 hover:bg-gray-50 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <User className="w-4 h-4 text-orange-500" />
                    Bonjour {profile?.firstName || "Artiste"}
                  </button>

                  <button
                    onClick={() => handleProtectedAction("dashboard")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold ${
                      view === "dashboard"
                        ? "bg-purple-50 border-purple-200 text-[#7C3AED] dark:text-[#A78BFA] dark:bg-purple-950/20 dark:border-purple-900"
                        : "bg-white dark:bg-[#1a1a1c] border-gray-150 dark:border-gray-800 hover:bg-gray-50 text-gray-700 dark:text-gray-300"
                    }`}
                    title="Tableau de Bord"
                  >
                    <LayoutDashboard className="w-4 h-4 text-purple-500" />
                    Mes Plans
                  </button>

                  <button
                    onClick={() => handleProtectedAction("profile_edit")}
                    className="w-8.5 h-8.5 rounded-xl overflow-hidden bg-gray-100 hover:ring-2 hover:ring-[#7C3AED] transition-all"
                  >
                    <img 
                      src={profile?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
                      alt="" 
                      className="w-full h-full object-cover" 
                    />
                  </button>

                  <button
                    onClick={handleLogout}
                    className="p-2 hover:text-red-500 text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                    title="Se déconnecter"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="hidden sm:flex px-4.5 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-97"
                >
                  Se Connecter
                </button>
              )}

              {/* Universal Hamburger menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 bg-gray-50 dark:bg-gray-800/40 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5.5 h-5.5 text-orange-500" /> : <Menu className="w-5.5 h-5.5" />}
              </button>

            </div>
          </div>
        </div>

        {/* --- UNIVERSAL NAVIGATION PANEL (SLIDING LEFT SIDE DRAWER / MENU LATÉRAL) --- */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
              />

              {/* Sliding Drawer */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed inset-y-0 left-0 z-[60] w-80 max-w-[85vw] bg-white dark:bg-[#121826] p-6 shadow-2xl overflow-y-auto flex flex-col justify-between border-r border-gray-100 dark:border-gray-800"
              >
                <div className="space-y-6">
                  {/* Close and Title Bar */}
                  <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setView("home"); setMobileMenuOpen(false); }}>
                      <div className="p-2 bg-gradient-to-tr from-orange-500 to-orange-600 rounded-xl text-white">
                        <Flame className="w-4 h-4 fill-current animate-pulse" />
                      </div>
                      <div>
                        <span className="font-extrabold text-sm tracking-tight text-gray-950 dark:text-white uppercase block leading-none">Y’A GOMBO</span>
                        <span className="text-[9px] font-black uppercase text-orange-600 dark:text-orange-400 block tracking-wider mt-0.5">MUSIC 🇨🇮</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1.5 bg-gray-50 dark:bg-gray-800/50 text-gray-400 hover:text-gray-950 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* USER CONNECTIONS DETAILS & STATE */}
                  {user ? (
                    /* LOGGED USER PROFILE CARD & MON ESPACE GOMBO ACTIONS */
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-tr from-purple-500/10 to-orange-500/5 dark:from-purple-950/20 dark:to-orange-950/5 rounded-2xl border border-gray-150 dark:border-gray-850 text-left">
                        <div className="flex items-center gap-3.5">
                          <img 
                            src={profile?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
                            alt="Profil" 
                            className="w-12 h-12 rounded-full object-cover border-2 border-orange-500 shrink-0 shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-extrabold text-gray-950 dark:text-white text-sm leading-tight truncate">
                              {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : "Artiste Gombo"}
                            </p>
                            <p className="text-xs text-gray-555 dark:text-gray-400 font-medium mt-0.5">
                              {profile?.commune || "Abidjan"}
                            </p>
                            <p className="text-xs text-orange-600 dark:text-orange-400 font-bold mt-0.5">
                              {profile?.role === "musicien" ? "Musicien" : profile?.role === "client" ? "Boss Recruteur" : "Membre Gombo"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Mon Espace Gombo List */}
                      <div className="space-y-1.5 border-b border-gray-100 dark:border-gray-800 pb-4 text-left">
                        <p className="text-[9.5px] font-black tracking-widest text-[#FF7A00] uppercase mb-1.5">👤 Mon Espace Gombo</p>
                        
                        <button
                          onClick={() => { setView("profile_edit"); setMobileMenuOpen(false); }}
                          className="w-full py-1.5 px-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 rounded-xl flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors uppercase tracking-wider cursor-pointer"
                        >
                          <User className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <span>Mon Profil</span>
                        </button>

                        <button
                          onClick={() => { setDashboardInitialTab("gombos"); setView("dashboard"); setMobileMenuOpen(false); }}
                          className="w-full py-1.5 px-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 rounded-xl flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-350 transition-colors uppercase tracking-wider cursor-pointer"
                        >
                          <Briefcase className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span>Mes Publications</span>
                        </button>

                        <button
                          onClick={() => { setDashboardInitialTab("applications"); setView("dashboard"); setMobileMenuOpen(false); }}
                          className="w-full py-1.5 px-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 rounded-xl flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-330 transition-colors uppercase tracking-wider cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>Mes Candidatures</span>
                        </button>

                        <button
                          onClick={() => { setDashboardInitialTab("reservations"); setView("dashboard"); setMobileMenuOpen(false); }}
                          className="w-full py-1.5 px-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 rounded-xl flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-330 transition-colors uppercase tracking-wider cursor-pointer"
                        >
                          <Heart className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span>Mes Favoris</span>
                        </button>

                        <button
                          onClick={() => { setView("notifications"); setMobileMenuOpen(false); }}
                          className="w-full py-1.5 px-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 rounded-xl flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-330 transition-colors uppercase tracking-wider cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Bell className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                            <span>Mes Notifications</span>
                          </div>
                          {notifications.filter(n => !n.read).length > 0 && (
                            <span className="bg-red-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full">
                              {notifications.filter(n => !n.read).length}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                          className="w-full py-1.5 px-2.5 text-left hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-500 transition-colors uppercase tracking-wider cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5 shrink-0" />
                          <span>Déconnexion</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* NON-LOGGED IN USER GREETING & LOGIN BUTTON */
                    <div className="p-4 bg-orange-500/5 dark:bg-orange-950/10 rounded-2xl border border-orange-500/10 text-center space-y-2.5">
                      <p className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400 tracking-wider">Bienvenue dans Y’A GOMBO MUSIC 🇨🇮</p>
                      <p className="text-[10px] text-gray-500 leading-relaxed">Connectez-vous pour voir vos opportunités musicales et cachets sécurisés.</p>
                      <button
                        onClick={() => { setShowAuthModal(true); setMobileMenuOpen(false); }}
                        className="w-full py-2 bg-[#FF7A00] hover:bg-[#E06C00] text-white text-center font-black rounded-xl text-xs uppercase cursor-pointer shadow-md select-none"
                      >
                        Se Connecter
                      </button>
                    </div>
                  )}

                  {/* Core Navigation Links */}
                  <div className="space-y-3 uppercase text-xs tracking-wider font-extrabold pb-4">
                    <button 
                      onClick={() => { navigateTo("annuaire"); setMobileMenuOpen(false); }}
                      className="w-full py-1.5 px-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 rounded-xl flex justify-between items-center group cursor-pointer"
                    >
                      <span className="group-hover:text-[#FF7A00] transition-colors">🎤 La Base</span>
                      <span className="text-[9px] font-black text-[#FF7A00] bg-orange-50 dark:bg-orange-950/20 px-1.5 py-0.5 rounded-sm animate-pulse">DIRECT 🔥</span>
                    </button>

                    <button 
                      onClick={() => { setView("groupe"); setMobileMenuOpen(false); }}
                      className="w-full py-1.5 px-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 rounded-xl flex justify-between items-center group cursor-pointer"
                    >
                      <span className="group-hover:text-amber-500 transition-colors font-semibold">🎼 Coin des Groupes</span>
                      <span className="text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded-sm">VIP ⭐</span>
                    </button>

                    <button 
                      onClick={() => { setView("home"); setCurrentHomeTab("marche"); setMobileMenuOpen(false); }}
                      className="w-full py-1.5 px-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 rounded-xl flex justify-between items-center group cursor-pointer"
                    >
                      <span className="group-hover:text-purple-500 transition-colors">🛒 Marché du Coin</span>
                      <span className="text-[9px] font-black text-orange-600 bg-orange-50 dark:bg-orange-950/20 px-1.5 py-0.5 rounded-sm">Direct 👍</span>
                    </button>

                    <button 
                      onClick={() => { setView("certification"); setMobileMenuOpen(false); }}
                      className="w-full py-1.5 px-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 rounded-xl flex justify-between items-center group cursor-pointer"
                    >
                      <span className="group-hover:text-orange-500 transition-colors">🏆 Talent Certifié</span>
                      <span className="text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded-sm">Niveau Boss</span>
                    </button>

                    <button 
                      onClick={() => { setView("cachets"); setMobileMenuOpen(false); }}
                      className="w-full py-1.5 px-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 rounded-xl flex justify-between items-center group cursor-pointer"
                    >
                      <span className="group-hover:text-emerald-500 transition-colors">💰 Les Cachets</span>
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded-sm font-sans">Sécurisé</span>
                    </button>

                    <button 
                      onClick={() => { setView("support"); setMobileMenuOpen(false); }}
                      className="w-full py-1.5 px-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 rounded-xl flex justify-between items-center group cursor-pointer"
                    >
                      <span className="group-hover:text-purple-550 transition-colors font-semibold">📞 Support</span>
                      <span className="text-[9px] font-black text-purple-650 bg-purple-50 dark:bg-purple-950/20 px-1.5 py-0.5 rounded-sm">24H/7</span>
                    </button>

                    <button 
                      onClick={() => { setView("about"); setMobileMenuOpen(false); }}
                      className="w-full py-1.5 px-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 rounded-xl flex justify-between items-center group cursor-pointer"
                    >
                      <span className="group-hover:text-orange-500 transition-colors">📖 À propos</span>
                      <span className="text-[8px] font-black text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-1.5 py-0.5 rounded">INFOS</span>
                    </button>
                  </div>
                </div>

                {/* Footer Brand Credit */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
                  <p className="text-[9px] font-bold text-gray-400 tracking-wider">© Y’A GOMBO MUSIC CORP • ABIDJAN</p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>

      {/* --- MASTER LAYOUT BODY CONTAINER --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        <AnimatePresence mode="wait">
          {/* A. ACCUEIL VIEW: FIL D’ACTUALITÉ & MARCHÉ DU COIN */}
          {view === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* HERO PROMO BLOCK / HERO BANNER */}
              <div className="bg-white dark:bg-[#18181B] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1 space-y-4 text-center md:text-left">
                  <span className="px-3 py-1 bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase rounded-full tracking-wider">
                    🇨🇮 PRESTATIONS SHOWBIZ IVOIRIEN
                  </span>
                  
                  <h1 className="text-3xl sm:text-4xl font-black text-gray-950 dark:text-white tracking-tight leading-none uppercase">
                    Y’A GOMBO MUSIC
                  </h1>
                  
                  <p className="text-base text-orange-500 font-extrabold tracking-tight">
                    « Le Temple du Gombo Musical. » — Vos cachets 100% sécurisés.
                  </p>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xl">
                    Découvrez le flux d'actualité des démos et concerts en direct, ou partagez vos performances pour décrocher les meilleurs contrats artistiques d'Abidjan.
                  </p>
                  
                  <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                    <button
                      onClick={() => handleProtectedAction("publish")}
                      className="px-6 py-3 bg-[#FF7A00] hover:bg-[#E06C00] text-white font-bold rounded-xl shadow-md transition-all active:scale-97 flex items-center justify-center gap-2 text-xs"
                    >
                      <Plus className="w-5 h-5 stroke-[2px]" /> Quoi de neuf, l'artiste ?
                    </button>
                    <button
                      onClick={() => setView("gombo_list")}
                      className="px-6 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs border border-gray-150 dark:border-gray-700"
                    >
                      <Briefcase className="w-4 h-4 text-orange-500 fill-orange-500/20" /> Voir les offres de Gombos
                    </button>
                  </div>
                </div>

                {/* Right side illustration */}
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 hidden md:block shrink-0">
                  <div className="absolute inset-0 bg-[#FF7A00]/10 rounded-full blur-2xl opacity-60"></div>
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-full h-full bg-gradient-to-tr from-[#FF7A00] to-amber-500 rounded-3xl p-5 flex flex-col justify-end text-white shadow-xl relative"
                  >
                    <Music className="w-12 h-12 absolute top-4 right-4 text-white/30" />
                    <Star className="w-8 h-8 text-yellow-300 animate-pulse mb-2" />
                    <p className="font-extrabold text-lg leading-tight uppercase">Y’A GOMBO MUSIC</p>
                    <p className="text-[10px] text-orange-200">Rejoignez le Fil d'actualité musical</p>
                  </motion.div>
                </div>
              </div>

              {/* PILL SWITCHSWITCHER FOR ACCUEIL TABS */}
              <div className="flex bg-gray-100/60 dark:bg-[#141416] p-1.5 rounded-2xl max-w-sm mx-auto shadow-xs border border-gray-150 dark:border-gray-850">
                <button
                  onClick={() => setCurrentHomeTab("fil")}
                  className={`flex-1 py-3 text-center rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                    currentHomeTab === "fil"
                      ? "bg-[#FF7A00] text-white shadow-md font-extrabold scale-102"
                      : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  📌 Fil d’actualité
                </button>
                <button
                  onClick={() => setCurrentHomeTab("marche")}
                  className={`flex-1 py-3 text-center rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 ${
                    currentHomeTab === "marche"
                      ? "bg-[#FF7A00] text-white shadow-md font-extrabold scale-102"
                      : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  🛒 Marché du Coin 🔒
                </button>
              </div>

              {/* TWO COLUMN HOME LAYOUT */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-6 w-full">
                
                {/* LEFT COLUMN: PRIMARY FEEDS */}
                <div className="lg:col-span-8 space-y-6 w-full">
                  {/* TAB CONTAINER 1: FIL D'ACTUALITÉ */}
                  {currentHomeTab === "fil" && (
                    <div className="space-y-6 max-w-2xl mx-auto">
                  {/* COMPOSER BANNER FOR LOGGED IN ARTISTES */}
                  {profile && profile.role === "musicien" && (
                    <div className="bg-white dark:bg-[#1a1a1f] p-4 rounded-3xl border border-dashed border-orange-300 dark:border-orange-900/50 flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3">
                        <img 
                          src={profile.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
                          alt="" 
                          className="w-10 h-10 rounded-full object-cover" 
                        />
                        <div>
                          <p className="text-xs font-extrabold text-[#111] dark:text-white">Partagez votre Talent !</p>
                          <p className="text-[10px] text-gray-450">Publiez une démo instrumentale ou vocale.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setView("publish");
                        }}
                        className="px-4 py-2 bg-orange-100 text-orange-600 hover:bg-[#FF7A00] hover:text-white rounded-xl text-xs font-bold transition-all"
                      >
                        Publier un Son
                      </button>
                    </div>
                  )}

                  {/* HIGH-STYLE FILTER BAR */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      onClick={() => setSocialFilter("all")}
                      className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all ${
                        socialFilter === "all"
                          ? "bg-gray-900 text-white dark:bg-white dark:text-gray-950 shadow-md"
                          : "bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-white"
                      }`}
                    >
                      🚀 Tous
                    </button>
                    <button
                      onClick={() => setSocialFilter("gombo")}
                      className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all ${
                        socialFilter === "gombo"
                          ? "bg-[#FF7A00] text-white shadow-md shadow-orange-500/15"
                          : "bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-white"
                      }`}
                    >
                      💼 Gombos
                    </button>
                    <button
                      onClick={() => setSocialFilter("demo")}
                      className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all ${
                        socialFilter === "demo"
                          ? "bg-purple-600 text-white shadow-md shadow-purple-600/15"
                          : "bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-white"
                      }`}
                    >
                      🎵 Démos
                    </button>
                    <button
                      onClick={() => setSocialFilter("annonce")}
                      className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all ${
                        socialFilter === "annonce"
                          ? "bg-teal-600 text-white shadow-md shadow-teal-650/15"
                          : "bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-white"
                      }`}
                    >
                      📢 Artistes
                    </button>
                  </div>

                  {/* LOADING STATE OR SOCIAL POSTS GRID */}
                  {loadingSocial ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : socialPosts.filter(p => socialFilter === "all" || p.type === socialFilter).length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800/10 rounded-3xl border border-gray-100 dark:border-gray-800">
                      <Music className="w-12 h-12 text-gray-300 mx-auto mb-2 animate-bounce" />
                      <p className="font-bold text-gray-850 dark:text-white text-sm">Le fil d’actualité est vide ici</p>
                      <p className="text-xs text-gray-500 mt-1">Soyez le premier à publier dans cette catégorie !</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {socialPosts
                        .filter(p => socialFilter === "all" || p.type === socialFilter)
                        .map((post) => (
                          <SocialPostCard
                            key={post.id}
                            post={post}
                            currentUser={user}
                            currentUserProfile={profile}
                            playingPostId={playingPostId}
                            setPlayingPostId={setPlayingPostId}
                            onTriggerLogin={() => setShowAuthModal(true)}
                          />
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTAINER 2: MARCHÉ DU COIN (LOCKED FUTURISTIC VIEW) */}
              {currentHomeTab === "marche" && (
                <div className="space-y-8 max-w-4xl mx-auto">
                  <div className="text-center space-y-3">
                    <span className="px-3.5 py-1 bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 text-xs font-black rounded-full border border-teal-100 dark:border-teal-900 inline-flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Service Bientôt Disponible
                    </span>
                    <h2 className="text-2xl font-black text-gray-950 dark:text-white">Le Marché du Coin Y’A GOMBO MUSIC</h2>
                    <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                      Trouvez, louez ou vendez du matériel musical d'urgence (sonos, amplificateurs, claviers, micros) directement auprès d'autres professionnels d'Abidjan.
                    </p>
                  </div>

                  {/* Blurred mock grid items */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-35 select-none pointer-events-none filter blur-xs">
                    {[
                      {
                        title: "Guitare Fender Stratocaster 1994",
                        price: "180,000 FCFA",
                        commune: "Marcory Zone 4",
                        image: "https://images.unsplash.com/photo-1508186225823-0963cf9ab0de?auto=format&fit=crop&q=80&w=300"
                      },
                      {
                        title: "Console Audio Numérique Yamaha 16 canaux",
                        price: "450,000 FCFA",
                        commune: "Yopougon Maroc",
                        image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=300"
                      },
                      {
                        title: "Micro Shure SM58 Authentique (Neuf)",
                        price: "60,000 FCFA",
                        commune: "Cocody Angré",
                        image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=300"
                      }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-white dark:bg-[#1e1e24] rounded-2xl overflow-hidden border border-gray-150 dark:border-gray-800 p-4">
                        <img src={item.image} alt="" className="w-full h-36 object-cover rounded-xl mb-3" />
                        <span className="text-[9px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md uppercase">Vente d'occasion</span>
                        <h4 className="font-extrabold text-sm dark:text-white mt-2">{item.title}</h4>
                        <div className="flex justify-between items-center mt-3 border-t pt-2.5">
                          <span className="font-mono font-bold text-gray-900 dark:text-white">{item.price}</span>
                          <span className="text-[10px] text-gray-400">📍 {item.commune}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Dynamic sign-up waiting features block */}
                  <div className="bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-[#1e1e24] dark:to-[#1a1a1f] p-8 rounded-3xl border border-gray-150 dark:border-gray-800 max-w-lg mx-auto text-center space-y-4 shadow-md relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 bg-orange-500/10 w-24 h-24 rounded-full blur-xl"></div>
                    <div className="p-3 bg-teal-50 dark:bg-teal-950/50 text-teal-600 rounded-2xl w-fit mx-auto">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black text-gray-950 dark:text-white uppercase tracking-tight">Voulez-vous être notifié de l'ouverture ?</h3>
                    <p className="text-xs text-gray-500">
                      Soyez alerté par SMS prioritaires une seconde avant tout le monde à Abidjan pour ne manquer aucun bon prix de sono ou de guitare !
                    </p>
                    <button
                      onClick={async () => {
                        const activeUser = currentUser || user;
                        if (!activeUser) {
                          setShowAuthModal(true);
                          return;
                        }
                        try {
                          await gomboDB.registerWaitingFeature(activeUser.uid, activeUser.email, "marche");
                          alert("Félicitations ! Vous êtes bien enregistré sur la file d'attente du Marché du Coin ! Nous vous contacterons dès activation.");
                        } catch (err) {
                          console.error(err);
                          alert("Une erreur s'est produite lors de l'enregistrement.");
                        }
                      }}
                      className="px-6 py-3.5 w-full bg-[#FF7A00] hover:bg-[#E06C00] text-white font-extrabold rounded-2xl text-xs uppercase shadow-md transition-all active:scale-97"
                    >
                      🚀 S'inscrire sur la file d'attente
                    </button>
                  </div>
                </div>
              )}

                </div>

                {/* RIGHT COLUMN: ENGAGEMENT SIDEBAR */}
                <div className="lg:col-span-4 space-y-6 w-full">
                  
                  {/* CARD 1: SÉRIE D'ACTIVITÉ */}
                  <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent dark:from-orange-950/20 dark:to-transparent border border-orange-100 dark:border-orange-900/40 p-5 rounded-3xl space-y-3 shadow-xs relative overflow-hidden">
                    <div className="absolute top-3 right-3 text-2xl animate-bounce">🔥</div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#FF7A00] dark:text-orange-400 font-mono">Série & Engagement</h4>
                      <p className="text-lg font-black text-gray-900 dark:text-white mt-1">🔥 {activityStreak} {activityStreak > 1 ? "jours actifs" : "jour actif"}</p>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-400 leading-relaxed">
                      Revenez chaque jour à Abidjan pour développer votre réseau de contacts et maintenir votre bonus de référencement !
                    </p>

                    {profile && (
                      <div className="pt-2 border-t border-orange-150/20 dark:border-orange-900/30 flex items-center justify-between text-xs font-bold gap-2">
                        <span className="text-gray-400 dark:text-gray-500">Votre Statut :</span>
                        {(() => {
                          const gigs = profile.gigsCompleted || 0;
                          const apps = profile.applicationsSent || 0;
                          const rev = profile.totalRevenue || 0;
                          let lvlName = "Nouveau Talent";
                          let lvlColor = "text-purple-600 bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/30";
                          if (gigs >= 8 || rev >= 100000 || apps >= 10) {
                            lvlName = "Boss du Gombo";
                            lvlColor = "text-rose-600 bg-rose-50 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-900/40 font-black";
                          } else if (gigs >= 2 || rev >= 15000 || apps >= 3) {
                            lvlName = "Talent Confirmé";
                            lvlColor = "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40";
                          }
                          return (
                            <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider ${lvlColor}`}>
                              👑 {lvlName}
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* CARD 2: PROFILE COMPLETION BAR */}
                  {profile ? (() => {
                    let score = 0;
                    const missingItems = [];
                    if (profile.avatarUrl || profile.photoURL) score += 20; else missingItems.push("Photo");
                    if (profile.bio && profile.bio.trim().length > 0) score += 20; else missingItems.push("Bio");
                    if (profile.phone && profile.phone.trim().length > 0) score += 20; else missingItems.push("Tel");
                    if (profile.commune && profile.commune.trim().length > 0) score += 20; else missingItems.push("Commune");
                    if (profile.specialty || profile.speciality) score += 20; else missingItems.push("Spécialité");

                    return (
                      <div className="bg-white dark:bg-[#121214] border border-gray-105 dark:border-gray-800 p-5 rounded-3xl space-y-3 shadow-xs">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono">📈 Profil ({score}%)</span>
                          {score < 100 && (
                            <button 
                              onClick={() => setView("dashboard")}
                              className="text-[10px] font-extrabold text-[#FF7A00] uppercase hover:underline animate-pulse"
                            >
                              Éditer
                            </button>
                          )}
                        </div>
                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#FF7A00] to-amber-500" style={{ width: `${score}%` }} />
                        </div>
                        {score < 100 ? (
                          <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                            💡 Reste à remplir : <strong className="text-gray-650 dark:text-gray-300">{missingItems.join(", ")}</strong> pour maximiser votre éligibilité !
                          </p>
                        ) : (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            🎉 Profil optimal à 100% pour recevoir des cachets !
                          </p>
                        )}
                      </div>
                    );
                  })() : (
                    <div className="bg-white dark:bg-[#121214] border border-gray-105 dark:border-gray-800 p-5 rounded-3xl text-center space-y-3 shadow-xs">
                      <span className="text-3xl block animate-bounce">🎤</span>
                      <h4 className="font-extrabold text-xs text-gray-800 dark:text-white uppercase">Créez votre profil</h4>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
                        Rejoignez le Gombo-Réseau, publiez vos démos et gagnez de la visibilité auprès des promoteurs.
                      </p>
                      <button 
                        onClick={() => setShowAuthModal(true)}
                        className="py-2 px-4 bg-orange-50 dark:bg-orange-950/20 text-[#FF7A00] rounded-xl text-[10px] font-black uppercase text-center w-full block border border-orange-100/40"
                      >
                        Créer mon compte
                      </button>
                    </div>
                  )}

                  {/* CARD 3: GOMBO DU JOUR */}
                  {(() => {
                    const activeOffers = gombos.filter(g => g.status === "publie");
                    let featured: any = null;
                    if (activeOffers.length > 0) {
                      const sorted = [...activeOffers].sort((a,b) => {
                        if (a.urgent && !b.urgent) return -1;
                        if (!a.urgent && b.urgent) return 1;
                        return b.budget - a.budget;
                      });
                      featured = sorted[0];
                    } else {
                      featured = {
                        id: "g-jour-static",
                        title: "⭐ Prestation Cabaret d'Honneur",
                        eventType: "Cabaret",
                        budget: 180000,
                        commune: "Marcory Zone 4",
                        description: "Nous recrutons un claviériste d'urgence et une chanteuse lead vocale pour une prestation de 4H d’ambiance rumba chic.",
                        musiciansCount: 2,
                        date: "Samedi Prochain",
                        urgent: true
                      };
                    }

                    return (
                      <div className="bg-[#121214] border border-[#FF7A00]/25 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden space-y-3.5">
                        <div className="absolute top-0 right-0 bg-gradient-to-bl from-orange-500 to-transparent p-2 text-[10px] font-extrabold uppercase tracking-widest leading-none text-white rounded-bl-xl">
                          VEDETTE
                        </div>
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 bg-[#FF7A00] text-[9px] font-bold uppercase rounded text-white tracking-wider">
                            ⚡ GOMBO DU JOUR
                          </span>
                          <h4 className="font-black text-sm tracking-tight leading-snug pt-1 text-white uppercase">{featured.title}</h4>
                        </div>
                        
                        <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-3">
                          {featured.description}
                        </p>

                        <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-2xl p-3 text-xs font-bold gap-2">
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-[#FF7A00] uppercase block">Cachet Net</span>
                            <span className="font-mono text-xs text-yellow-300">{(featured.budget).toLocaleString()} FCFA</span>
                          </div>
                          <div className="text-right space-y-0.5">
                            <span className="text-[9px] text-gray-400 uppercase block">Commune</span>
                            <span className="text-xs text-gray-200">📍 {featured.commune}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setView("gombo_list");
                          }}
                          className="w-full text-center py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap active:scale-97 transition-all cursor-pointer"
                        >
                          Décrocher le Cachet !
                        </button>
                      </div>
                    );
                  })()}

                  {/* CARD 4: TOP TALENTS */}
                  <div className="bg-white dark:bg-[#121214] border border-gray-105 dark:border-gray-800 rounded-3xl p-5 space-y-4 shadow-xs">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#FF7A00] dark:text-orange-400 font-mono">Top Talents</h4>
                      <p className="text-xs font-bold text-gray-805 dark:text-white mt-1">⭐ Artistes les plus actifs de la semaine</p>
                    </div>

                    <div className="space-y-3">
                      {topTalentsList.map((talent, idx) => (
                        <div key={idx} className="flex items-center justify-between border-b border-gray-100/40 dark:border-gray-800/40 pb-2.5 last:border-0 last:pb-0">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative shrink-0">
                              <img src={talent.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} alt="" className="w-8 h-8 rounded-full object-cover border border-orange-500/20" />
                              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 text-gray-950 font-black rounded-full flex items-center justify-center text-[7px] border border-white">
                                {idx + 1}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-black text-gray-950 dark:text-white truncate font-sans">
                                {talent.artistName || `${talent.firstName} ${talent.lastName.substring(0, 1)}.`}
                              </p>
                              <span className="text-[9px] font-bold text-gray-400 block dark:text-gray-500 shrink-0 truncate">
                                🎸 {talent.specialty || "Showbiz Solo"}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className="px-2 py-0.5 bg-orange-50 dark:bg-orange-950/20 text-[#FF7A00] text-[9px] font-black uppercase rounded font-mono">
                              🔥 {talent.gigsCompleted} GIGS
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          )}

          {/* B. RENFORT EXPRESS ACTIVE LISTING & FORM */}
          {view === "renfort_express" && (
            <motion.div
              key="renfort_express"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <RenfortExpress 
                currentUserProfile={profile} 
                onShowAuth={() => setShowAuthModal(true)} 
              />
            </motion.div>
          )}

          {/* B. ACTIVE GOMBOS OFFERS DATABASE (SECTION 2: GOMBO) */}
          {view === "gombo_list" && (
            <motion.div
              key="gombo_list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Header Intro */}
              <div className="space-y-2">
                <span className="px-3 py-1 bg-orange-50 dark:bg-orange-950/30 text-[#FF7A00] text-xs font-black uppercase rounded-lg">
                  💼 Répertoire des Cachets Showbiz
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white uppercase tracking-tight">
                  Contrats Actifs d'Abidjan
                </h2>
                <p className="text-xs text-gray-500 leading-normal max-w-xl">
                  Postulez en 1 clic aux offres d'animation pour les mariages, cabarets, festivals et soirées privées à Abidjan. Les paiements de vos cachets sont 100% sécurisés.
                </p>
              </div>

              {/* SEARCH FILTERS BLOCK */}
              <div className="bg-white dark:bg-[#1a1a1f] border border-gray-100 dark:border-gray-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row items-center gap-3">
                  {/* Query input */}
                  <div className="relative w-full flex-1">
                    <Search className="absolute inset-y-0 left-3 flex items-center text-gray-400 w-4.5 h-4.5" />
                    <input
                      type="text"
                      placeholder="Rechercher par instrument (bassiste, claviériste), rumba, cabaret, mariage..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1a1a1f] dark:text-white"
                    />
                  </div>

                  {/* Commune picker */}
                  <div className="relative w-full lg:w-56 shrink-0">
                    <select
                      value={selectedCommune}
                      onChange={(e) => setSelectedCommune(e.target.value)}
                      className="w-full px-3 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1a1a1f] dark:text-white cursor-pointer font-semibold"
                    >
                      {ABIDJAN_COMMUNES.map((com) => (
                        <option key={com} value={com}>{com}</option>
                      ))}
                    </select>
                  </div>

                  {/* Specialty picker */}
                  <div className="relative w-full lg:w-56 shrink-0">
                    <select
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value)}
                      className="w-full px-3 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1a1a1f] dark:text-white cursor-pointer font-semibold"
                    >
                      {SPECIALTY_OPTIONS.map((spec) => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* URGENT PRIORITY GOMBO CARDS */}
              {urgentGombos.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-black text-gray-950 dark:text-white flex items-center gap-2 uppercase tracking-tight">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    Contrats d'urgence Showbiz 🔥
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {urgentGombos.map((gombo, index) => (
                      <motion.div 
                        key={gombo.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
                        className="bg-amber-50/20 dark:bg-amber-950/10 border-2 border-[#FF7A00]/30 p-5 rounded-3xl relative flex flex-col justify-between"
                      >
                        <span className="absolute top-4 right-4 px-2 py-0.5 bg-orange-500 text-white text-[9px] font-black uppercase rounded-md tracking-wider animate-pulse">
                          Urgent
                        </span>
                        
                        <div>
                          <p className="text-[10px] text-orange-600 font-black uppercase tracking-wider">{gombo.eventType}</p>
                          <h4 className="font-extrabold text-gray-950 dark:text-white text-base mt-1 mb-1.5">{gombo.title}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed mb-3">
                            {gombo.description}
                          </p>

                          {/* Technical list info */}
                          <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500 dark:text-gray-400 border-t border-dashed border-orange-200 dark:border-orange-900/50 pt-2.5">
                            <p>📍 Commune : <strong className="text-gray-800 dark:text-gray-200">{gombo.commune}</strong></p>
                            <p>📅 Date : <strong className="text-gray-800 dark:text-gray-200">{gombo.date}</strong></p>
                            <p>⏰ Début : <strong className="text-gray-800 dark:text-gray-200">{gombo.time}</strong></p>
                            <p>🎸 Recherchés : <strong className="text-gray-800 dark:text-gray-200">{gombo.musiciansCount} pers</strong></p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-gray-400 block tracking-tight">Cachet Net Garanti :</span>
                            <span className="font-mono text-base font-black text-[#FF7A00]">{gombo.budget.toLocaleString()} FCFA</span>
                          </div>
                          
                          {profile?.role === "musicien" || !profile ? (
                            <button
                              onClick={() => {
                                if (!profile) {
                                  setShowAuthModal(true);
                                } else {
                                  setApplyGombo(gombo);
                                }
                              }}
                              className="px-4.5 py-2.5 bg-[#FF7A00] hover:bg-[#E06C00] active:scale-97 text-white font-black rounded-xl text-xs transition-colors shadow-md uppercase tracking-wider"
                            >
                              🔥 Je suis chaud
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-bold uppercase py-1.5 px-3 bg-gray-100 dark:bg-gray-850 rounded-lg">Réservé-Clients</span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* LIST OF NORMAL GOMBOS */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-gray-950 dark:text-white uppercase tracking-tight">
                  Toutes les offres disponibles
                </h3>

                {loadingGombos ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredGombos.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-gray-800/10 rounded-3xl border border-gray-100 dark:border-gray-800 max-w-lg mx-auto">
                    <Music className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-bold text-gray-800 dark:text-white">Aucun gombo ne correspond à vos filtres</p>
                    <p className="text-xs text-gray-500 mt-1">Élargissez vos critères (commune ou spécialité) pour voir plus d'offres.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredGombos.map((gombo, index) => (
                      <motion.div 
                        key={gombo.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
                        className="bg-white dark:bg-[#1a1a1f] p-5 rounded-2xl border border-gray-100 dark:border-gray-850 relative flex flex-col justify-between hover:shadow-md transition-all duration-200"
                      >
                        <div>
                          <p className="text-[10px] text-orange-600 dark:text-orange-400 font-black uppercase tracking-wider">{gombo.eventType}</p>
                          <h4 className="font-extrabold text-[#111] dark:text-white text-sm mt-1 mb-1.5 line-clamp-1">{gombo.title}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-3">
                            {gombo.description}
                          </p>

                          {/* Technical list info */}
                          <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400 border-t border-gray-50 dark:border-gray-850 pt-2.5">
                            <p>📍 {gombo.commune}</p>
                            <p>📅 {gombo.date}</p>
                            <p>⏰ {gombo.time}</p>
                            <p>👥 {gombo.musiciansCount} pers.</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3.5 border-t border-gray-50 dark:border-gray-850 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-gray-400 block p-0">Cachet :</span>
                            <span className="font-mono text-xs font-black text-gray-900 dark:text-white">{gombo.budget.toLocaleString()} FCFA</span>
                          </div>
                          
                          {profile?.role === "musicien" || !profile ? (
                            <button
                              onClick={() => {
                                if (!profile) {
                                  setShowAuthModal(true);
                                } else {
                                  setApplyGombo(gombo);
                                }
                              }}
                              className="px-4 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-[#FF7A00] hover:text-white active:scale-97 text-gray-700 dark:text-gray-200 font-bold rounded-xl text-xs transition-all shadow-xs"
                            >
                              🔥 Je suis chaud
                            </button>
                          ) : (
                            <span className="text-[9px] text-gray-400 font-bold uppercase py-1 px-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">Recrutement</span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* C. MULTI-PUBLICATION DISPATCHER SHEETS (BOUOTN CENTRAL ➕) */}
          {view === "publish" && (
            <motion.div
              key="publish"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              {/* If no selected choice yet, show magnificent bento selector */}
              {!newPostTitle && !profile && (
                <div className="text-center py-12 bg-white dark:bg-[#1a1a1f] rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-xl max-w-md mx-auto space-y-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-950 text-orange-600 rounded-full w-fit mx-auto">
                    <User className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-extrabold text-[#111] dark:text-white uppercase">Connexion Requise</h3>
                  <p className="text-xs text-gray-500">
                    Veuillez vous inscrire ou vous connecter à votre profil Y’A GOMBO MUSIC pour publier une opportunité artistique ou partager une démo musicale.
                  </p>
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className="px-6 py-3 bg-[#FF7A00] text-white font-bold rounded-xl text-xs uppercase shadow-md w-full"
                  >
                    Se connecter maintenant
                  </button>
                </div>
              )}

              {profile && !newPostTitle && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-[#111] dark:text-white uppercase tracking-tight">Que souhaitez-vous publier aujourd'hui ?</h2>
                    <p className="text-xs text-gray-500 max-w-md mx-auto">
                      Choisissez l'option qui correspond le mieux à votre besoin à Abidjan.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Bento Option 1: client gombo */}
                    <div 
                      onClick={() => setNewPostTitle("gombo")}
                      className="bg-white dark:bg-[#1a1a1f] p-6 rounded-3xl border border-gray-100 dark:border-gray-850 shadow-sm cursor-pointer hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-md transition-all group text-left"
                    >
                      <div className="p-3 bg-orange-50 dark:bg-orange-950/40 text-orange-600 rounded-2xl w-fit group-hover:scale-105 transition-transform">
                        <Briefcase className="w-6 h-6" />
                      </div>
                      <h4 className="font-extrabold text-gray-950 dark:text-white text-base mt-4">Publier un Gombo Musical (Contrat)</h4>
                      <p className="text-xs text-gray-500 mt-1 lines-clamp-3 leading-relaxed">
                        Pour les propriétaires de bars/cabarets, mariés ou producteurs. Recrutez des solistes, batteurs ou cuivres qualifiés et sécurisez vos transactions de cachets.
                      </p>
                      <div className="mt-6 text-[11px] font-black text-[#FF7A00] flex items-center gap-1 group-hover:underline uppercase tracking-wider">
                        Ouvrir le formulaire <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Bento Option 2: musicien feed post */}
                    <div 
                      onClick={() => setNewPostTitle("social")}
                      className="bg-white dark:bg-[#1a1a1f] p-6 rounded-3xl border border-gray-100 dark:border-gray-850 shadow-sm cursor-pointer hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-md transition-all group text-left"
                    >
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-[#FF7A00] rounded-2xl w-fit group-hover:scale-105 transition-transform">
                        <Music className="w-6 h-6" />
                      </div>
                      <h4 className="font-extrabold text-gray-950 dark:text-white text-base mt-4">Partager un Post Musical sur le Fil</h4>
                      <p className="text-xs text-gray-500 mt-1 lines-clamp-3 leading-relaxed">
                        Pour les musiciens d'Abidjan. Partagez un solo instrumental rapide, un a cappella, ou faites la promo de votre style pour séduire de futurs clients fortunés.
                      </p>
                      <div className="mt-6 text-[11px] font-black text-[#FF7A00] flex items-center gap-1 group-hover:underline uppercase tracking-wider">
                        Ouvrir le formulaire <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* RENDER VIEW 1: PRESTATION GOMBO FORM */}
              {profile && newPostTitle === "gombo" && (
                <GomboPublish
                  currentUserProfile={profile}
                  onSuccess={() => {
                    setView("gombo_list");
                    setNewPostTitle("");
                    alert("Gombo publié avec succès ! Vos musiciens l'examinent déjà.");
                  }}
                  onCancel={() => setNewPostTitle("")}
                />
              )}

              {/* RENDER VIEW 2: SOCIAL MUSICIAN FEED POST FORM */}
              {profile && newPostTitle === "social" && (
                <div className="bg-white dark:bg-[#1a1a1f] p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">
                  <div className="mb-6">
                    <h3 className="text-xl font-extrabold text-[#111] dark:text-white flex items-center gap-2">
                      <Music className="w-5.5 h-5.5 text-orange-500" />
                      Partager une démo sur le Fil d'Actualité
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Une démo percutante multiplie par 5 vos chances d'être repéré par des promoteurs de cabarets chics à Marcory ou Cocody.
                    </p>
                  </div>

                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!newPostCaption) {
                        alert("Veuillez rédiger une description !");
                        return;
                      }

                      // Pre seeded cover image fallback
                      const preseededCovers = [
                        "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=500",
                        "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=500",
                        "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=500"
                      ];
                      const chosenCover = newPostCover.trim() || preseededCovers[Math.floor(Math.random() * preseededCovers.length)];
                      const chosenAudio = newPostAudio.trim() || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3";

                      try {
                        await gomboDB.publishSocialPost({
                          userId: profile.uid,
                          userName: `${profile.firstName} ${profile.lastName}`,
                          userAvatar: profile.avatarUrl,
                          userRole: profile.specialty || "Musicien Professionnel",
                          title: newPostTitle === "social" ? (newPostCaption.substring(0, 18) + "...") : "Acoustique Demo",
                          caption: newPostCaption,
                          beatProd: newPostBeat || "Live Studio Beat",
                          tags: newPostTags ? newPostTags.split(",").map(t => t.trim().startsWith("#") ? t.trim() : "#" + t.trim()) : ["#YAGOMBOMUSIC", "#ShowbizCI"],
                          imageUrl: chosenCover,
                          audioUrl: chosenAudio
                        });
                        alert("Votre démo a bien été diffusée sur le Fil d'actualité musical ! 🚀");
                        setView("home");
                        setCurrentHomeTab("fil");
                        setNewPostTitle("");
                        setNewPostCaption("");
                        setNewPostBeat("");
                        setNewPostTags("");
                      } catch (err) {
                        console.error(err);
                        alert("Impossible de diffuser la démo.");
                      }
                    }}
                    className="space-y-4 text-left"
                  >
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Légende / Message à l'audience</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Ex: Solo de basse improvisé soukous ! Dispo à Yopougon pour cabarets et soirées ce week-end..."
                        value={newPostCaption}
                        onChange={(e) => setNewPostCaption(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-xs focus:outline-none dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Auteur de la Prod (Beatmaker)</label>
                        <input
                          type="text"
                          placeholder="Ex: Acoustique Solo / Prod Kero"
                          value={newPostBeat}
                          onChange={(e) => setNewPostBeat(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-xs focus:outline-none dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Mots clefs / Hashtags (séparés par virgule)</label>
                        <input
                          type="text"
                          placeholder="Ex: Soukous, AfroGombo, Showbiz"
                          value={newPostTags}
                          onChange={(e) => setNewPostTags(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-xs focus:outline-none dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-orange-50/50 dark:bg-amber-950/20 rounded-2xl border border-orange-100 dark:border-orange-950 text-xs text-orange-850 dark:text-orange-400">
                      ℹ️ Par défaut, un lecteur audio de démonstration performant et une pochette d'illustration de scène de haute qualité d'Abidjan seront attachés pour sublimer votre intégration !
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <button
                        type="button"
                        onClick={() => setNewPostTitle("")}
                        className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs transition-all"
                      >
                        Retour
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl text-xs shadow-md transition-all uppercase tracking-wider"
                      >
                        🚀 Diffuser sur le Fil
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          )}

          {/* C. DASHBOARD VIEW (PERSONALIZED DEPENDING ON ROLE) */}
          {view === "dashboard" && (
            !profile ? (
              <ProfileSkeleton />
            ) : (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Dashboards 
                  currentUserProfile={profile}
                  onRefreshProfile={refreshProfile}
                  initialTab={dashboardInitialTab}
                />
              </motion.div>
            )
          )}

          {/* D. COMPLETE PROFILE VIEW */}
          {view === "complete_profile" && (
            !profile ? (
              <ProfileSkeleton />
            ) : (
              <motion.div
                key="complete_profile"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <CompleteProfile
                  currentUserProfile={profile}
                  onComplete={async () => {
                    await refreshProfile();
                    // once complete, redirect to home or edit profile center
                    setView("home");
                    alert("Profil completé avec succès ! Bienvenue au showbiz ya gombo music.");
                  }}
                />
              </motion.div>
            )
          )}

          {/* E. PREMIUM DETAILED PROFILE CONTROL CENTER */}
          {view === "profile_edit" && (
            !profile ? (
              <ProfileSkeleton />
            ) : (
              <motion.div
                key="profile_edit"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <GomboProfile
                  currentUserProfile={profile}
                  onRefreshProfile={refreshProfile}
                  onNavigateView={(targetView, initialTab) => {
                    setView(targetView);
                    if (initialTab) {
                      setDashboardInitialTab(initialTab);
                    }
                  }}
                  onLogout={async () => {
                    await doLogout();
                    setView("home");
                  }}
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                />
              </motion.div>
            )
          )}

          {/* E. COMING SOON PATHS & NEW PREMIUM CORNERS */}
          {view === "notifications" && (
            profile ? (
              <motion.div
                key="notifications_page"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <NotificationCenter
                  currentUserProfile={profile}
                  notifications={notifications}
                  onRefreshProfile={refreshProfile}
                  onNavigateHome={() => setView("home")}
                />
              </motion.div>
            ) : (
              <motion.div
                key="notifications_auth"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-md mx-auto py-20 px-4 text-center"
              >
                <div className="bg-white dark:bg-[#1e1e24] border border-gray-150 dark:border-gray-800 rounded-3xl p-8 shadow-sm">
                  <Lock className="w-12 h-12 mx-auto text-purple-600 mb-4 animate-bounce" />
                  <h3 className="text-lg font-black uppercase text-gray-900 dark:text-white">Connexion Requise</h3>
                  <p className="text-xs text-gray-550 dark:text-gray-400 mt-2">
                    Veuillez vous connecter pour accéder à votre centre de notifications privées en temps réel.
                  </p>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="mt-6 w-full py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs uppercase rounded-xl shadow-md cursor-pointer transition-all"
                  >
                    Se connecter / S’inscrire
                  </button>
                </div>
              </motion.div>
            )
          )}

          {view === "activity" && (
            <motion.div
              key="activity_page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <ActivityFeedView
                currentUserProfile={profile}
                onNavigateView={(targetView) => setView(targetView)}
              />
            </motion.div>
          )}

          {view === "certification" && (
            <motion.div
              key="certification"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <CertificationHub
                currentUserProfile={profile}
                onRefreshProfile={refreshProfile}
                onShowAuth={() => setShowAuthModal(true)}
                onNavigateView={(targetView) => setView(targetView)}
              />
            </motion.div>
          )}

          {view === "groupe" && (
            <motion.div
              key="groupe"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <GroupeVIPAnnuaire
                currentUserProfile={profile}
                onRefreshProfile={refreshProfile}
                onShowAuth={() => setShowAuthModal(true)}
              />
            </motion.div>
          )}

          {view === "annuaire" && (
            <motion.div
              key="annuaire"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <AnnuaireTalents
                currentUserProfile={profile}
                onNavigateView={(v) => navigateTo(v)}
                selectedTalentUid={selectedTalentUid || undefined}
                onSelectTalent={(uid) => {
                  setSelectedTalentUid(uid);
                  if (uid) {
                    window.history.pushState(null, "", `/talent/${uid}`);
                  } else {
                    window.history.pushState(null, "", "/");
                  }
                }}
              />
            </motion.div>
          )}

          {["marche"].includes(view) && (
            <motion.div
              key={view}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ComingSoon
                featureId={view as any}
                onBack={() => setView("home")}
              />
            </motion.div>
          )}

          {/* F. CLEAN 404 FALLBACK ROUTE */}
          {!["home", "gombo_list", "publish", "dashboard", "complete_profile", "profile_edit", "annuaire", "groupe", "marche", "certification", "renfort_express"].includes(view) && (
            <motion.div
              key="404"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-xl mx-auto text-center py-20 px-4 space-y-6"
            >
              <div className="w-20 h-20 bg-red-50 dark:bg-rose-950/20 text-red-500 rounded-3xl flex items-center justify-center mx-auto text-4xl shadow-inner">
                ⚠️
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Oups ! Erreur Gombo 404</h2>
                <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                  Cette partie de la scène est pour le moment introuvable ou en cours de répétition à Cocody.
                </p>
              </div>
              <button
                onClick={() => setView("home")}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl text-xs shadow-md transition-all uppercase tracking-wider"
              >
                Retourner sur le Fil 🇨🇮
              </button>
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* --- FOOTER DESIGNS --- */}
      <footer className="bg-white dark:bg-[#151518] border-t border-gray-100 dark:border-gray-800 transition-colors py-12 mt-12 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 font-sans">
          <div className="flex justify-center items-center gap-2">
            <Flame className="w-5 h-5 text-[#7C3AED] fill-current" />
            <span className="font-extrabold text-xs text-gray-900 dark:text-white tracking-widest uppercase">Y’A GOMBO MUSIC 🇨🇮</span>
          </div>
          <p className="max-w-md mx-auto leading-relaxed text-[11px] text-gray-500 dark:text-gray-400">
            La plateforme d'Abidjan pour accélérer et sécuriser les contrats musicaux, facilitée par les transferts instantanés Wave & Orange Money.
          </p>
          
          {/* Legal navigation links */}
          <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-[10px] font-extrabold uppercase tracking-widest text-[#7C3AED] dark:text-[#A78BFA] pt-2 border-t border-gray-50 dark:border-gray-800 max-w-sm mx-auto">
            <button onClick={() => navigateTo("privacy")} className="hover:underline hover:text-purple-700 dark:hover:text-purple-300 cursor-pointer">Confidentialité</button>
            <span className="text-gray-200 dark:text-gray-800">•</span>
            <button onClick={() => navigateTo("terms")} className="hover:underline hover:text-purple-700 dark:hover:text-purple-300 cursor-pointer">Conditions (CGU)</button>
            <span className="text-gray-200 dark:text-gray-800">•</span>
            <button onClick={() => navigateTo("delete-account")} className="hover:underline hover:text-rose-500 text-rose-600 dark:text-rose-450 cursor-pointer">Supprimer Compte</button>
          </div>

          <p className="text-[10px] text-gray-400 dark:text-gray-600 pt-1">
            © 2026 Y’A GOMBO MUSIC Corp. Tous droits réservés. Développé pour le showbiz ivoirien.
          </p>
        </div>
      </footer>

      {/* --- AUTHENTICATION DIALOG POPUP --- */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="absolute inset-0" onClick={() => setShowAuthModal(false)}></div>
            <div className="relative z-10 w-full max-w-xl">
              {/* Close corner control */}
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-950 dark:hover:text-white rounded-full bg-gray-50 dark:bg-gray-800"
              >
                <X className="w-4.5 h-4.5" />
              </button>
              <AuthScreen
                onSuccess={() => {
                  setShowAuthModal(false);
                  refreshProfile();
                  // Re-evaluate or load homepage (automatically handled by the active real-time snapshot listeners)
                }}
                onClose={() => setShowAuthModal(false)}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CANDIDATURE FORM MODAL --- */}
      <AnimatePresence>
        {applyGombo && profile && (
          <GomboApply
            gombo={applyGombo}
            currentUserProfile={profile}
            onSuccess={() => {
              setApplyGombo(null);
              alert("Votre candidature a bien été envoyée au recruteur ! Retrouvez-la dans votre Dashboard.");
              setView("dashboard");
            }}
            onCancel={() => setApplyGombo(null)}
          />
        )}
      </AnimatePresence>

      {/* --- MOBILE BOTTOM NAVIGATION BAR (Y’A GOMBO MUSIC REQUIRED) --- */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-t border-gray-150 dark:border-gray-800/80 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-5px_20px_rgba(0,0,0,0.3)] flex items-center justify-around h-16 pb-safe px-2 transition-colors">
        {/* Item 1: Le Terrain */}
        <button
          onClick={() => setView("home")}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            view === "home" ? "text-[#7C3AED] font-black" : "text-gray-400 dark:text-gray-500"
          }`}
        >
          <Flame className="w-5 h-5 fill-current" />
          <span className="text-[9px] font-bold tracking-tight mt-1">Le Terrain</span>
        </button>

        {/* Item 2: Les Vibes */}
        <button
          onClick={() => setView("gombo_list")}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            view === "gombo_list" ? "text-[#7C3AED] font-black" : "text-gray-400 dark:text-gray-500"
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-tight mt-1">Les Vibes</span>
        </button>

        {/* Item 3: Lancer Gombo Selector (Big Floating Orange Circle) */}
        <div className="relative -mt-6">
          <button
            onClick={() => handleProtectedAction("publish")}
            className="w-13 h-13 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform border-4 border-white dark:border-[#0F172A]"
            title="Lancer Gombo"
          >
            <Plus className="w-6 h-6 stroke-[3px]" />
          </button>
        </div>

        {/* Item 4: Renfort Express */}
        <button
          onClick={() => setView("renfort_express")}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            view === "renfort_express" ? "text-orange-500 font-extrabold" : "text-gray-400 dark:text-gray-500"
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-tight mt-1">Renfort</span>
        </button>

        {/* Item 5: Mon Coin */}
        <button
          onClick={() => handleProtectedAction("profile_edit")}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            view === "profile_edit" ? "text-[#7C3AED] font-black" : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="w-5.5 h-5.5 rounded-full object-cover border border-[#7C3AED]" />
          ) : (
            <User className="w-5.5 h-5.5" />
          )}
          <span className="text-[9px] font-bold tracking-tight mt-1">Mon Coin</span>
        </button>
      </div>

      {/* --- SETTINGS MODAL DIALOG --- */}
      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        onLogout={handleLogout}
      />

      {/* --- IMMERSIVE CUSTOM LOGOUT DIALOG --- */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Dark glass backdrop with high blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-[#020617]/85 backdrop-blur-md"
            />
            
            {/* Elegant luxury card container */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="relative w-full max-w-sm bg-gradient-to-b from-[#0F172A]/95 to-[#020617]/98 border border-[#D4A373]/30 px-6 py-8 rounded-3xl shadow-2xl overflow-hidden text-center z-10"
            >
              {/* Subtle gold back glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-[#D4A373]/15 rounded-full blur-2xl pointer-events-none" />
              
              <div className="inline-flex items-center justify-center p-3.5 bg-red-500/15 text-red-400 rounded-2xl mb-4 border border-red-500/25 shadow-lg">
                <LogOut className="w-6 h-6" />
              </div>
              
              <h3 className="text-lg font-black text-slate-100 tracking-wide uppercase font-sans">
                Se Déconnecter ?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mt-2.5 px-2">
                Êtes-vous sûr de vouloir vous déconnecter de <span className="text-[#D4A373] font-bold">Y’A GOMBO MUSIC</span> ? Votre session sera fermée en toute sécurité.
              </p>
              
              <div className="grid grid-cols-2 gap-3 mt-7">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="py-3 px-4 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl font-bold text-xs transition-colors active:scale-97 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="py-3 px-4 bg-gradient-to-r from-red-650 to-rose-700 hover:from-red-700 hover:to-rose-800 text-slate-50 font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-md shadow-red-950/25 active:scale-97 cursor-pointer"
                >
                  Déconnexion
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
