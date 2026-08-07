import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RotateCcw } from 'lucide-react';

export default function UpdateNotification() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[9999] p-4 bg-afri-bg-sec border border-afri-gold rounded-2xl shadow-2xl flex items-center justify-between animate-fadeInUp">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-afri-gold/20 rounded-full">
           <RotateCcw className="w-5 h-5 text-afri-gold" />
        </div>
        <div className='text-sm text-afri-text'>
            <p className='font-bold'>Mise à jour disponible</p>
            <p className='text-xs opacity-80'>Une nouvelle version est prête.</p>
        </div>
      </div>
      <button 
        onClick={() => updateServiceWorker(true)}
        className="px-4 py-2 bg-afri-gold text-black font-black uppercase text-xs rounded-xl"
      >
        Mettre à jour
      </button>
    </div>
  );
}
