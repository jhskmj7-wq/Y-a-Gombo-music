import React, { useState, useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Download, RefreshCw, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function PWAHandler() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW Registration error:', error);
    },
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
      
      // Check if we should show the banner (not installed, and not dismissed recently)
      const dismissed = localStorage.getItem("pwa_install_dismissed");
      const lastDismissed = dismissed ? parseInt(dismissed) : 0;
      const now = Date.now();
      
      // Show again after 3 days if dismissed
      if (now - lastDismissed > 1000 * 60 * 60 * 24 * 3) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install');
      setInstallPrompt(null);
      setShowInstallBanner(false);
    }
  };

  const closeInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem("pwa_install_dismissed", Date.now().toString());
  };

  const closeOfflineReady = () => setOfflineReady(false);
  const closeNeedRefresh = () => setNeedRefresh(false);

  return (
    <div className="fixed bottom-20 left-0 w-full z-[10000] px-4 pointer-events-none flex flex-col items-center gap-3">
      <AnimatePresence>
        {/* New Version Available */}
        {needRefresh && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="pointer-events-auto w-full max-w-sm bg-[#D4AF37] text-black p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-amber-300/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-tight">Mise à jour disponible</p>
                <p className="text-[10px] opacity-80 font-medium">Une nouvelle version d'AFRIGOMBO est prête.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateServiceWorker(true)}
                className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-zinc-900 transition-colors"
              >
                Actualiser
              </button>
              <button onClick={closeNeedRefresh} className="p-1 hover:bg-black/10 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Offline Ready */}
        {offlineReady && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="pointer-events-auto w-full max-w-sm bg-emerald-500 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-emerald-400/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-tight">Mode Hors-Ligne Prêt</p>
                <p className="text-[10px] opacity-80 font-medium">L'application fonctionne maintenant sans internet.</p>
              </div>
            </div>
            <button onClick={closeOfflineReady} className="p-1 hover:bg-white/20 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Install Prompt */}
        {showInstallBanner && installPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="pointer-events-auto w-full max-w-sm bg-black border border-zinc-800 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-white uppercase tracking-tight">Installer AFRIGOMBO</p>
                <p className="text-[10px] text-zinc-400 font-medium">Accès rapide & expérience plein écran.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstall}
                className="bg-[#D4AF37] text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#B8962D] transition-colors shadow-[0_0_15px_rgba(212,175,55,0.3)]"
              >
                Installer
              </button>
              <button onClick={closeInstallBanner} className="p-1 hover:bg-white/5 rounded-lg text-zinc-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
