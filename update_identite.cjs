const fs = require('fs');
let content = fs.readFileSync('src/components/AdminCentre.tsx', 'utf-8');

const idOriginal = `{/* IDENTITÉ MUSICALE */}
                      <div className="p-6 bg-[#050505] border border-zinc-900/80 rounded-3xl space-y-4">
                        <h3 className="text-[11px] font-mono font-bold tracking-widest text-[#D4AF37] uppercase flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                          Identité Musicale
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center border-b border-zinc-900/50 pb-2">
                            <span className="text-[11px] font-mono text-zinc-500 uppercase">Style principal</span>
                            <span className="text-xs font-sans font-black text-white uppercase">{currentArtist.specialties?.[0] || "Afrobeat"}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-zinc-900/50 pb-2">
                            <span className="text-[11px] font-mono text-zinc-500 uppercase">Instruments joués</span>
                            <span className="text-xs font-sans font-black text-white uppercase text-right max-w-[60%]">{currentArtist.specialties?.slice(1).join(', ') || "Voix, Percussions"}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-zinc-900/50 pb-2">
                            <span className="text-[11px] font-mono text-zinc-500 uppercase">Ville d'opération</span>
                            <span className="text-xs font-sans font-black text-white uppercase">{currentArtist.commune || "Abidjan"}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-zinc-900/50 pb-2">
                            <span className="text-[11px] font-mono text-zinc-500 uppercase">Niveau de performance</span>
                            <span className="text-xs font-sans font-black text-[#D4AF37] uppercase">Elite (Niv. {currentArtist.performance?.level || 4})</span>
                          </div>
                          <div className="flex justify-between items-center pb-1">
                            <span className="text-[11px] font-mono text-zinc-500 uppercase">Disponibilité</span>
                            <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                              Immédiate
                            </span>
                          </div>
                        </div>
                      </div>`;

const idNouveau = `{/* IDENTITÉ MUSICALE */}
                      <div className="p-6 bg-[#050505] border border-[#D4AF37]/20 rounded-3xl space-y-6 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                        <h3 className="text-xs font-sans font-black tracking-widest text-white uppercase flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                          Identité Musicale
                        </h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center border-b border-[#D4AF37]/10 pb-3">
                            <span className="text-[10px] font-sans font-black text-[#B9B9B9] uppercase">Styles musicaux</span>
                            <span className="text-[11px] font-sans font-black text-[#D4AF37] uppercase text-right">{currentArtist.musicGenres?.join(', ') || "Afrobeat, Coupé-Décalé"}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-[#D4AF37]/10 pb-3">
                            <span className="text-[10px] font-sans font-black text-[#B9B9B9] uppercase">Instruments</span>
                            <span className="text-[11px] font-sans font-black text-white uppercase text-right">{currentArtist.specialties?.join(', ') || "Voix, Percussions"}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-[#D4AF37]/10 pb-3">
                            <span className="text-[10px] font-sans font-black text-[#B9B9B9] uppercase">Expérience</span>
                            <span className="text-[11px] font-sans font-black text-white uppercase text-right">{currentArtist.experience || "Professionnel"}</span>
                          </div>
                          <div className="flex justify-between items-center pb-1">
                            <span className="text-[10px] font-sans font-black text-[#B9B9B9] uppercase">Disponibilité</span>
                            <span className="text-[10px] font-sans font-black text-[#050505] bg-[#D4AF37] px-3 py-1 rounded-full uppercase">
                              {currentArtist.availabilityStatus || "Disponible"}
                            </span>
                          </div>
                        </div>
                      </div>`;

content = content.replace(idOriginal, idNouveau);
fs.writeFileSync('src/components/AdminCentre.tsx', content);
console.log("Updated Identite in AdminCentre.");
