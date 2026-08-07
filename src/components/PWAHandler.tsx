import React, { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BUILD_ID } from '../buildInfo';

export default function PWAHandler() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const { updateServiceWorker } = useRegisterSW({
    onRegistered(r) {
      console.log('📡 [AFRIGOMBO] SW Registered with BUILD_ID:', BUILD_ID);
      if (r) {
        // Auto check SW update quietly every 15 minutes
        setInterval(() => {
          r.update();
        }, 15 * 60 * 1000);
      }
    },
    onNeedRefresh() {
      // Auto update silently without prompt
      console.log('🔄 [AFRIGOMBO] Auto SW refresh triggered silently');
      updateServiceWorker(true);
    },
    onRegisterError(error) {
      console.error('❌ [AFRIGOMBO] SW registration error', error);
    },
  });

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      setShowInstall(true);
      console.log('✨ [AFRIGOMBO] PWA Install Prompt Available');
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstall(false);
      setDeferredPrompt(null);
      console.log('🎉 [AFRIGOMBO] App Installed Successfully');
    });

    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      setShowInstall(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    setShowInstall(false);
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`👤 [AFRIGOMBO] User ${outcome} the install prompt`);
    
    setDeferredPrompt(null);
  };

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[9999] pointer-events-none">
      <AnimatePresence>
        {/* INSTALL PROMPT */}
        {showInstall && !isInstalled && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="pointer-events-auto p-4 bg-afri-bg/95 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex items-center justify-between backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-full">
                 <Download className="w-5 h-5 text-white/80" />
              </div>
              <div className='flex flex-col'>
                  <p className='text-xs font-black uppercase tracking-wider text-white'>Installer l'App</p>
                  <p className='text-[9px] text-white/50 uppercase tracking-tight'>Accès direct depuis votre écran.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleInstallClick}
                className="px-5 py-2.5 bg-white text-black font-black uppercase text-[10px] rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Installer
              </button>
              <button 
                onClick={() => setShowInstall(false)}
                className="p-2 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

