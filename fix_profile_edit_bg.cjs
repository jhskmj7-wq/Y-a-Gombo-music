const fs = require('fs');
let content = fs.readFileSync('src/components/GomboProfileEditView.tsx', 'utf-8');

// The inputs in GomboProfileEditView.tsx
content = content.replace(/bg-gray-50 dark:bg-gray-850/g, 'bg-[#161616]');
content = content.replace(/border-gray-100 dark:border-gray-800/g, 'border-[#D4AF37]/25');
content = content.replace(/border-gray-100/g, 'border-[#D4AF37]/25');
content = content.replace(/bg-gray-50/g, 'bg-[#161616]');

// Save it back
fs.writeFileSync('src/components/GomboProfileEditView.tsx', content);
console.log("GomboProfileEditView background fixed.");
