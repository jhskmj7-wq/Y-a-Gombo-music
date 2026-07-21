import React from "react";
import { motion } from "motion/react";

export const AfriGomboLogo: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`relative flex items-center justify-center ${className} select-none`}>
      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 bg-afri-bg-sec/15 blur-lg rounded-full scale-50 animate-pulse pointer-events-none" />
      
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] antialiased"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* MUSICAL LINES (PORTÉES) */}
        <g opacity="0.4">
          <line x1="20" y1="75" x2="80" y2="75" stroke="#D4AF37" strokeWidth="0.5" />
          <line x1="15" y1="80" x2="85" y2="80" stroke="#D4AF37" strokeWidth="0.5" />
          <line x1="10" y1="85" x2="90" y2="85" stroke="#D4AF37" strokeWidth="0.5" />
        </g>

        {/* MAIN LETTER 'A' */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          d="M50 15L85 90H70L50 45L30 90H15L50 15Z"
          fill="url(#goldGradient)"
          stroke="#D4AF37"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        
        {/* CROSS BAR OF 'A' */}
        <motion.path
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          d="M38 65H62"
          stroke="#D4AF37"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* CROWN AT THE TOP */}
        <motion.g
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5, type: "spring" }}
        >
          {/* Crown Base */}
          <path d="M40 18H60L62 12L55 15L50 8L45 15L38 12L40 18Z" fill="#D4AF37" />
          {/* Jewels */}
          <circle cx="50" cy="9.5" r="1.2" fill="#F1C40F" />
          <circle cx="41" cy="13.5" r="0.8" fill="#F1C40F" />
          <circle cx="59" cy="13.5" r="0.8" fill="#F1C40F" />
        </motion.g>

        {/* GRADIENTS */}
        <defs>
          <linearGradient id="goldGradient" x1="50" y1="15" x2="50" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F1C40F" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#946F07" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
