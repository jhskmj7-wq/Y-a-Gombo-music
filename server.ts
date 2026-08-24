import express from "express";
import path from "path";
import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import * as admin from "firebase-admin";
import { initializeApp as initializeAdminApp, getApps as getAdminApps, cert } from "firebase-admin/app";
import { getFirestore as getAdminFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth as getAdminAuth } from "firebase-admin/auth";

dotenv.config();

// Safe Lazy Initializers for Server Operations
let adminInitialized = false;
let firebaseAdminError: string | null = null;
function initAdmin() {
  if (!adminInitialized) {
    try {
      if (getAdminApps().length === 0) {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_ADMIN_SDK_KEY;
        
        if (serviceAccountKey) {
          let serviceAccountObj;
          try {
            serviceAccountObj = JSON.parse(serviceAccountKey);
          } catch (parseErr: any) {
            firebaseAdminError = `JSON.parse error: ${parseErr?.message || parseErr}`;
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:", parseErr);
            throw parseErr;
          }

          try {
            if (serviceAccountObj) {
              initializeAdminApp({
                credential: cert(serviceAccountObj),
                projectId: serviceAccountObj.project_id || process.env.VITE_FIREBASE_PROJECT_ID || "afrigombo",
              });
              console.log("Firebase Admin initialized successfully with Service Account credentials.");
            } else {
              initializeAdminApp({
                projectId: process.env.VITE_FIREBASE_PROJECT_ID || "afrigombo",
              });
              console.log("Firebase Admin initialized with default project ID.");
            }
          } catch (initErr: any) {
            firebaseAdminError = `initializeAdminApp error: ${initErr?.message || initErr}`;
            console.error("Failed to initialize Firebase Admin app:", initErr);
            throw initErr;
          }
        } else {
          // Fallback initialization
          try {
            initializeAdminApp({
              projectId: process.env.VITE_FIREBASE_PROJECT_ID || "afrigombo",
            });
            console.log("Firebase Admin initialized with project ID (no service account JSON provided).");
          } catch (fallbackErr: any) {
            firebaseAdminError = `Fallback initializeAdminApp error: ${fallbackErr?.message || fallbackErr}`;
            throw fallbackErr;
          }
        }
      }
      adminInitialized = true;
      firebaseAdminError = null;
    } catch (e: any) {
      if (!firebaseAdminError) {
        firebaseAdminError = e?.message || String(e);
      }
      console.warn("Firebase Admin initialization deferred/failed:", e);
    }
  } else {
    if (getAdminApps().length > 0) {
      firebaseAdminError = null;
    }
  }
}

function getAdminDb() {
  initAdmin();
  try {
    return getAdminFirestore();
  } catch (err) {
    console.warn("Firestore Admin unavailable:", err);
    return null;
  }
}

function getAdminAuthClient() {
  initAdmin();
  try {
    return getAdminAuth();
  } catch (err) {
    console.warn("Auth Admin unavailable:", err);
    return null;
  }
}

const PROTECTED_FOUNDER_EMAILS = ["jhs.kmj7@gmail.com"];
const RESET_PHRASE = "RESET AFRIGOMBO TEST";

const COLLECTIONS_TO_RESET = [
  "gombos",
  "applications",
  "renforts",
  "renfort_applications",
  "social_posts",
  "contract_reviews",
  "security_alerts",
  "contracts",
  "conversations",
  "messages",
  "bypass_attempts",
  "notifications",
  "subscriptions",
  "payments",
  "support_messages",
  "tickets_support",
  "disputes",
  "litiges",
  "kyc_requests",
  "studio_market_reviews",
  "casting_calls",
  "casting_applications",
  "voice_announcements",
  "music_groups",
  "user_reports",
  "group_invitations",
  "group_members",
  "certificates",
  "user_activities",
  "academy_guides",
  "ticket_events",
  "studio_market",
  "purchased_tickets",
  "certification_requests",
  "verification_requests",
  "boosts",
  "waiting_features",
  "reservations",
  "beta_feedback",
  "bug_reports",
  "recommendations",
  "admin_logs",
  "secure_waitlist",
  "afrigombo_supports",
  "beta_updates",
  "suspensions",
  "transactions",
  "commissions",
  "escrow",
  "withdrawals",
  "walletTransactions",
  "walletRefunds",
  "walletAdjustments",
  "admin_audit_logs",
  "adminActions",
  "founder_analytics",
  "security_incidents"
];

let aiInstance: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- WALLET SECURITY BACKEND ENGINE ---

