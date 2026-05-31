import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Phone, MapPin, Music, Award, Wallet, Send, FileText, Check, 
  Sparkles, ShieldCheck, Heart, CreditCard, Star, Radio,
  Camera, Upload, RefreshCw, Eye, MessageSquare, Calendar, Sliders, ChevronDown, Search
} from "lucide-react";
import { UserProfile, UserRole } from "../types";
import { gomboDB } from "../firebase";

const ABIDJAN_COMMUNES = [
  "Abobo", "Adjamé", "Attécoubé", "Cocody", "Koumassi", "Marcory", 
  "Plateau", "Port-Bouët", "Treichville", "Yopougon", "Bingerville", 
  "Songon", "Anyama"
];

const ALL_SPECIALTIES = [
  "Chant", "Chœur", "Piano", "Clavier", "Guitare Solo", "Guitare Rythmique", 
  "Guitare Basse", "Batterie", "Percussions", "Djembé", "Balafon", 
  "Saxophone", "Trompette", "Violon", "Flûte", "Accordéon", "DJ", 
  "Beatmaker", "Producteur Musical", "Arrangeur", "Compositeur", "Auteur", 
  "Sound Engineer", "Choriste", "Chef d'Orchestre", "Danseur", 
  "MC / Animateur", "Rappeur", "Slameur"
];

const ALL_GENRES = [
  "Coupé-Décalé", "Zouglou", "Wôyô", "Afrobeat", "Amapiano", "Gospel", 
  "Reggae", "Dancehall", "Rap Ivoire", "Drill", "RnB", "Soul", "Jazz", 
  "Blues", "Rock", "Variété", "Musique Traditionnelle", "Musique Mandingue", 
  "Musique Baoulé", "Musique Bété", "Musique Sénoufo", "Musique Ébrié", 
  "Orchestre Live", "Animation Mariage", "Animation Maquis", "Animation Église"
];

