const fs = require('fs');
let code = fs.readFileSync('src/components/GawaCenter.tsx', 'utf8');

const lines = code.split('\n');
const newLines = [];
let i = 0;
while(i < lines.length) {
  if (i === 44) {
    newLines.push(`  const handleBuyPack = async (pack: GawaPack) => {
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
  };`);
    i = 96; // skip the broken code up to line 96 (inclusive) which is `};`
  } else {
    newLines.push(lines[i]);
  }
  i++;
}

fs.writeFileSync('src/components/GawaCenter.tsx', newLines.join('\n'));
