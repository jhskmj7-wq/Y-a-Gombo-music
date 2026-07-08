import React from "react";
import GomboPublish from "./GomboPublish";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";

export default function PublishPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#F5F5F5] py-6 px-4">
      {profile ? (
        <GomboPublish
          currentUserProfile={profile}
          onSuccess={() => {
            console.log("Publish success!");
            navigate("/home");
          }}
          onCancel={() => {
            navigate("/home");
          }}
        />
      ) : (
        <div className="flex justify-center items-center h-[50vh] text-zinc-500">
          Chargement du profil...
        </div>
      )}
    </div>
  );
}
