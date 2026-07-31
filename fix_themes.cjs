const fs = require('fs');
const path = require('path');

const classMap = {
  // Backgrounds - Base
  'bg-black': 'bg-afri-bg',
  'bg-[#000]': 'bg-afri-bg',
  'bg-[#000000]': 'bg-afri-bg',
  'bg-[#050505]': 'bg-afri-bg',
  'bg-[#111]': 'bg-afri-bg',
  'bg-zinc-950': 'bg-afri-bg',
  'bg-neutral-950': 'bg-afri-bg',
  'bg-gray-950': 'bg-afri-bg',
  
  // Backgrounds - Secondary / Surface
  'bg-zinc-900': 'bg-afri-bg-sec',
  'bg-zinc-900/90': 'bg-afri-bg-sec',
  'bg-zinc-900/50': 'bg-afri-bg-sec',
  'bg-zinc-900/30': 'bg-afri-bg-sec',
  'bg-[#111111]': 'bg-afri-bg-sec',
  'bg-[#121212]': 'bg-afri-bg-sec',
  'bg-[#181818]': 'bg-afri-bg-sec',
  'bg-neutral-900': 'bg-afri-bg-sec',
  'bg-stone-900': 'bg-afri-bg-sec',
  'bg-slate-900': 'bg-afri-bg-sec',
  'bg-gray-900': 'bg-afri-bg-sec',

  // Backgrounds - Tertiary / Card
  'bg-zinc-800': 'bg-afri-bg-ter',
  'bg-zinc-850': 'bg-afri-bg-ter',
  'bg-neutral-800': 'bg-afri-bg-ter',
  'bg-gray-800': 'bg-afri-bg-ter',
  
  // Text - Primary
  'text-white': 'text-afri-text',
  'text-zinc-50': 'text-afri-text',
  'text-zinc-100': 'text-afri-text',
  'text-zinc-200': 'text-afri-text',
  'text-neutral-50': 'text-afri-text',
  'text-gray-50': 'text-afri-text',
  'text-gray-100': 'text-afri-text',
  'text-gray-200': 'text-afri-text',
  
  // Text - Secondary
  'text-zinc-300': 'text-afri-text-sec',
  'text-zinc-400': 'text-afri-text-sec',
  'text-gray-300': 'text-afri-text-sec',
  'text-gray-400': 'text-afri-text-sec',
  'text-neutral-400': 'text-afri-text-sec',
  
  // Text - Muted
  'text-zinc-500': 'text-afri-text-muted',
  'text-gray-500': 'text-afri-text-muted',
  'text-neutral-500': 'text-afri-text-muted',
  
  // Borders
  'border-black': 'border-afri-border',
  'border-zinc-950': 'border-afri-border',
  'border-zinc-900': 'border-afri-border',
  'border-zinc-800': 'border-afri-border',
  'border-zinc-700': 'border-afri-border',
  'border-neutral-800': 'border-afri-border',
  'border-gray-800': 'border-afri-border',
  'border-gray-700': 'border-afri-border',
  'border-white/5': 'border-afri-border',
  'border-white/10': 'border-afri-border',
  'border-white/20': 'border-afri-border',
  
  // Dividers
  'divide-zinc-900': 'divide-afri-border',
  'divide-zinc-800': 'divide-afri-border',
  'divide-zinc-700': 'divide-afri-border',
  'divide-gray-800': 'divide-afri-border',
  'divide-white/10': 'divide-afri-border',
  
  // Rings
  'ring-zinc-900': 'ring-afri-border',
  'ring-zinc-800': 'ring-afri-border'
};

function processContent(content) {
  let newContent = content;
  
  // A much safer way: split the entire content by regex that matches non-word characters (including spaces, quotes, `<`)
  // Wait, no. Just string replacements for all possible boundaries.
  // The boundaries we care about are: ` `, `'`, `"`, `\``, `<`, `>`, `\n`, `\r`, `\t`
  const boundaries = [' ', "'", '"', '`', '<', '>', '\n', '\r', '\t', ':', '{', '}'];
  
  const entries = Object.entries(classMap);
  for (const [search, replace] of entries) {
    // Replace where search is surrounded by boundaries
    // We can use a simple regex without lookbehind
    const escaped = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`([\\s'"\`<>\\n\\r\\t:{}])(${escaped})([\\s'"\`<>\\n\\r\\t:{}])`, 'g');
    newContent = newContent.replace(regex, `$1${replace}$3`);
    
    // Run it twice to handle overlapping boundaries e.g. "bg-black text-white" sharing a space boundary
    newContent = newContent.replace(regex, `$1${replace}$3`);
  }
  
  // Also check for inline styles
  newContent = newContent.replace(/color:\s*['"](?:#000|#000000|#FFF|#FFFFFF|white|black)['"]/gi, 'color: "var(--afri-text)"');
  newContent = newContent.replace(/backgroundColor:\s*['"](?:#000|#000000|#111|#111111|#121212|#181818|black)['"]/gi, 'backgroundColor: "var(--afri-bg)"');
  
  return newContent;
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
      const originalContent = content;
      
      content = processContent(content);
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        modifiedFiles.push(fullPath);
      }
    }
  }
  return modifiedFiles;
}

const modified = processDirectory('./src');
console.log(`Modified ${modified.length} files:`);
console.log(modified.join('\n'));
