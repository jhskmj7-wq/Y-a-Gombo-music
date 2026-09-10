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

// 2. RESILIENT TOKEN VERIFICATION (Admin SDK + Google Identity Toolkit REST fallback)
export async function verifyUserToken(idToken: string): Promise<AuthUser | null> {
  if (!idToken || typeof idToken !== "string") return null;

  // Attempt 1: Firebase Admin SDK
  try {
    const adminAppModule = await import("firebase-admin/app");
    const adminAuthModule = await import("firebase-admin/auth");

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

    const adminAuth = adminAuthModule.getAuth();
    const decoded = await adminAuth.verifyIdToken(idToken);
    return {
      uid: decoded.uid,
      email: (decoded.email || "").toLowerCase(),
    };
  } catch (adminErr) {
    // Admin SDK failed, proceeding to REST fallback
  }

  // Attempt 2: Google Identity Toolkit REST API Fallback
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!response.ok) {
      console.error("[AUTH REST] Verification failed, HTTP status:", response.status);
      return null;
    }

    const data = await response.json();
    if (data.users && data.users.length > 0) {
      const user = data.users[0];
      return {
        uid: user.localId,
        email: (user.email || "").toLowerCase(),
      };
    }
    return null;
  } catch (restErr) {
    console.error("[AUTH REST] Exception:", restErr);
    return null;
  }
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
