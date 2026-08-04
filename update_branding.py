import os
import re

def replace_in_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace AFRIGOMBO with AFRIGOMBO ELITE, but only if it's not already AFRIGOMBO ELITE
        # Avoid replacing in URLs and some other patterns
        def replacement(match):
            full_match = match.group(0)
            if "ELITE" in full_match:
                return full_match
            return full_match.replace("AFRIGOMBO", "AFRIGOMBO ELITE")

        # Regex to find AFRIGOMBO not followed by ELITE
        # Also avoid URLs (preceded by http or https or slash)
        # Using a simpler approach: only replace in strings that look like text or labels
        
        new_content = re.sub(r'(?<![/\w])AFRIGOMBO(?!\s*ELITE)(?!\.\w)', 'AFRIGOMBO ELITE', content)
        
        if new_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {file_path}")
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

exclude_dirs = {'node_modules', '.git', 'dist'}
exclude_files = {'package-lock.json', 'bun.lock'}

for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in exclude_dirs]
    for file in files:
        if file in exclude_files:
            continue
        if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.html', '.json', '.md', '.css')):
            replace_in_file(os.path.join(root, file))
