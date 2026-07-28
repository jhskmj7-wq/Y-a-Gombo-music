const fs = require('fs');
const content = fs.readFileSync('src/components/UserTerrainLandingPage.tsx', 'utf8');

const targetLine = `      ) : (
        <div className="space-y-4 animate-fadeIn pb-12 select-none text-left">
          {/* Reels Filter categories */}`;
const startIndex = content.indexOf(targetLine);
if (startIndex === -1) throw new Error("Target line not found");

// find next `)}` that matches this.
// since we know it ends right before `      {/* ==========================================`
const endMarker = `      {/* ==========================================
          6. SÉCURITÉ ET COPYRIGHT FOOTER`;

const endIndex = content.indexOf(endMarker, startIndex);
if (endIndex === -1) throw new Error("End marker not found");

const before = content.substring(0, startIndex);
const after = content.substring(endIndex);

const newReels = `      ) : (
        <ReelsPlayer 
          posts={posts} 
          onClose={() => {
            setCurrentSection("home");
            try { audioSynth?.playValidationSuccess(); } catch(_) {}
          }}
          onOpenCreate={() => setActiveQuickActionModal("post_content")}
        />
      )}

`;

fs.writeFileSync('src/components/UserTerrainLandingPage.tsx', before + newReels + after);
console.log("Updated!");
