import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import PremiumLoader from './PremiumLoader';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, loading, setShowAuthPopup } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PremiumLoader message="Synchronisation AFRIGOMBO ELITE..." />;
  }

  if (!currentUser) {
    console.log("🔍 [DIAGNOSTIC AUTHGUARD] Utilisateur non authentifié détecté sur route protégée:", location.pathname, "-> Redirection vers /home");
    setTimeout(() => {
      setShowAuthPopup(true);
    }, 100);
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
