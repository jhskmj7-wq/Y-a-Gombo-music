import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, HelpCircle, CheckCircle, Clock, AlertTriangle, Send, 
  User, ShieldCheck, Coins, Zap, Search, Filter, CheckSquare, Sparkles, MapPin, Globe,
  ShieldX, UserX, UserCheck, Wallet, FileText, Music, Flag, Crown, History
} from "lucide-react";
import { 
  collection, onSnapshot, query, orderBy, doc, getDoc, updateDoc, addDoc, where 
} from "firebase/firestore";
import { db } from "../../firebase";
import { SupportService, SUPPORT_PROFILE } from "../../services/SupportService";

export default function AdminSupportCenter({ audioSynth }: { audioSynth?: any }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "closed">("all");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modActionMessage, setModActionMessage] = useState("");

  const categories = ["all", "Wallet", "Premium", "Bug", "Contrat", "Signalement", "Autre"];

  // 1. Realtime Sync support conversations
  useEffect(() => {
    const q = query(collection(db, "supportConversations"), orderBy("lastMessageAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setConversations(list);
      
      if (list.length > 0 && !selectedConversation) {
        setSelectedConversation(list[0]);
      }
    }, (err) => {
      console.warn("Error loading support conversations:", err);
    });
    return () => unsubscribe();
  }, []);

  // 2. Sync messages for the active conversation
  useEffect(() => {
    if (!selectedConversation?.id) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, "supportMessages"),
      where("conversationId", "==", selectedConversation.id),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setMessages(msgs);
      
      // Clear unread count for support
      try {
        const convoRef = doc(db, "supportConversations", selectedConversation.id);
        updateDoc(convoRef, {
          "unreadCount.afrigombo_support": 0
        });
      } catch (err) {
        console.warn("Could not clear unread count:", err);
      }
    }, (err) => {
      console.warn("Error loading support messages:", err);
    });

    return () => unsubscribe();
  }, [selectedConversation?.id]);

  // 3. Dynamic lookup of user profile for the active conversation
  useEffect(() => {
    if (!selectedConversation?.userUid) {
      setSelectedUserProfile(null);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const userRef = doc(db, "users", selectedConversation.userUid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setSelectedUserProfile({ uid: userSnap.id, ...userSnap.data() });
        } else {
          setSelectedUserProfile(null);
        }
      } catch (err) {
        console.warn("Could not load user profile dynamically:", err);
        setSelectedUserProfile(null);
      }
    };

    fetchUserProfile();
  }, [selectedConversation?.userUid]);

  const handleSendReply = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || replyText;
    if (!textToSend.trim() || !selectedConversation?.id) return;

    setLoading(true);
    try {
      await SupportService.sendSupportMessage(
        selectedConversation.id,
        SUPPORT_PROFILE.uid,
        SUPPORT_PROFILE.name,
        textToSend,
        selectedConversation.category
      );

      setReplyText("");
      try { audioSynth?.playValidationSuccess?.(); } catch(e){}
    } catch (err) {
      console.error("Error sending support reply:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedConversation?.id) return;
    try {
      const convoRef = doc(db, "supportConversations", selectedConversation.id);
      await updateDoc(convoRef, {
        status: "closed"
      });
      setSelectedConversation((prev: any) => prev ? { ...prev, status: "closed" } : null);
      
      await SupportService.sendSupportMessage(
        selectedConversation.id,
        SUPPORT_PROFILE.uid,
        SUPPORT_PROFILE.name,
        "Votre demande est résolue. N'hésitez pas à nous recontacter si nécessaire.",
        selectedConversation.category
      );

      await addDoc(collection(db, "supportLogs"), {
        action: "resolve_conversation",
        conversationId: selectedConversation.id,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error resolving conversation:", err);
    }
  };

  // Moderation Tools
  const handleSuspendUser = async () => {
    if (!selectedConversation?.userUid) return;
    const isCurrentlySuspended = !!selectedUserProfile?.isSuspended;
    const newStatus = !isCurrentlySuspended;

    if (confirm(`Voulez-vous ${newStatus ? "suspendre" : "réactiver"} le compte de ${selectedConversation.userName} ?`)) {
      try {
        await updateDoc(doc(db, "users", selectedConversation.userUid), {
          isSuspended: newStatus,
          suspendedAt: newStatus ? new Date().toISOString() : null
        });
        setSelectedUserProfile((prev: any) => prev ? { ...prev, isSuspended: newStatus } : null);
        setModActionMessage(newStatus ? "Compte suspendu ✓" : "Suspension levée ✓");
        setTimeout(() => setModActionMessage(""), 3000);
      } catch (err) {
        console.error("Error updating suspension:", err);
      }
    }
  };

  const handleBanUser = async () => {
    if (!selectedConversation?.userUid) return;
    const isCurrentlyBanned = !!selectedUserProfile?.isBanned;
    const newStatus = !isCurrentlyBanned;

    if (confirm(`⚠️ Voulez-vous ${newStatus ? "BANNIR définitivement" : "débannir"} l'utilisateur ${selectedConversation.userName} ?`)) {
      try {
        await updateDoc(doc(db, "users", selectedConversation.userUid), {
          isBanned: newStatus,
          bannedAt: newStatus ? new Date().toISOString() : null
        });
        setSelectedUserProfile((prev: any) => prev ? { ...prev, isBanned: newStatus } : null);
        setModActionMessage(newStatus ? "Utilisateur banni 🚫" : "Bannissement annulé ✓");
        setTimeout(() => setModActionMessage(""), 3000);
      } catch (err) {
        console.error("Error updating ban:", err);
      }
    }
  };

  const quickReplies = [
    "Dépôt validé.",
    "Merci pour votre preuve.",
    "Votre retrait est en cours.",
    "Merci de patienter.",
    "Votre demande est résolue."
  ];

  // Filtering conversations
  const filteredConversations = conversations.filter(convo => {
    if (filterCategory !== "all" && convo.category !== filterCategory) return false;
    if (filterStatus === "open" && convo.status === "closed") return false;
    if (filterStatus === "closed" && convo.status !== "closed") return false;
    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase();
      const userNameLower = (convo.userName || "").toLowerCase();
      const uidLower = (convo.userUid || "").toLowerCase();
      if (!userNameLower.includes(queryLower) && !uidLower.includes(queryLower)) {
        return false;
      }
    }
    return true;
  });

  // Calculate top bar metrics
  const activeConversationsCount = conversations.filter(c => c.status !== "closed").length;
  const supportCount = conversations.filter(c => c.category === "Autre" || c.category === "Bug").length;
  const walletTransactionsCount = conversations.filter(c => c.category === "Wallet").length;
  const reportsCount = conversations.filter(c => c.category === "Signalement").length;

  return (
    <div className="space-y-6 animate-fadeIn text-left max-w-full overflow-hidden">
      {/* Header & Metrics Dashboard Bar */}
      <div className="space-y-4">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider font-sans">
                CENTRE DE MESSAGERIE & WHATSAPP SUPPORT
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                Discussions en direct, assistance SAV et outils de modération en temps réel
              </p>
            </div>
          </div>

          {/* Categories filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  filterCategory === cat 
                    ? "bg-[#D4AF37] text-black shadow-md border-transparent font-black" 
                    : "bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800"
                }`}
              >
                <span>{cat === "all" ? "Toutes" : cat}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[8px] font-mono font-bold">
                  {cat === "all" ? conversations.length : conversations.filter(c => c.category === cat).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 5 Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl text-center">
            <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold block">Conversations Actives</span>
            <span className="text-base font-black text-white">{activeConversationsCount}</span>
          </div>
          <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl text-center">
            <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold block">Tickets Support</span>
            <span className="text-base font-black text-[#D4AF37]">{supportCount}</span>
          </div>
          <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl text-center">
            <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold block">Transactions</span>
            <span className="text-base font-black text-emerald-400">{walletTransactionsCount}</span>
          </div>
          <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl text-center">
            <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold block">Signalements</span>
            <span className="text-base font-black text-rose-400">{reportsCount}</span>
          </div>
          <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl text-center">
            <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold block">En Ligne</span>
            <span className="text-base font-black text-sky-400">124</span>
          </div>
          <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl text-center">
            <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold block">Messages Aujourd'hui</span>
            <span className="text-base font-black text-purple-400">412</span>
          </div>
          <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl text-center col-span-2 sm:col-span-1">
            <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold block">Temps Moyen Réponse</span>
            <span className="text-base font-black text-emerald-400">&lt; 3 min</span>
          </div>
        </div>
      </div>

      {/* Main WhatsApp Business 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Column 1: Conversations list (4 cols) */}
        <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-4 max-h-[750px] overflow-y-auto flex flex-col h-[750px]">
          <div className="px-2 shrink-0 space-y-2">
            <h3 className="text-xs font-mono font-black text-zinc-400 uppercase tracking-widest">
              Fil des Discussions ({filteredConversations.length})
            </h3>
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            {/* Status Tabs Switcher */}
            <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              {(["all", "open", "closed"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`py-1 rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    filterStatus === st
                      ? "bg-[#D4AF37] text-black font-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {st === "all" ? "Tous" : st === "open" ? "Ouverts" : "Résolus"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-1">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs font-mono">Aucun ticket support trouvé</div>
            ) : (
              filteredConversations.map(convo => {
                const isSelected = selectedConversation?.id === convo.id;
                const unreadForSupport = convo.unreadCount?.afrigombo_support || 0;
                
                // Determine Category Badge Colors
                let catStyle = "bg-zinc-950 border-zinc-800 text-[#D4AF37]";
                if (convo.category === "Wallet") catStyle = "bg-purple-500/10 border-purple-500/20 text-purple-400";
                else if (convo.category === "Bug") catStyle = "bg-rose-500/10 border-rose-500/20 text-rose-400";
                else if (convo.category === "Contrat") catStyle = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                else if (convo.category === "Signalement") catStyle = "bg-amber-500/10 border-amber-500/20 text-amber-400";

                // Determine Priority Tag
                const isUrgent = convo.category === "Bug" || convo.category === "Wallet" || convo.priority === "urgent";
                const isNormal = convo.category === "Signalement" || convo.priority === "normal";
                const priorityLabel = isUrgent ? "🚨 Urgent" : isNormal ? "⚡ Normal" : "💬 Bas";
                const priorityStyle = isUrgent 
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                  : isNormal 
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                    : "bg-blue-500/10 text-blue-400 border-blue-500/20";

                return (
                  <div
                    key={convo.id}
                    onClick={() => setSelectedConversation(convo)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-3 relative ${
                      isSelected 
                        ? "bg-zinc-800 border-[#D4AF37] shadow-lg" 
                        : "bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={convo.userPhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                          alt={convo.userName}
                          className="w-8.5 h-8.5 rounded-full object-cover border border-[#D4AF37]/50"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-white uppercase truncate flex items-center gap-1">
                            <span>{convo.userName}</span>
                            {convo.status === "closed" ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Résolu" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" title="En traitement" />
                            )}
                          </h4>
                          <p className="text-[10px] text-zinc-400 truncate font-mono mt-0.5">{convo.lastMessage}</p>
                        </div>
                      </div>
                      
                      <span className="text-[8px] font-mono text-zinc-500 shrink-0">
                        {convo.lastMessageAt ? new Date(convo.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1 border-t border-zinc-800/40 pt-2 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 border rounded text-[8px] font-mono font-bold uppercase ${catStyle}`}>
                          {convo.category || "Autre"}
                        </span>
                        <span className={`px-1.5 py-0.5 border rounded text-[8px] font-mono font-bold uppercase ${priorityStyle}`}>
                          {priorityLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {convo.status === "closed" ? (
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-mono font-bold uppercase rounded">
                            Résolu
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] font-mono font-bold uppercase rounded animate-pulse">
                            Traitement
                          </span>
                        )}
                        {unreadForSupport > 0 && (
                          <span className="w-4 h-4 bg-red-500 text-white rounded-full text-[8px] font-bold flex items-center justify-center animate-pulse">
                            {unreadForSupport}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Active Discussion Stream (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-3xl p-4 flex flex-col h-[750px] shadow-xl">
          {selectedConversation ? (
            <>
              {/* Discussion Header */}
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <img
                    src={selectedConversation.userPhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                    alt={selectedConversation.userName}
                    className="w-7 h-7 rounded-full object-cover border border-[#D4AF37]"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase">{selectedConversation.userName}</h3>
                    <p className="text-[9px] font-mono text-zinc-500">
                      ID : <span className="text-[#D4AF37] font-bold">{selectedConversation.category || "Général"}</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedConversation.status !== "closed" ? (
                    <button
                      onClick={handleResolve}
                      className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-[10px] font-bold uppercase transition cursor-pointer"
                    >
                      Résoudre ✓
                    </button>
                  ) : (
                    <span className="px-2.5 py-1.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-xl text-[10px] font-bold uppercase">
                      Résolu ✓
                    </span>
                  )}
                </div>
              </div>

              {/* Message flow */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 min-h-0">
                {messages.length === 0 ? (
                  <div className="text-center py-20 text-zinc-500 text-xs font-mono">Chargement des messages...</div>
                ) : (
                  messages.map(m => {
                    const isSupport = m.senderUid === SUPPORT_PROFILE.uid;
                    return (
                      <div key={m.id} className={`flex flex-col ${isSupport ? "items-end" : "items-start"} animate-fadeIn`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                          isSupport 
                            ? "bg-[#D4AF37] text-black font-semibold rounded-tr-none" 
                            : "bg-zinc-900 text-white border border-zinc-800 rounded-tl-none"
                        }`}>
                          <span className={`text-[8px] font-mono block font-black mb-0.5 ${isSupport ? "text-black/70" : "text-[#D4AF37]"}`}>
                            {m.senderName}
                          </span>
                          <p>{m.text}</p>
                        </div>
                        <span className="text-[8px] font-mono text-zinc-600 mt-1 px-1">
                          {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick Response Shortcuts */}
              <div className="py-2 shrink-0">
                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5 px-1 font-bold">RÉPONSES RAPIDES :</p>
                <div className="flex flex-wrap gap-1.5">
                  {quickReplies.map((qr, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendReply(undefined, qr)}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-[#D4AF37] hover:text-black text-zinc-300 rounded-xl text-[10px] font-bold transition cursor-pointer border border-zinc-800"
                    >
                      ⚡ {qr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Form */}
              <form onSubmit={(e) => handleSendReply(e)} className="flex items-center gap-2 mt-1 shrink-0">
                <input
                  type="text"
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Répondre en tant que Support..."
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[#D4AF37] focus:outline-none placeholder:text-zinc-500"
                />
                <button
                  type="submit"
                  disabled={loading || !replyText.trim()}
                  className="p-3 bg-[#D4AF37] hover:bg-amber-400 text-black rounded-xl transition cursor-pointer flex items-center justify-center disabled:opacity-40"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-xs font-mono space-y-2">
              <MessageSquare className="w-8 h-8 text-[#D4AF37]/40" />
              <p>Sélectionnez une discussion pour commencer</p>
            </div>
          )}
        </div>

        {/* Column 3: User Details & Moderation Tools (3 cols) */}
        <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl min-h-[750px] flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">
              Profil & Modération
            </h3>

            {selectedConversation ? (
              <div className="space-y-4">
                <div className="text-center space-y-1.5">
                  <img
                    src={selectedConversation.userPhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                    alt={selectedConversation.userName}
                    className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-[#D4AF37] shadow-md"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-xs font-black text-white uppercase">{selectedConversation.userName}</h4>
                    <span className="px-1.5 py-0.5 bg-[#D4AF37]/15 text-[#D4AF37] text-[8px] font-mono font-bold rounded">
                      {selectedUserProfile?.afriId || "AFRI-MEMBER"}
                    </span>
                  </div>
                </div>

                {modActionMessage && (
                  <div className="p-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl text-center text-xs text-[#D4AF37] font-bold">
                    {modActionMessage}
                  </div>
                )}

                {/* Metadata details */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 space-y-2.5 text-left text-xs font-mono">
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase block font-bold">UID :</span>
                    <span className="text-[9px] text-zinc-400 block break-all">{selectedConversation.userUid}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold">Wallet Solde :</span>
                    <span className="text-xs text-emerald-400 font-bold">
                      {selectedUserProfile?.wallet?.soldeDisponible !== undefined 
                        ? `${Number(selectedUserProfile.wallet.soldeDisponible).toLocaleString()} FCFA`
                        : `${Number(selectedUserProfile?.walletBalance || 0).toLocaleString()} FCFA`
                      }
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold">Statut Premium :</span>
                    <span className={`text-xs font-bold ${selectedUserProfile?.isPremium || selectedUserProfile?.premium ? "text-amber-400" : "text-zinc-500"}`}>
                      {selectedUserProfile?.isPremium || selectedUserProfile?.premium ? "👑 Premium (1.5%)" : "Standard (2.5%)"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold">Statut Compte :</span>
                    <span className={`text-xs font-bold ${selectedUserProfile?.isBanned ? "text-rose-500" : selectedUserProfile?.isSuspended ? "text-amber-400" : "text-emerald-400"}`}>
                      {selectedUserProfile?.isBanned ? "🚫 Banni" : selectedUserProfile?.isSuspended ? "⏸️ Suspendu" : "🟢 Actif"}
                    </span>
                  </div>
                </div>

                {/* Section 6: Real Moderation Actions */}
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold block">
                    OUTILS DE MODÉRATION :
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleSuspendUser}
                      className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-[10px] font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      {selectedUserProfile?.isSuspended ? "Réactiver" : "Suspendre"}
                    </button>

                    <button
                      onClick={handleBanUser}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-[10px] font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ShieldX className="w-3.5 h-3.5" />
                      {selectedUserProfile?.isBanned ? "Débannir" : "Bannir"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => alert(`Historique des actions de ${selectedConversation.userName}`)}
                      className="p-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-[10px] font-bold uppercase transition flex items-center justify-center gap-1"
                    >
                      <History className="w-3.5 h-3.5 text-[#D4AF37]" /> Historique
                    </button>

                    <button
                      onClick={() => alert(`Transactions Wallet de ${selectedConversation.userName}`)}
                      className="p-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-[10px] font-bold uppercase transition flex items-center justify-center gap-1"
                    >
                      <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Wallet
                    </button>

                    <button
                      onClick={() => alert(`Publications de ${selectedConversation.userName}`)}
                      className="p-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-[10px] font-bold uppercase transition flex items-center justify-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5 text-sky-400" /> Publications
                    </button>

                    <button
                      onClick={() => alert(`Gombos créés par ${selectedConversation.userName}`)}
                      className="p-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-[10px] font-bold uppercase transition flex items-center justify-center gap-1"
                    >
                      <Music className="w-3.5 h-3.5 text-purple-400" /> Gombos
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-zinc-500 text-xs font-mono">
                Aucune sélection
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
