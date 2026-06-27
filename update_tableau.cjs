const fs = require('fs');
let content = fs.readFileSync('src/components/AdminCentre.tsx', 'utf-8');

// Replace Tableau de Réputation cards
const tableauOriginal = `{/* Honneurs Reçus */}
                      <div className="p-4 bg-[#050505] border border-[#D4AF37]/20 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left hover:border-[#D4AF37]/40 transition-colors">
                        <span className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-2 text-lg">🏆</span>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Honneurs reçus</span>
                        <strong className="text-xl font-sans font-black text-white mt-1">
                          {currentArtist.reviewsCount || 0}
                        </strong>
                      </div>
                      
                      {/* Participations */}
                      <div className="p-4 bg-[#050505] border border-[#D4AF37]/20 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left hover:border-[#D4AF37]/40 transition-colors">
                        <span className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-2 text-lg">🎼</span>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Participations</span>
                        <strong className="text-xl font-sans font-black text-white mt-1">
                          {currentArtist.concertsCount || 0}
                        </strong>
                      </div>

                      {/* Opportunités */}
                      <div className="p-4 bg-[#050505] border border-[#D4AF37]/20 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left hover:border-[#D4AF37]/40 transition-colors">
                        <span className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-2 text-lg">🔥</span>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Opportunités</span>
                        <strong className="text-xl font-sans font-black text-white mt-1">
                          {currentArtist.gombosCompleted || 0}
                        </strong>
                      </div>

                      {/* Collaborations */}
                      <div className="p-4 bg-[#050505] border border-[#D4AF37]/20 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left hover:border-[#D4AF37]/40 transition-colors">
                        <span className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-2 text-lg">🤝</span>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Collaborations</span>
                        <strong className="text-xl font-sans font-black text-white mt-1">
                          {currentArtist.collabsCount || 0}
                        </strong>
                      </div>

                      {/* Niveau Réputation */}
                      <div className="p-4 bg-[#050505] border border-[#D4AF37]/20 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left hover:border-[#D4AF37]/40 transition-colors">
                        <span className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-2 text-lg">⭐</span>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Réputation</span>
                        <strong className="text-xl font-sans font-black text-[#D4AF37] mt-1 flex items-baseline gap-1">
                          {currentArtist.performance?.rating || 5.0} <span className="text-[10px] text-zinc-500">/ 5</span>
                        </strong>
                      </div>

                      {/* Progression */}
                      <div className="p-4 bg-[#050505] border border-[#D4AF37]/20 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left hover:border-[#D4AF37]/40 transition-colors">
                        <span className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-2 text-lg">📈</span>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Progression</span>
                        <strong className="text-xl font-sans font-black text-emerald-400 mt-1 flex items-baseline gap-1">
                          +15%
                        </strong>
                      </div>`;

const tableauNouveau = `{/* Honneurs Reçus */}
                      <div className="p-4 bg-[#050505] border border-[#D4AF37]/20 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left hover:border-[#D4AF37]/40 transition-all hover:scale-105 duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        <span className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-2 text-lg">🏆</span>
                        <span className="text-[10px] font-sans uppercase tracking-widest text-[#B9B9B9] font-black">Honneur reçu</span>
                        <strong className="text-xl font-sans font-black text-white mt-1">
                          {currentArtist.reviewsCount || 0}
                        </strong>
                      </div>
                      
                      {/* Collaborations */}
                      <div className="p-4 bg-[#050505] border border-[#D4AF37]/20 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left hover:border-[#D4AF37]/40 transition-all hover:scale-105 duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        <span className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-2 text-lg">🎼</span>
                        <span className="text-[10px] font-sans uppercase tracking-widest text-[#B9B9B9] font-black">Collaborations</span>
                        <strong className="text-xl font-sans font-black text-white mt-1">
                          {currentArtist.collabsCount || 0}
                        </strong>
                      </div>

                      {/* Renforts */}
                      <div className="p-4 bg-[#050505] border border-[#D4AF37]/20 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left hover:border-[#D4AF37]/40 transition-all hover:scale-105 duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        <span className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-2 text-lg">🪘</span>
                        <span className="text-[10px] font-sans uppercase tracking-widest text-[#B9B9B9] font-black">Renforts</span>
                        <strong className="text-xl font-sans font-black text-white mt-1">
                          {currentArtist.concertsCount || 0}
                        </strong>
                      </div>

                      {/* Opportunités */}
                      <div className="p-4 bg-[#050505] border border-[#D4AF37]/20 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left hover:border-[#D4AF37]/40 transition-all hover:scale-105 duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        <span className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-2 text-lg">🔥</span>
                        <span className="text-[10px] font-sans uppercase tracking-widest text-[#B9B9B9] font-black">Opportunités</span>
                        <strong className="text-xl font-sans font-black text-white mt-1">
                          {currentArtist.gombosCompleted || 0}
                        </strong>
                      </div>

                      {/* Niveau Réputation */}
                      <div className="p-4 bg-[#050505] border border-[#D4AF37]/20 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left hover:border-[#D4AF37]/40 transition-all hover:scale-105 duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        <span className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-2 text-lg">⭐</span>
                        <span className="text-[10px] font-sans uppercase tracking-widest text-[#B9B9B9] font-black">Réputation</span>
                        <strong className="text-xl font-sans font-black text-[#D4AF37] mt-1 flex items-baseline gap-1">
                          {currentArtist.performance?.rating || 5.0} <span className="text-[10px] text-[#B9B9B9]">/ 5</span>
                        </strong>
                      </div>

                      {/* Progression */}
                      <div className="p-4 bg-[#050505] border border-[#D4AF37]/20 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left hover:border-[#D4AF37]/40 transition-all hover:scale-105 duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        <span className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-2 text-lg">📈</span>
                        <span className="text-[10px] font-sans uppercase tracking-widest text-[#B9B9B9] font-black">Progression</span>
                        <strong className="text-xl font-sans font-black text-[#D4AF37] mt-1 flex items-baseline gap-1">
                          +15%
                        </strong>
                      </div>`;

content = content.replace(tableauOriginal, tableauNouveau);

fs.writeFileSync('src/components/AdminCentre.tsx', content);
console.log("Updated Tableau in AdminCentre.");
