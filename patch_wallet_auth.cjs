const fs = require('fs');
let code = fs.readFileSync('src/components/AfrigomboWalletDashboard.tsx', 'utf8');

const lockScreenHTML = `
  if (walletPinSettings.pinHash && !isWalletSessionActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center space-y-6">
        <div className="w-20 h-20 bg-[#D4AF37]/10 rounded-full flex items-center justify-center border border-[#D4AF37]/30">
          <Lock className="w-10 h-10 text-[#D4AF37]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white uppercase tracking-widest">🔐 WALLET PROTÉGÉ</h2>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            Votre Ticale Wallet est protégé. Veuillez vous authentifier pour accéder à vos informations sensibles.
          </p>
        </div>
        <button
          onClick={() => requireWalletAuthentication("OUVERTURE WALLET", true)}
          className="px-6 py-3 bg-[#D4AF37] text-zinc-950 font-bold font-mono rounded-xl uppercase text-xs tracking-wider shadow-[0_0_15px_rgba(212,175,55,0.3)]"
        >
          Déverrouiller le Wallet
        </button>
      </div>
    );
  }
`;

// Find where to inject it. Inside `return (` for the main component.
// Wait, the component returns `( <div className="space-y-6 pb-24 ..."> ...`
const returnRegex = /return \(\s*<div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">/m;
code = code.replace(returnRegex, lockScreenHTML + "\n  return (\n    <div className=\"space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto\">");

fs.writeFileSync('src/components/AfrigomboWalletDashboard.tsx', code);