function hashPin(pin: string, salt: string, uid: string): string {
  const secretPayload = `AFRIGOMBO_PIN_SALT_v2:${uid}:${salt}:${pin}`;
  return crypto.createHash('sha256').update(secretPayload).digest('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

app.post("/api/wallet/set-pin", async (req, res) => {
  const { idToken, pin, pinLength } = req.body;
  if (!idToken || !pin) return res.status(400).json({ error: "Paramètres manquants." });

  try {
    const adminAuth = getAdminAuthClient();
    const adminDb = getAdminDb();
    if (!adminAuth || !adminDb) {
      return res.status(503).json({ error: "Service Firebase temporairement indisponible." });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const salt = generateSalt();
    const pinHash = hashPin(pin, salt, uid);
    const now = new Date().toISOString();
    const resolvedLength = typeof pinLength === "number" ? pinLength : pin.length;

    await adminDb.collection("users").doc(uid).set({
      walletSecurity: {
        pinConfigured: true,
        pinHash,
        pinSalt: salt,
        pinLength: resolvedLength,
        pinCreatedAt: now,
        pinUpdatedAt: now,
        failedPinAttempts: 0,
        lockedUntil: null,
        lastFailedAttemptAt: null,
        pinResetRequested: false,
        pinStatus: "CONFIGURED"
      },
      paymentSettings: {
        pinEnabled: true,
        pinConfigured: true
      }
    }, { merge: true });

    await adminDb.collection("admin_audit_logs").add({
      uid,
      type: "MODIFICATION_PIN",
      result: "SUCCESS",
      details: "Création initiale du PIN Wallet (Backend)",
      timestamp: FieldValue.serverTimestamp()
    });

    res.json({ success: true });
  } catch (err: any) {
    console.warn("set-pin backend notice:", err?.message || err);
    res.status(err?.code === 7 || err?.message?.includes("PERMISSION_DENIED") ? 503 : 500).json({ error: err.message || "Erreur de création du PIN." });
  }
});

app.post("/api/wallet/verify-pin", async (req, res) => {
  const { idToken, pin, action = "SENSITIVE_OP" } = req.body;
  if (!idToken || !pin) return res.status(400).json({ error: "Paramètres manquants." });

  try {
    const adminAuth = getAdminAuthClient();
    const adminDb = getAdminDb();
    if (!adminAuth || !adminDb) {
      return res.status(503).json({ error: "Service Firebase temporairement indisponible." });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: "Utilisateur introuvable." });

    const data = userDoc.data();
    const sec = data?.walletSecurity || {};

    if (!sec.pinHash || !sec.pinSalt) {
      return res.status(400).json({ result: "PIN_NOT_CONFIGURED", error: "Aucun code PIN configuré." });
    }

    if (sec.pinResetRequested) {
      return res.status(403).json({ result: "PIN_RESET_PENDING", error: "Une réinitialisation du PIN est en attente." });
    }

    // Check lock
    if (sec.lockedUntil) {
      const lockTime = new Date(sec.lockedUntil).getTime();
      const now = Date.now();
      if (lockTime > now) {
        const minsLeft = Math.ceil((lockTime - now) / 60000);
        return res.status(403).json({
          result: "PIN_LOCKED",
          error: `Wallet verrouillé. Réessayez dans ${minsLeft} minute(s).`,
          lockedMinutesRemaining: minsLeft
        });
      }
    }

    const computedHash = hashPin(pin, sec.pinSalt, uid);
    if (computedHash === sec.pinHash) {
      // SUCCESS: Auto-repair pinLength if missing or mismatched
      try {
        const updatePayload: Record<string, any> = {
          "walletSecurity.failedPinAttempts": 0,
          "walletSecurity.lockedUntil": null,
          "walletSecurity.lastAuthSensitiveAt": new Date().toISOString()
        };
        if (typeof sec.pinLength !== "number" || sec.pinLength !== pin.length) {
          updatePayload["walletSecurity.pinLength"] = pin.length;
        }
        await adminDb.collection("users").doc(uid).update(updatePayload);
      } catch (dbErr) {
        console.warn("verify-pin: failed to update user walletSecurity on success:", dbErr);
      }

      // Create a secure session token
      const sessionToken = `wsess_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
      try {
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        await adminDb.collection("wallet_sessions").doc(uid).set({
          token: sessionToken,
          uid,
          action,
          expiresAt: expiresAt.toISOString(),
          createdAt: new Date().toISOString()
        });
      } catch (sessionErr) {
        console.warn("verify-pin: failed to write wallet_session:", sessionErr);
      }

      return res.json({ success: true, sessionToken });
    }

    // FAILED
    const currentAttempts = (sec.failedPinAttempts || 0) + 1;
    let lockedUntil: string | null = null;
    let lockMins = 0;

    if (currentAttempts >= 5) {
      lockMins = 60;
      lockedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    } else if (currentAttempts >= 3) {
      lockMins = 15;
      lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    }

    try {
      await adminDb.collection("users").doc(uid).update({
        "walletSecurity.failedPinAttempts": currentAttempts,
        "walletSecurity.lastFailedAttemptAt": new Date().toISOString(),
        "walletSecurity.lockedUntil": lockedUntil
      });
    } catch (dbErr) {
      console.warn("verify-pin: failed to update failedPinAttempts:", dbErr);
    }

    const remaining = 5 - currentAttempts;

    return res.status(401).json({
      result: lockedUntil ? "PIN_LOCKED" : "PIN_INVALID",
      error: lockedUntil ? `Trop d'échecs. Wallet verrouillé pour ${lockMins} mins.` : "Code PIN incorrect.",
      attemptsRemaining: remaining > 0 ? remaining : 0,
      lockedMinutesRemaining: lockMins
    });

  } catch (err: any) {
    console.warn("verify-pin backend notice:", err?.message || err);
    res.status(err?.code === 7 || err?.message?.includes("PERMISSION_DENIED") ? 503 : 500).json({ error: "Erreur serveur de sécurité." });
  }
});

app.post("/api/wallet/change-pin", async (req, res) => {
  const { idToken, currentPin, newPin, pinLength } = req.body;
  if (!idToken || !currentPin || !newPin) return res.status(400).json({ error: "Paramètres manquants." });

  try {
    const adminAuth = getAdminAuthClient();
    const adminDb = getAdminDb();
    if (!adminAuth || !adminDb) {
      return res.status(503).json({ error: "Service Firebase temporairement indisponible." });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: "Utilisateur introuvable." });

    const data = userDoc.data();
    const sec = data?.walletSecurity || {};

    if (!sec.pinHash || !sec.pinSalt) {
      return res.status(400).json({ error: "Aucun PIN configuré." });
    }

    const computedCurrent = hashPin(currentPin, sec.pinSalt, uid);
    if (computedCurrent !== sec.pinHash) {
      return res.status(401).json({ error: "L'ancien code PIN est incorrect." });
    }

    const newSalt = generateSalt();
    const newPinHash = hashPin(newPin, newSalt, uid);
    const now = new Date().toISOString();
    const resolvedLength = typeof pinLength === "number" ? pinLength : newPin.length;

    await adminDb.collection("users").doc(uid).update({
      "walletSecurity.pinConfigured": true,
      "walletSecurity.pinHash": newPinHash,
      "walletSecurity.pinSalt": newSalt,
      "walletSecurity.pinLength": resolvedLength,
      "walletSecurity.pinUpdatedAt": now,
      "walletSecurity.failedPinAttempts": 0,
      "walletSecurity.lockedUntil": null,
      "walletSecurity.pinResetRequested": false,
      "walletSecurity.pinStatus": "CONFIGURED",
      "paymentSettings.pinEnabled": true
    });

    await adminDb.collection("admin_audit_logs").add({
      uid,
      type: "MODIFICATION_PIN",
      result: "SUCCESS",
      details: "Modification sécurisée du PIN Wallet (Backend)",
      timestamp: FieldValue.serverTimestamp()
    });

    res.json({ success: true });
  } catch (err: any) {
    console.warn("change-pin backend notice:", err?.message || err);
    res.status(err?.code === 7 || err?.message?.includes("PERMISSION_DENIED") ? 503 : 500).json({ error: err.message || "Erreur lors du changement de PIN." });
  }
});

