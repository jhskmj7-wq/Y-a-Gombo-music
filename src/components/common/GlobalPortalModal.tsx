import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

// Lock scroll utility
export function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    
    document.body.style.overflow = "hidden";
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // allow escape key handling
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow || "";
      document.body.style.touchAction = originalTouchAction || "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);
}

/**
 * 1. Android Bottom Sheet Component
 * - Portal to document.body
 * - Slides up from bottom (translateY(100%) -> translateY(0), 220ms duration)
 * - Fixed position: inset-0, z-index: 99999
 * - Dark overlay rgba(0,0,0,0.65) with backdrop-blur
 * - Drag handle bar at top + drag down to dismiss
 * - Responsive max-width 560px centered
 */
export const AndroidBottomSheet: React.FC<BaseModalProps & { title?: React.ReactNode; subtitle?: React.ReactNode }> = ({
  isOpen,
  onClose,
  children,
  className = "",
  showCloseButton = true,
  title,
  subtitle
}) => {
  useBodyScrollLock(isOpen);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[99999] flex flex-col justify-end pointer-events-auto select-none" 
          style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh" }}
        >
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/65 backdrop-blur-sm cursor-pointer"
          />

          {/* Bottom Sheet Container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 300) {
                onClose();
              }
            }}
            className={`relative w-full max-w-[560px] mx-auto bg-afri-bg-sec border-t-2 border-x-2 border-[#D4AF37]/40 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-10 max-h-[88vh] flex flex-col ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle Bar */}
            <div className="pt-3 pb-1 flex justify-center items-center shrink-0 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-zinc-600/80 rounded-full hover:bg-[#D4AF37]/60 transition-colors" />
            </div>

            {/* Optional Header */}
            {(title || showCloseButton) && (
              <div className="px-5 pb-3 border-b border-afri-border/60 flex items-center justify-between shrink-0">
                <div className="flex-1 pr-2">
                  {title && <div className="text-sm sm:text-base font-black uppercase text-afri-text tracking-wide">{title}</div>}
                  {subtitle && <div className="text-[10px] text-afri-text-sec uppercase tracking-wider font-mono mt-0.5">{subtitle}</div>}
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-afri-bg border border-afri-border text-afri-text-sec hover:text-white flex items-center justify-center cursor-pointer shrink-0"
                    aria-label="Fermer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Sheet Scrollable Body */}
            <div className="p-5 overflow-y-auto overscroll-contain flex-1 custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

/**
 * 2. Android Centered Dialog Component
 * - Portal to document.body
 * - Centered on screen (scale(0.95) + opacity -> scale(1))
 * - Fixed position: inset-0, z-index: 99999
 * - Dark overlay rgba(0,0,0,0.65) with backdrop-blur
 * - Responsive max-width 560px centered
 */
export const AndroidCenteredDialog: React.FC<BaseModalProps & { title?: React.ReactNode; subtitle?: React.ReactNode }> = ({
  isOpen,
  onClose,
  children,
  className = "",
  showCloseButton = true,
  title,
  subtitle
}) => {
  useBodyScrollLock(isOpen);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pointer-events-auto select-none" 
          style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh" }}
        >
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/65 backdrop-blur-sm cursor-pointer"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`relative w-full max-w-[560px] mx-auto bg-afri-bg-sec border border-[#D4AF37]/40 rounded-2xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden z-10 max-h-[88vh] my-auto flex flex-col ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="pb-3 mb-3 border-b border-afri-border/60 flex items-center justify-between shrink-0">
                <div className="flex-1 pr-2">
                  {title && <div className="text-sm sm:text-base font-black uppercase text-afri-text tracking-wide">{title}</div>}
                  {subtitle && <div className="text-[10px] text-afri-text-sec uppercase tracking-wider font-mono mt-0.5">{subtitle}</div>}
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-afri-bg border border-afri-border text-afri-text-sec hover:text-white flex items-center justify-center cursor-pointer shrink-0"
                    aria-label="Fermer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Dialog Content */}
            <div className="overflow-y-auto overscroll-contain flex-1 custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
