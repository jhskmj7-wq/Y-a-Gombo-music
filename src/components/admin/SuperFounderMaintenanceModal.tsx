import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, onSnapshot, addDoc, collection } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../AuthContext";
import { SecurityService } from "../../lib/SecurityService";
import { AndroidBottomSheet } from "../ui/AndroidBottomSheet";
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Megaphone, 
  Wrench, 
  Radio, 
  Save, 
  Trash2, 
  Bell, 
  Home, 
  Briefcase, 
  ShoppingBag, 
  Wallet, 
  MessageSquare, 
  User, 
  CreditCard, 
  Award,
  Sparkles,
  Send,
  RefreshCw,
  Edit3,
  Check
} from "lucide-react";
import { audioSynth } from "../../lib/audio";

interface SuperFounderMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ModuleItem {
  key: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const APP_MODULES: ModuleItem[] = [
  { key: "home", label: "Accueil & Terrain", icon: Home, description: "Flux principal, tendances, landing" },
  { key: "gombos", label: "Gombos & Opportunités", icon: Briefcase, description: "Publications, candidatures, contrats" },
  { key: "marketplace", label: "Grand Marché", icon: ShoppingBag, description: "Achat, vente, location matériel" },
  { key: "wallet", label: "Wallet & Cash", icon: Wallet, description: "Solde, dépôts, retraits, transferts" },
  { key: "messaging", label: "Messagerie & Salons VIP", icon: MessageSquare, description: "Conversations, groupes musicaux" },
  { key: "avatar", label: "Avatar Store", icon: User, description: "Articles, recharges pièces, cadeaux" },
  { key: "payments", label: "Paiements Mobile Money", icon: CreditCard, description: "Validation Orange/Moov/Wave" },
  { key: "subscriptions", label: "Abonnements & Pass", icon: Award, description: "Certifications, boosts, VIP" },
];

export function SuperFounderMaintenanceModal({ isOpen, onClose }: SuperFounderMaintenanceModalProps) {
  const { currentUser, profile } = useAuth();

  // Maintenance Data State
  const [globalMode, setGlobalMode] = useState<boolean>(false);
  const [globalMessage, setGlobalMessage] = useState<string>("AfriGombo sera temporairement indisponible afin d'effectuer une maintenance technique.");
  const [scheduled, setScheduled] = useState<boolean>(false);
  const [startAt, setStartAt] = useState<string>("");
  const [endAt, setEndAt] = useState<string>("");
  const [alertBeforeMinutes, setAlertBeforeMinutes] = useState<number | null>(15);
  const [modules, setModules] = useState<Record<string, boolean>>({});

  // UI Local States
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showScheduleForm, setShowScheduleForm] = useState<boolean>(false);

  // Global Alert Form State
  const [alertTitle, setAlertTitle] = useState<string>("⚠️ Information Système AfriGombo");
  const [alertMessage, setAlertMessage] = useState<string>("");
  const [alertTarget, setAlertTarget] = useState<string>("Tous les utilisateurs");
  const [alertPriority, setAlertPriority] = useState<"Urgente" | "Importante" | "Normale">("Importante");
  const [alertDurationHours, setAlertDurationHours] = useState<number>(24);
  const [sendingAlert, setSendingAlert] = useState<boolean>(false);

  const isSuperUser = 
    SecurityService.isFounder(currentUser) || 
    SecurityService.isFounder(profile) || 
    SecurityService.isAdmin(currentUser) || 
    SecurityService.isAdmin(profile) ||
    currentUser?.email === "jhs.kmj7@gmail.com" ||
    profile?.email === "jhs.kmj7@gmail.com";

