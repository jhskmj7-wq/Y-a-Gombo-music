import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  User, Phone, MapPin, Music, Award, Wallet, Send, FileText, Check, 
  Sparkles, ShieldCheck, Heart, CreditCard, Star, Radio
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMSG("");
    setLoading(true);

    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !commune) {
      setErrorMSG("Veuillez remplir les informations obligatoires (Prénom, Nom, Téléphone, Commune).");
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
          <div className="inline-flex items-center justify-center p-3 bg-orange-50 dark:bg-orange-950/20 text-[#FF7A00] rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 fill-current animate-pulse" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white uppercase">
            COMPLÉTER MON PROFIL
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto leading-relaxed">
            Bienvenue sur la plateforme showbiz de Côte d'Ivoire ! Renseignez vos infos pour débloquer votre solde, vos réservations et vos gombos.
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
                      ? "border-[#FF7A00] bg-orange-50/10 text-[#FF7A00] dark:border-[#FF7A00]"
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
            <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              2. CHOISIR VOTRE PHOTO DE PROFIL CHIC
            </label>
            <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-orange-500 shadow-inner">
                <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map((url, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                      avatarUrl === url ? "border-[#FF7A00] scale-105 shadow-md" : "border-transparent"
                    }`}
                  >
                    <img src={url} alt={`Avatar ${index}`} className="w-full h-full object-cover" />
                    {avatarUrl === url && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Check className="w-4.5 h-4.5 text-white stroke-[3px]" />
                      </div>
                    )}
                  </button>
                ))}
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
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#121214] dark:text-white"
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
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#121214] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-450 mb-1">Nom d'Artiste / Nom de Scène (e.g. Yorobo, ...) </label>
                <input
                  type="text"
                  placeholder="Laisser vide si non applicable"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#121214] dark:text-white"
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
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#121214] dark:text-white"
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
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#121214] dark:text-white"
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
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-805 rounded-xl text-sm focus:outline-none focus:ring-[#FF7A00]"
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
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-805 rounded-xl text-sm focus:outline-none focus:ring-[#FF7A00]"
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
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-805 rounded-xl text-sm focus:outline-none focus:ring-[#FF7A00]"
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
              <span className="text-[10px] font-bold bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-md uppercase">Sécurisé</span>
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
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1 flex items-center gap-1.5">
                  🍊 Numéro ORANGE MONEY
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0545891200"
                  value={orangeMoneyNumber}
                  onChange={(e) => setOrangeMoneyNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-gray-850 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-10 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold rounded-2xl shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
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
