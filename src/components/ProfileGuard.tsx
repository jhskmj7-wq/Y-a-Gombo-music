import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import PremiumLoader from './PremiumLoader';

export function ProfileGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PremiumLoader message="Vérification du Profil..." />;
  }

  if (!currentUser) {
    return <>{children}</>;
  }

  // Allow passing if the profile exists and is complete or skipped
  if (profile && (profile.isProfileComplete !== false || profile.profileSkipped || profile.skippedProfile)) {
    return <>{children}</>;
  }

  // Otherwise redirect to complete-profile
  return <Navigate to="/complete-profile" replace />;
}
