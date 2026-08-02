import React, { useState } from "react";
import { Settings, Radio, Bell, Lock } from "lucide-react";

interface SettingsTabProps {
  currentUser: any;
}

export default function SettingsTab({ currentUser }: SettingsTabProps) {
  const [enableAutoReply, setEnableAutoReply] = useState(() => {
    if (!currentUser?.uid) return false;
    return localStorage.getItem(`enable_auto_reply_${currentUser.uid}`) === "true";
  });
  const [autoReplyMessage, setAutoReplyMessage] = useState(() => {
    if (!currentUser?.uid) return "";
    return localStorage.getItem(`auto_reply_${currentUser.uid}`) || "";
  });
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyGombos, setNotifyGombos] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [onlineVisibility, setOnlineVisibility] = useState<"all" | "contacts" | "hidden">("all");

  return (
    <div className="space-y-4 pb-24">
      <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl">
        <h3 className="text-xs font-bold text-afri-text uppercase tracking-wider flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#D4AF37]" />
          Réglages de la Messagerie
        </h3>
        <p className="text-xs text-afri-text-sec mt-1">
          Auto-répondeur d'absence, notifications et règles de confidentialité.
        </p>
      </div>

      {/* Offline Auto-Reply Form */}
      <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-afri-text uppercase tracking-wide flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#D4AF37]" />
            Réponse Automatique d'Absence
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enableAutoReply}
              onChange={(e) => {
                const enabled = e.target.checked;
                setEnableAutoReply(enabled);
                if (currentUser?.uid) {
                  localStorage.setItem(`enable_auto_reply_${currentUser.uid}`, enabled ? "true" : "false");
                }
              }}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-afri-bg-ter peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D4AF37]" />
          </label>
        </div>

        <p className="text-[11px] text-afri-text-sec leading-relaxed">
          Envoyé automatiquement aux contacts qui vous écrivent lorsque vous êtes indisponible.
        </p>

        <textarea
          value={autoReplyMessage}
          onChange={(e) => {
            const val = e.target.value;
            setAutoReplyMessage(val);
            if (currentUser?.uid) {
              localStorage.setItem(`auto_reply_${currentUser.uid}`, val);
            }
          }}
          placeholder="Exemple: Bonjour, je suis actuellement en prestation Gombo. Je vous recontacte dès la fin !"
          rows={3}
          className="w-full p-3 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text focus:outline-none focus:border-[#D4AF37] placeholder:text-afri-text-muted resize-none"
        />
      </div>

      {/* Notification Toggles */}
      <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-3">
        <h4 className="text-xs font-bold text-afri-text uppercase tracking-wide flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#D4AF37]" />
          Préférences de Notification
        </h4>
        <div className="space-y-2.5">
          <label className="flex items-center justify-between text-xs text-afri-text-sec cursor-pointer">
            <span>Notifier lors de la réception d'un message</span>
            <input
              type="checkbox"
              checked={notifyMessages}
              onChange={(e) => setNotifyMessages(e.target.checked)}
              className="rounded border-afri-border bg-afri-bg text-[#D4AF37] focus:ring-[#D4AF37]"
            />
          </label>

          <label className="flex items-center justify-between text-xs text-afri-text-sec cursor-pointer">
            <span>Alertes instantanées sur offres de Gombo</span>
            <input
              type="checkbox"
              checked={notifyGombos}
              onChange={(e) => setNotifyGombos(e.target.checked)}
              className="rounded border-afri-border bg-afri-bg text-[#D4AF37] focus:ring-[#D4AF37]"
            />
          </label>

          <label className="flex items-center justify-between text-xs text-afri-text-sec cursor-pointer">
            <span>Effets sonores et vibrations</span>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="rounded border-afri-border bg-afri-bg text-[#D4AF37] focus:ring-[#D4AF37]"
            />
          </label>
        </div>
      </div>

      {/* Privacy & Security Settings */}
      <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-3">
        <h4 className="text-xs font-bold text-afri-text uppercase tracking-wide flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#D4AF37]" />
          Confidentialité & Statut en Ligne
        </h4>
        <div className="space-y-2">
          <p className="text-[11px] text-afri-text-sec">
            Qui peut voir votre statut "En ligne" ?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "all", label: "Tout le monde" },
              { id: "contacts", label: "Contacts" },
              { id: "hidden", label: "Masqué" }
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setOnlineVisibility(opt.id as any)}
                className={`py-2 px-2 text-[10px] font-bold uppercase rounded-xl border transition cursor-pointer ${
                  onlineVisibility === opt.id
                    ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]"
                    : "bg-afri-bg border-afri-border text-afri-text-sec hover:text-afri-text"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
