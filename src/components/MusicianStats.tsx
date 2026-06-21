import React, { useState } from "react";
import { 
  BarChart3, Users, Heart, Sparkles, MapPin, Briefcase, Play, Pause, 
  Trash2, ChevronLeft, Film, Globe, Folder, Plus, Calendar, Disc, Check
} from "lucide-react";

interface MusicianStatsProps {
  onBack: () => void;
  audioSynth?: any;
}

export default function MusicianStats({ onBack, audioSynth }: MusicianStatsProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "portfolio" | "villes">("stats");
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  
  // Simulated stats metrics
  const stats = {
    visiteurs: 5420,
    interactions: 1238,
    gombosTrouves: 8,
    collabsObtenues: 12,
    evolutionAudience: "+35.4% ce mois",
  };

  // Simulated cities
  const cities = [
    { name: "Abidjan (Cocody/Yopougon)", count: 2854, percentage: 52 },
    { name: "Yamoussoukro", count: 812, percentage: 15 },
    { name: "Bouaké", count: 650, percentage: 12 },
    { name: "San-Pédro", count: 542, percentage: 10 },
    { name: "Korhogo", count: 320, percentage: 6 },
    { name: "Paris (Diaspora)", count: 242, percentage: 5 }
  ];

  // Portfolio: Audios
  const [audios, setAudios] = useState([
    { id: "a1", title: "Ebène Groove (Acoustic Solo)", duration: "2:45", plays: 2450, soundName: "saxophone" },
    { id: "a2", title: "Kora d'Amour (Live à Assinie)", duration: "3:20", plays: 1890, soundName: "piano" },
    { id: "a3", title: "Abidjan Beat (Tam-Tam Session)", duration: "1:55", plays: 3120, soundName: "tambour" }
  ]);

  // Portfolio: Videos
  const [videos, setVideos] = useState([
    { id: "v1", title: "Concert Live Marcory - AFRIGOMBO 2026", url: "https://www.youtube.com/watch?v=demo1", thumb: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60" },
    { id: "v2", title: "Session Acoustique Saxophone & Kora - Studio Cocody", url: "https://www.youtube.com/watch?v=demo2", thumb: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60" }
  ]);

  const [newAudioName, setNewAudioName] = useState("");
  const [newVideoName, setNewVideoName] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");

  const playAudio = (trackId: string, trackSound: string) => {
    if (playingTrackId === trackId) {
      setPlayingTrackId(null);
      // Trigger stop event to globally stop active sounds
      try {
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('gombo_stop_sounds'));
        }
      } catch (_) {}
    } else {
      setPlayingTrackId(trackId);
      try {
        // Trigger specific sound by event
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('gombo_play_sound', { detail: { name: trackSound } }));
        }
        // Fallback to synth if needed
        if (audioSynth) {
          if (trackSound === "saxophone") audioSynth.playSaxophone();
          else if (trackSound === "piano") audioSynth.playKoraNote(329.63, 0, 0.4, 0.6); // E4 Note
          else if (trackSound === "tambour") audioSynth.playTamTam(false);
        }
      } catch (_) {}
    }
  };

  const addAudioTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAudioName) return;
    const item = {
      id: "a_" + Date.now(),
      title: newAudioName,
      duration: "2:30",
      plays: 0,
      soundName: "saxophone"
    };
    setAudios([...audios, item]);
    setNewAudioName("");
    try {
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('gombo_play_sound', { detail: { name: 'success' } }));
      }
    } catch (_) {}
  };

  const addVideoTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoName) return;
    const item = {
      id: "v_" + Date.now(),
      title: newVideoName,
      url: newVideoUrl || "https://www.youtube.com/watch?v=custom",
      thumb: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60"
    };
    setVideos([...videos, item]);
    setNewVideoName("");
    setNewVideoUrl("");
    try {
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('gombo_play_sound', { detail: { name: 'success' } }));
      }
    } catch (_) {}
  };

  const removeAudioTrack = (id: string) => {
    setAudios(audios.filter(a => a.id !== id));
  };

  const removeVideoTrack = (id: string) => {
    setVideos(videos.filter(v => v.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32">
      {/* HEADER SECTION */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#121008] to-[#050505] border-b border-zinc-900 px-6 py-6 sm:py-8 text-left">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none"></div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-black text-zinc-400 hover:text-white transition-colors cursor-pointer mb-5 uppercase tracking-widest"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour au Terrain
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase font-sans flex items-center gap-2">
              <span>📊 STATS & PORTFOLIO</span>
              <span className="text-xs bg-[#D4AF37]/10 text-[#D4AF37] tracking-widest font-black uppercase py-0.5 px-3 rounded-full border border-[#D4AF37]/20">Gombo Elite</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              Suivi professionnel de votre carrière musicale. Suivez vos visiteurs, diffusez vos maquettes haute définition et mettez à jour votre portfolio d'invitations.
            </p>
          </div>
        </div>

        {/* METRICS MENU BAR */}
        <div className="flex gap-2.5 mt-8 border-b border-zinc-900 pb-0.5">
          {[
            { id: "stats", label: "📈 Statistiques & Audience", icon: BarChart3 },
            { id: "portfolio", label: "📁 Portfolio (Audio & Vidéo)", icon: Disc },
            { id: "villes", label: "🌍 Villes Actives", icon: Globe }
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  try {
                    audioSynth?.playValidationSuccess();
                  } catch (_) {}
                }}
                className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#D4AF37]/10 border-b-2 border-[#D4AF37] text-[#D4AF37]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        
        {/* 1. STATS TAB */}
        {activeTab === "stats" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Visiteurs */}
              <div className="bg-[#0b0b0d] border border-zinc-900 rounded-2xl p-5 text-left relative overflow-hidden group hover:border-[#D4AF37]/35 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl"></div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nombre Visiteurs</span>
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white">{stats.visiteurs}</h3>
                  <p className="text-[10px] text-zinc-400">Impressions uniques de votre fiche</p>
                </div>
              </div>

              {/* Card 2: Interactions */}
              <div className="bg-[#0b0b0d] border border-zinc-900 rounded-2xl p-5 text-left relative overflow-hidden group hover:border-[#D4AF37]/35 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl"></div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Interactions</span>
                  <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
                    <Heart className="w-4 h-4 fill-red-500/20" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white">{stats.interactions}</h3>
                  <p className="text-[10px] text-zinc-400">Hearts, partages et favoris obtenus</p>
                </div>
              </div>

              {/* Card 3: Opportunités */}
              <div className="bg-[#0b0b0d] border border-zinc-900 rounded-2xl p-5 text-left relative overflow-hidden group hover:border-[#D4AF37]/35 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-xl"></div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Gombos trouvés</span>
                  <div className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white">{stats.gombosTrouves}</h3>
                  <p className="text-[10px] text-zinc-400">Candidatures sélectionnées</p>
                </div>
              </div>

              {/* Card 4: Collaborations */}
              <div className="bg-[#0b0b0d] border border-zinc-900 rounded-2xl p-5 text-left relative overflow-hidden group hover:border-[#D4AF37]/35 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl"></div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Collaborations</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Briefcase className="w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white">{stats.collabsObtenues}</h3>
                  <p className="text-[10px] text-zinc-400">Groupes & sessions formés</p>
                </div>
              </div>
            </div>

            {/* Custom SVG Line Chart block for evolutionAudience */}
            <div className="bg-[#0b0b0d] border border-zinc-900 p-6 rounded-2xl text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">📈 Évolution de l'audience en direct</h3>
                  <p className="text-[11px] text-zinc-500">Croissance journalière cumulée sur Abidjan et la diaspora</p>
                </div>
                <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-1 px-3 rounded-full font-bold">
                  {stats.evolutionAudience}
                </span>
              </div>

              {/* Custom micro graph SVG */}
              <div className="h-44 w-full bg-[#050505] rounded-xl relative p-4 border border-zinc-900/60 overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="glowGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid lines */}
                  <line x1="0" y1="30" x2="500" y2="30" stroke="#111" strokeWidth="1" />
                  <line x1="0" y1="60" x2="500" y2="60" stroke="#111" strokeWidth="1" />
                  <line x1="0" y1="90" x2="500" y2="90" stroke="#111" strokeWidth="1" />

                  {/* Gradient Fill */}
                  <path
                    d="M 0,120 L 0,110 L 80,95 L 160,70 L 240,65 L 320,40 L 400,28 L 500,10 L 500,120 Z"
                    fill="url(#glowGold)"
                  />

                  {/* Line graph */}
                  <path
                    d="M 0,110 L 80,95 L 160,70 L 240,65 L 320,40 L 400,28 L 500,10"
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Points */}
                  <circle cx="80" cy="95" r="4" fill="#D4AF37" />
                  <circle cx="160" cy="70" r="4" fill="#D4AF37" />
                  <circle cx="240" cy="65" r="4" fill="#D4AF37" />
                  <circle cx="320" cy="40" r="4" fill="#D4AF37" />
                  <circle cx="400" cy="28" r="4" fill="#D4AF37" />
                  <circle cx="500" cy="10" r="4" fill="#D4AF37" />
                </svg>

                <div className="absolute bottom-1 w-full flex justify-between px-2 text-[8px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                  <span>Semaine 1</span>
                  <span>Semaine 2</span>
                  <span>Semaine 3</span>
                  <span>Semaine Actuelle (Live)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. PORTFOLIO TAB */}
        {activeTab === "portfolio" && (
          <div className="space-y-8 animate-fadeIn text-left">
            {/* Audio list */}
            <div className="bg-[#0b0b0d] border border-zinc-900 p-5 rounded-2xl">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xs font-black uppercase text-[#D4AF37] tracking-wider flex items-center gap-1.5 animate-pulse">
                    <Disc className="w-3.5 h-3.5" />
                    📂 Vos Maquettes Audios Premium
                  </h3>
                  <p className="text-[10px] text-zinc-500">Vos extraits musicaux consultables et écoutables par les recruteurs du réseau.</p>
                </div>
              </div>

              <div className="space-y-2">
                {audios.map((a) => {
                  const isPlaying = playingTrackId === a.id;
                  return (
                    <div key={a.id} className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-900/60 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          onClick={() => playAudio(a.id, a.soundName)}
                          className="w-8 h-8 rounded-full bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0 transition-all cursor-pointer"
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-[#D4AF37]" />}
                        </button>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{a.title}</h4>
                          <span className="text-[9px] text-[#D4AF37] uppercase font-mono font-bold tracking-wider">{a.soundName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-[9px] font-mono text-zinc-550 shrink-0">
                        <span>{a.plays} écoutes</span>
                        <span>{a.duration}</span>
                        <button
                          onClick={() => removeAudioTrack(a.id)}
                          className="hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add form */}
              <form onSubmit={addAudioTrack} className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: Solo Djembé Live Koumassi"
                  value={newAudioName}
                  onChange={(e) => setNewAudioName(e.target.value)}
                  className="bg-[#050505] border border-zinc-850 p-2.5 rounded-xl text-xs flex-1 focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  type="submit"
                  className="bg-[#D4AF37] hover:bg-[#F1C40F] text-black font-black text-[10px] uppercase py-2 px-4 rounded-xl flex items-center gap-1 cursor-pointer transition-all shrink-0"
                >
                  <Plus className="w-3 h-3" />
                  Ajouter Audio
                </button>
              </form>
            </div>

            {/* Video list */}
            <div className="bg-[#0b0b0d] border border-zinc-900 p-5 rounded-2xl">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xs font-black uppercase text-[#D4AF37] tracking-wider flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5" />
                    🎬 Vos Vidéos & Captations Scène
                  </h3>
                  <p className="text-[10px] text-zinc-500">Vos résumés de concerts, démonstrations YouTube ou répétitions.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {videos.map((v) => (
                  <div key={v.id} className="bg-zinc-950/40 border border-zinc-900 rounded-xl overflow-hidden text-left relative group">
                    <div className="h-28 overflow-hidden relative">
                      <img src={v.thumb} alt={v.title} className="w-full h-full object-cover opacity-60 group-hover:scale-103 transition-transform" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37] text-white flex items-center justify-center">
                          <Play className="w-4 h-4 fill-white" />
                        </div>
                      </div>
                      <button
                        onClick={() => removeVideoTrack(v.id)}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="p-3">
                      <h4 className="text-[11px] font-black text-white truncate">{v.title}</h4>
                      <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Vidéo YouTube</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Video Form */}
              <form onSubmit={addVideoTrack} className="mt-4 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Titre de la vidéo (ex: Live Assinie)"
                    value={newVideoName}
                    onChange={(e) => setNewVideoName(e.target.value)}
                    className="bg-[#050505] border border-zinc-850 p-2.5 rounded-xl text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                  <input
                    type="text"
                    placeholder="URL YouTube (optionnel)"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    className="bg-[#050505] border border-zinc-850 p-2.5 rounded-xl text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#D4AF37] hover:bg-[#F1C40F] text-black font-black text-[10px] uppercase py-2.5 px-4 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all w-full"
                >
                  <Plus className="w-3 h-3" />
                  Ajouter ma vidéo
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 3. CITIES TAB */}
        {activeTab === "villes" && (
          <div className="bg-[#0b0b0d] border border-zinc-900 p-5 rounded-2xl text-left animate-fadeIn">
            <div className="mb-6">
              <h3 className="text-xs font-black uppercase text-[#D4AF37] tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                🌍 Parts de Villes Actives
              </h3>
              <p className="text-[10px] text-zinc-500">D'où se connectent les personnes visitant et écoutant vos oeuvres.</p>
            </div>

            <div className="space-y-4">
              {cities.map((city, index) => {
                return (
                  <div key={index} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-300 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                        {city.name}
                      </span>
                      <span className="font-mono text-zinc-450">{city.count} visites ({city.percentage}%)</span>
                    </div>
                    {/* customized progress bar */}
                    <div className="w-full h-2.5 bg-[#050505] border border-zinc-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F1C40F] rounded-full"
                        style={{ width: `${city.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