app.post("/api/wallet/disable-pin", async (req, res) => {
  const { idToken, currentPin } = req.body;
  if (!idToken || !currentPin) return res.status(400).json({ error: "Paramètres manquants." });

  try {
    const adminAuth = getAdminAuthClient();
    const adminDb = getAdminDb();
    if (!adminAuth || !adminDb) {
      return res.status(503).json({ error: "Service Firebase temporairement indisponible." });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: "Utilisateur introuvable." });

    const data = userDoc.data();
    const sec = data?.walletSecurity || {};

    if (!sec.pinHash || !sec.pinSalt) {
      return res.status(400).json({ error: "Aucun PIN configuré." });
    }

    const computedCurrent = hashPin(currentPin, sec.pinSalt, uid);
    if (computedCurrent !== sec.pinHash) {
      return res.status(401).json({ error: "Le code PIN actuel est incorrect." });
    }

    await adminDb.collection("users").doc(uid).update({
      "walletSecurity.pinConfigured": false,
      "walletSecurity.pinStatus": "NOT_CONFIGURED",
      "walletSecurity.pinHash": null,
      "walletSecurity.pinSalt": null,
      "walletSecurity.failedPinAttempts": 0,
      "walletSecurity.lockedUntil": null,
      "paymentSettings.pinEnabled": false
    });

    await adminDb.collection("admin_audit_logs").add({
      uid,
      type: "DESACTIVATION_PIN",
      result: "SUCCESS",
      details: "Désactivation du PIN Wallet (Backend)",
      timestamp: FieldValue.serverTimestamp()
    });

    res.json({ success: true });
  } catch (err: any) {
    console.warn("disable-pin backend notice:", err?.message || err);
    res.status(err?.code === 7 || err?.message?.includes("PERMISSION_DENIED") ? 503 : 500).json({ error: err.message || "Erreur lors de la désactivation du PIN." });
  }
});

