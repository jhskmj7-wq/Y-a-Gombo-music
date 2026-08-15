const fs = require('fs');
let code = fs.readFileSync('src/components/NotificationCenter.tsx', 'utf8');

// Update getDeepLinkLabel
code = code.replace(
  'case "support_received": return "Coin Bâtisseurs";',
  'case "support_received": return "Coin Bâtisseurs";\n      case "gawa": return "Centre Gawa";\n      case "lot": return "Mes lots";\n      case "security":\n      case "SÉCURITÉ": return "Paramètres sécurité";'
);

// Update triggerDeepLink
code = code.replace(
  '    } else if (type === "premium_activated") {',
  '    } else if (type === "gawa") {\n      onNavigateTo("user_gawa", relatedId);\n    } else if (type === "lot") {\n      onNavigateTo("user_lots", relatedId);\n    } else if (type === "security" || type === "SÉCURITÉ") {\n      onNavigateTo("user_settings", relatedId);\n    } else if (type === "premium_activated") {'
);

fs.writeFileSync('src/components/NotificationCenter.tsx', code);
