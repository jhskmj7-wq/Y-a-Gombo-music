import React, { useState, useEffect } from "react";
import { AfriGomboLogo } from "./AfriGomboLogo";

interface PremiumLoaderProps {
  message?: string;
}

export default function PremiumLoader({ message = "Connexion sécurisée..." }: PremiumLoaderProps) {
  const [isLogoLoaded, setIsLogoLoaded] = useState(false);
  const [isLogoFailed, setIsLogoFailed] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = "/public/logo_afrigombo.png";
    img.onload = () => setIsLogoLoaded(true);
    img.onerror = () => setIsLogoFailed(true);
  }, []);
  return (
    <div className="fixed inset-0 bg-afri-bg-sec z-[9999] flex flex-col items-center justify-center text-center p-6 select-none overflow-hidden">
      {/* Ambient Gold Dust / Particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {Array.from({ length: 15 }).map((_, idx) => (
          <div
            key={idx}
            className="absolute rounded-full bg-gradient-to-tr from-[#D4AF37] to-amber-100/30 opacity-40 animate-pulse"
            style={{
              width: `${Math.random() * 3 + 1.5}px`,
              height: `${Math.random() * 3 + 1.5}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 3 + 2}s`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Rotating and glowing sound waves */}
      <div className="relative w-36 h-36 flex items-center justify-center mb-6 border border-[#D4AF37]/15 rounded-full bg-afri-bg/40 shadow-[0_0_40px_rgba(212,175,55,0.05)] z-10">
        <div className="absolute inset-0.5 rounded-full border border-dashed border-[#D4AF37]/30 animate-spin" style={{ animationDuration: "16s" }} />
        
        {/* Glowing aura */}
        <div className="absolute w-24 h-24 rounded-full bg-afri-bg-sec/5 blur-xl animate-pulse" />

        {/* LOGO AFRIGOMBO (Official Image) */}
        {isLogoLoaded && !isLogoFailed ? (
          <img 
            src="/public/logo_afrigombo.png" 
            alt="" 
            className="w-24 h-24 relative z-10 object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]"
            referrerPolicy="no-referrer"
          />
        ) : (
          <AfriGomboLogo className="w-24 h-24 relative z-10" />
        )}
      </div>

      {/* Loading message */}
      <div className="space-y-1.5 z-10">
        <h2 className="text-afri-text text-xs font-mono uppercase tracking-[0.2em] font-black">{message}</h2>
        <p className="text-[10px] font-mono tracking-widest text-[#D4AF37] opacity-65 uppercase">Afrigombo Elite</p>
      </div>
    </div>
  );
}
