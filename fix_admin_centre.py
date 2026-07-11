import re

with open("src/components/AdminCentre.tsx", "r") as f:
    content = f.read()

content = re.sub(
    r"<AdminNotifications adminEmail=\{currentUserProfile\?\.email \|\| \"Admin\"\} \/>\s*onBroadcast=\{handleBroadcast\}\s*notificationsList=\{realNotifications\}\s*onDeleteNotification=\{handleDeleteNotification\}\s*audioSynth=\{audioSynth\}\s*\/>",
    r'<AdminNotifications adminEmail={currentUserProfile?.email || "Admin"} />',
    content
)

with open("src/components/AdminCentre.tsx", "w") as f:
    f.write(content)

