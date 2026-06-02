import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, Clock, DollarSign, MapPin, AlignLeft, Users, Zap, Check, 
  Music, Film, Volume2, Image as ImageIcon, Briefcase, MessageSquare, 
  Upload, X, AlertCircle 
} from "lucide-react";
import { gomboDB } from "../firebase";
import { UserProfile, SocialPost } from "../types";

const ABIDJAN_COMMUNES = [
  "Cocody", "Yopougon", "Marcory", "Plateau", "Treichville", "Abobo", 
  "Koumassi", "Adjamé", "Port-Bouët", "Attécoubé", "Grand-Bassam", "Bingerville"
];

const SPECIALTIES = [
  "Chanteur(se)", "Rappeur(se)", "Guitare Solo", "Guitare Basse", 
  "Batterie", "Piano / Clavier", "Saxophone", "Ingénieur Son", 
  "Beatmaker", "DJ", "Chœur", "Cuivres", "Percussions"
];

const MUSIC_GENRES = [
  "Coupé-Décalé", "Zouglou", "Afrobeats", "Rap Ivoire", "Reggae", 
  "Rumba Congolaise", "Soukous", "Jazz / Soul", "Gospel", "Traditionnel"
];

const AVAILABILITY_OPTIONS = [
  "Disponible Immédiatement",
  "Disponible les Weekends",
  "Soirées uniquement",
  "Disponible pour Répétitions",
  "Sur Réservation exclusive"
];

interface GomboPublishProps {
  currentUserProfile: UserProfile;
  onSuccess: () => void;
  onCancel: () => void;
}

type PublishType = "gombo" | "demo" | "annonce";

