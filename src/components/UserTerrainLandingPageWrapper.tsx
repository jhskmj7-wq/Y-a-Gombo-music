import React, { useState, useEffect } from "react";
import { UserTerrainLandingPage } from "./UserTerrainLandingPage";
import { gomboDB, db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { audioSynth } from "../lib/audio";
import { useAuth } from "../AuthContext";
import { Gombo, User, Post, Renfort } from "../types";

export default function UserTerrainLandingPageWrapper() {
  const { currentUser, profile, requireAuth } = useAuth();
  
  const [gombos, setGombos] = useState<Gombo[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [renforts, setRenforts] = useState<Renfort[]>([]);

  // Search & Filters state
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [universalSearchTerm, setUniversalSearchTerm] = useState("");
  const [activeMenu, setActiveMenu] = useState("user_terrain");
  const [terrainTab, setTerrainTab] = useState("all");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [likedGombos, setLikedGombos] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedDateFilter, setSelectedDateFilter] = useState("all");
  const [selectedGomboDetails, setSelectedGomboDetails] = useState<Gombo | null>(null);

  // Modals / Inputs
  const [activeQuickActionModal, setActiveQuickActionModal] = useState<string | null>(null);
  const [verifyGomboIdInput, setVerifyGomboIdInput] = useState("");
  const [verifyGomboIdResult, setVerifyGomboIdResult] = useState<any>(null);
  const [newNoticeTitle, setNewNoticeTitle] = useState("");
  const [newNoticeCategory, setNewNoticeCategory] = useState("Opportunité");
  const [newNoticeBody, setNewNoticeBody] = useState("");

  const addToTerminal = (msg: string) => {
  };

  const requireAuthThen = (fn: () => void) => {
    requireAuth(fn);
  };

  const requireGoogleAuthThen = (fn: () => void) => {
    requireAuth(fn);
  };

  // Real-time Firestore Sync
  useEffect(() => {
    
    // 1. Gombos
    const unsubscribeGombos = gomboDB.listenAllGombos((list) => {
      const publicGombos = list.filter(g => g.status !== "pending_deposit" && (g as any).visible !== false && (g as any).adminValidated !== false && g.status !== "draft" && g.status !== "cancelled" && g.status !== "refuse" && g.status !== "rejected");
      setGombos(publicGombos);
    });

    // 2. Posts (listening to 'posts' AND 'social_posts' collections where Reels & Publications are stored)
    let unsubscribePosts = () => {};
    let unsubscribeSocial = () => {};

    if (db) {
      try {
        let postsList: any[] = [];
        let socialList: any[] = [];

        const syncCombinedPosts = () => {
          const map = new Map<string, any>();
          
          // Add posts first, then social_posts (merging fields)
          [...postsList, ...socialList].forEach(item => {
            if (item && item.id) {
              const existing = map.get(item.id) || {};
              map.set(item.id, { ...existing, ...item });
            }
          });

          const rawList = Array.from(map.values());
          const publicList = rawList.filter(social =>
            social.status !== "pending_deposit" &&
            social.visible !== false &&
            social.adminValidated !== false &&
            social.status !== "draft" &&
            social.status !== "cancelled" &&
            social.status !== "refuse" &&
            social.status !== "rejected"
          );

          const mappedPosts: Post[] = publicList.map((social) => {
            const rawUrl = social.videoUrl || social.mediaUrl || social.url || social.imageUrl;
            return {
              id: social.id,
              userId: social.userId || social.authorId,
              authorName: social.authorName || social.userName || social.artistName || "Artiste Gombo",
              authorArtisticName: social.authorArtisticName || social.title || social.artistName || "Titre",
              authorAvatar: social.authorAvatar || social.userAvatar,
              content: social.content || social.caption || social.text,
              mediaUrl: rawUrl,
              videoUrl: rawUrl,
              url: rawUrl,
              timestamp: social.createdAt || social.timestamp || social.publishedAt,
              likes: social.likesCount || social.likes || 0,
              comments: Array.isArray(social.comments) ? social.comments.length : (typeof social.comments === "number" ? social.comments : (social.commentsCount || 0)),
              type: social.type || (rawUrl ? "video" : "post"),
              isFlagged: social.isFlagged,
              flagReason: social.flagReason,
            };
          });

          mappedPosts.sort((a, b) =>
            new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
          );

          setPosts(mappedPosts);
        };

        const postsRef = collection(db, "posts");
        unsubscribePosts = onSnapshot(postsRef, (snapshot) => {
          postsList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
          syncCombinedPosts();
        }, (err) => {
          console.warn("⚠️ [POSTS_LISTEN] Firestore snapshot listener warning:", err);
        });

        const socialRef = collection(db, "social_posts");
        unsubscribeSocial = onSnapshot(socialRef, (snapshot) => {
          socialList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
          syncCombinedPosts();
        }, (err) => {
          console.warn("⚠️ [SOCIAL_POSTS_LISTEN] Firestore snapshot listener warning:", err);
        });
      } catch (err) {
        console.error("❌ [POSTS_LISTEN] Exception setting up listener:", err);
      }
    }

    // 3. Renforts
    const unsubscribeRenforts = gomboDB.listenAllRenforts((list) => {
      setRenforts(list);
    });

    // 4. Users (Talents)
    gomboDB.getAllUsers().then((list) => {
      setUsers(list);
    }).catch((err) => {
      console.error("Error loading users:", err);
    });

    return () => {
      unsubscribeGombos();
      unsubscribePosts();
      unsubscribeSocial();
      unsubscribeRenforts();
    };
  }, []);

  return (
    <UserTerrainLandingPage
      gombos={gombos}
      users={users}
      posts={posts}
      setPosts={setPosts as any}
      globalSearchTerm={globalSearchTerm}
      setGlobalSearchTerm={setGlobalSearchTerm}
      universalSearchTerm={universalSearchTerm}
      setUniversalSearchTerm={setUniversalSearchTerm}
      activeMenu={activeMenu}
      setActiveMenu={setActiveMenu}
      terrainTab={terrainTab}
      setTerrainTab={setTerrainTab}
      currentSlide={currentSlide}
      setCurrentSlide={setCurrentSlide}
      likedGombos={likedGombos}
      setLikedGombos={setLikedGombos}
      selectedCategory={selectedCategory}
      setSelectedCategory={setSelectedCategory}
      selectedLocation={selectedLocation}
      setSelectedLocation={setSelectedLocation}
      selectedType={selectedType}
      setSelectedType={setSelectedType}
      selectedDateFilter={selectedDateFilter}
      setSelectedDateFilter={setSelectedDateFilter}
      setSelectedGomboDetails={setSelectedGomboDetails}
      requireAuthThen={requireAuthThen}
      requireGoogleAuthThen={requireGoogleAuthThen}
      audioSynth={audioSynth}
      activeQuickActionModal={activeQuickActionModal}
      setActiveQuickActionModal={setActiveQuickActionModal}
      verifyGomboIdInput={verifyGomboIdInput}
      setVerifyGomboIdInput={setVerifyGomboIdInput}
      verifyGomboIdResult={verifyGomboIdResult}
      setVerifyGomboIdResult={setVerifyGomboIdResult}
      newNoticeTitle={newNoticeTitle}
      setNewNoticeTitle={setNewNoticeTitle}
      newNoticeCategory={newNoticeCategory}
      setNewNoticeCategory={setNewNoticeCategory}
      newNoticeBody={newNoticeBody}
      setNewNoticeBody={setNewNoticeBody}
      addToTerminal={addToTerminal}
      renforts={renforts}
    />
  );
}
