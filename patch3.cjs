const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminSuperFounderHub.tsx', 'utf8');
code = code.replace(
  'const AdminDecouvertesCentre = lazyWithRetry(() => import("./AdminDecouvertesCentre"));',
  'const AdminDecouvertesCentre = lazyWithRetry(() => import("./AdminDecouvertesCentre"));\nconst AdminCagnottes = lazyWithRetry(() => import("./AdminCagnottes"));'
);
code = code.replace(
  '<AdminDecouvertesCentre audioSynth={audioSynth} />',
  '<AdminCagnottes audioSynth={audioSynth} />'
);
fs.writeFileSync('src/components/admin/AdminSuperFounderHub.tsx', code);
