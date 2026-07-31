const fs = require('fs');
const path = require('path');

const replacements = [
  // Base Backgrounds
  ['bg-black', 'bg-afri-bg'],
  ['bg-[#000]', 'bg-afri-bg'],
  ['bg-[#000000]', 'bg-afri-bg'],
  ['bg-zinc-950', 'bg-afri-bg'],
  ['bg-neutral-950', 'bg-afri-bg'],
  ['bg-gray-950', 'bg-afri-bg'],
  
  // Secondary Backgrounds
  ['bg-zinc-900', 'bg-afri-bg-sec'],
  ['bg-neutral-900', 'bg-afri-bg-sec'],
  ['bg-gray-900', 'bg-afri-bg-sec'],
  ['bg-stone-900', 'bg-afri-bg-sec'],
  ['bg-[#111]', 'bg-afri-bg-sec'],
  ['bg-[#111111]', 'bg-afri-bg-sec'],
  ['bg-[#121212]', 'bg-afri-bg-sec'],
  ['bg-[#181818]', 'bg-afri-bg-sec'],

  // Tertiary Backgrounds
  ['bg-zinc-800', 'bg-afri-bg-ter'],
  ['bg-zinc-850', 'bg-afri-bg-ter'],
  ['bg-neutral-800', 'bg-afri-bg-ter'],
  ['bg-gray-800', 'bg-afri-bg-ter'],
  ['bg-gray-200', 'bg-afri-bg-ter'],
  ['bg-[#222]', 'bg-afri-bg-ter'],

  // Borders
  ['border-black', 'border-afri-border'],
  ['border-zinc-950', 'border-afri-border'],
  ['border-zinc-900', 'border-afri-border'],
  ['border-zinc-800', 'border-afri-border'],
  ['border-zinc-700', 'border-afri-border'],
  ['border-neutral-800', 'border-afri-border'],
  ['border-gray-800', 'border-afri-border'],
  ['border-gray-200', 'border-afri-border'],
  ['border-gray-100', 'border-afri-border'],
  ['border-[#333]', 'border-afri-border'],

  // Text
  ['text-zinc-50', 'text-afri-text'],
  ['text-zinc-100', 'text-afri-text'],
  ['text-zinc-200', 'text-afri-text'],
  ['text-neutral-50', 'text-afri-text'],
  ['text-gray-50', 'text-afri-text'],
  ['text-[#FFF]', 'text-afri-text'],
  ['text-[#FFFFFF]', 'text-afri-text'],

  // Text Secondary
  ['text-zinc-300', 'text-afri-text-sec'],
  ['text-zinc-400', 'text-afri-text-sec'],
  ['text-neutral-400', 'text-afri-text-sec'],
  ['text-gray-400', 'text-afri-text-sec'],
  ['text-gray-600', 'text-afri-text-sec'],
  ['text-gray-700', 'text-afri-text-sec'],

  // Text Muted
  ['text-zinc-500', 'text-afri-text-muted'],
  ['text-gray-500', 'text-afri-text-muted'],
  ['text-neutral-500', 'text-afri-text-muted'],

  // Dividers
  ['divide-zinc-900', 'divide-afri-border'],
  ['divide-zinc-800', 'divide-afri-border'],
  ['divide-zinc-700', 'divide-afri-border'],

  // Inline styles color
  ['color: "#000"', 'color: "var(--afri-text)"'],
  ['color: "#FFF"', 'color: "var(--afri-text)"'],
  ['color: "#FFFFFF"', 'color: "var(--afri-text)"'],
  ['color: "#000000"', 'color: "var(--afri-text)"'],
  ['color: "black"', 'color: "var(--afri-text)"'],
  ['color: "white"', 'color: "var(--afri-text)"'],
  ['backgroundColor: "#000"', 'backgroundColor: "var(--afri-bg)"'],
  ['backgroundColor: "#000000"', 'backgroundColor: "var(--afri-bg)"'],
  ['backgroundColor: "#111"', 'backgroundColor: "var(--afri-bg-sec)"'],
  ['backgroundColor: "#111111"', 'backgroundColor: "var(--afri-bg-sec)"'],
  ['backgroundColor: "#121212"', 'backgroundColor: "var(--afri-bg-sec)"'],
  ['backgroundColor: "black"', 'backgroundColor: "var(--afri-bg)"'],
];

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function processDirectory(dir, modifiedFiles = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fullPath.includes('node_modules') || fullPath.includes('.git') || fullPath.includes('dist')) continue;
    
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath, modifiedFiles);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const originalContent = content;
      
      for (const [search, replace] of replacements) {
        const isInlineStyle = search.includes(':');
        if (isInlineStyle) {
          content = content.split(search).join(replace);
        } else {
          const regex = new RegExp(`(?<=[\\s"'\\\`:<>]|^)${escapeRegExp(search)}(?=[\\s"'\\\`:<>]|$)`, 'g');
          content = content.replace(regex, replace);
        }
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        modifiedFiles.push(fullPath);
      }
    }
  }
  return modifiedFiles;
}

console.log("=========================================");
console.log("🔍 VÉRIFICATION DES THÈMES EN COURS...");
console.log("=========================================");

const modified = processDirectory('./src');

if (modified.length > 0) {
  console.log(`✅ CORRECTION AUTOMATIQUE APPLIQUÉE : ${modified.length} composants mis à jour.`);
  console.log("Les couleurs dures ont été remplacées par les variables de thème (afri-bg, afri-text, etc).");
  console.log("Fichiers corrigés :");
  modified.forEach(f => console.log(` - ${f}`));
} else {
  console.log("✅ PARFAIT : Aucune couleur dure détectée. Le thème dynamique est respecté à 100%.");
}
console.log("=========================================");
