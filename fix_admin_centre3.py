import re

with open("src/components/AdminCentre.tsx", "r") as f:
    content = f.read()

target = '      <div className="absolute top-0 left-0 w-full z-[100]"><GlobalNotificationBanner /></div>'
replacement = '      <div className="fixed top-0 left-0 w-full z-[9999]"><GlobalNotificationBanner /></div>'
if target in content:
    content = content.replace(target, replacement)
else:
    print("Not found")

with open("src/components/AdminCentre.tsx", "w") as f:
    f.write(content)
