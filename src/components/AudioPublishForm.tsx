import React, { useState, useRef } from "react";
import { Music, Mic, Globe, MapPin, FileText, Tag, Upload, Image as ImageIcon, Video, Lock, CheckSquare, Square, Play, Pause, Trash2, Edit3, Crop, AlertCircle, Sparkles, Check } from "lucide-react";
import { gomboDB } from "../firebase";

interface AudioPublishFormProps {
  currentUserProfile: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AudioPublishForm({
  currentUserProfile,
  onSuccess,
  onCancel
}: AudioPublishFormProps) {
  // Main fields
  const [titre, setTitre] = useState("");
  const [artiste, setArtiste] = useState(currentUserProfile?.name || currentUserProfile?.displayName || "");
  const [genre, setGenre] = useState("Afrobeat");
  const [pays, setPays] = useState("Côte d'Ivoire");
  const [ville, setVille] = useState("Abidjan");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  
  // Files
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioDuration, setAudioDuration] = useState<string>("0:00");
  const [audioSize, setAudioSize] = useState<string>("");
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState("");
  const [isCroppingCover, setIsCroppingCover] = useState(false);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");

  // Visibilite & Droits
  const [visibilite, setVisibilite] = useState<"public" | "prive" | "abonnes">("public");
  const [rightsConfirmed, setRightsConfirmed] = useState(false);

  // Optional fields
  const [compositeur, setCompositeur] = useState("");
  const [auteurText, setAuteurText] = useState("");
  const [producteur, setProducteur] = useState("");
  const [studio, setStudio] = useState("");
  const [annee, setAnnee] = useState(new Date().getFullYear().toString());
  const [album, setAlbum] = useState("");
  const [numeroPiste, setNumeroPiste] = useState("1");
  const [langue, setLangue] = useState("Français / Langues locales");

  // State loading & success
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState(false);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFile(file);
    setAudioSize((file.size / (1024 * 1024)).toFixed(1) + " MB");

    // Create object URL for local audio player preview
    const objUrl = URL.createObjectURL(file);
    setAudioUrl(objUrl);

