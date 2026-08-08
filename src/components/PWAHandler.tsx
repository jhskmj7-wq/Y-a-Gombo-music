import React, { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BUILD_ID } from '../buildInfo';

export default function PWAHandler() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasNewServerVersion, setHasNewServerVersion] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('📡 [AFRIGOMBO] SW Registered with BUILD_ID:', BUILD_ID);
      if (r) {
        setInterval(() => {
          r.update();
        }, 5 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('❌ [AFRIGOMBO] SW registration error', error);
    },
  });

  // Check version.json periodically to detect new Vercel deployments
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.buildId && data.buildId !== BUILD_ID) {
            console.log("🚀 [AFRIGOMBO] New server deployment detected:", data.buildId);
            setHasNewServerVersion(true);
          }
        }
      } catch (e) {
        // ignore network error
      }
    };

    checkVersion();
    const interval = setInterval(checkVersion, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
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

  const handleRefresh = () => {
    if (needRefresh) {
      updateServiceWorker(true);
    } else {
      window.location.reload();
    }
  };

  const handleDismissRefresh = () => {
    setNeedRefresh(false);
    setHasNewServerVersion(false);
  };

  const showUpdateBanner = needRefresh || hasNewServerVersion;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[9999] pointer-events-none flex flex-col items-center gap-3">
      <AnimatePresence>
        {/* NEW VERSION AVAILABLE BANNER */}
        {showUpdateBanner && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="pointer-events-auto p-4 bg-gray-950/95 border border-[#D4AF37]/40 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex items-center justify-between backdrop-blur-xl max-w-md w-full"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#D4AF37]/10 rounded-full text-[#D4AF37]">
                <RefreshCw className="w-5 h-5 animate-spin-slow" />
              </div>
              <div className="flex flex-col">
                <p className="text-xs font-black uppercase tracking-wider text-white">Une nouvelle version est disponible</p>
                <p className="text-[10px] text-gray-400">Cliquez sur actualiser pour charger la mise à jour.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-[#D4AF37] text-black font-black uppercase text-[10px] rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
              >
                Actualiser
              </button>
              <button
                onClick={handleDismissRefresh}
                className="px-3 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                Plus tard
              </button>
            </div>
          </motion.div>
        )}

        {/* INSTALL PROMPT */}
        {showInstall && !isInstalled && !showUpdateBanner && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="pointer-events-auto p-4 bg-afri-bg/95 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex items-center justify-between backdrop-blur-xl max-w-md w-full"
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


