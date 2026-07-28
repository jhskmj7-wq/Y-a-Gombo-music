import React from "react";
import { useAuth } from "../AuthContext";
import AfrigomboBuilders from "./AfrigomboBuilders";

interface SupportAfrigomboProps {
  onBack?: () => void;
  audioSynth?: any;
}

export default function SupportAfrigombo({ onBack, audioSynth }: SupportAfrigomboProps) {
  const { profile } = useAuth();
  return (
    <AfrigomboBuilders 
      currentUser={profile as any} 
      onBack={onBack} 
      audioSynth={audioSynth} 
    />
  );
}
