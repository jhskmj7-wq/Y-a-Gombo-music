import React, { useState } from "react";
import { Megaphone, Send, Bell, Trash2, ShieldCheck } from "lucide-react";

interface AdminNotificationsProps {
  onBroadcast?: (message: string) => void;
  notificationsList?: any[];
  onDeleteNotification?: (id: string) => void;
  audioSynth?: any;
}

export default function AdminNotifications({
  onBroadcast,
  notificationsList = [],
  onDeleteNotification,
  audioSynth
}: AdminNotificationsProps) {
  const [msg, setMsg] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim()) return;

    setIsSending(true);
    setTimeout(() => {
      if (onBroadcast) {
        onBroadcast(msg.trim());
      }
      setIsSending(false);
      setMsg("");
      setSuccess(true);
      try {
        if (audioSynth && typeof audioSynth.playKoraSuccess === "function") {
          audioSynth.playKoraSuccess();
        }
      } catch (err) {}
      setTimeout(() => setSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="space-y-6 text-left pb-24 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-white/5 pb-4">
        <h3 className="text-xs font-mono uppercase font-black tracking-[0.15em] text-[#D4AF37] flex items-center gap-1.5">
          <Megaphone className="w-4 h-4" />
          Mégaphone d'Annonce Globale
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          Diffusez des notifications prioritaires en temps réel à tous les artistes de l'écosystème.
        </p>
      </div>

      {/* Broadcast Form */}
      <div className="p-6 bg-[#070707] border border-zinc-900 rounded-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-[#D4AF37]/5 blur-3xl rounded-full" />

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block font-bold">
            Message de notification prioritaire (FR/ENG)
          </label>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Ex: Répétitions collectives autorisées au grand amphithéâtre de Cocody ce samedi dès 14h..."
            rows={4}
            className="w-full bg-black border border-[#D4AF37]/20 rounded-xl p-4 text-xs font-sans text-white focus:outline-none focus:border-[#D4AF37] placeholder-zinc-600 resize-none transition-all"
            maxLength={300}
          />

          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-zinc-500">
              {msg.length} / 300 caractères
            </span>

            <button
              type="submit"
              disabled={!msg.trim() || isSending}
              className="px-5 py-2.5 rounded-xl bg-[#D4AF37] disabled:bg-zinc-800 text-black font-black text-xs uppercase flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {isSending ? "Envoi en cours..." : "Diffuser l'annonce"}
            </button>
          </div>
        </form>

        {success && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
            <ShieldCheck className="w-4 h-4" />
            <span>Annonce diffusée avec succès sur tous les terminaux AFRIGOMBO.</span>
          </div>
        )}
      </div>

      {/* History of broadcasts */}
      <div className="space-y-4">
        <h4 className="text-xs font-mono uppercase font-black tracking-wider text-[#D4AF37] flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5" />
          Historique des Notifications Globales
        </h4>

        <div className="space-y-3">
          {notificationsList.length === 0 ? (
            <div className="p-8 text-center bg-black/40 border border-zinc-900 rounded-2xl text-zinc-500 text-xs font-mono">
              Aucune annonce globale n'a été diffusée récemment.
            </div>
          ) : (
            notificationsList.map((notif) => (
              <div
                key={notif.id}
                className="p-4 bg-gradient-to-r from-zinc-950 to-black border border-zinc-900 rounded-xl flex justify-between items-center gap-4 hover:border-zinc-800 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-white leading-relaxed font-sans font-medium">{notif.text || notif.message}</p>
                    <span className="text-[9px] font-mono text-zinc-500 block mt-1">
                      {notif.timestamp ? new Date(notif.timestamp).toLocaleString("fr-FR") : "Date inconnue"}
                    </span>
                  </div>
                </div>

                {onDeleteNotification && (
                  <button
                    onClick={() => onDeleteNotification(notif.id)}
                    className="w-8 h-8 rounded-lg bg-zinc-900/50 hover:bg-red-950/30 border border-zinc-800 hover:border-red-900/30 text-zinc-500 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
