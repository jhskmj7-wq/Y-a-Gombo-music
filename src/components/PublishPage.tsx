import React from "react";
import GomboPublish from "./GomboPublish";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";

export default function PublishPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-afri-bg-sec text-afri-text py-6 px-4">
      {profile ? (
        <GomboPublish
          currentUserProfile={profile}
          onSuccess={() => {
            navigate("/home");
          }}
          onCancel={() => {
            navigate("/home");
          }}
        />
      ) : (
        <div className="flex justify-center items-center h-[50vh] text-afri-text-sec">
          Chargement du profil...
        </div>
      )}
    </div>
  );
}
