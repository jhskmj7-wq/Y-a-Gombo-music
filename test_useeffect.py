import re

with open('src/components/UserTerrainLandingPage.tsx', 'r') as f:
    content = f.read()

matches = re.findall(r'useEffect\(\(\) => \{.*?\},\s*\[.*?\]\)', content, re.DOTALL)
for match in matches:
    print("MATCH:", match)

