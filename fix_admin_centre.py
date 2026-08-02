import re

with open('src/components/AdminCentre.tsx', 'r') as f:
    content = f.read()

# Nearby
content = content.replace(
    'className={activeMenu === "nearby" ? "h-full w-full overflow-hidden animate-fadeIn text-left" : "hidden"}',
    'className={activeMenu === "nearby" ? "h-full w-full animate-fadeIn text-left" : "hidden"}'
)

# User terrain
content = content.replace(
    'className={activeMenu === "user_terrain" ? "h-full w-full overflow-y-auto overscroll-contain overflow-x-hidden afri-container afri-section scrollbar-none animate-fadeIn text-left [-webkit-overflow-scrolling:touch] touch-pan-y" : "hidden"}',
    'className={activeMenu === "user_terrain" ? "h-full w-full afri-container afri-section animate-fadeIn text-left" : "hidden"}'
)

# Other tabs?
content = content.replace(
    'className={`h-full w-full overflow-y-auto overscroll-contain overflow-x-hidden scrollbar-none [-webkit-overflow-scrolling:touch] ${',
    'className={`h-full w-full ${'
)

with open('src/components/AdminCentre.tsx', 'w') as f:
    f.write(content)
