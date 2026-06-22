import { initializeApp,getApps,getApp } from "firebase/app";
import { getAuth,GoogleAuthProvider } from "firebase/auth";
import { getFirestore,enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig={
  apiKey:"AIzaSyC3eJm2GfUMxGUNGu7uZeIP9-rtcLRljNk",
  authDomain:"afrigombo.firebaseapp.com",
  projectId:"afrigombo",
  storageBucket:"afrigombo.firebasestorage.app",
  messagingSenderId:"558547758112",
  appId:"1:558547758112:web:d84cbcb8fb0e0670c5a045",
  measurementId:"G-27498CNQX0"
};

const app=
getApps().length===0
? initializeApp(firebaseConfig)
: getApp();

export { app };

export const auth=getAuth(app);

export const db=getFirestore(app);

export const storage=getStorage(app);

export const googleProvider=
new GoogleAuthProvider();

if(typeof window!=="undefined"){
  console.log("🔥 Firebase active:", firebaseConfig.projectId);
  try{
    getAnalytics(app);
  }catch(e){
    console.log("Analytics ignoré:",e);
  }
}

enableIndexedDbPersistence(db)
.catch((err)=>{
  console.log("Persistence error:",err);
});

export default app;

