import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, CheckCircle2, AlertTriangle, Info, CreditCard, 
  ChevronRight, ArrowLeft, ShieldCheck, Sparkles, Check
} from "lucide-react";

export type AfriModalType = 
  | "bottom_sheet"
  | "dialog"
  | "confirm"
  | "success"
  | "error"
  | "payment"
  | "info"
  | "actions"
  | "selector";

export interface AfriModalActionItem {
  id: string | number;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

export interface AfriModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: AfriModalType;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  closeOnOutsideClick?: boolean;
  
  // Confirm / Action props
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;

  // Custom icon or badge
  icon?: React.ReactNode;

  // Items for selector or actions list
  items?: AfriModalActionItem[];
}

// Lock scroll utility
export function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    
    document.body.style.overflow = "hidden";
    
    // Android back button / history handling
    const handlePopState = () => {
      // Optional back button close trigger
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Handled by modal instances
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow || "";
      document.body.style.touchAction = originalTouchAction || "";
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);
}

/**
 * AFRIMODAL COMPONENT
 * Global unified modal component with standard dark blur backdrop, 
 * smooth transitions, portal mounting, and Android optimization.
 */
export const AfriModal: React.FC<AfriModalProps> = ({
  isOpen,
  onClose,
  type = "dialog",
  title,
  subtitle,
  children,
  className = "",
  showCloseButton = true,
  closeOnOutsideClick = true,
  onConfirm,
  onCancel,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  isConfirming = false,
  icon,
  items = []
}) => {
  useBodyScrollLock(isOpen);

  if (typeof document === "undefined") return null;

  const handleOutsideClick = () => {
    if (closeOnOutsideClick) {
      onClose();
    }
  };

  const isBottomSheet = type === "bottom_sheet";

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div 
          className={`fixed inset-0 z-[99999] flex ${isBottomSheet ? 'flex-col justify-end' : 'items-center justify-center p-4'} pointer-events-auto select-none`}
          style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh" }}
        >
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={handleOutsideClick}
            className="absolute inset-0 bg-black/70 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          {isBottomSheet ? (
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
                className={`relative w-full max-w-[560px] mx-auto bg-afri-bg-sec border-t border-x border-[#D4AF37]/30 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.85)] overflow-hidden z-10 max-h-[88vh] flex flex-col ${className}`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Drag Handle */}
                <div className="pt-3 pb-2 flex justify-center items-center shrink-0 cursor-grab active:cursor-grabbing">
                  <div className="w-12 h-1.5 bg-gray-600/60 rounded-full mx-auto mb-1 transition-colors" />
                </div>

              {/* Header */}
              {(title || showCloseButton) && (
                <div className="px-5 pb-3 border-b border-afri-border/60 flex items-center justify-between shrink-0">
                  <div className="flex-1 pr-2">
                    {title && <div className="text-sm sm:text-base font-black uppercase text-afri-text tracking-wide flex items-center gap-2">{title}</div>}
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

              {/* Body */}
              <div className={`overflow-y-auto overscroll-contain flex-1 custom-scrollbar ${isBottomSheet ? 'p-4 sm:p-6 pb-8' : 'p-5'}`}>
                {renderModalBody(type, children, {
                  icon,
                  onConfirm,
                  onCancel,
                  onClose,
                  confirmText,
                  cancelText,
                  isConfirming,
                  items
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`relative w-full max-w-[560px] mx-auto bg-afri-bg-sec border border-[#D4AF37]/40 rounded-2xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden z-10 max-h-[88vh] my-auto flex flex-col ${className}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="pb-3 mb-3 border-b border-afri-border/60 flex items-center justify-between shrink-0">
                  <div className="flex-1 pr-2">
                    {title && <div className="text-sm sm:text-base font-black uppercase text-afri-text tracking-wide flex items-center gap-2">{title}</div>}
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

              {/* Body */}
              <div className="overflow-y-auto overscroll-contain flex-1 custom-scrollbar">
                {renderModalBody(type, children, {
                  icon,
                  onConfirm,
                  onCancel,
                  onClose,
                  confirmText,
                  cancelText,
                  isConfirming,
                  items
                })}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

// Helper renderer for specific modal types
function renderModalBody(
  type: AfriModalType,
  children: React.ReactNode,
  opts: {
    icon?: React.ReactNode;
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void;
    onClose: () => void;
    confirmText: string;
    cancelText: string;
    isConfirming: boolean;
    items: AfriModalActionItem[];
  }
) {
  const { icon, onConfirm, onCancel, onClose, confirmText, cancelText, isConfirming, items } = opts;

  switch (type) {
    case "success":
      return (
        <div className="text-center space-y-4 py-2">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            {icon || <CheckCircle2 className="w-6 h-6" />}
          </div>
          <div className="text-xs sm:text-sm text-afri-text font-medium leading-relaxed">
            {children}
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
          >
            Fermer
          </button>
        </div>
      );

    case "error":
      return (
        <div className="text-center space-y-4 py-2">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
            {icon || <AlertTriangle className="w-6 h-6" />}
          </div>
          <div className="text-xs sm:text-sm text-afri-text font-medium leading-relaxed">
            {children}
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
          >
            Fermer
          </button>
        </div>
      );

    case "confirm":
      return (
        <div className="space-y-4 py-2">
          {icon && (
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center">
                {icon}
              </div>
            </div>
          )}
          <div className="text-xs sm:text-sm text-afri-text font-medium leading-relaxed">
            {children}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                if (onCancel) onCancel();
                onClose();
              }}
              className="flex-1 py-2.5 bg-afri-bg border border-afri-border hover:bg-afri-bg-ter text-afri-text-sec text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              onClick={async () => {
                if (onConfirm) await onConfirm();
                onClose();
              }}
              disabled={isConfirming}
              className="flex-1 py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              {isConfirming ? "..." : confirmText}
            </button>
          </div>
        </div>
      );

    case "payment":
      return (
        <div className="space-y-4 py-2">
          <div className="p-4 bg-gradient-to-r from-afri-bg to-afri-bg-sec border border-[#D4AF37]/30 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-widest block font-bold">Portefeuille Securisé</span>
              <h4 className="text-xs font-black text-afri-text uppercase">Paiement Instantané AFRIGOMBO</h4>
            </div>
          </div>
          <div className="text-xs text-afri-text font-medium leading-relaxed">
            {children}
          </div>
          {onConfirm && (
            <button
              onClick={async () => {
                await onConfirm();
                onClose();
              }}
              disabled={isConfirming}
              className="w-full py-3 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isConfirming ? "Traitement..." : confirmText || "Valider le paiement"}</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          )}
        </div>
      );

    case "info":
      return (
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3 p-3 bg-afri-bg rounded-xl border border-afri-border/60 text-xs">
            <Info className="w-5 h-5 text-[#D4AF37] shrink-0" />
            <div className="text-afri-text font-medium leading-relaxed">
              {children}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-afri-bg border border-afri-border hover:bg-afri-bg-ter text-afri-text text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
          >
            Compris
          </button>
        </div>
      );

    case "actions":
    case "selector":
      return (
        <div className="space-y-3 py-1">
          {children && <div className="text-xs text-afri-text-sec mb-2">{children}</div>}
          <div className="space-y-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.onClick) item.onClick();
                  onClose();
                }}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  item.danger
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                    : 'bg-afri-bg border-afri-border hover:border-[#D4AF37]/50 text-afri-text'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon && <span className="text-[#D4AF37]">{item.icon}</span>}
                  <div>
                    <span className="text-xs font-bold uppercase block">{item.label}</span>
                    {item.description && (
                      <span className="text-[10px] text-afri-text-sec block">{item.description}</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-afri-text-sec" />
              </button>
            ))}
          </div>
        </div>
      );

    default:
      return <>{children}</>;
  }
}

/**
 * MODAL CONTEXT & PROVIDER
 * Enables programmatic modal invocation via useModal().openModal(...)
 */

export interface ModalConfig extends Partial<AfriModalProps> {
  id?: string;
  message?: React.ReactNode;
}

interface ModalContextType {
  openModal: (config: ModalConfig) => string;
  closeModal: (id?: string) => void;
  closeAll: () => void;
  openConfirm: (config: { title?: string; message: React.ReactNode; onConfirm: () => void | Promise<void>; confirmText?: string; cancelText?: string }) => string;
  openSuccess: (config: { title?: string; message: React.ReactNode }) => string;
  openError: (config: { title?: string; message: React.ReactNode }) => string;
  openPayment: (config: { title?: string; message: React.ReactNode; onConfirm: () => void | Promise<void>; confirmText?: string }) => string;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modals, setModals] = useState<ModalConfig[]>([]);

  const openModal = useCallback((config: ModalConfig) => {
    const id = config.id || `modal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newModal: ModalConfig = {
      ...config,
      id,
      isOpen: true,
    };
    setModals((prev) => [...prev, newModal]);
    return id;
  }, []);

  const closeModal = useCallback((id?: string) => {
    setModals((prev) => {
      if (!id) return prev.slice(0, -1); // close top modal
      return prev.filter((m) => m.id !== id);
    });
  }, []);

  const closeAll = useCallback(() => {
    setModals([]);
  }, []);

  const openConfirm = useCallback((config: { title?: string; message: React.ReactNode; onConfirm: () => void | Promise<void>; confirmText?: string; cancelText?: string }) => {
    return openModal({
      type: "confirm",
      title: config.title || "Confirmation",
      children: config.message,
      onConfirm: config.onConfirm,
      confirmText: config.confirmText || "Confirmer",
      cancelText: config.cancelText || "Annuler"
    });
  }, [openModal]);

  const openSuccess = useCallback((config: { title?: string; message: React.ReactNode }) => {
    return openModal({
      type: "success",
      title: config.title || "Succès",
      children: config.message,
    });
  }, [openModal]);

  const openError = useCallback((config: { title?: string; message: React.ReactNode }) => {
    return openModal({
      type: "error",
      title: config.title || "Erreur",
      children: config.message,
    });
  }, [openModal]);

  const openPayment = useCallback((config: { title?: string; message: React.ReactNode; onConfirm: () => void | Promise<void>; confirmText?: string }) => {
    return openModal({
      type: "payment",
      title: config.title || "Paiement",
      children: config.message,
      onConfirm: config.onConfirm,
      confirmText: config.confirmText || "Payer",
    });
  }, [openModal]);

  return (
    <ModalContext.Provider value={{ openModal, closeModal, closeAll, openConfirm, openSuccess, openError, openPayment }}>
      {children}
      {/* Programmatic Modal Stack Rendering */}
      {modals.map((modal) => (
        <AfriModal
          key={modal.id}
          isOpen={true}
          onClose={() => closeModal(modal.id)}
          type={modal.type || "dialog"}
          title={modal.title}
          subtitle={modal.subtitle}
          showCloseButton={modal.showCloseButton !== false}
          closeOnOutsideClick={modal.closeOnOutsideClick !== false}
          className={modal.className}
          onConfirm={modal.onConfirm}
          onCancel={modal.onCancel}
          confirmText={modal.confirmText}
          cancelText={modal.cancelText}
          isConfirming={modal.isConfirming}
          icon={modal.icon}
          items={modal.items}
        >
          {modal.children || modal.message}
        </AfriModal>
      ))}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    // Fallback if component is used outside ModalProvider
    return {
      openModal: () => "",
      closeModal: () => {},
      closeAll: () => {},
      openConfirm: () => "",
      openSuccess: () => "",
      openError: () => "",
      openPayment: () => ""
    };
  }
  return context;
};

// Aliases for backward compatibility
export const AndroidBottomSheet: React.FC<AfriModalProps> = (props) => (
  <AfriModal {...props} type="bottom_sheet" />
);

export const AndroidCenteredDialog: React.FC<AfriModalProps> = (props) => (
  <AfriModal {...props} type="dialog" />
);
