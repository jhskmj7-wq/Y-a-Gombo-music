import React from "react";
import Dashboards from "./Dashboards";
import { useAuth } from "../AuthContext";

export default function MyGombosPage() {
  const { profile, refreshProfile } = useAuth();

  return (
    <div className="min-h-screen bg-afri-bg-sec text-afri-text">
      {profile ? (
        <Dashboards
          currentUserProfile={profile}
          onRefreshProfile={refreshProfile}
        />
      ) : (
        <div className="flex justify-center items-center h-[50vh] text-afri-text-sec">
          Chargement de vos Gombos...
        </div>
      )}
    </div>
  );
}
