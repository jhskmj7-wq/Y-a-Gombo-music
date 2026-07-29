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
      className="afri-container"
    >
      <div className="afri-section">
        
        {/* HEADER */}
        <div className="flex items-center justify-between gap-4">
          <button onClick={onCancel} className="afri-btn-ghost p-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="afri-title-md flex-1 text-center">Édition d'Héritage</h3>
          <div className="w-9 h-9" /> {/* Spacer */}
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
              <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                autoSaveStatus === "saving" ? "bg-amber-500/10 border-amber-500/30 text-amber-500 animate-pulse" :
                autoSaveStatus === "saved" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" :
                "bg-red-500/10 border-red-500/30 text-red-500"
              }`}>
                {autoSaveStatus === "saving" && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />}
                {autoSaveStatus === "saving" ? "Sauvegarde automatique..." : 
                 autoSaveStatus === "saved" ? "Profil synchronisé" : "Erreur de synchro"}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={onSubmit} className="space-y-6">
          
          {/* 1. MÉDIAS (AVATAR & COVER) */}
          <div className="afri-card p-6 space-y-6">
            <div className="space-y-4">
              <p className="afri-text-tiny">Couverture & Identité Visuelle</p>
              
              {/* Cover Card */}
              <div className="relative h-32 xs:h-40 rounded-2xl overflow-hidden bg-afri-bg-sec border border-afri-border">
                {coverUrl ? (
                  <img src={coverUrl} alt="" className="w-full h-full object-cover opacity-60" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700">
                    <Camera className="w-8 h-8 opacity-20" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <label className="afri-btn-primary w-auto py-2 px-4 text-[10px]">
                    {coverUploading ? `${coverUploadProgress}%` : "Changer Bannière"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCoverUpload(file);
                    }} />
                  </label>
                </div>
              </div>

              {/* Avatar Jumbo */}
              <div className="flex flex-col items-center gap-4 -mt-16 relative z-10">
                <div className="relative">
                  <div className="w-24 h-24 xs:w-28 xs:h-28 rounded-[2rem] overflow-hidden border-4 border-[#080808] bg-afri-bg-sec shadow-2xl">
                    {cameraActive ? (
                      <video id="webcam-preview" autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                    ) : (
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 bg-afri-bg/60 flex items-center justify-center rounded-[2rem]">
                      <span className="text-[10px] font-black text-[#D4AF37]">{uploadProgress}%</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {cameraActive ? (
                    <>
                      <button type="button" onClick={capturePhoto} className="afri-btn-primary py-2 px-4 text-[10px]">Prendre</button>
                      <button type="button" onClick={stopCamera} className="afri-btn-secondary py-2 px-4 text-[10px]">X</button>
                    </>
                  ) : (
                    <>
                      <label className="afri-btn-secondary w-auto py-2 px-4 text-[10px]">
                        Album
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }} />
                      </label>
                      <button type="button" onClick={startCamera} className="afri-btn-primary w-auto py-2 px-4 text-[10px]">Caméra</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. INFOS PERSONNELLES */}
          <div className="afri-card p-6 space-y-6">
            <p className="afri-text-tiny">Informations d'Artiste</p>
            
            <div className="space-y-4">
              <div className="afri-grid-2">
                <div className="space-y-1.5">
                  <label className="afri-text-tiny text-afri-text-sec">Prénom</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} className="afri-card-inset w-full p-3 text-xs font-bold text-afri-text outline-none focus:border-[#D4AF37]/40" />
                </div>
                <div className="space-y-1.5">
                  <label className="afri-text-tiny text-afri-text-sec">Nom</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} className="afri-card-inset w-full p-3 text-xs font-bold text-afri-text outline-none focus:border-[#D4AF37]/40" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="afri-text-tiny text-afri-text-sec">Nom de Scène</label>
                <input value={artistName} onChange={e => setArtistName(e.target.value)} className="afri-card-inset w-full p-3 text-xs font-black text-[#D4AF37] outline-none focus:border-[#D4AF37]/40" placeholder="Votre blaze..." />
              </div>

              <div className="afri-grid-2">
                <div className="space-y-1.5">
                  <label className="afri-text-tiny text-afri-text-sec">Téléphone</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} className="afri-card-inset w-full p-3 text-xs font-bold text-afri-text outline-none focus:border-[#D4AF37]/40" />
                </div>
                <div className="space-y-1.5">
                  <label className="afri-text-tiny text-afri-text-sec">WhatsApp</label>
                  <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="afri-card-inset w-full p-3 text-xs font-bold text-afri-text outline-none focus:border-[#D4AF37]/40" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="afri-text-tiny text-afri-text-sec">Ma Biographie</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="afri-card-inset w-full p-3 text-xs font-medium text-afri-text outline-none focus:border-[#D4AF37]/40 resize-none" placeholder="Présentez-vous au showbiz..." />
              </div>
            </div>
          </div>

          {/* 3. LOCALISATION */}
          <div className="afri-card p-6 space-y-4">
            <p className="afri-text-tiny">Zone d'Activité</p>
            <div className="afri-grid-2">
              <div className="space-y-1.5">
                <label className="afri-text-tiny text-afri-text-sec">Ville</label>
                <input value={ville} onChange={e => setVille(e.target.value)} className="afri-card-inset w-full p-3 text-xs font-bold text-afri-text outline-none" />
              </div>
              <div className="relative space-y-1.5">
                <label className="afri-text-tiny text-afri-text-sec">Commune</label>
                <button type="button" onClick={() => setShowCommuneDropdown(!showCommuneDropdown)} className="afri-card-inset w-full p-3 text-xs font-black text-afri-text flex items-center justify-between">
                  <span>{commune || "Choisir"}</span>
                  <ChevronDown className="w-4 h-4 text-[#D4AF37]" />
                </button>
                {showCommuneDropdown && (
                  <div className="absolute z-20 left-0 right-0 mt-1 afri-card p-2 max-h-40 overflow-y-auto space-y-1">
                    {filteredCommunes.map(c => (
                      <button key={c} type="button" onClick={() => { setCommune(c); setShowCommuneDropdown(false); }} className="w-full text-left p-2 rounded-xl text-xs font-bold hover:bg-afri-bg-sec/10 text-afri-text-sec hover:text-afri-text">
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="afri-text-tiny text-afri-text-sec">Quartier</label>
              <input value={quartier} onChange={e => setQuartier(e.target.value)} className="afri-card-inset w-full p-3 text-xs font-bold text-afri-text outline-none" />
            </div>
          </div>

          {/* 4. MUSIQUE & TALENTS */}
          <div className="afri-card p-6 space-y-6">
            <p className="afri-text-tiny">Identité Musicale & Profil Showbiz</p>
            
            <div className="space-y-6">
              {/* Spécialités */}
              <div className="space-y-2">
                <label className="afri-text-tiny text-afri-text-sec">Spécialités</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES_LIST.map(spec => {
                    const active = specialties.includes(spec);
                    return (
                      <button key={spec} type="button" onClick={() => active ? setSpecialties(specialties.filter(s => s !== spec)) : setSpecialties([...specialties, spec])} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${active ? "bg-afri-bg-sec border-[#D4AF37] text-black" : "bg-white/5 border-afri-border text-afri-text-sec"}`}>
                        {spec}
                      </button>
                    );
                  })}
                </div>
                {specialties.includes("Autre spécialité") && (
                  <div className="mt-2 space-y-1">
                    <label className="text-[10px] font-extrabold text-[#D4AF37] uppercase">Précisez votre spécialité</label>
                    <input 
                      value={specialtyCustom} 
                      onChange={e => setSpecialtyCustom(e.target.value)} 
                      className="afri-card-inset w-full p-3 text-xs font-bold text-afri-text outline-none focus:border-[#D4AF37]/40" 
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
                      <button key={inst} type="button" onClick={() => active ? setInstruments(instruments.filter(i => i !== inst)) : setInstruments([...instruments, inst])} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${active ? "bg-afri-bg-sec border-[#D4AF37] text-black" : "bg-white/5 border-afri-border text-afri-text-sec"}`}>
                        {inst}
                      </button>
                    );
                  })}
                </div>
                {instruments.includes("Autre instrument") && (
                  <div className="mt-2 space-y-1">
                    <label className="text-[10px] font-extrabold text-[#D4AF37] uppercase">Précisez votre instrument</label>
                    <input 
                      value={instrumentCustom} 
                      onChange={e => setInstrumentCustom(e.target.value)} 
                      className="afri-card-inset w-full p-3 text-xs font-bold text-afri-text outline-none focus:border-[#D4AF37]/40" 
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
                      <button key={gen} type="button" onClick={() => active ? setMusicGenres(musicGenres.filter(g => g !== gen)) : setMusicGenres([...musicGenres, gen])} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${active ? "bg-amber-500 border-amber-500 text-afri-text" : "bg-white/5 border-afri-border text-afri-text-sec"}`}>
                        {gen}
                      </button>
                    );
                  })}
                </div>
                {musicGenres.includes("Autre style") && (
                  <div className="mt-2 space-y-1">
                    <label className="text-[10px] font-extrabold text-[#D4AF37] uppercase">Précisez votre style musical</label>
                    <input 
                      value={musicGenreCustom} 
                      onChange={e => setMusicGenreCustom(e.target.value)} 
                      className="afri-card-inset w-full p-3 text-xs font-bold text-afri-text outline-none focus:border-[#D4AF37]/40" 
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
                      <button key={exp} type="button" onClick={() => setExperience(exp)} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${active ? "bg-[#D4AF37] border-[#D4AF37] text-black" : "bg-white/5 border-afri-border text-afri-text-sec"}`}>
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
                      <button key={avail} type="button" onClick={() => active ? setAvailabilities(availabilities.filter(a => a !== avail)) : setAvailabilities([...availabilities, avail])} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${active ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white/5 border-afri-border text-afri-text-sec"}`}>
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
                      <button key={lang} type="button" onClick={() => active ? setLanguages(languages.filter(l => l !== lang)) : setLanguages([...languages, lang])} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${active ? "bg-afri-bg-sec border-[#D4AF37] text-black" : "bg-white/5 border-afri-border text-afri-text-sec"}`}>
                        {lang}
                      </button>
                    );
                  })}
                </div>
                {languages.includes("Autre langue") && (
                  <div className="mt-2 space-y-1">
                    <label className="text-[10px] font-extrabold text-[#D4AF37] uppercase">Précisez votre langue</label>
                    <input 
                      value={languageCustom} 
                      onChange={e => setLanguageCustom(e.target.value)} 
                      className="afri-card-inset w-full p-3 text-xs font-bold text-afri-text outline-none focus:border-[#D4AF37]/40" 
                      placeholder="Saisissez votre langue custom..." 
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 5. VÉRIFICATION (KYC) */}
          <div className="afri-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="afri-text-tiny">Sécurité Afritrust</p>
              {kycStatus === "approved" && <div className="afri-badge afri-badge-gold">Vérifié</div>}
            </div>
            
            <div className="afri-card-inset space-y-3">
              <p className="text-[10px] text-afri-text-sec leading-relaxed">Téléchargez une pièce d'identité pour certifier votre héritage musical.</p>
              {verifyingIdentity ? (
                <div className="space-y-2">
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-afri-bg-sec" style={{ width: `${kycProgress}%` }} />
                  </div>
                  <p className="text-[9px] font-black text-center text-[#D4AF37] animate-pulse">ENVOI EN COURS...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <label className="afri-btn-secondary py-2 text-[10px] w-full flex items-center justify-center gap-2">
                    <Upload className="w-3 h-3" />
                    Album
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onIdentityUpload(f); }} />
                  </label>
                  <button type="button" onClick={startCamera} className="afri-btn-secondary py-2 text-[10px] w-full flex items-center justify-center gap-2">
                    <Camera className="w-3 h-3" />
                    Caméra
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ACTIONS FINAL */}
          <div className="grid grid-cols-1 gap-3 pt-4">
            <button type="submit" disabled={editLoading} className="afri-btn-primary py-4">
              {editLoading ? "Synchronisation..." : "Enregistrer les modifications"}
            </button>
            <button type="button" onClick={onCancel} className="afri-btn-secondary py-4">
              Fermer sans enregistrer
            </button>
          </div>

        </form>
      </div>
    </motion.div>
  );
};
