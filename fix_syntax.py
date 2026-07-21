import re

filepath = 'src/firebase.ts'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace('async   async handleAuthRedirect', 'async handleAuthRedirect')

with open(filepath, 'w') as f:
    f.write(content)
