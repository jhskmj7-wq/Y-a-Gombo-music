const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('NotificationService.initializeFCM')) {
  code = code.replace(
    'import { AuthProvider } from "./AuthContext";',
    'import { AuthProvider } from "./AuthContext";\nimport { NotificationService } from "./lib/NotificationService";'
  );
  
  // We can't easily put it in App.tsx without knowing when currentUser is available. 
  // Let's put it in AuthContext instead.
}
