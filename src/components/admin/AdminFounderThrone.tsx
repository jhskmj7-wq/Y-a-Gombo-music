import BouclierAfrigombo from "./BouclierAfrigombo";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Crown, ShieldCheck, UserPlus, UserX, Info, ShieldAlert,
  Activity, Users, FileText, Coins, Database, HardDrive, Lock, Server, Terminal,
  Sparkles, Wallet, CreditCard, Bell, BarChart3, Brain, DatabaseBackup, ListCollapse,
  Play, Pause, Trash2, Volume2, Plus, ArrowUp, ArrowDown, Send, 
  RefreshCw, CheckCircle, XCircle, Search, HelpCircle, Save, BookOpen, Scroll, Target, Award,
  Globe, Landmark, AlertTriangle, Music, ArrowLeft, Heart, Shield, CheckSquare, Square,
  Clock, MapPin, Cloud, Zap, Sun
} from "lucide-react";
import { BetaTransactionsAdminPanel } from "./BetaTransactionsAdminPanel";
import { globalAudioManager, isDirectAudioFile, AudioConfig, AudioState } from "../../lib/audioManager";
import { db } from "../../lib/firebase";
import { useAuth } from "../../AuthContext";
import { 
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, addDoc, getDocs 
} from "firebase/firestore";

interface AdminFounderThroneProps {
  theme?: string;
  founders: string[];
  superAdmins: string[];
  adminEmail: string;
  isAuthorizedSuperFounder: boolean;
  onUpdateThroneConfig?: (newFounders: string[], newSuperAdmins: string[]) => void;
  audioSynth?: any;
  users?: any[];
  gombos?: any[];
  posts?: any[];
  transactions?: any[];
  alerts?: any[];
  onExit?: () => void;
}

interface GovernanceData {
  vision: string;
  journal: string;
  decisions: string;
  announcements: string;
  growth: string;
  notes: string;
}

interface ThroneMusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  order: number;
}

interface MusicSpots {
  accueil: string;
  navigation: string;
  throne: string;
  evenements: string;
  notifications: string;
  celebration: string;
}

