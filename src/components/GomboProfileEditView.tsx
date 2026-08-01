import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Check, Plus, Search, ChevronDown, Camera, Upload, 
  ShieldCheck, ArrowLeft, Save, X
} from "lucide-react";

interface GomboProfileEditViewProps {
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  artistName: string;
  setArtistName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  whatsapp: string;
  setWhatsapp: (val: string) => void;
  gender: string;
  setGender: (val: string) => void;
  birthDate: string;
  setBirthDate: (val: string) => void;
  commune: string;
  setCommune: (val: string) => void;
  ville: string;
  setVille: (val: string) => void;
  quartier: string;
  setQuartier: (val: string) => void;
  accountRole: string;
  setAccountRole: (val: string) => void;
  bio: string;
  setBio: (val: string) => void;
  specialties: string[];
  setSpecialties: (val: string[]) => void;
  musicGenres: string[];
  setMusicGenres: (val: string[]) => void;
  experience: string;
  setExperience: (val: string) => void;
  availabilities: string[];
  setAvailabilities: (val: string[]) => void;
  instruments: string[];
  setInstruments: (val: string[]) => void;
  languages: string[];
  setLanguages: (val: string[]) => void;
  musicGenreCustom: string;
  setMusicGenreCustom: (val: string) => void;
  instrumentCustom: string;
  setInstrumentCustom: (val: string) => void;
  specialtyCustom: string;
  setSpecialtyCustom: (val: string) => void;
  languageCustom: string;
  setLanguageCustom: (val: string) => void;
  waveNumber: string;
  setWaveNumber: (val: string) => void;
  orangeMoneyNumber: string;
  setOrangeMoneyNumber: (val: string) => void;
  editLoading: boolean;
  editError: string;
  editSuccess: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  avatarUrl: string;
  setAvatarUrl: (val: string) => void;
  cameraActive: boolean;
  setCameraActive: (val: boolean) => void;
  uploading: boolean;
  uploadProgress: number;
  capturePhoto: () => void;
  stopCamera: () => void;
  startCamera: () => void;
  handleFileUpload: (file: File) => void;
  coverUrl: string;
  setCoverUrl: (val: string) => void;
  handleCoverUpload: (file: File) => void;
  coverUploading: boolean;
  coverUploadProgress: number;
  onSkip?: () => void;
  autoSaveStatus?: "idle" | "saving" | "saved" | "error";
  kycStatus?: "pending" | "approved" | "rejected" | "none" | "info_required";
  onIdentityUpload: (file: File) => void;
  verifyingIdentity: boolean;
  kycProgress: number;
}

const COMMUNES = [
  "Cocody", "Plateau", "Abobo", "Adjamé", "Yopougon", 
  "Treichville", "Koumassi", "Marcory", "Port-Bouët"
];

const EXPERIENCES = ["Débutant", "Intermédiaire", "Confirmé", "Professionnel", "Expert"];

const SPECIALTIES_LIST = [
  "Chant", "Piano", "Batterie", "Guitare", "Basse", "DJ", 
  "Choriste", "Saxophone", "Trompette", "Violon", "Arrangeur", "Producteur",
  "Chanteur", "Chanteuse", "Pianiste", "Guitariste", "Bassiste", "Batteur",
  "Percussionniste", "Beatmaker", "Compositeur", "Auteur", "Ingénieur son",
  "Mixage", "Mastering", "Chef de chœur", "Chef d'orchestre", "Coach vocal",
  "Danseur", "Animateur", "Présentateur", "Humoriste", "Technicien lumière",
  "Technicien vidéo", "Autre spécialité"
];

