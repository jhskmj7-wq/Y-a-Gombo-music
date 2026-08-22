import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

export interface AndroidBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  closeOnOutsideClick?: boolean;
  maxHeight?: string;
}

export const AndroidBottomSheet: React.FC<AndroidBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  className = "",
  showCloseButton = true,
  closeOnOutsideClick = true,
  maxHeight = "85vh"
}) => {
  // Lock body scroll when BottomSheet is open
  useEffect(() => {
    if (!isOpen) return;
    const origOverflow = document.body.style.overflow;
    const origTouchAction = document.body.style.touchAction;
    
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = origOverflow || "";
      document.body.style.touchAction = origTouchAction || "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[99999] flex flex-col justify-end pointer-events-auto select-none overflow-hidden"
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100dvh" }}
        >
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (closeOnOutsideClick) onClose();
            }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer z-0"
          />

          {/* Android Material Design 3 Bottom Sheet Container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 300) {
                onClose();
              }
            }}
            className={`relative w-full bg-[#0A0A0A] border-t-2 border-[#D4AF37] border-x border-[#D4AF37]/30 rounded-t-[28px] sm:rounded-t-[32px] shadow-[0_-12px_48px_rgba(0,0,0,0.9)] overflow-hidden z-10 flex flex-col ${className}`}
            style={{ 
              maxHeight,
              paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle Bar */}
            <div className="pt-3 pb-2 flex justify-center items-center shrink-0 cursor-grab active:cursor-grabbing w-full touch-none select-none">
              <div className="w-12 h-1.5 bg-zinc-600/80 hover:bg-zinc-500 rounded-full transition-colors" />
            </div>

            {/* Header (if title or close button provided) */}
            {(title || showCloseButton) && (
              <div className="px-5 pb-3 border-b border-afri-border/60 flex items-center justify-between shrink-0">
                <div className="flex-1 pr-2 min-w-0">
                  {title && (
                    <div className="text-base font-black uppercase text-afri-text tracking-wide flex items-center gap-2 truncate">
                      {title}
                    </div>
                  )}
                  {subtitle && (
                    <div className="text-[11px] text-afri-text-sec uppercase tracking-wider font-mono mt-0.5 truncate">
                      {subtitle}
                    </div>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={() => {
                      try { if (navigator?.vibrate) navigator.vibrate(8); } catch(_) {}
                      onClose();
                    }}
                    className="w-9 h-9 rounded-full bg-afri-bg-sec border border-afri-border text-afri-text-sec hover:text-afri-text flex items-center justify-center cursor-pointer shrink-0 active:scale-95 transition-transform"
                    aria-label="Fermer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Scrollable Body Content */}
            <div className="overflow-y-auto overscroll-contain flex-1 p-5 custom-scrollbar max-w-full text-left">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default AndroidBottomSheet;
