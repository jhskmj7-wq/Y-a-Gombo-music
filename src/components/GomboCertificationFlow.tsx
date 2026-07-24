import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, Shield, ShieldCheck, User, Music, Camera, FileText, Globe, 
  Clock, Check, AlertCircle, Upload, X, Fingerprint, Sparkles, HelpCircle 
} from "lucide-react";
import { UserProfile } from "../types";
import { gomboDB } from "../firebase";
import { audioSynth } from "../lib/audio";

interface GomboCertificationFlowProps {
  currentUserProfile: UserProfile;
  onRefreshProfile: () => void;
  onBack: () => void;
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
  "Orchestre Live"
];

export const GomboCertificationFlow: React.FC<GomboCertificationFlowProps> = ({
  currentUserProfile,
  onRefreshProfile,
  onBack
}) => {
  // Navigation / active step accordions
  const [activeAccordion, setActiveAccordion] = useState<number | null>(0);

  // Forms / state inputs synced to Profile
  const [firstName, setFirstName] = useState(currentUserProfile.firstName || "");
  const [lastName, setLastName] = useState(currentUserProfile.lastName || "");
  const [phone, setPhone] = useState(currentUserProfile.phone || "");
  const [birthDate, setBirthDate] = useState(currentUserProfile.birthDate || "");
  const [commune, setCommune] = useState(currentUserProfile.commune || "Cocody");

  const [artistName, setArtistName] = useState(currentUserProfile.artisticName || currentUserProfile.artistName || "");

  const [avatarUrl, setAvatarUrl] = useState(currentUserProfile.avatarUrl || currentUserProfile.photoURL || "");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(0);

  const [idCardUrl, setIdCardUrl] = useState(currentUserProfile.kycDocs?.identityCardUrl || currentUserProfile.kycDocUrl || "");
  const [idCardBackUrl, setIdCardBackUrl] = useState(currentUserProfile.kycDocs?.identityCardBackUrl || "");
  const [idUploading, setIdUploading] = useState(false);
  const [idBackUploading, setIdBackUploading] = useState(false);
  const [idProgress, setIdProgress] = useState(0);
  const [idBackProgress, setIdBackProgress] = useState(0);

  const [selfieUrl, setSelfieUrl] = useState(currentUserProfile.kycDocs?.selfieUrl || "");
  const [selfieUploading, setSelfieUploading] = useState(false);
  const [selfieProgress, setSelfieProgress] = useState(0);

  const [role, setRole] = useState(currentUserProfile.role || "musicien");
  const [experience, setExperience] = useState(currentUserProfile.experience || "Intermédiaire");
  const [specialties, setSpecialties] = useState<string[]>(currentUserProfile.specialties || []);
  const [musicGenres, setMusicGenres] = useState<string[]>(currentUserProfile.musicGenres || []);
  const [bio, setBio] = useState(currentUserProfile.bio || "");

  const [instagram, setInstagram] = useState(currentUserProfile.instagram || "");
  const [youtube, setYoutube] = useState(currentUserProfile.youtube || "");
  const [facebook, setFacebook] = useState(currentUserProfile.facebook || "");
  const [skippedSocials, setSkippedSocials] = useState(currentUserProfile.skippedSocials || false);

  // UI state feedback
  const [savingStep, setSavingStep] = useState<number | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Sync state changes from DB when updated elsewhere
  useEffect(() => {
    if (currentUserProfile) {
      setFirstName(currentUserProfile.firstName || "");
      setLastName(currentUserProfile.lastName || "");
      setPhone(currentUserProfile.phone || "");
      setBirthDate(currentUserProfile.birthDate || "");
      setCommune(currentUserProfile.commune || "Cocody");
      setArtistName(currentUserProfile.artisticName || currentUserProfile.artistName || "");
      setAvatarUrl(currentUserProfile.avatarUrl || currentUserProfile.photoURL || "");
      setIdCardUrl(currentUserProfile.kycDocs?.identityCardUrl || currentUserProfile.kycDocUrl || "");
      setIdCardBackUrl(currentUserProfile.kycDocs?.identityCardBackUrl || "");
      setSelfieUrl(currentUserProfile.kycDocs?.selfieUrl || "");
      setRole(currentUserProfile.role || "musicien");
      setExperience(currentUserProfile.experience || "Intermédiaire");
      setSpecialties(currentUserProfile.specialties || []);
      setMusicGenres(currentUserProfile.musicGenres || []);
      setBio(currentUserProfile.bio || "");
      setInstagram(currentUserProfile.instagram || "");
      setYoutube(currentUserProfile.youtube || "");
      setFacebook(currentUserProfile.facebook || "");
      setSkippedSocials(currentUserProfile.skippedSocials || false);
    }
  }, [currentUserProfile]);

  // Helper values for step determination
  const getStepStatus = (stepIndex: number): "À faire" | "En cours" | "Validée" => {
    switch (stepIndex) {
      case 0: // Informations personnelles
        if (firstName && lastName && phone && birthDate && commune) return "Validée";
        if (firstName || lastName || phone || birthDate) return "En cours";
        return "À faire";
      case 1: // Nom artistique
        if (artistName && artistName.trim().length > 1) return "Validée";
        return "À faire";
      case 2: // Photo réelle
        if (avatarUrl && !avatarUrl.includes("photo-1534528741775")) return "Validée";
        if (avatarUrl) return "Validée"; // any avatar url counts
        return "À faire";
      case 3: // Pièce d'identité
        if (idCardUrl && idCardBackUrl) return "Validée";
        if (idUploading || idBackUploading) return "En cours";
        return "À faire";
      case 4: // Selfie de vérification
        if (selfieUrl) return "Validée";
        if (selfieUploading) return "En cours";
        return "À faire";
      case 5: // Activité musicale
        if (role && experience && specialties.length > 0 && bio && bio.trim().length > 10) return "Validée";
        if (role || experience || specialties.length > 0 || bio) return "En cours";
        return "À faire";
      case 6: // Réseaux sociaux
        if (instagram || youtube || facebook || skippedSocials) return "Validée";
        return "À faire";
      case 7: // Validation AFRIGOMBO
        if (currentUserProfile.isVerified === true || currentUserProfile.kycStatus === "approved") return "Validée";
        if (currentUserProfile.kycStatus === "pending") return "En cours";
        return "À faire";
      default:
        return "À faire";
    }
  };

  // Compute overall progress (steps 0 to 6 completed)
  const completedStepsCount = [0, 1, 2, 3, 4, 5, 6].filter(idx => getStepStatus(idx) === "Validée").length;
  const progressPercent = Math.round((completedStepsCount / 7) * 100);
  const allRequiredStepsValid = completedStepsCount === 7;

  // Save changes to Firestore for a specific step
  const handleSaveStep = async (stepIndex: number) => {
    setSavingStep(stepIndex);
    try {
      let updates: Partial<UserProfile> = {};

      switch (stepIndex) {
        case 0:
          updates = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim(),
            birthDate: birthDate,
            commune: commune
          };
          break;
        case 1:
          updates = {
            artisticName: artistName.trim(),
            artistName: artistName.trim(),
            displayName: artistName.trim()
          };
          break;
        case 2:
          updates = {
            avatarUrl: avatarUrl,
            photoURL: avatarUrl
          };
          break;
        case 3:
          updates = {
            kycDocUrl: idCardUrl,
            kycDocs: {
              ...currentUserProfile.kycDocs,
              identityCardUrl: idCardUrl,
              identityCardBackUrl: idCardBackUrl
            }
          };
          break;
        case 4:
          updates = {
            kycDocs: {
              ...currentUserProfile.kycDocs,
              selfieUrl: selfieUrl
            }
          };
          break;
        case 5:
          updates = {
            role: role as any,
            experience: experience,
            specialties: specialties,
            specialty: specialties[0] || "Artiste",
            speciality: specialties[0] || "Artiste",
            musicGenres: musicGenres,
            musicGenre: musicGenres[0] || "Showbiz",
            bio: bio.trim()
          };
          break;
        case 6:
          updates = {
            instagram: instagram.trim(),
            youtube: youtube.trim(),
            facebook: facebook.trim(),
            skippedSocials: skippedSocials
          };
          break;
      }

      await gomboDB.updateUserProfile(currentUserProfile.uid, updates);
      onRefreshProfile();
      try { audioSynth.playTamTam(true); } catch (_) {}
      
      // Auto-open next accordion if possible
      if (stepIndex < 6) {
        setActiveAccordion(stepIndex + 1);
      } else {
        setActiveAccordion(null);
      }
    } catch (err) {
      console.error("Error saving step:", err);
    } finally {
      setSavingStep(null);
    }
  };

  // Upload file handler
  const handleFileUpload = async (file: File, type: "avatar" | "id" | "id_verso" | "selfie") => {
    const isAvatar = type === "avatar";
    const isId = type === "id";
    const isIdBack = type === "id_verso";
    const isSelfie = type === "selfie";

    if (isAvatar) { setAvatarUploading(true); setAvatarProgress(0); }
    if (isId) { setIdUploading(true); setIdProgress(0); }
    if (isIdBack) { setIdBackUploading(true); setIdBackProgress(0); }
    if (isSelfie) { setSelfieUploading(true); setSelfieProgress(0); }

    try {
      const fileName = isId ? "id_front.jpg" : isIdBack ? "id_back.jpg" : file.name;
      const path = `kyc/${currentUserProfile.uid}/${isId || isIdBack ? fileName : `${Date.now()}_${type}_${file.name}`}`;
      
      const downloadUrl = await gomboDB.uploadFile(file, path, (progress) => {
        if (isAvatar) setAvatarProgress(Math.round(progress));
        if (isId) setIdProgress(Math.round(progress));
        if (isIdBack) setIdBackProgress(Math.round(progress));
        if (isSelfie) setSelfieProgress(Math.round(progress));
      });

      if (isAvatar) {
        setAvatarUrl(downloadUrl);
        await gomboDB.updateUserProfile(currentUserProfile.uid, { avatarUrl: downloadUrl, photoURL: downloadUrl });
      } else if (isId) {
        setIdCardUrl(downloadUrl);
        await gomboDB.updateUserProfile(currentUserProfile.uid, {
          kycDocUrl: downloadUrl,
          kycDocs: {
            ...currentUserProfile.kycDocs,
            identityCardUrl: downloadUrl
          }
        });
      } else if (isIdBack) {
        setIdCardBackUrl(downloadUrl);
        await gomboDB.updateUserProfile(currentUserProfile.uid, {
          kycDocs: {
            ...currentUserProfile.kycDocs,
            identityCardBackUrl: downloadUrl
          }
        });
      } else if (isSelfie) {
        setSelfieUrl(downloadUrl);
        await gomboDB.updateUserProfile(currentUserProfile.uid, {
          kycDocs: {
            ...currentUserProfile.kycDocs,
            selfieUrl: downloadUrl
          }
        });
      }

      onRefreshProfile();
      try { audioSynth.playValidationSuccess(); } catch (_) {}
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      if (isAvatar) setAvatarUploading(false);
      if (isId) setIdUploading(false);
      if (isIdBack) setIdBackUploading(false);
      if (isSelfie) setSelfieUploading(false);
    }
  };

  // Submit complete request
  const handleSubmitCertification = async () => {
    if (!allRequiredStepsValid) return;
    setSubmitLoading(true);

    try {
      await gomboDB.updateUserProfile(currentUserProfile.uid, {
        kycStatus: "pending",
        kycSubmittedDate: new Date().toISOString()
      });

      // Log activity
      await gomboDB.logUserActivity({
        userId: currentUserProfile.uid,
        type: "Certification GOMBO ID",
        details: "Demande officielle d'obtention de GOMBO ID soumise pour analyse par le comité artistique."
      });

      try { audioSynth.playValidationSuccess(); } catch (_) {}
      setSubmitSuccess(true);
      onRefreshProfile();
    } catch (err) {
      console.error("Error submitting certification:", err);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Specialties checkbox toggle helper
  const handleToggleSpecialty = (item: string) => {
    if (specialties.includes(item)) {
      setSpecialties(specialties.filter(s => s !== item));
    } else {
      setSpecialties([...specialties, item]);
    }
  };

  // Genre checkbox toggle helper
  const handleToggleGenre = (item: string) => {
    if (musicGenres.includes(item)) {
      setMusicGenres(musicGenres.filter(g => g !== item));
    } else {
      setMusicGenres([...musicGenres, item]);
    }
  };

  const stepsList = [
    {
      title: "Informations personnelles",
      desc: "Coordonnées légales de l'artiste",
      icon: User,
      renderForm: () => (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-wider block mb-1">Prénom</label>
              <input 
                type="text" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                className="w-full bg-afri-bg border border-afri-border rounded-xl px-3 py-2 text-xs text-afri-text focus:outline-none focus:border-afri-gold" 
                placeholder="Ex. Jean"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-wider block mb-1">Nom</label>
              <input 
                type="text" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                className="w-full bg-afri-bg border border-afri-border rounded-xl px-3 py-2 text-xs text-afri-text focus:outline-none focus:border-afri-gold" 
                placeholder="Ex. Kouassi"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-wider block mb-1">Téléphone</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                className="w-full bg-afri-bg border border-afri-border rounded-xl px-3 py-2 text-xs text-afri-text focus:outline-none focus:border-afri-gold" 
                placeholder="0700000000"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-wider block mb-1">Date de naissance</label>
              <input 
                type="date" 
                value={birthDate} 
                onChange={(e) => setBirthDate(e.target.value)} 
                className="w-full bg-afri-bg border border-afri-border rounded-xl px-3 py-1.5 text-xs text-afri-text focus:outline-none focus:border-afri-gold" 
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-wider block mb-1">Commune de résidence (Abidjan)</label>
            <select 
              value={commune} 
              onChange={(e) => setCommune(e.target.value)} 
              className="w-full bg-afri-bg border border-afri-border rounded-xl px-3 py-2 text-xs text-afri-text focus:outline-none focus:border-afri-gold"
            >
              {ABIDJAN_COMMUNES.map((comm) => (
                <option key={comm} value={comm}>{comm}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => handleSaveStep(0)}
            disabled={!firstName || !lastName || !phone || !birthDate}
            className="w-full py-2 bg-gradient-to-r from-amber-600 to-[#D4AF37] hover:brightness-110 disabled:opacity-50 text-black font-sans font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
          >
            {savingStep === 0 ? "Sauvegarde..." : "Valider cette étape"}
          </button>
        </div>
      )
    },
    {
      title: "Nom artistique",
      desc: "Identité de scène ou pseudonyme unique",
      icon: Sparkles,
      renderForm: () => (
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-wider block mb-1">Votre nom artistique de scène</label>
            <input 
              type="text" 
              value={artistName} 
              onChange={(e) => setArtistName(e.target.value)} 
              className="w-full bg-afri-bg border border-afri-border rounded-xl px-3 py-2.5 text-sm text-afri-text focus:outline-none focus:border-afri-gold font-black text-center" 
              placeholder="Ex. DJ KEROZEN, SERGE BEYNAUD"
            />
            <p className="text-[9px] text-afri-text-sec font-mono mt-1.5 leading-normal">
              ⚠️ Ce nom figurera sur vos contrats et sur votre certificat d'identité GOMBO ID de manière permanente.
            </p>
          </div>

          <button 
            onClick={() => handleSaveStep(1)}
            disabled={!artistName || artistName.trim().length < 2}
            className="w-full py-2 bg-gradient-to-r from-amber-600 to-[#D4AF37] hover:brightness-110 disabled:opacity-50 text-black font-sans font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
          >
            {savingStep === 1 ? "Sauvegarde..." : "Valider mon nom artistique"}
          </button>
        </div>
      )
    },
    {
      title: "Photo réelle",
      desc: "Photo de profil professionnelle ou portrait",
      icon: Camera,
      renderForm: () => (
        <div className="space-y-4 pt-2">
          <div className="flex flex-col items-center justify-center p-4 border border-dashed border-afri-border rounded-2xl bg-afri-bg-sec">
            {avatarUrl ? (
              <div className="relative group mb-3">
                <img 
                  src={avatarUrl} 
                  alt="Profile Preview" 
                  className="w-24 h-24 rounded-full object-cover border-2 border-afri-gold/50" 
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => setAvatarUrl("")}
                  className="absolute -top-1 -right-1 bg-red-600 p-1 rounded-full border border-black hover:bg-red-500 transition-colors"
                >
                  <X className="w-3 h-3 text-afri-text" />
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-afri-bg-sec border border-afri-border flex items-center justify-center mb-3 text-afri-text-sec">
                <Camera className="w-8 h-8" />
              </div>
            )}

            <input 
              type="file" 
              accept="image/*" 
              id="avatar-flow-picker" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0], "avatar");
                }
              }}
            />
            
            <label 
              htmlFor="avatar-flow-picker"
              className="px-4 py-2 bg-afri-bg-sec hover:bg-afri-bg-sec text-afri-text font-mono text-xs rounded-xl border border-afri-border cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              {avatarUploading ? `Envoi... ${avatarProgress}%` : "Téléverser ma photo de profil"}
            </label>
          </div>

          <button 
            onClick={() => handleSaveStep(2)}
            disabled={!avatarUrl || avatarUploading}
            className="w-full py-2 bg-gradient-to-r from-amber-600 to-[#D4AF37] hover:brightness-110 disabled:opacity-50 text-black font-sans font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
          >
            Valider la photo
          </button>
        </div>
      )
    },
    {
      title: "Pièce d'identité",
      desc: "CNI, Passeport, ou Attestation d'identité",
      icon: FileText,
      renderForm: () => (
        <div className="space-y-4 pt-2">
          <p className="text-[10px] text-afri-text-sec font-sans leading-relaxed">
            Pour assurer l'authenticité de l'écosystème, téléversez un scan ou une photo nette de votre pièce d'identité officielle (<strong className="text-afri-text">Recto et Verso séparés</strong>).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* RECTO */}
            <div className="flex flex-col items-center justify-center p-4 border border-dashed border-afri-border rounded-2xl bg-afri-bg-sec">
              <span className="text-[9px] font-mono font-black text-afri-text-sec uppercase mb-2">Carte Recto (Face)</span>
              {idCardUrl ? (
                <div className="w-full bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-2 flex items-center gap-2 mb-2">
                  <span className="text-emerald-400 text-sm">✅</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-afri-text truncate">Reçu</p>
                  </div>
                  <button 
                    onClick={() => setIdCardUrl("")}
                    className="bg-afri-bg-sec hover:bg-afri-bg-ter p-1 rounded-lg text-afri-text-sec text-[10px]"
                  >
                    X
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-1 mb-2">
                  <FileText className="w-6 h-6 text-afri-text-sec mx-auto" />
                </div>
              )}

              <input 
                type="file" 
                accept="image/*" 
                id="idcard-recto-picker" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0], "id");
                  }
                }}
              />
              
              {!idCardUrl && (
                <label 
                  htmlFor="idcard-recto-picker"
                  className="px-3 py-1.5 bg-afri-bg-sec hover:bg-afri-bg-sec text-afri-text font-mono text-[10px] rounded-lg border border-afri-border cursor-pointer flex items-center gap-1 transition-all"
                >
                  <Upload className="w-3 h-3" />
                  {idUploading ? `${idProgress}%` : "Recto"}
                </label>
              )}
            </div>

            {/* VERSO */}
            <div className="flex flex-col items-center justify-center p-4 border border-dashed border-afri-border rounded-2xl bg-afri-bg-sec">
              <span className="text-[9px] font-mono font-black text-afri-text-sec uppercase mb-2">Carte Verso (Dos)</span>
              {idCardBackUrl ? (
                <div className="w-full bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-2 flex items-center gap-2 mb-2">
                  <span className="text-emerald-400 text-sm">✅</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-afri-text truncate">Reçu</p>
                  </div>
                  <button 
                    onClick={() => setIdCardBackUrl("")}
                    className="bg-afri-bg-sec hover:bg-afri-bg-ter p-1 rounded-lg text-afri-text-sec text-[10px]"
                  >
                    X
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-1 mb-2">
                  <FileText className="w-6 h-6 text-afri-text-sec mx-auto" />
                </div>
              )}

              <input 
                type="file" 
                accept="image/*" 
                id="idcard-verso-picker" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0], "id_verso");
                  }
                }}
              />
              
              {!idCardBackUrl && (
                <label 
                  htmlFor="idcard-verso-picker"
                  className="px-3 py-1.5 bg-afri-bg-sec hover:bg-afri-bg-sec text-afri-text font-mono text-[10px] rounded-lg border border-afri-border cursor-pointer flex items-center gap-1 transition-all"
                >
                  <Upload className="w-3 h-3" />
                  {idBackUploading ? `${idBackProgress}%` : "Verso"}
                </label>
              )}
            </div>
          </div>

          <button 
            onClick={() => handleSaveStep(3)}
            disabled={!idCardUrl || !idCardBackUrl || idUploading || idBackUploading}
            className="w-full py-2 bg-gradient-to-r from-amber-600 to-[#D4AF37] hover:brightness-110 disabled:opacity-50 text-black font-sans font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
          >
            {savingStep === 3 ? "Sauvegarde..." : "Valider les deux faces"}
          </button>
        </div>
      )
    },
    {
      title: "Selfie de vérification",
      desc: "Portrait en direct tenant un papier 'AFRIGOMBO'",
      icon: Shield,
      renderForm: () => (
        <div className="space-y-4 pt-2">
          <p className="text-[10px] text-afri-text-sec font-sans leading-relaxed">
            Pour confirmer que la pièce d'identité vous appartient, téléversez un selfie de vous tenant un bout de papier écrit à la main <strong className="text-afri-gold">"AFRIGOMBO"</strong> avec la date d'aujourd'hui.
          </p>

          <div className="flex flex-col items-center justify-center p-5 border border-dashed border-afri-border rounded-2xl bg-afri-bg-sec">
            {selfieUrl ? (
              <div className="w-full bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3 flex items-center gap-3.5 mb-3">
                <span className="text-emerald-400 text-lg">🤳</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-afri-text truncate">Selfie de vérification reçu</p>
                  <p className="text-[9px] text-afri-text-sec font-mono">Comparaison faciale prête</p>
                </div>
                <button 
                  onClick={() => setSelfieUrl("")}
                  className="bg-afri-bg-sec hover:bg-afri-bg-ter p-1 rounded-lg text-afri-text-sec hover:text-afri-text"
                >
                  Modifier
                </button>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <Camera className="w-9 h-9 text-afri-text-sec mx-auto" />
                <p className="text-[9.5px] text-afri-text-sec font-mono">Format JPG, PNG portrait</p>
              </div>
            )}

            <input 
              type="file" 
              accept="image/*" 
              id="selfie-flow-picker" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0], "selfie");
                }
              }}
            />
            
            {!selfieUrl && (
              <label 
                htmlFor="selfie-flow-picker"
                className="mt-3 px-4 py-2 bg-afri-bg-sec hover:bg-afri-bg-sec text-afri-text font-mono text-xs rounded-xl border border-afri-border cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                {selfieUploading ? `Envoi... ${selfieProgress}%` : "Sélectionner mon selfie"}
              </label>
            )}
          </div>

          <button 
            onClick={() => handleSaveStep(4)}
            disabled={!selfieUrl || selfieUploading}
            className="w-full py-2 bg-gradient-to-r from-amber-600 to-[#D4AF37] hover:brightness-110 disabled:opacity-50 text-black font-sans font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
          >
            Valider le selfie
          </button>
        </div>
      )
    },
    {
      title: "Activité musicale",
      desc: "Vos compétences, spécialités et biographie",
      icon: Music,
      renderForm: () => (
        <div className="space-y-4 pt-2 max-h-[400px] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-wider block mb-1">Rôle Principal</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)} 
                className="w-full bg-afri-bg border border-afri-border rounded-xl px-3 py-2 text-xs text-afri-text focus:outline-none focus:border-afri-gold"
              >
                <option value="musicien">Musicien / Chanteur</option>
                <option value="client">Organisateur / Promoteur</option>
                <option value="orchestre">Groupe / Orchestre</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-wider block mb-1">Niveau d'expérience</label>
              <select 
                value={experience} 
                onChange={(e) => setExperience(e.target.value)} 
                className="w-full bg-afri-bg border border-afri-border rounded-xl px-3 py-2 text-xs text-afri-text focus:outline-none focus:border-afri-gold"
              >
                {EXPERIENCES.map((exp) => (
                  <option key={exp} value={exp}>{exp}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-wider block mb-1.5">Spécialités artistiques (Choisir au moins 1)</label>
            <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto p-2 bg-afri-bg-sec border border-afri-border rounded-xl">
              {SPECIALTIES.map((spec) => {
                const selected = specialties.includes(spec);
                return (
                  <button 
                    key={spec}
                    type="button"
                    onClick={() => handleToggleSpecialty(spec)}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all ${
                      selected ? "bg-afri-gold text-black border border-amber-500" : "bg-afri-bg-sec text-afri-text-sec border border-zinc-950"
                    }`}
                  >
                    {spec}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-wider block mb-1.5">Styles musicaux</label>
            <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto p-2 bg-afri-bg-sec border border-afri-border rounded-xl">
              {GENRES.map((gen) => {
                const selected = musicGenres.includes(gen);
                return (
                  <button 
                    key={gen}
                    type="button"
                    onClick={() => handleToggleGenre(gen)}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all ${
                      selected ? "bg-afri-gold text-black border border-amber-500" : "bg-afri-bg-sec text-afri-text-sec border border-zinc-950"
                    }`}
                  >
                    {gen}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-wider block mb-1">Votre biographie professionnelle (min. 10 caractères)</label>
            <textarea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              rows={3}
              className="w-full bg-afri-bg border border-afri-border rounded-xl px-3 py-2 text-xs text-afri-text focus:outline-none focus:border-afri-gold placeholder-zinc-700" 
              placeholder="Décrivez votre parcours musical, vos collaborations passées, vos influences et vos scènes..."
            />
          </div>

          <button 
            onClick={() => handleSaveStep(5)}
            disabled={specialties.length === 0 || !bio || bio.trim().length < 10}
            className="w-full py-2 bg-gradient-to-r from-amber-600 to-[#D4AF37] hover:brightness-110 disabled:opacity-50 text-black font-sans font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
          >
            {savingStep === 5 ? "Sauvegarde..." : "Valider l'activité musicale"}
          </button>
        </div>
      )
    },
    {
      title: "Réseaux sociaux (optionnel)",
      desc: "Lien de visibilité de vos oeuvres",
      icon: Globe,
      renderForm: () => (
        <div className="space-y-4 pt-2">
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-wider block mb-1">Instagram Link</label>
              <input 
                type="text" 
                value={instagram} 
                onChange={(e) => { setInstagram(e.target.value); setSkippedSocials(false); }} 
                className="w-full bg-afri-bg border border-afri-border rounded-xl px-3 py-2 text-xs text-afri-text focus:outline-none focus:border-afri-gold" 
                placeholder="Ex: instagram.com/mon_artiste"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-wider block mb-1">YouTube Link / Video</label>
              <input 
                type="text" 
                value={youtube} 
                onChange={(e) => { setYoutube(e.target.value); setSkippedSocials(false); }} 
                className="w-full bg-afri-bg border border-afri-border rounded-xl px-3 py-2 text-xs text-afri-text focus:outline-none focus:border-afri-gold" 
                placeholder="Ex: youtube.com/c/mon_artiste"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-wider block mb-1">Facebook Fan Page</label>
              <input 
                type="text" 
                value={facebook} 
                onChange={(e) => { setFacebook(e.target.value); setSkippedSocials(false); }} 
                className="w-full bg-afri-bg border border-afri-border rounded-xl px-3 py-2 text-xs text-afri-text focus:outline-none focus:border-afri-gold" 
                placeholder="Ex: facebook.com/mon_artiste"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 py-1">
            <input 
              type="checkbox" 
              id="skip-socials-cb"
              checked={skippedSocials}
              onChange={(e) => {
                setSkippedSocials(e.target.checked);
                if (e.target.checked) {
                  setInstagram("");
                  setYoutube("");
                  setFacebook("");
                }
              }}
              className="rounded border-afri-border bg-afri-bg text-afri-gold focus:ring-[#D4AF37]"
            />
            <label htmlFor="skip-socials-cb" className="text-[10.5px] font-mono font-bold text-afri-text-sec select-none uppercase tracking-wide">
              Je n'ai pas de réseaux à lier / Passer
            </label>
          </div>

          <button 
            onClick={() => handleSaveStep(6)}
            disabled={!instagram && !youtube && !facebook && !skippedSocials}
            className="w-full py-2 bg-gradient-to-r from-amber-600 to-[#D4AF37] hover:brightness-110 disabled:opacity-50 text-black font-sans font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
          >
            {savingStep === 6 ? "Sauvegarde..." : "Valider cette section"}
          </button>
        </div>
      )
    },
    {
      title: "Validation AFRIGOMBO",
      desc: "Analyse finale de conformité par le Temple",
      icon: Clock,
      renderForm: () => {
        const kycStatus = currentUserProfile.kycStatus || "none";
        return (
          <div className="space-y-4 pt-2 text-center pb-2">
            {kycStatus === "pending" ? (
              <div className="space-y-3.5">
                <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <Clock className="w-7 h-7 text-amber-400" />
                </div>
                <h4 className="text-sm font-sans font-black uppercase text-amber-400 tracking-wider">Demande en cours d'analyse</h4>
                <p className="text-[11px] text-afri-text-sec leading-relaxed max-w-[280px] mx-auto">
                  Vos documents et informations de profil musical ont été transmis aux administrateurs artistiques à Abidjan Cocody.
                </p>
                <div className="p-3 bg-afri-bg border border-afri-border rounded-xl inline-block">
                  <p className="text-[9.5px] font-mono font-black text-afri-text-sec uppercase tracking-widest">
                    ⏱️ DÉLAI ESTIMÉ : 12H À 24H
                  </p>
                </div>
              </div>
            ) : currentUserProfile.isVerified === true || kycStatus === "approved" ? (
              <div className="space-y-3">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-7 h-7 text-emerald-400" />
                </div>
                <h4 className="text-sm font-sans font-black uppercase text-emerald-400 tracking-wider">Profil Certifié Souverain !</h4>
                <p className="text-[11px] text-afri-text-sec max-w-[280px] mx-auto leading-relaxed">
                  Votre identité a été approuvée avec succès. Votre GOMBO ID unique est officiellement généré et rattaché à votre patrimoine.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 bg-afri-bg-sec border border-afri-border rounded-full flex items-center justify-center mx-auto text-afri-text-sec">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-sans font-black uppercase text-afri-text-sec tracking-wider">Validation non initiée</h4>
                <p className="text-[10px] text-afri-text-sec max-w-[250px] mx-auto">
                  Complétez d'abord les 7 étapes précédentes pour soumettre votre dossier.
                </p>
              </div>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 pb-32 pt-2 text-left">
      {/* Header title */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-lg font-serif font-black uppercase tracking-wider text-afri-text">Certification GOMBO ID</h2>
          <p className="text-[10px] text-afri-text-sec font-mono uppercase tracking-widest">Le parcours d'excellence et de souveraineté</p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-afri-bg border border-afri-border rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-mono font-black text-afri-gold uppercase tracking-[0.15em]">Statut de votre dossier</span>
            <h3 className="text-sm font-sans font-black uppercase text-afri-text tracking-wide">
              {progressPercent === 100 ? "Dossier prêt pour envoi" : `${completedStepsCount} / 7 étapes complétées`}
            </h3>
          </div>
          <div className="text-right">
            <span className="text-lg font-serif font-black text-afri-gold">{progressPercent}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-afri-bg-sec/50 h-2 rounded-full overflow-hidden border border-zinc-950">
          <motion.div 
            className="bg-gradient-to-r from-amber-500 via-[#D4AF37] to-amber-300 h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Informative block */}
        <div className="flex gap-2.5 bg-afri-bg-sec/40 border border-afri-border rounded-2xl p-3 text-[10px] text-afri-text-sec font-sans leading-relaxed">
          <Fingerprint className="w-5 h-5 text-afri-gold shrink-0 stroke-[1.8]" />
          <span>
            Le GOMBO ID certifie votre profil auprès des producteurs, garantit le versement sécurisé de vos cachets et vous donne un accès privilégié aux Gombos du Temple.
          </span>
        </div>
      </div>

      {/* Steps Accordion List */}
      <div className="space-y-3">
        {stepsList.map((step, idx) => {
          const status = getStepStatus(idx);
          const isOpen = activeAccordion === idx;
          const StepIcon = step.icon;

          return (
            <div 
              key={idx}
              className={`bg-afri-bg border rounded-2xl overflow-hidden transition-all duration-300 ${
                isOpen 
                  ? "border-afri-gold/45 shadow-[0_4px_15px_rgba(212,175,55,0.06)]" 
                  : "border-afri-border/80 hover:border-afri-border"
              }`}
            >
              {/* Accordion Trigger Header */}
              <div 
                onClick={() => {
                  setActiveAccordion(isOpen ? null : idx);
                  try { audioSynth.playKoraNote(261.63 + idx * 30, 0, 0.05, 0.3); } catch (_) {}
                }}
                className="flex items-center justify-between p-4 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${
                    status === "Validée" 
                      ? "bg-emerald-950/10 border-emerald-500/20 text-emerald-400" 
                      : status === "En cours"
                        ? "bg-amber-950/10 border-amber-500/20 text-amber-400"
                        : "bg-afri-bg border-afri-border text-afri-text-sec"
                  }`}>
                    <StepIcon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-sans font-black uppercase text-afri-text tracking-wide">{step.title}</h4>
                    <p className="text-[9px] text-afri-text-sec font-mono">{step.desc}</p>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-2">
                  <span className={`text-[8.5px] font-mono font-black uppercase px-2 py-0.5 rounded-full border ${
                    status === "Validée" 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                      : status === "En cours"
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse"
                        : "bg-afri-bg border-afri-border text-afri-text-sec"
                  }`}>
                    {status}
                  </span>
                </div>
              </div>

              {/* Accordion Content */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="border-t border-afri-border/60 bg-afri-bg/10 px-4 pb-4"
                  >
                    {step.renderForm()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Submission Panel at the bottom */}
      {currentUserProfile.kycStatus !== "pending" && !currentUserProfile.isVerified && (
        <div className="bg-afri-bg border border-afri-border rounded-3xl p-5 text-center space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-mono uppercase font-black text-afri-text-sec tracking-wider">Soumettre le dossier de certification</h4>
            <p className="text-[10px] text-afri-text-sec font-sans">
              Une fois validée, l'équipe AFRIGOMBO vous attribuera votre code officiel permanent sous 24 heures.
            </p>
          </div>

          <button
            onClick={handleSubmitCertification}
            disabled={!allRequiredStepsValid || submitLoading}
            className={`w-full py-3.5 px-4 font-sans font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg ${
              allRequiredStepsValid 
                ? "bg-gradient-to-r from-amber-500 via-[#D4AF37] to-amber-300 hover:scale-101 text-black active:scale-98" 
                : "bg-afri-bg-sec border border-afri-border text-afri-text-sec cursor-not-allowed"
            }`}
          >
            {submitLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Soumission du dossier...</span>
              </span>
            ) : (
              <span>Envoyer ma demande</span>
            )}
          </button>

          {!allRequiredStepsValid && (
            <div className="flex items-center justify-center gap-1.5 text-[9px] font-mono text-amber-500 uppercase font-black">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Complétez toutes les étapes requises avant d'envoyer</span>
            </div>
          )}
        </div>
      )}

      {/* Success Modal / Display */}
      {submitSuccess && (
        <div className="fixed inset-0 bg-afri-bg/95 backdrop-blur-md z-[999999] flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl border border-afri-gold/35 bg-afri-bg p-6 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-[#D4AF37] to-amber-300" />
            
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-9 h-9 text-emerald-400" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-sans font-black uppercase text-afri-text tracking-wider">Demande soumise !</h3>
              <p className="text-[10.5px] font-mono text-afri-gold tracking-widest uppercase">⏱️ Analyse en cours</p>
            </div>

            <p className="text-[11px] text-afri-text-sec leading-relaxed max-w-[280px] mx-auto">
              Félicitations, votre dossier de certification artistique est désormais complet et en cours d'analyse. Un administrateur AFRIGOMBO validera votre statut très prochainement.
            </p>

            <button
              onClick={() => {
                setSubmitSuccess(false);
                onBack();
              }}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-[#D4AF37] text-black font-sans font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
            >
              Retour à mon héritage
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
