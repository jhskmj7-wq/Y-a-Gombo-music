import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, MessageSquare, Share2, Bookmark, Play, Pause, 
  Volume2, Music, Check, User, Send, Sparkles, Star
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

  const [saves, setSaves] = useState(post.savesCount);
  const [hasSaved, setHasSaved] = useState(() => {
    return currentUser ? post.savedBy.includes(currentUser.uid) : false;
  });

  const [followed, setFollowed] = useState(() => {
    const list = JSON.parse(localStorage.getItem("gombo_followed_artists") || "[]");
    return list.includes(post.userId);
  });

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
    } else {
      setHasLiked(false);
      setHasSaved(false);
    }
  }, [currentUser, post]);

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
      sharesCount: post.sharesCount + 1
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-[#1a1a1f] border border-gray-100 dark:border-gray-850 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300"
    >
      {/* 1. Header block: user info */}
      <div className="p-4 sm:p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#FF7A00] to-yellow-500">
            <img 
              src={post.userAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
              alt={post.userName} 
              className="w-full h-full rounded-full object-cover border border-white dark:border-[#1a1a1f]" 
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-gray-950 dark:text-white leading-tight">
                {post.userName}
              </span>
              <Check className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
            </div>
            {post.userRole && (
              <span className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400 block tracking-tight -mt-0.5">
                {post.userRole}
              </span>
            )}
          </div>
        </div>

        {/* Follow/Unfollow Artist Button */}
        <button
          onClick={handleFollowToggle}
          className={`px-3.5 py-1.5 text-xs font-black rounded-full transition-all border active:scale-95 ${
            followed 
              ? "bg-gray-100 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700" 
              : "bg-orange-500 border-orange-500 text-white hover:bg-orange-650"
          }`}
        >
          {followed ? "Abonné" : "+ Suivre"}
        </button>
      </div>

      {/* 2. Content Body Caption */}
      <div className="px-4 sm:px-5 pb-3">
        <p className="text-xs sm:text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
          {post.caption}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {post.tags.map((tag) => (
            <span key={tag} className="text-[11px] font-black text-orange-600 dark:text-orange-400">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* 3. Media Cover artwork and Audio soundtrack */}
      {post.audioUrl && (
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-end p-4">
              
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
                  <span className="text-[10px] uppercase font-black text-orange-400 tracking-wider flex items-center gap-1">
                    <Music className="w-3 h-3 animate-pulse text-orange-500" />
                    PRESTATION DEEMO
                  </span>
                  <p className="text-white text-sm font-bold truncate leading-snug">
                    {post.title}
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
      )}

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
                      src={com.userAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
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
