import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Copy, 
  ArrowLeft, 
  Check, 
  Smartphone, 
  Shield, 
  Wifi, 
  Layers, 
  FileJson, 
  Info, 
  Activity,
  Download,
  Terminal,
  ExternalLink
} from "lucide-react";

interface TestResult {
  id: number;
  name: string;
  category: string;
  status: "OK" | "WARN" | "ERROR"; // VERT, ORANGE, ROUGE
  actualValue: string;
  explanation: string;
}

export default function PWADiagnosticPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tests, setTests] = useState<TestResult[]>([]);
  const [finalSummary, setFinalSummary] = useState<{
    valid: boolean;
    installable: boolean;
    probableCause: string;
    failedCount: number;
    warnCount: number;
    recommendedActions: string[];
  }>({
    valid: false,
    installable: false,
    probableCause: "",
    failedCount: 0,
    warnCount: 0,
    recommendedActions: []
  });

  const runDiagnostic = useCallback(async () => {
    setLoading(true);
    const results: TestResult[] = [];

    // --- CATEGORY 1: ENVIRONNEMENT & CONNECTIVITÉ ---

    // 1. HTTPS / secure context
    const isHttps = window.isSecureContext;
    results.push({
      id: 1,
      name: "Contexte sécurisé (HTTPS / Localhost)",
      category: "Environnement",
      status: isHttps ? "OK" : "ERROR",
      actualValue: isHttps ? "Oui (isSecureContext = true)" : "Non (isSecureContext = false)",
      explanation: isHttps 
        ? "Le navigateur est dans un contexte sécurisé, requis pour le fonctionnement des Service Workers." 
        : "Les Service Workers ne fonctionnent pas en dehors de HTTPS (sauf sur localhost). L'application ne peut pas être installée ou mise en cache."
    });

    // 2. Navigateur
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    const isFirefox = userAgent.includes("Firefox");
    const isChrome = userAgent.includes("Chrome") || userAgent.includes("CriOS");
    let browserName = "Navigateur non spécifié";
    if (isSafari) browserName = "Apple Safari";
    else if (isChrome) browserName = "Google Chrome / Chromium";
    else if (isFirefox) browserName = "Mozilla Firefox";
    else if (isIOS) browserName = "iOS WebKit (Web View / Autre)";
    
    results.push({
      id: 2,
      name: "Identification du navigateur",
      category: "Environnement",
      status: "OK",
      actualValue: `${browserName} (${userAgent.substring(0, 60)}...)`,
      explanation: `Navigateur détecté : ${browserName}. La plupart des navigateurs récents supportent pleinement les fonctionnalités PWA.`
    });

    // 3. URL actuelle
    const currentUrl = window.location.href;
    results.push({
      id: 3,
      name: "URL actuelle de l'application",
      category: "Environnement",
      status: "OK",
      actualValue: currentUrl,
      explanation: "L'adresse d'où est exécuté le diagnostic."
    });

    // 4. Origine
    const origin = window.location.origin;
    results.push({
      id: 4,
      name: "Origine d'exécution",
      category: "Environnement",
      status: "OK",
      actualValue: origin,
      explanation: "L'origine de l'application qui sert de référence pour le scope du Service Worker."
    });

    // 5. Manifest détecté dans le HTML
    const manifestLink = document.querySelector('link[rel="manifest"]');
    const manifestHref = manifestLink?.getAttribute("href") || "";
    results.push({
      id: 5,
      name: "Balise de manifeste détectée",
      category: "Manifeste",
      status: manifestLink ? "OK" : "ERROR",
      actualValue: manifestLink ? `Oui, href="${manifestHref}"` : "Non détectée",
      explanation: manifestLink 
        ? "La balise <link rel=\"manifest\"> est présente dans le code HTML." 
        : "Aucune balise de manifeste n'a été trouvée dans le document HTML actuel. Le navigateur ne peut pas identifier l'application comme PWA."
    });

    // 6. Récupérer réellement le manifest
    let manifestData: any = null;
    let manifestFetchError = "";
    const manifestUrls = ["/manifest.webmanifest", "/manifest.json"];
    let fetchedUrlUsed = "";

    for (const url of manifestUrls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          manifestData = await response.json();
          fetchedUrlUsed = url;
          break;
        } else {
          manifestFetchError = `Erreur HTTP ${response.status}`;
        }
      } catch (err: any) {
        manifestFetchError = err?.message || "Erreur réseau";
      }
    }

    results.push({
      id: 6,
      name: "Récupération du fichier manifeste",
      category: "Manifeste",
      status: manifestData ? "OK" : "ERROR",
      actualValue: manifestData ? `Succès depuis "${fetchedUrlUsed}"` : `Échec (${manifestFetchError})`,
      explanation: manifestData 
        ? "Le fichier manifeste a pu être récupéré et parsé avec succès." 
        : "Impossible de charger ou de parser le fichier manifeste. Vérifiez que /manifest.webmanifest existe et est accessible."
    });

    // 7. Vérifier name
    const manifestName = manifestData?.name || "";
    results.push({
      id: 7,
      name: "Manifeste : Propriété 'name'",
      category: "Manifeste",
      status: manifestName ? "OK" : "ERROR",
      actualValue: manifestName || "Absente",
      explanation: manifestName 
        ? `La propriété 'name' est définie à "${manifestName}".` 
        : "La propriété 'name' est requise dans le manifeste pour l'installation."
    });

    // 8. Vérifier short_name
    const manifestShortName = manifestData?.short_name || "";
    results.push({
      id: 8,
      name: "Manifeste : Propriété 'short_name'",
      category: "Manifeste",
      status: manifestShortName ? "OK" : "ERROR",
      actualValue: manifestShortName || "Absente",
      explanation: manifestShortName 
        ? `La propriété 'short_name' est définie à "${manifestShortName}". Elle est affichée sous l'icône sur l'écran d'accueil.` 
        : "La propriété 'short_name' est obligatoire pour afficher un nom compact sous l'icône de l'appareil."
    });

    // 9. Vérifier start_url
    const manifestStartUrl = manifestData?.start_url || "";
    results.push({
      id: 9,
      name: "Manifeste : Propriété 'start_url'",
      category: "Manifeste",
      status: manifestStartUrl ? "OK" : "ERROR",
      actualValue: manifestStartUrl || "Absente",
      explanation: manifestStartUrl 
        ? `La propriété 'start_url' est définie à "${manifestStartUrl}".` 
        : "La propriété 'start_url' est indispensable pour indiquer au système quelle page charger au lancement de l'application."
    });

    // 10. Vérifier scope
    const manifestScope = manifestData?.scope || "";
    results.push({
      id: 10,
      name: "Manifeste : Propriété 'scope'",
      category: "Manifeste",
      status: manifestScope ? "OK" : "WARN",
      actualValue: manifestScope || "Absente (par défaut l'URL du manifeste)",
      explanation: manifestScope 
        ? `Le scope est configuré à "${manifestScope}".` 
        : "Le scope n'est pas explicitement défini. Par défaut, le navigateur utilisera le dossier contenant le manifeste comme scope."
    });

    // 11. Vérifier display
    const manifestDisplay = manifestData?.display || "";
    const isDisplayStandalone = ["standalone", "fullscreen", "minimal-ui"].includes(manifestDisplay);
    results.push({
      id: 11,
      name: "Manifeste : Propriété 'display'",
      category: "Manifeste",
      status: isDisplayStandalone ? "OK" : "WARN",
      actualValue: manifestDisplay || "Absente",
      explanation: isDisplayStandalone 
        ? `Le mode d'affichage est "${manifestDisplay}", ce qui permet une expérience native immersive sans l'interface de navigation.` 
        : "Pour être installable, 'display' doit être positionné sur 'standalone', 'fullscreen' ou 'minimal-ui'."
    });

    // 12. theme_color
    const manifestThemeColor = manifestData?.theme_color || "";
    results.push({
      id: 12,
      name: "Manifeste : Propriété 'theme_color'",
      category: "Manifeste",
      status: manifestThemeColor ? "OK" : "WARN",
      actualValue: manifestThemeColor || "Absente",
      explanation: manifestThemeColor 
        ? `Couleur de thème définie à "${manifestThemeColor}". Utilisée pour colorer la barre d'adresse du système.` 
        : "La couleur de thème n'est pas définie, le système utilisera la couleur par défaut du système d'exploitation."
    });

    // 13. Vérifier icône 192x192
    const manifestIcons = manifestData?.icons || [];
    const icon192 = manifestIcons.find((icon: any) => icon.sizes === "192x192" || icon.sizes?.includes("192"));
    results.push({
      id: 13,
      name: "Manifeste : Icône 192x192",
      category: "Manifeste",
      status: icon192 ? "OK" : "ERROR",
      actualValue: icon192 ? `Présente (src="${icon192.src}")` : "Absente",
      explanation: icon192 
        ? "Une icône de taille requise 192x192 a été trouvée." 
        : "Une icône de taille au moins 192x192 est strictement obligatoire pour que Chrome Android autorise l'installation de la PWA."
    });

    // 14. Vérifier icône 512x512
    const icon512 = manifestIcons.find((icon: any) => icon.sizes === "512x512" || icon.sizes?.includes("512"));
    results.push({
      id: 14,
      name: "Manifeste : Icône 512x512",
      category: "Manifeste",
      status: icon512 ? "OK" : "ERROR",
      actualValue: icon512 ? `Présente (src="${icon512.src}")` : "Absente",
      explanation: icon512 
        ? "Une icône de taille recommandée 512x512 a été trouvée pour les écrans haute définition et l'écran de démarrage." 
        : "Une icône de 512x512 est fortement recommandée pour assurer un rendu net et l'affichage de l'écran d'accueil."
    });

    // --- CATEGORY 3: SERVICE WORKER & CACHE ---

    // 15. Vérifier navigator.serviceWorker
    const swSupported = "serviceWorker" in navigator;
    results.push({
      id: 15,
      name: "Support du Service Worker par le navigateur",
      category: "Service Worker",
      status: swSupported ? "OK" : "ERROR",
      actualValue: swSupported ? "Supporté (navigator.serviceWorker présent)" : "Non supporté",
      explanation: swSupported 
        ? "Votre navigateur supporte l'enregistrement de Service Workers." 
        : "Votre navigateur ou votre contexte actuel n'autorise pas les Service Workers (ex: navigation privée stricte, HTTP simple, ou navigateur obsolète)."
    });

    // 16. Lister les Service Workers enregistrés
    let registrations: readonly ServiceWorkerRegistration[] = [];
    let swListValue = "Aucun";
    let swStatus: "OK" | "WARN" | "ERROR" = "WARN";
    
    if (swSupported) {
      try {
        registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length > 0) {
          swListValue = `${registrations.length} Service Worker(s) trouvé(s)`;
          swStatus = "OK";
        } else {
          swListValue = "0 enregistré";
          swStatus = "WARN";
        }
      } catch (err: any) {
        swListValue = `Erreur lors de la lecture : ${err?.message || err}`;
        swStatus = "ERROR";
      }
    } else {
      swListValue = "Non applicable (SW non supporté)";
      swStatus = "ERROR";
    }

    results.push({
      id: 16,
      name: "Service Workers enregistrés",
      category: "Service Worker",
      status: swStatus,
      actualValue: swListValue,
      explanation: registrations.length > 0 
        ? "Des Service Workers sont inscrits pour cette origine dans votre navigateur." 
        : "Aucun Service Worker n'est actuellement inscrit. Ils s'enregistrent généralement au premier chargement complet."
    });

    // 17. Afficher leur scope
    let scopesText = "Aucun";
    if (registrations.length > 0) {
      scopesText = registrations.map(r => r.scope).join(", ");
    } else if (!swSupported) {
      scopesText = "Non applicable";
    }
    
    results.push({
      id: 17,
      name: "Scopes des Service Workers",
      category: "Service Worker",
      status: registrations.length > 0 ? "OK" : "WARN",
      actualValue: scopesText,
      explanation: "Indique le chemin d'URL contrôlé par le Service Worker. Généralement l'origine entière (ex: '/')."
    });

    // 18. Afficher leur état
    let swStates: string[] = [];
    registrations.forEach(reg => {
      if (reg.active) swStates.push("Actif (active)");
      if (reg.waiting) swStates.push("En attente (waiting)");
      if (reg.installing) swStates.push("En cours d'installation (installing)");
    });
    const swStatesValue = swStates.length > 0 ? swStates.join(", ") : "Aucun état actif détecté";

    results.push({
      id: 18,
      name: "État des Service Workers",
      category: "Service Worker",
      status: swStates.includes("Actif (active)") ? "OK" : "WARN",
      actualValue: swStatesValue,
      explanation: "L'état d'activité des Service Workers. Pour intercepter les requêtes hors-ligne, un Service Worker doit être 'active'."
    });

    // 19. Afficher le Service Worker actif
    let activeSwUrl = "Aucun";
    let hasActiveSw = false;
    registrations.forEach(reg => {
      if (reg.active) {
        activeSwUrl = reg.active.scriptURL;
        hasActiveSw = true;
      }
    });

    results.push({
      id: 19,
      name: "Service Worker Actif",
      category: "Service Worker",
      status: hasActiveSw ? "OK" : "WARN",
      actualValue: activeSwUrl,
      explanation: hasActiveSw 
        ? `Le Service Worker actif est localisé à : ${activeSwUrl}` 
        : "Aucun Service Worker actif n'est en cours d'exécution pour le moment."
    });

    // 20. Vérifier navigator.serviceWorker.controller
    const controllerExists = swSupported && navigator.serviceWorker.controller !== null;
    results.push({
      id: 20,
      name: "Contrôleur Service Worker actif (controller)",
      category: "Service Worker",
      status: controllerExists ? "OK" : "WARN",
      actualValue: controllerExists ? "Disponible (Contrôle de la page actif)" : "Indisponible (null)",
      explanation: controllerExists 
        ? "navigator.serviceWorker.controller contrôle la page actuelle et intercepte les requêtes réseau." 
        : "La page n'est pas contrôlée par un Service Worker. C'est normal lors du tout premier chargement ou après un rafraîchissement forcé (Ctrl+F5/Shift+Reload)."
    });

    // 21. Afficher l'URL du controller si disponible
    const controllerUrl = swSupported && navigator.serviceWorker.controller ? navigator.serviceWorker.controller.scriptURL : "Non disponible";
    results.push({
      id: 21,
      name: "URL du script de contrôle",
      category: "Service Worker",
      status: controllerExists ? "OK" : "WARN",
      actualValue: controllerUrl,
      explanation: "L'URL exacte du script du Service Worker qui contrôle actuellement la session de navigation active."
    });

    // 22. Tester navigator.onLine
    const isOnline = navigator.onLine;
    results.push({
      id: 22,
      name: "Statut de connectivité réseau",
      category: "Environnement",
      status: isOnline ? "OK" : "WARN",
      actualValue: isOnline ? "En ligne (onLine = true)" : "Hors-ligne (onLine = false)",
      explanation: isOnline 
        ? "L'appareil indique qu'il est connecté à Internet." 
        : "L'appareil est déconnecté du réseau. La PWA doit charger son contenu mis en cache pour fonctionner."
    });

    // 23. Tester display-mode standalone
    const isStandaloneMode = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    results.push({
      id: 23,
      name: "Mode d'affichage 'standalone' actif",
      category: "Environnement",
      status: isStandaloneMode ? "OK" : "WARN",
      actualValue: isStandaloneMode ? "Oui (Lancé comme application)" : "Non (Lancé dans un onglet classique du navigateur)",
      explanation: isStandaloneMode 
        ? "L'application est exécutée directement en mode autonome en dehors du navigateur classique." 
        : "L'application est exécutée dans un navigateur Web classique. L'utilisateur peut l'installer sur son écran d'accueil."
    });

    // 24. Détecter si l'application est déjà installée
    // we can check if it's running standalone, or check navigator properties
    const appInstalled = isStandaloneMode || (typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches);
    results.push({
      id: 24,
      name: "Détection du statut d'installation",
      category: "Installation",
      status: "OK",
      actualValue: appInstalled ? "Détectée installée / autonome" : "Non installée / s'exécute dans le navigateur",
      explanation: appInstalled 
        ? "L'application est détectée comme installée car elle s'exécute déjà en mode autonome." 
        : "L'application s'exécute dans un navigateur standard, ce qui signifie qu'elle est installable ou n'a pas été lancée depuis l'icône de l'appareil."
    });

    // 25. Détecter beforeinstallprompt
    const hasDeferredPrompt = !!(window as any).deferredPWAInstallPrompt;
    results.push({
      id: 25,
      name: "Disponibilité de l'événement d'installation (beforeinstallprompt)",
      category: "Installation",
      status: hasDeferredPrompt ? "OK" : "WARN",
      actualValue: hasDeferredPrompt ? "Disponible (Prêt à installer)" : "Non détecté pour le moment",
      explanation: hasDeferredPrompt 
        ? "L'événement beforeinstallprompt a été intercepté. La boîte de dialogue d'installation peut être déclenchée." 
        : "L'événement n'a pas encore été déclenché par le navigateur. C'est normal sur Safari iOS (qui ne le supporte pas), si l'application est déjà installée, ou si les critères d'engagement ne sont pas encore satisfaits."
    });

    // 26. Vérifier Cache Storage
    const hasCacheStorage = typeof caches !== "undefined";
    results.push({
      id: 26,
      name: "Support de l'API de cache (Cache Storage)",
      category: "Cache",
      status: hasCacheStorage ? "OK" : "ERROR",
      actualValue: hasCacheStorage ? "Supporté (caches présent)" : "Non supporté",
      explanation: hasCacheStorage 
        ? "L'API Cache Storage est disponible pour stocker les ressources de l'application hors-ligne." 
        : "L'API de cache n'est pas disponible. Le fonctionnement hors-ligne sera indisponible."
    });

    // 27. Lister les caches présents
    let cacheKeys: string[] = [];
    let cacheKeysValue = "Aucun";
    let cacheStatus: "OK" | "WARN" | "ERROR" = "WARN";
    
    if (hasCacheStorage) {
      try {
        cacheKeys = await caches.keys();
        if (cacheKeys.length > 0) {
          cacheKeysValue = cacheKeys.join(", ");
          cacheStatus = "OK";
        } else {
          cacheKeysValue = "Aucun cache initialisé";
          cacheStatus = "WARN";
        }
      } catch (err: any) {
        cacheKeysValue = `Erreur : ${err?.message || err}`;
        cacheStatus = "ERROR";
      }
    } else {
      cacheKeysValue = "Non applicable";
      cacheStatus = "ERROR";
    }

    results.push({
      id: 27,
      name: "Caches initialisés détectés",
      category: "Cache",
      status: cacheStatus,
      actualValue: cacheKeysValue,
      explanation: cacheKeys.length > 0 
        ? "Des entrées de stockage en cache ont été trouvées, confirmant le stockage local de la PWA." 
        : "Aucune clé de cache n'a été trouvée. Le Service Worker n'a peut-être pas encore complété la phase d'installation (install) ou de mise en cache."
    });

    // 28. Afficher les informations de support de la PWA
    let pwaFeatures = [];
    if ("Notification" in window) pwaFeatures.push("Notifications");
    if ("PushManager" in window) pwaFeatures.push("Push");
    if ("share" in navigator) pwaFeatures.push("Web Share");
    if ("periodicSync" in (navigator as any).serviceWorker || "sync" in (navigator as any).serviceWorker) pwaFeatures.push("Background Sync");
    
    results.push({
      id: 28,
      name: "Fonctionnalités PWA avancées supportées",
      category: "Environnement",
      status: "OK",
      actualValue: pwaFeatures.length > 0 ? pwaFeatures.join(", ") : "Aucune API avancée détectée",
      explanation: "Indique les APIs complémentaires supportées par votre navigateur pour enrichir l'expérience PWA."
    });

    // 29. Détecter les incohérences manifest/scope/start_url
    let incoherencies: string[] = [];
    if (manifestData) {
      // Check if start_url falls within scope
      if (manifestStartUrl && manifestScope) {
        const cleanStart = manifestStartUrl.replace(/^\.\//, "/").replace(/^\//, "");
        const cleanScope = manifestScope.replace(/^\.\//, "/").replace(/^\//, "");
        if (cleanScope && !cleanStart.startsWith(cleanScope) && cleanScope !== "/") {
          incoherencies.push(`La start_url ("${manifestStartUrl}") n'est pas comprise dans le scope ("${manifestScope}").`);
        }
      }
      // Check for HTTPS exception for localhost
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (!isHttps && !isLocalhost) {
        incoherencies.push("HTTPS obligatoire : L'application n'est pas sur localhost et ne tourne pas en HTTPS.");
      }
    } else {
      incoherencies.push("Manifeste absent ou illisible : Impossible d'analyser la cohérence des chemins.");
    }

    results.push({
      id: 29,
      name: "Analyse de cohérence PWA",
      category: "Environnement",
      status: incoherencies.length === 0 ? "OK" : "WARN",
      actualValue: incoherencies.length === 0 ? "Aucune incohérence détectée" : incoherencies.join(" | "),
      explanation: incoherencies.length === 0 
        ? "Toutes les configurations clés (HTTPS, chemins, scopes) sont cohérentes." 
        : "Des anomalies ont été détectées, pouvant perturber l'installation de la PWA sur certains systèmes."
    });

    // 30. Produire un diagnostic final automatique
    // Calculated below to populate final state
    results.push({
      id: 30,
      name: "Génération automatique du diagnostic",
      category: "Environnement",
      status: "OK",
      actualValue: "Effectué",
      explanation: "Génération automatique du rapport d'état final de la PWA."
    });

    // --- DIAGNOSTIC FINAL SYNTHESIS ---
    const failedCount = results.filter(t => t.status === "ERROR").length;
    const warnCount = results.filter(t => t.status === "WARN").length;

    // Technical validity requires secure context, manifest detection, fetch manifest, name, short_name, and serviceWorker support.
    const isTechnicallyValid = isHttps && !!manifestLink && !!manifestData && !!manifestName && swSupported;
    const isInstallable = isTechnicallyValid && (hasDeferredPrompt || appInstalled || isIOS);

    let cause = "Aucun problème majeur détecté.";
    let actions: string[] = [];

    if (!isHttps) {
      cause = "Le protocole de connexion n'est pas sécurisé (pas de HTTPS).";
      actions.push("Déployer l'application sur un hébergement sécurisé supportant le protocole HTTPS.");
    } else if (!manifestLink) {
      cause = "La balise <link rel=\"manifest\"> est absente dans le HTML de l'application.";
      actions.push("Ajouter <link rel=\"manifest\" href=\"/manifest.webmanifest\"> dans le <head> du fichier HTML.");
    } else if (!manifestData) {
      cause = "Le fichier manifest.webmanifest n'a pas pu être chargé depuis le serveur.";
      actions.push("Vérifier les règles de routage ou de serveur de fichiers statiques pour s'assurer que /manifest.webmanifest est servi correctement avec le header Content-Type 'application/manifest+json'.");
    } else if (!swSupported) {
      cause = "Le Service Worker n'est pas supporté par ce navigateur ou cette configuration.";
      actions.push("Utiliser un navigateur moderne (Chrome, Safari, Firefox, Edge) et s'assurer de ne pas être dans un onglet privé aux règles trop restrictives.");
    } else if (registrations.length === 0) {
      cause = "Le Service Worker n'a pas encore été enregistré par l'application.";
      actions.push("Recharger la page. L'enregistrement se fait généralement au premier chargement via le script d'initialisation.");
    } else if (!isStandaloneMode && !hasDeferredPrompt) {
      if (isIOS) {
        cause = "Sur iOS, l'événement beforeinstallprompt n'est pas supporté.";
        actions.push("Sur iOS, pour installer l'application, l'utilisateur doit cliquer manuellement sur le bouton 'Partager' (Share) de Safari, puis sélectionner 'Sur l'écran d'accueil' (Add to Home Screen).");
      } else {
        cause = "L'application s'exécute dans le navigateur classique et l'événement beforeinstallprompt n'est pas encore disponible.";
        actions.push("Vérifier si l'application est déjà installée sur l'appareil.");
        actions.push("Vérifier la console réseau pour s'assurer que les icônes de taille 192x192 et 512x512 spécifiées dans le manifeste retournent un code de statut HTTP 200.");
      }
    }

    if (actions.length === 0) {
      actions.push("Aucune action requise. Votre PWA est parfaitement valide et installable.");
    }

    setTests(results);
    setFinalSummary({
      valid: isTechnicallyValid,
      installable: isInstallable,
      probableCause: cause,
      failedCount,
      warnCount,
      recommendedActions: actions
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    runDiagnostic();
  }, [runDiagnostic]);

  const copyReportToClipboard = () => {
    let report = `==================================================\n`;
    report += `          RAPPORT DE DIAGNOSTIC PWA - AFRIGOMBO\n`;
    report += `==================================================\n`;
    report += `Généré le : ${new Date().toLocaleString("fr-FR")}\n`;
    report += `Rapporteur de statut global : ${finalSummary.valid ? "VALIDE" : "NON VALIDE"} | Installable : ${finalSummary.installable ? "OUI" : "NON / INCONNU"}\n`;
    report += `Échecs (ROUGE) : ${finalSummary.failedCount} | Avertissements (ORANGE) : ${finalSummary.warnCount}\n`;
    report += `--------------------------------------------------\n\n`;
    
    report += `[DIAGNOSTIC FINAL]\n`;
    report += `- Validité technique : ${finalSummary.valid ? "VERT (OK)" : "ROUGE (Invalide)"}\n`;
    report += `- Installation disponible : ${finalSummary.installable ? "VERT (Disponible / Déjà installée)" : "ORANGE (Indisponible via prompt automatique)"}\n`;
    report += `- Cause probable des limites : ${finalSummary.probableCause}\n`;
    report += `- Actions recommandées :\n`;
    finalSummary.recommendedActions.forEach((act, index) => {
      report += `  ${index + 1}. ${act}\n`;
    });
    report += `\n--------------------------------------------------\n\n`;
    report += `[DÉTAILS DES TESTS DE DIAGNOSTIC]\n\n`;

    tests.forEach(t => {
      report += `TEST ${t.id} : ${t.name}\n`;
      report += `STATUT : ${t.status}\n`;
      report += `VALEUR RÉELLE : ${t.actualValue}\n`;
      report += `EXPLICATION : ${t.explanation}\n`;
      report += `--------------------------------------------------\n`;
    });

    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error("Échec lors de la copie du rapport :", err);
    });
  };

  return (
    <div className="flex-1 w-full max-w-full overflow-x-hidden bg-afri-bg text-afri-text font-sans min-h-screen pb-12 flex flex-col">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-afri-bg-sec/90 border-b border-afri-border px-4 py-4 flex items-center justify-between">
        <button 
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 text-sm text-afri-text-sec hover:text-afri-text transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-btn font-semibold uppercase tracking-wider text-xs">Retour</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-afri-gold animate-pulse"></span>
          <h1 className="font-display font-bold text-sm tracking-wider uppercase">PWA Diagnostic</h1>
        </div>
        <div className="w-12"></div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 max-w-3xl mx-auto w-full pt-6 space-y-6">
        
        {/* Intro Card */}
        <div className="bg-afri-bg-sec border border-afri-border p-5 rounded-2xl space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-afri-gold/10 text-afri-gold shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-white">Diagnostic Progressif d'AfriGombo</h2>
              <p className="text-xs text-afri-text-sec leading-relaxed mt-1">
                Cet utilitaire analyse en temps réel l'intégration de la Progressive Web App (PWA) sur votre terminal et votre navigateur. 
                Il vérifie la sécurité, la validité du manifeste de configuration, l'état des Service Workers et l'API de cache.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={runDiagnostic}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-afri-bg-action text-white hover:bg-opacity-80 transition-all rounded-xl text-xs font-semibold uppercase tracking-wider cursor-pointer border border-afri-border shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Diagnostic..." : "Relancer le diagnostic"}
            </button>

            <button
              onClick={copyReportToClipboard}
              disabled={loading || tests.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-afri-gold text-black hover:bg-opacity-90 transition-all rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Rapport copié !" : "Copier le rapport"}
            </button>
          </div>
        </div>

        {/* Global Summary Badge Card */}
        {tests.length > 0 && !loading && (
          <div className="bg-afri-bg-sec border border-afri-border rounded-2xl overflow-hidden">
            <div className="bg-afri-bg-ter px-5 py-4 border-b border-afri-border flex items-center justify-between">
              <span className="font-display font-extrabold text-xs tracking-wider uppercase text-afri-text-sec">
                Rapport de Synthèse Global
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  finalSummary.valid 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}>
                  {finalSummary.valid ? "PWA VALIDE" : "INVALIDE / INCOMPLÈTE"}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  finalSummary.installable 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}>
                  {finalSummary.installable ? "INSTALLATION PRÊTE" : "INSTALLATION MANUELLE"}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-afri-text-muted mb-2">
                  Diagnostic Final
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    {finalSummary.valid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {finalSummary.valid 
                          ? "La structure PWA est techniquement conforme" 
                          : "La structure PWA présente des non-conformités"}
                      </h4>
                      <p className="text-xs text-afri-text-sec mt-0.5 leading-relaxed">
                        {finalSummary.valid 
                          ? "Tous les prérequis techniques (HTTPS, balisage de manifeste, name/short_name, support Service Worker) sont remplis avec succès."
                          : `L'analyse a identifié des anomalies bloquantes empêchant les navigateurs d'initialiser correctement l'expérience PWA.`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 pt-1">
                    {finalSummary.installable ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {finalSummary.installable 
                          ? "L'installation native est pleinement supportée" 
                          : "L'installation automatique est limitée"}
                      </h4>
                      <p className="text-xs text-afri-text-sec mt-0.5 leading-relaxed">
                        {finalSummary.installable 
                          ? "Le navigateur dispose de l'événement requis ou l'application est déjà configurée en mode autonome."
                          : "Le navigateur ne propose pas encore le bouton d'installation directe. Cela peut être causé par le fait de ne pas utiliser Chrome, d'être sur iOS (qui requiert l'ajout manuel via Safari), ou de ne pas encore satisfaire l'engagement minimum du visiteur."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Limits and Probable Cause */}
              <div className="border-t border-afri-border pt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-afri-text-muted mb-1.5">
                  Limitation détectée / Cause probable
                </h4>
                <p className="text-xs font-mono text-afri-text-sec bg-afri-bg-ter px-3 py-2 rounded-xl border border-afri-border">
                  {finalSummary.probableCause}
                </p>
              </div>

              {/* Recommended Actions */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-afri-text-muted mb-2">
                  Actions recommandées
                </h4>
                <ul className="space-y-1.5">
                  {finalSummary.recommendedActions.map((act, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-afri-text-sec">
                      <span className="w-1.5 h-1.5 rounded-full bg-afri-gold shrink-0 mt-1.5"></span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Tests Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-extrabold text-xs tracking-wider uppercase text-afri-text-muted">
              Détails des {tests.length} tests individuels
            </h3>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{tests.filter(t => t.status === "OK").length} OK</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>{tests.filter(t => t.status === "WARN").length} WARN</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>{tests.filter(t => t.status === "ERROR").length} ERR</span>
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {tests.map((test) => {
              const isOk = test.status === "OK";
              const isWarn = test.status === "WARN";
              
              let statusColor = "border-rose-500/20 bg-rose-500/5";
              let statusBadge = "bg-rose-500/10 text-rose-400 border-rose-500/20";
              let statusLabel = "ROUGE";
              let Icon = XCircle;

              if (isOk) {
                statusColor = "border-emerald-500/15 bg-emerald-500/2";
                statusBadge = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                statusLabel = "VERT";
                Icon = CheckCircle2;
              } else if (isWarn) {
                statusColor = "border-amber-500/20 bg-amber-500/3";
                statusBadge = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                statusLabel = "ORANGE";
                Icon = AlertTriangle;
              }

              return (
                <div 
                  key={test.id} 
                  className={`border p-4 rounded-xl flex flex-col sm:flex-row gap-3 items-start justify-between transition-all ${statusColor}`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono bg-afri-bg-ter px-1.5 py-0.5 rounded text-afri-text-muted border border-afri-border">
                        Test {test.id}
                      </span>
                      <span className="text-[10px] font-semibold text-afri-gold uppercase tracking-wider font-display">
                        {test.category}
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-white">
                      {test.name}
                    </h4>

                    {/* Actual Value Displayed like Code */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-afri-text-muted">
                        Valeur réelle :
                      </span>
                      <div className="font-mono text-xs bg-black/40 border border-white/5 px-2.5 py-1.5 rounded-lg text-white break-all max-w-full overflow-x-auto whitespace-pre-wrap">
                        {test.actualValue}
                      </div>
                    </div>

                    <p className="text-xs text-afri-text-sec leading-relaxed pt-0.5">
                      <span className="font-semibold text-white/90">Explication : </span>
                      {test.explanation}
                    </p>
                  </div>

                  {/* Status Box */}
                  <div className="shrink-0 self-start sm:self-center flex flex-row sm:flex-col items-center gap-2 sm:gap-1.5 sm:mt-0">
                    <Icon className={`w-5 h-5 ${isOk ? "text-emerald-500" : isWarn ? "text-amber-500" : "text-rose-500"}`} />
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black text-center ${statusBadge}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Diagnostic Footer Info */}
        <div className="bg-afri-bg-sec border border-afri-border p-4 rounded-2xl text-center space-y-1.5">
          <p className="text-[11px] text-afri-text-sec">
            Note: Certaines conditions de test (ex: détection active de Service Worker) requièrent l'acceptation de protocoles sécurisés par l'hôte de l'application.
          </p>
          <div className="flex justify-center items-center gap-3 text-xs pt-1">
            <a 
              href="/manifest.webmanifest" 
              target="_blank" 
              className="inline-flex items-center gap-1 text-afri-gold hover:underline cursor-pointer"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Manifeste direct</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-afri-border">|</span>
            <span className="text-afri-text-muted font-mono">Build Version: 2.6.0-ELITE</span>
          </div>
        </div>

      </main>
    </div>
  );
}
