const fs = require('fs');

let content = fs.readFileSync('src/components/PublicPages.tsx', 'utf8');

// Replace background colors
content = content.replace(/bg-\[\#0A0516\]/g, 'bg-[#050505]');
content = content.replace(/bg-\[\#120E22\]/g, 'bg-[#111111]');
content = content.replace(/bg-\[\#121214\]/g, 'bg-[#111111]');
content = content.replace(/from-purple-950/g, 'from-[#111111]');
content = content.replace(/via-slate-900/g, 'via-zinc-900');
content = content.replace(/to-\[\#120422\]/g, 'to-[#050505]');

// Replace purple text colors
content = content.replace(/text-\[\#7C3AED\]/g, 'text-[#D4AF37]');
content = content.replace(/dark:text-\[\#A78BFA\]/g, ''); // just remove this to fallback to the previous one, or replace
content = content.replace(/text-\[\#A78BFA\]/g, 'text-[#F5D76E]');
content = content.replace(/dark:hover:text-\[\#A78BFA\]/g, 'dark:hover:text-[#F5D76E]');

content = content.replace(/text-purple-600/g, 'text-[#D4AF37]');
content = content.replace(/dark:text-purple-400/g, 'dark:text-[#F5D76E]');
content = content.replace(/text-purple-300/g, 'text-[#F5D76E]');
content = content.replace(/text-purple-400/g, 'text-[#F5D76E]');

// Replace purple backgrounds
content = content.replace(/bg-purple-100/g, 'bg-[#D4AF37]/10');
content = content.replace(/bg-purple-950\/30/g, 'bg-[#D4AF37]/10');
content = content.replace(/bg-purple-950\/40/g, 'bg-[#D4AF37]/10');
content = content.replace(/bg-purple-950\/10/g, 'bg-[#D4AF37]/5');
content = content.replace(/bg-purple-50\/50/g, 'bg-[#D4AF37]/5');
content = content.replace(/bg-purple-500\/5/g, 'bg-[#D4AF37]/5');
content = content.replace(/bg-purple-500\/20/g, 'bg-[#D4AF37]/20');

// Replace purple borders
content = content.replace(/border-purple-100\/30/g, 'border-[#D4AF37]/20');
content = content.replace(/border-purple-500\/10/g, 'border-[#D4AF37]/10');
content = content.replace(/border-purple-500\/20/g, 'border-[#D4AF37]/20');
content = content.replace(/border-purple-500\/30/g, 'border-[#D4AF37]/30');

// Replace gradients
content = content.replace(/from-\[\#7C3AED\]/g, 'from-[#D4AF37]');
content = content.replace(/to-purple-600/g, 'to-[#B48F17]');
content = content.replace(/hover:from-purple-600/g, 'hover:from-[#B48F17]');
content = content.replace(/hover:to-purple-700/g, 'hover:to-[#9A7A13]');

// Replace other generic specific texts
content = content.replace(/hover:text-\[\#7C3AED\]/g, 'hover:text-[#D4AF37]');

fs.writeFileSync('src/components/PublicPages.tsx', content);
