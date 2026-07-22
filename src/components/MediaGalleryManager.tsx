import React, { useState, useEffect } from "react";
import { Plus, Trash2, Play, Pause, ExternalLink, Video, FileText, Camera } from "lucide-react";
import { UserProfile } from "../types";
import { gomboDB } from "../firebase";

interface MediaGalleryManagerProps {
  currentUserProfile: UserProfile;
  mediaGallery: any[];
  onRefresh: () => void;
  onSetGallery: (gallery: any[]) => void;
}

export const MediaGalleryManager: React.FC<MediaGalleryManagerProps> = ({
  currentUserProfile,
  mediaGallery,
  onRefresh,
  onSetGallery
}) => {
  const [activeTab, setActiveTab] = useState<"photo" | "audio" | "youtube">("youtube");
  const [isOpen, setIsOpen] = useState(false);
  
  const [mediaType, setMediaType] = useState<"photo" | "audio" | "video" | "youtube">("youtube");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Audio Playback states
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [audioItem, setAudioItem] = useState<HTMLAudioElement | null>(null);
  
  // YouTube Lightbox states
  const [lightboxVideoId, setLightboxVideoId] = useState<string | null>(null);
  const [lightboxVideoUrl, setLightboxVideoUrl] = useState<string | null>(null);

  const getYoutubeId = (rawUrl: string) => {
    const url = typeof rawUrl === "string" ? rawUrl : String(rawUrl ?? "");
    let videoId = "";
    if (url.includes("youtube.com/watch")) {
      const parts = url.split("v=");
      if (parts[1]) videoId = parts[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
      const parts = url.split("youtu.be/");
      if (parts[1]) videoId = parts[1].split("?")[0];
    } else if (url.includes("youtube.com/embed/")) {
      const parts = url.split("youtube.com/embed/");
      if (parts[1]) videoId = parts[1].split("?")[0];
    }
    return videoId;
  };

  const toggleAudio = (url: string) => {
    if (playingUrl === url) {
      if (audioItem) {
        audioItem.pause();
        setPlayingUrl(null);
      }
    } else {
      if (audioItem) {
        audioItem.pause();
      }
      const newAudio = new Audio(url);
      newAudio.play().catch(e => console.warn("Audio autoplay blocked or failed:", e));
      setAudioItem(newAudio);
      setPlayingUrl(url);
      newAudio.onended = () => {
        setPlayingUrl(null);
      };
    }
  };

  useEffect(() => {
    return () => {
      if (audioItem) {
        audioItem.pause();
      }
    };
  }, [audioItem]);

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mediaType !== "youtube" && mediaFile) {
      setUploading(true);
      setProgress(0);
      try {
        const fileName = typeof mediaFile.name === "string" ? mediaFile.name : String(mediaFile.name ?? "");
        const ext = fileName.split(".").pop();
        const path = `portfolio/${currentUserProfile.uid}/${Date.now()}_portfolio.${ext}`;
        const url = await gomboDB.uploadFile(path, mediaFile, (p) => {
          setProgress(Math.round(p));
        });
        const newItem = {
          id: `portfolio_${Date.now()}`,
          type: mediaType,
          url,
          title: mediaTitle.trim() || `${mediaType.toUpperCase()} de l'artiste`
        };
        const updated = [...mediaGallery, newItem];
        await gomboDB.updateUserProfile(currentUserProfile.uid, {
          mediaGallery: updated
        });
        onSetGallery(updated);
        onRefresh();
        resetForm();
      } catch (err) {
        console.error(err);
        alert("Erreur de chargement de votre fichier.");
      } finally {
        setUploading(false);
      }
    } else {
      if (!mediaUrl.trim()) {
        alert("Veuillez entrer une adresse URL ou un lien YouTube valide.");
        return;
      }
      const newItem = {
        id: `portfolio_${Date.now()}`,
        type: mediaType,
        url: mediaUrl.trim(),
        title: mediaTitle.trim() || `${mediaType.toUpperCase()} de l'artiste`
      };
      const updated = [...mediaGallery, newItem];
      try {
        await gomboDB.updateUserProfile(currentUserProfile.uid, {
          mediaGallery: updated
        });
        onSetGallery(updated);
        onRefresh();
        resetForm();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const resetForm = () => {
    setIsOpen(false);
    setMediaUrl("");
    setMediaTitle("");
    setMediaFile(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Voulez-vous supprimer ce média du portfolio ?")) {
      const updated = mediaGallery.filter(m => m.id !== id);
      try {
        await gomboDB.updateUserProfile(currentUserProfile.uid, {
          mediaGallery: updated
        });
        onSetGallery(updated);
        onRefresh();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const photos = mediaGallery.filter(m => m.type === "photo");
  const audios = mediaGallery.filter(m => m.type === "audio");
  const videos = mediaGallery.filter(m => m.type === "video" || m.type === "youtube");

  return (
    <div id="section-medias" className="bg-white dark:bg-afri-bg-sec border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-black uppercase text-afri-text-sec tracking-wider">🌟 Section Médias / Galerie Artiste</h3>
          <p className="text-[10px] font-bold text-afri-text-sec mt-0.5">Photos, démos audios, vidéos et liens YouTube.</p>
        </div>
        <button
          id="btn-add-media-portfolio"
          onClick={() => setIsOpen(true)}
          className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-afri-text rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Ajouter
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-800 gap-4 text-xs font-black">
        {[
          { id: "youtube", label: "🎥 Vidéos & YouTube", count: videos.length },
          { id: "audio", label: "🎵 Audios & Chansons", count: audios.length },
          { id: "photo", label: "📸 Photos", count: photos.length }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-2.5 transition-all relative cursor-pointer ${
              activeTab === t.id 
                ? "text-orange-550 border-b-2 border-orange-500 font-extrabold" 
                : "text-afri-text-sec font-bold hover:text-gray-650"
            }`}
          >
            <span>{t.label}</span>
            <span className="ml-1.5 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-[10px] text-afri-text-sec dark:text-afri-text-sec rounded-full font-bold">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Gallery Showcase Content */}
      <div className="pt-2">
        {activeTab === "youtube" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {videos.length === 0 ? (
              <div className="col-span-full py-8 text-center text-xs font-bold text-afri-text-sec italic">
                Aucun lien vidéo ou démo YouTube configuré.
              </div>
            ) : (
              videos.map((vid) => {
                const yId = getYoutubeId(vid.url);
                const isRawVideo = vid.type === "video" || !yId;
                const thumb = yId 
                  ? `https://img.youtube.com/vi/${yId}/mqdefault.jpg`
                  : "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=350";
                
                return (
                  <div key={vid.id} className="relative group overflow-hidden bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-2xl flex flex-col">
                    <div className="aspect-video w-full bg-afri-bg relative flex items-center justify-center overflow-hidden">
                      {isRawVideo ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-afri-bg-sec p-4 font-mono text-center select-none">
                          <Video className="w-8 h-8 text-orange-550 mb-2 animate-pulse" />
                          <span className="text-[10px] font-black tracking-wider text-orange-400 uppercase">Vidéo de Démo Directe</span>
                          <span className="text-[8px] text-afri-text-sec break-all truncate max-w-full mt-1 px-2">{vid.title}</span>
                        </div>
                      ) : (
                        <img src={thumb} alt={vid.title} className="w-full h-full object-cover opacity-85 hover:scale-102 transition-transform" />
                      )}
                      
                      <button
                        onClick={() => {
                          if (yId) {
                            setLightboxVideoId(yId);
                          } else {
                            setLightboxVideoUrl(vid.url);
                          }
                        }}
                        className="absolute p-3 bg-orange-600 hover:bg-orange-500 text-afri-text rounded-full shadow-lg transform transition-all hover:scale-110 cursor-pointer"
                      >
                        <Play className="w-6 h-6 fill-current text-afri-text" />
                      </button>
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <div className="truncate">
                        <span className="text-xs font-black truncate block text-gray-850 dark:text-afri-text uppercase">{vid.title}</span>
                        <span className="text-[10px] font-bold text-afri-text-sec truncate block font-mono">{vid.url}</span>
                      </div>
                      <button
                        onClick={() => handleDelete(vid.id)}
                        className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-gray-300 dark:text-gray-600 rounded-lg transition-all cursor-pointer"
                        title="Détruire"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "audio" && (
          <div className="space-y-2.5">
            {audios.length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-afri-text-sec italic">
                Aucun fichier audio ni démo vocale configurée.
              </div>
            ) : (
              audios.map((aud) => (
                <div key={aud.id} className="p-3 bg-gray-50 dark:bg-afri-bg-sec border border-gray-100 dark:border-gray-800 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3- w-full truncate">
                    <button
                      onClick={() => toggleAudio(aud.url)}
                      className="p-2.5 bg-orange-500 hover:bg-orange-600 text-afri-text rounded-full shadow-xs cursor-pointer flex items-center justify-center"
                    >
                      {playingUrl === aud.url ? (
                        <Pause className="w-4 h-4 fill-current text-afri-text" />
                      ) : (
                        <Play className="w-4 h-4 fill-current text-afri-text" />
                      )}
                    </button>
                    <div className="truncate pl-2">
                      <span className="text-xs font-black text-gray-850 dark:text-afri-text block uppercase max-w-sm truncate">{aud.title}</span>
                      <span className="text-[9px] font-mono font-bold text-afri-text-sec block truncate">{aud.url}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(aud.id)}
                    className="p-1.5 text-gray-300 hover:text-rose-550 dark:text-gray-600 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "photo" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {photos.length === 0 ? (
              <div className="col-span-full py-8 text-center text-xs font-bold text-afri-text-sec italic">
                Aucune photo de scène ajoutée dans la photothèque.
              </div>
            ) : (
              photos.map((ph) => (
                <div key={ph.id} className="relative group overflow-hidden aspect-square border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-100">
                  <img src={ph.url} alt={ph.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-afri-bg/60 opacity-0 hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDelete(ph.id)}
                        className="p-1.5 bg-rose-600 text-afri-text rounded-lg hover:bg-rose-505 shadow-sm cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] font-black text-afri-text uppercase block truncate">{ph.title}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Upload lightboxes popup additions Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-afri-bg/70 backdrop-blur-xs font-sans">
          <div className="w-full max-w-md bg-white dark:bg-afri-bg-sec border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-2xl relative space-y-4 animate-scaleUp">
            <h4 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-afri-text">🚀 Ajouter un élément de portfolio</h4>
            
            <form onSubmit={handleAddMedia} className="space-y-3.5">
              <div>
                <label className="block text-[10px] uppercase font-bold text-afri-text-sec mb-1">Type de Média</label>
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-100 rounded-xl text-xs font-bold dark:text-afri-text"
                >
                  <option value="youtube">👁️‍🗨️ Lien Vidéo YouTube / Vidéothèque</option>
                  <option value="video">🎥 Importer Fichier Vidéo (MP4, WebM)</option>
                  <option value="audio">🎵 Fichier Audio / Démo Chanson</option>
                  <option value="photo">📸 Photo de scène / Galerie</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-afri-text-sec mb-1">Titre de la démo</label>
                <input
                  type="text"
                  placeholder="Ex: Solo Batterie Concert, Maquette Voix-Off..."
                  required
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-100 rounded-xl text-xs font-bold dark:text-afri-text"
                />
              </div>

              {mediaType !== "youtube" ? (
                <div>
                  <label className="block text-[10px] uppercase font-bold text-afri-text-sec mb-1">Sélectionner un fichier</label>
                  <div className="border-2 border-dashed border-gray-200 dark:border-gray-850 rounded-xl p-4 text-center space-y-2 hover:bg-gray-50/50 transition-all">
                    <input
                      type="file"
                      required
                      accept={mediaType === "photo" ? "image/*" : "audio/*,video/*"}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setMediaFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                      id="portfolio-file-picker"
                    />
                    <label htmlFor="portfolio-file-picker" className="cursor-pointer space-y-1 block">
                      <Camera className="w-6 h-6 mx-auto text-orange-550" />
                      <span className="text-xs font-black block text-gray-700 dark:text-gray-300">
                        {mediaFile ? `✅ ${mediaFile.name}` : "Choisir un fichier sur mon appareil"}
                      </span>
                      <span className="text-[10px] text-afri-text-sec block">Fichiers max 10MB pour un streaming rapide</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] uppercase font-bold text-afri-text-sec mb-1">Lien URL YouTube</label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-100 rounded-xl text-xs font-bold dark:text-afri-text font-mono"
                  />
                </div>
              )}

              {uploading && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-bold text-afri-text-sec">
                    <span>Téléversement sécurisé...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-555 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-black rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-afri-text text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {uploading ? "Patienter..." : "Valider et Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video YouTube Lightbox player */}
      {lightboxVideoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-afri-bg/90 backdrop-blur-md">
          <div className="w-full max-w-3xl aspect-video bg-afri-bg rounded-2xl overflow-hidden relative border border-gray-850">
            <button
              onClick={() => setLightboxVideoId(null)}
              className="absolute top-3 right-3 z-10 p-2 bg-afri-bg/60 hover:bg-afri-bg/90 text-afri-text rounded-full text-xs font-bold border border-white/20 hover:scale-105 cursor-pointer leading-none"
            >
              Fermer ✖
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${lightboxVideoId}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Raw Video Lightbox player */}
      {lightboxVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-afri-bg/90 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-3xl aspect-video bg-afri-bg rounded-2xl overflow-hidden relative border border-gray-850 flex items-center justify-center">
            <button
              onClick={() => setLightboxVideoUrl(null)}
              className="absolute top-3 right-3 z-10 p-2 bg-afri-bg/60 hover:bg-afri-bg/90 text-afri-text rounded-full text-xs font-bold border border-white/20 hover:scale-105 cursor-pointer leading-none"
            >
              Fermer ✖
            </button>
            <video 
              src={lightboxVideoUrl} 
              controls 
              autoPlay 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
