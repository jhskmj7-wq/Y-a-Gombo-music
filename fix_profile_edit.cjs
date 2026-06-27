const fs = require('fs');
let content = fs.readFileSync('src/components/GomboProfileEditView.tsx', 'utf-8');

// The inputs in GomboProfileEditView.tsx
content = content.replace(/bg-gray-50 dark:bg-gray-800\/40 border border-gray-100 dark:border-gray-800/g, 'bg-[#161616] border border-[#D4AF37]/25');
content = content.replace(/bg-gray-50 dark:bg-gray-800\/40 border border-gray-100 dark:border-gray-805/g, 'bg-[#161616] border border-[#D4AF37]/25');
content = content.replace(/dark:text-white text-black/g, 'text-[#FFFFFF] placeholder-[#A9A9A9]');
content = content.replace(/text-black dark:text-white/g, 'text-[#FFFFFF] placeholder-[#A9A9A9]');
content = content.replace(/focus:ring-1 focus:ring-\[\#D4AF37\]/g, 'focus:border-[#D4AF37] focus:shadow-[0_0_12px_rgba(212,175,55,0.3)] focus:ring-0');
content = content.replace(/focus:ring-1 focus:ring-orange-500/g, 'focus:border-[#D4AF37] focus:shadow-[0_0_12px_rgba(212,175,55,0.3)] focus:ring-0');

// Fix textareas as well
content = content.replace(/bg-gray-50 dark:bg-gray-800\/40/g, 'bg-[#161616]');
content = content.replace(/border-gray-100 dark:border-gray-800/g, 'border-[#D4AF37]/25');

// Save it back
fs.writeFileSync('src/components/GomboProfileEditView.tsx', content);
console.log("GomboProfileEditView updated.");
