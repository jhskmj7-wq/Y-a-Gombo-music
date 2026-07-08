import React from "react";
import Dashboards from "./Dashboards";
import { useAuth } from "../AuthContext";

export default function MyGombosPage() {
  const { profile, refreshProfile } = useAuth();

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#F5F5F5]">
      {profile ? (
        <Dashboards
          currentUserProfile={profile}
          onRefreshProfile={refreshProfile}
        />
      ) : (
        <div className="flex justify-center items-center h-[50vh] text-zinc-500">
          Chargement de vos Gombos...
        </div>
      )}
    </div>
  );
}
