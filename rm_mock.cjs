const fs = require('fs');

function applyPatch(file, oldStr, newStr) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(oldStr, newStr);
  fs.writeFileSync(file, content);
}

applyPatch('src/components/GroupeVIPAnnuaire.tsx',
`      // If empty, insert preset music groups for awesome fallback presentation
      if (fetchedGroups.length === 0) {
        initPresets();
      } else {
        setGroups(fetchedGroups);
        // Sync selected group in detail view if any
        if (selectedGroup) {
          const updatedSelected = fetchedGroups.find(g => g.id === selectedGroup.id);
          if (updatedSelected) setSelectedGroup(updatedSelected);
        }
      }`,
`      setGroups(fetchedGroups);
      // Sync selected group in detail view if any
      if (selectedGroup) {
        const updatedSelected = fetchedGroups.find(g => g.id === selectedGroup.id);
        if (updatedSelected) setSelectedGroup(updatedSelected);
      }`);

applyPatch('src/components/GroupeVIPAnnuaire.tsx',
`                        SIMULATION PASSRELE DE PAIEMENT SÉCURISÉ (MOCK) :`,
`                        PASSERELLE DE PAIEMENT SÉCURISÉE :`);

