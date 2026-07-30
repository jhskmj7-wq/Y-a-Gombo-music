import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, Send, ArrowLeft, Image as ImageIcon, Mic, 
  CheckCheck, Volume2, ShieldAlert, BadgeCheck, AlertCircle, Loader2,
  Search, Trash2, Copy, CornerUpLeft, X, Lock, Sparkles, Check,
  CreditCard, ShieldCheck, Trophy, Target, PhoneCall, Video, MapPin,
  Route, FileText, Bell, Radio, Ban, FileUp, MoreVertical, Play, Pause, Navigation
} from "lucide-react";
import { gomboDB, db } from "../firebase";
import { collection, query, where, onSnapshot, doc, getDocs, addDoc } from "firebase/firestore";
import { Conversation, Message, UserProfile } from "../types";
import { WebRTCCallService, CallSession } from "../lib/webrtcCallEngine";
import { setUserPresence, listenUserPresence, setTypingState, listenPartnerTyping, UserPresence } from "../lib/presenceEngine";
import { sanitizeMessageContent, logBypassAttempt } from "../lib/chatModerationEngine";
import { WebRTCCallModal } from "./WebRTCCallModal";
import GomboItineraryModal from "./GomboItineraryModal";
import { ChatModerationModal } from "./ChatModerationModal";

interface MessagesViewProps {
  currentUser: any;
  currentProfile: any;
  openConvoWithUserId: string | null;
  setOpenConvoWithUserId: (uid: string | null) => void;
  openConvoWithGomboId?: string | null;
  setOpenConvoWithGomboId?: (gid: string | null) => void;
  onNavigateToPublish?: () => void;
  onNavigateToSearch?: () => void;
  onBack: () => void;
}

