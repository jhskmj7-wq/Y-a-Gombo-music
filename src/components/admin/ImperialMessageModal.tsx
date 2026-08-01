import React, { useState } from "react";
import { Send, Radio, X } from "lucide-react";
import { db } from "../../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { AndroidBottomSheet } from "../common/AfriModal";

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
    <AndroidBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title || "COMMUNIQUÉ IMPÉRIAL"}
      subtitle="Diffusion Générale à tous les Citoyens"
    >
      <div className="space-y-4 font-sans text-left py-1">
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
      </div>
    </AndroidBottomSheet>
  );
}
