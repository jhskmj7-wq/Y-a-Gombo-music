import re

def fix_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Find the main App wrapper:
    # <div className="h-full h-[100dvh] w-full overflow-x-hidden font-sans antialiased transition-colors duration-300 bg-afri-bg text-afri-text flex flex-col">
    # Replace h-full h-[100dvh] and flex flex-col if they interfere, but actually h-[100dvh] flex flex-col is correct for a single-page app where AndroidPageLayout handles scrolling internally.
    # Wait, AndroidPageLayout handles scrolling internally in <main>. So App.tsx having h-[100dvh] and flex-col is perfectly fine. The issue might be overflow-hidden, but we checked and it's overflow-x-hidden.
    
    # Are there any overflow-hidden in App.tsx?
    if 'overflow-hidden' in content and 'overflow-x-hidden' not in content:
        pass # Handle if needed
    
    # Look for overflow-y-hidden or overflow-hidden
    # CompleteProfileView has:
    # <div className="w-full h-full h-[100dvh] bg-afri-bg flex items-center justify-center py-6 overflow-y-auto overscroll-contain touch-pan-y px-4 font-sans select-none">
    # That is fine because it's a standalone view outside AdminCentre.

    # Wait, is there any overflow-hidden? Let's do a strict replacement just in case.
    content = content.replace("overflow-hidden", "overflow-x-hidden")
    content = content.replace("overflow-x-x-hidden", "overflow-x-hidden") # fix accidental double replace
    
    with open(filename, 'w') as f:
        f.write(content)

fix_file('src/App.tsx')
