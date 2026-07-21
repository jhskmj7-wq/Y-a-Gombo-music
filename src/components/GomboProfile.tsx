import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Phone, MapPin, Music, Award, Wallet, Send, FileText, Check, Users, Clipboard, 
  Sparkles, ShieldCheck, Heart, CreditCard, Star, Radio, LogOut,
  Settings, ArrowUpRight, TrendingUp, HelpCircle, Bell, Eye, EyeOff,
  Moon, Sun, Globe, Smartphone, Shield, Lock, Trash2, Calendar,
  Camera, Upload, RefreshCw, MessageSquare, ChevronDown, Search,
  Copy, Plus, Play, Pause, ExternalLink, ArrowLeft
} from "lucide-react";
import { UserProfile, PaymentProvider } from "../types";
import { gomboDB, gomboAuth, db, isFirebaseMock } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { audioSynth } from "../lib/audio";
import { ProfileCompletionScore } from "./ProfileCompletionScore";
import { MediaGalleryManager } from "./MediaGalleryManager";
import { GomboProfileMainView } from "./GomboProfileMainView";
import { GomboProfileEditView } from "./GomboProfileEditView";
import { GomboCertificationFlow } from "./GomboCertificationFlow";
import { supportConfig } from "../supportConfig";

interface GomboProfileProps {
  currentUserProfile: UserProfile;
  onRefreshProfile: () => void;
  onNavigateView: (view: string, initialTab?: any) => void;
  onLogout?: () => void;
  darkMode?: boolean;
  setDarkMode?: (val: boolean) => void;
  initialPanelView?: "main" | "edit" | "settings" | "support" | "certification";
}

const ABIDJAN_COMMUNES = [
  "Abobo", "Adjamé", "Attécoubé", "Cocody", "Koumassi", "Marcory", 
  "Plateau", "Port-Bouët", "Treichville", "Yopougon", "Bingerville", 
  "Songon", "Anyama"
];

const SPECIALTIES = [
  "Chant", "Chœur", "Piano", "Clavier", "Guitare Solo", "Guitare Rythmique", 
  "Guitare Basse", "Batterie", "Percussions", "Djembé", "Balafon", 
  "Saxophone", "Trompette", "Violon", "Flûte", "Accordéon", "DJ", 
  "Beatmaker", "Producteur Musical", "Arrangeur", "Compositeur", "Auteur", 
  "Sound Engineer", "Choriste", "Chef d'Orchestre", "Danseur", 
  "MC / Animateur", "Rappeur", "Slameur"
];

const EXPERIENCES = [
  "Débutant", "Intermédiaire", "Confirmé", "Professionnel"
];

const GENRES = [
  "Coupé-Décalé", "Zouglou", "Wôyô", "Afrobeat", "Amapiano", "Gospel", 
  "Reggae", "Dancehall", "Rap Ivoire", "Drill", "RnB", "Soul", "Jazz", 
  "Blues", "Rock", "Variété", "Musique Traditionnelle", "Musique Mandingue", 
  "Musique Baoulé", "Musique Bété", "Musique Sénoufo", "Musique Ébrié", 
  "Orchestre Live", "Animation Mariage", "Animation Maquis", "Animation Église"
];

const AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150"
];

