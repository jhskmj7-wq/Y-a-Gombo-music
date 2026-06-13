import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAMF-0VndIVU9BREb4IpFgMvjVdICzScBQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ya-gombo-music.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ya-gombo-music",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ya-gombo-music.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "953766968848",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:953766968848:web:173a4b2ea336ecf50a9495"
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize services simply to avoid conflicting long-polling configurations
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
