import React from "react";
import { PhoneCall, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed } from "lucide-react";

interface CallsTabProps {
  callLogs: any[];
  onStartAudioCall: (partnerUid: string) => void;
  onStartVideoCall: (partnerUid: string) => void;
}

export default function CallsTab({
  callLogs,
  onStartAudioCall,
  onStartVideoCall
}: CallsTabProps) {
  return (
    <div className="space-y-4 pb-24">
      <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-2">
        <h3 className="text-xs font-bold text-afri-text uppercase tracking-wider flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-[#D4AF37]" />
          Appels Audio & Vidéo Sécurisés
        </h3>
        <p className="text-xs text-afri-text-sec leading-relaxed">
          Passez des appels chiffrés de bout en bout avec vos contacts et prestataires Gombo. Aucune écoute externe.
        </p>
      </div>

      <div className="space-y-2">
        <span className="text-[10px] font-bold text-afri-text-muted uppercase tracking-wider px-1">
          Historique des Appels ({callLogs.length})
        </span>

        {callLogs.length === 0 ? (
          <div className="p-8 bg-afri-bg-sec border border-afri-border rounded-2xl text-center space-y-3">
            <PhoneCall className="w-8 h-8 text-afri-text-muted mx-auto opacity-50" />
            <div>
              <p className="text-xs font-bold text-afri-text">Aucun appel récent</p>
              <p className="text-[11px] text-afri-text-sec mt-1">
                Vos appels audio et vidéo s'afficheront ici.
              </p>
            </div>
          </div>
        ) : (
          callLogs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 bg-afri-bg-sec border border-afri-border rounded-2xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-afri-bg border border-afri-border flex items-center justify-center text-[#D4AF37]">
                  {log.type === "video" ? <Video className="w-4 h-4" /> : <PhoneCall className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-afri-text">
                    {log.partnerName || "Correspondant Gombo"}
                  </h4>
                  <p className="text-[10px] text-afri-text-sec flex items-center gap-1 mt-0.5">
                    {log.direction === "incoming" ? <PhoneIncoming className="w-3 h-3 text-emerald-400" /> : <PhoneOutgoing className="w-3 h-3 text-[#D4AF37]" />}
                    <span>{log.createdAt ? new Date(log.createdAt).toLocaleString() : "Récemment"}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onStartAudioCall(log.partnerUid)}
                  className="p-2 bg-afri-bg border border-afri-border rounded-xl text-[#D4AF37] hover:border-[#D4AF37] transition cursor-pointer"
                  title="Rappeler en Audio"
                >
                  <PhoneCall className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onStartVideoCall(log.partnerUid)}
                  className="p-2 bg-afri-bg border border-afri-border rounded-xl text-[#D4AF37] hover:border-[#D4AF37] transition cursor-pointer"
                  title="Rappeler en Vidéo"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