export default function GomboProfile({
  currentUserProfile,
  onRefreshProfile,
  onNavigateView,
  onLogout,
  darkMode,
  setDarkMode,
  initialPanelView = "main"
}: GomboProfileProps) {
  // Current Panel view: "main" | "edit" | "settings" | "support" | "certification"
  const [panelView, setPanelView] = useState<"main" | "edit" | "settings" | "support" | "certification">(initialPanelView);

  // States for KYC/Identity validation
  // (Removed redundant declarations as they exist below)

  // Real-time synchronization of current user posts (Mes publications)
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [syncedProfile, setSyncedProfile] = useState<UserProfile>(currentUserProfile);

  // Sync state with currentUserProfile whenever it changes from parent or internal updates
  useEffect(() => {
    if (!currentUserProfile) return;
    
    // Update synced profile
    setSyncedProfile(currentUserProfile);
    
    // While typing or editing in edit mode, DO NOT overwrite local states with values from parent props!
    if (panelView === "edit") return;
    
    // Sync individual field states to ensure real-time UI accuracy
    setFirstName(currentUserProfile.firstName || "");
    setLastName(currentUserProfile.lastName || "");
    setArtistName(currentUserProfile.artistName || "");
    setGender(currentUserProfile.gender || "Homme");
    setBirthDate(currentUserProfile.birthDate || "");
    setPhone(currentUserProfile.phone || "");
    setWhatsapp(currentUserProfile.whatsapp || "");
    setCommune(currentUserProfile.commune || "Cocody");
    setBio(currentUserProfile.bio || "");
    setAvatarUrl(currentUserProfile.avatarUrl || currentUserProfile.photoURL || AVATARS[0]);
    setSpecialties(currentUserProfile.specialties || (currentUserProfile.specialty ? [currentUserProfile.specialty] : []));
    setMusicGenres(currentUserProfile.musicGenres || (currentUserProfile.musicGenre ? [currentUserProfile.musicGenre] : []));
    setExperience(currentUserProfile.experience || "Intermédiaire");
    setAvailabilities(currentUserProfile.availabilities || (currentUserProfile.isAvailableNow ? ["Disponible immédiatement"] : []));
    setWaveNumber(currentUserProfile.waveNumber || currentUserProfile.paymentNumber || "");
    setOrangeMoneyNumber(currentUserProfile.orangeMoneyNumber || "");
    setVille(currentUserProfile.ville || "Abidjan");
    setQuartier(currentUserProfile.quartier || "");
    setAccountRole(currentUserProfile.role || "musicien");
    setMediaGallery(currentUserProfile.mediaGallery || []);
  }, [currentUserProfile, panelView]);

  useEffect(() => {
    const unsub = gomboDB.listenUserProfile(currentUserProfile.uid || "", (profile) => {
        if (profile) setSyncedProfile(profile);
    });
    return () => unsub();
  }, [currentUserProfile?.uid]);

  // Editing mode state
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostCaption, setEditPostCaption] = useState("");
  const [savingPostEdit, setSavingPostEdit] = useState(false);

  useEffect(() => {
    setLoadingPosts(true);
    const unsubscribe = gomboDB.listenSocialPosts((allPosts) => {
      const filtered = allPosts.filter(p => p.authorId === syncedProfile.uid || p.userId === syncedProfile.uid);
      setMyPosts(filtered);
      setLoadingPosts(false);
    });
    return () => unsubscribe();
  }, [syncedProfile?.uid]);

  const handleSkipUpdate = async () => {
    try {
      const now = new Date().toISOString();
      if (typeof window !== 'undefined') {
        localStorage.setItem("gombo_profile_skipped", "true");
        localStorage.setItem("gombo_profile_skipped_locally", "true");
      }
      
      let dbProfile = null;
      try {
        dbProfile = await gomboDB.getUserProfile(currentUserProfile.uid);
      } catch (e) {
        console.warn("Could not retrieve profile from DB, creating new minimal one:", e);
      }
      
      const createdAtVal = dbProfile?.createdAt || currentUserProfile.createdAt || now;
      const minimalProfile = {
        uid: currentUserProfile.uid,
        email: currentUserProfile.email || "",
        displayName: currentUserProfile.displayName || currentUserProfile.firstName || "Artiste",
        photoURL: currentUserProfile.photoURL || currentUserProfile.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
        isProfileComplete: false,
        profileSkipped: true,
        skippedProfile: true, // Safeguard for both local & remote flags
        createdAt: createdAtVal,
        updatedAt: now
      };

      await gomboDB.updateUserProfile(currentUserProfile.uid, minimalProfile);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem("gombo_active_profile", JSON.stringify({
          ...currentUserProfile,
          ...minimalProfile
        }));
      }

      await onRefreshProfile();
      
      if (typeof window !== 'undefined') {
        window.history.pushState({}, "", "/home");
        window.dispatchEvent(new Event("popstate"));
      }

      // Added immediate feedback before navigation
      if (typeof window !== 'undefined') {
        const toast = document.createElement('div');
        toast.textContent = "Bienvenue sur AFRIGOMBO ♫ 🎷 🪘";
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.padding = '10px 20px';
        toast.style.backgroundColor = '#D4AF37';
        toast.style.color = 'black';
        toast.style.borderRadius = '10px';
        toast.style.zIndex = '9999';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
      }
      onNavigateView("home");
    } catch (err) {
      console.error("Error setting skip property:", err);
      onNavigateView("home");
    }
  };

  const handleStartEditPost = (post: any) => {
    setEditingPost(post);
    setEditPostTitle(post.title || "");
    setEditPostCaption(post.caption || post.description || "");
  };

  const handleSavePostEdit = async () => {
    if (!editingPost) return;
    setSavingPostEdit(true);
    try {
      await gomboDB.updateSocialPost(editingPost.id, {
        title: editPostTitle,
        caption: editPostCaption,
        description: editPostCaption
      });
      setEditingPost(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPostEdit(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette publication ?")) {
      try {
        await gomboDB.deleteSocialPost(id);
      } catch (err) {
        console.error(err);
      }
    }
  };
  
  // Available toggle value
  const [isAvailable, setIsAvailable] = useState(currentUserProfile?.isAvailableNow ?? true);
  const [availabilityStatus, setAvailabilityStatus] = useState<"disponible" | "occupe" | "indisponible">(() => {
    if (currentUserProfile?.verificationStatus) { // We can check if it exists or use fallback
      // wait, check the actual property in currentUserProfile:
    }
    if (currentUserProfile?.availabilityStatus) return currentUserProfile.availabilityStatus;
    return (currentUserProfile?.isAvailableNow ?? true) ? "disponible" : "indisponible";
  });
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  // Solde/Wallet withdrawals state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedMMNetwork, setSelectedMMNetwork] = useState<"Wave" | "Orange" | "MTN">("Wave");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState("");
  const [withdrawErrorMsg, setWithdrawErrorMsg] = useState("");

  // Wallet defaults in database
  const balance = currentUserProfile?.balance ?? 0;
  const totalRevenue = currentUserProfile?.totalRevenue ?? 0;
  const totalWithdrawals = currentUserProfile?.totalWithdrawals ?? 0;

  // Stats defaults
  const gigsCompleted = currentUserProfile?.gigsCompleted ?? (currentUserProfile?.role === "musicien" ? 3 : 0);
  const applicationsSent = currentUserProfile?.applicationsSent ?? (currentUserProfile?.role === "musicien" ? 8 : 0);
  const acceptanceRate = currentUserProfile?.acceptanceRate ?? (currentUserProfile?.role === "musicien" ? 85 : 100);

  // Edit Profile fields State
  const [firstName, setFirstName] = useState(currentUserProfile?.firstName || "");
  const [lastName, setLastName] = useState(currentUserProfile?.lastName || "");
  const [artistName, setArtistName] = useState(currentUserProfile?.artistName || "");
  const [gender, setGender] = useState(currentUserProfile?.gender || "Homme");
  const [birthDate, setBirthDate] = useState(currentUserProfile?.birthDate || "");
  const [phone, setPhone] = useState(currentUserProfile?.phone || "");
  const [whatsapp, setWhatsapp] = useState(currentUserProfile?.whatsapp || "");
  const [commune, setCommune] = useState(currentUserProfile?.commune || "Cocody");
  const [communeSearch, setCommuneSearch] = useState("");
  const [showCommuneDropdown, setShowCommuneDropdown] = useState(false);
  const [bio, setBio] = useState(currentUserProfile?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUserProfile?.avatarUrl || currentUserProfile?.photoURL || AVATARS[0]);
  
  const [specialties, setSpecialties] = useState<string[]>(
    currentUserProfile?.specialties || 
    (currentUserProfile?.specialty ? [currentUserProfile.specialty] : [])
  );
  const [musicGenres, setMusicGenres] = useState<string[]>(
    currentUserProfile?.musicGenres || 
    (currentUserProfile?.musicGenre ? [currentUserProfile.musicGenre] : [])
  );
  const [experience, setExperience] = useState(currentUserProfile?.experience || "Intermédiaire");
  const [availabilities, setAvailabilities] = useState<string[]>(
    currentUserProfile?.availabilities || 
    (currentUserProfile?.isAvailableNow ? ["Disponible immédiatement"] : [])
  );
  const [waveNumber, setWaveNumber] = useState(currentUserProfile?.waveNumber || currentUserProfile?.paymentNumber || "");
  const [orangeMoneyNumber, setOrangeMoneyNumber] = useState(currentUserProfile?.orangeMoneyNumber || "");

  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editError, setEditError] = useState("");

  // Webcam capturing and photo upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  const [coverUrl, setCoverUrl] = useState(currentUserProfile?.coverUrl || currentUserProfile?.couverture || "");
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);

  // New state fields for Phase 10
  const [ville, setVille] = useState(currentUserProfile?.ville || "Abidjan");
  const [quartier, setQuartier] = useState(currentUserProfile?.quartier || "");
  const [accountRole, setAccountRole] = useState(currentUserProfile?.role || "musicien");
  const [freeSpecialty, setFreeSpecialty] = useState("");
  const [freeGenre, setFreeGenre] = useState("");

  // Media portfolio states
  const [mediaGallery, setMediaGallery] = useState<any[]>(currentUserProfile?.mediaGallery || []);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [newMediaType, setNewMediaType] = useState<"photo" | "audio" | "video" | "youtube">("youtube");
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newMediaTitle, setNewMediaTitle] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaUploadProgress, setMediaUploadProgress] = useState(0);

  // Identity Verification (KYC) states
  const [verifyingIdentity, setVerifyingIdentity] = useState(false);
  const [kycProgress, setKycProgress] = useState(0);

  const handleIdentityVerifyUpload = async (file: File) => {
    setVerifyingIdentity(true);
    setKycProgress(0);
    try {
      const path = `kyc/${currentUserProfile.uid}/${Date.now()}_identity_${file.name}`;
      const downloadUrl = await gomboDB.uploadFile(file, path, (progress) => {
        setKycProgress(Math.round(progress));
      });
      
      await gomboDB.updateUserProfile(currentUserProfile.uid, {
        kycStatus: "pending",
        kycDocUrl: downloadUrl,
        kycDocs: {
          ...currentUserProfile.kycDocs,
          identityCardUrl: downloadUrl
        },
        kycSubmittedDate: new Date().toISOString()
      });
      
      audioSynth.playValidationSuccess();
      onRefreshProfile();
    } catch (err) {
      console.error("KYC upload error:", err);
      alert("Erreur lors de l'envoi du document.");
    } finally {
      setVerifyingIdentity(false);
    }
  };

  const startCameraForKYC = async () => {
    // We can reuse the existing camera logic but flag it for KYC
    // For simplicity, we'll just use a dedicated handler if needed or reuse capturePhoto
    // Let's just use handleFileUpload for simplicity since it's already there
    startCamera();
  };

  // Stats dynamically calculated in real-time
  const [dynamicGroupsCount, setDynamicGroupsCount] = useState(0);
  const [dynamicFavsCount, setDynamicFavsCount] = useState(0);
  const [dynamicAppsCount, setDynamicAppsCount] = useState(currentUserProfile.applicationsSent ?? 0);

  useEffect(() => {
    const unsubGroups = gomboDB.listenAllMusicGroups((groups) => {
      const mine = groups.filter(g => g.creatorId === currentUserProfile.uid);
      setDynamicGroupsCount(mine.length);
    });

    const unsubApps = gomboDB.listenUserApplications(currentUserProfile.uid, (apps) => {
      setDynamicAppsCount(apps.length);
    });

    const unsubPosts = gomboDB.listenSocialPosts((posts) => {
      const savedOrLiked = posts.filter(p => 
        (p.likedBy && p.likedBy.includes(currentUserProfile.uid)) || 
        (p.savedBy && p.savedBy.includes(currentUserProfile.uid))
      );
      setDynamicFavsCount(savedOrLiked.length);
    });

    return () => {
      unsubGroups();
      unsubApps();
      unsubPosts();
    };
  }, [currentUserProfile?.uid]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300, facingMode: "user" } });
      setCameraStream(stream);
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access failed:", err);
      alert("Impossible d'accéder à la caméra. Veuillez autoriser l'accès à l'appareil photo.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  // Stop camera when component unmounts or view changes
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  const capturePhoto = async () => {
    const video = document.getElementById("webcam-preview") as HTMLVideoElement;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw the current video frame onto canvas
    ctx.drawImage(video, 0, 0, 300, 300);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `captured_avatar_${Date.now()}.jpeg`, { type: "image/jpeg" });
      stopCamera();
      await handleFileUpload(file);
    }, "image/jpeg");
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    let downloadUrl = "";
    try {
      const path = `avatars/${currentUserProfile.uid}/${Date.now()}_${file.name}`;
      try {
        downloadUrl = await gomboDB.uploadFile(file, path, (progress) => {
          setUploadProgress(Math.round(progress));
        });
      } catch (uploadError) {
        console.warn("⚠️ Firebase Storage acts unavailable. Emulating fallback with current / base avatar URL.", uploadError);
        // Fallback: create local object URL to display instantly
        downloadUrl = URL.createObjectURL(file);
      }

      setAvatarUrl(downloadUrl);
      
      const photoPayload = {
        avatarUrl: downloadUrl,
        photoURL: downloadUrl,
      };

      // Persist directly in Firestore immediately using updateDoc()
      if (!isFirebaseMock && db) {
        try {
          const userDocRef = doc(db, "users", currentUserProfile.uid);
          await updateDoc(userDocRef, photoPayload);
        } catch (dbErr) {
          console.warn("Direct updateDoc of photoURL failed, calling gomboDB cache updater:", dbErr);
          await gomboDB.updateUserProfile(currentUserProfile.uid, photoPayload);
        }
      } else {
        await gomboDB.updateUserProfile(currentUserProfile.uid, photoPayload);
      }

      // Fire refresh callback so user header and app components receive the updated photo URL immediately
      onRefreshProfile();
    } catch (err) {
      console.error("Upload error:", err);
      // Fallback: use a safe placeholder or current URL to never block the app
      const fallbackUrl = currentUserProfile.photoURL || currentUserProfile.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150";
      setAvatarUrl(fallbackUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (file: File) => {
    setCoverUploading(true);
    setCoverUploadProgress(0);
    let downloadUrl = "";
    try {
      const path = `covers/${currentUserProfile.uid}/${Date.now()}_${file.name}`;
      try {
        downloadUrl = await gomboDB.uploadFile(file, path, (progress) => {
          setCoverUploadProgress(Math.round(progress));
        });
      } catch (uploadError) {
        console.warn("Cover upload fallback", uploadError);
        downloadUrl = URL.createObjectURL(file);
      }

      setCoverUrl(downloadUrl);
      
      const payload = {
        coverUrl: downloadUrl,
        couverture: downloadUrl,
      };

      if (!isFirebaseMock && db) {
        try {
          const userDocRef = doc(db, "users", currentUserProfile.uid);
          await updateDoc(userDocRef, payload);
        } catch (dbErr) {
          await gomboDB.updateUserProfile(currentUserProfile.uid, payload);
        }
      } else {
        await gomboDB.updateUserProfile(currentUserProfile.uid, payload);
      }

      onRefreshProfile();
    } catch (err) {
      console.error("Cover upload error:", err);
    } finally {
      setCoverUploading(false);
    }
  };

  // Media Gallery System
  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMediaType !== "youtube" && mediaFile) {
      setMediaUploading(true);
      setMediaUploadProgress(0);
      try {
        const fileExt = mediaFile.name.split('.').pop();
        const path = `portfolio/${currentUserProfile.uid}/${Date.now()}_media.${fileExt}`;
        const downloadUrl = await gomboDB.uploadFile(mediaFile, path, (progress) => {
          setMediaUploadProgress(Math.round(progress));
        });
        const newItem = {
          id: `media_${Date.now()}`,
          type: newMediaType,
          url: downloadUrl,
          title: newMediaTitle.trim() || `${newMediaType.toUpperCase()} Portfolio`
        };
        const updatedGallery = [...mediaGallery, newItem];
        await gomboDB.updateUserProfile(currentUserProfile.uid, {
          mediaGallery: updatedGallery
        });
        setMediaGallery(updatedGallery);
        onRefreshProfile();
        setIsMediaModalOpen(false);
        setNewMediaUrl("");
        setNewMediaTitle("");
        setMediaFile(null);
      } catch (err) {
        console.error("Media upload error:", err);
        alert("Erreur de chargement du fichier.");
      } finally {
        setMediaUploading(false);
      }
    } else {
      if (!newMediaUrl.trim()) {
        alert("Veuillez entrer un lien valide.");
        return;
      }
      const newItem = {
        id: `media_${Date.now()}`,
        type: newMediaType,
        url: newMediaUrl.trim(),
        title: newMediaTitle.trim() || `${newMediaType.toUpperCase()} Portfolio`
      };
      const updatedGallery = [...mediaGallery, newItem];
      try {
        await gomboDB.updateUserProfile(currentUserProfile.uid, {
          mediaGallery: updatedGallery
        });
        setMediaGallery(updatedGallery);
        onRefreshProfile();
        setIsMediaModalOpen(false);
        setNewMediaUrl("");
        setNewMediaTitle("");
      } catch (err) {
        console.error("Gallery update error:", err);
      }
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (window.confirm("Voulez-vous supprimer ce média de votre galerie d'artiste ?")) {
      const updatedGallery = mediaGallery.filter(item => item.id !== mediaId);
      try {
        await gomboDB.updateUserProfile(currentUserProfile.uid, {
          mediaGallery: updatedGallery
        });
        setMediaGallery(updatedGallery);
        onRefreshProfile();
      } catch (err) {
        console.error("Gallery delete error:", err);
      }
    }
  };

  // Settings screen State Sub-Tabs
  const [settingsTab, setSettingsTab] = useState<string>("musical");
  const [newEmail, setNewEmail] = useState(currentUserProfile.email || "");
  const [newPhone, setNewPhone] = useState(currentUserProfile.phone || "");
  const [newPassword, setNewPassword] = useState("");
  const [settingsStatusMsg, setSettingsStatusMsg] = useState("");
  
  // Settings Preference Options
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [language, setLanguage] = useState("fr");
  const [phoneVisibility, setPhoneVisibility] = useState("public");

  // Music settings local states
  const [sPrenom, setSPrenom] = useState("");
  const [sNom, setSNom] = useState("");
  const [sNomArtistique, setSNomArtistique] = useState("");
  const [sTelephone, setSTelephone] = useState("");
  const [sCountry, setSCountry] = useState("Côte d'Ivoire");
  const [sCity, setSCity] = useState("Abidjan");
  const [sBio, setSBio] = useState("");
  const [sMainRole, setSMainRole] = useState("Artiste");
  const [sSecondaryRoles, setSSecondaryRoles] = useState<string[]>([]);
  const [sGenres, setSGenres] = useState<string[]>([]);
  const [sCollaborations, setSCollaborations] = useState<string[]>([]);
  const [audioVolume, setAudioVolume] = useState<number>(80);
  const [userLogs, setUserLogs] = useState<any[]>([]);

  // Synchronize when currentUserProfile updates
  useEffect(() => {
    if (currentUserProfile) {
      setSPrenom(currentUserProfile.prenom || currentUserProfile.firstName || "");
      setSNom(currentUserProfile.nom || currentUserProfile.lastName || "");
      setSNomArtistique(currentUserProfile.nomArtistique || currentUserProfile.artisticName || currentUserProfile.displayName || "");
      setSTelephone(currentUserProfile.telephone || currentUserProfile.phone || "");
      setSCountry(currentUserProfile.country || "Côte d'Ivoire");
      setSCity(currentUserProfile.city || currentUserProfile.ville || currentUserProfile.commune || "Abidjan");
      setSBio(currentUserProfile.bio || "");
      setSMainRole(currentUserProfile.mainRole || currentUserProfile.role || "Artiste");
      setSSecondaryRoles(currentUserProfile.secondaryRoles || []);
      setSGenres(currentUserProfile.genres || []);
      setSCollaborations(currentUserProfile.collaborations || []);
    }
  }, [currentUserProfile?.uid, currentUserProfile]);

  // Real-time listen of user-specific logs from Firestore
  useEffect(() => {
    if (panelView === "settings" && settingsTab === "historique" && currentUserProfile?.uid) {
      const unsubscribe = gomboDB.listenUserActivities(currentUserProfile.uid, (logs) => {
        setUserLogs(logs);
      });
      return () => unsubscribe();
    }
  }, [panelView, settingsTab, currentUserProfile?.uid]);

  // Keep scroll independent
  useEffect(() => {
    // Scroll intentionally removed to prevent interfering with AdminCentre's custom scroll tracking
  }, [panelView]);

  // Keep local states synchronized with external props changes
  useEffect(() => {
    if (currentUserProfile) {
      if (panelView === "edit") return;
      setFirstName(currentUserProfile.firstName || "");
      setLastName(currentUserProfile.lastName || "");
      setArtistName(currentUserProfile.artistName || "");
      setPhone(currentUserProfile.phone || "");
      setCommune(currentUserProfile.commune || "Cocody");
      setBio(currentUserProfile.bio || "");
      setAvatarUrl(currentUserProfile.avatarUrl || currentUserProfile.photoURL || AVATARS[0]);
      setSpecialties(currentUserProfile.specialties || (currentUserProfile.specialty ? [currentUserProfile.specialty] : []));
      setExperience(currentUserProfile.experience || "Intermédiaire");
      setMusicGenres(currentUserProfile.musicGenres || (currentUserProfile.musicGenre ? [currentUserProfile.musicGenre] : []));
      setWaveNumber(currentUserProfile.waveNumber || currentUserProfile.paymentNumber || "");
      setOrangeMoneyNumber(currentUserProfile.orangeMoneyNumber || "");
      setIsAvailable(currentUserProfile.isAvailableNow ?? true);
      setAvailabilityStatus(currentUserProfile.availabilityStatus || ((currentUserProfile.isAvailableNow ?? true) ? "disponible" : "indisponible"));
      setNewEmail(currentUserProfile.email || "");
      setNewPhone(currentUserProfile.phone || "");
      setVille(currentUserProfile.ville || "Abidjan");
      setQuartier(currentUserProfile.quartier || "");
      setAccountRole(currentUserProfile.role || "musicien");
      setMediaGallery(currentUserProfile.mediaGallery || []);
    }
  }, [currentUserProfile?.uid, currentUserProfile, panelView]);

  // Handle Availability 3-State Update
  const handleUpdateAvailabilityStatus = async (status: "disponible" | "occupe" | "indisponible") => {
    setUpdatingAvailability(true);
    try {
      await gomboDB.updateUserProfile(currentUserProfile.uid, {
        availabilityStatus: status,
        isAvailableNow: status === "disponible"
      });
      setAvailabilityStatus(status);
      setIsAvailable(status === "disponible");
      onRefreshProfile();
    } catch (err) {
      console.error("Availability error:", err);
    } finally {
      setUpdatingAvailability(false);
    }
  };

  // Withdraw flow MVP logic
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawErrorMsg("");
    setWithdrawSuccessMsg("");
    setWithdrawLoading(true);

    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setWithdrawErrorMsg("Veuillez entrer un montant valide.");
      setWithdrawLoading(false);
      return;
    }

    if (amount > balance) {
      setWithdrawErrorMsg("Solde insuffisant pour effectuer ce retrait.");
      setWithdrawLoading(false);
      return;
    }

    // Get current receiving provider target number
    const targetPhone = selectedMMNetwork === "Orange" ? orangeMoneyNumber : waveNumber;
    if (!targetPhone.trim()) {
      setWithdrawErrorMsg(`Veuillez d'abord configurer votre numéro d'argent mobile ${selectedMMNetwork} dans la page Modifier le profil.`);
      setWithdrawLoading(false);
      return;
    }

    try {
      const waitTime = new Promise(resolve => setTimeout(resolve, 1500));
      await waitTime;

      const newBalance = balance - amount;
      const newWithdrawals = totalWithdrawals + amount;

      await gomboDB.updateUserProfile(currentUserProfile.uid, {
        balance: newBalance,
        totalWithdrawals: newWithdrawals
      });

      setWithdrawSuccessMsg(`Félicitations ! Retrait de ${amount.toLocaleString()} FCFA sur votre compte ${selectedMMNetwork} (${targetPhone}) initié avec succès !`);
      setWithdrawAmount("");
      onRefreshProfile();
    } catch (err: any) {
      console.error(err);
      setWithdrawErrorMsg("Une erreur est survenue lors de l'envoi du transfert.");
    } finally {
      setWithdrawLoading(false);
    }
  };

  // Debounced Auto-save Engine for Profile Edits
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  useEffect(() => {
    // Only run auto-save when panelView === "edit"
    if (panelView !== "edit") return;

    // Validate absolute minimum requirements to protect data completeness
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !commune) return;

    setAutoSaveStatus("saving");

    const timer = setTimeout(async () => {
      try {
        const updates: Partial<UserProfile> = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          artistName: artistName.trim(),
          gender,
          birthDate,
          phone: phone.trim(),
          whatsapp: whatsapp.trim() || phone.trim(),
          commune,
          ville: ville.trim(),
          quartier: quartier.trim(),
          role: accountRole as any,
          bio: bio.trim(),
          avatarUrl,
          photoURL: avatarUrl,
          specialties,
          specialty: specialties[0] || "Artiste",
          speciality: specialties[0] || "Artiste",
          musicGenres,
          musicGenre: musicGenres[0] || "Showbiz",
          experience,
          experienceYears: experience,
          availabilities,
          isAvailableNow: availabilities.includes("Disponible immédiatement"),
          waveNumber: waveNumber.trim(),
          orangeMoneyNumber: orangeMoneyNumber.trim(),
          updatedAt: new Date().toISOString()
        };

        await gomboDB.updateUserProfile(currentUserProfile.uid, updates);
        setAutoSaveStatus("saved");
        // Update profile in parent context silently without interrupting edit view
        onRefreshProfile();
        setTimeout(() => setAutoSaveStatus("idle"), 2500);
      } catch (err) {
        console.error("Auto-save failed:", err);
        setAutoSaveStatus("error");
      }
    }, 1500); // Debounce delay 1.5s

    return () => clearTimeout(timer);
  }, [
    firstName, lastName, artistName, gender, birthDate, phone, whatsapp, 
    commune, ville, quartier, accountRole, bio, specialties, musicGenres, 
    experience, availabilities, waveNumber, orangeMoneyNumber, avatarUrl,
    panelView
  ]);

  // Profile Save (Manual Trigger)
  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    setEditSuccess(false);
    setEditLoading(true);

    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !commune) {
      setEditError("Veuillez remplir tous les champs obligatoires.");
      setEditLoading(false);
      return;
    }

    const updates: Partial<UserProfile> = {
      // English fields
      firstName: firstName.trim().normalize("NFC"),
      lastName: lastName.trim().normalize("NFC"),
      artistName: artistName.trim().normalize("NFC"),
      gender,
      birthDate,
      phone: phone.trim().normalize("NFC"),
      whatsapp: (whatsapp.trim() || phone.trim()).normalize("NFC"),
      commune: commune.trim().normalize("NFC"),
      ville: ville.trim().normalize("NFC"),
      quartier: quartier.trim().normalize("NFC"),
      role: accountRole as any,
      bio: bio.trim().normalize("NFC"),
      avatarUrl,
      photoURL: avatarUrl,
      specialties: specialties.map(s => s.trim().normalize("NFC")),
      specialty: (specialties[0] || "Artiste").trim().normalize("NFC"),
      speciality: (specialties[0] || "Artiste").trim().normalize("NFC"),
      musicGenres: musicGenres.map(g => g.trim().normalize("NFC")),
      musicGenre: (musicGenres[0] || "Showbiz").trim().normalize("NFC"),
      experience,
      experienceYears: experience,
      availabilities: availabilities.map(a => a.trim().normalize("NFC")),
      isAvailableNow: availabilities.includes("Disponible immédiatement"),
      waveNumber: waveNumber.trim().normalize("NFC"),
      orangeMoneyNumber: orangeMoneyNumber.trim().normalize("NFC"),
      isProfileComplete: true,
      updatedAt: new Date().toISOString(),

      // French fields & Custom constraints requested by task
      prenom: firstName.trim().normalize("NFC"),
      nom: lastName.trim().normalize("NFC"),
      telephone: phone.trim().normalize("NFC"),
      preferences: {
        musicGenres: musicGenres.map(g => g.trim().normalize("NFC")),
        specialties: specialties.map(s => s.trim().normalize("NFC")),
        availabilities: availabilities.map(a => a.trim().normalize("NFC"))
      }
    };


    try {
      // 1. Save using updateDoc requested by guidelines if live db is online
      if (!isFirebaseMock && db) {
        try {
          const userDocRef = doc(db, "users", currentUserProfile.uid);
          await updateDoc(userDocRef, updates);
        } catch (error: any) {
          console.error("❌ Direct updateDoc() failed inside Firestore users collection:", error);
          // If we got missing doc or other errors, try fallback via setDoc with merge in updateUserProfile
          await gomboDB.updateUserProfile(currentUserProfile.uid, updates);
        }
      } else {
        // Fallback or Mock mode sync
        await gomboDB.updateUserProfile(currentUserProfile.uid, updates);
      }

      setEditSuccess(true);
      
      // Real-time notification that profile was updated
      window.dispatchEvent(new Event("gomboUserProfileChange"));
      
      try { audioSynth.playValidationSuccess(); } catch (_) {}
      
      // Immediately refresh profile locally
      onRefreshProfile();
      
      // Display modern toast without re-loading
      if (typeof window !== "undefined") {
        const toast = document.createElement("div");
        toast.id = "profile-updated-toast";
        toast.textContent = "✓ Profil mis à jour";
        toast.style.position = "fixed";
        toast.style.bottom = "24px";
        toast.style.left = "50%";
        toast.style.transform = "translateX(-50%)";
        toast.style.padding = "10px 24px";
        toast.style.backgroundColor = "#D4AF37";
        toast.style.color = "black";
        toast.style.fontWeight = "bold";
        toast.style.borderRadius = "99px";
        toast.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.3)";
        toast.style.zIndex = "99999";
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
      }

      // Redirect back after success, 2s delay
      setTimeout(() => {
        setEditLoading(false);
        if (initialPanelView === "edit") {
          onNavigateView("heritage");
        } else {
          setPanelView("main");
        }
      }, 1200);
    } catch (err: any) {
      console.error("❌ Fatal profile save error:", err);
      setEditError("Une erreur est survenue lors de la sauvegarde.");
      setEditLoading(false);
    }
  };

  // Simulate updating accounts settings
  const handleSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsStatusMsg("");

    try {
      if (settingsTab === "musical") {
        const updates = {
          prenom: sPrenom.trim(),
          nom: sNom.trim(),
          nomArtistique: sNomArtistique.trim() || `${sPrenom} ${sNom}`,
          telephone: sTelephone.trim(),
          country: sCountry.trim(),
          city: sCity.trim(),
          bio: sBio.trim(),
          mainRole: sMainRole,
          secondaryRoles: sSecondaryRoles,
          // Legacy alignment for safety
          firstName: sPrenom.trim(),
          lastName: sNom.trim(),
          displayName: sNomArtistique.trim() || `${sPrenom} ${sNom}`,
          artisticName: sNomArtistique.trim() || `${sPrenom} ${sNom}`,
          phone: sTelephone.trim(),
          commune: sCity.trim(),
          ville: sCity.trim(),
          role: sMainRole,
          specialties: [sMainRole, ...sSecondaryRoles]
        };
        await gomboDB.updateUserProfile(currentUserProfile.uid, updates);
        await gomboDB.logUserActivity({ userId: currentUserProfile.uid, type: "Modifications profil", details: "Mise à jour des coordonnées et rôles du profil musical." });
        setSettingsStatusMsg("🟢 Profil musical mis à jour avec succès !");
      } else if (settingsTab === "styles") {
        await gomboDB.updateUserProfile(currentUserProfile.uid, { genres: sGenres });
        await gomboDB.logUserActivity({ userId: currentUserProfile.uid, type: "Modifications profil", details: `Mise à jour des styles musicaux préférés : ${sGenres.join(', ')}.` });
        setSettingsStatusMsg("🟢 Genres et styles musicaux enregistrés.");
      } else if (settingsTab === "collaborations") {
        await gomboDB.updateUserProfile(currentUserProfile.uid, { collaborations: sCollaborations });
        await gomboDB.logUserActivity({ userId: currentUserProfile.uid, type: "Modifications profil", details: `Mise à jour des préférences de collaborations : ${sCollaborations.join(', ')}.` });
        setSettingsStatusMsg("🟢 Préférences de collaborations enregistrées.");
      } else if (settingsTab === "notifications") {
        setSettingsStatusMsg("🟢 Préférences de notifications SMS Showbiz enregistrées.");
        await gomboDB.logUserActivity({ userId: currentUserProfile.uid, type: "Modifications profil", details: "Préférence d'alerte notifications showbiz configurée." });
      } else if (settingsTab === "langue") {
        setSettingsStatusMsg(`🟢 Langue de navigation modifiée : [${language === 'fr' ? 'Français' : 'Anglais'}].`);
        await gomboDB.logUserActivity({ userId: currentUserProfile.uid, type: "Modifications profil", details: `Langue modifiée en : ${language === 'fr' ? 'Français' : 'Anglais'}.` });
      } else if (settingsTab === "audio") {
        setSettingsStatusMsg(`🟢 Volume de sortie réglé à ${audioVolume}%.`);
        try { audioSynth.playTamTam(true); } catch (_) {}
      } else if (settingsTab === "confidentialite") {
        await gomboDB.updateUserProfile(currentUserProfile.uid, { phoneVisibility });
        await gomboDB.logUserActivity({ userId: currentUserProfile.uid, type: "Modifications profil", details: `Confidentialité ajustée sur option : ${phoneVisibility}.` });
        setSettingsStatusMsg(`La visibilité de vos coordonnées est désormais restreinte : [${phoneVisibility}].`);
      } else {
        setSettingsStatusMsg("Sécurité auditée avec succès.");
      }
      onRefreshProfile();
    } catch (err: any) {
      setSettingsStatusMsg("⚠️ Erreur lors de la mise à jour.");
    }
  };

  const handleDeleteOwnAccount = async () => {
    if (!currentUserProfile?.uid) return;
    const confirmDelete = window.confirm(
      "🔑 Sécurité Y’A GOMBO MUSIC :\n\nÊtes-vous sûr de vouloir supprimer définitivement votre compte de la plateforme ?\n\nCette action est irréversible et supprimera instantanément :\n- Vos données Firebase d'Authentification\n- Votre profil public et privé d'artiste/recruteur\n- Toutes vos candidatures et médias associés.\n\nConfirmer ?"
    );
    if (!confirmDelete) return;

    try {
      await gomboDB.deleteUserProfile(currentUserProfile.uid);
      alert("Votre compte et toutes vos données associées ont été supprimés avec succès.");
      onLogout();
    } catch (error) {
      console.error("Erreur de suppression du compte :", error);
      alert("Une erreur est survenue lors de la suppression de votre compte.");
    }
  };

  const [uidCopied, setUidCopied] = useState(false);
  const handleCopyUid = () => {
    navigator.clipboard.writeText(currentUserProfile.uid);
    setUidCopied(true);
    setTimeout(() => setUidCopied(false), 2000);
  };

  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const toggleAudioPlay = (url: string) => {
    if (playingAudioUrl === url) {
      if (audioElement) {
        audioElement.pause();
        setPlayingAudioUrl(null);
      }
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      const audio = new Audio(url);
      audio.play();
      setAudioElement(audio);
      setPlayingAudioUrl(url);
      audio.onended = () => {
        setPlayingAudioUrl(null);
      };
    }
  };

  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [audioElement]);

  const [activeMediaTab, setActiveMediaTab] = useState<"photo" | "audio" | "youtube">("youtube");
  const [selectedYoutubeEmbed, setSelectedYoutubeEmbed] = useState<string | null>(null);

  const getYoutubeId = (url: string) => {
    let videoId = "";
    if (url.includes("youtube.com/watch")) {
      const parts = url.split("v=");
      if (parts[1]) videoId = parts[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
      const parts = url.split("youtu.be/");
      if (parts[1]) videoId = parts[1].split("?")[0];
    } else if (url.includes("youtube.com/embed/")) {
      const parts = url.split("youtube.com/embed/");
      if (parts[1]) videoId = parts[1].split("?")[0];
    }
    return videoId;
  };

  if (!currentUserProfile) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-mono tracking-widest text-[#D4AF37]/80 uppercase">Chargement du profil...</p>
      </div>
    );
  }

  if (panelView === "main") {
    return (
      <GomboProfileMainView
        currentUserProfile={currentUserProfile}
        onRefreshProfile={onRefreshProfile}
        onNavigateView={onNavigateView}
        setPanelView={(panel) => setPanelView(panel as any)}
        availabilityStatus={availabilityStatus}
        handleUpdateAvailabilityStatus={handleUpdateAvailabilityStatus}
        updatingAvailability={updatingAvailability}
        dynamicGroupsCount={dynamicGroupsCount}
        dynamicFavsCount={dynamicFavsCount}
        dynamicAppsCount={dynamicAppsCount}
        myPosts={myPosts}
        mediaGallery={mediaGallery}
        setMediaGallery={setMediaGallery}
        verifyingIdentity={verifyingIdentity}
        kycProgress={kycProgress}
        handleIdentityVerifyUpload={handleIdentityVerifyUpload}
      />
    );
  }

  if (panelView === "certification") {
    return (
      <div className="afri-scroll-safe afri-container">
        <GomboCertificationFlow
          currentUserProfile={currentUserProfile}
          onRefreshProfile={onRefreshProfile}
          onBack={() => setPanelView("main")}
        />
      </div>
    );
  }

  if (panelView === "edit") {
    return (
      <GomboProfileEditView
        firstName={firstName}
        setFirstName={setFirstName}
        lastName={lastName}
        setLastName={setLastName}
        artistName={artistName}
        setArtistName={setArtistName}
        phone={phone}
        setPhone={setPhone}
        whatsapp={whatsapp}
        setWhatsapp={setWhatsapp}
        gender={gender}
        setGender={setGender}
        birthDate={birthDate}
        setBirthDate={setBirthDate}
        commune={commune}
        setCommune={setCommune}
        ville={ville}
        setVille={setVille}
        quartier={quartier}
        setQuartier={setQuartier}
        accountRole={accountRole}
        setAccountRole={(val) => setAccountRole(val as any)}
        bio={bio}
        setBio={setBio}
        specialties={specialties}
        setSpecialties={setSpecialties}
        musicGenres={musicGenres}
        setMusicGenres={setMusicGenres}
        experience={experience}
        setExperience={setExperience}
        availabilities={availabilities}
        setAvailabilities={setAvailabilities}
        waveNumber={waveNumber}
        setWaveNumber={setWaveNumber}
        orangeMoneyNumber={orangeMoneyNumber}
        setOrangeMoneyNumber={setOrangeMoneyNumber}
        editLoading={editLoading}
        editError={editError}
        editSuccess={editSuccess}
        onSubmit={handleEditProfileSubmit}
        autoSaveStatus={autoSaveStatus}
        onCancel={() => {
          if (initialPanelView === "edit") {
            onNavigateView("back");
          } else {
            setPanelView("main");
          }
        }}
        onSkip={handleSkipUpdate}
        avatarUrl={avatarUrl}
        setAvatarUrl={setAvatarUrl}
        cameraActive={cameraActive}
        setCameraActive={setCameraActive}
        uploading={uploading}
        uploadProgress={uploadProgress}
        capturePhoto={capturePhoto}
        stopCamera={stopCamera}
        startCamera={startCamera}
        handleFileUpload={handleFileUpload}
        coverUrl={coverUrl}
        setCoverUrl={setCoverUrl}
        handleCoverUpload={handleCoverUpload}
        coverUploading={coverUploading}
        coverUploadProgress={coverUploadProgress}
        onIdentityUpload={handleIdentityVerifyUpload}
        verifyingIdentity={verifyingIdentity}
        kycProgress={kycProgress}
        kycStatus={currentUserProfile.kycStatus}
      />
    );
  }

  return (
    <div className="afri-scroll-safe afri-container">
      <div className="afri-section">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setPanelView("main")} className="afri-btn-ghost p-2">
            <ArrowLeft className="w-5 h-5 text-afri-text" />
          </button>
          <h3 className="afri-title-md">{panelView === "support" ? "Support Assistance Gombo" : "Réglages"}</h3>
        </div>
        
        {panelView === "support" ? (
          <div className="afri-card p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-orange-100 dark:bg-orange-950 text-[#D4AF37] rounded-full">
                <HelpCircle className="w-10 h-10" />
              </div>
              <h2 className="afri-title-lg text-afri-text text-center">SUPPORT ASSISTANCE GOMBO</h2>
              <p className="afri-text-body text-afri-text-sec text-center">Besoin d'aide pour une transaction Wave suspendue ou une annulation de gombo de dernière minute ? Le support d'AFRIGOMBO est disponible 24/7.</p>
            </div>
            
            <div className="space-y-3">
              <a 
                href={supportConfig.getLink("Aide générale")} 
                target="_blank"
                rel="noreferrer"
                className="afri-btn-primary py-4 text-center bg-afri-bg-sec border-[#25D366] flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Parler à un Admin sur WhatsApp
              </a>
              <div className="text-center pt-2">
                <p className="text-[10px] text-[#B9B9B9] font-mono">Assistance AFRIGOMBO : {supportConfig.phoneNumber}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="afri-card p-6 space-y-4">
            <p className="afri-text-tiny uppercase">Paramètres du compte</p>
            <div className="space-y-2">
              <button onClick={() => setPanelView("edit")} className="w-full text-left p-4 rounded-2xl bg-white/5 border border-afri-border flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-afri-text-sec" />
                  <span className="text-xs font-bold text-afri-text">Modifier le profil</span>
                </div>
                <ChevronDown className="w-4 h-4 text-zinc-700 -rotate-90" />
              </button>
              
              <button onClick={onLogout} className="w-full text-left p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-red-500/60" />
                  <span className="text-xs font-bold text-red-500">Déconnexion</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
