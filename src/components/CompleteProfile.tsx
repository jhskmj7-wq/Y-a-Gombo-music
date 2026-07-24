import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Phone, MapPin, Sparkles, Check, Camera, Upload, Globe, 
  PenTool, Calendar, Music, Radio, Users, Shield, ArrowRight, ArrowLeft
} from "lucide-react";
import { UserProfile } from "../types";
import { gomboDB, storage } from "../firebase";
import { audioSynth } from "../lib/audio";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const CIV_CITIES = [
  "Abidjan", "Bouaké", "Yamoussoukro", "San-Pédro", "Korhogo", "Daloa", "Man", "Gagnoa", "Grand-Bassam", "Bingerville", "Autre"
];

const AFRIGOMBO_ROLES = [
  { label: "🎤 Artiste", value: "Artiste" },
  { label: "🎧 Producteur", value: "Producteur" },
  { label: "🥁 Beatmaker", value: "Beatmaker" },
  { label: "🎹 Instrumentiste", value: "Instrumentiste" },
  { label: "🎼 Compositeur", value: "Compositeur" },
  { label: "🎬 Réalisateur clip", value: "Réalisateur clip" },
  { label: "🎙 Média", value: "Média" },
  { label: "🎫 Organisateur", value: "Organisateur" },
  { label: "🎵 Passionné musique", value: "Passionné musique" },
  { label: "🎚 Studio", value: "Studio" },
  { label: "🎓 Autre", value: "Autre" }
];

const GENERAL_GENRES = [
  "Afrobeats", "Rap", "Gospel", "Coupé-décalé", "Amapiano", "RnB", "Traditionnel", "Zouglou", "Dancehall", "Autre"
];

const COLLAB_PREFS = [
  "Collaborateurs", "Producteurs", "Beatmakers", "Studios", "Instrumentistes", "Événements", "Opportunités", "Managers"
];

interface CompleteProfileProps {
  currentUserProfile: UserProfile;
  onComplete: () => void;
}

