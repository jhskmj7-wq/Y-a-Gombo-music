import React, { Suspense } from "react";
import { useAuth } from "../AuthContext";
import { lazyWithRetry } from "../lib/lazyWithRetry";

const AfrigomboBuilders = lazyWithRetry(() => import("./AfrigomboBuilders"));

interface SupportAfrigomboProps {
  onBack?: () => void;
  audioSynth?: any;
}

export default function SupportAfrigombo({ onBack, audioSynth }: SupportAfrigomboProps) {
  const { profile } = useAuth();
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center p-8"><div className="w-8 h-8 rounded-full border-t-2 border-afri-gold animate-spin"></div></div>}>
      <AfrigomboBuilders 
        currentUser={profile as any} 
        onBack={onBack} 
        audioSynth={audioSynth} 
      />
    </Suspense>
  );
}
