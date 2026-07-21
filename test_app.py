import re

with open('src/AuthContext.tsx', 'r') as f:
    content = f.read()

# check for any useEffect without dependency arrays or bad dependency arrays
matches = re.findall(r'useEffect\(\(\) => \{.*?\},\s*\[.*?\]\)', content, re.DOTALL)
for match in matches:
    print(match)

