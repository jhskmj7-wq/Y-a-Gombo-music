import React, { useState } from "react";
import { 
  Globe, MapPin, Search, Plus, Edit3, Power, CheckCircle2, XCircle, 
  Sparkles, RefreshCw, Layers, ShieldCheck, X, Clock, Building2, Map, ArrowRight, UserCheck
} from "lucide-react";
import { useAdminLocations } from "../../hooks/useLocations";
import { AfriGomboLocation, LocationProposal, LocationType } from "../../types";

interface AdminLocationsCenterProps {
  audioSynth?: any;
  currentUser?: any;
}

export default function AdminLocationsCenter({ audioSynth, currentUser }: AdminLocationsCenterProps) {
  const { 
    locations, 
    proposals, 
    pendingProposalsCount, 
    loading, 
    addLocation, 
    updateLocation, 
    toggleStatus, 
    approveProposal, 
    rejectProposal 
  } = useAdminLocations();

  const [activeTab, setActiveTab] = useState<"referentiel" | "proposals">("referentiel");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIF" | "INACTIF">("ALL");
  const [proposalStatusFilter, setProposalStatusFilter] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">("PENDING");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<AfriGomboLocation | null>(null);
  const [approvingProposal, setApprovingProposal] = useState<LocationProposal | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    type: "Commune" as LocationType,
    countryName: "Côte d'Ivoire",
    regionName: "",
    districtName: "",
    cityName: "Abidjan",
    communeName: "",
    quartierName: "",
    description: "",
    status: "ACTIF" as "ACTIF" | "INACTIF"
  });

  const locationTypes: LocationType[] = [
    "Pays", "Région", "District", "Ville", "Commune", "Village", "Quartier", "Localité", "Zone"
  ];

  const handleOpenAdd = () => {
    setEditingLocation(null);
    setApprovingProposal(null);
    setFormData({
      name: "",
      type: "Commune",
      countryName: "Côte d'Ivoire",
      regionName: "",
      districtName: "",
      cityName: "Abidjan",
      communeName: "",
      quartierName: "",
      description: "",
      status: "ACTIF"
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (loc: AfriGomboLocation) => {
    setEditingLocation(loc);
    setApprovingProposal(null);
    setFormData({
      name: loc.name,
      type: loc.type,
      countryName: loc.countryName || "Côte d'Ivoire",
      regionName: loc.regionName || "",
      districtName: loc.districtName || "",
      cityName: loc.cityName || "",
      communeName: loc.communeName || "",
      quartierName: loc.parentName || "",
      description: loc.description || "",
      status: loc.status
    });
    setIsModalOpen(true);
  };

  const handleOpenApproveModal = (prop: LocationProposal) => {
    setApprovingProposal(prop);
    setEditingLocation(null);
    setFormData({
      name: prop.name,
      type: prop.type,
      countryName: prop.countryName || "Côte d'Ivoire",
      regionName: prop.regionName || "",
      districtName: "",
      cityName: prop.cityName || "Abidjan",
      communeName: prop.communeName || "",
      quartierName: "",
      description: `Proposé par ${prop.submittedByName} (${prop.details || ""})`,
      status: "ACTIF"
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (approvingProposal) {
        await approveProposal(approvingProposal, currentUser?.uid || "unknown_founder", {
          name: formData.name,
          type: formData.type,
          countryName: formData.countryName,
          regionName: formData.regionName,
          cityName: formData.cityName,
          communeName: formData.communeName,
          parentName: formData.cityName || formData.communeName || formData.regionName,
          description: formData.description,
          status: formData.status
        });
        if (audioSynth?.playValidationSuccess) audioSynth.playValidationSuccess();
      } else if (editingLocation) {
        await updateLocation(editingLocation.id, {
          name: formData.name.trim(),
          type: formData.type,
          countryName: formData.countryName,
          regionName: formData.regionName,
          districtName: formData.districtName,
          cityName: formData.cityName,
          communeName: formData.communeName,
          parentName: formData.cityName || formData.communeName || formData.regionName,
          description: formData.description,
          status: formData.status
        });
        if (audioSynth?.playValidationSuccess) audioSynth.playValidationSuccess();
      } else {
        await addLocation({
          name: formData.name.trim(),
          type: formData.type,
          countryName: formData.countryName,
          regionName: formData.regionName,
          districtName: formData.districtName,
          cityName: formData.cityName,
          communeName: formData.communeName,
          parentName: formData.cityName || formData.communeName || formData.regionName,
          description: formData.description,
          status: formData.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: currentUser?.email || "Super Founder"
        });
        if (audioSynth?.playValidationSuccess) audioSynth.playValidationSuccess();
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error("Erreur enregistrement lieu:", err);
      alert("Une erreur est survenue lors de l'enregistrement du lieu.");
    }
  };

  const handleToggleStatus = async (loc: AfriGomboLocation) => {
    try {
      await toggleStatus(loc.id, loc.status);
      if (audioSynth?.playValidationSuccess) audioSynth.playValidationSuccess();
    } catch (err) {
      console.error("Erreur modification statut:", err);
    }
  };

  const handleDirectApprove = async (prop: LocationProposal) => {
    try {
      await approveProposal(prop, currentUser?.uid || "unknown_founder");
      if (audioSynth?.playValidationSuccess) audioSynth.playValidationSuccess();
    } catch (err: any) {
      alert(err?.message || "Erreur lors de l'approbation");
      console.error("Erreur approbation proposition:", err);
    }
  };

  const handleReject = async (propId: string) => {
    if (!window.confirm("Voulez-vous vraiment refuser cette proposition ?")) return;
    try {
      await rejectProposal(propId, currentUser?.uid || "unknown_founder");
      if (audioSynth?.playValidationSuccess) audioSynth.playValidationSuccess();
    } catch (err: any) {
      alert(err?.message || "Erreur lors du refus");
      console.error("Erreur refus proposition:", err);
    }
  };

  // Filtered Locations
  const filteredLocations = locations.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (l.cityName && l.cityName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (l.regionName && l.regionName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedTypeFilter === "ALL" || l.type === selectedTypeFilter;
    const matchesStatus = statusFilter === "ALL" || l.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Filtered Proposals
  const filteredProposals = proposals.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.submittedByName && p.submittedByName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = proposalStatusFilter === "ALL" || p.status === proposalStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalCount = locations.length;
  const activeCount = locations.filter(l => l.status === "ACTIF").length;
  const inactiveCount = locations.filter(l => l.status === "INACTIF").length;
  const communesCount = locations.filter(l => l.type === "Commune").length;
  const villesCount = locations.filter(l => l.type === "Ville").length;
  const villagesCount = locations.filter(l => l.type === "Village").length;

  return (
    <div className="space-y-5 text-left font-sans text-afri-text p-3 sm:p-5 bg-afri-bg-sec/30 rounded-3xl border border-afri-border w-full max-w-full overflow-hidden">
      
      {/* Imperial Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-afri-bg-sec via-afri-bg-sec to-afri-bg border border-[#D4AF37]/30 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-2xl text-[#D4AF37] shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black font-mono uppercase text-afri-text tracking-wider">
                🌍 Lieux & Territoires
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 font-bold">
                Référentiel Central
              </span>
            </div>
            <p className="text-xs text-afri-text-sec mt-0.5">
              Gestion centrale des territoires, communes, villes et villages AfriGombo.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-3 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-wider rounded-xl hover:bg-[#b8952b] transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#D4AF37]/20 shrink-0 min-h-[48px]"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un lieu</span>
        </button>
      </div>

      {/* Android Stats Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
        <div className="bg-afri-bg p-3 rounded-2xl border border-afri-border space-y-1">
          <span className="text-[9.5px] font-mono text-afri-text-sec uppercase font-bold block">Total Lieux</span>
          <div className="text-base font-black text-[#D4AF37] font-mono">{totalCount}</div>
        </div>
        <div className="bg-afri-bg p-3 rounded-2xl border border-afri-border space-y-1">
          <span className="text-[9.5px] font-mono text-afri-text-sec uppercase font-bold block">Actifs</span>
          <div className="text-base font-black text-emerald-400 font-mono">{activeCount}</div>
        </div>
        <div className="bg-afri-bg p-3 rounded-2xl border border-afri-border space-y-1">
          <span className="text-[9.5px] font-mono text-afri-text-sec uppercase font-bold block">Inactifs</span>
          <div className="text-base font-black text-rose-400 font-mono">{inactiveCount}</div>
        </div>
        <div className="bg-afri-bg p-3 rounded-2xl border border-afri-border space-y-1">
          <span className="text-[9.5px] font-mono text-afri-text-sec uppercase font-bold block">Communes</span>
          <div className="text-base font-black text-sky-400 font-mono">{communesCount}</div>
        </div>
        <div className="bg-afri-bg p-3 rounded-2xl border border-afri-border space-y-1">
          <span className="text-[9.5px] font-mono text-afri-text-sec uppercase font-bold block">Villes</span>
          <div className="text-base font-black text-amber-400 font-mono">{villesCount}</div>
        </div>
        <div className="bg-afri-bg p-3 rounded-2xl border border-afri-border space-y-1">
          <span className="text-[9.5px] font-mono text-afri-text-sec uppercase font-bold block">Propositions</span>
          <div className="text-base font-black text-purple-400 font-mono">{pendingProposalsCount}</div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-afri-border pb-2">
        <button
          onClick={() => setActiveTab("referentiel")}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-2 cursor-pointer border min-h-[44px] ${
            activeTab === "referentiel"
              ? "bg-[#D4AF37] text-black border-[#D4AF37] font-black shadow-md"
              : "bg-afri-bg-sec text-afri-text-sec border-afri-border hover:text-white"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>🏛 Référentiel Officiel ({totalCount})</span>
        </button>

        <button
          onClick={() => setActiveTab("proposals")}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-2 cursor-pointer border relative min-h-[44px] ${
            activeTab === "proposals"
              ? "bg-[#D4AF37] text-black border-[#D4AF37] font-black shadow-md"
              : "bg-afri-bg-sec text-afri-text-sec border-afri-border hover:text-white"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>💡 Proposals Utilisateurs</span>
          {pendingProposalsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">
              {pendingProposalsCount}
            </span>
          )}
        </button>
      </div>

      {/* Search Bar & Filters */}
      <div className="space-y-3 bg-afri-bg p-3 rounded-2xl border border-afri-border">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-afri-text-sec" />
            <input
              type="text"
              placeholder="🔎 Rechercher un lieu, commune, ville..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-afri-bg-sec border border-afri-border text-afri-text pl-9 pr-3 py-2.5 rounded-xl text-xs font-mono focus:border-[#D4AF37] focus:outline-none min-h-[44px]"
            />
          </div>

          {activeTab === "referentiel" && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[10px] font-mono text-afri-text-sec uppercase font-bold shrink-0">Statut :</span>
              {(["ALL", "ACTIF", "INACTIF"] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase cursor-pointer border ${
                    statusFilter === st
                      ? "bg-afri-bg-ter text-[#D4AF37] border-[#D4AF37]"
                      : "bg-afri-bg-sec text-afri-text-sec border-afri-border"
                  }`}
                >
                  {st === "ALL" ? "Tous" : st}
                </button>
              ))}
            </div>
          )}

          {activeTab === "proposals" && (
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-none">
              <span className="text-[10px] font-mono text-afri-text-sec uppercase font-bold shrink-0">Filtrer :</span>
              {([
                { key: "PENDING", label: "En attente" },
                { key: "APPROVED", label: "Approuvés" },
                { key: "REJECTED", label: "Refusés" },
                { key: "ALL", label: "Tous" }
              ] as const).map(filterItem => (
                <button
                  key={filterItem.key}
                  onClick={() => setProposalStatusFilter(filterItem.key)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase cursor-pointer border shrink-0 ${
                    proposalStatusFilter === filterItem.key
                      ? "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]"
                      : "bg-afri-bg-sec text-afri-text-sec border-afri-border"
                  }`}
                >
                  {filterItem.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Type Chips Bar */}
        {activeTab === "referentiel" && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
            <button
              onClick={() => setSelectedTypeFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase shrink-0 border cursor-pointer ${
                selectedTypeFilter === "ALL"
                  ? "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]"
                  : "bg-afri-bg-sec text-afri-text-sec border-afri-border"
              }`}
            >
              Tous les types
            </button>
            {locationTypes.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTypeFilter(t)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase shrink-0 border cursor-pointer ${
                  selectedTypeFilter === t
                    ? "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]"
                    : "bg-afri-bg-sec text-afri-text-sec border-afri-border"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      {activeTab === "referentiel" ? (
        <div className="space-y-3">
          {loading ? (
            <div className="p-12 text-center bg-afri-bg border border-afri-border rounded-2xl text-afri-text-sec text-xs font-mono animate-pulse flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#D4AF37]" />
              <span>Chargement du référentiel territorial...</span>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="p-12 text-center bg-afri-bg border border-afri-border rounded-2xl text-afri-text-sec text-xs font-mono">
              Aucun lieu trouvé pour ces critères de recherche.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredLocations.map((loc) => (
                <div
                  key={loc.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                    loc.status === "ACTIF"
                      ? "bg-afri-bg border-afri-border hover:border-[#D4AF37]/50"
                      : "bg-afri-bg/50 border-rose-500/20 opacity-75"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black uppercase bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                        {loc.type}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black uppercase border ${
                        loc.status === "ACTIF"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      }`}>
                        {loc.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-afri-text font-mono flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        <span>{loc.name}</span>
                      </h3>
                      {(loc.cityName || loc.countryName || loc.regionName) && (
                        <p className="text-[11px] text-afri-text-sec font-mono mt-0.5">
                          📍 {[loc.cityName, loc.regionName, loc.countryName].filter(Boolean).join(", ")}
                        </p>
                      )}
                      {loc.description && (
                        <p className="text-xs text-zinc-400 font-mono mt-1.5 line-clamp-2 italic">
                          "{loc.description}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-afri-border/60">
                    <span className="text-[9px] font-mono text-zinc-500">
                      Modifié: {new Date(loc.updatedAt || loc.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleStatus(loc)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold uppercase border cursor-pointer flex items-center gap-1 ${
                          loc.status === "ACTIF"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                        }`}
                        title={loc.status === "ACTIF" ? "Désactiver ce lieu" : "Activer ce lieu"}
                      >
                        <Power className="w-3 h-3" />
                        <span>{loc.status === "ACTIF" ? "Désactiver" : "Activer"}</span>
                      </button>

                      <button
                        onClick={() => handleOpenEdit(loc)}
                        className="p-1.5 bg-afri-bg-sec hover:bg-afri-bg-ter text-afri-text-sec hover:text-white border border-afri-border rounded-xl cursor-pointer"
                        title="Modifier"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* User Proposals Section */
        <div className="space-y-3">
          {filteredProposals.length === 0 ? (
            <div className="p-12 text-center bg-afri-bg border border-afri-border rounded-2xl text-afri-text-sec text-xs font-mono">
              Aucune proposition d'utilisateur pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProposals.map((prop) => (
                <div 
                  key={prop.id} 
                  className="p-4 bg-afri-bg border border-afri-border rounded-2xl space-y-3 shadow-md"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                          {prop.type}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase border ${
                          prop.status === "PENDING" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                          prop.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                          "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        }`}>
                          {prop.status === "PENDING" ? "En Attente" : prop.status === "APPROVED" ? "Approuvé" : "Refusé"}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-afri-text font-mono mt-1 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#D4AF37]" />
                        <span>{prop.name}</span>
                      </h3>
                      {(prop.cityName || prop.countryName) && (
                        <p className="text-xs text-afri-text-sec font-mono mt-0.5">
                          📍 Parent: {[prop.cityName, prop.countryName].filter(Boolean).join(", ")}
                        </p>
                      )}
                      {prop.details && (
                        <p className="text-xs text-zinc-300 font-mono mt-1 bg-afri-bg-sec p-2 rounded-xl border border-afri-border/50">
                          {prop.details}
                        </p>
                      )}
                    </div>

                    <div className="text-left sm:text-right text-xs font-mono text-zinc-400">
                      <div>Proposé par : <span className="text-afri-text font-bold">{prop.submittedByName}</span></div>
                      <div className="text-[10px] text-zinc-500">{new Date(prop.createdAt).toLocaleDateString()}</div>
                      {prop.status === "APPROVED" && prop.approvedAt && (
                        <div className="text-[10px] text-emerald-400 font-bold mt-1">
                          Approuvé le : {new Date(prop.approvedAt).toLocaleDateString()}
                        </div>
                      )}
                      {prop.status === "REJECTED" && prop.rejectedAt && (
                        <div className="text-[10px] text-rose-400 font-bold mt-1">
                          Refusé le : {new Date(prop.rejectedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {prop.status === "PENDING" && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-afri-border/60">
                      <button
                        onClick={() => handleReject(prop.id)}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Refuser</span>
                      </button>

                      <button
                        onClick={() => handleOpenApproveModal(prop)}
                        className="px-3 py-1.5 bg-afri-bg-sec hover:bg-afri-bg-ter text-afri-text border border-afri-border rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                      >
                        <Edit3 className="w-4 h-4 text-[#D4AF37]" />
                        <span>Ajuster & Valider</span>
                      </button>

                      <button
                        onClick={() => handleDirectApprove(prop)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20 min-h-[40px]"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approuver Directement</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Location BottomSheet Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div 
            className="bg-afri-bg border border-[#D4AF37]/40 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 w-full max-w-lg space-y-4 shadow-2xl relative max-h-[92vh] overflow-y-auto"
            style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
          >
            <div className="flex justify-between items-center border-b border-afri-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-xl text-[#D4AF37]">
                  <Globe className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black font-mono uppercase text-[#D4AF37]">
                  {approvingProposal 
                    ? `Valider la proposition: ${approvingProposal.name}` 
                    : editingLocation 
                    ? `Modifier le lieu: ${editingLocation.name}` 
                    : "Nouveau Lieu Officiel"
                  }
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2.5 text-afri-text-sec hover:text-white rounded-xl bg-afri-bg-sec border border-afri-border cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-afri-text-sec uppercase">
                  Nom du lieu / commune / village <span className="text-rose-400">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Dabou, Cocody, Quartier Soba..." 
                  value={formData.name} 
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] text-afri-text p-3 rounded-xl text-xs font-mono min-h-[48px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-afri-text-sec uppercase">Type de Territoire</label>
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as LocationType }))}
                    className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] text-afri-text p-3 rounded-xl text-xs font-mono min-h-[48px]"
                  >
                    {locationTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-afri-text-sec uppercase">Statut Initial</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as "ACTIF" | "INACTIF" }))}
                    className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] text-afri-text p-3 rounded-xl text-xs font-mono min-h-[48px]"
                  >
                    <option value="ACTIF">ACTIF</option>
                    <option value="INACTIF">INACTIF</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Parent Hierarchy Fields */}
              <div className="space-y-3 pt-2 border-t border-afri-border/50">
                <span className="text-[10px] font-bold text-[#D4AF37] uppercase block">Hiérarchie Parente</span>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-bold text-afri-text-sec uppercase">Pays Parent</label>
                    <input 
                      type="text" 
                      value={formData.countryName} 
                      onChange={e => setFormData(prev => ({ ...prev, countryName: e.target.value }))}
                      className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] text-afri-text p-2.5 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9.5px] font-bold text-afri-text-sec uppercase">Région Parent</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Lagunes, Haut-Sassandra..."
                      value={formData.regionName} 
                      onChange={e => setFormData(prev => ({ ...prev, regionName: e.target.value }))}
                      className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] text-afri-text p-2.5 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                {(formData.type === "Commune" || formData.type === "Village" || formData.type === "Quartier" || formData.type === "Localité") && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-afri-text-sec uppercase">Ville Parente</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Abidjan, Yamoussoukro, Bouaké..." 
                        value={formData.cityName} 
                        onChange={e => setFormData(prev => ({ ...prev, cityName: e.target.value }))}
                        className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] text-afri-text p-2.5 rounded-xl text-xs font-mono"
                      />
                    </div>

                    {(formData.type === "Village" || formData.type === "Quartier" || formData.type === "Localité") && (
                      <div className="space-y-1">
                        <label className="text-[9.5px] font-bold text-afri-text-sec uppercase">Commune Parente</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Cocody, Yopougon..." 
                          value={formData.communeName} 
                          onChange={e => setFormData(prev => ({ ...prev, communeName: e.target.value }))}
                          className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] text-afri-text p-2.5 rounded-xl text-xs font-mono"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-afri-text-sec uppercase">Description / Notes</label>
                <textarea 
                  rows={2}
                  placeholder="Notes explicatives ou détails géographiques..." 
                  value={formData.description} 
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] text-afri-text p-2.5 rounded-xl text-xs font-mono resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-afri-border">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-3 bg-afri-bg-sec text-afri-text-sec rounded-xl hover:bg-afri-bg-ter transition cursor-pointer min-h-[48px] font-bold"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-3 bg-[#D4AF37] text-black font-black uppercase rounded-xl hover:bg-[#b8952b] transition cursor-pointer min-h-[48px] shadow-lg shadow-[#D4AF37]/20"
                >
                  {approvingProposal ? "Approuver & Enregistrer" : editingLocation ? "Enregistrer modifications" : "Créer le Lieu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
