import React, { useState, useEffect } from "react";
import { 
  Rocket, Layers, CheckCircle2, AlertTriangle, ShieldAlert, Crown, Plus, Trash2, 
  Copy, Edit3, Sliders, X, Check, Loader2, History, Info, Lock, Unlock, 
  ChevronRight, RefreshCw, AlertOctagon, Eye, EyeOff
} from "lucide-react";
import { doc, onSnapshot, setDoc, collection, query, orderBy, deleteDoc, addDoc, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Feature } from "../../types";
import { SecurityService } from "../../lib/SecurityService";

interface AdminDeploymentCenterProps {
  currentUser?: any;
  userEmail?: string;
}

// 16 standard features requested for the Lock Center
const DEFAULT_LOCKED_FEATURES = [
  { id: "grand_marche", name: "Grand Marché", description: "Marché de négociation directe et de contrats d'artistes." },
  { id: "academie", name: "Académie", description: "Espace d'apprentissage professionnel et tutoriels d'art." },
  { id: "podcast", name: "Podcast", description: "Émissions audio et partages de parcours créatifs." },
  { id: "audio", name: "Audio", description: "Lecteur de musique et diffusion d'extraits d'artistes." },
  { id: "evenements", name: "Évènements", description: "Calendrier et réservation de concerts ou festivals." },
  { id: "live", name: "Live", description: "Diffusion de flux audio et vidéo en direct de spectacles." },
  { id: "radar", name: "Radar", description: "Découverte géolocalisée de musiciens et d'opportunités." },
  { id: "messagerie", name: "Messagerie", description: "Messagerie de chat direct chiffrée de bout en bout." },
  { id: "wallet", name: "Wallet", description: "Portefeuille souverain pour les paiements de gombo." },
  { id: "verification", name: "Vérification", description: "Certification d'identité et CNI souveraine." },
  { id: "abonnements", name: "Abonnements", description: "Plans d'abonnement premium et privilèges pro." },
  { id: "createurs_pro", name: "Créateurs Pro", description: "Outils avancés de monétisation pour artistes." },
  { id: "tournois", name: "Tournois", description: "Compétitions de musique et votes du public en direct." },
  { id: "billetterie", name: "Billetterie", description: "Achat et génération de tickets QR Code d'évènements." },
  { id: "publicites", name: "Publicités", description: "Campagnes de promotion ciblées pour les gombos." },
  { id: "communaute", name: "Communauté", description: "Réseau social d'artistes et mur de publications." }
];

