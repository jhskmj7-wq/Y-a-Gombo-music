import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
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

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});

export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();

console.log("AUTH READY (Afrigombo Default):", auth.app.options.projectId);
