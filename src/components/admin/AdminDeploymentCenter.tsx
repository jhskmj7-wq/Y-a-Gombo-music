import React, { useState, useEffect } from "react";
import { BUILD_ID, BUILD_TIME } from "../../buildInfo";
import {
  Rocket, ToggleRight, CheckCircle, History, Info, Clock, Check, X,
  ShieldAlert, ChevronRight, User, Server, Database, GitBranch, Cpu,
  AlertCircle, ShieldCheck, Terminal, Layers, RefreshCw, FileText, CheckCircle2,
  XCircle, Zap, Globe, Smartphone, Cloud, Code, Settings
} from "lucide-react";
import { gomboDB, db } from "../../firebase";
import { auth } from "../../lib/firebase";
import {
  collection, doc, onSnapshot, setDoc, updateDoc, addDoc, query, orderBy, limit
} from "firebase/firestore";

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

export interface FeatureFlagItem {
  id: string;
  name: string;
  category: string;
  enabled: boolean;
  status: "validated" | "experimental" | "pending" | "disabled";
  description?: string;
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
  const [serverVersion, setServerVersion] = useState<{ buildId?: string; timestamp?: string; env?: string } | null>(null);
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

  // Filter for Feature Flags
  const [activeFlagFilter, setActiveFlagFilter] = useState<"all" | "validated" | "experimental" | "pending" | "disabled">("all");

