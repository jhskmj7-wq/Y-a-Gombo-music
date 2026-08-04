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

  // Allow passing if the profile exists and is complete, skipped, or has entered app
  if (profile && (profile.isProfileComplete === true || profile.profileSkipped || profile.skippedProfile || profile.hasEnteredApp)) {
    return <>{children}</>;
  }

  // Check if this is an existing user (account created prior to this session or returning user).
  // An existing user must NEVER be considered a "new user" or forced to onboarding, even if their profile is incomplete.
  const creationTime = currentUser.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).getTime() : 0;
  const lastSignInTime = currentUser.metadata?.lastSignInTime ? new Date(currentUser.metadata.lastSignInTime).getTime() : 0;
  const isVeryRecentCreation = creationTime > 0 && Math.abs(lastSignInTime - creationTime) < 60000;

  // If the profile exists in Firestore OR if it is not a brand new creation session, treat as existing user.
  if (profile || !isVeryRecentCreation) {
    return <>{children}</>;
  }

  // Otherwise redirect to complete-profile only for genuinely brand new users in their first session
  return <Navigate to="/complete-profile" replace />;
}
