import re

filepath = 'src/firebase.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Add handleAuthRedirect function to gomboAuth
new_func = """
  async handleAuthRedirect() {
    if (auth && db) {
      try {
        const res = await getRedirectResult(auth);
        if (res && res.user) {
          console.log("Redirect login successful for:", res.user.email);
          const uDoc = await getDoc(doc(db, "users", res.user.uid));
          if (!uDoc.exists()) {
            let role: "artist" | "client" = "client";
            let roleSubtype: any = undefined;
            
            // Check if there is pending signup info
            const storedPending = localStorage.getItem("pendingSignUpRole");
            if (storedPending) {
              try {
                const parsed = JSON.parse(storedPending);
                role = parsed.role;
                roleSubtype = parsed.roleSubtype;
              } catch(e) {}
              localStorage.removeItem("pendingSignUpRole");
            }

            const newUser: UserProfile = {
              uid: res.user.uid,
              email: res.user.email || "",
              firstName: res.user.displayName?.split(" ")[0] || "",
              lastName: res.user.displayName?.split(" ").slice(1).join(" ") || "",
              artistName: res.user.displayName || "",
              role: role,
              roleSubtype: roleSubtype,
              createdAt: new Date().toISOString(),
              balance: 0,
              reputationScore: 100,
              isCertified: false,
              kycStatus: "none",
              isVip: false,
              isPro: false,
              stats: {
                completedGombos: 0,
                cancelledGombos: 0,
                totalEarned: 0,
                averageRating: 0,
                reviewsCount: 0
              }
            };
            await setDoc(doc(db, "users", res.user.uid), newUser);
          }
        }
      } catch (error) {
        console.error("Auth redirect error:", error);
      }
    }
  },
"""

content = content.replace("loginWithGoogle() {", new_func + "\n  loginWithGoogle() {")

# Save role before redirecting
content = content.replace(
    "await signInWithRedirect(auth, GOOGLE_PROVIDER);",
    "if (pendingSignUpProfile) localStorage.setItem('pendingSignUpRole', JSON.stringify({ role: pendingSignUpProfile.role, roleSubtype: pendingSignUpProfile.roleSubtype })); await signInWithRedirect(auth, GOOGLE_PROVIDER);"
)
content = content.replace(
    "await signInWithRedirect(auth, FACEBOOK_PROVIDER);",
    "if (pendingSignUpProfile) localStorage.setItem('pendingSignUpRole', JSON.stringify({ role: pendingSignUpProfile.role, roleSubtype: pendingSignUpProfile.roleSubtype })); await signInWithRedirect(auth, FACEBOOK_PROVIDER);"
)
content = content.replace(
    "await signInWithRedirect(auth, GITHUB_PROVIDER);",
    "if (pendingSignUpProfile) localStorage.setItem('pendingSignUpRole', JSON.stringify({ role: pendingSignUpProfile.role, roleSubtype: pendingSignUpProfile.roleSubtype })); await signInWithRedirect(auth, GITHUB_PROVIDER);"
)

with open(filepath, 'w') as f:
    f.write(content)
