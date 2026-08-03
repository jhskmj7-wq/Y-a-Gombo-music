import re
import os

def fix_file(filename):
    if not os.path.exists(filename):
        return
    with open(filename, 'r') as f:
        content = f.read()

    # Remove overflow-y-auto
    content = re.sub(r'overflow-y-auto', '', content)
    content = re.sub(r'overflow-auto', '', content)
    # Remove h-full from the main container if it blocks scroll
    # Actually just remove overflow-y-auto so the content flows down.
    
    with open(filename, 'w') as f:
        f.write(content)

fix_file('src/components/SettingsModal.tsx')
