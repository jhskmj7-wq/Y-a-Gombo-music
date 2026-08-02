import React from "react";

interface AndroidCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  id?: string;
}

export function AndroidCard({ children, className = "", onClick, id }: AndroidCardProps) {
  return (
    <div 
      id={id}
      onClick={onClick}
      className={`w-full bg-afri-bg-sec/40 border border-afri-border/80 rounded-[22px] p-[18px] mb-[14px] shadow-md transition-all ${onClick ? 'cursor-pointer hover:border-afri-gold/60 active:scale-[0.99]' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