app.post("/api/wallet/request-reset", async (req, res) => {
  const { idToken, reason = "Demande utilisateur" } = req.body;
  if (!idToken) return res.status(401).json({ error: "Authentification requise." });

  try {
    const adminAuth = getAdminAuthClient();
    const adminDb = getAdminDb();
    if (!adminAuth || !adminDb) {
      return res.status(503).json({ error: "Service Firebase temporairement indisponible." });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const now = new Date().toISOString();

    await adminDb.collection("users").doc(uid).update({
      "walletSecurity.pinResetRequested": true,
      "walletSecurity.saoAssistancePending": true,
      "walletSecurity.pinStatus": "RESET_PENDING"
    });

    await adminDb.collection("support_tickets").add({
      userId: uid,
      userEmail: decodedToken.email || "",
      subject: "🆘 Demande de Réinitialisation PIN Wallet (S-O-A)",
      description: `L'utilisateur a demandé l'assistance du Support Officiel AFRIGOMBO (S-O-A) pour réinitialiser son code PIN Wallet. Raison: ${reason}`,
      status: "open",
      category: "SECURITY",
      type: "SECURITY_ASSISTANCE",
      createdAt: now,
      updatedAt: now
    });

    res.json({ success: true, message: "Demande de réinitialisation transmise au Support Officiel AFRIGOMBO (S-O-A)." });
  } catch (err: any) {
    console.error("request-reset error:", err);
    res.status(500).json({ error: err.message || "Erreur lors de la transmission." });
  }
});

  // API health-check for network latency diagnostic pings
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // Diagnostic route for serverless / deployment environment status
  const handleDebugStatus = (req: express.Request, res: express.Response) => {
    try {
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
      const supabaseConfigured = Boolean(supabaseKey && supabaseKey.trim() !== "");

      let firebaseAdminConfigured = false;
      let firebaseAdminErrorVal: string | null = null;
      try {
        initAdmin();
        const adminAuth = getAdminAuthClient();
        const adminDb = getAdminDb();
        firebaseAdminConfigured = Boolean(adminAuth && adminDb && getAdminApps().length > 0);
        firebaseAdminErrorVal = firebaseAdminError;
      } catch (err: any) {
        firebaseAdminConfigured = false;
        firebaseAdminErrorVal = firebaseAdminError || err?.message || String(err);
      }

      const routesRegistered: string[] = [];
      if ((app as any)._router && (app as any)._router.stack) {
        (app as any)._router.stack.forEach((layer: any) => {
          if (layer.route && layer.route.path) {
            const methods = Object.keys(layer.route.methods || {}).map((m) => m.toUpperCase()).join(",");
            const routePath = layer.route.path;
            if (typeof routePath === "string") {
              routesRegistered.push(methods ? `${methods} ${routePath}` : routePath);
            }
          }
        });
      }

      res.json({
        status: "ok",
        supabaseConfigured,
        firebaseAdminConfigured,
        firebaseAdminError: firebaseAdminErrorVal,
        routesRegistered: Array.from(new Set(routesRegistered))
      });
    } catch (err: any) {
      res.status(500).json({
        status: "error",
        error: err?.message || "Erreur lors de la génération du statut de diagnostic."
      });
    }
  };

  app.get("/api/debug-status", handleDebugStatus);
  app.get("/debug-status", handleDebugStatus);

  // API to analyze image for contact info
  app.post("/api/analyze-image", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) return res.status(400).json({ error: "No image provided" });

      const ai = getAI();
      if (!ai) {
        console.warn("⚠️ GEMINI_API_KEY environment variable is missing. Gracefully bypassing image analysis.");
        return res.json({ status: "safe", warning: "AI Moderation bypassed (no API key)" });
      }

      const prompt = "Analyse cette image. Détecte s'il y a des coordonnées de contact : numéros de téléphone, adresses e-mail, QR codes, logos de réseaux sociaux (WhatsApp, Telegram, etc.), ou liens internet. Réponds uniquement par 'BLOCKED' si tu en trouves, sinon réponds 'SAFE'.";

      const base64Data = imageBase64.split(",")[1] || imageBase64;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: "image/jpeg"
              }
            }
          ]
        }
      });

      const text = response.text || "";
      res.json({ status: text.includes("BLOCKED") ? "blocked" : "safe" });
    } catch (error) {
      console.warn("⚠️ Gemini analysis gracefully bypassed (quota limit, server issue or other error):", error);
      // Return 200 with fallback to stay extremely resilient and allow normal user actions
      res.json({ status: "safe", warning: "AI Moderation bypassed due to temporary API rate-limiting or service error" });
    }
  });

