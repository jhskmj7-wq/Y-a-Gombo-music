import re

def fix_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # The div parent becomes display:flex, flex-direction:column, height:100%, width:100%, overflow:hidden
    # Existing: className={`flex flex-col h-full w-full overflow-hidden bg-afri-bg text-afri-text font-sans select-none ${className}`}
    # We will remove overflow-y-auto overscroll-contain from the main, and ensure the correct classes.
    
    # Let's replace the main tag classes:
    # From: className={`flex-1 w-full box-border overflow-x-hidden ${scrollable ? "overflow-y-auto overscroll-contain" : "overflow-hidden"} p-3 pb-28`}
    # To: className={`flex-1 w-full box-border overflow-y-auto overflow-x-hidden overscroll-contain pb-[env(safe-area-inset-bottom)] p-3 ${className}`} or something. The prompt says: flex:1, overflow-y:auto, overflow-x:hidden, overscroll-contain, -webkit-overflow-scrolling:touch, touch-action:pan-y, pb-safe
    
    old_main_class = 'className={`flex-1 w-full box-border overflow-x-hidden ${scrollable ? "overflow-y-auto overscroll-contain" : "overflow-hidden"} p-3 pb-28`}'
    new_main_class = 'className={`flex-1 w-full box-border overflow-y-auto overflow-x-hidden overscroll-contain pb-[env(safe-area-inset-bottom,20px)] p-3`}'
    
    content = content.replace(old_main_class, new_main_class)

    with open(filename, 'w') as f:
        f.write(content)

fix_file('src/components/layout/AndroidPageLayout.tsx')
