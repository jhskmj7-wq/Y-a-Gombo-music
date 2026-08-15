const fs = require('fs');
let code = fs.readFileSync('src/components/GawaCenter.tsx', 'utf8');

const regexToRemove = /        setShowPinModal\(true\);\s*return;\s*\}\s*\} catch \(e\) \{\s*console\.warn\("Could not check wallet security status:", e\);\s*\}\s*\/\/ Direct buy if no security PIN configured\s*executeBuyPack\(pack\);\s*\};\s*const executeBuyPack = async \(pack: GawaPack\) => \{/;

code = code.replace(regexToRemove, "");

fs.writeFileSync('src/components/GawaCenter.tsx', code);
