import React from "react";
import { BackButton } from "../common/BackButton";

export interface AndroidPageLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  scrollable?: boolean;
  className?: string;
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
    <header className="flex-none bg-afri-bg/95 backdrop-blur-md border-b border-afri-border/60 px-3 py-2.5 flex items-center justify-between gap-2 z-30 shrink-0 safe-area-pt">
      <div className="flex items-center gap-2.5 min-w-0">
        {onBack && <BackButton onClick={onBack} />}
        {title && (
          <h1 className="text-sm sm:text-base font-black uppercase tracking-wider text-afri-text truncate font-display">
            {title}
          </h1>
        )}
      </div>
    </header>
  ) : null);

  return (
    <div className={`w-full h-[100dvh] flex flex-col bg-afri-bg text-afri-text font-sans select-none overflow-hidden touch-pan-y ${className}`}>
      {headerContent}
      <main className={`flex-1 w-full max-w-none box-border overflow-x-hidden ${scrollable ? "overflow-y-auto overscroll-contain" : "overflow-hidden"} px-[12px] pt-[12px] pb-[120px]`}>
        {children}
      </main>
      {footer && <footer className="flex-none safe-area-pb">{footer}</footer>}
    </div>
  );
}

export default AndroidPageLayout;

