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
  ExternalLink,
  Server,
  HelpCircle,
  FileText,
  Globe
} from "lucide-react";

interface TestResult {
  id: number;
  name: string;
  category: string;
  status: "OK" | "WARN" | "ERROR"; // VERT, ORANGE, ROUGE
  actualValue: string;
  explanation: string;
}

interface ResourceTestResult {
  url: string;
  status: number | string;
  ok: boolean;
  contentType: string;
  contentLength: string;
  receivedSize: string;
  finalUrl: string;
  error: string;
  isValid: boolean; // VERT if true, ROUGE if false
}

interface InstallationAnalysis {
  displayStandalone: boolean;
  displayBrowser: boolean;
  navigatorStandalone: boolean | string;
  beforeInstallPromptSession: boolean;
  appInstalledSession: boolean;
  alreadyInstalled: boolean;
  manualInstallPossible: boolean;
  manualInstallInstruction: string;
  isIframe: boolean;
}

interface SwDetails {
  count: number;
  list: Array<{
    scriptURL: string;
    scope: string;
    state: string;
  }>;
  controller: string | null;
  comparisonResult: string;
  hasMultipleSw: boolean;
  hasOldSw: boolean;
  hasRedundantSw: boolean;
  hasNoController: boolean;
  isScopeMismatched: boolean;
}

