import React, { useState } from "react";
import { motion } from "motion/react";
import { User, Check, Plus, Search, ChevronDown, Camera, Upload } from "lucide-react";

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
  autoSaveStatus?: "idle" | "saving" | "saved" | "error";
}

const COMMUNES = [
  "Cocody", "Plateau", "Abobo", "Adjamé", "Yopougon", 
  "Treichville", "Koumassi", "Marcory", "Port-Bouët"
];

const EXPERIENCES = ["Débutant", "Intermédiaire", "Confirmé", "Professionnel"];

const SPECIALTIES_LIST = [
  "Chant", "Piano", "Batterie", "Guitare", "Basse", "DJ", 
  "Choriste", "Saxophone", "Trompette", "Violon", 
  "Arrangeur", "Producteur"
];

const GENRES_LIST = [
  "Coupé-Décalé", "Zouglou", "Gbagba", "Jazz", "Reggae", 
  "Afrobeat", "R&B / Soul", "Hip-Hop", "Rap Ivoire", 
  "Musique Chrétienne", "Variété", "Zouk", "Rumba Congolaise"
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
  waveNumber, setWaveNumber,
  orangeMoneyNumber, setOrangeMoneyNumber,
  editLoading, editError, editSuccess,
  onSubmit, onCancel,
  avatarUrl, setAvatarUrl,
  cameraActive, setCameraActive,
  uploading, uploadProgress,
  capturePhoto, stopCamera, startCamera,
  handleFileUpload,
  autoSaveStatus = "idle"
}) => {
  const [communeSearch, setCommuneSearch] = useState("");
  const [showCommuneDropdown, setShowCommuneDropdown] = useState(false);
  const [freeSpecialty, setFreeSpecialty] = useState("");
  const [freeGenre, setFreeGenre] = useState("");

  const filteredCommunes = COMMUNES.filter(c => 
    c.toLowerCase().includes(communeSearch.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6 text-[#1A1A1A] dark:text-gray-100 font-sans"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase flex items-center gap-2">
            <User className="w-5.5 h-5.5 text-orange-500" />
            Modifier mon Profil PRO
          </h3>
          {autoSaveStatus === "saving" && (
            <span className="text-[10px] lowercase font-normal text-amber-500 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full animate-pulse border border-amber-500/20 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span> auto-enregistrement...
            </span>
          )}
          {autoSaveStatus === "saved" && (
            <span className="text-[10px] lowercase font-normal text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> synchronisé !
            </span>
          )}
          {autoSaveStatus === "error" && (
            <span className="text-[10px] lowercase font-normal text-red-500 flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> échec de synchro
            </span>
          )}
        </div>
        <button 
          onClick={onCancel}
          type="button"
          className="text-xs font-black border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 cursor-pointer"
        >
          Annuler
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {editError && (
          <div className="p-3 bg-red-55/10 border-l-4 border-red-500 rounded-r-xl text-red-650 text-xs font-bold leading-relaxed">
            ⚠️ {editError}
          </div>
        )}
        {editSuccess && (
          <div className="p-3 bg-emerald-55/10 border-l-4 border-emerald-500 rounded-r-xl text-emerald-650 text-xs font-bold leading-relaxed">
            🎉 Vos modifications ont été enregistrées avec succès et synchronisées !
          </div>
        )}

        {/* 1. SECTION IDENTITÉ */}
        <div className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-4">
          <span className="text-[10px] tracking-widest uppercase font-black text-gray-400 block">Section 1. Identité d’Artiste (Publique)</span>
          
          <div className="border border-gray-100 dark:border-gray-800 p-4.5 rounded-2xl bg-gray-50/50 dark:bg-gray-850/20 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Photo de Profil (Avatar)
              </label>
              {uploading && (
                <span className="text-[10px] font-black tracking-wider text-[#D4AF37] uppercase animate-pulse">
                  Chargement de la photo... {uploadProgress}%
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Current Preview or Camera active viewport */}
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#D4AF37] bg-gray-100 dark:bg-gray-800 flex-shrink-0 flex items-center justify-center shadow-inner">
                {cameraActive ? (
                  <video
                    id="webcam-preview"
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
                      className="px-3.5 py-2 bg-[#D4AF37] hover:bg-[#E06C00] text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Prendre une photo
                    </button>
                  </div>
                )}
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">
                  Pris en charge via Firebase Storage.
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Prénom (Identité Google)</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 text-black dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Nom (Identité Google)</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 text-black dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Nom Artistique (Surnom de scène)</label>
              <input
                type="text"
                placeholder="Ex: Le Bateleur, King DJ..."
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 text-black dark:text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Date de Naissance d'Artisme</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 text-black dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Genre</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-sm text-black dark:text-white"
              >
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Téléphone de Contact</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-sm font-semibold text-black dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Numéro WhatsApp PRO</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-sm font-semibold text-black dark:text-white"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Ma présentation / Bio (Biographie)</label>
            <textarea
              value={bio}
              rows={2}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-white text-black font-semibold"
              placeholder="Ex: Guitariste soliste chevronné, disponible pour des cachets et concerts..."
            />
          </div>
        </div>

        {/* 2. SECTION LOCALISATION */}
        <div className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-4">
          <span className="text-[10px] tracking-widest uppercase font-black text-gray-400 block">Section 2. Localisation d'Abidjan & Zone Civ</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Ville</label>
              <input
                type="text"
                required
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-sm text-black dark:text-white font-bold"
              />
            </div>

            {/* Searchable Commune selector */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 mb-1">Commune</label>
              <button
                type="button"
                onClick={() => setShowCommuneDropdown(!showCommuneDropdown)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-sm text-left flex items-center justify-between text-black dark:text-white font-bold"
              >
                <span>{commune || "Veuillez choisir"}</span>
                <ChevronDown className="w-4 h-4 text-gray-450 shrink-0" />
              </button>

              {showCommuneDropdown && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl p-3 space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-1.5 px-2 bg-gray-50 dark:bg-gray-850 border border-gray-100 rounded-lg">
                    <Search className="w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher Commune..."
                      value={communeSearch}
                      onChange={(e) => setCommuneSearch(e.target.value)}
                      className="w-full py-1.5 focus:outline-none bg-transparent text-xs text-black dark:text-white"
                    />
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {filteredCommunes.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setCommune(c);
                          setShowCommuneDropdown(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          commune === c 
                            ? "bg-orange-500/10 text-[#D4AF37]" 
                            : "hover:bg-gray-50 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Quartier (Modification libre)</label>
              <input
                type="text"
                placeholder="Ex: Deux-Plateaux Vallon, Angré..."
                required
                value={quartier}
                onChange={(e) => setQuartier(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-sm text-black dark:text-white font-bold"
              />
            </div>
          </div>
        </div>

        {/* 3. SECTION ACTIVITÉ & RÔLE */}
        <div className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-4">
          <span className="text-[10px] tracking-widest uppercase font-black text-gray-400 block">Section 3. Activité du Label / Type de Compte</span>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Je suis un :</label>
            <select
              value={accountRole}
              onChange={(e) => setAccountRole(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-sm font-bold text-black"
            >
              <option value="musicien">🎸 Artiste / Musicien (En quête de Gombos d'Abidjan)</option>
              <option value="organisateur">🎪 Organisateur de Spectacle (Créateur d’Events public)</option>
              <option value="client">🤵 Client Professionnel / Particulier (Donneur d'ordre)</option>
              <option value="manager">💼 Manager d'Artistes / Producteur (VIP Supervisor)</option>
            </select>
          </div>
        </div>

        {/* 4. SECTION SPÉCIALITÉS & STYLES (Choix multiples + Saisie libre) */}
        {accountRole === "musicien" && (
          <div className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-6">
            <span className="text-[10px] tracking-widest uppercase font-black text-gray-400 block">Section 4. Spécialités & Courants Musicaux</span>
            
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">🎸 Spécialités de scène (Choix multiples)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SPECIALTIES_LIST.map((spec) => {
                  const selected = specialties.includes(spec);
                  return (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          setSpecialties(specialties.filter(s => s !== spec));
                        } else {
                          setSpecialties([...specialties, spec]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold text-left border flex items-center justify-between gap-1 transition-all ${
                        selected
                          ? "bg-[#D4AF37] border-[#D4AF37] text-white"
                          : "bg-gray-50 dark:bg-[#18181b] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-350"
                      }`}
                    >
                      <span className="truncate">{spec}</span>
                      {selected && <Check className="w-3 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Free specialty input */}
              <div className="flex gap-2 max-w-sm pt-1">
                <input
                  type="text"
                  placeholder="Autre spécialité libre..."
                  value={freeSpecialty}
                  onChange={(e) => setFreeSpecialty(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-850 border border-gray-100 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (freeSpecialty.trim() && !specialties.includes(freeSpecialty.trim())) {
                      setSpecialties([...specialties, freeSpecialty.trim()]);
                      setFreeSpecialty("");
                    }
                  }}
                  className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-[10px] font-black uppercase cursor-pointer shrink-0"
                >
                  Ajouter
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-50 dark:border-gray-850">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">🎶 Styles & Genres (Choix multiples)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {GENRES_LIST.map((gen) => {
                  const selected = musicGenres.includes(gen);
                  return (
                    <button
                      key={gen}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          setMusicGenres(musicGenres.filter(g => g !== gen));
                        } else {
                          setMusicGenres([...musicGenres, gen]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold text-left border flex items-center justify-between gap-1 transition-all ${
                        selected
                          ? "bg-amber-500 border-amber-500 text-white"
                          : "bg-gray-50 dark:bg-[#18181b] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-350"
                      }`}
                    >
                      <span className="truncate">{gen}</span>
                      {selected && <Check className="w-3 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Free genre input */}
              <div className="flex gap-2 max-w-sm pt-1">
                <input
                  type="text"
                  placeholder="Autre courant libre..."
                  value={freeGenre}
                  onChange={(e) => setFreeGenre(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-850 border border-gray-100 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (freeGenre.trim() && !musicGenres.includes(freeGenre.trim())) {
                      setMusicGenres([...musicGenres, freeGenre.trim()]);
                      setFreeGenre("");
                    }
                  }}
                  className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase cursor-pointer shrink-0"
                >
                  Ajouter
                </button>
              </div>
            </div>

            {/* Expérience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-50 dark:border-gray-850 pt-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Niveau d'Expérience Scénique</label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-100 rounded-xl text-xs font-bold text-black"
                >
                  {EXPERIENCES.map(ex => (
                    <option key={ex} value={ex}>{ex}</option>
                  ))}
                </select>
              </div>

              {/* General Availability days check list */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Disponibilités Générales</label>
                <div className="space-y-1 mt-1 border border-gray-105 p-3 rounded-xl max-h-36 overflow-y-auto">
                  {["Semaine", "Week-end", "Journée", "Soirée", "Disponible immédiatement"].map((day) => {
                    const checked = availabilities.includes(day);
                    return (
                      <label key={day} className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setAvailabilities(availabilities.filter(d => d !== day));
                            } else {
                              setAvailabilities([...availabilities, day]);
                            }
                          }}
                          className="accent-orange-500 text-[#D4AF37]"
                        />
                        <span>{day}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. PAYMENTS MOBILE SYSTEMS */}
        <div className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-4">
          <span className="text-[10px] tracking-widest uppercase font-black text-gray-400 block">Section 5. Cachets de Paiement & Canal Argent Mobile (Mobile Money)</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Numéro WAVE (Retrait direct)</label>
              <input
                type="text"
                value={waveNumber}
                onChange={(e) => setWaveNumber(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-sm font-semibold text-black dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Numéro ORANGE MONEY (Retrait direct)</label>
              <input
                type="text"
                value={orangeMoneyNumber}
                onChange={(e) => setOrangeMoneyNumber(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-sm font-semibold text-black dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-750 dark:text-gray-300 font-bold rounded-xl text-sm cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={editLoading}
            className="px-8 py-3 bg-[#D4AF37] hover:bg-orange-600 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer text-sm font-sans"
          >
            {editLoading ? "Sauvegarde en cours..." : "Enregistrer les modifications"}
          </button>
        </div>
      </form>
    </motion.div>
  );
};