export default function MessagesView({
  currentUser,
  currentProfile,
  openConvoWithUserId,
  setOpenConvoWithUserId,
  openConvoWithGomboId,
  setOpenConvoWithGomboId,
  onNavigateToPublish,
  onNavigateToSearch,
  onBack
}: MessagesViewProps) {
  // 1. Navigation Tabs
  const [activeTab, setActiveTab] = useState<"conversations" | "contrats" | "appels" | "notifications">("conversations");

  // 2. Core Messaging State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [convoSearchQuery, setConvoSearchQuery] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);

  // 3. User Presence & Typing
  const [partnerPresence, setPartnerPresence] = useState<UserPresence | null>(null);
  const [partnerTyping, setPartnerTyping] = useState<{ isTyping: boolean; isRecording: boolean } | null>(null);

  // 4. Partner Extended Info
  const [partnerProfile, setPartnerProfile] = useState<UserProfile | null>(null);

  // 5. WebRTC Call State
  const [activeCallSession, setActiveCallSession] = useState<CallSession | null>(null);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const callServiceRef = useRef<WebRTCCallService | null>(null);
  const [callLogs, setCallLogs] = useState<any[]>([]);

  // 6. Modals & Widgets
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [showModerationModal, setShowModerationModal] = useState(false);

  // 7. WhatsApp-style Voice Recording State
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceRecordDuration, setVoiceRecordDuration] = useState(0);
  const [slideCancelX, setSlideCancelX] = useState(0);
  const voiceTimerRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const touchStartXRef = useRef<number>(0);

  // 8. Message Copy / Reply / Delete
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [deletedMsgIds, setDeletedMsgIds] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Set user presence online on mount
  useEffect(() => {
    if (currentUser?.uid) {
      setUserPresence(currentUser.uid, "online");
    }
  }, [currentUser?.uid]);

  // Listen to user's incoming calls
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubCalls = WebRTCCallService.listenIncomingCalls(currentUser.uid, (call) => {
      setActiveCallSession(call);
      setIsIncomingCall(true);
    });
    return () => unsubCalls();
  }, [currentUser?.uid]);

  // Listen to conversations
  useEffect(() => {
    if (!currentUser?.uid) return;
    setLoadingConvos(true);

    const unsub = gomboDB.listenConversations(currentUser.uid, (convos) => {
      setConversations(convos);
      setLoadingConvos(false);

      if (openConvoWithUserId) {
        const existing = convos.find(c => c.participants.includes(openConvoWithUserId));
        if (existing) {
          setActiveConvo(existing);
        }
      }
    });

    return () => unsub();
  }, [currentUser?.uid, openConvoWithUserId]);

  // Listen to messages of active conversation
  useEffect(() => {
    if (!activeConvo) {
      setMessages([]);
      return;
    }

    const unsub = gomboDB.listenMessages(activeConvo.id, (msgs) => {
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return () => unsub();
  }, [activeConvo?.id]);

  // Listen to partner presence and typing
  useEffect(() => {
    if (!activeConvo || !currentUser?.uid) {
      setPartnerPresence(null);
      setPartnerTyping(null);
      return;
    }

    const partnerUid = activeConvo.participants.find(p => p !== currentUser.uid);
    if (!partnerUid) return;

    // Presence
    const unsubPresence = listenUserPresence(partnerUid, (pres) => {
      setPartnerPresence(pres);
    });

    // Typing
    const unsubTyping = listenPartnerTyping(activeConvo.id, partnerUid, (state) => {
      setPartnerTyping(state);
    });

    return () => {
      unsubPresence();
      unsubTyping();
    };
  }, [activeConvo?.id, currentUser?.uid]);

  // Listen to call logs for the "Appels" tab
  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(
      collection(db, "callLogs"),
      where("callerUid", "==", currentUser.uid)
    );
    const unsubCallLogs = onSnapshot(q, (snap) => {
      setCallLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubCallLogs();
  }, [currentUser?.uid]);

  // Handle typing input updates
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (activeConvo && currentUser?.uid) {
      const senderName = currentProfile?.firstName || "Moi";
      setTypingState(activeConvo.id, currentUser.uid, senderName, val.length > 0, false);
    }
  };

  // Send Text Message with Anti-Bypass Sanitization
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConvo || isSending) return;

    const rawText = inputText.trim();
    // 1. Sanitize text for phone numbers & external wa.me/t.me links
    const sanitizeResult = sanitizeMessageContent(rawText);

    if (sanitizeResult.hasViolation) {
      const senderName = currentProfile?.firstName ? `${currentProfile.firstName} ${currentProfile.lastName}` : "Moi";
      await logBypassAttempt({
        userId: currentUser.uid,
        userName: senderName,
        convoId: activeConvo.id,
        content: rawText,
        type: sanitizeResult.violationType || "num_hors_plateforme"
      });
    }

    let finalPayloadText = sanitizeResult.text;

    if (replyingTo) {
      const replySender = replyingTo.senderId === currentUser.uid ? "Moi" : "Partenaire";
      const cleanedReplyText = replyingTo.text.replace(/↳ En réponse à[\s\S]*?\n\n/, "");
      finalPayloadText = `↳ En réponse à ${replySender}: "${cleanedReplyText.slice(0, 60)}${cleanedReplyText.length > 60 ? "..." : ""}"\n\n${sanitizeResult.text}`;
    }

    setInputText("");
    setReplyingTo(null);
    setSecurityError(null);
    setIsSending(true);

    if (currentUser?.uid) {
      setTypingState(activeConvo.id, currentUser.uid, currentProfile?.firstName || "Moi", false, false);
    }

    try {
      const senderName = currentProfile?.firstName ? `${currentProfile.firstName} ${currentProfile.lastName}` : "Moi";
      await gomboDB.sendMessage(
        activeConvo.id,
        currentUser.uid,
        senderName,
        finalPayloadText,
        "text"
      );
    } catch (err: any) {
      console.error("Failed to send message:", err);
      if (err.message && err.message.includes("AFRIGOMBO")) {
        setSecurityError(err.message);
      }
    } finally {
      setIsSending(false);
    }
  };

  // Voice Recording (WhatsApp style)
  const startVoiceRecording = async (e: React.TouchEvent | React.MouseEvent) => {
    if (!activeConvo || isVoiceRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      if ("touches" in e) {
        touchStartXRef.current = e.touches[0].clientX;
      } else {
        touchStartXRef.current = e.clientX;
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      setIsVoiceRecording(true);
      setVoiceRecordDuration(0);
      setSlideCancelX(0);

      if (currentUser?.uid) {
        setTypingState(activeConvo.id, currentUser.uid, currentProfile?.firstName || "Moi", false, true);
      }

      voiceTimerRef.current = setInterval(() => {
        setVoiceRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Microphone incalculable ou refusé.");
    }
  };

  const handleVoiceTouchMove = (e: React.TouchEvent) => {
    if (!isVoiceRecording) return;
    const currentX = e.touches[0].clientX;
    const diff = touchStartXRef.current - currentX;
    if (diff > 0) setSlideCancelX(diff);
  };

  const stopVoiceRecording = async (cancel: boolean = false) => {
    if (!isVoiceRecording) return;
    clearInterval(voiceTimerRef.current);
    setIsVoiceRecording(false);

    if (currentUser?.uid && activeConvo) {
      setTypingState(activeConvo.id, currentUser.uid, currentProfile?.firstName || "Moi", false, false);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }

    if (cancel || slideCancelX > 100) {
      setSlideCancelX(0);
      setVoiceRecordDuration(0);
      return;
    }

    setIsSending(true);
    setTimeout(() => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        if (activeConvo && currentUser?.uid) {
          const senderName = currentProfile?.firstName ? `${currentProfile.firstName} ${currentProfile.lastName}` : "Moi";
          await gomboDB.sendMessage(
            activeConvo.id,
            currentUser.uid,
            senderName,
            "🎙️ Message vocal",
            "audio",
            base64Audio
          );
        }
        setIsSending(false);
      };
      reader.readAsDataURL(audioBlob);
    }, 300);
  };

  // Location Sharing
  const handleShareLocation = () => {
    if (!activeConvo || !currentUser?.uid) return;
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const senderName = currentProfile?.firstName ? `${currentProfile.firstName} ${currentProfile.lastName}` : "Moi";
          await gomboDB.sendMessage(
            activeConvo.id,
            currentUser.uid,
            senderName,
            `📍 Position GPS partagée (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`,
            "location",
            JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          );
        },
        () => alert("Géolocalisation refusée ou indisponible.")
      );
    }
  };

  // Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && activeConvo && currentUser?.uid) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const senderName = currentProfile?.firstName ? `${currentProfile.firstName} ${currentProfile.lastName}` : "Moi";
        await gomboDB.sendMessage(
          activeConvo.id,
          currentUser.uid,
          senderName,
          "📷 Photo jointe",
          "image",
          base64
        );
      };
      reader.readAsDataURL(file);
    }
  };

  // WebRTC Call Handlers
  const handleStartCall = async (type: "audio" | "video") => {
    if (!activeConvo || !currentUser?.uid) return;
    const partnerUid = activeConvo.participants.find(p => p !== currentUser.uid);
    if (!partnerUid) return;

    callServiceRef.current = new WebRTCCallService();
    setIsIncomingCall(false);

    const callId = await callServiceRef.current.initiateCall(
      {
        callerUid: currentUser.uid,
        callerName: currentProfile?.firstName || "Moi",
        callerPhoto: currentProfile?.avatarUrl || "",
        receiverUid: partnerUid,
        receiverName: activeConvo.participantDetails?.[partnerUid]?.name || "Partenaire",
        receiverPhoto: activeConvo.participantDetails?.[partnerUid]?.avatarUrl || "",
        type
      },
      {
        onLocalStream: (s) => setLocalStream(s),
        onRemoteStream: (s) => setRemoteStream(s),
        onStatusChange: (status) => {
          setActiveCallSession((prev) => (prev ? { ...prev, status: status as any } : null));
        },
        onError: (err) => alert("Erreur d'appel WebRTC: " + err)
      }
    );

    setActiveCallSession({
      id: callId,
      callerUid: currentUser.uid,
      callerName: currentProfile?.firstName || "Moi",
      receiverUid: partnerUid,
      receiverName: activeConvo.participantDetails?.[partnerUid]?.name || "Partenaire",
      type,
      status: "offered",
      createdAt: new Date().toISOString()
    });
  };

  const handleAnswerCall = async () => {
    if (!activeCallSession?.id) return;
    callServiceRef.current = new WebRTCCallService();
    await callServiceRef.current.answerCall(activeCallSession.id, {
      onLocalStream: (s) => setLocalStream(s),
      onRemoteStream: (s) => setRemoteStream(s),
      onStatusChange: (status) => {
        setActiveCallSession((prev) => (prev ? { ...prev, status: status as any } : null));
      }
    });
  };

  const handleEndCall = async () => {
    if (callServiceRef.current) {
      await callServiceRef.current.endCall();
    }
    setActiveCallSession(null);
    setLocalStream(null);
    setRemoteStream(null);
  };

  const partnerUid = activeConvo?.participants.find((p) => p !== currentUser.uid);
  const partnerDetails = partnerUid ? activeConvo?.participantDetails?.[partnerUid] : null;

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 text-white select-none overflow-hidden relative pb-[74px]">
      {/* Top Header */}
      <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Messagerie Souveraine 1.0
            </h2>
            <span className="text-[10px] text-zinc-400 font-mono">Communications AFRIGOMBO sécurisées</span>
          </div>
        </div>
      </div>

      {/* MAIN TAB PANELS */}
      <div className="flex-1 overflow-hidden relative flex">
        {/* TAB 1: CONVERSATIONS */}
        {activeTab === "conversations" && (
          <div className="w-full h-full flex flex-col md:flex-row overflow-hidden">
            {/* Conversations List Sidebar */}
            <div
              className={`w-full md:w-80 lg:w-96 border-r border-zinc-800 flex flex-col shrink-0 bg-zinc-950 ${
                activeConvo ? "hidden md:flex" : "flex h-full"
              }`}
            >
              {/* Search */}
              <div className="p-3 border-b border-zinc-800 bg-zinc-900/50">
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Rechercher une conversation..."
                    value={convoSearchQuery}
                    onChange={(e) => setConvoSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
                {loadingConvos ? (
                  <div className="p-8 text-center space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37] mx-auto" />
                    <p className="text-xs text-zinc-500 font-mono">Chargement...</p>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center space-y-3">
                    <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p className="text-xs font-bold text-white">Aucune conversation</p>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Une conversation s'ouvre uniquement après une candidature, une invitation, un contrat ou une demande de renfort.
                    </p>
                  </div>
                ) : (
                  conversations
                    .filter((c) => {
                      if (!convoSearchQuery) return true;
                      const partnerName = Object.values(c.participantNames || {}).join(" ");
                      return partnerName.toLowerCase().includes(convoSearchQuery.toLowerCase());
                    })
                    .map((c) => {
                      const pUid = c.participants.find((p) => p !== currentUser?.uid);
                      const pName = pUid ? c.participantNames?.[pUid] || "Artiste Gombo" : "Partenaire";
                      const pDetails = pUid ? c.participantDetails?.[pUid] : null;
                      const isSelected = activeConvo?.id === c.id;

                      return (
                        <div
                          key={c.id}
                          onClick={() => setActiveConvo(c)}
                          className={`p-4 hover:bg-zinc-900/60 transition-colors cursor-pointer flex items-center gap-3 border-l-2 ${
                            isSelected ? "border-[#D4AF37] bg-zinc-900/80" : "border-transparent"
                          }`}
                        >
                          <img
                            src={pDetails?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border border-zinc-800"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <strong className="text-xs text-white truncate block">{pName}</strong>
                            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                              {c.lastMessage || "Démarrez l'échange..."}
                            </p>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Chat Conversation Area */}
            <div className={`flex-1 flex-col h-full bg-zinc-900/40 ${activeConvo ? "flex" : "hidden md:flex"}`}>
              {activeConvo ? (
                <>
                  {/* Chat Active Header */}
                  <div className="p-3.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => setActiveConvo(null)}
                        className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 md:hidden"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>

                      <div className="relative">
                        <img
                          src={partnerDetails?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border border-[#D4AF37]/40"
                          referrerPolicy="no-referrer"
                        />
                        {partnerPresence?.status === "online" ? (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900" title="En ligne" />
                        ) : (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-zinc-600 rounded-full border-2 border-zinc-900" title="Hors ligne" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-white truncate">
                          {partnerUid ? activeConvo.participantNames?.[partnerUid] : "Partenaire Gombo"}
                        </h3>
                        <p className="text-[10px] text-emerald-400 font-mono">
                          {partnerTyping?.isTyping
                            ? "en train d'écrire..."
                            : partnerTyping?.isRecording
                            ? "🎙️ enregistrement audio..."
                            : partnerPresence?.status === "online"
                            ? "🟢 En ligne"
                            : "🔴 Vu récemment"}
                        </p>
                      </div>
                    </div>

                    {/* Chat Header Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleStartCall("audio")}
                        className="p-2 rounded-xl bg-zinc-800 hover:bg-emerald-500/20 text-emerald-400 hover:border-emerald-500/40 border border-zinc-700 transition cursor-pointer"
                        title="Appel Audio WebRTC"
                      >
                        <PhoneCall className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleStartCall("video")}
                        className="p-2 rounded-xl bg-zinc-800 hover:bg-amber-500/20 text-amber-400 hover:border-amber-500/40 border border-zinc-700 transition cursor-pointer"
                        title="Appel Vidéo WebRTC"
                      >
                        <Video className="w-4 h-4" />
                      </button>

                      <button
                        onClick={handleShareLocation}
                        className="p-2 rounded-xl bg-zinc-800 hover:bg-sky-500/20 text-sky-400 hover:border-sky-500/40 border border-zinc-700 transition cursor-pointer"
                        title="Partager ma position GPS"
                      >
                        <MapPin className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setShowItineraryModal(true)}
                        className="p-2 rounded-xl bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 transition cursor-pointer"
                        title="Se rendre au Gombo (Itinéraire)"
                      >
                        <Navigation className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setShowModerationModal(true)}
                        className="p-2 rounded-xl bg-zinc-800 hover:bg-rose-500/20 text-rose-400 border border-zinc-700 transition cursor-pointer"
                        title="Modération & Signalement"
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Messages Stream */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {securityError && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-2 text-xs text-rose-300">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{securityError}</span>
                      </div>
                    )}

                    {messages.map((m) => {
                      const isMe = m.senderId === currentUser?.uid;
                      return (
                        <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                          <div
                            className={`max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                              isMe
                                ? "bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black font-medium rounded-br-xs shadow-md"
                                : "bg-zinc-800 text-white rounded-bl-xs border border-zinc-700"
                            }`}
                          >
                            {m.type === "text" && <p className="whitespace-pre-wrap">{m.text}</p>}
                            {m.type === "image" && (
                              <img src={m.mediaUrl || m.text} alt="" className="rounded-xl max-h-60 object-cover" />
                            )}
                            {m.type === "audio" && (
                              <audio controls src={m.mediaUrl} className="w-full max-w-xs h-8 mt-1" />
                            )}
                            {m.type === "location" && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-emerald-400" />
                                <span>{m.text}</span>
                              </div>
                            )}

                            <span className={`text-[9px] font-mono mt-1 block text-right ${isMe ? "text-black/70" : "text-zinc-400"}`}>
                              {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Bottom Chat Input Bar */}
                  <div className="p-3 bg-zinc-900 border-t border-zinc-800 relative">
                    {/* Voice Recording Active Bar */}
                    {isVoiceRecording ? (
                      <div
                        onTouchMove={handleVoiceTouchMove}
                        className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-2xl flex items-center justify-between text-xs text-rose-300"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                          <span className="font-mono font-bold">
                            Enregistrement: {Math.floor(voiceRecordDuration / 60)}:{(voiceRecordDuration % 60).toString().padStart(2, "0")}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 animate-pulse">Glisser vers la gauche pour annuler ←</p>
                        <button
                          onClick={() => stopVoiceRecording(true)}
                          className="px-2 py-1 bg-rose-500/20 border border-rose-500 text-rose-300 rounded-lg text-[10px]"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
                          title="Joindre une photo"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>

                        <input
                          type="text"
                          placeholder="Écrivez votre message..."
                          value={inputText}
                          onChange={handleInputChange}
                          className="flex-1 py-2.5 px-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37]"
                        />

                        {inputText.trim() ? (
                          <button
                            type="submit"
                            disabled={isSending}
                            className="p-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-bold rounded-xl transition cursor-pointer shadow-md"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onMouseDown={startVoiceRecording}
                            onTouchStart={startVoiceRecording}
                            onMouseUp={() => stopVoiceRecording(false)}
                            onTouchEnd={() => stopVoiceRecording(false)}
                            className="p-2.5 bg-zinc-800 hover:bg-amber-500/20 text-amber-400 border border-zinc-700 rounded-xl transition cursor-pointer"
                            title="Maintenir pour enregistrer une note vocale"
                          >
                            <Mic className="w-4 h-4" />
                          </button>
                        )}
                      </form>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-900 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Sélectionnez une conversation
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-sm mt-1">
                      Ou consultez vos Onglets Contrats, Appels ou Notifications ci-dessus.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CONTRATS */}
        {activeTab === "contrats" && (
          <div className="p-6 overflow-y-auto w-full space-y-4">
            <div className="p-4 bg-zinc-900 border border-[#D4AF37]/30 rounded-2xl">
              <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                📜 Conversations Liées Aux Contrats Active
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Tous les échanges liés à des Gombos signés ou sous contrat séquestre.
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center text-xs text-zinc-400">
              Aucun contrat en litige ou en attente d'intervention. Vos conversations sous contrat sont synchronisées.
            </div>
          </div>
        )}

        {/* TAB 3: APPELS */}
        {activeTab === "appels" && (
          <div className="p-6 overflow-y-auto w-full space-y-4">
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  📞 Historique des Appels WebRTC
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Appels audio et vidéo chiffrés et souverains passer sur AFRIGOMBO.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {callLogs.length === 0 ? (
                <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl text-center text-xs text-zinc-500">
                  Aucun appel récemment enregistré.
                </div>
              ) : (
                callLogs.map((log) => (
                  <div key={log.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="p-2 rounded-xl bg-zinc-800 text-emerald-400">
                        {log.type === "video" ? <Video className="w-4 h-4" /> : <PhoneCall className="w-4 h-4" />}
                      </span>
                      <div>
                        <strong className="text-white block">{log.receiverName}</strong>
                        <span className="text-[10px] text-zinc-500 font-mono">{log.createdAt}</span>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-zinc-800 rounded text-[10px] text-zinc-300 uppercase">
                      {log.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className="p-6 overflow-y-auto w-full space-y-4">
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                🔔 Alertes & Notifications Messagerie
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Invitations, rappels de Gombo et mises à jour de contrats.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* OVERLAY MODALS */}
      <WebRTCCallModal
        callSession={activeCallSession}
        callService={callServiceRef.current}
        localStream={localStream}
        remoteStream={remoteStream}
        isIncoming={isIncomingCall}
        onAnswer={handleAnswerCall}
        onReject={handleEndCall}
        onEndCall={handleEndCall}
      />

      <GomboItineraryModal
        isOpen={showItineraryModal}
        onClose={() => setShowItineraryModal(false)}
        targetTitle={activeConvo ? "Lieu de la prestation Gombo" : "Lieu du Gombo"}
        targetCommune="Cocody"
      />

      {partnerUid && activeConvo && (
        <ChatModerationModal
          isOpen={showModerationModal}
          onClose={() => setShowModerationModal(false)}
          currentUid={currentUser?.uid}
          currentName={currentProfile?.firstName || "Moi"}
          partnerUid={partnerUid}
          partnerName={activeConvo.participantNames?.[partnerUid] || "Partenaire"}
          convoId={activeConvo.id}
          onDeleteConversation={() => {
            setActiveConvo(null);
          }}
        />
      )}

      {/* Android Bottom Navigation Bar */}
      <div className="absolute bottom-0 left-0 w-full h-[74px] bg-zinc-950 border-t border-[#D4AF37]/30 flex items-center justify-around px-2 z-30 shadow-2xl">
        {[
          { id: "conversations", label: "Conversations", icon: MessageSquare, badge: conversations.length },
          { id: "contrats", label: "Contrats", icon: FileText },
          { id: "appels", label: "Appels", icon: PhoneCall, badge: callLogs.length },
          { id: "notifications", label: "Notifications", icon: Bell }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex flex-col items-center justify-center py-2 transition-all duration-200 cursor-pointer relative ${
                isActive ? "text-[#D4AF37] scale-105" : "text-zinc-400 hover:text-white"
              }`}
            >
              <div className="relative">
                <tab.icon className={`w-5 h-5 ${isActive ? "text-[#D4AF37]" : "text-zinc-400"}`} />
                {tab.badge ? (
                  <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 bg-[#D4AF37] text-black font-black text-[8px] rounded-full">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[10px] font-sans font-bold uppercase mt-1 tracking-tight ${isActive ? "text-[#D4AF37]" : "text-zinc-400"}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-8 h-1 bg-[#D4AF37] rounded-full animate-fadeIn" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
