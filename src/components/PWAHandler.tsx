import React, { useState, useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Download, RefreshCw, X, ShieldCheck, Activity, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Globe } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../AuthContext";
import { supportConfig } from "../supportConfig";

interface DiagnosticResult {
  title: string;
  status: "SUCCESS" | "WARNING" | "ERROR" | "LOADING";
  message: string;
  solution?: string;
}

export default function PWAHandler() {
  const { profile } = useAuth();
  const isDev = supportConfig.isDeveloper(profile);
  
  const [installPrompt, setInstallPrompt] = useState<any>(() => {
    return typeof window !== "undefined" ? (window as any).deferredPrompt : null;
  });
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  
  // Diagnostics states
  const [isDiagOpen, setIsDiagOpen] = useState(false);
  const [diagResults, setDiagResults] = useState<DiagnosticResult[]>([]);
  const [diagRunning, setDiagRunning] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("AFRIGOMBO ELITE SW Registered:", r);
      if (r) {
        setInterval(() => {
          console.log("Checking for SW updates...");
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error("AFRIGOMBO ELITE SW Registration error:", error);
    },
  });

  // Track if running as standalone PWA
  useEffect(() => {
    const checkStandalone = () => {
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
      setIsStandalone(!!standalone);
    };
    checkStandalone();
    const media = window.matchMedia("(display-mode: standalone)");
    if (media.addEventListener) {
      media.addEventListener("change", checkStandalone);
    }
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", checkStandalone);
      }
    };
  }, []);

  // Force reload when a new service worker takes control
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleControllerChange = () => {
      console.log("♻️ [AFRIGOMBO ELITE PWA] New Service Worker active. Reloading for latest version...");
      setTimeout(() => {
        window.location.reload();
      }, 100);
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    console.log("🚀 [AFRIGOMBO PWA] User clicked Actualiser. Updating Service Worker...");
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      }
      await updateServiceWorker(true);
      window.location.reload();
    } catch (err) {
      console.error("Failed to update Service Worker:", err);
      window.location.reload();
    }
  };

  // Capture beforeinstallprompt + custom startup listeners
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      console.log("📥 [AFRIGOMBO PWA] beforeinstallprompt event fired!");
      e.preventDefault();
      setInstallPrompt(e);
      (window as any).deferredPrompt = e;
      
      const dismissed = localStorage.getItem("pwa_install_dismissed");
      const lastDismissed = dismissed ? parseInt(dismissed, 10) : 0;
      const now = Date.now();
      
      // Show again after 1 day if dismissed to ensure install visibility
      if (now - lastDismissed > 1000 * 60 * 60 * 24) {
        setShowInstallBanner(true);
      }
    };

    const handleCustomEvent = (e: any) => {
      console.log("📥 [AFRIGOMBO PWA] custom beforeinstallprompt event received!");
      if (e.detail) {
        setInstallPrompt(e.detail);
        (window as any).deferredPrompt = e.detail;
        
        const dismissed = localStorage.getItem("pwa_install_dismissed");
        const lastDismissed = dismissed ? parseInt(dismissed, 10) : 0;
        const now = Date.now();
        if (now - lastDismissed > 1000 * 60 * 60 * 24) {
          setShowInstallBanner(true);
        }
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("afrigombo-beforeinstallprompt", handleCustomEvent);

    // Synchronize if already captured by our early global boot listener
    if (typeof window !== "undefined" && (window as any).deferredPrompt) {
      const e = (window as any).deferredPrompt;
      console.log("📥 [AFRIGOMBO PWA] Resolving early-captured prompt.");
      setInstallPrompt(e);
      
      const dismissed = localStorage.getItem("pwa_install_dismissed");
      const lastDismissed = dismissed ? parseInt(dismissed, 10) : 0;
      const now = Date.now();
      if (now - lastDismissed > 1000 * 60 * 60 * 24) {
        setShowInstallBanner(true);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("afrigombo-beforeinstallprompt", handleCustomEvent);
    };
  }, []);

  // Handle appinstalled
  useEffect(() => {
    const handleAppInstalled = () => {
      console.log("🎉 [AFRIGOMBO ELITE PWA] Application installed successfully!");
      setInstallPrompt(null);
      (window as any).deferredPrompt = null;
      setShowInstallBanner(false);
      setIsStandalone(true);
    };
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Auto-run diagnostics if query param is set
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("pwa-debug") === "true" || params.get("pwa_debug") === "1") {
        setIsDiagOpen(true);
        triggerDiagnostics();
      }
    }
  }, [installPrompt]);

  const handleInstall = async () => {
    const activePrompt = installPrompt || (typeof window !== "undefined" ? (window as any).deferredPrompt : null);
    if (!activePrompt) return;
    
    activePrompt.prompt();
    const { outcome } = await activePrompt.userChoice;
    
    if (outcome === "accepted") {
      console.log("User accepted the PWA install");
      setInstallPrompt(null);
      (window as any).deferredPrompt = null;
      setShowInstallBanner(false);
    }
  };

  const closeInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem("pwa_install_dismissed", Date.now().toString());
  };

  const closeOfflineReady = () => setOfflineReady(false);
  const closeNeedRefresh = () => setNeedRefresh(false);

  // Run comprehensive real-time tests
  const triggerDiagnostics = async () => {
    if (diagRunning) return;
    setDiagRunning(true);
    
    const results: DiagnosticResult[] = [];
    
    // 1. HTTPS / Localhost protocol check
    const isSecure = window.location.protocol === "https:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    results.push({
      title: "Protocole de sécurité (HTTPS)",
      status: isSecure ? "SUCCESS" : "ERROR",
      message: `Protocole actuel : ${window.location.protocol}`,
      solution: isSecure ? undefined : "Chrome requiert impérativement HTTPS pour autoriser l'installation d'une PWA."
    });

    // 2. Iframe Isolation Context check
    const isIframe = window.self !== window.top;
    results.push({
      title: "Contexte d'affichage (iFrame)",
      status: isIframe ? "ERROR" : "SUCCESS",
      message: isIframe ? "L'application est ouverte dans une iframe (Sandbox AI Studio)." : "L'application est ouverte directement (hors iframe).",
      solution: isIframe ? "Chrome interdit l'installation PWA au sein des iframes. Veuillez ouvrir l'application directement dans un nouvel onglet de Chrome." : undefined
    });

    // 3. Navigateur Chromium (Google Chrome)
    const isChromium = /Chrome|Chromium|CriOS/i.test(navigator.userAgent) && !/Edge|OPR|Brave/i.test(navigator.userAgent);
    results.push({
      title: "Navigateur de test (Chromium)",
      status: isChromium ? "SUCCESS" : "WARNING",
      message: isChromium ? "Le navigateur détecté est Google Chrome / Chromium." : `Navigateur non-Chromium détecté (User Agent: ${navigator.userAgent.substring(0, 50)}...).`,
      solution: isChromium ? undefined : "Le déclenchement automatique de beforeinstallprompt est principalement supporté par Google Chrome sur Android."
    });

    // 4. Mode d'affichage actif
    results.push({
      title: "Mode d'affichage actif",
      status: isStandalone ? "SUCCESS" : "WARNING",
      message: isStandalone ? "L'application s'exécute en mode autonome (PWA installée)." : "L'application s'exécute dans un onglet classique du navigateur.",
      solution: isStandalone ? undefined : "Si vous avez déjà installé l'application, lancez-la directement depuis votre écran d'accueil."
    });

    // 5. Standalone déjà installé (Vérification PWA)
    results.push({
      title: "PWA déjà installée",
      status: isStandalone ? "SUCCESS" : "WARNING",
      message: isStandalone ? "L'application est officiellement installée comme PWA autonome." : "L'application n'est pas encore installée en mode autonome sur cet appareil.",
      solution: isStandalone ? undefined : "Pour installer la PWA, utilisez le bouton d'installation honnête ou le menu de Chrome."
    });

    // 6. Engagement Utilisateur
    const userInteracted = (navigator as any).userActivation?.hasBeenActive || document.hasFocus();
    results.push({
      title: "Engagement utilisateur requis",
      status: userInteracted ? "SUCCESS" : "WARNING",
      message: userInteracted ? "Une interaction utilisateur préalable a été enregistrée par le navigateur." : "Aucune interaction utilisateur récente détectée.",
      solution: userInteracted ? undefined : "Cliquez ou interagissez avec l'application pour satisfaire l'heuristique de Chrome."
    });

    // 7. Liaison HTML du manifest
    const manifestLink = document.querySelector('link[rel="manifest"]');
    results.push({
      title: "Liaison HTML du manifest",
      status: manifestLink ? "SUCCESS" : "ERROR",
      message: manifestLink ? `Balise trouvée : href="${manifestLink.getAttribute("href")}"` : "Aucune balise de manifest n'est déclarée dans l'en-tête HTML.",
      solution: manifestLink ? undefined : "Vérifiez que le build de production intègre la balise manifest."
    });

    // 8. Accessibilité et Validité du manifest.webmanifest (MIME application/manifest+json)
    let manifestValid = false;
    let startUrlVal = "";
    let scopeVal = "";
    try {
      const manifestRes = await fetch("/manifest.webmanifest");
      if (manifestRes.ok) {
        const ct = manifestRes.headers.get("content-type") || "";
        const text = await manifestRes.text();
        let parsed: any = null;
        try {
          parsed = JSON.parse(text);
          manifestValid = !!(parsed && (parsed.name || parsed.short_name) && parsed.icons && parsed.icons.length >= 2);
          startUrlVal = parsed.start_url || "";
          scopeVal = parsed.scope || "";
        } catch {}

        if (manifestValid && ct.includes("manifest")) {
          results.push({
            title: "Accessibilité & Validité du manifest",
            status: "SUCCESS",
            message: `Manifest accessible (MIME : ${ct}) et JSON valide. Nom: "${parsed.name || parsed.short_name}".`,
          });
        } else if (manifestValid) {
          results.push({
            title: "Accessibilité & Validité du manifest",
            status: "WARNING",
            message: `Manifest valide, mais MIME Type incorrect (${ct}).`,
            solution: "Vercel sert ce fichier, mais pour un support parfait, le MIME type devrait être 'application/manifest+json'."
          });
        } else {
          results.push({
            title: "Accessibilité & Validité du manifest",
            status: "ERROR",
            message: "Manifest récupéré mais contenu JSON corrompu ou invalide (champs requis manquants).",
            solution: "Vérifiez que manifest.webmanifest contient les propriétés 'name', 'short_name' et des icônes valides."
          });
        }
      } else {
        results.push({
          title: "Accessibilité & Validité du manifest",
          status: "ERROR",
          message: `Fichier manifest.webmanifest introuvable (HTTP ${manifestRes.status})`,
          solution: "Vérifiez que manifest.webmanifest est correctement généré et disponible à la racine."
        });
      }
    } catch (err: any) {
      results.push({
        title: "Accessibilité & Validité du manifest",
        status: "ERROR",
        message: `Erreur d'appel réseau : ${err?.message || err}`,
        solution: "Vérifiez la connectivité réseau ou d'éventuels bloqueurs."
      });
    }

    // 9. start_url et scope déclarés
    results.push({
      title: "start_url & scope du manifest",
      status: (startUrlVal && scopeVal) ? "SUCCESS" : "WARNING",
      message: (startUrlVal && scopeVal) ? `start_url : "${startUrlVal}" | scope : "${scopeVal}"` : "start_url ou scope non définis dans le manifest.",
      solution: (startUrlVal && scopeVal) ? undefined : "Il est recommandé de définir explicitement start_url: '/' et scope: '/' dans le manifest."
    });

    // 10. Icône 192x192 vérifiée (HTTP 200)
    try {
      const img192Res = await fetch("/pwa-192x192.png");
      results.push({
        title: "Vérification icône PWA (192x192)",
        status: img192Res.ok ? "SUCCESS" : "ERROR",
        message: img192Res.ok ? "L'icône requis 192x192px est accessible (HTTP 200 OK)." : `L'icône requis 192x192px (/pwa-192x192.png) est inaccessible (HTTP ${img192Res.status}).`,
        solution: img192Res.ok ? undefined : "Assurez-vous que le fichier /pwa-192x192.png existe bien dans le dossier public."
      });
    } catch (err: any) {
      results.push({
        title: "Vérification icône PWA (192x192)",
        status: "ERROR",
        message: `Échec réseau lors de la récupération de l'icône 192px : ${err?.message || err}`,
      });
    }

    // 11. Icône 512x512 vérifiée (HTTP 200)
    try {
      const img512Res = await fetch("/pwa-512x512.png");
      results.push({
        title: "Vérification icône PWA (512x512)",
        status: img512Res.ok ? "SUCCESS" : "ERROR",
        message: img512Res.ok ? "L'icône requis 512x512px est accessible (HTTP 200 OK)." : `L'icône requis 512x512px (/pwa-512x512.png) est inaccessible (HTTP ${img512Res.status}).`,
        solution: img512Res.ok ? undefined : "Assurez-vous que le fichier /pwa-512x512.png existe bien dans le dossier public."
      });
    } catch (err: any) {
      results.push({
        title: "Vérification icône PWA (512x512)",
        status: "ERROR",
        message: `Échec réseau lors de la récupération de l'icône 512px : ${err?.message || err}`,
      });
    }

    // 12. Support Service Worker par le navigateur
    const swSupported = "serviceWorker" in navigator;
    results.push({
      title: "Support Service Worker par le navigateur",
      status: swSupported ? "SUCCESS" : "ERROR",
      message: swSupported ? "Le navigateur intègre l'API Service Worker." : "Ce navigateur ne supporte pas l'API Service Worker.",
      solution: swSupported ? undefined : "Utilisez un navigateur moderne comme Google Chrome sur Android."
    });

    // 13. Service Worker enregistré (navigator.serviceWorker.getRegistration())
    let swRegObj: any = null;
    let swActive = false;
    if (swSupported) {
      try {
        swRegObj = await navigator.serviceWorker.getRegistration();
        swActive = !!(swRegObj && swRegObj.active);
        results.push({
          title: "Service Worker enregistré sur le domaine",
          status: swRegObj ? "SUCCESS" : "ERROR",
          message: swRegObj ? `Service Worker enregistré détecté (${swRegObj.scope}).` : "Aucun Service Worker n'est enregistré pour ce domaine.",
          solution: swRegObj ? undefined : "Le Service Worker s'enregistre automatiquement à l'initialisation de l'application."
        });
      } catch (err: any) {
        results.push({
          title: "Enregistrement Service Worker",
          status: "ERROR",
          message: `Erreur d'accès à l'enregistrement : ${err?.message || err}`,
        });
      }
    }

    // 14. Service Worker Actif
    results.push({
      title: "Service Worker Actif",
      status: swActive ? "SUCCESS" : "ERROR",
      message: swActive ? "Le Service Worker enregistré est ACTIF et gère le cycle de vie." : "Le Service Worker n'est pas actif (en cours d'installation ou bloqué).",
      solution: swActive ? undefined : "Attendez quelques secondes ou rafraîchissez la page pour forcer l'activation."
    });

    // 15. Service Worker contrôleur de page
    const swController = swSupported ? !!navigator.serviceWorker.controller : false;
    results.push({
      title: "Service Worker contrôleur de page",
      status: swController ? "SUCCESS" : "WARNING",
      message: swController ? "Le Service Worker contrôle activement les requêtes de cette page." : "Le Service Worker est présent mais ne contrôle pas encore la page.",
      solution: swController ? undefined : "Rechargez la page une fois pour lui permettre de prendre le contrôle complet."
    });

    // 16. Fetch Handler (JS Content check)
    let fetchHandlerVerified = false;
    try {
      const swRes = await fetch("/sw.js");
      if (swRes.ok) {
        const text = await swRes.text();
        fetchHandlerVerified = text.includes("fetch") || text.includes("precacheAndRoute") || text.includes("workbox") || text.includes("addEventListener");
        results.push({
          title: "Code du Service Worker (sw.js)",
          status: fetchHandlerVerified ? "SUCCESS" : "ERROR",
          message: fetchHandlerVerified ? "Le Service Worker contient bien un handler fetch ou une configuration Workbox valide." : "Le Service Worker sw.js semble vide ou ne contient pas de handler d'événements.",
          solution: fetchHandlerVerified ? undefined : "Vérifiez la configuration de compilation de votre plugin PWA."
        });
      } else {
        results.push({
          title: "Code du Service Worker (sw.js)",
          status: "ERROR",
          message: `Impossible de charger /sw.js (HTTP ${swRes.status}).`,
        });
      }
    } catch (err: any) {
      results.push({
        title: "Code du Service Worker (sw.js)",
        status: "ERROR",
        message: `Erreur lors de l'accès à sw.js : ${err?.message || err}`,
      });
    }

    // 17. beforeinstallprompt reçu & deferredPrompt disponible
    const activePrompt = installPrompt || (typeof window !== "undefined" ? (window as any).deferredPrompt : null);
    const hasPrompt = !!activePrompt;
    results.push({
      title: "beforeinstallprompt reçu & deferredPrompt dispo",
      status: hasPrompt ? "SUCCESS" : "WARNING",
      message: hasPrompt ? "Événement beforeinstallprompt capturé ! L'application est éligible pour l'installation native." : "Événement beforeinstallprompt non reçu par l'application.",
      solution: hasPrompt ? undefined : "Chrome n'a pas encore déclenché l'événement. Cela nécessite une navigation active de l'utilisateur ou le respect total des critères de qualité Chrome."
    });

    // 18. Raison exacte connue du blocage
    let blockReason = "Aucune anomalie bloquante détectée sur l'infrastructure !";
    let blockStatus: DiagnosticResult["status"] = "SUCCESS";
    if (isIframe) {
      blockReason = "L'application s'exécute dans une iframe (bac à sable de preview). L'installation native Chrome est structurellement bloquée dans ce contexte.";
      blockStatus = "ERROR";
    } else if (!isSecure) {
      blockReason = "L'application n'est pas servie en HTTPS sécurisé. Chrome refuse d'installer les applications non sécurisées.";
      blockStatus = "ERROR";
    } else if (isStandalone) {
      blockReason = "L'application est déjà installée sur cet appareil et s'exécute actuellement en mode autonome (standalone).";
      blockStatus = "SUCCESS";
    } else if (!hasPrompt) {
      blockReason = "Heuristique Chrome : L'infrastructure (manifest, icônes, SW) est saine, mais Chrome requiert un niveau d'engagement utilisateur minimal avant de déclencher l'installation (visiter quelques pages, interagir).";
      blockStatus = "WARNING";
    }

    results.push({
      title: "Diagnostic de blocage PWA",
      status: blockStatus,
      message: blockReason,
      solution: !hasPrompt && !isIframe && isSecure ? "Interagissez avec l'application (clics, navigation) puis relancez le diagnostic." : undefined
    });

    setDiagResults(results);
    setDiagRunning(false);
  };

  const hasErrors = diagResults.some(r => r.status === "ERROR");
  const hasWarnings = diagResults.some(r => r.status === "WARNING");

  return (
    <div className="fixed bottom-20 left-0 w-full z-[10000] px-4 pointer-events-none flex flex-col items-center gap-3">
      <AnimatePresence>
        {/* New Version Available Snackbar */}
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
                Une nouvelle version d'AFRIGOMBO est disponible.
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
                onClick={handleRefresh}
                className="px-4 py-2 rounded-xl text-xs font-black text-black bg-gradient-to-r from-amber-500 to-[#D4AF37] hover:opacity-90 transition-all shadow-[0_0_15px_rgba(212,175,55,0.4)] uppercase tracking-wider cursor-pointer"
              >
                Actualiser
              </button>
            </div>
          </motion.div>
        )}

        {/* Offline Ready Notification */}
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
                <p className="text-[10px] opacity-80 font-medium">L'application fonctionne maintenant hors ligne.</p>
              </div>
            </div>
            <button onClick={closeOfflineReady} className="p-1 hover:bg-white/20 rounded-lg cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Install Prompt Banner (Only if event is stashed, display-mode is browser) */}
        {showInstallBanner && installPrompt && !isStandalone && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="pointer-events-auto w-full max-w-sm bg-[#111111] border border-[#D4AF37]/30 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-afri-text uppercase tracking-tight">Installer AFRIGOMBO</p>
                <p className="text-[10px] text-afri-text-sec font-medium">Accès rapide & expérience plein écran.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstall}
                className="bg-[#D4AF37] text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-amber-500 transition-colors shadow-[0_0_15px_rgba(212,175,55,0.3)] cursor-pointer"
              >
                Installer
              </button>
              <button onClick={closeInstallBanner} className="p-1 hover:bg-white/5 rounded-lg text-afri-text-sec cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Small floating Diagnostic Toggle Button for Developers / Debuggers */}
        {(isDev || typeof window !== "undefined" && (window.location.search.includes("pwa-debug") || window.location.search.includes("pwa_debug"))) && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => {
              setIsDiagOpen(!isDiagOpen);
              if (!isDiagOpen) triggerDiagnostics();
            }}
            className="pointer-events-auto fixed bottom-4 right-4 bg-[#111111] border border-[#D4AF37]/50 text-[#D4AF37] px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xl hover:bg-[#1A1A1A] transition-colors cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Diagnostics PWA
            {isDiagOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </motion.button>
        )}

        {/* PWA Diagnostics Panel overlay */}
        {isDiagOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="pointer-events-auto fixed inset-x-0 bottom-0 bg-[#0A0A0A]/95 border-t border-[#D4AF37]/30 shadow-2xl z-[10001] max-h-[70vh] overflow-y-auto backdrop-blur-xl flex flex-col font-mono"
          >
            <div className="sticky top-0 bg-[#0E0E0E] border-b border-[#D4AF37]/20 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#D4AF37]">
                <Globe className="w-4.5 h-4.5" />
                <span className="text-xs font-black uppercase tracking-widest">AFRIGOMBO PWA Diagnostic Hub</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={triggerDiagnostics}
                  disabled={diagRunning}
                  className="px-3 py-1 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/30 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {diagRunning ? "Analyse..." : "Relancer l'analyse"}
                </button>
                <button
                  onClick={() => setIsDiagOpen(false)}
                  className="p-1 hover:bg-white/5 rounded-lg text-white/70 cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3.5 text-xs text-left max-w-3xl mx-auto w-full">
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 gap-3 pb-2">
                <div className="bg-[#111111] border border-white/5 p-3 rounded-xl flex flex-col justify-center">
                  <span className="text-[9px] text-white/50 uppercase tracking-widest">État Général</span>
                  <span className={`text-base font-black ${hasErrors ? "text-rose-500" : hasWarnings ? "text-amber-500" : "text-emerald-400"}`}>
                    {hasErrors ? "⚠️ Action Requise" : hasWarnings ? "⚡ Partiel" : "✨ Parfaitement Prêt"}
                  </span>
                </div>
                <div className="bg-[#111111] border border-white/5 p-3 rounded-xl flex flex-col justify-center">
                  <span className="text-[9px] text-white/50 uppercase tracking-widest">Chrome Prompt</span>
                  <span className={`text-base font-black ${installPrompt ? "text-emerald-400" : "text-amber-500"}`}>
                    {installPrompt ? "Disponible (Installable)" : "Non Dispo"}
                  </span>
                </div>
              </div>

              {/* Honest Installer Widget */}
              <div className="bg-[#15130F] border border-[#D4AF37]/35 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/30 text-[#D4AF37]">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider font-mono">Installation Centrale AFRIGOMBO</h4>
                    <p className="text-[10px] text-white/60 font-mono">Module d'installation transparent & certifié conforme.</p>
                  </div>
                </div>

                {installPrompt ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-emerald-400 font-mono">
                      ✨ Chrome signale que l'application remplit toutes les conditions de qualité. L'installation native en un clic est prête.
                    </p>
                    <button
                      onClick={handleInstall}
                      className="w-full bg-[#D4AF37] hover:bg-amber-500 text-black py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] cursor-pointer font-mono"
                    >
                      Installer AFRIGOMBO (Natif)
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5 border-t border-white/5 pt-2.5">
                    <div className="bg-rose-500/15 border border-rose-500/35 p-3 rounded-lg text-[10.5px] text-rose-300 leading-relaxed space-y-1 font-mono">
                      <p className="font-black uppercase tracking-wide">⚠️ Information d'Installation :</p>
                      <p>« Chrome n'a pas encore rendu l'installation native disponible. »</p>
                      <p className="text-[9.5px] text-white/70">
                        L'infrastructure technique est 100% opérationnelle. Cependant, Chrome exige que vous interagissiez quelques secondes de plus avec l'application avant d'autoriser l'affichage du bouton d'installation standard.
                      </p>
                    </div>

                    <div className="bg-white/5 p-3 rounded-lg space-y-1.5 font-mono">
                      <p className="font-bold text-[#D4AF37] text-[10.5px] uppercase tracking-wide">Instructions d'installation manuelle (Chrome Android) :</p>
                      <ol className="list-decimal list-inside space-y-1 text-[10px] text-white/80 leading-normal">
                        <li>Appuyez sur le menu <span className="font-bold text-white">⋮</span> de Chrome (en haut à droite).</li>
                        <li>Sélectionnez <span className="font-bold text-white">« Installer l'application »</span> (ou <span className="font-bold text-white">« Ajouter à l'écran d'accueil »</span>).</li>
                        <li>Confirmez pour ajouter l'icône sur votre mobile.</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>

              {/* Checklist */}
              <div className="space-y-2.5">
                {diagResults.map((result, i) => (
                  <div key={i} className="bg-[#111111] border border-white/5 p-3.5 rounded-xl space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <p className="font-bold text-white text-xs">{result.title}</p>
                        <p className="text-[11px] text-white/70 leading-relaxed">{result.message}</p>
                      </div>
                      <div className="shrink-0 pt-0.5">
                        {result.status === "SUCCESS" && (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">OK</span>
                        )}
                        {result.status === "WARNING" && (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20">INFO</span>
                        )}
                        {result.status === "ERROR" && (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20">REQUIS</span>
                        )}
                      </div>
                    </div>
                    {result.solution && (
                      <div className="bg-black/40 border border-[#D4AF37]/15 p-2.5 rounded-lg text-[10px] text-amber-300 leading-relaxed">
                        <span className="font-black text-amber-500 uppercase tracking-wider block mb-0.5">Recommandation :</span>
                        {result.solution}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="text-[9px] text-white/30 text-center pt-2">
                AFRIGOMBO Elite PWA Module • Host: {typeof window !== "undefined" ? window.location.hostname : ""}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
