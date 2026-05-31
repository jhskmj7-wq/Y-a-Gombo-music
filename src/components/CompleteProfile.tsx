import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  User, Phone, MapPin, Music, Award, Wallet, Send, FileText, Check, 
  Sparkles, ShieldCheck, Heart, CreditCard, Star, Radio,
  Camera, Upload, RefreshCw
} from "lucide-react";
import { UserProfile, UserRole } from "../types";
import { gomboDB } from "../firebase";

const ABIDJAN_COMMUNES = [
  "Cocody", "Yopougon", "Marcory", "Plateau", "Treichville", "Abobo", 
  "Koumassi", "Adjamé", "Port-Bouët", "Attécoubé", "Grand-Bassam", "Bingerville"
];

const SPECIALTIES = [
  "Chanteur(euse) Lead", "Guitariste Soliste", "Guitariste Accompagnateur", 
  "Bassiste", "Batteur", "Claviériste / Pianiste", "Percussionniste", 
  "DJ", "Cuivres / Wind", "Ingénieur du Son", "Directeur Artistique / MC"
];

const EXPERIENCES = [
  "1-2 ans (Débutant ambitieux)",
  "3-5 ans (Intermédiaire actif)",
  "5-10 ans (Professionnel aguerri)",
  "Plus de 10 ans (Légende locale)"
];

const GENRES = [
  "Coupé-Décalé", "Zouglou", "Rumba Congolaise", "Rap Ivoire / Hip-Hop", 
  "Gospel Ivoirien", "Afrobeat / Afropop", "Reggae ivoirien", "Jazz / Variété Acoustique"
];

