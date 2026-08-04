import React, { useState, useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Download, RefreshCw, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../AuthContext";
import { supportConfig } from "../supportConfig";

export default function PWAHandler() {
  const { profile } = useAuth();
  const isDev = supportConfig.isDeveloper(profile);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('AFRIGOMBO ELITE SW Registered:', r);
      // Periodically check for updates every hour
      if (r) {
        setInterval(() => {
          console.log('Checking for SW updates...');
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('AFRIGOMBO ELITE SW Registration error:', error);
    },
  });

  // Smart Update Logic: Let the UI banner notify the user instead of force-reloading on boot
  useEffect(() => {
    if (needRefresh) {
      console.log("🔔 [AFRIGOMBO ELITE PWA] New build bundle available. User banner displayed.");
    }
  }, [needRefresh]);

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
        {/* New Version Available Android Snackbar */}
        {needRefresh && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="pointer-events-auto w-full max-w-md bg-[#12100C] border border-[#D4AF37]/50 text-afri-text p-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4 text-[#D4AF37] animate-spin" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-afri-text leading-snug">
                Une nouvelle version d'AFRIGOMBO ELITE est disponible.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-white/5">
              <button
                onClick={closeNeedRefresh}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-afri-text-sec bg-afri-bg/60 border border-afri-border hover:text-afri-text transition-colors cursor-pointer"
              >
                Plus tard
              </button>
              <button
                onClick={() => updateServiceWorker(true)}
                className="px-4 py-2 rounded-xl text-xs font-black text-black bg-gradient-to-r from-amber-500 to-[#D4AF37] hover:opacity-90 transition-all shadow-[0_0_15px_rgba(212,175,55,0.4)] uppercase tracking-wider cursor-pointer"
              >
                Actualiser
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
            className="pointer-events-auto w-full max-w-sm bg-emerald-500 text-afri-text p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-emerald-400/50"
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
            className="pointer-events-auto w-full max-w-sm bg-afri-bg-sec border border-afri-border p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-afri-gold/10 border border-afri-gold/20 flex items-center justify-center text-afri-gold">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-afri-text uppercase tracking-tight">Installer AFRIGOMBO ELITE</p>
                <p className="text-[10px] text-afri-text-sec font-medium">Accès rapide & expérience plein écran.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstall}
                className="bg-afri-gold text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-afri-gold-light transition-colors shadow-[0_0_15px_rgba(212,175,55,0.3)]"
              >
                Installer
              </button>
              <button onClick={closeInstallBanner} className="p-1 hover:bg-afri-text/5 rounded-lg text-afri-text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
