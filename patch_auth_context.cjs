const fs = require('fs');
let code = fs.readFileSync('src/AuthContext.tsx', 'utf8');

if (!code.includes('NotificationService.initializeFCM')) {
  code = code.replace(
    'import { db, auth } from "./firebase";',
    'import { db, auth } from "./firebase";\nimport { NotificationService } from "./lib/NotificationService";'
  );
  
  // Find where currentUser is set and initialize FCM
  const target = 'setCurrentUser(user);';
  code = code.replace(
    target,
    'setCurrentUser(user);\n      if (user) NotificationService.initializeFCM(user.uid);'
  );
  
  fs.writeFileSync('src/AuthContext.tsx', code);
}
