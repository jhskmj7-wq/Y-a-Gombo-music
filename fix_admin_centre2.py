import re

with open("src/components/AdminCentre.tsx", "r") as f:
    content = f.read()

# 1. Add import
if "import GlobalNotificationBanner" not in content:
    content = content.replace('import ThroneCinematicIntro from "./admin/ThroneCinematicIntro";', 'import ThroneCinematicIntro from "./admin/ThroneCinematicIntro";\nimport GlobalNotificationBanner from "./GlobalNotificationBanner";')

# 2. Inject component
if "<GlobalNotificationBanner />" not in content:
    target = '    <div className={`flex h-screen w-full max-w-full box-border overflow-x-hidden ${darkMode ? "bg-[#050505] text-[#F5F5F5]" : "bg-[#F9FBFA] text-[#111]"} font-sans antialiased overflow-hidden uppercase-none`}>'
    replacement = target + '\n      <div className="absolute top-0 left-0 w-full z-[100]"><GlobalNotificationBanner /></div>'
    content = content.replace(target, replacement)

with open("src/components/AdminCentre.tsx", "w") as f:
    f.write(content)
