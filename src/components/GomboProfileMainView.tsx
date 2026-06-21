import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  User, Phone, MapPin, Music, Award, ShieldCheck, Heart, Calendar, 
  Copy, ExternalLink, RefreshCw 
} from "lucide-react";
import { UserProfile } from "../types";
import { ProfileCompletionScore } from "./ProfileCompletionScore";
import { MediaGalleryManager } from "./MediaGalleryManager";

interface GomboProfileMainViewProps {
  currentUserProfile: UserProfile;
  onRefreshProfile: () => void;
  onNavigateView: (view: string, tab?: any) => void;
  setPanelView: (panel: string) => void;
  availabilityStatus: string;
  handleUpdateAvailabilityStatus: (status: "disponible" | "occupe" | "indisponible") => void;
  updatingAvailability: boolean;
  dynamicGroupsCount: number;
  dynamicFavsCount: number;
  dynamicAppsCount: number;
  myPosts: any[];
  mediaGallery: any[];
  setMediaGallery: (gallery: any[]) => void;
}

const AVATARS = [
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120&h=120",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120&h=120",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120&h=120"
];

export const GomboProfileMainView: React.FC<GomboProfileMainViewProps> = ({
  currentUserProfile,
  onRefreshProfile,
  onNavigateView,
  setPanelView,
  availabilityStatus,
  handleUpdateAvailabilityStatus,
  updatingAvailability,
  dynamicGroupsCount,
  dynamicFavsCount,
  dynamicAppsCount,
  myPosts,
  mediaGallery,
  setMediaGallery
}) => {
  const [uidCopied, setUidCopied] = useState(false);

  const handleCopyUid = () => {
    navigator.clipboard.writeText(currentUserProfile.uid);
    setUidCopied(true);
    setTimeout(() => setUidCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 text-[#1A1A1A] dark:text-gray-100 font-sans"
    >
      {/* PROFILE COMPLETION SCORE SECTION */}
      <ProfileCompletionScore
        currentUserProfile={currentUserProfile}
        onEdit={() => setPanelView("edit")}
        onNavigateView={onNavigateView}
      />

      {/* TRUST & VERIFICATION BANNER - AFRITRUST */}
      {!(currentUserProfile.isCertified === true || currentUserProfile.kycStatus === "approved") && (
            <div className="flex bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-3xl p-5 flex flex-col sm:flex-row items-center gap-4 justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/30">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-950 dark:text-white uppercase font-sans">
                  Obtenez le badge bleu GOMBO ID 💠
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-sans">
                  Gagnez la confiance des clients et débloquez des gombos de prestige.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setPanelView("edit")}
              className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#B48F17] text-black font-black rounded-xl text-xs uppercase tracking-widest transition-all whitespace-nowrap"
            >
              Vérifier mon identité
            </button>
          </div>
      )}

      {/* HEADER PROFIL - SECTION IDENTITÉ */}
      <div id="section-identity" className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center gap-6 justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {/* Avatar frame */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#D4AF37] bg-gray-100 dark:bg-gray-800">
              <img 
                src={currentUserProfile.avatarUrl || currentUserProfile.photoURL || AVATARS[0]} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
              />
            </div>
            
            {(currentUserProfile.isCertified === true || currentUserProfile.kycStatus === "approved") && (
              <div className="absolute -top-1 -right-1 p-1 bg-blue-500 text-white rounded-full border-2 border-white dark:border-[#121214]">
                <ShieldCheck className="w-4 h-4 text-white fill-current" />
              </div>
            )}

            <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white dark:border-[#121214] ${
              availabilityStatus === "disponible" ? "bg-emerald-500" : availabilityStatus === "occupe" ? "bg-[#D4AF37]" : "bg-red-500"
            }`} />
          </div>

          <div>
            <div className="flex flex-col gap-1.5 sm:items-start">
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                <h2 className="text-2xl font-black tracking-tight text-gray-950 dark:text-white uppercase font-sans">
                  {((currentUserProfile.prenom || currentUserProfile.firstName || "").trim().normalize("NFC"))} {((currentUserProfile.nom || currentUserProfile.lastName || "").trim().normalize("NFC"))}
                </h2>
                {(currentUserProfile.nomArtistique || currentUserProfile.artistName || currentUserProfile.artisticName) && (
                  <span className="text-sm font-black text-[#D4AF37] block">
                    ({((currentUserProfile.nomArtistique || currentUserProfile.artistName || currentUserProfile.artisticName || "").trim().normalize("NFC"))})
                  </span>
                )}
                {/* Activity Streak */}
                {(() => {
                  const streak = localStorage.getItem("gombo_activity_streak") || "1";
                  return (
                    <span className="text-[9px] font-bold bg-amber-500/10 text-[#D4AF37] px-2 py-0.5 rounded-md border border-[#D4AF37]/20">
                      🔥 {streak} {parseInt(streak) > 1 ? "jours d'affilée" : "jour d'activité"}
                    </span>
                  );
                })()}
              </div>

              {/* SECTION VIII: GAMIFICATION LEVEL ROW */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-1 font-sans">
                {(() => {
                  const activityCount = (myPosts?.length || 0) + (dynamicAppsCount || 0) + (currentUserProfile.gigsCompleted || 0);
                  const isActif = activityCount >= 1;
                  const isCertifie = activityCount >= 5 || currentUserProfile.isCertified === true || currentUserProfile.verificationStatus === "certifie" || currentUserProfile.badges?.some(b => b.includes("Talent Certifié"));
                  const isBoss = currentUserProfile.role === "client" || currentUserProfile.role === "admin" || (currentUserProfile as any).isPremium === true || currentUserProfile.email === "jhs.kmj7@gmail.com";

                  return (
                    <>
                      {/* Badge 1: Nouveau Talent */}
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/35 shadow-xs">
                        🥉 Nouveau Talent
                      </span>

                      {/* Badge 2: Talent Actif */}
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border transition-all ${
                        isActif 
                          ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/35 shadow-xs" 
                          : "bg-gray-800/40 text-gray-500 border-gray-800/80 opacity-40 line-through"
                      }`} title={isActif ? "Badge obtenu !" : "Envoyez au moins 1 candidature ou post pour débloquer"}>
                        🥈 Talent Actif
                      </span>

                      {/* Badge 3: Talent Certifié */}
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border transition-all ${
                        isCertifie 
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/35 shadow-xs" 
                          : "bg-gray-800/40 text-gray-500 border-gray-800/80 opacity-40"
                      }`} title={isCertifie ? "Talent d'excellence certifié !" : "Cumulez au moins 5 actions pour débloquer"}>
                        🥇 Talent Certifié
                      </span>

                      {/* Badge 4: Niveau Boss */}
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border transition-all ${
                        isBoss 
                          ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-black border-yellow-500 shadow-sm animate-pulse" 
                          : "bg-gray-800/40 text-gray-500 border-gray-800/80 opacity-40"
                      }`} title={isBoss ? "Niveau Boss Suprême !" : "Réservé aux Promoteurs, Admins & Abonnés Premium"}>
                        👑 Niveau Boss
                      </span>
                    </>
                  );
                })()}
              </div>

              {/* Motto message */}
              <div className="mt-2.5 px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/25 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit animate-pulse">
                🎼 Ton héritage attire les gombos.
              </div>
            </div>

            {/* Account Type and UID block */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2 font-mono text-xs text-gray-400 select-none">
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded font-black uppercase text-[10px]">
                🦁 {(currentUserProfile.role as string) === "musicien" ? "Artiste / Musicien" : (currentUserProfile.role as string) === "client" ? "Client" : (currentUserProfile.role as string) === "organisateur" ? "Organisateur" : "Manager"}
              </span>
              <div className="flex items-center gap-1 font-mono text-[10px] bg-gray-50 dark:bg-gray-800/40 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-800">
                <span>UID: {currentUserProfile.uid.slice(0, 8)}...</span>
                <button 
                  onClick={handleCopyUid} 
                  className="hover:text-[#D4AF37] transition-colors p-0.5 cursor-pointer"
                  title="Copier UID"
                >
                  <Copy className="w-3 h-3" />
                </button>
                {uidCopied && <span className="text-[9px] text-[#25D366] font-bold">Copié!</span>}
              </div>
            </div>

            {currentUserProfile.bio && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2.5 max-w-lg leading-relaxed font-semibold italic">
                "{currentUserProfile.bio.trim().normalize("NFC")}"
              </p>
            )}

            {/* Location sticker (Ville, Commune, Quartier) */}
            <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-gray-800/80 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wide text-[9px]">Ville:</span>
                <span className="text-gray-800 dark:text-gray-200 font-bold">{(currentUserProfile.location?.city || currentUserProfile.ville || currentUserProfile.city || "Abidjan").trim().normalize("NFC")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wide text-[9px]">Commune:</span>
                <span className="text-gray-800 dark:text-gray-200 font-bold">{(currentUserProfile.location?.district || currentUserProfile.commune || "Cocody").trim().normalize("NFC")}</span>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <span className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wide text-[9px]">Quartier / Adresse:</span>
                <span className="text-gray-800 dark:text-gray-200 font-bold truncate flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  {(currentUserProfile.location?.district || currentUserProfile.quartier || "Quartier non renseigné (à configurer)").trim().normalize("NFC")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Availability Controls & Share */}
        <div className="flex flex-col items-center sm:items-end gap-3 w-full md:w-auto border-t md:border-t-0 border-gray-50 dark:border-gray-850 pt-4 md:pt-0 shrink-0 font-sans">
          <div className="flex flex-col gap-1 w-full sm:w-60">
            <span className="text-[10px] font-black uppercase text-gray-400 text-center sm:text-right">Statut de Disponibilité</span>
            <div className="flex gap-1 bg-gray-50 dark:bg-gray-800/60 p-1 rounded-xl border border-gray-100 dark:border-gray-800">
              {[
                { key: "disponible", label: "Dispo", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", dot: "🟢" },
                { key: "occupe", label: "Occupé", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", dot: "🟠" },
                { key: "indisponible", label: "Indispo", color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20", dot: "🔴" }
              ].map((s) => {
                const isActive = availabilityStatus === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    disabled={updatingAvailability}
                    onClick={() => handleUpdateAvailabilityStatus(s.key as any)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold transition-all border flex items-center justify-center gap-1 cursor-pointer ${
                      isActive 
                        ? `${s.color} shadow-xs font-black transform scale-102` 
                        : "bg-transparent text-gray-450 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span>{s.dot}</span>
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setPanelView("edit")}
            className="w-full sm:w-60 text-center py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            📝 MODIFIER MON PROFIL
          </button>
        </div>
      </div>

      {/* SECTION ACTIVITÉ, SPÉCIALITÉS & STYLES MUSICAUX */}
      <div id="section-skills" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Activités & Spécialités */}
        <div className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#D4AF37]" />
            Spécialités de Scène & Free Inputs
          </h3>
          <div className="flex flex-wrap gap-2">
            {(currentUserProfile.mainRole || (currentUserProfile.specialties && currentUserProfile.specialties.length > 0)) ? (
              [currentUserProfile.mainRole, ...(currentUserProfile.specialties || [])].filter(Boolean).map((spec, idx) => (
                <span 
                  key={idx}
                  className="px-3 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] rounded-xl text-xs font-extrabold shadow-2xs"
                >
                  🎸 {spec}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400 italic font-bold">Aucune spécialité configurée. Cliquez sur Modifier mon profil.</span>
            )}
          </div>
        </div>

        {/* Styles/Genres Musicaux */}
        <div className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5">
            <Music className="w-4 h-4 text-amber-500" />
            Styles & Courants Musicaux
          </h3>
          <div className="flex flex-wrap gap-2">
            {(currentUserProfile.genres && currentUserProfile.genres.length > 0) || (currentUserProfile.musicGenres && currentUserProfile.musicGenres.length > 0) ? (
              [...(currentUserProfile.genres || []), ...(currentUserProfile.musicGenres || [])].map((gen, idx) => (
                <span 
                  key={idx}
                  className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-extrabold shadow-2xs"
                >
                  🎵 {gen}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400 italic font-bold">Aucun style configuré.</span>
            )}
          </div>
        </div>
      </div>

      {/* SECTION MÉDIAS (PORTFOLIO INTEGRATION) */}
      <MediaGalleryManager
        currentUserProfile={currentUserProfile}
        mediaGallery={mediaGallery}
        onRefresh={onRefreshProfile}
        onSetGallery={setMediaGallery}
      />

      {/* SECTION PUBLICATIONS D'ACTIVITÉ */}
      <div id="section-activities" className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5">
          <span>📢 Publications d'Activité & Murmures d'époque ({myPosts.length})</span>
        </h3>
        
        {myPosts.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-zinc-500 italic text-center py-6 font-bold">
            Aucun murmure de scène ou publication n'a encore été émis par cet artiste d'élite.
          </p>
        ) : (
          <div className="space-y-3">
            {myPosts.map((post) => (
              <div 
                key={post.id} 
                className="p-4 rounded-2xl bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-zinc-900 text-left relative overflow-hidden"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="text-xs font-black text-gray-950 dark:text-gray-100 uppercase">
                      {post.authorArtisticName || currentUserProfile.artisticName || "Artiste Prestigieux"}
                    </h4>
                    <span className="text-[9px] font-mono text-gray-400 dark:text-zinc-500">
                      {post.timestamp ? new Date(post.timestamp).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "Récemment"}
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-2.5 leading-relaxed whitespace-pre-wrap font-sans">
                  {post.content}
                </p>
                
                <div className="flex gap-4 mt-3 pt-2.5 border-t border-gray-150/40 dark:border-zinc-900/60 text-[10px] font-mono font-bold text-gray-500">
                  <span>👍 {post.likes || 0} Soutiens</span>
                  <span>💬 {post.comments || 0} Commentaires</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION STATISTIQUES DES ACTIVITÉS RECRUTEMENT GOMBOS */}
      <div id="section-stats" className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest">📊 Activité Globale & Performance Showbiz</h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-2xl text-center">
            <span className="text-2xl font-black text-gray-950 dark:text-white font-mono block">{myPosts.length}</span>
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Publications</span>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-2xl text-center">
            <span className="text-2xl font-black text-gray-950 dark:text-white font-mono block">{dynamicAppsCount}</span>
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Candidatures</span>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-2xl text-center">
            <span className="text-2xl font-black text-[#D4AF37] font-mono block">{dynamicGroupsCount}</span>
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Groupes VIP</span>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-2xl text-center">
            <span className="text-2xl font-black text-purple-550 font-mono block">{dynamicFavsCount}</span>
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Saves & Favoris</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