const AVATARS = [
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
  const [role, setRole] = useState<UserRole>(currentUserProfile.role || "musicien");
  const [firstName, setFirstName] = useState(currentUserProfile.firstName || "");
  const [lastName, setLastName] = useState(currentUserProfile.lastName || "");
  const [artistName, setArtistName] = useState(currentUserProfile.artistName || "");
  const [phone, setPhone] = useState(currentUserProfile.phone || "");
  const [commune, setCommune] = useState(currentUserProfile.commune || "Cocody");
  const [bio, setBio] = useState(currentUserProfile.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUserProfile.avatarUrl || currentUserProfile.photoURL || AVATARS[0]);
  
  // Custom fields
  const [speciality, setSpeciality] = useState(currentUserProfile.speciality || currentUserProfile.specialty || SPECIALTIES[0]);
  const [experienceYears, setExperienceYears] = useState(currentUserProfile.experienceYears || EXPERIENCES[1]);
  const [musicGenre, setMusicGenre] = useState(currentUserProfile.musicGenre || GENRES[0]);
  const [waveNumber, setWaveNumber] = useState(currentUserProfile.waveNumber || currentUserProfile.paymentNumber || "");
  const [orangeMoneyNumber, setOrangeMoneyNumber] = useState(currentUserProfile.orangeMoneyNumber || "");

  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState("");

  // Webcam capturing and photo upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 305, facingMode: "user" } });
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
  React.useEffect(() => {
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
    } catch (err) {
      console.error("Upload error:", err);
      alert("Une erreur de chargement est survenue. Veuillez réessayer.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMSG("");
    setLoading(true);

    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !commune) {
      setErrorMSG("Veuillez remplir les informations obligatoires (Prénom, Nom, Téléphone, Commune).");
      setLoading(false);
      return;
    }

    const cleanedDigits = phone.trim().replace(/\D/g, "");
    if (cleanedDigits.length < 9) {
      setErrorMSG("Le numéro de téléphone saisi est trop court. Un format valide de contact complet doit faire 10 chiffres pour la Côte d'Ivoire (ex: 07 45 89 12 00).");
      setLoading(false);
      return;
    }

    const updates: Partial<UserProfile> = {
      role,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      artistName: artistName.trim(),
      phone: phone.trim(),
      commune,
      bio: bio.trim(),
      avatarUrl,
      photoURL: avatarUrl,
      speciality,
      specialty: speciality,
      experienceYears,
      experience: experienceYears,
      musicGenre,
      waveNumber: waveNumber.trim(),
      orangeMoneyNumber: orangeMoneyNumber.trim(),
      isProfileComplete: true,
      updatedAt: new Date().toISOString()
    };

    try {
      await gomboDB.updateUserProfile(currentUserProfile.uid, updates);
      onComplete();
    } catch (err: any) {
      console.error(err);
      setErrorMSG("Une erreur est survenue lors de l'enregistrement de votre profil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-xl"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-purple-50 dark:bg-purple-950/20 text-[#7C3AED] rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 fill-current animate-pulse" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white uppercase">
            COMPLÉTER MON COIN
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto leading-relaxed">
            Bienvenue sur la plateforme showbiz officielle de Côte d'Ivoire ! Renseignez vos infos pour débloquer votre solde, vos cachets et vos gombos de scène.
          </p>
        </div>

        {errorMSG && (
          <div className="p-4 mb-6 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-r-xl text-red-750 dark:text-red-450 text-sm font-semibold">
            ⚠️ {errorMSG}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: Choose Role */}
          <div className="space-y-3">
            <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              1. QUEL EST VOTRE RÔLE SUR LE SHOWBIZ ?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "musicien", label: "Musicien / DJ", icon: () => <Music className="w-5 h-5" /> },
                { id: "client", label: "Recruteur / Client", icon: () => <User className="w-5 h-5" /> },
                { id: "groupe", label: "Groupe / Orchestre", icon: () => <Radio className="w-5 h-5" /> }
              ].map((roleOpt) => (
                <button
                  key={roleOpt.id}
                  type="button"
                  onClick={() => setRole(roleOpt.id as UserRole)}
                  className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2 ${
                    role === roleOpt.id
                      ? "border-[#7C3AED] bg-purple-50/10 text-[#7C3AED] dark:border-[#7C3AED]"
                      : "border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {roleOpt.icon()}
                  <span className="font-bold text-xs md:text-sm">{roleOpt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: Profile Picture Selection */}
          <div className="space-y-3 border-t border-gray-100 dark:border-gray-850 pt-5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                2. CHOISIR VOTRE PHOTO DE PROFIL CHIC
              </label>
              {uploading && (
                <span className="text-[10px] font-black tracking-wider text-[#7C3AED] uppercase animate-pulse">
                  Chargement de la photo... {uploadProgress}%
                </span>
              )}
            </div>

            <div className="border border-gray-100 dark:border-gray-800 p-4.5 rounded-2xl bg-gray-50/50 dark:bg-gray-850/20 space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Current Preview or Camera active viewport */}
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#7C3AED] bg-gray-100 dark:bg-gray-800 flex-shrink-0 flex items-center justify-center shadow-inner">
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
                        className="px-3.5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Prendre une photo
                      </button>
                    </div>
                  )}
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">
                    Stockage réel via Firebase Storage ou simulation HD.
                  </span>
                </div>
              </div>

              {/* Predefined Avatars as presets alternatives */}
              <div className="pt-2 border-t border-gray-100/30 dark:border-gray-800/20">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase block mb-1.5">Ou utiliser l'une de nos illustrations :</span>
                <div className="flex flex-wrap gap-2">
                  {AVATARS.map((url, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`relative w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${
                        avatarUrl === url ? "border-[#7C3AED] scale-105 shadow-md" : "border-transparent"
                      }`}
                    >
                      <img src={url} alt={`Avatar ${index}`} className="w-full h-full object-cover" />
                      {avatarUrl === url && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: Basic Info */}
          <div className="space-y-4 border-t border-gray-100 dark:border-gray-850 pt-5">
            <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              3. INFORMATIONS PERSONNELLES
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-450 mb-1">Prénom (Obligatoire)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Didier"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#7C3AED] focus:bg-white dark:focus:bg-[#121214] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-450 mb-1">Nom (Obligatoire)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Drogba"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#7C3AED] focus:bg-white dark:focus:bg-[#121214] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-450 mb-1">Nom d'Artiste / Nom de Scène (e.g. Yorobo, ...) </label>
                <input
                  type="text"
                  placeholder="Laisser vide si non applicable"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#7C3AED] focus:bg-white dark:focus:bg-[#121214] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-450 mb-1">Numéro Téléphone (Obligatoire)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0745891200"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#7C3AED] focus:bg-white dark:focus:bg-[#121214] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-450 mb-1">Commune d'Abidjan (Obligatoire)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <select
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#7C3AED] focus:bg-white dark:focus:bg-[#121214] dark:text-white"
                  >
                    {ABIDJAN_COMMUNES.map((com) => (
                      <option key={com} value={com}>{com}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-450 mb-1">Ma présentation / Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Présentez brièvement vos compétences, vos cabarets fétiches ou vos préférences d'événement..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#121214] dark:text-white"
              />
            </div>
          </div>

          {/* STEP 4: Music Fields (Conditional for Musician / Group) */}
          {(role === "musicien" || role === "groupe") && (
            <div className="space-y-4 border-t border-gray-100 dark:border-gray-850 pt-5">
              <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                4. SPÉCIFICITÉS MUSICALES
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-450 mb-1">Spécialité Principale</label>
                  <select
                    value={speciality}
                    onChange={(e) => setSpeciality(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-805 rounded-xl text-sm focus:outline-none focus:ring-[#7C3AED] focus:bg-white dark:focus:bg-[#121214] dark:text-white"
                  >
                    {SPECIALTIES.map((spec) => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-450 mb-1">Genre Musical de Prédilection</label>
                  <select
                    value={musicGenre}
                    onChange={(e) => setMusicGenre(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-805 rounded-xl text-sm focus:outline-none focus:ring-[#7C3AED] focus:bg-white dark:focus:bg-[#121214] dark:text-white"
                  >
                    {GENRES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-450 mb-1">Années d'expérience de scène</label>
                  <select
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-805 rounded-xl text-sm focus:outline-none focus:ring-[#7C3AED] focus:bg-white dark:focus:bg-[#121214] dark:text-white"
                  >
                    {EXPERIENCES.map((exp) => (
                      <option key={exp} value={exp}>{exp}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Mobile Money coordinates */}
          <div className="space-y-4 border-t border-gray-100 dark:border-gray-850 pt-5">
            <div className="flex items-center gap-2">
              <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                5. coordonnées MOBILE MONEY POUR VOS GOMBOS
              </label>
              <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-950/40 text-[#7C3AED] dark:text-[#A78BFA] px-1.5 py-0.5 rounded-md uppercase">Sécurisé</span>
            </div>
            <p className="text-xs text-gray-450 dark:text-gray-500">
              Ces numéros restent strictement confidentiels et ne seront affichés au recruteur qu'une fois votre prestation validée par un contrat.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1 flex items-center gap-1.5">
                  🌊 Numéro WAVE
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0745891200"
                  value={waveNumber}
                  onChange={(e) => setWaveNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#7C3AED] focus:bg-white dark:focus:bg-[#121214] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-655 dark:text-gray-400 mb-1 flex items-center gap-1.5">
                  🍊 Numéro ORANGE MONEY
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0545891200"
                  value={orangeMoneyNumber}
                  onChange={(e) => setOrangeMoneyNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#7C3AED] focus:bg-white dark:focus:bg-[#121214] dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-gray-850 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-10 py-3.5 bg-gradient-to-r from-[#7C3AED] to-indigo-600 hover:from-[#6D28D9] hover:to-indigo-700 text-white font-extrabold rounded-2xl shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Finaliser mon Profil Gombo
                </>
              )}
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
