const fs = require('fs');
const content = fs.readFileSync('src/components/AdminCentre.tsx', 'utf8');
const lines = content.split('\n');
let insideComponent = false;
let earlyReturnFound = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.match(/export default function AdminCentre/)) {
    insideComponent = true;
  }
  if (insideComponent && line.match(/^\s*if\s*\(.*return/)) {
    earlyReturnFound = true;
    console.log(`Early return at line ${i + 1}: ${line.trim()}`);
  }
  if (insideComponent && earlyReturnFound && line.match(/\buse[A-Z]\w*(<[^>]+>)?\s*\(/)) {
    console.log(`HOOK AFTER EARLY RETURN! Line ${i + 1}: ${line.trim()}`);
  }
}
