const fs = require('fs');
let code = fs.readFileSync('src/components/AfrigomboWalletDashboard.tsx', 'utf8');

if (!code.includes('useWalletSecurity')) {
  code = code.replace(
    'import { SupportService } from "../services/SupportService";',
    'import { SupportService } from "../services/SupportService";\nimport { useWalletSecurity } from "../context/WalletSecurityContext";'
  );
  
  // Inject the hook at the start of the component
  code = code.replace(
    'export default function AfrigomboWalletDashboard() {',
    'export default function AfrigomboWalletDashboard() {\n  const { requireWalletAuthentication, isWalletSessionActive } = useWalletSecurity();'
  );
  
  // Rewrite startSensitiveOperation
  const newStartSensitiveOperation = `
  const startSensitiveOperation = async (
    type: "withdraw" | "transfer",
    amountVal: number,
    detailsText: string,
    recipientText: string,
    executeFn: () => Promise<void>
  ) => {
    const isAuth = await requireWalletAuthentication(type.toUpperCase(), true);
    if (!isAuth) return;
    executeFn();
  };
  `;
  
  // Replace old startSensitiveOperation using Regex
  // It starts with `const startSensitiveOperation = (` and ends before `const handleWithdrawRequest = async`
  const oldOpRegex = /const startSensitiveOperation = \([\s\S]*?const handleWithdrawRequest = async/m;
  code = code.replace(oldOpRegex, newStartSensitiveOperation.trim() + "\n\n  const handleWithdrawRequest = async");
  
  fs.writeFileSync('src/components/AfrigomboWalletDashboard.tsx', code);
}
