import re

filepath = 'src/AuthContext.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Add serverTimestamp to import
if 'serverTimestamp' not in content:
    content = content.replace('import { getDoc, setDoc', 'import { getDoc, setDoc, serverTimestamp')
    if 'serverTimestamp' not in content:
        # If it wasn't there, maybe it imports from firebase/firestore elsewhere
        content = content.replace('import { auth } from "./lib/firebase";', 'import { auth } from "./lib/firebase";\nimport { serverTimestamp } from "firebase/firestore";')

# Fix role and createdAt
old_profile = """            uProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              firstName: names[0] || "",
              lastName: names.slice(1).join(" ") || "",
              displayName: firebaseUser.displayName || "",
              photoURL: firebaseUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
              avatarUrl: firebaseUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
              role: isFounder ? "founder" : "user",
              isFounder: isFounder,
              permissions: isFounder ? founderPermissions : [],
              provider: firebaseUser.providerData?.[0]?.providerId || "google.com",
              isProfileComplete: false,
              balance: 0,
              totalRevenue: 0,
              createdAt: new Date().toISOString()
            };"""

new_profile = """            uProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              firstName: names[0] || "",
              lastName: names.slice(1).join(" ") || "",
              displayName: firebaseUser.displayName || "",
              photoURL: firebaseUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
              avatarUrl: firebaseUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
              role: isFounder ? "admin" : "client",
              isFounder: isFounder,
              permissions: isFounder ? founderPermissions : [],
              provider: firebaseUser.providerData?.[0]?.providerId || "google.com",
              isProfileComplete: false,
              isVerified: false,
              balance: 0,
              totalRevenue: 0,
              createdAt: serverTimestamp() as any
            };"""

content = content.replace(old_profile, new_profile)

# And also for existing profiles, we should not set "founder" role if it breaks updates
content = content.replace('uProfile.role = "founder";', 'uProfile.role = "admin";')
content = content.replace('role: "founder",', 'role: "admin",')
content = content.replace('realtimeProfile.role = "founder";', 'realtimeProfile.role = "admin";')

with open(filepath, 'w') as f:
    f.write(content)

