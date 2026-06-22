import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Phone, MapPin, Music, Award, Wallet, Send, FileText, Check, Users, Clipboard, 
  Sparkles, ShieldCheck, Heart, CreditCard, Star, Radio, LogOut,
  Settings, ArrowUpRight, TrendingUp, HelpCircle, Bell, Eye, EyeOff,
  Moon, Sun, Globe, Smartphone, Shield, Lock, Trash2, Calendar,
  Camera, Upload, RefreshCw, MessageSquare, ChevronDown, Search,
  Copy, Plus, Play, Pause, ExternalLink
} from "lucide-react";
import { UserProfile, PaymentProvider } from "../types";
import { gomboDB, gomboAuth } from "../firebase";
import { audioSynth } from "../lib/audio";
import { ProfileCompletionScore } from "./ProfileCompletionScore";
import { MediaGalleryManager } from "./MediaGalleryManager";
import { GomboProfileMainView } from "./GomboProfileMainView";
import { GomboProfileEditView } from "./GomboProfileEditView";

interface GomboProfileProps {
  currentUserProfile: UserProfile;
  onRefreshProfile: () => void;
  onNavigateView: (view: string, initialTab?: any) => void;
  onLogout?: () => void;
  darkMode?: boolean;
  setDarkMode?: (val: boolean) => void;
  initialPanelView?: "main" | "edit" | "settings" | "support";
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
  // Current Panel view: "main" | "edit" | "settings" | "support"
  const [panelView, setPanelView] = useState<"main" | "edit" | "settings" | "support">(initialPanelView);

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
  }, [currentUserProfile]);

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
      await gomboDB.updateUserProfile(currentUserProfile.uid, {
        uid: currentUserProfile.uid,
        email: currentUserProfile.email || "",
        displayName: currentUserProfile.displayName || "",
        photoURL: currentUserProfile.photoURL || "",
        isProfileComplete: false,
        profileSkipped: true,
        provider: "google",
        updatedAt: new Date().toISOString()
      });
      onRefreshProfile();
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
      onNavigateView("dashboard");
    } catch (err) {
      console.error("Error setting skip property:", err);
      onNavigateView("dashboard");
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
  const [isAvailable, setIsAvailable] = useState(currentUserProfile.isAvailableNow ?? true);
  const [availabilityStatus, setAvailabilityStatus] = useState<"disponible" | "occupe" | "indisponible">(() => {
    if (currentUserProfile.verificationStatus) { // We can check if it exists or use fallback
      // wait, check the actual property in currentUserProfile:
    }
    if (currentUserProfile.availabilityStatus) return currentUserProfile.availabilityStatus;
    return (currentUserProfile.isAvailableNow ?? true) ? "disponible" : "indisponible";
  });
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  // Solde/Wallet withdrawals state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedMMNetwork, setSelectedMMNetwork] = useState<"Wave" | "Orange" | "MTN">("Wave");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState("");
  const [withdrawErrorMsg, setWithdrawErrorMsg] = useState("");

  // Wallet defaults in database
  const balance = currentUserProfile.balance ?? 0;
  const totalRevenue = currentUserProfile.totalRevenue ?? 0;
  const totalWithdrawals = currentUserProfile.totalWithdrawals ?? 0;

  // Stats defaults
  const gigsCompleted = currentUserProfile.gigsCompleted ?? (currentUserProfile.role === "musicien" ? 3 : 0);
  const applicationsSent = currentUserProfile.applicationsSent ?? (currentUserProfile.role === "musicien" ? 8 : 0);
  const acceptanceRate = currentUserProfile.acceptanceRate ?? (currentUserProfile.role === "musicien" ? 85 : 100);

  // Edit Profile fields State
  const [firstName, setFirstName] = useState(currentUserProfile.firstName || "");
  const [lastName, setLastName] = useState(currentUserProfile.lastName || "");
  const [artistName, setArtistName] = useState(currentUserProfile.artistName || "");
  const [gender, setGender] = useState(currentUserProfile.gender || "Homme");
  const [birthDate, setBirthDate] = useState(currentUserProfile.birthDate || "");
  const [phone, setPhone] = useState(currentUserProfile.phone || "");
  const [whatsapp, setWhatsapp] = useState(currentUserProfile.whatsapp || "");
  const [commune, setCommune] = useState(currentUserProfile.commune || "Cocody");
  const [communeSearch, setCommuneSearch] = useState("");
  const [showCommuneDropdown, setShowCommuneDropdown] = useState(false);
  const [bio, setBio] = useState(currentUserProfile.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUserProfile.avatarUrl || currentUserProfile.photoURL || AVATARS[0]);
  
  const [specialties, setSpecialties] = useState<string[]>(
    currentUserProfile.specialties || 
    (currentUserProfile.specialty ? [currentUserProfile.specialty] : [])
  );
  const [musicGenres, setMusicGenres] = useState<string[]>(
    currentUserProfile.musicGenres || 
    (currentUserProfile.musicGenre ? [currentUserProfile.musicGenre] : [])
  );
  const [experience, setExperience] = useState(currentUserProfile.experience || "Intermédiaire");
  const [availabilities, setAvailabilities] = useState<string[]>(
    currentUserProfile.availabilities || 
    (currentUserProfile.isAvailableNow ? ["Disponible immédiatement"] : [])
  );
  const [waveNumber, setWaveNumber] = useState(currentUserProfile.waveNumber || currentUserProfile.paymentNumber || "");
  const [orangeMoneyNumber, setOrangeMoneyNumber] = useState(currentUserProfile.orangeMoneyNumber || "");

  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editError, setEditError] = useState("");

  // Webcam capturing and photo upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // New state fields for Phase 10
  const [ville, setVille] = useState(currentUserProfile.ville || "Abidjan");
  const [quartier, setQuartier] = useState(currentUserProfile.quartier || "");
  const [accountRole, setAccountRole] = useState(currentUserProfile.role || "musicien");
  const [freeSpecialty, setFreeSpecialty] = useState("");
  const [freeGenre, setFreeGenre] = useState("");

  // Media portfolio states
  const [mediaGallery, setMediaGallery] = useState<any[]>(currentUserProfile.mediaGallery || []);
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
      const downloadUrl = await gomboDB.uploadFile(path, file, (progress) => {
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

    const unsubApps = gomboDB.listenApplications((apps) => {
      const mine = apps.filter(a => a.musicianId === currentUserProfile.uid);
      setDynamicAppsCount(mine.length);
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
    try {
      const path = `avatars/${currentUserProfile.uid}/${Date.now()}_${file.name}`;
      const downloadUrl = await gomboDB.uploadFile(path, file, (progress) => {
        setUploadProgress(Math.round(progress));
      });
      setAvatarUrl(downloadUrl);
      
      // Persist directly in Firestore immediately
      await gomboDB.updateUserProfile(currentUserProfile.uid, {
        avatarUrl: downloadUrl,
        photoURL: downloadUrl,
      });
      // Fire refresh callback so user header and app components receive the updated photo URL immediately
      onRefreshProfile();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Une erreur de chargement est survenue. Veuillez réessayer.");
    } finally {
      setUploading(false);
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
        const downloadUrl = await gomboDB.uploadFile(path, mediaFile, (progress) => {
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
  }, [currentUserProfile?.uid, currentUserProfile]);

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
      updatedAt: new Date().toISOString()
    };

    try {
      await gomboDB.updateUserProfile(currentUserProfile.uid, updates);
      setEditSuccess(true);
      
      // Real-time notification that profile was updated
      window.dispatchEvent(new Event("gomboUserProfileChange"));
      
      try { audioSynth.playValidationSuccess(); } catch (_) {}
      
      // Immediately refresh profile locally
      onRefreshProfile();
      
      // Redirect back after success, 2s delay
      setTimeout(() => {
        setPanelView("main");
        onNavigateView("dashboard");
        setEditLoading(false);
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setEditError("Une erreur est survenue lors de la sauvegarde.");
      setEditLoading(false);
    } finally {
      // Don't set loading false here because it's handled in setTimeout if success
      // Or just handle loading locally
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
        await gomboDB.logUserActivity(currentUserProfile.uid, "Modifications profil", "Mise à jour des coordonnées et rôles du profil musical.");
        setSettingsStatusMsg("🟢 Profil musical mis à jour avec succès !");
      } else if (settingsTab === "styles") {
        await gomboDB.updateUserProfile(currentUserProfile.uid, { genres: sGenres });
        await gomboDB.logUserActivity(currentUserProfile.uid, "Modifications profil", `Mise à jour des styles musicaux préférés : ${sGenres.join(', ')}.`);
        setSettingsStatusMsg("🟢 Genres et styles musicaux enregistrés.");
      } else if (settingsTab === "collaborations") {
        await gomboDB.updateUserProfile(currentUserProfile.uid, { collaborations: sCollaborations });
        await gomboDB.logUserActivity(currentUserProfile.uid, "Modifications profil", `Mise à jour des préférences de collaborations : ${sCollaborations.join(', ')}.`);
        setSettingsStatusMsg("🟢 Préférences de collaborations enregistrées.");
      } else if (settingsTab === "notifications") {
        setSettingsStatusMsg("🟢 Préférences de notifications SMS Showbiz enregistrées.");
        await gomboDB.logUserActivity(currentUserProfile.uid, "Modifications profil", "Préférence d'alerte notifications showbiz configurée.");
      } else if (settingsTab === "langue") {
        setSettingsStatusMsg(`🟢 Langue de navigation modifiée : [${language === 'fr' ? 'Français' : 'Anglais'}].`);
        await gomboDB.logUserActivity(currentUserProfile.uid, "Modifications profil", `Langue modifiée en : ${language === 'fr' ? 'Français' : 'Anglais'}.`);
      } else if (settingsTab === "audio") {
        setSettingsStatusMsg(`🟢 Volume de sortie réglé à ${audioVolume}%.`);
        try { audioSynth.playTamTam(true); } catch (_) {}
      } else if (settingsTab === "confidentialite") {
        await gomboDB.updateUserProfile(currentUserProfile.uid, { phoneVisibility });
        await gomboDB.logUserActivity(currentUserProfile.uid, "Modifications profil", `Confidentialité ajustée sur option : ${phoneVisibility}.`);
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

  if (panelView === "main") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 text-[#1A1A1A] dark:text-gray-100">
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
        />
      </div>
    );
  }

  if (panelView === "edit") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 text-[#1A1A1A] dark:text-gray-100">
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
            setPanelView("main");
            // If in setup mode (initialPanelView === 'edit'), allow entering the app immediately
            if (initialPanelView === "edit") {
              onNavigateView("dashboard");
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
          onIdentityUpload={handleIdentityVerifyUpload}
          verifyingIdentity={verifyingIdentity}
          kycProgress={kycProgress}
          kycStatus={currentUserProfile.kycStatus}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 text-[#1A1A1A] dark:text-gray-100">
      
      {/* 1. MAIN BOARD SCREEN */}
      {(panelView as string) === "main" && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* PROFILE COMPLETION DETAILED PROGRESS BLOCK */}
          {(() => {
            let score = 0;
            const missing = [];
            
            // Check photo (using avatarUrl or photoURL)
            if (currentUserProfile.avatarUrl || currentUserProfile.photoURL) {
              score += 20;
            } else {
              missing.push({ name: "Photo de profil", bonus: "+20%", key: "photo" });
            }
            
            // Check bio
            if (currentUserProfile.bio && currentUserProfile.bio.trim().length > 0) {
              score += 20;
            } else {
              missing.push({ name: "Biographie (Bio)", bonus: "+20%", key: "bio" });
            }
            
            // Check phone
            if (currentUserProfile.phone && currentUserProfile.phone.trim().length > 0) {
              score += 20;
            } else {
              missing.push({ name: "Téléphone", bonus: "+20%", key: "phone" });
            }
            
            // Check commune
            if (currentUserProfile.commune && currentUserProfile.commune.trim().length > 0) {
              score += 20;
            } else {
              missing.push({ name: "Commune d’Abidjan", bonus: "+20%", key: "commune" });
            }
            
            // Check specialty
            if (currentUserProfile.specialty || currentUserProfile.speciality) {
              score += 20;
            } else {
              missing.push({ name: "Spécialité musicale", bonus: "+20%", key: "specialty" });
            }

            return (
              <div className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">📈 Force & Intégrité du Profil</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xl sm:text-2xl font-black text-gray-950 dark:text-white font-mono">{score}%</span>
                      <span className="text-xs font-bold text-gray-400">
                        {score === 100 ? "🎉 Profil 100% complet ! Prêt pour le showbiz ivoirien." : "Travaillez votre profil pour rassurer les promoteurs d'Abidjan."}
                      </span>
                    </div>
                  </div>
                  {score < 100 && (
                    <button
                      onClick={() => {
                        if (missing.some(m => m.key === "photo" || m.key === "bio" || m.key === "specialty")) {
                          setPanelView("edit");
                        } else {
                          onNavigateView("complete_profile");
                        }
                      }}
                      className="px-4 py-2 bg-[#D4AF37] hover:bg-[#E06C00] text-white font-bold rounded-xl text-xs uppercase tracking-wide whitespace-nowrap transition-colors cursor-pointer text-center"
                    >
                      🚀 Compléter mon profil
                    </button>
                  )}
                </div>

                {/* Progress Track */}
                <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-gradient-to-r from-[#D4AF37] to-amber-500 transition-all duration-500" 
                    style={{ width: `${score}%` }}
                  />
                </div>

                {/* Missing tasks to gamify engagement */}
                {score < 100 && (
                  <div className="space-y-2.5 pt-1 animate-fadeIn">
                    <span className="text-[10px] uppercase font-black text-[#D4AF37] dark:text-orange-400 tracking-widest block font-mono">🎯 Boostez votre visibilité en ajoutant :</span>
                    <div className="flex flex-wrap gap-2">
                      {missing.map((it, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (it.key === "photo" || it.key === "bio") {
                              setPanelView("edit");
                            } else {
                              onNavigateView("complete_profile");
                            }
                          }}
                          className="px-3 py-1.5 bg-gray-50 hover:bg-orange-50 dark:bg-gray-850 dark:hover:bg-orange-950/20 border border-gray-150 dark:border-gray-800 text-gray-650 dark:text-gray-300 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all text-left"
                        >
                          <span className="text-orange-550 font-extrabold">{it.bonus}</span>
                          <span>{it.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* HEADER PROFIL */}
          <div className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center gap-6 justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              {/* Profile image with availability toggle badge and verified status */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#D4AF37] bg-gray-100">
                  <img src={currentUserProfile.avatarUrl || currentUserProfile.photoURL || AVATARS[0]} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                {/* Verified Badge */}
                <div className="absolute -top-1 -right-1 p-1 bg-blue-500 text-white rounded-full border-2 border-white dark:border-[#121214]" title="Compte Vérifié Showbiz">
                  <ShieldCheck className="w-4 h-4 text-white fill-current" />
                </div>
                {/* Availability indicator */}
                <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white dark:border-[#121214] ${
                  availabilityStatus === "disponible" ? "bg-emerald-500" : availabilityStatus === "occupe" ? "bg-amber-500" : "bg-red-500"
                }`} title={
                  availabilityStatus === "disponible" ? "Disponible" : availabilityStatus === "occupe" ? "Occupé" : "Indisponible"
                } />
              </div>

              <div>
                <div className="flex items-center gap-1.5 justify-center sm:justify-start flex-wrap">
                  <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                    {currentUserProfile.firstName} {currentUserProfile.lastName}
                  </h2>
                  {currentUserProfile.artistName && (
                    <span className="text-sm font-bold text-orange-600 dark:text-[#D4AF37] block">
                      ({currentUserProfile.artistName})
                    </span>
                  )}
                  {/* Verified badge labeled */}
                  <span className="text-[9px] font-black tracking-widest text-[#D4AF37] dark:text-yellow-400 uppercase bg-orange-50 dark:bg-yellow-950/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                    🌟 VÉRIFIÉ
                  </span>

                  {/* Level badge */}
                  {(() => {
                    const gigs = currentUserProfile.gigsCompleted || 0;
                    const apps = currentUserProfile.applicationsSent || 0;
                    const rev = currentUserProfile.totalRevenue || 0;
                    let userLvl = "Nouveau Talent";
                    let levelColor = "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border border-purple-150/40 dark:border-purple-900/30";
                    if (gigs >= 8 || rev >= 100000 || apps >= 10) {
                      userLvl = "Boss du Gombo";
                      levelColor = "bg-gradient-to-r from-red-500/10 to-orange-500/10 dark:from-red-950/30 dark:to-orange-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40 font-black";
                    } else if (gigs >= 2 || rev >= 15000 || apps >= 3) {
                      userLvl = "Talent Confirmé";
                      levelColor = "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40";
                    }
                    return (
                      <span className={`text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 uppercase ${levelColor}`}>
                        👑 {userLvl}
                      </span>
                    );
                  })()}

                  {/* Activity Streak */}
                  {(() => {
                    const streak = localStorage.getItem("gombo_activity_streak") || "1";
                    return (
                      <span className="text-[9px] font-bold tracking-wider text-orange-600 dark:text-orange-400 uppercase bg-orange-50 dark:bg-orange-950/20 px-2 py-0.5 rounded-md flex items-center gap-1 border border-orange-100 dark:border-orange-900/30">
                        🔥 {streak} {parseInt(streak) > 1 ? "jours actifs" : "jour actif"}
                      </span>
                    );
                  })()}
                </div>

                {/* Active Badges list */}
                {currentUserProfile.badges && currentUserProfile.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start mt-2">
                    {currentUserProfile.badges.map((b) => {
                      const isGoldNoir = b.includes("Certifié") || b.includes("Vérifié");
                      return (
                        <span key={b} className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs tracking-wide border ${
                          isGoldNoir 
                            ? "bg-[#D4AF37] text-[#0B0B0B] border-[#D4AF37]/40" 
                            : "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20"
                        }`}>
                          {b}
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs font-bold text-gray-400 dark:text-gray-500 mt-2">
                  <span className="px-2.5 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[10px]">
                    🦁 {currentUserProfile.role === "musicien" ? "Musicien" : currentUserProfile.role === "client" ? "Client" : currentUserProfile.role === "organisateur" ? "Organisateur" : currentUserProfile.role === "manager" ? "Manager" : "Admin"}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {currentUserProfile.commune || "Abidjan"}
                  </span>
                  {(currentUserProfile.role === "musicien" || (currentUserProfile.role as string) === "groupe") && (
                    <span className="flex items-center gap-1 bg-orange-500/10 text-[#D4AF37] rounded-sm px-1 text-[11px]">
                      🎸 {currentUserProfile.specialties?.join(', ') || currentUserProfile.specialty || "Artiste"}
                    </span>
                  )}
                </div>

                {currentUserProfile.bio && (
                  <p className="text-xs text-gray-650 dark:text-gray-400 mt-2.5 max-w-lg leading-relaxed font-semibold italic">
                    "{currentUserProfile.bio}"
                  </p>
                )}

                {/* Showbiz Detailed User Metadata Grid */}
                <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-gray-800/80 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wide text-[9px]">Email:</span>
                    <span className="text-gray-800 dark:text-gray-200 select-all font-mono text-[11px]">{currentUserProfile.email || "Non renseigné"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wide text-[10px]">Date Inscription:</span>
                    <span className="text-gray-800 dark:text-gray-200 flex items-center gap-1.5 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-gray-450" />
                      {currentUserProfile.createdAt 
                        ? new Date(currentUserProfile.createdAt).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })
                        : "Non renseignée"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wide text-[9px]">Commune:</span>
                    <span className="text-gray-800 dark:text-gray-200">{currentUserProfile.commune || "Cocody"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wide text-[9px]">Authentification:</span>
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-[10px] font-black tracking-wider uppercase text-gray-450 rounded-md">
                      🔐 {currentUserProfile.provider || "Standard Email"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <span className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wide text-[9px]">Solde Cachets:</span>
                    <span className="font-extrabold text-[#D4AF37]">{(currentUserProfile.balance ?? 25000).toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Availability action and dynamic direct button share */}
            <div className="flex flex-col items-center sm:items-end gap-3 w-full md:w-auto border-t md:border-t-0 border-gray-50 dark:border-gray-850 pt-4 md:pt-0">
              <div className="flex flex-col gap-1.5 w-full">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 text-center sm:text-right">Statut de Disponibilité :</span>
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/60 p-1 rounded-xl w-full sm:w-60">
                  {[
                    { key: "disponible", label: "Disponible", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", dot: "🟢" },
                    { key: "occupe", label: "Occupé", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30", dot: "🟠" },
                    { key: "indisponible", label: "Indispo.", color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30", dot: "🔴" }
                  ].map((s) => {
                    const isActive = availabilityStatus === s.key;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        disabled={updatingAvailability}
                        onClick={() => handleUpdateAvailabilityStatus(s.key as any)}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all border flex items-center justify-center gap-1 cursor-pointer ${
                          isActive 
                            ? `${s.color} shadow-xs font-extrabold transform scale-102` 
                            : "bg-transparent text-gray-550 dark:text-gray-400 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        <span>{s.dot}</span>
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic WhatsApp wa.me links for user share profile */}
              <a
                href={`https://wa.me/?text=D%C3%A9couvre%20mon%20profil%20d%20Artiste%20sur%20Y%27A%20GOMBO%20MUSIC%20!%20${encodeURIComponent(window.location.origin)}`}
                target="_blank"
                rel="no-referrer"
                className="w-full text-center sm:text-right px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                📱 Partager mon profil
              </a>

              <button
                type="button"
                onClick={() => setPanelView("edit")}
                className="w-full text-center px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                📝 Modifier mon profil
              </button>

              {currentUserProfile?.email && [
                "johnsylvesterh@gmail.com",
                "sylvestrehounkpevi777@gmail.com",
                "jhs.kmj7@gmail.com"
              ].includes(currentUserProfile.email.toLowerCase()) && (
                <button
                  type="button"
                  onClick={() => onNavigateView("admin")}
                  className="w-full text-center px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-black rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                >
                  👑 Retour au Centre de Commande
                </button>
              )}
            </div>
          </div>

          {/* SECTION SOLDE ("Mon Solde" card) && STATS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Wallet Solde Component */}
            <div className="bg-gradient-to-br from-gray-900 to-[#121215] text-white p-6 rounded-3xl border border-gray-800 shadow-xl space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-black text-gray-400 tracking-widest block">💳 Mon Solde de Réserve</span>
                  <h3 className="text-3xl font-black text-[#D4AF37] tracking-tight mt-1.5">
                    {balance.toLocaleString()} <span className="text-base text-white/80">FCFA</span>
                  </h3>
                </div>
                <div className="bg-orange-500/10 p-2.5 rounded-2xl text-[#D4AF37] border border-orange-500/20">
                  <Wallet className="w-6 h-6 stroke-[2.5px]" />
                </div>
              </div>

              {/* Mini history data points */}
              <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-4 text-xs font-bold">
                <div>
                  <span className="text-[10px] uppercase font-black text-gray-500 block">Revenus Reçus</span>
                  <span className="text-emerald-400 mt-1 block">+{totalRevenue.toLocaleString()} FCFA</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-gray-500 block">Retraits Mobile Money</span>
                  <span className="text-red-400 mt-1 block">-{totalWithdrawals.toLocaleString()} FCFA</span>
                </div>
              </div>

              {/* Withdraw form */}
              <form onSubmit={handleWithdraw} className="space-y-3 pt-1">
                <span className="text-[11px] uppercase font-black text-gray-300 block">Faire un retrait d'argent</span>
                
                {withdrawSuccessMsg && (
                  <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-xl">
                    ✅ {withdrawSuccessMsg}
                  </div>
                )}
                {withdrawErrorMsg && (
                  <div className="p-3 bg-red-950/50 border border-red-500/30 text-red-400 text-xs font-semibold rounded-xl">
                    ⚠️ {withdrawErrorMsg}
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      placeholder="Montant FCFA"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                  
                  <select
                    value={selectedMMNetwork}
                    onChange={(e) => setSelectedMMNetwork(e.target.value as any)}
                    className="bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-xs font-bold text-gray-350 focus:outline-none"
                  >
                    <option value="Wave" className="text-black">🌊 Wave</option>
                    <option value="Orange" className="text-black">🍊 Orange</option>
                    <option value="MTN" className="text-black">🟡 MTN</option>
                  </select>

                  <button
                    type="submit"
                    disabled={withdrawLoading}
                    className="px-4 bg-[#D4AF37] hover:bg-orange-600 font-extrabold text-xs text-white rounded-xl shadow-md transition-colors active:scale-97 flex items-center justify-center"
                  >
                    {withdrawLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Retirer"
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Statistiques Panel */}
            <div className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-md space-y-4">
              <span className="text-[10px] uppercase font-black text-gray-400 dark:text-gray-500 tracking-widest block">🎯 STATS D'ACTIVITÉ</span>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-2xl">
                  <span className="text-2xl font-black text-gray-900 dark:text-white block">{gigsCompleted}</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight block mt-1">Gombos Joués</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-2xl font-bold">
                  <span className="text-2xl font-black text-gray-900 dark:text-white block">{applicationsSent}</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight block mt-1">Candidatures</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-2xl font-bold">
                  <span className="text-2xl font-black text-[#D4AF37] block">{acceptanceRate}%</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight block mt-1">Acceptation</span>
                </div>
              </div>

              {/* User rating out of 5 stars */}
              <div className="p-4 bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-wider block">Note de Showbiz</span>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-450 mt-1 block">Évaluations régulières sur Abidjan</span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  </div>
                  <span className="text-xs font-black text-yellow-600 dark:text-yellow-400 mt-1">5.0 / 5.0 (Pro)</span>
                </div>
              </div>
            </div>

          </div>

          {/* SECTION MES PUBLICATIONS (CRUD) */}
          <div className="space-y-3 pt-2">
            <span className="text-[10px] uppercase font-black text-gray-400 dark:text-gray-500 tracking-widest block">📝 Mes Publications ({myPosts.length})</span>
            {loadingPosts ? (
              <div className="flex justify-center p-6 bg-white dark:bg-[#121214] rounded-3xl border border-gray-150 dark:border-gray-800">
                <div className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : myPosts.length === 0 ? (
              <div className="p-6 bg-white dark:bg-[#121214] rounded-3xl border border-dashed border-gray-150 dark:border-gray-850/60 text-center">
                <p className="text-xs font-bold text-gray-500">Aucune publication active</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Vos Gombos, Démos, et Annonces s'afficheront ici.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {myPosts.map((post) => (
                  <div key={post.id} className="p-4 bg-white dark:bg-[#121214] rounded-2xl border border-gray-100 dark:border-gray-805 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${
                          post.type === "gombo" 
                            ? "bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-[#D4AF37]" 
                            : post.type === "demo"
                            ? "bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400"
                            : "bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400"
                        }`}>
                          {post.type || "Publication"}
                        </span>
                        {post.commune && (
                          <span className="text-[10px] font-bold text-gray-400">
                            📍 {post.commune}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-black text-gray-950 dark:text-white truncate">
                        {post.title || "Titre de publication"}
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed font-semibold">
                        {post.caption || post.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleStartEditPost(post)}
                        className="flex-1 sm:flex-none px-3.5 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border border-gray-100 dark:border-gray-750 cursor-pointer"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePost(post.id)}
                        className="flex-1 sm:flex-none px-3.5 py-2 bg-red-50 hover:bg-red-105 dark:bg-red-950/20 text-red-650 dark:text-red-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border border-red-100 dark:border-red-950/20 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* INLINE EDIT MODAL DIALOG */}
          <AnimatePresence>
            {editingPost && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="bg-white dark:bg-[#1a1a1f] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-150 dark:border-gray-800"
                >
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase mb-4 tracking-tight flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-805 pb-3">
                    📝 Modifier la Publication
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Titre</label>
                      <input
                        type="text"
                        value={editPostTitle}
                        onChange={(e) => setEditPostTitle(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50/60 dark:bg-gray-805/40 border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Description / Caption</label>
                      <textarea
                        rows={4}
                        value={editPostCaption}
                        onChange={(e) => setEditPostCaption(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50/60 dark:bg-gray-805/40 border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2.5 mt-6 border-t border-gray-100 dark:border-gray-850 pt-4">
                    <button
                      type="button"
                      onClick={() => setEditingPost(null)}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-extrabold text-xs uppercase rounded-lg cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePostEdit}
                      disabled={savingPostEdit}
                      className="px-5 py-2 bg-[#D4AF37] text-white font-extrabold text-xs uppercase rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      {savingPostEdit ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : "Sauvegarder"}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* SECTION ACTIONS RAPIDES */}
          <div className="space-y-3">
            <span className="text-[10px] uppercase font-black text-gray-400 dark:text-gray-500 tracking-widest block">⚡ ACTIONS RAPIDES</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Modifier mon profil", icon: User, action: () => setPanelView("edit"), color: "hover:border-[#7C3AED] hover:text-[#7C3AED]" },
                { label: "Mes Plans", icon: FileText, action: () => onNavigateView("dashboard", "applications"), color: "hover:border-purple-500 hover:text-purple-500" },
                { label: "Les Cachets", icon: Calendar, action: () => onNavigateView("dashboard", "reservations"), color: "hover:border-emerald-500 hover:text-emerald-500" },
                { label: "Le Terrain", icon: Award, action: () => onNavigateView("home"), color: "hover:border-[#7C3AED] hover:text-[#7C3AED]" },
                { label: "Réglages", icon: Settings, action: () => setPanelView("settings"), color: "hover:border-[#7C3AED] hover:text-[#7C3AED]" },
                { label: "On est là", icon: HelpCircle, action: () => setPanelView("support"), color: "hover:border-teal-500 hover:text-teal-500" }
              ].map((act, index) => {
                const IconComp = act.icon;
                return (
                  <button
                    key={index}
                    onClick={act.action}
                    className={`p-4 bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-800 rounded-2xl font-bold text-xs tracking-tight transition-all active:scale-97 text-gray-750 dark:text-gray-300 flex flex-col items-center justify-center gap-3 shadow-xs ${act.color}`}
                  >
                    <IconComp className="w-5 h-5" />
                    <span>{act.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={onLogout}
              className="w-full p-4 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-2xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4.5 h-4.5" />
              Déconnexion
            </button>
          </div>
        </motion.div>
      )}

      {/* 2. EDIT PROFILE PANEL */}
      {(panelView as string) === "edit" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase flex items-center gap-2">
              <User className="w-5.5 h-5.5 text-orange-500" />
              Modifier l'identité
            </h3>
            <button 
              onClick={() => setPanelView("main")}
              className="text-xs font-bold text-gray-500 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Retour
            </button>
          </div>

          {editError && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-705 text-sm font-semibold rounded-xl">
              ⚠️ {editError}
            </div>
          )}

          {editSuccess && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-805 text-sm font-semibold rounded-xl">
              🎉 Profil mis à jour avec succès !
            </div>
          )}

          <form onSubmit={handleEditProfileSubmit} className="space-y-6">
            <div className="bg-white dark:bg-[#121214] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
              
              <div className="border border-gray-100 dark:border-gray-800 p-4.5 rounded-2xl bg-gray-50/50 dark:bg-gray-850/20 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Photo de Profil (Avatar)
                  </label>
                  {uploading && (
                    <span className="text-[10px] font-black tracking-wider text-[#D4AF37] uppercase animate-pulse">
                      Chargement de la photo... {uploadProgress}%
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Current Preview or Camera active viewport */}
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#D4AF37] bg-gray-100 dark:bg-gray-800 flex-shrink-0 flex items-center justify-center shadow-inner">
                    {cameraActive ? (
                      <video
                        id="webcam-preview"
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                    ) : (
                      <img src={avatarUrl} alt="Aperçu" className="w-full h-full object-cover" />
                    )}
                  </div>

                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    {cameraActive ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                        >
                          📸 Prendre la Photo
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-750 dark:text-gray-300 font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {/* Choisir une photo button */}
                        <label className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-750 dark:text-gray-300 font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-gray-200/50 dark:border-gray-750">
                          <Upload className="w-3.5 h-3.5" />
                          Choisir une photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file);
                            }}
                          />
                        </label>

                        {/* Prendre une photo button */}
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-3.5 py-2 bg-[#D4AF37] hover:bg-[#E06C00] text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Prendre une photo
                        </button>
                      </div>
                    )}
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">
                      Pris en charge via Firebase Storage.
                    </span>
                  </div>
                </div>

                {/* Predefined alternative presets */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase block mb-1.5">Ou utiliser un avatar du Showbiz :</span>
                  <div className="flex flex-wrap gap-2">
                    {AVATARS.map((url, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setAvatarUrl(url)}
                        className={`relative w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${
                          avatarUrl === url ? "border-[#D4AF37] scale-105" : "border-transparent"
                        }`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        {avatarUrl === url && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Prénom(s)</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Nom de famille</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Nom d’Artiste / de Scène</label>
                  <input
                    type="text"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Sexe / Genre</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white text-black"
                  >
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Date de Naissance</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-805 rounded-xl text-sm dark:text-white text-black font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Téléphone Direct (+225)</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white text-black font-mono font-bold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                    Numéro WhatsApp (Laisser vide si identique)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 0505050607"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white text-black font-mono"
                  />
                </div>

                {/* Searchable Commune Selector */}
                <div className="md:col-span-2 relative">
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Commune d'Abidjan</label>
                  <div 
                    onClick={() => setShowCommuneDropdown(!showCommuneDropdown)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm cursor-pointer dark:text-white text-black font-bold flex items-center justify-between"
                  >
                    <span>📍 {commune || "Choisir votre commune..."}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>

                  {showCommuneDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#121214] border border-gray-150 dark:border-[#222226] rounded-xl shadow-2xl z-50 overflow-hidden max-h-60 flex flex-col">
                      <div className="p-2 border-b border-gray-100 dark:border-gray-850 bg-gray-50/50 dark:bg-gray-900/60 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <input 
                          type="text" 
                          placeholder="Filtre rapide (Yopougon, Cocody, ...)"
                          value={communeSearch}
                          onChange={(e) => setCommuneSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-transparent border-none text-xs focus:outline-none py-1 text-gray-900 dark:text-white"
                        />
                      </div>
                      
                      <div className="overflow-y-auto divide-y divide-gray-50 dark:divide-gray-850">
                        {ABIDJAN_COMMUNES.filter(c => c.toLowerCase().includes(communeSearch.toLowerCase())).map((com) => (
                          <button
                            key={com}
                            type="button"
                            onClick={() => {
                              setCommune(com);
                              setShowCommuneDropdown(false);
                              setCommuneSearch("");
                            }}
                            className={`w-full text-left px-3.5 py-2.5 text-xs font-bold hover:bg-[#D4AF37]/5 transition-all flex items-center justify-between ${
                              commune === com ? "text-[#D4AF37] bg-orange-500/5" : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            <span>📍 {com}</span>
                            {commune === com && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Ma présentation / Bio</label>
                <textarea
                  value={bio}
                  rows={2}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white text-black"
                />
              </div>
            </div>

            {(currentUserProfile.role === "musicien" || (currentUserProfile.role as string) === "groupe") && (
              <div className="bg-white dark:bg-[#121214] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-5">
                <div>
                  <span className="text-sm font-black text-gray-500 uppercase tracking-widest block mb-1">🎸 Spécialités Musicales (Sélection Multiple)</span>
                  <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider block">☑ Sélectionnez une ou plusieurs spécialités :</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pt-1 pr-1 border border-gray-50 dark:border-gray-850 p-2 rounded-xl">
                  {SPECIALTIES.map((spec) => {
                    const selected = specialties.includes(spec);
                    return (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => {
                          if (selected) {
                            setSpecialties(specialties.filter(s => s !== spec));
                          } else {
                            setSpecialties([...specialties, spec]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold text-left border flex items-center justify-between gap-1 transition-all ${
                          selected
                            ? "bg-[#D4AF37] border-[#D4AF37] text-white"
                            : "bg-gray-50 dark:bg-[#18181b] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-350"
                        }`}
                      >
                        <span className="truncate">{spec}</span>
                        {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div>
                  <span className="text-sm font-black text-gray-500 uppercase tracking-widest block mb-1">🎶 Genres Musicaux (Sélection Multiple)</span>
                  <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider block">☑ Sélectionnez un ou plusieurs genres :</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pt-1 pr-1 border border-gray-50 dark:border-gray-850 p-2 rounded-xl">
                  {GENRES.map((g) => {
                    const selected = musicGenres.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          if (selected) {
                            setMusicGenres(musicGenres.filter(item => item !== g));
                          } else {
                            setMusicGenres([...musicGenres, g]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold text-left border flex items-center justify-between gap-1 transition-all ${
                          selected
                            ? "bg-amber-500 border-amber-500 text-white"
                            : "bg-gray-50 dark:bg-[#18181b] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-350"
                        }`}
                      >
                        <span className="truncate">{g}</span>
                        {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-850 pt-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Niveau d'Expérience</label>
                    <select
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-105 rounded-xl text-sm font-bold text-black"
                    >
                      {EXPERIENCES.map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Disponibilité Générale</label>
                    <div className="space-y-1.5 mt-1 border border-gray-50 dark:border-gray-850 p-3 rounded-xl max-h-36 overflow-y-auto">
                      {["Week-end", "Semaine", "Journée", "Soirée", "Disponible immédiatement"].map((av) => {
                        const checked = availabilities.includes(av);
                        return (
                          <label key={av} className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                if (checked) {
                                  setAvailabilities(availabilities.filter(item => item !== av));
                                } else {
                                  setAvailabilities([...availabilities, av]);
                                }
                              }}
                              className="accent-orange-500 text-[#D4AF37]"
                            />
                            <span>{av}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-850 pt-4 space-y-3">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-wide block">💸 Mobile Money Targets</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">🌊 WAVE</label>
                      <input
                        type="text"
                        value={waveNumber}
                        onChange={(e) => setWaveNumber(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 text-black dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">🍊 ORANGE MONEY</label>
                      <input
                        type="text"
                        value={orangeMoneyNumber}
                        onChange={(e) => setOrangeMoneyNumber(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 text-black dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setPanelView("main")}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-750 dark:text-gray-300 font-bold rounded-xl"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="px-8 py-3 bg-[#D4AF37] hover:bg-orange-600 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                {editLoading ? "Sauvegarde..." : "Enregistrer les modifications"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* 3. SETTINGS PANEL */}
      {panelView === "settings" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase flex items-center gap-2">
              <Settings className="w-5.5 h-5.5 text-[#D4AF37]" />
              Paramètres Globaux
            </h3>
            <button 
              onClick={() => setPanelView("main")}
              className="text-xs font-bold text-gray-500 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5"
            >
              Retour
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Setting side tabs */}
            <div className="md:col-span-1 flex md:flex-col gap-2 overflow-x-auto whitespace-nowrap">
              {[
                { id: "musical", label: "🎤 Mon profil musical", icon: User },
                { id: "styles", label: "🎵 Mes styles", icon: Music },
                { id: "collaborations", label: "🤝 Collaborations", icon: Users },
                { id: "notifications", label: "🔔 Notifications", icon: Bell },
                { id: "langue", label: "🌐 Langue", icon: Globe },
                { id: "audio", label: "🎚 Préférences audio", icon: Radio },
                { id: "confidentialite", label: "🔒 Confidentialité", icon: Lock },
                { id: "historique", label: "📊 Mon activité", icon: Clipboard },
                { id: "support", label: "💬 Support AFRIGOMBO", icon: HelpCircle },
                { id: "logout", label: "🚪 Déconnexion", icon: LogOut }
              ].map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => { setSettingsTab(subTab.id as any); setSettingsStatusMsg(""); }}
                  className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all text-left flex items-center gap-2 cursor-pointer ${
                    settingsTab === subTab.id
                      ? "bg-purple-100/70 text-[#7C3AED] dark:bg-purple-950/20 dark:text-[#A78BFA]"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <subTab.icon className="w-4 h-4" />
                  <span>{subTab.label}</span>
                </button>
              ))}
            </div>

            {/* Sub-tab form */}
            <div className="md:col-span-3 bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm space-y-4">
              {settingsStatusMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 rounded-r-xl text-emerald-805 text-xs font-semibold">
                  {settingsStatusMsg}
                </div>
              )}

              <form onSubmit={handleSettingsUpdate} className="space-y-4 font-sans">
                {settingsTab === "musical" && (
                  <div className="space-y-4">
                    <span className="text-xs font-black text-amber-500 uppercase tracking-widest block">🎤 Mon Profil Musical</span>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                         <label className="block text-[10px] font-bold text-gray-500 mb-1">Prénom</label>
                         <input type="text" value={sPrenom} onChange={(e) => setSPrenom(e.target.value)} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs" />
                        </div>
                        <div>
                         <label className="block text-[10px] font-bold text-gray-500 mb-1">Nom</label>
                         <input type="text" value={sNom} onChange={(e) => setSNom(e.target.value)} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs" />
                        </div>
                    </div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Nom Artistique</label>
                    <input type="text" value={sNomArtistique} onChange={(e) => setSNomArtistique(e.target.value)} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs" />
                  </div>
                )}
                {settingsTab === "historique" && (
                  <div className="space-y-3">
                    <span className="text-xs font-black text-amber-500 uppercase tracking-widest block">📊 Mon Activité Réelle</span>
                    {userLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl flex gap-3 text-xs">
                         <div className="text-lg">⚡</div>
                         <div>
                            <p className="font-bold text-zinc-100">{log.type}</p>
                            <p className="text-zinc-500">{log.details}</p>
                            <p className="text-[10px] text-zinc-600">{new Date(log.timestamp).toLocaleString()}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                )}

                {settingsTab === "pref" && (
                  <div className="space-y-4">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest block">Préférences d'utilisation</span>
                    
                    <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-850 pb-3">
                      <div>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">Notifications SMS Showbiz</span>
                        <span className="text-[10px] text-gray-400 block">Recevoir une alerte WhatsApp ou SMS lors d'un nouveau gombo</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotifEnabled(!notifEnabled)}
                        className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${notifEnabled ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-700"}`}
                      >
                        <div className={`w-4.5 h-4.5 bg-white rounded-full shadow-md transition-transform ${notifEnabled ? "translate-x-4.5" : "translate-x-0"}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-850 pb-3">
                      <div>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">Mode Sombre Éco-Énergie</span>
                        <span className="text-[10px] text-gray-400 block">Améliore la batterie pour les concerts de nuit à Abidjan</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDarkMode(!darkMode)}
                        className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${darkMode ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-700"}`}
                      >
                        <div className={`w-4.5 h-4.5 bg-white rounded-full shadow-md transition-transform ${darkMode ? "translate-x-4.5" : "translate-x-0"}`} />
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">Langue préférée</label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-100 rounded-xl text-xs dark:text-white"
                      >
                        <option value="fr">Français (Showbiz 🇨🇮)</option>
                        <option value="en">English (West Africa)</option>
                      </select>
                    </div>
                  </div>
                )}

                {settingsTab === "secu" && (
                  <div className="space-y-4">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest block">Audit de Sécurité</span>
                    
                    <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-2xl text-xs space-y-1.5 border border-gray-100 dark:border-gray-800">
                      <p>📱 <strong>Dernier appareil connecté :</strong> Android Chrome V120, Abidjan</p>
                      <p>🌐 <strong>Dernière connexion :</strong> Aujourd'hui, 08h00</p>
                      <p>🛡️ <strong>Statut du certificat :</strong> Sécurisé par Firebase & Cryptage AES</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">Nouveau mot de passe</label>
                      <input
                        type="password"
                        placeholder="Créer un nouveau mot de passe"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-bold dark:text-white text-black"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => alert("Tous vos appareils ont été déconnectés avec succès.")}
                      className="text-[10px] uppercase font-black text-red-500 hover:underline block"
                    >
                      ⚠️ Déconnecter tous les autres appareils d'Abidjan
                    </button>
                  </div>
                )}

                {settingsTab === "confi" && (
                  <div className="space-y-4">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest block">Confidentialité & Visibilité</span>
                    <div>
                      <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">Qui peut voir mes coordonnées (Téléphone)?</label>
                      <select
                        value={phoneVisibility}
                        onChange={(e) => setPhoneVisibility(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-105 rounded-xl text-xs dark:text-white"
                      >
                        <option value="public">Tout le monde sur la plateforme</option>
                        <option value="recruters">Seulement les clients qui m'ont réservé</option>
                        <option value="private">Strictement privé</option>
                      </select>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
                >
                  Sauvegarder les paramètres
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      )}

      {/* 4. SUPPORT PANEL */}
      {panelView === "support" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm text-center space-y-4"
        >
          <div className="inline-flex p-3 bg-orange-100 dark:bg-orange-950 text-[#D4AF37] rounded-full">
            <HelpCircle className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold uppercase text-gray-900 dark:text-white">SUPPORT ASSISTANCE GOMBO</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
            Besoin d'aide pour une transaction Wave suspendue ou une annulation de gombo de dernière minute ? Nos administrateurs Showbiz basés au Plateau sont disponibles 24/7.
          </p>
          <div className="pt-2">
            <a
              href="https://wa.me/2250503222712?text=Bonjour%20AFRIGOMBO,%20j'ai%20besoin%20d'assistance."
              target="_blank"
              rel="no-referrer"
              className="inline-flex px-6 py-3 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-extrabold rounded-xl uppercase tracking-wider gap-2 shadow-md"
            >
              💬 Parler à un Admin sur WhatsApp
            </a>
          </div>
          <p className="text-[10px] text-gray-400 font-mono">Assistance AFRIGOMBO : +225 05 03 22 27 12</p>

          <div className="pt-4">
            <button
              onClick={() => setPanelView("main")}
              className="text-xs font-bold text-gray-500 hover:underline"
            >
              Retour à mon profil
            </button>
          </div>
        </motion.div>
      )}

    </div>
  );
}
