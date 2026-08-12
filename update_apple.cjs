const fs = require('fs');
let code = fs.readFileSync('src/firebase.ts', 'utf8');
code = code.replace(
  /async loginWithApple\(\) \{\s*if \(auth && db\) \{\s*try \{\s*await signInWithRedirect\(auth, APPLE_PROVIDER\);\s*return null;\s*\} catch \(error: any\) \{\s*console\.error\("Firebase Apple Login Error:", error\);\s*throw error;\s*\}\s*\}\s*return null;\s*\}/,
  `async loginWithApple() {
    if (auth && db) {
      try {
        let res: any = null;
        try {
          res = await signInWithPopup(auth, APPLE_PROVIDER);
        } catch (popupErr: any) {
          console.warn("signInWithPopup error/blocked for Apple, attempting signInWithRedirect fallback:", popupErr);
          await signInWithRedirect(auth, APPLE_PROVIDER);
          return null; 
        }
        
        if (res && res.user) {
          const userRef = doc(db, "users", res.user.uid);
          const uDoc = await getDoc(userRef);
          const names = typeof res.user.displayName === "string" ? res.user.displayName.split(" ") : ["Artiste", "Afrigombo"];
          const isFounder = res.user.email === "jhs.kmj7@gmail.com";
          const founderPermissions = ["admin", "founder", "dashboard", "users", "verification", "payments", "reports", "settings"];

          if (!uDoc.exists()) {
            let role: "musicien" | "client" | "admin" = isFounder ? "admin" : "client";
            let roleSubtype: any = undefined;
            
            const storedPending = localStorage.getItem("pendingSignUpRole");
            if (storedPending) {
              try {
                const parsed = JSON.parse(storedPending);
                if (parsed.role) role = parsed.role;
                if (parsed.roleSubtype) roleSubtype = parsed.roleSubtype;
              } catch(e) {}
              localStorage.removeItem("pendingSignUpRole");
            }

            const newUserData: any = {
              uid: res.user.uid,
              email: res.user.email || "",
              firstName: names[0] || "",
              lastName: names.slice(1).join(" ") || "",
              displayName: res.user.displayName || "Artiste",
              role: role,
              createdAt: new Date().toISOString(),
              photoURL: res.user.photoURL || "",
              walletBalance: 0,
              isFounder: isFounder,
              premium: isFounder ? true : false,
              premiumUntil: isFounder ? "2099-12-31T23:59:59.000Z" : null,
              subscriptionType: isFounder ? "elite" : "none",
              status: "active"
            };
            if (roleSubtype) {
              newUserData.roleSubtype = roleSubtype;
            }
            if (isFounder) {
              newUserData.adminPermissions = founderPermissions;
              newUserData.superFounder = true;
            }
            
            await setDoc(userRef, newUserData);
          } else {
            if (isFounder && !uDoc.data().isFounder) {
              await updateDoc(userRef, {
                isFounder: true,
                adminPermissions: founderPermissions,
                superFounder: true,
                premium: true,
                premiumUntil: "2099-12-31T23:59:59.000Z",
                subscriptionType: "elite"
              });
            }
          }
          return res.user;
        }
      } catch (error: any) {
        console.error("Firebase Apple Login Error:", error);
        throw error;
      }
    }
    return null;
  }`
);
fs.writeFileSync('src/firebase.ts', code);
