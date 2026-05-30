import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const envs = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: envs.VITE_FIREBASE_API_KEY || envs.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAMF-0VndIVU9BREb4IpFgMvjVdICzScBQ",
  authDomain: envs.VITE_FIREBASE_AUTH_DOMAIN || envs.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ya-gombo-music.firebaseapp.com",
  projectId: envs.VITE_FIREBASE_PROJECT_ID || envs.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ya-gombo-music",
  storageBucket: envs.VITE_FIREBASE_STORAGE_BUCKET || envs.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ya-gombo-music.firebasestorage.app",
  messagingSenderId: envs.VITE_FIREBASE_MESSAGING_SENDER_ID || envs.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "953766968848",
  appId: envs.VITE_FIREBASE_APP_ID || envs.NEXT_PUBLIC_FIREBASE_APP_ID || "1:953766968848:web:173a4b2ea336ecf50a9495"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Explicitly configure local persistence
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("🔐 [Firebase Auth Init] browserLocalPersistence activée avec succès !");
  })
  .catch((err) => {
    console.error("❌ [Firebase Auth Init] Échec de l'activation de browserLocalPersistence:", err);
  });

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
