import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { ProfileAvatar } from './ProfileAvatar';
import { Shield, Sparkles, Crown } from 'lucide-react';

interface ProfileHeaderProps {
  uid: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ uid }) => {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!uid) return;
    const userRef = doc(db, 'users', uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setProfile(snap.data());
      }
    });
    return () => unsubscribe();
  }, [uid]);

  return (
    <div className="w-full bg-afri-bg-sec border border-afri-border rounded-3xl p-5 shadow-xl relative overflow-hidden select-none">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 relative z-10 text-center sm:text-left">
        <ProfileAvatar uid={uid} size="lg" />
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-lg font-bold text-white truncate">{profile?.displayName || profile?.fullName || "Membre Afrigombo"}</h2>
            {profile?.isSuperFounder && (
              <span className="px-2.5 py-0.5 bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] text-[10px] font-mono font-bold uppercase rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" /> Super Fondateur
              </span>
            )}
            {profile?.isVerified && (
              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-[10px] font-mono font-bold uppercase rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3" /> Certifié
              </span>
            )}
          </div>
          <p className="text-xs text-afri-text-sec font-mono">@{profile?.username || uid.substring(0, 8)}</p>
          <p className="text-xs text-zinc-300 leading-relaxed max-w-md">{profile?.bio || "Créateur et bâtisseur de l'écosystème numérique africain."}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
