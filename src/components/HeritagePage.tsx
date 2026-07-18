import React from "react";
import GomboProfile from "./GomboProfile";
import { useAuth } from "../AuthContext";

interface HeritagePageProps {
  onNavigateView: (view: string, tab?: any) => void;
  darkMode?: boolean;
  setDarkMode?: (val: boolean) => void;
  initialPanelView?: "main" | "edit" | "settings" | "support" | "certification";
}

export default function HeritagePage({ onNavigateView, darkMode, setDarkMode, initialPanelView }: HeritagePageProps) {
  const { profile, refreshProfile, logout } = useAuth();

  return (
    <div className="min-h-screen bg-afri-bg text-afri-text">
      {profile ? (
        <GomboProfile
          currentUserProfile={profile}
          onRefreshProfile={refreshProfile}
          onLogout={logout}
          onNavigateView={onNavigateView}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          initialPanelView={initialPanelView}
        />
      ) : (
        <div className="flex justify-center items-center h-[50vh] text-zinc-500">
          Chargement de votre Héritage...
        </div>
      )}
    </div>
  );
}
