import re

def fix_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    old_class = 'className={`flex-1 w-full box-border overflow-y-auto overflow-x-hidden overscroll-contain pb-[env(safe-area-inset-bottom,20px)] p-3`}'
    new_class = 'className={`flex-1 w-full box-border overflow-x-hidden ${scrollable ? "overflow-y-auto overscroll-contain" : "overflow-hidden"} pb-safe p-3 pb-24`}'
    # Wait, the prompt says pb-safe. I can just use inline style for safe-area if standard tailwind pb-safe isn't there, or keep what I had.
    # Let's restore the exact classes requested.

    # First, let's fix the parent div. "Le div parent devient uniquement : display:flex, flex-direction:column, height:100%, width:100%, overflow:hidden"
    # Existing div: className={`flex flex-col h-full w-full overflow-hidden bg-afri-bg text-afri-text font-sans select-none ${className}`}
    # It is already correct!

    # Second, fix <main>.
    # <main className={`flex-1 w-full box-border overflow-x-hidden ${scrollable ? "overflow-y-auto overscroll-contain" : "overflow-hidden"} p-3 pb-28`}
    
    # We replace it with:
    # <main className={`flex-1 w-full box-border overflow-x-hidden ${scrollable ? "overflow-y-auto overscroll-contain" : "overflow-hidden"} p-3 pb-[env(safe-area-inset-bottom,100px)]`}

    # Let's just do a string replacement on AndroidPageLayout.tsx
