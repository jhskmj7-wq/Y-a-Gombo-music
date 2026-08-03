import re

def fix_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # The prompt: "Supprimer tous les overflow-hidden inutiles sur les conteneurs principaux."
    # Let's remove `overflow-hidden` from the root div and the main in AdminCentre.tsx
    
    # 1. Root div:
    # <div className={`flex h-full h-[100dvh] w-full max-w-full box-border bg-afri-bg text-afri-text font-sans antialiased overflow-hidden uppercase-none`}>
    content = content.replace('antialiased overflow-hidden uppercase-none', 'antialiased uppercase-none')

    # 2. Main content area:
    # <main className="flex-1 min-w-0 min-h-0 w-full max-w-full bg-afri-bg flex flex-col overflow-hidden">
    content = content.replace('className="flex-1 min-w-0 min-h-0 w-full max-w-full bg-afri-bg flex flex-col overflow-hidden"', 'className="flex-1 min-w-0 min-h-0 w-full max-w-full bg-afri-bg flex flex-col"')

    with open(filename, 'w') as f:
        f.write(content)

fix_file('src/components/AdminCentre.tsx')
