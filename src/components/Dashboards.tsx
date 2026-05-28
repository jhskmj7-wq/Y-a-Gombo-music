import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Briefcase, Check, X, Phone, UserCheck, Flame, Trash2, 
  MapPin, Clock, Calendar, Users, Shield, Sparkles, Star, Award, Search, Info 
} from "lucide-react";
import { gomboDB, isFirebaseMock } from "../firebase";
import { UserProfile, Gombo, Application, Reservation } from "../types";

interface DashboardsProps {
  currentUserProfile: UserProfile;
  onRefreshProfile: () => void;
}

export default function Dashboards({ currentUserProfile, onRefreshProfile }: DashboardsProps) {
  const [activeTab, setActiveTab] = useState<"gombos" | "applications" | "reservations" | "admin" | "waiting">("gombos");

  // Keep scrolls independent and not mixed by scrolling to top of page on activeTab transition
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeTab]);
  
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
  
  // Data States
  const [myGombos, setMyGombos] = useState<Gombo[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  
  // Client specific: list of applications received across all my gombos
  const [receivedApplications, setReceivedApplications] = useState<Application[]>([]);
  
  // Admin specific states
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allGombosList, setAllGombosList] = useState<Gombo[]>([]);
  const [waitingAnalytics, setWaitingAnalytics] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // Load Dashboard Data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const gombos = await gomboDB.getAllGombos();
      const applications = await gomboDB.getApplications();
      const reservations = await gomboDB.getReservations();

      if (currentUserProfile.role === "client") {
        // Gombos posted by this client
        const clientGombos = gombos.filter(g => g.clientId === currentUserProfile.uid);
        setMyGombos(clientGombos);

        // Applications received for all my gombos
        const clientGomboIDs = clientGombos.map(g => g.id);
        const appsReceived = applications.filter(app => clientGomboIDs.includes(app.gomboId));
        setReceivedApplications(appsReceived);

        // Reservations where I am the client
        const clientReservations = reservations.filter(r => r.clientId === currentUserProfile.uid);
        setMyReservations(clientReservations);
      } else if (currentUserProfile.role === "musicien") {
        // Gombos matching filters or general (handled on landing, we just load bookings/applied)
        // Applications I sent
        const musicianApps = applications.filter(app => app.musicianId === currentUserProfile.uid);
        setMyApplications(musicianApps);

        // Reservations obtained
        const musicianReservations = reservations.filter(r => r.musicianId === currentUserProfile.uid);
        setMyReservations(musicianReservations);
      }

      // If user is Admin or logs into admin tab
      if (currentUserProfile.role === "admin") {
        const users = await gomboDB.getAllUsers();
        setAllUsers(users);
        setAllGombosList(gombos);
        const waitings = await gomboDB.getWaitingFeaturesCount();
        setWaitingAnalytics(waitings);
        setActiveTab("admin");
      }
    } catch (err) {
      console.error("Error loading dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    console.log("🔗 [Dashboard Live Link] Subscribing to real-time resources...");
    
    let unsubGombos: (() => void) | null = null;
    let unsubApps: (() => void) | null = null;

    const initDashboardListeners = async () => {
      try {
        const reservations = await gomboDB.getReservations();

        // 1. Live Gombos
        unsubGombos = gomboDB.listenAllGombos((gombos) => {
          // 2. Live Applications
          unsubApps = gomboDB.listenApplications(async (applications) => {
            console.log("⚡ [Dashboard Live Sync] Live sync triggered. Gombos:", gombos.length, "Apps:", applications.length);
            
            if (currentUserProfile.role === "client") {
              const clientGombos = gombos.filter(g => g.clientId === currentUserProfile.uid);
              setMyGombos(clientGombos);

              const clientGomboIDs = clientGombos.map(g => g.id);
              const appsReceived = applications.filter(app => clientGomboIDs.includes(app.gomboId));
              setReceivedApplications(appsReceived);

              const clientReservations = reservations.filter(r => r.clientId === currentUserProfile.uid);
              setMyReservations(clientReservations);
            } else if (currentUserProfile.role === "musicien") {
              const musicianApps = applications.filter(app => app.musicianId === currentUserProfile.uid);
              setMyApplications(musicianApps);

              const musicianReservations = reservations.filter(r => r.musicianId === currentUserProfile.uid);
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
            setLoading(false);
          });
        });
      } catch (err) {
        console.error("❌ [Dashboard Live Sync] Error binding listeners:", err);
        setLoading(false);
      }
    };

    initDashboardListeners();

    return () => {
      console.log("🔌 [Dashboard Live Link] Cleaning up active live link subscriptions...");
      if (unsubGombos) unsubGombos();
      if (unsubApps) unsubApps();
    };
  }, [currentUserProfile?.uid, currentUserProfile]);

  // Handle client accepting musician application
  const handleAcceptCandidacy = async (app: Application) => {
    if (!window.confirm(`Confirmer la réservation du gombo avec ${app.musicianName} ?`)) return;
    
    setLoading(true);
    try {
      // Find the gombo details
      const gombos = await gomboDB.getAllGombos();
      const targetGombo = gombos.find(g => g.id === app.gomboId);
      if (!targetGombo) throw new Error("Gombo introuvable !");

      // Update application status to 'accepte'
      await gomboDB.updateApplicationStatus(app.id, "accepte");

      // Send real-time notification to the accepted musician
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

      // Auto-reject other applications for this exact same single-musician gombo (optional UX touch)
      if (targetGombo.musiciansCount === 1) {
        const matchingApps = receivedApplications.filter(a => a.gomboId === app.gomboId && a.id !== app.id);
        for (const otherApp of matchingApps) {
          await gomboDB.updateApplicationStatus(otherApp.id, "rejete");
        }
      }

      // Record Reservation
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
      loadDashboardData();
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de l'enregistrement de l'accord.");
    } finally {
      setLoading(false);
    }
  };

  // Handle client rejecting application
  const handleRejectCandidacy = async (app: Application) => {
    if (!window.confirm("Désapprouver cette candidature ?")) return;
    setLoading(true);
    try {
      await gomboDB.updateApplicationStatus(app.id, "rejete");
      loadDashboardData();
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
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminDeleteGombo = async (gomboId: string) => {
    if (!window.confirm("Voulez-vous supprimer définitivement cette annonce ?")) return;
    try {
      await gomboDB.deleteGombo(gomboId);
      alert("Annonce supprimée avec succès.");
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        {/* Abstract vector wave background */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,50 Q25,70 50,50 T100,50 L100,100 L0,100 Z" fill="white" />
          </svg>
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-orange-700/50 rounded-full text-xs font-bold uppercase tracking-wider">
                Espace {currentUserProfile.role === "admin" ? "Administrateur" : currentUserProfile.role === "client" ? "Club / Employeur" : "Artiste"}
              </span>
              {mockMode && (
                <span className="px-2.5 py-0.5 bg-yellow-400 text-black text-[10px] font-extrabold uppercase rounded-full">
                  Mode Démonstration Actif
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black mt-2">
              Akwaba, {currentUserProfile.firstName} {currentUserProfile.lastName} !
            </h1>
            <p className="text-orange-100 text-sm mt-1">
              Gérez facilement vos bookings, candidatures et prestations musicales du showbiz d'Abidjan.
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="text-right">
              <p className="text-xs text-orange-100">Solde estimé contrats</p>
              <p className="text-2xl font-black font-mono">
                {myReservations.reduce((sum, r) => sum + r.amount, 0).toLocaleString()} FCFA
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation tabs for dashboard subviews */}
      <div className="flex border-b border-gray-100 dark:border-gray-800 gap-1 overflow-x-auto pb-px">
        {currentUserProfile.role === "client" && (
          <>
            <button
              onClick={() => setActiveTab("gombos")}
              className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors shrink-0 ${
                activeTab === "gombos"
                  ? "border-orange-500 text-orange-600 dark:text-orange-400"
                  : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Mes Gombos Publiés ({myGombos.length})
            </button>
            <button
              onClick={() => setActiveTab("applications")}
              className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors shrink-0 ${
                activeTab === "applications"
                  ? "border-orange-500 text-orange-600 dark:text-orange-400"
                  : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Candidatures Reçues ({receivedApplications.length})
            </button>
            <button
              onClick={() => setActiveTab("reservations")}
              className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors shrink-0 ${
                activeTab === "reservations"
                  ? "border-orange-500 text-orange-600 dark:text-orange-400"
                  : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Réservations Finalisées ({myReservations.length})
            </button>
          </>
        )}

        {currentUserProfile.role === "musicien" && (
          <>
            <button
              onClick={() => setActiveTab("applications")}
              className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors shrink-0 ${
                activeTab === "applications"
                  ? "border-orange-500 text-orange-600 dark:text-orange-400"
                  : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Candidatures Envoyées ({myApplications.length})
            </button>
            <button
              onClick={() => setActiveTab("reservations")}
              className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors shrink-0 ${
                activeTab === "reservations"
                  ? "border-orange-500 text-orange-600 dark:text-orange-400"
                  : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Gombos Obtenus ({myReservations.length})
            </button>
          </>
        )}

        {currentUserProfile.role === "admin" && (
          <>
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors shrink-0 ${
                activeTab === "admin"
                  ? "border-orange-500 text-orange-600 dark:text-orange-400"
                  : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Gérer les Comptes ({allUsers.length})
            </button>
            <button
              onClick={() => setActiveTab("gombos")}
              className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors shrink-0 ${
                activeTab === "gombos"
                  ? "border-orange-500 text-orange-600 dark:text-orange-400"
                  : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Modérer les Annonces ({allGombosList.length})
            </button>
            <button
              onClick={() => setActiveTab("waiting")}
              className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors shrink-0 ${
                activeTab === "waiting"
                  ? "border-orange-500 text-orange-600 dark:text-orange-400"
                  : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Listes d'attentes Fonctionnalités ({waitingAnalytics.length})
            </button>
          </>
        )}
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* --- SUBVIEWS CONTENT RENDERING --- */}
      {!loading && (
        <div className="space-y-4">
          
          {/* 1. MES GOMBOS (CLIENT) / ALL GOMBOS (ADMIN) */}
          {activeTab === "gombos" && (
            <div className="space-y-4">
              {(currentUserProfile.role === "client" ? myGombos : allGombosList).length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800/20 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Aucune annonce publiée pour le moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(currentUserProfile.role === "client" ? myGombos : allGombosList).map((gombo) => (
                    <div 
                      key={gombo.id}
                      className="bg-white dark:bg-[#1e1e24] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 relative flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            gombo.status === "publie" 
                              ? "bg-orange-50 dark:bg-orange-950/20 text-orange-600" 
                              : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                          }`}>
                            Contract {gombo.status === "publie" ? "En ligne" : "Réservé"}
                          </span>
                          <span className="font-mono text-sm font-black text-orange-600">
                            {gombo.budget.toLocaleString()} FCFA
                          </span>
                        </div>

                        <h4 className="font-extrabold text-gray-950 dark:text-white text-base mb-1.5">{gombo.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-3">
                          {gombo.description}
                        </p>

                        <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[11px] text-gray-500 dark:text-gray-400 border-t border-gray-55 dark:border-gray-800 pt-2.5">
                          <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {gombo.commune}</div>
                          <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {gombo.date}</div>
                          <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {gombo.time}</div>
                          <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {gombo.musiciansCount} musiciens</div>
                        </div>
                      </div>

                      {/* Admin delete shortcut */}
                      {currentUserProfile.role === "admin" && (
                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-400">
                          <p>Publié par: {gombo.clientName}</p>
                          <button
                            onClick={() => handleAdminDeleteGombo(gombo.id)}
                            className="p-1 px-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold flex items-center gap-1 shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. CANDIDATURES (MUSICIAN OR CLIENT) */}
          {activeTab === "applications" && (
            <div className="space-y-4">
              
              {/* MUSICIAN SIDE: APP SENT LIST */}
              {currentUserProfile.role === "musicien" && (
                myApplications.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-gray-800/20 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">Vous n'avez pas encore postulé à des propositions.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myApplications.map((app) => (
                      <div key={app.id} className="bg-white dark:bg-[#1e1e24] p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <div>
                            <h4 className="font-extrabold text-[#111] dark:text-white text-base">{app.gomboTitle}</h4>
                            <p className="text-[10px] text-gray-400 uppercase mt-0.5">Candidature postée le {new Date(app.createdAt).toLocaleDateString()}</p>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                            app.status === "en_attente" 
                              ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20" 
                              : app.status === "accepte" 
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20" 
                              : "bg-red-50 text-red-600 dark:bg-red-950/20"
                          }`}>
                            {app.status === "en_attente" ? "En attente" : app.status === "accepte" ? "Sélectionné ✅" : "Non retenu ❌"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed mt-2 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
                          💬 Message : "{app.message}"
                        </p>
                        {app.mediaUrl && (
                          <div className="mt-2 text-xs text-orange-600 dark:text-orange-400 font-medium">
                            🎥 Démo scène : <a href={app.mediaUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-orange-700">{app.mediaUrl}</a>
                          </div>
                        )}
                        
                        {app.status === "accepte" && (
                          <div className="mt-4 p-4.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-400 space-y-2">
                            <p className="font-bold flex items-center gap-1.5"><Sparkles className="w-4 h-4 fill-current text-emerald-600" /> Félicitations ! Votre profil a été validé pour ce gombo.</p>
                            <p>Le client va vous joindre par téléphone ou transférer l'avance Mobile Money de réservation.</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* CLIENT SIDE: RECEIVE APPLICATIONS LIST */}
              {currentUserProfile.role === "client" && (
                receivedApplications.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-gray-800/20 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">Aucune candidature n'a été reçue pour vos gombos encore.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {receivedApplications.map((app) => (
                      <div key={app.id} className="bg-white dark:bg-[#1e1e24] p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                              <img src={app.musicianAvatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150"} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-gray-950 dark:text-white text-base leading-snug">
                                {app.musicianName}
                              </h4>
                              <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                                {app.musicianSpecialty} • {app.gomboTitle}
                              </p>
                            </div>
                          </div>
                          
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            app.status === "en_attente" 
                              ? "bg-amber-50 text-amber-600" 
                              : app.status === "accepte" 
                              ? "bg-emerald-50 text-emerald-600" 
                              : "bg-red-50 text-red-600"
                          }`}>
                            {app.status === "en_attente" ? "En suspens" : app.status === "accepte" ? "Réservé" : "Décliné"}
                          </span>
                        </div>

                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/20 rounded-xl text-xs text-gray-700 dark:text-gray-300">
                          <p className="font-semibold text-gray-400 mb-1 uppercase tracking-wider text-[10px]">Présentation de l'artiste :</p>
                          <blockquote className="italic">"{app.message}"</blockquote>
                        </div>

                        {app.mediaUrl && (
                          <div className="mt-3 text-xs flex items-center gap-1.5">
                            <span className="text-gray-400">🔗 Démo Scène / Enregistrement:</span>
                            <a href={app.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-orange-600 dark:text-orange-400 font-bold hover:underline">
                              Cliquez ici pour regarder ↗
                            </a>
                          </div>
                        )}

                        {app.status === "en_attente" && (
                          <div className="flex gap-3 justify-end mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                            <button
                              onClick={() => handleRejectCandidacy(app)}
                              className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors"
                            >
                              Décliner
                            </button>
                            <button
                              onClick={() => handleAcceptCandidacy(app)}
                              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Réserver cet artiste
                            </button>
                          </div>
                        )}

                        {app.status === "accepte" && (
                          <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
                            <span className="font-bold text-gray-500 block uppercase mb-1.5">COORDONNÉES ET MOBILE MONEY RÉVÉLÉS :</span>
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl space-y-1 text-emerald-800 dark:text-emerald-400">
                              <p>📞 Phone de prise de contact : <strong className="underline text-gray-900 dark:text-white">{app.musicianPhone}</strong></p>
                              <p>💬 Utilisez ce numéro pour l'appeler pour caler les morceaux / les horaires de balance, ou lui envoyer directement l'avance convenue par Wave ou Orange Money.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}

            </div>
          )}

          {/* 3. RESERVATIONS FINALISEES / GOMBOS OBTENUS */}
          {activeTab === "reservations" && (
            <div className="space-y-4">
              {myReservations.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800/20 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Aucune prestation n'est officiellement réservée encore.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myReservations.map((res) => (
                    <div key={res.id} className="bg-white dark:bg-[#1e1e24] p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 rounded-md">
                          🔒 Booking Validé Y’A GOMBO MUSIC
                        </span>
                        <span className="font-mono text-sm font-black text-emerald-600">
                          {res.amount.toLocaleString()} FCFA
                        </span>
                      </div>
                      <h4 className="font-black text-gray-950 dark:text-white text-base leading-snug">{res.gomboTitle}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs bg-gray-50 dark:bg-gray-800/20 p-3.5 rounded-xl text-gray-600 dark:text-gray-300">
                        {currentUserProfile.role === "client" ? (
                          <>
                            <p>🎸 Artiste : <strong className="text-gray-900 dark:text-white">{res.musicianName}</strong></p>
                            <p className="flex items-center gap-1">📞 Contact direct : <strong className="text-emerald-600 dark:text-emerald-400 underline">{res.musicianPhone}</strong></p>
                          </>
                        ) : (
                          <>
                            <p>🤝 Recruteur Client : <strong className="text-gray-900 dark:text-white">Contact direct débloqué</strong></p>
                            <p className="flex items-center gap-1">📞 Mon téléphone de contact : <strong className="text-gray-900 dark:text-white">{res.musicianPhone}</strong></p>
                          </>
                        )}
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-[11px] text-gray-400">
                        <Info className="w-4 h-4 text-orange-500" />
                        <p>Prestation enregistrée. Veuillez utiliser Mobile Money (Wave/Orange/MTN) pour transférer l'avance de blocage.</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. ADMIN TAB (ADMIN ONLY) */}
          {activeTab === "admin" && currentUserProfile.role === "admin" && (
            <div className="space-y-5">
              
              {/* Users management */}
              <div className="bg-white dark:bg-[#1e1e24] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-md">
                <h4 className="text-lg font-extrabold text-[#111] dark:text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5.5 h-5.5 text-orange-500" />
                  Gérer les Comptes Utilisateurs ({allUsers.length})
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 uppercase tracking-wider">
                        <th className="py-2.5">Utilisateur</th>
                        <th className="py-2.5">Rôle</th>
                        <th className="py-2.5">Contact</th>
                        <th className="py-2.5 text-right">Moderation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {allUsers.map((user) => (
                        <tr key={user.uid} className="hover:bg-gray-50/40">
                          <td className="py-3 font-semibold text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName} 
                            <span className="block font-normal text-[10px] text-gray-400">{user.email}</span>
                          </td>
                          <td className="py-3 capitalize font-bold text-orange-600 dark:text-orange-400">{user.role}</td>
                          <td className="py-3 text-gray-500">{user.phone} • {user.commune}</td>
                          <td className="py-3 text-right">
                            {user.uid !== currentUserProfile.uid ? (
                              <button
                                onClick={() => handleAdminDeleteUser(user.uid)}
                                className="p-1 px-2.5 bg-red-50 text-red-650 hover:bg-red-100 rounded-lg text-xs font-bold transition-all"
                              >
                                Supprimer
                              </button>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-bold">Vous (Admin)</span>
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

          {/* 5. WAITING FEATURES ANALYTICS TAB (ADMIN ONLY) */}
          {activeTab === "waiting" && currentUserProfile.role === "admin" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#1e1e24] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-md">
                <h4 className="text-lg font-extrabold text-[#111] dark:text-white mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-orange-500" />
                  Statistiques de Lancement - Listes d'attente
                </h4>
                <p className="text-xs text-gray-450 mb-4 leading-relaxed">
                  Cet onglet affiche les intentions d'inscriptions récoltées pour les modules à venir ("Bientôt Disponible"), ce qui témoigne des demandes fortes du showbiz d'Abidjan.
                </p>

                {waitingAnalytics.length === 0 ? (
                  <p className="text-xs text-center py-6 text-gray-400">Aucun utilisateur inscrit sur la liste d'attente encore.</p>
                ) : (
                  <div className="space-y-3">
                    {/* Gather metrics per feature */}
                    {["academie", "groupe", "marche", "certification"].map((feat) => {
                      const list = waitingAnalytics.filter(w => w.featureName === feat);
                      return (
                        <div key={feat} className="p-3 bg-gray-55/60 dark:bg-gray-800/40 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="text-sm font-bold capitalize text-gray-900 dark:text-white">
                              {feat === "academie" ? "L'Académie" : feat === "groupe" ? "Coin des Groupes" : feat === "marche" ? "Le Marché du Coin" : "Certification Pro"}
                            </span>
                            <p className="text-[10px] text-gray-400 mt-0.5">Utilisateurs inscrits : {list.map(l => l.userEmail).join(", ") || "Aucun"}</p>
                          </div>
                          <span className="px-3 py-1 bg-orange-100 text-orange-600 font-black rounded-lg text-xs font-mono">
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
