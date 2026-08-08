import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, RefreshCw, X } from 'lucide-react';

export default function PWAHandler() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('📡 [PWA] Service Worker inscrit avec succès:', r?.scope || 'Inscrit');
    },
    onRegisterError(error) {
      console.error('⚠️ [PWA] Erreur lors de l\'inscription du Service Worker:', error);
    },
  });

  useEffect(() => {
    // Check if app is already running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Choix d'installation utilisateur: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
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
        <div className="fixed bottom-20 right-4 z-[9999] max-w-sm w-full bg-afri-bg-sec/95 backdrop-blur-md border border-afri-gold/40 p-4 rounded-xl shadow-2xl text-white flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-afri-gold font-bold text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Mise à jour disponible</span>
            </div>
            <button onClick={closeRefresh} className="text-gray-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-300">
            Une nouvelle version d'AfriGombo est disponible. Cliquez sur mettre à jour pour appliquer la nouvelle version.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => updateServiceWorker(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold text-xs rounded-lg transition-all shadow-md"
            >
              Mettre à jour
            </button>
          </div>
        </div>
      )}

      {/* PWA Install Banner */}
      {showInstallBanner && deferredPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-[9998] bg-gradient-to-r from-gray-900 to-black border border-afri-gold/30 p-4 rounded-2xl shadow-2xl text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-afri-gold/20 flex items-center justify-center text-afri-gold shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Installer l'application</h4>
              <p className="text-xs text-gray-400">Installez AfriGombo sur votre écran d'accueil pour un accès rapide.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 bg-afri-gold text-black font-bold text-xs rounded-xl hover:bg-yellow-400 transition-colors"
            >
              Installer
            </button>
            <button
              onClick={handleDismissInstall}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