const GENRES_LIST = [
  "Coupé-Décalé", "Zouglou", "Gbagba", "Jazz", "Reggae", 
  "Afrobeat", "R&B / Soul", "Hip-Hop", "Rap Ivoire", 
  "Musique Chrétienne", "Variété", "Zouk", "Rumba Congolaise",
  "Gospel", "Chant chorale", "Louange", "Adoration", "Afro Gospel",
  "Mapouka", "Ziglibithy", "Dancehall", "Rap", "Drill", "RnB", "Soul",
  "Blues", "Funk", "Rock", "Pop", "Salsa", "Kompa", "Makossa", "Highlife",
  "Amapiano", "House", "Électro", "Traditionnel", "Musique mandingue",
  "Musique baoulé", "Musique bété", "Musique sénoufo", "Musique religieuse",
  "Musique classique", "Musique de film", "DJ", "Autre style"
];

const INSTRUMENTS_LIST = [
  "Piano", "Clavier", "Guitare acoustique", "Guitare électrique", "Guitare basse",
  "Batterie", "Percussions", "Djembé", "Balafon", "Kora", "Violon", "Alto",
  "Violoncelle", "Saxophone", "Trompette", "Trombone", "Flûte", "Clarinette",
  "Harmonica", "Accordéon", "DJ Controller", "MAO", "Beatmaker", "Autre instrument"
];

const AVAILABILITIES_LIST = [
  "Disponible aujourd'hui", "Disponible ce week-end", "Disponible en semaine",
  "Disponible sur réservation", "Disponible immédiatement"
];

const LANGUAGES_LIST = [
  "Français", "Anglais", "Baoulé", "Dioula", "Bété", "Agni", "Attié",
  "Yacouba", "Sénoufo", "Autre langue"
];

