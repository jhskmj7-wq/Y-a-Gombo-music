import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { User, Phone, MapPin, Music, Award, Wallet, Send, FileText, Check, Camera } from "lucide-react";
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
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert("La taille du fichier ne doit pas dépasser 4 Mo.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const path = `profiles/${initialProfile.uid}/${Date.now()}_${file.name}`;
      const downloadUrl = await gomboDB.uploadFile(path, file, (pct) => {
        setUploadProgress(pct);
      });
      setAvatarUrl(downloadUrl);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Une erreur est survenue lors du téléchargement de la photo.");
    } finally {
      setUploading(false);
    }
  };
  
  // Musicians fields only
  const [specialty, setSpecialty] = useState(initialProfile.specialty || SPECIALTIES[0]);
  const [experience, setExperience] = useState(initialProfile.experience || EXPERIENCES[0]);
  const [paymentNumber, setPaymentNumber] = useState(initialProfile.paymentNumber || "");
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>(initialProfile.paymentProvider || "Wave");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      setTimeout(() => {
        setSuccess(false);
        onSave();
      }, 1200);
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de la mise à jour profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-[#1e1e24] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-md">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <User className="w-5.5 h-5.5 text-orange-500" />
          Modifier mon Profil Gombo
        </h3>

        {/* Avatar custom choice list */}
        <div className="mb-6 space-y-4">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
            Photo de Profil (Uploader votre photo ou choisir un avatar)
          </label>
          
          {/* Custom Photo Uploader */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-orange-500 bg-gray-100 shrink-0">
              <img src={avatarUrl} alt="Aperçu" className="w-full h-full object-cover" />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] font-bold text-white">
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
                <span>{uploading ? "Upload en cours..." : "Uploader ma photo"}</span>
              </label>
              <p className="text-[10px] text-gray-400">Fichiers acceptés : PNG, JPG, JPEG (Max : 4 Mo)</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center pt-2">
            {AVATARS.map((url, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setAvatarUrl(url)}
                className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                  avatarUrl === url ? "border-orange-500 scale-105 shadow-md" : "border-transparent opacity-80 hover:opacity-100"
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

        {/* Text Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Nom d’Artiste / de Scène</label>
            <input
              type="text"
              required
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Ville de Résidence</label>
            <input
              type="text"
              required
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Prénom</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Nom de famille</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Téléphone de contact</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Commune d'Abidjan</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <MapPin className="w-4 h-4" />
              </span>
              <select
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
              >
                {ABIDJAN_COMMUNES.map((com) => (
                  <option key={com} value={com}>{com}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Ma présentation (Bio / Expériences phares)</label>
          <div className="relative">
            <span className="absolute top-3 left-3.5 text-gray-400">
              <FileText className="w-4 h-4" />
            </span>
            <textarea
              rows={3}
              placeholder="Présentez-vous aux musiciens ou aux clients. e.g. 'Gérant de boîte de nuit recherchant du live tous les vendredis...' ou 'Batteur polyvalent ayant accompagné Soum Bill...'"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* MUSICIAN SPECIFIC FIELDS */}
      {initialProfile.role === "musicien" && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1e1e24] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-md space-y-4"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Music className="w-5 h-5 text-orange-500" />
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
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
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
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
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
              <Wallet className="w-4.5 h-4.5 text-orange-500" />
              Réception des Paiement Showbiz Mobiles (Wave / Orange)
            </h4>
            <p className="text-xs text-gray-450 mb-3 leading-relaxed">
              Vos coordonnées Mobile Money ne seront divulguées qu'au client final une fois la prestation officiellement validée ("Réservée").
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Réseau Préféré</label>
                <select
                  value={paymentProvider}
                  onChange={(e) => setPaymentProvider(e.target.value as PaymentProvider)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
                >
                  <option value="Wave">Wave 🌊</option>
                  <option value="Orange Money">Orange Money 🍊</option>
                  <option value="MTN Momo">MTN MoMo 🟡</option>
                  <option value="Moov Money">Moov Money 🟢</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Numéro de transfert</label>
                <input
                  type="text"
                  placeholder="e.g. 0512345678"
                  value={paymentNumber}
                  onChange={(e) => setPaymentNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-4 w-full">
        {success && (
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
            🎉 Profil mis à jour avec succès !
          </span>
        )}
        <div className="flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-all"
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-98 flex items-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : success ? (
              "Enregistré !"
            ) : (
              <>
                <Check className="w-4.5 h-4.5" />
                Sauvegarder mon profil
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