    // Estimate duration
    const audioObj = new Audio(objUrl);
    audioObj.onloadedmetadata = () => {
      const mins = Math.floor(audioObj.duration / 60);
      const secs = Math.floor(audioObj.duration % 60);
      setAudioDuration(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
    };
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverUrl(URL.createObjectURL(file));
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) {
      setErrorMessage("Veuillez indiquer le titre du morceau.");
      return;
    }
    if (!artiste.trim()) {
      setErrorMessage("Veuillez indiquer le nom de l'artiste.");
      return;
    }
    if (!audioFile && !audioUrl) {
      setErrorMessage("Veuillez importer un fichier audio.");
      return;
    }
    if (!rightsConfirmed) {
      setErrorMessage("Vous devez confirmer être propriétaire ou autorisé à publier ce contenu.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      setUploadProgress(20);
      let finalAudioUrl = audioUrl;
      if (audioFile) {
        setUploadProgress(40);
        finalAudioUrl = await gomboDB.uploadFile(audioFile, `audio_publications/audio_${Date.now()}_${audioFile.name}`);
      }

      let finalCoverUrl = coverUrl;
      if (coverFile) {
        setUploadProgress(60);
        finalCoverUrl = await gomboDB.uploadFile(coverFile, `audio_publications/cover_${Date.now()}_${coverFile.name}`);
      }

      let finalVideoUrl = videoUrl;
      if (videoFile) {
        setUploadProgress(80);
        finalVideoUrl = await gomboDB.uploadFile(videoFile, `audio_publications/video_${Date.now()}_${videoFile.name}`);
      }

      setUploadProgress(90);
      const tagsArray = tagsInput
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const payload = {
        titre: titre.trim(),
        artiste: artiste.trim(),
        genre,
        pays,
        ville,
        description: description.trim(),
        tags: tagsArray,
        coverUrl: finalCoverUrl || "",
        audioUrl: finalAudioUrl || "",
        videoUrl: finalVideoUrl || "",
        album: album.trim(),
        compositeur: compositeur.trim(),
        auteur: auteurText.trim(),
        producteur: producteur.trim(),
        studio: studio.trim(),
        annee,
        numeroPiste,
        langue,
        visibilite,
        ownerId: currentUserProfile?.uid || "anonymous",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likes: 0,
        lectures: 0,
        partages: 0,
        commentaires: []
      };

      // Save to Firestore collection "audio_publications"
      await gomboDB.createAudioPublication(payload);

      setUploadProgress(100);
      setSuccessMessage(true);
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err: any) {
      console.error("Error publishing audio:", err);
      setErrorMessage(err.message || "Erreur lors de la publication audio.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 bg-afri-bg-sec border border-afri-border rounded-3xl shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-afri-border pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center text-[#D4AF37]">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black uppercase tracking-wide text-afri-text">
              Publier un Morceau Audio
            </h2>
            <p className="text-xs text-afri-text-sec">
              Diffusion et catalogue indépendant AFRIGOMBO ELITE AUDIO (Collection exclusive)
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-xs font-bold text-afri-text-sec hover:text-afri-text px-3 py-1.5 bg-afri-bg rounded-xl border border-afri-border cursor-pointer"
        >
          Annuler
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-sm text-emerald-400 font-bold">
          <Check className="w-5 h-5 shrink-0" />
          <span>Morceau audio publié avec succès dans "audio_publications" !</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. FICHIER AUDIO + LECTEUR INTÉGRÉ */}
        <div className="space-y-3 p-4 bg-afri-bg border border-afri-border rounded-2xl">
          <label className="text-xs font-bold text-afri-text uppercase tracking-wide flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#D4AF37]" />
            Import du Fichier Audio (Requis)
          </label>
          <input
            type="file"
            ref={audioInputRef}
            accept="audio/*"
            onChange={handleAudioSelect}
            className="hidden"
          />

          {!audioFile && !audioUrl ? (
            <div
              onClick={() => audioInputRef.current?.click()}
              className="border-2 border-dashed border-afri-border hover:border-[#D4AF37] rounded-2xl p-6 text-center cursor-pointer transition space-y-2 group"
            >
              <Music className="w-8 h-8 text-[#D4AF37] mx-auto group-hover:scale-110 transition" />
              <div>
                <p className="text-xs font-bold text-afri-text">Cliquez pour importer votre fichier audio</p>
                <p className="text-[10px] text-afri-text-sec mt-0.5">MP3, WAV, AAC, FLAC (Max 50Mo)</p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-afri-bg-sec border border-[#D4AF37]/50 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] shrink-0">
                  <Music className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-afri-text truncate">
                    {audioFile?.name || "Fichier audio sélectionné"}
                  </p>
                  <p className="text-[10px] text-afri-text-sec flex items-center gap-2 mt-0.5">
                    <span>Durée: {audioDuration}</span>
                    {audioSize && <span>• Taille: {audioSize}</span>}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <audio
                  ref={audioElementRef}
                  src={audioUrl}
                  onEnded={() => setIsPlayingPreview(false)}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!audioElementRef.current) return;
                    if (isPlayingPreview) {
                      audioElementRef.current.pause();
                      setIsPlayingPreview(false);
                    } else {
                      audioElementRef.current.play();
                      setIsPlayingPreview(true);
                    }
                  }}
                  className="p-2.5 bg-[#D4AF37] text-black rounded-xl hover:bg-amber-400 transition cursor-pointer"
                  title={isPlayingPreview ? "Pause" : "Lecture"}
                >
                  {isPlayingPreview ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAudioFile(null);
                    setAudioUrl("");
                    setIsPlayingPreview(false);
                  }}
                  className="p-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-xl hover:bg-rose-500/20 transition cursor-pointer"
                  title="Supprimer le fichier"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. INFORMATIONS PRINCIPALES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-afri-text uppercase tracking-wide">
              🎵 Titre du morceau *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Gombo Dance Anthem"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              className="w-full p-3 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-afri-text uppercase tracking-wide">
              🎤 Artiste / Groupe *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: DJ Gombo & les Stars"
              value={artiste}
              onChange={(e) => setArtiste(e.target.value)}
              className="w-full p-3 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-afri-text uppercase tracking-wide">
              🎼 Genre musical
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full p-3 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="Afrobeat">Afrobeat</option>
              <option value="Mbalax">Mbalax</option>
              <option value="Bikutsi">Bikutsi</option>
              <option value="Zoblazo">Zoblazo</option>
              <option value="Coupé-Décalé">Coupé-Décalé</option>
              <option value="Amapiano">Amapiano</option>
              <option value="R&B / Soul">R&B / Soul</option>
              <option value="Rap / Hip-Hop">Rap / Hip-Hop</option>
              <option value="Gospel">Gospel</option>
              <option value="Traditionnel">Traditionnel</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-afri-text uppercase tracking-wide">
              🌍 Pays
            </label>
            <input
              type="text"
              value={pays}
              onChange={(e) => setPays(e.target.value)}
              className="w-full p-3 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-afri-text uppercase tracking-wide">
              🏙 Ville
            </label>
            <input
              type="text"
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              className="w-full p-3 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-afri-text uppercase tracking-wide">
            📝 Description
          </label>
          <textarea
            rows={3}
            placeholder="Racontez l'histoire de ce morceau, l'inspiration ou le contexte de création..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text focus:outline-none focus:border-[#D4AF37] resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-afri-text uppercase tracking-wide flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
            Tags (séparés par des virgules)
          </label>
          <input
            type="text"
            placeholder="Ex: danse, abidjan, hit2026, kora"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full p-3 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        {/* 3. IMAGE DE COUVERTURE & CLIP VIDÉO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Image de couverture */}
          <div className="p-4 bg-afri-bg border border-afri-border rounded-2xl space-y-3">
            <label className="text-xs font-bold text-afri-text uppercase tracking-wide flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#D4AF37]" />
              Image de Couverture (Pochette)
            </label>
            <input
              type="file"
              ref={coverInputRef}
              accept="image/*"
              onChange={handleCoverSelect}
              className="hidden"
            />

            {!coverUrl ? (
              <div
                onClick={() => coverInputRef.current?.click()}
                className="border-2 border-dashed border-afri-border hover:border-[#D4AF37] rounded-xl p-4 text-center cursor-pointer transition"
              >
                <ImageIcon className="w-6 h-6 text-[#D4AF37] mx-auto mb-1" />
                <span className="text-[11px] font-bold text-afri-text">Choisir une pochette</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative w-full h-36 rounded-xl overflow-hidden border border-afri-border">
                  <img src={coverUrl} alt="Pochette" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[9px] text-[#D4AF37] font-bold">
                    Pochette OK
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="flex-1 py-1.5 bg-afri-bg-sec border border-afri-border text-[10px] font-bold rounded-lg hover:border-[#D4AF37] transition cursor-pointer"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCroppingCover(true)}
                    className="py-1.5 px-3 bg-afri-bg-sec border border-afri-border text-[10px] font-bold rounded-lg hover:border-[#D4AF37] transition cursor-pointer flex items-center gap-1"
                  >
                    <Crop className="w-3 h-3 text-[#D4AF37]" />
                    Recadrer
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCoverFile(null); setCoverUrl(""); }}
                    className="py-1.5 px-3 bg-rose-500/10 border border-rose-500/30 text-[10px] font-bold text-rose-400 rounded-lg transition cursor-pointer"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )}
            {isCroppingCover && (
              <div className="p-3 bg-afri-bg-sec border border-[#D4AF37] rounded-xl space-y-2 animate-fadeIn">
                <span className="text-[10px] font-bold text-[#D4AF37]">Outil de Recadrage Pochette (Carré 1:1)</span>
                <p className="text-[10px] text-afri-text-sec">Ajustement de l'image de couverture validé pour l'affichage mobile & desktop.</p>
                <button
                  type="button"
                  onClick={() => setIsCroppingCover(false)}
                  className="w-full py-1.5 bg-[#D4AF37] text-black font-bold text-[10px] rounded-lg cursor-pointer"
                >
                  Appliquer le recadrage
                </button>
              </div>
            )}
          </div>

          {/* Clip vidéo facultatif */}
          <div className="p-4 bg-afri-bg border border-afri-border rounded-2xl space-y-3">
            <label className="text-xs font-bold text-afri-text uppercase tracking-wide flex items-center gap-2">
              <Video className="w-4 h-4 text-[#D4AF37]" />
              Clip Vidéo (Facultatif)
            </label>
            <input
              type="file"
              ref={videoInputRef}
              accept="video/*"
              onChange={handleVideoSelect}
              className="hidden"
            />
            {!videoUrl ? (
              <div
                onClick={() => videoInputRef.current?.click()}
                className="border-2 border-dashed border-afri-border hover:border-[#D4AF37] rounded-xl p-4 text-center cursor-pointer transition"
              >
                <Video className="w-6 h-6 text-[#D4AF37] mx-auto mb-1" />
                <span className="text-[11px] font-bold text-afri-text">Ajouter un clip vidéo</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative w-full h-36 rounded-xl overflow-hidden border border-afri-border bg-black flex items-center justify-center">
                  <span className="text-xs text-emerald-400 font-bold">Vidéo chargée avec succès</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setVideoFile(null); setVideoUrl(""); }}
                  className="w-full py-1.5 bg-rose-500/10 border border-rose-500/30 text-[10px] font-bold text-rose-400 rounded-lg transition cursor-pointer"
                >
                  Supprimer la vidéo
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 4. CHAMPS OPTIONNELS */}
        <div className="p-4 bg-afri-bg border border-afri-border rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
            ⚙️ Informations Techniques & Crédits (Optionnel)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] text-afri-text-muted font-bold mb-1">Compositeur</label>
              <input
                type="text"
                value={compositeur}
                onChange={(e) => setCompositeur(e.target.value)}
                placeholder="Ex: Nom"
                className="w-full p-2.5 bg-afri-bg-sec border border-afri-border rounded-xl text-xs text-afri-text"
              />
            </div>
            <div>
              <label className="block text-[10px] text-afri-text-muted font-bold mb-1">Auteur</label>
              <input
                type="text"
                value={auteurText}
                onChange={(e) => setAuteurText(e.target.value)}
                placeholder="Ex: Nom"
                className="w-full p-2.5 bg-afri-bg-sec border border-afri-border rounded-xl text-xs text-afri-text"
              />
            </div>
            <div>
              <label className="block text-[10px] text-afri-text-muted font-bold mb-1">Producteur</label>
              <input
                type="text"
                value={producteur}
                onChange={(e) => setProducteur(e.target.value)}
                placeholder="Ex: Label"
                className="w-full p-2.5 bg-afri-bg-sec border border-afri-border rounded-xl text-xs text-afri-text"
              />
            </div>
            <div>
              <label className="block text-[10px] text-afri-text-muted font-bold mb-1">Studio</label>
              <input
                type="text"
                value={studio}
                onChange={(e) => setStudio(e.target.value)}
                placeholder="Ex: Studio A"
                className="w-full p-2.5 bg-afri-bg-sec border border-afri-border rounded-xl text-xs text-afri-text"
              />
            </div>
            <div>
              <label className="block text-[10px] text-afri-text-muted font-bold mb-1">Année</label>
              <input
                type="text"
                value={annee}
                onChange={(e) => setAnnee(e.target.value)}
                className="w-full p-2.5 bg-afri-bg-sec border border-afri-border rounded-xl text-xs text-afri-text"
              />
            </div>
            <div>
              <label className="block text-[10px] text-afri-text-muted font-bold mb-1">Album</label>
              <input
                type="text"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                placeholder="Ex: Nom album"
                className="w-full p-2.5 bg-afri-bg-sec border border-afri-border rounded-xl text-xs text-afri-text"
              />
            </div>
            <div>
              <label className="block text-[10px] text-afri-text-muted font-bold mb-1">N° de piste</label>
              <input
                type="text"
                value={numeroPiste}
                onChange={(e) => setNumeroPiste(e.target.value)}
                className="w-full p-2.5 bg-afri-bg-sec border border-afri-border rounded-xl text-xs text-afri-text"
              />
            </div>
            <div>
              <label className="block text-[10px] text-afri-text-muted font-bold mb-1">Langue</label>
              <input
                type="text"
                value={langue}
                onChange={(e) => setLangue(e.target.value)}
                className="w-full p-2.5 bg-afri-bg-sec border border-afri-border rounded-xl text-xs text-afri-text"
              />
            </div>
          </div>
        </div>

        {/* 5. VISIBILITÉ & DROITS D'AUTEUR */}
        <div className="space-y-4 p-4 bg-afri-bg border border-afri-border rounded-2xl">
          <div className="space-y-2">
            <label className="text-xs font-bold text-afri-text uppercase tracking-wide flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#D4AF37]" />
              Visibilité du Morceau
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "public", label: "Public 🌍" },
                { id: "abonnes", label: "Abonnés 👑" },
                { id: "prive", label: "Privé 🔒" }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setVisibilite(opt.id as any)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    visibilite === opt.id
                      ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                      : "bg-afri-bg-sec text-afri-text-sec border-afri-border hover:text-afri-text"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-afri-border">
            <label
              onClick={() => setRightsConfirmed(!rightsConfirmed)}
              className="flex items-start gap-2.5 text-xs text-afri-text cursor-pointer select-none"
            >
              {rightsConfirmed ? (
                <CheckSquare className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
              ) : (
                <Square className="w-5 h-5 text-afri-text-muted shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">
                <strong>Droits d'auteur :</strong> Je confirme être propriétaire ou autorisé à publier ce contenu musical sur la plateforme souveraine AFRIGOMBO ELITE.
              </span>
            </label>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="w-1/3 py-3 bg-afri-bg border border-afri-border hover:border-[#D4AF37] text-afri-text font-bold text-xs uppercase rounded-2xl transition cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`w-2/3 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              loading
                ? "bg-zinc-600 text-zinc-300 cursor-not-allowed opacity-50"
                : "bg-[#D4AF37] hover:bg-amber-400 text-black shadow-lg"
            }`}
          >
            {loading ? `Publication en cours (${uploadProgress}%)...` : "Publier le Morceau Audio 🎵"}
          </button>
        </div>
      </form>
    </div>
  );
}
