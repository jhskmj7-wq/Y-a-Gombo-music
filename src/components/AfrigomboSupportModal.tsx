import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, HelpCircle, ShieldCheck, MessageSquare, CheckCircle, Clock } from "lucide-react";
import { collection, addDoc, onSnapshot, query, where, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";

interface AfrigomboSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  profile: any;
  initialReason?: string;
}

export const AfrigomboSupportModal: React.FC<AfrigomboSupportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  profile,
  initialReason
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("Wallet");
  const [messageText, setMessageText] = useState<string>(initialReason || "");
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const categories = ["Wallet", "Premium", "Gombo", "Contrat", "Paiement", "Bug", "Localisation", "Autre"];

  useEffect(() => {
    if (!isOpen || !currentUser?.uid) return;
    // Check if user already has an open support ticket
    const q = query(collection(db, "support"), where("userUid", "==", currentUser.uid), where("status", "in", ["open", "pending", "in_progress"]));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setActiveTicketId(docSnap.id);
      }
    });
    return () => unsubscribe();
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (!activeTicketId) return;
    const msgQuery = query(collection(db, "support", activeTicketId, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(msgQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [activeTicketId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentUser?.uid) return;

    setLoading(true);
    try {
      let ticketId = activeTicketId;
      if (!ticketId) {
        // Create new support ticket in `support/`
        const ticketRef = await addDoc(collection(db, "support"), {
          userUid: currentUser.uid,
          userName: profile?.nomArtistique || profile?.name || currentUser.displayName || "Utilisateur",
          userPhoto: profile?.photoURL || profile?.avatar || currentUser.photoURL || "",
          gomboId: profile?.gomboId || "N/A",
          afriId: profile?.afriId || "AFRI-GOMBO",
          isPremium: profile?.isPremium || false,
          walletBalance: profile?.walletBalance || 0,
          category: selectedCategory,
          priority: selectedCategory === "Bug" || selectedCategory === "Paiement" ? "urgent" : "normal",
          status: "open",
          createdAt: serverTimestamp(),
          lastMessageAt: serverTimestamp()
        });
        ticketId = ticketRef.id;
        setActiveTicketId(ticketId);
      }

      // Add message to ticket messages subcollection
      await addDoc(collection(db, "support", ticketId, "messages"), {
        senderUid: currentUser.uid,
        senderName: profile?.nomArtistique || profile?.name || currentUser.displayName || "Utilisateur",
        text: messageText,
        createdAt: serverTimestamp()
      });

      setMessageText("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error sending support message:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[99999] animate-fadeIn">
      <div className="bg-[#0A0A0A] border border-[#D4AF37]/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Centre SAV AFRIGOMBO</h2>
              <p className="text-[10px] font-mono text-[#D4AF37]">Assistance sécurisée 24h/7</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Selector if no active ticket yet */}
        {!activeTicketId && (
          <div className="p-4 bg-zinc-950 border-b border-zinc-800 space-y-2">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase font-mono">Choisissez votre motif :</label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition cursor-pointer ${selectedCategory === cat ? "bg-[#D4AF37] text-black shadow-md" : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-950">
          {messages.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <MessageSquare className="w-10 h-10 text-[#D4AF37] mx-auto opacity-60 animate-pulse" />
              <p className="text-xs font-bold text-zinc-300 uppercase">Comment pouvons-nous vous aider ?</p>
              <p className="text-[10px] text-zinc-500 max-w-xs mx-auto">
                Posez votre question concernant <strong className="text-[#D4AF37]">{selectedCategory}</strong>. Un opérateur du Trône vous répondra instantanément.
              </p>
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.senderUid === currentUser?.uid;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${isMe ? "bg-[#D4AF37] text-black font-medium" : "bg-zinc-900 text-white border border-zinc-800"}`}>
                    {!isMe && <span className="text-[9px] font-mono text-[#D4AF37] block font-bold mb-0.5">{msg.senderName} (Support)</span>}
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {success && (
          <div className="px-4 py-2 bg-emerald-500/20 border-t border-emerald-500/40 text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" /> Message transmis au Support avec succès !
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2">
          <input
            type="text"
            required
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Écrivez votre message au support..."
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
      </div>
    </div>
  );
};