// SECURE SUPABASE STORAGE ADMIN PROXY - SUPER FOUNDER EXCLUSIVE
  app.post("/api/admin/media/upload", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    console.log("[DIAG-1] Réception requête - Clés reçues dans req.body:", Object.keys(req.body || {}));
    const { idToken, storagePath, fileBase64, fileData, fichierBase64, contentType, bucket = "afrigombo-media" } = req.body || {};
    const rawFile = fileBase64 || fileData || fichierBase64;

    if (!idToken) {
      const errResp = { success: false, error: "Non authentifié (token manquant). L'accès anonyme est strictement interdit." };
      console.log("[DIAG-6] Réponse HTTP finale - Status: 401 - Body:", JSON.stringify(errResp));
      return res.status(401).json(errResp);
    }

    if (!storagePath || !rawFile) {
      const errResp = { success: false, error: "Paramètres 'storagePath' et 'fileBase64' requis." };
      console.log("[DIAG-6] Réponse HTTP finale - Status: 400 - Body:", JSON.stringify(errResp));
      return res.status(400).json(errResp);
    }

    try {
      const adminAuth = getAdminAuthClient();
      const adminDb = getAdminDb();
      if (!adminAuth || !adminDb) {
        const errResp = { success: false, error: "Service Firebase Admin temporairement indisponible." };
        console.log("[DIAG-6] Réponse HTTP finale - Status: 503 - Body:", JSON.stringify(errResp));
        return res.status(503).json(errResp);
      }

      // 1. Vérification sécurisée du jeton d'authentification Firebase (ID Token)
      let decodedToken;
      try {
        decodedToken = await adminAuth.verifyIdToken(idToken);
        console.log("[DIAG-2] Vérification idToken: SUCCÈS - uid:", decodedToken.uid);
      } catch (authErr: any) {
        console.error("[DIAG-2] Vérification idToken: ÉCHEC - message:", authErr?.message || authErr);
        const errResp = { success: false, error: "Session invalide ou expirée. Veuillez vous reconnecter." };
        console.log("[DIAG-6] Réponse HTTP finale - Status: 401 - Body:", JSON.stringify(errResp));
        return res.status(401).json(errResp);
      }

      const uid = decodedToken.uid;
      let userData: any = null;
      try {
        const userDoc = await adminDb.collection("users").doc(uid).get();
        userData = userDoc.exists ? userDoc.data() : null;
        console.log("[DIAG-3] Lecture Firestore: SUCCÈS - document exists:", Boolean(userDoc.exists));
      } catch (firestoreErr: any) {
        console.warn("[DIAG-3] Lecture Firestore: ÉCHEC - message:", firestoreErr?.message || String(firestoreErr));
      }

      // 2. Contrôle de sécurité : Tout utilisateur Firebase authentifié (idToken valide) est autorisé à téléverser vers les chemins médias autorisés
      const isAllowedMedia =
        !storagePath.includes("..") && (
          storagePath.startsWith("video/") ||
          storagePath.startsWith("videos/") ||
          storagePath.startsWith("reels/") ||
          storagePath.startsWith("reel/") ||
          storagePath.startsWith("audio/") ||
          storagePath.startsWith("audios/") ||
          storagePath.startsWith("images/") ||
          storagePath.startsWith("image/") ||
          storagePath.startsWith("media/") ||
          storagePath.startsWith("avatars/") ||
          storagePath.startsWith("banners/") ||
          storagePath.startsWith("proofs/") ||
          storagePath.startsWith("documents/") ||
          storagePath.startsWith("users/")
        );

      if (!isAllowedMedia) {
        const errResp = {
          success: false,
          error: "Accès refusé. Chemin de stockage non autorisé pour le téléversement."
        };
        console.log("[DIAG-6] Réponse HTTP finale - Status: 403 - Body:", JSON.stringify(errResp));
        return res.status(403).json(errResp);
      }

      // 3. Conversion du fichier Base64 en Buffer
      const base64Clean = rawFile.includes(",") ? rawFile.split(",")[1] : rawFile;
      const fileBuffer = Buffer.from(base64Clean, "base64");

      // 4. Client Supabase côté serveur (nécessite obligatoirement la clé de service)
      const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://qefnkgtstcisplbrjcxy.supabase.co";
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseKey) {
        console.error("[SERVER MEDIA UPLOAD ERROR] SUPABASE_SERVICE_ROLE_KEY manquante dans l'environnement serveur.");
        const errResp = {
          success: false,
          error: "Configuration serveur incomplète : SUPABASE_SERVICE_ROLE_KEY non configurée pour les uploads sécurisés."
        };
        console.log("[DIAG-6] Réponse HTTP finale - Status: 503 - Body:", JSON.stringify(errResp));
        return res.status(503).json(errResp);
      }

      const { createClient } = await import("@supabase/supabase-js");
      const serverSupabase = createClient(supabaseUrl, supabaseKey);

      console.log("[DIAG-4] Avant Supabase upload - storagePath:", storagePath, "- bucket:", bucket, "- bufferSize (bytes):", fileBuffer.length);

      const { data: uploadData, error: uploadError } = await serverSupabase.storage
        .from(bucket)
        .upload(storagePath, fileBuffer, {
          contentType: contentType || "application/octet-stream",
          upsert: true,
        });

      if (uploadError) {
        console.error("[DIAG-5] Supabase upload: ÉCHEC - uploadError complet:", JSON.stringify(uploadError, null, 2));
        const errResp = { success: false, error: uploadError.message || "Échec du téléversement Storage." };
        console.log("[DIAG-6] Réponse HTTP finale - Status: 500 - Body:", JSON.stringify(errResp));
        return res.status(500).json(errResp);
      }

      console.log("[DIAG-5] Supabase upload: SUCCÈS - uploadData:", JSON.stringify(uploadData, null, 2));

      const { data: publicUrlData } = serverSupabase.storage.from(bucket).getPublicUrl(storagePath);
      const publicUrl = publicUrlData?.publicUrl || `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;

      console.log(`[SERVER MEDIA UPLOAD SUCCESS] Téléversé par ${decodedToken.email || decodedToken.uid} -> ${publicUrl}`);

      const successResp = {
        success: true,
        url: publicUrl,
        publicUrl: publicUrl,
        path: uploadData?.path || storagePath,
        storagePath: uploadData?.path || storagePath,
        bucket,
        message: "Média téléversé avec succès"
      };
      console.log("[DIAG-6] Réponse HTTP finale - Status: 200 - Body:", JSON.stringify(successResp));
      return res.json(successResp);
    } catch (err: any) {
      console.error("[SERVER MEDIA UPLOAD FATAL ERROR]", err);
      const errResp = { success: false, error: err.message || "Erreur interne lors du téléversement." };
      console.log("[DIAG-6] Réponse HTTP finale - Status: 500 - Body:", JSON.stringify(errResp));
      return res.status(500).json(errResp);
    }
  });

  // USER AVATAR UPLOAD ROUTE (Supabase Storage afrigombo-media)
  app.post("/api/user/avatar/upload", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const { idToken, storagePath, fileBase64, contentType, bucket = "afrigombo-media" } = req.body || {};

    if (!idToken) {
      return res.status(401).json({ success: false, error: "Non authentifié (token manquant)." });
    }

    if (!storagePath || !fileBase64) {
      return res.status(400).json({ success: false, error: "Paramètres 'storagePath' et 'fileBase64' requis." });
    }

    try {
      const adminAuth = getAdminAuthClient();
      if (!adminAuth) {
        return res.status(503).json({ success: false, error: "Service Firebase Admin indisponible." });
      }

      let decodedToken;
      try {
        decodedToken = await adminAuth.verifyIdToken(idToken);
      } catch (authErr: any) {
        return res.status(401).json({ success: false, error: "Session invalide ou expirée." });
      }

      const uid = decodedToken.uid;

      if (!storagePath.includes(uid) || !storagePath.toLowerCase().includes("avatar")) {
        return res.status(403).json({ success: false, error: "Accès refusé. Chemin de stockage non autorisé pour cet utilisateur." });
      }

      const base64Clean = fileBase64.includes(",") ? fileBase64.split(",")[1] : fileBase64;
      const fileBuffer = Buffer.from(base64Clean, "base64");

      const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://qefnkgtstcisplbrjcxy.supabase.co";
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseKey) {
        console.error("[USER AVATAR UPLOAD ERROR] SUPABASE_SERVICE_ROLE_KEY manquante dans l'environnement serveur.");
        return res.status(503).json({
          success: false,
          error: "Configuration serveur incomplète : SUPABASE_SERVICE_ROLE_KEY non configurée pour les uploads sécurisés."
        });
      }

      const { createClient } = await import("@supabase/supabase-js");
      const serverSupabase = createClient(supabaseUrl, supabaseKey);

      const { data: uploadData, error: uploadError } = await serverSupabase.storage
        .from(bucket)
        .upload(storagePath, fileBuffer, {
          contentType: contentType || "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        console.error("[USER AVATAR UPLOAD ERROR]", uploadError);
        return res.status(500).json({ success: false, error: uploadError.message || "Échec du téléversement de l'avatar." });
      }

      const { data: publicUrlData } = serverSupabase.storage.from(bucket).getPublicUrl(storagePath);
      const publicUrl = publicUrlData?.publicUrl || `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;

      console.log(`[USER AVATAR UPLOAD SUCCESS] Utilisateur ${uid} -> ${publicUrl}`);

      return res.json({
        success: true,
        url: publicUrl,
        publicUrl: publicUrl,
        path: uploadData?.path || storagePath,
        bucket,
        message: "Avatar téléversé avec succès"
      });
    } catch (err: any) {
      console.error("[USER AVATAR UPLOAD FATAL ERROR]", err);
      return res.status(500).json({ success: false, error: err.message || "Erreur interne lors du téléversement." });
    }
  });

  // USER COVER UPLOAD ROUTE (Supabase Storage afrigombo-media)
  app.post("/api/user/cover/upload", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const { idToken, storagePath, fileBase64, contentType, bucket = "afrigombo-media" } = req.body || {};

    if (!idToken) {
      return res.status(401).json({ success: false, error: "Non authentifié (token manquant)." });
    }

    if (!storagePath || !fileBase64) {
      return res.status(400).json({ success: false, error: "Paramètres 'storagePath' et 'fileBase64' requis." });
    }

    try {
      const adminAuth = getAdminAuthClient();
      if (!adminAuth) {
        return res.status(503).json({ success: false, error: "Service Firebase Admin indisponible." });
      }

      let decodedToken;
      try {
        decodedToken = await adminAuth.verifyIdToken(idToken);
      } catch (authErr: any) {
        return res.status(401).json({ success: false, error: "Session invalide ou expirée." });
      }

      const uid = decodedToken.uid;

      if (!storagePath.includes(uid) || (!storagePath.toLowerCase().includes("cover") && !storagePath.toLowerCase().includes("banniere"))) {
        return res.status(403).json({ success: false, error: "Accès refusé. Chemin de stockage non autorisé pour cet utilisateur." });
      }

      const base64Clean = fileBase64.includes(",") ? fileBase64.split(",")[1] : fileBase64;
      const fileBuffer = Buffer.from(base64Clean, "base64");

      const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://qefnkgtstcisplbrjcxy.supabase.co";
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseKey) {
        console.error("[USER COVER UPLOAD ERROR] SUPABASE_SERVICE_ROLE_KEY manquante dans l'environnement serveur.");
        return res.status(503).json({
          success: false,
          error: "Configuration serveur incomplète : SUPABASE_SERVICE_ROLE_KEY non configurée pour les uploads sécurisés."
        });
      }

      const { createClient } = await import("@supabase/supabase-js");
      const serverSupabase = createClient(supabaseUrl, supabaseKey);

      const { data: uploadData, error: uploadError } = await serverSupabase.storage
        .from(bucket)
        .upload(storagePath, fileBuffer, {
          contentType: contentType || "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        console.error("[USER COVER UPLOAD ERROR]", uploadError);
        return res.status(500).json({ success: false, error: uploadError.message || "Échec du téléversement de la bannière." });
      }

      const { data: publicUrlData } = serverSupabase.storage.from(bucket).getPublicUrl(storagePath);
      const publicUrl = publicUrlData?.publicUrl || `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;

      console.log(`[USER COVER UPLOAD SUCCESS] Utilisateur ${uid} -> ${publicUrl}`);

      return res.json({
        success: true,
        url: publicUrl,
        publicUrl: publicUrl,
        path: uploadData?.path || storagePath,
        bucket,
        message: "Bannière téléversée avec succès"
      });
    } catch (err: any) {
      console.error("[USER COVER UPLOAD FATAL ERROR]", err);
      return res.status(500).json({ success: false, error: err.message || "Erreur interne lors du téléversement de la bannière." });
    }
  });

  app.post("/api/admin/media/delete", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const { idToken, storagePath, bucket = "afrigombo-media" } = req.body || {};

    if (!idToken) {
      return res.status(401).json({ success: false, error: "Non authentifié (token manquant). L'accès anonyme est strictement interdit." });
    }

    if (!storagePath) {
      return res.status(400).json({ success: false, error: "Paramètre 'storagePath' requis." });
    }

    try {
      const adminAuth = getAdminAuthClient();
      const adminDb = getAdminDb();
      if (!adminAuth || !adminDb) {
        return res.status(503).json({ success: false, error: "Service Firebase Admin temporairement indisponible." });
      }

      // 1. Vérification sécurisée du jeton d'authentification Firebase (ID Token)
      let decodedToken;
      try {
        decodedToken = await adminAuth.verifyIdToken(idToken);
      } catch (authErr: any) {
        return res.status(401).json({ success: false, error: "Session invalide ou expirée." });
      }

      const uid = decodedToken.uid;
      const userDoc = await adminDb.collection("users").doc(uid).get();
      const userData = userDoc.exists ? userDoc.data() : null;

      // 2. Contrôle de rôle strict : Seul le Super Fondateur est autorisé
      const isSuperFounder =
        PROTECTED_FOUNDER_EMAILS.includes(decodedToken.email || "") ||
        userData?.isFounder === true ||
        userData?.superFounder === true ||
        userData?.role === "super_founder" ||
        userData?.role === "admin";

      if (!isSuperFounder) {
        return res.status(403).json({
          success: false,
          error: "Accès refusé. Seul le Super Fondateur de la plateforme est autorisé à supprimer du contenu du Centre Multimédia."
        });
      }

      const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://qefnkgtstcisplbrjcxy.supabase.co";
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseKey) {
        console.error("[SERVER MEDIA DELETE ERROR] SUPABASE_SERVICE_ROLE_KEY manquante dans l'environnement serveur.");
        return res.status(503).json({
          success: false,
          error: "Configuration serveur incomplète : SUPABASE_SERVICE_ROLE_KEY non configurée pour les opérations Storage."
        });
      }

      const { createClient } = await import("@supabase/supabase-js");
      const serverSupabase = createClient(supabaseUrl, supabaseKey);

      const cleanPath = storagePath.replace(
        /^(?:https?:\/\/[^/]+\/storage\/v1\/object\/public\/[^/]+\/)/,
        ""
      );

      const { error: deleteError } = await serverSupabase.storage
        .from(bucket)
        .remove([cleanPath]);

      if (deleteError) {
        console.error("[SERVER MEDIA DELETE ERROR]", deleteError);
        return res.status(500).json({ success: false, error: deleteError.message || "Échec de la suppression Storage." });
      }

      console.log(`[SERVER MEDIA DELETE SUCCESS] Supprimé par Super Fondateur ${decodedToken.email} -> ${cleanPath}`);

      return res.json({ success: true, message: "Média supprimé avec succès de Supabase Storage" });
    } catch (err: any) {
      console.error("[SERVER MEDIA DELETE FATAL ERROR]", err);
      return res.status(500).json({ success: false, error: err.message || "Erreur interne lors de la suppression." });
    }
  });

// SECURE RESET API - PHASE 1 BUSINESS DATA RESET
  app.post("/api/admin/reset-environment", async (req, res) => {
    const { idToken, confirmationPhrase, dryRun = false } = req.body;

    if (!idToken) return res.status(401).json({ error: "Authentification requise." });
    
    if (!dryRun && confirmationPhrase !== RESET_PHRASE) {
      return res.status(400).json({ error: "Phrase de confirmation incorrecte. Tapez 'RESET AFRIGOMBO TEST'." });
    }

    try {
      const adminAuth = getAdminAuthClient();
      const adminDb = getAdminDb();
      if (!adminAuth || !adminDb) {
        return res.status(503).json({ error: "Service Firebase Admin non initialisé." });
      }

      // 1. Verify token and roles
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      const userDoc = await adminDb.collection("users").doc(uid).get();
      
      if (!userDoc.exists) return res.status(403).json({ error: "Accès refusé. Profil utilisateur introuvable." });
      
      const userData = userDoc.data();
      const isSuperFounder = userData?.isFounder === true || userData?.superFounder === true || userData?.role === "admin" || PROTECTED_FOUNDER_EMAILS.includes(decodedToken.email || "");
      
      if (!isSuperFounder) return res.status(403).json({ error: "Seuls les Super Fondateurs ont l'autorisation de réinitialiser l'environnement." });

      console.log(`[RESET PHASE 1] ${dryRun ? 'AUDIT (DryRun)' : 'EXECUTION'} de remise à zéro initiée par ${decodedToken.email} (${uid})`);

      const report = {
        usersPreserved: 0,
        foundersProtected: 0,
        walletsReset: 0,
        transactionsDeleted: 0,
        messagesDeleted: 0,
        publicationsDeleted: 0,
        notificationsDeleted: 0,
        historiesDeleted: 0,
        lotsDeleted: 0,
        totalDocumentsDeleted: 0,
        totalDocumentsEstimated: 0,
        collectionsCleared: {} as Record<string, number>,
        errors: [] as string[],
        isDryRun: dryRun,
        timestamp: new Date().toISOString()
      };

      // 2. Audit/Reset User Profiles (Preserve Accounts, Reset Business Wallets)
      const usersSnap = await adminDb.collection("users").get();
      report.usersPreserved = usersSnap.size;

      let batch = adminDb.batch();
      let batchOpsCount = 0;

      for (const uDoc of usersSnap.docs) {
        const data = uDoc.data();
        const isProtected = PROTECTED_FOUNDER_EMAILS.includes(data.email) || data.isFounder === true || data.superFounder === true;

        if (isProtected) {
          report.foundersProtected++;
        }

        report.walletsReset++;

        if (!dryRun) {
          batch.update(uDoc.ref, {
            balance: 0,
            walletBalance: 0,
            gawaBalance: 0,
            totalRevenue: 0,
            revenus: 0,
            depenses: 0,
            gains: 0,
            transactionsCount: 0,
            wallet: {
              soldeDisponible: 0,
              soldeBloque: 0,
              soldeGawa: 0,
              revenusMois: 0,
              gainsMensuels: 0,
              economiesPremium: 0,
              revenus: 0,
              depenses: 0,
              niveauWallet: "Standard",
              devise: "FCFA"
            },
            reputationScore: 100,
            updatedAt: FieldValue.serverTimestamp()
          });
          batchOpsCount++;

          if (batchOpsCount >= 400) {
            await batch.commit();
            batch = adminDb.batch();
            batchOpsCount = 0;
          }
        }
      }
      if (!dryRun && batchOpsCount > 0) {
        await batch.commit();
      }

      // 3. Clear Target Business Collections
      const publicationCols = ["gombos", "social_posts", "posts", "casting_calls", "casting_applications", "renforts", "renfort_applications", "renfortApplications", "studio_market", "ticket_events"];
      const transactionCols = ["transactions", "betaTransactions", "walletTransactions", "walletRefunds", "walletAdjustments", "commissions", "escrow", "withdrawals", "payments"];
      const messageCols = ["conversations", "messages", "support_messages", "supportMessages", "supportLogs", "tickets_support", "afrigombo_supports"];
      const notificationCols = ["notifications", "user_notifications"];
      const historyCols = ["user_activities", "user_activity_logs", "admin_logs", "admin_audit_logs", "adminAuditLogs", "adminActions", "bypass_attempts", "bypassAttempts", "security_alerts", "security_incidents", "security_logs", "beta_feedback", "bug_reports", "bugReports", "user_reports", "reports"];
      const lotCols = ["wheels", "wheel_spins", "wheel_lots", "wheel_history", "wheelPriceHistory", "wheel_spins_extra", "wheelExtraSpins", "avatarPurchases", "avatarRewards", "avatarGifts"];

      for (const colName of COLLECTIONS_TO_RESET) {
        try {
          const colRef = adminDb.collection(colName);
          let deletedInCol = 0;

          while (true) {
            const snap = await colRef.limit(400).get();
            if (snap.empty) break;

            const count = snap.size;
            report.totalDocumentsEstimated += count;

            if (!dryRun) {
              const delBatch = adminDb.batch();
              snap.docs.forEach((docSnap) => {
                delBatch.delete(docSnap.ref);
              });
              await delBatch.commit();
              deletedInCol += count;
            } else {
              deletedInCol += count;
              break; // In dry run, sample count and move on
            }

            if (count < 400) break;
          }

          report.collectionsCleared[colName] = deletedInCol;
          report.totalDocumentsDeleted += deletedInCol;

          // Categorize counts for detailed reporting
          if (publicationCols.includes(colName)) report.publicationsDeleted += deletedInCol;
          else if (transactionCols.includes(colName)) report.transactionsDeleted += deletedInCol;
          else if (messageCols.includes(colName)) report.messagesDeleted += deletedInCol;
          else if (notificationCols.includes(colName)) report.notificationsDeleted += deletedInCol;
          else if (historyCols.includes(colName)) report.historiesDeleted += deletedInCol;
          else if (lotCols.includes(colName)) report.lotsDeleted += deletedInCol;

        } catch (colErr: any) {
          report.errors.push(`Erreur lors du nettoyage de ${colName}: ${colErr.message}`);
        }
      }

      // 4. Log the reset action into admin_audit_logs if live execution
      if (!dryRun) {
        try {
          await adminDb.collection("admin_audit_logs").add({
            action: "RESET_PHASE_1_BUSINESS_DATA",
            performedBy: decodedToken.email,
            performedByUid: uid,
            report,
            timestamp: FieldValue.serverTimestamp()
          });
        } catch (logErr) {
          console.warn("[RESET LOG WARNING]", logErr);
        }
      }

      res.json({ success: true, report });
    } catch (err: any) {
      console.error("[RESET-ERROR]", err);
      res.status(500).json({ success: false, error: "Erreur serveur lors de la réinitialisation.", details: err.message });
    }
  });

  // Guarantee JSON responses for all unhandled /api requests (never HTML)
  app.use("/api", (req: express.Request, res: express.Response) => {
    res.status(404).json({
      success: false,
      error: `Endpoint API non trouvé : ${req.method} ${req.path}`
    });
  });

  // Global error handler for /api requests
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith("/api/")) {
      console.error("🔥 Express API Middleware Error:", err);
      return res.status(err.status || 500).json({
        success: false,
        error: err.message || "Erreur interne du serveur API."
      });
    }
    next(err);
  });

async function startServer() {
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

  // Vite middleware for development (bypassed on Vercel)
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (vErr) {
      console.warn("⚠️ Vite dev server middleware initialization bypassed:", vErr);
    }
  } else if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    // Serve static assets with standard caching except index.html
    app.use(express.static(distPath, {
      setHeaders: (res, pathStr) => {
        if (pathStr.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));
    app.get('*all', (req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? "définie" : "non définie"}`);
    startMaintenanceBackgroundChecker();
  });
}

