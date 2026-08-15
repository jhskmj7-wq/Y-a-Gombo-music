const fs = require('fs');
let code = fs.readFileSync('src/components/AfrigomboWalletDashboard.tsx', 'utf8');

// Inside handlePinSubmit
const handleForgotTarget = 'if (mode === "create_step1") {';
const handleForgotCode = `if (mode === "forgot_reset") {
      setProcessing(true);
      try {
        await WalletSecurityService.requestPinReset(uid);
        playSound("success");
        setPinFlow({ mode: "idle", length: 6, tempPin: "", enteredPin: "", errorMsg: "" });
        alert("Demande de réinitialisation envoyée à SAO. Un administrateur va traiter votre requête.");
      } catch (e: any) {
        playSound("error");
        setPinFlow(prev => ({ ...prev, enteredPin: "", errorMsg: e.message || "Erreur de demande." }));
      } finally {
        setProcessing(false);
      }
      return;
    }
    
    if (mode === "create_step1") {`;

code = code.replace(handleForgotTarget, handleForgotCode);

// Add to the rendering texts
code = code.replace(
  '{pinFlow.mode === "enable_verify" && "Confirmer votre PIN"}',
  '{pinFlow.mode === "enable_verify" && "Confirmer votre PIN"}\n                    {pinFlow.mode === "forgot_reset" && "Code Oublié"}'
);

code = code.replace(
  '{pinFlow.mode === "enable_verify" && "Saisissez votre code secret actuel pour activer."}',
  '{pinFlow.mode === "enable_verify" && "Saisissez votre code secret actuel pour activer."}\n                    {pinFlow.mode === "forgot_reset" && "Pour protéger votre Wallet, l\'ancien code ne peut être récupéré. Confirmez (000000) pour alerter SAO."}'
);

fs.writeFileSync('src/components/AfrigomboWalletDashboard.tsx', code);