export default function PWADiagnosticPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Real event listeners states
  const [beforeInstallPromptState, setBeforeInstallPromptState] = useState<{
    received: boolean;
    time: string | null;
    count: number;
    userChoice: "accepted" | "dismissed" | null;
  }>({
    received: false,
    time: null,
    count: 0,
    userChoice: null
  });

  const [appInstalledState, setAppInstalledState] = useState<{
    received: boolean;
    time: string | null;
  }>({
    received: false,
    time: null
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Diagnostic states
  const [tests, setTests] = useState<TestResult[]>([]);
  const [resourceTests, setResourceTests] = useState<ResourceTestResult[]>([]);
  const [manifestRealData, setManifestRealData] = useState<any>(null);
  const [manifestError, setManifestError] = useState<string>("");
  
  const [swDetails, setSwDetails] = useState<SwDetails>({
    count: 0,
    list: [],
    controller: null,
    comparisonResult: "",
    hasMultipleSw: false,
    hasOldSw: false,
    hasRedundantSw: false,
    hasNoController: false,
    isScopeMismatched: false
  });

  const [installationAnalysis, setInstallationAnalysis] = useState<InstallationAnalysis>({
    displayStandalone: false,
    displayBrowser: false,
    navigatorStandalone: "Non supporté / Non disponible",
    beforeInstallPromptSession: false,
    appInstalledSession: false,
    alreadyInstalled: false,
    manualInstallPossible: false,
    manualInstallInstruction: "",
    isIframe: false
  });

  const [causeType, setCauseType] = useState<"CONFIRMÉE" | "PROBABLE" | "NON DÉTERMINABLE">("NON DÉTERMINABLE");
  const [causeDetail, setCauseDetail] = useState<string>("");

  const [categories, setCategories] = useState<{
    confirmedOk: string[];
    warnings: string[];
    errors: string[];
    nonDeterminable: string[];
  }>({
    confirmedOk: [],
    warnings: [],
    errors: [],
    nonDeterminable: []
  });

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

  // Component-level environment variables for render scope
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isFirefox = userAgent.includes("Firefox");
  const isChrome = userAgent.includes("Chrome") || userAgent.includes("CriOS");
  let browserName = "Navigateur non spécifié";
  if (isSafari) browserName = "Apple Safari";
  else if (isChrome) browserName = "Google Chrome / Chromium";
  else if (isFirefox) browserName = "Mozilla Firefox";
  else if (isIOS) browserName = "iOS WebKit";

  const isBrowserMode = typeof window !== "undefined" ? window.matchMedia("(display-mode: browser)").matches : false;
  const isStandalone = typeof window !== "undefined" ? (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true) : false;
  const isHttps = typeof window !== "undefined" ? window.isSecureContext : false;
  const isIframe = typeof window !== "undefined" ? window.self !== window.top : false;
  const swSupported = typeof navigator !== "undefined" ? "serviceWorker" in navigator : false;
  const manifestLink = typeof document !== "undefined" ? document.querySelector('link[rel="manifest"]') : null;

  // Real manifest variables based on active loaded state
  const manifestName = manifestRealData?.name || "";
  const manifestShortName = manifestRealData?.short_name || "";
  const manifestStartUrl = manifestRealData?.start_url || "";
  const manifestScope = manifestRealData?.scope || "";
  const isDisplayStandalone = ["standalone", "fullscreen", "minimal-ui"].includes(manifestRealData?.display || "");
  const manifestIcons = manifestRealData?.icons || [];
  const icon192 = manifestIcons.find((icon: any) => icon.sizes === "192x192" || icon.sizes?.includes("192"));
  const icon512 = manifestIcons.find((icon: any) => icon.sizes === "512x512" || icon.sizes?.includes("512"));

  // Listen actually to events
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Do not call preventDefault until the appropriate time (the button click)
      // or we can prevent default to store and trigger manually later
      e.preventDefault();
      setDeferredPrompt(e);
      setBeforeInstallPromptState(prev => ({
        received: true,
        time: new Date().toLocaleTimeString("fr-FR"),
        count: prev.count + 1,
        userChoice: prev.userChoice
      }));
    };

    const handleAppInstalled = () => {
      setAppInstalledState({
        received: true,
        time: new Date().toLocaleTimeString("fr-FR")
      });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleTestInstall = async () => {
    if (!deferredPrompt) {
      return;
    }
    try {
      // Prompt user
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      setBeforeInstallPromptState(prev => ({
        ...prev,
        userChoice: choiceResult.outcome // 'accepted' or 'dismissed'
      }));
      // Clear deferred prompt so it cannot be used again
      setDeferredPrompt(null);
    } catch (err) {
      console.error("Erreur lors de l'appel à prompt() :", err);
    }
  };

  const runDiagnostic = useCallback(async () => {
    setLoading(true);
    const results: TestResult[] = [];
    const swSupported = "serviceWorker" in navigator;

    // --- 1. ENVIRONNEMENT & CONNECTIVITÉ ---
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

    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    const isFirefox = userAgent.includes("Firefox");
    const isChrome = userAgent.includes("Chrome") || userAgent.includes("CriOS");
    let browserName = "Navigateur non spécifié";
    if (isSafari) browserName = "Apple Safari";
    else if (isChrome) browserName = "Google Chrome / Chromium";
    else if (isFirefox) browserName = "Mozilla Firefox";
    else if (isIOS) browserName = "iOS WebKit";

    results.push({
      id: 2,
      name: "Identification du navigateur",
      category: "Environnement",
      status: "OK",
      actualValue: `${browserName} (${userAgent.substring(0, 60)}...)`,
      explanation: `Navigateur détecté : ${browserName}.`
    });

    // --- 2. VÉRIFICATION DU MANIFESTE ---
    const manifestLink = document.querySelector('link[rel="manifest"]');
    const manifestHref = manifestLink?.getAttribute("href") || "";
    results.push({
      id: 3,
      name: "Balise de manifeste détectée",
      category: "Manifeste",
      status: manifestLink ? "OK" : "ERROR",
      actualValue: manifestLink ? `Oui, href="${manifestHref}"` : "Non détectée",
      explanation: manifestLink 
        ? "La balise <link rel=\"manifest\"> est présente dans le code HTML." 
        : "Aucune balise de manifeste n'a été trouvée dans le HTML."
    });

    // Fetch manifest actually
    let manifestData: any = null;
    let manifestFetchError = "";
    try {
      const response = await fetch("/manifest.webmanifest");
      if (response.ok) {
        manifestData = await response.json();
        setManifestRealData(manifestData);
        setManifestError("");
      } else {
        manifestFetchError = `HTTP ${response.status} ${response.statusText}`;
        setManifestError(manifestFetchError);
      }
    } catch (err: any) {
      manifestFetchError = err?.message || "Erreur réseau";
      setManifestError(manifestFetchError);
    }

    results.push({
      id: 4,
      name: "Récupération du fichier manifeste",
      category: "Manifeste",
      status: manifestData ? "OK" : "ERROR",
      actualValue: manifestData ? "Succès depuis /manifest.webmanifest" : `Échec (${manifestFetchError})`,
      explanation: manifestData ? "Le manifeste a été lu avec succès." : "Impossible d'accéder au manifeste."
    });

    const manifestName = manifestData?.name || "";
    results.push({
      id: 5,
      name: "Manifeste : Propriété 'name'",
      category: "Manifeste",
      status: manifestName ? "OK" : "ERROR",
      actualValue: manifestName || "Absente",
      explanation: manifestName ? `Défini à "${manifestName}"` : "La propriété 'name' est requise."
    });

    const manifestShortName = manifestData?.short_name || "";
    results.push({
      id: 6,
      name: "Manifeste : Propriété 'short_name'",
      category: "Manifeste",
      status: manifestShortName ? "OK" : "ERROR",
      actualValue: manifestShortName || "Absente",
      explanation: manifestShortName ? `Défini à "${manifestShortName}"` : "Le 'short_name' est requis."
    });

    const manifestStartUrl = manifestData?.start_url || "";
    results.push({
      id: 7,
      name: "Manifeste : Propriété 'start_url'",
      category: "Manifeste",
      status: manifestStartUrl ? "OK" : "ERROR",
      actualValue: manifestStartUrl || "Absente",
      explanation: manifestStartUrl ? `Défini à "${manifestStartUrl}"` : "L'start_url est requis."
    });

    const manifestScope = manifestData?.scope || "";
    results.push({
      id: 8,
      name: "Manifeste : Propriété 'scope'",
      category: "Manifeste",
      status: manifestScope ? "OK" : "WARN",
      actualValue: manifestScope || "Absente (Défaut : '/')",
      explanation: manifestScope ? `Défini à "${manifestScope}"` : "Le scope est facultatif mais recommandé."
    });

    const manifestDisplay = manifestData?.display || "";
    const isDisplayStandalone = ["standalone", "fullscreen", "minimal-ui"].includes(manifestDisplay);
    results.push({
      id: 9,
      name: "Manifeste : Propriété 'display'",
      category: "Manifeste",
      status: isDisplayStandalone ? "OK" : "WARN",
      actualValue: manifestDisplay || "Absente",
      explanation: isDisplayStandalone ? `Mode "${manifestDisplay}" ok.` : "Doit être 'standalone', 'fullscreen' ou 'minimal-ui' pour l'installation."
    });

    const manifestIcons = manifestData?.icons || [];
    const icon192 = manifestIcons.find((icon: any) => icon.sizes === "192x192" || icon.sizes?.includes("192"));
    results.push({
      id: 10,
      name: "Manifeste : Icône 192x192",
      category: "Manifeste",
      status: icon192 ? "OK" : "ERROR",
      actualValue: icon192 ? `Présente (src="${icon192.src}")` : "Absente",
      explanation: icon192 ? "Icône de 192x192 trouvée." : "Obligatoire pour Chrome Android."
    });

    const icon512 = manifestIcons.find((icon: any) => icon.sizes === "512x512" || icon.sizes?.includes("512"));
    results.push({
      id: 11,
      name: "Manifeste : Icône 512x512",
      category: "Manifeste",
      status: icon512 ? "OK" : "ERROR",
      actualValue: icon512 ? `Présente (src="${icon512.src}")` : "Absente",
      explanation: icon512 ? "Icône de 512x512 trouvée." : "Recommandée pour l'écran de démarrage."
    });

    // --- 3. DIAGNOSTIC DES SERVICE WORKERS (Point 1) ---
    let swList: Array<{ scriptURL: string; scope: string; state: string }> = [];
    let controllerVal: string | null = null;
    let comparisonVal = "";
    let multipleSw = false;
    let oldSwPresent = false;
    let redundantSwPresent = false;
    let noController = false;
    let scopeMismatched = false;

    if (swSupported) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          let stateLabel = "Inconnu";
          if (reg.installing) stateLabel = "installing";
          else if (reg.waiting) {
            stateLabel = "waiting";
            oldSwPresent = true;
          } else if (reg.active) {
            stateLabel = "activated";
          } else {
            stateLabel = "redundant";
            redundantSwPresent = true;
          }

          swList.push({
            scriptURL: reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || "N/A",
            scope: reg.scope,
            state: stateLabel
          });
        }

        multipleSw = regs.length > 1;
        
        if (navigator.serviceWorker.controller) {
          controllerVal = navigator.serviceWorker.controller.scriptURL;
        } else {
          noController = true;
        }

        // Compare scope of current /pwa-diagnostic vs /
        const diagnosticPath = window.location.origin + "/pwa-diagnostic";
        const rootPath = window.location.origin + "/";

        const diagnosticReg = regs.find(r => diagnosticPath.startsWith(r.scope));
        const rootReg = regs.find(r => rootPath.startsWith(r.scope));

        if (diagnosticReg && rootReg) {
          if (diagnosticReg.scope === rootReg.scope) {
            comparisonVal = `Identique : Le Service Worker avec le scope "${diagnosticReg.scope}" contrôle à la fois "/pwa-diagnostic" et la racine "/".`;
          } else {
            comparisonVal = `Différents scopes ! "/pwa-diagnostic" est associé au scope "${diagnosticReg.scope}" alors que la racine "/" est sur "${rootReg.scope}".`;
            scopeMismatched = true;
          }
        } else if (diagnosticReg) {
          comparisonVal = `Un Service Worker (${diagnosticReg.scope}) gère le diagnostic, mais aucun ne couvre la racine "/" !`;
          scopeMismatched = true;
        } else {
          comparisonVal = "Aucun Service Worker ne couvre cette page ou la racine.";
        }

      } catch (err: any) {
        console.error("Erreur SW Registrations:", err);
      }
    }

    setSwDetails({
      count: swList.length,
      list: swList,
      controller: controllerVal,
      comparisonResult: comparisonVal,
      hasMultipleSw: multipleSw,
      hasOldSw: oldSwPresent,
      hasRedundantSw: redundantSwPresent,
      hasNoController: noController,
      isScopeMismatched: scopeMismatched
    });

    results.push({
      id: 12,
      name: "Service Workers actifs enregistrés",
      category: "Service Worker",
      status: swList.length > 0 ? "OK" : "WARN",
      actualValue: `${swList.length} Service Worker(s) détecté(s)`,
      explanation: swList.length > 0 ? "Au moins un Service Worker est présent." : "Aucun Service Worker n'est enregistré."
    });

    results.push({
      id: 13,
      name: "Contrôleur Service Worker (controller)",
      category: "Service Worker",
      status: controllerVal ? "OK" : "WARN",
      actualValue: controllerVal ? `Actif : ${controllerVal}` : "Aucun (null)",
      explanation: controllerVal ? "La page est activement contrôlée." : "Pas de contrôleur. Normal lors du premier chargement."
    });

    // --- 4. TEST DE RESSOURCES RÉEL (Point 5) ---
    const resourcesToTest = [
      "/manifest.webmanifest",
      "/sw.js",
      "/pwa-192x192.png",
      "/pwa-512x512.png",
      "/pwa-512x512-maskable.png"
    ];

    const resTests: ResourceTestResult[] = [];
    for (const url of resourcesToTest) {
      try {
        const response = await fetch(url);
        let blobSize = 0;
        let errorMsg = "";
        
        try {
          const blob = await response.blob();
          blobSize = blob.size;
        } catch (blobErr: any) {
          errorMsg = "Erreur lecture corps : " + (blobErr?.message || blobErr);
        }

        const contentType = response.headers.get("content-type") || "Inconnu";
        const contentLength = response.headers.get("content-length") || "Inconnu";
        const finalUrl = response.url || window.location.origin + url;
        const ok = response.ok;
        const status = response.status;

        let isValid = ok && status === 200;
        if (isValid) {
          if (url.includes(".png") && !contentType.toLowerCase().includes("image/png")) {
            isValid = false;
            errorMsg = "Type MIME incorrect pour l'image PNG.";
          }
        } else {
          errorMsg = `Réponse HTTP incorrecte (${status})`;
        }

        resTests.push({
          url,
          status,
          ok,
          contentType,
          contentLength,
          receivedSize: blobSize > 0 ? `${blobSize} octets` : "N/A",
          finalUrl,
          error: errorMsg,
          isValid
        });
      } catch (err: any) {
        resTests.push({
          url,
          status: "Échec Réseau",
          ok: false,
          contentType: "N/A",
          contentLength: "N/A",
          receivedSize: "0 octets",
          finalUrl: window.location.origin + url,
          error: err?.message || "Erreur réseau",
          isValid: false
        });
      }
    }
    setResourceTests(resTests);

    // --- 5. ÉTAT RÉEL DE L'INSTALLATION (Point 7 & 8) ---
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    const isBrowserMode = window.matchMedia("(display-mode: browser)").matches;
    const navStandalone = typeof (window.navigator as any).standalone !== "undefined" 
      ? ((window.navigator as any).standalone ? "Oui (True)" : "Non (False)") 
      : "Non supporté (Non-iOS)";
    
    const isIframe = window.self !== window.top;
    
    let manualInstallPossible = true;
    let manualInstruction = "";
    
    if (isIframe) {
      manualInstallPossible = false;
      manualInstruction = "L'application s'exécute dans un iframe de développement d'AI Studio. Veuillez l'ouvrir dans un onglet autonome (Top Level) pour pouvoir l'installer.";
    } else if (isIOS) {
      manualInstruction = "Sur Safari iOS, l'installation est uniquement manuelle : Appuyez sur le bouton de Partage, puis sélectionnez 'Sur l'écran d'accueil'.";
    } else if (/Chrome|CriOS|Android/i.test(userAgent)) {
      manualInstruction = "Sur Google Chrome, cliquez sur les trois petits points en haut à droite, puis sélectionnez 'Installer l'application'.";
    } else {
      manualInstruction = "Ouvrez le menu de votre navigateur et recherchez l'option 'Installer' ou 'Ajouter à l'écran d'accueil'.";
    }

    const hasDeferredPrompt = !!deferredPrompt;
    const beforeInstallPromptReceived = beforeInstallPromptState.received || hasDeferredPrompt;

    setInstallationAnalysis({
      displayStandalone: isStandalone,
      displayBrowser: isBrowserMode,
      navigatorStandalone: navStandalone,
      beforeInstallPromptSession: beforeInstallPromptReceived,
      appInstalledSession: appInstalledState.received,
      alreadyInstalled: isStandalone,
      manualInstallPossible,
      manualInstallInstruction: manualInstruction,
      isIframe
    });

    // --- 6. CRITÈRES D'INSTALLABILITÉ CHROME (Point 9) ---
    const confirmedOkList: string[] = [];
    const warningsList: string[] = [];
    const errorsList: string[] = [];
    const nonDeterminableList: string[] = [];

    // Evaluate category structures
    results.forEach(t => {
      const itemDesc = `${t.name} : ${t.actualValue}`;
      if (t.status === "OK") confirmedOkList.push(itemDesc);
      else if (t.status === "WARN") warningsList.push(itemDesc);
      else if (t.status === "ERROR") errorsList.push(itemDesc);
    });

    // Evaluate resource fetches
    resTests.forEach(r => {
      const itemDesc = `Fichier ${r.url} (${r.status} / ${r.contentType})`;
      if (r.isValid) confirmedOkList.push(itemDesc);
      else errorsList.push(itemDesc);
    });

    // Add explicit non-determinables
    nonDeterminableList.push("Score d'engagement utilisateur heuristique de Chrome (Le navigateur évalue le temps d'utilisation et les clics avant de déclencher beforeinstallprompt).");
    nonDeterminableList.push("Cache d'installation global de l'appareil (Chrome peut bloquer l'événement si l'application est détectée comme installée sur un autre profil ou de manière invisible).");

    setCategories({
      confirmedOk: confirmedOkList,
      warnings: warningsList,
      errors: errorsList,
      nonDeterminable: nonDeterminableList
    });

    // --- 7. DIAGNOSTIC CAUSE FINALE (Point 10) ---
    let causeTypeResult: "CONFIRMÉE" | "PROBABLE" | "NON DÉTERMINABLE" = "NON DÉTERMINABLE";
    let causeDetailResult = "";

    if (isIframe) {
      causeTypeResult = "CONFIRMÉE";
      causeDetailResult = "L'application est exécutée dans une iframe. Les navigateurs bloquent strictement l'enregistrement PWA et les invites d'installation au sein de cadres imbriqués.";
    } else if (!isHttps && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      causeTypeResult = "CONFIRMÉE";
      causeDetailResult = "HTTPS absent. L'application tourne sur un contexte non sécurisé, interdisant formellement l'utilisation des Service Workers.";
    } else if (!manifestLink) {
      causeTypeResult = "CONFIRMÉE";
      causeDetailResult = "Balise manifeste absente du code HTML. Le navigateur ne peut pas identifier l'application comme PWA.";
    } else if (!manifestData) {
      causeTypeResult = "CONFIRMÉE";
      causeDetailResult = `Le manifest n'est pas accessible ou corrompu (${manifestFetchError || "Fichier inaccessible"}).`;
    } else if (!manifestName || !manifestShortName) {
      causeTypeResult = "CONFIRMÉE";
      causeDetailResult = "Propriétés requises ('name' ou 'short_name') manquantes dans le manifest.";
    } else if (!icon192) {
      causeTypeResult = "CONFIRMÉE";
      causeDetailResult = "L'icône requise de 192x192 pixels est absente du manifest.";
    } else if (!swSupported) {
      causeTypeResult = "CONFIRMÉE";
      causeDetailResult = "Le Service Worker n'est pas supporté par ce navigateur ou est désactivé.";
    } else if (swList.length === 0) {
      causeTypeResult = "CONFIRMÉE";
      causeDetailResult = "Le Service Worker n'est pas enregistré pour cette origine.";
    } else if (isStandalone) {
      causeTypeResult = "CONFIRMÉE";
      causeDetailResult = "L'application est déjà installée et s'exécute en mode standalone.";
    } else if (isIOS) {
      causeTypeResult = "CONFIRMÉE";
      causeDetailResult = "Sur iOS Safari, l'événement beforeinstallprompt n'est pas supporté. L'installation est uniquement manuelle.";
    } else if (!beforeInstallPromptReceived) {
      causeTypeResult = "NON DÉTERMINABLE";
      causeDetailResult = "Les prérequis techniques sont satisfaits. Le navigateur n'a pas encore fourni l'événement d'installation.";
    } else {
      causeTypeResult = "CONFIRMÉE";
      causeDetailResult = "Aucune anomalie détectée : beforeinstallprompt est disponible et l'installation est prête à être testée.";
    }

    setCauseType(causeTypeResult);
    setCauseDetail(causeDetailResult);

    // Standard summary values
    const isTechnicallyValid = isHttps && !!manifestLink && !!manifestData && !!manifestName && swSupported;
    const isInstallable = isTechnicallyValid && (beforeInstallPromptReceived || isStandalone || isIOS);

    let actions: string[] = [];
    if (isIframe) {
      actions.push("Ouvrez l'application dans son onglet parent indépendant (Top-level) en dehors du frame de développement.");
    }
    if (!isHttps && window.location.hostname !== "localhost") {
      actions.push("Assurez-vous de forcer la redirection vers HTTPS.");
    }
    if (!manifestLink) {
      actions.push("Ajoutez la balise <link rel='manifest' href='/manifest.webmanifest'> dans l'en-tête HTML.");
    }
    if (resTests.some(r => !r.isValid)) {
      actions.push("Corrigez l'accessibilité ou le type de contenu des ressources signalées en rouge.");
    }
    if (isIOS) {
      actions.push("Utilisez Safari mobile et installez l'application via l'option 'Sur l'écran d'accueil' du menu Partager.");
    }
    if (actions.length === 0) {
      actions.push("Toutes les validations techniques sont vertes. Si le prompt n'apparaît pas de lui-même, naviguez activement sur la page quelques minutes.");
    }

    setFinalSummary({
      valid: isTechnicallyValid,
      installable: isInstallable,
      probableCause: causeDetailResult,
      failedCount: errorsList.length,
      warnCount: warningsList.length,
      recommendedActions: actions
    });

    setTests(results);
    setLoading(false);
  }, [beforeInstallPromptState.received, appInstalledState.received, deferredPrompt]);

  useEffect(() => {
    runDiagnostic();
  }, [runDiagnostic]);

  // Copiable report formatting (Point 11)
  const copyReportToClipboard = () => {
    let report = `==================================================\n`;
    report += `       RAPPORT DE DIAGNOSTIC CHROME PWA - AFRIGOMBO\n`;
    report += `==================================================\n`;
    report += `Généré le : ${new Date().toLocaleString("fr-FR")}\n`;
    report += `URL actuelle : ${window.location.href}\n`;
    report += `Origine : ${window.location.origin}\n`;
    report += `Navigateur : ${navigator.userAgent}\n`;
    report += `Iframe : ${window.self !== window.top ? "OUI" : "NON (TOP LEVEL)"}\n`;
    report += `--------------------------------------------------\n\n`;

    report += `[DIAGNOSTIC FINAL PLUS PRÉCIS]\n`;
    report += `TYPE DE CAUSE : CAUSE ${causeType}\n`;
    report += `DÉTAIL : ${causeDetail}\n\n`;

    report += `[ÉVÉNEMENTS D'INSTALLATION CHROME]\n`;
    report += `- beforeinstallprompt reçu : ${beforeInstallPromptState.received ? "OUI" : "NON"}\n`;
    if (beforeInstallPromptState.received) {
      report += `  - Heure de réception : ${beforeInstallPromptState.time}\n`;
      report += `  - Nombre de fois reçu : ${beforeInstallPromptState.count}\n`;
      report += `  - Statut de prompt de test : ${beforeInstallPromptState.userChoice || "Non tenté"}\n`;
    }
    report += `- appinstalled capturé : ${appInstalledState.received ? "OUI" : "NON"}\n`;
    if (appInstalledState.received) {
      report += `  - Heure de capture : ${appInstalledState.time}\n`;
    }
    report += `--------------------------------------------------\n\n`;

    report += `[INFORMATIONS DE MANIFESTE RÉEL]\n`;
    if (manifestRealData) {
      report += `- Name : ${manifestRealData.name}\n`;
      report += `- Short Name : ${manifestRealData.short_name}\n`;
      report += `- Start URL : ${manifestRealData.start_url} (Résolue : ${manifestRealData.start_url ? new URL(manifestRealData.start_url, window.location.origin).href : "N/A"})\n`;
      report += `- Scope : ${manifestRealData.scope} (Résolu : ${manifestRealData.scope ? new URL(manifestRealData.scope, window.location.origin).href : "N/A"})\n`;
      report += `- Display : ${manifestRealData.display}\n`;
      report += `- ID : ${manifestRealData.id || "Non spécifié"}\n`;
      report += `- Theme Color : ${manifestRealData.theme_color || "Non spécifiée"}\n`;
      report += `- Background Color : ${manifestRealData.background_color || "Non spécifiée"}\n`;
      report += `- Icônes :\n`;
      const icons = manifestRealData.icons || [];
      icons.forEach((ic: any, index: number) => {
        report += `  Icône ${index + 1} : src="${ic.src}" | tailles="${ic.sizes}" | type="${ic.type || "N/A"}" | purpose="${ic.purpose || "N/A"}" (Résolue : ${ic.src ? new URL(ic.src, window.location.origin).href : "N/A"})\n`;
      });
    } else {
      report += `Manifeste non accessible ou illisible : ${manifestError}\n`;
    }
    report += `--------------------------------------------------\n\n`;

    report += `[DIAGNOSTIC SERVICE WORKERS]\n`;
    report += `- Nombre enregistré(s) : ${swDetails.count}\n`;
    swDetails.list.forEach((sw, idx) => {
      report += `  SW ${idx + 1} :\n`;
      report += `    URL : ${sw.scriptURL}\n`;
      report += `    Scope : ${sw.scope}\n`;
      report += `    État : ${sw.state}\n`;
    });
    report += `- SW qui contrôle la page actuelle (controller) : ${swDetails.controller || "Aucun"}\n`;
    report += `- Comparaison de contrôle (Diagnostic vs Racine) : ${swDetails.comparisonResult}\n`;
    report += `--------------------------------------------------\n\n`;

    report += `[TEST HTTP DES RESSOURCES]\n`;
    resourceTests.forEach(res => {
      report += `- Fichier : ${res.url}\n`;
      report += `  Status : ${res.status} | OK : ${res.ok} | Type : ${res.contentType} | Taille reçue : ${res.receivedSize}\n`;
      if (res.error) report += `  Erreur : ${res.error}\n`;
      report += `  Verdict : ${res.isValid ? "VERT (OK)" : "ROUGE (ERREUR)"}\n`;
    });
    report += `--------------------------------------------------\n\n`;

    report += `[CRITÈRES COPIÉS]\n`;
    report += `🟢 CONFIRMÉ OK :\n`;
    categories.confirmedOk.forEach(item => { report += `  - ${item}\n`; });
    report += `\n🟠 AVERTISSEMENTS :\n`;
    categories.warnings.forEach(item => { report += `  - ${item}\n`; });
    report += `\n🔴 ERREURS :\n`;
    categories.errors.forEach(item => { report += `  - ${item}\n`; });
    report += `\n⚪ NON DÉTERMINABLE :\n`;
    categories.nonDeterminable.forEach(item => { report += `  - ${item}\n`; });

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
          <h1 className="font-display font-bold text-sm tracking-wider uppercase">PWA Diagnostic Approfondi</h1>
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
              <h2 className="font-display font-bold text-lg text-white">Analyseur de Conformité Progressive d'AfriGombo</h2>
              <p className="text-xs text-afri-text-sec leading-relaxed mt-1">
                Cet outil avancé effectue des requêtes réelles, inspecte les Service Workers enregistrés et surveille les événements d'installation pour diagnostiquer précisément l'installabilité de la PWA.
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
              {loading ? "Diagnostic en cours..." : "Relancer le diagnostic"}
            </button>

            <button
              onClick={copyReportToClipboard}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-afri-gold text-black hover:bg-opacity-90 transition-all rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Rapport copié !" : "Copier le rapport"}
            </button>
          </div>
        </div>

        {/* 3. BOUTON "TESTER L'INSTALLATION" (Point 3) */}
        <div className="bg-afri-bg-sec border border-afri-border p-5 rounded-2xl space-y-3">
          <h3 className="font-display font-extrabold text-sm tracking-wider uppercase text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-afri-gold" />
            Événements d'Installation & Prompt
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-black/25 border border-white/5 p-4 rounded-xl space-y-1">
              <span className="text-[10px] text-afri-text-muted uppercase font-mono block">beforeinstallprompt</span>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold font-mono ${beforeInstallPromptState.received ? "text-emerald-400" : "text-amber-400"}`}>
                  {beforeInstallPromptState.received ? "Reçu (Prêt)" : "Non reçu"}
                </span>
                {beforeInstallPromptState.received && (
                  <span className="text-[10px] font-mono text-afri-text-sec">
                    {beforeInstallPromptState.time} ({beforeInstallPromptState.count}x)
                  </span>
                )}
              </div>
            </div>

            <div className="bg-black/25 border border-white/5 p-4 rounded-xl space-y-1">
              <span className="text-[10px] text-afri-text-muted uppercase font-mono block">appinstalled</span>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold font-mono ${appInstalledState.received ? "text-emerald-400" : "text-zinc-500"}`}>
                  {appInstalledState.received ? "Capturé" : "Non capturé"}
                </span>
                {appInstalledState.received && (
                  <span className="text-[10px] font-mono text-afri-text-sec">
                    {appInstalledState.time}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-afri-border/50">
            {deferredPrompt ? (
              <div className="space-y-3">
                <button
                  onClick={handleTestInstall}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 text-black hover:bg-emerald-400 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Tester l'Installation Active
                </button>
                {beforeInstallPromptState.userChoice && (
                  <p className="text-xs text-center font-mono text-white">
                    Résultat du choix utilisateur : <span className="text-afri-gold font-bold uppercase">{beforeInstallPromptState.userChoice}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-center space-y-1.5">
                <p className="text-xs font-semibold text-amber-300">
                  Chrome n'a actuellement fourni aucun beforeinstallprompt.
                </p>
                <p className="text-[10px] text-afri-text-sec leading-relaxed">
                  L'invite de dialogue automatique du navigateur n'est pas disponible pour l'instant. Cela peut être dû au fait que l'application s'exécute dans une iframe, ou qu'elle est déjà installée, ou que les critères de fidélité de Chrome ne sont pas encore satisfaits.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 10. CAUSE FINALE (Point 10) */}
        {!loading && (
          <div className="bg-afri-bg-sec border border-afri-border rounded-2xl overflow-hidden space-y-0">
            <div className="bg-afri-bg-ter px-5 py-4 border-b border-afri-border flex items-center justify-between">
              <span className="font-display font-extrabold text-xs tracking-wider uppercase text-afri-text-sec">
                Conclusion du Diagnostic
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
                causeType === "CONFIRMÉE" 
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                  : causeType === "PROBABLE" 
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
              }`}>
                {causeType === "CONFIRMÉE" ? "🟢 CAUSE CONFIRMÉE" : causeType === "PROBABLE" ? "🟠 CAUSE PROBABLE" : "⚪ CAUSE NON DÉTERMINABLE"}
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-2">
                <span className="text-[10px] font-bold text-afri-gold uppercase tracking-wider font-display block">
                  Cause Détectée :
                </span>
                <p className="text-xs font-semibold text-white leading-relaxed">
                  {causeDetail}
                </p>
              </div>

              {/* Action Recommended Card */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-afri-text-muted">
                  Recommandations d'actions :
                </h4>
                <ul className="space-y-1.5 bg-afri-bg-ter/60 p-3.5 rounded-xl border border-afri-border/60">
                  {finalSummary.recommendedActions.map((act, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-xs text-afri-text-sec">
                      <span className="w-5 h-5 rounded-full bg-afri-gold/10 text-afri-gold flex items-center justify-center font-bold font-mono text-[10px] shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="mt-0.5 leading-relaxed">{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 1. DIAGNOSTIC DES SERVICE WORKERS (Point 1) */}
        {!loading && (
          <div className="bg-afri-bg-sec border border-afri-border rounded-2xl overflow-hidden">
            <div className="bg-afri-bg-ter px-5 py-4 border-b border-afri-border flex items-center gap-2">
              <Layers className="w-4 h-4 text-afri-gold" />
              <span className="font-display font-extrabold text-xs tracking-wider uppercase text-afri-text-sec">
                Diagnostic des Service Workers
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-black/25 border border-white/5 p-3.5 rounded-xl space-y-1 col-span-1 sm:col-span-2">
                  <span className="text-[9px] text-afri-text-muted uppercase">Statut global</span>
                  <p className="text-white font-bold leading-relaxed">
                    {swDetails.count === 0 
                      ? "Aucun Service Worker enregistré." 
                      : `${swDetails.count} Service Worker(s) enregistré(s) au total.`}
                  </p>
                  {swDetails.hasMultipleSw && (
                    <p className="text-rose-400 font-bold text-[11px] pt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Attention : Plusieurs Service Workers sont enregistrés ! Cela peut interférer avec l'installation.
                    </p>
                  )}
                  {swDetails.hasOldSw && (
                    <p className="text-amber-400 font-bold text-[11px] pt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Un Service Worker obsolète est en attente (waiting) d'activation.
                    </p>
                  )}
                </div>

                <div className="bg-black/25 border border-white/5 p-3.5 rounded-xl space-y-1 col-span-1 sm:col-span-2">
                  <span className="text-[9px] text-afri-text-muted uppercase">Contrôleur Service Worker Actif</span>
                  <p className="text-white font-bold break-all">
                    {swDetails.controller || "Aucun contrôleur actif (null)"}
                  </p>
                  {swDetails.hasNoController && (
                    <p className="text-amber-400 text-[10px] pt-1 leading-relaxed">
                      La page actuelle n'est pas contrôlée. C'est normal si le Service Worker vient tout juste d'être enregistré ou si vous avez effectué un rechargement forcé.
                    </p>
                  )}
                </div>

                <div className="bg-black/25 border border-white/5 p-3.5 rounded-xl space-y-1 col-span-1 sm:col-span-2">
                  <span className="text-[9px] text-afri-text-muted uppercase">Comparaison Contrôle (/pwa-diagnostic vs Racine)</span>
                  <p className="text-white text-xs leading-relaxed font-sans">
                    {swDetails.comparisonResult}
                  </p>
                </div>
              </div>

              {/* Individual SW registration list */}
              {swDetails.list.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-afri-text-muted font-display">
                    Liste des registrations actives :
                  </h4>
                  <div className="space-y-2">
                    {swDetails.list.map((sw, index) => (
                      <div key={index} className="bg-afri-bg-ter/50 border border-afri-border/60 p-3.5 rounded-xl space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                          <span className="font-bold text-white break-all">{sw.scriptURL}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            sw.state === "activated" 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : sw.state === "waiting" 
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}>
                            {sw.state}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-afri-text-sec border-t border-white/5 pt-1.5 flex justify-between">
                          <span>Scope :</span>
                          <span className="text-white break-all">{sw.scope}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. VÉRIFICATION DU MANIFESTE RÉEL (Point 4) */}
        {!loading && manifestRealData && (
          <div className="bg-afri-bg-sec border border-afri-border rounded-2xl overflow-hidden">
            <div className="bg-afri-bg-ter px-5 py-4 border-b border-afri-border flex items-center gap-2">
              <FileJson className="w-4 h-4 text-afri-gold" />
              <span className="font-display font-extrabold text-xs tracking-wider uppercase text-afri-text-sec">
                Vérification du Manifeste Réel
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-black/25 border border-white/5 p-3.5 rounded-xl space-y-1">
                  <span className="text-[9px] text-afri-text-muted uppercase">name</span>
                  <p className="text-white font-bold">{manifestRealData.name || "Absent"}</p>
                </div>
                <div className="bg-black/25 border border-white/5 p-3.5 rounded-xl space-y-1">
                  <span className="text-[9px] text-afri-text-muted uppercase">short_name</span>
                  <p className="text-white font-bold">{manifestRealData.short_name || "Absent"}</p>
                </div>
                <div className="bg-black/25 border border-white/5 p-3.5 rounded-xl space-y-1">
                  <span className="text-[9px] text-afri-text-muted uppercase">start_url</span>
                  <p className="text-white font-bold">{manifestRealData.start_url || "Absent"}</p>
                  <span className="text-[9px] text-afri-text-muted break-all font-mono block">
                    Résolue : {manifestRealData.start_url ? new URL(manifestRealData.start_url, window.location.origin).href : "N/A"}
                  </span>
                </div>
                <div className="bg-black/25 border border-white/5 p-3.5 rounded-xl space-y-1">
                  <span className="text-[9px] text-afri-text-muted uppercase">scope</span>
                  <p className="text-white font-bold">{manifestRealData.scope || "Absent"}</p>
                  <span className="text-[9px] text-afri-text-muted break-all font-mono block">
                    Résolu : {manifestRealData.scope ? new URL(manifestRealData.scope, window.location.origin).href : "N/A"}
                  </span>
                </div>
                <div className="bg-black/25 border border-white/5 p-3.5 rounded-xl space-y-1">
                  <span className="text-[9px] text-afri-text-muted uppercase">display</span>
                  <p className="text-white font-bold">{manifestRealData.display || "Absent"}</p>
                </div>
                <div className="bg-black/25 border border-white/5 p-3.5 rounded-xl space-y-1">
                  <span className="text-[9px] text-afri-text-muted uppercase">id</span>
                  <p className="text-white font-bold">{manifestRealData.id || "Absent / Non spécifié"}</p>
                </div>
                <div className="bg-black/25 border border-white/5 p-3.5 rounded-xl space-y-1">
                  <span className="text-[9px] text-afri-text-muted uppercase">theme_color</span>
                  <p className="text-white font-bold">{manifestRealData.theme_color || "Absente"}</p>
                </div>
                <div className="bg-black/25 border border-white/5 p-3.5 rounded-xl space-y-1">
                  <span className="text-[9px] text-afri-text-muted uppercase">background_color</span>
                  <p className="text-white font-bold">{manifestRealData.background_color || "Absente"}</p>
                </div>
              </div>

              {/* Icons list with detailed checks */}
              <div className="space-y-2 border-t border-afri-border pt-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-afri-text-muted font-display">
                  Icônes déclarées dans le manifest :
                </h4>
                <div className="space-y-3">
                  {(manifestRealData.icons || []).map((icon: any, idx: number) => {
                    const resolvedSrc = icon.src ? new URL(icon.src, window.location.origin).href : "N/A";
                    return (
                      <div key={idx} className="bg-afri-bg-ter/50 border border-afri-border/60 p-3.5 rounded-xl flex items-start gap-4">
                        <div className="w-12 h-12 bg-black/40 rounded-lg flex items-center justify-center shrink-0 border border-white/5">
                          {icon.src ? (
                            <img 
                              src={resolvedSrc} 
                              alt={`Icône ${icon.sizes}`} 
                              className="w-10 h-10 object-contain"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as any).src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23f43f5e' stroke-width='2'><rect width='18' height='18' x='3' y='3' rx='2' ry='2'/><line x1='9' x2='15' y1='9' y2='15'/><line x1='15' x2='9' y1='9' y2='15'/></svg>";
                              }}
                            />
                          ) : (
                            <HelpCircle className="w-5 h-5 text-afri-text-muted" />
                          )}
                        </div>
                        <div className="flex-1 font-mono text-[11px] space-y-1 overflow-x-auto">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white font-bold">Icône {idx + 1} ({icon.sizes || "Tailles non définies"})</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 text-[10px] text-afri-text-sec pt-1">
                            <div><span className="text-afri-text-muted">Type :</span> {icon.type || "N/A"}</div>
                            <div><span className="text-afri-text-muted">Purpose :</span> {icon.purpose || "N/A"}</div>
                            <div className="col-span-1 sm:col-span-2 break-all">
                              <span className="text-afri-text-muted">Src relative :</span> {icon.src}
                            </div>
                            <div className="col-span-1 sm:col-span-2 break-all text-[9px] text-afri-text-muted">
                              <span className="text-afri-text-muted">Src résolue :</span> {resolvedSrc}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. TEST DE COHÉRENCE ORIGINE / SCOPE / START_URL (Point 6) */}
        {!loading && (
          <div className="bg-afri-bg-sec border border-afri-border rounded-2xl overflow-hidden">
            <div className="bg-afri-bg-ter px-5 py-4 border-b border-afri-border flex items-center gap-2">
              <Globe className="w-4 h-4 text-afri-gold" />
              <span className="font-display font-extrabold text-xs tracking-wider uppercase text-afri-text-sec">
                Test d'Origine, Scope & start_url
              </span>
            </div>

            <div className="p-5 space-y-4 text-xs font-mono">
              <div className="space-y-2">
                <div className="flex justify-between flex-wrap gap-1 border-b border-white/5 pb-1.5">
                  <span className="text-afri-text-sec font-semibold">location.origin</span>
                  <span className="text-white font-bold">{window.location.origin}</span>
                </div>
                <div className="flex justify-between flex-wrap gap-1 border-b border-white/5 pb-1.5">
                  <span className="text-afri-text-sec font-semibold">location.href</span>
                  <span className="text-white font-bold break-all">{window.location.href}</span>
                </div>
                <div className="flex justify-between flex-wrap gap-1 border-b border-white/5 pb-1.5">
                  <span className="text-afri-text-sec font-semibold">manifest.start_url</span>
                  <span className="text-white font-bold">{manifestRealData?.start_url || "Non défini"}</span>
                </div>
                <div className="flex justify-between flex-wrap gap-1 border-b border-white/5 pb-1.5">
                  <span className="text-afri-text-sec font-semibold">manifest.scope</span>
                  <span className="text-white font-bold">{manifestRealData?.scope || "Non défini"}</span>
                </div>
              </div>

              {/* Auto validations */}
              <div className="pt-3 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-afri-text-muted font-display font-sans">
                  Vérification automatique de cohérence :
                </h4>

                <div className="space-y-2">
                  {/* Validation 1: Même origine */}
                  {(() => {
                    let isSameOrigin = false;
                    if (manifestRealData?.start_url) {
                      try {
                        const startUrlObj = new URL(manifestRealData.start_url, window.location.origin);
                        isSameOrigin = startUrlObj.origin === window.location.origin;
                      } catch {}
                    }
                    return (
                      <div className="flex items-center gap-2">
                        <span className={isSameOrigin ? "text-emerald-400" : "text-rose-400"}>
                          {isSameOrigin ? "🟢" : "🔴"}
                        </span>
                        <span className="text-white">Cohérence d'origine : {isSameOrigin ? "Même origine (Ok)" : "Origines différentes ! Risque de rejet de la PWA."}</span>
                      </div>
                    );
                  })()}

                  {/* Validation 2: start_url dans scope */}
                  {(() => {
                    let inScope = false;
                    if (manifestRealData) {
                      try {
                        const startUrlAbs = new URL(manifestRealData.start_url || "/", window.location.origin).href;
                        const scopeAbs = new URL(manifestRealData.scope || "/", window.location.origin).href;
                        inScope = startUrlAbs.startsWith(scopeAbs);
                      } catch {}
                    }
                    return (
                      <div className="flex items-center gap-2">
                        <span className={inScope ? "text-emerald-400" : "text-rose-400"}>
                          {inScope ? "🟢" : "🔴"}
                        </span>
                        <span className="text-white">start_url incluse dans le scope : {inScope ? "Oui (Ok)" : "Non ! L'adresse start_url sort du scope de la PWA."}</span>
                      </div>
                    );
                  })()}

                  {/* Validation 3: URL actuelle dans scope */}
                  {(() => {
                    let currentInScope = false;
                    if (manifestRealData) {
                      try {
                        const scopeAbs = new URL(manifestRealData.scope || "/", window.location.origin).href;
                        currentInScope = window.location.href.startsWith(scopeAbs);
                      } catch {}
                    }
                    return (
                      <div className="flex items-center gap-2">
                        <span className={currentInScope ? "text-emerald-400" : "text-rose-400"}>
                          {currentInScope ? "🟢" : "🔴"}
                        </span>
                        <span className="text-white">URL actuelle dans le scope : {currentInScope ? "Oui (Ok)" : "Non ! La page de diagnostic s'exécute hors du scope."}</span>
                      </div>
                    );
                  })()}

                  {/* Validation 4: Scope compatible avec Service Worker */}
                  {(() => {
                    const matchedScope = swDetails.list.some(sw => {
                      try {
                        const swScopeAbs = new URL(sw.scope, window.location.origin).href;
                        const manifestScopeAbs = new URL(manifestRealData?.scope || "/", window.location.origin).href;
                        return manifestScopeAbs.startsWith(swScopeAbs) || swScopeAbs === manifestScopeAbs;
                      } catch {
                        return false;
                      }
                    });
                    return (
                      <div className="flex items-center gap-2">
                        <span className={matchedScope ? "text-emerald-400" : "text-amber-400"}>
                          {matchedScope ? "🟢" : "🟠"}
                        </span>
                        <span className="text-white">Scope compatible avec le Service Worker : {matchedScope ? "Oui (Ok)" : "Attention : Aucun Service Worker n'a été enregistré avec un scope englobant le scope du manifest."}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. TEST CONTEXTE (Point 7) */}
        {!loading && (
          <div className="bg-afri-bg-sec border border-afri-border rounded-2xl overflow-hidden">
            <div className="bg-afri-bg-ter px-5 py-4 border-b border-afri-border flex items-center gap-2">
              <Shield className="w-4 h-4 text-afri-gold" />
              <span className="font-display font-extrabold text-xs tracking-wider uppercase text-afri-text-sec">
                Analyse de Contexte d'Exécution
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {/* Frame Status */}
                <div className="bg-black/25 border border-white/5 p-3 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] text-afri-text-muted uppercase font-mono">Frame principal</span>
                  <span className={`text-xs font-bold pt-1 ${window.top === window.self ? "text-emerald-400" : "text-rose-400"}`}>
                    {window.top === window.self ? "TOP LEVEL" : "IFRAME"}
                  </span>
                </div>

                {/* HTTPS Status */}
                <div className="bg-black/25 border border-white/5 p-3 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] text-afri-text-muted uppercase font-mono">Protocole</span>
                  <span className={`text-xs font-bold pt-1 ${window.isSecureContext ? "text-emerald-400" : "text-rose-400"}`}>
                    {window.isSecureContext ? "HTTPS (Sécurisé)" : "HTTP (Non sécurisé)"}
                  </span>
                </div>

                {/* OS/Platform */}
                <div className="bg-black/25 border border-white/5 p-3 rounded-xl flex flex-col justify-between col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-afri-text-muted uppercase font-mono">Navigateur & OS</span>
                  <span className="text-xs font-bold pt-1 text-white truncate">
                    {/Android/i.test(userAgent) ? "Android" : isIOS ? "iOS" : "Desktop"} ({browserName.split(" ")[0]})
                  </span>
                </div>

                {/* Display mode browser */}
                <div className="bg-black/25 border border-white/5 p-3 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] text-afri-text-muted uppercase font-mono">display-mode browser</span>
                  <span className={`text-xs font-bold pt-1 ${isBrowserMode ? "text-amber-400" : "text-zinc-500"}`}>
                    {isBrowserMode ? "Actif (Standard)" : "Inactif"}
                  </span>
                </div>

                {/* Display mode standalone */}
                <div className="bg-black/25 border border-white/5 p-3 rounded-xl flex flex-col justify-between col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-afri-text-muted uppercase font-mono">display-mode standalone</span>
                  <span className={`text-xs font-bold pt-1 ${isStandalone ? "text-emerald-400" : "text-zinc-500"}`}>
                    {isStandalone ? "Actif (Installé)" : "Inactif"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 9. CRITÈRES D'INSTALLABILITÉ CHROME (Point 9) */}
        {!loading && (
          <div className="bg-afri-bg-sec border border-afri-border rounded-2xl overflow-hidden">
            <div className="bg-afri-bg-ter px-5 py-4 border-b border-afri-border flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-afri-gold" />
              <span className="font-display font-extrabold text-xs tracking-wider uppercase text-afri-text-sec">
                Analyse d'Installabilité Chrome (17 Facteurs)
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div className="divide-y divide-white/5">
                {[
                  { name: "HTTPS", val: isHttps ? "🟢 OK" : "🔴 ERREUR (Requis pour le Service Worker)", desc: "Protocole sécurisé ou localhost" },
                  { name: "Lien Manifest", val: manifestLink ? "🟢 OK" : "🔴 ERREUR (Balise link manquante)", desc: "Lien de manifeste déclaré dans le HTML" },
                  { name: "Manifest accessible", val: manifestRealData ? "🟢 OK" : "🔴 ERREUR (Fichier inaccessible)", desc: "Téléchargement et lecture de /manifest.webmanifest" },
                  { name: "Nom ('name')", val: manifestName ? "🟢 OK" : "🔴 ERREUR (Requis)", desc: "Nom complet de l'application" },
                  { name: "Nom Court ('short_name')", val: manifestShortName ? "🟢 OK" : "🔴 ERREUR (Requis)", desc: "Nom de l'icône de l'écran d'accueil" },
                  { name: "start_url", val: manifestStartUrl ? "🟢 OK" : "🔴 ERREUR (Requis)", desc: "Chemin de lancement de la PWA" },
                  { name: "scope", val: manifestScope ? "🟢 OK" : "🟠 AVERTISSEMENT (Recommandé)", desc: "Portée d'exécution de l'application" },
                  { name: "display ('standalone')", val: isDisplayStandalone ? "🟢 OK" : "🔴 ERREUR (Doit être standalone/fullscreen/minimal-ui)", desc: "Mode d'affichage d'application autonome" },
                  { name: "Icône 192x192 px", val: icon192 ? "🟢 OK" : "🔴 ERREUR (Obligatoire)", desc: "Icône requise par Chrome Android" },
                  { name: "Icône 512x512 px", val: icon512 ? "🟢 OK" : "🔴 ERREUR (Obligatoire)", desc: "Icône de démarrage HD" },
                  { name: "Support Service Worker", val: swSupported ? "🟢 OK" : "🔴 ERREUR", desc: "Compatibilité du navigateur actuel" },
                  { name: "Service Worker Enregistré", val: swDetails.count > 0 ? "🟢 OK" : "🔴 ERREUR", desc: "Au moins une registration enregistrée" },
                  { name: "Service Worker Actif", val: swDetails.list.some(sw => sw.state === "activated") ? "🟢 OK" : "🟠 AVERTISSEMENT (SW inactif ou en attente)", desc: "SW en cours de fonctionnement" },
                  { name: "Contrôleur actif (controller)", val: swDetails.controller ? "🟢 OK" : "🟠 AVERTISSEMENT (Page non contrôlée)", desc: "navigator.serviceWorker.controller" },
                  { name: "Scope SW compatible", val: !swDetails.isScopeMismatched ? "🟢 OK" : "🔴 ERREUR", desc: "Compatibilité des scopes SW et manifest" },
                  { name: "Origine identique", val: (manifestRealData && manifestRealData.start_url && new URL(manifestRealData.start_url, window.location.origin).origin === window.location.origin) ? "🟢 OK" : "🔴 ERREUR", desc: "Changement d'origine interdit" },
                  { name: "Contexte d'Iframe (Top level)", val: !isIframe ? "🟢 OK" : "🔴 ERREUR (Chrome bloque les installations dans les iframes)", desc: "window.top === window.self" },
                  { name: "Invite beforeinstallprompt", val: beforeInstallPromptState.received ? "🟢 OK" : "⚪ NON DÉTERMINABLE (En attente du navigateur)", desc: "Événement d'invite automatique de Chrome" },
                  { name: "Installation existante", val: isStandalone ? "🟢 OUI (Déjà installée)" : "⚪ NON DÉTERMINABLE", desc: "Détection du statut d'installation global" }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2.5 text-xs">
                    <div>
                      <span className="font-bold text-white block">{item.name}</span>
                      <span className="text-[10px] text-afri-text-muted">{item.desc}</span>
                    </div>
                    <span className="font-mono font-bold shrink-0">{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BLOC 1 — TEST HTTP RÉEL DES RESSOURCES PWA (Point 5) */}
        {!loading && (
          <div className="bg-afri-bg-sec border border-afri-border rounded-2xl overflow-hidden">
            <div className="bg-afri-bg-ter px-5 py-4 border-b border-afri-border flex items-center gap-2">
              <Server className="w-4 h-4 text-afri-gold" />
              <span className="font-display font-extrabold text-xs tracking-wider uppercase text-afri-text-sec">
                Test HTTP Réel des Ressources PWA
              </span>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-[11px] text-afri-text-sec italic leading-relaxed">
                Le navigateur effectue un fetch direct asynchrone sur chaque ressource ci-dessous pour valider son accessibilité, son type MIME de réponse et sa taille.
              </p>

              <div className="space-y-3">
                {resourceTests.map((res, index) => {
                  return (
                    <div 
                      key={index} 
                      className={`border p-4 rounded-xl space-y-2 transition-all ${
                        res.isValid 
                          ? "border-emerald-500/15 bg-emerald-500/2" 
                          : "border-rose-500/15 bg-rose-500/2"
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-bold text-white font-mono break-all bg-black/40 px-2 py-0.5 rounded">
                          {res.url}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                          res.isValid 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {res.isValid ? "VERDICT : VERT (OK)" : "VERDICT : ROUGE (ERREUR)"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 pt-1.5 text-[11px] font-mono border-t border-white/5">
                        <div>
                          <span className="text-afri-text-muted block text-[9px] uppercase">HTTP Status :</span>
                          <span className={res.ok ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                            {res.status} ({res.ok ? "OK" : "Échec"})
                          </span>
                        </div>
                        <div>
                          <span className="text-afri-text-muted block text-[9px] uppercase">Content-Type :</span>
                          <span className="text-white break-all">{res.contentType}</span>
                        </div>
                        <div>
                          <span className="text-afri-text-muted block text-[9px] uppercase">Taille réelle lue :</span>
                          <span className="text-white">{res.receivedSize}</span>
                        </div>
                        <div className="col-span-2 sm:col-span-3">
                          <span className="text-afri-text-muted block text-[9px] uppercase">URL finale résolue :</span>
                          <span className="text-afri-text-sec break-all text-[10px]">{res.finalUrl}</span>
                        </div>
                      </div>

                      {res.error && (
                        <div className="text-[11px] bg-rose-500/5 border border-rose-500/10 p-2 rounded-lg text-rose-300 font-mono">
                          <span className="font-bold">Erreur : </span>{res.error}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Diagnostic Footer Info */}
        <div className="bg-afri-bg-sec border border-afri-border p-4 rounded-2xl text-center space-y-1.5 font-mono">
          <p className="text-[11px] text-afri-text-sec leading-relaxed">
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
            <span className="text-afri-text-muted font-mono">Build Version: 3.0.0-CHROME-FINAL</span>
          </div>
        </div>

      </main>
    </div>
  );
}
