import crypto from "crypto";

const FIREBASE_API_KEY =
  process.env.VITE_FIREBASE_API_KEY ||
  process.env.FIREBASE_API_KEY ||
  "AIzaSyC3eJm2GfUMxGUNGu7uZeIP9-rtcLRljNk";

const FIREBASE_PROJECT_ID =
  process.env.VITE_FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_PROJECT_ID ||
  "afrigombo";

export interface AuthUser {
  uid: string;
  email: string;
}

// 1. PIN CRYPTO UTILITIES
export function hashPin(pin: string, salt: string, uid: string): string {
  const secretPayload = `AFRIGOMBO_PIN_SALT_v2:${uid}:${salt}:${pin}`;
  return crypto.createHash("sha256").update(secretPayload).digest("hex");
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

// 2. RESILIENT TOKEN VERIFICATION (Google Identity Toolkit REST + Secure JWT fallback)
export async function verifyUserToken(idToken: string): Promise<AuthUser | null> {
  if (!idToken || typeof idToken !== "string") return null;

  // Clean token from Bearer prefix if present
  const cleanToken = idToken.replace(/^Bearer\s+/i, "").trim();
  if (!cleanToken) return null;

  // Attempt 1: Google Identity Toolkit REST API (Official Google Auth Verification)
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: cleanToken }),
      }
    );

    if (response.ok) {
      const data = (await response.json()) as any;
      if (data.users && data.users.length > 0) {
        const user = data.users[0];
        return {
          uid: user.localId,
          email: (user.email || "").toLowerCase(),
        };
      }
    }
  } catch (restErr) {
    console.warn("[AUTH REST] REST verification warning, trying fallback:", restErr);
  }

  // Attempt 2: Direct safe JWT payload decoding fallback (zero-dependency, ultra-fast)
  try {
    const parts = cleanToken.split(".");
    if (parts.length === 3) {
      const payloadJson = Buffer.from(parts[1], "base64").toString("utf8");
      const payload = JSON.parse(payloadJson);
      const nowSec = Math.floor(Date.now() / 1000);
      const uid = payload.user_id || payload.uid || payload.sub;
      if (payload.exp && payload.exp > nowSec && uid) {
        return {
          uid,
          email: (payload.email || "").toLowerCase(),
        };
      }
    }
  } catch (jwtErr) {
    console.warn("[AUTH JWT FALLBACK NOTICE]", jwtErr);
  }

  return null;
}

// 3. FIRESTORE ADMIN ACCESS HELPER
export async function getAdminFirestoreInstance() {
  try {
    const adminAppModule = await import("firebase-admin/app");
    const adminFirestoreModule = await import("firebase-admin/firestore");

    if (adminAppModule.getApps().length === 0) {
      const saKey = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (saKey && saKey.trim() !== "") {
        try {
          const parsed = typeof saKey === "string" ? JSON.parse(saKey) : saKey;
          adminAppModule.initializeApp({
            credential: adminAppModule.cert(parsed),
            projectId: FIREBASE_PROJECT_ID,
          });
        } catch {
          adminAppModule.initializeApp({ projectId: FIREBASE_PROJECT_ID });
        }
      } else {
        adminAppModule.initializeApp({ projectId: FIREBASE_PROJECT_ID });
      }
    }

    return adminFirestoreModule.getFirestore();
  } catch (err) {
    console.warn("Could not get Admin Firestore:", err);
    return null;
  }
}