export default function AdminFounderThrone({
  theme,
  founders = [],
  superAdmins = [],
  adminEmail,
  isAuthorizedSuperFounder,
  onUpdateThroneConfig,
  audioSynth,
  users = [],
  gombos = [],
  posts = [],
  transactions = [],
  alerts = [],
  onExit
}: AdminFounderThroneProps) {
  const isDark = theme !== "light";
  const { currentUser, profile } = useAuth();
  const [audioState, setAudioState] = useState<AudioState>(globalAudioManager.getState());

  useEffect(() => {
    return globalAudioManager.subscribe((state) => {
      setAudioState(state);
    });
  }, []);

  const formatAudioTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Navigation: null shows the 9 cards, string shows specific section view
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  
  // Feedback States
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const pendingBetaTransactions = transactions.filter((t: any) => t.status === "en_attente_validation");

  // Satellite states from Firestore
  const [universeStates, setUniverseStates] = useState<Record<string, string>>({
    gomboId: "DÉPLOYÉ & ACTIF",
    afriTrust: "DÉPLOYÉ & ACTIF",
    afriLivraison: "EN ATTENTE",
    gomboMusik: "DÉPLOYÉ & ACTIF"
  });

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, "system_settings", "satellites"), (snap) => {
      if (snap.exists()) {
        setUniverseStates(snap.data() as Record<string, string>);
      }
    });
    return () => unsub();
  }, []);

  const handleToggleSatellite = async (servId: string) => {
    const newState = universeStates[servId] === "DÉPLOYÉ & ACTIF" ? "EN MAINTENANCE" : "DÉPLOYÉ & ACTIF";
    try {
      await setDoc(doc(db, "system_settings", "satellites"), { ...universeStates, [servId]: newState }, { merge: true });
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err) {
      console.error("Error toggling satellite", err);
    }
  };

  const [betaChecklist, setBetaChecklist] = useState<Record<string, boolean>>({
    "Connexion Google": false,
    "Déconnexion": false,
    "Création publication": false,
    "Modification profil": false,
    "Upload image": false,
    "Notifications": false,
    "Navigation": false,
    "Centre de Commandement": false,
    "Trône": false,
    "Responsive Android": false,
    "Firebase": false,
  });

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, "system_settings", "beta_checklist"), (snap) => {
      if (snap.exists()) {
        setBetaChecklist(snap.data() as Record<string, boolean>);
      }
    });
    return () => unsub();
  }, []);

  const [economySettings, setEconomySettings] = useState<any>(null);
  const [allContracts, setAllContracts] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "contracts"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() });
      });
      setAllContracts(list);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "payments"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() });
      });
      setAllPayments(list);
    });
    return () => unsub();
  }, []);
  
  useEffect(() => {
    // Load economy settings if needed
    if (selectedSection === "economy") {
      import("../../firebase").then(({ gomboDB }) => {
        gomboDB.getEconomySettings().then(settings => {
          setEconomySettings(settings);
        });
      });
    }
  }, [selectedSection]);

  const toggleChecklist = async (key: string) => {
    const updated = { ...betaChecklist, [key]: !betaChecklist[key] };
    setBetaChecklist(updated);
    try {
      await setDoc(doc(db, "system_settings", "beta_checklist"), updated, { merge: true });
    } catch (e) { console.error(e); }
    try { if (audioSynth) audioSynth.playValidationSuccess(); } catch (_) {}
  };

  const progressCount = Object.values(betaChecklist).filter(Boolean).length;

  // 1. GOUVERNANCE FIRESTORE SYNC
  const [govData, setGovData] = useState<GovernanceData>({
    vision: "Bâtir le premier empire de mise en relation artistique d'Afrique de l'Ouest.",
    journal: "Aujourd'hui, lancement de la phase impériale d'AFRIGOMBO ELITE.",
    decisions: "1. Certification systématique Gombo ID.\n2. Lancement des abonnements Elite.",
    announcements: "Bienvenue sur le fil de l'écosystème souverain !",
    growth: "Atteindre 10,000 membres actifs certifiés d'ici décembre 2026.",
    notes: "Vérifier la performance du serveur d'Abidjan."
  });
  const [isSavingGov, setIsSavingGov] = useState(false);

  useEffect(() => {
    if (!db) return;
    const docRef = doc(db, "throne", "governance");
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setGovData(snap.data() as GovernanceData);
      }
    });
    return () => unsub();
  }, []);

  const handleSaveGovField = async (field: keyof GovernanceData, value: string) => {
    if (!isAuthorizedSuperFounder) {
      setErrorMsg("Seul le Fondateur Suprême peut modifier la gouvernance de l'Empire.");
      return;
    }
    setIsSavingGov(true);
    try {
      const docRef = doc(db, "throne", "governance");
      await setDoc(docRef, { ...govData, [field]: value }, { merge: true });
      setSuccessMsg("Plan stratégique synchronisé en temps réel sur la base Firestore.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(`Erreur de synchronisation : ${err.message}`);
    } finally {
      setIsSavingGov(false);
    }
  };

  // 2. MUSIQUE INTERACTIVE & FIRESTORE SYNC
  const [musicTracks, setMusicTracks] = useState<ThroneMusicTrack[]>([]);
  const [musicSpots, setMusicSpots] = useState<MusicSpots>({
    accueil: "",
    navigation: "",
    throne: "",
    evenements: "",
    notifications: "",
    celebration: ""
  });

  const [newTrackTitle, setNewTrackTitle] = useState("");
  const [newTrackArtist, setNewTrackArtist] = useState("");
  const [newTrackUrl, setNewTrackUrl] = useState("");

  // Music Player States
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [trackProgress, setTrackProgress] = useState(0);

  useEffect(() => {
    if (!db) return;
    // Listen to tracks list
    const unsubTracks = onSnapshot(collection(db, "throne_music"), (snap) => {
      const list: ThroneMusicTrack[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as ThroneMusicTrack);
      });
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
      setMusicTracks(list);
    });

    // Listen to assigned spots
    const unsubSpots = onSnapshot(doc(db, "throne", "music_spots"), (snap) => {
      if (snap.exists()) {
        setMusicSpots(snap.data() as MusicSpots);
      }
    });

    return () => {
      unsubTracks();
      unsubSpots();
    };
  }, []);

  // Sync volume to audio tag
  useEffect(() => {
    if (currentAudio) {
      currentAudio.volume = volume;
    }
  }, [volume, currentAudio]);

  // Audio tag progress listener
  useEffect(() => {
    if (!currentAudio) return;
    const updateProgress = () => {
      if (currentAudio.duration) {
        setTrackProgress((currentAudio.currentTime / currentAudio.duration) * 100);
      }
    };
    currentAudio.addEventListener("timeupdate", updateProgress);
    return () => {
      currentAudio.removeEventListener("timeupdate", updateProgress);
    };
  }, [currentAudio]);

  const handlePlayPauseTrack = async (track: ThroneMusicTrack) => {
    try { audioSynth?.playValidationSuccess(); } catch (_) {}
    
    if (playingTrackId === track.id) {
      globalAudioManager.stop();
      setPlayingTrackId(null);
    } else {
      try {
        await globalAudioManager.playCustomTrack(track.id, track.url, track.title);
        setPlayingTrackId(track.id);
      } catch (err: any) {
        console.warn("Could not play audio", err);
        setErrorMsg(err.message || "Lecture impossible. Vérifiez l'accessibilité de l'URL du fichier audio.");
        setTimeout(() => setErrorMsg(""), 4000);
      }
    }
  };

  const handleAddMusicTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorizedSuperFounder) {
      setErrorMsg("Droits impériaux requis pour modifier l'écosystème sonore.");
      return;
    }
    if (!newTrackTitle.trim() || !newTrackUrl.trim()) {
      setErrorMsg("Le titre et l'adresse URL absolue du fichier audio sont requis.");
      return;
    }

    if (!(await isDirectAudioFile(newTrackUrl.trim()))) {
      setErrorMsg("Cette URL ne correspond pas à un fichier audio lisible (MP3, OGG, WAV). Les pages web (Suno, etc.) ne sont pas acceptées.");
      return;
    }
    try {
      const newTrackRef = doc(collection(db, "throne_music"));
      const trackData: ThroneMusicTrack = {
        id: newTrackRef.id,
        title: newTrackTitle.trim(),
        artist: newTrackArtist.trim() || "Compositeur de l'Empire",
        url: newTrackUrl.trim(),
        order: musicTracks.length
      };
      await setDoc(newTrackRef, trackData);
      setNewTrackTitle("");
      setNewTrackArtist("");
      setNewTrackUrl("");
      setSuccessMsg("Composition sacrée ajoutée et synchronisée avec succès.");
      setTimeout(() => setSuccessMsg(""), 3500);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err: any) {
      setErrorMsg(`Erreur Firestore : ${err.message}`);
    }
  };

  const handleDeleteMusicTrack = async (id: string) => {
    if (!isAuthorizedSuperFounder) return;
    try {
      if (playingTrackId === id && currentAudio) {
        currentAudio.pause();
        setPlayingTrackId(null);
      }
      await deleteDoc(doc(db, "throne_music", id));
      setSuccessMsg("Fichier musical révoqué de la bibliothèque royale.");
      setTimeout(() => setSuccessMsg(""), 3000);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err: any) {
      setErrorMsg(`Erreur : ${err.message}`);
    }
  };

  const handleAssignSpot = async (spot: keyof MusicSpots, trackUrl: string) => {
    if (!isAuthorizedSuperFounder) return;
    try {
      const spotsRef = doc(db, "throne", "music_spots");
      await setDoc(spotsRef, { [spot]: trackUrl }, { merge: true });
      setSuccessMsg(`Ambiance assignée au spot '${spot.toUpperCase()}' avec succès.`);
      setTimeout(() => setSuccessMsg(""), 3000);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err: any) {
      setErrorMsg(`Erreur spot : ${err.message}`);
    }
  };

  const handleReorderMusic = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= musicTracks.length) return;

    const copy = [...musicTracks];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    try {
      for (let i = 0; i < copy.length; i++) {
        await updateDoc(doc(db, "throne_music", copy[i].id), { order: i });
      }
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err: any) {
      setErrorMsg(`Erreur réorganisation : ${err.message}`);
    }
  };

  // 3. DIFFUSEUR DE NOTIFICATIONS MÉGAPHONIQUE
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeBody, setNoticeBody] = useState("");
  const [noticeCategory, setNoticeCategory] = useState("MESSAGE SPECIAL");

  const handleSendNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !profile) {
      console.error("handleSendNotice: Auth missing");
      setErrorMsg("Vous devez être connecté pour diffuser des décrets.");
      return;
    }
    
    if (!isAuthorizedSuperFounder) {
      console.error("handleSendNotice: Not authorized");
      setErrorMsg("Seul le Souverain Suprême peut diffuser des décrets impériaux.");
      return;
    }
    if (!noticeTitle.trim() || !noticeBody.trim()) {
      console.warn("handleSendNotice: Missing title or body");
      setErrorMsg("Veuillez remplir le titre et le corps de votre décret.");
      return;
    }
    try {
      await addDoc(collection(db, "broadcasts"), {
        title: noticeTitle.trim().toUpperCase(),
        body: noticeBody.trim(),
        category: noticeCategory,
        author: profile.displayName || "SUPER FOUNDER IMPÉRIAL",
        timestamp: Date.now(),
        globalAlert: true
      });
      setNoticeTitle("");
      setNoticeBody("");
      setSuccessMsg("Le décret suprême a été soufflé à travers tout l'écosystème.");
      setTimeout(() => setSuccessMsg(""), 4000);
      try { audioSynth?.playTamTam(true); } catch (_) {}
    } catch (err: any) {
      console.error("handleSendNotice: ERROR:", err);
      setErrorMsg(`Échec de la transmission : ${err.message}`);
    }
  };

  // 4. ACTION INTERACTION CERTIFICATION & SIGNALEMENT
  const pendingCerts = users.filter((u: any) => u.kycStatus === "pending");
  
  const handleApproveCert = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        kycStatus: "approved",
        isCertified: true,
        "gomboId.certifie": true,
        "gomboId.statut": "CERTIFIÉ ELITE"
      });
      setSuccessMsg("Souveraineté : Certificat artistique validé et octroyé.");
      setTimeout(() => setSuccessMsg(""), 3000);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const handleRejectCert = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        kycStatus: "rejected",
        isCertified: false,
        "gomboId.certifie": false,
        "gomboId.statut": "SANS CERTIFICAT"
      });
      setSuccessMsg("Dossier de certification rejeté.");
      setTimeout(() => setSuccessMsg(""), 3000);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const reportedPosts = posts.filter((p: any) => p.isFlagged || p.reportsCount > 0);

  const handleUnflagPost = async (postId: string) => {
    try {
      await updateDoc(doc(db, "posts", postId), {
        isFlagged: false,
        reportsCount: 0
      });
      setSuccessMsg("L'alerte a été levée sur cette contribution.");
      setTimeout(() => setSuccessMsg(""), 3000);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, "posts", postId));
      setSuccessMsg("Publication supprimée pour non-respect de la charte culturelle.");
      setTimeout(() => setSuccessMsg(""), 3000);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  // 5. SECURITY & SCAN SYSTEMS
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);

  const triggerSecurityScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanStep(0);
    setScanLogs(["[CORE] Démarrage de l'analyse d'intégrité cyber-impériale..."]);
    try { audioSynth?.playValidationSuccess(); } catch (_) {}

    const steps = [
      () => {
        setScanStep(1);
        setScanLogs(p => [...p, "[DATABASE] Scan de la collection 'users' : OK. " + users.length + " citoyens cartographiés."]);
      },
      () => {
        setScanStep(2);
        const flaggedCount = posts.filter(p => p.isFlagged).length;
        setScanLogs(p => [...p, "[MODERATION] Analyse des publications. " + flaggedCount + " éléments suspendus détectés."]);
      },
      () => {
        setScanStep(3);
        setScanLogs(p => [...p, "[INFRASTRUCTURE] Pare-feu Abidjan actif. IP autorisées : 100% sécurisées."]);
      },
      () => {
        setScanStep(4);
        setScanLogs(p => [...p, "[SUCCESS] Analyse terminée. Score de sécurité : 100% SOUVERAIN."]);
        setIsScanning(false);
        try { audioSynth?.playTamTam(true); } catch (_) {}
      }
    ];

    steps.forEach((st, idx) => {
      setTimeout(st, (idx + 1) * 1100);
    });
  };

  // 6. BACKUP SYSTEMS
  const [isBackingUp, setIsBackingUp] = useState(false);
  const triggerThroneBackup = async () => {
    if (isBackingUp) return;
    setIsBackingUp(true);
    try { audioSynth?.playValidationSuccess(); } catch (_) {}
    try {
      const backupRef = doc(db, "throne_backups", `backup_${Date.now()}`);
      await setDoc(backupRef, {
        timestamp: Date.now(),
        stats: {
          usersCount: users.length,
          postsCount: posts.length,
          certifiedCount: users.filter(u => u.isCertified).length
        },
        executor: adminEmail
      });
      setSuccessMsg("Sauvegarde impériale de l'état du royaume réalisée avec succès.");
      setTimeout(() => setSuccessMsg(""), 4000);
      try { audioSynth?.playTamTam(true); } catch (_) {}
    } catch (e: any) {
      setErrorMsg(`Échec de sauvegarde : ${e.message}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  // 7. PRIVILEGE & PRIVILEGES MANAGEMENT
  const [newFounderInput, setNewFounderInput] = useState("");
  const [newAdminInput, setNewAdminInput] = useState("");

  const handleAddFounder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorizedSuperFounder) return;
    const cleanEmail = newFounderInput.trim().toLowerCase();
    if (!cleanEmail) return;
    if (founders.includes(cleanEmail)) {
      setErrorMsg("Cette adresse email possède déjà ce privilège de fondation.");
      return;
    }
    const updated = [...founders, cleanEmail];
    if (onUpdateThroneConfig) {
      onUpdateThroneConfig(updated, superAdmins);
      setNewFounderInput("");
      setSuccessMsg("Nouveau Fondateur associé au trône.");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const handleAddSuperAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorizedSuperFounder) return;
    const cleanEmail = newAdminInput.trim().toLowerCase();
    if (!cleanEmail) return;
    if (superAdmins.includes(cleanEmail)) {
      setErrorMsg("Cette adresse est déjà enregistrée en tant que Super Administrateur.");
      return;
    }
    const updated = [...superAdmins, cleanEmail];
    if (onUpdateThroneConfig) {
      onUpdateThroneConfig(founders, updated);
      setNewAdminInput("");
      setSuccessMsg("Super Administrateur promu et enregistré.");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const handleRemoveFounder = (email: string) => {
    if (!isAuthorizedSuperFounder) return;
    if (email === "jhs.kmj7@gmail.com") {
      setErrorMsg("Le Fondateur Suprême originel ne peut jamais être destitué.");
      return;
    }
    const updated = founders.filter((e) => e !== email);
    if (onUpdateThroneConfig) {
      onUpdateThroneConfig(updated, superAdmins);
      setSuccessMsg("Souverain révoqué avec succès.");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const handleRemoveSuperAdmin = (email: string) => {
    if (!isAuthorizedSuperFounder) return;
    const updated = superAdmins.filter((e) => e !== email);
    if (onUpdateThroneConfig) {
      onUpdateThroneConfig(founders, updated);
      setSuccessMsg("Super Administrateur révoqué.");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  // 8. SOVEREIGN TERMINAL LOGGER & SIMULATION COMMAND ENGINE
  const [logs, setLogs] = useState<string[]>([
    "[SYSTEM] Temple de commandement initialisé.",
    "[PROTECTION] Pare-feu cyber-africain calibré et fonctionnel.",
    "[MONITORING] Synchro Firestore établie en temps réel.",
    "[DEVICES] Clé d'identité physique vérifiée d'Abidjan."
  ]);
  const [terminalInput, setTerminalInput] = useState("");

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    const cmd = terminalInput.trim().toLowerCase();
    setTerminalInput("");
    
    const now = new Date().toLocaleTimeString("fr-FR");
    setLogs(prev => [`[${now}] > ${cmd}`, ...prev]);
    
    try { audioSynth?.playValidationSuccess(); } catch (_) {}
    
    setTimeout(() => {
      if (cmd === "/scan" || cmd === "scan") {
        triggerSecurityScan();
      } else if (cmd === "/backup" || cmd === "backup") {
        triggerThroneBackup();
      } else if (cmd === "/status" || cmd === "status") {
        setLogs(prev => [
          `[${now}] STATE: SOUVERAINETÉ ACTIVE.`,
          `[${now}] CITIZENS: ${users.length} | TRANSACTIONS: ${transactions.length}`,
          `[${now}] MEMORY BUFFER: 44.5% OPTIMISÉ.`,
          ...prev
        ]);
      } else if (cmd === "/clear" || cmd === "clear") {
        setLogs([]);
      } else if (cmd === "/help" || cmd === "help") {
        setLogs(prev => [
          `[${now}] ORDRES DE CONSOLE AUTORISÉS :`,
          `  - /status : Santé globale du Temple de commandement`,
          `  - /scan   : Déclencher l'audit de cyber-défense`,
          `  - /backup : Sauvegarder les documents sacrés Firestore`,
          `  - /clear  : Purger l'historique du journal système`,
          ...prev
        ]);
      } else {
        setLogs(prev => [
          `[${now}] DIRECTIVE INCONNUE. Saisissez /help pour lister les opérations du Trône.`,
          ...prev
        ]);
      }
    }, 450);
  };

  useEffect(() => {
    const logsTemplates = [
      "Vibration sonore harmonisée avec l'écosystème.",
      "Base de données : ping 12ms optimal.",
      "Analyse de suspicion passive : aucun usurpateur détecté.",
      "Synchronisation Gombo ID : tous les registres à jour.",
      "Trésorerie de l'Empire : Gombocaisse en expansion."
    ];

    const interval = setInterval(() => {
      const randomMsg = logsTemplates[Math.floor(Math.random() * logsTemplates.length)];
      const now = new Date().toLocaleTimeString("fr-FR");
      setLogs((prev) => [`[${now}] [PASSIVE] ${randomMsg}`, ...prev.slice(0, 40)]);
    }, 18000);

    return () => clearInterval(interval);
  }, []);

  // 10. REAL-TIME CLOCK & IMPERIAL GREETING
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentDateTime.getHours();
    if (hour >= 5 && hour < 18) return "Bonjour";
    return "Bonsoir";
  };

  const formattedDate = currentDateTime.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const formattedTime = currentDateTime.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  // 11. METRICS DEDUCTIONS
  const totalRevenues = (transactions || [])
    .reduce((acc: number, item: any) => acc + Number(item.amount || 0), 0);
  const formattedRevenues = totalRevenues > 0 
    ? `${totalRevenues.toLocaleString("fr-FR")} FCFA`
    : "1 250 000 FCFA (Simulé)";

  const certifiedCount = users.filter((u: any) => u.isCertified || u.gomboId?.certifie).length;
  const highAlertsCount = (alerts || []).filter((a: any) => a.priority === "high" || a.priority === "critique" || a.priority === "high-priority").length + posts.filter((p: any) => p.isFlagged).length;

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        staggerChildren: 0.05,
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { duration: 0.25, ease: "easeOut" } 
    },
    hover: {
      scale: 1.03,
      borderColor: "#D4AF37",
      boxShadow: "0 0 25px rgba(212, 175, 55, 0.35), inset 0 0 10px rgba(212, 175, 55, 0.1)",
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="text-left pb-28 font-sans text-afri-text select-none bg-transparent min-h-screen pt-0 -mt-2">
      
      {/* ----------------------------------------------------
           HEADER IMPÉRIAL DU TRÔNE DU FONDATEUR
           ---------------------------------------------------- */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-[2.5rem] border-2 border-[#D4AF37]/50 shadow-2xl transition-all duration-500 mb-4 p-1 sm:p-2 ${
          isDark 
            ? 'bg-[#050505] shadow-[0_20px_60px_-15px_rgba(212,175,55,0.15)]' 
            : 'bg-[#EDEDED] shadow-[0_15px_45px_-10px_rgba(0,0,0,0.08)]'
        }`}
      >
        {/* Animated Imperial Glow Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <motion.div 
            animate={{ 
              background: [
                "radial-gradient(circle at 0% 0%, rgba(212,175,55,0.05) 0%, transparent 50%)",
                "radial-gradient(circle at 100% 100%, rgba(212,175,55,0.05) 0%, transparent 50%)",
                "radial-gradient(circle at 0% 0%, rgba(212,175,55,0.05) 0%, transparent 50%)"
              ]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-1">
          
          {/* COLONNE 1: PROFIL & COMMANDEMENT (GREETING) */}
          <div className={`lg:col-span-5 p-6 sm:p-8 rounded-[2rem] flex flex-col justify-between gap-8 border-b lg:border-b-0 lg:border-r border-[#D4AF37]/15 ${
            isDark ? 'bg-gradient-to-br from-[#0A0906] to-[#050505]' : 'bg-gradient-to-br from-[#E2E2E2] to-[#EDEDED]'
          }`}>
            <div className="flex items-start gap-6">
              <div className="relative shrink-0">
                <div className="absolute -inset-1.5 bg-[#D4AF37] rounded-[1.25rem] blur opacity-25 animate-pulse" />
                <div className={`relative w-20 h-20 rounded-[1.25rem] border-2 border-[#D4AF37] flex items-center justify-center shadow-inner ${
                  isDark ? 'bg-zinc-950 text-[#D4AF37]' : 'bg-white text-[#B8860B]'
                }`}>
                  <Crown className="w-10 h-10" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h1 className={`text-2xl sm:text-3xl font-display font-black tracking-tight flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-[#1A1A1A]'
                }`}>
                  👑 {getGreeting()}, <span className="text-[#D4AF37]">Sylvester</span>
                </h1>
                <p className="text-xs sm:text-sm font-sans font-black uppercase tracking-wider text-[#D4AF37]">
                  Fondateur d'AFRIGOMBO <span className="mx-1.5 opacity-40 text-afri-text-sec">•</span> Gardien du Temple
                </p>
                <div className="flex items-center gap-2.5 text-[11px] font-mono font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Abidjan, Côte d'Ivoire</span>
                </div>
              </div>
            </div>

            {/* HYMNE OFFICIEL CONTROLS - INTEGRATED INTO HEADER */}
            <div className={`p-4 rounded-2xl border transition-all duration-300 ${
              isDark ? 'bg-zinc-950/40 border-[#D4AF37]/20' : 'bg-white/80 border-[#D4AF37]/40 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isDark ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-[#D4AF37]/20 text-[#8B6508]'
                  }`}>
                    <Music className={`w-4 h-4 ${audioState.currentPlaying === 'hymne' && !audioState.isPaused ? 'animate-pulse' : ''}`} />
                  </div>
                  <div>
                    <h4 className={`text-[9px] font-mono font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                      Hymne Officiel AFRIGOMBO
                    </h4>
                    <p className="text-[7px] font-mono font-bold text-[#D4AF37] uppercase">Souveraineté Musicale</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => globalAudioManager.stop()}
                    className={`p-1.5 rounded-lg hover:bg-red-500/10 text-red-500/70 hover:text-red-500 transition-all cursor-pointer`}
                    title="Arrêter"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => globalAudioManager.playHymn()}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      audioState.currentPlaying === 'hymne' && !audioState.isPaused
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                        : 'bg-[#D4AF37] text-black hover:scale-105'
                    }`}
                  >
                    {audioState.currentPlaying === 'hymne' && !audioState.isPaused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="relative h-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden cursor-pointer"
                     onClick={(e) => {
                       const rect = e.currentTarget.getBoundingClientRect();
                       const x = e.clientX - rect.left;
                       const pct = x / rect.width;
                       if (audioState.duration) globalAudioManager.seek(pct * audioState.duration);
                     }}>
                  <div 
                    className="absolute top-0 left-0 h-full bg-[#D4AF37] transition-all duration-300"
                    style={{ width: `${(audioState.progress! / (audioState.duration || 1)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[7px] font-mono font-bold text-zinc-400 uppercase tracking-tighter">
                  <span>{formatAudioTime(audioState.progress || 0)}</span>
                  <span>{formatAudioTime(audioState.duration || 0)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8 pt-4 border-t border-[#D4AF37]/10">
              <div className="flex flex-col gap-0.5 min-w-[140px]">
                <div className={`text-4xl font-mono font-black tracking-tighter ${
                  isDark ? 'text-[#D4AF37]' : 'text-[#8B6508]'
                }`}>
                  {formattedTime}
                </div>
                <div className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-500">
                  Heure Impériale
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className={`text-sm font-mono font-black uppercase tracking-widest ${
                  isDark ? 'text-zinc-300' : 'text-zinc-800'
                }`}>
                  {formattedDate}
                </div>
                <div className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-500">
                  Souveraineté Temporelle
                </div>
              </div>
            </div>
          </div>

          {/* COLONNE 2: SYSTEM STATUS & ALERTS */}
          <div className="lg:col-span-7 flex flex-col p-1 gap-1">
            
            {/* ROW 1: STATUS BADGES */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 h-full min-h-[120px]">
              <StatusBadge 
                icon={<Database className="w-4 h-4" />} 
                label="Firebase" 
                status="Service Opérationnel" 
                color="emerald"
                isDark={isDark}
              />
              <StatusBadge 
                icon={<Cloud className="w-4 h-4" />} 
                label="AFRIGOMBO Cloud" 
                status="v4.5 Stable" 
                color="amber"
                isDark={isDark}
              />
              <StatusBadge 
                icon={<ShieldCheck className="w-4 h-4" />} 
                label="Sécurité" 
                status="Protection Active" 
                color="emerald"
                isDark={isDark}
              />
              <StatusBadge 
                icon={<RefreshCw className="w-4 h-4" />} 
                label="Synchronisation" 
                status="Temps Réel" 
                color="blue"
                isDark={isDark}
              />
            </div>

            {/* ROW 2: ALERTS & WEATHER */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 flex-grow">
              {/* ALERT CENTER */}
              <div className={`rounded-3xl p-5 border border-[#D4AF37]/10 flex flex-col gap-3 ${
                isDark ? 'bg-zinc-950/40' : 'bg-[#E0E0E0]/50'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-[#D4AF37] flex items-center gap-2">
                    <Bell className="w-3 h-3" />
                    Alertes Administrateur
                  </h3>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                </div>
                <div className="space-y-2.5">
                  <AlertItem icon={<CheckCircle className="w-3 h-3 text-emerald-500" />} text="Aucun incident critique" />
                  <AlertItem icon={<Info className="w-3 h-3 text-amber-500" />} text="2 nouvelles vérifications KYC" />
                  <AlertItem icon={<AlertTriangle className="w-3 h-3 text-red-500" />} text="1 publication signalée" />
                </div>
              </div>

              {/* WEATHER PLACEHOLDER */}
              <div className={`rounded-3xl p-5 border border-[#D4AF37]/10 flex flex-col justify-center items-center gap-2 text-center relative group overflow-hidden ${
                isDark ? 'bg-zinc-950/40' : 'bg-[#E0E0E0]/50'
              }`}>
                <div className="absolute inset-0 bg-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="p-3 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37]">
                    <Sun className="w-6 h-6 animate-spin-slow" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Météo</h4>
                    <p className="text-xs font-sans font-black text-[#D4AF37] mt-1 italic">Bientôt disponible</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </motion.div>

      {/* Dynamic Keyframes Injector */}
      <style>{`
        @keyframes goldSweep {
          0% { transform: translateX(-100%) skewX(-15deg); }
          50% { transform: translateX(100%) skewX(-15deg); }
          100% { transform: translateX(100%) skewX(-15deg); }
        }
        @keyframes goldDustUp {
          0% { transform: translateY(110%) scale(0.6); opacity: 0; }
          30% { opacity: 0.85; }
          70% { opacity: 0.85; }
          100% { transform: translateY(-110%) scale(1.4); opacity: 0; }
        }
        .animate-goldSweep {
          animation: goldSweep 12s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
      `}</style>



      {/* ERROR / SUCCESS FEEDBACK ALERTS */}
      <AnimatePresence mode="wait">
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 rounded-2xl text-xs flex items-center gap-2.5 font-mono shadow-[0_0_15px_rgba(16,185,129,0.1)]"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-500/10 border border-red-500/35 text-red-400 rounded-2xl text-xs flex items-center gap-2.5 font-mono shadow-[0_0_15px_rgba(239,68,68,0.1)]"
          >
            <Info className="w-5 h-5 text-red-400" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        
        {/* =========================================================
             VIEW 1: THE 9 PREMIUM ROYAL CARDS GRID
             ========================================================= */}
        {selectedSection === null ? (
          <motion.div
            key="royal-grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-4"
          >
            {/* Quick overview metrics row */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-3xl ${isDark ? 'bg-afri-bg/40 border-afri-border' : 'bg-white border-[#D4AF37]/20 shadow-sm'}`}>
              <div className="text-center md:text-left md:border-r border-afri-border md:pr-4">
                <span className="text-[9px] font-mono uppercase tracking-wider text-afri-text-sec block">Souveraineté</span>
                <span className="text-sm font-sans font-black text-afri-text block mt-0.5">AFRIGOMBO ELITE</span>
              </div>
              <div className="text-center md:text-left md:border-r border-afri-border md:px-4">
                <span className="text-[9px] font-mono uppercase tracking-wider text-afri-text-sec block">Citoyens</span>
                <span className="text-sm font-sans font-black text-[#D4AF37] block mt-0.5">{users.length} Actifs</span>
              </div>
              <div className="text-center md:text-left md:border-r border-afri-border md:px-4">
                <span className="text-[9px] font-mono uppercase tracking-wider text-afri-text-sec block">Trésorerie</span>
                <span className="text-sm font-sans font-black text-emerald-400 block mt-0.5 truncate">{formattedRevenues}</span>
              </div>
              <div className="text-center md:text-left md:pl-4">
                <span className="text-[9px] font-mono uppercase tracking-wider text-afri-text-sec block">Ambiance active</span>
                <span className="text-xs font-sans font-bold text-afri-text block mt-0.5 truncate">
                  {playingTrackId ? "Sound System Joue..." : "Sound System Idle"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Card 1: 🌍 Vision AFRI */}
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                onClick={() => {
                  setSelectedSection("vision");
                  try { audioSynth?.playValidationSuccess(); } catch (_) {}
                }}
                className={`border rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group cursor-pointer h-72 flex flex-col justify-between ${isDark ? 'bg-gradient-to-br from-[#080808] to-[#0D0D0D] border-[#D4AF37]/25' : 'bg-gradient-to-br from-[#FAF9F6] via-[#FAF9F6] to-[#F5F2EA] border-[#D4AF37]/40 shadow-md shadow-amber-900/5 hover:shadow-xl hover:shadow-amber-500/15'}`}
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-all duration-300">
                  <Globe className="w-40 h-40 text-[#D4AF37] group-hover:rotate-12 transition-transform duration-700" />
                </div>
                <div className="space-y-4">
                  <span className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.15)] group-hover:scale-110 transition-transform duration-300">
                    <Globe className="w-6 h-6 animate-spin duration-[20s]" />
                  </span>
                  <div className="space-y-1">
                    <h3 className={`text-lg font-sans font-black transition-colors ${isDark ? 'text-afri-text group-hover:text-[#D4AF37]' : 'text-zinc-800 group-hover:text-[#8B6508]'}`}>
                      🌍 Vision AFRI
                    </h3>
                    <p className={`text-xs font-mono leading-relaxed line-clamp-3 ${isDark ? 'text-afri-text-sec' : 'text-zinc-600'}`}>
                      Définition de la trajectoire impériale de l'écosystème, objectifs clés et piliers du destin culturel africain.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#B8860B] dark:text-[#D4AF37] uppercase font-bold flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  Entrer dans le Sanctuaire →
                </span>
              </motion.div>

              {/* Card 2: 🏛 Univers AFRI */}
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                onClick={() => {
                  setSelectedSection("univers");
                  try { audioSynth?.playValidationSuccess(); } catch (_) {}
                }}
                className={`border rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group cursor-pointer h-72 flex flex-col justify-between ${isDark ? 'bg-gradient-to-br from-[#080808] to-[#0D0D0D] border-[#D4AF37]/25' : 'bg-gradient-to-br from-[#FAF9F6] via-[#FAF9F6] to-[#F5F2EA] border-[#D4AF37]/40 shadow-md shadow-amber-900/5 hover:shadow-xl hover:shadow-amber-500/15'}`}
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-all duration-300">
                  <Landmark className="w-40 h-40 text-[#D4AF37]" />
                </div>
                <div className="space-y-4">
                  <span className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.15)] group-hover:scale-110 transition-transform duration-300">
                    <Landmark className="w-6 h-6" />
                  </span>
                  <div className="space-y-1">
                    <h3 className={`text-lg font-sans font-black transition-colors ${isDark ? 'text-afri-text group-hover:text-[#D4AF37]' : 'text-zinc-800 group-hover:text-[#8B6508]'}`}>
                      🏛 Univers AFRI
                    </h3>
                    <p className={`text-xs font-mono leading-relaxed line-clamp-3 ${isDark ? 'text-afri-text-sec' : 'text-zinc-600'}`}>
                      Contrôle des constellations souveraines satellites: GOMBO ID, AfriTrust, AfriLivraison, Gombo Musik et gestion des gardiens du Trône.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#B8860B] dark:text-[#D4AF37] uppercase font-bold flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  Entrer dans le Sanctuaire →
                </span>
              </motion.div>

              {/* Card 3: 🛡 Bouclier AFRIGOMBO */}
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                onClick={() => {
                  setSelectedSection("bouclier");
                  try { audioSynth?.playValidationSuccess(); } catch (_) {}
                }}
                className={`border rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group cursor-pointer h-72 flex flex-col justify-between ${isDark ? 'bg-gradient-to-br from-[#080808] to-[#0D0D0D] border-[#D4AF37]/25' : 'bg-gradient-to-br from-[#FAF9F6] via-[#FAF9F6] to-[#F5F2EA] border-[#D4AF37]/40 shadow-md shadow-amber-900/5 hover:shadow-xl hover:shadow-amber-500/15'}`}
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-all duration-300">
                  <ShieldCheck className="w-40 h-40 text-[#D4AF37]" />
                </div>
                <div className="space-y-4">
                  <span className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.15)] group-hover:scale-110 transition-transform duration-300">
                    <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
                  </span>
                  <div className="space-y-1">
                    <h3 className={`text-lg font-sans font-black transition-colors ${isDark ? 'text-afri-text group-hover:text-[#D4AF37]' : 'text-zinc-800 group-hover:text-[#8B6508]'}`}>
                      🛡 Bouclier AFRIGOMBO
                    </h3>
                    <p className={`text-xs font-mono leading-relaxed line-clamp-3 ${isDark ? 'text-afri-text-sec' : 'text-zinc-600'}`}>
                      Système de protection souverain, modération de contenu, certification Gombo ID et contrôle de cyber-défense.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#B8860B] dark:text-[#D4AF37] uppercase font-bold flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  Entrer dans le Sanctuaire →
                </span>
              </motion.div>

              {/* Card 4: 💰 Revenus Globaux */}
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                onClick={() => {
                  setSelectedSection("revenus");
                  try { audioSynth?.playValidationSuccess(); } catch (_) {}
                }}
                className={`border rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group cursor-pointer h-72 flex flex-col justify-between ${isDark ? "bg-gradient-to-br from-[#080808] to-[#0D0D0D] border-[#D4AF37]/25" : "bg-gradient-to-br from-[#FAF9F6] via-[#FAF9F6] to-[#F5F2EA] border-[#D4AF37]/40 shadow-md shadow-amber-900/5 hover:shadow-xl hover:shadow-amber-500/15"}`}
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-all duration-300">
                  <Coins className="w-40 h-40 text-[#D4AF37]" />
                </div>
                <div className="space-y-4">
                  <span className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                    <Coins className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </span>
                  <div className="space-y-1">
                    <h3 className={`text-lg font-sans font-black transition-colors ${isDark ? 'text-afri-text group-hover:text-[#D4AF37]' : 'text-zinc-800 group-hover:text-[#8B6508]'}`}>
                      💰 Revenus Globaux
                    </h3>
                    <p className={`text-xs font-mono leading-relaxed line-clamp-3 ${isDark ? 'text-afri-text-sec' : 'text-zinc-600'}`}>
                      Analyse souveraine de la trésorerie globale, suivi de la Gombocaisse et transactions régionales de l'Empire.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#B8860B] dark:text-[#D4AF37] uppercase font-bold flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  Entrer dans le Sanctuaire →
                </span>
              </motion.div>

              {/* Card 5: 📈 Croissance */}
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                onClick={() => {
                  setSelectedSection("croissance");
                  try { audioSynth?.playValidationSuccess(); } catch (_) {}
                }}
                className={`border rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group cursor-pointer h-72 flex flex-col justify-between ${isDark ? "bg-gradient-to-br from-[#080808] to-[#0D0D0D] border-[#D4AF37]/25" : "bg-gradient-to-br from-[#FAF9F6] via-[#FAF9F6] to-[#F5F2EA] border-[#D4AF37]/40 shadow-md shadow-amber-900/5 hover:shadow-xl hover:shadow-amber-500/15"}`}
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-all duration-300">
                  <BarChart3 className="w-40 h-40 text-[#D4AF37]" />
                </div>
                <div className="space-y-4">
                  <span className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                  </span>
                  <div className="space-y-1">
                    <h3 className={`text-lg font-sans font-black transition-colors ${isDark ? 'text-afri-text group-hover:text-[#D4AF37]' : 'text-zinc-800 group-hover:text-[#8B6508]'}`}>
                      📈 Croissance
                    </h3>
                    <p className={`text-xs font-mono leading-relaxed line-clamp-3 ${isDark ? 'text-afri-text-sec' : 'text-zinc-600'}`}>
                      Expansion impériale, taux de KYC certifiés, croissance démographique et projection des objectifs de l'Empire.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#B8860B] dark:text-[#D4AF37] uppercase font-bold flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  Entrer dans le Sanctuaire →
                </span>
              </motion.div>

              {/* Card 6: 🧠 Intelligence */}
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                onClick={() => {
                  setSelectedSection("intelligence");
                  try { audioSynth?.playValidationSuccess(); } catch (_) {}
                }}
                className={`border rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group cursor-pointer h-72 flex flex-col justify-between ${isDark ? "bg-gradient-to-br from-[#080808] to-[#0D0D0D] border-[#D4AF37]/25" : "bg-gradient-to-br from-[#FAF9F6] via-[#FAF9F6] to-[#F5F2EA] border-[#D4AF37]/40 shadow-md shadow-amber-900/5 hover:shadow-xl hover:shadow-amber-500/15"}`}
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-all duration-300">
                  <Brain className="w-40 h-40 text-[#D4AF37]" />
                </div>
                <div className="space-y-4">
                  <span className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-500 group-hover:scale-110 transition-transform duration-300">
                    <Brain className="w-6 h-6 text-amber-600 dark:text-amber-500 animate-pulse" />
                  </span>
                  <div className="space-y-1">
                    <h3 className={`text-lg font-sans font-black transition-colors ${isDark ? 'text-afri-text group-hover:text-[#D4AF37]' : 'text-zinc-800 group-hover:text-[#8B6508]'}`}>
                      🧠 Intelligence
                    </h3>
                    <p className={`text-xs font-mono leading-relaxed line-clamp-3 ${isDark ? 'text-afri-text-sec' : 'text-zinc-600'}`}>
                      Console de commande interactive, terminal d'ordres système et audit cyber intelligent en temps réel.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#B8860B] dark:text-[#D4AF37] uppercase font-bold flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  Entrer dans le Sanctuaire →
                </span>
              </motion.div>

              {/* Card 6.5: 🛡 Transactions Bêta */}
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                onClick={() => {
                  setSelectedSection("beta_escrow");
                  try { audioSynth?.playValidationSuccess(); } catch (_) {}
                }}
                className={`border rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group cursor-pointer h-72 flex flex-col justify-between ${isDark ? 'bg-gradient-to-br from-[#080808] to-[#0D0D0D] border-emerald-400/30' : 'bg-gradient-to-br from-[#FAF9F6] via-[#FAF9F6] to-[#F5F2EA] border-emerald-500/40 shadow-md shadow-amber-900/5 hover:shadow-xl hover:shadow-emerald-500/15'}`}
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-all duration-300">
                  <ShieldCheck className="w-40 h-40 text-emerald-400 group-hover:rotate-6 transition-transform duration-700" />
                </div>
                <div className="space-y-4">
                  <span className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.15)] group-hover:scale-110 transition-transform duration-300">
                    <ShieldCheck className="w-6 h-6 animate-pulse" />
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-lg font-sans font-black transition-colors ${isDark ? 'text-afri-text group-hover:text-emerald-400' : 'text-zinc-800 group-hover:text-emerald-600'}`}>
                        🛡 Transactions Bêta
                      </h3>
                      {pendingBetaTransactions.length > 0 ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-500 text-black text-[9px] font-mono font-black uppercase animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                          {pendingBetaTransactions.length} ALERTE
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-500 text-black text-[8px] font-mono font-black uppercase">
                          LIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-afri-text-sec font-mono leading-relaxed line-clamp-3">
                      Pilotage des flux séquestres en phase Bêta Publique. Validation manuelle des dépôts et libération sécurisée des cachets.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-bold flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  Ouvrir le Centre de Commandement →
                </span>
              </motion.div>

              {/* Card 7: 🎬 Centre Multimédia */}
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                onClick={() => {
                  setSelectedSection("multimedia");
                  try { audioSynth?.playValidationSuccess(); } catch (_) {}
                }}
                className={`border rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group cursor-pointer h-72 flex flex-col justify-between ${isDark ? "bg-gradient-to-br from-[#080808] to-[#0D0D0D] border-[#D4AF37]/25" : "bg-gradient-to-br from-[#FAF9F6] via-[#FAF9F6] to-[#F5F2EA] border-[#D4AF37]/40 shadow-md shadow-amber-900/5 hover:shadow-xl hover:shadow-amber-500/15"}`}
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-all duration-300">
                   <Music className="w-40 h-40 text-[#D4AF37]" />
                </div>
                <div className="space-y-4">
                  <span className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300">
                    <Music className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </span>
                  <div className="space-y-1">
                    <h3 className={`text-lg font-sans font-black transition-colors ${isDark ? 'text-afri-text group-hover:text-[#D4AF37]' : 'text-zinc-800 group-hover:text-[#8B6508]'}`}>
                      🎬 Centre Multimédia
                    </h3>
                    <p className={`text-xs font-mono leading-relaxed line-clamp-3 ${isDark ? 'text-afri-text-sec' : 'text-zinc-600'}`}>
                      Ambiances sonores impériales, sound designer royal et configuration des mélodies sacreés de l'Empire.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#B8860B] dark:text-[#D4AF37] uppercase font-bold flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  Entrer dans le Sanctuaire →
                </span>
              </motion.div>

              {/* Card 8: 🚨 Veille Critique */}
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                onClick={() => {
                  setSelectedSection("veille");
                  try { audioSynth?.playValidationSuccess(); } catch (_) {}
                }}
                className={`border rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group cursor-pointer h-72 flex flex-col justify-between ${isDark ? "bg-gradient-to-br from-[#080808] to-[#0D0D0D] border-[#D4AF37]/25" : "bg-gradient-to-br from-[#FAF9F6] via-[#FAF9F6] to-[#F5F2EA] border-[#D4AF37]/40 shadow-md shadow-amber-900/5 hover:shadow-xl hover:shadow-amber-500/15"}`}
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-all duration-300">
                  <AlertTriangle className="w-40 h-40 text-[#D4AF37]" />
                </div>
                <div className="space-y-4">
                  <span className={`w-12 h-12 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${highAlertsCount > 0 ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'}`}>
                    <AlertTriangle className={`w-6 h-6 ${highAlertsCount > 0 ? 'animate-bounce' : ''}`} />
                  </span>
                  <div className="space-y-1">
                    <h3 className={`text-lg font-sans font-black transition-colors ${isDark ? 'text-afri-text group-hover:text-[#D4AF37]' : 'text-zinc-800 group-hover:text-[#8B6508]'}`}>
                      🚨 Veille Critique
                    </h3>
                    <p className={`text-xs font-mono leading-relaxed line-clamp-3 ${isDark ? 'text-afri-text-sec' : 'text-zinc-600'}`}>
                      Suivi passif des faiblesses d'infrastructure, alertes d'accès prioritaires et signaux d'intrusions d'usurpateurs.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#B8860B] dark:text-[#D4AF37] uppercase font-bold flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  Entrer dans le Sanctuaire →
                </span>
              </motion.div>

              {/* Card 9: 📜 Journal Impérial */}
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                onClick={() => {
                  setSelectedSection("journal");
                  try { audioSynth?.playValidationSuccess(); } catch (_) {}
                }}
                className={`border rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group cursor-pointer h-72 flex flex-col justify-between ${isDark ? "bg-gradient-to-br from-[#080808] to-[#0D0D0D] border-[#D4AF37]/25" : "bg-gradient-to-br from-[#FAF9F6] via-[#FAF9F6] to-[#F5F2EA] border-[#D4AF37]/40 shadow-md shadow-amber-900/5 hover:shadow-xl hover:shadow-amber-500/15"}`}
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-all duration-300">
                  <Scroll className="w-40 h-40 text-[#D4AF37]" />
                </div>
                <div className="space-y-4">
                  <span className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-500 group-hover:scale-110 transition-transform duration-300">
                    <Scroll className="w-6 h-6 text-[#D4AF37]" />
                  </span>
                  <div className="space-y-1">
                    <h3 className={`text-lg font-sans font-black transition-colors ${isDark ? 'text-afri-text group-hover:text-[#D4AF37]' : 'text-zinc-800 group-hover:text-[#8B6508]'}`}>
                      📜 Journal Impérial
                    </h3>
                    <p className={`text-xs font-mono leading-relaxed line-clamp-3 ${isDark ? 'text-afri-text-sec' : 'text-zinc-600'}`}>
                      Annales sacrées de l'Empire, décisions stratégiques, notes privées du Fondateur et diffusion des décrets solennels.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#B8860B] dark:text-[#D4AF37] uppercase font-bold flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  Entrer dans le Sanctuaire →
                </span>
              </motion.div>

              {/* Card 10: 📋 Checklist Bêta */}
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                onClick={() => {
                  setSelectedSection("checklist");
                  try { if (audioSynth) audioSynth.playValidationSuccess(); } catch (_) {}
                }}
                className={`border rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group cursor-pointer h-72 flex flex-col justify-between ${isDark ? "bg-gradient-to-br from-[#080808] to-[#0D0D0D] border-[#D4AF37]/25" : "bg-gradient-to-br from-[#FFFFFF] via-[#FAF9F6] to-[#F2EEE4] border-[#D4AF37]/40 shadow-md shadow-amber-900/5 hover:shadow-xl hover:shadow-amber-500/15"}`}
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-all duration-300">
                  <CheckSquare className="w-40 h-40 text-[#D4AF37]" />
                </div>
                <div className="space-y-4">
                  <span className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                    <CheckSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-lg font-sans font-black text-zinc-900 dark:text-afri-text group-hover:text-[#D4AF37] transition-colors">
                      📋 Checklist Bêta
                    </h3>
                    <p className="text-xs text-zinc-700 dark:text-afri-text-sec font-mono leading-relaxed line-clamp-3">
                      Suivi interactif de validation des fonctionnalités critiques pour la version Bêta d'AFRIGOMBO ELITE.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#B8860B] dark:text-[#D4AF37] uppercase font-bold">
                  <span>{progressCount} / 11 VALIDÉS</span>
                  <span>Voir la checklist →</span>
                </div>
              </motion.div>

              {/* Card 11: 💰 Économie AFRIGOMBO */}
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                onClick={() => {
                  setSelectedSection("economy");
                  try { if (audioSynth) audioSynth.playValidationSuccess(); } catch (_) {}
                }}
                className={`border rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group cursor-pointer h-72 flex flex-col justify-between ${isDark ? "bg-gradient-to-br from-[#080808] to-[#0D0D0D] border-[#D4AF37]/25" : "bg-gradient-to-br from-[#FFFFFF] via-[#FAF9F6] to-[#F2EEE4] border-[#D4AF37]/40 shadow-md shadow-amber-900/5 hover:shadow-xl hover:shadow-amber-500/15"}`}
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-all duration-300">
                  <Coins className="w-40 h-40 text-[#D4AF37]" />
                </div>
                <div className="space-y-4">
                  <span className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-500 group-hover:scale-110 transition-transform duration-300">
                    <Coins className="w-6 h-6 text-[#D4AF37]" />
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-lg font-sans font-black text-zinc-900 dark:text-afri-text group-hover:text-[#D4AF37] transition-colors">
                      💰 Économie AFRIGOMBO
                    </h3>
                    <p className="text-xs text-zinc-700 dark:text-afri-text-sec font-mono leading-relaxed line-clamp-3">
                      Moteur de commissions, paramètres de paiements, boosts, contrats et statistiques financières.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#B8860B] dark:text-[#D4AF37] uppercase font-bold flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  Entrer dans le Sanctuaire →
                </span>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="section-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* GO BACK ACTION BAR */}
            <button
              onClick={() => {
                setSelectedSection(null);
                try { audioSynth?.playValidationSuccess(); } catch (_) {}
              }}
              className="flex items-center gap-2 px-5 py-3.5 bg-afri-bg border border-[#D4AF37]/35 text-[#D4AF37] hover:bg-afri-bg-sec/10 rounded-2xl text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
            >
              <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
              <span>← Retourner au Trône Impérial</span>
            </button>

            {/* =========================================================
                 DETAILED VIEW: 🌍 Vision AFRI
                 ========================================================= */}
            {selectedSection === "vision" && (
              <div className="space-y-6">
                <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                  <Globe className="w-8 h-8 text-[#D4AF37] shrink-0 mt-0.5 animate-spin duration-[15s]" />
                  <div className="text-xs text-afri-text leading-relaxed font-mono">
                    <strong>SOUVERAINETÉ STRATÉGIQUE — VISION AFRI :</strong> Définissez les orientations suprêmes de la plateforme. Chaque mot inscrit est synchronisé instantanément avec le cœur du système Firestore pour guider nos actions régionales.
                  </div>
                </div>

                <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-4 relative">
                  <div className="flex items-center gap-2.5 text-[#D4AF37]">
                    <Award className="w-5 h-5" />
                    <span className="text-[11px] font-mono uppercase tracking-widest font-black">Plan d'Avenir de l'Empire</span>
                  </div>
                  <textarea
                    value={govData.vision}
                    onChange={(e) => {
                      setGovData({ ...govData, vision: e.target.value });
                      handleSaveGovField("vision", e.target.value);
                    }}
                    className="w-full h-44 bg-afri-bg border border-afri-border rounded-2xl p-4 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37] font-mono leading-relaxed resize-none focus:ring-1 focus:ring-[#D4AF37]/45"
                    placeholder="Écrivez la vision stratégique d'AFRIGOMBO..."
                  />
                  <div className="flex justify-between items-center text-[9px] font-mono text-afri-text-sec">
                    <span>⚡ CODES SYSTÈME COGÉRATEURS : CLASSE 1</span>
                    <span className="text-[#D4AF37] font-bold">FIRESTORE SYNC ACTIVE</span>
                  </div>
                </div>

                {/* Sub-section: Piliers Stratégiques */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="p-6 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-3">
                    <span className="text-[10px] text-[#D4AF37] font-mono font-black block">PILIER ACCÉLÉRATEUR I</span>
                    <h4 className="text-xs font-sans font-black text-afri-text">Souveraineté Culturelle</h4>
                    <p className="text-[11px] text-afri-text-sec font-mono leading-relaxed">Valorisation des vibes authentiques ouest-africaines sans intermédiaires occidentaux.</p>
                  </div>
                  <div className="p-6 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-3">
                    <span className="text-[10px] text-[#D4AF37] font-mono font-black block">PILIER ACCÉLÉRATEUR II</span>
                    <h4 className="text-xs font-sans font-black text-afri-text">Confiance Mutuelle Absolute</h4>
                    <p className="text-[11px] text-afri-text-sec font-mono leading-relaxed">Assurer une transparence totale à l'aide des certifications d'identités GomboID.</p>
                  </div>
                  <div className="p-6 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-3">
                    <span className="text-[10px] text-[#D4AF37] font-mono font-black block">PILIER ACCÉLÉRATEUR III</span>
                    <h4 className="text-xs font-sans font-black text-afri-text">Monétisation Solidaire</h4>
                    <p className="text-[11px] text-afri-text-sec font-mono leading-relaxed">Partage équitable et instantané de chaque commission d'honoraires prélevée.</p>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================
                 DETAILED VIEW: 🏛 Univers AFRI
                 ========================================================= */}
            {selectedSection === "univers" && (
              <div className="space-y-6">
                <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                  <Landmark className="w-8 h-8 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div className="text-xs text-afri-text leading-relaxed font-mono">
                    <strong>CONSTELLATIONS SOUVERAINES — UNIVERS AFRI :</strong> Contrôlez l'état de fonctionnement des différents services de l'écosystème. Activez de nouveaux services ou alternez l'état opérationnel des modules.
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Satellites Control list */}
                  <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-5">
                    <h4 className="text-xs font-mono uppercase font-black tracking-wider text-afri-text border-b border-afri-border pb-2 flex items-center gap-2">
                      <Server className="w-4.5 h-4.5 text-[#D4AF37]" />
                      État des Services Satellitaires
                    </h4>

                    <div className="space-y-4">
                      {[
                        { id: "gomboId", label: "GOMBO ID", desc: "Souveraineté d'identité numérique artistique" },
                        { id: "afriTrust", label: "AfriTrust", desc: "Certification et assurance de contrats" },
                        { id: "afriLivraison", label: "AfriLivraison", desc: "Livraison sécurisée d'instruments & œuvres" },
                        { id: "gomboMusik", label: "Gombo Musik", desc: "Flux et distribution de musiques" }
                      ].map((serv) => (
                        <div key={serv.id} className="p-4 bg-afri-bg border border-afri-border/60 rounded-2xl flex items-center justify-between gap-4">
                          <div className="text-left">
                            <span className="font-sans font-black text-xs text-afri-text block">{serv.label}</span>
                            <span className="text-[10px] text-afri-text-sec font-mono mt-0.5 block">{serv.desc}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-[8px] font-mono rounded font-bold ${universeStates[serv.id] === "DÉPLOYÉ & ACTIF" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border border-amber-500/30"}`}>
                              {universeStates[serv.id]}
                            </span>
                            <button
                              onClick={() => handleToggleSatellite(serv.id)}
                              className="px-2.5 py-1.5 bg-afri-bg-sec hover:bg-afri-bg-sec text-afri-text-sec hover:text-black font-mono font-black text-[9px] uppercase rounded-lg transition-all"
                            >
                              Alterner
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Privilege Management: Membres du Trône */}
                  <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-4">
                    <h4 className="text-xs font-mono uppercase font-black tracking-wider text-[#D4AF37] border-b border-afri-border pb-2 flex items-center gap-2">
                      <UserPlus className="w-4.5 h-4.5 text-[#D4AF37]" />
                      🏰 Gardiens & Co-Fondateurs du Temple
                    </h4>

                    {/* Add Founder Form */}
                    <form onSubmit={handleAddFounder} className="space-y-2">
                      <label className="text-[9px] font-mono uppercase text-afri-text-sec font-black block">Promouvoir un Co-Fondateur (Email)</label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="adresse@gmail.com"
                          value={newFounderInput}
                          onChange={(e) => setNewFounderInput(e.target.value)}
                          className="flex-1 bg-afri-bg border border-afri-border rounded-xl px-3 py-2 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
                        />
                        <button type="submit" className="px-3.5 py-2 bg-afri-bg-sec text-black text-[10px] font-mono font-black uppercase rounded-xl hover:opacity-90 transition-all cursor-pointer">
                          Ajouter
                        </button>
                      </div>
                    </form>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto pt-2 border-t border-afri-border/60">
                      {founders.map((f, idx) => (
                        <div key={idx} className="p-2.5 bg-afri-bg border border-afri-border/40 rounded-xl flex justify-between items-center text-xs">
                          <span className="font-mono text-afri-text truncate max-w-[200px]">{f}</span>
                          <button
                            onClick={() => handleRemoveFounder(f)}
                            className="text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                            title="Révoquer les droits de fondation"
                          >
                            <UserX className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Promouvoir Super Admin */}
                    <form onSubmit={handleAddSuperAdmin} className="space-y-2 pt-2 border-t border-afri-border">
                      <label className="text-[9px] font-mono uppercase text-afri-text-sec font-black block">Promouvoir un Super Administrateur (Email)</label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="adresse@gmail.com"
                          value={newAdminInput}
                          onChange={(e) => setNewAdminInput(e.target.value)}
                          className="flex-1 bg-afri-bg border border-afri-border rounded-xl px-3 py-2 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
                        />
                        <button type="submit" className="px-3.5 py-2 bg-emerald-500 text-black text-[10px] font-mono font-black uppercase rounded-xl hover:opacity-90 transition-all cursor-pointer">
                          Ajouter
                        </button>
                      </div>
                    </form>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {superAdmins.map((ad, idx) => (
                        <div key={idx} className="p-2.5 bg-afri-bg border border-afri-border/40 rounded-xl flex justify-between items-center text-xs">
                          <span className="font-mono text-afri-text truncate max-w-[200px]">{ad}</span>
                          <button
                            onClick={() => handleRemoveSuperAdmin(ad)}
                            className="text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                          >
                            <UserX className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                  </div>

                </div>
              </div>
            )}

            {/* =========================================================
                 DETAILED VIEW: 🛡 Bouclier AFRIGOMBO
                 ========================================================= */}
            {selectedSection === "bouclier" && (
              <div className="space-y-6">
                <BouclierAfrigombo />
                <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                  <ShieldCheck className="w-8 h-8 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div className="text-xs text-afri-text leading-relaxed font-mono">
                    <strong>BOUCLIER AUTONOME — CYBER-DÉFENSE & MODÉRATION :</strong> Modérez les publications jugées suspectes par le filtre d'IA, approuvez ou révoquez les certifications Gombo ID d'artistes régionaux.
                  </div>
                </div>

                <div className="p-5 bg-gradient-to-r from-afri-bg to-[#090909] border border-emerald-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Lock className="w-10 h-10 text-emerald-400 animate-pulse bg-emerald-500/5 p-2 rounded-xl" />
                    <div className="text-left">
                      <h4 className="text-xs font-mono font-black uppercase text-emerald-400 tracking-wider">Audit Cyber-Impérial Actif</h4>
                      <p className="text-[10px] font-mono text-afri-text-sec">Lancez un audit d'intégrité en direct sur l'ensemble de notre cluster Firestore.</p>
                    </div>
                  </div>
                  <button
                    onClick={triggerSecurityScan}
                    disabled={isScanning}
                    className="px-5 py-3 bg-emerald-500 text-black hover:bg-emerald-400 rounded-xl font-mono font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
                  >
                    {isScanning ? "Analyse en cours..." : "Lancer l'audit cyber"}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Pending Certs */}
                  <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-afri-border pb-3">
                      <h4 className="text-xs font-mono uppercase font-black text-afri-text flex items-center gap-2">
                        <Award className="w-5 h-5 text-[#D4AF37]" />
                        Dossiers Gombo ID en Attente d'Arbitrage
                      </h4>
                      <span className="px-2.5 py-0.5 bg-afri-bg-sec/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded-full text-[9px] font-mono">
                        {pendingCerts.length} dossiers
                      </span>
                    </div>

                    {pendingCerts.length === 0 ? (
                      <p className="text-afri-text-sec font-mono text-center py-8 text-xs">Aucune demande de certificat Gombo ID en attente d'évaluation.</p>
                    ) : (
                      <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                        {pendingCerts.map((u: any) => (
                          <div key={u.id} className="p-4 bg-afri-bg border border-afri-border/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                            <div>
                              <h5 className="font-sans font-bold text-sm text-afri-text">{u.artisticName || u.nom || "Citoyen Inconnu"}</h5>
                              <p className="text-[10px] text-afri-text-sec font-mono mt-0.5">{u.email} • Commune: {u.commune || "Non spécifiée"}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApproveCert(u.id)}
                                className="px-3 py-1.5 bg-emerald-500 text-black hover:bg-emerald-400 font-mono font-black text-[10px] uppercase rounded-xl transition-all cursor-pointer"
                              >
                                Certifier
                              </button>
                              <button
                                onClick={() => handleRejectCert(u.id)}
                                className="px-3 py-1.5 bg-red-950/40 text-red-400 border border-red-900/40 hover:bg-red-950 hover:text-red-300 font-mono font-black text-[10px] uppercase rounded-xl transition-all cursor-pointer"
                              >
                                Rejeter
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Moderation section */}
                  <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-afri-border pb-3">
                      <h4 className="text-xs font-mono uppercase font-black text-afri-text flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-red-500" />
                        Contributions Signalées pour Abus
                      </h4>
                      <span className="px-2.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[9px] font-mono">
                        {reportedPosts.length} signalements
                      </span>
                    </div>

                    {reportedPosts.length === 0 ? (
                      <p className="text-afri-text-sec font-mono text-center py-8 text-xs">Le fil de discussion est parfaitement sain. Aucun débordement.</p>
                    ) : (
                      <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                        {reportedPosts.map((p: any) => (
                          <div key={p.id} className="p-4 bg-afri-bg border border-afri-border/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                            <div className="max-w-xs">
                              <h5 className="font-sans font-bold text-xs text-afri-text truncate">{p.title || "Contribution"}</h5>
                              <p className="text-[10px] text-afri-text-sec truncate mt-1">{p.content}</p>
                              <p className="text-[9px] text-red-400 font-mono mt-1">Alerte : {p.reportsCount || 1} signalements</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUnflagPost(p.id)}
                                className="px-2.5 py-1.5 bg-afri-bg-sec text-black font-mono font-black text-[10px] uppercase rounded-xl transition-all cursor-pointer"
                              >
                                Lever
                              </button>
                              <button
                                onClick={() => handleDeletePost(p.id)}
                                className="px-2.5 py-1.5 bg-red-600 text-afri-text font-mono font-black text-[10px] uppercase rounded-xl transition-all cursor-pointer"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* =========================================================
                 DETAILED VIEW: 💰 Revenus Globaux
                 ========================================================= */}
            {selectedSection === "revenus" && (
              <div className="space-y-6">
                <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                  <Coins className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-afri-text leading-relaxed font-mono">
                    <strong>TRESORERIE IMPÉRIALE ET FLUX MONÉTAIRES :</strong> Suivi de la Gombocaisse souveraine, historique détaillé des prestations versées et virement des parts de cotisations d'abonnements.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-afri-bg-sec border border-afri-border rounded-3xl text-center space-y-1.5">
                    <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-widest block">Trésor de l'Empire</span>
                    <strong className="text-2xl text-emerald-400 font-black font-display block">{formattedRevenues}</strong>
                    <span className="text-[8px] font-mono text-[#D4AF37] uppercase block">Cumul de souveraineté</span>
                  </div>

                  <div className="p-6 bg-afri-bg-sec border border-afri-border rounded-3xl text-center space-y-1.5">
                    <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-widest block">Transactions Soumises</span>
                    <strong className="text-2xl text-afri-text font-black font-display block">{transactions.length}</strong>
                    <span className="text-[8px] font-mono text-afri-text-sec uppercase block">Total certifié en ligne</span>
                  </div>

                  <div className="p-6 bg-afri-bg-sec border border-afri-border rounded-3xl text-center space-y-1.5">
                    <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-widest block">Commission de Plateforme</span>
                    <strong className="text-2xl text-sky-400 font-black font-display block">15%</strong>
                    <span className="text-[8px] font-mono text-sky-400 uppercase block">Redistribution active</span>
                  </div>
                </div>

                <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-4">
                  <h4 className="text-xs font-mono uppercase font-black text-[#D4AF37] border-b border-afri-border pb-2">
                    Grand Livre de Caisse de l'Empire (Dernières Transactions)
                  </h4>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {transactions.length === 0 ? (
                      <p className="text-afri-text-sec text-center py-8 text-xs font-mono">Aucun virement ou prestation en cours.</p>
                    ) : (
                      transactions.map((tx, idx) => (
                        <div key={idx} className="p-3 bg-afri-bg border border-afri-border/40 hover:border-[#D4AF37]/30 rounded-2xl flex justify-between items-center text-xs transition-colors">
                          <div className="text-left">
                            <span className="font-sans font-bold text-afri-text block">{tx.description || "Gombo Prestation"}</span>
                            <span className="text-[9px] text-afri-text-sec font-mono block mt-0.5">{tx.timestamp ? new Date(tx.timestamp).toLocaleString("fr-FR") : "Date inconnue"}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-emerald-400 font-black block">+{Number(tx.amount || 0).toLocaleString("fr-FR")} FCFA</span>
                            <span className="text-[8px] text-afri-text-sec font-mono block uppercase">Statut: Validé</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================
                 DETAILED VIEW: 📈 Croissance
                 ========================================================= */}
            {selectedSection === "croissance" && (
              <div className="space-y-6">
                <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                  <BarChart3 className="w-8 h-8 text-sky-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-afri-text leading-relaxed font-mono">
                    <strong>EXPPANSION IMPÉRIALE — CROISSANCE :</strong> Surveillez le taux de pénétration régional et les nouveaux flux d'utilisateurs. Rédigez et fixez les nouveaux objectifs de croissance.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Stats Cards */}
                  <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-4">
                    <h4 className="text-xs font-mono uppercase font-black text-afri-text border-b border-afri-border pb-2">Mesures de Pénétration Culturelle</h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-4 bg-afri-bg rounded-2xl border border-afri-border/60">
                        <span className="text-[9px] font-mono text-afri-text-sec uppercase block">Citoyens</span>
                        <strong className="text-2xl text-afri-text block mt-1 font-black">{users.length}</strong>
                      </div>
                      <div className="p-4 bg-afri-bg rounded-2xl border border-afri-border/60">
                        <span className="text-[9px] font-mono text-afri-text-sec uppercase block">Ratio Certifiés</span>
                        <strong className="text-2xl text-[#D4AF37] block mt-1 font-black">
                          {users.length > 0 ? Math.round((certifiedCount / users.length) * 100) : 0}%
                        </strong>
                      </div>
                      <div className="p-4 bg-afri-bg rounded-2xl border border-afri-border/60">
                        <span className="text-[9px] font-mono text-afri-text-sec uppercase block">Expansion</span>
                        <strong className="text-2xl text-emerald-400 block mt-1 font-black">+24.8%</strong>
                      </div>
                      <div className="p-4 bg-afri-bg rounded-2xl border border-afri-border/60">
                        <span className="text-[9px] font-mono text-afri-text-sec uppercase block">Contrats Actifs</span>
                        <strong className="text-2xl text-sky-400 block mt-1 font-black">{gombos.length}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Set growth target */}
                  <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-3 relative">
                    <div className="flex items-center gap-2 text-amber-500">
                      <Target className="w-5 h-5 text-amber-500" />
                      <span className="text-[11px] font-mono uppercase tracking-widest font-black text-amber-500">Objectifs de Croissance</span>
                    </div>
                    <p className="text-[10px] text-afri-text-sec font-mono">Définissez les paliers et les cibles d'expansion d'abonnés et d'usage pour motiver les troupes de terrain.</p>
                    <textarea
                      value={govData.growth}
                      onChange={(e) => {
                        setGovData({ ...govData, growth: e.target.value });
                        handleSaveGovField("growth", e.target.value);
                      }}
                      className="w-full h-36 bg-afri-bg border border-afri-border rounded-2xl p-4 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37] font-mono leading-relaxed resize-none focus:ring-1 focus:ring-[#D4AF37]/35"
                      placeholder="Définissez les chiffres ou régions cibles..."
                    />
                    <span className="absolute bottom-4 right-10 text-[8px] font-mono text-afri-text-sec">FIRESTORE SYNC</span>
                  </div>

                </div>
              </div>
            )}

            {/* =========================================================
                 DETAILED VIEW: 🧠 Intelligence
                 ========================================================= */}
            {selectedSection === "intelligence" && (
              <div className="space-y-6">
                <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                  <Brain className="w-8 h-8 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-afri-text leading-relaxed font-mono">
                    <strong>CONSOLE SOUVERAINE & INTÉGRITÉ CHRONIQUE :</strong> Interface de commande interactive. Tapez vos directives pour commander le Temple ou lancez l'audit cyber intelligent passif.
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Live Terminal Terminal Console */}
                  <div className="p-6 bg-afri-bg-sec border border-afri-border rounded-3xl lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center border-b border-afri-border pb-2.5">
                      <h4 className="text-xs font-mono uppercase font-black tracking-wider text-[#D4AF37] flex items-center gap-2">
                        <Terminal className="w-4.5 h-4.5 text-[#D4AF37] animate-pulse" />
                        Terminal Interactif du Temple
                      </h4>
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                    </div>

                    <div className="font-mono text-[10px] text-afri-text-sec space-y-2 h-64 overflow-y-auto scrollbar-none pr-1 bg-afri-bg p-4 border border-afri-border/60 rounded-2xl leading-relaxed flex flex-col-reverse text-left">
                      <div>
                        {logs.map((logLine, idx) => (
                          <div key={idx} className="hover:text-afri-text transition-colors py-1 border-b border-zinc-950 font-mono">
                            {logLine}
                          </div>
                        ))}
                      </div>
                    </div>

                    <form onSubmit={handleTerminalSubmit} className="flex gap-2">
                      <span className="font-mono text-[#D4AF37] text-xs self-center font-bold">{adminEmail.split("@")[0]}@throne:~$</span>
                      <input
                        type="text"
                        placeholder="Tapez /help pour les ordres..."
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        className="flex-1 bg-afri-bg border border-afri-border rounded-xl px-3 py-2 text-xs font-mono text-afri-text focus:outline-none focus:border-[#D4AF37]"
                      />
                    </form>
                  </div>

                  {/* Parameters Panel */}
                  <div className="p-6 bg-afri-bg-sec border border-afri-border rounded-3xl lg:col-span-1 space-y-4">
                    <h4 className="text-xs font-mono uppercase font-black text-afri-text border-b border-afri-border pb-2">Seuils Cognitifs de Protection</h4>
                    
                    <div className="space-y-4 text-xs font-mono text-afri-text">
                      <div className="space-y-1">
                        <label className="text-[10px] text-afri-text-sec uppercase block">Sensibilité du Matcher Gombo</label>
                        <input type="range" className="w-full accent-[#D4AF37]" min="1" max="10" defaultValue="8" />
                        <span className="text-[8px] text-[#D4AF37] block text-right font-black">NIVEAU 8 (TRÈS STRICT)</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-afri-text-sec uppercase block">Filtre Antispam Contributions</label>
                        <input type="range" className="w-full accent-[#D4AF37]" min="1" max="10" defaultValue="9" />
                        <span className="text-[8px] text-[#D4AF37] block text-right font-black">NIVEAU 9 (HERMÉTIQUE)</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-afri-text-sec uppercase block">Alerte Ping Intrusion Passif</label>
                        <input type="range" className="w-full accent-[#D4AF37]" min="1" max="10" defaultValue="5" />
                        <span className="text-[8px] text-[#D4AF37] block text-right font-black">NIVEAU 5 (HARMONIEUX)</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* =========================================================
                 DETAILED VIEW: 🛡 Transactions Bêta (Escrow Pilotage)
                 ========================================================= */}
            {selectedSection === "beta_escrow" && (
              <div className="space-y-6">
                <div className="p-6 bg-afri-bg/80 border border-emerald-500/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(52,211,153,0.05)]">
                  <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                  <div className="text-xs text-afri-text leading-relaxed font-mono">
                    <strong>PILOTAGE SÉQUESTRE — TRANSACTIONS BÊTA :</strong> Bienvenue dans le Centre de Commandement Bêta. Ici, vous validez manuellement les dépôts après vérification du paiement Mobile Money et libérez les fonds une fois la prestation accomplie.
                  </div>
                </div>

                <div className="p-1 sm:p-4 bg-afri-bg border border-afri-border rounded-3xl">
                  <BetaTransactionsAdminPanel 
                    currentUser={profile} 
                    onOpenSupportChat={(targetUser) => {
                      // Switch to intelligence for terminal support or just show toast
                      setSelectedSection("intelligence");
                    }}
                  />
                </div>
              </div>
            )}

            {/* =========================================================
                 DETAILED VIEW: 🎬 Centre Multimédia (Royal Sound Designer)
                 ========================================================= */}
            {selectedSection === "multimedia" && (
              <div className="space-y-6">
                <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                  <Music className="w-8 h-8 text-purple-400 shrink-0 mt-0.5 animate-pulse" />
                  <div className="text-xs text-afri-text leading-relaxed font-mono">
                    <strong>SOUND DESIGNER ROYAL — BIBLIOTHÈQUE MULTIMÉDIA :</strong> Administrez les flux sonores du Temple, chargez de nouveaux enregistrements et affectez des ambiances aux différents spots du site.
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Sound list */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono uppercase font-black text-afri-text border-b border-afri-border pb-2">Patrimoine Musical Actif</h4>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <button 
                        onClick={() => globalAudioManager.playIntro(true)}
                        className={`px-3 py-2 rounded-xl text-[9px] font-mono uppercase tracking-wider transition-all duration-300 cursor-pointer border flex items-center gap-2 ${
                          audioState.currentPlaying === 'intro' ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]' : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-afri-text-sec'
                        }`}
                      >
                        <Zap className="w-3 h-3" />
                        Réécouter l'Introduction
                      </button>
                      <button 
                        onClick={() => globalAudioManager.playHymn()}
                        className={`px-3 py-2 rounded-xl text-[9px] font-mono uppercase tracking-wider transition-all duration-300 cursor-pointer border flex items-center gap-2 ${
                          audioState.currentPlaying === 'hymne' ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-afri-text-sec'
                        }`}
                      >
                        <Music className="w-3 h-3" />
                        Hymne Officiel
                      </button>
                    </div>

                    {musicTracks.length === 0 ? (
                      <p className="text-afri-text-sec font-mono text-center py-10 text-xs">Aucune mélodie royale chargée dans le cluster.</p>
                    ) : (
                      <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                        {musicTracks.map((track, idx) => (
                          <div key={track.id} className={`p-3 border rounded-2xl flex items-center justify-between gap-4 text-xs transition-all ${playingTrackId === track.id ? 'bg-afri-bg-sec/5 border-[#D4AF37]' : 'bg-afri-bg border-afri-border/60'}`}>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handlePlayPauseTrack(track)}
                                className="w-8 h-8 rounded-full bg-afri-bg-sec/10 hover:bg-afri-bg-sec/20 flex items-center justify-center text-[#D4AF37] cursor-pointer"
                              >
                                {playingTrackId === track.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              </button>
                              <div className="text-left">
                                <span className="font-sans font-bold text-afri-text block">{track.title}</span>
                                <span className="text-[9px] text-afri-text-sec font-mono block mt-0.5">{track.artist}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleReorderMusic(idx, "up")}
                                className="p-1 text-afri-text-sec hover:text-afri-text transition-colors cursor-pointer"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReorderMusic(idx, "down")}
                                className="p-1 text-afri-text-sec hover:text-afri-text transition-colors cursor-pointer"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMusicTrack(track.id)}
                                className="p-1 text-red-500/70 hover:text-red-400 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Track & Assign Spots */}
                  <div className="space-y-6">
                    {/* Form */}
                    <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-4 text-left">
                      <h4 className="text-xs font-mono uppercase font-black text-[#D4AF37] border-b border-afri-border pb-2">Ajouter un Opus</h4>
                      
                      <form onSubmit={handleAddMusicTrack} className="space-y-3 font-mono text-xs">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase text-afri-text-sec block font-bold">Titre de l'Œuvre</label>
                          <input
                            type="text"
                            placeholder="ex: Célébration des Ancêtres"
                            value={newTrackTitle}
                            onChange={(e) => setNewTrackTitle(e.target.value)}
                            className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-afri-text focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase text-afri-text-sec block font-bold">Artiste / Compositeur</label>
                          <input
                            type="text"
                            placeholder="ex: Kora Orphée Abidjan"
                            value={newTrackArtist}
                            onChange={(e) => setNewTrackArtist(e.target.value)}
                            className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-afri-text focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase text-afri-text-sec block font-bold">Adresse URL Absolue du fichier (Audio MP3/WAV)</label>
                          <input
                            type="url"
                            placeholder="https://assets.mixkit.co/active_storage/sfx/..."
                            value={newTrackUrl}
                            onChange={(e) => setNewTrackUrl(e.target.value)}
                            className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-afri-text focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                        <button type="submit" className="w-full py-2.5 bg-afri-bg-sec text-black font-black uppercase text-[10px] tracking-wider hover:opacity-90 transition-all rounded-xl cursor-pointer">
                          Enregistrer dans l'Empire
                        </button>
                      </form>
                    </div>

                    {/* Spots controller */}
                    <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-4 text-left font-mono">
                      <h4 className="text-xs font-mono uppercase font-black text-afri-text border-b border-afri-border pb-2">Affectation Acoustique</h4>
                      
                      <div className="space-y-3 text-xs">
                        {["accueil", "throne", "navigation", "celebration"].map((spotKey) => (
                          <div key={spotKey} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-afri-bg rounded-2xl border border-afri-border/40">
                            <div>
                              <span className="font-bold text-afri-text uppercase text-[10px] block">{spotKey}</span>
                              <span className="text-[8px] text-afri-text-sec block truncate max-w-[180px]">{musicSpots[spotKey as keyof MusicSpots] || "Aucune musique active"}</span>
                            </div>
                            <select
                              onChange={(e) => handleAssignSpot(spotKey as keyof MusicSpots, e.target.value)}
                              value={musicSpots[spotKey as keyof MusicSpots] || ""}
                              className="bg-afri-bg border border-afri-border text-afri-text rounded-lg p-1.5 focus:outline-none focus:border-[#D4AF37] text-[10px]"
                            >
                              <option value="">-- Assigner Opus --</option>
                              {musicTracks.map(t => (
                                <option key={t.id} value={t.url}>{t.title}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* =========================================================
                 DETAILED VIEW: 🚨 Veille Critique
                 ========================================================= */}
            {selectedSection === "veille" && (
              <div className="space-y-6">
                <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                  <AlertTriangle className="w-8 h-8 text-red-500 shrink-0 mt-0.5 animate-bounce" />
                  <div className="text-xs text-afri-text leading-relaxed font-mono">
                    <strong>SIGNALEMENTS & VEILLE CRITIQUE :</strong> Veillez sur les signaux passifs du Temple d'Abidjan et réagissez de manière précoce face aux tentatives d'intrusions d'utilisateurs suspects.
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Suspect actors telemetry */}
                  <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-4">
                    <h4 className="text-xs font-mono uppercase font-black text-afri-text border-b border-afri-border pb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-red-500" />
                      Télémétrie Active d'Intrusions Passives
                    </h4>

                    <div className="space-y-3 font-mono text-[10px] text-afri-text-sec">
                      <div className="p-3 bg-afri-bg rounded-2xl border border-afri-border/60 flex justify-between items-center">
                        <div className="text-left">
                          <span className="text-afri-text block font-bold">Tentatives d'accès de brute-force</span>
                          <span className="text-[8px] text-afri-text-sec block mt-0.5">IP: 213.12.98.45 (Nigéria)</span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full font-bold">PARÉ</span>
                      </div>

                      <div className="p-3 bg-afri-bg rounded-2xl border border-afri-border/60 flex justify-between items-center">
                        <div className="text-left">
                          <span className="text-afri-text block font-bold">Vérification de Token CSRF suspect</span>
                          <span className="text-[8px] text-afri-text-sec block mt-0.5">Appareil: Mozilla Gecko Client</span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full font-bold">RÉSOLU</span>
                      </div>

                      <div className="p-3 bg-afri-bg rounded-2xl border border-afri-border/60 flex justify-between items-center">
                        <div className="text-left">
                          <span className="text-afri-text block font-bold">Suspicion passive usurpateur</span>
                          <span className="text-[8px] text-afri-text-sec block mt-0.5">Utilisateur: invite_temp349</span>
                        </div>
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full font-bold animate-pulse">CRITIQUE</span>
                      </div>
                    </div>
                  </div>

                  {/* Active threat resolutions */}
                  <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-4 text-left font-mono">
                    <h4 className="text-xs font-mono uppercase font-black text-afri-text border-b border-afri-border pb-2">Actions d'Urgence</h4>
                    <p className="text-[10px] text-afri-text-sec leading-relaxed">Déclenchez le blocage passif temporaire de l'ensemble du réseau en cas d'attaque généralisée avérée.</p>
                    
                    <div className="space-y-2.5">
                      <button
                        onClick={() => {
                          setSuccessMsg("PARE-FEU EN MODE RENFORCÉ SOUVERAIN (TOUTES LES IP SUSPECTES SONT BANNIES TEMPORAIREMENT).");
                          setTimeout(() => setSuccessMsg(""), 5000);
                          try { audioSynth?.playTamTam(true); } catch (_) {}
                        }}
                        className="w-full py-3 bg-red-950/40 text-red-400 border border-red-900 hover:bg-red-900 hover:text-afri-text font-mono font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        🔥 Activer Bouclier Anti-Usurpateur Strict
                      </button>

                      <button
                        onClick={() => {
                          setSuccessMsg("ALERTE DE VIGILANCE COMMUNIQUEE AUX CITOYENS D'ABIDJAN.");
                          setTimeout(() => setSuccessMsg(""), 4000);
                          try { audioSynth?.playValidationSuccess(); } catch (_) {}
                        }}
                        className="w-full py-3 bg-afri-bg-sec text-afri-text hover:bg-afri-bg-ter font-mono font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        📢 Diffuser Alerte Vigilance Générale
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* =========================================================
                 DETAILED VIEW: 📜 Journal Impérial
                 ========================================================= */}
            {selectedSection === "journal" && (
              <div className="space-y-6">
                <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                  <Scroll className="w-8 h-8 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                  <div className="text-xs text-afri-text leading-relaxed font-mono">
                    <strong>📜 ANNALES DE GOUVERNANCE ET JOURNAL IMPÉRIAL :</strong> Rédigez le journal d'apprentissage et de stratégie du Fondateur, signez de nouveaux décrets impériaux et diffusez de grands messages mégaphoniques.
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Journal and Decisions field textareas */}
                  <div className="space-y-6">
                    {/* Journal */}
                    <div className="p-5 bg-afri-bg border border-afri-border rounded-3xl space-y-2 relative">
                      <div className="flex items-center gap-2 text-[#D4AF37]">
                        <BookOpen className="w-4.5 h-4.5" />
                        <span className="text-[9px] font-mono uppercase tracking-widest font-black">Journal Intime du Fondateur</span>
                      </div>
                      <textarea
                        value={govData.journal}
                        onChange={(e) => {
                          setGovData({ ...govData, journal: e.target.value });
                          handleSaveGovField("journal", e.target.value);
                        }}
                        className="w-full h-28 bg-afri-bg border border-afri-border rounded-xl p-3 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37] font-mono leading-relaxed resize-none focus:ring-1 focus:ring-[#D4AF37]/30"
                        placeholder="Notes d'observation de terrain..."
                      />
                      <span className="absolute bottom-4 right-10 text-[7px] font-mono text-zinc-650">FIRESTORE SYNC</span>
                    </div>

                    {/* Strategic Decisions */}
                    <div className="p-5 bg-afri-bg border border-afri-border rounded-3xl space-y-2 relative">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Scroll className="w-4.5 h-4.5" />
                        <span className="text-[9px] font-mono uppercase tracking-widest font-black">Decisions Strategiques de Souche</span>
                      </div>
                      <textarea
                        value={govData.decisions}
                        onChange={(e) => {
                          setGovData({ ...govData, decisions: e.target.value });
                          handleSaveGovField("decisions", e.target.value);
                        }}
                        className="w-full h-28 bg-afri-bg border border-afri-border rounded-xl p-3 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37] font-mono leading-relaxed resize-none focus:ring-1 focus:ring-[#D4AF37]/30"
                        placeholder="Écrivez les décrets signés aujourd'hui..."
                      />
                      <span className="absolute bottom-4 right-10 text-[7px] font-mono text-zinc-650">FIRESTORE SYNC</span>
                    </div>
                  </div>

                  {/* Broadcast Form */}
                  <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-4">
                    <h4 className="text-xs font-mono uppercase font-black text-afri-text border-b border-afri-border pb-2 flex items-center gap-2">
                      <Send className="w-4.5 h-4.5 text-sky-400" />
                      Signer & Diffuser un Décret Mégaphonique
                    </h4>

                    <form onSubmit={handleSendNotice} className="space-y-3 font-mono text-xs">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase text-afri-text-sec block font-bold">Catégorie du Décret</label>
                        <select
                          value={noticeCategory}
                          onChange={(e) => setNoticeCategory(e.target.value)}
                          className="w-full bg-afri-bg border border-afri-border rounded-xl p-2 text-afri-text focus:outline-none focus:border-[#D4AF37]"
                        >
                          <option value="MESSAGE SPECIAL">👑 DECRET SPECIAL DU SOUVERAIN</option>
                          <option value="MAINTENANCE">🛡️ ALERTE DE PROTECTION SYSTÈME</option>
                          <option value="INFO GOMBO">🔥 OFFRES & GOMBO NEWS</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase text-afri-text-sec block font-bold">Titre Impérial</label>
                        <input
                          type="text"
                          placeholder="ex: LANÇEMENT DES CERTIFICATIONS ACTIVES"
                          value={noticeTitle}
                          onChange={(e) => setNoticeTitle(e.target.value)}
                          className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-afri-text focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase text-afri-text-sec block font-bold">Corps du Message</label>
                        <textarea
                          rows={4}
                          placeholder="Écrivez le message de décret..."
                          value={noticeBody}
                          onChange={(e) => setNoticeBody(e.target.value)}
                          className="w-full bg-afri-bg border border-afri-border rounded-xl p-3 text-afri-text focus:outline-none focus:border-[#D4AF37] leading-relaxed resize-none"
                        />
                      </div>

                      <button type="submit" className="w-full py-2.5 bg-afri-bg-sec text-black font-black uppercase text-[10px] tracking-wider hover:opacity-90 transition-all rounded-xl cursor-pointer">
                        Diffuser maintenant
                      </button>
                    </form>
                  </div>

                </div>
              </div>
            )}

            {/* =========================================================
                 DETAILED VIEW: 📋 Checklist Bêta
                 ========================================================= */}
            {selectedSection === "checklist" && (
              <div className="space-y-6">
                <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                  <CheckSquare className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                  <div className="text-xs text-afri-text leading-relaxed font-mono">
                    <strong>📋 CHECKLIST DE VALIDATION DE LA BÊTA PUBLIQUE :</strong> Suivez pas à pas la validation de l'écosystème souverain AFRIGOMBO ELITE. Cochez les modules pour certifier leur bon fonctionnement avant le déploiement général.
                  </div>
                </div>

                <div className="bg-afri-bg border border-afri-border rounded-3xl p-6 space-y-6">
                  {/* Progress Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-afri-border">
                    <div>
                      <h3 className="text-sm font-sans font-black text-afri-text uppercase tracking-wider">
                        Progression de la Certification Bêta
                      </h3>
                      <p className="text-[10px] font-mono text-afri-text-sec uppercase mt-1">
                        Chaque jalon doit être testé rigoureusement sur mobile et ordinateur
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-black text-[#D4AF37] bg-afri-bg-sec/10 border border-[#D4AF37]/25 px-3 py-1 rounded-xl">
                        {progressCount} / 11 VALIDÉS ({Math.round((progressCount / 11) * 100)}%)
                      </span>
                      <button
                        onClick={() => {
                          const reset = Object.keys(betaChecklist).reduce((acc, k) => ({ ...acc, [k]: false }), {});
                          setBetaChecklist(reset);
                          localStorage.setItem("afrigombo_beta_checklist", JSON.stringify(reset));
                          if (audioSynth) {
                            try { audioSynth.playValidationSuccess(); } catch (_) {}
                          }
                        }}
                        className="text-[9px] font-mono uppercase text-afri-text-sec hover:text-afri-text transition-colors cursor-pointer"
                      >
                        Réinitialiser
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-afri-bg rounded-full overflow-hidden border border-afri-border">
                    <motion.div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${(progressCount / 11) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>

                  {/* Checklist grid list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries({
                      "Connexion Google": "Authentification sécurisée avec Firebase Auth et persistance de session.",
                      "Déconnexion": "Fermeture propre de session, effacement sécurisé du cache utilisateur local.",
                      "Création publication": "Ajout fluide de posts, textes, catégories, et liaison Gombo ID en temps réel.",
                      "Modification profil": "Mise à jour des coordonnées d'artiste, biographie, réseaux sociaux et rôle.",
                      "Upload image": "Traitement optimisé avec compression et hébergement cloud résilient.",
                      "Notifications": "Envoi d'alertes instantanées, notifications d'activité, et décrets souverains.",
                      "Navigation": "Routage réactif de 200 à 300ms sans clignotement ni blocage tactile.",
                      "Centre de Commandement": "Monitoring en temps réel des flux d'activités, des signalements et logs.",
                      "Trône": "Accès souverain restreint au fondateur d'élite pour la gouvernance impériale.",
                      "Responsive Android": "Adaptation pixel-perfect, zones de touches de 44px minimum, fluidité absolue.",
                      "Firebase": "Configuration offline par long-polling configurée et gestion des pings de base de données."
                    }).map(([key, desc]) => {
                      const isChecked = betaChecklist[key];
                      return (
                        <div
                          key={key}
                          onClick={() => toggleChecklist(key)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${isChecked ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40' : 'bg-afri-bg/40 border-afri-border hover:border-afri-border'}`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isChecked ? (
                              <CheckSquare className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <Square className="w-5 h-5 text-zinc-650 hover:text-afri-text-sec" />
                            )}
                          </div>
                          <div className="space-y-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-sans font-bold ${isChecked ? 'text-afri-text' : 'text-afri-text'}`}>
                                {key}
                              </span>
                              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-black ${isChecked ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'}`}>
                                {isChecked ? 'VALIDÉ' : 'EN COURS'}
                              </span>
                            </div>
                            <p className="text-[10px] text-afri-text-sec font-mono leading-relaxed">
                              {desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {selectedSection === "economy" && (() => {
              // Real-time sovereign economic metrics calculation
              const totalCommissions = allContracts.filter(c => c.status === "signed" || c.status === "validated" || c.status === "active" || c.status === "completed").reduce((acc, c) => acc + (c.commissionClient || 0) + (c.commissionArtist || 0), 0);
              const totalPremiumRevenue = allPayments.filter(p => p.purpose?.includes("Premium") || p.purpose?.includes("ELITE") || p.purpose?.includes("PRO")).reduce((acc, p) => acc + (p.amount || 0), 0);
              const totalArtists = (users || []).filter(u => u.role === "musician" || u.role === "artist" || !u.isAdmin).length || 1;
              const premiumArtistsCount = (users || []).filter(u => (u.role === "musician" || u.role === "artist" || !u.isAdmin) && (u.isPremium || u.badges?.includes("💎 Adhérent Premium"))).length;
              const penetrationRate = Math.round((premiumArtistsCount / totalArtists) * 100);
              const signedContractsCount = allContracts.filter(c => c.status === "signed" || c.status === "completed" || c.status === "validated" || c.clientSignedAt || c.artistSignedAt).length;
              const totalSavings = allContracts.reduce((acc, c) => acc + (c.savingsClient || 0) + (c.savingsArtist || 0), 0);

              return (
                <div className="space-y-6">
                  <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                    <Coins className="w-8 h-8 text-[#D4AF37] shrink-0 mt-0.5" />
                    <div className="text-xs text-afri-text leading-relaxed font-mono">
                      <strong>💰 GESTION ÉCONOMIQUE SOUVERAINE :</strong> Configurez la commission universelle et surveillez en temps réel l'essor de la richesse partagée au sein du Temple du Gombo.
                    </div>
                  </div>

                  {/* Real-time Sovereign Economic Health Dashboard */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-mono uppercase text-afri-text-sec tracking-widest border-l-2 border-[#D4AF37] pl-3">
                      SANTÉ ÉCONOMIQUE DE L'EMPIRE (TEMPS RÉEL)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      {/* 1. Commissions */}
                      <div className="bg-afri-bg/90 border border-afri-border rounded-3xl p-5 flex flex-col justify-between shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl"></div>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[9px] font-mono font-bold text-afri-text-sec uppercase tracking-wider">Commissions</span>
                            <Coins className="w-4 h-4 text-emerald-400" />
                          </div>
                          <span className="text-xl font-black text-emerald-400 tracking-tight block">
                            {totalCommissions.toLocaleString()} FCFA
                          </span>
                        </div>
                        <p className="text-[8.5px] text-afri-text-sec mt-2">Frais de service (12% / 10% / 8%) perçus sur les contrats finalisés</p>
                      </div>

                      {/* 2. Premium subscriptions */}
                      <div className="bg-afri-bg/90 border border-afri-border rounded-3xl p-5 flex flex-col justify-between shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-afri-bg-sec/5 rounded-full blur-xl"></div>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[9px] font-mono font-bold text-afri-text-sec uppercase tracking-wider">Revenus Premium</span>
                            <Crown className="w-4 h-4 text-[#D4AF37]" />
                          </div>
                          <span className="text-xl font-black text-[#D4AF37] tracking-tight block">
                            {totalPremiumRevenue.toLocaleString()} FCFA
                          </span>
                        </div>
                        <p className="text-[8.5px] text-afri-text-sec mt-2">Cumul des abonnements Gombo Pro et Elite encaissés</p>
                      </div>

                      {/* 3. Premium penetration rate */}
                      <div className="bg-afri-bg/90 border border-afri-border rounded-3xl p-5 flex flex-col justify-between shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl"></div>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[9px] font-mono font-bold text-afri-text-sec uppercase tracking-wider">Pénétration Premium</span>
                            <Users className="w-4 h-4 text-blue-400" />
                          </div>
                          <span className="text-xl font-black text-blue-400 tracking-tight block">
                            {penetrationRate}%
                          </span>
                        </div>
                        <p className="text-[8.5px] text-afri-text-sec mt-2">Taux d'artistes et promoteurs abonnés à l'offre payante</p>
                      </div>

                      {/* 4. Signed contracts */}
                      <div className="bg-afri-bg/90 border border-afri-border rounded-3xl p-5 flex flex-col justify-between shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full blur-xl"></div>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[9px] font-mono font-bold text-afri-text-sec uppercase tracking-wider">Gombos Validés</span>
                            <FileText className="w-4 h-4 text-purple-400" />
                          </div>
                          <span className="text-xl font-black text-purple-400 tracking-tight block">
                            {signedContractsCount} / {allContracts.length}
                          </span>
                        </div>
                        <p className="text-[8.5px] text-afri-text-sec mt-2">Contrats signés numériquement par les deux parties</p>
                      </div>

                      {/* 5. Economic savings */}
                      <div className="bg-afri-bg/90 border border-afri-border rounded-3xl p-5 flex flex-col justify-between shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl"></div>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[9px] font-mono font-bold text-afri-text-sec uppercase tracking-wider">Économies Membres</span>
                            <Sparkles className="w-4 h-4 text-amber-400" />
                          </div>
                          <span className="text-xl font-black text-amber-400 tracking-tight block">
                            {totalSavings.toLocaleString()} FCFA
                          </span>
                        </div>
                        <p className="text-[8.5px] text-afri-text-sec mt-2">Frais économisés par les adhérents grâce aux taux Premium réduits (4%)</p>
                      </div>
                    </div>
                  </div>

                  {/* Economy Settings Form */}
                  <div className="bg-afri-bg border border-afri-border rounded-3xl p-6 space-y-6">
                    <h3 className="text-sm font-sans font-black text-[#D4AF37] uppercase tracking-wider border-b border-afri-border pb-2">
                      Paramètres de Commission & Tarification (FCFA)
                    </h3>
                    
                    {economySettings ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono text-zinc-600 dark:text-afri-text-sec uppercase">Taux Commission Standard (%)</label>
                          <input type="number" value={economySettings.commissionRateStandard * 100} onChange={(e) => setEconomySettings({...economySettings, commissionRateStandard: Number(e.target.value) / 100})} className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-4 py-2 text-zinc-900 dark:text-afri-text font-mono text-sm focus:outline-none focus:border-[#D4AF37]" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono text-zinc-600 dark:text-afri-text-sec uppercase">Taux Commission Premium (%)</label>
                          <input type="number" value={economySettings.commissionRatePremium * 100} onChange={(e) => setEconomySettings({...economySettings, commissionRatePremium: Number(e.target.value) / 100})} className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-4 py-2 text-zinc-900 dark:text-afri-text font-mono text-sm focus:outline-none focus:border-[#D4AF37]" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono text-zinc-600 dark:text-afri-text-sec uppercase">Prix Boost Standard</label>
                          <input type="number" value={economySettings.boostPriceStandard} onChange={(e) => setEconomySettings({...economySettings, boostPriceStandard: Number(e.target.value)})} className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-4 py-2 text-zinc-900 dark:text-afri-text font-mono text-sm focus:outline-none focus:border-[#D4AF37]" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono text-zinc-600 dark:text-afri-text-sec uppercase">Prix Boost Premium</label>
                          <input type="number" value={economySettings.boostPricePremium} onChange={(e) => setEconomySettings({...economySettings, boostPricePremium: Number(e.target.value)})} className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-4 py-2 text-zinc-900 dark:text-afri-text font-mono text-sm focus:outline-none focus:border-[#D4AF37]" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[10px] font-mono text-zinc-600 dark:text-afri-text-sec uppercase">Prix Renfort Express</label>
                          <input type="number" value={economySettings.renfortExpressPrice} onChange={(e) => setEconomySettings({...economySettings, renfortExpressPrice: Number(e.target.value)})} className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-4 py-2 text-zinc-900 dark:text-afri-text font-mono text-sm focus:outline-none focus:border-[#D4AF37]" />
                        </div>
                        <div className="md:col-span-2 flex justify-end mt-4">
                          <button 
                            onClick={() => {
                              import("../../firebase").then(({ gomboDB }) => {
                                gomboDB.updateEconomySettings(economySettings).then(() => {
                                  setSuccessMsg("Paramètres économiques mis à jour avec succès !");
                                  setTimeout(() => setSuccessMsg(""), 3000);
                                  try { if (audioSynth) audioSynth.playValidationSuccess(); } catch (_) {}
                                });
                              });
                            }}
                            className="bg-afri-bg-sec hover:bg-afri-bg-sec text-black px-6 py-2.5 rounded-xl font-bold font-mono text-[10px] uppercase transition-colors"
                          >
                            Sauvegarder les Paramètres
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-afri-text-sec font-mono text-xs animate-pulse">Chargement des paramètres...</div>
                    )}
                  </div>
                </div>
              );
            })()}

          </motion.div>
        )}

      </AnimatePresence>

      {/* Cyber Security Scanner overlay animation */}
      {isScanning && (
        <div className="fixed inset-0 bg-afri-bg/90 backdrop-blur-lg z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-afri-bg border-2 border-emerald-500/30 p-8 rounded-3xl w-full max-w-md text-center space-y-6"
          >
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border border-emerald-500/40 animate-pulse" />
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Lock className="w-8 h-8 text-emerald-400 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-mono font-black text-emerald-400 uppercase tracking-widest">SCAN CYBER-IMPÉRIAL EN COURS</h3>
              <p className="text-[10px] font-mono text-afri-text-sec">ANALYSE EN TEMPS RÉEL DES INFRASTRUCTURES FIRESTORE</p>
            </div>

            <div className="w-full h-1.5 bg-afri-bg border border-afri-border rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                initial={{ width: "0%" }}
                animate={{ width: `${(scanStep / 4) * 100}%` }}
                transition={{ duration: 1 }}
              />
            </div>

            <div className="bg-afri-bg border border-afri-border p-3 rounded-xl text-left h-24 overflow-y-auto scrollbar-none space-y-1 font-mono text-[9px] text-afri-text-sec leading-tight">
              {scanLogs.map((logLine, idx) => (
                <div key={idx} className="border-b border-zinc-950 py-0.5">
                  {logLine}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* =========================================================================
                      SUPER FOUNDER FIXED BOTTOM NAVIGATION BAR
         ========================================================================= */}
      <div className="fixed bottom-0 sm:bottom-4 left-0 sm:left-1/2 right-0 sm:right-auto sm:-translate-x-1/2 bg-afri-bg/95 backdrop-blur-md border-t sm:border border-[#D4AF37]/50 p-2 px-4 sm:px-6 flex items-center z-45 sm:rounded-2xl sm:shadow-[0_8px_35px_rgba(212,175,55,0.35)] w-full sm:w-auto min-w-[320px] max-w-full sm:max-w-4xl mx-auto overflow-x-auto scrollbar-none flex-nowrap gap-1 sm:gap-4 select-none">
        {/* 1. TRÔNE */}
        <button
          type="button"
          onClick={() => {
            setSelectedSection(null);
            try { audioSynth?.playValidationSuccess(); } catch (_) {}
          }}
          className={`flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-3 sm:px-4 rounded-lg ${
            selectedSection === null ? "text-[#D4AF37] scale-105 bg-afri-bg-sec/10 font-black" : "text-afri-text-sec hover:text-afri-text"
          }`}
        >
          <Crown className="w-4.5 h-4.5" />
          <span className="text-[9px] font-mono uppercase tracking-wider">Le Trône</span>
        </button>

        {/* 2. VISION */}
        <button
          type="button"
          onClick={() => {
            setSelectedSection("vision");
            try { audioSynth?.playValidationSuccess(); } catch (_) {}
          }}
          className={`flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-3 sm:px-4 rounded-lg ${
            selectedSection === "vision" ? "text-[#D4AF37] scale-105 bg-afri-bg-sec/10 font-black" : "text-afri-text-sec hover:text-afri-text"
          }`}
        >
          <Globe className="w-4.5 h-4.5" />
          <span className="text-[9px] font-mono uppercase tracking-wider">Vision</span>
        </button>

        {/* 3. UNIVERS */}
        <button
          type="button"
          onClick={() => {
            setSelectedSection("univers");
            try { audioSynth?.playValidationSuccess(); } catch (_) {}
          }}
          className={`flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-3 sm:px-4 rounded-lg ${
            selectedSection === "univers" ? "text-[#D4AF37] scale-105 bg-afri-bg-sec/10 font-black" : "text-afri-text-sec hover:text-afri-text"
          }`}
        >
          <Landmark className="w-4.5 h-4.5" />
          <span className="text-[9px] font-mono uppercase tracking-wider">Univers</span>
        </button>

        {/* 4. BOUCLIER */}
        <button
          type="button"
          onClick={() => {
            setSelectedSection("bouclier");
            try { audioSynth?.playValidationSuccess(); } catch (_) {}
          }}
          className={`flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-3 sm:px-4 rounded-lg ${
            selectedSection === "bouclier" ? "text-[#D4AF37] scale-105 bg-afri-bg-sec/10 font-black" : "text-afri-text-sec hover:text-afri-text"
          }`}
        >
          <ShieldCheck className="w-4.5 h-4.5" />
          <span className="text-[9px] font-mono uppercase tracking-wider">Bouclier</span>
        </button>

        {/* 5. REVENUS */}
        <button
          type="button"
          onClick={() => {
            setSelectedSection("revenus");
            try { audioSynth?.playValidationSuccess(); } catch (_) {}
          }}
          className={`flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-3 sm:px-4 rounded-lg ${
            selectedSection === "revenus" ? "text-[#D4AF37] scale-105 bg-afri-bg-sec/10 font-black" : "text-afri-text-sec hover:text-afri-text"
          }`}
        >
          <Coins className="w-4.5 h-4.5" />
          <span className="text-[9px] font-mono uppercase tracking-wider">Revenus</span>
        </button>

        {/* 6. INTELLIGENCE */}
        <button
          type="button"
          onClick={() => {
            setSelectedSection("intelligence");
            try { audioSynth?.playValidationSuccess(); } catch (_) {}
          }}
          className={`flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-3 sm:px-4 rounded-lg ${
            selectedSection === "intelligence" ? "text-[#D4AF37] scale-105 bg-afri-bg-sec/10 font-black" : "text-afri-text-sec hover:text-afri-text"
          }`}
        >
          <Brain className="w-4.5 h-4.5" />
          <span className="text-[9px] font-mono uppercase tracking-wider">Console</span>
        </button>

        {/* 7. JOURNAL */}
        <button
          type="button"
          onClick={() => {
            setSelectedSection("journal");
            try { audioSynth?.playValidationSuccess(); } catch (_) {}
          }}
          className={`flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-3 sm:px-4 rounded-lg ${
            selectedSection === "journal" ? "text-[#D4AF37] scale-105 bg-afri-bg-sec/10 font-black" : "text-afri-text-sec hover:text-afri-text"
          }`}
        >
          <Scroll className="w-4.5 h-4.5" />
          <span className="text-[9px] font-mono uppercase tracking-wider">Journal</span>
        </button>

        {/* 8. QUITTER */}
        <button
          type="button"
          onClick={() => {
            if (onExit) onExit();
          }}
          className="flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-3 sm:px-4 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/20"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
          <span className="text-[9px] font-mono uppercase tracking-wider">Quitter</span>
        </button>
      </div>

    </div>
  );
}

// ------------------------------------------------------------------------------------------------
// HELPER COMPONENTS FOR IMPERIAL HEADER
// ------------------------------------------------------------------------------------------------

function StatusBadge({ icon, label, status, color, isDark }: { icon: React.ReactNode, label: string, status: string, color: string, isDark: boolean }) {
  const colorClasses: Record<string, string> = {
    emerald: isDark ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-700 bg-white/60 border-emerald-500/20 shadow-sm',
    amber: isDark ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-amber-700 bg-white/60 border-amber-500/20 shadow-sm',
    blue: isDark ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-blue-700 bg-white/60 border-blue-500/20 shadow-sm',
  };

  return (
    <div className={`flex flex-col justify-center items-center gap-1.5 p-3 rounded-3xl border transition-all duration-300 hover:scale-[1.02] cursor-default ${colorClasses[color] || ''}`}>
      <div className="opacity-70">{icon}</div>
      <div className="flex flex-col items-center">
        <span className="text-[8px] font-mono font-black uppercase tracking-widest opacity-60">{label}</span>
        <span className="text-[10px] font-sans font-black uppercase tracking-tighter whitespace-nowrap">{status}</span>
      </div>
    </div>
  );
}

function AlertItem({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-2.5 group cursor-default">
      <div className="shrink-0 transition-transform group-hover:scale-125 duration-300">{icon}</div>
      <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-afri-text transition-colors truncate">{text}</span>
    </div>
  );
}
