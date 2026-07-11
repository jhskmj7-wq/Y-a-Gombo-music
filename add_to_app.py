with open("src/App.tsx", "r") as f:
    content = f.read()

import_stmt = 'import GlobalNotificationBanner from "./components/GlobalNotificationBanner";\n'

if import_stmt not in content:
    content = content.replace('import BackgroundMusic from "./components/BackgroundMusic";', import_stmt + 'import BackgroundMusic from "./components/BackgroundMusic";')

# Inject into MainAppLayout?
# Ah, actually, if I inject it into MainAppLayout, it will overlay on everything.
# Let's inject it in MainAppLayout instead of App because App has the splash screen and other things.
# Wait, let's inject it into MainAppLayout.
