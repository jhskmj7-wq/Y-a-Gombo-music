import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Radio } from "lucide-react";
import { db } from "../../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

interface ImperialMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export function ImperialMessageModal({ isOpen, onClose, title }: ImperialMessageModalProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || !db) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "global_notifications"), {
        titre: "Message de l'Empire",
        description: message,
        type: "Système",
        priority: "Urgente",
        target: "Tous les utilisateurs",
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setMessage("");
        onClose();
      }, 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-afri-bg/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-afri-bg w-full max-w-md rounded-2xl border border-[#D4AF37]/50 shadow-[0_0_40px_rgba(212,175,55,0.15)] overflow-hidden"
        >
          <div className="flex justify-between items-center p-4 border-b border-[#D4AF37]/20 bg-afri-bg-sec/10">
            <h3 className="text-sm font-display font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4" />
              {title}
            </h3>
            <button onClick={onClose} className="p-1 text-afri-text-sec hover:text-afri-text transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-5 space-y-4">
            {success ? (
              <div className="text-center py-8 text-emerald-400 font-mono text-sm">
                Message Impérial diffusé avec succès !
              </div>
            ) : (
              <>
                <div>
                  <label className="text-[10px] uppercase font-mono text-afri-text-sec mb-2 block">
                    Contenu du message (Pop-up Global)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Saisissez le message à diffuser..."
                    className="w-full bg-afri-bg-sec/5 border border-[#D4AF37]/20 rounded-xl p-3 text-sm text-afri-text focus:outline-none focus:border-[#D4AF37] min-h-[120px] resize-none"
                  />
                </div>
                
                <button
                  onClick={handleSend}
                  disabled={loading || !message.trim()}
                  className="w-full py-3 bg-[#D4AF37] text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-[#D4AF37]/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span className="animate-pulse">Transmission...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Diffuser à l'Empire
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
