import * as admin from "firebase-admin";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

if (getApps().length === 0) {
  initializeApp({
    projectId: "afrigombo",
  });
}

const db = getFirestore();
const auth = getAuth();

async function inspect() {
  console.log("=== SCANNING FIREBASE AUTH & FIRESTORE ===");
  
  // 1. Scan Firebase Auth
  const authUsers: any[] = [];
  try {
    let nextPageToken;
    do {
      const listResult = await auth.listUsers(1000, nextPageToken);
      authUsers.push(...listResult.users);
      nextPageToken = listResult.pageToken;
    } while (nextPageToken);
    console.log(`Firebase Auth Total Users: ${authUsers.length}`);
    authUsers.forEach(u => console.log(` - Auth User: UID=${u.uid}, Email=${u.email}, DisplayName=${u.displayName}`));
  } catch (err: any) {
    console.error("Auth scanning error:", err.message);
  }

  // 2. Scan Users Collection in Firestore
  console.log("\n=== SCANNING FIRESTORE 'users' COLLECTION ===");
  try {
    const usersSnap = await db.collection("users").get();
    console.log(`Firestore 'users' docs count: ${usersSnap.size}`);
    usersSnap.docs.forEach(doc => {
      const d = doc.data();
      console.log(` - Doc ID=${doc.id}: Email=${d.email}, Role=${d.role}, isFounder=${d.isFounder}, superFounder=${d.superFounder}, displayName=${d.displayName}`);
    });
  } catch (err: any) {
    console.error("Firestore users scanning error:", err.message);
  }

  // 3. Scan Collections in Firestore
  console.log("\n=== SCANNING ALL ROOT COLLECTIONS ===");
  try {
    const cols = await db.listCollections();
    console.log(`Found ${cols.length} root collections:`);
    for (const col of cols) {
      const snap = await col.get();
      console.log(` - Collection '${col.id}': ${snap.size} documents`);
    }
  } catch (err: any) {
    console.error("Root collections listing error:", err.message);
  }
}

inspect().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
