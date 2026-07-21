import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence, indexedDBLocalPersistence } from "firebase/auth";
import { initializeFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC3eJm2GfUMxGUNGu7uZeIP9-rtcLRljNk",
  authDomain: "afrigombo.firebaseapp.com",
  databaseURL: "https://afrigombo-default-rtdb.firebaseio.com",
  projectId: "afrigombo",
  storageBucket: "afrigombo.firebasestorage.app",
  messagingSenderId: "558547758112",
  appId: "1:558547758112:web:d84cbcb8fb0e0670c5a045",
  measurementId: "G-27498CNQX0"
};

export const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Explicitly set persistent authentication storage (IndexedDB -> LocalStorage)
if (typeof window !== "undefined") {
  setPersistence(auth, indexedDBLocalPersistence)
    .catch(() => setPersistence(auth, browserLocalPersistence))
    .catch((err) => {
      console.error("Failed to set auth persistence:", err);
    });
}

export const db = initializeFirestore(app, {});

// Enable offline persistence
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Firestore persistence failed: Multiple tabs open.");
    } else if (err.code === 'unimplemented') {
      console.warn("Firestore persistence is not supported in this browser.");
    }
  });
}

export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

console.log("AUTH READY (Afrigombo Default):", auth.app.options.projectId);
