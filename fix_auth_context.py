import re

filepath = 'src/AuthContext.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Replace checkRedirect
old_redirect = """    const checkRedirect = async () => {
      try {
        const { getRedirectResult } = await import("firebase/auth");
        await getRedirectResult(auth);
      } catch (err) {
        console.error("Error retrieving Google redirect sign-in result:", err);
      }
    };
    checkRedirect();"""

new_redirect = """    const checkRedirect = async () => {
      try {
        await gomboAuth.handleAuthRedirect();
      } catch (err) {
        console.error("Error retrieving redirect sign-in result:", err);
      }
    };
    checkRedirect();"""

content = content.replace(old_redirect, new_redirect)

# Write back
with open(filepath, 'w') as f:
    f.write(content)