export default function GomboPublish({ currentUserProfile, onSuccess, onCancel }: GomboPublishProps) {
  const [pubType, setPubType] = useState<PublishType>("gombo");

  // General fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [commune, setCommune] = useState("Cocody");

  // Gombo specific
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [budget, setBudget] = useState<string>("");
  const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
  const [urgent, setUrgent] = useState(false);

  // Démo specific
  const [genre, setGenre] = useState(MUSIC_GENRES[0]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Annonce specific
  const [annonceSpecialty, setAnnonceSpecialty] = useState(SPECIALTIES[0]);
  const [availability, setAvailability] = useState(AVAILABILITY_OPTIONS[0]);

  // Upload progress and loading states
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadingState, setUploadingState] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState("");

  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Handle Drag & Drop events
  const [dragActive, setDragActive] = useState<{ [key: string]: boolean }>({});

  const handleDrag = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(prev => ({ ...prev, [type]: true }));
    } else if (e.type === "dragleave") {
      setDragActive(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleDrop = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (type === "image") setImageFile(file);
      if (type === "audio") setAudioFile(file);
      if (type === "video") setVideoFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (type === "image") setImageFile(file);
      if (type === "audio") setAudioFile(file);
      if (type === "video") setVideoFile(file);
    }
  };

  const clearFile = (type: string) => {
    if (type === "image") {
      setImageFile(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
    if (type === "audio") {
      setAudioFile(null);
      if (audioInputRef.current) audioInputRef.current.value = "";
    }
    if (type === "video") {
      setVideoFile(null);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMSG("");
    setLoading(true);

    if (!title.trim() || !description.trim()) {
      setErrorMSG("Veuillez remplir le titre et la description !");
      setLoading(false);
      return;
    }

    try {
      let uploadedImageUrl = "";
      let uploadedAudioUrl = "";
      let uploadedVideoUrl = "";

      const authorName = `${currentUserProfile.firstName} ${currentUserProfile.lastName}`.trim() || "Artiste Privé";
      const authorPhoto = currentUserProfile.avatarUrl || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=150";

      // 1. Upload files if present
      if (imageFile) {
        setUploadingState(p => ({ ...p, image: true }));
        uploadedImageUrl = await gomboDB.uploadFile(
          `posts_assets/images/${Date.now()}_${imageFile.name}`,
          imageFile,
          (pct) => setUploadProgress(p => ({ ...p, image: Math.round(pct) }))
        );
        setUploadingState(p => ({ ...p, image: false }));
      }

      if (audioFile) {
        setUploadingState(p => ({ ...p, audio: true }));
        uploadedAudioUrl = await gomboDB.uploadFile(
          `posts_assets/audios/${Date.now()}_${audioFile.name}`,
          audioFile,
          (pct) => setUploadProgress(p => ({ ...p, audio: Math.round(pct) }))
        );
        setUploadingState(p => ({ ...p, audio: false }));
      }

      if (videoFile) {
        setUploadingState(p => ({ ...p, video: true }));
        uploadedVideoUrl = await gomboDB.uploadFile(
          `posts_assets/videos/${Date.now()}_${videoFile.name}`,
          videoFile,
          (pct) => setUploadProgress(p => ({ ...p, video: Math.round(pct) }))
        );
        setUploadingState(p => ({ ...p, video: false }));
      }

      // 2. Prepare payload matching both SocialPost and user Firestore custom properties
      const postPayload: Omit<SocialPost, "id" | "createdAt" | "likesCount" | "sharesCount" | "savesCount" | "likedBy" | "savedBy" | "comments"> = {
        userId: currentUserProfile.uid,
        userName: authorName,
        userAvatar: authorPhoto,
        userRole: currentUserProfile.role || "musicien",
        title: title.trim(),
        caption: description.trim(),
        tags: [pubType, commune],
        
        // MVP properties
        type: pubType,
        authorId: currentUserProfile.uid,
        authorName: authorName,
        authorPhoto: authorPhoto,
        description: description.trim(),
        commune: commune,
        imageUrl: uploadedImageUrl || (pubType === "demo" ? "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400" : undefined),
        audioUrl: uploadedAudioUrl || undefined,
        videoUrl: uploadedVideoUrl || undefined,
        mediaUrl: uploadedImageUrl || uploadedAudioUrl || uploadedVideoUrl || "",
        budget: pubType === "gombo" ? (Number(budget) || 25000) : undefined,
        specialty: pubType === "gombo" ? specialty : (pubType === "annonce" ? annonceSpecialty : undefined),
        urgent: pubType === "gombo" ? urgent : undefined,
        genre: pubType === "demo" ? genre : undefined,
        availability: pubType === "annonce" ? availability : undefined,
        commentsCount: 0
      };

      // Publish in system posts (Le Terrain)
      const publishedPost = await gomboDB.publishSocialPost(postPayload);

      // If publication is a Gombo, also publish it specifically inside the Gombos market list 
      // ensuring unified listings behavior
      if (pubType === "gombo") {
        await gomboDB.publishGombo({
          clientId: currentUserProfile.uid,
          clientName: authorName,
          title: title.trim(),
          description: description.trim(),
          location: "Abidjan, commune de " + commune,
          commune: commune,
          date: date || new Date().toISOString().split("T")[0],
          time: time || "19:00",
          budget: Number(budget) || 25000,
          eventType: "Contrat Artiste / Gombo",
          musiciansCount: 1,
          urgent: urgent
        });
      }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMSG("Quelque chose s'est mal passé lors de la publication. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-2">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#1e1e24] rounded-3xl p-6 sm:p-8 border border-gray-150 dark:border-gray-800 shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2 tracking-tight uppercase">
            <Music className="w-6 h-6 text-[#FF7A00]" />
            Lancer un Gombo
          </h2>
          <p className="text-xs font-bold text-gray-500 mt-1">
            Exprimez-vous sur les ondes du showbiz ! Choisissez votre type de publication pour toucher le réseau instantanément.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-2.5 bg-gray-50 dark:bg-gray-900/60 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800/60 mb-6">
          <button
            type="button"
            onClick={() => { setPubType("gombo"); setErrorMSG(""); }}
            className={`py-3.5 px-3 rounded-xl font-extrabold text-xs uppercase flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
              pubType === "gombo" 
                ? "bg-[#FF7A00] text-white shadow-sm" 
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">💼 Gombo</span>
          </button>

          <button
            type="button"
            onClick={() => { setPubType("demo"); setErrorMSG(""); }}
            className={`py-3.5 px-3 rounded-xl font-extrabold text-xs uppercase flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
              pubType === "demo" 
                ? "bg-[#7C3AED] text-white shadow-sm" 
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <Music className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">🎵 Démo</span>
          </button>

          <button
            type="button"
            onClick={() => { setPubType("annonce"); setErrorMSG(""); }}
            className={`py-3.5 px-3 rounded-xl font-extrabold text-xs uppercase flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
              pubType === "annonce" 
                ? "bg-teal-600 text-white shadow-sm" 
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">📢 Annonce</span>
          </button>
        </div>

        {errorMSG && (
          <div className="mb-5 p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 font-bold text-xs rounded-2xl border border-red-100 dark:border-red-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            {errorMSG}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Form Banner Help text */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 text-[11px] text-gray-500 leading-relaxed font-semibold">
            {pubType === "gombo" && "Proposez un cachet et recrutez des musiciens professionnels d'Abidjan. S'affichera également sur Le Terrain."}
            {pubType === "demo" && "Partagez vos meilleures performances au Showcase du Coin (audio, vidéo, prod, etc.) pour attirer les contrats !"}
            {pubType === "annonce" && "Faites part de votre disponibilité, annoncez un projet, recherchez un groupe ou des contacts showbizz."}
          </div>

          {/* Title */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wider">
              {pubType === "gombo" ? "Titre de la Prestation" : pubType === "demo" ? "Titre de votre Démo" : "Sujet de votre Annonce"}
            </label>
            <input
              type="text"
              required
              placeholder={
                pubType === "gombo" 
                  ? "e.g. Recherche Pianiste Jazz d'urgence pour cabaret" 
                  : pubType === "demo" 
                  ? "e.g. Improvisation Solo Saxophone - Afro-Zouk" 
                  : "e.g. Chanteur lead cherche groupe de variétés Zouglou"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3.5 bg-gray-50/60 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF7A00] dark:focus:ring-[#7C3AED] focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white placeholder-gray-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wider">Description</label>
            <div className="relative">
              <span className="absolute top-3.5 left-3.5 text-gray-400">
                <AlignLeft className="w-4 h-4" />
              </span>
              <textarea
                rows={4}
                required
                placeholder={
                  pubType === "gombo" 
                    ? "Décrivez le rôle, les morceaux, les dates de répétition, l'équipement sur place, l'uniforme, etc..."
                    : pubType === "demo"
                    ? "Racontez l'histoire de cette décomposition musicale, les instruments joués, ou mentionnez les collaborations..."
                    : "Expliquez précisément votre offre, votre niveau d'expérience, les styles maîtrisés, ou vos coordonnées de contact..."
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-gray-50/60 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF7A00] dark:focus:ring-[#7C3AED] focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Commune (Common for Gombo and Annonce) */}
          {(pubType === "gombo" || pubType === "annonce") && (
            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wider">Commune d'Abidjan</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <MapPin className="w-4 h-4" />
                </span>
                <select
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50/60 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white cursor-pointer"
                >
                  {ABIDJAN_COMMUNES.map((com) => (
                    <option key={com} value={com}>{com}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* TYPE 1: GOMBO DETAILS */}
          {pubType === "gombo" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wider">Spécialité Recherchée</label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50/60 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white cursor-pointer"
                  >
                    {SPECIALTIES.map((sp) => (
                      <option key={sp} value={sp}>{sp}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wider">Cachet Proposé (FCFA)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#FF7A00] font-black text-xs">
                      FCFA
                    </span>
                    <input
                      type="number"
                      required
                      min={1000}
                      placeholder="e.g. 50000"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full pl-14 pr-4 py-3.5 bg-gray-50/60 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wider">Date du Show</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 bg-gray-50/60 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wider">Heure du show</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                      <Clock className="w-4 h-4" />
                    </span>
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 bg-gray-50/60 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Urgent Flag toggle */}
              <div className="bg-orange-50/40 dark:bg-orange-950/15 p-4 rounded-2xl border border-orange-100/60 dark:border-orange-950 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100/80 dark:bg-orange-950/80 rounded-xl text-[#FF7A00]">
                      <Zap className="w-4.5 h-4.5 fill-current" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <span>Publication Urgente</span>
                        <span className="text-[9px] font-black uppercase bg-red-500 text-white px-1.5 py-0.5 rounded leading-none">🚨 URGENT</span>
                      </h4>
                      <p className="text-[10px] text-gray-500">S'affiche en haut de liste. Tarification de lancement simulée : 1 000 FCFA</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={urgent}
                      onChange={(e) => setUrgent(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5.5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-750 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all dark:border-gray-600 peer-checked:bg-[#FF7A00]" />
                  </label>
                </div>
                {urgent && (
                  <div className="text-[10px] text-orange-600 dark:text-orange-400 font-bold border-t border-orange-200/40 dark:border-orange-950/40 pt-2 bg-[#FF7A00]/5 p-2 rounded-lg text-center">
                    ⚡ Mode Urgent Actif ! Simulé à 1 000 FCFA de gombo. (La facturation réelle n'est pas encore imposée).
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TYPE 2: DÉMO MUSICALE */}
          {pubType === "demo" && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wider">Genre Musical de la Démo</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50/60 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:bg-white dark:focus:bg-[#1e1e24] cursor-pointer"
                >
                  {MUSIC_GENRES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Drag/Drop Upload Area for Cover image, Audio track and Video */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Image cover Upload */}
                <div 
                  onDragEnter={(e) => handleDrag(e, "image")}
                  onDragOver={(e) => handleDrag(e, "image")}
                  onDragLeave={(e) => handleDrag(e, "image")}
                  onDrop={(e) => handleDrop(e, "image")}
                  className={`border-2 border-dashed p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px] transition-all relative overflow-hidden ${
                    dragActive.image 
                      ? "border-[#7C3AED] bg-purple-500/5" 
                      : "border-gray-150 dark:border-gray-850 hover:border-gray-350 dark:hover:border-gray-700 bg-gray-50/40 dark:bg-gray-850/20"
                  }`}
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
                    <div className="space-y-2 w-full">
                      <div className="p-2 bg-purple-100 dark:bg-purple-950/40 text-[#7C3AED] rounded-full w-fit mx-auto">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <p className="text-[10px] font-bold text-gray-800 dark:text-gray-200 truncate w-full px-2">{imageFile.name}</p>
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); clearFile("image"); }}
                        className="p-1 text-red-500 bg-red-50 hover:bg-red-100 rounded-full text-[9px] font-bold uppercase transition-colors px-2 inline-flex items-center gap-0.5"
                      >
                        <X className="w-3 h-3" /> Retirer
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <ImageIcon className="w-6 h-6 text-gray-400 mx-auto" />
                      <span className="text-[10px] font-black text-gray-950 dark:text-gray-200">Illustration</span>
                      <span className="text-[8px] text-gray-450 block font-semibold">Mock ou Image JPG, PNG</span>
                    </div>
                  )}
                  {uploadingState.image && (
                    <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex flex-col items-center justify-center px-4">
                      <div className="text-[10px] font-black text-[#7C3AED] mb-1">Téléversement...</div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#7C3AED] h-full" style={{ width: `${uploadProgress.image || 0}%` }}></div>
                      </div>
                      <span className="text-[8px] mt-1 font-mono">{uploadProgress.image || 0}%</span>
                    </div>
                  )}
                </div>

                {/* 2. Audio Track Upload */}
                <div 
                  onDragEnter={(e) => handleDrag(e, "audio")}
                  onDragOver={(e) => handleDrag(e, "audio")}
                  onDragLeave={(e) => handleDrag(e, "audio")}
                  onDrop={(e) => handleDrop(e, "audio")}
                  className={`border-2 border-dashed p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px] transition-all relative overflow-hidden ${
                    dragActive.audio 
                      ? "border-[#7C3AED] bg-purple-500/5" 
                      : "border-gray-150 dark:border-gray-850 hover:border-gray-350 dark:hover:border-gray-700 bg-gray-50/40 dark:bg-gray-850/20"
                  }`}
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
                    <div className="space-y-2 w-full">
                      <div className="p-2 bg-purple-100 dark:bg-purple-950/40 text-[#7C3AED] rounded-full w-fit mx-auto">
                        <Volume2 className="w-5 h-5" />
                      </div>
                      <p className="text-[10px] font-bold text-gray-800 dark:text-gray-200 truncate w-full px-2">{audioFile.name}</p>
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); clearFile("audio"); }}
                        className="p-1 text-red-500 bg-red-50 hover:bg-red-100 rounded-full text-[9px] font-bold uppercase transition-colors px-2 inline-flex items-center gap-0.5"
                      >
                        <X className="w-3 h-3" /> Retirer
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Volume2 className="w-6 h-6 text-gray-400 mx-auto" />
                      <span className="text-[10px] font-black text-gray-950 dark:text-gray-200">Fichier Audio</span>
                      <span className="text-[8px] text-gray-450 block font-semibold">Titre ou voix MP3, WAV</span>
                    </div>
                  )}
                  {uploadingState.audio && (
                    <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex flex-col items-center justify-center px-4">
                      <div className="text-[10px] font-black text-[#7C3AED] mb-1">Téléversement...</div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#7C3AED] h-full" style={{ width: `${uploadProgress.audio || 0}%` }}></div>
                      </div>
                      <span className="text-[8px] mt-1 font-mono">{uploadProgress.audio || 0}%</span>
                    </div>
                  )}
                </div>

                {/* 3. Video Track Upload */}
                <div 
                  onDragEnter={(e) => handleDrag(e, "video")}
                  onDragOver={(e) => handleDrag(e, "video")}
                  onDragLeave={(e) => handleDrag(e, "video")}
                  onDrop={(e) => handleDrop(e, "video")}
                  className={`border-2 border-dashed p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px] transition-all relative overflow-hidden ${
                    dragActive.video 
                      ? "border-[#7C3AED] bg-purple-500/5" 
                      : "border-gray-150 dark:border-gray-850 hover:border-gray-350 dark:hover:border-gray-700 bg-gray-50/40 dark:bg-gray-850/20"
                  }`}
                  onClick={() => videoInputRef.current?.click()}
                >
                  <input 
                    ref={videoInputRef}
                    type="file" 
                    accept="video/*" 
                    className="hidden" 
                    onChange={(e) => handleFileChange(e, "video")}
                  />
                  {videoFile ? (
                    <div className="space-y-2 w-full">
                      <div className="p-2 bg-purple-100 dark:bg-purple-950/40 text-[#7C3AED] rounded-full w-fit mx-auto">
                        <Film className="w-5 h-5" />
                      </div>
                      <p className="text-[10px] font-bold text-gray-800 dark:text-gray-200 truncate w-full px-2">{videoFile.name}</p>
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); clearFile("video"); }}
                        className="p-1 text-red-500 bg-red-50 hover:bg-red-100 rounded-full text-[9px] font-bold uppercase transition-colors px-2 inline-flex items-center gap-0.5"
                      >
                        <X className="w-3 h-3" /> Retirer
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Film className="w-6 h-6 text-gray-400 mx-auto" />
                      <span className="text-[10px] font-black text-gray-950 dark:text-gray-200">Clip / Vidéo</span>
                      <span className="text-[8px] text-gray-450 block font-semibold">Prestation Live MP4</span>
                    </div>
                  )}
                  {uploadingState.video && (
                    <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex flex-col items-center justify-center px-4">
                      <div className="text-[10px] font-black text-[#7C3AED] mb-1">Téléversement...</div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#7C3AED] h-full" style={{ width: `${uploadProgress.video || 0}%` }}></div>
                      </div>
                      <span className="text-[8px] mt-1 font-mono">{uploadProgress.video || 0}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TYPE 3: ANNONCE ARTISTE */}
          {pubType === "annonce" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wider">Votre Spécialité</label>
                  <select
                    value={annonceSpecialty}
                    onChange={(e) => setAnnonceSpecialty(e.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50/60 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:focus:bg-[#1e1e24] cursor-pointer"
                  >
                    {SPECIALTIES.map((sp) => (
                      <option key={sp} value={sp}>{sp}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wider">Disponibilité</label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50/60 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:focus:bg-[#1e1e24] cursor-pointer"
                  >
                    {AVAILABILITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-650 dark:text-gray-300 font-extrabold text-xs uppercase rounded-xl transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || Object.values(uploadingState).some(Boolean)}
              className={`px-8 py-3 bg-gradient-to-r text-white font-extrabold text-xs uppercase rounded-xl shadow-md transition-all active:scale-98 flex items-center gap-2 ${
                pubType === "gombo" 
                  ? "from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/10" 
                  : pubType === "demo"
                  ? "from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-600/10"
                  : "from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-teal-600/10"
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3px]" />
                  Publier Maintenant
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
