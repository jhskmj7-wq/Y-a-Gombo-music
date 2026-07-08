import React from "react";
import { UserProfile } from "../types";

interface ProfileCompletionScoreProps {
  currentUserProfile: UserProfile;
  onEdit: () => void;
  onNavigateView: (view: string) => void;
}

export const ProfileCompletionScore: React.FC<ProfileCompletionScoreProps> = ({
  currentUserProfile,
  onEdit,
  onNavigateView
}) => {
  if (!currentUserProfile) return null;

  let score = 0;
  const missing = [];

  // 1. Photo check (15%)
  if (currentUserProfile.avatarUrl || currentUserProfile.photoURL) {
    score += 15;
  } else {
    missing.push({ name: "Photo de profil", bonus: "+15%", key: "photo" });
  }

  // 2. Nom artistique check (10%)
  if (currentUserProfile.artistName && currentUserProfile.artistName.trim().length > 0) {
    score += 10;
  } else {
    missing.push({ name: "Nom d'artiste", bonus: "+10%", key: "artist" });
  }

  // 3. Bio check (15%)
  if (currentUserProfile.bio && currentUserProfile.bio.trim().length > 0) {
    score += 15;
  } else {
    missing.push({ name: "Biographie (Bio)", bonus: "+15%", key: "bio" });
  }

  // 4. Localisation complète check (15%)
  const hasLocalisation = 
    currentUserProfile.ville && 
    currentUserProfile.commune && 
    currentUserProfile.quartier && 
    currentUserProfile.quartier.trim().length > 0;
  
  if (hasLocalisation) {
    score += 15;
  } else {
    missing.push({ name: "Localisation complète (Ville, Commune, Quartier)", bonus: "+15%", key: "localisation" });
  }

  // 5. Spécialités check (15%)
  if (currentUserProfile.specialties && currentUserProfile.specialties.length > 0) {
    score += 15;
  } else {
    missing.push({ name: "Spécialités de scène", bonus: "+15%", key: "specialties" });
  }

  // 6. Styles Musicaux check (15%)
  if (currentUserProfile.musicGenres && currentUserProfile.musicGenres.length > 0) {
    score += 15;
  } else {
    missing.push({ name: "Styles musicaux", bonus: "+15%", key: "genres" });
  }

  // 7. Médias check (15%)
  if (currentUserProfile.mediaGallery && currentUserProfile.mediaGallery.length > 0) {
    score += 15;
  } else {
    missing.push({ name: "Galerie portfolio (Médias)", bonus: "+15%", key: "media" });
  }

  return (
    <div id="section-profile-completeness" className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">📈 Score de Complétude du Profil PRO</h3>
          <div className="flex items-center gap-2 mt-1.5 font-sans">
            <span className="text-xl sm:text-2xl font-black text-gray-950 dark:text-white font-mono">{score}%</span>
            <span className="text-xs font-extrabold text-[#D4AF37] tracking-wide flex items-center gap-1 animate-pulse">
              🎼 Ton héritage attire les gombos.
            </span>
          </div>
        </div>
        {score < 100 && (
          <button
            id="btn-complete-profile-quick"
            onClick={onEdit}
            className="px-4 py-2 bg-[#D4AF37] hover:bg-[#b09028] text-black font-black rounded-xl text-xs uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer text-center font-sans shadow-[0_0_15px_rgba(212,175,55,0.2)]"
          >
            🚀 Remplir mon profil
          </button>
        )}
      </div>

      {/* Progress Track */}
      <div className="h-4 w-full bg-gray-100 dark:bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-[#D4AF37]/20 shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]">
        <div 
          className="h-full bg-gradient-to-r from-[#D4AF37] via-amber-400 to-[#b09028] rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(212,175,55,0.4)]" 
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Missing items list */}
      {score < 100 && (
        <div className="space-y-2.5 pt-1 animate-fadeIn font-sans">
          <span className="text-[10px] uppercase font-black text-[#D4AF37] tracking-widest block font-mono">🎯 Boostez votre héritage en ajoutant :</span>
          <div className="flex flex-wrap gap-2">
            {missing.map((it, idx) => (
              <button
                key={idx}
                type="button"
                onClick={onEdit}
                className="px-3 py-1.5 bg-gray-50 hover:bg-[#D4AF37]/5 dark:bg-zinc-900 dark:hover:bg-[#D4AF37]/10 border border-gray-150 dark:border-zinc-800 text-gray-650 dark:text-gray-300 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all text-left cursor-pointer"
              >
                <span className="text-[#D4AF37] font-extrabold">{it.bonus}</span>
                <span>{it.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
