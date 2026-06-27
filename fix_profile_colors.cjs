const fs = require('fs');
let content = fs.readFileSync('src/components/GomboProfile.tsx', 'utf-8');

content = content.replace(/bg-orange-600/g, 'bg-[#B48F17]');
content = content.replace(/hover:bg-orange-600/g, 'hover:bg-[#B48F17]');

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
content = content.replace(/text-gray-700/g, 'text-[#B9B9B9]');

fs.writeFileSync('src/components/GomboProfile.tsx', content);
console.log("Colors updated.");
