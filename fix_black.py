import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    replacements = [
        (r'to-black', 'to-afri-bg'),
        (r'to-black/30', 'to-afri-bg/30'),
        (r'to-black/25', 'to-afri-bg/25'),
        (r'via-black/45', 'via-afri-bg/45'),
        (r'via-black', 'via-afri-bg'),
        (r'from-\[\#070707\]', 'from-afri-bg-ter'),
        (r'from-\[\#00171d\]', 'from-afri-bg-ter'),
        (r'from-zinc-900', 'from-afri-bg-sec'),
        (r'via-zinc-950', 'via-afri-bg'),
    ]

    new_content = content
    for pattern, repl in replacements:
        new_content = re.sub(pattern, repl, new_content)
        
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        return True
    return False

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