export default function CompleteProfile({ currentUserProfile, onComplete }: CompleteProfileProps) {
  // Step 0: Welcome Screen
  // Step 1: Identitée & Localisation
  // Step 2: Profil Musical
  // Step 3: Univers Musical
  // Step 4: Collaborations & Je cherche
  // Step 5: Photo Profil & Confirmation
  const [activeStep, setActiveStep] = useState(0);

  // STEP 1 STATES
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [nomArtistique, setNomArtistique] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [country, setCountry] = useState("Côte d'Ivoire");
  const [city, setCity] = useState("Abidjan");
  const [district, setDistrict] = useState(""); // New field: Quartier
  const [telephone, setTelephone] = useState("");
  const [bio, setBio] = useState("");
  
  // Manual "Other" values
  const [otherCity, setOtherCity] = useState("");
  const [otherMainRole, setOtherMainRole] = useState("");
  const [otherGenre, setOtherGenre] = useState("");

  // STEP 2 STATES
  const [mainRole, setMainRole] = useState("Artiste");
  const [secondaryRoles, setSecondaryRoles] = useState<string[]>([]);

  // STEP 3 STATES
  const [genres, setGenres] = useState<string[]>([]);

  // STEP 4 STATES
  const [collaborations, setCollaborations] = useState<string[]>([]);

  // STEP 5 STATES
  const initialGdPhoto = currentUserProfile?.photoURL || currentUserProfile?.avatarUrl || "";
  const [gdPhoto, setGdPhoto] = useState(initialGdPhoto);
  const [avatarUrl, setAvatarUrl] = useState(gdPhoto);

  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState("");
  const [uploading, setUploading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const initializedProfile = useRef(false);

  // Initialize fields if they exist in user profile (only once)
  useEffect(() => {
    if (currentUserProfile && !initializedProfile.current) {
      if (currentUserProfile.prenom) setPrenom(currentUserProfile.prenom);
      else if (currentUserProfile.firstName) setPrenom(currentUserProfile.firstName);
      
      if (currentUserProfile.nom) setNom(currentUserProfile.nom);
      else if (currentUserProfile.lastName) setNom(currentUserProfile.lastName);
      
      if (currentUserProfile.nomArtistique) setNomArtistique(currentUserProfile.nomArtistique);
      else if (currentUserProfile.artisticName) setNomArtistique(currentUserProfile.artisticName);
      else if (currentUserProfile.displayName) setNomArtistique(currentUserProfile.displayName);

      if (currentUserProfile.phone) setTelephone(currentUserProfile.phone);
      else if (currentUserProfile.telephone) setTelephone(currentUserProfile.telephone);

      if (currentUserProfile.country) setCountry(currentUserProfile.country);
      if (currentUserProfile.city) setCity(currentUserProfile.city);
      else if (currentUserProfile.commune) setCity(currentUserProfile.commune);
      else if (currentUserProfile.ville) setCity(currentUserProfile.ville);

      if (currentUserProfile.bio) setBio(currentUserProfile.bio);
      
      initializedProfile.current = true;
    }
  }, [currentUserProfile]);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeStep]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300, facingMode: "user" } });
      setCameraStream(stream);
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 200);
    } catch (err) {
      console.error("Camera access failed:", err);
      alert("L'appareil photo n'est pas accessible sur cet appareil.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 400; // Better quality for "reality"
      canvas.height = 400;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Mirror horizontally back for the capture
        ctx.translate(400, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, 400, 400);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setAvatarUrl(dataUrl);

        // REAL-TIME FIREBASE UPLOAD
        if (storage) {
          setUploading(true);
          try {
            const resp = await fetch(dataUrl);
            const blob = await resp.blob();
            const photoRef = ref(storage, `users/${currentUserProfile.uid}/profile_capture_${Date.now()}.jpg`);
            await uploadBytes(photoRef, blob);
            const downloadURL = await getDownloadURL(photoRef);
            setAvatarUrl(downloadURL);
            setGdPhoto(downloadURL);
          } catch (stErr) {
            console.error("Storage upload error", stErr);
          } finally {
            setUploading(false);
          }
        }

        stopCamera();
        try { audioSynth.playKoraNote(500, 0, 0.1, 0.3); } catch (_) {}
      }
    } catch (err) {
      console.error("Capture photo fail:", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErrorMSG("");

    try {
      // Try real firebase storage if available
      if (storage) {
        const fileRef = ref(storage, `users/${currentUserProfile.uid}/profile_${Date.now()}.jpg`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        setAvatarUrl(url);
      } else {
        // base64 fallback
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setAvatarUrl(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
      try { audioSynth.playKoraNote(440, 0, 0.15, 0.3); } catch (_) {}
    } catch (uploadErr) {
      console.warn("Upload failed, falling back to local base64 reader:", uploadErr);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const validateStep = (step: number) => {
    setErrorMSG("");
    if (step === 1) {
      if (!prenom.trim()) {
        setErrorMSG("Le prénom est obligatoire.");
        return false;
      }
      if (!nom.trim()) {
        setErrorMSG("Le nom de famille est obligatoire.");
        return false;
      }
      if (!dateNaissance) {
        setErrorMSG("La date de naissance est obligatoire.");
        return false;
      }
      if (!country.trim()) {
        setErrorMSG("Le pays est obligatoire.");
        return false;
      }
      if (!city.trim()) {
        setErrorMSG("La ville est obligatoire.");
        return false;
      }
      if (!telephone.trim()) {
        setErrorMSG("Le numéro de téléphone est obligatoire.");
        return false;
      }
    } else if (step === 2) {
      if (!mainRole) {
        setErrorMSG("Veuillez sélectionner votre rôle principal.");
        return false;
      }
    } else if (step === 3) {
      if (genres.length === 0) {
        setErrorMSG("Veuillez choisir au moins un style de musique.");
        return false;
      }
    } else if (step === 4) {
      if (collaborations.length === 0) {
        setErrorMSG("Veuillez choisir ce que vous recherchez sur AFRIGOMBO.");
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
      try { audioSynth.playTamTam(true); } catch (_) {}
    }
  };

  const handlePrevStep = () => {
    setActiveStep(prev => prev - 1);
    try { audioSynth.playTamTam(false); } catch (_) {}
  };

  const handleSkipProfile = async () => {
    try {
      setLoading(true);
      
      // Update local storage backup key and active profile immediately for zero-lag page state shifts
      if (typeof window !== 'undefined') {
        localStorage.setItem("gombo_profile_skipped", "true");
        const updatedProfile = {
          ...currentUserProfile,
          isProfileComplete: false,
          profileSkipped: true,
          skippedProfile: true,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem("gombo_active_profile", JSON.stringify(updatedProfile));
      }

      await gomboDB.updateUserProfile(currentUserProfile.uid, {
        uid: currentUserProfile.uid,
        email: currentUserProfile.email || "",
        displayName: currentUserProfile.displayName || currentUserProfile.nomArtistique || `${currentUserProfile.firstName || "Artiste"} ${currentUserProfile.lastName || "Gombo"}`.trim(),
        photoURL: currentUserProfile.photoURL || currentUserProfile.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
        provider: "google",
        isProfileComplete: false,
        profileSkipped: true,
        skippedProfile: true,
        createdAt: currentUserProfile.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      if (typeof window !== 'undefined') {
        // window.history.pushState({}, "", "/home");
        // window.dispatchEvent(new Event("popstate"));
      }

      window.dispatchEvent(new Event("gomboUserProfileChange"));
      
      if (typeof window !== 'undefined') {
        const toast = document.createElement('div');
        toast.className = "fixed bottom-5 right-5 bg-afri-bg border border-[#D4AF37] text-afri-text px-6 py-4 rounded-xl shadow-2xl z-[10000] flex flex-col gap-1";
        toast.innerHTML = `
          <div class="flex items-center gap-2 text-[#D4AF37] font-black tracking-wide text-xs">
            <span>AFRIGOMBO LOGISTIC</span> <span>♫ 🎷 🪘</span>
          </div>
          <div class="text-xs text-afri-text">Bienvenue sur AFRIGOMBO</div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
      }
      
      onComplete();
    } catch (err) {
      console.error("Error skipping profile:", err);
      window.dispatchEvent(new Event("gomboUserProfileChange"));
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProfile = async () => {
    setLoading(true);
    setErrorMSG("");

    const finalMainRole = mainRole === "Autre" ? otherMainRole : mainRole;
    const finalGenres = genres.map(g => g === "Autre" ? otherGenre : g).filter(g => g.trim() !== "");
    const finalCity = city === "" || !CIV_CITIES.includes(city) ? otherCity : city;

    const updates: Partial<UserProfile> = {
      // New structure requested
      prenom: prenom.trim().normalize("NFC"),
      nom: nom.trim().normalize("NFC"),
      nomArtistique: (nomArtistique.trim() || `${prenom.trim()} ${nom.trim()}`).normalize("NFC"),
      photoURL: avatarUrl,
      telephone: telephone.trim().normalize("NFC"),
      location: {
        country: country.trim().normalize("NFC"),
        city: finalCity.trim().normalize("NFC"),
        district: district.trim().normalize("NFC")
      },
      bio: bio.trim().normalize("NFC"),
      mainRole: finalMainRole.normalize("NFC"),
      secondaryRoles: secondaryRoles.map(r => r.normalize("NFC")),
      genres: finalGenres.map(g => g.normalize("NFC")),
      collaborations: collaborations.map(c => c.normalize("NFC")),
      
      // Compatibility fields
      firstName: prenom.trim().normalize("NFC"),
      lastName: nom.trim().normalize("NFC"),
      displayName: (nomArtistique.trim() || `${prenom.trim()} ${nom.trim()}`).normalize("NFC"),
      artisticName: (nomArtistique.trim() || `${prenom.trim()} ${nom.trim()}`).normalize("NFC"),
      phone: telephone.trim().normalize("NFC"),
      commune: (district.trim() || finalCity.trim()).normalize("NFC"),
      ville: finalCity.trim().normalize("NFC"),
      country: country.trim().normalize("NFC"),
      city: finalCity.trim().normalize("NFC"),
      avatarUrl: avatarUrl,
      role: finalMainRole.normalize("NFC"),
      specialties: [finalMainRole, ...secondaryRoles].map(s => s.normalize("NFC")),

      isProfileComplete: true,
      updatedAt: new Date().toISOString()
    };

    try {
      await gomboDB.updateUserProfile(currentUserProfile.uid, updates);

      // Log actions in real-time user activity history
      try {
        await gomboDB.logUserActivity(
          currentUserProfile.uid,
          "Modifications profil",
          "Création et validation souveraine du profil d'artiste musical."
        );
      } catch (logErr) {
        console.warn("Could not log profile activity:", logErr);
      }

      // Live activity feed post
      try {
        await gomboDB.publishActivity({
          type: "talent",
          title: "🔑 Profil Bêta Certifié !",
          message: `👑 ${updates.nomArtistique} a rejoint la famille AFRIGOMBO en tant que ${mainRole} à ${city} (${country}) !`,
          userId: currentUserProfile.uid,
          userName: updates.nomArtistique || "Artiste Gombo",
          userAvatar: avatarUrl,
          targetId: currentUserProfile.uid
        });
      } catch (fErr) {
        console.warn("Activity feed post non-fatal err:", fErr);
      }

      window.dispatchEvent(new Event("gomboUserProfileChange"));
      onComplete();
    } catch (err: any) {
      console.error("Firestore onboarding update failed:", err);
      // Fallback: still try to progress if possible
      window.dispatchEvent(new Event("gomboUserProfileChange"));
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  // Get percentage for progress bar
  const getProgressPercentage = () => {
    if (activeStep === 0) return 0;
    if (activeStep === 1) return 25;
    if (activeStep === 2) return 50;
    if (activeStep === 3) return 75;
    return 100; // Step 4 or 5
  };

  const toggleSecondaryRole = (value: string) => {
    if (value === mainRole) return; // Can't be main and secondary Role simultaneously
    setSecondaryRoles(prev => 
      prev.includes(value) 
        ? prev.filter(r => r !== value) 
        : [...prev, value]
    );
    try { audioSynth.playTamTam(true); } catch (_) {}
  };

  const toggleGenre = (genre: string) => {
    setGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre) 
        : [...prev, genre]
    );
    try { audioSynth.playTamTam(true); } catch (_) {}
  };

  const toggleCollab = (collab: string) => {
    setCollaborations(prev => 
      prev.includes(collab) 
        ? prev.filter(c => c !== collab) 
        : [...prev, collab]
    );
    try { audioSynth.playTamTam(true); } catch (_) {}
  };

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] overflow-y-auto overscroll-contain overflow-x-hidden touch-pan-y [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch] max-w-xl mx-auto px-4 py-8 select-none box-border" id="onboarding-completion-root" style={{ wordBreak: 'break-word' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-afri-bg-sec border border-[#D4AF37]/25 rounded-[2rem] p-6 md:p-8 shadow-[0_0_50px_rgba(212,175,55,0.05)] relative text-left flex flex-col min-h-max pb-[140px] w-full max-w-full"
      >
        {/* Animated Gold Aura Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-afri-bg-sec/5 rounded-full blur-3xl pointer-events-none" />

        {/* Dynamic Progressive Bar (25%, 50%, 75%, 100%) */}
        {activeStep > 0 && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-afri-bg-sec z-20">
            <div 
              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#FFAA00] transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        )}

        {/* Active Step Indicator (Percent tag) */}
        {activeStep > 0 && (
          <div className="absolute top-4 right-4 bg-afri-bg border border-afri-border rounded-full py-1 px-3 text-[10px] font-mono font-black text-[#D4AF37]">
            {getProgressPercentage()}% COMPLÉTÉ
          </div>
        )}

        {errorMSG && (
          <div className="p-4 mb-5 bg-red-950/30 border border-red-500/20 rounded-2xl text-red-300 text-xs text-center font-bold z-30 relative animate-shake">
            ⚠️ {errorMSG}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 0: MUSICAL WELCOME SCREEN */}
          {activeStep === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="text-center py-6 space-y-8 flex flex-col items-center"
            >
              {/* Pulsing sound wave icon block */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500/10 to-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/25 shadow-[0_0_20px_rgba(212,175,55,0.1)] relative">
                  <span className="font-serif font-black text-5xl text-[#D4AF37] animate-pulse">🪘</span>
                </div>
                
                {/* Africans soundwave animation elements */}
                <div className="flex gap-1 justify-center items-center mt-6 h-10 w-24">
                  {[3, 7, 5, 8, 4, 6, 2].map((height, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-afri-bg-sec rounded-full"
                      animate={{ 
                        height: [6, height * 4, 6],
                      }}
                      transition={{ 
                        duration: 0.8 + i * 0.1, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl md:text-3xl font-black tracking-widest text-[#D4AF37] uppercase font-sans">
                  Bienvenue dans AFRIGOMBO
                </h2>
                <p className="text-sm text-afri-text font-medium max-w-sm mx-auto leading-relaxed">
                  Le terrain d'action de l'Afrique musicale
                </p>
                <p className="text-xs text-afri-text-sec max-w-xs mx-auto leading-relaxed">
                  Créez votre carte d'artiste certifiée et connectez-vous aux opportunités, beatmakers, studios et promoteurs du continent.
                </p>
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full h-13 bg-gradient-to-r from-[#D4AF37] to-[#FFAA00] hover:from-[#c29c29] hover:to-[#e69d00] text-[#050505] font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-2 shadow-[0_5px_20px_rgba(212,175,55,0.25)]"
              >
                <span>Commencer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* STEP 1: IDENTITY, DATE OF BIRTH, LOCALISATION, PHONE & BIO */}
          {activeStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-5 pt-4"
            >
              <h3 className="text-lg font-black text-[#D4AF37] uppercase tracking-wider mb-1 flex items-center gap-2">
                <User className="w-5 h-5" />
                <span>1. Votre Identité & Localisation</span>
              </h3>
              <p className="text-[11px] text-afri-text-sec mb-4">
                Saisissez les informations de base de votre carte d'artiste d'Afrique.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-afri-text-sec mb-1.5 label-required">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Serge"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="w-full px-4 py-3 bg-afri-bg border border-afri-border focus:border-[#D4AF37]/50 rounded-xl text-xs text-afri-text placeholder-zinc-700 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-afri-text-sec mb-1.5">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Kassi"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full px-4 py-3 bg-afri-bg border border-afri-border focus:border-[#D4AF37]/50 rounded-xl text-xs text-afri-text placeholder-zinc-700 font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-afri-text-sec mb-1.5">
                    Nom Artistique / De Scène (Facultatif)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: DJ Gombo, Serge K."
                    value={nomArtistique}
                    onChange={(e) => setNomArtistique(e.target.value)}
                    className="w-full px-4 py-3 bg-afri-bg border border-afri-border focus:border-[#D4AF37]/50 rounded-xl text-xs text-afri-text placeholder-zinc-700 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-afri-text-sec mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#D4AF37]" />
                    <span>Date de naissance *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dateNaissance}
                    onChange={(e) => setDateNaissance(e.target.value)}
                    className="w-full px-4 py-3 bg-afri-bg border border-afri-border focus:border-[#D4AF37]/50 rounded-xl text-xs text-afri-text uppercase font-bold focus:outline-none focus:text-afri-text [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-afri-text-sec mb-1.5 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-[#D4AF37]" />
                    <span>Pays d'origine *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Côte d'Ivoire, Sénégal"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 bg-afri-bg border border-afri-border focus:border-[#D4AF37]/50 rounded-xl text-xs text-afri-text placeholder-zinc-700 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-afri-text-sec mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#D4AF37]" />
                    <span>Ville / Commune *</span>
                  </label>
                  <select
                    value={CIV_CITIES.includes(city) ? city : "Autre"}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setCity(selected === "Autre" ? "" : selected);
                    }}
                    className="w-full px-4 py-3 bg-afri-bg border border-afri-border focus:border-[#D4AF37]/50 rounded-xl text-xs text-afri-text font-bold focus:outline-none mb-2"
                  >
                    <option value="">Sélectionner une ville...</option>
                    {CIV_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  
                  <AnimatePresence>
                    {(city === "" || !CIV_CITIES.includes(city)) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 4 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <input
                          type="text"
                          placeholder="✏ Entrez votre ville manuellement..."
                          value={otherCity}
                          onChange={(e) => {
                            setOtherCity(e.target.value);
                            setCity(e.target.value);
                          }}
                          className="w-full px-4 py-3 bg-afri-bg-sec/50 border border-[#D4AF37]/30 focus:border-[#D4AF37] rounded-xl text-xs text-afri-text placeholder-zinc-600 font-bold focus:outline-none"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-afri-text-sec mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#D4AF37]" />
                  <span>Quartier / District (Facultatif)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Riviera Palmeraie, Marcory Zone 4..."
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-4 py-3 bg-afri-bg border border-afri-border focus:border-[#D4AF37]/50 rounded-xl text-xs text-afri-text placeholder-zinc-700 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-afri-text-sec mb-1.5 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#D4AF37]" />
                  <span>Téléphone Direct (+225) *</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: 07 00 11 22 33"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="w-full px-4 py-3 bg-afri-bg border border-afri-border focus:border-[#D4AF37]/50 rounded-xl text-xs text-afri-text placeholder-zinc-700 font-mono font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-afri-text-sec mb-1.5 flex items-center gap-1">
                  <PenTool className="w-3 h-3 text-[#D4AF37]" />
                  <span>Biographie d'Artiste / Présentation (Bio)</span>
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  placeholder="Présentez brièvement votre profil du showbiz, votre style ou vos ambitions..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-3 bg-afri-bg border border-afri-border focus:border-[#D4AF37]/50 rounded-xl text-xs text-afri-text placeholder-zinc-700 leading-relaxed font-bold focus:outline-none font-sans"
                />
                <p className="text-right text-[8px] font-mono text-zinc-650 uppercase">
                  {bio.length} / 500 caracts
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex-1 h-13 bg-afri-bg border border-afri-border text-afri-text-sec hover:text-afri-text font-bold text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Retour</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-[2] h-13 bg-gradient-to-r from-[#D4AF37] to-[#FFAA00] text-black font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1 shadow-lg"
                  >
                    <span>Continuer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={handleSkipProfile}
                  disabled={loading}
                  className="w-full h-12 bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-black font-black text-[11px] uppercase tracking-[0.2em] rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>MODIFIER MON PROFIL PLUS TARD & ACCÉDER À L'APPLICATION</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: MUSICAL ROLES (MAIN + SECONDARY) */}
          {activeStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 pt-4"
            >
              <div>
                <h3 className="text-lg font-black text-[#D4AF37] uppercase tracking-wider mb-1 flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  <span>2. Votre Profil Musical</span>
                </h3>
                <p className="text-[11px] text-afri-text-sec">
                  Définissez vos rôles clés dans l'industrie musicale africaine.
                </p>
              </div>

              {/* MAIN ROLE: Single exclusive select */}
              <div className="space-y-3">
                <span className="block text-[10px] font-black uppercase text-afri-text-sec tracking-wider">
                  Quel est votre rôle principal ? * (Choix unique)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                  {AFRIGOMBO_ROLES.map((r) => (
                    <button
                      key={`main-${r.value}`}
                      type="button"
                      onClick={() => {
                        setMainRole(r.value);
                        // Filter main role out of secondary roles if it was there
                        setSecondaryRoles(prev => prev.filter(v => v !== r.value));
                        try { audioSynth.playTamTam(true); } catch (_) {}
                      }}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between font-bold text-[10px] uppercase tracking-tight ${
                        mainRole === r.value
                          ? "border-[#D4AF37] bg-afri-bg-sec/10 text-[#D4AF37] scale-[1.02]"
                          : "border-afri-border bg-afri-bg text-afri-text-sec hover:text-afri-text"
                      }`}
                    >
                      <span className="truncate">{r.label}</span>
                      {mainRole === r.value && <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />}
                    </button>
                  ))}
                </div>

                <AnimatePresence>
                  {mainRole === "Autre" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, height: 0 }}
                      animate={{ opacity: 1, scale: 1, height: "auto" }}
                      exit={{ opacity: 0, scale: 0.95, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden mt-2"
                    >
                      <input
                        type="text"
                        placeholder="✏ Entrez votre rôle (ex: Ingénieur son, Manager...)"
                        value={otherMainRole}
                        onChange={(e) => setOtherMainRole(e.target.value)}
                        className="w-full px-4 py-3 bg-afri-bg-sec/50 border border-[#D4AF37]/30 focus:border-[#D4AF37] rounded-xl text-xs text-afri-text placeholder-zinc-600 font-bold focus:outline-none"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* SECONDARY ROLES: Multi choice select */}
              <div className="space-y-3 pt-2 border-t border-afri-border">
                <span className="block text-[10px] font-black uppercase text-afri-text-sec tracking-wider">
                  D'autres rôles showbiz secondaires ? (Choix multiples libres)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                  {AFRIGOMBO_ROLES.map((r) => {
                    const isMain = mainRole === r.value;
                    const isSelected = secondaryRoles.includes(r.value);
                    if (isMain) return null; // Avoid duplicating role
                    return (
                      <button
                        key={`sec-${r.value}`}
                        type="button"
                        onClick={() => toggleSecondaryRole(r.value)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between font-bold text-[10px] uppercase tracking-tight ${
                          isSelected
                            ? "border-amber-500/50 bg-amber-500/5 text-amber-400"
                            : "border-afri-border bg-afri-bg text-afri-text-sec hover:text-afri-text-sec"
                        }`}
                      >
                        <span className="truncate">{r.label}</span>
                        {isSelected && <Check className="w-3 h-3 text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex-1 h-13 bg-afri-bg border border-afri-border text-afri-text-sec hover:text-afri-text font-bold text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Retour</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-[2] h-13 bg-gradient-to-r from-[#D4AF37] to-[#FFAA00] text-black font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1 shadow-lg"
                  >
                    <span>Continuer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={handleSkipProfile}
                  disabled={loading}
                  className="w-full h-12 bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-black font-black text-[11px] uppercase tracking-[0.2em] rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>MODIFIER MON PROFIL PLUS TARD & ACCÉDER À L'APPLICATION</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: MUSICAL UNIVERSE (GENRES PREFERES) */}
          {activeStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 pt-4"
            >
              <div>
                <h3 className="text-lg font-black text-[#D4AF37] uppercase tracking-wider mb-1 flex items-center gap-2">
                  <Radio className="w-5 h-5" />
                  <span>3. Votre Univers Musical</span>
                </h3>
                <p className="text-[11px] text-afri-text-sec">
                  Sélectionnez vos genres préférés et vos influences sonores (Sélection multiple).
                </p>
              </div>

              <div className="space-y-4">
                <span className="block text-[10px] font-black uppercase text-afri-text-sec tracking-wider">
                  Quels styles définissent votre direction artistique ? *
                </span>
                
                <div className="grid grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {GENERAL_GENRES.map((g) => {
                    const isSelected = genres.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleGenre(g)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between font-bold text-[10.5px] xs:text-xs uppercase tracking-tight break-normal ${
                          isSelected
                            ? "border-[#D4AF37] bg-afri-bg-sec/10 text-[#D4AF37] scale-[1.01]"
                            : "border-afri-border w-full bg-afri-bg text-afri-text-sec hover:text-afri-text hover:bg-afri-bg-sec"
                        }`}
                      >
                        <span className="truncate">{g}</span>
                        {isSelected ? (
                          <div className="w-4 h-4 rounded-full bg-afri-bg-sec text-black flex items-center justify-center shrink-0 ml-1">
                            <Check className="w-2.5 h-2.5 stroke-[4px]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-afri-border shrink-0 ml-1" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {genres.includes("Autre") && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden mt-2"
                    >
                      <input
                        type="text"
                        placeholder="✏ Entrez votre style (ex: Afro-fusion, Drill...)"
                        value={otherGenre}
                        onChange={(e) => setOtherGenre(e.target.value)}
                        className="w-full px-4 py-3 bg-afri-bg-sec/50 border border-[#D4AF37]/30 focus:border-[#D4AF37] rounded-xl text-xs text-afri-text placeholder-zinc-600 font-bold focus:outline-none"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex-1 h-13 bg-afri-bg border border-afri-border text-afri-text-sec hover:text-afri-text font-bold text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Retour</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-[2] h-13 bg-gradient-to-r from-[#D4AF37] to-[#FFAA00] text-black font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1 shadow-lg"
                  >
                    <span>Continuer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSkipProfile}
                  disabled={loading}
                  className="w-full h-12 bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-black font-black text-[11px] uppercase tracking-[0.2em] rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>MODIFIER MON PROFIL PLUS TARD & ACCÉDER À L'APPLICATION</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: COLLABORATIONS (JE CHERCHE) */}
          {activeStep === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 pt-4"
            >
              <div>
                <h3 className="text-lg font-black text-[#D4AF37] uppercase tracking-wider mb-1 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>4. Vos Collaborations</span>
                </h3>
                <p className="text-[11px] text-afri-text-sec">
                  Déterminez précisément ce que vous recherchez au sein de l'écosystème AFRIGOMBO (Sélection multiple).
                </p>
              </div>

              <div className="space-y-4">
                <span className="block text-[10px] font-black uppercase text-afri-text-sec tracking-wider">
                  Quelles connexions showbiz vous intéressent ? *
                </span>
                
                <div className="grid grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {COLLAB_PREFS.map((collab) => {
                    const isSelected = collaborations.includes(collab);
                    return (
                      <button
                        key={collab}
                        type="button"
                        onClick={() => toggleCollab(collab)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between font-bold text-[10.5px] xs:text-xs uppercase tracking-tight break-normal ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/10 text-amber-400 scale-[1.01]"
                            : "border-afri-border w-full bg-afri-bg text-afri-text-sec hover:text-afri-text hover:bg-afri-bg-sec"
                        }`}
                      >
                        <span className="truncate">{collab}</span>
                        {isSelected ? (
                          <div className="w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center shrink-0 ml-1">
                            <Check className="w-2.5 h-2.5 stroke-[4px]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-afri-border shrink-0 ml-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex-1 h-13 bg-afri-bg border border-afri-border text-afri-text-sec hover:text-afri-text font-bold text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Retour</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-[2] h-13 bg-gradient-to-r from-[#D4AF37] to-[#FFAA00] text-black font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1 shadow-lg"
                  >
                    <span>Continuer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSkipProfile}
                  disabled={loading}
                  className="w-full h-12 bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-black font-black text-[11px] uppercase tracking-[0.2em] rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>MODIFIER MON PROFIL PLUS TARD & ACCÉDER À L'APPLICATION</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: PROFILE PHOTO & FINAL CONFIRMATION */}
          {activeStep === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 pt-4"
            >
              <div className="text-center">
                <h3 className="text-lg font-black text-[#D4AF37] uppercase tracking-wider mb-1 flex items-center justify-center gap-2">
                  <Camera className="w-5 h-5" />
                  <span>5. Votre Photo de Profil</span>
                </h3>
                <p className="text-[11px] text-afri-text-sec">
                  Conservez votre photo Google récupérée automatiquement ou ajoutez votre plus beau cliché showbiz.
                </p>
              </div>

              <div className="flex flex-col items-center space-y-4">
                {/* Image / Video preview bubble */}
                <div className="relative w-36 h-36 rounded-full border-2 border-[#D4AF37] p-1 bg-afri-bg overflow-hidden flex items-center justify-center shadow-lg">
                  {cameraActive ? (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover rounded-full scale-x-[-1]"
                    />
                  ) : avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Artiste"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-afri-bg flex items-center justify-center text-[#D4AF37] font-sans font-black text-3xl uppercase rounded-full">
                      {(nomArtistique || prenom || "A").charAt(0)}
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-afri-bg/80 flex items-center justify-center rounded-full">
                      <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-mono text-afri-text-sec uppercase tracking-wider">
                    PHOTO AUTOMATIQUE : {avatarUrl !== gdPhoto ? "MODIFIÉE ⚡" : "ACTIVE ✔"}
                  </span>
                  
                  <div className="flex gap-2.5">
                    {cameraActive ? (
                      <>
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="px-3 py-1.5 bg-emerald-500 text-black font-black text-[10px] rounded-lg tracking-wider hover:bg-emerald-400 uppercase cursor-pointer"
                        >
                          Enregistrer 📸
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="px-3 py-1.5 bg-afri-bg-sec border border-afri-border text-afri-text-sec font-bold text-[10px] rounded-lg hover:text-afri-text uppercase cursor-pointer"
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setAvatarUrl(gdPhoto)}
                          disabled={avatarUrl === gdPhoto}
                          className="px-3.5 py-2 bg-afri-bg border border-zinc-9D0 text-afri-text-sec hover:text-afri-text disabled:opacity-40 font-bold text-[9.5px] rounded-xl hover:bg-afri-bg-sec uppercase cursor-pointer border-afri-border"
                        >
                          Réinitialiser (Photo Google)
                        </button>
                        
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-3.5 py-2 bg-afri-bg border border-afri-border text-afri-text hover:text-afri-text font-bold text-[9.5px] rounded-xl hover:bg-afri-bg-sec uppercase flex items-center gap-1 cursor-pointer border-afri-border"
                        >
                          <Camera className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Caméra</span>
                        </button>

                        <label className="px-3.5 py-2 bg-afri-bg-sec/10 border border-[#D4AF37]/20 text-[#D4AF37] hover:bg-afri-bg-sec/20 font-bold text-[9.5px] rounded-xl uppercase flex items-center gap-1 cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Téléverser</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Recapitulation check list */}
              <div className="p-4 bg-afri-bg border border-afri-border rounded-2xl text-[10px] text-afri-text-sec space-y-2 font-mono">
                <p className="font-sans font-black text-[#D4AF37] uppercase tracking-wider mb-1">Résumé de signature :</p>
                <p>👤 <strong>Nom Showbiz :</strong> {nomArtistique || `${prenom} ${nom}`}</p>
                <p>📞 <strong>Téléphone certifié :</strong> {telephone}</p>
                <p>📍 <strong>Localité d'action :</strong> {district ? `${district}, ` : ""}{city === "" || !CIV_CITIES.includes(city) ? otherCity : city}, {country}</p>
                <p>👑 <strong>Rôle principal :</strong> {mainRole === "Autre" ? otherMainRole : mainRole}</p>
                <p>🎧 <strong>Rôles secondaires :</strong> {secondaryRoles.length > 0 ? secondaryRoles.join(", ") : "Aucun"}</p>
                <p>🎵 <strong>Styles :</strong> {genres.map(g => g === "Autre" ? otherGenre : g).join(", ")}</p>
                <p>🤝 <strong>Je recherche :</strong> {collaborations.join(", ")}</p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex-1 h-13 bg-afri-bg border border-afri-border text-afri-text-sec hover:text-afri-text font-bold text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Retour</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitProfile}
                    disabled={loading || uploading}
                    className="flex-[2] h-13 bg-gradient-to-r from-[#D4AF37] to-[#FFAA00] disabled:from-afri-bg-sec disabled:to-afri-bg-action disabled:text-afri-text-sec text-black font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                        <span>Enregistrement...</span>
                      </>
                    ) : (
                      <>
                        <span>Modifier & Accéder à l'application 🚀</span>
                        <Check className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSkipProfile}
                  disabled={loading}
                  className="w-full h-12 bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-black font-black text-[11px] uppercase tracking-[0.2em] rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>MODIFIER MON PROFIL PLUS TARD & ACCÉDER À L'APPLICATION</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-[8px] text-zinc-700 font-mono mt-8 uppercase tracking-widest text-center">
          VOTRE SÉCURITÉ ET VOTRE RETRAITE D'ARTISTE SONT GARANTIES PAR AFRIGOMBO
        </p>
      </motion.div>
    </div>
  );
}
