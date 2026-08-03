import re

def fix_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Remove `h-full` and `overflow-y-auto` from wrappers of user pages
    
    # 1. `<div className="w-full h-full animate-fadeIn">`
    content = content.replace('className="w-full h-full animate-fadeIn"', 'className="w-full animate-fadeIn"')

    # 2. Let's see if there are any other `h-full` for activeMenus
    
    with open(filename, 'w') as f:
        f.write(content)

fix_file('src/components/AdminCentre.tsx')
