import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, MessageSquare, Share2, Bookmark, Play, Pause, 
  Volume2, Music, Check, User, Send, Sparkles, Star, Briefcase, Flag
} from "lucide-react";
import { SocialPost, PostComment, UserProfile } from "../types";
import { gomboDB } from "../firebase";

interface SocialPostCardProps {
  key?: string;
  post: SocialPost;
  currentUser: any;
  currentUserProfile: UserProfile | null;
  playingPostId: string | null;
  setPlayingPostId: (id: string | null) => void;
  onTriggerLogin: () => void;
}

export default function SocialPostCard({
  post,
  currentUser,
  currentUserProfile,
  playingPostId,
  setPlayingPostId,
  onTriggerLogin
}: SocialPostCardProps) {
  // Local reactive states
  const [likes, setLikes] = useState(post.likesCount);
  const [hasLiked, setHasLiked] = useState(() => {
    return currentUser ? post.likedBy.includes(currentUser.uid) : false;
  });

  const [encourages, setEncourages] = useState(post.encouragesCount || 0);
  const [hasEncouraged, setHasEncouraged] = useState(() => {
    return currentUser && post.encouragedBy ? post.encouragedBy.includes(currentUser.uid) : false;
  });

  const [hasReported, setHasReported] = useState(() => {
    return currentUser && post.reportedBy ? post.reportedBy.includes(currentUser.uid) : false;
  });

  const [saves, setSaves] = useState(post.savesCount);
  const [hasSaved, setHasSaved] = useState(() => {
    return currentUser ? post.savedBy.includes(currentUser.uid) : false;
  });

  const [followed, setFollowed] = useState(() => {
    const list = JSON.parse(localStorage.getItem("gombo_followed_artists") || "[]");
    return list.includes(post.userId);
  });

  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let active = true;
    gomboDB.getUserProfile(post.userId).then((profile) => {
      if (active && profile) {
        setAuthorProfile(profile);
      }
    });
    return () => {
      active = false;
    };
  }, [post.userId]);

  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<PostComment[]>(post.comments);
  const [commentInput, setCommentInput] = useState("");

  // Toast / Share alert state
  const [shareToast, setShareToast] = useState(false);

  // Audio Player States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync like & saved status if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setHasLiked(post.likedBy.includes(currentUser.uid));
      setHasSaved(post.savedBy.includes(currentUser.uid));
      setHasEncouraged(post.encouragedBy ? post.encouragedBy.includes(currentUser.uid) : false);
      setHasReported(post.reportedBy ? post.reportedBy.includes(currentUser.uid) : false);
    } else {
      setHasLiked(false);
      setHasSaved(false);
      setHasEncouraged(false);
      setHasReported(false);
    }
  }, [currentUser, post]);

  // Encourager / Clap Action
  const handleEncourageToggle = async () => {
    if (!currentUser) {
      onTriggerLogin();
      return;
    }

    let updatedEncouragedBy = post.encouragedBy ? [...post.encouragedBy] : [];
    let newEncourageCount = encourages;

    if (hasEncouraged) {
      updatedEncouragedBy = updatedEncouragedBy.filter(uid => uid !== currentUser.uid);
      newEncourageCount = Math.max(0, newEncourageCount - 1);
    } else {
      updatedEncouragedBy.push(currentUser.uid);
      newEncourageCount += 1;
    }

    setEncourages(newEncourageCount);
    setHasEncouraged(!hasEncouraged);

    // Save update in DB
    await gomboDB.updateSocialPost(post.id, {
      encouragesCount: newEncourageCount,
      encouragedBy: updatedEncouragedBy
    });

    // Notify Author
    if (!hasEncouraged && post.userId !== currentUser.uid) {
      try {
        const senderName = currentUserProfile ? `${currentUserProfile.firstName} ${currentUserProfile.lastName}` : "Un artiste";
        await gomboDB.sendNotification({
          userId: post.userId,
          title: "👏 Talent Encouragé !",
          message: `${senderName} vous envoie des encouragements : « Force à toi, l'artiste ! 🔥 »`,
          type: "general"
        });
      } catch (err) {
        console.error("⚠️ Failed to dispatch encouragement notification:", err);
      }
    }
  };

  // Signaler / Report Action
  const handleReportAction = async () => {
    if (!currentUser) {
      onTriggerLogin();
      return;
    }

    if (hasReported) {
      alert("Vous avez déjà signalé cette publication aux modérateurs.");
      return;
    }

    if (!window.confirm("Voulez-vous vraiment signaler cette publication pour contenu inapproprié ou abusif ?")) {
      return;
    }

    let updatedReportedBy = post.reportedBy ? [...post.reportedBy] : [];
    const newReportsCount = (post.reportsCount || 0) + 1;
    updatedReportedBy.push(currentUser.uid);

    setHasReported(true);

    // Save update in DB
    await gomboDB.updateSocialPost(post.id, {
      reportsCount: newReportsCount,
      reportedBy: updatedReportedBy
    });

    alert("Merci d'avoir signalé cette publication. Notre équipe d'Abidjan l'examinera dans les plus brefs délais.");
  };

  // Handle global play state syncing
  useEffect(() => {
    if (playingPostId !== post.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      }
    }
  }, [playingPostId]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (playingPostId === post.id) {
        setPlayingPostId(null);
      }
    } else {
      // Pause any currently playing post first
      setPlayingPostId(post.id);
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const value = Number(e.target.value);
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  // Follow Action
  const handleFollowToggle = () => {
    if (!currentUser) {
      onTriggerLogin();
      return;
    }
    const list = JSON.parse(localStorage.getItem("gombo_followed_artists") || "[]");
    let newList;
    if (followed) {
      newList = list.filter((id: string) => id !== post.userId);
    } else {
      newList = [...list, post.userId];
    }
    localStorage.setItem("gombo_followed_artists", JSON.stringify(newList));
    setFollowed(!followed);
  };

  // Like Action
  const handleLikeToggle = async () => {
    if (!currentUser) {
      onTriggerLogin();
      return;
    }

    let updatedLikedBy = [...post.likedBy];
    let newLikeCount = likes;

    if (hasLiked) {
      updatedLikedBy = updatedLikedBy.filter(uid => uid !== currentUser.uid);
      newLikeCount = Math.max(0, newLikeCount - 1);
    } else {
      updatedLikedBy.push(currentUser.uid);
      newLikeCount += 1;
    }

    setLikes(newLikeCount);
    setHasLiked(!hasLiked);

    // Save update in DB
    await gomboDB.updateSocialPost(post.id, {
      likesCount: newLikeCount,
      likedBy: updatedLikedBy
    });
  };

  // Save Action
  const handleSaveToggle = async () => {
    if (!currentUser) {
      onTriggerLogin();
      return;
    }

    let updatedSavedBy = [...post.savedBy];
    let newSaveCount = saves;

    if (hasSaved) {
      updatedSavedBy = updatedSavedBy.filter(uid => uid !== currentUser.uid);
      newSaveCount = Math.max(0, newSaveCount - 1);
    } else {
      updatedSavedBy.push(currentUser.uid);
      newSaveCount += 1;
    }

    setSaves(newSaveCount);
    setHasSaved(!hasSaved);

    // Save update in DB
    await gomboDB.updateSocialPost(post.id, {
      savesCount: newSaveCount,
      savedBy: updatedSavedBy
    });
  };

  // Comment Submission Action
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onTriggerLogin();
      return;
    }

    if (!commentInput.trim()) return;

    const newComment: PostComment = {
      id: "com_" + Math.random().toString(36).substring(2, 9),
      userId: currentUser.uid,
      userName: currentUserProfile ? `${currentUserProfile.firstName} ${currentUserProfile.lastName}` : "Artiste Anonyme",
      userAvatar: currentUserProfile?.avatarUrl,
      text: commentInput.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedComments = [...commentsList, newComment];
    setCommentsList(updatedComments);
    setCommentInput("");

    // Persist list
    await gomboDB.updateSocialPost(post.id, {
      comments: updatedComments
    });

    // Alert the post owner via real Firestore notifications
    if (post.userId !== currentUser.uid) {
      try {
        const authorName = currentUserProfile ? `${currentUserProfile.firstName} ${currentUserProfile.lastName}` : "Un artiste";
        await gomboDB.sendNotification({
          userId: post.userId,
          title: "💬 Nouveau Commentaire !",
          message: `${authorName} a commenté votre post : "${newComment.text.substring(0, 35)}${newComment.text.length > 35 ? "..." : ""}"`,
          type: "general"
        });
      } catch (err) {
        console.error("⚠️ Failed to dispatch comment notification:", err);
      }
    }
  };

  // Share Action (Copy to clipboard simulation)
  const handleShare = () => {
    const dummyUrl = `${window.location.origin}/posts/${post.id}`;
    navigator.clipboard.writeText(dummyUrl).then(() => {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    });

    // Increment share counter quietly
    gomboDB.updateSocialPost(post.id, {
      sharesCount: (post.sharesCount || 0) + 1
    });
  };

  const getCategoryBadge = (category?: string) => {
    const categories: Record<string, { label: string; style: string }> = {
      demo: { label: "🎤 Démo musicale", style: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
      recherche: { label: "🎹 Recherche d'instrumentiste", style: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
      renfort: { label: "🎼 Renfort Express", style: "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400" },
      concert: { label: "🎉 Annonce de concert", style: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-400" },
      opportunite: { label: "💼 Opportunité/Gombo", style: "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400" },
      aide: { label: "🙏 Besoin d'aide", style: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400" },
      showbiz: { label: "📢 Actualité Showbiz", style: "bg-slate-100 text-slate-800 dark:bg-slate-800/40 dark:text-slate-300" },
      coeur: { label: "🔥 Coup de cœur", style: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400" },
    };
    return categories[category || ""] || null;
  };

  const getGamifiedBadge = (gigsCount = 0, isCertified = false) => {
    if (isCertified || gigsCount >= 15) {
      return { label: "👑 Niveau Boss", style: "text-amber-600 dark:text-[#D4AF37] bg-amber-500/10 border border-amber-500/25" };
    }
    if (gigsCount >= 8) {
      return { label: "🥇 Talent Vérifié", style: "text-rose-550 dark:text-rose-400 bg-rose-500/10 border border-rose-500/25" };
    }
    if (gigsCount >= 3) {
      return { label: "🥈 Talent Actif", style: "text-emerald-600 dark:text-[#D4AF37] bg-emerald-500/10 border border-[#D4AF37]/25" };
    }
    return { label: "🥉 Nouveau Talent", style: "text-blue-550 dark:text-blue-400 bg-blue-500/10 border border-blue-500/25" };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-[#1a1a1f] border rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 ${
        post.urgent 
          ? "border-orange-400 dark:border-orange-500/50 shadow-orange-500/5 bg-gradient-to-tr from-orange-500/[0.02] to-transparent ring-2 ring-orange-400/10" 
          : "border-gray-100 dark:border-gray-850"
      }`}
    >
      {/* 1. Header block: user info */}
      <div className="p-4 sm:p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#FF7A00] to-yellow-500">
            <img 
              src={authorProfile?.avatarUrl || authorProfile?.photoURL || post.userAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
              alt={post.userName} 
              className="w-full h-full rounded-full object-cover border border-white dark:border-[#1a1a1f]" 
            />
          </div>
          <div>
             <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-sm text-gray-950 dark:text-white leading-tight">
                  {post.userName || "Artiste Gombo"}
                </span>
                {(() => {
                  const gigsCount = authorProfile?.gigsCompleted || 0;
                  const isCertified = authorProfile?.isCertified || authorProfile?.isVerified || false;
                  const badge = getGamifiedBadge(gigsCount, isCertified);
                  return (
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider leading-none ${badge.style}`}>
                      {badge.label}
                    </span>
                  );
                })()}
             </div>
             <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
               {post.userRole && (
                 <span className="text-[9px] uppercase font-bold text-orange-600 dark:text-orange-400 tracking-tight">
                   {post.userRole === "musicien" ? "🎸 Musicien" : post.userRole === "client" ? "💼 Recruteur" : "🦁 Groupe"}
                 </span>
               )}
               {post.type && (
                 <>
                   <span className="text-[9px] text-gray-300 dark:text-gray-600">|</span>
                   <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md ${
                     post.type === "gombo" 
                       ? "bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-[#FF7A00]" 
                       : post.type === "demo"
                       ? "bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400"
                       : "bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400"
                   }`}>
                     {post.type === "gombo" ? "💼 GOMBO" : post.type === "demo" ? "🎵 DÉMO" : "📢 ANNONCE"}
                   </span>
                 </>
               )}
             </div>
           </div>
         </div>
  
         <div className="flex items-center gap-2">
           {post.urgent && (
              <span className="text-[10px] uppercase font-black bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-2.5 py-1 rounded-full flex items-center gap-0.5 shadow-sm leading-none animate-pulse">
                🚀 Boosté
              </span>
            )}
            {/* Follow/Unfollow Artist Button */}
            <button
              onClick={handleFollowToggle}
              className={`px-3 py-1.5 text-[10px] font-black rounded-full transition-all border active:scale-95 ${
                followed 
                  ? "bg-gray-100 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700" 
                  : "bg-orange-500 border-orange-500 text-white hover:bg-orange-650"
              }`}
            >
              {followed ? "Abonné" : "+ Suivre"}
            </button>

            {/* Signal 🚩 button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReportAction();
              }}
              className={`p-1.5 rounded-xl transition-all border active:scale-90 flex items-center justify-center cursor-pointer ${
                hasReported
                  ? "bg-red-500/10 border-red-550/25 text-red-500"
                  : "bg-gray-50 hover:bg-red-50 dark:bg-gray-850/60 dark:border-gray-800 text-gray-400 hover:text-red-500"
              }`}
              title="Signaler cette publication"
            >
              <Flag className="w-3.5 h-3.5 fill-current" />
            </button>
         </div>
       </div>
  
       {/* 2. Content Body Caption */}
       <div 
         onClick={() => setShowComments(!showComments)}
         className="px-4 sm:px-5 pb-3.5 space-y-2.5 cursor-pointer hover:bg-gray-50/55 dark:hover:bg-white/[0.015] rounded-2xl transition-all duration-200 py-1.5 mx-1"
       >
         {/* Obligatory Category Badge display */}
         {(() => {
           const badge = getCategoryBadge(post.postCategory || post.type);
           if (!badge) return null;
           return (
             <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border dark:border-white/[0.03] ${badge.style}`}>
               {badge.label}
             </span>
           );
         })()}

         {post.title && (
           <h4 className="text-xs font-black text-gray-950 dark:text-white uppercase tracking-tight flex items-center gap-1">
             {post.type === "gombo" && <Briefcase className="w-3.5 h-3.5 text-[#FF7A00]" />}
             {post.type === "demo" && <Music className="w-3.5 h-3.5 text-[#7C3AED]" />}
             {post.type === "annonce" && <MessageSquare className="w-3.5 h-3.5 text-teal-600" />}
             {post.title}
           </h4>
         )}
         
         <p className="text-xs text-gray-650 dark:text-gray-300 leading-relaxed font-semibold">
           {post.caption}
         </p>

         {/* TYPE 1: GOMBO METADATA BLOCK */}
         {post.type === "gombo" && (
           <div className="grid grid-cols-2 gap-2 bg-orange-50/15 dark:bg-orange-950/5 p-3.5 rounded-2xl border border-orange-100/30 dark:border-orange-950/20 text-[11px] font-bold text-gray-750 dark:text-gray-300">
             <div className="flex items-center gap-1.5 col-span-2">
               <span className="text-gray-400 font-semibold">Recherche:</span>
               <span className="font-extrabold text-[#FF7A00] uppercase tracking-wide">{post.specialty || "Musicien"}</span>
             </div>
             <div className="flex items-center gap-1.5">
               <span className="text-gray-400 font-semibold">Cachet:</span>
               <span className="font-extrabold text-[#FF7A00]">{post.budget ? `${Number(post.budget).toLocaleString()} FCFA` : "A débattre"}</span>
             </div>
             <div className="flex items-center gap-1.5">
               <span className="text-gray-400 font-semibold">Commune:</span>
               <span className="font-extrabold">{post.commune || "Abidjan"}</span>
             </div>
             {post.urgent && (
               <div className="col-span-2 flex items-center gap-1 text-[9px] font-black text-[#FF7A00] bg-orange-500/10 w-fit px-2 py-0.5 rounded-md uppercase tracking-widest mt-1 animate-pulse">
                 🔥 Urgent
               </div>
             )}
           </div>
         )}

         {/* TYPE 2: DÉMO METADATA BADGE */}
         {post.type === "demo" && post.genre && (
           <div className="inline-flex items-center gap-1.5 bg-purple-50/20 dark:bg-purple-950/10 border border-purple-100/30 dark:border-purple-900/30 px-3 py-1 rounded-full text-[10px] font-black text-[#7C3AED] dark:text-purple-400 uppercase tracking-wide">
             🎵 Style: {post.genre}
           </div>
         )}

         {/* TYPE 3: ANNONCE METADATA BLOCK */}
         {post.type === "annonce" && (
           <div className="grid grid-cols-2 gap-2 bg-teal-50/15 dark:bg-teal-950/5 p-3.5 rounded-2xl border border-teal-100/30 dark:border-teal-950/20 text-[11px] font-bold text-gray-750 dark:text-gray-300">
             <div className="flex items-center gap-1.5">
               <span className="text-gray-400 font-semibold">Spécialité:</span>
               <span className="font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wide">{post.specialty || "Artiste"}</span>
             </div>
             <div className="flex items-center gap-1.5">
               <span className="text-gray-400 font-semibold">Dispo:</span>
               <span className="font-extrabold text-teal-600 dark:text-teal-400">{post.availability || "Disponible"}</span>
             </div>
             <div className="flex items-center gap-1.5 col-span-2">
               <span className="text-gray-400 font-semibold">Commune:</span>
               <span className="font-extrabold">{post.commune || "Abidjan"}</span>
             </div>
           </div>
         )}
 
         <div className="flex flex-wrap gap-1.5 pt-1">
           {post.tags?.filter(Boolean).map((tag) => (
             <span key={tag} className="text-[10px] font-black bg-gray-50 dark:bg-gray-850/60 text-gray-500 rounded px-2 py-0.5 border border-gray-100 dark:border-gray-800">
               #{tag}
             </span>
           ))}
         </div>
       </div>
 
       {/* 3. Media Cover artwork and Audio/Video soundtrack */}
       {post.audioUrl ? (
         <div className="px-4 sm:px-5 pb-4">
           <div className="relative group rounded-2xl overflow-hidden shadow-xs border border-gray-100 dark:border-gray-800">
             {/* Native background audio thread */}
             <audio 
               ref={audioRef}
               src={post.audioUrl}
               onTimeUpdate={onTimeUpdate}
               onLoadedMetadata={onLoadedMetadata}
               className="hidden"
             />
 
             {/* Simulated live visual block */}
             <img 
               src={post.imageUrl || "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=500"} 
               alt="Track Cover" 
               className="w-full h-44 object-cover object-center group-hover:scale-102 transition-transform duration-500"
             />
             
             {/* Premium blur soundtrack visual shadow */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-4">
               
               <div className="flex items-center gap-3">
                 {/* Round play control button */}
                 <button
                   onClick={handlePlayPause}
                   className="w-11 h-11 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-lg transition-transform shrink-0"
                 >
                   {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-0.5" />}
                 </button>
 
                 {/* Track text and progress timeline */}
                 <div className="flex-1 min-w-0">
                   <span className="text-[9px] uppercase font-extrabold text-orange-400 tracking-wider flex items-center gap-1">
                     <Music className="w-3 h-3 animate-pulse text-orange-500" />
                     DÉMO MUSICALE
                   </span>
                   <p className="text-white text-sm font-bold truncate leading-snug">
                     {post.title || "Titre de Démo"}
                   </p>
                   {post.beatProd && (
                     <p className="text-[10px] text-gray-300 truncate -mt-0.5">
                       Prod: {post.beatProd}
                     </p>
                   )}
                 </div>
               </div>
 
               {/* Progress timeline slider */}
               <div className="mt-3 flex items-center gap-2">
                 <span className="text-[10px] font-mono text-gray-300">{formatTime(currentTime)}</span>
                 <input
                   type="range"
                   min={0}
                   max={duration || 100}
                   value={currentTime}
                   onChange={handleSeek}
                   className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-orange-500 focus:outline-none"
                 />
                 <span className="text-[10px] font-mono text-gray-300">{formatTime(duration)}</span>
               </div>
 
             </div>
           </div>
         </div>
       ) : post.videoUrl ? (
         <div className="px-4 sm:px-5 pb-4">
           <video 
             src={post.videoUrl} 
             controls 
             preload="metadata"
             referrerPolicy="no-referrer"
             className="w-full max-h-80 bg-black rounded-2xl border border-gray-150 dark:border-gray-800 object-contain shadow-xs"
           />
         </div>
       ) : post.imageUrl ? (
         <div className="px-4 sm:px-5 pb-4">
           <img 
             src={post.imageUrl} 
             alt={post.title} 
             className="w-full h-48 object-cover rounded-2xl border border-gray-150 dark:border-gray-800 shadow-xs"
           />
         </div>
       ) : null}

      {/* 4. Footer interactions buttons (Likes, Comments, Shares, Saves) */}
      <div className="px-4 sm:px-5 py-3.5 bg-gray-50/50 dark:bg-gray-850/20 border-t border-gray-50 dark:border-gray-850 flex items-center justify-between">
        {/* Buttons Group */}
        <div className="flex items-center gap-5">
          {/* Like button */}
          <button
            onClick={handleLikeToggle}
            className={`flex items-center gap-1.5 focus:outline-none transition-transform active:scale-90 ${
              hasLiked ? "text-red-500 font-extrabold" : "text-gray-500 dark:text-gray-400 hover:text-red-500"
            }`}
          >
            <Heart className={`w-4.5 h-4.5 ${hasLiked ? "fill-current" : ""}`} />
            <span className="text-xs font-bold font-mono">{likes}</span>
          </button>

          {/* Encourager Claps button */}
          <button
            onClick={handleEncourageToggle}
            className={`flex items-center gap-1.5 focus:outline-none transition-transform active:scale-90 ${
              hasEncouraged ? "text-amber-500 dark:text-orange-400 font-bold" : "text-gray-500 dark:text-gray-400 hover:text-orange-500"
            }`}
            title="Encourager l'artiste !"
          >
            <span className="text-sm">👏</span>
            <span className="text-xs font-bold font-mono">{encourages}</span>
          </button>

          {/* Comment button */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 focus:outline-none transition-colors ${
              showComments ? "text-orange-500" : "text-gray-500 dark:text-gray-400 hover:text-orange-500"
            }`}
          >
            <MessageSquare className="w-4.5 h-4.5" />
            <span className="text-xs font-bold font-mono">{commentsList.length}</span>
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-orange-500 focus:outline-none active:scale-95"
          >
            <Share2 className="w-4.5 h-4.5" />
            <span className="text-xs font-bold font-mono hidden sm:inline">Partager</span>
          </button>
        </div>

        {/* Save/Bookmark button */}
        <button
          onClick={handleSaveToggle}
          className={`p-1 flex items-center gap-1 focus:outline-none transition-transform active:scale-90 ${
            hasSaved ? "text-orange-500" : "text-gray-500 dark:text-gray-400 hover:text-orange-500"
          }`}
        >
          <Bookmark className={`w-4.5 h-4.5 ${hasSaved ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* 5. Toast alerts section */}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0 }}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[11px] font-bold text-center uppercase"
          >
            Lien de la démo copié dans le presse-papiers ! 📋
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Comments Collapsible Drawer List */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0 }}
            className="bg-gray-100/30 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-850 px-4 sm:px-5 py-4"
          >
            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block mb-3">
              Commentaires récemments postés ({commentsList.length})
            </span>

            {/* List scroll panel */}
            <div className="space-y-3 max-h-48 overflow-y-auto mb-4 pr-1 scrollbar-thin scrollbar-thumb-orange-500">
              {commentsList.length === 0 ? (
                <p className="text-[11px] text-gray-500 text-center py-2">
                  Aucun commentaire. Soyez le premier à donner votre avis de pro !
                </p>
              ) : (
                commentsList.map((com) => (
                  <div key={com.id} className="text-xs flex items-start gap-2.5 bg-white dark:bg-[#1f1f25] p-3 rounded-2xl border border-gray-50 dark:border-gray-800">
                    <img 
                      src={
                        com.userId === currentUser?.uid 
                          ? (currentUserProfile?.avatarUrl || currentUserProfile?.photoURL || com.userAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150")
                          : (com.userAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150")
                      } 
                      alt={com.userName} 
                      className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-gray-950 dark:text-white leading-normal">
                        {com.userName}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                        {com.text}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Write a comment form */}
            <form onSubmit={handleCommentSubmit} className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Exprimez-vous (conseil showbiz, encouragements...)"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-white dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white"
              />
              <button
                type="submit"
                className="p-2.5 bg-[#FF7A00] text-white rounded-xl active:scale-95 transition-transform"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