export default function AdminDeploymentCenter({ currentUser, userEmail }: AdminDeploymentCenterProps) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState({
    currentStatus: "production", // production, beta_private, maintenance
    isBetaPrivate: false,
    updatedAt: new Date().toISOString()
  });

  // Action / Edit Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Bottom Sheets & Modals visibility states
  const [activeSheet, setActiveSheet] = useState<"none" | "create_update" | "edit_update" | "view_details" | "compare" | "confirm_deploy">("none");
  const [selectedUpdate, setSelectedUpdate] = useState<any | null>(null);
  const [compareUpdate, setCompareUpdate] = useState<any | null>(null);

  // Form Fields for Updates
  const [updateForm, setUpdateForm] = useState({
    name: "",
    description: "",
    author: "",
    version: "",
    date: "",
    time: "",
    state: "draft" as "draft" | "prepared" | "deployed" | "cancelled"
  });

  // Strict founder check
  const isFounder = SecurityService.isFounder(currentUser) || 
                    userEmail?.toLowerCase() === "jhs.kmj7@gmail.com";

  // Real-time synchronization
  useEffect(() => {
    // 1. Sync Features
    const unsubFeatures = onSnapshot(collection(db, "features"), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setFeatures(items);

      // Auto-seed if database features are empty
      if (snap.empty) {
        seedInitialFeatures();
      }
    });
    
    // 2. Sync Deployment Updates
    const unsubVersions = onSnapshot(query(collection(db, "deployment_versions"), orderBy("createdAt", "desc")), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setVersions(items);

      // Auto-seed some initial updates if empty
      if (snap.empty) {
        seedInitialUpdates();
      }
    });

    // 3. Sync System Status
    const unsubStatus = onSnapshot(doc(db, "settings", "system_status"), (snap) => {
      if (snap.exists()) {
        setSystemStatus(snap.data() as any);
      } else {
        // Create initial system status if not exist
        setDoc(doc(db, "settings", "system_status"), {
          currentStatus: "production",
          isBetaPrivate: false,
          updatedAt: new Date().toISOString()
        });
      }
    });

    return () => { 
      unsubFeatures(); 
      unsubVersions(); 
      unsubStatus();
    };
  }, []);

  // Seeding Functions
  const seedInitialFeatures = async () => {
    try {
      for (const item of DEFAULT_LOCKED_FEATURES) {
        await setDoc(doc(db, "features", item.id), {
          name: item.name,
          description: item.description,
          isLocked: false, // Default is unlocked (visible)
          version: "2.5.0",
          updatedAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error("Error seeding initial features:", e);
    }
  };

  const seedInitialUpdates = async () => {
    try {
      const initialUpdates = [
        {
          id: "v25_souverain",
          name: "v2.5 - Souveraineté Digitale",
          description: "Intégration complète de la messagerie chiffrée de bout en bout et du séquestre sécurisé Mobile Money.",
          author: "Super Fondateur",
          version: "2.5.0",
          date: "2026-08-01",
          time: "14:30",
          state: "deployed",
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: "v26_marche",
          name: "v2.6 - Grand Marché des Talents",
          description: "Lancement de l'espace de négociation directe et du système d'enchères de Gombo sécurisé.",
          author: "Cabinet Technique",
          version: "2.6.0",
          date: "2026-08-05",
          time: "10:00",
          state: "prepared",
          createdAt: new Date().toISOString()
        },
        {
          id: "v27_podcast",
          name: "v2.7 - Module Podcast & Audio Live",
          description: "Diffusion en direct et hébergement de podcasts pour les créateurs de contenu africains.",
          author: "Équipe Multimédia",
          version: "2.7.0",
          date: "2026-08-15",
          time: "18:00",
          state: "draft",
          createdAt: new Date(Date.now() + 10000).toISOString()
        }
      ];

      for (const upd of initialUpdates) {
        await setDoc(doc(db, "deployment_versions", upd.id), upd);
      }
    } catch (e) {
      console.error("Error seeding initial updates:", e);
    }
  };

  // Helper alerts
  const triggerToast = (type: "success" | "error", msg: string) => {
    if (type === "success") {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  // Founder Authorization Guard
  const verifyFounderAuth = (): boolean => {
    if (!isFounder) {
      triggerToast("error", "🔒 Action refusée. Seul le Super Fondateur est habilité à modifier les déploiements.");
      return false;
    }
    return true;
  };

  // 1. UPDATE SYSTEM STATUS (Production, Private Beta, Maintenance)
  const handleSystemStatusChange = async (newStatus: string) => {
    if (!verifyFounderAuth()) return;
    setIsLoading(true);
    try {
      const isBeta = newStatus === "beta_private";
      await setDoc(doc(db, "settings", "system_status"), {
        currentStatus: newStatus,
        isBetaPrivate: isBeta,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      triggerToast("success", `Statut système mis à jour : ${newStatus.toUpperCase()}`);
    } catch (e: any) {
      triggerToast("error", `Erreur statut : ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. TOGGLE FEATURE LOCK STATE (ON / OFF)
  const handleToggleFeatureLock = async (id: string, currentLockState: boolean) => {
    if (!verifyFounderAuth()) return;
    try {
      await setDoc(doc(db, "features", id), {
        isLocked: !currentLockState,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      triggerToast("success", `Fonctionnalité ${currentLockState ? 'déverrouillée (visible)' : 'verrouillée (masquée)'}`);
    } catch (e: any) {
      triggerToast("error", `Erreur verrouillage : ${e.message}`);
    }
  };

  // 3. TOGGLE BETA PRIVATE SWITCH
  const handleToggleBetaPrivate = async () => {
    if (!verifyFounderAuth()) return;
    const nextBetaState = !systemStatus.isBetaPrivate;
    setIsLoading(true);
    try {
      await setDoc(doc(db, "settings", "system_status"), {
        isBetaPrivate: nextBetaState,
        currentStatus: nextBetaState ? "beta_private" : "production",
        updatedAt: new Date().toISOString()
      }, { merge: true });
      triggerToast("success", `Mode Bêta Privée ${nextBetaState ? "ACTIVÉ" : "DÉSACTIVÉ"}`);
    } catch (e: any) {
      triggerToast("error", `Erreur Bêta : ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. CRUD FOR UPDATES (File d'attente)
  const openCreateSheet = () => {
    setUpdateForm({
      name: "",
      description: "",
      author: userEmail || "Super Fondateur",
      version: "2.6.0",
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      state: "draft"
    });
    setActiveSheet("create_update");
  };

  const openEditSheet = (upd: any) => {
    setSelectedUpdate(upd);
    setUpdateForm({
      name: upd.name || "",
      description: upd.description || "",
      author: upd.author || "",
      version: upd.version || "",
      date: upd.date || "",
      time: upd.time || "",
      state: upd.state || "draft"
    });
    setActiveSheet("edit_update");
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyFounderAuth()) return;
    if (!updateForm.name.trim() || !updateForm.version.trim()) {
      triggerToast("error", "Le nom et la version sont obligatoires.");
      return;
    }

    setIsLoading(true);
    try {
      const docId = activeSheet === "edit_update" && selectedUpdate ? selectedUpdate.id : `upd_${Date.now()}`;
      const payload = {
        id: docId,
        ...updateForm,
        createdAt: activeSheet === "edit_update" && selectedUpdate ? selectedUpdate.createdAt : new Date().toISOString()
      };

      await setDoc(doc(db, "deployment_versions", docId), payload);
      triggerToast("success", activeSheet === "edit_update" ? "Mise à jour modifiée" : "Brouillon de mise à jour créé !");
      setActiveSheet("none");
    } catch (e: any) {
      triggerToast("error", `Erreur sauvegarde : ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUpdate = async (id: string) => {
    if (!verifyFounderAuth()) return;
    if (!window.confirm("Êtes-vous certain de vouloir supprimer cette mise à jour ?")) return;

    setIsLoading(true);
    try {
      await deleteDoc(doc(db, "deployment_versions", id));
      triggerToast("success", "Mise à jour supprimée définitivement.");
    } catch (e: any) {
      triggerToast("error", `Erreur suppression : ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateUpdate = async (upd: any) => {
    if (!verifyFounderAuth()) return;
    setIsLoading(true);
    try {
      const newId = `upd_dup_${Date.now()}`;
      const duplicate = {
        ...upd,
        id: newId,
        name: `${upd.name} (copie)`,
        version: `${upd.version}-copy`,
        state: "draft",
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "deployment_versions", newId), duplicate);
      triggerToast("success", "Mise à jour dupliquée avec succès !");
    } catch (e: any) {
      triggerToast("error", `Erreur duplication : ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 5. DEPLOYMENT TRIGGER WITH LOGS
  const initiateDeploy = (upd: any) => {
    setSelectedUpdate(upd);
    setActiveSheet("confirm_deploy");
  };

  const handleConfirmDeploy = async () => {
    if (!verifyFounderAuth()) return;
    if (!selectedUpdate) return;

    setIsLoading(true);
    try {
      // Step A: Mark the version as deployed
      await setDoc(doc(db, "deployment_versions", selectedUpdate.id), {
        state: "deployed",
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5)
      }, { merge: true });

      // Step B: Write to deployment_history collection
      const historyId = `hist_${Date.now()}`;
      await setDoc(doc(db, "deployment_history", historyId), {
        id: historyId,
        versionId: selectedUpdate.id,
        name: selectedUpdate.name,
        description: selectedUpdate.description,
        version: selectedUpdate.version,
        author: selectedUpdate.author || "Super Fondateur",
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        state: "deployed",
        timestamp: Date.now()
      });

      // Step C: Update last deployment info on settings
      await setDoc(doc(db, "settings", "last_deployment"), {
        version: selectedUpdate.version,
        name: selectedUpdate.name,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        author: selectedUpdate.author || "Super Fondateur",
        updatedAt: new Date().toISOString()
      });

      triggerToast("success", `🚀 Déploiement réussi de la version ${selectedUpdate.version} !`);
      setActiveSheet("none");
    } catch (e: any) {
      triggerToast("error", `Erreur déploiement : ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 6. DEPLOYMENT RESTORATION (ROLLBACK)
  const handleRestoreVersion = async (upd: any) => {
    if (!verifyFounderAuth()) return;
    if (!window.confirm(`Restaurer le système à la version ${upd.version} ? Un nouveau déploiement sera enregistré.`)) return;

    setIsLoading(true);
    try {
      const historyId = `hist_restore_${Date.now()}`;
      const payload = {
        id: historyId,
        versionId: upd.id,
        name: `${upd.name} (Restauration)`,
        description: `Restauration de la version de secours ${upd.version}. Contenu : ${upd.description}`,
        version: upd.version,
        author: userEmail || "Super Fondateur",
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        state: "deployed",
        timestamp: Date.now()
      };

      // Register new entry in history
      await setDoc(doc(db, "deployment_history", historyId), payload);

      // Mark version as deployed again in queue
      await setDoc(doc(db, "deployment_versions", upd.id), {
        state: "deployed"
      }, { merge: true });

      // Update last deployment info
      await setDoc(doc(db, "settings", "last_deployment"), {
        version: upd.version,
        name: `${upd.name} (Restauration)`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        author: userEmail || "Super Fondateur",
        updatedAt: new Date().toISOString()
      });

      triggerToast("success", `⏮ Version ${upd.version} restaurée avec succès !`);
    } catch (e: any) {
      triggerToast("error", `Erreur restauration : ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate real-time stats
  const draftsCount = versions.filter(v => v.state === "draft").length;
  const pendingCount = versions.filter(v => v.state === "prepared").length;
  const deployedUpdates = versions.filter(v => v.state === "deployed");
  const latestDeployed = deployedUpdates[0]; // Sort order is createdAt desc, so first is latest
  const lockedCount = features.filter(f => (f as any).isLocked === true).length;
  const publicCount = features.filter(f => !(f as any).isLocked).length;

  return (
    <div className="space-y-5 pb-24 text-afri-text font-sans">
      
      {/* Toast Alert Banner */}
      {successMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 p-4 bg-emerald-600 border border-emerald-500 rounded-2xl flex items-center gap-3 shadow-2xl animate-slideIn">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <p className="text-xs text-white font-black">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 p-4 bg-rose-600 border border-rose-500 rounded-2xl flex items-center gap-3 shadow-2xl animate-slideIn">
          <AlertOctagon className="w-5 h-5 text-white shrink-0" />
          <p className="text-xs text-white font-black">{errorMessage}</p>
        </div>
      )}

      {/* Zero Trust Warning for Administrators */}
      {!isFounder && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-400 flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <div className="leading-relaxed">
            <strong className="font-bold">Mode Lecture Seule</strong> • Votre compte administrateur vous autorise à consulter les déploiements mais l'accès en écriture est verrouillé. Seul le <span className="font-mono text-[#D4AF37]">Super Fondateur</span> peut effectuer des mutations.
          </div>
        </div>
      )}

      {/* 1. TABLEAU DE BORD (METRICS CARD) */}
      <div className="bg-afri-bg-sec border border-zinc-800 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="text-xs font-black uppercase text-[#D4AF37] tracking-wider">Tableau de Bord</h3>
          </div>
          <span className="text-[10px] text-afri-text-muted font-mono">Live Sync</span>
        </div>

        {/* Metric Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-afri-bg border border-zinc-800 p-3 rounded-xl">
            <span className="text-[9px] text-afri-text-muted uppercase block">Brouillons</span>
            <strong className="text-base font-black text-afri-text">{draftsCount}</strong>
          </div>
          <div className="bg-afri-bg border border-zinc-800 p-3 rounded-xl">
            <span className="text-[9px] text-afri-text-muted uppercase block">Mises à jour en attente</span>
            <strong className="text-base font-black text-[#D4AF37]">{pendingCount}</strong>
          </div>
          <div className="bg-afri-bg border border-zinc-800 p-3 rounded-xl">
            <span className="text-[9px] text-afri-text-muted uppercase block">Dernière déployée</span>
            <strong className="text-xs font-black text-emerald-400 block truncate">
              {latestDeployed ? `v${latestDeployed.version}` : "Aucune"}
            </strong>
          </div>
          <div className="bg-afri-bg border border-zinc-800 p-3 rounded-xl">
            <span className="text-[9px] text-afri-text-muted uppercase block">Masquées / Publiques</span>
            <strong className="text-xs font-black text-afri-text block">
              <span className="text-orange-400">{lockedCount}</span> / <span className="text-emerald-400">{publicCount}</span>
            </strong>
          </div>
        </div>

        {/* Detailed last deploy status */}
        {latestDeployed && (
          <div className="bg-afri-bg p-3 border border-zinc-800 rounded-xl text-[11px] space-y-1">
            <div className="text-afri-text-muted uppercase text-[9px] font-bold">Dernier Déploiement :</div>
            <div className="flex justify-between font-semibold">
              <span className="text-emerald-400">Version {latestDeployed.version}</span>
              <span className="font-mono text-afri-text-muted">{latestDeployed.date} à {latestDeployed.time}</span>
            </div>
            <p className="text-afri-text-sec truncate italic">"{latestDeployed.description}"</p>
          </div>
        )}

        {/* System Status Segment Controller */}
        <div className="pt-2 border-t border-zinc-800 space-y-2">
          <label className="text-[10px] font-black uppercase text-afri-text-sec block">
            Statut Actuel de l'Infrasctructure :
          </label>
          <div className="grid grid-cols-3 gap-1 bg-afri-bg p-1 rounded-xl border border-zinc-800">
            {[
              { key: "production", label: "Production", color: "text-emerald-400" },
              { key: "beta_private", label: "Bêta privée", color: "text-amber-400" },
              { key: "maintenance", label: "Maintenance", color: "text-rose-500" }
            ].map((st) => {
              const active = systemStatus.currentStatus === st.key;
              return (
                <button
                  key={st.key}
                  onClick={() => handleSystemStatusChange(st.key)}
                  disabled={isLoading}
                  className={`py-2 px-1 rounded-lg text-[10px] font-black uppercase transition text-center flex flex-col items-center justify-center cursor-pointer ${
                    active 
                      ? "bg-[#D4AF37] text-black" 
                      : "text-afri-text-sec hover:text-afri-text"
                  }`}
                >
                  <span className={active ? "text-black" : st.color}>
                    {st.key === "production" ? "🟢" : st.key === "beta_private" ? "🟡" : "🔴"}
                  </span>
                  <span className="mt-0.5">{st.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. FILE D'ATTENTE DES MISES À JOUR */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase text-[#D4AF37] tracking-wider flex items-center gap-2">
            <Rocket className="w-4 h-4 text-[#D4AF37]" />
            File d'Attente des Mises à Jour
          </h3>
          <button
            onClick={openCreateSheet}
            className="p-1.5 px-3 bg-[#D4AF37] hover:bg-amber-400 text-black font-black text-[10px] uppercase rounded-xl transition flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3px]" />
            Créer
          </button>
        </div>

        {versions.length === 0 ? (
          <div className="p-8 text-center bg-afri-bg-sec border border-zinc-800 rounded-2xl text-xs text-afri-text-muted">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#D4AF37]" />
            Chargement de la file d'attente...
          </div>
        ) : (
          <div className="space-y-2.5">
            {versions.map((upd) => {
              // Badge color configuration
              let badgeStyle = "bg-zinc-800 text-zinc-400 border-zinc-700";
              let badgeLabel = "Brouillon";
              if (upd.state === "prepared") {
                badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/30";
                badgeLabel = "Prête";
              } else if (upd.state === "deployed") {
                badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
                badgeLabel = "Déployée";
              } else if (upd.state === "cancelled") {
                badgeStyle = "bg-rose-500/10 text-rose-400 border-rose-500/30";
                badgeLabel = "Annulée";
              }

              return (
                <div 
                  key={upd.id} 
                  className="bg-afri-bg-sec border border-zinc-800 rounded-2xl p-4.5 space-y-3 shadow-md w-full"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-black text-afri-text uppercase tracking-wide">
                          {upd.name}
                        </h4>
                        <span className="font-mono text-[9px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.2 rounded-full border border-[#D4AF37]/20">
                          v{upd.version}
                        </span>
                      </div>
                      <p className="text-[11px] text-afri-text-sec leading-relaxed">
                        {upd.description}
                      </p>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border shrink-0 ${badgeStyle}`}>
                      {badgeLabel}
                    </span>
                  </div>

                  {/* Metadata and Author details */}
                  <div className="flex items-center justify-between text-[9px] text-afri-text-muted font-mono border-t border-zinc-800/60 pt-2 flex-wrap gap-2">
                    <span>Auteur: <strong className="text-afri-text-sec font-sans font-semibold">{upd.author}</strong></span>
                    <span>{upd.date} • {upd.time}</span>
                  </div>

                  {/* Android Quick Actions bar */}
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-1 flex-wrap">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedUpdate(upd);
                          setActiveSheet("view_details");
                        }}
                        className="p-2 bg-afri-bg hover:bg-zinc-800 text-afri-text-sec hover:text-white rounded-xl border border-zinc-800 transition cursor-pointer"
                        title="Détails"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditSheet(upd)}
                        className="p-2 bg-afri-bg hover:bg-zinc-800 text-afri-text-sec hover:text-[#D4AF37] rounded-xl border border-zinc-800 transition cursor-pointer"
                        title="Modifier"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUpdate(upd.id)}
                        className="p-2 bg-afri-bg hover:bg-zinc-800 text-rose-400 hover:text-rose-500 rounded-xl border border-zinc-800 transition cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicateUpdate(upd)}
                        className="p-2 bg-afri-bg hover:bg-zinc-800 text-sky-400 hover:text-sky-500 rounded-xl border border-zinc-800 transition cursor-pointer"
                        title="Dupliquer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {upd.state !== "deployed" && (
                      <button
                        onClick={() => initiateDeploy(upd)}
                        className="px-3.5 py-1.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-black text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1"
                      >
                        <Rocket className="w-3 h-3" />
                        Déployer
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. CENTRE DE VERROUILLAGE (SWITCHES) */}
      <div className="bg-afri-bg-sec border border-zinc-800 rounded-2xl p-4.5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="text-xs font-black uppercase text-[#D4AF37] tracking-wider">
              Centre de Verrouillage & Sécurité
            </h3>
          </div>
          <span className="text-[9px] font-mono font-bold bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded border border-orange-500/30 flex items-center gap-1">
            <Crown className="w-2.5 h-2.5" />
            Souverain
          </span>
        </div>

        <p className="text-[11px] text-afri-text-sec leading-relaxed">
          Activez le commutateur pour <strong className="text-orange-400 uppercase">Verrouiller (Masquer)</strong> une fonctionnalité pour l'ensemble des utilisateurs (excepté le Fondateur). Désactivez le commutateur pour la rendre <strong className="text-emerald-400 uppercase">Publique (Visible)</strong>.
        </p>

        {/* Feature Switches list */}
        <div className="divide-y divide-zinc-800/60 max-h-[320px] overflow-y-auto pr-1">
          {features.map((feat) => {
            const isLocked = (feat as any).isLocked || false;
            return (
              <div key={feat.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5 max-w-[70%]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-afri-text text-[11px]">{feat.name}</span>
                    {isLocked ? (
                      <span className="text-[8px] font-mono font-black bg-orange-500/15 text-orange-400 px-1 py-0.1 rounded uppercase">Masqué</span>
                    ) : (
                      <span className="text-[8px] font-mono font-black bg-emerald-500/15 text-emerald-400 px-1 py-0.1 rounded uppercase">Visible</span>
                    )}
                  </div>
                  <p className="text-[10px] text-afri-text-muted truncate">
                    {feat.description}
                  </p>
                </div>

                {/* ON / OFF Switch representation */}
                <button
                  onClick={() => handleToggleFeatureLock(feat.id, isLocked)}
                  className={`w-11 h-6 rounded-full relative p-0.5 transition-colors duration-200 ease-in-out cursor-pointer outline-none shrink-0 ${
                    isLocked ? 'bg-orange-500' : 'bg-zinc-800 border border-zinc-700'
                  }`}
                >
                  <span
                    className={`block w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      isLocked ? 'translate-x-5 bg-white' : 'translate-x-0 bg-zinc-500'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. MODE BÊTA PRIVÉE INDEPENDENT INTERRUPTER */}
      <div className="bg-afri-bg-sec border border-zinc-800 rounded-2xl p-4.5 flex items-center justify-between gap-4">
        <div className="space-y-1 max-w-[70%]">
          <h4 className="text-xs font-black uppercase text-afri-text tracking-wide flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
            Mode Bêta Privée
          </h4>
          <p className="text-[10px] text-afri-text-sec leading-relaxed">
            Lorsque activé, les administrateurs et le fondateur accèdent à 100% des exclusivités. Les utilisateurs finaux voient uniquement la version publique de production stable.
          </p>
        </div>

        {/* Bêta Switch */}
        <button
          onClick={handleToggleBetaPrivate}
          className={`w-12 h-6.5 rounded-full relative p-0.5 transition-colors duration-200 ease-in-out cursor-pointer outline-none shrink-0 ${
            systemStatus.isBetaPrivate ? 'bg-[#D4AF37]' : 'bg-zinc-800 border border-zinc-700'
          }`}
        >
          <span
            className={`block w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
              systemStatus.isBetaPrivate ? 'translate-x-5.5 bg-black' : 'translate-x-0 bg-zinc-500'
            }`}
          />
        </button>
      </div>

      {/* 5. HISTORIQUE DES DÉPLOIEMENTS */}
      <div className="bg-afri-bg-sec border border-zinc-800 rounded-2xl p-4.5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase text-[#D4AF37] tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-[#D4AF37]" />
            Historique des Déploiements Actifs
          </h3>
          <span className="text-[9px] font-mono text-afri-text-muted">Chronologique</span>
        </div>

        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 divide-y divide-zinc-800/50">
          {deployedUpdates.map((upd, idx) => (
            <div key={upd.id} className="pt-2.5 first:pt-0 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-emerald-400">v{upd.version}</span>
                  <strong className="text-afri-text font-bold truncate max-w-[120px]">{upd.name}</strong>
                </div>
                <span className="font-mono text-[9px] text-afri-text-muted">{upd.date} • {upd.time}</span>
              </div>
              <p className="text-[10px] text-afri-text-sec line-clamp-2">"{upd.description}"</p>
              
              <div className="flex items-center justify-between text-[9px] text-afri-text-muted">
                <span>Auteur: <strong className="text-afri-text font-normal">{upd.author}</strong></span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedUpdate(upd);
                      setActiveSheet("view_details");
                    }}
                    className="text-[#D4AF37] hover:underline font-bold"
                  >
                    Consulter
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUpdate(latestDeployed);
                      setCompareUpdate(upd);
                      setActiveSheet("compare");
                    }}
                    className="text-sky-400 hover:underline font-bold"
                  >
                    Comparer
                  </button>
                  {latestDeployed?.id !== upd.id && (
                    <button
                      onClick={() => handleRestoreVersion(upd)}
                      className="text-rose-400 hover:underline font-bold"
                    >
                      Restaurer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ==================================================
          BOTTOM SHEETS (ANDROID-STYLE OVERLAY OVERLAY PANELS)
          ================================================== */}
      
      {/* 1. Add / Edit Update Bottom Sheet */}
      {(activeSheet === "create_update" || activeSheet === "edit_update") && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Black Backdrop overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setActiveSheet("none")} />
          
          {/* Sheet Body */}
          <div className="relative bg-zinc-950 border-t border-zinc-800 w-full max-w-lg rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-slideUp text-xs">
            {/* Grabber handle bar */}
            <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto" onClick={() => setActiveSheet("none")} />
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-black uppercase text-[#D4AF37] flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                {activeSheet === "create_update" ? "Créer un Brouillon de Déploiement" : "Modifier la Mise à Jour"}
              </h3>
              <button onClick={() => setActiveSheet("none")} className="p-1 rounded-full bg-zinc-900 text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUpdate} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="font-bold text-afri-text-sec">Nom de la mise à jour :</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: v2.6 - Grand Marché"
                  value={updateForm.name}
                  onChange={(e) => setUpdateForm({ ...updateForm, name: e.target.value })}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-[#D4AF37] focus:outline-none text-afri-text"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-afri-text-sec">Description des nouveautés :</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Expliquez précisément les modifications techniques..."
                  value={updateForm.description}
                  onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-[#D4AF37] focus:outline-none text-afri-text resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-afri-text-sec">Version (SemVer) :</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 2.6.0"
                    value={updateForm.version}
                    onChange={(e) => setUpdateForm({ ...updateForm, version: e.target.value })}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-[#D4AF37] focus:outline-none text-afri-text font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-afri-text-sec">Auteur :</label>
                  <input
                    type="text"
                    required
                    value={updateForm.author}
                    onChange={(e) => setUpdateForm({ ...updateForm, author: e.target.value })}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-[#D4AF37] focus:outline-none text-afri-text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-afri-text-sec">Date de plan :</label>
                  <input
                    type="date"
                    required
                    value={updateForm.date}
                    onChange={(e) => setUpdateForm({ ...updateForm, date: e.target.value })}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-[#D4AF37] focus:outline-none text-afri-text"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-afri-text-sec">Heure de plan :</label>
                  <input
                    type="time"
                    required
                    value={updateForm.time}
                    onChange={(e) => setUpdateForm({ ...updateForm, time: e.target.value })}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-[#D4AF37] focus:outline-none text-afri-text"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-afri-text-sec font-mono">État initial :</label>
                <select
                  value={updateForm.state}
                  onChange={(e) => setUpdateForm({ ...updateForm, state: e.target.value as any })}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-[#D4AF37] focus:outline-none text-afri-text"
                >
                  <option value="draft">Brouillon</option>
                  <option value="prepared">Prête</option>
                  <option value="deployed">Déployée d'office</option>
                  <option value="cancelled">Annulée</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveSheet("none")}
                  className="flex-1 py-3 bg-zinc-900 text-afri-text font-bold uppercase rounded-xl border border-zinc-800 transition text-center"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase rounded-xl transition text-center flex items-center justify-center gap-1.5"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sauvegarder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. View Details / Consulter Bottom Sheet */}
      {activeSheet === "view_details" && selectedUpdate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setActiveSheet("none")} />
          <div className="relative bg-zinc-950 border-t border-zinc-800 w-full max-w-lg rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-slideUp text-xs">
            <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto" onClick={() => setActiveSheet("none")} />
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-black uppercase text-[#D4AF37] flex items-center gap-2">
                <Info className="w-4 h-4" />
                Détails du Déploiement
              </h3>
              <button onClick={() => setActiveSheet("none")} className="p-1 rounded-full bg-zinc-900 text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
                <span className="text-[9px] text-afri-text-muted uppercase font-mono">Dénomination</span>
                <p className="text-sm font-black text-white">{selectedUpdate.name}</p>
                <span className="inline-block text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-full mt-1">
                  Version {selectedUpdate.version}
                </span>
              </div>

              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
                <span className="text-[9px] text-afri-text-muted uppercase font-mono">Changements Majeurs</span>
                <p className="text-xs text-afri-text leading-relaxed whitespace-pre-wrap">{selectedUpdate.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
                  <span className="text-[9px] text-afri-text-muted uppercase font-mono">Auteur</span>
                  <p className="text-xs font-bold text-white">{selectedUpdate.author || "Non spécifié"}</p>
                </div>
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
                  <span className="text-[9px] text-afri-text-muted uppercase font-mono">État</span>
                  <p className="text-xs font-bold uppercase text-[#D4AF37]">{selectedUpdate.state}</p>
                </div>
              </div>

              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
                <span className="text-[9px] text-afri-text-muted uppercase font-mono">Date & Heure</span>
                <p className="text-xs text-white font-mono">{selectedUpdate.date} à {selectedUpdate.time}</p>
              </div>

              <button
                onClick={() => setActiveSheet("none")}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-850 text-afri-text font-black uppercase rounded-xl border border-zinc-800 transition"
              >
                Fermer l'Aperçu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Compare Side-by-Side Bottom Sheet */}
      {activeSheet === "compare" && selectedUpdate && compareUpdate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setActiveSheet("none")} />
          <div className="relative bg-zinc-950 border-t border-zinc-800 w-full max-w-lg rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-slideUp text-xs">
            <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto" onClick={() => setActiveSheet("none")} />
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-black uppercase text-[#D4AF37] flex items-center gap-2">
                <History className="w-4 h-4" />
                Comparaison de Versions
              </h3>
              <button onClick={() => setActiveSheet("none")} className="p-1 rounded-full bg-zinc-900 text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[10px] text-afri-text-sec italic">
              Comparaison de la version de référence active et de l'archive sélectionnée.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Reference current version */}
              <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-2">
                <span className="text-[9px] text-emerald-400 uppercase font-mono font-bold block">★ ACTIVE ACTUELLE</span>
                <div>
                  <span className="text-xs font-black block text-white">v{selectedUpdate.version}</span>
                  <p className="text-[10px] text-afri-text-muted">{selectedUpdate.name}</p>
                </div>
                <p className="text-[10px] text-afri-text leading-relaxed">
                  {selectedUpdate.description}
                </p>
                <div className="text-[9px] text-afri-text-muted font-mono pt-1">
                  Auteur : {selectedUpdate.author}
                </div>
              </div>

              {/* Version to compare */}
              <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-2">
                <span className="text-[9px] text-[#D4AF37] uppercase font-mono font-bold block">☆ ARCHIVE CIBLÉE</span>
                <div>
                  <span className="text-xs font-black block text-white">v{compareUpdate.version}</span>
                  <p className="text-[10px] text-afri-text-muted">{compareUpdate.name}</p>
                </div>
                <p className="text-[10px] text-afri-text leading-relaxed">
                  {compareUpdate.description}
                </p>
                <div className="text-[9px] text-afri-text-muted font-mono pt-1">
                  Auteur : {compareUpdate.author}
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveSheet("none")}
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-850 text-afri-text font-black uppercase rounded-xl border border-zinc-800 transition"
            >
              Quitter la Comparaison
            </button>
          </div>
        </div>
      )}

      {/* 4. Confirm Deploy Bottom Sheet */}
      {activeSheet === "confirm_deploy" && selectedUpdate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setActiveSheet("none")} />
          <div className="relative bg-zinc-950 border-t border-zinc-800 w-full max-w-lg rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-slideUp text-xs">
            <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto" onClick={() => setActiveSheet("none")} />
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-black uppercase text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                Validation de Déploiement Immédiat
              </h3>
              <button onClick={() => setActiveSheet("none")} className="p-1 rounded-full bg-zinc-900 text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex gap-3">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <div className="space-y-1">
                <strong className="font-bold block uppercase text-[10px]">Attention : Action Souveraine</strong>
                <p className="text-[10px] leading-relaxed text-zinc-300">
                  Le déploiement publiera instantanément la version <span className="font-mono text-white font-black bg-rose-600/30 px-1.5 py-0.2 rounded">v{selectedUpdate.version}</span> auprès de l'ensemble de la communauté AFRIGOMBO. Cette action est hautement critique.
                </p>
              </div>
            </div>

            <div className="space-y-2 p-3.5 bg-zinc-900 rounded-xl border border-zinc-800">
              <div className="flex justify-between">
                <span className="text-afri-text-muted">Mise à jour :</span>
                <strong className="text-white font-bold">{selectedUpdate.name}</strong>
              </div>
              <div className="flex justify-between font-mono text-[10px]">
                <span className="text-afri-text-muted">Auteur :</span>
                <span className="text-[#D4AF37]">{selectedUpdate.author}</span>
              </div>
              <p className="text-[11px] text-zinc-400 border-t border-zinc-800/80 pt-2 italic">
                "{selectedUpdate.description}"
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveSheet("none")}
                className="flex-1 py-3 bg-zinc-900 text-afri-text font-bold uppercase rounded-xl border border-zinc-800 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDeploy}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
              >
                <Check className="w-4 h-4" />
                Déployer Maintenant
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
