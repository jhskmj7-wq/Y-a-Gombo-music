import os
import re

def fix_file(filename):
    if not os.path.exists(filename):
        print(f"{filename} not found")
        return
    with open(filename, 'r') as f:
        content = f.read()
    
    # We remove 'overflow-y-auto' or similar from the main wrapper of these components
    # Just remove overflow-y-auto, overflow-auto, overscroll-contain
    content = re.sub(r'overflow-y-auto', '', content)
    content = re.sub(r'overflow-auto', '', content)
    content = re.sub(r'overscroll-contain', '', content)
    # Also remove min-h-screen or h-full from the main wrapping div if it interferes
    # Wait, just removing overflow-y-auto is usually enough to stop them from capturing the scroll.
    
    with open(filename, 'w') as f:
        f.write(content)

components_to_fix = [
    'src/components/AfrigomboWalletDashboard.tsx',
    'src/components/NearbyPageView.tsx',
    'src/components/UserEditProfileView.tsx',
    'src/components/UserHeritage.tsx', # Just guessing names
    'src/components/UserNotifications.tsx',
    'src/components/UserSettings.tsx',
]

for c in components_to_fix:
    fix_file(c)
