import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { User, Phone, MapPin, Music, Award, Wallet, Check, Camera, FileText } from "lucide-react";
import { UserProfile, PaymentProvider } from "../types";
import { gomboDB } from "../firebase";

const ABIDJAN_COMMUNES = [
  "Cocody", "Yopougon", "Marcory", "Plateau", "Treichville", "Abobo", 
  "Koumassi", "Adjamé", "Port-Bouët", "Attécoubé", "Grand-Bassam", "Bingerville"
];

const SPECIALTIES = [
  "Chanteur(euse)", "Guitariste Soliste", "Guitariste Accompagnateur", 
  "Bassiste", "Batteur", "Claviériste / Pianiste", "Percussionniste", 
  "DJ", "Cuivres / Wind", "Ingénieur du Son", "Directeur Artistique"
];

const EXPERIENCES = [
  "Débutant passionné",
  "Intermédiaire / Cabarets",
  "Professionnel de scène",
  "Légende du Showbiz"
];

const AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150"
];

interface ProfileEditProps {
  initialProfile: UserProfile;
  onSave: () => void;
  onCancel?: () => void;
}

export default function ProfileEdit({ initialProfile, onSave, onCancel }: ProfileEditProps) {
  const [firstName, setFirstName] = useState(initialProfile.firstName || "");
  const [lastName, setLastName] = useState(initialProfile.lastName || "");
  const [artistName, setArtistName] = useState(initialProfile.artistName || "");
  const [phone, setPhone] = useState(initialProfile.phone || "");
  const [ville, setVille] = useState(initialProfile.ville || "Abidjan");
  const [commune, setCommune] = useState(initialProfile.commune || "Cocody");
  const [bio, setBio] = useState(initialProfile.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl || AVATARS[0]);
  
  // Musicians fields only
  const [specialty, setSpecialty] = useState(initialProfile.specialty || SPECIALTIES[0]);
  const [experience, setExperience] = useState(initialProfile.experience || EXPERIENCES[0]);
  const [paymentNumber, setPaymentNumber] = useState(initialProfile.paymentNumber || "");
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>(initialProfile.paymentProvider || "Wave");

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"not_saved" | "saving" | "saved">("saved");

  // Mount Guard to prevent auto-saving standard initial state on component load
  const isMounted = useRef(false);

  // Compute profile completeness scoring
  const computeCompleteness = () => {
    let score = 0;
    const missing = [];
    
    // 1. Photo Check
    const hasPhoto = avatarUrl && 
                     avatarUrl.trim().length > 0 && 
                     !avatarUrl.includes("photo-1534528741775-53994a69daeb?auto=format"); // check if default unsplash avatar was modified
    if (hasPhoto) score += 20; else missing.push("Photo de profil");

    // 2. Artist Name check
    if (artistName && artistName.trim().length > 1) score += 20; else missing.push("Nom d'artiste");

    // 3. Phone check
    if (phone && phone.trim().replace(/\D/g, "").length >= 8) score += 20; else missing.push("Téléphone");

    // 4. Bio check
    if (bio && bio.trim().length > 5) score += 20; else missing.push("Présentation / Bio");

    // 5. Specialty Check or Commune check
    if (commune && commune.trim().length > 0) score += 20; else missing.push("Commune d'Abidjan");

    return { score, missing };
  };

  const completeness = computeCompleteness();

  // 1. Photo File Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert("La taille du fichier ne doit pas dépasser 4 Mo.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setSaveStatus("saving");

    try {
      const path = `profiles/${initialProfile.uid}/${Date.now()}_${file.name}`;
      const downloadUrl = await gomboDB.uploadFile(path, file, (pct) => {
        setUploadProgress(pct);
      });
      setAvatarUrl(downloadUrl);
      setSaveStatus("saved");
      
      // Auto-update to Firestore immediately after file upload
      await gomboDB.updateUserProfile(initialProfile.uid, {
        avatarUrl: downloadUrl,
        photoURL: downloadUrl
      });
      
      // Emit profile change to alert app header or other listeners
      window.dispatchEvent(new Event("gomboUserProfileChange"));
    } catch (err) {
      console.error("Upload error:", err);
      alert("Une erreur est survenue lors de l'envoi de la photo.");
      setSaveStatus("not_saved");
    } finally {
      setUploading(false);
    }
  };

  // 2. Debounced Intelligent Auto-Save
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    setSaveStatus("saving");

    const delayDebounceFn = setTimeout(async () => {
      try {
        const updates: Partial<UserProfile> = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          artistName: artistName.trim(),
          phone: phone.trim(),
          ville: ville.trim(),
          commune,
          bio: bio.trim(),
          avatarUrl,
          photoURL: avatarUrl,
          ...(initialProfile.role === "musicien" ? {
            specialty,
            experience,
            paymentNumber: paymentNumber.trim(),
            paymentProvider
          } : {})
        };

        await gomboDB.updateUserProfile(initialProfile.uid, updates);
        setSaveStatus("saved");
        
        // Emit profile change event to reload components
        window.dispatchEvent(new Event("gomboUserProfileChange"));
      } catch (err) {
        console.error("Debounced Autosave error:", err);
        setSaveStatus("not_saved");
      }
    }, 1200);

    return () => clearTimeout(delayDebounceFn);
  }, [
    firstName,
    lastName,
    artistName,
    phone,
    ville,
    commune,
    bio,
    avatarUrl,
    specialty,
    experience,
    paymentNumber,
    paymentProvider
  ]);

  // 3. Form Manual Submit (Assurance block)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !artistName.trim() || !commune) {
      alert("Veuillez remplir les informations obligatoires (Prénom, Nom, Nom d'artiste, Téléphone, Commune).");
      return;
    }

    const cleanedDigits = phone.trim().replace(/\D/g, "");
    if (cleanedDigits.length < 8) {
      alert("Le numéro de téléphone saisi est trop court (min. 8 chiffres).");
      return;
    }

    setLoading(true);

    const updates: Partial<UserProfile> = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      artistName: artistName.trim(),
      phone: phone.trim(),
      ville: ville.trim(),
      commune,
      bio: bio.trim(),
      avatarUrl,
      photoURL: avatarUrl,
      isProfileComplete: completeness.score === 100,
      ...(initialProfile.role === "musicien" ? {
        specialty,
        experience,
        paymentNumber: paymentNumber.trim(),
        paymentProvider
      } : {})
    };

    try {
      await gomboDB.updateUserProfile(initialProfile.uid, updates);
      setSuccess(true);
      window.dispatchEvent(new Event("gomboUserProfileChange"));
      setTimeout(() => {
        setSuccess(false);
        onSave();
      }, 1000);
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de la mise à jour finale du profil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      <div className="bg-white dark:bg-[#111113] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl">
        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <User className="w-5.5 h-5.5 text-[#D4AF37]" />
            Modifier mon Profil Gombo
          </span>
          {initialProfile.isVerified && (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
              ✓ Certifié Pro
            </span>
          )}
        </h3>

        {/* Real-time Dynamic Completeness & Autosave Status visual indicators */}
        <div className="bg-[#FAF9F5] dark:bg-[#1c1c1f]/40 p-4.5 rounded-2xl border border-[#D4AF37]/15 space-y-2 mb-6">
          <div className="flex justify-between items-center text-xs">
            <span className="font-black text-[#D4AF37] uppercase tracking-wider font-mono flex items-center gap-1">
              <span>📈</span> Complétude du Profil ({completeness.score}%)
            </span>
            {completeness.score === 100 ? (
              <span className="text-[10px] text-emerald-500 font-extrabold uppercase bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                ✓ Profil 100% Complet
              </span>
            ) : (
              <span className="text-[10px] text-amber-500 font-bold uppercase animate-pulse">
                Modifications en cours...
              </span>
            )}
          </div>
          <div className="h-2 w-full bg-gray-100/80 dark:bg-gray-800/80 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500" style={{ width: `${completeness.score}%` }} />
          </div>
          {completeness.score < 105 && (
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
              {completeness.score < 100 ? (
                <>Reste à configurer : <strong className="text-gray-900 dark:text-white">{completeness.missing.join(", ")}</strong></>
              ) : (
                <span className="text-emerald-500 font-semibold">🎉 Félicitations, profil complété ! Prêt pour débloquer de grosses opportunités.</span>
              )}
            </p>
          )}

          {/* Swithing Autosave state text badge */}
          <div className="pt-1.5 flex items-center justify-end text-[10.5px]">
            {saveStatus === "saving" && (
              <span className="text-[#D4AF37] font-black animate-pulse flex items-center gap-1 bg-[#D4AF37]/5 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-ping" />
                Sauvegarde automatique...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-emerald-500 font-black flex items-center gap-1 bg-emerald-500/5 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Modifications synchronisées en direct.
              </span>
            )}
          </div>
        </div>

        {/* Custom photo uploader & Avatar picks */}
        <div className="mb-6 space-y-4">
          <label className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
            Photo de Profil (Uploader une photo réelle)
          </label>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-[#FAF9F5] dark:bg-[#1c1c1f]/40 rounded-2xl border border-dashed border-[#D4AF37]/20">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#D4AF37] bg-gray-100 shrink-0">
              <img src={avatarUrl} alt="Aperçu" className="w-full h-full object-cover" />
              {uploading && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-[10px] font-bold text-white">
                  {Math.round(uploadProgress)}%
                </div>
              )}
            </div>
            
            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <input
                type="file"
                id="profile-photo-upload"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploading}
              />
              <label
                htmlFor="profile-photo-upload"
                className={`inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition-transform active:scale-97 ${
                  uploading ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>{uploading ? "Chargement..." : "Uploader de vraies photos"}</span>
              </label>
              <p className="text-[10px] text-gray-400">Photos de scène réelles acceptées (JPG, PNG, TIFF. Max : 4 Mo).</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Ou choisir parmi nos avatars réels :</p>
            <div className="flex flex-wrap gap-3 items-center pt-1.5">
              {AVATARS.map((url, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setAvatarUrl(url)}
                  className={`relative w-11 h-11 rounded-full overflow-hidden border-2 transition-all ${
                    avatarUrl === url ? "border-[#D4AF37] scale-105 shadow-md" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={url} alt={`Avatar ${index}`} className="w-full h-full object-cover" />
                  {avatarUrl === url && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Text Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Nom d’Artiste / de Scène *</label>
            <input
              type="text"
              required
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-55/60 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:bg-white dark:focus:bg-[#111113] dark:text-white font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Ville de Résidence *</label>
            <input
              type="text"
              required
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              className="w-full px-4 py-3 bg-gray-55/60 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:bg-white dark:focus:bg-[#111113] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Prénom *</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-55/60 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:bg-white dark:focus:bg-[#111113] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Nom de famille *</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-55/60 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:bg-white dark:focus:bg-[#111113] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Téléphone de contact *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-55/60 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:bg-white dark:focus:bg-[#111113] dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Commune d'Abidjan *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <MapPin className="w-4 h-4" />
              </span>
              <select
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-55/60 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:bg-white dark:focus:bg-[#111113] dark:text-white"
              >
                {ABIDJAN_COMMUNES.map((com) => (
                  <option key={com} value={com}>{com}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Presentation description text */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Présentation / Bio *</label>
          <div className="relative">
            <span className="absolute top-3 left-3.5 text-gray-400">
              <FileText className="w-4 h-4" />
            </span>
            <textarea
              rows={3}
              placeholder="Ex : Bassiste de live ayant accompagné de nombreux groupes, disponible pour des sessions régulières sur Marcory et Cocody..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-55/60 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:bg-white dark:focus:bg-[#111113] dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* MUSICIAN SPECIFIC FIELDS */}
      {initialProfile.role === "musicien" && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#111113] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl space-y-4"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Music className="w-5 h-5 text-[#D4AF37]" />
            Compétences Musicales & Tarification
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Spécialité Instrumentale</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <Music className="w-4 h-4" />
                </span>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-55/60 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:bg-white dark:focus:bg-[#111113] dark:text-white"
                >
                  {SPECIALTIES.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Niveau d'Expérience</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <Award className="w-4 h-4" />
                </span>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-55/60 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:bg-white dark:focus:bg-[#111113] dark:text-white"
                >
                  {EXPERIENCES.map((exp) => (
                    <option key={exp} value={exp}>{exp}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Wallet className="w-4.5 h-4.5 text-[#D4AF37]" />
              Réception des Paiements Mobiles (Wave / Orange)
            </h4>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">
              Vos coordonnées ne seront révélées qu'aux clients officiellement retenus après validation mutuelle du gombo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Réseau Préféré</label>
                <select
                  value={paymentProvider}
                  onChange={(e) => setPaymentProvider(e.target.value as PaymentProvider)}
                  className="w-full px-4 py-3 bg-gray-55/60 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:bg-white dark:focus:bg-[#111113] dark:text-white"
                >
                  <option value="Wave">Wave 🌊</option>
                  <option value="Orange Money">Orange Money 🍊</option>
                  <option value="MTN Momo">MTN MoMo 🟡</option>
                  <option value="Moov Money">Moov Money 🟢</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Numéro de Mobile Money</label>
                <input
                  type="text"
                  placeholder="Ex : 0500112233"
                  value={paymentNumber}
                  onChange={(e) => setPaymentNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-55/60 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:bg-white dark:focus:bg-[#111113] dark:text-white"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Manual Submit & Cancel bar (keeps full compatibility + visual comfort) */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3.5 mt-4 w-full">
        {success && (
          <span className="text-xs font-bold text-emerald-500 animate-pulse bg-emerald-500/10 px-4 py-2 rounded-xl">
            ✓ Profil enregistré avec succès !
          </span>
        )}
        <div className="flex gap-2.5 w-full sm:w-auto">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 sm:flex-none px-6 py-3 bg-gray-150 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 sm:flex-none px-8 py-3 bg-[#D4AF37] hover:bg-[#bfa12d] text-gray-900 font-black rounded-xl text-xs shadow-md transition-all active:scale-97 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4.5 h-4.5" />
                Démarrer Ma Session
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
