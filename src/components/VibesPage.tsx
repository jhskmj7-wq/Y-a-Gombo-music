import React, { useState } from "react";
import AnnuaireTalents from "./AnnuaireTalents";
import { AfrigomboVibeWaves } from "./AfrigomboVibeWaves";
import { useAuth } from "../AuthContext";

export default function VibesPage() {
  const { profile } = useAuth();
  const [selectedTalentUid, setSelectedTalentUid] = useState<string | null>(null);

  return (
    <div className="relative min-h-screen bg-afri-bg text-afri-text">
      {/* Decorative background waves */}
      <div className="absolute inset-x-0 bottom-0 h-40 overflow-hidden pointer-events-none opacity-20 z-0">
        <AfrigomboVibeWaves />
      </div>

      <div className="relative z-10">
        <AnnuaireTalents
          currentUserProfile={profile}
          onNavigateView={(view) => {
          }}
          selectedTalentUid={selectedTalentUid || undefined}
          onSelectTalent={(uid) => {
            setSelectedTalentUid(uid);
          }}
        />
      </div>
    </div>
  );
}
