import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  MessageSquare, PhoneCall, Video, ShieldAlert, Users, Clock, Trash2, Ban,
  CheckCircle, AlertTriangle, Search, Lock, Unlock, Eye, BarChart3, RefreshCw, Send, Radio
} from "lucide-react";
import { db } from "../../lib/firebase";
import {
  collection, onSnapshot, query, where, orderBy, doc, updateDoc, deleteDoc, getDocs
} from "firebase/firestore";
import { blockUser, unblockUser } from "../../lib/chatModerationEngine";

export function AdminCommunicationCenter() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [bypassLogs, setBypassLogs] = useState<any[]>([]);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [presenceList, setPresenceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"convos" | "reports" | "bypass" | "calls">("convos");

  useEffect(() => {
    // 1. Listen to all conversations
    const unsubConvos = onSnapshot(collection(db, "conversations"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setConversations(list);
      setLoading(false);
    });

    // 2. Listen to reports
    const unsubReports = onSnapshot(collection(db, "reports"), (snap) => {
      setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // 3. Listen to bypass attempts
    const unsubBypass = onSnapshot(collection(db, "bypassAttempts"), (snap) => {
      setBypassLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // 4. Listen to call logs
    const unsubCalls = onSnapshot(collection(db, "callLogs"), (snap) => {
      setCallLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // 5. Listen to online users
    const unsubPresence = onSnapshot(collection(db, "presence"), (snap) => {
      const online = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p: any) => p.status === "online");
      setPresenceList(online);
    });

    return () => {
      unsubConvos();
      unsubReports();
      unsubBypass();
      unsubCalls();
      unsubPresence();
    };
  }, []);

  const handleDeleteConvo = async (convoId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette conversation définitivement ?")) return;
    try {
      await deleteDoc(doc(db, "conversations", convoId));
    } catch (e) {
      alert("Erreur suppression conversation: " + e);
    }
  };

  const handleToggleSuspend = async (convoId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "conversations", convoId), {
        isSuspended: !currentStatus
      });
    } catch (e) {
      alert("Erreur modification statut: " + e);
    }
  };

  const filteredConvos = conversations.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const pNames = Object.values(c.participantNames || {}).join(" ").toLowerCase();
    const lastMsg = (c.lastMessage || "").toLowerCase();
    return pNames.includes(q) || lastMsg.includes(q);
  });

  const totalCallsToday = callLogs.length;
  const audioCallsCount = callLogs.filter((c) => c.type === "audio").length;
  const videoCallsCount = callLogs.filter((c) => c.type === "video").length;

  return (
    <div className="space-y-6 select-none">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-950 border border-[#D4AF37]/30 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
              <MessageSquare className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-[#D4AF37] uppercase tracking-wider">
              Centre Communication Souverain
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Supervision temps réel des conversations, appels WebRTC, modération et sécurité.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            {presenceList.length} En Ligne
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
          <span className="text-[10px] font-mono text-zinc-400 uppercase block">Conversations Actives</span>
          <strong className="text-xl font-black text-[#D4AF37] leading-tight mt-1 block">
            {conversations.length}
          </strong>
        </div>

        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
          <span className="text-[10px] font-mono text-zinc-400 uppercase block">Appels WebRTC (Aujourd'hui)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="text-xl font-black text-emerald-400">{totalCallsToday}</strong>
            <span className="text-[10px] text-zinc-400">({audioCallsCount}📞 / {videoCallsCount}🎥)</span>
          </div>
        </div>

        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
          <span className="text-[10px] font-mono text-zinc-400 uppercase block">Tentatives Numéros Bloquées</span>
          <strong className="text-xl font-black text-rose-400 leading-tight mt-1 block">
            {bypassLogs.length}
          </strong>
        </div>

        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
          <span className="text-[10px] font-mono text-zinc-400 uppercase block">Signalements Abus</span>
          <strong className="text-xl font-black text-amber-400 leading-tight mt-1 block">
            {reports.length}
          </strong>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex gap-2 border-b border-zinc-800 pb-3 overflow-x-auto">
        {[
          { id: "convos", label: `Conversations (${conversations.length})`, icon: MessageSquare },
          { id: "reports", label: `Signalements (${reports.length})`, icon: ShieldAlert },
          { id: "bypass", label: `Numéros Bloqués (${bypassLogs.length})`, icon: Ban },
          { id: "calls", label: `Historique Appels (${callLogs.length})`, icon: PhoneCall }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === tab.id
                ? "bg-[#D4AF37] text-black shadow-lg shadow-amber-500/10"
                : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* SUBTAB CONTENT */}
      {activeSubTab === "convos" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un membre ou un message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-900">
            {filteredConvos.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">Aucune conversation trouvée.</div>
            ) : (
              filteredConvos.map((c) => {
                const names = Object.values(c.participantNames || {}).join(" & ") || "Participants";
                return (
                  <div key={c.id} className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-900/50 transition-colors">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-white font-bold">{names}</strong>
                        {c.isSuspended && (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[9px] font-mono font-bold">
                            SUSPENDUE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">{c.lastMessage || "Aucun message"}</p>
                      <span className="text-[9px] font-mono text-zinc-500 block">
                        {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString("fr-FR") : ""}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleSuspend(c.id, c.isSuspended)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          c.isSuspended
                            ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                        }`}
                        title={c.isSuspended ? "Rétablir la conversation" : "Suspendre la conversation"}
                      >
                        {c.isSuspended ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleDeleteConvo(c.id)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer"
                        title="Supprimer la conversation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeSubTab === "reports" && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl text-center text-xs text-zinc-500">
              Aucun signalement d'abus enregistré.
            </div>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="p-4 bg-zinc-900 border border-amber-500/30 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-amber-400">Signalé par: {r.reporterName}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{r.createdAt}</span>
                </div>
                <p className="text-xs text-white">Utilisateur incriminé: <strong>{r.targetName}</strong></p>
                <div className="p-2 bg-zinc-950 rounded-xl text-xs text-zinc-300 font-mono">
                  Raison: {r.reason} {r.details ? `— ${r.details}` : ""}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeSubTab === "bypass" && (
        <div className="space-y-3">
          {bypassLogs.length === 0 ? (
            <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl text-center text-xs text-zinc-500">
              Aucune tentative de contournement par téléphone ou liens externes.
            </div>
          ) : (
            bypassLogs.map((b) => (
              <div key={b.id} className="p-4 bg-zinc-900 border border-rose-500/30 rounded-2xl space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-rose-400">{b.userName}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{b.timestamp}</span>
                </div>
                <p className="text-xs text-zinc-300">Contenu censuré: <code className="text-rose-300 bg-rose-950/40 px-1 py-0.5 rounded">{b.content}</code></p>
              </div>
            ))
          )}
        </div>
      )}

      {activeSubTab === "calls" && (
        <div className="space-y-3">
          {callLogs.length === 0 ? (
            <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl text-center text-xs text-zinc-500">
              Aucun appel passé récemment.
            </div>
          ) : (
            callLogs.map((call) => (
              <div key={call.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-zinc-800 text-emerald-400">
                    {call.type === "video" ? <Video className="w-4 h-4" /> : <PhoneCall className="w-4 h-4" />}
                  </span>
                  <div>
                    <strong className="text-white block">{call.callerName} → {call.receiverName}</strong>
                    <span className="text-[10px] text-zinc-500 font-mono">{call.createdAt}</span>
                  </div>
                </div>
                <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] uppercase">
                  {call.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