const ALL_EXPERIENCES = [
  "Débutant", "Intermédiaire", "Confirmé", "Professionnel"
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
  const [role, setRole] = useState<UserRole>(currentUserProfile.role || "musicien");
  
  // Section 1: Identité
  const [firstName, setFirstName] = useState(currentUserProfile.firstName || "");
  const [lastName, setLastName] = useState(currentUserProfile.lastName || "");
  const [artistName, setArtistName] = useState(currentUserProfile.artistName || "");
  const [gender, setGender] = useState(currentUserProfile.gender || "Homme");
  const [birthDate, setBirthDate] = useState(currentUserProfile.birthDate || "");
  const [phone, setPhone] = useState(currentUserProfile.phone || "");
  const [whatsapp, setWhatsapp] = useState(currentUserProfile.whatsapp || "");
  
  // Section 2: Commune (Searchable Dropdown)
  const [commune, setCommune] = useState(currentUserProfile.commune || "Cocody");
  const [communeSearch, setCommuneSearch] = useState("");
  const [showCommuneDropdown, setShowCommuneDropdown] = useState(false);
  const communeDropdownRef = useRef<HTMLDivElement>(null);

  // Section 3: Bio & Photo
  const [bio, setBio] = useState(currentUserProfile.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUserProfile.avatarUrl || currentUserProfile.photoURL || AVATARS[0]);

  // Section 4: Spécialités Musicales (Multiple Selection)
  const [specialties, setSpecialties] = useState<string[]>(
    currentUserProfile.specialties || 
    (currentUserProfile.specialty ? [currentUserProfile.specialty] : [])
  );
  
  // Section 5: Genres Musicaux (Multiple Selection)
  const [musicGenres, setMusicGenres] = useState<string[]>(
    currentUserProfile.musicGenres || 
    (currentUserProfile.musicGenre ? [currentUserProfile.musicGenre] : [])
  );

  // Section 6: Expérience & Disponibilités
  const [experience, setExperience] = useState(currentUserProfile.experience || "Intermédiaire");
  const [availabilities, setAvailabilities] = useState<string[]>(
    currentUserProfile.availabilities || 
    (currentUserProfile.isAvailableNow ? ["Disponible immédiatement"] : [])
  );

  // Mobile Money
  const [waveNumber, setWaveNumber] = useState(currentUserProfile.waveNumber || "");
  const [orangeMoneyNumber, setOrangeMoneyNumber] = useState(currentUserProfile.orangeMoneyNumber || "");

  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState("");

  // Webcam & uploading states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Handle click outside of commune dropdown
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

  // Validation function per step to ensure complete quality
  const validateCurrentStep = () => {
    setErrorMSG("");
    if (activeStep === 1) {
      if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
        setErrorMSG("Nom complet (Prénom + Nom) et Téléphone sont obligatoires.");
        return false;
      }
      const rawDigits = phone.replace(/\D/g, "");
      if (rawDigits.length < 8) {
        setErrorMSG("Le numéro de téléphone doit posséder au moins 8 chiffres.");
        return false;
      }
    }
    if (activeStep === 2) {
      if (!commune) {
        setErrorMSG("Veuillez sélectionner une commune d’Abidjan.");
        return false;
      }
    }
    if (activeStep === 3) {
      if (role === "musicien" && specialties.length === 0) {
        setErrorMSG("Veuillez choisir au moins une spécialité musicale.");
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

    const updates: Partial<UserProfile> = {
      role,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      artistName: artistName.trim(),
      gender,
      birthDate,
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      commune,
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
      isProfileComplete: true,
      updatedAt: new Date().toISOString()
    };

    try {
      await gomboDB.updateUserProfile(currentUserProfile.uid, updates);
      // Fire simulated event so components aware of the transition can refresh immediately
      window.dispatchEvent(new Event("gomboUserProfileChange"));
      onComplete();
    } catch (err: any) {
      console.error(err);
      setErrorMSG("Une erreur est survenue lors de l'enregistrement de votre profil.");
    } finally {
      setLoading(false);
    }
  };

  // Filtered Communes for quick search dropdown
  const filteredCommunes = ABIDJAN_COMMUNES.filter(c =>
    c.toLowerCase().includes(communeSearch.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-100 dark:bg-gray-800/80">
          <div 
            className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 transition-all duration-300"
            style={{ width: `${(activeStep / 4) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="text-center mb-8 pt-4">
          <div className="inline-flex items-center justify-center p-3 bg-orange-50 dark:bg-orange-950/20 text-[#FF7A00] rounded-2xl mb-3">
            <Sparkles className="w-7 h-7 animate-pulse text-[#FF7A00]" />
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-gray-950 dark:text-white uppercase font-sans">
            Optimiser mon Profil Showbiz
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 max-w-sm mx-auto">
            Créez un profil musical ivoirien d'élite pour rassurer les promoteurs d'Abidjan et décrocher de vrais cachets.
          </p>
        </div>

        {errorMSG && (
          <div className="p-4 mb-6 bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 rounded-r-xl text-rose-800 dark:text-rose-400 text-xs font-bold leading-relaxed">
            ⚠️ {errorMSG}
          </div>
        )}

        {/* Steps Status Indicators */}
        <div className="flex items-center justify-between mb-8 px-2">
          {[
            { step: 1, label: "Identité" },
            { step: 2, label: "Localisation" },
            { step: 3, label: "Spécialités" },
            { step: 4, label: "Expérience" }
          ].map((s) => (
            <div key={s.step} className="flex flex-col items-center flex-1 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black select-none z-10 transition-colors ${
                activeStep === s.step 
                  ? "bg-[#FF7A00] text-white" 
                  : activeStep > s.step 
                    ? "bg-emerald-500 text-white" 
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
              }`}>
                {activeStep > s.step ? <Check className="w-4 h-4 stroke-[3px]" /> : s.step}
              </div>
              <span className="text-[10px] font-bold mt-1.5 text-gray-400 dark:text-gray-500 block">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* STEP 1: IDENTITÉ & CONTACT */}
          {activeStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div className="border border-gray-100 dark:border-gray-800 p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-850/10 space-y-4">
                <span className="text-[10px] font-black tracking-widest text-[#FF7A00] uppercase block font-mono">
                  Étape 1 • Rôle & Informations Générales
                </span>
                
                {/* Role Switch */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400">Quel est votre rôle principal ?</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("musicien")}
                      className={`p-3 rounded-xl border-2 text-center transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider ${
                        role === "musicien"
                          ? "border-[#FF7A00] bg-orange-50/10 text-[#FF7A00]"
                          : "border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/20"
                      }`}
                    >
                      <Music className="w-4 h-4" />
                      Artiste / Solo
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("groupe")}
                      className={`p-3 rounded-xl border-2 text-center transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider ${
                        role === "groupe"
                          ? "border-[#FF7A00] bg-orange-50/10 text-[#FF7A00]"
                          : "border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/20"
                      }`}
                    >
                      <Radio className="w-4 h-4" />
                      Groupe / Orchestre
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nom complet fields */}
                  <div>
                    <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">Prénom(s)</label>
                    <input
                      type="text"
                      required
                      placeholder="Didier"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">Nom de famille</label>
                    <input
                      type="text"
                      required
                      placeholder="Drogba"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-650 dark:text-gray-300 mb-1">Nom d’Artiste / de Scène</label>
                    <input
                      type="text"
                      placeholder="e.g. Yoro l'Étoile"
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white font-semibold"
                    />
                  </div>

                  {/* Sexe Selection */}
                  <div>
                    <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">Sexe / Genre</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white"
                    >
                      <option value="Homme">Homme / Masculin</option>
                      <option value="Femme">Femme / Féminin</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>

                  {/* Date de naissance */}
                  <div>
                    <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-450" />
                      Date de Naissance
                    </label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white font-mono"
                    />
                  </div>

                  {/* Téléphone */}
                  <div>
                    <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">Téléphone Direct (+225)</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 07 08 09 10 11"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white text-left font-mono font-bold"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-655 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                      Numéro WhatsApp (ou laisser vide si identique au Téléphone)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 05 05 05 06 07"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 security border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 bg-[#FF7A00] hover:bg-[#E06C00] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Continuer ➜
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: LOCALISATION (SEARCHABLE DROPDOWN) + BIO & PHOTO */}
          {activeStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div className="border border-gray-100 dark:border-gray-800 p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-850/10 space-y-4">
                <span className="text-[10px] font-black tracking-widest text-[#FF7A00] uppercase block font-mono">
                  Étape 2 • Localisation d'Urgence & Photo
                </span>

                {/* Commune Abidjan - Searchable select */}
                <div className="relative space-y-1.5" ref={communeDropdownRef}>
                  <label className="block text-xs font-bold text-gray-650 dark:text-gray-400">
                    Commune d’Abidjan (Sélection Obligatoire)
                  </label>
                  
                  <div 
                    onClick={() => setShowCommuneDropdown(!showCommuneDropdown)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-950 dark:text-white font-bold flex items-center justify-between cursor-pointer select-none"
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#FF7A00]" />
                      {commune || "Choisir votre commune..."}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-450" />
                  </div>

                  {showCommuneDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#121214] border border-gray-150 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden max-h-60 flex flex-col">
                      <div className="p-2 border-b border-gray-100 dark:border-gray-850 bg-gray-50/50 dark:bg-[#18181b] flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <input 
                          type="text"
                          placeholder="Recherche rapide de commune... (ex: Cocody)"
                          value={communeSearch}
                          onChange={(e) => setCommuneSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-transparent border-none text-[11px] focus:outline-none dark:text-white py-1"
                        />
                      </div>
                      
                      <div className="overflow-y-auto divide-y divide-gray-50 dark:divide-gray-850 max-h-48">
                        {filteredCommunes.length > 0 ? (
                          filteredCommunes.map((com) => (
                            <button
                              key={com}
                              type="button"
                              onClick={() => {
                                setCommune(com);
                                setShowCommuneDropdown(false);
                                setCommuneSearch("");
                              }}
                              className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold hover:bg-orange-500/5 transition-all flex items-center justify-between ${
                                commune === com 
                                  ? "text-[#FF7A00] bg-orange-50/10 dark:bg-orange-950/20" 
                                  : "text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              <span>📍 {com}</span>
                              {commune === com && <Check className="w-3.5 h-3.5 text-[#FF7A00] stroke-[3px]" />}
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-xs text-gray-400 font-medium">
                            Aucune commune trouvée pour "{communeSearch}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Presentation bio text */}
                <div>
                  <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">
                    Présentation & Biographie 🇨🇮
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. Bassiste polyvalent de rumba et zouglou depuis 5 ans à Cocody, disponible pour prestations de clubs ou concerts d'artistes..."
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-905 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {/* Webcam or Presets Selection */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-gray-650 dark:text-gray-450 uppercase tracking-wider">
                    Photo de Profil Chic & Réelle
                  </label>
                  
                  <div className="border border-gray-150/50 dark:border-gray-800 p-4 rounded-xl space-y-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#FF7A00] bg-gray-50 flex-shrink-0 flex items-center justify-center">
                        {cameraActive ? (
                          <video
                            id="complete-webcam-preview"
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover scale-x-[-1]"
                          />
                        ) : (
                          <img src={avatarUrl} alt="Aperçu" className="w-full h-full object-cover" />
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        {cameraActive ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={capturePhoto}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase rounded-xl"
                            >
                              Prendre la photo
                            </button>
                            <button
                              type="button"
                              onClick={stopCamera}
                              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-850 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-extrabold text-[10px] uppercase rounded-xl"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <label className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-250 dark:border-gray-750 hover:bg-gray-100 text-gray-750 dark:text-gray-300 text-[10px] font-black uppercase rounded-lg cursor-pointer flex items-center gap-1">
                              <Upload className="w-3.5 h-3.5" />
                              Uploader l'image
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
                              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase rounded-lg flex items-center gap-1"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              Webcam
                            </button>
                          </div>
                        )}
                        <span className="text-[9px] text-gray-400 font-semibold italic">Uploadez une image carrée propre de vous face caméra.</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-gray-850/40">
                      <span className="text-[9px] font-extrabold uppercase text-gray-400 block mb-1.5">Ou preset rapide :</span>
                      <div className="flex flex-wrap gap-2">
                        {AVATARS.map((url, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setAvatarUrl(url)}
                            className={`relative w-8 h-8 rounded-full overflow-hidden border-2 flex-shrink-0 ${
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
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase rounded-xl transition-all"
                >
                  Précédent
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 bg-[#FF7A00] hover:bg-[#E06C00] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                >
                  Continuer ➜
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: SPÉCIALITÉS MUSICALES + GENRES DE PRÉDILECTION (SELECTION MULTIPLE) */}
          {activeStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              {/* Specialities panel */}
              <div className="border border-gray-100 dark:border-gray-800 p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-850/10 space-y-4">
                <div>
                  <span className="text-[10px] font-black tracking-widest text-[#FF7A00] uppercase block font-mono">
                    Étape 3 • Spécialité & Compétence Musicale (Sélection Multiple)
                  </span>
                  <span className="text-[9px] text-[#FF7A00] dark:text-orange-400 font-black tracking-wide uppercase block mt-1">
                    ☑ Cochez toutes vos cordes à votre arc ({specialties.length} sélectionnée{specialties.length > 1 ? "s" : ""}) :
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1.5 pt-1">
                  {ALL_SPECIALTIES.map((spec) => {
                    const selected = specialties.includes(spec);
                    return (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => handleToggleSpecialty(spec)}
                        className={`px-3 py-2 text-left rounded-xl text-xs font-bold border transition-all flex items-center justify-between gap-1.5 ${
                          selected 
                            ? "bg-orange-500 border-orange-500 text-white shadow-xs" 
                            : "bg-white dark:bg-[#121214] border-gray-150 dark:border-gray-800 text-gray-700 dark:text-gray-350 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                        }`}
                      >
                        <span className="truncate">{spec}</span>
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          selected ? "bg-white text-orange-500 border-white" : "border-gray-300 dark:border-gray-700"
                        }`}>
                          {selected && <Check className="w-2.5 h-2.5 stroke-[4px]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Music Genres panel */}
              <div className="border border-gray-100 dark:border-gray-800 p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-850/10 space-y-4">
                <div>
                  <span className="text-[10px] font-black tracking-widest text-[#FF7A00] uppercase block font-mono">
                    Genres Musicaux Répétés & Styles (Sélection Multiple)
                  </span>
                  <span className="text-[9px] text-[#FF7A00] dark:text-orange-400 font-black tracking-wide uppercase block mt-1">
                    ☑ Cochez tous vos styles musicaux d'ambiance ({musicGenres.length} sélectionnés) :
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1.5 pt-1">
                  {ALL_GENRES.map((g) => {
                    const selected = musicGenres.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handleToggleGenre(g)}
                        className={`px-3 py-2 text-left rounded-xl text-xs font-bold border transition-all flex items-center justify-between gap-1.5 ${
                          selected 
                            ? "bg-amber-500 border-amber-500 text-white shadow-xs" 
                            : "bg-white dark:bg-[#121214] border-gray-150 dark:border-gray-800 text-gray-700 dark:text-gray-350 hover:bg-gray-50"
                        }`}
                      >
                        <span className="truncate">{g}</span>
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          selected ? "bg-white text-amber-500 border-white" : "border-gray-300 dark:border-gray-700"
                        }`}>
                          {selected && <Check className="w-2.5 h-2.5 stroke-[4px]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase rounded-xl transition-all"
                >
                  Précédent
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 bg-[#FF7A00] hover:bg-[#E06C00] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                >
                  Continuer ➜
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: EXPÉRIENCE + DISPONIBILITÉS + MOBO MOBILE MONEY */}
          {activeStep === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div className="border border-gray-100 dark:border-gray-800 p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-850/10 space-y-4">
                <span className="text-[10px] font-black tracking-widest text-[#FF7A00] uppercase block font-mono">
                  Étape 4 • Niveau d'Expérience & Disponibilités
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                  {/* Experience Select */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-650 dark:text-gray-400">
                      Niveau Général d'Expérience
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

                  {/* WhatsApp/Phone display backup check */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-650 dark:text-gray-400">
                      Disponibilité Générale Abidjan
                    </label>
                    <div className="space-y-2">
                      {ALL_AVAILABILITIES.map((av) => {
                        const checked = availabilities.includes(av);
                        return (
                          <label key={av} className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleAvailability(av)}
                              className="accent-orange-500 rounded cursor-pointer"
                            />
                            <span>{av}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Money coordination inputs */}
              <div className="border border-gray-100 dark:border-gray-800 p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-850/10 space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    💳 Coordonnées de Paiement (Mobile Money)
                  </span>
                  <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Requis</span>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-450 leading-relaxed">
                  Pour sécuriser la réservation et recevoir votre acompte de Gombo automatiquement.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">🌊 Numéro WAVE</label>
                    <input
                      type="text"
                      placeholder="0707..."
                      value={waveNumber}
                      onChange={(e) => setWaveNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-205 dark:border-gray-800 rounded-lg text-xs font-mono font-bold dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">🍊 ORANGE MONEY</label>
                    <input
                      type="text"
                      placeholder="0505..."
                      value={orangeMoneyNumber}
                      onChange={(e) => setOrangeMoneyNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-205 dark:border-gray-800 rounded-lg text-xs font-mono font-bold dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-850/40">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase rounded-xl transition-all"
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
