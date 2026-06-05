import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Phone, MapPin, Music, Award, Wallet, Send, FileText, Check, 
  Sparkles, ShieldCheck, Heart, CreditCard, Star, Radio,
  Camera, Upload, RefreshCw, Eye, MessageSquare, Calendar, Sliders, ChevronDown, Search
} from "lucide-react";
import { UserProfile, UserRole } from "../types";
import { gomboDB } from "../firebase";

const CIV_CITIES = [
  "Abidjan", "Bouaké", "Yamoussoukro", "San-Pédro", "Korhogo", "Daloa", "Man", "Gagnoa", "Grand-Bassam", "Bingerville", "Autre"
];

const ABIDJAN_COMMUNES = [
  "Cocody", "Yopougon", "Marcory", "Plateau", "Treichville", "Abobo", 
  "Koumassi", "Adjamé", "Port-Bouët", "Attécoubé", "Grand-Bassam", "Bingerville"
];

const MAIN_PROFESSIONS = [
  "🎤 Chanteur / Chanteuse",
  "🎹 Pianiste / Claviériste",
  "🥁 Batteur",
  "🎸 Guitariste Solo",
  "🎸 Guitariste Rythmique",
  "🎸 Bassiste",
  "🎷 Saxophoniste",
  "🎧 DJ",
  "🎛️ Producteur / Beatmaker",
  "🎶 Choriste",
  "🎙️ Manager / Organisateur",
  "Autre"
];

const ALL_SPECIALTIES = [
  "🎤 Chanteur",
  "🎹 Pianiste / Clavier",
  "🥁 Batteur",
  "🎸 Guitariste Solo",
  "🎸 Guitariste Rythme",
  "🎸 Bassiste",
  "🎧 DJ / Ambianceur",
  "🎷 Saxophoniste",
  "🎺 Trompettiste",
  "🎶 Choriste",
  "🎛️ Arrangeur / Beatmaker",
  "🎤 Rappeur"
];

const ALL_GENRES = [
  "Coupé-Décalé", "Zouglou", "Wôyô", "Afrobeat", "Amapiano", "Gospel", 
  "Reggae", "Dancehall", "Rap Ivoire", "RnB", "Soul", "Jazz", 
  "Orchestre Live", "Animation Mariage", "Animation Maquis", "Animation Église"
];

const ALL_EXPERIENCES = [
  "Débutant", "Intermédiaire", "Confirmé", "Professionnel d'Élite"
];

const ALL_AVAILABILITIES = [
  "Week-end", "Semaine", "Journée", "Soirée", "Disponible immédiatement"
];

const AVATARS = [
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150"
];

interface CompleteProfileProps {
  currentUserProfile: UserProfile;
  onComplete: () => void;
}

