with open("src/components/AdminCentre.tsx", "r") as f:
    content = f.read()

content = content.replace('import GlobalNotificationBanner from "./GlobalNotificationBanner";', '')
content = content.replace('      <div className="fixed top-0 left-0 w-full z-[9999]"><GlobalNotificationBanner /></div>', '')

with open("src/components/AdminCentre.tsx", "w") as f:
    f.write(content)