// Initialize server-side firebase

async function runMaintenanceCheck() {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) return;
    const maintenanceRef = adminDb.collection("settings").doc("maintenance");
    const snap = await maintenanceRef.get();
    if (!snap.exists) return;

    const data = snap.data();
    const isMaintenanceActive = data?.globalMode === true || data?.status === "maintenance";
    console.log(`[BACKEND MAINTENANCE CHECK] Current state read successfully. Active: ${isMaintenanceActive}`);
  } catch (error: any) {
    // Gracefully handle permission-denied errors from unauthenticated reads without raising noisy red exceptions
    const isPermissionDenied = error && (
      error.code === "permission-denied" || 
      (error.message && error.message.toLowerCase().includes("permission-denied")) ||
      (error.message && error.message.toLowerCase().includes("missing or insufficient permissions"))
    );

    if (isPermissionDenied) {
      console.log("[BACKEND MAINTENANCE CHECK] Quietly handled: Read permission is restricted or requires auth.");
    } else {
      console.error("❌ Error running background maintenance check:", error);
    }
  }
}

function startMaintenanceBackgroundChecker() {
  console.log("🚀 Starting background maintenance window checker (running every 10s)...");
  // Run once immediately on startup
  runMaintenanceCheck().catch(() => {});
  // Set interval to run every 10 seconds
  setInterval(() => {
    runMaintenanceCheck().catch(() => {});
  }, 10000);
}

// Only start standalone HTTP server in non-serverless environments (local dev / Docker / Cloud Run)
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME && process.env.NODE_ENV !== "test") {
  startServer().catch((err) => {
    console.error("❌ Fatal error starting Express server:", err);
  });
}

export { app };
export default app;
