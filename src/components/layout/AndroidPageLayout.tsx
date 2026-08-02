import React from "react";
import { BackButton } from "../common/BackButton";

interface AndroidPageLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  scrollable?: boolean;
  className?: string;
  // Kept for backward compatibility
  title?: string;
  onBack?: () => void;
}

export function AndroidPageLayout({
  children,
  header,
  footer,
  scrollable = true,
  className = "",
  title,
  onBack,
}: AndroidPageLayoutProps) {
  const headerContent = header || (title || onBack ? (
    <div className="flex-none bg-afri-bg/95 backdrop-blur-md border-b border-afri-border px-3 py-2 flex items-center gap-2">
      {onBack && <BackButton onClick={onBack} />}
      {title && <h1 className="text-sm font-black uppercase tracking-wider text-afri-text flex-1 truncate">{title}</h1>}
    </div>
  ) : null);

  return (
    <div className={`w-full h-full flex flex-col bg-afri-bg text-afri-text font-sans select-none overflow-hidden touch-pan-y ${className}`}>
      {headerContent}
      <div className={`flex-1 ${scrollable ? "overflow-y-auto overscroll-contain" : "overflow-hidden"} px-2 sm:px-3 py-3 safe-area-pb`}>
        {children}
      </div>
      {footer && <div className="flex-none safe-area-pb">{footer}</div>}
    </div>
  );
}
