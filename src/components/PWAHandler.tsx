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
  
  const [installPrompt, setInstallPrompt] = useState<any>(null);
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

  // Capture beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      console.log("📥 [AFRIGOMBO PWA] beforeinstallprompt event fired!");
      e.preventDefault();
      setInstallPrompt(e);
      
      const dismissed = localStorage.getItem("pwa_install_dismissed");
      const lastDismissed = dismissed ? parseInt(dismissed, 10) : 0;
      const now = Date.now();
      
      // Show again after 1 day if dismissed to ensure install visibility
      if (now - lastDismissed > 1000 * 60 * 60 * 24) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // Handle appinstalled
  useEffect(() => {
    const handleAppInstalled = () => {
      console.log("🎉 [AFRIGOMBO ELITE PWA] Application installed successfully!");
      setInstallPrompt(null);
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
    if (!installPrompt) return;
    
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === "accepted") {
      console.log("User accepted the PWA install");
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
      solution: isIframe ? "Chrome interdit l'installation PWA au sein des iframes. Veuillez ouvrir l'application directement dans un nouvel onglet de Chrome à l'aide de l'icône de redirection externe en haut à droite." : undefined
    });

    // 3. Display Mode check
    results.push({
      title: "Mode d'affichage actif",
      status: isStandalone ? "SUCCESS" : "WARNING",
      message: isStandalone ? "L'application s'exécute en mode autonome (PWA installée)." : "L'application s'exécute dans un onglet classique du navigateur.",
      solution: isStandalone ? undefined : "Si vous avez déjà installé l'application, lancez-la directement depuis votre écran d'accueil."
    });

    // 4. Chrome's Qualified Install Promotion check (beforeinstallprompt)
    const hasPrompt = !!installPrompt;
    results.push({
      title: "Éligibilité à l'installation Chrome",
      status: hasPrompt ? "SUCCESS" : "WARNING",
      message: hasPrompt ? "L'événement 'beforeinstallprompt' a été reçu avec succès." : "L'événement 'beforeinstallprompt' n'a pas encore été déclenché par Chrome.",
      solution: hasPrompt ? "L'installation directe est disponible et fonctionnelle !" : "Chrome attend que l'application valide l'ensemble de ses critères de qualité (Service Worker enregistré, manifest valide, interaction minimale). Veuillez interagir un instant avec l'application ou vérifier les diagnostics ci-dessous."
    });

    // 5. Browser Service Worker API check
    const swSupported = "serviceWorker" in navigator;
    results.push({
      title: "Support Service Worker par le navigateur",
      status: swSupported ? "SUCCESS" : "ERROR",
      message: swSupported ? "Le navigateur intègre l'API Service Worker." : "Ce navigateur ne supporte pas l'API Service Worker.",
      solution: swSupported ? undefined : "Utilisez un navigateur moderne comme Google Chrome sur Android."
    });

    // 6. Active SW Registration check
    let swRegObj: any = null;
    if (swSupported) {
      try {
        swRegObj = await navigator.serviceWorker.getRegistration();
        results.push({
          title: "Service Worker enregistré sur le domaine",
          status: swRegObj ? "SUCCESS" : "ERROR",
          message: swRegObj ? `SW enregistré détecté : ${swRegObj.active ? "Actif & Opérationnel" : "En cours d'installation ou en attente"}` : "Aucun Service Worker n'est enregistré pour ce domaine.",
          solution: swRegObj ? undefined : "Veuillez patienter quelques instants, le Service Worker s'enregistre automatiquement dès l'initialisation de l'application."
        });
      } catch (err: any) {
        results.push({
          title: "Enregistrement Service Worker",
          status: "ERROR",
          message: `Erreur d'accès à l'enregistrement : ${err?.message || err}`,
          solution: "Vérifiez que sw.js est valide et correctement compilé."
        });
      }
    }

    // 7. SW Page Controller check
    const swController = swSupported ? !!navigator.serviceWorker.controller : false;
    results.push({
      title: "Service Worker contrôleur de page",
      status: swController ? "SUCCESS" : "WARNING",
      message: swController ? "Le Service Worker contrôle activement les requêtes de cette page." : "Le Service Worker est présent mais ne contrôle pas encore la page.",
      solution: swController ? undefined : "Rechargez la page une fois pour lui permettre de prendre le contrôle complet."
    });

    // 8. Manifest link in HTML check
    const manifestLink = document.querySelector('link[rel="manifest"]');
    results.push({
      title: "Liaison HTML du manifest",
      status: manifestLink ? "SUCCESS" : "ERROR",
      message: manifestLink ? `Balise trouvée : href="${manifestLink.getAttribute("href")}"` : "Aucune balise de manifest n'est déclarée dans l'en-tête HTML.",
      solution: manifestLink ? undefined : "Vérifiez que le build de production intègre la balise manifest."
    });

    // 9. Manifest accessibility and auth proxy checks
    try {
      const manifestRes = await fetch("/manifest.webmanifest");
      if (manifestRes.ok) {
        const ct = manifestRes.headers.get("content-type") || "";
        const text = await manifestRes.text();
        let isValidJson = false;
        let isGoogleRedirect = false;
        
        try {
          const parsed = JSON.parse(text);
          isValidJson = !!(parsed && (parsed.name || parsed.short_name));
        } catch {
          isGoogleRedirect = text.includes("google") || text.includes("signin") || text.includes("oauth") || text.includes("google-login");
        }

        if (isValidJson && ct.includes("manifest")) {
          results.push({
            title: "Accessibilité du manifest.webmanifest",
            status: "SUCCESS",
            message: `Manifest accessible (MIME : ${ct}). JSON vérifié.`,
            solution: undefined
          });
        } else if (isValidJson) {
          results.push({
            title: "Accessibilité du manifest.webmanifest",
            status: "WARNING",
            message: `Manifest accessible mais MIME Type incorrect (${ct}). JSON valide.`,
            solution: "Configurez le serveur pour renvoyer le type 'application/manifest+json' pour les fichiers .webmanifest."
          });
        } else if (isGoogleRedirect) {
          results.push({
            title: "Accessibilité du manifest.webmanifest",
            status: "ERROR",
            message: "Manifest inaccessible (Authentification Google requise). Redirection OAuth détectée.",
            solution: "⚠️ CAS DE LA PREVIEW SÉCURISÉE : L'environnement de preview Google AI Studio est protégé par un proxy d'authentification Google. Chrome tente d'accéder au manifest de façon anonyme (sans cookie), ce qui provoque une redirection de connexion. L'application est structurellement correcte, mais l'installation Chrome Android nécessite d'être sur un domaine HTTPS public non authentifié par proxy."
          });
        } else {
          results.push({
            title: "Accessibilité du manifest.webmanifest",
            status: "ERROR",
            message: `Données invalides : Le contenu n'est pas du JSON de manifest valide.`,
            solution: "Assurez-vous que manifest.webmanifest est correctement structuré."
          });
        }
      } else {
        results.push({
          title: "Accessibilité du manifest.webmanifest",
          status: "ERROR",
          message: `Fichier inaccessible (HTTP ${manifestRes.status})`,
          solution: "Vérifiez que le manifest est correctement placé dans le répertoire public ou généré par Vite."
        });
      }
    } catch (err: any) {
      results.push({
        title: "Accessibilité du manifest.webmanifest",
        status: "ERROR",
        message: `Erreur d'appel réseau : ${err?.message || err}`,
        solution: "Une restriction de CORS ou de réseau bloque la requête."
      });
    }

    // 10. Service Worker JS accessibility and auth proxy checks
    try {
      const swRes = await fetch("/sw.js");
      if (swRes.ok) {
        const ct = swRes.headers.get("content-type") || "";
        const text = await swRes.text();
        const isGoogleRedirect = text.includes("google") || text.includes("signin") || text.includes("oauth") || text.includes("google-login");
        const isValidJs = text.includes("importScripts") || text.includes("self.addEventListener") || text.includes("workbox") || text.includes("precacheAndRoute");

        if (isValidJs && ct.includes("javascript")) {
          results.push({
            title: "Accessibilité du Service Worker (sw.js)",
            status: "SUCCESS",
            message: `Service Worker accessible (MIME : ${ct}). Code JS vérifié.`,
            solution: undefined
          });
        } else if (isValidJs) {
          results.push({
            title: "Accessibilité du Service Worker (sw.js)",
            status: "WARNING",
            message: `sw.js accessible mais MIME Type incorrect (${ct}). Code JS valide.`,
            solution: "Configurez le serveur pour renvoyer le type 'application/javascript' pour sw.js."
          });
        } else if (isGoogleRedirect) {
          results.push({
            title: "Accessibilité du Service Worker (sw.js)",
            status: "ERROR",
            message: "sw.js inaccessible (Authentification Google requise). Redirection OAuth détectée.",
            solution: "⚠️ CAS DE LA PREVIEW SÉCURISÉE : L'accès anonyme requis par Chrome pour sw.js est bloqué par le proxy d'authentification AI Studio. L'installation ne fonctionnera pas sur cette URL de preview, mais l'infrastructure sera 100% installable dès sa mise en ligne publique HTTPS."
          });
        } else {
          results.push({
            title: "Accessibilité du Service Worker (sw.js)",
            status: "ERROR",
            message: `sw.js non valide ou retournant du code HTML.`,
            solution: "Vérifiez la configuration de génération de votre Service Worker."
          });
        }
      } else {
        results.push({
          title: "Accessibilité du Service Worker (sw.js)",
          status: "ERROR",
          message: `Fichier sw.js introuvable (HTTP ${swRes.status})`,
          solution: "Vérifiez que le fichier sw.js est présent dans dist/ (production) ou généré par Vite (développement)."
        });
      }
    } catch (err: any) {
      results.push({
        title: "Accessibilité du Service Worker (sw.js)",
        status: "ERROR",
        message: `Erreur réseau lors de la récupération de sw.js : ${err?.message || err}`,
        solution: "Une restriction réseau ou de CORS bloque la récupération."
      });
    }

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