export const GomboProfileEditView: React.FC<GomboProfileEditViewProps> = ({
  firstName, setFirstName,
  lastName, setLastName,
  artistName, setArtistName,
  phone, setPhone,
  whatsapp, setWhatsapp,
  gender, setGender,
  birthDate, setBirthDate,
  commune, setCommune,
  ville, setVille,
  quartier, setQuartier,
  accountRole, setAccountRole,
  bio, setBio,
  specialties, setSpecialties,
  musicGenres, setMusicGenres,
  experience, setExperience,
  availabilities, setAvailabilities,
  instruments, setInstruments,
  languages, setLanguages,
  musicGenreCustom, setMusicGenreCustom,
  instrumentCustom, setInstrumentCustom,
  specialtyCustom, setSpecialtyCustom,
  languageCustom, setLanguageCustom,
  waveNumber, setWaveNumber,
  orangeMoneyNumber, setOrangeMoneyNumber,
  editLoading, editError, editSuccess,
  onSubmit, onCancel,
  avatarUrl,
  cameraActive,
  uploading, uploadProgress,
  capturePhoto, stopCamera, startCamera,
  handleFileUpload,
  coverUrl, handleCoverUpload, coverUploading, coverUploadProgress,
  autoSaveStatus = "idle",
  kycStatus = "none",
  onIdentityUpload,
  verifyingIdentity,
  kycProgress
}) => {
  const [communeSearch, setCommuneSearch] = useState("");
  const [showCommuneDropdown, setShowCommuneDropdown] = useState(false);

  const filteredCommunes = COMMUNES.filter(c => 
    c.toLowerCase().includes(communeSearch.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-full space-y-6 pb-24 px-3 xs:px-4"
    >
      <div className="pt-3 pb-16 sm:pb-20 space-y-6 w-full max-w-full">
        
        {/* HEADER */}
        <div className="flex items-center justify-between gap-4">
          <button onClick={onCancel} className="afri-btn-ghost p-3 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl" id="profile-edit-back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="afri-title-md flex-1 text-center truncate font-black text-sm" id="profile-edit-title">Édition d'Héritage</h3>
          <div className="w-12 h-12" /> {/* Spacer */}
        </div>

        {/* STATUS BAR */}
        <AnimatePresence>
          {autoSaveStatus !== "idle" && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-center"
            >
              <div className={`px-4 py-2.5 rounded-full border text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg ${
                autoSaveStatus === "saving" ? "bg-amber-500/10 border-amber-500/30 text-amber-500 animate-pulse" :
                autoSaveStatus === "saved" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" :
                "bg-red-500/10 border-red-500/30 text-red-500"
              }`}>
                {autoSaveStatus === "saving" && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />}
                {autoSaveStatus === "saving" ? "Sauvegarde automatique..." : 
                 autoSaveStatus === "saved" ? "Profil synchronisé" : "Erreur de synchro"}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={onSubmit} className="space-y-6">
          
          {/* 1. MÉDIAS (AVATAR & COVER) ANDROID FIRST */}
          <div className="afri-card p-4 sm:p-6 space-y-6 overflow-hidden">
            <div className="space-y-4">
              <p className="afri-text-tiny uppercase tracking-widest text-[#D4AF37]">Couverture & Identité Visuelle</p>
              
              {/* Cover Card */}
              <div className="relative h-36 sm:h-44 rounded-2xl overflow-hidden bg-afri-bg-sec border border-afri-border shadow-inner">
                {coverUrl ? (
                  <img src={coverUrl} alt="Bannière" className="w-full h-full object-cover opacity-80" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-gradient-to-r from-amber-500/10 via-zinc-900 to-[#D4AF37]/10">
                    <Camera className="w-8 h-8 opacity-30 text-[#D4AF37]" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-afri-bg/40 backdrop-blur-[2px]">
                  <label id="change-banner-label" className="afri-btn-primary w-auto py-3 px-6 text-xs font-bold min-h-[48px] flex items-center gap-2 cursor-pointer shadow-xl rounded-xl">
                    <Upload className="w-4 h-4" />
                    <span>{coverUploading ? `${coverUploadProgress}%` : "Changer Bannière"}</span>
                    <input id="change-banner-input" type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCoverUpload(file);
                    }} />
                  </label>
                </div>
              </div>

              {/* Avatar Jumbo Android Optimized */}
              <div className="flex flex-col items-center gap-4 -mt-16 sm:-mt-18 relative z-10">
                <div className="relative">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[2.5rem] overflow-hidden border-4 border-[#080808] bg-afri-bg-sec shadow-2xl">
                    {cameraActive ? (
                      <video id="webcam-preview" autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                    ) : (
                      <img src={avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"} alt="Avatar" className="w-full h-full object-cover" />
                    )}
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 bg-afri-bg/75 flex items-center justify-center rounded-[2.5rem]">
                      <span className="text-xs font-black text-[#D4AF37]">{uploadProgress}%</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5 w-full">
                  {cameraActive ? (
                    <>
                      <button id="btn-capture-photo" type="button" onClick={capturePhoto} className="afri-btn-primary py-3 px-6 text-xs font-bold min-h-[48px] flex items-center gap-2 shadow-md rounded-xl">
                        <Camera className="w-4 h-4" /> Prendre
                      </button>
                      <button id="btn-stop-camera" type="button" onClick={stopCamera} className="afri-btn-secondary py-3 px-5 text-xs font-bold min-h-[48px] flex items-center justify-center shadow-md rounded-xl">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <label id="btn-upload-album" className="afri-btn-secondary py-3 px-6 text-xs font-bold min-h-[48px] flex items-center gap-2 cursor-pointer shadow-md rounded-xl">
                        <Upload className="w-4 h-4" />
                        <span>Album</span>
                        <input id="input-upload-album" type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }} />
                      </label>
                      <button id="btn-start-camera" type="button" onClick={startCamera} className="afri-btn-primary py-3 px-6 text-xs font-bold min-h-[48px] flex items-center gap-2 shadow-md rounded-xl">
                        <Camera className="w-4 h-4" /> Caméra
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. INFOS PERSONNELLES */}
          <div className="afri-card p-4 sm:p-6 space-y-6">
            <p className="afri-text-tiny uppercase tracking-widest text-[#D4AF37]">Informations d'Artiste</p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3.5 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="afri-text-tiny text-afri-text-sec">Prénom</label>
                  <input id="input-first-name" value={firstName} onChange={e => setFirstName(e.target.value)} className="afri-card-inset w-full p-3.5 text-sm font-bold text-afri-text outline-none focus:border-[#D4AF37]/40" />
                </div>
                <div className="space-y-1.5">
                  <label className="afri-text-tiny text-afri-text-sec">Nom</label>
                  <input id="input-last-name" value={lastName} onChange={e => setLastName(e.target.value)} className="afri-card-inset w-full p-3.5 text-sm font-bold text-afri-text outline-none focus:border-[#D4AF37]/40" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="afri-text-tiny text-afri-text-sec">Nom de Scène</label>
                <input id="input-artist-name" value={artistName} onChange={e => setArtistName(e.target.value)} className="afri-card-inset w-full p-3.5 text-sm font-black text-[#D4AF37] outline-none focus:border-[#D4AF37]/40" placeholder="Votre blaze..." />
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3.5 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="afri-text-tiny text-afri-text-sec">Téléphone</label>
                  <input id="input-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="afri-card-inset w-full p-3.5 text-sm font-bold text-afri-text outline-none focus:border-[#D4AF37]/40" />
                </div>
                <div className="space-y-1.5">
                  <label className="afri-text-tiny text-afri-text-sec">WhatsApp</label>
                  <input id="input-whatsapp" type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="afri-card-inset w-full p-3.5 text-sm font-bold text-afri-text outline-none focus:border-[#D4AF37]/40" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="afri-text-tiny text-afri-text-sec">Ma Biographie</label>
                <textarea id="input-bio" value={bio} onChange={e => setBio(e.target.value)} rows={3} className="afri-card-inset w-full p-3.5 text-sm font-medium text-afri-text outline-none focus:border-[#D4AF37]/40 resize-none" placeholder="Présentez-vous au showbiz..." />
              </div>
            </div>
          </div>

          {/* 3. LOCALISATION */}
          <div className="afri-card p-4 sm:p-6 space-y-4">
            <p className="afri-text-tiny uppercase tracking-widest text-[#D4AF37]">Zone d'Activité</p>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="space-y-1.5">
                <label className="afri-text-tiny text-afri-text-sec">Ville</label>
                <input id="input-ville" value={ville} onChange={e => setVille(e.target.value)} className="afri-card-inset w-full p-3.5 text-sm font-bold text-afri-text outline-none focus:border-[#D4AF37]/40" />
              </div>
              <div className="space-y-1.5">
                <label className="afri-text-tiny text-afri-text-sec">Commune</label>
                <div className="relative">
                  <select 
                    id="select-commune"
                    value={commune} 
                    onChange={e => setCommune(e.target.value)} 
                    className="afri-card-inset w-full p-3.5 text-sm font-black text-afri-text appearance-none bg-transparent outline-none pr-10 cursor-pointer focus:border-[#D4AF37]/40"
                  >
                    <option value="" className="bg-afri-bg-sec text-afri-text">Choisir une commune</option>
                    {COMMUNES.map(c => (
                      <option key={c} value={c} className="bg-afri-bg-sec text-afri-text">
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#D4AF37] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="afri-text-tiny text-afri-text-sec">Quartier</label>
              <input id="input-quartier" value={quartier} onChange={e => setQuartier(e.target.value)} className="afri-card-inset w-full p-3.5 text-sm font-bold text-afri-text outline-none focus:border-[#D4AF37]/40" />
            </div>
          </div>

          {/* 4. MUSIQUE & TALENTS */}
          <div className="afri-card p-4 sm:p-6 space-y-6">
            <p className="afri-text-tiny uppercase tracking-widest text-[#D4AF37]">Identité Musicale & Profil Showbiz</p>
            
            <div className="space-y-6">
              {/* Spécialités */}
              <div className="space-y-2">
                <label className="afri-text-tiny text-afri-text-sec">Spécialités</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES_LIST.map(spec => {
                    const active = specialties.includes(spec);
                    return (
                      <button key={spec} type="button" onClick={() => active ? setSpecialties(specialties.filter(s => s !== spec)) : setSpecialties([...specialties, spec])} className={`px-3.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border inline-flex items-center justify-center min-h-[40px] ${active ? "bg-afri-bg-sec border-[#D4AF37] text-black" : "bg-white/5 border-afri-border text-afri-text-sec"}`}>
                        {spec}
                      </button>
                    );
                  })}
                </div>
                {specialties.includes("Autre spécialité") && (
                  <div className="mt-2 space-y-1">
                    <label className="text-[10px] font-extrabold text-[#D4AF37] uppercase">Précisez votre spécialité</label>
                    <input 
                      id="input-specialty-custom"
                      value={specialtyCustom} 
                      onChange={e => setSpecialtyCustom(e.target.value)} 
                      className="afri-card-inset w-full p-3.5 text-sm font-bold text-afri-text outline-none focus:border-[#D4AF37]/40" 
                      placeholder="Saisissez votre spécialité custom..." 
                    />
                  </div>
                )}
              </div>

              {/* Instruments */}
              <div className="space-y-2">
                <label className="afri-text-tiny text-afri-text-sec">Instruments</label>
                <div className="flex flex-wrap gap-2">
                  {INSTRUMENTS_LIST.map(inst => {
                    const active = instruments.includes(inst);
                    return (
                      <button key={inst} type="button" onClick={() => active ? setInstruments(instruments.filter(i => i !== inst)) : setInstruments([...instruments, inst])} className={`px-3.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border inline-flex items-center justify-center min-h-[40px] ${active ? "bg-afri-bg-sec border-[#D4AF37] text-black" : "bg-white/5 border-afri-border text-afri-text-sec"}`}>
                        {inst}
                      </button>
                    );
                  })}
                </div>
                {instruments.includes("Autre instrument") && (
                  <div className="mt-2 space-y-1">
                    <label className="text-[10px] font-extrabold text-[#D4AF37] uppercase">Précisez votre instrument</label>
                    <input 
                      id="input-instrument-custom"
                      value={instrumentCustom} 
                      onChange={e => setInstrumentCustom(e.target.value)} 
                      className="afri-card-inset w-full p-3.5 text-sm font-bold text-afri-text outline-none focus:border-[#D4AF37]/40" 
                      placeholder="Saisissez votre instrument custom..." 
                    />
                  </div>
                )}
              </div>

              {/* Styles Musicaux */}
              <div className="space-y-2">
                <label className="afri-text-tiny text-afri-text-sec">Styles Musicaux</label>
                <div className="flex flex-wrap gap-2">
                  {GENRES_LIST.map(gen => {
                    const active = musicGenres.includes(gen);
                    return (
                      <button key={gen} type="button" onClick={() => active ? setMusicGenres(musicGenres.filter(g => g !== gen)) : setMusicGenres([...musicGenres, gen])} className={`px-3.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border inline-flex items-center justify-center min-h-[40px] ${active ? "bg-amber-500 border-amber-500 text-afri-text" : "bg-white/5 border-afri-border text-afri-text-sec"}`}>
                        {gen}
                      </button>
                    );
                  })}
                </div>
                {musicGenres.includes("Autre style") && (
                  <div className="mt-2 space-y-1">
                    <label className="text-[10px] font-extrabold text-[#D4AF37] uppercase">Précisez votre style musical</label>
                    <input 
                      id="input-genre-custom"
                      value={musicGenreCustom} 
                      onChange={e => setMusicGenreCustom(e.target.value)} 
                      className="afri-card-inset w-full p-3.5 text-sm font-bold text-afri-text outline-none focus:border-[#D4AF37]/40" 
                      placeholder="Saisissez votre style custom..." 
                    />
                  </div>
                )}
              </div>

              {/* Niveau d'Expérience */}
              <div className="space-y-2">
                <label className="afri-text-tiny text-afri-text-sec">Niveau d'Expérience</label>
                <div className="flex flex-wrap gap-2">
                  {EXPERIENCES.map(exp => {
                    const active = experience === exp;
                    return (
                      <button key={exp} type="button" onClick={() => setExperience(exp)} className={`px-3.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border inline-flex items-center justify-center min-h-[40px] ${active ? "bg-[#D4AF37] border-[#D4AF37] text-black" : "bg-white/5 border-afri-border text-afri-text-sec"}`}>
                        {exp}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Disponibilités */}
              <div className="space-y-2">
                <label className="afri-text-tiny text-afri-text-sec">Disponibilité</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABILITIES_LIST.map(avail => {
                    const active = availabilities.includes(avail);
                    return (
                      <button key={avail} type="button" onClick={() => active ? setAvailabilities(availabilities.filter(a => a !== avail)) : setAvailabilities([...availabilities, avail])} className={`px-3.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border inline-flex items-center justify-center min-h-[40px] ${active ? "bg-emerald-600 border-emerald-600 text-afri-text" : "bg-white/5 border-afri-border text-afri-text-sec"}`}>
                        {avail}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Langues */}
              <div className="space-y-2">
                <label className="afri-text-tiny text-afri-text-sec">Langues parlées</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES_LIST.map(lang => {
                    const active = languages.includes(lang);
                    return (
                      <button key={lang} type="button" onClick={() => active ? setLanguages(languages.filter(l => l !== lang)) : setLanguages([...languages, lang])} className={`px-3.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border inline-flex items-center justify-center min-h-[40px] ${active ? "bg-afri-bg-sec border-[#D4AF37] text-black" : "bg-white/5 border-afri-border text-afri-text-sec"}`}>
                        {lang}
                      </button>
                    );
                  })}
                </div>
                {languages.includes("Autre langue") && (
                  <div className="mt-2 space-y-1">
                    <label className="text-[10px] font-extrabold text-[#D4AF37] uppercase">Précisez votre langue</label>
                    <input 
                      id="input-language-custom"
                      value={languageCustom} 
                      onChange={e => setLanguageCustom(e.target.value)} 
                      className="afri-card-inset w-full p-3.5 text-sm font-bold text-afri-text outline-none focus:border-[#D4AF37]/40" 
                      placeholder="Saisissez votre langue custom..." 
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 5. VÉRIFICATION (KYC) */}
          <div className="afri-card p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="afri-text-tiny uppercase tracking-widest text-[#D4AF37]">Sécurité Afritrust</p>
              {kycStatus === "approved" && <div className="afri-badge afri-badge-gold">Vérifié</div>}
            </div>
            
            <div className="afri-card-inset space-y-3">
              <p className="text-[10px] text-afri-text-sec leading-relaxed">Téléchargez une pièce d'identité pour certifier votre héritage musical.</p>
              {verifyingIdentity ? (
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-afri-bg-sec" style={{ width: `${kycProgress}%` }} />
                  </div>
                  <p className="text-[9px] font-black text-center text-[#D4AF37] animate-pulse uppercase tracking-widest">ENVOI EN COURS...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <label id="btn-kyc-album" className="afri-btn-secondary py-3 px-4 text-xs font-bold min-h-[48px] w-full flex items-center justify-center gap-2 rounded-xl cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Album
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onIdentityUpload(f); }} />
                  </label>
                  <button id="btn-kyc-camera" type="button" onClick={startCamera} className="afri-btn-secondary py-3 px-4 text-xs font-bold min-h-[48px] w-full flex items-center justify-center gap-2 rounded-xl">
                    <Camera className="w-4 h-4" />
                    Caméra
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ACTIONS FINAL */}
          <div className="grid grid-cols-1 gap-3 pt-4">
            <button id="btn-profile-submit" type="submit" disabled={editLoading} className="afri-btn-primary py-3.5 min-h-[52px] text-sm font-black uppercase tracking-wider rounded-xl">
              {editLoading ? "Synchronisation..." : "Enregistrer les modifications"}
            </button>
            <button id="btn-profile-cancel" type="button" onClick={onCancel} className="afri-btn-secondary py-3.5 min-h-[52px] text-sm font-black uppercase tracking-wider rounded-xl">
              Fermer sans enregistrer
            </button>
          </div>

        </form>
      </div>
    </motion.div>
  );
};
