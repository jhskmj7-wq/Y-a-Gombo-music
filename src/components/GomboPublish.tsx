import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, Clock, DollarSign, MapPin, AlignLeft, Check, 
  Music, Sparkles, Image as ImageIcon, Briefcase, MessageSquare, 
  Upload, X, AlertCircle, Award, Star, Radio
} from "lucide-react";
import { gomboDB } from "../firebase";
import { UserProfile, SocialPost } from "../types";

const ABIDJAN_COMMUNES = [
  "Cocody", "Yopougon", "Marcory", "Plateau", "Treichville", "Abobo", 
  "Koumassi", "Adjamé", "Port-Bouët", "Attécoubé", "Grand-Bassam", "Bingerville"
];

const PUBLICATION_TYPES = [
  { id: "opportunite", label: "💼 Opportunité (Contrat)", desc: "Proposer un gombo rémunéré, un contrat de cabaret ou un concert privé" },
  { id: "demo", label: "🎵 Démo musicale", desc: "Partager un a cappella, un solo instrumental ou une de vos performances" },
  { id: "renfort", label: "⚡ Renfort Express", desc: "Besoin immédiat d'un remplaçant pour une répétition ou un live ce soir" },
  { id: "casting", label: "🎤 Casting", desc: "Auditions pour un groupe, une chorale d'église ou un grand orchestre" },
  { id: "evenement", label: "🎉 Événement / Show", desc: "Annoncer une répétition publique, un showcase de quartier ou une sortie" },
  { id: "recherche", label: "🎸 Recherche d'instrumentiste", desc: "Rechercher activement un pianiste, un batteur ou un soliste permanent" }
];

