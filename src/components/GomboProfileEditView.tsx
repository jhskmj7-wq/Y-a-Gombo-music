import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Check, Plus, Search, ChevronDown, Camera, Upload, 
  ShieldCheck, ArrowLeft, Save, X, Trash2, Image as ImageIcon, MapPin
} from "lucide-react";
import { useLocations } from "../hooks/useLocations";
import UserLocationProposalModal from "./common/UserLocationProposalModal";
import { isModuleVisible } from "../lib/featureFlags";

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
  setCameraActive?: (val: boolean) => void;
  uploading: boolean;
  uploadProgress: number;
  capturePhoto: () => void;
  stopCamera: () => void;
  startCamera: () => void;
  handleFileUpload: (file: File) => void;
  coverUrl: string;
  setCoverUrl?: (val: string) => void;
  handleCoverUpload: (file: File) => void;
  coverUploading: boolean;
  coverUploadProgress: number;
  onSkip?: () => void;
  autoSaveStatus?: "idle" | "saving" | "saved" | "error";
  kycStatus?: "pending" | "approved" | "rejected" | "none" | "info_required";
  onIdentityUpload: (file: File) => void;
  verifyingIdentity: boolean;
  kycProgress: number;
  currentUser?: any;
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
  avatarUrl, setAvatarUrl,
  cameraActive,
  uploading, uploadProgress,
  capturePhoto, stopCamera, startCamera,
  handleFileUpload,
  coverUrl, handleCoverUpload, coverUploading, coverUploadProgress,
  autoSaveStatus = "idle",
  kycStatus = "none",
  onIdentityUpload,
  verifyingIdentity,
  kycProgress,
  currentUser = null
}) => {
  // Accordions states (closed by default)
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isSpecialtiesOpen, setIsSpecialtiesOpen] = useState(false);
  const [isInstrumentsOpen, setIsInstrumentsOpen] = useState(false);
  const [isGenresOpen, setIsGenresOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Search states for open containers
  const [specialtiesSearch, setSpecialtiesSearch] = useState("");
  const [instrumentsSearch, setInstrumentsSearch] = useState("");
  const [genresSearch, setGenresSearch] = useState("");
  const [languagesSearch, setLanguagesSearch] = useState("");

  const [isAvatarSheetOpen, setIsAvatarSheetOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(avatarUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { communeNames } = useLocations();

  // Filtered lists for instant search
  const filteredSpecialties = SPECIALTIES_LIST.filter(s =>
    s.toLowerCase().includes(specialtiesSearch.toLowerCase().trim())
  );

  const filteredInstruments = INSTRUMENTS_LIST.filter(i =>
    i.toLowerCase().includes(instrumentsSearch.toLowerCase().trim())
  );

  const filteredGenres = GENRES_LIST.filter(g =>
    g.toLowerCase().includes(genresSearch.toLowerCase().trim())
  );

  const filteredLanguages = LANGUAGES_LIST.filter(l =>
    l.toLowerCase().includes(languagesSearch.toLowerCase().trim())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-3xl mx-auto px-3 sm:px-6 py-2 space-y-4 pb-28 text-left"
      style={{ touchAction: "pan-y" }}
    >
      <div className="pt-1 pb-4 space-y-4 w-full" style={{ touchAction: "pan-y" }}>
        
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

        <form onSubmit={onSubmit} className="space-y-4" style={{ touchAction: "pan-y" }}>
          
          {/* 1. MÉDIAS (AVATAR & COVER) ANDROID FIRST */}
          <div className="afri-card w-full p-4 rounded-[18px] space-y-4">
            <div className="space-y-4">
              <p className="afri-text-tiny uppercase tracking-widest text-[#D4AF37]">Couverture & Identité Visuelle</p>
              
              {/* Cover Card */}
              <div className="relative h-36 sm:h-44 rounded-2xl bg-afri-bg-sec border border-afri-border shadow-inner overflow-hidden">
                {coverUrl ? (
                  <img src={coverUrl} alt="Bannière" className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
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
                <div 
                  onClick={() => setIsAvatarSheetOpen(true)}
                  className="relative cursor-pointer group active:scale-95 transition-transform"
                >
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-[#080808] bg-afri-bg-sec shadow-2xl overflow-hidden relative aspect-square" style={{ borderRadius: '50%', overflow: 'hidden' }}>
                    {cameraActive ? (
                      <video id="webcam-preview" autoPlay playsInline className="w-full h-full object-cover scale-x-[-1] rounded-full aspect-square" style={{ borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <img src={avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"} alt="Avatar" className="w-full h-full object-cover rounded-full aspect-square block" style={{ borderRadius: '50%', overflow: 'hidden', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full" style={{ borderRadius: '50%' }}>
                      <Camera className="w-8 h-8 text-[#D4AF37]" />
                    </div>
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 bg-afri-bg/75 flex items-center justify-center rounded-[2.5rem]">
                      <span className="text-xs font-black text-[#D4AF37]">{uploadProgress}%</span>
                    </div>
                  )}
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); setIsAvatarSheetOpen(true); }}
                    className="absolute bottom-0 right-0 p-2.5 bg-[#D4AF37] text-black rounded-full border-2 border-black shadow-lg cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
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
                    <button 
                      type="button" 
                      onClick={() => setIsAvatarSheetOpen(true)} 
                      className="afri-btn-secondary py-3 px-6 text-xs font-bold min-h-[48px] flex items-center gap-2 cursor-pointer shadow-md rounded-xl"
                    >
                      <Camera className="w-4 h-4 text-[#D4AF37]" />
                      <span>Modifier Avatar</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ANDROID NATIVE AVATAR BOTTOM SHEET */}
          {typeof document !== "undefined" && createPortal(
            <AnimatePresence>
              {isAvatarSheetOpen && (
                <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex flex-col justify-end items-center overscroll-none animate-fadeIn">
                  <div className="absolute inset-0" onClick={() => setIsAvatarSheetOpen(false)} />

                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="w-full max-w-md bg-afri-bg-sec border-t border-x border-[#D4AF37]/40 rounded-t-3xl p-6 space-y-4 shadow-2xl relative z-10 max-h-[85vh] overflow-y-auto"
                    style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
                  >
                    <div className="w-12 h-1.5 bg-zinc-600 rounded-full mx-auto" />

                    <div className="text-center space-y-1">
                      <h3 className="text-sm font-black text-afri-text uppercase tracking-wider font-display">
                        Modifier la photo de profil
                      </h3>
                      <p className="text-[10px] text-afri-text-sec font-mono">Options photo Android Native</p>
                    </div>

                    <div className="space-y-3 pt-2">
                      {isModuleVisible("avatar") && (
                        <button
                          type="button"
                          id="btn-open-3d-avatar-studio"
                          onClick={() => {
                            setIsAvatarSheetOpen(false);
                            if (typeof window !== "undefined") {
                              window.dispatchEvent(new CustomEvent("gombo_open_avatar_editor"));
                            }
                          }}
                          className="min-h-[52px] w-full bg-gradient-to-r from-amber-500/20 to-[#D4AF37]/30 border border-[#D4AF37] rounded-2xl flex items-center justify-center gap-3 text-xs font-black text-[#D4AF37] active:scale-[0.98] cursor-pointer shadow-sm transition-transform"
                        >
                          <User className="w-5 h-5 text-[#D4AF37]" />
                          <span>Créer / Personnaliser mon Avatar 3D</span>
                        </button>
                      )}

                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file);
                            setIsAvatarSheetOpen(false);
                          }
                        }} 
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="min-h-[52px] w-full bg-afri-bg border border-afri-border hover:border-[#D4AF37] rounded-2xl flex items-center justify-center gap-3 text-xs font-bold text-afri-text active:scale-[0.98] cursor-pointer shadow-sm transition-transform"
                      >
                        <ImageIcon className="w-5 h-5 text-[#D4AF37]" />
                        <span>Choisir une photo (Album)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsAvatarSheetOpen(false);
                          startCamera();
                        }}
                        className="min-h-[52px] w-full bg-afri-bg border border-afri-border hover:border-[#D4AF37] rounded-2xl flex items-center justify-center gap-3 text-xs font-bold text-afri-text active:scale-[0.98] cursor-pointer shadow-sm transition-transform"
                      >
                        <Camera className="w-5 h-5 text-[#D4AF37]" />
                        <span>Prendre une photo (Appareil photo)</span>
                      </button>

                      <div className="p-3 bg-afri-bg border border-afri-border rounded-2xl space-y-2">
                        <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-wider block">Ou saisir une URL d'image</label>
                        <div className="flex gap-2">
                          <input 
                            type="url"
                            value={customUrlInput}
                            onChange={(e) => setCustomUrlInput(e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="flex-1 bg-afri-bg-sec border border-afri-border rounded-xl px-3 py-2 text-xs text-afri-text outline-none focus:border-[#D4AF37]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (customUrlInput.trim()) {
                                setAvatarUrl(customUrlInput.trim());
                                setIsAvatarSheetOpen(false);
                              }
                            }}
                            className="px-4 py-2 bg-[#D4AF37] text-black rounded-xl text-xs font-bold hover:opacity-90 cursor-pointer"
                          >
                            OK
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-afri-text-sec uppercase tracking-wider block">Ou choisir un avatar prédéfini</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
                            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
                            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
                            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200"
                          ].map((url, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setAvatarUrl(url);
                                setIsAvatarSheetOpen(false);
                              }}
                              className="w-full aspect-square rounded-xl overflow-hidden border-2 border-afri-border hover:border-[#D4AF37] cursor-pointer transition-all active:scale-95"
                            >
                              <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setAvatarUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200");
                          setIsAvatarSheetOpen(false);
                        }}
                        className="min-h-[48px] w-full bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 rounded-2xl flex items-center justify-center gap-3 text-xs font-bold text-rose-400 active:scale-[0.98] cursor-pointer transition-transform"
                      >
                        <Trash2 className="w-4 h-4 text-rose-400" />
                        <span>Réinitialiser / Supprimer</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsAvatarSheetOpen(false)}
                        className="min-h-[48px] w-full bg-afri-bg-ter border border-afri-border rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-afri-text-sec active:scale-[0.98] cursor-pointer transition-transform mt-2"
                      >
                        <X className="w-4 h-4" />
                        <span>Annuler</span>
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body
          )}

          {/* 2. INFOS PERSONNELLES */}
          <div className="afri-card w-full p-4 rounded-[18px] space-y-4">
            <p className="afri-text-tiny uppercase tracking-widest text-[#D4AF37]">Informations d'Artiste</p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3.5 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="afri-text-tiny text-afri-text-sec">Prénom</label>
                  <input id="input-first-name" value={firstName} onChange={e => setFirstName(e.target.value)} className="afri-card-inset w-full p-3.5 text-base sm:text-sm font-bold text-afri-text outline-none focus:border-[#D4AF37]/40" />
                </div>
                <div className="space-y-1.5">
                  <label className="afri-text-tiny text-afri-text-sec">Nom</label>
                  <input id="input-last-name" value={lastName} onChange={e => setLastName(e.target.value)} className="afri-card-inset w-full p-3.5 text-base sm:text-sm font-bold text-afri-text outline-none focus:border-[#D4AF37]/40" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="afri-text-tiny text-afri-text-sec">Nom de Scène</label>
                <input id="input-artist-name" value={artistName} onChange={e => setArtistName(e.target.value)} className="afri-card-inset w-full p-3.5 text-base sm:text-sm font-black text-[#D4AF37] outline-none focus:border-[#D4AF37]/40" placeholder="Votre blaze..." />
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3.5 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="afri-text-tiny text-afri-text-sec">Téléphone</label>
                  <input id="input-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="afri-card-inset w-full p-3.5 text-base sm:text-sm font-bold text-afri-text outline-none focus:border-[#D4AF37]/40" />
                </div>
                <div className="space-y-1.5">
                  <label className="afri-text-tiny text-afri-text-sec">WhatsApp</label>
                  <input id="input-whatsapp" type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="afri-card-inset w-full p-3.5 text-base sm:text-sm font-bold text-afri-text outline-none focus:border-[#D4AF37]/40" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="afri-text-tiny text-afri-text-sec">Ma Biographie</label>
                <textarea id="input-bio" value={bio} onChange={e => setBio(e.target.value)} rows={3} className="afri-card-inset w-full p-3.5 text-base sm:text-sm font-medium text-afri-text outline-none focus:border-[#D4AF37]/40 resize-none" placeholder="Présentez-vous au showbiz..." />
              </div>
            </div>
          </div>

          {/* CONTAINER 1 — 📍 LOCALISATION (ACCORDÉON OUVRABLE) */}
          <div className="afri-card w-full rounded-[18px] border border-white/10 overflow-hidden transition-colors">
            <button
              type="button"
              id="btn-toggle-location"
              onClick={() => setIsLocationOpen(!isLocationOpen)}
              className="w-full p-4 flex items-center justify-between text-left cursor-pointer active:bg-white/[0.02] min-h-[56px]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-afri-text">📍 Localisation & Activité</span>
                    {commune && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 shrink-0">
                        {commune}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-afri-text-sec truncate font-mono mt-0.5">
                    {commune || ville ? `${ville || "Abidjan"} • ${commune || "Commune non définie"}${quartier ? ` (${quartier})` : ""}` : "Définir ma commune et mon quartier"}
                  </p>
                </div>
              </div>

              <ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isLocationOpen ? "rotate-180 text-[#D4AF37]" : "text-zinc-400"}`} />
            </button>

            <AnimatePresence>
              {isLocationOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-white/5 p-4 space-y-4 bg-black/20"
                >
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-3.5 sm:gap-4">
                    <div className="space-y-1.5">
                      <label className="afri-text-tiny text-afri-text-sec">Ville</label>
                      <input id="input-ville" value={ville} onChange={e => setVille(e.target.value)} className="afri-card-inset w-full p-3.5 text-base sm:text-sm font-bold text-afri-text outline-none focus:border-[#D4AF37]/40" placeholder="Abidjan..." />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center gap-1 flex-wrap">
                        <label className="afri-text-tiny text-afri-text-sec">Commune</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCommune("À compléter plus tard");
                              setQuartier("À compléter");
                            }}
                            className="text-[10px] font-mono text-zinc-400 hover:text-zinc-200 cursor-pointer underline"
                            title="Sauter la saisie du lieu pour l'instant"
                          >
                            <span>Je compléterai plus tard</span>
                          </button>
                          <span className="text-zinc-600 text-[10px]">•</span>
                          <button
                            type="button"
                            onClick={() => setIsProposalModalOpen(true)}
                            className="text-[10px] font-mono text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Proposer</span>
                          </button>
                        </div>
                      </div>

                      <div className="relative">
                        <select 
                          id="select-commune"
                          value={commune} 
                          onChange={e => setCommune(e.target.value)} 
                          className="afri-card-inset w-full p-3.5 text-base sm:text-sm font-black text-afri-text appearance-none bg-transparent outline-none pr-10 cursor-pointer focus:border-[#D4AF37]/40"
                        >
                          <option value="" className="bg-afri-bg-sec text-afri-text">Choisir une commune</option>
                          {communeNames.map(c => (
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
                    <label className="afri-text-tiny text-afri-text-sec">Quartier / Repère</label>
                    <input id="input-quartier" value={quartier} onChange={e => setQuartier(e.target.value)} className="afri-card-inset w-full p-3.5 text-base sm:text-sm font-bold text-afri-text outline-none focus:border-[#D4AF37]/40" placeholder="Ex: Angré 8e Tranche, Niangon..." />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CONTAINER 2 — 🎭 SPÉCIALITÉS (ACCORDÉON OUVRABLE, MULTIPLE, RECHERCHE, SCROLL INDÉPENDANT) */}
          <div className="afri-card w-full rounded-[18px] border border-white/10 overflow-hidden transition-colors">
            <button
              type="button"
              id="btn-toggle-specialties"
              onClick={() => setIsSpecialtiesOpen(!isSpecialtiesOpen)}
              className="w-full p-4 flex items-center justify-between text-left cursor-pointer active:bg-white/[0.02] min-h-[56px]"
            >
              <div className="min-w-0 pr-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-afri-text">🎭 Spécialités & Métiers de Scène</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    specialties.length > 0 
                      ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]" 
                      : "bg-white/5 border-white/10 text-zinc-400"
                  }`}>
                    {specialties.length} sélectionnée{specialties.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Preview chips when closed or open */}
                {specialties.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {specialties.slice(0, 4).map(s => (
                      <span key={s} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                        {s}
                      </span>
                    ))}
                    {specialties.length > 4 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 text-zinc-400 border border-white/10">
                        +{specialties.length - 4} autres
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-afri-text-sec font-mono mt-1">Chant, DJ, Arrangeur, Pianiste...</p>
                )}
              </div>

              <ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isSpecialtiesOpen ? "rotate-180 text-[#D4AF37]" : "text-zinc-400"}`} />
            </button>

            <AnimatePresence>
              {isSpecialtiesOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-white/5 p-4 space-y-3 bg-black/20"
                >
                  {/* Instant Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={specialtiesSearch}
                      onChange={e => setSpecialtiesSearch(e.target.value)}
                      placeholder="Rechercher une spécialité..."
                      className="afri-card-inset w-full pl-10 pr-9 py-2.5 text-base sm:text-xs font-medium text-afri-text outline-none focus:border-[#D4AF37]/40 rounded-xl"
                    />
                    {specialtiesSearch && (
                      <button
                        type="button"
                        onClick={() => setSpecialtiesSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Independent Scrollable List of all 35 specialties */}
                  <div 
                    className="max-h-60 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] pr-1.5 space-y-2 scroll-smooth"
                    style={{
                      WebkitOverflowScrolling: "touch",
                      touchAction: "pan-y",
                      overscrollBehaviorY: "contain"
                    }}
                  >
                    <div className="flex flex-wrap gap-2">
                      {filteredSpecialties.map(spec => {
                        const active = specialties.includes(spec);
                        return (
                          <button
                            key={spec}
                            type="button"
                            onClick={() => active ? setSpecialties(specialties.filter(s => s !== spec)) : setSpecialties([...specialties, spec])}
                            className={`px-3.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5 justify-center min-h-[44px] active:scale-[0.98] transition-all cursor-pointer ${
                              active 
                                ? "bg-[#D4AF37] border-[#D4AF37] text-black shadow-md" 
                                : "bg-white/[0.04] border-white/10 text-zinc-300 hover:border-white/20 active:bg-white/10"
                            }`}
                          >
                            {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            <span>{spec}</span>
                          </button>
                        );
                      })}

                      {filteredSpecialties.length === 0 && (
                        <p className="text-xs text-zinc-500 italic py-2">Aucune spécialité trouvée pour "{specialtiesSearch}"</p>
                      )}
                    </div>
                  </div>

                  {/* Custom specialty input if "Autre spécialité" is chosen */}
                  {specialties.includes("Autre spécialité") && (
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                      <label className="text-[10px] font-extrabold text-[#D4AF37] uppercase">Précisez votre spécialité personnalisée</label>
                      <input 
                        id="input-specialty-custom"
                        value={specialtyCustom} 
                        onChange={e => setSpecialtyCustom(e.target.value)} 
                        className="afri-card-inset w-full p-3.5 text-base sm:text-sm font-bold text-afri-text outline-none focus:border-[#D4AF37]/40 rounded-xl" 
                        placeholder="Saisissez votre spécialité custom..." 
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CONTAINER 3 — 🎸 INSTRUMENTS (ACCORDÉON OUVRABLE, MULTIPLE, RECHERCHE, SCROLL INDÉPENDANT) */}
          <div className="afri-card w-full rounded-[18px] border border-white/10 overflow-hidden transition-colors">
            <button
              type="button"
              id="btn-toggle-instruments"
              onClick={() => setIsInstrumentsOpen(!isInstrumentsOpen)}
              className="w-full p-4 flex items-center justify-between text-left cursor-pointer active:bg-white/[0.02] min-h-[56px]"
            >
              <div className="min-w-0 pr-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-afri-text">🎸 Instruments & Équipements</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    instruments.length > 0 
                      ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]" 
                      : "bg-white/5 border-white/10 text-zinc-400"
                  }`}>
                    {instruments.length} sélectionné{instruments.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Preview chips when closed */}
                {instruments.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {instruments.slice(0, 4).map(inst => (
                      <span key={inst} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                        {inst}
                      </span>
                    ))}
                    {instruments.length > 4 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 text-zinc-400 border border-white/10">
                        +{instruments.length - 4} autres
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-afri-text-sec font-mono mt-1">Piano, Guitare basse, Djembé, Balafon...</p>
                )}
              </div>

              <ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isInstrumentsOpen ? "rotate-180 text-[#D4AF37]" : "text-zinc-400"}`} />
            </button>

            <AnimatePresence>
              {isInstrumentsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-white/5 p-4 space-y-3 bg-black/20"
                >
                  {/* Instant Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={instrumentsSearch}
                      onChange={e => setInstrumentsSearch(e.target.value)}
                      placeholder="Rechercher un instrument..."
                      className="afri-card-inset w-full pl-10 pr-9 py-2.5 text-base sm:text-xs font-medium text-afri-text outline-none focus:border-[#D4AF37]/40 rounded-xl"
                    />
                    {instrumentsSearch && (
                      <button
                        type="button"
                        onClick={() => setInstrumentsSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Independent Scrollable List of all 24 instruments */}
                  <div 
                    className="max-h-60 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] pr-1.5 space-y-2 scroll-smooth"
                    style={{
                      WebkitOverflowScrolling: "touch",
                      touchAction: "pan-y",
                      overscrollBehaviorY: "contain"
                    }}
                  >
                    <div className="flex flex-wrap gap-2">
                      {filteredInstruments.map(inst => {
                        const active = instruments.includes(inst);
                        return (
                          <button
                            key={inst}
                            type="button"
                            onClick={() => active ? setInstruments(instruments.filter(i => i !== inst)) : setInstruments([...instruments, inst])}
                            className={`px-3.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5 justify-center min-h-[44px] active:scale-[0.98] transition-all cursor-pointer ${
                              active 
                                ? "bg-[#D4AF37] border-[#D4AF37] text-black shadow-md" 
                                : "bg-white/[0.04] border-white/10 text-zinc-300 hover:border-white/20 active:bg-white/10"
                            }`}
                          >
                            {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            <span>{inst}</span>
                          </button>
                        );
                      })}

                      {filteredInstruments.length === 0 && (
                        <p className="text-xs text-zinc-500 italic py-2">Aucun instrument trouvé pour "{instrumentsSearch}"</p>
                      )}
                    </div>
                  </div>

                  {/* Custom instrument input if "Autre instrument" is chosen */}
                  {instruments.includes("Autre instrument") && (
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                      <label className="text-[10px] font-extrabold text-[#D4AF37] uppercase">Précisez votre instrument personnalisé</label>
                      <input 
                        id="input-instrument-custom"
                        value={instrumentCustom} 
                        onChange={e => setInstrumentCustom(e.target.value)} 
                        className="afri-card-inset w-full p-3.5 text-base sm:text-sm font-bold text-afri-text outline-none focus:border-[#D4AF37]/40 rounded-xl" 
                        placeholder="Saisissez votre instrument custom..." 
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CONTAINER 4 — 🎵 STYLES MUSICAUX (ACCORDÉON OUVRABLE, MULTIPLE, RECHERCHE, SCROLL INDÉPENDANT) */}
          <div className="afri-card w-full rounded-[18px] border border-white/10 overflow-hidden transition-colors">
            <button
              type="button"
              id="btn-toggle-genres"
              onClick={() => setIsGenresOpen(!isGenresOpen)}
              className="w-full p-4 flex items-center justify-between text-left cursor-pointer active:bg-white/[0.02] min-h-[56px]"
            >
              <div className="min-w-0 pr-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-afri-text">🎵 Styles & Univers Musicaux</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    musicGenres.length > 0 
                      ? "bg-amber-500/20 border-amber-500 text-amber-400" 
                      : "bg-white/5 border-white/10 text-zinc-400"
                  }`}>
                    {musicGenres.length} sélectionné{musicGenres.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Preview chips when closed */}
                {musicGenres.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {musicGenres.slice(0, 4).map(gen => (
                      <span key={gen} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {gen}
                      </span>
                    ))}
                    {musicGenres.length > 4 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 text-zinc-400 border border-white/10">
                        +{musicGenres.length - 4} autres
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-afri-text-sec font-mono mt-1">Coupé-Décalé, Zouglou, Afrobeat, Gospel, Jazz...</p>
                )}
              </div>

              <ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isGenresOpen ? "rotate-180 text-[#D4AF37]" : "text-zinc-400"}`} />
            </button>

            <AnimatePresence>
              {isGenresOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-white/5 p-4 space-y-3 bg-black/20"
                >
                  {/* Instant Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={genresSearch}
                      onChange={e => setGenresSearch(e.target.value)}
                      placeholder="Rechercher un style musical..."
                      className="afri-card-inset w-full pl-10 pr-9 py-2.5 text-base sm:text-xs font-medium text-afri-text outline-none focus:border-amber-500/40 rounded-xl"
                    />
                    {genresSearch && (
                      <button
                        type="button"
                        onClick={() => setGenresSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Independent Scrollable List of all 46 genres */}
                  <div 
                    className="max-h-60 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] pr-1.5 space-y-2 scroll-smooth"
                    style={{
                      WebkitOverflowScrolling: "touch",
                      touchAction: "pan-y",
                      overscrollBehaviorY: "contain"
                    }}
                  >
                    <div className="flex flex-wrap gap-2">
                      {filteredGenres.map(gen => {
                        const active = musicGenres.includes(gen);
                        return (
                          <button
                            key={gen}
                            type="button"
                            onClick={() => active ? setMusicGenres(musicGenres.filter(g => g !== gen)) : setMusicGenres([...musicGenres, gen])}
                            className={`px-3.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5 justify-center min-h-[44px] active:scale-[0.98] transition-all cursor-pointer ${
                              active 
                                ? "bg-amber-500 border-amber-500 text-black shadow-md" 
                                : "bg-white/[0.04] border-white/10 text-zinc-300 hover:border-white/20 active:bg-white/10"
                            }`}
                          >
                            {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            <span>{gen}</span>
                          </button>
                        );
                      })}

                      {filteredGenres.length === 0 && (
                        <p className="text-xs text-zinc-500 italic py-2">Aucun style trouvé pour "{genresSearch}"</p>
                      )}
                    </div>
                  </div>

                  {/* Custom genre input if "Autre style" is chosen */}
                  {musicGenres.includes("Autre style") && (
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                      <label className="text-[10px] font-extrabold text-amber-400 uppercase">Précisez votre style musical personnalisé</label>
                      <input 
                        id="input-genre-custom"
                        value={musicGenreCustom} 
                        onChange={e => setMusicGenreCustom(e.target.value)} 
                        className="afri-card-inset w-full p-3.5 text-base sm:text-sm font-bold text-afri-text outline-none focus:border-amber-500/40 rounded-xl" 
                        placeholder="Saisissez votre style custom..." 
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CONTAINER 5 — ⚙️ EXPÉRIENCE, DISPONIBILITÉS & LANGUES (ACCORDÉON OUVRABLE) */}
          <div className="afri-card w-full rounded-[18px] border border-white/10 overflow-hidden transition-colors">
            <button
              type="button"
              id="btn-toggle-details"
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              className="w-full p-4 flex items-center justify-between text-left cursor-pointer active:bg-white/[0.02] min-h-[56px]"
            >
              <div className="min-w-0 pr-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-afri-text">💼 Expérience, Disponibilités & Langues</span>
                </div>
                <p className="text-[11px] text-afri-text-sec font-mono mt-1 truncate">
                  {experience ? `Niveau : ${experience}` : "Niveau non renseigné"} • {availabilities.length} dispo • {languages.length} langue{languages.length > 1 ? "s" : ""}
                </p>
              </div>

              <ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isDetailsOpen ? "rotate-180 text-[#D4AF37]" : "text-zinc-400"}`} />
            </button>

            <AnimatePresence>
              {isDetailsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-white/5 p-4 space-y-5 bg-black/20"
                >
                  {/* Niveau d'Expérience */}
                  <div className="space-y-2">
                    <label className="afri-text-tiny text-afri-text-sec">Niveau d'Expérience</label>
                    <div className="flex flex-wrap gap-2">
                      {EXPERIENCES.map(exp => {
                        const active = experience === exp;
                        return (
                          <button key={exp} type="button" onClick={() => setExperience(exp)} className={`px-3.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5 justify-center min-h-[44px] active:scale-[0.98] transition-all cursor-pointer ${active ? "bg-[#D4AF37] border-[#D4AF37] text-black shadow-md" : "bg-white/[0.04] border-white/10 text-zinc-300 hover:border-white/20"}`}>
                            {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            <span>{exp}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Disponibilités */}
                  <div className="space-y-2">
                    <label className="afri-text-tiny text-afri-text-sec">Disponibilités de Prestation</label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABILITIES_LIST.map(avail => {
                        const active = availabilities.includes(avail);
                        return (
                          <button key={avail} type="button" onClick={() => active ? setAvailabilities(availabilities.filter(a => a !== avail)) : setAvailabilities([...availabilities, avail])} className={`px-3.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5 justify-center min-h-[44px] active:scale-[0.98] transition-all cursor-pointer ${active ? "bg-emerald-500 border-emerald-500 text-black font-black shadow-md" : "bg-white/[0.04] border-white/10 text-zinc-300 hover:border-white/20"}`}>
                            {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            <span>{avail}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Langues */}
                  <div className="space-y-2">
                    <label className="afri-text-tiny text-afri-text-sec">Langues parlées & chantées</label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES_LIST.map(lang => {
                        const active = languages.includes(lang);
                        return (
                          <button key={lang} type="button" onClick={() => active ? setLanguages(languages.filter(l => l !== lang)) : setLanguages([...languages, lang])} className={`px-3.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5 justify-center min-h-[44px] active:scale-[0.98] transition-all cursor-pointer ${active ? "bg-[#D4AF37] border-[#D4AF37] text-black font-black shadow-md" : "bg-white/[0.04] border-white/10 text-zinc-300 hover:border-white/20"}`}>
                            {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            <span>{lang}</span>
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
                          className="afri-card-inset w-full p-3.5 text-base sm:text-sm font-bold text-afri-text outline-none focus:border-[#D4AF37]/40 rounded-xl" 
                          placeholder="Saisissez votre langue custom..." 
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 5. VÉRIFICATION (KYC) */}
          <div className="afri-card w-full p-4 rounded-[18px] space-y-4">
            <div className="flex items-center justify-between">
              <p className="afri-text-tiny uppercase tracking-widest text-[#D4AF37]">Sécurité Afritrust</p>
              {kycStatus === "approved" && <div className="afri-badge afri-badge-gold">Vérifié</div>}
            </div>
            
            <div className="afri-card-inset space-y-3">
              <p className="text-[10px] text-afri-text-sec leading-relaxed">Téléchargez une pièce d'identité pour certifier votre héritage musical.</p>
              {verifyingIdentity ? (
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-afri-border/30 rounded-full overflow-hidden">
                    <div className="bg-[#D4AF37] h-full transition-all duration-300 rounded-full" style={{ width: `${kycProgress}%` }} />
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
          </div>

        </form>
      </div>

      <UserLocationProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        currentUser={currentUser}
        defaultType="Commune"
      />
    </motion.div>
  );
};
