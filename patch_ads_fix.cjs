const fs = require('fs');
let code = fs.readFileSync('src/services/GomboAdsService.ts', 'utf8');

code = code.replace(
  /id: notifId,/,
  'id: `notif_${campaignId}`,'
);

fs.writeFileSync('src/services/GomboAdsService.ts', code);