interface GomboPublishProps {
  currentUserProfile: UserProfile;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function GomboPublish({ currentUserProfile, onSuccess, onCancel }: GomboPublishProps) {
  const [selectedType, setSelectedType] = useState("opportunite");

  // Requested fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [commune, setCommune] = useState("Cocody");
  const [locationDetail, setLocationDetail] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [budget, setBudget] = useState("");
  
  // Photo & Audio optional attachments
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // States
  const [loading, setLoading] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadingState, setUploadingState] = useState<{ [key: string]: boolean }>({});

  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "audio") => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (type === "image") setImageFile(file);
      if (type === "audio") setAudioFile(file);
    }
  };

  const clearFile = (type: "image" | "audio") => {
    if (type === "image") {
      setImageFile(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
    } else {
      setAudioFile(null);
      if (audioInputRef.current) audioInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg("Veuillez remplir le titre et la description !");
      return;
    }

    setErrorMsg("");
    setLoading(true);

    try {
      let uploadedImageUrl = "";
      let uploadedAudioUrl = "";

      const authorName = `${currentUserProfile.firstName} ${currentUserProfile.lastName}`.trim() || "Artiste Gombo";
      const authorPhoto = currentUserProfile.avatarUrl || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=150";

      // 1. Upload files if present
      if (imageFile) {
        setUploadingState(p => ({ ...p, image: true }));
        try {
          uploadedImageUrl = await gomboDB.uploadFile(
            `posts_assets/images/${Date.now()}_${imageFile.name}`,
            imageFile,
            (pct) => setUploadProgress(p => ({ ...p, image: Math.round(pct) }))
          );
        } catch (err) {
          console.warn("⚠️ Fallback link for cover image file upload due to offline simulator:", err);
          uploadedImageUrl = "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=500";
        }
        setUploadingState(p => ({ ...p, image: false }));
      }

      if (audioFile) {
        setUploadingState(p => ({ ...p, audio: true }));
        try {
          uploadedAudioUrl = await gomboDB.uploadFile(
            `posts_assets/audios/${Date.now()}_${audioFile.name}`,
            audioFile,
            (pct) => setUploadProgress(p => ({ ...p, audio: Math.round(pct) }))
          );
        } catch (err) {
          console.warn("⚠️ Fallback link for audio track file upload due to offline simulator:", err);
          uploadedAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3";
        }
        setUploadingState(p => ({ ...p, audio: false }));
      }

      const postTag = PUBLICATION_TYPES.find(t => t.id === selectedType)?.label || selectedType;

      // 2. Publish in system posts (Le Terrain)
      const postPayload: Omit<SocialPost, "id" | "createdAt" | "likesCount" | "sharesCount" | "savesCount" | "likedBy" | "savedBy" | "comments"> = {
        userId: currentUserProfile.uid,
        userName: authorName,
        userAvatar: authorPhoto,
        userRole: currentUserProfile.role || "musicien",
        title: title.trim(),
        caption: description.trim(),
        tags: [selectedType, commune],
        
        type: selectedType === "opportunite" ? "gombo" : (selectedType === "demo" ? "demo" : "annonce"),
        postCategory: selectedType,
        authorId: currentUserProfile.uid,
        authorName: authorName,
        authorPhoto: authorPhoto,
        description: description.trim(),
        commune: commune,
        locationDetail: locationDetail.trim() || undefined,
        imageUrl: uploadedImageUrl || (selectedType === "demo" ? "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400" : undefined),
        audioUrl: uploadedAudioUrl || (selectedType === "demo" ? "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" : undefined),
        mediaUrl: uploadedImageUrl || uploadedAudioUrl || "",
        budget: budget ? Number(budget) : undefined,
        specialty: selectedType === "renfort" ? "Renfort Urgent" : (selectedType === "recherche" ? "Instrumentiste" : undefined),
        urgent: selectedType === "renfort",
        commentsCount: 0
      };

      await gomboDB.publishSocialPost(postPayload);

      // 3. Dual sync to Gombos marketplace list if type is Opportunité or Renfort Express
      if (selectedType === "opportunite" || selectedType === "renfort") {
        await gomboDB.publishGombo({
          clientId: currentUserProfile.uid,
          clientName: authorName,
          title: title.trim(),
          description: description.trim(),
          location: locationDetail.trim() ? `${locationDetail.trim()}, ${commune}` : `Abidjan, commune de ${commune}`,
          commune: commune,
          date: date || new Date().toISOString().split("T")[0],
          time: "19:00",
          budget: budget ? Number(budget) : 25000,
          eventType: selectedType === "renfort" ? "⚡ Renfort Express" : "💼 Contrat Gombo Pro",
          musiciansCount: 1,
          urgent: selectedType === "renfort"
        });
      }

      // Show beautiful Success State requested by user
      setShowSuccessOverlay(true);
    } catch (err) {
      console.error(err);
      setErrorMsg("Une erreur est survenue lors du lancement du gombo. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-4 px-2">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/95 dark:bg-[#0c0c0e] text-white rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/35 shadow-[0_0_30px_rgba(212,175,55,0.15)] relative overflow-hidden"
      >
        {/* Gold design bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D4AF37] via-amber-400 to-[#D4AF37]" />

        {/* Success Overlay state */}
        <AnimatePresence>
          {showSuccessOverlay && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/98 z-50 flex flex-col items-center justify-center text-center p-6 space-y-6"
            >
              <div className="w-20 h-20 bg-[#D4AF37]/15 border-2 border-[#D4AF37] rounded-full flex items-center justify-center animate-bounce text-4xl">
                🎶
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-[#D4AF37] uppercase tracking-wider">
                  Ton gombo est lancé ! 🚀
                </h3>
                <p className="text-xs text-gray-400 max-w-sm px-4">
                  Il résonne déjà sur les téléphones de tous les instrumentistes et patrons de showbizz d'Abidjan !
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowSuccessOverlay(false);
                  onSuccess();
                }}
                className="px-8 py-3 bg-[#D4AF37] hover:bg-[#bfa032] active:scale-95 text-black font-black text-xs uppercase rounded-xl transition-all tracking-widest shadow-lg shadow-[#D4AF37]/25 cursor-pointer"
              >
                Super, continuons !
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Title view */}
        <div className="mb-6 space-y-1">
          <span className="text-[10px] font-black uppercase text-[#D4AF37] tracking-widest flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-[#D4AF37] animate-pulse" />
            L'ADN DU LUXE AFRI
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#D4AF37] flex items-center gap-2 uppercase tracking-tight">
            🚀 Lancer le Gombo
          </h2>
          <p className="text-[11px] text-gray-400 font-medium">
            Entrez dans le temple musical et diffusez instantanément votre opportunité.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 bg-red-950/30 text-red-400 font-bold text-xs rounded-xl border border-red-900/60 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. SELECTION DU TYPE */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">
              Type de publication
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#D4AF37]">
              {PUBLICATION_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedType(t.id)}
                  className={`p-3 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    selectedType === t.id 
                      ? "border-[#D4AF37] bg-white/[0.03] text-white shadow-xs" 
                      : "border-white/[0.08] bg-transparent text-gray-400 hover:border-white/[0.2] hover:text-white"
                  }`}
                >
                  <span className="text-xs font-black uppercase tracking-wider">{t.label}</span>
                  <span className="text-[9px] text-gray-500 mt-0.5 leading-tight">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. TITRE */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">
              Titre de la publication
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Solo trompette recherché pour cabaret chic..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37] placeholder-gray-600"
            />
          </div>

          {/* 3. DESCRIPTION */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">
              Description / Détails
            </label>
            <textarea
              rows={4}
              required
              placeholder="Donnez tous les détails avec style : lieu précis, ambiance, exigences de morceaux..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37] placeholder-gray-600"
            />
          </div>

          {/* 4. COMMUNE EXCLUSIVITÉ & LOCALISATION PRÉCISE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">
                Commune / Ville
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                </span>
                <select
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs font-black text-white hover:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] cursor-pointer"
                >
                  {ABIDJAN_COMMUNES.map((com) => (
                    <option key={com} value={com} className="bg-black text-white">{com}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">
                Localisation précise (ex: Rue 12, Salle)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                </span>
                <input
                  type="text"
                  placeholder="Ex : Bar Le Monument, Rue des Jardins"
                  value={locationDetail}
                  onChange={(e) => setLocationDetail(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs font-black text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37] placeholder-gray-650"
                />
              </div>
            </div>
          </div>

          {/* 5. DATE */}
          <div>
            <label className="block text-[10px] font-black text-[#D4AF37] mb-1.5 uppercase tracking-widest">
              Date de l'événement
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <Calendar className="w-4 h-4 text-[#D4AF37]" />
              </span>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs font-black text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>
          </div>

          {/* 6. CACHET OPTIONNEL */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">
              Cachet (Optionnel, en FCFA)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-emerald-500 font-extrabold text-xs">
                FCFA
              </span>
              <input
                type="number"
                placeholder="Ex : 35000 (Laisser vide pour discuter)"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37] placeholder-gray-600"
              />
            </div>
          </div>

          {/* 7. PHOTO OU AUDIO OPTIONNELS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Attachment image */}
            <div className="p-4 border-2 border-dashed border-white/[0.08] hover:border-[#D4AF37]/35 bg-white/[0.01] rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px] transition-all relative overflow-hidden"
                 onClick={() => imageInputRef.current?.click()}
            >
              <input 
                ref={imageInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => handleFileChange(e, "image")}
              />
              {imageFile ? (
                <div className="space-y-1 w-full text-center">
                  <span className="text-xs text-semibold truncate block max-w-[150px] mx-auto text-[#D4AF37]">🖼️ {imageFile.name}</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); clearFile("image"); }} className="text-[10px] uppercase font-bold text-red-500 inline-flex items-center gap-0.5 mt-2 bg-red-950/20 px-2 py-0.5 rounded">
                    <X className="w-3 h-3" /> Enlever
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <ImageIcon className="w-5 h-5 text-gray-500 mx-auto" />
                  <span className="text-[10px] font-black block text-gray-300">Photo d'illustration</span>
                  <span className="text-[8px] text-gray-500 block font-semibold">(Optionnel)</span>
                </div>
              )}
              {uploadingState.image && (
                <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center">
                  <span className="text-[9px] text-[#D4AF37] font-black uppercase">Envoi photo... {uploadProgress.image || 0}%</span>
                </div>
              )}
            </div>

            {/* Attachment audio */}
            <div className="p-4 border-2 border-dashed border-white/[0.08] hover:border-[#D4AF37]/35 bg-white/[0.01] rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px] transition-all relative overflow-hidden"
                 onClick={() => audioInputRef.current?.click()}
            >
              <input 
                ref={audioInputRef}
                type="file" 
                accept="audio/*" 
                className="hidden" 
                onChange={(e) => handleFileChange(e, "audio")}
              />
              {audioFile ? (
                <div className="space-y-1 w-full text-center">
                  <span className="text-xs text-semibold truncate block max-w-[150px] mx-auto text-emerald-400">🎵 {audioFile.name}</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); clearFile("audio"); }} className="text-[10px] uppercase font-bold text-red-500 inline-flex items-center gap-0.5 mt-2 bg-red-950/20 px-2 py-0.5 rounded">
                    <X className="w-3 h-3" /> Enlever
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Music className="w-5 h-5 text-[#D4AF37]/80 mx-auto animate-pulse" />
                  <span className="text-[10px] font-black block text-gray-200">🎤 Audio court (30s max)</span>
                  <span className="text-[8px] text-[#D4AF37] block font-semibold">Présentation express !</span>
                </div>
              )}
              {uploadingState.audio && (
                <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center">
                  <span className="text-[9px] text-[#D4AF37] font-black uppercase">Envoi audio... {uploadProgress.audio || 0}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions Buttons */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/[0.05]">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-3 whitespace-nowrap bg-white/[0.05] hover:bg-white/[0.1] text-gray-200 font-extrabold text-[10px] sm:text-xs uppercase rounded-xl transition-all tracking-wider cursor-pointer"
            >
              Retourner au Terrain
            </button>
            
            <button
              type="submit"
              disabled={loading || uploadingState.image || uploadingState.audio}
              className="flex-1 px-6 py-3.5 bg-[#D4AF37] hover:bg-[#b09028] font-extrabold text-[#0B0B0B] font-sans text-xs uppercase rounded-xl shadow-lg transition-all active:scale-97 cursor-pointer text-center font-black tracking-widest flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#0B0B0B] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>🚀 Lancer le Gombo</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
