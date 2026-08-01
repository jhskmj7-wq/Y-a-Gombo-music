const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  '  if (showCinematicIntro) {',
  `  const isSuperUser = SecurityService.isFounder(currentUser) || SecurityService.isAdmin(currentUser);
  if (platformStatus?.status === "maintenance" && !isSuperUser) {
    return <MaintenanceScreen message="L'application est actuellement en maintenance. Veuillez patienter." />;
  }

  if (showCinematicIntro) {`
);
fs.writeFileSync('src/App.tsx', code);
