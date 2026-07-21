import re

with open('vite.config.ts', 'r') as f:
    content = f.read()

# Remove the firestore runtimeCaching rule
content = re.sub(r'\{\s*urlPattern:\s*/\^https:\\/\\/firestore\\\.googleapis\\\.com\\/\.\*/i,[\s\S]*?cacheName:\s*\'firestore-data\',\s*\},\s*\}', '', content)
# Also need to clean up any dangling commas if needed, but it's the last element in the array usually
content = re.sub(r',\s*$', '', content)

with open('vite.config.ts', 'w') as f:
    f.write(content)
