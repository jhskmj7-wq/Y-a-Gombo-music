const fs = require('fs');
let content = fs.readFileSync('src/components/AdminCentre.tsx', 'utf-8');

const actionButtons = `
                    {/* BOUTONS D'ACTIONS RÉELS */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-4">
                      <button 
                        onClick={() => {
                          setActiveMenu("user_edit_profile");
                          try { audioSynth.playValidationSuccess(); } catch(e) {}
                        }}
                        className="px-5 py-2.5 bg-[#111111] border border-zinc-700 hover:border-[#D4AF37] text-white rounded-xl text-[10px] font-mono uppercase tracking-wider font-bold transition-all active:scale-95"
                      >
                        Modifier Profil
                      </button>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          addToTerminal("[PARTAGE] Lien du profil copié avec succès !");
                          try { audioSynth.playValidationSuccess(); } catch(e) {}
                        }}
                        className="px-5 py-2.5 bg-[#111111] border border-zinc-700 hover:border-[#D4AF37] text-white rounded-xl text-[10px] font-mono uppercase tracking-wider font-bold transition-all active:scale-95 flex items-center gap-2"
                      >
                        <Share2 className="w-3 h-3" /> Partager
                      </button>
                      <button 
                        onClick={() => {
                          goBackMenu();
                          try { audioSynth.playValidationSuccess(); } catch(e) {}
                        }}
                        className="px-5 py-2.5 bg-[#111111] border border-zinc-700 hover:border-zinc-500 text-white rounded-xl text-[10px] font-mono uppercase tracking-wider font-bold transition-all active:scale-95 flex items-center gap-2"
                      >
                         Retour
                      </button>
                    </div>`;

// Remove old action buttons
const oldActionsRegex = /\s*\{\/\* BOUTONS D'ACTIONS RÉELS \*\/\}\s*<div className="flex flex-wrap items-center justify-center gap-3 pt-4">[\s\S]*?<\/button>\s*<\/div>/;
content = content.replace(oldActionsRegex, '');

// Insert new action buttons under "TABLEAU DE RÉPUTATION"
const repTableEnd = `                        </strong>\n                      </div>\n                    </div>`;
content = content.replace(repTableEnd, repTableEnd + actionButtons);

fs.writeFileSync('src/components/AdminCentre.tsx', content);
console.log("Moved action buttons.");
