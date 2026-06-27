const fs = require('fs');
let content = fs.readFileSync('src/components/GomboProfileEditView.tsx', 'utf-8');

// Replace card backgrounds
content = content.replace(/bg-white dark:bg-\[\#121214\]/g, 'bg-[#050505]');
content = content.replace(/bg-white dark:bg-\[\#1A1A1F\]/g, 'bg-[#111111]');
content = content.replace(/bg-white dark:bg-zinc-900/g, 'bg-[#111111]');
content = content.replace(/hover:bg-zinc-50 dark:hover:bg-zinc-800/g, 'hover:bg-[#D4AF37]/10');
content = content.replace(/text-zinc-600 dark:text-zinc-400/g, 'text-white');

// Let's also check for label text colors that might be bad.
// Previously I did `text-gray-500` -> `text-[#B9B9B9]` in GomboProfile.tsx, but I need to do it here too.
content = content.replace(/text-gray-900/g, 'text-white');
content = content.replace(/dark:text-white/g, 'text-white');
content = content.replace(/text-gray-800/g, 'text-white');
content = content.replace(/text-gray-700/g, 'text-[#B9B9B9]');
content = content.replace(/text-gray-600/g, 'text-[#B9B9B9]');
content = content.replace(/text-gray-500/g, 'text-[#B9B9B9]');
content = content.replace(/text-gray-400/g, 'text-[#B9B9B9]');
content = content.replace(/dark:text-gray-500/g, 'text-[#B9B9B9]');
content = content.replace(/dark:text-gray-400/g, 'text-[#B9B9B9]');
content = content.replace(/dark:text-gray-300/g, 'text-[#B9B9B9]');
content = content.replace(/text-gray-300/g, 'text-[#B9B9B9]');

fs.writeFileSync('src/components/GomboProfileEditView.tsx', content);
console.log("GomboProfileEditView cards fixed.");
