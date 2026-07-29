import os
import re

def fix_paths(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.ts', '.js')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content.replace('"/public/', '"/')
                new_content = new_content.replace("'/public/", "'/")
                
                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Fixed paths in {path}")

fix_paths('./src')
fix_paths('./server.ts')
