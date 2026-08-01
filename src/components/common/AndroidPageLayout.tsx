import React from "react";
import { BackButton } from "./BackButton";

interface AndroidPageLayoutProps {
  title?: string;
  onBack?: () => void;
  children: React.ReactNode;
  header?: React.ReactNode;
}

export function AndroidPageLayout({ title, onBack, children, header }: AndroidPageLayoutProps) {
  return (
    <div className="w-full h-full flex flex-col bg-afri-bg text-afri-text font-sans select-none overflow-hidden touch-none">
      {/* Fixed Header */}
      <div className="flex-none bg-afri-bg/95 backdrop-blur-md border-b border-afri-border px-2 py-2 flex items-center gap-2">
        {onBack && <BackButton onClick={onBack} />}
        {title && <h1 className="text-sm font-black uppercase tracking-wider text-afri-text flex-1 truncate">{title}</h1>}
        {header}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-2 py-3 space-y-4">
        {children}
      </div>
    </div>
  );
}
