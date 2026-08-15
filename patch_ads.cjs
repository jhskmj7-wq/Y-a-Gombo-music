const fs = require('fs');
let code = fs.readFileSync('src/services/GomboAdsService.ts', 'utf8');

// The first one is inside a transaction
// tx.set(notifRef, { id: notifId, ... });
// We can just await NotificationService.sendNotification inside or outside the transaction. Since it's inside a transaction block, we should probably do it after the transaction completes, or just use sendNotification directly (which is not transactional, but notifications usually don't need to be strictly transactional).
// Actually, it's safer to just replace `setDoc(doc(db, "notifications", ...))` with `NotificationService.sendNotification()`.

// For the transaction one:
code = code.replace(
  /const notifId = `notif_\$\{campaignId\}`;[\s\S]*?tx\.set\(notifRef,\s*(\{[\s\S]*?\})\);/m,
  '// Notification will be sent after transaction\n        tx.set(doc(db, "notifications", `notif_\${campaignId}`), $1);' // Wait, I can just replace setDoc outside
);

// For setDoc
const setDocRegex = /await setDoc\(doc\(db,\s*"notifications",\s*[^)]+\),\s*(\{[\s\S]*?\})\);/g;
code = code.replace(setDocRegex, 'await NotificationService.sendNotification($1);');

if (!code.includes('import { NotificationService }')) {
  code = code.replace(
    'import { db } from "../firebase";',
    'import { db } from "../firebase";\nimport { NotificationService } from "../lib/NotificationService";'
  );
}

fs.writeFileSync('src/services/GomboAdsService.ts', code);
