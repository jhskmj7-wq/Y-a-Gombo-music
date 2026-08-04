import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Pin, Search, Trash2, Edit3, Save, RefreshCw, HandCoins, Plus, CheckCircle2, Clock, XCircle, Users, DollarSign, X } from "lucide-react";
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, addDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { CrowdfundingCampaign } from "../../types";

interface AdminCagnottesProps {
  audioSynth?: any;
}

interface Contribution {
  id?: string;
  contributorName: string;
  amount: number;
  message?: string;
  createdAt: string;
}

export default function AdminCagnottes({ audioSynth }: AdminCagnottesProps) {
  const [cagnottes, setCagnottes] = useState<CrowdfundingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCagnotte, setEditingCagnotte] = useState<CrowdfundingCampaign | null>(null);
  const [selectedForContrib, setSelectedForContrib] = useState<CrowdfundingCampaign | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loadingContribs, setLoadingContribs] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    title: "",
    goal: 500000,
    collected: 0,
    status: "Active" as "Active" | "Financée" | "Clôturée",
    description: "",
    category: "Solidarité"
  });

  const [contribForm, setContribForm] = useState({
    contributorName: "",
    amount: 5000,
    message: ""
  });

  useEffect(() => {
    const q = query(collection(db, "cagnottes"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data: CrowdfundingCampaign[] = [];
      snap.forEach(d => {
        const item = { id: d.id, ...d.data() } as CrowdfundingCampaign;
        data.push(item);
      });
      setCagnottes(data);
      setLoading(false);
    }, (err) => {
      console.error("Erreur chargement cagnottes:", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Listen to contributions for selected cagnotte
  useEffect(() => {
    if (!selectedForContrib) return;
    setLoadingContribs(true);
    const q = query(collection(db, "cagnottes", selectedForContrib.id, "contributions"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list: Contribution[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as Contribution);
      });
      setContributions(list);
      setLoadingContribs(false);
    }, (err) => {
      console.error("Error loading contributions:", err);
      setLoadingContribs(false);
    });
    return () => unsub();
  }, [selectedForContrib]);

  const handleOpenCreate = () => {
    setFormData({
      title: "",
      goal: 500000,
      collected: 0,
      status: "Active",
      description: "",
      category: "Solidarité"
    });
    setEditingCagnotte(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (c: CrowdfundingCampaign) => {
    setEditingCagnotte(c);
    setFormData({
      title: c.title || "",
      goal: c.goal || 0,
      collected: c.collected || 0,
      status: c.status || "Active",
      description: (c as any).description || "",
      category: (c as any).category || "Solidarité"
    });
    setIsCreateOpen(true);
  };

  const handleSaveCagnotte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || formData.goal <= 0) return;

    try {
      if (editingCagnotte) {
        await updateDoc(doc(db, "cagnottes", editingCagnotte.id), {
          title: formData.title,
          goal: Number(formData.goal),
          collected: Number(formData.collected),
          status: formData.status,
          description: formData.description,
          category: formData.category,
          updatedAt: new Date().toISOString()
        });
      } else {
        const newDocRef = doc(collection(db, "cagnottes"));
        await setDoc(newDocRef, {
          title: formData.title,
          goal: Number(formData.goal),
          collected: Number(formData.collected),
          status: formData.status,
          description: formData.description,
          category: formData.category,
          createdAt: new Date().toISOString()
        });
      }
      if (audioSynth?.playValidationSuccess) {
        audioSynth.playValidationSuccess();
      }
      setIsCreateOpen(false);
    } catch (err) {
      console.error("Erreur sauvegarde cagnotte:", err);
      alert("Erreur lors de la sauvegarde.");
    }
  };

  const handleDeleteCagnotte = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette cagnotte ?")) return;
    try {
      await deleteDoc(doc(db, "cagnottes", id));
      if (audioSynth?.playValidationSuccess) audioSynth.playValidationSuccess();
    } catch (err) {
      console.error("Erreur suppression cagnotte:", err);
    }
  };

  const handleQuickStatusChange = async (c: CrowdfundingCampaign, newStatus: "Active" | "Financée" | "Clôturée") => {
    try {
      await updateDoc(doc(db, "cagnottes", c.id), { status: newStatus });
    } catch (err) {
      console.error("Erreur changement statut:", err);
    }
  };

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForContrib || !contribForm.contributorName.trim() || contribForm.amount <= 0) return;

    try {
      const contribRef = collection(db, "cagnottes", selectedForContrib.id, "contributions");
      await addDoc(contribRef, {
        contributorName: contribForm.contributorName,
        amount: Number(contribForm.amount),
        message: contribForm.message || "",
        createdAt: new Date().toISOString()
      });

      // Update collected sum on main campaign
      const newCollected = (selectedForContrib.collected || 0) + Number(contribForm.amount);
      const autoStatus = newCollected >= selectedForContrib.goal ? "Financée" : selectedForContrib.status;

      await updateDoc(doc(db, "cagnottes", selectedForContrib.id), {
        collected: newCollected,
        status: autoStatus
      });

      // Update local state copy
      setSelectedForContrib(prev => prev ? { ...prev, collected: newCollected, status: autoStatus } : null);

      setContribForm({ contributorName: "", amount: 5000, message: "" });
      if (audioSynth?.playValidationSuccess) audioSynth.playValidationSuccess();
    } catch (err) {
      console.error("Erreur ajout contribution:", err);
    }
  };

  const filteredCagnottes = cagnottes.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ((c as any).category && (c as any).category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-left font-sans text-afri-text p-4 sm:p-6 bg-afri-bg-sec/30 rounded-3xl border border-afri-border">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-3xl bg-gradient-to-r from-afri-bg-sec via-afri-bg-sec to-afri-bg border border-[#D4AF37]/30 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-2xl text-[#D4AF37]">
            <HandCoins className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black uppercase text-afri-text tracking-wider">
                ADMINISTRATION — CAGNOTTES
              </h2>
            </div>
            <p className="text-xs text-afri-text-sec">
              Gestion du Crowdfunding, des appels de fonds solidaires et des contributions.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-wider rounded-xl hover:bg-[#b8952b] transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#D4AF37]/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Créer une Cagnotte</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-afri-bg p-3 rounded-2xl border border-afri-border">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-afri-text-sec" />
          <input 
            type="text" 
            placeholder="Rechercher une cagnotte..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-afri-bg-sec border border-afri-border text-afri-text pl-9 pr-3 py-2 rounded-xl text-xs font-mono focus:border-[#D4AF37] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-none">
          {["ALL", "Active", "Financée", "Clôturée"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase cursor-pointer border transition-all ${
                statusFilter === st
                  ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                  : "bg-afri-bg-sec text-afri-text-sec border-afri-border hover:border-afri-border"
              }`}
            >
              {st === "ALL" ? "Toutes" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Cagnottes Cards Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center bg-afri-bg border border-afri-border rounded-2xl text-afri-text-sec text-xs font-mono animate-pulse flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#D4AF37]" />
            <span>Chargement des cagnottes en cours...</span>
          </div>
        ) : filteredCagnottes.length === 0 ? (
          <div className="p-12 text-center bg-afri-bg border border-afri-border rounded-2xl text-afri-text-sec text-xs font-mono">
            Aucune cagnotte ne correspond aux critères actuels.
          </div>
        ) : (
          filteredCagnottes.map(c => {
            const percent = Math.min(100, Math.round(((c.collected || 0) / (c.goal || 1)) * 100));
            return (
              <div 
                key={c.id} 
                className="p-5 bg-afri-bg border border-afri-border hover:border-[#D4AF37]/50 transition-all rounded-3xl space-y-4 shadow-md"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black uppercase bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                        {(c as any).category || "Solidarité"}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black uppercase border ${
                        c.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                        c.status === "Financée" ? "bg-sky-500/10 text-sky-400 border-sky-500/30" :
                        "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-afri-text mt-1">{c.title}</h3>
                    {(c as any).description && (
                      <p className="text-xs text-afri-text-sec mt-1 line-clamp-2">{ (c as any).description }</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => setSelectedForContrib(c)}
                      className="px-3 py-1.5 bg-afri-bg-sec hover:bg-afri-bg-ter text-afri-text border border-afri-border rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                      title="Voir les contributions"
                    >
                      <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Contributions</span>
                    </button>
                    <button 
                      onClick={() => handleOpenEdit(c)}
                      className="p-2 bg-afri-bg-sec hover:bg-afri-bg-ter text-afri-text-sec hover:text-white border border-afri-border rounded-xl cursor-pointer"
                      title="Modifier"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteCagnotte(c.id)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Financial Metrics */}
                <div className="space-y-1.5 pt-2 border-t border-afri-border/60">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-afri-text-sec font-bold">
                      Collecté : <span className="text-[#D4AF37] font-black">{(c.collected || 0).toLocaleString()} FCFA</span>
                    </span>
                    <span className="text-afri-text-sec font-bold">
                      Objectif : <span className="text-afri-text font-black">{(c.goal || 0).toLocaleString()} FCFA</span> ({percent}%)
                    </span>
                  </div>

                  <div className="w-full bg-afri-bg-sec h-2.5 rounded-full overflow-hidden border border-afri-border">
                    <div 
                      className="bg-gradient-to-r from-[#D4AF37] to-amber-500 h-full transition-all duration-500 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Quick Status Toggle buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-mono text-afri-text-sec uppercase font-bold">Changer statut :</span>
                  {(["Active", "Financée", "Clôturée"] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => handleQuickStatusChange(c, st)}
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold uppercase cursor-pointer border ${
                        c.status === st 
                          ? "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]" 
                          : "bg-afri-bg-sec text-afri-text-sec border-afri-border hover:border-afri-border"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Cagnotte Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-afri-bg border border-[#D4AF37]/40 rounded-3xl p-6 w-full max-w-lg space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-afri-border pb-3">
              <h3 className="text-sm font-black font-mono uppercase text-[#D4AF37] flex items-center gap-2">
                <HandCoins className="w-4 h-4" />
                <span>{editingCagnotte ? "Modifier la Cagnotte" : "Nouvelle Cagnotte Solidaire"}</span>
              </h3>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-afri-text-sec hover:text-white rounded-lg bg-afri-bg-sec border border-afri-border cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCagnotte} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-afri-text-sec uppercase">Titre de la Cagnotte</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Soutien au Festival de Musique Indépendante"
                  value={formData.title} 
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] text-afri-text p-2.5 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-afri-text-sec uppercase">Objectif (FCFA)</label>
                  <input 
                    type="number" 
                    required
                    min="1000"
                    value={formData.goal} 
                    onChange={e => setFormData(prev => ({ ...prev, goal: Number(e.target.value) }))}
                    className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] text-afri-text p-2.5 rounded-xl text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-afri-text-sec uppercase">Déjà Collecté (FCFA)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.collected} 
                    onChange={e => setFormData(prev => ({ ...prev, collected: Number(e.target.value) }))}
                    className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] text-afri-text p-2.5 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-afri-text-sec uppercase">Catégorie</label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] text-afri-text p-2.5 rounded-xl text-xs font-mono"
                  >
                    <option value="Solidarité">Solidarité</option>
                    <option value="Musique">Musique</option>
                    <option value="Événement">Événement</option>
                    <option value="Production">Production</option>
                    <option value="Indépendance">Indépendance</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-afri-text-sec uppercase">Statut Inititial</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] text-afri-text p-2.5 rounded-xl text-xs font-mono"
                  >
                    <option value="Active">Active</option>
                    <option value="Financée">Financée</option>
                    <option value="Clôturée">Clôturée</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-afri-text-sec uppercase">Description Détaillée</label>
                <textarea 
                  rows={3}
                  placeholder="Décrivez l'objectif de cet appel de fonds..."
                  value={formData.description} 
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] text-afri-text p-2.5 rounded-xl text-xs font-mono resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-afri-border">
                <button 
                  type="button" 
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-afri-bg-sec text-afri-text-sec rounded-xl hover:bg-afri-bg-ter transition cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#D4AF37] text-black font-black uppercase rounded-xl hover:bg-[#b8952b] transition cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contributions Drawer Modal */}
      {selectedForContrib && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-afri-bg border border-[#D4AF37]/40 rounded-3xl p-6 w-full max-w-xl space-y-5 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-afri-border pb-3 shrink-0">
              <div>
                <h3 className="text-sm font-black font-mono uppercase text-[#D4AF37]">
                  Contributions : {selectedForContrib.title}
                </h3>
                <p className="text-[10px] text-afri-text-sec font-mono">
                  {(selectedForContrib.collected || 0).toLocaleString()} FCFA sur {(selectedForContrib.goal || 0).toLocaleString()} FCFA
                </p>
              </div>
              <button 
                onClick={() => setSelectedForContrib(null)}
                className="p-1.5 text-afri-text-sec hover:text-white rounded-lg bg-afri-bg-sec border border-afri-border cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Add Contribution Form */}
            <form onSubmit={handleAddContribution} className="bg-afri-bg-sec p-3.5 rounded-2xl border border-afri-border space-y-3 text-xs font-mono shrink-0">
              <span className="text-[10px] font-bold uppercase text-[#D4AF37] block">Enregistrer une contribution</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input 
                  type="text" 
                  required
                  placeholder="Nom du contributeur" 
                  value={contribForm.contributorName}
                  onChange={e => setContribForm(prev => ({ ...prev, contributorName: e.target.value }))}
                  className="bg-afri-bg border border-afri-border text-afri-text p-2 rounded-xl text-xs"
                />
                <input 
                  type="number" 
                  required
                  min="500"
                  placeholder="Montant (FCFA)" 
                  value={contribForm.amount}
                  onChange={e => setContribForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  className="bg-afri-bg border border-afri-border text-afri-text p-2 rounded-xl text-xs"
                />
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Note / Message d'encouragement (Optionnel)" 
                  value={contribForm.message}
                  onChange={e => setContribForm(prev => ({ ...prev, message: e.target.value }))}
                  className="flex-1 bg-afri-bg border border-afri-border text-afri-text p-2 rounded-xl text-xs"
                />
                <button 
                  type="submit" 
                  className="px-3 py-2 bg-[#D4AF37] text-black font-black uppercase text-[10px] rounded-xl hover:bg-[#b8952b] transition cursor-pointer shrink-0"
                >
                  Ajouter
                </button>
              </div>
            </form>

            {/* Contributions List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              <span className="text-[10px] font-mono text-afri-text-sec uppercase font-bold block">
                Historique des contributions ({contributions.length})
              </span>

              {loadingContribs ? (
                <div className="p-6 text-center text-xs font-mono text-afri-text-sec">Chargement...</div>
              ) : contributions.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-afri-text-sec bg-afri-bg-sec/50 rounded-2xl border border-afri-border">
                  Aucune contribution enregistrée pour le moment.
                </div>
              ) : (
                contributions.map(ct => (
                  <div key={ct.id} className="p-3 bg-afri-bg-sec border border-afri-border rounded-xl flex justify-between items-center text-xs font-mono">
                    <div>
                      <div className="font-bold text-afri-text">{ct.contributorName}</div>
                      {ct.message && <div className="text-[10px] text-afri-text-sec italic mt-0.5">{ct.message}</div>}
                      <div className="text-[8px] text-zinc-500 mt-1">
                        {new Date(ct.createdAt).toLocaleDateString()} {new Date(ct.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-[#D4AF37] font-black text-sm">
                      +{ct.amount.toLocaleString()} FCFA
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
