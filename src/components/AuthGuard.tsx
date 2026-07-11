import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import PremiumLoader from './PremiumLoader';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, loading, setShowAuthPopup } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PremiumLoader message="Synchronisation AFRIGOMBO..." />;
  }

  if (!currentUser) {
    console.log("🔒 [AuthGuard] No user detected, redirecting to /home and opening auth popup");
    setTimeout(() => {
      setShowAuthPopup(true);
    }, 100);
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
