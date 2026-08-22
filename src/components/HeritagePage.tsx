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
  onSubPanelChange?: (isSubPanel: boolean) => void;
}

export default function HeritagePage({ onNavigateView, darkMode, setDarkMode, initialPanelView, onViewPublicPortfolio, onSubPanelChange }: HeritagePageProps) {
  const { profile, currentUser, refreshProfile, logout } = useAuth();

  const activeProfile = profile || (currentUser ? ({
    uid: currentUser.uid,
    id: currentUser.uid,
    email: currentUser.email || "jhs.kmj7@gmail.com",
    displayName: currentUser.displayName || "Membre Elite",
    firstName: currentUser.displayName?.split(" ")[0] || "Membre",
    lastName: currentUser.displayName?.split(" ")[1] || "Elite",
    role: "client",
    userRole: "client",
    balance: 0,
  } as any) : null);

  return (
    <ErrorBoundary moduleName="Mon Héritage">
      <div className="w-full h-full flex-1 flex flex-col min-h-0 bg-afri-bg text-afri-text">
        {activeProfile ? (
          <GomboProfile
            currentUserProfile={activeProfile}
            onRefreshProfile={refreshProfile}
            onLogout={logout}
            onNavigateView={onNavigateView}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            initialPanelView={initialPanelView}
            onViewPublicPortfolio={onViewPublicPortfolio}
            onSubPanelChange={onSubPanelChange}
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
