const fs = require('fs');
let content = fs.readFileSync('src/components/GomboProfile.tsx', 'utf-8');

const oldCancel = `          onCancel={() => {
            setPanelView("main");
            // If in setup mode (initialPanelView === 'edit'), allow entering the app immediately
            if (initialPanelView === "edit") {
              onNavigateView("dashboard");
            }
          }}`;

const newCancel = `          onCancel={() => {
            if (initialPanelView === "edit") {
              onNavigateView("back");
            } else {
              setPanelView("main");
            }
          }}`;

content = content.replace(oldCancel, newCancel);
fs.writeFileSync('src/components/GomboProfile.tsx', content);
console.log("Fixed onCancel in GomboProfile.");
