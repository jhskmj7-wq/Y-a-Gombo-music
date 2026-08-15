const fs = require('fs');
let code = fs.readFileSync('src/firebase.ts', 'utf8');

// Replace gomboDB.publishNotification
// First, import NotificationService
if (!code.includes('import { NotificationService } from "./lib/NotificationService";')) {
  code = code.replace(
    'import { getFirestore',
    'import { NotificationService } from "./lib/NotificationService";\nimport { getFirestore'
  );
}

const publishRegex = /async publishNotification\(notif: Partial<GomboNotification>\) \{[\s\S]*?async createFounderNotification/m;

const newPublish = `async publishNotification(notif: Partial<GomboNotification>) {
    await NotificationService.sendNotification(notif);
  },

  async createFounderNotification`;

code = code.replace(publishRegex, newPublish);

fs.writeFileSync('src/firebase.ts', code);
