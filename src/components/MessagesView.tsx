import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, Send, ArrowLeft, Image as ImageIcon, Mic, 
  CheckCheck, Volume2, ShieldAlert, BadgeCheck, AlertCircle, Loader2,
  Search, Trash2, Copy, CornerUpLeft, X, Lock, Sparkles, Check,
  CreditCard, ShieldCheck as ShieldCheckIcon, Trophy, Target, PhoneCall, Video, MapPin,
  Route, FileText, Bell, Radio, Ban, FileUp, MoreVertical, Play, Pause, Navigation, Plus, PhoneForwarded, PhoneIncoming, PhoneOutgoing, Users, Settings
} from "lucide-react";
import { gomboDB, db } from "../firebase";
import { collection, query, where, onSnapshot, doc, getDocs, addDoc, updateDoc, orderBy, deleteField } from "firebase/firestore";
import { Conversation, Message, UserProfile } from "../types";
import { SupportService } from "../services/SupportService";
import { WebRTCCallService, CallSession } from "../lib/webrtcCallEngine";
import { setUserPresence, listenUserPresence, setTypingState, listenPartnerTyping, UserPresence } from "../lib/presenceEngine";
import { sanitizeMessageContent, logBypassAttempt } from "../lib/chatModerationEngine";
import { AndroidPageLayout } from "./layout/AndroidPageLayout";
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
  // 1. Navigation Tabs (WhatsApp style: Discussions, Appels, Activité, Paramètres)
  const [activeTab, setActiveTab] = useState<"conversations" | "appels" | "activite" | "parametres">("conversations");
  const [autoReplyMessage, setAutoReplyMessage] = useState(() => {
    return localStorage.getItem(`auto_reply_${currentUser?.uid}`) || "Bonjour, je suis actuellement indisponible. Je vous recontacte au plus vite !";
  });
  const [enableAutoReply, setEnableAutoReply] = useState(() => {
    return localStorage.getItem(`enable_auto_reply_${currentUser?.uid}`) === "true";
  });
  const [notifyGombos, setNotifyGombos] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [showCallSoonAlert, setShowCallSoonAlert] = useState(false);
  const [supportConvo, setSupportConvo] = useState<any | null>(null);

  // 2. Core Messaging State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [convoSearchQuery, setConvoSearchQuery] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [isSending, setIsSending] = useState(false);
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
  const [showNewCallModal, setShowNewCallModal] = useState(false);
  const [directCallTargetPhone, setDirectCallTargetPhone] = useState("");

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Android Keyboard & Message Optimization States
  const [activeReactionMenuMsgId, setActiveReactionMenuMsgId] = useState<string | null>(null);
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const quickEmojis = ["👋", "🪘", "🎤", "👑", "🔥", "👍", "❤️", "😂", "🙏", "📍", "📷", "🤝", "💵", "🦁", "🎉", "⚡", "🌟", "✨"];
  const reactionEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  // Toggle/Update Message Reaction
  const handleToggleReaction = async (msgId: string, emoji: string, currentReaction?: string) => {
    if (!activeConvo || !currentUser?.uid) return;
    try {
      const collectionName = activeConvo.type === "support" ? "supportMessages" : "messages";
      const msgRef = doc(db, collectionName, msgId);
      if (currentReaction === emoji) {
        await updateDoc(msgRef, {
          [`reactions.${currentUser.uid}`]: deleteField()
        });
      } else {
        await updateDoc(msgRef, {
          [`reactions.${currentUser.uid}`]: emoji
        });
      }
      setActiveReactionMenuMsgId(null);
    } catch (err) {
      console.error("Failed to toggle reaction:", err);
    }
  };

  // Helper to Highlight Matching Search Text
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, "gi"));
    return (
      <span className="break-words">
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-[#D4AF37] text-black rounded px-0.5 font-bold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Auto-scroll when keyboard opens/resizes viewport on Android
  useEffect(() => {
    if (!window.visualViewport) return;
    const handleViewportResize = () => {
      if (activeConvo) {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    };
    window.visualViewport.addEventListener("resize", handleViewportResize);
    return () => window.visualViewport?.removeEventListener("resize", handleViewportResize);
  }, [activeConvo]);

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

      if (openConvoWithUserId && openConvoWithUserId !== "afrigombo_support") {
        const existing = convos.find(c => c.participants.includes(openConvoWithUserId));
        if (existing) {
          setActiveConvo(existing);
        }
      }
    });

    return () => unsub();
  }, [currentUser?.uid, openConvoWithUserId]);

  // Listen to support conversation document in real-time
  useEffect(() => {
    if (!currentUser?.uid) return;
    const supportRef = doc(db, "supportConversations", currentUser.uid);
    const unsub = onSnapshot(supportRef, (docSnap) => {
      if (docSnap.exists()) {
        setSupportConvo({ id: docSnap.id, ...docSnap.data() });
      } else {
        setSupportConvo({
          id: currentUser.uid,
          isPlaceholder: true,
          userName: "Équipe AFRIGOMBO",
          userPhoto: "/logo.png",
          lastMessage: "Bonjour 👋 Comment pouvons-nous vous aider aujourd'hui ?",
          lastMessageAt: new Date().toISOString(),
          unreadCount: { [currentUser.uid]: 0 }
        });
      }
    });
    return () => unsub();
  }, [currentUser?.uid]);

  // Handle auto-opening of Support Chat and prefilling of drafts
  useEffect(() => {
    if (openConvoWithUserId === "afrigombo_support" && supportConvo) {
      setActiveConvo({
        id: currentUser.uid,
        type: "support",
        participants: [currentUser.uid, "afrigombo_support"],
        userName: "Équipe AFRIGOMBO",
        userPhoto: "/logo.png",
        ...supportConvo
      });

      // Clear the trigger
      setOpenConvoWithUserId(null);

      // Prefill support draft if it exists
      const draft = localStorage.getItem("support_draft");
      if (draft) {
        setInputText(draft);
        localStorage.removeItem("support_draft");
      }
    }
  }, [openConvoWithUserId, supportConvo, currentUser?.uid]);

  // Listen to messages of active conversation
  useEffect(() => {
    if (!activeConvo) {
      setMessages([]);
      return;
    }

    if (activeConvo.type === "support") {
      const q = query(
        collection(db, "supportMessages"),
        where("conversationId", "==", currentUser.uid),
        orderBy("createdAt", "asc")
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
        setMessages(msgs);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }, (err) => {
        const qFallback = query(
          collection(db, "supportMessages"),
          where("conversationId", "==", currentUser.uid)
        );
        getDocs(qFallback).then(snap => {
          const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
          msgs.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
          setMessages(msgs);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });
      });
      return () => unsub();
    } else {
      const unsub = gomboDB.listenMessages(activeConvo.id, (msgs) => {
        setMessages(msgs);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      });
      return () => unsub();
    }
  }, [activeConvo?.id, activeConvo?.type, currentUser?.uid]);

  // Listen to partner presence and typing
  useEffect(() => {
    if (!activeConvo || !currentUser?.uid) {
      setPartnerPresence(null);
      setPartnerTyping(null);
      return;
    }

    const partnerUid = activeConvo.participants.find(p => p !== currentUser.uid);
    if (!partnerUid) return;

    const unsubPresence = listenUserPresence(partnerUid, (pres) => {
      setPartnerPresence(pres);
    });

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (activeConvo && currentUser?.uid) {
      const senderName = currentProfile?.firstName || "Moi";
      setTypingState(activeConvo.id, currentUser.uid, senderName, val.length > 0, false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConvo || isSending) return;

    const rawText = inputText.trim();
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

    setInputText("");
    setSecurityError(null);
    setIsSending(true);

    if (currentUser?.uid) {
      setTypingState(activeConvo.id, currentUser.uid, currentProfile?.firstName || "Moi", false, false);
    }

    try {
      if (activeConvo.type === "support") {
        if (supportConvo?.isPlaceholder) {
          await SupportService.getOrCreateSupportConversation(currentUser.uid, currentProfile);
        }
        await SupportService.sendSupportMessage(
          currentUser.uid,
          currentUser.uid,
          currentProfile?.firstName ? `${currentProfile.firstName} ${currentProfile.lastName}` : "Client Gombo",
          sanitizeResult.text,
          "Autre"
        );
      } else {
        const senderName = currentProfile?.firstName ? `${currentProfile.firstName} ${currentProfile.lastName}` : "Moi";
        await gomboDB.sendMessage(
          activeConvo.id,
          currentUser.uid,
          senderName,
          sanitizeResult.text,
          "text"
        );
      }
    } catch (err: any) {
      console.error("Failed to send message:", err);
      if (err.message && err.message.includes("AFRIGOMBO")) {
        setSecurityError(err.message);
      }
    } finally {
      setIsSending(false);
    }
  };

  // Voice Recording
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

  const partnerUid = activeConvo?.participants.find((p) => p !== currentUser?.uid);
  const partnerDetails = partnerUid ? activeConvo?.participantDetails?.[partnerUid] : null;

  if (!currentUser?.uid) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-8 bg-afri-bg text-afri-text text-center space-y-4 min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
        <p className="text-xs font-mono text-afri-text-sec">Initialisation de la messagerie sécurisée...</p>
      </div>
    );
  }

  return (
    <div className={`w-full flex-1 flex flex-col justify-between p-0 m-0 border-none rounded-none bg-afri-bg text-afri-text select-none overflow-hidden relative ${
      activeConvo ? "pb-0 md:pb-[88px]" : "pb-[88px]"
    }`}>
      {/* HAUT (Barre de recherche) : Une barre de recherche rapide avec icône loupe (w-full px-4 py-3 bg-neutral-900/50) */}
      <div className="w-full px-4 py-3 bg-neutral-900/50 border-b border-afri-border shrink-0">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-afri-text-muted absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Rechercher une discussion..."
            value={convoSearchQuery}
            onChange={(e) => setConvoSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text placeholder:text-afri-text-muted focus:outline-none focus:border-[#D4AF37]"
          />
        </div>
      </div>

      {/* MAIN TAB PANELS (Full 100% width & height under header) */}
      <div className="flex-1 overflow-hidden relative flex w-full h-full">
        {/* TAB 1: CONVERSATIONS */}
        {activeTab === "conversations" && (
          <div className="w-full h-full flex flex-col md:flex-row overflow-hidden">
            {/* Conversations List Sidebar */}
            <div
              className={`w-full md:w-80 lg:w-96 border-r border-afri-border flex flex-col shrink-0 bg-afri-bg ${
                activeConvo ? "hidden md:flex" : "flex h-full"
              }`}
            >
              <div className="flex-1 overflow-y-auto divide-y divide-afri-border flex flex-col pt-2">
                {/* Permanent Support Card */}
                {supportConvo && (
                  <div
                    onClick={() => {
                      setActiveConvo({
                        id: currentUser.uid,
                        type: "support",
                        participants: [currentUser.uid, "afrigombo_support"],
                        userName: "Équipe AFRIGOMBO",
                        userPhoto: "/logo.png",
                        ...supportConvo
                      });
                      
                      // Clear unread count when clicking support card
                      if (supportConvo.unreadCount?.[currentUser.uid] > 0) {
                        try {
                          const convoRef = doc(db, "supportConversations", currentUser.uid);
                          updateDoc(convoRef, {
                            [`unreadCount.${currentUser.uid}`]: 0
                          });
                        } catch (err) {}
                      }
                    }}
                    className={`p-4 transition-colors cursor-pointer flex items-center justify-between gap-3 border-l-4 ${
                      activeConvo?.type === "support"
                        ? "border-[#D4AF37] bg-afri-bg-sec"
                        : currentProfile?.isPremium || currentProfile?.premium
                        ? "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10"
                        : "border-afri-border bg-afri-bg-sec hover:bg-afri-bg-sec"
                    } shadow-md mb-2 shrink-0 rounded-2xl mx-2 border border-afri-border`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative">
                        <img
                          src="/logo.png"
                          alt="Équipe AFRIGOMBO"
                          className="w-10 h-10 rounded-full object-cover border border-[#D4AF37]"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border border-afri-border" title="En ligne" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-xs text-afri-text font-black uppercase">Équipe AFRIGOMBO</strong>
                          <span className="text-[#D4AF37] text-[10px] font-black" title="Support officiel">✔ Vérifié</span>
                        </div>
                        <p className="text-[11px] text-afri-text-sec truncate mt-0.5">
                          {supportConvo.lastMessage || "Démarrer l'échange..."}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[9px] font-mono text-[#D4AF37] font-black">SUPPORT</span>
                      {supportConvo.unreadCount?.[currentUser.uid] > 0 && (
                        <span className="px-1.5 py-0.5 bg-rose-500 text-afri-text font-black text-[9px] rounded-full min-w-[18px] text-center animate-pulse">
                          {supportConvo.unreadCount[currentUser.uid]}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {loadingConvos ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37] mx-auto" />
                    <p className="text-xs text-afri-text-muted font-mono">Chargement...</p>
                  </div>
                ) : conversations.length === 0 ? (
                  /* CENTRE (Zone principale) : Si aucune conversation : Afficher une icône de bulle stylisée, un texte central "Aucune discussion active" et un bouton incitatif "Démarrer un échange" */
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-afri-bg-sec border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                      <MessageSquare className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-afri-text uppercase tracking-wider">
                        Aucune autre discussion active
                      </h3>
                      <p className="text-xs text-afri-text-sec max-w-xs mt-1.5 leading-relaxed">
                        Démarrez un échange suite à une candidature, une invitation ou un Gombo.
                      </p>
                    </div>
                    <button
                      onClick={onNavigateToSearch}
                      className="px-5 py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black text-xs font-bold uppercase rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      Démarrer un échange
                    </button>
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
                      const unread = c.unreadCount?.[currentUser?.uid || ""] || 0;
                      const lastMsgTime = c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

                      return (
                        <div
                          key={c.id}
                          onClick={() => setActiveConvo(c)}
                          className={`p-4 hover:bg-zinc-900/60 transition-colors cursor-pointer flex items-center justify-between gap-3 border-l-2 ${
                            isSelected ? "border-[#D4AF37] bg-zinc-900/80" : "border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <img
                              src={pDetails?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover border border-afri-border shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <strong className="text-xs text-afri-text truncate block">{pName}</strong>
                              <p className="text-[11px] text-afri-text-sec truncate mt-0.5">
                                {c.lastMessage || "Démarrez l'échange..."}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[9px] font-mono text-afri-text-muted">{lastMsgTime}</span>
                            {unread > 0 && (
                              <span className="px-1.5 py-0.5 bg-[#D4AF37] text-black font-black text-[9px] rounded-full min-w-[18px] text-center">
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

            {/* Chat Conversation Area */}
            <div className={`flex-1 flex-col h-full bg-zinc-900/40 w-full ${activeConvo ? "flex" : "hidden md:flex"}`}>
              {activeConvo ? (
                <>
                  {/* Chat Active Header */}
                  <div className="p-3.5 bg-afri-bg-sec border-b border-afri-border flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => setActiveConvo(null)}
                        className="p-1.5 rounded-lg bg-afri-bg-ter text-afri-text-sec md:hidden"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>

                      <div className="relative">
                        <img
                          src={activeConvo.type === "support" ? "/logo.png" : partnerDetails?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border border-[#D4AF37]/40"
                          referrerPolicy="no-referrer"
                        />
                        {activeConvo.type === "support" || partnerPresence?.status === "online" ? (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-afri-border" title="En ligne" />
                        ) : (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-zinc-600 rounded-full border-2 border-afri-border" title="Hors ligne" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="text-xs font-bold text-afri-text truncate">
                            {activeConvo.type === "support" ? "Équipe AFRIGOMBO" : partnerUid ? activeConvo.participantNames?.[partnerUid] : "Partenaire Gombo"}
                          </h3>
                          {activeConvo.type === "support" && (
                            <span className="text-[#D4AF37] text-[10px] font-black" title="Support officiel">✔</span>
                          )}
                        </div>
                        <p className="text-[10px] text-emerald-400 font-mono">
                          {activeConvo.type === "support"
                            ? "🟢 En ligne (Support 24/7)"
                            : partnerTyping?.isTyping
                            ? "en train d'écrire..."
                            : partnerTyping?.isRecording
                            ? "🎙️ enregistrement audio..."
                            : partnerPresence?.status === "online"
                            ? "🟢 En ligne"
                            : "🔴 Vu récemment"}
                        </p>
                      </div>
                    </div>

                    {/* Chat Header Actions: Audio Call & Video Call on top right */}
                    <div className="flex items-center gap-2 shrink-0">
                      {activeConvo.type !== "support" && (
                        <>
                          <button
                            onClick={() => handleStartCall("audio")}
                            className="p-2.5 rounded-xl bg-afri-bg-ter hover:bg-emerald-500/20 text-emerald-400 hover:border-emerald-500/40 border border-afri-border transition cursor-pointer flex items-center gap-1.5"
                            title="Appel Audio"
                          >
                            <PhoneCall className="w-4 h-4" />
                            <span className="hidden sm:inline text-[10px] font-bold uppercase">Appel</span>
                          </button>

                          <button
                            onClick={() => handleStartCall("video")}
                            className="p-2.5 rounded-xl bg-afri-bg-ter hover:bg-amber-500/20 text-amber-400 hover:border-amber-500/40 border border-afri-border transition cursor-pointer flex items-center gap-1.5"
                            title="Appel Vidéo"
                          >
                            <Video className="w-4 h-4" />
                            <span className="hidden sm:inline text-[10px] font-bold uppercase">Vidéo</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={handleShareLocation}
                        className="p-2 rounded-xl bg-afri-bg-ter hover:bg-sky-500/20 text-sky-400 border border-afri-border transition cursor-pointer"
                        title="Position GPS"
                      >
                        <MapPin className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setShowItineraryModal(true)}
                        className="p-2 rounded-xl bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 transition cursor-pointer"
                        title="Itinéraire Gombo"
                      >
                        <Navigation className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setShowModerationModal(true)}
                        className="p-2 rounded-xl bg-afri-bg-ter hover:bg-rose-500/20 text-rose-400 border border-afri-border transition cursor-pointer"
                        title="Modération"
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setShowMsgSearch(!showMsgSearch);
                          if (showMsgSearch) setMsgSearchQuery("");
                        }}
                        className={`p-2 rounded-xl border transition cursor-pointer ${
                          showMsgSearch
                            ? "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40"
                            : "bg-afri-bg-ter hover:bg-zinc-700 text-afri-text-sec border-afri-border"
                        }`}
                        title="Rechercher des messages"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Inline message search input */}
                  {showMsgSearch && (
                    <div className="px-4 py-2 bg-afri-bg-sec border-b border-afri-border flex items-center justify-between gap-2 shrink-0">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-afri-text-muted absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Rechercher dans cette discussion..."
                          value={msgSearchQuery}
                          onChange={(e) => setMsgSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-8 py-1.5 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text placeholder:text-afri-text-muted focus:outline-none focus:border-[#D4AF37]"
                          autoFocus
                        />
                        {msgSearchQuery && (
                          <button
                            onClick={() => setMsgSearchQuery("")}
                            className="absolute right-2.5 top-2.5 text-afri-text-muted hover:text-afri-text"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setShowMsgSearch(false);
                          setMsgSearchQuery("");
                        }}
                        className="text-[11px] font-bold text-afri-text-sec hover:text-afri-text uppercase px-2 py-1 shrink-0"
                      >
                        Fermer
                      </button>
                    </div>
                  )}

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
                      const hasReactions = m.reactions && Object.keys(m.reactions).length > 0;
                      const myReaction = m.reactions?.[currentUser?.uid || ""];

                      return (
                        <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"} relative mb-3 group w-full`}>
                          {/* Reaction Picker Bar popup above bubble if this message is selected */}
                          {activeReactionMenuMsgId === m.id && (
                            <div className="absolute z-50 -top-10 flex items-center gap-1.5 bg-zinc-950/95 border border-[#D4AF37]/50 p-1 rounded-full shadow-2xl animate-fadeIn">
                              {reactionEmojis.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleToggleReaction(m.id || "", emoji, myReaction)}
                                  className={`w-7 h-7 flex items-center justify-center text-sm rounded-full hover:bg-afri-bg-ter transition active:scale-125 ${
                                    myReaction === emoji ? "bg-[#D4AF37]/20 border border-[#D4AF37]/40" : ""
                                  }`}
                                >
                                  {emoji}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => setActiveReactionMenuMsgId(null)}
                                className="w-5 h-5 flex items-center justify-center text-xs text-afri-text-muted hover:text-afri-text hover:bg-afri-bg-ter rounded-full ml-1"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          <div className={`flex items-center gap-2 max-w-[85%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                            {/* Message bubble */}
                            <div
                              className={`relative p-3.5 rounded-2xl text-xs leading-relaxed select-text ${
                                isMe
                                  ? "bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black font-medium rounded-br-xs shadow-md"
                                  : "bg-afri-bg-ter text-afri-text rounded-bl-xs border border-afri-border"
                              } break-words min-w-[70px] ${hasReactions ? "pb-5" : ""}`}
                            >
                              {m.type === "text" && (
                                <p className="whitespace-pre-wrap break-words">{highlightText(m.text || "", msgSearchQuery)}</p>
                              )}
                              {m.type === "image" && (
                                <img src={m.mediaUrl || m.text} alt="" className="rounded-xl max-h-60 object-cover" />
                              )}
                              {m.type === "audio" && (
                                <audio controls src={m.mediaUrl} className="w-full max-w-xs h-8 mt-1" />
                              )}
                              {m.type === "location" && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                                  <span className="break-words">{m.text}</span>
                                </div>
                              )}

                              {/* Reactions Overlapping on Bubble Corner */}
                              {hasReactions && (
                                <div className={`absolute -bottom-2 ${isMe ? "right-3" : "left-3"} flex items-center gap-0.5 bg-afri-bg border border-afri-border/60 px-1.5 py-0.5 rounded-full shadow-md text-[10px] z-10 select-none`}>
                                  {Object.entries(m.reactions as Record<string, string>).map(([uid, rEmoji]) => {
                                    if (!rEmoji) return null;
                                    return (
                                      <span
                                        key={uid}
                                        title={uid === currentUser?.uid ? "Vous" : "Partenaire"}
                                        onClick={() => handleToggleReaction(m.id || "", rEmoji, rEmoji)}
                                        className="cursor-pointer hover:scale-125 transition-transform"
                                      >
                                        {rEmoji}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}

                              <span className={`text-[9px] font-mono mt-1 block text-right ${isMe ? "text-black/70" : "text-afri-text-sec"}`}>
                                {(() => {
                                  try {
                                    return new Date(m.timestamp || m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                  } catch (e) {
                                    return "";
                                  }
                                })()}
                              </span>
                            </div>

                            {/* Hover/Tap Quick Reaction Sparkles trigger button next to the bubble */}
                            <button
                              type="button"
                              onClick={() => setActiveReactionMenuMsgId(activeReactionMenuMsgId === m.id ? null : (m.id || null))}
                              className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded-full bg-afri-bg-ter border border-afri-border/40 hover:border-[#D4AF37]/40 text-afri-text-muted hover:text-[#D4AF37] shrink-0"
                              title="Réagir"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Bottom Chat Input Bar */}
                  <div className="p-3 bg-afri-bg-sec border-t border-afri-border relative">
                    {showEmojiPicker && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 pt-1 scrollbar-none border-b border-afri-border/30">
                        {quickEmojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setInputText((prev) => prev + emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-afri-bg border border-afri-border hover:border-[#D4AF37] rounded-lg text-sm active:scale-95 transition shrink-0"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

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
                        <p className="text-[10px] text-afri-text-sec animate-pulse">Glisser vers la gauche pour annuler ←</p>
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
                          className="p-2.5 rounded-xl bg-afri-bg-ter hover:bg-zinc-700 text-afri-text-sec hover:text-afri-text transition cursor-pointer shrink-0"
                          title="Joindre une photo"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className={`p-2.5 rounded-xl transition cursor-pointer shrink-0 ${
                            showEmojiPicker
                              ? "bg-[#D4AF37]/20 text-[#D4AF37]"
                              : "bg-afri-bg-ter text-afri-text-sec hover:text-afri-text"
                          }`}
                          title="Choisir un Emoji"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>

                        <input
                          type="text"
                          placeholder="Écrivez votre message..."
                          value={inputText}
                          onChange={handleInputChange}
                          onFocus={() => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 150)}
                          className="flex-1 py-2.5 px-4 bg-afri-bg border border-afri-border rounded-2xl text-xs text-afri-text placeholder:text-afri-text-muted focus:outline-none focus:border-[#D4AF37]"
                        />

                        {inputText.trim() ? (
                          <button
                            type="submit"
                            disabled={isSending}
                            className="p-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-bold rounded-xl transition cursor-pointer shadow-md shrink-0"
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
                            className="p-2.5 bg-afri-bg-ter hover:bg-amber-500/20 text-amber-400 border border-afri-border rounded-xl transition cursor-pointer shrink-0"
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
                  <div className="w-16 h-16 rounded-full bg-afri-bg-sec border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-afri-text uppercase tracking-wider">
                      Sélectionnez une discussion
                    </h3>
                    <p className="text-xs text-afri-text-sec max-w-sm mt-1">
                      Consultez vos discussions, contrats ou historique d'appels ci-dessous.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: APPELS */}
        {activeTab === "appels" && (
          <div className="p-6 overflow-y-auto w-full h-full space-y-4 relative pb-24">
            <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl">
              <h3 className="text-xs font-bold text-afri-text uppercase tracking-wider">
                📞 Historique des Appels Audio / Vidéo
              </h3>
              <p className="text-xs text-afri-text-sec mt-1">
                Appels passés et reçus via le réseau souverain sécurisé AFRIGOMBO.
              </p>
            </div>

            {/* Notification Banner for call action */}
            {showCallSoonAlert && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-xs text-amber-300 animate-pulse">
                <Radio className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <strong className="block font-bold">Réseau GSM Souverain sécurisé</strong>
                  <span>Cette fonctionnalité de numérotation directe est bientôt disponible.</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {callLogs.length === 0 ? (
                <div className="p-12 bg-afri-bg-sec border border-afri-border rounded-2xl text-center space-y-3">
                  <PhoneCall className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-xs text-afri-text-sec font-mono">Aucun appel enregistré pour le moment.</p>
                </div>
              ) : (
                callLogs.map((log) => (
                  <div key={log.id} className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="p-2.5 rounded-xl bg-afri-bg-ter text-emerald-400 border border-afri-border">
                        {log.type === "video" ? <Video className="w-4 h-4" /> : <PhoneCall className="w-4 h-4" />}
                      </span>
                      <div>
                        <strong className="text-afri-text block">{log.receiverName || "Membre Gombo"}</strong>
                        <span className="text-[10px] text-afri-text-muted font-mono">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : "Récent"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-afri-bg-ter rounded-xl text-[10px] text-afri-text-sec uppercase font-mono">
                        {log.status || "Terminé"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Floating Action Button (FAB) for Nouvel Appel Direct */}
            <div className="absolute bottom-20 right-6">
              <button
                onClick={() => {
                  setShowCallSoonAlert(true);
                  setTimeout(() => setShowCallSoonAlert(false), 5000);
                }}
                className="w-14 h-14 bg-[#D4AF37] hover:bg-amber-400 text-black rounded-full shadow-2xl flex items-center justify-center transition hover:scale-110 cursor-pointer border-2 border-afri-border"
                title="Lancer un nouvel appel direct"
              >
                <PhoneCall className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: ACTIVITÉ */}
        {activeTab === "activite" && (
          <div className="p-6 overflow-y-auto w-full h-full space-y-4 pb-24">
            <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl">
              <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                📊 Tableau de Bord d'Activité
              </h3>
              <p className="text-xs text-afri-text-sec mt-1">
                Suivez vos performances professionnelles et votre réputation au sein de la communauté.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] text-afri-text-muted font-bold uppercase">Indice de Confiance</span>
                <span className="text-xl font-bold text-emerald-400 mt-2">{currentProfile?.trustScore || 100}%</span>
                <span className="text-[9px] text-afri-text-sec mt-1">Prestations de haut niveau</span>
              </div>
              <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] text-afri-text-muted font-bold uppercase">Statut Élite</span>
                <span className="text-xl font-bold text-[#D4AF37] mt-2">
                  {currentProfile?.isPremium || currentProfile?.premium ? "Premium 👑" : "Membre Standard"}
                </span>
                <span className="text-[9px] text-afri-text-sec mt-1">Visibilité et privilèges</span>
              </div>
            </div>

            <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-3">
              <h4 className="text-[11px] font-bold text-afri-text uppercase tracking-wider">📜 Historique & Télémetrie</h4>
              <div className="divide-y divide-afri-border">
                <div className="py-2.5 flex justify-between text-xs text-afri-text-sec">
                  <span>Inscription Réseau</span>
                  <span className="font-mono text-afri-text text-[11px]">{currentProfile?.createdAt ? new Date(currentProfile.createdAt).toLocaleDateString() : "Récemment"}</span>
                </div>
                <div className="py-2.5 flex justify-between text-xs text-afri-text-sec">
                  <span>Prestations Séquestrées</span>
                  <span className="font-mono text-afri-text text-[11px]">Tous les gombos validés</span>
                </div>
                <div className="py-2.5 flex justify-between text-xs text-afri-text-sec">
                  <span>ID Unique Afri</span>
                  <span className="font-mono text-[#D4AF37] text-[11px]">{currentProfile?.afriId || "AFRI-MEMBER"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PARAMÈTRES */}
        {activeTab === "parametres" && (
          <div className="p-6 overflow-y-auto w-full h-full space-y-4 pb-24">
            <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl">
              <h3 className="text-xs font-bold text-afri-text uppercase tracking-wider">
                ⚙️ Réglages & Auto-Répondeur d'Absence
              </h3>
              <p className="text-xs text-afri-text-sec mt-1">
                Configurez vos réponses automatiques et vos préférences de messagerie.
              </p>
            </div>

            {/* Offline Auto-Reply Form */}
            <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-afri-text uppercase tracking-wide">🔴 Réponse Automatique</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableAutoReply}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setEnableAutoReply(enabled);
                      localStorage.setItem(`enable_auto_reply_${currentUser?.uid}`, enabled ? "true" : "false");
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-afri-bg-ter peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D4AF37]"></div>
                </label>
              </div>

              <p className="text-[11px] text-afri-text-sec leading-relaxed">
                Ce message sera envoyé automatiquement aux artistes ou recruteurs qui vous écrivent lorsque vous êtes absent ou en pleine prestation.
              </p>

              <textarea
                value={autoReplyMessage}
                onChange={(e) => {
                  const val = e.target.value;
                  setAutoReplyMessage(val);
                  localStorage.setItem(`auto_reply_${currentUser?.uid}`, val);
                }}
                placeholder="Exemple: Bonjour, je suis actuellement en prestation Gombo. Je vous recontacte dès la fin de ma session !"
                rows={3}
                className="w-full p-3 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text focus:outline-none focus:border-[#D4AF37] placeholder:text-zinc-600 resize-none"
              />
            </div>

            {/* Notification settings */}
            <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-afri-text uppercase tracking-wide">🔔 Préférences de Notification</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-3 text-xs text-afri-text-sec cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyMessages}
                    onChange={(e) => setNotifyMessages(e.target.checked)}
                    className="rounded border-afri-border bg-afri-bg text-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                  <span>Notifier lors de la réception d'un message</span>
                </label>
                <label className="flex items-center gap-3 text-xs text-afri-text-sec cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyGombos}
                    onChange={(e) => setNotifyGombos(e.target.checked)}
                    className="rounded border-afri-border bg-afri-bg text-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                  <span>Alerte instantanée sur offres de gombo</span>
                </label>
              </div>
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

      {/* New Direct Call Modal */}
      {showNewCallModal && (
        <div className="fixed inset-0 bg-afri-bg/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-afri-bg-sec border border-[#D4AF37]/40 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-afri-text uppercase tracking-wider flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-[#D4AF37]" />
                Nouvel Appel Direct
              </h3>
              <button onClick={() => setShowNewCallModal(false)} className="text-afri-text-sec hover:text-afri-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Entrez l'UID ou le pseudo du membre/artiste à appeler directement en audio ou vidéo.
            </p>
            <input
              type="text"
              placeholder="UID ou Téléphone du contact..."
              value={directCallTargetPhone}
              onChange={(e) => setDirectCallTargetPhone(e.target.value)}
              className="w-full px-4 py-3 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  if (!directCallTargetPhone.trim()) return;
                  alert(`Lancement de l'appel audio vers ${directCallTargetPhone}...`);
                  setShowNewCallModal(false);
                }}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs uppercase cursor-pointer"
              >
                Audio 📞
              </button>
              <button
                onClick={() => {
                  if (!directCallTargetPhone.trim()) return;
                  alert(`Lancement de l'appel vidéo vers ${directCallTargetPhone}...`);
                  setShowNewCallModal(false);
                }}
                className="flex-1 py-3 bg-[#D4AF37] hover:bg-amber-400 text-black font-bold rounded-xl text-xs uppercase cursor-pointer"
              >
                Vidéo 📹
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp-Style Bottom Navigation Bar (4 Essential Tabs) */}
      <div className={`absolute bottom-0 left-0 w-full pb-6 pt-2 bg-afri-bg-sec border-t border-afri-border items-center justify-around px-2 z-30 shadow-2xl ${
        activeConvo ? "hidden md:flex" : "flex"
      }`}>
        {[
          { id: "conversations", label: "💬 DISCUSSIONS", icon: MessageSquare, badge: (conversations.length || 0) + ((supportConvo?.unreadCount?.[currentUser?.uid] > 0) ? 1 : 0) },
          { id: "appels", label: "📞 APPELS", icon: PhoneCall, badge: callLogs.length },
          { id: "activite", label: "📊 ACTIVITÉ", icon: Trophy },
          { id: "parametres", label: "⚙️ PARAMÈTRES", icon: Settings }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                // Also reset activeConvo when switching tabs so you can see lists cleanly
                if (tab.id !== "conversations") {
                  setActiveConvo(null);
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center py-2 transition-all duration-200 cursor-pointer relative ${
                isActive ? "text-[#D4AF37] scale-105" : "text-afri-text-sec hover:text-afri-text"
              }`}
            >
              <div className="relative">
                <tab.icon className={`w-5 h-5 ${isActive ? "text-[#D4AF37]" : "text-afri-text-sec"}`} />
                {tab.badge ? (
                  <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 bg-[#D4AF37] text-black font-black text-[8px] rounded-full">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[9px] font-sans font-bold uppercase mt-1 tracking-tight ${isActive ? "text-[#D4AF37]" : "text-afri-text-sec"}`}>
                {tab.label.split(" ")[1]}
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
