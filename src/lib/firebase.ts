import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence, indexedDBLocalPersistence } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache, getFirestore } from "firebase/firestore";
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

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch (e) {
  try {
    firestoreInstance = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      localCache: memoryLocalCache()
    });
  } catch (err2) {
    firestoreInstance = getFirestore(app);
  }
}

export const db = firestoreInstance;

export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

console.log("AUTH READY (Afrigombo Default):", auth.app.options.projectId);