export default function CompleteProfile({ currentUserProfile, onComplete }: CompleteProfileProps) {
  // Navigation & UI States
  const [activeStep, setActiveStep] = useState(1);
  const [role, setRole] = useState<UserRole>(() => {
    const r = currentUserProfile.role || "musicien";
    if (r === ("groupe" as any)) return "musicien";
    return r;
  });
  
  // Section 1: Identité
  const [firstName, setFirstName] = useState(currentUserProfile.firstName || "");
  const [lastName, setLastName] = useState(currentUserProfile.lastName || "");
  const [artistName, setArtistName] = useState(currentUserProfile.artistName || "");
  const [gender, setGender] = useState(currentUserProfile.gender || "Homme");
  const [birthDate, setBirthDate] = useState(currentUserProfile.birthDate || "");
  const [phone, setPhone] = useState(currentUserProfile.phone || "");
  const [whatsapp, setWhatsapp] = useState(currentUserProfile.whatsapp || "");
  
  // Section 2: Métier & Spécialités
  const [metierPrincipal, setMetierPrincipal] = useState(currentUserProfile.specialty || "🎤 Chanteur / Chanteuse");
  const [specialties, setSpecialties] = useState<string[]>(currentUserProfile.specialties || []);
  const [musicGenres, setMusicGenres] = useState<string[]>(currentUserProfile.musicGenres || []);
  const [experience, setExperience] = useState(currentUserProfile.experience || "Intermédiaire");
  const [availabilities, setAvailabilities] = useState<string[]>(currentUserProfile.availabilities || []);
  const [bio, setBio] = useState(currentUserProfile.bio || "");

  // Section 3: Ville & Commune
  const [ville, setVille] = useState(currentUserProfile.ville || "Abidjan");
  const [customVille, setCustomVille] = useState("");
  const [commune, setCommune] = useState(currentUserProfile.commune || "Cocody");
  const [customCommune, setCustomCommune] = useState("");
  const [communeSearch, setCommuneSearch] = useState("");
  const [showCommuneDropdown, setShowCommuneDropdown] = useState(false);
  const communeDropdownRef = useRef<HTMLDivElement>(null);

  // Photo
  const [avatarUrl, setAvatarUrl] = useState(currentUserProfile.avatarUrl || currentUserProfile.photoURL || AVATARS[0]);

  // Mobile Money Coordonnées
  const [waveNumber, setWaveNumber] = useState(currentUserProfile.waveNumber || "");
  const [orangeMoneyNumber, setOrangeMoneyNumber] = useState(currentUserProfile.orangeMoneyNumber || "");

  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState("");

  // Camera & Uploader
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (communeDropdownRef.current && !communeDropdownRef.current.contains(event.target as Node)) {
        setShowCommuneDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300, facingMode: "user" } });
      setCameraStream(stream);
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access failed:", err);
      alert("L'appareil photo n'est pas disponible ou refuse l'accès.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  const capturePhoto = async () => {
    const video = document.getElementById("complete-webcam-preview") as HTMLVideoElement;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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
    } catch (err) {
      console.error("Upload error:", err);
      alert("Erreur de transfert. Veuillez réessayer.");
    } finally {
      setUploading(false);
    }
  };

  const handleToggleSpecialty = (spec: string) => {
    if (specialties.includes(spec)) {
      setSpecialties(specialties.filter(s => s !== spec));
    } else {
      setSpecialties([...specialties, spec]);
    }
  };

  const handleToggleGenre = (g: string) => {
    if (musicGenres.includes(g)) {
      setMusicGenres(musicGenres.filter(item => item !== g));
    } else {
      setMusicGenres([...musicGenres, g]);
    }
  };

  const handleToggleAvailability = (av: string) => {
    if (availabilities.includes(av)) {
      setAvailabilities(availabilities.filter(item => item !== av));
    } else {
      setAvailabilities([...availabilities, av]);
    }
  };

  const validateCurrentStep = () => {
    setErrorMSG("");
    if (activeStep === 1) {
      if (!role) {
        setErrorMSG("Veuillez sélectionner votre type de compte.");
        return false;
      }
      if (!firstName.trim()) {
        setErrorMSG("Le prénom est obligatoire.");
        return false;
      }
      if (!lastName.trim()) {
        setErrorMSG("Le nom de famille est obligatoire.");
        return false;
      }
      if (!artistName.trim()) {
        setErrorMSG("Le nom d'artiste / de scène est obligatoire.");
        return false;
      }
      if (!phone.trim()) {
        setErrorMSG("Le numéro de téléphone direct est obligatoire.");
        return false;
      }
    }
    if (activeStep === 2) {
      if (role === "musicien" && !metierPrincipal) {
        setErrorMSG("Veuillez sélectionner un métier principal de votre art.");
        return false;
      }
      if (!bio.trim() || bio.trim().length < 5) {
        setErrorMSG("Veuillez rédiger une brève biographie (au moins 5 caractères).");
        return false;
      }
    }
    if (activeStep === 3) {
      const actualVille = ville === "Autre" ? customVille : ville;
      const actualCommune = (ville === "Abidjan" && commune !== "Autre") ? commune : customCommune;

      if (!actualVille.trim()) {
        setErrorMSG("La ville de résidence est requise.");
        return false;
      }
      if (!actualCommune.trim()) {
        setErrorMSG("La commune ou le quartier est requis.");
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setErrorMSG("");
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMSG("");

    if (!validateCurrentStep()) {
      return;
    }

    setLoading(true);

    const actualVille = ville === "Autre" ? customVille.trim() : ville;
    const actualCommune = (ville === "Abidjan" && commune !== "Autre") 
      ? commune 
      : (customCommune.trim() || "Centre-Ville");

    const updates: Partial<UserProfile> = {
      role,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      artistName: artistName.trim(),
      gender,
      birthDate,
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      ville: actualVille,
      commune: actualCommune,
      bio: bio.trim(),
      avatarUrl,
      photoURL: avatarUrl,
      specialties,
      specialty: metierPrincipal || specialties[0] || "Artiste",
      speciality: metierPrincipal || specialties[0] || "Artiste",
      musicGenres,
      musicGenre: musicGenres[0] || "Zouglou",
      experience,
      experienceYears: experience,
      availabilities,
      isAvailableNow: availabilities.includes("Disponible immédiatement"),
      waveNumber: waveNumber.trim(),
      orangeMoneyNumber: orangeMoneyNumber.trim(),
      isProfileComplete: true,
      updatedAt: new Date().toISOString()
    };

    try {
      await gomboDB.updateUserProfile(currentUserProfile.uid, updates);
      
      // Publish new talent connection to the community feed
      if (role === "musicien") {
        try {
          await gomboDB.publishActivity({
            type: "talent",
            title: "Nouveau Talent Enregistré ! 🚀",
            message: `🔥 ${artistName} (${metierPrincipal}) est en ligne depuis ${actualCommune}, ${actualVille} !`,
            userId: currentUserProfile.uid,
            userName: artistName,
            userAvatar: avatarUrl || undefined,
            targetId: currentUserProfile.uid
          });
        } catch (feedErr) {
          console.error("Non-fatal feed creation fail:", feedErr);
        }
      }

      window.dispatchEvent(new Event("gomboUserProfileChange"));
      onComplete();
    } catch (err: any) {
      console.error(err);
      setErrorMSG("Impossible d'enregistrer votre profil. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCommunes = ABIDJAN_COMMUNES.filter(c =>
    c.toLowerCase().includes(communeSearch.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#121214] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-150 dark:bg-gray-800">
          <div 
            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
            style={{ width: `${(activeStep / 4) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="text-center mb-8 pt-4">
          <div className="inline-flex items-center justify-center p-3.5 bg-orange-50 dark:bg-orange-950/20 text-[#FF7A00] rounded-2xl mb-3">
            <Sparkles className="w-7 h-7 animate-pulse text-[#FF7A00]" />
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-gray-950 dark:text-white uppercase font-sans">
            🎯 COMPLÉTER MON PROFIL
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-sm mx-auto font-medium">
            Entrez vos paramètres showbiz pour décrocher vos premiers gombos et contrats officiels à Abidjan et partout ailleurs.
          </p>
        </div>

        {errorMSG && (
          <div className="p-4 mb-6 bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 rounded-r-xl text-rose-800 dark:text-rose-400 text-xs font-bold leading-relaxed">
            ⚠️ {errorMSG}
          </div>
        )}

        {/* Steps Status indicators */}
        <div className="flex items-center justify-between mb-8 px-2">
          {[
            { step: 1, label: "Identité" },
            { step: 2, label: "Métier" },
            { step: 3, label: "Adresse" },
            { step: 4, label: "Paiement" }
          ].map((s, idx) => (
            <div key={s.step} className="flex flex-col items-center flex-1 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black select-none z-10 transition-colors ${
                activeStep === s.step 
                  ? "bg-[#FF7A00] text-white" 
                  : activeStep > s.step 
                    ? "bg-emerald-500 text-white" 
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
              }`}>
                {activeStep > s.step ? <Check className="w-4 h-4 stroke-[3px]" /> : (idx + 1)}
              </div>
              <span className="text-[10px] font-black mt-1.5 text-gray-400 dark:text-gray-550 block uppercase tracking-tight">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* STEP 1: CONTEXT, ROLE & IDENTITY */}
          {activeStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div className="border border-gray-100 dark:border-gray-800 p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-850/10 space-y-4">
                <span className="text-[10px] font-black tracking-widest text-[#FF7A00] uppercase block font-mono">
                  Étape 1 • Type de Compte & Identité Directe
                </span>
                
                {/* Account Type Option Boxes */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-350">Quel est votre type de compte ?</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("musicien")}
                      className={`p-3.5 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1.5 font-black text-xs uppercase tracking-tight ${
                        role === "musicien"
                          ? "border-[#FF7A00] bg-orange-50/10 text-[#FF7A00]"
                          : "border-gray-150 dark:border-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/20"
                      }`}
                    >
                      <Music className="w-4.5 h-4.5" />
                      Artiste / Musicien
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("organisateur")}
                      className={`p-3.5 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1.5 font-black text-xs uppercase tracking-tight ${
                        role === "organisateur"
                          ? "border-[#FF7A00] bg-orange-50/10 text-[#FF7A00]"
                          : "border-gray-150 dark:border-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/20"
                      }`}
                    >
                      <Award className="w-4.5 h-4.5" />
                      Organisateur
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("client")}
                      className={`p-3.5 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1.5 font-black text-xs uppercase tracking-tight ${
                        role === "client"
                          ? "border-[#FF7A00] bg-orange-50/10 text-[#FF7A00]"
                          : "border-gray-150 dark:border-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/20"
                      }`}
                    >
                      <User className="w-4.5 h-4.5" />
                      Client
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("manager")}
                      className={`p-3.5 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1.5 font-black text-xs uppercase tracking-tight ${
                        role === "manager"
                          ? "border-[#FF7A00] bg-orange-50/10 text-[#FF7A00]"
                          : "border-gray-150 dark:border-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/20"
                      }`}
                    >
                      <Sliders className="w-4.5 h-4.5" />
                      Manager / Producteur
                    </button>
                  </div>
                </div>

                {/* Sub Identity Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">Nom d’Artiste / de Scène</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: MC Gombo, Star d'Abidjan..."
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">Téléphone Direct (+225)</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: 07 00 11 22 33"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1 font-sans">Prénom(s)</label>
                    <input
                      type="text"
                      required
                      placeholder="Arthur"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1 font-sans">Nom de famille</label>
                    <input
                      type="text"
                      required
                      placeholder="Kouassi"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-655 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                      Numéro WhatsApp (Laisser vide si identique)
                    </label>
                    <input
                      type="tel"
                      placeholder="Ex: 05 00 11 22 33"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">Sexe</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white font-bold"
                    >
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 bg-[#FF7A00] hover:bg-[#E06C00] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Continuer ➜
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: PROFESSION, SPECIALTIES & BIO */}
          {activeStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div className="border border-gray-100 dark:border-gray-800 p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-850/10 space-y-4">
                <span className="text-[10px] font-black tracking-widest text-[#FF7A00] uppercase block font-mono">
                  Étape 2 • Spécificités Showbiz & Métier Principal
                </span>

                {/* Main Profession Choice dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Métier Principal (Votre Art)
                  </label>
                  <select
                    value={metierPrincipal}
                    onChange={(e) => setMetierPrincipal(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white font-bold"
                  >
                    {MAIN_PROFESSIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Specialties selection checkboxes */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-750 dark:text-gray-300">
                    Spécialités Musicales additionnelles (Cochez tout ce qui s'applique)
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {ALL_SPECIALTIES.map((spec) => {
                      const selected = specialties.includes(spec);
                      return (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => handleToggleSpecialty(spec)}
                          className={`px-3 py-2 text-left rounded-lg text-xs font-bold border transition-all flex items-center justify-between ${
                            selected 
                              ? "bg-orange-500 border-orange-500 text-white" 
                              : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <span className="truncate">{spec}</span>
                          {selected && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Genres */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-750 dark:text-gray-300">
                    Styles Musicaux préférés
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {ALL_GENRES.map((g) => {
                      const selected = musicGenres.includes(g);
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => handleToggleGenre(g)}
                          className={`px-3 py-2 text-left rounded-lg text-xs font-bold border transition-all flex items-center justify-between ${
                            selected 
                              ? "bg-[#FF7A00] border-[#FF7A00] text-white" 
                              : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <span className="truncate">{g}</span>
                          {selected && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bio & Presentation text */}
                <div>
                  <label className="block text-xs font-bold text-gray-650 dark:text-gray-450 mb-1">
                    Petite Présentation / Biographie 🇨🇮
                  </label>
                  <textarea
                    rows={2.5}
                    required
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Ex: Bassiste pro avec 5 ans de cabaret à Abidjan, passionné de Zouglou et de Jazz, disponible pour contrats live immédiats..."
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-bold text-xs uppercase rounded-xl transition-all"
                >
                  Précédent
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 bg-[#FF7A00] hover:bg-[#E06C00] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Continuer ➜
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: RESIDENCE, VILLE & COMMUNE + PHOTO */}
          {activeStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div className="border border-gray-100 dark:border-gray-800 p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-850/10 space-y-4">
                <span className="text-[10px] font-black tracking-widest text-[#FF7A00] uppercase block font-mono">
                  Étape 3 • Localisation (Ville & Commune) & Photo de Profil
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Ville select */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Ville de Résidence</label>
                    <select
                      value={ville}
                      onChange={(e) => setVille(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-950 dark:text-white font-bold"
                    >
                      {CIV_CITIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Commune dropdown search for Abidjan, or direct text input for other cities */}
                  {ville === "Abidjan" ? (
                    <div className="relative space-y-1.5" ref={communeDropdownRef}>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                        Commune d'Abidjan
                      </label>
                      <div 
                        onClick={() => setShowCommuneDropdown(!showCommuneDropdown)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-950 dark:text-white font-bold flex items-center justify-between cursor-pointer select-none"
                      >
                        <span className="flex items-center gap-2 text-xs">
                          <MapPin className="w-4 h-4 text-[#FF7A00]" />
                          {commune || "Choisir votre commune..."}
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </div>

                      {showCommuneDropdown && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden max-h-60 flex flex-col">
                          <div className="p-2 border-b border-gray-100 dark:border-gray-850 bg-gray-50/50 dark:bg-[#18181b] flex items-center gap-1.5">
                            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <input 
                              type="text"
                              placeholder="Filtrer commune..."
                              value={communeSearch}
                              onChange={(e) => setCommuneSearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full bg-transparent border-none text-[11px] focus:outline-none dark:text-white py-1"
                            />
                          </div>
                          <div className="overflow-y-auto max-h-48 divide-y divide-gray-50 dark:divide-gray-850">
                            {filteredCommunes.map((com) => (
                              <button
                                key={com}
                                type="button"
                                onClick={() => {
                                  setCommune(com);
                                  setShowCommuneDropdown(false);
                                  setCommuneSearch("");
                                }}
                                className="w-full text-left px-3.5 py-2.5 text-xs text-gray-700 dark:text-gray-300 font-bold hover:bg-orange-50 dark:hover:bg-orange-950/20"
                              >
                                {com}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Quartier / Secteur</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Air France, Zone résidentielle..."
                        value={customCommune}
                        onChange={(e) => setCustomCommune(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white font-bold"
                      />
                    </div>
                  )}

                  {ville === "Autre" && (
                    <div className="space-y-1 sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Nom de votre Ville</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Korhogo, Soubré, Paris, etc."
                        value={customVille}
                        onChange={(e) => setCustomVille(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white folder"
                      />
                    </div>
                  )}
                </div>

                {/* Profil picture layout */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-gray-750 dark:text-gray-400">Une Belle Photo de Profil</label>
                  <div className="border border-gray-150 dark:border-gray-800 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-orange-500 bg-gray-50 flex-shrink-0 relative">
                      {cameraActive ? (
                        <video
                          id="complete-webcam-preview"
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                      ) : (
                        <img src={avatarUrl} alt="Profil pic" className="w-full h-full object-cover" />
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {cameraActive ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase rounded-lg"
                          >
                            Prendre photo
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-[10px] uppercase rounded-lg"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <label className="px-3 py-1.5 bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-750 text-[10px] font-black uppercase rounded-lg cursor-pointer flex items-center gap-1">
                            <Upload className="w-3 h-3" />
                            Uploader
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
                          <button
                            type="button"
                            onClick={startCamera}
                            className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3 h-3" />
                            Caméra
                          </button>
                        </div>
                      )}
                      <span className="text-[9px] text-gray-400 italic">Prenez une photo élégante et professionnelle.</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1.5">Presets :</span>
                    <div className="flex flex-wrap gap-2">
                      {AVATARS.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setAvatarUrl(url)}
                          className={`relative w-8 h-8 rounded-full overflow-hidden border-2 ${
                            avatarUrl === url ? "border-[#FF7A00] scale-105" : "border-transparent"
                          }`}
                        >
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-bold text-xs uppercase rounded-xl transition-all"
                >
                  Précédent
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 bg-[#FF7A00] hover:bg-[#E06C00] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Continuer ➜
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: EXPERIENCES, AVAILABILITY, MOBO MOBILE MONEY */}
          {activeStep === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div className="border border-gray-100 dark:border-gray-800 p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-850/10 space-y-4 font-sans">
                <span className="text-[10px] font-black tracking-widest text-[#FF7A00] uppercase block font-mono">
                  Étape 4 • Niveau d'Expérience & Disponibilités
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-355 mb-1">
                      Expérience Artistique Général
                    </label>
                    <select
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white font-bold"
                    >
                      {ALL_EXPERIENCES.map((exp) => (
                        <option key={exp} value={exp}>{exp}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                      Disponibilités Semaine / Concerts
                    </label>
                    <div className="space-y-1">
                      {ALL_AVAILABILITIES.map((av) => {
                        const checked = availabilities.includes(av);
                        return (
                          <label key={av} className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleAvailability(av)}
                              className="accent-orange-500 rounded"
                            />
                            <span>{av}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile money coordinate info */}
              <div className="border border-gray-100 dark:border-gray-800 p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-850/10 space-y-3.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                    💳 Coordonnées Wave / Mobile Money (Optionnel)
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">
                  Saisissez vos numéros pour recevoir instantanément l'acompte de vos futurs cachets de prestations Gombo.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-650 dark:text-gray-400 mb-1">🌊 Compte WAVE (+225)</label>
                    <input
                      type="text"
                      placeholder="0707..."
                      value={waveNumber}
                      onChange={(e) => setWaveNumber(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-mono font-bold dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-650 dark:text-gray-400 mb-1">🍊 ORANGE MONEY / MTN</label>
                    <input
                      type="text"
                      placeholder="0505..."
                      value={orangeMoneyNumber}
                      onChange={(e) => setOrangeMoneyNumber(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-mono font-bold dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-bold text-xs uppercase rounded-xl transition-all"
                >
                  Précédent
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4.5 h-4.5" />
                      Finaliser mon Profil !
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

        </form>
      </motion.div>
    </div>
  );
}
