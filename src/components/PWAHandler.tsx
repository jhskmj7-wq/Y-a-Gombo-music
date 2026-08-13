import React, { useEffect, useState, useRef } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { Download, RefreshCw, X, Smartphone, Check } from 'lucide-react';

/**
 * AFRIGOMBO PWA ENGINE & SERVICE WORKER HANDLER
 * Manages background updates, offline caching, and PWA installation prompts.
 */
export default function PWAHandler() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const updateServiceWorkerRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if ((window as any)._afrigombo_sw_registered) return;
    (window as any)._afrigombo_sw_registered = true;

    try {
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          setNeedRefresh(true);
        },
        onOfflineReady() {
          setOfflineReady(true);
        },
        onRegistered(r) {
          console.log('📡 [PWA] Service Worker inscrit avec succès:', r?.scope || 'Inscrit');
        },
        onRegisterError(error) {
          console.error('⚠️ [PWA] Erreur lors de l\'inscription du Service Worker:', error);
        },
      });
      updateServiceWorkerRef.current = updateSW;
    } catch (err) {
      console.warn('[PWA] Service worker registration notice:', err);
    }
  }, []);

  const updateServiceWorker = (reloadPage?: boolean) => {
    if (updateServiceWorkerRef.current) {
      updateServiceWorkerRef.current(reloadPage);
    }
  };

  useEffect(() => {
    // Check if app is running in standalone mode (already installed)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    // Capture global install prompt if already attached to window
    if ((window as any).deferredPWAInstallPrompt) {
      setDeferredPrompt((window as any).deferredPWAInstallPrompt);
      setShowInstallBanner(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPWAInstallPrompt = e;
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    const handleAppInstalled = () => {
      console.log('🎉 [PWA] Application AfriGombo installée avec succès!');
      setInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      delete (window as any).deferredPWAInstallPrompt;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const promptEvent = deferredPrompt || (window as any).deferredPWAInstallPrompt;
    if (!promptEvent) return;

    try {
      await promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      console.log(`[PWA] Résultat installation: ${choiceResult.outcome}`);
      if (choiceResult.outcome === 'accepted') {
        setInstalled(true);
      }
    } catch (e) {
      console.warn('[PWA] Exception lors du déclenchement du prompt PWA:', e);
    } finally {
      setDeferredPrompt(null);
      delete (window as any).deferredPWAInstallPrompt;
      setShowInstallBanner(false);
    }
  };

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
  };

  const closeRefresh = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <>
      {/* PWA Update Toast */}
      {needRefresh && (
        <div className="fixed bottom-20 right-4 z-[9999] max-w-sm w-full bg-black/90 backdrop-blur-md border border-[#D4AF37]/50 p-4 rounded-2xl shadow-2xl text-white flex flex-col gap-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Mise à jour disponible</span>
            </div>
            <button onClick={closeRefresh} className="text-gray-400 hover:text-white p-1 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-300">
            Une nouvelle version d'AfriGombo est prête. Cliquez pour mettre à jour instantanément.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => updateServiceWorker(true)}
              className="px-4 py-2 bg-[#D4AF37] text-black font-extrabold text-xs rounded-xl hover:bg-yellow-400 transition-all shadow-md cursor-pointer uppercase tracking-wider"
            >
              Mettre à jour
            </button>
          </div>
        </div>
      )}

      {/* PWA Install Banner */}
      {showInstallBanner && deferredPrompt && !installed && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-[9998] bg-black/90 backdrop-blur-lg border border-[#D4AF37]/40 p-4 rounded-2xl shadow-2xl text-white flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>Installer AfriGombo</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] rounded font-mono">PWA</span>
              </h4>
              <p className="text-xs text-gray-400">Accès direct et rapide depuis l'écran d'accueil.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstall}
              className="px-3.5 py-2 bg-[#D4AF37] text-black font-black text-xs rounded-xl hover:bg-yellow-400 transition-all shadow-md cursor-pointer uppercase tracking-wider"
            >
              Installer
            </button>
            <button
              onClick={handleDismissInstall}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
