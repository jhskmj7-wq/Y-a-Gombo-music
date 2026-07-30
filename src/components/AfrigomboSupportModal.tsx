import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, HelpCircle, ShieldCheck, MessageSquare, CheckCircle, Clock, Info } from "lucide-react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { SupportService, SUPPORT_PROFILE } from "../services/SupportService";

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
  const [selectedCategory, setSelectedCategory] = useState<"Wallet" | "Premium" | "Bug" | "Contrat" | "Signalement" | "Autre">("Autre");
  const [messageText, setMessageText] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const categories: Array<"Wallet" | "Premium" | "Bug" | "Contrat" | "Signalement" | "Autre"> = [
    "Wallet", "Premium", "Bug", "Contrat", "Signalement", "Autre"
  ];

  // Automatically find or create support conversation when open
  useEffect(() => {
    if (!isOpen || !currentUser?.uid) return;

    const initSupport = async () => {
      setLoading(true);
      try {
        await SupportService.getOrCreateSupportConversation(currentUser.uid, profile);
      } catch (err) {
        console.error("Error ensuring support conversation:", err);
      } finally {
        setLoading(false);
      }
    };

    initSupport();
  }, [isOpen, currentUser?.uid]);

  // Set initial text if provided
  useEffect(() => {
    if (initialReason) {
      setMessageText(initialReason);
    }
  }, [initialReason]);

  // Real-time synchronization of support messages
  useEffect(() => {
    if (!isOpen || !currentUser?.uid) return;

    const q = query(
      collection(db, "supportMessages"),
      where("conversationId", "==", currentUser.uid),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    }, (err) => {
      console.warn("Messages stream restricted:", err);
    });

    return () => unsubscribe();
  }, [isOpen, currentUser?.uid]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentUser?.uid || submitting) return;

    setSubmitting(true);
    try {
      const senderName = profile?.nomArtistique || profile?.name || currentUser.displayName || "Utilisateur";
      await SupportService.sendSupportMessage(
        currentUser.uid,
        currentUser.uid,
        senderName,
        messageText,
        selectedCategory
      );
      setMessageText("");
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[99999] animate-fadeIn">
      <div className="bg-[#0A0A0A] border border-[#D4AF37]/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col h-[80vh] max-h-[700px]">
        {/* Header - Official Support Profile Card */}
        <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={SUPPORT_PROFILE.photo}
                alt={SUPPORT_PROFILE.name}
                className="w-10 h-10 rounded-full object-cover border border-[#D4AF37]"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0A0A0A] rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-black text-white uppercase tracking-wider">{SUPPORT_PROFILE.name}</h2>
                <span className="px-1.5 py-0.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[8px] font-mono font-bold rounded-md">
                  {SUPPORT_PROFILE.badge}
                </span>
              </div>
              <p className="text-[10px] font-mono text-emerald-400">Support en ligne</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Selector */}
        <div className="p-3 bg-zinc-950 border-b border-zinc-800 space-y-1.5 shrink-0">
          <label className="block text-[9px] font-bold text-zinc-500 uppercase font-mono tracking-wider">
            Motif de votre message :
          </label>
          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer border ${
                  selectedCategory === cat 
                    ? "bg-[#D4AF37] text-black border-[#D4AF37] shadow-md" 
                    : "bg-zinc-900 text-zinc-400 hover:text-white border-zinc-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-950 flex flex-col min-h-0">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-2">
              <div className="w-6 h-6 animate-spin border-2 border-[#D4AF37] border-t-transparent rounded-full"></div>
              <p className="text-[10px] font-mono text-zinc-500">Connexion sécurisée...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Lancer la discussion</h3>
                <p className="text-[10px] text-zinc-500 max-w-xs mt-1.5 leading-relaxed">
                  Notre service client répond à vos questions en temps réel. Saisissez votre message ci-dessous.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isMe = msg.senderUid === currentUser?.uid;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"} animate-fadeIn`}>
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                        isMe 
                          ? "bg-[#D4AF37] text-black font-semibold rounded-tr-none shadow-md" 
                          : "bg-zinc-900 text-white border border-zinc-800 rounded-tl-none"
                      }`}
                    >
                      {!isMe && (
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-[9px] font-mono text-[#D4AF37] font-black uppercase">
                            {msg.senderName}
                          </span>
                          <span className="text-[7px] bg-[#D4AF37]/20 text-[#D4AF37] px-1 rounded font-mono font-bold uppercase">
                            ✔
                          </span>
                        </div>
                      )}
                      <p className="font-sans font-medium">{msg.text}</p>
                    </div>
                    <span className="text-[8px] font-mono text-zinc-600 mt-1 px-1">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Controls */}
        <form onSubmit={handleSend} className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2 shrink-0">
          <input
            type="text"
            required
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Décrivez votre problème ici..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[#D4AF37] focus:outline-none placeholder:text-zinc-500"
            disabled={submitting || loading}
          />
          <button
            type="submit"
            disabled={submitting || loading || !messageText.trim()}
            className="p-3 bg-[#D4AF37] hover:bg-amber-400 text-black rounded-xl transition cursor-pointer flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed shadow-md"
          >
            <Send className="w-5 h-5 stroke-[2.5]" />
          </button>
        </form>
      </div>
    </div>
  );
};
