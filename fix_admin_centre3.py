import re

def fix_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # We replace common full-height and overflow wrappers that the components themselves or AdminCentre wrappers have.
    content = content.replace('"w-full h-full animate-fadeIn text-left"', '"w-full animate-fadeIn text-left"')
    
    # Also "h-full w-full animate-fadeIn text-left"
    content = content.replace('"h-full w-full animate-fadeIn text-left"', '"w-full animate-fadeIn text-left"')
    
    # "h-full w-full afri-container afri-section animate-fadeIn text-left"
    content = content.replace('"h-full w-full afri-container afri-section animate-fadeIn text-left"', '"w-full afri-container afri-section animate-fadeIn text-left"')

    with open(filename, 'w') as f:
        f.write(content)

fix_file('src/components/AdminCentre.tsx')
