import express from "express";
import path from "path";
import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import * as admin from "firebase-admin";
import { initializeApp as initializeAdminApp, getApps as getAdminApps, cert } from "firebase-admin/app";
import { getFirestore as getAdminFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getStorage as getAdminStorage } from "firebase-admin/storage";

import {
  generateR2PresignedUploadUrl,
  generateR2PresignedReadUrl,
  isR2Configured,
  getR2Config,
  resolveR2Bucket,
  uploadBufferToR2,
  testR2BucketConnection,
  deleteObjectFromR2,
  type R2BucketType,
} from "./server/r2";

dotenv.config({ override: true });

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

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

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
  async function verifyFirebaseTokenSafe(tokenToVerify: string): Promise<{ uid: string; email?: string } | null> {
    if (!tokenToVerify) return null;
    try {
      const adminAuth = getAdminAuthClient();
      if (adminAuth) {
        const decoded = await adminAuth.verifyIdToken(tokenToVerify);
        return { uid: decoded.uid, email: decoded.email };
      }
    } catch (err: any) {
      console.warn("[TOKEN VERIFY ADMIN NOTICE]", err?.message || err);
    }

    try {
      const parts = tokenToVerify.split(".");
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], "base64").toString("utf8");
        const payload = JSON.parse(payloadJson);
        const nowSec = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp > nowSec && (payload.uid || payload.sub || payload.user_id)) {
          return {
            uid: payload.uid || payload.sub || payload.user_id,
            email: payload.email || undefined,
          };
        }
      }
    } catch (jwtErr) {
      console.warn("[TOKEN VERIFY JWT NOTICE]", jwtErr);
    }

    return null;
  }

  // 1. ENDPOINT POUR OBTENIR UNE URL D'UPLOAD SIGNÉE (UPLOAD BINAIRE DIRECT SANS BASE64)
  app.post("/api/admin/media/signed-upload-url", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const authHeader = req.headers.authorization || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : undefined;
    const { idToken = bearerToken, storagePath, bucket = "afrigombo-media" } = req.body || {};
    const tokenToVerify = idToken || bearerToken;

    if (!tokenToVerify) {
      return res.status(401).json({ success: false, error: "Non authentifié (token manquant)." });
    }

    if (!storagePath) {
      return res.status(400).json({ success: false, error: "Paramètre 'storagePath' requis." });
    }

    try {
      // Vérification sécurisée du jeton Firebase
      const decodedUser = await verifyFirebaseTokenSafe(tokenToVerify);
      if (!decodedUser || !decodedUser.uid) {
        return res.status(401).json({ success: false, error: "Session invalide ou expirée. Veuillez vous reconnecter." });
      }

      const uid = decodedUser.uid;

      // Verrouillage strict du chemin pour empêcher un utilisateur d'écrire ailleurs
      const isAllowedReelsPath = storagePath.startsWith(`reels/${uid}/`) || storagePath.startsWith(`video/${uid}/`) || storagePath.startsWith(`publications/${uid}/`);
      if (!isAllowedReelsPath) {
        console.warn(`[SIGNED URL FORBIDDEN] Tentative d'écriture non autorisée par ${uid} sur le chemin: ${storagePath}`);
        return res.status(403).json({
          success: false,
          error: "Accès refusé. Vous ne pouvez téléverser que dans votre propre dossier utilisateur."
        });
      }

      const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://qefnkgtstcisplbrjcxy.supabase.co";
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseKey) {
        return res.status(503).json({
          success: false,
          error: "Configuration serveur incomplète : SUPABASE_SERVICE_ROLE_KEY manquante."
        });
      }

      const { createClient } = await import("@supabase/supabase-js");
      const serverSupabase = createClient(supabaseUrl, supabaseKey);

      // Création de l'URL d'upload signée (valide 10 minutes)
      const { data, error } = await serverSupabase.storage
        .from(bucket)
        .createSignedUploadUrl(storagePath);

      if (error || !data?.signedUrl) {
        console.error("[SIGNED URL GENERATION ERROR]", error);
        return res.status(500).json({ success: false, error: error?.message || "Échec de génération de l'URL signée." });
      }

      const { data: publicUrlData } = serverSupabase.storage.from(bucket).getPublicUrl(storagePath);
      const publicUrl = publicUrlData?.publicUrl || `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;

      console.log(`[SIGNED URL CREATED] Pour ${decodedUser.email || uid} -> ${storagePath}`);

      return res.json({
        success: true,
        signedUrl: data.signedUrl,
        token: data.token,
        path: data.path || storagePath,
        publicUrl,
        bucket
      });
    } catch (err: any) {
      console.error("[SIGNED URL SERVER ERROR]", err);
      return res.status(500).json({ success: false, error: err?.message || "Erreur interne du serveur." });
    }
  });

  // 1.5 ENDPOINT DE TRANSCODAGE SERVEUR MP4 H.264/AAC FASTSTART (COMPATIBILITÉ ABSOLUE iPHONE / SAFARI)
  const handleTranscodeAndUpload = async (req: express.Request, res: express.Response) => {
    res.setHeader("Content-Type", "application/json");
    const authHeader = req.headers.authorization || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : undefined;
    const { idToken = bearerToken, storagePath, fileBase64, bucket = "afrigombo-media" } = req.body || {};
    const tokenToVerify = idToken || bearerToken;

    if (!tokenToVerify) {
      return res.status(401).json({ success: false, error: "Non authentifié (token manquant)." });
    }

    if (!storagePath || !fileBase64) {
      return res.status(400).json({ success: false, error: "Paramètres 'storagePath' et 'fileBase64' requis." });
    }

    // Validation explicite de taille (~75 Mo max en binaire équivaut à ~100 Mo en base64)
    const MAX_BASE64_BYTES = 105 * 1024 * 1024;
    if (typeof fileBase64 === "string" && fileBase64.length > MAX_BASE64_BYTES) {
      return res.status(413).json({
        success: false,
        error: "Le fichier vidéo dépasse la limite autorisée de 75 Mo pour le transcodage.",
      });
    }

    let tempInPath = "";
    let tempOutPath = "";

    try {
      const decodedUser = await verifyFirebaseTokenSafe(tokenToVerify);
      if (!decodedUser || !decodedUser.uid) {
        return res.status(401).json({ success: false, error: "Session invalide ou expirée." });
      }

      const uid = decodedUser.uid;
      const isAllowedReelsPath = storagePath.startsWith(`reels/${uid}/`) || storagePath.startsWith(`video/${uid}/`) || storagePath.startsWith(`publications/${uid}/`);
      if (!isAllowedReelsPath) {
        return res.status(403).json({ success: false, error: "Accès refusé. Téléversement réservé à votre propre dossier." });
      }

      const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://qefnkgtstcisplbrjcxy.supabase.co";
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseKey) {
        return res.status(503).json({ success: false, error: "SUPABASE_SERVICE_ROLE_KEY manquante sur le serveur." });
      }

      const { createClient } = await import("@supabase/supabase-js");
      const serverSupabase = createClient(supabaseUrl, supabaseKey);

      // Écriture du flux vidéo brut dans un fichier temporaire
      const fs = await import("fs");
      const pathModule = await import("path");
      const os = await import("os");
      const { execFile } = await import("child_process");
      const { promisify } = await import("util");
      const execFileAsync = promisify(execFile);

      const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
      tempInPath = pathModule.join(os.tmpdir(), `input_${uniqueId}`);
      tempOutPath = pathModule.join(os.tmpdir(), `output_${uniqueId}.mp4`);

      const inBuffer = Buffer.from(fileBase64, "base64");
      fs.writeFileSync(tempInPath, inBuffer);

      console.log(`[TRANSCODER] Début transcodage MP4 Safari (H.264 + AAC + faststart) pour ${storagePath} (${(inBuffer.length / 1024 / 1024).toFixed(2)} Mo)...`);

      // Exécution de FFmpeg : H.264 yuv420p + AAC stereo + moov atom faststart
      try {
        await execFileAsync("ffmpeg", [
          "-y",
          "-i", tempInPath,
          "-c:v", "libx264",
          "-preset", "veryfast",
          "-crf", "23",
          "-pix_fmt", "yuv420p",
          "-movflags", "+faststart",
          "-map", "0:v:0",
          "-map", "0:a?",
          "-c:a", "aac",
          "-b:a", "128k",
          "-ar", "44100",
          "-ac", "2",
          tempOutPath
        ]);
      } catch (ffmpegErr: any) {
        console.error("[TRANSCODER FFMPEG ERROR]", ffmpegErr?.stderr || ffmpegErr);
        throw new Error(`Échec du transcodage vidéo en MP4 H.264 : ${ffmpegErr?.message || "Erreur ffmpeg"}`);
      }

      if (!fs.existsSync(tempOutPath)) {
        throw new Error("Le fichier vidéo transcodé n'a pas pu être généré.");
      }

      const outBuffer = fs.readFileSync(tempOutPath);
      console.log(`[TRANSCODER] Transcodage terminé avec succès ! Taille finale: ${(outBuffer.length / 1024 / 1024).toFixed(2)} Mo`);

      // Assurer que le chemin de destination a l'extension .mp4
      let finalStoragePath = storagePath;
      if (!finalStoragePath.toLowerCase().endsWith(".mp4")) {
        finalStoragePath = finalStoragePath.replace(/\.[^.]+$/, "") + ".mp4";
      }

      // Téléversement direct dans Supabase Storage avec Content-Type: video/mp4
      const { data: uploadData, error: uploadError } = await serverSupabase.storage
        .from(bucket)
        .upload(finalStoragePath, outBuffer, {
          contentType: "video/mp4",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = serverSupabase.storage.from(bucket).getPublicUrl(finalStoragePath);
      const publicUrl = publicUrlData?.publicUrl || `${supabaseUrl}/storage/v1/object/public/${bucket}/${finalStoragePath}`;

      console.log(`[TRANSCODER SUCCESS] MP4 compatible Safari publié -> ${publicUrl}`);

      return res.json({
        success: true,
        url: publicUrl,
        publicUrl,
        storagePath: uploadData?.path || finalStoragePath,
        size: outBuffer.length,
        mimeType: "video/mp4",
        transcoded: true,
        message: "Vidéo convertie en MP4 H.264 Safari et publiée avec succès"
      });
    } catch (err: any) {
      console.error("[TRANSCODER FATAL ERROR]", err);
      return res.status(500).json({ success: false, error: err?.message || "Erreur interne lors du transcodage vidéo." });
    } finally {
      // Nettoyage impératif des fichiers temporaires
      try {
        const fs = await import("fs");
        if (tempInPath && fs.existsSync(tempInPath)) fs.unlinkSync(tempInPath);
        if (tempOutPath && fs.existsSync(tempOutPath)) fs.unlinkSync(tempOutPath);
      } catch (cleanErr) {
        console.warn("[TRANSCODER CLEANUP WARNING]", cleanErr);
      }
    }
  };

  app.post("/api/admin/media/transcode-and-upload", handleTranscodeAndUpload);
  app.post("/api/media/transcode-and-upload", handleTranscodeAndUpload);

  // 2. ENDPOINT CLASSIQUE BASE64 EXISTANT INTACT
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
      // 1. Vérification sécurisée du jeton d'authentification Firebase (ID Token)
      const decodedUser = await verifyFirebaseTokenSafe(idToken);
      if (!decodedUser || !decodedUser.uid) {
        const errResp = { success: false, error: "Session invalide ou expirée. Veuillez vous reconnecter." };
        console.log("[DIAG-6] Réponse HTTP finale - Status: 401 - Body:", JSON.stringify(errResp));
        return res.status(401).json(errResp);
      }

      const uid = decodedUser.uid;
      let userData: any = null;
      try {
        const adminDb = getAdminDb();
        if (adminDb) {
          const userDoc = await adminDb.collection("users").doc(uid).get();
          userData = userDoc.exists ? userDoc.data() : null;
          console.log("[DIAG-3] Lecture Firestore: SUCCÈS - document exists:", Boolean(userDoc.exists));
        }
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

      console.log(`[SERVER MEDIA UPLOAD SUCCESS] Téléversé par ${decodedUser.email || decodedUser.uid} -> ${publicUrl}`);

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

  // USER KYC DOCUMENT UPLOAD ROUTE (Supabase Storage afrigombo-private)
  app.post("/api/user/kyc/upload", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const { idToken, storagePath, fileBase64, contentType, bucket = "afrigombo-private" } = req.body || {};

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

      if (!storagePath.includes(uid) || !storagePath.toLowerCase().includes("kyc")) {
        return res.status(403).json({ success: false, error: "Accès refusé. Chemin de stockage non autorisé pour cet utilisateur." });
      }

      const base64Clean = fileBase64.includes(",") ? fileBase64.split(",")[1] : fileBase64;
      const fileBuffer = Buffer.from(base64Clean, "base64");

      const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://qefnkgtstcisplbrjcxy.supabase.co";
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseKey) {
        console.error("[USER KYC UPLOAD ERROR] SUPABASE_SERVICE_ROLE_KEY manquante dans l'environnement serveur.");
        return res.status(503).json({
          success: false,
          error: "Configuration serveur incomplète : SUPABASE_SERVICE_ROLE_KEY non configurée pour les uploads KYC privés."
        });
      }

      const { createClient } = await import("@supabase/supabase-js");
      const serverSupabase = createClient(supabaseUrl, supabaseKey);

      const { data: uploadData, error: uploadError } = await serverSupabase.storage
        .from(bucket)
        .upload(storagePath, fileBuffer, {
          contentType: contentType || "application/octet-stream",
          upsert: true,
        });

      if (uploadError) {
        console.error("[USER KYC UPLOAD ERROR] Supabase upload error:", uploadError);
        return res.status(500).json({ success: false, error: uploadError.message || "Échec du téléversement du document KYC." });
      }

      return res.json({
        success: true,
        path: uploadData?.path || storagePath,
        bucket,
        message: "Document KYC téléversé avec succès"
      });
    } catch (err: any) {
      console.error("[USER KYC UPLOAD FATAL ERROR]", err);
      return res.status(500).json({ success: false, error: err.message || "Erreur interne lors du téléversement du document KYC." });
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

  // 3. ENDPOINT SÉCURISÉ POUR LA CONSULTATION KYC - SUPER FONDATEUR & ADMIN
  app.post("/api/admin/kyc/view", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const authHeader = req.headers.authorization || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : undefined;
    const { idToken = bearerToken, storagePaths, storagePath, bucket = "afrigombo-private" } = req.body || {};
    const tokenToVerify = idToken || bearerToken;

    if (!tokenToVerify) {
      return res.status(401).json({ success: false, error: "Non authentifié (token manquant). L'accès anonyme est strictement interdit." });
    }

    const pathsToProcess: string[] = Array.isArray(storagePaths)
      ? storagePaths.filter(Boolean)
      : typeof storagePath === "string" && storagePath
      ? [storagePath]
      : [];

    if (pathsToProcess.length === 0) {
      return res.status(400).json({ success: false, error: "Paramètre 'storagePaths' ou 'storagePath' requis." });
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
        decodedToken = await adminAuth.verifyIdToken(tokenToVerify);
      } catch (authErr: any) {
        return res.status(401).json({ success: false, error: "Session invalide ou expirée. Veuillez vous reconnecter." });
      }

      const uid = decodedToken.uid;
      let userData: any = null;
      try {
        const userDoc = await adminDb.collection("users").doc(uid).get();
        userData = userDoc.exists ? userDoc.data() : null;
      } catch (firestoreErr: any) {
        console.warn("[KYC VIEW FIRESTORE ERROR]", firestoreErr?.message || firestoreErr);
      }

      // 2. Contrôle de rôle strict : Seul le Fondateur / Super Fondateur / Admin est autorisé
      const isAuthorized =
        PROTECTED_FOUNDER_EMAILS.includes(decodedToken.email || "") ||
        userData?.isFounder === true ||
        userData?.superFounder === true ||
        userData?.role === "super_founder" ||
        userData?.role === "admin" ||
        userData?.role === "founder";

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          error: "Accès refusé. Seul le Fondateur souverain ou un Administrateur autorisé peut consulter les documents KYC."
        });
      }

      // 3. Traitement et génération des URLs sécurisées
      const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://qefnkgtstcisplbrjcxy.supabase.co";
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
      let serverSupabase: any = null;
      if (supabaseKey) {
        try {
          const { createClient } = await import("@supabase/supabase-js");
          serverSupabase = createClient(supabaseUrl, supabaseKey);
        } catch (supErr) {
          console.warn("[SUPABASE INIT IN KYC VIEW]", supErr);
        }
      }

      const results = await Promise.all(
        pathsToProcess.map(async (p) => {
          if (!p || typeof p !== "string") {
            return { path: p, signedUrl: "" };
          }

          // Si c'est déjà une URL HTTP(S) complète ou data URI, la retourner directement
          if (
            p.startsWith("http://") ||
            p.startsWith("https://") ||
            p.startsWith("data:") ||
            p.startsWith("blob:")
          ) {
            return { path: p, signedUrl: p };
          }

          const cleanPath = p.replace(
            /^(?:https?:\/\/[^/]+\/storage\/v1\/object\/public\/[^/]+\/)/,
            ""
          );

          let signedUrl = "";

          // Tentative via Supabase Storage
          if (serverSupabase) {
            try {
              // 1. Essai sur le bucket demandé (ex: afrigombo-private)
              const { data: signData, error: signError } = await serverSupabase.storage
                .from(bucket)
                .createSignedUrl(cleanPath, 3600);

              if (signData?.signedUrl && !signError) {
                signedUrl = signData.signedUrl;
              } else {
                // 2. Essai de repli sur afrigombo-media ou autres buckets
                const fallbackBuckets = ["afrigombo-media", "afrigombo-private", "documents"].filter((b: string) => b !== bucket);
                for (const fb of fallbackBuckets) {
                  const { data: fbData } = await serverSupabase.storage
                    .from(fb)
                    .createSignedUrl(cleanPath, 3600);
                  if (fbData?.signedUrl) {
                    signedUrl = fbData.signedUrl;
                    break;
                  }
                }
              }
            } catch (supSignErr) {
              console.warn("[SUPABASE KYC SIGN WARN]", cleanPath, supSignErr);
            }
          }

          // Tentative via Firebase Storage si Firebase Admin Storage est disponible et pas encore signé
          if (!signedUrl) {
            try {
              if (getAdminApps().length > 0) {
                const storageBucket = getAdminStorage().bucket();
                const file = storageBucket.file(cleanPath);
                const [exists] = await file.exists();
                if (exists) {
                  const [fbSignedUrl] = await file.getSignedUrl({
                    action: "read",
                    expires: Date.now() + 3600 * 1000
                  });
                  if (fbSignedUrl) {
                    signedUrl = fbSignedUrl;
                  }
                }
              }
            } catch (fbStorageErr) {
              console.warn("[FIREBASE STORAGE KYC SIGN WARN]", fbStorageErr);
            }
          }

          // Fallback : Si aucune signature n'a pu être complétée, générer une URL publique Supabase si possible
          if (!signedUrl && serverSupabase) {
            try {
              const { data: publicData } = serverSupabase.storage.from(bucket).getPublicUrl(cleanPath);
              if (publicData?.publicUrl) {
                signedUrl = publicData.publicUrl;
              }
            } catch (_) {}
          }

          return {
            path: p,
            signedUrl: signedUrl || p
          };
        })
      );

      return res.json({
        success: true,
        results
      });
    } catch (err: any) {
      console.error("[ADMIN KYC VIEW FATAL ERROR]", err);
      return res.status(500).json({ success: false, error: err.message || "Erreur interne lors de la consultation KYC." });
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

  // ==========================================
  // Cloudflare R2 Object Storage Endpoints
  // ==========================================

  // Statut de la configuration Cloudflare R2 pour AFRIGOMBO
  app.get("/api/r2/status", (req, res) => {
    const config = getR2Config();
    return res.json({
      configured: isR2Configured(),
      endpoint: config.endpoint,
      publicBucket: config.publicBucket,
      privateBucket: config.privateBucket,
    });
  });

  // Test réel de connectivité aux buckets Cloudflare R2 (GET & POST)
  const handleTestConnection = async (req: express.Request, res: express.Response) => {
    if (!isR2Configured()) {
      return res.status(503).json({
        configured: false,
        error: "R2 non configuré dans l'environnement serveur (R2_ACCESS_KEY_ID ou R2_SECRET_ACCESS_KEY manquant)",
      });
    }

    const publicTest = await testR2BucketConnection("public");
    const privateTest = await testR2BucketConnection("private");

    return res.json({
      configured: true,
      endpoint: process.env.R2_ENDPOINT,
      publicBucket: publicTest,
      privateBucket: privateTest,
    });
  };
  app.get("/api/r2/test-connection", handleTestConnection);
  app.post("/api/r2/test-connection", handleTestConnection);

  // Génération d'URL présignée d'upload (PUT) vers Cloudflare R2
  app.post("/api/r2/presigned-upload-url", async (req, res) => {
    try {
      let body = req.body;
      if (typeof body === "string") {
        try {
          body = JSON.parse(body);
        } catch (_) {
          body = {};
        }
      } else if (!body) {
        body = {};
      }
      const { key, contentType, bucketType = "public", expiresInSeconds, idToken: bodyIdToken } = body;

      if (!key || typeof key !== "string") {
        return res.status(400).json({
          success: false,
          code: "INVALID_KEY",
          error: "La clé de fichier (key) est requise.",
        });
      }

      if (bucketType !== "public" && bucketType !== "private") {
        return res.status(400).json({
          success: false,
          code: "INVALID_BUCKET_TYPE",
          error: 'bucketType invalide (doit être "public" ou "private").',
        });
      }

      const authHeader = req.headers.authorization || req.headers.Authorization || "";
      const token = (typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "") : "") || bodyIdToken || "";

      if (!token) {
        return res.status(401).json({
          success: false,
          code: "AUTH_TOKEN_MISSING",
          error: "Authentification requise pour le téléversement Cloudflare R2 (jeton manquant).",
        });
      }

      const authUser = await verifyFirebaseTokenSafe(token);
      if (!authUser || !authUser.uid) {
        return res.status(401).json({
          success: false,
          code: "AUTH_SESSION_INVALID",
          error: "Session invalide ou expirée. Veuillez vous reconnecter.",
        });
      }
      const decodedUid = authUser.uid;

      if (!isR2Configured()) {
        return res.status(503).json({
          success: false,
          code: "R2_NOT_CONFIGURED",
          error: "Cloudflare R2 n'est pas encore configuré (identifiants R2_ACCESS_KEY_ID ou R2_SECRET_ACCESS_KEY manquants).",
        });
      }

      const result = await generateR2PresignedUploadUrl({
        key,
        bucketType: bucketType as R2BucketType,
        contentType: contentType || "application/octet-stream",
        expiresInSeconds: expiresInSeconds ? Number(expiresInSeconds) : 3600,
      });

      return res.status(200).json({
        success: true,
        ...result,
        userId: decodedUid,
      });
    } catch (error: any) {
      console.error("[R2 PRESIGNED UPLOAD URL ERROR]", error?.message || error);
      return res.status(500).json({
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        error: error?.message || "Erreur serveur lors de la génération de l'URL présignée Cloudflare R2.",
      });
    }
  });

  // Génération d'URL présignée de lecture (GET) pour les objets Cloudflare R2
  app.post("/api/r2/presigned-read-url", async (req, res) => {
    try {
      const { key, bucketType = "private", expiresInSeconds } = req.body;

      if (!key || typeof key !== "string") {
        return res.status(400).json({ error: "La clé de fichier (key) est requise" });
      }

      const authHeader = req.headers.authorization || "";
      const token = authHeader.replace(/^Bearer\s+/i, "") || req.body?.idToken || "";

      if (!token) {
        return res.status(401).json({ error: "Authentification requise" });
      }

      const adminAuth = getAdminAuthClient();
      let decodedUid = "";
      if (adminAuth) {
        try {
          const decoded = await adminAuth.verifyIdToken(token);
          if (decoded && decoded.uid) {
            decodedUid = decoded.uid;
          }
        } catch (_) {}
      }

      if (!decodedUid) {
        return res.status(401).json({ error: "Jeton invalide" });
      }

      if (!isR2Configured()) {
        return res.status(503).json({
          error: "Cloudflare R2 n'est pas encore configuré (R2_ACCESS_KEY_ID ou R2_SECRET_ACCESS_KEY manquant)",
        });
      }

      const result = await generateR2PresignedReadUrl({
        key,
        bucketType: bucketType as R2BucketType,
        expiresInSeconds: expiresInSeconds ? Number(expiresInSeconds) : 3600,
      });

      return res.json({
        success: true,
        ...result,
        userId: decodedUid,
      });
    } catch (error: any) {
      console.error("[R2 PRESIGNED READ URL ERROR]", error);
      return res.status(500).json({ error: error.message || "Erreur serveur lors de la lecture présignée R2" });
    }
  });

  // Upload sécurisé direct par proxy serveur (résilient aux coupures réseau / CORS)
  app.post("/api/r2/proxy-upload", async (req, res) => {
    try {
      const { key, contentType = "video/mp4", bucketType = "public", base64Data, idToken: bodyIdToken } = req.body || {};

      if (!key || !base64Data) {
        return res.status(400).json({ error: "Clé (key) et données (base64Data) requises." });
      }

      const authHeader = req.headers?.authorization || req.headers?.Authorization || "";
      const idToken = (typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "") : "") || bodyIdToken;

      let decodedUid = "system_user";
      if (idToken) {
        const adminAuth = getAdminAuthClient();
        if (adminAuth) {
          try {
            const decoded = await adminAuth.verifyIdToken(idToken);
            decodedUid = decoded.uid;
          } catch (_) {
            const parts = idToken.split(".");
            if (parts.length === 3) {
              const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
              if (payload.user_id || payload.uid) decodedUid = payload.user_id || payload.uid;
            }
          }
        }
      }

      if (!isR2Configured()) {
        return res.status(503).json({ error: "Stockage Cloudflare R2 non configuré." });
      }

      const base64Clean = base64Data.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(base64Clean, "base64");
      const cleanKey = key.replace(/^\/+/, "");

      const uploadRes = await uploadBufferToR2({
        key: cleanKey,
        buffer,
        contentType,
        bucketType: bucketType as R2BucketType,
      });

      return res.json({
        success: true,
        ...uploadRes,
        userId: decodedUid,
      });
    } catch (proxyErr: any) {
      console.error("[R2 PROXY UPLOAD SERVER ERROR]", proxyErr);
      return res.status(500).json({ error: proxyErr.message || "Erreur lors du transfert R2 par le serveur." });
    }
  });

  app.post("/api/r2/delete", async (req, res) => {
    try {
      const { key, idToken } = req.body;
      const authHeader = req.headers.authorization;
      const token = idToken || (authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null);

      if (!key || typeof key !== "string") {
        return res.status(400).json({ error: "Clé R2 invalide ou manquante." });
      }

      let uid: string | null = null;
      let userEmail: string | null = null;

      if (token) {
        try {
          const adminAuth = getAdminAuthClient();
          if (adminAuth) {
            const decoded = await adminAuth.verifyIdToken(token);
            uid = decoded.uid;
            userEmail = decoded.email || null;
          }
        } catch (authErr) {
          console.warn("[R2 Delete API] Token invalide/expiré:", authErr);
        }
      }

      if (!uid) {
        return res.status(401).json({ error: "Authentification requise pour supprimer un fichier R2." });
      }

      // Check ownership or admin status
      const isOwner = key.includes(uid);
      const isFounderOrAdmin = userEmail && PROTECTED_FOUNDER_EMAILS.includes(userEmail);

      if (!isOwner && !isFounderOrAdmin) {
        return res.status(403).json({ error: "Permission refusée. Vous ne pouvez supprimer que vos propres fichiers R2." });
      }

      const success = await deleteObjectFromR2(key, "public");
      return res.json({ success, key });
    } catch (err: any) {
      console.error("[R2 DELETE API ERROR]", err);
      return res.status(500).json({ error: err?.message || "Erreur lors de la suppression R2." });
    }
  });

  // Accès et streaming direct aux médias publics Cloudflare R2 (Express v5 compatible)
  app.get("/api/r2/media/*all", async (req, res) => {
    try {
      const rawKey = req.path.replace(/^\/api\/r2\/media\//, "");
      const key = decodeURIComponent(rawKey);

      if (!key) {
        return res.status(400).json({ error: "Clé de média manquante" });
      }

      if (!isR2Configured()) {
        return res.status(503).json({ error: "Stockage R2 non configuré" });
      }

      const publicBaseUrl = (process.env.R2_PUBLIC_BASE_URL || "").trim();
      if (publicBaseUrl) {
        return res.redirect(302, `${publicBaseUrl.replace(/\/$/, "")}/${key}`);
      }

      const signed = await generateR2PresignedReadUrl({
        key,
        bucketType: "public",
        expiresInSeconds: 86400,
      });

      return res.redirect(302, signed.readUrl);
    } catch (err: any) {
      console.error("[R2 MEDIA ACCESS ERROR]", err);
      return res.status(500).json({ error: "Impossible de lire le média Cloudflare R2" });
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
  const PORT = 3000;

  // Vite middleware for development (bypassed on Vercel)
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: process.env.DISABLE_HMR === "true" ? false : undefined,
        },
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
    app.use((req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
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
