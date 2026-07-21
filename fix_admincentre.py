import re

filepath = 'src/components/AdminCentre.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Replace <SettingsModal isOpen={true} onClose={() => goBackMenu()} />
content = content.replace(
    '<SettingsModal \n                    isOpen={true} \n                    onClose={() => goBackMenu()}\n                  />',
    '<SettingsModal \n                    isOpen={true} \n                    onClose={() => goBackMenu()}\n                    onNavigateToFounder={() => setActiveMenu("super_admin")}\n                  />'
)

with open(filepath, 'w') as f:
    f.write(content)
