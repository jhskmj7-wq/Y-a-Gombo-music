import re

filepath = 'src/firebase.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Replace profile creation in loginWithGoogle
old_profile = """            const userProfile: UserProfile = {
              uid: res.user.uid,
              displayName: res.user.displayName || "",
              photoURL: res.user.photoURL || "",
              email: res.user.email || "",
              provider: "google.com",
              createdAt: new Date().toISOString(),
              role: "musicien",
              isProfileComplete: false
            };"""

new_profile = """            const userProfile: UserProfile = {
              uid: res.user.uid,
              displayName: res.user.displayName || "",
              firstName: res.user.displayName?.split(" ")[0] || "",
              lastName: res.user.displayName?.split(" ").slice(1).join(" ") || "",
              photoURL: res.user.photoURL || "",
              avatarUrl: res.user.photoURL || "",
              email: res.user.email || "",
              provider: "google.com",
              createdAt: serverTimestamp() as any,
              role: "musicien",
              isProfileComplete: false,
              isVerified: false,
              balance: 0,
              totalRevenue: 0
            };"""

content = content.replace(old_profile, new_profile)

# Do the same for handleAuthRedirect if it exists
content = content.replace('createdAt: new Date().toISOString(),', 'createdAt: serverTimestamp() as any,')

# We need to make sure serverTimestamp is imported
if 'serverTimestamp' not in content:
    content = content.replace('import { getDoc, setDoc,', 'import { getDoc, setDoc, serverTimestamp,')
    if 'serverTimestamp' not in content:
        content = content.replace('import {', 'import { serverTimestamp,')

with open(filepath, 'w') as f:
    f.write(content)

