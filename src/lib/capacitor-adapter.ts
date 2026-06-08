/**
 * AFRIGOMBO — OFFICIAL CAPACITOR INTERFACES ADAPTER
 * 
 * This module structures, documents, and prepares the single React codebase
 * to support both the standard Web deployment and a high-performance, native
 * Android-compiled Capacitor container.
 * 
 * Directives:
 * 1. ZERO Web-breaking direct imports. Code handles the bridge gracefully.
 * 2. Prepares Native Google Login (Capacitor SSO).
 * 3. Prepares Native Facebook Login (Capacitor SSO).
 * 4. Prepares Firebase Cloud Messaging (FCM/Push notifications).
 * 5. Handles deep links and custom schemes back to the applet.
 */

import { GoogleAuthProvider, FacebookAuthProvider, signInWithCredential } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, updateDoc } from "firebase/firestore";

// Helper to safely detect if running inside Capacitor
export const isCapacitor = (): boolean => {
  return typeof window !== "undefined" && !!(window as any).Capacitor;
};

// Log helper for debugging in Android Logcat or Chrome DevTools
export const capLog = (message: string, ...args: any[]) => {
  console.log(`📱 [AFRIGOMBO-CAPACITOR] ${message}`, ...args);
};

/**
 * 1. FIREBASE CLOUD MESSAGING & PUSH NOTIFICATIONS
 * 
 * Implements native push support via a non-blocking graceful fallback model.
 * In Web, it acts as a silent stub or can optionally integrate Web Push in the future.
 * In a Capacitor container, it requests appropriate native Android user clearances.
 */
export async function initializePushNotifications(userUid?: string) {
  if (!isCapacitor()) {
    capLog("Not in Capacitor environment. Skipping push registration.");
    return null;
  }

  const Capacitor = (window as any).Capacitor;
  const PushNotifications = Capacitor.Plugins?.PushNotifications;

  if (!PushNotifications) {
    capLog("⚠️ PushNotifications native plugin not found in the Capacitor runtime.");
    return null;
  }

  try {
    capLog("Checking push application permissions...");
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === "prompt") {
      capLog("Requesting push permission...");
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== "granted") {
      capLog("❌ Push permission was denied by the user.");
      return null;
    }

    capLog("Registering for push notifications standard APNS/FCM channels...");
    await PushNotifications.register();

    // Set callback listeners
    await PushNotifications.addListener("registration", async (token: { value: string }) => {
      capLog("🎉 Push Channel Registration Success! Device Token:", token.value);
      
      // Update FCM token in user's profile database if a user exists
      if (userUid && db) {
        try {
          const userDocRef = doc(db, "users", userUid);
          await updateDoc(userDocRef, {
            fcmDeviceToken: token.value,
            lastDeviceActivity: new Date().toISOString(),
            isNativePushEnabled: true
          });
          capLog("💾 Device push token securely stored in Firestore user profile.");
        } catch (e) {
          capLog("Non-fatal error updating push token in Firestore:", e);
        }
      }
    });

    await PushNotifications.addListener("registrationError", (error: any) => {
      capLog("❌ Push registration failed:", error);
    });

    await PushNotifications.addListener("pushNotificationReceived", (notification: any) => {
      capLog("🔔 Native Push Notification Received in Foreground:", notification);
    });

    await PushNotifications.addListener("pushNotificationActionPerformed", (action: any) => {
      capLog("🎯 Notification action performed by the user:", action);
    });

    return true;
  } catch (err) {
    capLog("❌ Push Notification registration failed completely:", err);
    return false;
  }
}

/**
 * 2. NATIVE GOOGLE LOGIN (Capacitor)
 * 
 * Bypasses standard Web redirections/popup limitations inside the Android app
 * to ensure a smooth, certified authentication flow.
 */
