const fs = require('fs');
let content = fs.readFileSync('src/components/SettingsModal.tsx', 'utf-8');

// The palette: #050505, #111111, #D4AF37, #FFD95A, #FFFFFF, #B9B9B9
content = content.replace(/bg-white/g, 'bg-[#050505]');
content = content.replace(/dark:bg-\[\#111113\]/g, 'bg-[#050505]');
content = content.replace(/bg-gray-50\/50/g, 'bg-[#111111]');
content = content.replace(/dark:bg-gray-950\/20/g, 'bg-[#111111]');
content = content.replace(/bg-gray-100\/60/g, 'bg-[#D4AF37]\/10');
content = content.replace(/dark:bg-gray-900\/40/g, 'bg-[#D4AF37]\/10');
content = content.replace(/bg-gray-100/g, 'bg-[#111111]');
content = content.replace(/dark:bg-gray-800/g, 'bg-[#111111]');
content = content.replace(/bg-orange-500/g, 'bg-[#D4AF37]');
content = content.replace(/bg-orange-600/g, 'bg-[#B48F17]');
content = content.replace(/bg-\[\#0b0b0c\]/g, 'bg-[#111111]');

content = content.replace(/text-gray-900/g, 'text-white');
content = content.replace(/dark:text-white/g, 'text-white');
content = content.replace(/text-gray-800/g, 'text-white');
content = content.replace(/text-gray-600/g, 'text-[#B9B9B9]');
content = content.replace(/text-gray-500/g, 'text-[#B9B9B9]');
content = content.replace(/text-gray-400/g, 'text-[#B9B9B9]');
content = content.replace(/dark:text-gray-500/g, 'text-[#B9B9B9]');
content = content.replace(/dark:text-gray-400/g, 'text-[#B9B9B9]');
content = content.replace(/dark:text-gray-300/g, 'text-[#B9B9B9]');
content = content.replace(/text-gray-300/g, 'text-[#B9B9B9]');
content = content.replace(/text-orange-500/g, 'text-[#D4AF37]');
content = content.replace(/dark:text-orange-400/g, 'text-[#D4AF37]');
content = content.replace(/text-orange-600/g, 'text-[#D4AF37]');

content = content.replace(/border-gray-100/g, 'border-[#D4AF37]\/20');
content = content.replace(/dark:border-gray-800/g, 'border-[#D4AF37]\/20');
content = content.replace(/border-gray-150/g, 'border-[#D4AF37]\/20');
content = content.replace(/border-gray-200/g, 'border-[#D4AF37]\/20');
content = content.replace(/border-orange-500/g, 'border-[#D4AF37]');

content = content.replace(/hover:bg-gray-100/g, 'hover:bg-[#D4AF37]\/10');
content = content.replace(/hover:bg-gray-200/g, 'hover:bg-[#D4AF37]\/20');
content = content.replace(/dark:hover:bg-gray-800/g, 'hover:bg-[#D4AF37]\/10');
content = content.replace(/dark:hover:bg-gray-750/g, 'hover:bg-[#D4AF37]\/10');
content = content.replace(/hover:text-gray-900/g, 'hover:text-white');
content = content.replace(/dark:hover:text-white/g, 'hover:text-white');
content = content.replace(/hover:text-gray-800/g, 'hover:text-white');
content = content.replace(/group-hover:text-orange-500/g, 'group-hover:text-[#D4AF37]');

content = content.replace(/shadow-orange-500\/10/g, 'shadow-[#D4AF37]\/20');
content = content.replace(/ring-orange-500\/20/g, 'ring-[#D4AF37]\/20');
content = content.replace(/bg-orange-500\/5/g, 'bg-[#D4AF37]\/10');
content = content.replace(/bg-orange-500\/10/g, 'bg-[#D4AF37]\/10');
content = content.replace(/from-orange-500\/5/g, 'from-[#D4AF37]\/10');

// "zones grises, boutons différents, tailles incohérentes, cadres cassés. Utiliser : cartes arrondies, ombre légère, espacement propre, design noir + or."
content = content.replace(/rounded-xl/g, 'rounded-2xl');
content = content.replace(/rounded-2xl/g, 'rounded-3xl');

fs.writeFileSync('src/components/SettingsModal.tsx', content);
console.log("SettingsModal updated.");
