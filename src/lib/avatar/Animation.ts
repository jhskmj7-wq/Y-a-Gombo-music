
/**
 * AFRIGOMBO ELITE - AVATAR ANIMATION ENGINE
 * Handles lightweight SVG animations for premium items.
 */
export const AvatarAnimation = {
  getAnimationStyles(type?: string): React.CSSProperties {
    switch (type) {
      case "Flottant":
        return {
          animation: "afri-float 3s ease-in-out infinite"
        };
      case "Scintillant":
        return {
          animation: "afri-sparkle 2s linear infinite"
        };
      case "Ondulation":
        return {
          animation: "afri-wave 4s ease-in-out infinite"
        };
      case "Super-Glow":
        return {
          filter: "drop-shadow(0 0 8px rgba(212, 175, 55, 0.6))",
          animation: "afri-glow 2s ease-in-out infinite"
        };
      default:
        return {};
    }
  },

  getAnimationKeyframes(): string {
    return `
      @keyframes afri-float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-5px); }
      }
      @keyframes afri-sparkle {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      @keyframes afri-wave {
        0%, 100% { transform: scaleX(1); }
        50% { transform: scaleX(1.02); }
      }
      @keyframes afri-glow {
        0%, 100% { filter: drop-shadow(0 0 5px rgba(212, 175, 55, 0.4)); }
        50% { filter: drop-shadow(0 0 12px rgba(212, 175, 55, 0.8)); }
      }
    `;
  }
};
