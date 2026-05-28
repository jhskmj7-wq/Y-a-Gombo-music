import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAMF-0VndIVU9BREb4IpFgMvjVdICzScBQ",
  authDomain: "ya-gombo-music.firebaseapp.com",
  projectId: "ya-gombo-music",
  storageBucket: "ya-gombo-music.firebasestorage.app",
  messagingSenderId: "953766968848",
  appId: "1:953766968848:web:173a4b2ea336ecf50a9495"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
