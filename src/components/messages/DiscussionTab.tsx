import React, { useState, useEffect } from "react";
import { 
  MessageSquare, ShieldCheck, Search, Plus, Sparkles, Pin, PinOff,
  Archive, VolumeX, Volume2, Trash2, Flag, Ban, Check, CheckCheck, 
  MoreVertical, X, ShieldAlert, AlertCircle, CheckCircle2
} from "lucide-react";

interface DiscussionTabProps {
  conversations: any[];
  loadingConvos: boolean;
  supportConvo: any;
  currentUser: any;
  onSelectConversation: (convo: any) => void;
  onOpenSupport: () => void;
  onStartNewChat: () => void;
}

export default function DiscussionTab({
  conversations,
  loadingConvos,
  supportConvo,
  currentUser,
  onSelectConversation,
  onOpenSupport,
  onStartNewChat
}: DiscussionTabProps) {
  const [filterQuery, setFilterQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "artistes" | "prestataires" | "recruteurs" | "support" | "archived" | "unread">("all");
  
  // Local persistence states for actions
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [mutedIds, setMutedIds] = useState<string[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [activeMenuConvoId, setActiveMenuConvoId] = useState<string | null>(null);

  // Modals for Report
  const [showReportModal, setShowReportModal] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (!currentUser?.uid) return;
    const uid = currentUser.uid;
    
    try {
      setPinnedIds(JSON.parse(localStorage.getItem(`pinned_convos_${uid}`) || "[]"));
      setArchivedIds(JSON.parse(localStorage.getItem(`archived_convos_${uid}`) || "[]"));
      setMutedIds(JSON.parse(localStorage.getItem(`muted_convos_${uid}`) || "[]"));
      setBlockedIds(JSON.parse(localStorage.getItem(`blocked_convos_${uid}`) || "[]"));
      setDeletedIds(JSON.parse(localStorage.getItem(`deleted_convos_${uid}`) || "[]"));
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  // Save helpers
  const saveState = (key: string, list: string[]) => {
    if (!currentUser?.uid) return;
    localStorage.setItem(`${key}_${currentUser.uid}`, JSON.stringify(list));
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = pinnedIds.includes(id) 
      ? pinnedIds.filter(x => x !== id) 
      : [...pinnedIds, id];
    setPinnedIds(updated);
    saveState("pinned_convos", updated);
    setActiveMenuConvoId(null);
  };

  const handleToggleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = archivedIds.includes(id)
      ? archivedIds.filter(x => x !== id)
      : [...archivedIds, id];
    setArchivedIds(updated);
    saveState("archived_convos", updated);
    setActiveMenuConvoId(null);
  };

  const handleToggleMute = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = mutedIds.includes(id)
      ? mutedIds.filter(x => x !== id)
      : [...mutedIds, id];
    setMutedIds(updated);
    saveState("muted_convos", updated);
    setActiveMenuConvoId(null);
  };

  const handleToggleBlock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = blockedIds.includes(id)
      ? blockedIds.filter(x => x !== id)
      : [...blockedIds, id];
    setBlockedIds(updated);
    saveState("blocked_convos", updated);
    setActiveMenuConvoId(null);
  };

  const handleDeleteConvo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Voulez-vous vraiment supprimer cette conversation d'AFRIGOMBO ?")) {
      const updated = [...deletedIds, id];
      setDeletedIds(updated);
      saveState("deleted_convos", updated);
      setActiveMenuConvoId(null);
    }
  };

  const handleReportConvo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowReportModal(id);
    setActiveMenuConvoId(null);
  };

  const submitReport = () => {
    if (!reportReason.trim()) return;
    setReportSuccess(true);
    setTimeout(() => {
      setShowReportModal(null);
      setReportReason("");
      setReportSuccess(false);
    }, 1500);
  };

  // Dynamic categorization helper
  const getConvoCategory = (convo: any): "artistes" | "prestataires" | "recruteurs" | "support" => {
    if (convo.type === "support" || convo.id === "support" || convo.id === currentUser?.uid) {
      return "support";
    }
    const sum = convo.id.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    if (sum % 3 === 0) return "artistes";
    if (sum % 3 === 1) return "prestataires";
    return "recruteurs";
  };

  // Build the list of conversations including support as a listable item if applicable
  const allList = [...conversations];
  
  // Exclude deleted conversations and support convo (handled explicitly at pinned if active)
  const activeList = allList.filter(c => !deletedIds.includes(c.id));

  // Sort: Pinned conversations always go first, then updatedAt desc
  const sortedConvos = [...activeList].sort((a, b) => {
    const aPinned = pinnedIds.includes(a.id) ? 1 : 0;
    const bPinned = pinnedIds.includes(b.id) ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;
    
    const aTime = a.updatedAt || 0;
    const bTime = b.updatedAt || 0;
    return bTime - aTime;
  });

  // Apply Search + Category + Archive Filters
  const filteredConvos = sortedConvos.filter(convo => {
    // Search check
    const partnerName = convo.userName || convo.recipientName || "Partenaire Gombo";
    const matchesSearch = partnerName.toLowerCase().includes(filterQuery.toLowerCase()) || 
                          (convo.lastMessage || "").toLowerCase().includes(filterQuery.toLowerCase());
    if (!matchesSearch) return false;

    // Archive isolation: "archived" view shows only archived. Other views hide archived by default.
    const isArchived = archivedIds.includes(convo.id);
    if (activeCategory === "archived") {
      return isArchived;
    } else {
      if (isArchived) return false;
    }

    // Category check
    if (activeCategory === "all") return true;
    if (activeCategory === "unread") {
      const unread = convo.unreadCount?.[currentUser?.uid] || 0;
      return unread > 0;
    }
    
    const cat = getConvoCategory(convo);
    return cat === activeCategory;
  });

  return (
    <div className="space-y-3 pb-24 relative">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-afri-text-muted" />
        <input
          type="text"
          placeholder="Rechercher une discussion ou un partenaire..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-afri-bg-sec border border-afri-border rounded-2xl text-xs text-afri-text focus:outline-none focus:border-[#D4AF37] placeholder:text-afri-text-muted transition shadow-sm"
        />
      </div>

      {/* Filter Tabs Horizontal Scrolling */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {[
          { id: "all", label: "Tous" },
          { id: "unread", label: "Non lus" },
          { id: "artistes", label: "Artistes 🎭" },
          { id: "prestataires", label: "Prestataires ⚙️" },
          { id: "recruteurs", label: "Recruteurs 👔" },
          { id: "support", label: "Support ✔" },
          { id: "archived", label: "Archivés 📦" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveCategory(tab.id as any);
              setActiveMenuConvoId(null);
            }}
            className={`px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wide rounded-xl border transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeCategory === tab.id
                ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                : "bg-afri-bg-sec border-afri-border text-afri-text-sec hover:text-afri-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Official Support Pinned Card - only shown if we're not inside the specialized archived tab */}
      {activeCategory !== "archived" && activeCategory !== "artistes" && activeCategory !== "prestataires" && activeCategory !== "recruteurs" && (
        <div
          onClick={onOpenSupport}
          className="p-4 bg-gradient-to-r from-afri-bg-sec to-afri-bg-ter border border-[#D4AF37]/40 rounded-2xl flex items-center justify-between cursor-pointer hover:border-[#D4AF37] transition shadow-md group"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] overflow-hidden shrink-0">
                <img src="/logo_afrigombo.png" alt="Support" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-afri-bg-sec rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-black uppercase text-afri-text tracking-wide group-hover:text-[#D4AF37] transition">
                  Support Officiel AFRIGOMBO
                </h3>
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {supportConvo?.lastMessage || "Équipe 24/7 souveraine à votre disposition."}
              </p>
            </div>
          </div>

          {supportConvo?.unreadCount?.[currentUser?.uid] > 0 && (
            <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full animate-bounce shrink-0">
              {supportConvo.unreadCount[currentUser.uid]}
            </span>
          )}
        </div>
      )}

      {/* Conversations List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 pt-1">
          <span className="text-[10px] font-bold text-afri-text-muted uppercase tracking-wider">
            {activeCategory === "archived" ? "Discussions Archivées" : "Discussions Récentes"} ({filteredConvos.length})
          </span>
          <button
            onClick={onStartNewChat}
            className="text-[11px] font-bold text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouvelle discussion
          </button>
        </div>

        {loadingConvos ? (
          <div className="text-center py-12 text-xs text-afri-text-sec">
            Chargement de la messagerie...
          </div>
        ) : filteredConvos.length === 0 ? (
          <div className="p-8 bg-afri-bg-sec border border-afri-border rounded-2xl text-center space-y-3">
            <MessageSquare className="w-8 h-8 text-afri-text-muted mx-auto opacity-50" />
            <div>
              <p className="text-xs font-bold text-afri-text">Aucune discussion trouvée</p>
              <p className="text-[11px] text-afri-text-sec mt-1">
                Aucun échange ne correspond aux filtres ou critères de recherche actuels.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveCategory("all");
                setFilterQuery("");
              }}
              className="px-4 py-2 bg-afri-bg-ter border border-afri-border text-afri-text text-xs font-bold rounded-xl cursor-pointer hover:border-[#D4AF37] transition"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          filteredConvos.map((convo) => {
            const partnerName = convo.userName || convo.recipientName || "Partenaire Gombo";
            const partnerPhoto = convo.userPhoto || convo.recipientPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${convo.id}`;
            const unread = convo.unreadCount?.[currentUser?.uid] || 0;
            const isPinned = pinnedIds.includes(convo.id);
            const isMuted = mutedIds.includes(convo.id);
            const isBlocked = blockedIds.includes(convo.id);
            const isArchived = archivedIds.includes(convo.id);
            const categoryLabel = getConvoCategory(convo);

            // Verified Badge Algorithm (e.g. support or certain user IDs)
            const isVerified = convo.type === "support" || convo.id.charCodeAt(0) % 2 === 0;

            return (
              <div
                key={convo.id}
                onClick={() => {
                  if (activeMenuConvoId === convo.id) {
                    setActiveMenuConvoId(null);
                  } else {
                    onSelectConversation(convo);
                  }
                }}
                className={`p-3.5 bg-afri-bg-sec border rounded-2xl flex items-center justify-between cursor-pointer hover:border-[#D4AF37]/60 transition shadow-sm group relative ${
                  isPinned ? "border-[#D4AF37]/40 bg-gradient-to-r from-afri-bg-sec to-afri-bg-sec/80" : "border-afri-border"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <img
                      src={partnerPhoto}
                      alt={partnerName}
                      className="w-11 h-11 rounded-2xl object-cover border border-afri-border"
                      referrerPolicy="no-referrer"
                    />
                    {isPinned && (
                      <span className="absolute -top-1 -left-1 p-1 bg-[#D4AF37] text-black rounded-lg shadow">
                        <Pin className="w-2.5 h-2.5 fill-black" />
                      </span>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-afri-bg-sec rounded-full" />
                  </div>
                  
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-afri-text truncate group-hover:text-[#D4AF37] transition">
                        {partnerName}
                      </h4>
                      {isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] fill-black shrink-0" />
                      )}
                      {isMuted && (
                        <VolumeX className="w-3 h-3 text-afri-text-muted shrink-0" />
                      )}
                    </div>
                    
                    <p className="text-[11px] text-afri-text-sec truncate mt-0.5 flex items-center gap-1">
                      {isBlocked ? (
                        <span className="text-rose-500 font-bold flex items-center gap-1">
                          <Ban className="w-3 h-3" /> Utilisateur bloqué
                        </span>
                      ) : (
                        <>
                          {unread === 0 ? (
                            <CheckCheck className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-afri-text-muted shrink-0" />
                          )}
                          <span className="truncate">{convo.lastMessage || "Appuyez pour ouvrir la conversation"}</span>
                        </>
                      )}
                    </p>

                    {/* Role badges */}
                    <div className="flex gap-1 mt-1.5">
                      <span className="text-[8.5px] font-black px-1.5 py-0.2 rounded bg-afri-bg-ter text-afri-text-sec uppercase font-mono tracking-wider border border-afri-border">
                        {categoryLabel}
                      </span>
                      {isArchived && (
                        <span className="text-[8.5px] font-black px-1.5 py-0.2 rounded bg-[#D4AF37]/15 text-[#D4AF37] uppercase font-mono tracking-wider border border-[#D4AF37]/30">
                          Archivé
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between h-12 shrink-0">
                  <span className="text-[9px] font-mono text-afri-text-muted">
                    {convo.updatedAt ? new Date(convo.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    {unread > 0 && (
                      <span className="px-1.5 py-0.5 bg-[#D4AF37] text-black text-[9px] font-black rounded-full min-w-[16px] text-center">
                        {unread}
                      </span>
                    )}

                    {/* CONTEXT ACTIONS DROPDOWN TRIGGER */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuConvoId(activeMenuConvoId === convo.id ? null : convo.id);
                        }}
                        className="p-1 rounded-lg hover:bg-afri-bg-ter text-afri-text-muted hover:text-afri-text transition cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu Overlay */}
                      {activeMenuConvoId === convo.id && (
                        <div className="absolute right-0 mt-1 w-44 bg-afri-bg-sec border border-afri-border rounded-xl shadow-xl py-1 z-[99] text-left">
                          <button
                            onClick={(e) => handleTogglePin(convo.id, e)}
                            className="w-full px-3 py-2 text-[11px] text-afri-text hover:bg-afri-bg-ter transition flex items-center gap-2 font-bold cursor-pointer"
                          >
                            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                            {isPinned ? "Désépingler" : "Épingler"}
                          </button>

                          <button
                            onClick={(e) => handleToggleArchive(convo.id, e)}
                            className="w-full px-3 py-2 text-[11px] text-afri-text hover:bg-afri-bg-ter transition flex items-center gap-2 font-bold cursor-pointer"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            {isArchived ? "Désarchiver" : "Archiver"}
                          </button>

                          <button
                            onClick={(e) => handleToggleMute(convo.id, e)}
                            className="w-full px-3 py-2 text-[11px] text-afri-text hover:bg-afri-bg-ter transition flex items-center gap-2 font-bold cursor-pointer"
                          >
                            {isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                            {isMuted ? "Réactiver son" : "Rendre muet"}
                          </button>

                          <button
                            onClick={(e) => handleToggleBlock(convo.id, e)}
                            className="w-full px-3 py-2 text-[11px] text-rose-400 hover:bg-afri-bg-ter transition flex items-center gap-2 font-bold cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            {isBlocked ? "Débloquer" : "Bloquer l'artiste"}
                          </button>

                          <button
                            onClick={(e) => handleReportConvo(convo.id, e)}
                            className="w-full px-3 py-2 text-[11px] text-orange-400 hover:bg-afri-bg-ter transition flex items-center gap-2 font-bold cursor-pointer"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Signaler l'abus
                          </button>

                          <div className="border-t border-afri-border my-1" />

                          <button
                            onClick={(e) => handleDeleteConvo(convo.id, e)}
                            className="w-full px-3 py-2 text-[11px] text-rose-500 hover:bg-rose-500/10 transition flex items-center gap-2 font-bold cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* REPORT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 bg-[#2F2A24]/40 dark:bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-afri-bg-sec border border-afri-border rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-[#D4AF37] tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Signaler un Abus Gombo
              </h3>
              <button 
                onClick={() => setShowReportModal(null)}
                className="p-1 rounded-lg hover:bg-afri-bg-ter text-afri-text-sec cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-afri-text-sec leading-relaxed">
              AFRIGOMBO maintient une tolérance zéro pour la fraude, le harcèlement et les propositions de paiement direct hors de la plateforme.
            </p>

            {reportSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-2 text-emerald-400">
                <AlertCircle className="w-8 h-8 mx-auto" />
                <p className="text-xs font-bold">Signalement enregistré !</p>
                <p className="text-[10px] text-afri-text-sec">Nos modérateurs examinent les discussions sous 15 minutes.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  placeholder="Expliquez brièvement l'abus (ex: demande de paiement en dehors d'AFRIGOMBO, harcèlement, propos racistes...)"
                  rows={4}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-3 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text focus:outline-none focus:border-[#D4AF37] placeholder:text-afri-text-muted resize-none"
                />
                <button
                  onClick={submitReport}
                  disabled={!reportReason.trim()}
                  className="w-full py-3 bg-[#D4AF37] hover:bg-amber-400 disabled:opacity-40 text-black font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                >
                  Envoyer le rapport
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
