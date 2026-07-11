with open("src/App.tsx", "r") as f:
    content = f.read()

import_stmt = 'import GlobalNotificationBanner from "./components/GlobalNotificationBanner";\n'

if import_stmt not in content:
    content = import_stmt + content

target = '      <LivingInteractions />'
replacement = '      <div className="fixed top-0 left-0 w-full z-[9999]"><GlobalNotificationBanner /></div>\n      <LivingInteractions />'
if target in content:
    content = content.replace(target, replacement)
    print("Injected")

with open("src/App.tsx", "w") as f:
    f.write(content)
