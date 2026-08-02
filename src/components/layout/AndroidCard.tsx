import React from "react";

interface AndroidCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function AndroidCard({ children, className = "", onClick }: AndroidCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`w-full bg-afri-bg-sec/20 border border-afri-border rounded-xl p-3 shadow-sm ${onClick ? 'cursor-pointer hover:border-afri-gold/50' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
