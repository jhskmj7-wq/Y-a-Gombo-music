import React, { useState, useEffect } from "react";
import { UserTerrainLandingPage } from "./UserTerrainLandingPage";
import { gomboDB } from "../firebase";
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
    console.log("[LANDING TERMINAL]:", msg);
  };

  const requireAuthThen = (fn: () => void) => {
    requireAuth(fn);
  };

  const requireGoogleAuthThen = (fn: () => void) => {
    requireAuth(fn);
  };

  // Real-time Firestore Sync
  useEffect(() => {
    console.log("⚡ [UserTerrainLandingPageWrapper] Starting Firestore subscriptions");
    
    // 1. Gombos
    const unsubscribeGombos = gomboDB.listenAllGombos((list) => {
      setGombos(list);
    });

    // 2. Posts
    const unsubscribePosts = gomboDB.listenSocialPosts((list) => {
      const mappedPosts: Post[] = list.map((social) => ({
        id: social.id,
        userId: social.userId,
        authorName: social.userName || "Artiste Gombo",
        authorArtisticName: social.title || "Titre",
        authorAvatar: social.userAvatar,
        content: social.caption,
        mediaUrl: social.imageUrl || social.videoUrl,
        timestamp: social.createdAt,
        likes: social.likesCount || 0,
        comments: social.comments ? social.comments.length : 0,
        isFlagged: social.isFlagged,
        flagReason: social.flagReason,
      }));
      setPosts(mappedPosts);
    });

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
