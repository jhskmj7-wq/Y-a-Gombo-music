import re

filepath = 'src/firebase.ts'
with open(filepath, 'r') as f:
    content = f.read()

content = re.sub(r'async\s+async\s+handleAuthRedirect', 'async handleAuthRedirect', content)

with open(filepath, 'w') as f:
    f.write(content)
