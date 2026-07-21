import re

filepath = 'src/firebase.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Replace loginWithGoogle
content = re.sub(
    r'const isMobile = /Android\|iPhone\|iPad\|iPod/i\.test\(navigator\.userAgent\);\s*if \(isMobile\) \{.*?\s*await signInWithRedirect\(auth, GOOGLE_PROVIDER\);\s*return;\s*// The page will redirect\s*\}',
    '',
    content,
    flags=re.DOTALL
)

# Replace loginWithFacebook
content = re.sub(
    r'const isMobile = /Android\|iPhone\|iPad\|iPod/i\.test\(navigator\.userAgent\);\s*if \(isMobile\) \{.*?\s*await signInWithRedirect\(auth, FACEBOOK_PROVIDER\);\s*return;\s*\}',
    '',
    content,
    flags=re.DOTALL
)

# Replace loginWithGitHub
content = re.sub(
    r'const isMobile = /Android\|iPhone\|iPad\|iPod/i\.test\(navigator\.userAgent\);\s*if \(isMobile\) \{.*?\s*await signInWithRedirect\(auth, GITHUB_PROVIDER\);\s*return;\s*\}',
    '',
    content,
    flags=re.DOTALL
)

with open(filepath, 'w') as f:
    f.write(content)

