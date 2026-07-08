import React from "react";
import GomboProfile from "./GomboProfile";
import { useAuth } from "../AuthContext";

export default function HeritagePage() {
  const { profile, refreshProfile, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#F5F5F5]">
      {profile ? (
        <GomboProfile
          currentUserProfile={profile}
          onRefreshProfile={refreshProfile}
          onLogout={logout}
          onNavigateView={(view, tab) => {
            console.log("Profile navigated to:", view, tab);
          }}
        />
      ) : (
        <div className="flex justify-center items-center h-[50vh] text-zinc-500">
          Chargement de votre Héritage...
        </div>
      )}
    </div>
  );
}
