import re

def fix_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # The prompt explicitly specifies these views: Wallet, Profil, Notifications, Nearby, Paramètres, Mon Héritage, Modifier Profil
    # Let's clean up general overflow wrappers inside AdminCentre.
    
    # className="h-full w-full animate-fadeIn text-left" => className="w-full animate-fadeIn text-left"
    content = content.replace('"h-full w-full animate-fadeIn text-left"', '"w-full animate-fadeIn text-left"')
    
    # className="afri-container h-full w-full overflow-y-auto overflow-x-hidden pt-4 xs:pt-6 scrollbar-none"
    content = content.replace('"afri-container h-full w-full overflow-y-auto overflow-x-hidden pt-4 xs:pt-6 scrollbar-none"', '"afri-container w-full pt-4 xs:pt-6"')

    # className="w-full h-full min-h-screen flex flex-col justify-between p-0 m-0 border-none rounded-none bg-afri-bg animate-fadeIn text-left"
    content = content.replace('"w-full h-full min-h-screen flex flex-col justify-between p-0 m-0 border-none rounded-none bg-afri-bg animate-fadeIn text-left"', '"w-full flex flex-col justify-between p-0 m-0 border-none rounded-none bg-afri-bg animate-fadeIn text-left"')
    
    # className="fixed inset-0 bg-afri-bg/98 backdrop-blur-md z-[999] flex flex-col items-center p-4 sm:p-6 pt-24 sm:pt-28 pb-10 space-y-4 overflow-y-auto overscroll-contain touch-pan-y"
    # This is a fixed overlay dialog, likely needs overflow-y-auto, so leave it.
    
    # What about specific matches for user_wallet, user_edit_profile, etc.?
    # Wait, AdminCentre renders these conditionally. I'll just remove `overflow-y-auto` from their wrappers if they have it.
    
    # className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[9px] sm:text-[10px]"
    
    # Find all occurrences of overflow-y-auto and evaluate.
    
    with open(filename, 'w') as f:
        f.write(content)

fix_file('src/components/AdminCentre.tsx')
