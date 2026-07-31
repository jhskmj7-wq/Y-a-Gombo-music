const fs = require('fs');
const path = require('path');

const classesToReplace = {
  // Backgrounds - Base
  'bg-black': 'bg-afri-bg',
  'bg-[#000]': 'bg-afri-bg',
  'bg-[#000000]': 'bg-afri-bg',
  'bg-[#111]': 'bg-afri-bg',
  'bg-zinc-950': 'bg-afri-bg',
  'bg-neutral-950': 'bg-afri-bg',
  
  // Backgrounds - Secondary / Surface
  'bg-zinc-900': 'bg-afri-bg-sec',
  'bg-[#111111]': 'bg-afri-bg-sec',
  'bg-[#121212]': 'bg-afri-bg-sec',
  'bg-[#181818]': 'bg-afri-bg-sec',
  'bg-neutral-900': 'bg-afri-bg-sec',
  'bg-stone-900': 'bg-afri-bg-sec',
  'bg-slate-900': 'bg-afri-bg-sec',

  // Backgrounds - Tertiary / Card
  'bg-zinc-800': 'bg-afri-bg-ter',
  'bg-zinc-850': 'bg-afri-bg-ter',
  'bg-neutral-800': 'bg-afri-bg-ter',
  
  // Text - Primary
  'text-white': 'text-afri-text',
  'text-zinc-50': 'text-afri-text',
  'text-zinc-100': 'text-afri-text',
  'text-zinc-200': 'text-afri-text',
  'text-neutral-50': 'text-afri-text',
  
  // Text - Secondary
  'text-zinc-300': 'text-afri-text-sec',
  'text-zinc-400': 'text-afri-text-sec',
  'text-gray-400': 'text-afri-text-sec',
  'text-neutral-400': 'text-afri-text-sec',
  
  // Text - Muted
  'text-zinc-500': 'text-afri-text-muted',
  'text-gray-500': 'text-afri-text-muted',
  
  // Borders
  'border-zinc-900': 'border-afri-border',
  'border-zinc-800': 'border-afri-border',
  'border-zinc-700': 'border-afri-border',
  'border-neutral-800': 'border-afri-border',
  'border-white/5': 'border-afri-border',
  'border-white/10': 'border-afri-border',
  'border-white/20': 'border-afri-border',
  
  // Dividers
  'divide-zinc-900': 'divide-afri-border',
  'divide-zinc-800': 'divide-afri-border',
  'divide-zinc-700': 'divide-afri-border',
  'divide-white/10': 'divide-afri-border'
};

const regexes = [];
for (const [key, value] of Object.entries(classesToReplace)) {
  // We want to match whole words for classes. 
  // We need to handle characters like [ # / ] in regex.
  const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  // Positive lookbehind for space, quote, or backtick.
  // Positive lookahead for space, quote, backtick.
  // Or word boundaries if it's alphanumeric.
  const regex = new RegExp(`(?<=['"\`\\s]|className=\\{?\`?.*)${escapedKey}(?=['"\`\\s])`, 'g');
  regexes.push({ regex, value, key });
}

function processDirectory(dir, modifiedFiles = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath, modifiedFiles);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const { regex, value, key } of regexes) {
        content = content.replace(regex, value);
      }
      
      // Also catch arbitrary colors in style={{ backgroundColor: "#000" }} etc.
      // But user said "Tous les composants doivent utiliser uniquement le système de thème déjà existant."
      // Let's replace style={{ backgroundColor: "#000" }} -> className="bg-afri-bg" where possible, or just leave it for now and see if we have many inline styles.

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        modifiedFiles.push(fullPath);
      }
    }
  }
  return modifiedFiles;
}

const modified = processDirectory('./src');
console.log(`Modified ${modified.length} files.`);
