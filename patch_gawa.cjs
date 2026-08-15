const fs = require('fs');
let code = fs.readFileSync('src/components/GawaCenter.tsx', 'utf8');

if (code.includes('showPinModal') || code.includes('WalletSecurityService')) {
  // First, remove the custom modal states and WalletSecurityService import
  code = code.replace(
    'import { WalletSecurityService } from "../lib/WalletSecurityService";\n',
    'import { useWalletSecurity } from "../context/WalletSecurityContext";\n'
  );
  
  code = code.replace(
    'const [error, setError] = useState<string | null>(null);',
    'const [error, setError] = useState<string | null>(null);\n  const { requireWalletAuthentication } = useWalletSecurity();'
  );
  
  // Remove states
  code = code.replace(/  \/\/ Security \/ PIN confirmation states\n.*?setPinError\(""\);\n/s, '');
  
  // Rewrite handleBuyPack
  const buyPackRegex = /const handleBuyPack = async \(pack: GawaPack\) => \{.*?\};\n\n  const executeBuyPack = async \(pack: GawaPack\) => \{/s;
  const newBuyPack = `const handleBuyPack = async (pack: GawaPack) => {
    if (!currentUser?.uid) return;
    
    // Gawa Pack requires PIN
    const isAuth = await requireWalletAuthentication("ACHAT GAWA", true);
    if (!isAuth) return;
    
    setPurchasing(true);
    setError(null);
    try {
      const res = await GawaEngineService.purchaseGawaPack(currentUser.uid, pack.id);
      if (res.success) {
        playSound("success");
        setSuccessDetails({ pack, newBalance: res.balanceAfterGawa });
        // Close sheet after 3 seconds
        setTimeout(() => setIsOpen(false), 3000);
      } else {
        playSound("error");
        setError(res.error || "Erreur lors de l'achat.");
      }
    } catch (err: any) {
      playSound("error");
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setPurchasing(false);
    }
  };

  const handleClaimMission = async`;
  
  code = code.replace(/const handleBuyPack = async \(pack: GawaPack\) => \{[\s\S]*?const handleClaimMission = async/s, newBuyPack);
  
  // Remove the modal JSX
  code = code.replace(/\{\/\* 🔐 CONFIRMATION WALLET PIN OVERLAY \*\/\}.*?\n      \}\)/s, '');
  
  fs.writeFileSync('src/components/GawaCenter.tsx', code);
}
