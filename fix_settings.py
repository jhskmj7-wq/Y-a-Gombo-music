import re

filepath = 'src/components/SettingsModal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Add the Zone Fondateur
zone_fondateur = """        </div>

        {/* 10.5 ZONE FONDATEUR */}
        {(profile?.isFounder || profile?.role === "admin" || profile?.role === "founder") && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 space-y-3.5 text-left shadow-[0_0_20px_rgba(212,175,55,0.05)] mt-4">
            <h2 className="text-[10px] font-mono font-bold tracking-widest text-amber-500 uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Zone Fondateur
            </h2>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => {
                  try { audioSynth.playValidationSuccess(); } catch (_) {}
                  if (onNavigateToFounder) {
                    onClose();
                    onNavigateToFounder();
                  }
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500/30 text-amber-500 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4" />
                  <span className="text-[11px] font-black uppercase tracking-wider">Centre de Commandement</span>
                </div>
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        )}

        {/* 11. VERSION DE L'APPLICATION */}"""

content = content.replace('        </div>\n\n        {/* 11. VERSION DE L\'APPLICATION */}', zone_fondateur)

with open(filepath, 'w') as f:
    f.write(content)
