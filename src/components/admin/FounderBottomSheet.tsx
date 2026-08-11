import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

export interface FounderBottomSheetProps {
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

/**
 * FounderBottomSheet - A specialized Bottom Sheet for the Super Founder Dashboard.
 * Uniformizes all administrative modals into a consistent Android-style bottom sheet.
 */
export const FounderBottomSheet: React.FC<FounderBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  className = "",
  showCloseButton = true,
  closeOnOutsideClick = true,
  maxHeight = "90vh"
}) => {
  // Lock body scroll when BottomSheet is open
  useEffect(() => {
    if (!isOpen) return;
    const origOverflow = document.body.style.overflow;
    
    document.body.style.overflow = "hidden";
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = origOverflow || "";
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
            className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer z-0"
          />

          {/* Bottom Sheet Container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className={`relative w-full bg-[#0A0A0A] border-t-2 border-[#D4AF37] border-x border-[#D4AF37]/20 rounded-t-[32px] shadow-[0_-12px_64px_rgba(0,0,0,0.9)] overflow-hidden z-10 flex flex-col ${className}`}
            style={{ 
              maxHeight,
              paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle Bar (Visual only, to indicate bottom sheet nature) */}
            <div className="pt-3 pb-2 flex justify-center items-center shrink-0 cursor-default w-full touch-none select-none">
              <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full" />
            </div>

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="px-6 pb-4 border-b border-afri-border/40 flex items-center justify-between shrink-0">
                <div className="flex-1 pr-4 min-w-0">
                  {title && (
                    <h3 className="text-sm font-black uppercase text-afri-text tracking-wider flex items-center gap-2 truncate font-sans">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <div className="text-[10px] text-afri-text-sec uppercase tracking-widest font-mono mt-1 truncate">
                      {subtitle}
                    </div>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={() => {
                      try { if (navigator?.vibrate) navigator.vibrate(5); } catch(_) {}
                      onClose();
                    }}
                    className="w-10 h-10 rounded-full bg-afri-bg-sec border border-afri-border text-afri-text-sec hover:text-white flex items-center justify-center cursor-pointer shrink-0 active:scale-95 transition-all"
                    aria-label="Fermer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Scrollable Body Content */}
            <div className="overflow-y-auto overscroll-contain flex-1 p-6 custom-scrollbar max-w-full text-left">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default FounderBottomSheet;
