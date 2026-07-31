import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface AndroidModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const AndroidModal: React.FC<AndroidModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-afri-bg/60 backdrop-blur-[2px] select-none">
          <div className="absolute inset-0 cursor-pointer" onClick={onClose} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="w-[92%] max-w-[480px] max-h-[85vh] h-auto bg-[#08080a] border border-afri-border rounded-[24px] flex flex-col overflow-hidden relative shadow-2xl z-20"
          >
            {/* Android Pill Handle */}
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto my-3 shrink-0" />

            {title && (
              <div className="px-5 pb-3 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
                <h3 className="text-sm font-bold text-[#D4AF37] font-mono tracking-wider">{title}</h3>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full bg-afri-bg-sec border border-afri-border text-afri-text-sec hover:text-afri-text min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div 
              className="flex-1 p-5 overflow-y-auto overflow-x-hidden overscroll-contain w-full max-w-full space-y-4"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AndroidModal;
