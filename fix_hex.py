import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Define regex replacements
    replacements = [
        (r'text-\[\#[Ff][0-9A-Fa-f]{5}\]', 'text-afri-text'),
        (r'bg-\[\#[0-9A-Fa-f]{6}\]', 'bg-afri-bg-sec'),
        (r'from-zinc-950', 'from-afri-bg-action'),
        (r'to-zinc-900', 'to-afri-bg-action'),
        (r'text-zinc-[123]00', 'text-afri-text'),
        (r'text-zinc-[456]00', 'text-afri-text-sec'),
        (r'bg-zinc-[89]00', 'bg-afri-bg-sec'),
        (r'bg-zinc-950', 'bg-afri-bg'),
        (r'bg-black', 'bg-afri-bg'),
        (r'text-white', 'text-afri-text'),
        (r'group-hover:text-white', 'group-hover:text-afri-text'),
        (r'border-zinc-[789]00', 'border-afri-border'),
    ]

    new_content = content
    for pattern, repl in replacements:
        new_content = re.sub(pattern, repl, new_content)
        
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        return True
    return False

modified_count = 0
for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            if process_file(os.path.join(root, file)):
                modified_count += 1

print(f"Modified {modified_count} files.")
