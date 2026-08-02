import React, { useState } from "react";
import GomboPublish from "./GomboPublish";
import AudioPublishForm from "./AudioPublishForm";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import { Briefcase, Music } from "lucide-react";

export default function PublishPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [publishMode, setPublishMode] = useState<"gombo" | "audio">("gombo");

  return (
    <div className="min-h-[100dvh] bg-afri-bg-sec text-afri-text py-6 px-4">
      <div className="max-w-2xl mx-auto mb-6 flex items-center justify-center gap-3">
        <button
          onClick={() => setPublishMode("gombo")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase transition cursor-pointer border ${
            publishMode === "gombo"
              ? "bg-[#D4AF37] text-black border-[#D4AF37] shadow-lg"
              : "bg-afri-bg text-afri-text-sec border-afri-border hover:text-afri-text"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Publier un Gombo
        </button>
        <button
          onClick={() => setPublishMode("audio")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase transition cursor-pointer border ${
            publishMode === "audio"
              ? "bg-[#D4AF37] text-black border-[#D4AF37] shadow-lg"
              : "bg-afri-bg text-afri-text-sec border-afri-border hover:text-afri-text"
          }`}
        >
          <Music className="w-4 h-4" />
          Publier un Audio
        </button>
      </div>

      {profile ? (
        publishMode === "gombo" ? (
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
          <AudioPublishForm
            currentUserProfile={profile}
            onSuccess={() => {
              navigate("/home");
            }}
            onCancel={() => {
              navigate("/home");
            }}
          />
        )
      ) : (
        <div className="flex justify-center items-center h-[50vh] text-afri-text-sec">
          Chargement du profil...
        </div>
      )}
    </div>
  );
}

