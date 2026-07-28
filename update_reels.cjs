const fs = require('fs');
const content = fs.readFileSync('src/components/UserTerrainLandingPage.tsx', 'utf8');

const startTag = '      ) : (';
const endTag = '      )}';

const startIndex = content.indexOf(startTag);
if (startIndex === -1) throw new Error("Start tag not found");

// Find the NEXT endTag after startIndex
const endIndex = content.indexOf(endTag, startIndex);
if (endIndex === -1) throw new Error("End tag not found");

const before = content.substring(0, startIndex + startTag.length);
const after = content.substring(endIndex);

const newReels = `
        <ReelsPlayer 
          posts={posts} 
          onClose={() => {
            setCurrentSection("home");
            try { audioSynth?.playValidationSuccess(); } catch(_) {}
          }}
          onOpenCreate={() => setActiveQuickActionModal("post_content")}
        />
`;

fs.writeFileSync('src/components/UserTerrainLandingPage.tsx', before + newReels + after);
console.log("Updated!");
