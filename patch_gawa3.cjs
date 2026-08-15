const fs = require('fs');
let code = fs.readFileSync('src/components/GawaCenter.tsx', 'utf8');

// I need to strip everything after `</AndroidBottomSheet>` down to `); \n }`
// Actually, let's just replace everything after the last </AndroidBottomSheet>
const parts = code.split('</AndroidBottomSheet>');
if (parts.length > 1) {
  // We keep all parts except the very last bit after the last </AndroidBottomSheet>
  // Which should just be `\n    </>\n  );\n}`
  code = parts.slice(0, parts.length - 1).join('</AndroidBottomSheet>') + '</AndroidBottomSheet>\n    </>\n  );\n}\n';
  fs.writeFileSync('src/components/GawaCenter.tsx', code);
}

