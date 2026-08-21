import React from "react";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  onClick: () => void;
  className?: string;
  label?: string;
}

export function BackButton({ onClick, className = "", label }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[48px] flex items-center justify-center rounded-xl bg-afri-bg-sec border border-afri-border hover:bg-afri-bg-sec/80 cursor-pointer ${label ? 'px-4 gap-2' : 'w-12'} ${className}`}
      aria-label={label || "Retour"}
    >
      <ArrowLeft className="w-5 h-5 text-afri-gold" />
      {label && <span className="text-xs font-bold text-afri-text-sec">{label}</span>}
    </button>
  );
}