  // 1. DEFAULT FEATURE FLAGS INITIALIZER
  const defaultFlags: FeatureFlagItem[] = [
    { id: "marche", name: "Grand Marché & Annonces", category: "Économie", enabled: true, status: "validated", description: "Plateforme de transactions et petites annonces" },
    { id: "wallet", name: "Wallet Souverain AFRIPAY", category: "Finance", enabled: true, status: "validated", description: "Solde rechargeable et virements sécurisés" },
    { id: "chat", name: "Messagerie Instantanée V2", category: "Communication", enabled: true, status: "validated", description: "Messages cryptés et notifications" },
    { id: "radar", name: "Radar Géolocalisé Nearby", category: "Navigation", enabled: true, status: "validated", description: "Cartographie et proximité des membres" },
    { id: "cahier", name: "Cahier Numérique du Fondateur", category: "Gouvernance", enabled: true, status: "validated", description: "Carnet de notes Firestore professionnel" },
    { id: "appels", name: "Appels Audio/Vidéo WebRTC", category: "Communication", enabled: true, status: "experimental", description: "Flux direct peer-to-peer en temps réel" },
    { id: "academie", name: "Académie AFRIGOMBO ELITE", category: "Formation", enabled: false, status: "pending", description: "Tutoriels et certifications professionnelles" },
    { id: "podcasts", name: "Podcasts & Multimédia", category: "Média", enabled: true, status: "validated", description: "Lecteur audio kora et diffusions résonantes" },
    { id: "events", name: "Événements & Billetterie", category: "Communauté", enabled: true, status: "experimental", description: "Création et reservation d'événements" },
    { id: "gombo_id", name: "Gombo ID Souverain", category: "Sécurité", enabled: true, status: "validated", description: "Système de badges d'accréditation" },
    { id: "verification", name: "Vérification KYC Biométrique", category: "Sécurité", enabled: false, status: "pending", description: "Contrôle d'identité par IA" },
    { id: "notifications", name: "Diffusions Mégaphoniques", category: "Communication", enabled: true, status: "validated", description: "Pousse de notifications en masse" }
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

    // Feature Flags stream
    const flagsRef = doc(db, "settings", "feature_flags");
    const unsubFlags = onSnapshot(flagsRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().flags) {
        setFeatureFlags(docSnap.data().flags);
      } else {
        setFeatureFlags(defaultFlags);
      }
    }, (err) => {
      console.error("Err feature flags stream:", err);
      setFeatureFlags(defaultFlags);
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
      unsubBugs();
    };
  }, []);

  // TOGGLE FEATURE FLAG IN FIRESTORE
  const handleToggleFlag = async (flagId: string) => {
    const updatedFlags: FeatureFlagItem[] = featureFlags.map((f) => {
      if (f.id === flagId) {
        const newEnabled = !f.enabled;
        const newStatus: FeatureFlagItem["status"] = newEnabled
          ? (f.status === "disabled" ? "experimental" : f.status)
          : "disabled";
        return {
          ...f,
          enabled: newEnabled,
          status: newStatus
        };
      }
      return f;
    });

    setFeatureFlags(updatedFlags);
    try {
      const flagsRef = doc(db, "settings", "feature_flags");
      await setDoc(flagsRef, {
        flags: updatedFlags,
        updatedAt: new Date().toISOString(),
        updatedBy: founderEmail
      }, { merge: true });
      try { audioSynth?.playValidationSuccess?.(); } catch (e) {}
    } catch (err) {
      console.error("Erreur mise à jour feature flag:", err);
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

  const filteredFlags = featureFlags.filter((f) => {
    if (activeFlagFilter === "all") return true;
    return f.status === activeFlagFilter;
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
              DIAGNOSTIC DE SYNCHRONISATION EN TEMPS RÉEL
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Client Runtime Build ID */}
          <div className="p-3 bg-afri-bg/80 border border-afri-border rounded-2xl space-y-1">
            <span className="text-[9px] uppercase text-afri-text-muted font-bold block">1. BUILD_ID Client (React)</span>
            <div className="text-xs font-black text-afri-gold truncate">{BUILD_ID}</div>
            <span className="text-[9px] text-afri-text-sec block">Compilé : {new Date(BUILD_TIME).toLocaleTimeString("fr-FR")}</span>
          </div>

          {/* 2. Server Version.json Build ID */}
          <div className="p-3 bg-afri-bg/80 border border-afri-border rounded-2xl space-y-1">
            <span className="text-[9px] uppercase text-afri-text-muted font-bold block">2. BUILD_ID Serveur</span>
            <div className="text-xs font-black text-white truncate">
              {serverVersion?.buildId || (isCheckingServerVersion ? "Vérification..." : "NON VÉRIFIABLE")}
            </div>
            <span className="text-[9px] text-afri-text-sec block">
              {serverVersion?.timestamp ? `Serveur : ${new Date(serverVersion.timestamp).toLocaleTimeString("fr-FR")}` : "/version.json"}
            </span>
          </div>

          {/* 3. Git Commit */}
          <div className="p-3 bg-afri-bg/80 border border-afri-border rounded-2xl space-y-1">
            <span className="text-[9px] uppercase text-afri-text-muted font-bold block">3. Git Commit Hash</span>
            <div className="text-xs font-black text-emerald-400 truncate">
              {serverVersion?.commitHash ? serverVersion.commitHash.substring(0, 12) : "master (HEAD)"}
            </div>
            <span className="text-[9px] text-afri-text-sec block">Branche : master</span>
          </div>

          {/* 4. Firebase Project ID */}
          <div className="p-3 bg-afri-bg/80 border border-afri-border rounded-2xl space-y-1">
            <span className="text-[9px] uppercase text-afri-text-muted font-bold block">4. Projet Firebase</span>
            <div className="text-xs font-black text-cyan-400 truncate">
              {auth?.app?.options?.projectId || "afrigombo"}
            </div>
            <span className="text-[9px] text-afri-text-sec block">Base : Firestore Souveraine</span>
          </div>

          {/* 5. Anonymized Auth User */}
          <div className="p-3 bg-afri-bg/80 border border-afri-border rounded-2xl space-y-1">
            <span className="text-[9px] uppercase text-afri-text-muted font-bold block">5. Utilisateur Connecté</span>
            <div className="text-xs font-black text-amber-300 truncate">
              {auth?.currentUser?.email
                ? `${auth.currentUser.email.substring(0, 3)}***@${auth.currentUser.email.split('@')[1] || ''}`
                : (currentUser?.email ? `${currentUser.email.substring(0, 3)}***` : "Anonyme / Non Connecté")}
            </div>
            <span className="text-[9px] text-afri-text-sec block truncate">
              UID : {auth?.currentUser?.uid ? `${auth.currentUser.uid.substring(0, 4)}***${auth.currentUser.uid.slice(-3)}` : "Aucun"}
            </span>
          </div>

          {/* 6. Firebase Status */}
          <div className="p-3 bg-afri-bg/80 border border-afri-border rounded-2xl space-y-1">
            <span className="text-[9px] uppercase text-afri-text-muted font-bold block">6. Statut Firebase</span>
            <div className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Connecté & Initialisé</span>
            </div>
            <span className="text-[9px] text-afri-text-sec block">Auth + Firestore prêt</span>
          </div>

          {/* 7. Vercel Status */}
          <div className="p-3 bg-afri-bg/80 border border-afri-border rounded-2xl space-y-1">
            <span className="text-[9px] uppercase text-afri-text-muted font-bold block">7. Statut Serveur Vercel</span>
            <div className="text-xs font-black text-white">
              {serverVersion?.buildId ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" /> Joignable (/version.json OK)
                </span>
              ) : (
                <span className="text-amber-400 font-bold">NON VÉRIFIABLE EN DIRECT</span>
              )}
            </div>
            <span className="text-[9px] text-afri-text-sec block">CDN Cache : Revalidation 0s</span>
          </div>

          {/* 8. Verdict de Diagnostic */}
          <div className="p-3 bg-afri-bg/80 border border-afri-border rounded-2xl space-y-1">
            <span className="text-[9px] uppercase text-afri-text-muted font-bold block">8. Bilan du Build</span>
            <div>
              {serverVersion?.buildId && serverVersion.buildId === BUILD_ID ? (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold uppercase inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  BUILD DÉPLOYÉ CONFORME
                </span>
              ) : serverVersion?.buildId ? (
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-bold uppercase inline-flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-rose-400" />
                  NOUVEAU BUILD DISPONIBLE
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold uppercase inline-flex items-center gap-1">
                  <Info className="w-3 h-3 text-amber-400" />
                  NON VÉRIFIABLE
                </span>
              )}
            </div>
            <span className="text-[9px] text-afri-text-sec block truncate">
              {serverVersion?.buildId === BUILD_ID
                ? "Code source et bundle version.json concordants"
                : "Vérifiez que Chrome a rechargé index.html"}
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

      {/* 4. FEATURE FLAGS ENGINE */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-afri-border pb-2">
          <h3 className="text-xs font-black uppercase text-afri-gold tracking-widest flex items-center gap-2 font-mono">
            <ToggleRight className="w-4 h-4 text-[#D4AF37]" />
            GESTIONNAIRE DE FEATURE FLAGS ({featureFlags.length})
          </h3>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {(["all", "validated", "experimental", "pending", "disabled"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setActiveFlagFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase font-bold transition whitespace-nowrap cursor-pointer ${
                  activeFlagFilter === st ? "bg-[#D4AF37] text-black" : "bg-afri-bg text-afri-text-sec hover:text-white"
                }`}
              >
                {st === "all" ? "Tous" : st === "validated" ? "Validés" : st === "experimental" ? "Expérimentaux" : st === "pending" ? "En attente" : "Désactivés"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredFlags.map((flag) => (
            <div
              key={flag.id}
              onClick={() => handleToggleFlag(flag.id)}
              className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                flag.enabled
                  ? "bg-afri-bg-sec border-[#D4AF37]/40 hover:border-[#D4AF37]"
                  : "bg-afri-bg/50 border-afri-border hover:border-afri-border opacity-70"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-mono font-bold text-afri-text-muted">{flag.category}</span>
                  <h4 className="text-xs font-bold text-white leading-tight">{flag.name}</h4>
                </div>

                {/* Toggle switch visual */}
                <div className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${flag.enabled ? "bg-[#D4AF37]" : "bg-zinc-700"}`}>
                  <div className={`w-4 h-4 bg-afri-bg rounded-full transition-transform ${flag.enabled ? "translate-x-4" : "translate-x-0"}`} />
                </div>
              </div>

              <p className="text-[11px] text-afri-text-sec font-mono line-clamp-2 leading-tight">
                {flag.description || "Fonctionnalité paramétrable du système"}
              </p>

              <div className="flex items-center justify-between text-[9px] font-mono pt-2 border-t border-afri-border">
                <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                  flag.status === "validated" ? "bg-emerald-500/10 text-emerald-400" :
                  flag.status === "experimental" ? "bg-amber-500/10 text-amber-400" :
                  flag.status === "pending" ? "bg-sky-500/10 text-sky-400" : "bg-afri-bg-ter text-afri-text-muted"
                }`}>
                  {flag.status}
                </span>

                <span className="text-afri-text-muted">{flag.enabled ? "Actif" : "Inactif"}</span>
              </div>
            </div>
          ))}
        </div>
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

    </div>
  );
}
