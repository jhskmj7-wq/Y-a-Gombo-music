import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function UpdateNotification() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('📡 [AFRIGOMBO] SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('❌ [AFRIGOMBO] SW registration error', error);
    },
  });

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-24 left-4 right-4 z-[9999] p-4 bg-[#111111] border border-[#D4AF37]/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#D4AF37]/20 rounded-full">
               <RotateCcw className="w-5 h-5 text-[#D4AF37] animate-spin-slow" />
            </div>
            <div className='flex flex-col'>
                <p className='text-sm font-black uppercase tracking-wider text-[#D4AF37]'>Mise à jour disponible</p>
                <p className='text-[10px] text-white/60 uppercase tracking-tight'>Une nouvelle version est prête.</p>
            </div>
          </div>
          <button 
            onClick={() => {
              console.log('🔄 [AFRIGOMBO] Updating Service Worker...');
              updateServiceWorker(true);
            }}
            className="px-5 py-2.5 bg-[#D4AF37] text-black font-black uppercase text-[10px] rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all"
          >
            Actualiser
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
