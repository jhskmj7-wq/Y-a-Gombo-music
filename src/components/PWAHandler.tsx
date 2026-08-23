import React, { useEffect, useState, useRef, useCallback } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { RefreshCw, X, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';
import { BUILD_ID } from '../buildInfo';

/**
 * AFRIGOMBO PWA ENGINE & SERVICE WORKER HANDLER
 * Manages background updates, periodic server sync detection, offline caching, and PWA installation prompts.
 * Uses a single service worker instance to prevent double service worker conflicts.
 */
export default function PWAHandler() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newVersionTag, setNewVersionTag] = useState<string | null>(null);

  const updateServiceWorkerRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // 1. REGISTER SINGLE SERVICE WORKER & HANDLE WORKBOX UPDATES
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if ((window as any)._afrigombo_sw_registered) return;
    (window as any)._afrigombo_sw_registered = true;

    try {
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          console.log('🔄 [PWA Engine] Workbox a détecté un nouveau Service Worker !');
          setNeedRefresh(true);
        },
        onOfflineReady() {
          console.log('⚡ [PWA Engine] Application prête pour une utilisation hors-ligne.');
        },
        onRegistered(r) {
          if (r) {
            swRegistrationRef.current = r;
            console.log('📡 [PWA Engine] Service Worker unique inscrit avec succès:', r.scope);

            // Periodic Service Worker byte check every 60 seconds (1 minute)
            const intervalId = setInterval(() => {
              if (navigator.onLine && r) {
                r.update().catch(err => {
                  console.debug('[PWA Engine] Vérification automatique SW ignorée:', err);
                });
              }
            }, 60 * 1000);

            return () => clearInterval(intervalId);
          }
        },
        onRegisterError(error) {
          console.error('⚠️ [PWA Engine] Erreur lors de l\'inscription du Service Worker:', error);
        },
      });
      updateServiceWorkerRef.current = updateSW;
    } catch (err) {
      console.warn('[PWA Engine] Service worker registration notice:', err);
    }
  }, []);

  // 2. PERIODIC VERSION.JSON POLLING (60 SECONDS INTERVAL FOR VERCEL DEPLOYMENTS)
  const checkRemoteVersion = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.onLine) return;

    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (!res.ok) return;
      const data = await res.json();

      if (data && data.buildId) {
        // Compare remote buildId with local compiled BUILD_ID
        if (BUILD_ID && !BUILD_ID.startsWith('DEV-') && data.buildId !== BUILD_ID) {
          console.log(`🚀 [PWA Update System] Déploiement Vercel détecté ! Remote: ${data.buildId} | Actuel: ${BUILD_ID}`);
          setNeedRefresh(true);
          setNewVersionTag(data.commitShortSha ? `Git ${data.commitShortSha}` : 'Vercel Sync');

          // Trigger Service Worker update check immediately
          if (swRegistrationRef.current) {
            swRegistrationRef.current.update().catch(() => {});
          }
        }
      }
    } catch (_) {
      // Silently ignore network failures (e.g. temporary offline state)
    }
  }, []);

  useEffect(() => {
    // Initial server check after 8 seconds
    const initialTimer = setTimeout(() => {
      checkRemoteVersion();
    }, 8000);

    // Regular interval every 60 seconds (1 minute max delay)
    const pollInterval = setInterval(() => {
      checkRemoteVersion();
    }, 60 * 1000);

    // Trigger check when returning to app tab (visibilitychange) or regaining network
    const handleFocusOrOnline = () => {
      if (document.visibilityState === 'visible') {
        checkRemoteVersion();
        if (swRegistrationRef.current) {
          swRegistrationRef.current.update().catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleFocusOrOnline);
    window.addEventListener('online', handleFocusOrOnline);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleFocusOrOnline);
      window.removeEventListener('online', handleFocusOrOnline);
    };
  }, [checkRemoteVersion]);

  // 3. APPLY UPDATE & CLEAR STALE CACHES
  const handleApplyUpdate = async () => {
    setIsUpdating(true);
    try {
      if (updateServiceWorkerRef.current) {
        await updateServiceWorkerRef.current(true);
      }
    } catch (err) {
      console.warn('[PWA Engine] Update warning:', err);
    }
    window.location.reload();
  };

  // 4. INSTALLATION PROMPT HANDLER
  useEffect(() => {
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setInstalled(true);
      return;
    }

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
      console.log('🎉 [PWA Engine] Application AfriGombo installée !');
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
      if (choiceResult.outcome === 'accepted') {
        setInstalled(true);
      }
    } catch (e) {
      console.warn('[PWA Engine] Prompt installation notice:', e);
    } finally {
      setDeferredPrompt(null);
      delete (window as any).deferredPWAInstallPrompt;
      setShowInstallBanner(false);
    }
  };

  return (
    <>
      {/* PWA UPDATE POPUP / BANNER */}
      {needRefresh && (
        <div className="fixed bottom-20 right-4 left-4 sm:left-auto sm:max-w-md z-[9999] bg-black/95 backdrop-blur-xl border-2 border-[#D4AF37] p-4 sm:p-5 rounded-2xl shadow-[0_10px_40px_rgba(212,175,55,0.4)] text-white flex flex-col gap-3.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#D4AF37] font-black text-sm tracking-wide uppercase">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              <span>Nouvelle version disponible</span>
              {newVersionTag && (
                <span className="text-[9px] font-mono bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] px-2 py-0.5 rounded-full">
                  {newVersionTag}
                </span>
              )}
            </div>
            <button 
              onClick={() => setNeedRefresh(false)} 
              className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              title="Masquer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-gray-200 font-sans leading-relaxed">
            Une nouvelle version d'AfriGombo vient d'être déployée sur Vercel. Cliquez sur <strong>Actualiser</strong> pour appliquer les derniers correctifs et fonctionnalités sans perte de données.
          </p>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => setNeedRefresh(false)}
              className="px-3 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Plus tard
            </button>
            <button
              onClick={handleApplyUpdate}
              disabled={isUpdating}
              className="px-5 py-2.5 bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black font-black text-xs rounded-xl hover:from-yellow-400 hover:to-amber-400 transition-all shadow-lg active:scale-95 cursor-pointer uppercase tracking-wider flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>{isUpdating ? 'Actualisation...' : 'Actualiser'}</span>
            </button>
          </div>
        </div>
      )}

      {/* PWA INSTALL BANNER */}
      {showInstallBanner && deferredPrompt && !installed && !needRefresh && (
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
              onClick={() => setShowInstallBanner(false)}
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
