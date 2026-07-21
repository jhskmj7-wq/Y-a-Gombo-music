import re

with open('src/firebase.ts', 'r') as f:
    content = f.read()

# Let's inspect the loginWithGoogle function
match = re.search(r'loginWithGoogle\(\) \{.*?(?=loginWithFacebook)', content, re.DOTALL)
if match:
    print(match.group(0))
