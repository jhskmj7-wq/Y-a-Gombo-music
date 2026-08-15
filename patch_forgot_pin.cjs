const fs = require('fs');
let code = fs.readFileSync('src/components/AfrigomboWalletDashboard.tsx', 'utf8');

const forgotPinHTML = `
              {walletPinSettings.pinHash && (
                <div className="grid grid-cols-2 gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      playSound("click");
                      setPinFlow({
                        mode: "forgot_reset",
                        length: 6,
                        tempPin: "",
                        enteredPin: "",
                        errorMsg: ""
                      });
                    }}
                    className="py-2.5 px-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-amber-400 font-bold text-[10px] uppercase transition-all active:scale-98"
                  >
                    Mot de passe oublié ?
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSound("click");
                      // Assume there is a support state or an action we can take
                      // We can just open the SAO modal if available
                      const supportBtn = document.getElementById("support-trigger-btn");
                      if (supportBtn) supportBtn.click();
                      else alert("Contactez le support SAO pour une assistance immédiate.");
                    }}
                    className="py-2.5 px-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/15 font-bold text-[10px] uppercase transition-all active:scale-98 flex items-center justify-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                    Contacter SAO
                  </button>
                </div>
              )}
`;

code = code.replace(
  '</label>',
  '</label>\n\n              ' + forgotPinHTML
);

fs.writeFileSync('src/components/AfrigomboWalletDashboard.tsx', code);
