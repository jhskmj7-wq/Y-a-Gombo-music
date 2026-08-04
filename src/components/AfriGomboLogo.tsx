import React from "react";
import { motion } from "motion/react";

export const AfriGomboLogo: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`relative flex items-center justify-center ${className} select-none`}>
      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 bg-afri-gold/10 blur-xl rounded-full scale-75 animate-pulse pointer-events-none" />
      
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] antialiased"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* MUSICAL LINES (PORTÉES) - BOTTOM */}
        <g opacity="0.5" stroke="#D4AF37" strokeWidth="0.5" strokeLinecap="round">
          <line x1="25" y1="82" x2="75" y2="82" />
          <line x1="20" y1="86" x2="80" y2="86" />
          <line x1="15" y1="90" x2="85" y2="90" />
        </g>

        {/* MAIN LETTER 'A' */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          d="M50 15 L86 85 H70 L50 43 L30 85 H14 L50 15 Z"
          fill="url(#goldGradientMaster)"
          stroke="#D4AF37"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
        
        {/* CROSS BAR OF 'A' */}
        <motion.rect
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          x="35" y="62" width="30" height="2.5" rx="1.25"
          fill="url(#goldGradientMaster)"
        />

        {/* IMPERIAL CROWN AT THE TOP */}
        <motion.g
          initial={{ y: -5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.5, type: "spring" }}
          transform="translate(50, 14) scale(0.18)"
        >
          <path d="M-60 10 H60 L75 -25 L35 -5 L0 -45 L-35 -5 L-75 -25 Z" 
                fill="url(#goldGradientMaster)" 
                stroke="#D4AF37" 
                strokeWidth="2" />
          
          {/* Jewels */}
          <circle cx="0" cy="-45" r="8" fill="#FFFFFF" />
          <circle cx="-75" cy="-25" r="6" fill="#FFFFFF" />
          <circle cx="75" cy="-25" r="6" fill="#FFFFFF" />
        </motion.g>

        {/* STYLIZED MUSICAL NOTES */}
        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.8, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          fill="#D4AF37"
        >
          <circle cx="28" cy="82" r="1.5" />
          <path d="M29 82 V72 Q34 74 34 78 V77 Q34 75 30 73 V82" />
          
          <circle cx="72" cy="82" r="1.5" />
          <path d="M73 82 V72 Q78 74 78 78 V77 Q78 75 74 73 V82" />
        </motion.g>

        {/* GRADIENTS */}
        <defs>
          <linearGradient id="goldGradientMaster" x1="50" y1="15" x2="50" y2="85" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF2A3" />
            <stop offset="25%" stopColor="#F1C40F" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#8A6707" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
