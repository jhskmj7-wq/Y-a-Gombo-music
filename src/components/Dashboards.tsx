import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Briefcase, Check, X, Phone, UserCheck, Flame, Trash2, 
  MapPin, Clock, Calendar, Users, Shield, Sparkles, Star, Award, Search, Info,
  Heart, MessageCircle, Activity, ChevronDown, PlusCircle, ArrowUpRight, Music
} from "lucide-react";
import { gomboDB, isFirebaseMock } from "../firebase";
import { UserProfile, Gombo, Application, Reservation, Renfort, RenfortApplication, MusicGroup, ActivityFeedEntry } from "../types";

interface DashboardsProps {
  currentUserProfile: UserProfile;
  onRefreshProfile: () => void;
  initialTab?: string;
  onBackToAdmin?: () => void;
}

export default function Dashboards({ currentUserProfile, onRefreshProfile, initialTab, onBackToAdmin }: DashboardsProps) {
  const [activeTab, setActiveTab] = useState<
    "applications" | "gombos" | "renfort_express" | "favoris" | "groupes" | "historique" | "reservations" | "admin" | "waiting"
  >(() => {
    if (initialTab && ["applications", "gombos", "renfort_express", "favoris", "groupes", "historique", "reservations", "admin", "waiting"].includes(initialTab)) {
      return initialTab as any;
    }
    return "applications";
  });

  useEffect(() => {
    if (initialTab && ["applications", "gombos", "renfort_express", "favoris", "groupes", "historique", "reservations", "admin", "waiting"].includes(initialTab)) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeTab]);
  
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
  
  // Base Data States
  const [myGombos, setMyGombos] = useState<Gombo[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [receivedApplications, setReceivedApplications] = useState<Application[]>([]);

  // Admin states
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allGombosList, setAllGombosList] = useState<Gombo[]>([]);
  const [waitingAnalytics, setWaitingAnalytics] = useState<any[]>([]);

  // Bento state resources
  const [myRenforts, setMyRenforts] = useState<Renfort[]>([]);
  const [myRenfortApps, setMyRenfortApps] = useState<RenfortApplication[]>([]);
  const [favoriteTalents, setFavoriteTalents] = useState<UserProfile[]>([]);
  const [myGroups, setMyGroups] = useState<MusicGroup[]>([]);
  const [myActivities, setMyActivities] = useState<ActivityFeedEntry[]>([]);

  const [loading, setLoading] = useState(true);

  // Load Bento Additional Resources
  const loadBentoExtraResources = async () => {
    try {
      // 1. Load Favorite Talents from localStorage
      const savedFavs = localStorage.getItem("favorite_talents_list") || "[]";
      const favIds: string[] = JSON.parse(savedFavs);
      const fetchedAllUsers = await gomboDB.getAllUsers();
      if (favIds.length > 0) {
        setFavoriteTalents(fetchedAllUsers.filter(u => favIds.includes(u.uid)));
      } else {
        setFavoriteTalents([]);
      }
    } catch (e) {
      console.warn("⚠️ Error loading custom favorites list for dashboard Bento", e);
    }
  };

  useEffect(() => {
    setLoading(true);
    let unsubGombos: (() => void) | null = null;
    let unsubApps: (() => void) | null = null;
    let unsubRenfor: (() => void) | null = null;
    let unsubRenforApp: (() => void) | null = null;
    let unsubGroupsList: (() => void) | null = null;
    let unsubActFeed: (() => void) | null = null;

    const initDashboardSync = async () => {
      try {
        const reservations = await gomboDB.getReservations();
        const userUid = currentUserProfile.uid;

        // Load local favorites
        loadBentoExtraResources();

        // 1. Live Gombos
        unsubGombos = gomboDB.listenAllGombos((gombos) => {
          // 2. Live Applications
          unsubApps = gomboDB.listenApplications(async (applications) => {
            console.log("⚡ [Dashboard Sync] Live update triggered. Gombos:", gombos.length, "Apps:", applications.length);
            
            if (currentUserProfile.role === "client") {
              const clientGombos = gombos.filter(g => g.clientId === userUid);
              setMyGombos(clientGombos);

              const clientGomboIDs = clientGombos.map(g => g.id);
              const appsReceived = applications.filter(app => clientGomboIDs.includes(app.gomboId));
              setReceivedApplications(appsReceived);

              const clientReservations = reservations.filter(r => r.clientId === userUid);
              setMyReservations(clientReservations);
            } else if (currentUserProfile.role === "musicien") {
              const musicianApps = applications.filter(app => app.musicianId === userUid);
              setMyApplications(musicianApps);

              const musicianReservations = reservations.filter(r => r.musicianId === userUid);
              setMyReservations(musicianReservations);
            }

            if (currentUserProfile.role === "admin") {
              const users = await gomboDB.getAllUsers();
              setAllUsers(users);
              setAllGombosList(gombos);
              const waitings = await gomboDB.getWaitingFeaturesCount();
              setWaitingAnalytics(waitings);
              setActiveTab("admin");
            }
          });
        });

        // 3. Live Renforts
        unsubRenfor = gomboDB.listenAllRenforts((allRenfortsList) => {
          const userRenforts = allRenfortsList.filter(r => r.userId === userUid);
          setMyRenforts(userRenforts);
        });

        unsubRenforApp = gomboDB.listenRenfortApplications((allApps) => {
          const userApps = allApps.filter(app => app.musicianId === userUid);
          setMyRenfortApps(userApps);
        });

        // 4. Live Groups
        unsubGroupsList = gomboDB.listenAllMusicGroups((allGroupsList) => {
          const userGroupsList = allGroupsList.filter(g => 
            g.creatorId === userUid || 
            (g.followers && g.followers.includes(userUid)) || 
            (g.members && g.members.some(m => m.id === userUid))
          );
          setMyGroups(userGroupsList);
        });

        // 5. Live Activity Logs
        unsubActFeed = gomboDB.listenToActivityFeed((allActs) => {
          const userActs = allActs.filter(act => 
            act.userId === userUid || 
            act.message.includes(currentUserProfile.firstName) || 
            act.message.includes(currentUserProfile.lastName) ||
            JSON.stringify(act).includes(userUid)
          ).slice(0, 25);
          setMyActivities(userActs);
        });

        setLoading(false);
      } catch (err) {
        console.error("❌ [Dashboard Live Sync] Listener Error:", err);
        setLoading(false);
      }
    };

    initDashboardSync();

    // Favorites changed window trigger
    const handleFavsChanged = () => {
      loadBentoExtraResources();
    };
    window.addEventListener("storage", handleFavsChanged);
    window.addEventListener("gomboUserProfileChange", handleFavsChanged);

    return () => {
      if (unsubGombos) unsubGombos();
      if (unsubApps) unsubApps();
      if (unsubRenfor) unsubRenfor();
      if (unsubRenforApp) unsubRenforApp();
      if (unsubGroupsList) unsubGroupsList();
      if (unsubActFeed) unsubActFeed();
      window.removeEventListener("storage", handleFavsChanged);
      window.removeEventListener("gomboUserProfileChange", handleFavsChanged);
    };
  }, [currentUserProfile?.uid]);

  // Client accepts musician application
  const handleAcceptCandidacy = async (app: Application) => {
    if (!window.confirm(`Confirmer la réservation du gombo avec ${app.musicianName} ?`)) return;
    
    setLoading(true);
    try {
      const gombos = await gomboDB.getAllGombos();
      const targetGombo = gombos.find(g => g.id === app.gomboId);
      if (!targetGombo) throw new Error("Gombo introuvable !");

      await gomboDB.updateApplicationStatus(app.id, "accepte");

      try {
        await gomboDB.sendNotification({
          userId: app.musicianId,
          title: "Candidature Acceptée ! 🎉",
          message: `Votre candidature pour le gombo "${app.gomboTitle}" a été acceptée par le client. Vous pouvez maintenant démarrer !`,
          type: "application_accepted"
        });
      } catch (notifErr) {
        console.warn("⚠️ Notification could not be sent:", notifErr);
      }

      if (targetGombo.musiciansCount === 1) {
        const matchingApps = receivedApplications.filter(a => a.gomboId === app.gomboId && a.id !== app.id);
        for (const otherApp of matchingApps) {
          await gomboDB.updateApplicationStatus(otherApp.id, "refuse");
          try {
            await gomboDB.sendNotification({
              userId: otherApp.musicianId,
              title: "Candidature Refusée ❌",
              message: `Désolé, votre candidature pour le gombo "${otherApp.gomboTitle}" n'a pas été retenue. Courage, de nouveaux plans arrivent !`,
              type: "general"
            });
          } catch (notifErr) {
            console.warn("⚠️ Notification could not be sent:", notifErr);
          }
        }
      }

      await gomboDB.confirmBooking({
        gomboId: app.gomboId,
        gomboTitle: app.gomboTitle,
        clientId: currentUserProfile.uid,
        musicianId: app.musicianId,
        musicianName: app.musicianName,
        musicianPhone: app.musicianPhone,
        amount: targetGombo.budget
      });

      alert(`Performance validée ! Les détails de contact de ${app.musicianName} sont désormais disponibles.`);
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de l'enregistrement de l'accord.");
    } finally {
      setLoading(false);
    }
  };

  // Client rejects application
  const handleRejectCandidacy = async (app: Application) => {
    if (!window.confirm("Désapprouver cette candidature ?")) return;
    setLoading(true);
    try {
      await gomboDB.updateApplicationStatus(app.id, "refuse");
      try {
        await gomboDB.sendNotification({
          userId: app.musicianId,
          title: "Candidature Refusée ❌",
          message: `Désolé, votre candidature pour le gombo "${app.gomboTitle}" n'a pas été retenue. Ne vous découragez pas, d'autres plans arrivent !`,
          type: "general"
        });
      } catch (notifErr) {
        console.warn("⚠️ Notification could not be sent:", notifErr);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Admin Actions
  const handleAdminDeleteUser = async (uid: string) => {
    if (!window.confirm("Voulez-vous supprimer définitivement ce compte ? Action irréversible.")) return;
    try {
      await gomboDB.deleteUserProfile(uid);
      alert("Compte supprimé avec succès.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminDeleteGombo = async (gomboId: string) => {
    if (!window.confirm("Voulez-vous supprimer définitivement cette annonce ?")) return;
    try {
      await gomboDB.deleteGombo(gomboId);
      alert("Annonce supprimée avec succès.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnfavorite = (talentUid: string) => {
    try {
      const savedFavs = localStorage.getItem("favorite_talents_list") || "[]";
      let favIds: string[] = JSON.parse(savedFavs);
      favIds = favIds.filter(id => id !== talentUid);
      localStorage.setItem("favorite_talents_list", JSON.stringify(favIds));
      setFavoriteTalents(favoriteTalents.filter(u => u.uid !== talentUid));
      // Dispatch profile sync to keep in step
      window.dispatchEvent(new Event("gomboUserProfileChange"));
    } catch (e) {
      console.error(e);
    }
  };

  // Computed counters
  const candidaturesCount = currentUserProfile.role === "client" ? receivedApplications.length : myApplications.length;
  const opportunitesCount = myGombos.length;
  const renfortExpressCount = myRenforts.length + myRenfortApps.length;
  const favorisCount = favoriteTalents.length;
  const groupesCount = myGroups.length;
  const historiqueCount = myActivities.length;

  return (
    <div className="space-y-6 text-left">
      {/* Overview Greeting Header Bar */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,50 Q25,70 50,50 T100,50 L100,100 L0,100 Z" fill="white" />
          </svg>
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-orange-700/50 rounded-full text-xs font-bold uppercase tracking-wider">
                Espace {currentUserProfile.role === "admin" ? "Administrateur" : currentUserProfile.role === "client" ? "Club / Boss" : "Artiste"}
              </span>
              {mockMode && (
                <span className="px-2.5 py-0.5 bg-yellow-400 text-black text-[10px] font-extrabold uppercase rounded-full">
                  Mode Démo
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black mt-2">
              Akwaba, {currentUserProfile.firstName} {currentUserProfile.lastName} !
            </h1>
            <p className="text-orange-100 text-xs mt-1">
              Pilotez tous vos contrats musicaux, vos bookings directs et vos renforts en un coup d'œil.
            </p>
          </div>
          <div className="flex gap-4 items-center">
            {onBackToAdmin && ["johnsylvesterh@gmail.com", "sylvestrehounkpevi777@gmail.com", "jhs.kmj7@gmail.com"].includes((currentUserProfile.email || "").toLowerCase()) && (
              <button
                onClick={onBackToAdmin}
                className="px-3 py-2 bg-black/40 hover:bg-black/60 border border-[#D4AF37]/35 hover:border-[#D4AF37] text-[#D4AF37] hover:text-white text-[10px] font-black uppercase rounded-xl tracking-wider transition-all cursor-pointer"
              >
                👑 COCKPIT ADMIN
              </button>
            )}
            <div className="text-right">
              <p className="text-[10px] text-orange-100 uppercase font-bold tracking-widest">Solde des contrats</p>
              <p className="text-2xl font-black font-mono">
                {myReservations.reduce((sum, r) => sum + r.amount, 0).toLocaleString()} FCFA
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* REVOLUTIONARY BENTO BOX INTERACTIVE COUNTING NAVIGATION GRID */}
      <div>
        <p className="text-[11px] uppercase font-black text-[#D4AF37] tracking-widest mb-3 flex items-center gap-2">
          <span>💼</span> Mes Gombos — Tableau de bord
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Card 1: Mes Candidatures */}
          <button
            onClick={() => setActiveTab("applications")}
            className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between overflow-hidden cursor-pointer ${
              activeTab === "applications"
                ? "bg-[#D4AF37]/10 border-[#D4AF37] shadow-md scale-102"
                : "bg-white dark:bg-[#111113] border-gray-100 dark:border-gray-800 hover:border-[#D4AF37]/50"
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <span className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                <Briefcase className="w-5 h-5" />
              </span>
              <span className="text-2xl font-black font-mono tracking-tight text-gray-900 dark:text-white">
                {candidaturesCount}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-black text-gray-900 dark:text-white truncate">Candidatures</p>
              <p className="text-[9.5px] text-gray-400 mt-0.5 truncate">
                {currentUserProfile.role === "client" ? "Candidats reçus" : "Prestations postulées"}
              </p>
            </div>
          </button>

          {/* Card 2: Mes opportunites */}
          <button
            onClick={() => setActiveTab("gombos")}
            className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between overflow-hidden cursor-pointer ${
              activeTab === "gombos"
                ? "bg-[#D4AF37]/10 border-[#D4AF37] shadow-md scale-102"
                : "bg-white dark:bg-[#111113] border-gray-100 dark:border-gray-800 hover:border-[#D4AF37]/50"
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <span className="p-2 bg-orange-500/10 text-[#FF7A00] rounded-lg">
                <Flame className="w-5 h-5" />
              </span>
              <span className="text-2xl font-black font-mono tracking-tight text-gray-900 dark:text-white">
                {opportunitesCount}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-black text-gray-900 dark:text-white truncate">Mes Opportunités</p>
              <p className="text-[9.5px] text-gray-400 mt-0.5 truncate">Plans de scène publiés</p>
            </div>
          </button>

          {/* Card 3: Mes Renfort Express */}
          <button
            onClick={() => setActiveTab("renfort_express")}
            className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between overflow-hidden cursor-pointer ${
              activeTab === "renfort_express"
                ? "bg-[#D4AF37]/10 border-[#D4AF37] shadow-md scale-102"
                : "bg-white dark:bg-[#111113] border-gray-100 dark:border-gray-800 hover:border-[#D4AF37]/50"
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <span className="p-2 bg-blue-500/10 text-cyan-500 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </span>
              <span className="text-2xl font-black font-mono tracking-tight text-gray-900 dark:text-white">
                {renfortExpressCount}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-black text-gray-900 dark:text-white truncate">Renfort Express</p>
              <p className="text-[9.5px] text-gray-400 mt-0.5 truncate">Remplacements urgents</p>
            </div>
          </button>

          {/* Card 4: Mes Favoris */}
          <button
            onClick={() => setActiveTab("favoris")}
            className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between overflow-hidden cursor-pointer ${
              activeTab === "favoris"
                ? "bg-[#D4AF37]/10 border-[#D4AF37] shadow-md scale-102"
                : "bg-white dark:bg-[#111113] border-gray-100 dark:border-gray-800 hover:border-[#D4AF37]/50"
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <span className="p-2 bg-red-500/10 text-red-505 rounded-lg">
                <Heart className="w-5 h-5 fill-current" />
              </span>
              <span className="text-2xl font-black font-mono tracking-tight text-gray-900 dark:text-white">
                {favorisCount}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-black text-gray-900 dark:text-white truncate">Favoris</p>
              <p className="text-[9.5px] text-gray-400 mt-0.5 truncate">Talents du showbiz sauvés</p>
            </div>
          </button>

          {/* Card 5: Mes Groupes */}
          <button
            onClick={() => setActiveTab("groupes")}
            className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between overflow-hidden cursor-pointer ${
              activeTab === "groupes"
                ? "bg-[#D4AF37]/10 border-[#D4AF37] shadow-md scale-102"
                : "bg-white dark:bg-[#111113] border-gray-100 dark:border-gray-800 hover:border-[#D4AF37]/50"
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <span className="p-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg">
                <Music className="w-5 h-5" />
              </span>
              <span className="text-2xl font-black font-mono tracking-tight text-gray-900 dark:text-white">
                {groupesCount}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-black text-gray-900 dark:text-white truncate">Mes Groupes</p>
              <p className="text-[9.5px] text-gray-400 mt-0.5 truncate">Groupes & Orchestres VIP</p>
            </div>
          </button>

          {/* Card 6: Mon Historique */}
          <button
            onClick={() => setActiveTab("historique")}
            className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between overflow-hidden cursor-pointer ${
              activeTab === "historique"
                ? "bg-[#D4AF37]/10 border-[#D4AF37] shadow-md scale-102"
                : "bg-white dark:bg-[#111113] border-gray-100 dark:border-gray-800 hover:border-[#D4AF37]/50"
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <span className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <Activity className="w-5 h-5" />
              </span>
              <span className="text-2xl font-black font-mono tracking-tight text-gray-900 dark:text-white">
                {historiqueCount}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-black text-gray-900 dark:text-white truncate">Historique</p>
              <p className="text-[9.5px] text-gray-400 mt-0.5 truncate">Journal d'activités</p>
            </div>
          </button>
        </div>

        {/* Traditional secondary tabs for client reservations or general admin */}
        <div className="flex gap-2.5 mt-4 border-b border-gray-100 dark:border-gray-850 pb-2">
          <button
            onClick={() => setActiveTab("reservations")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "reservations"
                ? "bg-emerald-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-950 dark:hover:text-white"
            }`}
          >
            🏆 Réservations Effectives ({myReservations.length})
          </button>

          {currentUserProfile.role === "admin" && (
            <>
              <button
                onClick={() => setActiveTab("admin")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "admin"
                    ? "bg-rose-650 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-rose-500 hover:bg-rose-50"
                }`}
              >
                🛡️ Gérer les Comptes ({allUsers.length})
              </button>
              <button
                onClick={() => setActiveTab("waiting")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "waiting"
                    ? "bg-amber-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-amber-500 hover:bg-amber-50"
                }`}
              >
                ⏳ Listes d'Attente ({waitingAnalytics.length})
              </button>
            </>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-3 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* SUBVIEWS CONTENT RENDERING */}
      {!loading && (
        <div className="space-y-4 pt-1 animate-fadeIn">
          
          {/* 1. APPLICATIONS PANEL (Sent or Received) */}
          {activeTab === "applications" && (
            <div className="space-y-4">
              <h3 className="text-base font-black text-gray-950 dark:text-white flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800 pb-2.5">
                <span>📂</span> Mes dossiers de candidatures ({candidaturesCount})
              </h3>
              
              {/* If Musician */}
              {currentUserProfile.role === "musicien" && (
                myApplications.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-[#111113] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <Briefcase className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-500">Aucun dossier de candidature envoyé pour le moment.</p>
                    <p className="text-xs text-gray-400 mt-1">Parcourez Le Terrain pour postuler aux offres de cachets disponibles.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myApplications.map((app) => (
                      <div key={app.id} className="bg-white dark:bg-[#141416] p-5.5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs relative flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-4 mb-2.5">
                            <div>
                              <h4 className="font-extrabold text-[#111] dark:text-white text-base leading-tight">{app.gomboTitle}</h4>
                              <p className="text-[10px] text-gray-405 font-bold mt-1 uppercase">Dossier n° {app.id.slice(0,8)}</p>
                            </div>
                            <span className={`text-[10.5px] font-black px-3 py-1 rounded-full ${
                              app.status === "en_attente" 
                                ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20" 
                                : app.status === "accepte" 
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" 
                                : "bg-red-50 text-red-500 dark:bg-red-955/20"
                            }`}>
                              {app.status === "en_attente" ? "⏳ En attente de validation..." : app.status === "accepte" ? "🎉 Accepté !" : "❌ Refusé"}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-50 dark:border-gray-800/60 pt-3">
                            <p>🎸 Spécialité : <strong className="text-gray-900 dark:text-gray-200">{app.musicianSpecialty || "Instrumentiste"}</strong></p>
                            <p>📅 Disponibilité : <strong className="text-gray-900 dark:text-gray-200">{app.disponibilite || "Totalement disponible"}</strong></p>
                            <blockquote className="italic border-l-2 border-[#D4AF37] pl-3.5 text-gray-400 dark:text-gray-500 py-1.5 mt-3 bg-gray-50/50 dark:bg-gray-900/10 rounded-r-xl">
                              "{app.message || "Aucune note additionnelle."}"
                            </blockquote>
                          </div>
                        </div>

                        {app.status === "accepte" && (
                          <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-400 rounded-2xl text-xs space-y-1.5">
                            <p className="font-black">✓ Prestation accordée ! Le client a débloqué votre contact.</p>
                            <p>Coordonnées du client disponibles. Appelez au 05... ou préparez vos partitions avec le recruteur direct.</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* If Client */}
              {currentUserProfile.role === "client" && (
                receivedApplications.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-[#111113] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <Users className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-500">Aucune candidature reçue pour vos offres pour l'instant.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {receivedApplications.map((app) => {
                      const waPhone = app.whatsapp || app.musicianPhone || "";
                      const cleanDigits = waPhone.replace(/\D/g, "");
                      let normalizedPhone = cleanDigits;
                      if (normalizedPhone.startsWith("0") && normalizedPhone.length === 10) normalizedPhone = "225" + normalizedPhone;
                      const waText = `Bonjour ${app.musicianName}, j'ai reçu votre demande sur AFRIGOMBO pour le plan "${app.gomboTitle}".`;
                      const waLink = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(waText)}`;

                      return (
                        <div key={app.id} className="bg-white dark:bg-[#141416] p-5.5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex items-center gap-3">
                              <img 
                                src={app.musicianAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
                                alt="" 
                                className="w-11 h-11 rounded-full object-cover border-2 border-[#D4AF37]" 
                              />
                              <div>
                                <h4 className="font-black text-gray-950 dark:text-white text-base leading-snug">{app.musicianName}</h4>
                                <p className="text-xs text-purple-600 dark:text-purple-400 font-bold">{app.gomboTitle}</p>
                              </div>
                            </div>
                            <span className={`text-[10.5px] font-extrabold px-3 py-1 rounded-full ${
                              app.status === "en_attente" ? "bg-amber-50 text-amber-600" : app.status === "accepte" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-550"
                            }`}>
                              {app.status === "en_attente" ? "En attente" : app.status === "accepte" ? "Retenu" : "Refusé"}
                            </span>
                          </div>

                          <div className="mt-4 p-4 bg-gray-50/50 dark:bg-gray-900/10 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300 space-y-2">
                            <p>🎹 Instrument : <strong className="text-gray-900 dark:text-white">{app.musicianSpecialty || "Musicien"}</strong></p>
                            <p>📅 Disponibilité : <strong className="text-gray-900 dark:text-white">{app.disponibilite || "Ok"}</strong></p>
                            <p className="italic bg-white/50 dark:bg-black/10 p-2 rounded-lg border border-gray-100/40">💬 "{app.message}"</p>
                          </div>

                          {/* Action panel */}
                          <div className="flex items-center justify-end gap-3.5 mt-4 pt-3.5 border-t border-gray-100 dark:border-gray-850">
                            {waPhone && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                              >
                                <Phone className="w-3.5 h-3.5 fill-current" /> WhatsApp
                              </a>
                            )}
                            
                            {app.status === "en_attente" && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRejectCandidacy(app)}
                                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-500 dark:bg-gray-800 dark:hover:bg-gray-750 font-bold rounded-xl text-xs"
                                >
                                  Refuser
                                </button>
                                <button
                                  onClick={() => handleAcceptCandidacy(app)}
                                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-[#D4AF37] text-white font-bold rounded-xl text-xs"
                                >
                                  Retenir ce talent !
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          )}

          {/* 2. MES OPPORTUNITES OPPORTUNITES (Gombos posted) */}
          {activeTab === "gombos" && (
            <div className="space-y-4">
              <h3 className="text-base font-black text-gray-950 dark:text-white flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800 pb-2.5">
                <span>🔥</span> Mes publications de plans scéniques ({myGombos.length})
              </h3>

              {myGombos.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-[#111113] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <Briefcase className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-500">Vous n'avez publié aucun contrat live de musique.</p>
                  <p className="text-xs text-gray-400 mt-1">Utilisez l'option ➕ Publier pour poster un gombo et recruter le meilleur orchestre d'Abidjan.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myGombos.map((gombo) => (
                    <div key={gombo.id} className="bg-white dark:bg-[#141416] p-5.5 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-sm relative flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-4 mb-2.5">
                          <span className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full ${
                            gombo.status === "publie" 
                              ? "bg-orange-50 text-orange-600 border border-orange-200" 
                              : "bg-emerald-50 text-emerald-600"
                          }`}>
                            {gombo.status === "publie" ? "En Ligne" : "Complet / Sélection terminé"}
                          </span>
                          <span className="font-mono text-sm font-black text-[#D4AF37]">{gombo.budget.toLocaleString()} FCFA</span>
                        </div>

                        <h4 className="font-black text-gray-900 dark:text-white leading-tight text-base mb-1.5">{gombo.title}</h4>
                        <p className="text-xs text-gray-450 dark:text-gray-500 line-clamp-3 leading-relaxed mb-4">{gombo.description}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-450 border-t border-gray-50 dark:border-gray-800/60 pt-3">
                          <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#D4AF37]" /> {gombo.commune}</div>
                          <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#D4AF37]" /> {gombo.date}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. RENFORT EXPRESS PANEL */}
          {activeTab === "renfort_express" && (
            <div className="space-y-4">
              <h3 className="text-base font-black text-gray-950 dark:text-white flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800 pb-2.5">
                <span>🎼</span> Mon Journal Renfort Express ({renfortExpressCount})
              </h3>

              {/* Section 1: Mes publications renfort */}
              <div className="space-y-3">
                <p className="text-xs font-black text-[#D4AF37] uppercase tracking-wider">Planifications urgent créés ({myRenforts.length})</p>
                {myRenforts.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Aucun renfort urgent créé par vous pour l'instant.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {myRenforts.map(rn => (
                      <div key={rn.id} className="p-4 bg-white dark:bg-[#141416] rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] uppercase font-bold text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded-full">{rn.requestType}</span>
                          <span className="text-xs font-extrabold text-[#D4AF37]">{rn.budget.toLocaleString()} FCFA</span>
                        </div>
                        <h5 className="font-extrabold text-sm text-gray-900 dark:text-white">{rn.title}</h5>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{rn.description}</p>
                        <p className="text-[10px] text-gray-500 mt-2">Commune : {rn.commune} • Date : {rn.date}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Mes candidatures renfort */}
              <div className="space-y-3 pt-3">
                <p className="text-xs font-black text-[#D4AF37] uppercase tracking-wider">Mes réponses de disponibilité ({myRenfortApps.length})</p>
                {myRenfortApps.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Vous n'avez répondu disponible à aucun renfort pour le moment.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {myRenfortApps.map(ra => (
                      <div key={ra.id} className="p-4 bg-white dark:bg-[#141416] rounded-2xl border border-gray-155 dark:border-gray-800">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Application n° {ra.id.slice(0,6)}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            ra.status === "accepte" ? "bg-emerald-500/10 text-emerald-500" : ra.status === "refuse" ? "bg-red-500/10 text-red-505" : "bg-amber-500/10 text-amber-500"
                          }`}>
                            {ra.status === "accepte" ? "Accepté ✓" : ra.status === "refuse" ? "Pas retenu" : "⏳ En attente"}
                          </span>
                        </div>
                        <h5 className="font-bold text-sm text-gray-900 dark:text-white">{ra.renfortTitle}</h5>
                        <p className="text-xs text-gray-500 mt-1">Candidat : {ra.musicianName} • Tél : {ra.musicianPhone}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. FAVORIS PANEL */}
          {activeTab === "favoris" && (
            <div className="space-y-4">
              <h3 className="text-base font-black text-gray-950 dark:text-white flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800 pb-2.5">
                <span>❤️</span> Mes talents favoris ({favoriteTalents.length})
              </h3>

              {favoriteTalents.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-[#111113] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <Heart className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-500">Aucun talent favori enregistré.</p>
                  <p className="text-xs text-gray-400 mt-1">Explorez l'Annuaire des Talents et cliquez sur ❤️ pour enregistrer des profils.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {favoriteTalents.map((talent) => {
                    // Pre-filled WhatsApp details
                    const cleanPhone = talent.phone.replace(/\D/g, "");
                    const waLink = `https://wa.me/225${cleanPhone}?text=Bonjour%20${talent.firstName},%20votre%20profil%20sur%20AFRIGOMBO%20m'intéresse.`;

                    return (
                      <div key={talent.uid} className="bg-white dark:bg-[#141416] p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs flex items-start gap-4">
                        <img 
                          src={talent.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
                          alt="" 
                          className="w-13 h-13 rounded-full object-cover border-2 border-[#D4AF37]" 
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight truncate">
                            {talent.artistName || `${talent.firstName} ${talent.lastName}`}
                          </h4>
                          <p className="text-xs text-[#D4AF37] font-bold mt-0.5 truncate">{talent.specialty || "Instrumentiste"}</p>
                          <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {talent.commune || "Abidjan"}</p>

                          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-50 dark:border-gray-850">
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[10px] rounded-lg flex items-center gap-1.5"
                            >
                              <Phone className="w-3 h-3 fill-current" /> Contacter
                            </a>
                            <button
                              onClick={() => handleUnfavorite(talent.uid)}
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100/80 text-red-500 rounded-lg text-[10px] font-extrabold ml-auto"
                              title="Retirer des favoris"
                            >
                              Retirer
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 5. MES GROUPES PANEL */}
          {activeTab === "groupes" && (
            <div className="space-y-4">
              <h3 className="text-base font-black text-gray-950 dark:text-white flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800 pb-2.5">
                <span>🎼</span> Mes Groupes & Orchestres VIP ({myGroups.length})
              </h3>

              {myGroups.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-[#111113] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <Music className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3 animate-pulse" />
                  <p className="text-sm font-bold text-gray-500">Aucun groupe de musique associé à votre session.</p>
                  <p className="text-xs text-gray-400 mt-1">Créez votre propre orchestre VIP ou abonnez-vous à un groupe dans l'onglet Groupes VIP.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myGroups.map(grp => (
                    <div key={grp.id} className="p-5 bg-white dark:bg-[#141416] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs">
                      <div className="flex items-center gap-3">
                        <img 
                          src={grp.logoUrl || grp.photoUrl || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=150"} 
                          alt="" 
                          className="w-12 h-12 rounded-xl object-cover border-2 border-[#D4AF37]" 
                        />
                        <div>
                          <h4 className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight">{grp.name}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">{grp.type} • {grp.commune}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 pt-3.5 border-t border-gray-55 dark:border-gray-850 text-[10px]">
                        {grp.isVerified && <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold">✓ Vérifié</span>}
                        {grp.plan === "vip" && <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">👑 Orchestre VIP</span>}
                        {grp.plan === "premium" && <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">🏆 Premium Gold</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 6. HISTORIQUE PANEL (Personal Activity logs loop) */}
          {activeTab === "historique" && (
            <div className="space-y-4">
              <h3 className="text-base font-black text-gray-950 dark:text-white flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800 pb-2.5">
                <span>📈</span> Mon Journal d'Activités AFRIGOMBO ({myActivities.length})
              </h3>

              {myActivities.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-[#111113] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-500">Aucun journal d'activité enregistré pour vous.</p>
                  <p className="text-xs text-gray-400 mt-1">Vos actions (publications, candidatures, thèmes, favoris) alimenteront ce journal d'audit.</p>
                </div>
              ) : (
                <div className="bg-black/90 text-zinc-300 font-mono text-[11px] p-5 rounded-3xl border border-gray-800 shadow-2xl h-[460px] overflow-y-auto space-y-3.5 leading-relaxed antialiased">
                  <p className="text-yellow-500 font-extrabold border-b border-gray-800 pb-1.5">★ SYSTEM FEED LOGS FOR {currentUserProfile.firstName.toUpperCase()} : REGISTERED</p>
                  {myActivities.map((act) => (
                    <div key={act.id} className="border-b border-zinc-800/40 pb-2 flex items-start gap-3">
                      <span className="text-zinc-600 block pt-0.5">[{new Date(act.createdAt).toLocaleTimeString("fr-FR")}]</span>
                      <div className="flex-1">
                        <span className="text-yellow-500 font-bold uppercase shrink-0">#{act.type || "SYS_OP"}</span>
                        <p className="text-zinc-200 mt-0.5 font-sans text-xs">{act.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 7. RESERVATIONS PANEL (Bookings approved) */}
          {activeTab === "reservations" && (
            <div className="space-y-4">
              <h3 className="text-base font-black text-gray-950 dark:text-white flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800 pb-2.5">
                <span>🔒</span> Réservations Effectives & Cachets Enregistrés (Cash : {myReservations.reduce((sum, r) => sum + r.amount, 0).toLocaleString()} FCFA)
              </h3>

              {myReservations.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-[#111113] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <Star className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-500">Aucun contrat réservé d'un commun accord pour l'instant.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myReservations.map((res) => (
                    <div key={res.id} className="bg-white dark:bg-[#141416] p-5.5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] uppercase font-black text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                          ✓ Accord scellé sur AFRIGOMBO
                        </span>
                        <span className="font-mono text-sm font-black text-emerald-600">
                          {res.amount.toLocaleString()} FCFA
                        </span>
                      </div>
                      <h4 className="font-black text-gray-950 dark:text-white text-base leading-snug">{res.gomboTitle}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 text-xs bg-[#FAF9F5] dark:bg-black/15 p-3.5 rounded-2xl text-gray-600 dark:text-gray-350">
                        {currentUserProfile.role === "client" ? (
                          <>
                            <p>🎸 Artiste retenu : <strong className="text-gray-950 dark:text-white">{res.musicianName}</strong></p>
                            <p>📞 Téléphone de prise de contact : <strong className="text-emerald-500 underline font-extrabold">{res.musicianPhone}</strong></p>
                          </>
                        ) : (
                          <>
                            <p>🤝 Boss Recruteur : <strong className="text-gray-900 dark:text-white">Contact direct débloqué</strong></p>
                            <p>📞 Mon téléphone de contact : <strong className="text-gray-900 dark:text-white">{res.musicianPhone}</strong></p>
                          </>
                        )}
                      </div>
                      <div className="mt-3.5 flex items-center gap-2 text-[10.5px] text-gray-400">
                        <Info className="w-4 h-4 text-[#D4AF37]" />
                        <p>Booking enregistré. Veuillez envoyer un Wave ou Orange Money de blocage pour sceller définitivement la prestation.</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 8. GENERAL ADMIN COMPTES PANEL (Admin only) */}
          {activeTab === "admin" && currentUserProfile.role === "admin" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-white dark:bg-[#111113] p-5.5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl">
                <h4 className="text-base font-black text-gray-950 dark:text-white mb-4.5 flex items-center gap-2">
                  <Shield className="w-5.5 h-5.5 text-orange-500" />
                  Gérer les Comptes Utilisateurs ({allUsers.length})
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 uppercase tracking-widest text-[9px] font-black pb-2">
                        <th className="py-2.5">Artiste / Recruteur</th>
                        <th className="py-2.5">Rôle</th>
                        <th className="py-2.5">Coordonnées</th>
                        <th className="py-2.5 text-right font-black">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50/50 dark:divide-gray-800/50">
                      {allUsers.map((u) => (
                        <tr key={u.uid} className="hover:bg-gray-50/10">
                          <td className="py-3 font-extrabold text-gray-950 dark:text-white text-xs">
                            {u.firstName} {u.lastName}
                            <span className="block text-[10px] text-gray-400 font-medium normal-case mt-0.5">{u.email}</span>
                          </td>
                          <td className="py-3 capitalize text-[#D4AF37] font-extrabold text-xs">{u.role}</td>
                          <td className="py-3 text-gray-400 text-xs">{u.phone} • {u.commune}</td>
                          <td className="py-3 text-right">
                            {u.uid !== currentUserProfile.uid ? (
                              <button
                                onClick={() => handleAdminDeleteUser(u.uid)}
                                className="px-2.5 py-1 bg-red-50 text-red-650 hover:bg-red-100 rounded-lg text-[10.5px] font-black transition-all"
                              >
                                Supprimer
                              </button>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-extrabold">Super Admin</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 9. WAITING LIST FEATURE STATS (Admin only) */}
          {activeTab === "waiting" && currentUserProfile.role === "admin" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-white dark:bg-[#111113] p-5.5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl">
                <h4 className="text-base font-black text-gray-950 dark:text-white mb-3 flex items-center gap-1.5">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  Listes d'Attente pour les Futures Fonctionnalités
                </h4>
                <p className="text-xs text-gray-450 leading-relaxed mb-4">
                  Prospects et inscriptions d'intentions enregistrées pour les modules en préparation sur Y'A GOMBO MUSIC.
                </p>

                {waitingAnalytics.length === 0 ? (
                  <p className="text-xs text-center py-6 text-gray-400 italic">Aucune intention exprimée pour l'instant.</p>
                ) : (
                  <div className="space-y-2.5">
                    {["academie", "groupe", "marche", "certification"].map((feat) => {
                      const list = waitingAnalytics.filter(w => w.featureName === feat);
                      return (
                        <div key={feat} className="p-4 bg-[#FAF9F5] dark:bg-black/15 rounded-2xl flex items-center justify-between border border-gray-100 dark:border-gray-800">
                          <div>
                            <span className="text-xs font-black text-gray-900 dark:text-white capitalize">
                              {feat === "academie" ? "L'Académie" : feat === "groupe" ? "Coin des Groupes" : feat === "marche" ? "Le Marché d'Occasions" : "Assistance Certification Pro"}
                            </span>
                            <p className="text-[9.5px] text-gray-400 mt-1 truncate max-w-sm">
                              Courriels enregistrés : {list.map(l => l.userEmail).join(", ") || "Aucun"}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-yellow-500/10 text-[#D4AF37] font-mono font-black text-[11px] rounded-lg border border-[#D4AF37]/20 ml-2">
                            {list.length} inscrits
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
