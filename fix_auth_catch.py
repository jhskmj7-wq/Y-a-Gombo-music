import re

filepath = 'src/AuthContext.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# find: if (firebaseUser) { setAuthLoading(true); try {
# and replace with: if (firebaseUser) { setCurrentUser(firebaseUser); setAuthLoading(true); try {
content = content.replace(
    'if (firebaseUser) {\n        setAuthLoading(true);\n        try {',
    'if (firebaseUser) {\n        setCurrentUser(firebaseUser);\n        setAuthLoading(true);\n        try {'
)

# remove setCurrentUser(firebaseUser); from inside the try block
content = content.replace('          setCurrentUser(firebaseUser);\n', '')

with open(filepath, 'w') as f:
    f.write(content)

