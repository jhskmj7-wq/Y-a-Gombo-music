import React, { useState, useEffect } from "react";
import { 
  Gift, Sparkles, Plus, Check, X, ShieldCheck, 
  TrendingUp, RefreshCw, Layers, UserCheck, 
  AlertCircle, Search, History, Edit3, Trash2, Award, Clock, CheckCircle2
} from "lucide-react";
import { 
  collection, doc, onSnapshot, query, orderBy, limit, setDoc, deleteDoc, getDocs, serverTimestamp 
} from "firebase/firestore";
import { db } from "../../firebase";
import { UserLotRecord, LotStatus } from "../../types";

interface AdminLotsManagementProps {
  currentUser?: any;
  userEmail?: string;
  audioSynth?: any;
}

export interface SystemLotTemplate {
  id: string;
  title: string;
  description: string;
  type: "PREMIUM_DAYS" | "VISIBILITY_BOOST" | "PUBLICATION_BOOST" | "PREMIUM_CODE" | "SPECIAL_PRIVILEGE" | "OTHER_REWARD";
  rewardValue: string | number;
  durationDays: number;
  enabled: boolean;
  createdAt: string;
}

export default function AdminLotsManagement({
  currentUser,
  userEmail = "admin@afrigombo.ci",
  audioSynth
}: AdminLotsManagementProps) {
  const [lotTemplates, setLotTemplates] = useState<SystemLotTemplate[]>([]);
  const [userLots, setUserLots] = useState<UserLotRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // New/Edit Template Modal State
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SystemLotTemplate | null>(null);
  const [tmplTitle, setTmplTitle] = useState("");
  const [tmplDesc, setTmplDesc] = useState("");
  const [tmplType, setTmplType] = useState<SystemLotTemplate["type"]>("PREMIUM_DAYS");
  const [tmplValue, setTmplValue] = useState<string | number>("7");
  const [tmplDuration, setTmplDuration] = useState<number>(7);
  const [tmplEnabled, setTmplEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manual Award Modal State
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [awardUserId, setAwardUserId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [isAwarding, setIsAwarding] = useState(false);
  const [awardNotice, setAwardNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"templates" | "user_lots">("templates");

  // Real-time Subscriptions
  useEffect(() => {
    setLoading(true);

    // 1. Lot Templates Stream
    const tmplRef = collection(db, "reward_lot_templates");
    const unsubTmpl = onSnapshot(
      tmplRef,
      (snapshot) => {
        const list: SystemLotTemplate[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as SystemLotTemplate);
        });
        if (list.length === 0) {
          // Initialize defaults
          initDefaultTemplates();
        } else {
          setLotTemplates(list);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching lot templates:", err);
        setLoading(false);
      }
    );

    // 2. User Lots Won Stream
    const userLotsRef = collection(db, "userLots");
    const qLots = query(userLotsRef, orderBy("createdAt", "desc"), limit(100));
    const unsubUserLots = onSnapshot(
      qLots,
      (snapshot) => {
        const list: UserLotRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as UserLotRecord);
        });
        setUserLots(list);
      },
      (err) => {
        console.error("Error fetching user lots:", err);
      }
    );

    return () => {
      unsubTmpl();
      unsubUserLots();
    };
  }, []);

  const initDefaultTemplates = async () => {
    const defaults: SystemLotTemplate[] = [
      {
        id: "lot_tmpl_premium_7",
        title: "⭐ Premium 7 Jours",
        description: "Accès illimité aux fonctionnalités VIP et statut Élite pendant 7 jours",
        type: "PREMIUM_DAYS",
        rewardValue: 7,
        durationDays: 7,
        enabled: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "lot_tmpl_boost_24h",
        title: "⚡ Boost Visibilité 24h",
        description: "Mise en avant prioritaire de votre profil et de vos publications pendant 24h",
        type: "VISIBILITY_BOOST",
        rewardValue: "Visibilité 24h",
        durationDays: 1,
        enabled: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "lot_tmpl_post_72h",
        title: "📈 Boost Publication 72h",
        description: "Mise en vedette en tête du fil d'actualité pendant 3 jours",
        type: "PUBLICATION_BOOST",
        rewardValue: "Vedette 72h",
        durationDays: 3,
        enabled: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "lot_tmpl_privilege_box",
        title: "🎁 Privilège Boîte Surprise",
        description: "Privilège spécial donnant accès à un tirage ou bonus surprise exclusif",
        type: "SPECIAL_PRIVILEGE",
        rewardValue: "Mystery Box",
        durationDays: 30,
        enabled: true,
        createdAt: new Date().toISOString()
      }
    ];

    for (const t of defaults) {
      await setDoc(doc(db, "reward_lot_templates", t.id), t);
    }
  };

  const handleOpenTemplateModal = (tmpl?: SystemLotTemplate) => {
    if (tmpl) {
      setEditingTemplate(tmpl);
      setTmplTitle(tmpl.title);
      setTmplDesc(tmpl.description);
      setTmplType(tmpl.type);
      setTmplValue(tmpl.rewardValue);
      setTmplDuration(tmpl.durationDays);
      setTmplEnabled(tmpl.enabled);
    } else {
      setEditingTemplate(null);
      setTmplTitle("⭐ Premium 30 jours");
      setTmplDesc("Abonnement Premium offert pendant 30 jours");
      setTmplType("PREMIUM_DAYS");
      setTmplValue(30);
      setTmplDuration(30);
      setTmplEnabled(true);
    }
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmplTitle) return;

    setIsSubmitting(true);
    try {
      const tmplId = editingTemplate ? editingTemplate.id : `lot_tmpl_${Date.now()}`;
      const record: SystemLotTemplate = {
        id: tmplId,
        title: tmplTitle,
        description: tmplDesc,
        type: tmplType,
        rewardValue: tmplValue,
        durationDays: Number(tmplDuration),
        enabled: tmplEnabled,
        createdAt: editingTemplate?.createdAt || new Date().toISOString()
      };

      await setDoc(doc(db, "reward_lot_templates", tmplId), record);
      try { audioSynth?.playValidationSuccess?.(); } catch (err) {}
      setShowTemplateModal(false);
    } catch (err: any) {
      alert("Erreur lors de la sauvegarde du template: " + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTemplateEnabled = async (tmpl: SystemLotTemplate) => {
    try {
      await setDoc(doc(db, "reward_lot_templates", tmpl.id), {
        ...tmpl,
        enabled: !tmpl.enabled
      }, { merge: true });
      try { audioSynth?.playValidationSuccess?.(); } catch (err) {}
    } catch (err: any) {
      alert("Erreur lors de la modification: " + err.message);
    }
  };

  // Manual Award Lot Execution
  const handleExecuteAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!awardUserId.trim() || !selectedTemplateId) {
      setAwardNotice({ type: "error", text: "Veuillez préciser un UID et choisir un modèle de lot." });
      return;
    }

    setIsAwarding(true);
    setAwardNotice(null);

    try {
      const tmpl = lotTemplates.find(t => t.id === selectedTemplateId);
      if (!tmpl) throw new Error("Modèle de lot introuvable.");

      const lotId = `lot_award_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newLot: UserLotRecord = {
        id: lotId,
        userId: awardUserId.trim(),
        rewardType: tmpl.type as any,
        rewardValue: tmpl.rewardValue,
        rewardLabel: tmpl.title,
        status: "AVAILABLE",
        createdAt: new Date().toISOString(),
        wheelId: "ADMIN_GRANT",
        wheelName: "Attribution Fondateur"
      };

      await setDoc(doc(db, "userLots", lotId), newLot);

      setAwardNotice({ 
        type: "success", 
        text: `✨ Lot "${tmpl.title}" attribué avec succès à l'utilisateur ${awardUserId.substring(0, 10)}...` 
      });
      setAwardUserId("");
      try { audioSynth?.playValidationSuccess?.(); } catch (err) {}
    } catch (err: any) {
      setAwardNotice({ type: "error", text: err.message || "Erreur lors de l'attribution." });
    } finally {
      setIsAwarding(false);
    }
  };

  // Metrics
  const wonCount = userLots.length;
  const activatedCount = userLots.filter(l => l.status === "ACTIVATED").length;
  const availableCount = userLots.filter(l => l.status === "AVAILABLE").length;
  const expiredCount = userLots.filter(l => l.status === "EXPIRED" || l.status === "USED").length;

  const filteredUserLots = userLots.filter(l => 
    !searchQuery ||
    l.userId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.rewardLabel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-6 text-left animate-fadeIn">
      {/* HEADER */}
      <div className="p-5 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 border border-amber-500/30 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 border border-amber-400/40 rounded-2xl text-amber-400">
            <Gift className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase text-white font-mono tracking-tight flex items-center gap-2">
              🎁 GESTION DES LOTS & RÉCOMPENSES — TRÔNE
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Configuration des modèles de lots, attribution directe aux citoyens et métriques d'activation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAwardModal(true)}
            className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/30 font-mono font-bold text-xs uppercase rounded-2xl transition shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Award className="w-4 h-4" />
            <span>Attribuer un Lot</span>
          </button>

          <button
            onClick={() => handleOpenTemplateModal()}
            className="px-4 py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-mono font-black text-xs uppercase rounded-2xl transition shadow-lg shadow-[#D4AF37]/20 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un Modèle de Lot</span>
          </button>
        </div>
      </div>

      {/* METRICS STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
            Lots Remportés
          </span>
          <p className="text-2xl font-black font-mono text-white">
            {wonCount}
          </p>
          <p className="text-[9px] text-zinc-500 font-mono">Tirages de roue gagnants</p>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
            Lots Disponibles
          </span>
          <p className="text-2xl font-black font-mono text-amber-400">
            {availableCount}
          </p>
          <p className="text-[9px] text-zinc-500 font-mono">En attente d'activation</p>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
            Lots Activés
          </span>
          <p className="text-2xl font-black font-mono text-emerald-400">
            {activatedCount}
          </p>
          <p className="text-[9px] text-zinc-500 font-mono">Avantages en cours de jouissance</p>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
            Lots Expirés / Utilisés
          </span>
          <p className="text-2xl font-black font-mono text-zinc-500">
            {expiredCount}
          </p>
          <p className="text-[9px] text-zinc-500 font-mono">Avantages échus ou consommés</p>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
            activeTab === "templates" 
              ? "bg-[#D4AF37] text-black font-black shadow-md" 
              : "bg-zinc-900 text-zinc-400 hover:text-white"
          }`}
        >
           Modèles de Lots ({lotTemplates.length})
        </button>

        <button
          onClick={() => setActiveTab("user_lots")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
            activeTab === "user_lots" 
              ? "bg-[#D4AF37] text-black font-black shadow-md" 
              : "bg-zinc-900 text-zinc-400 hover:text-white"
          }`}
        >
          📜 Lots Attribués / Gagnés ({userLots.length})
        </button>
      </div>

      {/* CONTENT TEMPLATES */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {lotTemplates.map((tmpl) => (
            <div 
              key={tmpl.id} 
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-3 ${
                tmpl.enabled 
                  ? "bg-zinc-900/70 border-amber-500/30 hover:border-amber-400" 
                  : "bg-zinc-950/40 border-zinc-800 opacity-60"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-amber-500 uppercase tracking-widest">
                    {tmpl.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase ${
                    tmpl.enabled 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                      : "bg-zinc-800 text-zinc-500"
                  }`}>
                    {tmpl.enabled ? "ACTIF" : "INACTIF"}
                  </span>
                </div>

                <h4 className="text-base font-black text-white font-mono">{tmpl.title}</h4>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">{tmpl.description}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800 text-xs font-mono">
                <span className="text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  Type: {tmpl.type} ({tmpl.durationDays}j)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleTemplateEnabled(tmpl)}
                    className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase transition cursor-pointer ${
                      tmpl.enabled ? "bg-zinc-800 text-zinc-300" : "bg-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    {tmpl.enabled ? "Désactiver" : "Activer"}
                  </button>

                  <button
                    onClick={() => handleOpenTemplateModal(tmpl)}
                    className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONTENT USER LOTS */}
      {activeTab === "user_lots" && (
        <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <h3 className="text-xs font-mono font-black uppercase text-white tracking-wider flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-400" />
              Journal des Lots Distribués en Temps Réel
            </h3>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par UID / Titre..."
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Utilisateur UID</th>
                  <th className="py-2 px-3">Lot Récompense</th>
                  <th className="py-2 px-3">Source / Roue</th>
                  <th className="py-2 px-3">Statut</th>
                  <th className="py-2 px-3">Activation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-xs font-mono">
                {filteredUserLots.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500">
                      Aucun lot récompensé trouvé
                    </td>
                  </tr>
                ) : (
                  filteredUserLots.map((lot) => (
                    <tr key={lot.id} className="hover:bg-zinc-800/30 transition">
                      <td className="py-2.5 px-3 text-zinc-400 text-[10px]">
                        {new Date(lot.createdAt).toLocaleDateString("fr-FR")} {new Date(lot.createdAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">
                        {lot.userId ? `${lot.userId.substring(0, 10)}...` : "—"}
                      </td>
                      <td className="py-2.5 px-3 font-black text-amber-400">
                        {lot.rewardLabel}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-300">
                        {lot.wheelName || lot.wheelId || "System"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          lot.status === "AVAILABLE" 
                            ? "bg-amber-400/20 text-amber-300 border border-amber-400/30" 
                            : lot.status === "ACTIVATED"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-zinc-800 text-zinc-400"
                        }`}>
                          {lot.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400 text-[10px]">
                        {lot.activatedAt ? new Date(lot.activatedAt).toLocaleDateString("fr-FR") : "Non activé"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL TEMPLATE */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-amber-500/40 rounded-3xl p-6 space-y-4 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-mono font-black uppercase text-amber-400 flex items-center gap-2">
                <Gift className="w-4 h-4" />
                <span>{editingTemplate ? "Éditer le Modèle de Lot" : "Nouveau Modèle de Lot"}</span>
              </h3>
              <button onClick={() => setShowTemplateModal(false)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                  Titre du Lot
                </label>
                <input
                  type="text"
                  value={tmplTitle}
                  onChange={(e) => setTmplTitle(e.target.value)}
                  placeholder="Ex: ⭐ Premium 7 jours"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                  Description
                </label>
                <textarea
                  value={tmplDesc}
                  onChange={(e) => setTmplDesc(e.target.value)}
                  placeholder="Description détaillée du privilège..."
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    Type de Récompense
                  </label>
                  <select
                    value={tmplType}
                    onChange={(e) => setTmplType(e.target.value as any)}
                    className="w-full px-2 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="PREMIUM_DAYS">Premium Temporaire</option>
                    <option value="VISIBILITY_BOOST">Boost Visibilité</option>
                    <option value="PUBLICATION_BOOST">Boost Publication</option>
                    <option value="PREMIUM_CODE">Code Premium</option>
                    <option value="SPECIAL_PRIVILEGE">Privilège Spécial</option>
                    <option value="OTHER_REWARD">Autre Récompense</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    Durée (Jours)
                  </label>
                  <input
                    type="number"
                    value={tmplDuration}
                    onChange={(e) => setTmplDuration(Number(e.target.value))}
                    placeholder="7"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-amber-400 font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="tmplEnabledCheck"
                  checked={tmplEnabled}
                  onChange={(e) => setTmplEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 text-amber-500 focus:ring-0"
                />
                <label htmlFor="tmplEnabledCheck" className="text-xs font-mono text-zinc-300 font-bold cursor-pointer">
                  Activer ce modèle de lot dans le système
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 bg-zinc-900 text-zinc-400 text-xs font-mono rounded-xl hover:bg-zinc-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#D4AF37] hover:bg-amber-400 text-black font-mono font-black text-xs uppercase rounded-xl transition shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Sauvegarde..." : "Sauvegarder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AWARD MANUALLY */}
      {showAwardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-amber-500/40 rounded-3xl p-6 space-y-4 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-mono font-black uppercase text-amber-400 flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>Attribuer un Lot à un Citoyen</span>
              </h3>
              <button onClick={() => setShowAwardModal(false)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteAward} className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                  UID Utilisateur Cible
                </label>
                <input
                  type="text"
                  value={awardUserId}
                  onChange={(e) => setAwardUserId(e.target.value)}
                  placeholder="Ex: usr_92837498"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                  Choisir le Modèle de Lot
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-2 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  required
                >
                  <option value="">-- Sélectionner un lot --</option>
                  {lotTemplates.filter(t => t.enabled).map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.title} ({tmpl.durationDays}j)
                    </option>
                  ))}
                </select>
              </div>

              {awardNotice && (
                <div className={`p-3 rounded-xl text-xs font-mono font-bold ${
                  awardNotice.type === "success" 
                    ? "bg-emerald-950/80 border border-emerald-500/50 text-emerald-300" 
                    : "bg-rose-950/80 border border-rose-500/50 text-rose-300"
                }`}>
                  {awardNotice.text}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAwardModal(false)}
                  className="px-4 py-2 bg-zinc-900 text-zinc-400 text-xs font-mono rounded-xl hover:bg-zinc-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isAwarding}
                  className="px-5 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-mono text-xs font-black uppercase rounded-xl transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isAwarding ? "Attribution..." : "Confirmer l'Attribution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
