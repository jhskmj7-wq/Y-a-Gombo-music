import React from "react";
import { Lock, ArrowLeft, ShieldAlert } from "lucide-react";

export interface FeatureUnavailableProps {
  title?: string;
  description?: string;
  featureName?: string;
  onBack?: () => void;
  variant?: "coming_soon" | "temporary_disabled";
}

export const FeatureUnavailable: React.FC<FeatureUnavailableProps> = ({
  title,
  description,
  featureName,
  onBack,
  variant = "coming_soon"
}) => {
  const defaultTitle = title || (variant === "coming_soon" ? "🔒 Bientôt disponible" : "🔒 Fonctionnalité temporairement indisponible");
  const defaultDesc = description || (
    featureName 
      ? `Le module "${featureName}" est actuellement suspendu ou en cours de déploiement par le Centre de Déploiement AFRIGOMBO.`
      : "Cette fonctionnalité est temporairement indisponible ou sous maintenance programmée par l'administration AFRIGOMBO."
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-6 animate-fadeIn my-auto w-full max-w-lg mx-auto">
      {/* Icon Badge */}
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shadow-xl backdrop-blur-md">
          {variant === "temporary_disabled" ? (
            <ShieldAlert className="w-10 h-10 animate-pulse" />
          ) : (
            <Lock className="w-10 h-10 text-[#D4AF37]" />
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#111622] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] text-[10px] font-bold font-mono">
          OFF
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-[#111622]/90 border border-[#D4AF37]/20 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-3 w-full">
        {featureName && (
          <span className="inline-block px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[11px] font-mono tracking-widest uppercase font-semibold">
            {featureName}
          </span>
        )}

        <h2 className="text-xl font-black text-white font-mono tracking-wider uppercase">
          {defaultTitle}
        </h2>

        <p className="text-xs text-afri-text-sec font-mono leading-relaxed max-w-md mx-auto">
          {defaultDesc}
        </p>

        <div className="pt-2 text-[10px] text-gray-500 font-mono italic">
          Moteur de gouvernance AFRIGOMBO • Mis à jour en temps réel
        </div>
      </div>

      {/* Action Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-bold text-xs uppercase font-mono tracking-wider hover:bg-[#b8952b] transition shadow-lg hover:shadow-[#D4AF37]/20 cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETOURNER À L'ACCUEIL</span>
        </button>
      )}
    </div>
  );
};

export default FeatureUnavailable;
