import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Define regex replacements
    replacements = [
        (r'border-zinc-950', 'border-afri-border'),
        (r'bg-zinc-700/80', 'bg-afri-text-muted/30'),
        (r'hover:bg-zinc-650', 'hover:bg-afri-text-muted/50'),
        (r'border-black', 'border-afri-border'),
        (r'text-zinc-550', 'text-afri-text-sec'),
        (r'bg-zinc-700', 'bg-afri-text-muted'),
        (r'bg-zinc-600/10', 'bg-afri-bg-ter/50'),
        (r'border-zinc-600/20', 'border-afri-border'),
        (r'border-zinc-600/55', 'border-afri-border/70'),
        (r'border-zinc-400/30', 'border-afri-border'),
        (r'from-\[\#121214\] via-\[\#08080a\] to-\[\#040405\]', 'from-afri-bg-sec via-afri-bg-ter to-afri-bg-action'),
    ]

    new_content = content
    for pattern, repl in replacements:
        new_content = re.sub(pattern, repl, new_content)
        
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        return True
    return False

process_file('src/components/UserTerrainLandingPage.tsx')
