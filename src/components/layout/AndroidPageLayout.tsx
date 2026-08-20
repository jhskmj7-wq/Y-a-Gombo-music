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
    <header className="flex-none bg-afri-bg/95 backdrop-blur-md border-b border-afri-border/60 px-3 py-2.5 flex items-center justify-between gap-2 z-35 shrink-0" style={{ paddingTop: 'max(10px, env(safe-area-inset-top))', paddingLeft: 'max(12px, env(safe-area-inset-left))', paddingRight: 'max(12px, env(safe-area-inset-right))' }}>
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
    <div 
      className={`flex flex-col flex-1 min-h-0 w-full bg-afri-bg text-afri-text font-sans select-none ${scrollable ? "h-full overflow-hidden" : "h-auto"} ${className}`}
      style={{
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      {headerContent}
      
      <main 
        className={`flex-1 w-full min-h-0 box-border overflow-x-hidden ${scrollable ? "overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]" : "overflow-visible"}`}
        style={{
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y",
          paddingBottom: scrollable ? "max(80px, env(safe-area-inset-bottom))" : undefined
        }}
      >
        {children}
      </main>
      
      {footer && <footer className="flex-none" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>{footer}</footer>}
    </div>
  );
}

export default AndroidPageLayout;
