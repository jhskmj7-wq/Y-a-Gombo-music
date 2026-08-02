import React, { useState } from "react";
import { MessageSquare, ShieldCheck, Search, Plus, Sparkles, Phone } from "lucide-react";

interface DiscussionTabProps {
  conversations: any[];
  loadingConvos: boolean;
  supportConvo: any;
  currentUser: any;
  onSelectConversation: (convo: any) => void;
  onOpenSupport: () => void;
  onStartNewChat: () => void;
}

export default function DiscussionTab({
  conversations,
  loadingConvos,
  supportConvo,
  currentUser,
  onSelectConversation,
  onOpenSupport,
  onStartNewChat
}: DiscussionTabProps) {
  const [filterQuery, setFilterQuery] = useState("");

  const filteredConvos = conversations.filter(c => {
    const name = c.userName || c.recipientName || "Conversation";
    return name.toLowerCase().includes(filterQuery.toLowerCase());
  });

  return (
    <div className="space-y-3 pb-24">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-afri-text-muted" />
        <input
          type="text"
          placeholder="Rechercher une discussion ou un partenaire..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-afri-bg-sec border border-afri-border rounded-2xl text-xs text-afri-text focus:outline-none focus:border-[#D4AF37] placeholder:text-afri-text-muted transition shadow-sm"
        />
      </div>

      {/* Official Support Pinned Card */}
      <div
        onClick={onOpenSupport}
        className="p-4 bg-gradient-to-r from-[#1C180E] to-[#11100C] border border-[#D4AF37]/40 rounded-2xl flex items-center justify-between cursor-pointer hover:border-[#D4AF37] transition shadow-md group"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] overflow-hidden shrink-0">
              <img src="/logo.png" alt="Support" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#12100A] rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-black uppercase text-afri-text tracking-wide group-hover:text-[#D4AF37] transition">
                Support Officiel AFRIGOMBO
              </h3>
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            </div>
            <p className="text-[11px] text-afri-text-sec truncate mt-0.5">
              {supportConvo?.lastMessage || "Équipe 24/7 à votre disposition pour vos paiements & séquestre."}
            </p>
          </div>
        </div>

        {supportConvo?.unreadCount?.[currentUser?.uid] > 0 && (
          <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full animate-bounce shrink-0">
            {supportConvo.unreadCount[currentUser.uid]}
          </span>
        )}
      </div>

      {/* Conversations List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold text-afri-text-muted uppercase tracking-wider">
            Discussions Récentes ({conversations.length})
          </span>
          <button
            onClick={onStartNewChat}
            className="text-[11px] font-bold text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouvelle discussion
          </button>
        </div>

        {loadingConvos ? (
          <div className="text-center py-12 text-xs text-afri-text-sec">
            Chargement des discussions...
          </div>
        ) : filteredConvos.length === 0 ? (
          <div className="p-8 bg-afri-bg-sec border border-afri-border rounded-2xl text-center space-y-3">
            <MessageSquare className="w-8 h-8 text-afri-text-muted mx-auto opacity-50" />
            <div>
              <p className="text-xs font-bold text-afri-text">Aucune discussion active</p>
              <p className="text-[11px] text-afri-text-sec mt-1">
                Contactez un prestataire ou ouvrez le support pour commencer.
              </p>
            </div>
            <button
              onClick={onStartNewChat}
              className="px-4 py-2 bg-[#D4AF37] text-black text-xs font-bold rounded-xl cursor-pointer hover:bg-amber-400 transition"
            >
              Démarrer un échange
            </button>
          </div>
        ) : (
          filteredConvos.map((convo) => {
            const partnerName = convo.userName || convo.recipientName || "Partenaire Gombo";
            const partnerPhoto = convo.userPhoto || convo.recipientPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${convo.id}`;
            const unread = convo.unreadCount?.[currentUser?.uid] || 0;

            return (
              <div
                key={convo.id}
                onClick={() => onSelectConversation(convo)}
                className="p-3.5 bg-afri-bg-sec border border-afri-border rounded-2xl flex items-center justify-between cursor-pointer hover:border-[#D4AF37]/60 transition shadow-sm group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={partnerPhoto}
                      alt={partnerName}
                      className="w-11 h-11 rounded-2xl object-cover border border-afri-border"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-afri-bg-sec rounded-full" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-afri-text truncate group-hover:text-[#D4AF37] transition">
                      {partnerName}
                    </h4>
                    <p className="text-[11px] text-afri-text-sec truncate mt-0.5">
                      {convo.lastMessage || "Appuyez pour ouvrir la conversation"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[9px] font-mono text-afri-text-muted">
                    {convo.updatedAt ? new Date(convo.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                  </span>
                  {unread > 0 && (
                    <span className="px-2 py-0.5 bg-[#D4AF37] text-black text-[10px] font-black rounded-full">
                      {unread}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
