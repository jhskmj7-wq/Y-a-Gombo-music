const fs = require('fs');
let content = fs.readFileSync('src/components/AdminCentre.tsx', 'utf-8');

const parcoursOriginal = `{/* MON PARCOURS (STATS + TIMELINE) */}
                      <div className="p-6 bg-[#050505] border border-zinc-900/80 rounded-3xl space-y-6">
                        <h3 className="text-[11px] font-mono font-bold tracking-widest text-[#D4AF37] uppercase flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                          Mon Parcours
                        </h3>

                        {/* Stats block inside Mon Parcours */}
                        <div className="grid grid-cols-2 gap-3 text-left">
                          <div className="p-3 bg-[#111111] border border-zinc-900 rounded-xl space-y-1">
                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Date d'arrivée</span>
                            <strong className="text-xs font-sans font-black text-white block">
                              {currentArtist.registrationDate ? new Date(currentArtist.registrationDate).toLocaleDateString('fr-FR') : "26 Juin 2026"}
                            </strong>
                          </div>
                          <div className="p-3 bg-[#111111] border border-zinc-900 rounded-xl space-y-1">
                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Opportunités rejointes</span>
                            <strong className="text-xs font-sans font-black text-[#D4AF37] block">
                              {currentArtist.concertsCount || 0}
                            </strong>
                          </div>
                          <div className="p-3 bg-[#111111] border border-zinc-900 rounded-xl space-y-1">
                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Candidatures</span>
                            <strong className="text-xs font-sans font-black text-white block">
                              {currentArtist.premiumApplicationsCount || currentArtist.collabsCount || 0}
                            </strong>
                          </div>
                          <div className="p-3 bg-[#111111] border border-zinc-900 rounded-xl space-y-1">
                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Projets terminés</span>
                            <strong className="text-xs font-sans font-black text-[#D4AF37] block">
                              {currentArtist.gombosCompleted || 0}
                            </strong>
                          </div>
                        </div>
                        
                        {/* Timeline */}
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#D4AF37]/50 before:to-transparent pt-4">
                          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-4 h-4 rounded-full border border-[#D4AF37] bg-[#050505] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ml-0.5 md:ml-0"></div>
                            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-xl bg-[#111111] border border-zinc-800 shadow">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-sans font-bold text-white text-[10px] uppercase">Début musical</h4>
                                <span className="font-mono text-[8px] text-[#D4AF37]">{currentArtist.registrationDate ? new Date(currentArtist.registrationDate).getFullYear() : 2026}</span>
                              </div>
                            </div>
                          </div>
                          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            <div className="flex items-center justify-center w-4 h-4 rounded-full border border-zinc-700 bg-[#050505] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ml-0.5 md:ml-0"></div>
                            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-xl border border-dashed border-zinc-800 opacity-60">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-sans font-bold text-white text-[10px] uppercase">Grand Live</h4>
                                <span className="font-mono text-[8px] text-zinc-500">À venir</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>`;

const parcoursNouveau = `{/* MON PARCOURS (TIMELINE) */}
                      <div className="p-6 bg-[#050505] border border-[#D4AF37]/20 rounded-3xl space-y-6 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                        <h3 className="text-xs font-sans font-black tracking-widest text-white uppercase flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                          Parcours Musical
                        </h3>

                        {/* Timeline */}
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#D4AF37] before:to-[#D4AF37]/10 pt-4">
                          
                          {/* Débuts */}
                          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-[#D4AF37] bg-[#050505] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ml-0.5 md:ml-0"></div>
                            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-2xl bg-[#111111] border border-[#D4AF37]/20 shadow hover:border-[#D4AF37]/50 transition-colors">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-sans font-black text-white text-[11px] uppercase">Débuts artistiques</h4>
                                <span className="font-mono font-bold text-[9px] text-[#D4AF37]">{currentArtist.registrationDate ? new Date(currentArtist.registrationDate).getFullYear() : "2022"}</span>
                              </div>
                              <p className="text-[10px] font-sans text-[#B9B9B9] mt-2">Lancement de la carrière et premières scènes locales.</p>
                            </div>
                          </div>

                          {/* Projets */}
                          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-[#D4AF37] bg-[#050505] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ml-0.5 md:ml-0"></div>
                            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-2xl bg-[#111111] border border-[#D4AF37]/20 shadow hover:border-[#D4AF37]/50 transition-colors">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-sans font-black text-white text-[11px] uppercase">Projets Majeurs</h4>
                                <span className="font-mono font-bold text-[9px] text-[#D4AF37]">En cours</span>
                              </div>
                              <p className="text-[10px] font-sans text-[#B9B9B9] mt-2">Réalisation de {currentArtist.gombosCompleted || 5} projets studio et scènes.</p>
                            </div>
                          </div>

                          {/* Événements */}
                          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-[#D4AF37] bg-[#050505] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ml-0.5 md:ml-0"></div>
                            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-2xl bg-[#111111] border border-[#D4AF37]/20 shadow hover:border-[#D4AF37]/50 transition-colors">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-sans font-black text-white text-[11px] uppercase">Événements Live</h4>
                                <span className="font-mono font-bold text-[9px] text-[#D4AF37]">Concerts</span>
                              </div>
                              <p className="text-[10px] font-sans text-[#B9B9B9] mt-2">Participation à {currentArtist.concertsCount || 3} événements majeurs.</p>
                            </div>
                          </div>

                          {/* Collaborations */}
                          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-[#D4AF37] bg-[#050505] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ml-0.5 md:ml-0"></div>
                            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-2xl bg-[#111111] border border-[#D4AF37]/20 shadow hover:border-[#D4AF37]/50 transition-colors">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-sans font-black text-white text-[11px] uppercase">Collaborations</h4>
                                <span className="font-mono font-bold text-[9px] text-[#D4AF37]">Réseau</span>
                              </div>
                              <p className="text-[10px] font-sans text-[#B9B9B9] mt-2">{currentArtist.collabsCount || 2} collaborations avec d'autres artistes.</p>
                            </div>
                          </div>

                        </div>
                      </div>`;

content = content.replace(parcoursOriginal, parcoursNouveau);
fs.writeFileSync('src/components/AdminCentre.tsx', content);
console.log("Updated Parcours in AdminCentre.");
