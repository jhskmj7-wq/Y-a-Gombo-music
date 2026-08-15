const fs = require('fs');
let code = fs.readFileSync('src/lib/GawaEngineService.ts', 'utf8');

if (!code.includes('WalletSecurityService')) {
  code = code.replace(
    'import { db } from "./firebase";',
    'import { db } from "./firebase";\nimport { WalletSecurityService } from "./WalletSecurityService";'
  );
}

// Update purchaseGawaPack signature
code = code.replace(
  'userId: string,\n    packId: string',
  'userId: string,\n    packId: string,\n    walletPin?: string'
);

// Inject verifyPinTransaction
code = code.replace(
  'const userSnap = await transaction.get(userRef);',
  'const userSnap = await transaction.get(userRef);\n        await WalletSecurityService.verifyPinTransaction(transaction, userId, walletPin);'
);

fs.writeFileSync('src/lib/GawaEngineService.ts', code);
