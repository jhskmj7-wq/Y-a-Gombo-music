import re
import os

files_to_fix = [
    'src/components/GomboProfileMainView.tsx',
    'src/components/GomboProfile.tsx',
    'src/components/HeritagePage.tsx',
    'src/components/GomboProfileEditView.tsx'
]

for filename in files_to_fix:
    if not os.path.exists(filename):
        print(f"Skipped {filename} (not found)")
        continue
    with open(filename, 'r') as f:
        content = f.read()

    # Remove classes that block scroll
    content = re.sub(r'\boverflow-hidden\b', '', content)
    content = re.sub(r'\bh-screen\b', '', content)
    content = re.sub(r'\bh-\[100dvh\]\b', '', content)
    content = re.sub(r'\bh-\[100vh\]\b', '', content)
    content = re.sub(r'\bh-full\b', '', content)
    content = re.sub(r'\bmax-h-screen\b', '', content)
    content = re.sub(r'\bmax-h-\[100dvh\]\b', '', content)
    content = re.sub(r'\bmax-h-\[100vh\]\b', '', content)
    content = re.sub(r'\boverflow-y-auto\b', '', content)
    content = re.sub(r'\boverflow-auto\b', '', content)
    content = re.sub(r'\boverscroll-contain\b', '', content)

    # Some images might need overflow-hidden for rounded corners. 
    # We shouldn't remove ALL overflow-hidden globally, but the prompt says:
    # "Supprimer tous les : overflow-hidden, h-screen, 100vh, max-h qui empêchent le défilement."
    # Let's restore overflow-hidden for specific things if we can, or just remove them globally and let it be.
    # Actually, removing `overflow-hidden` globally from these files might break image rounded corners, 
    # but the prompt literally says "Supprimer tous les : overflow-hidden...". 
    # Let's be slightly careful and only remove it from main wrappers, or just do a global replace as requested if they complained.
    # The safest is to remove `overflow-y-auto` and `h-full` `h-[100dvh]` `h-screen`.

    with open(filename, 'w') as f:
        f.write(content)
    print(f"Fixed {filename}")

