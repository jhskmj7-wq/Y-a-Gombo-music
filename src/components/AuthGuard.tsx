import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-screen bg-[#050505] animate-pulse select-none">
        <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin mb-4" />
        <p className="text-xs font-mono tracking-widest text-[#D4AF37] uppercase">Synchronisation AFRIGOMBO...</p>
      </div>
    );
  }

  if (!currentUser) {
    console.log("🔒 [AuthGuard] No user detected, redirecting to /auth");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
