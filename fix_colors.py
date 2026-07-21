import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Define regex replacements
    replacements = [
        # Backgrounds
        (r'\bbg-black\b', 'bg-afri-bg'),
        (r'\bbg-\[\#0[359]0[359]0[359A]\]\b', 'bg-afri-bg'),
        (r'\bbg-zinc-950\b', 'bg-afri-bg'),
        
        (r'\bbg-zinc-900\b', 'bg-afri-bg-sec'),
        (r'\bbg-zinc-850\b', 'bg-afri-bg-sec'),
        (r'\bbg-\[\#1[148]1[148]1[148]\]\b', 'bg-afri-bg-sec'),
        (r'\bbg-black/40\b', 'bg-afri-bg-sec'),
        (r'\bbg-black/50\b', 'bg-afri-bg-sec'),
        (r'\bbg-zinc-950/50\b', 'bg-afri-bg-sec'),
        
        (r'\bbg-zinc-800\b', 'bg-afri-bg-ter'),
        (r'\bbg-zinc-900/50\b', 'bg-afri-bg-ter'),
        (r'\bbg-zinc-950/60\b', 'bg-afri-bg-ter'),
        (r'\bbg-zinc-950/40\b', 'bg-afri-bg-ter'),
        
        # Gradients (Actions Rapides)
        (r'\bfrom-zinc-950\b', 'from-afri-bg-action'),
        (r'\bto-zinc-900\b', 'to-afri-bg-action'),
        (r'\bfrom-black\b', 'from-afri-bg'),
        (r'\bto-black/0\b', 'to-afri-bg/0'),
        
        # Texts
        (r'\btext-white\b', 'text-afri-text'),
        (r'\btext-zinc-100\b', 'text-afri-text'),
        (r'\btext-zinc-200\b', 'text-afri-text'),
        (r'\btext-zinc-300\b', 'text-afri-text'),
        (r'\btext-\[\#F5F5F5\]\b', 'text-afri-text'),
        (r'\btext-\[\#F2F2F2\]\b', 'text-afri-text'),
        
        (r'\btext-zinc-400\b', 'text-afri-text-sec'),
        (r'\btext-zinc-500\b', 'text-afri-text-sec'),
        (r'\btext-gray-400\b', 'text-afri-text-sec'),
        (r'\btext-gray-500\b', 'text-afri-text-sec'),
        
        # Borders
        (r'\bborder-zinc-900\b', 'border-afri-border'),
        (r'\bborder-zinc-850\b', 'border-afri-border'),
        (r'\bborder-zinc-800\b', 'border-afri-border'),
        (r'\bborder-zinc-700\b', 'border-afri-border'),
        (r'\bborder-white/10\b', 'border-afri-border'),
        (r'\bborder-white/5\b', 'border-afri-border'),
        
        # Group hover text
        (r'\bgroup-hover:text-white\b', 'group-hover:text-afri-text'),
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
