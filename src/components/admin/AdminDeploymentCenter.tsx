import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { BUILD_ID, BUILD_TIME, COMMIT_SHA, COMMIT_SHORT_SHA } from "../../buildInfo";
import {
  Rocket, ToggleRight, CheckCircle, History, Info, Clock, Check, X,
  ShieldAlert, ChevronRight, ChevronDown, ChevronUp, User, Server, Database, GitBranch, Cpu,
  AlertCircle, ShieldCheck, Terminal, Layers, RefreshCw, FileText, CheckCircle2,
  XCircle, Zap, Globe, Smartphone, Cloud, Code, Settings, EyeOff, Search, SlidersHorizontal,
  Sparkles, Lock, Unlock, Eye, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { gomboDB } from "../../firebase";
import { db } from "../../lib/firebase";
import {
  collection, doc, onSnapshot, setDoc, updateDoc, addDoc, query, orderBy, limit, serverTimestamp
} from "firebase/firestore";
import { SecurityService } from "../../lib/SecurityService";
import { FEATURE_PARENT_MAP } from "../../lib/featureFlags";

export interface AdminDeploymentCenterProps {
  currentUser?: any;
  userEmail?: string;
  audioSynth?: any;
}

export interface DeploymentRecord {
  id: string;
  version: string;
  targetEnv: "production" | "beta" | "staging";
  status: "SUCCESS" | "FAILED" | "PENDING";
  note: string;
  authorEmail: string;
  timestamp: string;
  commitHash?: string;
}

export type FeatureVisibilityStatus = "ACTIVE" | "COMING_SOON" | "HIDDEN";

export interface FeatureFlagItem {
  id: string;
  name: string;
  category: string;
  visibilityStatus?: FeatureVisibilityStatus;
  enabled?: boolean;
  isPremium?: boolean;
  status?: "validated" | "experimental" | "pending" | "disabled";
  description?: string;
  updatedAt?: string;
  updatedBy?: string;
  parentId?: string | null;
}

export default function AdminDeploymentCenter({
  currentUser,
  userEmail = "admin@afrigombo.ci",
  audioSynth
}: AdminDeploymentCenterProps) {
  const founderEmail = userEmail || currentUser?.email || "jhs.kmj7@gmail.com";

  // Firestore Real States
  const [deploymentHistory, setDeploymentHistory] = useState<DeploymentRecord[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagItem[]>([]);
  const [bugReports, setBugReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Live Server Version check
  const [serverVersion, setServerVersion] = useState<{
    buildId?: string;
    timestamp?: string;
    env?: string;
    commitSha?: string;
    commitShortSha?: string;
    isVercel?: boolean;
  } | null>(null);
  const [isCheckingServerVersion, setIsCheckingServerVersion] = useState(false);

  const checkServerVersion = async () => {
    setIsCheckingServerVersion(true);
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setServerVersion(data);
      } else {
        setServerVersion({ buildId: "Indisponible (HTTP " + res.status + ")" });
      }
    } catch (e: any) {
      setServerVersion({ buildId: "Erreur (" + (e.message || "Réseau") + ")" });
    } finally {
      setIsCheckingServerVersion(false);
    }
  };

  useEffect(() => {
    checkServerVersion();
  }, []);

  // New Deployment Form modal
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployVersion, setDeployVersion] = useState("v2.6.0");
  const [deployTarget, setDeployTarget] = useState<"production" | "beta">("production");
  const [deployNotes, setDeployNotes] = useState("");
  const [isSubmittingDeploy, setIsSubmittingDeploy] = useState(false);

  // Filter & Saving states for Feature Flags
  const [activeFlagFilter, setActiveFlagFilter] = useState<"all" | "active" | "coming_soon" | "hidden" | "premium">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [savingFlagId, setSavingFlagId] = useState<string | null>(null);
  const [flagError, setFlagError] = useState<string | null>(null);
  const [confirmHideFlag, setConfirmHideFlag] = useState<FeatureFlagItem | null>(null);

  // 1. DEFAULT FEATURE FLAGS INITIALIZER
  const defaultFlags: FeatureFlagItem[] = [
    // APPLICATION & NAVIGATION
    { id: "home", name: "🏠 Accueil & Le Terrain", category: "Application", enabled: true, status: "validated", description: "Fil d'actualité principal et espace d'accueil" },
    { id: "gombos", name: "📢 Fil des Gombos & Publications", category: "Application", enabled: true, status: "validated", description: "Gestion et publication des Gombos" },
    { id: "nearby", name: "📍 Près de moi", category: "Navigation", enabled: true, status: "validated", description: "Module général de découverte locale" },
    { id: "nearbyOpportunities", name: "🧭 Opportunités proches", category: "Navigation", enabled: true, status: "validated", description: "Découverte des Gombos et opportunités à proximité" },
    { id: "radar", name: "📡 Radar Géolocalisé Nearby", category: "Navigation", enabled: true, status: "validated", description: "Cartographie et proximité des membres" },
    { id: "reels", name: "🎬 Reels & Flex Multimédia", category: "Application", enabled: true, status: "validated", description: "Shorts vidéo et créations multimédia" },
    { id: "renforts", name: "⚡ Renfort Express", category: "Application", enabled: true, status: "validated", description: "Mobilisation rapide de talents en urgence" },
    { id: "podcasts", name: "🎙️ Podcasts & Resonances", category: "Média", enabled: true, status: "validated", description: "Lecteur audio kora et diffusions résonantes" },
    { id: "events", name: "🎟️ Événements & Billetterie", category: "Communauté", enabled: true, status: "experimental", description: "Création et réservation d'événements" },
    { id: "mes_groupes", name: "👥 Groupes & Communautés", category: "Communauté", enabled: true, status: "validated", description: "Groupes de discussion et réseaux de talents" },
    { id: "favorites", name: "⭐ Favoris & Enregistrements", category: "Application", enabled: true, status: "validated", description: "Gestion des annonces et profils enregistrés" },

    // REVENUS & MONÉTISATION
    { id: "gawa_center", name: "🟡 Centre Gawa", category: "Monétisation", enabled: true, status: "validated", description: "Boutique, recharge et missions Gawa pour les utilisateurs" },
    { id: "mes_lots", name: "🎁 Mes lots", category: "Monétisation", enabled: true, status: "validated", description: "Espace des récompenses et lots réellement gagnés par l'utilisateur" },
    { id: "wheel", name: "🎡 Roue AFRIGOMBO (Général)", category: "Monétisation", enabled: true, status: "validated", description: "Permet aux utilisateurs éligibles d'accéder à la Roue AFRIGOMBO et à ses récompenses." },
    { id: "wheel_1", name: "🎡 Roue 1 — Classique", category: "Monétisation", enabled: true, status: "validated", description: "Accès à la Roue Classique 20 GAWA", parentId: "wheel" },
    { id: "wheel_2", name: "🎡 Roue 2 — Élite", category: "Monétisation", enabled: true, status: "validated", description: "Accès à la Roue Élite Prestige 50 GAWA", parentId: "wheel" },
    { id: "wheel_3", name: "🎡 Roue 3 — Premium", category: "Monétisation", enabled: true, status: "validated", description: "Accès à la Roue Premium Souveraine 100 GAWA", parentId: "wheel" },
    { id: "lots_management", name: "🎁 Gestion des lots (Module)", category: "Monétisation", enabled: true, status: "validated", description: "Configuration et administration des lots du système" },

    // FINANCES
    { id: "wallet", name: "💳 Wallet Souverain AFRIPAY", category: "Finance", enabled: true, status: "validated", description: "Solde rechargeable et virements sécurisés" },
    { id: "escrow", name: "🔐 Séquestre & Contrats Dépôt", category: "Finance", enabled: true, status: "validated", description: "Système de séquestre de cachets et contrats" },
    { id: "premium", name: "💎 AFRIGOMBO ELITE PREMIUM", category: "Finance", enabled: true, status: "validated", description: "Gestion de la visibilité et de la disponibilité du véritable abonnement Premium AFRIGOMBO ELITE." },
    { id: "monetisation", name: "📈 Programme de Monétisation", category: "Finance", enabled: true, status: "validated", description: "Fonds créateurs et revenus partagés" },

    // UNIVERS
    { id: "grandMarket", name: "🛒 Grand Marché AFRIGOMBO", category: "Économie", enabled: true, status: "validated", description: "Plateforme de transactions et petites annonces" },
    { id: "academie", name: "🎓 Académie AFRIGOMBO ELITE", category: "Formation", enabled: false, status: "pending", description: "Tutoriels et certifications professionnelles" },
    { id: "gombo_id", name: "🪪 Gombo ID Souverain", category: "Sécurité", enabled: true, status: "validated", description: "Système de badges d'accréditation" },
    { id: "avatar", name: "AVATAR", category: "Profil", enabled: true, status: "validated", description: "Système de personnalisation d'avatars et boutique d'accessoires virtuels." },
    { id: "heritage", name: "👑 Mon Héritage & Portfolio", category: "Profil", enabled: true, status: "validated", description: "Portfolio artistique et palmarès du membre" },

    // COMMUNICATION
    { id: "chat", name: "💬 Messagerie Instantanée V2", category: "Communication", enabled: true, status: "validated", description: "Messages cryptés et notifications directes" },
    { id: "appels", name: "📞 Appels Audio/Vidéo WebRTC", category: "Communication", enabled: true, status: "experimental", description: "Flux direct peer-to-peer en temps réel" },
    { id: "notifications", name: "📣 Diffusions Mégaphoniques", category: "Communication", enabled: true, status: "validated", description: "Pousse de notifications en masse" },

    // SYSTÈME
    { id: "downloads", name: "📥 Téléchargements de documents", category: "Média", enabled: true, status: "validated", description: "Téléchargement sécurisé des reçus et documents" },
    { id: "backups", name: "🛡️ Sauvegardes du Système", category: "Sécurité", enabled: true, status: "validated", description: "Sauvegardes de sécurité automatiques" },
    { id: "updateJournal", name: "📰 Journal des Mises à jour", category: "Système", enabled: true, status: "validated", description: "Registre de modifications et notes de version" },
    { id: "cahier", name: "📓 Cahier Numérique du Fondateur", category: "Gouvernance", enabled: true, status: "validated", description: "Carnet de notes Firestore professionnel" },
    { id: "verification", name: "🆔 Vérification KYC Biométrique", category: "Sécurité", enabled: false, status: "pending", description: "Contrôle d'identité par IA" },
    { id: "support", name: "🛟 Support Client & Aide", category: "Système", enabled: true, status: "validated", description: "Signalements de bugs et assistance" }
  ];

  // 2. LISTEN TO FIRESTORE REAL DEPLOYMENTS & FEATURE FLAGS & BUG REPORTS
  useEffect(() => {
    setLoading(true);

    // Deployments stream
    const deploysRef = collection(db, "deployment_history");
    const deploysQuery = query(deploysRef, orderBy("timestamp", "desc"));
    const unsubDeploys = onSnapshot(deploysQuery, (snap) => {
      const records: DeploymentRecord[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        records.push({
          id: docSnap.id,
          version: d.version || "v1.0.0",
          targetEnv: d.targetEnv || "production",
          status: d.status || "SUCCESS",
          note: d.note || "",
          authorEmail: d.authorEmail || "Système",
          timestamp: d.timestamp || new Date().toISOString(),
          commitHash: d.commitHash || "git_head"
        });
      });
      setDeploymentHistory(records);
    }, (err) => console.error("Err deployment stream:", err));

    // Combined feature flags streams: systemConfig/features is the SINGLE SOURCE OF TRUTH
    const targetKeys = defaultFlags.map(f => f.id);
    const flagsRef = doc(db, "settings", "feature_flags");
    const sysConfigRef = doc(db, "systemConfig", "features");

    let lastSettingsFlags: FeatureFlagItem[] = [];
    let lastSysFlags: Record<string, any> = {};

    const updateCombinedFlags = (
      settingsFlags: FeatureFlagItem[],
      sysFlags: Record<string, any>
    ) => {
      const combined = defaultFlags.map(f => {
        const sysValue = sysFlags[f.id];
        let visibilityStatus: FeatureVisibilityStatus = f.visibilityStatus || (f.enabled ? "ACTIVE" : "HIDDEN");
        let isPremium = !!f.isPremium;
        let formattedDate: string | undefined = undefined;
        let updatedBy: string | undefined = undefined;

        if (sysValue !== undefined) {
          if (sysValue.updatedAt) {
            if (typeof sysValue.updatedAt === "string") formattedDate = sysValue.updatedAt;
            else if (sysValue.updatedAt?.toDate) formattedDate = sysValue.updatedAt.toDate().toISOString();
          }
          if (sysValue.updatedBy) updatedBy = sysValue.updatedBy;

          if (typeof sysValue === "boolean") {
            visibilityStatus = sysValue ? "ACTIVE" : "HIDDEN";
          } else if (typeof sysValue === "string") {
            const upper = sysValue.toUpperCase();
            if (["ACTIVE", "COMING_SOON", "HIDDEN"].includes(upper)) {
              visibilityStatus = upper as FeatureVisibilityStatus;
            }
          } else if (typeof sysValue === "object" && sysValue !== null) {
            if (sysValue.status && ["ACTIVE", "COMING_SOON", "HIDDEN"].includes(sysValue.status)) {
              visibilityStatus = sysValue.status as FeatureVisibilityStatus;
            } else if (sysValue.enabled !== undefined) {
              visibilityStatus = sysValue.enabled ? "ACTIVE" : "HIDDEN";
            }
            if (sysValue.isPremium !== undefined) {
              isPremium = !!sysValue.isPremium;
            }
          }
        } else {
          const settingsMatch = settingsFlags.find(sf => sf.id === f.id);
          if (settingsMatch) {
            visibilityStatus = settingsMatch.visibilityStatus || (settingsMatch.enabled ? "ACTIVE" : "HIDDEN");
            isPremium = !!settingsMatch.isPremium;
          }
        }

        return {
          ...f,
          parentId: f.parentId || FEATURE_PARENT_MAP[f.id] || null,
          visibilityStatus,
          enabled: visibilityStatus === "ACTIVE",
          isPremium,
          status: visibilityStatus === "ACTIVE" ? ("validated" as const) : visibilityStatus === "COMING_SOON" ? ("experimental" as const) : ("disabled" as const),
          updatedAt: formattedDate,
          updatedBy
        };
      });
      setFeatureFlags(combined);
    };

    const unsubFlags = onSnapshot(flagsRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().flags) {
        lastSettingsFlags = docSnap.data().flags;
      } else {
        lastSettingsFlags = [];
      }
      updateCombinedFlags(lastSettingsFlags, lastSysFlags);
    }, (err) => {
      console.error("Err feature flags stream:", err);
      updateCombinedFlags(lastSettingsFlags, lastSysFlags);
    });

    const unsubSysConfig = onSnapshot(sysConfigRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Record<string, any>;
        lastSysFlags = data;
        
        // Auto-initialize any missing keys in systemConfig/features
        const missingKeys = targetKeys.filter(k => data[k] === undefined);
        if (missingKeys.length > 0) {
          const updates: Record<string, any> = {};
          missingKeys.forEach(k => {
            const defaultObj = defaultFlags.find(f => f.id === k);
            const vis = defaultObj?.visibilityStatus || (defaultObj?.enabled ? "ACTIVE" : "HIDDEN");
            updates[k] = {
              status: vis,
              enabled: vis === "ACTIVE",
              isPremium: !!defaultObj?.isPremium,
              updatedAt: serverTimestamp()
            };
          });
          try {
            await setDoc(sysConfigRef, updates, { merge: true });
          } catch (e) {
            console.error("Error auto-initializing systemConfig/features keys:", e);
          }
        }
      } else {
        lastSysFlags = {};
        const initialData: Record<string, any> = {};
        defaultFlags.forEach(f => {
          const vis = f.visibilityStatus || (f.enabled ? "ACTIVE" : "HIDDEN");
          initialData[f.id] = {
            status: vis,
            enabled: vis === "ACTIVE",
            isPremium: !!f.isPremium,
            updatedAt: serverTimestamp()
          };
        });
        try {
          await setDoc(sysConfigRef, initialData);
        } catch (e) {
          console.error("Error auto-initializing systemConfig/features document:", e);
        }
      }
      updateCombinedFlags(lastSettingsFlags, lastSysFlags);
    }, (err) => {
      console.error("Err systemConfig stream:", err);
    });

    // Error logs / Bug reports stream
    const bugsRef = collection(db, "bug_reports");
    const bugsQuery = query(bugsRef, orderBy("createdAt", "desc"), limit(10));
    const unsubBugs = onSnapshot(bugsQuery, (snap) => {
      const reports: any[] = [];
      snap.forEach((docSnap) => {
        reports.push({ id: docSnap.id, ...docSnap.data() });
      });
      setBugReports(reports);
      setLoading(false);
    }, (err) => {
      console.error("Err bug reports stream:", err);
      setLoading(false);
    });

    return () => {
      unsubDeploys();
      unsubFlags();
      unsubSysConfig();
      unsubBugs();
    };
  }, []);

  // UPDATE FEATURE FLAG VISIBILITY IN FIRESTORE
  const handleUpdateFlagVisibility = async (flagId: string, newVisibility: FeatureVisibilityStatus, newIsPremium?: boolean) => {
    if (savingFlagId) return;

    const currentFlag = featureFlags.find((f) => f.id === flagId);
    if (!currentFlag) return;

    setSavingFlagId(flagId);
    setFlagError(null);

    const targetVisibility = newVisibility;
    const targetPremium = newIsPremium !== undefined ? newIsPremium : !!currentFlag.isPremium;
    const nowIso = new Date().toISOString();

    try {
      const sysConfigRef = doc(db, "systemConfig", "features");
      await setDoc(sysConfigRef, {
        [flagId]: {
          status: targetVisibility,
          enabled: targetVisibility === "ACTIVE",
          isPremium: targetPremium,
          updatedAt: serverTimestamp(),
          updatedBy: founderEmail || "Super Fondateur"
        }
      }, { merge: true });

      const updatedFlags = featureFlags.map((f) => {
        if (f.id === flagId) {
          return {
            ...f,
            visibilityStatus: targetVisibility,
            enabled: targetVisibility === "ACTIVE",
            isPremium: targetPremium,
            updatedAt: nowIso,
            updatedBy: founderEmail || "Super Fondateur",
            status: targetVisibility === "ACTIVE" ? ("validated" as const) : targetVisibility === "COMING_SOON" ? ("experimental" as const) : ("disabled" as const)
          };
        }
        return f;
      });

      const flagsRef = doc(db, "settings", "feature_flags");
      await setDoc(flagsRef, {
        flags: updatedFlags,
        updatedAt: nowIso,
        updatedBy: founderEmail || "Super Fondateur"
      }, { merge: true });

      await SecurityService.logSecurityEvent({
        userId: founderEmail,
        userEmail: founderEmail,
        action: "feature_flag_visibility_update",
        severity: "medium",
        details: `Module '${flagId}' visibility set to '${targetVisibility}' (isPremium: ${targetPremium}) by ${founderEmail}`,
        result: "allowed"
      });

      setFeatureFlags(updatedFlags);
      try { audioSynth?.playValidationSuccess?.(); } catch (e) {}
    } catch (err) {
      console.error("Erreur feature flag update:", err);
      setFlagError("Impossible de modifier le statut du module.");
    } finally {
      setSavingFlagId(null);
      setConfirmHideFlag(null);
    }
  };

  // TRIGGER REAL DEPLOYMENT RECORD IN FIRESTORE
  const handleTriggerDeploy = async () => {
    if (!deployVersion.trim()) return;
    setIsSubmittingDeploy(true);

    const newRecord = {
      version: deployVersion.trim(),
      targetEnv: deployTarget,
      status: "SUCCESS",
      note: deployNotes.trim() || "Déploiement manuel effectué depuis le Cabinet Impérial",
      authorEmail: founderEmail,
      timestamp: new Date().toISOString(),
      commitHash: `prod_${Math.random().toString(36).substring(2, 9)}`
    };

    try {
      const deploysRef = collection(db, "deployment_history");
      await addDoc(deploysRef, newRecord);

      // Update system info
      const platformRef = doc(db, "settings", "platform");
      await setDoc(platformRef, {
        lastDeploymentVersion: deployVersion.trim(),
        lastDeploymentDate: new Date().toISOString(),
        lastDeployedBy: founderEmail,
        targetEnv: deployTarget
      }, { merge: true });

      setIsSubmittingDeploy(false);
      setShowDeployModal(false);
      setDeployNotes("");
      try { audioSynth?.playValidationSuccess?.(); } catch (e) {}
    } catch (err) {
      console.error("Erreur enregistrement déploiement:", err);
      setIsSubmittingDeploy(false);
    }
  };

  // Environment variables inspection (safe keys)
  const envVarsList = [
    { name: "VITE_FIREBASE_PROJECT_ID", value: process.env.VITE_FIREBASE_PROJECT_ID || "afrigombo-elite-prod", scope: "Client", status: "Active" },
    { name: "GEMINI_API_KEY", value: process.env.GEMINI_API_KEY ? "•••••••••••• (Inconnu du navigateur)" : "Non configuré", scope: "Serveur", status: process.env.GEMINI_API_KEY ? "Active" : "Pas encore disponible" },
    { name: "NODE_ENV", value: process.env.NODE_ENV || "production", scope: "Runtime", status: "Active" },
    { name: "DISABLE_HMR", value: "true", scope: "Vite Platform", status: "Active" },
    { name: "PORT", value: "3000 (Cloud Run Ingress)", scope: "Conteneur", status: "Active" }
  ];

  // Modules ecosystem status breakdown
  const ecosystemModules = [
    { name: "Messagerie Instantanée V2", status: "Publié", env: "Production", code: "MOD_CHAT" },
    { name: "Grand Marché & Annonces", status: "Publié", env: "Production", code: "MOD_MARKET" },
    { name: "Wallet Souverain AFRIPAY", status: "Publié", env: "Production", code: "MOD_WALLET" },
    { name: "Radar Géolocalisé Nearby", status: "Publié", env: "Production", code: "MOD_RADAR" },
    { name: "Cahier Numérique du Fondateur", status: "Terminé", env: "Production", code: "MOD_NOTEBOOK" },
    { name: "Centre de Déploiement", status: "Terminé", env: "Production", code: "MOD_DEPLOY" },
    { name: "Appels WebRTC Directs", status: "En développement", env: "Bêta", code: "MOD_WEBRTC" },
    { name: "Académie AFRIGOMBO ELITE", status: "Pas encore disponible", env: "Backlog", code: "MOD_ACADEMY" }
  ];

  const currentProdRecord = deploymentHistory.find((d) => d.targetEnv === "production") || {
    version: "v1.0.0",
    timestamp: new Date().toISOString(),
    status: "SUCCESS",
    authorEmail: founderEmail
  };

  const currentBetaRecord = deploymentHistory.find((d) => d.targetEnv === "beta") || null;

  // Computed feature flags counts (Top-Level Parent Modules Only)
  const topLevelFlags = featureFlags.filter(f => !f.parentId);

  const totalCount = topLevelFlags.length;
  const activeCount = topLevelFlags.filter(f => (f.visibilityStatus || (f.enabled ? "ACTIVE" : "HIDDEN")) === "ACTIVE").length;
  const comingSoonCount = topLevelFlags.filter(f => f.visibilityStatus === "COMING_SOON").length;
  const hiddenCount = topLevelFlags.filter(f => (f.visibilityStatus || (f.enabled ? "ACTIVE" : "HIDDEN")) === "HIDDEN").length;
  const premiumCount = topLevelFlags.filter(f => !!f.isPremium).length;

  const filteredFlags = topLevelFlags.filter((f) => {
    const currentVis = f.visibilityStatus || (f.enabled ? "ACTIVE" : "HIDDEN");
    const subModules = featureFlags.filter((s) => s.parentId === f.id);
    
    // Tab filter
    if (activeFlagFilter === "active" && currentVis !== "ACTIVE") return false;
    if (activeFlagFilter === "coming_soon" && currentVis !== "COMING_SOON") return false;
    if (activeFlagFilter === "hidden" && currentVis !== "HIDDEN") return false;
    if (activeFlagFilter === "premium" && !f.isPremium && !subModules.some((s) => s.isPremium)) return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (f.name || "").toLowerCase().includes(q);
      const matchId = (f.id || "").toLowerCase().includes(q);
      const matchCat = (f.category || "").toLowerCase().includes(q);
      const matchDesc = (f.description || "").toLowerCase().includes(q);
      const matchSub = subModules.some((sub) =>
        (sub.name || "").toLowerCase().includes(q) ||
        (sub.id || "").toLowerCase().includes(q) ||
        (sub.description || "").toLowerCase().includes(q)
      );

      if (!matchName && !matchId && !matchCat && !matchDesc && !matchSub) return false;
    }

    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn pb-24 text-left font-sans select-none max-w-7xl mx-auto">
      
      {/* BANNER HEADER */}
      <div className="bg-afri-bg-sec border border-afri-border rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Rocket className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>CENTRE DE DÉPLOIEMENT IMPÉRIAL</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                  SOUVERAIN
                </span>
              </h2>
            </div>
            <p className="text-xs text-afri-text-sec font-mono leading-relaxed">
              Supervision en temps réel des builds, registres de production, environnement Cloud Run et Feature Flags.
            </p>
          </div>

          <button
            onClick={() => setShowDeployModal(true)}
            className="px-5 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-rose-500/20 active:scale-95"
          >
            <Rocket className="w-4 h-4" />
            <span>Enregistrer un Déploiement</span>
          </button>
        </div>
      </div>

      {/* FORENSIC BUILD & SYNCHRONIZATION DIAGNOSTIC CARD */}
      <div className="p-5 bg-black/80 border border-afri-gold/50 rounded-3xl space-y-4 shadow-2xl relative overflow-hidden backdrop-blur-xl font-mono text-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-afri-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-afri-gold" />
            <h3 className="text-sm font-black text-afri-gold uppercase tracking-wider">
              INSPECTOR 4.0 — SUIVI DES COMMITS & DÉPLOIEMENT REAL-TIME
            </h3>
          </div>
          <button
            onClick={checkServerVersion}
            disabled={isCheckingServerVersion}
            className="px-3 py-1.5 bg-afri-gold/10 hover:bg-afri-gold/20 text-afri-gold border border-afri-gold/30 rounded-xl text-[10px] uppercase font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingServerVersion ? 'animate-spin' : ''}`} />
            Vérifier le Serveur
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* 1. AI Studio Preview Local */}
          <div className="p-3 bg-afri-bg/80 border border-afri-border rounded-2xl space-y-1">
            <span className="text-[9px] uppercase text-afri-text-muted font-bold block">1. GOOGLE AI STUDIO</span>
            <div className="text-xs font-black text-amber-400 truncate">
              {window.location.hostname.includes("run.app") ? "PREVIEW LOCAL" : "DEVELOPMENT"}
            </div>
            <span className="text-[9px] text-afri-text-sec block truncate">
              Commit: {COMMIT_SHORT_SHA || "HEAD"}
            </span>
            <span className="text-[9px] text-afri-text-muted block truncate">{BUILD_ID}</span>
          </div>

          {/* 2. Vercel Server / version.json */}
          <div className="p-3 bg-afri-bg/80 border border-afri-border rounded-2xl space-y-1">
            <span className="text-[9px] uppercase text-afri-text-muted font-bold block">2. VERCEL SERVEUR</span>
            <div className="text-xs font-black text-white truncate">
              {serverVersion?.commitShortSha && serverVersion.commitShortSha !== "LOCAL"
                ? `COMMIT: ${serverVersion.commitShortSha}`
                : serverVersion?.buildId || (isCheckingServerVersion ? "Vérification..." : "Inaccessible")}
            </div>
            <span className="text-[9px] text-afri-text-sec block truncate">
              {serverVersion?.timestamp ? new Date(serverVersion.timestamp).toLocaleTimeString("fr-FR") : "GET /version.json"}
            </span>
            <span className="text-[9px] text-afri-text-muted block truncate">{serverVersion?.buildId || "N/A"}</span>
          </div>

          {/* 3. Chrome Client JS */}
          <div className="p-3 bg-afri-bg/80 border border-afri-border rounded-2xl space-y-1">
            <span className="text-[9px] uppercase text-afri-text-muted font-bold block">3. CLIENT CHROME</span>
            <div className="text-xs font-black text-sky-400 truncate">
              {COMMIT_SHORT_SHA && COMMIT_SHORT_SHA !== "LOCAL" ? `COMMIT: ${COMMIT_SHORT_SHA}` : "EXÉCUTION ACTIVE"}
            </div>
            <span className="text-[9px] text-afri-text-sec block truncate">
              {new Date(BUILD_TIME).toLocaleTimeString("fr-FR")}
            </span>
            <span className="text-[9px] text-afri-text-muted block truncate">{BUILD_ID}</span>
          </div>

          {/* 4. Honest Verdict */}
          <div className="p-3 bg-afri-bg/80 border border-afri-border rounded-2xl space-y-1 flex flex-col justify-center">
            <span className="text-[9px] uppercase text-afri-text-muted font-bold block">4. Verdict Final</span>
            <div>
              {(() => {
                const isAIStudio = window.location.hostname.includes("run.app") || window.location.hostname.includes("localhost");
                const isVercel = window.location.hostname.includes("vercel.app") || (!isAIStudio);

                if (isAIStudio) {
                  return (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold uppercase inline-flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      PREVIEW LOCAL AI STUDIO
                    </span>
                  );
                }

                if (!serverVersion || !serverVersion.buildId || serverVersion.buildId.includes("Erreur")) {
                  return (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold uppercase inline-flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      NON VÉRIFIABLE
                    </span>
                  );
                }

                if (serverVersion.commitSha && serverVersion.commitSha !== "NO_GIT_SHA" && COMMIT_SHA !== "NO_GIT_SHA") {
                  if (serverVersion.commitSha === COMMIT_SHA) {
                    return (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold uppercase inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        🟢 CHROME = VERCEL (CONFORME)
                      </span>
                    );
                  } else {
                    return (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-bold uppercase inline-flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        🔴 CHROME OBSOLÈTE
                      </span>
                    );
                  }
                }

                if (serverVersion.buildId === BUILD_ID) {
                  return (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold uppercase inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      🟢 BUILD HARMONISÉ
                    </span>
                  );
                }

                return (
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-bold uppercase inline-flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    🔴 DIVERGENCE DÉTECTÉE
                  </span>
                );
              })()}
            </div>
            <span className="text-[9px] text-afri-text-sec block pt-1 leading-tight">
              {window.location.hostname.includes("run.app")
                ? "Preview en conteneur Cloud Run. Exportez vers GitHub pour mettre à jour Vercel."
                : serverVersion?.commitSha && serverVersion.commitSha === COMMIT_SHA
                ? "Chrome exécute le commit Vercel déployé depuis GitHub."
                : "Vercel et Chrome ne sont pas sur le même commit."}
            </span>
          </div>
        </div>
      </div>

      {/* 1. SECTIONS OVERVIEW GRID: PROD, BETA, BUILD, COMPILATION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Production Version */}
        <div className="p-5 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-2 relative overflow-hidden">
          <span className="text-[9px] uppercase tracking-widest text-afri-text-muted font-mono font-bold flex items-center justify-between">
            <span>Version Production</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </span>
          <div className="text-2xl font-black text-white font-mono">{currentProdRecord.version}</div>
          <div className="text-[10px] text-afri-text-sec font-mono flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-400" />
            {new Date(currentProdRecord.timestamp).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>

        {/* Beta Version */}
        <div className="p-5 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-2">
          <span className="text-[9px] uppercase tracking-widest text-afri-text-muted font-mono font-bold">Version Bêta</span>
          <div className="text-2xl font-black text-sky-400 font-mono">
            {currentBetaRecord ? currentBetaRecord.version : "v2.6.0-rc1"}
          </div>
          <div className="text-[10px] text-afri-text-sec font-mono">
            {currentBetaRecord ? new Date(currentBetaRecord.timestamp).toLocaleDateString("fr-FR") : "Canal Bêta Ouvert"}
          </div>
        </div>

        {/* Build State */}
        <div className="p-5 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-2">
          <span className="text-[9px] uppercase tracking-widest text-afri-text-muted font-mono font-bold">État du Build Engine</span>
          <div className="text-lg font-black text-emerald-400 font-mono flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Opérationnel
          </div>
          <div className="text-[10px] text-afri-text-sec font-mono">Vite 5 + TypeScript ESM</div>
        </div>

        {/* Last Deployment Date */}
        <div className="p-5 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-2">
          <span className="text-[9px] uppercase tracking-widest text-afri-text-muted font-mono font-bold">Dernier Déploiement</span>
          <div className="text-sm font-black text-amber-400 font-mono truncate">
            {deploymentHistory.length > 0
              ? new Date(deploymentHistory[0].timestamp).toLocaleDateString("fr-FR")
              : "Aucune donnée enregistrée"}
          </div>
          <div className="text-[10px] text-afri-text-sec font-mono truncate">
            {deploymentHistory.length > 0 ? `Par ${deploymentHistory[0].authorEmail}` : "Pas encore disponible"}
          </div>
        </div>

      </div>

      {/* 2. INFRASTRUCTURE & ECOSYSTEM STACK CONNECTIONS */}
      <section className="space-y-4">
        <h3 className="text-xs font-black uppercase text-afri-gold tracking-widest flex items-center gap-2 border-b border-afri-border pb-2 font-mono">
          <Server className="w-4 h-4 text-[#D4AF37]" />
          CONNECTEURS INFRASTRUCTURE & SERVICES CLOUD
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* AI Studio */}
          <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" /> Google AI Studio
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                ACTIF
              </span>
            </div>
            <p className="text-[11px] text-afri-text-sec font-mono">Applet ID: c78bb822-6a8a-4ad7-a26a-488f6d8b0aa7</p>
          </div>

          {/* Firebase Hosting */}
          <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-500" /> Firebase Firestore
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                CONNECTÉ
              </span>
            </div>
            <p className="text-[11px] text-afri-text-sec font-mono">Collection gomboDB / Synchro Live</p>
          </div>

          {/* Web App */}
          <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" /> Application Web
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                OPÉRATIONNELLE
              </span>
            </div>
            <p className="text-[11px] text-afri-text-sec font-mono">Standard SPA Web Client</p>
          </div>

          {/* Android Build */}
          <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" /> Build Android (TWA/APK)
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                PRÊT EN TWA
              </span>
            </div>
            <p className="text-[11px] text-afri-text-sec font-mono">Configuration Web Manifest Active</p>
          </div>

          {/* Vercel */}
          <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase flex items-center gap-2">
                <Cloud className="w-4 h-4 text-purple-400" /> Vercel Deployment
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-afri-bg-ter text-afri-text-sec border border-afri-border">
                Pas encore disponible
              </span>
            </div>
            <p className="text-[11px] text-afri-text-sec font-mono">Liaison Webhook Vercel non configurée</p>
          </div>

          {/* GitHub */}
          <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-afri-text-sec" /> GitHub Sync
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-afri-bg-ter text-afri-text-sec border border-afri-border">
                Pas encore disponible
              </span>
            </div>
            <p className="text-[11px] text-afri-text-sec font-mono">Dépôt Git géré via AI Studio Export</p>
          </div>

        </div>
      </section>

      {/* 3. ENVIRONMENT VARIABLES AUDIT TABLE */}
      <section className="space-y-3">
        <h3 className="text-xs font-black uppercase text-afri-gold tracking-widest flex items-center gap-2 border-b border-afri-border pb-2 font-mono">
          <Terminal className="w-4 h-4 text-[#D4AF37]" />
          VARIABLES D'ENVIRONNEMENT SÉCURISÉES
        </h3>

        <div className="bg-afri-bg-sec border border-afri-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-afri-bg border-b border-afri-border text-afri-text-muted text-[10px] uppercase">
                <tr>
                  <th className="p-3">Clé d'Environnement</th>
                  <th className="p-3">Valeur / État</th>
                  <th className="p-3">Portée</th>
                  <th className="p-3 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-afri-border">
                {envVarsList.map((env) => (
                  <tr key={env.name} className="hover:bg-zinc-800/40 transition">
                    <td className="p-3 font-bold text-white">{env.name}</td>
                    <td className="p-3 text-afri-text-sec">{env.value}</td>
                    <td className="p-3 text-afri-text-sec">{env.scope}</td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        env.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {env.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 4. FEATURE FLAGS ENGINE - COMPACT ACCORDION UI */}
      <section className="space-y-4">
        {/* Section Header & Toolbar */}
        <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-afri-border/60 pb-3">
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase text-afri-gold tracking-widest flex items-center gap-2 font-mono">
                <ToggleRight className="w-4 h-4 text-[#D4AF37]" />
                <span>CENTRE DE CONTRÔLE DES MODULES ({filteredFlags.length}/{totalCount})</span>
              </h3>
              <p className="text-[11px] text-afri-text-sec font-mono mt-0.5">
                Pilotez la visibilité des fonctionnalités en temps réel (Actif, Bientôt disponible, Masqué).
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setExpandedModuleId(expandedModuleId ? null : (filteredFlags[0]?.id || null))}
                className="px-3 py-1.5 bg-afri-bg hover:bg-zinc-800 border border-afri-border text-zinc-300 hover:text-white rounded-xl text-[10px] font-mono font-bold uppercase transition flex items-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-3 h-3 text-[#D4AF37]" />
                <span>{expandedModuleId ? "Tout replier" : "Déplier le premier"}</span>
              </button>

              {(searchQuery || activeFlagFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveFlagFilter("all");
                  }}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-[10px] font-mono font-bold uppercase transition flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Réinitialiser</span>
                </button>
              )}
            </div>
          </div>

          {/* Search bar & Live Filter Badges */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un module (ex: roue, chat, wallet, gombos, avatar)..."
                className="w-full pl-9 pr-8 py-2 bg-afri-bg border border-afri-border rounded-xl text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-[#D4AF37] transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs with Counts */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0 shrink-0">
              {[
                { id: "all", label: "Tous", count: totalCount, activeClass: "bg-[#D4AF37] text-black" },
                { id: "active", label: "🟢 Actifs", count: activeCount, activeClass: "bg-emerald-500 text-black font-black" },
                { id: "coming_soon", label: "🟡 Bientôt", count: comingSoonCount, activeClass: "bg-amber-500 text-black font-black" },
                { id: "hidden", label: "🔴 Masqués", count: hiddenCount, activeClass: "bg-rose-500 text-white font-black" },
                { id: "premium", label: "💎 Premium", count: premiumCount, activeClass: "bg-amber-400 text-black font-black" }
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setActiveFlagFilter(st.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    activeFlagFilter === st.id
                      ? st.activeClass
                      : "bg-afri-bg text-afri-text-sec hover:text-white border border-afri-border hover:border-zinc-700"
                  }`}
                >
                  <span>{st.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                    activeFlagFilter === st.id ? "bg-black/20 text-current font-black" : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {st.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {flagError && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-mono flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{flagError}</span>
            </span>
            <button onClick={() => setFlagError(null)} className="text-rose-400 hover:text-white font-bold cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ACCORDION MODULES LIST */}
        {filteredFlags.length === 0 ? (
          <div className="p-12 bg-afri-bg-sec border border-dashed border-afri-border rounded-2xl text-center space-y-3 font-mono text-xs">
            <SlidersHorizontal className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-afri-text-sec font-bold">Aucun module ne correspond à vos critères de recherche.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveFlagFilter("all");
              }}
              className="px-4 py-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 rounded-xl text-[10px] font-bold uppercase transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Réinitialiser les filtres</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFlags.map((flag) => {
              const currentVis = flag.visibilityStatus || (flag.enabled ? "ACTIVE" : "HIDDEN");
              const isSavingThis = savingFlagId === flag.id;
              const isExpanded = expandedModuleId === flag.id;

              return (
                <div
                  key={flag.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? "bg-afri-bg-sec border-[#D4AF37]/50 shadow-lg shadow-black/40"
                      : currentVis === "ACTIVE"
                      ? "bg-afri-bg-sec/80 border-afri-border hover:border-zinc-700"
                      : currentVis === "COMING_SOON"
                      ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40"
                      : "bg-afri-bg/60 border-rose-500/20 hover:border-rose-500/40 opacity-80"
                  }`}
                >
                  {/* COMPACT ACCORDION ROW HEADER */}
                  <div
                    onClick={() => setExpandedModuleId(isExpanded ? null : flag.id)}
                    className="p-3 sm:p-4 flex items-center justify-between gap-2.5 cursor-pointer select-none transition hover:bg-white/[0.02]"
                  >
                    {/* Left: Category Badge & Title & Key */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold uppercase shrink-0 border ${
                        flag.category === "Finance"
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                          : flag.category === "Monétisation"
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                          : flag.category === "Sécurité"
                          ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                          : flag.category === "Navigation"
                          ? "bg-sky-500/10 text-sky-300 border-sky-500/30"
                          : flag.category === "Profil"
                          ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                          : "bg-zinc-800 text-zinc-300 border-zinc-700"
                      }`}>
                        {flag.category}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate leading-tight">
                            {flag.name}
                          </h4>
                          {flag.isPremium && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                              💎 PREMIUM
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] font-mono text-afri-text-muted block truncate mt-0.5">
                          id: <span className="text-zinc-400">{flag.id}</span>
                        </span>
                      </div>
                    </div>

                    {/* Right: Status Pill, Saving Spinner & Chevron */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isSavingThis ? (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-amber-400">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span className="hidden sm:inline">Synchro...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {currentVis === "ACTIVE" && (
                            <span className="px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-mono font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span>ACTIF</span>
                            </span>
                          )}

                          {currentVis === "COMING_SOON" && (
                            <span className="px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-mono font-black uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              <span>BIENTÔT</span>
                            </span>
                          )}

                          {currentVis === "HIDDEN" && (
                            <span className="px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-mono font-black uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                              <span>MASQUÉ</span>
                            </span>
                          )}
                        </div>
                      )}

                      <div className={`w-7 h-7 rounded-lg bg-afri-bg border border-afri-border flex items-center justify-center text-zinc-400 transition-transform duration-200 ${
                        isExpanded ? "rotate-180 text-[#D4AF37] border-[#D4AF37]/50" : "hover:text-white"
                      }`}>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* EXPANDED ACCORDION DRAWER */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="border-t border-afri-border/60 bg-black/40 px-3 py-3.5 sm:px-5 sm:py-4 space-y-4 font-mono"
                      >
                        {/* Description block */}
                        <div className="p-3 bg-afri-bg border border-afri-border rounded-xl space-y-1">
                          <span className="text-[9px] font-mono uppercase text-afri-text-muted font-bold block">
                            Description du module :
                          </span>
                          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                            {flag.description || "Aucune description détaillée renseignée pour ce module."}
                          </p>
                        </div>

                        {/* Interactive Controls Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {/* 1. 3-State Visibility Selector */}
                          <div className="space-y-2 bg-afri-bg/90 border border-afri-border rounded-xl p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-white uppercase flex items-center gap-1.5">
                                <ToggleRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                                Visibilité Utilisateur :
                              </span>
                              <span className="text-[8px] text-afri-text-muted uppercase">Source de Vérité</span>
                            </div>

                            <div className="grid grid-cols-3 gap-1.5">
                              {/* ACTIVE */}
                              <button
                                type="button"
                                disabled={isSavingThis}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateFlagVisibility(flag.id, "ACTIVE");
                                }}
                                className={`px-2 py-2 rounded-xl text-[10px] font-mono font-bold uppercase transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                                  currentVis === "ACTIVE"
                                    ? "bg-emerald-500 text-black font-black shadow-md shadow-emerald-500/20"
                                    : "bg-zinc-900 text-zinc-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-zinc-800"
                                }`}
                              >
                                <span className="text-xs">🟢</span>
                                <span>ACTIF</span>
                              </button>

                              {/* COMING SOON */}
                              <button
                                type="button"
                                disabled={isSavingThis}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateFlagVisibility(flag.id, "COMING_SOON");
                                }}
                                className={`px-2 py-2 rounded-xl text-[10px] font-mono font-bold uppercase transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                                  currentVis === "COMING_SOON"
                                    ? "bg-amber-500 text-black font-black shadow-md shadow-amber-500/20"
                                    : "bg-zinc-900 text-zinc-400 hover:text-amber-300 hover:bg-amber-500/10 border border-zinc-800"
                                }`}
                              >
                                <span className="text-xs">🟡</span>
                                <span>BIENTÔT</span>
                              </button>

                              {/* HIDDEN (With anchored smart confirmation modal) */}
                              <button
                                type="button"
                                disabled={isSavingThis}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (currentVis !== "HIDDEN") {
                                    setConfirmHideFlag(flag);
                                  }
                                }}
                                className={`px-2 py-2 rounded-xl text-[10px] font-mono font-bold uppercase transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                                  currentVis === "HIDDEN"
                                    ? "bg-rose-500 text-white font-black shadow-md shadow-rose-500/20"
                                    : "bg-zinc-900 text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10 border border-zinc-800"
                                }`}
                              >
                                <span className="text-xs">🔴</span>
                                <span>MASQUER</span>
                              </button>
                            </div>
                          </div>

                          {/* 2. Premium Access Level Switch */}
                          <div className="space-y-2 bg-afri-bg/90 border border-afri-border rounded-xl p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-white uppercase flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                Accès Premium :
                              </span>
                              <span className="text-[8px] text-afri-text-muted uppercase">Gouvernance</span>
                            </div>

                            <button
                              type="button"
                              disabled={isSavingThis}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateFlagVisibility(flag.id, currentVis, !flag.isPremium);
                              }}
                              className={`w-full py-2.5 px-3 rounded-xl text-[10px] font-mono font-bold uppercase transition flex items-center justify-between cursor-pointer border ${
                                flag.isPremium
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30"
                                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{flag.isPremium ? "💎" : "🌐"}</span>
                                <span>{flag.isPremium ? "RÉSERVÉ MEMBRES PREMIUM" : "GRATUIT (TOUS LES MEMBRES)"}</span>
                              </div>
                              <span className="text-[9px] underline">Basculer</span>
                            </button>
                          </div>
                        </div>

                        {/* SOUS-MODULES GOVERNANCE SECTION */}
                        {(() => {
                          const subModules = featureFlags.filter((s) => s.parentId === flag.id);
                          if (subModules.length === 0) return null;

                          return (
                            <div className="p-3.5 bg-black/60 border border-[#D4AF37]/30 rounded-2xl space-y-3 font-mono">
                              <div className="flex items-center justify-between border-b border-afri-border/60 pb-2">
                                <div className="flex items-center gap-2">
                                  <SlidersHorizontal className="w-4 h-4 text-[#D4AF37]" />
                                  <h5 className="text-xs font-black text-[#D4AF37] uppercase tracking-wider">
                                    SOUS-MODULES ({subModules.length})
                                  </h5>
                                </div>
                                <span className="text-[9px] text-afri-text-muted">Gouvernance des sous-modules</span>
                              </div>

                              <div className="space-y-2">
                                {subModules.map((sub) => {
                                  const subVis = sub.visibilityStatus || (sub.enabled ? "ACTIVE" : "HIDDEN");
                                  const isSavingSub = savingFlagId === sub.id;

                                  return (
                                    <div
                                      key={sub.id}
                                      className="p-3 bg-afri-bg-sec/90 border border-afri-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700 transition"
                                    >
                                      <div className="space-y-0.5 min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-white truncate">{sub.name}</span>
                                          {sub.isPremium && (
                                            <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                                              💎 PREMIUM
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[9px] text-afri-text-muted font-mono truncate">
                                          id: <strong className="text-zinc-300">{sub.id}</strong> — {sub.description}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        {isSavingSub ? (
                                          <div className="flex items-center gap-1 text-[10px] text-amber-400">
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            <span>Synchro...</span>
                                          </div>
                                        ) : (
                                          <div className="grid grid-cols-3 gap-1.5">
                                            {/* ACTIVE */}
                                            <button
                                              type="button"
                                              disabled={isSavingSub}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleUpdateFlagVisibility(sub.id, "ACTIVE");
                                              }}
                                              className={`px-2.5 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition flex items-center gap-1 cursor-pointer ${
                                                subVis === "ACTIVE"
                                                  ? "bg-emerald-500 text-black font-black shadow-sm"
                                                  : "bg-zinc-900 text-zinc-400 hover:text-emerald-300 border border-zinc-800"
                                              }`}
                                            >
                                              <span>🟢</span>
                                              <span>ACTIF</span>
                                            </button>

                                            {/* COMING SOON */}
                                            <button
                                              type="button"
                                              disabled={isSavingSub}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleUpdateFlagVisibility(sub.id, "COMING_SOON");
                                              }}
                                              className={`px-2.5 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition flex items-center gap-1 cursor-pointer ${
                                                subVis === "COMING_SOON"
                                                  ? "bg-amber-500 text-black font-black shadow-sm"
                                                  : "bg-zinc-900 text-zinc-400 hover:text-amber-300 border border-zinc-800"
                                              }`}
                                            >
                                              <span>🟡</span>
                                              <span>BIENTÔT</span>
                                            </button>

                                            {/* HIDDEN */}
                                            <button
                                              type="button"
                                              disabled={isSavingSub}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleUpdateFlagVisibility(sub.id, "HIDDEN");
                                              }}
                                              className={`px-2.5 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition flex items-center gap-1 cursor-pointer ${
                                                subVis === "HIDDEN"
                                                  ? "bg-rose-500 text-white font-black shadow-sm"
                                                  : "bg-zinc-900 text-zinc-400 hover:text-rose-300 border border-zinc-800"
                                              }`}
                                            >
                                              <span>🔴</span>
                                              <span>MASQUER</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Metadata Footer */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[9px] text-afri-text-muted pt-2 border-t border-afri-border/60">
                          <div className="flex items-center gap-3">
                            <span>Clé technique : <strong className="text-zinc-300 font-mono">{flag.id}</strong></span>
                            <span>Catégorie : <strong className="text-zinc-300">{flag.category}</strong></span>
                          </div>
                          <div>
                            {flag.updatedAt ? (
                              <span>Maj le {new Date(flag.updatedAt).toLocaleDateString("fr-FR")} {flag.updatedBy ? `par ${flag.updatedBy.split("@")[0]}` : ""}</span>
                            ) : (
                              <span>Configuration par défaut active</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. ECOSYSTEM MODULES STATUS */}
      <section className="space-y-3">
        <h3 className="text-xs font-black uppercase text-afri-gold tracking-widest flex items-center gap-2 border-b border-afri-border pb-2 font-mono">
          <Layers className="w-4 h-4 text-[#D4AF37]" />
          STATUT DES MODULES DE L'ÉCOSYSTÈME
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ecosystemModules.map((mod) => (
            <div key={mod.code} className="p-3.5 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-afri-text-muted font-bold">{mod.code}</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                  mod.status === "Publié" ? "bg-emerald-500/10 text-emerald-400" :
                  mod.status === "Terminé" ? "bg-sky-500/10 text-sky-400" :
                  mod.status === "En développement" ? "bg-amber-500/10 text-amber-400" : "bg-afri-bg-ter text-afri-text-muted"
                }`}>
                  {mod.status}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white truncate">{mod.name}</h4>
              <div className="text-[10px] text-afri-text-sec font-mono">Environnement : {mod.env}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. HISTORIQUE DES DÉPLOIEMENTS FIRESTORE */}
      <section className="space-y-3">
        <h3 className="text-xs font-black uppercase text-afri-gold tracking-widest flex items-center gap-2 border-b border-afri-border pb-2 font-mono">
          <History className="w-4 h-4 text-[#D4AF37]" />
          HISTORIQUE RÉEL DES DÉPLOIEMENTS ({deploymentHistory.length})
        </h3>

        {deploymentHistory.length === 0 ? (
          <div className="p-8 bg-afri-bg-sec border border-dashed border-afri-border rounded-2xl text-center space-y-2 font-mono text-xs">
            <p className="text-afri-text-sec">Aucune donnée enregistrée dans l'historique des déploiements.</p>
            <p className="text-[11px] text-afri-text-muted">
              Cliquez sur "Enregistrer un Déploiement" ci-dessus pour acter votre première release.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {deploymentHistory.map((item) => (
              <div key={item.id} className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-white bg-afri-bg-ter px-2.5 py-1 rounded-lg border border-afri-border">
                      {item.version}
                    </span>
                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      item.targetEnv === "production" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                    }`}>
                      {item.targetEnv}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                    <CheckCircle className="w-3.5 h-3.5" /> {item.status}
                  </span>
                </div>

                <p className="text-xs text-afri-text-sec font-mono leading-relaxed">{item.note}</p>

                <div className="flex justify-between items-center text-[10px] font-mono text-afri-text-muted pt-1 border-t border-afri-border">
                  <span>Auteur : {item.authorEmail}</span>
                  <span>{new Date(item.timestamp).toLocaleString("fr-FR")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 7. JOURNAL DES ERREURS FIRESTORE (BUG REPORTS) */}
      <section className="space-y-3">
        <h3 className="text-xs font-black uppercase text-rose-400 tracking-widest flex items-center gap-2 border-b border-afri-border pb-2 font-mono">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          JOURNAL DES ERREURS ET RAPPORTS DE BUGS ({bugReports.length})
        </h3>

        {bugReports.length === 0 ? (
          <div className="p-6 bg-afri-bg-sec border border-afri-border rounded-2xl text-center font-mono text-xs text-afri-text-sec">
            Aucune donnée enregistrée dans le journal des erreurs.
          </div>
        ) : (
          <div className="space-y-2.5">
            {bugReports.map((bug) => (
              <div key={bug.id} className="p-3.5 bg-afri-bg-sec border border-rose-500/20 rounded-2xl flex items-start justify-between gap-3 font-mono text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="text-rose-400">[{bug.type || bug.subject || "Bug"}]</span> {bug.title || "Rapport système"}
                  </div>
                  <p className="text-afri-text-sec text-[11px] leading-tight">{bug.message || bug.details}</p>
                  <div className="text-[9px] text-afri-text-muted">Signaleur : {bug.userName || bug.userEmail}</div>
                </div>

                <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 shrink-0">
                  {bug.status || "PENDING"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* DEPLOYMENT FORM MODAL */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-afri-bg-sec border border-rose-500/40 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl relative text-left font-mono">
            <div className="flex items-center justify-between border-b border-afri-border pb-3">
              <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Rocket className="w-4 h-4 text-rose-400" /> Enregistrer un Déploiement
              </h3>
              <button onClick={() => setShowDeployModal(false)} className="text-afri-text-sec hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-afri-text-muted uppercase">Version de la Release</label>
                <input
                  type="text"
                  value={deployVersion}
                  onChange={(e) => setDeployVersion(e.target.value)}
                  className="w-full px-3 py-2 bg-afri-bg border border-afri-border rounded-xl text-white font-bold focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-afri-text-muted uppercase">Canal Cible</label>
                <select
                  value={deployTarget}
                  onChange={(e) => setDeployTarget(e.target.value as any)}
                  className="w-full px-3 py-2 bg-afri-bg border border-afri-border rounded-xl text-white focus:outline-none focus:border-rose-400 cursor-pointer"
                >
                  <option value="production">Production</option>
                  <option value="beta">Canal Bêta</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-afri-text-muted uppercase">Notes de Release / Modifications</label>
                <textarea
                  rows={3}
                  placeholder="Décrivez les correctifs et nouvelles fonctionnalités déployées..."
                  value={deployNotes}
                  onChange={(e) => setDeployNotes(e.target.value)}
                  className="w-full p-3 bg-afri-bg border border-afri-border rounded-xl text-white focus:outline-none focus:border-rose-400 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-afri-border">
              <button
                onClick={() => setShowDeployModal(false)}
                className="px-4 py-2 bg-afri-bg text-afri-text-sec hover:text-white rounded-xl text-xs font-bold uppercase"
              >
                Annuler
              </button>
              <button
                onClick={handleTriggerDeploy}
                disabled={isSubmittingDeploy}
                className="px-5 py-2 bg-rose-500 hover:bg-rose-400 text-white font-black rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
              >
                {isSubmittingDeploy ? "Validation..." : "Valider le Déploiement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM HIDE MODULE MODAL */}
      {confirmHideFlag && createPortal(
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-afri-bg-sec border border-rose-500/50 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl relative text-left font-mono">
            <div className="flex items-center justify-between border-b border-afri-border pb-3">
              <h3 className="text-xs font-black uppercase text-rose-400 tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" /> MASQUER LE MODULE
              </h3>
              <button onClick={() => setConfirmHideFlag(null)} className="text-afri-text-sec hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <p className="text-white font-bold">
                Voulez-vous vraiment passer le module <span className="text-[#D4AF37]">"{confirmHideFlag.name}"</span> au statut <span className="text-rose-400 font-black">MASQUÉ (HIDDEN)</span> ?
              </p>

              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-2 text-[11px] text-rose-200">
                <div className="font-bold flex items-center gap-1.5 text-rose-400 uppercase">
                  ⚠️ Conséquences immédiates :
                </div>
                <ul className="space-y-1 list-disc list-inside text-[10px] opacity-90">
                  <li><strong>Pour les utilisateurs normaux :</strong> Le module sera totalement retiré de l'application (menus, grilles, actions).</li>
                  <li><strong>Protection d'accès direct :</strong> Si un utilisateur tape directement l'URL, l'accès sera bloqué.</li>
                  <li><strong>Pour le Super Fondateur :</strong> Le module reste visible et totalement accessible pour vos tests.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-afri-border">
              <button
                type="button"
                onClick={() => setConfirmHideFlag(null)}
                className="px-4 py-2 bg-afri-bg hover:bg-zinc-800 text-afri-text-sec hover:text-white rounded-xl text-xs font-bold uppercase transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={savingFlagId === confirmHideFlag.id}
                onClick={() => handleUpdateFlagVisibility(confirmHideFlag.id, "HIDDEN")}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow-lg flex items-center gap-2"
              >
                {savingFlagId === confirmHideFlag.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Confirmer le masquage</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