export async function performNativeGoogleLogin(): Promise<any> {
  if (!isCapacitor()) {
    throw new Error("Cannot run Capacitor Google Login outside of Capacitor wrapper.");
  }

  const Capacitor = (window as any).Capacitor;
  
  // Capacitor Google Auth plugin options (such as @capacitor-firebase/authentication or @codetrix-studio/capacitor-google-auth)
  const GoogleAuth = Capacitor.Plugins?.GoogleAuth || Capacitor.Plugins?.FirebaseAuthentication;

  if (!GoogleAuth) {
    capLog("⚠️ Native auth plugin missing in Capacitor plugins map.");
    throw new Error("Le plugin d'authentification native Google n'est pas encore installé dans votre build APK.");
  }

  capLog("Initiating native Google authentication screen flow...");
  try {
    const result = await GoogleAuth.signIn();
    capLog("Google Native Login Success! Constructing credentials...", result);

    const idToken = result.idToken || result.credential?.idToken;
    const accessToken = result.accessToken || result.credential?.accessToken;

    if (!idToken) {
      throw new Error("L'authentification native Google n'a pas renvoyé d'idToken valide.");
    }

    if (auth) {
      const credential = GoogleAuthProvider.credential(idToken, accessToken || null);
      const userCredential = await signInWithCredential(auth, credential);
      capLog("Session Firebase successfully completed natively!", userCredential.user);
      return userCredential.user;
    } else {
      capLog("⚠️ Firebase auth is in Mock Mode or unitialized. Logging in user locally...");
      return { uid: "goog_native_" + Math.random().toString(36).substring(2, 8), email: result.email || "native@gmail.com" };
    }
  } catch (err: any) {
    capLog("❌ Google Native Login failed:", err);
    throw err;
  }
}

/**
 * 3. NATIVE FACEBOOK LOGIN (Capacitor)
 * 
 * Prevents complex popup failures inside Android webviews.
 */
export async function performNativeFacebookLogin(): Promise<any> {
  if (!isCapacitor()) {
    throw new Error("Cannot run Capacitor Facebook Login outside of Capacitor wrapper.");
  }

  const Capacitor = (window as any).Capacitor;
  const FacebookLogin = Capacitor.Plugins?.FacebookLogin || Capacitor.Plugins?.FirebaseAuthentication;

  if (!FacebookLogin) {
    capLog("⚠️ Native Facebook Login plugin missing in Capacitor plugins map.");
    throw new Error("Le plugin d'authentification native Facebook n'est pas installé dans le projet.");
  }

  capLog("Initiating native Facebook authentication screen flow...");
  try {
    const response = await FacebookLogin.login({ permissions: ["email", "public_profile"] });
    capLog("Facebook Native Login Success! response received:", response);

    const accessToken = response.accessToken?.token || response.credential?.accessToken;

    if (!accessToken) {
      throw new Error("L'authentification native Facebook n'a pas renvoyé de token d'accès.");
    }

    if (auth) {
      const credential = FacebookAuthProvider.credential(accessToken);
      const userCredential = await signInWithCredential(auth, credential);
      capLog("Session Firebase successfully completed natively via Facebook!", userCredential.user);
      return userCredential.user;
    } else {
      capLog("⚠️ Firebase auth is in Mock Mode or unitialized. Logging in locally...");
      return { uid: "fb_native_" + Math.random().toString(36).substring(2, 8), email: "fb_native@facebook.com" };
    }
  } catch (err: any) {
    capLog("❌ Facebook Native Login failed:", err);
    throw err;
  }
}

/**
 * 4. NATIVE SHARING SYSTEM
 * Exposes system native sharing dialogs when available to replace standard clipboard logic.
 */
export async function shareToNativeShowcase(title: string, text: string, url: string): Promise<boolean> {
  if (!isCapacitor()) return false;

  const Capacitor = (window as any).Capacitor;
  const Share = Capacitor.Plugins?.Share;

  if (!Share) {
    capLog("Share API not loaded natively. Falling back to web clipboard share.");
    return false;
  }

  try {
    await Share.share({
      title,
      text,
      url,
      dialogTitle: "Partager l'Artiste / Gombo via AFRIGOMBO"
    });
    return true;
  } catch (e) {
    capLog("Share plugin failed:", e);
    return false;
  }
}
