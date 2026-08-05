import React from "react";
import GomboProfile from "./GomboProfile";
import { useAuth } from "../AuthContext";
import { ErrorBoundary } from "./ErrorBoundary";
import PremiumLoader from "./PremiumLoader";

interface HeritagePageProps {
  onNavigateView: (view: string, tab?: any) => void;
  darkMode?: boolean;
  setDarkMode?: (val: boolean) => void;
  initialPanelView?: "main" | "edit" | "settings" | "support" | "certification";
  onViewPublicPortfolio?: (userId: string) => void;
}

export default function HeritagePage({ onNavigateView, darkMode, setDarkMode, initialPanelView, onViewPublicPortfolio }: HeritagePageProps) {
  const { profile, refreshProfile, logout } = useAuth();

  return (
    <ErrorBoundary moduleName="Mon Héritage">
      <div className="w-full bg-afri-bg text-afri-text min-h-[70vh]">
        {profile ? (
          <GomboProfile
            currentUserProfile={profile}
            onRefreshProfile={refreshProfile}
            onLogout={logout}
            onNavigateView={onNavigateView}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            initialPanelView={initialPanelView}
            onViewPublicPortfolio={onViewPublicPortfolio}
          />
        ) : (
          <div className="flex justify-center items-center h-[50vh]">
            <PremiumLoader message="Chargement de votre Héritage d'Or..." />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