  // Realtime subscription to doc(db, "settings", "maintenance")
  useEffect(() => {
    if (!isOpen) return;

    const unsub = onSnapshot(doc(db, "settings", "maintenance"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setGlobalMode(data.globalMode === true || data.status === "maintenance");
        if (data.globalMessage) setGlobalMessage(data.globalMessage);
        setScheduled(!!data.scheduled);
        setStartAt(data.startAt || "");
        setEndAt(data.endAt || "");
        setAlertBeforeMinutes(data.alertBeforeMinutes ?? 15);
        setModules(data.modules || {});
      }
    }, (err) => {
      console.warn("⚠️ [MAINTENANCE_MODAL] Firestore read error:", err);
    });

    return () => unsub();
  }, [isOpen]);

  // Compute live state
  const now = Date.now();
  const startTime = startAt ? new Date(startAt).getTime() : 0;
  const endTime = endAt ? new Date(endAt).getTime() : 0;
  const isCurrentlyInScheduledWindow = scheduled && startTime > 0 && endTime > 0 && now >= startTime && now < endTime;
  const isScheduledInFuture = scheduled && startTime > now;
  const isMaintenanceActive = globalMode || isCurrentlyInScheduledWindow;

  // Real-time Save Maintenance Settings
  const saveMaintenanceSettings = async (overrideData: Partial<any> = {}) => {
    if (!isSuperUser) {
      setErrorMsg("Accès refusé : Seul le Super Fondateur peut modifier la maintenance.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        globalMode: overrideData.globalMode !== undefined ? overrideData.globalMode : globalMode,
        status: (overrideData.globalMode ?? globalMode) ? "maintenance" : "operational",
        globalMessage: overrideData.globalMessage !== undefined ? overrideData.globalMessage : globalMessage,
        scheduled: overrideData.scheduled !== undefined ? overrideData.scheduled : scheduled,
        startAt: overrideData.startAt !== undefined ? overrideData.startAt : startAt,
        endAt: overrideData.endAt !== undefined ? overrideData.endAt : endAt,
        alertBeforeMinutes: overrideData.alertBeforeMinutes !== undefined ? overrideData.alertBeforeMinutes : alertBeforeMinutes,
        modules: overrideData.modules !== undefined ? overrideData.modules : modules,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.email || profile?.email || "Super Fondateur"
      };

      // Atomic update across all 3 configuration collections to guarantee consistency
      try { audioSynth?.playValidationSuccess?.(); } catch (e) {}
      await setDoc(doc(db, "settings", "maintenance"), payload, { merge: true });
      setSuccessMsg("Mise à jour serveur enregistrée en temps réel !");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error("⚠️ Error saving maintenance settings:", err);
      setErrorMsg("Erreur lors de l'enregistrement : " + (err?.message || "Échec Firestore"));
    } finally {
      setLoading(false);
    }
  };

  // Toggle Global Maintenance
  const handleToggleGlobal = async () => {
    const nextMode = !globalMode;
    setGlobalMode(nextMode);
    await saveMaintenanceSettings({ globalMode: nextMode });
  };

  // Cancel Scheduled Maintenance
  const handleCancelScheduled = async () => {
    setScheduled(false);
    setStartAt("");
    setEndAt("");
    setShowScheduleForm(false);
    await saveMaintenanceSettings({
      scheduled: false,
      startAt: "",
      endAt: ""
    });
  };

  // Save Schedule Form
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startAt || !endAt) {
      setErrorMsg("Veuillez sélectionner une date/heure de début et de fin.");
      return;
    }
    if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
      setErrorMsg("La date de fin doit être supérieure à la date de début.");
      return;
    }

    setScheduled(true);
    setShowScheduleForm(false);
    await saveMaintenanceSettings({
      scheduled: true,
      startAt,
      endAt,
      globalMessage,
      alertBeforeMinutes
    });
  };

  // Toggle Individual Module
  const handleToggleModule = async (moduleKey: string) => {
    const updatedModules = {
      ...modules,
      [moduleKey]: !modules[moduleKey]
    };
    setModules(updatedModules);
    await saveMaintenanceSettings({ modules: updatedModules });
  };

  // Send Global Alert
  const handleSendGlobalAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertMessage.trim()) {
      setErrorMsg("Veuillez saisir le texte de l'alerte.");
      return;
    }

    if (!isSuperUser) {
      setErrorMsg("Accès refusé.");
      return;
    }

    setSendingAlert(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const expiresAt = new Date(Date.now() + alertDurationHours * 3600 * 1000).toISOString();
      const notifDoc = {
        titre: alertTitle.trim(),
        message: alertMessage.trim(),
        target: alertTarget,
        priority: alertPriority,
        isActive: true,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt,
        author: currentUser?.email || "Super Fondateur"
      };

      await addDoc(collection(db, "global_notifications"), notifDoc);

      // Also tag in maintenance doc as last broadcast
      await setDoc(doc(db, "settings", "maintenance"), {
        lastAlert: notifDoc
      }, { merge: true });

      try { audioSynth?.playValidationSuccess?.(); } catch (e) {}

      setAlertMessage("");
      setSuccessMsg("📢 Alerte globale diffusée en temps réel !");
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error("⚠️ Error sending global alert:", err);
      setErrorMsg("Échec de la diffusion d'alerte : " + (err?.message || "Erreur Firestore"));
    } finally {
      setSendingAlert(false);
    }
  };

  return (
    <AndroidBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-rose-400 font-black">
          <ShieldAlert className="w-5 h-5 animate-pulse" />
          <span>CENTRE MAINTENANCE & ALERTES</span>
        </div>
      }
      subtitle="Contrôle souverain de la disponibilité serveur et diffusions d'urgence"
      maxHeight="92vh"
    >
      <div className="space-y-6 pb-6 text-afri-text font-sans select-none overflow-x-hidden">
        
        {/* Banner Feedback Messages */}
        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-mono font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-mono font-bold flex items-center gap-2 animate-fadeIn">
            <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ===================================================
            SECTION 1: ÉTAT REALTIME DU SERVEUR
            =================================================== */}
        <div className="bg-afri-bg-sec/90 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#D4AF37] animate-pulse" />
              Statut Serveur En Direct
            </span>
            <span className="text-[9px] font-mono text-zinc-500">
              Cabinet du Super Fondateur
            </span>
          </div>

          <div className="flex items-center justify-between bg-black/40 p-3.5 rounded-xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full ${
                isMaintenanceActive
                  ? "bg-rose-500 shadow-lg shadow-rose-500/50 animate-pulse"
                  : isScheduledInFuture
                  ? "bg-amber-500 shadow-lg shadow-amber-500/50"
                  : "bg-emerald-500 shadow-lg shadow-emerald-500/50"
              }`} />
              <div>
                <h3 className="text-sm font-black uppercase tracking-wide">
                  {isMaintenanceActive
                    ? "🔴 MAINTENANCE ACTIVE"
                    : isScheduledInFuture
                    ? "🟠 MAINTENANCE PROGRAMMÉE"
                    : "🟢 APPLICATION EN LIGNE"}
                </h3>
                <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                  {isMaintenanceActive
                    ? "L'accès public est restreint aux utilisateurs réguliers."
                    : isScheduledInFuture
                    ? `Prochaine maintenance prévue le ${new Date(startAt).toLocaleString()}`
                    : "Tous les services et modules fonctionnent à 100%."}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Toggle Button */}
          <button
            type="button"
            onClick={handleToggleGlobal}
            disabled={loading}
            className={`w-full min-h-[48px] py-3 px-4 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg ${
              globalMode
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20"
            }`}
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : globalMode ? (
              <>
                <span>❌ Désactiver la maintenance</span>
              </>
            ) : (
              <>
                <span>✅ Activer la maintenance</span>
              </>
            )}
          </button>
        </div>

        {/* ===================================================
            SECTION 2: MAINTENANCE PROGRAMMÉE
            =================================================== */}
        <div className="bg-afri-bg-sec/90 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Maintenance Programmée
            </span>
            {scheduled && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Active dans la file
              </span>
            )}
          </div>

          {scheduled && !showScheduleForm ? (
            <div className="bg-black/40 border border-amber-500/20 rounded-xl p-3.5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase">Début :</span>
                  <span className="text-amber-300 font-bold">{startAt ? new Date(startAt).toLocaleString() : "Non définie"}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase">Fin :</span>
                  <span className="text-amber-300 font-bold">{endAt ? new Date(endAt).toLocaleString() : "Non définie"}</span>
                </div>
              </div>

              {globalMessage && (
                <div className="text-[11px] bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 text-zinc-300 italic">
                  "{globalMessage}"
                </div>
              )}

              {alertBeforeMinutes && (
                <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                  <Bell className="w-3 h-3 text-amber-400" />
                  <span>Alerte automatique préventive : <strong>{alertBeforeMinutes} minutes avant</strong></span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowScheduleForm(true)}
                  className="flex-1 min-h-[44px] py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Modifier</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelScheduled}
                  disabled={loading}
                  className="flex-1 min-h-[44px] py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Annuler</span>
                </button>
              </div>
            </div>
          ) : showScheduleForm ? (
            <form onSubmit={handleSaveSchedule} className="bg-black/40 border border-zinc-800 p-3.5 rounded-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-400 font-bold uppercase">Début (Date & Heure)</label>
                  <input
                    type="datetime-local"
                    value={startAt ? startAt.substring(0, 16) : ""}
                    onChange={(e) => setStartAt(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white p-2.5 rounded-xl text-xs font-mono focus:border-[#D4AF37] outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-400 font-bold uppercase">Fin (Date & Heure)</label>
                  <input
                    type="datetime-local"
                    value={endAt ? endAt.substring(0, 16) : ""}
                    onChange={(e) => setEndAt(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white p-2.5 rounded-xl text-xs font-mono focus:border-[#D4AF37] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-400 font-bold uppercase">Message à afficher aux utilisateurs</label>
                <textarea
                  value={globalMessage}
                  onChange={(e) => setGlobalMessage(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white p-2.5 rounded-xl text-xs font-sans focus:border-[#D4AF37] outline-none"
                  placeholder="Message de maintenance..."
                />
              </div>

              {/* Automatic Pre-Alert Selection */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-mono text-amber-400 font-bold uppercase block">Alerte Automatique Préalable :</label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setAlertBeforeMinutes(alertBeforeMinutes === mins ? null : mins)}
                      className={`py-2 px-2 rounded-lg text-[10px] font-mono font-bold border transition text-center cursor-pointer ${
                        alertBeforeMinutes === mins
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      {mins === 60 ? "1 heure avant" : `${mins} min avant`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 min-h-[48px] bg-[#D4AF37] hover:bg-[#b8972e] text-black font-black uppercase text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#D4AF37]/20"
                >
                  <Save className="w-4 h-4" />
                  <span>PROGRAMMER</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowScheduleForm(false)}
                  className="px-4 min-h-[48px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase text-xs rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowScheduleForm(true)}
              className="w-full min-h-[48px] py-3 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl font-bold uppercase text-xs text-amber-300 flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>🕐 PROGRAMMER UNE MAINTENANCE TECHNIQUE</span>
            </button>
          )}
        </div>

        {/* ===================================================
            SECTION 3: MAINTENANCE PAR MODULE
            =================================================== */}
        <div className="bg-afri-bg-sec/90 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#D4AF37] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              Maintenance par Module (Ciblée)
            </span>
            <span className="text-[9px] font-mono text-zinc-400">
              {Object.values(modules).filter(Boolean).length} module(s) en maintenance
            </span>
          </div>

          <p className="text-[11px] text-zinc-400">
            Désactivez un module spécifique sans bloquer l'accès au reste de la plateforme.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {APP_MODULES.map((mod) => {
              const IconComp = mod.icon;
              const isModMaint = !!modules[mod.key];

              return (
                <div
                  key={mod.key}
                  className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                    isModMaint
                      ? "bg-rose-500/10 border-rose-500/40 text-rose-300"
                      : "bg-black/30 border-zinc-800 text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      isModMaint ? "bg-rose-500/20 text-rose-400" : "bg-zinc-800 text-[#D4AF37]"
                    }`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold truncate">{mod.label}</h4>
                      <p className="text-[9px] text-zinc-500 truncate">{mod.description}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleModule(mod.key)}
                    disabled={loading}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase shrink-0 transition cursor-pointer flex items-center gap-1 ${
                      isModMaint
                        ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                    }`}
                  >
                    {isModMaint ? (
                      <>
                        <Wrench className="w-3 h-3" />
                        <span>🔴 Maintenance</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" />
                        <span>🟢 En Ligne</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===================================================
            SECTION 4: DIFFUSION D'ALERTE GLOBALE
            =================================================== */}
        <div className="bg-afri-bg-sec/90 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5" />
              Envoyer une Alerte aux Utilisateurs
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30">
              Diffusion Live
            </span>
          </div>

          <form onSubmit={handleSendGlobalAlert} className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-400 font-bold uppercase">Cible de diffusion</label>
                <select
                  value={alertTarget}
                  onChange={(e) => setAlertTarget(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white p-2.5 rounded-xl text-xs font-mono focus:border-blue-500 outline-none cursor-pointer"
                >
                  <option value="Tous les utilisateurs">Tous les utilisateurs</option>
                  <option value="Tous les musiciens">Tous les musiciens</option>
                  <option value="Tous les créateurs">Tous les créateurs</option>
                  <option value="Tous les administrateurs">Tous les administrateurs</option>
                  <option value="Tous les Premium">Tous les membres Premium</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-400 font-bold uppercase">Niveau de Priorité</label>
                <select
                  value={alertPriority}
                  onChange={(e) => setAlertPriority(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white p-2.5 rounded-xl text-xs font-mono focus:border-blue-500 outline-none cursor-pointer"
                >
                  <option value="Urgente">🔴 Urgente (Bannière Rouge)</option>
                  <option value="Importante">🟠 Importante (Bannière Ambre)</option>
                  <option value="Normale">🔵 Normale (Bannière Bleue)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-400 font-bold uppercase">Titre de l'Alerte</label>
              <input
                type="text"
                value={alertTitle}
                onChange={(e) => setAlertTitle(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 text-white p-2.5 rounded-xl text-xs font-sans focus:border-blue-500 outline-none"
                placeholder="Ex: ⚠️ Interruption temporaire du service"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-400 font-bold uppercase">Message d'Alerte</label>
              <textarea
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-700 text-white p-2.5 rounded-xl text-xs font-sans focus:border-blue-500 outline-none"
                placeholder="Ex: Une maintenance est prévue aujourd'hui de 23h00 à 02h00. Merci de votre compréhension."
                required
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">Durée :</span>
                <select
                  value={alertDurationHours}
                  onChange={(e) => setAlertDurationHours(Number(e.target.value))}
                  className="bg-zinc-900 border border-zinc-700 text-white p-1.5 rounded-lg text-xs font-mono outline-none cursor-pointer"
                >
                  <option value={2}>2 heures</option>
                  <option value={6}>6 heures</option>
                  <option value={12}>12 heures</option>
                  <option value={24}>24 heures</option>
                  <option value={48}>48 heures</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={sendingAlert}
                className="min-h-[48px] px-5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-blue-600/20"
              >
                {sendingAlert ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>ENVOYER L'ALERTE</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </AndroidBottomSheet>
  );
}

export default SuperFounderMaintenanceModal;
