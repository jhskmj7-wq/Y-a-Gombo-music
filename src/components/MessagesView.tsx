import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, Send, ArrowLeft, Image as ImageIcon, Mic, 
  CheckCheck, Volume2, ShieldAlert, BadgeCheck, AlertCircle, Loader2
} from "lucide-react";
import { gomboDB } from "../firebase";
import { Conversation, Message } from "../types";

interface MessagesViewProps {
  currentUser: any;
  currentProfile: any;
  openConvoWithUserId: string | null;
  setOpenConvoWithUserId: (uid: string | null) => void;
  onBack: () => void;
}

export default function MessagesView({
  currentUser,
  currentProfile,
  openConvoWithUserId,
  setOpenConvoWithUserId,
  onBack
}: MessagesViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [creatingConvo, setCreatingConvo] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Listen to user's conversations in real-time
  useEffect(() => {
    if (!currentUser?.uid) return;

    setLoadingConvos(true);
    const unsubscribe = gomboDB.listenConversations(currentUser.uid, (convos) => {
      setConversations(convos);
      setLoadingConvos(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser?.uid]);

  // 2. Handle programmatic transition to a specified conversation (e.g. from clicking "📩 Contacter")
  useEffect(() => {
    if (!currentUser?.uid || !openConvoWithUserId) return;

    const autoInitiateChat = async () => {
      setCreatingConvo(true);
      try {
        console.log("💬 [Messagerie] Auto-initiating chat with user:", openConvoWithUserId);
        
        // Let's check if there is an existing conversation already loaded
        const existing = conversations.find(c => c.participants.includes(openConvoWithUserId));
        if (existing) {
          setActiveConvo(existing);
          setOpenConvoWithUserId(null); // Clear parameter
          setCreatingConvo(false);
          return;
        }

        // Fetch target user's details for metadata fallback
        let targetUserDetails = {
          name: "Artiste Gombo",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
          role: "musicien"
        };

        // Try getting profile from DB or use standard defaults
        try {
          const profile = await gomboDB.getUserProfile(openConvoWithUserId);
          if (profile) {
            targetUserDetails = {
              name: `${profile.firstName} ${profile.lastName}`.trim(),
              avatarUrl: profile.avatarUrl || targetUserDetails.avatarUrl,
              role: profile.role || "musicien"
            };
          }
        } catch (e) {
          console.warn("Could not load target user profile details, using defaults:", e);
        }

        const myDetails = {
          name: currentProfile?.firstName ? `${currentProfile.firstName} ${currentProfile.lastName}` : "Moi",
          avatarUrl: currentProfile?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
          role: currentProfile?.role || "organisateur"
        };

        const convoId = await gomboDB.getOrCreateConversation(
          currentUser.uid,
          openConvoWithUserId,
          myDetails,
          targetUserDetails
        );

        // Clear parameter & wait for the onSnapshot array to receive the record
        setOpenConvoWithUserId(null);
      } catch (err) {
        console.error("❌ Erreur initiation chat directe:", err);
      } finally {
        setCreatingConvo(false);
      }
    };

    autoInitiateChat();
  }, [openConvoWithUserId, conversations, currentUser?.uid, currentProfile]);

  // If activeConvo gets updated in background conversations array, keep sync
  useEffect(() => {
    if (!activeConvo) return;
    const freshConvo = conversations.find(c => c.id === activeConvo.id);
    if (freshConvo) {
      setActiveConvo(freshConvo);
    }
  }, [conversations]);

  // 3. Listen to messages inside selected active conversation
  useEffect(() => {
    if (!activeConvo?.id) {
      setMessages([]);
      return;
    }

    console.log("📡 [Messagerie] Synced to real-time message stream for ID:", activeConvo.id);
    const unsubscribe = gomboDB.listenMessages(activeConvo.id, (msgs) => {
      setMessages(msgs);
      // Mark as read immediately when user views or gets a new message
      gomboDB.markConversationAsRead(activeConvo.id, currentUser.uid);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeConvo?.id, currentUser?.uid]);

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Send plain text messages
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConvo || isSending) return;

    const messageText = inputText.trim();
    setInputText("");
    setIsSending(true);

    try {
      const senderName = currentProfile?.firstName ? `${currentProfile.firstName} ${currentProfile.lastName}` : "Moi";
      await gomboDB.sendMessage(
        activeConvo.id,
        currentUser.uid,
        senderName,
        messageText,
        "text"
      );
    } catch (err) {
      console.error("Failed to send text message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 5. Send real voice messages via MediaRecorder
  const handleToggleVoiceRecord = async () => {
    if (!activeConvo || isSending) return;

    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          setIsSending(true);
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Stop all tracks to release microphone
          stream.getTracks().forEach(track => track.stop());

          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            const senderName = currentProfile?.firstName ? `${currentProfile.firstName} ${currentProfile.lastName}` : "Moi";
            await gomboDB.sendMessage(
              activeConvo.id,
              currentUser.uid,
              senderName,
              "🎙️ Message vocal",
              "audio",
              base64Audio
            );
            setIsSending(false);
          };
          reader.readAsDataURL(audioBlob);
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Microphone access denied or error:", err);
        alert("Erreur: Impossible d'accéder au microphone.");
      }
    }
  };

  // 6. Send real image via Base64 FileReader
  const handleSendImageMessage = async (file: File) => {
    if (!activeConvo || isSending) return;
    setIsSending(true);

    try {
      const senderName = currentProfile?.firstName ? `${currentProfile.firstName} ${currentProfile.lastName}` : "Moi";
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        await gomboDB.sendMessage(
          activeConvo.id,
          currentUser.uid,
          senderName,
          "📷 Image jointe",
          "image",
          base64Image
        );
        setIsSending(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Failed to process image message:", err);
      setIsSending(false);
    }
  };

  const onImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleSendImageMessage(e.target.files[0]);
    }
  };

  // Helpers to get other participant details
  const getParticipantDetails = (convo: Conversation) => {
    const defaultData = {
      name: "Artiste Gombo",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
      role: "Musicien"
    };

    if (!convo || !convo.participants) return defaultData;
    const otherUid = convo.participants.find(uid => uid !== currentUser.uid);
    if (!otherUid) return defaultData;

    const details = convo.participantDetails?.[otherUid];
    return {
      name: details?.name || defaultData.name,
      avatarUrl: details?.avatarUrl || defaultData.avatarUrl,
      role: details?.role || defaultData.role
    };
  };

  const getUnreadCount = (convo: Conversation) => {
    return convo.unreadCount?.[currentUser.uid] || 0;
  };

  return (
    <div className="w-full max-w-6xl mx-auto min-h-[75vh] flex flex-col md:flex-row bg-white dark:bg-[#0c101b] rounded-3xl overflow-hidden border border-gray-150 dark:border-gray-850 shadow-sm transition-all animate-fade-in mb-12">
      
      {/* LEFT COLUMN: Conversation List */}
      <div className={`w-full md:w-80 md:border-r border-gray-150 dark:border-gray-850 flex flex-col ${
        activeConvo ? "hidden md:flex" : "flex"
      }`}>
        
        {/* Header List */}
        <div className="p-4 border-b border-gray-150 dark:border-gray-850 bg-gray-50/50 dark:bg-gray-900/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={onBack}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 rounded-lg transition"
              title="Retour"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
              💬 Messagerie
            </h2>
          </div>
          {conversations.length > 0 && (
            <span className="text-[10px] font-bold text-orange-500 px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/20">
              {conversations.length}
            </span>
          )}
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-850 max-h-[650px]">
          {loadingConvos ? (
            <div className="p-8 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider animate-pulse">Chargement...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center mx-auto">
                <MessageSquare className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <p className="text-xs text-gray-950 dark:text-white font-black uppercase">Pas encore de chat</p>
              <p className="text-[10.5px] text-gray-400 leading-relaxed max-w-[200px] mx-auto">
                Allez dans <b>🎤 La Base</b> (L'Annuaire d'Artistes) ou les Gombos et cliquez sur <b>📩 Contacter</b> pour entamer un chat direct.
              </p>
            </div>
          ) : (
            conversations.map((convo) => {
              const partner = getParticipantDetails(convo);
              const unread = getUnreadCount(convo);
              const isActive = activeConvo?.id === convo.id;

              return (
                <button
                  key={convo.id}
                  onClick={() => setActiveConvo(convo)}
                  className={`w-full p-3.5 text-left transition-all flex items-center gap-3 relative cursor-pointer group ${
                    isActive 
                      ? "bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10 border-l-3 border-[#D4AF37]" 
                      : "hover:bg-gray-50/50 dark:hover:bg-gray-850"
                  }`}
                >
                  <div className="relative shrink-0">
                    <img 
                      src={partner.avatarUrl} 
                      alt="" 
                      className="w-11 h-11 rounded-full object-cover border-2 border-gray-100 dark:border-gray-800"
                      referrerPolicy="no-referrer"
                    />
                    {unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white font-black text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center animate-bounce border border-white dark:border-gray-950">
                        {unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-extrabold text-xs text-gray-950 dark:text-white truncate uppercase tracking-tight group-hover:text-orange-500 transition-colors">
                        {partner.name}
                      </p>
                      <span className="text-[8px] font-bold text-gray-400">
                        {convo.updatedAt ? new Date(convo.updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                    <span className="block text-[8.5px] font-black tracking-wide uppercase text-orange-600 dark:text-orange-400">
                      🎨 {partner.role === "musicien" ? "Musicien" : partner.role === "client" ? "Producteur" : "Showmaker"}
                    </span>
                    <p className={`text-[10.5px] truncate mt-0.5 ${
                      unread > 0 
                        ? "text-gray-950 dark:text-white font-extrabold" 
                        : "text-gray-400 dark:text-gray-500 font-medium"
                    }`}>
                      {(convo.lastMessage as any)?.text || convo.lastMessage || "Aucun message..."}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Chat details thread */}
      <div className={`flex-1 flex flex-col bg-gray-50/50 dark:bg-gray-950/20 ${
        !activeConvo ? "hidden md:flex justify-center items-center p-12 text-center" : "flex"
      }`}>
        
        {creatingConvo && (
          <div className="absolute inset-0 bg-white/70 dark:bg-gray-950/70 z-20 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider animate-pulse">Initialisation du salon de chat...</p>
          </div>
        )}

        {activeConvo ? (
          (() => {
            const partner = getParticipantDetails(activeConvo);
            return (
              <>
                {/* Active Chat Header */}
                <div className="p-3.5 bg-white dark:bg-[#0c101b] border-b border-gray-150 dark:border-gray-850 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Back to list on mobile */}
                    <button 
                      onClick={() => setActiveConvo(null)}
                      className="p-1.5 hover:bg-gray-150 dark:hover:bg-gray-800 text-gray-500 rounded-lg transition md:hidden"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <img 
                      src={partner.avatarUrl} 
                      alt="" 
                      className="w-10 h-10 rounded-full object-cover border border-[#D4AF37]/10 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-left">
                      <p className="font-extrabold text-xs text-gray-950 dark:text-white truncate uppercase tracking-tight flex items-center gap-1">
                        {partner.name}
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      </p>
                      <span className="block text-[8px] font-black uppercase text-[#D4AF37]">
                        {partner.role || "Artiste d'Abidjan"} • 🟢 En ligne
                      </span>
                    </div>
                  </div>
                  
                  {/* Security Header Tip */}
                  <span className="hidden lg:flex items-center gap-1 text-[8.5px] font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg">
                    🛡️ Chat Chiffré Showbiz
                  </span>
                </div>

                {/* Secure Contact Warning Badge */}
                <div className="px-4 py-2 bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10 border-b border-gray-100 dark:border-gray-900 text-left flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-500 leading-normal font-medium">
                    Pour votre sécurité, <b>conservez vos discussions, accords et promesses de cachets</b> dans la messagerie interne. Ne partagez vos coordonnées privées qu'après versement d'un acompte ou signature de contrat.
                  </p>
                </div>

                {/* Message Body stream */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[500px] min-h-[350px]">
                  {messages.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 dark:text-gray-500 space-y-2">
                      <ShieldAlert className="w-8 h-8 text-orange-500/50 mx-auto" />
                      <p className="text-[11px] font-black uppercase tracking-wider">Début de la conversation sécurisée</p>
                      <p className="text-[10px] max-w-xs mx-auto">Présentez proprement votre projet musical ou offre de gombo.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === currentUser.uid;
                      
                      return (
                        <div 
                          key={msg.id} 
                          className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fade-in`}
                        >
                          <div className={`max-w-[75%] rounded-2xl p-3 shadow-xs text-left ${
                            isMe 
                              ? "bg-[#D4AF37] text-[#0B0B0B] font-semibold rounded-tr-none" 
                              : "bg-white dark:bg-[#121622] text-gray-800 dark:text-gray-150 border border-gray-100 dark:border-gray-800/80 rounded-tl-none"
                          }`}>
                            {/* In-chat metadata if not me */}
                            {!isMe && (
                              <span className="block text-[8px] font-black uppercase tracking-wider text-orange-500 mb-1">
                                {partner.name}
                              </span>
                            )}

                            {/* Render different message types */}
                            {msg.type === "image" && msg.mediaUrl ? (
                              <div className="space-y-1.5">
                                <img 
                                  src={msg.mediaUrl} 
                                  alt="Image" 
                                  className="rounded-lg object-cover max-h-40 w-full shadow-inner cursor-pointer"
                                  referrerPolicy="no-referrer"
                                />
                                <p className="text-[11px] leading-relaxed font-semibold">
                                  {msg.text}
                                </p>
                              </div>
                            ) : msg.type === "audio" && msg.mediaUrl ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <Volume2 className="w-4 h-4 text-orange-500 animate-pulse shrink-0" />
                                  <span className="text-[9.5px] font-black uppercase tracking-wider">🎙️ Message Vocal</span>
                                </div>
                                <audio controls className="w-full max-w-xs h-10 shrink-0 text-xs text-black" src={msg.mediaUrl} />
                                <p className="text-[10px] italic leading-tight mt-1 opacity-80">
                                  {msg.text}
                                </p>
                              </div>
                            ) : (
                              <p className="text-[11px] leading-relaxed font-semibold whitespace-pre-wrap select-text">
                                {msg.text}
                              </p>
                            )}

                            {/* Footer meta status */}
                            <div className="flex items-center justify-end gap-1 mt-1 text-[8px] opacity-75 font-semibold">
                              <span>
                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : ""}
                              </span>
                              {isMe && <CheckCheck className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input message form footer panel */}
                <div className="p-3 border-t border-gray-150 dark:border-gray-850 bg-white dark:bg-[#0c101b] space-y-2">
                  
                  {/* Dynamic Realtime Inputs */}
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] font-black tracking-wider text-gray-400 uppercase">⚡ Outils multimédias :</span>
                    <div className="flex gap-2">
                      <label 
                        className={`py-1 px-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 border border-gray-150 dark:border-gray-800 rounded-lg text-[9px] font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-1 cursor-pointer transition-all ${isSending ? 'opacity-50 pointer-events-none' : ''}`}
                        title="Partager une image"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>📷 Image</span>
                        <input type="file" accept="image/*" className="hidden" onChange={onImageSelect} disabled={isSending} />
                      </label>
                      <button 
                        type="button"
                        onClick={handleToggleVoiceRecord}
                        disabled={isSending && !isRecording}
                        className={`py-1 px-2.5 border rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50 ${isRecording ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-500' : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 border-gray-150 dark:border-gray-800 text-emerald-600 dark:text-emerald-400'}`}
                        title={isRecording ? "Arrêter l'enregistrement" : "Enregistrer un vocal"}
                      >
                        {isRecording ? (
                          <>
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span>🛑 Stop REC</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5" />
                            <span>🎙️ Vocal</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Principal Text Input Area */}
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input 
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Tapez votre message sécurisé..."
                      className="flex-1 py-3 px-4 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white"
                      disabled={isSending}
                      required
                    />
                    <button 
                      type="submit"
                      disabled={isSending || !inputText.trim()}
                      className="w-11 h-11 shrink-0 bg-[#D4AF37] hover:bg-[#E06C00] text-white rounded-xl flex items-center justify-center transition disabled:opacity-50 cursor-pointer shadow-md"
                      title="Envoyer le message"
                    >
                      <Send className="w-4 h-4 fill-current rotate-0" />
                    </button>
                  </form>
                </div>
              </>
            );
          })()
        ) : (
          <div className="py-16 text-center space-y-4 max-w-sm mx-auto p-6">
            <div className="w-14 h-14 bg-gradient-to-tr from-[#D4AF37]/10 to-orange-500/10 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <MessageSquare className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Salon de Discussion</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Sélectionnez une discussion active sur l'onglet de gauche pour commencer à travailler, ouvrez vos propositions de recrutement artistiques et négociez vos cachets en toute confiance.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
