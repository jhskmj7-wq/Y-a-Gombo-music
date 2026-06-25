import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export function ProfileGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-screen bg-[#050505] animate-pulse select-none">
        <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin mb-4" />
        <p className="text-xs font-mono tracking-widest text-[#D4AF37] uppercase">Vérification du Profil...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <>{children}</>;
  }

  // Allow passing if the profile exists and is complete or skipped
  if (profile && (profile.isProfileComplete !== false || profile.profileSkipped || profile.skippedProfile)) {
    return <>{children}</>;
  }

  // Otherwise redirect to complete-profile
  console.log("📝 [ProfileGuard] Profile incomplete, redirecting to /complete-profile");
  return <Navigate to="/complete-profile" replace />;
}
