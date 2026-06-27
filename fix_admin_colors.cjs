const fs = require('fs');
let content = fs.readFileSync('src/components/AdminCentre.tsx', 'utf-8');

content = content.replace(/#0B0B0B/g, '#050505');
content = content.replace(/#090909/g, '#111111');
content = content.replace(/#0b0b0c/g, '#111111');
content = content.replace(/#09090C/g, '#111111');
content = content.replace(/#121214/g, '#111111');
content = content.replace(/#0E0E10/g, '#050505');
content = content.replace(/bg-zinc-950/g, 'bg-[#050505]');
content = content.replace(/bg-zinc-900\/40/g, 'bg-[#111111]');
content = content.replace(/bg-zinc-900/g, 'bg-[#111111]');

fs.writeFileSync('src/components/AdminCentre.tsx', content);
console.log("AdminCentre updated.");
