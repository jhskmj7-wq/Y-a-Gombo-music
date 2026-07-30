import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, HelpCircle, CheckCircle, Clock, AlertTriangle, Send, 
  User, ShieldCheck, Coins, Zap, Search, Filter, CheckSquare, Sparkles 
} from "lucide-react";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function AdminSupportCenter({ audioSynth }: { audioSynth?: any }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [filterTab, setFilterTab] = useState<string>("all"); // "all" | "nouveaux" | "en_cours" | "resolus" | "urgents"
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "support"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTickets(tList);
      if (tList.length > 0 && !selectedTicket) {
        setSelectedTicket(tList[0]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedTicket?.id) return;
    const msgQuery = query(collection(db, "support", selectedTicket.id, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(msgQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [selectedTicket?.id]);

  const handleSendReply = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || replyText;
    if (!textToSend.trim() || !selectedTicket?.id) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "support", selectedTicket.id, "messages"), {
        senderUid: "founder_admin",
        senderName: "Trône du Fondateur (Support)",
        text: textToSend,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, "support", selectedTicket.id), {
        status: "in_progress",
        lastMessageAt: serverTimestamp()
      });

      setReplyText("");
      try { audioSynth?.playValidationSuccess?.(); } catch(e){}
    } catch (err) {
      console.error("Error sending support reply:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedTicket?.id) return;
    try {
      await updateDoc(doc(db, "support", selectedTicket.id), {
        status: newStatus
      });
      setSelectedTicket((prev: any) => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const quickReplies = [
    "Votre dépôt est validé.",
    "Merci d'envoyer votre preuve.",
    "Nous traitons votre demande.",
    "Le problème est résolu."
  ];

  const filteredTickets = tickets.filter(t => {
    if (filterTab === "all") return true;
    if (filterTab === "nouveaux") return t.status === "open";
    if (filterTab === "en_cours") return t.status === "in_progress" || t.status === "pending";
    if (filterTab === "resolus") return t.status === "resolved" || t.status === "closed";
    if (filterTab === "urgents") return t.priority === "urgent" || t.category === "Bug" || t.category === "Paiement";
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wider font-sans">Centre Support SAV AFRIGOMBO</h2>
            <p className="text-xs font-mono text-zinc-400">Supervision en temps réel des tickets et réclamations communautaires</p>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: "all", label: "Tous", count: tickets.length },
            { id: "nouveaux", label: "Nouveaux", count: tickets.filter(t => t.status === "open").length },
            { id: "en_cours", label: "En cours", count: tickets.filter(t => t.status === "in_progress" || t.status === "pending").length },
            { id: "resolus", label: "Résolus", count: tickets.filter(t => t.status === "resolved" || t.status === "closed").length },
            { id: "urgents", label: "Urgents", count: tickets.filter(t => t.priority === "urgent" || t.category === "Bug" || t.category === "Paiement").length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filterTab === tab.id ? "bg-[#D4AF37] text-black shadow-md" : "bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[9px] font-mono font-bold">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Tickets List (4 cols) */}
        <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-3 max-h-[750px] overflow-y-auto">
          <h3 className="text-xs font-mono font-black text-zinc-400 uppercase tracking-widest px-2">
            Tickets & Réclamations ({filteredTickets.length})
          </h3>

          <div className="space-y-2">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs font-mono">Aucun ticket dans cette catégorie</div>
            ) : (
              filteredTickets.map(ticket => {
                const isSelected = selectedTicket?.id === ticket.id;
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-2 ${
                      isSelected ? "bg-zinc-800 border-[#D4AF37] shadow-lg" : "bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={ticket.userPhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                          alt={ticket.userName}
                          className="w-8 h-8 rounded-full object-cover border border-[#D4AF37]"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase truncate max-w-[120px]">{ticket.userName}</h4>
                          <span className="text-[9px] font-mono text-[#D4AF37]">{ticket.category || "Support"}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-mono font-black uppercase ${
                        ticket.status === "open" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                        ticket.status === "in_progress" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                        "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center: Active Conversation (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-3xl p-4 flex flex-col h-[750px] shadow-xl">
          {selectedTicket ? (
            <>
              {/* Ticket Top Bar */}
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between mb-3 shrink-0">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase">{selectedTicket.userName}</h3>
                  <p className="text-[10px] font-mono text-[#D4AF37]">Motif : {selectedTicket.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus("resolved")}
                    className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-[10px] font-bold uppercase transition cursor-pointer"
                  >
                    Résoudre ✓
                  </button>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80">
                {messages.length === 0 ? (
                  <div className="text-center py-20 text-zinc-500 text-xs font-mono">Aucun message dans ce ticket</div>
                ) : (
                  messages.map(m => {
                    const isAdmin = m.senderUid === "founder_admin";
                    return (
                      <div key={m.id} className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-xs ${isAdmin ? "bg-[#D4AF37] text-black font-medium" : "bg-zinc-900 text-white border border-zinc-800"}`}>
                          <span className="text-[9px] font-mono block font-bold opacity-70 mb-0.5">{m.senderName}</span>
                          <p className="leading-relaxed">{m.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick Replies */}
              <div className="py-2 flex flex-wrap gap-1.5 shrink-0">
                {quickReplies.map((qr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendReply(undefined, qr)}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-[10px] font-mono transition cursor-pointer border border-zinc-700"
                  >
                    ⚡ {qr}
                  </button>
                ))}
              </div>

              {/* Reply Input */}
              <form onSubmit={(e) => handleSendReply(e)} className="flex items-center gap-2 mt-2 shrink-0">
                <input
                  type="text"
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Répondre en tant que Fondateur..."
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="p-3 bg-[#D4AF37] hover:bg-[#b8982e] text-black rounded-xl transition cursor-pointer flex items-center justify-center disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs font-mono">
              Sélectionnez un ticket pour afficher la conversation
            </div>
          )}
        </div>

        {/* Right: User Profile Details (3 cols) */}
        <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <h3 className="text-xs font-mono font-black text-zinc-400 uppercase tracking-widest">
            Profil Utilisateur
          </h3>

          {selectedTicket ? (
            <div className="space-y-4 text-center">
              <img
                src={selectedTicket.userPhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                alt={selectedTicket.userName}
                className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-[#D4AF37] shadow-md"
              />

              <div className="space-y-1">
                <h4 className="text-sm font-black text-white uppercase">{selectedTicket.userName}</h4>
                <p className="text-[10px] font-mono text-[#D4AF37]">{selectedTicket.afriId || "AFRI-ID"}</p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 space-y-2 text-left">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Gombo ID:</span>
                  <span className="text-white font-mono font-bold">{selectedTicket.gomboId || "N/A"}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Premium:</span>
                  <span className={`font-mono font-bold ${selectedTicket.isPremium ? "text-amber-400" : "text-zinc-500"}`}>
                    {selectedTicket.isPremium ? "Actif 👑" : "Standard"}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Wallet:</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {Number(selectedTicket.walletBalance || 0).toLocaleString()} FCFA
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">UID:</span>
                  <span className="text-zinc-400 font-mono text-[9px] truncate max-w-[130px]">{selectedTicket.userUid}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-zinc-500 text-xs font-mono">Aucun utilisateur sélectionné</div>
          )}
        </div>
      </div>
    </div>
  );
}
