import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, HelpCircle, CheckCircle, Clock, AlertTriangle, Send, 
  User, ShieldCheck, Coins, Zap, Search, Filter, CheckSquare, Sparkles, MapPin, Globe
} from "lucide-react";
import { collection, onSnapshot, query, orderBy, doc, getDoc, updateDoc, addDoc, where } from "firebase/firestore";
import { db } from "../../firebase";
import { SupportService, SUPPORT_PROFILE } from "../../services/SupportService";

export default function AdminSupportCenter({ audioSynth }: { audioSynth?: any }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all"); // "all" | "Wallet" | "Premium" | "Bug" | "Contrat" | "Signalement" | "Autre"
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["all", "Wallet", "Premium", "Bug", "Contrat", "Signalement", "Autre"];

  // 1. Sync support conversations
  useEffect(() => {
    const q = query(collection(db, "supportConversations"), orderBy("lastMessageAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setConversations(list);
      
      // Select first conversation if none selected yet
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
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
          setSelectedUserProfile(userSnap.data());
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
      
      // Send resolution message
      await SupportService.sendSupportMessage(
        selectedConversation.id,
        SUPPORT_PROFILE.uid,
        SUPPORT_PROFILE.name,
        "Votre demande est résolue. N'hésitez pas à nous recontacter si nécessaire.",
        selectedConversation.category
      );

      // Log action
      await addDoc(collection(db, "supportLogs"), {
        action: "resolve_conversation",
        conversationId: selectedConversation.id,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error resolving conversation:", err);
    }
  };

  const quickReplies = [
    "Dépôt validé.",
    "Merci pour votre preuve.",
    "Votre retrait est en cours.",
    "Merci de patienter.",
    "Votre demande est résolue."
  ];

  // Filtering conversations based on category & search query
  const filteredConversations = conversations.filter(convo => {
    // 1. Category Filter
    if (filterCategory !== "all" && convo.category !== filterCategory) return false;
    
    // 2. Search Filter (user name or uid)
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

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* Header */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wider font-sans">MESSAGERIE SUPPORT</h2>
            <p className="text-xs font-mono text-zinc-400">Écoute active et assistance SAV de la communauté AFRIGOMBO</p>
          </div>
        </div>

        {/* Categories filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filterCategory === cat 
                  ? "bg-[#D4AF37] text-black shadow-md border-transparent" 
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

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Conversations list (4 cols) */}
        <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-4 max-h-[750px] overflow-y-auto flex flex-col h-[750px]">
          <div className="px-2 shrink-0 space-y-2">
            <h3 className="text-xs font-mono font-black text-zinc-400 uppercase tracking-widest">
              Discussions SAV ({filteredConversations.length})
            </h3>
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un membre..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs font-mono">Aucun ticket support trouvé</div>
            ) : (
              filteredConversations.map(convo => {
                const isSelected = selectedConversation?.id === convo.id;
                const unreadForSupport = convo.unreadCount?.afrigombo_support || 0;
                
                return (
                  <div
                    key={convo.id}
                    onClick={() => setSelectedConversation(convo)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-2 relative ${
                      isSelected 
                        ? "bg-zinc-800 border-[#D4AF37] shadow-lg" 
                        : "bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={convo.userPhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                          alt={convo.userName}
                          className="w-9 h-9 rounded-full object-cover border border-[#D4AF37]"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 max-w-[150px]">
                          <h4 className="text-xs font-bold text-white uppercase truncate">{convo.userName}</h4>
                          <p className="text-[10px] text-zinc-500 truncate font-mono">{convo.lastMessage}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end justify-between gap-1.5 shrink-0">
                        <span className="text-[8px] font-mono text-zinc-500">
                          {convo.lastMessageAt ? new Date(convo.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded-md text-[8px] font-mono text-[#D4AF37] uppercase font-black">
                            {convo.category || "Autre"}
                          </span>
                          {unreadForSupport > 0 && (
                            <span className="w-5 h-5 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                              {unreadForSupport}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center column: Active support conversation stream (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-3xl p-4 flex flex-col h-[750px] shadow-xl">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
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

        {/* Right column: Selected user details cards (3 cols) */}
        <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl min-h-[400px]">
          <h3 className="text-xs font-mono font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">
            Profil Utilisateur
          </h3>

          {selectedConversation ? (
            <div className="space-y-5">
              <div className="text-center space-y-2">
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

              {/* Complete Metadata Cards - dynamic lookup */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 space-y-3 text-left">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block">Nom :</span>
                  <span className="text-xs text-white font-bold block">{selectedUserProfile?.name || selectedUserProfile?.displayName || selectedConversation.userName}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block">UID :</span>
                  <span className="text-[9px] text-zinc-400 font-mono block break-all">{selectedConversation.userUid}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block">Gombo ID :</span>
                  <span className="text-xs text-white font-mono block font-black">{selectedUserProfile?.gomboId || "Néant"}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block">Afri ID :</span>
                  <span className="text-xs text-[#D4AF37] font-mono block font-black">{selectedUserProfile?.afriId || "Néant"}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block">Wallet Solde :</span>
                  <span className="text-xs text-emerald-400 font-bold block">
                    {selectedUserProfile?.wallet?.soldeDisponible !== undefined 
                      ? `${Number(selectedUserProfile.wallet.soldeDisponible).toLocaleString()} FCFA`
                      : `${Number(selectedUserProfile?.walletBalance || 0).toLocaleString()} FCFA`
                    }
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block">Niveau Premium :</span>
                  <span className={`text-xs font-bold block ${selectedUserProfile?.isPremium || selectedUserProfile?.premium ? "text-amber-400" : "text-zinc-500"}`}>
                    {selectedUserProfile?.isPremium || selectedUserProfile?.premium ? "👑 Premium Actif" : "Standard"}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block">Ville :</span>
                  <span className="text-xs text-zinc-300 block flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#D4AF37]" />
                    {selectedUserProfile?.ville || selectedUserProfile?.city || "Non renseigné"}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block">Dernière connexion :</span>
                  <span className="text-[10px] text-zinc-400 font-mono block">
                    {selectedUserProfile?.lastLogin || selectedUserProfile?.lastActive 
                      ? new Date(selectedUserProfile.lastLogin || selectedUserProfile.lastActive).toLocaleString('fr-FR')
                      : "Indisponible"
                    }
                  </span>
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
  );
}
