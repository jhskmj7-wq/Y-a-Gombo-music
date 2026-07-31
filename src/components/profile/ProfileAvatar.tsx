import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface ProfileAvatarProps {
  uid: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallbackUrl?: string;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ uid, size = 'md', fallbackUrl }) => {
  const [avatarSrc, setAvatarSrc] = useState<string>(fallbackUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200");
  const [useAvatar, setUseAvatar] = useState(false);
  const [avatarConfig, setAvatarConfig] = useState<any>(null);

  useEffect(() => {
    if (!uid) return;
    
    // Listen to user document and userAvatars realtime
    const userRef = doc(db, 'users', uid);
    const unSubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.avatarImage) {
          setAvatarSrc(data.avatarImage);
        } else if (data.photoURL) {
          setAvatarSrc(data.photoURL);
        }
        if (data.useAvatarAsProfile !== undefined) {
          setUseAvatar(data.useAvatarAsProfile);
        }
        if (data.avatarConfig) {
          setAvatarConfig(data.avatarConfig);
        }
      }
    });

    const avatarRef = doc(db, 'userAvatars', uid);
    const unSubAvatar = onSnapshot(avatarRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.avatarImage) {
          setAvatarSrc(data.avatarImage);
        }
        if (data.config) {
          setAvatarConfig(data.config);
        }
      }
    });

    return () => {
      unSubUser();
      unSubAvatar();
    };
  }, [uid]);

  const sizeClasses = {
    sm: 'w-10 h-10 rounded-xl',
    md: 'w-16 h-16 rounded-2xl',
    lg: 'w-24 h-24 rounded-[2rem]',
    xl: 'w-32 h-32 rounded-[2.5rem]'
  }[size];

  return (
    <div className={`relative ${sizeClasses} overflow-hidden border-2 border-[#D4AF37]/50 bg-afri-bg-sec shadow-xl shrink-0 select-none`}>
      <img 
        src={avatarSrc} 
        alt="Avatar Profil" 
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
      <div className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-black" title="Actif en temps réel" />
    </div>
  );
};

export default ProfileAvatar;
