const fs = require('fs');
let code = fs.readFileSync('src/components/GawaCenter.tsx', 'utf8');

// The file currently has a broken state. Let's recreate it from the original file if we can,
// or just replace the block.
// From `const executeBuyPack` to `const handleClaimMission`
const executeBuyRegex = /const executeBuyPack = async \([\s\S]*?const handleClaimMission = async/s;
code = code.replace(executeBuyRegex, 'const handleClaimMission = async');

// Wait, handleBuyPack is broken right now. Let's find it.
const buyPackBrokenRegex = /try \{\s*const status = await WalletSecurityService\.getWalletSecurityStatus[\s\S]*?executeBuyPack\(pack\);\s*\};\s*const handleClaimMission = async/s;
code = code.replace(buyPackBrokenRegex, `
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
  };

  const handleClaimMission = async`);

fs.writeFileSync('src/components/GawaCenter.tsx', code);
