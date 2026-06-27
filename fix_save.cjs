const fs = require('fs');
let content = fs.readFileSync('src/components/GomboProfile.tsx', 'utf-8');

const oldSave = `      setTimeout(() => {
        setPanelView("main");
        onNavigateView("dashboard");
        setEditLoading(false);
      }, 1200);`;

const newSave = `      setTimeout(() => {
        setEditLoading(false);
        if (initialPanelView === "edit") {
          onNavigateView("heritage");
        } else {
          setPanelView("main");
        }
      }, 1200);`;

content = content.replace(oldSave, newSave);
fs.writeFileSync('src/components/GomboProfile.tsx', content);
console.log("Fixed save in GomboProfile.");
