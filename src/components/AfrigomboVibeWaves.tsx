import React from "react";
import { motion } from "motion/react";

export const AfrigomboVibeWaves: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 flex items-end justify-around px-8 gap-1.5 pb-1 select-none z-0">
      {[...Array(10)].map((_, i) => {
        // Differing natural frequency durations and delays for a rhythmic, lively feel
        const duration = 1.0 + (i % 3) * 0.4;
        const delay = (i % 4) * 0.15;
        return (
          <motion.div
            key={i}
            animate={{
              height: ["20%", "75%", "30%", "90%", "20%"]
            }}
            transition={{
              duration,
              repeat: Infinity,
              delay,
              ease: "easeInOut",
              times: [0, 0.25, 0.5, 0.75, 1]
            }}
            style={{ willChange: "height" }}
            className="w-1.5 bg-gradient-to-t from-[#D4AF37]/50 to-[#D4AF37] rounded-t-full origin-bottom"
          />
        );
      })}
    </div>
  );
};
