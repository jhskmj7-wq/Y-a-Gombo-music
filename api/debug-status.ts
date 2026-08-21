export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    res.setHeader("Content-Type", "application/json");
    return res.status(200).end();
  }

  try {
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY ||
      "";
    const supabaseConfigured = Boolean(supabaseKey && supabaseKey.trim() !== "");

    let firebaseAdminConfigured = false;
    let firebaseAdminError: string | null = null;

    try {
      const adminAppModule = await import("firebase-admin/app");
      const adminAuthModule = await import("firebase-admin/auth");
      const saKey = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

      if (adminAppModule.getApps().length === 0) {
        if (saKey && saKey.trim() !== "") {
          try {
            const parsed = typeof saKey === "string" ? JSON.parse(saKey) : saKey;
            adminAppModule.initializeApp({
              credential: adminAppModule.cert(parsed),
              projectId: process.env.VITE_FIREBASE_PROJECT_ID || "afrigombo",
            });
          } catch {
            adminAppModule.initializeApp({
              projectId: process.env.VITE_FIREBASE_PROJECT_ID || "afrigombo",
            });
          }
        } else {
          adminAppModule.initializeApp({
            projectId: process.env.VITE_FIREBASE_PROJECT_ID || "afrigombo",
          });
        }
      }
      firebaseAdminConfigured = Boolean(adminAuthModule.getAuth());
    } catch (err: any) {
      firebaseAdminConfigured = false;
      firebaseAdminError = err?.message || String(err);
    }

    const routesRegistered = [
      "GET  /api/health",
      "GET  /api/debug-status",
      "POST /api/wallet/set-pin",
      "POST /api/wallet/verify-pin",
      "POST /api/wallet/change-pin",
      "POST /api/wallet/disable-pin",
      "POST /api/wallet/request-reset",
      "POST /api/analyze-image",
      "POST /api/user/avatar/upload",
      "POST /api/user/cover/upload",
      "POST /api/user/kyc/upload",
      "POST /api/admin/media/upload",
      "POST /api/admin/media/delete",
      "POST /api/admin/kyc/view",
      "POST /api/admin/reset-environment"
    ];

    const debugData = {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "production",
      supabaseConfigured,
      firebaseAdminConfigured,
      firebaseAdminError,
      authFallbackREST: "ENABLED (Google Identity Toolkit v1)",
      routesCount: routesRegistered.length,
      routesRegistered,
    };

    const url = req.url || "";
    const acceptHeader = req.headers?.accept || "";
    const wantsJson = url.includes("format=json") || (acceptHeader.includes("application/json") && !acceptHeader.includes("text/html"));

    if (wantsJson) {
      res.setHeader("Content-Type", "application/json");
      return res.status(200).json(debugData);
    }

    // HTML Output with mobile-optimized Copy button
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    const jsonPretty = JSON.stringify(debugData, null, 2);

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AfriGombo Elite - Diagnostic Serveur</title>
  <style>
    :root {
      --bg: #09090b;
      --card: #141417;
      --border: #27272a;
      --text: #f4f4f5;
      --muted: #a1a1aa;
      --gold: #D4AF37;
      --green: #10b981;
      --red: #f43f5e;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; }
    body {
      background: var(--bg);
      color: var(--text);
      padding: 16px;
      display: flex;
      justify-content: center;
      min-height: 100vh;
    }
    .container {
      width: 100%;
      max-width: 680px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .header {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .title {
      font-size: 16px;
      font-weight: 800;
      color: var(--gold);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      font-family: monospace;
      border: 1px solid transparent;
    }
    .badge-success {
      background: rgba(16, 185, 129, 0.12);
      color: #34d399;
      border-color: rgba(16, 185, 129, 0.3);
    }
    .badge-warning {
      background: rgba(245, 158, 11, 0.12);
      color: #fbbf24;
      border-color: rgba(245, 158, 11, 0.3);
    }
    .actions {
      display: flex;
      gap: 10px;
    }
    .btn-copy {
      flex: 1;
      background: var(--gold);
      color: #000;
      border: none;
      padding: 14px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 4px 14px rgba(212, 175, 55, 0.25);
    }
    .btn-copy:active {
      transform: scale(0.98);
    }
    .btn-json {
      background: #27272a;
      color: #f4f4f5;
      text-decoration: none;
      padding: 14px 18px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 700;
      font-family: monospace;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .json-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .json-header {
      padding: 10px 16px;
      background: rgba(255,255,255,0.03);
      border-bottom: 1px solid var(--border);
      font-size: 11px;
      font-weight: 700;
      color: var(--muted);
      font-family: monospace;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    pre {
      padding: 16px;
      font-family: "SFMono-Regular", Consolas, Menlo, monospace;
      font-size: 12px;
      line-height: 1.5;
      color: #38bdf8;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }
    #toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: #10b981;
      color: #000;
      padding: 12px 24px;
      border-radius: 9999px;
      font-weight: 800;
      font-size: 13px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      transition: transform 0.25s ease-out;
      pointer-events: none;
      z-index: 100;
    }
    #toast.show {
      transform: translateX(-50%) translateY(0);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">⚡ AfriGombo Serverless Diagnostic</div>
      <div class="badges">
        <span class="badge ${supabaseConfigured ? 'badge-success' : 'badge-warning'}">
          ● Supabase Storage: ${supabaseConfigured ? 'ACTIF (Clé OK)' : 'NON CONFIGURÉ'}
        </span>
        <span class="badge ${firebaseAdminConfigured ? 'badge-success' : 'badge-warning'}">
          ● Firebase Admin: ${firebaseAdminConfigured ? 'INITIALISÉ' : 'MODE REST ACTIF'}
        </span>
        <span class="badge badge-success">
          ● Auth REST Fallback: PRÊT
        </span>
      </div>
      <div class="actions">
        <button id="copyBtn" class="btn-copy" onclick="copyDiagnostic()">
          📋 Copier le statut
        </button>
        <a href="/api/debug-status?format=json" class="btn-json">JSON BRUT</a>
      </div>
    </div>

    <div class="json-card">
      <div class="json-header">
        <span>DONNÉES BRUTES DE DIAGNOSTIC (${routesRegistered.length} ROUTES)</span>
        <span id="copyHint">Prêt à copier</span>
      </div>
      <pre id="jsonContent">${jsonPretty}</pre>
    </div>
  </div>

  <div id="toast">✅ Statut copié dans le presse-papiers !</div>

  <script>
    function copyDiagnostic() {
      const text = document.getElementById('jsonContent').innerText;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(onCopied).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }
    }

    function fallbackCopy() {
      const text = document.getElementById('jsonContent').innerText;
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        onCopied();
      } catch (e) {
        alert('Veuillez copier manuellement le texte.');
      }
      document.body.removeChild(textarea);
    }

    function onCopied() {
      const toast = document.getElementById('toast');
      const copyBtn = document.getElementById('copyBtn');
      const copyHint = document.getElementById('copyHint');
      
      copyBtn.innerText = '✅ COPIÉ !';
      copyHint.innerText = 'Copié !';
      toast.classList.add('show');
      
      setTimeout(() => {
        copyBtn.innerHTML = '📋 Copier le statut';
        copyHint.innerText = 'Prêt à copier';
        toast.classList.remove('show');
      }, 2500);
    }
  </script>
</body>
</html>`;

    return res.status(200).send(html);
  } catch (err: any) {
    res.setHeader("Content-Type", "application/json");
    return res.status(500).json({
      status: "error",
      error: err?.message || "Erreur interne lors de la vérification du statut."
    });
  }
}
